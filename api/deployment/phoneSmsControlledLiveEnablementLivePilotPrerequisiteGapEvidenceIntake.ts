export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeStatus =
  | 'live_pilot_prerequisite_gap_evidence_intake_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_gap_evidence_item'
  | 'blocked_failed_gap_evidence_item'
  | 'blocked_unsafe_gap_evidence'
  | 'blocked_non_intake_scope';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeDecision =
  | 'approve_live_pilot_prerequisite_gap_evidence_review'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItemId =
  | 'owner_manual_approval_gap_evidence_intake'
  | 'provider_setup_prerequisite_gap_evidence_intake'
  | 'provider_disabled_mode_gap_evidence_intake'
  | 'phone_number_ownership_gap_evidence_intake'
  | 'sms_consent_policy_gap_evidence_intake'
  | 'stop_start_help_policy_gap_evidence_intake'
  | 'call_recording_notice_policy_gap_evidence_intake'
  | 'staff_access_control_gap_evidence_intake'
  | 'rollback_kill_switch_gap_evidence_intake'
  | 'rate_limit_replay_control_gap_evidence_intake'
  | 'audit_redaction_control_gap_evidence_intake'
  | 'customer_data_boundary_gap_evidence_intake'
  | 'provider_callback_disabled_gap_evidence_intake'
  | 'live_phone_webhook_disabled_gap_evidence_intake'
  | 'sms_sending_disabled_gap_evidence_intake'
  | 'recording_disabled_gap_evidence_intake'
  | 'ai_features_disabled_gap_evidence_intake'
  | 'persistence_write_disabled_gap_evidence_intake'
  | 'live_pilot_runtime_disabled_gap_evidence_intake'
  | 'production_proof_gap_evidence_intake';

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeEnvironment {
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
  readonly ql051PrerequisiteEvidenceIntakeReady: boolean;
  readonly ql052PrerequisiteEvidenceReviewReady: boolean;
  readonly ql053PrerequisiteGapClosurePlanReady: boolean;
  readonly ql054PrerequisiteGapClosureReviewReady: boolean;
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

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItem {
  readonly id: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItemId;
  readonly gapEvidenceCollected: boolean;
  readonly readyForReview: boolean;
  readonly intakeOnly: boolean;
  readonly ownerReviewRequired: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly noLiveData: boolean;
  readonly noProviderDelivery: boolean;
  readonly noRuntimeExecution: boolean;
  readonly noPersistenceWrites: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeInput {
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeDecision;
  readonly environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeEnvironment;
  readonly gapEvidenceItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItem[];
  readonly prerequisiteGapEvidenceIntakeOnly: true;
  readonly prerequisiteGapEvidenceSyntheticOnly: boolean;
  readonly prerequisiteGapEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-056-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-review';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeReport {
  readonly status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeStatus;
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeDecision;
  readonly prerequisiteGapEvidenceIntakeReady: boolean;
  readonly approvedForLivePilotPrerequisiteGapEvidenceReview: boolean;
  readonly prerequisiteGapEvidenceIntakeOnly: true;
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
  readonly requiredNextBuild: 'QL-056-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-review';
  readonly blockers: readonly string[];
  readonly collectedGapEvidenceItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItemId[];
}

const requiredGapEvidenceItemIds: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItemId[] = [
  'owner_manual_approval_gap_evidence_intake',
  'provider_setup_prerequisite_gap_evidence_intake',
  'provider_disabled_mode_gap_evidence_intake',
  'phone_number_ownership_gap_evidence_intake',
  'sms_consent_policy_gap_evidence_intake',
  'stop_start_help_policy_gap_evidence_intake',
  'call_recording_notice_policy_gap_evidence_intake',
  'staff_access_control_gap_evidence_intake',
  'rollback_kill_switch_gap_evidence_intake',
  'rate_limit_replay_control_gap_evidence_intake',
  'audit_redaction_control_gap_evidence_intake',
  'customer_data_boundary_gap_evidence_intake',
  'provider_callback_disabled_gap_evidence_intake',
  'live_phone_webhook_disabled_gap_evidence_intake',
  'sms_sending_disabled_gap_evidence_intake',
  'recording_disabled_gap_evidence_intake',
  'ai_features_disabled_gap_evidence_intake',
  'persistence_write_disabled_gap_evidence_intake',
  'live_pilot_runtime_disabled_gap_evidence_intake',
  'production_proof_gap_evidence_intake',
];

export const safeLivePilotPrerequisiteGapEvidenceIntakeEnvironment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeEnvironment = {
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
  ql051PrerequisiteEvidenceIntakeReady: true,
  ql052PrerequisiteEvidenceReviewReady: true,
  ql053PrerequisiteGapClosurePlanReady: true,
  ql054PrerequisiteGapClosureReviewReady: true,
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

export const safeLivePilotPrerequisiteGapEvidenceItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItem[] =
  requiredGapEvidenceItemIds.map((id) => ({
    id,
    gapEvidenceCollected: true,
    readyForReview: true,
    intakeOnly: true,
    ownerReviewRequired: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    noLiveData: true,
    noProviderDelivery: true,
    noRuntimeExecution: true,
    noPersistenceWrites: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-gap-evidence-intake-${id}`,
  }));

export const safeLivePilotPrerequisiteGapEvidenceIntakeInput: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeInput = {
  decision: 'approve_live_pilot_prerequisite_gap_evidence_review',
  environment: safeLivePilotPrerequisiteGapEvidenceIntakeEnvironment,
  gapEvidenceItems: safeLivePilotPrerequisiteGapEvidenceItems,
  prerequisiteGapEvidenceIntakeOnly: true,
  prerequisiteGapEvidenceSyntheticOnly: true,
  prerequisiteGapEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-056-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-review',
  notes: [
    'QL-055 intakes gap evidence for review only.',
    'QL-055 does not connect a provider, attach a live number, start live pilot runtime, or enable delivery.',
  ],
};

function hasUnsafeEvidenceLabel(value: string): boolean {
  return !value.startsWith('synthetic-redacted-gap-evidence-intake-') || value.includes('real-');
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeInput): string[] {
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
  if (!environment.ql051PrerequisiteEvidenceIntakeReady) blockers.push('QL-051 prerequisite evidence intake readiness is missing.');
  if (!environment.ql052PrerequisiteEvidenceReviewReady) blockers.push('QL-052 prerequisite evidence review readiness is missing.');
  if (!environment.ql053PrerequisiteGapClosurePlanReady) blockers.push('QL-053 prerequisite gap closure plan readiness is missing.');
  if (!environment.ql054PrerequisiteGapClosureReviewReady) blockers.push('QL-054 prerequisite gap closure review readiness is missing.');
  if (!input.prerequisiteGapEvidenceSyntheticOnly || !input.prerequisiteGapEvidenceRedactedOnly) blockers.push('Gap evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeEnvironment): string[] {
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
  if (environment.providerAccountConnected) blockers.push('Provider account connection must remain disabled in QL-055.');
  if (environment.providerLiveNumberAttached) blockers.push('Provider live number attachment must remain disabled in QL-055.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectGapEvidenceItemBlockers(items: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredGapEvidenceItemIds) {
    if (!seen.has(required)) blockers.push(`Missing prerequisite gap evidence item: ${required}.`);
  }

  for (const item of items) {
    if (!item.gapEvidenceCollected) blockers.push(`${item.id} gap evidence must be collected.`);
    if (!item.readyForReview) blockers.push(`${item.id} must be ready for review.`);
    if (!item.intakeOnly) blockers.push(`${item.id} must remain intake-only.`);
    if (!item.ownerReviewRequired) blockers.push(`${item.id} must retain owner review requirement.`);
    if (!item.syntheticEvidenceOnly || !item.redactedEvidenceOnly || item.safeToPersist) blockers.push(`${item.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (!item.noLiveData) blockers.push(`${item.id} must not include live data.`);
    if (!item.noProviderDelivery) blockers.push(`${item.id} must not enable provider delivery.`);
    if (!item.noRuntimeExecution) blockers.push(`${item.id} must not execute runtime behavior.`);
    if (!item.noPersistenceWrites) blockers.push(`${item.id} must not write persistence.`);
    if (hasUnsafeEvidenceLabel(item.evidenceLabel)) blockers.push(`${item.id} evidence label is not a synthetic redacted gap-evidence label.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntake(
  input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeInput,
): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const gapEvidenceItemBlockers = collectGapEvidenceItemBlockers(input.gapEvidenceItems);
  const scopeBlockers = input.prerequisiteGapEvidenceIntakeOnly ? [] : ['QL-055 must remain prerequisite gap evidence intake only.'];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...gapEvidenceItemBlockers, ...scopeBlockers];
  const collectedGapEvidenceItems = input.gapEvidenceItems.filter((item) => item.gapEvidenceCollected).map((item) => item.id);

  let status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeStatus = 'live_pilot_prerequisite_gap_evidence_intake_ready';
  if (prerequisiteBlockers.length > 0) status = 'blocked_pending_prerequisites';
  else if (environmentBlockers.length > 0) status = 'blocked_unsafe_environment';
  else if (gapEvidenceItemBlockers.some((blocker) => blocker.startsWith('Missing prerequisite gap evidence item:'))) status = 'blocked_missing_gap_evidence_item';
  else if (gapEvidenceItemBlockers.some((blocker) => blocker.includes('synthetic redacted gap-evidence label'))) status = 'blocked_unsafe_gap_evidence';
  else if (gapEvidenceItemBlockers.length > 0) status = 'blocked_failed_gap_evidence_item';
  else if (scopeBlockers.length > 0) status = 'blocked_non_intake_scope';

  const approvedForLivePilotPrerequisiteGapEvidenceReview =
    status === 'live_pilot_prerequisite_gap_evidence_intake_ready' &&
    input.decision === 'approve_live_pilot_prerequisite_gap_evidence_review';

  return {
    status,
    decision: input.decision,
    prerequisiteGapEvidenceIntakeReady: status === 'live_pilot_prerequisite_gap_evidence_intake_ready',
    approvedForLivePilotPrerequisiteGapEvidenceReview,
    prerequisiteGapEvidenceIntakeOnly: true,
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
    requiredNextBuild: 'QL-056-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-review',
    blockers,
    collectedGapEvidenceItems,
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeReview(): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntakeReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntake(
    safeLivePilotPrerequisiteGapEvidenceIntakeInput,
  );
}
