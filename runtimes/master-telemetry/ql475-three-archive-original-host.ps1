# QL475 original host: INSPECT is read-only; STAGE requires separate owner action.
# STAGE creates 3 new ZIP archives plus isolated restores. Never alters source clones.
[CmdletBinding()]
param([ValidateSet('Inspect','Stage')][string]$Mode='Inspect',
 [string]$BackupRoot='',[string]$RestoreRoot='',[switch]$ApproveLocalStage)
$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC'){
 throw 'HOLD_QL475_ORIGINAL_HOST_REQUIRED'
}
$main='C:\rc470';$base='C:\Users\Ree'
$spec=@(
 [pscustomobject]@{name='rosevear-comms-hub';head='27f7f710cb42da2eb3e829934596e7133a29677b';tracked=2013;untracked=17},
 [pscustomobject]@{name='rosevear-comms-hub-current';head='8544be0fddeed71aaa1ef676eb692fe66d8d432e';tracked=2159;untracked=17},
 [pscustomobject]@{name='rosevear-comms-hub-clean';head='56868136d5201cd029bd03ecf2c40ff2043921a7';tracked=2177;untracked=17}
)
$protected=@($main,(Join-Path $base 'rosevear-comms-hub'),
 (Join-Path $base 'rosevear-comms-hub-current'),
 (Join-Path $base 'rosevear-comms-hub-clean'),
 (Join-Path $base 'rosevear-comms-hub-ql340'))
