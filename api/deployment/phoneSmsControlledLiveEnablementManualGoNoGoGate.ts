export type PhoneSmsControlledLiveEnablementManualGoNoGoStatus =
  | 'blocked_pending_manual_go_no_go_gate'
  | 'approved_for_tiny_monitored_pilot_planning'
  | 'blocked_continue_rework'
  | 'blocked_missing_disabled_verification'
  | 'blocked_missing_manual_approval'
  | 'blocked_missing_control'
  | 'blocked_unsafe_environment'
  | 'blocked_live_behavior_enabled'
  | 'blocked_unredacted_or_live_evidence';

export type PhoneSmsControlledLiveEnablementManualDecision =
  | 'approve_tiny_monitored_pilot_planning'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementManualControl =
  | 'owner_approval'
  | 'operator_training_acknowledgement'
  | 'provider_boundary_acknowledgement'
  | 'webhook_boundary_acknowledgement'
  | 'sms_send_boundary_acknowledgement'
  | 'call_recording_boundary_acknowledgement'
  | 'ai_boundary_acknowledgement'
  | 'persistence_boundary_acknowledgement'
  | 'live_customer_data_boundary_acknowledgement'
  | 'redaction_boundary_acknowledgement'
  | 'rollback_boundary_acknowledgement'
  | 'rate_limit_boundary_acknowledgement'
  | 'replay_protection_boundary_acknowledgement'
  | 'pilot_scope_boundary_acknowledgement'
  | 'post_pilot_review_required';

export type PhoneSmsControlledLiveEnablementManualEvidenceLabel =
  | 'ql034_decision_gate'
  | 'ql035_controlled_plan'
  | 'ql036_disabled_scaffold'
  | 'ql037_disabled_verification'
  | 'manual_go_no_go_notes';

export type PhoneSmsControlledLiveEnablementManualEnvironment = {
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'approved_for_controlled_live_enablement_planning' | 'blocked_pending_explicit_live_enablement_decision_gate';
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS: 'plan_ready_for_manual_implementation_design' | 'blocked_pending_controlled_live_enablement_plan';
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS: 'scaffold_ready_for_disabled_verification' | 'blocked_pending_disabled_implementation_scaffold';
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_STATUS: 'disabled_verification_green' | 'blocked_pending_disabled_verification';
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_STATUS: 'blocked_pending_manual_go_no_go_gate' | 'approved_for_tiny_monitored_pilot_planning';
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SYNTHETIC_ONLY: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_REDACTED_ONLY: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_NO_PERSISTENCE_WRITES: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_LIVE_CUSTOMER_ACCESS_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PROVIDER_CALLBACK_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PHONE_WEBHOOK_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SMS_SEND_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_CALL_RECORDING_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AI_DRAFTS_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AUTO_SEND_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PILOT_IMPLEMENTATION_REQUIRED: boolean;
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: boolean;
  TELEPHONY_PROVIDER: '' | 'undecided' | 'voipms' | 'telnyx' | 'twilio';
  ENABLE_PHONE_WEBHOOKS: boolean;
  ENABLE_SMS: boolean;
  ENABLE_CALL_RECORDING: boolean;
  ENABLE_AI_DRAFTS: boolean;
  ENABLE_AI_AUTO_SEND: boolean;
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: boolean;
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: boolean;
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: boolean;
  PHONE_SMS_EXISTING_NUMBERS_PROTECTED: boolean;
};

export type PhoneSmsControlledLiveEnablementManualControlAcknowledgement = {
  id: string;
  control: PhoneSmsControlledLiveEnablementManualControl;
  label: string;
  acknowledged: boolean;
  syntheticOnly: true;
  redactedOnly: true;
  safeToPersist: false;
  liveEnablementAllowed: false;
  containsActualPhoneNumber: boolean;
  containsProviderCredential: boolean;
  containsWebhookSecretValue: boolean;
  containsCustomerData: boolean;
  containsLivePayload: boolean;
  containsRecording: boolean;
  containsTranscript: boolean;
};

