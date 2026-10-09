export type ControlledActivationPlanReviewStatus =
  | 'controlled_activation_plan_review_ready'
  | 'blocked_missing_prerequisite'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_review_item'
  | 'blocked_failed_review_item'
  | 'blocked_unsafe_review_item'
  | 'blocked_operator_console_not_planned';

export type ControlledActivationPlanReviewDecision =
  | 'approve_disabled_operator_console_scaffold'
  | 'continue_plan_rework'
  | 'remain_blocked';

export interface ControlledActivationPlanReviewEnvironment {
  ql059ExplicitGoNoGoApproved: boolean;
  ql060ControlledActivationPlanningReady: boolean;
  providerWebhookConfigured: boolean;
  providerCallbackAllowed: boolean;
  phoneWebhookAllowed: boolean;
  smsSendAllowed: boolean;
  callRecordingAllowed: boolean;
  aiDraftAllowed: boolean;
  aiAutoSendAllowed: boolean;
  persistenceWritesAllowed: boolean;
  liveCustomerReadAllowed: boolean;
  liveCustomerWriteAllowed: boolean;
  dryRunExecutionAllowed: boolean;
  providerDeliveryAllowed: boolean;
  archiveWritesAllowed: boolean;
  retentionPolicyWritesAllowed: boolean;
  providerAccountConnected: boolean;
  providerLiveNumberAttached: boolean;
  livePilotRuntimeAllowed: boolean;
}

export interface ControlledActivationPlanReviewEvidence {
  syntheticOnly: boolean;
  redactedOnly: boolean;
  safeToPersist: boolean;
  labels: string[];
}

export interface ControlledActivationPlanReviewItem {
  id: string;
  present: boolean;
  reviewed: boolean;
  passed: boolean;
  reviewOnly: boolean;
  controlledActivationPlanScope: boolean;
  operatorConsoleNeedCaptured: boolean;
  disabledConsoleOnly: boolean;
  noLiveEnablementApproval: boolean;
  noProviderConnection: boolean;
  noLiveNumberAttachment: boolean;
  noProviderCallbackRegistration: boolean;
  noProviderDelivery: boolean;
  noRuntimeExecution: boolean;
  noPersistenceWrites: boolean;
  noLiveCustomerData: boolean;
  syntheticEvidenceOnly: boolean;
  redactedEvidenceOnly: boolean;
  safeToPersist: false;
  notes: string;
}

export interface ControlledActivationPlanReviewInput {
  build: 'QL-061';
  stage: 'phone-sms-controlled-live-enablement-live-pilot-controlled-activation-plan-review';
  environment: ControlledActivationPlanReviewEnvironment;
  evidence: ControlledActivationPlanReviewEvidence;
  reviewItems: ControlledActivationPlanReviewItem[];
}

export interface ControlledActivationPlanReviewReport {
  build: 'QL-061';
  status: ControlledActivationPlanReviewStatus;
  decision: ControlledActivationPlanReviewDecision;
  controlledActivationPlanReviewed: boolean;
  approvedForDisabledOperatorConsoleScaffold: boolean;
  recommendedFirstInteractiveSurface: 'QL-062-disabled-operator-console-scaffold';
  liveEnablementAllowed: false;
  livePilotRuntimeAllowed: false;
  providerConnectionAllowed: false;
  providerLiveNumberAttachmentAllowed: false;
  providerCallbackRegistrationAllowed: false;
  providerDeliveryAllowed: false;
  smsSendAllowed: false;
  callRecordingAllowed: false;
  aiDraftAllowed: false;
  aiAutoSendAllowed: false;
  persistenceWritesAllowed: false;
  liveCustomerReadAllowed: false;
  liveCustomerWriteAllowed: false;
  archiveWritesAllowed: false;
  retentionPolicyWritesAllowed: false;
  safeToPersist: false;
  blockingReasons: string[];
  reviewedItemIds: string[];
  requiredNextBuild: 'QL-062-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold';
}

