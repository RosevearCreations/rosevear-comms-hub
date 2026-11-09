import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import type {QL393Gate} from './ql393OperatorFollowUpDrafts';
import {reviewOperatorRecheckQueue,type QL396RecheckRequest,type QL396OwnerScope} from './ql396OperatorRecheckQueue';
import type {QL397Observation} from './ql397RecheckOutcomeHistory';
import {QL398_DEMO_AUDIT,QL398_DEMO_NOW,QL398_DEMO_OUTCOMES,QL398_DEMO_REQUESTS,
  reviewOperatorClosureReadiness,type QL398AuditNote,type QL398ClosureCase}
  from './ql398ClosureReadinessAudit';

export type QL399ExceptionCode='ORIGINAL_RECEIPT_MISSING'|'INDEPENDENT_WITNESS_MISSING'|
  'CUSTODY_CHAIN_UNVERIFIED'|'SCENARIO_CLAIM_CONFLICT';
export type QL399ReviewerException={
  exceptionId:string;queueId:string;sourceId:string;correlationId:string;
  gate:QL393Gate['name'];reviewerScope:QL396OwnerScope;
  observedAt:string;code:QL399ExceptionCode;
};
export type QL399HandoffItem={
  gate:QL393Gate['name'];custodian:QL396OwnerScope;requiredOriginalArtifact:string;
  originalArtifact:'NOT_PRESENT';independentReviewer:'NOT_VERIFIED';
  witnessSeparation:'NOT_ATTESTED';handoffReady:false;
};
export type QL399DecisionTrace={
  traceId:string;observedAt:string;gate:QL393Gate['name'];
  kind:'QL398_HOLD_AUDIT'|'QL399_REVIEWER_EXCEPTION';
  sourceId:string;correlationId:string;originId:string;
  disposition:'HOLD_PRESERVED';authorized:false;reason:string;
};
export type QL399ExceptionRow=QL399ReviewerException & {
  priority:'REVIEW_CONFLICT'|'COLLECT_ORIGINAL';state:'OPEN_HOLD';
  independentlyVerified:false;guidance:string;
};
export type QL399HandoffCase={
  sourceId:string;correlationId:string;handoff:QL399HandoffItem[];
  exceptions:QL399ExceptionRow[];decisionTrace:QL399DecisionTrace[];
  originalRequirementsOutstanding:5;
  handoffState:'BLOCKED_ORIGINAL_PROOF';sourceOwnerDecision:'NOT_VERIFIED';
  masterOwnerDecision:'NOT_VERIFIED';independentReview:'NOT_ATTESTED';
  closureState:'HOLD';closureEligible:false;sendEnabled:false;persisted:false;
  guidance:string;
};
export type QL399HandoffReview={
  state:'INERT_PREVIEW'|'HOLD';cases:QL399HandoffCase[];totalCases:number;
  openExceptions:number;tracedDecisions:number;readyHandoffs:0;eligibleClosures:0;
  reason:string;sendEnabled:false;persisted:false;
};
export type QL399Filters={sourceId:string;exceptionPriority:'ALL'|'REVIEW_CONFLICT'|'COLLECT_ORIGINAL'};
export const QL399_DEFAULT_FILTERS:QL399Filters={sourceId:'ALL',exceptionPriority:'ALL'};
export const QL399_MAX_EXCEPTIONS=30;

const timestamp=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const codes=new Set<QL399ExceptionCode>([
  'ORIGINAL_RECEIPT_MISSING','INDEPENDENT_WITNESS_MISSING',
  'CUSTODY_CHAIN_UNVERIFIED','SCENARIO_CLAIM_CONFLICT']);
