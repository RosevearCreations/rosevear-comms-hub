export type Ql102DeploymentGuard = {
  build: 'QL-102';
  title: string;
  status: 'ready_for_promotion';
  reviewedBuild: 'QL-101';
  reviewMode: 'display_only_persistence_plan_review';
  ledgerWriteStatus: 'planned_not_implemented';
  candidateSchemaStatus: 'not_implemented';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  reviewedReadTargets: readonly string[];
  reviewedPersistenceScope: readonly string[];
  retainedNoWriteBoundaries: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql102DeploymentGuard: Ql102DeploymentGuard = {
  build: 'QL-102',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan Review',
  status: 'ready_for_promotion',
  reviewedBuild: 'QL-101',
  reviewMode: 'display_only_persistence_plan_review',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'not_implemented',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  reviewedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  reviewedPersistenceScope: [
    'Review QL-101 plan-only persistence boundary.',
    'Review bounded candidate proof fields without implementing a schema.',
    'Review rejected private-field exclusions before any future ledger shape.',
    'Review future rollback, retention, cleanup, and owner gates.',
    'Review runtime lockouts before any later implementation plan.'
  ],
  retainedNoWriteBoundaries: [
    'No Supabase table, migration, view, RPC, insert, update, delete, or storage upload.',
    'No browser submit handler, local persistence, acceptance save, provider call, Phone/SMS send, or callback registration.',
    'No live customer, contact, provider, archive, consent, audit, admin, retention, AI generation, AI send, or live pilot runtime.',
    'Future persistence implementation planning must be a separate reviewed build with its own production checks.'
  ],
  blockedRuntime: [
    'Phone/SMS runtime remains disabled.',
    'Provider delivery and callbacks remain disabled.',
    'Archives, consent, audit/admin, and retention writes remain disabled.',
    'AI generation/send and live pilot runtime remain disabled.'
  ],
  verification: [
    'npm install',
    'npm --prefix app run check',
    'npm --prefix app run build',
    'Supabase Preview check on final main commit',
    'GitHub Pages disabled preview build/deploy on final main commit',
    'Cloudflare Workers Builds check on final main commit'
  ],
  nextQueuedBuild: 'QL-103 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan'
};

export function assertQl102DeploymentGuard(guard: Ql102DeploymentGuard = ql102DeploymentGuard): Ql102DeploymentGuard {
  if (guard.build !== 'QL-102') {
    throw new Error('QL-102 deployment guard expected.');
  }

  if (guard.ledgerWriteStatus !== 'planned_not_implemented' || guard.candidateSchemaStatus !== 'not_implemented') {
    throw new Error('QL-102 must remain non-persistent.');
  }

  return guard;
}
