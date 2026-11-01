// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { applyQueueAction, seedQueueForOrganization } from '../ql194WorkQueue';
import { customerThreads, customersForOrganization } from '../ql193CustomerContexts';
import { candidateForContact, candidatePeer, duplicateCandidates, ql295ConsentPosture, ql295PermissionGate, ql295TasksForContact, reviewQl295Candidate, seedQl295Review } from '../ql295ContactReview';

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
function button(label: string, selector = 'button'): HTMLButtonElement {
  const item = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((entry) => entry.textContent?.includes(label));
  if (!item) throw Error(`Missing button ${label}`);
  return item;
}
async function click(label: string, selector?: string) { await act(async () => button(label, selector).click()); }
async function choose(selector: string, value: string) {
  const item = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { item.value = value; item.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-295 brand-safe source and identity boundaries', () => {
  it('only offers explicitly authored company-local possible candidates, never confirmed matches', () => {
    for (const organization of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const) {
      const [candidate] = duplicateCandidates(organization);
      expect(duplicateCandidates(organization)).toHaveLength(1);
      expect(candidate.organizationId).toBe(organization);
      expect(candidate.leftId).not.toBe(candidate.rightId);
      const contacts = customersForOrganization(organization);
      expect(contacts.some((contact) => contact.id === candidate.leftId)).toBe(true);
      expect(contacts.some((contact) => contact.id === candidate.rightId)).toBe(true);
      expect(candidatePeer(organization, candidate, candidate.leftId)?.id).toBe(candidate.rightId);
      expect(candidatePeer(organization, candidate, 'fabricated-id')).toBeUndefined();
      expect(candidateForContact(organization, 'invented')).toBeUndefined();
    }
    expect(candidatePeer('yw', duplicateCandidates('rosiedazzlers')[0], 'rd-contact-a')).toBeUndefined();
  });

  it('permits only unsigned local review dispositions and rejects cross-business or confirmation attempts', () => {
    const initial = seedQl295Review('rosiedazzlers');
    const candidateId = 'rd-possible-1';
    expect(reviewQl295Candidate('icamp', initial, candidateId, 'deferred')).toBe(initial);
    expect(reviewQl295Candidate('rosiedazzlers', initial, 'yw-possible-1', 'deferred')).toBe(initial);
    expect(reviewQl295Candidate('rosiedazzlers', initial, candidateId, 'confirmed-merge' as never)).toBe(initial);
    const deferred = reviewQl295Candidate('rosiedazzlers', initial, candidateId, 'deferred');
    expect(deferred.reviews).toEqual([{ candidateId, disposition: 'deferred', sequence: 1 }]);
    expect(reviewQl295Candidate('rosiedazzlers', deferred, candidateId, 'deferred')).toBe(deferred);
    const cleared = reviewQl295Candidate('rosiedazzlers', deferred, candidateId, 'not-duplicate');
    expect(cleared.reviews).toEqual([{ candidateId, disposition: 'not-duplicate', sequence: 2 }]);
    expect(initial.reviews).toEqual([]);
  });

  it('derives tasks from exact linked source IDs and the active organization only', () => {
    const contact = customersForOrganization('rosiedazzlers')[0];
    const state = seedQueueForOrganization('rosiedazzlers');
    expect(ql295TasksForContact('rosiedazzlers', contact, state).map((task) => task.id)).toEqual(['rd-task-2']);
    expect(ql295TasksForContact('icamp', contact, state)).toEqual([]);
    expect(ql295TasksForContact('rosiedazzlers', contact, seedQueueForOrganization('yw'))).toEqual([]);
    const created = applyQueueAction('rosiedazzlers', state, { kind: 'create', threadId: 'rd-mms' });
    expect(ql295TasksForContact('rosiedazzlers', contact, created)).toHaveLength(2);
    expect(ql295TasksForContact('rosiedazzlers', { ...contact, threadIds: ['yw-sms'] }, created)).toHaveLength(2);
  });

  it('never grants marketing on opt-out, unknown, service-only or unlinked sources', () => {
    expect(Object.values(ql295PermissionGate)).toEqual([false, false, false, false, false]);
    for (const organization of ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const) {
      for (const contact of customersForOrganization(organization)) {
        const posture = ql295ConsentPosture(customerThreads(organization, contact));
        expect(posture.marketingAllowed).toBe(false);
        expect(posture.sources).toHaveLength(contact.threadIds.length);
        expect(['opted_out', 'unknown', 'service_only']).toContain(posture.effective);
      }
    }
    expect(ql295ConsentPosture([])).toMatchObject({ effective: 'unknown', marketingAllowed: false });
    const sources = customerThreads('rosiedazzlers', customersForOrganization('rosiedazzlers')[0]);
    expect(ql295ConsentPosture(sources).effective).toBe('opted_out');
    expect(ql295ConsentPosture([{ ...sources[0], consent: 'service_only' }]).effective).toBe('service_only');
    expect(ql295ConsentPosture([{ ...sources[0], consent: 'unknown' }]).effective).toBe('unknown');
  });
});

