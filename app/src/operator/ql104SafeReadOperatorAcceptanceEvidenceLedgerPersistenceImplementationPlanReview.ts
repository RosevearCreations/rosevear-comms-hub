import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan } from './ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan';

export type Ql104PersistenceImplementationPlanReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  reviewFinding: string;
  requiredDecision: string;
  noWriteBoundary: string;
};

export type Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview = {
  build: 'QL-104';
  title: string;
  reviewedBuild: 'QL-103';
  reviewMode: 'display_only_implementation_plan_review';
  reviewOutcome: 'ready_for_persistence_implementation_readiness_decision' | 'implementation_plan_review_required';
  ledgerWriteStatus: Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan['ledgerWriteStatus'];
  candidateSchemaStatus: Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan['candidateSchemaStatus'];
  endpointImplementationStatus: Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan['endpointImplementationStatus'];
  browserWriteStatus: Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan['browserWriteStatus'];
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan['rowSummary'];
  priorImplementationSummary: Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan['implementationSummary'];
  reviewSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  reviewItems: readonly Ql104PersistenceImplementationPlanReviewItem[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  reviewedSchemaDraftPlan: readonly string[];
  reviewedWriteRoutePlan: readonly string[];
  reviewedBrowserAcceptancePlan: readonly string[];
  reviewedRetentionAndCleanupPlan: readonly string[];
  reviewedRollbackAndDisablePlan: readonly string[];
  reviewedOwnerApprovalPlan: readonly string[];
  implementationReadinessDecisionGates: readonly string[];
  retainedBoundaries: readonly string[];
  reviewWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeReviewItems(items: readonly Ql104PersistenceImplementationPlanReviewItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview(
  implementationPlan: Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan
): Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview {
  const reviewedQ103 = implementationPlan.build === 'QL-103';
  const implementationPlanReady =
    implementationPlan.implementationPlanOutcome === 'ready_for_persistence_implementation_plan_review' &&
    implementationPlan.implementationSummary.blocked === 0 &&
    implementationPlan.implementationSummary.review === 0;
  const stillNonPersistent =
    implementationPlan.implementationPlanMode === 'plan_only_no_implementation' &&
    implementationPlan.ledgerWriteStatus === 'planned_not_implemented' &&
    implementationPlan.candidateSchemaStatus === 'planned_not_implemented' &&
    implementationPlan.endpointImplementationStatus === 'not_implemented' &&
    implementationPlan.browserWriteStatus === 'disabled';
  const schemaAndFieldsReviewable =
    implementationPlan.schemaDraftPlan.length >= 5 &&
    implementationPlan.candidateLedgerFields.length >= 10 &&
    implementationPlan.rejectedPrivateFields.length >= 8 &&
    implementationPlan.candidateLedgerFields.every((field) => !implementationPlan.rejectedPrivateFields.includes(field));
  const routeAndBrowserRemainFuture =
    implementationPlan.writeRoutePlan.length >= 5 &&
    implementationPlan.browserAcceptancePlan.length >= 5 &&
    implementationPlan.implementationReviewChecklist.length >= 5;
  const retentionRollbackOwnerReady =
    implementationPlan.retentionAndCleanupPlan.length >= 5 &&
    implementationPlan.rollbackAndDisablePlan.length >= 5 &&
    implementationPlan.ownerApprovalPlan.length >= 5;
  const runtimeAndSafeReadEvidenceRetained =
    implementationPlan.blockedRuntime.length >= 4 &&
    implementationPlan.retainedBoundaries.length >= 5 &&
    implementationPlan.rowSummary.conversationRows > 0 &&
    implementationPlan.rowSummary.systemStatusRows > 0 &&
    implementationPlan.rowSummary.runtimeLockouts > 0;

  const reviewItems: readonly Ql104PersistenceImplementationPlanReviewItem[] = [
    {
      id: 'ql104-review-q103-plan-readiness',
      label: 'QL-103 implementation plan is ready to review',
      status: statusWhen(reviewedQ103 && implementationPlanReady),
      reviewFinding: `QL-103 outcome is ${implementationPlan.implementationPlanOutcome}; ${implementationPlan.implementationSummary.review} review item(s) and ${implementationPlan.implementationSummary.blocked} blocked item(s) remain.`,
      requiredDecision:
        'Confirm QL-103 only planned the implementation sequence and that QL-104 may review the plan without granting write permission.',
      noWriteBoundary:
        'QL-104 reviews QL-103 only; it does not create schema, migrations, tables, write routes, browser submit handlers, or stored acceptance.'
    },
    {
      id: 'ql104-review-no-persistence-status',
      label: 'Implementation remains non-persistent',
      status: statusWhen(stillNonPersistent),
      reviewFinding: `Plan mode is ${implementationPlan.implementationPlanMode}, ledger status is ${implementationPlan.ledgerWriteStatus}, endpoint status is ${implementationPlan.endpointImplementationStatus}, and browser writes are ${implementationPlan.browserWriteStatus}.`,
      requiredDecision:
        'Confirm QL-103 introduced no persistent ledger implementation and QL-104 keeps the disabled preview review-only.',
      noWriteBoundary:
        'No Supabase mutation, RPC call, storage write, local persistence, provider call, Phone/SMS action, callback, archive, audit, retention, or AI delivery path is added.'
    },
    {
      id: 'ql104-review-schema-and-field-boundary',
      label: 'Schema draft and field boundary are reviewable',
      status: statusWhen(schemaAndFieldsReviewable),
      reviewFinding: `${implementationPlan.schemaDraftPlan.length} schema draft step(s), ${implementationPlan.candidateLedgerFields.length} candidate field(s), and ${implementationPlan.rejectedPrivateFields.length} rejected private field(s) are documented.`,
      requiredDecision:
        'Confirm any later implementation may only use bounded proof fields and must continue rejecting private/raw customer, provider, message, archive, recording, and audit payload fields.',
      noWriteBoundary:
        'The schema remains declarative text only; no migration, table, view, index, policy, RPC function, or data object is created.'
    },
    {
      id: 'ql104-review-write-route-browser-and-review-gates',
      label: 'Write route, browser flow, and review gates stay future-only',
      status: statusWhen(routeAndBrowserRemainFuture),
      reviewFinding: `${implementationPlan.writeRoutePlan.length} write-route step(s), ${implementationPlan.browserAcceptancePlan.length} browser step(s), and ${implementationPlan.implementationReviewChecklist.length} review checklist item(s) are documented.`,
      requiredDecision:
        'Confirm a later build must separately propose the exact write route, idempotency, browser confirmation, disabled-state guard, and production check requirements.',
      noWriteBoundary:
        'QL-104 does not add a route, action, button, form, confirmation save, idempotency store, operator acceptance record, or provider delivery.'
    },
    {
      id: 'ql104-review-retention-rollback-owner',
      label: 'Retention, cleanup, rollback, disable, and owner gates are explicit',
      status: statusWhen(retentionRollbackOwnerReady),
      reviewFinding: `${implementationPlan.retentionAndCleanupPlan.length} retention/cleanup step(s), ${implementationPlan.rollbackAndDisablePlan.length} rollback/disable step(s), and ${implementationPlan.ownerApprovalPlan.length} owner approval step(s) are documented.`,
      requiredDecision:
        'Confirm no later implementation can proceed without retention duration, cleanup, purge, emergency disable, schema rollback, and operator owner sign-off.',
      noWriteBoundary:
        'QL-104 does not add retention jobs, cleanup jobs, purge jobs, admin write controls, background tasks, or rollback automation.'
    },
    {
      id: 'ql104-review-runtime-boundary',
      label: 'Runtime lockouts and aggregate safe-read evidence remain visible',
      status: statusWhen(runtimeAndSafeReadEvidenceRetained),
      reviewFinding: `${implementationPlan.rowSummary.conversationRows} conversation row(s), ${implementationPlan.rowSummary.systemStatusRows} system status row(s), ${implementationPlan.rowSummary.runtimeLockouts} runtime lockout statement(s), and ${implementationPlan.blockedRuntime.length} blocked runtime statement(s) remain visible.`,
      requiredDecision:
        'Confirm the public disabled preview remains safe-read only while showing enough aggregate evidence for operator review.',
      noWriteBoundary:
        'Phone/SMS, callbacks, live reads, provider delivery, archives, consent, audit/admin, retention writes, AI generation/send, and live pilot runtime stay disabled.'
    }
  ];

  const reviewSummary = summarizeReviewItems(reviewItems);
  const reviewOutcome =
    reviewSummary.blocked === 0 && reviewSummary.review === 0
      ? 'ready_for_persistence_implementation_readiness_decision'
      : 'implementation_plan_review_required';

  return {
    build: 'QL-104',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan Review',
    reviewedBuild: 'QL-103',
    reviewMode: 'display_only_implementation_plan_review',
    reviewOutcome,
    ledgerWriteStatus: implementationPlan.ledgerWriteStatus,
    candidateSchemaStatus: implementationPlan.candidateSchemaStatus,
    endpointImplementationStatus: implementationPlan.endpointImplementationStatus,
    browserWriteStatus: implementationPlan.browserWriteStatus,
    selectedBrandLabel: implementationPlan.selectedBrandLabel,
    sourceLabel: implementationPlan.sourceLabel,
    rowSummary: implementationPlan.rowSummary,
    priorImplementationSummary: implementationPlan.implementationSummary,
    reviewSummary,
    reviewItems,
    candidateLedgerFields: implementationPlan.candidateLedgerFields,
    rejectedPrivateFields: implementationPlan.rejectedPrivateFields,
    reviewedSchemaDraftPlan: implementationPlan.schemaDraftPlan,
    reviewedWriteRoutePlan: implementationPlan.writeRoutePlan,
    reviewedBrowserAcceptancePlan: implementationPlan.browserAcceptancePlan,
    reviewedRetentionAndCleanupPlan: implementationPlan.retentionAndCleanupPlan,
    reviewedRollbackAndDisablePlan: implementationPlan.rollbackAndDisablePlan,
    reviewedOwnerApprovalPlan: implementationPlan.ownerApprovalPlan,
    implementationReadinessDecisionGates: [
      'A later decision build must explicitly decide whether implementation can be drafted.',
      'A later implementation build must restate exact schema, route, validation, browser flow, retention, rollback, and owner approval.',
      'A later implementation build must keep Phone/SMS, provider callbacks, archives, consent, audit/admin, AI, and live pilot runtime disabled unless separately approved.',
      'A later implementation build must include rollback and purge instructions before any write path is merged.',
      'A later implementation build must pass app-build, Pages build/deploy, Supabase Preview, and Cloudflare Workers checks on main before any production status is accepted.'
    ],
    retainedBoundaries: [
      'QL-104 reviews the QL-103 implementation plan only and does not implement persistence.',
      'QL-104 does not create schema, migrations, tables, views, policies, RPC functions, routes, storage objects, write buttons, or acceptance saves.',
      'Manual operator acceptance remains outside the disabled preview until a later reviewed implementation exists.',
      'Candidate ledger fields remain future candidates only and rejected private fields stay excluded.',
      'Future write work must start from a new decision and implementation build; QL-104 grants no write permission.'
    ],
    reviewWarning:
      'QL-104 is a display-only implementation-plan review. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: implementationPlan.blockedRuntime,
    nextQueuedBuild: 'QL-105 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Readiness Decision',
    generatedAt: new Date().toISOString()
  };
}
