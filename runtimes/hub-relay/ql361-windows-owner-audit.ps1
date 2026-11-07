# QL-361 original Ree archive inspection, not an issuer/witness identity check.
# No private keys, DPAPI secrets, database connections, receiver start/stop,
# owner decisions or source grants. The independent signed audit occurs only
# through the private server verifier, never by this read-only field script.
[CmdletBinding(DefaultParameterSetName='Status')]
param(
    [Parameter(ParameterSetName='Status')][switch]$Status,
    [Parameter(ParameterSetName='ArchiveDigest',Mandatory=$true)][switch]$ArchiveDigest,
    [Parameter(ParameterSetName='ArchiveDigest',Mandatory=$true)][string]$ArchiveId
)
$ErrorActionPreference='Stop'
$ql361Windows=$env:OS -eq 'Windows_NT' -and -not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)
$ql361Ree=$ql361Windows -and $env:COMPUTERNAME -ieq 'DESKTOP-AE894KC' -and $env:USERNAME -ieq 'Ree'
$ql361Jack=$ql361Windows -and $env:COMPUTERNAME -ieq 'TEMPLAR' -and $env:USERNAME -ieq 'jfros'
function Write-Ql361Hold($state,$extra=@{}){
    $out=[ordered]@{
        schema='rosevear.hub.ql361.windows-original-archive-audit.v1'
        state=$state
        originalReeHost=[bool]$ql361Ree
        independentJackHost=[bool]$ql361Jack
        independentRedactionAuditVerified=$false
        originalIssuerAuthenticated=$false
        sourceOwnerSignaturesVerified=$false
        receiverActivated=$false
        connected=$false
        connectedCount=0
        connectionState='DISCONNECTED / HOLD'
        customerCommunications=$false
        deviceActions=$false
        sourceRepositoryWrites=0
    }
    foreach($key in $extra.Keys){$out[$key]=$extra[$key]}
    $out | ConvertTo-Json -Compress -Depth 5
}
if(-not $ql361Ree -and -not $ql361Jack){
    if($ArchiveDigest){throw 'DENY_QL361_ONLY_ORIGINAL_REE_CAN_READ_PRIVATE_ARCHIVE'}
    Write-Ql361Hold 'HOLD_NONORIGINAL_WINDOWS_CI_STATUS_ONLY'
    exit 0
}
if($ArchiveDigest){
    if(-not $ql361Ree){throw 'DENY_QL361_JACK_CANNOT_READ_REE_PRIVATE_ARCHIVE'}
    if($ArchiveId -notmatch '^ql360-[0-9a-f-]{36}\.json$'){
        throw 'DENY_QL361_INVALID_ORIGINAL_ARCHIVE_NAME'
    }
    $folder=Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay\Evidence\Ql360Archive'
    $path=Join-Path $folder $ArchiveId
    if(-not (Test-Path -LiteralPath $path -PathType Leaf)){
        throw 'HOLD_QL361_ORIGINAL_ARCHIVE_NOT_FOUND'
    }
    $record=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if($record.evidence.schema -ne 'rosevear.hub.ql360.original-private-evidence-archive.v1' -or
        $record.evidence.kind -ne 'ORIGINAL_POST_TEST_PRIVATE_EVIDENCE_ONLY' -or
        $record.evidence.peerCount -ne 6 -or
        $record.evidence.connectedCount -ne 0 -or
        $record.evidenceSha256 -notmatch '^[0-9a-f]{64}$'){
        throw 'DENY_QL361_ARCHIVE_NOT_AN_ORIGINAL_HELD_POST_TEST_SNAPSHOT'
    }
    $fileSha=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Ql361Hold 'ORIGINAL_ARCHIVE_FILE_DIGEST_FOR_EXTERNAL_OWNER_AUDIT_NOT_AUTHENTICATED' @{
        archiveId=$ArchiveId
        fileSha256=$fileSha
        claimedCanonicalEvidenceSha256=$record.evidenceSha256
        nextAction='An independent pinned auditor must cryptographically review the exact canonical evidence and sign the redaction report. File presence and this checksum grant no source access.'
    }
    exit 0
}
Write-Ql361Hold 'ORIGINAL_SIX_SOURCE_CANDIDATE_AUDIT_PENDING_INDEPENDENT_SIGNATURE' @{
    computer=$env:COMPUTERNAME
    role=$(if($ql361Ree){'source'}else{'master'})
    nextAction='After genuine QL-360 private archive and witnessed STOP, Ree can use -ArchiveDigest -ArchiveId ql360-...json for local audit reference. Jack independently reviews but cannot read Ree private archive.'
}
