export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateStatus =
  | 'live_pilot_prerequisite_gap_evidence_closure_gate_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_closure_item'
  | 'blocked_failed_closure_item'
  | 'blocked_unsafe_evidence'

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateDecision =
  | 'approve_live_pilot_prerequisite_final_readiness_review'
  | 'continue_gap_evidence_rework'
  | 'remain_blocked'

export type PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItemId =
  | 'owner_manual_approval_gap_closed'
  | 'provider_setup_prerequisite_gap_closed'
  | 'provider_disabled_mode_boundary_gap_closed'
  | 'phone_number_ownership_readiness_gap_closed'
  | 'sms_consent_policy_gap_closed'
  | 'stop_start_help_policy_gap_closed'
  | 'call_recording_notice_policy_gap_closed'
  | 'staff_access_control_gap_closed'
  | 'rollback_kill_switch_gap_closed'
  | 'rate_limit_replay_control_gap_closed'
  | 'audit_redaction_gap_closed'
  | 'customer_data_boundary_gap_closed'
  | 'provider_callback_disabled_proof_gap_closed'
  | 'live_phone_webhook_disabled_proof_gap_closed'
  | 'sms_sending_disabled_proof_gap_closed'
  | 'recording_disabled_proof_gap_closed'
  | 'ai_features_disabled_proof_gap_closed'
  | 'persistence_write_disabled_proof_gap_closed'
  | 'live_pilot_runtime_disabled_proof_gap_closed'
  | 'production_proof_gap_closed'

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment {
  ql050PostClosureLivePilotReadinessDecisionApproved: boolean
  ql051PrerequisiteEvidenceIntakeReady: boolean
  ql052PrerequisiteEvidenceReviewReady: boolean
  ql053PrerequisiteGapClosurePlanReady: boolean
  ql054PrerequisiteGapClosureReviewReady: boolean
  ql055PrerequisiteGapEvidenceIntakeReady: boolean
  ql056PrerequisiteGapEvidenceReviewReady: boolean
  providerWebhookConfigured: boolean
  providerCallbackAllowed: boolean
  phoneWebhookAllowed: boolean
  smsSendAllowed: boolean
  callRecordingAllowed: boolean
  aiDraftAllowed: boolean
  aiAutoSendAllowed: boolean
  persistenceWritesAllowed: boolean
  liveCustomerReadAllowed: boolean
  liveCustomerWriteAllowed: boolean
  dryRunExecutionAllowed: boolean
  providerDeliveryAllowed: boolean
  archiveWritesAllowed: boolean
  retentionPolicyWritesAllowed: boolean
  providerAccountConnected: boolean
  providerLiveNumberAttached: boolean
  livePilotRuntimeAllowed: boolean
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItem {
  id: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItemId
  label: string
  evidenceReviewed: boolean
  evidencePassed: boolean
  gapClosed: boolean
  ownerReviewed: boolean
  closureGateOnly: boolean
  finalReadinessReviewOnly: boolean
  noLiveData: boolean
  providerDeliveryBlocked: boolean
  runtimeExecutionBlocked: boolean
  persistenceWritesBlocked: boolean
  syntheticEvidenceOnly: boolean
  redactedEvidenceOnly: boolean
  safeToPersist: false
  notes?: string[]
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateInput {
  environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment
  closureItems: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItem[]
  evidence: {
    syntheticOnly: boolean
    redactedOnly: boolean
    safeToPersist: false
  }
  requestedDecision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateDecision
}

export interface PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateReport {
  status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateStatus
  decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateDecision
  closureGateReady: boolean
  approvedForFinalReadinessReview: boolean
  providerWebhookConfigured: false
  providerCallbackAllowed: false
  phoneWebhookAllowed: false
  smsSendAllowed: false
  callRecordingAllowed: false
  aiDraftAllowed: false
  aiAutoSendAllowed: false
  persistenceWritesAllowed: false
  liveCustomerReadAllowed: false
  liveCustomerWriteAllowed: false
  dryRunExecutionAllowed: false
  providerDeliveryAllowed: false
  archiveWritesAllowed: false
  retentionPolicyWritesAllowed: false
  providerAccountConnected: false
  providerLiveNumberAttached: false
  livePilotRuntimeAllowed: false
  safeToPersist: false
  requiredNextBuild: 'QL-058-phone-sms-controlled-live-enablement-live-pilot-prerequisite-final-readiness-review'
  blockers: string[]
  reviewedItemIds: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItemId[]
}

const requiredClosureItemIds: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItemId[] = [
  'owner_manual_approval_gap_closed',
  'provider_setup_prerequisite_gap_closed',
  'provider_disabled_mode_boundary_gap_closed',
  'phone_number_ownership_readiness_gap_closed',
  'sms_consent_policy_gap_closed',
  'stop_start_help_policy_gap_closed',
  'call_recording_notice_policy_gap_closed',
  'staff_access_control_gap_closed',
  'rollback_kill_switch_gap_closed',
  'rate_limit_replay_control_gap_closed',
  'audit_redaction_gap_closed',
  'customer_data_boundary_gap_closed',
  'provider_callback_disabled_proof_gap_closed',
  'live_phone_webhook_disabled_proof_gap_closed',
  'sms_sending_disabled_proof_gap_closed',
  'recording_disabled_proof_gap_closed',
  'ai_features_disabled_proof_gap_closed',
  'persistence_write_disabled_proof_gap_closed',
  'live_pilot_runtime_disabled_proof_gap_closed',
  'production_proof_gap_closed',
]

function baseReport(
  status: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateStatus,
  decision: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateDecision,
  blockers: string[],
  reviewedItemIds: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItemId[],
): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateReport {
  const approvedForFinalReadinessReview =
    status === 'live_pilot_prerequisite_gap_evidence_closure_gate_ready' &&
    decision === 'approve_live_pilot_prerequisite_final_readiness_review'

  return {
    status,
    decision,
    closureGateReady: approvedForFinalReadinessReview,
    approvedForFinalReadinessReview,
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
    providerAccountConnected: false,
    providerLiveNumberAttached: false,
    livePilotRuntimeAllowed: false,
    safeToPersist: false,
    requiredNextBuild:
      'QL-058-phone-sms-controlled-live-enablement-live-pilot-prerequisite-final-readiness-review',
    blockers,
    reviewedItemIds,
  }
}

function collectPrerequisiteBlockers(
  environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment,
): string[] {
  const blockers: string[] = []

  if (!environment.ql050PostClosureLivePilotReadinessDecisionApproved) {
    blockers.push('QL-050 post-closure live-pilot readiness decision gate must be approved first.')
  }
  if (!environment.ql051PrerequisiteEvidenceIntakeReady) {
    blockers.push('QL-051 live-pilot prerequisite evidence intake must be ready first.')
  }
  if (!environment.ql052PrerequisiteEvidenceReviewReady) {
    blockers.push('QL-052 live-pilot prerequisite evidence review must be ready first.')
  }
  if (!environment.ql053PrerequisiteGapClosurePlanReady) {
    blockers.push('QL-053 live-pilot prerequisite gap-closure plan must be ready first.')
  }
  if (!environment.ql054PrerequisiteGapClosureReviewReady) {
    blockers.push('QL-054 live-pilot prerequisite gap-closure review must be ready first.')
  }
  if (!environment.ql055PrerequisiteGapEvidenceIntakeReady) {
    blockers.push('QL-055 live-pilot prerequisite gap evidence intake must be ready first.')
  }
  if (!environment.ql056PrerequisiteGapEvidenceReviewReady) {
    blockers.push('QL-056 live-pilot prerequisite gap evidence review must be ready first.')
  }

  return blockers
}

function collectEnvironmentBlockers(
  environment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment,
): string[] {
  const checks: Array<[keyof PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment, string]> = [
    ['providerWebhookConfigured', 'Provider webhooks must remain unconfigured.'],
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
    ['archiveWritesAllowed', 'Archive writes must remain disabled.'],
    ['retentionPolicyWritesAllowed', 'Retention policy writes must remain disabled.'],
    ['providerAccountConnected', 'Provider account connection must remain disabled.'],
    ['providerLiveNumberAttached', 'Provider live-number attachment must remain disabled.'],
    ['livePilotRuntimeAllowed', 'Live pilot runtime must remain disabled.'],
  ]

  return checks.flatMap(([key, message]) => (environment[key] ? [message] : []))
}

function collectClosureItemBlockers(
  closureItems: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItem[],
): string[] {
  const blockers: string[] = []
  const byId = new Map(closureItems.map((item) => [item.id, item]))

  for (const id of requiredClosureItemIds) {
    const item = byId.get(id)
    if (!item) {
      blockers.push(`Missing closure item: ${id}.`)
      continue
    }

    if (!item.evidenceReviewed) blockers.push(`Closure item ${id} must have reviewed evidence.`)
    if (!item.evidencePassed) blockers.push(`Closure item ${id} evidence must pass review.`)
    if (!item.gapClosed) blockers.push(`Closure item ${id} must close its gap.`)
    if (!item.ownerReviewed) blockers.push(`Closure item ${id} must be owner-reviewed.`)
    if (!item.closureGateOnly) blockers.push(`Closure item ${id} must remain closure-gate-only.`)
    if (!item.finalReadinessReviewOnly) blockers.push(`Closure item ${id} may only advance to final readiness review.`)
    if (!item.noLiveData) blockers.push(`Closure item ${id} must contain no live data.`)
    if (!item.providerDeliveryBlocked) blockers.push(`Closure item ${id} must keep provider delivery blocked.`)
    if (!item.runtimeExecutionBlocked) blockers.push(`Closure item ${id} must keep runtime execution blocked.`)
    if (!item.persistenceWritesBlocked) blockers.push(`Closure item ${id} must keep persistence writes blocked.`)
    if (!item.syntheticEvidenceOnly) blockers.push(`Closure item ${id} must use synthetic evidence only.`)
    if (!item.redactedEvidenceOnly) blockers.push(`Closure item ${id} must use redacted evidence only.`)
    if (item.safeToPersist !== false) blockers.push(`Closure item ${id} must remain safeToPersist=false.`)
  }

  return blockers
}

function collectEvidenceBlockers(
  input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateInput,
): string[] {
  const blockers: string[] = []

  if (!input.evidence.syntheticOnly) blockers.push('Closure gate evidence must remain synthetic-only.')
  if (!input.evidence.redactedOnly) blockers.push('Closure gate evidence must remain redacted-only.')
  if (input.evidence.safeToPersist !== false) blockers.push('Closure gate evidence must remain safeToPersist=false.')

  const unsafeLabels = input.closureItems.filter((item) => item.label.trim().length === 0)
  if (unsafeLabels.length > 0) {
    blockers.push('Every closure item must have a non-empty synthetic/redacted label.')
  }

  return blockers
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGate(
  input: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateInput,
): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateReport {
  const reviewedItemIds = input.closureItems.map((item) => item.id)
  const prerequisiteBlockers = collectPrerequisiteBlockers(input.environment)
  if (prerequisiteBlockers.length > 0) {
    return baseReport('blocked_pending_prerequisites', 'remain_blocked', prerequisiteBlockers, reviewedItemIds)
  }

  const environmentBlockers = collectEnvironmentBlockers(input.environment)
  if (environmentBlockers.length > 0) {
    return baseReport('blocked_unsafe_environment', 'remain_blocked', environmentBlockers, reviewedItemIds)
  }

  const closureItemBlockers = collectClosureItemBlockers(input.closureItems)
  if (closureItemBlockers.some((blocker) => blocker.startsWith('Missing closure item'))) {
    return baseReport('blocked_missing_closure_item', 'remain_blocked', closureItemBlockers, reviewedItemIds)
  }
  if (closureItemBlockers.length > 0) {
    return baseReport('blocked_failed_closure_item', 'continue_gap_evidence_rework', closureItemBlockers, reviewedItemIds)
  }

  const evidenceBlockers = collectEvidenceBlockers(input)
  if (evidenceBlockers.length > 0) {
    return baseReport('blocked_unsafe_evidence', 'remain_blocked', evidenceBlockers, reviewedItemIds)
  }

  if (input.requestedDecision !== 'approve_live_pilot_prerequisite_final_readiness_review') {
    return baseReport('blocked_failed_closure_item', input.requestedDecision, [
      'QL-057 may only approve QL-058 final readiness review or remain blocked for rework.',
    ], reviewedItemIds)
  }

  return baseReport(
    'live_pilot_prerequisite_gap_evidence_closure_gate_ready',
    'approve_live_pilot_prerequisite_final_readiness_review',
    [],
    reviewedItemIds,
  )
}

export const safePhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment = {
  ql050PostClosureLivePilotReadinessDecisionApproved: true,
  ql051PrerequisiteEvidenceIntakeReady: true,
  ql052PrerequisiteEvidenceReviewReady: true,
  ql053PrerequisiteGapClosurePlanReady: true,
  ql054PrerequisiteGapClosureReviewReady: true,
  ql055PrerequisiteGapEvidenceIntakeReady: true,
  ql056PrerequisiteGapEvidenceReviewReady: true,
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
  providerAccountConnected: false,
  providerLiveNumberAttached: false,
  livePilotRuntimeAllowed: false,
}

export const safePhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItems: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItem[] =
  requiredClosureItemIds.map((id) => ({
    id,
    label: `synthetic-redacted-${id}`,
    evidenceReviewed: true,
    evidencePassed: true,
    gapClosed: true,
    ownerReviewed: true,
    closureGateOnly: true,
    finalReadinessReviewOnly: true,
    noLiveData: true,
    providerDeliveryBlocked: true,
    runtimeExecutionBlocked: true,
    persistenceWritesBlocked: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    safeToPersist: false,
    notes: [
      'Synthetic/redacted closure evidence is complete for this prerequisite gap.',
      'This closure gate does not enable live pilot runtime or provider delivery.',
    ],
  }))

export const safePhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateInput: PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateInput = {
  environment: safePhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateEnvironment,
  closureItems: safePhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateItems,
  evidence: {
    syntheticOnly: true,
    redactedOnly: true,
    safeToPersist: false,
  },
  requestedDecision: 'approve_live_pilot_prerequisite_final_readiness_review',
}

export function runPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGate(): PhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateReport {
  return reviewPhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGate(
    safePhoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceClosureGateInput,
  )
}
