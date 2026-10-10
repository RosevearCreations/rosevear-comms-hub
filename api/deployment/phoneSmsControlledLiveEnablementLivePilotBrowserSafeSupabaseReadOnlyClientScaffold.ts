export type BrowserSafeSupabaseReadOnlyClientScaffoldStatus =
  | 'browser_safe_supabase_read_only_client_scaffold_ready'
  | 'blocked_unexpected_supabase_project'
  | 'blocked_missing_env_fallback_required'
  | 'blocked_unsafe_read_source'
  | 'blocked_write_or_live_runtime_enabled';

export type BrowserSafeSupabaseReadOnlyClientScaffoldDecision =
  | 'approve_read_only_scaffold'
  | 'fallback_to_local_synthetic_samples'
  | 'block_runtime_activation';

export type BrowserSafeSupabaseReadOnlyClientScaffoldEnvironment = {
  buildId: 'QL-090';
  expectedSupabaseProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  clientWrapperAdded: boolean;
  explicitReadEnableFlagRequired: boolean;
  allowedReadOnlySources: string[];
  blockedBrowserSources: string[];
  publicViewsAdded: boolean;
  usesAnonKeyOnly: boolean;
  allowsWrites: boolean;
  allowsLiveCustomerReads: boolean;
  allowsProviderPayloadReads: boolean;
  allowsPhoneSmsRuntime: boolean;
  allowsArchiveWrites: boolean;
  allowsRetentionWrites: boolean;
  allowsLivePilotRuntime: boolean;
};

export type BrowserSafeSupabaseReadOnlyClientScaffoldReport = {
  status: BrowserSafeSupabaseReadOnlyClientScaffoldStatus;
  decision: BrowserSafeSupabaseReadOnlyClientScaffoldDecision;
  notes: string[];
  nextBuild: 'QL-091-public-disabled-preview-browser-safe-supabase-read-only-client-review';
};

const allowedSources = ['public.ql_public_synthetic_conversations', 'public.ql_public_system_status'];

export function evaluateBrowserSafeSupabaseReadOnlyClientScaffold(
  environment: BrowserSafeSupabaseReadOnlyClientScaffoldEnvironment
): BrowserSafeSupabaseReadOnlyClientScaffoldReport {
  if (environment.expectedSupabaseProjectUrl !== 'https://gxujcwpktaickcgzyvnu.supabase.co') {
    return {
      status: 'blocked_unexpected_supabase_project',
      decision: 'block_runtime_activation',
      notes: ['Unexpected Supabase project URL detected.'],
      nextBuild: 'QL-091-public-disabled-preview-browser-safe-supabase-read-only-client-review'
    };
  }

  const unsafeSource = environment.allowedReadOnlySources.find((source) => !allowedSources.includes(source));
  if (unsafeSource) {
    return {
      status: 'blocked_unsafe_read_source',
      decision: 'block_runtime_activation',
      notes: [`Unsafe read source requested: ${unsafeSource}`],
      nextBuild: 'QL-091-public-disabled-preview-browser-safe-supabase-read-only-client-review'
    };
  }

  if (
    environment.allowsWrites ||
    environment.allowsLiveCustomerReads ||
    environment.allowsProviderPayloadReads ||
    environment.allowsPhoneSmsRuntime ||
    environment.allowsArchiveWrites ||
    environment.allowsRetentionWrites ||
    environment.allowsLivePilotRuntime
  ) {
    return {
      status: 'blocked_write_or_live_runtime_enabled',
      decision: 'block_runtime_activation',
      notes: ['A live read/write/runtime path was enabled in a disabled public preview build.'],
      nextBuild: 'QL-091-public-disabled-preview-browser-safe-supabase-read-only-client-review'
    };
  }

  if (!environment.clientWrapperAdded || !environment.publicViewsAdded || !environment.usesAnonKeyOnly) {
    return {
      status: 'blocked_missing_env_fallback_required',
      decision: 'fallback_to_local_synthetic_samples',
      notes: ['Read-only scaffold is incomplete, so the UI must fall back to local synthetic samples.'],
      nextBuild: 'QL-091-public-disabled-preview-browser-safe-supabase-read-only-client-review'
    };
  }

  return {
    status: 'browser_safe_supabase_read_only_client_scaffold_ready',
    decision: 'approve_read_only_scaffold',
    notes: [
      'QL-090 adds a browser-safe read-only client scaffold.',
      'Reads are limited to explicit synthetic public views only.',
      'Writes, live customer/provider data, Phone/SMS runtime, archives, retention writes, and live pilot remain blocked.'
    ],
    nextBuild: 'QL-091-public-disabled-preview-browser-safe-supabase-read-only-client-review'
  };
}

export const browserSafeSupabaseReadOnlyClientScaffoldEnvironment: BrowserSafeSupabaseReadOnlyClientScaffoldEnvironment = {
  buildId: 'QL-090',
  expectedSupabaseProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  clientWrapperAdded: true,
  explicitReadEnableFlagRequired: true,
  allowedReadOnlySources: allowedSources,
  blockedBrowserSources: [
    'contacts',
    'conversations',
    'messages',
    'phone_calls',
    'sms_messages',
    'provider_payloads',
    'consent_logs',
    'app_admins',
    'audit_events',
    'archives',
    'retention_records'
  ],
  publicViewsAdded: true,
  usesAnonKeyOnly: true,
  allowsWrites: false,
  allowsLiveCustomerReads: false,
  allowsProviderPayloadReads: false,
  allowsPhoneSmsRuntime: false,
  allowsArchiveWrites: false,
  allowsRetentionWrites: false,
  allowsLivePilotRuntime: false
};

export const browserSafeSupabaseReadOnlyClientScaffoldReport = evaluateBrowserSafeSupabaseReadOnlyClientScaffold(
  browserSafeSupabaseReadOnlyClientScaffoldEnvironment
);
