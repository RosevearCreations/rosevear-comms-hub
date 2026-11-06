param(
    [switch]$Status,
    [switch]$Capture
)

# QL-344: read-only original Windows receiver-OFF observation. The sole write
# (when explicitly requested) is a new nonsecret JSON document in private Evidence.
# This script never stops/starts a service, changes Tailscale, signs a request,
# or reads database credentials.
$ErrorActionPreference = 'Stop'
$schema = 'rosevear.hub.ql344.receiver-off-observation.v1'
if (($Status -and $Capture) -or (-not $Status -and -not $Capture)) {
    throw 'DENY_QL344_CHOOSE_STATUS_OR_CAPTURE'
}

$base = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$evidence = Join-Path $base 'Evidence'
$hostMatches = $env:COMPUTERNAME -eq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$listenerCount = @(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue).Count
$serve = ''
$serveExitCode = -1
try {
    $serve = ((& tailscale.exe serve status 2>&1) | Out-String).Trim()
    $serveExitCode = $LASTEXITCODE
} catch { $serve = 'UNAVAILABLE' }
$serveOff = $serveExitCode -eq 0 -and $serve -eq 'No serve config'
$files = @{
    windowsWitnessSha256 = (Join-Path $evidence 'windows-process-readback.json')
    privateTlsWitnessSha256 = (Join-Path $evidence 'private-tls-chain.json')
    tailnetAclWitnessSha256 = (Join-Path $evidence 'tailnet-grants-readback.hujson')
}
$drills = @(Get-ChildItem -LiteralPath $evidence -Filter 'ql342a-inert-rollback-drill-*.json' -File -ErrorAction SilentlyContinue)
if ($drills.Count -eq 1) { $files.rollbackWitnessSha256 = $drills[0].FullName }
$hashes = @{}
foreach ($entry in $files.GetEnumerator()) {
    if (Test-Path -LiteralPath $entry.Value -PathType Leaf) {
        $hashes[$entry.Key] = (Get-FileHash -LiteralPath $entry.Value -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}
$tlsPath = Join-Path $base 'TLS\comms-ql340b.crt'
$tlsHash = if (Test-Path -LiteralPath $tlsPath -PathType Leaf) {
    (Get-FileHash -LiteralPath $tlsPath -Algorithm SHA256).Hash.ToLowerInvariant()
} else { $null }
$prerequisites = $hostMatches -and $listenerCount -eq 0 -and $serveOff -and
    $drills.Count -eq 1 -and $hashes.Count -eq 4 -and $null -ne $tlsHash -and
    [string]::IsNullOrEmpty($env:DATABASE_URL)
$result = [ordered]@{
    schema = $schema
    state = if ($prerequisites) { 'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP' } else { 'HOLD_ORIGINAL_RECEIVER_OFF_OBSERVATION_INCOMPLETE' }
    capturedAt = (Get-Date).ToUniversalTime().ToString('o')
    computer = $env:COMPUTERNAME
    windowsUser = $env:USERNAME
    receiverPort = 8788
    localListenerCount = $listenerCount
    tailscaleServeNoConfig = $serveOff
    evidenceDigests = $hashes
    tlsCertificateFileSha256 = $tlsHash
    inertDrillFileCount = $drills.Count
    receiverOffObserved = $prerequisites
    originalReceiverStopped = $false
    originalIssuerEvidenceIndependentlyVerified = $false
    independentOriginalOwnerApproval = $false
    sourceSigned = $false
    masterSigned = $false
    requestMayBeSigned = $false
    receiverActivated = $false
    databaseEnrollmentCreated = $false
    connected = $false
    customerCommunications = $false
    deviceActions = $false
}
if ($Capture) {
    if (-not $prerequisites) { throw 'HOLD_RECEIVER_OFF_EVIDENCE_NOT_READY_NO_CAPTURE' }
    $decision = Read-Host 'To capture a new OFF observation (NOT a real receiver stop), type CAPTURE_RECEIVER_OFF_EVIDENCE'
    if ($decision -cne 'CAPTURE_RECEIVER_OFF_EVIDENCE') { throw 'OWNER_CANCELLED_RECEIVER_OFF_OBSERVATION' }
    if (-not (Test-Path -LiteralPath $evidence -PathType Container)) { throw 'HOLD_PRIVATE_EVIDENCE_DIRECTORY_MISSING' }
    $file = Join-Path $evidence ('ql344-receiver-off-observation-' + (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH-mm-ss-fffffffZ') + '.json')
    $json = ($result | ConvertTo-Json -Depth 8) + [Environment]::NewLine
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    $stream = [System.IO.File]::Open($file,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
    try {
        $bytes = $utf8.GetBytes($json)
        $stream.Write($bytes,0,$bytes.Length)
    } finally { $stream.Dispose() }
    $result['observationPath'] = $file
}
$result | ConvertTo-Json -Compress -Depth 8
