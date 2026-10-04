// QL-023 Phone/SMS Test Number Manual Setup Evidence Intake
//
// Provider-neutral evidence intake for manual phone/SMS test-number setup.
// It records only non-secret setup facts. It does not store credentials, phone-number ownership documents,
// webhook secrets, customer data, or live phone/SMS payloads.

export type PhoneSmsEvidenceProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';
export type PhoneSmsEvidenceTargetUse = 'rosiedazzlers' | 'devilndove' | 'shared_hub' | 'undecided';
export type PhoneSmsCredentialStorageLocation = 'password_manager' | 'deployment_secret_store' | 'not_applicable' | 'undecided';
export type PhoneSmsEvidenceStatus =
  | 'blocked_pending_manual_evidence'
  | 'evidence_complete_ready_for_purchase_review';

export interface PhoneSmsManualSetupSafetyFlags {
  existingNumbersProtected: boolean;
  portExistingNumbers: false;
  forwardExistingNumbers: false;
  enablePhoneWebhooks: false;
  enableSms: false;
  enableCallRecording: false;
  enableAiAutoSend: false;
  testNumberPurchased: boolean;
}

export interface PhoneSmsManualSetupRedactionConfirmations {
  noProviderApiKeys: boolean;
  noSipCredentials: boolean;
  noWebhookSecrets: boolean;
  noPhoneNumberOwnershipDocuments: boolean;
  noCustomerData: boolean;
  noPersonalPhoneNumbers: boolean;
}

export interface PhoneSmsManualSetupEvidenceInput {
  selectedProvider: PhoneSmsEvidenceProvider;
  targetUse: PhoneSmsEvidenceTargetUse;
  budgetApprovedCadMonthly: number | null;
  accountCreatedOutsideRepository: boolean;
  accountReferenceLabel: string | null;
  credentialStorageLocation: PhoneSmsCredentialStorageLocation;
  providerPortalReviewed: boolean;
  numberAvailabilityReviewed: boolean;
  smsComplianceReviewed: boolean;
  setupNotes: string[];
  evidenceStoredOutsideRepository: boolean;
  redactionConfirmations: PhoneSmsManualSetupRedactionConfirmations;
  safetyFlags: PhoneSmsManualSetupSafetyFlags;
}

export interface PhoneSmsManualSetupEvidenceIntake {
  build: 'QL-023';
  title: 'Phone/SMS Test Number Manual Setup Evidence Intake';
  decisionFrom: 'QL-021';
  gateFrom: 'QL-022';
  selectedApproach: 'new_test_number_first';
  evidenceStatus: PhoneSmsEvidenceStatus;
  manualEvidence: PhoneSmsManualSetupEvidenceInput;
  evidenceComplete: boolean;
  productionSafe: boolean;
  purchaseReviewAllowed: boolean;
  blockers: string[];
  acceptedEvidence: string[];
  forbiddenEvidence: string[];
  nextSafeAction: string;
  nextBuild: 'QL-024 — Phone/SMS Test Number Purchase Review Gate';
}

