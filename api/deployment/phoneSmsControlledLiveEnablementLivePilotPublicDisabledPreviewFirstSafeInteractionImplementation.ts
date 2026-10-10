type FirstSafeInteractionImplementationStatus =
  | 'first_safe_interaction_implementation_ready'
  | 'blocked_missing_browser_local_interaction'
  | 'blocked_unsafe_data_source'
  | 'blocked_runtime_path_enabled'
  | 'blocked_non_static_preview_scope';

type FirstSafeInteractionId = 'sample_brand_switcher';

type FirstSafeInteractionImplementationInput = {
  build: 'QL-080';
  requestedScope: 'public_disabled_preview_first_safe_interaction_implementation_only';
  interaction: FirstSafeInteractionId;
  implementationMode: 'browser_local_react_state_only';
  publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/';
  syntheticBrands: Array<'Rosie Dazzlers' | 'Devil n Dove'>;
  enabledRuntimePaths: string[];
  dataSources: string[];
  nextBuild: 'QL-081-public-disabled-preview-first-safe-interaction-review';
};

type FirstSafeInteractionImplementationReport = {
  build: 'QL-080';
  status: FirstSafeInteractionImplementationStatus;
  approvedInteraction: FirstSafeInteractionId | null;
  publicPreviewUrl: string;
  browserLocalOnly: boolean;
  syntheticDataOnly: boolean;
  liveRuntimeEnabled: boolean;
  blockedRuntimePaths: string[];
  nextBuild: string | null;
  notes: string[];
};

const allowedDataSources = ['hard-coded synthetic preview data', 'browser-local React state'];

const blockedRuntimePaths = [
  'provider callbacks',
  'live phone webhooks',
  'SMS sending',
  'call runtime',
  'call recording',
  'AI send',
  'provider delivery',
  'callback registration',
  'provider account connection',
  'provider live-number attachment',
  'Supabase runtime reads',
  'Supabase runtime writes',
  'Supabase migrations',
  'Supabase Edge Functions',
  'persistence writes',
  'live customer reads',
  'live customer writes',
  'archive writes',
  'retention policy writes',
  'Vercel hosting changes',
  'Cloudflare Pages changes',
  'live pilot runtime'
];

function reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFirstSafeInteractionImplementation(
  input: FirstSafeInteractionImplementationInput
): FirstSafeInteractionImplementationReport {
  const notes: string[] = [];
  const expectedBrands = ['Rosie Dazzlers', 'Devil n Dove'];
  const browserLocalOnly = input.implementationMode === 'browser_local_react_state_only';
  const syntheticDataOnly = input.dataSources.every((source) => allowedDataSources.includes(source));
  const liveRuntimeEnabled = input.enabledRuntimePaths.length > 0;
  const hasBothSyntheticBrands = expectedBrands.every((brand) => input.syntheticBrands.includes(brand as 'Rosie Dazzlers' | 'Devil n Dove'));

  if (input.requestedScope !== 'public_disabled_preview_first_safe_interaction_implementation_only') {
    notes.push('QL-080 may only implement the first safe public disabled preview interaction.');
    return buildReport('blocked_non_static_preview_scope', null, browserLocalOnly, syntheticDataOnly, liveRuntimeEnabled, notes);
  }

  if (input.interaction !== 'sample_brand_switcher' || !hasBothSyntheticBrands) {
    notes.push('The only approved QL-080 interaction is the Rosie Dazzlers / Devil n Dove sample brand switcher.');
    return buildReport('blocked_missing_browser_local_interaction', null, browserLocalOnly, syntheticDataOnly, liveRuntimeEnabled, notes);
  }

  if (!browserLocalOnly || !syntheticDataOnly) {
    notes.push('QL-080 must use hard-coded synthetic preview data and browser-local React state only.');
    return buildReport('blocked_unsafe_data_source', null, browserLocalOnly, syntheticDataOnly, liveRuntimeEnabled, notes);
  }

  if (liveRuntimeEnabled) {
    notes.push('QL-080 cannot enable any provider, Phone/SMS, Supabase runtime, persistence, archive, retention, AI, or live-pilot path.');
    return buildReport('blocked_runtime_path_enabled', null, browserLocalOnly, syntheticDataOnly, liveRuntimeEnabled, notes);
  }

  notes.push('Sample brand switching may run in the public preview because it is synthetic and browser-local only.');
  notes.push('All live runtime, provider delivery, Supabase runtime, persistence, archive, retention, AI, and live pilot paths remain blocked.');
  return buildReport('first_safe_interaction_implementation_ready', 'sample_brand_switcher', true, true, false, notes);
}

function buildReport(
  status: FirstSafeInteractionImplementationStatus,
  approvedInteraction: FirstSafeInteractionId | null,
  browserLocalOnly: boolean,
  syntheticDataOnly: boolean,
  liveRuntimeEnabled: boolean,
  notes: string[]
): FirstSafeInteractionImplementationReport {
  return {
    build: 'QL-080',
    status,
    approvedInteraction,
    publicPreviewUrl: 'https://rosevearcreations.github.io/rosevear-comms-hub/',
    browserLocalOnly,
    syntheticDataOnly,
    liveRuntimeEnabled,
    blockedRuntimePaths,
    nextBuild: status === 'first_safe_interaction_implementation_ready'
      ? 'QL-081-public-disabled-preview-first-safe-interaction-review'
      : null,
    notes
  };
}

export {
  blockedRuntimePaths,
  reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewFirstSafeInteractionImplementation,
  type FirstSafeInteractionImplementationInput,
  type FirstSafeInteractionImplementationReport,
  type FirstSafeInteractionImplementationStatus
};
