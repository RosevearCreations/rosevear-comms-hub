import type { Ql146ClosureReadiness } from './ql146SyntheticEvidenceRecheck';
import type { Ql147IndependentClosureDecision } from './ql147IndependentClosureDecision';
import type { Ql148AuditTrace } from './ql148SyntheticClosureAuditTrace';
import {
  reviewQl149IndependentAuditAcceptance,
  type Ql149IndependentAcceptance
} from './ql149SyntheticAuditAcceptance';

export type Ql150ContinuityGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  followUp: string;
};
export type Ql150AcceptanceContinuity = {
  build: 'QL-150';
  sourceBuild: 'QL-149';
  mode: 'synthetic_recheck_only';
  outcome: 'synthetic_continuity_review_ready_only' | 'synthetic_continuity_on_hold';
  gates: readonly Ql150ContinuityGate[];
  summary: { passed: number; blocked: number };
  sourceIntegrityVerified: boolean;
  originalHoldIds: readonly string[];
  reproducedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  closureRecorded: false;
  acceptanceRecorded: false;
  ownerApprovalGranted: false;
  storedAuditLog: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  liveCommunicationsEnabled: false;
  notice: string;
};

const EXPECTED = [
  'ql149-exact-trace', 'ql149-review-set', 'ql149-hold-parity',
  'ql149-outcome', 'ql149-zero-open-holds', 'ql149-runtime-locks',
  'ql149-independent-acceptance-boundary'
] as const;

function makeGate(
  id: string, requirement: string, ok: boolean, followUp: string
): Ql150ContinuityGate {
  return { id, requirement, status: ok ? 'pass' : 'blocked', followUp };
}

