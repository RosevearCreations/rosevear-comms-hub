import {createHash,timingSafeEqual} from 'node:crypto';
import {buildQl420IncidentTimeline} from './ql420-incident-timeline.mjs';

const SHA=/^[0-9a-f]{40}$/;
const DIGEST=/^[0-9a-f]{64}$/;
const EPISODE=/^[A-Za-z0-9_-]{12,96}$/;
const ACTOR=/^[A-Za-z0-9_-]{3,80}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const MASTER_SET=new Set(MASTERS);
const MAX_RECORDS=200;
const MAX_AGE_MS=300_000;
const hash=value=>createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');
const sameDigest=(a,b)=>DIGEST.test(a??'')&&DIGEST.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const time=(n,now)=>Number.isSafeInteger(n)&&n>=0&&n<=now;
const keyOf=r=>r.sourceId+':'+r.episodeId;
const hold=reason=>({state:'HOLD',reason,cases:[],controllerRevision:null,
  receiver:'OFF',connection:'HOLD',runtimeUptime:'UNKNOWN',ownerAcceptance:'HOLD',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});

/** A digest binds a candidate closure to its exact QL-420 case chronology.
 * It is a tamper-evidence checksum, NOT a signature or independent proof. */
export function ql421ClosureDigest({
 sourceId,episodeId,sourceRevision,controllerRevision,closureReviewId,
 ownerId,chronologyDigest
}){
 return hash({schema:'rosevear.ql421.closure-evidence.v1',sourceId,episodeId,
   sourceRevision,controllerRevision,closureReviewId,ownerId,chronologyDigest});
}

/** Hash-linked owner audit record. The caller independently checks signer,
 * append-only storage, custody and authentic owner/reviewer identity. */
export function ql421OwnerAuditDigest({
 sourceId,episodeId,sourceRevision,entryId,action,atMs,
 ownerId,reviewerId,previousDigest,closureDigest
}){
 return hash({schema:'rosevear.ql421.owner-history.v1',sourceId,episodeId,
   sourceRevision,entryId,action,atMs,ownerId,reviewerId,
   previousDigest,closureDigest});
}

/** Read-only protected reconciliation over QL-417..420 verified metadata.
 * Not a receiver, not a signature verifier, not a Windows action, and never
 * a CONNECTION/owner acceptance authorizer. All "verified" input flags are
 * attestations supplied by an authenticated protected service ONLY. */
