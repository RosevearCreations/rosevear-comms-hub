export type PhoneSmsTinyMonitoredPilotPlanStatus =
  | 'blocked_pending_tiny_monitored_pilot_plan'
  | 'blocked_rework_required'
  | 'ready_for_later_disabled_pilot_implementation_design';

export type PhoneSmsTinyMonitoredPilotPlanDecision =
  | 'approve_later_disabled_pilot_implementation_design'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsTinyMonitoredPilotEvidenceSource =
  | 'ql_034_explicit_decision_gate'
  | 'ql_035_controlled_plan'
  | 'ql_036_disabled_scaffold'
  | 'ql_037_disabled_verification'
  | 'ql_038_manual_go_no_go_gate'
  | 'ql_039_tiny_monitored_pilot_plan';

export type PhoneSmsTinyMonitoredPilotControlId =
  | 'pilot_scope'
  | 'pilot_operator_coverage'
  | 'pilot_manual_approval'
  | 'pilot_provider_boundary'
  | 'pilot_callback_boundary'
  | 'pilot_webhook_boundary'
  | 'pilot_sms_boundary'
  | 'pilot_recording_boundary'
  | 'pilot_ai_boundary'
  | 'pilot_persistence_boundary'
  | 'pilot_live_customer_boundary'
  | 'pilot_rate_limit_boundary'
  | 'pilot_replay_protection'
  | 'pilot_redaction_boundary'
  | 'pilot_observability_boundary'
  | 'pilot_rollback_boundary'
  | 'pilot_success_abort_criteria'
  | 'pilot_later_build_required';

export interface PhoneSmsTinyMonitoredPilotSafeEnvironment {
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: boolean;
  readonly liveEnablementAllowed: boolean;
  readonly laterDisabledPilotImplementationBuildRequired: boolean;
  readonly providerWebhookConfigured: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly phoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
  readonly callRecordingAllowed: boolean;
  readonly aiDraftAllowed: boolean;
  readonly autoSendAllowed: boolean;
  readonly persistenceWrites: boolean;
  readonly liveCustomerRead: boolean;
  readonly liveCustomerWrite: boolean;
  readonly actualPhoneNumberStored: boolean;
  readonly providerCredentialsStored: boolean;
  readonly webhookSecretValueStored: boolean;
  readonly liveProviderPayloadStored: boolean;
  readonly realOperatorIdentityStored: boolean;
}

export interface PhoneSmsTinyMonitoredPilotPrerequisite {
  readonly id: PhoneSmsTinyMonitoredPilotEvidenceSource;
  readonly label: string;
  readonly approved: boolean;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: boolean;
  readonly enablesLiveBehavior: boolean;
  readonly containsActualPhoneNumber: boolean;
  readonly containsProviderCredential: boolean;
  readonly containsWebhookSecretValue: boolean;
  readonly containsCustomerData: boolean;
  readonly containsLiveProviderPayload: boolean;
  readonly containsRecording: boolean;
  readonly containsTranscript: boolean;
  readonly containsRealOperatorIdentity: boolean;
}

export interface PhoneSmsTinyMonitoredPilotControl {
  readonly id: PhoneSmsTinyMonitoredPilotControlId;
  readonly label: string;
  readonly planned: boolean;
  readonly blocksLiveExecution: boolean;
  readonly requiresManualOperator: boolean;
  readonly laterImplementationRequired: boolean;
  readonly notes: string;
}

export interface PhoneSmsTinyMonitoredPilotPlanInput {
  readonly decision: PhoneSmsTinyMonitoredPilotPlanDecision;
  readonly reviewedBy: string;
  readonly reviewedAtIso: string;
  readonly environment: PhoneSmsTinyMonitoredPilotSafeEnvironment;
  readonly prerequisites: readonly PhoneSmsTinyMonitoredPilotPrerequisite[];
  readonly controls: readonly PhoneSmsTinyMonitoredPilotControl[];
}

export interface PhoneSmsTinyMonitoredPilotPlanOutcome {
  readonly status: PhoneSmsTinyMonitoredPilotPlanStatus;
  readonly decision: PhoneSmsTinyMonitoredPilotPlanDecision;
  readonly approvedForLaterDisabledPilotImplementationDesign: boolean;
  readonly livePilotRemainsBlocked: boolean;
  readonly liveEnablementAllowed: boolean;
  readonly providerWebhookConfigured: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly phoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
  readonly callRecordingAllowed: boolean;
  readonly aiDraftAllowed: boolean;
  readonly autoSendAllowed: boolean;
  readonly persistenceWrites: boolean;
  readonly liveCustomerRead: boolean;
  readonly liveCustomerWrite: boolean;
  readonly safeToPersist: boolean;
  readonly laterDisabledPilotImplementationBuildRequired: boolean;
  readonly rejectionReasons: readonly string[];
}

