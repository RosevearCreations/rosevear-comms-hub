export type DisabledPilotImplementationDesignStatus =
  | 'disabled_pilot_implementation_design_ready'
  | 'blocked_missing_prerequisite'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_design_surface'
  | 'blocked_unsafe_evidence';

export type DisabledPilotImplementationDesignDecision =
  | 'approve_disabled_pilot_runtime_verification_design'
  | 'continue_rework'
  | 'remain_blocked';

export type DisabledPilotImplementationSurface =
  | 'feature_flag_boundary'
  | 'provider_callback_validation'
  | 'phone_webhook_disabled_stub'
  | 'sms_send_disabled_stub'
  | 'recording_disabled_stub'
  | 'ai_disabled_stub'
  | 'persistence_disabled_stub'
  | 'live_customer_access_disabled_stub'
  | 'manual_operator_handoff'
  | 'rate_limit_guard'
  | 'replay_protection_guard'
  | 'idempotency_guard'
  | 'redacted_observability'
  | 'rollback_kill_switch'
  | 'success_criteria'
  | 'abort_criteria'
  | 'post_pilot_review_gate';

export interface DisabledPilotImplementationPrerequisites {
  ql034ExplicitLiveEnablementDecisionGateApproved: boolean;
  ql035ControlledLiveEnablementPlanReady: boolean;
  ql036DisabledImplementationScaffoldReady: boolean;
  ql037DisabledVerificationGreen: boolean;
  ql038ManualGoNoGoApprovedForPilotPlanning: boolean;
  ql039TinyMonitoredPilotPlanApproved: boolean;
}

export interface DisabledPilotImplementationEnvironment {
  providerWebhookConfigured: boolean;
  providerCallbackAllowed: boolean;
  phoneWebhookAllowed: boolean;
  smsSendAllowed: boolean;
  callRecordingAllowed: boolean;
  aiDraftAllowed: boolean;
  autoSendAllowed: boolean;
  persistenceWrites: boolean;
  liveCustomerRead: boolean;
  liveCustomerWrite: boolean;
  actualPhoneNumberCommitted: boolean;
  providerSecretsCommitted: boolean;
  webhookSecretValuesCommitted: boolean;
  supabaseMigrationIncluded: boolean;
  livePilotRuntimeAllowed: boolean;
}

export interface DisabledPilotImplementationDesignInput {
  prerequisites: DisabledPilotImplementationPrerequisites;
  environment: DisabledPilotImplementationEnvironment;
  requestedDecision: DisabledPilotImplementationDesignDecision;
  designSurfaces: DisabledPilotImplementationSurface[];
  evidenceLabels: string[];
  syntheticOnly: boolean;
  redactedOnly: boolean;
}

export interface DisabledPilotImplementationDesignOutcome {
  status: DisabledPilotImplementationDesignStatus;
  decision: DisabledPilotImplementationDesignDecision;
  approvedForDisabledRuntimeVerificationDesign: boolean;
  disabledRuntimeVerificationBuildRequired: boolean;
  livePilotRuntimeAllowed: boolean;
  liveEnablementAllowed: boolean;
  providerWebhookConfigured: boolean;
  providerCallbackAllowed: boolean;
  phoneWebhookAllowed: boolean;
  smsSendAllowed: boolean;
  callRecordingAllowed: boolean;
  aiDraftAllowed: boolean;
  autoSendAllowed: boolean;
  persistenceWrites: boolean;
  liveCustomerRead: boolean;
  liveCustomerWrite: boolean;
  safeToPersist: boolean;
  implementationDesignOnly: boolean;
  requiredNextBuild: string;
  blockers: string[];
}

export const ql040RequiredSurfaces: DisabledPilotImplementationSurface[] = [
  'feature_flag_boundary',
  'provider_callback_validation',
  'phone_webhook_disabled_stub',
  'sms_send_disabled_stub',
  'recording_disabled_stub',
  'ai_disabled_stub',
  'persistence_disabled_stub',
  'live_customer_access_disabled_stub',
  'manual_operator_handoff',
  'rate_limit_guard',
  'replay_protection_guard',
  'idempotency_guard',
  'redacted_observability',
  'rollback_kill_switch',
  'success_criteria',
  'abort_criteria',
  'post_pilot_review_gate',
];

