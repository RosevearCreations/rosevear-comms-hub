# QL-358: actual Ree/Jack public digest review, signed owner intake handoff,
# limited receiver credential check and one receipt. NO automatic signing,
# database role grant, DPAPI secret import, process start or network send.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='ReviewRequest',Mandatory=$true)][switch]$ReviewRequest,
    [Parameter(ParameterSetName='ReviewRequest',Mandatory=$true)][string]$RequestPath,
    [Parameter(ParameterSetName='ReviewRequest')][string]$EvidencePathsFile,
    [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][switch]$ReviewSigned,
    [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$SignedRequestPath,
    [Parameter(ParameterSetName='ReviewSigned',Mandatory=$true)][string]$SignedEvidencePathsFile,
    [Parameter(ParameterSetName='CredentialHandoff',Mandatory=$true)][switch]$CredentialHandoff,
    [Parameter(ParameterSetName='ReceiverReadback',Mandatory=$true)][switch]$ReceiverReadback,
    [Parameter(ParameterSetName='VerifyReceipt',Mandatory=$true)][switch]$VerifyReceipt,
    [Parameter(ParameterSetName='VerifyReceipt',Mandatory=$true)][string]$OriginalPacketPath,
    [Parameter(ParameterSetName='VerifyReceipt',Mandatory=$true)][string]$OwnerReviewPath
)
$ErrorActionPreference='Stop'
$ql358OnWindows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)
$ql358Ree=$ql358OnWindows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$ql358Jack=$ql358OnWindows -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
function Write-Ql358Hold($state,$extra=@{}) {
    $output=[ordered]@{
        schema='rosevear.hub.ql358.windows-original-field.v1'
        state=$state
        originalReeHost=[bool]$ql358Ree
        independentJackHost=[bool]$ql358Jack
        originalIssuerAuthenticated=$false
        independentWitnessAuthenticated=$false
        ownersIndependentlyApproved=$false
        databaseEnrollmentVerified=$false
        receiverCredentialVerified=$false
        firstPrivateTestReceiptVerified=$false
        receiverActivated=$false
        connected=$false
        connectionState='DISCONNECTED / HOLD'
        customerCommunications=$false
        deviceActions=$false
        sourceRepositoryWrites=0
    }
    foreach($key in $extra.Keys){$output[$key]=$extra[$key]}
    $output | ConvertTo-Json -Compress -Depth 6
}
if(-not $ql358Ree -and -not $ql358Jack){
    if($ReviewRequest -or $ReviewSigned -or $CredentialHandoff -or $ReceiverReadback -or $VerifyReceipt){
        throw 'DENY_QL358_NOT_ORIGINAL_REE_OR_JACK_WINDOWS_ACCOUNT'
    }
    Write-Ql358Hold 'HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY'
    exit 0
}
$ql358Base=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$ql358Role=if($ql358Ree){'source'}else{'master'}
$ql358Candidate=Join-Path $ql358Base "OwnerAuthorities\$ql358Role\$ql358Role.public-candidate.json"
$ql358SigningKey=Join-Path $ql358Base "OwnerAuthorities\$ql358Role\$ql358Role.private.pem"
$ql358Signed=Join-Path $ql358Base 'Enrollment\ql340b-signed-test-enrollment.json'
$ql358Pins=Join-Path $ql358Base 'Enrollment\ql340b-private-owner-public-pins.json'
$ql358Credential=Join-Path $ql358Base 'Receiver\ql340c-database.dpapi'
$ql358Receiver=@()
$ql358Gateway=@()
$ql358Lan=@()
if($ql358Ree){
    $ql358Receiver=@(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
    $ql358Gateway=@(Get-NetTCPConnection -LocalAddress '100.77.246.3' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
    $ql358Lan=@(Get-NetTCPConnection -LocalAddress '192.168.68.74' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
}
if($ql358Ree -and ($ReviewSigned -or $CredentialHandoff -or $ReceiverReadback -or $VerifyReceipt) -and
    $ql358Receiver.Count -ne 0){
    throw 'HOLD_QL358_RECEIVER_MUST_BE_OFF_DURING_FIELD_REVIEW'
}
if($ReviewRequest){
    if(-not (Test-Path -LiteralPath $ql358Candidate -PathType Leaf) -or
       -not (Test-Path -LiteralPath $RequestPath -PathType Leaf)){
        throw 'HOLD_FRESH_UNSIGNED_REQUEST_AND_ORIGINAL_LOCAL_OWNER_PUBLIC_CANDIDATE_REQUIRED'
    }
    if($ql358Ree){
        if([string]::IsNullOrWhiteSpace($EvidencePathsFile) -or
           -not (Test-Path -LiteralPath $EvidencePathsFile -PathType Leaf)){
            throw 'HOLD_REE_MUST_VERIFY_FOUR_ORIGINAL_WITNESS_FILES'
        }
        & node (Join-Path $PSScriptRoot 'ql356-original-field-readback.mjs') --inspect-request `
          source $RequestPath $ql358Candidate $EvidencePathsFile
    }else{
        if($EvidencePathsFile){throw 'DENY_JACK_MUST_NOT_IMPORT_REE_ORIGINAL_WITNESS_FILES'}
        & node (Join-Path $PSScriptRoot 'ql356-original-field-readback.mjs') --inspect-request `
          master $RequestPath $ql358Candidate
    }
    if($LASTEXITCODE -ne 0){throw 'HOLD_PUBLIC_ORIGINAL_REQUEST_NOT_VALIDATED'}
    exit 0
}
if($ReviewSigned){
    if(-not $ql358Ree){throw 'DENY_JACK_CANNOT_VERIFY_REE_ORIGINAL_PRIVATE_WITNESSES'}
    & (Join-Path $PSScriptRoot 'ql357-windows-owner-activation.ps1') -ReviewSigned `
      -RequestPath $SignedRequestPath -EvidencePathsFile $SignedEvidencePathsFile
    if($LASTEXITCODE -ne 0){throw 'HOLD_ORIGINAL_REE_JACK_SIGNED_FIELD_INTAKE_REQUIRED'}
    exit 0
}
if($CredentialHandoff){
    if(-not $ql358Ree){throw 'DENY_ONLY_REE_MAY_ENROLL_CURRENT_USER_DPAPI_RECEIVER_CREDENTIAL'}
    Write-Ql358Hold 'HOLD_EXTERNAL_PIN_CUSTODY_AND_DATABASE_ENROLLMENT_FIRST' @{
        signedEnrollmentFilePresent=(Test-Path -LiteralPath $ql358Signed -PathType Leaf)
        approvedOwnerPinsFilePresent=(Test-Path -LiteralPath $ql358Pins -PathType Leaf)
        dpapiCredentialFilePresent=(Test-Path -LiteralPath $ql358Credential -PathType Leaf)
        nextAction='After independent issuer/witness, both owner signatures, original DB row and separate administrator role provisioning: use the existing ql340c-windows-operator.ps1 -StoreCredential hidden current-user prompt only on Ree. No URL in chat or GitHub.'
    }
    exit 0
}
if($ReceiverReadback -or $VerifyReceipt){
    if(-not $ql358Ree){throw 'DENY_ONLY_REE_CAN_READ_BACK_ORIGINAL_PRIVATE_RECEIVER'}
    foreach($path in @($ql358Signed,$ql358Pins,$ql358Credential)){
        if(-not (Test-Path -LiteralPath $path -PathType Leaf)){
            throw 'HOLD_ORIGINAL_SIGNED_ENROLLMENT_PINS_AND_REE_DPAPI_CREDENTIAL_REQUIRED'
        }
    }
    if($ReceiverReadback){
        & (Join-Path $PSScriptRoot 'ql357-windows-owner-activation.ps1') -PrivateReadback
    }else{
        & (Join-Path $PSScriptRoot 'ql357-windows-owner-activation.ps1') -VerifyReceipt `
          -OriginalPacketPath $OriginalPacketPath -OwnerReviewPath $OwnerReviewPath
    }
    if($LASTEXITCODE -ne 0){throw 'HOLD_ORIGINAL_RESTRICTED_RECEIVER_OR_SIGNED_RECEIPT_NOT_VERIFIED'}
    exit 0
}
Write-Ql358Hold 'ORIGINAL_PUBLIC_KEY_CUSTODY_OBSERVED_AUTHORITY_AND_ENROLLMENT_HOLD' @{
    computer=$env:COMPUTERNAME
    localRole=$ql358Role
    localPublicCandidatePresent=(Test-Path -LiteralPath $ql358Candidate -PathType Leaf)
    localEncryptedSigningKeyPresent=(Test-Path -LiteralPath $ql358SigningKey -PathType Leaf)
    originalSignedEnrollmentPresent=($ql358Ree -and (Test-Path -LiteralPath $ql358Signed -PathType Leaf))
    approvedOwnerPinsPresent=($ql358Ree -and (Test-Path -LiteralPath $ql358Pins -PathType Leaf))
    dedicatedDpapiCredentialPresent=($ql358Ree -and (Test-Path -LiteralPath $ql358Credential -PathType Leaf))
    originalLanListenerCount=$ql358Lan.Count
    originalPrivateReceiverListenerCount=$ql358Receiver.Count
    tailnetGatewayListenerCount=$ql358Gateway.Count
    nextAction='Verify independent original issuer and witness; compare the same fresh public request SHA-256 on Ree and Jack; owners sign separately only after genuine approval.'
}
