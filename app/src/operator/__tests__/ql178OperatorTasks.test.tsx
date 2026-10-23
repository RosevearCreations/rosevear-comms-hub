// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql178OperatorTaskSimulation } from '../Ql178OperatorTaskSimulation';
import {
  QL178_DEMO_CLOCK, QL178_MAX_EVENTS, filterQl178Tasks, getQl178BrandTasks,
  getQl178DueState, replayQl178History, simulateQl178Task, type Ql178Overlays
} from '../ql178OperatorTasks';

const migration = migrateQl173SyntheticFixtures();

describe('QL-178 deterministic, brand-isolated operator task model', () => {
  it('projects six verified task links from QL-173 and QL-177 with two original open tasks and four derived suggestions', () => {
    expect(migration.verified).toBe(true);
    const rosie = getQl178BrandTasks(migration, 'rosiedazzlers');
    const devil = getQl178BrandTasks(migration, 'devilndove');
    expect(rosie).toHaveLength(3);
    expect(devil).toHaveLength(3);
    const all = [...rosie, ...devil];
    expect(all.filter(row => row.source === 'CANONICAL_OPEN_TASK')).toHaveLength(2);
    expect(all.filter(row => row.source === 'DERIVED_PREVIEW_ONLY')).toHaveLength(4);
    expect(new Set(all.map(row => row.id)).size).toBe(6);
    expect(all.every(row => row.sourceLabel && row.mockHandoffId.includes(row.conversationId) && row.syntheticOnly)).toBe(true);
    expect(all.every(row => row.ownerDecision === 'NOT_REQUESTED_NOT_GRANTED')).toBe(true);
    expect(rosie.find(row => row.sourceTaskId)?.taskTitle).toBe('Request interior photos before quote');
    expect(devil.find(row => row.sourceTaskId)?.taskTitle).toBe('Confirm personalization text and deadline');
    expect(rosie.every(row => row.brandId === 'rosiedazzlers' && !row.subject.includes('Maker story'))).toBe(true);
    expect(devil.every(row => row.brandId === 'devilndove' && !row.subject.includes('Ceramic quote'))).toBe(true);
  });

  it('uses a pinned demo clock to classify overdue, due soon, later and unscheduled consistently', () => {
    expect(QL178_DEMO_CLOCK).toBe('2026-10-23T18:00:00.000Z');
    expect(getQl178DueState('unscheduled')).toEqual({ dueAt: null, dueClass: 'unscheduled' });
    expect(getQl178DueState('past_demo_shift')).toEqual({ dueAt: '2026-10-22T18:00:00.000Z', dueClass: 'overdue' });
    expect(getQl178DueState('next_demo_shift')).toEqual({ dueAt: '2026-10-23T22:00:00.000Z', dueClass: 'due_soon' });
    expect(getQl178DueState('later_demo_shift')).toEqual({ dueAt: '2026-10-25T18:00:00.000Z', dueClass: 'later' });
  });

  it('replays assignment, priority, deadline, waiting and handoff note changes without mutating pinned tasks', () => {
    const row = getQl178BrandTasks(migration, 'rosiedazzlers')[0];
    const original = JSON.stringify(migration.snapshot);
    let overlay: Ql178Overlays = {};
    const steps = [
      ['assignment', 'brand_demo_operator'], ['priority', 'high'], ['due', 'past_demo_shift'],
      ['state', 'waiting_on_information'], ['note', 'Review sample info · 519-555-0101 sample@example.ca']
    ] as const;
    for (const [field, value] of steps) overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, row.id, field, value);
    const result = getQl178BrandTasks(migration, 'rosiedazzlers', overlay).find(task => task.id === row.id)!;
    expect(result).toMatchObject({ assignedTo: 'brand_demo_operator', priority: 'high', dueClass: 'overdue', state: 'waiting_on_information' });
    expect(result.note).toContain('[REDACTED PHONE]');
    expect(result.note).toContain('[REDACTED EMAIL]');
    expect(result.note).not.toContain('519-555-0101');
    expect(result.history).toHaveLength(steps.length);
    expect(result.history.map(event => event.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(result.history.every(event => event.mode === 'SIMULATED_ONLY')).toBe(true);
    expect(replayQl178History('rosiedazzlers', row.priority, overlay[row.id])).toMatchObject({ assignedTo: 'brand_demo_operator', dueWindow: 'past_demo_shift' });
    expect(JSON.stringify(migration.snapshot)).toBe(original);
    expect(simulateQl178Task(migration, 'rosiedazzlers', overlay, row.id, 'reset')[row.id]).toBeUndefined();
  });

  it('models an explicitly blocked authorization and synthetic supervisor review, never a real owner decision', () => {
    const row = getQl178BrandTasks(migration, 'devilndove')[0];
    const blocked = simulateQl178Task(migration, 'devilndove', {}, row.id, 'state', 'blocked_authorization');
    expect(getQl178BrandTasks(migration, 'devilndove', blocked)[0]).toMatchObject({ state: 'blocked_authorization', ownerDecision: 'NOT_REQUESTED_NOT_GRANTED' });
    const escalated = simulateQl178Task(migration, 'devilndove', blocked, row.id, 'state', 'escalation_review');
    expect(getQl178BrandTasks(migration, 'devilndove', escalated)[0]).toMatchObject({ state: 'escalation_review', ownerDecision: 'NOT_REQUESTED_NOT_GRANTED' });
    expect(getQl178BrandTasks(migration, 'rosiedazzlers', escalated).every(task => task.state === 'open')).toBe(true);
  });

  it('filters overdue, due soon, waiting, blocked and escalated tasks, sorting deterministically', () => {
    const rows = getQl178BrandTasks(migration, 'rosiedazzlers');
    const [first, second, third] = rows;
    let overlay: Ql178Overlays = {};
    overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, first.id, 'due', 'past_demo_shift');
    overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, first.id, 'state', 'escalation_review');
    overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, second.id, 'due', 'next_demo_shift');
    overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, second.id, 'state', 'waiting_on_information');
    overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, third.id, 'state', 'blocked_authorization');
    const viewed = getQl178BrandTasks(migration, 'rosiedazzlers', overlay);
    expect(filterQl178Tasks(viewed, 'overdue').map(task => task.id)).toEqual([first.id]);
    expect(filterQl178Tasks(viewed, 'due_soon').map(task => task.id)).toEqual([second.id]);
    expect(filterQl178Tasks(viewed, 'waiting').map(task => task.id)).toEqual([second.id]);
    expect(filterQl178Tasks(viewed, 'blocked').map(task => task.id)).toEqual([third.id]);
    expect(filterQl178Tasks(viewed, 'escalated').map(task => task.id)).toEqual([first.id]);
    expect(filterQl178Tasks(viewed, 'all').map(task => task.id)).toEqual([first.id, second.id, third.id]);
    expect(filterQl178Tasks(viewed, 'bogus' as 'all')).toEqual([]);
  });

  it('rejects unauthorized completion/approval, forged histories, invalid assignees, wrong brand and failed provenance', () => {
    const rosieId = getQl178BrandTasks(migration, 'rosiedazzlers')[0].id;
    const devilId = getQl178BrandTasks(migration, 'devilndove')[0].id;
    const previous: Ql178Overlays = {};
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, devilId, 'state', 'open')).toBe(previous);
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, 'unknown', 'due', 'past_demo_shift')).toBe(previous);
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, rosieId, 'state', 'done')).toBe(previous);
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, rosieId, 'state', 'approved')).toBe(previous);
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, rosieId, 'state', 'hold_closed')).toBe(previous);
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, rosieId, 'assignment', 'real_owner')).toBe(previous);
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, rosieId, 'priority', 'urgent')).toBe(previous);
    expect(simulateQl178Task(migration, 'rosiedazzlers', previous, rosieId, 'send' as 'state', 'anything')).toBe(previous);
    expect(simulateQl178Task({ ...migration, verified: false }, 'rosiedazzlers', previous, rosieId, 'due', 'past_demo_shift')).toBe(previous);
    const bad = structuredClone(migration);
    bad.snapshot.messages[0].humanApproved = true;
    expect(getQl178BrandTasks(bad, 'rosiedazzlers')).toEqual([]);
    const fake = { [rosieId]: { brandId: 'rosiedazzlers' as const, source: 'LOCAL_SCREEN_ONLY' as const,
      history: [{ sequence: 1, field: 'state' as const, value: 'approved', mode: 'SIMULATED_ONLY' as const }] } };
    expect(getQl178BrandTasks(migration, 'rosiedazzlers', fake)[0].state).toBe('open');
    expect(simulateQl178Task(migration, 'rosiedazzlers', fake, rosieId, 'priority', 'high')).toBe(fake);
    expect(replayQl178History('devilndove', 'normal', fake[rosieId]).history).toHaveLength(0);
  });

  it('limits replay depth to a bounded number of safe events', () => {
    const id = getQl178BrandTasks(migration, 'rosiedazzlers')[0].id;
    let overlay: Ql178Overlays = {};
    for (let i = 0; i < QL178_MAX_EVENTS; i++) overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, id, 'priority', i % 2 ? 'high' : 'low');
    expect(overlay[id].history).toHaveLength(QL178_MAX_EVENTS);
    expect(simulateQl178Task(migration, 'rosiedazzlers', overlay, id, 'priority', 'normal')).toBe(overlay);
  });

  it('coalesces consecutive note keystrokes so longer synthetic notes remain editable', () => {
    const id = getQl178BrandTasks(migration, 'rosiedazzlers')[0].id;
    let overlay: Ql178Overlays = {};
    for (const text of ['S', 'Sa', 'Sam', 'Sample note']) overlay = simulateQl178Task(migration, 'rosiedazzlers', overlay, id, 'note', text);
    expect(overlay[id].history).toHaveLength(1);
    expect(getQl178BrandTasks(migration, 'rosiedazzlers', overlay)[0].note).toBe('Sample note');
    expect(overlay[id].history[0].sequence).toBe(1);
  });
});

