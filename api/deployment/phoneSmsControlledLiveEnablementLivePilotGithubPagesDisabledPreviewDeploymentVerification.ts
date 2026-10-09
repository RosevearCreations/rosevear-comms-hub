export type GithubPagesDisabledPreviewDeploymentVerificationStatus =
  | 'github_pages_disabled_preview_deployment_verification_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_verification_item'
  | 'blocked_failed_verification_item'
  | 'blocked_non_verification_scope';

export type GithubPagesDisabledPreviewDeploymentVerificationDecision =
  | 'approve_static_disabled_preview_verification_complete'
  | 'continue_rework'
  | 'remain_blocked';

export type GithubPagesDisabledPreviewDeploymentVerificationWorkflowOutcome = 'deployed' | 'skipped_by_gate' | 'pending_external_setting';

export type GithubPagesDisabledPreviewDeploymentVerificationItemId =
  | 'app_ci_green_on_main'
  | 'pages_workflow_observed_on_main'
  | 'pages_workflow_gate_respected'
  | 'target_public_url_checked'
  | 'vite_base_path_verified'
  | 'static_assets_only_verified'
  | 'browser_secret_boundary_verified'
  | 'provider_runtime_disabled'
  | 'phone_sms_runtime_disabled'
  | 'persistence_runtime_disabled'
  | 'archive_retention_runtime_disabled'
  | 'live_pilot_runtime_disabled'
  | 'next_review_path_defined';

