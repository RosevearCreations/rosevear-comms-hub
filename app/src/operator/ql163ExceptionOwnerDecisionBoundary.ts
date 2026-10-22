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
import type { Ql159EscalationContinuityReview } from './ql159SyntheticEscalationResolutionContinuity';
import type { Ql160IndependentDecisionEvidence } from './ql160IndependentResolutionDecisionEvidence';
import type { Ql161OwnerDecisionReview } from './ql161OwnerDecisionPrerequisites';
import {
  reviewQl162OwnerCriteriaAndHoldContinuity,
  type Ql162DecisionCriteriaReview,
  type Ql162HoldFollowUp
} from './ql162OwnerCriteriaHoldContinuity';

export type Ql163ContinuityGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  ifBlocked: string;
};

export type Ql163OwnerEvidenceRequirement = {
  id: string;
  requirement: string;
  evidenceState: 'not_independently_verified';
  humanDecisionState: 'not_recorded';
  authorizesFollowUp: false;
};

export type Ql163HeldFollowUp = {
  holdId: string;
  proposedRoute: Ql162HoldFollowUp['proposedRoute'];
  requiredEvidence: string;
  provenance: 'QL-162 synthetic follow-up';
  status: 'open_pending_separate_human_review';
  evidenceVerified: false;
  ownerDecisionRecorded: false;
  authorizedToFollowUp: false;
  authorizedToDispatch: false;
  authorizedToClose: false;
};

