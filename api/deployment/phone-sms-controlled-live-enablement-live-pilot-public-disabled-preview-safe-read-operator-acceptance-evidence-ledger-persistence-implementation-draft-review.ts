export type Ql107DeploymentGuard = {
  build: 'QL-107';
  status: 'ready_for_promotion';
  reviewMode: 'display_only_implementation_draft_review';
  implementationPermission: 'not_granted';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  reviewedBuild: 'QL-106';
  approvedReadTargets: readonly string[];
  rejectedWriteTargets: readonly string[];
  reviewedDraftAreas: readonly string[];
  requiredProductionChecks: readonly string[];
};

export const ql107DeploymentGuard: Ql107DeploymentGuard = {
  build: 'QL-107',
  status: 'ready_for_promotion',
  reviewMode: 'display_only_implementation_draft_review',
  implementationPermission: 'not_granted',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedBuild: 'QL-106',
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
  reviewedDraftAreas: [
    'QL-106 schema draft review',
    'QL-106 write-route draft review',
    'QL-106 browser confirmation draft review',
    'QL-106 retention and cleanup draft review',
    'QL-106 rollback and emergency disable draft review',
    'QL-106 owner approval and production verification gate review'
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

export function assertQl107DeploymentGuard(guard: Ql107DeploymentGuard = ql107DeploymentGuard) {
  if (guard.build !== 'QL-107') {
    throw new Error('QL-107 deployment guard expected build QL-107.');
  }

  if (guard.implementationPermission !== 'not_granted') {
    throw new Error('QL-107 must not grant implementation permission.');
  }

  if (guard.rejectedWriteTargets.length < 4) {
    throw new Error('QL-107 deployment guard must retain all rejected write targets.');
  }

  return guard;
}
