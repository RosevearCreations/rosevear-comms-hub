// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql182SyntheticJourneyPreview } from '../Ql182SyntheticJourneyPreview';
import { assessQl182Journey, getQl182InboundChoices, QL182_STAGES, QL182_VERSION } from '../ql182SyntheticJourneyAcceptance';

const migration = migrateQl173SyntheticFixtures();
const brands = ['rosiedazzlers', 'devilndove'] as const;
const voice = (brandId: typeof brands[number]) => getQl182InboundChoices(migration, brandId)
  .find(row => row.event.kind === 'inbound_call')!;

describe('QL-182 cross-brand operator acceptance contract', () => {
  it('uses verified pinned QL-173 examples with one inbound voice and SMS scenario per business', () => {
    expect(migration.verified).toBe(true);
    for (const brand of brands) {
      const options = getQl182InboundChoices(migration, brand);
      expect(options.map(row => row.event.kind)).toEqual(['inbound_call', 'inbound_sms']);
      expect(options.every(row => row.event.brandId === brand && row.transport === 'IN_MEMORY_ONLY')).toBe(true);
    }
  });

  for (const brand of brands) {
    it(`${brand}: reconciles event → inbox → contact → timeline → unsent draft → intake → task → route → receipt → hold`, () => {
      const result = assessQl182Journey(migration, brand, voice(brand));
      expect(result).toMatchObject({ version: QL182_VERSION, disposition: 'SYNTHETIC_ACCEPTED_LIVE_HELD',
        brandId: brand, eventId: voice(brand).event.id, syntheticOnly: true, liveCalls: 0, sentMessages: 0,
        externalWrites: 0, ownerApprovals: 0, livePilotAuthorized: false, heldPrerequisites: 12 });
      expect(result.steps.map(row => row.id)).toEqual(QL182_STAGES);
      expect(result.steps.filter(row => row.outcome === 'VERIFIED_SIMULATED')).toHaveLength(9);
      expect(result.steps.at(-1)).toMatchObject({ outcome: 'HELD_FOR_LIVE_PILOT' });
      expect(result.steps.find(row => row.id === 'receipt')?.evidence).toContain('duplicate ignored');
      expect(result.steps.find(row => row.id === 'draft')?.evidence).toContain('UNSENT_SIMULATED');
      expect(result.steps.find(row => row.id === 'intake')?.evidence).toContain('READY_FOR_INTERNAL_REVIEW_SIMULATED');
    });

    it(`${brand}: inbound SMS is accepted without pretending a telephone IVR ran`, () => {
      const sms = getQl182InboundChoices(migration, brand).find(row => row.event.kind === 'inbound_sms')!;
      const result = assessQl182Journey(migration, brand, sms);
      expect(result.disposition).toBe('SYNTHETIC_ACCEPTED_LIVE_HELD');
      expect(result.steps.find(row => row.id === 'routing')).toMatchObject({ outcome: 'NOT_APPLICABLE_SIMULATED' });
      expect(result.sentMessages).toBe(0);
    });

    it(`${brand}: recomputes identical acceptance without source mutation or browser persistence`, () => {
      const before = JSON.stringify(migration.snapshot);
      const one = assessQl182Journey(migration, brand, voice(brand));
      const two = assessQl182Journey(migration, brand, voice(brand));
      expect(one).toEqual(two);
      expect(JSON.stringify(migration.snapshot)).toBe(before);
    });
  }

  it('denies cross-brand inbound event and never surfaces another brand’s content', () => {
    for (const brand of brands) {
      const foreign = brand === 'rosiedazzlers' ? 'devilndove' : 'rosiedazzlers';
      const result = assessQl182Journey(migration, brand, voice(foreign));
      expect(result).toMatchObject({ disposition: 'DENIED_UNVERIFIED_SOURCE', brandId: null,
        eventId: null, conversationId: null, sourceLabel: '', steps: [], livePilotAuthorized: false });
    }
  });

  it('denies fabricated, outbound, duplicate-field and mutated event payloads', () => {
    const original = voice('rosiedazzlers');
    const outbound = getQl182InboundChoices(migration, 'rosiedazzlers').find(row => row.event.direction === 'outbound_intent');
    expect(outbound).toBeUndefined();
    for (const candidate of [null, {}, { ...original, signatureState: 'VERIFIED' },
      { ...original, secret: 'untrusted-extra-field' },
      { ...original, event: { ...original.event, kind: 'outbound_sms_intent' } },
      { ...original, event: { ...original.event, conversationId: voice('devilndove').event.conversationId } },
      { ...original, event: { ...original.event, mode: 'LIVE' } }
    ]) {
      const result = assessQl182Journey(migration, 'rosiedazzlers', candidate);
      expect(result.disposition).toBe('DENIED_UNVERIFIED_SOURCE');
      expect(result.steps).toHaveLength(0);
      expect(result.liveCalls).toBe(0);
    }
  });

  it('denies unverified, tampered or missing canonical snapshots and unsupported brands', () => {
    expect(assessQl182Journey({ ...migration, verified: false }, 'rosiedazzlers', voice('rosiedazzlers')).steps).toHaveLength(0);
    const poisoned = structuredClone(migration);
    poisoned.snapshot.messages[0].humanApproved = true;
    expect(assessQl182Journey(poisoned, 'rosiedazzlers', voice('rosiedazzlers')).disposition).toBe('DENIED_UNVERIFIED_SOURCE');
    expect(assessQl182Journey(migration, 'not-a-brand' as never, voice('rosiedazzlers')).disposition).toBe('DENIED_UNVERIFIED_SOURCE');
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql182SyntheticJourneyPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

describe('QL-182 accessible disabled operator walkthrough', () => {
  it('shows all ten selectable checkpoints, an active one and a permanently held pilot', () => {
    expect(host.textContent).toContain('Synthetic operator journey acceptance');
    expect(host.textContent).toContain('SYNTHETIC ACCEPTED LIVE HELD');
    expect(host.querySelectorAll('.ql182-step')).toHaveLength(10);
    expect(host.querySelectorAll('button[aria-current="step"]')).toHaveLength(1);
    expect(host.textContent).toContain('12 / 12 live-pilot prerequisites remain HELD');
    expect(host.textContent).toContain('Real calls: 0 · SMS sent: 0 · owner approvals: 0');
    expect(host.querySelector('label[for="ql182-scenario"]')).not.toBeNull();
  });

  it('navigates checkpoints with semantic buttons and restarts without dispatch', async () => {
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.ql182-actions button')];
    expect(buttons[0].disabled).toBe(true);
    await act(async () => buttons[1].click());
    expect(host.textContent).toContain('Checkpoint 2 / 10');
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.ql182-step')[9].click());
    expect(host.textContent).toContain('Checkpoint 10 / 10');
    expect(buttons[1].disabled).toBe(true);
    await act(async () => buttons[2].click());
    expect(host.textContent).toContain('Checkpoint 1 / 10');
  });

  it('switching to inbound SMS uses a non-voice routing outcome, resets progress', async () => {
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.ql182-step')[6].click());
    const select = host.querySelector<HTMLSelectElement>('#ql182-scenario')!;
    await act(async () => { select.value = getQl182InboundChoices(migration, 'rosiedazzlers')[1].event.id;
      select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.textContent).toContain('Checkpoint 1 / 10');
    expect(host.textContent).toContain('N/A (SMS)');
    expect(host.textContent).toContain('SYNTHETIC ACCEPTED LIVE HELD');
  });

  it('business remount drops the prior selection and displays only the active brand', async () => {
    await act(async () => root.render(<Ql182SyntheticJourneyPreview key="devilndove" brandId="devilndove" />));
    const labels = [...host.querySelectorAll<HTMLOptionElement>('#ql182-scenario option')].map(row => row.textContent);
    expect(labels).toHaveLength(2);
    expect(labels.join(' ')).toContain('maker inquiry');
    expect(labels.join(' ')).not.toContain('Rosie');
    expect(host.textContent).toContain('Devil n Dove');
    expect(host.textContent).toContain('SYNTHETIC ACCEPTED LIVE HELD');
  });

  it('walking the screen never writes storage or calls fetch', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await act(async () => host.querySelectorAll<HTMLButtonElement>('.ql182-step')[8].click());
    await act(async () => host.querySelector<HTMLButtonElement>('.ql182-actions button:last-child')!.click());
    expect(storage).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });
});