export interface GithubPagesDisabledPreviewDeploymentVerificationEnvironment {
  readonly prerequisitesCompleteThroughQl072: boolean;
  readonly githubPagesWorkflowPresent: boolean;
  readonly githubPagesSourceIsGithubActions: boolean;
  readonly enablementVariableExpected: 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW';
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly viteBasePath: '/rosevear-comms-hub/';
  readonly appCiGreenOnMain: boolean;
  readonly pagesWorkflowObservedOnMain: boolean;
  readonly pagesWorkflowOutcome: GithubPagesDisabledPreviewDeploymentVerificationWorkflowOutcome;
  readonly deploysStaticAssetsOnly: boolean;
  readonly browserHeldServiceRoleSecret: boolean;
  readonly browserHeldProviderSecret: boolean;
  readonly browserHeldCallbackToken: boolean;
  readonly browserHeldLivePhoneData: boolean;
  readonly browserHeldLiveMessageBody: boolean;
  readonly browserHeldTranscriptOrRecording: boolean;
  readonly browserHeldLiveCustomerData: boolean;
  readonly providerWebhookConfigured: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly livePhoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
  readonly callRuntimeAllowed: boolean;
  readonly callRecordingAllowed: boolean;
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

export interface GithubPagesDisabledPreviewDeploymentVerificationItem {
  readonly id: GithubPagesDisabledPreviewDeploymentVerificationItemId;
  readonly verified: boolean;
  readonly staticOnly: boolean;
  readonly disabledOnly: boolean;
  readonly exposesLiveCustomerData: false;
  readonly exposesMessageBodyFromLiveSource: false;
  readonly exposesPhoneNumberFromLiveSource: false;
  readonly exposesTranscriptOrRecording: false;
  readonly exposesProviderCredential: false;
  readonly exposesCallbackToken: false;
  readonly exposesServiceRoleSecret: false;
  readonly enablesProviderRuntime: false;
  readonly enablesSmsOrCallRuntime: false;
  readonly enablesPersistenceWrites: false;
  readonly enablesArchiveWrites: false;
  readonly enablesRetentionWrites: false;
  readonly evidenceLabel: string;
}

export interface GithubPagesDisabledPreviewDeploymentVerificationInput {
  readonly decision: GithubPagesDisabledPreviewDeploymentVerificationDecision;
  readonly requestedScope: 'github_pages_disabled_preview_deployment_verification_only';
  readonly environment: GithubPagesDisabledPreviewDeploymentVerificationEnvironment;
  readonly verificationItems: readonly GithubPagesDisabledPreviewDeploymentVerificationItem[];
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly viteBasePath: '/rosevear-comms-hub/';
  readonly enablementVariableName: 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW';
  readonly notes: readonly string[];
}

export interface GithubPagesDisabledPreviewDeploymentVerificationReport {
  readonly status: GithubPagesDisabledPreviewDeploymentVerificationStatus;
  readonly decision: GithubPagesDisabledPreviewDeploymentVerificationDecision;
  readonly approvedForStaticDisabledPreviewVerificationComplete: boolean;
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly viteBasePath: '/rosevear-comms-hub/';
  readonly pagesWorkflowOutcome: GithubPagesDisabledPreviewDeploymentVerificationWorkflowOutcome;
  readonly liveRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRuntimeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly browserHeldSecretsAllowed: false;
  readonly blockers: readonly string[];
  readonly verifiedItems: readonly GithubPagesDisabledPreviewDeploymentVerificationItemId[];
}

export const githubPagesDisabledPreviewDeploymentVerificationItemIds: readonly GithubPagesDisabledPreviewDeploymentVerificationItemId[] = [
  'app_ci_green_on_main',
  'pages_workflow_observed_on_main',
  'pages_workflow_gate_respected',
  'target_public_url_checked',
  'vite_base_path_verified',
  'static_assets_only_verified',
  'browser_secret_boundary_verified',
  'provider_runtime_disabled',
  'phone_sms_runtime_disabled',
  'persistence_runtime_disabled',
  'archive_retention_runtime_disabled',
  'live_pilot_runtime_disabled',
  'next_review_path_defined'
];

export const safeGithubPagesDisabledPreviewDeploymentVerificationEnvironment: GithubPagesDisabledPreviewDeploymentVerificationEnvironment = {
  prerequisitesCompleteThroughQl072: true,
  githubPagesWorkflowPresent: true,
  githubPagesSourceIsGithubActions: true,
  enablementVariableExpected: 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW',
  targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  viteBasePath: '/rosevear-comms-hub/',
  appCiGreenOnMain: true,
  pagesWorkflowObservedOnMain: true,
  pagesWorkflowOutcome: 'pending_external_setting',
  deploysStaticAssetsOnly: true,
  browserHeldServiceRoleSecret: false,
  browserHeldProviderSecret: false,
  browserHeldCallbackToken: false,
  browserHeldLivePhoneData: false,
  browserHeldLiveMessageBody: false,
  browserHeldTranscriptOrRecording: false,
  browserHeldLiveCustomerData: false,
  providerWebhookConfigured: false,
  providerCallbackAllowed: false,
  livePhoneWebhookAllowed: false,
  smsSendAllowed: false,
  callRuntimeAllowed: false,
  callRecordingAllowed: false,
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

export const safeGithubPagesDisabledPreviewDeploymentVerificationItems: readonly GithubPagesDisabledPreviewDeploymentVerificationItem[] =
  githubPagesDisabledPreviewDeploymentVerificationItemIds.map((id) => ({
    id,
    verified: true,
    staticOnly: true,
    disabledOnly: true,
    exposesLiveCustomerData: false,
    exposesMessageBodyFromLiveSource: false,
    exposesPhoneNumberFromLiveSource: false,
    exposesTranscriptOrRecording: false,
    exposesProviderCredential: false,
    exposesCallbackToken: false,
    exposesServiceRoleSecret: false,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    enablesArchiveWrites: false,
    enablesRetentionWrites: false,
    evidenceLabel: `synthetic-static-github-pages-disabled-preview-deployment-verification-${id}`
  }));

export const safeGithubPagesDisabledPreviewDeploymentVerificationInput: GithubPagesDisabledPreviewDeploymentVerificationInput = {
  decision: 'approve_static_disabled_preview_verification_complete',
  requestedScope: 'github_pages_disabled_preview_deployment_verification_only',
  environment: safeGithubPagesDisabledPreviewDeploymentVerificationEnvironment,
  verificationItems: safeGithubPagesDisabledPreviewDeploymentVerificationItems,
  targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  viteBasePath: '/rosevear-comms-hub/',
  enablementVariableName: 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW',
  notes: [
    'QL-073 verifies the static disabled GitHub Pages preview path.',
    'Verification outcome is based on the observed main workflow result after promotion: deployed, skipped_by_gate, or pending_external_setting.',
    'This verification does not enable provider callbacks, SMS, calls, recording, AI send, persistence writes, archive writes, retention writes, live customer access, or live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: GithubPagesDisabledPreviewDeploymentVerificationEnvironment): boolean {
  return (
    !environment.githubPagesWorkflowPresent ||
    environment.targetPublicUrl !== 'https://rosevearcreations.github.io/rosevear-comms-hub/' ||
    environment.viteBasePath !== '/rosevear-comms-hub/' ||
    !environment.deploysStaticAssetsOnly ||
    environment.browserHeldServiceRoleSecret ||
    environment.browserHeldProviderSecret ||
    environment.browserHeldCallbackToken ||
    environment.browserHeldLivePhoneData ||
    environment.browserHeldLiveMessageBody ||
    environment.browserHeldTranscriptOrRecording ||
    environment.browserHeldLiveCustomerData ||
    environment.providerWebhookConfigured ||
    environment.providerCallbackAllowed ||
    environment.livePhoneWebhookAllowed ||
    environment.smsSendAllowed ||
    environment.callRuntimeAllowed ||
    environment.callRecordingAllowed ||
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

function hasUnsafeEvidenceLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-static-github-pages-disabled-preview-deployment-verification-') ||
    normalized.includes('secret-value') ||
    normalized.includes('service-role') ||
    normalized.includes('callback-token') ||
    normalized.includes('provider-live') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('live-customer') ||
    normalized.includes('runtime-enabled')
  );
}

function verificationItemIsSafe(item: GithubPagesDisabledPreviewDeploymentVerificationItem): boolean {
  return (
    item.verified &&
    item.staticOnly &&
    item.disabledOnly &&
    item.exposesLiveCustomerData === false &&
    item.exposesMessageBodyFromLiveSource === false &&
    item.exposesPhoneNumberFromLiveSource === false &&
    item.exposesTranscriptOrRecording === false &&
    item.exposesProviderCredential === false &&
    item.exposesCallbackToken === false &&
    item.exposesServiceRoleSecret === false &&
    item.enablesProviderRuntime === false &&
    item.enablesSmsOrCallRuntime === false &&
    item.enablesPersistenceWrites === false &&
    item.enablesArchiveWrites === false &&
    item.enablesRetentionWrites === false &&
    !hasUnsafeEvidenceLabel(item.evidenceLabel)
  );
}

export function verifyPhoneSmsControlledLiveEnablementLivePilotGithubPagesDisabledPreviewDeployment(
  input: GithubPagesDisabledPreviewDeploymentVerificationInput
): GithubPagesDisabledPreviewDeploymentVerificationReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl072) {
    blockers.push('Prerequisites through QL-072 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for GitHub Pages disabled preview deployment verification.');
  }
  if (input.requestedScope !== 'github_pages_disabled_preview_deployment_verification_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_static_disabled_preview_verification_complete') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (input.targetPublicUrl !== 'https://rosevearcreations.github.io/rosevear-comms-hub/') {
    blockers.push(`Unsupported target public URL: ${input.targetPublicUrl}`);
  }
  if (input.viteBasePath !== '/rosevear-comms-hub/') {
    blockers.push(`Unsupported Vite base path: ${input.viteBasePath}`);
  }
  if (input.enablementVariableName !== 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW') {
    blockers.push(`Unsupported enablement variable: ${input.enablementVariableName}`);
  }

  const itemMap = new Map(input.verificationItems.map((item) => [item.id, item]));
  const missingItems = githubPagesDisabledPreviewDeploymentVerificationItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing verification items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.verificationItems.filter((item) => !verificationItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Verification items failed safety checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: GithubPagesDisabledPreviewDeploymentVerificationStatus =
    !input.environment.prerequisitesCompleteThroughQl072
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'github_pages_disabled_preview_deployment_verification_only'
          ? 'blocked_non_verification_scope'
          : missingItems.length > 0
            ? 'blocked_missing_verification_item'
            : failedItems.length > 0 || blockers.length > 0
              ? 'blocked_failed_verification_item'
              : 'github_pages_disabled_preview_deployment_verification_ready';

  const approved = status === 'github_pages_disabled_preview_deployment_verification_ready';

  return {
    status,
    decision: approved ? 'approve_static_disabled_preview_verification_complete' : 'remain_blocked',
    approvedForStaticDisabledPreviewVerificationComplete: approved,
    targetPublicUrl: input.targetPublicUrl,
    viteBasePath: input.viteBasePath,
    pagesWorkflowOutcome: input.environment.pagesWorkflowOutcome,
    liveRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    callRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    browserHeldSecretsAllowed: false,
    blockers,
    verifiedItems: approved ? githubPagesDisabledPreviewDeploymentVerificationItemIds : []
  };
}

export const safeGithubPagesDisabledPreviewDeploymentVerificationReport =
  verifyPhoneSmsControlledLiveEnablementLivePilotGithubPagesDisabledPreviewDeployment(safeGithubPagesDisabledPreviewDeploymentVerificationInput);
