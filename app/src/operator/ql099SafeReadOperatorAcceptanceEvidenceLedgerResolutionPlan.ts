import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql098SafeReadOperatorAcceptanceEvidenceLedgerReview } from './ql098SafeReadOperatorAcceptanceEvidenceLedgerReview';

export type Ql099EvidenceLedgerResolutionItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  resolutionFinding: string;
  requiredResolution: string;
  noWriteBoundary: string;
};

export type Ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan = {
  build: 'QL-099';
  title: string;
  resolvedFromBuild: 'QL-098';
  resolutionMode: 'display_only_resolution_plan';
  resolutionOutcome: 'ready_for_resolution_review' | 'resolution_plan_review_required';
  ledgerWriteStatus: 'not_implemented';
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql098SafeReadOperatorAcceptanceEvidenceLedgerReview['rowSummary'];
  reviewSummary: Ql098SafeReadOperatorAcceptanceEvidenceLedgerReview['reviewSummary'];
  resolutionSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  resolutionItems: readonly Ql099EvidenceLedgerResolutionItem[];
  approvedProofFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  proposedResolutionSteps: readonly string[];
  deferredWriteRequirements: readonly string[];
  retainedBoundaries: readonly string[];
  reviewWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeResolutionItems(items: readonly Ql099EvidenceLedgerResolutionItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan(
  ledgerReview: Ql098SafeReadOperatorAcceptanceEvidenceLedgerReview
): Ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan {
  const reviewedQ098 = ledgerReview.build === 'QL-098';
  const reviewHasNoBlockedItems = ledgerReview.reviewSummary.blocked === 0;
  const reviewHasNoOpenItems = ledgerReview.reviewSummary.review === 0;
  const approvedFieldsRemainBounded =
    ledgerReview.approvedProofFields.length >= 10 &&
    ledgerReview.approvedProofFields.every((field) => !ledgerReview.rejectedPrivateFields.includes(field));
  const privateFieldsRemainRejected = ledgerReview.rejectedPrivateFields.length >= 8;
  const hasSafeReadCounts = ledgerReview.rowSummary.conversationRows > 0 && ledgerReview.rowSummary.systemStatusRows > 0;
  const hasRuntimeBoundaries = ledgerReview.retainedBoundaries.length >= 4 && ledgerReview.blockedRuntime.length >= 4;

  const resolutionItems: readonly Ql099EvidenceLedgerResolutionItem[] = [
    {
      id: 'ql099-resolve-review-outcome',
      label: 'Resolve QL-098 review outcome into a gated plan',
      status: statusWhen(reviewedQ098 && reviewHasNoBlockedItems),
      resolutionFinding: `QL-098 outcome is ${ledgerReview.reviewOutcome}; ${ledgerReview.reviewSummary.blocked} blocked review item(s) remain.`,
      requiredResolution:
        'Carry the display-only QL-098 review forward into a resolution plan before any persistence work is considered.',
      noWriteBoundary:
        'QL-099 resolves planning questions only; it does not create tables, insert rows, update Supabase, or store acceptance state.'
    },
    {
      id: 'ql099-resolve-proof-field-set',
      label: 'Resolve approved proof fields as the only future candidate field set',
      status: statusWhen(approvedFieldsRemainBounded),
      resolutionFinding: `${ledgerReview.approvedProofFields.length} approved proof field(s) remain bounded and do not overlap rejected private fields.`,
      requiredResolution:
        'Treat the approved QL-098 proof field list as the maximum allowed starting point for any later ledger write proposal.',
      noWriteBoundary:
        'Field resolution is declarative only and does not create schema, migrations, RPC functions, browser submit handlers, or storage objects.'
    },
    {
      id: 'ql099-resolve-private-field-rejection',
      label: 'Resolve private fields as excluded from any later proof ledger',
      status: statusWhen(privateFieldsRemainRejected),
      resolutionFinding: `${ledgerReview.rejectedPrivateFields.length} private or live-payload field(s) remain explicitly rejected.`,
      requiredResolution:
        'Keep customer/contact/provider payloads, raw rejected rows, recordings, SMS/MMS content, archive payloads, and audit payloads outside the evidence ledger boundary.',
      noWriteBoundary:
        'The public disabled preview remains a safe-read display and does not inspect or persist live private values.'
    },
    {
      id: 'ql099-resolve-count-evidence',
      label: 'Resolve safe-read count evidence as sufficient for manual review',
      status: statusWhen(hasSafeReadCounts),
      resolutionFinding: `${ledgerReview.rowSummary.conversationRows} conversation row(s), ${ledgerReview.rowSummary.systemStatusRows} system status row(s), ${ledgerReview.rowSummary.rejectedRows} rejected diagnostic(s), and ${ledgerReview.rowSummary.runtimeLockouts} runtime lockout statement(s) remain available.`,
      requiredResolution:
        'Use aggregate counts, status summaries, source labels, and operator-facing prompts as evidence; do not copy raw rows into any future ledger.',
      noWriteBoundary:
        'QL-099 does not perform Supabase reads beyond the existing validated safe-read preview path and does not persist count evidence.'
    },
    {
      id: 'ql099-resolve-future-write-gate',
      label: 'Resolve future ledger write gate before implementation',
      status: statusWhen(reviewHasNoOpenItems && reviewHasNoBlockedItems && hasRuntimeBoundaries),
      resolutionFinding: `${ledgerReview.retainedBoundaries.length} retained boundary statement(s) and ${ledgerReview.blockedRuntime.length} blocked runtime statement(s) remain present.`,
      requiredResolution:
        'Require a separate reviewed build to propose any database schema, persistence endpoint, browser submission path, or audit/retention behavior.',
      noWriteBoundary:
        'Phone/SMS, callbacks, live customer/provider reads, archives, consent, audit/admin/retention writes, AI send/generation, and live pilot runtime stay disabled.'
    }
  ];

  const resolutionSummary = summarizeResolutionItems(resolutionItems);
  const resolutionOutcome =
    resolutionSummary.blocked === 0 && resolutionSummary.review === 0 ? 'ready_for_resolution_review' : 'resolution_plan_review_required';

  return {
    build: 'QL-099',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Resolution Plan',
    resolvedFromBuild: 'QL-098',
    resolutionMode: 'display_only_resolution_plan',
    resolutionOutcome,
    ledgerWriteStatus: 'not_implemented',
    selectedBrandLabel: ledgerReview.selectedBrandLabel,
    sourceLabel: ledgerReview.sourceLabel,
    rowSummary: ledgerReview.rowSummary,
    reviewSummary: ledgerReview.reviewSummary,
    resolutionSummary,
    resolutionItems,
    approvedProofFields: ledgerReview.approvedProofFields,
    rejectedPrivateFields: ledgerReview.rejectedPrivateFields,
    proposedResolutionSteps: [
      'Keep QL-099 display-only and non-persistent.',
      'Review QL-098 findings against the bounded proof field set.',
      'Confirm excluded private fields remain outside all future ledger plans.',
      'Require manual operator approval outside the disabled preview before any future persistence proposal.',
      'Queue a separate resolution-review build before any schema or write implementation is considered.'
    ],
    deferredWriteRequirements: [
      'No Supabase table, migration, RPC function, or insert/update/delete endpoint is created in QL-099.',
      'No browser submit button, local persistence, storage upload, or acceptance save action is introduced in QL-099.',
      'No live customer/contact/provider payloads, Phone/SMS callbacks, archives, audit records, retention records, or AI send paths are enabled.',
      'Any later persistence build must restate approved proof fields, excluded private fields, retention rules, rollback steps, and operator acceptance ownership.'
    ],
    retainedBoundaries: [
      'QL-099 resolves what must be reviewed before any future evidence ledger persistence, but it does not implement persistence.',
      'The public disabled preview remains safe-read and display-only.',
      'Manual operator acceptance remains outside the preview until a separate reviewed persistence build exists.',
      'Future write work must start from a new plan/review cycle and must not inherit write permission from QL-099.'
    ],
    reviewWarning:
      'QL-099 is a resolution plan only. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: ledgerReview.blockedRuntime,
    nextQueuedBuild: 'QL-100 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Resolution Review',
    generatedAt: new Date().toISOString()
  };
}
