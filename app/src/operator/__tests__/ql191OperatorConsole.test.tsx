// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { dashboardQueues } from '../ql191DashboardData';
import { findOperatorOrganization, initialOperatorOrganization, operatorOrganizations } from '../ql191Organizations';

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
  const target = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((button) => button.textContent?.includes(label));
  if (!target) throw new Error(`No ${label} in ${selector}`);
  return target;
}

async function chooseOrganization(label: string) {
  await act(async () => buttonWith(label, '.ql172-brand').click());
}

async function chooseWorkspace(label: string) {
  await act(async () => buttonWith(label, '.ql172-nav-button').click());
}

describe('QL-191 organization registry', () => {
  it('keeps four stable, unique organization scopes and preserves the two existing BrandId mappings', () => {
    expect(operatorOrganizations.map((org) => org.id)).toEqual(['rosiedazzlers', 'devilndove', 'icamp', 'yw']);
    expect(new Set(operatorOrganizations.map((org) => org.id)).size).toBe(4);
    expect(findOperatorOrganization('rosiedazzlers')?.legacyBrandId).toBe('rosiedazzlers');
    expect(findOperatorOrganization('devilndove')?.legacyBrandId).toBe('devilndove');
    expect(findOperatorOrganization('icamp')?.legacyBrandId).toBeNull();
    expect(findOperatorOrganization('yw')?.tenantModel).toBe('multi-tenant-planned');
    expect(initialOperatorOrganization('invalid')).toBe(operatorOrganizations[0]);
  });

  it('has separate, fabricated and unique queue items for each company', () => {
    const allItems = Object.values(dashboardQueues).flat();
    expect(allItems).toHaveLength(16);
    expect(new Set(allItems.map((item) => item.id)).size).toBe(16);
    for (const [orgId, items] of Object.entries(dashboardQueues)) {
      expect(items).toHaveLength(4);
      expect(items.map((item) => item.id).every((id) => id.startsWith(orgId === 'rosiedazzlers' ? 'rd-' : orgId === 'devilndove' ? 'dnd-' : orgId === 'icamp' ? 'camp-' : 'yw-'))).toBe(true);
    }
  });
});

