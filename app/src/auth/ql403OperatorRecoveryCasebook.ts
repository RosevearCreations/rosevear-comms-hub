import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import type {QL396OwnerScope,QL396RecheckRequest} from './ql396OperatorRecheckQueue';
import type {QL397Observation} from './ql397RecheckOutcomeHistory';
import type {QL398AuditNote} from './ql398ClosureReadinessAudit';
import type {QL399ReviewerException} from './ql399EvidenceHandoffReadiness';
import type {QL400AssignmentDraft} from './ql400HandoffAssignmentPreview';
import type {QL401AcknowledgementDraft} from './ql401EscalationTimeline';
import {reviewOperatorRecoveryDecisions,type QL402RecoveryNote,
  QL402_DEMO_ACKS,QL402_DEMO_AUDIT,QL402_DEMO_DRAFTS,QL402_DEMO_EXCEPTIONS,
  QL402_DEMO_NOTES,QL402_DEMO_NOW,QL402_DEMO_OUTCOMES,QL402_DEMO_REQUESTS}
  from './ql402RecoveryDecisionAudit';

export type QL403HandoffKind='ORIGINAL_EVIDENCE_INTAKE'|'INDEPENDENT_REVIEW'|'OWNER_VERIFICATION';
export type QL403CaseEntry={
  caseId:string;assignmentId:string;sourceId:string;correlationId:string;
  requestedBy:QL396OwnerScope;kind:QL403HandoffKind;recordedAt:string;
  referenceReviewId:string|null;
};
export type QL403IntakeRequirement={
  gate:'SOURCE_OWNER'|'MASTER_OWNER'|'SOURCE_PIN'|'RECEIVER'|'CONSENT';
  custodian:QL396OwnerScope;originalArtifact:string;requiredVerification:string;
  evidenceIntake:'NOT_RECEIVED';independentReview:'NOT_PERFORMED';
  ownerDecision:'NOT_SIGNED';verified:false;
};
export type QL403RecoveryCase={
  caseId:string;assignmentId:string;sourceId:string;correlationId:string;
  requestedBy:QL396OwnerScope;kind:QL403HandoffKind;recordedAt:string;
  referenceReviewId:string|null;caseState:'HOLD_INTAKE'|'HOLD_INDEPENDENT_REVIEW'|'HOLD_OWNER_VERIFICATION';
  originalEvidenceRequirements:QL403IntakeRequirement[];
  originalCustodyVerified:false;independentReviewerVerified:false;
  sourceOwnerSigned:false;masterOwnerSigned:false;
  receiverVerified:false;consentVerified:false;
  closureDecision:'HOLD';handoffAuthorized:false;sendEnabled:false;persisted:false;
  nextSafeAction:string;
};
export type QL403Casebook={
  state:'INERT_PREVIEW'|'HOLD';cases:QL403RecoveryCase[];total:number;
  unverifiedEvidenceAxes:number;verifiedOriginals:0;verifiedOwnerDecisions:0;
  authorizedHandoffs:0;sendEnabled:false;persisted:false;reason:string;
};
export type QL403Filters={sourceId:string;kind:'ALL'|QL403HandoffKind};
export const QL403_DEFAULT_FILTERS:QL403Filters={sourceId:'ALL',kind:'ALL'};
export const QL403_MAX_ENTRIES=30;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const timestamp=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const kinds=new Set<QL403HandoffKind>(['ORIGINAL_EVIDENCE_INTAKE','INDEPENDENT_REVIEW','OWNER_VERIFICATION']);

/** A casebook of proposed operator handoffs, not an original-evidence collector.
 * Original receipts, signer enrollment, witness attestation and owner decisions
 * belong exclusively to independently authenticated protected workflows. */
