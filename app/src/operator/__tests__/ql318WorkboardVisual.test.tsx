// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { applyQueueAction, rosterForOrganization, seedQueueForOrganization, sortedQueueTasks } from '../ql194WorkQueue';
import { ql294LaneCounts, ql294Shortcut } from '../ql294OperatorWorklist';
import { ql318ReviewGate, ql318TaskCard } from '../ql318Workboard';

const companies = ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const;

describe('QL-318 scoped workboard, history and freshness model', () => {
  for (const company of companies) {
    it(`${company}: maps real QL-294 queue order into company-only owner/due/severity/attention cards`, () => {
      const state = seedQueueForOrganization(company);
      const sorted = sortedQueueTasks(state.tasks);
      expect(sorted.map((task) => task.id)).toHaveLength(4);
      const cards = sorted.map((task) => ql318TaskCard(company, state, task.id)!);
      expect(cards.map((card) => card.attention)).toEqual(['NEEDS_OWNER', 'DUE_TODAY', 'BLOCKED', 'COMPLETED']);
      expect(cards[0]).toMatchObject({ owner: 'Unassigned', due: 'Overdue example', severity: 'High priority', history: [] });
      expect(cards[1].owner).toBe(rosterForOrganization(company)[0].label);
      expect(ql294LaneCounts(state, 'all')).toEqual({ all: 4, urgent: 2, mine: 0, unassigned: 1, blocked: 1, completed: 1 });
      for (const other of companies.filter((item) => item !== company)) {
        expect(ql318TaskCard(other, state, sorted[0].id)).toBeNull();
        expect(ql318ReviewGate(other, state, sorted[0].id).state).toBe('MISSING');
      }
    });

    it(`${company}: prevents stale handoff review after edit and reversal until fresh preview`, () => {
      const state = seedQueueForOrganization(company);
      const task = state.tasks[0];
      const owner = rosterForOrganization(company)[0];
      expect(ql318ReviewGate(company, state, task.id).state).toBe('MISSING');
      const prepared = applyQueueAction(company, state, { kind: 'handoff', taskId: task.id, recipientId: owner.id, nextStep: 'verify-context' });
      expect(ql318ReviewGate(company, prepared, task.id)).toMatchObject({ state: 'READY', receipt: { sequence: 1 } });
      expect(ql318ReviewGate(company, prepared, task.id).summary).toContain('Handoff preview for');
      const changed = applyQueueAction(company, prepared, { kind: 'due', taskId: task.id, due: 'soon' });
      expect(ql318ReviewGate(company, changed, task.id)).toMatchObject({ state: 'STALE', summary: null, reviewKey: null });
      const reversed = applyQueueAction(company, changed, { kind: 'due', taskId: task.id, due: 'overdue' });
      expect(reversed.tasks[0]).toEqual(state.tasks[0]);
      expect(ql318ReviewGate(company, reversed, task.id).state).toBe('STALE');
      const receiptHistory = ql318TaskCard(company, reversed, task.id)!.history;
      expect(receiptHistory.map((receipt) => receipt.sequence)).toEqual([1, 2, 3]);
      const refreshed = applyQueueAction(company, reversed, { kind: 'handoff', taskId: task.id, recipientId: owner.id, nextStep: 'owner-review' });
      expect(ql318ReviewGate(company, refreshed, task.id)).toMatchObject({ state: 'READY', receipt: { sequence: 4 } });
      expect(ql318ReviewGate(company, refreshed, task.id).reviewKey).not.toBe(ql318ReviewGate(company, prepared, task.id).reviewKey);
      expect(refreshed.tasks).toEqual(state.tasks);
    });
  }

  it('fails closed for corrupt recipient, foreign receipt, completed task and foreign queue', () => {
    const base = seedQueueForOrganization('rosiedazzlers');
    const prepared = applyQueueAction('rosiedazzlers', base, { kind: 'handoff', taskId: 'rd-task-1', recipientId: 'rd-agent-intake', nextStep: 'owner-review' });
    const poisoned = { ...prepared, handoffs: [{ ...prepared.handoffs[0], recipientId: 'yw-agent-dispatch' }] };
    expect(ql318ReviewGate('rosiedazzlers', poisoned, 'rd-task-1').state).toBe('STALE');
    const forged = { ...prepared, receipts: [{ ...prepared.receipts[0], organizationId: 'yw' as const }] };
    expect(ql318ReviewGate('rosiedazzlers', forged, 'rd-task-1').state).toBe('STALE');
    const completed = applyQueueAction('rosiedazzlers', prepared, { kind: 'status', taskId: 'rd-task-1', status: 'done' });
    expect(ql318ReviewGate('rosiedazzlers', completed, 'rd-task-1').state).toBe('STALE');
    expect(ql318TaskCard('icamp', prepared, 'rd-task-1')).toBeNull();
    expect(ql318ReviewGate('icamp', prepared, 'rd-task-1').summary).toBeNull();
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); window.localStorage.clear(); vi.restoreAllMocks(); });
function button(text: string, selector = 'button') {
  const item = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((candidate) => candidate.textContent?.includes(text));
  if (!item) throw Error(`Missing ${text}`);
  return item;
}
async function click(text: string, selector?: string) { await act(async () => button(text, selector).click()); }
async function choose(selector: string, value: string) {
  const item = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { item.value = value; item.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-318 live-in-screen disabled assignment and handoff review', () => {
  it('presents consistent attention cards, history and source-scoped selected snapshot', async () => {
    await click('Assignments & follow-ups', '.ql172-nav-button');
    expect(host.querySelector('[data-ql318-release="workboard-history-safe-review-v1"]')).not.toBeNull();
    expect([...host.querySelectorAll('.ql194-task')].map((item) => item.getAttribute('data-attention'))).toEqual(['NEEDS_OWNER', 'DUE_TODAY', 'BLOCKED', 'COMPLETED']);
    expect(host.querySelectorAll('.ql318-selected-summary>div')).toHaveLength(4);
    expect(host.querySelector('.ql318-selected-summary')?.textContent).toContain('Needs fictional owner');
    expect(host.querySelector<HTMLButtonElement>('.ql318-review-actions button')?.disabled).toBe(true);
    await choose('#ql194-assignee', 'rd-agent-detailer');
    expect(host.querySelector('.ql194-receipts')?.textContent).toContain('Assigned to Demo detail lead');
    expect(host.querySelector('.ql318-selected-summary')?.textContent).toContain('Demo detail lead');
  });

  it('blocks in-tab review on stale content, even after reverting the due window, and never contacts anyone', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await click('Assignments & follow-ups', '.ql172-nav-button');
    await choose('#ql294-handoff-recipient', 'rd-agent-detailer');
    await click('Prepare unsent handoff summary');
    const reviewButton = host.querySelector<HTMLButtonElement>('.ql318-review-actions button')!;
    expect(reviewButton.disabled).toBe(false);
    await click('Review current UNSENT summary in this tab');
    expect(host.querySelector('.ql318-review-readback')?.textContent).toContain('READ LOCALLY · UNSENT · NOT AN APPROVAL');
    await choose('#ql194-due', 'later');
    expect(reviewButton.disabled).toBe(true);
    expect(host.querySelector('.ql318-review-readback')).toBeNull();
    expect(host.querySelector('.ql294-preview.stale')?.textContent).toContain('Old summary hidden');
    expect(host.querySelector('.ql294-preview.stale')?.textContent).not.toContain('Handoff preview for Demo detail lead');
    await choose('#ql194-due', 'overdue');
    expect(reviewButton.disabled).toBe(true);
    await click('Prepare unsent handoff summary');
    expect(reviewButton.disabled).toBe(false);
    await click('Review current UNSENT summary in this tab');
    expect(host.querySelector('.ql318-review-readback')?.textContent).toContain('Handoff preview for Demo detail lead');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('.ql318-review-readback')).toBeNull();
    expect(host.textContent).not.toContain('Demo detail lead');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('preserves QL-294 keyboard safety outside editable controls and responsive help', async () => {
    await click('Assignments & follow-ups', '.ql172-nav-button');
    await click('Help', '.ql194-header button');
    expect(host.querySelector('#ql194-help')?.textContent).toContain('If any task field changes');
    expect(host.querySelectorAll('.ql294-shortcuts kbd')).toHaveLength(4);
    for (const tag of ['input', 'select', 'textarea']) {
      const editable = document.createElement(tag);
      host.append(editable);
      expect(ql294Shortcut({ code: 'KeyK', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false,
        defaultPrevented: false, isComposing: false, target: editable })).toBeNull();
      editable.remove();
    }
    const css = readFileSync('src/operator/ql318-workboard-visual.css', 'utf8');
    expect(css).toContain('max-width:620px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain(':focus-visible');
  });
});
