import type { OrganizationId } from './ql191Organizations';
import { rosterForOrganization, taskVersion, type MockFollowUpTask, type MockQueueReceipt, type MockQueueState } from './ql194WorkQueue';

export type Ql318Attention = 'COMPLETED' | 'BLOCKED' | 'NEEDS_OWNER' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
export type Ql318ReviewGate = 'MISSING' | 'STALE' | 'READY';

const attentionLabels: Readonly<Record<Ql318Attention, string>> = {
  COMPLETED: 'Completed example', BLOCKED: 'Waiting / blocked', NEEDS_OWNER: 'Needs fictional owner',
  OVERDUE: 'Overdue example', DUE_TODAY: 'Due today example', UPCOMING: 'Upcoming example'
};
const dueLabels = { overdue: 'Overdue example', today: 'Today example', soon: 'Coming up', later: 'Later' } as const;

/** Company-scoped, read-only card; never returns a foreign task or receipt. */
export function ql318TaskCard(organizationId: OrganizationId, queue: MockQueueState, taskId: string) {
  if (queue.organizationId !== organizationId) return null;
  const task = queue.tasks.find((item) => item.id === taskId && item.organizationId === organizationId);
  if (!task) return null;
  const owner = task.ownerId === null ? 'Unassigned' : rosterForOrganization(organizationId).find((person) => person.id === task.ownerId)?.label ?? 'Unverified owner · hold';
  const attention: Ql318Attention = task.status === 'done' ? 'COMPLETED' : task.status === 'waiting' ? 'BLOCKED'
    : task.ownerId === null ? 'NEEDS_OWNER' : task.due === 'overdue' ? 'OVERDUE' : task.due === 'today' ? 'DUE_TODAY' : 'UPCOMING';
  const history = queue.receipts.filter((receipt) => receipt.organizationId === organizationId && receipt.taskId === task.id)
    .sort((a, b) => a.sequence - b.sequence);
  return { task, owner, due: dueLabels[task.due], severity: task.priority === 'high' ? 'High priority' : 'Normal priority',
    attention, attentionLabel: attentionLabels[attention], history } as const;
}

/** Revision+receipt gate: changing and then restoring a field still requires a new preview. */
export function ql318ReviewGate(organizationId: OrganizationId, queue: MockQueueState, taskId: string): {
  state: Ql318ReviewGate; summary: string | null; reviewKey: string | null; receipt: MockQueueReceipt | null
} {
  const card = ql318TaskCard(organizationId, queue, taskId);
  if (!card) return { state: 'MISSING', summary: null, reviewKey: null, receipt: null };
  const handoff = queue.handoffs.find((item) => item.organizationId === organizationId && item.taskId === taskId);
  if (!handoff) return { state: 'MISSING', summary: null, reviewKey: null, receipt: null };
  const receipt = card.history.find((item) => item.sequence === handoff.preparedAtSequence && item.description.startsWith('Prepared UNSENT handoff preview')) ?? null;
  const latest = card.history.at(-1)?.sequence ?? 0;
  const validRecipient = rosterForOrganization(organizationId).some((person) => person.id === handoff.recipientId);
  if (!receipt || !validRecipient || card.task.status === 'done' || handoff.taskVersion !== taskVersion(card.task) || latest !== handoff.preparedAtSequence) {
    return { state: 'STALE', summary: null, reviewKey: null, receipt };
  }
  return { state: 'READY', summary: handoff.summary, reviewKey: `${organizationId}|${taskId}|${handoff.id}|${handoff.preparedAtSequence}`, receipt };
}
