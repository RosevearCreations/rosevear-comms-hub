export type LivePilotExplicitGoNoGoDecision = 'approve_controlled_live_pilot_activation_planning' | 'defer_live_pilot' | 'reject_live_pilot';

export type LivePilotExplicitGoNoGoStatus =
  | 'live_pilot_explicit_go_no_go_decision_gate_ready'
  | 'blocked_missing_prerequisite'
  | 'blocked_unsafe_runtime_flag'
  | 'blocked_missing_decision_item'
  | 'blocked_failed_decision_item'
  | 'blocked_without_owner_approval'
  | 'blocked_unsafe_evidence';

export interface LivePilotExplicitGoNoGoEnvironment {
  ql050PostClosureDecisionReady: boolean;
  ql051PrerequisiteEvidenceIntakeReady: boolean;
  ql052PrerequisiteEvidenceReviewReady: boolean;
  ql053PrerequisiteGapClosurePlanReady: boolean;
  ql054PrerequisiteGapClosureReviewReady: boolean;
  ql055PrerequisiteGapEvidenceIntakeReady: boolean;
  ql056PrerequisiteGapEvidenceReviewReady: boolean;
  ql057PrerequisiteGapEvidenceClosureReady: boolean;
  ql058PrerequisiteFinalReadinessReviewReady: boolean;
  providerWebhookConfigured: boolean;
  providerCallbackAllowed: boolean;
  phoneWebhookAllowed: boolean;
  smsSendAllowed: boolean;
  callRecordingAllowed: boolean;
  aiDraftAllowed: boolean;
  aiAutoSendAllowed: boolean;
  persistenceWritesAllowed: boolean;
  liveCustomerReadAllowed: boolean;
  liveCustomerWriteAllowed: boolean;
  dryRunExecutionAllowed: boolean;
  providerDeliveryAllowed: boolean;
  archiveWriteAllowed: boolean;
  retentionPolicyWriteAllowed: boolean;
  providerAccountConnectionAllowed: boolean;
  providerLiveNumberAttachmentAllowed: boolean;
  livePilotRuntimeAllowed: boolean;
}

export interface LivePilotExplicitGoNoGoDecisionItem {
  id:
    | 'owner_go_no_go_approval'
    | 'provider_setup_prerequisites'
    | 'provider_disabled_mode_boundary'
    | 'phone_number_ownership_readiness'
    | 'sms_consent_policy'
    | 'stop_start_help_policy'
    | 'call_recording_notice_policy'
    | 'staff_access_controls'
    | 'rollback_and_kill_switch'
    | 'rate_limit_and_replay_controls'
    | 'audit_and_redaction'
    | 'customer_data_boundary'
    | 'production_proof_review'
    | 'manual_intervention_steps'
    | 'website_help_system_ready'
    | 'next_gate_activation_planning_only';
  label: string;
  approved: boolean;
  ownerReviewed: boolean;
  decisionGateOnly: boolean;
  activationPlanningOnly: boolean;
  providerDeliveryBlocked: boolean;
  runtimeExecutionBlocked: boolean;
  providerConnectionBlocked: boolean;
  persistenceWritesBlocked: boolean;
  syntheticEvidenceOnly: boolean;
  redactedEvidenceOnly: boolean;
  safeToPersist: false;
  notes: string;
}

export interface LivePilotExplicitGoNoGoInput {
  decision: LivePilotExplicitGoNoGoDecision;
  environment: LivePilotExplicitGoNoGoEnvironment;
  decisionItems: LivePilotExplicitGoNoGoDecisionItem[];
  evidence: {
    syntheticOnly: boolean;
    redactedOnly: boolean;
    safeToPersist: false;
    operatorInitials: string;
  };
}

export interface LivePilotExplicitGoNoGoReport {
  status: LivePilotExplicitGoNoGoStatus;
  approvedForControlledLivePilotActivationPlanning: boolean;
  liveEnablementGranted: false;
  livePilotStarted: false;
  providerDeliveryAllowed: false;
  providerAccountConnectionAllowed: false;
  providerLiveNumberAttachmentAllowed: false;
  smsSendAllowed: false;
  callRecordingAllowed: false;
  aiAutoSendAllowed: false;
  persistenceWritesAllowed: false;
  liveCustomerAccessAllowed: false;
  archiveWriteAllowed: false;
  retentionPolicyWriteAllowed: false;
  livePilotRuntimeAllowed: false;
  websiteHelpSystemRequired: true;
  manualInterventionGuideRequired: true;
  requiredNextBuild: 'QL-060-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning';
  blockers: string[];
  reviewedItems: string[];
}

