type Ql062Decision = 'approve_disabled_operator_console_scaffold_review' | 'continue_rework' | 'remain_blocked';

type Ql062Status =
  | 'disabled_operator_console_scaffold_ready'
  | 'blocked_missing_prerequisite'
  | 'blocked_unsafe_environment'
  | 'blocked_missing_console_item'
  | 'blocked_failed_console_item'
  | 'blocked_unsafe_console_item';

interface Ql062Prerequisites {
  ql059ExplicitGoNoGoDecisionGateApproved: boolean;
  ql060ControlledActivationPlanningComplete: boolean;
  ql061ControlledActivationPlanReviewComplete: boolean;
}

interface Ql062RuntimeFlags {
  providerAccountConnectionAllowed: boolean;
  providerLiveNumberAttachmentAllowed: boolean;
  providerCallbackRegistrationAllowed: boolean;
  providerWebhookConfigured: boolean;
  providerCallbackAllowed: boolean;
  livePhoneWebhookAllowed: boolean;
  smsSendingAllowed: boolean;
  callRecordingAllowed: boolean;
  aiDraftAllowed: boolean;
  aiAutoSendAllowed: boolean;
  persistenceWritesAllowed: boolean;
  liveCustomerReadAllowed: boolean;
  liveCustomerWriteAllowed: boolean;
  dryRunExecutionAllowed: boolean;
  providerDeliveryAllowed: boolean;
  archiveWritesAllowed: boolean;
  retentionPolicyWritesAllowed: boolean;
  livePilotRuntimeAllowed: boolean;
}

interface Ql062Environment extends Ql062Prerequisites, Ql062RuntimeFlags {
  operatorConsoleMounted: boolean;
  operatorConsoleDisabledMode: boolean;
  operatorConsoleVisibleFromAdmin: boolean;
  helpSystemCarriedForward: boolean;
  manualInterventionGuideCarriedForward: boolean;
  syntheticEvidenceOnly: boolean;
  redactedEvidenceOnly: boolean;
  safeToPersist: boolean;
}

interface Ql062ConsoleItem {
  id: string;
  label: string;
  present: boolean;
  disabled: boolean;
  reviewOnly: boolean;
  syntheticOnly: boolean;
  redactedOnly: boolean;
  blocksLiveRuntime: boolean;
  blocksProviderDelivery: boolean;
  blocksPersistence: boolean;
  safeToPersist: boolean;
}

interface Ql062Input {
  build: 'QL-062';
  stage: 'phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold';
  decision: Ql062Decision;
  environment: Ql062Environment;
  consoleItems: Ql062ConsoleItem[];
}

interface Ql062Report {
  build: 'QL-062';
  status: Ql062Status;
  decision: Ql062Decision;
  approvedForDisabledOperatorConsoleReview: boolean;
  operatorConsoleAvailable: boolean;
  operatorConsoleDisabledMode: boolean;
  liveEnablementAllowed: false;
  livePilotRuntimeAllowed: false;
  providerDeliveryAllowed: false;
  providerConnectionAllowed: false;
  liveNumberAttachmentAllowed: false;
  smsSendingAllowed: false;
  persistenceWritesAllowed: false;
  safeToPersist: false;
  blockedReasons: string[];
  requiredNextBuild: 'QL-063-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-review';
}

const requiredPrerequisites: Array<keyof Ql062Prerequisites> = [
  'ql059ExplicitGoNoGoDecisionGateApproved',
  'ql060ControlledActivationPlanningComplete',
  'ql061ControlledActivationPlanReviewComplete'
];

const runtimeFlagKeys: Array<keyof Ql062RuntimeFlags> = [
  'providerAccountConnectionAllowed',
  'providerLiveNumberAttachmentAllowed',
  'providerCallbackRegistrationAllowed',
  'providerWebhookConfigured',
  'providerCallbackAllowed',
  'livePhoneWebhookAllowed',
  'smsSendingAllowed',
  'callRecordingAllowed',
  'aiDraftAllowed',
  'aiAutoSendAllowed',
  'persistenceWritesAllowed',
  'liveCustomerReadAllowed',
  'liveCustomerWriteAllowed',
  'dryRunExecutionAllowed',
  'providerDeliveryAllowed',
  'archiveWritesAllowed',
  'retentionPolicyWritesAllowed',
  'livePilotRuntimeAllowed'
];

