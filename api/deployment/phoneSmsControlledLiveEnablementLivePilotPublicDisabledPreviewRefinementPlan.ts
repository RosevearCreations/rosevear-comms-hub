export type PublicDisabledPreviewRefinementPlanStatus =
  | 'public_disabled_preview_refinement_plan_ready'
  | 'blocked_missing_public_preview_evidence'
  | 'blocked_unsafe_refinement_item'
  | 'blocked_runtime_enablement_request'
  | 'blocked_secret_or_live_data_exposure'
  | 'blocked_non_refinement_scope';

export type PublicDisabledPreviewRefinementPriority =
  | 'layout_clarity'
  | 'brand_switching_context'
  | 'inbox_card_readability'
  | 'customer_timeline_readability'
  | 'disabled_action_clarity'
  | 'help_system_placement'
  | 'accessibility_and_responsiveness'
  | 'first_browser_safe_interaction';

export type PublicDisabledPreviewRefinementDecision =
  | 'approve_static_public_preview_refinement_plan'
  | 'continue_feedback_review'
  | 'remain_blocked';

export type PublicDisabledPreviewRefinementItem = {
  id: PublicDisabledPreviewRefinementPriority;
  title: string;
  accepted: boolean;
  publicPreviewOnly: boolean;
  usesSyntheticDataOnly: boolean;
  enablesProviderRuntime: boolean;
  enablesSmsOrCallRuntime: boolean;
  enablesPersistenceWrites: boolean;
  exposesSecretsOrLiveData: boolean;
  plannedOutcome: string;
};

export type PublicDisabledPreviewRefinementEnvironment = {
  build: 'QL-077';
  scope: 'public_disabled_preview_refinement_plan_only';
  publicPreviewUrl: string;
  publicPreviewDeploymentGreen: boolean;
  appCiGreen: boolean;
  pagesWorkflowGreen: boolean;
  browserBundlePublicOnly: boolean;
  providerCallbacksEnabled: boolean;
  livePhoneWebhooksEnabled: boolean;
  smsSendingEnabled: boolean;
  callRuntimeEnabled: boolean;
  recordingEnabled: boolean;
  aiAutoSendEnabled: boolean;
  persistenceWritesEnabled: boolean;
  liveCustomerReadsEnabled: boolean;
  liveCustomerWritesEnabled: boolean;
  archiveWritesEnabled: boolean;
  retentionPolicyWritesEnabled: boolean;
  supabaseMigrationAdded: boolean;
  supabaseEdgeFunctionAdded: boolean;
  vercelAdded: boolean;
  cloudflarePagesAdded: boolean;
  livePilotRuntimeEnabled: boolean;
};

export type PublicDisabledPreviewRefinementPlanInput = {
  environment: PublicDisabledPreviewRefinementEnvironment;
  refinementItems: PublicDisabledPreviewRefinementItem[];
  requestedDecision: PublicDisabledPreviewRefinementDecision;
  notes: string[];
};

export type PublicDisabledPreviewRefinementPlanReport = {
  status: PublicDisabledPreviewRefinementPlanStatus;
  decision: PublicDisabledPreviewRefinementDecision;
  approvedRefinements: PublicDisabledPreviewRefinementPriority[];
  blockedReasons: string[];
  nextBuild: 'QL-078-public-disabled-preview-refinement-implementation';
  publicPreviewUrl: string;
  providerRuntimeAllowed: false;
  smsOrCallRuntimeAllowed: false;
  persistenceWritesAllowed: false;
  liveCustomerDataAllowed: false;
  archiveOrRetentionWritesAllowed: false;
  supabaseRuntimeChangeAllowed: false;
  livePilotRuntimeAllowed: false;
  safeToContinue: boolean;
};

const unsafeNoteFragments = [
  'secret',
  'service-role',
  'provider token',
  'callback token',
  'live phone number',
  'message body',
  'transcript',
  'recording',
  'live customer',
  'send sms',
  'place call',
  'start live pilot',
  'runtime enabled'
];

function includesUnsafeNote(notes: string[]): boolean {
  return notes.some((note) => {
    const normalized = note.toLowerCase();
    return unsafeNoteFragments.some((fragment) => normalized.includes(fragment));
  });
}