export type PhoneSmsControlledLiveEnablementManualEvidence = {
  id: string;
  label: PhoneSmsControlledLiveEnablementManualEvidenceLabel;
  summary: string;
  syntheticOnly: true;
  redactedOnly: true;
  safeToPersist: false;
  disabledVerificationGreen: boolean;
  liveEnablementAllowed: false;
  providerCallbackAllowed: false;
  phoneWebhookAllowed: false;
  smsSendAllowed: false;
  callRecordingAllowed: false;
  aiDraftAllowed: false;
  autoSendAllowed: false;
  persistenceWrites: false;
  liveCustomerRead: false;
  liveCustomerWrite: false;
  containsActualPhoneNumber: boolean;
  containsProviderCredential: boolean;
  containsWebhookSecretValue: boolean;
  containsCustomerData: boolean;
  containsLivePayload: boolean;
  containsRecording: boolean;
  containsTranscript: boolean;
};

export type PhoneSmsControlledLiveEnablementManualInput = {
  id: string;
  source: 'manual_go_no_go_gate';
  ql034DecisionApprovedForPlanning: boolean;
  ql035PlanReadyForManualImplementationDesign: boolean;
  ql036ScaffoldReadyForDisabledVerification: boolean;
  ql037DisabledVerificationGreen: boolean;
  decision: PhoneSmsControlledLiveEnablementManualDecision;
  pilotPlanningOnly: true;
  tinyMonitoredPilotImplementationRequiredBeforeTraffic: true;
  controls: PhoneSmsControlledLiveEnablementManualControlAcknowledgement[];
  evidence: PhoneSmsControlledLiveEnablementManualEvidence[];
  ownerApprovalRecorded: boolean;
  operatorTrainingAcknowledged: boolean;
  rollbackAcknowledged: boolean;
  noPersistenceConfirmed: boolean;
  noLiveCustomerAccessConfirmed: boolean;
  noProviderCallbackConfirmed: boolean;
  noPhoneWebhookConfirmed: boolean;
  noSmsSendConfirmed: boolean;
  noCallRecordingConfirmed: boolean;
  noAiDraftConfirmed: boolean;
  noAutoSendConfirmed: boolean;
  existingNumbersProtectedConfirmed: boolean;
  notes: string[];
};

export type PhoneSmsControlledLiveEnablementManualOutcome = {
  id: string;
  build: 'QL-038';
  status: PhoneSmsControlledLiveEnablementManualGoNoGoStatus;
  decision: PhoneSmsControlledLiveEnablementManualDecision;
  approvedForTinyMonitoredPilotPlanning: boolean;
  liveEnablementAllowed: false;
  providerCallbackAllowed: false;
  phoneWebhookAllowed: false;
  smsSendAllowed: false;
  callRecordingAllowed: false;
  aiDraftAllowed: false;
  autoSendAllowed: false;
  persistenceWrites: false;
  liveCustomerRead: false;
  liveCustomerWrite: false;
  safeToPersist: false;
  pilotPlanningOnly: true;
  tinyMonitoredPilotImplementationRequiredBeforeTraffic: true;
  summary: string;
  blockers: string[];
  acknowledgedControls: PhoneSmsControlledLiveEnablementManualControl[];
  missingControls: PhoneSmsControlledLiveEnablementManualControl[];
  evidenceLabels: PhoneSmsControlledLiveEnablementManualEvidenceLabel[];
  requiredNextBuild: 'QL-039-controlled-live-enablement-tiny-monitored-pilot-plan';
};

export type PhoneSmsControlledLiveEnablementManualReport = {
  build: 'QL-038';
  status: PhoneSmsControlledLiveEnablementManualGoNoGoStatus;
  generatedAt: string;
  syntheticOnly: true;
  redactedOnly: true;
  safeToPersist: false;
  liveEnablementAllowed: false;
  outcomes: PhoneSmsControlledLiveEnablementManualOutcome[];
  requiredNextBuild: 'QL-039-controlled-live-enablement-tiny-monitored-pilot-plan';
  verificationCases: Array<{
    id: string;
    expectedStatus: PhoneSmsControlledLiveEnablementManualGoNoGoStatus;
    expectedLiveEnablementAllowed: false;
    passed: boolean;
  }>;
};

