# QL-352 — original Windows only. Installs a separate, deny-all HTTPS Caddyfile.
# Never edits/starts/stops the existing LAN Caddyfile, Windows Firewall,
# Tailscale Serve, the private receiver, owner keys or database credentials.
[CmdletBinding(DefaultParameterSetName = 'Status')]
param(
    [Parameter(ParameterSetName = 'Status')][switch]$Status,
    [Parameter(ParameterSetName = 'Stage')][switch]$Stage,
    [Parameter(ParameterSetName = 'Stage')][string]$TlsKeyPath,
    [Parameter(ParameterSetName = 'Validate')][switch]$Validate,
    [Parameter(ParameterSetName = 'SupervisedStart')][switch]$SupervisedStart,
    [Parameter(ParameterSetName = 'Stop')][switch]$Stop
)

$ErrorActionPreference = 'Stop'
$schema = 'rosevear.hub.ql352.windows-tailnet-transport.v1'
$expectedComputer = 'DESKTOP-AE894KC'
$expectedTailnet = '100.77.246.3'
$expectedLan = '192.168.68.74'
$expectedSource = '100.114.56.26'
$expectedPort = 8443
$expectedReceiverPort = 8788
$ql352OriginalWindows = ($env:OS -eq 'Windows_NT' -and
    -not [string]::IsNullOrEmpty($env:LOCALAPPDATA) -and
    $env:COMPUTERNAME -ceq $expectedComputer)
