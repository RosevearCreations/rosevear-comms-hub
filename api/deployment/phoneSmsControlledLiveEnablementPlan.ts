export type PhoneSmsControlledLiveEnablementPlanStatus =
  | 'blocked_pending_controlled_live_enablement_plan'
  | 'plan_ready_for_manual_implementation_design'
  | 'blocked_decision_gate_not_approved'
  | 'blocked_missing_required_controls'
  | 'blocked_unsafe_environment'
  | 'blocked_unredacted_or_live_evidence';

export type PhoneSmsControlledLiveEnablementPlanDecision =
  | 'approve_controlled_implementation_planning'
  | 'hold_pending_controls'
  | 'reject_live_enablement_plan';

export type PhoneSmsControlledPlanArea =
  | 'manual_approval_boundary'
  | 'provider_boundary'
  | 'webhook_boundary'
  | 'sms_send_boundary'
  | 'recording_boundary'
  | 'ai_boundary'
  | 'persistence_boundary'
  | 'customer_data_boundary'
  | 'redaction_boundary'
  | 'rate_limit_boundary'
  | 'replay_protection_boundary'
  | 'rollback_boundary'
  | 'deployment_gate_boundary'
  | 'operator_training_boundary';

export type PhoneSmsControlledLiveEnablementEnvironment = {
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS:
    | 'approved_for_controlled_live_enablement_planning'
    | 'blocked_pending_explicit_live_enablement_decision_gate'
    | 'blocked_decision_rejected'
    | 'blocked_pending_rework';
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS:
    | 'blocked_pending_controlled_live_enablement_plan'
    | 'plan_ready_for_manual_implementation_design';
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SYNTHETIC_ONLY: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_REDACTED_ONLY: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SMS_SEND_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AUTO_SEND_DISABLED: boolean;
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_BUILD_REQUIRED: boolean;
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: boolean;
  ENABLE_PHONE_WEBHOOKS: boolean;
  ENABLE_SMS: boolean;
  ENABLE_CALL_RECORDING: boolean;
  ENABLE_AI_DRAFTS: boolean;
  ENABLE_AI_AUTO_SEND: boolean;
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: boolean;
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: boolean;
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: boolean;
  PHONE_SMS_EXISTING_NUMBERS_PROTECTED: boolean;
  PHONE_SMS_WEBHOOK_SECRET_VALUE_STORED_OUTSIDE_REPOSITORY: boolean;
};

export type PhoneSmsControlledPlanControl = {
  id: string;
  area: PhoneSmsControlledPlanArea;
  title: string;
  requiredBeforeImplementation: boolean;
  manualApprovalRequired: boolean;
  ownerAliasOnly: string;
  evidenceAllowed: 'synthetic_redacted_labels_only';
  liveEvidenceAllowed: false;
  safeToPersist: false;
  summary: string;
  blockers: string[];
  containsActualPhoneNumber: boolean;
  containsProviderCredential: boolean;
  containsWebhookSecretValue: boolean;
  containsCustomerData: boolean;
  containsLivePayload: boolean;
  containsRecording: boolean;
  containsTranscript: boolean;
  enablesProviderCallback: boolean;
  enablesPhoneWebhook: boolean;
  enablesSmsSend: boolean;
  enablesCallRecording: boolean;
  enablesAiDraft: boolean;
  enablesAutoSend: boolean;
  enablesPersistence: boolean;
  enablesLiveCustomerAccess: boolean;
};

export type PhoneSmsControlledPlanPhase = {
  id: string;
  title: string;
  sequence: number;
  entryGate: string;
  exitGate: string;
  allowedScope: string[];
  forbiddenScope: string[];
  rollbackTrigger: string;
  manualApprovalRequired: boolean;
  implementationBuildRequiredBeforeLiveTraffic: true;
  liveEnablementAllowedInQl035: false;
};

