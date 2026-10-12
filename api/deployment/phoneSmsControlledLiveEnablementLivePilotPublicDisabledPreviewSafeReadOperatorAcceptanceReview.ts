export type Ql096DeploymentGuard = {
  build: 'QL-096';
  title: string;
  status: 'ready_for_promotion';
  reviewMode: 'display_only_operator_review';
  reviewedBuild: 'QL-095';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  approvedReadTargets: readonly string[];
  reviewSurfaces: readonly string[];
  retainedBoundaries: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql096DeploymentGuard: Ql096DeploymentGuard = {
  build: 'QL-096',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Review',
  status: 'ready_for_promotion',
  reviewMode: 'display_only_operator_review',
  reviewedBuild: 'QL-095',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  approvedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  reviewSurfaces: [
    'QL-096 review summary card',
    'QL-095 acceptance plan under review card',
    'source and row evidence review checkpoint',
    'runtime lockout review checkpoint',
    'manual sign-off boundary review checkpoint',
    'next-build gate review checkpoint'
  ],
  retainedBoundaries: [
    'display-only browser review',
    'no acceptance persistence',
    'no live customer/contact/provider payload reads',
    'no browser writes, RPC mutations, storage uploads, webhooks, callbacks, or audit inserts',
    'manual acceptance remains outside the browser preview'
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
    'Supabase Preview check',
    'GitHub Pages disabled preview check when posted',
    'Workers Builds: rosevear-comms-hub on final main production commit'
  ],
  nextQueuedBuild: 'QL-097 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Plan'
};

export function assertQl096DeploymentGuard(): Ql096DeploymentGuard {
  return ql096DeploymentGuard;
}
