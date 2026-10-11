import {
  allowedReadOnlySources,
  blockedBrowserSources,
  expectedSupabaseProjectUrl,
  readOnlyFallbackRules
} from '../integrations/supabaseReadOnlyClient';

export type Ql092SafeReadPlanStatus = 'plan_only' | 'blocked_until_next_implementation';

export type Ql092PayloadValidationRule = {
  field: string;
  requirement: string;
  fallback: string;
};

export type Ql092SafeReadImplementationPlan = {
  build: 'QL-092';
  title: string;
  status: Ql092SafeReadPlanStatus;
  expectedProjectUrl: string;
  allowedSources: readonly string[];
  blockedSources: readonly string[];
  fallbackRules: readonly string[];
  implementationSteps: readonly string[];
  payloadValidationRules: readonly Ql092PayloadValidationRule[];
  runtimeLockouts: readonly string[];
  nextBuildDecision: string;
};

export const ql092PayloadValidationRules: readonly Ql092PayloadValidationRule[] = [
  {
    field: 'synthetic conversation id',
    requirement: 'Non-empty string matching a known synthetic sample id or a public synthetic-view id.',
    fallback: 'Discard remote rows and keep local synthetic samples visible.'
  },
  {
    field: 'brand identity',
    requirement: 'brand_id must map to an approved disabled-preview brand such as rosie or devil, with a display-only brand_name.',
    fallback: 'Ignore the row and keep browser-local brand samples.'
  },
  {
    field: 'status text',
    requirement: 'Status must be a display-only string and must not imply live delivery, callback registration, AI send, or provider action.',
    fallback: 'Replace the remote status with local read-only scaffold wording.'
  },
  {
    field: 'summary and draft',
    requirement: 'Text must be strings, bounded for UI display, and treated as draft-only synthetic copy.',
    fallback: 'Use local synthetic summary and draft copy for the selected sample.'
  },
  {
    field: 'system status rows',
    requirement: 'Status must be one of ready, blocked, or planned; labels and details remain display-only.',
    fallback: 'Keep local scaffold checks and fallback rules visible.'
  }
];

export const ql092SafeReadImplementationPlan: Ql092SafeReadImplementationPlan = {
  build: 'QL-092',
  title: 'Public Disabled Preview Browser-Safe Supabase Read-Only Client Safe Read Implementation Plan',
  status: 'plan_only',
  expectedProjectUrl: expectedSupabaseProjectUrl,
  allowedSources: allowedReadOnlySources,
  blockedSources: blockedBrowserSources,
  fallbackRules: readOnlyFallbackRules,
  implementationSteps: [
    'Keep QL-092 plan-only; do not hydrate UI from Supabase in this build.',
    'In the next implementation build, call the existing read-only loaders only after the QL-090 env, project, and read-enable gates pass.',
    'Validate every returned row before any remote value can replace a local synthetic fallback sample.',
    'Merge remote synthetic rows by known brand and sample identity only; never allow unknown tables or provider/customer ids to create UI state.',
    'Surface the active source as local fallback or validated Supabase synthetic read so the public preview remains understandable.',
    'Record read failures as display-only fallback reasons and never retry aggressively, mutate storage, or write to Supabase from the browser.'
  ],
  payloadValidationRules: ql092PayloadValidationRules,
  runtimeLockouts: [
    'No live customer/contact/message/conversation table reads.',
    'No provider payload, SMS, call, recording, archive, retention, audit, or admin table reads.',
    'No browser writes, inserts, updates, deletes, RPC mutations, storage uploads, or session persistence.',
    'No AI reply generation, AI send, phone call, SMS send, callback registration, provider connection, or live pilot runtime.'
  ],
  nextBuildDecision:
    'QL-093 can implement validated synthetic safe reads behind the existing VITE_QL_ENABLE_SUPABASE_READS=true gate while preserving local fallback defaults.'
};

export function getQl092SafeReadPlanSummary(): string {
  return `${ql092SafeReadImplementationPlan.build}: ${ql092SafeReadImplementationPlan.title} remains ${ql092SafeReadImplementationPlan.status}; next implementation is limited to validated synthetic public reads with local fallback.`;
}
