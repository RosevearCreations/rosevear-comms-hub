import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview } from './ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview';

export type Ql105PersistenceImplementationReadinessDecisionItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  decisionFinding: string;
  readinessDecision: string;
  noWriteBoundary: string;
};

export type Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision = {
  build: 'QL-105';
  title: string;
  decidedFromBuild: 'QL-104';
  decisionMode: 'display_only_readiness_decision';
  readinessDecision: 'ready_to_draft_persistence_implementation_under_new_review' | 'hold_for_review_gaps';
  implementationPermission: 'not_granted';
  ledgerWriteStatus: Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview['ledgerWriteStatus'];
  candidateSchemaStatus: Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview['candidateSchemaStatus'];
  endpointImplementationStatus: Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview['endpointImplementationStatus'];
  browserWriteStatus: Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview['browserWriteStatus'];
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview['rowSummary'];
  priorReviewSummary: Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview['reviewSummary'];
  decisionSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  decisionItems: readonly Ql105PersistenceImplementationReadinessDecisionItem[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  reviewedReadinessDecisionGates: readonly string[];
  requiredImplementationDraftGates: readonly string[];
  nonNegotiableImplementationBoundaries: readonly string[];
  retainedBoundaries: readonly string[];
  decisionWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeDecisionItems(items: readonly Ql105PersistenceImplementationReadinessDecisionItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision(
  implementationReview: Ql104SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlanReview
): Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision {
  const reviewedQ104 = implementationReview.build === 'QL-104';
  const reviewReadyForDecision =
    implementationReview.reviewOutcome === 'ready_for_persistence_implementation_readiness_decision' &&
    implementationReview.reviewSummary.blocked === 0 &&
    implementationReview.reviewSummary.review === 0;
  const stillNoImplementationPermission =
    implementationReview.ledgerWriteStatus === 'planned_not_implemented' &&
    implementationReview.candidateSchemaStatus === 'planned_not_implemented' &&
    implementationReview.endpointImplementationStatus === 'not_implemented' &&
    implementationReview.browserWriteStatus === 'disabled';
  const fieldBoundaryStillSafe =
    implementationReview.candidateLedgerFields.length >= 10 &&
    implementationReview.rejectedPrivateFields.length >= 8 &&
    implementationReview.candidateLedgerFields.every((field) => !implementationReview.rejectedPrivateFields.includes(field));
  const allImplementationAreasReviewed =
    implementationReview.reviewedSchemaDraftPlan.length >= 5 &&
    implementationReview.reviewedWriteRoutePlan.length >= 5 &&
    implementationReview.reviewedBrowserAcceptancePlan.length >= 5 &&
    implementationReview.reviewedRetentionAndCleanupPlan.length >= 5 &&
    implementationReview.reviewedRollbackAndDisablePlan.length >= 5 &&
    implementationReview.reviewedOwnerApprovalPlan.length >= 5;
  const nextDraftGatesExplicit = implementationReview.implementationReadinessDecisionGates.length >= 5;
  const runtimeStillDisabled =
    implementationReview.blockedRuntime.length >= 4 &&
    implementationReview.retainedBoundaries.length >= 5 &&
    implementationReview.rowSummary.runtimeLockouts > 0;
  const aggregateSafeReadEvidenceVisible =
    implementationReview.rowSummary.conversationRows > 0 && implementationReview.rowSummary.systemStatusRows > 0;

  const decisionItems: readonly Ql105PersistenceImplementationReadinessDecisionItem[] = [
    {
      id: 'ql105-decision-review-ready',
      label: 'QL-104 review is ready for a readiness decision',
      status: statusWhen(reviewedQ104 && reviewReadyForDecision),
      decisionFinding: `QL-104 outcome is ${implementationReview.reviewOutcome}; ${implementationReview.reviewSummary.review} review item(s) and ${implementationReview.reviewSummary.blocked} blocked item(s) remain.`,
      readinessDecision:
        'QL-105 may decide whether a later implementation draft plan can be prepared, but it does not grant implementation permission.',
      noWriteBoundary:
        'QL-105 does not create schema, migrations, tables, routes, browser write controls, stored acceptance, or data persistence.'
    },
    {
      id: 'ql105-decision-no-implementation-permission',
      label: 'No implementation permission is inherited',
      status: statusWhen(stillNoImplementationPermission),
      decisionFinding: `Ledger status is ${implementationReview.ledgerWriteStatus}, schema status is ${implementationReview.candidateSchemaStatus}, endpoint status is ${implementationReview.endpointImplementationStatus}, and browser writes are ${implementationReview.browserWriteStatus}.`,
      readinessDecision:
        'The decision can allow drafting a later reviewed implementation plan only; it cannot activate persistence or runtime behavior.',
      noWriteBoundary:
        'No Supabase insert/update/delete, RPC, storage write, local persistence, provider call, Phone/SMS action, callback, archive, audit, retention, or AI delivery path is added.'
    },
    {
      id: 'ql105-decision-field-boundary',
      label: 'Candidate ledger fields stay bounded and private fields stay rejected',
      status: statusWhen(fieldBoundaryStillSafe),
      decisionFinding: `${implementationReview.candidateLedgerFields.length} candidate field(s) and ${implementationReview.rejectedPrivateFields.length} rejected private field(s) remain separated.`,
      readinessDecision:
        'A later draft plan may reference bounded proof fields only and must preserve private/raw customer, provider, message, recording, archive, and audit exclusions.',
      noWriteBoundary:
        'Field readiness is declarative only; no database object, table row, storage object, payload, or acceptance evidence is stored.'
    },
    {
      id: 'ql105-decision-implementation-areas-reviewed',
      label: 'Implementation areas have review coverage',
      status: statusWhen(allImplementationAreasReviewed),
      decisionFinding: 'Schema, write-route, browser-acceptance, retention/cleanup, rollback/disable, and owner-approval plan areas are all represented in the QL-104 review.',
      readinessDecision:
        'A later build may draft a detailed implementation plan only if it restates all reviewed areas with exact disabled-by-default controls.',
      noWriteBoundary:
        'QL-105 does not add a route, handler, confirmation flow, retention job, cleanup job, purge job, admin control, migration, or rollback automation.'
    },
    {
      id: 'ql105-decision-future-draft-gates',
      label: 'Future implementation draft gates are explicit',
      status: statusWhen(nextDraftGatesExplicit),
      decisionFinding: `${implementationReview.implementationReadinessDecisionGates.length} readiness-decision gate(s) are documented for a later implementation draft.`,
      readinessDecision:
        'The next acceptable step is a display-only implementation draft plan with schema, route, validation, browser, retention, rollback, owner, and production-check requirements.',
      noWriteBoundary:
        'A later draft plan still must not implement persistence unless a separate implementation build is explicitly requested and promoted.'
    },
    {
      id: 'ql105-decision-runtime-safe-read-boundary',
      label: 'Runtime lockouts and safe-read evidence remain visible',
      status: statusWhen(runtimeStillDisabled && aggregateSafeReadEvidenceVisible),
      decisionFinding: `${implementationReview.rowSummary.conversationRows} conversation row(s), ${implementationReview.rowSummary.systemStatusRows} system status row(s), ${implementationReview.rowSummary.runtimeLockouts} runtime lockout statement(s), and ${implementationReview.blockedRuntime.length} blocked runtime statement(s) remain visible.`,
      readinessDecision:
        'The disabled preview remains safe-read only while showing enough aggregate evidence for operator review and future planning.',
      noWriteBoundary:
        'Phone/SMS, callbacks, live reads, provider delivery, archives, consent, audit/admin, retention writes, AI generation/send, and live pilot runtime stay disabled.'
    }
  ];

  const decisionSummary = summarizeDecisionItems(decisionItems);
  const readinessDecision =
    decisionSummary.blocked === 0 && decisionSummary.review === 0
      ? 'ready_to_draft_persistence_implementation_under_new_review'
      : 'hold_for_review_gaps';

  return {
    build: 'QL-105',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Readiness Decision',
    decidedFromBuild: 'QL-104',
    decisionMode: 'display_only_readiness_decision',
    readinessDecision,
    implementationPermission: 'not_granted',
    ledgerWriteStatus: implementationReview.ledgerWriteStatus,
    candidateSchemaStatus: implementationReview.candidateSchemaStatus,
    endpointImplementationStatus: implementationReview.endpointImplementationStatus,
    browserWriteStatus: implementationReview.browserWriteStatus,
    selectedBrandLabel: implementationReview.selectedBrandLabel,
    sourceLabel: implementationReview.sourceLabel,
    rowSummary: implementationReview.rowSummary,
    priorReviewSummary: implementationReview.reviewSummary,
    decisionSummary,
    decisionItems,
    candidateLedgerFields: implementationReview.candidateLedgerFields,
    rejectedPrivateFields: implementationReview.rejectedPrivateFields,
    reviewedReadinessDecisionGates: implementationReview.implementationReadinessDecisionGates,
    requiredImplementationDraftGates: [
      'Draft the exact proposed ledger schema as text before any migration exists.',
      'Draft the exact disabled-by-default write route, validation contract, idempotency key, and rejection behavior before any route exists.',
      'Draft the browser confirmation flow as display-only copy before any submit action, local persistence, or acceptance save exists.',
      'Draft retention, cleanup, purge, rollback, and emergency disable procedures before any write path exists.',
      'Draft owner approval and production verification requirements before any implementation build can be promoted.'
    ],
    nonNegotiableImplementationBoundaries: [
      'The next draft must not implement schema, migrations, tables, views, indexes, policies, RPC functions, routes, browser writes, or stored acceptance.',
      'Rejected private fields must remain excluded from schema, route validation, UI copy, logs, archives, and audits.',
      'Phone/SMS, callbacks, provider delivery, live reads, archives, consent, audit/admin writes, retention writes, AI generation/send, and live pilot runtime must remain disabled.',
      'Any later implementation must be disabled by default and require explicit owner approval plus production checks on main.',
      'QL-105 does not authorize implementation; it authorizes only a later draft plan under review.'
    ],
    retainedBoundaries: [
      'QL-105 is a display-only readiness decision and does not implement persistence.',
      'QL-105 does not create schema, migrations, tables, views, policies, RPC functions, routes, storage objects, write buttons, or acceptance saves.',
      'Manual operator acceptance remains outside the disabled preview until a later reviewed implementation exists.',
      'Candidate ledger fields remain future candidates only and rejected private fields stay excluded.',
      'Future write work must start from a new draft and implementation build; QL-105 grants no write permission.'
    ],
    decisionWarning:
      'QL-105 is a readiness decision only. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: implementationReview.blockedRuntime,
    nextQueuedBuild: 'QL-106 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Draft Plan',
    generatedAt: new Date().toISOString()
  };
}
