export type Ql104DeploymentGuard = {
  build: 'QL-104';
  title: string;
  reviewedBuild: 'QL-103';
  status: 'ready_for_promotion';
  reviewMode: 'display_only_implementation_plan_review';
  ledgerWriteStatus: 'planned_not_implemented';
  candidateSchemaStatus: 'planned_not_implemented';
  endpointImplementationStatus: 'not_implemented';
  browserWriteStatus: 'disabled';
  expectedProjectUrl: string;
  approvedReadTargets: readonly string[];
  rejectedWriteTargets: readonly string[];
  reviewedCandidateLedgerFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  implementationReadinessDecisionGates: readonly string[];
  blockedRuntime: readonly string[];
  requiredProductionChecks: readonly string[];
  nextQueuedBuild: string;
};

export const ql104DeploymentGuard: Ql104DeploymentGuard = {
  build: 'QL-104',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan Review',
  reviewedBuild: 'QL-103',
  status: 'ready_for_promotion',
  reviewMode: 'display_only_implementation_plan_review',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'planned_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  approvedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  rejectedWriteTargets: [
    'browser acceptance persistence',
    'Supabase table/view/migration/RPC/storage writes',
    'Phone/SMS provider callbacks and sends',
    'archive/consent/audit/admin/retention writes',
    'AI generation/send/provider delivery/live pilot runtime'
  ],
  reviewedCandidateLedgerFields: [
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
  implementationReadinessDecisionGates: [
    'Decision build must explicitly decide whether implementation can be drafted.',
    'Future implementation must restate exact schema, route, validation, browser flow, retention, rollback, and owner approval.',
    'Future implementation must keep Phone/SMS, provider callbacks, archives, consent, audit/admin, AI, and live pilot disabled unless separately approved.',
    'Future implementation must include rollback and purge instructions before any write path is merged.',
    'Future implementation must pass app-build, Pages build/deploy, Supabase Preview, and Cloudflare Workers checks on main.'
  ],
  blockedRuntime: [
    'Browser writes, Supabase mutations, RPC writes, storage writes, and acceptance persistence remain disabled.',
    'Live customer/contact/conversation/message/provider payload reads remain disabled.',
    'Phone/SMS provider callbacks, live calls, SMS sends, recordings, archives, consent, audit/admin, and retention writes remain disabled.',
    'AI generation, AI sending, provider delivery, callback registration, and live pilot runtime remain disabled.'
  ],
  requiredProductionChecks: [
    'npm install',
    'npm --prefix app run check',
    'npm --prefix app run build',
    'GitHub Pages disabled preview build and deploy on final main',
    'Supabase Preview on final main',
    'Cloudflare Workers Builds: rosevear-comms-hub on final main'
  ],
  nextQueuedBuild: 'QL-105 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Readiness Decision'
};

export function assertQl104DeploymentGuard(guard: Ql104DeploymentGuard = ql104DeploymentGuard): Ql104DeploymentGuard {
  if (guard.build !== 'QL-104') {
    throw new Error('QL-104 deployment guard is required.');
  }

  if (
    guard.ledgerWriteStatus !== 'planned_not_implemented' ||
    guard.candidateSchemaStatus !== 'planned_not_implemented' ||
    guard.endpointImplementationStatus !== 'not_implemented' ||
    guard.browserWriteStatus !== 'disabled'
  ) {
    throw new Error('QL-104 must remain display-only with no persistence implementation.');
  }

  return guard;
}
