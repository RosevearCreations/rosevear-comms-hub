// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { draftGate, effectiveDemoConsent, MAX_DEMO_CHARACTERS, messageTargets, messageTemplates, sanitizeDemoDraft } from '../ql196MessagePolicy';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(label));
  if (!button) throw Error(`Button missing: ${label}`);
  await act(async () => button.click());
}
async function select(selector: string, value: string) {
  const element = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })); });
}
describe('QL-196 consent and synthetic draft invariants', () => {
  it('limits all four business sample recipients to in-scope SMS/MMS fixtures and unique templates', () => {
    const seen = new Set<string>();
    for (const org of ['rosiedazzlers','devilndove','icamp','yw'] as const) {
      expect(messageTemplates(org)).toHaveLength(2);
      expect(messageTargets(org).length).toBeGreaterThan(0);
      for (const entry of messageTargets(org)) {
        expect(entry.organizationId).toBe(org);
        expect(['sms','mms']).toContain(entry.channel);
        expect(seen.has(entry.id)).toBe(false);
        seen.add(entry.id);
      }
    }
  });
  it('does not weaken an opt-out found on another linked channel', () => {
    expect(effectiveDemoConsent('rosiedazzlers', 'rd-sms')).toBe('opted_out');
    expect(draftGate('rosiedazzlers', 'rd-sms', 'service').label).toContain('Opt-out');
    expect(draftGate('devilndove', 'dnd-sms', 'marketing').label).toContain('Opt-out');
    expect(draftGate('icamp', 'camp-sms', 'marketing').label).toContain('No verified express');
    expect(draftGate('yw', 'rd-sms', 'service').label).toContain('Invalid');
    expect(draftGate('yw', 'yw-sms', 'service').allowed).toBe(false);
    expect(sanitizeDemoDraft('x'.repeat(1000))).toHaveLength(MAX_DEMO_CHARACTERS);
  });
});
describe('QL-196 operator composer', () => {
  it('renders an unsent template composer and never activates transport or file upload', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await click('SMS/MMS composer', '.ql172-nav-button');
    expect(host.querySelector('[data-ql196-release="ql196-sms-mms-composer-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('Opt-out on linked sample contact');
    expect(host.querySelector<HTMLInputElement>('input[type="file"]')).toBeNull();
    expect(host.querySelectorAll('.ql196-disabled button:disabled')).toHaveLength(3);
    await click('Review unsent preview');
    expect(host.querySelector('.ql196-preview')?.textContent).toContain('NOT SENT');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('changes templates and attachment descriptions without uploading or sending', async () => {
    await click('SMS/MMS composer', '.ql172-nav-button');
    await select('#ql196-template', 'followup');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toContain('weather conditions');
    await select('#ql196-attachment', 'sample_photo');
    await click('Review unsent preview');
    expect(host.querySelector('.ql196-preview')?.textContent).toContain('fictional image placeholder');
    await click('Clear draft');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toBe('');
  });
  it('navigates from inbox SMS and clears drafts on company change', async () => {
    await click('Unified inbox', '.ql172-nav-button');
    await click('Open unsent SMS/MMS composer');
    expect(host.querySelector('[data-ql196-release]')).not.toBeNull();
    await click('Devil n Dove', '.ql172-brand');
    expect(host.querySelector<HTMLTextAreaElement>('#ql196-text')?.value).toContain('custom project idea');
    expect(host.textContent).not.toContain('Demo detailing customer A');
  });
});
