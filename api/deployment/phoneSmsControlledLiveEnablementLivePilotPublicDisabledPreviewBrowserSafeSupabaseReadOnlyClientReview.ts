export type BrowserSafeSupabaseReadOnlyClientReviewStatus =
  | 'public_disabled_preview_read_only_client_review_ready'
  | 'blocked_client_not_gated'
  | 'blocked_unexpected_project_allowed'
  | 'blocked_live_source_allowed'
  | 'blocked_mutation_path_enabled'
  | 'blocked_live_comms_enabled';

export type BrowserSafeSupabaseReadOnlyClientReviewDecision =
  | 'approve_review_only'
  | 'remain_disabled_preview_only'
  | 'block_runtime_activation';

export type BrowserSafeSupabaseReadOnlyClientReviewEnvironment = {
  buildId: 'QL-091';
  expectedSupabaseProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  scaffoldFilePresent: boolean;
  envUrlGatePresent: boolean;
  anonKeyGatePresent: boolean;
  explicitReadEnableGatePresent: boolean;
  unexpectedProjectBlocked: boolean;
  allowedReadOnlySources: string[];
  blockedBrowserSources: string[];
  fallbackToLocalSamples: boolean;
  browserClientDisabledByDefault: boolean;
  authPersistenceDisabled: boolean;
  writesEnabled: boolean;
  liveCustomerReadsEnabled: boolean;
  providerPayloadReadsEnabled: boolean;
  phoneSmsRuntimeEnabled: boolean;
  archiveWritesEnabled: boolean;
  retentionWritesEnabled: boolean;
  aiSendEnabled: boolean;
  livePilotRuntimeEnabled: boolean;
};

export type BrowserSafeSupabaseReadOnlyClientReviewReport = {
  status: BrowserSafeSupabaseReadOnlyClientReviewStatus;
  decision: BrowserSafeSupabaseReadOnlyClientReviewDecision;
  reasons: string[];
  nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan';
};

const requiredAllowedSources = [
  'public.ql_public_synthetic_conversations',
  'public.ql_public_system_status'
];

function includesOnlySyntheticSources(sources: string[]): boolean {
  return sources.length === requiredAllowedSources.length && requiredAllowedSources.every((source) => sources.includes(source));
}

export function evaluateBrowserSafeSupabaseReadOnlyClientReview(
  environment: BrowserSafeSupabaseReadOnlyClientReviewEnvironment
): BrowserSafeSupabaseReadOnlyClientReviewReport {
  const reasons: string[] = [];

  if (!environment.scaffoldFilePresent || !environment.envUrlGatePresent || !environment.anonKeyGatePresent || !environment.explicitReadEnableGatePresent) {
    reasons.push('The read-only client scaffold must keep URL, anon-key, and explicit read-enable gates in place.');
    return {
      status: 'blocked_client_not_gated',
      decision: 'block_runtime_activation',
      reasons,
      nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan'
    };
  }

  if (!environment.unexpectedProjectBlocked) {
    reasons.push('Unexpected Supabase project URLs must be blocked before client creation.');
    return {
      status: 'blocked_unexpected_project_allowed',
      decision: 'block_runtime_activation',
      reasons,
      nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan'
    };
  }

  if (!includesOnlySyntheticSources(environment.allowedReadOnlySources) || environment.providerPayloadReadsEnabled || environment.liveCustomerReadsEnabled) {
    reasons.push('Browser reads must stay limited to the approved synthetic public views.');
    return {
      status: 'blocked_live_source_allowed',
      decision: 'block_runtime_activation',
      reasons,
      nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan'
    };
  }

  if (environment.writesEnabled || environment.archiveWritesEnabled || environment.retentionWritesEnabled) {
    reasons.push('The public disabled preview cannot enable writes, archives, or retention updates.');
    return {
      status: 'blocked_mutation_path_enabled',
      decision: 'block_runtime_activation',
      reasons,
      nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan'
    };
  }

  if (environment.phoneSmsRuntimeEnabled || environment.aiSendEnabled || environment.livePilotRuntimeEnabled) {
    reasons.push('Phone/SMS runtime, AI send, and live pilot runtime must remain disabled.');
    return {
      status: 'blocked_live_comms_enabled',
      decision: 'block_runtime_activation',
      reasons,
      nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan'
    };
  }

  reasons.push('QL-091 confirms the QL-090 scaffold remains browser-safe, read-only, synthetic-source-only, and disabled by default.');

  return {
    status: 'public_disabled_preview_read_only_client_review_ready',
    decision: 'approve_review_only',
    reasons,
    nextBuild: 'QL-092-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan'
  };
}

export const ql091BrowserSafeSupabaseReadOnlyClientReviewEnvironment: BrowserSafeSupabaseReadOnlyClientReviewEnvironment = {
  buildId: 'QL-091',
  expectedSupabaseProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co',
  scaffoldFilePresent: true,
  envUrlGatePresent: true,
  anonKeyGatePresent: true,
  explicitReadEnableGatePresent: true,
  unexpectedProjectBlocked: true,
  allowedReadOnlySources: requiredAllowedSources,
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
  fallbackToLocalSamples: true,
  browserClientDisabledByDefault: true,
  authPersistenceDisabled: true,
  writesEnabled: false,
  liveCustomerReadsEnabled: false,
  providerPayloadReadsEnabled: false,
  phoneSmsRuntimeEnabled: false,
  archiveWritesEnabled: false,
  retentionWritesEnabled: false,
  aiSendEnabled: false,
  livePilotRuntimeEnabled: false
};

export const ql091BrowserSafeSupabaseReadOnlyClientReviewReport = evaluateBrowserSafeSupabaseReadOnlyClientReview(
  ql091BrowserSafeSupabaseReadOnlyClientReviewEnvironment
);
