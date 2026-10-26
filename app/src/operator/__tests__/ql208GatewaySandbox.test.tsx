// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { buildMockReviewQueue } from '../ql204HandoffReviewQueue';
import { mockOperatorProfiles } from '../ql206SecureOperations';
import { MockGatewayPreviewWorkbench, QL208_PREVIEW_VERSION } from '../ql208GatewayPreview';
import type { OrganizationId } from '../ql191Organizations';

function persona(id: string) { const who = mockOperatorProfiles.find((item) => item.id === id); if (!who) throw new Error('no test persona'); return who; }
function sample(organizationId: OrganizationId, fixtureId?: string) {
  const q = buildMockReviewQueue(organizationId, connectorContracts[organizationId]);
  if (!q.ok) throw new Error('missing fixture queue');
  const entry = fixtureId ? q.items.find((item) => item.id === fixtureId) : q.items[0];
  if (!entry) throw new Error('missing fictional item');
  return { items: q.items, entry };
}

describe('QL-208 fictional browser gateway workbench', () => {
  it('records only a minimal human-review receipt, suppresses retries and never sends', () => {
    const org = 'rosiedazzlers';
    const { items, entry } = sample(org);
    const lab = new MockGatewayPreviewWorkbench();
    lab.setAllowlistedItems(org, items);
    const input = { organizationId: org, contract: connectorContracts[org], profile: persona('rosie-reviewer'), item: entry } as const;
    expect(QL208_PREVIEW_VERSION).toContain('gateway-sandbox-mock');
    expect(lab.run({ ...input, scenario: 'duplicate' }).disposition).toBe('NO_PRIOR_RECEIPT');
    expect(lab.run({ ...input, scenario: 'fresh' })).toMatchObject({ disposition: 'HELD_FOR_REVIEW', realProviderSignatureVerified: false, messagesSent: 0 });
    expect(lab.run({ ...input, scenario: 'duplicate' }).disposition).toBe('DENIED_REPLAY');
    expect(lab.run({ ...input, scenario: 'fresh' }).disposition).toBe('DENIED_REPLAY');
    expect(lab.run({ ...input, scenario: 'outbound' })).toMatchObject({ disposition: 'DENIED_OUTBOUND', callsPlaced: 0, externalWrites: 0 });
    expect(lab.visible(org, persona('rosie-reviewer'))).toHaveLength(1);
    expect(lab.visible(org, persona('dnd-owner'))).toHaveLength(0);
    lab.clear();
    expect(lab.visible(org, persona('rosie-reviewer'))).toHaveLength(0);
  });

  it('holds altered/held sources, wrong personas, signature, clock and routing scenarios', () => {
    const org = 'yw';
    const { items, entry } = sample(org, 'yw-demo-septic');
    const lab = new MockGatewayPreviewWorkbench();
    lab.setAllowlistedItems(org, items);
    const valid = { organizationId: org, contract: connectorContracts[org], profile: persona('yw-rosevear-manager'), item: entry } as const;
    for (const [scenario, expected] of [
      ['invalid_signature', 'DENIED_SIGNATURE'], ['stale_nonce', 'DENIED_TIME'],
      ['wrong_company', 'DENIED_COMPANY'], ['wrong_tenant', 'DENIED_TENANT'],
      ['wrong_property', 'DENIED_PROPERTY'], ['unknown_fixture', 'DENIED_SOURCE'],
      ['outbound', 'DENIED_OUTBOUND']
    ] as const) expect(lab.run({ ...valid, scenario }).disposition).toBe(expected);
    expect(lab.run({ ...valid, item: { ...entry, reference: 'FAKE' }, scenario: 'fresh' }).disposition).toBe('DENIED_SOURCE');
    expect(lab.run({ ...valid, profile: persona('rosie-manager'), scenario: 'fresh' }).disposition).toBe('DENIED_OPERATOR');
    expect(lab.run({ ...valid, profile: persona('yw-isolated-manager'), scenario: 'fresh' }).disposition).toBe('DENIED_OPERATOR');
    expect(lab.run({ ...valid, scenario: 'fresh' }).disposition).toBe('HELD_FOR_REVIEW');
    expect(lab.visible(org, persona('yw-property-a-reviewer'))).toHaveLength(1);
    expect(lab.visible(org, persona('yw-isolated-manager'))).toHaveLength(0);
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((node) => node.textContent?.includes(text));
  if (!button) throw new Error(`Missing button ${text}`);
  await act(async () => button.click());
}
async function choose(selector: string, value: string) {
  const field = host.querySelector<HTMLSelectElement>(selector);
  if (!field) throw new Error(`Missing select ${selector}`);
  await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!; setter.call(field, value); field.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-208 connector centre operator interaction', () => {
  it('exposes help, signed-event projection, replay, role isolation, outbound block and reset', async () => {
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql208-release="${QL208_PREVIEW_VERSION}"]`)).not.toBeNull();
    expect(host.textContent).toContain('PROVIDERS DISCONNECTED');
    await click('ⓘ Help', '.ql208-head button');
    expect(host.textContent).toContain('ephemeral keys');
    await click('Run fictional gateway case');
    expect(host.textContent).toContain('HELD_FOR_REVIEW');
    expect(host.textContent).toContain('Review-only synthetic receipts (1)');
    await click('Replay same fictional event');
    expect(host.textContent).toContain('DENIED_REPLAY');
    await click('Try outgoing delivery');
    expect(host.textContent).toContain('DENIED_OUTBOUND');
    await choose('#ql208-profile', 'dnd-owner');
    expect(host.textContent).toContain('Review-only synthetic receipts (0)');
    await click('Run fictional gateway case');
    expect(host.textContent).toContain('DENIED_OPERATOR');
    await choose('#ql208-profile', 'rosie-reviewer');
    expect(host.textContent).toContain('Review-only synthetic receipts (1)');
    await click('Clear browser receipts');
    expect(host.textContent).toContain('Review-only synthetic receipts (0)');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector<HTMLSelectElement>('#ql208-profile')?.value).toBe('camp-rosevear-reviewer');
    await choose('#ql208-scenario', 'wrong_tenant');
    await click('Run fictional gateway case');
    expect(host.textContent).toContain('DENIED_TENANT');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Review-only synthetic receipts (0)');
  });
});
