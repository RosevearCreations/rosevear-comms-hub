// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { inboxForOrganization } from '../ql192InboxFixtures';
import {
  describeQl293Event, discardQl293Draft, ql293ReplyHelp, readQl293Draft,
  safeQl293DraftText, stageQl293Draft, type Ql293SessionDrafts
} from '../ql293ConversationRecovery';

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

function button(label: string, selector = 'button') {
  const found = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((element) => element.textContent?.includes(label));
  if (!found) throw new Error(`Missing button: ${label}`);
  return found;
}
async function click(label: string, selector?: string) { await act(async () => button(label, selector).click()); }
async function select(selector: string, value: string) {
  const input = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function editDraft(text: string) {
  const area = host.querySelector<HTMLTextAreaElement>('#ql196-text')!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(area, text); area.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function inbox() { await click('Unified inbox', '.ql172-nav-button'); }
async function composer() { await click('SMS/MMS composer', '.ql172-nav-button'); }

describe('QL-293 strict synthetic draft recovery model', () => {
  const sample = { threadId: 'rd-sms', purpose: 'service' as const, templateId: 'acknowledge', text: 'Example, not sent', attachment: 'none' as const };

  it('stores only bounded redacted text in a scoped UNSENT state', () => {
    const staged = stageQl293Draft({}, 'rosiedazzlers', { ...sample, text: 'Reply to jane@example.com and +1 416-555-1212, see https://bad.example/file' });
    const saved = readQl293Draft(staged, 'rosiedazzlers', 'rd-sms')!;
    expect(saved.deliveryState).toBe('UNSENT_SIMULATED');
    expect(saved.text).toContain('[REDACTED EMAIL]');
    expect(saved.text).toContain('[REDACTED PHONE]');
    expect(saved.text).toContain('[REDACTED URL]');
    expect(saved.text).not.toContain('jane@example.com');
    expect(safeQl293DraftText('x'.repeat(900))).toHaveLength(500);
  });

  it('fails closed for crossed brands, invalid targets, malformed state and unredacted injected content', () => {
    const staged = stageQl293Draft({}, 'rosiedazzlers', sample);
    expect(readQl293Draft(staged, 'icamp', 'rd-sms')).toBeNull();
    expect(stageQl293Draft(staged, 'icamp', sample)).toBe(staged);
    expect(stageQl293Draft(staged, 'rosiedazzlers', { ...sample, threadId: 'rd-email' })).toBe(staged);
    expect(stageQl293Draft(staged, 'rosiedazzlers', { ...sample, attachment: 'remote_url' as 'none' })).toBe(staged);
    expect(readQl293Draft({ 'rd-sms': { ...staged['rd-sms'], version: 3 as 1 } }, 'rosiedazzlers', 'rd-sms')).toBeNull();
    expect(readQl293Draft({ 'rd-sms': { ...staged['rd-sms'], text: 'real@example.com' } }, 'rosiedazzlers', 'rd-sms')).toBeNull();
    expect(discardQl293Draft(staged, 'rosiedazzlers', 'rd-sms')).toEqual({});
    expect(discardQl293Draft(staged, 'icamp', 'rd-sms')).toBe(staged);
  });

  it('provides source-labeled event states and metadata without any attachment bytes', () => {
    const [sms, , , mms] = inboxForOrganization('rosiedazzlers');
    expect(describeQl293Event(sms, sms.events[0]).state).toBe('INBOUND_FIXTURE');
    expect(describeQl293Event(sms, sms.events[1]).state).toBe('INTERNAL_ONLY');
    const attachment = describeQl293Event(mms, mms.events[0]).attachment!;
    expect(attachment).toEqual({ label: 'Fictional photo description only · no file stored', kind: 'image_description', stored: false });
    expect('url' in attachment).toBe(false);
    expect(ql293ReplyHelp(mms)).toContain('opt-out');
    expect(ql293ReplyHelp(sms)).toContain('Consent is unknown');
  });
});

describe('QL-293 accessible timeline and unsent composer workflow', () => {
  it('shows event state, provenance, contextual help and attachment descriptions without real send controls', async () => {
    await inbox();
    expect(host.querySelector('[data-ql293-release="ql293-readable-timeline-contextual-help"]')).not.toBeNull();
    expect(host.querySelector('.ql293-event-details')?.textContent).toContain('State: INBOUND FIXTURE');
    expect(host.querySelector('.ql293-event-details')?.textContent).toContain('Source: SMS · simulated');
    await click('ⓘ Reply and consent help', '.ql293-contextual-reply button');
    expect(host.querySelector('#ql293-inbox-reply-help')?.textContent).toContain('opt-out');
    await click('Condition photo question', '.ql192-thread');
    expect(host.querySelector('.ql293-attachment')?.textContent).toContain('no media upload');
    expect(host.querySelector<HTMLButtonElement>('.ql192-composer button')?.disabled).toBe(true);
  });

  it('filters event kinds with an accessible clear state and no invented provider events', async () => {
    await inbox();
    await select('#ql293-event-filter', 'call_event');
    expect(host.querySelector('.ql293-timeline-empty')?.textContent).toContain('No fictional events match');
    await click('Show all events', '.ql293-timeline-empty button');
    expect(host.querySelectorAll('.ql293-event')).toHaveLength(2);
    expect(host.querySelector('#ql293-event-filter')).not.toBeNull();
  });

  it('automatically recovers a redacted UNSENT draft after view switching', async () => {
    await composer();
    await editDraft('Draft for alice@example.com: we can review this mock request.');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).not.toContain('alice@example.com');
    await select('#ql196-attachment', 'sample_photo');
    await inbox();
    await composer();
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toContain('[REDACTED EMAIL]');
    expect(host.querySelector<HTMLSelectElement>('#ql196-attachment')?.value).toBe('sample_photo');
    expect(host.querySelector('.ql293-recovery')?.textContent).toContain('Recovered an unsent draft');
    expect(host.querySelectorAll('.ql196-disabled button:disabled')).toHaveLength(3);
  });

  it('keeps separate fictional thread drafts and clears one without affecting the other', async () => {
    await composer();
    await editDraft('first unsent test');
    await select('#ql196-target', 'rd-mms');
    await editDraft('second unsent test');
    await select('#ql196-target', 'rd-sms');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toBe('first unsent test');
    await click('Clear draft', '.ql196-actions button');
    await select('#ql196-target', 'rd-mms');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toBe('second unsent test');
    await select('#ql196-target', 'rd-sms');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toContain('Demo draft:');
  });

  it('discards session drafts on business switching and keeps consent blocked', async () => {
    await composer();
    await editDraft('secret practice text for Rosie');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toContain('campground');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).not.toContain('secret practice');
    await click('ⓘ Why is this reply blocked?', '.ql293-reply-help button');
    expect(host.querySelector('#ql293-reply-help')?.textContent).toContain('opt-out');
    expect(host.textContent).toContain('DELIVERY BLOCKED');
  });

  it('never invokes fetch or browser storage while composing, recovering and filtering', async () => {
    await composer();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await editDraft('demo-only text');
    await inbox();
    await select('#ql293-event-filter', 'inbound');
    await composer();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('has labeled controls, 44px targets, visible focus and responsive accessibility styles', async () => {
    await inbox();
    expect(host.querySelector('label[for="ql293-event-filter"]')).not.toBeNull();
    await composer();
    expect(host.querySelector('label[for="ql196-text"]')).not.toBeNull();
    const css = readFileSync('src/operator/ql293-conversation-workflow.css', 'utf8');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 620px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