describe('QL-191 operator console', () => {
  it('opens the dashboard by default with four companies, accessible navigation and an explicit synthetic banner', () => {
    expect(host.querySelectorAll('.ql172-brand')).toHaveLength(4);
    expect(host.querySelector('.ql172-shell')?.getAttribute('data-ql191-release')).toBe('ql191-four-organization-console-v2');
    expect(host.querySelectorAll('.ql172-nav-button')).toHaveLength(24);
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Dashboard');
    expect(host.textContent).toContain('Demonstration mode');
    expect(host.textContent).toContain('No live connections or real customer records');
    expect(host.querySelectorAll('.ql191-metric')).toHaveLength(4);
    expect(host.querySelectorAll('.ql191-queue-entry')).toHaveLength(4);
    expect(host.textContent).toContain('12 held');
  });

  it('filters activities interactively without leaving the selected company context', async () => {
    await act(async () => buttonWith('Call events', '.ql191-filter').click());
    expect(buttonWith('Call events', '.ql191-filter').getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('.ql191-queue-entry')).toHaveLength(1);
    expect(host.textContent).toContain('Unanswered detailing request');
    await act(async () => buttonWith('All activity', '.ql191-filter').click());
    expect(host.querySelectorAll('.ql191-queue-entry')).toHaveLength(4);
  });

  it('selects a sample queue item and exposes its detail without sending anything', async () => {
    await act(async () => buttonWith('SUV detailing estimate', '.ql191-queue-entry').click());
    expect(host.querySelector('.ql191-queue-detail')?.textContent).toContain('Synthetic vehicle condition');
    expect(host.querySelector('.ql191-queue-detail')?.textContent).toContain('No customer action is available');
  });

  it('switches to iCamp without exposing Rosie/Devil queue items or offering real tenant access', async () => {
    await chooseOrganization('iCamp');
    expect(host.querySelector('.ql172-context')?.textContent).toContain('iCamp');
    expect(host.textContent).toContain('Campsite availability question');
    expect(host.textContent).not.toContain('Salt-stain interior enquiry');
    expect(host.textContent).not.toContain('Custom pendant materials');
    expect(host.textContent).toContain('Individual campground/company tenants');
    expect(host.textContent).toContain('Not connected');
    expect(buttonWith('iCamp', '.ql172-brand').getAttribute('aria-pressed')).toBe('true');
  });

  it('switches to YW without leaking iCamp examples', async () => {
    await chooseOrganization('iCamp');
    await chooseOrganization('YW');
    expect(host.textContent).toContain('Garbage collection and sticker request');
    expect(host.textContent).toContain('Septic service scheduling question');
    expect(host.textContent).not.toContain('Campsite availability question');
    expect(host.querySelector('.ql172-shell')?.getAttribute('data-organization')).toBe('yw');
  });

  it('navigates from the dashboard shortcut to an isolated iCamp unified inbox', async () => {
    await chooseOrganization('iCamp');
    await act(async () => buttonWith('Open inbox preview', '.ql191-actions button').click());
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Unified inbox');
    expect(host.textContent).toContain('DISABLED SYNTHETIC INBOX');
    expect(host.textContent).toContain('Tent-site availability');
    expect(host.textContent).not.toContain('Unanswered detailing request');
    await act(async () => buttonWith('Event hall visitor pass', '.ql192-thread').click());
    expect(host.querySelector('.ql192-detail-panel')?.textContent).toContain('Mock form: What is the process');
  });

  it('navigates to a YW safety view without falsely showing earlier brand approvals', async () => {
    await chooseOrganization('YW');
    await chooseWorkspace('Safety & hold review');
    expect(host.textContent).toContain('do not approve iCamp or YW tenants');
    expect(host.textContent).toContain('All twelve real-pilot requirements remain held');
    expect(host.querySelector('.ql190-packet')).toBeNull();
  });

  it('preserves historical two-brand inbox and evidence workspaces', async () => {
    await chooseWorkspace('Unified inbox');
    expect(host.querySelector('.ql172-local-warning')?.textContent).toContain('Do not enter real names');
    await act(async () => buttonWith('Open historical QL-004 local demo tools', '.ql192-legacy-tools button').click());
    expect(host.querySelector('.ql172-embedded-inbox')).not.toBeNull();
    await chooseOrganization('Devil n Dove');
    expect(host.querySelector('.ql172-context')?.textContent).toContain('Devil n Dove');
    await chooseWorkspace('Safety & hold review');
    expect(host.textContent).toContain('Independent pre-pilot review packet');
  });

  it('offers working dashboard help and returns keyboard focus after navigation', async () => {
    await act(async () => buttonWith('Help', '.ql191-help-button').click());
    expect(buttonWith('Help', '.ql191-help-button').getAttribute('aria-expanded')).toBe('true');
    expect(host.textContent).toContain('Select a filter to inspect synthetic activity');
    await act(async () => buttonWith('Help', '.ql191-help-button').click());
    expect(buttonWith('Help', '.ql191-help-button').getAttribute('aria-expanded')).toBe('false');
    await act(async () => buttonWith('Open inbox preview', '.ql191-actions button').click());
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
  });

  it('has no network, storage writes, send or live authorization buttons in the dashboard', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await chooseOrganization('iCamp');
    await act(async () => buttonWith('Needs reply', '.ql191-filter').click());
    expect(write).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect([...host.querySelectorAll<HTMLButtonElement>('.ql191-dashboard button')].some((button) => /send|call now|approve pilot/i.test(button.textContent ?? ''))).toBe(false);
  });

  it('includes responsive, visible-focus and forced-colour styling', () => {
    const shellCss = readFileSync('src/operator/operator-shell.css', 'utf8');
    const dashboardCss = readFileSync('src/operator/ql191-dashboard.css', 'utf8');
    expect(shellCss).toContain(':focus-visible');
    expect(dashboardCss).toContain('@media (max-width: 650px)');
    expect(dashboardCss).toContain('@media (forced-colors: active)');
  });
});
