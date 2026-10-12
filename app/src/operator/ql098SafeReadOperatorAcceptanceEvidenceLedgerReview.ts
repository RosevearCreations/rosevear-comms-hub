import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan } from './ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan';

export type Ql098EvidenceLedgerReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  reviewFinding: string;
  ledgerDecision: string;
  evidenceBoundary: string;
};

export type Ql098SafeReadOperatorAcceptanceEvidenceLedgerReview = {
  build: 'QL-098';
  title: string;
  reviewedBuild: 'QL-097';
  reviewMode: 'display_only_evidence_ledger_review';
  reviewOutcome: 'ready_for_evidence_ledger_resolution_plan' | 'ledger_review_required';
  ledgerMode: Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan['ledgerMode'];
  storageStatus: Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan['storageStatus'];
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan['rowSummary'];
  ledgerEntrySummary: Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan['ledgerEntrySummary'];
  reviewSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  reviewItems: readonly Ql098EvidenceLedgerReviewItem[];
  approvedProofFields: readonly string[];
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

function summarizeReviewItems(items: readonly Ql098EvidenceLedgerReviewItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl098SafeReadOperatorAcceptanceEvidenceLedgerReview(
  ledgerPlan: Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan
): Ql098SafeReadOperatorAcceptanceEvidenceLedgerReview {
  const reviewedQ097 = ledgerPlan.build === 'QL-097';
  const planOnlyMode = ledgerPlan.ledgerMode === 'plan_only_no_persistence' && ledgerPlan.storageStatus === 'not_persisted';
  const hasPlannedEntries = ledgerPlan.ledgerEntries.length >= 5 && ledgerPlan.ledgerEntrySummary.blocked === 0;
  const proofFieldsAreBounded = ledgerPlan.proposedLedgerFields.length >= 10 && ledgerPlan.proposedLedgerFields.every((field) => !ledgerPlan.excludedFields.includes(field));
  const exclusionsAreExplicit = ledgerPlan.excludedFields.length >= 8;
  const retentionBoundaryIsExplicit = ledgerPlan.retentionBoundary.length >= 4;
  const blockedRuntimeIsRetained = ledgerPlan.blockedRuntime.length >= 4;
  const safeCountsArePresent = ledgerPlan.rowSummary.conversationRows > 0 && ledgerPlan.rowSummary.systemStatusRows > 0;

  const reviewItems: readonly Ql098EvidenceLedgerReviewItem[] = [
    {
      id: 'ql098-plan-only-mode-reviewed',
      label: 'QL-097 ledger mode remains plan-only',
      status: statusWhen(reviewedQ097 && planOnlyMode),
      reviewFinding: `Ledger mode is ${ledgerPlan.ledgerMode} and storage status is ${ledgerPlan.storageStatus}.`,
      ledgerDecision: 'Confirm QL-097 did not add acceptance persistence, browser submit handlers, database mutations, storage uploads, or provider calls.',
      evidenceBoundary: 'Review reads QL-097 plan metadata only; it does not execute writes or store acceptance records.'
    },
    {
      id: 'ql098-planned-entries-reviewed',
      label: 'Planned evidence entries are reviewable',
      status: statusWhen(hasPlannedEntries),
      reviewFinding: `${ledgerPlan.ledgerEntries.length} planned ledger entry definition(s) are present; ${ledgerPlan.ledgerEntrySummary.blocked} blocked entry definition(s) are reported.`,
      ledgerDecision: 'Confirm the planned entries are specific enough for a later evidence-ledger resolution plan without enabling the ledger now.',
      evidenceBoundary: 'Only labels, intents, proposed evidence lists, exclusion lists, and operator questions are reviewed.'
    },
    {
      id: 'ql098-proof-field-boundary-reviewed',
      label: 'Proof fields are bounded and private fields stay excluded',
      status: statusWhen(proofFieldsAreBounded && exclusionsAreExplicit),
      reviewFinding: `${ledgerPlan.proposedLedgerFields.length} proposed proof field(s) and ${ledgerPlan.excludedFields.length} excluded private field(s) are defined.`,
      ledgerDecision: 'Confirm future proof fields should remain aggregate/bounded and never include live customer/contact/provider payloads.',
      evidenceBoundary: 'The review compares proposed field names against excluded private fields; it does not inspect or persist private values.'
    },
    {
      id: 'ql098-safe-read-counts-reviewed',
      label: 'Safe-read count evidence remains sufficient',
      status: statusWhen(safeCountsArePresent),
      reviewFinding: `${ledgerPlan.rowSummary.conversationRows} conversation row(s), ${ledgerPlan.rowSummary.systemStatusRows} system status row(s), ${ledgerPlan.rowSummary.rejectedRows} rejected-row diagnostic(s), and ${ledgerPlan.rowSummary.runtimeLockouts} lockout statement(s) remain visible.`,
      ledgerDecision: 'Confirm count evidence can support a future ledger without raw rows, message bodies, contact data, or rejected payloads.',
      evidenceBoundary: 'Only counts, source labels, plan text, and display-only synthetic rows are reviewed.'
    },
    {
      id: 'ql098-retention-runtime-boundary-reviewed',
      label: 'Retention and runtime boundaries remain explicit',
      status: statusWhen(retentionBoundaryIsExplicit && blockedRuntimeIsRetained),
      reviewFinding: `${ledgerPlan.retentionBoundary.length} retention boundary statement(s) and ${ledgerPlan.blockedRuntime.length} blocked runtime statement(s) remain attached.`,
      ledgerDecision: 'Confirm future ledger work must go through a separate reviewed build before any persistence or runtime activation is considered.',
      evidenceBoundary: 'No live reads, Phone/SMS, callbacks, archive writes, consent writes, audit writes, retention writes, AI send, or live pilot runtime are enabled.'
    }
  ];

  const reviewSummary = summarizeReviewItems(reviewItems);
  const reviewOutcome = reviewSummary.blocked === 0 && reviewSummary.review === 0 ? 'ready_for_evidence_ledger_resolution_plan' : 'ledger_review_required';

  return {
    build: 'QL-098',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Review',
    reviewedBuild: 'QL-097',
    reviewMode: 'display_only_evidence_ledger_review',
    reviewOutcome,
    ledgerMode: ledgerPlan.ledgerMode,
    storageStatus: ledgerPlan.storageStatus,
    selectedBrandLabel: ledgerPlan.selectedBrandLabel,
    sourceLabel: ledgerPlan.sourceLabel,
    rowSummary: ledgerPlan.rowSummary,
    ledgerEntrySummary: ledgerPlan.ledgerEntrySummary,
    reviewSummary,
    reviewItems,
    approvedProofFields: ledgerPlan.proposedLedgerFields,
    rejectedPrivateFields: ledgerPlan.excludedFields,
    retainedBoundaries: [
      'QL-098 reviews the QL-097 evidence-ledger plan only and does not create an acceptance ledger.',
      'A future ledger must remain limited to bounded proof fields unless another reviewed build explicitly changes that boundary.',
      'Private customer/contact/provider data, raw rejected rows, recordings, SMS/MMS content, archive payloads, and audit payloads stay excluded.',
      'Manual operator acceptance remains outside the public disabled preview until a separate reviewed persistence build exists.'
    ],
    reviewWarning: 'QL-098 is a display-only review of the QL-097 evidence-ledger plan. It does not create a table, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: ledgerPlan.blockedRuntime,
    nextQueuedBuild: 'QL-099 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Resolution Plan',
    generatedAt: new Date().toISOString()
  };
}
