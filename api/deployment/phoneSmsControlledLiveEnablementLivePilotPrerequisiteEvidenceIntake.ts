export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeStatus =
  | 'live_pilot_prerequisite_evidence_intake_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_evidence_item'
  | 'blocked_failed_evidence_item'
  | 'blocked_unsafe_evidence'
  | 'blocked_non_intake_scope';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeDecision =
  | 'approve_live_pilot_prerequisite_evidence_review'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItemId =
  | 'owner_manual_approval_evidence_intake'
  | 'provider_setup_prerequisite_evidence_intake'
  | 'provider_disabled_mode_evidence_intake'
  | 'phone_number_ownership_evidence_intake'
  | 'sms_consent_policy_evidence_intake'
  | 'stop_start_help_policy_evidence_intake'
  | 'call_recording_notice_policy_evidence_intake'
  | 'staff_access_control_evidence_intake'
  | 'rollback_kill_switch_evidence_intake'
  | 'rate_limit_replay_control_evidence_intake'
  | 'audit_redaction_control_evidence_intake'
  | 'customer_data_boundary_evidence_intake'
  | 'provider_callback_disabled_evidence_intake'
  | 'live_phone_webhook_disabled_evidence_intake'
  | 'sms_sending_disabled_evidence_intake'
  | 'recording_disabled_evidence_intake'
  | 'ai_features_disabled_evidence_intake'
  | 'persistence_write_disabled_evidence_intake'
  | 'live_pilot_runtime_disabled_evidence_intake'
  | 'production_proof_evidence_intake';

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeEnvironment {
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
  readonly ql044DisabledDryRunCasesReady: boolean;
  readonly ql045DisabledDryRunResultReviewReady: boolean;
  readonly ql046DisabledClosurePlanReady: boolean;
  readonly ql047DisabledClosureReviewReady: boolean;
  readonly ql048DisabledArchiveRetentionReviewReady: boolean;
  readonly ql049FinalDisabledClosureGateReady: boolean;
  readonly ql050PostClosureReadinessDecisionGateReady: boolean;
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
  readonly dryRunExecutionAllowed: boolean;
  readonly providerDeliveryAllowed: boolean;
  readonly archiveWritesAllowed: boolean;
  readonly retentionPolicyWritesAllowed: boolean;
  readonly livePilotRuntimeAllowed: boolean;
  readonly providerAccountConnected: boolean;
  readonly providerLiveNumberAttached: boolean;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: boolean;
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItem {
  readonly id: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItemId;
  readonly collected: boolean;
  readonly readyForReview: boolean;
  readonly intakeOnly: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly noLiveData: boolean;
  readonly noProviderDelivery: boolean;
  readonly noRuntimeExecution: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeInput {
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeDecision;
  readonly environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeEnvironment;
  readonly evidenceItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItem[];
  readonly prerequisiteEvidenceIntakeOnly: true;
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-052-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeReport {
  readonly status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeStatus;
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeDecision;
  readonly prerequisiteEvidenceIntakeReady: boolean;
  readonly approvedForLivePilotPrerequisiteEvidenceReview: boolean;
  readonly prerequisiteEvidenceIntakeOnly: true;
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
  readonly dryRunExecutionAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionPolicyWritesAllowed: false;
  readonly providerAccountConnected: false;
  readonly providerLiveNumberAttached: false;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-052-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review';
  readonly blockers: readonly string[];
  readonly collectedItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItemId[];
}

const requiredEvidenceItemIds: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItemId[] = [
  'owner_manual_approval_evidence_intake',
  'provider_setup_prerequisite_evidence_intake',
  'provider_disabled_mode_evidence_intake',
  'phone_number_ownership_evidence_intake',
  'sms_consent_policy_evidence_intake',
  'stop_start_help_policy_evidence_intake',
  'call_recording_notice_policy_evidence_intake',
  'staff_access_control_evidence_intake',
  'rollback_kill_switch_evidence_intake',
  'rate_limit_replay_control_evidence_intake',
  'audit_redaction_control_evidence_intake',
  'customer_data_boundary_evidence_intake',
  'provider_callback_disabled_evidence_intake',
  'live_phone_webhook_disabled_evidence_intake',
  'sms_sending_disabled_evidence_intake',
  'recording_disabled_evidence_intake',
  'ai_features_disabled_evidence_intake',
  'persistence_write_disabled_evidence_intake',
  'live_pilot_runtime_disabled_evidence_intake',
  'production_proof_evidence_intake',
];

export const safeLivePilotPrerequisiteEvidenceIntakeEnvironment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeEnvironment = {
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
  ql044DisabledDryRunCasesReady: true,
  ql045DisabledDryRunResultReviewReady: true,
  ql046DisabledClosurePlanReady: true,
  ql047DisabledClosureReviewReady: true,
  ql048DisabledArchiveRetentionReviewReady: true,
  ql049FinalDisabledClosureGateReady: true,
  ql050PostClosureReadinessDecisionGateReady: true,
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
  dryRunExecutionAllowed: false,
  providerDeliveryAllowed: false,
  archiveWritesAllowed: false,
  retentionPolicyWritesAllowed: false,
  livePilotRuntimeAllowed: false,
  providerAccountConnected: false,
  providerLiveNumberAttached: false,
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
};

export const safeLivePilotPrerequisiteEvidenceItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItem[] =
  requiredEvidenceItemIds.map((id) => ({
    id,
    collected: true,
    readyForReview: true,
    intakeOnly: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    noLiveData: true,
    noProviderDelivery: true,
    noRuntimeExecution: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-prerequisite-evidence-intake-${id}`,
  }));

export const safeLivePilotPrerequisiteEvidenceIntakeInput: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeInput = {
  decision: 'approve_live_pilot_prerequisite_evidence_review',
  environment: safeLivePilotPrerequisiteEvidenceIntakeEnvironment,
  evidenceItems: safeLivePilotPrerequisiteEvidenceItems,
  prerequisiteEvidenceIntakeOnly: true,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-052-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review',
  notes: [
    'QL-051 collects prerequisite evidence for review only.',
    'QL-051 does not connect a provider, start live pilot runtime, or enable delivery.',
  ],
};

function hasUnsafeEvidenceLabel(value: string): boolean {
  return !value.startsWith('synthetic-redacted-') || value.includes('unredacted') || value.includes('real-');
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeInput): string[] {
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
  if (!environment.ql044DisabledDryRunCasesReady) blockers.push('QL-044 disabled dry-run case readiness is missing.');
  if (!environment.ql045DisabledDryRunResultReviewReady) blockers.push('QL-045 disabled dry-run result review readiness is missing.');
  if (!environment.ql046DisabledClosurePlanReady) blockers.push('QL-046 disabled closure plan readiness is missing.');
  if (!environment.ql047DisabledClosureReviewReady) blockers.push('QL-047 disabled closure review readiness is missing.');
  if (!environment.ql048DisabledArchiveRetentionReviewReady) blockers.push('QL-048 disabled archive/retention review readiness is missing.');
  if (!environment.ql049FinalDisabledClosureGateReady) blockers.push('QL-049 final disabled closure gate readiness is missing.');
  if (!environment.ql050PostClosureReadinessDecisionGateReady) blockers.push('QL-050 post-closure readiness decision gate readiness is missing.');
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeEnvironment): string[] {
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
  if (environment.dryRunExecutionAllowed) blockers.push('Dry-run execution must remain disabled.');
  if (environment.providerDeliveryAllowed) blockers.push('Provider delivery must remain disabled.');
  if (environment.archiveWritesAllowed) blockers.push('Archive writes must remain disabled.');
  if (environment.retentionPolicyWritesAllowed) blockers.push('Retention policy writes must remain disabled.');
  if (environment.livePilotRuntimeAllowed) blockers.push('Live pilot runtime must remain disabled.');
  if (environment.providerAccountConnected) blockers.push('Provider account connection must remain disabled in QL-051.');
  if (environment.providerLiveNumberAttached) blockers.push('Provider live number attachment must remain disabled in QL-051.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectEvidenceItemBlockers(items: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredEvidenceItemIds) {
    if (!seen.has(required)) blockers.push(`Missing prerequisite evidence item: ${required}.`);
  }

  for (const item of items) {
    if (!item.collected) blockers.push(`${item.id} must be collected.`);
    if (!item.readyForReview) blockers.push(`${item.id} must be ready for review.`);
    if (!item.intakeOnly) blockers.push(`${item.id} must remain intake-only.`);
    if (!item.syntheticEvidenceOnly || !item.redactedEvidenceOnly || item.safeToPersist) blockers.push(`${item.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (!item.noLiveData) blockers.push(`${item.id} must not include live data.`);
    if (!item.noProviderDelivery) blockers.push(`${item.id} must not enable provider delivery.`);
    if (!item.noRuntimeExecution) blockers.push(`${item.id} must not execute runtime behavior.`);
    if (hasUnsafeEvidenceLabel(item.evidenceLabel)) blockers.push(`${item.id} evidence label is not a synthetic redacted label.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntake(
  input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeInput,
): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const evidenceItemBlockers = collectEvidenceItemBlockers(input.evidenceItems);
  const scopeBlockers = input.prerequisiteEvidenceIntakeOnly ? [] : ['QL-051 must remain prerequisite evidence intake only.'];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...evidenceItemBlockers, ...scopeBlockers];

  const status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : evidenceItemBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_evidence_item'
          : evidenceItemBlockers.some((blocker) => blocker.includes('synthetic'))
            ? 'blocked_unsafe_evidence'
            : evidenceItemBlockers.length > 0
              ? 'blocked_failed_evidence_item'
              : scopeBlockers.length > 0
                ? 'blocked_non_intake_scope'
                : 'live_pilot_prerequisite_evidence_intake_ready';

  const approved = status === 'live_pilot_prerequisite_evidence_intake_ready' && input.decision === 'approve_live_pilot_prerequisite_evidence_review';

  return {
    status,
    decision: input.decision,
    prerequisiteEvidenceIntakeReady: approved,
    approvedForLivePilotPrerequisiteEvidenceReview: approved,
    prerequisiteEvidenceIntakeOnly: true,
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
    dryRunExecutionAllowed: false,
    providerDeliveryAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    providerAccountConnected: false,
    providerLiveNumberAttached: false,
    syntheticOnly: input.environment.syntheticOnly,
    redactedOnly: input.environment.redactedOnly,
    safeToPersist: false,
    requiredNextBuild: 'QL-052-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review',
    blockers,
    collectedItems: input.evidenceItems.map((item) => item.id),
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntake(): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntakeReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntake(safeLivePilotPrerequisiteEvidenceIntakeInput);
}