export interface PhoneSmsTinyMonitoredPilotPlanReport {
  readonly build: 'QL-039';
  readonly title: 'Phone/SMS Controlled Live Enablement Tiny Monitored Pilot Plan';
  readonly reviewedBy: string;
  readonly reviewedAtIso: string;
  readonly outcome: PhoneSmsTinyMonitoredPilotPlanOutcome;
  readonly controls: readonly PhoneSmsTinyMonitoredPilotControl[];
  readonly prerequisites: readonly PhoneSmsTinyMonitoredPilotPrerequisite[];
  readonly nextBuild: 'QL-040 — Phone/SMS Controlled Live Enablement Disabled Pilot Implementation Design';
}

export const safeTinyMonitoredPilotEnvironment: PhoneSmsTinyMonitoredPilotSafeEnvironment = {
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
  liveEnablementAllowed: false,
  laterDisabledPilotImplementationBuildRequired: true,
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
  actualPhoneNumberStored: false,
  providerCredentialsStored: false,
  webhookSecretValueStored: false,
  liveProviderPayloadStored: false,
  realOperatorIdentityStored: false,
};

export const requiredTinyMonitoredPilotPrerequisites: readonly PhoneSmsTinyMonitoredPilotPrerequisite[] = [
  {
    id: 'ql_034_explicit_decision_gate',
    label: 'QL-034 explicit live enablement decision gate approved planning only',
    approved: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    enablesLiveBehavior: false,
    containsActualPhoneNumber: false,
    containsProviderCredential: false,
    containsWebhookSecretValue: false,
    containsCustomerData: false,
    containsLiveProviderPayload: false,
    containsRecording: false,
    containsTranscript: false,
    containsRealOperatorIdentity: false,
  },
  {
    id: 'ql_035_controlled_plan',
    label: 'QL-035 controlled live enablement plan completed as planning only',
    approved: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    enablesLiveBehavior: false,
    containsActualPhoneNumber: false,
    containsProviderCredential: false,
    containsWebhookSecretValue: false,
    containsCustomerData: false,
    containsLiveProviderPayload: false,
    containsRecording: false,
    containsTranscript: false,
    containsRealOperatorIdentity: false,
  },
  {
    id: 'ql_036_disabled_scaffold',
    label: 'QL-036 disabled implementation scaffold completed with live behavior blocked',
    approved: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    enablesLiveBehavior: false,
    containsActualPhoneNumber: false,
    containsProviderCredential: false,
    containsWebhookSecretValue: false,
    containsCustomerData: false,
    containsLiveProviderPayload: false,
    containsRecording: false,
    containsTranscript: false,
    containsRealOperatorIdentity: false,
  },
  {
    id: 'ql_037_disabled_verification',
    label: 'QL-037 disabled verification proved every scaffold surface remains disabled',
    approved: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    enablesLiveBehavior: false,
    containsActualPhoneNumber: false,
    containsProviderCredential: false,
    containsWebhookSecretValue: false,
    containsCustomerData: false,
    containsLiveProviderPayload: false,
    containsRecording: false,
    containsTranscript: false,
    containsRealOperatorIdentity: false,
  },
  {
    id: 'ql_038_manual_go_no_go_gate',
    label: 'QL-038 manual go/no-go gate approved tiny monitored pilot planning only',
    approved: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    enablesLiveBehavior: false,
    containsActualPhoneNumber: false,
    containsProviderCredential: false,
    containsWebhookSecretValue: false,
    containsCustomerData: false,
    containsLiveProviderPayload: false,
    containsRecording: false,
    containsTranscript: false,
    containsRealOperatorIdentity: false,
  },
];

