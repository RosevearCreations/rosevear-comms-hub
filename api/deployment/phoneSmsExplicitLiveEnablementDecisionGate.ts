export type PhoneSmsExplicitLiveEnablementGateStatus =
  | 'blocked_pending_explicit_live_enablement_decision_gate'
  | 'blocked_decision_rejected'
  | 'blocked_pending_rework'
  | 'approved_for_controlled_live_enablement_planning'
  | 'blocked_unsafe_environment'
  | 'blocked_incomplete_prerequisites'
  | 'blocked_unredacted_or_live_evidence';

export type PhoneSmsExplicitLiveEnablementDecision =
  | 'remain_blocked'
  | 'continue_rework'
  | 'approve_controlled_live_enablement_planning';

export type PhoneSmsExplicitLiveEnablementDecisionSource =
  | 'human_owner_decision'
  | 'operator_review_decision'
  | 'release_manager_decision';

export type PhoneSmsExplicitLiveEnablementPrerequisiteBuild =
  | 'QL-028-runtime-verification'
  | 'QL-029-evidence-mapping-review'
  | 'QL-030-human-review-gate'
  | 'QL-031-operator-outcome-journal'
  | 'QL-032-rollback-evidence-retention-review'
  | 'QL-033-final-pre-enablement-readiness-review';

export type PhoneSmsExplicitLiveEnablementEnvironment = {
  PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS: 'runtime_verification_green' | 'blocked_pending_runtime_verification';
  PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS: 'evidence_mapping_review_green' | 'blocked_pending_evidence_mapping_review';
  PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS: 'human_review_gate_ready' | 'blocked_pending_human_review_gate';
  PHONE_SMS_DISABLED_DRY_RUN_OPERATOR_OUTCOME_JOURNAL_STATUS: 'operator_outcome_journal_ready' | 'blocked_pending_operator_outcome_journal';
  PHONE_SMS_DISABLED_DRY_RUN_ROLLBACK_RETENTION_STATUS: 'rollback_retention_review_ready' | 'blocked_pending_rollback_retention_review';
  PHONE_SMS_FINAL_PRE_ENABLEMENT_STATUS: 'final_pre_enablement_ready_for_decision_planning' | 'blocked_pending_final_pre_enablement_readiness_review';
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'blocked_pending_explicit_live_enablement_decision_gate' | 'approved_for_controlled_live_enablement_planning' | 'blocked_decision_rejected' | 'blocked_pending_rework';
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SYNTHETIC_ONLY: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_REDACTED_ONLY: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SMS_SEND_DISABLED: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED: boolean;
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AUTO_SEND_DISABLED: boolean;
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: boolean;
  ENABLE_PHONE_WEBHOOKS: boolean;
  ENABLE_SMS: boolean;
  ENABLE_CALL_RECORDING: boolean;
  ENABLE_AI_DRAFTS: boolean;
  ENABLE_AI_AUTO_SEND: boolean;
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: boolean;
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: boolean;
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: boolean;
  PHONE_SMS_WEBHOOK_SECRET_VALUE_STORED_OUTSIDE_REPOSITORY: boolean;
  PHONE_SMS_EXISTING_NUMBERS_PROTECTED: boolean;
};

export type PhoneSmsExplicitLiveEnablementPrerequisite = {
  build: PhoneSmsExplicitLiveEnablementPrerequisiteBuild;
  status: 'green' | 'hold' | 'rejected';
  syntheticOnly: boolean;
  redactedOnly: boolean;
  safeToPersist: false;
  planningOnly: boolean;
  summary: string;
  blockers: string[];
  containsActualPhoneNumber: boolean;
  containsProviderCredential: boolean;
  containsWebhookSecretValue: boolean;
  containsCustomerData: boolean;
  containsLivePayload: boolean;
  containsRecording: boolean;
  containsTranscript: boolean;
  enablesPersistence: boolean;
  enablesProviderCallback: boolean;
  enablesPhoneWebhook: boolean;
  enablesSmsSend: boolean;
  enablesCallRecording: boolean;
  enablesAiDraft: boolean;
  enablesAutoSend: boolean;
  enablesLiveCustomerAccess: boolean;
};

