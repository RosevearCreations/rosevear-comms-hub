// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { inboxChannels, inboxFixtures, inboxForOrganization } from '../ql192InboxFixtures';

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
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((candidate) => candidate.textContent?.includes(label));
  if (!button) throw Error(`Missing ${label} in ${selector}`);
  return button;
}

async function openInbox() { await act(async () => buttonWith('Unified inbox', '.ql172-nav-button').click()); }
async function company(name: string) { await act(async () => buttonWith(name, '.ql172-brand').click()); }
async function selectThread(subject: string) { await act(async () => buttonWith(subject, '.ql192-thread').click()); }

describe('QL-192 safe multi-channel fixture contract', () => {
  it('has unique scoped threads, events and no real recipient identifiers', () => {
    const entries = Object.entries(inboxFixtures);
    expect(entries.map(([id]) => id)).toEqual(['rosiedazzlers', 'devilndove', 'icamp', 'yw']);
    const threads = entries.flatMap(([, value]) => value);
    expect(threads).toHaveLength(20);
    expect(new Set(threads.map((thread) => thread.id)).size).toBe(20);
    expect(new Set(threads.flatMap((thread) => thread.events.map((event) => event.id))).size).toBe(threads.flatMap((thread) => thread.events).length);
    for (const [id, items] of entries) {
      expect(items).toHaveLength(5);
      expect(items.every((thread) => thread.organizationId === id)).toBe(true);
      expect(items.every((thread) => !/@/.test(thread.contactLabel) && !/\+\d{8,}/.test(thread.contactLabel))).toBe(true);
    }
    expect(inboxForOrganization('icamp').some((thread) => thread.subject.includes('Tent-site'))).toBe(true);
    expect(inboxForOrganization('yw').some((thread) => thread.subject.includes('Garbage'))).toBe(true);
    expect(inboxChannels.map((channel) => channel.id)).toContain('mms');
  });
});

