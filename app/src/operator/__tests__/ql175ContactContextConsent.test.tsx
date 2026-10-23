// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql175ContactContextPreview } from '../Ql175ContactContextPreview';
import {
  QL175_CHANNELS, findQl175DuplicateCandidates, getQl175BrandContacts, simulateQl175OptOut
} from '../ql175ContactContextConsent';

const result = migrateQl173SyntheticFixtures();

describe('QL-175 verified synthetic contact and consent model', () => {
  it('links exactly three per-brand synthetic profiles to conversation, task and intake data without leaking other brands', () => {
    expect(result.verified).toBe(true);
    const rosie = getQl175BrandContacts(result, 'rosiedazzlers');
    const devil = getQl175BrandContacts(result, 'devilndove');
    expect(rosie).toHaveLength(3);
    expect(devil).toHaveLength(3);
    expect(new Set([...rosie, ...devil].map(contact => contact.id)).size).toBe(6);
    expect(rosie.every(contact => contact.brandId === 'rosiedazzlers' && contact.syntheticOnly && !contact.identityVerified)).toBe(true);
    expect(devil.every(contact => contact.brandId === 'devilndove' && contact.syntheticOnly && !contact.identityVerified)).toBe(true);
    expect(rosie.flatMap(contact => contact.conversations)).toHaveLength(3);
    expect(devil.flatMap(contact => contact.conversations)).toHaveLength(3);
    expect(rosie.flatMap(contact => contact.followUps)).toHaveLength(1);
    expect(devil.flatMap(contact => contact.followUps)).toHaveLength(1);
    expect(rosie.flatMap(contact => contact.intakes)).toHaveLength(1);
    expect(devil.flatMap(contact => contact.intakes)).toHaveLength(0);
    expect(rosie.flatMap(contact => contact.conversations).some(conversation => conversation.draftState === 'UNSENT_SIMULATED')).toBe(true);
    expect(rosie.map(contact => contact.label).join(' ')).not.toMatch(/Custom order|Maker story/);
    expect(devil.map(contact => contact.label).join(' ')).not.toMatch(/Ceramic|SUV interior/);
  });

  it('defaults every synthetic channel to UNKNOWN; absence of proof never implies consent granted', () => {
    for (const brand of ['rosiedazzlers', 'devilndove'] as const) {
      const profiles = getQl175BrandContacts(result, brand);
      expect(profiles.flatMap(profile => profile.consent)).toHaveLength(9);
      for (const profile of profiles) {
        expect(profile.consent.map(consent => consent.channel)).toEqual([...QL175_CHANNELS]);
        expect(profile.consent.every(consent => consent.state === 'unknown' && consent.provenance === 'NO_CONSENT_EVIDENCE')).toBe(true);
        expect(profile.consent.every(consent => !consent.verifiedGrant && !consent.dispatchAllowed)).toBe(true);
      }
    }
    expect(result.snapshot.contacts.every(contact => !contact.phone && !contact.email && !contact.town)).toBe(true);
    expect(result.snapshot.messages.every(message => !message.humanApproved)).toBe(true);
  });

  it('only identifies same-brand normalized synthetic names as candidate duplicates, never as auto-merges', () => {
    const candidates = findQl175DuplicateCandidates([
      { id: 'a', brandId: 'rosiedazzlers', label: 'Sample   Repeat-Contact' },
      { id: 'b', brandId: 'rosiedazzlers', label: 'sample repeat contact' },
      { id: 'c', brandId: 'devilndove', label: 'SAMPLE REPEAT CONTACT' },
      { id: 'd', brandId: 'rosiedazzlers', label: 'Unknown' },
      { id: 'e', brandId: 'rosiedazzlers', label: 'Another sample' }
    ], 'rosiedazzlers');
    expect(candidates).toEqual([
      { contactId: 'a', otherId: 'b', reason: 'same_normalized_synthetic_label', action: 'REVIEW_ONLY_NO_MERGE' },
      { contactId: 'b', otherId: 'a', reason: 'same_normalized_synthetic_label', action: 'REVIEW_ONLY_NO_MERGE' }
    ]);
    expect(findQl175DuplicateCandidates([{ id: 'x', brandId: 'devilndove', label: 'Unknown' }], 'devilndove')).toEqual([]);
    expect(getQl175BrandContacts(result, 'rosiedazzlers').every(contact => contact.duplicates.length === 0)).toBe(true);
  });

  it('simulates only opt-out/reset in memory, never opt-in, approval, send or canonical mutation', () => {
    const contactId = getQl175BrandContacts(result, 'rosiedazzlers')[0].id;
    const priorSnapshot = JSON.stringify(result.snapshot);
    const previous = {};
    const opted = simulateQl175OptOut(result, 'rosiedazzlers', previous, contactId, 'sms', 'opt_out');
    expect(previous).toEqual({});
    expect(opted[contactId]).toEqual({ brandId: 'rosiedazzlers', optedOut: ['sms'] });
    const modeled = getQl175BrandContacts(result, 'rosiedazzlers', opted).find(contact => contact.id === contactId)!;
    expect(modeled.consent.find(consent => consent.channel === 'sms')).toMatchObject({ state: 'opted_out', provenance: 'LOCAL_SIMULATION_ONLY', verifiedGrant: false, dispatchAllowed: false });
    expect(modeled.consent.filter(consent => consent.state === 'unknown')).toHaveLength(2);
    const reset = simulateQl175OptOut(result, 'rosiedazzlers', opted, contactId, 'sms', 'reset');
    expect(getQl175BrandContacts(result, 'rosiedazzlers', reset).find(contact => contact.id === contactId)?.consent.every(consent => consent.state === 'unknown')).toBe(true);
    expect(JSON.stringify(result.snapshot)).toBe(priorSnapshot);
  });

  it('rejects forged grants, unknown IDs, other-brand contacts and invalid fixture provenance', () => {
    const rosieId = getQl175BrandContacts(result, 'rosiedazzlers')[0].id;
    const devilId = getQl175BrandContacts(result, 'devilndove')[0].id;
    const previous = {};
    expect(simulateQl175OptOut(result, 'rosiedazzlers', previous, devilId, 'sms', 'opt_out')).toBe(previous);
    expect(simulateQl175OptOut(result, 'rosiedazzlers', previous, 'not-a-contact', 'sms', 'opt_out')).toBe(previous);
    expect(simulateQl175OptOut(result, 'rosiedazzlers', previous, rosieId, 'fax' as 'sms', 'opt_out')).toBe(previous);
    expect(simulateQl175OptOut(result, 'rosiedazzlers', previous, rosieId, 'sms', 'grant' as 'reset')).toBe(previous);
    expect(simulateQl175OptOut({ ...result, verified: false }, 'rosiedazzlers', previous, rosieId, 'sms', 'opt_out')).toBe(previous);
    const bad = structuredClone(result);
    bad.snapshot.contacts[0].name = 'Someone real';
    expect(getQl175BrandContacts(bad, 'rosiedazzlers')).toEqual([]);
    // Even a forged overlay can only express a local opt-out, never permission.
    const forged = { [rosieId]: { brandId: 'rosiedazzlers' as const, optedOut: ['granted' as 'sms'] } };
    expect(getQl175BrandContacts(result, 'rosiedazzlers', forged).flatMap(contact => contact.consent).every(consent => !consent.dispatchAllowed && consent.state === 'unknown')).toBe(true);
  });
});

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql175ContactContextPreview brandId="rosiedazzlers" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find(node => node.textContent?.includes(label));
  if (!button) throw new Error(`Missing button ${label}`);
  await act(async () => button.click());
}