const requiredConsoleItemIds = [
  'floating_console_toggle',
  'disabled_mode_banner',
  'stage_status_summary',
  'safety_lock_summary',
  'manual_readiness_checklist',
  'variables_services_links_guidance',
  'provider_actions_disabled',
  'sms_actions_disabled',
  'call_actions_disabled',
  'live_customer_data_blocked',
  'operator_notes_synthetic_redacted',
  'next_stage_console_review'
];

function missingPrerequisites(environment: Ql062Environment): string[] {
  return requiredPrerequisites.filter((key) => !environment[key]);
}

function enabledRuntimeFlags(environment: Ql062Environment): string[] {
  return runtimeFlagKeys.filter((key) => environment[key]);
}

function missingConsoleItems(items: Ql062ConsoleItem[]): string[] {
  const present = new Set(items.map((item) => item.id));
  return requiredConsoleItemIds.filter((id) => !present.has(id));
}

function failedConsoleItems(items: Ql062ConsoleItem[]): string[] {
  return items
    .filter((item) => !item.present || !item.disabled || !item.reviewOnly)
    .map((item) => item.id);
}

function unsafeConsoleItems(items: Ql062ConsoleItem[]): string[] {
  return items
    .filter(
      (item) =>
        !item.syntheticOnly ||
        !item.redactedOnly ||
        !item.blocksLiveRuntime ||
        !item.blocksProviderDelivery ||
        !item.blocksPersistence ||
        item.safeToPersist
    )
    .map((item) => item.id);
}

function reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleScaffold(input: Ql062Input): Ql062Report {
  const blockedReasons: string[] = [];
  const missingPrereq = missingPrerequisites(input.environment);
  const enabledRuntime = enabledRuntimeFlags(input.environment);
  const missingItems = missingConsoleItems(input.consoleItems);
  const failedItems = failedConsoleItems(input.consoleItems);
  const unsafeItems = unsafeConsoleItems(input.consoleItems);

  if (input.build !== 'QL-062') blockedReasons.push('Unexpected build identifier.');
  if (input.stage !== 'phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold') {
    blockedReasons.push('Unexpected stage identifier.');
  }
  if (missingPrereq.length > 0) blockedReasons.push(`Missing prerequisites: ${missingPrereq.join(', ')}`);
  if (enabledRuntime.length > 0) blockedReasons.push(`Unsafe runtime flags enabled: ${enabledRuntime.join(', ')}`);
  if (!input.environment.operatorConsoleMounted) blockedReasons.push('Operator console is not mounted.');
  if (!input.environment.operatorConsoleDisabledMode) blockedReasons.push('Operator console is not in disabled mode.');
  if (!input.environment.operatorConsoleVisibleFromAdmin) blockedReasons.push('Operator console is not visible from the admin interface.');
  if (!input.environment.helpSystemCarriedForward) blockedReasons.push('Help system was not carried forward.');
  if (!input.environment.manualInterventionGuideCarriedForward) blockedReasons.push('Manual intervention guide was not carried forward.');
  if (!input.environment.syntheticEvidenceOnly) blockedReasons.push('Evidence is not synthetic-only.');
  if (!input.environment.redactedEvidenceOnly) blockedReasons.push('Evidence is not redacted-only.');
  if (input.environment.safeToPersist) blockedReasons.push('Evidence was incorrectly marked safe to persist.');
  if (missingItems.length > 0) blockedReasons.push(`Missing console items: ${missingItems.join(', ')}`);
  if (failedItems.length > 0) blockedReasons.push(`Failed console items: ${failedItems.join(', ')}`);
  if (unsafeItems.length > 0) blockedReasons.push(`Unsafe console items: ${unsafeItems.join(', ')}`);

  let status: Ql062Status = 'disabled_operator_console_scaffold_ready';
  if (missingPrereq.length > 0) status = 'blocked_missing_prerequisite';
  else if (enabledRuntime.length > 0 || !input.environment.operatorConsoleDisabledMode || input.environment.safeToPersist) {
    status = 'blocked_unsafe_environment';
  } else if (missingItems.length > 0) status = 'blocked_missing_console_item';
  else if (failedItems.length > 0) status = 'blocked_failed_console_item';
  else if (unsafeItems.length > 0) status = 'blocked_unsafe_console_item';

  const approvedForDisabledOperatorConsoleReview =
    status === 'disabled_operator_console_scaffold_ready' && input.decision === 'approve_disabled_operator_console_scaffold_review';

  return {
    build: 'QL-062',
    status,
    decision: input.decision,
    approvedForDisabledOperatorConsoleReview,
    operatorConsoleAvailable: approvedForDisabledOperatorConsoleReview,
    operatorConsoleDisabledMode: input.environment.operatorConsoleDisabledMode,
    liveEnablementAllowed: false,
    livePilotRuntimeAllowed: false,
    providerDeliveryAllowed: false,
    providerConnectionAllowed: false,
    liveNumberAttachmentAllowed: false,
    smsSendingAllowed: false,
    persistenceWritesAllowed: false,
    safeToPersist: false,
    blockedReasons,
    requiredNextBuild: 'QL-063-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-review'
  };
}