const requiredDecisionItems: LivePilotExplicitGoNoGoDecisionItem['id'][] = [
  'owner_go_no_go_approval',
  'provider_setup_prerequisites',
  'provider_disabled_mode_boundary',
  'phone_number_ownership_readiness',
  'sms_consent_policy',
  'stop_start_help_policy',
  'call_recording_notice_policy',
  'staff_access_controls',
  'rollback_and_kill_switch',
  'rate_limit_and_replay_controls',
  'audit_and_redaction',
  'customer_data_boundary',
  'production_proof_review',
  'manual_intervention_steps',
  'website_help_system_ready',
  'next_gate_activation_planning_only'
];

export const safeLivePilotExplicitGoNoGoEnvironment: LivePilotExplicitGoNoGoEnvironment = {
  ql050PostClosureDecisionReady: true,
  ql051PrerequisiteEvidenceIntakeReady: true,
  ql052PrerequisiteEvidenceReviewReady: true,
  ql053PrerequisiteGapClosurePlanReady: true,
  ql054PrerequisiteGapClosureReviewReady: true,
  ql055PrerequisiteGapEvidenceIntakeReady: true,
  ql056PrerequisiteGapEvidenceReviewReady: true,
  ql057PrerequisiteGapEvidenceClosureReady: true,
  ql058PrerequisiteFinalReadinessReviewReady: true,
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
  archiveWriteAllowed: false,
  retentionPolicyWriteAllowed: false,
  providerAccountConnectionAllowed: false,
  providerLiveNumberAttachmentAllowed: false,
  livePilotRuntimeAllowed: false
};

export const safeLivePilotExplicitGoNoGoDecisionItems: LivePilotExplicitGoNoGoDecisionItem[] = requiredDecisionItems.map((id) => ({
  id,
  label: id.replace(/_/g, ' '),
  approved: true,
  ownerReviewed: true,
  decisionGateOnly: true,
  activationPlanningOnly: true,
  providerDeliveryBlocked: true,
  runtimeExecutionBlocked: true,
  providerConnectionBlocked: true,
  persistenceWritesBlocked: true,
  syntheticEvidenceOnly: true,
  redactedEvidenceOnly: true,
  safeToPersist: false,
  notes: 'Synthetic, redacted decision evidence only; no live provider, runtime, customer, or persistence action is performed.'
}));

export const safeLivePilotExplicitGoNoGoInput: LivePilotExplicitGoNoGoInput = {
  decision: 'approve_controlled_live_pilot_activation_planning',
  environment: safeLivePilotExplicitGoNoGoEnvironment,
  decisionItems: safeLivePilotExplicitGoNoGoDecisionItems,
  evidence: {
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    operatorInitials: 'LR'
  }
};

function hasUnsafeRuntimeFlag(environment: LivePilotExplicitGoNoGoEnvironment): boolean {
  return (
    environment.providerWebhookConfigured ||
    environment.providerCallbackAllowed ||
    environment.phoneWebhookAllowed ||
    environment.smsSendAllowed ||
    environment.callRecordingAllowed ||
    environment.aiDraftAllowed ||
    environment.aiAutoSendAllowed ||
    environment.persistenceWritesAllowed ||
    environment.liveCustomerReadAllowed ||
    environment.liveCustomerWriteAllowed ||
    environment.dryRunExecutionAllowed ||
    environment.providerDeliveryAllowed ||
    environment.archiveWriteAllowed ||
    environment.retentionPolicyWriteAllowed ||
    environment.providerAccountConnectionAllowed ||
    environment.providerLiveNumberAttachmentAllowed ||
    environment.livePilotRuntimeAllowed
  );
}

