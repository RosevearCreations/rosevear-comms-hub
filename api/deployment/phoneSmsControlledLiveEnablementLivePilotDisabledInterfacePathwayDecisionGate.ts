export type DisabledInterfacePathwayDecisionStatus =
  | 'disabled_interface_pathway_decision_gate_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_decision_item'
  | 'blocked_failed_decision_item'
  | 'blocked_non_decision_scope';

export type DisabledInterfacePathwayDecision =
  | 'approve_github_pages_disabled_interface_planning'
  | 'continue_rework'
  | 'remain_blocked';

export type DisabledInterfacePathwayOption =
  | 'current_repo_disabled_console'
  | 'github_pages_static_disabled_interface_candidate'
  | 'supabase_edge_functions_backend_boundary_later'
  | 'vercel_rejected_for_current_quota'
  | 'cloudflare_pages_rejected_for_current_quota'
  | 'live_runtime_rejected';

export type DisabledInterfacePathwayDecisionItemId =
  | 'ql067_post_closure_readiness_confirmed'
  | 'no_hosting_deployment_added'
  | 'github_pages_candidate_selected_for_later_static_ui'
  | 'supabase_backend_boundary_reserved_for_later'
  | 'vercel_rejected_for_rough_sketch_phase'
  | 'cloudflare_pages_rejected_for_rough_sketch_phase'
  | 'browser_public_variables_limited_to_supabase_url_and_anon_key'
  | 'server_only_secrets_kept_out_of_browser'
  | 'provider_callbacks_remain_disabled'
  | 'phone_webhooks_remain_disabled'
  | 'sms_and_call_runtime_remain_disabled'
  | 'ai_runtime_remains_disabled'
  | 'persistence_and_customer_data_remain_disabled'
  | 'archive_and_retention_writes_remain_disabled'
  | 'live_pilot_runtime_remains_disabled'
  | 'disabled_interface_implementation_plan_next';

export interface DisabledInterfacePathwayDecisionEnvironment {
  readonly prerequisitesCompleteThroughQl067: boolean;
  readonly vercelQuotaConstrained: boolean;
  readonly cloudflarePagesConstrained: boolean;
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
  readonly archiveWritesAllowed: boolean;
  readonly retentionPolicyWritesAllowed: boolean;
  readonly providerAccountConnected: boolean;
  readonly providerLiveNumberAttached: boolean;
  readonly callbackRegistrationAllowed: boolean;
  readonly livePilotRuntimeAllowed: boolean;
}

export interface DisabledInterfacePathwayDecisionItem {
  readonly id: DisabledInterfacePathwayDecisionItemId;
  readonly reviewed: boolean;
  readonly acceptedForNextPlan: boolean;
  readonly decisionOnly: boolean;
  readonly noHostingDeployment: boolean;
  readonly noRuntimeEnablement: boolean;
  readonly noSecretExposure: boolean;
  readonly noCustomerDataExposure: boolean;
  readonly noPersistenceWrites: boolean;
  readonly noArchiveWrites: boolean;
  readonly noRetentionWrites: boolean;
  readonly visibleInDisabledConsole: boolean;
  readonly containsSecretValue: false;
  readonly containsCallbackToken: false;
  readonly containsLivePhoneNumber: false;
  readonly containsLiveCustomerData: false;
  readonly containsMessageBody: false;
  readonly containsTranscriptOrRecording: false;
  readonly safeToPersist: false;
  readonly decisionLabel: string;
}

export interface DisabledInterfacePathwayDecisionGateInput {
  readonly decision: DisabledInterfacePathwayDecision;
  readonly environment: DisabledInterfacePathwayDecisionEnvironment;
  readonly selectedFutureStaticInterface: 'github_pages_static_disabled_interface_candidate';
  readonly selectedFutureBackendBoundary: 'supabase_edge_functions_backend_boundary_later';
  readonly rejectedOptions: readonly DisabledInterfacePathwayOption[];
  readonly decisionItems: readonly DisabledInterfacePathwayDecisionItem[];
  readonly requestedScope: 'disabled_interface_pathway_decision_gate_only';
  readonly requiredNextBuild: 'QL-069-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-implementation-plan';
  readonly notes: readonly string[];
}

