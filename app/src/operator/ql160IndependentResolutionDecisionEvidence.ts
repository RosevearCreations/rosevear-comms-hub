import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import type { Ql153ReadinessReview } from './ql153SyntheticResolutionReadiness';
import type { Ql154IndependentDecisionReview } from './ql154SyntheticDecisionEvidenceContinuity';
import type { Ql155SyntheticAuditReadiness } from './ql155SyntheticAuditReadiness';
import type { Ql156IndependentEvidenceReview } from './ql156SyntheticAuditEvidenceValidation';
import type { Ql157PrerequisiteReconciliation } from './ql157OwnerPrerequisiteGovernance';
import type { Ql158OwnerGovernanceReview } from './ql158GovernanceEvidenceEscalation';
import {
  reviewQl159SyntheticEscalationContinuity,
  type Ql159EscalationContinuityReview,
  type Ql159ResolutionFollowUp
} from './ql159SyntheticEscalationResolutionContinuity';

export type Ql160ReviewGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  onBlock: string;
};
export type Ql160ResolutionDecisionBoundary = {
  holdId: string;
  syntheticRoute: Ql159ResolutionFollowUp['proposedRoute'];
  evidenceNeeded: string;
  disposition: 'keep_open_for_separate_owner_review';
  humanReviewRequired: true;
  independentEvidenceRequired: true;
  realOwnerAcceptanceRecorded: false;
  realResolutionAuthorized: false;
  escalationDispatched: false;
};
export type Ql160IndependentDecisionEvidence = {
  build: 'QL-160';
  reviewedBuild: 'QL-159';
  mode: 'synthetic_owner_boundary_review_only';
  outcome: 'synthetic_decision_criteria_met_only' | 'synthetic_owner_boundary_review_held';
  sourceIntegrityVerified: boolean;
  gates: readonly Ql160ReviewGate[];
  summary: { passed: number; blocked: number };
  originalHoldIds: readonly string[];
  independentlyReplayedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  decisionBoundaries: readonly Ql160ResolutionDecisionBoundary[];
  documentedOwnerPrerequisites: readonly string[];
  verifiedExternalEvidence: false;
  ownerIdentityVerified: false;
  ownerConsentCaptured: false;
  ownerDecisionRecorded: false;
  actualHoldClosed: false;
  durableAuditWritten: false;
  escalationDispatched: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  liveCommunicationsEnabled: false;
  warning: string;
};

