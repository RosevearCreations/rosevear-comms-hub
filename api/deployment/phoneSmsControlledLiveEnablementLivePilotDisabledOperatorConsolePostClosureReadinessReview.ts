export type DisabledOperatorConsolePostClosureReadinessReviewStatus =
  | 'disabled_operator_console_post_closure_readiness_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_readiness_item'
  | 'blocked_failed_readiness_item'
  | 'blocked_non_review_scope';

export type DisabledOperatorConsolePostClosureReadinessReviewDecision =
  | 'approve_disabled_interface_pathway_decision_gate'
  | 'continue_rework'
  | 'remain_blocked';

export type DisabledOperatorConsolePostClosureReadinessItemId =
  | 'closed_evidence_set_readiness_review'
  | 'console_reachability_readiness_review'
  | 'console_visibility_readiness_review'
  | 'readiness_status_review'
  | 'safety_lock_readiness_review'
  | 'manual_readiness_checklist_review'
  | 'variable_name_readiness_review'
  | 'rejected_evidence_category_readiness_review'
  | 'disabled_future_action_state_readiness_review'
  | 'synthetic_redacted_closure_note_readiness_review'
  | 'help_overlay_readiness_review'
  | 'hosting_boundary_readiness_review'
  | 'provider_connection_block_readiness_review'
  | 'live_number_attachment_block_readiness_review'
  | 'callback_registration_block_readiness_review'
  | 'sms_sending_block_readiness_review'
  | 'call_recording_block_readiness_review'
  | 'ai_feature_block_readiness_review'
  | 'persistence_customer_data_block_readiness_review'
  | 'archive_retention_block_readiness_review'
  | 'production_ci_readiness_review'
  | 'interface_pathway_decision_gate_readiness_review';

export interface DisabledOperatorConsolePostClosureReadinessEnvironment {
  readonly prerequisitesCompleteThroughQl066: boolean;
  readonly closedEvidenceSyntheticOnly: boolean;
  readonly closedEvidenceRedactedOnly: boolean;
  readonly closedEvidenceReviewOnly: boolean;
  readonly closedEvidenceClosureOnly: boolean;
  readonly providerWebhookConfigured: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly livePhoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
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
  readonly vercelHostingAdded: boolean;
  readonly cloudflarePagesHostingAdded: boolean;
  readonly githubPagesDeploymentAdded: boolean;
  readonly supabaseMigrationAdded: boolean;
  readonly browserHeldSecretsAdded: boolean;
}

export interface DisabledOperatorConsolePostClosureReadinessItem {
  readonly id: DisabledOperatorConsolePostClosureReadinessItemId;
  readonly closureItemReviewed: boolean;
  readonly readinessReviewed: boolean;
  readonly acceptedForInterfacePathwayDecisionGate: boolean;
  readonly reviewOnly: boolean;
  readonly closureOnly: boolean;
  readonly visibleInDisabledConsole: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly containsSecretValue: false;
  readonly containsCallbackToken: false;
  readonly containsLivePhoneNumber: false;
  readonly containsMessageBody: false;
  readonly containsTranscriptOrRecording: false;
  readonly containsLiveCustomerData: false;
  readonly enabledRuntimeEvidence: false;
  readonly hostingChangeEvidence: false;
  readonly noProviderDelivery: boolean;
  readonly noRuntimeExecution: boolean;
  readonly noPersistenceWrites: boolean;
  readonly noArchiveWrites: boolean;
  readonly noRetentionWrites: boolean;
  readonly safeToPersist: false;
  readonly reviewLabel: string;
}

export interface DisabledOperatorConsolePostClosureReadinessReviewInput {
  readonly decision: DisabledOperatorConsolePostClosureReadinessReviewDecision;
  readonly environment: DisabledOperatorConsolePostClosureReadinessEnvironment;
  readonly readinessItems: readonly DisabledOperatorConsolePostClosureReadinessItem[];
  readonly requestedScope: 'disabled_operator_console_post_closure_readiness_review_only';
  readonly closedEvidenceSyntheticOnly: boolean;
  readonly closedEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-068-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-pathway-decision-gate';
  readonly notes: readonly string[];
}

