// QL-027 Phone/SMS Disabled Dry-Run Connection Plan
//
// Provider-neutral plan for preparing a disabled/dry-run inbound phone/SMS path.
// This helper does not store the actual purchased number, provider credentials,
// SIP credentials, webhook secrets, live payloads, customer data, recordings,
// transcripts, invoices, screenshots, or ownership documents. It does not enable
// phone webhooks, SMS sending, call recording, AI drafts, or AI auto-send.

export type PhoneSmsDisabledDryRunProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';
export type PhoneSmsDisabledDryRunTargetUse = 'rosiedazzlers' | 'devilndove' | 'shared_hub' | 'undecided';
export type PhoneSmsDisabledDryRunCapability = 'voice_only' | 'sms_capable' | 'voice_and_sms' | 'undecided';
export type PhoneSmsDisabledDryRunDeploymentTarget =
  | 'vercel_serverless_function'
  | 'cloudflare_worker'
  | 'local_operator_review_only'
  | 'undecided';
export type PhoneSmsDisabledDryRunMode = 'disabled_dry_run' | 'undecided';
export type PhoneSmsDisabledEndpointMode = 'disabled' | 'dry_run_no_persistence' | 'undecided';
export type PhoneSmsDisabledPersistenceMode = 'none' | 'dry_run_memory_only' | 'undecided';
export type PhoneSmsDisabledDryRunPlanStatus =
  | 'blocked_pending_disabled_dry_run_plan'
  | 'disabled_dry_run_plan_ready_for_runtime_verification';

export interface PhoneSmsDisabledDryRunSafetyFlags {
  existingNumbersProtected: boolean;
  portExistingNumbers: false;
  forwardExistingNumbers: false;
  providerWebhookConfigured: false;
  enablePhoneWebhooks: false;
  enableSms: false;
  enableCallRecording: false;
  enableAiDrafts: false;
  enableAiAutoSend: false;
  liveCustomerReads: false;
  liveCustomerWrites: false;
  testNumberPurchased: boolean;
}

export interface PhoneSmsDisabledDryRunRedactionConfirmations {
  noActualPurchasedPhoneNumber: boolean;
  noCandidatePhoneNumber: boolean;
  noProviderApiKeys: boolean;
  noSipCredentials: boolean;
  noWebhookSecrets: boolean;
  noPhoneNumberOwnershipDocuments: boolean;
  noInvoicesOrScreenshots: boolean;
  noCustomerData: boolean;
  noLivePayloads: boolean;
  noCallRecordingsOrTranscripts: boolean;
  noPersonalOrExistingPhoneNumbers: boolean;
}

export interface PhoneSmsDisabledDryRunConnectionPlanInput {
  connectionReadinessComplete: boolean;
  selectedProvider: PhoneSmsDisabledDryRunProvider;
  targetUse: PhoneSmsDisabledDryRunTargetUse;
  purchasedNumberAliasLabel: string | null;
  actualCapability: PhoneSmsDisabledDryRunCapability;
  deploymentTarget: PhoneSmsDisabledDryRunDeploymentTarget;
  connectionMode: PhoneSmsDisabledDryRunMode;
  endpointMode: PhoneSmsDisabledEndpointMode;
  expectedDisabledStatusCode: 503 | null;
  dryRunRouteLabel: string | null;
  providerPortalConfigurationReviewed: boolean;
  providerWebhookWillRemainUnconfigured: boolean;
  webhookSecretNamePlanned: boolean;
  webhookSecretValueStoredOutsideRepository: boolean;
  syntheticVoicePayloadFixturePlanned: boolean;
  syntheticSmsPayloadFixturePlanned: boolean;
  inboundVoiceMappingReviewed: boolean;
  inboundSmsMappingReviewed: boolean;
  contactConversationTaskMappingReviewed: boolean;
  persistenceMode: PhoneSmsDisabledPersistenceMode;
  persistenceWritesDisabled: boolean;
  liveCustomerReadsDisabled: boolean;
  liveCustomerWritesDisabled: boolean;
  rateLimitPlanReviewed: boolean;
  idempotencyPlanReviewed: boolean;
  replayProtectionPlanReviewed: boolean;
  loggingRedactionPlanReviewed: boolean;
  rollbackPlanReviewed: boolean;
  operatorApprovalForRuntimeVerification: boolean;
  dryRunPlanNotes: string[];
  redactionConfirmations: PhoneSmsDisabledDryRunRedactionConfirmations;
  safetyFlags: PhoneSmsDisabledDryRunSafetyFlags;
}