export type PhoneSmsExplicitLiveEnablementDecisionInput = {
  id: string;
  source: PhoneSmsExplicitLiveEnablementDecisionSource;
  decidedByAlias: string;
  decision: PhoneSmsExplicitLiveEnablementDecision;
  rationale: string[];
  requiredPrerequisites: PhoneSmsExplicitLiveEnablementPrerequisite[];
  syntheticEvidenceOnlyConfirmed: boolean;
  redactedEvidenceOnlyConfirmed: boolean;
  noPersistenceConfirmed: boolean;
  noLiveCustomerAccessConfirmed: boolean;
  noProviderCallbackConfirmed: boolean;
  noPhoneWebhookConfirmed: boolean;
  noSmsSendConfirmed: boolean;
  noCallRecordingConfirmed: boolean;
  noAiDraftConfirmed: boolean;
  noAutoSendConfirmed: boolean;
  existingNumbersProtectedConfirmed: boolean;
  rollbackPlanAcceptedForPlanning: boolean;
  retentionPlanAcceptedForPlanning: boolean;
  implementationBuildRequiredBeforeLiveTraffic: boolean;
};

export type PhoneSmsExplicitLiveEnablementGateOutcome = {
  id: string;
  build: 'QL-034';
  status: PhoneSmsExplicitLiveEnablementGateStatus;
  decision: PhoneSmsExplicitLiveEnablementDecision;
  approvedForControlledLiveEnablementPlanning: boolean;
  liveEnablementAllowed: false;
  implementationBuildRequiredBeforeLiveTraffic: true;
  providerCallbackAllowed: false;
  phoneWebhookAllowed: false;
  smsSendAllowed: false;
  callRecordingAllowed: false;
  aiDraftAllowed: false;
  autoSendAllowed: false;
  persistenceWrites: false;
  liveCustomerRead: false;
  liveCustomerWrite: false;
  safeToPersist: false;
  planningOnly: boolean;
  summary: string;
  blockers: string[];
  prerequisiteBuildsReviewed: PhoneSmsExplicitLiveEnablementPrerequisiteBuild[];
  requiredNextBuild: 'QL-035-controlled-live-enablement-plan';
};

export type PhoneSmsExplicitLiveEnablementGateReport = {
  build: 'QL-034';
  status: PhoneSmsExplicitLiveEnablementGateStatus;
  generatedAt: string;
  syntheticOnly: true;
  redactedOnly: true;
  safeToPersist: false;
  liveEnablementAllowed: false;
  outcomes: PhoneSmsExplicitLiveEnablementGateOutcome[];
  requiredNextBuild: 'QL-035-controlled-live-enablement-plan';
  verificationCases: Array<{
    id: string;
    expectedStatus: PhoneSmsExplicitLiveEnablementGateStatus;
    expectedLiveEnablementAllowed: false;
    passed: boolean;
  }>;
};

const requiredBuilds: PhoneSmsExplicitLiveEnablementPrerequisiteBuild[] = [
  'QL-028-runtime-verification',
  'QL-029-evidence-mapping-review',
  'QL-030-human-review-gate',
  'QL-031-operator-outcome-journal',
  'QL-032-rollback-evidence-retention-review',
  'QL-033-final-pre-enablement-readiness-review',
];

export const safeExplicitLiveEnablementGateEnvironment: PhoneSmsExplicitLiveEnablementEnvironment = {
  PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS: 'runtime_verification_green',
  PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS: 'evidence_mapping_review_green',
  PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS: 'human_review_gate_ready',
  PHONE_SMS_DISABLED_DRY_RUN_OPERATOR_OUTCOME_JOURNAL_STATUS: 'operator_outcome_journal_ready',
  PHONE_SMS_DISABLED_DRY_RUN_ROLLBACK_RETENTION_STATUS: 'rollback_retention_review_ready',
  PHONE_SMS_FINAL_PRE_ENABLEMENT_STATUS: 'final_pre_enablement_ready_for_decision_planning',
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_GATE_STATUS: 'blocked_pending_explicit_live_enablement_decision_gate',
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SYNTHETIC_ONLY: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_REDACTED_ONLY: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SMS_SEND_DISABLED: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED: true,
  PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AUTO_SEND_DISABLED: true,
  PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED: false,
  ENABLE_PHONE_WEBHOOKS: false,
  ENABLE_SMS: false,
  ENABLE_CALL_RECORDING: false,
  ENABLE_AI_DRAFTS: false,
  ENABLE_AI_AUTO_SEND: false,
  PHONE_SMS_PERSISTENCE_WRITES_DISABLED: true,
  PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED: true,
  PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED: true,
  PHONE_SMS_WEBHOOK_SECRET_VALUE_STORED_OUTSIDE_REPOSITORY: false,
  PHONE_SMS_EXISTING_NUMBERS_PROTECTED: true,
};

