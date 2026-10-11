export type Ql094DeploymentGuard = {
  build: 'QL-094';
  title: string;
  status: 'ready_for_promotion';
  reviewMode: 'safe_read_review_evidence_only';
  reviewedBuild: 'QL-093';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  approvedReadTargets: readonly string[];
  evidenceSurfaces: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
  nextQueuedBuild: string;
};

export const ql094DeploymentGuard: Ql094DeploymentGuard = {
  build: 'QL-094',
  title: 'Public Disabled Preview Safe Read Review and Evidence',
  status: 'ready_for_promotion',
  reviewMode: 'safe_read_review_evidence_only',
  reviewedBuild: 'QL-093',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  approvedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  evidenceSurfaces: [
    'selected-brand conversation row count',
    'system status row count',
    'rejected-row count and bounded reasons already shown by QL-093',
    'active source label and read-only client status',
    'fallback reason text without raw payload exposure',
    'visible runtime lockout list'
  ],
  blockedRuntime: [
    'browser writes, inserts, updates, deletes, RPC mutations, storage uploads, and session persistence',
    'live customer/contact/conversation/message/provider payload reads',
    'Phone/SMS provider callbacks, live calls, SMS sending, recordings, archives, consent, audit, admin, or retention writes',
    'AI generation, AI sending, provider delivery, callback registration, and live pilot runtime'
  ],
  verification: [
    'npm install',
    'npm --prefix app run check',
    'npm --prefix app run build',
    'Supabase Preview check',
    'GitHub Pages disabled preview check when posted',
    'Workers Builds: rosevear-comms-hub on final main production commit'
  ],
  nextQueuedBuild: 'QL-095 — Public Disabled Preview Safe Read Operator Acceptance Plan'
};

export function assertQl094DeploymentGuard(): Ql094DeploymentGuard {
  return ql094DeploymentGuard;
}
