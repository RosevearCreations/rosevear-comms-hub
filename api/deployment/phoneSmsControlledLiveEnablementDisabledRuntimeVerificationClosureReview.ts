export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewStatus =
  | 'disabled_runtime_verification_closure_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_closure_review_item'
  | 'blocked_failed_closure_review_item'
  | 'blocked_unsafe_evidence';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewDecision =
  | 'approve_disabled_runtime_verification_archive_retention_review'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItemId =
  | 'prerequisite_chain_reviewed'
  | 'disabled_case_results_reviewed'
  | 'provider_boundary_reviewed'
  | 'phone_webhook_boundary_reviewed'
  | 'sms_boundary_reviewed'
  | 'recording_boundary_reviewed'
  | 'ai_boundary_reviewed'
  | 'persistence_boundary_reviewed'
  | 'live_customer_boundary_reviewed'
  | 'dry_run_execution_boundary_reviewed'
  | 'redacted_observability_reviewed'
  | 'rollback_readiness_reviewed'
  | 'operator_review_completed'
  | 'post_review_completed'
  | 'archive_retention_review_ready';

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewEnvironment {
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
  readonly livePilotRuntimeAllowed: boolean;
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: boolean;
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItem {
  readonly id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItemId;
  readonly reviewed: boolean;
  readonly passed: boolean;
  readonly disabledOnly: boolean;
  readonly liveBehaviorAllowed: false;
  readonly providerDeliveryBlocked: boolean;
  readonly dryRunExecutionBlocked: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewInput {
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewDecision;
  readonly environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewEnvironment;
  readonly reviewItems: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItem[];
  readonly closureReviewOnly: true;
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-048-phone-sms-controlled-live-enablement-disabled-runtime-verification-archive-retention-review';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewReport {
  readonly status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewStatus;
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewDecision;
  readonly closureReviewReady: boolean;
  readonly approvedForArchiveRetentionReview: boolean;
  readonly closureReviewOnly: true;
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
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-048-phone-sms-controlled-live-enablement-disabled-runtime-verification-archive-retention-review';
  readonly blockers: readonly string[];
  readonly reviewedItems: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItemId[];
}

const requiredReviewItemIds: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItemId[] = [
  'prerequisite_chain_reviewed',
  'disabled_case_results_reviewed',
  'provider_boundary_reviewed',
  'phone_webhook_boundary_reviewed',
  'sms_boundary_reviewed',
  'recording_boundary_reviewed',
  'ai_boundary_reviewed',
  'persistence_boundary_reviewed',
  'live_customer_boundary_reviewed',
  'dry_run_execution_boundary_reviewed',
  'redacted_observability_reviewed',
  'rollback_readiness_reviewed',
  'operator_review_completed',
  'post_review_completed',
  'archive_retention_review_ready',
];

export const safeDisabledRuntimeVerificationClosureReviewEnvironment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewEnvironment = {
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
  livePilotRuntimeAllowed: false,
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
};

export const safeDisabledRuntimeVerificationClosureReviewItems: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItem[] =
  requiredReviewItemIds.map((id) => ({
    id,
    reviewed: true,
    passed: true,
    disabledOnly: true,
    liveBehaviorAllowed: false,
    providerDeliveryBlocked: true,
    dryRunExecutionBlocked: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-${id}`,
  }));

export const safeDisabledRuntimeVerificationClosureReviewInput: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewInput = {
  decision: 'approve_disabled_runtime_verification_archive_retention_review',
  environment: safeDisabledRuntimeVerificationClosureReviewEnvironment,
  reviewItems: safeDisabledRuntimeVerificationClosureReviewItems,
  closureReviewOnly: true,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-048-phone-sms-controlled-live-enablement-disabled-runtime-verification-archive-retention-review',
  notes: [
    'QL-047 reviews the disabled runtime verification closure plan only.',
    'Live pilot runtime remains disabled until a later explicit production proof and manual decision gate.',
  ],
};

function hasUnsafeEvidence(value: string): boolean {
  return (
    /\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(value) ||
    /credential|secret|token|recording url|transcript url|invoice|screenshot|operator identity|customer record|live payload|provider payload|sip/i.test(value)
  );
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewInput): string[] {
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
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewEnvironment): string[] {
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
  if (environment.dryRunExecutionAllowed) blockers.push('Dry-run execution must remain disabled during QL-047 closure review.');
  if (environment.livePilotRuntimeAllowed) blockers.push('Live pilot runtime must remain disabled.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Closure review evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectReviewItemBlockers(items: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredReviewItemIds) {
    if (!seen.has(required)) blockers.push(`Missing disabled runtime verification closure review item: ${required}.`);
  }

  for (const item of items) {
    if (!item.reviewed) blockers.push(`${item.id} must be reviewed.`);
    if (!item.passed) blockers.push(`${item.id} must pass closure review.`);
    if (!item.disabledOnly) blockers.push(`${item.id} must remain disabled-only.`);
    if (item.liveBehaviorAllowed) blockers.push(`${item.id} cannot allow live behavior.`);
    if (!item.providerDeliveryBlocked) blockers.push(`${item.id} must block provider delivery.`);
    if (!item.dryRunExecutionBlocked) blockers.push(`${item.id} must keep dry-run execution blocked.`);
    if (!item.syntheticEvidenceOnly || !item.redactedEvidenceOnly || item.safeToPersist) blockers.push(`${item.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (hasUnsafeEvidence(item.evidenceLabel)) blockers.push(`${item.id} evidence label includes unsafe evidence.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosure(
  input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewInput,
): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const reviewItemBlockers = collectReviewItemBlockers(input.reviewItems);
  const closureReviewBlockers = input.closureReviewOnly ? [] : ['QL-047 must remain a closure review only.'];
  const noteBlockers = input.notes.some(hasUnsafeEvidence) ? ['Input notes include unsafe live, provider-secret, phone-number, recording, transcript, invoice, screenshot, operator, customer, SIP, or payload evidence.'] : [];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...reviewItemBlockers, ...closureReviewBlockers, ...noteBlockers];

  const status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : reviewItemBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_closure_review_item'
          : reviewItemBlockers.length > 0 || closureReviewBlockers.length > 0
            ? 'blocked_failed_closure_review_item'
            : noteBlockers.length > 0
              ? 'blocked_unsafe_evidence'
              : 'disabled_runtime_verification_closure_review_ready';

  const approved = status === 'disabled_runtime_verification_closure_review_ready' && input.decision === 'approve_disabled_runtime_verification_archive_retention_review';

  return {
    status,
    decision: input.decision,
    closureReviewReady: approved,
    approvedForArchiveRetentionReview: approved,
    closureReviewOnly: true,
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
    syntheticOnly: input.environment.syntheticOnly,
    redactedOnly: input.environment.redactedOnly,
    safeToPersist: false,
    requiredNextBuild: 'QL-048-phone-sms-controlled-live-enablement-disabled-runtime-verification-archive-retention-review',
    blockers,
    reviewedItems: input.reviewItems.map((item) => item.id),
  };
}

export function runPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReview(): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureReviewReport {
  return reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosure(safeDisabledRuntimeVerificationClosureReviewInput);
}
