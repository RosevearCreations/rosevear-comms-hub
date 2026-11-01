import type { MockFollowUpTask, MockQueueState } from './ql194WorkQueue';

export type Ql294Lane = 'all' | 'urgent' | 'mine' | 'unassigned' | 'blocked' | 'completed';

export const ql294Lanes: readonly { id: Ql294Lane; label: string; description: string }[] = [
  { id: 'all', label: 'All work', description: 'Every fictional assignment' },
  { id: 'urgent', label: 'Due / overdue', description: 'Open and waiting items due in illustrative today or overdue windows' },
  { id: 'mine', label: 'Selected owner', description: 'Work assigned to the chosen fictional operator' },
  { id: 'unassigned', label: 'Needs owner', description: 'Active work without a sample owner' },
  { id: 'blocked', label: 'Waiting / blocked', description: 'Examples paused for fictional review or a missing next step' },
  { id: 'completed', label: 'Completed', description: 'Completed demonstration items' }
];

export function ql294MatchesLane(task: MockFollowUpTask, lane: Ql294Lane, ownerId: string): boolean {
  switch (lane) {
    case 'all': return true;
    case 'urgent': return task.status !== 'done' && (task.due === 'today' || task.due === 'overdue');
    case 'mine': return ownerId !== 'all' && task.status !== 'done' && task.ownerId === ownerId;
    case 'unassigned': return task.status !== 'done' && task.ownerId === null;
    case 'blocked': return task.status === 'waiting';
    case 'completed': return task.status === 'done';
  }
}

export function ql294LaneCounts(state: MockQueueState, ownerId: string): Record<Ql294Lane, number> {
  const counts: Record<Ql294Lane, number> = { all: 0, urgent: 0, mine: 0, unassigned: 0, blocked: 0, completed: 0 };
  for (const task of state.tasks) {
    if (task.organizationId !== state.organizationId) continue;
    for (const lane of ql294Lanes) if (ql294MatchesLane(task, lane.id, ownerId)) counts[lane.id]++;
  }
  return counts;
}

export type Ql294Shortcut = 'queue' | 'search' | 'selection' | 'help' | null;

export function ql294Shortcut(event: Pick<KeyboardEvent, 'code' | 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'defaultPrevented' | 'isComposing' | 'target'>): Ql294Shortcut {
  if (event.defaultPrevented || event.isComposing || !event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return null;
  const target = event.target;
  if (typeof Element !== 'undefined' && target instanceof Element && target.closest('input, textarea, select, [contenteditable], [role="textbox"]')) return null;
  return ({ KeyQ: 'queue', KeyF: 'search', KeyJ: 'selection', KeyK: 'help' } as Record<string, Ql294Shortcut>)[event.code] ?? null;
}

export const ql294ShortcutHelp = [
  { keys: 'Alt + Shift + Q', action: 'Open assignment worklists from any workspace' },
  { keys: 'Alt + Shift + F', action: 'Focus assignment search when the queue is open' },
  { keys: 'Alt + Shift + J', action: 'Focus the first visible assignment' },
  { keys: 'Alt + Shift + K', action: 'Toggle assignment help and shortcut guidance' }
] as const;
