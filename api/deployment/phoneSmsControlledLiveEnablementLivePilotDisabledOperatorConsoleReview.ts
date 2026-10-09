export type DisabledOperatorConsoleReviewStatus =
  | 'disabled_operator_console_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_review_item'
  | 'blocked_failed_review_item'
  | 'blocked_unsafe_console_scope'
  | 'blocked_non_review_scope';

export type DisabledOperatorConsoleReviewDecision =
  | 'approve_disabled_operator_console_evidence_intake'
  | 'continue_rework'
  | 'remain_blocked';

export const REQUIRED_DISABLED_OPERATOR_CONSOLE_REVIEW_PRIOR_BUILDS = [
  'QL-034-phone-sms-explicit-live-enablement-decision-gate',
  'QL-035-phone-sms-controlled-live-enablement-plan',
  'QL-036-phone-sms-controlled-live-enablement-implementation-scaffold',
  'QL-037-phone-sms-controlled-live-enablement-disabled-verification',
  'QL-038-phone-sms-controlled-live-enablement-manual-go-no-go-gate',
  'QL-039-phone-sms-controlled-live-enablement-tiny-monitored-pilot-plan',
  'QL-040-phone-sms-controlled-live-enablement-disabled-pilot-implementation-design',
  'QL-041-phone-sms-controlled-live-enablement-disabled-runtime-verification-design',
  'QL-042-phone-sms-controlled-live-enablement-disabled-runtime-verification-scaffold',
  'QL-043-phone-sms-controlled-live-enablement-disabled-runtime-verification-execution-plan',
  'QL-044-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-cases',
  'QL-045-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-result-review',
  'QL-046-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-plan',
  'QL-047-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-review',
  'QL-048-phone-sms-controlled-live-enablement-disabled-runtime-verification-archive-retention-review',
  'QL-049-phone-sms-controlled-live-enablement-disabled-runtime-verification-final-disabled-closure-gate',
  'QL-050-phone-sms-controlled-live-enablement-post-closure-live-pilot-readiness-decision-gate',
  'QL-051-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake',
  'QL-052-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review',
  'QL-053-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-plan',
  'QL-054-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-review',
  'QL-055-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake',
  'QL-056-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-review',
  'QL-057-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-closure-gate',
  'QL-058-phone-sms-controlled-live-enablement-live-pilot-prerequisite-final-readiness-review',
  'QL-059-phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate',
  'QL-060-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning',
  'QL-061-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-plan-review',
  'QL-062-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold'
] as const;

export type DisabledOperatorConsoleReviewItemId =
  | 'console_mount_review'
  | 'floating_access_button_review'
  | 'readiness_status_review'
  | 'safety_lock_review'
  | 'manual_activation_checklist_review'
  | 'variables_without_secrets_review'
  | 'service_application_links_review'
  | 'disabled_future_action_buttons_review'
  | 'synthetic_redacted_operator_notes_review'
  | 'help_overlay_alignment_review'
  | 'provider_connection_block_review'
  | 'live_number_attachment_block_review'
  | 'callback_registration_block_review'
  | 'sms_sending_block_review'
  | 'call_recording_block_review'
  | 'ai_feature_block_review'
  | 'persistence_and_customer_data_block_review'
  | 'archive_retention_block_review'
  | 'production_ci_proof_review'
  | 'next_evidence_intake_readiness_review';

export interface DisabledOperatorConsoleReviewEnvironment {
  ql034ExplicitDecisionGateApproved: boolean;
  ql035ControlledPlanReady: boolean;
  ql036ImplementationScaffoldReady: boolean;
  ql037DisabledVerificationPassed: boolean;
  ql038ManualGoNoGoApprovedForPlanning: boolean;
  ql039TinyPilotPlanReady: boolean;
  ql040DisabledPilotImplementationDesignReady: boolean;
  ql041DisabledRuntimeVerificationDesignReady: boolean;
  ql042DisabledRuntimeVerificationScaffoldReady: boolean;
  ql043DisabledRuntimeVerificationExecutionPlanReady: boolean;
  ql044DisabledDryRunCasesReady: boolean;
  ql045DisabledDryRunResultReviewReady: boolean;
  ql046DisabledClosurePlanReady: boolean;
  ql047DisabledClosureReviewReady: boolean;
  ql048DisabledArchiveRetentionReviewReady: boolean;
  ql049FinalDisabledClosureGateReady: boolean;
  ql050PostClosureReadinessDecisionGateReady: boolean;
  ql051PrerequisiteEvidenceIntakeReady: boolean;
  ql052PrerequisiteEvidenceReviewReady: boolean;
  ql053PrerequisiteGapClosurePlanReady: boolean;
  ql054PrerequisiteGapClosureReviewReady: boolean;
  ql055PrerequisiteGapEvidenceIntakeReady: boolean;
  ql056PrerequisiteGapEvidenceReviewReady: boolean;
  ql057PrerequisiteGapEvidenceClosureGateReady: boolean;
  ql058PrerequisiteFinalReadinessReviewReady: boolean;
  ql059ExplicitGoNoGoDecisionGateReady: boolean;
  ql060ControlledActivationPlanningReady: boolean;
  ql061ControlledActivationPlanReviewReady: boolean;
  ql062DisabledOperatorConsoleScaffoldReady: boolean;
  providerWebhookConfigured: boolean;
  providerCallbackAllowed: boolean;
  livePhoneWebhookAllowed: boolean;
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
  callbackRegistrationAllowed: boolean;
  livePilotRuntimeAllowed: boolean;
}