export const phoneSmsManualSetupEvidenceDefaults: PhoneSmsManualSetupEvidenceInput = {
  selectedProvider: 'undecided',
  targetUse: 'undecided',
  budgetApprovedCadMonthly: null,
  accountCreatedOutsideRepository: false,
  accountReferenceLabel: null,
  credentialStorageLocation: 'undecided',
  providerPortalReviewed: false,
  numberAvailabilityReviewed: false,
  smsComplianceReviewed: false,
  setupNotes: [],
  evidenceStoredOutsideRepository: false,
  redactionConfirmations: {
    noProviderApiKeys: true,
    noSipCredentials: true,
    noWebhookSecrets: true,
    noPhoneNumberOwnershipDocuments: true,
    noCustomerData: true,
    noPersonalPhoneNumbers: true
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

const forbiddenEvidenceWords = [
  'api key',
  'apikey',
  'auth token',
  'bearer ',
  'client secret',
  'password',
  'secret',
  'sip password',
  'token',
  'webhook secret'
];

function containsForbiddenEvidence(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return forbiddenEvidenceWords.some((word) => normalized.includes(word));
}

function getEvidenceBlockers(input: PhoneSmsManualSetupEvidenceInput): string[] {
  const blockers: string[] = [];

  if (input.selectedProvider === 'undecided') {
    blockers.push('Record the chosen provider: voipms, telnyx, or twilio.');
  }

  if (input.targetUse === 'undecided') {
    blockers.push('Record the first target use: RosieDazzlers, DevilnDove, or shared hub testing.');
  }

  if (input.budgetApprovedCadMonthly === null || input.budgetApprovedCadMonthly <= 0) {
    blockers.push('Record the approved monthly/pay-as-you-go CAD test budget.');
  }

  if (!input.accountCreatedOutsideRepository) {
    blockers.push('Record whether the provider account was created outside the repository.');
  }

  if (!input.accountReferenceLabel || input.accountReferenceLabel.trim().length === 0) {
    blockers.push('Add a non-secret account reference label, such as provider account nickname or workspace name.');
  }

  if (input.credentialStorageLocation === 'undecided') {
    blockers.push('Record where credentials will be stored without committing the credentials: password manager or deployment secret store.');
  }

  if (!input.providerPortalReviewed) {
    blockers.push('Record that the provider portal setup screen was reviewed.');
  }

  if (!input.numberAvailabilityReviewed) {
    blockers.push('Record that Canadian test-number availability was reviewed.');
  }

  if (!input.smsComplianceReviewed) {
    blockers.push('Record that SMS/compliance requirements were reviewed before messaging is tested.');
  }

  if (!input.evidenceStoredOutsideRepository) {
    blockers.push('Store screenshots, invoices, ownership proof, or provider documents outside this repository.');
  }

  if (!input.safetyFlags.existingNumbersProtected) {
    blockers.push('Existing business, personal, Bell Fibe, RosieDazzlers, and DevilnDove numbers must remain protected.');
  }

  if (input.safetyFlags.testNumberPurchased) {
    blockers.push('Do not mark a number purchased until the later purchase review gate is complete.');
  }

  if (containsForbiddenEvidence(input.accountReferenceLabel) || input.setupNotes.some(containsForbiddenEvidence)) {
    blockers.push('Remove secret-like content from account reference labels and setup notes.');
  }

  const redactionValues = Object.values(input.redactionConfirmations);
  if (redactionValues.some((confirmed) => confirmed !== true)) {
    blockers.push('Confirm no API keys, SIP credentials, webhook secrets, ownership documents, customer data, or personal phone numbers are included.');
  }

  return blockers;
}

export function getPhoneSmsManualSetupEvidenceIntake(
  overrides: Partial<PhoneSmsManualSetupEvidenceInput> = {}
): PhoneSmsManualSetupEvidenceIntake {
  const manualEvidence: PhoneSmsManualSetupEvidenceInput = {
    ...phoneSmsManualSetupEvidenceDefaults,
    ...overrides,
    redactionConfirmations: {
      ...phoneSmsManualSetupEvidenceDefaults.redactionConfirmations,
      ...overrides.redactionConfirmations
    },
    safetyFlags: {
      ...phoneSmsManualSetupEvidenceDefaults.safetyFlags,
      ...overrides.safetyFlags
    }
  };

  const blockers = getEvidenceBlockers(manualEvidence);
  const evidenceComplete = blockers.length === 0;
  const productionSafe = manualEvidence.safetyFlags.existingNumbersProtected
    && !manualEvidence.safetyFlags.portExistingNumbers
    && !manualEvidence.safetyFlags.forwardExistingNumbers
    && !manualEvidence.safetyFlags.enablePhoneWebhooks
    && !manualEvidence.safetyFlags.enableSms
    && !manualEvidence.safetyFlags.enableCallRecording
    && !manualEvidence.safetyFlags.enableAiAutoSend
    && !manualEvidence.safetyFlags.testNumberPurchased;

  return {
    build: 'QL-023',
    title: 'Phone/SMS Test Number Manual Setup Evidence Intake',
    decisionFrom: 'QL-021',
    gateFrom: 'QL-022',
    selectedApproach: 'new_test_number_first',
    evidenceStatus: evidenceComplete
      ? 'evidence_complete_ready_for_purchase_review'
      : 'blocked_pending_manual_evidence',
    manualEvidence,
    evidenceComplete,
    productionSafe,
    purchaseReviewAllowed: evidenceComplete && productionSafe,
    blockers,
    acceptedEvidence: [
      'Selected provider name: voipms, telnyx, or twilio.',
      'Target use: RosieDazzlers, DevilnDove, or shared hub testing.',
      'Approved CAD test budget as a number only.',
      'Non-secret provider account reference label.',
      'Credential storage location label without the credential value.',
      'Plain-language setup notes with secrets removed.',
      'Boolean confirmations that portal, availability, and compliance were reviewed.'
    ],
    forbiddenEvidence: [
      'Provider API keys, tokens, client secrets, or passwords.',
      'SIP usernames, SIP passwords, or trunk credentials.',
      'Webhook secrets or signing secrets.',
      'Phone-number ownership documents, invoices, or screenshots.',
      'Customer names, phone numbers, SMS content, call recordings, or transcripts.',
      'Personal, Bell Fibe, RosieDazzlers, or DevilnDove existing numbers.'
    ],
    nextSafeAction: evidenceComplete
      ? 'Proceed to QL-024 purchase review gate without enabling live webhooks.'
      : 'Collect only non-secret manual setup evidence and keep live phone/SMS disabled.',
    nextBuild: 'QL-024 — Phone/SMS Test Number Purchase Review Gate'
  };
}
