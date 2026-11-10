import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import type {QL396OwnerScope,QL396RecheckRequest} from './ql396OperatorRecheckQueue';
import type {QL397Observation} from './ql397RecheckOutcomeHistory';
import type {QL398AuditNote} from './ql398ClosureReadinessAudit';
import {reviewOriginalEvidenceHandoff,type QL399ReviewerException} from './ql399EvidenceHandoffReadiness';
import {reviewOperatorHandoffAssignments,type QL400AssignmentDraft,
  type QL400Attention} from './ql400HandoffAssignmentPreview';
import {QL400_DEMO_AUDIT,QL400_DEMO_DRAFTS,QL400_DEMO_EXCEPTIONS,QL400_DEMO_NOW,
  QL400_DEMO_OUTCOMES,QL400_DEMO_REQUESTS} from './ql400HandoffAssignmentPreview';

export type QL401AcknowledgementDraft={
  acknowledgementId:string;assignmentId:string;queueId:string;sourceId:string;
  correlationId:string;acknowledgerRole:QL396OwnerScope;observedAt:string;
  outcome:'SCENARIO_RECEIVED';
};
export type QL401TimelineKind='HOLD_EVIDENCE_TRACE'|'ASSIGNMENT_DRAFTED'|
  'SCENARIO_ACKNOWLEDGED'|'REVIEW_DUE'|'ESCALATION_REVIEW';
export type QL401TimelineEvent={eventId:string;at:string;kind:QL401TimelineKind;
  description:string;scenarioOnly:true;authorized:false};
export type QL401AcknowledgementState='SCENARIO_ACK_ONLY'|'NO_SCENARIO_ACK';
export type QL401EscalationRow={
  assignmentId:string;queueId:string;sourceId:string;correlationId:string;
  gate:QL400AssignmentDraft['gate'];intendedRole:QL396OwnerScope;
  attention:QL400Attention;acknowledgementState:QL401AcknowledgementState;
  acknowledgementAt:string|null;lateIllustrativeAck:boolean;
  timeline:QL401TimelineEvent[];recoverySteps:string[];
  originalEvidence:'NOT_VERIFIED';sourceOwnerApproval:'NOT_VERIFIED';
  masterOwnerApproval:'NOT_VERIFIED';independentWitness:'NOT_ATTESTED';
  handoffAccepted:false;assignmentActive:false;closureState:'HOLD';
  sendEnabled:false;persisted:false;
};
export type QL401EscalationReview={
  state:'INERT_PREVIEW'|'HOLD';rows:QL401EscalationRow[];total:number;
  scenarioAcknowledged:number;notAcknowledged:number;lateIllustrativeAcks:number;
  authorizedHandoffs:0;authorizedClosures:0;sendEnabled:false;persisted:false;reason:string;
};
export type QL401Filters={sourceId:string;acknowledgement:'ALL'|QL401AcknowledgementState};
export const QL401_DEFAULT_FILTERS:QL401Filters={sourceId:'ALL',acknowledgement:'ALL'};
export const QL401_MAX_ACKNOWLEDGEMENTS=30;
const timestamp=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

/** A deterministic storyboard of a simulated handoff, not an acknowledgement
 * endpoint. In particular a role label does NOT prove who saw an assignment. */
