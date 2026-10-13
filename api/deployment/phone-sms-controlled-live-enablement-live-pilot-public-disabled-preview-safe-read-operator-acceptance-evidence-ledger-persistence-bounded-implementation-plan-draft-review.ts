export type Ql112DeploymentGuard = {
  build: 'QL-112';
  status: 'ready_for_promotion';
  reviewMode: 'display_only_bounded_implementation_plan_draft_review';
  implementationPermission: 'not_granted';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  reviewedBuild: 'QL-111';
  approvedReadTargets: readonly string[];
  rejectedWriteTargets: readonly string[];
  approvedReviewScope: readonly string[];
  requiredProductionChecks: readonly string[];
};

export const ql112DeploymentGuard: Ql112DeploymentGuard = {
  build: 'QL-112',
  status: 'ready_for_promotion',
  reviewMode: 'display_only_bounded_implementation_plan_draft_review',
  implementationPermission: 'not_granted',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedBuild: 'QL-111',
  approvedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  rejectedWriteTargets: [
    'Supabase migrations, tables, views, policies, indexes, RPC functions, storage objects, inserts, updates, deletes, and acceptance rows',
    'browser acceptance save buttons, local persistence, hidden write controls, submit handlers, and evidence ledger writes',
    'Phone/SMS provider runtime, callbacks, sends, inbound handling, recordings, DTMF, consent writes, and live pilot runtime',
    'archive, audit/admin, retention, cleanup, purge, rollback automation, and AI generation/send writes'
  ],
  approvedReviewScope: [
    'review QL-111 draft sections for owner-decision planning readiness only',
    'retain implementationPermission not_granted and implementationCandidateStatus not_approved',
    'retain disabled-by-default, dry-run-first, fail-closed, rollback, purge, emergency disable, and owner approval requirements',
    'retain rejected private field exclusions from every schema, route, browser, log, archive, audit, retention, export, and evidence surface',
    'QL-112 grants no implementation, persistence, or runtime authority'
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

export function assertQl112DeploymentGuard(guard: Ql112DeploymentGuard = ql112DeploymentGuard) {
  if (guard.build !== 'QL-112') {
    throw new Error('QL-112 deployment guard expected build QL-112.');
  }

  if (guard.implementationPermission !== 'not_granted') {
    throw new Error('QL-112 must not grant implementation permission.');
  }

  if (guard.rejectedWriteTargets.length < 4) {
    throw new Error('QL-112 deployment guard must retain all rejected write targets.');
  }

  return guard;
}
