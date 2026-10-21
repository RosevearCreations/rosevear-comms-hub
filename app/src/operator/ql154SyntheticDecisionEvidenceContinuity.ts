import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import {
  reviewQl153SyntheticResolutionReadiness,
  type Ql153ReadinessReview
} from './ql153SyntheticResolutionReadiness';

export type Ql154DecisionContinuityGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  ifBlocked: string;
};
export type Ql154HeldEvidence = {
  id: string;
  disposition: 'unresolved_synthetic_hold';
  nextReview: string;
  actualClosureAuthorized: false;
};
export type Ql154IndependentDecisionReview = {
  build: 'QL-154';
  reviewedBuild: 'QL-153';
  mode: 'read_only_synthetic_evidence_continuity';
  outcome: 'synthetic_review_criteria_only' | 'synthetic_decision_evidence_held';
  sourceIntegrityVerified: boolean;
  gates: readonly Ql154DecisionContinuityGate[];
  summary: { passed: number; blocked: number };
  originalHoldIds: readonly string[];
  replayedHoldIds: readonly string[];
  unresolvedHoldIds: readonly string[];
  heldEvidence: readonly Ql154HeldEvidence[];
  independentRealWorldEvidenceVerified: false;
  actualHoldClosed: false;
  ownerApprovalCaptured: false;
  consentCaptured: false;
  durableAuditWritten: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  warning: string;
};

const EXPECTED_QL153_GATES = [
  'ql153-lineage',
  'ql153-independent-replay',
  'ql153-recount',
  'ql153-hold-continuity',
  'ql153-resolution-candidates',
  'ql153-zero-open-holds',
  'ql153-no-real-decision'
] as const;

function check(
  id: string, requirement: string, passed: boolean, ifBlocked: string
): Ql154DecisionContinuityGate {
  return { id, requirement, status: passed ? 'pass' : 'blocked', ifBlocked };
}

