import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import type {QL396OwnerScope,QL396RecheckRequest} from './ql396OperatorRecheckQueue';
import type {QL397Observation} from './ql397RecheckOutcomeHistory';
import type {QL398AuditNote} from './ql398ClosureReadinessAudit';
import {reviewOriginalEvidenceHandoff,type QL399ReviewerException} from './ql399EvidenceHandoffReadiness';
import type {QL400AssignmentDraft} from './ql400HandoffAssignmentPreview';
import {reviewOperatorEscalationTimeline,type QL401AcknowledgementDraft,
  QL401_DEMO_ACKNOWLEDGEMENTS,QL401_DEMO_AUDIT,QL401_DEMO_DRAFTS,
  QL401_DEMO_EXCEPTIONS,QL401_DEMO_NOW,QL401_DEMO_OUTCOMES,QL401_DEMO_REQUESTS}
  from './ql401EscalationTimeline';

export type QL402ReviewIntent='RETAIN_HOLD'|'REQUEST_ORIGINAL_RECHECK'|'ESCALATE_OWNER_REVIEW';
export type QL402RecoveryNote={
  reviewId:string;assignmentId:string;sourceId:string;correlationId:string;
  reviewerRole:QL396OwnerScope;observedAt:string;intent:QL402ReviewIntent;
  referencedScenarioAcknowledgementId:string|null;
};
export type QL402DriftKind='SCENARIO_UNCHANGED'|'SCENARIO_REFERENCE_DROPPED'|
  'SCENARIO_REFERENCE_RESTORED'|'NO_SCENARIO_REFERENCE';
export type QL402DecisionTrace=QL402RecoveryNote&{
  priorScenarioAcknowledgementId:string|null;drift:QL402DriftKind;
  disposition:'HOLD_PRESERVED';decisionAuthorized:false;reason:string;
};
export type QL402SignoffCheck={
  gate:'SOURCE_OWNER'|'MASTER_OWNER'|'SOURCE_PIN'|'RECEIVER'|'CONSENT';
  custodian:QL396OwnerScope;requirement:string;originalReceipt:'NOT_PRESENT';
  independentWitness:'NOT_ATTESTED';signedOriginalDecision:'NOT_VERIFIED';
  eligibleForSignoff:false;
};
export type QL402RecoveryRow={
  assignmentId:string;sourceId:string;correlationId:string;gate:QL400AssignmentDraft['gate'];
  reviewerRole:QL396OwnerScope;acknowledgementAt:string|null;
  baselineScenarioAcknowledgementId:string|null;
  decisionTrace:QL402DecisionTrace[];driftEvents:number;latestIntent:QL402ReviewIntent|null;
  recoveryState:'HOLD_UNREVIEWED'|'HOLD_RECHECK'|'HOLD_OWNER_ESCALATION';
  signoffChecklist:QL402SignoffCheck[];signoffsVerified:0;
  sourceOwnerSigned:false;masterOwnerSigned:false;independentWitnessVerified:false;
  originalEvidenceVerified:false;handoffAuthorized:false;closureState:'HOLD';
  sendEnabled:false;persisted:false;
};
export type QL402RecoveryReview={
  state:'INERT_PREVIEW'|'HOLD';rows:QL402RecoveryRow[];total:number;
  reviewed:number;driftEvents:number;awaitingOriginalSignoffs:number;
  originalOwnerDecisionsVerified:0;authorizedClosures:0;sendEnabled:false;persisted:false;reason:string;
};
export type QL402Filters={sourceId:string;drift:'ALL'|'DRIFT_ONLY'|'UNCHANGED'};
export const QL402_DEFAULT_FILTERS:QL402Filters={sourceId:'ALL',drift:'ALL'};
export const QL402_MAX_NOTES=30;
const timestamp=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const intents=new Set<QL402ReviewIntent>(['RETAIN_HOLD','REQUEST_ORIGINAL_RECHECK','ESCALATE_OWNER_REVIEW']);

/** Only a source-bound comparison of illustrative review notes. A reference
 * becoming present again cannot restore an original signed acknowledgement. */
