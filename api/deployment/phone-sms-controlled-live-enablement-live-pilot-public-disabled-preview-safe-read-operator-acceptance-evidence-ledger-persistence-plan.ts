export type Ql101DeploymentGuard = {
  build: 'QL-101';
  title: string;
  status: 'ready_for_promotion';
  persistenceMode: 'plan_only_no_persistence';
  plannedFromBuild: 'QL-100';
  ledgerWriteStatus: 'planned_not_implemented';
  candidateSchemaStatus: 'not_implemented';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  approvedReadTargets: readonly string[];
  candidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  requiredFutureReviewChecks: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql101DeploymentGuard: Ql101DeploymentGuard = {
  build: 'QL-101',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan',
  status: 'ready_for_promotion',
  persistenceMode: 'plan_only_no_persistence',
  plannedFromBuild: 'QL-100',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'not_implemented',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  approvedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  candidateLedgerFields: [
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
  requiredFutureReviewChecks: [
    'review exact Supabase table or view shape before any migration exists',
    'review insert/update/delete/RPC/storage routes before any endpoint exists',
    'review browser submit and acceptance flows before any UI write action exists',
    'review rollback, cleanup, retention, and owner sign-off before implementation',
    'review disabled runtime boundaries after implementation planning and before promotion'
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
  nextQueuedBuild: 'QL-102 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan Review'
};

export function assertQl101DeploymentGuard(): Ql101DeploymentGuard {
  return ql101DeploymentGuard;
}
