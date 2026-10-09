export type GithubPagesDisabledPreviewDeploymentPlanStatus =
  | 'github_pages_disabled_preview_deployment_plan_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_deployment_plan_item'
  | 'blocked_failed_deployment_plan_item'
  | 'blocked_non_plan_scope';

export type GithubPagesDisabledPreviewDeploymentPlanDecision =
  | 'approve_github_pages_disabled_preview_deployment_enablement_gate'
  | 'continue_rework'
  | 'remain_blocked';

export type GithubPagesDisabledPreviewDeploymentPlanItemId =
  | 'target_public_url_confirmed'
  | 'github_pages_source_setting_planned'
  | 'github_actions_workflow_planned_not_enabled'
  | 'vite_base_path_planned'
  | 'static_build_output_planned'
  | 'browser_variable_boundary_planned'
  | 'server_only_secret_boundary_planned'
  | 'provider_runtime_disabled'
  | 'phone_sms_runtime_disabled'
  | 'persistence_runtime_disabled'
  | 'archive_retention_runtime_disabled'
  | 'manual_setup_steps_documented'
  | 'next_enablement_gate_defined';

export interface GithubPagesDisabledPreviewDeploymentPlanEnvironment {
  readonly prerequisitesCompleteThroughQl070: boolean;
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly githubPagesDeploymentAdded: boolean;
  readonly githubPagesWorkflowAdded: boolean;
  readonly githubPagesSourceChanged: boolean;
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

export interface GithubPagesDisabledPreviewDeploymentPlanItem {
  readonly id: GithubPagesDisabledPreviewDeploymentPlanItemId;
  readonly planned: boolean;
  readonly disabledOnly: boolean;
  readonly reviewOnly: boolean;
  readonly deploysInThisBuild: false;
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
  readonly safeForBrowserPreviewPlan: boolean;
  readonly evidenceLabel: string;
}

export interface GithubPagesDisabledPreviewDeploymentPlanInput {
  readonly decision: GithubPagesDisabledPreviewDeploymentPlanDecision;
  readonly requestedScope: 'github_pages_disabled_preview_deployment_plan_only';
  readonly environment: GithubPagesDisabledPreviewDeploymentPlanEnvironment;
  readonly planItems: readonly GithubPagesDisabledPreviewDeploymentPlanItem[];
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly plannedViteBasePath: '/rosevear-comms-hub/';
  readonly allowedBrowserVariables: readonly ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  readonly serverOnlySecrets: readonly string[];
  readonly manualSetupSteps: readonly string[];
  readonly requiredNextBuild: 'QL-072-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-enablement-gate';
  readonly notes: readonly string[];
}

export interface GithubPagesDisabledPreviewDeploymentPlanReport {
  readonly status: GithubPagesDisabledPreviewDeploymentPlanStatus;
  readonly decision: GithubPagesDisabledPreviewDeploymentPlanDecision;
  readonly approvedForGithubPagesDisabledPreviewDeploymentEnablementGate: boolean;
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly plannedViteBasePath: '/rosevear-comms-hub/';
  readonly deploymentAdded: false;
  readonly githubPagesWorkflowAdded: false;
  readonly githubPagesSourceChanged: false;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRuntimeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly browserHeldSecretsAllowed: false;
  readonly requiredNextBuild: 'QL-072-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-enablement-gate' | null;
  readonly blockers: readonly string[];
  readonly reviewedPlanItems: readonly GithubPagesDisabledPreviewDeploymentPlanItemId[];
}

export const githubPagesDisabledPreviewDeploymentPlanItemIds: readonly GithubPagesDisabledPreviewDeploymentPlanItemId[] = [
  'target_public_url_confirmed',
  'github_pages_source_setting_planned',
  'github_actions_workflow_planned_not_enabled',
  'vite_base_path_planned',
  'static_build_output_planned',
  'browser_variable_boundary_planned',
  'server_only_secret_boundary_planned',
  'provider_runtime_disabled',
  'phone_sms_runtime_disabled',
  'persistence_runtime_disabled',
  'archive_retention_runtime_disabled',
  'manual_setup_steps_documented',
  'next_enablement_gate_defined'
];

export const safeGithubPagesDisabledPreviewDeploymentPlanEnvironment: GithubPagesDisabledPreviewDeploymentPlanEnvironment = {
  prerequisitesCompleteThroughQl070: true,
  targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  githubPagesDeploymentAdded: false,
  githubPagesWorkflowAdded: false,
  githubPagesSourceChanged: false,
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

export const safeGithubPagesDisabledPreviewDeploymentPlanItems: readonly GithubPagesDisabledPreviewDeploymentPlanItem[] =
  githubPagesDisabledPreviewDeploymentPlanItemIds.map((id) => ({
    id,
    planned: true,
    disabledOnly: true,
    reviewOnly: true,
    deploysInThisBuild: false,
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
    safeForBrowserPreviewPlan: true,
    evidenceLabel: `synthetic-static-github-pages-disabled-preview-deployment-plan-${id}`
  }));

export const githubPagesDisabledPreviewManualSetupSteps: readonly string[] = [
  'GitHub repository: RosevearCreations/rosevear-comms-hub.',
  'Open Settings > Pages.',
  'Set Build and deployment Source to GitHub Actions when the later enablement build adds the workflow.',
  'Open Settings > Secrets and variables > Actions > Variables.',
  'Add VITE_SUPABASE_URL only if the static preview needs the public Supabase URL.',
  'Add VITE_SUPABASE_ANON_KEY only if the static preview needs the public anon key.',
  'Do not add SUPABASE_SERVICE_ROLE_KEY, provider credentials, webhook signing secrets, callback tokens, live phone numbers, transcripts, recordings, or live customer data to browser variables.',
  'After the later enablement build deploys, review https://rosevearcreations.github.io/rosevear-comms-hub/ as a static disabled preview only.'
];

export const safeGithubPagesDisabledPreviewDeploymentPlanInput: GithubPagesDisabledPreviewDeploymentPlanInput = {
  decision: 'approve_github_pages_disabled_preview_deployment_enablement_gate',
  requestedScope: 'github_pages_disabled_preview_deployment_plan_only',
  environment: safeGithubPagesDisabledPreviewDeploymentPlanEnvironment,
  planItems: safeGithubPagesDisabledPreviewDeploymentPlanItems,
  targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  plannedViteBasePath: '/rosevear-comms-hub/',
  allowedBrowserVariables: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  serverOnlySecrets: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'PHONE_SMS_PROVIDER_API_KEY',
    'PHONE_SMS_PROVIDER_API_SECRET',
    'PHONE_SMS_WEBHOOK_SIGNING_SECRET',
    'PHONE_SMS_CALLBACK_TOKEN'
  ],
  manualSetupSteps: githubPagesDisabledPreviewManualSetupSteps,
  requiredNextBuild: 'QL-072-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-enablement-gate',
  notes: [
    'QL-071 plans the GitHub Pages static disabled preview deployment path.',
    'QL-071 does not add a GitHub Pages workflow, change the Pages source, deploy the site, add Vercel, add Cloudflare Pages, add Supabase migrations, add Supabase Edge Functions, connect providers, register callbacks, send SMS, run calls, write persistence, archive data, write retention policy, or start live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: GithubPagesDisabledPreviewDeploymentPlanEnvironment): boolean {
  return (
    environment.targetPublicUrl !== 'https://rosevearcreations.github.io/rosevear-comms-hub/' ||
    environment.githubPagesDeploymentAdded ||
    environment.githubPagesWorkflowAdded ||
    environment.githubPagesSourceChanged ||
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

function hasUnsafeEvidenceLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-static-github-pages-disabled-preview-deployment-plan-') ||
    normalized.includes('secret-value') ||
    normalized.includes('service-role') ||
    normalized.includes('callback-token') ||
    normalized.includes('provider-live') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('live-customer') ||
    normalized.includes('runtime-enabled') ||
    normalized.includes('deployed-now')
  );
}

function planItemIsSafe(item: GithubPagesDisabledPreviewDeploymentPlanItem): boolean {
  return (
    item.planned &&
    item.disabledOnly &&
    item.reviewOnly &&
    item.deploysInThisBuild === false &&
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
    item.safeForBrowserPreviewPlan &&
    !hasUnsafeEvidenceLabel(item.evidenceLabel)
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotGithubPagesDisabledPreviewDeploymentPlan(
  input: GithubPagesDisabledPreviewDeploymentPlanInput
): GithubPagesDisabledPreviewDeploymentPlanReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl070) {
    blockers.push('Prerequisites through QL-070 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for a GitHub Pages disabled preview deployment plan.');
  }
  if (input.requestedScope !== 'github_pages_disabled_preview_deployment_plan_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_github_pages_disabled_preview_deployment_enablement_gate') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (input.targetPublicUrl !== 'https://rosevearcreations.github.io/rosevear-comms-hub/') {
    blockers.push(`Unsupported target public URL: ${input.targetPublicUrl}`);
  }
  if (input.plannedViteBasePath !== '/rosevear-comms-hub/') {
    blockers.push(`Unsupported planned Vite base path: ${input.plannedViteBasePath}`);
  }
  if (input.allowedBrowserVariables.join(',') !== 'VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY') {
    blockers.push('Browser variables must be limited to VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const itemMap = new Map(input.planItems.map((item) => [item.id, item]));
  const missingItems = githubPagesDisabledPreviewDeploymentPlanItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing GitHub Pages disabled preview deployment plan items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.planItems.filter((item) => !planItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`GitHub Pages disabled preview deployment plan items failed safety checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: GithubPagesDisabledPreviewDeploymentPlanStatus =
    !input.environment.prerequisitesCompleteThroughQl070
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'github_pages_disabled_preview_deployment_plan_only'
          ? 'blocked_non_plan_scope'
          : missingItems.length > 0
            ? 'blocked_missing_deployment_plan_item'
            : failedItems.length > 0 || blockers.length > 0
              ? 'blocked_failed_deployment_plan_item'
              : 'github_pages_disabled_preview_deployment_plan_ready';

  const approved = status === 'github_pages_disabled_preview_deployment_plan_ready';

  return {
    status,
    decision: approved ? 'approve_github_pages_disabled_preview_deployment_enablement_gate' : 'remain_blocked',
    approvedForGithubPagesDisabledPreviewDeploymentEnablementGate: approved,
    targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
    plannedViteBasePath: '/rosevear-comms-hub/',
    deploymentAdded: false,
    githubPagesWorkflowAdded: false,
    githubPagesSourceChanged: false,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    callRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    browserHeldSecretsAllowed: false,
    requiredNextBuild: approved
      ? 'QL-072-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-enablement-gate'
      : null,
    blockers,
    reviewedPlanItems: input.planItems.filter((item) => item.planned).map((item) => item.id)
  };
}

export const safeGithubPagesDisabledPreviewDeploymentPlanReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotGithubPagesDisabledPreviewDeploymentPlan(
    safeGithubPagesDisabledPreviewDeploymentPlanInput
  );