export const ql040SafeEnvironment: DisabledPilotImplementationEnvironment = {
  providerWebhookConfigured: false,
  providerCallbackAllowed: false,
  phoneWebhookAllowed: false,
  smsSendAllowed: false,
  callRecordingAllowed: false,
  aiDraftAllowed: false,
  autoSendAllowed: false,
  persistenceWrites: false,
  liveCustomerRead: false,
  liveCustomerWrite: false,
  actualPhoneNumberCommitted: false,
  providerSecretsCommitted: false,
  webhookSecretValuesCommitted: false,
  supabaseMigrationIncluded: false,
  livePilotRuntimeAllowed: false,
};

export const ql040DisabledPilotImplementationDesignInput: DisabledPilotImplementationDesignInput = {
  prerequisites: {
    ql034ExplicitLiveEnablementDecisionGateApproved: true,
    ql035ControlledLiveEnablementPlanReady: true,
    ql036DisabledImplementationScaffoldReady: true,
    ql037DisabledVerificationGreen: true,
    ql038ManualGoNoGoApprovedForPilotPlanning: true,
    ql039TinyMonitoredPilotPlanApproved: true,
  },
  environment: ql040SafeEnvironment,
  requestedDecision: 'approve_disabled_pilot_runtime_verification_design',
  designSurfaces: ql040RequiredSurfaces,
  evidenceLabels: [
    'synthetic-disabled-pilot-implementation-design',
    'redacted-feature-flag-boundary',
    'redacted-runtime-verification-design-required',
  ],
  syntheticOnly: true,
  redactedOnly: true,
};

const unsafeEvidencePatterns = [
  'actual_phone_number',
  'existing_phone_number',
  'provider_secret',
  'webhook_secret_value',
  'customer_record',
  'live_payload',
  'recording',
  'transcript',
  'invoice',
  'screenshot',
  'operator_identity',
];

function hasAllRequiredSurfaces(surfaces: DisabledPilotImplementationSurface[]): boolean {
  return ql040RequiredSurfaces.every((surface) => surfaces.includes(surface));
}

function findUnsafeEvidence(evidenceLabels: string[]): string[] {
  return evidenceLabels.filter((label) =>
    unsafeEvidencePatterns.some((pattern) => label.toLowerCase().includes(pattern)),
  );
}

