export type DisabledInterfacePreviewReviewStatus =
  | 'disabled_interface_preview_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_missing_review_item'
  | 'blocked_failed_review_item'
  | 'blocked_unsafe_environment'
  | 'blocked_non_review_scope';

export type DisabledInterfacePreviewReviewDecision =
  | 'approve_github_pages_disabled_preview_deployment_plan'
  | 'continue_interface_refinement'
  | 'remain_blocked';

export type DisabledInterfacePreviewReviewItemId =
  | 'visible_preview_mounted'
  | 'brand_switcher_reviewed'
  | 'inbox_queue_reviewed'
  | 'customer_contact_summary_reviewed'
  | 'conversation_timeline_reviewed'
  | 'disabled_phone_sms_controls_reviewed'
  | 'follow_up_task_board_reviewed'
  | 'safe_deployment_status_reviewed'
  | 'manual_readiness_checklist_reviewed'
  | 'future_github_pages_link_status_reviewed'
  | 'browser_variable_boundary_reviewed'
  | 'server_only_secret_boundary_reviewed';

export interface DisabledInterfacePreviewReviewEnvironment {
  readonly prerequisitesCompleteThroughQl069: boolean;
  readonly visiblePreviewMounted: boolean;
  readonly futureGithubPagesUrlPlanned: boolean;
  readonly githubPagesDeploymentAdded: boolean;
  readonly githubPagesWorkflowAdded: boolean;
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

export interface DisabledInterfacePreviewReviewItem {
  readonly id: DisabledInterfacePreviewReviewItemId;
  readonly reviewed: boolean;
  readonly usefulForDirectionValidation: boolean;
  readonly staticOnly: boolean;
  readonly disabledOnly: boolean;
  readonly browserSafe: boolean;
  readonly reviewOnly: boolean;
  readonly exposesLiveCustomerData: false;
  readonly exposesLivePhoneNumber: false;
  readonly exposesMessageBodyFromLiveSource: false;
  readonly exposesTranscriptOrRecording: false;
  readonly exposesProviderCredential: false;
  readonly exposesCallbackToken: false;
  readonly enablesRuntime: false;
  readonly enablesPersistenceWrites: false;
  readonly enablesArchiveWrites: false;
  readonly enablesRetentionWrites: false;
  readonly reviewLabel: string;
}

export interface DisabledInterfacePreviewReviewInput {
  readonly decision: DisabledInterfacePreviewReviewDecision;
  readonly requestedScope: 'disabled_interface_preview_review_only';
  readonly environment: DisabledInterfacePreviewReviewEnvironment;
  readonly reviewItems: readonly DisabledInterfacePreviewReviewItem[];
  readonly futurePreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly allowedBrowserVariables: readonly ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  readonly serverOnlySecrets: readonly string[];
  readonly requiredNextBuild: 'QL-071-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-plan';
  readonly notes: readonly string[];
}

export interface DisabledInterfacePreviewReviewReport {
  readonly status: DisabledInterfacePreviewReviewStatus;
  readonly decision: DisabledInterfacePreviewReviewDecision;
  readonly approvedForGithubPagesDisabledPreviewDeploymentPlan: boolean;
  readonly visiblePreviewUsefulForDirection: boolean;
  readonly deploymentAdded: false;
  readonly githubPagesWorkflowAdded: false;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRuntimeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly browserHeldSecretsAllowed: false;
  readonly futurePreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly requiredNextBuild: 'QL-071-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-plan' | null;
  readonly blockers: readonly string[];
  readonly reviewedItems: readonly DisabledInterfacePreviewReviewItemId[];
}

export const disabledInterfacePreviewReviewItemIds: readonly DisabledInterfacePreviewReviewItemId[] = [
  'visible_preview_mounted',
  'brand_switcher_reviewed',
  'inbox_queue_reviewed',
  'customer_contact_summary_reviewed',
  'conversation_timeline_reviewed',
  'disabled_phone_sms_controls_reviewed',
  'follow_up_task_board_reviewed',
  'safe_deployment_status_reviewed',
  'manual_readiness_checklist_reviewed',
  'future_github_pages_link_status_reviewed',
  'browser_variable_boundary_reviewed',
  'server_only_secret_boundary_reviewed'
];

export const safeDisabledInterfacePreviewReviewEnvironment: DisabledInterfacePreviewReviewEnvironment = {
  prerequisitesCompleteThroughQl069: true,
  visiblePreviewMounted: true,
  futureGithubPagesUrlPlanned: true,
  githubPagesDeploymentAdded: false,
  githubPagesWorkflowAdded: false,
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

export const safeDisabledInterfacePreviewReviewItems: readonly DisabledInterfacePreviewReviewItem[] =
  disabledInterfacePreviewReviewItemIds.map((id) => ({
    id,
    reviewed: true,
    usefulForDirectionValidation: true,
    staticOnly: true,
    disabledOnly: true,
    browserSafe: true,
    reviewOnly: true,
    exposesLiveCustomerData: false,
    exposesLivePhoneNumber: false,
    exposesMessageBodyFromLiveSource: false,
    exposesTranscriptOrRecording: false,
    exposesProviderCredential: false,
    exposesCallbackToken: false,
    enablesRuntime: false,
    enablesPersistenceWrites: false,
    enablesArchiveWrites: false,
    enablesRetentionWrites: false,
    reviewLabel: `synthetic-static-disabled-interface-preview-review-${id}`
  }));

export const safeDisabledInterfacePreviewReviewInput: DisabledInterfacePreviewReviewInput = {
  decision: 'approve_github_pages_disabled_preview_deployment_plan',
  requestedScope: 'disabled_interface_preview_review_only',
  environment: safeDisabledInterfacePreviewReviewEnvironment,
  reviewItems: safeDisabledInterfacePreviewReviewItems,
  futurePreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  allowedBrowserVariables: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  serverOnlySecrets: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'PHONE_SMS_PROVIDER_API_KEY',
    'PHONE_SMS_PROVIDER_API_SECRET',
    'PHONE_SMS_WEBHOOK_SIGNING_SECRET',
    'PHONE_SMS_CALLBACK_TOKEN'
  ],
  requiredNextBuild: 'QL-071-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-plan',
  notes: [
    'QL-070 reviews the visible disabled interface preview added in QL-069.',
    'The planned GitHub Pages URL is recorded as a future static preview location, but no workflow or deployment is added in QL-070.',
    'QL-070 approves only a later GitHub Pages disabled preview deployment plan, not live Phone/SMS enablement.'
  ]
};

function environmentIsUnsafe(environment: DisabledInterfacePreviewReviewEnvironment): boolean {
  return (
    !environment.visiblePreviewMounted ||
    !environment.futureGithubPagesUrlPlanned ||
    environment.githubPagesDeploymentAdded ||
    environment.githubPagesWorkflowAdded ||
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
    !normalized.startsWith('synthetic-static-disabled-interface-preview-review-') ||
    normalized.includes('secret') ||
    normalized.includes('callback-token') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('live-customer') ||
    normalized.includes('runtime-enabled') ||
    normalized.includes('deployed')
  );
}

function reviewItemIsSafe(item: DisabledInterfacePreviewReviewItem): boolean {
  return (
    item.reviewed &&
    item.usefulForDirectionValidation &&
    item.staticOnly &&
    item.disabledOnly &&
    item.browserSafe &&
    item.reviewOnly &&
    item.exposesLiveCustomerData === false &&
    item.exposesLivePhoneNumber === false &&
    item.exposesMessageBodyFromLiveSource === false &&
    item.exposesTranscriptOrRecording === false &&
    item.exposesProviderCredential === false &&
    item.exposesCallbackToken === false &&
    item.enablesRuntime === false &&
    item.enablesPersistenceWrites === false &&
    item.enablesArchiveWrites === false &&
    item.enablesRetentionWrites === false &&
    !hasUnsafeReviewLabel(item.reviewLabel)
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotDisabledInterfacePreview(
  input: DisabledInterfacePreviewReviewInput
): DisabledInterfacePreviewReviewReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl069) {
    blockers.push('Prerequisites through QL-069 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for a disabled interface preview review.');
  }
  if (input.requestedScope !== 'disabled_interface_preview_review_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_github_pages_disabled_preview_deployment_plan') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (input.allowedBrowserVariables.join(',') !== 'VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY') {
    blockers.push('Browser variables must be limited to VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const reviewItemMap = new Map(input.reviewItems.map((item) => [item.id, item]));
  const missingItems = disabledInterfacePreviewReviewItemIds.filter((id) => !reviewItemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing disabled interface preview review items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.reviewItems.filter((item) => !reviewItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Disabled interface preview review items failed safety checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: DisabledInterfacePreviewReviewStatus =
    !input.environment.prerequisitesCompleteThroughQl069
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_interface_preview_review_only'
          ? 'blocked_non_review_scope'
          : missingItems.length > 0
            ? 'blocked_missing_review_item'
            : failedItems.length > 0 || blockers.length > 0
              ? 'blocked_failed_review_item'
              : 'disabled_interface_preview_review_ready';

  const approved = status === 'disabled_interface_preview_review_ready';

  return {
    status,
    decision: approved ? 'approve_github_pages_disabled_preview_deployment_plan' : 'remain_blocked',
    approvedForGithubPagesDisabledPreviewDeploymentPlan: approved,
    visiblePreviewUsefulForDirection: approved,
    deploymentAdded: false,
    githubPagesWorkflowAdded: false,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    callRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    browserHeldSecretsAllowed: false,
    futurePreviewUrl: input.futurePreviewUrl,
    requiredNextBuild: approved
      ? 'QL-071-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-plan'
      : null,
    blockers,
    reviewedItems: input.reviewItems.filter((item) => item.reviewed).map((item) => item.id)
  };
}

export const safeDisabledInterfacePreviewReviewReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotDisabledInterfacePreview(safeDisabledInterfacePreviewReviewInput);