const requiredControls: PhoneSmsControlledLiveEnablementManualControl[] = [
  'owner_approval',
  'operator_training_acknowledgement',
  'provider_boundary_acknowledgement',
  'webhook_boundary_acknowledgement',
  'sms_send_boundary_acknowledgement',
  'call_recording_boundary_acknowledgement',
  'ai_boundary_acknowledgement',
  'persistence_boundary_acknowledgement',
  'live_customer_data_boundary_acknowledgement',
  'redaction_boundary_acknowledgement',
  'rollback_boundary_acknowledgement',
  'rate_limit_boundary_acknowledgement',
  'replay_protection_boundary_acknowledgement',
  'pilot_scope_boundary_acknowledgement',
  'post_pilot_review_required',
];

const requiredEvidenceLabels: PhoneSmsControlledLiveEnablementManualEvidenceLabel[] = [
  'ql034_decision_gate',
  'ql035_controlled_plan',
  'ql036_disabled_scaffold',
  'ql037_disabled_verification',
  'manual_go_no_go_notes',
];

export const safeControlledLiveEnablementManualGoNoGoEnvironment: PhoneSmsControlledLiveEnablementManualEnvironment = {
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'approved_for_controlled_live_enablement_planning',
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS: 'plan_ready_for_manual_implementation_design',
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS: 'scaffold_ready_for_disabled_verification',
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_STATUS: 'disabled_verification_green',
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_STATUS: 'blocked_pending_manual_go_no_go_gate',
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SYNTHETIC_ONLY: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_REDACTED_ONLY: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_NO_PERSISTENCE_WRITES: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_LIVE_CUSTOMER_ACCESS_DISABLED: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PROVIDER_CALLBACK_DISABLED: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PHONE_WEBHOOK_DISABLED: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SMS_SEND_DISABLED: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_CALL_RECORDING_DISABLED: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AI_DRAFTS_DISABLED: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AUTO_SEND_DISABLED: true,
  PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PILOT_IMPLEMENTATION_REQUIRED: true,
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: false,
  TELEPHONY_PROVIDER: 'undecided',
  ENABLE_PHONE_WEBHOOKS: false,
  ENABLE_SMS: false,
  ENABLE_CALL_RECORDING: false,
  ENABLE_AI_DRAFTS: false,
  ENABLE_AI_AUTO_SEND: false,
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: true,
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: true,
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: true,
  PHONE_SMS_EXISTING_NUMBERS_PROTECTED: true,
};

const defaultControl = (
  control: PhoneSmsControlledLiveEnablementManualControl,
  label: string,
): PhoneSmsControlledLiveEnablementManualControlAcknowledgement => ({
  id: `ql038-${control}`,
  control,
  label,
  acknowledged: true,
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
  liveEnablementAllowed: false,
  containsActualPhoneNumber: false,
  containsProviderCredential: false,
  containsWebhookSecretValue: false,
  containsCustomerData: false,
  containsLivePayload: false,
  containsRecording: false,
  containsTranscript: false,
});

export const safeManualControlAcknowledgements: PhoneSmsControlledLiveEnablementManualControlAcknowledgement[] = [
  defaultControl('owner_approval', 'Owner approval is required before any pilot planning can proceed.'),
  defaultControl('operator_training_acknowledgement', 'Operator training must be acknowledged before pilot planning.'),
  defaultControl('provider_boundary_acknowledgement', 'Provider account and credential boundaries remain locked.'),
  defaultControl('webhook_boundary_acknowledgement', 'Provider callback and phone webhook boundaries remain disabled.'),
  defaultControl('sms_send_boundary_acknowledgement', 'SMS send remains disabled by default.'),
  defaultControl('call_recording_boundary_acknowledgement', 'Call recording remains disabled by default.'),
  defaultControl('ai_boundary_acknowledgement', 'AI drafts and auto-send remain disabled by default.'),
  defaultControl('persistence_boundary_acknowledgement', 'Persistence writes remain disabled.'),
  defaultControl('live_customer_data_boundary_acknowledgement', 'Live customer reads and writes remain disabled.'),
  defaultControl('redaction_boundary_acknowledgement', 'Evidence remains synthetic, redacted, and safeToPersist false.'),
  defaultControl('rollback_boundary_acknowledgement', 'Rollback must remain available before any later pilot.'),
  defaultControl('rate_limit_boundary_acknowledgement', 'Rate limiting must be planned before any later pilot.'),
  defaultControl('replay_protection_boundary_acknowledgement', 'Replay protection must be planned before any later pilot.'),
  defaultControl('pilot_scope_boundary_acknowledgement', 'Pilot scope must stay tiny and monitored in a later build.'),
  defaultControl('post_pilot_review_required', 'A post-pilot review gate is required before expansion.'),
];