describe('QL-295 Contact 360 operator review', () => {
  it('presents worklist links, per-channel consent context and possible-only duplicate review', async () => {
    await click('Customer 360', '.ql172-nav-button');
    const view = host.querySelector('.ql193-customer-360')!;
    expect(view.getAttribute('data-ql295-release')).toBe('ql295-brand-safe-contact-consent-duplicate-review-v1');
    expect(view.querySelectorAll('.ql295-preferences li')).toHaveLength(2);
    expect(view.querySelector('.ql295-preferences')?.textContent).toContain('OPTED OUT — no marketing');
    expect(view.querySelector('.ql295-tasks')?.textContent).toContain('Review winter salt-stain reply');
    expect(view.querySelector('.ql295-duplicates')?.textContent).toContain('0 confirmed matches');
    expect(view.querySelector('.ql295-duplicates')?.textContent).toContain('NOT a confirmed duplicate');
    expect(view.querySelector('[data-ql295-permission="denied"]')?.textContent).toContain('0 of 5 live capabilities enabled');
    expect(view.querySelectorAll('.ql193-disabled-actions button:disabled')).toHaveLength(3);
  });

  it('retains local review across navigation, leaves assignments in their current state and resets when company changes', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await click('Customer 360', '.ql172-nav-button');
    await click('Needs independent check', '.ql295-review-actions button');
    expect(host.querySelector('.ql295-duplicates [role="status"]')?.textContent).toContain('needs independent check · demo step 1');
    await click('Open assignment', '.ql295-tasks button');
    expect(host.querySelector('.ql194-details h4')?.textContent).toContain('winter salt-stain reply');
    await choose('#ql194-status', 'done');
    await click('Customer 360', '.ql172-nav-button');
    expect(host.querySelector('.ql295-tasks')?.textContent).toContain('0 active / 1 sample tasks');
    expect(host.querySelector('.ql295-duplicates [role="status"]')?.textContent).toContain('needs independent check');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('.ql295-duplicates [role="status"]')?.textContent).toContain('not reviewed');
    expect(host.querySelector('.ql295-duplicates')?.textContent).not.toContain('Demo detailing customer');
    expect(write).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows no fabricated duplicate for unrelated profiles and allows deferral without merge', async () => {
    await click('Customer 360', '.ql172-nav-button');
    await click('Demo fleet contact E', '.ql193-contact');
    expect(host.querySelector('.ql295-duplicates')?.textContent).toContain('No candidate is authored');
    await click('Demo detailing customer A', '.ql193-contact');
    await click('Defer review', '.ql295-review-actions button');
    expect(host.querySelector('.ql295-duplicates [role="status"]')?.textContent).toContain('deferred · demo step 1');
    expect(host.querySelector('.ql295-duplicates')?.textContent).toContain('UNSIGNED / NOT MERGED');
  });

  it('retains keyboard labels, focus and responsive/forced-colours protections', async () => {
    await click('Customer 360', '.ql172-nav-button');
    expect(document.activeElement).toBe(host.querySelector('.ql172-context h2'));
    expect(host.querySelectorAll('.ql295-review-actions button[aria-pressed]')).toHaveLength(3);
    const css = readFileSync('src/operator/ql193-customer-360.css', 'utf8');
    expect(css).toContain('@media (max-width:620px)');
    expect(css).toContain('@media (forced-colors:active)');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