export interface DisabledInterfacePathwayDecisionGateReport {
  readonly status: DisabledInterfacePathwayDecisionStatus;
  readonly decision: DisabledInterfacePathwayDecision;
  readonly approvedForDisabledInterfaceImplementationPlan: boolean;
  readonly selectedFutureStaticInterface: 'github_pages_static_disabled_interface_candidate' | null;
  readonly selectedFutureBackendBoundary: 'supabase_edge_functions_backend_boundary_later' | null;
  readonly interfacePathwayDecisionOnly: true;
  readonly hostingDeploymentAllowed: false;
  readonly supabaseMigrationAllowed: false;
  readonly providerConnectionAllowed: false;
  readonly providerCallbackAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRuntimeAllowed: false;
  readonly aiRuntimeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly liveCustomerDataAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-069-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-implementation-plan' | null;
  readonly blockers: readonly string[];
  readonly reviewedDecisionItems: readonly DisabledInterfacePathwayDecisionItemId[];
}

export const disabledInterfacePathwayDecisionItemIds: readonly DisabledInterfacePathwayDecisionItemId[] = [
  'ql067_post_closure_readiness_confirmed',
  'no_hosting_deployment_added',
  'github_pages_candidate_selected_for_later_static_ui',
  'supabase_backend_boundary_reserved_for_later',
  'vercel_rejected_for_rough_sketch_phase',
  'cloudflare_pages_rejected_for_rough_sketch_phase',
  'browser_public_variables_limited_to_supabase_url_and_anon_key',
  'server_only_secrets_kept_out_of_browser',
  'provider_callbacks_remain_disabled',
  'phone_webhooks_remain_disabled',
  'sms_and_call_runtime_remain_disabled',
  'ai_runtime_remains_disabled',
  'persistence_and_customer_data_remain_disabled',
  'archive_and_retention_writes_remain_disabled',
  'live_pilot_runtime_remains_disabled',
  'disabled_interface_implementation_plan_next'
];

export const safeDisabledInterfacePathwayDecisionEnvironment: DisabledInterfacePathwayDecisionEnvironment = {
  prerequisitesCompleteThroughQl067: true,
  vercelQuotaConstrained: true,
  cloudflarePagesConstrained: true,
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
  archiveWritesAllowed: false,
  retentionPolicyWritesAllowed: false,
  providerAccountConnected: false,
  providerLiveNumberAttached: false,
  callbackRegistrationAllowed: false,
  livePilotRuntimeAllowed: false
};

export const safeDisabledInterfacePathwayDecisionItems: readonly DisabledInterfacePathwayDecisionItem[] =
  disabledInterfacePathwayDecisionItemIds.map((id) => ({
    id,
    reviewed: true,
    acceptedForNextPlan: true,
    decisionOnly: true,
    noHostingDeployment: true,
    noRuntimeEnablement: true,
    noSecretExposure: true,
    noCustomerDataExposure: true,
    noPersistenceWrites: true,
    noArchiveWrites: true,
    noRetentionWrites: true,
    visibleInDisabledConsole: true,
    containsSecretValue: false,
    containsCallbackToken: false,
    containsLivePhoneNumber: false,
    containsLiveCustomerData: false,
    containsMessageBody: false,
    containsTranscriptOrRecording: false,
    safeToPersist: false,
    decisionLabel: `synthetic-redacted-disabled-interface-pathway-decision-${id}`
  }));

export const safeDisabledInterfacePathwayDecisionGateInput: DisabledInterfacePathwayDecisionGateInput = {
  decision: 'approve_github_pages_disabled_interface_planning',
  environment: safeDisabledInterfacePathwayDecisionEnvironment,
  selectedFutureStaticInterface: 'github_pages_static_disabled_interface_candidate',
  selectedFutureBackendBoundary: 'supabase_edge_functions_backend_boundary_later',
  rejectedOptions: [
    'vercel_rejected_for_current_quota',
    'cloudflare_pages_rejected_for_current_quota',
    'live_runtime_rejected'
  ],
  decisionItems: safeDisabledInterfacePathwayDecisionItems,
  requestedScope: 'disabled_interface_pathway_decision_gate_only',
  requiredNextBuild: 'QL-069-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-implementation-plan',
  notes: [
    'QL-068 selects GitHub Pages only as a future disabled static interface candidate.',
    'QL-068 reserves Supabase Edge Functions only as a later backend boundary for secrets, callbacks, and provider work.',
    'QL-068 does not deploy hosting, add migrations, connect providers, enable callbacks, send SMS, persist data, archive data, write retention policy, or start live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: DisabledInterfacePathwayDecisionEnvironment): boolean {
  return (
    !environment.prerequisitesCompleteThroughQl067 ||
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
    environment.archiveWritesAllowed ||
    environment.retentionPolicyWritesAllowed ||
    environment.providerAccountConnected ||
    environment.providerLiveNumberAttached ||
    environment.callbackRegistrationAllowed ||
    environment.livePilotRuntimeAllowed
  );
}

function hasUnsafeDecisionLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-redacted-disabled-interface-pathway-decision-') ||
    normalized.includes('unredacted') ||
    normalized.includes('secret-value') ||
    normalized.includes('callback-token') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('live-customer') ||
    normalized.includes('runtime-enabled') ||
    normalized.includes('hosting-deployed') ||
    normalized.includes('provider-live')
  );
}