export interface DisabledOperatorConsoleReviewItem {
  id: DisabledOperatorConsoleReviewItemId;
  reviewed: boolean;
  passed: boolean;
  reviewOnly: boolean;
  consoleVisibleFromAdmin: boolean;
  disabledConsoleOnly: boolean;
  noLiveEnablementApproval: boolean;
  noProviderConnection: boolean;
  noLiveNumberAttachment: boolean;
  noCallbackRegistration: boolean;
  noProviderDelivery: boolean;
  noSmsSending: boolean;
  noRuntimeExecution: boolean;
  noPersistenceWrites: boolean;
  noLiveCustomerData: boolean;
  noArchiveRetentionWrites: boolean;
  syntheticEvidenceOnly: boolean;
  redactedEvidenceOnly: boolean;
  safeToPersist: false;
  evidenceLabel: string;
}

export interface DisabledOperatorConsoleReviewInput {
  environment: DisabledOperatorConsoleReviewEnvironment;
  reviewItems: Record<DisabledOperatorConsoleReviewItemId, DisabledOperatorConsoleReviewItem>;
  requestedDecision: DisabledOperatorConsoleReviewDecision;
  requestedScope: 'disabled_operator_console_review_only';
}

export interface DisabledOperatorConsoleReviewResult {
  status: DisabledOperatorConsoleReviewStatus;
  decision: DisabledOperatorConsoleReviewDecision;
  approvedNextBuild: 'QL-064-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-intake' | null;
  reviewedItems: DisabledOperatorConsoleReviewItemId[];
  blockedReasons: string[];
  livePilotRuntimeAllowed: false;
  providerDeliveryAllowed: false;
  providerAccountConnected: false;
  providerLiveNumberAttached: false;
  callbackRegistrationAllowed: false;
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
}

const REQUIRED_ENVIRONMENT_KEYS: Array<keyof DisabledOperatorConsoleReviewEnvironment> = [
  'ql034ExplicitDecisionGateApproved',
  'ql035ControlledPlanReady',
  'ql036ImplementationScaffoldReady',
  'ql037DisabledVerificationPassed',
  'ql038ManualGoNoGoApprovedForPlanning',
  'ql039TinyPilotPlanReady',
  'ql040DisabledPilotImplementationDesignReady',
  'ql041DisabledRuntimeVerificationDesignReady',
  'ql042DisabledRuntimeVerificationScaffoldReady',
  'ql043DisabledRuntimeVerificationExecutionPlanReady',
  'ql044DisabledDryRunCasesReady',
  'ql045DisabledDryRunResultReviewReady',
  'ql046DisabledClosurePlanReady',
  'ql047DisabledClosureReviewReady',
  'ql048DisabledArchiveRetentionReviewReady',
  'ql049FinalDisabledClosureGateReady',
  'ql050PostClosureReadinessDecisionGateReady',
  'ql051PrerequisiteEvidenceIntakeReady',
  'ql052PrerequisiteEvidenceReviewReady',
  'ql053PrerequisiteGapClosurePlanReady',
  'ql054PrerequisiteGapClosureReviewReady',
  'ql055PrerequisiteGapEvidenceIntakeReady',
  'ql056PrerequisiteGapEvidenceReviewReady',
  'ql057PrerequisiteGapEvidenceClosureGateReady',
  'ql058PrerequisiteFinalReadinessReviewReady',
  'ql059ExplicitGoNoGoDecisionGateReady',
  'ql060ControlledActivationPlanningReady',
  'ql061ControlledActivationPlanReviewReady',
  'ql062DisabledOperatorConsoleScaffoldReady'
];

