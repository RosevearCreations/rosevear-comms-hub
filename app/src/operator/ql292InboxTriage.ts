import type { OrganizationId } from './ql191Organizations';
import { inboxChannels, type InboxChannel, type InboxDisposition, type InboxThread } from './ql192InboxFixtures';

export type TriageLane = 'all' | 'attention' | 'reply' | 'follow_up' | 'later';
export type TriageOwner = 'unassigned' | 'demo_desk' | 'demo_specialist';
export type TriageSlot = 'desk' | 'follow_up';
export type InboxView = 'all' | 'unread' | 'needs_reply' | 'follow_up';
export type InboxSort = 'attention' | 'subject' | 'channel';

export interface InboxTriageFilters {
  search: string;
  channel: InboxChannel | 'all';
  view: InboxView;
  lane: TriageLane;
  priority: 'all' | InboxThread['priority'];
  owner: 'all' | TriageOwner;
  status: 'all' | InboxDisposition;
  sort: InboxSort;
}

export interface InboxTriagePreset {
  version: 1;
  organizationId: OrganizationId;
  filters: InboxTriageFilters;
}

export type InboxTriagePresets = Readonly<Record<TriageSlot, InboxTriagePreset | null>>;

export const triageSlots = [
  { id: 'desk', label: 'Desk focus' },
  { id: 'follow_up', label: 'Follow-up review' }
] as const;

export const triageLanes = [
  { id: 'all', label: 'All work', description: 'Every synthetic conversation' },
  { id: 'attention', label: 'Priority now', description: 'High-priority active examples' },
  { id: 'reply', label: 'Needs response', description: 'Other reply-review examples' },
  { id: 'follow_up', label: 'Follow-up', description: 'Other flagged examples' },
  { id: 'later', label: 'Later / resolved', description: 'Everything else' }
] as const;

export const triageOwners = [
  { id: 'all', label: 'All demo owners' },
  { id: 'unassigned', label: 'Unassigned in demo' },
  { id: 'demo_desk', label: 'Demo desk' },
  { id: 'demo_specialist', label: 'Demo specialist' }
] as const;

/** Explicitly fictional ownership examples; never staff identities or live assignments. */
const fixtureOwners: Readonly<Record<string, TriageOwner>> = {
  'rd-sms': 'demo_desk', 'rd-missed': 'unassigned', 'rd-website': 'demo_specialist', 'rd-mms': 'demo_desk', 'rd-email': 'unassigned',
  'dnd-sms': 'demo_desk', 'dnd-voicemail': 'unassigned', 'dnd-web': 'demo_specialist', 'dnd-mms': 'demo_desk', 'dnd-internal': 'demo_specialist',
  'camp-sms': 'demo_desk', 'camp-voice': 'unassigned', 'camp-web': 'demo_specialist', 'camp-email': 'demo_desk', 'camp-internal': 'demo_specialist',
  'yw-sms': 'demo_desk', 'yw-voicemail': 'unassigned', 'yw-web': 'demo_specialist', 'yw-email': 'demo_desk', 'yw-internal': 'demo_specialist'
};

const statuses = ['all', 'new', 'needs_reply', 'waiting', 'resolved'] as const;
const views = ['all', 'unread', 'needs_reply', 'follow_up'] as const;
const priorities = ['all', 'high', 'normal'] as const;
const sorts = ['attention', 'subject', 'channel'] as const;

export function defaultInboxTriageFilters(): InboxTriageFilters {
  return { search: '', channel: 'all', view: 'all', lane: 'all', priority: 'all', owner: 'all', status: 'all', sort: 'attention' };
}

export function emptyInboxTriagePresets(): InboxTriagePresets { return { desk: null, follow_up: null }; }

export function demoOwnerForThread(thread: InboxThread): TriageOwner { return fixtureOwners[thread.id] ?? 'unassigned'; }

