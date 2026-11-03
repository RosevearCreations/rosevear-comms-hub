// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { operatorOrganizations } from '../ql191Organizations';
import { ql322BandSources, ql322TrendModel } from '../ql302StatisticsTrend';

describe('QL-322 synthetic trend source and chart/table parity', () => {
  for (const company of operatorOrganizations) {
    it.each([7, 14, 28] as const)(`${company.name} %i-day window: every segment, source and stacked band reconciles`, days => {
      for (const segment of ['all', 'reply', 'call', 'intake', 'task'] as const) {
        const model = ql322TrendModel(company.id, days, segment);
        expect(model.total).toBe(model.source.length);
        expect(model.lastObservedAt).toBe(null);
        expect(model.feedFreshness).toBe('unknown');
        expect(model.rows.reduce((total, row) => total + row.count, 0)).toBe(model.total);
        for (const band of model.rows) {
          expect(Object.values(band.categories).reduce((total, count) => total + count, 0)).toBe(band.count);
          expect(ql322BandSources(company.id, days, segment, band.key)).toHaveLength(band.count);
        }
        expect(model.source.every(row => row.id.startsWith(company.id === 'rosiedazzlers' ? 'rd-' : company.id === 'devilndove' ? 'dnd-' : company.id === 'icamp' ? 'camp-' : 'yw-'))).toBe(true);
        if (days === 28) { expect(model.previous).toBe(null); expect(model.delta).toBe(null); }
        else { expect(model.previous).not.toBe(null); expect(model.delta).toBe(model.total - model.previous!); }
      }
    });
  }
  it('treats a known zero and an unavailable comparison as different values', () => {
    expect(ql322TrendModel('icamp', 7, 'task').total).toBe(0);
    expect(ql322TrendModel('icamp', 7, 'task').previous).toBe(0);
    expect(ql322TrendModel('icamp', 28, 'task').previous).toBe(null);
    expect(ql322BandSources('icamp', 7, 'reply', 'invalid-band')).toEqual([]);
  });
});

let host: HTMLDivElement; let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

describe('QL-322 chart, table, drill-through and freshness UI', () => {
  it('renders matching bar and table bands, focuses a source subset, and distinguishes stale unknown from known zero', async () => {
    const analytics = [...host.querySelectorAll('button')].find(button => button.textContent?.includes('Analytics'))!;
    await act(async () => analytics.click());
    const surface = host.querySelector('.ql322')!;
    expect(surface.querySelectorAll('.ql322-bar-button')).toHaveLength(4);
    expect(surface.querySelectorAll('.ql302-grid tbody tr')).toHaveLength(4);
    expect(surface.textContent).toContain('Last observed real event: Unknown / not available');
    expect(surface.textContent).toContain('Outside the 28-day sample coverage · not zero');
    expect(surface.querySelectorAll('.ql322-source tbody tr')).toHaveLength(4);
    await act(async () => surface.querySelector<HTMLButtonElement>('.ql322-bar-button')!.click());
    expect(surface.querySelectorAll('.ql322-source tbody tr')).toHaveLength(2);
    expect(surface.querySelectorAll('.ql322-bar-button[aria-pressed=true]')).toHaveLength(1);
    expect(surface.querySelectorAll('.ql322-selected-row')).toHaveLength(1);
    const selects = surface.querySelectorAll<HTMLSelectElement>('select');
    await act(async () => { selects[0].value = '7'; selects[0].dispatchEvent(new Event('change', { bubbles: true })); });
    expect(surface.querySelectorAll('.ql322-selected-row')).toHaveLength(0);
    await act(async () => { selects[1].value = 'task'; selects[1].dispatchEvent(new Event('change', { bubbles: true })); });
    expect(surface.querySelector('.ql322-empty')?.textContent).toContain('Known zero');
    expect(surface.querySelector('.ql302-readback')?.textContent).toContain('0 training events');
    expect(surface.querySelector('.ql322-source tbody')).toBeNull();
  });
  it('changes company without carrying another company source records', async () => {
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent?.includes('Analytics'))!.click());
    expect(host.querySelector('.ql322-source tbody')?.textContent).toContain('rd-reply');
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent?.includes('iCamp'))!.click());
    expect(host.querySelector('.ql322-source tbody')?.textContent).toContain('camp-reply');
    expect(host.querySelector('.ql322-source tbody')?.textContent).not.toContain('rd-reply');
  });
});
