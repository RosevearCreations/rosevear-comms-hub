export type PhoneSmsControlledLiveEnablementDisabledVerificationStatus =
  | 'blocked_pending_disabled_verification'
  | 'disabled_verification_green'
  | 'blocked_missing_prior_approval'
  | 'blocked_missing_scaffold_surface'
  | 'blocked_unsafe_environment'
  | 'blocked_enabled_live_behavior'
  | 'blocked_unredacted_or_live_evidence';

export type PhoneSmsControlledLiveEnablementVerificationSurface =
  | 'provider_callback_route'
  | 'phone_webhook_route'
  | 'sms_send_adapter'
  | 'call_recording_adapter'
  | 'ai_draft_adapter'
  | 'ai_auto_send_guard'
  | 'persistence_adapter'
  | 'live_customer_access_guard'
  | 'operator_console_gate'
  | 'audit_log_stub'
  | 'rollback_switch';

export type PhoneSmsControlledLiveEnablementDisabledResponse =
  | 'disabled_503'
  | 'manual_gate_required'
  | 'no_op_disabled';

export type PhoneSmsControlledLiveEnablementDisabledVerificationEnvironment = {
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'approved_for_controlled_live_enablement_planning' | 'blocked_pending_explicit_live_enablement_decision_gate';
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS: 'plan_ready_for_manual_implementation_design' | 'blocked_pending_controlled_live_enablement_plan';
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS: 'scaffold_ready_for_disabled_verification' | 'blocked_pending_disabled_implementation_scaffold';
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_STATUS: 'blocked_pending_disabled_verification' | 'disabled_verification_green';
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SYNTHETIC_ONLY: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_REDACTED_ONLY: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_NO_PERSISTENCE_WRITES: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_LIVE_CUSTOMER_ACCESS_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PROVIDER_CALLBACK_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PHONE_WEBHOOK_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SMS_SEND_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_CALL_RECORDING_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AI_DRAFTS_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AUTO_SEND_DISABLED: boolean;
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

export type PhoneSmsControlledLiveEnablementDisabledVerificationProbe = {
  id: string;
  surface: PhoneSmsControlledLiveEnablementVerificationSurface;
  expectedDisabledResponse: PhoneSmsControlledLiveEnablementDisabledResponse;
  observedResponse: PhoneSmsControlledLiveEnablementDisabledResponse;
  disabledStateConfirmed: boolean;
  syntheticOnly: true;
  redactedOnly: true;
  safeToPersist: false;
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
  evidenceLabel: string;
};

export type PhoneSmsControlledLiveEnablementDisabledVerificationInput = {
  id: string;
  source: 'controlled_live_enablement_disabled_verification';
  ql034DecisionApprovedForPlanning: boolean;
  ql035PlanReadyForManualImplementationDesign: boolean;
  ql036ScaffoldReadyForDisabledVerification: boolean;
  disabledVerificationOnly: true;
  verificationProbes: PhoneSmsControlledLiveEnablementDisabledVerificationProbe[];
  manualGoNoGoRequiredBeforeLivePilot: true;
  livePilotRemainsBlocked: true;
  syntheticEvidenceOnlyConfirmed: boolean;
  redactedEvidenceOnlyConfirmed: boolean;
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

export type PhoneSmsControlledLiveEnablementDisabledVerificationOutcome = {
  id: string;
  build: 'QL-037';
  status: PhoneSmsControlledLiveEnablementDisabledVerificationStatus;
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
  safeToPersist: false;
  disabledVerificationOnly: true;
  manualGoNoGoRequiredBeforeLivePilot: true;
  livePilotRemainsBlocked: true;
  summary: string;
  blockers: string[];
  probeCount: number;
  verifiedSurfaces: PhoneSmsControlledLiveEnablementVerificationSurface[];
  requiredNextBuild: 'QL-038-controlled-live-enablement-manual-go-no-go-gate';
};

export type PhoneSmsControlledLiveEnablementDisabledVerificationReport = {
  build: 'QL-037';
  status: PhoneSmsControlledLiveEnablementDisabledVerificationStatus;
  generatedAt: string;
  syntheticOnly: true;
  redactedOnly: true;
  safeToPersist: false;
  liveEnablementAllowed: false;
  outcomes: PhoneSmsControlledLiveEnablementDisabledVerificationOutcome[];
  requiredNextBuild: 'QL-038-controlled-live-enablement-manual-go-no-go-gate';
  verificationCases: Array<{
    id: string;
    expectedStatus: PhoneSmsControlledLiveEnablementDisabledVerificationStatus;
    expectedLiveEnablementAllowed: false;
    passed: boolean;
  }>;
};

const requiredSurfaces: PhoneSmsControlledLiveEnablementVerificationSurface[] = [
  'provider_callback_route',
  'phone_webhook_route',
  'sms_send_adapter',
  'call_recording_adapter',
  'ai_draft_adapter',
  'ai_auto_send_guard',
  'persistence_adapter',
  'live_customer_access_guard',
  'operator_console_gate',
  'audit_log_stub',
  'rollback_switch',
];

export const safeControlledLiveEnablementDisabledVerificationEnvironment: PhoneSmsControlledLiveEnablementDisabledVerificationEnvironment = {
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'approved_for_controlled_live_enablement_planning',
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS: 'plan_ready_for_manual_implementation_design',
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS: 'scaffold_ready_for_disabled_verification',
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_STATUS: 'blocked_pending_disabled_verification',
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SYNTHETIC_ONLY: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_REDACTED_ONLY: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_NO_PERSISTENCE_WRITES: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_LIVE_CUSTOMER_ACCESS_DISABLED: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PROVIDER_CALLBACK_DISABLED: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PHONE_WEBHOOK_DISABLED: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SMS_SEND_DISABLED: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_CALL_RECORDING_DISABLED: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AI_DRAFTS_DISABLED: true,
  PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AUTO_SEND_DISABLED: true,
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

const expectedResponseForSurface = (
  surface: PhoneSmsControlledLiveEnablementVerificationSurface,
): PhoneSmsControlledLiveEnablementDisabledResponse => {
  if (surface === 'operator_console_gate') return 'manual_gate_required';
  if (surface === 'audit_log_stub' || surface === 'rollback_switch') return 'no_op_disabled';
  return 'disabled_503';
};

const disabledProbe = (
  surface: PhoneSmsControlledLiveEnablementVerificationSurface,
  evidenceLabel: string,
): PhoneSmsControlledLiveEnablementDisabledVerificationProbe => ({
  id: `ql037-${surface}`,
  surface,
  expectedDisabledResponse: expectedResponseForSurface(surface),
  observedResponse: expectedResponseForSurface(surface),
  disabledStateConfirmed: true,
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
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
  evidenceLabel,
});

export const safeControlledLiveEnablementDisabledVerificationInput: PhoneSmsControlledLiveEnablementDisabledVerificationInput = {
  id: 'ql037-disabled-verification-safe-input',
  source: 'controlled_live_enablement_disabled_verification',
  ql034DecisionApprovedForPlanning: true,
  ql035PlanReadyForManualImplementationDesign: true,
  ql036ScaffoldReadyForDisabledVerification: true,
  disabledVerificationOnly: true,
  verificationProbes: requiredSurfaces.map((surface) => disabledProbe(surface, `redacted-synthetic-${surface}`)),
  manualGoNoGoRequiredBeforeLivePilot: true,
  livePilotRemainsBlocked: true,
  syntheticEvidenceOnlyConfirmed: true,
  redactedEvidenceOnlyConfirmed: true,
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
    'All scaffold surfaces return disabled or no-op responses.',
    'Manual go/no-go remains required before any later monitored pilot planning.',
  ],
};

const forbiddenEvidenceTerms = [
  'api key',
  'bearer ',
  'password',
  'secret value',
  'sip credential',
  'customer phone',
  'customer email',
  'recording url',
  'transcript url',
  'live provider payload',
  'production customer',
];

const hasForbiddenText = (values: string[]): boolean =>
  values.some((value) => {
    const normalized = value.toLowerCase();
    return forbiddenEvidenceTerms.some((term) => normalized.includes(term));
  });

const environmentBlockers = (environment: PhoneSmsControlledLiveEnablementDisabledVerificationEnvironment): string[] => {
  const blockers: string[] = [];

  if (environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS !== 'approved_for_controlled_live_enablement_planning') {
    blockers.push('QL-034 approval for controlled planning is missing.');
  }

  if (environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS !== 'plan_ready_for_manual_implementation_design') {
    blockers.push('QL-035 controlled plan is not ready for disabled implementation verification.');
  }

  if (environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_STATUS !== 'scaffold_ready_for_disabled_verification') {
    blockers.push('QL-036 implementation scaffold is not marked ready for disabled verification.');
  }

  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SYNTHETIC_ONLY) blockers.push('Disabled verification is not synthetic-only.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_REDACTED_ONLY) blockers.push('Disabled verification is not redacted-only.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_NO_PERSISTENCE_WRITES) blockers.push('Disabled verification persistence writes are not locked off.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_LIVE_CUSTOMER_ACCESS_DISABLED) blockers.push('Disabled verification live customer access is not locked off.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PROVIDER_CALLBACK_DISABLED) blockers.push('Provider callbacks are not disabled for verification.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_PHONE_WEBHOOK_DISABLED) blockers.push('Phone webhooks are not disabled for verification.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SMS_SEND_DISABLED) blockers.push('SMS sending is not disabled for verification.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_CALL_RECORDING_DISABLED) blockers.push('Call recording is not disabled for verification.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AI_DRAFTS_DISABLED) blockers.push('AI drafts are not disabled for verification.');
  if (!environment.PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_AUTO_SEND_DISABLED) blockers.push('AI auto-send is not disabled for verification.');
  if (environment.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED) blockers.push('Provider webhook is configured before verification.');
  if (environment.ENABLE_PHONE_WEBHOOKS) blockers.push('Live phone webhooks are enabled.');
  if (environment.ENABLE_SMS) blockers.push('SMS sending is enabled.');
  if (environment.ENABLE_CALL_RECORDING) blockers.push('Call recording is enabled.');
  if (environment.ENABLE_AI_DRAFTS) blockers.push('AI drafts are enabled.');
  if (environment.ENABLE_AI_AUTO_SEND) blockers.push('AI auto-send is enabled.');
  if (!environment.PHONE_SMS_PERSISTENCE_WRITES_DISABLED) blockers.push('Persistence writes are not disabled.');
  if (!environment.PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED) blockers.push('Live customer reads are not disabled.');
  if (!environment.PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED) blockers.push('Live customer writes are not disabled.');
  if (!environment.PHONE_SMS_EXISTING_NUMBERS_PROTECTED) blockers.push('Existing numbers are not confirmed protected.');

  return blockers;
};

const probeBlockers = (input: PhoneSmsControlledLiveEnablementDisabledVerificationInput): string[] => {
  const blockers: string[] = [];
  const surfaces = new Set(input.verificationProbes.map((probe) => probe.surface));

  requiredSurfaces.forEach((surface) => {
    if (!surfaces.has(surface)) blockers.push(`Missing disabled verification probe for ${surface}.`);
  });

  input.verificationProbes.forEach((probe) => {
    if (probe.observedResponse !== probe.expectedDisabledResponse) {
      blockers.push(`${probe.surface} did not return the expected disabled response.`);
    }

    if (!probe.disabledStateConfirmed) blockers.push(`${probe.surface} disabled state was not confirmed.`);
    if (!probe.syntheticOnly) blockers.push(`${probe.surface} evidence is not synthetic-only.`);
    if (!probe.redactedOnly) blockers.push(`${probe.surface} evidence is not redacted-only.`);
    if (probe.safeToPersist) blockers.push(`${probe.surface} evidence was incorrectly marked safe to persist.`);
    if (probe.liveEnablementAllowed) blockers.push(`${probe.surface} allows live enablement.`);
    if (probe.providerCallbackAllowed) blockers.push(`${probe.surface} allows provider callback behavior.`);
    if (probe.phoneWebhookAllowed) blockers.push(`${probe.surface} allows phone webhook behavior.`);
    if (probe.smsSendAllowed) blockers.push(`${probe.surface} allows SMS sending.`);
    if (probe.callRecordingAllowed) blockers.push(`${probe.surface} allows call recording.`);
    if (probe.aiDraftAllowed) blockers.push(`${probe.surface} allows AI draft behavior.`);
    if (probe.autoSendAllowed) blockers.push(`${probe.surface} allows auto-send behavior.`);
    if (probe.persistenceWrites) blockers.push(`${probe.surface} allows persistence writes.`);
    if (probe.liveCustomerRead) blockers.push(`${probe.surface} allows live customer reads.`);
    if (probe.liveCustomerWrite) blockers.push(`${probe.surface} allows live customer writes.`);
    if (probe.containsActualPhoneNumber) blockers.push(`${probe.surface} evidence contains an actual phone number.`);
    if (probe.containsProviderCredential) blockers.push(`${probe.surface} evidence contains a provider credential.`);
    if (probe.containsWebhookSecretValue) blockers.push(`${probe.surface} evidence contains a webhook secret value.`);
    if (probe.containsCustomerData) blockers.push(`${probe.surface} evidence contains customer data.`);
    if (probe.containsLivePayload) blockers.push(`${probe.surface} evidence contains a live payload.`);
    if (probe.containsRecording) blockers.push(`${probe.surface} evidence contains a recording.`);
    if (probe.containsTranscript) blockers.push(`${probe.surface} evidence contains a transcript.`);
  });

  if (hasForbiddenText([...input.notes, ...input.verificationProbes.map((probe) => probe.evidenceLabel)])) {
    blockers.push('Disabled verification notes or labels contain forbidden live or secret terms.');
  }

  return blockers;
};

const inputBlockers = (input: PhoneSmsControlledLiveEnablementDisabledVerificationInput): string[] => {
  const blockers: string[] = [];

  if (!input.ql034DecisionApprovedForPlanning) blockers.push('QL-034 decision approval for planning is missing.');
  if (!input.ql035PlanReadyForManualImplementationDesign) blockers.push('QL-035 plan readiness is missing.');
  if (!input.ql036ScaffoldReadyForDisabledVerification) blockers.push('QL-036 scaffold readiness is missing.');
  if (!input.syntheticEvidenceOnlyConfirmed) blockers.push('Synthetic-only evidence confirmation is missing.');
  if (!input.redactedEvidenceOnlyConfirmed) blockers.push('Redacted-only evidence confirmation is missing.');
  if (!input.noPersistenceConfirmed) blockers.push('No-persistence confirmation is missing.');
  if (!input.noLiveCustomerAccessConfirmed) blockers.push('No live customer access confirmation is missing.');
  if (!input.noProviderCallbackConfirmed) blockers.push('No provider callback confirmation is missing.');
  if (!input.noPhoneWebhookConfirmed) blockers.push('No phone webhook confirmation is missing.');
  if (!input.noSmsSendConfirmed) blockers.push('No SMS send confirmation is missing.');
  if (!input.noCallRecordingConfirmed) blockers.push('No call recording confirmation is missing.');
  if (!input.noAiDraftConfirmed) blockers.push('No AI draft confirmation is missing.');
  if (!input.noAutoSendConfirmed) blockers.push('No auto-send confirmation is missing.');
  if (!input.existingNumbersProtectedConfirmed) blockers.push('Existing numbers protected confirmation is missing.');

  return blockers;
};

const statusFromBlockers = (blockers: string[]): PhoneSmsControlledLiveEnablementDisabledVerificationStatus => {
  if (blockers.length === 0) return 'disabled_verification_green';
  if (blockers.some((blocker) => blocker.includes('QL-034') || blocker.includes('QL-035') || blocker.includes('QL-036'))) {
    return 'blocked_missing_prior_approval';
  }
  if (blockers.some((blocker) => blocker.includes('Missing disabled verification probe'))) return 'blocked_missing_scaffold_surface';
  if (blockers.some((blocker) => blocker.includes('forbidden live') || blocker.includes('contains'))) return 'blocked_unredacted_or_live_evidence';
  if (blockers.some((blocker) => blocker.includes('enabled') || blocker.includes('allows'))) return 'blocked_enabled_live_behavior';
  return 'blocked_unsafe_environment';
};

export const evaluatePhoneSmsControlledLiveEnablementDisabledVerification = (
  input: PhoneSmsControlledLiveEnablementDisabledVerificationInput,
  environment: PhoneSmsControlledLiveEnablementDisabledVerificationEnvironment = safeControlledLiveEnablementDisabledVerificationEnvironment,
): PhoneSmsControlledLiveEnablementDisabledVerificationOutcome => {
  const blockers = [...environmentBlockers(environment), ...inputBlockers(input), ...probeBlockers(input)];
  const status = statusFromBlockers(blockers);
  const verifiedSurfaces = [...new Set(input.verificationProbes.map((probe) => probe.surface))];

  return {
    id: `${input.id}-outcome`,
    build: 'QL-037',
    status,
    disabledVerificationGreen: status === 'disabled_verification_green',
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
    disabledVerificationOnly: true,
    manualGoNoGoRequiredBeforeLivePilot: true,
    livePilotRemainsBlocked: true,
    summary:
      status === 'disabled_verification_green'
        ? 'All controlled live enablement scaffold surfaces remain disabled and the next step is a manual go/no-go gate build.'
        : 'Controlled live enablement disabled verification is blocked until all safety gaps are corrected.',
    blockers,
    probeCount: input.verificationProbes.length,
    verifiedSurfaces,
    requiredNextBuild: 'QL-038-controlled-live-enablement-manual-go-no-go-gate',
  };
};

export const runPhoneSmsControlledLiveEnablementDisabledVerification = (): PhoneSmsControlledLiveEnablementDisabledVerificationReport => {
  const greenOutcome = evaluatePhoneSmsControlledLiveEnablementDisabledVerification(
    safeControlledLiveEnablementDisabledVerificationInput,
  );

  const unsafeSmsOutcome = evaluatePhoneSmsControlledLiveEnablementDisabledVerification(
    safeControlledLiveEnablementDisabledVerificationInput,
    {
      ...safeControlledLiveEnablementDisabledVerificationEnvironment,
      ENABLE_SMS: true,
      PHONE_SMS_CONTROLLED_DISABLED_VERIFICATION_SMS_SEND_DISABLED: false,
    },
  );

  const missingProbeOutcome = evaluatePhoneSmsControlledLiveEnablementDisabledVerification({
    ...safeControlledLiveEnablementDisabledVerificationInput,
    id: 'ql037-missing-probe-input',
    verificationProbes: safeControlledLiveEnablementDisabledVerificationInput.verificationProbes.filter(
      (probe) => probe.surface !== 'sms_send_adapter',
    ),
  });

  const unsafeEvidenceOutcome = evaluatePhoneSmsControlledLiveEnablementDisabledVerification({
    ...safeControlledLiveEnablementDisabledVerificationInput,
    id: 'ql037-unsafe-evidence-input',
    verificationProbes: [
      {
        ...safeControlledLiveEnablementDisabledVerificationInput.verificationProbes[0],
        containsLivePayload: true,
      },
      ...safeControlledLiveEnablementDisabledVerificationInput.verificationProbes.slice(1),
    ],
  });

  const outcomes = [greenOutcome, unsafeSmsOutcome, missingProbeOutcome, unsafeEvidenceOutcome];

  return {
    build: 'QL-037',
    status: greenOutcome.status,
    generatedAt: new Date(0).toISOString(),
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    liveEnablementAllowed: false,
    outcomes,
    requiredNextBuild: 'QL-038-controlled-live-enablement-manual-go-no-go-gate',
    verificationCases: [
      {
        id: 'green-disabled-verification',
        expectedStatus: 'disabled_verification_green',
        expectedLiveEnablementAllowed: false,
        passed: greenOutcome.status === 'disabled_verification_green' && !greenOutcome.liveEnablementAllowed,
      },
      {
        id: 'reject-enabled-sms',
        expectedStatus: 'blocked_enabled_live_behavior',
        expectedLiveEnablementAllowed: false,
        passed: unsafeSmsOutcome.status === 'blocked_enabled_live_behavior' && !unsafeSmsOutcome.liveEnablementAllowed,
      },
      {
        id: 'reject-missing-probe',
        expectedStatus: 'blocked_missing_scaffold_surface',
        expectedLiveEnablementAllowed: false,
        passed: missingProbeOutcome.status === 'blocked_missing_scaffold_surface' && !missingProbeOutcome.liveEnablementAllowed,
      },
      {
        id: 'reject-live-evidence',
        expectedStatus: 'blocked_unredacted_or_live_evidence',
        expectedLiveEnablementAllowed: false,
        passed: unsafeEvidenceOutcome.status === 'blocked_unredacted_or_live_evidence' && !unsafeEvidenceOutcome.liveEnablementAllowed,
      },
    ],
  };
};
