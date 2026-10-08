export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewStatus =
  | 'live_pilot_prerequisite_gap_closure_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_gap_review_item'
  | 'blocked_failed_gap_review_item'
  | 'blocked_unsafe_evidence'
  | 'blocked_non_review_scope';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewDecision =
  | 'approve_live_pilot_prerequisite_gap_evidence_intake'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItemId =
  | 'owner_manual_approval_gap_closure_review'
  | 'provider_setup_prerequisite_gap_closure_review'
  | 'provider_disabled_mode_gap_closure_review'
  | 'phone_number_ownership_gap_closure_review'
  | 'sms_consent_policy_gap_closure_review'
  | 'stop_start_help_policy_gap_closure_review'
  | 'call_recording_notice_policy_gap_closure_review'
  | 'staff_access_control_gap_closure_review'
  | 'rollback_kill_switch_gap_closure_review'
  | 'rate_limit_replay_control_gap_closure_review'
  | 'audit_redaction_control_gap_closure_review'
  | 'customer_data_boundary_gap_closure_review'
  | 'provider_callback_disabled_gap_closure_review'
  | 'live_phone_webhook_disabled_gap_closure_review'
  | 'sms_sending_disabled_gap_closure_review'
  | 'recording_disabled_gap_closure_review'
  | 'ai_features_disabled_gap_closure_review'
  | 'persistence_write_disabled_gap_closure_review'
  | 'live_pilot_runtime_disabled_gap_closure_review'
  | 'production_proof_gap_closure_review';

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewEnvironment {
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

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItem {
  readonly id: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItemId;
  readonly planPresent: boolean;
  readonly reviewed: boolean;
  readonly passed: boolean;
  readonly reviewOnly: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly noLiveEnablementApproval: boolean;
  readonly noLivePilotRuntime: boolean;
  readonly noProviderConnection: boolean;
  readonly noProviderDelivery: boolean;
  readonly noPersistenceWrites: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewInput {
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewDecision;
  readonly environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewEnvironment;
  readonly reviewItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItem[];
  readonly prerequisiteGapClosureReviewOnly: true;
  readonly prerequisiteGapClosureReviewSyntheticOnly: boolean;
  readonly prerequisiteGapClosureReviewRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-055-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewReport {
  readonly status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewStatus;
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewDecision;
  readonly prerequisiteGapClosureReviewReady: boolean;
  readonly approvedForLivePilotPrerequisiteGapEvidenceIntake: boolean;
  readonly prerequisiteGapClosureReviewOnly: true;
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
  readonly requiredNextBuild: 'QL-055-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake';
  readonly blockers: readonly string[];
  readonly reviewedItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItemId[];
}

const requiredGapClosureReviewItemIds: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItemId[] = [
  'owner_manual_approval_gap_closure_review',
  'provider_setup_prerequisite_gap_closure_review',
  'provider_disabled_mode_gap_closure_review',
  'phone_number_ownership_gap_closure_review',
  'sms_consent_policy_gap_closure_review',
  'stop_start_help_policy_gap_closure_review',
  'call_recording_notice_policy_gap_closure_review',
  'staff_access_control_gap_closure_review',
  'rollback_kill_switch_gap_closure_review',
  'rate_limit_replay_control_gap_closure_review',
  'audit_redaction_control_gap_closure_review',
  'customer_data_boundary_gap_closure_review',
  'provider_callback_disabled_gap_closure_review',
  'live_phone_webhook_disabled_gap_closure_review',
  'sms_sending_disabled_gap_closure_review',
  'recording_disabled_gap_closure_review',
  'ai_features_disabled_gap_closure_review',
  'persistence_write_disabled_gap_closure_review',
  'live_pilot_runtime_disabled_gap_closure_review',
  'production_proof_gap_closure_review',
];

export const safeLivePilotPrerequisiteGapClosureReviewEnvironment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewEnvironment = {
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

export const safeLivePilotPrerequisiteGapClosureReviewItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItem[] =
  requiredGapClosureReviewItemIds.map((id) => ({
    id,
    planPresent: true,
    reviewed: true,
    passed: true,
    reviewOnly: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    noLiveEnablementApproval: true,
    noLivePilotRuntime: true,
    noProviderConnection: true,
    noProviderDelivery: true,
    noPersistenceWrites: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-gap-closure-review-${id}`,
  }));

export const safeLivePilotPrerequisiteGapClosureReviewInput: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewInput = {
  decision: 'approve_live_pilot_prerequisite_gap_evidence_intake',
  environment: safeLivePilotPrerequisiteGapClosureReviewEnvironment,
  reviewItems: safeLivePilotPrerequisiteGapClosureReviewItems,
  prerequisiteGapClosureReviewOnly: true,
  prerequisiteGapClosureReviewSyntheticOnly: true,
  prerequisiteGapClosureReviewRedactedOnly: true,
  requiredNextBuild: 'QL-055-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake',
  notes: [
    'QL-054 reviews prerequisite gap-closure plans only.',
    'QL-054 does not connect a provider, attach a live number, enable delivery, or start live pilot runtime.',
  ],
};

function hasUnsafeEvidenceLabel(value: string): boolean {
  return !value.startsWith('synthetic-redacted-') || value.includes('unredacted') || value.includes('real-');
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewInput): string[] {
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
  if (!environment.ql053PrerequisiteGapClosurePlanReady) blockers.push('QL-053 prerequisite gap-closure plan readiness is missing.');
  if (!input.prerequisiteGapClosureReviewSyntheticOnly || !input.prerequisiteGapClosureReviewRedactedOnly) blockers.push('Prerequisite gap-closure review evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewEnvironment): string[] {
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
  if (environment.providerAccountConnected) blockers.push('Provider account connection must remain disabled in QL-054.');
  if (environment.providerLiveNumberAttached) blockers.push('Provider live number attachment must remain disabled in QL-054.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectReviewItemBlockers(items: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredGapClosureReviewItemIds) {
    if (!seen.has(required)) blockers.push(`Missing prerequisite gap-closure review item: ${required}.`);
  }

  for (const item of items) {
    if (!item.planPresent) blockers.push(`${item.id} must have a plan present.`);
    if (!item.reviewed) blockers.push(`${item.id} must be reviewed.`);
    if (!item.passed) blockers.push(`${item.id} must pass review.`);
    if (!item.reviewOnly) blockers.push(`${item.id} must remain review-only.`);
    if (!item.syntheticEvidenceOnly || !item.redactedEvidenceOnly || item.safeToPersist) blockers.push(`${item.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (!item.noLiveEnablementApproval) blockers.push(`${item.id} must not approve live enablement.`);
    if (!item.noLivePilotRuntime) blockers.push(`${item.id} must not start live pilot runtime.`);
    if (!item.noProviderConnection) blockers.push(`${item.id} must not connect a provider.`);
    if (!item.noProviderDelivery) blockers.push(`${item.id} must not enable provider delivery.`);
    if (!item.noPersistenceWrites) blockers.push(`${item.id} must not write persistence.`);
    if (hasUnsafeEvidenceLabel(item.evidenceLabel)) blockers.push(`${item.id} evidence label is not a synthetic redacted label.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReview(
  input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewInput,
): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewReport {
  const blockers = [
    ...collectPrerequisiteBlockers(input),
    ...collectEnvironmentBlockers(input.environment),
    ...collectReviewItemBlockers(input.reviewItems),
  ];

  if (!input.prerequisiteGapClosureReviewOnly) blockers.push('QL-054 must remain gap-closure-review-only.');
  if (input.requiredNextBuild !== 'QL-055-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake') blockers.push('QL-054 may only queue QL-055 gap evidence intake.');
  if (input.decision !== 'approve_live_pilot_prerequisite_gap_evidence_intake') blockers.push('QL-054 decision may only approve prerequisite gap evidence intake.');

  const status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewStatus = blockers.length === 0
    ? 'live_pilot_prerequisite_gap_closure_review_ready'
    : blockers.some((blocker) => blocker.includes('missing'))
      ? 'blocked_pending_prerequisites'
      : blockers.some((blocker) => blocker.includes('review item'))
        ? 'blocked_missing_gap_review_item'
        : blockers.some((blocker) => blocker.includes('synthetic') || blocker.includes('redacted'))
          ? 'blocked_unsafe_evidence'
          : blockers.some((blocker) => blocker.includes('review-only'))
            ? 'blocked_non_review_scope'
            : 'blocked_unsafe_environment';

  return {
    status,
    decision: input.decision,
    prerequisiteGapClosureReviewReady: blockers.length === 0,
    approvedForLivePilotPrerequisiteGapEvidenceIntake: blockers.length === 0,
    prerequisiteGapClosureReviewOnly: true,
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
    syntheticOnly: input.environment.syntheticOnly && input.prerequisiteGapClosureReviewSyntheticOnly,
    redactedOnly: input.environment.redactedOnly && input.prerequisiteGapClosureReviewRedactedOnly,
    safeToPersist: false,
    requiredNextBuild: 'QL-055-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake',
    blockers,
    reviewedItems: input.reviewItems.filter((item) => item.reviewed).map((item) => item.id),
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReview(): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReviewReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapClosureReview(safeLivePilotPrerequisiteGapClosureReviewInput);
}
