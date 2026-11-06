# QL-340C: Owner-supervised, Windows-only TEST receiver. No scheduled activation.
# DB credentials stay encrypted with current-user Windows DPAPI, never in this repo.
[CmdletBinding(DefaultParameterSetName = 'Status')]
param(
    [Parameter(ParameterSetName = 'Status')][switch]$Status,
    [Parameter(ParameterSetName = 'Store')][switch]$StoreCredential,
    [Parameter(ParameterSetName = 'Start')][switch]$Start,
    [Parameter(ParameterSetName = 'Stop')][switch]$Stop,
    [Parameter(ParameterSetName = 'SelfTest')][switch]$SelfTest
)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT' -or -not $env:LOCALAPPDATA) {
    throw 'HOLD_ORIGINAL_WINDOWS_OWNER_HOST_REQUIRED'
}

$base = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$credentialDir = Join-Path $base 'Receiver'
$credentialFile = Join-Path $credentialDir 'ql340c-database.dpapi'
$pinFile = Join-Path $base 'Enrollment\ql340b-private-owner-public-pins.json'
$enrollmentFile = Join-Path $base 'Enrollment\ql340b-signed-test-enrollment.json'
$serverFile = Join-Path $PSScriptRoot 'server.mjs'
$checkFile = Join-Path $PSScriptRoot 'ql340c-activation-check.mjs'
$evidenceDir = Join-Path $base 'Evidence'
$tlsCert = Join-Path $base 'TLS\comms-ql340b.crt'

function Get-ReceiverListeners {
    @(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
}

function Write-PrivateState($state, $extra = @{}) {
    $result = [ordered]@{
        schema = 'rosevear.hub.ql340c.private-operator.v1'
        state = $state
        computer = $env:COMPUTERNAME
        customerCommunications = $false
        deviceActions = $false
        credentialEncryptedOnDisk = [bool](Test-Path $credentialFile)
        signedEnrollmentPresent = [bool](Test-Path $enrollmentFile)
        ownerPublicPinsPresent = [bool](Test-Path $pinFile)
        localListenerCount = @(Get-ReceiverListeners).Count
    }
    foreach ($key in $extra.Keys) { $result[$key] = $extra[$key] }
    $result | ConvertTo-Json -Compress -Depth 5
}

function Secure-OwnerDirectory {
    if (-not (Test-Path $credentialDir)) {
        New-Item -ItemType Directory -Path $credentialDir | Out-Null
    }
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $grant = '{0}:(OI)(CI)F' -f $identity
    & icacls.exe $credentialDir /inheritance:r /grant:r $grant /remove:g '*S-1-1-0' '*S-1-5-32-545' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_PRIVATE_CREDENTIAL_ACL_FAILED' }
}

if ($SelfTest) {
    # This test uses a synthetic string, never the real connection secret.
    $secure = ConvertTo-SecureString 'synthetic-only-ql340c-DPAPI-test' -AsPlainText -Force
    $ciphertext = ConvertFrom-SecureString $secure
    $restored = ConvertTo-SecureString $ciphertext
    if ($restored.Length -ne $secure.Length) { throw 'HOLD_DPAPI_ROUNDTRIP_FAILED' }
    $secure.Dispose()
    $restored.Dispose()
    Write-PrivateState 'WINDOWS_CURRENT_USER_DPAPI_TEST_PASSED_NO_CREDENTIAL_STORED'
    exit 0
}

if ($StoreCredential) {
    Secure-OwnerDirectory
    if (Test-Path $credentialFile) { throw 'DENY_EXISTING_CREDENTIAL_NO_OVERWRITE' }
    $secure = Read-Host 'Private dedicated receiver PostgreSQL URL (hidden; never paste in chat)' -AsSecureString
    if ($secure.Length -lt 40) { throw 'DENY_MISSING_PRIVATE_POSTGRES_URL' }
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        if ($plain -notmatch '^postgres(?:ql)?://') { throw 'DENY_NON_POSTGRES_URL' }
        $uri = [Uri]$plain
        $userName = $uri.UserInfo.Split(':')[0]
        if ($userName -notin @('ql340c_private_receiver',
            'ql340c_private_receiver.gxujcwpktaickcgzyvnu')) {
            throw 'DENY_OVERPRIVILEGED_OR_WRONG_RECEIVER_ROLE'
        }
        if ($uri.Host -ne 'db.gxujcwpktaickcgzyvnu.supabase.co' -and
            $uri.Host -notmatch '^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$') {
            throw 'DENY_UNREVIEWED_POSTGRES_HOST'
        }
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        $plain = $null
    }
    $ciphertext = ConvertFrom-SecureString $secure
    $secure.Dispose()
    $bytes = [Text.Encoding]::UTF8.GetBytes($ciphertext)
    $stream = [IO.File]::Open($credentialFile, [IO.FileMode]::CreateNew,
        [IO.FileAccess]::Write, [IO.FileShare]::None)
    try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Dispose() }
    Write-PrivateState 'OWNER_DPAPI_CREDENTIAL_STORED_NO_DATABASE_LOGIN_ATTEMPTED'
    exit 0
}

