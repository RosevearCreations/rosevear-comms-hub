import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview } from './ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview';

export type Ql101PersistencePlanItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  planFinding: string;
  persistenceRequirement: string;
  noWriteBoundary: string;
};

export type Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan = {
  build: 'QL-101';
  title: string;
  plannedFromBuild: 'QL-100';
  persistenceMode: 'plan_only_no_persistence';
  persistenceOutcome: 'ready_for_persistence_plan_review' | 'persistence_plan_review_required';
  ledgerWriteStatus: 'planned_not_implemented';
  candidateSchemaStatus: 'not_implemented';
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview['rowSummary'];
  reviewSummary: Ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview['reviewSummary'];
  persistenceSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  persistenceItems: readonly Ql101PersistencePlanItem[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  persistencePlanSteps: readonly string[];
  requiredFutureReviewChecks: readonly string[];
  rollbackPlanRequirements: readonly string[];
  retainedBoundaries: readonly string[];
  planWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizePersistenceItems(items: readonly Ql101PersistencePlanItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan(
  resolutionReview: Ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview
): Ql101SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlan {
  const reviewedQ100 = resolutionReview.build === 'QL-100';
  const ql100ReadyForPlan = resolutionReview.reviewOutcome === 'ready_for_persistence_plan';
  const ql100HasNoOpenItems = resolutionReview.reviewSummary.blocked === 0 && resolutionReview.reviewSummary.review === 0;
  const candidateFieldsRemainBounded =
    resolutionReview.approvedProofFields.length >= 10 &&
    resolutionReview.approvedProofFields.every((field) => !resolutionReview.rejectedPrivateFields.includes(field));
  const rejectedFieldsRemainExplicit = resolutionReview.rejectedPrivateFields.length >= 8;
  const hasSafeReadEvidence = resolutionReview.rowSummary.conversationRows > 0 && resolutionReview.rowSummary.systemStatusRows > 0;
  const hasDeferredGate = resolutionReview.deferredWriteRequirements.length >= 4;
  const hasRuntimeLockouts = resolutionReview.blockedRuntime.length >= 4 && resolutionReview.retainedBoundaries.length >= 4;

  const persistenceItems: readonly Ql101PersistencePlanItem[] = [
    {
      id: 'ql101-plan-from-resolution-review',
      label: 'Plan starts from the QL-100 resolution review',
      status: statusWhen(reviewedQ100 && ql100ReadyForPlan && ql100HasNoOpenItems),
      planFinding: `QL-100 outcome is ${resolutionReview.reviewOutcome}; ${resolutionReview.reviewSummary.review} review item(s) and ${resolutionReview.reviewSummary.blocked} blocked item(s) remain.`,
      persistenceRequirement:
        'Use QL-101 only to plan the future persistence shape after QL-100 confirms the resolution review is ready.',
      noWriteBoundary:
        'QL-101 does not create database schema, write rows, add browser submit handlers, or store operator acceptance.'
    },
    {
      id: 'ql101-plan-candidate-field-set',
      label: 'Candidate ledger fields remain bounded',
      status: statusWhen(candidateFieldsRemainBounded && rejectedFieldsRemainExplicit),
      planFinding: `${resolutionReview.approvedProofFields.length} candidate proof field(s) remain separated from ${resolutionReview.rejectedPrivateFields.length} rejected private field(s).`,
      persistenceRequirement:
        'Treat the approved QL-100 proof fields as the maximum candidate ledger field set for a later reviewed implementation.',
      noWriteBoundary:
        'Field planning is declarative only; no Supabase migration, table, RPC, insert, update, delete, or storage upload is added.'
    },
    {
      id: 'ql101-plan-safe-read-evidence-scope',
      label: 'Safe-read evidence is limited to aggregate proof',
      status: statusWhen(hasSafeReadEvidence),
      planFinding: `${resolutionReview.rowSummary.conversationRows} conversation row(s), ${resolutionReview.rowSummary.systemStatusRows} system status row(s), ${resolutionReview.rowSummary.rejectedRows} rejected diagnostic(s), and ${resolutionReview.rowSummary.runtimeLockouts} runtime lockout statement(s) remain visible.`,
      persistenceRequirement:
        'Plan any later persistence around source labels, aggregate counts, bounded checkpoint summaries, and manual references rather than raw row copies.',
      noWriteBoundary:
        'QL-101 does not perform additional live reads, copy raw rows, persist count evidence, or inspect private values.'
    },
    {
      id: 'ql101-plan-review-and-rollback-gates',
      label: 'Future review, rollback, and owner gates are required',
      status: statusWhen(hasDeferredGate),
      planFinding: `${resolutionReview.deferredWriteRequirements.length} deferred write requirement(s) remain attached to the prior review.`,
      persistenceRequirement:
        'Require a separate persistence review before implementation, with rollback steps, owner sign-off, retention limits, and no private payload fields.',
      noWriteBoundary:
        'No implementation gate is opened by this plan; any write route must be proposed, reviewed, and promoted in a later build.'
    },
    {
      id: 'ql101-plan-runtime-lockout-retention',
      label: 'Runtime lockouts remain retained during persistence planning',
      status: statusWhen(hasRuntimeLockouts),
      planFinding: `${resolutionReview.retainedBoundaries.length} retained boundary statement(s) and ${resolutionReview.blockedRuntime.length} blocked runtime statement(s) remain present.`,
      persistenceRequirement:
        'Keep Phone/SMS, callbacks, live reads, provider delivery, archives, consent, audit/admin/retention writes, AI send/generation, and live pilot runtime disabled.',
      noWriteBoundary:
        'QL-101 is a plan-only checkpoint and cannot be used as operator approval to activate runtime or persistence.'
    }
  ];

  const persistenceSummary = summarizePersistenceItems(persistenceItems);
  const persistenceOutcome =
    persistenceSummary.blocked === 0 && persistenceSummary.review === 0
      ? 'ready_for_persistence_plan_review'
      : 'persistence_plan_review_required';

  return {
    build: 'QL-101',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan',
    plannedFromBuild: 'QL-100',
    persistenceMode: 'plan_only_no_persistence',
    persistenceOutcome,
    ledgerWriteStatus: 'planned_not_implemented',
    candidateSchemaStatus: 'not_implemented',
    selectedBrandLabel: resolutionReview.selectedBrandLabel,
    sourceLabel: resolutionReview.sourceLabel,
    rowSummary: resolutionReview.rowSummary,
    reviewSummary: resolutionReview.reviewSummary,
    persistenceSummary,
    persistenceItems,
    candidateLedgerFields: resolutionReview.approvedProofFields,
    rejectedPrivateFields: resolutionReview.rejectedPrivateFields,
    persistencePlanSteps: [
      'Keep QL-101 plan-only with no schema, no endpoint, and no browser write path.',
      'Carry forward only the bounded QL-100 candidate proof field list.',
      'Keep rejected private fields outside any proposed ledger shape.',
      'Define future implementation as a separate reviewed build with migration, rollback, owner, and retention details.',
      'Require production checks and manual operator review before any future persistence implementation.'
    ],
    requiredFutureReviewChecks: [
      'Review exact Supabase table or view shape before any migration exists.',
      'Review insert/update/delete/RPC/storage routes before any endpoint exists.',
      'Review browser submit and acceptance flows before any UI write action exists.',
      'Review rollback, cleanup, retention, and owner sign-off before implementation.',
      'Review disabled runtime boundaries after implementation planning and before promotion.'
    ],
    rollbackPlanRequirements: [
      'Document how to remove any future ledger table or migration safely.',
      'Document how to disable any future write endpoint without affecting safe reads.',
      'Document how to purge accidentally persisted disallowed fields.',
      'Document how to revert public disabled preview UI to read-only evidence display.',
      'Document who must approve restoration after rollback.'
    ],
    retainedBoundaries: [
      'QL-101 plans persistence only and does not implement persistence.',
      'Manual operator acceptance remains outside the preview until a later reviewed implementation exists.',
      'Candidate ledger fields remain future candidates only.',
      'Rejected private fields remain excluded from public disabled preview evidence and from any future bounded ledger.',
      'Future write work must start from a new review build and must not inherit write permission from QL-101.'
    ],
    planWarning:
      'QL-101 is a persistence plan only. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: resolutionReview.blockedRuntime,
    nextQueuedBuild: 'QL-102 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan Review',
    generatedAt: new Date().toISOString()
  };
}
