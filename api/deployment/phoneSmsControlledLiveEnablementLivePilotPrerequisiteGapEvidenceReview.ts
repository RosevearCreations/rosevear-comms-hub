export type LivePilotPrerequisiteGapEvidenceReviewStatus =
  | 'live_pilot_prerequisite_gap_evidence_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_missing_gap_evidence_intake'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_review_item'
  | 'blocked_failed_review_item'
  | 'blocked_unsafe_evidence';

export type LivePilotPrerequisiteGapEvidenceReviewDecision =
  | 'approve_live_pilot_prerequisite_gap_evidence_closure_gate'
  | 'continue_gap_evidence_rework'
  | 'remain_blocked';

export type LivePilotPrerequisiteGapEvidenceReviewItemId =
  | 'owner_manual_approval_gap_evidence_review'
  | 'provider_setup_prerequisites_gap_evidence_review'
  | 'provider_disabled_mode_boundary_gap_evidence_review'
  | 'phone_number_ownership_readiness_gap_evidence_review'
  | 'sms_consent_policy_gap_evidence_review'
  | 'stop_start_help_policy_gap_evidence_review'
  | 'call_recording_notice_policy_gap_evidence_review'
  | 'staff_access_controls_gap_evidence_review'
  | 'rollback_kill_switch_gap_evidence_review'
  | 'rate_limit_replay_controls_gap_evidence_review'
  | 'audit_redaction_gap_evidence_review'
  | 'customer_data_boundary_gap_evidence_review'
  | 'provider_callback_disabled_proof_gap_evidence_review'
  | 'live_phone_webhook_disabled_proof_gap_evidence_review'
  | 'sms_sending_disabled_proof_gap_evidence_review'
  | 'recording_disabled_proof_gap_evidence_review'
  | 'ai_disabled_proof_gap_evidence_review'
  | 'persistence_disabled_proof_gap_evidence_review'
  | 'live_pilot_runtime_disabled_proof_gap_evidence_review'
  | 'production_proof_gap_evidence_review';

export type LivePilotPrerequisiteGapEvidenceReviewGateId =
  | 'ql_050_post_closure_live_pilot_readiness_decision_gate'
  | 'ql_051_live_pilot_prerequisite_evidence_intake'
  | 'ql_052_live_pilot_prerequisite_evidence_review'
  | 'ql_053_live_pilot_prerequisite_gap_closure_plan'
  | 'ql_054_live_pilot_prerequisite_gap_closure_review'
  | 'ql_055_live_pilot_prerequisite_gap_evidence_intake';

export interface LivePilotPrerequisiteGapEvidenceReviewEnvironment {
  ql050PostClosureLivePilotReadinessDecisionGateApproved: boolean;
  ql051PrerequisiteEvidenceIntakeReady: boolean;
  ql052PrerequisiteEvidenceReviewReady: boolean;
  ql053PrerequisiteGapClosurePlanReady: boolean;
  ql054PrerequisiteGapClosureReviewReady: boolean;
  ql055PrerequisiteGapEvidenceIntakeReady: boolean;
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
  archiveWritesAllowed: boolean;
  retentionPolicyWritesAllowed: boolean;
  providerAccountConnectionAllowed: boolean;
  providerLiveNumberAttachmentAllowed: boolean;
  livePilotRuntimeAllowed: boolean;
}

export interface LivePilotPrerequisiteGapEvidenceReviewItem {
  id: LivePilotPrerequisiteGapEvidenceReviewItemId;
  label: string;
  gapEvidencePresent: boolean;
  reviewed: boolean;
  passed: boolean;
  reviewOnly: boolean;
  noLiveEnablementApproval: boolean;
  noLivePilotRuntime: boolean;
  noProviderConnection: boolean;
  noProviderDelivery: boolean;
  noPersistenceWrites: boolean;
  syntheticOnly: boolean;
  redactedOnly: boolean;
  safeToPersist: boolean;
  notes?: string;
}

export interface LivePilotPrerequisiteGapEvidenceReviewEvidence {
  syntheticOnly: boolean;
  redactedOnly: boolean;
  safeToPersist: boolean;
  reviewer: 'remote_operator' | 'owner' | 'system_fixture';
  reviewedAtIso: string;
  evidenceLabel: string;
}

