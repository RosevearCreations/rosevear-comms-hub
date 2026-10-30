// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL272_DENIED_ACTIONS, QL272_ROLE_PREVIEWS, activeQl272Profile,
  addQl272Profile, defaultQl272Preferences, parseQl272Preferences, ql272PreviewCapabilities,
  reorderQl272Metric, toggleQl272Metric } from '../ql272LayoutPreferences';
import { loadQl272LocalLayout, saveQl272LocalLayout } from '../../storage/localRepository';

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
  vi.restoreAllMocks();
});

function button(label: string): HTMLButtonElement {
  const match = [...host.querySelectorAll<HTMLButtonElement>('button')].find(value =>
    value.getAttribute('aria-label') === label || value.textContent?.includes(label));
  if (!match) throw new Error(`Missing button: ${label}`);
  return match;
}

async function openEditor() {
  await act(async () => button('IT Command').click());
  await act(async () => button('Customize cards').click());
}

function changeSelect(label: string, value: string) {
  const select = host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!;
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('QL-272 local-only command layouts and role-safe previews', () => {
  it('starts with three safe named profiles and rejects forged role, invalid order and hidden-all payloads', () => {
    const defaults = defaultQl272Preferences();
    expect(defaults.profiles.map(value => value.label)).toEqual(['Standard', 'Compact command', 'IT review']);
    expect(parseQl272Preferences({ version: 1, activeId: 'fake', profiles: [] })).toEqual(defaults);
    const badRole = structuredClone(defaults);
    (badRole.profiles[0] as {rolePreview:string}).rolePreview = 'superadmin';
    expect(parseQl272Preferences(badRole)).toEqual(defaults);
    const badOrder = structuredClone(defaults);
    badOrder.profiles[0].views.it_command.order = [0, 0, 1, 2];
    expect(parseQl272Preferences(badOrder)).toEqual(defaults);
    const hiddenAll = structuredClone(defaults);
    hiddenAll.profiles[0].views.analytics.hidden = [0, 1, 2, 3];
    expect(parseQl272Preferences(hiddenAll)).toEqual(defaults);
    expect(QL272_ROLE_PREVIEWS).toHaveLength(3);
    expect(QL272_DENIED_ACTIONS).toContain('Request an authenticated gateway GET');
    for (const role of QL272_ROLE_PREVIEWS) {
      const caps = ql272PreviewCapabilities(role.id);
      expect(caps.issueAuthenticatedGet).toBe(false);
      expect(caps.provisionCredentials).toBe(false);
      expect(caps.accessRealTenant).toBe(false);
      expect(caps.sendLiveCommunications).toBe(false);
      expect(caps.acceptIndependentSignature).toBe(false);
    }
  });

  it('reorders metrics and protects a minimum of one visible card', () => {
    const first = defaultQl272Preferences().profiles[0].views.it_command;
    expect(reorderQl272Metric(first, 0, 1).order).toEqual([1, 0, 2, 3]);
    expect(reorderQl272Metric(first, 0, -1)).toEqual(first);
    const threeHidden = toggleQl272Metric(toggleQl272Metric(toggleQl272Metric(first, 0), 1), 2);
    expect(toggleQl272Metric(threeHidden, 3)).toBe(threeHidden);
    expect(toggleQl272Metric(threeHidden, 1).hidden).toEqual([0, 2]);
  });

  it('saves only versioned layout choices through the existing local repository boundary', () => {
    expect(loadQl272LocalLayout()).toBeNull();
    const prefs = defaultQl272Preferences();
    expect(saveQl272LocalLayout(prefs)).toBe(true);
    expect(parseQl272Preferences(loadQl272LocalLayout())).toEqual(prefs);
    const keys = Object.keys(window.localStorage);
    expect(keys).toEqual(['rosevear-comms-hub:ql272-command-layouts:v1']);
    const serialized = window.localStorage.getItem(keys[0])!;
    expect(serialized).not.toContain('tenantId');
    expect(serialized).not.toContain('credential');
    expect(serialized).not.toContain('bearer');
  });

  it('renders configurable cards, reorders them, and persists changes across view switches', async () => {
    await openEditor();
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(4);
    await act(async () => button('Hide Registered sources').click());
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(3);
    await act(async () => button('Move Signed proofs verified down').click());
    const labels = [...host.querySelectorAll('.ql271-kpi-label')].map(element => element.textContent);
    expect(labels).toEqual(['Gateway requests', 'Signed proofs verified', 'Pilot safety holds']);
    expect(JSON.stringify(loadQl272LocalLayout())).toContain('hidden');

    await act(async () => changeSelect('Screen density', 'compact'));
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
    await act(async () => button('Analytics').click());
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
    await act(async () => button('IT Command').click());
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(3);
    expect(host.textContent).toContain('Saved on this device');
  });

  it('lets operators select read-only IT profile preview without enabling any permissions', async () => {
    await openEditor();
    await act(async () => changeSelect('Role-safe preview', 'it_reviewer'));
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-role-preview')).toBe('it_reviewer');
    expect(host.textContent).toContain('This changes presentation only');
    for (const action of QL272_DENIED_ACTIONS) expect(host.textContent).toContain(action);
    expect(host.textContent).toContain('0 authenticated');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
    expect(host.querySelectorAll('.ql271-source-row')).toHaveLength(6);
  });

  it('toggles detailed panels, creates a named layout and restores defaults', async () => {
    await openEditor();
    const checkbox = host.querySelector<HTMLInputElement>('.ql272-panel-toggle input')!;
    await act(async () => checkbox.click());
    expect(host.querySelectorAll('.ql271-source-row')).toHaveLength(0);

    const input = host.querySelector<HTMLInputElement>('.ql272-save-row input')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => { setter.call(input, 'Morning command'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => button('Save named profile').click());
    expect(activeQl272Profile(parseQl272Preferences(loadQl272LocalLayout())).label).toBe('Morning command');
    expect(host.textContent).toContain('Morning command layout');

    await act(async () => button('Restore defaults').click());
    expect(host.querySelectorAll('.ql271-source-row')).toHaveLength(6);
    expect(parseQl272Preferences(loadQl272LocalLayout())).toEqual(defaultQl272Preferences());
    expect(host.textContent).toContain('Standard layout');
  });

  it('handles an unavailable browser storage service without claiming data persisted', async () => {
    await openEditor();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota blocked'); });
    await act(async () => button('Hide Registered sources').click());
    expect(host.textContent).toContain('Storage unavailable — session only');
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(3);
  });

  it('restores a chosen layout after the operator shell is fully unmounted and mounted again', async () => {
    await openEditor();
    await act(async () => button('Hide Registered sources').click());
    await act(async () => changeSelect('Screen density', 'compact'));
    await act(async () => root.unmount());
    root = createRoot(host);
    await act(async () => root.render(<OperatorShell />));
    await act(async () => button('IT Command').click());
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(3);
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
  });

  it('offers accessible and responsive layout controls', () => {
    const css = readFileSync('src/operator/ql272-layout.css', 'utf8');
    expect(css).toContain('max-width:760px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
  });

  it('rejects invalid or duplicate profile names and caps local profiles', () => {
    const initial = defaultQl272Preferences();
    expect(addQl272Profile(initial, 'Standard')).toBeNull();
    expect(addQl272Profile(initial, 'api_key=secret')).toBeNull();
    const renamed = addQl272Profile(initial, 'Morning command')!;
    expect(renamed.profiles).toHaveLength(4);
    expect(renamed.activeId).toBe('layout-1');
    const five = addQl272Profile(renamed, 'Afternoon')!;
    const six = addQl272Profile(five, 'Evening')!;
    expect(addQl272Profile(six, 'Night')).toBeNull();
  });
});
