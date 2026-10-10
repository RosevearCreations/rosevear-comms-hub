export type PublicDisabledPreviewVisualReviewStatus =
  | 'public_disabled_preview_visual_review_ready'
  | 'blocked_pending_prerequisites'
  | 'blocked_missing_visual_review_item'
  | 'blocked_failed_visual_review_item'
  | 'blocked_unsafe_environment'
  | 'blocked_non_visual_review_scope';

export type PublicDisabledPreviewVisualReviewDecision =
  | 'approve_public_disabled_preview_visual_review'
  | 'continue_rework'
  | 'remain_blocked';

export type PublicDisabledPreviewVisualReviewItemId =
  | 'main_app_ci_green'
  | 'pages_workflow_observed'
  | 'public_url_checked'
  | 'static_preview_surface_visible'
  | 'brand_switcher_visible'
  | 'operator_queue_visible'
  | 'customer_timeline_visible'
  | 'disabled_phone_sms_controls_visible'
  | 'safe_status_cards_visible'
  | 'no_browser_secrets_detected'
  | 'no_live_customer_data_detected'
  | 'provider_runtime_disabled'
  | 'phone_sms_runtime_disabled'
  | 'persistence_runtime_disabled'
  | 'archive_retention_runtime_disabled'
  | 'live_pilot_runtime_disabled';

export interface PublicDisabledPreviewVisualReviewEnvironment {
  readonly prerequisitesCompleteThroughQl073: boolean;
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly viteBasePath: '/rosevear-comms-hub/';
  readonly appCiGreen: boolean;
  readonly pagesWorkflowObserved: boolean;
  readonly pagesWorkflowConclusion: 'success' | 'skipped' | 'pending' | 'failure';
  readonly pagesPreviewLoaded: boolean;
  readonly pagesPreviewSkippedSafely: boolean;
  readonly browserHeldServiceRoleSecret: boolean;
  readonly browserHeldProviderSecret: boolean;
  readonly browserHeldCallbackToken: boolean;
  readonly browserHeldLivePhoneNumber: boolean;
  readonly browserHeldLiveMessageBody: boolean;
  readonly browserHeldTranscriptOrRecording: boolean;
  readonly browserHeldLiveCustomerData: boolean;
  readonly providerCallbackAllowed: boolean;
  readonly livePhoneWebhookAllowed: boolean;
  readonly smsSendAllowed: boolean;
  readonly callRuntimeAllowed: boolean;
  readonly callRecordingAllowed: boolean;
  readonly aiAutoSendAllowed: boolean;
  readonly persistenceWritesAllowed: boolean;
  readonly archiveWritesAllowed: boolean;
  readonly retentionPolicyWritesAllowed: boolean;
  readonly livePilotRuntimeAllowed: boolean;
}

export interface PublicDisabledPreviewVisualReviewItem {
  readonly id: PublicDisabledPreviewVisualReviewItemId;
  readonly reviewed: boolean;
  readonly passed: boolean;
  readonly staticOnly: boolean;
  readonly disablesLiveActions: boolean;
  readonly exposesProviderCredential: false;
  readonly exposesServiceRoleSecret: false;
  readonly exposesCallbackToken: false;
  readonly exposesLivePhoneNumber: false;
  readonly exposesLiveMessageBody: false;
  readonly exposesTranscriptOrRecording: false;
  readonly exposesLiveCustomerData: false;
  readonly evidenceLabel: string;
}

export interface PublicDisabledPreviewVisualReviewInput {
  readonly decision: PublicDisabledPreviewVisualReviewDecision;
  readonly requestedScope: 'public_disabled_preview_visual_review_only';
  readonly environment: PublicDisabledPreviewVisualReviewEnvironment;
  readonly reviewItems: readonly PublicDisabledPreviewVisualReviewItem[];
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly requiredNextBuild: 'QL-075-phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-feedback-intake';
  readonly notes: readonly string[];
}

export interface PublicDisabledPreviewVisualReviewReport {
  readonly status: PublicDisabledPreviewVisualReviewStatus;
  readonly decision: PublicDisabledPreviewVisualReviewDecision;
  readonly approvedForPublicDisabledPreviewVisualReview: boolean;
  readonly publicPreviewAvailableForHumanReview: boolean;
  readonly pagesWorkflowObserved: boolean;
  readonly pagesWorkflowConclusion: 'success' | 'skipped' | 'pending' | 'failure';
  readonly targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  readonly liveEnablementAllowed: false;
  readonly smsSendAllowed: false;
  readonly callRuntimeAllowed: false;
  readonly persistenceWritesAllowed: false;
  readonly archiveWritesAllowed: false;
  readonly retentionWritesAllowed: false;
  readonly livePilotRuntimeAllowed: false;
  readonly browserSecretsAllowed: false;
  readonly requiredNextBuild: 'QL-075-phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-feedback-intake' | null;
  readonly blockers: readonly string[];
  readonly reviewedItems: readonly PublicDisabledPreviewVisualReviewItemId[];
}

