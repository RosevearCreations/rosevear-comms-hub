// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { applyQueueAction, seedQueueForOrganization, taskVersion } from '../ql194WorkQueue';
import { ql294LaneCounts, ql294Shortcut } from '../ql294OperatorWorklist';

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function button(text: string, selector = 'button'): HTMLButtonElement {
  const found = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text));
  if (!found) throw Error(`Missing ${text} in ${selector}`);
  return found;
}
async function click(text: string, selector?: string) { await act(async () => button(text, selector).click()); }
async function choose(selector: string, value: string) {
  const input = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function shortcut(code: string, target?: Element) {
  await act(async () => (target ?? window).dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code, altKey: true, shiftKey: true })));
}

describe('QL-294 deterministic worklist and handoff boundaries', () => {
  it('classifies blocked, overdue, unassigned, completed and owner lanes for all four isolated business fixtures', () => {
    for (const company of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const) {
      const state = seedQueueForOrganization(company);
      expect(ql294LaneCounts(state, 'all')).toEqual({ all: 4, urgent: 2, mine: 0, unassigned: 1, blocked: 1, completed: 1 });
      expect(ql294LaneCounts(state, state.tasks[1].ownerId!)).toMatchObject({ mine: 1, urgent: 2 });
    }
  });

  it('prepares only local handoffs for a valid roster member, rejects foreign recipients and never changes a task owner', () => {
    const state = seedQueueForOrganization('rosiedazzlers');
    const bad = applyQueueAction('rosiedazzlers', state, { kind: 'handoff', taskId: 'rd-task-1', recipientId: 'yw-agent-dispatch', nextStep: 'verify-context' });
    expect(bad).toBe(state);
    expect(applyQueueAction('icamp', state, { kind: 'handoff', taskId: 'rd-task-1', recipientId: 'rd-agent-intake', nextStep: 'verify-context' })).toBe(state);
    expect(applyQueueAction('rosiedazzlers', state, { kind: 'handoff', taskId: 'rd-task-4', recipientId: 'rd-agent-intake', nextStep: 'verify-context' })).toBe(state);
    expect(applyQueueAction('rosiedazzlers', state, { kind: 'handoff', taskId: 'rd-task-1', recipientId: 'rd-agent-intake', nextStep: 'unknown' as never })).toBe(state);
    const prepared = applyQueueAction('rosiedazzlers', state, { kind: 'handoff', taskId: 'rd-task-1', recipientId: 'rd-agent-intake', nextStep: 'resolve-blocker' });
    expect(prepared.handoffs).toHaveLength(1);
    expect(prepared.handoffs[0].summary).toContain('Handoff preview for Demo intake coordinator');
    expect(prepared.handoffs[0].summary).not.toContain('YW');
    expect(prepared.tasks).toEqual(state.tasks);
    expect(prepared.receipts[0].description).toContain('UNSENT handoff preview');
    expect(state.handoffs).toHaveLength(0);
    const changed = applyQueueAction('rosiedazzlers', prepared, { kind: 'due', taskId: 'rd-task-1', due: 'soon' });
    expect(changed.handoffs[0].taskVersion).not.toBe(taskVersion(changed.tasks[0]));
    const refreshed = applyQueueAction('rosiedazzlers', changed, { kind: 'handoff', taskId: 'rd-task-1', recipientId: 'rd-agent-detailer', nextStep: 'owner-review' });
    expect(refreshed.handoffs).toHaveLength(1);
    expect(refreshed.handoffs[0].taskVersion).toBe(taskVersion(refreshed.tasks[0]));
  });

  it('ignores editable, composition and modified key combinations', () => {
    const input = document.createElement('input');
    document.body.append(input);
    const base = { code: 'KeyQ', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false, defaultPrevented: false, isComposing: false, target: null };
    expect(ql294Shortcut(base)).toBe('queue');
    expect(ql294Shortcut({ ...base, target: input })).toBeNull();
    expect(ql294Shortcut({ ...base, ctrlKey: true })).toBeNull();
    expect(ql294Shortcut({ ...base, defaultPrevented: true })).toBeNull();
    expect(ql294Shortcut({ ...base, isComposing: true })).toBeNull();
    input.remove();
  });
});

describe('QL-294 operator experience', () => {
  it('opens all six lane cards and filters tasks with deterministic urgency, owner and blocked states', async () => {
    await click('Assignments & follow-ups', '.ql172-nav-button');
    expect(host.querySelector('[data-ql294-release="ql294-assignment-handoff-shortcuts-v1"]')).not.toBeNull();
    expect(host.querySelectorAll('.ql294-lanes button')).toHaveLength(6);
    await click('Due / overdue', '.ql294-lanes button');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(2);
    await click('Waiting / blocked', '.ql294-lanes button');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
    await click('Needs owner', '.ql294-lanes button');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
    await click('Selected owner', '.ql294-lanes button');
    expect(host.textContent).toContain('Selected owner worklist: Demo intake coordinator');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
    await click('Completed', '.ql294-lanes button');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
  });

  it('makes an unsent preview, marks it stale on a task transition, refreshes it and resets across companies', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await click('Assignments & follow-ups', '.ql172-nav-button');
    await choose('#ql294-handoff-recipient', 'rd-agent-detailer');
    await choose('#ql294-handoff-step', 'prepare-response');
    await click('Prepare unsent handoff summary');
    expect(host.querySelector('.ql294-preview')?.textContent).toContain('UNSENT · Current handoff preview');
    expect(host.querySelector('.ql294-preview')?.textContent).toContain('Demo detail lead');
    await choose('#ql194-due', 'soon');
    expect(host.querySelector('.ql294-preview')?.textContent).toContain('OUTDATED · Refresh this preview');
    await click('Prepare unsent handoff summary');
    expect(host.querySelector('.ql294-preview')?.textContent).toContain('UNSENT · Current handoff preview');
    await click('iCamp', '.ql172-brand');
    expect(host.textContent).not.toContain('Demo detail lead');
    expect(host.querySelector('.ql294-preview')).toBeNull();
    expect(write).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses shortcuts for queue navigation, search, task focus and help but never hijacks text editing', async () => {
    await shortcut('KeyQ');
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Assignments & follow-ups');
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
    await shortcut('KeyF');
    expect(document.activeElement).toBe(host.querySelector('#ql194-search'));
    await shortcut('KeyJ', host.querySelector('#ql194-search')!);
    expect(document.activeElement).toBe(host.querySelector('#ql194-search'));
    await shortcut('KeyJ');
    expect(document.activeElement?.classList.contains('ql194-task')).toBe(true);
    await shortcut('KeyK');
    expect(host.querySelector('#ql194-help')).not.toBeNull();
    expect(host.querySelectorAll('.ql294-shortcuts kbd')).toHaveLength(4);
    await shortcut('KeyK');
    expect(host.querySelector('#ql194-help')).toBeNull();
  });

  it('retains visible focus, labelling, responsive and forced-colours safeguards', async () => {
    await click('Assignments & follow-ups', '.ql172-nav-button');
    for (const field of ['ql294-handoff-recipient', 'ql294-handoff-step']) expect(host.querySelector(`label[for="${field}"]`)).not.toBeNull();
    const css = readFileSync('src/operator/ql194-follow-up-queue.css', 'utf8');
    expect(css).toContain('max-width:650px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain(':focus-visible');
  });
});
