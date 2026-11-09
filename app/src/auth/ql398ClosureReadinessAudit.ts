import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import type {QL393Gate} from './ql393OperatorFollowUpDrafts';
import {reviewOperatorRecheckQueue,type QL396OwnerScope,type QL396RecheckRequest} from './ql396OperatorRecheckQueue';
import {reviewOperatorRecheckOutcomes,QL397_DEMO_OBSERVATIONS,QL397_DEMO_REQUESTS,
  QL397_DEMO_NOW,type QL397Observation,type QL397GateHistory}
  from './ql397RecheckOutcomeHistory';

export type QL398AuditIntent='REVIEW_CHECKLIST'|'PROPOSE_HOLD_RESOLUTION';
export type QL398ClaimBasis='MISSING_ORIGINAL'|'SCENARIO_REFERENCE_ONLY'|'CLAIMED_SCENARIO_COMPLETE';
export type QL398AuditNote={
  auditId:string;queueId:string;sourceId:string;correlationId:string;
  gate:QL393Gate['name'];reviewerScope:QL396OwnerScope;
  observedAt:string;intent:QL398AuditIntent;claimBasis:QL398ClaimBasis;
};
export type QL398EvidenceState='ORIGINAL_MISSING'|'SCENARIO_NOTE_ONLY'|'SIMULATED_CONFLICT';
export type QL398IndependentChecklistItem={
  gate:QL393Gate['name'];custodian:QL396OwnerScope;requirement:string;
  scenarioEvidence:QL398EvidenceState;originalEvidence:'NOT_VERIFIED';
  independentReviewer:'NOT_ATTESTED';satisfied:false;
};
export type QL398ResolutionAuditEntry=QL398AuditNote & {
  disposition:'HOLD_PRESERVED';resolutionAuthorized:false;reason:string;
};
export type QL398ClosureCase={
  sourceId:string;correlationId:string;checklist:QL398IndependentChecklistItem[];
  audit:QL398ResolutionAuditEntry[];scenarioState:'HOLD_CONFLICT_RECHECK'|'HOLD_ORIGINAL_EVIDENCE';
  missingIndependentChecks:5;sourceOwnerReview:'NOT_VERIFIED';masterOwnerReview:'NOT_VERIFIED';
  reviewerSeparation:'NOT_ATTESTED';closureState:'HOLD';closureEligible:false;
  guidance:string;sendEnabled:false;persisted:false;
};
export type QL398ClosureReview={
  state:'INERT_PREVIEW'|'HOLD';cases:QL398ClosureCase[];
  totalCases:number;conflictCases:number;auditedAttempts:number;eligibleClosures:0;
  reason:string;sendEnabled:false;persisted:false;
};
export type QL398Filters={sourceId:string;scenarioState:'ALL'|QL398ClosureCase['scenarioState']};
export const QL398_DEFAULT_FILTERS:QL398Filters={sourceId:'ALL',scenarioState:'ALL'};
export const QL398_MAX_AUDIT_NOTES=30;

const gates:readonly QL393Gate['name'][]=['SOURCE_OWNER','MASTER_OWNER','SOURCE_PIN','RECEIVER','CONSENT'];
const requirements:Record<QL393Gate['name'],string>={
  SOURCE_OWNER:'Original source-owner scope, purpose, correlation and independent witness',
  MASTER_OWNER:'Separate original master-owner authorization and independent witness',
  SOURCE_PIN:'Original per-source signing pin, key custody and independent verifier',
  RECEIVER:'Original private receiver enrollment, replay reservations, retention and audit',
  CONSENT:'Original source/tenant-scoped consent and separate closure authorization'
};
const timestamp=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const intents=new Set<QL398AuditIntent>(['REVIEW_CHECKLIST','PROPOSE_HOLD_RESOLUTION']);
const bases=new Set<QL398ClaimBasis>(['MISSING_ORIGINAL','SCENARIO_REFERENCE_ONLY','CLAIMED_SCENARIO_COMPLETE']);

