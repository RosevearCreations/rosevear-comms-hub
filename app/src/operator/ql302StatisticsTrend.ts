import { dashboardQueues, type DashboardQueueItem, type QueueCategory } from './ql191DashboardData';
import type { OrganizationId } from './ql191Organizations';

export type Ql302Window = 7 | 14 | 28;
export type Ql302Segment = QueueCategory | 'all';
export interface Ql302FixtureEvent {
  id: string;
  category: QueueCategory;
  fictionalDaysAgo: number;
}

const offsets: Record<QueueCategory, number> = { reply: 1, call: 4, intake: 9, task: 15 };
const categories: readonly QueueCategory[] = ['reply', 'call', 'intake', 'task'];

export function ql302FixtureEvents(organization: OrganizationId): readonly Ql302FixtureEvent[] {
  return (dashboardQueues[organization] ?? []).map((item: DashboardQueueItem) => ({ id: item.id, category: item.category, fictionalDaysAgo: offsets[item.category] }));
}

export function ql302Trend(events: readonly Ql302FixtureEvent[], days: Ql302Window, segment: Ql302Segment) {
  const selected = events.filter(event => Number.isInteger(event.fictionalDaysAgo) && event.fictionalDaysAgo >= 0 && event.fictionalDaysAgo < days &&
    (segment === 'all' || event.category === segment));
  const rows = Array.from({ length: days / 7 }, (_, index) => {
    const start = index * 7;
    const members = selected.filter(event => event.fictionalDaysAgo >= start && event.fictionalDaysAgo < start + 7);
    return { key: `${start}-${start + 6}`, label: start === 0 ? 'Most recent 7 demo days' : `${start}–${start + 6} demo days ago`, count: members.length,
      categories: Object.fromEntries(categories.map(category => [category, members.filter(event => event.category === category).length])) as Record<QueueCategory, number> };
  });
  return { rows, total: selected.length, sourceItems: events.length, maxCount: Math.max(1, ...rows.map(row => row.count)), liveEvents: 0 };
}