export type Ql163DecisionContinuityReview = {
  build: 'QL-163';
  reviewedBuild: 'QL-162';
  mode: 'public_synthetic_exception_owner_decision_continuity_only';
  sourceIntegrityVerified: boolean;
  outcome: 'synthetic_evidence_continuity_only' | 'synthetic_follow_up_authorization_held';
  gates: readonly Ql163ContinuityGate[];
  summary: { passed: number; blocked: number };
  sourceHoldIds: readonly string[];
  replayedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  ownerEvidenceRequirements: readonly Ql163OwnerEvidenceRequirement[];
  followUps: readonly Ql163HeldFollowUp[];
  independentlyVerifiedRealEvidence: false;
  authenticatedHumanOwner: false;
  humanDecisionRecorded: false;
  consentRecorded: false;
  followUpAuthorized: false;
  escalationDispatched: false;
  realHoldClosed: false;
  durableAuditWritten: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const EXPECTED_GATES = [
  'ql162-source-contract',
  'ql162-independent-replay',
  'ql162-recount-outcome',
  'ql162-owner-criteria',
  'ql162-hold-continuity',
  'ql162-follow-up-parity',
  'ql162-zero-open-holds',
  'ql162-owner-boundary',
  'ql162-no-live-side-effects'
] as const;

const EXPECTED_OWNER_EVIDENCE = [
  'ql156-owner-identity',
  'ql156-evidence-provenance',
  'ql156-hold-disposition',
  'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

function gate(id: string, requirement: string, ok: boolean, ifBlocked: string): Ql163ContinuityGate {
  return { id, requirement, status: ok ? 'pass' : 'blocked', ifBlocked };
}

function exactIds(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length &&
    new Set(actual).size === expected.length &&
    expected.every(id => actual.includes(id));
}

function exactHoldSet(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length &&
    actual.every(id => id.trim().length > 0) &&
    new Set(actual).size === actual.length &&
    expected.every(id => actual.includes(id));
}

// Deterministic, in-memory comparison of synthetic fixtures only. Its output
// is not an owner authorization token and cannot execute any follow-up.
export function reviewQl163ExceptionOwnerDecisionBoundary(
  source: Ql162DecisionCriteriaReview,
  ownerReview: Ql161OwnerDecisionReview,
  decisionEvidence: Ql160IndependentDecisionEvidence,
  resolution: Ql159EscalationContinuityReview,
  escalations: Ql158OwnerGovernanceReview,
  governance: Ql157PrerequisiteReconciliation,
  validation: Ql156IndependentEvidenceReview,
  audit: Ql155SyntheticAuditReadiness,
  decision: Ql154IndependentDecisionReview,
  readiness: Ql153ReadinessReview,
  evidence: Ql152FollowUpEvidenceRecheck,
  priorFollowUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql163DecisionContinuityReview {
  const replay = reviewQl162OwnerCriteriaAndHoldContinuity(
    ownerReview, decisionEvidence, resolution, escalations, governance, validation,
    audit, decision, readiness, evidence, priorFollowUps, continuity, acceptance
  );

  const contract = source.build === 'QL-162' && source.reviewedBuild === 'QL-161' &&
    source.mode === 'public_synthetic_owner_criteria_reconciliation_only' &&
    exactIds(source.gates.map(item => item.id), EXPECTED_GATES);

  const replayedGates = contract && source.gates.every(actual => replay.gates.some(expected =>
    actual.id === expected.id && actual.status === expected.status &&
    actual.requirement === expected.requirement && actual.ifBlocked === expected.ifBlocked
  ));
  const counts = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const outcomeReconciled = replayedGates &&
    source.summary.passed === counts.passed && source.summary.blocked === counts.blocked &&
    replay.summary.passed === counts.passed && replay.summary.blocked === counts.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const ownerEvidenceIntact = exactIds(
    source.ownerCriteria.map(item => item.id), EXPECTED_OWNER_EVIDENCE
  ) && source.ownerCriteria.every(actual => replay.ownerCriteria.some(expected =>
    actual.id === expected.id && actual.requirement === expected.requirement &&
    actual.requirement.trim().length > 0 &&
    actual.status === 'documented_not_approved' &&
    actual.actualEvidenceVerified === false && actual.ownerSignOffRecorded === false &&
    actual.status === expected.status &&
    actual.actualEvidenceVerified === expected.actualEvidenceVerified &&
    actual.ownerSignOffRecorded === expected.ownerSignOffRecorded
  ));

  const sourceHoldIds = [...source.outstandingHoldIds];
  const replayedHoldIds = [...replay.outstandingHoldIds];
  const earlierHolds = [...new Set([
    ...source.sourceHoldIds, ...source.replayedHoldIds,
    ...ownerReview.outstandingHoldIds, ...decisionEvidence.outstandingHoldIds,
    ...resolution.unresolvedHoldIds, ...escalations.outstandingHoldIds,
    ...governance.outstandingHoldIds, ...validation.outstandingHoldIds,
    ...audit.outstandingHoldIds, ...decision.unresolvedHoldIds,
    ...readiness.outstandingHoldIds, ...evidence.outstandingHoldIds,
    ...priorFollowUps.preservedHoldIds, ...continuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const holdLineage = exactHoldSet(sourceHoldIds, replayedHoldIds) &&
    exactHoldSet(source.sourceHoldIds, replay.sourceHoldIds) &&
    exactHoldSet(source.replayedHoldIds, replay.replayedHoldIds) &&
    earlierHolds.every(id => sourceHoldIds.includes(id));

  const followUpContinuity = holdLineage &&
    source.followUps.length === sourceHoldIds.length &&
    exactHoldSet(source.followUps.map(item => item.holdId), sourceHoldIds) &&
    source.followUps.every(actual => replay.followUps.some(expected =>
      actual.holdId === expected.holdId &&
      actual.proposedRoute === expected.proposedRoute &&
      actual.requiredEvidence === expected.requiredEvidence &&
      actual.requiredEvidence.trim().length > 0 &&
      actual.status === expected.status &&
      actual.independentlyVerifiedEvidence === expected.independentlyVerifiedEvidence &&
      actual.humanOwnerDecisionRecorded === expected.humanOwnerDecisionRecorded &&
      actual.closurePermitted === expected.closurePermitted &&
      actual.escalationDispatched === expected.escalationDispatched &&
      actual.status === 'open_manual_review_required' &&
      actual.independentlyVerifiedEvidence === false &&
      actual.humanOwnerDecisionRecorded === false &&
      actual.closurePermitted === false && actual.escalationDispatched === false
    ));

  const authorityLocked = source.externalEvidenceVerified === false &&
    source.realOwnerIdentified === false && source.ownerAuthorizationRecorded === false &&
    source.consentRecorded === false && source.realHoldClosed === false &&
    source.realEscalationDispatched === false && source.durableAuditWritten === false &&
    source.exportEnabled === false && source.downloadEnabled === false &&
    source.canTransmit === false && source.livePhoneSmsEnabled === false &&
    replay.externalEvidenceVerified === false && replay.realOwnerIdentified === false &&
    replay.ownerAuthorizationRecorded === false && replay.consentRecorded === false &&
    replay.realHoldClosed === false && replay.realEscalationDispatched === false &&
    replay.durableAuditWritten === false && replay.exportEnabled === false &&
    replay.downloadEnabled === false && replay.canTransmit === false &&
    replay.livePhoneSmsEnabled === false &&
    ownerReview.ownerDecisionRecorded === false &&
    ownerReview.externalEvidenceAttested === false &&
    ownerReview.realExceptionClosed === false &&
    ownerReview.realEscalationSent === false &&
    ownerReview.canTransmit === false && ownerReview.livePhoneSmsEnabled === false;

  const sourceIntegrityVerified = contract && replayedGates && outcomeReconciled &&
    ownerEvidenceIntact && holdLineage && followUpContinuity && authorityLocked &&
    source.sourceIntegrityVerified && replay.sourceIntegrityVerified;
  const zeroOpenHolds = sourceIntegrityVerified && sourceHoldIds.length === 0 &&
    earlierHolds.length === 0 && counts.blocked === 0 &&
    source.outcome === 'synthetic_criteria_reconciled_only';

  const gates: readonly Ql163ContinuityGate[] = [
    gate('ql163-source-contract', 'Exact QL-162 nine-gate contract and lineage', contract,
      'Restore the source contract; do not interpret missing evidence as approval.'),
    gate('ql163-independent-replay', 'Every QL-162 gate and blocker matches fixture replay', replayedGates,
      'Re-run independent fixture review and keep related holds open.'),
    gate('ql163-outcome-integrity', 'Counts, outcome and source integrity match the replay', outcomeReconciled,
      'Reject changed counts, outcomes or unsupported readiness.'),
    gate('ql163-owner-evidence', 'Five owner-decision evidence requirements remain exact and unapproved', ownerEvidenceIntact,
      'Restore each evidence requirement; no owner sign-off can be inferred.'),
    gate('ql163-hold-lineage', 'Every historical and replayed synthetic hold ID remains present once', holdLineage,
      'Reinstate omitted hold IDs and remove duplicates before reviewing follow-ups.'),
    gate('ql163-follow-up-evidence', 'Each hold retains its exact route and required evidence without execution', followUpContinuity,
      'Keep affected holds pending a separate independent evidence review.'),
    gate('ql163-authorization-boundary', 'Follow-ups are never authorized by a synthetic review',
      followUpContinuity && ownerEvidenceIntact && authorityLocked,
      'Require authenticated human owner decision, evidence, consent and scope outside this preview.'),
    gate('ql163-zero-open-holds', 'Synthetic continuation requires no open holds or blocked source gates', zeroOpenHolds,
      'Preserve the unresolved hold; a passing integrity review is not a disposition.'),
    gate('ql163-no-live-operations', 'No real evidence, decision, consent, dispatch, closure, audit, export or Phone/SMS',
      authorityLocked, 'Leave all operational pathways disabled and require separately authorized review.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...sourceHoldIds, ...replayedHoldIds, ...earlierHolds,
    ...(!sourceIntegrityVerified ? ['ql163-evidence-continuity-integrity-hold'] : []),
    ...(summary.blocked > 0 && sourceHoldIds.length === 0 ?
      ['ql163-follow-up-authorization-hold'] : [])
  ])];

  const ownerEvidenceRequirements: readonly Ql163OwnerEvidenceRequirement[] =
    ownerEvidenceIntact ? source.ownerCriteria.map(item => ({
      id: item.id, requirement: item.requirement,
      evidenceState: 'not_independently_verified' as const,
      humanDecisionState: 'not_recorded' as const,
      authorizesFollowUp: false as const
    })) : [];
  const followUps: readonly Ql163HeldFollowUp[] = outstandingHoldIds.map(holdId => {
    const prior = source.followUps.find(item => item.holdId === holdId);
    const expected = replay.followUps.find(item => item.holdId === holdId);
    return {
      holdId,
      proposedRoute: expected?.proposedRoute ?? prior?.proposedRoute ?? 'synthetic_integrity_review',
      requiredEvidence: expected?.requiredEvidence ?? prior?.requiredEvidence ??
        'Reconcile independent evidence and obtain a separate authorized human owner decision.',
      provenance: 'QL-162 synthetic follow-up' as const,
      status: 'open_pending_separate_human_review' as const,
      evidenceVerified: false as const, ownerDecisionRecorded: false as const,
      authorizedToFollowUp: false as const, authorizedToDispatch: false as const,
      authorizedToClose: false as const
    };
  });

  return {
    build: 'QL-163', reviewedBuild: 'QL-162',
    mode: 'public_synthetic_exception_owner_decision_continuity_only',
    sourceIntegrityVerified,
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_evidence_continuity_only' : 'synthetic_follow_up_authorization_held',
    gates, summary, sourceHoldIds, replayedHoldIds, outstandingHoldIds,
    ownerEvidenceRequirements, followUps,
    independentlyVerifiedRealEvidence: false, authenticatedHumanOwner: false,
    humanDecisionRecorded: false, consentRecorded: false,
    followUpAuthorized: false, escalationDispatched: false, realHoldClosed: false,
    durableAuditWritten: false, exportEnabled: false, downloadEnabled: false,
    canTransmit: false, livePhoneSmsEnabled: false,
    notice: 'QL-163 proves only synthetic evidence continuity. A follow-up route is a proposal, not permission. Every real owner decision, consent, evidence verification, dispatch, closure and audit requires a separate authenticated private authorization workflow; none is enabled here.'
  };
}
