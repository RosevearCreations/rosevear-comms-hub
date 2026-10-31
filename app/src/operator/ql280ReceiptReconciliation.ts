import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL279_OBSERVED_AT, QL279_PUBLIC_SOURCE_RECHECK,
  type Ql279ArrivalClaim, type Ql279EscalationDraft, type Ql279ReviewerDraft }
  from './ql279ReviewerCustodyEscalation';

/** Public read-only GitHub main-ref and immutable original proof path GETs.
 * Private custodian, signer, owner, app gateway and communication services were never contacted. */
export const QL280_OBSERVED_AT='2026-10-31T03:04:36Z';
export const QL280_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'73842314ae77af0826c6403d851dbdd58ae964fe',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'8afba3060d3d53660df28b3b6335d82b34dc0e08',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'f624afeadcfa64529e3d99e238ada9cbb27fdbc9',http:404},
  {source:'yw',repo:'yw',sha:'736c79f0ef76375b4ceea2db5921cabfc0c90fe9',http:404},
  {source:'icamp',repo:'iCamp',sha:'883ee518e805253f45c316ce380ba13723182ff3',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'29e1fbe490c020efd34d598c080a7da72c9bffd5',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

const DAY_MS=86_400_000;
const hoursSince=(from:string,to:Date|string):number|null=>{
  const ms=new Date(to).getTime()-new Date(from).getTime();
  return Number.isFinite(ms)&&ms>=0?Math.floor(ms/3_600_000):null;
};
function referenceError(value:string) {
  const ref=value.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(ref))
    return 'Use a nonsecret external reference claim (5–32 letters, digits, dashes or underscores).';
  if(/^(?:sk[-_]|pk[-_]|secret|password|token|bearer|api[-_]?key)/i.test(ref))
    return 'Do not enter an API key, password or other secret as a reference.';
  return null;
}