export interface PhoneSmsDisabledDryRunConnectionPlan {
  build: 'QL-027';
  title: 'Phone/SMS Disabled Dry-Run Connection Plan';
  decisionFrom: 'QL-021';
  setupGateFrom: 'QL-022';
  manualEvidenceFrom: 'QL-023';
  purchaseReviewFrom: 'QL-024';
  purchaseEvidenceFrom: 'QL-025';
  connectionReadinessFrom: 'QL-026';
  selectedApproach: 'new_test_number_first';
  planStatus: PhoneSmsDisabledDryRunPlanStatus;
  dryRunPlan: PhoneSmsDisabledDryRunConnectionPlanInput;
  planComplete: boolean;
  productionSafe: boolean;
  runtimeVerificationAllowed: boolean;
  blockers: string[];
  acceptedEvidence: string[];
  forbiddenEvidence: string[];
  requiredEnvironmentNames: string[];
  nextSafeAction: string;
  nextBuild: 'QL-028 — Phone/SMS Disabled Dry-Run Runtime Verification';
}

export const phoneSmsDisabledDryRunConnectionPlanDefaults: PhoneSmsDisabledDryRunConnectionPlanInput = {
  connectionReadinessComplete: false,
  selectedProvider: 'undecided',
  targetUse: 'undecided',
  purchasedNumberAliasLabel: null,
  actualCapability: 'undecided',
  deploymentTarget: 'undecided',
  connectionMode: 'undecided',
  endpointMode: 'undecided',
  expectedDisabledStatusCode: null,
  dryRunRouteLabel: null,
  providerPortalConfigurationReviewed: false,
  providerWebhookWillRemainUnconfigured: false,
  webhookSecretNamePlanned: false,
  webhookSecretValueStoredOutsideRepository: false,
  syntheticVoicePayloadFixturePlanned: false,
  syntheticSmsPayloadFixturePlanned: false,
  inboundVoiceMappingReviewed: false,
  inboundSmsMappingReviewed: false,
  contactConversationTaskMappingReviewed: false,
  persistenceMode: 'undecided',
  persistenceWritesDisabled: true,
  liveCustomerReadsDisabled: true,
  liveCustomerWritesDisabled: true,
  rateLimitPlanReviewed: false,
  idempotencyPlanReviewed: false,
  replayProtectionPlanReviewed: false,
  loggingRedactionPlanReviewed: false,
  rollbackPlanReviewed: false,
  operatorApprovalForRuntimeVerification: false,
  dryRunPlanNotes: [],
  redactionConfirmations: {
    noActualPurchasedPhoneNumber: true,
    noCandidatePhoneNumber: true,
    noProviderApiKeys: true,
    noSipCredentials: true,
    noWebhookSecrets: true,
    noPhoneNumberOwnershipDocuments: true,
    noInvoicesOrScreenshots: true,
    noCustomerData: true,
    noLivePayloads: true,
    noCallRecordingsOrTranscripts: true,
    noPersonalOrExistingPhoneNumbers: true
  },
  safetyFlags: {
    existingNumbersProtected: true,
    portExistingNumbers: false,
    forwardExistingNumbers: false,
    providerWebhookConfigured: false,
    enablePhoneWebhooks: false,
    enableSms: false,
    enableCallRecording: false,
    enableAiDrafts: false,
    enableAiAutoSend: false,
    liveCustomerReads: false,
    liveCustomerWrites: false,
    testNumberPurchased: false
  }
};

const forbiddenDryRunPlanWords = [
  'api key',
  'apikey',
  'auth token',
  'bearer ',
  'call recording',
  'client secret',
  'invoice',
  'password',
  'recording url',
  'secret value',
  'sip password',
  'screenshot',
  'token',
  'transcript',
  'webhook secret'
];

