/**
 * QL-178: replayable internal task and follow-up simulator.
 * Every event exists in screen memory only. Canonical QL-173 fixtures remain
 * untouched; no reminder, actual escalation, approval or hold-closure exists.
 */
import type { BrandId, TaskPriority } from '../types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';
import { redactQl176Draft } from './ql176ConversationTimeline';
import { getQl177BrandIntakes } from './ql177BrandIntakeHandoff';

export const QL178_DEMO_CLOCK = '2026-10-23T18:00:00.000Z' as const;
export const QL178_MAX_EVENTS = 40;
export type Ql178Assignment = 'unassigned' | 'brand_demo_operator' | 'brand_demo_reviewer';
export type Ql178WorkflowState = 'open' | 'waiting_on_information' | 'blocked_authorization' | 'escalation_review';
export type Ql178DueWindow = 'unscheduled' | 'past_demo_shift' | 'next_demo_shift' | 'later_demo_shift';
export type Ql178DueClass = 'unscheduled' | 'overdue' | 'due_soon' | 'later';
export type Ql178Action = 'assignment' | 'priority' | 'due' | 'state' | 'note';
export type Ql178Filter = 'all' | Ql178DueClass | 'waiting' | 'blocked' | 'escalated';

export type Ql178Event = Readonly<{
  sequence: number;
  field: Ql178Action;
  value: string;
  mode: 'SIMULATED_ONLY';
}>;
export type Ql178TaskOverlay = Readonly<{
  brandId: BrandId;
  source: 'LOCAL_SCREEN_ONLY';
  history: readonly Ql178Event[];
}>;
export type Ql178Overlays = Readonly<Record<string, Ql178TaskOverlay>>;
export type Ql178TaskRow = Readonly<{
  id: string;
  brandId: BrandId;
  conversationId: string;
  contactId: string;
  subject: string;
  contactLabel: string;
  taskTitle: string;
  source: 'CANONICAL_OPEN_TASK' | 'DERIVED_PREVIEW_ONLY';
  sourceTaskId: string | null;
  sourceLabel: string;
  linkedIntakeId: string | null;
  mockHandoffId: string;
  assignedTo: Ql178Assignment;
  priority: TaskPriority;
  dueWindow: Ql178DueWindow;
  dueAt: string | null;
  dueClass: Ql178DueClass;
  state: Ql178WorkflowState;
  note: string;
  history: readonly Ql178Event[];
  syntheticOnly: true;
  ownerDecision: 'NOT_REQUESTED_NOT_GRANTED';
}>;

const brands: readonly BrandId[] = ['rosiedazzlers', 'devilndove'];
export const QL178_ASSIGNMENTS: readonly Ql178Assignment[] = ['unassigned', 'brand_demo_operator', 'brand_demo_reviewer'];
export const QL178_PRIORITIES: readonly TaskPriority[] = ['low', 'normal', 'high'];
export const QL178_DUE_WINDOWS: readonly Ql178DueWindow[] = ['unscheduled', 'past_demo_shift', 'next_demo_shift', 'later_demo_shift'];
export const QL178_STATES: readonly Ql178WorkflowState[] = ['open', 'waiting_on_information', 'blocked_authorization', 'escalation_review'];
export const QL178_FILTERS: readonly Ql178Filter[] = ['all', 'overdue', 'due_soon', 'later', 'unscheduled', 'waiting', 'blocked', 'escalated'];

const DAY_MS = 86_400_000;
const dueOffsets: Readonly<Record<Ql178DueWindow, number | null>> = {
  unscheduled: null, past_demo_shift: -DAY_MS, next_demo_shift: 4 * 60 * 60 * 1000, later_demo_shift: 2 * DAY_MS
};
const priorityScores: Readonly<Record<TaskPriority, number>> = { high: 3, normal: 2, low: 1 };

export function getQl178DueState(window: Ql178DueWindow): { dueAt: string | null; dueClass: Ql178DueClass } {
  const offset = dueOffsets[window];
  if (offset === undefined || offset === null) return { dueAt: null, dueClass: 'unscheduled' };
  const now = Date.parse(QL178_DEMO_CLOCK);
  const at = now + offset;
  return { dueAt: new Date(at).toISOString(), dueClass: at < now ? 'overdue' : at - now <= DAY_MS ? 'due_soon' : 'later' };
}

function validMigration(result: Ql173Migration, brandId: BrandId): boolean {
  return brands.includes(brandId) && result.verified && validateQl173CanonicalSnapshot(result.snapshot).length === 0;
}

function acceptedValue(field: Ql178Action, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (field === 'assignment') return QL178_ASSIGNMENTS.includes(value as Ql178Assignment);
  if (field === 'priority') return QL178_PRIORITIES.includes(value as TaskPriority);
  if (field === 'due') return QL178_DUE_WINDOWS.includes(value as Ql178DueWindow);
  if (field === 'state') return QL178_STATES.includes(value as Ql178WorkflowState);
  return field === 'note' && value.length <= 800 && redactQl176Draft(value) === value;
}

