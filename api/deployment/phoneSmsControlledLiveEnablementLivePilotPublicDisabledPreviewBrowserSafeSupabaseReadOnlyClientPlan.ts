export type Ql089ReadOnlySource =
  | 'public_synthetic_conversation_view'
  | 'public_synthetic_status_view'
  | 'ql_status_function_output';

export type Ql089BlockedSource =
  | 'contacts'
  | 'conversations'
  | 'messages'
  | 'phone_calls'
  | 'sms_messages'
  | 'consent_logs'
  | 'app_admins'
  | 'audit_events'
  | 'archives'
  | 'retention_records'
  | 'provider_payloads'
  | 'live_customer_records';

export type Ql089ReadOnlyClientPlanInput = {
  build: 'QL-089';
  targetPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  cloudflareWorkerCheckName: 'Workers Builds: rosevear-comms-hub';
  supabaseProjectUrl: 'https://gxujcwpktaickcgzyvnu.supabase.co';
  supabaseGitHubIntegration: {
    repository: 'RosevearCreations/rosevear-comms-hub';
    workingDirectory: '.';
    productionBranch: 'main';
  };
  planOnly: boolean;
  browserClientInstantiated: boolean;
  usesSupabaseAnonKeyOnly: boolean;
  plannedAllowedSources: Ql089ReadOnlySource[];
  blockedSources: Ql089BlockedSource[];
  missingEnvironmentFallbackKeepsLocalSamples: boolean;
  failedReadFallbackKeepsLocalSamples: boolean;
  unexpectedDataFallbackRejectsRemotePayload: boolean;
  livePhoneSmsRuntimeEnabled: boolean;
  providerCallbacksEnabled: boolean;
  liveCustomerReadsEnabled: boolean;
  liveCustomerWritesEnabled: boolean;
  archiveWritesEnabled: boolean;
  retentionWritesEnabled: boolean;
  aiSendEnabled: boolean;
  livePilotRuntimeEnabled: boolean;
};

export type Ql089ReadOnlyClientPlanDecision = {
  status: 'public_disabled_preview_browser_safe_supabase_read_only_client_plan_ready' | 'blocked_for_runtime_or_data_exposure';
  nextBuild: 'QL-090 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Scaffold' | 'manual_fix_required';
  reasons: string[];
};

const requiredAllowedSources: Ql089ReadOnlySource[] = [
  'public_synthetic_conversation_view',
  'public_synthetic_status_view',
  'ql_status_function_output'
];

const requiredBlockedSources: Ql089BlockedSource[] = [
  'contacts',
  'conversations',
  'messages',
  'phone_calls',
  'sms_messages',
  'consent_logs',
  'app_admins',
  'audit_events',
  'archives',
  'retention_records',
  'provider_payloads',
  'live_customer_records'
];

export function evaluateQl089ReadOnlyClientPlan(input: Ql089ReadOnlyClientPlanInput): Ql089ReadOnlyClientPlanDecision {
  const reasons: string[] = [];

  if (!input.planOnly) reasons.push('QL-089 must remain a plan-only build.');
  if (input.browserClientInstantiated) reasons.push('QL-089 must not instantiate a Supabase browser client.');
  if (!input.usesSupabaseAnonKeyOnly) reasons.push('The future plan must use only public anon-key boundaries.');
  if (!input.missingEnvironmentFallbackKeepsLocalSamples) reasons.push('Missing environment values must keep hard-coded local samples.');
  if (!input.failedReadFallbackKeepsLocalSamples) reasons.push('Failed reads must keep hard-coded local samples.');
  if (!input.unexpectedDataFallbackRejectsRemotePayload) reasons.push('Unexpected remote payloads must be rejected.');

  const missingAllowed = requiredAllowedSources.filter((source) => !input.plannedAllowedSources.includes(source));
  if (missingAllowed.length > 0) reasons.push(`Missing planned allowed sources: ${missingAllowed.join(', ')}.`);

  const missingBlocked = requiredBlockedSources.filter((source) => !input.blockedSources.includes(source));
  if (missingBlocked.length > 0) reasons.push(`Missing blocked sources: ${missingBlocked.join(', ')}.`);

  if (input.livePhoneSmsRuntimeEnabled) reasons.push('Live Phone/SMS runtime must remain disabled.');
  if (input.providerCallbacksEnabled) reasons.push('Provider callbacks must remain disabled.');
  if (input.liveCustomerReadsEnabled) reasons.push('Live customer reads must remain disabled.');
  if (input.liveCustomerWritesEnabled) reasons.push('Live customer writes must remain disabled.');
  if (input.archiveWritesEnabled) reasons.push('Archive writes must remain disabled.');
  if (input.retentionWritesEnabled) reasons.push('Retention writes must remain disabled.');
  if (input.aiSendEnabled) reasons.push('AI sending must remain disabled.');
  if (input.livePilotRuntimeEnabled) reasons.push('Live pilot runtime must remain disabled.');

  return {
    status: reasons.length === 0
      ? 'public_disabled_preview_browser_safe_supabase_read_only_client_plan_ready'
      : 'blocked_for_runtime_or_data_exposure',
    nextBuild: reasons.length === 0
      ? 'QL-090 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Scaffold'
      : 'manual_fix_required',
    reasons
  };
}
