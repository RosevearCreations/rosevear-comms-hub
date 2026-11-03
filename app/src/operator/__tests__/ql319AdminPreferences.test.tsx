// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { defaultQl272Preferences, parseQl272Preferences } from '../ql272LayoutPreferences';
import { ql319ActiveSummary, ql319ExportPreview, ql319SavedViewState } from '../ql319AdminPreferences';
import { inspectQl272LocalLayout, loadQl272LocalLayout, saveQl272LocalLayout } from '../../storage/localRepository';

const key = 'rosevear-comms-hub:ql272-command-layouts:v1';
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
  const match = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item =>
    item.textContent?.includes(label) || item.getAttribute('aria-label') === label);
  if (!match) throw Error(`Missing button ${label}`);
  return match;
}

async function open() { await act(async () => button('IT Command').click()); }

describe('QL-319 consolidated Admin preference finish', () => {
  it('exports only exact validated version-1 layout choices; rejects forged fields and roles', () => {
    const original = defaultQl272Preferences();
    const exportText = ql319ExportPreview(original);
    expect(exportText).toBeTruthy();
    expect(JSON.parse(exportText!)).toEqual(original);
    expect(exportText).not.toContain('customerId');
    expect(exportText).not.toContain('bearer');
    expect(ql319ActiveSummary(original)).toContain('Standard · Comfortable · operator');
    expect(ql319ExportPreview({ ...original, tenantId: 'private' } as typeof original)).toBeNull();
    expect(ql319ExportPreview({ ...original, version: 2 } as unknown as typeof original)).toBeNull();
    expect(ql319ExportPreview({ ...original, profiles: [{ ...original.profiles[0], rolePreview: 'root' }] } as unknown as typeof original)).toBeNull();
  });

  it('recognizes valid, missing, malformed, invalid and unavailable records without restoring them', () => {
    expect(ql319SavedViewState(inspectQl272LocalLayout()).audit.status).toBe('missing');
    window.localStorage.setItem(key, '{malformed');
    expect(ql319SavedViewState(inspectQl272LocalLayout()).canRepair).toBe(true);
    window.localStorage.setItem(key, JSON.stringify({ version: 4, profiles: [] }));
    expect(ql319SavedViewState(inspectQl272LocalLayout()).audit.status).toBe('invalid');
    expect(saveQl272LocalLayout(defaultQl272Preferences())).toBe(true);
    expect(ql319SavedViewState(inspectQl272LocalLayout()).verifiedPreferences).toEqual(defaultQl272Preferences());
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw Error('denied'); });
    expect(ql319SavedViewState(inspectQl272LocalLayout()).audit.status).toBe('unavailable');
    expect(ql319SavedViewState(inspectQl272LocalLayout()).verifiedPreferences).toBeNull();
  });

  it('makes real density changes, navigation, contextual help and shortcuts available without role activation', async () => {
    await open();
    expect(host.querySelector('[data-ql319-admin]')).toBeTruthy();
    const input = host.querySelector<HTMLInputElement>('input[name="ql319-density"][value="compact"]')!;
    await act(async () => input.click());
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
    expect(parseQl272Preferences(loadQl272LocalLayout()).profiles[0].density).toBe('compact');
    await act(async () => button('Show keyboard guide').click());
    expect(host.querySelectorAll('.ql319-shortcuts kbd')).toHaveLength(7);
    await act(async () => button('Show view-specific help').click());
    expect(host.querySelector('#ql319-help')?.textContent).toContain('Admin settings never activate a provider');
    const navButton = host.querySelector<HTMLButtonElement>('.ql319-nav-actions button[aria-current="page"]')!;
    expect(navButton.textContent).toContain('IT Command');
    await act(async () => [...host.querySelectorAll<HTMLButtonElement>('.ql319-nav-actions button')].find(item => item.textContent === 'Statistics')!.click());
    expect(host.querySelector('.ql271-command')?.getAttribute('data-command-view')).toBe('analytics');
    expect(host.textContent).toContain('Display role');
    expect(host.textContent).toContain('No live');
  });

  it('displays a manual, read-only export without downloading, copying or creating a second storage key', async () => {
    await open();
    await act(async () => button('Review sanitized layout export').click());
    const textarea = host.querySelector<HTMLTextAreaElement>('#ql319-export-text')!;
    expect(textarea.readOnly).toBe(true);
    expect(JSON.parse(textarea.value)).toEqual(defaultQl272Preferences());
    expect(host.textContent).toContain('No file, cloud upload, account transfer or clipboard write');
    expect(Object.keys(window.localStorage)).toEqual([]);
  });

  it('requires explicit confirmation before destructive layout reset and restores defaults only after confirmation', async () => {
    await open();
    const compact = host.querySelector<HTMLInputElement>('input[name="ql319-density"][value="compact"]')!;
    await act(async () => compact.click());
    expect(parseQl272Preferences(loadQl272LocalLayout()).profiles[0].density).toBe('compact');
    await act(async () => button('Review reset to defaults').click());
    expect(host.textContent).toContain('Existing named profiles can be lost');
    await act(async () => button('Keep existing layout').click());
    expect(parseQl272Preferences(loadQl272LocalLayout()).profiles[0].density).toBe('compact');
    await act(async () => button('Review reset to defaults').click());
    await act(async () => button('Confirm replace local layouts').click());
    expect(loadQl272LocalLayout()).toEqual(defaultQl272Preferences());
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('comfortable');
  });

  it('does not revive a malformed record and exposes safe repair confirmation', async () => {
    await act(async () => root.unmount());
    window.localStorage.setItem(key, '{bad');
    root = createRoot(host);
    await act(async () => root.render(<OperatorShell />));
    await open();
    expect(host.querySelector('.ql319-status-grid')?.textContent).toContain('MALFORMED');
    expect(host.textContent).toContain('The stored record cannot be trusted');
    expect(host.querySelector<HTMLButtonElement>('.ql319-card-actions button:nth-child(2)')!.disabled).toBe(true);
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('comfortable');
    await act(async () => button('Review reset to defaults').click());
    await act(async () => button('Confirm replace local layouts').click());
    expect(loadQl272LocalLayout()).toEqual(defaultQl272Preferences());
  });

  it('keeps a changed density usable in-tab when browser persistence is blocked', async () => {
    await open();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota denied'); });
    await act(async () => host.querySelector<HTMLInputElement>('input[name="ql319-density"][value="compact"]')!.click());
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
    expect(host.querySelector('.ql319-status-grid')?.textContent).toContain('Session only');
    expect(window.localStorage.length).toBe(0);
  });

  it('keeps local-only safety and accessible reflow, forced colors and reduced motion', async () => {
    await open();
    expect(host.textContent).toContain('PREVIEW · NO LIVE ACTIONS');
    expect(host.textContent).toContain('No account grants, secret fields or tenant access');
    expect(host.querySelectorAll('.ql319-card')).toHaveLength(4);
    const css = readFileSync('src/operator/ql319-admin-preferences.css', 'utf8');
    expect(css).toContain('max-width:520px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain(':focus-visible');
  });
});
