export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewStatus =
  | 'live_pilot_prerequisite_evidence_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_review_item'
  | 'blocked_failed_review_item'
  | 'blocked_unsafe_evidence'
  | 'blocked_non_review_scope';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewDecision =
  | 'approve_live_pilot_prerequisite_gap_closure_plan'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItemId =
  | 'owner_manual_approval_evidence_review'
  | 'provider_setup_prerequisite_evidence_review'
  | 'provider_disabled_mode_evidence_review'
  | 'phone_number_ownership_evidence_review'
  | 'sms_consent_policy_evidence_review'
  | 'stop_start_help_policy_evidence_review'
  | 'call_recording_notice_policy_evidence_review'
  | 'staff_access_control_evidence_review'
  | 'rollback_kill_switch_evidence_review'
  | 'rate_limit_replay_control_evidence_review'
  | 'audit_redaction_control_evidence_review'
  | 'customer_data_boundary_evidence_review'
  | 'provider_callback_disabled_evidence_review'
  | 'live_phone_webhook_disabled_evidence_review'
  | 'sms_sending_disabled_evidence_review'
  | 'recording_disabled_evidence_review'
  | 'ai_features_disabled_evidence_review'
  | 'persistence_write_disabled_evidence_review'
  | 'live_pilot_runtime_disabled_evidence_review'
  | 'production_proof_evidence_review';

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewEnvironment {
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

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItem {
  readonly id: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItemId;
  readonly intakeEvidencePresent: boolean;
  readonly reviewed: boolean;
  readonly passed: boolean;
  readonly reviewOnly: boolean;
  readonly noLiveEnablementApproval: boolean;
  readonly noLivePilotRuntime: boolean;
  readonly noProviderDelivery: boolean;
  readonly noProviderConnection: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewInput {
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewDecision;
  readonly environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewEnvironment;
  readonly reviewItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItem[];
  readonly prerequisiteEvidenceReviewOnly: true;
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-053-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-plan';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewReport {
  readonly status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewStatus;
  readonly decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewDecision;
  readonly prerequisiteEvidenceReviewReady: boolean;
  readonly approvedForLivePilotPrerequisiteGapClosurePlan: boolean;
  readonly prerequisiteEvidenceReviewOnly: true;
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
  readonly requiredNextBuild: 'QL-053-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-plan';
  readonly blockers: readonly string[];
  readonly reviewedItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItemId[];
}

const requiredReviewItemIds: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItemId[] = [
  'owner_manual_approval_evidence_review',
  'provider_setup_prerequisite_evidence_review',
  'provider_disabled_mode_evidence_review',
  'phone_number_ownership_evidence_review',
  'sms_consent_policy_evidence_review',
  'stop_start_help_policy_evidence_review',
  'call_recording_notice_policy_evidence_review',
  'staff_access_control_evidence_review',
  'rollback_kill_switch_evidence_review',
  'rate_limit_replay_control_evidence_review',
  'audit_redaction_control_evidence_review',
  'customer_data_boundary_evidence_review',
  'provider_callback_disabled_evidence_review',
  'live_phone_webhook_disabled_evidence_review',
  'sms_sending_disabled_evidence_review',
  'recording_disabled_evidence_review',
  'ai_features_disabled_evidence_review',
  'persistence_write_disabled_evidence_review',
  'live_pilot_runtime_disabled_evidence_review',
  'production_proof_evidence_review',
];

export const safeLivePilotPrerequisiteEvidenceReviewEnvironment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewEnvironment = {
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

export const safeLivePilotPrerequisiteEvidenceReviewItems: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItem[] =
  requiredReviewItemIds.map((id) => ({
    id,
    intakeEvidencePresent: true,
    reviewed: true,
    passed: true,
    reviewOnly: true,
    noLiveEnablementApproval: true,
    noLivePilotRuntime: true,
    noProviderDelivery: true,
    noProviderConnection: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-prerequisite-evidence-review-${id}`,
  }));

export const safeLivePilotPrerequisiteEvidenceReviewInput: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewInput = {
  decision: 'approve_live_pilot_prerequisite_gap_closure_plan',
  environment: safeLivePilotPrerequisiteEvidenceReviewEnvironment,
  reviewItems: safeLivePilotPrerequisiteEvidenceReviewItems,
  prerequisiteEvidenceReviewOnly: true,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-053-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-plan',
  notes: [
    'QL-052 reviews prerequisite evidence collected by QL-051.',
    'QL-052 approves only a later prerequisite gap closure plan, not live enablement.',
  ],
};

function hasUnsafeEvidenceLabel(value: string): boolean {
  return !value.startsWith('synthetic-redacted-') || value.includes('unredacted') || value.includes('real-');
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewInput): string[] {
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
  if (!input.prerequisiteEvidenceReviewOnly) blockers.push('QL-052 scope must remain prerequisite evidence review only.');
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence review must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewEnvironment): string[] {
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
  if (environment.providerAccountConnected) blockers.push('Provider account connection must remain disabled in QL-052.');
  if (environment.providerLiveNumberAttached) blockers.push('Provider live number attachment must remain disabled in QL-052.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectReviewItemBlockers(items: readonly PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredReviewItemIds) {
    if (!seen.has(required)) blockers.push(`Missing prerequisite evidence review item: ${required}.`);
  }

  for (const item of items) {
    if (!item.intakeEvidencePresent) blockers.push(`${item.id} must have intake evidence present.`);
    if (!item.reviewed) blockers.push(`${item.id} must be reviewed.`);
    if (!item.passed) blockers.push(`${item.id} must pass review.`);
    if (!item.reviewOnly) blockers.push(`${item.id} must remain review-only.`);
    if (!item.noLiveEnablementApproval) blockers.push(`${item.id} must not approve live enablement.`);
    if (!item.noLivePilotRuntime) blockers.push(`${item.id} must not start live pilot runtime.`);
    if (!item.noProviderDelivery) blockers.push(`${item.id} must not enable provider delivery.`);
    if (!item.noProviderConnection) blockers.push(`${item.id} must not connect a provider account.`);
    if (!item.syntheticEvidenceOnly || !item.redactedEvidenceOnly || item.safeToPersist) blockers.push(`${item.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (hasUnsafeEvidenceLabel(item.evidenceLabel)) blockers.push(`${item.id} evidence label is not a synthetic redacted label.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReview(
  input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewInput,
): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const itemBlockers = collectReviewItemBlockers(input.reviewItems);
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...itemBlockers];
  const missingReviewItemBlockers = itemBlockers.filter((blocker) => blocker.startsWith('Missing'));
  const failedReviewItemBlockers = itemBlockers.filter((blocker) => !blocker.startsWith('Missing'));

  let status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewStatus = 'live_pilot_prerequisite_evidence_review_ready';
  if (prerequisiteBlockers.length > 0) status = 'blocked_pending_prerequisites';
  else if (environmentBlockers.length > 0) status = 'blocked_unsafe_environment';
  else if (missingReviewItemBlockers.length > 0) status = 'blocked_missing_review_item';
  else if (failedReviewItemBlockers.length > 0) status = 'blocked_failed_review_item';
  else if (!input.prerequisiteEvidenceReviewOnly) status = 'blocked_non_review_scope';
  else if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) status = 'blocked_unsafe_evidence';

  const ready = status === 'live_pilot_prerequisite_evidence_review_ready' && input.decision === 'approve_live_pilot_prerequisite_gap_closure_plan';

  return {
    status,
    decision: input.decision,
    prerequisiteEvidenceReviewReady: ready,
    approvedForLivePilotPrerequisiteGapClosurePlan: ready,
    prerequisiteEvidenceReviewOnly: true,
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
    requiredNextBuild: 'QL-053-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-closure-plan',
    blockers,
    reviewedItems: input.reviewItems.filter((item) => item.reviewed).map((item) => item.id),
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReview(): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReviewReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReview(safeLivePilotPrerequisiteEvidenceReviewInput);
}