function decisionItemIsSafe(item: DisabledInterfacePathwayDecisionItem): boolean {
  return (
    item.reviewed &&
    item.acceptedForNextPlan &&
    item.decisionOnly &&
    item.noHostingDeployment &&
    item.noRuntimeEnablement &&
    item.noSecretExposure &&
    item.noCustomerDataExposure &&
    item.noPersistenceWrites &&
    item.noArchiveWrites &&
    item.noRetentionWrites &&
    item.visibleInDisabledConsole &&
    item.containsSecretValue === false &&
    item.containsCallbackToken === false &&
    item.containsLivePhoneNumber === false &&
    item.containsLiveCustomerData === false &&
    item.containsMessageBody === false &&
    item.containsTranscriptOrRecording === false &&
    item.safeToPersist === false &&
    !hasUnsafeDecisionLabel(item.decisionLabel)
  );
}

export function decidePhoneSmsControlledLiveEnablementLivePilotDisabledInterfacePathway(
  input: DisabledInterfacePathwayDecisionGateInput
): DisabledInterfacePathwayDecisionGateReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl067) {
    blockers.push('Prerequisites through QL-067 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for disabled interface pathway decision.');
  }
  if (input.requestedScope !== 'disabled_interface_pathway_decision_gate_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_github_pages_disabled_interface_planning') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (input.selectedFutureStaticInterface !== 'github_pages_static_disabled_interface_candidate') {
    blockers.push('Future static interface candidate must remain GitHub Pages only.');
  }
  if (input.selectedFutureBackendBoundary !== 'supabase_edge_functions_backend_boundary_later') {
    blockers.push('Future backend boundary must remain Supabase Edge Functions only.');
  }

  const itemMap = new Map(input.decisionItems.map((item) => [item.id, item]));
  const missingItems = disabledInterfacePathwayDecisionItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing decision items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.decisionItems.filter((item) => !decisionItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Decision items failed disabled pathway checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: DisabledInterfacePathwayDecisionStatus =
    !input.environment.prerequisitesCompleteThroughQl067
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_interface_pathway_decision_gate_only'
          ? 'blocked_non_decision_scope'
          : missingItems.length > 0
            ? 'blocked_missing_decision_item'
            : failedItems.length > 0 || blockers.length > 0
              ? 'blocked_failed_decision_item'
              : 'disabled_interface_pathway_decision_gate_ready';

  const approved = status === 'disabled_interface_pathway_decision_gate_ready';

  return {
    status,
    decision: approved ? 'approve_github_pages_disabled_interface_planning' : 'remain_blocked',
    approvedForDisabledInterfaceImplementationPlan: approved,
    selectedFutureStaticInterface: approved ? 'github_pages_static_disabled_interface_candidate' : null,
    selectedFutureBackendBoundary: approved ? 'supabase_edge_functions_backend_boundary_later' : null,
    interfacePathwayDecisionOnly: true,
    hostingDeploymentAllowed: false,
    supabaseMigrationAllowed: false,
    providerConnectionAllowed: false,
    providerCallbackAllowed: false,
    smsSendAllowed: false,
    callRuntimeAllowed: false,
    aiRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerDataAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    livePilotRuntimeAllowed: false,
    safeToPersist: false,
    requiredNextBuild: approved
      ? 'QL-069-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-implementation-plan'
      : null,
    blockers,
    reviewedDecisionItems: input.decisionItems.filter((item) => item.reviewed).map((item) => item.id)
  };
}

export const safeDisabledInterfacePathwayDecisionGateReport =
  decidePhoneSmsControlledLiveEnablementLivePilotDisabledInterfacePathway(
    safeDisabledInterfacePathwayDecisionGateInput
  );
