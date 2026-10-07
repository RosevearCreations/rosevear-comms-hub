export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanStatus =
  | 'disabled_runtime_verification_execution_plan_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_execution_surface'
  | 'blocked_unsafe_execution_surface'
  | 'blocked_unsafe_evidence';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanDecision =
  | 'approve_disabled_runtime_verification_dry_run_cases'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurface =
  | 'execution_window_plan'
  | 'synthetic_fixture_plan'
  | 'feature_flag_preflight_plan'
  | 'provider_callback_disabled_case_plan'
  | 'phone_webhook_disabled_case_plan'
  | 'sms_send_disabled_case_plan'
  | 'call_recording_disabled_case_plan'
  | 'ai_draft_disabled_case_plan'
  | 'ai_auto_send_disabled_case_plan'
  | 'persistence_write_disabled_case_plan'
  | 'live_customer_access_disabled_case_plan'
  | 'manual_operator_handoff_case_plan'
  | 'rate_limit_case_plan'
  | 'replay_protection_case_plan'
  | 'idempotency_case_plan'
  | 'redacted_observability_case_plan'
  | 'rollback_kill_switch_case_plan'
  | 'success_abort_case_plan'
  | 'post_review_gate_case_plan';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionMode =
  | 'plan_only_disabled_noop'
  | 'plan_only_disabled_rejected'
  | 'plan_only_manual_review';

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanEnvironment {
  readonly ql034ExplicitDecisionGateApproved: boolean;
  readonly ql035ControlledPlanReady: boolean;
  readonly ql036DisabledImplementationScaffoldReady: boolean;
  readonly ql037DisabledVerificationPassed: boolean;
  readonly ql038ManualGoNoGoApprovedForPilotPlanning: boolean;
  readonly ql039TinyPilotPlanApprovedForDisabledImplementationDesign: boolean;
  readonly ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign: boolean;
  readonly ql041DisabledRuntimeVerificationDesignApproved: boolean;
  readonly ql042DisabledRuntimeVerificationScaffoldReady: boolean;
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

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurfaceSpec {
  readonly surface: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurface;
  readonly mode: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionMode;
  readonly plannedStatus: 403 | 409 | 423 | 503;
  readonly executionPlanOnly: boolean;
  readonly disabledResponseOnly: boolean;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: false;
  readonly liveBehaviorAllowed: false;
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanInput {
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanDecision;
  readonly environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanEnvironment;
  readonly executionSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurfaceSpec[];
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-044-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-cases';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanReport {
  readonly status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanStatus;
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanDecision;
  readonly disabledRuntimeVerificationExecutionPlanReady: boolean;
  readonly approvedForDisabledRuntimeVerificationDryRunCases: boolean;
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
  readonly requiredNextBuild: 'QL-044-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-cases';
  readonly blockers: readonly string[];
  readonly checkedSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurface[];
}

const requiredExecutionSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurface[] = [
  'execution_window_plan',
  'synthetic_fixture_plan',
  'feature_flag_preflight_plan',
  'provider_callback_disabled_case_plan',
  'phone_webhook_disabled_case_plan',
  'sms_send_disabled_case_plan',
  'call_recording_disabled_case_plan',
  'ai_draft_disabled_case_plan',
  'ai_auto_send_disabled_case_plan',
  'persistence_write_disabled_case_plan',
  'live_customer_access_disabled_case_plan',
  'manual_operator_handoff_case_plan',
  'rate_limit_case_plan',
  'replay_protection_case_plan',
  'idempotency_case_plan',
  'redacted_observability_case_plan',
  'rollback_kill_switch_case_plan',
  'success_abort_case_plan',
  'post_review_gate_case_plan',
];

export const safeDisabledRuntimeVerificationExecutionPlanEnvironment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanEnvironment = {
  ql034ExplicitDecisionGateApproved: true,
  ql035ControlledPlanReady: true,
  ql036DisabledImplementationScaffoldReady: true,
  ql037DisabledVerificationPassed: true,
  ql038ManualGoNoGoApprovedForPilotPlanning: true,
  ql039TinyPilotPlanApprovedForDisabledImplementationDesign: true,
  ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign: true,
  ql041DisabledRuntimeVerificationDesignApproved: true,
  ql042DisabledRuntimeVerificationScaffoldReady: true,
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

export const safeDisabledRuntimeVerificationExecutionSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurfaceSpec[] =
  requiredExecutionSurfaces.map((surface) => ({
    surface,
    mode:
      surface === 'manual_operator_handoff_case_plan' || surface === 'post_review_gate_case_plan'
        ? 'plan_only_manual_review'
        : surface === 'provider_callback_disabled_case_plan'
          ? 'plan_only_disabled_rejected'
          : 'plan_only_disabled_noop',
    plannedStatus:
      surface === 'provider_callback_disabled_case_plan'
        ? 403
        : surface === 'rate_limit_case_plan' || surface === 'replay_protection_case_plan'
          ? 409
          : surface === 'rollback_kill_switch_case_plan'
            ? 423
            : 503,
    executionPlanOnly: true,
    disabledResponseOnly: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    liveBehaviorAllowed: false,
    notes: [`${surface} is planned for disabled dry-run cases only.`],
  }));

export const safeDisabledRuntimeVerificationExecutionPlanInput: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanInput = {
  decision: 'approve_disabled_runtime_verification_dry_run_cases',
  environment: safeDisabledRuntimeVerificationExecutionPlanEnvironment,
  executionSurfaces: safeDisabledRuntimeVerificationExecutionSurfaces,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-044-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-cases',
  notes: [
    'QL-043 defines the disabled runtime verification execution plan only.',
    'No runtime verification is executed and no live pilot behavior is enabled.',
  ],
};

function hasUnsafeEvidence(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    normalized.includes('customer') ||
    normalized.includes('credential') ||
    normalized.includes('secret') ||
    normalized.includes('token') ||
    normalized.includes('recording') ||
    normalized.includes('transcript') ||
    normalized.includes('invoice') ||
    normalized.includes('screenshot') ||
    normalized.includes('operator identity') ||
    /\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(value)
  );
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanInput): string[] {
  const blockers: string[] = [];
  const environment = input.environment;

  if (!environment.ql034ExplicitDecisionGateApproved) blockers.push('QL-034 explicit decision gate approval is missing.');
  if (!environment.ql035ControlledPlanReady) blockers.push('QL-035 controlled plan readiness is missing.');
  if (!environment.ql036DisabledImplementationScaffoldReady) blockers.push('QL-036 disabled implementation scaffold readiness is missing.');
  if (!environment.ql037DisabledVerificationPassed) blockers.push('QL-037 disabled verification proof is missing.');
  if (!environment.ql038ManualGoNoGoApprovedForPilotPlanning) blockers.push('QL-038 manual go/no-go planning approval is missing.');
  if (!environment.ql039TinyPilotPlanApprovedForDisabledImplementationDesign) blockers.push('QL-039 tiny pilot plan approval is missing.');
  if (!environment.ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign) blockers.push('QL-040 disabled pilot implementation design approval is missing.');
  if (!environment.ql041DisabledRuntimeVerificationDesignApproved) blockers.push('QL-041 disabled runtime verification design approval is missing.');
  if (!environment.ql042DisabledRuntimeVerificationScaffoldReady) blockers.push('QL-042 disabled runtime verification scaffold proof is missing.');
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanEnvironment): string[] {
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
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Execution-plan evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectExecutionSurfaceBlockers(executionSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionSurfaceSpec[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(executionSurfaces.map((surface) => surface.surface));

  for (const required of requiredExecutionSurfaces) {
    if (!seen.has(required)) blockers.push(`Missing disabled runtime verification execution surface: ${required}.`);
  }

  for (const surface of executionSurfaces) {
    if (!surface.executionPlanOnly) blockers.push(`${surface.surface} must be execution-plan only.`);
    if (!surface.disabledResponseOnly) blockers.push(`${surface.surface} must plan disabled responses only.`);
    if (!surface.syntheticOnly || !surface.redactedOnly || surface.safeToPersist) blockers.push(`${surface.surface} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (surface.liveBehaviorAllowed) blockers.push(`${surface.surface} cannot allow live behavior.`);
    if (![403, 409, 423, 503].includes(surface.plannedStatus)) blockers.push(`${surface.surface} must use a safe disabled status.`);
    if (surface.notes.some(hasUnsafeEvidence)) blockers.push(`${surface.surface} notes include unsafe evidence.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlan(
  input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanInput,
): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const surfaceBlockers = collectExecutionSurfaceBlockers(input.executionSurfaces);
  const noteBlockers = input.notes.some(hasUnsafeEvidence) ? ['Input notes include unsafe live, customer, provider-secret, phone-number, recording, transcript, invoice, screenshot, or operator evidence.'] : [];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...surfaceBlockers, ...noteBlockers];

  const status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : surfaceBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_execution_surface'
          : surfaceBlockers.length > 0
            ? 'blocked_unsafe_execution_surface'
            : noteBlockers.length > 0
              ? 'blocked_unsafe_evidence'
              : 'disabled_runtime_verification_execution_plan_ready';

  const approved = status === 'disabled_runtime_verification_execution_plan_ready' && input.decision === 'approve_disabled_runtime_verification_dry_run_cases';

  return {
    status,
    decision: input.decision,
    disabledRuntimeVerificationExecutionPlanReady: approved,
    approvedForDisabledRuntimeVerificationDryRunCases: approved,
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
    requiredNextBuild: 'QL-044-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-cases',
    blockers,
    checkedSurfaces: input.executionSurfaces.map((surface) => surface.surface),
  };
}

export function runPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanReview(): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlanReport {
  return reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationExecutionPlan(safeDisabledRuntimeVerificationExecutionPlanInput);
}
