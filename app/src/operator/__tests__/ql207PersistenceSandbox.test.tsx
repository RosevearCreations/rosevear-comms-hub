// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { buildMockReviewQueue, type MockReviewQueueItem } from '../ql204HandoffReviewQueue';
import { mockOperatorProfiles } from '../ql206SecureOperations';
import { MockPersistenceSandbox, type MockPersistenceRequest } from '../ql207PersistenceSandbox';
import type { OrganizationId } from '../ql191Organizations';

function profile(id: string) { const p = mockOperatorProfiles.find((person) => person.id === id); if (!p) throw new Error('Unknown test persona'); return p; }
function sample(org: OrganizationId, id?: string): MockReviewQueueItem {
  const result = buildMockReviewQueue(org, connectorContracts[org]);
  if (!result.ok) throw new Error('No fictional company queue');
  const item = id ? result.items.find((entry) => entry.id === id) : result.items[0];
  if (!item) throw new Error('No fictional source');
  return item;
}
function request(org: OrganizationId, who: string, options: Partial<MockPersistenceRequest> = {}): MockPersistenceRequest {
  return { organizationId: org, contract: connectorContracts[org], profile: profile(who), item: sample(org), stage: 'triage_note',
    expectedVersion: 0, requestId: 'demo-1', ...options };
}

