import type { Ql146ClosureReadiness } from './ql146SyntheticEvidenceRecheck';
import type { Ql147IndependentClosureDecision } from './ql147IndependentClosureDecision';
import type { Ql148AuditTrace } from './ql148SyntheticClosureAuditTrace';

export type Ql149AcceptanceGate = {
  id: string;
  label: string;
  status: 'pass' | 'blocked';
  evidenceRequired: string;
  followUpIfBlocked: string;
};

export type Ql149IndependentAcceptance = {
  build: 'QL-149';
  sourceBuild: 'QL-148';
  mode: 'synthetic_independent_review_only';
  outcome: 'synthetic_review_criteria_met_only' | 'independent_review_held';
  gates: readonly Ql149AcceptanceGate[];
  summary: { passed: number; blocked: number };
  unresolvedHoldIds: readonly string[];
  traceEntriesInspected: number;
  acceptanceRecorded: false;
  realExceptionClosed: false;
  ownerApprovalGranted: false;
  persistedAuditLog: false;
  exportEnabled: false;
  liveCommunicationsEnabled: false;
  notice: string;
};

const EXPECTED_148 = [
  'ql148-provenance',
  'ql148-trace-completeness',
  'ql148-outcome-reconciliation',
  'ql148-hold-parity',
  'ql148-zero-open-holds',
  'ql148-no-real-actions'
] as const;

function gate(
  id: string, label: string, ok: boolean, evidenceRequired: string, followUpIfBlocked: string
): Ql149AcceptanceGate {
  return {
    id, label, status: ok ? 'pass' : 'blocked', evidenceRequired, followUpIfBlocked
  };
}