export function reviewOperatorRecoveryDecisions(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],outcomes:readonly QL397Observation[],
  audit:readonly QL398AuditNote[],exceptions:readonly QL399ReviewerException[],
  drafts:readonly QL400AssignmentDraft[],acks:readonly QL401AcknowledgementDraft[],
  notes:readonly QL402RecoveryNote[],nowMs:number):QL402RecoveryReview{
  const stopped=(reason:string):QL402RecoveryReview=>({state:'HOLD',rows:[],total:0,
    reviewed:0,driftEvents:0,awaitingOriginalSignoffs:0,originalOwnerDecisionsVerified:0,
    authorizedClosures:0,sendEnabled:false,persisted:false,reason});
  const history=reviewOperatorEscalationTimeline(preview,requests,outcomes,audit,exceptions,drafts,acks,nowMs);
  const handoff=reviewOriginalEvidenceHandoff(preview,requests,outcomes,audit,exceptions,nowMs);
  if(history.state!=='INERT_PREVIEW'||handoff.state!=='INERT_PREVIEW'||
    !Array.isArray(notes)||notes.length>QL402_MAX_NOTES||
    !Number.isFinite(nowMs)||!Number.isFinite(new Date(nowMs).getTime()))
    return stopped('Valid QL-401 escalation history, QL-399 original HOLD checklist and bounded recovery notes required');
  const byAssignment=new Map(history.rows.map(item=>[item.assignmentId,item]));
  const byAck=new Map(acks.map(item=>[item.assignmentId,item]));
  const valid=(note:QL402RecoveryNote)=>{
    const assigned=byAssignment.get(note.assignmentId);
    const ack=byAck.get(note.assignmentId);
    const when=Date.parse(note.observedAt);
    return !!assigned&&typeof note.reviewId==='string'&&opaque.test(note.reviewId)&&
      note.sourceId===assigned.sourceId&&note.correlationId===assigned.correlationId&&
      note.reviewerRole===assigned.intendedRole&&intents.has(note.intent)&&
      typeof note.observedAt==='string'&&timestamp.test(note.observedAt)&&
      Number.isFinite(when)&&when<=nowMs&&
      when>=Date.parse(drafts.find(item=>item.assignmentId===note.assignmentId)!.draftedAt)&&
      (note.referencedScenarioAcknowledgementId===null||
        (typeof note.referencedScenarioAcknowledgementId==='string'&&
         note.referencedScenarioAcknowledgementId===ack?.acknowledgementId&&
         when>=Date.parse(ack.observedAt)));
  };
  if(notes.some(note=>!note||typeof note.assignmentId!=='string'||!valid(note))||
    new Set(notes.map(note=>note.reviewId)).size!==notes.length||
    notes.some(note=>byAssignment.has(note.reviewId)||
      acks.some(item=>item.acknowledgementId===note.reviewId)||
      handoff.cases.some(item=>item.decisionTrace.some(trace=>trace.traceId===note.reviewId))))
    return stopped('Forged, duplicate, cross-source, unsourced, future or unbound recovery decision reference');
  const byCase=new Map(handoff.cases.map(item=>[`${item.sourceId}/${item.correlationId}`,item]));
  const ordered=[...notes].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||
    a.reviewId.localeCompare(b.reviewId));
  const rows:QL402RecoveryRow[]=history.rows.map(item=>{
    const source=byCase.get(`${item.sourceId}/${item.correlationId}`)!;
    const baseline=byAck.get(item.assignmentId)?.acknowledgementId??null;
    let previous=baseline;
    const decisionTrace:QL402DecisionTrace[]=ordered.filter(note=>note.assignmentId===item.assignmentId).map(note=>{
      const current=note.referencedScenarioAcknowledgementId;
      const drift:QL402DriftKind=current===previous?
        current===null?'NO_SCENARIO_REFERENCE':'SCENARIO_UNCHANGED':
        current===null?'SCENARIO_REFERENCE_DROPPED':'SCENARIO_REFERENCE_RESTORED';
      const entry={...note,priorScenarioAcknowledgementId:previous,drift,
        disposition:'HOLD_PRESERVED' as const,decisionAuthorized:false as const,
        reason:drift==='SCENARIO_REFERENCE_DROPPED'?
          'Sample acknowledgement reference disappeared from a review note; independently check original custody and do not auto-resend.':
          drift==='SCENARIO_REFERENCE_RESTORED'?
            'Sample acknowledgement reference reappeared; no identity, signer, witness or original receipt was authenticated.':
            'Scenario review note only; no original evidence or owner disposition was verified.'};
      previous=current;
      return entry;
    });
    const latest=decisionTrace.at(-1)?.intent??null;
    const signoffChecklist:QL402SignoffCheck[]=source.handoff.map(check=>({
      gate:check.gate,custodian:check.custodian,requirement:check.requiredOriginalArtifact,
      originalReceipt:'NOT_PRESENT',independentWitness:'NOT_ATTESTED',
      signedOriginalDecision:'NOT_VERIFIED',eligibleForSignoff:false
    }));
    return {assignmentId:item.assignmentId,sourceId:item.sourceId,
      correlationId:item.correlationId,gate:item.gate,reviewerRole:item.intendedRole,
      acknowledgementAt:item.acknowledgementAt,baselineScenarioAcknowledgementId:baseline,
      decisionTrace,driftEvents:decisionTrace.filter(note=>
        note.drift==='SCENARIO_REFERENCE_DROPPED'||note.drift==='SCENARIO_REFERENCE_RESTORED').length,
      latestIntent:latest,recoveryState:latest===null?'HOLD_UNREVIEWED':
        latest==='ESCALATE_OWNER_REVIEW'?'HOLD_OWNER_ESCALATION':'HOLD_RECHECK',
      signoffChecklist,signoffsVerified:0,sourceOwnerSigned:false,masterOwnerSigned:false,
      independentWitnessVerified:false,originalEvidenceVerified:false,
      handoffAuthorized:false,closureState:'HOLD',sendEnabled:false,persisted:false};
  });
  if(rows.some(item=>item.signoffChecklist.length!==5||
    new Set(item.signoffChecklist.map(check=>check.gate)).size!==5))
    return stopped('Five separate original source/master-owner, pin, receiver and consent signoff axes required');
  return {state:'INERT_PREVIEW',rows,total:rows.length,
    reviewed:rows.filter(item=>item.decisionTrace.length>0).length,
    driftEvents:rows.reduce((count,item)=>count+item.driftEvents,0),
    awaitingOriginalSignoffs:rows.reduce((count,item)=>count+item.signoffChecklist.length,0),
    originalOwnerDecisionsVerified:0,authorizedClosures:0,sendEnabled:false,persisted:false,
    reason:'Scenario drift and recovery intent are not authenticated acknowledgement, owner signoff or independent original evidence'};
}