export type PhoneSmsControlledLiveEnablementPlanInput = {
  id: string;
  decisionGateOutcome: 'approve_controlled_live_enablement_planning';
  decidedByAlias: string;
  controls: PhoneSmsControlledPlanControl[];
  phases: PhoneSmsControlledPlanPhase[];
  syntheticOnlyConfirmed: boolean;
  redactedOnlyConfirmed: boolean;
  noActualPhoneNumberConfirmed: boolean;
  noProviderCredentialConfirmed: boolean;
  noWebhookSecretValueConfirmed: boolean;
  noCustomerDataConfirmed: boolean;
  noLivePayloadConfirmed: boolean;
  noRecordingConfirmed: boolean;
  noTranscriptConfirmed: boolean;
  noPersistenceWritesConfirmed: boolean;
  noLiveCustomerAccessConfirmed: boolean;
  noProviderCallbackConfirmed: boolean;
  noPhoneWebhookConfirmed: boolean;
  noSmsSendConfirmed: boolean;
  noCallRecordingConfirmed: boolean;
  noAiDraftConfirmed: boolean;
  noAutoSendConfirmed: boolean;
  existingNumbersProtectedConfirmed: boolean;
  implementationBuildRequiredBeforeLiveTraffic: boolean;
};

export type PhoneSmsControlledLiveEnablementPlanOutcome = {
  id: string;
  build: 'QL-035';
  status: PhoneSmsControlledLiveEnablementPlanStatus;
  decision: PhoneSmsControlledLiveEnablementPlanDecision;
  readyForManualImplementationDesign: boolean;
  implementationBuildRequiredBeforeLiveTraffic: true;
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
  planningOnly: true;
  summary: string;
  blockers: string[];
  controlsReviewed: string[];
  phasesReviewed: string[];
  requiredNextBuild: 'QL-036-controlled-live-enablement-implementation-scaffold';
};

export type PhoneSmsControlledLiveEnablementPlanReport = {
  build: 'QL-035';
  status: PhoneSmsControlledLiveEnablementPlanStatus;
  generatedAt: string;
  syntheticOnly: true;
  redactedOnly: true;
  safeToPersist: false;
  liveEnablementAllowed: false;
  outcomes: PhoneSmsControlledLiveEnablementPlanOutcome[];
  requiredNextBuild: 'QL-036-controlled-live-enablement-implementation-scaffold';
  verificationCases: Array<{
    id: string;
    expectedStatus: PhoneSmsControlledLiveEnablementPlanStatus;
    expectedLiveEnablementAllowed: false;
    passed: boolean;
  }>;
};

export const safeControlledLiveEnablementPlanEnvironment: PhoneSmsControlledLiveEnablementEnvironment = {
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'approved_for_controlled_live_enablement_planning',
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN_STATUS: 'blocked_pending_controlled_live_enablement_plan',
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SYNTHETIC_ONLY: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_REDACTED_ONLY: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SMS_SEND_DISABLED: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AUTO_SEND_DISABLED: true,
  PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_BUILD_REQUIRED: true,
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: false,
  ENABLE_PHONE_WEBHOOKS: false,
  ENABLE_SMS: false,
  ENABLE_CALL_RECORDING: false,
  ENABLE_AI_DRAFTS: false,
  ENABLE_AI_AUTO_SEND: false,
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: true,
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: true,
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: true,
  PHONE_SMS_EXISTING_NUMBERS_PROTECTED: true,
  PHONE_SMS_WEBHOOK_SECRET_VALUE_STORED_OUTSIDE_REPOSITORY: false,
};

const forbiddenTerms = [
  'actual phone number',
  'api key',
  'auth token',
  'bearer',
  'call recording',
  'client secret',
  'customer phone',
  'customer sms',
  'invoice',
  'live payload',
  'password',
  'provider secret',
  'real operator',
  'recording url',
  'service role',
  'sip password',
  'transcript',
  'webhook secret',
];

const phoneLikePattern = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

function containsForbiddenText(value: string): boolean {
  const normalized = value.toLowerCase();
  return forbiddenTerms.some((term) => normalized.includes(term)) || phoneLikePattern.test(value);
}