const defaultEvidence = (
  label: PhoneSmsControlledLiveEnablementManualEvidenceLabel,
  summary: string,
  disabledVerificationGreen = true,
): PhoneSmsControlledLiveEnablementManualEvidence => ({
  id: `ql038-${label}`,
  label,
  summary,
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
  disabledVerificationGreen,
  liveEnablementAllowed: false,
  providerCallbackAllowed: false,
  phoneWebhookAllowed: false,
  smsSendAllowed: false,
  callRecordingAllowed: false,
  aiDraftAllowed: false,
  autoSendAllowed: false,
  persistenceWrites: false,
  liveCustomerRead: false,
  liveCustomerWrite: false,
  containsActualPhoneNumber: false,
  containsProviderCredential: false,
  containsWebhookSecretValue: false,
  containsCustomerData: false,
  containsLivePayload: false,
  containsRecording: false,
  containsTranscript: false,
});

export const safeManualGoNoGoEvidence: PhoneSmsControlledLiveEnablementManualEvidence[] = [
  defaultEvidence('ql034_decision_gate', 'Explicit decision gate approved controlled planning only.'),
  defaultEvidence('ql035_controlled_plan', 'Controlled live enablement plan is complete and still disabled.'),
  defaultEvidence('ql036_disabled_scaffold', 'Implementation scaffold surfaces exist only as disabled stubs.'),
  defaultEvidence('ql037_disabled_verification', 'Disabled verification is green for every scaffold surface.'),
  defaultEvidence('manual_go_no_go_notes', 'Manual go/no-go notes are synthetic and contain no live artifacts.'),
];

export const safeManualGoNoGoInput: PhoneSmsControlledLiveEnablementManualInput = {
  id: 'ql038-safe-manual-go-no-go',
  source: 'manual_go_no_go_gate',
  ql034DecisionApprovedForPlanning: true,
  ql035PlanReadyForManualImplementationDesign: true,
  ql036ScaffoldReadyForDisabledVerification: true,
  ql037DisabledVerificationGreen: true,
  decision: 'approve_tiny_monitored_pilot_planning',
  pilotPlanningOnly: true,
  tinyMonitoredPilotImplementationRequiredBeforeTraffic: true,
  controls: safeManualControlAcknowledgements,
  evidence: safeManualGoNoGoEvidence,
  ownerApprovalRecorded: true,
  operatorTrainingAcknowledged: true,
  rollbackAcknowledged: true,
  noPersistenceConfirmed: true,
  noLiveCustomerAccessConfirmed: true,
  noProviderCallbackConfirmed: true,
  noPhoneWebhookConfirmed: true,
  noSmsSendConfirmed: true,
  noCallRecordingConfirmed: true,
  noAiDraftConfirmed: true,
  noAutoSendConfirmed: true,
  existingNumbersProtectedConfirmed: true,
  notes: [
    'QL-038 approval permits only QL-039 tiny monitored pilot planning.',
    'QL-038 does not permit live provider traffic or customer communication.',
  ],
};

const environmentIsSafe = (environment: PhoneSmsControlledLiveEnablementManualEnvironment): boolean => (
  environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS === 'approved_for_controlled_live_enablement_planning'
  && environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS === 'plan_ready_for_manual_implementation_design'
  && environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS === 'scaffold_ready_for_disabled_verification'
  && environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_STATUS === 'disabled_verification_green'
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SYNTHETIC_ONLY
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_REDACTED_ONLY
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_NO_PERSISTENCE_WRITES
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_LIVE_CUSTOMER_ACCESS_DISABLED
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PROVIDER_CALLBACK_DISABLED
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PHONE_WEBHOOK_DISABLED
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_SMS_SEND_DISABLED
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_CALL_RECORDING_DISABLED
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AI_DRAFTS_DISABLED
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_AUTO_SEND_DISABLED
  && environment.PHONE_SMS_CONTROLLED_MANUAL_GO_NO_GO_PILOT_IMPLEMENTATION_REQUIRED
  && !environment.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED
  && !environment.ENABLE_PHONE_WEBHOOKS
  && !environment.ENABLE_SMS
  && !environment.ENABLE_CALL_RECORDING
  && !environment.ENABLE_AI_DRAFTS
  && !environment.ENABLE_AI_AUTO_SEND
  && environment.PHONE_SMS_PERSISTENCE_WRITES_DISABLED
  && environment.PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED
  && environment.PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED
  && environment.PHONE_SMS_EXISTING_NUMBERS_PROTECTED
);