/** Reconstruct, never trust, simulated state from a validated event history. */
export function replayQl178History(
  brandId: BrandId, baselinePriority: TaskPriority, entry: Ql178TaskOverlay | undefined
): Pick<Ql178TaskRow, 'assignedTo' | 'priority' | 'dueWindow' | 'state' | 'note' | 'history'> {
  const initial = { assignedTo: 'unassigned' as Ql178Assignment, priority: baselinePriority,
    dueWindow: 'unscheduled' as Ql178DueWindow, state: 'open' as Ql178WorkflowState, note: '', history: [] as readonly Ql178Event[] };
  if (!entry || entry.brandId !== brandId || entry.source !== 'LOCAL_SCREEN_ONLY' ||
    !Array.isArray(entry.history) || entry.history.length > QL178_MAX_EVENTS) return initial;
  if (entry.history.some((event, index) => !event || event.sequence !== index + 1 || event.mode !== 'SIMULATED_ONLY' ||
    !['assignment', 'priority', 'due', 'state', 'note'].includes(event.field) || !acceptedValue(event.field, event.value))) return initial;

  let state = initial;
  for (const event of entry.history) {
    switch (event.field) {
      case 'assignment': state = { ...state, assignedTo: event.value as Ql178Assignment }; break;
      case 'priority': state = { ...state, priority: event.value as TaskPriority }; break;
      case 'due': state = { ...state, dueWindow: event.value as Ql178DueWindow }; break;
      case 'state': state = { ...state, state: event.value as Ql178WorkflowState }; break;
      case 'note': state = { ...state, note: event.value }; break;
    }
  }
  return { ...state, history: entry.history.map(event => ({ ...event })) };
}

export function getQl178BrandTasks(result: Ql173Migration, brandId: BrandId, overlays: Ql178Overlays = {}): Ql178TaskRow[] {
  if (!validMigration(result, brandId)) return [];
  const snapshot = result.snapshot;
  const intakes = new Map(getQl177BrandIntakes(result, brandId).map(row => [row.conversationId, row]));
  const contacts = new Map(snapshot.contacts.filter(row => row.primaryBrand === brandId).map(row => [row.id, row]));

  return snapshot.conversations.flatMap(conversation => {
    if (conversation.brandId !== brandId) return [];
    const contact = contacts.get(conversation.contactId);
    const intake = intakes.get(conversation.id);
    if (!contact || !intake) return [];
    const original = snapshot.followUpTasks.find(task => task.brandId === brandId && task.conversationId === conversation.id && task.contactId === contact.id && task.status === 'open');
    const id = original?.id ?? `ql178-suggested-task:${conversation.id}`;
    const state = replayQl178History(brandId, original?.priority ?? conversation.priority, overlays[id]);
    const due = getQl178DueState(state.dueWindow);
    return [{
      id, brandId, conversationId: conversation.id, contactId: contact.id, subject: conversation.subject,
      contactLabel: contact.name, taskTitle: original?.title ?? `Review sample inquiry: ${conversation.subject}`,
      source: original ? 'CANONICAL_OPEN_TASK' as const : 'DERIVED_PREVIEW_ONLY' as const,
      sourceTaskId: original?.id ?? null,
      sourceLabel: `${original?.provenance.sourceSetVersion ?? conversation.provenance.sourceSetVersion} · ${original?.provenance.sourceId ?? conversation.provenance.sourceId}`,
      linkedIntakeId: intake.linkedIntakeId, mockHandoffId: intake.handoffId,
      ...state, ...due, syntheticOnly: true as const, ownerDecision: 'NOT_REQUESTED_NOT_GRANTED' as const
    }];
  }).sort((a, b) => a.subject.localeCompare(b.subject) || a.id.localeCompare(b.id));
}

export function filterQl178Tasks(rows: readonly Ql178TaskRow[], filter: Ql178Filter): Ql178TaskRow[] {
  if (!QL178_FILTERS.includes(filter)) return [];
  return rows.filter(row => {
    if (filter === 'all') return true;
    if (filter === 'waiting') return row.state === 'waiting_on_information';
    if (filter === 'blocked') return row.state === 'blocked_authorization';
    if (filter === 'escalated') return row.state === 'escalation_review';
    return row.dueClass === filter;
  }).sort((a, b) => {
    const dueScore = (row: Ql178TaskRow) => row.dueAt ? Date.parse(row.dueAt) : Number.POSITIVE_INFINITY;
    return dueScore(a) - dueScore(b) || priorityScores[b.priority] - priorityScores[a.priority] || a.id.localeCompare(b.id);
  });
}

export function simulateQl178Task(
  result: Ql173Migration, brandId: BrandId, previous: Ql178Overlays, taskId: string,
  operation: Ql178Action | 'reset', value?: string
): Ql178Overlays {
  const original = getQl178BrandTasks(result, brandId).find(row => row.id === taskId);
  if (!original) return previous;
  if (operation === 'reset') { const next = { ...previous }; delete next[taskId]; return next; }
  const safeValue = operation === 'note' && typeof value === 'string' ? redactQl176Draft(value) : value;
  if (!['assignment', 'priority', 'due', 'state', 'note'].includes(operation) || !acceptedValue(operation as Ql178Action, safeValue)) return previous;
  const existing = previous[taskId];
  const current = replayQl178History(brandId, original.priority, existing);
  // Refuse mutation of forged overlay history instead of silently appending to an attacker-created state.
  if (existing && (current.history.length !== existing.history?.length)) return previous;
  // Typing one note should produce one replay event, not exhaust the bounded
  // history after 40 keystrokes and leave the input stuck mid-sentence.
  const lastEvent = current.history.at(-1);
  if (operation === 'note' && lastEvent?.field === 'note') {
    return { ...previous, [taskId]: { brandId, source: 'LOCAL_SCREEN_ONLY', history: [
      ...current.history.slice(0, -1), { ...lastEvent, value: safeValue! }
    ] } };
  }
  if (current.history.length >= QL178_MAX_EVENTS) return previous;
  const event: Ql178Event = { sequence: current.history.length + 1, field: operation as Ql178Action, value: safeValue!, mode: 'SIMULATED_ONLY' };
  return { ...previous, [taskId]: { brandId, source: 'LOCAL_SCREEN_ONLY', history: [...current.history, event] } };
}