const REQUIRED_159 = [
  'ql159-exact-lineage',
  'ql159-replay-evidence',
  'ql159-recount-outcomes',
  'ql159-hold-continuity',
  'ql159-owner-prerequisites',
  'ql159-escalation-provenance',
  'ql159-resolution-readiness',
  'ql159-runtime-boundaries'
] as const;
const OWNER_CRITERIA = [
  'ql156-owner-identity',
  'ql156-evidence-provenance',
  'ql156-hold-disposition',
  'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

function gate(id: string, requirement: string, passed: boolean, onBlock: string): Ql160ReviewGate {
  return { id, requirement, status: passed ? 'pass' : 'blocked', onBlock };
}
function proposalRoute(holdId: string): Ql159ResolutionFollowUp['proposedRoute'] {
  return /integrity|source|governance|review-readiness|review-hold/.test(holdId)
    ? 'synthetic_integrity_review' : 'synthetic_evidence_follow_up';
}

// Pure and deterministic. Re-check synthetic source without authorizing
// real-world decisions, evidence collection, escalations or storage.
export function reviewQl160IndependentResolutionDecisionEvidence(
  source: Ql159EscalationContinuityReview,
  proposedEscalations: Ql158OwnerGovernanceReview,
  governance: Ql157PrerequisiteReconciliation,
  evidenceValidation: Ql156IndependentEvidenceReview,
  auditReadiness: Ql155SyntheticAuditReadiness,
  decisionContinuity: Ql154IndependentDecisionReview,
  resolutionReadiness: Ql153ReadinessReview,
  evidenceRecheck: Ql152FollowUpEvidenceRecheck,
  priorFollowUps: Ql151IndependentFollowUpReview,
  priorContinuity: Ql150AcceptanceContinuity,
  priorAcceptance: Ql149IndependentAcceptance
): Ql160IndependentDecisionEvidence {
  const replay = reviewQl159SyntheticEscalationContinuity(
    proposedEscalations, governance, evidenceValidation, auditReadiness,
    decisionContinuity, resolutionReadiness, evidenceRecheck,
    priorFollowUps, priorContinuity, priorAcceptance
  );
  const ids = source.gates.map(item => item.id);
  const exactContract =
    source.build === 'QL-159' && source.sourceBuild === 'QL-158' &&
    source.mode === 'synthetic_follow_up_continuity_only' &&
    ids.length === REQUIRED_159.length &&
    new Set(ids).size === REQUIRED_159.length &&
    REQUIRED_159.every(id => ids.includes(id));
  const independentReplay = exactContract && source.gates.every(actual =>
    replay.gates.some(expected =>
      expected.id === actual.id && expected.status === actual.status &&
      expected.requirement === actual.requirement &&
      expected.ifBlocked === actual.ifBlocked
    )
  );
  const counts = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const outcomeReconciled =
    independentReplay &&
    source.summary.passed === counts.passed &&
    source.summary.blocked === counts.blocked &&
    replay.summary.passed === counts.passed &&
    replay.summary.blocked === counts.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const originalHoldIds = [...new Set(source.unresolvedHoldIds)];
  const replayHoldIds = [...new Set(replay.unresolvedHoldIds)];
  const upstreamHoldIds = [...new Set([
    ...proposedEscalations.outstandingHoldIds,
    ...governance.outstandingHoldIds, ...evidenceValidation.outstandingHoldIds,
    ...auditReadiness.outstandingHoldIds, ...decisionContinuity.unresolvedHoldIds,
    ...resolutionReadiness.outstandingHoldIds, ...evidenceRecheck.outstandingHoldIds,
    ...priorFollowUps.preservedHoldIds, ...priorContinuity.outstandingHoldIds,
    ...priorAcceptance.unresolvedHoldIds
  ])];
  const holdContinuity =
    originalHoldIds.length === source.unresolvedHoldIds.length &&
    originalHoldIds.length === replayHoldIds.length &&
    replayHoldIds.every(id => originalHoldIds.includes(id)) &&
    upstreamHoldIds.every(id => originalHoldIds.includes(id)) &&
    source.originalHoldIds.every(id => originalHoldIds.includes(id)) &&
    source.replayedHoldIds.every(id => originalHoldIds.includes(id));

  const followUpIntegrity = holdContinuity &&
    source.resolutionFollowUps.length === originalHoldIds.length &&
    new Set(source.resolutionFollowUps.map(item => item.holdId)).size === originalHoldIds.length &&
    originalHoldIds.every(id => source.resolutionFollowUps.some(item => item.holdId === id)) &&
    source.resolutionFollowUps.every(actual =>
      actual.disposition === 'retain_open_for_independent_follow_up' &&
      actual.readiness === 'real_resolution_not_authorized' &&
      actual.independentEvidencePending === true &&
      actual.humanDecisionPending === true &&
      actual.dispatched === false &&
      actual.realClosureAuthorized === false &&
      actual.proposedRoute === proposalRoute(actual.holdId) &&
      actual.evidenceNeeded.trim().length > 0 &&
      replay.resolutionFollowUps.some(expected =>
        expected.holdId === actual.holdId &&
        expected.proposedRoute === actual.proposedRoute &&
        expected.evidenceNeeded === actual.evidenceNeeded &&
        expected.disposition === actual.disposition &&
        expected.readiness === actual.readiness &&
        expected.independentEvidencePending === actual.independentEvidencePending &&
        expected.humanDecisionPending === actual.humanDecisionPending &&
        expected.dispatched === actual.dispatched &&
        expected.realClosureAuthorized === actual.realClosureAuthorized
      )
    );

  const criteria = governance.prerequisites.map(item => item.id);
  const ownerPrerequisitesIntact =
    criteria.length === OWNER_CRITERIA.length &&
    new Set(criteria).size === OWNER_CRITERIA.length &&
    OWNER_CRITERIA.every(id => criteria.includes(id)) &&
    governance.prerequisites.every(item =>
      item.status === 'documented_not_authorized' &&
      item.verificationPath === 'separate_private_human_review_required' &&
      item.approvalRecorded === false &&
      item.description.trim().length > 0
    ) &&
    proposedEscalations.ownerPrerequisiteIds.length === OWNER_CRITERIA.length &&
    proposedEscalations.ownerPrerequisiteIds.every(id => criteria.includes(id));

  const realOperationsLocked =
    source.realOwnerVerified === false &&
    source.ownerApprovalRecorded === false &&
    source.independentExternalEvidenceVerified === false &&
    source.escalationDispatched === false &&
    source.realExceptionClosed === false &&
    source.auditPersisted === false &&
    source.exportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.livePhoneSmsEnabled === false &&
    replay.realOwnerVerified === false &&
    replay.ownerApprovalRecorded === false &&
    replay.independentExternalEvidenceVerified === false &&
    replay.escalationDispatched === false &&
    replay.realExceptionClosed === false &&
    replay.auditPersisted === false &&
    replay.exportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.livePhoneSmsEnabled === false &&
    proposedEscalations.ownerVerified === false &&
    proposedEscalations.ownerApprovalRecorded === false &&
    proposedEscalations.realEscalationDispatched === false &&
    proposedEscalations.actualHoldClosed === false &&
    proposedEscalations.durableAuditWritten === false &&
    proposedEscalations.canTransmit === false &&
    proposedEscalations.livePhoneSmsEnabled === false;

  const sourceIntegrityVerified =
    exactContract && independentReplay && outcomeReconciled &&
    holdContinuity && followUpIntegrity &&
    ownerPrerequisitesIntact && realOperationsLocked;
  const noUnresolvedHolds =
    sourceIntegrityVerified && source.sourceIntegrityVerified &&
    originalHoldIds.length === 0 && upstreamHoldIds.length === 0 &&
    counts.blocked === 0 && proposedEscalations.summary.blocked === 0 &&
    governance.summary.blocked === 0 && evidenceValidation.summary.blocked === 0 &&
    auditReadiness.summary.blocked === 0 && decisionContinuity.summary.blocked === 0 &&
    resolutionReadiness.summary.blocked === 0 && evidenceRecheck.summary.blocked === 0 &&
    priorFollowUps.summary.blocked === 0 && priorContinuity.summary.blocked === 0 &&
    priorAcceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_continuity_criteria_met_only';

  const gates: readonly Ql160ReviewGate[] = [
    gate('ql160-source-contract', 'Exact QL-159 eight-gate contract and build lineage',
      exactContract, 'Restore the exact synthetic source contract.'),
    gate('ql160-independent-replay', 'Independent replay preserves every gate status and evidence description',
      independentReplay, 'Recheck altered evidence without claiming a real decision.'),
    gate('ql160-outcome-consistency', 'Recomputed totals, source outcome and integrity match replay',
      outcomeReconciled, 'Reject unsupported readiness labels.'),
    gate('ql160-hold-parity', 'No unresolved QL-149 through QL-159 hold is omitted or duplicated',
      holdContinuity, 'Restore missing holds and keep them open.'),
    gate('ql160-resolution-evidence', 'One exact, non-executed resolution follow-up per open hold',
      followUpIntegrity, 'Restore the original synthetic evidence requirement.'),
    gate('ql160-owner-boundary', 'All five owner prerequisites remain unapproved and require private review',
      ownerPrerequisitesIntact, 'Do not treat documented prerequisites as owner acceptance.'),
    gate('ql160-synthetic-ready', 'Synthetic readiness requires zero unresolved holds and blocked gates',
      noUnresolvedHolds, 'Keep the synthetic review held until evidence is independently reconciled.'),
    gate('ql160-no-real-action', 'No real approval, hold closure, evidence export, audit write or live provider action',
      realOperationsLocked, 'Restore the strict no-live, no-write owner escalation boundary.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...originalHoldIds, ...replayHoldIds, ...upstreamHoldIds,
    ...(!sourceIntegrityVerified ? ['ql160-independent-evidence-integrity-hold'] : []),
    ...(summary.blocked > 0 && originalHoldIds.length === 0 ? ['ql160-owner-decision-boundary-hold'] : [])
  ])];
  const decisionBoundaries: readonly Ql160ResolutionDecisionBoundary[] = outstandingHoldIds.map(holdId => ({
    holdId,
    syntheticRoute: proposalRoute(holdId),
    evidenceNeeded: source.resolutionFollowUps.find(item => item.holdId === holdId)?.evidenceNeeded ??
      'Require new independently reviewed synthetic evidence and separate owner review.',
    disposition: 'keep_open_for_separate_owner_review' as const,
    humanReviewRequired: true as const,
    independentEvidenceRequired: true as const,
    realOwnerAcceptanceRecorded: false as const,
    realResolutionAuthorized: false as const,
    escalationDispatched: false as const
  }));
  return {
    build: 'QL-160', reviewedBuild: 'QL-159',
    mode: 'synthetic_owner_boundary_review_only',
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_decision_criteria_met_only' : 'synthetic_owner_boundary_review_held',
    sourceIntegrityVerified, gates, summary, originalHoldIds,
    independentlyReplayedHoldIds: replayHoldIds, outstandingHoldIds,
    decisionBoundaries, documentedOwnerPrerequisites: criteria,
    verifiedExternalEvidence: false, ownerIdentityVerified: false,
    ownerConsentCaptured: false, ownerDecisionRecorded: false,
    actualHoldClosed: false, durableAuditWritten: false,
    escalationDispatched: false, exportEnabled: false,
    downloadEnabled: false, canTransmit: false,
    liveCommunicationsEnabled: false,
    warning: 'Synthetic-only independent evidence and owner-boundary review. No real owner decision, independent external attestation, escalation delivery, actual hold closure, audit persistence or Phone/SMS service is enabled.'
  };
}