const safeDisabledOperatorConsoleItems: Ql062ConsoleItem[] = requiredConsoleItemIds.map((id) => ({
  id,
  label: id.replace(/_/g, ' '),
  present: true,
  disabled: true,
  reviewOnly: true,
  syntheticOnly: true,
  redactedOnly: true,
  blocksLiveRuntime: true,
  blocksProviderDelivery: true,
  blocksPersistence: true,
  safeToPersist: false
}));

const safeDisabledOperatorConsoleInput: Ql062Input = {
  build: 'QL-062',
  stage: 'phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold',
  decision: 'approve_disabled_operator_console_scaffold_review',
  environment: {
    ql059ExplicitGoNoGoDecisionGateApproved: true,
    ql060ControlledActivationPlanningComplete: true,
    ql061ControlledActivationPlanReviewComplete: true,
    providerAccountConnectionAllowed: false,
    providerLiveNumberAttachmentAllowed: false,
    providerCallbackRegistrationAllowed: false,
    providerWebhookConfigured: false,
    providerCallbackAllowed: false,
    livePhoneWebhookAllowed: false,
    smsSendingAllowed: false,
    callRecordingAllowed: false,
    aiDraftAllowed: false,
    aiAutoSendAllowed: false,
    persistenceWritesAllowed: false,
    liveCustomerReadAllowed: false,
    liveCustomerWriteAllowed: false,
    dryRunExecutionAllowed: false,
    providerDeliveryAllowed: false,
    archiveWritesAllowed: false,
    retentionPolicyWritesAllowed: false,
    livePilotRuntimeAllowed: false,
    operatorConsoleMounted: true,
    operatorConsoleDisabledMode: true,
    operatorConsoleVisibleFromAdmin: true,
    helpSystemCarriedForward: true,
    manualInterventionGuideCarriedForward: true,
    syntheticEvidenceOnly: true,
    redactedEvidenceOnly: true,
    safeToPersist: false
  },
  consoleItems: safeDisabledOperatorConsoleItems
};

function runPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleScaffold(): Ql062Report {
  return reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleScaffold(safeDisabledOperatorConsoleInput);
}

export {
  runPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleScaffold,
  reviewPhoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleScaffold,
  safeDisabledOperatorConsoleInput,
  safeDisabledOperatorConsoleItems
};
export type { Ql062ConsoleItem, Ql062Environment, Ql062Input, Ql062Report };
