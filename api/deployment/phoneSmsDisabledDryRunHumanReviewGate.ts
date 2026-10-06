// QL-030 Phone/SMS Disabled Dry-Run Human Review Gate
//
// Provider-neutral human review gate for synthetic phone/SMS dry-run mapped evidence.
// This helper reviews preview-only evidence mapping output and produces a non-live
// operator decision record. It does not configure provider webhooks, does not enable
// live phone/SMS behavior, does not persist customer data, and does not store actual
// phone numbers, provider credentials, webhook secret values, live payloads, call
// recordings, transcripts, invoices, screenshots, ownership documents, or mapped live records.

export type PhoneSmsHumanReviewGateStatus =
  | 'blocked_pending_human_review_gate'
  | 'human_review_gate_ready'
  | 'human_review_gate_green';

export type PhoneSmsHumanReviewChannel = 'voice' | 'sms';
export type PhoneSmsHumanReviewDecision = 'approve_for_future_enablement_planning' | 'reject' | 'hold';
export type PhoneSmsHumanReviewProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';

export interface PhoneSmsHumanReviewGateEnvironment {
  PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS?: string;
  PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS?: PhoneSmsHumanReviewGateStatus;
  PHONE_SMS_HUMAN_REVIEW_SYNTHETIC_ONLY?: string;
  PHONE_SMS_HUMAN_REVIEW_NO_PERSISTENCE_WRITES?: string;
  PHONE_SMS_HUMAN_REVIEW_LIVE_CUSTOMER_ACCESS_DISABLED?: string;
  PHONE_SMS_HUMAN_REVIEW_PROVIDER_CALLBACK_DISABLED?: string;
  PHONE_SMS_HUMAN_REVIEW_AUTO_SEND_DISABLED?: string;
  PHONE_SMS_HUMAN_REVIEW_AI_DRAFTS_DISABLED?: string;
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED?: string;
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED?: string;
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED?: string;
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED?: string;
  ENABLE_PHONE_WEBHOOKS?: string;
  ENABLE_SMS?: string;
  ENABLE_CALL_RECORDING?: string;
  ENABLE_AI_DRAFTS?: string;
  ENABLE_AI_AUTO_SEND?: string;
}

export interface PhoneSmsHumanReviewMappedEvidence {
  evidenceId: string;
  sourceBuild: 'QL-029';
  sourceRuntimeBuild: 'QL-028';
  channel: PhoneSmsHumanReviewChannel;
  provider: PhoneSmsHumanReviewProvider;
  synthetic: true;
  contactAlias: string;
  conversationAlias: string;
  taskAlias: string;
  contactSafeToPersist: false;
  conversationSafeToPersist: false;
  taskSafeToPersist: false;
  humanReviewRequired: true;
  livePayloadStored: false;
  recordingStored: false;
  transcriptStored: false;
  autoSendAllowed: false;
  aiDraftAllowed: false;
  redactionStatus: 'redacted_alias_only';
  evidenceSummary: string;
}

export interface PhoneSmsHumanReviewOperatorDecision {
  decisionId: string;
  operatorAlias: string;
  decidedAt: string;
  decision: PhoneSmsHumanReviewDecision;
  rationale: string;
  checkedSyntheticOnly: true;
  checkedRedactedAliasesOnly: true;
  checkedNoPersistenceWrites: true;
  checkedNoLiveCustomerAccess: true;
  checkedNoProviderCallback: true;
  checkedNoSmsSending: true;
  checkedNoCallRecording: true;
  checkedNoAiDraft: true;
  checkedNoAutoSend: true;
}

export interface PhoneSmsHumanReviewGateOutcome {
  build: 'QL-030';
  evidenceId: string;
  decisionId: string;
  decision: PhoneSmsHumanReviewDecision;
  syntheticOnly: true;
  safeToPersist: false;
  approvedForFutureEnablementPlanning: boolean;
  liveEnablementAllowed: false;
  providerCallbackAllowed: false;
  smsSendAllowed: false;
  aiDraftAllowed: false;
  autoSendAllowed: false;
  persistenceWrites: false;
  liveCustomerRead: false;
  liveCustomerWrite: false;
  operatorAlias: string;
  auditPreview: {
    contactAlias: string;
    conversationAlias: string;
    taskAlias: string;
    rationale: string;
    reviewedAt: string;
  };
  warnings: string[];
}

export interface PhoneSmsHumanReviewGateResult {
  caseId: string;
  passed: boolean;
  error?: string;
  outcome?: PhoneSmsHumanReviewGateOutcome;
}