if ($Stop) {
    $listeners = @(Get-ReceiverListeners)
    if ($listeners.Count -eq 0) {
        Write-PrivateState 'RECEIVER_ALREADY_OFF_NO_ACTIVE_STOP_WITNESS'
        exit 0
    }
    if ($listeners.Count -ne 1 -or $listeners[0].LocalAddress -ne '127.0.0.1') {
        throw 'DENY_UNKNOWN_RECEIVER_LISTENER'
    }
    $targetId = $listeners[0].OwningProcess
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $targetId"
    if (-not $process -or -not $process.CommandLine -or
        $process.CommandLine.IndexOf($serverFile, [StringComparison]::OrdinalIgnoreCase) -lt 0 -or
        $process.CommandLine.IndexOf($pinFile, [StringComparison]::OrdinalIgnoreCase) -lt 0 -or
        $process.CommandLine -notmatch '\-\-serve') {
        throw 'DENY_PROCESS_IDENTITY_NOT_RECEIVER'
    }
    Stop-Process -Id $targetId -ErrorAction Stop
    Start-Sleep -Milliseconds 500
    if (@(Get-ReceiverListeners).Count -ne 0) { throw 'HOLD_RECEIVER_STOP_NOT_VERIFIED' }
    $receipt = [ordered]@{
        schema = 'rosevear.hub.ql340c.stop-witness.v1'
        capturedAtUTC = (Get-Date).ToUniversalTime().ToString('o')
        computer = $env:COMPUTERNAME
        stoppedPid = $targetId
        verifiedServerPath = $serverFile
        receiverListenerCountAfter = 0
        state = 'FIELD_STOP_OBSERVED_INDEPENDENT_OWNER_REVIEW_REQUIRED'
        privateConnection = 'DISCONNECTED / HOLD'
    }
    if (-not (Test-Path $evidenceDir)) { throw 'HOLD_PRIVATE_EVIDENCE_DIRECTORY_MISSING' }
    $receiptPath = Join-Path $evidenceDir ('ql340c-stopped-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ') + '.json')
    $receipt | ConvertTo-Json -Depth 4 | Out-File -FilePath $receiptPath -NoClobber -Encoding UTF8
    Write-PrivateState 'FIELD_RECEIVER_STOPPED_REVIEW_REQUIRED' @{ stopReceiptPath = $receiptPath }
    exit 0
}

if ($Start) {
    if (-not (Test-Path $credentialFile)) { throw 'HOLD_PRIVATE_DATABASE_CREDENTIAL_REQUIRED' }
    if (-not (Test-Path $pinFile) -or -not (Test-Path $enrollmentFile)) {
        throw 'HOLD_TWO_ORIGINAL_OWNER_SIGNATURES_REQUIRED'
    }
    if (@(Get-ReceiverListeners).Count -ne 0) { throw 'DENY_RECEIVER_ALREADY_LISTENING' }
    if (-not (Test-Path $tlsCert)) { throw 'HOLD_VERIFIED_PRIVATE_TLS_CERT_REQUIRED' }
    $cert = [Security.Cryptography.X509Certificates.X509Certificate2]::new($tlsCert)
    if ($cert.NotBefore -gt (Get-Date) -or $cert.NotAfter -le (Get-Date) -or
        $cert.Subject -ne 'CN=desktop-ae894kc.tailc43957.ts.net') {
        throw 'HOLD_EXPIRED_OR_MISMATCHED_PRIVATE_TLS_CERT'
    }
    $serveStatus = (& tailscale.exe serve status | Out-String)
    if ($serveStatus -notmatch 'No serve config') { throw 'HOLD_TAILSCALE_INGRESS_REVIEW_REQUIRED' }
    & node $checkFile $enrollmentFile $pinFile
    if ($LASTEXITCODE -ne 0) { throw 'HOLD_INVALID_OR_EXPIRED_ORIGINAL_OWNER_ENROLLMENT' }
    $consent = Read-Host 'Type START_TEST_RECEIVER to launch foreground loopback-only TEST receiver'
    if ($consent -cne 'START_TEST_RECEIVER') { throw 'HOLD_OWNER_SUPERVISION_NOT_GRANTED' }
    Secure-OwnerDirectory
    $secure = (Get-Content -Raw $credentialFile).Trim() | ConvertTo-SecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    try {
        & node $serverFile --serve $pinFile
        if ($LASTEXITCODE -ne 0) { throw 'HOLD_SUPERVISED_RECEIVER_EXITED_WITH_FAILURE' }
    } finally {
        Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
        $secure.Dispose()
    }
    exit 0
}

Write-PrivateState 'RECEIVER_OFF_OR_REVIEW_REQUIRED_READ_ONLY'
