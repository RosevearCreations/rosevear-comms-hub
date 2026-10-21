import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import {
  recheckQl152SyntheticFollowUpEvidence,
  type Ql152FollowUpEvidenceRecheck
} from './ql152SyntheticFollowupEvidenceRecheck';

export type Ql153DecisionGate = {
  id: string;
  status: 'pass' | 'blocked';
  condition: string;
  followUp: string;
};

export type Ql153HoldDecisionDraft = {
  id: string;
  disposition: 'keep_open_pending_independent_synthetic_evidence';
  evidenceNeeded: string;
  actualClosureAuthorized: false;
};

export type Ql153ReadinessReview = {
  build: 'QL-153';
  reviewedBuild: 'QL-152';
  mode: 'synthetic_read_only_decision_review';
  outcome: 'synthetic_follow_up_review_criteria_met_only' | 'hold_resolution_decision_review_blocked';
  gates: readonly Ql153DecisionGate[];
  summary: { passed: number; blocked: number };
  sourceReconciled: boolean;
  outstandingHoldIds: readonly string[];
  decisionDrafts: readonly Ql153HoldDecisionDraft[];
  realOwnerApproval: false;
  actualHoldClosure: false;
  evidencePersisted: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  liveCommunicationsEnabled: false;
  warning: string;
};

const EXPECTED_152_IDS = [
  'ql152-lineage',
  'ql152-independent-replay',
  'ql152-count-outcome',
  'ql152-preserved-holds',
  'ql152-follow-up-integrity',
  'ql152-synthetic-resolution-criteria',
  'ql152-no-real-resolution'
] as const;

function reviewGate(id: string, condition: string, passed: boolean, followUp: string): Ql153DecisionGate {
  return { id, condition, status: passed ? 'pass' : 'blocked', followUp };
}