function unsafeEnvironmentReasons(environment: PhoneSmsControlledLiveEnablementEnvironment): string[] {
  const blockers: string[] = [];

  if (environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS !== 'approved_for_controlled_live_enablement_planning') {
    blockers.push('QL-034 explicit decision gate has not approved controlled live enablement planning.');
  }

  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SYNTHETIC_ONLY) blockers.push('Controlled plan must use synthetic labels only.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_REDACTED_ONLY) blockers.push('Controlled plan must use redacted labels only.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES) blockers.push('Persistence writes must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED) blockers.push('Live customer access must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED) blockers.push('Provider callbacks must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED) blockers.push('Phone webhooks must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_SMS_SEND_DISABLED) blockers.push('SMS sending must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED) blockers.push('Call recording must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED) blockers.push('AI drafts must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_AUTO_SEND_DISABLED) blockers.push('AI auto-send must stay disabled during QL-035.');
  if (!environment.PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_BUILD_REQUIRED) blockers.push('A later implementation build must be required before any live traffic.');
  if (environment.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED) blockers.push('Provider webhook is configured too early.');
  if (environment.ENABLE_PHONE_WEBHOOKS) blockers.push('Phone webhooks are enabled too early.');
  if (environment.ENABLE_SMS) blockers.push('SMS is enabled too early.');
  if (environment.ENABLE_CALL_RECORDING) blockers.push('Call recording is enabled too early.');
  if (environment.ENABLE_AI_DRAFTS) blockers.push('AI drafts are enabled too early.');
  if (environment.ENABLE_AI_AUTO_SEND) blockers.push('AI auto-send is enabled too early.');
  if (!environment.PHONE_SMS_PERSISTENCE_WRITES_DISABLED) blockers.push('Persistence writes are enabled too early.');
  if (!environment.PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED) blockers.push('Live customer reads are enabled too early.');
  if (!environment.PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED) blockers.push('Live customer writes are enabled too early.');
  if (!environment.PHONE_SMS_EXISTING_NUMBERS_PROTECTED) blockers.push('Existing numbers must remain protected.');
  if (environment.PHONE_SMS_WEBHOOK_SECRET_VALUE_STORED_OUTSIDE_REPOSITORY) blockers.push('QL-035 must not require storing webhook secret values yet.');

  return blockers;
}

function unsafeControlReasons(control: PhoneSmsControlledPlanControl): string[] {
  const blockers = [...control.blockers];
  const textValues = [control.id, control.title, control.ownerAliasOnly, control.summary, ...control.blockers];

  if (!control.requiredBeforeImplementation) blockers.push(`${control.id} must be required before implementation.`);
  if (!control.manualApprovalRequired) blockers.push(`${control.id} must require manual approval.`);
  if (control.evidenceAllowed !== 'synthetic_redacted_labels_only') blockers.push(`${control.id} must only allow synthetic redacted labels.`);
  if (control.liveEvidenceAllowed) blockers.push(`${control.id} cannot allow live evidence in QL-035.`);
  if (control.safeToPersist !== false) blockers.push(`${control.id} must remain safeToPersist=false.`);
  if (control.containsActualPhoneNumber) blockers.push(`${control.id} contains an actual phone number.`);
  if (control.containsProviderCredential) blockers.push(`${control.id} contains provider credentials.`);
  if (control.containsWebhookSecretValue) blockers.push(`${control.id} contains a webhook secret value.`);
  if (control.containsCustomerData) blockers.push(`${control.id} contains customer data.`);
  if (control.containsLivePayload) blockers.push(`${control.id} contains live provider payload data.`);
  if (control.containsRecording) blockers.push(`${control.id} contains recording evidence.`);
  if (control.containsTranscript) blockers.push(`${control.id} contains transcript evidence.`);
  if (control.enablesProviderCallback) blockers.push(`${control.id} enables provider callback behavior too early.`);
  if (control.enablesPhoneWebhook) blockers.push(`${control.id} enables phone webhooks too early.`);
  if (control.enablesSmsSend) blockers.push(`${control.id} enables SMS sending too early.`);
  if (control.enablesCallRecording) blockers.push(`${control.id} enables call recording too early.`);
  if (control.enablesAiDraft) blockers.push(`${control.id} enables AI drafts too early.`);
  if (control.enablesAutoSend) blockers.push(`${control.id} enables auto-send too early.`);
  if (control.enablesPersistence) blockers.push(`${control.id} enables persistence too early.`);
  if (control.enablesLiveCustomerAccess) blockers.push(`${control.id} enables live customer access too early.`);
  if (textValues.some(containsForbiddenText)) blockers.push(`${control.id} contains forbidden unredacted text.`);

  return blockers;
}

