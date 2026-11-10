# QL-410 · Explicitly run on Ree's original Windows machine only.
# Read-only loopback probe. No elevated permissions, credentials, scheduling,
# remote receiver traffic, private receipts, or service modifications.
param([switch]$PrintOnly)
$ErrorActionPreference = 'Stop'
$expectedHost = 'DESKTOP-AE894KC'
$actualHost = [Environment]::MachineName
if ($actualHost -ne $expectedHost) {
  throw "QL410_ORIGINAL_HOST_ONLY: expected $expectedHost; observer not started."
}
$checks = @(
  @{ Name = 'hub_api_8765'; Port = 8765 },
  @{ Name = 'hub_client_5173'; Port = 5173 },
  @{ Name = 'hub_caddy_8443'; Port = 8443 }
)
$captured = [DateTimeOffset]::UtcNow
$observations = foreach ($check in $checks) {
  $watch = [Diagnostics.Stopwatch]::StartNew()
  $reachable = $false
  $client = [Net.Sockets.TcpClient]::new()
  try {
    $task = $client.ConnectAsync('127.0.0.1', [int]$check.Port)
    $reachable = $task.Wait(1200) -and $client.Connected
  } catch { $reachable = $false }
  finally { $watch.Stop(); $client.Dispose() }
  [ordered]@{
    sourceId = 'rosevear-ai-hub'
    hostId = $expectedHost
    service = $check.Name
    observedAt = $captured.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    reachable = [bool]$reachable
    latencyMs = [int][Math]::Min([Math]::Max(0, $watch.ElapsedMilliseconds), 60000)
    observationId = 'obs_' + [guid]::NewGuid().ToString('N')
  }
}
$payload = [ordered]@{
  schema = 'rosevear.ql410.ree-loopback.v1'
  deployment = 'LOCAL_READ_ONLY_NOT_SIGNED'
  hostId = $expectedHost
  capturedAt = $captured.ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
  observations = @($observations)
  receiver = 'OFF_UNCHANGED'
  connection = 'HOLD_UNCHANGED'
}
$json = ConvertTo-Json -InputObject $payload -Depth 5
if ($PrintOnly) { $json; return }
$outputDir = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\Monitoring'
[IO.Directory]::CreateDirectory($outputDir) | Out-Null
$outputFile = Join-Path $outputDir 'ql410-local-health.json'
$tempFile = Join-Path $outputDir ('ql410-' + [guid]::NewGuid().ToString('N') + '.tmp')
try {
  [IO.File]::WriteAllText($tempFile, $json, [Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $tempFile -Destination $outputFile -Force
} finally {
  if (Test-Path -LiteralPath $tempFile) { Remove-Item -LiteralPath $tempFile -Force }
}
Write-Output "QL410_LOCAL_OBSERVATION_SAVED: $outputFile"
