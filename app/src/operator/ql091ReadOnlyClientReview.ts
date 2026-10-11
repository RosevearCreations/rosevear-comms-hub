import {
  allowedReadOnlySources,
  blockedBrowserSources,
  expectedSupabaseProjectUrl,
  readOnlyFallbackRules
} from '../integrations/supabaseReadOnlyClient';

export const ql091ReadOnlyClientReview = {
  buildId: 'QL-091',
  title: 'Public Disabled Preview Browser-Safe Supabase Read-Only Client Review',
  expectedProjectUrl: expectedSupabaseProjectUrl,
  reviewOutcome: 'ready_for_disabled_preview_review',
  runtimePosture: 'disabled_by_default',
  clientGateChecks: [
    'VITE_SUPABASE_URL must match the expected rosevearcreations Supabase project URL.',
    'VITE_SUPABASE_ANON_KEY must be present before any browser client can be created.',
    'VITE_QL_ENABLE_SUPABASE_READS must equal true before any browser client can be created.',
    'Auth sessions are not persisted, auto-refreshed, or detected from the URL in the public disabled preview.'
  ],
  allowedReadOnlySources,
  blockedBrowserSources,
  fallbackRules: readOnlyFallbackRules,
  blockedRuntimePaths: [
    'live customer reads',
    'provider payload reads',
    'database writes',
    'phone or SMS runtime',
    'callback registration',
    'archive writes',
    'retention writes',
    'AI send actions',
    'live pilot runtime'
  ],
  nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan'
} as const;

export type Ql091ReadOnlyClientReview = typeof ql091ReadOnlyClientReview;
