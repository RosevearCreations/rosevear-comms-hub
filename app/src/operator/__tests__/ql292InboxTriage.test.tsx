// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { inboxFixtures, inboxForOrganization } from '../ql192InboxFixtures';
import {
  defaultInboxTriageFilters, demoOwnerForThread, emptyInboxTriagePresets, filterInboxTriage,
  isSafeInboxTriageFilters, matchesTriageSearch, nextDemoAction, recoverInboxTriagePreset, triageLaneForThread
} from '../ql292InboxTriage';

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});

afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); window.localStorage.clear(); vi.restoreAllMocks();
});

function button(label: string, selector = 'button'): HTMLButtonElement {
  const found = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((node) => node.textContent?.includes(label));
  if (!found) throw new Error(`Missing button: ${label} (${selector})`);
  return found;
}
async function click(label: string, selector?: string) { await act(async () => button(label, selector).click()); }
async function inbox() { await click('Unified inbox', '.ql172-nav-button'); }
async function select(id: string, value: string) {
  const input = host.querySelector<HTMLSelectElement>(`#${id}`)!;
  await act(async () => { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function search(value: string) {
  const input = host.querySelector<HTMLInputElement>('#ql192-search')!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}

describe('QL-292 deterministic, isolated inbox model', () => {
  it('maps every fictional thread to a nonpersonal owner and safe next action', () => {
    const all = Object.values(inboxFixtures).flat();
    expect(all).toHaveLength(20);
    expect(all.map(demoOwnerForThread).filter((owner) => owner === 'unassigned')).toHaveLength(5);
    expect(all.every((thread) => !nextDemoAction(thread).includes('Send'))).toBe(true);
    expect(triageLaneForThread(inboxForOrganization('rosiedazzlers')[0])).toBe('attention');
    expect(triageLaneForThread(inboxForOrganization('rosiedazzlers')[2])).toBe('follow_up');
    expect(triageLaneForThread(inboxForOrganization('rosiedazzlers')[3])).toBe('later');
  });

  it('matches every term, quoted phrases and subject/contact/channel scopes without fuzzy leakage', () => {
    const [thread] = inboxForOrganization('rosiedazzlers');
    expect(matchesTriageSearch(thread, 'winter detail')).toBe(true);
    expect(matchesTriageSearch(thread, 'winter camping')).toBe(false);
    expect(matchesTriageSearch(thread, '"winter salt stains"')).toBe(true);
    expect(matchesTriageSearch(thread, 'subject:"Interior salt-stain"')).toBe(true);
    expect(matchesTriageSearch(thread, 'subject:ceramic')).toBe(false);
    expect(matchesTriageSearch(thread, 'contact:"Demo detailing customer A" channel:sms')).toBe(true);
    expect(matchesTriageSearch(thread, 'channel:email')).toBe(false);
  });

  it('combines status, priority, owner, view, channel and lane with a deterministic sort', () => {
    const filters = { ...defaultInboxTriageFilters(), channel: 'sms' as const, priority: 'high' as const, owner: 'demo_desk' as const, status: 'needs_reply' as const, view: 'unread' as const, lane: 'attention' as const };
    const all = Object.values(inboxFixtures).flat();
    expect(filterInboxTriage(all, 'rosiedazzlers', filters).map((thread) => thread.id)).toEqual(['rd-sms']);
    expect(filterInboxTriage(all, 'devilndove', filters).map((thread) => thread.id)).toEqual(['dnd-sms']);
    expect(filterInboxTriage(all, 'icamp', filters).map((thread) => thread.id)).toEqual(['camp-sms']);
    const sorted = filterInboxTriage(all, 'rosiedazzlers', { ...defaultInboxTriageFilters(), sort: 'subject' });
    expect(sorted.map((thread) => thread.subject)).toEqual([...sorted.map((thread) => thread.subject)].sort((a, b) => a.localeCompare(b)));
    expect(filterInboxTriage(all, 'rosiedazzlers', defaultInboxTriageFilters()).slice(0, 2).every((thread) => thread.priority === 'high')).toBe(true);
  });

  it('rejects corrupted, unsupported and cross-brand saved views', () => {
    const filters = defaultInboxTriageFilters();
    const preset = { version: 1, organizationId: 'rosiedazzlers', filters };
    expect(recoverInboxTriagePreset(preset, 'rosiedazzlers')).toEqual(filters);
    expect(recoverInboxTriagePreset(preset, 'icamp')).toBeNull();
    expect(recoverInboxTriagePreset({ ...preset, version: 5 }, 'rosiedazzlers')).toBeNull();
    expect(recoverInboxTriagePreset({ ...preset, filters: { ...filters, owner: 'admin' } }, 'rosiedazzlers')).toBeNull();
    expect(isSafeInboxTriageFilters({ ...filters, search: 'x'.repeat(121) })).toBe(false);
    expect(emptyInboxTriagePresets()).toEqual({ desk: null, follow_up: null });
  });
});

describe('QL-292 operator UI and session-only recovery', () => {
  it('shows five accessible sample priority lanes and explicit demo owner/action labels', async () => {
    await inbox();
    expect(host.querySelector('.ql192-inbox')?.getAttribute('data-ql292-release')).toContain('ql292-priority');
    expect(host.querySelectorAll('.ql292-lane')).toHaveLength(5);
    expect(host.querySelector('.ql292-lanes')?.textContent).toContain('Priority now');
    expect(host.querySelector('.ql292-thread-meta')?.textContent).toContain('Demo');
    expect(host.textContent).toContain('No phone/SMS');
    expect(host.querySelector<HTMLButtonElement>('.ql192-composer button')?.disabled).toBe(true);
  });

  it('lets lanes and filters combine; clear restores the full isolated inbox', async () => {
    await inbox();
    await click('Priority now', '.ql292-lane');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(2);
    await select('ql292-owner', 'unassigned');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(1);
    await select('ql292-status', 'needs_reply');
    expect(host.querySelector('.ql192-empty')).not.toBeNull();
    await click('Clear filters', '.ql192-empty button');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(5);
    expect(host.querySelector('.ql292-lane.active')?.textContent).toContain('All work');
  });

  it('searches quoted phrases with combined filters while exposing honest empty states', async () => {
    await inbox();
    await search('subject:"Ceramic coating"');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(1);
    await select('ql292-priority', 'high');
    expect(host.querySelector('.ql192-empty')?.textContent).toContain('Try another lane');
    await click('Clear filters', '.ql192-empty button');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(5);
  });

  it('saves two independent tab-only presets and restores after navigating away', async () => {
    await inbox();
    await select('ql292-owner', 'unassigned');
    await click('Save current filters', '.ql292-preset-actions button');
    expect(host.querySelector('.ql292-preset-status')?.textContent).toContain('Valid saved view');
    await select('ql292-preset-slot', 'follow_up');
    await select('ql292-status', 'waiting');
    await click('Save current filters', '.ql292-preset-actions button');
    await click('Dashboard', '.ql172-nav-button');
    await inbox();
    expect(host.querySelector<HTMLSelectElement>('#ql292-owner')?.value).toBe('all');
    await click('Restore saved view', '.ql292-preset-actions button');
    expect(host.querySelector<HTMLSelectElement>('#ql292-owner')?.value).toBe('unassigned');
    await select('ql292-preset-slot', 'follow_up');
    await click('Restore saved view', '.ql292-preset-actions button');
    expect(host.querySelector<HTMLSelectElement>('#ql292-status')?.value).toBe('waiting');
    await click('Remove saved view', '.ql292-preset-actions button');
    expect(host.querySelector('.ql292-preset-status')?.textContent).toContain('No valid view');
  });

  it('discards presets when switching business; no cross-brand filter restoration', async () => {
    await inbox();
    await search('salt');
    await click('Save current filters', '.ql292-preset-actions button');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('.ql292-preset-status')?.textContent).toContain('No valid view');
    await click('Restore saved view', '.ql292-preset-actions button');
    expect(host.querySelector<HTMLInputElement>('#ql192-search')?.value).toBe('');
    expect(host.querySelector('.ql292-preset-feedback')?.textContent).toContain('safe default');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(5);
    expect(host.textContent).not.toContain('Interior salt-stain question');
  });

  it('does not call network or browser storage while saving or restoring preview presets', async () => {
    await inbox();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await select('ql292-sort', 'subject');
    await click('Save current filters', '.ql292-preset-actions button');
    await click('Restore saved view', '.ql292-preset-actions button');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('provides labeled controls, responsive lanes, visible focus, forced colours and reduced motion', async () => {
    await inbox();
    for (const id of ['ql292-priority', 'ql292-owner', 'ql292-status', 'ql292-sort', 'ql292-preset-slot']) {
      expect(host.querySelector(`label[for="${id}"]`)).not.toBeNull();
    }
    const css = readFileSync('src/operator/ql292-inbox-triage.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 390px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