export function triageLaneForThread(thread: InboxThread, needsFollowUp = thread.needsFollowUp): Exclude<TriageLane, 'all'> {
  if (thread.priority === 'high' && thread.status !== 'resolved') return 'attention';
  if (thread.status === 'needs_reply') return 'reply';
  if (needsFollowUp) return 'follow_up';
  return 'later';
}

export function nextDemoAction(thread: InboxThread): string {
  if (thread.status === 'resolved') return 'Review closed example';
  if (thread.status === 'new') return 'Review new sample';
  if (thread.status === 'needs_reply') return 'Review reply options';
  return 'Review waiting status';
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}

/** Quoted phrases, unquoted AND terms and subject:/contact:/channel: field scoping. */
export function matchesTriageSearch(thread: InboxThread, query: string): boolean {
  const parts = [...query.matchAll(/(?:(subject|contact|channel):)?(?:"([^"]+)"|(\S+))/gi)];
  if (parts.length === 0) return !query.trim();
  const fields = {
    subject: normalize(thread.subject), contact: normalize(thread.contactLabel), channel: normalize(`${thread.channel} ${thread.sourceLabel}`),
    all: normalize([thread.contactLabel, thread.subject, thread.summary, thread.channel, thread.sourceLabel, thread.context, ...thread.events.map((event) => event.body)].join(' '))
  };
  return parts.every((part) => {
    const field = (part[1]?.toLowerCase() ?? 'all') as keyof typeof fields;
    const term = normalize(part[2] ?? part[3] ?? '');
    return term.length > 0 && fields[field].includes(term);
  });
}

export function filterInboxTriage(threads: readonly InboxThread[], organizationId: OrganizationId, filters: InboxTriageFilters,
  isUnread: (thread: InboxThread) => boolean = (thread) => thread.unread,
  isFollowUp: (thread: InboxThread) => boolean = (thread) => thread.needsFollowUp): InboxThread[] {
  const laneOrder = { attention: 0, reply: 1, follow_up: 2, later: 3 } as const;
  return threads.filter((thread) => thread.organizationId === organizationId &&
    (filters.channel === 'all' || thread.channel === filters.channel) &&
    (filters.status === 'all' || thread.status === filters.status) &&
    (filters.priority === 'all' || thread.priority === filters.priority) &&
    (filters.owner === 'all' || demoOwnerForThread(thread) === filters.owner) &&
    (filters.lane === 'all' || triageLaneForThread(thread, isFollowUp(thread)) === filters.lane) &&
    (filters.view === 'all' || (filters.view === 'unread' && isUnread(thread)) ||
      (filters.view === 'needs_reply' && thread.status === 'needs_reply') ||
      (filters.view === 'follow_up' && isFollowUp(thread))) &&
    matchesTriageSearch(thread, filters.search)
  ).sort((a, b) => {
    if (filters.sort === 'subject') return a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id);
    if (filters.sort === 'channel') return a.channel.localeCompare(b.channel) || a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id);
    return laneOrder[triageLaneForThread(a, isFollowUp(a))] - laneOrder[triageLaneForThread(b, isFollowUp(b))] ||
      Number(isUnread(b)) - Number(isUnread(a)) || a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id);
  });
}

export function isSafeInboxTriageFilters(value: unknown): value is InboxTriageFilters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return typeof input.search === 'string' && input.search.length <= 120 &&
    inboxChannels.some((entry) => entry.id === input.channel) && views.some((view) => view === input.view) &&
    triageLanes.some((lane) => lane.id === input.lane) && priorities.some((priority) => priority === input.priority) &&
    triageOwners.some((owner) => owner.id === input.owner) && statuses.some((status) => status === input.status) &&
    sorts.some((sort) => sort === input.sort);
}

/** Strict org and version checks prevent reusing a saved view in a different brand. */
export function recoverInboxTriagePreset(value: unknown, organizationId: OrganizationId): InboxTriageFilters | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const preset = value as Partial<InboxTriagePreset>;
  if (preset.version !== 1 || preset.organizationId !== organizationId || !isSafeInboxTriageFilters(preset.filters)) return null;
  return { ...preset.filters };
}
