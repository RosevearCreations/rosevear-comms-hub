export type GithubPagesDisabledPreviewDeploymentEnablementGateStatus =
  | 'github_pages_disabled_preview_deployment_enablement_gate_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_invalid_workflow_boundary'
  | 'blocked_non_gate_scope';

export type GithubPagesDisabledPreviewDeploymentEnablementGateDecision =
  | 'approve_gated_github_pages_disabled_preview_workflow'
  | 'continue_rework'
  | 'remain_blocked';

export interface GithubPagesDisabledPreviewDeploymentEnablementGateEnvironment {
  readonly prerequisitesCompleteThroughQl071: boolean;
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly viteBasePath: '/rosevear-comms-hub/';
  readonly workflowPath: '.github/workflows/pages-disabled-preview.yml';
  readonly workflowGatedByActionsVariable: 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW';
  readonly workflowDeploysOnlyStaticDist: boolean;
  readonly githubPagesSourceMustBeGitHubActions: boolean;
  readonly vercelHostingAdded: boolean;
  readonly cloudflarePagesHostingAdded: boolean;
  readonly supabaseMigrationAdded: boolean;
  readonly supabaseEdgeFunctionAdded: boolean;
  readonly browserHeldServiceRoleSecret: boolean;
  readonly browserHeldProviderSecret: boolean;
  readonly browserHeldCallbackToken: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly livePhoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
  readonly callRuntimeAllowed: boolean;
  readonly callRecordingAllowed: boolean;
  readonly aiAutoSendAllowed: boolean;
  readonly persistenceWritesAllowed: boolean;
  readonly liveCustomerReadAllowed: boolean;
  readonly liveCustomerWriteAllowed: boolean;
  readonly archiveWritesAllowed: boolean;
  readonly retentionPolicyWritesAllowed: boolean;
  readonly providerAccountConnected: boolean;
  readonly providerLiveNumberAttached: boolean;
  readonly callbackRegistrationAllowed: boolean;
  readonly livePilotRuntimeAllowed: boolean;
}

export interface GithubPagesDisabledPreviewDeploymentEnablementGateInput {
  readonly decision: GithubPagesDisabledPreviewDeploymentEnablementGateDecision;
  readonly requestedScope: 'github_pages_disabled_preview_deployment_enablement_gate_only';
  readonly environment: GithubPagesDisabledPreviewDeploymentEnablementGateEnvironment;
  readonly allowedBrowserVariables: readonly ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  readonly serverOnlySecrets: readonly string[];
  readonly nextBuild: 'QL-073-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-verification';
}

export interface GithubPagesDisabledPreviewDeploymentEnablementGateReport {
  readonly status: GithubPagesDisabledPreviewDeploymentEnablementGateStatus;
  readonly decision: GithubPagesDisabledPreviewDeploymentEnablementGateDecision;
  readonly gatedWorkflowApproved: boolean;
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly viteBasePath: '/rosevear-comms-hub/';
  readonly liveEnablementAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRuntimeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly browserHeldSecretsAllowed: false;
  readonly blockers: readonly string[];
}

export const safeGithubPagesDisabledPreviewDeploymentEnablementGateEnvironment: GithubPagesDisabledPreviewDeploymentEnablementGateEnvironment = {
  prerequisitesCompleteThroughQl071: true,
  targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  viteBasePath: '/rosevear-comms-hub/',
  workflowPath: '.github/workflows/pages-disabled-preview.yml',
  workflowGatedByActionsVariable: 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW',
  workflowDeploysOnlyStaticDist: true,
  githubPagesSourceMustBeGitHubActions: true,
  vercelHostingAdded: false,
  cloudflarePagesHostingAdded: false,
  supabaseMigrationAdded: false,
  supabaseEdgeFunctionAdded: false,
  browserHeldServiceRoleSecret: false,
  browserHeldProviderSecret: false,
  browserHeldCallbackToken: false,
  providerCallbackAllowed: false,
  livePhoneWebhookAllowed: false,
  smsSendAllowed: false,
  callRuntimeAllowed: false,
  callRecordingAllowed: false,
  aiAutoSendAllowed: false,
  persistenceWritesAllowed: false,
  liveCustomerReadAllowed: false,
  liveCustomerWriteAllowed: false,
  archiveWritesAllowed: false,
  retentionPolicyWritesAllowed: false,
  providerAccountConnected: false,
  providerLiveNumberAttached: false,
  callbackRegistrationAllowed: false,
  livePilotRuntimeAllowed: false
};