const approvalPrerequisites: PhoneSmsExplicitLiveEnablementPrerequisite[] = requiredBuilds.map((build) => ({
  build,
  status: 'green',
  syntheticOnly: true,
  redactedOnly: true,
  safeToPersist: false,
  planningOnly: true,
  summary: `${build} produced redacted planning evidence only.`,
  blockers: [],
  containsActualPhoneNumber: false,
  containsProviderCredential: false,
  containsWebhookSecretValue: false,
  containsCustomerData: false,
  containsLivePayload: false,
  containsRecording: false,
  containsTranscript: false,
  enablesPersistence: false,
  enablesProviderCallback: false,
  enablesPhoneWebhook: false,
  enablesSmsSend: false,
  enablesCallRecording: false,
  enablesAiDraft: false,
  enablesAutoSend: false,
  enablesLiveCustomerAccess: false,
}));

export const approvePlanningDecision: PhoneSmsExplicitLiveEnablementDecisionInput = {
  id: 'synthetic-decision-approve-controlled-planning',
  source: 'human_owner_decision',
  decidedByAlias: 'owner-review-alias',
  decision: 'approve_controlled_live_enablement_planning',
  rationale: [
    'Synthetic disabled dry-run evidence is complete enough to plan a controlled implementation build.',
    'This approval does not allow live traffic or persistence in QL-034.',
  ],
  requiredPrerequisites: approvalPrerequisites,
  syntheticEvidenceOnlyConfirmed: true,
  redactedEvidenceOnlyConfirmed: true,
  noPersistenceConfirmed: true,
  noLiveCustomerAccessConfirmed: true,
  noProviderCallbackConfirmed: true,
  noPhoneWebhookConfirmed: true,
  noSmsSendConfirmed: true,
  noCallRecordingConfirmed: true,
  noAiDraftConfirmed: true,
  noAutoSendConfirmed: true,
  existingNumbersProtectedConfirmed: true,
  rollbackPlanAcceptedForPlanning: true,
  retentionPlanAcceptedForPlanning: true,
  implementationBuildRequiredBeforeLiveTraffic: true,
};

export const holdForReworkDecision: PhoneSmsExplicitLiveEnablementDecisionInput = {
  ...approvePlanningDecision,
  id: 'synthetic-decision-continue-rework',
  decision: 'continue_rework',
  rationale: ['Continue synthetic rework before any controlled implementation planning.'],
  requiredPrerequisites: approvalPrerequisites.map((item) =>
    item.build === 'QL-033-final-pre-enablement-readiness-review'
      ? { ...item, status: 'hold', blockers: ['Final readiness notes require one more synthetic owner review.'] }
      : item,
  ),
  rollbackPlanAcceptedForPlanning: false,
  retentionPlanAcceptedForPlanning: false,
};

export const rejectLiveEnablementDecision: PhoneSmsExplicitLiveEnablementDecisionInput = {
  ...approvePlanningDecision,
  id: 'synthetic-decision-remain-blocked',
  decision: 'remain_blocked',
  rationale: ['Remain blocked until the business owner explicitly restarts the phone/SMS path.'],
  requiredPrerequisites: approvalPrerequisites,
  rollbackPlanAcceptedForPlanning: false,
  retentionPlanAcceptedForPlanning: false,
};

function hasUnsafeEnvironment(environment: PhoneSmsExplicitLiveEnablementEnvironment): boolean {
  return (
    environment.PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED ||
    environment.ENABLE_PHONE_WEBHOOKS ||
    environment.ENABLE_SMS ||
    environment.ENABLE_CALL_RECORDING ||
    environment.ENABLE_AI_DRAFTS ||
    environment.ENABLE_AI_AUTO_SEND ||
    !environment.PHONE_SMS_PERSISTENCE_WRITES_DISABLED ||
    !environment.PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED ||
    !environment.PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SYNTHETIC_ONLY ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_REDACTED_ONLY ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_NO_PERSISTENCE_WRITES ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_LIVE_CUSTOMER_ACCESS_DISABLED ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PROVIDER_CALLBACK_DISABLED ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_PHONE_WEBHOOK_DISABLED ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_SMS_SEND_DISABLED ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_CALL_RECORDING_DISABLED ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AI_DRAFTS_DISABLED ||
    !environment.PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_AUTO_SEND_DISABLED ||
    !environment.PHONE_SMS_EXISTING_NUMBERS_PROTECTED
  );
}

