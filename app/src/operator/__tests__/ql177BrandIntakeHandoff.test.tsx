// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql177BrandIntakeHandoffPreview } from '../Ql177BrandIntakeHandoffPreview';
import { getQl177BrandIntakes, getQl177Template, updateQl177Intake, validateQl177Fields } from '../ql177BrandIntakeHandoff';

const migration = migrateQl173SyntheticFixtures();

describe('QL-177 source-pinned brand-specific intake and review model', () => {
  it('offers six provenance-pinned, isolated samples and separate intake templates', () => {
    expect(migration.verified).toBe(true);
    const rosie = getQl177BrandIntakes(migration, 'rosiedazzlers');
    const maker = getQl177BrandIntakes(migration, 'devilndove');
    expect(rosie).toHaveLength(3);
    expect(maker).toHaveLength(3);
    expect(rosie.every(row => row.brandId === 'rosiedazzlers' && row.syntheticOnly && row.fixtureLabel)).toBe(true);
    expect(maker.every(row => row.brandId === 'devilndove' && row.syntheticOnly && row.fixtureLabel)).toBe(true);
    expect(new Set([...rosie, ...maker].map(row => row.conversationId)).size).toBe(6);
    expect(getQl177Template('rosiedazzlers').map(row => row.id)).toEqual(['vehicle_type', 'service', 'condition', 'photos', 'coverage']);
    expect(getQl177Template('devilndove').map(row => row.id)).toEqual(['technique', 'materials', 'reference', 'timing', 'specifications']);
    expect(rosie.every(row => !row.subject.includes('Custom engraved candle'))).toBe(true);
    expect(maker.every(row => !row.subject.includes('Ceramic quote'))).toBe(true);
  });

  it('reuses the original Rosie intake and both existing open follow-ups without writing a new record', () => {
    const rosie = getQl177BrandIntakes(migration, 'rosiedazzlers');
    const existing = rosie.find(row => row.linkedIntakeId);
    expect(existing).toMatchObject({
      intakeStatus: 'CANONICAL_NEEDS_REVIEW', linkedTaskTitle: 'Request interior photos before quote',
      fields: { vehicle_type: 'suv', service: 'interior', condition: 'pet_hair', photos: 'interior_needed' }
    });
    expect(existing?.linkedIntakeId).toMatch(/^syn-ql004-intake-/);
    expect(existing?.missingFields).toEqual([]);
    const maker = getQl177BrandIntakes(migration, 'devilndove');
    expect(maker.find(row => row.linkedTaskId)?.linkedTaskTitle).toBe('Confirm personalization text and deadline');
    expect(maker.every(row => row.linkedIntakeId === null && row.intakeStatus === 'DERIVED_PREVIEW_ONLY')).toBe(true);
    expect(rosie.filter(row => !row.linkedIntakeId)).toHaveLength(2);
  });

  it('blocks incomplete or invalid selections, with no quote, booking or monetary amount', () => {
    const defaults = Object.fromEntries(getQl177Template('devilndove').map(row => [row.id, 'not_provided']));
    expect(validateQl177Fields('devilndove', defaults)).toMatchObject({ valid: false, missingFields: ['Maker technique', 'Material family', 'Design / reference needs', 'Timing expectation'], issues: [] });
    expect(validateQl177Fields('devilndove', { ...defaults, materials: 'unapproved_material' }).issues).toContain('invalid materials selection');
    expect(validateQl177Fields('devilndove', { ...defaults, vehicle_type: 'suv' }).issues).toContain('unknown intake field: vehicle_type');
    expect(validateQl177Fields('invalid' as 'devilndove', {})).toMatchObject({ valid: false });
    const row = getQl177BrandIntakes(migration, 'devilndove')[0];
    expect(JSON.stringify(row)).not.toMatch(/priceCents|quotedAt|payment|ownerApproval/);
  });

  it('allows ephemeral, valid completion and only a simulated internal review handoff', () => {
    const row = getQl177BrandIntakes(migration, 'devilndove')[0];
    const original = JSON.stringify(migration.snapshot);
    let overlay = {};
    for (const [field, value] of Object.entries({ technique: 'candles', materials: 'wax', reference: 'wording_needed', timing: 'date_to_confirm' })) {
      overlay = updateQl177Intake(migration, 'devilndove', overlay, row.conversationId, 'edit', field, value);
    }
    const completed = getQl177BrandIntakes(migration, 'devilndove', overlay).find(value => value.id === row.id)!;
    expect(completed.missingFields).toEqual([]);
    expect(completed.reviewStatus).toBe('INCOMPLETE_SIMULATED');
    const staged = updateQl177Intake(migration, 'devilndove', overlay, row.conversationId, 'stage');
    expect(getQl177BrandIntakes(migration, 'devilndove', staged).find(value => value.id === row.id)?.reviewStatus).toBe('READY_FOR_INTERNAL_REVIEW_SIMULATED');
    expect(getQl177BrandIntakes(migration, 'rosiedazzlers', staged).every(value => value.reviewStatus === 'INCOMPLETE_SIMULATED')).toBe(true);
    expect(JSON.stringify(migration.snapshot)).toBe(original);
    expect(updateQl177Intake(migration, 'devilndove', staged, row.conversationId, 'reset')[row.conversationId]).toBeUndefined();
  });

  it('redacts notes before local state and does not treat editing as approval', () => {
    const row = getQl177BrandIntakes(migration, 'rosiedazzlers')[0];
    const staged = updateQl177Intake(migration, 'rosiedazzlers', {}, row.conversationId, 'stage');
    // Staging an incomplete row never changes the overlay; staging the existing seeded case may succeed.
    const updated = updateQl177Intake(migration, 'rosiedazzlers', staged, row.conversationId, 'edit', 'internal_note', 'sample.person@example.ca +1 (519) 555-0199 https://example.com/private sk_live_abcdefghij');
    const result = getQl177BrandIntakes(migration, 'rosiedazzlers', updated).find(value => value.id === row.id)!;
    expect(result.note).toContain('[REDACTED EMAIL]');
    expect(result.note).toContain('[REDACTED PHONE]');
    expect(result.note).toContain('[REDACTED URL]');
    expect(result.note).toContain('[REDACTED KEY]');
    expect(result.reviewStatus).toBe('INCOMPLETE_SIMULATED');
    expect(result.note).not.toContain('sample.person@example.ca');
  });

  it('fails closed for tampered fixture, wrong brand, invalid fields, unknown identities and forged approvals', () => {
    const rosieId = getQl177BrandIntakes(migration, 'rosiedazzlers')[0].conversationId;
    const makerId = getQl177BrandIntakes(migration, 'devilndove')[0].conversationId;
    const previous = {};
    expect(updateQl177Intake(migration, 'rosiedazzlers', previous, makerId, 'stage')).toBe(previous);
    expect(updateQl177Intake(migration, 'rosiedazzlers', previous, 'unknown', 'stage')).toBe(previous);
    expect(updateQl177Intake(migration, 'rosiedazzlers', previous, rosieId, 'send' as 'stage')).toBe(previous);
    expect(updateQl177Intake(migration, 'rosiedazzlers', previous, rosieId, 'edit', 'technique', 'candles')).toBe(previous);
    expect(updateQl177Intake(migration, 'rosiedazzlers', previous, rosieId, 'edit', 'vehicle_type', 'unrecognized')).toBe(previous);
    expect(updateQl177Intake({ ...migration, verified: false }, 'rosiedazzlers', previous, rosieId, 'stage')).toBe(previous);
    const changed = structuredClone(migration);
    changed.snapshot.messages[0].humanApproved = true;
    expect(getQl177BrandIntakes(changed, 'rosiedazzlers')).toEqual([]);
    const forged = { [rosieId]: { brandId: 'rosiedazzlers' as const, source: 'LOCAL_SCREEN_ONLY' as const, note: '', fields: {}, reviewStatus: 'APPROVED' as 'INCOMPLETE_SIMULATED' } };
    expect(getQl177BrandIntakes(migration, 'rosiedazzlers', forged).find(row => row.conversationId === rosieId)?.reviewStatus).toBe('INCOMPLETE_SIMULATED');
    expect(getQl177BrandIntakes(migration, 'devilndove', forged).every(row => row.brandId === 'devilndove')).toBe(true);
  });
});

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql177BrandIntakeHandoffPreview brandId="rosiedazzlers" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function click(text: string) {
  const node = [...host.querySelectorAll<HTMLButtonElement>('button')].find(element => element.textContent?.includes(text));
  if (!node) throw new Error(`No button contains ${text}`);
  await act(async () => node.click());
}