// QL-153 is an independent, in-memory recheck of the supplied synthetic-only
// model. There is no durable audit trail, real owner acceptance or hold mutation.
export function reviewQl153SyntheticResolutionReadiness(
  source: Ql152FollowUpEvidenceRecheck,
  followUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql153ReadinessReview {
  const replay = recheckQl152SyntheticFollowUpEvidence(followUps, continuity, acceptance);
  const ids = source.gates.map(gate => gate.id);
  const sourceContract =
    source.build === 'QL-152' && source.reviewedBuild === 'QL-151' &&
    source.mode === 'synthetic_public_read_only' &&
    source.gates.length === EXPECTED_152_IDS.length &&
    new Set(ids).size === EXPECTED_152_IDS.length &&
    EXPECTED_152_IDS.every(id => ids.includes(id));

  const replayMatches = sourceContract &&
    source.gates.every(actual => replay.gates.some(expected =>
      actual.id === expected.id && actual.status === expected.status &&
      actual.requirement === expected.requirement &&
      actual.ifBlocked === expected.ifBlocked
    ));
  const counted = {
    passed: source.gates.filter(gate => gate.status === 'pass').length,
    blocked: source.gates.filter(gate => gate.status === 'blocked').length
  };
  const countsAndOutcome =
    replayMatches &&
    counted.passed === source.summary.passed &&
    counted.blocked === source.summary.blocked &&
    counted.passed === replay.summary.passed &&
    counted.blocked === replay.summary.blocked &&
    source.outcome === replay.outcome &&
    source.sourceReconciled === replay.sourceReconciled;

  const originalHolds = [...new Set(source.originalHoldIds)];
  const reproducedHolds = [...new Set(source.reproducedHoldIds)];
  const reportedHolds = [...new Set(source.outstandingHoldIds)];
  const replayHolds = [...new Set(replay.outstandingHoldIds)];
  const uniqueHolds =
    originalHolds.length === source.originalHoldIds.length &&
    reproducedHolds.length === source.reproducedHoldIds.length &&
    reportedHolds.length === source.outstandingHoldIds.length;
  const exactHolds =
    uniqueHolds && reportedHolds.length === replayHolds.length &&
    replayHolds.every(id => reportedHolds.includes(id)) &&
    originalHolds.every(id => reportedHolds.includes(id)) &&
    reproducedHolds.every(id => reportedHolds.includes(id)) &&
    followUps.preservedHoldIds.every(id => reportedHolds.includes(id)) &&
    continuity.outstandingHoldIds.every(id => reportedHolds.includes(id)) &&
    acceptance.unresolvedHoldIds.every(id => reportedHolds.includes(id));

  const candidateIntegrity =
    exactHolds &&
    source.resolutionCandidates.length === reportedHolds.length &&
    new Set(source.resolutionCandidates.map(item => item.id)).size === reportedHolds.length &&
    reportedHolds.every(id => source.resolutionCandidates.some(candidate =>
      candidate.id === id &&
      candidate.disposition === 'hold_open_pending_independent_evidence' &&
      candidate.closurePermitted === false &&
      candidate.evidenceRequirement.length > 0
    )) &&
    source.resolutionCandidates.every(candidate =>
      replay.resolutionCandidates.some(expected =>
        candidate.id === expected.id &&
        candidate.disposition === expected.disposition &&
        candidate.evidenceRequirement === expected.evidenceRequirement &&
        candidate.closurePermitted === expected.closurePermitted
      )
    );

  const runtimeLocked =
    source.independentRealWorldEvidenceVerified === false &&
    source.actualHoldResolved === false && source.ownerAcceptanceRecorded === false &&
    source.consentCaptured === false && source.evidencePersisted === false &&
    source.exportEnabled === false && source.downloadEnabled === false &&
    source.canTransmit === false && source.liveCommunicationsEnabled === false &&
    followUps.independentOwnerAcceptance === false &&
    followUps.actualHoldClosed === false && followUps.consentCaptured === false &&
    followUps.evidencePersisted === false && followUps.exportEnabled === false &&
    followUps.canTransmit === false && followUps.liveCommunicationsEnabled === false &&
    continuity.closureRecorded === false && continuity.acceptanceRecorded === false &&
    continuity.ownerApprovalGranted === false && continuity.storedAuditLog === false &&
    continuity.exportEnabled === false && continuity.downloadEnabled === false &&
    continuity.canTransmit === false && continuity.liveCommunicationsEnabled === false &&
    acceptance.acceptanceRecorded === false && acceptance.realExceptionClosed === false &&
    acceptance.ownerApprovalGranted === false && acceptance.persistedAuditLog === false &&
    acceptance.exportEnabled === false && acceptance.liveCommunicationsEnabled === false;

  const sourceReconciled = sourceContract && replayMatches && countsAndOutcome &&
    exactHolds && candidateIntegrity && runtimeLocked;
  const zeroUnresolved =
    sourceReconciled && source.sourceReconciled &&
    reportedHolds.length === 0 && counted.blocked === 0 &&
    source.outcome === 'synthetic_follow_up_criteria_only' &&
    followUps.summary.blocked === 0 && continuity.summary.blocked === 0 &&
    acceptance.summary.blocked === 0;

  const gates: readonly Ql153DecisionGate[] = [
    reviewGate('ql153-lineage', 'QL-152 identity, exact seven unique gate IDs and QL-151 lineage',
      sourceContract, 'Reconstruct the synthetic QL-152 source.'),
    reviewGate('ql153-independent-replay', 'Replay reproduces every source gate, status, and description',
      replayMatches, 'Investigate the synthetic discrepancy; no resolution is authorized.'),
    reviewGate('ql153-recount', 'Recorded gate counts and outcomes match an independent replay',
      countsAndOutcome, 'Keep all affected exceptions open until rechecked.'),
    reviewGate('ql153-hold-continuity', 'All QL-149 through QL-152 unresolved hold IDs are uniquely retained',
      exactHolds, 'Restore every missing or duplicated hold before further review.'),
    reviewGate('ql153-resolution-candidates', 'Each unresolved hold has one unchanged non-closable evidence requirement',
      candidateIntegrity, 'Recreate missing proposed evidence requirements without changing hold status.'),
    reviewGate('ql153-zero-open-holds', 'The synthetic fixture has zero unresolved holds and no failed gates',
      zeroUnresolved, 'Do not call a real hold resolved; require independent future evidence and decision.'),
    reviewGate('ql153-no-real-decision', 'No owner approval, actual closure, stored evidence, export or live communications',
      runtimeLocked, 'Restore disabled runtime and human-approval protections.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...reportedHolds, ...replayHolds, ...followUps.preservedHoldIds,
    ...continuity.outstandingHoldIds, ...acceptance.unresolvedHoldIds,
    ...(!sourceReconciled ? ['ql153-source-integrity-hold'] : []),
    ...(summary.blocked > 0 && reportedHolds.length === 0 ? ['ql153-review-hold'] : [])
  ])];
  const decisionDrafts: readonly Ql153HoldDecisionDraft[] = outstandingHoldIds.map(id => ({
    id,
    disposition: 'keep_open_pending_independent_synthetic_evidence' as const,
    evidenceNeeded: 'Separate fresh synthetic evidence, independent recheck, and explicit later human closure criteria.',
    actualClosureAuthorized: false as const
  }));
  return {
    build: 'QL-153', reviewedBuild: 'QL-152', mode: 'synthetic_read_only_decision_review',
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_follow_up_review_criteria_met_only' : 'hold_resolution_decision_review_blocked',
    gates, summary, sourceReconciled, outstandingHoldIds, decisionDrafts,
    realOwnerApproval: false, actualHoldClosure: false, evidencePersisted: false,
    exportEnabled: false, downloadEnabled: false, canTransmit: false,
    liveCommunicationsEnabled: false,
    warning: 'Synthetic-only independent hold-resolution readiness. Review results are not real owner decisions, permission to close holds, new external evidence, durable audits, or production verification.'
  };
}