export function reviewOperatorEscalationTimeline(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],outcomes:readonly QL397Observation[],
  audit:readonly QL398AuditNote[],exceptions:readonly QL399ReviewerException[],
  drafts:readonly QL400AssignmentDraft[],acks:readonly QL401AcknowledgementDraft[],
  nowMs:number):QL401EscalationReview{
  const stopped=(reason:string):QL401EscalationReview=>({state:'HOLD',rows:[],total:0,
    scenarioAcknowledged:0,notAcknowledged:0,lateIllustrativeAcks:0,
    authorizedHandoffs:0,authorizedClosures:0,sendEnabled:false,persisted:false,reason});
  const assignments=reviewOperatorHandoffAssignments(preview,requests,outcomes,audit,exceptions,drafts,nowMs);
  const handoff=reviewOriginalEvidenceHandoff(preview,requests,outcomes,audit,exceptions,nowMs);
  if(assignments.state!=='INERT_PREVIEW'||handoff.state!=='INERT_PREVIEW'||
    !Array.isArray(acks)||acks.length>QL401_MAX_ACKNOWLEDGEMENTS||!Number.isFinite(nowMs))
    return stopped('Validated QL-400 assignment drafts, original HOLD trace and bounded synthetic acknowledgements required');
  const byAssignment=new Map(assignments.assignments.map(item=>[item.assignmentId,item]));
  const valid=(ack:QL401AcknowledgementDraft)=>{
    const assigned=byAssignment.get(ack.assignmentId);
    const when=Date.parse(ack.observedAt);
    return !!assigned&&typeof ack.acknowledgementId==='string'&&opaque.test(ack.acknowledgementId)&&
      ack.queueId===assigned.queueId&&ack.sourceId===assigned.sourceId&&
      ack.correlationId===assigned.correlationId&&ack.acknowledgerRole===assigned.intendedRole&&
      ack.outcome==='SCENARIO_RECEIVED'&&typeof ack.observedAt==='string'&&
      timestamp.test(ack.observedAt)&&Number.isFinite(when)&&
      when>=Date.parse(assigned.draftedAt)&&when<=nowMs;
  };
  if(acks.some(ack=>!ack||typeof ack.assignmentId!=='string'||!valid(ack))||
    new Set(acks.map(ack=>ack.acknowledgementId)).size!==acks.length||
    new Set(acks.map(ack=>ack.assignmentId)).size!==acks.length||
    acks.some(ack=>byAssignment.has(ack.acknowledgementId)||
      handoff.cases.some(item=>item.decisionTrace.some(trace=>trace.traceId===ack.acknowledgementId))))
    return stopped('Duplicate, forged, cross-source, future or out-of-sequence synthetic acknowledgement');
  const byAck=new Map(acks.map(ack=>[ack.assignmentId,ack]));
  const byCase=new Map(handoff.cases.map(item=>[`${item.sourceId}/${item.correlationId}`,item]));
  const rows:QL401EscalationRow[]=assignments.assignments.map(item=>{
    const ack=byAck.get(item.assignmentId);
    const source=byCase.get(`${item.sourceId}/${item.correlationId}`)!;
    const timeline:QL401TimelineEvent[]=[
      ...source.decisionTrace.filter(trace=>trace.gate===item.gate).map(trace=>({
        eventId:trace.traceId,at:trace.observedAt,kind:'HOLD_EVIDENCE_TRACE' as const,
        description:`${trace.kind}: ${trace.disposition} — ${trace.reason}`,
        scenarioOnly:true as const,authorized:false as const})),
      {eventId:`${item.assignmentId}/draft`,at:item.draftedAt,kind:'ASSIGNMENT_DRAFTED',
        description:`Role-only ${item.intendedRole} handoff drafted; nobody assigned.`,
        scenarioOnly:true,authorized:false},
      {eventId:`${item.assignmentId}/due`,at:item.reviewDueAt,kind:'REVIEW_DUE',
        description:Date.parse(item.reviewDueAt)<nowMs?
          'Illustrative review window elapsed; no live SLA or reminder was created.':
          'Future illustrative review time; no live deadline scheduled.',scenarioOnly:true,authorized:false},
      {eventId:`${item.assignmentId}/escalation`,at:new Date(nowMs).toISOString(),
        kind:'ESCALATION_REVIEW',description:`${item.attention}: ${item.guidance}`,
        scenarioOnly:true,authorized:false}
    ];
    if(ack)timeline.push({eventId:ack.acknowledgementId,at:ack.observedAt,
      kind:'SCENARIO_ACKNOWLEDGED',description:`${ack.acknowledgerRole} role marked received in sample data; not a verified person, receipt or owner approval.`,
      scenarioOnly:true,authorized:false});
    timeline.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.eventId.localeCompare(b.eventId));
    const recoverySteps=[
      'Pause real handoff, sending, retry, release and closure. Preserve HOLD and source/correlation boundaries.',
      ack?'Check any real acknowledgement separately using authenticated staff identity and original signed evidence; this scenario mark is not a receipt.':
        'If a real acknowledgement is required, verify the actual assignee in an authenticated operator workflow; do not auto-resend.',
      item.attention==='OVERDUE'?'Have authorized operators independently assess a real missed deadline before any owner escalation; the example time alone proves nothing.':
        item.attention==='CONFLICT'?'Reconcile the conflicting original source and independent reviewer evidence without auto-resolving it.':
          'Collect original source-bound evidence and verify its actual freshness and provenance.',
      'Independently verify distinct source-owner and master-owner decisions, witness separation, signing pin custody, receiver replay/retention proof and scoped consent.',
      'Record any real decision only in an approved auditable workflow; re-evaluate readiness there. Never infer authorization or closure from this preview.'
    ];
    return {assignmentId:item.assignmentId,queueId:item.queueId,sourceId:item.sourceId,
      correlationId:item.correlationId,gate:item.gate,intendedRole:item.intendedRole,
      attention:item.attention,acknowledgementState:ack?'SCENARIO_ACK_ONLY':'NO_SCENARIO_ACK',
      acknowledgementAt:ack?.observedAt??null,
      lateIllustrativeAck:!!ack&&Date.parse(ack.observedAt)>Date.parse(item.reviewDueAt),
      timeline,recoverySteps,originalEvidence:'NOT_VERIFIED',sourceOwnerApproval:'NOT_VERIFIED',
      masterOwnerApproval:'NOT_VERIFIED',independentWitness:'NOT_ATTESTED',
      handoffAccepted:false,assignmentActive:false,closureState:'HOLD',
      sendEnabled:false,persisted:false};
  });
  return {state:'INERT_PREVIEW',rows,total:rows.length,
    scenarioAcknowledged:rows.filter(item=>item.acknowledgementState==='SCENARIO_ACK_ONLY').length,
    notAcknowledged:rows.filter(item=>item.acknowledgementState==='NO_SCENARIO_ACK').length,
    lateIllustrativeAcks:rows.filter(item=>item.lateIllustrativeAck).length,
    authorizedHandoffs:0,authorizedClosures:0,sendEnabled:false,persisted:false,
    reason:'Only offline role markers and simulated timeline events are available; no owner, witness, receipt or actual staff acknowledgement verified'};
}

