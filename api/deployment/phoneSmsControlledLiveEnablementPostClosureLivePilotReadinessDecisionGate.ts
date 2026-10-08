export type PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateStatus =
  | 'post_closure_live_pilot_readiness_decision_gate_ready'
  | 'blocked_pending_disabled_closure'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_readiness_item'
  | 'blocked_failed_readiness_item'
  | 'blocked_unsafe_evidence';

export type PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateDecision =
  | 'approve_live_pilot_prerequisite_evidence_intake'
  | 'continue_rework'
  | 'remain_blocked';

export type PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItemId =
  | 'disabled_runtime_verification_chain_closed'
  | 'owner_manual_approval_required'
  | 'provider_setup_prerequisites_defined'
  | 'consent_and_opt_out_requirements_defined'
  | 'staff_operator_controls_defined'
  | 'rollback_and_kill_switch_required'
  | 'production_proof_required'
  | 'rate_limit_and_replay_controls_required'
  | 'audit_and_redaction_requirements_defined'
  | 'customer_data_boundary_required'
  | 'provider_callback_boundary_required'
  | 'sms_send_boundary_required'
  | 'recording_boundary_required'
  | 'ai_boundary_required'
  | 'persistence_boundary_required'
  | 'live_pilot_runtime_boundary_required'
  | 'next_evidence_intake_limited';

export interface PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateEnvironment {
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
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: boolean;
}

export interface PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItem {
  readonly id: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItemId;
  readonly reviewed: boolean;
  readonly passed: boolean;
  readonly decisionGateOnly: boolean;
  readonly liveEnablementApproved: false;
  readonly livePilotRuntimeAllowed: false;
  readonly providerDeliveryAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly syntheticEvidenceOnly: boolean;
  readonly redactedEvidenceOnly: boolean;
  readonly safeToPersist: false;
  readonly evidenceLabel: string;
}

export interface PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateInput {
  readonly decision: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateDecision;
  readonly environment: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateEnvironment;
  readonly readinessItems: readonly PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItem[];
  readonly decisionGateOnly: true;
  readonly prerequisiteEvidenceSyntheticOnly: boolean;
  readonly prerequisiteEvidenceRedactedOnly: boolean;
  readonly requiredNextBuild: 'QL-051-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake';
  readonly notes: readonly string[];
}

export interface PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateReport {
  readonly status: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateStatus;
  readonly decision: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateDecision;
  readonly decisionGateReady: boolean;
  readonly approvedForLivePilotPrerequisiteEvidenceIntake: boolean;
  readonly decisionGateOnly: true;
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
  readonly syntheticOnly: boolean;
  readonly redactedOnly: boolean;
  readonly safeToPersist: false;
  readonly requiredNextBuild: 'QL-051-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake';
  readonly blockers: readonly string[];
  readonly reviewedItems: readonly PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItemId[];
}

const requiredReadinessItemIds: readonly PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItemId[] = [
  'disabled_runtime_verification_chain_closed',
  'owner_manual_approval_required',
  'provider_setup_prerequisites_defined',
  'consent_and_opt_out_requirements_defined',
  'staff_operator_controls_defined',
  'rollback_and_kill_switch_required',
  'production_proof_required',
  'rate_limit_and_replay_controls_required',
  'audit_and_redaction_requirements_defined',
  'customer_data_boundary_required',
  'provider_callback_boundary_required',
  'sms_send_boundary_required',
  'recording_boundary_required',
  'ai_boundary_required',
  'persistence_boundary_required',
  'live_pilot_runtime_boundary_required',
  'next_evidence_intake_limited',
];

export const safePostClosureLivePilotReadinessDecisionGateEnvironment: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateEnvironment = {
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
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
};

export const safePostClosureLivePilotReadinessItems: readonly PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItem[] =
  requiredReadinessItemIds.map((id) => ({
    id,
    reviewed: true,
    passed: true,
    decisionGateOnly: true,
    liveEnablementApproved: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    persistenceWritesAllowed: false,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    safeToPersist: false,
    evidenceLabel: `synthetic-redacted-post-closure-readiness-${id}`,
  }));