export interface DisabledOperatorConsolePostClosureReadinessReviewReport {
  readonly status: DisabledOperatorConsolePostClosureReadinessReviewStatus;
  readonly decision: DisabledOperatorConsolePostClosureReadinessReviewDecision;
  readonly approvedForDisabledInterfacePathwayDecisionGate: boolean;
  readonly postClosureReadinessReviewOnly: true;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly hostingChangeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly liveCustomerReadAllowed: false;
  readonly liveCustomerWriteAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-068-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-pathway-decision-gate' | null;
  readonly blockers: readonly string[];
  readonly reviewedReadinessItems: readonly DisabledOperatorConsolePostClosureReadinessItemId[];
}

export const disabledOperatorConsolePostClosureReadinessItemIds: readonly DisabledOperatorConsolePostClosureReadinessItemId[] = [
  'closed_evidence_set_readiness_review',
  'console_reachability_readiness_review',
  'console_visibility_readiness_review',
  'readiness_status_review',
  'safety_lock_readiness_review',
  'manual_readiness_checklist_review',
  'variable_name_readiness_review',
  'rejected_evidence_category_readiness_review',
  'disabled_future_action_state_readiness_review',
  'synthetic_redacted_closure_note_readiness_review',
  'help_overlay_readiness_review',
  'hosting_boundary_readiness_review',
  'provider_connection_block_readiness_review',
  'live_number_attachment_block_readiness_review',
  'callback_registration_block_readiness_review',
  'sms_sending_block_readiness_review',
  'call_recording_block_readiness_review',
  'ai_feature_block_readiness_review',
  'persistence_customer_data_block_readiness_review',
  'archive_retention_block_readiness_review',
  'production_ci_readiness_review',
  'interface_pathway_decision_gate_readiness_review'
];

export const safeDisabledOperatorConsolePostClosureReadinessEnvironment: DisabledOperatorConsolePostClosureReadinessEnvironment = {
  prerequisitesCompleteThroughQl066: true,
  closedEvidenceSyntheticOnly: true,
  closedEvidenceRedactedOnly: true,
  closedEvidenceReviewOnly: true,
  closedEvidenceClosureOnly: true,
  providerWebhookConfigured: false,
  providerCallbackAllowed: false,
  livePhoneWebhookAllowed: false,
  smsSendAllowed: false,
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
  livePilotRuntimeAllowed: false,
  vercelHostingAdded: false,
  cloudflarePagesHostingAdded: false,
  githubPagesDeploymentAdded: false,
  supabaseMigrationAdded: false,
  browserHeldSecretsAdded: false
};

export const safeDisabledOperatorConsolePostClosureReadinessItems: readonly DisabledOperatorConsolePostClosureReadinessItem[] =
  disabledOperatorConsolePostClosureReadinessItemIds.map((id) => ({
    id,
    closureItemReviewed: true,
    readinessReviewed: true,
    acceptedForInterfacePathwayDecisionGate: true,
    reviewOnly: true,
    closureOnly: true,
    visibleInDisabledConsole: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    containsSecretValue: false,
    containsCallbackToken: false,
    containsLivePhoneNumber: false,
    containsMessageBody: false,
    containsTranscriptOrRecording: false,
    containsLiveCustomerData: false,
    enabledRuntimeEvidence: false,
    hostingChangeEvidence: false,
    noProviderDelivery: true,
    noRuntimeExecution: true,
    noPersistenceWrites: true,
    noArchiveWrites: true,
    noRetentionWrites: true,
    safeToPersist: false,
    reviewLabel: `synthetic-redacted-disabled-operator-console-post-closure-readiness-review-${id}`
  }));