export interface PhoneSmsHumanReviewGateReport {
  build: 'QL-030';
  title: 'Phone/SMS Disabled Dry-Run Human Review Gate';
  generatedAt: string;
  allPassed: boolean;
  productionSafe: boolean;
  results: PhoneSmsHumanReviewGateResult[];
  allowedDecisions: PhoneSmsHumanReviewDecision[];
  forbiddenEvidence: string[];
  safetyLocks: string[];
  nextSafeAction: string;
  nextBuild: 'QL-031 — Phone/SMS Disabled Dry-Run Operator Outcome Journal';
}

const safeGateEnv: PhoneSmsHumanReviewGateEnvironment = {
  PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS: 'evidence_mapping_review_green',
  PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS: 'human_review_gate_ready',
  PHONE_SMS_HUMAN_REVIEW_SYNTHETIC_ONLY: 'true',
  PHONE_SMS_HUMAN_REVIEW_NO_PERSISTENCE_WRITES: 'true',
  PHONE_SMS_HUMAN_REVIEW_LIVE_CUSTOMER_ACCESS_DISABLED: 'true',
  PHONE_SMS_HUMAN_REVIEW_PROVIDER_CALLBACK_DISABLED: 'true',
  PHONE_SMS_HUMAN_REVIEW_AUTO_SEND_DISABLED: 'true',
  PHONE_SMS_HUMAN_REVIEW_AI_DRAFTS_DISABLED: 'true',
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: 'false',
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: 'true',
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: 'true',
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: 'true',
  ENABLE_PHONE_WEBHOOKS: 'false',
  ENABLE_SMS: 'false',
  ENABLE_CALL_RECORDING: 'false',
  ENABLE_AI_DRAFTS: 'false',
  ENABLE_AI_AUTO_SEND: 'false'
};

const syntheticVoiceMappedEvidence: PhoneSmsHumanReviewMappedEvidence = {
  evidenceId: 'ql030-voice-human-review-fixture',
  sourceBuild: 'QL-029',
  sourceRuntimeBuild: 'QL-028',
  channel: 'voice',
  provider: 'undecided',
  synthetic: true,
  contactAlias: 'voice-synthetic-contact-preview',
  conversationAlias: 'voice-synthetic-conversation-preview',
  taskAlias: 'voice-human-review-task-preview',
  contactSafeToPersist: false,
  conversationSafeToPersist: false,
  taskSafeToPersist: false,
  humanReviewRequired: true,
  livePayloadStored: false,
  recordingStored: false,
  transcriptStored: false,
  autoSendAllowed: false,
  aiDraftAllowed: false,
  redactionStatus: 'redacted_alias_only',
  evidenceSummary: 'Synthetic voice mapped evidence. No recording, transcript, live payload, customer data, or real number is stored.'
};

const syntheticSmsMappedEvidence: PhoneSmsHumanReviewMappedEvidence = {
  evidenceId: 'ql030-sms-human-review-fixture',
  sourceBuild: 'QL-029',
  sourceRuntimeBuild: 'QL-028',
  channel: 'sms',
  provider: 'undecided',
  synthetic: true,
  contactAlias: 'sms-synthetic-contact-preview',
  conversationAlias: 'sms-synthetic-conversation-preview',
  taskAlias: 'sms-human-review-task-preview',
  contactSafeToPersist: false,
  conversationSafeToPersist: false,
  taskSafeToPersist: false,
  humanReviewRequired: true,
  livePayloadStored: false,
  recordingStored: false,
  transcriptStored: false,
  autoSendAllowed: false,
  aiDraftAllowed: false,
  redactionStatus: 'redacted_alias_only',
  evidenceSummary: 'Synthetic SMS mapped evidence. No message body, live payload, customer data, or real number is stored.'
};

function isTrue(value: string | undefined): boolean {
  return value === 'true';
}

function hasUnsafeEnvironment(env: PhoneSmsHumanReviewGateEnvironment): boolean {
  return isTrue(env.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED)
    || isTrue(env.ENABLE_PHONE_WEBHOOKS)
    || isTrue(env.ENABLE_SMS)
    || isTrue(env.ENABLE_CALL_RECORDING)
    || isTrue(env.ENABLE_AI_DRAFTS)
    || isTrue(env.ENABLE_AI_AUTO_SEND)
    || env.PHONE_SMS_HUMAN_REVIEW_SYNTHETIC_ONLY !== 'true'
    || env.PHONE_SMS_HUMAN_REVIEW_NO_PERSISTENCE_WRITES !== 'true'
    || env.PHONE_SMS_HUMAN_REVIEW_LIVE_CUSTOMER_ACCESS_DISABLED !== 'true'
    || env.PHONE_SMS_HUMAN_REVIEW_PROVIDER_CALLBACK_DISABLED !== 'true'
    || env.PHONE_SMS_HUMAN_REVIEW_AUTO_SEND_DISABLED !== 'true'
    || env.PHONE_SMS_HUMAN_REVIEW_AI_DRAFTS_DISABLED !== 'true'
    || env.PHONE_SMS_PERSISTENCE_WRITES_DISABLED !== 'true'
    || env.PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED !== 'true'
    || env.PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED !== 'true';
}