const requiredReviewItemIds = [
  'owner_decision_and_scope_reviewed',
  'manual_activation_boundary_reviewed',
  'variables_plan_reviewed',
  'services_plan_reviewed',
  'application_links_plan_reviewed',
  'provider_account_step_reviewed',
  'live_number_attachment_step_reviewed',
  'callback_registration_step_reviewed',
  'rollback_and_kill_switch_reviewed',
  'rate_limit_and_replay_reviewed',
  'monitoring_and_alerting_reviewed',
  'operator_review_and_help_reviewed',
  'audit_and_redaction_reviewed',
  'customer_boundary_reviewed',
  'production_verification_reviewed',
  'disabled_operator_console_scaffold_needed'
] as const;

export const safeControlledActivationPlanReviewEnvironment: ControlledActivationPlanReviewEnvironment = {
  ql059ExplicitGoNoGoApproved: true,
  ql060ControlledActivationPlanningReady: true,
  providerWebhookConfigured: false,
  providerCallbackAllowed: false,
  phoneWebhookAllowed: false,
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
  livePilotRuntimeAllowed: false
};

export const safeControlledActivationPlanReviewItems: ControlledActivationPlanReviewItem[] = requiredReviewItemIds.map((id) => ({
  id,
  present: true,
  reviewed: true,
  passed: true,
  reviewOnly: true,
  controlledActivationPlanScope: true,
  operatorConsoleNeedCaptured: true,
  disabledConsoleOnly: true,
  noLiveEnablementApproval: true,
  noProviderConnection: true,
  noLiveNumberAttachment: true,
  noProviderCallbackRegistration: true,
  noProviderDelivery: true,
  noRuntimeExecution: true,
  noPersistenceWrites: true,
  noLiveCustomerData: true,
  syntheticEvidenceOnly: true,
  redactedEvidenceOnly: true,
  safeToPersist: false,
  notes: `synthetic-redacted-${id}`
}));

export const safeControlledActivationPlanReviewInput: ControlledActivationPlanReviewInput = {
  build: 'QL-061',
  stage: 'phone-sms-controlled-live-enablement-live-pilot-controlled-activation-plan-review',
  environment: safeControlledActivationPlanReviewEnvironment,
  evidence: {
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    labels: requiredReviewItemIds.map((id) => `synthetic-redacted-${id}`)
  },
  reviewItems: safeControlledActivationPlanReviewItems
};

function hasUnsafeRuntime(environment: ControlledActivationPlanReviewEnvironment): boolean {
  return [
    environment.providerWebhookConfigured,
    environment.providerCallbackAllowed,
    environment.phoneWebhookAllowed,
    environment.smsSendAllowed,
    environment.callRecordingAllowed,
    environment.aiDraftAllowed,
    environment.aiAutoSendAllowed,
    environment.persistenceWritesAllowed,
    environment.liveCustomerReadAllowed,
    environment.liveCustomerWriteAllowed,
    environment.dryRunExecutionAllowed,
    environment.providerDeliveryAllowed,
    environment.archiveWritesAllowed,
    environment.retentionPolicyWritesAllowed,
    environment.providerAccountConnected,
    environment.providerLiveNumberAttached,
    environment.livePilotRuntimeAllowed
  ].some(Boolean);
}

function evidenceLabelsAreSafe(evidence: ControlledActivationPlanReviewEvidence): boolean {
  return evidence.labels.every((label) => label.startsWith('synthetic-redacted-') && !label.includes('unredacted') && !label.includes('real-'));
}

