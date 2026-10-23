// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql179PhoneSmsEventEmulator } from '../Ql179PhoneSmsEventEmulator';
import {
  QL179_FIXTURE_SET, QL179_MAX_RECEIPTS, QL179_SCHEMA, emptyQl179Replay,
  getQl179MockScenarios, getQl179OperatorFeed, simulateQl179MockReceipt, validateQl179MockEnvelope
} from '../ql179MockPhoneSms';

const migration = migrateQl173SyntheticFixtures();
const rosie = getQl179MockScenarios(migration, 'rosiedazzlers');
const maker = getQl179MockScenarios(migration, 'devilndove');

describe('QL-179 provider-neutral mock event contract and immutable replay', () => {
  it('pins 10 provider-free voice, missed-call, voicemail, inbound SMS and blocked outbound examples to QL-173', () => {
    expect(migration.verified).toBe(true);
    expect(rosie).toHaveLength(5);
    expect(maker).toHaveLength(5);
    expect(new Set([...rosie, ...maker].map(row => row.event.idempotencyKey)).size).toBe(10);
    expect([...rosie, ...maker].every(row => row.schema === QL179_SCHEMA && row.fixtureSet === QL179_FIXTURE_SET &&
      row.transport === 'IN_MEMORY_ONLY' && row.signatureState === 'NO_REAL_SIGNATURE_OR_AUTHENTICATION' &&
      row.event.mode === 'SIMULATED_ONLY')).toBe(true);
    expect(rosie.map(row => row.event.kind)).toEqual(['inbound_call', 'missed_call', 'voicemail', 'inbound_sms', 'outbound_sms_intent']);
    expect(maker.map(row => row.event.kind)).toEqual(['inbound_call', 'inbound_sms', 'voicemail', 'outbound_call_intent', 'outbound_sms_intent']);
    expect([...rosie, ...maker].filter(row => row.event.direction === 'outbound_intent').every(row =>
      ['BLOCKED_MOCK', 'FAILED_MOCK'].includes(row.event.status))).toBe(true);
    expect([...rosie, ...maker].every(row => !JSON.stringify(row).match(/@example\.|\+1519|555-\d{4}|recordingUrl|providerSid/))).toBe(true);
  });

  it('accepts only exact in-memory fixture objects and rejects forged webhooks, unknown fields and unsafe delivery status', () => {
    const sample = rosie[0];
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', sample)).toMatchObject({ ok: true });
    expect(validateQl179MockEnvelope(migration, 'devilndove', sample)).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, transport: 'HTTPS_WEBHOOK' })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, signatureState: 'VERIFIED' })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, schema: 'v2' })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, fixtureSet: 'untrusted' })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, webhookUrl: 'https://example.com' })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, event: { ...sample.event, phone: '+15195550111' } })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, event: { ...sample.event, status: 'DELIVERED' } })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', { ...sample, event: { ...sample.event, conversationId: maker[0].event.conversationId } })).toMatchObject({ ok: false });
    expect(validateQl179MockEnvelope(migration, 'rosiedazzlers', null)).toMatchObject({ ok: false });
  });

  it('accepts one mock receipt and deduplicates an identical idempotency key without creating a second event', () => {
    const original = JSON.stringify(migration.snapshot);
    const accepted = simulateQl179MockReceipt(migration, 'rosiedazzlers', emptyQl179Replay(), rosie[0]);
    expect(accepted.lastResult).toBe('ACCEPTED_MOCK');
    expect(accepted.receipts).toHaveLength(1);
    expect(accepted.receipts[0]).toMatchObject({ sequence: 1, outcome: 'ACCEPTED_MOCK' });
    const duplicate = simulateQl179MockReceipt(migration, 'rosiedazzlers', accepted, rosie[0]);
    expect(duplicate).toMatchObject({ lastResult: 'DUPLICATE_IGNORED' });
    expect(duplicate.receipts).toBe(accepted.receipts);
    expect(JSON.stringify(migration.snapshot)).toBe(original);
  });

  it('replays all five brand events in sequence with canonical subjects and QL-178 task handoffs', () => {
    const replay = rosie.reduce((state, row) => simulateQl179MockReceipt(migration, 'rosiedazzlers', state, row), emptyQl179Replay());
    const feed = getQl179OperatorFeed(migration, 'rosiedazzlers', replay);
    expect(feed).toHaveLength(5);
    expect(feed.map(row => row.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(feed.every(row => row.syntheticOnly && row.subject && row.taskTitle && row.event.brandId === 'rosiedazzlers')).toBe(true);
    expect(feed.some(row => row.taskTitle === 'Request interior photos before quote')).toBe(true);
    expect(getQl179OperatorFeed(migration, 'devilndove', replay)).toEqual([]);
  });

  it('handles mock timeout/blocked statuses without reporting real provider sends or deliveries', () => {
    const replay = maker.reduce((state, row) => simulateQl179MockReceipt(migration, 'devilndove', state, row), emptyQl179Replay());
    const feed = getQl179OperatorFeed(migration, 'devilndove', replay);
    expect(feed.filter(row => row.event.status === 'BLOCKED_MOCK')).toHaveLength(1);
    expect(feed.filter(row => row.event.status === 'FAILED_MOCK')).toHaveLength(1);
    expect(feed.find(row => row.event.error === 'OUTBOUND_DISABLED')?.event.kind).toBe('outbound_call_intent');
    expect(feed.find(row => row.event.error === 'MOCK_PROVIDER_TIMEOUT')?.event.kind).toBe('outbound_sms_intent');
    expect(feed.every(row => row.event.status !== ('DELIVERED' as string))).toBe(true);
  });

  it('fails closed for tampered fixture provenance, cross-brand injection and malformed replay receipts', () => {
    const previous = emptyQl179Replay();
    const disabled = { ...migration, verified: false };
    expect(getQl179MockScenarios(disabled, 'rosiedazzlers')).toEqual([]);
    expect(simulateQl179MockReceipt(disabled, 'rosiedazzlers', previous, rosie[0]).lastResult).toBe('REJECTED_MOCK');
    expect(simulateQl179MockReceipt(migration, 'rosiedazzlers', previous, maker[0]).lastResult).toBe('REJECTED_MOCK');
    const drifted = structuredClone(migration);
    drifted.snapshot.messages[0].humanApproved = true;
    expect(getQl179MockScenarios(drifted, 'rosiedazzlers')).toEqual([]);
    const fakeHistory = { receipts: [{ sequence: 99, envelope: rosie[0], outcome: 'ACCEPTED_MOCK' as const }], lastResult: 'ACCEPTED_MOCK' as const };
    expect(getQl179OperatorFeed(migration, 'rosiedazzlers', fakeHistory)).toEqual([]);
    expect(simulateQl179MockReceipt(migration, 'rosiedazzlers', fakeHistory, rosie[1]).receipts).toEqual([]);
    const tooMany = { receipts: Array.from({ length: QL179_MAX_RECEIPTS + 1 }, (_, index) =>
      ({ sequence: index + 1, envelope: rosie[0], outcome: 'ACCEPTED_MOCK' as const })), lastResult: 'READY' as const };
    expect(getQl179OperatorFeed(migration, 'rosiedazzlers', tooMany)).toEqual([]);
  });
});

