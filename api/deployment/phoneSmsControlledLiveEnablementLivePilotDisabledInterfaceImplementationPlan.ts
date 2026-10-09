export type DisabledInterfaceImplementationPlanStatus =
  | 'disabled_interface_implementation_plan_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_interface_region'
  | 'blocked_failed_interface_region'
  | 'blocked_non_plan_scope';

export type DisabledInterfaceImplementationPlanDecision =
  | 'approve_disabled_interface_preview_review'
  | 'continue_rework'
  | 'remain_blocked';

export type DisabledInterfaceRegionId =
  | 'brand_switcher_preview'
  | 'inbox_queue_preview'
  | 'customer_contact_summary_preview'
  | 'conversation_timeline_preview'
  | 'disabled_phone_sms_controls_preview'
  | 'follow_up_task_board_preview'
  | 'safe_deployment_status_preview'
  | 'manual_readiness_checklist_preview';

export interface DisabledInterfaceImplementationEnvironment {
  readonly prerequisitesCompleteThroughQl068: boolean;
  readonly githubPagesCandidateSelected: boolean;
  readonly githubPagesDeploymentAdded: boolean;
  readonly vercelHostingAdded: boolean;
  readonly cloudflarePagesHostingAdded: boolean;
  readonly supabaseMigrationAdded: boolean;
  readonly supabaseEdgeFunctionAdded: boolean;
  readonly browserHeldServiceRoleSecret: boolean;
  readonly browserHeldProviderSecret: boolean;
  readonly browserHeldCallbackToken: boolean;
  readonly providerWebhookConfigured: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly livePhoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
  readonly callRuntimeAllowed: boolean;
  readonly callRecordingAllowed: boolean;
  readonly aiDraftAllowed: boolean;
  readonly aiAutoSendAllowed: boolean;
  readonly persistenceWritesAllowed: boolean;
  readonly liveCustomerReadAllowed: boolean;
  readonly liveCustomerWriteAllowed: boolean;
  readonly dryRunExecutionAllowed: boolean;
  readonly providerDeliveryAllowed: boolean;
  readonly archiveWritesAllowed: boolean;
  readonly retentionPolicyWritesAllowed: boolean;
  readonly providerAccountConnected: boolean;
  readonly providerLiveNumberAttached: boolean;
  readonly callbackRegistrationAllowed: boolean;
  readonly livePilotRuntimeAllowed: boolean;
}

export interface DisabledInterfaceRegion {
  readonly id: DisabledInterfaceRegionId;
  readonly includedInVisiblePreview: boolean;
  readonly staticOnly: boolean;
  readonly disabledOnly: boolean;
  readonly reviewOnly: boolean;
  readonly exposesLiveCustomerData: false;
  readonly exposesMessageBodyFromLiveSource: false;
  readonly exposesPhoneNumberFromLiveSource: false;
  readonly exposesTranscriptOrRecording: false;
  readonly exposesProviderCredential: false;
  readonly exposesCallbackToken: false;
  readonly enablesProviderRuntime: false;
  readonly enablesPersistenceWrites: false;
  readonly enablesArchiveWrites: false;
  readonly enablesRetentionWrites: false;
  readonly safeForBrowserPreview: boolean;
  readonly reviewLabel: string;
}

export interface DisabledInterfaceImplementationPlanInput {
  readonly decision: DisabledInterfaceImplementationPlanDecision;
  readonly requestedScope: 'disabled_interface_implementation_plan_visible_preview_only';
  readonly environment: DisabledInterfaceImplementationEnvironment;
  readonly interfaceRegions: readonly DisabledInterfaceRegion[];
  readonly allowedBrowserVariables: readonly ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  readonly serverOnlySecrets: readonly string[];
  readonly requiredNextBuild: 'QL-070-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-preview-review';
  readonly notes: readonly string[];
}

export interface DisabledInterfaceImplementationPlanReport {
  readonly status: DisabledInterfaceImplementationPlanStatus;
  readonly decision: DisabledInterfaceImplementationPlanDecision;
  readonly approvedForDisabledInterfacePreviewReview: boolean;
  readonly visibleInterfacePreviewAdded: boolean;
  readonly deploymentAdded: false;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRuntimeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly browserHeldSecretsAllowed: false;
  readonly requiredNextBuild: 'QL-070-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-preview-review' | null;
  readonly blockers: readonly string[];
  readonly reviewedRegions: readonly DisabledInterfaceRegionId[];
}

