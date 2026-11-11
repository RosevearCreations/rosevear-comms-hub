import {buildQl417MasterDiscrepancyWorklist} from './ql417-discrepancy-worklist.mjs';

const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const IDENT=/^[A-Za-z0-9_-]{3,80}$/;
const KEY=/^[A-Za-z0-9_-]{12,96}$/;
const SOURCES=new Set(['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform']);
const SLA_MS=Object.freeze({CRITICAL:15*60*1000,REVIEW:60*60*1000,NONE:0});
const hold=(reason)=>({state:'HOLD',reason,items:[],auditExport:null,connection:'HOLD',receiver:'OFF',
  runtimeUptime:'UNKNOWN',ownerDecision:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const stable=(obj)=>JSON.stringify(obj);

/** Metadata-only, owner-gated, deterministic audit projection.
 * The protected caller MUST independently authenticate its owner/reviewer
 * assertions, protected storage, timestamps and provenance. Never accept
 * browser-supplied verification booleans as authority.
 */
export function buildQl418OwnerSlaAudit({episodes=[],decisions=[],assignments=[],
  protectedReadAuthorized=false,protectedExportAuthorized=false,
  independentAuditReviewerVerified=false,controllerRevision,nowMs}={}){
  if(!protectedReadAuthorized||!SHA.test(controllerRevision??'')||
    !Number.isSafeInteger(nowMs)||nowMs<0||
    !Array.isArray(assignments)||assignments.length>200)
    return hold('PROTECTED_OWNER_AUDIT_ACCESS_UNVERIFIED');
  const worklist=buildQl417MasterDiscrepancyWorklist({episodes,decisions,controllerRevision,
    nowMs,protectedReadAuthorized});
  if(worklist.state!=='READ_ONLY_DISCREPANCY_WORKLIST')return hold(worklist.reason);
  const keys=new Set(worklist.items.map(x=>x.sourceId+':'+x.episodeId));
  const latest=new Map();
  for(const a of assignments){
    if(!a||!SOURCES.has(a.sourceId)||!KEY.test(a.episodeId??'')||
      !keys.has(a.sourceId+':'+a.episodeId)||
      !IDENT.test(a.ownerId??'')||
      !['MASTER_OPERATOR','OWNER_REVIEWER'].includes(a.ownerRole)||
      a.ownerVerified!==true||a.independentReviewerVerified!==true||
      !Number.isSafeInteger(a.assignedAtMs)||a.assignedAtMs>nowMs||
      a.assignedAtMs<0||!DIGEST.test(a.custodyDigest??'')||
      !['ASSIGNED','REASSIGNED','ESCALATED'].includes(a.action))
      return hold('ASSIGNMENT_CUSTODY_OR_AUTHORITY_UNVERIFIED');
    const key=a.sourceId+':'+a.episodeId;
    const prev=latest.get(key);
    if(prev&&a.assignedAtMs<=prev.assignedAtMs)
      return hold('NON_MONOTONIC_OR_DUPLICATE_ASSIGNMENT');
    latest.set(key,a);
  }
  const items=worklist.items.map(item=>{
    const a=latest.get(item.sourceId+':'+item.episodeId);
    const observation=episodes.find(e=>e.sourceId===item.sourceId&&e.episodeId===item.episodeId);
    const openedAtMs=observation.observedAtMs;
    const deadlineMs=item.reasons.length?openedAtMs+SLA_MS[item.severity]:null;
    const overdue=deadlineMs!==null&&nowMs>deadlineMs;
    return {sourceId:item.sourceId,episodeId:item.episodeId,
      sourceRevision:item.sourceRevision,severity:item.severity,reasons:[...item.reasons],
      ageSeconds:item.ageSeconds,ageBasis:item.age,
      ownerId:a?.ownerId??null,ownerRole:a?.ownerRole??null,
      assignmentAction:a?.action??'UNASSIGNED',assignedAtMs:a?.assignedAtMs??null,
      assignmentCustodyDigest:a?.custodyDigest??null,
      slaStartMs:openedAtMs,slaDeadlineMs:deadlineMs,
      slaState:!item.reasons.length?'NO_OPEN_DISCREPANCY':
        !a?'UNASSIGNED':overdue?'OVERDUE':a.action==='ESCALATED'?'ESCALATED':'IN_WINDOW',
      overdueSeconds:overdue?Math.floor((nowMs-deadlineMs)/1000):0,
      latestOwnerDecision:item.latestOwnerDecision,
      latestDecisionAtMs:item.latestDecisionAtMs,
      acceptedForReview:item.latestOwnerDecision==='ACCEPTED_FOR_REVIEW',
      resolution:'NOT_CERTIFIED',connection:'HOLD'};
  });
  const counts={total:items.length,unassigned:items.filter(x=>x.slaState==='UNASSIGNED').length,
    overdue:items.filter(x=>x.slaState==='OVERDUE').length,
    open:items.filter(x=>x.reasons.length).length};
  const audit={schema:'rosevear.ql418.three-master-acceptance-audit.v1',
    controllerRevision,evaluatedAtMs:nowMs,counts,
    explicitlyNotProofOf:['CONTINUOUS_UPTIME','CONNECTED','RECEIVER_ENABLED','OWNER_ACCEPTED'],
    items,receiver:'OFF',connection:'HOLD',
    slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
  const exportAllowed=protectedExportAuthorized===true&&independentAuditReviewerVerified===true;
  return {state:'PROTECTED_OWNER_SLA_WORKLIST',reason:'OWNER_GATED_AUDIT_METADATA_ONLY',
    controllerRevision,evaluatedAtMs:nowMs,items,counts,
    auditExport:exportAllowed?stable(audit):null,
    auditExportStatus:exportAllowed?'AUTHORIZED_SANITIZED_JSON':'HOLD_INDEPENDENT_EXPORT_REVIEW',
    receiver:'OFF',connection:'HOLD',runtimeUptime:'UNKNOWN',ownerDecision:'HOLD',
    slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
