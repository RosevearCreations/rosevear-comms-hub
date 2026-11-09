import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import type {QL393Gate} from './ql393OperatorFollowUpDrafts';
import {QL396_DEMO_REQUESTS,QL396_DEMO_NOW,reviewOperatorRecheckQueue,
  type QL396QueueItem,type QL396RecheckRequest,type QL396OwnerScope} from './ql396OperatorRecheckQueue';

export type QL397Outcome='SCENARIO_NOTE_RECORDED'|'SIMULATED_REFERENCE_RECHECKED'|
  'SIMULATED_CONFLICT_IDENTIFIED'|'SIMULATED_EVIDENCE_STILL_MISSING';
export type QL397ReviewState='AWAITING_ORIGINAL_REVIEW'|'SCENARIO_REVIEW_NOTE_ONLY'|
  'CONFLICT_REQUIRES_INDEPENDENT_REVIEW';
export type QL397Observation={
  observationId:string;queueId:string;sourceId:string;correlationId:string;
  gate:QL393Gate['name'];reviewerScope:QL396OwnerScope;
  observedAt:string;outcome:QL397Outcome;
};
export type QL397GateHistory={
  queueId:string;sourceId:string;correlationId:string;gate:QL393Gate['name'];
  reviewerScope:QL396OwnerScope;outcomes:QL397Observation[];
  latestOutcome:QL397Outcome|null;reviewState:QL397ReviewState;
  sourceOwnerReview:'NOT_VERIFIED';masterOwnerReview:'NOT_VERIFIED';
  originalEvidence:'NOT_VERIFIED';closureState:'HOLD';closureGuidance:string;
  requiredIndependentChecks:readonly string[];sendEnabled:false;persisted:false;
};
export type QL397OutcomeHistory={
  state:'INERT_PREVIEW'|'HOLD';gates:QL397GateHistory[];observationCount:number;
  reviewedScenarios:number;conflicts:number;closureEligible:0;reason:string;
  sendEnabled:false;persisted:false;
};
export type QL397Filters={sourceId:string;reviewState:'ALL'|QL397ReviewState};
export const QL397_DEFAULT_FILTERS:QL397Filters={sourceId:'ALL',reviewState:'ALL'};
export const QL397_MAX_OUTCOMES=60;

const timestamp=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const validOutcomes=new Set<QL397Outcome>(['SCENARIO_NOTE_RECORDED',
  'SIMULATED_REFERENCE_RECHECKED','SIMULATED_CONFLICT_IDENTIFIED','SIMULATED_EVIDENCE_STILL_MISSING']);
const checks:readonly string[]=[
  'Original source-owner authorization bound to this source, correlation and purpose',
  'Separate original master-owner decision with an independently verified witness',
  'Original signer pin and key-custody proof for the registered shell',
  'Trusted private receiver enrollment and durable replay/retention audit',
  'Original scoped consent and independent closure/communication authority'
];
const guidance:Record<QL397ReviewState,string>={
  AWAITING_ORIGINAL_REVIEW:'No original recheck outcome exists. Keep the gate open and independently collect source-bound evidence.',
  SCENARIO_REVIEW_NOTE_ONLY:'A simulated review note or reference check is not an original receipt. Obtain separate original owner decisions and witness evidence before proposing closure.',
  CONFLICT_REQUIRES_INDEPENDENT_REVIEW:'Illustrative evidence remains missing or conflicting. Reconcile original source custody, owner decision and witness records without accepting this scenario as proof.'
};

/** Never records an actual recheck outcome or a closing decision. All input
 * observations are treated as local simulations and revalidated against the
 * QL-396 source/correlation/gate queue, including reviewer identity scope. */
