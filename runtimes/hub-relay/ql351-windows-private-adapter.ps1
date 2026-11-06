# QL-351 — Original-device Windows adapter staging and supervised handoff.
# No unattended listener, network exposure, credential creation or owner approval.
[CmdletBinding(DefaultParameterSetName = 'Status')]
param(
    [Parameter(ParameterSetName = 'Status')][switch]$Status,
    [Parameter(ParameterSetName = 'Install')][switch]$Install,
    [Parameter(ParameterSetName = 'Preflight')][switch]$Preflight,
    [Parameter(ParameterSetName = 'Readback')][switch]$Readback,
    [Parameter(ParameterSetName = 'Supervised')][switch]$SupervisedReceiver,
    [Parameter(ParameterSetName = 'Verify')][switch]$VerifyOneReceipt,
    [Parameter(ParameterSetName = 'Verify', Mandatory = $true)][string]$OriginalPacketPath,
    [Parameter(ParameterSetName = 'Verify', Mandatory = $true)][string]$OwnerReviewPath
)

$ErrorActionPreference = 'Stop'
$schema = 'rosevear.hub.ql351.original-windows-private-adapter.v1'
$originalComputer = 'DESKTOP-AE894KC'
$isWindows = $env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrEmpty($env:LOCALAPPDATA)
$base = if ($isWindows) { Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay' } else { $null }
$adapterDir = if ($isWindows) { Join-Path $base 'Adapter' } else { $null }
$manifestPath = if ($isWindows) { Join-Path $adapterDir 'ql351-installed.json' } else { $null }
$operator = Join-Path $PSScriptRoot 'ql340c-windows-operator.ps1'
$required = @('ql351-windows-private-adapter.ps1','ql340c-windows-operator.ps1','ql340c-activation-check.mjs',
    'ql340b-ceremony.mjs','ql341-private-readback.mjs','ql342-owner-decision.mjs',
    'ql348-supervised-test-diagnostics.mjs','ql349-six-peer-orchestrator.mjs',
    'ql350-private-control-bridge.mjs','server.mjs')

function Get-ListenerCount {
    if (-not $isWindows) { return 0 }
    return @(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue).Count
}

function Assert-OriginalHost {
    if (-not $isWindows -or $env:COMPUTERNAME -cne $originalComputer) {
        throw 'HOLD_ONLY_ORIGINAL_REE_WINDOWS_HOST_CAN_INSTALL_OR_RUN_TEST'
    }
}

function Get-RepositoryHead {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $head = (& git -C $repoRoot rev-parse HEAD 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $head -notmatch '^[a-f0-9]{40}$') {
        throw 'HOLD_CANNOT_VERIFY_CHECKOUT_HEAD'
    }
    return @{ root = $repoRoot; head = $head }
}

function Assert-Installed {
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        throw 'HOLD_QL351_PRIVATE_ADAPTER_NOT_INSTALLED'
    }
    $installed = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $repo = Get-RepositoryHead
    if ($installed.schema -cne $schema -or $installed.originalComputer -cne $originalComputer -or
        $installed.checkoutSha -cne $repo.head -or $installed.checkoutPath -cne $repo.root -or
        $installed.activationState -cne 'STAGED_ONLY_NO_RECEIVER_OR_TRUST' -or
        $installed.ownerDecision -cne 'NOT_GRANTED') {
        throw 'HOLD_ADAPTER_PROVENANCE_OR_INSTALLATION_DRIFT'
    }
    foreach ($item in $required) {
        $full = Join-Path $PSScriptRoot $item
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
            throw 'HOLD_ADAPTER_REQUIRED_SOURCE_MISSING'
        }
        $property = $installed.fileSha256.PSObject.Properties[$item]
        if (-not $property -or $property.Value -cne (Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant()) {
            throw 'HOLD_ADAPTER_INSTALLED_SOURCE_HASH_DRIFT'
        }
    }
    return $installed
}

function Write-State($state) {
    $installed = $isWindows -and (Test-Path -LiteralPath $manifestPath -PathType Leaf)
    $credential = $isWindows -and (Test-Path (Join-Path $base 'Receiver\ql340c-database.dpapi'))
    $enrollment = $isWindows -and (Test-Path (Join-Path $base 'Enrollment\ql340b-signed-test-enrollment.json'))
    [ordered]@{
        schema = $schema
        state = $state
        computer = $env:COMPUTERNAME
        originalHost = ($isWindows -and $env:COMPUTERNAME -ceq $originalComputer)
        adapterInstalled = [bool]$installed
        existingEncryptedCredentialPresent = [bool]$credential
        originalSignedEnrollmentFilePresent = [bool]$enrollment
        receiverListenerCount = (Get-ListenerCount)
        customerCommunications = $false
        sourceRepositoryWrites = 0
        signedHandshakeProved = $false
        connectionState = 'DISCONNECTED / HOLD'
    } | ConvertTo-Json -Compress -Depth 4
}

