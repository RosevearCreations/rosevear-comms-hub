export type DisabledOperatorConsoleEvidenceReviewStatus =
  | 'disabled_operator_console_evidence_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_review_item'
  | 'blocked_failed_review_item'
  | 'blocked_non_review_scope';

export type DisabledOperatorConsoleEvidenceReviewDecision =
  | 'approve_disabled_operator_console_evidence_closure_gate'
  | 'continue_rework'
  | 'remain_blocked';

export type DisabledOperatorConsoleEvidenceReviewItemId =
  | 'console_reachability_review'
  | 'console_visibility_review'
  | 'readiness_status_review'
  | 'safety_lock_review'
  | 'manual_activation_checklist_review'
  | 'variable_name_review'
  | 'service_application_link_review'
  | 'disabled_future_action_state_review'
  | 'synthetic_redacted_operator_note_review'
  | 'help_overlay_alignment_review'
  | 'provider_connection_block_review'
  | 'live_number_attachment_block_review'
  | 'callback_registration_block_review'
  | 'sms_sending_block_review'
  | 'call_recording_block_review'
  | 'ai_feature_block_review'
  | 'persistence_customer_data_block_review'
  | 'archive_retention_block_review'
  | 'production_ci_review'
  | 'evidence_closure_readiness_review';

export interface DisabledOperatorConsoleEvidenceReviewEnvironment {
  readonly prerequisitesCompleteThroughQl064: boolean;
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
  readonly evidenceIntakeSyntheticOnly: boolean;
  readonly evidenceIntakeRedactedOnly: boolean;
}

export interface DisabledOperatorConsoleEvidenceReviewItem {
  readonly id: DisabledOperatorConsoleEvidenceReviewItemId;
  readonly evidenceItemCollected: boolean;
  readonly reviewed: boolean;
  readonly acceptedForClosureGate: boolean;
  readonly reviewOnly: boolean;
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
  readonly noProviderDelivery: boolean;
  readonly noRuntimeExecution: boolean;
  readonly noPersistenceWrites: boolean;
  readonly safeToPersist: false;
  readonly reviewLabel: string;
}

export interface DisabledOperatorConsoleEvidenceReviewInput {
  readonly decision: DisabledOperatorConsoleEvidenceReviewDecision;
  readonly environment: DisabledOperatorConsoleEvidenceReviewEnvironment;
  readonly reviewItems: readonly DisabledOperatorConsoleEvidenceReviewItem[];
  readonly requestedScope: 'disabled_operator_console_evidence_review_only';
  readonly evidenceIntakeSyntheticOnly: boolean;
  readonly evidenceIntakeRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-066-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-closure-gate';
  readonly notes: readonly string[];
}

export interface DisabledOperatorConsoleEvidenceReviewReport {
  readonly status: DisabledOperatorConsoleEvidenceReviewStatus;
  readonly decision: DisabledOperatorConsoleEvidenceReviewDecision;
  readonly approvedForEvidenceClosureGate: boolean;
  readonly evidenceReviewOnly: true;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly liveCustomerReadAllowed: false;
  readonly liveCustomerWriteAllowed: false;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-066-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-closure-gate' | null;
  readonly blockers: readonly string[];
  readonly reviewedEvidenceItems: readonly DisabledOperatorConsoleEvidenceReviewItemId[];
}

export const disabledOperatorConsoleEvidenceReviewItemIds: readonly DisabledOperatorConsoleEvidenceReviewItemId[] = [
  'console_reachability_review',
  'console_visibility_review',
  'readiness_status_review',
  'safety_lock_review',
  'manual_activation_checklist_review',
  'variable_name_review',
  'service_application_link_review',
  'disabled_future_action_state_review',
  'synthetic_redacted_operator_note_review',
  'help_overlay_alignment_review',
  'provider_connection_block_review',
  'live_number_attachment_block_review',
  'callback_registration_block_review',
  'sms_sending_block_review',
  'call_recording_block_review',
  'ai_feature_block_review',
  'persistence_customer_data_block_review',
  'archive_retention_block_review',
  'production_ci_review',
  'evidence_closure_readiness_review'
];

export const safeDisabledOperatorConsoleEvidenceReviewEnvironment: DisabledOperatorConsoleEvidenceReviewEnvironment = {
  prerequisitesCompleteThroughQl064: true,
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
  evidenceIntakeSyntheticOnly: true,
  evidenceIntakeRedactedOnly: true
};