export interface LivePilotPrerequisiteGapEvidenceReviewInput {
  environment: LivePilotPrerequisiteGapEvidenceReviewEnvironment;
  reviewItems: LivePilotPrerequisiteGapEvidenceReviewItem[];
  evidence: LivePilotPrerequisiteGapEvidenceReviewEvidence;
}

export interface LivePilotPrerequisiteGapEvidenceReviewReport {
  status: LivePilotPrerequisiteGapEvidenceReviewStatus;
  decision: LivePilotPrerequisiteGapEvidenceReviewDecision;
  approvedForGapEvidenceClosureGate: boolean;
  providerWebhookConfigured: false;
  providerCallbackAllowed: false;
  phoneWebhookAllowed: false;
  smsSendAllowed: false;
  callRecordingAllowed: false;
  aiDraftAllowed: false;
  aiAutoSendAllowed: false;
  persistenceWritesAllowed: false;
  liveCustomerReadAllowed: false;
  liveCustomerWriteAllowed: false;
  dryRunExecutionAllowed: false;
  providerDeliveryAllowed: false;
  archiveWritesAllowed: false;
  retentionPolicyWritesAllowed: false;
  providerAccountConnectionAllowed: false;
  providerLiveNumberAttachmentAllowed: false;
  livePilotRuntimeAllowed: false;
  safeToPersist: false;
  missingPrerequisites: LivePilotPrerequisiteGapEvidenceReviewGateId[];
  missingReviewItems: LivePilotPrerequisiteGapEvidenceReviewItemId[];
  failedReviewItems: LivePilotPrerequisiteGapEvidenceReviewItemId[];
  unsafeEvidenceItems: LivePilotPrerequisiteGapEvidenceReviewItemId[];
  requiredNextBuild: 'QL-057-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-closure-gate';
  summary: string[];
}

export const requiredLivePilotPrerequisiteGapEvidenceReviewItems: LivePilotPrerequisiteGapEvidenceReviewItemId[] = [
  'owner_manual_approval_gap_evidence_review',
  'provider_setup_prerequisites_gap_evidence_review',
  'provider_disabled_mode_boundary_gap_evidence_review',
  'phone_number_ownership_readiness_gap_evidence_review',
  'sms_consent_policy_gap_evidence_review',
  'stop_start_help_policy_gap_evidence_review',
  'call_recording_notice_policy_gap_evidence_review',
  'staff_access_controls_gap_evidence_review',
  'rollback_kill_switch_gap_evidence_review',
  'rate_limit_replay_controls_gap_evidence_review',
  'audit_redaction_gap_evidence_review',
  'customer_data_boundary_gap_evidence_review',
  'provider_callback_disabled_proof_gap_evidence_review',
  'live_phone_webhook_disabled_proof_gap_evidence_review',
  'sms_sending_disabled_proof_gap_evidence_review',
  'recording_disabled_proof_gap_evidence_review',
  'ai_disabled_proof_gap_evidence_review',
  'persistence_disabled_proof_gap_evidence_review',
  'live_pilot_runtime_disabled_proof_gap_evidence_review',
  'production_proof_gap_evidence_review'
];

const requiredPrerequisites: Array<{
  id: LivePilotPrerequisiteGapEvidenceReviewGateId;
  passed: (environment: LivePilotPrerequisiteGapEvidenceReviewEnvironment) => boolean;
}> = [
  {
    id: 'ql_050_post_closure_live_pilot_readiness_decision_gate',
    passed: (environment) => environment.ql050PostClosureLivePilotReadinessDecisionGateApproved
  },
  {
    id: 'ql_051_live_pilot_prerequisite_evidence_intake',
    passed: (environment) => environment.ql051PrerequisiteEvidenceIntakeReady
  },
  {
    id: 'ql_052_live_pilot_prerequisite_evidence_review',
    passed: (environment) => environment.ql052PrerequisiteEvidenceReviewReady
  },
  {
    id: 'ql_053_live_pilot_prerequisite_gap_closure_plan',
    passed: (environment) => environment.ql053PrerequisiteGapClosurePlanReady
  },
  {
    id: 'ql_054_live_pilot_prerequisite_gap_closure_review',
    passed: (environment) => environment.ql054PrerequisiteGapClosureReviewReady
  },
  {
    id: 'ql_055_live_pilot_prerequisite_gap_evidence_intake',
    passed: (environment) => environment.ql055PrerequisiteGapEvidenceIntakeReady
  }
];