function containsForbiddenText(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return forbiddenDryRunPlanWords.some((word) => normalized.includes(word));
}

function containsPhoneLikeNumber(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

function requiresVoicePlan(capability: PhoneSmsDisabledDryRunCapability): boolean {
  return capability === 'voice_only' || capability === 'voice_and_sms';
}

function requiresSmsPlan(capability: PhoneSmsDisabledDryRunCapability): boolean {
  return capability === 'sms_capable' || capability === 'voice_and_sms';
}

function getDisabledDryRunPlanBlockers(input: PhoneSmsDisabledDryRunConnectionPlanInput): string[] {
  const blockers: string[] = [];

  if (!input.connectionReadinessComplete) {
    blockers.push('Complete QL-026 connection readiness before disabled dry-run planning.');
  }

  if (input.selectedProvider === 'undecided') {
    blockers.push('Record the provider for the manually purchased test number.');
  }

  if (input.targetUse === 'undecided') {
    blockers.push('Record the target use for disabled dry-run planning.');
  }

  if (!input.purchasedNumberAliasLabel || input.purchasedNumberAliasLabel.trim().length === 0) {
    blockers.push('Record a non-secret alias label for the purchased test number.');
  }

  if (input.actualCapability === 'undecided') {
    blockers.push('Record the purchased test number capability from QL-026.');
  }

  if (input.deploymentTarget === 'undecided') {
    blockers.push('Choose a disabled dry-run deployment target.');
  }

  if (input.connectionMode !== 'disabled_dry_run') {
    blockers.push('Connection mode must be disabled_dry_run.');
  }

  if (input.endpointMode === 'undecided') {
    blockers.push('Record whether the route will be disabled or dry_run_no_persistence.');
  }

  if (input.expectedDisabledStatusCode !== 503) {
    blockers.push('Expected disabled response must remain HTTP 503 for the safe default.');
  }

  if (!input.dryRunRouteLabel || input.dryRunRouteLabel.trim().length === 0) {
    blockers.push('Record a non-secret dry-run route label without a live secret-bearing URL.');
  }

  if (!input.providerPortalConfigurationReviewed) {
    blockers.push('Review provider portal configuration without saving a webhook there.');
  }

  if (!input.providerWebhookWillRemainUnconfigured) {
    blockers.push('Confirm provider webhook configuration will remain unset for QL-027.');
  }

  if (!input.webhookSecretNamePlanned) {
    blockers.push('Plan only the webhook secret name, not the secret value.');
  }

  if (!input.webhookSecretValueStoredOutsideRepository) {
    blockers.push('Confirm future webhook secret values stay in a deployment secret store or password manager.');
  }

  if (requiresVoicePlan(input.actualCapability) && !input.syntheticVoicePayloadFixturePlanned) {
    blockers.push('Plan synthetic voice payload fixtures before voice dry-run verification.');
  }

  if (requiresSmsPlan(input.actualCapability) && !input.syntheticSmsPayloadFixturePlanned) {
    blockers.push('Plan synthetic SMS payload fixtures before SMS dry-run verification.');
  }

  if (requiresVoicePlan(input.actualCapability) && !input.inboundVoiceMappingReviewed) {
    blockers.push('Review inbound voice event mapping.');
  }

  if (requiresSmsPlan(input.actualCapability) && !input.inboundSmsMappingReviewed) {
    blockers.push('Review inbound SMS event mapping.');
  }

  if (!input.contactConversationTaskMappingReviewed) {
    blockers.push('Review contact/conversation/task mapping using synthetic data only.');
  }

  if (input.persistenceMode === 'undecided') {
    blockers.push('Record disabled dry-run persistence mode.');
  }

  if (!input.persistenceWritesDisabled) {
    blockers.push('Persistence writes must remain disabled for QL-027.');
  }

  if (!input.liveCustomerReadsDisabled || !input.liveCustomerWritesDisabled) {
    blockers.push('Live customer reads and writes must remain disabled.');
  }

  if (!input.rateLimitPlanReviewed) {
    blockers.push('Review rate-limit plan for the disabled dry-run route.');
  }

  if (!input.idempotencyPlanReviewed) {
    blockers.push('Review idempotency plan for duplicate provider events.');
  }

  if (!input.replayProtectionPlanReviewed) {
    blockers.push('Review replay-protection plan before any provider callback verification.');
  }

  if (!input.loggingRedactionPlanReviewed) {
    blockers.push('Review logging redaction for numbers, payloads, and secrets.');
  }

  if (!input.rollbackPlanReviewed) {
    blockers.push('Review rollback plan for disabling the route and provider settings.');
  }

  if (!input.operatorApprovalForRuntimeVerification) {
    blockers.push('Operator approval is required before QL-028 runtime verification.');
  }

  if (!input.safetyFlags.testNumberPurchased) {
    blockers.push('Confirm exactly one disposable test number remains the scope.');
  }

  if (!input.safetyFlags.existingNumbersProtected) {
    blockers.push('Existing business, personal, Bell Fibe, RosieDazzlers, and DevilnDove numbers must remain protected.');
  }

  if (
    input.safetyFlags.portExistingNumbers
    || input.safetyFlags.forwardExistingNumbers
    || input.safetyFlags.providerWebhookConfigured
    || input.safetyFlags.enablePhoneWebhooks
    || input.safetyFlags.enableSms
    || input.safetyFlags.enableCallRecording
    || input.safetyFlags.enableAiDrafts
    || input.safetyFlags.enableAiAutoSend
    || input.safetyFlags.liveCustomerReads
    || input.safetyFlags.liveCustomerWrites
  ) {
    blockers.push('Porting, forwarding, provider webhooks, live phone/SMS, recording, AI, and live customer access must remain disabled.');
  }

  const redactionValues = Object.values(input.redactionConfirmations);
  if (redactionValues.some((confirmed) => confirmed !== true)) {
    blockers.push('Confirm no numbers, credentials, secrets, documents, payloads, recordings, transcripts, customer data, or existing numbers are included.');
  }

  const planText = [
    input.purchasedNumberAliasLabel,
    input.dryRunRouteLabel,
    ...input.dryRunPlanNotes
  ];

  if (planText.some(containsForbiddenText)) {
    blockers.push('Remove secret-like, document-like, payload-like, recording, or transcript text from dry-run plan labels and notes.');
  }

  if (planText.some(containsPhoneLikeNumber)) {
    blockers.push('Remove actual or phone-like numbers from repository dry-run plan text.');
  }

  return blockers;
}

export function getPhoneSmsDisabledDryRunConnectionPlan(
  overrides: Partial<PhoneSmsDisabledDryRunConnectionPlanInput> = {}
): PhoneSmsDisabledDryRunConnectionPlan {
  const dryRunPlan: PhoneSmsDisabledDryRunConnectionPlanInput = {
    ...phoneSmsDisabledDryRunConnectionPlanDefaults,
    ...overrides,
    redactionConfirmations: {
      ...phoneSmsDisabledDryRunConnectionPlanDefaults.redactionConfirmations,
      ...overrides.redactionConfirmations
    },
    safetyFlags: {
      ...phoneSmsDisabledDryRunConnectionPlanDefaults.safetyFlags,
      ...overrides.safetyFlags
    }
  };

  const blockers = getDisabledDryRunPlanBlockers(dryRunPlan);
  const planComplete = blockers.length === 0;
  const productionSafe = dryRunPlan.safetyFlags.existingNumbersProtected
    && !dryRunPlan.safetyFlags.portExistingNumbers
    && !dryRunPlan.safetyFlags.forwardExistingNumbers
    && !dryRunPlan.safetyFlags.providerWebhookConfigured
    && !dryRunPlan.safetyFlags.enablePhoneWebhooks
    && !dryRunPlan.safetyFlags.enableSms
    && !dryRunPlan.safetyFlags.enableCallRecording
    && !dryRunPlan.safetyFlags.enableAiDrafts
    && !dryRunPlan.safetyFlags.enableAiAutoSend
    && !dryRunPlan.safetyFlags.liveCustomerReads
    && !dryRunPlan.safetyFlags.liveCustomerWrites
    && dryRunPlan.connectionMode === 'disabled_dry_run'
    && dryRunPlan.expectedDisabledStatusCode === 503
    && dryRunPlan.persistenceWritesDisabled
    && dryRunPlan.liveCustomerReadsDisabled
    && dryRunPlan.liveCustomerWritesDisabled;
  const runtimeVerificationAllowed = planComplete && productionSafe;

  return {
    build: 'QL-027',
    title: 'Phone/SMS Disabled Dry-Run Connection Plan',
    decisionFrom: 'QL-021',
    setupGateFrom: 'QL-022',
    manualEvidenceFrom: 'QL-023',
    purchaseReviewFrom: 'QL-024',
    purchaseEvidenceFrom: 'QL-025',
    connectionReadinessFrom: 'QL-026',
    selectedApproach: 'new_test_number_first',
    planStatus: runtimeVerificationAllowed
      ? 'disabled_dry_run_plan_ready_for_runtime_verification'
      : 'blocked_pending_disabled_dry_run_plan',
    dryRunPlan,
    planComplete,
    productionSafe,
    runtimeVerificationAllowed,
    blockers,
    acceptedEvidence: [
      'Provider, target use, capability, deployment target, and non-secret purchased-number alias labels.',
      'Disabled/dry-run route label and expected HTTP 503 disabled-mode response.',
      'Synthetic voice/SMS fixture planning confirmations without live payloads.',
      'Inbound event and contact/conversation/task mapping confirmations using synthetic data only.',
      'Persistence-disabled, live-read-disabled, live-write-disabled, rate-limit, idempotency, replay, logging-redaction, rollback, and operator-approval confirmations.'
    ],
    forbiddenEvidence: [
      'Actual candidate or purchased phone number.',
      'Provider API keys, tokens, client secrets, passwords, SIP credentials, webhook secret values, or live URLs containing secrets.',
      'Invoices, screenshots, receipts, number ownership documents, or copied provider portal documents.',
      'Customer names, customer phone numbers, SMS content, call recordings, transcripts, or live phone/SMS payloads.',
      'Personal, Bell Fibe, RosieDazzlers, or DevilnDove existing numbers.',
      'Any instruction to configure provider webhooks or enable live phone webhooks, SMS sending, call recording, AI drafts, AI auto-send, or live customer access.'
    ],
    requiredEnvironmentNames: [
      'PHONE_SMS_DISABLED_DRY_RUN_PLAN_STATUS',
      'PHONE_SMS_CONNECTION_READINESS_STATUS',
      'PHONE_SMS_TEST_PROVIDER',
      'PHONE_SMS_TEST_NUMBER_TARGET_USE',
      'PHONE_SMS_PURCHASED_NUMBER_ALIAS_LABEL',
      'PHONE_SMS_ACTUAL_CAPABILITY',
      'PHONE_SMS_DRY_RUN_DEPLOYMENT_TARGET',
      'PHONE_SMS_DRY_RUN_CONNECTION_MODE',
      'PHONE_SMS_DRY_RUN_ENDPOINT_MODE',
      'PHONE_SMS_DRY_RUN_EXPECTED_DISABLED_STATUS',
      'PHONE_SMS_DRY_RUN_ROUTE_LABEL',
      'PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED',
      'PHONE_SMS_DRY_RUN_PERSISTENCE_MODE',
      'PHONE_SMS_PERSISTENCE_WRITES_DISABLED',
      'PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED',
      'PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED',
      'PHONE_SMS_EXISTING_NUMBERS_PROTECTED',
      'ENABLE_PHONE_WEBHOOKS',
      'ENABLE_SMS',
      'ENABLE_CALL_RECORDING',
      'ENABLE_AI_DRAFTS',
      'ENABLE_AI_AUTO_SEND'
    ],
    nextSafeAction: runtimeVerificationAllowed
      ? 'Proceed to QL-028 disabled dry-run runtime verification using synthetic payloads only.'
      : 'Complete disabled dry-run planning while keeping all live phone/SMS features disabled.',
    nextBuild: 'QL-028 — Phone/SMS Disabled Dry-Run Runtime Verification'
  };
}