function hasGreenPrerequisiteEnvironment(environment: PhoneSmsExplicitLiveEnablementEnvironment): boolean {
  return (
    environment.PHONE_SMS_DISABLED_DRY_RUN_RUNTIME_VERIFICATION_STATUS === 'runtime_verification_green' &&
    environment.PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_STATUS === 'evidence_mapping_review_green' &&
    environment.PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE_STATUS === 'human_review_gate_ready' &&
    environment.PHONE_SMS_DISABLED_DRY_RUN_OPERATOR_OUTCOME_JOURNAL_STATUS === 'operator_outcome_journal_ready' &&
    environment.PHONE_SMS_DISABLED_DRY_RUN_ROLLBACK_RETENTION_STATUS === 'rollback_retention_review_ready' &&
    environment.PHONE_SMS_FINAL_PRE_ENABLEMENT_STATUS === 'final_pre_enablement_ready_for_decision_planning'
  );
}

function hasUnsafePrerequisiteEvidence(prerequisite: PhoneSmsExplicitLiveEnablementPrerequisite): boolean {
  return (
    !prerequisite.syntheticOnly ||
    !prerequisite.redactedOnly ||
    prerequisite.safeToPersist !== false ||
    !prerequisite.planningOnly ||
    prerequisite.containsActualPhoneNumber ||
    prerequisite.containsProviderCredential ||
    prerequisite.containsWebhookSecretValue ||
    prerequisite.containsCustomerData ||
    prerequisite.containsLivePayload ||
    prerequisite.containsRecording ||
    prerequisite.containsTranscript ||
    prerequisite.enablesPersistence ||
    prerequisite.enablesProviderCallback ||
    prerequisite.enablesPhoneWebhook ||
    prerequisite.enablesSmsSend ||
    prerequisite.enablesCallRecording ||
    prerequisite.enablesAiDraft ||
    prerequisite.enablesAutoSend ||
    prerequisite.enablesLiveCustomerAccess
  );
}

function hasRequiredBuildCoverage(prerequisites: PhoneSmsExplicitLiveEnablementPrerequisite[]): boolean {
  const provided = new Set(prerequisites.map((item) => item.build));
  return requiredBuilds.every((build) => provided.has(build));
}

function hasUnsafeDecisionConfirmations(decision: PhoneSmsExplicitLiveEnablementDecisionInput): boolean {
  return (
    !decision.syntheticEvidenceOnlyConfirmed ||
    !decision.redactedEvidenceOnlyConfirmed ||
    !decision.noPersistenceConfirmed ||
    !decision.noLiveCustomerAccessConfirmed ||
    !decision.noProviderCallbackConfirmed ||
    !decision.noPhoneWebhookConfirmed ||
    !decision.noSmsSendConfirmed ||
    !decision.noCallRecordingConfirmed ||
    !decision.noAiDraftConfirmed ||
    !decision.noAutoSendConfirmed ||
    !decision.existingNumbersProtectedConfirmed ||
    !decision.implementationBuildRequiredBeforeLiveTraffic
  );
}