export const requiredTinyMonitoredPilotControls: readonly PhoneSmsTinyMonitoredPilotControl[] = [
  {
    id: 'pilot_scope',
    label: 'Tiny pilot scope remains one controlled test number path with no existing-number forwarding or porting',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'Scope is documented but not executed by QL-039.',
  },
  {
    id: 'pilot_operator_coverage',
    label: 'Operator coverage must be confirmed before any future pilot window',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No real operator identity is stored in the repository.',
  },
  {
    id: 'pilot_manual_approval',
    label: 'Every future pilot event requires manual operator approval before any reply or follow-up action',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No automated send behavior is introduced.',
  },
  {
    id: 'pilot_provider_boundary',
    label: 'Provider account, number, credentials, and webhook secret values remain outside the repository',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'QL-039 stores no provider credentials, actual numbers, invoices, screenshots, or ownership documents.',
  },
  {
    id: 'pilot_callback_boundary',
    label: 'Provider callbacks stay disabled until a later disabled pilot implementation design is approved',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No callback route is enabled by this plan.',
  },
  {
    id: 'pilot_webhook_boundary',
    label: 'Phone webhooks stay disabled until a later build explicitly implements a disabled-by-default design',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'ENABLE_PHONE_WEBHOOKS remains false.',
  },
  {
    id: 'pilot_sms_boundary',
    label: 'SMS sending stays disabled; a future pilot can only plan manual-review messages',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'ENABLE_SMS remains false.',
  },
  {
    id: 'pilot_recording_boundary',
    label: 'Call recording stays disabled and no recordings or transcripts are retained',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'ENABLE_CALL_RECORDING remains false.',
  },
  {
    id: 'pilot_ai_boundary',
    label: 'AI drafts and AI auto-send stay disabled through QL-039',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'ENABLE_AI_DRAFTS and ENABLE_AI_AUTO_SEND remain false.',
  },
  {
    id: 'pilot_persistence_boundary',
    label: 'Persistence writes remain disabled; pilot evidence is not safe to persist',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No Supabase migration is added.',
  },
  {
    id: 'pilot_live_customer_boundary',
    label: 'Live customer reads and writes remain disabled',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No live customer access is granted.',
  },
  {
    id: 'pilot_rate_limit_boundary',
    label: 'Rate limits, replay protection, and idempotency must be defined before any future live pilot implementation',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'QL-039 only records the plan requirement.',
  },
  {
    id: 'pilot_replay_protection',
    label: 'Replay protection is required before any future provider callback can be considered',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No webhook secret value is stored here.',
  },
  {
    id: 'pilot_redaction_boundary',
    label: 'Logs and evidence must remain synthetic and redacted',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No phone numbers, names, provider payloads, or customer data are stored.',
  },
  {
    id: 'pilot_observability_boundary',
    label: 'Future observability must use redacted counters and status signals only',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'No transcripts, recordings, or live payloads are retained.',
  },
  {
    id: 'pilot_rollback_boundary',
    label: 'Rollback must be possible by disabling flags and disconnecting provider webhooks before any future pilot',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'Provider webhooks remain unconfigured now.',
  },
  {
    id: 'pilot_success_abort_criteria',
    label: 'Pilot success and abort criteria must be explicit before any future monitored test',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'A later build must define measurable stop conditions.',
  },
  {
    id: 'pilot_later_build_required',
    label: 'A later disabled pilot implementation design build is required before any pilot behavior exists',
    planned: true,
    blocksLiveExecution: true,
    requiresManualOperator: true,
    laterImplementationRequired: true,
    notes: 'QL-040 is required before any implementation shape can be reviewed.',
  },
];

function collectEnvironmentRejections(environment: PhoneSmsTinyMonitoredPilotSafeEnvironment): string[] {
  const rejections: string[] = [];

  if (!environment.syntheticOnly) rejections.push('environment must remain synthetic-only');
  if (!environment.redactedOnly) rejections.push('environment must remain redacted-only');
  if (environment.safeToPersist) rejections.push('pilot planning evidence must not be safe to persist');
  if (environment.liveEnablementAllowed) rejections.push('QL-039 must not allow live enablement');
  if (!environment.laterDisabledPilotImplementationBuildRequired) {
    rejections.push('a later disabled pilot implementation design build is required');
  }
  if (environment.providerWebhookConfigured) rejections.push('provider webhooks must remain unconfigured');
  if (environment.providerCallbackAllowed) rejections.push('provider callbacks must remain disabled');
  if (environment.phoneWebhookAllowed) rejections.push('phone webhooks must remain disabled');
  if (environment.smsSendAllowed) rejections.push('SMS sending must remain disabled');
  if (environment.callRecordingAllowed) rejections.push('call recording must remain disabled');
  if (environment.aiDraftAllowed) rejections.push('AI drafts must remain disabled');
  if (environment.autoSendAllowed) rejections.push('AI auto-send must remain disabled');
  if (environment.persistenceWrites) rejections.push('persistence writes must remain disabled');
  if (environment.liveCustomerRead) rejections.push('live customer reads must remain disabled');
  if (environment.liveCustomerWrite) rejections.push('live customer writes must remain disabled');
  if (environment.actualPhoneNumberStored) rejections.push('actual phone numbers must not be stored');
  if (environment.providerCredentialsStored) rejections.push('provider credentials must not be stored');
  if (environment.webhookSecretValueStored) rejections.push('webhook secret values must not be stored');
  if (environment.liveProviderPayloadStored) rejections.push('live provider payloads must not be stored');
  if (environment.realOperatorIdentityStored) rejections.push('real operator identities must not be stored');

  return rejections;
}