let host: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql179PhoneSmsEventEmulator brandId="rosiedazzlers" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

async function click(label: string) {
  const node = [...host.querySelectorAll<HTMLButtonElement>('button')].find(element => element.textContent?.includes(label));
  if (!node) throw new Error(`Cannot find button ${label}`);
  await act(async () => node.click());
}

async function choose(id: string, value: string) {
  const node = host.querySelector<HTMLSelectElement>(`#${id}`);
  if (!node) throw new Error(`Cannot find selector ${id}`);
  await act(async () => { node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-179 accessible disabled-preview operator emulator', () => {
  it('displays five Rosie fixtures and explicitly disabled provider/authentication boundaries', () => {
    expect(host.querySelectorAll('#ql179-fixture option')).toHaveLength(5);
    expect(host.textContent).toContain('Phone & SMS event emulator');
    expect(host.textContent).toContain('DISABLED PREVIEW · NO PHONE OR SMS');
    expect(host.textContent).toContain('NO WEBHOOK LISTENER · NO SIGNATURE VALIDATION');
    expect(host.textContent).toContain('Outbound dispatched');
    expect(host.textContent).toContain('0 · LOCKED');
    expect(host.querySelector('#ql179-fixture')?.tagName).toBe('SELECT');
  });

  it('injects mock events into the visible operator feed and reports duplicate idempotency', async () => {
    await click('Inject mock receipt');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(1);
    expect(host.textContent).toContain('Mock event accepted into screen memory only');
    expect(host.textContent).toContain('QL-178 follow-up:');
    await click('Replay selected mock');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(1);
    expect(host.textContent).toContain('duplicate mock event ignored');
    await click('Reset local receipts');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(0);
  });

  it('filters voice/SMS and blocked/failure examples using pinned samples only', async () => {
    await click('Replay all pinned samples');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(5);
    await choose('ql179-filter', 'sms');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(2);
    await choose('ql179-filter', 'blocked_or_failed');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(1);
    expect(host.textContent).toContain('BLOCKED_MOCK');
    await choose('ql179-filter', 'all');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(5);
  });

  it('discards in-memory event history on business switch and shows no cross-brand contacts', async () => {
    await click('Replay all pinned samples');
    await act(async () => root.render(<Ql179PhoneSmsEventEmulator brandId="devilndove" />));
    expect(host.querySelectorAll('#ql179-fixture option')).toHaveLength(5);
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(0);
    expect(host.textContent).toContain('Devil n Dove');
    expect(host.textContent).not.toContain('Example call not answered');
    await click('Replay all pinned samples');
    expect(host.querySelectorAll('.ql179-events li')).toHaveLength(5);
    expect(host.textContent).toContain('Custom order clarification sample');
    expect(host.textContent).not.toContain('SUV interior detail');
  });

  it('never contacts a provider or saves local/browser data during emulation', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await click('Replay all pinned samples');
    await click('Replay selected mock');
    await click('Reset local receipts');
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    const model = readFileSync('src/operator/ql179MockPhoneSms.ts', 'utf8');
    const ui = readFileSync('src/operator/Ql179PhoneSmsEventEmulator.tsx', 'utf8');
    expect(model + ui).not.toMatch(/\bfetch\s*\(|\baxios\s*\(|\.from\s*\(|\.insert\s*\(|\.update\s*\(|localStorage\.|sendSms\s*\(|makeCall\s*\(/);
  });
});
