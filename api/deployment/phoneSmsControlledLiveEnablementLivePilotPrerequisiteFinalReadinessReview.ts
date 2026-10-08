export type LivePilotPrerequisiteFinalReadinessReviewStatus =
  | 'live_pilot_prerequisite_final_readiness_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_review_item'
  | 'blocked_failed_review_item'
  | 'blocked_unsafe_review_item'
  | 'blocked_unsafe_evidence';

export type LivePilotPrerequisiteFinalReadinessReviewDecision =
  | 'approve_live_pilot_explicit_go_no_go_decision_gate'
  | 'continue_rework'
  | 'remain_blocked';

export type LivePilotPrerequisiteFinalReadinessReviewItemId =
  | 'owner_manual_approval_readiness'
  | 'provider_setup_prerequisite_readiness'
  | 'provider_disabled_mode_boundary_readiness'
  | 'phone_number_ownership_readiness'
  | 'sms_consent_policy_readiness'
  | 'stop_start_help_policy_readiness'
  | 'call_recording_notice_policy_readiness'
  | 'staff_access_control_readiness'
  | 'rollback_kill_switch_readiness'
  | 'rate_limit_replay_control_readiness'
  | 'audit_redaction_readiness'
  | 'customer_data_boundary_readiness'
  | 'provider_callback_disabled_readiness'
  | 'live_phone_webhook_disabled_readiness'
  | 'sms_sending_disabled_readiness'
  | 'recording_disabled_readiness'
  | 'ai_features_disabled_readiness'
  | 'persistence_disabled_readiness'
  | 'live_pilot_runtime_disabled_readiness'
  | 'production_proof_readiness'
  | 'next_gate_explicit_go_no_go_ready';