const controlIsSafe = (control: PhoneSmsControlledLiveEnablementManualControlAcknowledgement): boolean => (
  control.acknowledged
  && control.syntheticOnly
  && control.redactedOnly
  && !control.safeToPersist
  && !control.liveEnablementAllowed
  && !control.containsActualPhoneNumber
  && !control.containsProviderCredential
  && !control.containsWebhookSecretValue
  && !control.containsCustomerData
  && !control.containsLivePayload
  && !control.containsRecording
  && !control.containsTranscript
);

const evidenceIsSafe = (evidence: PhoneSmsControlledLiveEnablementManualEvidence): boolean => (
  evidence.syntheticOnly
  && evidence.redactedOnly
  && !evidence.safeToPersist
  && evidence.disabledVerificationGreen
  && !evidence.liveEnablementAllowed
  && !evidence.providerCallbackAllowed
  && !evidence.phoneWebhookAllowed
  && !evidence.smsSendAllowed
  && !evidence.callRecordingAllowed
  && !evidence.aiDraftAllowed
  && !evidence.autoSendAllowed
  && !evidence.persistenceWrites
  && !evidence.liveCustomerRead
  && !evidence.liveCustomerWrite
  && !evidence.containsActualPhoneNumber
  && !evidence.containsProviderCredential
  && !evidence.containsWebhookSecretValue
  && !evidence.containsCustomerData
  && !evidence.containsLivePayload
  && !evidence.containsRecording
  && !evidence.containsTranscript
);

const findMissingControls = (controls: PhoneSmsControlledLiveEnablementManualControlAcknowledgement[]): PhoneSmsControlledLiveEnablementManualControl[] => {
  const acknowledged = new Set(
    controls
      .filter((control) => control.acknowledged)
      .map((control) => control.control),
  );

  return requiredControls.filter((control) => !acknowledged.has(control));
};

const findMissingEvidence = (evidence: PhoneSmsControlledLiveEnablementManualEvidence[]): PhoneSmsControlledLiveEnablementManualEvidenceLabel[] => {
  const labels = new Set(evidence.map((item) => item.label));
  return requiredEvidenceLabels.filter((label) => !labels.has(label));
};

