import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import type { Ql153ReadinessReview } from './ql153SyntheticResolutionReadiness';
import type { Ql154IndependentDecisionReview } from './ql154SyntheticDecisionEvidenceContinuity';
import type { Ql155SyntheticAuditReadiness } from './ql155SyntheticAuditReadiness';
import type { Ql156IndependentEvidenceReview } from './ql156SyntheticAuditEvidenceValidation';
import {
  reconcileQl157OwnerPrerequisitesAndFollowUps,
  type Ql157PrerequisiteReconciliation
} from './ql157OwnerPrerequisiteGovernance';

export type Ql158IntegrityGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  reviewIfBlocked: string;
};
export type Ql158EscalationDraft = {
  holdId: string;
  route: 'synthetic_integrity_review' | 'synthetic_evidence_follow_up';
  status: 'proposed_not_dispatched';
  evidenceRequirement: string;
  ownerReviewRequired: true;
  holdRemainsOpen: true;
  escalationSent: false;
  closureAuthorized: false;
};
export type Ql158OwnerGovernanceReview = {
  build: 'QL-158';
  reviewedBuild: 'QL-157';
  mode: 'synthetic_governance_escalation_proposal_only';
  outcome: 'synthetic_governance_integrity_ready_only' | 'synthetic_escalation_review_held';
  sourceIntegrityVerified: boolean;
  gates: readonly Ql158IntegrityGate[];
  summary: { passed: number; blocked: number };
  ownerPrerequisiteIds: readonly string[];
  sourceHoldIds: readonly string[];
  replayedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  escalationDrafts: readonly Ql158EscalationDraft[];
  realEvidenceAttested: false;
  ownerVerified: false;
  ownerApprovalRecorded: false;
  realEscalationDispatched: false;
  actualHoldClosed: false;
  consentRecorded: false;
  durableAuditWritten: false;
  evidenceExportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const EXPECTED_157_GATES = [
  'ql157-exact-lineage',
  'ql157-replay-consistency',
  'ql157-outcome-recount',
  'ql157-owner-prerequisites',
  'ql157-hold-continuity',
  'ql157-evidence-follow-ups',
  'ql157-owner-governance',
  'ql157-no-unresolved-holds',
  'ql157-runtime-locks'
] as const;
const EXPECTED_PREREQUISITES = [
  'ql156-owner-identity',
  'ql156-evidence-provenance',
  'ql156-hold-disposition',
  'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

function reviewGate(
  id: string, requirement: string, passed: boolean, reviewIfBlocked: string
): Ql158IntegrityGate {
  return { id, requirement, status: passed ? 'pass' : 'blocked', reviewIfBlocked };
}

function escalationRoute(id: string): Ql158EscalationDraft['route'] {
  // Classification only; never send a notification or launch an escalation.
  return /integrity|source|governance|review-readiness|review-hold/.test(id)
    ? 'synthetic_integrity_review' : 'synthetic_evidence_follow_up';
}

// Independently replay QL-157 from the existing public in-memory fixtures.
// This only renders proposed, non-executable escalation categories.
export function reviewQl158OwnerGovernanceEscalations(
  source: Ql157PrerequisiteReconciliation,
  evidenceValidation: Ql156IndependentEvidenceReview,
  auditReadiness: Ql155SyntheticAuditReadiness,
  decisionContinuity: Ql154IndependentDecisionReview,
  resolutionReadiness: Ql153ReadinessReview,
  evidenceRecheck: Ql152FollowUpEvidenceRecheck,
  priorFollowUps: Ql151IndependentFollowUpReview,
  priorContinuity: Ql150AcceptanceContinuity,
  priorAcceptance: Ql149IndependentAcceptance
): Ql158OwnerGovernanceReview {
  const replay = reconcileQl157OwnerPrerequisitesAndFollowUps(
    evidenceValidation, auditReadiness, decisionContinuity,
    resolutionReadiness, evidenceRecheck, priorFollowUps,
    priorContinuity, priorAcceptance
  );
  const gateIds = source.checks.map(item => item.id);
  const exactContract =
    source.build === 'QL-157' &&
    source.reviewedBuild === 'QL-156' &&
    source.mode === 'synthetic_public_read_only_governance' &&
    source.checks.length === EXPECTED_157_GATES.length &&
    new Set(gateIds).size === EXPECTED_157_GATES.length &&
    EXPECTED_157_GATES.every(id => gateIds.includes(id));

  const exactReplay = exactContract && source.checks.every(actual =>
    replay.checks.some(expected =>
      actual.id === expected.id &&
      actual.status === expected.status &&
      actual.requirement === expected.requirement &&
      actual.nextStepIfBlocked === expected.nextStepIfBlocked
    )
  );
  const recounted = {
    passed: source.checks.filter(item => item.status === 'pass').length,
    blocked: source.checks.filter(item => item.status === 'blocked').length
  };
  const outcomeReconciled =
    exactReplay &&
    recounted.passed === source.summary.passed &&
    recounted.blocked === source.summary.blocked &&
    recounted.passed === replay.summary.passed &&
    recounted.blocked === replay.summary.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const prerequisiteIds = source.prerequisites.map(item => item.id);
  const prerequisiteContinuity =
    source.prerequisites.length === EXPECTED_PREREQUISITES.length &&
    new Set(prerequisiteIds).size === EXPECTED_PREREQUISITES.length &&
    EXPECTED_PREREQUISITES.every(id => prerequisiteIds.includes(id)) &&
    source.prerequisites.every(actual =>
      actual.status === 'documented_not_authorized' &&
      actual.verificationPath === 'separate_private_human_review_required' &&
      actual.approvalRecorded === false &&
      actual.description.trim().length > 0 &&
      replay.prerequisites.some(expected =>
        expected.id === actual.id &&
        expected.status === actual.status &&
        expected.verificationPath === actual.verificationPath &&
        expected.description === actual.description &&
        expected.approvalRecorded === actual.approvalRecorded
      )
    );

  const sourceHoldIds = [...new Set(source.outstandingHoldIds)];
  const replayedHoldIds = [...new Set(replay.outstandingHoldIds)];
  const previousHolds = [...new Set([
    ...evidenceValidation.outstandingHoldIds,
    ...auditReadiness.outstandingHoldIds,
    ...decisionContinuity.unresolvedHoldIds,
    ...resolutionReadiness.outstandingHoldIds,
    ...evidenceRecheck.outstandingHoldIds,
    ...priorFollowUps.preservedHoldIds,
    ...priorContinuity.outstandingHoldIds,
    ...priorAcceptance.unresolvedHoldIds
  ])];
  const uniqueSourceHolds = sourceHoldIds.length === source.outstandingHoldIds.length;
  const holdContinuity =
    uniqueSourceHolds &&
    sourceHoldIds.length === replayedHoldIds.length &&
    replayedHoldIds.every(id => sourceHoldIds.includes(id)) &&
    previousHolds.every(id => sourceHoldIds.includes(id)) &&
    source.sourceHoldIds.every(id => sourceHoldIds.includes(id)) &&
    source.independentlyReproducedHoldIds.every(id => sourceHoldIds.includes(id));

  const followUpIntegrity =
    holdContinuity &&
    source.exceptionFollowUps.length === sourceHoldIds.length &&
    new Set(source.exceptionFollowUps.map(item => item.holdId)).size === sourceHoldIds.length &&
    sourceHoldIds.every(id => source.exceptionFollowUps.some(item =>
      item.holdId === id &&
      item.disposition === 'remain_open_pending_independent_review' &&
      item.evidenceRequirement.trim().length > 0 &&
      item.ownerDecisionRequired === true &&
      item.priority === 'review_required' &&
      item.completionRecorded === false &&
      item.actualClosureAuthorized === false
    )) &&
    source.exceptionFollowUps.every(actual =>
      replay.exceptionFollowUps.some(expected =>
        actual.holdId === expected.holdId &&
        actual.disposition === expected.disposition &&
        actual.evidenceRequirement === expected.evidenceRequirement &&
        actual.ownerDecisionRequired === expected.ownerDecisionRequired &&
        actual.priority === expected.priority &&
        actual.completionRecorded === expected.completionRecorded &&
        actual.actualClosureAuthorized === expected.actualClosureAuthorized
      )
    );

  const runtimeLocked =
    source.realOwnerVerified === false &&
    source.ownerApprovalRecorded === false &&
    source.consentRecorded === false &&
    source.actualExceptionClosed === false &&
    source.durableAuditPersisted === false &&
    source.evidenceExportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.livePhoneSmsEnabled === false &&
    replay.realOwnerVerified === false &&
    replay.ownerApprovalRecorded === false &&
    replay.consentRecorded === false &&
    replay.actualExceptionClosed === false &&
    replay.durableAuditPersisted === false &&
    replay.evidenceExportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.livePhoneSmsEnabled === false &&
    evidenceValidation.realIndependentEvidenceVerified === false &&
    evidenceValidation.realOwnerReviewCompleted === false &&
    evidenceValidation.ownerApprovalRecorded === false &&
    evidenceValidation.actualHoldClosed === false &&
    evidenceValidation.durableAuditPersisted === false &&
    evidenceValidation.exportEnabled === false &&
    evidenceValidation.canTransmit === false &&
    evidenceValidation.livePhoneSmsEnabled === false;

  const proposedEscalations: readonly Ql158EscalationDraft[] =
    sourceHoldIds.map(holdId => ({
      holdId,
      route: escalationRoute(holdId),
      status: 'proposed_not_dispatched' as const,
      evidenceRequirement: source.exceptionFollowUps.find(item =>
        item.holdId === holdId
      )?.evidenceRequirement ?? 'Separate synthetic evidence review is required.',
      ownerReviewRequired: true as const,
      holdRemainsOpen: true as const,
      escalationSent: false as const,
      closureAuthorized: false as const
    }));
  const escalationIntegrity =
    followUpIntegrity &&
    proposedEscalations.length === sourceHoldIds.length &&
    proposedEscalations.every(item =>
      item.escalationSent === false &&
      item.closureAuthorized === false &&
      item.holdRemainsOpen === true &&
      item.ownerReviewRequired === true &&
      source.exceptionFollowUps.some(followUp =>
        followUp.holdId === item.holdId &&
        followUp.evidenceRequirement === item.evidenceRequirement
      )
    );

  const sourceIntegrityVerified = exactContract && exactReplay &&
    outcomeReconciled && prerequisiteContinuity && holdContinuity &&
    followUpIntegrity && escalationIntegrity && runtimeLocked;
  const zeroOpenHolds = sourceIntegrityVerified &&
    source.sourceIntegrityVerified &&
    sourceHoldIds.length === 0 &&
    previousHolds.length === 0 &&
    recounted.blocked === 0 &&
    evidenceValidation.summary.blocked === 0 &&
    auditReadiness.summary.blocked === 0 &&
    decisionContinuity.summary.blocked === 0 &&
    resolutionReadiness.summary.blocked === 0 &&
    evidenceRecheck.summary.blocked === 0 &&
    priorFollowUps.summary.blocked === 0 &&
    priorContinuity.summary.blocked === 0 &&
    priorAcceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_governance_criteria_ready_only';

  const gates: readonly Ql158IntegrityGate[] = [
    reviewGate('ql158-source-contract', 'Exact QL-157 nine-gate lineage and identity',
      exactContract, 'Restore the QL-157 contract before any synthetic decision.'),
    reviewGate('ql158-independent-replay', 'Source statuses and evidence descriptions match an independent replay',
      exactReplay, 'Investigate the altered synthetic evidence and retain holds.'),
    reviewGate('ql158-outcome-consistency', 'Recomputed totals, outcome, and integrity flag match replay',
      outcomeReconciled, 'Block any claimed readiness based only on labels.'),
    reviewGate('ql158-owner-prerequisite-continuity', 'Five owner prerequisites remain exactly reproducible and unapproved',
      prerequisiteContinuity, 'Restore the unapproved human-review requirements.'),
    reviewGate('ql158-hold-lineage', 'No unresolved hold is lost from QL-149 through QL-157',
      holdContinuity, 'Reinstate all missing or duplicated synthetic hold IDs.'),
    reviewGate('ql158-follow-up-provenance', 'One unchanged, explicitly non-closable follow-up exists for each hold',
      followUpIntegrity, 'Restore the synthetic evidence requirement without changing hold status.'),
    reviewGate('ql158-escalation-proposal', 'Every open hold has a distinct, non-dispatched escalation proposal',
      escalationIntegrity, 'Rebuild the proposal; never dispatch a real escalation.'),
    reviewGate('ql158-zero-open-holds', 'Readiness requires zero holds and no blocked synthetic source gates',
      zeroOpenHolds, 'Keep all unresolved exceptions in review until new evidence is assessed.'),
    reviewGate('ql158-runtime-boundary', 'No real owner decision, closure, export, durable audit, or phone/SMS',
      runtimeLocked, 'Reinstate disabled communications and write safeguards.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...sourceHoldIds, ...replayedHoldIds, ...previousHolds,
    ...(!sourceIntegrityVerified ? ['ql158-evidence-integrity-hold'] : []),
    ...(summary.blocked > 0 && sourceHoldIds.length === 0 ?
      ['ql158-governance-review-hold'] : [])
  ])];
  const escalationDrafts: readonly Ql158EscalationDraft[] = outstandingHoldIds.map(holdId => ({
    holdId,
    route: escalationRoute(holdId),
    status: 'proposed_not_dispatched' as const,
    evidenceRequirement: source.exceptionFollowUps.find(item =>
      item.holdId === holdId
    )?.evidenceRequirement ??
      'Independent synthetic evidence and a separate authorized owner review required.',
    ownerReviewRequired: true as const,
    holdRemainsOpen: true as const,
    escalationSent: false as const,
    closureAuthorized: false as const
  }));
  return {
    build: 'QL-158', reviewedBuild: 'QL-157',
    mode: 'synthetic_governance_escalation_proposal_only',
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_governance_integrity_ready_only' : 'synthetic_escalation_review_held',
    sourceIntegrityVerified, gates, summary,
    ownerPrerequisiteIds: [...prerequisiteIds], sourceHoldIds,
    replayedHoldIds, outstandingHoldIds, escalationDrafts,
    realEvidenceAttested: false, ownerVerified: false,
    ownerApprovalRecorded: false, realEscalationDispatched: false,
    actualHoldClosed: false, consentRecorded: false,
    durableAuditWritten: false, evidenceExportEnabled: false,
    downloadEnabled: false, canTransmit: false, livePhoneSmsEnabled: false,
    notice: 'QL-158 is a public synthetic-only governance integrity review. Escalations are proposed in memory, not sent. No real owner authorization, customer evidence, actual hold closure, durable audit or live phone/SMS is permitted.'
  };
}