export const safeLivePilotPrerequisiteGapEvidenceReviewEnvironment: LivePilotPrerequisiteGapEvidenceReviewEnvironment = {
  ql050PostClosureLivePilotReadinessDecisionGateApproved: true,
  ql051PrerequisiteEvidenceIntakeReady: true,
  ql052PrerequisiteEvidenceReviewReady: true,
  ql053PrerequisiteGapClosurePlanReady: true,
  ql054PrerequisiteGapClosureReviewReady: true,
  ql055PrerequisiteGapEvidenceIntakeReady: true,
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
  providerAccountConnectionAllowed: false,
  providerLiveNumberAttachmentAllowed: false,
  livePilotRuntimeAllowed: false
};

export const safeLivePilotPrerequisiteGapEvidenceReviewItems: LivePilotPrerequisiteGapEvidenceReviewItem[] =
  requiredLivePilotPrerequisiteGapEvidenceReviewItems.map((id) => ({
    id,
    label: `Synthetic redacted review for ${id.replace(/_/g, ' ')}`,
    gapEvidencePresent: true,
    reviewed: true,
    passed: true,
    reviewOnly: true,
    noLiveEnablementApproval: true,
    noLivePilotRuntime: true,
    noProviderConnection: true,
    noProviderDelivery: true,
    noPersistenceWrites: true,
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false
  }));

export const safeLivePilotPrerequisiteGapEvidenceReviewInput: LivePilotPrerequisiteGapEvidenceReviewInput = {
  environment: safeLivePilotPrerequisiteGapEvidenceReviewEnvironment,
  reviewItems: safeLivePilotPrerequisiteGapEvidenceReviewItems,
  evidence: {
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    reviewer: 'system_fixture',
    reviewedAtIso: '2026-10-08T09:01:00.000-04:00',
    evidenceLabel: 'synthetic-redacted-ql-056-gap-evidence-review'
  }
};

const hasUnsafeEnvironment = (environment: LivePilotPrerequisiteGapEvidenceReviewEnvironment): boolean =>
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
  environment.archiveWritesAllowed ||
  environment.retentionPolicyWritesAllowed ||
  environment.providerAccountConnectionAllowed ||
  environment.providerLiveNumberAttachmentAllowed ||
  environment.livePilotRuntimeAllowed;

const isReviewItemSafe = (item: LivePilotPrerequisiteGapEvidenceReviewItem): boolean =>
  item.gapEvidencePresent &&
  item.reviewed &&
  item.passed &&
  item.reviewOnly &&
  item.noLiveEnablementApproval &&
  item.noLivePilotRuntime &&
  item.noProviderConnection &&
  item.noProviderDelivery &&
  item.noPersistenceWrites &&
  item.syntheticOnly &&
  item.redactedOnly &&
  item.safeToPersist === false;