$base = if ($ql352OriginalWindows) { Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay' } else { $null }
$gatewayDir = if ($ql352OriginalWindows) { Join-Path $base 'Gateway' } else { $null }
$configPath = if ($ql352OriginalWindows) { Join-Path $gatewayDir 'ql352-tailnet.Caddyfile' } else { $null }
$manifestPath = if ($ql352OriginalWindows) { Join-Path $gatewayDir 'ql352-installed.json' } else { $null }
$tlsCert = if ($ql352OriginalWindows) { Join-Path $base 'TLS\comms-ql340b.crt' } else { $null }
$defaultKey = if ($ql352OriginalWindows) { Join-Path $base 'TLS\comms-ql340b.key' } else { $null }
$caddyExe = 'C:\Users\Ree\rosevearaihub\tools\caddy\caddy.exe'
$lanCaddyfile = 'C:\Users\Ree\rosevearaihub\data\lan-access\Caddyfile'
$nodeModule = Join-Path $PSScriptRoot 'ql352-tailnet-gateway.mjs'

function Get-ExactListeners([string]$localIp,[int]$port) {
    if (-not $ql352OriginalWindows) { return @() }
    return @(Get-NetTCPConnection -LocalAddress $localIp -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Assert-OriginalHost {
    if (-not $ql352OriginalWindows) { throw 'HOLD_ORIGINAL_REE_WINDOWS_HOST_ONLY' }
}

function Assert-OriginalLanUnchanged {
    if (-not (Test-Path -LiteralPath $caddyExe -PathType Leaf) -or
        -not (Test-Path -LiteralPath $lanCaddyfile -PathType Leaf)) {
        throw 'HOLD_ORIGINAL_LAN_CADDY_REQUIRED'
    }
    $lan = @(Get-ExactListeners $expectedLan $expectedPort)
    if ($lan.Count -ne 1) { throw 'HOLD_ORIGINAL_LAN_LISTENER_MUST_STAY_UNCHANGED' }
    $lanProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($lan[0].OwningProcess)"
    if (-not $lanProcess -or $lanProcess.Name -cne 'caddy.exe' -or
        $lanProcess.ExecutablePath -ine $caddyExe -or
        -not $lanProcess.CommandLine -or
        $lanProcess.CommandLine.IndexOf($lanCaddyfile,[StringComparison]::OrdinalIgnoreCase) -lt 0) {
        throw 'HOLD_LAN_CADDY_PROCESS_IDENTITY_NOT_VERIFIED'
    }
}

function Assert-TailnetReadiness {
    $address = @(Get-NetIPAddress -IPAddress $expectedTailnet -ErrorAction SilentlyContinue)
    if ($address.Count -ne 1 -or $address[0].InterfaceAlias -ne 'Tailscale') {
        throw 'HOLD_ORIGINAL_TAILNET_INTERFACE_REQUIRED'
    }
    $statusJson = (& tailscale.exe status --json | Out-String)
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_TAILSCALE_CLIENT_NOT_READY' }
    $tailnet = $statusJson | ConvertFrom-Json
    if ($tailnet.BackendState -ne 'Running' -or $tailnet.Self.Online -ne $true) {
        throw 'HOLD_TAILSCALE_NOT_ONLINE'
    }
    $serve = (& tailscale.exe serve status | Out-String)
    if ($LASTEXITCODE -ne 0 -or $serve -notmatch 'No serve config') {
        throw 'HOLD_TAILSCALE_SERVE_MUST_STAY_OFF'
    }
}

function Get-Checkout {
    $repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $head = (& git -C $repo rev-parse HEAD | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[a-f0-9]{40}$') {
        throw 'HOLD_UNVERIFIED_LOCAL_REPOSITORY'
    }
    return @{ root = $repo; head = $head }
}

function Assert-OriginalTls([string]$keyPath) {
    if (-not (Test-Path -LiteralPath $tlsCert -PathType Leaf) -or
        -not (Test-Path -LiteralPath $keyPath -PathType Leaf)) {
        throw 'HOLD_ORIGINAL_LOCAL_TLS_CERT_AND_KEY_REQUIRED_NO_NEW_KEY_GENERATED'
    }
    $result = (& node $nodeModule --verify-cert $tlsCert $keyPath | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_ORIGINAL_PRIVATE_TLS_VERIFICATION_FAILED' }
    $parsed = $result | ConvertFrom-Json
    if ($parsed.state -cne 'ORIGINAL_TLS_PAIR_LOCAL_PROOF_ONLY_ISSUER_REVIEW_HELD' -or
        $parsed.privateKeyMatchesPublicCertificate -ne $true) {
        throw ('HOLD_ORIGINAL_TLS_CERT_OR_KEY_NOT_VERIFIED: ' + $parsed.state)
    }
}

function Assert-Staged {
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf) -or
        -not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
        throw 'HOLD_QL352_TAILNET_GATEWAY_NOT_STAGED'
    }
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $checkout = Get-Checkout
    if ($manifest.schema -cne $schema -or $manifest.originalComputer -cne $expectedComputer -or
        $manifest.checkoutSha -cne $checkout.head -or $manifest.checkoutPath -cne $checkout.root -or
        $manifest.activation -cne 'STAGED_DENY_ALL_NOT_ACTIVATED' -or
        $manifest.originalOwnerEnrollment -cne 'NOT_GRANTED' -or
        $manifest.operatorAuthenticated -ne $false -or
        $manifest.gatewayConfigSha256 -cne (Get-FileHash -LiteralPath $configPath -Algorithm SHA256).Hash.ToLowerInvariant() -or
        $manifest.nodeModuleSha256 -cne (Get-FileHash -LiteralPath $nodeModule -Algorithm SHA256).Hash.ToLowerInvariant()) {
        throw 'HOLD_TAILNET_GATEWAY_PROVENANCE_OR_SOURCE_DRIFT'
    }
    $verified = (& node $nodeModule --verify-hold $configPath $tlsCert $manifest.tlsKeyPath | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or
        ($verified | ConvertFrom-Json).state -cne 'STAGED_TAILNET_ONLY_DENY_ALL_GATEWAY_CONFIG_VERIFIED') {
        throw 'HOLD_GATEWAY_ROUTES_OR_INTERFACE_NOT_FAIL_CLOSED'
    }
    Assert-OriginalTls $manifest.tlsKeyPath
    return $manifest
}

function Write-SafeStatus([string]$state) {
    [ordered]@{
        schema = $schema
        state = $state
        originalHost = $ql352OriginalWindows
        computer = $env:COMPUTERNAME
        lanListening = ($ql352OriginalWindows -and @(Get-ExactListeners $expectedLan $expectedPort).Count -eq 1)
        tailnetListening = ($ql352OriginalWindows -and @(Get-ExactListeners $expectedTailnet $expectedPort).Count -eq 1)
        gatewayStaged = ($ql352OriginalWindows -and (Test-Path -LiteralPath $manifestPath -PathType Leaf))
        originalTlsCertificatePresent = ($ql352OriginalWindows -and (Test-Path -LiteralPath $tlsCert -PathType Leaf))
        defaultTlsKeyFilePresent = ($ql352OriginalWindows -and (Test-Path -LiteralPath $defaultKey -PathType Leaf))
        bindAddress = $expectedTailnet
        tlsPort = $expectedPort
        originalReceiverPort = $expectedReceiverPort
        sourceIpPolicyCandidate = $expectedSource
        authenticatedOperator = $false
        sourceRepositoryWrites = 0
        customerCommunications = $false
        deviceActions = $false
        connection = 'DISCONNECTED / HOLD'
    } | ConvertTo-Json -Compress -Depth 4
}

if ($Status -or -not ($Stage -or $Validate -or $SupervisedStart -or $Stop)) {
    Write-SafeStatus $(if ($ql352OriginalWindows) { 'ORIGINAL_HOST_READ_ONLY_GATEWAY_DIAGNOSTIC' }
        else { 'HOLD_ORIGINAL_WINDOWS_HOST_REQUIRED_NO_ACTION' })
    exit 0
}

Assert-OriginalHost

if ($Stage) {
    Assert-OriginalLanUnchanged
    Assert-TailnetReadiness
    if (@(Get-ExactListeners $expectedTailnet $expectedPort).Count -ne 0) {
        throw 'HOLD_TAILNET_8443_ALREADY_OWNED_NO_OVERWRITE'
    }
    if ((Test-Path -LiteralPath $manifestPath) -or (Test-Path -LiteralPath $configPath)) {
        throw 'DENY_EXISTING_QL352_GATEWAY_NO_OVERWRITE'
    }
    $checkout = Get-Checkout
    $branch = (& git -C $checkout.root branch --show-current | Out-String).Trim()
    $currentMain = (& git -C $checkout.root rev-parse refs/remotes/origin/main | Out-String).Trim()
    $remoteMainLine = (& git -C $checkout.root ls-remote origin refs/heads/main | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $remoteMainLine -notmatch '^([0-9a-f]{40})\s+refs/heads/main$' -or
        $Matches[1] -cne $checkout.head) {
        throw 'HOLD_REMOTE_PRODUCTION_MAIN_MUST_EQUAL_ORIGINAL_CHECKOUT'
    }
    $changes = (& git -C $checkout.root status --porcelain | Out-String).Trim()
    if ($branch -cne 'main' -or $currentMain -cne $checkout.head -or $changes) {
        throw 'HOLD_REQUIRES_CLEAN_CURRENT_ORIGIN_MAIN_BEFORE_GATEWAY_STAGING'
    }
    $keyFile = if ([string]::IsNullOrEmpty($TlsKeyPath)) { $defaultKey } else { $TlsKeyPath }
    $keyFile = [IO.Path]::GetFullPath($keyFile)
    if (-not $keyFile.StartsWith((Join-Path $base 'TLS') + '\',[StringComparison]::OrdinalIgnoreCase)) {
        throw 'HOLD_PRIVATE_TLS_KEY_MUST_REMAIN_IN_ORIGINAL_USER_TLS_FOLDER'
    }
    Assert-OriginalTls $keyFile
    $confirmation = Read-Host 'Type STAGE_QL352_TAILNET_DENY_ALL to stage a NON-ACTIVE private HTTPS transport-only config'
    if ($confirmation -cne 'STAGE_QL352_TAILNET_DENY_ALL') { throw 'HOLD_OWNER_STAGING_CONSENT_REQUIRED' }
    if (-not (Test-Path -LiteralPath $gatewayDir)) {
        New-Item -ItemType Directory -Path $gatewayDir | Out-Null
    }
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $grant = '{0}:(OI)(CI)F' -f $identity
    & icacls.exe $gatewayDir /inheritance:r /grant:r $grant /remove:g '*S-1-1-0' '*S-1-5-32-545' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_QL352_GATEWAY_PRIVATE_DIRECTORY_ACL_FAILED' }
    # PowerShell's Out-String adds an extra CRLF; reconstruct the canonical
    # LF-only bytes emitted by the Node verifier so stage/readback agree.
    $renderedLines = @(& node $nodeModule --render-hold $tlsCert $keyFile)
    $generated = ($renderedLines -join "`n").TrimEnd("`r", "`n") + "`n"
    if ($LASTEXITCODE -ne 0 -or $generated -notmatch 'DENY_UNENROLLED_COMMS_BRIDGE') {
        throw 'HOLD_QL352_FAIL_CLOSED_GATEWAY_RENDER_FAILED'
    }
    $configBytes = [Text.Encoding]::UTF8.GetBytes($generated)
    $stream = [IO.File]::Open($configPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { $stream.Write($configBytes,0,$configBytes.Length) } finally { $stream.Dispose() }
    $manifest = [ordered]@{
        schema = $schema
        originalComputer = $expectedComputer
        checkoutPath = $checkout.root
        checkoutSha = $checkout.head
        tlsKeyPath = $keyFile
        stagedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        gatewayConfigSha256 = (Get-FileHash -LiteralPath $configPath -Algorithm SHA256).Hash.ToLowerInvariant()
        nodeModuleSha256 = (Get-FileHash -LiteralPath $nodeModule -Algorithm SHA256).Hash.ToLowerInvariant()
        activation = 'STAGED_DENY_ALL_NOT_ACTIVATED'
        originalOwnerEnrollment = 'NOT_GRANTED'
        operatorAuthenticated = $false
        connection = 'DISCONNECTED / HOLD'
    }
    $bytes = [Text.Encoding]::UTF8.GetBytes(($manifest | ConvertTo-Json -Depth 5))
    $stream = [IO.File]::Open($manifestPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { $stream.Write($bytes,0,$bytes.Length) } finally { $stream.Dispose() }
    Assert-Staged | Out-Null
    Write-SafeStatus 'TAILNET_ONLY_DENY_ALL_TRANSPORT_STAGED_NO_LISTENER'
    exit 0
}

if ($Stop) {
    # Stop ONLY the exact separately started QL-352 process. Never the LAN PID.
    $tailnet = @(Get-ExactListeners $expectedTailnet $expectedPort)
    if ($tailnet.Count -eq 0) {
        Write-SafeStatus 'QL352_TAILNET_GATEWAY_ALREADY_OFF_LAN_PRESERVED'
        exit 0
    }
    if ($tailnet.Count -ne 1) { throw 'DENY_AMBIGUOUS_TAILNET_HTTPS_LISTENERS' }
    $procId = $tailnet[0].OwningProcess
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $procId"
    if (-not $proc -or $proc.Name -cne 'caddy.exe' -or
        $proc.ExecutablePath -ine $caddyExe -or
        $proc.CommandLine.IndexOf($configPath,[StringComparison]::OrdinalIgnoreCase) -lt 0 -or
        $proc.CommandLine.IndexOf($lanCaddyfile,[StringComparison]::OrdinalIgnoreCase) -ge 0) {
        throw 'DENY_NOT_EXACT_QL352_TAILNET_GATEWAY_PROCESS'
    }
    $consent = Read-Host 'Type STOP_QL352_TAILNET_ONLY to stop only the supervised Tailnet gateway'
    if ($consent -cne 'STOP_QL352_TAILNET_ONLY') { throw 'HOLD_OWNER_STOP_CONSENT_REQUIRED' }
    Stop-Process -Id $procId -ErrorAction Stop
    Start-Sleep -Milliseconds 600
    if (@(Get-ExactListeners $expectedTailnet $expectedPort).Count -ne 0) {
        throw 'HOLD_QL352_TAILNET_STOP_NOT_VERIFIED'
    }
    Assert-OriginalLanUnchanged
    $evidenceDir = Join-Path $base 'Evidence'
    if (-not (Test-Path -LiteralPath $evidenceDir -PathType Container)) {
        throw 'HOLD_ORIGINAL_EVIDENCE_DIRECTORY_REQUIRED'
    }
    $receipt = [ordered]@{
        schema = 'rosevear.hub.ql352.tailnet-stop-observation.v1'
        observedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        originalHost = $expectedComputer
        stoppedProcessId = $procId
        exactGatewayConfig = $configPath
        tailnetListenerAfter = 0
        lanListenerPreserved = $true
        stopScope = 'QL352_TAILNET_ONLY_NOT_ORIGINAL_RECEIVER'
        ownerReviewStillRequired = $true
        connection = 'DISCONNECTED / HOLD'
    }
    $receiptPath = Join-Path $evidenceDir ('ql352-tailnet-stop-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ') + '.json')
    $receipt | ConvertTo-Json -Depth 4 | Out-File -LiteralPath $receiptPath -NoClobber -Encoding ascii
    Write-SafeStatus 'QL352_TAILNET_GATEWAY_STOPPED_ORIGINAL_LAN_PRESERVED'
    exit 0
}

Assert-OriginalLanUnchanged
Assert-TailnetReadiness
Assert-Staged | Out-Null
if (@(Get-ExactListeners $expectedTailnet $expectedPort).Count -ne 0) {
    throw 'HOLD_TAILNET_GATEWAY_ALREADY_LISTENING'
}

& $caddyExe validate --config $configPath --adapter caddyfile
if ($LASTEXITCODE -ne 0) { throw 'HOLD_QL352_CADDY_VALIDATE_FAILED' }
if ($Validate) {
    Write-SafeStatus 'ORIGINAL_TAILNET_DENY_ALL_GATEWAY_VALIDATED_NO_LISTENER'
    exit 0
}

if ($SupervisedStart) {
    $consent = Read-Host 'Type START_QL352_TAILNET_HOLD_ONLY to launch foreground private transport; NO Comms actions are allowed'
    if ($consent -cne 'START_QL352_TAILNET_HOLD_ONLY') { throw 'HOLD_OWNER_SUPERVISION_REQUIRED' }
    # This will display DENY/HOLD for every path, including QL350 TEST routes.
    # Independent original owner enrollment and authenticated QL350 adapters
    # are explicitly NOT supplied or activated by this gateway.
    & $caddyExe run --config $configPath --adapter caddyfile
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_QL352_SUPERVISED_GATEWAY_EXITED_WITH_FAILURE' }
    exit 0
}