function reviewItemIsSafe(item: ControlledActivationPlanReviewItem): boolean {
  return (
    item.present &&
    item.reviewed &&
    item.passed &&
    item.reviewOnly &&
    item.controlledActivationPlanScope &&
    item.operatorConsoleNeedCaptured &&
    item.disabledConsoleOnly &&
    item.noLiveEnablementApproval &&
    item.noProviderConnection &&
    item.noLiveNumberAttachment &&
    item.noProviderCallbackRegistration &&
    item.noProviderDelivery &&
    item.noRuntimeExecution &&
    item.noPersistenceWrites &&
    item.noLiveCustomerData &&
    item.syntheticEvidenceOnly &&
    item.redactedEvidenceOnly &&
    item.safeToPersist === false
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotControlledActivationPlanReview(
  input: ControlledActivationPlanReviewInput
): ControlledActivationPlanReviewReport {
  const blockingReasons: string[] = [];

  if (!input.environment.ql059ExplicitGoNoGoApproved) {
    blockingReasons.push('QL-059 explicit go/no-go approval is missing.');
  }

  if (!input.environment.ql060ControlledActivationPlanningReady) {
    blockingReasons.push('QL-060 controlled activation planning is not ready.');
  }

  if (hasUnsafeRuntime(input.environment)) {
    blockingReasons.push('At least one live runtime, provider, delivery, persistence, customer, archive, or retention path is enabled.');
  }

  if (!input.evidence.syntheticOnly || !input.evidence.redactedOnly || input.evidence.safeToPersist || !evidenceLabelsAreSafe(input.evidence)) {
    blockingReasons.push('Evidence must remain synthetic, redacted, non-persistable, and safely labelled.');
  }

  const presentIds = new Set(input.reviewItems.map((item) => item.id));
  const missingIds = requiredReviewItemIds.filter((id) => !presentIds.has(id));
  if (missingIds.length > 0) {
    blockingReasons.push(`Missing review items: ${missingIds.join(', ')}.`);
  }

  const failedItems = input.reviewItems.filter((item) => !item.passed || !item.reviewed || !item.present);
  if (failedItems.length > 0) {
    blockingReasons.push(`Failed or incomplete review items: ${failedItems.map((item) => item.id).join(', ')}.`);
  }

  const unsafeItems = input.reviewItems.filter((item) => !reviewItemIsSafe(item));
  if (unsafeItems.length > 0) {
    blockingReasons.push(`Unsafe review items: ${unsafeItems.map((item) => item.id).join(', ')}.`);
  }

  if (!input.reviewItems.some((item) => item.id === 'disabled_operator_console_scaffold_needed' && item.operatorConsoleNeedCaptured)) {
    blockingReasons.push('The disabled operator console scaffold need has not been captured.');
  }

  const ready = blockingReasons.length === 0;

  let status: ControlledActivationPlanReviewStatus = 'controlled_activation_plan_review_ready';
  if (!input.environment.ql059ExplicitGoNoGoApproved || !input.environment.ql060ControlledActivationPlanningReady) {
    status = 'blocked_missing_prerequisite';
  } else if (hasUnsafeRuntime(input.environment)) {
    status = 'blocked_unsafe_environment';
  } else if (missingIds.length > 0) {
    status = 'blocked_missing_review_item';
  } else if (failedItems.length > 0) {
    status = 'blocked_failed_review_item';
  } else if (unsafeItems.length > 0 || !input.evidence.syntheticOnly || !input.evidence.redactedOnly || input.evidence.safeToPersist) {
    status = 'blocked_unsafe_review_item';
  } else if (!ready) {
    status = 'blocked_operator_console_not_planned';
  }

  return {
    build: 'QL-061',
    status,
    decision: ready ? 'approve_disabled_operator_console_scaffold' : 'continue_plan_rework',
    controlledActivationPlanReviewed: ready,
    approvedForDisabledOperatorConsoleScaffold: ready,
    recommendedFirstInteractiveSurface: 'QL-062-disabled-operator-console-scaffold',
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerConnectionAllowed: false,
    providerLiveNumberAttachmentAllowed: false,
    providerCallbackRegistrationAllowed: false,
    providerDeliveryAllowed: false,
    smsSendAllowed: false,
    callRecordingAllowed: false,
    aiDraftAllowed: false,
    aiAutoSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerReadAllowed: false,
    liveCustomerWriteAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    safeToPersist: false,
    blockingReasons,
    reviewedItemIds: input.reviewItems.map((item) => item.id),
    requiredNextBuild: 'QL-062-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold'
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotControlledActivationPlanReview(): ControlledActivationPlanReviewReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotControlledActivationPlanReview(safeControlledActivationPlanReviewInput);
}