export function reviewOperatorRecoveryCasebook(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],outcomes:readonly QL397Observation[],
  audit:readonly QL398AuditNote[],exceptions:readonly QL399ReviewerException[],
  drafts:readonly QL400AssignmentDraft[],acks:readonly QL401AcknowledgementDraft[],
  notes:readonly QL402RecoveryNote[],entries:readonly QL403CaseEntry[],
  nowMs:number):QL403Casebook{
  const stopped=(reason:string):QL403Casebook=>({state:'HOLD',cases:[],total:0,
    unverifiedEvidenceAxes:0,verifiedOriginals:0,verifiedOwnerDecisions:0,
    authorizedHandoffs:0,sendEnabled:false,persisted:false,reason});
  const upstream=reviewOperatorRecoveryDecisions(preview,requests,outcomes,audit,
    exceptions,drafts,acks,notes,nowMs);
  if(upstream.state!=='INERT_PREVIEW'||!Array.isArray(entries)||
    entries.length>QL403_MAX_ENTRIES||!Number.isFinite(nowMs))
    return stopped('Valid source-scoped QL-402 HOLD decisions and a bounded casebook are required');
  const byAssignment=new Map(upstream.rows.map(row=>[row.assignmentId,row]));
  const byDraft=new Map(drafts.map(draft=>[draft.assignmentId,draft]));
  const allIds=new Set([...drafts.map(item=>item.assignmentId),
    ...acks.map(item=>item.acknowledgementId),...notes.map(item=>item.reviewId)]);
  for(const entry of entries){
    if(!entry||typeof entry.caseId!=='string'||!opaque.test(entry.caseId)||allIds.has(entry.caseId)||
      typeof entry.assignmentId!=='string'||!byAssignment.has(entry.assignmentId)||
      !kinds.has(entry.kind)||typeof entry.recordedAt!=='string'||!timestamp.test(entry.recordedAt)||
      !Number.isFinite(Date.parse(entry.recordedAt))||Date.parse(entry.recordedAt)>nowMs||
      Date.parse(entry.recordedAt)<Date.parse(byDraft.get(entry.assignmentId)!.draftedAt))
      return stopped('Unbound, duplicate-type, malformed, future or unsourced recovery case');
    const row=byAssignment.get(entry.assignmentId)!;
    if(entry.sourceId!==row.sourceId||entry.correlationId!==row.correlationId||
      entry.requestedBy!==row.reviewerRole||
      (entry.referenceReviewId!==null&&(!row.decisionTrace.some(note=>
        note.reviewId===entry.referenceReviewId&&Date.parse(note.observedAt)<=Date.parse(entry.recordedAt)))))
      return stopped('Cross-source, cross-role or fabricated scenario review handoff reference');
    allIds.add(entry.caseId);
  }
  const cases:QL403RecoveryCase[]=[...entries].sort((a,b)=>Date.parse(a.recordedAt)-Date.parse(b.recordedAt)||
    a.caseId.localeCompare(b.caseId)).map(entry=>{
    const row=byAssignment.get(entry.assignmentId)!;
    const requirements:QL403IntakeRequirement[]=row.signoffChecklist.map(check=>({
      gate:check.gate,custodian:check.custodian,originalArtifact:check.requirement,
      requiredVerification:check.gate==='SOURCE_OWNER'?'Source owner identity and original signed source authority':
        check.gate==='MASTER_OWNER'?'Independent master owner decision tied to this exact source and purpose':
        check.gate==='SOURCE_PIN'?'Original source signing key custody, issuer and independent witness':
        check.gate==='RECEIVER'?'Authenticated receiver enrollment, scope and non-replay receipt':
        'Tenant boundary, purpose-specific consent and independent witness where required',
      evidenceIntake:'NOT_RECEIVED' as const,independentReview:'NOT_PERFORMED' as const,
      ownerDecision:'NOT_SIGNED' as const,verified:false as const
    }));
    return {...entry,caseState:entry.kind==='ORIGINAL_EVIDENCE_INTAKE'?'HOLD_INTAKE' as const:
      entry.kind==='INDEPENDENT_REVIEW'?'HOLD_INDEPENDENT_REVIEW' as const:
        'HOLD_OWNER_VERIFICATION' as const,
      originalEvidenceRequirements:requirements,originalCustodyVerified:false as const,
      independentReviewerVerified:false as const,sourceOwnerSigned:false as const,
      masterOwnerSigned:false as const,receiverVerified:false as const,consentVerified:false as const,
      closureDecision:'HOLD' as const,handoffAuthorized:false as const,sendEnabled:false as const,
      persisted:false as const,
      nextSafeAction:entry.kind==='ORIGINAL_EVIDENCE_INTAKE'?
        'Ask source custodian to present original evidence in a protected channel; do not upload originals into this preview.':
        entry.kind==='INDEPENDENT_REVIEW'?
          'Have an independent reviewer inspect custody, issuer, witness and source binding outside this preview.':
          'Obtain separate authenticated source/master owner decisions and a signed receiver receipt before changing HOLD.'};
  });
  if(cases.some(item=>item.originalEvidenceRequirements.length!==5||
    new Set(item.originalEvidenceRequirements.map(check=>check.gate)).size!==5))
    return stopped('All five independent original intake and verification axes are required');
  return {state:'INERT_PREVIEW',cases,total:cases.length,
    unverifiedEvidenceAxes:cases.reduce((sum,item)=>sum+item.originalEvidenceRequirements.length,0),
    verifiedOriginals:0,verifiedOwnerDecisions:0,authorizedHandoffs:0,
    sendEnabled:false,persisted:false,
    reason:'Scenario casebook only; original evidence, independent custody and both owner sign-offs remain unverified'};
}

