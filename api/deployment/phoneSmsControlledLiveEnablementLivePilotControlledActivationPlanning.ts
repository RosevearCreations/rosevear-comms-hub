export type QL060Decision =
  | 'approve_controlled_live_pilot_activation_plan_review'
  | 'continue_planning_rework'
  | 'remain_blocked';

export type QL060Status =
  | 'controlled_activation_planning_ready'
  | 'blocked_missing_prerequisite'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_plan_item'
  | 'blocked_failed_plan_item'
  | 'blocked_unsafe_scope';

export interface QL060RuntimeLocks {
  providerWebhookConfigured: boolean;
  providerCallbackAllowed: boolean;
  livePhoneWebhookAllowed: boolean;
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

export interface QL060Prerequisites {
  ql050PostClosureDecisionReady: boolean;
  ql051PrerequisiteEvidenceIntakeReady: boolean;
  ql052PrerequisiteEvidenceReviewReady: boolean;
  ql053PrerequisiteGapClosurePlanReady: boolean;
  ql054PrerequisiteGapClosureReviewReady: boolean;
  ql055GapEvidenceIntakeReady: boolean;
  ql056GapEvidenceReviewReady: boolean;
  ql057GapEvidenceClosureGateReady: boolean;
  ql058FinalReadinessReviewReady: boolean;
  ql059ExplicitGoNoGoDecisionApproved: boolean;
}

export interface QL060PlanItem {
  id: string;
  label: string;
  planned: boolean;
  ownerReviewed: boolean;
  activationPlanningOnly: boolean;
  planReviewOnlyNext: boolean;
  requiresManualInterventionSteps: boolean;
  requiresVariableList: boolean;
  requiresServiceLinks: boolean;
  requiresApplicationLinks: boolean;
  requiresRollbackPlan: boolean;
  requiresKillSwitchPlan: boolean;
  requiresRateLimitPlan: boolean;
  requiresReplayProtectionPlan: boolean;
  requiresMonitoringPlan: boolean;
  requiresOperatorChecklist: boolean;
  requiresSyntheticEvidence: boolean;
  requiresRedactedEvidence: boolean;
  blocksLiveRuntime: boolean;
  blocksProviderDelivery: boolean;
  blocksPersistenceWrites: boolean;
  safeToPersist: boolean;
  notes?: string;
}

export interface QL060Input {
  decision: QL060Decision;
  prerequisites: QL060Prerequisites;
  runtimeLocks: QL060RuntimeLocks;
  planItems: QL060PlanItem[];
  evidence: {
    syntheticOnly: boolean;
    redactedOnly: boolean;
    safeToPersist: boolean;
    excludesLiveCustomerData: boolean;
    excludesProviderPayloads: boolean;
    excludesPhoneNumbers: boolean;
    excludesCredentials: boolean;
    excludesRecordings: boolean;
    excludesTranscripts: boolean;
    excludesScreenshots: boolean;
    excludesInvoices: boolean;
    excludesOwnershipDocuments: boolean;
    excludesOperatorIdentities: boolean;
  };
}

export interface QL060Report {
  status: QL060Status;
  decision: QL060Decision;
  readyForActivationPlanReview: boolean;
  requiredNextBuild: 'QL-061-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-plan-review';
  missingPrerequisites: string[];
  missingPlanItems: string[];
  failedPlanItems: string[];
  unsafeRuntimeLocks: string[];
  liveEnablementGranted: false;
  livePilotStarted: false;
  providerAccountConnected: false;
  providerLiveNumberAttached: false;
  providerDeliveryEnabled: false;
  liveRuntimeEnabled: false;
  persistenceWritesEnabled: false;
  liveCustomerAccessEnabled: false;
  safeToPersist: false;
  summary: string;
}

const requiredPlanItemIds = [
  'manual_activation_boundary',
  'environment_variable_plan',
  'provider_account_step_plan',
  'provider_live_number_attachment_plan',
  'callback_registration_plan',
  'sms_consent_enforcement_plan',
  'stop_start_help_enforcement_plan',
  'call_recording_notice_plan',
  'operator_access_plan',
  'rollback_and_kill_switch_plan',
  'rate_limit_and_replay_plan',
  'monitoring_and_alerting_plan',
  'audit_redaction_plan',
  'customer_boundary_plan',
  'production_verification_plan',
  'help_and_manual_intervention_plan',
  'ql061_plan_review_ready'
] as const;

const lockLabels: Record<keyof QL060RuntimeLocks, string> = {
  providerWebhookConfigured: 'provider webhook configuration',
  providerCallbackAllowed: 'provider callback handling',
  livePhoneWebhookAllowed: 'live phone webhook handling',
  smsSendAllowed: 'SMS sending',
  callRecordingAllowed: 'call recording',
  aiDraftAllowed: 'AI draft generation',
  aiAutoSendAllowed: 'AI auto-send',
  persistenceWritesAllowed: 'persistence writes',
  liveCustomerReadAllowed: 'live customer reads',
  liveCustomerWriteAllowed: 'live customer writes',
  dryRunExecutionAllowed: 'dry-run execution',
  providerDeliveryAllowed: 'provider delivery',
  archiveWriteAllowed: 'archive writes',
  retentionPolicyWriteAllowed: 'retention policy writes',
  providerAccountConnectionAllowed: 'provider account connection',
  providerLiveNumberAttachmentAllowed: 'provider live-number attachment',
  livePilotRuntimeAllowed: 'live pilot runtime'
};

function getMissingPrerequisites(prerequisites: QL060Prerequisites): string[] {
  return Object.entries(prerequisites)
    .filter(([, ready]) => !ready)
    .map(([key]) => key);
}

function getUnsafeRuntimeLocks(runtimeLocks: QL060RuntimeLocks): string[] {
  return Object.entries(runtimeLocks)
    .filter(([, enabled]) => enabled)
    .map(([key]) => lockLabels[key as keyof QL060RuntimeLocks]);
}

function getMissingPlanItems(items: QL060PlanItem[]): string[] {
  const present = new Set(items.map((item) => item.id));
  return requiredPlanItemIds.filter((id) => !present.has(id));
}

function planItemPassed(item: QL060PlanItem): boolean {
  return item.planned &&
    item.ownerReviewed &&
    item.activationPlanningOnly &&
    item.planReviewOnlyNext &&
    item.requiresManualInterventionSteps &&
    item.requiresVariableList &&
    item.requiresServiceLinks &&
    item.requiresApplicationLinks &&
    item.requiresRollbackPlan &&
    item.requiresKillSwitchPlan &&
    item.requiresRateLimitPlan &&
    item.requiresReplayProtectionPlan &&
    item.requiresMonitoringPlan &&
    item.requiresOperatorChecklist &&
    item.requiresSyntheticEvidence &&
    item.requiresRedactedEvidence &&
    item.blocksLiveRuntime &&
    item.blocksProviderDelivery &&
    item.blocksPersistenceWrites &&
    !item.safeToPersist;
}

function getFailedPlanItems(items: QL060PlanItem[]): string[] {
  return items.filter((item) => !planItemPassed(item)).map((item) => item.id);
}

function evidenceSafe(input: QL060Input): boolean {
  return input.evidence.syntheticOnly &&
    input.evidence.redactedOnly &&
    !input.evidence.safeToPersist &&
    input.evidence.excludesLiveCustomerData &&
    input.evidence.excludesProviderPayloads &&
    input.evidence.excludesPhoneNumbers &&
    input.evidence.excludesCredentials &&
    input.evidence.excludesRecordings &&
    input.evidence.excludesTranscripts &&
    input.evidence.excludesScreenshots &&
    input.evidence.excludesInvoices &&
    input.evidence.excludesOwnershipDocuments &&
    input.evidence.excludesOperatorIdentities;
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotControlledActivationPlanning(input: QL060Input): QL060Report {
  const missingPrerequisites = getMissingPrerequisites(input.prerequisites);
  const unsafeRuntimeLocks = getUnsafeRuntimeLocks(input.runtimeLocks);
  const missingPlanItems = getMissingPlanItems(input.planItems);
  const failedPlanItems = getFailedPlanItems(input.planItems);

  let status: QL060Status = 'controlled_activation_planning_ready';

  if (missingPrerequisites.length > 0) {
    status = 'blocked_missing_prerequisite';
  } else if (unsafeRuntimeLocks.length > 0 || !evidenceSafe(input)) {
    status = 'blocked_unsafe_environment';
  } else if (missingPlanItems.length > 0) {
    status = 'blocked_missing_plan_item';
  } else if (failedPlanItems.length > 0) {
    status = 'blocked_failed_plan_item';
  } else if (input.decision !== 'approve_controlled_live_pilot_activation_plan_review') {
    status = 'blocked_unsafe_scope';
  }

  const readyForActivationPlanReview = status === 'controlled_activation_planning_ready';

  return {
    status,
    decision: input.decision,
    readyForActivationPlanReview,
    requiredNextBuild: 'QL-061-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-plan-review',
    missingPrerequisites,
    missingPlanItems,
    failedPlanItems,
    unsafeRuntimeLocks,
    liveEnablementGranted: false,
    livePilotStarted: false,
    providerAccountConnected: false,
    providerLiveNumberAttached: false,
    providerDeliveryEnabled: false,
    liveRuntimeEnabled: false,
    persistenceWritesEnabled: false,
    liveCustomerAccessEnabled: false,
    safeToPersist: false,
    summary: readyForActivationPlanReview
      ? 'QL-060 controlled activation planning is ready for QL-061 plan review only. No live runtime or provider delivery is enabled.'
      : 'QL-060 controlled activation planning remains blocked. No live runtime or provider delivery is enabled.'
  };
}

export const safeQL060RuntimeLocks: QL060RuntimeLocks = {
  providerWebhookConfigured: false,
  providerCallbackAllowed: false,
  livePhoneWebhookAllowed: false,
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

export const safeQL060Prerequisites: QL060Prerequisites = {
  ql050PostClosureDecisionReady: true,
  ql051PrerequisiteEvidenceIntakeReady: true,
  ql052PrerequisiteEvidenceReviewReady: true,
  ql053PrerequisiteGapClosurePlanReady: true,
  ql054PrerequisiteGapClosureReviewReady: true,
  ql055GapEvidenceIntakeReady: true,
  ql056GapEvidenceReviewReady: true,
  ql057GapEvidenceClosureGateReady: true,
  ql058FinalReadinessReviewReady: true,
  ql059ExplicitGoNoGoDecisionApproved: true
};

export const safeQL060PlanItems: QL060PlanItem[] = requiredPlanItemIds.map((id) => ({
  id,
  label: id.replaceAll('_', ' '),
  planned: true,
  ownerReviewed: true,
  activationPlanningOnly: true,
  planReviewOnlyNext: true,
  requiresManualInterventionSteps: true,
  requiresVariableList: true,
  requiresServiceLinks: true,
  requiresApplicationLinks: true,
  requiresRollbackPlan: true,
  requiresKillSwitchPlan: true,
  requiresRateLimitPlan: true,
  requiresReplayProtectionPlan: true,
  requiresMonitoringPlan: true,
  requiresOperatorChecklist: true,
  requiresSyntheticEvidence: true,
  requiresRedactedEvidence: true,
  blocksLiveRuntime: true,
  blocksProviderDelivery: true,
  blocksPersistenceWrites: true,
  safeToPersist: false
}));

export const safeQL060Input: QL060Input = {
  decision: 'approve_controlled_live_pilot_activation_plan_review',
  prerequisites: safeQL060Prerequisites,
  runtimeLocks: safeQL060RuntimeLocks,
  planItems: safeQL060PlanItems,
  evidence: {
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    excludesLiveCustomerData: true,
    excludesProviderPayloads: true,
    excludesPhoneNumbers: true,
    excludesCredentials: true,
    excludesRecordings: true,
    excludesTranscripts: true,
    excludesScreenshots: true,
    excludesInvoices: true,
    excludesOwnershipDocuments: true,
    excludesOperatorIdentities: true
  }
};

export function runPhoneSmsControlledLiveEnablementLivePilotControlledActivationPlanning(): QL060Report {
  return reviewPhoneSmsControlledLiveEnablementLivePilotControlledActivationPlanning(safeQL060Input);
}
