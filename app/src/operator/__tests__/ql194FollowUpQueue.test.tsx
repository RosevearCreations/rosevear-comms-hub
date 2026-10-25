// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { inboxForOrganization } from '../ql192InboxFixtures';
import type { OrganizationId } from '../ql191Organizations';
import { applyQueueAction, rosterForOrganization, seedQueueForOrganization, sortedQueueTasks } from '../ql194WorkQueue';

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

function buttonWith(label: string, selector = 'button'): HTMLButtonElement {
  const found = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((button) => button.textContent?.includes(label));
  if (!found) throw Error(`No button ${label} in ${selector}`);
  return found;
}

async function workspace(name: string) { await act(async () => buttonWith(name, '.ql172-nav-button').click()); }
async function company(name: string) { await act(async () => buttonWith(name, '.ql172-brand').click()); }
async function selectTask(name: string) { await act(async () => buttonWith(name, '.ql194-task').click()); }
async function setSelect(selector: string, value: string) {
  const select = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function search(text: string) {
  const input = host.querySelector<HTMLInputElement>('#ql194-search')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('QL-194 synthetic assignments and reducer boundaries', () => {
  it('has four distinct company-specific rosters and valid conversation-linked task fixtures', () => {
    const seen = new Set<string>();
    for (const organizationId of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const) {
      const roster = rosterForOrganization(organizationId);
      const queue = seedQueueForOrganization(organizationId);
      expect(roster).toHaveLength(3);
      expect(queue.tasks).toHaveLength(4);
      expect(roster.every((person) => person.organizationId === organizationId && person.label.startsWith('Demo'))).toBe(true);
      for (const task of queue.tasks) {
        expect(task.organizationId).toBe(organizationId);
        expect(seen.has(task.id)).toBe(false);
        seen.add(task.id);
        expect(inboxForOrganization(organizationId).some((thread) => thread.id === task.threadId)).toBe(true);
        expect(task.ownerId === null || roster.some((person) => person.id === task.ownerId)).toBe(true);
      }
    }
    expect(seen.size).toBe(16);
  });

  it('assigns, unassigns and records only in-memory receipt sequences without mutating fixtures', () => {
    const seed = seedQueueForOrganization('rosiedazzlers');
    const assigned = applyQueueAction('rosiedazzlers', seed, { kind: 'assign', taskId: 'rd-task-1', ownerId: 'rd-agent-detailer' });
    expect(seed.tasks[0].ownerId).toBeNull();
    expect(assigned.tasks[0].ownerId).toBe('rd-agent-detailer');
    expect(assigned.receipts[0].description).toContain('Demo detail lead');
    expect(assigned.receipts[0].sequence).toBe(1);
    expect(applyQueueAction('rosiedazzlers', assigned, { kind: 'assign', taskId: 'rd-task-1', ownerId: 'rd-agent-detailer' })).toBe(assigned);
    const cleared = applyQueueAction('rosiedazzlers', assigned, { kind: 'assign', taskId: 'rd-task-1', ownerId: null });
    expect(cleared.tasks[0].ownerId).toBeNull();
    expect(cleared.receipts.map((receipt) => receipt.sequence)).toEqual([1, 2]);
    expect(seedQueueForOrganization('rosiedazzlers').receipts).toEqual([]);
  });

  it('rejects cross-company scope, fabricated foreign owners and nonexistent thread links', () => {
    const seed = seedQueueForOrganization('rosiedazzlers');
    expect(applyQueueAction('yw', seed, { kind: 'assign', taskId: 'rd-task-1', ownerId: null })).toBe(seed);
    expect(applyQueueAction('rosiedazzlers', seed, { kind: 'assign', taskId: 'rd-task-1', ownerId: 'yw-agent-dispatch' })).toBe(seed);
    expect(applyQueueAction('rosiedazzlers', seed, { kind: 'status', taskId: 'yw-task-1', status: 'done' })).toBe(seed);
    expect(applyQueueAction('rosiedazzlers', seed, { kind: 'create', threadId: 'dnd-sms' })).toBe(seed);
    expect(applyQueueAction('rosiedazzlers', seed, { kind: 'create', threadId: 'invented-source' })).toBe(seed);
    expect(applyQueueAction('rosiedazzlers', seed, { kind: 'due', taskId: 'rd-task-1', due: 'tomorrow' as never })).toBe(seed);
  });

  it('creates one unassigned follow-up for an eligible unlinked thread and prevents duplicates', () => {
    const seed = seedQueueForOrganization('rosiedazzlers');
    const created = applyQueueAction('rosiedazzlers', seed, { kind: 'create', threadId: 'rd-mms' });
    expect(created.tasks).toHaveLength(5);
    expect(created.tasks[4]).toMatchObject({ id: 'rosiedazzlers-followup-1', organizationId: 'rosiedazzlers', threadId: 'rd-mms', ownerId: null, status: 'open', due: 'today' });
    expect(created.receipts[0].description).toContain('Condition photo question');
    expect(applyQueueAction('rosiedazzlers', created, { kind: 'create', threadId: 'rd-mms' })).toBe(created);
    expect(applyQueueAction('rosiedazzlers', created, { kind: 'create', threadId: 'rd-sms' })).toBe(created);
    expect(seed.tasks).toHaveLength(4);
  });

  it('supports complete, reopen, due and priority changes with stable task identity', () => {
    const seed = seedQueueForOrganization('icamp');
    const done = applyQueueAction('icamp', seed, { kind: 'status', taskId: 'camp-task-1', status: 'done' });
    const reopened = applyQueueAction('icamp', done, { kind: 'status', taskId: 'camp-task-1', status: 'open' });
    const delayed = applyQueueAction('icamp', reopened, { kind: 'due', taskId: 'camp-task-1', due: 'later' });
    const normal = applyQueueAction('icamp', delayed, { kind: 'priority', taskId: 'camp-task-1', priority: 'normal' });
    expect(normal.tasks[0]).toMatchObject({ id: 'camp-task-1', status: 'open', due: 'later', priority: 'normal' });
    expect(normal.receipts).toHaveLength(4);
    expect(sortedQueueTasks(normal.tasks).at(-1)?.status).toBe('done');
  });
});

describe('QL-194 operator assignment queue', () => {
  it('opens an explicitly disabled four-company queue with functional metrics and controls', async () => {
    await workspace('Assignments & follow-ups');
    expect(host.querySelector('.ql194-queue')?.getAttribute('data-ql194-release')).toBe('ql194-assignment-follow-up-queue-v1');
    expect(host.querySelector('.ql194-queue')?.getAttribute('data-organization')).toBe('rosiedazzlers');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(4);
    expect(host.textContent).toContain('DISABLED SYNTHETIC WORK QUEUE');
    expect(host.querySelectorAll('.ql194-disabled button:disabled')).toHaveLength(3);
    expect(host.querySelector('#ql194-assignee')).not.toBeNull();
    expect(host.querySelector('#ql194-status')).not.toBeNull();
    expect(host.querySelectorAll('.ql194-stats > div')).toHaveLength(4);
  });

  it('searches across source subjects and owner labels, with working filters and empty recovery', async () => {
    await workspace('Assignments & follow-ups');
    await search('ceramic');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
    await search('not-a-fixture');
    expect(host.querySelector('.ql194-empty')?.textContent).toContain('No sample follow-ups');
    await act(async () => buttonWith('Clear queue filters', '.ql194-empty button').click());
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(4);
    await act(async () => buttonWith('Unassigned', '.ql194-filters button').click());
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
    await act(async () => buttonWith('Done', '.ql194-filters button').click());
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
    await act(async () => buttonWith('Needs attention', '.ql194-filters button').click());
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(2);
    await act(async () => buttonWith('All follow-ups', '.ql194-filters button').click());
    await setSelect('#ql194-owner-filter', 'rd-agent-estimate');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(1);
  });

  it('updates selected owner, status, due and priority, with session-only receipt history', async () => {
    await workspace('Assignments & follow-ups');
    await setSelect('#ql194-assignee', 'rd-agent-detailer');
    expect(host.querySelector<HTMLSelectElement>('#ql194-assignee')?.value).toBe('rd-agent-detailer');
    expect(host.querySelector('.ql194-receipts')?.textContent).toContain('Assigned to Demo detail lead');
    await setSelect('#ql194-status', 'done');
    await setSelect('#ql194-due', 'later');
    await setSelect('#ql194-priority', 'normal');
    const detail = host.querySelector('.ql194-details')!;
    expect(detail.querySelectorAll('.ql194-receipts li')).toHaveLength(4);
    expect(detail.textContent).toContain('Changed sample status to done');
    expect(detail.textContent).toContain('Changed simulated due window to later');
    await setSelect('#ql194-status', 'open');
    expect(detail.querySelectorAll('.ql194-receipts li')).toHaveLength(5);
  });

  it('preserves in-memory queue edits while navigating within a company', async () => {
    await workspace('Assignments & follow-ups');
    await setSelect('#ql194-assignee', 'rd-agent-detailer');
    await workspace('Customer 360');
    await workspace('Assignments & follow-ups');
    await selectTask('Review missed booking question');
    expect(host.querySelector<HTMLSelectElement>('#ql194-assignee')?.value).toBe('rd-agent-detailer');
    expect(host.textContent).toContain('Assigned to Demo detail lead');
  });

  it('opens queue from inbox and creates a new follow-up for an unseeded synthetic MMS', async () => {
    await workspace('Unified inbox');
    await act(async () => buttonWith('Condition photo question', '.ql192-thread').click());
    await act(async () => buttonWith('Manage follow-up queue', '.ql192-detail-actions button').click());
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Assignments & follow-ups');
    expect(host.textContent).toContain('Create demo follow-up for this conversation');
    await act(async () => buttonWith('Create demo follow-up for this conversation', '.ql194-jump button').click());
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(5);
    expect(host.querySelector('.ql194-details h4')?.textContent).toContain('Condition photo question');
    expect(host.querySelector('.ql194-receipts')?.textContent).toContain('Created unassigned demo follow-up');
    await act(async () => buttonWith('Open source in unified inbox', '.ql194-navigation button').click());
    expect(host.querySelector('.ql192-detail-header h4')?.textContent).toContain('Condition photo question');
    await workspace('Assignments & follow-ups');
    expect(host.querySelectorAll('.ql194-task')).toHaveLength(5);
  });

  it('navigates from Customer 360 to an existing queued source, then back to its profile', async () => {
    await workspace('Customer 360');
    await act(async () => buttonWith('Manage follow-up: Interior salt-stain question', '.ql193-source button').click());
    expect(host.querySelector('.ql194-details h4')?.textContent).toContain('winter salt-stain reply');
    await act(async () => buttonWith('Open linked Customer 360', '.ql194-navigation button').click());
    expect(host.querySelector('.ql193-profile h4')?.textContent).toContain('Demo detailing customer A');
  });

  it('shows no customer profile for internal-only tasks while retaining source navigation', async () => {
    await company('YW');
    await workspace('Assignments & follow-ups');
    await selectTask('Review simulated fibre-site constraints');
    expect(host.querySelector('.ql194-navigation')?.textContent).toContain('Internal-only source');
    expect(host.querySelectorAll('.ql194-navigation button')).toHaveLength(1);
  });

  it('resets queue state on each business switch and prevents cross-business list leakage', async () => {
    await workspace('Assignments & follow-ups');
    await setSelect('#ql194-assignee', 'rd-agent-detailer');
    await company('iCamp');
    expect(host.querySelector('.ql194-queue')?.getAttribute('data-organization')).toBe('icamp');
    expect(host.textContent).toContain('Triage gate arrival inquiry');
    expect(host.textContent).not.toContain('Review missed booking question');
    await company('Rosie Dazzlers');
    expect(host.querySelector<HTMLSelectElement>('#ql194-assignee')?.value).toBe('');
    expect(host.querySelector('.ql194-receipts')?.textContent).toContain('Nothing changed');
  });

  it('makes no browser writes or fetches during task assignment, receipt review and navigation', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await workspace('Assignments & follow-ups');
    await setSelect('#ql194-assignee', 'rd-agent-detailer');
    await act(async () => buttonWith('Help', '.ql194-header button').click());
    expect(host.textContent).toContain('not actual dates');
    await company('iCamp');
    await setSelect('#ql194-status', 'waiting');
    expect(write).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('has labelled, keyboard-accessible and responsive high-contrast controls', async () => {
    await workspace('Assignments & follow-ups');
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
    for (const id of ['ql194-search', 'ql194-owner-filter', 'ql194-assignee', 'ql194-status', 'ql194-due', 'ql194-priority']) {
      expect(host.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
    const css = readFileSync('src/operator/ql194-follow-up-queue.css', 'utf8');
    expect(css).toContain('@media (max-width: 650px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain(':focus-visible');
  });
});
