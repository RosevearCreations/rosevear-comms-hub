import type { OrganizationId } from './ql191Organizations';
import { inboxForOrganization } from './ql192InboxFixtures';

export type MockTaskStatus = 'open' | 'waiting' | 'done';
export type MockDueWindow = 'overdue' | 'today' | 'soon' | 'later';
export type MockTaskPriority = 'high' | 'normal';

export interface MockTeamMember {
  id: string;
  organizationId: OrganizationId;
  label: string;
  role: string;
}

export interface MockFollowUpTask {
  id: string;
  organizationId: OrganizationId;
  threadId: string;
  ownerId: string | null;
  status: MockTaskStatus;
  due: MockDueWindow;
  priority: MockTaskPriority;
  title: string;
}

export interface MockQueueReceipt {
  id: string;
  taskId: string;
  organizationId: OrganizationId;
  sequence: number;
  description: string;
}

export type MockHandoffStep = 'verify-context' | 'owner-review' | 'prepare-response' | 'resolve-blocker';

export interface MockHandoffSummary {
  id: string;
  taskId: string;
  organizationId: OrganizationId;
  recipientId: string;
  nextStep: MockHandoffStep;
  taskVersion: string;
  summary: string;
}

export interface MockQueueState {
  organizationId: OrganizationId;
  tasks: readonly MockFollowUpTask[];
  receipts: readonly MockQueueReceipt[];
  handoffs: readonly MockHandoffSummary[];
  nextTask: number;
  nextReceipt: number;
}

export type MockQueueAction =
  | { kind: 'create'; threadId: string }
  | { kind: 'assign'; taskId: string; ownerId: string | null }
  | { kind: 'status'; taskId: string; status: MockTaskStatus }
  | { kind: 'due'; taskId: string; due: MockDueWindow }
  | { kind: 'priority'; taskId: string; priority: MockTaskPriority }
  | { kind: 'handoff'; taskId: string; recipientId: string; nextStep: MockHandoffStep };

const syntheticRosters: Readonly<Record<OrganizationId, readonly MockTeamMember[]>> = {
  rosiedazzlers: [
    { id: 'rd-agent-intake', organizationId: 'rosiedazzlers', label: 'Demo intake coordinator', role: 'Sample queue triage' },
    { id: 'rd-agent-detailer', organizationId: 'rosiedazzlers', label: 'Demo detail lead', role: 'Sample service specialist' },
    { id: 'rd-agent-estimate', organizationId: 'rosiedazzlers', label: 'Demo estimator', role: 'Sample quote specialist' }
  ],
  devilndove: [
    { id: 'dnd-agent-orders', organizationId: 'devilndove', label: 'Demo orders coordinator', role: 'Sample order triage' },
    { id: 'dnd-agent-maker', organizationId: 'devilndove', label: 'Demo workshop maker', role: 'Sample maker review' },
    { id: 'dnd-agent-quotes', organizationId: 'devilndove', label: 'Demo commission estimator', role: 'Sample quote specialist' }
  ],
  icamp: [
    { id: 'camp-agent-desk', organizationId: 'icamp', label: 'Demo front desk', role: 'Sample guest service' },
    { id: 'camp-agent-maint', organizationId: 'icamp', label: 'Demo maintenance lead', role: 'Sample maintenance coordinator' },
    { id: 'camp-agent-events', organizationId: 'icamp', label: 'Demo events desk', role: 'Sample visitor support' }
  ],
  yw: [
    { id: 'yw-agent-dispatch', organizationId: 'yw', label: 'Demo dispatcher', role: 'Sample field coordination' },
    { id: 'yw-agent-crew', organizationId: 'yw', label: 'Demo crew lead', role: 'Sample service supervisor' },
    { id: 'yw-agent-estimate', organizationId: 'yw', label: 'Demo service estimator', role: 'Sample quote specialist' }
  ]
};

