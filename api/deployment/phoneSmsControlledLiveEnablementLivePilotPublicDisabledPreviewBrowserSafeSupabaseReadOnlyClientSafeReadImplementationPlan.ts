export type Ql092DeploymentGuard = {
  build: 'QL-092';
  title: string;
  status: 'ready_for_promotion';
  planOnly: true;
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  allowedReadTargets: readonly string[];
  requiredGates: readonly string[];
  requiredValidation: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
};

export const ql092DeploymentGuard: Ql092DeploymentGuard = {
  build: 'QL-092',
  title: 'Public Disabled Preview Browser-Safe Supabase Read-Only Client Safe Read Implementation Plan',
  status: 'ready_for_promotion',
  planOnly: true,
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  allowedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  requiredGates: [
    'VITE_SUPABASE_URL must be configured and must match the expected project URL.',
    'VITE_SUPABASE_ANON_KEY must be configured before any browser client can be created.',
    'VITE_QL_ENABLE_SUPABASE_READS must be exactly true before the read-only client can be created.',
    'Missing env, unexpected project URL, disabled read flag, read error, or validation failure must keep local synthetic fallback data active.'
  ],
  requiredValidation: [
    'Conversation rows require id, brand_id, brand_name, title, status, summary, draft, and created_at strings before use.',
    'System status rows require id, label, status, detail, and created_at fields before use.',
    'System status must remain ready, blocked, or planned.',
    'Unknown brand ids, unknown samples, unexpected row shapes, arrays from unexpected sources, or oversized strings must be discarded.',
    'Validated remote rows may only hydrate display-only synthetic preview state in the next implementation build.'
  ],
  blockedRuntime: [
    'live customer/contact/conversation/message reads',
    'provider payload reads',
    'SMS/call/recording reads or sends',
    'archive, retention, audit, admin, or consent mutation paths',
    'browser writes or Supabase mutations',
    'AI send or live pilot runtime'
  ],
  verification: [
    'npm install',
    'npm run check',
    'npm run build',
    'Supabase Preview check',
    'GitHub Pages disabled preview checks',
    'Cloudflare Worker build check'
  ]
};

export function assertQl092DeploymentGuard(): Ql092DeploymentGuard {
  return ql092DeploymentGuard;
}
