# QL-476: OWNER-ONLY Windows on-demand SysOp worker. No reboot, auto-start, or network.
# Run on DESKTOP-AE894KC in a clean C:\rc470 after separately witnessed offline restore.
[CmdletBinding()]
param(
 [ValidateSet('Inspect','Install','Start','Verify','Recover','WorkerOnce')]
 [string]$Mode='Inspect',
 [switch]$ApproveInstall,[switch]$ApproveFirstRun,[switch]$ApproveRecovery,
 [switch]$OfflineRestoreIndependentlyWitnessed
)
$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC'){
 throw 'HOLD_QL476_ORIGINAL_HOST_REQUIRED'
}
$root='C:\rc470'
$script=Join-Path $root 'runtimes\master-telemetry\ql476-original-host-worker.ps1'
$name='Rosevear-CommsHub-Worker'
$store=Join-Path $env:LOCALAPPDATA 'RosevearCommsHub\QL476'
function Main-Sha {
 $h=@(git -c core.fsmonitor=false --no-optional-locks -C $root rev-parse HEAD 2>$null)
 if($LASTEXITCODE -ne 0 -or $h.Count -ne 1 -or ([string]$h[0]).Trim() -notmatch '^[a-f0-9]{40}$'){
  throw 'HOLD_QL476_MAIN_SHA_MISSING'
 }
 return ([string]$h[0]).Trim()
}
function Safe-Source {
 if(-not (Test-Path -LiteralPath $script -PathType Leaf)){throw 'HOLD_QL476_SCRIPT_NOT_IN_PRIMARY'}
 $branch=@(git -C $root branch --show-current)
 $changed=@(git -c core.fsmonitor=false --no-optional-locks -C $root status --porcelain=v1)
 if($LASTEXITCODE -ne 0 -or $branch.Count -ne 1 -or $branch[0] -cne 'main' -or $changed.Count -ne 0){
  throw 'HOLD_QL476_SOURCE_NOT_CLEAN_MAIN'
 }
}
function Hash {return (Get-FileHash -LiteralPath $script -Algorithm SHA256).Hash.ToLowerInvariant()}
function Listeners {
 $items=@(Get-NetTCPConnection -State Listen -LocalPort 8788 -ErrorAction SilentlyContinue)
 return $items.Count
}
function Service-Autostart {
 $svc=Get-CimInstance Win32_Service -Filter "Name='Rosevear-CommsHub'" -ErrorAction Stop
 return [bool]($svc -and $svc.StartMode -eq 'Auto')
}
function Legacy-Disabled {
 $tasks=@(Get-ScheduledTask -ErrorAction Stop | Where-Object {
  $_.TaskName -match 'Rosevear.*Comms|Comms.*Rosevear' -and $_.TaskName -ne $name
 })
 return (@($tasks|Where-Object{$_.State -ne 'Disabled'}).Count -eq 0)
}
function Guard-Off {
 if((Listeners) -ne 0 -or (Service-Autostart) -or -not (Legacy-Disabled)){
  throw 'HOLD_QL476_RECEIVER_OR_LEGACY_AUTOSTART_UNSAFE'
 }
}
function Worker-Task {
 $t=Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
 if($null -eq $t){throw 'HOLD_QL476_TASK_NOT_INSTALLED'}
 if(@($t.Triggers).Count -ne 0 -or $t.State -eq 'Disabled'){
  throw 'HOLD_QL476_TASK_NOT_MANUAL_ONLY'
 }
 if($t.Principal.LogonType -ne 'Interactive'){throw 'HOLD_QL476_INTERACTIVE_OWNER_ONLY'}
 $act=@($t.Actions)
 if($act.Count -ne 1 -or $act[0].Execute -notmatch '(?i)powershell\.exe$' -or
  $act[0].Arguments -notlike '*ql476-original-host-worker.ps1*' -or
  $act[0].Arguments -notlike '*WorkerOnce*'){
  throw 'HOLD_QL476_TASK_ACTION_CHANGED'
 }
 return $t
}
function Latest-Receipt {
 if(-not (Test-Path -LiteralPath $store -PathType Container)){throw 'HOLD_QL476_NO_LOCAL_RECEIPTS'}
 $files=@(Get-ChildItem -LiteralPath $store -Filter 'run-*.json' -File |
  Sort-Object LastWriteTimeUtc -Descending)
 if($files.Count -eq 0){throw 'HOLD_QL476_NO_LOCAL_RECEIPTS'}
 $r=Get-Content -LiteralPath $files[0].FullName -Raw | ConvertFrom-Json
 if($r.schema -cne 'rosevear.comms.ql476.local-run.v1' -or $r.host -cne $env:COMPUTERNAME -or
  $r.mainSha -cne (Main-Sha) -or $r.workerScriptHash -cne (Hash) -or
  $r.receiverPort8788Listeners -ne 0 -or $r.peerSent -ne $false){
  throw 'HOLD_QL476_RUN_SOURCE_OR_RECEIVER_MISMATCH'
 }
 return $r
}
$sha=Main-Sha
if($Mode -eq 'Inspect'){
 $t=Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
 [pscustomobject]@{schema='rosevear.comms.ql476.preflight.v1'
  host=$env:COMPUTERNAME;mainSha=$sha;taskInstalled=($null -ne $t)
  manualTask=($null -ne $t -and @($t.Triggers).Count -eq 0)
  port8788Listeners=(Listeners);legacyTaskDisabled=(Legacy-Disabled)
  serviceAutostartEnabled=(Service-Autostart);sourceDeletes=0
  state='HOLD_ORIGINAL_HOST_SUPERVISION_AND_INDEPENDENT_WITNESS'}|ConvertTo-Json -Depth 6
 return
}
Safe-Source
Guard-Off
if($Mode -eq 'Install'){
 if(-not $ApproveInstall -or -not $OfflineRestoreIndependentlyWitnessed){
  throw 'HOLD_QL476_OWNER_INSTALL_AND_OFFLINE_RESTORE_CONFIRMATION_REQUIRED'
 }
 if($null -ne (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue)){
  throw 'HOLD_QL476_TASK_ALREADY_EXISTS_NO_OVERWRITE'
 }
 $who=[Security.Principal.WindowsIdentity]::GetCurrent().Name
 if(-not $who){throw 'HOLD_QL476_INTERACTIVE_OWNER_UNAVAILABLE'}
 $action=New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+$script+'" -Mode WorkerOnce')
 $settings=New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -MultipleInstances IgnoreNew
 $principal=New-ScheduledTaskPrincipal -UserId $who -LogonType Interactive -RunLevel Limited
 Register-ScheduledTask -TaskName $name -Action $action -Settings $settings -Principal $principal -Description 'QL476 manual-only local SysOp receipt; no triggers, listener or peer'
 [pscustomobject]@{state='INSTALLED_LOCAL_MANUAL_ONLY_FIELD_WITNESS_HOLD';taskName=$name
  mainSha=$sha;workerScriptHash=(Hash);receiverActivated=$false;sourceDeletes=0}|ConvertTo-Json
 return
}
if($Mode -eq 'WorkerOnce'){
 [void](Worker-Task)
 if(-not (Test-Path -LiteralPath $store -PathType Container)){
  [void](New-Item -ItemType Directory -Path $store -Force)
 }
 $os=Get-CimInstance Win32_OperatingSystem
 $bootStamp=([DateTimeOffset]$os.LastBootUpTime).ToUniversalTime().ToString('o')
 $stableBoot=[Security.Cryptography.SHA256]::Create()
 try{
  $bytes=[Text.Encoding]::UTF8.GetBytes($env:COMPUTERNAME+'|'+$bootStamp)
  $hex=([BitConverter]::ToString($stableBoot.ComputeHash($bytes))).Replace('-','').ToLowerInvariant()
 }finally{$stableBoot.Dispose()}
 $bootId=($hex.Substring(0,8)+'-'+$hex.Substring(8,4)+'-4'+$hex.Substring(13,3)+'-8'+$hex.Substring(17,3)+'-'+$hex.Substring(20,12))
 $receipt=[pscustomobject]@{
  schema='rosevear.comms.ql476.local-run.v1';host=$env:COMPUTERNAME
  mainSha=$sha;workerScriptHash=(Hash);runId=([guid]::NewGuid().ToString())
  osBootId=$bootId;observedAtMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  uptimeSeconds=[int][math]::Max(0,([datetime]::UtcNow-$os.LastBootUpTime.ToUniversalTime()).TotalSeconds)
  processCount=@(Get-Process).Count
  receiverPort8788Listeners=(Listeners);peerSent=$false
 }
 if($receipt.receiverPort8788Listeners -ne 0){throw 'HOLD_QL476_RECEIVER_CHANGED_DURING_RUN'}
 $file=Join-Path $store ('run-'+$receipt.runId+'.json')
 $json=$receipt|ConvertTo-Json -Depth 5
 [IO.File]::WriteAllText($file,$json,[Text.Encoding]::UTF8)
 return
}
[void](Worker-Task)
if($Mode -eq 'Start' -or $Mode -eq 'Recover'){
 if(($Mode -eq 'Start' -and -not $ApproveFirstRun) -or
  ($Mode -eq 'Recover' -and -not $ApproveRecovery)){
  throw 'HOLD_QL476_EXPLICIT_LOCAL_START_OR_RECOVERY_APPROVAL_REQUIRED'
 }
 $prior=$null
 if($Mode -eq 'Recover'){$prior=Latest-Receipt}
 Start-ScheduledTask -TaskName $name -ErrorAction Stop
 $end=(Get-Date).AddSeconds(75)
 do{
  Start-Sleep -Milliseconds 700
  $info=Get-ScheduledTaskInfo -TaskName $name
  $task=Get-ScheduledTask -TaskName $name
  if($task.State -ne 'Running' -and $info.LastTaskResult -ne 267009){break}
 }while((Get-Date) -lt $end)
 if($task.State -eq 'Running' -or $info.LastTaskResult -ne 0){
  throw 'HOLD_QL476_LOCAL_RUN_NOT_SUCCESSFUL'
 }
 $last=Latest-Receipt
 if($null -ne $prior -and ($last.runId -eq $prior.runId -or
    $last.osBootId -ne $prior.osBootId -or
    $last.observedAtMs -le $prior.observedAtMs)){
  throw 'HOLD_QL476_RECOVERY_RUN_NOT_NEW_OR_OS_REBOOTED'
 }
 [pscustomobject]@{state='LOCAL_RUN_ONLY_INDEPENDENT_FIELD_ACCEPTANCE_HOLD'
  runId=$last.runId;priorRunId=$prior.runId;mainSha=$sha
  receiverActivated=$false;sourceDeletes=0}|ConvertTo-Json
 return
}
if($Mode -eq 'Verify'){
 $t=Worker-Task
 $info=Get-ScheduledTaskInfo -TaskName $name
 $r=Latest-Receipt
 [pscustomobject]@{schema='rosevear.comms.ql476.on-demand-worker.v1'
  phase='VERIFY';host=$env:COMPUTERNAME;mainSha=$sha;taskName=$name
  taskTriggerCount=@($t.Triggers).Count;taskEnabled=($t.State -ne 'Disabled')
  taskLogonMode='INTERACTIVE_OWNER';workerScriptHash=(Hash)
  receiverPort8788Listeners=(Listeners);legacyTaskDisabled=(Legacy-Disabled)
  serviceAutostartEnabled=(Service-Autostart);lastTaskResult=$info.LastTaskResult
  observedAtMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds();run=$r
  receiverActivated=$false;rebootPerformed=$false;peerSent=$false
  sourceWrites=0;sourceDeletes=0;state='LOCAL_ONLY_INDEPENDENT_FIELD_ACCEPTANCE_HOLD'}|ConvertTo-Json -Depth 8
 return
}
throw 'HOLD_QL476_UNKNOWN_MODE'
