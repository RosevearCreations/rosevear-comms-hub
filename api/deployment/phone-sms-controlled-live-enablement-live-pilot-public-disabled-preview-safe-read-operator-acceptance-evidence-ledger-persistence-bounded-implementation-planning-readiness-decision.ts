export type Ql110DeploymentGuard = {
  build: 'QL-110';
  status: 'ready_for_promotion';
  decisionMode: 'display_only_bounded_implementation_planning_readiness_decision';
  implementationPermission: 'not_granted';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  reviewedBuild: 'QL-109';
  approvedReadTargets: readonly string[];
  rejectedWriteTargets: readonly string[];
  approvedPlanningScope: readonly string[];
  requiredProductionChecks: readonly string[];
};

export const ql110DeploymentGuard: Ql110DeploymentGuard = {
  build: 'QL-110',
  status: 'ready_for_promotion',
  decisionMode: 'display_only_bounded_implementation_planning_readiness_decision',
  implementationPermission: 'not_granted',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedBuild: 'QL-109',
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
  approvedPlanningScope: [
    'bounded implementation plan draft may be prepared only by a later build',
    'future draft must stay disabled by default and fail closed',
    'future draft must keep rejected private fields excluded',
    'future draft must include rollback, purge, emergency disable, owner approval, and exact production gates',
    'QL-110 grants no implementation, persistence, or runtime authority'
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

export function assertQl110DeploymentGuard(guard: Ql110DeploymentGuard = ql110DeploymentGuard) {
  if (guard.build !== 'QL-110') {
    throw new Error('QL-110 deployment guard expected build QL-110.');
  }

  if (guard.implementationPermission !== 'not_granted') {
    throw new Error('QL-110 must not grant implementation permission.');
  }

  if (guard.rejectedWriteTargets.length < 4) {
    throw new Error('QL-110 deployment guard must retain all rejected write targets.');
  }

  return guard;
}
