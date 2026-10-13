import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision } from './ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision';

export type Ql106PersistenceImplementationDraftPlanItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  draftFinding: string;
  draftPlan: string;
  noWriteBoundary: string;
};

export type Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan = {
  build: 'QL-106';
  title: string;
  draftedFromBuild: 'QL-105';
  draftMode: 'display_only_implementation_draft_plan';
  draftOutcome: 'ready_for_implementation_draft_review' | 'hold_for_readiness_decision_gaps';
  implementationPermission: 'not_granted';
  ledgerWriteStatus: Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision['ledgerWriteStatus'];
  candidateSchemaStatus: Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision['candidateSchemaStatus'];
  endpointImplementationStatus: Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision['endpointImplementationStatus'];
  browserWriteStatus: Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision['browserWriteStatus'];
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision['rowSummary'];
  priorDecisionSummary: Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision['decisionSummary'];
  draftSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  draftItems: readonly Ql106PersistenceImplementationDraftPlanItem[];
  proposedLedgerSchemaDraft: readonly string[];
  proposedWriteRouteDraft: readonly string[];
  proposedBrowserConfirmationDraft: readonly string[];
  proposedRetentionCleanupDraft: readonly string[];
  proposedRollbackDisableDraft: readonly string[];
  proposedOwnerApprovalDraft: readonly string[];
  proposedProductionVerificationGates: readonly string[];
  implementationReviewGates: readonly string[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  retainedBoundaries: readonly string[];
  draftWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeDraftItems(items: readonly Ql106PersistenceImplementationDraftPlanItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan(
  readinessDecision: Ql105SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationReadinessDecision
): Ql106SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationDraftPlan {
  const decidedFromQl105 = readinessDecision.build === 'QL-105';
  const readyToDraft =
    readinessDecision.readinessDecision === 'ready_to_draft_persistence_implementation_under_new_review' &&
    readinessDecision.decisionSummary.blocked === 0 &&
    readinessDecision.decisionSummary.review === 0;
  const permissionStillNotGranted =
    readinessDecision.implementationPermission === 'not_granted' &&
    readinessDecision.ledgerWriteStatus === 'planned_not_implemented' &&
    readinessDecision.candidateSchemaStatus === 'planned_not_implemented' &&
    readinessDecision.endpointImplementationStatus === 'not_implemented' &&
    readinessDecision.browserWriteStatus === 'disabled';
  const fieldBoundaryReady =
    readinessDecision.candidateLedgerFields.length >= 10 &&
    readinessDecision.rejectedPrivateFields.length >= 8 &&
    readinessDecision.candidateLedgerFields.every((field) => !readinessDecision.rejectedPrivateFields.includes(field));
  const draftGatesPresent =
    readinessDecision.requiredImplementationDraftGates.length >= 5 &&
    readinessDecision.nonNegotiableImplementationBoundaries.length >= 5 &&
    readinessDecision.reviewedReadinessDecisionGates.length >= 5;
  const runtimeStillLocked =
    readinessDecision.blockedRuntime.length >= 4 &&
    readinessDecision.retainedBoundaries.length >= 5 &&
    readinessDecision.rowSummary.runtimeLockouts > 0;
  const safeReadEvidenceAvailable =
    readinessDecision.rowSummary.conversationRows > 0 && readinessDecision.rowSummary.systemStatusRows > 0;

  const proposedLedgerSchemaDraft = [
    'Create a future evidence-ledger table only after separate implementation approval; proposed fields are limited to build, reviewed_build, selected_brand_label, active_source_label, review_outcome, row counts, checkpoint summary, blocked runtime summary, manual acceptance reference, and created_at.',
    'Require rejected private fields to stay out of schema, indexes, policies, logs, archives, and browser copy.',
    'Require row-level proof to store aggregate evidence only; no customer phone, customer email, message body, provider payload, recording URL, archive payload, or audit payload is allowed.',
    'Require a disabled-by-default feature gate so any future table remains unreachable from the browser until a later reviewed implementation enables it.',
    'Require a rollback and purge script to be drafted before any schema migration is created.'
  ];

  const proposedWriteRouteDraft = [
    'Draft a future server-side acceptance route name and request contract without adding the route file or handler in QL-106.',
    'Require idempotency based on build, brand, source label, operator confirmation reference, and generated evidence hash before any future write can be accepted.',
    'Require validation to reject private/raw fields, live provider data, Phone/SMS payloads, archive payloads, audit/admin payloads, and AI delivery payloads.',
    'Require a dry-run response mode to remain the default even after an implementation draft exists.',
    'Require server-side checks to return explicit blocked status when the disabled preview, owner approval, or production verification gate is not satisfied.'
  ];

  const proposedBrowserConfirmationDraft = [
    'Draft display-only confirmation copy for the operator to review before any save button exists.',
    'Require the browser to show candidate fields, rejected fields, retention note, rollback note, and disabled runtime boundary before any later acceptance save is proposed.',
    'Require any future browser submit control to be disabled by default and hidden from public disabled preview users.',
    'Require acceptance proof to be generated from aggregate safe-read evidence only, not from customer or provider payloads.',
    'Require UI copy to state that QL-106 is a draft plan and grants no persistence permission.'
  ];

  const proposedRetentionCleanupDraft = [
    'Draft retention duration, cleanup cadence, and purge rules before any future ledger row can exist.',
    'Require evidence rows to be safe to delete without affecting live conversations, Phone/SMS, archives, consent, audit/admin, AI, or provider state.',
    'Require cleanup to be manually reviewable before automation is introduced.',
    'Require a separate owner approval for retention duration changes.',
    'Require production verification to confirm retention jobs are not active in QL-106.'
  ];

  const proposedRollbackDisableDraft = [
    'Draft an emergency disable flag that can block any future write route before a write is attempted.',
    'Draft rollback steps for route disable, browser disable, schema rollback, and evidence purge before implementation.',
    'Require rollback instructions to be stored in docs and reviewed before any migration or write path exists.',
    'Require all future write code to fail closed when environment gates or owner approval are missing.',
    'Require QL-106 to remain rollback-neutral because it adds no schema, route, or write behavior.'
  ];

  const proposedOwnerApprovalDraft = [
    'Draft the owner approval checklist needed before a later implementation build can create persistence.',
    'Require explicit approval for schema fields, rejected field exclusions, route contract, browser copy, retention, rollback, and production gates.',
    'Require proof that app-build, Pages build/deploy, Supabase Preview, and Cloudflare Workers pass on main before promotion is accepted.',
    'Require public disabled preview to remain safe-read only until a later build is explicitly approved and promoted.',
    'Require a later implementation review build before any real persistence is enabled.'
  ];

  const proposedProductionVerificationGates = [
    'PR-head app-build must pass before merge.',
    'Final main app-build must pass after merge.',
    'Final GitHub Pages disabled preview build and deploy must pass after merge.',
    'Final Supabase Preview must pass after merge without introducing migrations or data writes in QL-106.',
    'Final Cloudflare Workers production build must pass after merge.'
  ];

  const draftItems: readonly Ql106PersistenceImplementationDraftPlanItem[] = [
    {
      id: 'ql106-draft-readiness-decision-input',
      label: 'QL-105 readiness decision allows a draft plan only',
      status: statusWhen(decidedFromQl105 && readyToDraft),
      draftFinding: `QL-105 readiness is ${readinessDecision.readinessDecision}; ${readinessDecision.decisionSummary.review} review item(s) and ${readinessDecision.decisionSummary.blocked} blocked item(s) remain.`,
      draftPlan: 'Draft the implementation shape for later review without creating implementation code or persistence.',
      noWriteBoundary: 'No schema, route, browser write, stored acceptance, Supabase mutation, provider action, Phone/SMS action, callback, archive, audit, retention, or AI delivery path is added.'
    },
    {
      id: 'ql106-draft-permission-lock',
      label: 'Implementation permission remains not granted',
      status: statusWhen(permissionStillNotGranted),
      draftFinding: `Implementation permission is ${readinessDecision.implementationPermission}; ledger status is ${readinessDecision.ledgerWriteStatus}, endpoint status is ${readinessDecision.endpointImplementationStatus}, and browser writes are ${readinessDecision.browserWriteStatus}.`,
      draftPlan: 'Keep the draft declarative and require a later implementation review before any write path exists.',
      noWriteBoundary: 'QL-106 cannot be used as approval to write ledger data or enable runtime behavior.'
    },
    {
      id: 'ql106-draft-field-boundary',
      label: 'Field boundary is safe enough to draft',
      status: statusWhen(fieldBoundaryReady),
      draftFinding: `${readinessDecision.candidateLedgerFields.length} candidate field(s) and ${readinessDecision.rejectedPrivateFields.length} rejected private field(s) remain separated.`,
      draftPlan: 'Use only bounded proof fields in the draft and keep private/raw fields rejected.',
      noWriteBoundary: 'Candidate fields remain future text only; no field is written or stored.'
    },
    {
      id: 'ql106-draft-coverage',
      label: 'Draft coverage includes schema, route, browser, retention, rollback, owner, and production gates',
      status: statusWhen(draftGatesPresent),
      draftFinding: `${readinessDecision.requiredImplementationDraftGates.length} required draft gate(s), ${readinessDecision.nonNegotiableImplementationBoundaries.length} non-negotiable boundary item(s), and ${readinessDecision.reviewedReadinessDecisionGates.length} reviewed readiness gate(s) are available.`,
      draftPlan: 'Document each implementation area as proposed future work and require review before implementation.',
      noWriteBoundary: 'Draft coverage does not create code paths, database objects, jobs, buttons, or runtime actions.'
    },
    {
      id: 'ql106-draft-runtime-lockout',
      label: 'Runtime lockouts remain enforced by design',
      status: statusWhen(runtimeStillLocked && safeReadEvidenceAvailable),
      draftFinding: `${readinessDecision.rowSummary.runtimeLockouts} runtime lockout statement(s), ${readinessDecision.rowSummary.conversationRows} conversation row(s), and ${readinessDecision.rowSummary.systemStatusRows} system status row(s) remain visible.`,
      draftPlan: 'Keep all runtime, provider, Phone/SMS, callback, archive, audit, retention, AI, and live pilot capabilities outside this draft.',
      noWriteBoundary: 'Only aggregate safe-read evidence is displayed; no live customer or provider data is read or written.'
    }
  ];

  const draftSummary = summarizeDraftItems(draftItems);
  const draftOutcome =
    draftSummary.blocked === 0 && draftSummary.review === 0
      ? 'ready_for_implementation_draft_review'
      : 'hold_for_readiness_decision_gaps';

  return {
    build: 'QL-106',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Draft Plan',
    draftedFromBuild: 'QL-105',
    draftMode: 'display_only_implementation_draft_plan',
    draftOutcome,
    implementationPermission: 'not_granted',
    ledgerWriteStatus: readinessDecision.ledgerWriteStatus,
    candidateSchemaStatus: readinessDecision.candidateSchemaStatus,
    endpointImplementationStatus: readinessDecision.endpointImplementationStatus,
    browserWriteStatus: readinessDecision.browserWriteStatus,
    selectedBrandLabel: readinessDecision.selectedBrandLabel,
    sourceLabel: readinessDecision.sourceLabel,
    rowSummary: readinessDecision.rowSummary,
    priorDecisionSummary: readinessDecision.decisionSummary,
    draftSummary,
    draftItems,
    proposedLedgerSchemaDraft,
    proposedWriteRouteDraft,
    proposedBrowserConfirmationDraft,
    proposedRetentionCleanupDraft,
    proposedRollbackDisableDraft,
    proposedOwnerApprovalDraft,
    proposedProductionVerificationGates,
    implementationReviewGates: [
      'QL-107 must review this draft before implementation work is considered.',
      'A later implementation build must create no write path unless owner approval and production gates are explicit.',
      'A later implementation build must remain disabled by default and fail closed without configuration.',
      'A later implementation build must preserve rejected private fields across schema, route, UI, logs, archives, and audits.',
      'A later implementation build must pass all main production checks before any GREEN status is accepted.'
    ],
    candidateLedgerFields: readinessDecision.candidateLedgerFields,
    rejectedPrivateFields: readinessDecision.rejectedPrivateFields,
    retainedBoundaries: [
      'QL-106 is a display-only implementation draft plan and does not implement persistence.',
      'QL-106 does not create schema, migrations, tables, views, policies, RPC functions, routes, storage objects, write buttons, or acceptance saves.',
      'Manual operator acceptance remains outside the disabled preview until a later reviewed implementation exists.',
      'Candidate ledger fields remain future candidates only and rejected private fields stay excluded.',
      'Future write work must start from a separate implementation build after this draft is reviewed; QL-106 grants no write permission.'
    ],
    draftWarning:
      'QL-106 is a draft plan only. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: readinessDecision.blockedRuntime,
    nextQueuedBuild: 'QL-107 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Draft Review',
    generatedAt: new Date().toISOString()
  };
}
