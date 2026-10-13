export type Ql105DeploymentGuard = {
  build: 'QL-105';
  status: 'ready_for_promotion';
  decisionMode: 'display_only_readiness_decision';
  readinessDecision: 'ready_to_draft_persistence_implementation_under_new_review';
  implementationPermission: 'not_granted';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  reviewedBuild: 'QL-104';
  reviewedReadTargets: readonly string[];
  retainedNoWriteBoundaries: readonly string[];
  requiredProductionChecks: readonly string[];
};

export const ql105DeploymentGuard: Ql105DeploymentGuard = {
  build: 'QL-105',
  status: 'ready_for_promotion',
  decisionMode: 'display_only_readiness_decision',
  readinessDecision: 'ready_to_draft_persistence_implementation_under_new_review',
  implementationPermission: 'not_granted',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedBuild: 'QL-104',
  reviewedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  retainedNoWriteBoundaries: [
    'No Supabase schema, migration, table, view, index, policy, RPC, insert, update, delete, or storage write is created by QL-105.',
    'No browser submit action, local persistence, manual acceptance save, provider call, Phone/SMS action, callback, archive write, consent write, audit/admin write, retention write, AI generation/send, or live pilot runtime is enabled by QL-105.',
    'QL-105 allows only a later display-only draft plan under review; it grants no implementation permission.'
  ],
  requiredProductionChecks: [
    'app-build on PR head and final main commit',
    'GitHub Pages disabled preview build and deploy on final main commit',
    'Supabase Preview on final main commit',
    'Cloudflare Workers Builds on final main commit'
  ]
};

export function assertQl105DeploymentGuard(): Ql105DeploymentGuard {
  return ql105DeploymentGuard;
}