function Canon([string]$p){[IO.Path]::GetFullPath($p).TrimEnd('\')+'\'}
function Overlaps([string]$a,[string]$b){
 $x=Canon $a;$y=Canon $b
 $x.StartsWith($y,[StringComparison]::OrdinalIgnoreCase) -or
 $y.StartsWith($x,[StringComparison]::OrdinalIgnoreCase)
}
function Safe-Root([string]$p){
 if(-not [IO.Path]::IsPathRooted($p)){return $false}
 $item=Get-Item -LiteralPath $p -ErrorAction Stop
 if(-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){return $false}
 foreach($src in $protected){if(Overlaps $p $src){return $false}}
 return $true
}
function Git-Facts([string]$path){
 $h=@(git -c core.fsmonitor=false --no-optional-locks -C $path rev-parse --verify HEAD 2>$null)
 if($LASTEXITCODE -ne 0 -or $h.Count -ne 1){throw 'GIT_HEAD_UNAVAILABLE'}
 $s=@(git -c core.fsmonitor=false --no-optional-locks -C $path status --porcelain=v1 --untracked-files=normal 2>$null)
 if($LASTEXITCODE -ne 0){throw 'GIT_STATUS_UNAVAILABLE'}
 [pscustomobject]@{head=([string]$h[0]).Trim()
 tracked=@($s|Where-Object{$_ -notmatch '^\?\?'}).Count
 untracked=@($s|Where-Object{$_ -match '^\?\?'}).Count}
}
function File-Sha([string]$p){(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()}
function Tree-Digest([hashtable]$list){
 $b=New-Object System.Text.StringBuilder
 foreach($k in @($list.Keys|Sort-Object -CaseSensitive)){
  [void]$b.Append($k);[void]$b.Append([char]9)
  [void]$b.Append($list[$k]);[void]$b.Append([char]10)
 }
 $h=[Security.Cryptography.SHA256]::Create()
 try{([BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($b.ToString())))).Replace('-','').ToLowerInvariant()}
 finally{$h.Dispose()}
}
function Source-Tree([string]$path){
 $all=@(Get-ChildItem -LiteralPath $path -Recurse -Force -ErrorAction Stop)
 foreach($v in $all){if($v.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'SOURCE_LINK_NOT_ALLOWED'}}
 $files=@($all|Where-Object{-not $_.PSIsContainer})
 if($files.Count -le 0 -or $files.Count -gt 250000){throw 'SOURCE_SIZE_COUNT_OUT_OF_RANGE'}
 $root=Canon $path;$checks=@{};$fileRefs=@();$dirs=@();$seen=@{};$total=0L
 foreach($v in $all){
  if(-not $v.FullName.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'SOURCE_PATH_ESCAPED'}
  $rel=$v.FullName.Substring($root.Length).Replace('\','/')
  if(-not $rel -or $rel.StartsWith('/') -or $rel.Contains(':') -or
    $rel -match '(^|/)\.\.?(/|$)'){throw 'SOURCE_PATH_INVALID'}
  if($v.PSIsContainer){$dirs+=@($rel);continue}
  if($v.Length -gt 1073741824){throw 'SOURCE_FILE_TOO_LARGE'}
  $total+=$v.Length
  if($total -gt 21474836480){throw 'SOURCE_TOTAL_TOO_LARGE'}
  $lower=$rel.ToLowerInvariant()
  if($seen.ContainsKey($lower)){throw 'CASE_COLLISION'}
  $seen[$lower]=$true;$checks[$rel]=File-Sha $v.FullName
  $fileRefs+=@([pscustomobject]@{full=$v.FullName;relative=$rel})
 }
 [pscustomobject]@{files=$fileRefs;dirs=$dirs;hashes=$checks
  count=$files.Count;digest=(Tree-Digest $checks)}
}
$mainGit=Git-Facts $main
if($mainGit.head -notmatch '^[a-f0-9]{40}$'){throw 'PRIMARY_SHA_INVALID'}
$allClean=($mainGit.tracked -eq 0 -and $mainGit.untracked -eq 0)
$observed=@(
 foreach($s in $spec){
  $g=Git-Facts (Join-Path $base $s.name)
  $match=($g.head -ceq $s.head -and $g.tracked -eq $s.tracked -and $g.untracked -eq $s.untracked)
  [pscustomobject]@{sourceName=$s.name;sourceHead=$g.head;trackedChanges=$g.tracked
    untrackedEntries=$g.untracked;matchesHistoricalCensus=$match}
 }
)
$ready=$allClean -and @($observed|Where-Object{-not $_.matchesHistoricalCensus}).Count -eq 0
if($Mode -eq 'Inspect'){
 [pscustomobject]@{schema='rosevear.comms.ql475.source-preflight.v1'
  host=$env:COMPUTERNAME;sourceMainSha=$mainGit.head
  primaryClean=$allClean;allThreeSourcesPreserved=$ready
  archivesCreated=0;sources=$observed;actionExecuted=$false;filesDeleted=0
  state='HOLD_EXPLICIT_LOCAL_STAGE_AND_OFFLINE_WITNESS'}|ConvertTo-Json -Depth 6
 return
}
if(-not $ApproveLocalStage){throw 'HOLD_QL475_EXPLICIT_LOCAL_STAGE_APPROVAL_REQUIRED'}
if(-not $ready){throw 'HOLD_QL475_SOURCE_STATUS_CHANGED_FROM_OWNER_CENSUS'}
if(-not $BackupRoot -or -not $RestoreRoot){throw 'HOLD_QL475_TWO_EXTERNAL_STAGING_ROOTS_REQUIRED'}
if(-not(Safe-Root $BackupRoot) -or -not(Safe-Root $RestoreRoot) -or
 (Overlaps $BackupRoot $RestoreRoot)){throw 'HOLD_QL475_STAGING_PATH_OVERLAP'}
$stageId='QL475_'+[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfff')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,8)
$zipDir=Join-Path $BackupRoot $stageId;$restoreDir=Join-Path $RestoreRoot $stageId
if((Test-Path -LiteralPath $zipDir) -or (Test-Path -LiteralPath $restoreDir)){
 throw 'HOLD_QL475_STAGE_ALREADY_EXISTS'
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
# From this point only new output batch folders are written; partial batches
# remain in place on errors for manual inspection rather than silent cleanup.
[void](New-Item -ItemType Directory -Path $zipDir -ErrorAction Stop)
[void](New-Item -ItemType Directory -Path $restoreDir -ErrorAction Stop)
$archives=@()
foreach($s in $spec){
 $src=Join-Path $base $s.name
 $before=Git-Facts $src
 if($before.head -cne $s.head -or $before.tracked -ne $s.tracked -or
  $before.untracked -ne $s.untracked){throw 'HOLD_QL475_SOURCE_DRIFT'}
 $tree=Source-Tree $src
 $zipPath=Join-Path $zipDir ($s.name+'.zip')
 $destination=Join-Path $restoreDir $s.name
 if((Test-Path -LiteralPath $zipPath) -or (Test-Path -LiteralPath $destination)){
  throw 'HOLD_QL475_OUTPUT_COLLISION'
 }
 $zip=[IO.Compression.ZipFile]::Open($zipPath,[IO.Compression.ZipArchiveMode]::Create)
 try{
  foreach($d in $tree.dirs){[void]$zip.CreateEntry($d.TrimEnd('/')+'/')}
  foreach($f in $tree.files){
   [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
    $zip,$f.full,$f.relative,[IO.Compression.CompressionLevel]::Optimal)
  }
 }finally{$zip.Dispose()}
 [void](New-Item -ItemType Directory -Path $destination -ErrorAction Stop)
 $prefix=Canon $destination;$seen=@{};$checks=@{};$count=0
 $reader=[IO.Compression.ZipFile]::OpenRead($zipPath)
 try{
  foreach($entry in $reader.Entries){
   $rel=$entry.FullName.Replace('\','/')
   if(-not $rel -or $rel.StartsWith('/') -or $rel.Contains(':') -or
    $rel.Contains('//') -or $rel -match '(^|/)\.\.?(/|$)'){
    throw 'HOLD_QL475_UNSAFE_ZIP_ENTRY'
   }
   $out=[IO.Path]::GetFullPath([IO.Path]::Combine($destination,$rel.Replace('/',[IO.Path]::DirectorySeparatorChar)))
   if(-not $out.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){
    throw 'HOLD_QL475_ZIP_PATH_TRAVERSAL'
   }
   if($rel.EndsWith('/')){[void][IO.Directory]::CreateDirectory($out);continue}
   $key=$rel.ToLowerInvariant()
   if($seen.ContainsKey($key)){throw 'HOLD_QL475_DUPLICATE_ZIP_ENTRY'}
   $seen[$key]=$true
   if($entry.Length -gt 1073741824){throw 'HOLD_QL475_ENTRY_SIZE'}
   [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($out))
   $a=$entry.Open()
   try{
    $b=[IO.File]::Open($out,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try{$a.CopyTo($b)}finally{$b.Dispose()}
   }finally{$a.Dispose()}
   $hash=File-Sha $out
   if(-not $tree.hashes.ContainsKey($rel) -or $tree.hashes[$rel] -cne $hash){
    throw 'HOLD_QL475_FILE_SHA256_MISMATCH'
   }
   $checks[$rel]=$hash;$count++
  }
 }finally{$reader.Dispose()}
 $after=Git-Facts $src;$afterTree=Source-Tree $src
 $unchanged=($before.head -ceq $after.head -and $before.tracked -eq $after.tracked -and
  $before.untracked -eq $after.untracked -and $tree.digest -ceq $afterTree.digest)
 $restoredHash=Tree-Digest $checks
 if(-not $unchanged -or $count -ne $tree.count -or $restoredHash -cne $tree.digest){
  throw 'HOLD_QL475_INCOMPLETE_RESTORE_OR_MODIFIED_SOURCE'
 }
 $archives+=@([pscustomobject]@{
  sourceName=$s.name;sourceHead=$s.head;trackedChanges=$before.tracked
  untrackedEntries=$before.untracked;sourceFileCount=$tree.count
  zipEntryCount=$count;restoredFileCount=$count;zipSha256=(File-Sha $zipPath)
  sourceTreeSha256=$tree.digest;restoredTreeSha256=$restoredHash
  zipReadBackVerified=$true;allRestoredFileHashesMatch=$true
  hiddenAndUntrackedIncluded=$true;isolatedRestoration=$true
  noPathTraversalOrDuplicates=$true;sourceUnchanged=$true
  safeToDeleteAutomatically=$false
 })
}
$mainAfter=Git-Facts $main
if($mainAfter.head -cne $mainGit.head -or $mainAfter.tracked -ne 0 -or
 $mainAfter.untracked -ne 0){throw 'HOLD_QL475_WORKING_MAIN_CHANGED'}
$report=[pscustomobject]@{
 schema='rosevear.comms.ql475.archive-stage.v1';host=$env:COMPUTERNAME
 sourceMainSha=$mainGit.head;stageId=$stageId
 observedAtMs=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
 filesDeleted=0;filesMoved=0;workerModified=$false;receiverModified=$false
 sourceModified=$false;independentlyWitnessed=$false
 archives=$archives;state='LOCAL_ZIPS_RESTORED_OFFLINE_WITNESS_HOLD'
}
[IO.File]::WriteAllText((Join-Path $zipDir 'ql475-source-only-stage.json'),
 ($report|ConvertTo-Json -Depth 8),[Text.Encoding]::UTF8)
$report|ConvertTo-Json -Depth 8
