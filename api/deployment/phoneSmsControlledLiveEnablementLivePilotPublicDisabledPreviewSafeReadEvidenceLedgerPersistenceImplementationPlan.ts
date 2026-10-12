export type Ql103DeploymentGuard = {
  build: 'QL-103';
  title: string;
  status: 'ready_for_promotion';
  plannedFromBuild: 'QL-102';
  implementationPlanMode: 'plan_only_no_implementation';
  ledgerWriteStatus: 'planned_not_implemented';
  candidateSchemaStatus: 'planned_not_implemented';
  endpointImplementationStatus: 'not_implemented';
  browserWriteStatus: 'disabled';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  plannedReadTargets: readonly string[];
  implementationPlanScope: readonly string[];
  retainedNoWriteBoundaries: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql103DeploymentGuard: Ql103DeploymentGuard = {
  build: 'QL-103',
  title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan',
  status: 'ready_for_promotion',
  plannedFromBuild: 'QL-102',
  implementationPlanMode: 'plan_only_no_implementation',
  ledgerWriteStatus: 'planned_not_implemented',
  candidateSchemaStatus: 'planned_not_implemented',
  endpointImplementationStatus: 'not_implemented',
  browserWriteStatus: 'disabled',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  plannedReadTargets: ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'],
  implementationPlanScope: [
    'Plan bounded future schema shape after QL-102 review.',
    'Plan future disabled-by-default write route contract without adding the route.',
    'Plan future browser operator acceptance flow without adding submit controls.',
    'Plan retention, cleanup, rollback, and owner approval before implementation.',
    'Retain runtime lockouts and public disabled preview safe-read boundaries.'
  ],
  retainedNoWriteBoundaries: [
    'No Supabase table, migration, view, index, RLS policy, RPC, insert, update, delete, or storage upload.',
    'No API route, browser submit handler, local persistence, operator acceptance save, provider call, Phone/SMS send, or callback registration.',
    'No live customer, contact, provider, archive, consent, audit, admin, retention, AI generation, AI send, or live pilot runtime.',
    'Future persistence implementation must be a separate reviewed build with its own production checks.'
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
  nextQueuedBuild: 'QL-104 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan Review'
};

export function assertQl103DeploymentGuard(guard: Ql103DeploymentGuard = ql103DeploymentGuard): Ql103DeploymentGuard {
  if (guard.build !== 'QL-103') {
    throw new Error('QL-103 deployment guard expected.');
  }

  if (
    guard.implementationPlanMode !== 'plan_only_no_implementation' ||
    guard.ledgerWriteStatus !== 'planned_not_implemented' ||
    guard.candidateSchemaStatus !== 'planned_not_implemented' ||
    guard.endpointImplementationStatus !== 'not_implemented' ||
    guard.browserWriteStatus !== 'disabled'
  ) {
    throw new Error('QL-103 must remain implementation-plan only.');
  }

  return guard;
}
