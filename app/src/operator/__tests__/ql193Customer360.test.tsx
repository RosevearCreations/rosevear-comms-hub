// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { inboxForOrganization, type InboxThread } from '../ql192InboxFixtures';
import { customerChannelCount, customerForThread, customersForOrganization, customerThreads, restrictiveConsent, syntheticCustomerContexts } from '../ql193CustomerContexts';
import type { OrganizationId } from '../ql191Organizations';

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
  const found = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((button) => button.textContent?.includes(label));
  if (!found) throw Error(`Missing ${label} in ${selector}`);
  return found;
}

async function workspace(name: string) { await act(async () => buttonWith(name, '.ql172-nav-button').click()); }
async function company(name: string) { await act(async () => buttonWith(name, '.ql172-brand').click()); }
async function contact(name: string) { await act(async () => buttonWith(name, '.ql193-contact').click()); }
async function search(value: string) {
  const input = host.querySelector<HTMLInputElement>('#ql193-search')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('QL-193 authored contact identity boundaries', () => {
  it('links each external synthetic thread once, deliberately excludes internal notes, and uses unique IDs', () => {
    const seen = new Set<string>();
    const contactIds = new Set<string>();
    for (const organization of Object.keys(syntheticCustomerContexts) as OrganizationId[]) {
      const contacts = customersForOrganization(organization);
      const actual = inboxForOrganization(organization);
      for (const entry of contacts) {
        expect(entry.organizationId).toBe(organization);
        expect(entry.id).toMatch(/^(rd|dnd|camp|yw)-contact-/);
        expect(contactIds.has(entry.id)).toBe(false);
        contactIds.add(entry.id);
        for (const thread of customerThreads(organization, entry)) {
          expect(thread.contactLabel).toBe(entry.label);
          expect(thread.channel).not.toBe('internal');
          expect(seen.has(thread.id)).toBe(false);
          seen.add(thread.id);
          expect(customerForThread(organization, thread.id)?.id).toBe(entry.id);
        }
      }
      expect(actual.filter((thread) => thread.channel !== 'internal').every((thread) => seen.has(thread.id))).toBe(true);
      expect(actual.filter((thread) => thread.channel === 'internal').every((thread) => customerForThread(organization, thread.id) === undefined)).toBe(true);
    }
    expect(contactIds.size).toBe(13);
    expect(seen.size).toBe(17);
  });

  it('enforces explicit company scope even when fictional labels are similar', () => {
    const rosie = customersForOrganization('rosiedazzlers')[0];
    expect(rosie.label).toContain('customer A');
    expect(customerThreads('yw', rosie)).toEqual([]);
    expect(customerForThread('icamp', 'rd-sms')).toBeUndefined();
    expect(customerForThread('devilndove', 'yw-sms')).toBeUndefined();
    expect(customerForThread('rosiedazzlers', 'dnd-mms')).toBeUndefined();
    expect(customersForOrganization('yw').some((entry) => entry.id === rosie.id)).toBe(false);
    expect(customerThreads('rosiedazzlers', { ...rosie, threadIds: ['rd-email', 'yw-voicemail'] }).map((thread) => thread.id)).toEqual(['rd-sms', 'rd-mms']);
  });

  it('combines only explicit linked channels and chooses the most restrictive consent', () => {
    for (const org of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const) {
      const contact = customersForOrganization(org)[0];
      const threads = customerThreads(org, contact);
      expect(threads).toHaveLength(2);
      expect(customerChannelCount(threads)).toBe(2);
    }
    expect(restrictiveConsent(customerThreads('rosiedazzlers', customersForOrganization('rosiedazzlers')[0]))).toBe('opted_out');
    expect(restrictiveConsent(customerThreads('devilndove', customersForOrganization('devilndove')[0]))).toBe('opted_out');
    expect(restrictiveConsent(customerThreads('icamp', customersForOrganization('icamp')[0]))).toBe('unknown');
    expect(restrictiveConsent(customerThreads('yw', customersForOrganization('yw')[0]))).toBe('opted_out');
    const source = inboxForOrganization('rosiedazzlers')[0];
    const synthetic = (consent: InboxThread['consent']): InboxThread => ({ ...source, consent });
    expect(restrictiveConsent([synthetic('service_only'), synthetic('unknown')])).toBe('unknown');
    expect(restrictiveConsent([synthetic('service_only')])).toBe('service_only');
    expect(restrictiveConsent([synthetic('opted_out'), synthetic('service_only')])).toBe('opted_out');
    expect(restrictiveConsent([])).toBe('unknown');
  });
});

describe('QL-193 functional Customer 360 and inbox navigation', () => {
  it('opens the accessible fictional directory with source trace and restrictive banner', async () => {
    await workspace('Customer 360');
    const view = host.querySelector('.ql193-customer-360')!;
    expect(view.getAttribute('data-ql193-release')).toBe('ql193-customer-360-cross-channel-v1');
    expect(view.getAttribute('data-organization')).toBe('rosiedazzlers');
    expect(view.querySelectorAll('.ql193-contact')).toHaveLength(4);
    expect(view.querySelectorAll('.ql193-source')).toHaveLength(2);
    expect(view.textContent).toContain('DISABLED CUSTOMER 360 PREVIEW');
    expect(view.textContent).toContain('Manually linked in the test fixture');
    expect(view.textContent).toContain('Marketing is prohibited');
    expect(view.textContent).toContain('Interior salt-stain question');
    expect(view.textContent).toContain('Condition photo question');
    expect(view.querySelectorAll('.ql193-disabled-actions button:disabled')).toHaveLength(3);
  });

  it('searches across contact and linked conversation topics; filters and recovers', async () => {
    await workspace('Customer 360');
    await search('fleet');
    expect(host.querySelectorAll('.ql193-contact')).toHaveLength(1);
    expect(host.querySelector('.ql193-profile')?.textContent).toContain('Fleet detailing schedule');
    await search('nothing-matches-this');
    expect(host.querySelector('.ql193-empty')?.textContent).toContain('No contacts match');
    await act(async () => buttonWith('Clear contact filters', '.ql193-empty button').click());
    expect(host.querySelectorAll('.ql193-contact')).toHaveLength(4);
    await act(async () => buttonWith('Multiple channels', '.ql193-filters button').click());
    expect(host.querySelectorAll('.ql193-contact')).toHaveLength(1);
    expect(host.querySelector('.ql193-profile')?.textContent).toContain('Condition photo question');
    await act(async () => buttonWith('Needs attention', '.ql193-filters button').click());
    expect(host.querySelectorAll('.ql193-contact')).toHaveLength(4);
  });

  it('shows per-contact source threads and switches profiles without identity mixing', async () => {
    await workspace('Customer 360');
    await contact('Demo detailing customer C');
    const profile = host.querySelector('.ql193-profile')!;
    expect(profile.querySelectorAll('.ql193-source')).toHaveLength(1);
    expect(profile.textContent).toContain('Ceramic coating estimate');
    expect(profile.textContent).not.toContain('Interior salt-stain question');
  });

  it('opens Customer 360 directly from the selected inbox thread', async () => {
    await workspace('Unified inbox');
    await act(async () => buttonWith('Condition photo question', '.ql192-thread').click());
    await act(async () => buttonWith('Open Customer 360', '.ql192-contact-link button').click());
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Customer 360');
    expect(host.querySelector('.ql193-profile h4')?.textContent).toContain('Demo detailing customer A');
    expect(host.querySelectorAll('.ql193-source')).toHaveLength(2);
  });

  it('returns from a selected contact source to the correct inbox thread', async () => {
    await workspace('Customer 360');
    await act(async () => buttonWith('View in unified inbox: Condition photo question', '.ql193-source button').click());
    expect(host.querySelector('[aria-current="page"]')?.textContent).toContain('Unified inbox');
    expect(host.querySelector('.ql192-detail-header h4')?.textContent).toContain('Condition photo question');
    expect(host.querySelector('.ql192-contact-link')?.textContent).toContain('Demo detailing customer A');
  });

  it('switches organizations with no profile carry-over, including iCamp and YW', async () => {
    await workspace('Customer 360');
    await contact('Demo fleet contact E');
    await company('iCamp');
    expect(host.querySelector('.ql193-customer-360')?.getAttribute('data-organization')).toBe('icamp');
    expect(host.querySelectorAll('.ql193-contact')).toHaveLength(3);
    expect(host.textContent).toContain('Demo campground guest A');
    expect(host.textContent).not.toContain('Demo fleet contact E');
    expect(host.querySelectorAll('.ql193-source')).toHaveLength(2);
    await company('YW');
    expect(host.querySelector('.ql193-customer-360')?.getAttribute('data-organization')).toBe('yw');
    expect(host.querySelector('.ql193-profile')?.textContent).toContain('Snow plow service window');
    expect(host.querySelector('.ql193-profile')?.textContent).toContain('Lawn care renewal');
    expect(host.querySelector('.ql193-profile')?.textContent).not.toContain('Tent-site availability');
  });

  it('does not create false customer profiles for internal-only team notes', async () => {
    await company('Devil n Dove');
    await workspace('Unified inbox');
    await act(async () => buttonWith('Check material availability', '.ql192-thread').click());
    expect(host.querySelector('.ql192-detail-panel')?.textContent).toContain('no customer profile');
    expect(host.querySelector('.ql192-contact-link')).toBeNull();
  });

  it('uses no browser or server writes while searching, navigating, or reading contact context', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await workspace('Customer 360');
    await search('salt');
    await act(async () => buttonWith('Help', '.ql193-header button').click());
    expect(host.textContent).toContain('Names are never used for automatic matching');
    await company('YW');
    await act(async () => buttonWith('View in unified inbox: Snow plow service window', '.ql193-source button').click());
    expect(write).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('supports keyboard focus and responsive, forced-colour customer panels', async () => {
    await workspace('Customer 360');
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
    expect(host.querySelector('label[for="ql193-search"]')).not.toBeNull();
    const css = readFileSync('src/operator/ql193-customer-360.css', 'utf8');
    expect(css).toContain('@media (max-width: 620px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain(':focus-visible');
  });
});