export function designPhoneSmsControlledLiveEnablementDisabledPilotImplementation(
  input: DisabledPilotImplementationDesignInput = ql040DisabledPilotImplementationDesignInput,
): DisabledPilotImplementationDesignOutcome {
  const blockers: string[] = [];

  if (!input.prerequisites.ql034ExplicitLiveEnablementDecisionGateApproved) {
    blockers.push('QL-034 explicit live enablement decision gate is not approved.');
  }
  if (!input.prerequisites.ql035ControlledLiveEnablementPlanReady) {
    blockers.push('QL-035 controlled live enablement plan is not ready.');
  }
  if (!input.prerequisites.ql036DisabledImplementationScaffoldReady) {
    blockers.push('QL-036 disabled implementation scaffold is not ready.');
  }
  if (!input.prerequisites.ql037DisabledVerificationGreen) {
    blockers.push('QL-037 disabled verification is not green.');
  }
  if (!input.prerequisites.ql038ManualGoNoGoApprovedForPilotPlanning) {
    blockers.push('QL-038 manual go/no-go did not approve pilot planning.');
  }
  if (!input.prerequisites.ql039TinyMonitoredPilotPlanApproved) {
    blockers.push('QL-039 tiny monitored pilot plan did not approve disabled implementation design.');
  }

  const environmentFlags = input.environment;
  const unsafeEnvironment =
    environmentFlags.providerWebhookConfigured ||
    environmentFlags.providerCallbackAllowed ||
    environmentFlags.phoneWebhookAllowed ||
    environmentFlags.smsSendAllowed ||
    environmentFlags.callRecordingAllowed ||
    environmentFlags.aiDraftAllowed ||
    environmentFlags.autoSendAllowed ||
    environmentFlags.persistenceWrites ||
    environmentFlags.liveCustomerRead ||
    environmentFlags.liveCustomerWrite ||
    environmentFlags.actualPhoneNumberCommitted ||
    environmentFlags.providerSecretsCommitted ||
    environmentFlags.webhookSecretValuesCommitted ||
    environmentFlags.supabaseMigrationIncluded ||
    environmentFlags.livePilotRuntimeAllowed;

  if (unsafeEnvironment) {
    blockers.push('Environment attempts to enable live pilot/runtime behavior or commit sensitive production material.');
  }

  if (!hasAllRequiredSurfaces(input.designSurfaces)) {
    blockers.push('Disabled pilot implementation design is missing one or more required safety surfaces.');
  }

  const unsafeEvidence = findUnsafeEvidence(input.evidenceLabels);
  if (!input.syntheticOnly || !input.redactedOnly || unsafeEvidence.length > 0) {
    blockers.push('Evidence must remain synthetic, redacted, and free of live/customer/provider-secret/operator material.');
  }

  const status: DisabledPilotImplementationDesignStatus = blockers.length
    ? unsafeEnvironment
      ? 'blocked_unsafe_environment'
      : !hasAllRequiredSurfaces(input.designSurfaces)
        ? 'blocked_missing_design_surface'
        : unsafeEvidence.length || !input.syntheticOnly || !input.redactedOnly
          ? 'blocked_unsafe_evidence'
          : 'blocked_missing_prerequisite'
    : 'disabled_pilot_implementation_design_ready';

  const approved =
    status === 'disabled_pilot_implementation_design_ready' &&
    input.requestedDecision === 'approve_disabled_pilot_runtime_verification_design';

  return {
    status,
    decision: approved ? 'approve_disabled_pilot_runtime_verification_design' : input.requestedDecision,
    approvedForDisabledRuntimeVerificationDesign: approved,
    disabledRuntimeVerificationBuildRequired: true,
    livePilotRuntimeAllowed: false,
    liveEnablementAllowed: false,
    providerWebhookConfigured: false,
    providerCallbackAllowed: false,
    phoneWebhookAllowed: false,
    smsSendAllowed: false,
    callRecordingAllowed: false,
    aiDraftAllowed: false,
    autoSendAllowed: false,
    persistenceWrites: false,
    liveCustomerRead: false,
    liveCustomerWrite: false,
    safeToPersist: false,
    implementationDesignOnly: true,
    requiredNextBuild: 'QL-041-phone-sms-controlled-live-enablement-disabled-runtime-verification-design',
    blockers,
  };
}

export function runPhoneSmsControlledLiveEnablementDisabledPilotImplementationDesign(): DisabledPilotImplementationDesignOutcome {
  return designPhoneSmsControlledLiveEnablementDisabledPilotImplementation();
}

export const ql040VerificationCases = [
  {
    name: 'ready design still blocks live pilot runtime',
    outcome: runPhoneSmsControlledLiveEnablementDisabledPilotImplementationDesign(),
  },
  {
    name: 'blocks without QL-039 approval',
    outcome: designPhoneSmsControlledLiveEnablementDisabledPilotImplementation({
      ...ql040DisabledPilotImplementationDesignInput,
      prerequisites: {
        ...ql040DisabledPilotImplementationDesignInput.prerequisites,
        ql039TinyMonitoredPilotPlanApproved: false,
      },
    }),
  },
  {
    name: 'blocks unsafe runtime enablement',
    outcome: designPhoneSmsControlledLiveEnablementDisabledPilotImplementation({
      ...ql040DisabledPilotImplementationDesignInput,
      environment: {
        ...ql040SafeEnvironment,
        livePilotRuntimeAllowed: true,
      },
    }),
  },
  {
    name: 'blocks missing implementation surfaces',
    outcome: designPhoneSmsControlledLiveEnablementDisabledPilotImplementation({
      ...ql040DisabledPilotImplementationDesignInput,
      designSurfaces: ['feature_flag_boundary'],
    }),
  },
];
