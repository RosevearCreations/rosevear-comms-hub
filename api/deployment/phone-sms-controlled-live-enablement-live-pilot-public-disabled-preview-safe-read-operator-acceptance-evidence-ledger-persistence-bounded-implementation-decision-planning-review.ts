export type Ql109DeploymentGuard = {
  build: 'QL-109';
  status: 'ready_for_promotion';
  reviewMode: 'display_only_bounded_implementation_decision_planning_review';
  implementationPermission: 'not_granted';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  reviewedBuild: 'QL-108';
  approvedReadTargets: readonly string[];
  rejectedWriteTargets: readonly string[];
  reviewedPlanningAreas: readonly string[];
  requiredProductionChecks: readonly string[];
};

export const ql109DeploymentGuard: Ql109DeploymentGuard = {
  build: 'QL-109',
  status: 'ready_for_promotion',
  reviewMode: 'display_only_bounded_implementation_decision_planning_review',
  implementationPermission: 'not_granted',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedBuild: 'QL-108',
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
  reviewedPlanningAreas: [
    'QL-108 bounded implementation decision principles',
    'QL-108 required owner approvals',
    'QL-108 required decision evidence',
    'QL-108 required failure dispositions',
    'QL-108 non-negotiable implementation boundaries',
    'QL-108 candidate/rejected field boundary and no-write runtime locks'
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

export function assertQl109DeploymentGuard(guard: Ql109DeploymentGuard = ql109DeploymentGuard) {
  if (guard.build !== 'QL-109') {
    throw new Error('QL-109 deployment guard expected build QL-109.');
  }

  if (guard.implementationPermission !== 'not_granted') {
    throw new Error('QL-109 must not grant implementation permission.');
  }

  if (guard.rejectedWriteTargets.length < 4) {
    throw new Error('QL-109 deployment guard must retain all rejected write targets.');
  }

  return guard;
}
