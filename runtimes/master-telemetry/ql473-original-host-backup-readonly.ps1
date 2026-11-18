# QL-473: original Windows host READ-ONLY ZIP backup preflight; no extraction or mutation.
[CmdletBinding()]
param([ValidateSet('Inspect')][string]$Mode='Inspect',[string]$ManifestPath='')
$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC'){throw 'HOLD_QL473_ORIGINAL_HOST_REQUIRED'}
if($Mode -cne 'Inspect'){throw 'HOLD_QL473_INSPECT_ONLY'}
$state='MISSING_BACKUP_MANIFEST';$checked=@()
if($ManifestPath){
 $manifest=Get-Item -LiteralPath $ManifestPath -ErrorAction SilentlyContinue
 if($manifest -and -not $manifest.PSIsContainer -and -not ($manifest.Attributes -band [IO.FileAttributes]::ReparsePoint)){
  $j=Get-Content -LiteralPath $manifest.FullName -Raw | ConvertFrom-Json
  if($j.schema -ceq 'rosevear.comms.ql473.local-backup-check.v1' -and @($j.archives).Count -eq 3){
   $ok=$true;$seen=@{};$names=@('rosevear-comms-hub','rosevear-comms-hub-current','rosevear-comms-hub-clean')
   foreach($entry in $j.archives){
    $allow=($names -ccontains [string]$entry.sourceName) -and -not $seen.ContainsKey([string]$entry.sourceName)
    if($allow){$seen[[string]$entry.sourceName]=$true}
    $f=if($allow){Get-Item -LiteralPath ([string]$entry.zipPath) -ErrorAction SilentlyContinue}else{$null}
    $pass=$false;$count=0
    if($f -and -not $f.PSIsContainer -and -not ($f.Attributes -band [IO.FileAttributes]::ReparsePoint) -and
      $f.Extension -ieq '.zip' -and $f.Length -gt 0 -and $f.Length -le 10737418240){
     $hash=(Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
     if($hash -ceq [string]$entry.expectedSha256){
      try{
       Add-Type -AssemblyName System.IO.Compression
       Add-Type -AssemblyName System.IO.Compression.FileSystem
       $z=[System.IO.Compression.ZipFile]::OpenRead($f.FullName)
       try{$count=$z.Entries.Count}finally{$z.Dispose()}
       $pass=($count -ge [int]$entry.expectedMinimumEntries -and [int]$entry.expectedMinimumEntries -gt 0)
      }catch{$pass=$false}
     }
    }
    $ok=$ok -and $pass
    $checked+=@([pscustomobject]@{sourceName=$entry.sourceName;zipHashAndStructureMatch=$pass;zipEntryCount=$count})
   }
   $state=if($ok){'ZIP_HASH_MATCHES_STILL_HOLD_SOURCE_RESTORE_VERIFICATION'}else{'HOLD_BACKUP_ARCHIVE_INVALID'}
  }else{$state='HOLD_BACKUP_MANIFEST_SCHEMA'}
 }else{$state='HOLD_MANIFEST_NOT_FOUND'}
}
[pscustomobject]@{schema='rosevear.comms.ql473.readonly-backup-preflight.v1'
 host=$env:COMPUTERNAME;observedAtUtc=[datetime]::UtcNow.ToString('o')
 backupStatus=$state;archives=$checked
 sourceCoverageIndependentlyVerified=$false;restoreTestCompleted=$false
 archiveDeletionAuthorized=$false;workerInstalledByScript=$false
 filesDeleted=0;filesMoved=0;receiverActivated=$false;actionExecuted=$false
 state='HOLD_INDEPENDENT_BACKUP_AND_WORKER_ENROLLMENT'} | ConvertTo-Json -Depth 5