function containsPhoneLikeNumber(value: string | undefined): boolean {
  const digitsOnly = (value ?? '').replace(/\D/g, '');
  return digitsOnly.length >= 7;
}

function containsForbiddenReviewText(value: string | undefined): boolean {
  const normalized = (value ?? '').toLowerCase();
  return [
    'api key',
    'auth token',
    'bearer ',
    'call recording url',
    'client secret',
    'invoice',
    'password',
    'real phone',
    'recording url',
    'secret value',
    'sip password',
    'screenshot',
    'token',
    'transcript url',
    'webhook secret'
  ].some((word) => normalized.includes(word));
}

function validateMappedEvidence(evidence: PhoneSmsHumanReviewMappedEvidence): string[] {
  const errors: string[] = [];

  if (!evidence || typeof evidence !== 'object') {
    return ['Mapped evidence must be an object.'];
  }

  if (evidence.sourceBuild !== 'QL-029') errors.push('Mapped evidence must come from QL-029.');
  if (evidence.sourceRuntimeBuild !== 'QL-028') errors.push('Mapped evidence must reference QL-028 runtime verification.');
  if (evidence.synthetic !== true) errors.push('Human review accepts synthetic mapped evidence only.');
  if (evidence.channel !== 'voice' && evidence.channel !== 'sms') errors.push('channel must be voice or sms.');
  if (!evidence.evidenceId) errors.push('evidenceId is required.');
  if (!evidence.contactAlias) errors.push('contactAlias is required.');
  if (!evidence.conversationAlias) errors.push('conversationAlias is required.');
  if (!evidence.taskAlias) errors.push('taskAlias is required.');
  if (evidence.contactSafeToPersist !== false) errors.push('contact preview must not be safe to persist in QL-030.');
  if (evidence.conversationSafeToPersist !== false) errors.push('conversation preview must not be safe to persist in QL-030.');
  if (evidence.taskSafeToPersist !== false) errors.push('task preview must not be safe to persist in QL-030.');
  if (evidence.humanReviewRequired !== true) errors.push('humanReviewRequired must be true.');
  if (evidence.livePayloadStored !== false) errors.push('live payload storage must be false.');
  if (evidence.recordingStored !== false) errors.push('recording storage must be false.');
  if (evidence.transcriptStored !== false) errors.push('transcript storage must be false.');
  if (evidence.autoSendAllowed !== false) errors.push('auto-send must be false.');
  if (evidence.aiDraftAllowed !== false) errors.push('AI draft must be false.');
  if (evidence.redactionStatus !== 'redacted_alias_only') errors.push('redactionStatus must be redacted_alias_only.');

  const checkedText = [
    evidence.evidenceId,
    evidence.contactAlias,
    evidence.conversationAlias,
    evidence.taskAlias,
    evidence.evidenceSummary
  ];

  if (checkedText.some(containsForbiddenReviewText)) {
    errors.push('Human review mapped evidence must not include credentials, secrets, provider artifacts, documents, recordings, transcripts, screenshots, invoices, tokens, or real-number language.');
  }

  if (checkedText.some(containsPhoneLikeNumber)) {
    errors.push('Human review mapped evidence must not include actual or phone-like numbers.');
  }

  return errors;
}