export const safeDisabledOperatorConsolePostClosureReadinessReviewInput: DisabledOperatorConsolePostClosureReadinessReviewInput = {
  decision: 'approve_disabled_interface_pathway_decision_gate',
  environment: safeDisabledOperatorConsolePostClosureReadinessEnvironment,
  readinessItems: safeDisabledOperatorConsolePostClosureReadinessItems,
  requestedScope: 'disabled_operator_console_post_closure_readiness_review_only',
  closedEvidenceSyntheticOnly: true,
  closedEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-068-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-pathway-decision-gate',
  notes: [
    'QL-067 reviews the QL-066 closed disabled operator console evidence set only.',
    'QL-067 does not add hosting, connect a provider, attach a live number, send SMS, write persistence, inspect live customers, archive evidence, write retention policy, or start live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: DisabledOperatorConsolePostClosureReadinessEnvironment): boolean {
  return (
    !environment.closedEvidenceSyntheticOnly ||
    !environment.closedEvidenceRedactedOnly ||
    !environment.closedEvidenceReviewOnly ||
    !environment.closedEvidenceClosureOnly ||
    environment.providerWebhookConfigured ||
    environment.providerCallbackAllowed ||
    environment.livePhoneWebhookAllowed ||
    environment.smsSendAllowed ||
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
    environment.livePilotRuntimeAllowed ||
    environment.vercelHostingAdded ||
    environment.cloudflarePagesHostingAdded ||
    environment.githubPagesDeploymentAdded ||
    environment.supabaseMigrationAdded ||
    environment.browserHeldSecretsAdded
  );
}

function hasUnsafeReadinessLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-redacted-disabled-operator-console-post-closure-readiness-review-') ||
    normalized.includes('unredacted') ||
    normalized.includes('real-') ||
    normalized.includes('secret-value') ||
    normalized.includes('callback-token') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('live-customer') ||
    normalized.includes('provider-live') ||
    normalized.includes('hosting-enabled')
  );
}

function readinessItemIsSafe(item: DisabledOperatorConsolePostClosureReadinessItem): boolean {
  return (
    item.closureItemReviewed &&
    item.readinessReviewed &&
    item.acceptedForInterfacePathwayDecisionGate &&
    item.reviewOnly &&
    item.closureOnly &&
    item.visibleInDisabledConsole &&
    item.syntheticEvidenceOnly &&
    item.redactedEvidenceOnly &&
    item.containsSecretValue === false &&
    item.containsCallbackToken === false &&
    item.containsLivePhoneNumber === false &&
    item.containsMessageBody === false &&
    item.containsTranscriptOrRecording === false &&
    item.containsLiveCustomerData === false &&
    item.enabledRuntimeEvidence === false &&
    item.hostingChangeEvidence === false &&
    item.noProviderDelivery &&
    item.noRuntimeExecution &&
    item.noPersistenceWrites &&
    item.noArchiveWrites &&
    item.noRetentionWrites &&
    item.safeToPersist === false &&
    !hasUnsafeReadinessLabel(item.reviewLabel)
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsolePostClosureReadiness(
  input: DisabledOperatorConsolePostClosureReadinessReviewInput
): DisabledOperatorConsolePostClosureReadinessReviewReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl066) {
    blockers.push('Prerequisites through QL-066 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for disabled post-closure readiness review.');
  }
  if (input.requestedScope !== 'disabled_operator_console_post_closure_readiness_review_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_disabled_interface_pathway_decision_gate') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (!input.closedEvidenceSyntheticOnly || !input.closedEvidenceRedactedOnly) {
    blockers.push('Closed evidence must remain synthetic and redacted.');
  }

  const itemMap = new Map(input.readinessItems.map((item) => [item.id, item]));
  const missingItems = disabledOperatorConsolePostClosureReadinessItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing readiness items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.readinessItems.filter((item) => !readinessItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Readiness items failed disabled post-closure checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: DisabledOperatorConsolePostClosureReadinessReviewStatus =
    !input.environment.prerequisitesCompleteThroughQl066
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_operator_console_post_closure_readiness_review_only'
          ? 'blocked_non_review_scope'
          : missingItems.length > 0
            ? 'blocked_missing_readiness_item'
            : failedItems.length > 0
              ? 'blocked_failed_readiness_item'
              : blockers.length > 0
                ? 'blocked_failed_readiness_item'
                : 'disabled_operator_console_post_closure_readiness_review_ready';

  const approved = status === 'disabled_operator_console_post_closure_readiness_review_ready';

  return {
    status,
    decision: approved ? 'approve_disabled_interface_pathway_decision_gate' : 'remain_blocked',
    approvedForDisabledInterfacePathwayDecisionGate: approved,
    postClosureReadinessReviewOnly: true,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    hostingChangeAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerReadAllowed: false,
    liveCustomerWriteAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    safeToPersist: false,
    requiredNextBuild: approved ? 'QL-068-phone-sms-controlled-live-enablement-live-pilot-disabled-interface-pathway-decision-gate' : null,
    blockers,
    reviewedReadinessItems: input.readinessItems.filter((item) => item.readinessReviewed).map((item) => item.id)
  };
}

export const safeDisabledOperatorConsolePostClosureReadinessReviewReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsolePostClosureReadiness(
    safeDisabledOperatorConsolePostClosureReadinessReviewInput
  );