describe('QL-207 private persistence design rehearsal', () => {
  it('simulates versioned saves, exact retries, collision and stale update rejection without durable storage', () => {
    const store = new MockPersistenceSandbox();
    const original = request('rosiedazzlers', 'rosie-reviewer');
    const created = store.save(original);
    expect(created).toMatchObject({ ok: true, replayed: false, record: { version: 1, organizationId: 'rosiedazzlers', sampleOnly: true } });
    expect(store.save(original)).toEqual({ ...created, replayed: true });
    expect(store.visibleTo('rosiedazzlers', profile('rosie-reviewer'))).toHaveLength(1);
    expect(store.save({ ...original, stage: 'human_review_needed' })).toMatchObject({ ok: false, reason: 'idempotency_conflict' });
    expect(store.save({ ...original, requestId: 'demo-2', expectedVersion: 1, stage: 'human_review_needed' })).toMatchObject({ ok: true, record: { version: 2 } });
    expect(store.save({ ...original, requestId: 'demo-3', expectedVersion: 1 })).toMatchObject({ ok: false, reason: 'stale_version' });
    expect(store.visibleTo('rosiedazzlers', profile('rosie-reviewer'))[0]).toMatchObject({ version: 2, stage: 'human_review_needed' });
    store.clear();
    expect(store.visibleTo('rosiedazzlers', profile('rosie-reviewer'))).toHaveLength(0);
  });

  it('rejects bad identities, invalid request fields, held samples and non-canonical sources', () => {
    const store = new MockPersistenceSandbox();
    const valid = request('yw', 'yw-rosevear-manager');
    expect(store.save({ ...valid, profile: profile('signed-out') })).toMatchObject({ ok: false, reason: 'not_authorized' });
    expect(store.save({ ...valid, profile: profile('rosie-manager') })).toMatchObject({ ok: false, reason: 'not_authorized' });
    expect(store.save({ ...valid, profile: { ...valid.profile } })).toMatchObject({ ok: false, reason: 'not_authorized' });
    expect(store.save({ ...valid, item: { ...valid.item, reference: 'FAKE-REF' } })).toMatchObject({ ok: false, reason: 'invalid_fixture' });
    expect(store.save({ ...valid, item: { ...valid.item, id: 'yw-demo-tree-held' } })).toMatchObject({ ok: false, reason: 'invalid_fixture' });
    expect(store.save({ ...valid, contract: connectorContracts.icamp })).toMatchObject({ ok: false, reason: 'invalid_fixture' });
    expect(store.save({ ...valid, requestId: 'not-a-demo-request' })).toMatchObject({ ok: false, reason: 'invalid_request' });
    expect(store.save({ ...valid, expectedVersion: -1 })).toMatchObject({ ok: false, reason: 'invalid_request' });
  });

  it('enforces iCamp tenant and YW company/property isolation on writes and reads', () => {
    const store = new MockPersistenceSandbox();
    expect(store.save(request('icamp', 'camp-isolated-manager'))).toMatchObject({ ok: false, reason: 'not_authorized' });
    expect(store.save(request('icamp', 'camp-rosevear-reviewer'))).toMatchObject({ ok: true });
    expect(store.visibleTo('icamp', profile('camp-isolated-manager'))).toHaveLength(0);
    expect(store.visibleTo('icamp', profile('camp-rosevear-reviewer'))).toHaveLength(1);
    expect(store.save(request('yw', 'yw-property-a-reviewer', { item: sample('yw', 'yw-demo-snow') }))).toMatchObject({ ok: false, reason: 'not_authorized' });
    expect(store.save(request('yw', 'yw-property-a-reviewer', { item: sample('yw', 'yw-demo-septic') }))).toMatchObject({ ok: true });
    expect(store.save(request('yw', 'yw-rosevear-manager', { item: sample('yw', 'yw-demo-snow'), requestId: 'demo-2' }))).toMatchObject({ ok: true });
    expect(store.visibleTo('yw', profile('yw-property-a-reviewer'))).toHaveLength(1);
    expect(store.visibleTo('yw', profile('yw-rosevear-manager'))).toHaveLength(2);
    expect(store.visibleTo('yw', profile('yw-isolated-manager'))).toHaveLength(0);
    expect(store.visibleTo('rosiedazzlers', profile('rosie-manager'))).toHaveLength(0);
  });

  it('keeps all four organizations independent in one in-memory store', () => {
    const store = new MockPersistenceSandbox();
    const identities: Record<OrganizationId, string> = {
      rosiedazzlers: 'rosie-reviewer', devilndove: 'dnd-reviewer', icamp: 'camp-rosevear-reviewer', yw: 'yw-rosevear-manager'
    };
    for (const org of Object.keys(identities) as OrganizationId[]) expect(store.save(request(org, identities[org]))).toMatchObject({ ok: true });
    for (const org of Object.keys(identities) as OrganizationId[]) {
      const visible = store.visibleTo(org, profile(identities[org]));
      expect(visible).toHaveLength(1);
      expect(visible[0].organizationId).toBe(org);
    }
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((node) => node.textContent?.includes(text));
  if (!button) throw new Error(`Missing button ${text}`);
  await act(async () => button.click());
}
async function choose(selector: string, value: string) {
  const select = host.querySelector<HTMLSelectElement>(selector);
  if (!select) throw new Error(`Missing ${selector}`);
  await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!; setter.call(select, value); select.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-207 operator rehearsal UI', () => {
  it('saves, retries, conflicts, scopes reads and resets on company switch', async () => {
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql207-release="ql207-supabase-tenant-persistence-sandbox-mock-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('NO SUPABASE WRITES');
    await click('ⓘ Help', '.ql207-header button');
    expect(host.textContent).toContain('None of these outcomes is real authentication');
    await click('Save fictional checkpoint in memory');
    expect(host.textContent).toContain('FICTIONAL SNAPSHOT SAVED IN MEMORY');
    expect(host.textContent).toContain('Visible fictional snapshots (1)');
    await click('Replay last request key');
    expect(host.textContent).toContain('DUPLICATE SUPPRESSED');
    await click('Test stale version rejection');
    expect(host.textContent).toContain('BLOCKED · stale_version');
    await choose('#ql207-persona', 'dnd-owner');
    expect(host.textContent).toContain('Visible fictional snapshots (0)');
    await click('Save fictional checkpoint in memory');
    expect(host.textContent).toContain('BLOCKED · not_authorized');
    await choose('#ql207-persona', 'rosie-reviewer');
    expect(host.textContent).toContain('Visible fictional snapshots (1)');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector<HTMLSelectElement>('#ql207-persona')?.value).toBe('camp-rosevear-reviewer');
    expect(host.textContent).toContain('Visible fictional snapshots (0)');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Visible fictional snapshots (0)');
  });
});