function missingAreas(controls: PhoneSmsControlledPlanControl[]): PhoneSmsControlledPlanArea[] {
  const areas = new Set(controls.map((control) => control.area));
  const requiredAreas: PhoneSmsControlledPlanArea[] = [
    'manual_approval_boundary',
    'provider_boundary',
    'webhook_boundary',
    'sms_send_boundary',
    'recording_boundary',
    'ai_boundary',
    'persistence_boundary',
    'customer_data_boundary',
    'redaction_boundary',
    'rate_limit_boundary',
    'replay_protection_boundary',
    'rollback_boundary',
    'deployment_gate_boundary',
    'operator_training_boundary',
  ];

  return requiredAreas.filter((area) => !areas.has(area));
}

function phaseBlockers(phases: PhoneSmsControlledPlanPhase[]): string[] {
  if (phases.length < 3) {
    return ['Controlled enablement plan must include at least three phases: implementation scaffold, disabled verification, and manual go/no-go review.'];
  }

  return phases.flatMap((phase) => {
    const blockers: string[] = [];
    if (!phase.manualApprovalRequired) blockers.push(`${phase.id} must require manual approval.`);
    if (!phase.implementationBuildRequiredBeforeLiveTraffic) blockers.push(`${phase.id} must require an implementation build before live traffic.`);
    if (phase.liveEnablementAllowedInQl035) blockers.push(`${phase.id} cannot allow live enablement in QL-035.`);
    if ([phase.id, phase.title, phase.entryGate, phase.exitGate, phase.rollbackTrigger, ...phase.allowedScope, ...phase.forbiddenScope].some(containsForbiddenText)) {
      blockers.push(`${phase.id} contains forbidden unredacted text.`);
    }
    return blockers;
  });
}

