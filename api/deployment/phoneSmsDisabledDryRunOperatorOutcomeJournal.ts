// QL-031 Phone/SMS Disabled Dry-Run Operator Outcome Journal
//
// Provider-neutral journal shape for synthetic QL-030 human review decisions.
// This helper creates redacted, non-persistent journal previews only. It does not
// configure provider webhooks, enable provider callbacks, enable live phone/SMS
// behavior, write persistence records, read or write live customers, store real
// phone numbers, store operator identities, or store provider payloads.

export type PhoneSmsOperatorOutcomeJournalStatus =
  | 'blocked_pending_operator_outcome_journal'
  | 'operator_outcome_journal_ready'
  | 'operator_outcome_journal_green';

export type PhoneSmsOperatorOutcomeDecision =
  | 'approved_for_future_enablement_planning'
  | 'rejected'
  | 'hold';

export type PhoneSmsOperatorOutcomeChannel = 'voice' | 'sms';

export interface PhoneSmsOperatorOutcomeJournalEnvironment {
  PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS?: string;
  PHONE_SMS_DISABLED_DRY_RUN_OPERATOR_OUTCOME_JOURNAL_STATUS?: string;
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED?: string;
  PHONE_SMS_OPERATOR_OUTCOME_SYNTHETIC_ONLY?: string;
  PHONE_SMS_OPERATOR_OUTCOME_NO_PERSISTENCE_WRITES?: string;
  PHONE_SMS_OPERATOR_OUTCOME_LIVE_CUSTOMER_ACCESS_DISABLED?: string;
  PHONE_SMS_OPERATOR_OUTCOME_PROVIDER_CALLBACK_DISABLED?: string;
  PHONE_SMS_OPERATOR_OUTCOME_AUTO_SEND_DISABLED?: string;
  PHONE_SMS_OPERATOR_OUTCOME_AI_DRAFTS_DISABLED?: string;
  PHONE_SMS_OPERATOR_OUTCOME_JOURNAL_RESULT?: string;
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED?: string;
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED?: string;
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED?: string;
  ENABLE_PHONE_WEBHOOKS?: string;
  ENABLE_SMS?: string;
  ENABLE_CALL_RECORDING?: string;
  ENABLE_AI_DRAFTS?: string;
  ENABLE_AI_AUTO_SEND?: string;
}

export interface PhoneSmsHumanReviewDecisionPreview {
  reviewId: string;
  sourceBuild: 'QL-030';
  mappingBuild: 'QL-029';
  evidenceId: string;
  channel: PhoneSmsOperatorOutcomeChannel;
  synthetic: true;
  operatorAlias: string;
  decision: PhoneSmsOperatorOutcomeDecision;
  reviewedAt: string;
  rationale: string;
  nextActionNotes: string[];
  safeToPersist: false;
  liveEnablementAllowed: false;
  providerCallbackAllowed: false;
  smsSendAllowed: false;
  aiDraftAllowed: false;
  autoSendAllowed: false;
}

