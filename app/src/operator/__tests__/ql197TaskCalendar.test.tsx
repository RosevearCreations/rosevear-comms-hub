// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { applyQueueAction, seedQueueForOrganization } from '../ql194WorkQueue';
import { calendarTasksForOrganization, demoWeekDates, taskCalendarDate, toggleDemoReminder } from '../ql197TaskCalendar';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const item = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((button) => button.textContent?.includes(text)); if (!item) throw Error(`Missing ${text}`); await act(async () => item.click()); }
async function changeSelect(selector: string, value: string) { const item = host.querySelector<HTMLSelectElement>(selector)!; await act(async () => { item.value = value; item.dispatchEvent(new Event('change',{bubbles:true})); }); }

describe('QL-197 calendar invariants', () => {
  it('maps all four company queues to deterministic fictional dates without cross-tenant reads', () => {
    for (const id of ['rosiedazzlers','devilndove','icamp','yw'] as const) {
      const state = seedQueueForOrganization(id); const tasks = calendarTasksForOrganization(id,state);
      expect(tasks).toHaveLength(4); expect(calendarTasksForOrganization(id === 'yw' ? 'icamp' : 'yw',state)).toEqual([]);
      expect(tasks.map(taskCalendarDate)).toEqual(['2026-10-25','2026-10-26','2026-10-28','2026-11-02']);
    }
    expect(demoWeekDates(-1)).toHaveLength(7);
    expect(demoWeekDates(0)[0]).toBe('2026-10-26');
    expect(demoWeekDates(1)[0]).toBe('2026-11-02');
    expect(demoWeekDates(2)).toEqual([]);
  });
  it('only flags active tasks from the same queue; done and foreign task IDs are no-ops', () => {
    const queue = seedQueueForOrganization('rosiedazzlers'); const empty = new Set<string>();
    expect(toggleDemoReminder('yw',queue,empty,'rd-task-1')).toBe(empty);
    expect(toggleDemoReminder('rosiedazzlers',queue,empty,'yw-task-1')).toBe(empty);
    expect(toggleDemoReminder('rosiedazzlers',queue,empty,'rd-task-4')).toBe(empty);
    const enabled = toggleDemoReminder('rosiedazzlers',queue,empty,'rd-task-1');
    expect(enabled.has('rd-task-1')).toBe(true);
    expect(toggleDemoReminder('rosiedazzlers',queue,enabled,'rd-task-1').has('rd-task-1')).toBe(false);
    const changed = applyQueueAction('rosiedazzlers',queue,{kind:'due',taskId:'rd-task-1',due:'later'});
    expect(taskCalendarDate(changed.tasks[0])).toBe('2026-11-02');
  });
});

describe('QL-197 operator task calendar', () => {
  it('renders a functional fixed demo week and session-only reminder control', async () => {
    await click('Tasks & calendar','.ql172-nav-button');
    expect(host.querySelector('[data-ql197-release="ql197-tasks-reminders-calendar-v1"]')).not.toBeNull();
    expect(host.querySelectorAll('.ql197-day')).toHaveLength(7);
    expect(host.textContent).toContain('Review winter salt-stain reply');
    await click('Next sample week'); expect(host.textContent).toContain('Nov 2');
    await click('Reset week');
    await click('Set local reminder flag'); expect(host.textContent).toContain('Reminder example marked');
    expect(host.querySelectorAll('.ql197-disabled button:disabled')).toHaveLength(3);
  });
  it('edits the shared queue bucket and resets tenant reminder flags on company switch', async () => {
    await click('Tasks & calendar','.ql172-nav-button');
    await changeSelect('#ql197-due','later');
    expect(host.querySelector('.ql197-demo-date')?.textContent).toContain('2026-11-02');
    await click('Set local reminder flag');
    await click('Manage in follow-up queue');
    expect(host.textContent).toContain('Later');
    await click('Tasks & calendar','.ql172-nav-button');
    expect(host.querySelector('.ql197-reminder-result')?.textContent).toContain('marked');
    await click('iCamp','.ql172-brand');
    expect(host.textContent).toContain('Triage gate arrival inquiry');
    expect(host.querySelector('.ql197-reminder-result')?.textContent).toContain('No active');
  });
});
