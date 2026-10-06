// QL-029 Phone/SMS Disabled Dry-Run Evidence Mapping Review
//
// Provider-neutral evidence mapping review for synthetic phone/SMS dry-run events.
// This helper maps synthetic runtime evidence into contact, conversation, and task
// preview shapes only. It does not configure provider webhooks, does not enable
// live phone/SMS behavior, does not persist customer data, and does not store
// actual phone numbers, provider credentials, webhook secret values, live payloads,
// call recordings, transcripts, invoices, screenshots, or ownership documents.

export type PhoneSmsEvidenceMappingStatus =
  | 'blocked_pending_evidence_mapping_review'
  | 'evidence_mapping_review_ready'
  | 'evidence_mapping_review_green';

export type PhoneSmsEvidenceChannel = 'voice' | 'sms';
export type PhoneSmsEvidenceProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';
export type PhoneSmsEvidencePriority = 'normal' | 'human_review_required';

export interface PhoneSmsEvidenceMappingEnvironment {
  PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS?: string;
  PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS?: string;
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED?: string;
  PHONE_SMS_EVIDENCE_MAPPING_SYNTHETIC_ONLY?: string;
  PHONE_SMS_EVIDENCE_MAPPING_NO_PERSISTENCE_WRITES?: string;
  PHONE_SMS_EVIDENCE_MAPPING_LIVE_CUSTOMER_ACCESS_DISABLED?: string;
  PHONE_SMS_EVIDENCE_MAPPING_CONTACT_SHAPE_REVIEWED?: string;
  PHONE_SMS_EVIDENCE_MAPPING_CONVERSATION_SHAPE_REVIEWED?: string;
  PHONE_SMS_EVIDENCE_MAPPING_TASK_SHAPE_REVIEWED?: string;
  PHONE_SMS_EVIDENCE_MAPPING_HUMAN_REVIEW_REQUIRED?: string;
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED?: string;
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED?: string;
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED?: string;
  ENABLE_PHONE_WEBHOOKS?: string;
  ENABLE_SMS?: string;
  ENABLE_CALL_RECORDING?: string;
  ENABLE_AI_DRAFTS?: string;
  ENABLE_AI_AUTO_SEND?: string;
}

export interface PhoneSmsSyntheticEvidenceEvent {
  evidenceId: string;
  channel: PhoneSmsEvidenceChannel;
  provider: PhoneSmsEvidenceProvider;
  runtimeVerificationCaseId: string;
  synthetic: true;
  receivedAt: string;
  routeLabel: string;
  fromAlias: string;
  toAlias: string;
  intentLabel: string;
  messagePreview: string;
  requestedHumanReview: true;
  evidenceNotes: string[];
}

export interface PhoneSmsMappedContactPreview {
  contactAlias: string;
  preferredChannel: PhoneSmsEvidenceChannel;
  source: 'phone_sms_disabled_dry_run';
  synthetic: true;
  safeToPersist: false;
  redactionStatus: 'redacted_alias_only';
}

export interface PhoneSmsMappedConversationPreview {
  conversationAlias: string;
  contactAlias: string;
  channel: PhoneSmsEvidenceChannel;
  source: 'synthetic_disabled_dry_run_fixture';
  summary: string;
  synthetic: true;
  safeToPersist: false;
  livePayloadStored: false;
  recordingStored: false;
  transcriptStored: false;
}

export interface PhoneSmsMappedTaskPreview {
  taskAlias: string;
  contactAlias: string;
  conversationAlias: string;
  title: string;
  priority: PhoneSmsEvidencePriority;
  ownerRole: 'human_operator';
  autoSendAllowed: false;
  aiDraftAllowed: false;
  safeToPersist: false;
}

export interface PhoneSmsEvidenceMappingPreview {
  build: 'QL-029';
  evidenceId: string;
  sourceRuntimeBuild: 'QL-028';
  syntheticOnly: true;
  contact: PhoneSmsMappedContactPreview;
  conversation: PhoneSmsMappedConversationPreview;
  task: PhoneSmsMappedTaskPreview;
  safety: {
    providerWebhookConfigured: false;
    persistenceWrites: false;
    liveCustomerRead: false;
    liveCustomerWrite: false;
    livePhoneWebhook: false;
    smsSending: false;
    callRecording: false;
    aiDrafts: false;
    aiAutoSend: false;
  };
  warnings: string[];
}

export interface PhoneSmsEvidenceMappingReviewResult {
  caseId: string;
  passed: boolean;
  error?: string;
  preview?: PhoneSmsEvidenceMappingPreview;
}