function collectPrerequisiteRejections(prerequisites: readonly PhoneSmsTinyMonitoredPilotPrerequisite[]): string[] {
  const rejections: string[] = [];
  const requiredIds = requiredTinyMonitoredPilotPrerequisites.map((item) => item.id);

  for (const requiredId of requiredIds) {
    const matching = prerequisites.find((item) => item.id === requiredId);
    if (!matching) {
      rejections.push(`missing prerequisite: ${requiredId}`);
      continue;
    }

    if (!matching.approved) rejections.push(`prerequisite not approved: ${requiredId}`);
    if (!matching.syntheticOnly) rejections.push(`prerequisite must be synthetic-only: ${requiredId}`);
    if (!matching.redactedOnly) rejections.push(`prerequisite must be redacted-only: ${requiredId}`);
    if (matching.safeToPersist) rejections.push(`prerequisite must not be safe to persist: ${requiredId}`);
    if (matching.enablesLiveBehavior) rejections.push(`prerequisite enables live behavior: ${requiredId}`);
    if (matching.containsActualPhoneNumber) rejections.push(`prerequisite contains actual phone number: ${requiredId}`);
    if (matching.containsProviderCredential) rejections.push(`prerequisite contains provider credential: ${requiredId}`);
    if (matching.containsWebhookSecretValue) rejections.push(`prerequisite contains webhook secret value: ${requiredId}`);
    if (matching.containsCustomerData) rejections.push(`prerequisite contains customer data: ${requiredId}`);
    if (matching.containsLiveProviderPayload) rejections.push(`prerequisite contains live provider payload: ${requiredId}`);
    if (matching.containsRecording) rejections.push(`prerequisite contains recording: ${requiredId}`);
    if (matching.containsTranscript) rejections.push(`prerequisite contains transcript: ${requiredId}`);
    if (matching.containsRealOperatorIdentity) rejections.push(`prerequisite contains real operator identity: ${requiredId}`);
  }

  return rejections;
}

function collectControlRejections(controls: readonly PhoneSmsTinyMonitoredPilotControl[]): string[] {
  const rejections: string[] = [];
  const requiredIds = requiredTinyMonitoredPilotControls.map((item) => item.id);

  for (const requiredId of requiredIds) {
    const matching = controls.find((item) => item.id === requiredId);
    if (!matching) {
      rejections.push(`missing pilot control: ${requiredId}`);
      continue;
    }

    if (!matching.planned) rejections.push(`pilot control is not planned: ${requiredId}`);
    if (!matching.blocksLiveExecution) rejections.push(`pilot control must block live execution: ${requiredId}`);
    if (!matching.requiresManualOperator) rejections.push(`pilot control must require manual operator review: ${requiredId}`);
    if (!matching.laterImplementationRequired) rejections.push(`pilot control must require later implementation: ${requiredId}`);
  }

  return rejections;
}

export function createPhoneSmsTinyMonitoredPilotPlanOutcome(
  input: PhoneSmsTinyMonitoredPilotPlanInput,
): PhoneSmsTinyMonitoredPilotPlanReport {
  const rejectionReasons = [
    ...collectEnvironmentRejections(input.environment),
    ...collectPrerequisiteRejections(input.prerequisites),
    ...collectControlRejections(input.controls),
  ];

  if (input.decision === 'continue_rework') {
    rejectionReasons.push('manual decision requires rework before tiny monitored pilot planning can proceed');
  }

  if (input.decision === 'remain_blocked') {
    rejectionReasons.push('manual decision keeps tiny monitored pilot planning blocked');
  }

  const approvedForLaterDisabledPilotImplementationDesign =
    input.decision === 'approve_later_disabled_pilot_implementation_design' && rejectionReasons.length === 0;

  const status: PhoneSmsTinyMonitoredPilotPlanStatus = approvedForLaterDisabledPilotImplementationDesign
    ? 'ready_for_later_disabled_pilot_implementation_design'
    : input.decision === 'continue_rework'
      ? 'blocked_rework_required'
      : 'blocked_pending_tiny_monitored_pilot_plan';

  return {
    build: 'QL-039',
    title: 'Phone/SMS Controlled Live Enablement Tiny Monitored Pilot Plan',
    reviewedBy: input.reviewedBy,
    reviewedAtIso: input.reviewedAtIso,
    outcome: {
      status,
      decision: input.decision,
      approvedForLaterDisabledPilotImplementationDesign,
      livePilotRemainsBlocked: true,
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
      laterDisabledPilotImplementationBuildRequired: true,
      rejectionReasons,
    },
    controls: input.controls,
    prerequisites: input.prerequisites,
    nextBuild: 'QL-040 — Phone/SMS Controlled Live Enablement Disabled Pilot Implementation Design',
  };
}

