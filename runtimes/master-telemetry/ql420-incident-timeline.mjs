import {createHash,timingSafeEqual} from 'node:crypto';
import {buildQl419CaseEscalationReview} from './ql419-case-escalation-custody.mjs';

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const OWNER=/^[A-Za-z0-9_-]{3,80}$/;
const SOURCES=new Set(['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform']);
const SLA_MS={CRITICAL:900_000,REVIEW:3_600_000,NONE:null};
const fail=(reason)=>({state:'HOLD',reason,incidents:[],receiver:'OFF',
  connection:'HOLD',runtimeUptime:'UNKNOWN',ownerAcceptance:'HOLD',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const validTime=(n,now)=>Number.isSafeInteger(n)&&n>=0&&n<=now;
const digest=(value)=>createHash('sha256').update(JSON.stringify(value),'utf8').digest('hex');
const eqDigest=(a,b)=>HEX.test(a??'')&&HEX.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));

/** The digest binds a source-scoped escalation to its actual case chronology.
 * The trusted caller separately verifies origin, delivery provider, signer
 * enrollment, replay admission and owner/reviewer identity. */
export function ql420EscalationSlaDigest({sourceId,episodeId,sourceRevision,
  observedAtMs,deadlineAtMs,notificationId,notificationDigest,notifiedAtMs}){
  return digest({schema:'rosevear.ql420.escalation-sla.v1',sourceId,episodeId,
    sourceRevision,observedAtMs,deadlineAtMs,notificationId,
    notificationDigest,notifiedAtMs});
}

/** Protected, bounded, deterministic projection. Nothing in the output
 * authorizes execution, live monitoring, recovery, receiver or connection.
 * Caller-asserted verified flags are NEVER accepted from a browser. */
