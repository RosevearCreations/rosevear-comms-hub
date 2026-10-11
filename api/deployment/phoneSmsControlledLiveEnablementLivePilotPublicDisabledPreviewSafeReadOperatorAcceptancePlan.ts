export type Ql095DeploymentGuard = {
  build: 'QL-095';
  title: string;
  status: 'ready_for_promotion';
  acceptanceMode: 'operator_plan_only';
  reviewedBuild: 'QL-094';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  approvedReadTargets: readonly string[];
  acceptanceSurfaces: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql095DeploymentGuard: Ql095DeploymentGuard = {
  build: 'QL-095',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Plan',
  status: 'ready_for_promotion',
  acceptanceMode: 'operator_plan_only',
  reviewedBuild: 'QL-094',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  approvedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  acceptanceSurfaces: [
    'operator acceptance summary card',
    'manual sign-off warning that the browser preview does not store acceptance',
    'brand selection confirmation prompt',
    'active source and row-count acceptance prompts',
    'fallback and rejected-row diagnostic review prompt',
    'runtime lockout confirmation prompt'
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
  nextQueuedBuild: 'QL-096 — Public Disabled Preview Safe Read Operator Acceptance Review'
};

export function assertQl095DeploymentGuard(): Ql095DeploymentGuard {
  return ql095DeploymentGuard;
}
