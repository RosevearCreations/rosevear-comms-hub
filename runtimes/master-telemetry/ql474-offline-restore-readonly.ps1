# QL-474 on-host read-only restored-file SHA256 and ZIP path safety inspection.
[CmdletBinding()]
param([ValidateSet('Inspect')][string]$Mode='Inspect',[string]$ManifestPath='')
$ErrorActionPreference='Stop'
if($env:OS -ne 'Windows_NT' -or $env:COMPUTERNAME -cne 'DESKTOP-AE894KC'){throw 'HOLD_QL474_ORIGINAL_HOST_REQUIRED'}
if($Mode -cne 'Inspect'){throw 'HOLD_QL474_INSPECT_ONLY'}
$state='HOLD_RESTORE_MANIFEST_MISSING';$reports=@()
if($ManifestPath){
 try{
  $manifest=Get-Item -LiteralPath $ManifestPath -ErrorAction Stop
  if($manifest.PSIsContainer -or ($manifest.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'MANIFEST_UNTRUSTED'}
  $m=Get-Content -LiteralPath $manifest.FullName -Raw | ConvertFrom-Json
  $expected=@('rosevear-comms-hub','rosevear-comms-hub-current','rosevear-comms-hub-clean')
  if($m.schema -cne 'rosevear.comms.ql474.restore-manifest.v1' -or @($m.archives).Count -ne 3){throw 'MANIFEST_SCHEMA'}
  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $names=@{};$all=$true
  foreach($item in $m.archives){
   $source=[string]$item.sourceName;$ok=$false;$count=0
   try{
    if(-not($expected -ccontains $source) -or $names.ContainsKey($source)){throw 'DUPLICATE_OR_UNKNOWN_SOURCE'}
    $names[$source]=$true
    $zip=Get-Item -LiteralPath ([string]$item.zipPath) -ErrorAction Stop
    $folder=Get-Item -LiteralPath ([string]$item.restoredRoot) -ErrorAction Stop
    if($zip.PSIsContainer -or $zip.Extension -ine '.zip' -or $zip.Length -gt 10737418240 -or $zip.Length -le 0){throw 'ZIP_INVALID'}
    if(-not $folder.PSIsContainer -or ($folder.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'RESTORE_ROOT_INVALID'}
    $root=[IO.Path]::GetFullPath($folder.FullName).TrimEnd('\')+'\'
    $protected=@('C:\rc470\','C:\Users\Ree\rosevear-comms-hub\','C:\Users\Ree\rosevear-comms-hub-current\','C:\Users\Ree\rosevear-comms-hub-clean\','C:\Users\Ree\rosevear-comms-hub-ql340\')
    foreach($p in $protected){
     if($root.StartsWith($p,[StringComparison]::OrdinalIgnoreCase) -or $p.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'RESTORE_OVERLAPS_LIVE_SOURCE'}
    }
    if((Get-FileHash -LiteralPath $zip.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -cne [string]$item.zipSha256){throw 'ZIP_HASH_MISMATCH'}
    $archive=[IO.Compression.ZipFile]::OpenRead($zip.FullName)
    $dupes=@{};$total=0L
    try{
     foreach($e in $archive.Entries){
      $relative=$e.FullName.Replace('\','/')
      if($relative.EndsWith('/')){continue}
      if($relative.StartsWith('/') -or $relative -match '(^|/)\.\.?(/|$)' -or $relative.Contains(':')){throw 'PATH_TRAVERSAL'}
      $key=$relative.ToLowerInvariant()
      if($dupes.ContainsKey($key)){throw 'DUPLICATE_ZIP_PATH'}
      $dupes[$key]=$true
      if($e.Length -gt 1073741824){throw 'ENTRY_TOO_LARGE'}
      $total+=$e.Length
      if($total -gt 10737418240 -or $dupes.Count -gt 50000){throw 'ZIP_BOMB_GUARD'}
      $full=[IO.Path]::GetFullPath([IO.Path]::Combine($folder.FullName,$relative.Replace('/',[IO.Path]::DirectorySeparatorChar)))
      if(-not $full.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){throw 'RESTORE_ESCAPE'}
      $restored=Get-Item -LiteralPath $full -ErrorAction Stop
      if($restored.PSIsContainer -or ($restored.Attributes -band [IO.FileAttributes]::ReparsePoint) -or $restored.Length -ne $e.Length){throw 'RESTORED_FILE_INVALID'}
      $hash=[Security.Cryptography.SHA256]::Create()
      try{
       $stream=$e.Open()
       try{
        $buffer=New-Object byte[] 65536
        while(($n=$stream.Read($buffer,0,$buffer.Length)) -gt 0){[void]$hash.TransformBlock($buffer,0,$n,$buffer,0)}
        [void]$hash.TransformFinalBlock($buffer,0,0)
       }finally{$stream.Dispose()}
       $entryHash=([BitConverter]::ToString($hash.Hash)).Replace('-','').ToLowerInvariant()
      }finally{$hash.Dispose()}
      if((Get-FileHash -LiteralPath $restored.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -cne $entryHash){throw 'RESTORED_FILE_HASH_MISMATCH'}
      $count++
     }
    }finally{$archive.Dispose()}
    if($count -le 0){throw 'ZIP_EMPTY'}
    $ok=$true
   }catch{$ok=$false}
   $reports+=@([pscustomobject]@{sourceName=$source;restoredFilesMatched=$count;safeReadback=$ok})
   $all=$all -and $ok
  }
  $state=if($all -and $names.Count -eq 3){'RESTORED_FILE_SHA256_MATCHED_WITNESS_STILL_REQUIRED'}else{'HOLD_RESTORE_FILE_MISMATCH'}
 }catch{$state='HOLD_MANIFEST_OR_RESTORE_INVALID'}
}
[pscustomobject]@{schema='rosevear.comms.ql474.restore-preflight.v1';host=$env:COMPUTERNAME
 observedAtUtc=[DateTime]::UtcNow.ToString('o');verification=$state;archives=$reports
 independentlyWitnessed=$false;serviceInstalled=$false;firstPeerAccepted=$false
 archiveDeletionAuthorized=$false;filesDeleted=0;filesMoved=0;actionExecuted=$false
 state='HOLD_INDEPENDENT_RESTORE_AND_FIRST_BOOT_REVIEW'}|ConvertTo-Json -Depth 6
