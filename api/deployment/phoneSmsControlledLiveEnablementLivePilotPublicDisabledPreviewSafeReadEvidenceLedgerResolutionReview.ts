export type Ql100DeploymentGuard = {
  build: 'QL-100';
  title: string;
  status: 'ready_for_promotion';
  reviewMode: 'display_only_resolution_review';
  reviewedBuild: 'QL-099';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  approvedReadTargets: readonly string[];
  reviewScope: readonly string[];
  deferredWriteRequirements: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql100DeploymentGuard: Ql100DeploymentGuard = {
  build: 'QL-100',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Resolution Review',
  status: 'ready_for_promotion',
  reviewMode: 'display_only_resolution_review',
  reviewedBuild: 'QL-099',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  approvedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  reviewScope: [
    'review QL-099 resolution plan mode and write status',
    'review resolution items for blocked or unresolved decisions',
    'review approved proof fields and rejected private fields',
    'review deferred write gate and retained runtime lockouts',
    'review safe-read evidence visibility without creating persistence'
  ],
  deferredWriteRequirements: [
    'no Supabase table, migration, RPC function, insert, update, delete, or storage upload',
    'no browser submit handler, local persistence, acceptance save action, provider call, Phone/SMS send, or callback registration',
    'future persistence planning must restate schema, rollback, retention, operator ownership, and excluded fields',
    'manual operator acceptance remains outside the public disabled preview'
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
  nextQueuedBuild: 'QL-101 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan'
};

export function assertQl100DeploymentGuard(): Ql100DeploymentGuard {
  return ql100DeploymentGuard;
}
