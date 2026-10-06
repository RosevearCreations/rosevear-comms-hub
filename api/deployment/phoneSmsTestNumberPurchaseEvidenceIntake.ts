// QL-025 Phone/SMS Test Number Purchase Evidence Intake
//
// Provider-neutral intake for recording only redacted, non-secret evidence that one new
// disposable phone/SMS test number was purchased manually outside the repository.
// It does not store the actual purchased number, credentials, screenshots, invoices,
// ownership documents, webhook secrets, live phone/SMS payloads, or customer data.

export type PhoneSmsPurchaseEvidenceProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';
export type PhoneSmsPurchaseEvidenceTargetUse = 'rosiedazzlers' | 'devilndove' | 'shared_hub' | 'undecided';
export type PhoneSmsPurchaseEvidenceCapability = 'voice_only' | 'sms_capable' | 'voice_and_sms' | 'undecided';
export type PhoneSmsPurchaseEvidenceStorageLocation =
  | 'password_manager'
  | 'provider_portal'
  | 'secure_business_records'
  | 'deployment_secret_store'
  | 'undecided';
export type PhoneSmsPurchaseEvidenceStatus =
  | 'blocked_pending_purchase_evidence'
  | 'purchase_evidence_complete_ready_for_connection_review';

export interface PhoneSmsPurchaseEvidenceSafetyFlags {
  existingNumbersProtected: boolean;
  portExistingNumbers: false;
  forwardExistingNumbers: false;
  enablePhoneWebhooks: false;
  enableSms: false;
  enableCallRecording: false;
  enableAiAutoSend: false;
  testNumberPurchased: boolean;
}

export interface PhoneSmsPurchaseEvidenceRedactionConfirmations {
  noActualPurchasedPhoneNumber: boolean;
  noCandidatePhoneNumber: boolean;
  noProviderApiKeys: boolean;
  noSipCredentials: boolean;
  noWebhookSecrets: boolean;
  noPhoneNumberOwnershipDocuments: boolean;
  noInvoicesOrScreenshots: boolean;
  noCustomerData: boolean;
  noPersonalOrExistingPhoneNumbers: boolean;
  purchaseDocumentsStoredOutsideRepository: boolean;
}

export interface PhoneSmsTestNumberPurchaseEvidenceInput {
  purchaseReviewApproved: boolean;
  selectedProvider: PhoneSmsPurchaseEvidenceProvider;
  targetUse: PhoneSmsPurchaseEvidenceTargetUse;
  budgetApprovedCadMonthly: number | null;
  accountReferenceLabel: string | null;
  purchaseCompletedOutsideRepository: boolean;
  purchaseReferenceLabel: string | null;
  purchasedNumberAliasLabel: string | null;
  purchasedNumberStorageLocation: PhoneSmsPurchaseEvidenceStorageLocation;
  purchaseDocumentStorageLocation: PhoneSmsPurchaseEvidenceStorageLocation;
  candidateNumberRegionLabel: string | null;
  actualNumberRegionLabel: string | null;
  expectedCapability: PhoneSmsPurchaseEvidenceCapability;
  actualCapability: PhoneSmsPurchaseEvidenceCapability;
  monthlyCostCad: number | null;
  setupCostCad: number | null;
  purchaseEvidenceNotes: string[];
  redactionConfirmations: PhoneSmsPurchaseEvidenceRedactionConfirmations;
  safetyFlags: PhoneSmsPurchaseEvidenceSafetyFlags;
}

export interface PhoneSmsTestNumberPurchaseEvidenceIntake {
  build: 'QL-025';
  title: 'Phone/SMS Test Number Purchase Evidence Intake';
  decisionFrom: 'QL-021';
  setupGateFrom: 'QL-022';
  manualEvidenceFrom: 'QL-023';
  purchaseReviewFrom: 'QL-024';
  selectedApproach: 'new_test_number_first';
  evidenceStatus: PhoneSmsPurchaseEvidenceStatus;
  purchaseEvidence: PhoneSmsTestNumberPurchaseEvidenceInput;
  evidenceComplete: boolean;
  productionSafe: boolean;
  connectionReviewAllowed: boolean;
  blockers: string[];
  acceptedEvidence: string[];
  forbiddenEvidence: string[];
  requiredEnvironmentNames: string[];
  nextSafeAction: string;
  nextBuild: 'QL-026 — Phone/SMS Test Number Connection Readiness Gate';
}