function evidenceState(gate:QL397GateHistory):QL398EvidenceState{
  return gate.reviewState==='CONFLICT_REQUIRES_INDEPENDENT_REVIEW'?'SIMULATED_CONFLICT':
    gate.reviewState==='SCENARIO_REVIEW_NOTE_ONLY'?'SCENARIO_NOTE_ONLY':'ORIGINAL_MISSING';
}

/** Deterministic, wholly non-executable HOLD audit. Claimed completeness is
 * deliberately never promoted to approval, even when all five scenario axes
 * contain notes. The original owners and independent reviewers remain unknown. */
export function reviewOperatorClosureReadiness(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],outcomes:readonly QL397Observation[],
  notes:readonly QL398AuditNote[],nowMs:number):QL398ClosureReview{
  const stopped=(reason:string):QL398ClosureReview=>({state:'HOLD',cases:[],totalCases:0,
    conflictCases:0,auditedAttempts:0,eligibleClosures:0,reason,sendEnabled:false,persisted:false});
  const history=reviewOperatorRecheckOutcomes(preview,requests,outcomes,nowMs);
  const queue=reviewOperatorRecheckQueue(preview,requests,nowMs);
  if(history.state!=='INERT_PREVIEW'||queue.state!=='INERT_PREVIEW'||
    !Array.isArray(notes)||notes.length>QL398_MAX_AUDIT_NOTES)
    return stopped('Valid bounded QL-397 outcome history and QL-396 source-scoped queue required');
  const byQueue=new Map(queue.items.map(item=>[item.queueId,item]));
  const valid=(note:QL398AuditNote)=>{
    const item=byQueue.get(note.queueId);
    return !!item&&typeof note.auditId==='string'&&opaque.test(note.auditId)&&
      note.sourceId===item.sourceId&&note.correlationId===item.correlationId&&
      note.gate===item.gate&&note.reviewerScope===item.ownerScope&&
      typeof note.observedAt==='string'&&timestamp.test(note.observedAt)&&
      Number.isFinite(Date.parse(note.observedAt))&&Date.parse(note.observedAt)<=nowMs&&
      Date.parse(note.observedAt)>=Date.parse(item.firstSyntheticObservation)&&
      intents.has(note.intent)&&bases.has(note.claimBasis);
  };
  if(notes.some(note=>!note||typeof note.queueId!=='string'||!valid(note))||
    new Set(notes.map(note=>note.auditId)).size!==notes.length)
    return stopped('Cross-source, duplicate, future, out-of-scope or forged audit claim blocks all closure review');

  const ordered=[...notes].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||
    a.auditId.localeCompare(b.auditId));
  const grouped=new Map<string,QL397GateHistory[]>();
  for(const entry of history.gates){
    const key=`${entry.sourceId}/${entry.correlationId}`;
    grouped.set(key,[...(grouped.get(key)??[]),entry]);
  }
  const cases:QL398ClosureCase[]=[];
  for(const group of grouped.values()){
    if(group.length!==5||new Set(group.map(item=>item.gate)).size!==5||
      gates.some(gate=>!group.some(entry=>entry.gate===gate)))
      return stopped('Five independent registered gate axes must exist before a closure checklist can be shown');
    const sourceId=group[0].sourceId,correlationId=group[0].correlationId;
    const checklist=gates.map(gate=>{
      const entry=group.find(item=>item.gate===gate)!;
      return {gate,custodian:entry.reviewerScope,requirement:requirements[gate],
        scenarioEvidence:evidenceState(entry),originalEvidence:'NOT_VERIFIED' as const,
        independentReviewer:'NOT_ATTESTED' as const,satisfied:false as const};
    });
    const audit:QL398ResolutionAuditEntry[]=ordered.filter(note=>note.sourceId===sourceId&&
      note.correlationId===correlationId).map(note=>({
      ...note,disposition:'HOLD_PRESERVED' as const,resolutionAuthorized:false as const,
      reason:note.claimBasis==='CLAIMED_SCENARIO_COMPLETE'?
        'A simulated all-clear is not original owner/witness authorization; HOLD cannot be resolved.':
        note.intent==='PROPOSE_HOLD_RESOLUTION'?
          'Original source/master-owner decisions, custody, receiver and consent evidence are missing.':
          'Checklist observation only; no original evidence was independently authenticated.'
    }));
    const hasConflict=checklist.some(item=>item.scenarioEvidence==='SIMULATED_CONFLICT');
    cases.push({sourceId,correlationId,checklist,audit,
      scenarioState:hasConflict?'HOLD_CONFLICT_RECHECK':'HOLD_ORIGINAL_EVIDENCE',
      missingIndependentChecks:5,sourceOwnerReview:'NOT_VERIFIED',masterOwnerReview:'NOT_VERIFIED',
      reviewerSeparation:'NOT_ATTESTED',closureState:'HOLD',closureEligible:false,
      guidance:hasConflict?'Resolve source-scoped scenario conflict through independently witnessed original evidence review; keep HOLD.':
        'Collect all five independently verified original evidence axes before any authenticated closure decision; keep HOLD.',
      sendEnabled:false,persisted:false});
  }
  cases.sort((a,b)=>a.sourceId.localeCompare(b.sourceId)||a.correlationId.localeCompare(b.correlationId));
  return {state:'INERT_PREVIEW',cases,totalCases:cases.length,
    conflictCases:cases.filter(item=>item.scenarioState==='HOLD_CONFLICT_RECHECK').length,
    auditedAttempts:ordered.length,eligibleClosures:0,
    reason:'All illustrative HOLD resolution attempts remain rejected without independent original-owner evidence',
    sendEnabled:false,persisted:false};
}

