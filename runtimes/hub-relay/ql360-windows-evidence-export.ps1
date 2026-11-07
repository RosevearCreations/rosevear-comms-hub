# QL-360: independent original receiver-stop receipt and private six-app export.
# This operator wrapper never signs, grants DB roles, stores a credential,
# starts/stops processes, or exports owner private keys. -ExportPostTest writes
# only the existing QL-341 ACL-protected owner evidence, after real review.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='ShutdownReadback',Mandatory=$true)][switch]$ShutdownReadback,
    [Parameter(ParameterSetName='ShutdownReadback',Mandatory=$true)][string]$StopReceiptPath,
    [Parameter(ParameterSetName='ExportPostTest',Mandatory=$true)][switch]$ExportPostTest,
    [Parameter(ParameterSetName='ExportPostTest',Mandatory=$true)][string]$ExportStopReceiptPath,
    [Parameter(ParameterSetName='ExportPostTest',Mandatory=$true)][string]$OriginalPacketPath,
    [Parameter(ParameterSetName='ExportPostTest',Mandatory=$true)][string]$OwnerReviewPath
)
$ErrorActionPreference='Stop'
$ql360Windows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)
$ql360Ree=$ql360Windows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$ql360Jack=$ql360Windows -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
function Write-Ql360Hold($state,$extra=@{}){
    $result=[ordered]@{
        schema='rosevear.hub.ql360.windows-private-export.v1'
        state=$state
        originalReeHost=[bool]$ql360Ree
        independentJackHost=[bool]$ql360Jack
        originalAuthorityAuthenticated=$false
        verifiedSignedTestReceipt=$false
        archivedOriginalEvidence=$false
        authenticatedIndependentShutdownWitness=$false
        receiverActivated=$false
        connected=$false
        connectionState='DISCONNECTED / HOLD'
        customerCommunications=$false
        deviceActions=$false
        sourceRepositoryWrites=0
    }
    foreach($item in $extra.Keys){$result[$item]=$extra[$item]}
    $result | ConvertTo-Json -Compress -Depth 6
}
if(-not $ql360Ree -and -not $ql360Jack){
    if($ShutdownReadback -or $ExportPostTest){throw 'DENY_QL360_ONLY_ORIGINAL_WINDOWS_OWNER_ACCOUNT'}
    Write-Ql360Hold 'HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY'
    exit 0
}
$ql360Base=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$ql360Role=if($ql360Ree){'source'}else{'master'}
$ql360Evidence=Join-Path $ql360Base 'Evidence'
$ql360Listener=@();$ql360Gateway=@()
if($ql360Ree){
    $ql360Listener=@(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
    $ql360Gateway=@(Get-NetTCPConnection -LocalAddress '100.77.246.3' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
}
function Confirm-Ql360OriginalStop($path){
    if(-not $ql360Ree){throw 'DENY_ONLY_REE_ORIGINAL_SERVER_CAN_EXPORT_PRIVATE_EVIDENCE'}
    if($ql360Listener.Count -ne 0 -or $ql360Gateway.Count -ne 0){
        throw 'HOLD_ORIGINAL_PRIVATE_RECEIVER_AND_TAILNET_GATEWAY_MUST_BE_OFF'
    }
    $resolved=[IO.Path]::GetFullPath($path)
    $directory=[IO.Path]::GetFullPath($ql360Evidence) + [IO.Path]::DirectorySeparatorChar
    if(-not $resolved.StartsWith($directory,[StringComparison]::OrdinalIgnoreCase) -or
        -not (Test-Path -LiteralPath $resolved -PathType Leaf)){
        throw 'DENY_STOP_RECEIPT_MUST_BE_ON_ORIGINAL_REE_EVIDENCE_DIRECTORY'
    }
    $receipt=Get-Content -LiteralPath $resolved -Raw | ConvertFrom-Json
    if($receipt.schema -ne 'rosevear.hub.ql340c.stop-witness.v1' -or
        $receipt.state -ne 'FIELD_STOP_OBSERVED_INDEPENDENT_OWNER_REVIEW_REQUIRED' -or
        $receipt.computer -ine 'DESKTOP-AE894KC' -or
        $receipt.receiverListenerCountAfter -ne 0 -or
        [int]$receipt.stoppedPid -le 0){throw 'DENY_MISSING_GENUINE_ORIGINAL_QL340C_STOP_RECEIPT'}
    $stopped=[DateTimeOffset]::Parse($receipt.capturedAtUTC)
    $age=([DateTimeOffset]::UtcNow - $stopped).TotalSeconds
    if($age -lt -5 -or $age -gt 90){throw 'HOLD_ORIGINAL_STOP_WITNESS_EXPIRED_OR_FUTURE'}
    return $receipt
}
if($ShutdownReadback){
    $receipt=Confirm-Ql360OriginalStop $StopReceiptPath
    Write-Ql360Hold 'ORIGINAL_REE_FRESH_STOP_FILE_AND_ZERO_LISTENERS_OBSERVED_INDEPENDENT_TRUST_STILL_REQUIRED' @{
        originalStoppedPid=$receipt.stoppedPid
        receiverPort=8788
        localListenerCount=$ql360Listener.Count
        tailnetGatewayListenerCount=$ql360Gateway.Count
        nextAction='Original issuer/witness cryptographic review and one signed immutable DB receipt remain separate; this snapshot does not establish connected state.'
    }
    exit 0
}
if($ExportPostTest){
    $null=Confirm-Ql360OriginalStop $ExportStopReceiptPath
    foreach($path in @($OriginalPacketPath,$OwnerReviewPath)){
        if(-not (Test-Path -LiteralPath $path -PathType Leaf)){
            throw 'HOLD_ORIGINAL_SIGNED_PACKET_AND_REVIEW_REQUIRED'
        }
    }
    & (Join-Path $PSScriptRoot 'ql359-windows-supervised-test.ps1') -ReceiptReview `
      -OriginalPacketPath $OriginalPacketPath -OwnerReviewPath $OwnerReviewPath
    if($LASTEXITCODE -ne 0){throw 'HOLD_GENUINE_QL359_SIGNED_RECEIPT_REQUIRED'}
    # Existing QL-340C uses Ree-only DPAPI, a restricted PostgreSQL session,
    # exact original device signature and ACL-protected atomic evidence files.
    & (Join-Path $PSScriptRoot 'ql340c-windows-operator.ps1') -Readback `
      -SignedPacketPath $OriginalPacketPath
    if($LASTEXITCODE -ne 0){throw 'HOLD_REE_POST_TEST_SIX_APP_EVIDENCE_EXPORT_FAILED'}
    Write-Ql360Hold 'ORIGINAL_PRIVATE_POST_TEST_EXPORT_CREATED_AWAITING_INDEPENDENT_ARCHIVE_ACCEPTANCE' @{
        externalCustomerExports=0
        nextAction='Read the original-only evidence snapshot under the protected Evidence folder, verify the independent QL-359 signature and QL-360 in-process archive receipt, leave six peers HELD.'
    }
    exit 0
}
Write-Ql360Hold 'ORIGINAL_PRIVATE_ARCHIVE_READINESS_HOLD' @{
    computer=$env:COMPUTERNAME
    role=$ql360Role
    originalPrivateReceiverListenerCount=$ql360Listener.Count
    originalTailnetGatewayListenerCount=$ql360Gateway.Count
    nextAction='Only after a genuine QL-359 receipt, Ree uses the original QL-340C -Stop receipt and QL-360 -ShutdownReadback before private evidence export.'
}
