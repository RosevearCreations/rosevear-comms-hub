# QL478 original-host reconciliation. Local evidence readback ONLY.
# Does not start Windows worker, enable receiver, transmit, install, or reboot.
[CmdletBinding()]
param([ValidateSet('Inspect','Reconcile')][string]$Mode='Inspect',
      [switch]$ApproveLocalReconciliation)
$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC'){
 throw 'HOLD_QL478_ORIGINAL_HOST_REQUIRED'
}
$source='C:\rc470'
$worker=Join-Path $source 'runtimes\master-telemetry\ql476-original-host-worker.ps1'
$base=Join-Path $env:LOCALAPPDATA 'RosevearCommsHub'
$old=Join-Path $base 'QL476'
$exports=Join-Path $base 'QL477'
$output=Join-Path $base 'QL478'
$name='Rosevear-CommsHub-Worker'
function Main-Sha {
 $branch=@(git -C $source branch --show-current 2>$null)
 if($LASTEXITCODE -ne 0 -or $branch.Count -ne 1 -or $branch[0] -cne 'main'){
  throw 'HOLD_QL478_PRIMARY_MAIN_BRANCH_REQUIRED'
 }
 $sha=@(git -c core.fsmonitor=false --no-optional-locks -C $source rev-parse HEAD 2>$null)
 if($LASTEXITCODE -ne 0 -or $sha.Count -ne 1 -or ([string]$sha[0]).Trim() -notmatch '^[a-f0-9]{40}$'){
  throw 'HOLD_QL478_SOURCE_REVISION_UNKNOWN'
 }
 $status=@(git -c core.fsmonitor=false --no-optional-locks -C $source status --porcelain=v1 2>$null)
 if($LASTEXITCODE -ne 0 -or $status.Count -ne 0){throw 'HOLD_QL478_SOURCE_DIRTY'}
 return ([string]$sha[0]).Trim()
}
function Sha256([string]$path){
 if(-not (Test-Path -LiteralPath $path -PathType Leaf)){throw 'HOLD_QL478_FILE_MISSING'}
 $f=Get-Item -LiteralPath $path -Force
 if($f.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'HOLD_QL478_FILE_REPARSE'}
 return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Private-Folder([string]$path,[switch]$Create){
 if($path.StartsWith($source,[StringComparison]::OrdinalIgnoreCase)){
  throw 'HOLD_QL478_PRIVATE_EXPORT_OVERLAPS_SOURCE'
 }
 if(-not (Test-Path -LiteralPath $path -PathType Container)){
  if(-not $Create){throw 'HOLD_QL478_FIELD_EXPORT_MISSING'}
  [void](New-Item -ItemType Directory -Path $path -ErrorAction Stop)
 }
 $item=Get-Item -LiteralPath $path -Force
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){
  throw 'HOLD_QL478_EXPORT_REPARSE'
 }
}
function No-Public-Receiver {
 $listeners=@(Get-NetTCPConnection -State Listen -LocalPort 8788 -ErrorAction SilentlyContinue)
 if($listeners.Count -ne 0){throw 'HOLD_QL478_LEGACY_RECEIVER_LISTENING'}
 $svc=Get-CimInstance Win32_Service -Filter "Name='Rosevear-CommsHub'" -ErrorAction Stop
 if($svc -and $svc.StartMode -eq 'Auto'){throw 'HOLD_QL478_SCM_SERVICE_AUTOSTART'}
 $legacy=@(Get-ScheduledTask -ErrorAction Stop|Where-Object{
  $_.TaskName -match 'Rosevear.*Comms|Comms.*Rosevear' -and $_.TaskName -ne $name -and $_.State -ne 'Disabled'
 })
 if($legacy.Count -gt 0){throw 'HOLD_QL478_LEGACY_SCHEDULED_STARTUP'}
}
function Worker-Task {
 $task=Get-ScheduledTask -TaskName $name -ErrorAction Stop
 if($task.State -eq 'Disabled' -or $task.State -eq 'Running' -or @($task.Triggers).Count -ne 0 -or
    $task.Principal.LogonType -ne 'Interactive' -or
    $task.Principal.UserId -cne [Security.Principal.WindowsIdentity]::GetCurrent().Name){
  throw 'HOLD_QL478_ON_DEMAND_OWNER_TASK_REQUIRED'
 }
 $act=@($task.Actions)
 $exe="$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
 $expectedArgs='-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+$worker+'" -Mode WorkerOnce'
 if($act.Count -ne 1 -or $act[0].Execute -ine $exe -or $act[0].Arguments -cne $expectedArgs){
  throw 'HOLD_QL478_TASK_ACTION_CHANGED'
 }
 $info=Get-ScheduledTaskInfo -TaskName $name -ErrorAction Stop
 if($info.LastTaskResult -ne 0){throw 'HOLD_QL478_TASK_EXIT_NOT_SUCCESS'}
}
$main=Main-Sha
$hash=Sha256 $worker
No-Public-Receiver
if($Mode -eq 'Inspect'){
 $task=Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
 $exportsCount=0
 if(Test-Path -LiteralPath $exports -PathType Container){
  $exportsCount=@(Get-ChildItem -LiteralPath $exports -Filter 'ql477-*.json' -File).Count
 }
 [pscustomobject]@{schema='rosevear.comms.ql478.preflight.v1'
 host=$env:COMPUTERNAME;mainSha=$main;workerScriptSha256=$hash
 taskPresent=($null -ne $task);ql477ExportCount=$exportsCount
 oldReceiverOff=$true;state='HOLD_INDEPENDENT_WITNESS_AND_PRIVATE_FIRST_ACK'}|ConvertTo-Json -Depth 4
 return
}
if(-not $ApproveLocalReconciliation){throw 'HOLD_QL478_OWNER_EXPLICIT_APPROVAL_REQUIRED'}
Worker-Task
Private-Folder $old
Private-Folder $exports
$files=@(Get-ChildItem -LiteralPath $exports -Filter 'ql477-*.json' -File|Sort-Object LastWriteTimeUtc -Descending)
if($files.Count -lt 1){throw 'HOLD_QL478_NO_SOURCE_EVIDENCE'}
$exportFile=$files[0]
$exportHash=Sha256 $exportFile.FullName
$report=Get-Content -LiteralPath $exportFile.FullName -Raw|ConvertFrom-Json -ErrorAction Stop
if($report.schema -cne 'rosevear.comms.ql477.original-host-evidence.v1' -or
   $report.host -cne $env:COMPUTERNAME -or $report.mainSha -cne $main -or
   $report.install.mainSha -cne $main -or
   $report.install.workerScriptSha256 -cne $hash -or
   $report.install.onDemandOnly -ne $true -or
   $report.install.receiverPort8788Listeners -ne 0 -or
   $report.install.serviceAutostartEnabled -ne $false -or
   $report.install.sourceDeletions -ne 0 -or
   $report.sourceDeletions -ne 0 -or
   $report.offlineBackupReviewed -ne $false -or
   $report.independentlyWitnessed -ne $false -or
   ([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()-[long]$report.observedAtMs) -gt 300000){
 throw 'HOLD_QL478_ORIGINAL_EXPORT_SCOPE_FRESHNESS_OR_SOURCE'
}
$first=$report.first
$recovery=$report.recovery
if($first.osBootId -cne $recovery.osBootId -or
  $first.runId -ceq $recovery.runId -or
  [long]$first.observedAtMs -ge [long]$recovery.observedAtMs -or
  $first.mainSha -cne $main -or $recovery.mainSha -cne $main -or
  $first.workerScriptHash -cne $hash -or $recovery.workerScriptHash -cne $hash){
 throw 'HOLD_QL478_FIRST_RECOVERY_MISMATCH'
}
$firstPath=Join-Path $old ('run-'+$first.runId+'.json')
$recoveryPath=Join-Path $old ('run-'+$recovery.runId+'.json')
$firstSha=Sha256 $firstPath
$recoverySha=Sha256 $recoveryPath
if($firstSha -cne $report.firstFileSha256 -or $recoverySha -cne $report.recoveryFileSha256){
 throw 'HOLD_QL478_DURABLE_FIELD_HASH_TAMPERED'
}
$firstDisk=Get-Content -LiteralPath $firstPath -Raw|ConvertFrom-Json -ErrorAction Stop
$recoveryDisk=Get-Content -LiteralPath $recoveryPath -Raw|ConvertFrom-Json -ErrorAction Stop
if($firstDisk.runId -cne $first.runId -or $recoveryDisk.runId -cne $recovery.runId -or
  $firstDisk.mainSha -cne $main -or $recoveryDisk.mainSha -cne $main){
 throw 'HOLD_QL478_LOCAL_RECEIPT_READBACK_IDENTITY'
}
Private-Folder $output -Create
$check=[ordered]@{
 schema='rosevear.comms.ql478.host-local-reconciliation.v1'
 host=$env:COMPUTERNAME;mainSha=$main;workerScriptSha256=$hash
 exportId=$report.exportId;ql477FileSha256=$exportHash
 firstFileSha256=$firstSha;recoveryFileSha256=$recoverySha
 firstRunId=$first.runId;recoveryRunId=$recovery.runId;osBootId=$first.osBootId
 receiverPort8788='OFF';scheduledTask='OWNER_ON_DEMAND_ONLY'
 sourceDeletions=0;networkSent=$false;ownerClaimsConfirmed=$false
 independentPhysicalWitnessConfirmed=$false;firstProductionAckVerified=$false
 observedAtMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
 state='LOCAL_READBACK_VERIFIED_INDEPENDENT_WITNESS_AND_LIVE_ACK_HOLD'
}
$file=Join-Path $output ('ql478-'+[guid]::NewGuid().ToString()+'.json')
[IO.File]::WriteAllText($file,($check|ConvertTo-Json -Depth 6),[Text.Encoding]::UTF8)
[pscustomobject]@{state=$check.state;localPath=$file
 exportSha256=$exportHash;mainSha=$main;reconciledReceipts=2
 peerSent=$false;receiverActivated=$false;sourceDeletions=0}|ConvertTo-Json -Depth 6
