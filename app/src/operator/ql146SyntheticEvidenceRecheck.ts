import type { Ql142ExportDesign } from './ql142SyntheticEvidenceExportDesign';
import { reviewQl143SyntheticSchema, type Ql143Review } from './ql143SyntheticSchemaReview';
import { designQl144CorrectiveExceptions, type Ql144CorrectiveDesign } from './ql144CorrectiveExceptions';
import { reviewQl145CorrectiveClosure, type Ql145CorrectiveClosureReview } from './ql145CorrectiveClosureReview';

export type Ql146RecheckGate = {
  id: string;
  label: string;
  status: 'pass' | 'blocked';
  evidence: string;
  responseIfBlocked: string;
};

export type Ql146ClosureReadiness = {
  build: 'QL-146';
  reviewedBuild: 'QL-145';
  sourceIntegrityVerified: boolean;
  outcome: 'ready_for_separate_synthetic_closure_review_only' | 'evidence_recheck_or_exception_review_required';
  sourceChecks: { passed: number; blocked: number };
  gates: readonly Ql146RecheckGate[];
  summary: { passed: number; blocked: number };
  unresolvedExceptionIds: readonly string[];
  closureRecorded: false;
  ownerApprovalCaptured: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  liveCommunicationsEnabled: false;
  warning: string;
};

const EXPECTED_QL145_GATES = [
  'ql145-source-reconciliation',
  'ql145-exception-accounting',
  'ql145-corrective-evidence',
  'ql145-no-auto-closure',
  'ql145-privacy-boundary',
  'ql145-independent-release'
] as const;

function gate(
  id: string, label: string, status: boolean, evidence: string, responseIfBlocked: string
): Ql146RecheckGate {
  return { id, label, status: status ? 'pass' : 'blocked', evidence, responseIfBlocked };
}

