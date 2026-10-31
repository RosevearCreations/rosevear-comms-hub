import { QL270_SOURCES,type Ql270SourceId } from './ql270ConnectionCentre';
import { QL280_OBSERVED_AT,QL280_PUBLIC_SOURCE_RECHECK,QL280_REVIEWER_RECEIPT_PRECONDITIONS,
  type Ql280ReviewerReceiptClaim,type Ql280AckClaim } from './ql280ReceiptReconciliation';
import type { Ql279ArrivalClaim,Ql279EscalationDraft } from './ql279ReviewerCustodyEscalation';

/** Observed using read-only GitHub main refs and each exact immutable original-proof path.
 * No authenticated source, owner, reviewer, custodian, relay or delivery endpoint was contacted. */
export const QL281_OBSERVED_AT='2026-10-31T03:45:13Z';
export const QL281_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'73842314ae77af0826c6403d851dbdd58ae964fe',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'9899c273cd41b8cfaf6072809f969954e8303d84',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'64829e2d8ebdc49d069fb580c482fcd126af0e1e',http:404},
  {source:'yw',repo:'yw',sha:'736c79f0ef76375b4ceea2db5921cabfc0c90fe9',http:404},
  {source:'icamp',repo:'iCamp',sha:'883ee518e805253f45c316ce380ba13723182ff3',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'1eb0b0216c6d26e7de795339d7e3dbd6ebb9224b',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

const DAY_MS=86_400_000;
const hoursBetween=(from:string,asOf:Date|string):number|null=>{
  const elapsed=new Date(asOf).getTime()-new Date(from).getTime();
  return Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
};
function referenceProblem(value:string):string|null {
  const reference=value.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(reference))return 'Use a nonsecret external reference of 5–32 letters, digits, dashes or underscores.';
  if(/^(?:sk[-_]|pk[-_]|secret|password|token|bearer|api[-_]?key)/i.test(reference))return 'Never enter signer keys, challenge secrets, passwords or credentials.';
  return null;
}

export const QL281_REVIEWER_CHALLENGE_GATES=[
  {id:'reviewer',label:'Independent reviewer identity, role, separation from owner and signer authority authenticated',status:'NOT_AUTHENTICATED'},
  {id:'issuer',label:'Original challenge issuer authority, intended review case and relying-party scope independently verified',status:'NOT_VERIFIED'},
  {id:'nonce',label:'Fresh unpredictable original challenge, unique nonce, expiry and single-use replay protection established',status:'NOT_ISSUED'},
  {id:'document',label:'Original signed reviewer disposition and raw content digest match the exact retest case',status:'NOT_RECEIVED'},
  {id:'signature',label:'Challenge response cryptographically verified with a separately pinned reviewer key and matching identity',status:'NOT_VERIFIED'},
  {id:'witness',label:'Independent on-device accessibility witness, timeline and preserved custody chain reconciled',status:'NOT_VERIFIED'},
  {id:'owner',label:'Separately authenticated owner accessibility acceptance and TEST-only authorization recorded',status:'NOT_GIVEN'}
] as const;

export type Ql281ChallengeRequest={checkId:Ql280ReviewerReceiptClaim['checkId'];reviewerReferenceClaim:string;
  originalReceiptReferenceClaim:string;challengeRequestReferenceClaim:string;preparedAt:string;
  requirements:typeof QL281_REVIEWER_CHALLENGE_GATES;verified:0;challenge:'NOT_ISSUED';
  signature:'NOT_VERIFIED';ownerAcceptance:'NOT_GIVEN';status:'PRECONDITION_REQUEST_ONLY';state:'DRAFT_NOT_SENT'};