function validateOperatorDecision(decision: PhoneSmsHumanReviewOperatorDecision): string[] {
  const errors: string[] = [];

  if (!decision || typeof decision !== 'object') {
    return ['Operator decision must be an object.'];
  }

  if (!decision.decisionId) errors.push('decisionId is required.');
  if (!decision.operatorAlias) errors.push('operatorAlias is required.');
  if (!decision.decidedAt) errors.push('decidedAt is required.');
  if (!decision.rationale) errors.push('rationale is required.');
  if (!['approve_for_future_enablement_planning', 'reject', 'hold'].includes(decision.decision)) {
    errors.push('decision must be approve_for_future_enablement_planning, reject, or hold.');
  }

  if (decision.checkedSyntheticOnly !== true) errors.push('Operator must confirm synthetic-only review.');
  if (decision.checkedRedactedAliasesOnly !== true) errors.push('Operator must confirm aliases are redacted.');
  if (decision.checkedNoPersistenceWrites !== true) errors.push('Operator must confirm no persistence writes.');
  if (decision.checkedNoLiveCustomerAccess !== true) errors.push('Operator must confirm no live customer access.');
  if (decision.checkedNoProviderCallback !== true) errors.push('Operator must confirm no provider callback.');
  if (decision.checkedNoSmsSending !== true) errors.push('Operator must confirm no SMS sending.');
  if (decision.checkedNoCallRecording !== true) errors.push('Operator must confirm no call recording.');
  if (decision.checkedNoAiDraft !== true) errors.push('Operator must confirm no AI draft.');
  if (decision.checkedNoAutoSend !== true) errors.push('Operator must confirm no auto-send.');

  const checkedText = [decision.decisionId, decision.operatorAlias, decision.rationale];
  if (checkedText.some(containsForbiddenReviewText)) {
    errors.push('Operator decision must not include credentials, secrets, provider artifacts, documents, recordings, transcripts, screenshots, invoices, or tokens.');
  }

  if (checkedText.some(containsPhoneLikeNumber)) {
    errors.push('Operator decision must not include actual or phone-like numbers.');
  }

  return errors;
}

export function evaluatePhoneSmsDisabledDryRunHumanReviewGate(
  evidence: PhoneSmsHumanReviewMappedEvidence,
  decision: PhoneSmsHumanReviewOperatorDecision,
  env: PhoneSmsHumanReviewGateEnvironment = safeGateEnv
): PhoneSmsHumanReviewGateOutcome | { error: string; warnings: string[] } {
  if (env.PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS !== 'evidence_mapping_review_green') {
    return {
      error: 'QL-029 evidence mapping review must be green before QL-030 human review gate.',
      warnings: ['Do not approve or reject mapped evidence before synthetic mapping review is green.']
    };
  }

  if (hasUnsafeEnvironment(env)) {
    return {
      error: 'Human review gate safety lock failed. Live phone/SMS, persistence, recording, AI, provider callback, or customer access is enabled.',
      warnings: ['Restore all QL-030 safety flags to disabled before reviewing mapped evidence.']
    };
  }

  const evidenceErrors = validateMappedEvidence(evidence);
  const decisionErrors = validateOperatorDecision(decision);
  const warnings = [...evidenceErrors, ...decisionErrors];

  if (warnings.length) {
    return {
      error: 'Phone/SMS human review gate validation failed.',
      warnings
    };
  }

  return {
    build: 'QL-030',
    evidenceId: evidence.evidenceId,
    decisionId: decision.decisionId,
    decision: decision.decision,
    syntheticOnly: true,
    safeToPersist: false,
    approvedForFutureEnablementPlanning: decision.decision === 'approve_for_future_enablement_planning',
    liveEnablementAllowed: false,
    providerCallbackAllowed: false,
    smsSendAllowed: false,
    aiDraftAllowed: false,
    autoSendAllowed: false,
    persistenceWrites: false,
    liveCustomerRead: false,
    liveCustomerWrite: false,
    operatorAlias: decision.operatorAlias,
    auditPreview: {
      contactAlias: evidence.contactAlias,
      conversationAlias: evidence.conversationAlias,
      taskAlias: evidence.taskAlias,
      rationale: decision.rationale,
      reviewedAt: decision.decidedAt
    },
    warnings: [
      'Human review outcome is synthetic and non-persistent.',
      'Approval is only for future enablement planning, not live operation.',
      'Provider callbacks, SMS sending, call recording, AI drafts, and auto-send remain disabled.',
      'No contact, conversation, task, or audit record is written by QL-030.'
    ]
  };
}

function makeOperatorDecision(
  decisionId: string,
  decision: PhoneSmsHumanReviewDecision,
  rationale: string
): PhoneSmsHumanReviewOperatorDecision {
  return {
    decisionId,
    operatorAlias: 'synthetic-operator-alias',
    decidedAt: '2026-10-06T14:00:00.000Z',
    decision,
    rationale,
    checkedSyntheticOnly: true,
    checkedRedactedAliasesOnly: true,
    checkedNoPersistenceWrites: true,
    checkedNoLiveCustomerAccess: true,
    checkedNoProviderCallback: true,
    checkedNoSmsSending: true,
    checkedNoCallRecording: true,
    checkedNoAiDraft: true,
    checkedNoAutoSend: true
  };
}

