type ReviewStatus =
  | 'first_safe_interaction_review_ready'
  | 'blocked_missing_public_preview'
  | 'blocked_missing_brand_switcher'
  | 'blocked_unsafe_runtime_path'
  | 'blocked_non_review_scope';

type ReviewDecision =
  | 'approve_synthetic_conversation_selector_plan'
  | 'continue_brand_switcher_refinement'
  | 'remain_blocked';

interface FirstSafeInteractionReviewInput {
  requestedScope: 'public_disabled_preview_first_safe_interaction_review_only';
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  implementedInteraction: 'browser_local_sample_brand_switcher';
  decision: ReviewDecision;
  browserLocalStateOnly: boolean;
  syntheticDataOnly: boolean;
  brandSwitcherClickable: boolean;
  lockedControlsRemainDisabled: boolean;
  nextBuild: 'QL-082-public-disabled-preview-synthetic-conversation-selector-plan';
}

interface FirstSafeInteractionReviewEnvironment {
  githubPagesPreviewLive: boolean;
  appCiGreen: boolean;
  pagesDeployGreen: boolean;
  supabaseClientImported: boolean;
  persistenceWritesAllowed: boolean;
  liveCustomerReadsAllowed: boolean;
  liveCustomerWritesAllowed: boolean;
  providerCallbacksAllowed: boolean;
  livePhoneWebhooksAllowed: boolean;
  smsSendAllowed: boolean;
  callRuntimeAllowed: boolean;
  recordingAllowed: boolean;
  aiSendAllowed: boolean;
  archiveWritesAllowed: boolean;
  retentionWritesAllowed: boolean;
  supabaseMigrationAdded: boolean;
  supabaseEdgeFunctionAdded: boolean;
  livePilotRuntimeAllowed: boolean;
}

const defaultReviewEnvironment: FirstSafeInteractionReviewEnvironment = {
  githubPagesPreviewLive: true,
  appCiGreen: true,
  pagesDeployGreen: true,
  supabaseClientImported: false,
  persistenceWritesAllowed: false,
  liveCustomerReadsAllowed: false,
  liveCustomerWritesAllowed: false,
  providerCallbacksAllowed: false,
  livePhoneWebhooksAllowed: false,
  smsSendAllowed: false,
  callRuntimeAllowed: false,
  recordingAllowed: false,
  aiSendAllowed: false,
  archiveWritesAllowed: false,
  retentionWritesAllowed: false,
  supabaseMigrationAdded: false,
  supabaseEdgeFunctionAdded: false,
  livePilotRuntimeAllowed: false
};

function hasUnsafeRuntimePath(environment: FirstSafeInteractionReviewEnvironment): boolean {
  return [
    environment.supabaseClientImported,
    environment.persistenceWritesAllowed,
    environment.liveCustomerReadsAllowed,
    environment.liveCustomerWritesAllowed,
    environment.providerCallbacksAllowed,
    environment.livePhoneWebhooksAllowed,
    environment.smsSendAllowed,
    environment.callRuntimeAllowed,
    environment.recordingAllowed,
    environment.aiSendAllowed,
    environment.archiveWritesAllowed,
    environment.retentionWritesAllowed,
    environment.supabaseMigrationAdded,
    environment.supabaseEdgeFunctionAdded,
    environment.livePilotRuntimeAllowed
  ].some(Boolean);
}

function reviewPublicDisabledPreviewFirstSafeInteraction(
  input: FirstSafeInteractionReviewInput,
  environment: FirstSafeInteractionReviewEnvironment = defaultReviewEnvironment
) {
  let status: ReviewStatus = 'first_safe_interaction_review_ready';

  if (input.requestedScope !== 'public_disabled_preview_first_safe_interaction_review_only') {
    status = 'blocked_non_review_scope';
  } else if (!environment.githubPagesPreviewLive || !environment.appCiGreen || !environment.pagesDeployGreen) {
    status = 'blocked_missing_public_preview';
  } else if (
    input.implementedInteraction !== 'browser_local_sample_brand_switcher' ||
    !input.browserLocalStateOnly ||
    !input.syntheticDataOnly ||
    !input.brandSwitcherClickable ||
    !input.lockedControlsRemainDisabled
  ) {
    status = 'blocked_missing_brand_switcher';
  } else if (hasUnsafeRuntimePath(environment)) {
    status = 'blocked_unsafe_runtime_path';
  }

  const approved = status === 'first_safe_interaction_review_ready' && input.decision === 'approve_synthetic_conversation_selector_plan';

  return {
    build: 'QL-081',
    status,
    approved,
    reviewedInteraction: input.implementedInteraction,
    publicPreviewUrl: input.publicPreviewUrl,
    browserLocalStateOnly: input.browserLocalStateOnly,
    syntheticDataOnly: input.syntheticDataOnly,
    lockedControlsRemainDisabled: input.lockedControlsRemainDisabled,
    nextBuild: approved ? input.nextBuild : null,
    blockedRuntimePaths: {
      providerCallbacksAllowed: false,
      livePhoneWebhooksAllowed: false,
      smsSendAllowed: false,
      callRuntimeAllowed: false,
      recordingAllowed: false,
      aiSendAllowed: false,
      persistenceWritesAllowed: false,
      liveCustomerReadsAllowed: false,
      liveCustomerWritesAllowed: false,
      archiveWritesAllowed: false,
      retentionWritesAllowed: false,
      supabaseMigrationAdded: false,
      supabaseEdgeFunctionAdded: false,
      livePilotRuntimeAllowed: false
    }
  } as const;
}

export {
  defaultReviewEnvironment,
  reviewPublicDisabledPreviewFirstSafeInteraction,
  type FirstSafeInteractionReviewEnvironment,
  type FirstSafeInteractionReviewInput,
  type ReviewDecision,
  type ReviewStatus
};