function collectEnvironmentBlocks(environment: PublicDisabledPreviewRefinementEnvironment): string[] {
  const blocks: string[] = [];

  if (!environment.publicPreviewDeploymentGreen) blocks.push('public preview deployment is not green');
  if (!environment.appCiGreen) blocks.push('app CI is not green');
  if (!environment.pagesWorkflowGreen) blocks.push('GitHub Pages workflow is not green');
  if (!environment.browserBundlePublicOnly) blocks.push('browser bundle is not confirmed public-only');
  if (environment.providerCallbacksEnabled) blocks.push('provider callbacks are enabled');
  if (environment.livePhoneWebhooksEnabled) blocks.push('live phone webhooks are enabled');
  if (environment.smsSendingEnabled) blocks.push('SMS sending is enabled');
  if (environment.callRuntimeEnabled) blocks.push('call runtime is enabled');
  if (environment.recordingEnabled) blocks.push('recording is enabled');
  if (environment.aiAutoSendEnabled) blocks.push('AI auto-send is enabled');
  if (environment.persistenceWritesEnabled) blocks.push('persistence writes are enabled');
  if (environment.liveCustomerReadsEnabled || environment.liveCustomerWritesEnabled) blocks.push('live customer data is enabled');
  if (environment.archiveWritesEnabled || environment.retentionPolicyWritesEnabled) blocks.push('archive or retention writes are enabled');
  if (environment.supabaseMigrationAdded || environment.supabaseEdgeFunctionAdded) blocks.push('Supabase runtime change is included');
  if (environment.vercelAdded || environment.cloudflarePagesAdded) blocks.push('additional hosting provider is included');
  if (environment.livePilotRuntimeEnabled) blocks.push('live pilot runtime is enabled');

  return blocks;
}

function collectItemBlocks(items: PublicDisabledPreviewRefinementItem[]): string[] {
  return items.flatMap((item) => {
    const itemBlocks: string[] = [];

    if (!item.accepted) itemBlocks.push(`${item.id} is not accepted`);
    if (!item.publicPreviewOnly) itemBlocks.push(`${item.id} is not limited to the public preview`);
    if (!item.usesSyntheticDataOnly) itemBlocks.push(`${item.id} does not use synthetic data only`);
    if (item.enablesProviderRuntime) itemBlocks.push(`${item.id} enables provider runtime`);
    if (item.enablesSmsOrCallRuntime) itemBlocks.push(`${item.id} enables SMS or call runtime`);
    if (item.enablesPersistenceWrites) itemBlocks.push(`${item.id} enables persistence writes`);
    if (item.exposesSecretsOrLiveData) itemBlocks.push(`${item.id} exposes secrets or live data`);

    return itemBlocks;
  });
}

export function planPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewRefinement(
  input: PublicDisabledPreviewRefinementPlanInput
): PublicDisabledPreviewRefinementPlanReport {
  const environmentBlocks = collectEnvironmentBlocks(input.environment);
  const itemBlocks = collectItemBlocks(input.refinementItems);
  const unsafeNotes = includesUnsafeNote(input.notes);
  const blockedReasons = [...environmentBlocks, ...itemBlocks];

  if (input.environment.scope !== 'public_disabled_preview_refinement_plan_only') {
    blockedReasons.push('scope is not public disabled preview refinement plan only');
  }

  if (unsafeNotes) {
    blockedReasons.push('notes include unsafe secret, live-data, delivery, or runtime language');
  }

  const runtimeBlock = blockedReasons.some((reason) =>
    /runtime|sms|call|callback|webhook|recording|auto-send|live pilot/i.test(reason)
  );
  const secretBlock = blockedReasons.some((reason) => /secret|live data|live customer/i.test(reason));
  const refinementScopeBlock = blockedReasons.some((reason) => /scope|public preview|synthetic/i.test(reason));

  let status: PublicDisabledPreviewRefinementPlanStatus = 'public_disabled_preview_refinement_plan_ready';
  if (!input.environment.publicPreviewDeploymentGreen || !input.environment.appCiGreen || !input.environment.pagesWorkflowGreen) {
    status = 'blocked_missing_public_preview_evidence';
  } else if (runtimeBlock) {
    status = 'blocked_runtime_enablement_request';
  } else if (secretBlock) {
    status = 'blocked_secret_or_live_data_exposure';
  } else if (refinementScopeBlock) {
    status = 'blocked_non_refinement_scope';
  } else if (blockedReasons.length > 0) {
    status = 'blocked_unsafe_refinement_item';
  }

  const safeToContinue = status === 'public_disabled_preview_refinement_plan_ready' &&
    input.requestedDecision === 'approve_static_public_preview_refinement_plan';

  return {
    status,
    decision: safeToContinue ? 'approve_static_public_preview_refinement_plan' : 'remain_blocked',
    approvedRefinements: safeToContinue ? input.refinementItems.map((item) => item.id) : [],
    blockedReasons,
    nextBuild: 'QL-078-public-disabled-preview-refinement-implementation',
    publicPreviewUrl: input.environment.publicPreviewUrl,
    providerRuntimeAllowed: false,
    smsOrCallRuntimeAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerDataAllowed: false,
    archiveOrRetentionWritesAllowed: false,
    supabaseRuntimeChangeAllowed: false,
    livePilotRuntimeAllowed: false,
    safeToContinue
  };
}