export function planPhoneSmsControlledLiveEnablement(
  input: PhoneSmsControlledLiveEnablementPlanInput,
  environment: PhoneSmsControlledLiveEnablementEnvironment = safeControlledLiveEnablementPlanEnvironment,
): PhoneSmsControlledLiveEnablementPlanOutcome {
  const environmentBlockers = unsafeEnvironmentReasons(environment);
  const confirmationBlockers = [
    input.syntheticOnlyConfirmed ? '' : 'Synthetic-only evidence confirmation is missing.',
    input.redactedOnlyConfirmed ? '' : 'Redacted-only evidence confirmation is missing.',
    input.noActualPhoneNumberConfirmed ? '' : 'Actual-phone-number exclusion confirmation is missing.',
    input.noProviderCredentialConfirmed ? '' : 'Provider credential exclusion confirmation is missing.',
    input.noWebhookSecretValueConfirmed ? '' : 'Webhook secret value exclusion confirmation is missing.',
    input.noCustomerDataConfirmed ? '' : 'Customer-data exclusion confirmation is missing.',
    input.noLivePayloadConfirmed ? '' : 'Live-payload exclusion confirmation is missing.',
    input.noRecordingConfirmed ? '' : 'Recording exclusion confirmation is missing.',
    input.noTranscriptConfirmed ? '' : 'Transcript exclusion confirmation is missing.',
    input.noPersistenceWritesConfirmed ? '' : 'No-persistence confirmation is missing.',
    input.noLiveCustomerAccessConfirmed ? '' : 'No-live-customer-access confirmation is missing.',
    input.noProviderCallbackConfirmed ? '' : 'No-provider-callback confirmation is missing.',
    input.noPhoneWebhookConfirmed ? '' : 'No-phone-webhook confirmation is missing.',
    input.noSmsSendConfirmed ? '' : 'No-SMS-send confirmation is missing.',
    input.noCallRecordingConfirmed ? '' : 'No-call-recording confirmation is missing.',
    input.noAiDraftConfirmed ? '' : 'No-AI-draft confirmation is missing.',
    input.noAutoSendConfirmed ? '' : 'No-auto-send confirmation is missing.',
    input.existingNumbersProtectedConfirmed ? '' : 'Existing-numbers-protected confirmation is missing.',
    input.implementationBuildRequiredBeforeLiveTraffic ? '' : 'Implementation-build-before-live-traffic confirmation is missing.',
  ].filter(Boolean);
  const controlBlockers = input.controls.flatMap(unsafeControlReasons);
  const missingControlAreas = missingAreas(input.controls).map((area) => `Missing required control area: ${area}.`);
  const planPhaseBlockers = phaseBlockers(input.phases);
  const blockers = [...environmentBlockers, ...confirmationBlockers, ...controlBlockers, ...missingControlAreas, ...planPhaseBlockers];

  let status: PhoneSmsControlledLiveEnablementPlanStatus = 'plan_ready_for_manual_implementation_design';
  let decision: PhoneSmsControlledLiveEnablementPlanDecision = 'approve_controlled_implementation_planning';

  if (environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS !== 'approved_for_controlled_live_enablement_planning') {
    status = 'blocked_decision_gate_not_approved';
    decision = 'reject_live_enablement_plan';
  } else if (environmentBlockers.length > 0) {
    status = 'blocked_unsafe_environment';
    decision = 'hold_pending_controls';
  } else if (controlBlockers.some((blocker) => /actual phone|credential|secret|customer|payload|recording|transcript|forbidden/i.test(blocker))) {
    status = 'blocked_unredacted_or_live_evidence';
    decision = 'hold_pending_controls';
  } else if (blockers.length > 0) {
    status = 'blocked_missing_required_controls';
    decision = 'hold_pending_controls';
  }

  return {
    id: `${input.id}-controlled-live-enablement-plan`,
    build: 'QL-035',
    status,
    decision,
    readyForManualImplementationDesign: status === 'plan_ready_for_manual_implementation_design',
    implementationBuildRequiredBeforeLiveTraffic: true,
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
    planningOnly: true,
    summary:
      status === 'plan_ready_for_manual_implementation_design'
        ? 'Controlled live enablement planning is ready for a later manual implementation design build; QL-035 still grants no live traffic.'
        : 'Controlled live enablement planning remains blocked until all missing or unsafe controls are resolved.',
    blockers,
    controlsReviewed: input.controls.map((control) => control.id),
    phasesReviewed: input.phases.map((phase) => phase.id),
    requiredNextBuild: 'QL-036-controlled-live-enablement-implementation-scaffold',
  };
}

const baseControl = {
  requiredBeforeImplementation: true,
  manualApprovalRequired: true,
  ownerAliasOnly: 'owner-alias-only',
  evidenceAllowed: 'synthetic_redacted_labels_only' as const,
  liveEvidenceAllowed: false as const,
  safeToPersist: false as const,
  blockers: [] as string[],
  containsActualPhoneNumber: false,
  containsProviderCredential: false,
  containsWebhookSecretValue: false,
  containsCustomerData: false,
  containsLivePayload: false,
  containsRecording: false,
  containsTranscript: false,
  enablesProviderCallback: false,
  enablesPhoneWebhook: false,
  enablesSmsSend: false,
  enablesCallRecording: false,
  enablesAiDraft: false,
  enablesAutoSend: false,
  enablesPersistence: false,
  enablesLiveCustomerAccess: false,
};

