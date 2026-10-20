import type { Ql146ClosureReadiness } from './ql146SyntheticEvidenceRecheck';
import type { Ql147IndependentClosureDecision } from './ql147IndependentClosureDecision';

export type Ql148TraceItem = {
  id: string;
  sourceBuild: 'QL-146' | 'QL-147';
  gateId: string;
  result: 'pass' | 'blocked';
  note: string;
};

export type Ql148AuditTrace = {
  build: 'QL-148';
  mode: 'public_synthetic_in_memory_only';
  sourceReconciled: boolean;
  outcome: 'synthetic_trace_review_ready' | 'trace_or_evidence_hold_required';
  checks: readonly { id: string; status: 'pass' | 'blocked'; rationale: string }[];
  trace: readonly Ql148TraceItem[];
  outstandingHoldIds: readonly string[];
  checksPassed: number;
  checksBlocked: number;
  storedAuditRecord: false;
  ownerDecisionRecorded: false;
  actualExceptionClosure: false;
  exportEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const EXPECTED_146 = [
  'ql146-schema-evidence-recheck',
  'ql146-exception-reconciliation',
  'ql146-closure-criteria-reconciliation',
  'ql146-prohibition-check',
  'ql146-fresh-synthetic-evidence',
  'ql146-unresolved-exception-hold',
  'ql146-closure-readiness-only'
] as const;
const EXPECTED_147 = [
  'ql147-exact-recheck',
  'ql147-prior-closure-lineage',
  'ql147-independent-evidence',
  'ql147-evidence-hold-reconciliation',
  'ql147-zero-open-holds',
  'ql147-no-real-decision',
  'ql147-no-live-export'
] as const;

function exactGateSet(items: readonly { id: string; status: 'pass' | 'blocked' }[], expected: readonly string[]): boolean {
  return items.length === expected.length &&
    new Set(items.map(item => item.id)).size === expected.length &&
    expected.every(id => items.some(item => item.id === id));
}

function check(id: string, ok: boolean, rationale: string) {
  return { id, status: ok ? 'pass' as const : 'blocked' as const, rationale };
}

// No browser storage, durable audit rows, owner signatures or export artifacts.
// This is a reproducible presentation trace, not evidence of a real-world review.
export function auditQl148SyntheticClosureTrace(
  recheck: Ql146ClosureReadiness,
  decision: Ql147IndependentClosureDecision
): Ql148AuditTrace {
  const counts146 = {
    passed: recheck.gates.filter(item => item.status === 'pass').length,
    blocked: recheck.gates.filter(item => item.status === 'blocked').length
  };
  const counts147 = {
    passed: decision.gates.filter(item => item.status === 'pass').length,
    blocked: decision.gates.filter(item => item.status === 'blocked').length
  };
  const sourceReconciled = recheck.build === 'QL-146' &&
    recheck.reviewedBuild === 'QL-145' &&
    decision.build === 'QL-147' &&
    decision.reviewedBuild === 'QL-146' &&
    exactGateSet(recheck.gates, EXPECTED_146) &&
    exactGateSet(decision.gates, EXPECTED_147) &&
    counts146.passed === recheck.summary.passed &&
    counts146.blocked === recheck.summary.blocked &&
    counts147.passed === decision.summary.passed &&
    counts147.blocked === decision.summary.blocked;
  const holds146 = [...new Set(recheck.unresolvedExceptionIds)];
  const holds147 = [...new Set(decision.evidenceHoldIds)];
  const holdsConsistent = sourceReconciled &&
    holds146.length === recheck.unresolvedExceptionIds.length &&
    holds147.length === decision.evidenceHoldIds.length &&
    holds146.every(id => holds147.includes(id));
  const noOpenHolds = holdsConsistent &&
    holds146.length === 0 && holds147.length === 0 &&
    counts146.blocked === 0 && counts147.blocked === 0;
  const noRealActions = recheck.closureRecorded === false &&
    recheck.ownerApprovalCaptured === false &&
    recheck.exportEnabled === false &&
    recheck.downloadEnabled === false &&
    recheck.canTransmit === false &&
    recheck.liveCommunicationsEnabled === false &&
    decision.ownerApprovalGranted === false &&
    decision.consentCaptured === false &&
    decision.exceptionClosureRecorded === false &&
    decision.exportEnabled === false &&
    decision.downloadEnabled === false &&
    decision.canTransmit === false &&
    decision.phoneSmsLiveEnabled === false;
  const trace = sourceReconciled ? [
    ...recheck.gates.map(item => ({
      id: 'ql148-recheck-' + item.id, sourceBuild: 'QL-146' as const,
      gateId: item.id, result: item.status, note: item.evidence
    })),
    ...decision.gates.map(item => ({
      id: 'ql148-decision-' + item.id, sourceBuild: 'QL-147' as const,
      gateId: item.id, result: item.status, note: item.review
    }))
  ] : [];
  const traceComplete = sourceReconciled &&
    trace.length === EXPECTED_146.length + EXPECTED_147.length &&
    new Set(trace.map(item => item.id)).size === trace.length;
  const outcomeConsistent = sourceReconciled &&
    recheck.outcome === (counts146.blocked === 0 && recheck.sourceIntegrityVerified ?
      'ready_for_separate_synthetic_closure_review_only' : 'evidence_recheck_or_exception_review_required') &&
    decision.decision === (counts147.blocked === 0 && holds147.length === 0 ?
      'eligible_for_separate_synthetic_decision_only' : 'synthetic_decision_held');
  const checks = [
    check('ql148-provenance', sourceReconciled, 'Exact QL-146/QL-147 IDs and counts reconcile independently.'),
    check('ql148-trace-completeness', traceComplete, 'Exactly fourteen unique in-memory gate results are represented.'),
    check('ql148-outcome-reconciliation', outcomeConsistent, 'Recorded synthetic outcomes match the independently recalculated gates.'),
    check('ql148-hold-parity', holdsConsistent, 'QL-146 unresolved holds remain visible in QL-147 evidence holds.'),
    check('ql148-zero-open-holds', noOpenHolds, 'Any unresolved synthetic hold blocks a clean review-ready outcome.'),
    check('ql148-no-real-actions', noRealActions, 'No owner approval, closure, persistence, export or live service enabled.')
  ];
  const checksPassed = checks.filter(item => item.status === 'pass').length;
  const checksBlocked = checks.length - checksPassed;
  const outstandingHoldIds = [
    ...new Set([...holds146, ...holds147, ...(!sourceReconciled ? ['ql148-source-integrity-hold'] : [])])
  ];
  return {
    build: 'QL-148', mode: 'public_synthetic_in_memory_only', sourceReconciled,
    outcome: checksBlocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_trace_review_ready' : 'trace_or_evidence_hold_required',
    checks, trace, outstandingHoldIds, checksPassed, checksBlocked,
    storedAuditRecord: false, ownerDecisionRecorded: false,
    actualExceptionClosure: false, exportEnabled: false,
    canTransmit: false, livePhoneSmsEnabled: false,
    notice: 'This is an in-memory synthetic trace, not a stored audit log, decision, approval, actual closure, export or production deployment verification.'
  };
}