describe('QL-192 unified communications inbox', () => {
  it('opens an explicitly disabled synthetic inbox with all company-local channels and counts', async () => {
    await openInbox();
    expect(host.querySelector('.ql192-inbox')?.getAttribute('data-ql192-release')).toBe('ql192-unified-four-company-inbox-v1');
    expect(host.querySelector('.ql192-inbox')?.getAttribute('data-organization')).toBe('rosiedazzlers');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(5);
    expect(host.querySelector('.ql192-result-count')?.textContent).toContain('5 of 5 synthetic conversations');
    expect(host.textContent).toContain('DISABLED SYNTHETIC INBOX');
    expect(host.textContent).toContain('Send disabled');
    expect(host.querySelector<HTMLTextAreaElement>('#ql192-compose')?.disabled).toBe(true);
    expect(host.querySelector<HTMLButtonElement>('.ql192-composer button')?.disabled).toBe(true);
  });

  it('searches the subject and message body and offers a working clear-filters recovery', async () => {
    await openInbox();
    const input = host.querySelector<HTMLInputElement>('#ql192-search')!;
    await act(async () => { const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; nativeSetter.call(input, 'ceramic'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(1);
    expect(host.textContent).toContain('Ceramic coating estimate');
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; setter.call(input, 'no-such-sample'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(host.querySelector('.ql192-empty')?.textContent).toContain('No demonstration conversations');
    await act(async () => buttonWith('Clear filters', '.ql192-empty button').click());
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(5);
  });

  it('filters channels and unread/needs-reply/follow-up states without crossing context', async () => {
    await openInbox();
    const select = host.querySelector<HTMLSelectElement>('#ql192-channel')!;
    await act(async () => { select.value = 'mms'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(1);
    expect(host.textContent).toContain('Condition photo question');
    await act(async () => { select.value = 'all'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => buttonWith('Unread', '.ql192-view-filter').click());
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(3);
    await act(async () => buttonWith('Needs reply', '.ql192-view-filter').click());
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(2);
    await act(async () => buttonWith('Follow-up', '.ql192-view-filter').click());
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(3);
  });

  it('selects one timeline with source and consent without giving a send control', async () => {
    await openInbox();
    await selectThread('Condition photo question');
    const detail = host.querySelector('.ql192-detail-panel')!;
    expect(detail.textContent).toContain('Simulated image attachment');
    expect(detail.textContent).toContain('Opt-out indicated in test fixture');
    expect(detail.textContent).not.toContain('Call now');
    expect(host.querySelector('.ql192-composer button')?.hasAttribute('disabled')).toBe(true);
  });

  it('temporarily marks a fictional thread reviewed and updates unread counts', async () => {
    await openInbox();
    expect(host.querySelector('.ql192-inbox-stats')?.textContent).toContain('3Unread examples');
    await act(async () => buttonWith('Mark reviewed (demo)', '.ql192-detail-actions button').click());
    expect(host.querySelector('.ql192-inbox-stats')?.textContent).toContain('2Unread examples');
    expect(buttonWith('Reviewed in demo', '.ql192-detail-actions button').disabled).toBe(true);
  });

  it('toggles a demonstration follow-up without creating a real task', async () => {
    await openInbox();
    const button = buttonWith('Flag follow-up (demo)', '.ql192-detail-actions button');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await act(async () => button.click());
    expect(buttonWith('Remove follow-up flag', '.ql192-detail-actions button').getAttribute('aria-pressed')).toBe('true');
    expect(host.textContent).toContain('They are not authorizations, assignments, saved messages');
  });

  it('isolates iCamp when switching from Rosie and limits it to fabricated guest events', async () => {
    await openInbox();
    await company('iCamp');
    expect(host.querySelector('.ql192-inbox')?.getAttribute('data-organization')).toBe('icamp');
    expect(host.textContent).toContain('Tent-site availability');
    expect(host.textContent).toContain('Event hall visitor pass');
    expect(host.textContent).not.toContain('Interior salt-stain question');
    expect(host.textContent).not.toContain('Engraved keepsake timing');
    expect(host.querySelectorAll('.ql192-thread')).toHaveLength(5);
    expect(host.querySelector('.ql192-legacy-tools')).toBeNull();
  });

  it('isolates YW and never shows iCamp visitor or booking data', async () => {
    await openInbox();
    await company('iCamp');
    await company('YW');
    expect(host.textContent).toContain('Garbage sticker collection question');
    expect(host.textContent).toContain('Fibre trenching site constraints');
    expect(host.textContent).not.toContain('Event hall visitor pass');
    expect(host.textContent).not.toContain('Tent-site availability');
    expect(host.querySelector('.ql192-inbox')?.getAttribute('data-organization')).toBe('yw');
  });

  it('resets transient inbox review and filters when an organization changes', async () => {
    await openInbox();
    await act(async () => buttonWith('Mark reviewed (demo)', '.ql192-detail-actions button').click());
    await act(async () => buttonWith('Unread', '.ql192-view-filter').click());
    await company('iCamp');
    expect(host.querySelector('.ql192-result-count')?.textContent).toContain('5 of 5');
    await company('Rosie Dazzlers');
    expect(host.querySelector('.ql192-inbox-stats')?.textContent).toContain('3Unread examples');
    expect(host.querySelector('.ql192-view-filter.active')?.textContent).toBe('All conversations');
  });

  it('makes historical browser-local tools opt-in for Rosie/Devil only', async () => {
    await openInbox();
    expect(host.querySelector('.ql172-embedded-inbox')).toBeNull();
    const toggle = buttonWith('Open historical QL-004 local demo tools', '.ql192-legacy-tools button');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await act(async () => toggle.click());
    expect(host.querySelector('.ql172-embedded-inbox')).not.toBeNull();
    await act(async () => buttonWith('Hide historical QL-004 local demo tools', '.ql192-legacy-tools button').click());
    expect(host.querySelector('.ql172-embedded-inbox')).toBeNull();
    await company('YW');
    expect(host.querySelector('.ql192-legacy-tools')).toBeNull();
  });

  it('offers working help but no unguarded provider, storage or network calls', async () => {
    await openInbox();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await act(async () => buttonWith('Help', '.ql192-inbox-header button').click());
    expect(host.textContent).toContain('Marking a thread reviewed or flagging a follow-up');
    await act(async () => buttonWith('Mark reviewed (demo)', '.ql192-detail-actions button').click());
    await company('YW');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('retains keyboard-visible focus and responsive/forced-colour layout rules', async () => {
    await openInbox();
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
    expect(host.querySelector<HTMLLabelElement>('label[for="ql192-search"]')).not.toBeNull();
    expect(host.querySelector<HTMLLabelElement>('label[for="ql192-channel"]')).not.toBeNull();
    const css = readFileSync('src/operator/ql192-inbox.css', 'utf8');
    expect(css).toContain('@media (max-width: 620px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(readFileSync('src/operator/operator-shell.css', 'utf8')).toContain(':focus-visible');
  });
});
