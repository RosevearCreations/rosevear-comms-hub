import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql096SafeReadOperatorAcceptanceReview } from './ql096SafeReadOperatorAcceptanceReview';

export type Ql097EvidenceLedgerPlanEntry = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  ledgerIntent: string;
  evidenceToRecord: readonly string[];
  excludedData: readonly string[];
  operatorQuestion: string;
};

export type Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan = {
  build: 'QL-097';
  title: string;
  plannedFromBuild: 'QL-096';
  ledgerMode: 'plan_only_no_persistence';
  ledgerReadiness: 'ready_for_ledger_review' | 'ledger_design_review_required';
  storageStatus: 'not_persisted';
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql096SafeReadOperatorAcceptanceReview['rowSummary'];
  checkpointSummary: Ql096SafeReadOperatorAcceptanceReview['checkpointSummary'];
  ledgerEntrySummary: {
    planned: number;
    review: number;
    blocked: number;
  };
  ledgerEntries: readonly Ql097EvidenceLedgerPlanEntry[];
  proposedLedgerFields: readonly string[];
  excludedFields: readonly string[];
  retentionBoundary: readonly string[];
  reviewWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeLedgerEntries(entries: readonly Ql097EvidenceLedgerPlanEntry[]) {
  return entries.reduce(
    (summary, entry) => ({
      planned: summary.planned + (entry.status === 'pass' ? 1 : 0),
      review: summary.review + (entry.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (entry.status === 'blocked' ? 1 : 0)
    }),
    { planned: 0, review: 0, blocked: 0 }
  );
}

export function buildQl097SafeReadOperatorAcceptanceEvidenceLedgerPlan(
  acceptanceReview: Ql096SafeReadOperatorAcceptanceReview
): Ql097SafeReadOperatorAcceptanceEvidenceLedgerPlan {
  const reviewedQ096 = acceptanceReview.build === 'QL-096';
  const reviewHasNoBlockedCheckpoints = acceptanceReview.checkpointSummary.blocked === 0;
  const reviewHasNoOpenReviews = acceptanceReview.checkpointSummary.review === 0;
  const hasDisplayRows = acceptanceReview.rowSummary.conversationRows > 0 && acceptanceReview.rowSummary.systemStatusRows > 0;
  const hasRuntimeLockouts = acceptanceReview.rowSummary.runtimeLockouts >= 4 && acceptanceReview.blockedRuntime.length >= 4;
  const hasRetainedBoundaries = acceptanceReview.retainedBoundaries.length >= 4;

  const ledgerEntries: readonly Ql097EvidenceLedgerPlanEntry[] = [
    {
      id: 'ql097-ledger-session-summary',
      label: 'Plan a manual acceptance session summary',
      status: statusWhen(reviewedQ096 && reviewHasNoBlockedCheckpoints),
      ledgerIntent: 'Define the summary fields a future ledger could store after an operator manually accepts the safe-read preview.',
      evidenceToRecord: ['build identifier QL-097', 'reviewed build QL-096', 'selected brand label', 'source label', 'review outcome', 'generated timestamp'],
      excludedData: ['live customer names', 'contact details', 'provider payloads', 'raw rejected rows', 'message bodies outside the synthetic public preview'],
      operatorQuestion: 'Would this summary identify the manual acceptance event without exposing live or private communications data?'
    },
    {
      id: 'ql097-ledger-safe-read-counts',
      label: 'Plan bounded safe-read count evidence',
      status: statusWhen(hasDisplayRows),
      ledgerIntent: 'Capture only the row-count evidence needed to show what the operator reviewed in the disabled preview.',
      evidenceToRecord: [
        `${acceptanceReview.rowSummary.conversationRows} conversation row count`,
        `${acceptanceReview.rowSummary.systemStatusRows} system status row count`,
        `${acceptanceReview.rowSummary.rejectedRows} rejected-row diagnostic count`,
        `${acceptanceReview.rowSummary.runtimeLockouts} runtime lockout count`
      ],
      excludedData: ['raw Supabase rows', 'raw rejected payloads', 'customer/contact/provider identifiers', 'recordings, transcripts, attachments, or archives'],
      operatorQuestion: 'Are row counts enough to prove the preview was reviewed without creating a private-data ledger?'
    },
    {
      id: 'ql097-ledger-checkpoint-evidence',
      label: 'Plan checkpoint outcome evidence',
      status: statusWhen(reviewHasNoBlockedCheckpoints),
      ledgerIntent: 'Store aggregate checkpoint outcomes from QL-096 without copying private payloads or browser-rendered message text.',
      evidenceToRecord: [
        `${acceptanceReview.checkpointSummary.passed} passed checkpoint count`,
        `${acceptanceReview.checkpointSummary.review} review checkpoint count`,
        `${acceptanceReview.checkpointSummary.blocked} blocked checkpoint count`,
        'checkpoint labels',
        'checkpoint status values',
        'operator-facing decision prompts'
      ],
      excludedData: ['operator free-text notes', 'private payload snapshots', 'provider callback payloads', 'live message sends or delivery receipts'],
      operatorQuestion: 'Should a future ledger store checkpoint labels/statuses only, leaving any narrative notes in external project notes?'
    },
    {
      id: 'ql097-ledger-runtime-lockout-proof',
      label: 'Plan runtime lockout proof',
      status: statusWhen(hasRuntimeLockouts && hasRetainedBoundaries),
      ledgerIntent: 'Record that forbidden runtime categories were still blocked at acceptance-review time.',
      evidenceToRecord: ['browser writes blocked', 'live customer/contact/provider reads blocked', 'Phone/SMS/callback runtime blocked', 'archive/consent/audit/retention writes blocked', 'AI generation/send and live pilot runtime blocked'],
      excludedData: ['webhook payloads', 'call metadata', 'SMS/MMS content', 'recording URLs', 'audit inserts', 'retention records'],
      operatorQuestion: 'Does the planned ledger prove the blocked state without turning on any blocked integration?'
    },
    {
      id: 'ql097-ledger-future-write-gate',
      label: 'Gate any future ledger write implementation',
      status: statusWhen(reviewedQ096 && reviewHasNoOpenReviews && reviewHasNoBlockedCheckpoints),
      ledgerIntent: 'Document that QL-097 is a design plan only and any future persistence must be introduced in a separate reviewed build.',
      evidenceToRecord: ['ledger mode: plan only', 'storage status: not persisted', 'future write gate requirement', 'next queued review build'],
      excludedData: ['database insert code', 'RPC mutation code', 'storage uploads', 'browser submit handlers', 'provider calls'],
      operatorQuestion: 'Is it clear that no acceptance ledger is written during QL-097?'
    }
  ];

  const ledgerEntrySummary = summarizeLedgerEntries(ledgerEntries);
  const ledgerReadiness = ledgerEntrySummary.blocked === 0 && ledgerEntrySummary.review === 0 ? 'ready_for_ledger_review' : 'ledger_design_review_required';

  return {
    build: 'QL-097',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Plan',
    plannedFromBuild: 'QL-096',
    ledgerMode: 'plan_only_no_persistence',
    ledgerReadiness,
    storageStatus: 'not_persisted',
    selectedBrandLabel: acceptanceReview.selectedBrandLabel,
    sourceLabel: acceptanceReview.sourceLabel,
    rowSummary: acceptanceReview.rowSummary,
    checkpointSummary: acceptanceReview.checkpointSummary,
    ledgerEntrySummary,
    ledgerEntries,
    proposedLedgerFields: ['ledger_build', 'reviewed_build', 'selected_brand_label', 'active_source_label', 'review_outcome', 'conversation_row_count', 'system_status_row_count', 'rejected_row_count', 'runtime_lockout_count', 'checkpoint_summary', 'blocked_runtime_summary', 'manual_acceptance_reference', 'created_at'],
    excludedFields: ['customer_name', 'customer_phone', 'customer_email', 'provider_payload', 'raw_rejected_row', 'message_body', 'call_recording_url', 'sms_mms_content', 'archive_payload', 'audit_payload'],
    retentionBoundary: [
      'QL-097 does not create a table, insert a row, update Supabase, upload files, or store acceptance in browser state.',
      'A future ledger must start with a separate review build before persistence is implemented.',
      'Any future record should store bounded proof fields only, not live customer/contact/provider payloads.',
      'Manual operator acceptance remains outside the public disabled preview.'
    ],
    reviewWarning: 'QL-097 is an evidence-ledger plan only. It designs what a future acceptance proof could contain, but it does not create persistence, browser submit flows, Supabase mutations, provider calls, Phone/SMS runtime, or AI delivery paths.',
    blockedRuntime: acceptanceReview.blockedRuntime,
    nextQueuedBuild: 'QL-098 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Review',
    generatedAt: new Date().toISOString()
  };
}
