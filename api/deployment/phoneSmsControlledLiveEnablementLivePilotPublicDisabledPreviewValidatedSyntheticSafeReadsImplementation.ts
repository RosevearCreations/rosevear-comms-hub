export type Ql093DeploymentGuard = {
  build: 'QL-093';
  title: string;
  status: 'ready_for_promotion';
  implementationMode: 'validated_display_only_safe_reads';
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  allowedReadTargets: readonly string[];
  requiredGates: readonly string[];
  validationRules: readonly string[];
  fallbackRules: readonly string[];
  blockedRuntime: readonly string[];
  verification: readonly string[];
};

export const ql093DeploymentGuard: Ql093DeploymentGuard = {
  build: 'QL-093',
  title: 'Public Disabled Preview Validated Synthetic Safe Reads Implementation',
  status: 'ready_for_promotion',
  implementationMode: 'validated_display_only_safe_reads',
  expectedProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  allowedReadTargets: [
    'public.ql_public_synthetic_conversations',
    'public.ql_public_system_status'
  ],
  requiredGates: [
    'VITE_SUPABASE_URL must match the expected project URL before a browser client can be created.',
    'VITE_SUPABASE_ANON_KEY must be configured before a browser client can be created.',
    'VITE_QL_ENABLE_SUPABASE_READS must be exactly true before any Supabase safe read can run.',
    'Auth persistence, session detection, token refresh, browser writes, and storage mutation remain disabled.'
  ],
  validationRules: [
    'Conversation rows are accepted only with id, brand_id, brand_name, title, status, summary, draft, and created_at.',
    'Brand ids must map to approved disabled-preview brands only: rosie/rosiedazzlers or devil/devilndove.',
    'Rows for another brand are discarded from the selected-brand preview state.',
    'System status rows are accepted only with id, label, status, detail, and created_at.',
    'System status must be ready, blocked, or planned.',
    'Unexpected fields, blocked live/private fields, malformed ids, empty strings, oversized display strings, unsafe status tokens, or bad dates are discarded.'
  ],
  fallbackRules: [
    'Missing env, disabled gate, unexpected project URL, read errors, or validation failure keep local synthetic fallback rows visible.',
    'Partial validated reads can display validated rows for one surface while the other surface uses local fallback rows.',
    'Rejected row reasons are display-only and limited so the public preview does not leak raw payloads.'
  ],
  blockedRuntime: [
    'live customer/contact/conversation/message reads',
    'provider payload reads',
    'Phone/SMS/call/recording reads or sends',
    'archive, retention, audit, admin, or consent mutation paths',
    'browser writes or Supabase mutations',
    'AI generation, AI send, provider delivery, callback registration, or live pilot runtime'
  ],
  verification: [
    'npm install',
    'npm run check',
    'npm run build',
    'Supabase Preview check',
    'GitHub Pages disabled preview checks when posted',
    'Cloudflare Worker build check'
  ]
};

export function assertQl093DeploymentGuard(): Ql093DeploymentGuard {
  return ql093DeploymentGuard;
}
