# QL-356: original owner field review. No private key loading, signing,
# database credential handling, service lifecycle or firewall changes.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='ReviewRequest',Mandatory=$true)][switch]$ReviewRequest,
    [Parameter(ParameterSetName='PrepareUnsigned',Mandatory=$true)][switch]$PrepareUnsigned,
    [Parameter(ParameterSetName='ReviewRequest',Mandatory=$true)]
    [Parameter(ParameterSetName='PrepareUnsigned',Mandatory=$true)][string]$RequestPath,
    [Parameter(ParameterSetName='ReviewRequest')]
    [Parameter(ParameterSetName='PrepareUnsigned',Mandatory=$true)][string]$EvidencePathsFile
)
$ErrorActionPreference='Stop'
$ql356Windows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)
$ree=$ql356Windows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$ql356Windows -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
$readOnlyState=[ordered]@{
    schema='rosevear.hub.ql356.windows-field-handoff.v1'
    state='HOLD_ORIGINAL_OWNER_MACHINE_REQUIRED'
    originalReeHost=[bool]$ree
    independentJackHost=[bool]$jack
    originalIssuerIndependentlyAuthenticated=$false
    independentWitnessAuthenticated=$false
    ownersIndependentlyApproved=$false
    databaseEnrollmentVerified=$false
    signedReceiptVerified=$false
    receiverActivated=$false
    customerCommunications=$false
    deviceActions=$false
    sourceRepositoryWrites=0
    connected=$false
    connectionState='DISCONNECTED / HOLD'
}
function Show-State($state,$properties=@{}) {
    $output=[ordered]@{}
    foreach($key in $readOnlyState.Keys){$output[$key]=$readOnlyState[$key]}
    $output.state=$state
    foreach($key in $properties.Keys){$output[$key]=$properties[$key]}
    $output | ConvertTo-Json -Compress -Depth 6
}
if(-not $ree -and -not $jack){
    if($ReviewRequest -or $PrepareUnsigned){throw 'DENY_NONORIGINAL_WINDOWS_FIELD_ACTION'}
    Show-State 'HOLD_NONORIGINAL_CI_HOST_NO_ACTION'
    exit 0
}
$base=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$role=if($ree){'source'}else{'master'}
$candidate=Join-Path $base "OwnerAuthorities\$role\$role.public-candidate.json"
$key=Join-Path $base "OwnerAuthorities\$role\$role.private.pem"
$receiver=@()
$lan=@()
$tailnet=@()
if($ree){
    $receiver=@(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
    $lan=@(Get-NetTCPConnection -LocalAddress '192.168.68.74' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
    $tailnet=@(Get-NetTCPConnection -LocalAddress '100.77.246.3' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
}
if($ReviewRequest){
    if(-not (Test-Path -LiteralPath $candidate -PathType Leaf)){
        throw 'HOLD_ORIGINAL_LOCAL_OWNER_PUBLIC_CANDIDATE_REQUIRED'
    }
    if(-not (Test-Path -LiteralPath $RequestPath -PathType Leaf)){
        throw 'HOLD_FRESH_UNSIGNED_TEST_REQUEST_REQUIRED'
    }
    $argsList=@((Join-Path $PSScriptRoot 'ql356-original-field-readback.mjs'),
        '--inspect-request',$role,$RequestPath,$candidate)
    if(-not [string]::IsNullOrWhiteSpace($EvidencePathsFile)){
        if(-not (Test-Path -LiteralPath $EvidencePathsFile -PathType Leaf)){
            throw 'HOLD_ORIGINAL_FOUR_EVIDENCE_PATHS_REQUIRED'
        }
        $argsList+=@($EvidencePathsFile)
    }
    & node @argsList
    if($LASTEXITCODE -ne 0){throw 'HOLD_FIELD_REQUEST_INSPECTION_FAILED'}
    exit 0
}
if($PrepareUnsigned){
    if(-not $ree){throw 'DENY_JACK_CANNOT_PREPARE_ORIGINAL_SOURCE_REQUEST'}
    if($receiver.Count -ne 0 -or $tailnet.Count -ne 0){
        throw 'HOLD_ORIGINAL_RECEIVER_AND_TRANSPORT_MUST_REMAIN_OFF_DURING_REVIEW'
    }
    if($lan.Count -ne 1){throw 'HOLD_ORIGINAL_LAN_SERVICE_IDENTITY_REQUIRED'}
    $device=Join-Path $base 'ql339b-hub.public-candidate.json'
    $master=Join-Path $base 'Imports\jack-master.public-candidate.json'
    foreach($file in @($candidate,$key,$device,$master,$EvidencePathsFile)){
        if(-not (Test-Path -LiteralPath $file -PathType Leaf)){
            throw 'HOLD_REAL_OWNER_CANDIDATES_AND_FOUR_ORIGINAL_WITNESS_PATHS_REQUIRED'
        }
    }
    $requestFull=[IO.Path]::GetFullPath($RequestPath)
    if(Test-Path -LiteralPath $requestFull){throw 'DENY_EXISTING_REVIEW_REQUEST_NO_OVERWRITE'}
    if(-not (Test-Path -LiteralPath (Split-Path -Parent $requestFull) -PathType Container)){
        throw 'HOLD_EXISTING_OWNER_CONTROLLED_OUTPUT_DIRECTORY_REQUIRED'
    }
    $answer=Read-Host 'Type PREPARE_QL356_UNSIGNED_TEST_ONLY (no signature or receiver start)'
    if($answer -cne 'PREPARE_QL356_UNSIGNED_TEST_ONLY'){
        throw 'DENY_OWNER_DID_NOT_AUTHORIZE_PUBLIC_REQUEST_PREPARATION'
    }
    & node (Join-Path $PSScriptRoot 'ql340b-ceremony.mjs') --prepare `
        $device $candidate $master $EvidencePathsFile $requestFull
    if($LASTEXITCODE -ne 0){throw 'HOLD_PUBLIC_REQUEST_PREPARATION_FAILED'}
    exit 0
}
$nextAction=if($ree){
    'Ree prepares one unsigned 20-minute review request ONLY after locating all four original witness files and coordinating a live independent review window.'
}else{
    'Jack inspects Ree public request against his own master candidate; do not sign before authentic independent issuer and field-witness decisions.'
}
Show-State 'LOCAL_OWNER_CUSTODY_ONLY_INDEPENDENT_ISSUER_AND_SIGNED_ENROLLMENT_HELD' @{
    role=$role
    localEncryptedKeyPresent=(Test-Path -LiteralPath $key -PathType Leaf)
    localPublicCandidatePresent=(Test-Path -LiteralPath $candidate -PathType Leaf)
    originalLanListenerCount=$lan.Count
    originalReceiverListenerCount=$receiver.Count
    originalTailnetListenerCount=$tailnet.Count
    firstSafeAction=$nextAction
}