export interface PhoneSmsEvidenceMappingReviewReport {
  build: 'QL-029';
  title: 'Phone/SMS Disabled Dry-Run Evidence Mapping Review';
  generatedAt: string;
  allPassed: boolean;
  productionSafe: boolean;
  results: PhoneSmsEvidenceMappingReviewResult[];
  acceptedEvidence: string[];
  forbiddenEvidence: string[];
  safetyLocks: string[];
  nextSafeAction: string;
  nextBuild: 'QL-030 — Phone/SMS Disabled Dry-Run Human Review Gate';
}

const safeReviewEnv: PhoneSmsEvidenceMappingEnvironment = {
  PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS: 'runtime_verification_green',
  PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS: 'evidence_mapping_review_ready',
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: 'false',
  PHONE_SMS_EVIDENCE_MAPPING_SYNTHETIC_ONLY: 'true',
  PHONE_SMS_EVIDENCE_MAPPING_NO_PERSISTENCE_WRITES: 'true',
  PHONE_SMS_EVIDENCE_MAPPING_LIVE_CUSTOMER_ACCESS_DISABLED: 'true',
  PHONE_SMS_EVIDENCE_MAPPING_CONTACT_SHAPE_REVIEWED: 'true',
  PHONE_SMS_EVIDENCE_MAPPING_CONVERSATION_SHAPE_REVIEWED: 'true',
  PHONE_SMS_EVIDENCE_MAPPING_TASK_SHAPE_REVIEWED: 'true',
  PHONE_SMS_EVIDENCE_MAPPING_HUMAN_REVIEW_REQUIRED: 'true',
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: 'true',
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: 'true',
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: 'true',
  ENABLE_PHONE_WEBHOOKS: 'false',
  ENABLE_SMS: 'false',
  ENABLE_CALL_RECORDING: 'false',
  ENABLE_AI_DRAFTS: 'false',
  ENABLE_AI_AUTO_SEND: 'false'
};

const syntheticVoiceEvidence: PhoneSmsSyntheticEvidenceEvent = {
  evidenceId: 'ql029-voice-evidence-fixture',
  channel: 'voice',
  provider: 'undecided',
  runtimeVerificationCaseId: 'dry_run_voice_no_persistence',
  synthetic: true,
  receivedAt: '2026-10-06T13:00:00.000Z',
  routeLabel: 'ql029-disabled-dry-run-route',
  fromAlias: 'synthetic-caller-alias',
  toAlias: 'test-number-alias-only',
  intentLabel: 'request_callback_review',
  messagePreview: 'Synthetic voice evidence only. No recording, transcript, customer data, or live payload is stored.',
  requestedHumanReview: true,
  evidenceNotes: [
    'Map to one redacted contact preview.',
    'Map to one conversation preview without recording or transcript storage.',
    'Map to one human review task with auto-send disabled.'
  ]
};

const syntheticSmsEvidence: PhoneSmsSyntheticEvidenceEvent = {
  evidenceId: 'ql029-sms-evidence-fixture',
  channel: 'sms',
  provider: 'undecided',
  runtimeVerificationCaseId: 'dry_run_sms_no_persistence',
  synthetic: true,
  receivedAt: '2026-10-06T13:05:00.000Z',
  routeLabel: 'ql029-disabled-dry-run-route',
  fromAlias: 'synthetic-sender-alias',
  toAlias: 'test-number-alias-only',
  intentLabel: 'request_sms_review',
  messagePreview: 'Synthetic SMS evidence only. No customer message body or live payload is stored.',
  requestedHumanReview: true,
  evidenceNotes: [
    'Map to one redacted contact preview.',
    'Map to one SMS conversation preview without live body storage.',
    'Map to one human review task with SMS sending disabled.'
  ]
};

function isTrue(value: string | undefined): boolean {
  return value === 'true';
}

function hasUnsafeEnvironment(env: PhoneSmsEvidenceMappingEnvironment): boolean {
  return isTrue(env.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED)
    || isTrue(env.ENABLE_PHONE_WEBHOOKS)
    || isTrue(env.ENABLE_SMS)
    || isTrue(env.ENABLE_CALL_RECORDING)
    || isTrue(env.ENABLE_AI_DRAFTS)
    || isTrue(env.ENABLE_AI_AUTO_SEND)
    || env.PHONE_SMS_EVIDENCE_MAPPING_SYNTHETIC_ONLY !== 'true'
    || env.PHONE_SMS_EVIDENCE_MAPPING_NO_PERSISTENCE_WRITES !== 'true'
    || env.PHONE_SMS_EVIDENCE_MAPPING_LIVE_CUSTOMER_ACCESS_DISABLED !== 'true'
    || env.PHONE_SMS_PERSISTENCE_WRITES_DISABLED !== 'true'
    || env.PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED !== 'true'
    || env.PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED !== 'true';
}