export function filterOperatorClosureReadiness(review:QL398ClosureReview,
  filters:QL398Filters):QL398ClosureCase[]{
  if(review.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!review.cases.some(item=>item.sourceId===filters.sourceId))||
    !['ALL','HOLD_CONFLICT_RECHECK','HOLD_ORIGINAL_EVIDENCE'].includes(filters.scenarioState))return [];
  return review.cases.filter(item=>(filters.sourceId==='ALL'||item.sourceId===filters.sourceId)&&
    (filters.scenarioState==='ALL'||item.scenarioState===filters.scenarioState));
}

export const QL398_DEMO_AUDIT:readonly QL398AuditNote[]=[
  {auditId:'audit-ql398-0001',queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_OWNER',
    reviewerScope:'SOURCE_OWNER',observedAt:'2026-11-09T09:40:00Z',intent:'REVIEW_CHECKLIST',
    claimBasis:'SCENARIO_REFERENCE_ONLY'},
  {auditId:'audit-ql398-0002',queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_OWNER',
    reviewerScope:'SOURCE_OWNER',observedAt:'2026-11-09T09:42:00Z',intent:'PROPOSE_HOLD_RESOLUTION',
    claimBasis:'CLAIMED_SCENARIO_COMPLETE'},
  {auditId:'audit-ql398-0003',queueId:'correlation-ql392-integration/icamp/MASTER_OWNER',
    sourceId:'icamp',correlationId:'correlation-ql392-integration',gate:'MASTER_OWNER',
    reviewerScope:'MASTER_OWNER',observedAt:'2026-11-09T09:44:00Z',intent:'PROPOSE_HOLD_RESOLUTION',
    claimBasis:'MISSING_ORIGINAL'},
  {auditId:'audit-ql398-0004',queueId:'correlation-ql392-local/rosevear-ai-hub/RECEIVER',
    sourceId:'rosevear-ai-hub',correlationId:'correlation-ql392-local',gate:'RECEIVER',
    reviewerScope:'RECEIVER_OPERATOR',observedAt:'2026-11-09T09:45:00Z',intent:'REVIEW_CHECKLIST',
    claimBasis:'SCENARIO_REFERENCE_ONLY'}
];
export const QL398_DEMO_REQUESTS=QL397_DEMO_REQUESTS;
export const QL398_DEMO_OUTCOMES=QL397_DEMO_OBSERVATIONS;
export const QL398_DEMO_NOW=QL397_DEMO_NOW;
