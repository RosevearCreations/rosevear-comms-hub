type PublicDisabledPreviewRefinementImplementationStatus =
  | 'public_disabled_preview_refinement_implementation_ready'
  | 'blocked_missing_public_preview'
  | 'blocked_missing_refinement'
  | 'blocked_unsafe_runtime_change';

type PublicDisabledPreviewRefinementImplementationDecision =
  | 'approve_public_disabled_preview_interaction_planning'
  | 'continue_refinement_rework'
  | 'remain_blocked';

type PublicDisabledPreviewRefinementImplementationInput = {
  build: 'QL-078';
  publicPreviewUrl: string;
  staticPreviewOnly: boolean;
  githubPagesDeploymentExpected: boolean;
  refinements: {
    layoutClarity: boolean;
    brandContext: boolean;
    inboxCards: boolean;
    timelineClarity: boolean;
    disabledControlLabels: boolean;
    circledIHelpMarkers: boolean;
    accessibilityAndResponsivePass: boolean;
    firstSafeInteractionCandidates: boolean;
  };
  runtime: {
    providerCallbacksEnabled: boolean;
    livePhoneWebhooksEnabled: boolean;
    smsSendingEnabled: boolean;
    callRuntimeEnabled: boolean;
    recordingEnabled: boolean;
    aiSendEnabled: boolean;
    persistenceWritesEnabled: boolean;
    liveCustomerAccessEnabled: boolean;
    archiveWritesEnabled: boolean;
    retentionWritesEnabled: boolean;
    supabaseRuntimeChanged: boolean;
    livePilotRuntimeEnabled: boolean;
  };
};

type PublicDisabledPreviewRefinementImplementationReport = {
  status: PublicDisabledPreviewRefinementImplementationStatus;
  decision: PublicDisabledPreviewRefinementImplementationDecision;
  approvedNextBuild: 'QL-079-public-disabled-preview-first-safe-interaction-plan' | null;
  runtimeBoundaryMaintained: boolean;
  publicPreviewUrl: string;
  requiredRefinementsComplete: string[];
  blockedReasons: string[];
};

const requiredRefinementKeys: Array<keyof PublicDisabledPreviewRefinementImplementationInput['refinements']> = [
  'layoutClarity',
  'brandContext',
  'inboxCards',
  'timelineClarity',
  'disabledControlLabels',
  'circledIHelpMarkers',
  'accessibilityAndResponsivePass',
  'firstSafeInteractionCandidates'
];

const runtimeKeys: Array<keyof PublicDisabledPreviewRefinementImplementationInput['runtime']> = [
  'providerCallbacksEnabled',
  'livePhoneWebhooksEnabled',
  'smsSendingEnabled',
  'callRuntimeEnabled',
  'recordingEnabled',
  'aiSendEnabled',
  'persistenceWritesEnabled',
  'liveCustomerAccessEnabled',
  'archiveWritesEnabled',
  'retentionWritesEnabled',
  'supabaseRuntimeChanged',
  'livePilotRuntimeEnabled'
];

function reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewRefinementImplementation(
  input: PublicDisabledPreviewRefinementImplementationInput
): PublicDisabledPreviewRefinementImplementationReport {
  const blockedReasons: string[] = [];

  if (!input.publicPreviewUrl.startsWith('https://rosevearcreations.github.io/rosevear-comms-hub/')) {
    blockedReasons.push('public-preview-url-not-approved');
  }

  if (!input.staticPreviewOnly || !input.githubPagesDeploymentExpected) {
    blockedReasons.push('public-preview-must-remain-static-github-pages-only');
  }

  for (const key of requiredRefinementKeys) {
    if (!input.refinements[key]) {
      blockedReasons.push(`missing-refinement-${key}`);
    }
  }

  for (const key of runtimeKeys) {
    if (input.runtime[key]) {
      blockedReasons.push(`unsafe-runtime-change-${key}`);
    }
  }

  const runtimeBoundaryMaintained = runtimeKeys.every((key) => input.runtime[key] === false);
  const requiredRefinementsComplete = requiredRefinementKeys.filter((key) => input.refinements[key]);

  if (blockedReasons.some((reason) => reason.startsWith('unsafe-runtime-change'))) {
    return {
      status: 'blocked_unsafe_runtime_change',
      decision: 'remain_blocked',
      approvedNextBuild: null,
      runtimeBoundaryMaintained,
      publicPreviewUrl: input.publicPreviewUrl,
      requiredRefinementsComplete,
      blockedReasons
    };
  }

  if (!input.publicPreviewUrl || !input.githubPagesDeploymentExpected) {
    return {
      status: 'blocked_missing_public_preview',
      decision: 'continue_refinement_rework',
      approvedNextBuild: null,
      runtimeBoundaryMaintained,
      publicPreviewUrl: input.publicPreviewUrl,
      requiredRefinementsComplete,
      blockedReasons
    };
  }

  if (blockedReasons.length > 0) {
    return {
      status: 'blocked_missing_refinement',
      decision: 'continue_refinement_rework',
      approvedNextBuild: null,
      runtimeBoundaryMaintained,
      publicPreviewUrl: input.publicPreviewUrl,
      requiredRefinementsComplete,
      blockedReasons
    };
  }

  return {
    status: 'public_disabled_preview_refinement_implementation_ready',
    decision: 'approve_public_disabled_preview_interaction_planning',
    approvedNextBuild: 'QL-079-public-disabled-preview-first-safe-interaction-plan',
    runtimeBoundaryMaintained,
    publicPreviewUrl: input.publicPreviewUrl,
    requiredRefinementsComplete,
    blockedReasons
  };
}

const safePublicDisabledPreviewRefinementImplementationInput: PublicDisabledPreviewRefinementImplementationInput = {
  build: 'QL-078',
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  staticPreviewOnly: true,
  githubPagesDeploymentExpected: true,
  refinements: {
    layoutClarity: true,
    brandContext: true,
    inboxCards: true,
    timelineClarity: true,
    disabledControlLabels: true,
    circledIHelpMarkers: true,
    accessibilityAndResponsivePass: true,
    firstSafeInteractionCandidates: true
  },
  runtime: {
    providerCallbacksEnabled: false,
    livePhoneWebhooksEnabled: false,
    smsSendingEnabled: false,
    callRuntimeEnabled: false,
    recordingEnabled: false,
    aiSendEnabled: false,
    persistenceWritesEnabled: false,
    liveCustomerAccessEnabled: false,
    archiveWritesEnabled: false,
    retentionWritesEnabled: false,
    supabaseRuntimeChanged: false,
    livePilotRuntimeEnabled: false
  }
};

const safePublicDisabledPreviewRefinementImplementationReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewRefinementImplementation(
    safePublicDisabledPreviewRefinementImplementationInput
  );

export {
  reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewRefinementImplementation,
  safePublicDisabledPreviewRefinementImplementationInput,
  safePublicDisabledPreviewRefinementImplementationReport
};

export type {
  PublicDisabledPreviewRefinementImplementationDecision,
  PublicDisabledPreviewRefinementImplementationInput,
  PublicDisabledPreviewRefinementImplementationReport,
  PublicDisabledPreviewRefinementImplementationStatus
};