// A second, in-memory examination of the synthetic trace and hold lineage.
// This does not collect acceptance, attest a real audit or close exceptions.
export function reviewQl149IndependentAuditAcceptance(
  source: Ql148AuditTrace,
  recheck: Ql146ClosureReadiness,
  decision: Ql147IndependentClosureDecision
): Ql149IndependentAcceptance {
  const expected = [
    ...recheck.gates.map(item => ({
      id: 'ql148-recheck-' + item.id,
      sourceBuild: 'QL-146',
      gateId: item.id,
      result: item.status,
      note: item.evidence
    })),
    ...decision.gates.map(item => ({
      id: 'ql148-decision-' + item.id,
      sourceBuild: 'QL-147',
      gateId: item.id,
      result: item.status,
      note: item.review
    }))
  ];
  const uniqueTrace = new Set(source.trace.map(item => item.id)).size === source.trace.length;
  const traceComplete =
    source.build === 'QL-148' &&
    source.mode === 'public_synthetic_in_memory_only' &&
    source.sourceReconciled === true &&
    source.trace.length === 14 &&
    expected.length === 14 &&
    uniqueTrace &&
    expected.every(item => source.trace.some(actual =>
      actual.id === item.id && actual.sourceBuild === item.sourceBuild &&
      actual.gateId === item.gateId && actual.result === item.result && actual.note === item.note
    ));

  const exactReviewGateSet =
    source.checks.length === EXPECTED_148.length &&
    new Set(source.checks.map(item => item.id)).size === EXPECTED_148.length &&
    EXPECTED_148.every(id => source.checks.some(item => item.id === id));
  const reviewCountsMatch =
    exactReviewGateSet &&
    source.checksPassed === source.checks.filter(item => item.status === 'pass').length &&
    source.checksBlocked === source.checks.filter(item => item.status === 'blocked').length &&
    source.checksPassed + source.checksBlocked === EXPECTED_148.length;
  const expectedHolds = [...new Set([
    ...recheck.unresolvedExceptionIds,
    ...decision.evidenceHoldIds,
    ...(!source.sourceReconciled ? ['ql148-source-integrity-hold'] : [])
  ])];
  const holdsMatch =
    source.outstandingHoldIds.length === expectedHolds.length &&
    new Set(source.outstandingHoldIds).size === source.outstandingHoldIds.length &&
    expectedHolds.every(id => source.outstandingHoldIds.includes(id));
  const failedTraceIds = source.trace.filter(item => item.result === 'blocked').map(item => item.id);
  const allHoldIds = [...new Set([
    ...expectedHolds,
    ...source.outstandingHoldIds,
    ...(!traceComplete || !reviewCountsMatch || !holdsMatch ? ['ql149-source-discrepancy-hold'] : []),
    ...failedTraceIds.map(id => 'ql149-blocked-' + id)
  ])];
  const traceOutcomesMatch =
    reviewCountsMatch &&
    source.outcome === (
      source.checksBlocked === 0 && source.outstandingHoldIds.length === 0 ?
        'synthetic_trace_review_ready' : 'trace_or_evidence_hold_required'
    ) &&
    (source.outcome !== 'synthetic_trace_review_ready' ||
      (recheck.summary.blocked === 0 && decision.summary.blocked === 0));
  const runtimeBoundary =
    source.storedAuditRecord === false && source.ownerDecisionRecorded === false &&
    source.actualExceptionClosure === false && source.exportEnabled === false &&
    source.canTransmit === false && source.livePhoneSmsEnabled === false &&
    recheck.closureRecorded === false && recheck.ownerApprovalCaptured === false &&
    recheck.exportEnabled === false && recheck.downloadEnabled === false &&
    recheck.canTransmit === false && recheck.liveCommunicationsEnabled === false &&
    decision.ownerApprovalGranted === false && decision.consentCaptured === false &&
    decision.exceptionClosureRecorded === false && decision.exportEnabled === false &&
    decision.downloadEnabled === false && decision.canTransmit === false &&
    decision.phoneSmsLiveEnabled === false;
  const noUnresolved = holdsMatch && allHoldIds.length === 0 &&
    failedTraceIds.length === 0 &&
    source.checksBlocked === 0 && decision.summary.blocked === 0 &&
    recheck.summary.blocked === 0 &&
    recheck.outcome === 'ready_for_separate_synthetic_closure_review_only' &&
    decision.decision === 'eligible_for_separate_synthetic_decision_only';
  const gates: readonly Ql149AcceptanceGate[] = [
    gate('ql149-exact-trace', 'All fourteen trace entries independently match their QL-146/QL-147 sources',
      traceComplete, 'Unique trace IDs, exact source build, status and review text',
      'Rebuild the trace from the synthetic source; no real audit record is acceptable.'),
    gate('ql149-review-set', 'The six QL-148 acceptance-check IDs and totals reconcile',
      reviewCountsMatch, 'Exact six unique IDs and recomputed pass/block counts',
      'Hold review for missing, duplicated or altered checks.'),
    gate('ql149-hold-parity', 'Every unresolved source hold survives the cross-build reconciliation',
      holdsMatch, 'Exact union of QL-146, QL-147 and source-integrity hold identifiers',
      'Preserve missing and inconsistent hold IDs; never auto-close.'),
    gate('ql149-outcome', 'Recorded synthetic outcomes agree with the underlying gate statuses',
      traceOutcomesMatch, 'Pass/blocked status consistency in QL-148 and upstream sources',
      'Return to independent synthetic review; do not infer acceptance from labels.'),
    gate('ql149-zero-open-holds', 'No unresolved hold or blocked trace exists',
      noUnresolved, 'No blocked source gate and no outstanding synthetic hold',
      'Keep the original hold open pending independently verified synthetic correction.'),
    gate('ql149-runtime-locks', 'No real owner action, stored audit, export or live communication is authorized',
      runtimeBoundary, 'All no-write, no-export, no-owner, no-live protections remain false',
      'Stop and remove any real evidence capture, approval, write or provider path.'),
    gate('ql149-independent-acceptance-boundary', 'Passing criteria are not actual owner acceptance or real closure',
      runtimeBoundary && reviewCountsMatch, 'Independent review requires separately scoped owner action; acceptanceRecorded remains false',
      'Do not record owner approval or change exception status in this feature.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  if (summary.blocked > 0 && allHoldIds.length === 0) {
    allHoldIds.push('ql149-review-gate-hold');
  }
  return {
    build: 'QL-149', sourceBuild: 'QL-148', mode: 'synthetic_independent_review_only',
    outcome: summary.blocked === 0 && allHoldIds.length === 0 ?
      'synthetic_review_criteria_met_only' : 'independent_review_held',
    gates, summary, unresolvedHoldIds: allHoldIds,
    traceEntriesInspected: source.trace.length,
    acceptanceRecorded: false, realExceptionClosed: false,
    ownerApprovalGranted: false, persistedAuditLog: false,
    exportEnabled: false, liveCommunicationsEnabled: false,
    notice: 'Public/synthetic independent review only. No durable audit, real acceptance, consent, customer evidence export, exception closure or live Phone/SMS/AI activation.'
  };
}