if ($Status -or (-not ($Install -or $Preflight -or $Readback -or $SupervisedReceiver -or $VerifyOneReceipt))) {
    Write-State $(if ($isWindows -and $env:COMPUTERNAME -ceq $originalComputer) {
        'ORIGINAL_HOST_READ_ONLY_INSPECTION' } else { 'HOLD_ORIGINAL_WINDOWS_HOST_REQUIRED' })
    exit 0
}

Assert-OriginalHost

if ($Install) {
    if (Get-ListenerCount) { throw 'HOLD_STOP_PRIVATE_RECEIVER_BEFORE_INSTALLATION' }
    if (Test-Path -LiteralPath $manifestPath) { throw 'DENY_EXISTING_ADAPTER_INSTALLATION_NO_OVERWRITE' }
    foreach ($item in $required) {
        if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $item) -PathType Leaf)) {
            throw 'HOLD_ADAPTER_REQUIRED_SOURCE_MISSING'
        }
    }
    $repo = Get-RepositoryHead
    $branch = (& git -C $repo.root branch --show-current | Out-String).Trim()
    $main = (& git -C $repo.root rev-parse refs/remotes/origin/main 2>$null | Out-String).Trim()
    $changes = (& git -C $repo.root status --porcelain | Out-String).Trim()
    if ($branch -cne 'main' -or $main -cne $repo.head -or $changes) {
        throw 'HOLD_REQUIRES_CLEAN_CURRENT_ORIGIN_MAIN_CHECKOUT'
    }
    $nodeVersion = (& node --version | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(?:22|24)\.') {
        throw 'HOLD_SUPPORTED_NODE_22_OR_24_REQUIRED'
    }
    $confirmation = Read-Host 'Type STAGE_QL351_ORIGINAL_WINDOWS to install a local NON-ACTIVE adapter record'
    if ($confirmation -cne 'STAGE_QL351_ORIGINAL_WINDOWS') {
        throw 'HOLD_OWNER_STAGING_CONFIRMATION_REQUIRED'
    }
    if (-not (Test-Path -LiteralPath $adapterDir)) {
        New-Item -ItemType Directory -Path $adapterDir -ErrorAction Stop | Out-Null
    }
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $grant = '{0}:(OI)(CI)F' -f $identity
    & icacls.exe $adapterDir /inheritance:r /grant:r $grant /remove:g '*S-1-1-0' '*S-1-5-32-545' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_ADAPTER_ACL_NOT_PRIVATE' }
    $hashes = [ordered]@{}
    foreach ($item in $required) {
        $hashes[$item] = (Get-FileHash -LiteralPath (Join-Path $PSScriptRoot $item) -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $record = [ordered]@{
        schema = $schema
        originalComputer = $originalComputer
        checkoutPath = $repo.root
        checkoutSha = $repo.head
        stagedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        fileSha256 = $hashes
        activationState = 'STAGED_ONLY_NO_RECEIVER_OR_TRUST'
        ownerDecision = 'NOT_GRANTED'
        connectionState = 'DISCONNECTED / HOLD'
    }
    $bytes = [Text.Encoding]::UTF8.GetBytes(($record | ConvertTo-Json -Depth 6))
    $stream = [IO.File]::Open($manifestPath, [IO.FileMode]::CreateNew,
        [IO.FileAccess]::Write, [IO.FileShare]::None)
    try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
    Assert-Installed | Out-Null
    Write-State 'ORIGINAL_ADAPTER_STAGED_NO_LISTENER_NO_TRUST_GRANTED'
    exit 0
}

Assert-Installed | Out-Null
if (Get-ListenerCount) { throw 'HOLD_STOP_RECEIVER_BEFORE_PRIVATE_READBACK_OR_PREFLIGHT' }

if ($Preflight) {
    & $operator -OwnerPreflight
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_OWNER_PREFLIGHT_NOT_VERIFIED' }
    Write-State 'PRIVATE_OWNER_PREFLIGHT_EXECUTED_NO_TEST_AUTHORIZATION'
} elseif ($Readback) {
    & $operator -Readback
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_PRIVATE_DATABASE_READBACK_FAILED' }
} elseif ($VerifyOneReceipt) {
    & $operator -VerifyOneReceipt -OriginalPacketPath $OriginalPacketPath -OwnerReviewPath $OwnerReviewPath
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_ORIGINAL_SIGNED_RECEIPT_NOT_VERIFIED' }
} elseif ($SupervisedReceiver) {
    # The prior operator independently verifies signed enrollment, TLS, DB role,
    # Tailscale Serve OFF, and requires a second explicit owner confirmation.
    & $operator -Start
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_SUPERVISED_RECEIVER_FAILED' }
}