export const ql035RequiredControls: PhoneSmsControlledPlanControl[] = [
  { ...baseControl, id: 'ql035-control-manual-approval', area: 'manual_approval_boundary', title: 'Manual owner approval gate', summary: 'Requires owner approval before any future implementation scaffold may proceed.' },
  { ...baseControl, id: 'ql035-control-provider-boundary', area: 'provider_boundary', title: 'Provider boundary', summary: 'Provider account details remain outside the repository and are represented only by redacted labels.' },
  { ...baseControl, id: 'ql035-control-webhook-boundary', area: 'webhook_boundary', title: 'Webhook boundary', summary: 'Provider callbacks and phone webhooks remain disabled until a later implementation build.' },
  { ...baseControl, id: 'ql035-control-sms-send-boundary', area: 'sms_send_boundary', title: 'SMS send boundary', summary: 'SMS sending remains disabled and cannot be enabled by this plan.' },
  { ...baseControl, id: 'ql035-control-recording-boundary', area: 'recording_boundary', title: 'Recording boundary', summary: 'Call recording remains disabled and no recordings are accepted as evidence.' },
  { ...baseControl, id: 'ql035-control-ai-boundary', area: 'ai_boundary', title: 'AI boundary', summary: 'AI drafts and auto-send remain disabled until separately approved.' },
  { ...baseControl, id: 'ql035-control-persistence-boundary', area: 'persistence_boundary', title: 'Persistence boundary', summary: 'Persistence writes remain disabled until schema, RLS, audit, and rollback controls are built.' },
  { ...baseControl, id: 'ql035-control-customer-data-boundary', area: 'customer_data_boundary', title: 'Customer data boundary', summary: 'Live customer reads and writes remain disabled during planning.' },
  { ...baseControl, id: 'ql035-control-redaction-boundary', area: 'redaction_boundary', title: 'Redaction boundary', summary: 'Only synthetic redacted labels are allowed in planning artifacts.' },
  { ...baseControl, id: 'ql035-control-rate-limit-boundary', area: 'rate_limit_boundary', title: 'Rate limit boundary', summary: 'A later build must define provider callback rate limits before live traffic.' },
  { ...baseControl, id: 'ql035-control-replay-protection-boundary', area: 'replay_protection_boundary', title: 'Replay protection boundary', summary: 'A later build must define idempotency and replay protection before callbacks.' },
  { ...baseControl, id: 'ql035-control-rollback-boundary', area: 'rollback_boundary', title: 'Rollback boundary', summary: 'A kill switch and rollback path must be reviewed before implementation.' },
  { ...baseControl, id: 'ql035-control-deployment-gate-boundary', area: 'deployment_gate_boundary', title: 'Deployment gate boundary', summary: 'Preview, disabled-mode, and manual go/no-go gates are required before production.' },
  { ...baseControl, id: 'ql035-control-operator-training-boundary', area: 'operator_training_boundary', title: 'Operator training boundary', summary: 'Operators must understand disabled mode, redaction, escalation, and rollback labels.' },
];

export const ql035ControlledPlanPhases: PhoneSmsControlledPlanPhase[] = [
  {
    id: 'ql035-phase-implementation-scaffold',
    title: 'Implementation scaffold planning phase',
    sequence: 1,
    entryGate: 'QL-035 plan ready for manual implementation design',
    exitGate: 'QL-036 scaffold can be built with live features still disabled by default',
    allowedScope: ['disabled provider boundary labels', 'disabled route shape labels', 'manual approval checklist labels'],
    forbiddenScope: ['live traffic', 'provider callbacks', 'sms sending', 'recording', 'auto-send', 'persistence writes'],
    rollbackTrigger: 'Any missing manual approval or unsafe evidence returns the plan to hold.',
    manualApprovalRequired: true,
    implementationBuildRequiredBeforeLiveTraffic: true,
    liveEnablementAllowedInQl035: false,
  },
  {
    id: 'ql035-phase-disabled-verification',
    title: 'Disabled verification planning phase',
    sequence: 2,
    entryGate: 'Implementation scaffold exists but remains disabled',
    exitGate: 'Synthetic disabled-mode verification is green',
    allowedScope: ['synthetic callback labels', 'redacted disabled response labels', 'manual verification checklist labels'],
    forbiddenScope: ['live payloads', 'customer data', 'phone numbers', 'provider credentials', 'webhook secrets'],
    rollbackTrigger: 'Any live payload or unredacted evidence returns the plan to blocked.',
    manualApprovalRequired: true,
    implementationBuildRequiredBeforeLiveTraffic: true,
    liveEnablementAllowedInQl035: false,
  },
  {
    id: 'ql035-phase-manual-go-no-go',
    title: 'Manual go/no-go planning phase',
    sequence: 3,
    entryGate: 'Disabled verification and rollback planning are complete',
    exitGate: 'A later explicit owner decision may authorize a tiny monitored live pilot',
    allowedScope: ['go/no-go labels', 'rollback labels', 'operator checklist labels'],
    forbiddenScope: ['automatic enablement', 'auto-send', 'unreviewed persistence', 'unreviewed customer access'],
    rollbackTrigger: 'Any missed operator step or unexpected provider behavior returns to disabled mode.',
    manualApprovalRequired: true,
    implementationBuildRequiredBeforeLiveTraffic: true,
    liveEnablementAllowedInQl035: false,
  },
];