export const safeDisabledOperatorConsoleEvidenceReviewItems: readonly DisabledOperatorConsoleEvidenceReviewItem[] =
  disabledOperatorConsoleEvidenceReviewItemIds.map((id) => ({
    id,
    evidenceItemCollected: true,
    reviewed: true,
    acceptedForClosureGate: true,
    reviewOnly: true,
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
    noProviderDelivery: true,
    noRuntimeExecution: true,
    noPersistenceWrites: true,
    safeToPersist: false,
    reviewLabel: `synthetic-redacted-disabled-operator-console-evidence-review-${id}`
  }));

export const safeDisabledOperatorConsoleEvidenceReviewInput: DisabledOperatorConsoleEvidenceReviewInput = {
  decision: 'approve_disabled_operator_console_evidence_closure_gate',
  environment: safeDisabledOperatorConsoleEvidenceReviewEnvironment,
  reviewItems: safeDisabledOperatorConsoleEvidenceReviewItems,
  requestedScope: 'disabled_operator_console_evidence_review_only',
  evidenceIntakeSyntheticOnly: true,
  evidenceIntakeRedactedOnly: true,
  requiredNextBuild: 'QL-066-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-closure-gate',
  notes: [
    'QL-065 reviews QL-064 disabled operator console evidence only.',
    'QL-065 does not connect a provider, attach a live number, send SMS, write persistence, inspect live customers, or start live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: DisabledOperatorConsoleEvidenceReviewEnvironment): boolean {
  return (
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
    !environment.evidenceIntakeSyntheticOnly ||
    !environment.evidenceIntakeRedactedOnly
  );
}

function hasUnsafeReviewLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-redacted-disabled-operator-console-evidence-review-') ||
    normalized.includes('unredacted') ||
    normalized.includes('real-') ||
    normalized.includes('secret-value') ||
    normalized.includes('callback-token') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording')
  );
}

function reviewItemIsSafe(item: DisabledOperatorConsoleEvidenceReviewItem): boolean {
  return (
    item.evidenceItemCollected &&
    item.reviewed &&
    item.acceptedForClosureGate &&
    item.reviewOnly &&
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
    item.noProviderDelivery &&
    item.noRuntimeExecution &&
    item.noPersistenceWrites &&
    item.safeToPersist === false &&
    !hasUnsafeReviewLabel(item.reviewLabel)
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleEvidence(
  input: DisabledOperatorConsoleEvidenceReviewInput
): DisabledOperatorConsoleEvidenceReviewReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl064) {
    blockers.push('Prerequisites through QL-064 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for disabled evidence review.');
  }
  if (input.requestedScope !== 'disabled_operator_console_evidence_review_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_disabled_operator_console_evidence_closure_gate') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (!input.evidenceIntakeSyntheticOnly || !input.evidenceIntakeRedactedOnly) {
    blockers.push('Evidence review must remain based on synthetic and redacted intake material.');
  }

  const itemMap = new Map(input.reviewItems.map((item) => [item.id, item]));
  const missingItems = disabledOperatorConsoleEvidenceReviewItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing review items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.reviewItems.filter((item) => !reviewItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Review items failed disabled evidence review checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: DisabledOperatorConsoleEvidenceReviewStatus =
    !input.environment.prerequisitesCompleteThroughQl064
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_operator_console_evidence_review_only'
          ? 'blocked_non_review_scope'
          : missingItems.length > 0
            ? 'blocked_missing_review_item'
            : failedItems.length > 0
              ? 'blocked_failed_review_item'
              : blockers.length > 0
                ? 'blocked_failed_review_item'
                : 'disabled_operator_console_evidence_review_ready';

  const approved = status === 'disabled_operator_console_evidence_review_ready';

  return {
    status,
    decision: approved ? 'approve_disabled_operator_console_evidence_closure_gate' : 'remain_blocked',
    approvedForEvidenceClosureGate: approved,
    evidenceReviewOnly: true,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerReadAllowed: false,
    liveCustomerWriteAllowed: false,
    safeToPersist: false,
    requiredNextBuild: approved ? 'QL-066-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-closure-gate' : null,
    blockers,
    reviewedEvidenceItems: input.reviewItems.filter((item) => item.reviewed).map((item) => item.id)
  };
}

export const safeDisabledOperatorConsoleEvidenceReviewReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleEvidence(
    safeDisabledOperatorConsoleEvidenceReviewInput
  );
