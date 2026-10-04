// QL-024 Phone/SMS Test Number Purchase Review Gate
//
// Provider-neutral review gate for deciding whether one new disposable phone/SMS test number
// may be purchased manually outside the repository. This helper does not buy a number, does not
// store provider credentials, does not store the actual phone number, and does not enable webhooks.

export type PhoneSmsPurchaseReviewProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';
export type PhoneSmsPurchaseReviewTargetUse = 'rosiedazzlers' | 'devilndove' | 'shared_hub' | 'undecided';
export type PhoneSmsPurchaseReviewCredentialStorage = 'password_manager' | 'deployment_secret_store' | 'not_applicable' | 'undecided';
export type PhoneSmsPurchaseReviewCapability = 'voice_only' | 'sms_capable' | 'voice_and_sms' | 'undecided';
export type PhoneSmsPurchaseReviewStatus =
  | 'blocked_pending_purchase_review'
  | 'approved_for_manual_purchase';

export interface PhoneSmsPurchaseReviewSafetyFlags {
  existingNumbersProtected: boolean;
  portExistingNumbers: false;
  forwardExistingNumbers: false;
  enablePhoneWebhooks: false;
  enableSms: false;
  enableCallRecording: false;
  enableAiAutoSend: false;
  testNumberPurchased: boolean;
}

export interface PhoneSmsPurchaseReviewRedactionConfirmations {
  noProviderApiKeys: boolean;
  noSipCredentials: boolean;
  noWebhookSecrets: boolean;
  noPhoneNumberOwnershipDocuments: boolean;
  noInvoicesOrScreenshots: boolean;
  noCustomerData: boolean;
  noPersonalOrExistingPhoneNumbers: boolean;
  noActualCandidatePhoneNumber: boolean;
}

export interface PhoneSmsTestNumberPurchaseReviewInput {
  manualSetupEvidenceComplete: boolean;
  selectedProvider: PhoneSmsPurchaseReviewProvider;
  targetUse: PhoneSmsPurchaseReviewTargetUse;
  budgetApprovedCadMonthly: number | null;
  accountCreatedOutsideRepository: boolean;
  accountReferenceLabel: string | null;
  credentialStorageLocation: PhoneSmsPurchaseReviewCredentialStorage;
  providerPortalReviewed: boolean;
  numberAvailabilityReviewed: boolean;
  smsComplianceReviewed: boolean;
  setupEvidenceStoredOutsideRepository: boolean;
  candidateNumberRegionLabel: string | null;
  expectedCapability: PhoneSmsPurchaseReviewCapability;
  canadianNumberRequired: boolean;
  estimatedMonthlyCostCad: number | null;
  estimatedSetupCostCad: number | null;
  purchaseApprovedByOwner: boolean;
  purchaseNotes: string[];
  redactionConfirmations: PhoneSmsPurchaseReviewRedactionConfirmations;
  safetyFlags: PhoneSmsPurchaseReviewSafetyFlags;
}

export interface PhoneSmsTestNumberPurchaseReviewGate {
  build: 'QL-024';
  title: 'Phone/SMS Test Number Purchase Review Gate';
  decisionFrom: 'QL-021';
  setupGateFrom: 'QL-022';
  evidenceGateFrom: 'QL-023';
  selectedApproach: 'new_test_number_first';
  reviewStatus: PhoneSmsPurchaseReviewStatus;
  purchaseReview: PhoneSmsTestNumberPurchaseReviewInput;
  reviewComplete: boolean;
  manualPurchaseAllowed: boolean;
  productionSafe: boolean;
  blockers: string[];
  allowedManualActionsAfterApproval: string[];
  forbiddenActions: string[];
  requiredEnvironmentNames: string[];
  nextSafeAction: string;
  nextBuild: 'QL-025 — Phone/SMS Test Number Purchase Evidence Intake';
}

export const phoneSmsPurchaseReviewDefaults: PhoneSmsTestNumberPurchaseReviewInput = {
  manualSetupEvidenceComplete: false,
  selectedProvider: 'undecided',
  targetUse: 'undecided',
  budgetApprovedCadMonthly: null,
  accountCreatedOutsideRepository: false,
  accountReferenceLabel: null,
  credentialStorageLocation: 'undecided',
  providerPortalReviewed: false,
  numberAvailabilityReviewed: false,
  smsComplianceReviewed: false,
  setupEvidenceStoredOutsideRepository: false,
  candidateNumberRegionLabel: null,
  expectedCapability: 'undecided',
  canadianNumberRequired: true,
  estimatedMonthlyCostCad: null,
  estimatedSetupCostCad: null,
  purchaseApprovedByOwner: false,
  purchaseNotes: [],
  redactionConfirmations: {
    noProviderApiKeys: true,
    noSipCredentials: true,
    noWebhookSecrets: true,
    noPhoneNumberOwnershipDocuments: true,
    noInvoicesOrScreenshots: true,
    noCustomerData: true,
    noPersonalOrExistingPhoneNumbers: true,
    noActualCandidatePhoneNumber: true
  },
  safetyFlags: {
    existingNumbersProtected: true,
    portExistingNumbers: false,
    forwardExistingNumbers: false,
    enablePhoneWebhooks: false,
    enableSms: false,
    enableCallRecording: false,
    enableAiAutoSend: false,
    testNumberPurchased: false
  }
};