const createOutcome = (
  input: PhoneSmsControlledLiveEnablementManualInput,
  environment: PhoneSmsControlledLiveEnablementManualEnvironment,
): PhoneSmsControlledLiveEnablementManualOutcome => {
  const blockers: string[] = [];
  const missingControls = findMissingControls(input.controls);
  const missingEvidence = findMissingEvidence(input.evidence);
  const unsafeControls = input.controls.filter((control) => !controlIsSafe(control));
  const unsafeEvidence = input.evidence.filter((evidence) => !evidenceIsSafe(evidence));

  if (!environmentIsSafe(environment)) blockers.push('environment_must_keep_manual_go_no_go_and_all_live_surfaces_disabled');
  if (!input.ql034DecisionApprovedForPlanning) blockers.push('ql034_decision_gate_approval_required');
  if (!input.ql035PlanReadyForManualImplementationDesign) blockers.push('ql035_controlled_plan_ready_required');
  if (!input.ql036ScaffoldReadyForDisabledVerification) blockers.push('ql036_scaffold_ready_required');
  if (!input.ql037DisabledVerificationGreen) blockers.push('ql037_disabled_verification_green_required');
  if (input.decision !== 'approve_tiny_monitored_pilot_planning') blockers.push('manual_decision_did_not_approve_pilot_planning');
  if (!input.ownerApprovalRecorded) blockers.push('owner_approval_required');
  if (!input.operatorTrainingAcknowledged) blockers.push('operator_training_acknowledgement_required');
  if (!input.rollbackAcknowledged) blockers.push('rollback_acknowledgement_required');
  if (!input.noPersistenceConfirmed) blockers.push('no_persistence_confirmation_required');
  if (!input.noLiveCustomerAccessConfirmed) blockers.push('no_live_customer_access_confirmation_required');
  if (!input.noProviderCallbackConfirmed) blockers.push('provider_callback_disabled_confirmation_required');
  if (!input.noPhoneWebhookConfirmed) blockers.push('phone_webhook_disabled_confirmation_required');
  if (!input.noSmsSendConfirmed) blockers.push('sms_send_disabled_confirmation_required');
  if (!input.noCallRecordingConfirmed) blockers.push('call_recording_disabled_confirmation_required');
  if (!input.noAiDraftConfirmed) blockers.push('ai_draft_disabled_confirmation_required');
  if (!input.noAutoSendConfirmed) blockers.push('auto_send_disabled_confirmation_required');
  if (!input.existingNumbersProtectedConfirmed) blockers.push('existing_numbers_protected_confirmation_required');
  if (missingControls.length > 0) blockers.push(`missing_controls:${missingControls.join(',')}`);
  if (missingEvidence.length > 0) blockers.push(`missing_evidence:${missingEvidence.join(',')}`);
  if (unsafeControls.length > 0) blockers.push(`unsafe_controls:${unsafeControls.map((control) => control.id).join(',')}`);
  if (unsafeEvidence.length > 0) blockers.push(`unsafe_evidence:${unsafeEvidence.map((evidence) => evidence.id).join(',')}`);

  let status: PhoneSmsControlledLiveEnablementManualGoNoGoStatus = 'approved_for_tiny_monitored_pilot_planning';
  if (blockers.includes('ql037_disabled_verification_green_required')) {
    status = 'blocked_missing_disabled_verification';
  } else if (blockers.some((blocker) => blocker.includes('environment') || blocker.includes('disabled_confirmation'))) {
    status = 'blocked_unsafe_environment';
  } else if (blockers.some((blocker) => blocker.startsWith('unsafe_'))) {
    status = 'blocked_unredacted_or_live_evidence';
  } else if (blockers.some((blocker) => blocker.startsWith('missing_controls') || blocker.startsWith('missing_evidence'))) {
    status = 'blocked_missing_control';
  } else if (blockers.some((blocker) => blocker.includes('approval') || blocker.includes('acknowledgement'))) {
    status = 'blocked_missing_manual_approval';
  } else if (input.decision === 'continue_rework') {
    status = 'blocked_continue_rework';
  } else if (input.decision === 'remain_blocked' || blockers.length > 0) {
    status = 'blocked_pending_manual_go_no_go_gate';
  }

  const approved = status === 'approved_for_tiny_monitored_pilot_planning';
  const acknowledgedControls = input.controls
    .filter((control) => control.acknowledged)
    .map((control) => control.control);

  return {
    id: input.id,
    build: 'QL-038',
    status,
    decision: input.decision,
    approvedForTinyMonitoredPilotPlanning: approved,
    liveEnablementAllowed: false,
    providerCallbackAllowed: false,
    phoneWebhookAllowed: false,
    smsSendAllowed: false,
    callRecordingAllowed: false,
    aiDraftAllowed: false,
    autoSendAllowed: false,
    persistenceWrites: false,
    liveCustomerRead: false,
    liveCustomerWrite: false,
    safeToPersist: false,
    pilotPlanningOnly: true,
    tinyMonitoredPilotImplementationRequiredBeforeTraffic: true,
    summary: approved
      ? 'Manual go/no-go gate allows only QL-039 tiny monitored pilot planning; live traffic remains disabled.'
      : 'Manual go/no-go gate remains blocked; live traffic remains disabled.',
    blockers,
    acknowledgedControls,
    missingControls,
    evidenceLabels: input.evidence.map((evidence) => evidence.label),
    requiredNextBuild: 'QL-039-controlled-live-enablement-tiny-monitored-pilot-plan',
  };
};

