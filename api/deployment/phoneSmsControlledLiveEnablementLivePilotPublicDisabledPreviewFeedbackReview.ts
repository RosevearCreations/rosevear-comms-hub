export type PublicDisabledPreviewFeedbackReviewStatus =
  | 'public_disabled_preview_feedback_review_ready'
  | 'blocked_preview_not_public'
  | 'blocked_missing_feedback_theme'
  | 'blocked_unsafe_runtime_requested'
  | 'blocked_unredacted_or_live_data'
  | 'blocked_non_review_scope';

export type PublicDisabledPreviewFeedbackReviewDecision =
  | 'approve_public_preview_refinement_planning'
  | 'continue_feedback_collection'
  | 'remain_blocked';

export type PublicDisabledPreviewFeedbackTheme =
  | 'layout'
  | 'navigation'
  | 'labels'
  | 'help_system'
  | 'accessibility'
  | 'brand_switching'
  | 'operator_queue'
  | 'customer_timeline'
  | 'disabled_control_clarity'
  | 'next_interactive_surface';

export interface PublicDisabledPreviewFeedbackReviewEnvironment {
  build: 'QL-076';
  publicPreviewUrl: string;
  pagesWorkflowObserved: boolean;
  pagesWorkflowDeployed: boolean;
  appCiGreen: boolean;
  pagesCiGreen: boolean;
  staticBuildOnly: boolean;
  providerCallbacksEnabled: boolean;
  phoneWebhooksEnabled: boolean;
  smsSendingEnabled: boolean;
  callRuntimeEnabled: boolean;
  recordingEnabled: boolean;
  aiSendEnabled: boolean;
  persistenceWritesEnabled: boolean;
  liveCustomerDataEnabled: boolean;
  archiveWritesEnabled: boolean;
  retentionWritesEnabled: boolean;
  supabaseMigrationAdded: boolean;
  supabaseEdgeFunctionAdded: boolean;
  livePilotRuntimeEnabled: boolean;
}

export interface PublicDisabledPreviewFeedbackReviewInput {
  scope: 'public_disabled_preview_feedback_review_only';
  environment: PublicDisabledPreviewFeedbackReviewEnvironment;
  feedbackThemes: PublicDisabledPreviewFeedbackTheme[];
  requestedRuntimeChanges: string[];
  feedbackEvidenceLabels: string[];
}

export interface PublicDisabledPreviewFeedbackReviewReport {
  status: PublicDisabledPreviewFeedbackReviewStatus;
  decision: PublicDisabledPreviewFeedbackReviewDecision;
  approvedNextBuild: 'QL-077-public-disabled-preview-refinement-plan' | null;
  reviewablePublicUrl: string | null;
  feedbackThemesAccepted: PublicDisabledPreviewFeedbackTheme[];
  blockedRuntimeChanges: string[];
  safetyBoundary: {
    providerCallbacksAllowed: false;
    livePhoneWebhooksAllowed: false;
    smsSendingAllowed: false;
    callRuntimeAllowed: false;
    recordingAllowed: false;
    aiSendAllowed: false;
    persistenceWritesAllowed: false;
    liveCustomerDataAllowed: false;
    archiveWritesAllowed: false;
    retentionWritesAllowed: false;
    supabaseMigrationAllowed: false;
    supabaseEdgeFunctionAllowed: false;
    livePilotRuntimeAllowed: false;
  };
  notes: string[];
}

const unsafeEvidenceTerms = [
  'unredacted',
  'secret-value',
  'service-role',
  'provider-token',
  'callback-token',
  'live-phone-number',
  'message-body',
  'transcript',
  'recording',
  'live-customer-record',
  'runtime-enabled'
];

const runtimeRequestTerms = [
  'send sms',
  'call customer',
  'connect provider',
  'register callback',
  'enable webhook',
  'record call',
  'ai send',
  'persist live',
  'archive transcript',
  'retention write',
  'start live pilot'
];

export const safePublicDisabledPreviewFeedbackReviewEnvironment: PublicDisabledPreviewFeedbackReviewEnvironment = {
  build: 'QL-076',
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  pagesWorkflowObserved: true,
  pagesWorkflowDeployed: true,
  appCiGreen: true,
  pagesCiGreen: true,
  staticBuildOnly: true,
  providerCallbacksEnabled: false,
  phoneWebhooksEnabled: false,
  smsSendingEnabled: false,
  callRuntimeEnabled: false,
  recordingEnabled: false,
  aiSendEnabled: false,
  persistenceWritesEnabled: false,
  liveCustomerDataEnabled: false,
  archiveWritesEnabled: false,
  retentionWritesEnabled: false,
  supabaseMigrationAdded: false,
  supabaseEdgeFunctionAdded: false,
  livePilotRuntimeEnabled: false
};

export const safePublicDisabledPreviewFeedbackReviewInput: PublicDisabledPreviewFeedbackReviewInput = {
  scope: 'public_disabled_preview_feedback_review_only',
  environment: safePublicDisabledPreviewFeedbackReviewEnvironment,
  feedbackThemes: [
    'layout',
    'navigation',
    'labels',
    'help_system',
    'accessibility',
    'brand_switching',
    'operator_queue',
    'customer_timeline',
    'disabled_control_clarity',
    'next_interactive_surface'
  ],
  requestedRuntimeChanges: [],
  feedbackEvidenceLabels: [
    'synthetic-redacted-public-feedback-layout',
    'synthetic-redacted-public-feedback-labels',
    'synthetic-redacted-public-feedback-help-system',
    'synthetic-redacted-public-feedback-next-interaction'
  ]
};