export interface PhoneSmsOperatorOutcomeJournalEntry {
  build: 'QL-031';
  journalId: string;
  sourceReviewBuild: 'QL-030';
  sourceReviewId: string;
  sourceEvidenceId: string;
  channel: PhoneSmsOperatorOutcomeChannel;
  syntheticOnly: true;
  operatorAlias: string;
  decision: PhoneSmsOperatorOutcomeDecision;
  outcomeCategory:
    | 'future_enablement_planning_only'
    | 'rejected_before_enablement'
    | 'held_for_more_synthetic_review';
  summary: string;
  nextActionNotes: string[];
  redactionStatus: 'alias_only_no_identity_no_number';
  safeToPersist: false;
  futureEnablementPlanningAllowed: boolean;
  liveEnablementAllowed: false;
  safety: {
    providerWebhookConfigured: false;
    providerCallbackAllowed: false;
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

export interface PhoneSmsOperatorOutcomeJournalResult {
  caseId: string;
  passed: boolean;
  error?: string;
  entry?: PhoneSmsOperatorOutcomeJournalEntry;
}

export interface PhoneSmsOperatorOutcomeJournalReport {
  build: 'QL-031';
  title: 'Phone/SMS Disabled Dry-Run Operator Outcome Journal';
  generatedAt: string;
  allPassed: boolean;
  productionSafe: boolean;
  results: PhoneSmsOperatorOutcomeJournalResult[];
  acceptedInputs: string[];
  forbiddenInputs: string[];
  safetyLocks: string[];
  nextSafeAction: string;
  nextBuild: 'QL-032 — Phone/SMS Disabled Dry-Run Rollback and Evidence Retention Review';
}

const safeJournalEnv: PhoneSmsOperatorOutcomeJournalEnvironment = {
  PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS: 'human_review_gate_green',
  PHONE_SMS_DISABLED_DRY_RUN_OPERATOR_OUTCOME_JOURNAL_STATUS: 'operator_outcome_journal_ready',
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: 'false',
  PHONE_SMS_OPERATOR_OUTCOME_SYNTHETIC_ONLY: 'true',
  PHONE_SMS_OPERATOR_OUTCOME_NO_PERSISTENCE_WRITES: 'true',
  PHONE_SMS_OPERATOR_OUTCOME_LIVE_CUSTOMER_ACCESS_DISABLED: 'true',
  PHONE_SMS_OPERATOR_OUTCOME_PROVIDER_CALLBACK_DISABLED: 'true',
  PHONE_SMS_OPERATOR_OUTCOME_AUTO_SEND_DISABLED: 'true',
  PHONE_SMS_OPERATOR_OUTCOME_AI_DRAFTS_DISABLED: 'true',
  PHONE_SMS_OPERATOR_OUTCOME_JOURNAL_RESULT: 'not_run',
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: 'true',
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: 'true',
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: 'true',
  ENABLE_PHONE_WEBHOOKS: 'false',
  ENABLE_SMS: 'false',
  ENABLE_CALL_RECORDING: 'false',
  ENABLE_AI_DRAFTS: 'false',
  ENABLE_AI_AUTO_SEND: 'false'
};

const approvedReviewDecision: PhoneSmsHumanReviewDecisionPreview = {
  reviewId: 'ql031-approved-human-review-fixture',
  sourceBuild: 'QL-030',
  mappingBuild: 'QL-029',
  evidenceId: 'ql029-voice-evidence-fixture',
  channel: 'voice',
  synthetic: true,
  operatorAlias: 'operator-alias-only',
  decision: 'approved_for_future_enablement_planning',
  reviewedAt: '2026-10-06T14:00:00.000Z',
  rationale: 'Synthetic voice preview shape is acceptable for future enablement planning only.',
  nextActionNotes: [
    'Keep provider callback disabled.',
    'Keep all persistence writes disabled.',
    'Use this only as a planning journal preview.'
  ],
  safeToPersist: false,
  liveEnablementAllowed: false,
  providerCallbackAllowed: false,
  smsSendAllowed: false,
  aiDraftAllowed: false,
  autoSendAllowed: false
};

const rejectedReviewDecision: PhoneSmsHumanReviewDecisionPreview = {
  ...approvedReviewDecision,
  reviewId: 'ql031-rejected-human-review-fixture',
  channel: 'sms',
  evidenceId: 'ql029-sms-evidence-fixture',
  decision: 'rejected',
  rationale: 'Synthetic SMS preview needs clearer review labels before future planning.',
  nextActionNotes: ['Return to synthetic mapping review notes.', 'Do not enable SMS sending.']
};

const heldReviewDecision: PhoneSmsHumanReviewDecisionPreview = {
  ...approvedReviewDecision,
  reviewId: 'ql031-held-human-review-fixture',
  decision: 'hold',
  rationale: 'Synthetic voice preview is held until another synthetic review pass is documented.',
  nextActionNotes: ['Keep the review outcome non-persistent.', 'Do not start provider callback planning.']
};

function isTrue(value: string | undefined): boolean {
  return value === 'true';
}

function hasUnsafeEnvironment(env: PhoneSmsOperatorOutcomeJournalEnvironment): boolean {
  return isTrue(env.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED)
    || isTrue(env.ENABLE_PHONE_WEBHOOKS)
    || isTrue(env.ENABLE_SMS)
    || isTrue(env.ENABLE_CALL_RECORDING)
    || isTrue(env.ENABLE_AI_DRAFTS)
    || isTrue(env.ENABLE_AI_AUTO_SEND)
    || env.PHONE_SMS_OPERATOR_OUTCOME_SYNTHETIC_ONLY !== 'true'
    || env.PHONE_SMS_OPERATOR_OUTCOME_NO_PERSISTENCE_WRITES !== 'true'
    || env.PHONE_SMS_OPERATOR_OUTCOME_LIVE_CUSTOMER_ACCESS_DISABLED !== 'true'
    || env.PHONE_SMS_OPERATOR_OUTCOME_PROVIDER_CALLBACK_DISABLED !== 'true'
    || env.PHONE_SMS_OPERATOR_OUTCOME_AUTO_SEND_DISABLED !== 'true'
    || env.PHONE_SMS_OPERATOR_OUTCOME_AI_DRAFTS_DISABLED !== 'true'
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
    'real operator',
    'recording url',
    'secret value',
    'sip password',
    'screenshot',
    'token',
    'transcript url',
    'webhook secret'
  ].some((word) => normalized.includes(word));
}

function validateHumanReviewDecision(decision: PhoneSmsHumanReviewDecisionPreview): string[] {
  const errors: string[] = [];

  if (!decision || typeof decision !== 'object') return ['Human review decision must be an object.'];
  if (decision.synthetic !== true) errors.push('Only synthetic human review decisions can be journaled during QL-031.');
  if (decision.sourceBuild !== 'QL-030') errors.push('sourceBuild must be QL-030.');
  if (decision.mappingBuild !== 'QL-029') errors.push('mappingBuild must be QL-029.');
  if (decision.channel !== 'voice' && decision.channel !== 'sms') errors.push('channel must be voice or sms.');
  if (!decision.reviewId) errors.push('reviewId is required.');
  if (!decision.evidenceId) errors.push('evidenceId is required.');
  if (!decision.operatorAlias) errors.push('operatorAlias is required and must not be a real identity.');
  if (!['approved_for_future_enablement_planning', 'rejected', 'hold'].includes(decision.decision)) {
    errors.push('decision must be approved_for_future_enablement_planning, rejected, or hold.');
  }
  if (!decision.rationale) errors.push('rationale is required.');
  if (!Array.isArray(decision.nextActionNotes) || decision.nextActionNotes.length === 0) {
    errors.push('nextActionNotes must include at least one synthetic note.');
  }
  if (decision.safeToPersist !== false) errors.push('safeToPersist must remain false.');
  if (decision.liveEnablementAllowed !== false) errors.push('liveEnablementAllowed must remain false.');
  if (decision.providerCallbackAllowed !== false) errors.push('providerCallbackAllowed must remain false.');
  if (decision.smsSendAllowed !== false) errors.push('smsSendAllowed must remain false.');
  if (decision.aiDraftAllowed !== false) errors.push('aiDraftAllowed must remain false.');
  if (decision.autoSendAllowed !== false) errors.push('autoSendAllowed must remain false.');

  const checkedText = [
    decision.reviewId,
    decision.evidenceId,
    decision.operatorAlias,
    decision.rationale,
    ...decision.nextActionNotes
  ];

  if (checkedText.some(containsForbiddenEvidenceText)) {
    errors.push('Journal input must not contain credentials, secrets, provider documents, recordings, transcripts, screenshots, invoices, tokens, or real operator identities.');
  }

  if (checkedText.some(containsPhoneLikeNumber)) {
    errors.push('Journal input must not contain actual or phone-like numbers.');
  }

  return errors;
}

function outcomeCategoryFor(decision: PhoneSmsOperatorOutcomeDecision): PhoneSmsOperatorOutcomeJournalEntry['outcomeCategory'] {
  if (decision === 'approved_for_future_enablement_planning') return 'future_enablement_planning_only';
  if (decision === 'rejected') return 'rejected_before_enablement';
  return 'held_for_more_synthetic_review';
}

export function createPhoneSmsDisabledDryRunOperatorOutcomeJournalEntry(
  decision: PhoneSmsHumanReviewDecisionPreview,
  env: PhoneSmsOperatorOutcomeJournalEnvironment = safeJournalEnv
): PhoneSmsOperatorOutcomeJournalEntry | { error: string; warnings: string[] } {
  if (env.PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS !== 'human_review_gate_green') {
    return {
      error: 'QL-030 human review gate must be green before QL-031 operator outcome journaling.',
      warnings: ['Do not journal operator outcomes before synthetic human review gate verification is green.']
    };
  }

  if (hasUnsafeEnvironment(env)) {
    return {
      error: 'Operator outcome journal safety lock failed. Live phone/SMS, persistence, provider callbacks, AI, or customer access is enabled.',
      warnings: ['Restore all QL-031 safety flags to disabled before journaling outcomes.']
    };
  }

  const validationErrors = validateHumanReviewDecision(decision);
  if (validationErrors.length) {
    return {
      error: 'Synthetic operator outcome validation failed.',
      warnings: validationErrors
    };
  }

  const outcomeCategory = outcomeCategoryFor(decision.decision);
  const futurePlanningAllowed = decision.decision === 'approved_for_future_enablement_planning';

  return {
    build: 'QL-031',
    journalId: `${decision.reviewId}-journal-preview`,
    sourceReviewBuild: 'QL-030',
    sourceReviewId: decision.reviewId,
    sourceEvidenceId: decision.evidenceId,
    channel: decision.channel,
    syntheticOnly: true,
    operatorAlias: decision.operatorAlias,
    decision: decision.decision,
    outcomeCategory,
    summary: decision.rationale,
    nextActionNotes: decision.nextActionNotes,
    redactionStatus: 'alias_only_no_identity_no_number',
    safeToPersist: false,
    futureEnablementPlanningAllowed: futurePlanningAllowed,
    liveEnablementAllowed: false,
    safety: {
      providerWebhookConfigured: false,
      providerCallbackAllowed: false,
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
      'Journal entry is synthetic and non-persistent.',
      'Approved means future planning only, not live enablement.',
      'Provider callbacks, SMS sending, AI drafts, and auto-send remain disabled.',
      'No customer record, audit row, provider payload, recording, transcript, or operator identity is stored.'
    ]
  };
}

export function runPhoneSmsDisabledDryRunOperatorOutcomeJournal(): PhoneSmsOperatorOutcomeJournalReport {
  const cases: Array<{ caseId: string; decision: PhoneSmsHumanReviewDecisionPreview; env?: PhoneSmsOperatorOutcomeJournalEnvironment }> = [
    { caseId: 'journal_approved_future_planning_only', decision: approvedReviewDecision },
    { caseId: 'journal_rejected_before_enablement', decision: rejectedReviewDecision },
    { caseId: 'journal_hold_for_more_synthetic_review', decision: heldReviewDecision },
    {
      caseId: 'reject_non_synthetic_review_decision',
      decision: { ...approvedReviewDecision, synthetic: false as never }
    },
    {
      caseId: 'reject_unsafe_persistence_enabled_environment',
      decision: approvedReviewDecision,
      env: { ...safeJournalEnv, PHONE_SMS_PERSISTENCE_WRITES_DISABLED: 'false' }
    }
  ];

  const results = cases.map((testCase): PhoneSmsOperatorOutcomeJournalResult => {
    const entry = createPhoneSmsDisabledDryRunOperatorOutcomeJournalEntry(
      testCase.decision,
      testCase.env ?? safeJournalEnv
    );
    const expectedReject = testCase.caseId.startsWith('reject_');
    const passed = expectedReject
      ? 'error' in entry
      : !('error' in entry)
        && entry.safeToPersist === false
        && entry.liveEnablementAllowed === false
        && entry.safety.providerCallbackAllowed === false
        && entry.safety.persistenceWrites === false
        && entry.safety.liveCustomerRead === false
        && entry.safety.liveCustomerWrite === false
        && entry.safety.smsSending === false
        && entry.safety.aiDrafts === false
        && entry.safety.aiAutoSend === false;

    return {
      caseId: testCase.caseId,
      passed,
      error: 'error' in entry ? entry.error : undefined,
      entry: 'error' in entry ? undefined : entry
    };
  });

  const allPassed = results.every((result) => result.passed);

  return {
    build: 'QL-031',
    title: 'Phone/SMS Disabled Dry-Run Operator Outcome Journal',
    generatedAt: new Date().toISOString(),
    allPassed,
    productionSafe: allPassed,
    results,
    acceptedInputs: [
      'Synthetic QL-030 human review decisions only.',
      'Redacted operator aliases only.',
      'Approve, reject, or hold outcomes that remain non-persistent.',
      'Approved outcomes limited to future enablement planning only.'
    ],
    forbiddenInputs: [
      'Actual phone numbers or phone-like numbers.',
      'Real operator identities.',
      'Provider credentials, webhook secret values, SIP passwords, tokens, screenshots, invoices, or ownership documents.',
      'Live customer data, live provider payloads, mapped live records, recordings, or transcripts.',
      'Any journal result that allows persistence, provider callbacks, live enablement, SMS sending, AI drafts, or auto-send.'
    ],
    safetyLocks: [
      'PHONE_SMS_OPERATOR_OUTCOME_SYNTHETIC_ONLY=true',
      'PHONE_SMS_OPERATOR_OUTCOME_NO_PERSISTENCE_WRITES=true',
      'PHONE_SMS_OPERATOR_OUTCOME_LIVE_CUSTOMER_ACCESS_DISABLED=true',
      'PHONE_SMS_OPERATOR_OUTCOME_PROVIDER_CALLBACK_DISABLED=true',
      'PHONE_SMS_OPERATOR_OUTCOME_AUTO_SEND_DISABLED=true',
      'PHONE_SMS_OPERATOR_OUTCOME_AI_DRAFTS_DISABLED=true',
      'ENABLE_PHONE_WEBHOOKS=false',
      'ENABLE_SMS=false',
      'ENABLE_CALL_RECORDING=false',
      'ENABLE_AI_DRAFTS=false',
      'ENABLE_AI_AUTO_SEND=false'
    ],
    nextSafeAction: 'Review rollback and evidence-retention rules before any future live enablement planning.',
    nextBuild: 'QL-032 — Phone/SMS Disabled Dry-Run Rollback and Evidence Retention Review'
  };
}
