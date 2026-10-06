// QL-026 Phone/SMS Test Number Connection Readiness Gate
//
// Provider-neutral gate for reviewing whether the manually purchased disposable test number
// is ready for a disabled/dry-run connection plan. This helper does not store the actual
// purchased number, provider credentials, SIP credentials, webhook secrets, live payloads,
// customer data, recordings, transcripts, invoices, screenshots, or ownership documents.
// It does not enable phone webhooks, SMS sending, call recording, AI drafts, or AI auto-send.

export type PhoneSmsConnectionProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';
export type PhoneSmsConnectionTargetUse = 'rosiedazzlers' | 'devilndove' | 'shared_hub' | 'undecided';
export type PhoneSmsConnectionCapability = 'voice_only' | 'sms_capable' | 'voice_and_sms' | 'undecided';
export type PhoneSmsConnectionSecretStorage =
  | 'deployment_secret_store'
  | 'password_manager'
  | 'provider_portal_only'
  | 'not_applicable'
  | 'undecided';
export type PhoneSmsConnectionMode = 'disabled_dry_run' | 'undecided';
export type PhoneSmsConnectionDeploymentTarget =
  | 'vercel_serverless_function'
  | 'cloudflare_worker'
  | 'local_operator_review_only'
  | 'undecided';
export type PhoneSmsConnectionReadinessStatus =
  | 'blocked_pending_connection_readiness'
  | 'ready_for_disabled_dry_run_connection_plan';

export interface PhoneSmsConnectionSafetyFlags {
  existingNumbersProtected: boolean;
  portExistingNumbers: false;
  forwardExistingNumbers: false;
  enablePhoneWebhooks: false;
  enableSms: false;
  enableCallRecording: false;
  enableAiDrafts: false;
  enableAiAutoSend: false;
  testNumberPurchased: boolean;
}

export interface PhoneSmsConnectionRedactionConfirmations {
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

export interface PhoneSmsTestNumberConnectionReadinessInput {
  purchaseEvidenceComplete: boolean;
  selectedProvider: PhoneSmsConnectionProvider;
  targetUse: PhoneSmsConnectionTargetUse;
  purchasedNumberAliasLabel: string | null;
  purchasedNumberStorageLocation: PhoneSmsConnectionSecretStorage;
  credentialStorageLocation: PhoneSmsConnectionSecretStorage;
  webhookSecretStorageLocation: PhoneSmsConnectionSecretStorage;
  providerPortalAccessConfirmed: boolean;
  providerConnectionSettingsReviewed: boolean;
  webhookEndpointDrafted: boolean;
  dryRunRouteLabel: string | null;
  deploymentTarget: PhoneSmsConnectionDeploymentTarget;
  connectionMode: PhoneSmsConnectionMode;
  expectedCapability: PhoneSmsConnectionCapability;
  actualCapability: PhoneSmsConnectionCapability;
  inboundVoiceScenarioReviewed: boolean;
  inboundSmsScenarioReviewed: boolean;
  smsComplianceHoldConfirmed: boolean;
  allowedOriginsReviewed: boolean;
  rateLimitPlanReviewed: boolean;
  idempotencyPlanReviewed: boolean;
  loggingRedactionPlanReviewed: boolean;
  rollbackPlanReviewed: boolean;
  operatorApprovalForDryRunPlan: boolean;
  connectionReadinessNotes: string[];
  redactionConfirmations: PhoneSmsConnectionRedactionConfirmations;
  safetyFlags: PhoneSmsConnectionSafetyFlags;
}

export interface PhoneSmsTestNumberConnectionReadinessGate {
  build: 'QL-026';
  title: 'Phone/SMS Test Number Connection Readiness Gate';
  decisionFrom: 'QL-021';
  setupGateFrom: 'QL-022';
  manualEvidenceFrom: 'QL-023';
  purchaseReviewFrom: 'QL-024';
  purchaseEvidenceFrom: 'QL-025';
  selectedApproach: 'new_test_number_first';
  readinessStatus: PhoneSmsConnectionReadinessStatus;
  connectionReadiness: PhoneSmsTestNumberConnectionReadinessInput;
  readinessComplete: boolean;
  productionSafe: boolean;
  disabledDryRunPlanAllowed: boolean;
  blockers: string[];
  acceptedEvidence: string[];
  forbiddenEvidence: string[];
  requiredEnvironmentNames: string[];
  nextSafeAction: string;
  nextBuild: 'QL-027 — Phone/SMS Disabled Dry-Run Connection Plan';
}

export const phoneSmsConnectionReadinessDefaults: PhoneSmsTestNumberConnectionReadinessInput = {
  purchaseEvidenceComplete: false,
  selectedProvider: 'undecided',
  targetUse: 'undecided',
  purchasedNumberAliasLabel: null,
  purchasedNumberStorageLocation: 'undecided',
  credentialStorageLocation: 'undecided',
  webhookSecretStorageLocation: 'undecided',
  providerPortalAccessConfirmed: false,
  providerConnectionSettingsReviewed: false,
  webhookEndpointDrafted: false,
  dryRunRouteLabel: null,
  deploymentTarget: 'undecided',
  connectionMode: 'undecided',
  expectedCapability: 'undecided',
  actualCapability: 'undecided',
  inboundVoiceScenarioReviewed: false,
  inboundSmsScenarioReviewed: false,
  smsComplianceHoldConfirmed: false,
  allowedOriginsReviewed: false,
  rateLimitPlanReviewed: false,
  idempotencyPlanReviewed: false,
  loggingRedactionPlanReviewed: false,
  rollbackPlanReviewed: false,
  operatorApprovalForDryRunPlan: false,
  connectionReadinessNotes: [],
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
    enablePhoneWebhooks: false,
    enableSms: false,
    enableCallRecording: false,
    enableAiDrafts: false,
    enableAiAutoSend: false,
    testNumberPurchased: false
  }
};

