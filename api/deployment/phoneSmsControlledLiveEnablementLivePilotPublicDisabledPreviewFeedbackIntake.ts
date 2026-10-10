export type PublicDisabledPreviewFeedbackIntakeStatus =
  | 'public_disabled_preview_feedback_intake_ready'
  | 'blocked_pending_app_ci'
  | 'blocked_pages_workflow_not_observed'
  | 'blocked_public_preview_not_live'
  | 'blocked_unsafe_feedback_scope';

export type PublicDisabledPreviewFeedbackDecision =
  | 'capture_public_disabled_preview_feedback'
  | 'capture_deployment_gap_feedback_only'
  | 'remain_blocked';

export type PublicDisabledPreviewFeedbackTopic =
  | 'public_url_load'
  | 'first_impression'
  | 'brand_switcher'
  | 'operator_queue'
  | 'customer_timeline'
  | 'disabled_controls_clarity'
  | 'help_text'
  | 'next_interactive_surface';

export interface PublicDisabledPreviewFeedbackIntakeEnvironment {
  buildId: 'QL-075';
  appCiGreen: boolean;
  pagesWorkflowObserved: boolean;
  pagesWorkflowConclusion: 'success' | 'skipped' | 'failure' | 'unknown';
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  publicPreviewLive: boolean;
  publicPreviewStatic: boolean;
  browserOutputSafe: boolean;
  feedbackScopeOnly: boolean;
  providerCallbacksEnabled: boolean;
  phoneWebhooksEnabled: boolean;
  smsSendingEnabled: boolean;
  callRuntimeEnabled: boolean;
  recordingEnabled: boolean;
  aiAutoSendEnabled: boolean;
  persistenceWritesEnabled: boolean;
  liveCustomerAccessEnabled: boolean;
  archiveWritesEnabled: boolean;
  retentionWritesEnabled: boolean;
  livePilotRuntimeEnabled: boolean;
}

export interface PublicDisabledPreviewFeedbackIntakeReport {
  status: PublicDisabledPreviewFeedbackIntakeStatus;
  decision: PublicDisabledPreviewFeedbackDecision;
  feedbackTopics: PublicDisabledPreviewFeedbackTopic[];
  readyForHumanFeedback: boolean;
  publicPreviewCanBeReviewed: boolean;
  nextBuild: string;
  blockedReasons: string[];
}

const unsafeRuntimeEnabled = (environment: PublicDisabledPreviewFeedbackIntakeEnvironment) =>
  environment.providerCallbacksEnabled ||
  environment.phoneWebhooksEnabled ||
  environment.smsSendingEnabled ||
  environment.callRuntimeEnabled ||
  environment.recordingEnabled ||
  environment.aiAutoSendEnabled ||
  environment.persistenceWritesEnabled ||
  environment.liveCustomerAccessEnabled ||
  environment.archiveWritesEnabled ||
  environment.retentionWritesEnabled ||
  environment.livePilotRuntimeEnabled;

export function intakePublicDisabledPreviewFeedback(
  environment: PublicDisabledPreviewFeedbackIntakeEnvironment
): PublicDisabledPreviewFeedbackIntakeReport {
  const blockedReasons: string[] = [];

  if (!environment.appCiGreen) {
    blockedReasons.push('App scaffold CI must be green before feedback intake can be trusted.');
  }

  if (!environment.pagesWorkflowObserved) {
    blockedReasons.push('GitHub Pages Disabled Preview workflow must be observed on the main push.');
  }

  if (!environment.feedbackScopeOnly || unsafeRuntimeEnabled(environment)) {
    blockedReasons.push('Feedback intake must not enable provider, callback, SMS, call, AI, persistence, archive, retention, or live pilot runtime.');
  }

  if (!environment.publicPreviewLive || environment.pagesWorkflowConclusion !== 'success') {
    blockedReasons.push('Public preview is not live yet; capture deployment-gap feedback only.');
  }

  if (!environment.publicPreviewStatic || !environment.browserOutputSafe) {
    blockedReasons.push('Public preview must be static and browser-safe before human feedback intake.');
  }

  if (blockedReasons.length > 0) {
    return {
      status: !environment.appCiGreen
        ? 'blocked_pending_app_ci'
        : !environment.pagesWorkflowObserved
          ? 'blocked_pages_workflow_not_observed'
          : unsafeRuntimeEnabled(environment) || !environment.feedbackScopeOnly
            ? 'blocked_unsafe_feedback_scope'
            : 'blocked_public_preview_not_live',
      decision: environment.pagesWorkflowObserved ? 'capture_deployment_gap_feedback_only' : 'remain_blocked',
      feedbackTopics: ['public_url_load', 'disabled_controls_clarity'],
      readyForHumanFeedback: false,
      publicPreviewCanBeReviewed: false,
      nextBuild: 'QL-076-public-disabled-preview-feedback-review',
      blockedReasons
    };
  }

  return {
    status: 'public_disabled_preview_feedback_intake_ready',
    decision: 'capture_public_disabled_preview_feedback',
    feedbackTopics: [
      'public_url_load',
      'first_impression',
      'brand_switcher',
      'operator_queue',
      'customer_timeline',
      'disabled_controls_clarity',
      'help_text',
      'next_interactive_surface'
    ],
    readyForHumanFeedback: true,
    publicPreviewCanBeReviewed: true,
    nextBuild: 'QL-076-public-disabled-preview-feedback-review',
    blockedReasons: []
  };
}

export const safePublicDisabledPreviewFeedbackIntakeEnvironment: PublicDisabledPreviewFeedbackIntakeEnvironment = {
  buildId: 'QL-075',
  appCiGreen: true,
  pagesWorkflowObserved: true,
  pagesWorkflowConclusion: 'success',
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  publicPreviewLive: true,
  publicPreviewStatic: true,
  browserOutputSafe: true,
  feedbackScopeOnly: true,
  providerCallbacksEnabled: false,
  phoneWebhooksEnabled: false,
  smsSendingEnabled: false,
  callRuntimeEnabled: false,
  recordingEnabled: false,
  aiAutoSendEnabled: false,
  persistenceWritesEnabled: false,
  liveCustomerAccessEnabled: false,
  archiveWritesEnabled: false,
  retentionWritesEnabled: false,
  livePilotRuntimeEnabled: false
};

export const safePublicDisabledPreviewFeedbackIntakeReport = intakePublicDisabledPreviewFeedback(
  safePublicDisabledPreviewFeedbackIntakeEnvironment
);
