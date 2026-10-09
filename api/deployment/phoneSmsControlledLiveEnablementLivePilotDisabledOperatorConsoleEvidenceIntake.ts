export type DisabledOperatorConsoleEvidenceIntakeStatus =
  | 'disabled_operator_console_evidence_intake_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_evidence_item'
  | 'blocked_failed_evidence_item'
  | 'blocked_non_intake_scope';

export type DisabledOperatorConsoleEvidenceIntakeDecision =
  | 'approve_disabled_operator_console_evidence_review'
  | 'continue_rework'
  | 'remain_blocked';

export type DisabledOperatorConsoleEvidenceItemId =
  | 'console_reachability_evidence'
  | 'console_visibility_evidence'
  | 'readiness_status_evidence'
  | 'safety_lock_evidence'
  | 'manual_activation_checklist_evidence'
  | 'variable_name_evidence'
  | 'service_application_link_evidence'
  | 'disabled_future_action_state_evidence'
  | 'synthetic_redacted_operator_note_evidence'
  | 'help_overlay_alignment_evidence'
  | 'provider_connection_block_evidence'
  | 'live_number_attachment_block_evidence'
  | 'callback_registration_block_evidence'
  | 'sms_sending_block_evidence'
  | 'call_recording_block_evidence'
  | 'ai_feature_block_evidence'
  | 'persistence_customer_data_block_evidence'
  | 'archive_retention_block_evidence'
  | 'production_ci_evidence'
  | 'evidence_review_readiness_evidence';

export interface DisabledOperatorConsoleEvidenceIntakeEnvironment {
  readonly prerequisitesCompleteThroughQl063: boolean;
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
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
}

