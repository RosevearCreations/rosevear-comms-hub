// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { reportForOrganization } from '../ql198Reporting';
import { applyQueueAction, seedQueueForOrganization } from '../ql194WorkQueue';

let root: Root;
let host: HTMLDivElement;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string) { const control = [...host.querySelectorAll('button')].find((node) => node.textContent?.includes(text)); if (!control) throw new Error(`Missing ${text}`); await act(async () => control.click()); }

describe('QL-198 fictional reporting', () => {
  it('isolates all four companies and computes totals from the current session queue', () => {
    for (const id of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const) {
      const queue = seedQueueForOrganization(id);
      const report = reportForOrganization(id, queue, 'channel')!;
      expect(report.threads).toBe(5);
      expect(report.rows.reduce((total, row) => total + row.count, 0)).toBe(report.threads);
      expect(report.followUps).toBe(4);
      expect(reportForOrganization(id === 'yw' ? 'icamp' : 'yw', queue, 'status')).toBeNull();
      const changed = applyQueueAction(id, queue, { kind: 'status', taskId: queue.tasks[0].id, status: 'done' });
      expect(reportForOrganization(id, changed, 'status')!.completedTasks).toBe(report.completedTasks + 1);
      expect(reportForOrganization(id, changed, 'status')!.receiptCount).toBe(1);
    }
  });
  it('navigates between reports, breakdowns and operational workspaces without exporting data', async () => {
    await click('Reporting centre');
    expect(host.querySelector('[data-ql198-release="ql198-synthetic-reporting-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('DEMO ONLY');
    await click('By status');
    expect(host.textContent).toContain('Needs reply');
    await click('ⓘ Help');
    expect(host.textContent).toContain('switching companies or reloading resets edits');
    await click('Review follow-up queue');
    expect(host.textContent).toContain('Assignments & follow-ups');
    await click('Reporting centre');
    await click('iCamp');
    expect(host.querySelector('[data-organization="icamp"][data-ql198-release]')).not.toBeNull();
  });
});