function containsPhoneLikeNumber(value: string | undefined): boolean {
  const digitsOnly = (value ?? '').replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

function containsForbiddenEvidenceText(value: string | undefined): boolean {
  const normalized = (value ?? '').toLowerCase();
  return [
    'api key',
    'auth token',
    'bearer ',
    'call recording url',
    'client secret',
    'invoice',
    'password',
    'recording url',
    'secret value',
    'sip password',
    'screenshot',
    'token',
    'transcript url',
    'webhook secret'
  ].some((word) => normalized.includes(word));
}

function validateSyntheticEvidence(event: PhoneSmsSyntheticEvidenceEvent): string[] {
  const errors: string[] = [];

  if (!event || typeof event !== 'object') {
    return ['Evidence must be an object.'];
  }

  if (event.synthetic !== true) {
    errors.push('Evidence mapping accepts synthetic runtime evidence only.');
  }

  if (event.channel !== 'voice' && event.channel !== 'sms') {
    errors.push('channel must be voice or sms.');
  }

  if (!event.evidenceId) errors.push('evidenceId is required.');
  if (!event.runtimeVerificationCaseId) errors.push('runtimeVerificationCaseId is required.');
  if (!event.routeLabel) errors.push('routeLabel is required.');
  if (!event.fromAlias) errors.push('fromAlias is required and must not be a real number.');
  if (!event.toAlias) errors.push('toAlias is required and must not be a real number.');
  if (!event.intentLabel) errors.push('intentLabel is required.');
  if (!event.messagePreview) errors.push('messagePreview is required.');
  if (event.requestedHumanReview !== true) errors.push('Human review must be required for QL-029 evidence mapping.');

  const checkedText = [
    event.evidenceId,
    event.routeLabel,
    event.fromAlias,
    event.toAlias,
    event.intentLabel,
    event.messagePreview,
    ...event.evidenceNotes
  ];

  if (checkedText.some(containsForbiddenEvidenceText)) {
    errors.push('Evidence must not include credentials, secrets, provider documents, recordings, transcripts, screenshots, invoices, or tokens.');
  }

  if ([event.fromAlias, event.toAlias, event.messagePreview, ...event.evidenceNotes].some(containsPhoneLikeNumber)) {
    errors.push('Evidence must not include actual or phone-like numbers.');
  }

  return errors;
}

export function mapPhoneSmsDisabledDryRunEvidence(
  event: PhoneSmsSyntheticEvidenceEvent,
  env: PhoneSmsEvidenceMappingEnvironment = safeReviewEnv
): PhoneSmsEvidenceMappingPreview | { error: string; warnings: string[] } {
  if (env.PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS !== 'runtime_verification_green') {
    return {
      error: 'QL-028 runtime verification must be green before QL-029 evidence mapping review.',
      warnings: ['Do not map provider evidence before synthetic runtime verification is green.']
    };
  }

  if (hasUnsafeEnvironment(env)) {
    return {
      error: 'Evidence mapping safety lock failed. Live phone/SMS, persistence, recording, AI, or customer access is enabled.',
      warnings: ['Restore all QL-029 safety flags to disabled before mapping evidence.']
    };
  }

  const validationErrors = validateSyntheticEvidence(event);
  if (validationErrors.length) {
    return {
      error: 'Synthetic phone/SMS evidence validation failed.',
      warnings: validationErrors
    };
  }

  const contactAlias = `${event.channel}-synthetic-contact-preview`;
  const conversationAlias = `${event.channel}-synthetic-conversation-preview`;
  const taskAlias = `${event.channel}-human-review-task-preview`;

  return {
    build: 'QL-029',
    evidenceId: event.evidenceId,
    sourceRuntimeBuild: 'QL-028',
    syntheticOnly: true,
    contact: {
      contactAlias,
      preferredChannel: event.channel,
      source: 'phone_sms_disabled_dry_run',
      synthetic: true,
      safeToPersist: false,
      redactionStatus: 'redacted_alias_only'
    },
    conversation: {
      conversationAlias,
      contactAlias,
      channel: event.channel,
      source: 'synthetic_disabled_dry_run_fixture',
      summary: event.messagePreview,
      synthetic: true,
      safeToPersist: false,
      livePayloadStored: false,
      recordingStored: false,
      transcriptStored: false
    },
    task: {
      taskAlias,
      contactAlias,
      conversationAlias,
      title: `Human review required for synthetic ${event.channel} dry-run evidence`,
      priority: 'human_review_required',
      ownerRole: 'human_operator',
      autoSendAllowed: false,
      aiDraftAllowed: false,
      safeToPersist: false
    },
    safety: {
      providerWebhookConfigured: false,
      persistenceWrites: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      livePhoneWebhook: false,
      smsSending: false,
      callRecording: false,
      aiDrafts: false,
      aiAutoSend: false
    },
    warnings: [
      'Mapping preview is synthetic and non-persistent.',
      'Contact, conversation, and task previews are not customer records.',
      'Human review is required before any future live enablement gate.',
      'Auto-send and AI drafting remain disabled.'
    ]
  };
}

export function runPhoneSmsDisabledDryRunEvidenceMappingReview(): PhoneSmsEvidenceMappingReviewReport {
  const cases: Array<{ caseId: string; event: PhoneSmsSyntheticEvidenceEvent }> = [
    { caseId: 'map_synthetic_voice_to_contact_conversation_task', event: syntheticVoiceEvidence },
    { caseId: 'map_synthetic_sms_to_contact_conversation_task', event: syntheticSmsEvidence },
    {
      caseId: 'reject_non_synthetic_evidence',
      event: { ...syntheticVoiceEvidence, synthetic: false as never }
    }
  ];

  const results = cases.map((testCase): PhoneSmsEvidenceMappingReviewResult => {
    const preview = mapPhoneSmsDisabledDryRunEvidence(testCase.event, safeReviewEnv);
    const expectedReject = testCase.caseId === 'reject_non_synthetic_evidence';
    const passed = expectedReject
      ? 'error' in preview
      : !('error' in preview)
        && preview.contact.safeToPersist === false
        && preview.conversation.safeToPersist === false
        && preview.task.safeToPersist === false
        && preview.safety.persistenceWrites === false
        && preview.safety.liveCustomerRead === false
        && preview.safety.liveCustomerWrite === false
        && preview.safety.smsSending === false
        && preview.safety.aiAutoSend === false;

    return {
      caseId: testCase.caseId,
      passed,
      error: 'error' in preview ? preview.error : undefined,
      preview: 'error' in preview ? undefined : preview
    };
  });

  const allPassed = results.every((result) => result.passed);

  return {
    build: 'QL-029',
    title: 'Phone/SMS Disabled Dry-Run Evidence Mapping Review',
    generatedAt: new Date().toISOString(),
    allPassed,
    productionSafe: allPassed,
    results,
    acceptedEvidence: [
      'Synthetic voice and SMS fixture aliases only.',
      'Redacted contact preview labels.',
      'Conversation preview summaries without live payloads, recordings, or transcripts.',
      'Human review task preview labels with AI drafting and auto-send disabled.'
    ],
    forbiddenEvidence: [
      'Actual phone numbers or phone-like values.',
      'Provider credentials, SIP credentials, API keys, tokens, passwords, or webhook secret values.',
      'Customer names, customer phone numbers, live SMS bodies, call recordings, transcripts, or live provider payloads.',
      'Invoices, screenshots, receipts, ownership documents, or copied provider portal content.',
      'Any persistence write, live customer read/write, live callback enablement, SMS sending, call recording, AI draft, or AI auto-send action.'
    ],
    safetyLocks: [
      'PHONE_SMS_EVIDENCE_MAPPING_SYNTHETIC_ONLY=true',
      'PHONE_SMS_EVIDENCE_MAPPING_NO_PERSISTENCE_WRITES=true',
      'PHONE_SMS_EVIDENCE_MAPPING_LIVE_CUSTOMER_ACCESS_DISABLED=true',
      'PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false',
      'PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true',
      'PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true',
      'PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true',
      'ENABLE_PHONE_WEBHOOKS=false',
      'ENABLE_SMS=false',
      'ENABLE_CALL_RECORDING=false',
      'ENABLE_AI_DRAFTS=false',
      'ENABLE_AI_AUTO_SEND=false'
    ],
    nextSafeAction: allPassed
      ? 'Proceed to QL-030 human review gate planning while keeping all live phone/SMS behavior disabled.'
      : 'Fix synthetic evidence mapping blockers before any human review gate planning.',
    nextBuild: 'QL-030 — Phone/SMS Disabled Dry-Run Human Review Gate'
  };
}
