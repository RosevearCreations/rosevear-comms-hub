import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import type {QL393Gate} from './ql393OperatorFollowUpDrafts';
import {reviewOperatorRecheckQueue,type QL396OwnerScope,type QL396RecheckRequest} from './ql396OperatorRecheckQueue';
import type {QL397Observation} from './ql397RecheckOutcomeHistory';
import type {QL398AuditNote} from './ql398ClosureReadinessAudit';
import {QL399_DEMO_AUDIT,QL399_DEMO_EXCEPTIONS,QL399_DEMO_NOW,QL399_DEMO_OUTCOMES,
  QL399_DEMO_REQUESTS,reviewOriginalEvidenceHandoff,type QL399ReviewerException}
  from './ql399EvidenceHandoffReadiness';

export type QL400AssignmentDraft={
  assignmentId:string;queueId:string;sourceId:string;correlationId:string;
  gate:QL393Gate['name'];intendedRole:QL396OwnerScope;
  draftedAt:string;reviewDueAt:string;
};
export type QL400Freshness='SCENARIO_STALE'|'SCENARIO_AGING'|'SCENARIO_RECENT_ONLY';
export type QL400Attention='OVERDUE'|'CONFLICT'|'COLLECT_ORIGINAL';
export type QL400AssignmentRow=QL400AssignmentDraft & {
  originalEvidenceFreshness:'UNKNOWN_ORIGINAL';scenarioAgeMinutes:number;
  scenarioFreshness:QL400Freshness;handoffStatus:'PREVIEW_ONLY_NOT_ASSIGNED';
  ownerDecision:'NOT_VERIFIED';independentReviewer:'NOT_VERIFIED';
  sourceOwnerDecision:'NOT_VERIFIED';masterOwnerDecision:'NOT_VERIFIED';
  attention:QL400Attention;guidance:string;
  linkedExceptionIds:string[];linkedTraceIds:string[];
  sendEnabled:false;persisted:false;assignmentActive:false;closureState:'HOLD';
};
export type QL400AssignmentReview={
  state:'INERT_PREVIEW'|'HOLD';assignments:QL400AssignmentRow[];
  count:number;overdueCount:number;staleScenarioCount:number;conflictCount:number;
  originalDecisionsVerified:0;authorizedClosures:0;
  reason:string;sendEnabled:false;persisted:false;
};
export type QL400Filters={sourceId:string;attention:'ALL'|QL400Attention};
export const QL400_DEFAULT_FILTERS:QL400Filters={sourceId:'ALL',attention:'ALL'};
export const QL400_MAX_ASSIGNMENTS=30;

const timestamp=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const twoHours=2*60*60*1000;
const escalation:Record<QL400Attention,string>={
  OVERDUE:'Illustrative review window elapsed. Escalate for independent source and master-owner evidence; do not auto-assign, notify or release HOLD.',
  CONFLICT:'Synthetic exception conflict needs separate original source/master-owner review and witness reconciliation before any authenticated decision.',
  COLLECT_ORIGINAL:'Collect original source-bound receipts, independently verify reviewer separation and owner consent; a recent simulation is not proof.'
};

/** No owner identity or transport is available. Draft role and due dates describe
 * an operator planning scenario, never an actual assignment or live SLA. */