/** These assignments are seeded fictional data. No staff account or access grant exists. */
const taskFixtures: Readonly<Record<OrganizationId, readonly MockFollowUpTask[]>> = {
  rosiedazzlers: [
    { id: 'rd-task-1', organizationId: 'rosiedazzlers', threadId: 'rd-missed', ownerId: null, status: 'open', due: 'overdue', priority: 'high', title: 'Review missed booking question' },
    { id: 'rd-task-2', organizationId: 'rosiedazzlers', threadId: 'rd-sms', ownerId: 'rd-agent-intake', status: 'open', due: 'today', priority: 'high', title: 'Review winter salt-stain reply' },
    { id: 'rd-task-3', organizationId: 'rosiedazzlers', threadId: 'rd-website', ownerId: 'rd-agent-estimate', status: 'waiting', due: 'soon', priority: 'normal', title: 'Prepare ceramic estimate information' },
    { id: 'rd-task-4', organizationId: 'rosiedazzlers', threadId: 'rd-email', ownerId: 'rd-agent-intake', status: 'done', due: 'later', priority: 'normal', title: 'Review fictional fleet inquiry' }
  ],
  devilndove: [
    { id: 'dnd-task-1', organizationId: 'devilndove', threadId: 'dnd-voicemail', ownerId: null, status: 'open', due: 'overdue', priority: 'high', title: 'Triage wax ring commission question' },
    { id: 'dnd-task-2', organizationId: 'devilndove', threadId: 'dnd-sms', ownerId: 'dnd-agent-orders', status: 'open', due: 'today', priority: 'high', title: 'Review keepsake lead time' },
    { id: 'dnd-task-3', organizationId: 'devilndove', threadId: 'dnd-web', ownerId: 'dnd-agent-quotes', status: 'waiting', due: 'soon', priority: 'normal', title: 'Review resin colour request' },
    { id: 'dnd-task-4', organizationId: 'devilndove', threadId: 'dnd-internal', ownerId: 'dnd-agent-maker', status: 'done', due: 'later', priority: 'normal', title: 'Check sample material stock' }
  ],
  icamp: [
    { id: 'camp-task-1', organizationId: 'icamp', threadId: 'camp-voice', ownerId: null, status: 'open', due: 'overdue', priority: 'high', title: 'Triage gate arrival inquiry' },
    { id: 'camp-task-2', organizationId: 'icamp', threadId: 'camp-sms', ownerId: 'camp-agent-desk', status: 'open', due: 'today', priority: 'high', title: 'Review tent-site question' },
    { id: 'camp-task-3', organizationId: 'icamp', threadId: 'camp-web', ownerId: 'camp-agent-events', status: 'waiting', due: 'soon', priority: 'normal', title: 'Review event pass intake' },
    { id: 'camp-task-4', organizationId: 'icamp', threadId: 'camp-internal', ownerId: 'camp-agent-maint', status: 'done', due: 'later', priority: 'normal', title: 'Check washroom repair handoff' }
  ],
  yw: [
    { id: 'yw-task-1', organizationId: 'yw', threadId: 'yw-voicemail', ownerId: null, status: 'open', due: 'overdue', priority: 'high', title: 'Review mock septic priority request' },
    { id: 'yw-task-2', organizationId: 'yw', threadId: 'yw-sms', ownerId: 'yw-agent-dispatch', status: 'open', due: 'today', priority: 'high', title: 'Review snow-plowing schedule' },
    { id: 'yw-task-3', organizationId: 'yw', threadId: 'yw-web', ownerId: 'yw-agent-estimate', status: 'waiting', due: 'soon', priority: 'normal', title: 'Review garbage sticker inquiry' },
    { id: 'yw-task-4', organizationId: 'yw', threadId: 'yw-internal', ownerId: 'yw-agent-crew', status: 'done', due: 'later', priority: 'normal', title: 'Review simulated fibre-site constraints' }
  ]
};

export function rosterForOrganization(organizationId: OrganizationId): readonly MockTeamMember[] {
  return syntheticRosters[organizationId];
}

export function seedQueueForOrganization(organizationId: OrganizationId): MockQueueState {
  return { organizationId, tasks: taskFixtures[organizationId].map((task) => ({ ...task })), receipts: [], handoffs: [], nextTask: 1, nextReceipt: 1 };
}

export function taskVersion(task: MockFollowUpTask): string {
  return [task.id, task.ownerId ?? 'unassigned', task.status, task.due, task.priority].join('|');
}

export const handoffStepLabels: Readonly<Record<MockHandoffStep, string>> = {
  'verify-context': 'Verify fictional conversation context',
  'owner-review': 'Request simulated owner review',
  'prepare-response': 'Prepare an unsent example response',
  'resolve-blocker': 'Recheck sample waiting blocker'
};

export function dueRank(due: MockDueWindow): number {
  return ({ overdue: 0, today: 1, soon: 2, later: 3 } as const)[due];
}

export function sortedQueueTasks(tasks: readonly MockFollowUpTask[]): readonly MockFollowUpTask[] {
  return [...tasks].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done') || dueRank(a.due) - dueRank(b.due) || Number(b.priority === 'high') - Number(a.priority === 'high') || a.id.localeCompare(b.id));
}