export const publicDisabledPreviewVisualReviewItemIds: readonly PublicDisabledPreviewVisualReviewItemId[] = [
  'main_app_ci_green',
  'pages_workflow_observed',
  'public_url_checked',
  'static_preview_surface_visible',
  'brand_switcher_visible',
  'operator_queue_visible',
  'customer_timeline_visible',
  'disabled_phone_sms_controls_visible',
  'safe_status_cards_visible',
  'no_browser_secrets_detected',
  'no_live_customer_data_detected',
  'provider_runtime_disabled',
  'phone_sms_runtime_disabled',
  'persistence_runtime_disabled',
  'archive_retention_runtime_disabled',
  'live_pilot_runtime_disabled'
];

export const safePublicDisabledPreviewVisualReviewEnvironment: PublicDisabledPreviewVisualReviewEnvironment = {
  prerequisitesCompleteThroughQl073: true,
  targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  viteBasePath: '/rosevear-comms-hub/',
  appCiGreen: true,
  pagesWorkflowObserved: true,
  pagesWorkflowConclusion: 'skipped',
  pagesPreviewLoaded: false,
  pagesPreviewSkippedSafely: true,
  browserHeldServiceRoleSecret: false,
  browserHeldProviderSecret: false,
  browserHeldCallbackToken: false,
  browserHeldLivePhoneNumber: false,
  browserHeldLiveMessageBody: false,
  browserHeldTranscriptOrRecording: false,
  browserHeldLiveCustomerData: false,
  providerCallbackAllowed: false,
  livePhoneWebhookAllowed: false,
  smsSendAllowed: false,
  callRuntimeAllowed: false,
  callRecordingAllowed: false,
  aiAutoSendAllowed: false,
  persistenceWritesAllowed: false,
  archiveWritesAllowed: false,
  retentionPolicyWritesAllowed: false,
  livePilotRuntimeAllowed: false
};

export const safePublicDisabledPreviewVisualReviewItems: readonly PublicDisabledPreviewVisualReviewItem[] =
  publicDisabledPreviewVisualReviewItemIds.map((id) => ({
    id,
    reviewed: true,
    passed: true,
    staticOnly: true,
    disablesLiveActions: true,
    exposesProviderCredential: false,
    exposesServiceRoleSecret: false,
    exposesCallbackToken: false,
    exposesLivePhoneNumber: false,
    exposesLiveMessageBody: false,
    exposesTranscriptOrRecording: false,
    exposesLiveCustomerData: false,
    evidenceLabel: `synthetic-public-disabled-preview-visual-review-${id}`
  }));

export const safePublicDisabledPreviewVisualReviewInput: PublicDisabledPreviewVisualReviewInput = {
  decision: 'approve_public_disabled_preview_visual_review',
  requestedScope: 'public_disabled_preview_visual_review_only',
  environment: safePublicDisabledPreviewVisualReviewEnvironment,
  reviewItems: safePublicDisabledPreviewVisualReviewItems,
  targetPublicUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  requiredNextBuild: 'QL-075-phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-feedback-intake',
  notes: [
    'QL-074 reviews the public static disabled preview path and visible operator direction.',
    'A skipped Pages workflow is safe but not sufficient for human visual review of the hosted page.',
    'Live provider, phone, SMS, call, recording, AI, persistence, archive, retention, and live pilot runtime remain disabled.'
  ]
};

function environmentIsUnsafe(environment: PublicDisabledPreviewVisualReviewEnvironment): boolean {
  return (
    environment.targetPublicUrl !== 'https://rosevearcreations.github.io/rosevear-comms-hub/' ||
    environment.viteBasePath !== '/rosevear-comms-hub/' ||
    environment.browserHeldServiceRoleSecret ||
    environment.browserHeldProviderSecret ||
    environment.browserHeldCallbackToken ||
    environment.browserHeldLivePhoneNumber ||
    environment.browserHeldLiveMessageBody ||
    environment.browserHeldTranscriptOrRecording ||
    environment.browserHeldLiveCustomerData ||
    environment.providerCallbackAllowed ||
    environment.livePhoneWebhookAllowed ||
    environment.smsSendAllowed ||
    environment.callRuntimeAllowed ||
    environment.callRecordingAllowed ||
    environment.aiAutoSendAllowed ||
    environment.persistenceWritesAllowed ||
    environment.archiveWritesAllowed ||
    environment.retentionPolicyWritesAllowed ||
    environment.livePilotRuntimeAllowed
  );
}

function hasUnsafeEvidenceLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized.startsWith('synthetic-public-disabled-preview-visual-review-') ||
    normalized.includes('secret-value') ||
    normalized.includes('service-role') ||
    normalized.includes('provider-secret') ||
    normalized.includes('callback-token') ||
    normalized.includes('phone-number') ||
    normalized.includes('message-body') ||
    normalized.includes('transcript') ||
    normalized.includes('recording') ||
    normalized.includes('live-customer') ||
    normalized.includes('runtime-enabled')
  );
}

function reviewItemIsSafe(item: PublicDisabledPreviewVisualReviewItem): boolean {
  return (
    item.reviewed &&
    item.passed &&
    item.staticOnly &&
    item.disablesLiveActions &&
    item.exposesProviderCredential === false &&
    item.exposesServiceRoleSecret === false &&
    item.exposesCallbackToken === false &&
    item.exposesLivePhoneNumber === false &&
    item.exposesLiveMessageBody === false &&
    item.exposesTranscriptOrRecording === false &&
    item.exposesLiveCustomerData === false &&
    !hasUnsafeEvidenceLabel(item.evidenceLabel)
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewVisualReview(
  input: PublicDisabledPreviewVisualReviewInput
): PublicDisabledPreviewVisualReviewReport {
  const blockers: string[] = [];

  if (!input.environment.prerequisitesCompleteThroughQl073) {
    blockers.push('Prerequisites through QL-073 must be complete.');
  }
  if (!input.environment.appCiGreen) {
    blockers.push('Main app CI must be green before public visual review is accepted.');
  }
  if (!input.environment.pagesWorkflowObserved) {
    blockers.push('GitHub Pages Disabled Preview workflow must be observed on main.');
  }
  if (input.environment.pagesWorkflowConclusion === 'failure') {
    blockers.push('GitHub Pages Disabled Preview workflow failed.');
  }
  if (!input.environment.pagesPreviewLoaded && !input.environment.pagesPreviewSkippedSafely) {
    blockers.push('Public preview must either load or skip safely behind the gate.');
  }
  if (environmentIsUnsafe(input.environment)) {
    blockers.push('Environment is unsafe for public disabled preview visual review.');
  }
  if (input.requestedScope !== 'public_disabled_preview_visual_review_only') {
    blockers.push(`Unsupported requested scope: ${input.requestedScope}`);
  }
  if (input.decision !== 'approve_public_disabled_preview_visual_review') {
    blockers.push(`Unsupported decision: ${input.decision}`);
  }

  const itemMap = new Map(input.reviewItems.map((item) => [item.id, item]));
  const missingItems = publicDisabledPreviewVisualReviewItemIds.filter((id) => !itemMap.has(id));
  if (missingItems.length > 0) {
    blockers.push(`Missing public disabled preview visual review items: ${missingItems.join(', ')}`);
  }

  const failedItems = input.reviewItems.filter((item) => !reviewItemIsSafe(item));
  if (failedItems.length > 0) {
    blockers.push(`Public disabled preview visual review items failed safety checks: ${failedItems.map((item) => item.id).join(', ')}`);
  }

  const status: PublicDisabledPreviewVisualReviewStatus =
    !input.environment.prerequisitesCompleteThroughQl073
      ? 'blocked_pending_prerequisites'
      : environmentIsUnsafe(input.environment)
        ? 'blocked_unsafe_environment'
        : input.requestedScope !== 'public_disabled_preview_visual_review_only'
          ? 'blocked_non_visual_review_scope'
          : missingItems.length > 0
            ? 'blocked_missing_visual_review_item'
            : failedItems.length > 0 || blockers.length > 0
              ? 'blocked_failed_visual_review_item'
              : 'public_disabled_preview_visual_review_ready';

  const approved = status === 'public_disabled_preview_visual_review_ready';

  return {
    status,
    decision: approved ? 'approve_public_disabled_preview_visual_review' : 'remain_blocked',
    approvedForPublicDisabledPreviewVisualReview: approved,
    publicPreviewAvailableForHumanReview: approved && input.environment.pagesPreviewLoaded,
    pagesWorkflowObserved: input.environment.pagesWorkflowObserved,
    pagesWorkflowConclusion: input.environment.pagesWorkflowConclusion,
    targetPublicUrl: input.targetPublicUrl,
    liveEnablementAllowed: false,
    smsSendAllowed: false,
    callRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    archiveWritesAllowed: false,
    retentionWritesAllowed: false,
    livePilotRuntimeAllowed: false,
    browserSecretsAllowed: false,
    requiredNextBuild: approved
      ? 'QL-075-phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-feedback-intake'
      : null,
    blockers,
    reviewedItems: input.reviewItems.map((item) => item.id)
  };
}

export const safePublicDisabledPreviewVisualReviewReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewVisualReview(safePublicDisabledPreviewVisualReviewInput);