const FORBIDDEN_ENVIRONMENT_KEYS: Array<keyof DisabledOperatorConsoleReviewEnvironment> = [
  'providerWebhookConfigured',
  'providerCallbackAllowed',
  'livePhoneWebhookAllowed',
  'smsSendAllowed',
  'callRecordingAllowed',
  'aiDraftAllowed',
  'aiAutoSendAllowed',
  'persistenceWritesAllowed',
  'liveCustomerReadAllowed',
  'liveCustomerWriteAllowed',
  'dryRunExecutionAllowed',
  'providerDeliveryAllowed',
  'archiveWritesAllowed',
  'retentionPolicyWritesAllowed',
  'providerAccountConnected',
  'providerLiveNumberAttached',
  'callbackRegistrationAllowed',
  'livePilotRuntimeAllowed'
];

export const DISABLED_OPERATOR_CONSOLE_REVIEW_ITEM_IDS: DisabledOperatorConsoleReviewItemId[] = [
  'console_mount_review',
  'floating_access_button_review',
  'readiness_status_review',
  'safety_lock_review',
  'manual_activation_checklist_review',
  'variables_without_secrets_review',
  'service_application_links_review',
  'disabled_future_action_buttons_review',
  'synthetic_redacted_operator_notes_review',
  'help_overlay_alignment_review',
  'provider_connection_block_review',
  'live_number_attachment_block_review',
  'callback_registration_block_review',
  'sms_sending_block_review',
  'call_recording_block_review',
  'ai_feature_block_review',
  'persistence_and_customer_data_block_review',
  'archive_retention_block_review',
  'production_ci_proof_review',
  'next_evidence_intake_readiness_review'
];

function hasUnsafeEvidenceLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return !normalized.startsWith('synthetic-redacted-') || normalized.includes('unredacted') || normalized.includes('real-');
}

