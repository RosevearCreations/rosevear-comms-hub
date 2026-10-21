import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';

export type Ql151HoldFollowUp = {
  id: string;
  status: 'open_for_synthetic_review';
  action: string;
  restriction: 'no_auto_closure_or_persistence';
};
export type Ql151AcceptanceGate = {
  id: string;
  status: 'pass' | 'blocked';
  evidence: string;
  followUpIfBlocked: string;
};
export type Ql151IndependentFollowUpReview = {
  build: 'QL-151';
  reviewedBuild: 'QL-150';
  mode: 'public_synthetic_review_only';
  outcome: 'criteria_satisfied_synthetic_only' | 'follow_up_review_held';
  checks: readonly Ql151AcceptanceGate[];
  summary: { passed: number; blocked: number };
  preservedHoldIds: readonly string[];
  followUps: readonly Ql151HoldFollowUp[];
  independentOwnerAcceptance: false;
  actualHoldClosed: false;
  consentCaptured: false;
  evidencePersisted: false;
  exportEnabled: false;
  canTransmit: false;
  liveCommunicationsEnabled: false;
  warning: string;
};

const EXPECTED_150 = [
  'ql150-source-contract',
  'ql150-independent-replay',
  'ql150-count-outcome',
  'ql150-no-lost-holds',
  'ql150-hold-parity',
  'ql150-zero-open-holds',
  'ql150-runtime-prohibitions'
] as const;
const EXPECTED_149 = [
  'ql149-exact-trace',
  'ql149-review-set',
  'ql149-hold-parity',
  'ql149-outcome',
  'ql149-zero-open-holds',
  'ql149-runtime-locks',
  'ql149-independent-acceptance-boundary'
] as const;

function check(
  id: string, status: boolean, evidence: string, followUpIfBlocked: string
): Ql151AcceptanceGate {
  return {
    id,
    status: status ? 'pass' : 'blocked',
    evidence,
    followUpIfBlocked
  };
}

function exactIds(items: readonly { id: string }[], required: readonly string[]): boolean {
  const unique = new Set(items.map(item => item.id));
  return items.length === required.length &&
    unique.size === required.length &&
    required.every(id => unique.has(id));
}

