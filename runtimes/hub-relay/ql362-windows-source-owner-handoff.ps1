# QL-362: read-only original-owner field review for the ONE-source TEST gate.
# No signing, secret import, DB role grant, browser endpoint, client messages,
# receiver start, source HTTP request or cross-app entitlement update.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='CandidateReadback',Mandatory=$true)][switch]$CandidateReadback,
    [Parameter(ParameterSetName='CandidateReadback',Mandatory=$true)][string]$HandoffId,
    [Parameter(ParameterSetName='CandidateReadback',Mandatory=$true)][ValidateSet('yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub')][string]$SourceId
)
$ErrorActionPreference='Stop'
$ql362Windows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)
$ql362Ree=$ql362Windows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$ql362Jack=$ql362Windows -and $env:COMPUTERNAME -ieq 'TEMPLAR' -and $env:USERNAME -ieq 'jfros'
function Write-Ql362Hold($state,$extra=@{}){
    $result=[ordered]@{
        schema='rosevear.hub.ql362.windows-source-only-handoff.v1'
        state=$state
        originalReeHost=[bool]$ql362Ree
        independentJackHost=[bool]$ql362Jack
        originalIssuerAuthenticated=$false
        sourceOwnerSignedPermissionVerified=$false
        masterOwnerSignedPermissionVerified=$false
        singleUseGetApproved=$false
        connected=$false
        connectionState='DISCONNECTED / HOLD'
        customerCommunications=$false
        deviceActions=$false
        sourceRepositoryWrites=0
    }
    foreach($item in $extra.Keys){$result[$item]=$extra[$item]}
    $result | ConvertTo-Json -Compress -Depth 6
}
if(-not $ql362Ree -and -not $ql362Jack){
    if($CandidateReadback){throw 'DENY_QL362_CANDIDATE_REQUIRES_ORIGINAL_REE_ACCOUNT'}
    Write-Ql362Hold 'HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY'
    exit 0
}
if($CandidateReadback){
    if(-not $ql362Ree){throw 'DENY_QL362_JACK_CANNOT_READ_REE_PRIVATE_HANDOFF'}
    if($HandoffId -notmatch '^ql361-[0-9a-f-]{36}\.json$'){
        throw 'DENY_QL362_INVALID_PRIVATE_HANDOFF_NAME'
    }
    $directory=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay\Evidence\Ql361Handoff'
    $path=Join-Path $directory $HandoffId
    if(-not (Test-Path -LiteralPath $path -PathType Leaf)){
        throw 'HOLD_QL362_ORIGINAL_PRIVATE_HANDOFF_MISSING'
    }
    $stored=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    $candidate=@($stored.handoff.candidates | Where-Object { $_.peerId -ceq $SourceId })
    if($stored.handoff.schema -ne 'rosevear.hub.ql361.archived-chain-redaction-handoff.v1' -or
        $stored.handoff.kind -ne 'OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY' -or
        $stored.handoff.candidateCount -ne 6 -or
        $stored.handoff.connectedCount -ne 0 -or
        $stored.handoffSha256 -notmatch '^[0-9a-f]{64}$' -or
        $candidate.Count -ne 1 -or
        $candidate[0].state -ne 'AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE' -or
        $candidate[0].sourceTestAuthorized -ne $false -or
        $candidate[0].customerDataAllowed -ne $false){
        throw 'DENY_QL362_NOT_AN_ORIGINAL_HELD_SOURCE_CANDIDATE'
    }
    Write-Ql362Hold 'ORIGINAL_ONE_SOURCE_CANDIDATE_LOCAL_READ_ONLY_FOR_SEPARATE_OWNER_SIGNATURES' @{
        handoffId=$HandoffId
        sourceId=$SourceId
        handoffFileSha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        claimedCanonicalHandoffSha256=$stored.handoffSha256
        proposedMethod='GET'
        proposedPath='/api/integration/v1/shell/health'
        nextAction='Independently authenticate the original QL-361 auditor, exact source signer, source owner and separate master owner. Sign the same fresh QL-362 one-GET request offline; this status output authorizes nothing.'
    }
    exit 0
}
$ql362ListenerCount=0
$ql362GatewayCount=0
if($ql362Ree){
    $ql362ListenerCount=@(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue).Count
    $ql362GatewayCount=@(Get-NetTCPConnection -LocalAddress '100.77.246.3' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue).Count
}
Write-Ql362Hold 'ORIGINAL_SOURCE_OWNER_AND_MASTER_OWNER_OFFLINE_TEST_SIGNATURES_REQUIRED' @{
    computer=$env:COMPUTERNAME
    role=$(if($ql362Ree){'source'}else{'master'})
    privateReceiverListenerCount=$ql362ListenerCount
    tailnetGatewayListenerCount=$ql362GatewayCount
    nextAction='After a genuine QL-361 private handoff, Ree may use -CandidateReadback for one known source. Jack separately reviews the exact scoped GET; neither file presence nor port status is independent authorization.'
}
