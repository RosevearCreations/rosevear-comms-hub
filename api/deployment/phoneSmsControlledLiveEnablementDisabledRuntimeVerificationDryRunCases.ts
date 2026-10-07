export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesStatus =
  | 'disabled_runtime_verification_dry_run_cases_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_dry_run_case'
  | 'blocked_unsafe_dry_run_case'
  | 'blocked_unsafe_evidence';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesDecision =
  | 'approve_disabled_runtime_verification_dry_run_result_review'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCaseId =
  | 'feature_flag_boundary_disabled_case'
  | 'provider_callback_disabled_case'
  | 'phone_webhook_disabled_case'
  | 'sms_send_disabled_case'
  | 'call_recording_disabled_case'
  | 'ai_draft_disabled_case'
  | 'ai_auto_send_disabled_case'
  | 'persistence_write_disabled_case'
  | 'live_customer_access_disabled_case'
  | 'rate_limit_guard_disabled_case'
  | 'replay_protection_disabled_case'
  | 'rollback_kill_switch_disabled_case'
  | 'redacted_observability_disabled_case'
  | 'operator_review_disabled_case'
  | 'post_run_review_disabled_case';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunSurface =
  | 'feature_flag_boundary'
  | 'provider_callback'
  | 'phone_webhook'
  | 'sms_send'
  | 'call_recording'
  | 'ai_draft'
  | 'ai_auto_send'
  | 'persistence_write'
  | 'live_customer_access'
  | 'rate_limit_guard'
  | 'replay_protection_guard'
  | 'rollback_kill_switch'
  | 'redacted_observability'
  | 'operator_review'
  | 'post_run_review';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExpectedOutcome =
  | 'disabled_noop'
  | 'disabled_rejected'
  | 'disabled_manual_review_only'
  | 'disabled_abort_ready';

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunEnvironment {
  readonly ql034ExplicitDecisionGateApproved: boolean;
  readonly ql035ControlledPlanReady: boolean;
  readonly ql036DisabledImplementationScaffoldReady: boolean;
  readonly ql037DisabledVerificationPassed: boolean;
  readonly ql038ManualGoNoGoApprovedForPilotPlanning: boolean;
  readonly ql039TinyPilotPlanApprovedForDisabledImplementationDesign: boolean;
  readonly ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign: boolean;
  readonly ql041DisabledRuntimeVerificationDesignReady: boolean;
  readonly ql042DisabledRuntimeVerificationScaffoldReady: boolean;
  readonly ql043DisabledRuntimeVerificationExecutionPlanReady: boolean;
  readonly providerWebhookConfigured: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly phoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
  readonly callRecordingAllowed: boolean;
  readonly aiDraftAllowed: boolean;
  readonly aiAutoSendAllowed: boolean;
  readonly persistenceWritesAllowed: boolean;
  readonly liveCustomerReadAllowed: boolean;
  readonly liveCustomerWriteAllowed: boolean;
  readonly livePilotRuntimeAllowed: boolean;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: boolean;
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCase {
  readonly id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCaseId;
  readonly surface: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunSurface;
  readonly expectedStatus: 403 | 409 | 423 | 503;
  readonly expectedOutcome: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExpectedOutcome;
  readonly disabledResponseOnly: boolean;
  readonly syntheticRequestOnly: boolean;
  readonly redactedResponseOnly: boolean;
  readonly providerDeliveryBlocked: boolean;
  readonly liveBehaviorAllowed: false;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesInput {
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesDecision;
  readonly environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunEnvironment;
  readonly dryRunCases: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCase[];
  readonly dryRunExecutionBlockedUntilLaterBuild: boolean;
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-045-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-result-review';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesReport {
  readonly status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesStatus;
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesDecision;
  readonly dryRunCasesReady: boolean;
  readonly approvedForDryRunResultReview: boolean;
  readonly dryRunExecutionAllowedNow: false;
  readonly liveEnablementAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerWebhookConfigured: false;
  readonly providerCallbackAllowed: false;
  readonly phoneWebhookAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRecordingAllowed: false;
  readonly aiDraftAllowed: false;
  readonly aiAutoSendAllowed: false;
  readonly persistenceWrites: false;
  readonly liveCustomerRead: false;
  readonly liveCustomerWrite: false;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-045-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-result-review';
  readonly blockers: readonly string[];
  readonly checkedCases: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCaseId[];
}

const requiredDryRunCaseIds: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCaseId[] = [
  'feature_flag_boundary_disabled_case',
  'provider_callback_disabled_case',
  'phone_webhook_disabled_case',
  'sms_send_disabled_case',
  'call_recording_disabled_case',
  'ai_draft_disabled_case',
  'ai_auto_send_disabled_case',
  'persistence_write_disabled_case',
  'live_customer_access_disabled_case',
  'rate_limit_guard_disabled_case',
  'replay_protection_disabled_case',
  'rollback_kill_switch_disabled_case',
  'redacted_observability_disabled_case',
  'operator_review_disabled_case',
  'post_run_review_disabled_case',
];

export const safeDisabledRuntimeVerificationDryRunEnvironment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunEnvironment = {
  ql034ExplicitDecisionGateApproved: true,
  ql035ControlledPlanReady: true,
  ql036DisabledImplementationScaffoldReady: true,
  ql037DisabledVerificationPassed: true,
  ql038ManualGoNoGoApprovedForPilotPlanning: true,
  ql039TinyPilotPlanApprovedForDisabledImplementationDesign: true,
  ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign: true,
  ql041DisabledRuntimeVerificationDesignReady: true,
  ql042DisabledRuntimeVerificationScaffoldReady: true,
  ql043DisabledRuntimeVerificationExecutionPlanReady: true,
  providerWebhookConfigured: false,
  providerCallbackAllowed: false,
  phoneWebhookAllowed: false,
  smsSendAllowed: false,
  callRecordingAllowed: false,
  aiDraftAllowed: false,
  aiAutoSendAllowed: false,
  persistenceWritesAllowed: false,
  liveCustomerReadAllowed: false,
  liveCustomerWriteAllowed: false,
  livePilotRuntimeAllowed: false,
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
};

const caseSurfaceMap: Record<PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCaseId, PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunSurface> = {
  feature_flag_boundary_disabled_case: 'feature_flag_boundary',
  provider_callback_disabled_case: 'provider_callback',
  phone_webhook_disabled_case: 'phone_webhook',
  sms_send_disabled_case: 'sms_send',
  call_recording_disabled_case: 'call_recording',
  ai_draft_disabled_case: 'ai_draft',
  ai_auto_send_disabled_case: 'ai_auto_send',
  persistence_write_disabled_case: 'persistence_write',
  live_customer_access_disabled_case: 'live_customer_access',
  rate_limit_guard_disabled_case: 'rate_limit_guard',
  replay_protection_disabled_case: 'replay_protection_guard',
  rollback_kill_switch_disabled_case: 'rollback_kill_switch',
  redacted_observability_disabled_case: 'redacted_observability',
  operator_review_disabled_case: 'operator_review',
  post_run_review_disabled_case: 'post_run_review',
};

function expectedStatusForCase(id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCaseId): 403 | 409 | 423 | 503 {
  if (id === 'provider_callback_disabled_case') return 403;
  if (id === 'rate_limit_guard_disabled_case' || id === 'replay_protection_disabled_case') return 409;
  if (id === 'rollback_kill_switch_disabled_case') return 423;
  return 503;
}

function expectedOutcomeForCase(id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCaseId): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExpectedOutcome {
  if (id === 'operator_review_disabled_case' || id === 'post_run_review_disabled_case') return 'disabled_manual_review_only';
  if (id === 'rollback_kill_switch_disabled_case') return 'disabled_abort_ready';
  if (id === 'provider_callback_disabled_case') return 'disabled_rejected';
  return 'disabled_noop';
}

export const safeDisabledRuntimeVerificationDryRunCases: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCase[] =
  requiredDryRunCaseIds.map((id) => ({
    id,
    surface: caseSurfaceMap[id],
    expectedStatus: expectedStatusForCase(id),
    expectedOutcome: expectedOutcomeForCase(id),
    disabledResponseOnly: true,
    syntheticRequestOnly: true,
    redactedResponseOnly: true,
    providerDeliveryBlocked: true,
    liveBehaviorAllowed: false,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-${id}`,
  }));

export const safeDisabledRuntimeVerificationDryRunCasesInput: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesInput = {
  decision: 'approve_disabled_runtime_verification_dry_run_result_review',
  environment: safeDisabledRuntimeVerificationDryRunEnvironment,
  dryRunCases: safeDisabledRuntimeVerificationDryRunCases,
  dryRunExecutionBlockedUntilLaterBuild: true,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-045-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-result-review',
  notes: [
    'QL-044 defines disabled dry-run cases only.',
    'Case execution and result review are reserved for the next controlled build.',
  ],
};

function hasUnsafeEvidence(value: string): boolean {
  return (
    /\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(value) ||
    /credential|secret|token|recording url|transcript url|invoice|screenshot|operator identity|live payload|provider payload/i.test(value)
  );
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesInput): string[] {
  const blockers: string[] = [];
  const environment = input.environment;

  if (!environment.ql034ExplicitDecisionGateApproved) blockers.push('QL-034 explicit decision gate approval is missing.');
  if (!environment.ql035ControlledPlanReady) blockers.push('QL-035 controlled plan readiness is missing.');
  if (!environment.ql036DisabledImplementationScaffoldReady) blockers.push('QL-036 disabled implementation scaffold readiness is missing.');
  if (!environment.ql037DisabledVerificationPassed) blockers.push('QL-037 disabled verification proof is missing.');
  if (!environment.ql038ManualGoNoGoApprovedForPilotPlanning) blockers.push('QL-038 manual go/no-go planning approval is missing.');
  if (!environment.ql039TinyPilotPlanApprovedForDisabledImplementationDesign) blockers.push('QL-039 tiny pilot plan approval is missing.');
  if (!environment.ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign) blockers.push('QL-040 disabled pilot implementation design approval is missing.');
  if (!environment.ql041DisabledRuntimeVerificationDesignReady) blockers.push('QL-041 disabled runtime verification design readiness is missing.');
  if (!environment.ql042DisabledRuntimeVerificationScaffoldReady) blockers.push('QL-042 disabled runtime verification scaffold readiness is missing.');
  if (!environment.ql043DisabledRuntimeVerificationExecutionPlanReady) blockers.push('QL-043 disabled runtime verification execution-plan readiness is missing.');
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunEnvironment): string[] {
  const blockers: string[] = [];
  if (environment.providerWebhookConfigured) blockers.push('Provider webhook must remain unconfigured.');
  if (environment.providerCallbackAllowed) blockers.push('Provider callbacks must remain disabled.');
  if (environment.phoneWebhookAllowed) blockers.push('Phone webhooks must remain disabled.');
  if (environment.smsSendAllowed) blockers.push('SMS sending must remain disabled.');
  if (environment.callRecordingAllowed) blockers.push('Call recording must remain disabled.');
  if (environment.aiDraftAllowed) blockers.push('AI drafts must remain disabled.');
  if (environment.aiAutoSendAllowed) blockers.push('AI auto-send must remain disabled.');
  if (environment.persistenceWritesAllowed) blockers.push('Persistence writes must remain disabled.');
  if (environment.liveCustomerReadAllowed || environment.liveCustomerWriteAllowed) blockers.push('Live customer access must remain disabled.');
  if (environment.livePilotRuntimeAllowed) blockers.push('Live pilot runtime must remain disabled.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Dry-run case evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectDryRunCaseBlockers(cases: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCase[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(cases.map((testCase) => testCase.id));

  for (const required of requiredDryRunCaseIds) {
    if (!seen.has(required)) blockers.push(`Missing disabled runtime verification dry-run case: ${required}.`);
  }

  for (const testCase of cases) {
    if (!testCase.disabledResponseOnly) blockers.push(`${testCase.id} must expect disabled responses only.`);
    if (!testCase.syntheticRequestOnly || !testCase.redactedResponseOnly || testCase.safeToPersist) blockers.push(`${testCase.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (!testCase.providerDeliveryBlocked) blockers.push(`${testCase.id} must block provider delivery.`);
    if (testCase.liveBehaviorAllowed) blockers.push(`${testCase.id} cannot allow live behavior.`);
    if (![403, 409, 423, 503].includes(testCase.expectedStatus)) blockers.push(`${testCase.id} must use a safe disabled status.`);
    if (hasUnsafeEvidence(testCase.evidenceLabel)) blockers.push(`${testCase.id} evidence label includes unsafe evidence.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCases(
  input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesInput,
): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const dryRunCaseBlockers = collectDryRunCaseBlockers(input.dryRunCases);
  const executionBlockers = input.dryRunExecutionBlockedUntilLaterBuild ? [] : ['Dry-run execution must remain blocked until a later controlled build.'];
  const noteBlockers = input.notes.some(hasUnsafeEvidence) ? ['Input notes include unsafe live, provider-secret, phone-number, recording, transcript, invoice, screenshot, or operator evidence.'] : [];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...dryRunCaseBlockers, ...executionBlockers, ...noteBlockers];

  const status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : dryRunCaseBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_dry_run_case'
          : dryRunCaseBlockers.length > 0 || executionBlockers.length > 0
            ? 'blocked_unsafe_dry_run_case'
            : noteBlockers.length > 0
              ? 'blocked_unsafe_evidence'
              : 'disabled_runtime_verification_dry_run_cases_ready';

  const approved = status === 'disabled_runtime_verification_dry_run_cases_ready' && input.decision === 'approve_disabled_runtime_verification_dry_run_result_review';

  return {
    status,
    decision: input.decision,
    dryRunCasesReady: approved,
    approvedForDryRunResultReview: approved,
    dryRunExecutionAllowedNow: false,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerWebhookConfigured: false,
    providerCallbackAllowed: false,
    phoneWebhookAllowed: false,
    smsSendAllowed: false,
    callRecordingAllowed: false,
    aiDraftAllowed: false,
    aiAutoSendAllowed: false,
    persistenceWrites: false,
    liveCustomerRead: false,
    liveCustomerWrite: false,
    syntheticOnly: input.environment.syntheticOnly,
    redactedOnly: input.environment.redactedOnly,
    safeToPersist: false,
    requiredNextBuild: 'QL-045-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-result-review',
    blockers,
    checkedCases: input.dryRunCases.map((testCase) => testCase.id),
  };
}

export function runPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesReview(): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCasesReport {
  return reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunCases(safeDisabledRuntimeVerificationDryRunCasesInput);
}
