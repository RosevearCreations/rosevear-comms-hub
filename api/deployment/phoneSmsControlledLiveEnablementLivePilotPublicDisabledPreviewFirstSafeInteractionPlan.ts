type FirstSafeInteractionPlanStatus =
  | 'first_safe_interaction_plan_ready'
  | 'blocked_missing_public_preview'
  | 'blocked_missing_selected_interaction'
  | 'blocked_unsafe_interaction'
  | 'blocked_live_runtime_scope';

type FirstSafeInteractionDecision =
  | 'approve_first_safe_interaction_implementation'
  | 'continue_planning'
  | 'remain_blocked';

type FirstSafeInteractionCandidate = {
  readonly id: string;
  readonly label: string;
  readonly approvedForFirstImplementation: boolean;
  readonly browserLocalOnly: boolean;
  readonly syntheticDataOnly: boolean;
  readonly requiresProvider: boolean;
  readonly requiresSupabaseRuntime: boolean;
  readonly requiresPersistenceWrites: boolean;
  readonly requiresLiveCustomerData: boolean;
  readonly requiresSmsOrCallRuntime: boolean;
  readonly requiresAiSend: boolean;
  readonly rationale: string;
};

type FirstSafeInteractionPlanInput = {
  readonly buildId: 'QL-079';
  readonly publicPreviewUrl: string;
  readonly pagesWorkflowGreen: boolean;
  readonly appCiGreen: boolean;
  readonly selectedInteractionId: string;
  readonly candidates: readonly FirstSafeInteractionCandidate[];
  readonly liveRuntimeEnabled: boolean;
  readonly providerCallbacksEnabled: boolean;
  readonly livePhoneWebhooksEnabled: boolean;
  readonly smsSendingEnabled: boolean;
  readonly callRuntimeEnabled: boolean;
  readonly recordingEnabled: boolean;
  readonly aiSendEnabled: boolean;
  readonly persistenceWritesEnabled: boolean;
  readonly archiveWritesEnabled: boolean;
  readonly retentionWritesEnabled: boolean;
  readonly supabaseRuntimeChanged: boolean;
  readonly livePilotRuntimeEnabled: boolean;
};

type FirstSafeInteractionPlanReport = {
  readonly buildId: 'QL-079';
  readonly status: FirstSafeInteractionPlanStatus;
  readonly decision: FirstSafeInteractionDecision;
  readonly selectedInteractionId: string | null;
  readonly approvedNextBuild: 'QL-080-public-disabled-preview-first-safe-interaction-implementation' | null;
  readonly blockers: readonly string[];
  readonly requiredAcceptanceChecks: readonly string[];
  readonly runtimeBoundary: {
    readonly providerCallbacksEnabled: false;
    readonly livePhoneWebhooksEnabled: false;
    readonly smsSendingEnabled: false;
    readonly callRuntimeEnabled: false;
    readonly recordingEnabled: false;
    readonly aiSendEnabled: false;
    readonly persistenceWritesEnabled: false;
    readonly archiveWritesEnabled: false;
    readonly retentionWritesEnabled: false;
    readonly supabaseRuntimeChanged: false;
    readonly livePilotRuntimeEnabled: false;
  };
};

const requiredAcceptanceChecks = [
  'Use only hard-coded synthetic preview data or browser-local state.',
  'Do not import or initialize the Supabase client.',
  'Do not read or write persistence, archive, retention, or live customer records.',
  'Do not expose provider credentials, service-role keys, callback tokens, live phone numbers, message bodies, transcripts, or recordings.',
  'Do not enable SMS sending, call runtime, recording, AI send, provider delivery, callback registration, or live pilot behavior.',
  'Keep every live action visibly locked and inert while allowing the selected safe UI interaction.'
] as const;

const safeFirstSafeInteractionPlanInput: FirstSafeInteractionPlanInput = {
  buildId: 'QL-079',
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  pagesWorkflowGreen: true,
  appCiGreen: true,
  selectedInteractionId: 'sample-brand-switcher',
  candidates: [
    {
      id: 'sample-brand-switcher',
      label: 'Sample brand switcher',
      approvedForFirstImplementation: true,
      browserLocalOnly: true,
      syntheticDataOnly: true,
      requiresProvider: false,
      requiresSupabaseRuntime: false,
      requiresPersistenceWrites: false,
      requiresLiveCustomerData: false,
      requiresSmsOrCallRuntime: false,
      requiresAiSend: false,
      rationale: 'Useful first interaction that proves Rosie Dazzlers and Devil n Dove context without backend or provider access.'
    },
    {
      id: 'synthetic-conversation-selector',
      label: 'Synthetic conversation selector',
      approvedForFirstImplementation: false,
      browserLocalOnly: true,
      syntheticDataOnly: true,
      requiresProvider: false,
      requiresSupabaseRuntime: false,
      requiresPersistenceWrites: false,
      requiresLiveCustomerData: false,
      requiresSmsOrCallRuntime: false,
      requiresAiSend: false,
      rationale: 'Useful after brand switching, but not first.'
    }
  ],
  liveRuntimeEnabled: false,
  providerCallbacksEnabled: false,
  livePhoneWebhooksEnabled: false,
  smsSendingEnabled: false,
  callRuntimeEnabled: false,
  recordingEnabled: false,
  aiSendEnabled: false,
  persistenceWritesEnabled: false,
  archiveWritesEnabled: false,
  retentionWritesEnabled: false,
  supabaseRuntimeChanged: false,
  livePilotRuntimeEnabled: false
};

function reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFirstSafeInteractionPlan(
  input: FirstSafeInteractionPlanInput
): FirstSafeInteractionPlanReport {
  const blockers: string[] = [];

  if (!input.publicPreviewUrl || !input.pagesWorkflowGreen || !input.appCiGreen) {
    blockers.push('Public Pages preview and App scaffold CI must both be green before planning the first safe interaction.');
  }

  const selected = input.candidates.find((candidate) => candidate.id === input.selectedInteractionId);

  if (!selected) {
    blockers.push('A selected first safe interaction candidate is required.');
  }

  if (selected) {
    if (!selected.approvedForFirstImplementation) {
      blockers.push('Selected interaction is not approved for first implementation.');
    }
    if (!selected.browserLocalOnly || !selected.syntheticDataOnly) {
      blockers.push('Selected interaction must be browser-local and synthetic-data-only.');
    }
    if (
      selected.requiresProvider ||
      selected.requiresSupabaseRuntime ||
      selected.requiresPersistenceWrites ||
      selected.requiresLiveCustomerData ||
      selected.requiresSmsOrCallRuntime ||
      selected.requiresAiSend
    ) {
      blockers.push('Selected interaction touches unsafe provider, backend, live customer, SMS/call, persistence, or AI scope.');
    }
  }

  if (
    input.liveRuntimeEnabled ||
    input.providerCallbacksEnabled ||
    input.livePhoneWebhooksEnabled ||
    input.smsSendingEnabled ||
    input.callRuntimeEnabled ||
    input.recordingEnabled ||
    input.aiSendEnabled ||
    input.persistenceWritesEnabled ||
    input.archiveWritesEnabled ||
    input.retentionWritesEnabled ||
    input.supabaseRuntimeChanged ||
    input.livePilotRuntimeEnabled
  ) {
    blockers.push('QL-079 may not enable runtime, provider, Supabase, persistence, archive, retention, AI, or live pilot paths.');
  }

  let status: FirstSafeInteractionPlanStatus = 'first_safe_interaction_plan_ready';

  if (blockers.length > 0) {
    if (!input.publicPreviewUrl || !input.pagesWorkflowGreen || !input.appCiGreen) {
      status = 'blocked_missing_public_preview';
    } else if (!selected) {
      status = 'blocked_missing_selected_interaction';
    } else if (
      input.liveRuntimeEnabled ||
      input.providerCallbacksEnabled ||
      input.livePhoneWebhooksEnabled ||
      input.smsSendingEnabled ||
      input.callRuntimeEnabled ||
      input.recordingEnabled ||
      input.aiSendEnabled ||
      input.persistenceWritesEnabled ||
      input.archiveWritesEnabled ||
      input.retentionWritesEnabled ||
      input.supabaseRuntimeChanged ||
      input.livePilotRuntimeEnabled
    ) {
      status = 'blocked_live_runtime_scope';
    } else {
      status = 'blocked_unsafe_interaction';
    }
  }

  return {
    buildId: 'QL-079',
    status,
    decision: blockers.length === 0 ? 'approve_first_safe_interaction_implementation' : 'remain_blocked',
    selectedInteractionId: blockers.length === 0 ? input.selectedInteractionId : null,
    approvedNextBuild: blockers.length === 0 ? 'QL-080-public-disabled-preview-first-safe-interaction-implementation' : null,
    blockers,
    requiredAcceptanceChecks,
    runtimeBoundary: {
      providerCallbacksEnabled: false,
      livePhoneWebhooksEnabled: false,
      smsSendingEnabled: false,
      callRuntimeEnabled: false,
      recordingEnabled: false,
      aiSendEnabled: false,
      persistenceWritesEnabled: false,
      archiveWritesEnabled: false,
      retentionWritesEnabled: false,
      supabaseRuntimeChanged: false,
      livePilotRuntimeEnabled: false
    }
  };
}

const safeFirstSafeInteractionPlanReport =
  reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFirstSafeInteractionPlan(
    safeFirstSafeInteractionPlanInput
  );

export {
  reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFirstSafeInteractionPlan,
  safeFirstSafeInteractionPlanInput,
  safeFirstSafeInteractionPlanReport
};
export type {
  FirstSafeInteractionCandidate,
  FirstSafeInteractionDecision,
  FirstSafeInteractionPlanInput,
  FirstSafeInteractionPlanReport,
  FirstSafeInteractionPlanStatus
};
