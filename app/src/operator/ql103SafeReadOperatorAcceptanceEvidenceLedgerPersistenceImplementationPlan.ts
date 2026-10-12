import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview } from './ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview';

export type Ql103PersistenceImplementationPlanItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  planFinding: string;
  implementationRequirement: string;
  noWriteBoundary: string;
};

export type Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan = {
  build: 'QL-103';
  title: string;
  plannedFromBuild: 'QL-102';
  implementationPlanMode: 'plan_only_no_implementation';
  implementationPlanOutcome: 'ready_for_persistence_implementation_plan_review' | 'implementation_plan_review_required';
  ledgerWriteStatus: 'planned_not_implemented';
  candidateSchemaStatus: 'planned_not_implemented';
  endpointImplementationStatus: 'not_implemented';
  browserWriteStatus: 'disabled';
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview['rowSummary'];
  priorReviewSummary: Ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview['reviewSummary'];
  implementationSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  implementationItems: readonly Ql103PersistenceImplementationPlanItem[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  schemaDraftPlan: readonly string[];
  writeRoutePlan: readonly string[];
  browserAcceptancePlan: readonly string[];
  retentionAndCleanupPlan: readonly string[];
  rollbackAndDisablePlan: readonly string[];
  ownerApprovalPlan: readonly string[];
  implementationReviewChecklist: readonly string[];
  retainedBoundaries: readonly string[];
  planWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeImplementationItems(items: readonly Ql103PersistenceImplementationPlanItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan(
  persistenceReview: Ql102SafeReadOperatorAcceptanceEvidenceLedgerPersistencePlanReview
): Ql103SafeReadOperatorAcceptanceEvidenceLedgerPersistenceImplementationPlan {
  const reviewedQ102 = persistenceReview.build === 'QL-102';
  const ql102ReadyForImplementationPlan =
    persistenceReview.reviewOutcome === 'ready_for_persistence_implementation_plan' &&
    persistenceReview.reviewSummary.blocked === 0 &&
    persistenceReview.reviewSummary.review === 0;
  const priorPlanStillNonPersistent =
    persistenceReview.ledgerWriteStatus === 'planned_not_implemented' &&
    persistenceReview.candidateSchemaStatus === 'not_implemented';
  const boundedCandidateFields =
    persistenceReview.candidateLedgerFields.length >= 10 &&
    persistenceReview.rejectedPrivateFields.length >= 8 &&
    persistenceReview.candidateLedgerFields.every((field) => !persistenceReview.rejectedPrivateFields.includes(field));
  const futureGatesAreExplicit =
    persistenceReview.implementationReadinessGates.length >= 5 &&
    persistenceReview.requiredFutureReviewChecks.length >= 5;
  const rollbackIsExplicit = persistenceReview.rollbackPlanRequirements.length >= 5;
  const runtimeStillLocked =
    persistenceReview.blockedRuntime.length >= 4 &&
    persistenceReview.retainedBoundaries.length >= 5 &&
    persistenceReview.rowSummary.runtimeLockouts > 0;
  const safeReadEvidenceVisible =
    persistenceReview.rowSummary.conversationRows > 0 && persistenceReview.rowSummary.systemStatusRows > 0;

  const implementationItems: readonly Ql103PersistenceImplementationPlanItem[] = [
    {
      id: 'ql103-plan-from-persistence-review',
      label: 'Implementation planning starts from the QL-102 review',
      status: statusWhen(reviewedQ102 && ql102ReadyForImplementationPlan && priorPlanStillNonPersistent),
      planFinding: `QL-102 outcome is ${persistenceReview.reviewOutcome}; ${persistenceReview.reviewSummary.review} review item(s) and ${persistenceReview.reviewSummary.blocked} blocked item(s) remain.`,
      implementationRequirement:
        'Use QL-103 only to plan the implementation sequence after QL-102 confirms the persistence plan is ready for implementation planning.',
      noWriteBoundary:
        'QL-103 does not create schema, tables, migrations, RPC functions, write endpoints, browser submit handlers, or stored acceptance rows.'
    },
    {
      id: 'ql103-plan-schema-shape',
      label: 'Candidate schema remains declarative and bounded',
      status: statusWhen(boundedCandidateFields),
      planFinding: `${persistenceReview.candidateLedgerFields.length} candidate ledger field(s) remain separated from ${persistenceReview.rejectedPrivateFields.length} rejected private field(s).`,
      implementationRequirement:
        'Plan a later bounded ledger schema using only approved proof fields, metadata fields, aggregate counts, and manual reference fields.',
      noWriteBoundary:
        'The schema draft is text-only; no Supabase migration, table, view, index, RLS policy, RPC function, or storage object is created.'
    },
    {
      id: 'ql103-plan-write-route-and-browser-flow',
      label: 'Write route and browser flow remain future reviewed work',
      status: statusWhen(futureGatesAreExplicit),
      planFinding: `${persistenceReview.implementationReadinessGates.length} implementation readiness gate(s) and ${persistenceReview.requiredFutureReviewChecks.length} future review check(s) remain documented.`,
      implementationRequirement:
        'Plan separate later review for any API route, mutation contract, browser confirmation, idempotency token, operator sign-off, and disabled-state guard.',
      noWriteBoundary:
        'No route, handler, button, form action, local persistence, provider call, Phone/SMS action, callback registration, or acceptance save is added.'
    },
    {
      id: 'ql103-plan-retention-cleanup-rollback',
      label: 'Retention, cleanup, rollback, and disable paths are required',
      status: statusWhen(rollbackIsExplicit),
      planFinding: `${persistenceReview.rollbackPlanRequirements.length} rollback requirement(s) remain attached to the QL-102 review.`,
      implementationRequirement:
        'Plan cleanup, retention, emergency disable, purge, revert, and owner-restoration steps before any later implementation may be proposed.',
      noWriteBoundary:
        'QL-103 does not add retention jobs, cleanup jobs, purge jobs, background tasks, migrations, or admin write controls.'
    },
    {
      id: 'ql103-plan-runtime-boundary',
      label: 'Runtime lockouts remain active during implementation planning',
      status: statusWhen(runtimeStillLocked && safeReadEvidenceVisible),
      planFinding: `${persistenceReview.rowSummary.conversationRows} conversation row(s), ${persistenceReview.rowSummary.systemStatusRows} system status row(s), ${persistenceReview.rowSummary.runtimeLockouts} runtime lockout statement(s), and ${persistenceReview.blockedRuntime.length} blocked runtime statement(s) remain visible.`,
      implementationRequirement:
        'Keep the public disabled preview safe-read only and require another review before any persistence implementation or runtime activation.',
      noWriteBoundary:
        'Phone/SMS, callbacks, live reads, provider delivery, archives, consent, audit/admin, retention writes, AI generation/send, and live pilot runtime stay disabled.'
    }
  ];

  const implementationSummary = summarizeImplementationItems(implementationItems);
  const implementationPlanOutcome =
    implementationSummary.blocked === 0 && implementationSummary.review === 0
      ? 'ready_for_persistence_implementation_plan_review'
      : 'implementation_plan_review_required';

  return {
    build: 'QL-103',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan',
    plannedFromBuild: 'QL-102',
    implementationPlanMode: 'plan_only_no_implementation',
    implementationPlanOutcome,
    ledgerWriteStatus: 'planned_not_implemented',
    candidateSchemaStatus: 'planned_not_implemented',
    endpointImplementationStatus: 'not_implemented',
    browserWriteStatus: 'disabled',
    selectedBrandLabel: persistenceReview.selectedBrandLabel,
    sourceLabel: persistenceReview.sourceLabel,
    rowSummary: persistenceReview.rowSummary,
    priorReviewSummary: persistenceReview.reviewSummary,
    implementationSummary,
    implementationItems,
    candidateLedgerFields: persistenceReview.candidateLedgerFields,
    rejectedPrivateFields: persistenceReview.rejectedPrivateFields,
    schemaDraftPlan: [
      'Plan one future append-only operator acceptance evidence ledger table after a separate implementation review.',
      'Limit the candidate schema to build/review identifiers, selected brand/source labels, aggregate row counts, checkpoint summaries, runtime lockout proof, manual operator reference, created timestamp, and bounded status fields.',
      'Exclude customer names, phone numbers, email addresses, raw messages, raw provider payloads, recordings, SMS/MMS content, archive payloads, raw rejected rows, and audit payloads.',
      'Plan RLS and service-role access boundaries before any migration is created.',
      'Require rollback and purge instructions in the same future implementation proposal.'
    ],
    writeRoutePlan: [
      'Plan a single future write route for bounded manual operator evidence only after review.',
      'Require idempotency and build/version references before any insert contract exists.',
      'Require disabled-by-default configuration so the route cannot write until manually enabled in a later reviewed build.',
      'Reject private field keys at validation time before any persistence can occur.',
      'Return read-only confirmation evidence without triggering provider delivery or Phone/SMS runtime.'
    ],
    browserAcceptancePlan: [
      'Plan a separate future browser confirmation panel with explicit manual operator action.',
      'Keep the current public disabled preview without submit buttons or local acceptance storage.',
      'Require copy explaining that persistence is disabled until a later reviewed implementation exists.',
      'Require a visible rejected-private-field checklist before any future acceptance action.',
      'Require production checks after any future browser write affordance is proposed.'
    ],
    retentionAndCleanupPlan: [
      'Plan retention duration before any ledger table is created.',
      'Plan cleanup for stale draft/operator evidence rows before any background task exists.',
      'Plan manual purge instructions for accidentally stored disallowed fields.',
      'Plan audit/admin review responsibilities without writing audit payloads in QL-103.',
      'Plan export and restoration boundaries before any data is persisted.'
    ],
    rollbackAndDisablePlan: [
      'Plan how to disable any future write route without affecting safe-read preview display.',
      'Plan how to revert browser acceptance UI to display-only mode.',
      'Plan how to remove future schema or migrations safely.',
      'Plan how to purge invalid ledger rows and confirm private fields were not stored.',
      'Plan owner sign-off before re-enabling any future persistence after rollback.'
    ],
    ownerApprovalPlan: [
      'Operator owner must approve exact schema before migration.',
      'Operator owner must approve exact write route and browser flow before implementation.',
      'Operator owner must approve retention, cleanup, purge, and rollback controls.',
      'Operator owner must confirm rejected private fields remain excluded.',
      'Operator owner must confirm Phone/SMS, provider delivery, callbacks, archive, consent, audit/admin, AI, and live pilot runtime stay disabled.'
    ],
    implementationReviewChecklist: [
      'Review the QL-103 implementation plan in a separate review build before writing code that persists data.',
      'Review schema, write route, browser flow, retention, rollback, and owner approval together.',
      'Run app-build, Pages build/deploy, Supabase Preview, and Cloudflare Workers checks on the final main commit.',
      'Do not inherit permission to write from QL-101, QL-102, or QL-103.',
      'Require another explicit build before any persistence implementation can exist.'
    ],
    retainedBoundaries: [
      'QL-103 plans implementation only and does not implement persistence.',
      'No schema, migration, table, view, RPC, endpoint, route, storage object, write button, or acceptance save is added.',
      'Manual operator acceptance remains outside the disabled preview until a later reviewed implementation exists.',
      'Candidate ledger fields remain future candidates only and rejected private fields stay excluded.',
      'Future write work must start from a new review build; QL-103 grants no write permission.'
    ],
    planWarning:
      'QL-103 is a persistence implementation plan only. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: persistenceReview.blockedRuntime,
    nextQueuedBuild: 'QL-104 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan Review',
    generatedAt: new Date().toISOString()
  };
}
