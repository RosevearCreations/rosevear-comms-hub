# QL-354: two-device original owner handoff, not an automated signing or login.
# Private credentials and owner Ed25519 keys NEVER leave their original Windows users.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='InspectSigned',Mandatory=$true)][switch]$InspectSigned,
    [Parameter(ParameterSetName='InspectSigned',Mandatory=$true)][string]$RequestPath,
    [Parameter(ParameterSetName='InspectSigned',Mandatory=$true)][string]$EvidencePathsFile
)
$ErrorActionPreference='Stop'
$isWindows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrEmpty($env:LOCALAPPDATA)
$ree=$isWindows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$jack=$isWindows -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'

function Read-Hold($state,$properties=@{}) {
    $result=[ordered]@{
        schema='rosevear.hub.ql354.original-owner-handoff.v1'
        state=$state
        originalReeHost=[bool]$ree
        independentJackHost=[bool]$jack
        originalIssuerIndependentlyAuthenticated=$false
        ownersIndependentlyApproved=$false
        databaseEnrollmentVerified=$false
        signedTestReceiptVerified=$false
        receiverActivated=$false
        customerCommunications=$false
        deviceActions=$false
        sourceRepositoryWrites=0
        connected=$false
        connectionState='DISCONNECTED / HOLD'
    }
    foreach($name in $properties.Keys){$result[$name]=$properties[$name]}
    $result | ConvertTo-Json -Compress -Depth 5
}

if(-not $ree -and -not $jack){
    if($InspectSigned){throw 'HOLD_ORIGINAL_REE_WINDOWS_HOST_REQUIRED_FOR_SIGNED_INTAKE'}
    Read-Hold 'HOLD_INDEPENDENT_ORIGINAL_OWNER_WINDOWS_HOST_REQUIRED_NO_ACTION'
    exit 0
}
$base=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
if($jack){
    $key=Join-Path $base 'OwnerAuthorities\master\master.private.pem'
    $candidate=Join-Path $base 'OwnerAuthorities\master\master.public-candidate.json'
    if($InspectSigned){throw 'HOLD_JACK_MASTER_REVIEW_ONLY_REE_ORIGINAL_INTAKE_REQUIRED'}
    Read-Hold 'JACK_MASTER_CUSTODY_OBSERVED_SEPARATE_OWNER_DECISION_PENDING' @{
        masterEncryptedKeyPresent=(Test-Path -LiteralPath $key -PathType Leaf)
        masterPublicCandidatePresent=(Test-Path -LiteralPath $candidate -PathType Leaf)
        privateKeyTransferred=$false
        nextAction='Jack reviews exact fresh 20-minute TEST request; use QL-340B --sign master only after independent issuer and witness review.'
    }
    exit 0
}

$sourceKey=Join-Path $base 'OwnerAuthorities\source\source.private.pem'
$source=Join-Path $base 'OwnerAuthorities\source\source.public-candidate.json'
$master=Join-Path $base 'Imports\jack-master.public-candidate.json'
$device=Join-Path $base 'ql339b-hub.public-candidate.json'
$signed=Join-Path $base 'Enrollment\ql340b-signed-test-enrollment.json'
$pins=Join-Path $base 'Enrollment\ql340b-private-owner-public-pins.json'
$credential=Join-Path $base 'Receiver\ql340c-database.dpapi'
$receiver=@(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
$lan=@(Get-NetTCPConnection -LocalAddress '192.168.68.74' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
$tailnet=@(Get-NetTCPConnection -LocalAddress '100.77.246.3' -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue)
if($InspectSigned){
    if($receiver.Count -ne 0){throw 'HOLD_RECEIVER_MUST_REMAIN_OFF_DURING_SIGNED_INTAKE'}
    foreach($file in @($RequestPath,$EvidencePathsFile,$signed,$pins,$device,$source,$master)){
        if(-not (Test-Path -LiteralPath $file -PathType Leaf)){
            throw 'HOLD_ORIGINAL_REQUEST_SIGNED_RECORD_PINS_AND_FOUR_WITNESSES_REQUIRED'
        }
    }
    & node (Join-Path $PSScriptRoot 'ql354-original-owner-intake.mjs') --inspect `
        $RequestPath $signed $pins $device $source $master $EvidencePathsFile
    if($LASTEXITCODE -ne 0){throw 'HOLD_SIGNED_INTAKE_REVIEW_FAILED'}
    exit 0
}
Read-Hold 'REE_ORIGINAL_OWNER_CUSTODY_PREFLIGHT_NO_UNSUPERVISED_ENROLLMENT' @{
    computer=$env:COMPUTERNAME
    originalLanListenerCount=$lan.Count
    tailnetTransportListenerCount=$tailnet.Count
    privateReceiverListenerCount=$receiver.Count
    sourceEncryptedKeyPresent=(Test-Path -LiteralPath $sourceKey -PathType Leaf)
    sourcePublicCandidatePresent=(Test-Path -LiteralPath $source -PathType Leaf)
    importedJackPublicCandidatePresent=(Test-Path -LiteralPath $master -PathType Leaf)
    originalDevicePublicCandidatePresent=(Test-Path -LiteralPath $device -PathType Leaf)
    signedOriginalEnrollmentPresent=(Test-Path -LiteralPath $signed -PathType Leaf)
    approvedOwnerPublicPinsFilePresent=(Test-Path -LiteralPath $pins -PathType Leaf)
    dedicatedDpapiCredentialPresent=(Test-Path -LiteralPath $credential -PathType Leaf)
    privateKeyTransferred=$false
    nextAction='Ree independently reviews original issuer and original field evidence, then prepares a fresh QL-340B TEST request for separate Ree source / Jack master decisions.'
}