const unsafeLiveEnvironment: PhoneSmsControlledLiveEnablementManualEnvironment = {
  ...safeControlledLiveEnablementManualGoNoGoEnvironment,
  ENABLE_SMS: true,
};

const missingVerificationInput: PhoneSmsControlledLiveEnablementManualInput = {
  ...safeManualGoNoGoInput,
  id: 'ql038-missing-disabled-verification',
  ql037DisabledVerificationGreen: false,
};

const continueReworkInput: PhoneSmsControlledLiveEnablementManualInput = {
  ...safeManualGoNoGoInput,
  id: 'ql038-continue-rework',
  decision: 'continue_rework',
};

const unsafeEvidenceInput: PhoneSmsControlledLiveEnablementManualInput = {
  ...safeManualGoNoGoInput,
  id: 'ql038-unsafe-evidence',
  evidence: [
    {
      ...safeManualGoNoGoEvidence[0],
      id: 'ql038-unsafe-live-payload-evidence',
      containsLivePayload: true,
    },
  ],
};

const missingControlInput: PhoneSmsControlledLiveEnablementManualInput = {
  ...safeManualGoNoGoInput,
  id: 'ql038-missing-control',
  controls: safeManualControlAcknowledgements.filter((control) => control.control !== 'rollback_boundary_acknowledgement'),
};

export const runPhoneSmsControlledLiveEnablementManualGoNoGoGate = (
  generatedAt = '2026-10-06T00:00:00.000Z',
): PhoneSmsControlledLiveEnablementManualReport => {
  const outcomes = [
    createOutcome(safeManualGoNoGoInput, safeControlledLiveEnablementManualGoNoGoEnvironment),
    createOutcome(missingVerificationInput, safeControlledLiveEnablementManualGoNoGoEnvironment),
    createOutcome(continueReworkInput, safeControlledLiveEnablementManualGoNoGoEnvironment),
    createOutcome(safeManualGoNoGoInput, unsafeLiveEnvironment),
    createOutcome(unsafeEvidenceInput, safeControlledLiveEnablementManualGoNoGoEnvironment),
    createOutcome(missingControlInput, safeControlledLiveEnablementManualGoNoGoEnvironment),
  ];

  return {
    build: 'QL-038',
    status: outcomes[0].status,
    generatedAt,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    liveEnablementAllowed: false,
    outcomes,
    requiredNextBuild: 'QL-039-controlled-live-enablement-tiny-monitored-pilot-plan',
    verificationCases: [
      {
        id: 'approve_planning_only',
        expectedStatus: 'approved_for_tiny_monitored_pilot_planning',
        expectedLiveEnablementAllowed: false,
        passed: outcomes[0].status === 'approved_for_tiny_monitored_pilot_planning' && !outcomes[0].liveEnablementAllowed,
      },
      {
        id: 'missing_disabled_verification_blocks_gate',
        expectedStatus: 'blocked_missing_disabled_verification',
        expectedLiveEnablementAllowed: false,
        passed: outcomes[1].status === 'blocked_missing_disabled_verification' && !outcomes[1].liveEnablementAllowed,
      },
      {
        id: 'continue_rework_blocks_gate',
        expectedStatus: 'blocked_continue_rework',
        expectedLiveEnablementAllowed: false,
        passed: outcomes[2].status === 'blocked_continue_rework' && !outcomes[2].liveEnablementAllowed,
      },
      {
        id: 'unsafe_environment_blocks_gate',
        expectedStatus: 'blocked_unsafe_environment',
        expectedLiveEnablementAllowed: false,
        passed: outcomes[3].status === 'blocked_unsafe_environment' && !outcomes[3].liveEnablementAllowed,
      },
      {
        id: 'unsafe_evidence_blocks_gate',
        expectedStatus: 'blocked_unredacted_or_live_evidence',
        expectedLiveEnablementAllowed: false,
        passed: outcomes[4].status === 'blocked_unredacted_or_live_evidence' && !outcomes[4].liveEnablementAllowed,
      },
      {
        id: 'missing_control_blocks_gate',
        expectedStatus: 'blocked_missing_control',
        expectedLiveEnablementAllowed: false,
        passed: outcomes[5].status === 'blocked_missing_control' && !outcomes[5].liveEnablementAllowed,
      },
    ],
  };
};