const instructions:Record<QL393Gate['name'],string>={
  SOURCE_OWNER:'Original source-owner signed decision, scoped purpose and independent witness receipt',
  MASTER_OWNER:'Separate master-owner signed decision and independent witness receipt',
  SOURCE_PIN:'Original shell signing pin provenance and key-custodian verification receipt',
  RECEIVER:'Original private receiver enrollment and replay/retention audit receipt',
  CONSENT:'Original scoped tenant consent and independently authorized communication/closure receipt'
};
const exceptionGuidance:Record<QL399ExceptionCode,string>={
  ORIGINAL_RECEIPT_MISSING:'Collect an original source-bound receipt from the protected owner workflow.',
  INDEPENDENT_WITNESS_MISSING:'Obtain a distinct original witness receipt; reviewer scope labels do not authenticate a person.',
  CUSTODY_CHAIN_UNVERIFIED:'Reconcile original pin custody and independent signer-verification evidence.',
  SCENARIO_CLAIM_CONFLICT:'Independently examine the original source evidence; never accept a simulated all-clear.'
};

/** Read-only assembly of original-evidence handoff requirements and synthetic
 * exception chronology. No input can grant an owner decision or release HOLD. */
export function reviewOriginalEvidenceHandoff(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],outcomes:readonly QL397Observation[],
  auditNotes:readonly QL398AuditNote[],exceptions:readonly QL399ReviewerException[],
  nowMs:number):QL399HandoffReview{
  const stopped=(reason:string):QL399HandoffReview=>({state:'HOLD',cases:[],totalCases:0,
    openExceptions:0,tracedDecisions:0,readyHandoffs:0,eligibleClosures:0,
    reason,sendEnabled:false,persisted:false});
  const closure=reviewOperatorClosureReadiness(preview,requests,outcomes,auditNotes,nowMs);
  const queue=reviewOperatorRecheckQueue(preview,requests,nowMs);
  if(closure.state!=='INERT_PREVIEW'||queue.state!=='INERT_PREVIEW'||
    !Array.isArray(exceptions)||exceptions.length>QL399_MAX_EXCEPTIONS)
    return stopped('Valid QL-398 closure review, QL-396 queue and bounded exceptions required');
  const queueById=new Map(queue.items.map(item=>[item.queueId,item]));
  const valid=(entry:QL399ReviewerException)=>{
    const item=queueById.get(entry.queueId);
    return !!item&&typeof entry.exceptionId==='string'&&opaque.test(entry.exceptionId)&&
      entry.sourceId===item.sourceId&&entry.correlationId===item.correlationId&&
      entry.gate===item.gate&&entry.reviewerScope===item.ownerScope&&
      typeof entry.observedAt==='string'&&timestamp.test(entry.observedAt)&&
      Number.isFinite(Date.parse(entry.observedAt))&&Date.parse(entry.observedAt)<=nowMs&&
      Date.parse(entry.observedAt)>=Date.parse(item.firstSyntheticObservation)&&
      codes.has(entry.code);
  };
  if(exceptions.some(item=>!item||typeof item.queueId!=='string'||!valid(item))||
    new Set(exceptions.map(item=>item.exceptionId)).size!==exceptions.length||
    new Set(exceptions.map(item=>item.exceptionId)).size+new Set(auditNotes.map(item=>item.auditId)).size!==
      new Set([...exceptions.map(item=>item.exceptionId),...auditNotes.map(item=>item.auditId)]).size)
    return stopped('Duplicate, cross-source, out-of-scope, future-dated or forged reviewer exception');

  const ordered:QL399ReviewerException[]=[...exceptions].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||
    a.exceptionId.localeCompare(b.exceptionId));
  const cases=closure.cases.map((record:QL398ClosureCase):QL399HandoffCase=>{
    const handoff:QL399HandoffItem[]=record.checklist.map(item=>({
      gate:item.gate,custodian:item.custodian,requiredOriginalArtifact:instructions[item.gate],
      originalArtifact:'NOT_PRESENT',independentReviewer:'NOT_VERIFIED',
      witnessSeparation:'NOT_ATTESTED',handoffReady:false
    }));
    const sourceExceptions:QL399ExceptionRow[]=ordered.filter(item=>item.sourceId===record.sourceId&&
      item.correlationId===record.correlationId).map(item=>({
      ...item,priority:item.code==='SCENARIO_CLAIM_CONFLICT'?'REVIEW_CONFLICT':'COLLECT_ORIGINAL',
      state:'OPEN_HOLD',independentlyVerified:false,guidance:exceptionGuidance[item.code]
    }));
    const decisionTrace:QL399DecisionTrace[]=[
      ...record.audit.map(item=>({traceId:`ql398/${item.auditId}`,observedAt:item.observedAt,
        gate:item.gate,kind:'QL398_HOLD_AUDIT' as const,sourceId:item.sourceId,
        correlationId:item.correlationId,originId:item.auditId,disposition:'HOLD_PRESERVED' as const,
        authorized:false as const,reason:item.reason})),
      ...sourceExceptions.map(item=>({traceId:`ql399/${item.exceptionId}`,observedAt:item.observedAt,
        gate:item.gate,kind:'QL399_REVIEWER_EXCEPTION' as const,sourceId:item.sourceId,
        correlationId:item.correlationId,originId:item.exceptionId,disposition:'HOLD_PRESERVED' as const,
        authorized:false as const,reason:item.guidance}))
    ].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||a.traceId.localeCompare(b.traceId));
    return {sourceId:record.sourceId,correlationId:record.correlationId,handoff,
      exceptions:sourceExceptions,decisionTrace,originalRequirementsOutstanding:5,
      handoffState:'BLOCKED_ORIGINAL_PROOF',sourceOwnerDecision:'NOT_VERIFIED',
      masterOwnerDecision:'NOT_VERIFIED',independentReview:'NOT_ATTESTED',
      closureState:'HOLD',closureEligible:false,sendEnabled:false,persisted:false,
      guidance:'Collect five separate original receipts and independently attest reviewer separation in the protected source and master-owner workflows. Keep HOLD.'};
  });
  return {state:'INERT_PREVIEW',cases,totalCases:cases.length,
    openExceptions:ordered.length,tracedDecisions:cases.reduce((count,item)=>count+item.decisionTrace.length,0),
    readyHandoffs:0,eligibleClosures:0,
    reason:'No original receipt, independent reviewer attestation or authenticated closure decision exists in this preview',
    sendEnabled:false,persisted:false};
}

