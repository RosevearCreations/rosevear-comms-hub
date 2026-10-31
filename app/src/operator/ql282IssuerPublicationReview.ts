import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL281_OBSERVED_AT,QL281_PUBLIC_SOURCE_RECHECK,QL281_REVIEWER_CHALLENGE_GATES,
  type Ql281ChallengeRequest} from './ql281SignatureProofCustody';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import type {Ql280AckClaim} from './ql280ReceiptReconciliation';

/** Read-only public GitHub main-ref and exact immutable original Proof-B GET results.
 * No app gateway, owner, reviewer, private signer or delivery service was accessed. */
export const QL282_OBSERVED_AT='2026-10-31T04:18:55Z';
export const QL282_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'73842314ae77af0826c6403d851dbdd58ae964fe',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'8eb27d14120e29afcd87141e7b26540e2ee105ff',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'414302a4160f06bde34d378596c3b7546f64f227',http:404},
  {source:'yw',repo:'yw',sha:'736c79f0ef76375b4ceea2db5921cabfc0c90fe9',http:404},
  {source:'icamp',repo:'iCamp',sha:'bcd5d0070692012badcf13f03026cd0e7448743b',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'99eb2b65a6e6ceb8e68c2b171113b0a40c58dae3',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL282_ISSUER_READINESS_GATES=[
  {id:'issuer-identity',label:'Independent challenge issuer original identity, role and authorized relying-party account authenticated',state:'NOT_AUTHENTICATED'},
  {id:'owner-scope',label:'Owner authorizes the exact TEST-only case, reviewer and limited recipient audience',state:'NOT_GIVEN'},
  {id:'issuer-pin',label:'Trusted issuer public key and separately witnessed SPKI fingerprint independently pinned',state:'NOT_VERIFIED'},
  {id:'nonce',label:'Issuer creates a unique unpredictable one-use challenge with replay protection',state:'NOT_ISSUED'},
  {id:'expiry',label:'Challenge expiry, timestamp ordering and restricted audience validated before issuance',state:'NOT_VALIDATED'},
  {id:'transport',label:'Original protected delivery path and recipient authentication independently approved',state:'NOT_APPROVED'},
  {id:'audit',label:'Issuer signature, reviewer response and witness custody audited against original challenge',state:'NOT_RECEIVED'}
] as const;

const ageHours=(start:string,asOf:Date|string):number|null=>{
  const elapsed=new Date(asOf).getTime()-new Date(start).getTime();
  return Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
};
const errorForReference=(raw:string):string|null=>{
  const ref=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(ref))
    return 'Enter only a nonsecret external case reference (5–32 letters, digits, underscores or dashes).';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(ref))
    return 'Do not enter credentials, signer keys or challenge secrets.';
  return null;
};

export type Ql282IssuerRequest={checkId:Ql281ChallengeRequest['checkId'];
  reviewerClaim:string;challengeRequestClaim:string;issuerReadinessReference:string;preparedAt:string;
  gates:typeof QL282_ISSUER_READINESS_GATES;verified:0;issuer:'NOT_AUTHENTICATED';
  nonce:'NOT_ISSUED';signature:'NOT_VERIFIED';ownerApproval:'NOT_GIVEN';
  disposition:'ISSUER_READINESS_REVIEW_ONLY';state:'DRAFT_NOT_SENT'};