export function filterOperatorRecoveryCasebook(value:QL403Casebook,
  filters:QL403Filters):QL403RecoveryCase[]{
  if(value.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!value.cases.some(item=>item.sourceId===filters.sourceId))||
    (filters.kind!=='ALL'&&!kinds.has(filters.kind)))return [];
  return value.cases.filter(item=>(filters.sourceId==='ALL'||item.sourceId===filters.sourceId)&&
    (filters.kind==='ALL'||item.kind===filters.kind));
}

export const QL403_DEMO_ENTRIES:readonly QL403CaseEntry[]=[
  {caseId:'case-ql403-workshop-0001',assignmentId:'assignment-ql400-0001',
    sourceId:'devilndove',correlationId:'correlation-ql392-workshop',requestedBy:'SOURCE_OWNER',
    kind:'OWNER_VERIFICATION',recordedAt:'2026-11-09T09:44:58Z',
    referenceReviewId:'review-ql402-workshop-2'},
  {caseId:'case-ql403-icamp-0002',assignmentId:'assignment-ql400-0002',
    sourceId:'icamp',correlationId:'correlation-ql392-integration',requestedBy:'MASTER_OWNER',
    kind:'ORIGINAL_EVIDENCE_INTAKE',recordedAt:'2026-11-09T09:44:59Z',
    referenceReviewId:'review-ql402-icamp-1'},
  {caseId:'case-ql403-local-0003',assignmentId:'assignment-ql400-0003',
    sourceId:'rosevear-ai-hub',correlationId:'correlation-ql392-local',requestedBy:'RECEIVER_OPERATOR',
    kind:'INDEPENDENT_REVIEW',recordedAt:'2026-11-09T09:44:59Z',
    referenceReviewId:'review-ql402-local-2'}
];
export const QL403_DEMO_NOTES=QL402_DEMO_NOTES;
export const QL403_DEMO_ACKS=QL402_DEMO_ACKS;
export const QL403_DEMO_DRAFTS=QL402_DEMO_DRAFTS;
export const QL403_DEMO_REQUESTS=QL402_DEMO_REQUESTS;
export const QL403_DEMO_OUTCOMES=QL402_DEMO_OUTCOMES;
export const QL403_DEMO_AUDIT=QL402_DEMO_AUDIT;
export const QL403_DEMO_EXCEPTIONS=QL402_DEMO_EXCEPTIONS;
export const QL403_DEMO_NOW=QL402_DEMO_NOW;