export const disabledInterfaceRegionIds: readonly DisabledInterfaceRegionId[] = [
  'brand_switcher_preview',
  'inbox_queue_preview',
  'customer_contact_summary_preview',
  'conversation_timeline_preview',
  'disabled_phone_sms_controls_preview',
  'follow_up_task_board_preview',
  'safe_deployment_status_preview',
  'manual_readiness_checklist_preview'
];

export const safeDisabledInterfaceImplementationEnvironment: DisabledInterfaceImplementationEnvironment = {
  prerequisitesCompleteThroughQl068: true,
  githubPagesCandidateSelected: true,
  githubPagesDeploymentAdded: false,
  vercelHostingAdded: false,
  cloudflarePagesHostingAdded: false,
  supabaseMigrationAdded: false,
  supabaseEdgeFunctionAdded: false,
  browserHeldServiceRoleSecret: false,
  browserHeldProviderSecret: false,
  browserHeldCallbackToken: false,
  providerWebhookConfigured: false,
  providerCallbackAllowed: false,
  livePhoneWebhookAllowed: false,
  smsSendAllowed: false,
  callRuntimeAllowed: false,
  callRecordingAllowed: false,
  aiDraftAllowed: false,
  aiAutoSendAllowed: false,
  persistenceWritesAllowed: false,
  liveCustomerReadAllowed: false,
  liveCustomerWriteAllowed: false,
  dryRunExecutionAllowed: false,
  providerDeliveryAllowed: false,
  archiveWritesAllowed: false,
  retentionPolicyWritesAllowed: false,
  providerAccountConnected: false,
  providerLiveNumberAttached: false,
  callbackRegistrationAllowed: false,
  livePilotRuntimeAllowed: false
};

export const safeDisabledInterfaceRegions: readonly DisabledInterfaceRegion[] = disabledInterfaceRegionIds.map((id) => ({
  id,
  includedInVisiblePreview: true,
  staticOnly: true,
  disabledOnly: true,
  reviewOnly: true,
  exposesLiveCustomerData: false,
  exposesMessageBodyFromLiveSource: false,
  exposesPhoneNumberFromLiveSource: false,
  exposesTranscriptOrRecording: false,
  exposesProviderCredential: false,
  exposesCallbackToken: false,
  enablesProviderRuntime: false,
  enablesPersistenceWrites: false,
  enablesArchiveWrites: false,
  enablesRetentionWrites: false,
  safeForBrowserPreview: true,
  reviewLabel: `synthetic-static-disabled-interface-preview-${id}`
}));

export const safeDisabledInterfaceImplementationPlanInput: DisabledInterfaceImplementationPlanInput = {
  decision: 'approve_disabled_interface_preview_review',
  requestedScope: 'disabled_interface_implementation_plan_visible_preview_only',
  environment: safeDisabledInterfaceImplementationEnvironment,
  interfaceRegions: safeDisabledInterfaceRegions,
  allowedBrowserVariables: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  serverOnlySecrets: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'PHONE_SMS_PROVIDER_API_KEY',
    'PHONE_SMS_PROVIDER_API_SECRET',
    'PHONE_SMS_WEBHOOK_SIGNING_SECRET',
    'PHONE_SMS_CALLBACK_TOKEN'
  ],
  requiredNextBuild: 'QL-070-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-preview-review',
  notes: [
    'QL-069 adds a visible static disabled interface preview inside the app.',
    'QL-069 does not deploy GitHub Pages, add Vercel, add Cloudflare Pages, add Supabase migrations, add Supabase Edge Functions, connect providers, register callbacks, send SMS, run calls, write persistence, archive data, write retention policy, or start live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: DisabledInterfaceImplementationEnvironment): boolean {
  return (
    !environment.githubPagesCandidateSelected ||
    environment.githubPagesDeploymentAdded ||
    environment.vercelHostingAdded ||
    environment.cloudflarePagesHostingAdded ||
    environment.supabaseMigrationAdded ||
    environment.supabaseEdgeFunctionAdded ||
    environment.browserHeldServiceRoleSecret ||
    environment.browserHeldProviderSecret ||
    environment.browserHeldCallbackToken ||
    environment.providerWebhookConfigured ||
    environment.providerCallbackAllowed ||
    environment.livePhoneWebhookAllowed ||
    environment.smsSendAllowed ||
    environment.callRuntimeAllowed ||
    environment.callRecordingAllowed ||
    environment.aiDraftAllowed ||
    environment.aiAutoSendAllowed ||
    environment.persistenceWritesAllowed ||
    environment.liveCustomerReadAllowed ||
    environment.liveCustomerWriteAllowed ||
    environment.dryRunExecutionAllowed ||
    environment.providerDeliveryAllowed ||
    environment.archiveWritesAllowed ||
    environment.retentionPolicyWritesAllowed ||
    environment.providerAccountConnected ||
    environment.providerLiveNumberAttached ||
    environment.callbackRegistrationAllowed ||
    environment.livePilotRuntimeAllowed
  );
}

function hasUnsafeReviewLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-static-disabled-interface-preview-') ||
    normalized.includes('secret') ||
    normalized.includes('callback-token') ||
    normalized.includes('provider-live') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('live-customer') ||
    normalized.includes('runtime-enabled') ||
    normalized.includes('deployed')
  );
}

function regionIsSafe(region: DisabledInterfaceRegion): boolean {
  return (
    region.includedInVisiblePreview &&
    region.staticOnly &&
    region.disabledOnly &&
    region.reviewOnly &&
    region.exposesLiveCustomerData === false &&
    region.exposesMessageBodyFromLiveSource === false &&
    region.exposesPhoneNumberFromLiveSource === false &&
    region.exposesTranscriptOrRecording === false &&
    region.exposesProviderCredential === false &&
    region.exposesCallbackToken === false &&
    region.enablesProviderRuntime === false &&
    region.enablesPersistenceWrites === false &&
    region.enablesArchiveWrites === false &&
    region.enablesRetentionWrites === false &&
    region.safeForBrowserPreview &&
    !hasUnsafeReviewLabel(region.reviewLabel)
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotDisabledInterfaceImplementationPlan(
  input: DisabledInterfaceImplementationPlanInput
): DisabledInterfaceImplementationPlanReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl068) {
    blockers.push('Prerequisites through QL-068 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for a disabled interface implementation plan.');
  }
  if (input.requestedScope !== 'disabled_interface_implementation_plan_visible_preview_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_disabled_interface_preview_review') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (input.allowedBrowserVariables.join(',') !== 'VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY') {
    blockers.push('Browser variables must be limited to VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const regionMap = new Map(input.interfaceRegions.map((region) => [region.id, region]));
  const missingRegions = disabledInterfaceRegionIds.filter((id) => !regionMap.has(id));
  if (missingRegions.length > 0) {
    blockers.push(`Missing disabled interface regions: ${missingRegions.join(', ')}`);
  }

  const failedRegions = input.interfaceRegions.filter((region) => !regionIsSafe(region));
  if (failedRegions.length > 0) {
    blockers.push(`Disabled interface regions failed safety checks: ${failedRegions.map((region) => region.id).join(', ')}`);
  }

  const status: DisabledInterfaceImplementationPlanStatus =
    !input.environment.prerequisitesCompleteThroughQl068
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_interface_implementation_plan_visible_preview_only'
          ? 'blocked_non_plan_scope'
          : missingRegions.length > 0
            ? 'blocked_missing_interface_region'
            : failedRegions.length > 0 || blockers.length > 0
              ? 'blocked_failed_interface_region'
              : 'disabled_interface_implementation_plan_ready';

  const approved = status === 'disabled_interface_implementation_plan_ready';

  return {
    status,
    decision: approved ? 'approve_disabled_interface_preview_review' : 'remain_blocked',
    approvedForDisabledInterfacePreviewReview: approved,
    visibleInterfacePreviewAdded: approved,
    deploymentAdded: false,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    callRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    browserHeldSecretsAllowed: false,
    requiredNextBuild: approved ? 'QL-070-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-preview-review' : null,
    blockers,
    reviewedRegions: input.interfaceRegions.filter((region) => region.includedInVisiblePreview).map((region) => region.id)
  };
}

export const safeDisabledInterfaceImplementationPlanReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotDisabledInterfaceImplementationPlan(safeDisabledInterfaceImplementationPlanInput);