export const safePublicDisabledPreviewRefinementItems: PublicDisabledPreviewRefinementItem[] = [
  {
    id: 'layout_clarity',
    title: 'Layout clarity pass',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Make the public preview easier to scan without adding runtime behavior.'
  },
  {
    id: 'brand_switching_context',
    title: 'Brand switching context',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Show Rosie Dazzlers and Devil n Dove as separate brand inboxes in one console.'
  },
  {
    id: 'inbox_card_readability',
    title: 'Inbox card readability',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Improve static queue cards with clearer urgency, source, and draft-only labels.'
  },
  {
    id: 'customer_timeline_readability',
    title: 'Customer timeline readability',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Refine the sample timeline so locked SMS and call actions are easier to understand.'
  },
  {
    id: 'disabled_action_clarity',
    title: 'Disabled action clarity',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Make every locked action explain why it is disabled and what later proof is required.'
  },
  {
    id: 'help_system_placement',
    title: 'Help system placement',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Plan circled-i help notes near key static console regions.'
  },
  {
    id: 'accessibility_and_responsiveness',
    title: 'Accessibility and responsiveness',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Improve keyboard, small-screen, and readable-label planning before interaction.'
  },
  {
    id: 'first_browser_safe_interaction',
    title: 'First browser-safe interaction',
    accepted: true,
    publicPreviewOnly: true,
    usesSyntheticDataOnly: true,
    enablesProviderRuntime: false,
    enablesSmsOrCallRuntime: false,
    enablesPersistenceWrites: false,
    exposesSecretsOrLiveData: false,
    plannedOutcome: 'Pick a future synthetic-only interaction such as local brand switching or task filtering.'
  }
];

export const safePublicDisabledPreviewRefinementEnvironment: PublicDisabledPreviewRefinementEnvironment = {
  build: 'QL-077',
  scope: 'public_disabled_preview_refinement_plan_only',
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
  publicPreviewDeploymentGreen: true,
  appCiGreen: true,
  pagesWorkflowGreen: true,
  browserBundlePublicOnly: true,
  providerCallbacksEnabled: false,
  livePhoneWebhooksEnabled: false,
  smsSendingEnabled: false,
  callRuntimeEnabled: false,
  recordingEnabled: false,
  aiAutoSendEnabled: false,
  persistenceWritesEnabled: false,
  liveCustomerReadsEnabled: false,
  liveCustomerWritesEnabled: false,
  archiveWritesEnabled: false,
  retentionPolicyWritesEnabled: false,
  supabaseMigrationAdded: false,
  supabaseEdgeFunctionAdded: false,
  vercelAdded: false,
  cloudflarePagesAdded: false,
  livePilotRuntimeEnabled: false
};

export const safePublicDisabledPreviewRefinementPlanInput: PublicDisabledPreviewRefinementPlanInput = {
  environment: safePublicDisabledPreviewRefinementEnvironment,
  refinementItems: safePublicDisabledPreviewRefinementItems,
  requestedDecision: 'approve_static_public_preview_refinement_plan',
  notes: [
    'synthetic-redacted-public-disabled-preview-refinement-layout-plan',
    'synthetic-redacted-public-disabled-preview-refinement-help-placement-plan',
    'synthetic-redacted-public-disabled-preview-refinement-first-safe-interaction-plan'
  ]
};

export const safePublicDisabledPreviewRefinementPlanReport =
  planPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewRefinement(
    safePublicDisabledPreviewRefinementPlanInput
  );
