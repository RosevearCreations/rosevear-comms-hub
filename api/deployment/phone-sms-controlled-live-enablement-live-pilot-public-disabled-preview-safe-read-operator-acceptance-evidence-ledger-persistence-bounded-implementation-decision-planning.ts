export type Ql108DeploymentGuard = {
  build: 'QL-108';
  status: 'ready_for_promotion';
  planningMode: 'display_only_bounded_implementation_decision_planning';
  implementationPermission: 'not_granted';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  reviewedBuild: 'QL-107';
  approvedReadTargets: readonly string[];
  rejectedWriteTargets: readonly string[];
  boundedDecisionPlanningAreas: readonly string[];
  requiredProductionChecks: readonly string[];
};

export const ql108DeploymentGuard: Ql108DeploymentGuard = {
  build: 'QL-108',
  status: 'ready_for_promotion',
  planningMode: 'display_only_bounded_implementation_decision_planning',
  implementationPermission: 'not_granted',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedBuild: 'QL-107',
  approvedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  rejectedWriteTargets: [
    'Supabase migrations, tables, views, policies, indexes, RPC functions, storage objects, inserts, updates, deletes, and acceptance rows',
    'browser acceptance save buttons, local persistence, hidden write controls, or submit handlers',
    'Phone/SMS provider runtime, callbacks, sends, inbound handling, recordings, DTMF, consent writes, and live pilot runtime',
    'archive, audit/admin, retention, cleanup, purge, rollback automation, and AI generation/send writes'
  ],
  boundedDecisionPlanningAreas: [
    'QL-107 input readiness and review-summary clearance',
    'implementation permission lock and disabled-by-default requirement',
    'candidate field and rejected private field boundary preservation',
    'route, browser, schema, retention, rollback, and owner-approval decision criteria',
    'production verification, failure disposition, rollback, purge, and emergency-disable gate planning'
  ],
  requiredProductionChecks: [
    'npm install',
    'npm --prefix app run check',
    'npm --prefix app run build',
    'GitHub Pages disabled preview build on final main commit when it posts',
    'GitHub Pages disabled preview deploy on final main commit when it posts',
    'Supabase Preview on final main commit when it posts',
    'Cloudflare Workers Builds on final main commit'
  ]
};

export function assertQl108DeploymentGuard(guard: Ql108DeploymentGuard = ql108DeploymentGuard) {
  if (guard.build !== 'QL-108') {
    throw new Error('QL-108 deployment guard expected build QL-108.');
  }

  if (guard.implementationPermission !== 'not_granted') {
    throw new Error('QL-108 must not grant implementation permission.');
  }

  if (guard.rejectedWriteTargets.length < 4) {
    throw new Error('QL-108 deployment guard must retain all rejected write targets.');
  }

  return guard;
}
