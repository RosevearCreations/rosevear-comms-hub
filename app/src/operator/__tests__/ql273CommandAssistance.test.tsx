// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL273_METRIC_HELP, QL273_SHORTCUTS, QL273_VIEW_HELP,
  auditQl273SavedView, ql273ShortcutMode } from '../ql273CommandHelp';
import { defaultQl272Preferences } from '../ql272LayoutPreferences';
import { inspectQl272LocalLayout, saveQl272LocalLayout } from '../../storage/localRepository';

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
  const found = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item =>
    item.getAttribute('aria-label') === label || item.textContent?.includes(label));
  if (!found) throw new Error(`Button not found: ${label}`);
  return found;
}

async function enterCommand() {
  await act(async () => button('IT Command').click());
}

async function shortcut(code: string, options: KeyboardEventInit = {}) {
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true, altKey: true, shiftKey: true, code, ...options
  })));
}

describe('QL-273 command guidance, shortcuts and recovery', () => {
  it('ships distinct source-grounded help for all four screens and all sixteen metric cards', () => {
    for (const mode of Object.keys(QL273_VIEW_HELP) as Array<keyof typeof QL273_VIEW_HELP>) {
      expect(QL273_VIEW_HELP[mode].purpose.length).toBeGreaterThan(35);
      expect(QL273_METRIC_HELP[mode]).toHaveLength(4);
    }
    expect(QL273_SHORTCUTS).toHaveLength(7);
    expect(ql273ShortcutMode({ altKey: true, shiftKey: true, ctrlKey: false, metaKey: false, code: 'Digit3' })).toBe('analytics');
    expect(ql273ShortcutMode({ altKey: true, shiftKey: false, ctrlKey: false, metaKey: false, code: 'Digit3' })).toBeNull();
  });

  it('opens contextual screen and card help with accessible disclosure controls', async () => {
    await enterCommand();
    const help = button('Help for this view');
    await act(async () => help.click());
    expect(help.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('[aria-label="Help for this command view"]')?.textContent).toContain('Proofs verified and gateway requests are zero');
    const metric = button('Help about Signed proofs verified');
    await act(async () => metric.click());
    expect(metric.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('#ql273-metric-it_command-1')?.textContent).toContain('No original signed Proof-B');
    await act(async () => help.click());
    expect(host.querySelector('#ql273-help')).toBeNull();
  });

  it('navigates command views with shortcuts, and never hijacks form input', async () => {
    await enterCommand();
    await shortcut('Digit2');
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('management');
    await shortcut('Digit3');
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('analytics');
    await shortcut('Digit4');
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('system_status');
    await shortcut('Digit1');
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('it_command');
    await shortcut('KeyH');
    expect(host.querySelector('#ql273-help')).not.toBeNull();
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(host.querySelector('#ql273-help')).toBeNull();
    await act(async () => button('Customize cards').click());
    const input = host.querySelector<HTMLInputElement>('.ql272-save-row input')!;
    await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, code: 'Digit3', altKey: true, shiftKey: true })));
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('it_command');
    await act(async () => button('Keyboard shortcuts').click());
    expect(host.querySelectorAll('.ql273-shortcut-list kbd')).toHaveLength(7);
  });

  it('checks missing, valid, malformed and unsupported local records without changing authorization', async () => {
    expect(auditQl273SavedView(inspectQl272LocalLayout()).status).toBe('missing');
    expect(saveQl272LocalLayout(defaultQl272Preferences())).toBe(true);
    expect(auditQl273SavedView(inspectQl272LocalLayout()).status).toBe('valid');
    window.localStorage.setItem(key, '{broken JSON');
    expect(inspectQl272LocalLayout().state).toBe('malformed');
    expect(auditQl273SavedView(inspectQl272LocalLayout()).status).toBe('malformed');
    window.localStorage.setItem(key, JSON.stringify({ ...defaultQl272Preferences(), tenantId: 'forged' }));
    expect(auditQl273SavedView(inspectQl272LocalLayout()).status).toBe('invalid');
    expect(host.textContent).toContain('DISABLED PREVIEW');
  });

  it('restores a verified profile, audits local integrity and permits explicit invalid-record replacement', async () => {
    const prefs = defaultQl272Preferences();
    prefs.activeId = 'it-review';
    prefs.profiles[2].views.it_command.hidden = [0];
    saveQl272LocalLayout(prefs);
    await enterCommand();
    await act(async () => button('Saved view audit').click());
    expect(host.textContent).toContain('Saved view integrity verified');
    expect(host.textContent).toContain('3 safe layout profile(s)');
    await act(async () => button('Restore verified saved view').click());
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(3);
    expect(host.textContent).toContain('Restored the locally verified');

    window.localStorage.setItem(key, '{broken JSON');
    await act(async () => button('Check again').click());
    expect(host.textContent).toContain('Saved view cannot be decoded');
    expect(button('Restore verified saved view').disabled).toBe(true);
    await act(async () => button('Replace invalid record with defaults').click());
    expect(auditQl273SavedView(inspectQl272LocalLayout()).status).toBe('valid');
    expect(host.querySelectorAll('.ql271-kpi')).toHaveLength(4);
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });

  it('reports storage unavailability without a false save or restore claim', async () => {
    await enterCommand();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage blocked'); });
    await shortcut('KeyR');
    expect(host.textContent).toContain('Browser storage unavailable');
    expect(button('Restore verified saved view').disabled).toBe(true);
  });

  it('keeps the responsive and assistive design guardrails', () => {
    const css = readFileSync('src/operator/ql273-assistance.css', 'utf8');
    expect(css).toContain('max-width:620px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
