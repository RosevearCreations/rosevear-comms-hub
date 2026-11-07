# QL-359: original authority field review + owner-supervised private TEST.
# Read-only wrapper. It NEVER enrolls a signer, grants a role, imports keys,
# stores a credential, starts/stops a listener, or sends a network request.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='OwnerReview',Mandatory=$true)][switch]$OwnerReview,
    [Parameter(ParameterSetName='OwnerReview',Mandatory=$true)][string]$RequestPath,
    [Parameter(ParameterSetName='OwnerReview')][string]$EvidencePathsFile,
    [Parameter(ParameterSetName='CredentialReadback',Mandatory=$true)][switch]$CredentialReadback,
    [Parameter(ParameterSetName='StopWitness',Mandatory=$true)][switch]$StopWitness,
    [Parameter(ParameterSetName='ReceiptReview',Mandatory=$true)][switch]$ReceiptReview,
    [Parameter(ParameterSetName='ReceiptReview',Mandatory=$true)][string]$OriginalPacketPath,
    [Parameter(ParameterSetName='ReceiptReview',Mandatory=$true)][string]$OwnerReviewPath
)
$ErrorActionPreference='Stop'
$ql359Windows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)
$ql359Ree=$ql359Windows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$ql359Jack=$ql359Windows -and $env:COMPUTERNAME -ieq 'Templar' -and $env:USERNAME -ieq 'jfros'
function Write-Ql359Hold($state,$extra=@{}) {
    $out=[ordered]@{
        schema='rosevear.hub.ql359.windows-supervised-test.v1'
        state=$state
        originalReeHost=[bool]$ql359Ree
        independentJackHost=[bool]$ql359Jack
        originalIssuerAuthenticated=$false
        independentWitnessAuthenticated=$false
        ownersIndependentlyApproved=$false
        databaseEnrollmentVerified=$false
        dedicatedReceiverCredentialVerified=$false
        firstPrivateTestReceiptVerified=$false
        receiverActivated=$false
        connected=$false
        connectionState='DISCONNECTED / HOLD'
        customerCommunications=$false
        deviceActions=$false
        sourceRepositoryWrites=0
    }
    foreach($item in $extra.Keys){$out[$item]=$extra[$item]}
    $out | ConvertTo-Json -Depth 6 -Compress
}
if(-not $ql359Ree -and -not $ql359Jack){
    if($OwnerReview -or $CredentialReadback -or $StopWitness -or $ReceiptReview){
        throw 'DENY_QL359_ONLY_ORIGINAL_REE_JACK_WINDOWS_ACCOUNTS'
    }
    Write-Ql359Hold 'HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY'
    exit 0
}
$ql359Base=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$ql359Role=if($ql359Ree){'source'}else{'master'}
$ql359Candidate=Join-Path $ql359Base "OwnerAuthorities\$ql359Role\$ql359Role.public-candidate.json"
$ql359Pins=Join-Path $ql359Base 'Enrollment\ql340b-private-owner-public-pins.json'
$ql359Signed=Join-Path $ql359Base 'Enrollment\ql340b-signed-test-enrollment.json'
$ql359Credential=Join-Path $ql359Base 'Receiver\ql340c-database.dpapi'
$ql359Listeners=@()
if($ql359Ree){
    $ql359Listeners=@(Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue)
}
if($OwnerReview){
    if(-not (Test-Path -LiteralPath $RequestPath -PathType Leaf)){
        throw 'HOLD_ORIGINAL_FRESH_TEST_REQUEST_REQUIRED'
    }
    $args359=@('-ReviewRequest','-RequestPath',$RequestPath)
    if($ql359Ree){
        if(-not $EvidencePathsFile -or -not (Test-Path -LiteralPath $EvidencePathsFile -PathType Leaf)){
            throw 'HOLD_REE_FOUR_ORIGINAL_WITNESSES_REQUIRED'
        }
        $args359+=@('-EvidencePathsFile',$EvidencePathsFile)
    }elseif($EvidencePathsFile){
        throw 'DENY_JACK_MUST_NOT_IMPORT_REE_ORIGINAL_WITNESS_FILES'
    }
    & (Join-Path $PSScriptRoot 'ql358-windows-original-field.ps1') @args359
    if($LASTEXITCODE -ne 0){throw 'HOLD_PUBLIC_REQUEST_DIGEST_NOT_VERIFIED'}
    exit 0
}
if($CredentialReadback -or $StopWitness -or $ReceiptReview){
    if(-not $ql359Ree){throw 'DENY_QL359_ONLY_ORIGINAL_REE_MAY_READ_RECEIVER'}
    if($ql359Listeners.Count -ne 0){
        throw 'HOLD_QL359_STOP_ORIGINAL_RECEIVER_BEFORE_FIELD_RECONCILIATION'
    }
    if($CredentialReadback){
        & (Join-Path $PSScriptRoot 'ql358-windows-original-field.ps1') -CredentialHandoff
        if($LASTEXITCODE -ne 0){throw 'HOLD_QL359_ORIGINAL_RECEIVER_CREDENTIAL_FIELD'}
        exit 0
    }
    if($StopWitness){
        Write-Ql359Hold 'ORIGINAL_REE_LOCAL_RECEIVER_STOP_OBSERVED_EXTERNAL_WITNESS_STILL_REQUIRED' @{
            localReceiverPort=8788
            localListenerCount=$ql359Listeners.Count
            originalSignedEnrollmentPresent=(Test-Path -LiteralPath $ql359Signed -PathType Leaf)
            approvedPublicPinsPresent=(Test-Path -LiteralPath $ql359Pins -PathType Leaf)
            currentUserDpapiCredentialPresent=(Test-Path -LiteralPath $ql359Credential -PathType Leaf)
            nextAction='Independently authenticate original field witness and verify exact signed device packet and immutable PostgreSQL receipt; local port absence alone is not proof.'
        }
        exit 0
    }
    & (Join-Path $PSScriptRoot 'ql358-windows-original-field.ps1') -VerifyReceipt `
      -OriginalPacketPath $OriginalPacketPath -OwnerReviewPath $OwnerReviewPath
    if($LASTEXITCODE -ne 0){throw 'HOLD_QL359_ORIGINAL_SIGNED_POST_TEST_RECEIPT_NOT_VERIFIED'}
    exit 0
}
Write-Ql359Hold 'ORIGINAL_AUTHORITY_REVIEW_PENDING_NO_UNSUPERVISED_PRIVATE_TEST' @{
    computer=$env:COMPUTERNAME
    localRole=$ql359Role
    originalPublicCandidatePresent=(Test-Path -LiteralPath $ql359Candidate -PathType Leaf)
    originalSignedEnrollmentPresent=($ql359Ree -and (Test-Path -LiteralPath $ql359Signed -PathType Leaf))
    approvedPublicPinsPresent=($ql359Ree -and (Test-Path -LiteralPath $ql359Pins -PathType Leaf))
    currentUserDpapiCredentialPresent=($ql359Ree -and (Test-Path -LiteralPath $ql359Credential -PathType Leaf))
    localReceiverListenerCount=$ql359Listeners.Count
    nextAction='Independent issuer/witness original pin authentication, fresh exact QL-340B request, separate Ree and Jack signed owner decisions, then original administrator and Ree-only supervised private TEST.'
}