export function buildQl420IncidentTimeline({
 episodes=[],decisions=[],assignments=[],escalations=[],exportReceipts=[],
 slaEvidence=[],closureReviews=[],controllerRevision,nowMs,
 protectedReadAuthorized=false,protectedExportAuthorized=false,
 independentAuditReviewerVerified=false
}={}){
 if(!protectedReadAuthorized||!SHA.test(controllerRevision??'')||
   !validTime(nowMs,nowMs)||!Array.isArray(slaEvidence)||slaEvidence.length>200||
   !Array.isArray(closureReviews)||closureReviews.length>200)
   return fail('PROTECTED_TIMELINE_ACCESS_UNVERIFIED');
 const prior=buildQl419CaseEscalationReview({episodes,decisions,assignments,
   escalations,exportReceipts,controllerRevision,nowMs,
   protectedReadAuthorized,protectedExportAuthorized,independentAuditReviewerVerified});
 if(prior.state!=='PROTECTED_CASE_REVIEW')return fail(prior.reason);
 const byCase=new Map(prior.caseReviews.map(c=>[c.sourceId+':'+c.episodeId,c]));
 const episodeByCase=new Map(episodes.map(e=>[e.sourceId+':'+e.episodeId,e]));
 const notificationsById=new Map(prior.notifications.map(n=>[n.notificationId,n]));
 const proofById=new Map();
 for(const proof of slaEvidence){
   if(!proof||!SOURCES.has(proof.sourceId)||!ID.test(proof.episodeId??'')||
     !ID.test(proof.notificationId??'')||!HEX.test(proof.timelineDigest??'')||
     !validTime(proof.reviewedAtMs,nowMs)||
     proof.independentReviewerVerified!==true||
     proof.protectedCustodyCommitted!==true||
     proof.controllerRevision!==controllerRevision||
     proofById.has(proof.notificationId))
     return fail('SLA_EVIDENCE_CUSTODY_OR_ID_UNVERIFIED');
   const notification=notificationsById.get(proof.notificationId);
   const key=proof.sourceId+':'+proof.episodeId;
   const item=byCase.get(key),episode=episodeByCase.get(key);
   if(!item||!episode||!notification||
      notification.sourceId!==proof.sourceId||
      notification.episodeId!==proof.episodeId||
      proof.reviewedAtMs<notification.occurredAtMs)
     return fail('SLA_EVIDENCE_SOURCE_OR_ORDER_MISMATCH');
   const deadlineAtMs=SLA_MS[item.severity]===null?null:
     episode.observedAtMs+SLA_MS[item.severity];
   const expected=ql420EscalationSlaDigest({sourceId:proof.sourceId,
     episodeId:proof.episodeId,sourceRevision:item.sourceRevision,
     observedAtMs:episode.observedAtMs,deadlineAtMs,
     notificationId:notification.notificationId,
     notificationDigest:notification.notificationDigest,
     notifiedAtMs:notification.occurredAtMs});
   if(!eqDigest(expected,proof.timelineDigest))
     return fail('SLA_EVIDENCE_DIGEST_MISMATCH');
   proofById.set(proof.notificationId,proof);
 }
 const reviewByCase=new Map();
 for(const record of closureReviews){
   if(!record||!SOURCES.has(record.sourceId)||!ID.test(record.episodeId??'')||
     !ID.test(record.reviewId??'')||!OWNER.test(record.ownerId??'')||
     !OWNER.test(record.reviewerId??'')||
     record.ownerId===record.reviewerId||
     !SHA.test(record.sourceRevision??'')||
     !HEX.test(record.custodyDigest??'')||
     !['REQUEST_CLOSURE','REOPEN','CONTINUE_HOLD'].includes(record.action)||
     !validTime(record.reviewedAtMs,nowMs)||
     record.protectedOwnerVerified!==true||
     record.independentReviewerVerified!==true||
     record.durableReviewCommitted!==true)
     return fail('OWNER_CLOSURE_AUTHORITY_OR_CUSTODY_UNVERIFIED');
   const key=record.sourceId+':'+record.episodeId;
   const item=byCase.get(key),episode=episodeByCase.get(key);
   if(!item||!episode||record.sourceRevision!==item.sourceRevision||
     record.ownerId!==item.ownerId||
     record.reviewedAtMs<episode.observedAtMs||
     record.reviewedAtMs<Math.max(episode.observedAtMs,...assignments.filter(a=>
       a.sourceId===record.sourceId&&a.episodeId===record.episodeId)
       .map(a=>a.assignedAtMs))||
     prior.notifications.some(n=>n.sourceId===record.sourceId&&
       n.episodeId===record.episodeId&&n.occurredAtMs>record.reviewedAtMs))
     return fail('CLOSURE_CASE_OR_CHRONOLOGY_MISMATCH');
   const previous=reviewByCase.get(key);
   if(previous&&record.reviewedAtMs<=previous.reviewedAtMs)
     return fail('DUPLICATE_OR_NON_MONOTONIC_CLOSURE_REVIEW');
   if([...reviewByCase.values()].some(r=>r.reviewId===record.reviewId))
     return fail('DUPLICATE_CLOSURE_REVIEW_ID');
   reviewByCase.set(key,record);
 }
 const incidents=prior.caseReviews.map(item=>{
   const key=item.sourceId+':'+item.episodeId;
   const episode=episodeByCase.get(key);
   const events=[{type:'OBSERVED',atMs:episode.observedAtMs,
     sourceRevision:item.sourceRevision}];
   for(const assignment of assignments.filter(a=>a.sourceId===item.sourceId&&
       a.episodeId===item.episodeId)){
     if(assignment.assignedAtMs<episode.observedAtMs)
       return {invalid:'ASSIGNMENT_BEFORE_OBSERVATION'};
     events.push({type:assignment.action,atMs:assignment.assignedAtMs,
       ownerId:assignment.ownerId,custodyDigest:assignment.custodyDigest});
   }
   const sourceNotifications=prior.notifications.filter(n=>
     n.sourceId===item.sourceId&&n.episodeId===item.episodeId);
   for(const n of sourceNotifications)
     events.push({type:'ESCALATION_'+n.deliveryState,atMs:n.occurredAtMs,
       notificationId:n.notificationId,notificationDigest:n.notificationDigest});
   const latest=sourceNotifications.at(-1);
   const proof=latest?proofById.get(latest.notificationId):null;
   const deadlineAtMs=SLA_MS[item.severity]===null?null:
     episode.observedAtMs+SLA_MS[item.severity];
   const slaStatus=!latest?'HOLD_NO_ESCALATION_PROOF':
     !proof?'HOLD_NO_INDEPENDENT_SLA_EVIDENCE':
     latest.deliveryState!=='DELIVERED'?'HOLD_DELIVERY_NOT_VERIFIED':
     deadlineAtMs!==null&&latest.occurredAtMs>deadlineAtMs?
       'BREACHED_VERIFIED_LATE_DELIVERY':'VERIFIED_WITHIN_POLICY';
   const closure=reviewByCase.get(key);
   if(closure)events.push({type:'OWNER_'+closure.action,atMs:closure.reviewedAtMs,
     reviewId:closure.reviewId,custodyDigest:closure.custodyDigest});
   events.sort((a,b)=>a.atMs-b.atMs||
     a.type.localeCompare(b.type));
   const closureStatus=!closure?'HOLD_NO_OWNER_REVIEW':
     closure.action==='REOPEN'?'REOPENED_FOR_REVIEW':
     closure.action==='CONTINUE_HOLD'?'CONTINUED_HOLD':
     item.reasons.length?'HOLD_UNRESOLVED_DISCREPANCIES':
     slaStatus!=='VERIFIED_WITHIN_POLICY'?'HOLD_UNVERIFIED_ESCALATION_SLA':
     !prior.exportVerified?'HOLD_EXPORT_CUSTODY':
     'OWNER_REVIEW_ELIGIBLE_NOT_ACCEPTED';
   return {sourceId:item.sourceId,episodeId:item.episodeId,
     sourceRevision:item.sourceRevision,ownerId:item.ownerId,
     severity:item.severity,deadlineAtMs,slaStatus,
     notificationId:latest?.notificationId??null,
     independentlyReviewedSla:Boolean(proof),
     closureStatus,closureReviewId:closure?.reviewId??null,
     chronology:events,acceptance:'HOLD',receiver:'OFF',connection:'HOLD'};
 });
 if(incidents.some(x=>x.invalid))return fail('ASSIGNMENT_BEFORE_OBSERVATION');
 return {state:'PROTECTED_THREE_MASTER_TIMELINE',
   reason:'REVIEW_ONLY_NO_RUNTIME_CONNECTION_AUTHORIZED',
   controllerRevision,evaluatedAtMs:nowMs,incidents,
   totals:{cases:incidents.length,late:incidents.filter(c=>
     c.slaStatus==='BREACHED_VERIFIED_LATE_DELIVERY').length,
     pendingClosure:incidents.filter(c=>
     c.closureStatus!=='OWNER_REVIEW_ELIGIBLE_NOT_ACCEPTED').length},
   receiver:'OFF',connection:'HOLD',runtimeUptime:'UNKNOWN',
   ownerAcceptance:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
