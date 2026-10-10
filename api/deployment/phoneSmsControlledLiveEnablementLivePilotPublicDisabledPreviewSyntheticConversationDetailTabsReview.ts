export type Ql087ReviewStatus =
  | 'ready_for_safe_testing'
  | 'blocked_live_runtime_requested'
  | 'blocked_missing_cloudflare_config'
  | 'blocked_missing_supabase_scaffold';

export type Ql087ReviewInput = {
  build: 'QL-087';
  cloudflareWorkerUrl: string;
  supabaseProjectUrl: string;
  hasWranglerStaticAssetsConfig: boolean;
  hasSupabaseFolder: boolean;
  hasSafeMigration: boolean;
  hasStatusFunction: boolean;
  requestsLivePhoneSmsRuntime?: boolean;
  requestsProviderCallbacks?: boolean;
  requestsLiveCustomerData?: boolean;
};

export type Ql087ReviewResult = {
  status: Ql087ReviewStatus;
  approvedNextBuild: 'QL-088-cloudflare-and-supabase-live-readiness-review' | null;
  message: string;
  safetyBoundary: string[];
};

const safetyBoundary = [
  'Phone/SMS runtime remains disabled.',
  'Provider callbacks remain disabled.',
  'Live customer records remain disabled.',
  'Archive and retention writes remain disabled.',
  'Supabase scaffold may be deployed for safe synthetic testing only.',
  'Cloudflare Worker static assets may be deployed for static app hosting only.'
];

export function reviewQl087Readiness(input: Ql087ReviewInput): Ql087ReviewResult {
  if (input.requestsLivePhoneSmsRuntime || input.requestsProviderCallbacks || input.requestsLiveCustomerData) {
    return {
      status: 'blocked_live_runtime_requested',
      approvedNextBuild: null,
      message: 'QL-087 blocks live communications/runtime requests. Use synthetic Cloudflare/Supabase testing first.',
      safetyBoundary
    };
  }

  if (!input.hasWranglerStaticAssetsConfig || !input.cloudflareWorkerUrl.includes('workers.dev')) {
    return {
      status: 'blocked_missing_cloudflare_config',
      approvedNextBuild: null,
      message: 'Cloudflare Worker static-assets readiness requires wrangler.jsonc and the connected workers.dev target.',
      safetyBoundary
    };
  }

  if (!input.hasSupabaseFolder || !input.hasSafeMigration || !input.hasStatusFunction || !input.supabaseProjectUrl.includes('gxujcwpktaickcgzyvnu')) {
    return {
      status: 'blocked_missing_supabase_scaffold',
      approvedNextBuild: null,
      message: 'Supabase readiness requires a root supabase/ folder, safe migration, status function, and the rosevearcreations project URL.',
      safetyBoundary
    };
  }

  return {
    status: 'ready_for_safe_testing',
    approvedNextBuild: 'QL-088-cloudflare-and-supabase-live-readiness-review',
    message: 'QL-087 is ready for safe Cloudflare static-assets and Supabase synthetic-data testing after promotion.',
    safetyBoundary
  };
}