describe('QL-175 accessible disabled-only contact preview', () => {
  it('renders three synthetic contacts, explicit unknown consent and traceable histories', () => {
    expect(host.querySelectorAll('.ql175-contact')).toHaveLength(3);
    expect(host.querySelectorAll('.ql175-channel')).toHaveLength(3);
    expect(host.textContent).toContain('UNKNOWN · NO EVIDENCE');
    expect(host.textContent).toContain('UNKNOWN never means GRANTED');
    expect(host.textContent).toContain('DISABLED PREVIEW · NO OUTBOUND PERMISSION');
    expect(host.textContent).toContain('Linked conversation history');
    expect(host.textContent).toContain('Possible duplicates · review only');
    expect(host.textContent).not.toContain('Send SMS');
  });

  it('stages opt-out and reset without a network request, storage write, or actual consent update', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network forbidden'));
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await click('Simulate opt-out', '.ql175-channel button');
    expect(host.textContent).toContain('OPTED OUT · SIMULATED');
    expect(host.textContent).toContain('Screen-only example; no actual consent record changed.');
    await click('Reset to unknown', '.ql175-channel button');
    expect(host.textContent).not.toContain('OPTED OUT · SIMULATED');
    expect(host.textContent).toContain('Reset SMS to UNKNOWN');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('switches business safely and clears staged consent state', async () => {
    await click('Simulate opt-out', '.ql175-channel button');
    await act(async () => root.render(<Ql175ContactContextPreview brandId="devilndove" />));
    expect(host.querySelectorAll('.ql175-contact')).toHaveLength(3);
    expect(host.textContent).toContain('Devil n Dove');
    expect(host.textContent).not.toContain('Ceramic quote follow-up');
    expect(host.textContent).not.toContain('OPTED OUT · SIMULATED');
    await act(async () => root.render(<Ql175ContactContextPreview brandId="rosiedazzlers" />));
    expect(host.textContent).not.toContain('OPTED OUT · SIMULATED');
    expect(host.textContent).toContain('Synthetic contact view changed business');
  });

  it('has labelled selection, keyboard focus rules and responsive/forced-colour layouts', () => {
    expect(host.querySelector('section[aria-label="Synthetic contact list"]')).not.toBeNull();
    expect(host.querySelector('section[aria-label="Channel-specific synthetic consent states"]')).not.toBeNull();
    expect(host.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    const css = readFileSync('src/operator/ql175-contact-context.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 660px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('min-height: 44px');
  });
});