// Independently replay QL-149 using the same in-memory public/synthetic sources.
// Do not mutate the supplied arrays, store audit evidence, sign a decision, close
// an exception, issue a download, or enable live communications.
export function recheckQl150AcceptanceContinuity(
  source: Ql149IndependentAcceptance,
  audit: Ql148AuditTrace,
  recheck: Ql146ClosureReadiness,
  decision: Ql147IndependentClosureDecision
): Ql150AcceptanceContinuity {
  const replay = reviewQl149IndependentAuditAcceptance(audit, recheck, decision);
  const sourceIds = source.gates.map(gate => gate.id);
  const gateSetValid =
    source.build === 'QL-149' && source.sourceBuild === 'QL-148' &&
    source.mode === 'synthetic_independent_review_only' &&
    source.gates.length === EXPECTED.length &&
    new Set(sourceIds).size === EXPECTED.length &&
    EXPECTED.every(id => sourceIds.includes(id));
  const statusesVerified = gateSetValid &&
    source.gates.every(actual => replay.gates.some(expected =>
      expected.id === actual.id &&
      expected.status === actual.status &&
      expected.label === actual.label &&
      expected.evidenceRequired === actual.evidenceRequired &&
      expected.followUpIfBlocked === actual.followUpIfBlocked
    ));
  const sourcePassed = source.gates.filter(gate => gate.status === 'pass').length;
  const sourceBlocked = source.gates.filter(gate => gate.status === 'blocked').length;
  const countAndOutcomeValid =
    statusesVerified &&
    sourcePassed === source.summary.passed &&
    sourceBlocked === source.summary.blocked &&
    sourcePassed === replay.summary.passed &&
    sourceBlocked === replay.summary.blocked &&
    source.outcome === replay.outcome &&
    source.traceEntriesInspected === replay.traceEntriesInspected &&
    source.traceEntriesInspected === 14;
  const originalHoldIds = [...new Set(source.unresolvedHoldIds)];
  const reproducedHoldIds = [...new Set(replay.unresolvedHoldIds)];
  const uniqueSourceHolds = originalHoldIds.length === source.unresolvedHoldIds.length;
  const noHoldLost = uniqueSourceHolds &&
    reproducedHoldIds.every(id => originalHoldIds.includes(id));
  const exactHoldContinuity = noHoldLost &&
    originalHoldIds.length === reproducedHoldIds.length &&
    originalHoldIds.every(id => reproducedHoldIds.includes(id));
  const runtimeLocks =
    source.acceptanceRecorded === false &&
    source.realExceptionClosed === false &&
    source.ownerApprovalGranted === false &&
    source.persistedAuditLog === false &&
    source.exportEnabled === false &&
    source.liveCommunicationsEnabled === false &&
    replay.acceptanceRecorded === false &&
    replay.realExceptionClosed === false &&
    replay.ownerApprovalGranted === false &&
    replay.persistedAuditLog === false &&
    replay.exportEnabled === false &&
    replay.liveCommunicationsEnabled === false &&
    audit.storedAuditRecord === false &&
    audit.ownerDecisionRecorded === false &&
    audit.actualExceptionClosure === false &&
    audit.exportEnabled === false &&
    audit.canTransmit === false &&
    audit.livePhoneSmsEnabled === false &&
    decision.ownerApprovalGranted === false &&
    decision.consentCaptured === false &&
    decision.exceptionClosureRecorded === false &&
    decision.exportEnabled === false &&
    decision.downloadEnabled === false &&
    decision.canTransmit === false &&
    decision.phoneSmsLiveEnabled === false &&
    recheck.closureRecorded === false &&
    recheck.ownerApprovalCaptured === false &&
    recheck.exportEnabled === false &&
    recheck.downloadEnabled === false &&
    recheck.canTransmit === false &&
    recheck.liveCommunicationsEnabled === false;
  const noUnresolved = exactHoldContinuity &&
    originalHoldIds.length === 0 && reproducedHoldIds.length === 0 &&
    replay.summary.blocked === 0 &&
    replay.outcome === 'synthetic_review_criteria_met_only' &&
    audit.outcome === 'synthetic_trace_review_ready' &&
    decision.decision === 'eligible_for_separate_synthetic_decision_only';
  const sourceIntegrityVerified =
    gateSetValid && statusesVerified && countAndOutcomeValid &&
    exactHoldContinuity && runtimeLocks;
  const gates: readonly Ql150ContinuityGate[] = [
    makeGate('ql150-source-contract', 'QL-149 source identity and seven unique expected gates', gateSetValid,
      'Reconstruct the review from the QL-148 synthetic trace.'),
    makeGate('ql150-independent-replay', 'Replay reproduces exact gate statuses, labels and evidence text',
      statusesVerified, 'Keep acceptance held and independently review synthetic evidence.'),
    makeGate('ql150-count-outcome', 'Gate totals, trace count and QL-149 outcome agree with replay',
      countAndOutcomeValid, 'Reconcile altered totals and do not accept a status label alone.'),
    makeGate('ql150-no-lost-holds', 'All reproduced unresolved hold IDs survive without duplicates',
      noHoldLost, 'Restore all missing holds; an altered source never closes an exception.'),
    makeGate('ql150-hold-parity', 'Original and replayed hold sets match exactly',
      exactHoldContinuity, 'Hold until both synthetic evidence sets reconcile.'),
    makeGate('ql150-zero-open-holds', 'No exception or synthetic evidence hold remains unresolved',
      noUnresolved, 'Keep all unresolved holds open and do not promote acceptance.'),
    makeGate('ql150-runtime-prohibitions', 'Owner decisions, durable audit, downloads, exports and live services remain disabled',
      runtimeLocks, 'Block the review and restore all no-write/no-live safeguards.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...originalHoldIds,
    ...reproducedHoldIds,
    ...(!sourceIntegrityVerified ? ['ql150-recheck-integrity-hold'] : []),
    ...(summary.blocked > 0 ? ['ql150-continuity-review-hold'] : [])
  ])];
  return {
    build: 'QL-150', sourceBuild: 'QL-149', mode: 'synthetic_recheck_only',
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_continuity_review_ready_only' : 'synthetic_continuity_on_hold',
    gates, summary, sourceIntegrityVerified,
    originalHoldIds, reproducedHoldIds, outstandingHoldIds,
    closureRecorded: false, acceptanceRecorded: false,
    ownerApprovalGranted: false, storedAuditLog: false,
    exportEnabled: false, downloadEnabled: false,
    canTransmit: false, liveCommunicationsEnabled: false,
    notice: 'Read-only in-memory synthetic recheck. Passing criteria do not record acceptance, authorize an owner, close exceptions, save an audit or verify production deployment.'
  };
}