export function filterOperatorRecoveryDecisions(review:QL402RecoveryReview,
  filters:QL402Filters):QL402RecoveryRow[]{
  if(review.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!review.rows.some(row=>row.sourceId===filters.sourceId))||
    !['ALL','DRIFT_ONLY','UNCHANGED'].includes(filters.drift))return [];
  return review.rows.filter(item=>(filters.sourceId==='ALL'||item.sourceId===filters.sourceId)&&
    (filters.drift==='ALL'||(filters.drift==='DRIFT_ONLY'?item.driftEvents>0:item.driftEvents===0)));
}

export const QL402_DEMO_NOTES:readonly QL402RecoveryNote[]=[
  {reviewId:'review-ql402-workshop-1',assignmentId:'assignment-ql400-0001',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',reviewerRole:'SOURCE_OWNER',
    observedAt:'2026-11-09T09:44:35Z',intent:'RETAIN_HOLD',
    referencedScenarioAcknowledgementId:'ack-ql401-workshop'},
  {reviewId:'review-ql402-workshop-2',assignmentId:'assignment-ql400-0001',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',reviewerRole:'SOURCE_OWNER',
    observedAt:'2026-11-09T09:44:50Z',intent:'ESCALATE_OWNER_REVIEW',
    referencedScenarioAcknowledgementId:null},
  {reviewId:'review-ql402-icamp-1',assignmentId:'assignment-ql400-0002',
    sourceId:'icamp',correlationId:'correlation-ql392-integration',reviewerRole:'MASTER_OWNER',
    observedAt:'2026-11-09T09:44:55Z',intent:'REQUEST_ORIGINAL_RECHECK',
    referencedScenarioAcknowledgementId:null},
  {reviewId:'review-ql402-local-1',assignmentId:'assignment-ql400-0003',
    sourceId:'rosevear-ai-hub',correlationId:'correlation-ql392-local',reviewerRole:'RECEIVER_OPERATOR',
    observedAt:'2026-11-09T09:44:45Z',intent:'REQUEST_ORIGINAL_RECHECK',
    referencedScenarioAcknowledgementId:null},
  {reviewId:'review-ql402-local-2',assignmentId:'assignment-ql400-0003',
    sourceId:'rosevear-ai-hub',correlationId:'correlation-ql392-local',reviewerRole:'RECEIVER_OPERATOR',
    observedAt:'2026-11-09T09:44:55Z',intent:'RETAIN_HOLD',
    referencedScenarioAcknowledgementId:'ack-ql401-local'}
];
export const QL402_DEMO_ACKS=QL401_DEMO_ACKNOWLEDGEMENTS;
export const QL402_DEMO_DRAFTS=QL401_DEMO_DRAFTS;
export const QL402_DEMO_REQUESTS=QL401_DEMO_REQUESTS;
export const QL402_DEMO_OUTCOMES=QL401_DEMO_OUTCOMES;
export const QL402_DEMO_AUDIT=QL401_DEMO_AUDIT;
export const QL402_DEMO_EXCEPTIONS=QL401_DEMO_EXCEPTIONS;
export const QL402_DEMO_NOW=QL401_DEMO_NOW;