export const safeGithubPagesDisabledPreviewDeploymentEnablementGateInput: GithubPagesDisabledPreviewDeploymentEnablementGateInput = {
  decision: 'approve_gated_github_pages_disabled_preview_workflow',
  requestedScope: 'github_pages_disabled_preview_deployment_enablement_gate_only',
  environment: safeGithubPagesDisabledPreviewDeploymentEnablementGateEnvironment,
  allowedBrowserVariables: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  serverOnlySecrets: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'PHONE_SMS_PROVIDER_API_KEY',
    'PHONE_SMS_PROVIDER_API_SECRET',
    'PHONE_SMS_WEBHOOK_SIGNING_SECRET',
    'PHONE_SMS_CALLBACK_TOKEN'
  ],
  nextBuild: 'QL-073-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-verification'
};

function environmentIsUnsafe(environment: GithubPagesDisabledPreviewDeploymentEnablementGateEnvironment): boolean {
  return (
    environment.targetPublicUrl !== 'https://rosevearcreations.github.io/rosevear-comms-hub/' ||
    environment.viteBasePath !== '/rosevear-comms-hub/' ||
    environment.workflowPath !== '.github/workflows/pages-disabled-preview.yml' ||
    environment.workflowGatedByActionsVariable !== 'ENABLE_GITHUB_PAGES_DISABLED_PREVIEW' ||
    !environment.workflowDeploysOnlyStaticDist ||
    !environment.githubPagesSourceMustBeGitHubActions ||
    environment.vercelHostingAdded ||
    environment.cloudflarePagesHostingAdded ||
    environment.supabaseMigrationAdded ||
    environment.supabaseEdgeFunctionAdded ||
    environment.browserHeldServiceRoleSecret ||
    environment.browserHeldProviderSecret ||
    environment.browserHeldCallbackToken ||
    environment.providerCallbackAllowed ||
    environment.livePhoneWebhookAllowed ||
    environment.smsSendAllowed ||
    environment.callRuntimeAllowed ||
    environment.callRecordingAllowed ||
    environment.aiAutoSendAllowed ||
    environment.persistenceWritesAllowed ||
    environment.liveCustomerReadAllowed ||
    environment.liveCustomerWriteAllowed ||
    environment.archiveWritesAllowed ||
    environment.retentionPolicyWritesAllowed ||
    environment.providerAccountConnected ||
    environment.providerLiveNumberAttached ||
    environment.callbackRegistrationAllowed ||
    environment.livePilotRuntimeAllowed
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotGithubPagesDisabledPreviewDeploymentEnablementGate(
  input: GithubPagesDisabledPreviewDeploymentEnablementGateInput
): GithubPagesDisabledPreviewDeploymentEnablementGateReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl071) blockers.push('Prerequisites through QL-071 must be complete.');
  if (input.requestedScope !== 'github_pages_disabled_preview_deployment_enablement_gate_only') blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  if (input.decision !== 'approve_gated_github_pages_disabled_preview_workflow') blockers.push(`Unsupported decision: ${input.decision}`);
  if (environmentIsUnsafe(input.environment)) blockers.push('Environment is unsafe for the gated GitHub Pages disabled preview workflow.');
  if (input.allowedBrowserVariables.join(',') !== 'VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY') blockers.push('Browser variables must remain limited to VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

  const status: GithubPagesDisabledPreviewDeploymentEnablementGateStatus =
    !input.environment.prerequisitesCompleteThroughQl071
      ? 'blocked_pending_prerequisites'
      : input.requestedScope !== 'github_pages_disabled_preview_deployment_enablement_gate_only'
        ? 'blocked_non_gate_scope'
        : environmentIsUnsafe(input.environment)
          ? 'blocked_unsafe_environment'
          : blockers.length > 0
            ? 'blocked_invalid_workflow_boundary'
            : 'github_pages_disabled_preview_deployment_enablement_gate_ready';

  const approved = status === 'github_pages_disabled_preview_deployment_enablement_gate_ready';

  return {
    status,
    decision: approved ? 'approve_gated_github_pages_disabled_preview_workflow' : 'remain_blocked',
    gatedWorkflowApproved: approved,
    targetPublicUrl: input.environment.targetPublicUrl,
    viteBasePath: input.environment.viteBasePath,
    liveEnablementAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    callRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    browserHeldSecretsAllowed: false,
    blockers
  };
}

export const safeGithubPagesDisabledPreviewDeploymentEnablementGateReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotGithubPagesDisabledPreviewDeploymentEnablementGate(
    safeGithubPagesDisabledPreviewDeploymentEnablementGateInput
  );