export const safePostClosureLivePilotReadinessDecisionGateInput: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateInput = {
  decision: 'approve_live_pilot_prerequisite_evidence_intake',
  environment: safePostClosureLivePilotReadinessDecisionGateEnvironment,
  readinessItems: safePostClosureLivePilotReadinessItems,
  decisionGateOnly: true,
  prerequisiteEvidenceSyntheticOnly: true,
  prerequisiteEvidenceRedactedOnly: true,
  requiredNextBuild: 'QL-051-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake',
  notes: [
    'QL-050 reviews readiness for prerequisite evidence intake only.',
    'QL-050 does not approve live traffic, live pilot runtime, provider delivery, persistence, recording, AI, or customer access.',
  ],
};

function hasUnsafeEvidenceLabel(value: string): boolean {
  return !value.startsWith('synthetic-redacted-') || value.includes('unredacted') || value.includes('real-');
}

function collectPrerequisiteBlockers(input: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateInput): string[] {
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
  if (!input.prerequisiteEvidenceSyntheticOnly || !input.prerequisiteEvidenceRedactedOnly) blockers.push('Prerequisite evidence must remain synthetic and redacted.');

  return blockers;
}

function collectEnvironmentBlockers(environment: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateEnvironment): string[] {
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
  if (!environment.syntheticOnly || !environment.redactedOnly || environment.safeToPersist) blockers.push('Readiness gate evidence must remain synthetic, redacted, and unsafe to persist.');
  return blockers;
}

function collectReadinessItemBlockers(items: readonly PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessItem[]): string[] {
  const blockers: string[] = [];
  const seen = new Set(items.map((item) => item.id));

  for (const required of requiredReadinessItemIds) {
    if (!seen.has(required)) blockers.push(`Missing post-closure readiness item: ${required}.`);
  }

  for (const item of items) {
    if (!item.reviewed) blockers.push(`${item.id} must be reviewed.`);
    if (!item.passed) blockers.push(`${item.id} must pass readiness decision review.`);
    if (!item.decisionGateOnly) blockers.push(`${item.id} must remain decision-gate-only.`);
    if (item.liveEnablementApproved) blockers.push(`${item.id} cannot approve live enablement.`);
    if (item.livePilotRuntimeAllowed) blockers.push(`${item.id} cannot allow live pilot runtime.`);
    if (item.providerDeliveryAllowed) blockers.push(`${item.id} cannot allow provider delivery.`);
    if (item.persistenceWritesAllowed) blockers.push(`${item.id} cannot allow persistence writes.`);
    if (!item.syntheticEvidenceOnly || !item.redactedEvidenceOnly || item.safeToPersist) blockers.push(`${item.id} evidence must remain synthetic, redacted, and unsafe to persist.`);
    if (hasUnsafeEvidenceLabel(item.evidenceLabel)) blockers.push(`${item.id} evidence label is not a synthetic redacted label.`);
  }

  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGate(
  input: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateInput,
): PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateReport {
  const prerequisiteBlockers = collectPrerequisiteBlockers(input);
  const environmentBlockers = collectEnvironmentBlockers(input.environment);
  const readinessItemBlockers = collectReadinessItemBlockers(input.readinessItems);
  const scopeBlockers = input.decisionGateOnly ? [] : ['QL-050 must remain a post-closure readiness decision gate only.'];
  const blockers = [...prerequisiteBlockers, ...environmentBlockers, ...readinessItemBlockers, ...scopeBlockers];

  const status: PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateStatus =
    prerequisiteBlockers.length > 0
      ? 'blocked_pending_disabled_closure'
      : environmentBlockers.length > 0
        ? 'blocked_unsafe_environment'
        : readinessItemBlockers.some((blocker) => blocker.startsWith('Missing'))
          ? 'blocked_missing_readiness_item'
          : readinessItemBlockers.length > 0 || scopeBlockers.length > 0
            ? 'blocked_failed_readiness_item'
            : 'post_closure_live_pilot_readiness_decision_gate_ready';

  const approved = status === 'post_closure_live_pilot_readiness_decision_gate_ready' && input.decision === 'approve_live_pilot_prerequisite_evidence_intake';

  return {
    status,
    decision: input.decision,
    decisionGateReady: approved,
    approvedForLivePilotPrerequisiteEvidenceIntake: approved,
    decisionGateOnly: true,
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
    syntheticOnly: input.environment.syntheticOnly,
    redactedOnly: input.environment.redactedOnly,
    safeToPersist: false,
    requiredNextBuild: 'QL-051-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake',
    blockers,
    reviewedItems: input.readinessItems.map((item) => item.id),
  };
}

export function runPhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGate(): PhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGateReport {
  return reviewPhoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGate(safePostClosureLivePilotReadinessDecisionGateInput);
}
