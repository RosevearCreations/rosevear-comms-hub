# QL-468 Original Windows host READ-ONLY inventory only.
# This script does not install/start/stop services, change Windows tasks, read secrets,
# bind a socket or authorize a reboot. Owner runs ONLY on DESKTOP-AE894KC.
[CmdletBinding()]
param([ValidateSet('Inspect')][string]$Mode = 'Inspect')
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC') {
    throw 'HOLD_QL468_ORIGINAL_WINDOWS_HOST_REQUIRED'
}
if ($Mode -cne 'Inspect') { throw 'HOLD_QL468_INSPECTION_ONLY' }
$svc = Get-CimInstance Win32_Service -Filter "Name='Rosevear-CommsHub'" -ErrorAction Stop
$legacy = Get-ScheduledTask -TaskName 'Rosevear AI Server Startup' -ErrorAction SilentlyContinue
$listeners = @(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
$accountExpected = 'NT SERVICE\Rosevear-CommsHub'
$evidence = [ordered]@{
    schema = 'rosevear.comms.ql468.original-host-readonly-inventory.v1'
    host = $env:COMPUTERNAME
    observedAtUtc = [datetime]::UtcNow.ToString('o')
    serviceName = 'Rosevear-CommsHub'
    workerPresent = [bool]($null -ne $svc)
    workerStartMode = if ($svc) { $svc.StartMode } else { 'NOT_INSTALLED' }
    workerState = if ($svc) { $svc.State } else { 'NOT_INSTALLED' }
    workerServiceAccountMatchesPlan = [bool]($svc -and $svc.StartName -ceq $accountExpected)
    receiverPort8788ListenerCount = [int]$listeners.Count
    legacyTaskPresent = [bool]($null -ne $legacy)
    legacyTaskDisabled = [bool]($legacy -and $legacy.State -eq 'Disabled')
    privateReceiverOffVerified = $false
    independentBootWitnessVerified = $false
    firstAckIndependentlyVerified = $false
    actionExecuted = $false
    rebootAuthorized = $false
    state = 'HOLD_INDEPENDENT_SIGNED_FIELD_REVIEW_REQUIRED'
}
$evidence | ConvertTo-Json -Depth 4 -Compress