export function reviewOperatorHandoffAssignments(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],outcomes:readonly QL397Observation[],
  audit:readonly QL398AuditNote[],exceptions:readonly QL399ReviewerException[],
  drafts:readonly QL400AssignmentDraft[],nowMs:number):QL400AssignmentReview{
  const stopped=(reason:string):QL400AssignmentReview=>({state:'HOLD',assignments:[],count:0,
    overdueCount:0,staleScenarioCount:0,conflictCount:0,originalDecisionsVerified:0,
    authorizedClosures:0,reason,sendEnabled:false,persisted:false});
  const handoff=reviewOriginalEvidenceHandoff(preview,requests,outcomes,audit,exceptions,nowMs);
  const queue=reviewOperatorRecheckQueue(preview,requests,nowMs);
  if(handoff.state!=='INERT_PREVIEW'||queue.state!=='INERT_PREVIEW'||
    !Array.isArray(drafts)||drafts.length>QL400_MAX_ASSIGNMENTS||!Number.isFinite(nowMs))
    return stopped('Original handoff, source queue and bounded role-only assignment drafts required');
  const sourceCases=new Map(handoff.cases.map(item=>[`${item.sourceId}/${item.correlationId}`,item]));
  const byQueue=new Map(queue.items.map(item=>[item.queueId,item]));
  const valid=(draft:QL400AssignmentDraft)=>{
    const item=byQueue.get(draft.queueId);
    const assigned=Date.parse(draft.draftedAt),due=Date.parse(draft.reviewDueAt);
    return !!item&&sourceCases.has(`${draft.sourceId}/${draft.correlationId}`)&&
      typeof draft.assignmentId==='string'&&opaque.test(draft.assignmentId)&&
      item.sourceId===draft.sourceId&&item.correlationId===draft.correlationId&&
      item.gate===draft.gate&&item.ownerScope===draft.intendedRole&&
      typeof draft.draftedAt==='string'&&timestamp.test(draft.draftedAt)&&
      typeof draft.reviewDueAt==='string'&&timestamp.test(draft.reviewDueAt)&&
      Number.isFinite(assigned)&&Number.isFinite(due)&&
      assigned>=Date.parse(item.firstSyntheticObservation)&&assigned<=nowMs&&
      due>=assigned&&due<=nowMs+twoHours;
  };
  if(drafts.some(item=>!item||typeof item.queueId!=='string'||!valid(item))||
    new Set(drafts.map(item=>item.assignmentId)).size!==drafts.length||
    new Set(drafts.map(item=>item.queueId)).size!==drafts.length)
    return stopped('Duplicate, cross-source, forged, future or out-of-window assignment draft');
  const assignments:QL400AssignmentRow[]=drafts.map(draft=>{
    const queueItem=byQueue.get(draft.queueId)!;
    const source=sourceCases.get(`${draft.sourceId}/${draft.correlationId}`)!;
    const linkedExceptions=source.exceptions.filter(item=>item.gate===draft.gate);
    const scenarioAgeMinutes=Math.max(0,Math.floor((nowMs-Date.parse(queueItem.lastSyntheticObservation))/60000));
    const scenarioFreshness:QL400Freshness=scenarioAgeMinutes>=30?'SCENARIO_STALE':
      scenarioAgeMinutes>=10?'SCENARIO_AGING':'SCENARIO_RECENT_ONLY';
    const attention:QL400Attention=Date.parse(draft.reviewDueAt)<nowMs?'OVERDUE':
      linkedExceptions.some(item=>item.priority==='REVIEW_CONFLICT')?'CONFLICT':'COLLECT_ORIGINAL';
    return {...draft,originalEvidenceFreshness:'UNKNOWN_ORIGINAL',scenarioAgeMinutes,
      scenarioFreshness,handoffStatus:'PREVIEW_ONLY_NOT_ASSIGNED',
      ownerDecision:'NOT_VERIFIED',independentReviewer:'NOT_VERIFIED',
      sourceOwnerDecision:'NOT_VERIFIED',masterOwnerDecision:'NOT_VERIFIED',
      attention,guidance:escalation[attention],
      linkedExceptionIds:linkedExceptions.map(item=>item.exceptionId),
      linkedTraceIds:source.decisionTrace.filter(item=>item.gate===draft.gate).map(item=>item.traceId),
      sendEnabled:false,persisted:false,assignmentActive:false,closureState:'HOLD'};
  }).sort((a,b)=>Date.parse(a.reviewDueAt)-Date.parse(b.reviewDueAt)||
    a.assignmentId.localeCompare(b.assignmentId));
  return {state:'INERT_PREVIEW',assignments,count:assignments.length,
    overdueCount:assignments.filter(item=>item.attention==='OVERDUE').length,
    staleScenarioCount:assignments.filter(item=>item.scenarioFreshness==='SCENARIO_STALE').length,
    conflictCount:assignments.filter(item=>item.linkedExceptionIds.some(id=>
      exceptions.find(entry=>entry.exceptionId===id)?.code==='SCENARIO_CLAIM_CONFLICT')).length,
    originalDecisionsVerified:0,authorizedClosures:0,
    reason:'Only synthetic scenario times and role labels are available; original evidence age and actual owner assignments are unknown',
    sendEnabled:false,persisted:false};
}

export function filterOperatorHandoffAssignments(review:QL400AssignmentReview,filters:QL400Filters):QL400AssignmentRow[]{
  if(review.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!review.assignments.some(item=>item.sourceId===filters.sourceId))||
    !['ALL','OVERDUE','CONFLICT','COLLECT_ORIGINAL'].includes(filters.attention))return [];
  return review.assignments.filter(item=>(filters.sourceId==='ALL'||item.sourceId===filters.sourceId)&&
    (filters.attention==='ALL'||item.attention===filters.attention));
}

export const QL400_DEMO_DRAFTS:readonly QL400AssignmentDraft[]=[
  {assignmentId:'assignment-ql400-0001',queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_OWNER',
    intendedRole:'SOURCE_OWNER',draftedAt:'2026-11-09T09:40:00Z',reviewDueAt:'2026-11-09T09:44:00Z'},
  {assignmentId:'assignment-ql400-0002',queueId:'correlation-ql392-integration/icamp/MASTER_OWNER',
    sourceId:'icamp',correlationId:'correlation-ql392-integration',gate:'MASTER_OWNER',
    intendedRole:'MASTER_OWNER',draftedAt:'2026-11-09T09:42:00Z',reviewDueAt:'2026-11-09T09:55:00Z'},
  {assignmentId:'assignment-ql400-0003',queueId:'correlation-ql392-local/rosevear-ai-hub/RECEIVER',
    sourceId:'rosevear-ai-hub',correlationId:'correlation-ql392-local',gate:'RECEIVER',
    intendedRole:'RECEIVER_OPERATOR',draftedAt:'2026-11-09T09:44:00Z',reviewDueAt:'2026-11-09T09:52:00Z'}
];
export const QL400_DEMO_REQUESTS=QL399_DEMO_REQUESTS;
export const QL400_DEMO_OUTCOMES=QL399_DEMO_OUTCOMES;
export const QL400_DEMO_AUDIT=QL399_DEMO_AUDIT;
export const QL400_DEMO_EXCEPTIONS=QL399_DEMO_EXCEPTIONS;
export const QL400_DEMO_NOW=QL399_DEMO_NOW;
