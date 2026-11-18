# QL-472 original host READ-ONLY source census extension.
# No repository mutation, SCM changes, host restart or credential access.
[CmdletBinding()]
param([ValidateSet('Inspect')][string]$Mode='Inspect')
$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC'){
 throw 'HOLD_QL472_ORIGINAL_HOST_REQUIRED'
}
if($Mode -cne 'Inspect'){throw 'HOLD_QL472_INSPECT_ONLY'}
$censusFile=Join-Path $PSScriptRoot 'ql471-original-host-checkout-census.ps1'
if(-not(Test-Path -LiteralPath $censusFile -PathType Leaf)){
 throw 'HOLD_QL472_Q471_CENSUS_SCRIPT_REQUIRED'
}
$census=((& $censusFile -Mode Inspect | Out-String) | ConvertFrom-Json)
if($census.host -cne $env:COMPUTERNAME -or $census.actionExecuted -ne $false){
 throw 'HOLD_QL472_CENSUS_INVALID'
}
$rows=@(
 foreach($r in $census.repos){
  $tracked=$null;$untracked=$null
  if($r.exists -and $r.gitHead){
   $status=@(git -c core.fsmonitor=false --no-optional-locks -C $r.path status --porcelain=v1 --untracked-files=normal 2>$null)
   if($LASTEXITCODE -eq 0){
    $tracked=@($status|Where-Object{$_ -notmatch '^\?\?'}).Count
    $untracked=@($status|Where-Object{$_ -match '^\?\?'}).Count
   }
  }
  $referenced=$r.serviceReferencesPath -eq $true -or
   $r.scheduledTaskReferencesPath -eq $true -or $r.runningProcessReferencesPath -eq $true
  $primary=$r.path.Equals('C:\rc470',[StringComparison]::OrdinalIgnoreCase)
  $classification=if($referenced){'WINDOWS_REFERENCED_KEEP'}
   elseif($r.localChangesOrUntracked -eq $true){'LOCAL_CHANGES_BACKUP_AND_KEEP'}
   elseif($primary -and $r.localChangesOrUntracked -eq $false){'CURRENT_CLEAN_MAIN_KEEP'}
   elseif($r.serviceReferencesPath -eq $null -or $r.scheduledTaskReferencesPath -eq $null -or $r.runningProcessReferencesPath -eq $null){'UNKNOWN_REFERENCE_KEEP'}
   else{'POSSIBLE_ARCHIVE_HUMAN_REVIEW_ONLY'}
  [pscustomobject][ordered]@{
   path=$r.path;gitHead=$r.gitHead;branch=$r.branch
   trackedChangedCount=$tracked;untrackedCount=$untracked
   referencedByWindows=$referenced;classification=$classification
   safeToDeleteAutomatically=$false
  }
 }
)
[pscustomobject][ordered]@{
 schema='rosevear.comms.ql472.original-host-consolidation.v1'
 host=$env:COMPUTERNAME;observedAtUtc=[datetime]::UtcNow.ToString('o')
 serviceInspectionSucceeded=$census.serviceInspectionSucceeded
 taskInspectionSucceeded=$census.taskInspectionSucceeded
 processInspectionSucceeded=$census.processInspectionSucceeded
 folders=$rows;filesDeleted=0;filesMoved=0
 serviceInstalledByScript=$false;receiverActivated=$false
 actionExecuted=$false;state='HOLD_ARCHIVE_BACKUP_AND_BOOTSTRAP_OWNER_REVIEW'
} | ConvertTo-Json -Depth 6