export function ql281PrepareChallengeRequest(receipt:Ql280ReviewerReceiptClaim,reference:string,now:Date):
  {ok:true;request:Ql281ChallengeRequest}|{ok:false;reason:string} {
  if(!receipt||receipt.verified!==0||receipt.authentication!=='NOT_PERFORMED'||
    receipt.acceptance!=='BLOCKED_PENDING_ORIGINAL_SIGNED_REVIEW'||receipt.state!=='DRAFT_NOT_SENT'||
    receipt.preconditions?.length!==QL280_REVIEWER_RECEIPT_PRECONDITIONS.length||
    !receipt.preconditions.every((gate,index)=>gate.key===QL280_REVIEWER_RECEIPT_PRECONDITIONS[index].key&&
      gate.state===QL280_REVIEWER_RECEIPT_PRECONDITIONS[index].state))
    return {ok:false,reason:'Use an unverified QL-280 reviewer receipt reference claim, never an accepted or altered receipt.'};
  const problem=referenceProblem(reference);if(problem)return {ok:false,reason:problem};
  const prepared=now.getTime();const previous=new Date(receipt.preparedAt).getTime();
  if(!Number.isFinite(prepared)||!Number.isFinite(previous)||prepared<=previous)
    return {ok:false,reason:'Challenge request must follow the original QL-280 reference claim with a valid clock.'};
  return {ok:true,request:{checkId:receipt.checkId,reviewerReferenceClaim:receipt.reviewerReferenceClaim,
    originalReceiptReferenceClaim:receipt.receiptReferenceClaim,challengeRequestReferenceClaim:reference.trim(),
    preparedAt:now.toISOString(),requirements:QL281_REVIEWER_CHALLENGE_GATES,verified:0,
    challenge:'NOT_ISSUED',signature:'NOT_VERIFIED',ownerAcceptance:'NOT_GIVEN',
    status:'PRECONDITION_REQUEST_ONLY',state:'DRAFT_NOT_SENT'}};
}

export function ql281PinnedProofUrl(source:Ql270SourceId) {
  const item=QL281_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source);
  if(!item)throw Error('UNKNOWN_QL281_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${item.repo}/contents/docs/integration/ql246-source-proof.json?ref=${item.sha}`;
}

export function ql281PublicationDiff(asOf:Date|string,claims:readonly Ql279ArrivalClaim[]=[]) {
  const snapshotAgeHours=hoursBetween(QL281_OBSERVED_AT,asOf);
  const freshness=snapshotAgeHours===null?'CLOCK_REVIEW' as const:
    snapshotAgeHours>=24?'PUBLIC_RECHECK_DUE' as const:'PINNED_RECENT' as const;
  const rows=QL281_PUBLIC_SOURCE_RECHECK.map(current=>{
    const previous=QL280_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const notices=claims.filter(row=>row.source===current.source&&row.notice==='CLAIMED_NOT_CONFIRMED');
    return {...current,previousSha:previous?.sha??null,previousHttp:previous?.http??null,
      shaMoved:current.sha!==previous?.sha,
      publication:'ORIGINAL_PROOF_NOT_PUBLISHED_AT_PIN' as const,
      noticeCount:notices.length,
      postSnapshotNotices:notices.filter(row=>new Date(row.preparedAt).getTime()>new Date(QL281_OBSERVED_AT).getTime()).length,
      obsoleteNotices:notices.filter(row=>row.sha!==current.sha).length,
      originalVerified:false as const};
  });
  return {rows,snapshotAgeHours,freshness,observedAt:QL281_OBSERVED_AT,
    priorObservedAt:QL280_OBSERVED_AT,nextRecheckAt:new Date(new Date(QL281_OBSERVED_AT).getTime()+DAY_MS).toISOString(),
    moved:rows.filter(row=>row.shaMoved).length,unchanged:rows.filter(row=>!row.shaMoved).length,
    missing:rows.filter(row=>row.http===404).length,sourceCount:QL270_SOURCES.length,
    originalSignedProofsAccepted:0,authenticatedGatewayGets:0,release:'DISCONNECTED / HOLD' as const};
}

export const QL281_ACK_CUSTODY_GATES=[
  {id:'outbound',label:'Original outbound escalation and delivery transport receipt, not a browser draft',status:'NOT_RECORDED'},
  {id:'recipient',label:'Authorized source maintainer/custodian recipient identity and delivery endpoint independently verified',status:'NOT_VERIFIED'},
  {id:'reply',label:'Original acknowledgement response and immutable reply digest obtained',status:'NOT_RECEIVED'},
  {id:'signer',label:'Response signature and separately pinned recipient signer identity verified',status:'NOT_VERIFIED'},
  {id:'chain',label:'Message, acknowledgement, case, source SHA and custody chronology matched without gaps',status:'NOT_VERIFIED'},
  {id:'owner',label:'Independent owner approval, retention decision and TEST authorization recorded',status:'NOT_GIVEN'}
] as const;

export type Ql281AckCustodyRequest={source:Ql270SourceId;escalationReason:Ql280AckClaim['escalationReason'];
  acknowledgementReferenceClaim:string;custodyReferenceClaim:string;preparedAt:string;
  gates:typeof QL281_ACK_CUSTODY_GATES;verified:0;delivery:'NOT_RECORDED';
  response:'NOT_RECEIVED';acceptance:'BLOCKED_PENDING_ORIGINAL_CUSTODY';state:'DRAFT_NOT_SENT'};

