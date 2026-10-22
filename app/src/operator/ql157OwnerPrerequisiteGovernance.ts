import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import type { Ql153ReadinessReview } from './ql153SyntheticResolutionReadiness';
import type { Ql154IndependentDecisionReview } from './ql154SyntheticDecisionEvidenceContinuity';
import type { Ql155SyntheticAuditReadiness } from './ql155SyntheticAuditReadiness';
import {
  validateQl156SyntheticAuditEvidence,
  type Ql156IndependentEvidenceReview
} from './ql156SyntheticAuditEvidenceValidation';

export type Ql157GovernanceCheck = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  nextStepIfBlocked: string;
};

export type Ql157OwnerPrerequisite = {
  id: string;
  description: string;
  status: 'documented_not_authorized';
  verificationPath: 'separate_private_human_review_required';
  approvalRecorded: false;
};

export type Ql157ExceptionFollowUp = {
  holdId: string;
  disposition: 'remain_open_pending_independent_review';
  evidenceRequirement: string;
  ownerDecisionRequired: true;
  priority: 'review_required';
  completionRecorded: false;
  actualClosureAuthorized: false;
};

export type Ql157PrerequisiteReconciliation = {
  build: 'QL-157';
  reviewedBuild: 'QL-156';
  mode: 'synthetic_public_read_only_governance';
  outcome: 'synthetic_governance_criteria_ready_only' | 'synthetic_governance_review_held';
  sourceIntegrityVerified: boolean;
  checks: readonly Ql157GovernanceCheck[];
  summary: { passed: number; blocked: number };
  prerequisites: readonly Ql157OwnerPrerequisite[];
  sourceHoldIds: readonly string[];
  independentlyReproducedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  exceptionFollowUps: readonly Ql157ExceptionFollowUp[];
  realOwnerVerified: false;
  ownerApprovalRecorded: false;
  consentRecorded: false;
  actualExceptionClosed: false;
  durableAuditPersisted: false;
  evidenceExportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const EXPECTED_156_GATES = [
  'ql156-source-lineage',
  'ql156-independent-replay',
  'ql156-totals-outcome',
  'ql156-hold-continuity',
  'ql156-follow-up-evidence',
  'ql156-owner-review-criteria',
  'ql156-zero-open-holds',
  'ql156-no-real-approval'
] as const;

const EXPECTED_OWNER_CRITERIA = [
  'ql156-owner-identity',
  'ql156-evidence-provenance',
  'ql156-hold-disposition',
  'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

function gate(id: string, requirement: string, ok: boolean, nextStepIfBlocked: string): Ql157GovernanceCheck {
  return { id, requirement, status: ok ? 'pass' : 'blocked', nextStepIfBlocked };
}

// This function checks a generated synthetic fixture only. No interaction in this
// workflow can create human approval, durable records or a real hold disposition.
export function reconcileQl157OwnerPrerequisitesAndFollowUps(
  source: Ql156IndependentEvidenceReview,
  audit: Ql155SyntheticAuditReadiness,
  decision: Ql154IndependentDecisionReview,
  resolution: Ql153ReadinessReview,
  evidence: Ql152FollowUpEvidenceRecheck,
  followUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql157PrerequisiteReconciliation {
  const replay = validateQl156SyntheticAuditEvidence(
    audit, decision, resolution, evidence, followUps, continuity, acceptance
  );
  const sourceGateIds = source.checks.map(item => item.id);
  const sourceContract =
    source.build === 'QL-156' &&
    source.reviewedBuild === 'QL-155' &&
    source.mode === 'synthetic_evidence_validation_only' &&
    source.checks.length === EXPECTED_156_GATES.length &&
    new Set(sourceGateIds).size === EXPECTED_156_GATES.length &&
    EXPECTED_156_GATES.every(id => sourceGateIds.includes(id));

  const exactReplay = sourceContract &&
    source.checks.every(actual => replay.checks.some(expected =>
      actual.id === expected.id &&
      actual.status === expected.status &&
      actual.requirement === expected.requirement &&
      actual.followUpIfBlocked === expected.followUpIfBlocked
    ));
  const counts = {
    passed: source.checks.filter(item => item.status === 'pass').length,
    blocked: source.checks.filter(item => item.status === 'blocked').length
  };
  const outcomesMatch =
    exactReplay &&
    source.summary.passed === counts.passed &&
    source.summary.blocked === counts.blocked &&
    replay.summary.passed === counts.passed &&
    replay.summary.blocked === counts.blocked &&
    source.sourceReconciled === replay.sourceReconciled &&
    source.outcome === replay.outcome;

  const sourceCriteria = source.ownerReviewCriteria;
  const sourceCriteriaIds = sourceCriteria.map(item => item.id);
  const criteriaValid =
    sourceCriteria.length === EXPECTED_OWNER_CRITERIA.length &&
    new Set(sourceCriteriaIds).size === EXPECTED_OWNER_CRITERIA.length &&
    EXPECTED_OWNER_CRITERIA.every(id => sourceCriteriaIds.includes(id)) &&
    sourceCriteria.every(item =>
      item.status === 'criteria_documented_not_approved' &&
      item.humanDecisionRequired === true &&
      item.requirement.trim().length > 0 &&
      replay.ownerReviewCriteria.some(expected =>
        expected.id === item.id &&
        expected.status === item.status &&
        expected.humanDecisionRequired === item.humanDecisionRequired &&
        expected.requirement === item.requirement
      )
    );

  const sourceHoldIds = [...new Set(source.outstandingHoldIds)];
  const replayHoldIds = [...new Set(replay.outstandingHoldIds)];
  const upstreamHolds = [...new Set([
    ...audit.outstandingHoldIds,
    ...decision.unresolvedHoldIds,
    ...resolution.outstandingHoldIds,
    ...evidence.outstandingHoldIds,
    ...followUps.preservedHoldIds,
    ...continuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const uniqueSourceHolds = sourceHoldIds.length === source.outstandingHoldIds.length;
  const holdParity = uniqueSourceHolds &&
    sourceHoldIds.length === replayHoldIds.length &&
    replayHoldIds.every(id => sourceHoldIds.includes(id)) &&
    upstreamHolds.every(id => sourceHoldIds.includes(id)) &&
    source.originalHoldIds.every(id => sourceHoldIds.includes(id)) &&
    source.replayedHoldIds.every(id => sourceHoldIds.includes(id));

  const heldEvidenceValid =
    holdParity &&
    source.heldEvidence.length === sourceHoldIds.length &&
    new Set(source.heldEvidence.map(item => item.id)).size === sourceHoldIds.length &&
    sourceHoldIds.every(id => source.heldEvidence.some(item =>
      item.id === id &&
      item.status === 'unresolved_requires_follow_up' &&
      item.requiredEvidence.trim().length > 0 &&
      item.autoClosePermitted === false &&
      item.ownerReviewRecorded === false
    )) &&
    source.heldEvidence.every(actual =>
      replay.heldEvidence.some(expected =>
        actual.id === expected.id &&
        actual.status === expected.status &&
        actual.requiredEvidence === expected.requiredEvidence &&
        actual.autoClosePermitted === expected.autoClosePermitted &&
        actual.ownerReviewRecorded === expected.ownerReviewRecorded
      )
    );

  const noRealActions =
    source.realIndependentEvidenceVerified === false &&
    source.realOwnerReviewCompleted === false &&
    source.ownerApprovalRecorded === false &&
    source.actualHoldClosed === false &&
    source.consentCaptured === false &&
    source.durableAuditPersisted === false &&
    source.exportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.livePhoneSmsEnabled === false &&
    replay.realIndependentEvidenceVerified === false &&
    replay.realOwnerReviewCompleted === false &&
    replay.ownerApprovalRecorded === false &&
    replay.actualHoldClosed === false &&
    replay.consentCaptured === false &&
    replay.durableAuditPersisted === false &&
    replay.exportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.livePhoneSmsEnabled === false;

  const prerequisites: readonly Ql157OwnerPrerequisite[] = criteriaValid ?
    sourceCriteria.map(item => ({
      id: item.id,
      description: item.requirement,
      status: 'documented_not_authorized' as const,
      verificationPath: 'separate_private_human_review_required' as const,
      approvalRecorded: false as const
    })) : [];
  const governancePlanValid = criteriaValid &&
    prerequisites.length === EXPECTED_OWNER_CRITERIA.length &&
    prerequisites.every(item => item.approvalRecorded === false);

  const sourceIntegrityVerified =
    sourceContract && exactReplay && outcomesMatch &&
    criteriaValid && holdParity && heldEvidenceValid &&
    noRealActions && governancePlanValid;
  const zeroOpenSyntheticHolds =
    sourceIntegrityVerified && source.sourceReconciled &&
    sourceHoldIds.length === 0 && upstreamHolds.length === 0 &&
    counts.blocked === 0 && audit.summary.blocked === 0 &&
    decision.summary.blocked === 0 && resolution.summary.blocked === 0 &&
    evidence.summary.blocked === 0 && followUps.summary.blocked === 0 &&
    continuity.summary.blocked === 0 && acceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_owner_review_criteria_ready_only';

  const checks: readonly Ql157GovernanceCheck[] = [
    gate('ql157-exact-lineage', 'Eight exact QL-156 source gate IDs and expected build identity',
      sourceContract, 'Restore source contract before any follow-up review.'),
    gate('ql157-replay-consistency', 'Every gate status and description matches independent synthetic replay',
      exactReplay, 'Reconcile missing or altered in-memory evidence.'),
    gate('ql157-outcome-recount', 'Pass/block totals and synthetic outcome independently reconcile',
      outcomesMatch, 'Do not interpret synthetic labels as evidence of real approval.'),
    gate('ql157-owner-prerequisites', 'Five exact, unique, unapproved owner-review prerequisites are unchanged',
      criteriaValid, 'Restore owner-review prerequisites without recording a decision.'),
    gate('ql157-hold-continuity', 'Every outstanding hold from QL-149 through QL-156 remains visible',
      holdParity, 'Reinstate omitted or duplicated synthetic hold IDs.'),
    gate('ql157-evidence-follow-ups', 'Each open hold has one unchanged, non-closable evidence requirement',
      heldEvidenceValid, 'Maintain evidence requirements as proposals only.'),
    gate('ql157-owner-governance', 'All five owner checkpoints remain explicitly unapproved',
      governancePlanValid, 'Retain a separate private authorization requirement.'),
    gate('ql157-no-unresolved-holds', 'Synthetic criteria-ready outcome requires zero holds and blocked gates',
      zeroOpenSyntheticHolds, 'Keep unresolved exceptions held for a new independent review.'),
    gate('ql157-runtime-locks', 'No real consent, approval, closure, persistent audit, export or live communications',
      noRealActions, 'Restore no-write and no-live runtime boundaries before review.')
  ];
  const summary = {
    passed: checks.filter(item => item.status === 'pass').length,
    blocked: checks.filter(item => item.status === 'blocked').length
  };

  const outstandingHoldIds = [...new Set([
    ...sourceHoldIds, ...replayHoldIds, ...upstreamHolds,
    ...(!sourceIntegrityVerified ? ['ql157-governance-integrity-hold'] : []),
    ...(summary.blocked > 0 && sourceHoldIds.length === 0 ? ['ql157-follow-up-review-hold'] : [])
  ])];
  const exceptionFollowUps: readonly Ql157ExceptionFollowUp[] =
    outstandingHoldIds.map(holdId => ({
      holdId,
      disposition: 'remain_open_pending_independent_review' as const,
      evidenceRequirement: source.heldEvidence.find(item => item.id === holdId)?.requiredEvidence ??
        'Fresh, independently checked synthetic evidence and explicit later private owner review are required.',
      ownerDecisionRequired: true as const,
      priority: 'review_required' as const,
      completionRecorded: false as const,
      actualClosureAuthorized: false as const
    }));

  return {
    build: 'QL-157', reviewedBuild: 'QL-156', mode: 'synthetic_public_read_only_governance',
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_governance_criteria_ready_only' : 'synthetic_governance_review_held',
    sourceIntegrityVerified, checks, summary, prerequisites,
    sourceHoldIds, independentlyReproducedHoldIds: replayHoldIds,
    outstandingHoldIds, exceptionFollowUps,
    realOwnerVerified: false, ownerApprovalRecorded: false,
    consentRecorded: false, actualExceptionClosed: false,
    durableAuditPersisted: false, evidenceExportEnabled: false,
    downloadEnabled: false, canTransmit: false, livePhoneSmsEnabled: false,
    notice: 'QL-157 reconciles synthetic review prerequisites and proposed exception follow-ups in memory only. No owner is verified, no approval or consent is captured, no hold is closed and no live communications are enabled.'
  };
}