export interface DisabledOperatorConsoleEvidenceItem {
  readonly id: DisabledOperatorConsoleEvidenceItemId;
  readonly evidenceCollected: boolean;
  readonly readyForReview: boolean;
  readonly intakeOnly: boolean;
  readonly visibleInDisabledConsole: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly containsSecretValue: false;
  readonly containsLiveCustomerData: false;
  readonly noProviderDelivery: boolean;
  readonly noRuntimeExecution: boolean;
  readonly noPersistenceWrites: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface DisabledOperatorConsoleEvidenceIntakeInput {
  readonly decision: DisabledOperatorConsoleEvidenceIntakeDecision;
  readonly environment: DisabledOperatorConsoleEvidenceIntakeEnvironment;
  readonly evidenceItems: readonly DisabledOperatorConsoleEvidenceItem[];
  readonly requestedScope: 'disabled_operator_console_evidence_intake_only';
  readonly evidenceSyntheticOnly: boolean;
  readonly evidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-065-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-review';
  readonly notes: readonly string[];
}

export interface DisabledOperatorConsoleEvidenceIntakeReport {
  readonly status: DisabledOperatorConsoleEvidenceIntakeStatus;
  readonly decision: DisabledOperatorConsoleEvidenceIntakeDecision;
  readonly approvedForEvidenceReview: boolean;
  readonly evidenceIntakeOnly: true;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly smsSendAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly liveCustomerReadAllowed: false;
  readonly liveCustomerWriteAllowed: false;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-065-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-review' | null;
  readonly blockers: readonly string[];
  readonly collectedEvidenceItems: readonly DisabledOperatorConsoleEvidenceItemId[];
}

export const disabledOperatorConsoleEvidenceItemIds: readonly DisabledOperatorConsoleEvidenceItemId[] = [
  'console_reachability_evidence',
  'console_visibility_evidence',
  'readiness_status_evidence',
  'safety_lock_evidence',
  'manual_activation_checklist_evidence',
  'variable_name_evidence',
  'service_application_link_evidence',
  'disabled_future_action_state_evidence',
  'synthetic_redacted_operator_note_evidence',
  'help_overlay_alignment_evidence',
  'provider_connection_block_evidence',
  'live_number_attachment_block_evidence',
  'callback_registration_block_evidence',
  'sms_sending_block_evidence',
  'call_recording_block_evidence',
  'ai_feature_block_evidence',
  'persistence_customer_data_block_evidence',
  'archive_retention_block_evidence',
  'production_ci_evidence',
  'evidence_review_readiness_evidence'
];

export const safeDisabledOperatorConsoleEvidenceIntakeEnvironment: DisabledOperatorConsoleEvidenceIntakeEnvironment = {
  prerequisitesCompleteThroughQl063: true,
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
  syntheticOnly: true,
  redactedOnly: true
};

export const safeDisabledOperatorConsoleEvidenceItems: readonly DisabledOperatorConsoleEvidenceItem[] =
  disabledOperatorConsoleEvidenceItemIds.map((id) => ({
    id,
    evidenceCollected: true,
    readyForReview: true,
    intakeOnly: true,
    visibleInDisabledConsole: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    containsSecretValue: false,
    containsLiveCustomerData: false,
    noProviderDelivery: true,
    noRuntimeExecution: true,
    noPersistenceWrites: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-disabled-operator-console-evidence-intake-${id}`
  }));

export const safeDisabledOperatorConsoleEvidenceIntakeInput: DisabledOperatorConsoleEvidenceIntakeInput = {
  decision: 'approve_disabled_operator_console_evidence_review',
  environment: safeDisabledOperatorConsoleEvidenceIntakeEnvironment,
  evidenceItems: safeDisabledOperatorConsoleEvidenceItems,
  requestedScope: 'disabled_operator_console_evidence_intake_only',
  evidenceSyntheticOnly: true,
  evidenceRedactedOnly: true,
  requiredNextBuild: 'QL-065-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-review',
  notes: [
    'QL-064 collects disabled operator console evidence for review only.',
    'QL-064 does not connect a provider, attach a live number, send SMS, write persistence, inspect live customers, or start live pilot runtime.'
  ]
};

function environmentIsUnsafe(environment: DisabledOperatorConsoleEvidenceIntakeEnvironment): boolean {
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
    !environment.syntheticOnly ||
    !environment.redactedOnly
  );
}

function hasUnsafeEvidenceLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-redacted-disabled-operator-console-evidence-intake-') ||
    normalized.includes('unredacted') ||
    normalized.includes('real-') ||
    normalized.includes('secret-value')
  );
}

function evidenceItemIsSafe(item: DisabledOperatorConsoleEvidenceItem): boolean {
  return (
    item.evidenceCollected &&
    item.readyForReview &&
    item.intakeOnly &&
    item.visibleInDisabledConsole &&
    item.syntheticEvidenceOnly &&
    item.redactedEvidenceOnly &&
    item.containsSecretValue === false &&
    item.containsLiveCustomerData === false &&
    item.noProviderDelivery &&
    item.noRuntimeExecution &&
    item.noPersistenceWrites &&
    item.safeToPersist === false &&
    !hasUnsafeEvidenceLabel(item.evidenceLabel)
  );
}

export function intakePhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleEvidence(
  input: DisabledOperatorConsoleEvidenceIntakeInput
): DisabledOperatorConsoleEvidenceIntakeReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl063) {
    blockers.push('Prerequisites through QL-063 must be complete.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for disabled evidence intake.');
  }
  if (input.requestedScope !== 'disabled_operator_console_evidence_intake_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_disabled_operator_console_evidence_review') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }
  if (!input.evidenceSyntheticOnly || !input.evidenceRedactedOnly) {
    blockers.push('Evidence intake must remain synthetic and redacted.');
  }

  const itemMap = new Map(input.evidenceItems.map((item) => [item.id, item]));
  const missingItems = disabledOperatorConsoleEvidenceItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing evidence items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.evidenceItems.filter((item) => !evidenceItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Evidence items failed disabled intake checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: DisabledOperatorConsoleEvidenceIntakeStatus =
    !input.environment.prerequisitesCompleteThroughQl063
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_operator_console_evidence_intake_only'
          ? 'blocked_non_intake_scope'
          : missingItems.length > 0
            ? 'blocked_missing_evidence_item'
            : failedItems.length > 0
              ? 'blocked_failed_evidence_item'
              : blockers.length > 0
                ? 'blocked_failed_evidence_item'
                : 'disabled_operator_console_evidence_intake_ready';

  const approved = status === 'disabled_operator_console_evidence_intake_ready';

  return {
    status,
    decision: approved ? 'approve_disabled_operator_console_evidence_review' : 'remain_blocked',
    approvedForEvidenceReview: approved,
    evidenceIntakeOnly: true,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerReadAllowed: false,
    liveCustomerWriteAllowed: false,
    safeToPersist: false,
    requiredNextBuild: approved ? 'QL-065-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-review' : null,
    blockers,
    collectedEvidenceItems: input.evidenceItems.filter((item) => item.evidenceCollected).map((item) => item.id)
  };
}

export const safeDisabledOperatorConsoleEvidenceIntakeReport =
  intakePhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleEvidence(
    safeDisabledOperatorConsoleEvidenceIntakeInput
  );
