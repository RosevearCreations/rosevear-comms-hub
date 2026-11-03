// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Ql297Omnichannel } from '../Ql297Omnichannel';
import { operatorOrganizations } from '../ql191Organizations';
import { stageQl293Draft } from '../ql293ConversationRecovery';
import { ql315DraftReadback, ql315MockDelivery } from '../ql315TimelinePresentation';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<Ql297Omnichannel organization={operatorOrganizations[0]} />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

function button(label: string): HTMLButtonElement {
  const element = [...host.querySelectorAll<HTMLButtonElement>('button')].find((candidate) => candidate.textContent?.includes(label));
  if (!element) throw new Error(`Missing action ${label}`);
  return element;
}
async function select(selector: string, value: string) {
  const element = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function click(label: string) { await act(async () => button(label).click()); }

describe('QL-315 synthetic delivery-state semantics and timeline accessibility', () => {
  it('describes four local states, never a verified delivered status', () => {
    expect(Object.keys(ql315MockDelivery)).toEqual(['RECEIVED_MOCK', 'FAILED_MOCK', 'BLOCKED_MOCK', 'RECOVERED_MOCK']);
    expect(new Set(Object.values(ql315MockDelivery).map((state) => state.tone)).size).toBe(4);
    expect(ql315MockDelivery.RECEIVED_MOCK.meaning).toContain('No customer delivery');
    expect(ql315MockDelivery.RECOVERED_MOCK.meaning).toContain('No SMS, email or provider retry');
    expect(host.querySelector('[aria-label="Mock delivery state guide"]')).not.toBeNull();
    expect(host.textContent).toContain('not a delivered customer message');
  });

  it('renders source-provenance and chronological numbered steps for failed and recovered mock receipts without outbound calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const storeSpy = vi.spyOn(Storage.prototype, 'setItem');
    await select('#ql297-event', 'ql297-rosiedazzlers-2');
    await click('Replay mock event');
    await click('Rehearse failed-event recovery');
    expect(host.querySelectorAll('.ql315-event-feed li')).toHaveLength(2);
    const [first, second] = [...host.querySelectorAll<HTMLElement>('.ql315-event-feed li')];
    expect(first.dataset.ql315State).toBe('FAILED_MOCK');
    expect(second.dataset.ql315State).toBe('RECOVERED_MOCK');
    expect(first.textContent).toContain('Step 1 of 2');
    expect(second.textContent).toContain('Step 2 of 2');
    expect(first.textContent).toContain('CHECKED_IN_SYNTHETIC/ql297-fixture-v1/rosiedazzlers/2');
    expect(second.textContent).toContain('attempt 2');
    await click('Rehearse failed-event recovery');
    expect(host.querySelectorAll('.ql315-event-feed li')).toHaveLength(2);
    await select('#ql297-filter', 'failed');
    expect(host.querySelectorAll('.ql315-event-feed li')).toHaveLength(1);
    await click('Clear local timeline');
    expect(host.querySelectorAll('.ql315-event-feed li')).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storeSpy).not.toHaveBeenCalled();
  });

  it('keeps blocking and source-state meaning visible without colour interpretation', async () => {
    await select('#ql297-event', 'ql297-rosiedazzlers-4');
    expect(button('Rehearse failed-event recovery').disabled).toBe(true);
    await click('Replay mock event');
    expect(host.querySelector('.ql315-event--blocked')?.textContent).toContain('Blocked for review');
    expect(host.querySelector('.ql315-event--blocked')?.textContent).toContain('MOCK_AUDIO_UNAVAILABLE');
    await click('ⓘ Help');
    expect(host.textContent).toContain('never provider delivery confirmations');
  });
});

describe('QL-315 scoped UNSENT recovery readback', () => {
  const input = { threadId: 'rd-sms', purpose: 'service' as const, templateId: 'acknowledge', text: 'Fictional reply', attachment: 'none' as const };
  it('separates empty, recoverable and stale context; never leaks invalid entry contents', () => {
    const drafts = stageQl293Draft({}, 'rosiedazzlers', input);
    expect(ql315DraftReadback({}, 'rosiedazzlers', input.threadId).state).toBe('empty');
    expect(ql315DraftReadback(drafts, 'rosiedazzlers', input.threadId).state).toBe('unsent');
    const foreign = ql315DraftReadback(drafts, 'icamp', input.threadId);
    expect(foreign.state).toBe('invalid');
    expect(JSON.stringify(foreign)).not.toContain(input.text);
    const malformed = { 'rd-sms': { ...drafts['rd-sms'], text: 'someone@example.com' } };
    expect(ql315DraftReadback(malformed, 'rosiedazzlers', input.threadId).state).toBe('invalid');
    expect(ql315DraftReadback(drafts, 'rosiedazzlers', 'rd-mms').state).toBe('empty');
  });

  it('retains accessible small-device, forced-colour and reduced-motion styles', () => {
    const css = readFileSync('src/operator/ql315-timeline-recovery.css', 'utf8');
    expect(css).toContain('@media(max-width:620px)');
    expect(css).toContain('@media(max-width:375px)');
    expect(css).toContain('@media(forced-colors:active)');
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
  });
});
