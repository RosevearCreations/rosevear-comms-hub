export type DisabledOperatorConsoleEvidenceClosureGateStatus =
  | 'disabled_operator_console_evidence_closure_gate_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_closure_item'
  | 'blocked_failed_closure_item'
  | 'blocked_non_closure_scope';

export type DisabledOperatorConsoleEvidenceClosureGateDecision =
  | 'approve_disabled_operator_console_post_closure_readiness_review'
  | 'continue_rework'
  | 'remain_blocked';

export type DisabledOperatorConsoleEvidenceClosureGateItemId =
  | 'reviewed_evidence_set_closure'
  | 'console_reachability_closure'
  | 'console_visibility_closure'
  | 'readiness_status_closure'
  | 'safety_lock_closure'
  | 'manual_activation_checklist_closure'
  | 'variable_name_closure'
  | 'service_application_link_closure'
  | 'disabled_future_action_state_closure'
  | 'synthetic_redacted_operator_note_closure'
  | 'help_overlay_alignment_closure'
  | 'rejected_evidence_category_closure'
  | 'provider_connection_block_closure'
  | 'live_number_attachment_block_closure'
  | 'callback_registration_block_closure'
  | 'sms_sending_block_closure'
  | 'call_recording_block_closure'
  | 'ai_feature_block_closure'
  | 'persistence_customer_data_block_closure'
  | 'archive_retention_block_closure'
  | 'production_ci_closure'
  | 'post_closure_readiness_review_closure';

export interface DisabledOperatorConsoleEvidenceClosureGateEnvironment {
  readonly prerequisitesCompleteThroughQl065: boolean;
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
  readonly evidenceReviewSyntheticOnly: boolean;
  readonly evidenceReviewRedactedOnly: boolean;
  readonly rejectedEvidenceCategoriesStillBlocked: boolean;
}

export interface DisabledOperatorConsoleEvidenceClosureGateItem {
  readonly id: DisabledOperatorConsoleEvidenceClosureGateItemId;
  readonly evidenceReviewed: boolean;
  readonly closedForDisabledGate: boolean;
  readonly closureOnly: boolean;
  readonly visibleInDisabledConsole: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly rejectedUnsafeEvidence: boolean;
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
  readonly noArchiveWrites: boolean;
  readonly noRetentionPolicyWrites: boolean;
  readonly safeToPersist: false;
  readonly closureLabel: string;
}

export interface DisabledOperatorConsoleEvidenceClosureGateInput {
  readonly decision: DisabledOperatorConsoleEvidenceClosureGateDecision;
  readonly environment: DisabledOperatorConsoleEvidenceClosureGateEnvironment;
  readonly closureItems: readonly DisabledOperatorConsoleEvidenceClosureGateItem[];
  readonly requestedScope: 'disabled_operator_console_evidence_closure_gate_only';
  readonly evidenceReviewSyntheticOnly: boolean;
  readonly evidenceReviewRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-067-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-post-closure-readiness-review';
  readonly notes: readonly string[];
}

export interface DisabledOperatorConsoleEvidenceClosureGateReport {
  readonly status: DisabledOperatorConsoleEvidenceClosureGateStatus;
  readonly decision: DisabledOperatorConsoleEvidenceClosureGateDecision;
  readonly approvedForPostClosureReadinessReview: boolean;
  readonly evidenceClosureGateOnly: true;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly liveCustomerReadAllowed: false;
  readonly liveCustomerWriteAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly safeToPersist: false;
  readonly requiredNextBuild:
    | 'QL-067-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-post-closure-readiness-review'
    | null;
  readonly blockers: readonly string[];
  readonly closedEvidenceItems: readonly DisabledOperatorConsoleEvidenceClosureGateItemId[];
}

export const disabledOperatorConsoleEvidenceClosureGateItemIds: readonly DisabledOperatorConsoleEvidenceClosureGateItemId[] = [
  'reviewed_evidence_set_closure',
  'console_reachability_closure',
  'console_visibility_closure',
  'readiness_status_closure',
  'safety_lock_closure',
  'manual_activation_checklist_closure',
  'variable_name_closure',
  'service_application_link_closure',
  'disabled_future_action_state_closure',
  'synthetic_redacted_operator_note_closure',
  'help_overlay_alignment_closure',
  'rejected_evidence_category_closure',
  'provider_connection_block_closure',
  'live_number_attachment_block_closure',
  'callback_registration_block_closure',
  'sms_sending_block_closure',
  'call_recording_block_closure',
  'ai_feature_block_closure',
  'persistence_customer_data_block_closure',
  'archive_retention_block_closure',
  'production_ci_closure',
  'post_closure_readiness_review_closure'
];

export const safeDisabledOperatorConsoleEvidenceClosureGateEnvironment: DisabledOperatorConsoleEvidenceClosureGateEnvironment = {
  prerequisitesCompleteThroughQl065: true,
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
  evidenceReviewSyntheticOnly: true,
  evidenceReviewRedactedOnly: true,
  rejectedEvidenceCategoriesStillBlocked: true
};

