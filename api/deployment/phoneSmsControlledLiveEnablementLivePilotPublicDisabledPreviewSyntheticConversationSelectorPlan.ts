type SelectorPlanStatus =
  | 'approved_synthetic_conversation_selector_plan'
  | 'blocked_missing_review_prerequisite'
  | 'blocked_non_synthetic_source'
  | 'blocked_runtime_enablement'
  | 'blocked_unapproved_next_step';

type SelectorPlanDecision =
  | 'approve_synthetic_conversation_selector_implementation'
  | 'continue_rework'
  | 'remain_blocked';

type SelectorPlanInput = {
  buildId: 'QL-082';
  ql081ReviewComplete: boolean;
  requestedScope: 'public_disabled_preview_synthetic_conversation_selector_plan_only';
  nextBuild: string;
  selectorUsesHardCodedSamplesOnly: boolean;
  selectorUsesBrowserLocalStateOnly: boolean;
  selectorReadsSupabase: boolean;
  selectorReadsProviderInbox: boolean;
  selectorReadsLiveCustomers: boolean;
  selectorSendsSms: boolean;
  selectorStartsCall: boolean;
  selectorGeneratesAiReply: boolean;
  selectorWritesPersistence: boolean;
  selectorWritesArchive: boolean;
  selectorWritesRetention: boolean;
  providerRuntimeEnabled: boolean;
  livePilotRuntimeEnabled: boolean;
};

type SelectorPlanReport = {
  buildId: 'QL-082';
  status: SelectorPlanStatus;
  decision: SelectorPlanDecision;
  approvedNextBuild: string | null;
  findings: string[];
  blockedReasons: string[];
};

const approvedNextBuild = 'QL-083-public-disabled-preview-synthetic-conversation-selector-implementation';

function reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewSyntheticConversationSelectorPlan(
  input: SelectorPlanInput
): SelectorPlanReport {
  const findings: string[] = [];
  const blockedReasons: string[] = [];

  if (!input.ql081ReviewComplete) {
    blockedReasons.push('QL-081 first safe interaction review must be complete before planning another interaction.');
  } else {
    findings.push('QL-081 review is complete and the brand switcher remains browser-local and synthetic.');
  }

  if (input.requestedScope !== 'public_disabled_preview_synthetic_conversation_selector_plan_only') {
    blockedReasons.push('QL-082 may only plan the synthetic conversation selector.');
  }

  if (!input.selectorUsesHardCodedSamplesOnly) {
    blockedReasons.push('The planned selector must use hard-coded synthetic samples only.');
  } else {
    findings.push('The planned selector is limited to hard-coded synthetic conversation samples.');
  }

  if (!input.selectorUsesBrowserLocalStateOnly) {
    blockedReasons.push('The planned selector must use browser-local React state only.');
  } else {
    findings.push('The planned selector state remains browser-local and resettable.');
  }

  const nonSyntheticSources = [
    ['Supabase reads', input.selectorReadsSupabase],
    ['provider inbox reads', input.selectorReadsProviderInbox],
    ['live customer reads', input.selectorReadsLiveCustomers]
  ].filter(([, enabled]) => enabled);

  if (nonSyntheticSources.length > 0) {
    blockedReasons.push(`Selector plan includes non-synthetic source(s): ${nonSyntheticSources.map(([label]) => label).join(', ')}.`);
  } else {
    findings.push('No Supabase, provider inbox, or live customer source is planned for the selector.');
  }

  const runtimeFlags = [
    ['SMS sending', input.selectorSendsSms],
    ['call runtime', input.selectorStartsCall],
    ['AI reply generation', input.selectorGeneratesAiReply],
    ['persistence writes', input.selectorWritesPersistence],
    ['archive writes', input.selectorWritesArchive],
    ['retention writes', input.selectorWritesRetention],
    ['provider runtime', input.providerRuntimeEnabled],
    ['live pilot runtime', input.livePilotRuntimeEnabled]
  ].filter(([, enabled]) => enabled);

  if (runtimeFlags.length > 0) {
    blockedReasons.push(`Selector plan attempts to enable runtime path(s): ${runtimeFlags.map(([label]) => label).join(', ')}.`);
  } else {
    findings.push('All live runtime, delivery, persistence, archive, retention, provider, and live-pilot paths remain disabled.');
  }

  if (input.nextBuild !== approvedNextBuild) {
    blockedReasons.push(`Next build must be ${approvedNextBuild}.`);
  }

  if (blockedReasons.length > 0) {
    return {
      buildId: 'QL-082',
      status: blockedReasons.some((reason) => reason.includes('runtime'))
        ? 'blocked_runtime_enablement'
        : blockedReasons.some((reason) => reason.includes('source'))
          ? 'blocked_non_synthetic_source'
          : blockedReasons.some((reason) => reason.includes('Next build'))
            ? 'blocked_unapproved_next_step'
            : 'blocked_missing_review_prerequisite',
      decision: 'remain_blocked',
      approvedNextBuild: null,
      findings,
      blockedReasons
    };
  }

  return {
    buildId: 'QL-082',
    status: 'approved_synthetic_conversation_selector_plan',
    decision: 'approve_synthetic_conversation_selector_implementation',
    approvedNextBuild,
    findings,
    blockedReasons
  };
}

export { reviewPhoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewSyntheticConversationSelectorPlan };
export type { SelectorPlanInput, SelectorPlanReport, SelectorPlanDecision, SelectorPlanStatus };