// A new, deterministic second opinion on a display-only synthetic review.
// No owner approval, real-world acceptance, audit journal or actual release is conferred.
export function reviewQl151IndependentFollowUps(
  current: Ql150AcceptanceContinuity,
  previous: Ql149IndependentAcceptance
): Ql151IndependentFollowUpReview {
  const sourceContract =
    current.build === 'QL-150' &&
    current.sourceBuild === 'QL-149' &&
    current.mode === 'synthetic_recheck_only' &&
    previous.build === 'QL-149' &&
    previous.sourceBuild === 'QL-148' &&
    previous.mode === 'synthetic_independent_review_only' &&
    exactIds(current.gates, EXPECTED_150) &&
    exactIds(previous.gates, EXPECTED_149);

  const recomputedCurrent = {
    passed: current.gates.filter(gate => gate.status === 'pass').length,
    blocked: current.gates.filter(gate => gate.status === 'blocked').length
  };
  const recomputedPrevious = {
    passed: previous.gates.filter(gate => gate.status === 'pass').length,
    blocked: previous.gates.filter(gate => gate.status === 'blocked').length
  };
  const totalsMatch =
    sourceContract &&
    current.summary.passed === recomputedCurrent.passed &&
    current.summary.blocked === recomputedCurrent.blocked &&
    previous.summary.passed === recomputedPrevious.passed &&
    previous.summary.blocked === recomputedPrevious.blocked &&
    recomputedCurrent.passed + recomputedCurrent.blocked === 7 &&
    recomputedPrevious.passed + recomputedPrevious.blocked === 7;

  const uniquePrior = new Set(previous.unresolvedHoldIds);
  const uniqueOriginal = new Set(current.originalHoldIds);
  const uniqueReplayed = new Set(current.reproducedHoldIds);
  const uniqueCurrent = new Set(current.outstandingHoldIds);
  const uniqueHoldSets =
    uniquePrior.size === previous.unresolvedHoldIds.length &&
    uniqueOriginal.size === current.originalHoldIds.length &&
    uniqueReplayed.size === current.reproducedHoldIds.length &&
    uniqueCurrent.size === current.outstandingHoldIds.length;
  const previousHoldsPreserved =
    uniqueHoldSets &&
    [...uniquePrior].every(id => uniqueOriginal.has(id) && uniqueReplayed.has(id) && uniqueCurrent.has(id));
  const fullHoldsReconciled =
    previousHoldsPreserved &&
    uniqueOriginal.size === uniquePrior.size &&
    uniqueReplayed.size === uniquePrior.size &&
    [...uniqueOriginal].every(id => uniquePrior.has(id)) &&
    [...uniqueReplayed].every(id => uniquePrior.has(id));
  const outcomesConsistent =
    totalsMatch &&
    previous.outcome === (recomputedPrevious.blocked === 0 && uniquePrior.size === 0 ?
      'synthetic_review_criteria_met_only' : 'independent_review_held') &&
    current.outcome === (recomputedCurrent.blocked === 0 && uniqueCurrent.size === 0 ?
      'synthetic_continuity_review_ready_only' : 'synthetic_continuity_on_hold') &&
    (current.sourceIntegrityVerified || current.outcome === 'synthetic_continuity_on_hold');

  const allHolds = [...new Set([
    ...previous.unresolvedHoldIds,
    ...current.originalHoldIds,
    ...current.reproducedHoldIds,
    ...current.outstandingHoldIds,
    ...(!sourceContract || !totalsMatch || !fullHoldsReconciled || !outcomesConsistent ?
      ['ql151-inconsistent-source-hold'] : [])
  ])];
  const runtimeLocked =
    previous.acceptanceRecorded === false &&
    previous.realExceptionClosed === false &&
    previous.ownerApprovalGranted === false &&
    previous.persistedAuditLog === false &&
    previous.exportEnabled === false &&
    previous.liveCommunicationsEnabled === false &&
    current.closureRecorded === false &&
    current.acceptanceRecorded === false &&
    current.ownerApprovalGranted === false &&
    current.storedAuditLog === false &&
    current.exportEnabled === false &&
    current.downloadEnabled === false &&
    current.canTransmit === false &&
    current.liveCommunicationsEnabled === false;
  const noUnresolvedHolds =
    fullHoldsReconciled && allHolds.length === 0 &&
    current.sourceIntegrityVerified === true &&
    recomputedCurrent.blocked === 0 &&
    recomputedPrevious.blocked === 0;
  const checks: readonly Ql151AcceptanceGate[] = [
    check('ql151-lineage', sourceContract,
      'QL-150 and QL-149 use exact source identities and seven unique expected review IDs.',
      'Hold until expected synthetic source lineage is restored.'),
    check('ql151-counts', totalsMatch,
      'Both levels have exactly seven checks and independently computed pass/block counts.',
      'Reconcile all mismatched counts without changing stored or live data.'),
    check('ql151-hold-preservation', previousHoldsPreserved,
      'Every prior QL-149 hold remains present in original, replayed and current hold sets.',
      'Restore any dropped or duplicated exception identifier.'),
    check('ql151-hold-reconciliation', fullHoldsReconciled,
      'Prior, original and independently reproduced exception identifiers agree exactly.',
      'Recheck synthetic evidence and retain all discrepancies for follow-up.'),
    check('ql151-outcome', outcomesConsistent,
      'Synthetic review labels match independently computed checks and open holds.',
      'Reject claimed acceptance contradicted by failing checks or open holds.'),
    check('ql151-zero-open-holds', noUnresolvedHolds,
      'Synthetic criteria only: zero open holds, zero blocked checks, verified source integrity.',
      'Keep unresolved holds open and prepare a separate evidence-only follow-up.'),
    check('ql151-runtime-lock', runtimeLocked,
      'No acceptance, actual closure, durable audit, export, transmission or live Phone/SMS.',
      'Stop review and restore disabled runtime boundaries before any further plan.')
  ];
  const summary = {
    passed: checks.filter(gate => gate.status === 'pass').length,
    blocked: checks.filter(gate => gate.status === 'blocked').length
  };
  const preservedHoldIds = [...new Set([
    ...allHolds, ...(summary.blocked && !allHolds.length ? ['ql151-review-integrity-hold'] : [])
  ])];
  const followUps: readonly Ql151HoldFollowUp[] = preservedHoldIds.map(id => ({
    id, status: 'open_for_synthetic_review' as const,
    action: 'Review the synthetic source and independently reconcile this hold. Do not mark resolved without fresh evidence.',
    restriction: 'no_auto_closure_or_persistence' as const
  }));
  const ready = summary.blocked === 0 && preservedHoldIds.length === 0;
  return {
    build: 'QL-151', reviewedBuild: 'QL-150',
    mode: 'public_synthetic_review_only',
    outcome: ready ? 'criteria_satisfied_synthetic_only' : 'follow_up_review_held',
    checks, summary, preservedHoldIds, followUps,
    independentOwnerAcceptance: false,
    actualHoldClosed: false, consentCaptured: false,
    evidencePersisted: false, exportEnabled: false,
    canTransmit: false, liveCommunicationsEnabled: false,
    warning: ready ?
      'Synthetic criteria pass; no real owner acceptance, real hold closure, persisted evidence or live service was authorized.' :
      'Synthetic review held. All unresolved evidence holds remain open; follow-up is a design-only action.'
  };
}
