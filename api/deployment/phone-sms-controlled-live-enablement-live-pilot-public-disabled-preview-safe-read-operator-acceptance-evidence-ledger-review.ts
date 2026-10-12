export type Ql098DeploymentGuard = {
  build: 'QL-098';
  title: string;
  status: 'ready_for_promotion';
  reviewMode: 'display_only_evidence_ledger_review';
  reviewedBuild: 'QL-097';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  approvedReadTargets: readonly string[];
  approvedProofFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql098DeploymentGuard: Ql098DeploymentGuard = {
  build: 'QL-098',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Review',
  status: 'ready_for_promotion',
  reviewMode: 'display_only_evidence_ledger_review',
  reviewedBuild: 'QL-097',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  approvedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  approvedProofFields: [
    'ledger_build',
    'reviewed_build',
    'selected_brand_label',
    'active_source_label',
    'review_outcome',
    'conversation_row_count',
    'system_status_row_count',
    'rejected_row_count',
    'runtime_lockout_count',
    'checkpoint_summary',
    'blocked_runtime_summary',
    'manual_acceptance_reference',
    'created_at'
  ],
  rejectedPrivateFields: [
    'customer_name',
    'customer_phone',
    'customer_email',
    'provider_payload',
    'raw_rejected_row',
    'message_body',
    'call_recording_url',
    'sms_mms_content',
    'archive_payload',
    'audit_payload'
  ],
  blockedRuntime: [
    'browser writes, inserts, updates, deletes, RPC mutations, storage uploads, and acceptance persistence',
    'live customer/contact/conversation/message/provider payload reads',
    'Phone/SMS provider callbacks, live calls, SMS sending, recordings, archives, consent, audit, admin, or retention writes',
    'AI generation, AI sending, provider delivery, callback registration, and live pilot runtime'
  ],
  verification: [
    'npm install',
    'npm --prefix app run check',
    'npm --prefix app run build',
    'Supabase Preview check on final main',
    'GitHub Pages disabled preview check on final main',
    'Workers Builds: rosevear-comms-hub on final main production commit'
  ],
  nextQueuedBuild: 'QL-099 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Resolution Plan'
};

export function assertQl098DeploymentGuard(): Ql098DeploymentGuard {
  return ql098DeploymentGuard;
}