export function buildQl421ClosureHandoffHistory({
 episodes=[],decisions=[],assignments=[],escalations=[],exportReceipts=[],
 slaEvidence=[],closureReviews=[],closureEvidence=[],masterHandoffs=[],
 ownerAuditHistory=[],controllerRevision,nowMs,
 protectedReadAuthorized=false,protectedExportAuthorized=false,
 independentAuditReviewerVerified=false
}={}){
 if(!protectedReadAuthorized||!SHA.test(controllerRevision??'')||
   !time(nowMs,nowMs)||!Array.isArray(closureEvidence)||
   !Array.isArray(masterHandoffs)||!Array.isArray(ownerAuditHistory)||
   closureEvidence.length>MAX_RECORDS||
   masterHandoffs.length>MAX_RECORDS||
   ownerAuditHistory.length>MAX_RECORDS)
   return hold('PROTECTED_CLOSURE_ACCESS_OR_BOUNDS_UNVERIFIED');

 const prior=buildQl420IncidentTimeline({
   episodes,decisions,assignments,escalations,exportReceipts,slaEvidence,
   closureReviews,controllerRevision,nowMs,protectedReadAuthorized,
   protectedExportAuthorized,independentAuditReviewerVerified
 });
 if(prior.state!=='PROTECTED_THREE_MASTER_TIMELINE')return hold(prior.reason);
 const byCase=new Map(prior.incidents.map(c=>[keyOf(c),c]));
 const closureByCase=new Map();
 const globalIds=new Set();

 for(const c of closureEvidence){
   if(!c||!MASTER_SET.has(c.sourceId)||!EPISODE.test(c.episodeId??'')||
     !EPISODE.test(c.proofId??'')||!SHA.test(c.sourceRevision??'')||
     c.controllerRevision!==controllerRevision||
     !DIGEST.test(c.closureDigest??'')||!time(c.verifiedAtMs,nowMs)||
     c.independentOriginalHostReceiptVerified!==true||
     c.signedReceiverAckVerified!==true||c.durableReplayCommitted!==true||
     c.protectedOwnerVerified!==true||
     c.independentReviewerVerified!==true||
     c.protectedCustodyCommitted!==true)
     return hold('CLOSURE_EVIDENCE_AUTHORITY_OR_CUSTODY_UNVERIFIED');
   const key=keyOf(c),incident=byCase.get(key);
   if(!incident||closureByCase.has(key)||globalIds.has(c.proofId)||
     incident.sourceRevision!==c.sourceRevision||
     incident.closureReviewId!==c.closureReviewId||
     incident.ownerId!==c.ownerId||
     incident.closureStatus!=='OWNER_REVIEW_ELIGIBLE_NOT_ACCEPTED')
     return hold('CLOSURE_CASE_OR_REVIEW_NOT_ELIGIBLE');
   const chronologyDigest=hash(incident.chronology);
   const expected=ql421ClosureDigest({
     sourceId:c.sourceId,episodeId:c.episodeId,
     sourceRevision:c.sourceRevision,controllerRevision,
     closureReviewId:c.closureReviewId,ownerId:c.ownerId,chronologyDigest
   });
   const lastEventAtMs=incident.chronology.at(-1)?.atMs??0;
   if(!sameDigest(expected,c.closureDigest)||c.verifiedAtMs<lastEventAtMs)
     return hold('CLOSURE_EVIDENCE_DIGEST_OR_TIME_MISMATCH');
   globalIds.add(c.proofId);
   closureByCase.set(key,c);
 }

 const receiptsByCase=new Map();
 for(const r of masterHandoffs){
   if(!r||!MASTER_SET.has(r.sourceId)||!MASTER_SET.has(r.masterId)||
     !EPISODE.test(r.episodeId??'')||!EPISODE.test(r.receiptId??'')||
     !SHA.test(r.sourceRevision??'')||
     r.controllerRevision!==controllerRevision||
     !DIGEST.test(r.closureDigest??'')||!time(r.receivedAtMs,nowMs)||
     r.independentSignerVerified!==true||
     r.protectedReplayCommitted!==true||
     r.independentReceiverAckCorrelated!==true)
     return hold('MASTER_HANDOFF_SIGNER_OR_REPLAY_UNVERIFIED');
   const key=keyOf(r),closure=closureByCase.get(key);
   if(!closure||closure.sourceRevision!==r.sourceRevision||
     !sameDigest(closure.closureDigest,r.closureDigest)||
     r.receivedAtMs<closure.verifiedAtMs||globalIds.has(r.receiptId))
     return hold('MASTER_HANDOFF_SOURCE_OR_RECEIPT_MISMATCH');
   const members=receiptsByCase.get(key)??new Map();
   if(members.has(r.masterId))return hold('DUPLICATE_MASTER_HANDOFF');
   members.set(r.masterId,r);
   receiptsByCase.set(key,members);
   globalIds.add(r.receiptId);
 }

 const auditByCase=new Map();
 for(const a of ownerAuditHistory){
   if(!a||!MASTER_SET.has(a.sourceId)||!EPISODE.test(a.episodeId??'')||
     !EPISODE.test(a.entryId??'')||!SHA.test(a.sourceRevision??'')||
     !ACTOR.test(a.ownerId??'')||!ACTOR.test(a.reviewerId??'')||
     a.ownerId===a.reviewerId||
     !['REQUEST_ACCEPTANCE','REOPEN','MAINTAIN_HOLD'].includes(a.action)||
     !DIGEST.test(a.previousDigest??'')||!DIGEST.test(a.entryDigest??'')||
     !time(a.atMs,nowMs)||a.protectedOwnerVerified!==true||
     a.independentReviewerVerified!==true||
     a.appendOnlyCustodyCommitted!==true||globalIds.has(a.entryId))
     return hold('OWNER_HISTORY_AUTHORITY_OR_CHAIN_UNVERIFIED');
   const key=keyOf(a),incident=byCase.get(key);
   if(!incident||incident.sourceRevision!==a.sourceRevision||
     incident.ownerId!==a.ownerId)
     return hold('OWNER_HISTORY_SOURCE_OR_OWNER_MISMATCH');
   const list=auditByCase.get(key)??[];
   const previous=list.at(-1);
   const closing=closureByCase.get(key);
   const expectedPrevious=previous?.entryDigest??'0'.repeat(64);
   const lastIncidentAtMs=incident.chronology.at(-1)?.atMs??0;
   if(!sameDigest(expectedPrevious,a.previousDigest)||
     a.atMs<lastIncidentAtMs||
     (previous&&a.atMs<=previous.atMs))
     return hold('OWNER_HISTORY_REORDERED_OR_PREDECESSOR_MISMATCH');
   const closingDigest=closing?.closureDigest??'0'.repeat(64);
   const expected=ql421OwnerAuditDigest({
     sourceId:a.sourceId,episodeId:a.episodeId,
     sourceRevision:a.sourceRevision,entryId:a.entryId,
     action:a.action,atMs:a.atMs,ownerId:a.ownerId,
     reviewerId:a.reviewerId,previousDigest:a.previousDigest,
     closureDigest:closingDigest
   });
   if(!sameDigest(expected,a.entryDigest))
     return hold('OWNER_HISTORY_DIGEST_MISMATCH');
   const receipts=receiptsByCase.get(key);
   if(a.action==='REQUEST_ACCEPTANCE'&&(!closing||
     receipts?.size!==MASTERS.length||
     MASTERS.some(m=>!receipts?.has(m))))
     return hold('OWNER_ACCEPTANCE_REQUEST_LACKS_THREE_MASTER_PROOF');
   list.push(a);auditByCase.set(key,list);globalIds.add(a.entryId);
 }

 const cases=prior.incidents.map(incident=>{
   const key=keyOf(incident),closure=closureByCase.get(key);
   const receipts=receiptsByCase.get(key)??new Map();
   const history=auditByCase.get(key)??[];
   const latest=history.at(-1);
   const missingMasters=MASTERS.filter(m=>!receipts.has(m));
   const stale=closure&&nowMs-closure.verifiedAtMs>MAX_AGE_MS||
     [...receipts.values()].some(r=>nowMs-r.receivedAtMs>MAX_AGE_MS);
   const stage=!closure?'HOLD_NO_VERIFIED_CLOSURE_PROOF':
     missingMasters.length?'HOLD_THREE_MASTER_HANDOFF_INCOMPLETE':
     stale?'HOLD_STALE_HANDOFF_PROOF':
     !latest?'HOLD_OWNER_AUDIT_HISTORY_MISSING':
     latest.action==='REOPEN'?'HOLD_REOPENED':
     latest.action==='MAINTAIN_HOLD'?'HOLD_OWNER_CONTINUITY':
     'READY_FOR_SUPERVISED_OWNER_DECISION';
   return {sourceId:incident.sourceId,episodeId:incident.episodeId,
     sourceRevision:incident.sourceRevision,closureReviewId:incident.closureReviewId,
     closureEvidenceId:closure?.proofId??null,
     closureDigest:closure?.closureDigest??null,
     reconciliation:closure?'MATCHED_FOR_REVIEW_NOT_ACCEPTED':'HOLD',
     handoffState:stage,missingMasters,
     receipts:MASTERS.filter(m=>receipts.has(m)).map(m=>({
       masterId:m,receiptId:receipts.get(m).receiptId,
       receivedAtMs:receipts.get(m).receivedAtMs
     })),
     auditHistory:history.map(a=>({
       entryId:a.entryId,action:a.action,atMs:a.atMs,
       ownerId:a.ownerId,reviewerId:a.reviewerId,
       previousDigest:a.previousDigest,entryDigest:a.entryDigest
     })),
     latestOwnerAction:latest?.action??'NONE',
     ownerAcceptance:'HOLD',receiver:'OFF',connection:'HOLD'};
 });
 return {state:'PROTECTED_THREE_MASTER_HANDOFF_REVIEW',
   reason:'ORIGINAL_HOST_AND_OWNER_RUNTIME_PROOF_REQUIRED',
   controllerRevision,evaluatedAtMs:nowMs,cases,
   totals:{cases:cases.length,
     readyForSupervisedDecision:cases.filter(c=>
       c.handoffState==='READY_FOR_SUPERVISED_OWNER_DECISION').length,
     onHold:cases.filter(c=>
       c.handoffState!=='READY_FOR_SUPERVISED_OWNER_DECISION').length},
   receiver:'OFF',connection:'HOLD',runtimeUptime:'UNKNOWN',
   ownerAcceptance:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