export function runPhoneSmsTinyMonitoredPilotPlan(): PhoneSmsTinyMonitoredPilotPlanReport {
  return createPhoneSmsTinyMonitoredPilotPlanOutcome({
    decision: 'approve_later_disabled_pilot_implementation_design',
    reviewedBy: 'synthetic-owner-review',
    reviewedAtIso: '2026-10-07T00:00:00.000Z',
    environment: safeTinyMonitoredPilotEnvironment,
    prerequisites: requiredTinyMonitoredPilotPrerequisites,
    controls: requiredTinyMonitoredPilotControls,
  });
}

export const tinyMonitoredPilotPlanVerificationCases = {
  approveLaterDisabledImplementationDesignOnly: runPhoneSmsTinyMonitoredPilotPlan(),
  continueRework: createPhoneSmsTinyMonitoredPilotPlanOutcome({
    decision: 'continue_rework',
    reviewedBy: 'synthetic-owner-review',
    reviewedAtIso: '2026-10-07T00:00:00.000Z',
    environment: safeTinyMonitoredPilotEnvironment,
    prerequisites: requiredTinyMonitoredPilotPrerequisites,
    controls: requiredTinyMonitoredPilotControls,
  }),
  remainBlocked: createPhoneSmsTinyMonitoredPilotPlanOutcome({
    decision: 'remain_blocked',
    reviewedBy: 'synthetic-owner-review',
    reviewedAtIso: '2026-10-07T00:00:00.000Z',
    environment: safeTinyMonitoredPilotEnvironment,
    prerequisites: requiredTinyMonitoredPilotPrerequisites,
    controls: requiredTinyMonitoredPilotControls,
  }),
  unsafeEnvironmentRejected: createPhoneSmsTinyMonitoredPilotPlanOutcome({
    decision: 'approve_later_disabled_pilot_implementation_design',
    reviewedBy: 'synthetic-owner-review',
    reviewedAtIso: '2026-10-07T00:00:00.000Z',
    environment: {
      ...safeTinyMonitoredPilotEnvironment,
      liveEnablementAllowed: true,
      phoneWebhookAllowed: true,
      smsSendAllowed: true,
      persistenceWrites: true,
    },
    prerequisites: requiredTinyMonitoredPilotPrerequisites,
    controls: requiredTinyMonitoredPilotControls,
  }),
  unsafePrerequisiteRejected: createPhoneSmsTinyMonitoredPilotPlanOutcome({
    decision: 'approve_later_disabled_pilot_implementation_design',
    reviewedBy: 'synthetic-owner-review',
    reviewedAtIso: '2026-10-07T00:00:00.000Z',
    environment: safeTinyMonitoredPilotEnvironment,
    prerequisites: requiredTinyMonitoredPilotPrerequisites.map((item) =>
      item.id === 'ql_038_manual_go_no_go_gate'
        ? {
            ...item,
            safeToPersist: true,
            containsActualPhoneNumber: true,
            containsCustomerData: true,
          }
        : item,
    ),
    controls: requiredTinyMonitoredPilotControls,
  }),
  missingControlRejected: createPhoneSmsTinyMonitoredPilotPlanOutcome({
    decision: 'approve_later_disabled_pilot_implementation_design',
    reviewedBy: 'synthetic-owner-review',
    reviewedAtIso: '2026-10-07T00:00:00.000Z',
    environment: safeTinyMonitoredPilotEnvironment,
    prerequisites: requiredTinyMonitoredPilotPrerequisites,
    controls: requiredTinyMonitoredPilotControls.filter((control) => control.id !== 'pilot_rollback_boundary'),
  }),
} as const;
