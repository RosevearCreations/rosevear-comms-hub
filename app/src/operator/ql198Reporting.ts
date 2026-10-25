import { inboxForOrganization, type InboxChannel, type InboxDisposition } from './ql192InboxFixtures';
import type { OrganizationId } from './ql191Organizations';
import type { MockQueueState, MockTaskStatus } from './ql194WorkQueue';

export type ReportingDimension = 'channel' | 'status';
export interface ReportRow { key: string; label: string; count: number; percent: number }
export interface DemoReport {
  threads: number; unread: number; awaitingReply: number; followUps: number;
  activeTasks: number; unassignedTasks: number; overdueTasks: number; completedTasks: number;
  rows: readonly ReportRow[]; receiptCount: number;
}

const channelLabels: Readonly<Record<InboxChannel, string>> = {
  sms: 'SMS', mms: 'MMS', voice: 'Voice calls', voicemail: 'Voicemail',
  website: 'Website', email: 'Email', internal: 'Internal'
};
const statusLabels: Readonly<Record<InboxDisposition, string>> = {
  new: 'New', needs_reply: 'Needs reply', waiting: 'Waiting', resolved: 'Resolved'
};

/** Deterministic sample-only aggregates. Never query live inboxes or mix companies. */
export function reportForOrganization(id: OrganizationId, queue: MockQueueState, dimension: ReportingDimension): DemoReport | null {
  if (queue.organizationId !== id || queue.tasks.some((task) => task.organizationId !== id) || queue.receipts.some((receipt) => receipt.organizationId !== id)) return null;
  const threads = inboxForOrganization(id);
  const tasks = queue.tasks;
  const labels: Readonly<Record<string, string>> = dimension === 'channel' ? channelLabels : statusLabels;
  const rows = Object.entries(labels).map(([key, label]) => {
    const count = threads.filter((thread) => (dimension === 'channel' ? thread.channel : thread.status) === key).length;
    return { key, label, count, percent: threads.length ? Math.round(count / threads.length * 100) : 0 };
  }).filter((row) => row.count > 0);
  const statusCount = (status: MockTaskStatus) => tasks.filter((task) => task.status === status).length;
  return {
    threads: threads.length, unread: threads.filter((thread) => thread.unread).length,
    awaitingReply: threads.filter((thread) => thread.status === 'needs_reply').length,
    followUps: tasks.length, activeTasks: tasks.length - statusCount('done'),
    unassignedTasks: tasks.filter((task) => task.status !== 'done' && task.ownerId === null).length,
    overdueTasks: tasks.filter((task) => task.status !== 'done' && task.due === 'overdue').length,
    completedTasks: statusCount('done'), rows, receiptCount: queue.receipts.length
  };
}