const buildBlockedReport = (
  status: LivePilotPrerequisiteGapEvidenceReviewStatus,
  decision: LivePilotPrerequisiteGapEvidenceReviewDecision,
  missingPrerequisites: LivePilotPrerequisiteGapEvidenceReviewGateId[],
  missingReviewItems: LivePilotPrerequisiteGapEvidenceReviewItemId[],
  failedReviewItems: LivePilotPrerequisiteGapEvidenceReviewItemId[],
  unsafeEvidenceItems: LivePilotPrerequisiteGapEvidenceReviewItemId[],
  summary: string[]
): LivePilotPrerequisiteGapEvidenceReviewReport => ({
  status,
  decision,
  approvedForGapEvidenceClosureGate: false,
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
  providerAccountConnectionAllowed: false,
  providerLiveNumberAttachmentAllowed: false,
  livePilotRuntimeAllowed: false,
  safeToPersist: false,
  missingPrerequisites,
  missingReviewItems,
  failedReviewItems,
  unsafeEvidenceItems,
  requiredNextBuild: 'QL-057-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-closure-gate',
  summary
});

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidence(
  input: LivePilotPrerequisiteGapEvidenceReviewInput
): LivePilotPrerequisiteGapEvidenceReviewReport {
  const missingPrerequisites = requiredPrerequisites
    .filter((gate) => !gate.passed(input.environment))
    .map((gate) => gate.id);

  if (missingPrerequisites.length > 0) {
    return buildBlockedReport(
      'blocked_pending_prerequisites',
      'remain_blocked',
      missingPrerequisites,
      [],
      [],
      [],
      ['QL-056 cannot review gap evidence until all prerequisite gates through QL-055 are ready.']
    );
  }

  if (!input.environment.ql055PrerequisiteGapEvidenceIntakeReady) {
    return buildBlockedReport(
      'blocked_missing_gap_evidence_intake',
      'remain_blocked',
      [],
      [],
      [],
      [],
      ['QL-056 requires QL-055 gap evidence intake readiness before review.']
    );
  }

  if (hasUnsafeEnvironment(input.environment)) {
    return buildBlockedReport(
      'blocked_unsafe_environment',
      'remain_blocked',
      [],
      [],
      [],
      [],
      ['QL-056 is review-only and requires all live/provider/runtime/write paths to remain disabled.']
    );
  }

  const itemIds = new Set(input.reviewItems.map((item) => item.id));
  const missingReviewItems = requiredLivePilotPrerequisiteGapEvidenceReviewItems.filter((id) => !itemIds.has(id));

  if (missingReviewItems.length > 0) {
    return buildBlockedReport(
      'blocked_missing_review_item',
      'continue_gap_evidence_rework',
      [],
      missingReviewItems,
      [],
      [],
      ['Every QL-055 gap evidence item must have a matching QL-056 review item.']
    );
  }

  const failedReviewItems = input.reviewItems
    .filter((item) => requiredLivePilotPrerequisiteGapEvidenceReviewItems.includes(item.id))
    .filter((item) => !item.reviewed || !item.passed || !item.gapEvidencePresent)
    .map((item) => item.id);

  if (failedReviewItems.length > 0) {
    return buildBlockedReport(
      'blocked_failed_review_item',
      'continue_gap_evidence_rework',
      [],
      [],
      failedReviewItems,
      [],
      ['One or more QL-056 review items did not pass and must return to evidence rework.']
    );
  }

  const unsafeEvidenceItems = input.reviewItems
    .filter((item) => requiredLivePilotPrerequisiteGapEvidenceReviewItems.includes(item.id))
    .filter((item) => !isReviewItemSafe(item))
    .map((item) => item.id);

  if (
    unsafeEvidenceItems.length > 0 ||
    !input.evidence.syntheticOnly ||
    !input.evidence.redactedOnly ||
    input.evidence.safeToPersist !== false
  ) {
    return buildBlockedReport(
      'blocked_unsafe_evidence',
      'continue_gap_evidence_rework',
      [],
      [],
      [],
      unsafeEvidenceItems,
      ['QL-056 accepts only synthetic, redacted, non-persistable review evidence.']
    );
  }

  return {
    status: 'live_pilot_prerequisite_gap_evidence_review_ready',
    decision: 'approve_live_pilot_prerequisite_gap_evidence_closure_gate',
    approvedForGapEvidenceClosureGate: true,
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
    providerAccountConnectionAllowed: false,
    providerLiveNumberAttachmentAllowed: false,
    livePilotRuntimeAllowed: false,
    safeToPersist: false,
    missingPrerequisites: [],
    missingReviewItems: [],
    failedReviewItems: [],
    unsafeEvidenceItems: [],
    requiredNextBuild: 'QL-057-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-closure-gate',
    summary: [
      'QL-056 reviewed QL-055 prerequisite gap evidence intake and found the synthetic/redacted review set complete.',
      'Approval is limited to the QL-057 prerequisite gap evidence closure gate only.',
      'No live pilot runtime, provider delivery, provider connection, live number attachment, messaging, recording, AI, persistence, archive, retention, or live customer access is enabled.'
    ]
  };
}

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceReview(): LivePilotPrerequisiteGapEvidenceReviewReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidence(
    safeLivePilotPrerequisiteGapEvidenceReviewInput
  );
}
