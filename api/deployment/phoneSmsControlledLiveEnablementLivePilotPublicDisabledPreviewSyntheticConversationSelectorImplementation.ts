type Ql083SelectorImplementationInput = {
  buildId: 'QL-083';
  publicPreviewUrl: string;
  pagesDeployGreen: boolean;
  appCiGreen: boolean;
  brandSwitcherEnabled: boolean;
  conversationSelectorEnabled: boolean;
  dataSource: 'hard-coded-synthetic';
  stateScope: 'browser-local-react-state';
  readsSupabase: boolean;
  writesPersistence: boolean;
  usesProviderInbox: boolean;
  usesLiveCustomers: boolean;
  sendsSms: boolean;
  placesCalls: boolean;
  registersCallbacks: boolean;
  usesAiGeneration: boolean;
  writesArchive: boolean;
  writesRetention: boolean;
  enablesLivePilot: boolean;
};

type Ql083SelectorImplementationResult = {
  approved: boolean;
  status: 'approved-public-disabled-preview-selector' | 'blocked-runtime-scope';
  reasons: string[];
  nextAllowedBuild: 'QL-084 — Public Disabled Preview Synthetic Conversation Selector Review' | 'QL-083 remediation required';
};

const liveRuntimeFields: Array<keyof Ql083SelectorImplementationInput> = [
  'readsSupabase',
  'writesPersistence',
  'usesProviderInbox',
  'usesLiveCustomers',
  'sendsSms',
  'placesCalls',
  'registersCallbacks',
  'usesAiGeneration',
  'writesArchive',
  'writesRetention',
  'enablesLivePilot'
];

function evaluateQl083SyntheticConversationSelectorImplementation(
  input: Ql083SelectorImplementationInput
): Ql083SelectorImplementationResult {
  const reasons: string[] = [];

  if (input.buildId !== 'QL-083') {
    reasons.push('Build id must be QL-083.');
  }

  if (!input.publicPreviewUrl.startsWith('https://rosevearcreations.github.io/rosevear-comms-hub/')) {
    reasons.push('Public preview URL must remain the GitHub Pages disabled preview URL.');
  }

  if (!input.pagesDeployGreen) {
    reasons.push('GitHub Pages disabled preview deployment must be green.');
  }

  if (!input.appCiGreen) {
    reasons.push('App scaffold CI must be green.');
  }

  if (!input.brandSwitcherEnabled || !input.conversationSelectorEnabled) {
    reasons.push('QL-083 requires the existing brand switcher and the synthetic conversation selector to be enabled.');
  }

  if (input.dataSource !== 'hard-coded-synthetic') {
    reasons.push('Conversation selector data must remain hard-coded synthetic sample data.');
  }

  if (input.stateScope !== 'browser-local-react-state') {
    reasons.push('Conversation selector state must remain browser-local React state only.');
  }

  const runtimeLeaks = liveRuntimeFields.filter((field) => input[field] === true);
  if (runtimeLeaks.length > 0) {
    reasons.push(`Live runtime scope detected: ${runtimeLeaks.join(', ')}.`);
  }

  const approved = reasons.length === 0;

  return {
    approved,
    status: approved ? 'approved-public-disabled-preview-selector' : 'blocked-runtime-scope',
    reasons: approved
      ? [
          'QL-083 may remain in the public disabled preview because it uses hard-coded synthetic conversations and browser-local React state only.',
          'No provider, Supabase, live customer, SMS, call, callback, AI, archive, retention, or live pilot runtime path is enabled.'
        ]
      : reasons,
    nextAllowedBuild: approved
      ? 'QL-084 — Public Disabled Preview Synthetic Conversation Selector Review'
      : 'QL-083 remediation required'
  };
}

export type { Ql083SelectorImplementationInput, Ql083SelectorImplementationResult };
export { evaluateQl083SyntheticConversationSelectorImplementation };
