export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanStatus =
  | 'live_pilot_prerequisite_gap_closure_plan_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_gap_closure_item'
  | 'blocked_unsafe_gap_closure_item'
  | 'blocked_unsafe_evidence'
  | 'blocked_non_plan_scope';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanDecision =
  | 'approve_live_pilot_prerequisite_gap_closure_review'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItemId =
  | 'owner_manual_approval_gap_closure_plan'
  | 'provider_setup_prerequisite_gap_closure_plan'
  | 'provider_disabled_mode_gap_closure_plan'
  | 'phone_number_ownership_gap_closure_plan'
  | 'sms_consent_policy_gap_closure_plan'
  | 'stop_start_help_policy_gap_closure_plan'
  | 'call_recording_notice_policy_gap_closure_plan'
  | 'staff_access_control_gap_closure_plan'
  | 'rollback_kill_switch_gap_closure_plan'
  | 'rate_limit_replay_control_gap_closure_plan'
  | 'audit_redaction_control_gap_closure_plan'
  | 'customer_data_boundary_gap_closure_plan'
  | 'provider_callback_disabled_gap_closure_plan'
  | 'live_phone_webhook_disabled_gap_closure_plan'
  | 'sms_sending_disabled_gap_closure_plan'
  | 'recording_disabled_gap_closure_plan'
  | 'ai_features_disabled_gap_closure_plan'
  | 'persistence_write_disabled_gap_closure_plan'
  | 'live_pilot_runtime_disabled_gap_closure_plan'
  | 'production_proof_gap_closure_plan';

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanEnvironment {
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

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItem {
  readonly id: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItemId;
  readonly gapIdentified: boolean;
  readonly closureActionPlanned: boolean;
  readonly ownerReviewRequired: boolean;
  readonly planOnly: boolean;
  readonly reviewOnlyNext: boolean;
  readonly syntheticPlanOnly: boolean;
  readonly redactedPlanOnly: boolean;
  readonly noLiveData: boolean;
  readonly noProviderDelivery: boolean;
  readonly noRuntimeExecution: boolean;
  readonly noPersistenceWrites: boolean;
  readonly safeToPersist: false;
  readonly closureLabel: string;
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanInput {
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanDecision;
  readonly environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanEnvironment;
  readonly gapClosureItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItem[];
  readonly prerequisiteGapClosurePlanOnly: true;
  readonly prerequisiteGapClosureSyntheticOnly: boolean;
  readonly prerequisiteGapClosureRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-054-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-review';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanReport {
  readonly status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanStatus;
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanDecision;
  readonly prerequisiteGapClosurePlanReady: boolean;
  readonly approvedForLivePilotPrerequisiteGapClosureReview: boolean;
  readonly prerequisiteGapClosurePlanOnly: true;
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
  readonly requiredNextBuild: 'QL-054-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-review';
  readonly blockers: readonly string[];
  readonly plannedGapClosures: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItemId[];
}

const requiredGapClosureItemIds: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItemId[] = [
  'owner_manual_approval_gap_closure_plan',
  'provider_setup_prerequisite_gap_closure_plan',
  'provider_disabled_mode_gap_closure_plan',
  'phone_number_ownership_gap_closure_plan',
  'sms_consent_policy_gap_closure_plan',
  'stop_start_help_policy_gap_closure_plan',
  'call_recording_notice_policy_gap_closure_plan',
  'staff_access_control_gap_closure_plan',
  'rollback_kill_switch_gap_closure_plan',
  'rate_limit_replay_control_gap_closure_plan',
  'audit_redaction_control_gap_closure_plan',
  'customer_data_boundary_gap_closure_plan',
  'provider_callback_disabled_gap_closure_plan',
  'live_phone_webhook_disabled_gap_closure_plan',
  'sms_sending_disabled_gap_closure_plan',
  'recording_disabled_gap_closure_plan',
  'ai_features_disabled_gap_closure_plan',
  'persistence_write_disabled_gap_closure_plan',
  'live_pilot_runtime_disabled_gap_closure_plan',
  'production_proof_gap_closure_plan',
];

export const safeLivePilotPrerequisiteGapClosurePlanEnvironment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanEnvironment = {
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

export const safeLivePilotPrerequisiteGapClosureItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItem[] =
  requiredGapClosureItemIds.map((id) => ({
    id,
    gapIdentified: true,
    closureActionPlanned: true,
    ownerReviewRequired: true,
    planOnly: true,
    reviewOnlyNext: true,
    syntheticPlanOnly: true,
    redactedPlanOnly: true,
    noLiveData: true,
    noProviderDelivery: true,
    noRuntimeExecution: true,
    noPersistenceWrites: true,
    safeToPersist: false,
    closureLabel: `synthetic-redacted-prerequisite-gap-closure-plan-${id}`,
  }));

export const safeLivePilotPrerequisiteGapClosurePlanInput: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanInput = {
  decision: 'approve_live_pilot_prerequisite_gap_closure_review',
  environment: safeLivePilotPrerequisiteGapClosurePlanEnvironment,
  gapClosureItems: safeLivePilotPrerequisiteGapClosureItems,
  prerequisiteGapClosurePlanOnly: true,
  prerequisiteGapClosureSyntheticOnly: true,
  prerequisiteGapClosureRedactedOnly: true,
  requiredNextBuild: 'QL-054-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-review',
  notes: [
    'QL-053 plans closure actions for prerequisite evidence gaps only.',
    'QL-053 does not connect a provider, start live pilot runtime, or enable delivery.',
  ],
};

function hasUnsafeClosureLabel(value: string): boolean {
  return !value.startsWith('synthetic-redacted-') || value.includes('unredacted') || value.includes('real-');
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanInput): string[] {
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
  if (!input.prerequisiteGapClosureSyntheticOnly || !input.prerequisiteGapClosureRedactedOnly) blockers.push('Prerequisite gap closure plan must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanEnvironment): string[] {
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
  if (environment.providerAccountConnected) blockers.push('Provider account connection must remain disabled in QL-053.');
  if (environment.providerLiveNumberAttached) blockers.push('Provider live number attachment must remain disabled in QL-053.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectGapClosureItemBlockers(items: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredGapClosureItemIds) {
    if (!seen.has(required)) blockers.push(`Missing prerequisite gap closure item: ${required}.`);
  }

  for (const item of items) {
    if (!item.gapIdentified) blockers.push(`${item.id} must identify the reviewed gap.`);
    if (!item.closureActionPlanned) blockers.push(`${item.id} must include a planned closure action.`);
    if (!item.ownerReviewRequired) blockers.push(`${item.id} must require owner review before any future live path.`);
    if (!item.planOnly || !item.reviewOnlyNext) blockers.push(`${item.id} must remain plan-only with review-only next step.`);
    if (!item.syntheticPlanOnly || !item.redactedPlanOnly || item.safeToPersist) blockers.push(`${item.id} plan evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (!item.noLiveData) blockers.push(`${item.id} must not include live data.`);
    if (!item.noProviderDelivery) blockers.push(`${item.id} must not enable provider delivery.`);
    if (!item.noRuntimeExecution) blockers.push(`${item.id} must not execute runtime behavior.`);
    if (!item.noPersistenceWrites) blockers.push(`${item.id} must not write persistence.`);
    if (hasUnsafeClosureLabel(item.closureLabel)) blockers.push(`${item.id} closure label is not a synthetic redacted label.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlan(
  input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanInput,
): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const itemBlockers = collectGapClosureItemBlockers(input.gapClosureItems);
  const scopeBlockers = input.prerequisiteGapClosurePlanOnly ? [] : ['QL-053 must remain prerequisite gap closure planning only.'];
  const decisionBlockers = input.decision === 'approve_live_pilot_prerequisite_gap_closure_review' ? [] : ['QL-053 requires approval only for the next prerequisite gap closure review.'];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...itemBlockers, ...scopeBlockers, ...decisionBlockers];

  const status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : itemBlockers.some((blocker) => blocker.startsWith('Missing prerequisite gap closure item'))
          ? 'blocked_missing_gap_closure_item'
          : itemBlockers.length > 0
            ? 'blocked_unsafe_gap_closure_item'
            : scopeBlockers.length > 0
              ? 'blocked_non_plan_scope'
              : decisionBlockers.length > 0
                ? 'blocked_pending_prerequisites'
                : input.prerequisiteGapClosureSyntheticOnly && input.prerequisiteGapClosureRedactedOnly
                  ? 'live_pilot_prerequisite_gap_closure_plan_ready'
                  : 'blocked_unsafe_evidence';

  const ready = status === 'live_pilot_prerequisite_gap_closure_plan_ready';

  return {
    status,
    decision: input.decision,
    prerequisiteGapClosurePlanReady: ready,
    approvedForLivePilotPrerequisiteGapClosureReview: ready,
    prerequisiteGapClosurePlanOnly: true,
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
    syntheticOnly: input.environment.syntheticOnly && input.prerequisiteGapClosureSyntheticOnly,
    redactedOnly: input.environment.redactedOnly && input.prerequisiteGapClosureRedactedOnly,
    safeToPersist: false,
    requiredNextBuild: 'QL-054-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-review',
    blockers,
    plannedGapClosures: input.gapClosureItems.filter((item) => item.closureActionPlanned).map((item) => item.id),
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanReview(): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlanReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosurePlan(safeLivePilotPrerequisiteGapClosurePlanInput);
}