export interface LivePilotPrerequisiteFinalReadinessReviewEnvironment {
  ql050PostClosureReadinessDecisionGateApproved: boolean;
  ql051PrerequisiteEvidenceIntakeReady: boolean;
  ql052PrerequisiteEvidenceReviewReady: boolean;
  ql053PrerequisiteGapClosurePlanReady: boolean;
  ql054PrerequisiteGapClosureReviewReady: boolean;
  ql055PrerequisiteGapEvidenceIntakeReady: boolean;
  ql056PrerequisiteGapEvidenceReviewReady: boolean;
  ql057PrerequisiteGapEvidenceClosureGateReady: boolean;
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

export interface LivePilotPrerequisiteFinalReadinessReviewEvidence {
  syntheticOnly: boolean;
  redactedOnly: boolean;
  safeToPersist: boolean;
  labels: string[];
  notes: string[];
}

export interface LivePilotPrerequisiteFinalReadinessReviewItem {
  id: LivePilotPrerequisiteFinalReadinessReviewItemId;
  label: string;
  reviewPresent: boolean;
  reviewed: boolean;
  passed: boolean;
  reviewOnly: boolean;
  finalReadinessReviewScope: boolean;
  noLiveEnablementApproval: boolean;
  noLivePilotRuntime: boolean;
  noProviderConnection: boolean;
  noProviderDelivery: boolean;
  noPersistenceWrites: boolean;
  noLiveCustomerData: boolean;
  noRuntimeExecution: boolean;
  syntheticEvidenceOnly: boolean;
  redactedEvidenceOnly: boolean;
  safeToPersist: boolean;
}

export interface LivePilotPrerequisiteFinalReadinessReviewInput {
  environment: LivePilotPrerequisiteFinalReadinessReviewEnvironment;
  evidence: LivePilotPrerequisiteFinalReadinessReviewEvidence;
  items: LivePilotPrerequisiteFinalReadinessReviewItem[];
  requestedDecision: LivePilotPrerequisiteFinalReadinessReviewDecision;
}

export interface LivePilotPrerequisiteFinalReadinessReviewReport {
  build: 'QL-058';
  status: LivePilotPrerequisiteFinalReadinessReviewStatus;
  decision: LivePilotPrerequisiteFinalReadinessReviewDecision;
  approvedForExplicitGoNoGoDecisionGate: boolean;
  liveEnablementGranted: false;
  livePilotStarted: false;
  runtimeVerificationExecuted: false;
  providerAccountConnected: false;
  providerLiveNumberAttached: false;
  providerDeliveryEnabled: false;
  persistenceWritesEnabled: false;
  livePilotRuntimeEnabled: false;
  safeToPersist: false;
  requiredNextBuild: 'QL-059-phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate';
  blockers: string[];
  reviewedItems: string[];
}

const REQUIRED_ITEMS: ReadonlyArray<LivePilotPrerequisiteFinalReadinessReviewItemId> = [
  'owner_manual_approval_readiness',
  'provider_setup_prerequisite_readiness',
  'provider_disabled_mode_boundary_readiness',
  'phone_number_ownership_readiness',
  'sms_consent_policy_readiness',
  'stop_start_help_policy_readiness',
  'call_recording_notice_policy_readiness',
  'staff_access_control_readiness',
  'rollback_kill_switch_readiness',
  'rate_limit_replay_control_readiness',
  'audit_redaction_readiness',
  'customer_data_boundary_readiness',
  'provider_callback_disabled_readiness',
  'live_phone_webhook_disabled_readiness',
  'sms_sending_disabled_readiness',
  'recording_disabled_readiness',
  'ai_features_disabled_readiness',
  'persistence_disabled_readiness',
  'live_pilot_runtime_disabled_readiness',
  'production_proof_readiness',
  'next_gate_explicit_go_no_go_ready',
];

function missingPrerequisites(environment: LivePilotPrerequisiteFinalReadinessReviewEnvironment): string[] {
  const blockers: string[] = [];

  if (!environment.ql050PostClosureReadinessDecisionGateApproved) blockers.push('QL-050 readiness decision gate is not approved.');
  if (!environment.ql051PrerequisiteEvidenceIntakeReady) blockers.push('QL-051 prerequisite evidence intake is not ready.');
  if (!environment.ql052PrerequisiteEvidenceReviewReady) blockers.push('QL-052 prerequisite evidence review is not ready.');
  if (!environment.ql053PrerequisiteGapClosurePlanReady) blockers.push('QL-053 prerequisite gap closure plan is not ready.');
  if (!environment.ql054PrerequisiteGapClosureReviewReady) blockers.push('QL-054 prerequisite gap closure review is not ready.');
  if (!environment.ql055PrerequisiteGapEvidenceIntakeReady) blockers.push('QL-055 prerequisite gap evidence intake is not ready.');
  if (!environment.ql056PrerequisiteGapEvidenceReviewReady) blockers.push('QL-056 prerequisite gap evidence review is not ready.');
  if (!environment.ql057PrerequisiteGapEvidenceClosureGateReady) blockers.push('QL-057 prerequisite gap evidence closure gate is not ready.');

  return blockers;
}

function unsafeEnvironment(environment: LivePilotPrerequisiteFinalReadinessReviewEnvironment): string[] {
  const blockers: string[] = [];
  const disabledFlags: Array<[keyof LivePilotPrerequisiteFinalReadinessReviewEnvironment, string]> = [
    ['providerWebhookConfigured', 'Provider webhook configuration must remain absent.'],
    ['providerCallbackAllowed', 'Provider callbacks must remain disabled.'],
    ['phoneWebhookAllowed', 'Live phone webhooks must remain disabled.'],
    ['smsSendAllowed', 'SMS sending must remain disabled.'],
    ['callRecordingAllowed', 'Call recording must remain disabled.'],
    ['aiDraftAllowed', 'AI drafts must remain disabled.'],
    ['aiAutoSendAllowed', 'AI auto-send must remain disabled.'],
    ['persistenceWritesAllowed', 'Persistence writes must remain disabled.'],
    ['liveCustomerReadAllowed', 'Live customer reads must remain disabled.'],
    ['liveCustomerWriteAllowed', 'Live customer writes must remain disabled.'],
    ['dryRunExecutionAllowed', 'Dry-run execution must remain disabled.'],
    ['providerDeliveryAllowed', 'Provider delivery must remain disabled.'],
    ['archiveWriteAllowed', 'Archive writes must remain disabled.'],
    ['retentionPolicyWriteAllowed', 'Retention policy writes must remain disabled.'],
    ['providerAccountConnectionAllowed', 'Provider account connection must remain disabled.'],
    ['providerLiveNumberAttachmentAllowed', 'Provider live-number attachment must remain disabled.'],
    ['livePilotRuntimeAllowed', 'Live pilot runtime must remain disabled.'],
  ];

  for (const [flag, message] of disabledFlags) {
    if (environment[flag]) blockers.push(message);
  }

  return blockers;
}

function reviewItemBlockers(items: LivePilotPrerequisiteFinalReadinessReviewItem[]): string[] {
  const blockers: string[] = [];
  const byId = new Map(items.map((item) => [item.id, item]));

  for (const id of REQUIRED_ITEMS) {
    const item = byId.get(id);
    if (!item) {
      blockers.push(`Missing final readiness review item: ${id}.`);
      continue;
    }

    if (!item.reviewPresent) blockers.push(`${id} is missing review evidence.`);
    if (!item.reviewed) blockers.push(`${id} has not been reviewed.`);
    if (!item.passed) blockers.push(`${id} did not pass final readiness review.`);
    if (!item.reviewOnly) blockers.push(`${id} must remain review-only.`);
    if (!item.finalReadinessReviewScope) blockers.push(`${id} is outside final readiness review scope.`);
    if (!item.noLiveEnablementApproval) blockers.push(`${id} must not approve live enablement.`);
    if (!item.noLivePilotRuntime) blockers.push(`${id} must not start live pilot runtime.`);
    if (!item.noProviderConnection) blockers.push(`${id} must not connect a provider account.`);
    if (!item.noProviderDelivery) blockers.push(`${id} must not enable provider delivery.`);
    if (!item.noPersistenceWrites) blockers.push(`${id} must not enable persistence writes.`);
    if (!item.noLiveCustomerData) blockers.push(`${id} must not use live customer data.`);
    if (!item.noRuntimeExecution) blockers.push(`${id} must not execute runtime verification.`);
    if (!item.syntheticEvidenceOnly) blockers.push(`${id} evidence must be synthetic only.`);
    if (!item.redactedEvidenceOnly) blockers.push(`${id} evidence must be redacted only.`);
    if (item.safeToPersist) blockers.push(`${id} must remain unsafe to persist.`);
  }

  return blockers;
}

function evidenceBlockers(evidence: LivePilotPrerequisiteFinalReadinessReviewEvidence): string[] {
  const blockers: string[] = [];
  if (!evidence.syntheticOnly) blockers.push('Final readiness evidence must be synthetic only.');
  if (!evidence.redactedOnly) blockers.push('Final readiness evidence must be redacted only.');
  if (evidence.safeToPersist) blockers.push('Final readiness evidence must remain unsafe to persist.');
  if (evidence.labels.some((label) => label.trim().length === 0)) blockers.push('Final readiness evidence labels must not be empty.');
  if (evidence.notes.some((note) => note.trim().length === 0)) blockers.push('Final readiness evidence notes must not be empty.');
  return blockers;
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteFinalReadiness(
  input: LivePilotPrerequisiteFinalReadinessReviewInput,
): LivePilotPrerequisiteFinalReadinessReviewReport {
  const blockers = [
    ...missingPrerequisites(input.environment),
    ...unsafeEnvironment(input.environment),
    ...reviewItemBlockers(input.items),
    ...evidenceBlockers(input.evidence),
  ];

  const approved = blockers.length === 0 && input.requestedDecision === 'approve_live_pilot_explicit_go_no_go_decision_gate';
  const status: LivePilotPrerequisiteFinalReadinessReviewStatus = approved
    ? 'live_pilot_prerequisite_final_readiness_review_ready'
    : blockers.length > 0
      ? blockers.some((blocker) => blocker.includes('must remain disabled') || blocker.includes('must remain absent'))
        ? 'blocked_unsafe_environment'
        : blockers.some((blocker) => blocker.includes('Missing final readiness review item'))
          ? 'blocked_missing_review_item'
          : blockers.some((blocker) => blocker.includes('evidence'))
            ? 'blocked_unsafe_evidence'
            : 'blocked_failed_review_item'
      : 'blocked_pending_prerequisites';

  return {
    build: 'QL-058',
    status,
    decision: approved ? 'approve_live_pilot_explicit_go_no_go_decision_gate' : blockers.length > 0 ? 'continue_rework' : 'remain_blocked',
    approvedForExplicitGoNoGoDecisionGate: approved,
    liveEnablementGranted: false,
    livePilotStarted: false,
    runtimeVerificationExecuted: false,
    providerAccountConnected: false,
    providerLiveNumberAttached: false,
    providerDeliveryEnabled: false,
    persistenceWritesEnabled: false,
    livePilotRuntimeEnabled: false,
    safeToPersist: false,
    requiredNextBuild: 'QL-059-phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate',
    blockers,
    reviewedItems: input.items.filter((item) => item.reviewed).map((item) => item.id),
  };
}

const readyEnvironment: LivePilotPrerequisiteFinalReadinessReviewEnvironment = {
  ql050PostClosureReadinessDecisionGateApproved: true,
  ql051PrerequisiteEvidenceIntakeReady: true,
  ql052PrerequisiteEvidenceReviewReady: true,
  ql053PrerequisiteGapClosurePlanReady: true,
  ql054PrerequisiteGapClosureReviewReady: true,
  ql055PrerequisiteGapEvidenceIntakeReady: true,
  ql056PrerequisiteGapEvidenceReviewReady: true,
  ql057PrerequisiteGapEvidenceClosureGateReady: true,
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
  livePilotRuntimeAllowed: false,
};

const readyItems: LivePilotPrerequisiteFinalReadinessReviewItem[] = REQUIRED_ITEMS.map((id) => ({
  id,
  label: id.replace(/_/g, ' '),
  reviewPresent: true,
  reviewed: true,
  passed: true,
  reviewOnly: true,
  finalReadinessReviewScope: true,
  noLiveEnablementApproval: true,
  noLivePilotRuntime: true,
  noProviderConnection: true,
  noProviderDelivery: true,
  noPersistenceWrites: true,
  noLiveCustomerData: true,
  noRuntimeExecution: true,
  syntheticEvidenceOnly: true,
  redactedEvidenceOnly: true,
  safeToPersist: false,
}));

export const safeLivePilotPrerequisiteFinalReadinessReviewFixture: LivePilotPrerequisiteFinalReadinessReviewInput = {
  environment: readyEnvironment,
  evidence: {
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
    labels: ['synthetic-final-readiness-review', 'redacted-prerequisite-chain', 'disabled-runtime-proof'],
    notes: ['Final prerequisite readiness review is complete using synthetic and redacted evidence only.'],
  },
  items: readyItems,
  requestedDecision: 'approve_live_pilot_explicit_go_no_go_decision_gate',
};

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteFinalReadinessReview(): LivePilotPrerequisiteFinalReadinessReviewReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteFinalReadiness(
    safeLivePilotPrerequisiteFinalReadinessReviewFixture,
  );
}