export function ql282PrepareIssuerReview(challenge:Ql281ChallengeRequest,reference:string,now:Date):
  {ok:true;request:Ql282IssuerRequest}|{ok:false;reason:string} {
  if(!challenge||challenge.verified!==0||challenge.challenge!=='NOT_ISSUED'||challenge.signature!=='NOT_VERIFIED'||
    challenge.ownerAcceptance!=='NOT_GIVEN'||challenge.status!=='PRECONDITION_REQUEST_ONLY'||
    challenge.state!=='DRAFT_NOT_SENT'||!Array.isArray(challenge.requirements)||
    challenge.requirements.length!==QL281_REVIEWER_CHALLENGE_GATES.length||
    !challenge.requirements.every((row,index)=>row.id===QL281_REVIEWER_CHALLENGE_GATES[index].id&&
      row.status===QL281_REVIEWER_CHALLENGE_GATES[index].status))
    return {ok:false,reason:'Only an unissued, unsigned, unapproved QL-281 challenge request can enter issuer readiness review.'};
  const referenceError=errorForReference(reference);if(referenceError)return {ok:false,reason:referenceError};
  const previous=new Date(challenge.preparedAt).getTime();const current=now.getTime();
  if(!Number.isFinite(previous)||!Number.isFinite(current)||current<=previous)
    return {ok:false,reason:'Issuer readiness review must be prepared after its QL-281 request with a valid clock.'};
  return {ok:true,request:{checkId:challenge.checkId,reviewerClaim:challenge.reviewerReferenceClaim,
    challengeRequestClaim:challenge.challengeRequestReferenceClaim,issuerReadinessReference:reference.trim(),
    preparedAt:now.toISOString(),gates:QL282_ISSUER_READINESS_GATES,verified:0,issuer:'NOT_AUTHENTICATED',
    nonce:'NOT_ISSUED',signature:'NOT_VERIFIED',ownerApproval:'NOT_GIVEN',
    disposition:'ISSUER_READINESS_REVIEW_ONLY',state:'DRAFT_NOT_SENT'}};
}