export function filterOriginalEvidenceHandoffs(review:QL399HandoffReview,filters:QL399Filters):QL399HandoffCase[]{
  if(review.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!review.cases.some(item=>item.sourceId===filters.sourceId))||
    !['ALL','REVIEW_CONFLICT','COLLECT_ORIGINAL'].includes(filters.exceptionPriority))return [];
  return review.cases.filter(item=>(filters.sourceId==='ALL'||item.sourceId===filters.sourceId)&&
    (filters.exceptionPriority==='ALL'||item.exceptions.some(row=>row.priority===filters.exceptionPriority)));
}

export const QL399_DEMO_EXCEPTIONS:readonly QL399ReviewerException[]=[
  {exceptionId:'exception-ql399-0001',queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_OWNER',
    reviewerScope:'SOURCE_OWNER',observedAt:'2026-11-09T09:40:00Z',code:'INDEPENDENT_WITNESS_MISSING'},
  {exceptionId:'exception-ql399-0002',queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_OWNER',
    reviewerScope:'SOURCE_OWNER',observedAt:'2026-11-09T09:42:00Z',code:'SCENARIO_CLAIM_CONFLICT'},
  {exceptionId:'exception-ql399-0003',queueId:'correlation-ql392-integration/icamp/MASTER_OWNER',
    sourceId:'icamp',correlationId:'correlation-ql392-integration',gate:'MASTER_OWNER',
    reviewerScope:'MASTER_OWNER',observedAt:'2026-11-09T09:44:00Z',code:'ORIGINAL_RECEIPT_MISSING'},
  {exceptionId:'exception-ql399-0004',queueId:'correlation-ql392-local/rosevear-ai-hub/RECEIVER',
    sourceId:'rosevear-ai-hub',correlationId:'correlation-ql392-local',gate:'RECEIVER',
    reviewerScope:'RECEIVER_OPERATOR',observedAt:'2026-11-09T09:45:00Z',code:'CUSTODY_CHAIN_UNVERIFIED'}
];
export const QL399_DEMO_AUDIT=QL398_DEMO_AUDIT;
export const QL399_DEMO_REQUESTS=QL398_DEMO_REQUESTS;
export const QL399_DEMO_OUTCOMES=QL398_DEMO_OUTCOMES;
export const QL399_DEMO_NOW=QL398_DEMO_NOW;
