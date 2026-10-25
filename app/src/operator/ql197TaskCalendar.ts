import type { MockDueWindow, MockFollowUpTask, MockQueueState } from './ql194WorkQueue';
import type { OrganizationId } from './ql191Organizations';

/** Fixed fictional dates, never interpreted as deadlines or scheduled notifications. */
export const DEMO_CALENDAR_ANCHOR = '2026-10-26';
export const DUE_TO_DEMO_DATE: Readonly<Record<MockDueWindow, string>> = {
  overdue: '2026-10-25', today: '2026-10-26', soon: '2026-10-28', later: '2026-11-02'
};

export function taskCalendarDate(task: MockFollowUpTask): string { return DUE_TO_DEMO_DATE[task.due]; }

export function demoWeekDates(offset: number): readonly string[] {
  if (!Number.isInteger(offset) || offset < -1 || offset > 1) return [];
  const start = Date.parse(`${DEMO_CALENDAR_ANCHOR}T00:00:00Z`) + offset * 7 * 86_400_000;
  return Array.from({ length: 7 }, (_, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
}

export function calendarTasksForOrganization(organizationId: OrganizationId, queue: MockQueueState): readonly MockFollowUpTask[] {
  return queue.organizationId === organizationId ? queue.tasks.filter((task) => task.organizationId === organizationId) : [];
}

export function toggleDemoReminder(organizationId: OrganizationId, queue: MockQueueState, active: ReadonlySet<string>, taskId: string): ReadonlySet<string> {
  if (!calendarTasksForOrganization(organizationId, queue).some((task) => task.id === taskId && task.status !== 'done')) return active;
  // Avoid a generic delete-method call: this state is a local UI Set, not a data mutation API.
  return active.has(taskId) ? new Set([...active].filter((id) => id !== taskId)) : new Set([...active, taskId]);
}