export function reviewOperatorRecheckOutcomes(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],observations:readonly QL397Observation[],
  nowMs:number):QL397OutcomeHistory{
  const stopped=(reason:string):QL397OutcomeHistory=>({state:'HOLD',gates:[],observationCount:0,
    reviewedScenarios:0,conflicts:0,closureEligible:0,reason,sendEnabled:false,persisted:false});
  const queue=reviewOperatorRecheckQueue(preview,requests,nowMs);
  if(queue.state!=='INERT_PREVIEW'||!Array.isArray(observations)||observations.length>QL397_MAX_OUTCOMES)
    return stopped('Valid bounded source-scoped QL-396 queue and outcome observations required');
  const byId=new Map(queue.items.map(item=>[item.queueId,item]));
  const valid=(entry:QL397Observation,item:QL396QueueItem)=>
    entry.sourceId===item.sourceId&&entry.correlationId===item.correlationId&&
    entry.gate===item.gate&&entry.reviewerScope===item.ownerScope&&
    typeof entry.observationId==='string'&&opaque.test(entry.observationId)&&
    typeof entry.observedAt==='string'&&timestamp.test(entry.observedAt)&&
    Number.isFinite(Date.parse(entry.observedAt))&&Date.parse(entry.observedAt)<=nowMs&&
    Date.parse(entry.observedAt)>=Date.parse(item.firstSyntheticObservation)&&
    validOutcomes.has(entry.outcome);
  if(observations.some(entry=>!entry||typeof entry.queueId!=='string'||
    !byId.has(entry.queueId)||!valid(entry,byId.get(entry.queueId)!))||
    new Set(observations.map(entry=>entry.observationId)).size!==observations.length)
    return stopped('Invalid, duplicated, future-dated or cross-source outcome blocks the full preview');

  const sorted=[...observations].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||
    a.observationId.localeCompare(b.observationId));
  const gates=queue.items.map(item=>{
    const outcomes=sorted.filter(entry=>entry.queueId===item.queueId);
    const latestOutcome=outcomes.at(-1)?.outcome??null;
    const reviewState:QL397ReviewState=latestOutcome==='SIMULATED_CONFLICT_IDENTIFIED'||
      latestOutcome==='SIMULATED_EVIDENCE_STILL_MISSING'? 'CONFLICT_REQUIRES_INDEPENDENT_REVIEW':
      latestOutcome?'SCENARIO_REVIEW_NOTE_ONLY':'AWAITING_ORIGINAL_REVIEW';
    return {queueId:item.queueId,sourceId:item.sourceId,correlationId:item.correlationId,
      gate:item.gate,reviewerScope:item.ownerScope,outcomes,latestOutcome,reviewState,
      sourceOwnerReview:'NOT_VERIFIED' as const,masterOwnerReview:'NOT_VERIFIED' as const,
      originalEvidence:'NOT_VERIFIED' as const,closureState:'HOLD' as const,
      closureGuidance:`${guidance[reviewState]} ${item.guidance}`,
      requiredIndependentChecks:checks,sendEnabled:false as const,persisted:false as const};
  });
  return {state:'INERT_PREVIEW',gates,observationCount:sorted.length,
    reviewedScenarios:gates.filter(item=>item.outcomes.length>0).length,
    conflicts:gates.filter(item=>item.reviewState==='CONFLICT_REQUIRES_INDEPENDENT_REVIEW').length,
    closureEligible:0,reason:'History and review status are synthetic; actual original-owner approval and evidence-based closure have not been verified',
    sendEnabled:false,persisted:false};
}

export function filterOperatorRecheckOutcomes(history:QL397OutcomeHistory,filters:QL397Filters):QL397GateHistory[]{
  if(history.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!history.gates.some(item=>item.sourceId===filters.sourceId))||
    !['ALL','AWAITING_ORIGINAL_REVIEW','SCENARIO_REVIEW_NOTE_ONLY',
      'CONFLICT_REQUIRES_INDEPENDENT_REVIEW'].includes(filters.reviewState))return [];
  return history.gates.filter(item=>(filters.sourceId==='ALL'||filters.sourceId===item.sourceId)&&
    (filters.reviewState==='ALL'||filters.reviewState===item.reviewState));
}

export const QL397_DEMO_OBSERVATIONS:readonly QL397Observation[]=[
  {observationId:'outcome-ql397-0001',queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_OWNER',
    reviewerScope:'SOURCE_OWNER',observedAt:'2026-11-09T09:36:00Z',outcome:'SCENARIO_NOTE_RECORDED'},
  {observationId:'outcome-ql397-0002',queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_OWNER',
    reviewerScope:'SOURCE_OWNER',observedAt:'2026-11-09T09:41:00Z',outcome:'SIMULATED_CONFLICT_IDENTIFIED'},
  {observationId:'outcome-ql397-0003',queueId:'correlation-ql392-workshop/devilndove/SOURCE_PIN',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_PIN',
    reviewerScope:'SOURCE_SIGNING_CUSTODIAN',observedAt:'2026-11-09T09:42:00Z',outcome:'SIMULATED_REFERENCE_RECHECKED'},
  {observationId:'outcome-ql397-0004',queueId:'correlation-ql392-integration/icamp/MASTER_OWNER',
    sourceId:'icamp',correlationId:'correlation-ql392-integration',gate:'MASTER_OWNER',
    reviewerScope:'MASTER_OWNER',observedAt:'2026-11-09T09:43:00Z',outcome:'SIMULATED_EVIDENCE_STILL_MISSING'},
  {observationId:'outcome-ql397-0005',queueId:'correlation-ql392-local/rosevear-ai-hub/RECEIVER',
    sourceId:'rosevear-ai-hub',correlationId:'correlation-ql392-local',gate:'RECEIVER',
    reviewerScope:'RECEIVER_OPERATOR',observedAt:'2026-11-09T09:44:00Z',outcome:'SCENARIO_NOTE_RECORDED'}
];
export const QL397_DEMO_REQUESTS=QL396_DEMO_REQUESTS;
export const QL397_DEMO_NOW=QL396_DEMO_NOW;
