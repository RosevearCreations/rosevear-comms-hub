export type Ql111DeploymentGuard = {
  build: 'QL-111';
  status: 'ready_for_promotion';
  planMode: 'display_only_bounded_implementation_plan_draft';
  implementationPermission: 'not_granted';
  implementationPlanStatus: 'draft_only_no_write_authority';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  sourceBuild: 'QL-110';
  approvedReadTargets: readonly string[];
  rejectedWriteTargets: readonly string[];
  draftPlanSurfaces: readonly string[];
  requiredProductionChecks: readonly string[];
};

export const ql111DeploymentGuard: Ql111DeploymentGuard = {
  build: 'QL-111',
  status: 'ready_for_promotion',
  planMode: 'display_only_bounded_implementation_plan_draft',
  implementationPermission: 'not_granted',
  implementationPlanStatus: 'draft_only_no_write_authority',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  sourceBuild: 'QL-110',
  approvedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  rejectedWriteTargets: [
    'Supabase migrations, tables, views, policies, indexes, RPC functions, storage objects, inserts, updates, deletes, and acceptance rows',
    'write-capable Worker routes, handlers, bindings, queues, browser submit controls, hidden controls, local persistence, or acceptance saves',
    'Phone/SMS provider runtime, callbacks, sends, inbound handling, recordings, DTMF, consent writes, and live pilot runtime',
    'archive, audit/admin, retention, cleanup, purge, rollback automation, and AI generation/send writes'
  ],
  draftPlanSurfaces: [
    'candidate ledger table draft text only',
    'candidate dry-run route contract draft text only',
    'candidate browser copy and single-flight control draft text only',
    'rollback, purge, emergency disable, owner approval, and production gate draft text only',
    'QL-111 grants no implementation, persistence, or runtime authority'
  ],
  requiredProductionChecks: [
    'npm install',
    'npm --prefix app run check',
    'npm --prefix app run build',
    'GitHub Pages disabled preview build on final main commit',
    'GitHub Pages disabled preview deploy on final main commit',
    'Supabase Preview on final main commit',
    'Cloudflare Workers Builds on final main commit'
  ]
};

export function assertQl111DeploymentGuard(guard: Ql111DeploymentGuard = ql111DeploymentGuard) {
  if (guard.build !== 'QL-111') {
    throw new Error('QL-111 deployment guard expected build QL-111.');
  }

  if (guard.implementationPermission !== 'not_granted') {
    throw new Error('QL-111 must not grant implementation permission.');
  }

  if (guard.implementationPlanStatus !== 'draft_only_no_write_authority') {
    throw new Error('QL-111 must remain a draft-only plan without write authority.');
  }

  if (guard.rejectedWriteTargets.length < 4) {
    throw new Error('QL-111 deployment guard must retain all rejected write targets.');
  }

  return guard;
}