export const safeDisabledOperatorConsoleEvidenceClosureGateItems: readonly DisabledOperatorConsoleEvidenceClosureGateItem[] =
  disabledOperatorConsoleEvidenceClosureGateItemIds.map((id) => ({
    id,
    evidenceReviewed: true,
    closedForDisabledGate: true,
    closureOnly: true,
    visibleInDisabledConsole: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    rejectedUnsafeEvidence: true,
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
    noArchiveWrites: true,
    noRetentionPolicyWrites: true,
    safeToPersist: false,
    closureLabel: `synthetic-redacted-disabled-operator-console-evidence-closure-gate-${id}`
  }));

export const safeDisabledOperatorConsoleEvidenceClosureGateInput: DisabledOperatorConsoleEvidenceClosureGateInput = {
  decision: 'approve_disabled_operator_console_post_closure_readiness_review',
  environment: safeDisabledOperatorConsoleEvidenceClosureGateEnvironment,
  closureItems: safeDisabledOperatorConsoleEvidenceClosureGateItems,
  requestedScope: 'disabled_operator_console_evidence_closure_gate_only',
  evidenceReviewSyntheticOnly: true,
  evidenceReviewRedactedOnly: true,
  requiredNextBuild: 'QL-067-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-post-closure-readiness-review',
  notes: [
    'QL-066 closes QL-065 reviewed disabled operator console evidence only.',
    'QL-066 does not connect a provider, attach a live number, send SMS, write persistence, inspect live customers, archive evidence, change retention policy, or start live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: DisabledOperatorConsoleEvidenceClosureGateEnvironment): boolean {
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
    !environment.evidenceReviewSyntheticOnly ||
    !environment.evidenceReviewRedactedOnly ||
    !environment.rejectedEvidenceCategoriesStillBlocked
  );
}

function hasUnsafeClosureLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-redacted-disabled-operator-console-evidence-closure-gate-') ||
    normalized.includes('unredacted') ||
    normalized.includes('real-') ||
    normalized.includes('secret-value') ||
    normalized.includes('callback-token') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('persisted') ||
    normalized.includes('archive-write') ||
    normalized.includes('retention-write')
  );
}

function closureGateItemIsSafe(item: DisabledOperatorConsoleEvidenceClosureGateItem): boolean {
  return (
    item.evidenceReviewed &&
    item.closedForDisabledGate &&
    item.closureOnly &&
    item.visibleInDisabledConsole &&
    item.syntheticEvidenceOnly &&
    item.redactedEvidenceOnly &&
    item.rejectedUnsafeEvidence &&
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
    item.noArchiveWrites &&
    item.noRetentionPolicyWrites &&
    item.safeToPersist === false &&
    !hasUnsafeClosureLabel(item.closureLabel)
  );
}

export function closePhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleEvidence(
  input: DisabledOperatorConsoleEvidenceClosureGateInput
): DisabledOperatorConsoleEvidenceClosureGateReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl065) {
    blockers.push('Prerequisites through QL-065 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for disabled evidence closure.');
  }
  if (input.requestedScope !== 'disabled_operator_console_evidence_closure_gate_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_disabled_operator_console_post_closure_readiness_review') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (!input.evidenceReviewSyntheticOnly || !input.evidenceReviewRedactedOnly) {
    blockers.push('Evidence closure must remain based on synthetic and redacted review material.');
  }

  const itemMap = new Map(input.closureItems.map((item) => [item.id, item]));
  const missingItems = disabledOperatorConsoleEvidenceClosureGateItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing closure items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.closureItems.filter((item) => !closureGateItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Closure items failed disabled evidence closure checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: DisabledOperatorConsoleEvidenceClosureGateStatus =
    !input.environment.prerequisitesCompleteThroughQl065
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_operator_console_evidence_closure_gate_only'
          ? 'blocked_non_closure_scope'
          : missingItems.length > 0
            ? 'blocked_missing_closure_item'
            : failedItems.length > 0
              ? 'blocked_failed_closure_item'
              : blockers.length > 0
                ? 'blocked_failed_closure_item'
                : 'disabled_operator_console_evidence_closure_gate_ready';

  const approved = status === 'disabled_operator_console_evidence_closure_gate_ready';

  return {
    status,
    decision: approved ? 'approve_disabled_operator_console_post_closure_readiness_review' : 'remain_blocked',
    approvedForPostClosureReadinessReview: approved,
    evidenceClosureGateOnly: true,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerReadAllowed: false,
    liveCustomerWriteAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    safeToPersist: false,
    requiredNextBuild: approved
      ? 'QL-067-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-post-closure-readiness-review'
      : null,
    blockers,
    closedEvidenceItems: input.closureItems.filter((item) => item.closedForDisabledGate).map((item) => item.id)
  };
}

export const safeDisabledOperatorConsoleEvidenceClosureGateReport =
  closePhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleEvidence(
    safeDisabledOperatorConsoleEvidenceClosureGateInput
  );