const forbiddenPurchaseEvidenceWords = [
  'api key',
  'apikey',
  'auth token',
  'bearer ',
  'client secret',
  'invoice',
  'password',
  'secret',
  'sip password',
  'screenshot',
  'token',
  'webhook secret'
];

function containsForbiddenText(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return forbiddenPurchaseEvidenceWords.some((word) => normalized.includes(word));
}

function containsPhoneLikeNumber(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

function getPurchaseReviewBlockers(input: PhoneSmsTestNumberPurchaseReviewInput): string[] {
  const blockers: string[] = [];

  if (!input.manualSetupEvidenceComplete) {
    blockers.push('Complete QL-023 non-secret manual setup evidence before purchase review.');
  }

  if (input.selectedProvider === 'undecided') {
    blockers.push('Confirm exactly one provider for the first test number: voipms, telnyx, or twilio.');
  }

  if (input.targetUse === 'undecided') {
    blockers.push('Confirm the first target use: RosieDazzlers, DevilnDove, or shared hub testing.');
  }

  if (input.budgetApprovedCadMonthly === null || input.budgetApprovedCadMonthly <= 0) {
    blockers.push('Confirm the approved monthly/pay-as-you-go CAD test budget.');
  }

  if (!input.accountCreatedOutsideRepository) {
    blockers.push('Confirm the provider account exists outside the repository.');
  }

  if (!input.accountReferenceLabel || input.accountReferenceLabel.trim().length === 0) {
    blockers.push('Record a non-secret provider account reference label.');
  }

  if (input.credentialStorageLocation === 'undecided') {
    blockers.push('Confirm where credentials are stored without committing credential values.');
  }

  if (!input.providerPortalReviewed) {
    blockers.push('Confirm provider portal purchase screen review.');
  }

  if (!input.numberAvailabilityReviewed) {
    blockers.push('Confirm Canadian test-number availability review.');
  }

  if (!input.smsComplianceReviewed) {
    blockers.push('Confirm SMS/compliance review before buying any SMS-capable number.');
  }

  if (!input.setupEvidenceStoredOutsideRepository) {
    blockers.push('Confirm screenshots, invoices, ownership proof, and provider documents are stored outside the repository.');
  }

  if (!input.candidateNumberRegionLabel || input.candidateNumberRegionLabel.trim().length === 0) {
    blockers.push('Record only a non-secret region/type label for the candidate number, not the actual number.');
  }

  if (input.expectedCapability === 'undecided') {
    blockers.push('Confirm expected capability: voice_only, sms_capable, or voice_and_sms.');
  }

  if (!input.canadianNumberRequired) {
    blockers.push('The first test number must remain a Canadian test-number review.');
  }

  if (input.estimatedMonthlyCostCad === null || input.estimatedMonthlyCostCad < 0) {
    blockers.push('Record the estimated monthly CAD cost as a non-negative number.');
  }

  if (input.estimatedSetupCostCad === null || input.estimatedSetupCostCad < 0) {
    blockers.push('Record the estimated one-time/setup CAD cost as a non-negative number.');
  }

  if (
    input.budgetApprovedCadMonthly !== null
    && input.estimatedMonthlyCostCad !== null
    && input.estimatedMonthlyCostCad > input.budgetApprovedCadMonthly
  ) {
    blockers.push('Estimated monthly cost exceeds approved CAD test budget.');
  }

  if (!input.purchaseApprovedByOwner) {
    blockers.push('Owner approval is required before one manual test-number purchase.');
  }

  if (!input.safetyFlags.existingNumbersProtected) {
    blockers.push('Existing business, personal, Bell Fibe, RosieDazzlers, and DevilnDove numbers must remain protected.');
  }

  if (input.safetyFlags.testNumberPurchased) {
    blockers.push('Do not mark the test number purchased in QL-024; purchase evidence belongs in QL-025.');
  }

  if (
    input.safetyFlags.portExistingNumbers
    || input.safetyFlags.forwardExistingNumbers
    || input.safetyFlags.enablePhoneWebhooks
    || input.safetyFlags.enableSms
    || input.safetyFlags.enableCallRecording
    || input.safetyFlags.enableAiAutoSend
  ) {
    blockers.push('Porting, forwarding, phone webhooks, SMS, call recording, and AI auto-send must remain disabled.');
  }

  const redactionValues = Object.values(input.redactionConfirmations);
  if (redactionValues.some((confirmed) => confirmed !== true)) {
    blockers.push('Confirm no secrets, documents, screenshots, customer data, existing numbers, or actual candidate number are recorded.');
  }

  const reviewText = [
    input.accountReferenceLabel,
    input.candidateNumberRegionLabel,
    ...input.purchaseNotes
  ];

  if (reviewText.some(containsForbiddenText)) {
    blockers.push('Remove secret-like or document-like text from account labels, region labels, and purchase notes.');
  }

  if (reviewText.some(containsPhoneLikeNumber)) {
    blockers.push('Remove actual or phone-like numbers from repository purchase-review text.');
  }

  return blockers;
}

export function getPhoneSmsTestNumberPurchaseReviewGate(
  overrides: Partial<PhoneSmsTestNumberPurchaseReviewInput> = {}
): PhoneSmsTestNumberPurchaseReviewGate {
  const purchaseReview: PhoneSmsTestNumberPurchaseReviewInput = {
    ...phoneSmsPurchaseReviewDefaults,
    ...overrides,
    redactionConfirmations: {
      ...phoneSmsPurchaseReviewDefaults.redactionConfirmations,
      ...overrides.redactionConfirmations
    },
    safetyFlags: {
      ...phoneSmsPurchaseReviewDefaults.safetyFlags,
      ...overrides.safetyFlags
    }
  };

  const blockers = getPurchaseReviewBlockers(purchaseReview);
  const reviewComplete = blockers.length === 0;
  const productionSafe = purchaseReview.safetyFlags.existingNumbersProtected
    && !purchaseReview.safetyFlags.portExistingNumbers
    && !purchaseReview.safetyFlags.forwardExistingNumbers
    && !purchaseReview.safetyFlags.enablePhoneWebhooks
    && !purchaseReview.safetyFlags.enableSms
    && !purchaseReview.safetyFlags.enableCallRecording
    && !purchaseReview.safetyFlags.enableAiAutoSend
    && !purchaseReview.safetyFlags.testNumberPurchased;
  const manualPurchaseAllowed = reviewComplete && productionSafe;

  return {
    build: 'QL-024',
    title: 'Phone/SMS Test Number Purchase Review Gate',
    decisionFrom: 'QL-021',
    setupGateFrom: 'QL-022',
    evidenceGateFrom: 'QL-023',
    selectedApproach: 'new_test_number_first',
    reviewStatus: manualPurchaseAllowed
      ? 'approved_for_manual_purchase'
      : 'blocked_pending_purchase_review',
    purchaseReview,
    reviewComplete,
    manualPurchaseAllowed,
    productionSafe,
    blockers,
    allowedManualActionsAfterApproval: [
      'Manually purchase one new disposable Canadian test number in the chosen provider portal.',
      'Store purchase proof, invoices, screenshots, and number ownership evidence outside this repository.',
      'Record only redacted non-secret purchase evidence in the next build.',
      'Keep phone/SMS webhooks, SMS sending, call recording, and AI auto-send disabled after purchase.'
    ],
    forbiddenActions: [
      'Do not commit the actual purchased phone number.',
      'Do not commit provider API keys, SIP credentials, tokens, passwords, webhook secrets, screenshots, invoices, or ownership documents.',
      'Do not port any existing number.',
      'Do not forward any existing number.',
      'Do not enable phone webhooks, SMS sending, call recording, or AI auto-send.',
      'Do not connect live website forms or real customer data to the phone/SMS path yet.'
    ],
    requiredEnvironmentNames: [
      'PHONE_SMS_PURCHASE_REVIEW_GATE_STATUS',
      'PHONE_SMS_TEST_PROVIDER',
      'PHONE_SMS_TEST_NUMBER_TARGET_USE',
      'PHONE_SMS_TEST_BUDGET_CAD_MONTHLY',
      'PHONE_SMS_TEST_ACCOUNT_CREATED',
      'PHONE_SMS_TEST_ACCOUNT_REFERENCE_LABEL',
      'PHONE_SMS_CREDENTIAL_STORAGE_LOCATION',
      'PHONE_SMS_PROVIDER_PORTAL_REVIEWED',
      'PHONE_SMS_NUMBER_AVAILABILITY_REVIEWED',
      'PHONE_SMS_SMS_COMPLIANCE_REVIEWED',
      'PHONE_SMS_SETUP_EVIDENCE_STORED_OUTSIDE_REPOSITORY',
      'PHONE_SMS_CANDIDATE_NUMBER_REGION_LABEL',
      'PHONE_SMS_EXPECTED_CAPABILITY',
      'PHONE_SMS_ESTIMATED_MONTHLY_COST_CAD',
      'PHONE_SMS_ESTIMATED_SETUP_COST_CAD',
      'PHONE_SMS_PURCHASE_APPROVED_BY_OWNER',
      'PHONE_SMS_TEST_NUMBER_PURCHASED',
      'PHONE_SMS_EXISTING_NUMBERS_PROTECTED',
      'ENABLE_PHONE_WEBHOOKS',
      'ENABLE_SMS',
      'ENABLE_CALL_RECORDING',
      'ENABLE_AI_AUTO_SEND'
    ],
    nextSafeAction: manualPurchaseAllowed
      ? 'One new test number may be purchased manually, then QL-025 records only redacted purchase evidence.'
      : 'Complete purchase-review blockers while keeping live phone/SMS disabled.',
    nextBuild: 'QL-025 — Phone/SMS Test Number Purchase Evidence Intake'
  };
}
