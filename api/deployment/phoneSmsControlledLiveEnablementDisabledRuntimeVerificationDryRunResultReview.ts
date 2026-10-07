export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewStatus =
  | 'disabled_runtime_verification_dry_run_result_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_result'
  | 'blocked_failed_result'
  | 'blocked_unsafe_evidence';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewDecision =
  | 'approve_disabled_runtime_verification_closure_plan'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultId =
  | 'feature_flag_boundary_disabled_result'
  | 'provider_callback_disabled_result'
  | 'phone_webhook_disabled_result'
  | 'sms_send_disabled_result'
  | 'call_recording_disabled_result'
  | 'ai_draft_disabled_result'
  | 'ai_auto_send_disabled_result'
  | 'persistence_write_disabled_result'
  | 'live_customer_access_disabled_result'
  | 'rate_limit_guard_disabled_result'
  | 'replay_protection_disabled_result'
  | 'rollback_kill_switch_disabled_result'
  | 'redacted_observability_disabled_result'
  | 'operator_review_disabled_result'
  | 'post_run_review_disabled_result';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultSurface =
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

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultOutcome =
  | 'disabled_noop_confirmed'
  | 'disabled_rejection_confirmed'
  | 'disabled_manual_review_confirmed'
  | 'disabled_abort_ready_confirmed';

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultEnvironment {
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
  readonly ql044DisabledRuntimeVerificationDryRunCasesReady: boolean;
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
  readonly dryRunExecutionPerformed: boolean;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: boolean;
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResult {
  readonly id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultId;
  readonly surface: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultSurface;
  readonly observedStatus: 403 | 409 | 423 | 503;
  readonly observedOutcome: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultOutcome;
  readonly disabledBehaviorConfirmed: boolean;
  readonly providerDeliveryObserved: false;
  readonly liveBehaviorObserved: false;
  readonly persistedEvidenceObserved: false;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewInput {
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewDecision;
  readonly environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultEnvironment;
  readonly results: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResult[];
  readonly resultReviewOnly: boolean;
  readonly liveEnablementBlockedAfterReview: boolean;
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-046-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-plan';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewReport {
  readonly status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewStatus;
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewDecision;
  readonly dryRunResultReviewReady: boolean;
  readonly approvedForDisabledRuntimeVerificationClosurePlan: boolean;
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
  readonly requiredNextBuild: 'QL-046-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-plan';
  readonly blockers: readonly string[];
  readonly reviewedResults: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultId[];
}

const requiredResultIds: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultId[] = [
  'feature_flag_boundary_disabled_result',
  'provider_callback_disabled_result',
  'phone_webhook_disabled_result',
  'sms_send_disabled_result',
  'call_recording_disabled_result',
  'ai_draft_disabled_result',
  'ai_auto_send_disabled_result',
  'persistence_write_disabled_result',
  'live_customer_access_disabled_result',
  'rate_limit_guard_disabled_result',
  'replay_protection_disabled_result',
  'rollback_kill_switch_disabled_result',
  'redacted_observability_disabled_result',
  'operator_review_disabled_result',
  'post_run_review_disabled_result',
];

export const safeDisabledRuntimeVerificationDryRunResultReviewEnvironment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultEnvironment = {
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
  ql044DisabledRuntimeVerificationDryRunCasesReady: true,
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
  dryRunExecutionPerformed: false,
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
};

const resultSurfaceMap: Record<PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultId, PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultSurface> = {
  feature_flag_boundary_disabled_result: 'feature_flag_boundary',
  provider_callback_disabled_result: 'provider_callback',
  phone_webhook_disabled_result: 'phone_webhook',
  sms_send_disabled_result: 'sms_send',
  call_recording_disabled_result: 'call_recording',
  ai_draft_disabled_result: 'ai_draft',
  ai_auto_send_disabled_result: 'ai_auto_send',
  persistence_write_disabled_result: 'persistence_write',
  live_customer_access_disabled_result: 'live_customer_access',
  rate_limit_guard_disabled_result: 'rate_limit_guard',
  replay_protection_disabled_result: 'replay_protection_guard',
  rollback_kill_switch_disabled_result: 'rollback_kill_switch',
  redacted_observability_disabled_result: 'redacted_observability',
  operator_review_disabled_result: 'operator_review',
  post_run_review_disabled_result: 'post_run_review',
};

function expectedStatusForResult(id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultId): 403 | 409 | 423 | 503 {
  if (id === 'provider_callback_disabled_result') return 403;
  if (id === 'rate_limit_guard_disabled_result' || id === 'replay_protection_disabled_result') return 409;
  if (id === 'rollback_kill_switch_disabled_result') return 423;
  return 503;
}

function expectedOutcomeForResult(id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultId): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultOutcome {
  if (id === 'operator_review_disabled_result' || id === 'post_run_review_disabled_result') return 'disabled_manual_review_confirmed';
  if (id === 'rollback_kill_switch_disabled_result') return 'disabled_abort_ready_confirmed';
  if (id === 'provider_callback_disabled_result') return 'disabled_rejection_confirmed';
  return 'disabled_noop_confirmed';
}

export const safeDisabledRuntimeVerificationDryRunResults: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResult[] =
  requiredResultIds.map((id) => ({
    id,
    surface: resultSurfaceMap[id],
    observedStatus: expectedStatusForResult(id),
    observedOutcome: expectedOutcomeForResult(id),
    disabledBehaviorConfirmed: true,
    providerDeliveryObserved: false,
    liveBehaviorObserved: false,
    persistedEvidenceObserved: false,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-review-${id}`,
  }));

export const safeDisabledRuntimeVerificationDryRunResultReviewInput: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewInput = {
  decision: 'approve_disabled_runtime_verification_closure_plan',
  environment: safeDisabledRuntimeVerificationDryRunResultReviewEnvironment,
  results: safeDisabledRuntimeVerificationDryRunResults,
  resultReviewOnly: true,
  liveEnablementBlockedAfterReview: true,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-046-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-plan',
  notes: [
    'QL-045 reviews disabled dry-run result expectations only.',
    'The review does not run verification or authorize live pilot behavior.',
  ],
};

function hasUnsafeEvidence(value: string): boolean {
  return (
    /\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(value) ||
    /credential|secret|token|recording url|transcript url|invoice|screenshot|operator identity|live payload|provider payload|customer data/i.test(value)
  );
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewInput): string[] {
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
  if (!environment.ql044DisabledRuntimeVerificationDryRunCasesReady) blockers.push('QL-044 disabled runtime verification dry-run case readiness is missing.');
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultEnvironment): string[] {
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
  if (environment.dryRunExecutionPerformed) blockers.push('QL-045 must not execute dry-run verification; it reviews synthetic result expectations only.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Dry-run result-review evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectResultBlockers(results: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResult[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(results.map((result) => result.id));

  for (const required of requiredResultIds) {
    if (!seen.has(required)) blockers.push(`Missing disabled runtime verification dry-run result: ${required}.`);
  }

  for (const result of results) {
    if (!result.disabledBehaviorConfirmed) blockers.push(`${result.id} must confirm disabled behavior.`);
    if (result.providerDeliveryObserved) blockers.push(`${result.id} must not observe provider delivery.`);
    if (result.liveBehaviorObserved) blockers.push(`${result.id} must not observe live behavior.`);
    if (result.persistedEvidenceObserved) blockers.push(`${result.id} must not observe persisted evidence.`);
    if (!result.syntheticEvidenceOnly || !result.redactedEvidenceOnly || result.safeToPersist) blockers.push(`${result.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (![403, 409, 423, 503].includes(result.observedStatus)) blockers.push(`${result.id} must use a safe disabled status.`);
    if (hasUnsafeEvidence(result.evidenceLabel)) blockers.push(`${result.id} evidence label includes unsafe evidence.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResults(
  input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewInput,
): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const resultBlockers = collectResultBlockers(input.results);
  const reviewBlockers = input.resultReviewOnly && input.liveEnablementBlockedAfterReview ? [] : ['QL-045 must remain result-review-only and keep live enablement blocked after review.'];
  const noteBlockers = input.notes.some(hasUnsafeEvidence) ? ['Input notes include unsafe live, provider-secret, phone-number, recording, transcript, invoice, screenshot, operator, customer, or provider evidence.'] : [];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...resultBlockers, ...reviewBlockers, ...noteBlockers];

  const status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : resultBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_result'
          : resultBlockers.length > 0 || reviewBlockers.length > 0
            ? 'blocked_failed_result'
            : noteBlockers.length > 0
              ? 'blocked_unsafe_evidence'
              : 'disabled_runtime_verification_dry_run_result_review_ready';

  const approved = status === 'disabled_runtime_verification_dry_run_result_review_ready' && input.decision === 'approve_disabled_runtime_verification_closure_plan';

  return {
    status,
    decision: input.decision,
    dryRunResultReviewReady: approved,
    approvedForDisabledRuntimeVerificationClosurePlan: approved,
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
    requiredNextBuild: 'QL-046-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-plan',
    blockers,
    reviewedResults: input.results.map((result) => result.id),
  };
}

export function runPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReview(): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResultReviewReport {
  return reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationDryRunResults(safeDisabledRuntimeVerificationDryRunResultReviewInput);
}
