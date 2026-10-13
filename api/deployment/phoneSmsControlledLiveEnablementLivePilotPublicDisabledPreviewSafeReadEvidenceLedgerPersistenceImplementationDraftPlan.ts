export type Ql106DeploymentGuard = {
  build: 'QL-106';
  title: string;
  status: 'ready_for_promotion';
  draftMode: 'display_only_implementation_draft_plan';
  implementationPermission: 'not_granted';
  ledgerWriteStatus: 'planned_not_implemented';
  schemaStatus: 'draft_only_not_created';
  routeStatus: 'draft_only_not_created';
  browserWriteStatus: 'disabled';
  supabaseProjectUrl: string;
  allowedReadTargets: readonly string[];
  blockedRuntime: readonly string[];
  retainedBoundary: readonly string[];
  nextQueuedBuild: string;
};

export const ql106DeploymentGuard: Ql106DeploymentGuard = {
  build: 'QL-106',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Draft Plan',
  status: 'ready_for_promotion',
  draftMode: 'display_only_implementation_draft_plan',
  implementationPermission: 'not_granted',
  ledgerWriteStatus: 'planned_not_implemented',
  schemaStatus: 'draft_only_not_created',
  routeStatus: 'draft_only_not_created',
  browserWriteStatus: 'disabled',
  supabaseProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  allowedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  blockedRuntime: [
    'schema creation and migrations',
    'evidence ledger writes and operator acceptance saves',
    'browser submit actions and local persistence',
    'Supabase insert/update/delete/RPC/storage writes',
    'Phone/SMS/callback/provider/archive/consent/audit/retention/AI/live pilot runtime'
  ],
  retainedBoundary: [
    'QL-106 drafts future implementation requirements only.',
    'No schema, route, browser write, database write, queue, job, callback, provider call, or live pilot action is created.',
    'Candidate ledger fields remain future text only and rejected private fields stay excluded.',
    'A later review build must approve this draft before any implementation build is considered.',
    'Production GREEN still requires app-build, Pages build/deploy, Supabase Preview, and Cloudflare Workers on main.'
  ],
  nextQueuedBuild: 'QL-107 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Draft Review'
};

export function assertQl106DeploymentGuard(): Ql106DeploymentGuard {
  return ql106DeploymentGuard;
}
