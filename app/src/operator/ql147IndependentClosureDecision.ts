import type { Ql145CorrectiveClosureReview } from './ql145CorrectiveClosureReview';
import type { Ql146ClosureReadiness } from './ql146SyntheticEvidenceRecheck';

export type Ql147DecisionGate = {
  id: string;
  status: 'pass' | 'blocked';
  review: string;
  hold: string;
};
export type Ql147IndependentClosureDecision = {
  build: 'QL-147';
  reviewedBuild: 'QL-146';
  decision: 'eligible_for_separate_synthetic_decision_only' | 'synthetic_decision_held';
  gates: readonly Ql147DecisionGate[];
  summary: { passed: number; blocked: number };
  evidenceHoldIds: readonly string[];
  disposition: 'display_only_no_actual_closure';
  ownerApprovalGranted: false;
  consentCaptured: false;
  exceptionClosureRecorded: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  phoneSmsLiveEnabled: false;
  notice: string;
};

const EXPECTED_RECHECK_IDS = [
  'ql146-schema-evidence-recheck',
  'ql146-exception-reconciliation',
  'ql146-closure-criteria-reconciliation',
  'ql146-prohibition-check',
  'ql146-fresh-synthetic-evidence',
  'ql146-unresolved-exception-hold',
  'ql146-closure-readiness-only'
] as const;

const EXPECTED_CLOSURE_IDS = [
  'ql145-source-reconciliation',
  'ql145-exception-accounting',
  'ql145-corrective-evidence',
  'ql145-no-auto-closure',
  'ql145-privacy-boundary',
  'ql145-independent-release'
] as const;

function makeGate(id: string, review: string, ok: boolean, hold: string): Ql147DecisionGate {
  return { id, review, status: ok ? 'pass' : 'blocked', hold };
}