export function filterOperatorEscalationTimeline(review:QL401EscalationReview,
  filters:QL401Filters):QL401EscalationRow[]{
  if(review.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!review.rows.some(row=>row.sourceId===filters.sourceId))||
    !['ALL','SCENARIO_ACK_ONLY','NO_SCENARIO_ACK'].includes(filters.acknowledgement))return [];
  return review.rows.filter(item=>(filters.sourceId==='ALL'||item.sourceId===filters.sourceId)&&
    (filters.acknowledgement==='ALL'||item.acknowledgementState===filters.acknowledgement));
}

export const QL401_DEMO_ACKNOWLEDGEMENTS:readonly QL401AcknowledgementDraft[]=[
  {acknowledgementId:'ack-ql401-workshop',assignmentId:'assignment-ql400-0001',
    queueId:'correlation-ql392-workshop/devilndove/SOURCE_OWNER',sourceId:'devilndove',
    correlationId:'correlation-ql392-workshop',acknowledgerRole:'SOURCE_OWNER',
    observedAt:'2026-11-09T09:44:30Z',outcome:'SCENARIO_RECEIVED'},
  {acknowledgementId:'ack-ql401-local',assignmentId:'assignment-ql400-0003',
    queueId:'correlation-ql392-local/rosevear-ai-hub/RECEIVER',sourceId:'rosevear-ai-hub',
    correlationId:'correlation-ql392-local',acknowledgerRole:'RECEIVER_OPERATOR',
    observedAt:'2026-11-09T09:44:30Z',outcome:'SCENARIO_RECEIVED'}
];
export const QL401_DEMO_DRAFTS=QL400_DEMO_DRAFTS;
export const QL401_DEMO_REQUESTS=QL400_DEMO_REQUESTS;
export const QL401_DEMO_OUTCOMES=QL400_DEMO_OUTCOMES;
export const QL401_DEMO_AUDIT=QL400_DEMO_AUDIT;
export const QL401_DEMO_EXCEPTIONS=QL400_DEMO_EXCEPTIONS;
export const QL401_DEMO_NOW=QL400_DEMO_NOW;