// Re-run the prior pure synthetic reviewers from the original in-memory fixture.
// This routine neither persists an exception nor closes one; a passing result is
// never a real-owner approval, an export authorization or a production release.
export function recheckQl146SyntheticEvidence(
  contract: Ql142ExportDesign,
  schemaReview: Ql143Review,
  correctiveDesign: Ql144CorrectiveDesign,
  closureReview: Ql145CorrectiveClosureReview
): Ql146ClosureReadiness {
  const rerunSchema = reviewQl143SyntheticSchema(contract);
  const rerunCorrective = designQl144CorrectiveExceptions(rerunSchema);
  const rerunClosure = reviewQl145CorrectiveClosure(rerunCorrective);

  const schemaReconciled =
    schemaReview.build === 'QL-143' &&
    schemaReview.sourceBuild === 'QL-142' &&
    schemaReview.checks.length === rerunSchema.checks.length &&
    rerunSchema.checks.every(g => schemaReview.checks.some(
      actual => actual.id === g.id && actual.status === g.status
    )) &&
    schemaReview.passed === rerunSchema.passed &&
    schemaReview.blocked === rerunSchema.blocked &&
    schemaReview.outcome === rerunSchema.outcome;

  const originalExceptionIds = correctiveDesign.exceptions.map(x => x.id);
  const rerunExceptionIds = rerunCorrective.exceptions.map(x => x.id);
  const exceptionsReconciled =
    correctiveDesign.build === 'QL-144' &&
    correctiveDesign.sourceBuild === 'QL-143' &&
    correctiveDesign.sourceReconciled === rerunCorrective.sourceReconciled &&
    correctiveDesign.inspectedChecks === rerunCorrective.inspectedChecks &&
    correctiveDesign.passedChecks === rerunCorrective.passedChecks &&
    correctiveDesign.blockedChecks === rerunCorrective.blockedChecks &&
    correctiveDesign.outcome === rerunCorrective.outcome &&
    originalExceptionIds.length === rerunExceptionIds.length &&
    new Set(originalExceptionIds).size === originalExceptionIds.length &&
    rerunExceptionIds.every(id => originalExceptionIds.includes(id)) &&
    correctiveDesign.exceptions.every(x => {
      const reference = rerunCorrective.exceptions.find(expected => expected.id === x.id);
      return !!reference && x.status === reference.status &&
        x.severity === reference.severity &&
        x.reason === reference.reason &&
        x.proposedCorrection === reference.proposedCorrection;
    });

  const actualGateCounts = closureReview.gates.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, blocked: 0 });
  const gateIds = closureReview.gates.map(g => g.id);
  const closureReconciled =
    closureReview.build === 'QL-145' &&
    closureReview.reviewedBuild === 'QL-144' &&
    closureReview.gates.length === EXPECTED_QL145_GATES.length &&
    new Set(gateIds).size === EXPECTED_QL145_GATES.length &&
    EXPECTED_QL145_GATES.every(id => gateIds.includes(id)) &&
    closureReview.gates.every(actual => rerunClosure.gates.some(expected =>
      expected.id === actual.id && expected.status === actual.status
    )) &&
    actualGateCounts.passed === closureReview.summary.passed &&
    actualGateCounts.blocked === closureReview.summary.blocked &&
    closureReview.summary.passed === rerunClosure.summary.passed &&
    closureReview.summary.blocked === rerunClosure.summary.blocked &&
    closureReview.outcome === rerunClosure.outcome &&
    closureReview.sourceReconciled === rerunClosure.sourceReconciled &&
    closureReview.unresolvedExceptionIds.length === rerunClosure.unresolvedExceptionIds.length &&
    rerunClosure.unresolvedExceptionIds.every(id => closureReview.unresolvedExceptionIds.includes(id));

  const noWriteOrLiveRuntime =
    contract.exportEnabled === false &&
    contract.downloadEnabled === false &&
    contract.canTransmit === false &&
    schemaReview.exportEnabled === false &&
    schemaReview.canTransmit === false &&
    correctiveDesign.exportEnabled === false &&
    correctiveDesign.correctionApplied === false &&
    closureReview.criteriaOnly === true &&
    closureReview.closureRecorded === false &&
    closureReview.ownerApproved === false &&
    closureReview.exportEnabled === false &&
    closureReview.canTransmit === false;

  const sourceIntegrityVerified = schemaReconciled &&
    exceptionsReconciled && closureReconciled && noWriteOrLiveRuntime;
  const independentEvidencePass =
    sourceIntegrityVerified && rerunSchema.outcome === 'synthetic_schema_verified' &&
    rerunSchema.passed === 6 && rerunSchema.blocked === 0;
  const noUnresolvedExceptions =
    sourceIntegrityVerified && rerunCorrective.sourceReconciled &&
    rerunCorrective.exceptions.length === 0 &&
    correctiveDesign.exceptions.length === 0 &&
    rerunClosure.unresolvedExceptionIds.length === 0 &&
    closureReview.unresolvedExceptionIds.length === 0;
  const closureCriteriaRechecked =
    independentEvidencePass && noUnresolvedExceptions &&
    rerunClosure.outcome === 'criteria_met_synthetic_only' &&
    rerunClosure.summary.passed === EXPECTED_QL145_GATES.length &&
    rerunClosure.summary.blocked === 0;

  const gates: readonly Ql146RecheckGate[] = [
    gate('ql146-schema-evidence-recheck', 'QL-143 evidence reproduces independently from QL-142',
      schemaReconciled, 'Recomputed unique gate IDs, statuses, totals and outcome.',
      'Re-run using a corrected synthetic-only source; retain all holds.'),
    gate('ql146-exception-reconciliation', 'QL-144 exceptions exactly match independently identified failures',
      exceptionsReconciled, 'Unique exception IDs, count, reason and proposed correction.',
      'Investigate missing or altered exception records; never auto-close.'),
    gate('ql146-closure-criteria-reconciliation', 'QL-145 review criteria match the independent replay',
      closureReconciled, 'Six unique gate IDs, independent status counts and matching outcome.',
      'Do not treat a prior pass or proposal as new closure evidence.'),
    gate('ql146-prohibition-check', 'All no-write, no-owner and no-export safeguards remain intact',
      noWriteOrLiveRuntime, 'All source stages retain disabled corrections, storage, downloads and transmission.',
      'Stop immediately if any real write, export or communication becomes enabled.'),
    gate('ql146-fresh-synthetic-evidence', 'Six QL-143 checks pass again on the synthetic fixture',
      independentEvidencePass, 'Independent QL-143 rerun: ' + rerunSchema.passed + ' passed, ' + rerunSchema.blocked + ' blocked.',
      'Correct the synthetic fixture and recheck without persisting or exporting it.'),
    gate('ql146-unresolved-exception-hold', 'No unresolved synthetic exception remains',
      noUnresolvedExceptions, 'Current QL-144 and QL-145 unresolved exception IDs reconcile.',
      'Keep every unresolved exception held; a proposed fix is not a closure.'),
    gate('ql146-closure-readiness-only', 'Synthetic closure review criteria are independently satisfied',
      closureCriteriaRechecked, 'QL-145 replay must show exactly six passing criteria and no exceptions.',
      'Return to independent synthetic evidence review; no actual closure is authorized.')
  ];
  const summary = {
    passed: gates.filter(g => g.status === 'pass').length,
    blocked: gates.filter(g => g.status === 'blocked').length
  };
  const ready = sourceIntegrityVerified && summary.blocked === 0;
  return {
    build: 'QL-146', reviewedBuild: 'QL-145', sourceIntegrityVerified,
    outcome: ready ? 'ready_for_separate_synthetic_closure_review_only' :
      'evidence_recheck_or_exception_review_required',
    sourceChecks: { passed: rerunSchema.passed, blocked: rerunSchema.blocked },
    gates, summary,
    unresolvedExceptionIds: sourceIntegrityVerified ?
      correctiveDesign.exceptions.map(x => x.id) : ['ql146-source-integrity-hold'],
    closureRecorded: false, ownerApprovalCaptured: false,
    exportEnabled: false, downloadEnabled: false,
    canTransmit: false, liveCommunicationsEnabled: false,
    warning: ready ?
      'Synthetic closure-readiness review only. No exception was closed, no owner permission was granted and no production status was inferred.' :
      'Recheck/exception hold. No actual closure, owner approval, evidence storage, download, export or live communications.'
  };
}
