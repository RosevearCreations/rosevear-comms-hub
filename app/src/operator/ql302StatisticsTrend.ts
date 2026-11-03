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

export const QL322_CATEGORIES = [
  { id: 'reply', label: 'Reply', description: 'Fictional replies' },
  { id: 'call', label: 'Mock call', description: 'Fictional call simulations' },
  { id: 'intake', label: 'Intake', description: 'Fictional intake requests' },
  { id: 'task', label: 'Task', description: 'Fictional follow-ups' }
] as const;

/** All windows and comparisons are fictional offsets, never clock dates or real observations. */
export function ql322TrendModel(organization: OrganizationId, days: Ql302Window, segment: Ql302Segment) {
  const events = ql302FixtureEvents(organization);
  const trend = ql302Trend(events, days, segment);
  // QL-302 covers exactly the latest 28 fictional days. Anything older is UNKNOWN, not zero.
  const previous = days * 2 <= 28
    ? events.filter(event => Number.isInteger(event.fictionalDaysAgo) && event.fictionalDaysAgo >= days && event.fictionalDaysAgo < days * 2 &&
      (segment === 'all' || event.category === segment)).length
    : null;
  const matching = events.filter(event => Number.isInteger(event.fictionalDaysAgo) && event.fictionalDaysAgo >= 0 && event.fictionalDaysAgo < days &&
    (segment === 'all' || event.category === segment));
  const source = (dashboardQueues[organization] ?? []).filter(item => matching.some(event => event.id === item.id));
  return {
    ...trend,
    previous,
    delta: previous === null ? null : trend.total - previous,
    source,
    // The available input has no genuine event or ingestion timestamp. Never substitute build or wall-clock time.
    lastObservedAt: null as null,
    feedFreshness: 'unknown' as const,
    origin: 'Bundled fictional QL-191 queue; synthetic offsets from QL-302' as const
  };
}

export function ql322BandSources(organization: OrganizationId, days: Ql302Window, segment: Ql302Segment, bandKey: string | null) {
  const model = ql322TrendModel(organization, days, segment);
  if (!bandKey) return model.source;
  const band = model.rows.find(row => row.key === bandKey);
  if (!band) return [];
  const start = Number(band.key.split('-')[0]);
  const ids = new Set(ql302FixtureEvents(organization).filter(event => event.fictionalDaysAgo >= start && event.fictionalDaysAgo < start + 7 &&
    (segment === 'all' || event.category === segment)).map(event => event.id));
  return model.source.filter(item => ids.has(item.id));
}
