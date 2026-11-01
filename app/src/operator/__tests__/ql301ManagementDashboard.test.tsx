// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { operatorOrganizations } from '../ql191Organizations';
import { dashboardQueues } from '../ql191DashboardData';
import { ql301FilterIncidents, ql301Incidents, ql301Summary } from '../ql301ManagementDashboard';

describe('QL-301 company-scoped synthetic workload and incident cards', () => {
  for (const organization of operatorOrganizations) {
    it(`${organization.name} derives one-to-one work records from existing scoped fixtures`, () => {
      const incidents = ql301Incidents(organization.id);
      expect(incidents.map(item => item.id)).toEqual(dashboardQueues[organization.id].map(item => item.id));
      expect(new Set(incidents.map(item => item.id)).size).toBe(4);
      expect(ql301Summary(incidents)).toEqual({ total: 4, review: 1, blocked: 1, checkpoints: 1, queued: 1, longestSyntheticAgeHours: 24 });
      expect(incidents.every(item => item.desk.includes('sample') && item.source.length > 0)).toBe(true);
      for (const other of operatorOrganizations.filter(candidate => candidate.id !== organization.id)) {
        expect(incidents.some(item => item.id === dashboardQueues[other.id][0].id)).toBe(false);
      }
      expect(ql301FilterIncidents(incidents, 'blocked_handoff').map(item => item.destination)).toEqual(['event_timeline']);
      expect(ql301FilterIncidents(incidents, 'checkpoint_due').map(item => item.destination)).toEqual(['guided_intake']);
    });
  }
  it('handles an empty synthetic data set without inventing totals', () => {
    expect(ql301Summary([])).toEqual({ total: 0, review: 0, blocked: 0, checkpoints: 0, queued: 0, longestSyntheticAgeHours: 0 });
    expect(ql301FilterIncidents([], 'all')).toEqual([]);
  });
});

let host: HTMLDivElement; let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear(); host = document.createElement('div'); document.body.append(host);
  root = createRoot(host); await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

function button(label: string) { const result = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(label)); if (!result) throw new Error(`Missing ${label}`); return result; }

describe('QL-301 management dashboard interactions', () => {
  it('filters visible cards and navigates to a relevant preview without a real handoff', async () => {
    await act(async () => button('Management').click());
    expect(host.querySelector('[data-ql301-release]')).not.toBeNull();
    expect(host.querySelectorAll('.ql301-cases li')).toHaveLength(4);
    expect(host.querySelector('.ql301-metrics')?.textContent).toContain('24h');
    expect(host.textContent).toContain('Live assignments 0');
    const select = host.querySelector<HTMLSelectElement>('.ql301-controls select')!;
    await act(async () => { select.value = 'blocked_handoff'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.querySelectorAll('.ql301-cases li')).toHaveLength(1);
    expect(host.querySelector('.ql301-controls [role="status"]')?.textContent).toContain('Showing 1 of 4');
    await act(async () => button('Open event timeline preview').click());
    expect(host.querySelector('[data-ql297-release]')).not.toBeNull();
  });
  it('switches companies without leaking cards from the previous business', async () => {
    await act(async () => button('Management').click());
    expect(host.querySelector('.ql301')?.textContent).toContain('Salt-stain interior enquiry');
    await act(async () => button('Devil n Dove').click());
    expect(host.querySelector('.ql301')?.textContent).toContain('Custom pendant materials');
    expect(host.querySelector('.ql301')?.textContent).not.toContain('Salt-stain interior enquiry');
    expect(host.querySelectorAll('.ql301-cases li')).toHaveLength(4);
  });
  it('shows the same labeled synthetic status cards inside System Status', async () => {
    await act(async () => button('System status').click());
    expect(host.querySelector('.ql301 h3')?.textContent).toContain('Rosie Dazzlers');
    expect(host.querySelector('.ql301 footer')?.textContent).toContain('Real incidents 0');
  });
  it('supports responsive layout and keyboard/high-contrast focus', () => {
    const css = readFileSync('src/operator/ql301-management-dashboard.css', 'utf8');
    expect(css).toContain('max-width:430px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain(':focus-visible');
  });
});
