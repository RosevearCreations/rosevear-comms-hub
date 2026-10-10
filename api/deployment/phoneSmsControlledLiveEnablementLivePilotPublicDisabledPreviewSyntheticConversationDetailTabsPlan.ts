export type PublicDisabledPreviewSyntheticConversationDetailTabsPlanStatus =
  | 'public_disabled_preview_synthetic_conversation_detail_tabs_plan_ready'
  | 'blocked_for_live_runtime_or_data_source';

export type PublicDisabledPreviewSyntheticConversationDetailTabsPlanInput = {
  targetPreviewUrl: string;
  viteBasePath: string;
  pagesWorkflowConclusion: 'success' | 'skipped' | 'failure' | 'unknown';
  publicPreviewLoaded: boolean;
  brandSwitcherBrowserLocal: boolean;
  syntheticConversationSelectorBrowserLocal: boolean;
  detailTabsPlannedOnly: boolean;
  plannedTabs: string[];
  usesHardCodedSyntheticConversationsOnly: boolean;
  supabaseConversationRowsEnabled: boolean;
  providerInboxImportsEnabled: boolean;
  liveCustomerRecordsEnabled: boolean;
  smsOrCallHistoryEnabled: boolean;
  recordingsOrTranscriptsEnabled: boolean;
  aiReplyGenerationEnabled: boolean;
  persistenceWritesEnabled: boolean;
  archiveWritesEnabled: boolean;
  retentionWritesEnabled: boolean;
  providerCallbacksEnabled: boolean;
  livePilotRuntimeEnabled: boolean;
};

export type PublicDisabledPreviewSyntheticConversationDetailTabsPlanDecision = {
  status: PublicDisabledPreviewSyntheticConversationDetailTabsPlanStatus;
  approved: boolean;
  nextQueuedBuild: 'QL-086 — Public Disabled Preview Synthetic Conversation Detail Tabs Implementation' | 'manual_fix_required';
  blockedReasons: string[];
  approvedTabs: string[];
};

const expectedPreviewUrl = 'https://rosevearcreations.github.io/rosevear-comms-hub/';
const expectedBasePath = '/rosevear-comms-hub/';
const requiredTabs = ['Overview', 'Draft', 'Timeline', 'Safety'];

export function reviewPublicDisabledPreviewSyntheticConversationDetailTabsPlan(
  input: PublicDisabledPreviewSyntheticConversationDetailTabsPlanInput
): PublicDisabledPreviewSyntheticConversationDetailTabsPlanDecision {
  const blockedReasons: string[] = [];

  if (input.targetPreviewUrl !== expectedPreviewUrl) blockedReasons.push('Unexpected public preview URL.');
  if (input.viteBasePath !== expectedBasePath) blockedReasons.push('Unexpected Vite base path.');
  if (input.pagesWorkflowConclusion !== 'success') blockedReasons.push('GitHub Pages disabled preview must remain deployed before detail-tab planning is approved.');
  if (!input.publicPreviewLoaded) blockedReasons.push('Public disabled preview must load before detail-tab planning is approved.');
  if (!input.brandSwitcherBrowserLocal) blockedReasons.push('Brand switcher must remain browser-local React state only.');
  if (!input.syntheticConversationSelectorBrowserLocal) blockedReasons.push('Conversation selector must remain browser-local React state only.');
  if (!input.detailTabsPlannedOnly) blockedReasons.push('QL-085 may plan tabs only; tab implementation must wait for QL-086.');
  if (!input.usesHardCodedSyntheticConversationsOnly) blockedReasons.push('Detail tabs must use only hard-coded synthetic conversation data.');

  const missingTabs = requiredTabs.filter((tab) => !input.plannedTabs.includes(tab));
  if (missingTabs.length > 0) blockedReasons.push(`Missing planned detail tabs: ${missingTabs.join(', ')}.`);

  const unsafeFlags: Array<[keyof PublicDisabledPreviewSyntheticConversationDetailTabsPlanInput, string]> = [
    ['supabaseConversationRowsEnabled', 'Supabase conversation rows must remain disabled.'],
    ['providerInboxImportsEnabled', 'Provider inbox imports must remain disabled.'],
    ['liveCustomerRecordsEnabled', 'Live customer records must remain disabled.'],
    ['smsOrCallHistoryEnabled', 'SMS or call history must remain disabled.'],
    ['recordingsOrTranscriptsEnabled', 'Recordings or transcripts must remain disabled.'],
    ['aiReplyGenerationEnabled', 'AI reply generation must remain disabled.'],
    ['persistenceWritesEnabled', 'Persistence writes must remain disabled.'],
    ['archiveWritesEnabled', 'Archive writes must remain disabled.'],
    ['retentionWritesEnabled', 'Retention writes must remain disabled.'],
    ['providerCallbacksEnabled', 'Provider callbacks must remain disabled.'],
    ['livePilotRuntimeEnabled', 'Live pilot runtime must remain disabled.']
  ];

  unsafeFlags.forEach(([key, reason]) => {
    if (input[key] === true) blockedReasons.push(reason);
  });

  return {
    status: blockedReasons.length === 0
      ? 'public_disabled_preview_synthetic_conversation_detail_tabs_plan_ready'
      : 'blocked_for_live_runtime_or_data_source',
    approved: blockedReasons.length === 0,
    nextQueuedBuild: blockedReasons.length === 0
      ? 'QL-086 — Public Disabled Preview Synthetic Conversation Detail Tabs Implementation'
      : 'manual_fix_required',
    blockedReasons,
    approvedTabs: blockedReasons.length === 0 ? requiredTabs : []
  };
}