function reviewItemIsSafe(item: DisabledOperatorConsoleReviewItem): boolean {
  return (
    item.reviewed &&
    item.passed &&
    item.reviewOnly &&
    item.consoleVisibleFromAdmin &&
    item.disabledConsoleOnly &&
    item.noLiveEnablementApproval &&
    item.noProviderConnection &&
    item.noLiveNumberAttachment &&
    item.noCallbackRegistration &&
    item.noProviderDelivery &&
    item.noSmsSending &&
    item.noRuntimeExecution &&
    item.noPersistenceWrites &&
    item.noLiveCustomerData &&
    item.noArchiveRetentionWrites &&
    item.syntheticEvidenceOnly &&
    item.redactedEvidenceOnly &&
    item.safeToPersist === false &&
    !hasUnsafeEvidenceLabel(item.evidenceLabel)
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleReview(
  input: DisabledOperatorConsoleReviewInput
): DisabledOperatorConsoleReviewResult {
  const blockedReasons: string[] = [];

  const missingPrerequisites = REQUIRED_ENVIRONMENT_KEYS.filter((key) => input.environment[key] !== true);
  if (missingPrerequisites.length > 0) {
    blockedReasons.push(`Missing completed prerequisites: ${missingPrerequisites.join(', ')}`);
  }

  const unsafeEnvironment = FORBIDDEN_ENVIRONMENT_KEYS.filter((key) => input.environment[key] !== false);
  if (unsafeEnvironment.length > 0) {
    blockedReasons.push(`Unsafe environment flags enabled: ${unsafeEnvironment.join(', ')}`);
  }

  if (input.requestedScope !== 'disabled_operator_console_review_only') {
    blockedReasons.push(`Unsupported requested scope: ${input.requestedScope}`);
  }

  if (input.requestedDecision !== 'approve_disabled_operator_console_evidence_intake') {
    blockedReasons.push(`Unsupported requested decision: ${input.requestedDecision}`);
  }

  const missingItems = DISABLED_OPERATOR_CONSOLE_REVIEW_ITEM_IDS.filter((id) => !input.reviewItems[id]);
  if (missingItems.length > 0) {
    blockedReasons.push(`Missing review items: ${missingItems.join(', ')}`);
  }

  const unsafeItems = DISABLED_OPERATOR_CONSOLE_REVIEW_ITEM_IDS.filter((id) => {
    const item = input.reviewItems[id];
    return item ? !reviewItemIsSafe(item) : false;
  });
  if (unsafeItems.length > 0) {
    blockedReasons.push(`Review items failed disabled-console safety checks: ${unsafeItems.join(', ')}`);
  }

  const status: DisabledOperatorConsoleReviewStatus =
    missingPrerequisites.length > 0
      ? 'blocked_pending_prerequisites'
      : unsafeEnvironment.length > 0
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'disabled_operator_console_review_only'
          ? 'blocked_non_review_scope'
          : missingItems.length > 0
            ? 'blocked_missing_review_item'
            : unsafeItems.length > 0
              ? 'blocked_failed_review_item'
              : 'disabled_operator_console_review_ready';

  const approved = status === 'disabled_operator_console_review_ready';

  return {
    status,
    decision: approved ? 'approve_disabled_operator_console_evidence_intake' : 'remain_blocked',
    approvedNextBuild: approved
      ? 'QL-064-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-evidence-intake'
      : null,
    reviewedItems: DISABLED_OPERATOR_CONSOLE_REVIEW_ITEM_IDS.filter((id) => Boolean(input.reviewItems[id]?.reviewed)),
    blockedReasons,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    providerAccountConnected: false,
    providerLiveNumberAttached: false,
    callbackRegistrationAllowed: false,
    smsSendAllowed: false,
    callRecordingAllowed: false,
    aiDraftAllowed: false,
    aiAutoSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerReadAllowed: false,
    liveCustomerWriteAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    safeToPersist: false
  };
}

export const safeDisabledOperatorConsoleReviewEnvironment: DisabledOperatorConsoleReviewEnvironment = {
  ql034ExplicitDecisionGateApproved: true,
  ql035ControlledPlanReady: true,
  ql036ImplementationScaffoldReady: true,
  ql037DisabledVerificationPassed: true,
  ql038ManualGoNoGoApprovedForPlanning: true,
  ql039TinyPilotPlanReady: true,
  ql040DisabledPilotImplementationDesignReady: true,
  ql041DisabledRuntimeVerificationDesignReady: true,
  ql042DisabledRuntimeVerificationScaffoldReady: true,
  ql043DisabledRuntimeVerificationExecutionPlanReady: true,
  ql044DisabledDryRunCasesReady: true,
  ql045DisabledDryRunResultReviewReady: true,
  ql046DisabledClosurePlanReady: true,
  ql047DisabledClosureReviewReady: true,
  ql048DisabledArchiveRetentionReviewReady: true,
  ql049FinalDisabledClosureGateReady: true,
  ql050PostClosureReadinessDecisionGateReady: true,
  ql051PrerequisiteEvidenceIntakeReady: true,
  ql052PrerequisiteEvidenceReviewReady: true,
  ql053PrerequisiteGapClosurePlanReady: true,
  ql054PrerequisiteGapClosureReviewReady: true,
  ql055PrerequisiteGapEvidenceIntakeReady: true,
  ql056PrerequisiteGapEvidenceReviewReady: true,
  ql057PrerequisiteGapEvidenceClosureGateReady: true,
  ql058PrerequisiteFinalReadinessReviewReady: true,
  ql059ExplicitGoNoGoDecisionGateReady: true,
  ql060ControlledActivationPlanningReady: true,
  ql061ControlledActivationPlanReviewReady: true,
  ql062DisabledOperatorConsoleScaffoldReady: true,
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
  livePilotRuntimeAllowed: false
};

export const safeDisabledOperatorConsoleReviewItems = DISABLED_OPERATOR_CONSOLE_REVIEW_ITEM_IDS.reduce(
  (items, id) => ({
    ...items,
    [id]: {
      id,
      reviewed: true,
      passed: true,
      reviewOnly: true,
      consoleVisibleFromAdmin: true,
      disabledConsoleOnly: true,
      noLiveEnablementApproval: true,
      noProviderConnection: true,
      noLiveNumberAttachment: true,
      noCallbackRegistration: true,
      noProviderDelivery: true,
      noSmsSending: true,
      noRuntimeExecution: true,
      noPersistenceWrites: true,
      noLiveCustomerData: true,
      noArchiveRetentionWrites: true,
      syntheticEvidenceOnly: true,
      redactedEvidenceOnly: true,
      safeToPersist: false,
      evidenceLabel: `synthetic-redacted-${id}`
    }
  }),
  {} as Record<DisabledOperatorConsoleReviewItemId, DisabledOperatorConsoleReviewItem>
);

export const safeDisabledOperatorConsoleReviewInput: DisabledOperatorConsoleReviewInput = {
  environment: safeDisabledOperatorConsoleReviewEnvironment,
  reviewItems: safeDisabledOperatorConsoleReviewItems,
  requestedDecision: 'approve_disabled_operator_console_evidence_intake',
  requestedScope: 'disabled_operator_console_review_only'
};

export function runPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleReview(): DisabledOperatorConsoleReviewResult {
  return reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleReview(safeDisabledOperatorConsoleReviewInput);
}
