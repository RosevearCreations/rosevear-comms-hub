export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldStatus =
  | 'disabled_runtime_verification_scaffold_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_probe_surface'
  | 'blocked_unsafe_probe_surface'
  | 'blocked_unsafe_evidence';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldDecision =
  | 'approve_disabled_runtime_verification_execution_plan'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurface =
  | 'feature_flag_boundary_probe'
  | 'provider_callback_validation_probe'
  | 'phone_webhook_disabled_probe'
  | 'sms_send_disabled_probe'
  | 'call_recording_disabled_probe'
  | 'ai_draft_disabled_probe'
  | 'ai_auto_send_disabled_probe'
  | 'persistence_write_disabled_probe'
  | 'live_customer_access_disabled_probe'
  | 'manual_operator_handoff_probe'
  | 'rate_limit_guard_probe'
  | 'replay_protection_guard_probe'
  | 'idempotency_guard_probe'
  | 'redacted_observability_probe'
  | 'rollback_kill_switch_probe'
  | 'success_criteria_probe'
  | 'abort_criteria_probe'
  | 'post_review_gate_probe';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeProbeMode =
  | 'disabled_noop'
  | 'disabled_rejected'
  | 'disabled_manual_review_only';

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationEnvironment {
  readonly ql034ExplicitDecisionGateApproved: boolean;
  readonly ql035ControlledPlanReady: boolean;
  readonly ql036DisabledImplementationScaffoldReady: boolean;
  readonly ql037DisabledVerificationPassed: boolean;
  readonly ql038ManualGoNoGoApprovedForPilotPlanning: boolean;
  readonly ql039TinyPilotPlanApprovedForDisabledImplementationDesign: boolean;
  readonly ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign: boolean;
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

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurfaceSpec {
  readonly surface: PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurface;
  readonly mode: PhoneSmsControlledLiveEnablementDisabledRuntimeProbeMode;
  readonly expectedStatus: 403 | 409 | 423 | 503;
  readonly disabledResponseOnly: boolean;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: false;
  readonly liveBehaviorAllowed: false;
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldInput {
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldDecision;
  readonly environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationEnvironment;
  readonly probeSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurfaceSpec[];
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-043-phone-sms-controlled-live-enablement-disabled-runtime-verification-execution-plan';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldReport {
  readonly status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldStatus;
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldDecision;
  readonly disabledRuntimeVerificationScaffoldReady: boolean;
  readonly approvedForDisabledRuntimeVerificationExecutionPlan: boolean;
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
  readonly requiredNextBuild: 'QL-043-phone-sms-controlled-live-enablement-disabled-runtime-verification-execution-plan';
  readonly blockers: readonly string[];
  readonly checkedSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurface[];
}

const requiredProbeSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurface[] = [
  'feature_flag_boundary_probe',
  'provider_callback_validation_probe',
  'phone_webhook_disabled_probe',
  'sms_send_disabled_probe',
  'call_recording_disabled_probe',
  'ai_draft_disabled_probe',
  'ai_auto_send_disabled_probe',
  'persistence_write_disabled_probe',
  'live_customer_access_disabled_probe',
  'manual_operator_handoff_probe',
  'rate_limit_guard_probe',
  'replay_protection_guard_probe',
  'idempotency_guard_probe',
  'redacted_observability_probe',
  'rollback_kill_switch_probe',
  'success_criteria_probe',
  'abort_criteria_probe',
  'post_review_gate_probe',
];

export const safeDisabledRuntimeVerificationScaffoldEnvironment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationEnvironment = {
  ql034ExplicitDecisionGateApproved: true,
  ql035ControlledPlanReady: true,
  ql036DisabledImplementationScaffoldReady: true,
  ql037DisabledVerificationPassed: true,
  ql038ManualGoNoGoApprovedForPilotPlanning: true,
  ql039TinyPilotPlanApprovedForDisabledImplementationDesign: true,
  ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign: true,
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

export const safeDisabledRuntimeVerificationProbeSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurfaceSpec[] =
  requiredProbeSurfaces.map((surface) => ({
    surface,
    mode:
      surface === 'manual_operator_handoff_probe' || surface === 'post_review_gate_probe'
        ? 'disabled_manual_review_only'
        : surface === 'provider_callback_validation_probe'
          ? 'disabled_rejected'
          : 'disabled_noop',
    expectedStatus:
      surface === 'provider_callback_validation_probe'
        ? 403
        : surface === 'rate_limit_guard_probe' || surface === 'replay_protection_guard_probe'
          ? 409
          : surface === 'rollback_kill_switch_probe'
            ? 423
            : 503,
    disabledResponseOnly: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    liveBehaviorAllowed: false,
    notes: [`${surface} must return a disabled verification scaffold response only.`],
  }));

export const safeDisabledRuntimeVerificationScaffoldInput: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldInput = {
  decision: 'approve_disabled_runtime_verification_execution_plan',
  environment: safeDisabledRuntimeVerificationScaffoldEnvironment,
  probeSurfaces: safeDisabledRuntimeVerificationProbeSurfaces,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-043-phone-sms-controlled-live-enablement-disabled-runtime-verification-execution-plan',
  notes: [
    'QL-042 creates a disabled runtime verification scaffold only.',
    'No provider callback, webhook, SMS, recording, AI, persistence, customer access, or live pilot runtime is enabled.',
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

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldInput): string[] {
  const blockers: string[] = [];
  const environment = input.environment;

  if (!environment.ql034ExplicitDecisionGateApproved) blockers.push('QL-034 explicit decision gate approval is missing.');
  if (!environment.ql035ControlledPlanReady) blockers.push('QL-035 controlled plan readiness is missing.');
  if (!environment.ql036DisabledImplementationScaffoldReady) blockers.push('QL-036 disabled implementation scaffold readiness is missing.');
  if (!environment.ql037DisabledVerificationPassed) blockers.push('QL-037 disabled verification proof is missing.');
  if (!environment.ql038ManualGoNoGoApprovedForPilotPlanning) blockers.push('QL-038 manual go/no-go planning approval is missing.');
  if (!environment.ql039TinyPilotPlanApprovedForDisabledImplementationDesign) blockers.push('QL-039 tiny pilot plan approval is missing.');
  if (!environment.ql040DisabledPilotImplementationApprovedForRuntimeVerificationDesign) blockers.push('QL-040 disabled pilot implementation design approval is missing.');
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationEnvironment): string[] {
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
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Scaffold evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectProbeSurfaceBlockers(probeSurfaces: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeProbeSurfaceSpec[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(probeSurfaces.map((surface) => surface.surface));

  for (const required of requiredProbeSurfaces) {
    if (!seen.has(required)) blockers.push(`Missing disabled runtime verification probe surface: ${required}.`);
  }

  for (const surface of probeSurfaces) {
    if (!surface.disabledResponseOnly) blockers.push(`${surface.surface} must return disabled responses only.`);
    if (!surface.syntheticOnly || !surface.redactedOnly || surface.safeToPersist) blockers.push(`${surface.surface} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (surface.liveBehaviorAllowed) blockers.push(`${surface.surface} cannot allow live behavior.`);
    if (![403, 409, 423, 503].includes(surface.expectedStatus)) blockers.push(`${surface.surface} must use a safe disabled status.`);
    if (surface.notes.some(hasUnsafeEvidence)) blockers.push(`${surface.surface} notes include unsafe evidence.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffold(
  input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldInput,
): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const probeBlockers = collectProbeSurfaceBlockers(input.probeSurfaces);
  const noteBlockers = input.notes.some(hasUnsafeEvidence) ? ['Input notes include unsafe live, customer, provider-secret, phone-number, recording, transcript, invoice, screenshot, or operator evidence.'] : [];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...probeBlockers, ...noteBlockers];

  const status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : probeBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_probe_surface'
          : probeBlockers.length > 0
            ? 'blocked_unsafe_probe_surface'
            : noteBlockers.length > 0
              ? 'blocked_unsafe_evidence'
              : 'disabled_runtime_verification_scaffold_ready';

  const approved = status === 'disabled_runtime_verification_scaffold_ready' && input.decision === 'approve_disabled_runtime_verification_execution_plan';

  return {
    status,
    decision: input.decision,
    disabledRuntimeVerificationScaffoldReady: approved,
    approvedForDisabledRuntimeVerificationExecutionPlan: approved,
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
    requiredNextBuild: 'QL-043-phone-sms-controlled-live-enablement-disabled-runtime-verification-execution-plan',
    blockers,
    checkedSurfaces: input.probeSurfaces.map((surface) => surface.surface),
  };
}

export function runPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldReview(): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffoldReport {
  return reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationScaffold(safeDisabledRuntimeVerificationScaffoldInput);
}