function missingPrerequisites(environment: LivePilotExplicitGoNoGoEnvironment): string[] {
  return [
    ['QL-050 post-closure decision', environment.ql050PostClosureDecisionReady],
    ['QL-051 prerequisite evidence intake', environment.ql051PrerequisiteEvidenceIntakeReady],
    ['QL-052 prerequisite evidence review', environment.ql052PrerequisiteEvidenceReviewReady],
    ['QL-053 prerequisite gap closure plan', environment.ql053PrerequisiteGapClosurePlanReady],
    ['QL-054 prerequisite gap closure review', environment.ql054PrerequisiteGapClosureReviewReady],
    ['QL-055 prerequisite gap evidence intake', environment.ql055PrerequisiteGapEvidenceIntakeReady],
    ['QL-056 prerequisite gap evidence review', environment.ql056PrerequisiteGapEvidenceReviewReady],
    ['QL-057 prerequisite gap evidence closure', environment.ql057PrerequisiteGapEvidenceClosureReady],
    ['QL-058 prerequisite final readiness review', environment.ql058PrerequisiteFinalReadinessReviewReady]
  ]
    .filter(([, ready]) => !ready)
    .map(([label]) => `${label} is not ready.`);
}

function missingDecisionItems(items: LivePilotExplicitGoNoGoDecisionItem[]): string[] {
  return requiredDecisionItems.filter((id) => !items.some((item) => item.id === id)).map((id) => `${id} is missing.`);
}

function failedDecisionItems(items: LivePilotExplicitGoNoGoDecisionItem[]): string[] {
  return items
    .filter(
      (item) =>
        !item.approved ||
        !item.ownerReviewed ||
        !item.decisionGateOnly ||
        !item.activationPlanningOnly ||
        !item.providerDeliveryBlocked ||
        !item.runtimeExecutionBlocked ||
        !item.providerConnectionBlocked ||
        !item.persistenceWritesBlocked ||
        !item.syntheticEvidenceOnly ||
        !item.redactedEvidenceOnly ||
        item.safeToPersist !== false
    )
    .map((item) => `${item.id} failed explicit go/no-go safety requirements.`);
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotExplicitGoNoGoDecisionGate(
  input: LivePilotExplicitGoNoGoInput
): LivePilotExplicitGoNoGoReport {
  const blockers: string[] = [];
  blockers.push(...missingPrerequisites(input.environment));

  if (hasUnsafeRuntimeFlag(input.environment)) {
    blockers.push('One or more runtime, provider, delivery, customer, archive, retention, or persistence flags are enabled.');
  }

  blockers.push(...missingDecisionItems(input.decisionItems));
  blockers.push(...failedDecisionItems(input.decisionItems));

  if (input.decision !== 'approve_controlled_live_pilot_activation_planning') {
    blockers.push('Decision did not approve the next controlled activation planning build.');
  }

  if (!input.evidence.syntheticOnly || !input.evidence.redactedOnly || input.evidence.safeToPersist !== false) {
    blockers.push('Evidence must remain synthetic, redacted, and non-persistable.');
  }

  const ownerApproval = input.decisionItems.find((item) => item.id === 'owner_go_no_go_approval');
  if (!ownerApproval?.approved || !ownerApproval.ownerReviewed) {
    blockers.push('Owner go/no-go approval is not present.');
  }

  const status: LivePilotExplicitGoNoGoStatus = blockers.length
    ? blockers.some((blocker) => blocker.includes('Owner'))
      ? 'blocked_without_owner_approval'
      : blockers.some((blocker) => blocker.includes('runtime'))
        ? 'blocked_unsafe_runtime_flag'
        : blockers.some((blocker) => blocker.includes('missing'))
          ? 'blocked_missing_decision_item'
          : 'blocked_failed_decision_item'
    : 'live_pilot_explicit_go_no_go_decision_gate_ready';

  return {
    status,
    approvedForControlledLivePilotActivationPlanning: blockers.length === 0,
    liveEnablementGranted: false,
    livePilotStarted: false,
    providerDeliveryAllowed: false,
    providerAccountConnectionAllowed: false,
    providerLiveNumberAttachmentAllowed: false,
    smsSendAllowed: false,
    callRecordingAllowed: false,
    aiAutoSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerAccessAllowed: false,
    archiveWriteAllowed: false,
    retentionPolicyWriteAllowed: false,
    livePilotRuntimeAllowed: false,
    websiteHelpSystemRequired: true,
    manualInterventionGuideRequired: true,
    requiredNextBuild: 'QL-060-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning',
    blockers,
    reviewedItems: input.decisionItems.map((item) => item.id)
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotExplicitGoNoGoDecisionGate() {
  return reviewPhoneSmsControlledLiveEnablementLivePilotExplicitGoNoGoDecisionGate(safeLivePilotExplicitGoNoGoInput);
}