export function runPhoneSmsDisabledDryRunHumanReviewGate(): PhoneSmsHumanReviewGateReport {
  const cases: Array<{
    caseId: string;
    evidence: PhoneSmsHumanReviewMappedEvidence;
    decision: PhoneSmsHumanReviewOperatorDecision;
    env: PhoneSmsHumanReviewGateEnvironment;
    expectedReject: boolean;
  }> = [
    {
      caseId: 'approve_synthetic_voice_for_future_planning_only',
      evidence: syntheticVoiceMappedEvidence,
      decision: makeOperatorDecision(
        'ql030-approve-voice-fixture',
        'approve_for_future_enablement_planning',
        'Synthetic voice preview is redacted and may inform a later enablement plan only.'
      ),
      env: safeGateEnv,
      expectedReject: false
    },
    {
      caseId: 'reject_synthetic_sms_without_live_action',
      evidence: syntheticSmsMappedEvidence,
      decision: makeOperatorDecision(
        'ql030-reject-sms-fixture',
        'reject',
        'Synthetic SMS preview needs clearer operator instructions before later planning.'
      ),
      env: safeGateEnv,
      expectedReject: false
    },
    {
      caseId: 'hold_synthetic_voice_without_live_action',
      evidence: syntheticVoiceMappedEvidence,
      decision: makeOperatorDecision(
        'ql030-hold-voice-fixture',
        'hold',
        'Synthetic voice preview remains on hold pending checklist wording review.'
      ),
      env: safeGateEnv,
      expectedReject: false
    },
    {
      caseId: 'reject_non_synthetic_mapped_evidence',
      evidence: { ...syntheticVoiceMappedEvidence, synthetic: false as never },
      decision: makeOperatorDecision(
        'ql030-reject-non-synthetic-fixture',
        'reject',
        'Non-synthetic evidence is not allowed in this gate.'
      ),
      env: safeGateEnv,
      expectedReject: true
    },
    {
      caseId: 'reject_unsafe_live_sms_environment',
      evidence: syntheticSmsMappedEvidence,
      decision: makeOperatorDecision(
        'ql030-reject-live-sms-fixture',
        'approve_for_future_enablement_planning',
        'This must reject because SMS sending is enabled in the test environment.'
      ),
      env: { ...safeGateEnv, ENABLE_SMS: 'true' },
      expectedReject: true
    }
  ];

  const results = cases.map((testCase): PhoneSmsHumanReviewGateResult => {
    const outcome = evaluatePhoneSmsDisabledDryRunHumanReviewGate(
      testCase.evidence,
      testCase.decision,
      testCase.env
    );

    const isRejected = 'error' in outcome;
    const passed = testCase.expectedReject
      ? isRejected
      : !isRejected
        && outcome.safeToPersist === false
        && outcome.liveEnablementAllowed === false
        && outcome.providerCallbackAllowed === false
        && outcome.smsSendAllowed === false
        && outcome.aiDraftAllowed === false
        && outcome.autoSendAllowed === false
        && outcome.persistenceWrites === false
        && outcome.liveCustomerRead === false
        && outcome.liveCustomerWrite === false;

    return {
      caseId: testCase.caseId,
      passed,
      error: isRejected ? outcome.error : undefined,
      outcome: isRejected ? undefined : outcome
    };
  });

  const allPassed = results.every((result) => result.passed);

  return {
    build: 'QL-030',
    title: 'Phone/SMS Disabled Dry-Run Human Review Gate',
    generatedAt: new Date().toISOString(),
    allPassed,
    productionSafe: allPassed,
    results,
    allowedDecisions: ['approve_for_future_enablement_planning', 'reject', 'hold'],
    forbiddenEvidence: [
      'actual phone numbers',
      'provider credentials',
      'webhook secret values',
      'SIP credentials',
      'customer data',
      'mapped live records',
      'live provider payloads',
      'call recordings',
      'transcripts',
      'invoices',
      'screenshots',
      'ownership documents'
    ],
    safetyLocks: [
      'synthetic mapped evidence only',
      'redacted aliases only',
      'safeToPersist remains false',
      'provider callbacks remain disabled',
      'SMS sending remains disabled',
      'call recording remains disabled',
      'AI drafts remain disabled',
      'auto-send remains disabled',
      'persistence writes remain disabled',
      'live customer reads and writes remain disabled'
    ],
    nextSafeAction: 'Record the synthetic operator outcome shape before any future live enablement planning.',
    nextBuild: 'QL-031 — Phone/SMS Disabled Dry-Run Operator Outcome Journal'
  };
}
