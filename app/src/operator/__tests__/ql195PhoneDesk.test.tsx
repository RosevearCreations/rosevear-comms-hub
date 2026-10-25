// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { mockKeypress, phoneEntries, phoneLineLabels } from '../ql195PhoneDesk';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(label: string, selector = 'button') {
  const target = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(label) || item.getAttribute('aria-label')?.includes(label));
  if (!target) throw new Error(`Missing button: ${label}`);
  await act(async () => target.click());
}
describe('QL-195 synthetic phone desk', () => {
  it('shows only company-linked fictional call records and line labels', () => {
    const ids = new Set<string>();
    for (const organization of ['rosiedazzlers','devilndove','icamp','yw'] as const) {
      expect(phoneLineLabels[organization]).toContain('sample');
      for (const entry of phoneEntries(organization)) {
        expect(entry.organizationId).toBe(organization);
        expect(['missed','voicemail']).toContain(entry.kind);
        expect(ids.has(entry.id)).toBe(false); ids.add(entry.id);
        expect(entry.description).toMatch(/Simulated|simulated/);
      }
      expect(phoneEntries(organization).length).toBeGreaterThan(0);
    }
  });
  it('limits mock keypad to supported keys and sixteen characters', () => {
    expect(mockKeypress('12', '3')).toBe('123');
    expect(mockKeypress('12', 'paste')).toBe('12');
    expect(mockKeypress('1'.repeat(16), '2')).toBe('1'.repeat(16));
  });
  it('offers functional keypad, filters, descriptions and linked inbox with all transport disabled', async () => {
    await click('Phone desk', '.ql172-nav-button');
    expect(host.querySelector('[data-ql195-release="ql195-phone-desk-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('Rosie Dazzlers · sample service line');
    expect(host.querySelector<HTMLButtonElement>('.ql195-blocked')?.disabled).toBe(true);
    await click('Mock key 4');
    expect(host.querySelector('.ql195-digits')?.textContent).toBe('4');
    await click('Read fictional call note');
    expect(host.textContent).toContain('Simulated missed inbound call');
    await click('Open inbox source');
    expect(host.querySelector('.ql192-inbox')).not.toBeNull();
  });
  it('resets keypad and isolates the displayed history when changing companies', async () => {
    await click('Phone desk', '.ql172-nav-button'); await click('Mock key 9');
    await click('Devil n Dove', '.ql172-brand');
    expect(host.querySelector('.ql195-digits')?.textContent).toBe('No digits entered');
    expect(host.textContent).toContain('Lost-wax ring commission');
    expect(host.textContent).not.toContain('Missed booking inquiry');
    expect(host.querySelector<HTMLButtonElement>('.ql195-details button:disabled')?.disabled).toBe(true);
  });
});
