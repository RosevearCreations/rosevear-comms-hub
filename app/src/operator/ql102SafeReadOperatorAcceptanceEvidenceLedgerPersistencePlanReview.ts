import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan } from './ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan';

export type Ql102PersistencePlanReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  reviewFinding: string;
  requiredDecision: string;
  noWriteBoundary: string;
};

export type Ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview = {
  build: 'QL-102';
  title: string;
  reviewedBuild: 'QL-101';
  reviewMode: 'display_only_persistence_plan_review';
  reviewOutcome: 'ready_for_persistence_implementation_plan' | 'persistence_plan_review_required';
  ledgerWriteStatus: Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan['ledgerWriteStatus'];
  candidateSchemaStatus: Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan['candidateSchemaStatus'];
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan['rowSummary'];
  planSummary: Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan['persistenceSummary'];
  reviewSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  reviewItems: readonly Ql102PersistencePlanReviewItem[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  reviewedPlanSteps: readonly string[];
  requiredFutureReviewChecks: readonly string[];
  rollbackPlanRequirements: readonly string[];
  implementationReadinessGates: readonly string[];
  retainedBoundaries: readonly string[];
  reviewWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeReviewItems(items: readonly Ql102PersistencePlanReviewItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview(
  persistencePlan: Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan
): Ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview {
  const reviewedQ101 = persistencePlan.build === 'QL-101';
  const planOnlyNoPersistence =
    persistencePlan.persistenceMode === 'plan_only_no_persistence' &&
    persistencePlan.ledgerWriteStatus === 'planned_not_implemented' &&
    persistencePlan.candidateSchemaStatus === 'not_implemented';
  const planHasNoOpenItems = persistencePlan.persistenceSummary.blocked === 0 && persistencePlan.persistenceSummary.review === 0;
  const fieldBoundaryIsReviewable =
    persistencePlan.candidateLedgerFields.length >= 10 &&
    persistencePlan.rejectedPrivateFields.length >= 8 &&
    persistencePlan.candidateLedgerFields.every((field) => !persistencePlan.rejectedPrivateFields.includes(field));
  const futureReviewIsExplicit =
    persistencePlan.requiredFutureReviewChecks.length >= 5 && persistencePlan.persistencePlanSteps.length >= 5;
  const rollbackIsExplicit = persistencePlan.rollbackPlanRequirements.length >= 5;
  const runtimeLockoutIsRetained = persistencePlan.blockedRuntime.length >= 4 && persistencePlan.retainedBoundaries.length >= 5;
  const aggregateEvidenceRemainsVisible =
    persistencePlan.rowSummary.conversationRows > 0 &&
    persistencePlan.rowSummary.systemStatusRows > 0 &&
    persistencePlan.rowSummary.runtimeLockouts > 0;

  const reviewItems: readonly Ql102PersistencePlanReviewItem[] = [
    {
      id: 'ql102-review-plan-only-status',
      label: 'QL-101 remains plan-only and non-persistent',
      status: statusWhen(reviewedQ101 && planOnlyNoPersistence),
      reviewFinding: `QL-101 mode is ${persistencePlan.persistenceMode}, write status is ${persistencePlan.ledgerWriteStatus}, and candidate schema status is ${persistencePlan.candidateSchemaStatus}.`,
      requiredDecision:
        'Confirm QL-101 only planned the persistence boundary and did not create schema, tables, RPC functions, endpoints, browser saves, or storage writes.',
      noWriteBoundary:
        'QL-102 reviews the QL-101 plan only; it does not create a ledger or grant implementation permission.'
    },
    {
      id: 'ql102-review-plan-items-closed',
      label: 'Persistence-plan items are closed enough for the next plan',
      status: statusWhen(planHasNoOpenItems),
      reviewFinding: `${persistencePlan.persistenceSummary.passed} plan item(s) passed, ${persistencePlan.persistenceSummary.review} need review, and ${persistencePlan.persistenceSummary.blocked} are blocked.`,
      requiredDecision:
        'Confirm any later implementation planning must still be a separate build with its own review and production gates.',
      noWriteBoundary:
        'A ready review outcome does not activate Supabase mutations, UI submit handlers, provider calls, or runtime delivery.'
    },
    {
      id: 'ql102-review-field-boundary',
      label: 'Candidate fields stay bounded and private fields stay rejected',
      status: statusWhen(fieldBoundaryIsReviewable),
      reviewFinding: `${persistencePlan.candidateLedgerFields.length} candidate ledger field(s) and ${persistencePlan.rejectedPrivateFields.length} rejected private field(s) remain separated.`,
      requiredDecision:
        'Confirm future persistence may only consider the bounded candidate field list and must keep rejected private fields excluded.',
      noWriteBoundary:
        'No raw customer/contact/provider payloads, raw rejected rows, message bodies, recordings, SMS/MMS content, archive payloads, or audit payloads are stored.'
    },
    {
      id: 'ql102-review-future-checks-and-rollback',
      label: 'Future review and rollback gates are explicit',
      status: statusWhen(futureReviewIsExplicit && rollbackIsExplicit),
      reviewFinding: `${persistencePlan.requiredFutureReviewChecks.length} future review check(s), ${persistencePlan.persistencePlanSteps.length} plan step(s), and ${persistencePlan.rollbackPlanRequirements.length} rollback requirement(s) are documented.`,
      requiredDecision:
        'Confirm no future persistence implementation can proceed without reviewed schema, rollback, cleanup, retention, and owner sign-off.',
      noWriteBoundary:
        'QL-102 does not add migrations, write endpoints, cleanup jobs, retention jobs, browser submit buttons, or operator acceptance storage.'
    },
    {
      id: 'ql102-review-runtime-lockouts',
      label: 'Runtime lockouts and aggregate safe-read evidence remain visible',
      status: statusWhen(runtimeLockoutIsRetained && aggregateEvidenceRemainsVisible),
      reviewFinding: `${persistencePlan.rowSummary.conversationRows} conversation row(s), ${persistencePlan.rowSummary.systemStatusRows} system status row(s), ${persistencePlan.rowSummary.runtimeLockouts} runtime lockout statement(s), and ${persistencePlan.blockedRuntime.length} blocked runtime statement(s) remain visible.`,
      requiredDecision:
        'Confirm the public disabled preview stays safe-read only while showing enough aggregate evidence for manual operator review.',
      noWriteBoundary:
        'Phone/SMS, callbacks, live reads, provider delivery, archives, consent, audit/admin/retention writes, AI generation/send, and live pilot runtime stay disabled.'
    }
  ];

  const reviewSummary = summarizeReviewItems(reviewItems);
  const reviewOutcome =
    reviewSummary.blocked === 0 && reviewSummary.review === 0
      ? 'ready_for_persistence_implementation_plan'
      : 'persistence_plan_review_required';

  return {
    build: 'QL-102',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan Review',
    reviewedBuild: 'QL-101',
    reviewMode: 'display_only_persistence_plan_review',
    reviewOutcome,
    ledgerWriteStatus: persistencePlan.ledgerWriteStatus,
    candidateSchemaStatus: persistencePlan.candidateSchemaStatus,
    selectedBrandLabel: persistencePlan.selectedBrandLabel,
    sourceLabel: persistencePlan.sourceLabel,
    rowSummary: persistencePlan.rowSummary,
    planSummary: persistencePlan.persistenceSummary,
    reviewSummary,
    reviewItems,
    candidateLedgerFields: persistencePlan.candidateLedgerFields,
    rejectedPrivateFields: persistencePlan.rejectedPrivateFields,
    reviewedPlanSteps: persistencePlan.persistencePlanSteps,
    requiredFutureReviewChecks: persistencePlan.requiredFutureReviewChecks,
    rollbackPlanRequirements: persistencePlan.rollbackPlanRequirements,
    implementationReadinessGates: [
      'A later build must restate the exact schema before any migration exists.',
      'A later build must restate write endpoints before any route exists.',
      'A later build must restate browser acceptance flow before any submit action exists.',
      'A later build must restate retention, cleanup, and rollback before any write path exists.',
      'A later build must pass production checks before any reviewed implementation can be considered.'
    ],
    retainedBoundaries: [
      'QL-102 reviews the persistence plan only and does not implement persistence.',
      'QL-102 does not create schema, tables, views, RPC functions, routes, storage objects, or browser write actions.',
      'Manual operator acceptance remains outside the disabled preview until a later reviewed implementation exists.',
      'Candidate ledger fields remain future candidates only and rejected private fields stay excluded.',
      'Future write work must start from a new plan and review build; QL-102 grants no write permission.'
    ],
    reviewWarning:
      'QL-102 is a display-only persistence-plan review. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: persistencePlan.blockedRuntime,
    nextQueuedBuild: 'QL-103 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan',
    generatedAt: new Date().toISOString()
  };
}
