// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { operatorOrganizations } from '../ql191Organizations';
import { dashboardQueues } from '../ql191DashboardData';
import { ql302FixtureEvents, ql302Trend } from '../ql302StatisticsTrend';

describe('QL-302 provenance and deterministic time-window aggregation', () => {
  for (const organization of operatorOrganizations) {
    it(`${organization.name} uses only its own existing fictional source records`, () => {
      const events = ql302FixtureEvents(organization.id);
      expect(events.map(item => item.id)).toEqual(dashboardQueues[organization.id].map(item => item.id));
      expect(ql302Trend(events, 7, 'all').total).toBe(2);
      expect(ql302Trend(events, 14, 'all').total).toBe(3);
      const result = ql302Trend(events, 28, 'all');
      expect(result.total).toBe(4);
      expect(result.rows.map(row => row.count)).toEqual([2, 1, 1, 0]);
      expect(result.rows.reduce((sum, row) => sum + row.count, 0)).toBe(result.total);
      expect(result.rows.every(row => Object.values(row.categories).reduce((a, b) => a + b, 0) === row.count)).toBe(true);
      expect(result.liveEvents).toBe(0);
      for (const other of operatorOrganizations.filter(candidate => candidate.id !== organization.id))
        expect(events.some(item => item.id === dashboardQueues[other.id][0].id)).toBe(false);
    });
  }
  it('preserves chart/table parity across every window and segment, including empty cohorts', () => {
    const events = ql302FixtureEvents('icamp');
    for (const days of [7, 14, 28] as const) for (const segment of ['all', 'reply', 'call', 'intake', 'task'] as const) {
      const result = ql302Trend(events, days, segment);
      expect(result.rows.reduce((sum, row) => sum + row.count, 0)).toBe(result.total);
      expect(result.rows).toHaveLength(days / 7);
      expect(result.maxCount).toBeGreaterThanOrEqual(1);
    }
    expect(ql302Trend(events, 7, 'task').total).toBe(0);
    expect(ql302Trend([], 28, 'all')).toEqual({ rows: expect.arrayContaining([]), total: 0, sourceItems: 0, maxCount: 1, liveEvents: 0 });
    expect(ql302Trend([{ id: 'bad', category: 'reply', fictionalDaysAgo: -5 }], 28, 'all').total).toBe(0);
  });
});

let host: HTMLDivElement; let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
function button(label: string) { const found = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(label)); if (!found) throw new Error(`Missing ${label}`); return found; }

describe('QL-302 accessible analytics explorer', () => {
  it('renders chart/table matching counts, source explanations and a no-live-feed statement', async () => {
    await act(async () => button('Analytics').click());
    expect(host.querySelector('[data-ql302-release]')).not.toBeNull();
    expect(host.querySelectorAll('.ql302-bar-row')).toHaveLength(4);
    expect(host.querySelectorAll('.ql302 tbody tr')).toHaveLength(4);
    expect(host.querySelector('.ql302 tfoot')?.textContent).toContain('4');
    expect(host.textContent).toContain('no feed connected or queried');
    const range = host.querySelectorAll<HTMLSelectElement>('.ql302 select')[0];
    await act(async () => { range.value = '7'; range.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.querySelectorAll('.ql302-bar-row')).toHaveLength(1);
    expect(host.querySelector('.ql302 tfoot')?.textContent).toContain('2');
    const segment = host.querySelectorAll<HTMLSelectElement>('.ql302 select')[1];
    await act(async () => { segment.value = 'task'; segment.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.querySelector('.ql302 tfoot')?.textContent).toContain('0');
    expect(host.querySelector('.ql302-readback')?.textContent).toContain('0 training events');
  });
  it('does not carry another company records into the selected company view', async () => {
    await act(async () => button('Analytics').click());
    expect(host.querySelector('.ql302 h3')?.textContent).toContain('Rosie Dazzlers');
    await act(async () => button('iCamp').click());
    expect(host.querySelector('.ql302 h3')?.textContent).toContain('iCamp');
    expect(host.querySelector('.ql302-readback')?.textContent).toContain('iCamp');
  });
  it('provides mobile reflow, high-contrast and reduced-motion rules', () => {
    const css = readFileSync('src/operator/ql302-statistics-trend.css', 'utf8');
    expect(css).toContain('max-width:560px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain(':focus-visible');
  });
});
