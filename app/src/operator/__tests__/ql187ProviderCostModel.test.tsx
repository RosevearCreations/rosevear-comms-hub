// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql187ProviderCostPreview } from '../Ql187ProviderCostPreview';
import { evaluateQl187Costs, QL187_DECISION_GATES, QL187_DEMO_RATES,
  QL187_PROVIDERS, QL187_VERSION, QL187_VOLUMES } from '../ql187ProviderCostModel';

const brands = ['rosiedazzlers', 'devilndove'] as const;
const request = (targetBrand: typeof brands[number]) => ({ targetBrand, volume: 'small',
  currency: 'CAD', cadPerUsd: 1.4, monthlyBudgetUsd: 25, reservePercent: 25 });

describe('QL-187: provider decision and expense model — no real rates or purchasing', () => {
  it('provides three official-source candidates, pure fictional USD rate cards and held criteria', () => {
    expect(QL187_VERSION).toBe('ql187-provider-decision-cost-model-v1');
    expect(QL187_PROVIDERS.map(x => x.id)).toEqual(['voipms', 'telnyx', 'twilio']);
    expect(QL187_PROVIDERS.every(x => x.pricing.startsWith('https://'))).toBe(true);
    expect(QL187_VOLUMES).toHaveLength(3);
    expect(QL187_DECISION_GATES).toHaveLength(7);
    expect(Object.keys(QL187_DEMO_RATES)).toEqual(['voipms', 'telnyx', 'twilio']);
  });

  for (const brand of brands) for (const volume of ['small', 'regular', 'busy'])
    for (const currency of ['CAD', 'USD']) {
      it(`${brand}/${volume}/${currency}: model remains synthetic with no selections or carrier actions`, () => {
        const output = evaluateQl187Costs(brand, { ...request(brand), volume, currency });
        expect(output).toMatchObject({ version: QL187_VERSION, disposition: 'REVIEW_ONLY_NO_PURCHASE',
          brandId: brand, vendorPricesVerified: false, providerSelected: false,
          providerConnected: false, numberPurchased: false, forwardingChanged: false,
          portingChanged: false, smsOrCallsSent: 0, externalWrites: 0,
          realOwnerApprovals: 0, pilotAuthorized: false, heldPrerequisites: 12 });
        expect(output.costs).toHaveLength(3);
        expect(output.costs.every(row => row.planningTotalUsd > 0 && Number.isFinite(row.displayTotal))).toBe(true);
      });
    }

  it('computes predictable line-item arithmetic, reserve, FX display and USD budget thresholds', () => {
    const result = evaluateQl187Costs('rosiedazzlers', request('rosiedazzlers'));
    const voip = result.costs[0];
    expect(voip).toMatchObject({ providerId: 'voipms', recurringUsd: 3.85, reserveUsd: .96,
      planningTotalUsd: 4.81, displayTotal: 6.73, withinIllustrativeBudget: true });
    const usd = evaluateQl187Costs('rosiedazzlers', { ...request('rosiedazzlers'), currency: 'USD',
      reservePercent: 0, monthlyBudgetUsd: 3 });
    expect(usd.costs[0]).toMatchObject({ displayTotal: 3.85, withinIllustrativeBudget: false });
    const costlier = evaluateQl187Costs('rosiedazzlers', { ...request('rosiedazzlers'), volume: 'busy' });
    expect(costlier.costs[0].planningTotalUsd).toBeGreaterThan(voip.planningTotalUsd);
  });

  it('rejects forged owner approval, real-provider steps, malformed values and prototype attack inputs', () => {
    for (const [brand, req] of [
      ['unlisted', request('rosiedazzlers')],
      ['rosiedazzlers', { ...request('rosiedazzlers'), targetBrand: 'personal' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), volume: 'actual_customer_data' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), currency: 'GBP' }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), cadPerUsd: NaN }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), cadPerUsd: Infinity }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), cadPerUsd: 0 }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), monthlyBudgetUsd: -1 }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), reservePercent: 110 }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), ownerApproved: true }],
      ['rosiedazzlers', { ...request('rosiedazzlers'), portNumber: true }],
      ['rosiedazzlers', null], ['rosiedazzlers', []],
      ['rosiedazzlers', Object.create(request('rosiedazzlers'))]
    ] as const) {
      expect(evaluateQl187Costs(brand, req)).toMatchObject({ disposition: 'INVALID_PREVIEW_REQUEST',
        brandId: null, costs: [], providerConnected: false, numberPurchased: false, smsOrCallsSent: 0 });
    }
  });

  it('rejects cross-brand estimates with no provider costs exposed', () => {
    expect(evaluateQl187Costs('rosiedazzlers', request('devilndove'))).toMatchObject({
      disposition: 'CROSS_BRAND_REJECTED', brandId: null, costs: [], pilotAuthorized: false
    });
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql187ProviderCostPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function changeSelect(id: string, value: string) {
  await act(async () => { const el = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-187 accessible disabled-cost preview', () => {
  it('shows accessible inputs, three providers, unknown existing-line costs, official pages and held warnings', () => {
    expect(host.textContent).toContain('Provider decision & cost model');
    expect(host.textContent).toContain('HYPOTHETICAL RATES · NO PURCHASE');
    expect(host.textContent).toContain('invented demonstration data');
    expect(host.textContent).toContain('Bell Fibe');
    expect(host.textContent).toContain('Pilot holds: 12');
    expect(host.querySelectorAll('.ql187-controls label[for]')).toHaveLength(6);
    expect(host.querySelectorAll('.ql187-table-wrap tbody tr').length).toBeGreaterThanOrEqual(3);
    expect(host.querySelectorAll('.ql187-help summary')).toHaveLength(2);
    expect(host.querySelectorAll('a[target="_blank"][rel="noopener noreferrer"]')).toHaveLength(4);
    expect(host.querySelector('.ql187-result[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('switches mock scenario, budgets and brands without network, storage or carrier side effects', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await changeSelect('ql187-volume', 'busy');
    await changeSelect('ql187-currency', 'USD');
    expect(host.textContent).toContain('Above demo budget');
    await changeSelect('ql187-brand', 'devilndove');
    expect(host.textContent).toContain('CROSS-BRAND REQUEST REJECTED');
    expect(host.querySelectorAll('.ql187-table-wrap tbody tr')).toHaveLength(3); // only rate explanation inside a closed detail
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('remounts the candidate on a brand switch, clearing other brand assumptions', async () => {
    await changeSelect('ql187-brand', 'devilndove');
    await changeSelect('ql187-volume', 'busy');
    await act(async () => root.render(<Ql187ProviderCostPreview key="devil" brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql187-brand')?.value).toBe('devilndove');
    expect(host.querySelector<HTMLSelectElement>('#ql187-volume')?.value).toBe('small');
    expect(host.textContent).toContain('for Devil n Dove');
  });

  it('appears in the Phone/SMS safety workspace and leaves existing synthetic consoles intact', async () => {
    await act(async () => root.render(<OperatorShell key="full-shell" />));
    const telephony = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(button => button.textContent?.includes('Phone/SMS safety'))!;
    await act(async () => telephony.click());
    expect(host.querySelector('.ql187-cost')).not.toBeNull();
    expect(host.querySelector('.ql179-emulator')).not.toBeNull();
    expect(host.textContent).toContain('HYPOTHETICAL RATES · NO PURCHASE');
  });

  it('supports mobile layout, focus outlines, 44px touch targets and forced contrast', () => {
    const css = readFileSync('src/operator/ql187-provider-cost.css', 'utf8');
    for (const marker of ['min-height:44px', 'max-width:700px', 'max-width:375px', ':focus-visible', 'forced-colors:active'])
      expect(css).toContain(marker);
  });
});