async function choose(id: string, value: string) {
  const select = host.querySelector<HTMLSelectElement>(`#ql177-${id}`);
  if (!select) throw new Error(`Missing field ${id}`);
  await act(async () => { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-177 disabled-preview brand intake operator UI', () => {
  it('renders three Rosie synthetic cases, linked follow-up, branded fields and visible safety boundaries', async () => {
    expect(host.querySelectorAll('.ql177-thread')).toHaveLength(3);
    expect(host.textContent).toContain('DISABLED PREVIEW · NO REAL QUOTES');
    expect(host.textContent).toContain('NO CUSTOMER QUOTE · NO BOOKING · NO PAYMENT · NO CUSTOMER EMAIL · NO OWNER APPROVAL');
    expect(host.querySelector('#ql177-vehicle_type')).not.toBeNull();
    expect(host.querySelector('#ql177-technique')).toBeNull();
    expect(host.textContent).toContain('Linked QL-004 intake');
    await click('SUV interior detail with pet hair');
    expect(host.textContent).toContain('Request interior photos before quote');
    expect(host.querySelector('input[type=file]')).toBeNull();
  });

  it('blocks incomplete samples, stages only in screen memory, then resets without network or storage writes', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    await click('Ceramic quote follow-up');
    expect(host.querySelector<HTMLButtonElement>('.ql177-stage')?.disabled).toBe(true);
    expect(host.textContent).toContain('BLOCKED — missing:');
    await choose('vehicle_type', 'suv');
    await choose('service', 'ceramic_review');
    await choose('condition', 'moderate');
    await choose('photos', 'exterior_needed');
    expect(host.querySelector<HTMLButtonElement>('.ql177-stage')?.disabled).toBe(false);
    await click('Stage internal review · simulated');
    expect(host.textContent).toContain('READY FOR INTERNAL REVIEW SIMULATED');
    expect(host.textContent).toContain('No task, quote, booking, email, payment or owner approval was created');
    await click('Reset local intake');
    expect(host.querySelector<HTMLButtonElement>('.ql177-stage')?.disabled).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it('separates maker fields and resets all staged state on a brand switch', async () => {
    await act(async () => root.render(<Ql177BrandIntakeHandoffPreview brandId="devilndove" />));
    expect(host.querySelectorAll('.ql177-thread')).toHaveLength(3);
    expect(host.textContent).toContain('Maker & custom order questions');
    expect(host.querySelector('#ql177-technique')).not.toBeNull();
    expect(host.querySelector('#ql177-vehicle_type')).toBeNull();
    expect(host.textContent).not.toContain('Ceramic quote follow-up');
    await choose('technique', 'candles');
    await choose('materials', 'wax');
    await choose('reference', 'wording_needed');
    await choose('timing', 'date_to_confirm');
    await click('Stage internal review · simulated');
    expect(host.textContent).toContain('READY FOR INTERNAL REVIEW SIMULATED');
    await act(async () => root.render(<Ql177BrandIntakeHandoffPreview brandId="rosiedazzlers" />));
    await act(async () => root.render(<Ql177BrandIntakeHandoffPreview brandId="devilndove" />));
    expect(host.textContent).not.toContain('READY FOR INTERNAL REVIEW SIMULATED');
    expect(host.textContent).toContain('all staged intake selections were discarded');
  });

  it('supports accessible labels, status feedback, keyboard focus and responsive/forced-colours styles', () => {
    expect(host.querySelector('section[aria-label="QL-177 brand-specific synthetic intake and quote handoff"]')).not.toBeNull();
    expect(host.querySelector('label[for="ql177-vehicle_type"]')).not.toBeNull();
    expect(host.querySelector('label[for="ql177-internal-note"]')).not.toBeNull();
    expect(host.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    const css = readFileSync('src/operator/ql177-brand-intake-handoff.css', 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (max-width: 730px)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('min-height: 44px');
  });
});
