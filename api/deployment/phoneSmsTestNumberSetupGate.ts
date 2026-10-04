// QL-022 Phone/SMS Test Number Setup Gate
//
// Provider-neutral gate for preparing one new phone/SMS test number.
// It does not buy a number, does not store provider credentials, does not port or forward existing numbers,
// and does not enable phone/SMS webhooks.

export type PhoneSmsTestNumberProvider = 'voipms' | 'telnyx' | 'twilio';
export type PhoneSmsTestNumberTarget = 'rosiedazzlers' | 'devilndove' | 'shared_hub' | 'undecided';
export type PhoneSmsTestNumberSetupState =
  | 'blocked_pending_manual_setup'
  | 'ready_for_manual_provider_setup'
  | 'ready_for_test_number_purchase_review';

export interface PhoneSmsTestNumberManualInputs {
  selectedProvider: PhoneSmsTestNumberProvider | null;
  targetUse: PhoneSmsTestNumberTarget;
  budgetApprovedCadMonthly: number | null;
  accountCreatedOutsideRepository: boolean;
  testNumberPurchasedOutsideRepository: boolean;
  existingNumbersProtected: boolean;
  portExistingNumbers: boolean;
  forwardExistingNumbers: boolean;
  enablePhoneWebhooks: boolean;
  enableSms: boolean;
  enableCallRecording: boolean;
  enableAiAutoSend: boolean;
}

export interface PhoneSmsTestNumberSetupGate {
  build: 'QL-022';
  title: 'Phone/SMS Test Number Setup Gate';
  decisionFrom: 'QL-021';
  selectedApproach: 'new_test_number_first';
  setupState: PhoneSmsTestNumberSetupState;
  manualInputs: PhoneSmsTestNumberManualInputs;
  allowedProviders: PhoneSmsTestNumberProvider[];
  setupAllowed: boolean;
  testNumberPurchaseAllowed: boolean;
  productionSafe: boolean;
  blockers: string[];
  requiredManualSteps: string[];
  forbiddenActions: string[];
  requiredEnvironmentNames: string[];
  nextBuild: 'QL-023 — Phone/SMS Test Number Manual Setup Evidence Intake';
}

export const phoneSmsAllowedTestNumberProviders: PhoneSmsTestNumberProvider[] = ['voipms', 'telnyx', 'twilio'];

export const phoneSmsTestNumberSetupGateDefaults: PhoneSmsTestNumberManualInputs = {
  selectedProvider: null,
  targetUse: 'undecided',
  budgetApprovedCadMonthly: null,
  accountCreatedOutsideRepository: false,
  testNumberPurchasedOutsideRepository: false,
  existingNumbersProtected: true,
  portExistingNumbers: false,
  forwardExistingNumbers: false,
  enablePhoneWebhooks: false,
  enableSms: false,
  enableCallRecording: false,
  enableAiAutoSend: false
};

function getSetupBlockers(input: PhoneSmsTestNumberManualInputs): string[] {
  const blockers: string[] = [];

  if (!input.selectedProvider) {
    blockers.push('Choose exactly one first provider for the new test number: voipms, telnyx, or twilio.');
  }

  if (input.targetUse === 'undecided') {
    blockers.push('Choose the first test-number use: RosieDazzlers, DevilnDove, or shared hub testing.');
  }

  if (input.budgetApprovedCadMonthly === null || input.budgetApprovedCadMonthly <= 0) {
    blockers.push('Confirm a small monthly/pay-as-you-go CAD test budget before creating or using the provider account.');
  }

  if (!input.existingNumbersProtected) {
    blockers.push('Existing business, personal, Bell Fibe, RosieDazzlers, and DevilnDove numbers must remain protected.');
  }

  if (input.portExistingNumbers) {
    blockers.push('Porting existing numbers is prohibited during the setup gate.');
  }

  if (input.forwardExistingNumbers) {
    blockers.push('Forwarding existing numbers is prohibited during the setup gate.');
  }

  if (input.enablePhoneWebhooks || input.enableSms || input.enableCallRecording || input.enableAiAutoSend) {
    blockers.push('Phone webhooks, SMS, call recording, and AI auto-send must stay disabled until a later test build.');
  }

  return blockers;
}

export function getPhoneSmsTestNumberSetupGate(
  overrides: Partial<PhoneSmsTestNumberManualInputs> = {}
): PhoneSmsTestNumberSetupGate {
  const manualInputs: PhoneSmsTestNumberManualInputs = {
    ...phoneSmsTestNumberSetupGateDefaults,
    ...overrides
  };
  const blockers = getSetupBlockers(manualInputs);
  const setupAllowed = blockers.length === 0 && !manualInputs.accountCreatedOutsideRepository;
  const testNumberPurchaseAllowed = blockers.length === 0 && manualInputs.accountCreatedOutsideRepository;
  const setupState: PhoneSmsTestNumberSetupState = blockers.length > 0
    ? 'blocked_pending_manual_setup'
    : manualInputs.accountCreatedOutsideRepository
      ? 'ready_for_test_number_purchase_review'
      : 'ready_for_manual_provider_setup';

  return {
    build: 'QL-022',
    title: 'Phone/SMS Test Number Setup Gate',
    decisionFrom: 'QL-021',
    selectedApproach: 'new_test_number_first',
    setupState,
    manualInputs,
    allowedProviders: phoneSmsAllowedTestNumberProviders,
    setupAllowed,
    testNumberPurchaseAllowed,
    productionSafe: manualInputs.existingNumbersProtected
      && !manualInputs.portExistingNumbers
      && !manualInputs.forwardExistingNumbers
      && !manualInputs.enablePhoneWebhooks
      && !manualInputs.enableSms
      && !manualInputs.enableCallRecording
      && !manualInputs.enableAiAutoSend,
    blockers,
    requiredManualSteps: [
      'Pick one provider account to use first: VoIP.ms, Telnyx, or Twilio.',
      'Confirm the first test-number use: RosieDazzlers, DevilnDove, or shared hub testing.',
      'Confirm a small CAD monthly/pay-as-you-go test budget.',
      'Create or use the provider account outside the repository.',
      'Buy only one new disposable test number after budget and provider are confirmed.',
      'Store provider credentials only in the deployment provider or password manager, never in GitHub files or chat.'
    ],
    forbiddenActions: [
      'Do not port any existing number.',
      'Do not forward any existing number.',
      'Do not commit provider tokens, SIP credentials, phone-number ownership documents, or webhook secrets.',
      'Do not enable phone webhooks, SMS, call recording, or AI auto-send.',
      'Do not connect live website forms or real customer data to the phone/SMS path yet.'
    ],
    requiredEnvironmentNames: [
      'PHONE_SMS_TEST_NUMBER_SETUP_GATE_STATUS',
      'PHONE_SMS_TEST_PROVIDER',
      'PHONE_SMS_TEST_NUMBER_TARGET_USE',
      'PHONE_SMS_TEST_BUDGET_CAD_MONTHLY',
      'PHONE_SMS_TEST_ACCOUNT_CREATED',
      'PHONE_SMS_TEST_NUMBER_PURCHASED',
      'PHONE_SMS_EXISTING_NUMBERS_PROTECTED',
      'ENABLE_PHONE_WEBHOOKS',
      'ENABLE_SMS',
      'ENABLE_CALL_RECORDING',
      'ENABLE_AI_AUTO_SEND'
    ],
    nextBuild: 'QL-023 — Phone/SMS Test Number Manual Setup Evidence Intake'
  };
}
