# QL477: original Windows host local readback and redacted offline SysOp evidence export.
# Inspect is read-only. Export writes one new private JSON to LOCALAPPDATA (never GitHub).
# Never installs a task, runs a worker, enables the receiver, reboots or sends packets.
[CmdletBinding()]
param([ValidateSet('Inspect','Export')][string]$Mode='Inspect',[switch]$ApproveLocalExport)
$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC'){
 throw 'HOLD_QL477_ORIGINAL_HOST_REQUIRED'
}
$source='C:\rc470'
$workerPath=Join-Path $source 'runtimes\master-telemetry\ql476-original-host-worker.ps1'
$name='Rosevear-CommsHub-Worker'
$receiptRoot=Join-Path $env:LOCALAPPDATA 'RosevearCommsHub\QL476'
$exportRoot=Join-Path $env:LOCALAPPDATA 'RosevearCommsHub\QL477'
function Source-Revision {
 if(-not (Test-Path -LiteralPath $workerPath -PathType Leaf)){throw 'HOLD_QL477_WORKER_SOURCE_MISSING'}
 $branch=@(git -C $source branch --show-current 2>$null)
 if($LASTEXITCODE -ne 0 -or $branch.Count -ne 1 -or $branch[0] -cne 'main'){
  throw 'HOLD_QL477_MAIN_BRANCH_REQUIRED'
 }
 $sha=@(git -c core.fsmonitor=false --no-optional-locks -C $source rev-parse HEAD 2>$null)
 if($LASTEXITCODE -ne 0 -or $sha.Count -ne 1 -or ([string]$sha[0]).Trim() -notmatch '^[a-f0-9]{40}$'){
  throw 'HOLD_QL477_SOURCE_SHA_MISSING'
 }
 $status=@(git -c core.fsmonitor=false --no-optional-locks -C $source status --porcelain=v1 2>$null)
 if($LASTEXITCODE -ne 0 -or $status.Count -ne 0){throw 'HOLD_QL477_DIRTY_SOURCE'}
 return ([string]$sha[0]).Trim()
}
function File-Hash([string]$path){(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()}
function Receiver-Listeners {
 if(-not (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue)){
  throw 'HOLD_QL477_TCP_OBSERVER_NOT_AVAILABLE'
 }
 return @(Get-NetTCPConnection -State Listen -LocalPort 8788 -ErrorAction SilentlyContinue).Count
}
function Is-Legacy-Disabled {
 $tasks=@(Get-ScheduledTask -ErrorAction Stop|Where-Object{
  $_.TaskName -match 'Rosevear.*Comms|Comms.*Rosevear' -and $_.TaskName -ne $name
 })
 return (@($tasks|Where-Object{$_.State -ne 'Disabled'}).Count -eq 0)
}
function Auto-Service {
 $svc=Get-CimInstance Win32_Service -Filter "Name='Rosevear-CommsHub'" -ErrorAction Stop
 return [bool]($svc -and $svc.StartMode -eq 'Auto')
}
function Check-Task {
 $t=Get-ScheduledTask -TaskName $name -ErrorAction Stop
 if($t.State -eq 'Disabled' -or $t.State -eq 'Running' -or
  @($t.Triggers).Count -ne 0 -or $t.Principal.LogonType -ne 'Interactive' -or
  $t.Principal.UserId -cne [Security.Principal.WindowsIdentity]::GetCurrent().Name){
  throw 'HOLD_QL477_NOT_OWNER_ON_DEMAND_TASK'
 }
 $actions=@($t.Actions)
 $expectedExe="$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
 $expectedArgs='-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+$workerPath+'" -Mode WorkerOnce'
 if($actions.Count -ne 1 -or $actions[0].Execute -ine $expectedExe -or
    $actions[0].Arguments -cne $expectedArgs){
  throw 'HOLD_QL477_TASK_ACTION_MISMATCH'
 }
 $info=Get-ScheduledTaskInfo -TaskName $name -ErrorAction Stop
 if($info.LastTaskResult -ne 0){throw 'HOLD_QL477_TASK_LAST_RESULT_FAILED'}
 return $info
}
function Safe-Private-Directory([string]$folder,[switch]$Create){
 if($folder.StartsWith($source,[StringComparison]::OrdinalIgnoreCase)){
  throw 'HOLD_QL477_EVIDENCE_OVERLAPS_SOURCE'
 }
 if(-not (Test-Path -LiteralPath $folder -PathType Container)){
  if(-not $Create){throw 'HOLD_QL477_RECEIPTS_MISSING'}
  [void](New-Item -ItemType Directory -Path $folder -ErrorAction Stop)
 }
 $item=Get-Item -LiteralPath $folder -Force
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){
  throw 'HOLD_QL477_EVIDENCE_REPARSE_POINT_NOT_ALLOWED'
 }
}
function Read-RunFiles([string]$sha,[string]$workerHash){
 Safe-Private-Directory $receiptRoot
 $files=@(Get-ChildItem -LiteralPath $receiptRoot -Filter 'run-*.json' -File -ErrorAction Stop|
  Sort-Object LastWriteTimeUtc -Descending)
 if($files.Count -lt 2){throw 'HOLD_QL477_TWO_INDEPENDENT_RUN_RECEIPTS_REQUIRED'}
 $items=@()
 foreach($f in $files){
  if($f.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'HOLD_QL477_SYMLINK_RECEIPT'}
  $r=Get-Content -LiteralPath $f.FullName -Raw -ErrorAction Stop|ConvertFrom-Json -ErrorAction Stop
  if($r.schema -cne 'rosevear.comms.ql476.local-run.v1' -or
    $r.host -cne $env:COMPUTERNAME -or $r.mainSha -cne $sha -or
    $r.workerScriptHash -cne $workerHash -or
    $r.receiverPort8788Listeners -ne 0 -or $r.peerSent -ne $false -or
    ([string]$r.runId) -notmatch '^[a-f0-9-]{36}$' -or
    ([string]$r.osBootId) -notmatch '^[a-f0-9-]{36}$'){
   throw 'HOLD_QL477_RECEIPT_IDENTITY_OR_NETWORK_MISMATCH'
  }
  $items+=@([pscustomobject]@{data=$r;fileHash=(File-Hash $f.FullName)})
  if($items.Count -eq 2){break}
 }
 $old=$items[1];$new=$items[0]
 if($old.data.runId -ceq $new.data.runId -or
   $old.data.osBootId -cne $new.data.osBootId -or
   [long]$old.data.observedAtMs -ge [long]$new.data.observedAtMs -or
   $old.fileHash -ceq $new.fileHash){throw 'HOLD_QL477_RECOVERY_REPLAY_OR_REBOOT'}
 return [pscustomobject]@{first=$old;recovery=$new}
}
$mainSha=Source-Revision
$workerHash=File-Hash $workerPath
$listeners=Receiver-Listeners
$legacy=Is-Legacy-Disabled
$auto=Auto-Service
if($Mode -eq 'Inspect'){
 $task=Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
 $receipts=if(Test-Path -LiteralPath $receiptRoot -PathType Container){
  @(Get-ChildItem -LiteralPath $receiptRoot -Filter 'run-*.json' -File).Count
 }else{0}
 [pscustomobject]@{schema='rosevear.comms.ql477.preflight.v1'
  host=$env:COMPUTERNAME;mainSha=$mainSha;workerScriptSha256=$workerHash
  taskInstalled=($null -ne $task);localReceiptCount=$receipts
  receiverPort8788Listeners=$listeners;legacyTaskDisabled=$legacy
  serviceAutostartEnabled=$auto;sourceDeletions=0
  state='HOLD_PHYSICAL_WITNESS_AND_SECURE_TELEMETRY_ACK'}|ConvertTo-Json -Depth 5
 return
}
if(-not $ApproveLocalExport){throw 'HOLD_QL477_EXPLICIT_OWNER_LOCAL_EXPORT_REQUIRED'}
if($listeners -ne 0 -or -not $legacy -or $auto){throw 'HOLD_QL477_RECEIVER_OR_LEGACY_STARTUP_UNSAFE'}
$taskInfo=Check-Task
$runs=Read-RunFiles $mainSha $workerHash
$exportId=[guid]::NewGuid().ToString()
$install=[ordered]@{
 schema='rosevear.comms.ql477.install-snapshot.v1';host=$env:COMPUTERNAME
 mainSha=$mainSha;exportId=$exportId;taskName=$name
 onDemandOnly=$true;interactiveOwnerOnly=$true;workerScriptSha256=$workerHash
 receiverPort8788Listeners=$listeners;legacyTaskDisabled=$legacy
 serviceAutostartEnabled=$auto;taskLastResult=[int]$taskInfo.LastTaskResult
 sourceClean=$true;sourceDeletions=0;receiverActivated=$false
 peerSent=$false;rebootPerformed=$false
}
$last=$runs.recovery.data
$telemetry=[ordered]@{
 schema='rosevear.comms.ql477.sysop-telemetry.v1'
 host=$env:COMPUTERNAME;sourceApp='rosevear-comms-hub'
 sourceMainSha=$mainSha;workerScriptSha256=$workerHash
 sampleId=[string]$last.runId;osBootId=[string]$last.osBootId
 observedAtMs=[long]$last.observedAtMs
 uptimeSeconds=[int]$last.uptimeSeconds;processCount=[int]$last.processCount
 dataClass='NON_SENSITIVE_AGGREGATE';customerDataIncluded=$false
 authorizesAction=$false;receiverActivated=$false;peerSent=$false
}
$report=[ordered]@{
 schema='rosevear.comms.ql477.original-host-evidence.v1'
 host=$env:COMPUTERNAME;mainSha=$mainSha;exportId=$exportId
 observedAtMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
 install=$install;first=$runs.first.data;recovery=$runs.recovery.data
 firstFileSha256=$runs.first.fileHash;recoveryFileSha256=$runs.recovery.fileHash
 telemetry=$telemetry;offlineBackupReviewed=$false
 independentlyWitnessed=$false;sourceDeletions=0
}
Safe-Private-Directory $exportRoot -Create
$out=Join-Path $exportRoot ('ql477-'+$exportId+'.json')
[IO.File]::WriteAllText($out,($report|ConvertTo-Json -Depth 9),[Text.Encoding]::UTF8)
[pscustomobject]@{state='LOCAL_EVIDENCE_EXPORTED_INDEPENDENT_CERTIFICATION_HELD'
 exportId=$exportId;localPath=$out;mainSha=$mainSha
 exportSha256=(File-Hash $out);receiptCount=2
 telemetryTransmitted=$false;receiverActivated=$false;sourceDeletions=0}|ConvertTo-Json -Depth 5