export function createPhoneSmsExplicitLiveEnablementDecisionGateOutcome(params: {
  environment: PhoneSmsExplicitLiveEnablementEnvironment;
  decision: PhoneSmsExplicitLiveEnablementDecisionInput;
}): PhoneSmsExplicitLiveEnablementGateOutcome {
  const { environment, decision } = params;
  const blockers: string[] = [];

  if (hasUnsafeEnvironment(environment)) {
    blockers.push('Environment enables live behavior or disables required safety locks.');
  }

  if (!hasGreenPrerequisiteEnvironment(environment)) {
    blockers.push('One or more prerequisite dry-run gates are not green.');
  }

  if (!hasRequiredBuildCoverage(decision.requiredPrerequisites)) {
    blockers.push('Decision input does not cover every required prerequisite build from QL-028 through QL-033.');
  }

  if (decision.requiredPrerequisites.some(hasUnsafePrerequisiteEvidence)) {
    blockers.push('Prerequisite evidence includes unsafe, live, persistent, secret, customer, recording, transcript, or unredacted content.');
  }

  if (hasUnsafeDecisionConfirmations(decision)) {
    blockers.push('Decision input is missing one or more required safety confirmations.');
  }

  if (decision.decision === 'approve_controlled_live_enablement_planning') {
    if (!decision.rollbackPlanAcceptedForPlanning) {
      blockers.push('Controlled planning approval requires rollback plan acceptance for planning.');
    }
    if (!decision.retentionPlanAcceptedForPlanning) {
      blockers.push('Controlled planning approval requires retention plan acceptance for planning.');
    }
  }

  if (blockers.length > 0) {
    const status: PhoneSmsExplicitLiveEnablementGateStatus = hasUnsafeEnvironment(environment)
      ? 'blocked_unsafe_environment'
      : decision.requiredPrerequisites.some(hasUnsafePrerequisiteEvidence)
        ? 'blocked_unredacted_or_live_evidence'
        : 'blocked_incomplete_prerequisites';

    return {
      id: `${decision.id}-outcome`,
      build: 'QL-034',
      status,
      decision: decision.decision,
      approvedForControlledLiveEnablementPlanning: false,
      liveEnablementAllowed: false,
      implementationBuildRequiredBeforeLiveTraffic: true,
      providerCallbackAllowed: false,
      phoneWebhookAllowed: false,
      smsSendAllowed: false,
      callRecordingAllowed: false,
      aiDraftAllowed: false,
      autoSendAllowed: false,
      persistenceWrites: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      safeToPersist: false,
      planningOnly: true,
      summary: 'QL-034 blocked the explicit live enablement decision gate.',
      blockers,
      prerequisiteBuildsReviewed: decision.requiredPrerequisites.map((item) => item.build),
      requiredNextBuild: 'QL-035-controlled-live-enablement-plan',
    };
  }

  if (decision.decision === 'approve_controlled_live_enablement_planning') {
    return {
      id: `${decision.id}-outcome`,
      build: 'QL-034',
      status: 'approved_for_controlled_live_enablement_planning',
      decision: decision.decision,
      approvedForControlledLiveEnablementPlanning: true,
      liveEnablementAllowed: false,
      implementationBuildRequiredBeforeLiveTraffic: true,
      providerCallbackAllowed: false,
      phoneWebhookAllowed: false,
      smsSendAllowed: false,
      callRecordingAllowed: false,
      aiDraftAllowed: false,
      autoSendAllowed: false,
      persistenceWrites: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      safeToPersist: false,
      planningOnly: true,
      summary: 'QL-034 approved only the next controlled live enablement planning build; no live behavior is enabled.',
      blockers: [],
      prerequisiteBuildsReviewed: decision.requiredPrerequisites.map((item) => item.build),
      requiredNextBuild: 'QL-035-controlled-live-enablement-plan',
    };
  }

  if (decision.decision === 'continue_rework') {
    return {
      id: `${decision.id}-outcome`,
      build: 'QL-034',
      status: 'blocked_pending_rework',
      decision: decision.decision,
      approvedForControlledLiveEnablementPlanning: false,
      liveEnablementAllowed: false,
      implementationBuildRequiredBeforeLiveTraffic: true,
      providerCallbackAllowed: false,
      phoneWebhookAllowed: false,
      smsSendAllowed: false,
      callRecordingAllowed: false,
      aiDraftAllowed: false,
      autoSendAllowed: false,
      persistenceWrites: false,
      liveCustomerRead: false,
      liveCustomerWrite: false,
      safeToPersist: false,
      planningOnly: true,
      summary: 'QL-034 held the path for more synthetic rework.',
      blockers: ['Decision selected continue_rework.'],
      prerequisiteBuildsReviewed: decision.requiredPrerequisites.map((item) => item.build),
      requiredNextBuild: 'QL-035-controlled-live-enablement-plan',
    };
  }

  return {
    id: `${decision.id}-outcome`,
    build: 'QL-034',
    status: 'blocked_decision_rejected',
    decision: decision.decision,
    approvedForControlledLiveEnablementPlanning: false,
    liveEnablementAllowed: false,
    implementationBuildRequiredBeforeLiveTraffic: true,
    providerCallbackAllowed: false,
    phoneWebhookAllowed: false,
    smsSendAllowed: false,
    callRecordingAllowed: false,
    aiDraftAllowed: false,
    autoSendAllowed: false,
    persistenceWrites: false,
    liveCustomerRead: false,
    liveCustomerWrite: false,
    safeToPersist: false,
    planningOnly: true,
    summary: 'QL-034 rejected the live enablement path and kept the system blocked.',
    blockers: ['Decision selected remain_blocked.'],
    prerequisiteBuildsReviewed: decision.requiredPrerequisites.map((item) => item.build),
    requiredNextBuild: 'QL-035-controlled-live-enablement-plan',
  };
}