/**
 * Pure in-memory reducer. Every mutation is explicitly scoped and validated;
 * receipts are local UI descriptions, not a legal audit log.
 */
export function applyQueueAction(organizationId: OrganizationId, state: MockQueueState, action: MockQueueAction): MockQueueState {
  if (state.organizationId !== organizationId) return state;

  if (action.kind === 'create') {
    const source = inboxForOrganization(organizationId).find((thread) => thread.id === action.threadId);
    if (!source || state.tasks.some((task) => task.threadId === source.id)) return state;
    const task: MockFollowUpTask = {
      id: `${organizationId}-followup-${state.nextTask}`, organizationId, threadId: source.id,
      ownerId: null, status: 'open', due: 'today', priority: source.priority,
      title: `Follow up: ${source.subject}`
    };
    const receipt: MockQueueReceipt = { id: `${organizationId}-receipt-${state.nextReceipt}`, taskId: task.id, organizationId, sequence: state.nextReceipt, description: `Created unassigned demo follow-up for ${source.subject}` };
    return { ...state, tasks: [...state.tasks, task], receipts: [...state.receipts, receipt], nextTask: state.nextTask + 1, nextReceipt: state.nextReceipt + 1 };
  }

  const index = state.tasks.findIndex((task) => task.id === action.taskId && task.organizationId === organizationId);
  if (index === -1) return state;
  const original = state.tasks[index];
  if (action.kind === 'handoff') {
    const recipient = rosterForOrganization(organizationId).find((person) => person.id === action.recipientId);
    if (!recipient || original.status === 'done' || !Object.hasOwn(handoffStepLabels, action.nextStep)) return state;
    const thread = inboxForOrganization(organizationId).find((item) => item.id === original.threadId);
    if (!thread) return state;
    const summary: MockHandoffSummary = {
      id: `${organizationId}-handoff-${state.nextReceipt}`,
      taskId: original.id,
      organizationId,
      recipientId: recipient.id,
      nextStep: action.nextStep,
      taskVersion: taskVersion(original),
      summary: `${original.title} · ${thread.channel.toUpperCase()} source · ${original.status === 'waiting' ? 'Waiting / blocked' : 'Open'} · ${original.due} example · ${original.priority} priority. Current demo owner: ${rosterForOrganization(organizationId).find((member) => member.id === original.ownerId)?.label ?? 'Unassigned'}. Handoff preview for ${recipient.label}: ${handoffStepLabels[action.nextStep]}.`
    };
    const receipt: MockQueueReceipt = { id: `${organizationId}-receipt-${state.nextReceipt}`, taskId: original.id, organizationId, sequence: state.nextReceipt, description: `Prepared UNSENT handoff preview for ${recipient.label}` };
    return { ...state, handoffs: [...state.handoffs.filter((item) => item.taskId !== original.id), summary], receipts: [...state.receipts, receipt], nextReceipt: state.nextReceipt + 1 };
  }
  let updated: MockFollowUpTask;
  let description: string;

  if (action.kind === 'assign') {
    if (action.ownerId !== null && !rosterForOrganization(organizationId).some((person) => person.id === action.ownerId)) return state;
    if (original.ownerId === action.ownerId) return state;
    updated = { ...original, ownerId: action.ownerId };
    description = action.ownerId === null ? 'Returned follow-up to unassigned queue' : `Assigned to ${rosterForOrganization(organizationId).find((person) => person.id === action.ownerId)?.label}`;
  } else if (action.kind === 'status') {
    if (!(['open', 'waiting', 'done'] as const).includes(action.status) || original.status === action.status) return state;
    updated = { ...original, status: action.status };
    description = `Changed sample status to ${action.status}`;
  } else if (action.kind === 'due') {
    if (!(['overdue', 'today', 'soon', 'later'] as const).includes(action.due) || original.due === action.due) return state;
    updated = { ...original, due: action.due };
    description = `Changed simulated due window to ${action.due}`;
  } else {
    if (!(['high', 'normal'] as const).includes(action.priority) || original.priority === action.priority) return state;
    updated = { ...original, priority: action.priority };
    description = `Changed demo priority to ${action.priority}`;
  }
  const receipt: MockQueueReceipt = { id: `${organizationId}-receipt-${state.nextReceipt}`, taskId: original.id, organizationId, sequence: state.nextReceipt, description };
  return {
    ...state, tasks: state.tasks.map((task, i) => i === index ? updated : task),
    receipts: [...state.receipts, receipt], nextReceipt: state.nextReceipt + 1
  };
}