function hasUnsafeEvidence(labels: string[]): boolean {
  return labels.some((label) => {
    const normalized = label.toLowerCase();
    return !normalized.startsWith('synthetic-redacted-public-feedback-') || unsafeEvidenceTerms.some((term) => normalized.includes(term));
  });
}

function hasRuntimeRequest(requestedRuntimeChanges: string[]): boolean {
  return requestedRuntimeChanges.some((request) => {
    const normalized = request.toLowerCase();
    return runtimeRequestTerms.some((term) => normalized.includes(term));
  });
}

function unsafeEnvironmentEnabled(environment: PublicDisabledPreviewFeedbackReviewEnvironment): boolean {
  return (
    !environment.appCiGreen ||
    !environment.pagesCiGreen ||
    !environment.staticBuildOnly ||
    environment.providerCallbacksEnabled ||
    environment.phoneWebhooksEnabled ||
    environment.smsSendingEnabled ||
    environment.callRuntimeEnabled ||
    environment.recordingEnabled ||
    environment.aiSendEnabled ||
    environment.persistenceWritesEnabled ||
    environment.liveCustomerDataEnabled ||
    environment.archiveWritesEnabled ||
    environment.retentionWritesEnabled ||
    environment.supabaseMigrationAdded ||
    environment.supabaseEdgeFunctionAdded ||
    environment.livePilotRuntimeEnabled
  );
}

export function reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFeedback(
  input: PublicDisabledPreviewFeedbackReviewInput
): PublicDisabledPreviewFeedbackReviewReport {
  const safetyBoundary = {
    providerCallbacksAllowed: false,
    livePhoneWebhooksAllowed: false,
    smsSendingAllowed: false,
    callRuntimeAllowed: false,
    recordingAllowed: false,
    aiSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerDataAllowed: false,
    archiveWritesAllowed: false,
    retentionWritesAllowed: false,
    supabaseMigrationAllowed: false,
    supabaseEdgeFunctionAllowed: false,
    livePilotRuntimeAllowed: false
  } as const;

  if (input.scope !== 'public_disabled_preview_feedback_review_only') {
    return {
      status: 'blocked_non_review_scope',
      decision: 'remain_blocked',
      approvedNextBuild: null,
      reviewablePublicUrl: null,
      feedbackThemesAccepted: [],
      blockedRuntimeChanges: input.requestedRuntimeChanges,
      safetyBoundary,
      notes: ['QL-076 only reviews public disabled preview feedback and cannot enable runtime changes.']
    };
  }

  if (!input.environment.pagesWorkflowObserved || !input.environment.pagesWorkflowDeployed) {
    return {
      status: 'blocked_preview_not_public',
      decision: 'continue_feedback_collection',
      approvedNextBuild: null,
      reviewablePublicUrl: null,
      feedbackThemesAccepted: input.feedbackThemes,
      blockedRuntimeChanges: input.requestedRuntimeChanges,
      safetyBoundary,
      notes: ['The public preview must be deployed before feedback can be fully reviewed.']
    };
  }

  if (input.feedbackThemes.length === 0) {
    return {
      status: 'blocked_missing_feedback_theme',
      decision: 'continue_feedback_collection',
      approvedNextBuild: null,
      reviewablePublicUrl: input.environment.publicPreviewUrl,
      feedbackThemesAccepted: [],
      blockedRuntimeChanges: input.requestedRuntimeChanges,
      safetyBoundary,
      notes: ['At least one feedback theme is required before QL-077 refinement planning.']
    };
  }

  if (hasRuntimeRequest(input.requestedRuntimeChanges) || unsafeEnvironmentEnabled(input.environment)) {
    return {
      status: 'blocked_unsafe_runtime_requested',
      decision: 'remain_blocked',
      approvedNextBuild: null,
      reviewablePublicUrl: input.environment.publicPreviewUrl,
      feedbackThemesAccepted: input.feedbackThemes,
      blockedRuntimeChanges: input.requestedRuntimeChanges,
      safetyBoundary,
      notes: ['Feedback review cannot approve provider, callback, phone, SMS, AI, persistence, archive, retention, or live pilot runtime changes.']
    };
  }

  if (hasUnsafeEvidence(input.feedbackEvidenceLabels)) {
    return {
      status: 'blocked_unredacted_or_live_data',
      decision: 'remain_blocked',
      approvedNextBuild: null,
      reviewablePublicUrl: input.environment.publicPreviewUrl,
      feedbackThemesAccepted: input.feedbackThemes,
      blockedRuntimeChanges: input.requestedRuntimeChanges,
      safetyBoundary,
      notes: ['Feedback labels must be synthetic and redacted; live customer, message, transcript, recording, provider, and secret data remain blocked.']
    };
  }

  return {
    status: 'public_disabled_preview_feedback_review_ready',
    decision: 'approve_public_preview_refinement_planning',
    approvedNextBuild: 'QL-077-public-disabled-preview-refinement-plan',
    reviewablePublicUrl: input.environment.publicPreviewUrl,
    feedbackThemesAccepted: input.feedbackThemes,
    blockedRuntimeChanges: [],
    safetyBoundary,
    notes: [
      'Public disabled preview feedback can be reviewed and converted into refinement priorities.',
      'QL-077 may plan browser-safe public preview improvements while leaving all live Phone/SMS runtime disabled.'
    ]
  };
}

export const safePublicDisabledPreviewFeedbackReviewReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFeedback(safePublicDisabledPreviewFeedbackReviewInput);
