import type { Ql144CorrectiveDesign } from './ql144CorrectiveExceptions';

export type Ql145ClosureGate = {
  id: string;
  label: string;
  status: 'pass' | 'blocked';
  evidenceRequired: string;
  nextAction: string;
};
export type Ql145CorrectiveClosureReview = {
  build: 'QL-145';
  reviewedBuild: 'QL-144';
  outcome: 'criteria_met_synthetic_only' | 'closure_blocked';
  sourceReconciled: boolean;
  gates: readonly Ql145ClosureGate[];
  summary: { passed: number; blocked: number };
  unresolvedExceptionIds: readonly string[];
  criteriaOnly: true;
  closureRecorded: false;
  ownerApproved: false;
  exportEnabled: false;
  canTransmit: false;
  notice: string;
};

const EXPECTED_CHECK_COUNT = 6;
const NO_EXCEPTION = 'No unresolved synthetic exception exists; no exception was closed or persisted.';

function gate(
  id: string, label: string, ok: boolean, evidenceRequired: string, nextAction: string
): Ql145ClosureGate {
  return { id, label, status: ok ? 'pass' : 'blocked', evidenceRequired, nextAction };
}

// QL-145 defines review criteria only. It does not execute corrections,
// persist exception disposition, record owner approval or enable real exports.
export function reviewQl145CorrectiveClosure(source: Ql144CorrectiveDesign): Ql145CorrectiveClosureReview {
  const uniqueExceptionIds = new Set(source.exceptions.map(exception => exception.id));
  const sourceReconciled =
    source.build === 'QL-144' &&
    source.sourceBuild === 'QL-143' &&
    source.sourceReconciled === true &&
    source.inspectedChecks === EXPECTED_CHECK_COUNT &&
    source.passedChecks >= 0 &&
    source.blockedChecks >= 0 &&
    source.passedChecks + source.blockedChecks === EXPECTED_CHECK_COUNT &&
    uniqueExceptionIds.size === source.exceptions.length &&
    source.exceptions.every(exception =>
      exception.severity === 'review_required' &&
      exception.status === 'design_only_not_applied' &&
      exception.id.length > 0 &&
      exception.reason.length > 0 &&
      exception.proposedCorrection.length > 0
    ) &&
    source.correctionApplied === false &&
    source.exportEnabled === false &&
    source.outcome === (
      source.exceptions.length === 0 ? 'synthetic_review_only' : 'correction_plan_required'
    );
  const exceptionsMatchCount = sourceReconciled &&
    source.exceptions.length === source.blockedChecks;
  const noUnresolved = exceptionsMatchCount &&
    source.blockedChecks === 0 && source.exceptions.length === 0 &&
    source.passedChecks === EXPECTED_CHECK_COUNT;
  const runtimeSafe = source.correctionApplied === false &&
    source.exportEnabled === false;
  const gates = [
    gate('ql145-source-reconciliation', 'QL-144 provenance, totals, exception IDs and outcome reconcile',
      sourceReconciled, 'Exact QL-144/QL-143 build lineage and six inspected checks with unique exception IDs.',
      'Rebuild the synthetic source review if its lineage or counts cannot be reconciled.'),
    gate('ql145-exception-accounting', 'Every unresolved source exception is counted once',
      exceptionsMatchCount, 'One unique exception per failed QL-143 check, with a matching blocked total.',
      'Reconcile missing, duplicate or inconsistent synthetic exceptions before any review.'),
    gate('ql145-corrective-evidence', 'Corrective evidence is independently re-reviewed, not merely proposed',
      noUnresolved, 'New independent six-of-six passing synthetic check result; proposal text alone never closes an exception.',
      'Leave each source exception open; separately review fresh synthetic-only evidence.'),
    gate('ql145-no-auto-closure', 'No correction or closure was automatically applied or recorded',
      runtimeSafe, 'CorrectionApplied=false and no owner action, ledger update or closure API.',
      'Stop and remove any persistence or automatic closure path.'),
    gate('ql145-privacy-boundary', 'Owner consent, private evidence and communication remain outside the review',
      runtimeSafe && sourceReconciled, 'Public/synthetic design only, no customer/provider data, Phone/SMS, callback, recording or AI sending.',
      'Retain disabled runtime and seek separate privacy/security review for any real data.'),
    gate('ql145-independent-release', 'Synthetic closure criteria never grant production or owner authority',
      sourceReconciled && runtimeSafe, 'Separate owner decision, CI release verification and deployment checks are still required.',
      'Do not equate synthetic criteria success with owner approval, real exception closure or Production GREEN.')
  ] as const;
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  return {
    build: 'QL-145', reviewedBuild: 'QL-144', sourceReconciled,
    outcome: summary.blocked === 0 && noUnresolved ? 'criteria_met_synthetic_only' : 'closure_blocked',
    gates, summary,
    unresolvedExceptionIds: source.exceptions.map(exception => exception.id),
    criteriaOnly: true, closureRecorded: false, ownerApproved: false,
    exportEnabled: false, canTransmit: false,
    notice: source.exceptions.length ? 
      'Closure blocked: corrective proposals are not completed evidence or accepted owner decisions.' :
      NO_EXCEPTION + ' Criteria pass only for synthetic review; nothing is approved, exported or recorded.'
  };
}
