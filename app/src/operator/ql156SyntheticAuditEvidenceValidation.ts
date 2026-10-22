import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import type { Ql153ReadinessReview } from './ql153SyntheticResolutionReadiness';
import type { Ql154IndependentDecisionReview } from './ql154SyntheticDecisionEvidenceContinuity';
import {
  reviewQl155SyntheticAuditFollowUp,
  type Ql155SyntheticAuditReadiness
} from './ql155SyntheticAuditReadiness';

export type Ql156AuditEvidenceCheck = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  followUpIfBlocked: string;
};
export type Ql156OwnerReviewCriterion = {
  id: string;
  status: 'criteria_documented_not_approved';
  requirement: string;
  humanDecisionRequired: true;
};
export type Ql156HeldAuditEvidence = {
  id: string;
  status: 'unresolved_requires_follow_up';
  requiredEvidence: string;
  autoClosePermitted: false;
  ownerReviewRecorded: false;
};
export type Ql156IndependentEvidenceReview = {
  build: 'QL-156';
  reviewedBuild: 'QL-155';
  mode: 'synthetic_evidence_validation_only';
  outcome: 'synthetic_owner_review_criteria_ready_only' | 'synthetic_evidence_owner_review_held';
  sourceReconciled: boolean;
  checks: readonly Ql156AuditEvidenceCheck[];
  summary: { passed: number; blocked: number };
  originalHoldIds: readonly string[];
  replayedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  heldEvidence: readonly Ql156HeldAuditEvidence[];
  ownerReviewCriteria: readonly Ql156OwnerReviewCriterion[];
  realIndependentEvidenceVerified: false;
  realOwnerReviewCompleted: false;
  ownerApprovalRecorded: false;
  actualHoldClosed: false;
  consentCaptured: false;
  durableAuditPersisted: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const EXPECTED_QL155_GATES = [
  'ql155-lineage',
  'ql155-independent-replay',
  'ql155-count-outcome',
  'ql155-preserved-holds',
  'ql155-audit-candidates',
  'ql155-zero-open-holds',
  'ql155-no-durable-audit',
  'ql155-human-decision-boundary'
] as const;
const OWNER_CRITERIA = [
  ['ql156-owner-identity', 'An authorized human owner must be identified in a separately approved private workflow.'],
  ['ql156-evidence-provenance', 'Every relevant hold requires independently verified, new evidence with provenance and integrity controls.'],
  ['ql156-hold-disposition', 'All outstanding hold IDs must be reconciled explicitly; no hold may be silently removed or auto-closed.'],
  ['ql156-consent-and-scope', 'Actual customer consent, privacy, data retention and communication scope must be approved separately.'],
  ['ql156-audit-signoff', 'A durable, access-controlled audit and human sign-off mechanism requires a separate authorized build.']
] as const;

function auditCheck(
  id: string, requirement: string, passed: boolean, followUpIfBlocked: string
): Ql156AuditEvidenceCheck {
  return { id, requirement, status: passed ? 'pass' : 'blocked', followUpIfBlocked };
}

// Pure, deterministic verification of synthetic evidence contracts; it neither
// produces new external evidence nor collects real approvals, identity, or data.
export function validateQl156SyntheticAuditEvidence(
  source: Ql155SyntheticAuditReadiness,
  decision: Ql154IndependentDecisionReview,
  resolution: Ql153ReadinessReview,
  evidence: Ql152FollowUpEvidenceRecheck,
  followUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql156IndependentEvidenceReview {
  const replay = reviewQl155SyntheticAuditFollowUp(
    decision, resolution, evidence, followUps, continuity, acceptance
  );
  const sourceIds = source.checks.map(item => item.id);
  const contract =
    source.build === 'QL-155' &&
    source.reviewedBuild === 'QL-154' &&
    source.mode === 'synthetic_audit_readiness_only' &&
    source.checks.length === EXPECTED_QL155_GATES.length &&
    new Set(sourceIds).size === EXPECTED_QL155_GATES.length &&
    EXPECTED_QL155_GATES.every(id => sourceIds.includes(id));
  const gateReplay =
    contract && source.checks.every(actual => replay.checks.some(expected =>
      actual.id === expected.id &&
      actual.status === expected.status &&
      actual.requirement === expected.requirement &&
      actual.followUpIfBlocked === expected.followUpIfBlocked
    ));
  const counted = {
    passed: source.checks.filter(item => item.status === 'pass').length,
    blocked: source.checks.filter(item => item.status === 'blocked').length
  };
  const totalsAndOutcomes =
    gateReplay &&
    source.summary.passed === counted.passed &&
    source.summary.blocked === counted.blocked &&
    replay.summary.passed === counted.passed &&
    replay.summary.blocked === counted.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const originalHoldIds = [...new Set(source.outstandingHoldIds)];
  const replayedHoldIds = [...new Set(replay.outstandingHoldIds)];
  const previousHolds = [...new Set([
    ...decision.unresolvedHoldIds,
    ...resolution.outstandingHoldIds,
    ...evidence.outstandingHoldIds,
    ...followUps.preservedHoldIds,
    ...continuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const uniqueOriginal = originalHoldIds.length === source.outstandingHoldIds.length;
  const holdLineage =
    uniqueOriginal &&
    originalHoldIds.length === replayedHoldIds.length &&
    replayedHoldIds.every(id => originalHoldIds.includes(id)) &&
    previousHolds.every(id => originalHoldIds.includes(id));

  const candidatesReconciled =
    holdLineage &&
    source.followUpCandidates.length === originalHoldIds.length &&
    new Set(source.followUpCandidates.map(item => item.id)).size === originalHoldIds.length &&
    originalHoldIds.every(id => source.followUpCandidates.some(item =>
      item.id === id &&
      item.disposition === 'hold_open_for_later_independent_review' &&
      item.ownerReviewRequired === true &&
      item.actualClosureAuthorized === false &&
      item.evidenceRequired.trim().length > 0
    )) &&
    source.followUpCandidates.every(actual => replay.followUpCandidates.some(expected =>
      actual.id === expected.id &&
      actual.disposition === expected.disposition &&
      actual.evidenceRequired === expected.evidenceRequired &&
      actual.ownerReviewRequired === expected.ownerReviewRequired &&
      actual.actualClosureAuthorized === expected.actualClosureAuthorized
    ));

  const noRealActions =
    source.durableAuditRecorded === false &&
    source.ownerApprovalCaptured === false &&
    source.actualExceptionClosed === false &&
    source.evidencePersisted === false &&
    source.exportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.liveCommunicationsEnabled === false &&
    replay.durableAuditRecorded === false &&
    replay.ownerApprovalCaptured === false &&
    replay.actualExceptionClosed === false &&
    replay.evidencePersisted === false &&
    replay.exportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.liveCommunicationsEnabled === false &&
    decision.durableAuditWritten === false &&
    decision.ownerApprovalCaptured === false &&
    decision.actualHoldClosed === false &&
    decision.consentCaptured === false &&
    decision.exportEnabled === false &&
    decision.downloadEnabled === false &&
    decision.canTransmit === false &&
    decision.livePhoneSmsEnabled === false;

  const ownerReviewCriteria: readonly Ql156OwnerReviewCriterion[] =
    OWNER_CRITERIA.map(([id, requirement]) => ({
      id,
      status: 'criteria_documented_not_approved' as const,
      requirement,
      humanDecisionRequired: true as const
    }));
  const criteriaComplete =
    ownerReviewCriteria.length === OWNER_CRITERIA.length &&
    new Set(ownerReviewCriteria.map(item => item.id)).size === OWNER_CRITERIA.length &&
    ownerReviewCriteria.every(item => item.requirement.trim().length > 0);

  const sourceReconciled =
    contract && gateReplay && totalsAndOutcomes &&
    holdLineage && candidatesReconciled && noRealActions && criteriaComplete;
  const zeroUnresolved =
    sourceReconciled &&
    source.sourceIntegrityVerified === true &&
    originalHoldIds.length === 0 &&
    previousHolds.length === 0 &&
    counted.blocked === 0 &&
    decision.summary.blocked === 0 &&
    resolution.summary.blocked === 0 &&
    evidence.summary.blocked === 0 &&
    followUps.summary.blocked === 0 &&
    continuity.summary.blocked === 0 &&
    acceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_audit_criteria_met_only';

  const checks: readonly Ql156AuditEvidenceCheck[] = [
    auditCheck('ql156-source-lineage', 'Exact QL-155 eight-gate contract and source identity', contract,
      'Hold review until source identity and gate IDs reconcile.'),
    auditCheck('ql156-independent-replay', 'Every QL-155 gate result and description reproduces independently',
      gateReplay, 'Investigate discrepancies without changing any real record.'),
    auditCheck('ql156-totals-outcome', 'Recounted results and synthetic outcomes exactly match replay',
      totalsAndOutcomes, 'Do not accept self-reported passing labels as external evidence.'),
    auditCheck('ql156-hold-continuity', 'All previous hold identifiers remain present and unique',
      holdLineage, 'Restore each missing hold; never automatically close an exception.'),
    auditCheck('ql156-follow-up-evidence', 'Every open hold has one unchanged non-closable evidence requirement',
      candidatesReconciled, 'Recreate the synthetic follow-up without persisting evidence.'),
    auditCheck('ql156-owner-review-criteria', 'Five explicit human review prerequisites are documented',
      criteriaComplete, 'Document missing prerequisites; no owner approval is collected.'),
    auditCheck('ql156-zero-open-holds', 'A synthetic-ready label requires no unresolved holds or failed gates',
      zeroUnresolved, 'Keep all exceptions held pending independent future evidence.'),
    auditCheck('ql156-no-real-approval', 'No actual owner approval, durable audit, closure, export or live phone/SMS',
      noRealActions, 'Restore all disabled write and communications safeguards.')
  ];
  const summary = {
    passed: checks.filter(item => item.status === 'pass').length,
    blocked: checks.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...originalHoldIds,
    ...replayedHoldIds,
    ...previousHolds,
    ...(!sourceReconciled ? ['ql156-source-integrity-hold'] : []),
    ...(summary.blocked > 0 && originalHoldIds.length === 0 ? ['ql156-review-readiness-hold'] : [])
  ])];
  const heldEvidence: readonly Ql156HeldAuditEvidence[] = outstandingHoldIds.map(id => ({
    id,
    status: 'unresolved_requires_follow_up' as const,
    requiredEvidence: source.followUpCandidates.find(item => item.id === id)?.evidenceRequired ??
      'Independent, new synthetic evidence and explicit future human review criteria required.',
    autoClosePermitted: false as const,
    ownerReviewRecorded: false as const
  }));
  return {
    build: 'QL-156', reviewedBuild: 'QL-155',
    mode: 'synthetic_evidence_validation_only',
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_owner_review_criteria_ready_only' : 'synthetic_evidence_owner_review_held',
    sourceReconciled, checks, summary, originalHoldIds,
    replayedHoldIds, outstandingHoldIds, heldEvidence, ownerReviewCriteria,
    realIndependentEvidenceVerified: false, realOwnerReviewCompleted: false,
    ownerApprovalRecorded: false, actualHoldClosed: false,
    consentCaptured: false, durableAuditPersisted: false,
    exportEnabled: false, downloadEnabled: false, canTransmit: false,
    livePhoneSmsEnabled: false,
    notice: 'Public, read-only synthetic evidence validation only. Owner review criteria are documented, not completed. This does not validate external evidence, obtain consent, authorize a closure, persist an audit or activate Phone/SMS.'
  };
}