let root: Root;
let host: HTMLDivElement;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql178OperatorTaskSimulation brandId="rosiedazzlers" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function click(label: string) {
  const node = [...host.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.includes(label));
  if (!node) throw new Error(`Missing button: ${label}`);
  await act(async () => node.click());
}

async function choose(id: string, value: string) {
  const node = host.querySelector<HTMLSelectElement>(`#ql178-${id}`);
  if (!node) throw new Error(`Missing select: ${id}`);
  await act(async () => { node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-178 task simulation operator UI', () => {
  it('renders three brand-scoped tasks and explicitly prohibits sends, completions, approvals and reminders', async () => {
    expect(host.querySelectorAll('.ql178-task')).toHaveLength(3);
    expect(host.textContent).toContain('DISABLED PREVIEW · NO REMINDERS');
    expect(host.textContent).toContain('NO REMINDERS · NO CUSTOMER SEND · NO TASK COMPLETION · NO OWNER APPROVAL · NO HOLD CLOSURE');
    expect(host.textContent).toContain(QL178_DEMO_CLOCK);
    await click('Request interior photos before quote');
    expect(host.textContent).toContain('Pinned source task');
    expect(host.textContent).toContain('ql177-internal-review:');
    expect(host.querySelector('button[aria-label="Send reminder"]')).toBeNull();
  });

  it('stages overdue/waiting/escalation and reset in memory with no network or browser storage writes', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network disabled'));
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await choose('assignment', 'brand_demo_operator');
    await choose('priority', 'high');
    await choose('due', 'past_demo_shift');
    await choose('state', 'escalation_review');
    expect(host.textContent).toContain('OVERDUE');
    expect(host.textContent).toContain('Demo supervisor review only');
    expect(host.textContent).toContain('In-memory event replay (4)');
    await click('Reset mock task journey');
    expect(host.textContent).toContain('In-memory event replay (0)');
    expect(host.textContent).toContain('original checked-in synthetic task or suggested task was not modified');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('filters due/overdue queues and isolates staged state when brand switches', async () => {
    await choose('due', 'past_demo_shift');
    await choose('filter', 'overdue');
    expect(host.querySelectorAll('.ql178-task')).toHaveLength(1);
    await act(async () => root.render(<Ql178OperatorTaskSimulation brandId="devilndove" />));
    expect(host.querySelectorAll('.ql178-task')).toHaveLength(3);
    expect(host.textContent).toContain('Devil n Dove follow-ups');
    expect(host.textContent).not.toContain('Ceramic quote follow-up');
    expect(host.textContent).toContain('All screen-only task edits and mock escalations were discarded');
    await act(async () => root.render(<Ql178OperatorTaskSimulation brandId="rosiedazzlers" />));
    expect(host.querySelectorAll('.ql178-task')).toHaveLength(3);
    expect(host.textContent).not.toContain('OVERDUE');
  });

  it('preserves labelled inputs, accessible status feedback and mobile / keyboard / forced-colours affordances', () => {
    expect(host.querySelector('label[for="ql178-assignment"]')).not.toBeNull();
    expect(host.querySelector('label[for="ql178-due"]')).not.toBeNull();
    expect(host.querySelector('label[for="ql178-note"]')).not.toBeNull();
    expect(host.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    const css = readFileSync('src/operator/ql178-operator-tasks.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 730px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('min-height: 44px');
  });
});
