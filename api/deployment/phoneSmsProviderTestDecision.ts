// QL-021 Phone/SMS Provider Test Decision
//
// Decision helper for the first safe phone/SMS experiment.
// It does not connect a provider, does not port or forward existing numbers, and does not enable phone/SMS webhooks.

export type PhoneSmsProviderId = 'voipms' | 'telnyx' | 'twilio' | 'freepbx_asterisk' | '3cx';
export type ProviderFit = 'candidate' | 'pbx_candidate' | 'defer';
export type SetupState = 'not_started' | 'manual_setup_required' | 'ready_for_test_number_review';

export interface PhoneSmsProviderCandidate {
  id: PhoneSmsProviderId;
  label: string;
  fit: ProviderFit;
  role: string;
  currentDecision: 'compare_only' | 'shortlist' | 'not_first';
  notes: string[];
}

export interface PhoneSmsProviderTestDecision {
  build: 'QL-021';
  selectedApproach: 'new_test_number_first';
  selectedProvider: null;
  setupState: SetupState;
  existingNumbersProtected: boolean;
  portExistingNumbers: false;
  forwardExistingNumbers: false;
  enablePhoneWebhooks: false;
  enableSms: false;
  enableCallRecording: false;
  candidateOrder: PhoneSmsProviderCandidate[];
  requiredBeforeSetup: string[];
  nextBuild: 'QL-022 — Phone/SMS Test Number Setup Gate';
}

export const phoneSmsProviderCandidates: PhoneSmsProviderCandidate[] = [
  {
    id: 'voipms',
    label: 'VoIP.ms',
    fit: 'candidate',
    role: 'Canadian-friendly VoIP/SMS test-number candidate to investigate first for low-risk DID testing.',
    currentDecision: 'shortlist',
    notes: [
      'Evaluate new DID purchase, SMS/MMS support, webhook/API fit, and manual portal workflow.',
      'Do not port or forward existing Bell/cell numbers during this decision build.'
    ]
  },
  {
    id: 'telnyx',
    label: 'Telnyx',
    fit: 'candidate',
    role: 'API-first voice/SMS test-number candidate for webhook-heavy testing.',
    currentDecision: 'shortlist',
    notes: [
      'Evaluate Canadian number availability, messaging registration/compliance, API fit, and cost controls.',
      'Do not connect public website forms or live customer automation.'
    ]
  },
  {
    id: 'twilio',
    label: 'Twilio',
    fit: 'candidate',
    role: 'API-first voice/SMS test-number candidate with strong developer tooling.',
    currentDecision: 'shortlist',
    notes: [
      'Evaluate Canadian number availability, toll-free/local messaging rules, verification needs, and cost controls.',
      'Use only a new test number for the first experiment.'
    ]
  },
  {
    id: 'freepbx_asterisk',
    label: 'FreePBX/Asterisk',
    fit: 'pbx_candidate',
    role: 'Open PBX candidate for later SIP routing and advanced call-control experiments.',
    currentDecision: 'not_first',
    notes: [
      'Requires more infrastructure and operations work than the first test-number decision should carry.',
      'May still be valuable after a provider test number proves the hub workflow.'
    ]
  },
  {
    id: '3cx',
    label: '3CX',
    fit: 'pbx_candidate',
    role: 'Managed PBX candidate for later softphone, routing, and operator workflow testing.',
    currentDecision: 'not_first',
    notes: [
      'Useful to compare after the basic provider-neutral intake and call-log model is proven.',
      'Do not adopt before licensing/API/SMS integration fit is reviewed.'
    ]
  }
];

export function getPhoneSmsProviderTestDecision(): PhoneSmsProviderTestDecision {
  return {
    build: 'QL-021',
    selectedApproach: 'new_test_number_first',
    selectedProvider: null,
    setupState: 'manual_setup_required',
    existingNumbersProtected: true,
    portExistingNumbers: false,
    forwardExistingNumbers: false,
    enablePhoneWebhooks: false,
    enableSms: false,
    enableCallRecording: false,
    candidateOrder: phoneSmsProviderCandidates,
    requiredBeforeSetup: [
      'Confirm whether the first test should prioritize RosieDazzlers, DevilnDove, or shared hub validation.',
      'Choose one provider account to create or use for a new test number only.',
      'Confirm the test number budget and acceptable recurring cost.',
      'Confirm SMS compliance/registration requirements for the chosen number type.',
      'Keep all existing business and personal numbers unported and unforwarded.'
    ],
    nextBuild: 'QL-022 — Phone/SMS Test Number Setup Gate'
  };
}
