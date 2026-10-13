import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan } from './ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan';

export type Ql107PersistenceImplementationDraftReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  reviewFinding: string;
  requiredDisposition: string;
  noWriteBoundary: string;
};

export type Ql107SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftReview = {
  build: 'QL-107';
  title: string;
  reviewedBuild: 'QL-106';
  reviewMode: 'display_only_implementation_draft_review';
  reviewOutcome: 'ready_for_bounded_implementation_decision_planning' | 'implementation_draft_review_required';
  implementationPermission: 'not_granted';
  ledgerWriteStatus: Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan['ledgerWriteStatus'];
  candidateSchemaStatus: Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan['candidateSchemaStatus'];
  endpointImplementationStatus: Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan['endpointImplementationStatus'];
  browserWriteStatus: Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan['browserWriteStatus'];
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan['rowSummary'];
  priorDraftSummary: Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan['draftSummary'];
  reviewSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  reviewItems: readonly Ql107PersistenceImplementationDraftReviewItem[];
  reviewedLedgerSchemaDraft: readonly string[];
  reviewedWriteRouteDraft: readonly string[];
  reviewedBrowserConfirmationDraft: readonly string[];
  reviewedRetentionCleanupDraft: readonly string[];
  reviewedRollbackDisableDraft: readonly string[];
  reviewedOwnerApprovalDraft: readonly string[];
  reviewedProductionVerificationGates: readonly string[];
  nextDecisionPlanningGates: readonly string[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  retainedBoundaries: readonly string[];
  reviewWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeReviewItems(items: readonly Ql107PersistenceImplementationDraftReviewItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl107SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftReview(
  draftPlan: Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan
): Ql107SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftReview {
  const reviewedQl106 = draftPlan.build === 'QL-106';
  const draftReadyForReview =
    draftPlan.draftOutcome === 'ready_for_implementation_draft_review' &&
    draftPlan.draftSummary.blocked === 0 &&
    draftPlan.draftSummary.review === 0;
  const implementationStillLocked =
    draftPlan.implementationPermission === 'not_granted' &&
    draftPlan.ledgerWriteStatus === 'planned_not_implemented' &&
    draftPlan.candidateSchemaStatus === 'planned_not_implemented' &&
    draftPlan.endpointImplementationStatus === 'not_implemented' &&
    draftPlan.browserWriteStatus === 'disabled';
  const schemaDraftReviewable =
    draftPlan.proposedLedgerSchemaDraft.length >= 5 &&
    draftPlan.candidateLedgerFields.length >= 10 &&
    draftPlan.rejectedPrivateFields.length >= 8 &&
    draftPlan.candidateLedgerFields.every((field) => !draftPlan.rejectedPrivateFields.includes(field));
  const routeBrowserReviewable =
    draftPlan.proposedWriteRouteDraft.length >= 5 &&
    draftPlan.proposedBrowserConfirmationDraft.length >= 5;
  const lifecycleReviewable =
    draftPlan.proposedRetentionCleanupDraft.length >= 5 &&
    draftPlan.proposedRollbackDisableDraft.length >= 5 &&
    draftPlan.proposedOwnerApprovalDraft.length >= 5;
  const productionGatesReviewable =
    draftPlan.proposedProductionVerificationGates.length >= 5 &&
    draftPlan.implementationReviewGates.length >= 5;
  const runtimeStillSafeReadOnly =
    draftPlan.blockedRuntime.length >= 4 &&
    draftPlan.retainedBoundaries.length >= 5 &&
    draftPlan.rowSummary.runtimeLockouts > 0 &&
    draftPlan.rowSummary.conversationRows > 0 &&
    draftPlan.rowSummary.systemStatusRows > 0;

  const reviewItems: readonly Ql107PersistenceImplementationDraftReviewItem[] = [
    {
      id: 'ql107-review-q106-input',
      label: 'QL-106 draft plan is eligible for review',
      status: statusWhen(reviewedQl106 && draftReadyForReview),
      reviewFinding: `QL-106 outcome is ${draftPlan.draftOutcome}; ${draftPlan.draftSummary.review} review item(s) and ${draftPlan.draftSummary.blocked} blocked item(s) remain.`,
      requiredDisposition:
        'QL-107 may review the draft and decide whether the next step can plan a bounded implementation decision, but it does not grant implementation permission.',
      noWriteBoundary:
        'QL-107 does not create schema, migrations, tables, routes, browser writes, stored acceptance, Supabase mutations, or runtime behavior.'
    },
    {
      id: 'ql107-review-permission-lock',
      label: 'Implementation permission remains locked',
      status: statusWhen(implementationStillLocked),
      reviewFinding: `Permission is ${draftPlan.implementationPermission}; ledger status is ${draftPlan.ledgerWriteStatus}, endpoint status is ${draftPlan.endpointImplementationStatus}, and browser writes are ${draftPlan.browserWriteStatus}.`,
      requiredDisposition:
        'Any later decision must explicitly restate disabled-by-default behavior, owner approval, rollback, and production gates before implementation is considered.',
      noWriteBoundary:
        'The review does not add write endpoints, enable feature flags, expose buttons, store evidence, or connect providers.'
    },
    {
      id: 'ql107-review-schema-and-field-boundary',
      label: 'Schema draft and field boundary are reviewable',
      status: statusWhen(schemaDraftReviewable),
      reviewFinding: `${draftPlan.proposedLedgerSchemaDraft.length} schema draft item(s), ${draftPlan.candidateLedgerFields.length} candidate field(s), and ${draftPlan.rejectedPrivateFields.length} rejected private field(s) are present and separated.`,
      requiredDisposition:
        'The next planning step must keep rejected private fields excluded from schema, validation, UI copy, logs, archives, and audits.',
      noWriteBoundary:
        'Schema review is textual only; no database object, policy, index, RPC function, storage object, or row is created.'
    },
    {
      id: 'ql107-review-route-and-browser-draft',
      label: 'Write-route and browser confirmation drafts are reviewable',
      status: statusWhen(routeBrowserReviewable),
      reviewFinding: `${draftPlan.proposedWriteRouteDraft.length} route draft item(s) and ${draftPlan.proposedBrowserConfirmationDraft.length} browser confirmation draft item(s) are present.`,
      requiredDisposition:
        'The next planning step must require dry-run defaults, idempotency, fail-closed validation, hidden disabled browser controls, and explicit owner approval.',
      noWriteBoundary:
        'No route file, handler, submit button, local persistence, acceptance save, or browser write behavior is added.'
    },
    {
      id: 'ql107-review-lifecycle-controls',
      label: 'Retention, rollback, and owner approval drafts are reviewable',
      status: statusWhen(lifecycleReviewable),
      reviewFinding: `${draftPlan.proposedRetentionCleanupDraft.length} retention item(s), ${draftPlan.proposedRollbackDisableDraft.length} rollback item(s), and ${draftPlan.proposedOwnerApprovalDraft.length} owner approval item(s) are present.`,
      requiredDisposition:
        'The next planning step must preserve purge, emergency disable, manual owner approval, and rollback-first requirements before any implementation exists.',
      noWriteBoundary:
        'No retention job, cleanup job, purge job, rollback automation, owner-approval storage, archive write, or audit write is created.'
    },
    {
      id: 'ql107-review-production-gates-and-runtime-boundary',
      label: 'Production gates and runtime boundary are explicit',
      status: statusWhen(productionGatesReviewable && runtimeStillSafeReadOnly),
      reviewFinding: `${draftPlan.proposedProductionVerificationGates.length} production gate(s), ${draftPlan.implementationReviewGates.length} review gate(s), ${draftPlan.rowSummary.runtimeLockouts} runtime lockout statement(s), and ${draftPlan.blockedRuntime.length} blocked runtime statement(s) remain visible.`,
      requiredDisposition:
        'The next planning step must keep Phone/SMS, callbacks, providers, live reads, archives, consent, audit/admin, retention writes, AI delivery, and live pilot runtime disabled.',
      noWriteBoundary:
        'Only aggregate safe-read evidence is reviewed; no live customer/provider data is read or written.'
    }
  ];

  const reviewSummary = summarizeReviewItems(reviewItems);
  const reviewOutcome =
    reviewSummary.blocked === 0 && reviewSummary.review === 0
      ? 'ready_for_bounded_implementation_decision_planning'
      : 'implementation_draft_review_required';

  return {
    build: 'QL-107',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Draft Review',
    reviewedBuild: 'QL-106',
    reviewMode: 'display_only_implementation_draft_review',
    reviewOutcome,
    implementationPermission: 'not_granted',
    ledgerWriteStatus: draftPlan.ledgerWriteStatus,
    candidateSchemaStatus: draftPlan.candidateSchemaStatus,
    endpointImplementationStatus: draftPlan.endpointImplementationStatus,
    browserWriteStatus: draftPlan.browserWriteStatus,
    selectedBrandLabel: draftPlan.selectedBrandLabel,
    sourceLabel: draftPlan.sourceLabel,
    rowSummary: draftPlan.rowSummary,
    priorDraftSummary: draftPlan.draftSummary,
    reviewSummary,
    reviewItems,
    reviewedLedgerSchemaDraft: draftPlan.proposedLedgerSchemaDraft,
    reviewedWriteRouteDraft: draftPlan.proposedWriteRouteDraft,
    reviewedBrowserConfirmationDraft: draftPlan.proposedBrowserConfirmationDraft,
    reviewedRetentionCleanupDraft: draftPlan.proposedRetentionCleanupDraft,
    reviewedRollbackDisableDraft: draftPlan.proposedRollbackDisableDraft,
    reviewedOwnerApprovalDraft: draftPlan.proposedOwnerApprovalDraft,
    reviewedProductionVerificationGates: draftPlan.proposedProductionVerificationGates,
    nextDecisionPlanningGates: [
      'A later QL-108 decision-planning build must decide whether bounded implementation planning can proceed.',
      'Any later implementation plan must remain disabled by default and fail closed without owner approval and production gates.',
      'Any later implementation plan must preserve rejected private fields across schema, route validation, browser copy, logs, archives, and audits.',
      'Any later implementation plan must include rollback, purge, emergency disable, and manual owner approval before write code exists.',
      'QL-107 grants no persistence permission and cannot be treated as approval to implement schema, routes, browser writes, or runtime actions.'
    ],
    candidateLedgerFields: draftPlan.candidateLedgerFields,
    rejectedPrivateFields: draftPlan.rejectedPrivateFields,
    retainedBoundaries: [
      'QL-107 is a display-only draft review and does not implement persistence.',
      'QL-107 does not create schema, migrations, tables, views, policies, RPC functions, routes, storage objects, write buttons, or acceptance saves.',
      'Manual operator acceptance remains outside the disabled preview until a later reviewed implementation exists.',
      'Candidate ledger fields remain future candidates only and rejected private fields stay excluded.',
      'Future write work must start from a separate decision and implementation build; QL-107 grants no write permission.'
    ],
    reviewWarning:
      'QL-107 is a draft review only. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: draftPlan.blockedRuntime,
    nextQueuedBuild: 'QL-108 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Decision Planning',
    generatedAt: new Date().toISOString()
  };
}
