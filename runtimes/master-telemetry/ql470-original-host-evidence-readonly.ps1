# QL-470 LOCAL ORIGINAL-HOST READ-ONLY evidence collection.
# No installs, task changes, service starts/stops, key access, outgoing requests,
# listener bindings, signed attestations or receiver activation.
[CmdletBinding()]
param([ValidateSet('Inspect')][string]$Mode = 'Inspect')
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC') {
    throw 'HOLD_QL470_ORIGINAL_WINDOWS_HOST_REQUIRED'
}
if ($Mode -cne 'Inspect') { throw 'HOLD_QL470_INSPECTION_ONLY' }
$svc = Get-CimInstance Win32_Service -Filter "Name='Rosevear-CommsHub'" -ErrorAction Stop
$legacy = Get-ScheduledTask -TaskName 'Rosevear AI Server Startup' -ErrorAction SilentlyContinue
$listeners = @(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
$expectedAccount = 'NT SERVICE\Rosevear-CommsHub'
$binaryHash = $null
$binaryReadable = $false
# The service executable path may include arguments containing secrets.
# Never display or persist the original PathName or command line.
if ($svc -and -not [string]::IsNullOrWhiteSpace($svc.PathName)) {
    $candidate = $null
    if ($svc.PathName -match '^\s*"([^"]+\.exe)"(?:\s|$)') {
        $candidate = $Matches[1]
    } elseif ($svc.PathName -match '^\s*([A-Za-z]:\\.+?\.exe)(?:\s|$)') {
        $candidate = $Matches[1]
    }
    if ($candidate) {
        $file = Get-Item -LiteralPath $candidate -ErrorAction SilentlyContinue
        if ($file -and -not ($file.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -and
            -not $file.PSIsContainer -and $file.Extension -ieq '.exe') {
            $binaryHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            $binaryReadable = $true
        }
    }
}
$evidence = [ordered]@{
    schema = 'rosevear.comms.ql470.original-host-inventory.v1'
    host = $env:COMPUTERNAME
    observedAtUtc = [DateTime]::UtcNow.ToString('o')
    serviceName = 'Rosevear-CommsHub'
    workerPresent = [bool]($null -ne $svc)
    workerState = if ($svc) { $svc.State } else { 'NOT_INSTALLED' }
    workerStartMode = if ($svc) { $svc.StartMode } else { 'NOT_INSTALLED' }
    workerServiceAccountMatchesPlan = [bool]($svc -and $svc.StartName -ceq $expectedAccount)
    workerBinaryReadable = $binaryReadable
    workerBinarySha256 = $binaryHash
    receiverPort8788ListenerCount = [int]$listeners.Count
    legacyTaskDisabled = [bool]($legacy -and $legacy.State -eq 'Disabled')
    receiverOffIndependentlyVerified = $false
    independentPeerAccepted = $false
    actionExecuted = $false
    rebootAuthorized = $false
    state = 'HOLD_INDEPENDENT_ORIGINAL_HOST_WITNESS_REQUIRED'
}
$evidence | ConvertTo-Json -Depth 3 -Compress
