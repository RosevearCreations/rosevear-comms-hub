import {createHash,timingSafeEqual} from 'node:crypto';
import {buildQl418OwnerSlaAudit} from './ql418-owner-sla-audit.mjs';

const SHA=/^[0-9a-f]{40}$/;
const HEX=/^[0-9a-f]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const SOURCES=new Set(['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform']);
const hold=(reason)=>({state:'HOLD',reason,caseReviews:[],notifications:[],
  auditExport:null,exportDigest:null,receiver:'OFF',connection:'HOLD',
  runtimeUptime:'UNKNOWN',ownerDecision:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});

/** Protected metadata projection. All trust assertions MUST be made by a
 * separate authenticated server-side caller, never submitted by a browser.
 * Returns no outgoing notification or secret-bearing envelope. */
export function buildQl419CaseEscalationReview({
  episodes=[],decisions=[],assignments=[],escalations=[],exportReceipts=[],
  controllerRevision,nowMs,protectedReadAuthorized=false,
  protectedExportAuthorized=false,independentAuditReviewerVerified=false
}={}){
  if(!protectedReadAuthorized||!SHA.test(controllerRevision??'')||
     !Number.isSafeInteger(nowMs)||nowMs<0||
     !Array.isArray(escalations)||escalations.length>200||
     !Array.isArray(exportReceipts)||exportReceipts.length>200)
    return hold('PROTECTED_ACCESS_OR_INPUT_UNVERIFIED');
  const review=buildQl418OwnerSlaAudit({episodes,decisions,assignments,
    controllerRevision,nowMs,protectedReadAuthorized,protectedExportAuthorized,
    independentAuditReviewerVerified});
  if(review.state!=='PROTECTED_OWNER_SLA_WORKLIST')return hold(review.reason);
  const byCase=new Map(review.items.map(x=>[x.sourceId+':'+x.episodeId,x]));
  const latest=new Map();
  const notifications=[];
  for(const e of escalations){
    if(!e||!SOURCES.has(e.sourceId)||!ID.test(e.episodeId??'')||
      !ID.test(e.notificationId??'')||!HEX.test(e.notificationDigest??'')||
      !['QUEUED','DELIVERED','FAILED'].includes(e.deliveryState)||
      !Number.isSafeInteger(e.occurredAtMs)||e.occurredAtMs<0||e.occurredAtMs>nowMs||
      e.operatorVerified!==true||e.independentReviewerVerified!==true||
      !byCase.has(e.sourceId+':'+e.episodeId))
      return hold('ESCALATION_PROVENANCE_INVALID');
    const key=e.sourceId+':'+e.episodeId;
    const item=byCase.get(key),prev=latest.get(key);
    if(!item.ownerId||!item.reasons.length||e.occurredAtMs<item.slaStartMs||
      e.occurredAtMs<(item.assignedAtMs??0)||
      (prev&&e.occurredAtMs<=prev.occurredAtMs)||
      notifications.some(n=>n.notificationId===e.notificationId))
      return hold('ESCALATION_ORDER_OR_ASSIGNMENT_UNVERIFIED');
    latest.set(key,e);
    notifications.push({sourceId:e.sourceId,episodeId:e.episodeId,
      notificationId:e.notificationId,notificationDigest:e.notificationDigest,
      occurredAtMs:e.occurredAtMs,deliveryState:e.deliveryState,
      verifiedDelivery:e.deliveryState==='DELIVERED',
      action:'REVIEW_ONLY_NO_DELIVERY_EXECUTED'});
  }
  const cases=review.items.map(item=>{
    const last=latest.get(item.sourceId+':'+item.episodeId);
    return {sourceId:item.sourceId,episodeId:item.episodeId,
      sourceRevision:item.sourceRevision,severity:item.severity,
      ownerId:item.ownerId,ownerRole:item.ownerRole,
      slaState:item.slaState,overdueSeconds:item.overdueSeconds,
      reasons:[...item.reasons],lastNotificationId:last?.notificationId??null,
      lastDeliveryState:last?.deliveryState??'NO_NOTIFICATION_PROOF',
      acceptance:'HOLD',connection:'HOLD'};
  });
  let exportDigest=null,exportVerified=false,exportCustodyState='HOLD_NO_AUTHORIZED_EXPORT';
  if(review.auditExport!==null){
    exportDigest=createHash('sha256').update(review.auditExport,'utf8').digest('hex');
    for(const r of exportReceipts){
      if(!r||!ID.test(r.receiptId??'')||!HEX.test(r.auditSha256??'')||
        !Number.isSafeInteger(r.reviewedAtMs)||r.reviewedAtMs<0||
        r.reviewedAtMs>nowMs||r.ownerVerified!==true||
        r.independentReviewerVerified!==true||
        r.controllerRevision!==controllerRevision)
        return hold('EXPORT_CUSTODY_PROVENANCE_INVALID');
      const supplied=Buffer.from(r.auditSha256,'hex');
      if(!timingSafeEqual(supplied,Buffer.from(exportDigest,'hex')))
        return hold('EXPORT_DIGEST_MISMATCH');
    }
    exportVerified=exportReceipts.length===1;
    exportCustodyState=exportVerified?'INDEPENDENT_RECEIPT_MATCHED':
      exportReceipts.length?'AMBIGUOUS_EXPORT_CUSTODY':'HOLD_NO_CUSTODY_RECEIPT';
    if(exportReceipts.length>1)return hold('AMBIGUOUS_EXPORT_CUSTODY');
  }else if(exportReceipts.length)return hold('UNAUTHORIZED_EXPORT_RECEIPT');
  return {state:'PROTECTED_CASE_REVIEW',reason:'NO_RUNTIME_CONNECTION_AUTHORIZED',
    controllerRevision,caseReviews:cases,notifications,exportDigest,
    exportVerified,exportCustodyState,
    auditExport:exportVerified?review.auditExport:null,
    receiver:'OFF',connection:'HOLD',runtimeUptime:'UNKNOWN',ownerDecision:'HOLD',
    slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