export const phoneSmsPurchaseEvidenceDefaults: PhoneSmsTestNumberPurchaseEvidenceInput = {
  purchaseReviewApproved: false,
  selectedProvider: 'undecided',
  targetUse: 'undecided',
  budgetApprovedCadMonthly: null,
  accountReferenceLabel: null,
  purchaseCompletedOutsideRepository: false,
  purchaseReferenceLabel: null,
  purchasedNumberAliasLabel: null,
  purchasedNumberStorageLocation: 'undecided',
  purchaseDocumentStorageLocation: 'undecided',
  candidateNumberRegionLabel: null,
  actualNumberRegionLabel: null,
  expectedCapability: 'undecided',
  actualCapability: 'undecided',
  monthlyCostCad: null,
  setupCostCad: null,
  purchaseEvidenceNotes: [],
  redactionConfirmations: {
    noActualPurchasedPhoneNumber: true,
    noCandidatePhoneNumber: true,
    noProviderApiKeys: true,
    noSipCredentials: true,
    noWebhookSecrets: true,
    noPhoneNumberOwnershipDocuments: true,
    noInvoicesOrScreenshots: true,
    noCustomerData: true,
    noPersonalOrExistingPhoneNumbers: true,
    purchaseDocumentsStoredOutsideRepository: false
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

function getPurchaseEvidenceBlockers(input: PhoneSmsTestNumberPurchaseEvidenceInput): string[] {
  const blockers: string[] = [];

  if (!input.purchaseReviewApproved) {
    blockers.push('Complete QL-024 purchase review approval before purchase evidence intake.');
  }

  if (input.selectedProvider === 'undecided') {
    blockers.push('Record the provider used for the manual purchase: voipms, telnyx, or twilio.');
  }

  if (input.targetUse === 'undecided') {
    blockers.push('Record the first target use: RosieDazzlers, DevilnDove, or shared hub testing.');
  }

  if (input.budgetApprovedCadMonthly === null || input.budgetApprovedCadMonthly <= 0) {
    blockers.push('Record the approved monthly/pay-as-you-go CAD test budget.');
  }

  if (!input.accountReferenceLabel || input.accountReferenceLabel.trim().length === 0) {
    blockers.push('Record a non-secret provider account reference label.');
  }

  if (!input.purchaseCompletedOutsideRepository) {
    blockers.push('Confirm the test number was purchased manually outside repository code.');
  }

  if (!input.purchaseReferenceLabel || input.purchaseReferenceLabel.trim().length === 0) {
    blockers.push('Record a non-secret purchase reference label, not an invoice number or document.');
  }

  if (!input.purchasedNumberAliasLabel || input.purchasedNumberAliasLabel.trim().length === 0) {
    blockers.push('Record a non-secret alias for the purchased test number without the number itself.');
  }

  if (input.purchasedNumberStorageLocation === 'undecided') {
    blockers.push('Record where the actual purchased number is stored outside this repository.');
  }

  if (input.purchaseDocumentStorageLocation === 'undecided') {
    blockers.push('Record where invoices, screenshots, and ownership documents are stored outside this repository.');
  }

  if (!input.candidateNumberRegionLabel || input.candidateNumberRegionLabel.trim().length === 0) {
    blockers.push('Record the candidate-number region/type label without the actual candidate number.');
  }

  if (!input.actualNumberRegionLabel || input.actualNumberRegionLabel.trim().length === 0) {
    blockers.push('Record the purchased-number region/type label without the actual purchased number.');
  }

  if (input.expectedCapability === 'undecided') {
    blockers.push('Record the expected capability from QL-024: voice_only, sms_capable, or voice_and_sms.');
  }

  if (input.actualCapability === 'undecided') {
    blockers.push('Record the purchased number capability: voice_only, sms_capable, or voice_and_sms.');
  }

  if (input.monthlyCostCad === null || input.monthlyCostCad < 0) {
    blockers.push('Record the monthly CAD cost as a non-negative number.');
  }

  if (input.setupCostCad === null || input.setupCostCad < 0) {
    blockers.push('Record the one-time/setup CAD cost as a non-negative number.');
  }

  if (
    input.budgetApprovedCadMonthly !== null
    && input.monthlyCostCad !== null
    && input.monthlyCostCad > input.budgetApprovedCadMonthly
  ) {
    blockers.push('Monthly cost exceeds approved CAD test budget.');
  }

  if (!input.safetyFlags.testNumberPurchased) {
    blockers.push('Confirm exactly one new test number was manually purchased.');
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
    || input.safetyFlags.enableAiAutoSend
  ) {
    blockers.push('Porting, forwarding, phone webhooks, SMS sending, call recording, and AI auto-send must remain disabled.');
  }

  const redactionValues = Object.values(input.redactionConfirmations);
  if (redactionValues.some((confirmed) => confirmed !== true)) {
    blockers.push('Confirm no numbers, secrets, documents, invoices, screenshots, customer data, or existing numbers are included.');
  }

  const evidenceText = [
    input.accountReferenceLabel,
    input.purchaseReferenceLabel,
    input.purchasedNumberAliasLabel,
    input.candidateNumberRegionLabel,
    input.actualNumberRegionLabel,
    ...input.purchaseEvidenceNotes
  ];

  if (evidenceText.some(containsForbiddenText)) {
    blockers.push('Remove secret-like or document-like text from purchase evidence labels and notes.');
  }

  if (evidenceText.some(containsPhoneLikeNumber)) {
    blockers.push('Remove actual or phone-like numbers from repository purchase evidence.');
  }

  return blockers;
}

export function getPhoneSmsTestNumberPurchaseEvidenceIntake(
  overrides: Partial<PhoneSmsTestNumberPurchaseEvidenceInput> = {}
): PhoneSmsTestNumberPurchaseEvidenceIntake {
  const purchaseEvidence: PhoneSmsTestNumberPurchaseEvidenceInput = {
    ...phoneSmsPurchaseEvidenceDefaults,
    ...overrides,
    redactionConfirmations: {
      ...phoneSmsPurchaseEvidenceDefaults.redactionConfirmations,
      ...overrides.redactionConfirmations
    },
    safetyFlags: {
      ...phoneSmsPurchaseEvidenceDefaults.safetyFlags,
      ...overrides.safetyFlags
    }
  };

  const blockers = getPurchaseEvidenceBlockers(purchaseEvidence);
  const evidenceComplete = blockers.length === 0;
  const productionSafe = purchaseEvidence.safetyFlags.existingNumbersProtected
    && !purchaseEvidence.safetyFlags.portExistingNumbers
    && !purchaseEvidence.safetyFlags.forwardExistingNumbers
    && !purchaseEvidence.safetyFlags.enablePhoneWebhooks
    && !purchaseEvidence.safetyFlags.enableSms
    && !purchaseEvidence.safetyFlags.enableCallRecording
    && !purchaseEvidence.safetyFlags.enableAiAutoSend;
  const connectionReviewAllowed = evidenceComplete && productionSafe;

  return {
    build: 'QL-025',
    title: 'Phone/SMS Test Number Purchase Evidence Intake',
    decisionFrom: 'QL-021',
    setupGateFrom: 'QL-022',
    manualEvidenceFrom: 'QL-023',
    purchaseReviewFrom: 'QL-024',
    selectedApproach: 'new_test_number_first',
    evidenceStatus: connectionReviewAllowed
      ? 'purchase_evidence_complete_ready_for_connection_review'
      : 'blocked_pending_purchase_evidence',
    purchaseEvidence,
    evidenceComplete,
    productionSafe,
    connectionReviewAllowed,
    blockers,
    acceptedEvidence: [
      'Selected provider name: voipms, telnyx, or twilio.',
      'Target use: RosieDazzlers, DevilnDove, or shared hub testing.',
      'Approved CAD budget and actual CAD costs as numbers only.',
      'Non-secret provider account reference label.',
      'Non-secret purchase reference label that is not an invoice number.',
      'Non-secret purchased-number alias label without the actual phone number.',
      'Storage location labels for the actual number and purchase documents.',
      'Region/type labels for candidate and purchased number without the actual number.',
      'Boolean redaction and safety confirmations.'
    ],
    forbiddenEvidence: [
      'Actual candidate or purchased phone number.',
      'Provider API keys, tokens, client secrets, passwords, SIP credentials, or webhook secrets.',
      'Invoices, screenshots, receipts, number ownership documents, or copied provider portal details.',
      'Customer names, customer phone numbers, SMS content, call recordings, transcripts, or live payloads.',
      'Personal, Bell Fibe, RosieDazzlers, or DevilnDove existing numbers.',
      'Any instruction to enable phone webhooks, SMS sending, call recording, or AI auto-send.'
    ],
    requiredEnvironmentNames: [
      'PHONE_SMS_PURCHASE_EVIDENCE_STATUS',
      'PHONE_SMS_PURCHASE_REVIEW_GATE_STATUS',
      'PHONE_SMS_TEST_PROVIDER',
      'PHONE_SMS_TEST_NUMBER_TARGET_USE',
      'PHONE_SMS_TEST_BUDGET_CAD_MONTHLY',
      'PHONE_SMS_TEST_ACCOUNT_REFERENCE_LABEL',
      'PHONE_SMS_PURCHASE_COMPLETED_OUTSIDE_REPOSITORY',
      'PHONE_SMS_PURCHASE_REFERENCE_LABEL',
      'PHONE_SMS_PURCHASED_NUMBER_ALIAS_LABEL',
      'PHONE_SMS_PURCHASED_NUMBER_STORAGE_LOCATION',
      'PHONE_SMS_PURCHASE_DOCUMENT_STORAGE_LOCATION',
      'PHONE_SMS_ACTUAL_NUMBER_REGION_LABEL',
      'PHONE_SMS_ACTUAL_CAPABILITY',
      'PHONE_SMS_MONTHLY_COST_CAD',
      'PHONE_SMS_SETUP_COST_CAD',
      'PHONE_SMS_TEST_NUMBER_PURCHASED',
      'PHONE_SMS_EXISTING_NUMBERS_PROTECTED',
      'ENABLE_PHONE_WEBHOOKS',
      'ENABLE_SMS',
      'ENABLE_CALL_RECORDING',
      'ENABLE_AI_AUTO_SEND'
    ],
    nextSafeAction: connectionReviewAllowed
      ? 'Proceed to QL-026 connection readiness review without enabling live phone/SMS features.'
      : 'Collect only redacted purchase evidence while keeping live phone/SMS disabled.',
    nextBuild: 'QL-026 — Phone/SMS Test Number Connection Readiness Gate'
  };
}