export function ql280PinnedProofUrl(source:Ql270SourceId) {
  const row=QL280_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL280_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export const QL280_REVIEWER_RECEIPT_PRECONDITIONS=[
  {key:'identity',label:'Reviewer identity, role and independence authenticated outside this preview',state:'NOT_AUTHENTICATED'},
  {key:'original',label:'Original signed reviewer disposition receipt and immutable document SHA-256 obtained',state:'NOT_RECEIVED'},
  {key:'key',label:'Signature verified against separately pinned trusted reviewer public key',state:'NOT_VERIFIED'},
  {key:'device',label:'Original retest device, assistive method, chronology and case record reconciled',state:'NOT_VERIFIED'},
  {key:'witness',label:'Independent original on-device witness record separately verified',state:'NOT_VERIFIED'},
  {key:'owner',label:'Authenticated owner accessibility decision independently recorded',state:'NOT_GIVEN'}
] as const;

export type Ql280ReviewerReceiptClaim={checkId:Ql279ReviewerDraft['checkId'];proposedDecision:Ql279ReviewerDraft['decision'];
  reviewerReferenceClaim:string;receiptReferenceClaim:string;preparedAt:string;
  preconditions:typeof QL280_REVIEWER_RECEIPT_PRECONDITIONS;verified:0;
  authentication:'NOT_PERFORMED';acceptance:'BLOCKED_PENDING_ORIGINAL_SIGNED_REVIEW';state:'DRAFT_NOT_SENT'};

export function ql280PrepareReviewerReceipt(draft:Ql279ReviewerDraft,reference:string,now:Date):
  {ok:true;claim:Ql280ReviewerReceiptClaim}|{ok:false;reason:string} {
  if(!draft||draft.authentication!=='NOT_AUTHENTICATED'||draft.disposition!=='REVIEW_DRAFT_ONLY'||
    draft.closure!=='OPEN'||draft.accepted!==false||draft.state!=='DRAFT_NOT_SENT')
    return {ok:false,reason:'Use an open, unauthenticated QL-279 reviewer disposition draft.'};
  const problem=referenceError(reference);if(problem)return {ok:false,reason:problem};
  if(!Number.isFinite(now.getTime())||!(now.getTime()>new Date(draft.preparedAt).getTime()))
    return {ok:false,reason:'Receipt reference must be prepared after a valid QL-279 reviewer draft time.'};
  return {ok:true,claim:{checkId:draft.checkId,proposedDecision:draft.decision,
    reviewerReferenceClaim:draft.reviewerReferenceClaim,receiptReferenceClaim:reference.trim(),
    preparedAt:now.toISOString(),preconditions:QL280_REVIEWER_RECEIPT_PRECONDITIONS,
    verified:0,authentication:'NOT_PERFORMED',acceptance:'BLOCKED_PENDING_ORIGINAL_SIGNED_REVIEW',state:'DRAFT_NOT_SENT'}};
}

export type Ql280ArrivalReconciliation={source:Ql270SourceId;kind:Ql279ArrivalClaim['kind'];
  referenceClaim:string;claimedSha:string;currentSha:string;currentHttp:404;
  relation:'CLAIM_POSTDATES_SNAPSHOT_NEW_RECHECK_REQUIRED'|'SOURCE_SHA_MOVED_RECHECK_REQUIRED'|'SAME_SHA_STILL_HTTP_404';
  disposition:'ORIGINAL_NOT_OBSERVED';originalAccepted:false;preparedAt:string};

export function ql280ReconcileArrival(claim:Ql279ArrivalClaim,now:Date):
  {ok:true;record:Ql280ArrivalReconciliation}|{ok:false;reason:string} {
  if(!claim||claim.notice!=='CLAIMED_NOT_CONFIRMED'||claim.originalVerified!==false||claim.state!=='DRAFT_NOT_SENT')
    return {ok:false,reason:'Only a QL-279 unverified original arrival notice claim can be reconciled.'};
  const row=QL280_PUBLIC_SOURCE_RECHECK.find(item=>item.source===claim.source);
  if(!row)return {ok:false,reason:'Source missing from the six registered QL-280 public observations.'};
  if(!Number.isFinite(now.getTime())||!(now.getTime()>new Date(claim.preparedAt).getTime()))
    return {ok:false,reason:'Reconciliation must have a valid later time than the original notice.'};
  return {ok:true,record:{source:claim.source,kind:claim.kind,referenceClaim:claim.referenceClaim,
    claimedSha:claim.sha,currentSha:row.sha,currentHttp:404,
    relation:new Date(claim.preparedAt).getTime()>new Date(QL280_OBSERVED_AT).getTime()?
      'CLAIM_POSTDATES_SNAPSHOT_NEW_RECHECK_REQUIRED':claim.sha===row.sha?
      'SAME_SHA_STILL_HTTP_404':'SOURCE_SHA_MOVED_RECHECK_REQUIRED',
    disposition:'ORIGINAL_NOT_OBSERVED',originalAccepted:false,preparedAt:now.toISOString()}};
}

export function ql280ProofReturns(asOf:Date|string,claims:readonly Ql279ArrivalClaim[]=[]) {
  const ageHours=hoursSince(QL280_OBSERVED_AT,asOf);
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'PUBLIC_RECHECK_DUE' as const:'PINNED_RECENT' as const;
  const rows=QL280_PUBLIC_SOURCE_RECHECK.map(item=>{
    const previous=QL279_PUBLIC_SOURCE_RECHECK.find(row=>row.source===item.source);
    const arrivals=claims.filter(claim=>claim.source===item.source);
    return {...item,previousSha:previous?.sha??null,moved:previous?.sha!==item.sha,
      unverifiedArrivalClaims:arrivals.length,
      staleNoticeCount:arrivals.filter(claim=>claim.sha!==item.sha).length,
      result:'PROOF_B_NOT_RETURNED' as const,originalAccepted:false};
  });
  return {rows,ageHours,freshness,nextPublicRecheckAt:new Date(new Date(QL280_OBSERVED_AT).getTime()+DAY_MS).toISOString(),
    changed:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,total:QL270_SOURCES.length,
    acceptedProofs:0,verifiedCustodyReceipts:0,verifiedReviewerReceipts:0,
    release:'DISCONNECTED / HOLD' as const};
}

export type Ql280AckClaim={source:Ql270SourceId;escalationReason:Ql279EscalationDraft['reason'];
  escalationPreparedAt:string;receiptReferenceClaim:string;preparedAt:string;
  delivery:'NOT_RECORDED';acknowledgement:'REFERENCE_CLAIM_UNVERIFIED';
  accepted:false;state:'DRAFT_NOT_SENT'};

export function ql280PrepareAckClaim(draft:Ql279EscalationDraft,reference:string,now:Date):
  {ok:true;claim:Ql280AckClaim}|{ok:false;reason:string} {
  if(!draft||draft.state!=='DRAFT_NOT_SENT'||draft.delivered!==false||draft.approval!=='NOT_GIVEN')
    return {ok:false,reason:'Select an unsent, unapproved QL-279 escalation draft.'};
  const problem=referenceError(reference);if(problem)return {ok:false,reason:problem};
  if(!Number.isFinite(now.getTime())||!(now.getTime()>new Date(draft.preparedAt).getTime()))
    return {ok:false,reason:'Acknowledgement claim must be prepared later than the escalation draft.'};
  return {ok:true,claim:{source:draft.source,escalationReason:draft.reason,
    escalationPreparedAt:draft.preparedAt,receiptReferenceClaim:reference.trim(),
    preparedAt:now.toISOString(),delivery:'NOT_RECORDED',
    acknowledgement:'REFERENCE_CLAIM_UNVERIFIED',accepted:false,state:'DRAFT_NOT_SENT'}};
}

export function ql280AckAging(draft:Ql279EscalationDraft,asOf:Date|string) {
  const draftAgeHours=hoursSince(draft.preparedAt,asOf);
  const priority=draftAgeHours===null?'CLOCK_REVIEW' as const:
    draftAgeHours>=48?'ESCALATION_DRAFT_REVIEW_DUE' as const:
    draftAgeHours>=24?'FOLLOW_UP_DRAFT_REVIEW_DUE' as const:'RECENT_UNSENT_DRAFT' as const;
  return {source:draft.source,draftAgeHours,priority,delivery:'NOT_RECORDED' as const,
    acknowledged:false,scope:'UNSENT_DRAFT_AGE_ONLY' as const};
}

export function ql280AuditPacket(reviewer:readonly Ql280ReviewerReceiptClaim[],arrivals:readonly Ql280ArrivalReconciliation[],
  ack:readonly Ql280AckClaim[],drafts:readonly Ql279EscalationDraft[],asOf:Date|string) {
  const report=ql280ProofReturns(asOf);
  return [
    'QL-280 | REVIEWER RECEIPT PRECONDITIONS / ORIGINAL PROOF RETURN / ESCALATION ACK AGING | HELD',
    `Public proof recheck ${QL280_OBSERVED_AT}: ${report.changed} changed / ${report.unchanged} unchanged | ${report.missing}/6 Proof-B HTTP 404 | ${report.freshness}`,
    ...report.rows.map(row=>`${row.repo}: ${row.previousSha} -> ${row.sha} / HTTP ${row.http} / ${row.result}`),
    ...reviewer.map(item=>`Reviewer receipt ${item.checkId}: ${item.reviewerReferenceClaim} -> ${item.receiptReferenceClaim} / ${item.verified}/${item.preconditions.length} VERIFIED / ${item.acceptance}`),
    ...arrivals.map(item=>`Source return ${item.source}: ${item.claimedSha} -> ${item.currentSha} / ${item.relation} / ${item.disposition} / ORIGINAL_NOT_ACCEPTED`),
    ...drafts.map(item=>{const age=ql280AckAging(item,asOf);return `Escalation draft ${item.source}: ${item.reason} / ${age.priority} / ${age.draftAgeHours??'CLOCK_REVIEW'}h / UNSENT`; }),
    ...ack.map(item=>`Acknowledgement reference CLAIM ${item.source}: ${item.receiptReferenceClaim} / ${item.acknowledgement} / delivery ${item.delivery} / NOT_ACCEPTED`),
    `Original reviewer receipt verification: 0/${QL280_REVIEWER_RECEIPT_PRECONDITIONS.length} | original signed Proof-B: 0/6 | independent custody and witness: 0/6`,
    'Owner accessibility approval: NOT GIVEN | TEST-only authorization: NOT GIVEN | authenticated gateway GET: NOT RUN',
    'Actual notifications delivered: 0 | Real acknowledgements authenticated: 0 | DISCONNECTED / HOLD',
    'Copy-only local operator draft, not original evidence, reviewer authentication, external delivery or release approval.'
  ].join('\n');
}