const forbiddenConnectionEvidenceWords = [
  'api key',
  'apikey',
  'auth token',
  'bearer ',
  'call recording',
  'client secret',
  'invoice',
  'password',
  'recording url',
  'secret',
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
  return forbiddenConnectionEvidenceWords.some((word) => normalized.includes(word));
}

function containsPhoneLikeNumber(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

function requiresVoiceReview(capability: PhoneSmsConnectionCapability): boolean {
  return capability === 'voice_only' || capability === 'voice_and_sms';
}

function requiresSmsReview(capability: PhoneSmsConnectionCapability): boolean {
  return capability === 'sms_capable' || capability === 'voice_and_sms';
}

function getConnectionReadinessBlockers(input: PhoneSmsTestNumberConnectionReadinessInput): string[] {
  const blockers: string[] = [];

  if (!input.purchaseEvidenceComplete) {
    blockers.push('Complete QL-025 redacted purchase evidence before connection readiness review.');
  }

  if (input.selectedProvider === 'undecided') {
    blockers.push('Record the purchased test-number provider: voipms, telnyx, or twilio.');
  }

  if (input.targetUse === 'undecided') {
    blockers.push('Record the first target use: RosieDazzlers, DevilnDove, or shared hub testing.');
  }

  if (!input.purchasedNumberAliasLabel || input.purchasedNumberAliasLabel.trim().length === 0) {
    blockers.push('Record a non-secret alias label for the purchased test number.');
  }

  if (input.purchasedNumberStorageLocation === 'undecided') {
    blockers.push('Record where the actual purchased number is stored outside the repository.');
  }

  if (input.credentialStorageLocation === 'undecided') {
    blockers.push('Record where provider credentials are stored without committing credential values.');
  }

  if (input.webhookSecretStorageLocation === 'undecided') {
    blockers.push('Record where future webhook secrets will be stored without committing secret values.');
  }

  if (!input.providerPortalAccessConfirmed) {
    blockers.push('Confirm provider portal access for the purchased test number.');
  }

  if (!input.providerConnectionSettingsReviewed) {
    blockers.push('Confirm provider connection/webhook settings were reviewed without enabling them.');
  }

  if (!input.webhookEndpointDrafted) {
    blockers.push('Draft the disabled/dry-run webhook endpoint plan before connection work.');
  }

  if (!input.dryRunRouteLabel || input.dryRunRouteLabel.trim().length === 0) {
    blockers.push('Record a non-secret dry-run route label, not a live webhook URL with secrets.');
  }

  if (input.deploymentTarget === 'undecided') {
    blockers.push('Confirm the connection deployment target for disabled dry-run planning.');
  }

  if (input.connectionMode !== 'disabled_dry_run') {
    blockers.push('Connection mode must remain disabled_dry_run for QL-026.');
  }

  if (input.expectedCapability === 'undecided') {
    blockers.push('Record expected capability from QL-025.');
  }

  if (input.actualCapability === 'undecided') {
    blockers.push('Record actual purchased-number capability from QL-025.');
  }

  if (requiresVoiceReview(input.actualCapability) && !input.inboundVoiceScenarioReviewed) {
    blockers.push('Review inbound voice dry-run scenario before any voice connection plan.');
  }

  if (requiresSmsReview(input.actualCapability) && !input.inboundSmsScenarioReviewed) {
    blockers.push('Review inbound SMS dry-run scenario before any SMS connection plan.');
  }

  if (requiresSmsReview(input.actualCapability) && !input.smsComplianceHoldConfirmed) {
    blockers.push('Confirm SMS/compliance hold remains in place before any SMS-capable connection plan.');
  }

  if (!input.allowedOriginsReviewed) {
    blockers.push('Review allowed origins for any future phone/SMS webhook or admin route.');
  }

  if (!input.rateLimitPlanReviewed) {
    blockers.push('Review rate limiting before any provider callback route is connected.');
  }

  if (!input.idempotencyPlanReviewed) {
    blockers.push('Review idempotency/replay protection before any provider callback route is connected.');
  }

  if (!input.loggingRedactionPlanReviewed) {
    blockers.push('Review logging redaction so numbers, payloads, and secrets are not logged.');
  }

  if (!input.rollbackPlanReviewed) {
    blockers.push('Review rollback plan before any disabled dry-run connection work.');
  }

  if (!input.operatorApprovalForDryRunPlan) {
    blockers.push('Operator approval is required before QL-027 disabled dry-run connection planning.');
  }

  if (!input.safetyFlags.testNumberPurchased) {
    blockers.push('Confirm exactly one disposable test number was purchased manually.');
  }

  if (!input.safetyFlags.existingNumbersProtected) {
    blockers.push('Existing business, personal, Bell Fibe, RosieDazzlers, and DevilnDove numbers must remain protected.');
  }

  if (
    input.safetyFlags.portExistingNumbers
    || input.safetyFlags.forwardExistingNumbers
    || input.safetyFlags.enablePhoneWebhooks
    || input.safetyFlags.enableSms
    || input.safetyFlags.enableCallRecording
    || input.safetyFlags.enableAiDrafts
    || input.safetyFlags.enableAiAutoSend
  ) {
    blockers.push('Porting, forwarding, phone webhooks, SMS sending, call recording, AI drafts, and AI auto-send must remain disabled.');
  }

  const redactionValues = Object.values(input.redactionConfirmations);
  if (redactionValues.some((confirmed) => confirmed !== true)) {
    blockers.push('Confirm no numbers, credentials, secrets, documents, payloads, recordings, transcripts, customer data, or existing numbers are included.');
  }

  const readinessText = [
    input.purchasedNumberAliasLabel,
    input.dryRunRouteLabel,
    ...input.connectionReadinessNotes
  ];

  if (readinessText.some(containsForbiddenText)) {
    blockers.push('Remove secret-like, document-like, payload-like, recording, or transcript text from connection readiness labels and notes.');
  }

  if (readinessText.some(containsPhoneLikeNumber)) {
    blockers.push('Remove actual or phone-like numbers from repository connection readiness text.');
  }

  return blockers;
}

export function getPhoneSmsTestNumberConnectionReadinessGate(
  overrides: Partial<PhoneSmsTestNumberConnectionReadinessInput> = {}
): PhoneSmsTestNumberConnectionReadinessGate {
  const connectionReadiness: PhoneSmsTestNumberConnectionReadinessInput = {
    ...phoneSmsConnectionReadinessDefaults,
    ...overrides,
    redactionConfirmations: {
      ...phoneSmsConnectionReadinessDefaults.redactionConfirmations,
      ...overrides.redactionConfirmations
    },
    safetyFlags: {
      ...phoneSmsConnectionReadinessDefaults.safetyFlags,
      ...overrides.safetyFlags
    }
  };

  const blockers = getConnectionReadinessBlockers(connectionReadiness);
  const readinessComplete = blockers.length === 0;
  const productionSafe = connectionReadiness.safetyFlags.existingNumbersProtected
    && !connectionReadiness.safetyFlags.portExistingNumbers
    && !connectionReadiness.safetyFlags.forwardExistingNumbers
    && !connectionReadiness.safetyFlags.enablePhoneWebhooks
    && !connectionReadiness.safetyFlags.enableSms
    && !connectionReadiness.safetyFlags.enableCallRecording
    && !connectionReadiness.safetyFlags.enableAiDrafts
    && !connectionReadiness.safetyFlags.enableAiAutoSend
    && connectionReadiness.connectionMode === 'disabled_dry_run';
  const disabledDryRunPlanAllowed = readinessComplete && productionSafe;

  return {
    build: 'QL-026',
    title: 'Phone/SMS Test Number Connection Readiness Gate',
    decisionFrom: 'QL-021',
    setupGateFrom: 'QL-022',
    manualEvidenceFrom: 'QL-023',
    purchaseReviewFrom: 'QL-024',
    purchaseEvidenceFrom: 'QL-025',
    selectedApproach: 'new_test_number_first',
    readinessStatus: disabledDryRunPlanAllowed
      ? 'ready_for_disabled_dry_run_connection_plan'
      : 'blocked_pending_connection_readiness',
    connectionReadiness,
    readinessComplete,
    productionSafe,
    disabledDryRunPlanAllowed,
    blockers,
    acceptedEvidence: [
      'Provider, target use, and purchased-number alias labels without actual phone numbers.',
      'External storage-location labels for purchased number, provider credentials, and future webhook secrets.',
      'Provider portal access and connection-settings review confirmations.',
      'Disabled/dry-run route label without secrets or live payloads.',
      'Capability labels and voice/SMS scenario review confirmations.',
      'Allowed-origin, rate-limit, idempotency, logging-redaction, rollback, and operator-approval confirmations.'
    ],
    forbiddenEvidence: [
      'Actual candidate or purchased phone number.',
      'Provider API keys, tokens, client secrets, passwords, SIP credentials, webhook secrets, or live URLs containing secrets.',
      'Invoices, screenshots, receipts, number ownership documents, or copied provider portal documents.',
      'Customer names, customer phone numbers, SMS content, call recordings, transcripts, or live phone/SMS payloads.',
      'Personal, Bell Fibe, RosieDazzlers, or DevilnDove existing numbers.',
      'Any instruction to enable live phone webhooks, SMS sending, call recording, AI drafts, or AI auto-send.'
    ],
    requiredEnvironmentNames: [
      'PHONE_SMS_CONNECTION_READINESS_STATUS',
      'PHONE_SMS_PURCHASE_EVIDENCE_STATUS',
      'PHONE_SMS_TEST_PROVIDER',
      'PHONE_SMS_TEST_NUMBER_TARGET_USE',
      'PHONE_SMS_PURCHASED_NUMBER_ALIAS_LABEL',
      'PHONE_SMS_PURCHASED_NUMBER_STORAGE_LOCATION',
      'PHONE_SMS_CREDENTIAL_STORAGE_LOCATION',
      'PHONE_SMS_WEBHOOK_SECRET_STORAGE_LOCATION',
      'PHONE_SMS_CONNECTION_MODE',
      'PHONE_SMS_CONNECTION_DEPLOYMENT_TARGET',
      'PHONE_SMS_DRY_RUN_ROUTE_LABEL',
      'PHONE_SMS_ACTUAL_CAPABILITY',
      'PHONE_SMS_PROVIDER_PORTAL_ACCESS_CONFIRMED',
      'PHONE_SMS_PROVIDER_CONNECTION_SETTINGS_REVIEWED',
      'PHONE_SMS_WEBHOOK_ENDPOINT_DRAFTED',
      'PHONE_SMS_ALLOWED_ORIGINS_REVIEWED',
      'PHONE_SMS_RATE_LIMIT_PLAN_REVIEWED',
      'PHONE_SMS_IDEMPOTENCY_PLAN_REVIEWED',
      'PHONE_SMS_LOGGING_REDACTION_PLAN_REVIEWED',
      'PHONE_SMS_ROLLBACK_PLAN_REVIEWED',
      'PHONE_SMS_OPERATOR_APPROVED_DRY_RUN_PLAN',
      'PHONE_SMS_TEST_NUMBER_PURCHASED',
      'PHONE_SMS_EXISTING_NUMBERS_PROTECTED',
      'TELEPHONY_PROVIDER',
      'TELEPHONY_WEBHOOK_SECRET',
      'SMS_WEBHOOK_SECRET',
      'ENABLE_PHONE_WEBHOOKS',
      'ENABLE_SMS',
      'ENABLE_CALL_RECORDING',
      'ENABLE_AI_DRAFTS',
      'ENABLE_AI_AUTO_SEND'
    ],
    nextSafeAction: disabledDryRunPlanAllowed
      ? 'Proceed to QL-027 disabled dry-run connection planning without enabling live phone/SMS features.'
      : 'Complete connection-readiness blockers while keeping live phone/SMS disabled.',
    nextBuild: 'QL-027 — Phone/SMS Disabled Dry-Run Connection Plan'
  };
}
