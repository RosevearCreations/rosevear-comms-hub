# QL-353 read-only original-owner field observation.
# This is NOT an authorization ceremony, credential install or live receiver.
[CmdletBinding()]
param([switch]$Status)
$ErrorActionPreference = 'Stop'
$original = $env:OS -eq 'Windows_NT' -and $env:COMPUTERNAME -ceq 'DESKTOP-AE894KC' -and
    -not [string]::IsNullOrEmpty($env:LOCALAPPDATA)

if (-not $original) {
    [ordered]@{schema='rosevear.hub.ql353.original-windows-readback.v1';
        state='HOLD_ORIGINAL_REE_WINDOWS_HOST_REQUIRED_NO_ACTION';originalHost=$false;
        connected=$false;databaseEnrollmentVerified=$false;
        signedReceiptVerified=$false;receiverActivated=$false;
        privateOperatorAuthenticated=$false;customerCommunications=$false;
        sourceRepositoryWrites=0;deviceActions=$false} | ConvertTo-Json -Compress
    exit 0
}

$base = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$lan = @(Get-NetTCPConnection -LocalAddress '192.168.68.74' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
$tailnet = @(Get-NetTCPConnection -LocalAddress '100.77.246.3' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
$receiver = @(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
$file = @{
    source = Join-Path $base 'OwnerAuthorities\source\source.public-candidate.json'
    master = Join-Path $base 'Imports\jack-master.public-candidate.json'
    device = Join-Path $base 'ql339b-hub.public-candidate.json'
    signed = Join-Path $base 'Enrollment\ql340b-signed-test-enrollment.json'
    pins = Join-Path $base 'Enrollment\ql340b-private-owner-public-pins.json'
    db = Join-Path $base 'Receiver\ql340c-database.dpapi'
    ql352 = Join-Path $base 'Gateway\ql352-installed.json'
}

[ordered]@{
    schema='rosevear.hub.ql353.original-windows-readback.v1'
    state='ORIGINAL_WINDOWS_FIELD_OBSERVED_INDEPENDENT_AUTHORITY_STILL_REQUIRED'
    originalHost=$true
    computer=$env:COMPUTERNAME
    originalLanListenerCount=$lan.Count
    tailnetTransportListenerCount=$tailnet.Count
    privateReceiverListenerCount=$receiver.Count
    receiverPortListening=($receiver.Count -gt 0)
    sourcePublicCandidatePresent=(Test-Path -LiteralPath $file.source -PathType Leaf)
    importedMasterPublicCandidatePresent=(Test-Path -LiteralPath $file.master -PathType Leaf)
    originalDevicePublicCandidatePresent=(Test-Path -LiteralPath $file.device -PathType Leaf)
    originalSignedEnrollmentPresent=(Test-Path -LiteralPath $file.signed -PathType Leaf)
    approvedPublicPinsFilePresent=(Test-Path -LiteralPath $file.pins -PathType Leaf)
    privateDatabaseCredentialEncryptedOnDisk=(Test-Path -LiteralPath $file.db -PathType Leaf)
    ql352StagedManifestPresent=(Test-Path -LiteralPath $file.ql352 -PathType Leaf)
    originalIssuerIndependentlyApproved=$false
    originalOwnersIndependentlyApproved=$false
    databaseEnrollmentVerified=$false
    signedReceiptVerified=$false
    privateOperatorAuthenticated=$false
    receiverActivated=$false
    customerCommunications=$false
    sourceRepositoryWrites=0
    deviceActions=$false
    connected=$false
    connectionState='DISCONNECTED / HOLD'
    note='File presence is not original issuer approval; live database and signatures need independent review.'
} | ConvertTo-Json -Compress -Depth 4
