/**
 * QL-174: brand-safe triage projection of QL-173's checked-in synthetic fixtures.
 * Transitions are immutable in-memory simulations only. This module deliberately
 * has no database, localStorage, provider, event or authorization dependency.
 */
import type { BrandId, ConversationStatus, TaskPriority } from '../types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';

export const QL174_QUEUE_ORDER = ['all', 'new', 'needs_reply', 'awaiting_customer', 'quote', 'follow_up'] as const;
export type Ql174Queue = typeof QL174_QUEUE_ORDER[number];
export type Ql174WorkQueue = Exclude<Ql174Queue, 'all'>;
export type Ql174Assignment = 'unassigned' | 'brand_demo_operator';
export type Ql174Sort = 'recent' | 'priority';
export type Ql174PriorityFilter = 'all' | TaskPriority;
export type Ql174AssignmentFilter = 'all' | Ql174Assignment;

export type Ql174Simulation = Readonly<{
  queue: Ql174WorkQueue;
  assignedTo: Ql174Assignment;
}>;
export type Ql174Simulations = Readonly<Record<string, Ql174Simulation>>;

export type Ql174TriageRow = {
  id: string;
  brandId: BrandId;
  contactLabel: string;
  subject: string;
  summary: string;
  tags: readonly string[];
  queue: Ql174WorkQueue;
  hasFollowUp: boolean;
  priority: TaskPriority;
  operatorLabel: string;
  assignedTo: Ql174Assignment;
  channel: string;
  lastActivityAt: string;
  provenanceLabel: string;
  draftState: 'UNSENT_SIMULATED' | 'NO_DRAFT';
  simulationOnly: true;
};

export type Ql174Filters = {
  queue: Ql174Queue;
  query: string;
  priority: Ql174PriorityFilter;
  assignment: Ql174AssignmentFilter;
  sort: Ql174Sort;
};

export const QL174_DEFAULT_FILTERS: Ql174Filters = {
  queue: 'all', query: '', priority: 'all', assignment: 'all', sort: 'recent'
};

const allowedBrands: readonly BrandId[] = ['rosiedazzlers', 'devilndove'];
const allowedPriorities: readonly TaskPriority[] = ['low', 'normal', 'high'];
const allowedAssignments: readonly Ql174Assignment[] = ['unassigned', 'brand_demo_operator'];
const workQueues = QL174_QUEUE_ORDER.filter((queue): queue is Ql174WorkQueue => queue !== 'all');
const priorityScore: Record<TaskPriority, number> = { high: 3, normal: 2, low: 1 };

export function ql174InitialQueue(status: ConversationStatus): Ql174WorkQueue | null {
  switch (status) {
    case 'new': return 'new';
    case 'needs_reply': return 'needs_reply';
    case 'waiting_on_customer':
    case 'needs_photos':
    case 'needs_reference_photos': return 'awaiting_customer';
    case 'quote_needed':
    case 'quote_sent': return 'quote';
    default: return null; // closed/approved/archived rows are not reopened in a preview
  }
}

function validMigration(result: Ql173Migration, brandId: BrandId): boolean {
  return allowedBrands.includes(brandId) && result.verified && validateQl173CanonicalSnapshot(result.snapshot).length === 0;
}

export function getQl174BrandRows(result: Ql173Migration, brandId: BrandId, simulations: Ql174Simulations = {}): Ql174TriageRow[] {
  if (!validMigration(result, brandId)) return [];
  const contacts = new Map(result.snapshot.contacts.map(row => [row.id, row]));
  const openFollowUps = new Set(result.snapshot.followUpTasks
    .filter(row => row.brandId === brandId && row.status === 'open' && row.conversationId)
    .map(row => row.conversationId));
  const drafts = new Set(result.snapshot.drafts.filter(row => row.brandId === brandId && row.state === 'UNSENT_SIMULATED').map(row => row.conversationId));

  return result.snapshot.conversations.flatMap(row => {
    if (row.brandId !== brandId) return [];
    const contact = contacts.get(row.contactId);
    if (contact?.primaryBrand !== brandId) return [];
    const originalQueue = ql174InitialQueue(row.status);
    if (!originalQueue) return [];
    const simulated = simulations[row.id];
    const simulationValid = !!simulated && workQueues.includes(simulated.queue) && allowedAssignments.includes(simulated.assignedTo);
    const assignedTo = simulationValid ? simulated.assignedTo : 'unassigned';
    const queue = simulationValid ? simulated.queue : originalQueue;
    return [{
      id: row.id, brandId, contactLabel: contact.name, subject: row.subject, summary: row.summary,
      tags: [...row.tags], queue, hasFollowUp: queue === 'follow_up' || openFollowUps.has(row.id),
      priority: allowedPriorities.includes(row.priority) ? row.priority : 'normal',
      operatorLabel: assignedTo === 'brand_demo_operator'
        ? (brandId === 'rosiedazzlers' ? 'Rosie demo operator' : 'Devil n Dove demo operator')
        : 'Unassigned',
      assignedTo, channel: row.sourceChannel, lastActivityAt: row.lastActivityAt,
      provenanceLabel: `${row.provenance.sourceSetVersion} · ${row.provenance.sourceId}`,
      draftState: drafts.has(row.id) ? 'UNSENT_SIMULATED' : 'NO_DRAFT', simulationOnly: true
    }];
  });
}

export function filterQl174Rows(rows: readonly Ql174TriageRow[], filters: Ql174Filters): Ql174TriageRow[] {
  const query = filters.query.trim().toLocaleLowerCase().slice(0, 100);
  return rows.filter(row => {
    if (filters.queue === 'follow_up' && !row.hasFollowUp) return false;
    if (filters.queue !== 'all' && filters.queue !== 'follow_up' && row.queue !== filters.queue) return false;
    if (filters.priority !== 'all' && row.priority !== filters.priority) return false;
    if (filters.assignment !== 'all' && row.assignedTo !== filters.assignment) return false;
    if (!query) return true;
    return [row.subject, row.summary, row.contactLabel, row.channel, ...row.tags].join(' ').toLocaleLowerCase().includes(query);
  }).sort((a, b) => {
    const priorityOrder = priorityScore[b.priority] - priorityScore[a.priority];
    const recentOrder = Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
    return (filters.sort === 'priority' ? priorityOrder || recentOrder : recentOrder || priorityOrder) || a.id.localeCompare(b.id);
  });
}

export function countQl174Queues(rows: readonly Ql174TriageRow[]): Record<Ql174Queue, number> {
  const counts = { all: rows.length, new: 0, needs_reply: 0, awaiting_customer: 0, quote: 0, follow_up: 0 };
  for (const row of rows) {
    counts[row.queue]++;
    if (row.hasFollowUp && row.queue !== 'follow_up') counts.follow_up++;
  }
  return counts;
}

export function simulateQl174Triage(
  result: Ql173Migration,
  brandId: BrandId,
  previous: Ql174Simulations,
  conversationId: string,
  nextQueue: Ql174WorkQueue,
  assignedTo: Ql174Assignment
): Ql174Simulations {
  // Reject unknown IDs, cross-brand IDs, future/unsafe transitions and malformed
  // labels even when called directly from JavaScript outside the typed UI.
  if (!workQueues.includes(nextQueue) || !allowedAssignments.includes(assignedTo)) return previous;
  const candidate = getQl174BrandRows(result, brandId, previous).find(row => row.id === conversationId);
  if (!candidate) return previous;
  return { ...previous, [conversationId]: { queue: nextQueue, assignedTo } };
}
