# QL-471 original host repository/launcher census (READ ONLY).
# No repository updates, branch deletion, task registration or service changes.
# Output includes no command lines, raw task actions, service arguments or secrets.
[CmdletBinding()]
param([ValidateSet('Inspect')][string]$Mode='Inspect')
$ErrorActionPreference='Stop'
if ($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC') {
    throw 'HOLD_QL471_ORIGINAL_WINDOWS_HOST_REQUIRED'
}
if ($Mode -cne 'Inspect') { throw 'HOLD_QL471_INSPECTION_ONLY' }
$roots = @(
    'C:\rc470'
    (Join-Path $env:USERPROFILE 'rosevear-comms-hub')
    (Join-Path $env:USERPROFILE 'rosevear-comms-hub-current')
    (Join-Path $env:USERPROFILE 'rosevear-comms-hub-clean')
    (Join-Path $env:USERPROFILE 'rosevear-comms-hub-ql340')
)
$gitAvailable = [bool](Get-Command git -ErrorAction SilentlyContinue)
$servicesReadable = $true
$tasksReadable = $true
$processesReadable = $true
try { $servicePaths = @(Get-CimInstance Win32_Service -ErrorAction Stop | ForEach-Object { $_.PathName }) }
catch { $servicesReadable = $false; $servicePaths = @() }
try {
    $taskPaths = @(Get-ScheduledTask -ErrorAction Stop | ForEach-Object {
        foreach ($action in $_.Actions) {
            # Compare locally only; never print command arguments.
            [string]$action.Execute + ' ' + [string]$action.Arguments + ' ' + [string]$action.WorkingDirectory
        }
    })
} catch { $tasksReadable = $false; $taskPaths = @() }
try {
    $processPaths = @(Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object {
        # Read internally for reference matching; never output process command lines.
        [string]$_.ExecutablePath + ' ' + [string]$_.CommandLine
    })
} catch { $processesReadable = $false; $processPaths = @() }
$results = @(
    foreach ($path in $roots) {
        $exists = Test-Path -LiteralPath $path -PathType Container
        $branch = $null
        $sha = $null
        $dirty = $null
        $originIsExpected = $null
        if ($exists -and $gitAvailable) {
            $shaOutput = @(git -c core.fsmonitor=false --no-optional-locks -C $path rev-parse --verify HEAD 2>$null)
            if ($LASTEXITCODE -eq 0 -and $shaOutput.Count -eq 1 -and $shaOutput[0] -match '^[a-f0-9]{40}$') {
                $sha = [string]$shaOutput[0]
                $branchOutput = @(git -c core.fsmonitor=false --no-optional-locks -C $path branch --show-current 2>$null)
                if ($LASTEXITCODE -eq 0) { $branch = ($branchOutput -join '').Trim() }
                $origin = @(git -c core.fsmonitor=false --no-optional-locks -C $path remote get-url origin 2>$null)
                if ($LASTEXITCODE -eq 0) {
                    $originIsExpected = [bool](($origin -join '') -match '^https://github\.com/RosevearCreations/rosevear-comms-hub(?:\.git)?$')
                }
                $changes = @(git -c core.fsmonitor=false --no-optional-locks -C $path status --porcelain=v1 --untracked-files=normal 2>$null)
                if ($LASTEXITCODE -eq 0) { $dirty = [bool]($changes.Count -gt 0) }
            }
        }
        $svcRef = if ($servicesReadable -and $exists) {
            [bool](@($servicePaths | Where-Object { $_ -and $_.IndexOf($path,[StringComparison]::OrdinalIgnoreCase) -ge 0 }).Count -gt 0)
        } else { $null }
        $taskRef = if ($tasksReadable -and $exists) {
            [bool](@($taskPaths | Where-Object { $_ -and $_.IndexOf($path,[StringComparison]::OrdinalIgnoreCase) -ge 0 }).Count -gt 0)
        } else { $null }
        $procRef = if ($processesReadable -and $exists) {
            [bool](@($processPaths | Where-Object { $_ -and $_.IndexOf($path,[StringComparison]::OrdinalIgnoreCase) -ge 0 }).Count -gt 0)
        } else { $null }
        $classification = if (-not $exists) { 'NOT_PRESENT' }
            elseif ($svcRef -eq $true -or $taskRef -eq $true -or $procRef -eq $true) { 'REFERENCED_DO_NOT_DELETE' }
            elseif (-not $servicesReadable -or -not $tasksReadable -or -not $processesReadable) { 'INCOMPLETE_VISIBILITY_DO_NOT_DELETE' }
            elseif ($dirty -eq $true) { 'LOCAL_CHANGES_DO_NOT_DELETE' }
            elseif ($sha -eq $null) { 'NOT_VERIFIED_GIT_REPO_DO_NOT_DELETE' }
            else { 'POSSIBLE_ARCHIVE_REVIEW_FIRST_DO_NOT_DELETE_YET' }
        [pscustomobject][ordered]@{
            path = $path
            exists = [bool]$exists
            gitHead = $sha
            branch = $branch
            tracksExpectedOrigin = $originIsExpected
            localChangesOrUntracked = $dirty
            serviceReferencesPath = $svcRef
            scheduledTaskReferencesPath = $taskRef
            runningProcessReferencesPath = $procRef
            classification = $classification
            safeToDeleteAutomatically = $false
        }
    }
)
[pscustomobject][ordered]@{
    schema='rosevear.comms.ql471.original-host-checkout-census.v1'
    host=$env:COMPUTERNAME
    inspectedAtUtc=[datetime]::UtcNow.ToString('o')
    serviceInspectionSucceeded=$servicesReadable
    taskInspectionSucceeded=$tasksReadable
    processInspectionSucceeded=$processesReadable
    repos=$results
    actionExecuted=$false
    deletionApproved=$false
    state='HOLD_OWNER_ARCHIVE_AND_PATH_REVIEW'
} | ConvertTo-Json -Depth 6
