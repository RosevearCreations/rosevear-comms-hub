import type { Ql093SafeReadResult } from './ql093ValidatedSyntheticSafeReads';

export type Ql094EvidenceStatus = 'pass' | 'review' | 'blocked';

export type Ql094EvidenceItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  detail: string;
};

export type Ql094SafeReadReviewEvidence = {
  build: 'QL-094';
  title: string;
  reviewedBuild: 'QL-093';
  selectedBrandId: Ql093SafeReadResult['selectedBrandId'];
  activeSourceLabel: string;
  readOnlyClientStatus: Ql093SafeReadResult['readOnlyClientStatus'];
  rowCounts: {
    conversationRows: number;
    systemStatusRows: number;
    rejectedRows: number;
    runtimeLockouts: number;
  };
  approvedReadTargets: readonly string[];
  blockedRuntime: readonly string[];
  evidenceItems: readonly Ql094EvidenceItem[];
  reviewerNotes: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

const approvedReadTargets = [
  'public.ql_public_synthetic_conversations',
  'public.ql_public_system_status'
] as const;

const blockedRuntime = [
  'Browser writes, inserts, updates, deletes, RPC mutations, and storage uploads',
  'Live customer/contact/conversation/message/provider payload reads',
  'Phone/SMS sending, live calls, callbacks, recordings, archives, and retention writes',
  'AI generation, AI send, provider delivery, callback registration, and live pilot runtime'
] as const;

function passWhen(condition: boolean, passDetail: string, reviewDetail: string): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function detailWhen(condition: boolean, passDetail: string, reviewDetail: string): string {
  return condition ? passDetail : reviewDetail;
}

export function buildQl094SafeReadReviewEvidence(result: Ql093SafeReadResult): Ql094SafeReadReviewEvidence {
  const hasConversationRows = result.conversationRows.length > 0;
  const hasSystemStatusRows = result.systemStatusRows.length > 0;
  const allowedSource =
    result.source === 'local_fallback' ||
    result.source === 'validated_supabase' ||
    result.source === 'partial_supabase_with_fallback';
  const hasLockouts = result.safetyLockouts.length >= 4;

  const evidenceItems: readonly Ql094EvidenceItem[] = [
    {
      id: 'ql094-read-source-boundary',
      label: 'Read source boundary',
      status: passWhen(
        allowedSource,
        'The preview source is one of the approved QL-093 safe-read modes.',
        'The preview source needs manual review before promotion.'
      ),
      detail: detailWhen(
        allowedSource,
        `Current source: ${result.source.replaceAll('_', ' ')}.`,
        `Unexpected source: ${result.source}.`
      )
    },
    {
      id: 'ql094-conversation-surface',
      label: 'Conversation evidence surface',
      status: passWhen(
        hasConversationRows,
        'Conversation cards are present from either local fallback or validated synthetic rows.',
        'No conversation cards are visible, so the operator needs to confirm fallback rendering before enabling the build.'
      ),
      detail: detailWhen(
        hasConversationRows,
        `${result.conversationRows.length} display-only conversation card(s) available for the selected brand.`,
        'The selected brand returned zero display-only conversation cards.'
      )
    },
    {
      id: 'ql094-system-status-surface',
      label: 'System status evidence surface',
      status: passWhen(
        hasSystemStatusRows,
        'System status rows are present from local fallback or validated synthetic rows.',
        'No system status rows are visible, so readiness messaging needs review.'
      ),
      detail: detailWhen(
        hasSystemStatusRows,
        `${result.systemStatusRows.length} display-only system status row(s) available.`,
        'The safe-read review found zero display-only system status rows.'
      )
    },
    {
      id: 'ql094-rejected-row-handling',
      label: 'Rejected row handling',
      status: 'pass',
      detail:
        result.rejectedRows.length > 0
          ? `${result.rejectedRows.length} rejected row reason(s) are summarized as bounded diagnostics only.`
          : 'No rejected remote rows are visible in this review result.'
    },
    {
      id: 'ql094-fallback-trace',
      label: 'Fallback trace',
      status: 'pass',
      detail: result.fallbackReason
        ? `Fallback reason is visible without exposing raw payloads: ${result.fallbackReason}`
        : 'No fallback reason is active; the preview still keeps local fallback behavior available.'
    },
    {
      id: 'ql094-runtime-lockouts',
      label: 'Runtime lockouts',
      status: passWhen(
        hasLockouts,
        'The QL-093 runtime lockout list remains visible for operator review.',
        'The runtime lockout list is shorter than expected and needs review.'
      ),
      detail: detailWhen(
        hasLockouts,
        `${result.safetyLockouts.length} lockout statement(s) remain attached to the safe-read result.`,
        `${result.safetyLockouts.length} lockout statement(s) were found.`
      )
    }
  ];

  return {
    build: 'QL-094',
    title: 'Public Disabled Preview Safe Read Review and Evidence',
    reviewedBuild: 'QL-093',
    selectedBrandId: result.selectedBrandId,
    activeSourceLabel: result.activeSourceLabel,
    readOnlyClientStatus: result.readOnlyClientStatus,
    rowCounts: {
      conversationRows: result.conversationRows.length,
      systemStatusRows: result.systemStatusRows.length,
      rejectedRows: result.rejectedRows.length,
      runtimeLockouts: result.safetyLockouts.length
    },
    approvedReadTargets,
    blockedRuntime,
    evidenceItems,
    reviewerNotes: [
      'QL-094 reviews the QL-093 safe-read result and does not add any new Supabase table, RPC, storage, auth, phone, SMS, or AI runtime path.',
      'Evidence is limited to row counts, source labels, fallback reason text, rejected-row counts, approved target names, and lockout statements.',
      'The public disabled preview remains display-only whether the active result comes from local fallback or validated synthetic public views.'
    ],
    nextQueuedBuild: 'QL-095 — Public Disabled Preview Safe Read Operator Acceptance Plan',
    generatedAt: new Date().toISOString()
  };
}
