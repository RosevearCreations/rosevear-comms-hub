// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL300_ACCEPTANCE, ql300Recovery } from '../ql300PreferenceAcceptance';
import { defaultQl272Preferences } from '../ql272LayoutPreferences';
import { inspectQl272LocalLayout, saveQl272LocalLayout } from '../../storage/localRepository';

let host: HTMLDivElement; let root: Root;
const key = 'rosevear-comms-hub:ql272-command-layouts:v1';
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
function button(label: string) { const found = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(label)); if (!found) throw new Error(`Missing ${label}`); return found; }
async function open() { await act(async () => button('IT Command').click()); await act(async () => button('Open accessibility acceptance guide').click()); }

describe('QL-300 accessible preference acceptance and safe recovery', () => {
  it('lists four distinct manual checks, without simulated owner approval', () => {
    expect(QL300_ACCEPTANCE).toHaveLength(4);
    expect(new Set(QL300_ACCEPTANCE.map(check => check.id)).size).toBe(4);
    expect(QL300_ACCEPTANCE.every(check => check.steps.length > 50 && check.expected.length > 50)).toBe(true);
  });
  it('blocks invalid version, altered role, tampered fields and oversized profiles from browser persistence', () => {
    const original = defaultQl272Preferences();
    expect(saveQl272LocalLayout(original)).toBe(true);
    const prior = window.localStorage.getItem(key);
    for (const bad of [{ ...original, version: 2 }, { ...original, activeId: 'missing' }, { ...original, extraTenant: 'secret' },
      { ...original, profiles: [{ ...original.profiles[0], rolePreview: 'administrator' }] },
      { ...original, profiles: [{ ...original.profiles[0], label: 'a'.repeat(20000) }] }]) {
      expect(saveQl272LocalLayout(bad)).toBe(false);
      expect(window.localStorage.getItem(key)).toBe(prior);
    }
  });
  it('fails closed on malformed, missing and unavailable records; restores only reviewed v1 profile', () => {
    expect(ql300Recovery(inspectQl272LocalLayout()).canRestore).toBe(false);
    window.localStorage.setItem(key, '{bad');
    expect(ql300Recovery(inspectQl272LocalLayout()).audit.status).toBe('malformed');
    window.localStorage.setItem(key, JSON.stringify({ version: 7, profiles: [] }));
    expect(ql300Recovery(inspectQl272LocalLayout()).audit.status).toBe('invalid');
    expect(saveQl272LocalLayout(defaultQl272Preferences())).toBe(true);
    expect(ql300Recovery(inspectQl272LocalLayout()).canRestore).toBe(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(ql300Recovery(inspectQl272LocalLayout()).audit.status).toBe('unavailable');
  });
  it('exposes keyboard shortcut reference, manual review cards and stable focus on recovery', async () => {
    await open();
    expect(host.querySelectorAll('.ql300-checks li')).toHaveLength(4);
    expect(host.textContent).toContain('OWNER RESULT · UNVERIFIED');
    await act(async () => button('Show keyboard shortcut reference').click());
    expect(host.querySelectorAll('.ql300-shortcuts kbd')).toHaveLength(7);
    const restore = button('Restore verified saved profile');
    restore.focus();
    await act(async () => restore.click());
    expect(document.activeElement).toBe(restore);
    expect(host.textContent).toContain('Restore blocked');
    expect(saveQl272LocalLayout(defaultQl272Preferences())).toBe(true);
    await act(async () => restore.click());
    expect(document.activeElement).toBe(restore);
    expect(host.textContent).toContain('Restored the verified local');
    expect(host.textContent).toContain('owner acceptance still unverified');
  });
  it('has responsive reflow, forced-color and reduced-motion rules', () => {
    const css = readFileSync('src/operator/ql300-preference-acceptance.css', 'utf8');
    expect(css).toContain('max-width:760px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain(':focus-visible');
  });
});
