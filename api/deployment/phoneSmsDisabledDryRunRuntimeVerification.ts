// QL-028 Phone/SMS Disabled Dry-Run Runtime Verification
//
// Provider-neutral runtime verification for the first disabled/dry-run phone/SMS path.
// This helper uses synthetic fixtures only. It does not configure provider webhooks,
// does not enable live phone/SMS behavior, does not persist customer data, and does
// not store actual phone numbers, provider credentials, webhook secret values,
// live payloads, call recordings, transcripts, invoices, screenshots, or ownership documents.

export type PhoneSmsRuntimeVerificationStatus =
  | 'blocked_pending_runtime_verification'
  | 'runtime_verification_ready'
  | 'runtime_verification_green';

export type PhoneSmsRuntimeChannel = 'voice' | 'sms';
export type PhoneSmsRuntimeMode = 'disabled' | 'dry_run' | 'rejected';
export type PhoneSmsRuntimeProvider = 'voipms' | 'telnyx' | 'twilio' | 'undecided';

export interface PhoneSmsRuntimeEnvironment {
  PHONE_SMS_DISABLED_DRY_RUN_PLAN_STATUS?: string;
  PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS?: string;
  PHONE_SMS_TEST_PROVIDER?: PhoneSmsRuntimeProvider;
  PHONE_SMS_DRY_RUN_ENDPOINT_MODE?: string;
  PHONE_SMS_DRY_RUN_EXPECTED_DISABLED_STATUS?: string;
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

export interface PhoneSmsSyntheticRuntimeEvent {
  eventId: string;
  channel: PhoneSmsRuntimeChannel;
  provider: PhoneSmsRuntimeProvider;
  routeLabel: string;
  synthetic: true;
  receivedAt: string;
  fromAlias: string;
  toAlias: string;
  messagePreview?: string;
  mappingPreview: {
    contactAlias: string;
    conversationAlias: string;
    taskAlias: string;
  };
}

export interface PhoneSmsRuntimeRequest {
  method: string;
  headers: Record<string, string | undefined>;
  bodyText: string;
}

export interface PhoneSmsRuntimeResponseBody {
  accepted: boolean;
  mode: PhoneSmsRuntimeMode;
  channel?: PhoneSmsRuntimeChannel;
  persisted: false;
  liveCustomerRead: false;
  liveCustomerWrite: false;
  providerWebhookConfigured: false;
  error?: string;
  warnings: string[];
}

export interface PhoneSmsRuntimeResponse {
  status: number;
  headers: Record<string, string>;
  body: PhoneSmsRuntimeResponseBody;
}

export interface PhoneSmsRuntimeDependencies {
  persistEvent?: (payload: PhoneSmsSyntheticRuntimeEvent) => Promise<unknown>;
}

export interface PhoneSmsRuntimeExpectation {
  caseId: string;
  expectedStatus: number;
  expectedMode: PhoneSmsRuntimeMode;
  expectedAccepted: boolean;
  expectedPersisted: false;
}

export interface PhoneSmsRuntimeVerificationCase {
  expectation: PhoneSmsRuntimeExpectation;
  env: PhoneSmsRuntimeEnvironment;
  request: PhoneSmsRuntimeRequest;
}

export interface PhoneSmsRuntimeVerificationResult extends PhoneSmsRuntimeExpectation {
  actualStatus: number;
  actualMode: PhoneSmsRuntimeMode;
  actualAccepted: boolean;
  actualPersisted: false;
  persistenceCalls: number;
  passed: boolean;
  error?: string;
}

export interface PhoneSmsRuntimeVerificationReport {
  build: 'QL-028';
  title: 'Phone/SMS Disabled Dry-Run Runtime Verification';
  generatedAt: string;
  allPassed: boolean;
  productionSafe: boolean;
  results: PhoneSmsRuntimeVerificationResult[];
  safetyLocks: string[];
  warnings: string[];
  nextSafeAction: string;
  nextBuild: 'QL-029 — Phone/SMS Disabled Dry-Run Evidence Mapping Review';
}

const responseHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const safeBaseEnv: PhoneSmsRuntimeEnvironment = {
  PHONE_SMS_DISABLED_DRY_RUN_PLAN_STATUS: 'disabled_dry_run_plan_ready_for_runtime_verification',
  PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS: 'runtime_verification_ready',
  PHONE_SMS_TEST_PROVIDER: 'undecided',
  PHONE_SMS_DRY_RUN_EXPECTED_DISABLED_STATUS: '503',
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

const voiceFixture: PhoneSmsSyntheticRuntimeEvent = {
  eventId: 'ql028-voice-fixture',
  channel: 'voice',
  provider: 'undecided',
  routeLabel: 'ql028-disabled-dry-run-route',
  synthetic: true,
  receivedAt: '2026-10-06T12:00:00.000Z',
  fromAlias: 'synthetic-caller-alias',
  toAlias: 'test-number-alias-only',
  messagePreview: 'Synthetic voice event. No recording, transcript, or customer data is stored.',
  mappingPreview: {
    contactAlias: 'synthetic-contact',
    conversationAlias: 'synthetic-voice-conversation',
    taskAlias: 'human-review-task'
  }
};

const smsFixture: PhoneSmsSyntheticRuntimeEvent = {
  eventId: 'ql028-sms-fixture',
  channel: 'sms',
  provider: 'undecided',
  routeLabel: 'ql028-disabled-dry-run-route',
  synthetic: true,
  receivedAt: '2026-10-06T12:05:00.000Z',
  fromAlias: 'synthetic-sender-alias',
  toAlias: 'test-number-alias-only',
  messagePreview: 'Synthetic SMS event. No customer message body is stored.',
  mappingPreview: {
    contactAlias: 'synthetic-contact',
    conversationAlias: 'synthetic-sms-conversation',
    taskAlias: 'human-review-task'
  }
};

function makeResponse(status: number, body: PhoneSmsRuntimeResponseBody): PhoneSmsRuntimeResponse {
  return {
    status,
    headers: responseHeaders,
    body
  };
}

function isTrue(value: string | undefined): boolean {
  return value === 'true';
}

function hasLiveFeatureEnabled(env: PhoneSmsRuntimeEnvironment): boolean {
  return isTrue(env.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED)
    || isTrue(env.ENABLE_PHONE_WEBHOOKS)
    || isTrue(env.ENABLE_SMS)
    || isTrue(env.ENABLE_CALL_RECORDING)
    || isTrue(env.ENABLE_AI_DRAFTS)
    || isTrue(env.ENABLE_AI_AUTO_SEND)
    || env.PHONE_SMS_PERSISTENCE_WRITES_DISABLED !== 'true'
    || env.PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED !== 'true'
    || env.PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED !== 'true';
}

function parseRuntimeEvent(bodyText: string): PhoneSmsSyntheticRuntimeEvent | string {
  try {
    return JSON.parse(bodyText) as PhoneSmsSyntheticRuntimeEvent;
  } catch {
    return 'Runtime verification body must be valid JSON.';
  }
}

function containsForbiddenRuntimeText(value: string | undefined): boolean {
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

function validateSyntheticEvent(payload: PhoneSmsSyntheticRuntimeEvent): string[] {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return ['Payload must be an object.'];
  }

  if (payload.synthetic !== true) {
    errors.push('Runtime verification accepts synthetic fixtures only.');
  }

  if (payload.channel !== 'voice' && payload.channel !== 'sms') {
    errors.push('channel must be voice or sms.');
  }

  if (!payload.eventId) errors.push('eventId is required.');
  if (!payload.routeLabel) errors.push('routeLabel is required.');
  if (!payload.fromAlias) errors.push('fromAlias is required and must not be a real phone number.');
  if (!payload.toAlias) errors.push('toAlias is required and must not be a real phone number.');
  if (!payload.mappingPreview?.contactAlias) errors.push('mappingPreview.contactAlias is required.');
  if (!payload.mappingPreview?.conversationAlias) errors.push('mappingPreview.conversationAlias is required.');
  if (!payload.mappingPreview?.taskAlias) errors.push('mappingPreview.taskAlias is required.');

  const checkedText = [
    payload.fromAlias,
    payload.toAlias,
    payload.messagePreview,
    payload.mappingPreview?.contactAlias,
    payload.mappingPreview?.conversationAlias,
    payload.mappingPreview?.taskAlias
  ];

  if (checkedText.some(containsForbiddenRuntimeText)) {
    errors.push('Synthetic fixture text must not include credentials, secrets, documents, recordings, transcripts, or provider artifacts.');
  }

  return errors;
}

export async function handlePhoneSmsDisabledDryRunRuntimeEvent(
  request: PhoneSmsRuntimeRequest,
  env: PhoneSmsRuntimeEnvironment,
  dependencies: PhoneSmsRuntimeDependencies = {}
): Promise<PhoneSmsRuntimeResponse> {
  void dependencies;

  if (hasLiveFeatureEnabled(env)) {
    return makeResponse(409, {
      accepted: false,
      mode: 'rejected',
      persisted: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      providerWebhookConfigured: false,
      error: 'Runtime verification safety lock failed. Live phone/SMS, persistence, recording, AI, or customer access is enabled.',
      warnings: ['Restore all QL-028 safety flags to disabled before running synthetic verification.']
    });
  }

  if (request.method.toUpperCase() !== 'POST') {
    return makeResponse(405, {
      accepted: false,
      mode: 'rejected',
      persisted: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      providerWebhookConfigured: false,
      error: 'Only POST is allowed for runtime verification.',
      warnings: []
    });
  }

  if (env.PHONE_SMS_DRY_RUN_ENDPOINT_MODE !== 'dry_run_no_persistence') {
    return makeResponse(503, {
      accepted: false,
      mode: 'disabled',
      persisted: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      providerWebhookConfigured: false,
      error: 'Phone/SMS disabled dry-run route is disabled.',
      warnings: ['Expected safe disabled response before any provider callback can be configured.']
    });
  }

  const parsedPayload = parseRuntimeEvent(request.bodyText);
  if (typeof parsedPayload === 'string') {
    return makeResponse(400, {
      accepted: false,
      mode: 'rejected',
      persisted: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      providerWebhookConfigured: false,
      error: parsedPayload,
      warnings: []
    });
  }

  const validationErrors = validateSyntheticEvent(parsedPayload);
  if (validationErrors.length) {
    return makeResponse(422, {
      accepted: false,
      mode: 'rejected',
      persisted: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      providerWebhookConfigured: false,
      error: 'Synthetic phone/SMS runtime fixture validation failed.',
      warnings: validationErrors
    });
  }

  return makeResponse(202, {
    accepted: true,
    mode: 'dry_run',
    channel: parsedPayload.channel,
    persisted: false,
    liveCustomerRead: false,
    liveCustomerWrite: false,
    providerWebhookConfigured: false,
    warnings: [
      'Synthetic fixture accepted for dry-run mapping only.',
      'No provider webhook was configured.',
      'No persistence adapter was called.',
      'No live customer reads or writes were performed.'
    ]
  });
}

function makeRequest(payload: PhoneSmsSyntheticRuntimeEvent): PhoneSmsRuntimeRequest {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    bodyText: JSON.stringify(payload)
  };
}

export async function runPhoneSmsDisabledDryRunRuntimeVerification(): Promise<PhoneSmsRuntimeVerificationReport> {
  const cases: PhoneSmsRuntimeVerificationCase[] = [
    {
      expectation: {
        caseId: 'disabled_voice_returns_503',
        expectedStatus: 503,
        expectedMode: 'disabled',
        expectedAccepted: false,
        expectedPersisted: false
      },
      env: {
        ...safeBaseEnv,
        PHONE_SMS_DRY_RUN_ENDPOINT_MODE: 'disabled'
      },
      request: makeRequest(voiceFixture)
    },
    {
      expectation: {
        caseId: 'dry_run_voice_no_persistence',
        expectedStatus: 202,
        expectedMode: 'dry_run',
        expectedAccepted: true,
        expectedPersisted: false
      },
      env: {
        ...safeBaseEnv,
        PHONE_SMS_DRY_RUN_ENDPOINT_MODE: 'dry_run_no_persistence'
      },
      request: makeRequest(voiceFixture)
    },
    {
      expectation: {
        caseId: 'dry_run_sms_no_persistence',
        expectedStatus: 202,
        expectedMode: 'dry_run',
        expectedAccepted: true,
        expectedPersisted: false
      },
      env: {
        ...safeBaseEnv,
        PHONE_SMS_DRY_RUN_ENDPOINT_MODE: 'dry_run_no_persistence'
      },
      request: makeRequest(smsFixture)
    },
    {
      expectation: {
        caseId: 'reject_non_synthetic_payload',
        expectedStatus: 422,
        expectedMode: 'rejected',
        expectedAccepted: false,
        expectedPersisted: false
      },
      env: {
        ...safeBaseEnv,
        PHONE_SMS_DRY_RUN_ENDPOINT_MODE: 'dry_run_no_persistence'
      },
      request: {
        ...makeRequest(voiceFixture),
        bodyText: JSON.stringify({ ...voiceFixture, synthetic: false })
      }
    }
  ];

  const results: PhoneSmsRuntimeVerificationResult[] = [];

  for (const testCase of cases) {
    let persistenceCalls = 0;
    const response = await handlePhoneSmsDisabledDryRunRuntimeEvent(
      testCase.request,
      testCase.env,
      {
        persistEvent: async () => {
          persistenceCalls += 1;
          return { blocked: true };
        }
      }
    );

    const passed = response.status === testCase.expectation.expectedStatus
      && response.body.mode === testCase.expectation.expectedMode
      && response.body.accepted === testCase.expectation.expectedAccepted
      && response.body.persisted === testCase.expectation.expectedPersisted
      && persistenceCalls === 0;

    results.push({
      ...testCase.expectation,
      actualStatus: response.status,
      actualMode: response.body.mode,
      actualAccepted: response.body.accepted,
      actualPersisted: response.body.persisted,
      persistenceCalls,
      passed,
      error: passed ? undefined : response.body.error
    });
  }

  const allPassed = results.every((result) => result.passed);

  return {
    build: 'QL-028',
    title: 'Phone/SMS Disabled Dry-Run Runtime Verification',
    generatedAt: new Date().toISOString(),
    allPassed,
    productionSafe: allPassed,
    results,
    safetyLocks: [
      'Provider webhook remains unconfigured.',
      'Live phone webhooks remain disabled.',
      'SMS sending remains disabled.',
      'Call recording remains disabled.',
      'AI drafts and AI auto-send remain disabled.',
      'Persistence writes, live customer reads, and live customer writes remain disabled.'
    ],
    warnings: [
      'QL-028 uses synthetic voice/SMS fixtures only.',
      'This helper is not a live provider callback route.',
      'Do not paste actual test numbers, existing numbers, credentials, webhook secret values, provider screenshots, invoices, recordings, transcripts, live payloads, or customer data.',
      'Runtime verification is not permission to configure a provider webhook; a later explicit gate is required.'
    ],
    nextSafeAction: allPassed
      ? 'Proceed to QL-029 evidence mapping review with synthetic events only and all live phone/SMS features still disabled.'
      : 'Fix the disabled response, synthetic-only validation, or no-persistence behavior before any later review.',
    nextBuild: 'QL-029 — Phone/SMS Disabled Dry-Run Evidence Mapping Review'
  };
}