export function ql281PrepareAckCustody(claim:Ql280AckClaim,reference:string,now:Date):
  {ok:true;request:Ql281AckCustodyRequest}|{ok:false;reason:string} {
  if(!claim||claim.state!=='DRAFT_NOT_SENT'||claim.delivery!=='NOT_RECORDED'||
    claim.acknowledgement!=='REFERENCE_CLAIM_UNVERIFIED'||claim.accepted!==false)
    return {ok:false,reason:'Use a QL-280 unverified acknowledgement reference claim; actual delivery and custody remain absent.'};
  const problem=referenceProblem(reference);if(problem)return {ok:false,reason:problem};
  const prepared=now.getTime();const previous=new Date(claim.preparedAt).getTime();
  if(!Number.isFinite(prepared)||!Number.isFinite(previous)||prepared<=previous)
    return {ok:false,reason:'Custody request must follow the acknowledgement claim with a valid clock.'};
  if(!QL281_PUBLIC_SOURCE_RECHECK.some(row=>row.source===claim.source))
    return {ok:false,reason:'Acknowledgement source is not one of six registered applications.'};
  return {ok:true,request:{source:claim.source,escalationReason:claim.escalationReason,
    acknowledgementReferenceClaim:claim.receiptReferenceClaim,custodyReferenceClaim:reference.trim(),
    preparedAt:now.toISOString(),gates:QL281_ACK_CUSTODY_GATES,verified:0,
    delivery:'NOT_RECORDED',response:'NOT_RECEIVED',acceptance:'BLOCKED_PENDING_ORIGINAL_CUSTODY',state:'DRAFT_NOT_SENT'}};
}

export function ql281CustodyQueue(ack:readonly Ql280AckClaim[],drafts:readonly Ql279EscalationDraft[]) {
  return QL281_PUBLIC_SOURCE_RECHECK.map(row=>{
    const candidates=ack.filter(item=>item.source===row.source);
    const sourceDrafts=drafts.filter(item=>item.source===row.source&&item.state==='DRAFT_NOT_SENT');
    return {source:row.source,ackReferenceClaims:candidates.length,unsentEscalations:sourceDrafts.length,
      originalOutboundReceipts:0,authenticatedResponses:0,custodyVerified:false,
      status:candidates.length?'REFERENCE_CLAIM_CUSTODY_UNVERIFIED' as const:'AWAITING_REFERENCE_CLAIM' as const};
  });
}

export function ql281AuditPacket(challenges:readonly Ql281ChallengeRequest[],custody:readonly Ql281AckCustodyRequest[],
  claims:readonly Ql280AckClaim[],escalations:readonly Ql279EscalationDraft[],asOf:Date|string) {
  const proof=ql281PublicationDiff(asOf);
  return [
    'QL-281 | INDEPENDENT REVIEWER SIGNATURE CHALLENGE / PROOF-B FRESHNESS / ESCALATION ACK CUSTODY | HELD',
    `Public immutable proof snapshot ${QL281_OBSERVED_AT}: ${proof.moved} moved / ${proof.unchanged} unchanged / ${proof.missing}/6 original Proof-B HTTP 404 / ${proof.freshness}`,
    ...proof.rows.map(row=>`${row.repo}: QL-280 ${row.previousSha} / HTTP ${row.previousHttp} -> QL-281 ${row.sha} / HTTP ${row.http} / ${row.publication}`),
    ...challenges.map(row=>`Reviewer challenge request ${row.checkId}: ${row.challengeRequestReferenceClaim} / ${row.verified}/${row.requirements.length} / ${row.challenge} / ${row.signature} / ${row.state}`),
    ...ql281CustodyQueue(claims,escalations).map(row=>`Acknowledgement custody ${row.source}: ${row.unsentEscalations} unsent escalation drafts / ${row.ackReferenceClaims} unverified ACK refs / ${row.status}`),
    ...custody.map(row=>`Custody request ${row.source}: ${row.custodyReferenceClaim} / ${row.verified}/${row.gates.length} / ${row.delivery} / ${row.response} / ${row.acceptance}`),
    `Original reviewer signature challenge verifications: 0/${QL281_REVIEWER_CHALLENGE_GATES.length} | original source-signed Proof-B: 0/6`,
    `Authenticated escalation acknowledgement custody: 0/6 | owner TEST-only approval: NOT GIVEN | source gateway GETs: ${proof.authenticatedGatewayGets}`,
    'No challenge issued, signature checked, outbound message delivered, response authenticated, private relay accessed, or source connected.',
    'Copy-only in-session reference request drafts. DISCONNECTED / HOLD.'
  ].join('\n');
}
