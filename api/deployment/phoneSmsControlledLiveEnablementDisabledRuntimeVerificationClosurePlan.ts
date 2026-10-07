export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanStatus =
  | 'disabled_runtime_verification_closure_plan_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_closure_item'
  | 'blocked_unsafe_closure_item'
  | 'blocked_unsafe_evidence';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanDecision =
  | 'approve_disabled_runtime_verification_closure_review'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItemId =
  | 'prerequisite_chain_closure'
  | 'disabled_case_result_closure'
  | 'provider_boundary_closure'
  | 'phone_webhook_boundary_closure'
  | 'sms_boundary_closure'
  | 'recording_boundary_closure'
  | 'ai_boundary_closure'
  | 'persistence_boundary_closure'
  | 'live_customer_boundary_closure'
  | 'dry_run_execution_boundary_closure'
  | 'redacted_observability_closure'
  | 'rollback_readiness_closure'
  | 'operator_review_closure'
  | 'post_review_closure'
  | 'next_gate_closure';

export type PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureDisposition =
  | 'closed_disabled_only'
  | 'closed_rework_required'
  | 'closed_next_review_only';

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureEnvironment {
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
  readonly ql044DisabledRuntimeVerificationDryRunCasesReady: boolean;
  readonly ql045DisabledRuntimeVerificationDryRunResultReviewReady: boolean;
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

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItem {
  readonly id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItemId;
  readonly disposition: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureDisposition;
  readonly closedDisabledOnly: boolean;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly safeToPersist: false;
  readonly requiresLaterHumanReview: boolean;
  readonly liveBehaviorAllowed: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanInput {
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanDecision;
  readonly environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureEnvironment;
  readonly closureItems: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItem[];
  readonly closureReviewRequiredBeforeAnyPilotRuntime: boolean;
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-047-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-review';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanReport {
  readonly status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanStatus;
  readonly decision: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanDecision;
  readonly closurePlanReady: boolean;
  readonly approvedForClosureReview: boolean;
  readonly closureReviewRequiredBeforeAnyPilotRuntime: true;
  readonly dryRunExecutionAllowedNow: false;
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
  readonly requiredNextBuild: 'QL-047-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-review';
  readonly blockers: readonly string[];
  readonly checkedItems: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItemId[];
}

const requiredClosureItemIds: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItemId[] = [
  'prerequisite_chain_closure',
  'disabled_case_result_closure',
  'provider_boundary_closure',
  'phone_webhook_boundary_closure',
  'sms_boundary_closure',
  'recording_boundary_closure',
  'ai_boundary_closure',
  'persistence_boundary_closure',
  'live_customer_boundary_closure',
  'dry_run_execution_boundary_closure',
  'redacted_observability_closure',
  'rollback_readiness_closure',
  'operator_review_closure',
  'post_review_closure',
  'next_gate_closure',
];

export const safeDisabledRuntimeVerificationClosureEnvironment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureEnvironment = {
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
  ql044DisabledRuntimeVerificationDryRunCasesReady: true,
  ql045DisabledRuntimeVerificationDryRunResultReviewReady: true,
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

function dispositionForClosureItem(
  id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItemId,
): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureDisposition {
  if (id === 'next_gate_closure') return 'closed_next_review_only';
  return 'closed_disabled_only';
}

function requiresLaterHumanReview(id: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItemId): boolean {
  return id === 'operator_review_closure' || id === 'post_review_closure' || id === 'next_gate_closure';
}

export const safeDisabledRuntimeVerificationClosureItems: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItem[] =
  requiredClosureItemIds.map((id) => ({
    id,
    disposition: dispositionForClosureItem(id),
    closedDisabledOnly: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    safeToPersist: false,
    requiresLaterHumanReview: requiresLaterHumanReview(id),
    liveBehaviorAllowed: false,
    evidenceLabel: `synthetic-redacted-${id}`,
  }));

export const safeDisabledRuntimeVerificationClosurePlanInput: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanInput = {
  decision: 'approve_disabled_runtime_verification_closure_review',
  environment: safeDisabledRuntimeVerificationClosureEnvironment,
  closureItems: safeDisabledRuntimeVerificationClosureItems,
  closureReviewRequiredBeforeAnyPilotRuntime: true,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-047-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-review',
  notes: [
    'QL-046 closes the disabled runtime verification planning chain only.',
    'Any pilot runtime remains blocked until later explicit human review and production proof.',
  ],
};

function hasUnsafeEvidence(value: string): boolean {
  return (
    /\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(value) ||
    /credential|secret|token|recording url|transcript url|invoice|screenshot|operator identity|live payload|provider payload/i.test(value)
  );
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanInput): string[] {
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
  if (!environment.ql044DisabledRuntimeVerificationDryRunCasesReady) blockers.push('QL-044 disabled runtime verification dry-run cases readiness is missing.');
  if (!environment.ql045DisabledRuntimeVerificationDryRunResultReviewReady) blockers.push('QL-045 disabled runtime verification dry-run result review readiness is missing.');
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureEnvironment): string[] {
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
  if (environment.dryRunExecutionAllowed) blockers.push('Dry-run execution must remain disabled in QL-046.');
  if (environment.livePilotRuntimeAllowed) blockers.push('Live pilot runtime must remain disabled.');
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Closure-plan evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectClosureItemBlockers(items: readonly PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosureItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredClosureItemIds) {
    if (!seen.has(required)) blockers.push(`Missing disabled runtime verification closure item: ${required}.`);
  }

  for (const item of items) {
    if (!item.closedDisabledOnly) blockers.push(`${item.id} must close disabled-only behavior.`);
    if (!item.syntheticEvidenceOnly || !item.redactedEvidenceOnly || item.safeToPersist) blockers.push(`${item.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (item.liveBehaviorAllowed) blockers.push(`${item.id} cannot allow live behavior.`);
    if (item.disposition === 'closed_rework_required') blockers.push(`${item.id} requires rework before closure review.`);
    if (hasUnsafeEvidence(item.evidenceLabel)) blockers.push(`${item.id} evidence label includes unsafe evidence.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlan(
  input: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanInput,
): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const closureItemBlockers = collectClosureItemBlockers(input.closureItems);
  const reviewBlockers = input.closureReviewRequiredBeforeAnyPilotRuntime ? [] : ['Closure review must be required before any pilot runtime can be considered.'];
  const noteBlockers = input.notes.some(hasUnsafeEvidence) ? ['Input notes include unsafe live, provider-secret, phone-number, recording, transcript, invoice, screenshot, or operator evidence.'] : [];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...closureItemBlockers, ...reviewBlockers, ...noteBlockers];

  const status: PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_prerequisites'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : closureItemBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_closure_item'
          : closureItemBlockers.length > 0 || reviewBlockers.length > 0
            ? 'blocked_unsafe_closure_item'
            : noteBlockers.length > 0
              ? 'blocked_unsafe_evidence'
              : 'disabled_runtime_verification_closure_plan_ready';

  const approved = status === 'disabled_runtime_verification_closure_plan_ready' && input.decision === 'approve_disabled_runtime_verification_closure_review';

  return {
    status,
    decision: input.decision,
    closurePlanReady: approved,
    approvedForClosureReview: approved,
    closureReviewRequiredBeforeAnyPilotRuntime: true,
    dryRunExecutionAllowedNow: false,
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
    requiredNextBuild: 'QL-047-phone-sms-controlled-live-enablement-disabled-runtime-verification-closure-review',
    blockers,
    checkedItems: input.closureItems.map((item) => item.id),
  };
}

export function runPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanReview(): PhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlanReport {
  return reviewPhoneSmsControlledLiveEnablementDisabledRuntimeVerificationClosurePlan(safeDisabledRuntimeVerificationClosurePlanInput);
}
