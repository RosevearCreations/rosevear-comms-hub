// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql188SecurityHarnessPreview } from '../Ql188SecurityHarnessPreview';
import { QL188_CASES, QL188_LIVE_GATES, QL188_VERSION, viewQl188Case } from '../ql188SecurityPreview';

describe('QL-188 read-only projections of the Node-only test harness', () => {
  it('documents eleven checked-in cases and stays clear of any live claim', () => {
    expect(QL188_VERSION).toBe('ql188-server-auth-webhook-replay-harness-v1');
    expect(QL188_CASES).toHaveLength(11);
    expect(new Set(QL188_CASES.map(item => item.id)).size).toBe(11);
    expect(QL188_LIVE_GATES).toHaveLength(7);
    expect(QL188_CASES.find(item => item.id === 'fresh')?.expected).toBe('ACCEPTED_MOCK');
    expect(QL188_CASES.find(item => item.id === 'duplicate')?.expected).toBe('DENIED_REPLAY');
    expect(QL188_CASES.find(item => item.id === 'cross_brand')?.expected).toBe('DENIED_SCOPE');
  });

  for (const brand of ['rosiedazzlers', 'devilndove'] as const) for (const sample of QL188_CASES) {
    it(`${brand} ${sample.id}: always no real auth, messages, endpoints, writes or pilot authorization`, () => {
      expect(viewQl188Case(brand, brand, sample.id)).toMatchObject({
        version: QL188_VERSION, disposition: 'ILLUSTRATIVE_CASE_ONLY', brandId: brand,
        expectedServerDisposition: sample.expected, realSessionAuthenticated: false,
        realProviderSignatureVerified: false, liveWebhookEndpoint: false,
        providerSecretsConfigured: false, durableReplayLedger: false,
        providerEventReceived: false, dispatchAllowed: false, livePilotAuthorized: false,
        heldPrerequisites: 12, externalWrites: 0, messagesSent: 0, callsPlaced: 0
      });
    });
  }

  it('refuses cross-business evidence and invalid case IDs', () => {
    expect(viewQl188Case('rosiedazzlers', 'devilndove', 'fresh')).toMatchObject({
      disposition: 'CROSS_BRAND_REJECTED', brandId: null, expectedServerDisposition: null
    });
    for (const [active, target, id] of [
      ['unknown', 'rosiedazzlers', 'fresh'],
      ['rosiedazzlers', 'personal', 'fresh'],
      ['rosiedazzlers', 'rosiedazzlers', 'approve_live'],
      ['rosiedazzlers', 'rosiedazzlers', { toString: () => 'fresh' }]
    ] as const) expect(viewQl188Case(active, target, id)).toMatchObject({
      disposition: 'INVALID_PREVIEW_REQUEST', brandId: null, expectedServerDisposition: null
    });
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql188SecurityHarnessPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function select(id: string, value: string) {
  await act(async () => { const el = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-188 accessibility, boundaries and shell continuity', () => {
  it('is explicit about display-only evidence and labels both controls', () => {
    expect(host.textContent).toContain('Server auth, webhook & replay test harness');
    expect(host.textContent).toContain('NO LIVE ENDPOINT · NO SECRETS');
    expect(host.textContent).toContain('does not execute cryptographic checks');
    expect(host.textContent).toContain('Expected Node test disposition: ACCEPTED_MOCK');
    expect(host.textContent).toContain('Pilot holds: 12');
    expect(host.querySelectorAll('.ql188-controls label[for]')).toHaveLength(2);
    expect(host.querySelectorAll('.ql188-table-wrap tbody tr')).toHaveLength(11);
    expect(host.querySelectorAll('.ql188-help summary')).toHaveLength(2);
    expect(host.querySelector('.ql188-result[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('never creates data, network traffic or credential state while switching cases and business', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await select('ql188-case', 'bad_signature');
    expect(host.textContent).toContain('Expected Node test disposition: DENIED_SIGNATURE');
    await select('ql188-case', 'duplicate');
    expect(host.textContent).toContain('Expected Node test disposition: DENIED_REPLAY');
    await select('ql188-brand', 'devilndove');
    expect(host.textContent).toContain('CROSS-BRAND REQUEST REJECTED');
    expect(host.querySelector('.ql188-result')?.textContent).not.toContain('DENIED_REPLAY');
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });

  it('remounts brand review to initial fictional case', async () => {
    await select('ql188-case', 'duplicate');
    await act(async () => root.render(<Ql188SecurityHarnessPreview key="new-brand" brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql188-brand')?.value).toBe('devilndove');
    expect(host.querySelector<HTMLSelectElement>('#ql188-case')?.value).toBe('fresh');
    expect(host.textContent).toContain('for Devil n Dove');
  });

  it('appears in the Phone/SMS safety workspace alongside QL-187 and existing mock emulator', async () => {
    await act(async () => root.render(<OperatorShell key="full-shell" />));
    const button = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(item => item.textContent?.includes('Phone/SMS safety'))!;
    await act(async () => button.click());
    expect(host.querySelector('.ql188-security')).not.toBeNull();
    expect(host.querySelector('.ql187-cost')).not.toBeNull();
    expect(host.querySelector('.ql179-emulator')).not.toBeNull();
  });

  it('keeps mobile responsiveness, focus ring, accessible sizes and forced contrast', () => {
    const css = readFileSync('src/operator/ql188-security-harness.css', 'utf8');
    for (const expected of ['min-height:44px', 'max-width:700px', 'max-width:375px', ':focus-visible', 'forced-colors:active'])
      expect(css).toContain(expected);
  });
});