export function ql282PinnedProofUrl(source:Ql270SourceId) {
  const row=QL282_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL282_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export type Ql282PublicationReason='SOURCE_SHA_MOVED_ORIGINAL_MISSING'|'UNCHANGED_SHA_ORIGINAL_MISSING';
export function ql282PublicationTriage(asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[]) {
  const snapshotAgeHours=ageHours(QL282_OBSERVED_AT,asOf);
  const freshness=snapshotAgeHours===null?'CLOCK_REVIEW' as const:
    snapshotAgeHours>=24?'PUBLIC_RECHECK_DUE' as const:'PINNED_RECENT' as const;
  const rows=QL282_PUBLIC_SOURCE_RECHECK.map(current=>{
    const previous=QL281_PUBLIC_SOURCE_RECHECK.find(old=>old.source===current.source);
    const related=notices.filter(claim=>claim.source===current.source&&claim.notice==='CLAIMED_NOT_CONFIRMED');
    const moved=previous?.sha!==current.sha;
    return {...current,previousSha:previous?.sha??null,previousHttp:previous?.http??null,moved,
      reason:(moved?'SOURCE_SHA_MOVED_ORIGINAL_MISSING':'UNCHANGED_SHA_ORIGINAL_MISSING') as Ql282PublicationReason,
      resolution:'PUBLICATION_EXCEPTION_OPEN' as const,authenticatedOriginal:false as const,
      notices:related.length,postSnapshotNotices:related.filter(claim=>new Date(claim.preparedAt).getTime()>new Date(QL282_OBSERVED_AT).getTime()).length,
      stalePinNotices:related.filter(claim=>claim.sha!==current.sha).length};
  });
  return {rows,observedAt:QL282_OBSERVED_AT,previousObservedAt:QL281_OBSERVED_AT,
    ageHours:snapshotAgeHours,freshness,nextRecheckAt:new Date(new Date(QL282_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    originalsAccepted:0,authenticatedSourceGets:0,release:'DISCONNECTED / HOLD' as const};
}

export type Ql282ExceptionDraft={source:Ql270SourceId;reason:Ql282PublicationReason;
  reference:string;sourceSha:string;observedAt:string;preparedAt:string;
  original:'HTTP_404_AT_IMMUTABLE_PIN';routed:false;resolved:false;state:'LOCAL_REVIEW_DRAFT'};

export function ql282PrepareException(source:Ql270SourceId,reference:string,now:Date):
  {ok:true;draft:Ql282ExceptionDraft}|{ok:false;reason:string} {
  const row=ql282PublicationTriage(now).rows.find(item=>item.source===source);
  if(!row)return {ok:false,reason:'Source must be one of the six registered immutable public Proof-B observations.'};
  const issue=errorForReference(reference);if(issue)return {ok:false,reason:issue};
  const time=now.getTime();
  if(!Number.isFinite(time)||time<new Date(QL282_OBSERVED_AT).getTime())
    return {ok:false,reason:'Exception triage cannot predate its actual public observation.'};
  return {ok:true,draft:{source,reason:row.reason,reference:reference.trim(),sourceSha:row.sha,
    observedAt:QL282_OBSERVED_AT,preparedAt:now.toISOString(),original:'HTTP_404_AT_IMMUTABLE_PIN',
    routed:false,resolved:false,state:'LOCAL_REVIEW_DRAFT'}};
}

/** Owner-directed workflow pause: this is a planning status only, not removal of source integration security gates. */
export const QL282_ACK_WORKSTREAM={name:'Six-App Acknowledgement Delivery Evidence Preconditions',
  status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',activeFollowup:false,
  deliveryEvidenceCollection:false,notificationEnabled:false,originalDeliveryVerified:0,
  ownerTestApproval:'NOT_GIVEN'} as const;

export function ql282AckParking(ackClaims:readonly Ql280AckClaim[]) {
  return QL270_SOURCES.map(source=>({source:source.id,label:source.label,
    legacyUnverifiedReferences:ackClaims.filter(claim=>claim.source===source.id).length,
    status:QL282_ACK_WORKSTREAM.status,disposition:QL282_ACK_WORKSTREAM.disposition,
    actionsEnabled:false,authenticatedDelivery:0}));
}

export function ql282AuditPacket(issuer:readonly Ql282IssuerRequest[],exceptions:readonly Ql282ExceptionDraft[],
  ackClaims:readonly Ql280AckClaim[],asOf:Date|string) {
  const report=ql282PublicationTriage(asOf);
  return [
    'QL-282 | ORIGINAL REVIEWER CHALLENGE ISSUER READINESS / PROOF-B PUBLICATION EXCEPTION TRIAGE',
    `Public immutable source check ${QL282_OBSERVED_AT}: ${report.moved} moved / ${report.unchanged} unchanged / ${report.missing}/6 HTTP 404 / ${report.freshness}`,
    ...report.rows.map(row=>`${row.repo}: ${row.previousSha} -> ${row.sha} / HTTP ${row.http} / ${row.reason} / ${row.resolution}`),
    ...issuer.map(row=>`Issuer review ${row.checkId} / ${row.issuerReadinessReference} / ${row.verified}/${row.gates.length} verified / ${row.issuer} / ${row.nonce} / ${row.state}`),
    ...exceptions.map(row=>`Publication exception ${row.source} / ${row.reference} / ${row.reason} / ${row.original} / NOT ROUTED / NOT RESOLVED`),
    `Six-app acknowledgement delivery evidence: ${QL282_ACK_WORKSTREAM.status} / ${QL282_ACK_WORKSTREAM.disposition} / owner-directed pause / ${ql282AckParking(ackClaims).reduce((sum,row)=>sum+row.legacyUnverifiedReferences,0)} previous unverified references / no active follow-up`,
    `Independent issuer readiness: 0/${QL282_ISSUER_READINESS_GATES.length} authenticated / original signed source Proof-B: 0/6 / actual gateway GETs: ${report.authenticatedSourceGets}`,
    'No challenge issued, reviewer response verified, acknowledgement delivered, external exception routed or owner TEST authorization granted.',
    'Underlying integrations: DISCONNECTED / HOLD. The acknowledgement review status changes workflow priority only; it does not release security controls.',
    'Local in-session reference-only copy, not an original signed receipt or an external audit trail.'
  ].join('\n');
}