// Replays the prior pure reviewer from in-memory synthetic inputs only.
// No actual decision, evidence retention, approval, export or phone/SMS action.
export function reviewQl154IndependentDecisionContinuity(
  source: Ql153ReadinessReview,
  original: Ql152FollowUpEvidenceRecheck,
  followUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql154IndependentDecisionReview {
  const replay = reviewQl153SyntheticResolutionReadiness(original, followUps, continuity, acceptance);
  const sourceIds = source.gates.map(gate => gate.id);
  const lineage =
    source.build === 'QL-153' && source.reviewedBuild === 'QL-152' &&
    source.mode === 'synthetic_read_only_decision_review' &&
    source.gates.length === EXPECTED_QL153_GATES.length &&
    new Set(sourceIds).size === EXPECTED_QL153_GATES.length &&
    EXPECTED_QL153_GATES.every(id => sourceIds.includes(id));

  const exactReplay = lineage && source.gates.every(actual =>
    replay.gates.some(expected =>
      actual.id === expected.id &&
      actual.status === expected.status &&
      actual.condition === expected.condition &&
      actual.followUp === expected.followUp
    )
  );
  const counted = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const outcomeMatches = exactReplay &&
    source.summary.passed === counted.passed &&
    source.summary.blocked === counted.blocked &&
    replay.summary.passed === counted.passed &&
    replay.summary.blocked === counted.blocked &&
    source.sourceReconciled === replay.sourceReconciled &&
    source.outcome === replay.outcome;

  const originalHoldIds = [...new Set(source.outstandingHoldIds)];
  const replayedHoldIds = [...new Set(replay.outstandingHoldIds)];
  const originalUnique = originalHoldIds.length === source.outstandingHoldIds.length;
  const identicalHolds = originalUnique &&
    originalHoldIds.length === replayedHoldIds.length &&
    replayedHoldIds.every(id => originalHoldIds.includes(id));

  const priorHolds = [...new Set([
    ...original.outstandingHoldIds,
    ...followUps.preservedHoldIds,
    ...continuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const noDroppedHolds = identicalHolds &&
    priorHolds.every(id => originalHoldIds.includes(id));

  const draftsMatch = noDroppedHolds &&
    source.decisionDrafts.length === originalHoldIds.length &&
    new Set(source.decisionDrafts.map(draft => draft.id)).size === originalHoldIds.length &&
    originalHoldIds.every(id => source.decisionDrafts.some(draft =>
      draft.id === id &&
      draft.disposition === 'keep_open_pending_independent_synthetic_evidence' &&
      draft.actualClosureAuthorized === false &&
      draft.evidenceNeeded.length > 0
    )) &&
    source.decisionDrafts.every(draft => replay.decisionDrafts.some(expected =>
      draft.id === expected.id && draft.disposition === expected.disposition &&
      draft.actualClosureAuthorized === expected.actualClosureAuthorized &&
      draft.evidenceNeeded === expected.evidenceNeeded
    ));

  const runtimeLocked =
    source.realOwnerApproval === false && source.actualHoldClosure === false &&
    source.evidencePersisted === false && source.exportEnabled === false &&
    source.downloadEnabled === false && source.canTransmit === false &&
    source.liveCommunicationsEnabled === false &&
    replay.realOwnerApproval === false && replay.actualHoldClosure === false &&
    replay.evidencePersisted === false && replay.exportEnabled === false &&
    replay.downloadEnabled === false && replay.canTransmit === false &&
    replay.liveCommunicationsEnabled === false &&
    original.independentRealWorldEvidenceVerified === false &&
    original.actualHoldResolved === false && original.ownerAcceptanceRecorded === false &&
    original.consentCaptured === false && original.evidencePersisted === false &&
    original.exportEnabled === false && original.downloadEnabled === false &&
    original.canTransmit === false && original.liveCommunicationsEnabled === false;

  const sourceIntegrityVerified = lineage && exactReplay && outcomeMatches &&
    identicalHolds && noDroppedHolds && draftsMatch && runtimeLocked;
  const zeroHolds =
    sourceIntegrityVerified && source.sourceReconciled &&
    originalHoldIds.length === 0 && priorHolds.length === 0 &&
    counted.blocked === 0 &&
    source.outcome === 'synthetic_follow_up_review_criteria_met_only' &&
    original.summary.blocked === 0 && followUps.summary.blocked === 0 &&
    continuity.summary.blocked === 0 && acceptance.summary.blocked === 0;

  const gates: readonly Ql154DecisionContinuityGate[] = [
    check('ql154-lineage', 'Exact seven QL-153 source gates and upstream lineage', lineage,
      'Restore the valid synthetic source contract; keep every exception on hold.'),
    check('ql154-independent-replay', 'All gate results, criteria and follow-ups independently reproduce',
      exactReplay, 'Reject altered or missing synthetic gate evidence.'),
    check('ql154-outcome-reconciliation', 'Source and replay totals and outcomes reconcile',
      outcomeMatches, 'Do not treat a self-reported passing outcome as evidence.'),
    check('ql154-hold-parity', 'QL-153 and independent replay hold sets are identical',
      identicalHolds, 'Restore duplicate or omitted hold records in the synthetic fixture.'),
    check('ql154-no-lost-holds', 'All QL-149 through QL-152 open hold IDs are retained',
      noDroppedHolds, 'Preserve each earlier hold until separately evidenced.'),
    check('ql154-decision-drafts', 'Every held decision draft remains non-closable and exactly reproducible',
      draftsMatch, 'Restore every draft; a proposed action does not record a decision.'),
    check('ql154-zero-open-holds', 'Synthetic readiness is gated by zero unresolved holds and zero failed checks',
      zeroHolds, 'Keep all open exceptions blocked pending later review.'),
    check('ql154-no-live-runtime', 'No actual approval, stored audit, hold closure, export, download or live communications',
      runtimeLocked, 'Disable the unsafe operation; do not proceed with live evidence.')
  ];
  const summary = {
    passed: gates.filter(gate => gate.status === 'pass').length,
    blocked: gates.filter(gate => gate.status === 'blocked').length
  };
  const unresolvedHoldIds = [...new Set([
    ...originalHoldIds, ...replayedHoldIds, ...priorHolds,
    ...(!sourceIntegrityVerified ? ['ql154-source-integrity-hold'] : []),
    ...(summary.blocked && !originalHoldIds.length ? ['ql154-review-criteria-hold'] : [])
  ])];
  const heldEvidence: readonly Ql154HeldEvidence[] = unresolvedHoldIds.map(id => ({
    id,
    disposition: 'unresolved_synthetic_hold' as const,
    nextReview: 'Separate synthetic source evidence verification and later manual decision review',
    actualClosureAuthorized: false as const
  }));
  return {
    build: 'QL-154', reviewedBuild: 'QL-153',
    mode: 'read_only_synthetic_evidence_continuity',
    outcome: summary.blocked === 0 && unresolvedHoldIds.length === 0 ?
      'synthetic_review_criteria_only' : 'synthetic_decision_evidence_held',
    sourceIntegrityVerified, gates, summary, originalHoldIds, replayedHoldIds,
    unresolvedHoldIds, heldEvidence,
    independentRealWorldEvidenceVerified: false, actualHoldClosed: false,
    ownerApprovalCaptured: false, consentCaptured: false,
    durableAuditWritten: false, exportEnabled: false, downloadEnabled: false,
    canTransmit: false, livePhoneSmsEnabled: false,
    warning: 'Synthetic in-memory evidence-continuity review only: never real owner approval, independent external evidence, hold closure, stored audit, export or production status.'
  };
}
