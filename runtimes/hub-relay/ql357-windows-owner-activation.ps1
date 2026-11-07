# QL-357: original Windows custody/readiness, no unattended enrollment or
# receiver start. Private keys, database URLs and original witness bytes remain
# on their respective original owner accounts.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][switch]$ReviewSigned,
    [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$RequestPath,
    [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$EvidencePathsFile,
    [Parameter(ParameterSetName='PrivateReadback',Mandatory=$true)][switch]$PrivateReadback,
    [Parameter(ParameterSetName='VerifyReceipt',Mandatory=$true)][switch]$VerifyReceipt,
    [Parameter(ParameterSetName='VerifyReceipt',Mandatory=$true)][string]$OriginalPacketPath,
    [Parameter(ParameterSetName='VerifyReceipt',Mandatory=$true)][string]$OwnerReviewPath
)
$ErrorActionPreference='Stop'
$isWindows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)
$ree=$isWindows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$isWindows -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
function Write-Hold($state,$extra=@{}) {
    $result=[ordered]@{
        schema='rosevear.hub.ql357.windows-owner-activation.v1'
        state=$state
        originalReeHost=[bool]$ree
        independentJackHost=[bool]$jack
        originalIssuerIndependentlyAuthenticated=$false
        ownersIndependentlyApproved=$false
        databaseEnrollmentVerified=$false
        authenticatedPrivateOperator=$false
        privateReceiverReady=$false
        signedTestReceiptVerified=$false
        receiverActivated=$false
        customerCommunications=$false
        deviceActions=$false
        sourceRepositoryWrites=0
        connected=$false
        connectionState='DISCONNECTED / HOLD'
    }
    foreach($key in $extra.Keys){$result[$key]=$extra[$key]}
    $result | ConvertTo-Json -Compress -Depth 6
}
if(-not $ree -and -not $jack){
    if($ReviewSigned -or $PrivateReadback -or $VerifyReceipt){
        throw 'DENY_NONORIGINAL_WINDOWS_OWNER_CEREMONY'
    }
    Write-Hold 'HOLD_NONORIGINAL_WINDOWS_CI_HOST_NO_ACTION'
    exit 0
}
$base=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$role=if($ree){'source'}else{'master'}
$candidate=Join-Path $base "OwnerAuthorities\$role\$role.public-candidate.json"
$encryptedKey=Join-Path $base "OwnerAuthorities\$role\$role.private.pem"
$signed=Join-Path $base 'Enrollment\ql340b-signed-test-enrollment.json'
$pins=Join-Path $base 'Enrollment\ql340b-private-owner-public-pins.json'
$credential=Join-Path $base 'Receiver\ql340c-database.dpapi'
$receiver=@()
$lan=@()
$gateway=@()
if($ree){
    $receiver=@(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
    $lan=@(Get-NetTCPConnection -LocalAddress '192.168.68.74' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
    $gateway=@(Get-NetTCPConnection -LocalAddress '100.77.246.3' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
}
if($ReviewSigned -or $PrivateReadback -or $VerifyReceipt){
    if(-not $ree){throw 'DENY_JACK_CANNOT_EXECUTE_ORIGINAL_REE_PRIVATE_ACTION'}
    if($receiver.Count -ne 0){throw 'HOLD_ORIGINAL_RECEIVER_MUST_BE_OFF_FOR_FIELD_READBACK'}
}
if($ReviewSigned){
    if(-not (Test-Path -LiteralPath $RequestPath -PathType Leaf) -or
        -not (Test-Path -LiteralPath $EvidencePathsFile -PathType Leaf)){
        throw 'HOLD_FRESH_SIGNED_REQUEST_AND_FOUR_ORIGINAL_WITNESS_PATHS_REQUIRED'
    }
    # QL-354 verifies real separate Ree/Jack Ed25519 signatures, file bytes,
    # original device key and approved *local* public pin digest; it never
    # substitutes for independent issuer and witness attestation.
    & (Join-Path $PSScriptRoot 'ql354-windows-owner-handoff.ps1') -InspectSigned `
      -RequestPath $RequestPath -EvidencePathsFile $EvidencePathsFile
    if($LASTEXITCODE -ne 0){throw 'HOLD_ORIGINAL_SIGNED_INTAKE_REVIEW_NOT_VERIFIED'}
    exit 0
}
if($PrivateReadback){
    foreach($file in @($credential,$signed,$pins)){
        if(-not (Test-Path -LiteralPath $file -PathType Leaf)){
            throw 'HOLD_APPROVED_PRIVATE_CREDENTIAL_AND_SIGNED_ENROLLMENT_REQUIRED'
        }
    }
    # Uses only Ree-current-user DPAPI and the QL-340C limited receiver role.
    # The existing operator writes an ACL-restricted evidence snapshot. No
    # database role provisioning or receiver activation is performed here.
    & (Join-Path $PSScriptRoot 'ql340c-windows-operator.ps1') -Readback
    if($LASTEXITCODE -ne 0){throw 'HOLD_PRIVATE_LIMITED_DB_READBACK_FAILED'}
    exit 0
}
if($VerifyReceipt){
    foreach($file in @($credential,$signed,$pins,$OriginalPacketPath,$OwnerReviewPath)){
        if(-not (Test-Path -LiteralPath $file -PathType Leaf)){
            throw 'HOLD_GENUINE_ORIGINAL_PACKET_REVIEW_CREDENTIAL_AND_ENROLLMENT_REQUIRED'
        }
    }
    & (Join-Path $PSScriptRoot 'ql340c-windows-operator.ps1') -VerifyOneReceipt `
      -OriginalPacketPath $OriginalPacketPath -OwnerReviewPath $OwnerReviewPath
    if($LASTEXITCODE -ne 0){throw 'HOLD_GENUINE_PRIVATE_SIGNED_RECEIPT_NOT_VERIFIED'}
    exit 0
}
Write-Hold 'ORIGINAL_OWNER_LOCAL_READINESS_READ_ONLY_EXTERNAL_PROOF_STILL_REQUIRED' @{
    computer=$env:COMPUTERNAME
    role=$role
    localPublicCandidatePresent=(Test-Path -LiteralPath $candidate -PathType Leaf)
    localEncryptedSigningKeyPresent=(Test-Path -LiteralPath $encryptedKey -PathType Leaf)
    signedOriginalEnrollmentFilePresent=($ree -and (Test-Path -LiteralPath $signed -PathType Leaf))
    approvedOriginalOwnerPinsFilePresent=($ree -and (Test-Path -LiteralPath $pins -PathType Leaf))
    privateDpapiCredentialFilePresent=($ree -and (Test-Path -LiteralPath $credential -PathType Leaf))
    originalLanListenerCount=$lan.Count
    privateReceiverListenerCount=$receiver.Count
    tailnetGatewayListenerCount=$gateway.Count
    nextAction='Independently authenticate original issuer and witness, then complete separate source/master signed TEST review; never treat file presence as approval.'
}