export function runPhoneSmsExplicitLiveEnablementDecisionGate(): PhoneSmsExplicitLiveEnablementGateReport {
  const safeOutcome = createPhoneSmsExplicitLiveEnablementDecisionGateOutcome({
    environment: safeExplicitLiveEnablementGateEnvironment,
    decision: approvePlanningDecision,
  });

  const holdOutcome = createPhoneSmsExplicitLiveEnablementDecisionGateOutcome({
    environment: safeExplicitLiveEnablementGateEnvironment,
    decision: holdForReworkDecision,
  });

  const rejectOutcome = createPhoneSmsExplicitLiveEnablementDecisionGateOutcome({
    environment: safeExplicitLiveEnablementGateEnvironment,
    decision: rejectLiveEnablementDecision,
  });

  const unsafeEnvironmentOutcome = createPhoneSmsExplicitLiveEnablementDecisionGateOutcome({
    environment: {
      ...safeExplicitLiveEnablementGateEnvironment,
      ENABLE_SMS: true,
    },
    decision: approvePlanningDecision,
  });

  const unsafeEvidenceOutcome = createPhoneSmsExplicitLiveEnablementDecisionGateOutcome({
    environment: safeExplicitLiveEnablementGateEnvironment,
    decision: {
      ...approvePlanningDecision,
      id: 'synthetic-decision-with-unsafe-evidence',
      requiredPrerequisites: approvalPrerequisites.map((item) =>
        item.build === 'QL-029-evidence-mapping-review'
          ? { ...item, containsActualPhoneNumber: true, redactedOnly: false }
          : item,
      ),
    },
  });

  return {
    build: 'QL-034',
    status: safeOutcome.status,
    generatedAt: 'synthetic-ql-034-report',
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    liveEnablementAllowed: false,
    outcomes: [safeOutcome, holdOutcome, rejectOutcome, unsafeEnvironmentOutcome, unsafeEvidenceOutcome],
    requiredNextBuild: 'QL-035-controlled-live-enablement-plan',
    verificationCases: [
      {
        id: 'approve_controlled_planning_only',
        expectedStatus: 'approved_for_controlled_live_enablement_planning',
        expectedLiveEnablementAllowed: false,
        passed: safeOutcome.status === 'approved_for_controlled_live_enablement_planning' && safeOutcome.liveEnablementAllowed === false,
      },
      {
        id: 'continue_rework_keeps_blocked',
        expectedStatus: 'blocked_pending_rework',
        expectedLiveEnablementAllowed: false,
        passed: holdOutcome.status === 'blocked_pending_rework' && holdOutcome.liveEnablementAllowed === false,
      },
      {
        id: 'reject_keeps_blocked',
        expectedStatus: 'blocked_decision_rejected',
        expectedLiveEnablementAllowed: false,
        passed: rejectOutcome.status === 'blocked_decision_rejected' && rejectOutcome.liveEnablementAllowed === false,
      },
      {
        id: 'unsafe_environment_rejected',
        expectedStatus: 'blocked_unsafe_environment',
        expectedLiveEnablementAllowed: false,
        passed: unsafeEnvironmentOutcome.status === 'blocked_unsafe_environment' && unsafeEnvironmentOutcome.liveEnablementAllowed === false,
      },
      {
        id: 'unsafe_evidence_rejected',
        expectedStatus: 'blocked_unredacted_or_live_evidence',
        expectedLiveEnablementAllowed: false,
        passed: unsafeEvidenceOutcome.status === 'blocked_unredacted_or_live_evidence' && unsafeEvidenceOutcome.liveEnablementAllowed === false,
      },
    ],
  };
}