// Independent and fail-closed display-only review. Passing authorizes only a
// separately scoped future synthetic decision review, never closure, owner
// permission, export, persistence, or activation of communications.
export function reviewQl147IndependentClosure(
  recheck: Ql146ClosureReadiness,
  prior: Ql145CorrectiveClosureReview
): Ql147IndependentClosureDecision {
  const recheckCounts = recheck.gates.reduce((sum, current) => ({
    passed: sum.passed + Number(current.status === 'pass'),
    blocked: sum.blocked + Number(current.status === 'blocked')
  }), { passed: 0, blocked: 0 });

  const exactRecheck =
    recheck.build === 'QL-146' &&
    recheck.reviewedBuild === 'QL-145' &&
    recheck.gates.length === EXPECTED_RECHECK_IDS.length &&
    new Set(recheck.gates.map(x => x.id)).size === EXPECTED_RECHECK_IDS.length &&
    EXPECTED_RECHECK_IDS.every(id => recheck.gates.some(g => g.id === id)) &&
    recheckCounts.passed === recheck.summary.passed &&
    recheckCounts.blocked === recheck.summary.blocked &&
    recheck.sourceChecks.passed + recheck.sourceChecks.blocked === 6 &&
    recheck.sourceIntegrityVerified;

  const exactClosure =
    prior.build === 'QL-145' && prior.reviewedBuild === 'QL-144' &&
    prior.gates.length === EXPECTED_CLOSURE_IDS.length &&
    new Set(prior.gates.map(x => x.id)).size === EXPECTED_CLOSURE_IDS.length &&
    EXPECTED_CLOSURE_IDS.every(id => prior.gates.some(g => g.id === id)) &&
    prior.summary.passed === prior.gates.filter(g => g.status === 'pass').length &&
    prior.summary.blocked === prior.gates.filter(g => g.status === 'blocked').length &&
    prior.sourceReconciled === true && prior.criteriaOnly === true;

  const evidenceRechecked =
    exactRecheck && recheck.sourceChecks.passed === 6 &&
    recheck.sourceChecks.blocked === 0 &&
    recheck.gates.every(g => g.status === 'pass') &&
    recheck.outcome === 'ready_for_separate_synthetic_closure_review_only';

  const holdsReconciled =
    exactRecheck && exactClosure &&
    new Set(recheck.unresolvedExceptionIds).size === recheck.unresolvedExceptionIds.length &&
    new Set(prior.unresolvedExceptionIds).size === prior.unresolvedExceptionIds.length &&
    recheck.unresolvedExceptionIds.length === prior.unresolvedExceptionIds.length &&
    recheck.unresolvedExceptionIds.every(id => prior.unresolvedExceptionIds.includes(id));

  const noOpenHolds =
    holdsReconciled && recheck.unresolvedExceptionIds.length === 0 &&
    prior.unresolvedExceptionIds.length === 0 &&
    prior.summary.blocked === 0 &&
    prior.outcome === 'criteria_met_synthetic_only';

  const noRealDecision =
    recheck.closureRecorded === false &&
    recheck.ownerApprovalCaptured === false &&
    prior.closureRecorded === false &&
    prior.ownerApproved === false;
  const noWriteOrLive =
    noRealDecision && recheck.exportEnabled === false &&
    recheck.downloadEnabled === false && recheck.canTransmit === false &&
    recheck.liveCommunicationsEnabled === false &&
    prior.exportEnabled === false && prior.canTransmit === false;

  const gates: readonly Ql147DecisionGate[] = [
    makeGate('ql147-exact-recheck', 'Independently reconcile exactly seven unique QL-146 gates and their status counts',
      exactRecheck, 'Rebuild synthetic evidence from the authorized QL-142 fixture.'),
    makeGate('ql147-prior-closure-lineage', 'Reconcile six QL-145 criteria and the upstream QL-144 source',
      exactClosure, 'Retain the source hold until lineage and counts match.'),
    makeGate('ql147-independent-evidence', 'Verify all QL-146 evidence-recheck gates pass without relying on prior approval',
      evidenceRechecked, 'Keep evidence unapproved; a proposal is not new verified evidence.'),
    makeGate('ql147-evidence-hold-reconciliation', 'Compare unique QL-145 and QL-146 hold IDs without dropping any',
      holdsReconciled, 'Investigate mismatched, missing or duplicate hold IDs.'),
    makeGate('ql147-zero-open-holds', 'Require zero unresolved synthetic holds and six passing QL-145 criteria',
      noOpenHolds, 'Keep every unresolved exception open and visible.'),
    makeGate('ql147-no-real-decision', 'No owner consent, signature, approval, or actual exception closure was recorded',
      noRealDecision, 'Stop on any real decision capture or recorded closure.'),
    makeGate('ql147-no-live-export', 'Verify export/download/transmission and live communications remain disabled',
      noWriteOrLive, 'Disable any live or persistent capability before resuming synthetic review.')
  ];
  const summary = {
    passed: gates.filter(g => g.status === 'pass').length,
    blocked: gates.filter(g => g.status === 'blocked').length
  };
  const ids = [...new Set([...prior.unresolvedExceptionIds, ...recheck.unresolvedExceptionIds])];
  const evidenceHoldIds = ids.length > 0 ? ids : (summary.blocked > 0 ? ['ql147-review-integrity-hold'] : []);
  const ready = summary.blocked === 0 && evidenceHoldIds.length === 0;

  return {
    build: 'QL-147', reviewedBuild: 'QL-146',
    decision: ready ? 'eligible_for_separate_synthetic_decision_only' : 'synthetic_decision_held',
    gates, summary, evidenceHoldIds,
    disposition: 'display_only_no_actual_closure',
    ownerApprovalGranted: false, consentCaptured: false,
    exceptionClosureRecorded: false, exportEnabled: false,
    downloadEnabled: false, canTransmit: false, phoneSmsLiveEnabled: false,
    notice: ready
      ? 'Synthetic decision review eligible only. No owner approval, consent, real exception closure, export, or live service activation.'
      : 'Independent synthetic review held. Every unresolved evidence hold remains open; no closure or live operations.'
  };
}