export const ql035ControlledPlanInput: PhoneSmsControlledLiveEnablementPlanInput = {
  id: 'ql035-controlled-live-enablement-plan-fixture',
  decisionGateOutcome: 'approve_controlled_live_enablement_planning',
  decidedByAlias: 'owner-alias-only',
  controls: ql035RequiredControls,
  phases: ql035ControlledPlanPhases,
  syntheticOnlyConfirmed: true,
  redactedOnlyConfirmed: true,
  noActualPhoneNumberConfirmed: true,
  noProviderCredentialConfirmed: true,
  noWebhookSecretValueConfirmed: true,
  noCustomerDataConfirmed: true,
  noLivePayloadConfirmed: true,
  noRecordingConfirmed: true,
  noTranscriptConfirmed: true,
  noPersistenceWritesConfirmed: true,
  noLiveCustomerAccessConfirmed: true,
  noProviderCallbackConfirmed: true,
  noPhoneWebhookConfirmed: true,
  noSmsSendConfirmed: true,
  noCallRecordingConfirmed: true,
  noAiDraftConfirmed: true,
  noAutoSendConfirmed: true,
  existingNumbersProtectedConfirmed: true,
  implementationBuildRequiredBeforeLiveTraffic: true,
};

export function runPhoneSmsControlledLiveEnablementPlan(): PhoneSmsControlledLiveEnablementPlanReport {
  const readyOutcome = planPhoneSmsControlledLiveEnablement(ql035ControlledPlanInput);
  const blockedDecisionOutcome = planPhoneSmsControlledLiveEnablement(ql035ControlledPlanInput, {
    ...safeControlledLiveEnablementPlanEnvironment,
    PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'blocked_pending_explicit_live_enablement_decision_gate',
  });
  const unsafeEnvironmentOutcome = planPhoneSmsControlledLiveEnablement(ql035ControlledPlanInput, {
    ...safeControlledLiveEnablementPlanEnvironment,
    ENABLE_SMS: true,
  });
  const missingControlsOutcome = planPhoneSmsControlledLiveEnablement({
    ...ql035ControlledPlanInput,
    controls: ql035RequiredControls.slice(0, 2),
  });

  const outcomes = [readyOutcome, blockedDecisionOutcome, unsafeEnvironmentOutcome, missingControlsOutcome];

  return {
    build: 'QL-035',
    status: readyOutcome.status,
    generatedAt: '2026-10-06T00:00:00.000Z',
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    liveEnablementAllowed: false,
    outcomes,
    requiredNextBuild: 'QL-036-controlled-live-enablement-implementation-scaffold',
    verificationCases: [
      {
        id: 'ql035-ready-plan-still-no-live-traffic',
        expectedStatus: 'plan_ready_for_manual_implementation_design',
        expectedLiveEnablementAllowed: false,
        passed: readyOutcome.status === 'plan_ready_for_manual_implementation_design' && readyOutcome.liveEnablementAllowed === false,
      },
      {
        id: 'ql035-blocks-without-ql034-approval',
        expectedStatus: 'blocked_decision_gate_not_approved',
        expectedLiveEnablementAllowed: false,
        passed: blockedDecisionOutcome.status === 'blocked_decision_gate_not_approved' && blockedDecisionOutcome.liveEnablementAllowed === false,
      },
      {
        id: 'ql035-blocks-unsafe-live-sms-environment',
        expectedStatus: 'blocked_unsafe_environment',
        expectedLiveEnablementAllowed: false,
        passed: unsafeEnvironmentOutcome.status === 'blocked_unsafe_environment' && unsafeEnvironmentOutcome.liveEnablementAllowed === false,
      },
      {
        id: 'ql035-blocks-missing-control-areas',
        expectedStatus: 'blocked_missing_required_controls',
        expectedLiveEnablementAllowed: false,
        passed: missingControlsOutcome.status === 'blocked_missing_required_controls' && missingControlsOutcome.liveEnablementAllowed === false,
      },
    ],
  };
}
