// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql321ManagementCockpit } from '../Ql321ManagementCockpit';
import { operatorOrganizations } from '../ql191Organizations';
import { seedQueueForOrganization } from '../ql194WorkQueue';
import { ql321ManagementModel, ql321PreviewLinkAllowed, ql321VisibleRows } from '../ql321ManagementCockpit';

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
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

const cockpit = () => host.querySelector<HTMLElement>('.ql321-cockpit')!;
const button = (text: string, selector = 'button') => [...host.querySelectorAll<HTMLButtonElement>(selector)].find((entry) => entry.textContent?.includes(text) || entry.ariaLabel?.includes(text))!;
async function management() { await act(async () => button('Management', '.ql271-tabs button, .ql172-nav-button').click()); }

describe('QL-321 source-backed management cockpit', () => {
  it.each(operatorOrganizations)('reconciles two separate source ledgers for $name without cross-company rows', (organization) => {
    const model = ql321ManagementModel(organization.id, seedQueueForOrganization(organization.id));
    expect(model.state).toBe('ready');
    expect(model.counts).toEqual({ incidentCases: 4, blocked: 1, checkpoints: 1, tasks: 4, open: 2, waiting: 1, done: 1, overdue: 1, unassigned: 1, attention: 3 });
    expect(model.incidentRows).toHaveLength(4);
    expect(model.workloadRows).toHaveLength(4);
    expect(ql321VisibleRows(model, 'attention', 'all', 'all', '')).toHaveLength(3);
    expect(ql321VisibleRows(model, 'incidents', 'blocked_handoff', 'all', '')).toHaveLength(1);
    expect(ql321VisibleRows(model, 'workload', 'all', 'overdue', '')).toHaveLength(1);
    expect(ql321VisibleRows(model, 'workload', 'all', 'unassigned', '')).toHaveLength(1);
    expect(ql321VisibleRows(model, 'workload', 'all', 'open', '')).toHaveLength(2);
    expect(ql321VisibleRows(model, 'workload', 'all', 'waiting', '')).toHaveLength(1);
    expect(ql321VisibleRows(model, 'workload', 'all', 'done', '')).toHaveLength(1);
    expect(ql321VisibleRows(model, 'workload', 'all', 'all', 'none-matches')).toHaveLength(0);
    for (const other of operatorOrganizations.filter(item => item.id !== organization.id)) {
      expect(model.workloadRows.some(row => row.id === seedQueueForOrganization(other.id).tasks[0].id)).toBe(false);
    }
  });

  it('adapts to real in-tab QL-194 task status changes, instead of retaining hard-coded KPI totals', () => {
    const seed = seedQueueForOrganization('rosiedazzlers');
    const altered = { ...seed, tasks: seed.tasks.map(task => task.id === 'rd-task-1' ? { ...task, ownerId: 'rd-agent-intake', status: 'done' as const } : task) };
    const model = ql321ManagementModel('rosiedazzlers', altered);
    expect(model.counts.tasks).toBe(4);
    expect(model.counts.open).toBe(1);
    expect(model.counts.done).toBe(2);
    expect(model.counts.unassigned).toBe(0);
    expect(model.counts.overdue).toBe(0);
    expect(model.counts.attention).toBe(2);
  });

  it('fails closed on wrong company, fabricated owner or foreign conversation identifier', () => {
    const seed = seedQueueForOrganization('rosiedazzlers');
    expect(ql321ManagementModel('devilndove', seed).state).toBe('error');
    expect(ql321ManagementModel('not-a-company' as never, seed).state).toBe('error');
    expect(ql321ManagementModel('rosiedazzlers', { ...seed, tasks: [...seed.tasks, { ...seed.tasks[0], organizationId: 'yw' as const }] }).state).toBe('error');
    expect(ql321ManagementModel('rosiedazzlers', { ...seed, tasks: [{ ...seed.tasks[0], ownerId: 'yw-agent-dispatch' }] }).state).toBe('error');
    expect(ql321ManagementModel('rosiedazzlers', { ...seed, tasks: [{ ...seed.tasks[0], threadId: 'yw-sms' }] }).state).toBe('error');
    expect(ql321ManagementModel('rosiedazzlers', { ...seed, tasks: [seed.tasks[0], { ...seed.tasks[0] }] }).state).toBe('error');
  });

  it('renders live source-filtered rows, table and KPI drill-through with an explicit empty recovery', async () => {
    await management();
    expect(cockpit().getAttribute('data-ql321-cockpit')).toBe('rosiedazzlers');
    expect(cockpit().querySelectorAll('.ql321-metrics button')).toHaveLength(6);
    expect(cockpit().querySelectorAll('.ql321-attention-grid li')).toHaveLength(3);
    expect(cockpit().querySelectorAll('tbody tr')).toHaveLength(3);
    await act(async () => cockpit().querySelector<HTMLButtonElement>('button[aria-label*="overdue sample tasks"]')!.click());
    expect(cockpit().querySelectorAll('tbody tr')).toHaveLength(1);
    expect(cockpit().querySelector('tbody')?.textContent).toContain('rd-task-1');
    expect(cockpit().querySelector('tbody')?.textContent).toContain('UNASSIGNED');
    await act(async () => cockpit().querySelector<HTMLButtonElement>('button[aria-label*="incident scenarios"]')!.click());
    expect(cockpit().querySelectorAll('tbody tr')).toHaveLength(4);
    const select = cockpit().querySelector<HTMLSelectElement>('#ql321-incident-filter')!;
    await act(async () => { select.value = 'blocked_handoff'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(cockpit().querySelectorAll('tbody tr')).toHaveLength(1);
    const input = cockpit().querySelector<HTMLInputElement>('#ql321-search')!;
    await act(async () => { const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!; nativeSetter.call(input, 'not-a-real-scenario'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(cockpit().querySelectorAll('tbody tr')).toHaveLength(0);
    expect(cockpit().textContent).toContain('No fictional records match.');
    await act(async () => button('Reset this source view', '.ql321-empty button').click());
    expect(cockpit().querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('uses the exact QL-194 thread for drill-through and keeps the QL-301 source explorer available', async () => {
    await management();
    expect(host.querySelector('.ql321-historical-source .ql301')).toBeTruthy();
    await act(async () => cockpit().querySelector<HTMLButtonElement>('button[aria-label*="overdue sample tasks"]')!.click());
    await act(async () => cockpit().querySelector<HTMLButtonElement>('tbody button')!.click());
    expect(host.querySelector('.ql172-context h2')?.textContent).toContain('Assignments & follow-ups');
    expect(host.querySelector('.ql194-queue')?.textContent).toContain('missed booking');
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
  });

  it('changes company context without importing another company’s incidents or owners', async () => {
    await management();
    await act(async () => button('Devil n Dove', '.ql172-brand').click());
    expect(cockpit().getAttribute('data-ql321-cockpit')).toBe('devilndove');
    await act(async () => cockpit().querySelector<HTMLButtonElement>('button[aria-label*="incident scenarios"]')!.click());
    expect(cockpit().textContent).toContain('Custom pendant materials');
    expect(cockpit().textContent).not.toContain('Salt-stain interior enquiry');
    expect(cockpit().querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('treats preview roles as navigation presentation, never login authorization', async () => {
    expect(ql321PreviewLinkAllowed('operator', 'queue')).toBe(true);
    expect(ql321PreviewLinkAllowed('manager', 'guided_intake')).toBe(true);
    expect(ql321PreviewLinkAllowed('it_reviewer', 'queue')).toBe(false);
    expect(ql321PreviewLinkAllowed('it_reviewer', 'event_timeline')).toBe(true);
    await act(async () => root.unmount());
    const onNavigate = vi.fn();
    const onOpenQueue = vi.fn();
    root = createRoot(host);
    await act(async () => root.render(<Ql321ManagementCockpit organizationId="rosiedazzlers" queue={seedQueueForOrganization('rosiedazzlers')} rolePreview="it_reviewer" onNavigate={onNavigate} onOpenQueue={onOpenQueue} />));
    expect(cockpit().querySelectorAll('.ql321-attention-grid button:disabled')).toHaveLength(2);
    await act(async () => button('System Status and held proof', '.ql321-role-links button').click());
    expect(onNavigate).toHaveBeenCalledWith('system_status');
    expect(onOpenQueue).not.toHaveBeenCalled();
    expect(cockpit().textContent).toContain('not verified login permission');
  });

  it('documents accessible responsive layouts, urgency text, focus and safe local-only boundaries', async () => {
    await management();
    expect(cockpit().querySelector('table caption')?.textContent).toContain('Rosie Dazzlers');
    expect(cockpit().querySelectorAll('thead th[scope="col"]')).toHaveLength(6);
    expect(cockpit().querySelectorAll('tbody th[scope="row"]')).toHaveLength(3);
    expect(cockpit().textContent).toContain('No real SLA');
    expect(cockpit().textContent).toContain('Data provenance');
    const css = readFileSync('src/operator/ql321-management-cockpit.css', 'utf8');
    for (const requirement of ['max-width:1050px', 'max-width:750px', 'max-width:470px', 'min-height:44px', 'forced-colors:active', 'prefers-reduced-motion:reduce', ':focus-visible', 'overflow-x:auto']) expect(css).toContain(requirement);
    expect(window.localStorage.length).toBe(0);
  });
});
