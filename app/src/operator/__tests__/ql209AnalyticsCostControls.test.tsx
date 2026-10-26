// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import type { OrganizationId } from '../ql191Organizations';
import { mockOperatorProfiles } from '../ql206SecureOperations';
import { evaluateQl209Analytics, QL209_RELEASE, type Ql209ReportInput } from '../ql209Analytics';

function profile(id: string) { const item = mockOperatorProfiles.find((person) => person.id === id); if (!item) throw Error('missing persona'); return item; }
function request(organizationId: OrganizationId, profileId: string, updates: Partial<Ql209ReportInput> = {}): Ql209ReportInput {
  return { organizationId, profile: profile(profileId), providerId: 'voipms', volumeMultiplier: 10,
    monthlyBudgetUsd: 25, reservePercent: 25, currency: 'USD', cadPerUsd: 1.4, ...updates };
}

describe('QL-209 four-company fictional analytics and cost policies', () => {
  it('uses only canonical visible company handoffs, never full customer inbox contents', () => {
    const roles: Readonly<Record<OrganizationId, string>> = {
      rosiedazzlers: 'rosie-manager', devilndove: 'dnd-owner',
      icamp: 'camp-rosevear-manager', yw: 'yw-rosevear-manager'
    };
    for (const org of Object.keys(roles) as OrganizationId[]) {
      const result = evaluateQl209Analytics(request(org, roles[org]));
      expect(result.disposition).toBe('PREVIEW_ONLY');
      if (result.disposition !== 'PREVIEW_ONLY') throw Error('missing demo report');
      expect(result.visibleHandoffs).toBeGreaterThan(0);
      expect(result.channels.reduce((total, row) => total + row.count, 0)).toBe(result.visibleHandoffs);
      expect(result.targetWithin30Minutes + result.targetWithin120Minutes).toBe(result.visibleHandoffs);
      expect(result.actualResponsesTimed).toBe(0);
      expect(result.actualProviderChargesKnown).toBe(false);
      expect(result.messagesSent).toBe(0);
      expect(result.callsPlaced).toBe(0);
      expect(result.externalWrites).toBe(0);
    }
    expect(QL209_RELEASE).toContain('ql209-');
  });

  it('keeps iCamp tenants and Yard Workers property/company scopes separate', () => {
    expect(evaluateQl209Analytics(request('icamp', 'camp-isolated-manager'))).toMatchObject({ disposition: 'ACCESS_DENIED', report: null });
    expect(evaluateQl209Analytics(request('icamp', 'camp-rosevear-manager'))).toMatchObject({ disposition: 'PREVIEW_ONLY', visibleHandoffs: 2 });
    expect(evaluateQl209Analytics(request('yw', 'yw-property-a-reviewer'))).toMatchObject({ disposition: 'PREVIEW_ONLY', visibleHandoffs: 2 });
    expect(evaluateQl209Analytics(request('yw', 'yw-rosevear-manager'))).toMatchObject({ disposition: 'PREVIEW_ONLY', visibleHandoffs: 4 });
    expect(evaluateQl209Analytics(request('yw', 'yw-isolated-manager'))).toMatchObject({ disposition: 'ACCESS_DENIED', report: null });
    expect(evaluateQl209Analytics(request('yw', 'rosie-manager'))).toMatchObject({ disposition: 'ACCESS_DENIED', report: null });
    expect(evaluateQl209Analytics(request('rosiedazzlers', 'signed-out'))).toMatchObject({ disposition: 'ACCESS_DENIED', report: null });
    expect(evaluateQl209Analytics(request('rosiedazzlers', 'rosie-manager', { profile: { ...profile('rosie-manager') } })))
      .toMatchObject({ disposition: 'ACCESS_DENIED', report: null });
  });

  it('calculates invented voice/SMS/number costs and flags configurable budget thresholds', () => {
    const base = evaluateQl209Analytics(request('yw', 'yw-rosevear-manager'));
    expect(base.disposition).toBe('PREVIEW_ONLY');
    if (base.disposition !== 'PREVIEW_ONLY') throw Error('missing report');
    expect(base.usage).toMatchObject({ inboundSmsSegments: 10, projectedOutboundSmsSegments: 10,
      inboundVoiceMinutes: 40, projectedOutboundVoiceMinutes: 20, projectedOutboundMms: 0 });
    expect(base.cost).toMatchObject({ fixedUsd: 2, voiceUsd: .7, smsUsd: .2, subtotalUsd: 2.9,
      reserveUsd: .73, totalUsd: 3.63, flag: 'within_demo_budget' });
    const near = evaluateQl209Analytics(request('yw', 'yw-rosevear-manager', { monthlyBudgetUsd: 4 }));
    expect(near.disposition === 'PREVIEW_ONLY' && near.cost.flag).toBe('approaching_demo_budget');
    const high = evaluateQl209Analytics(request('yw', 'yw-rosevear-manager', { monthlyBudgetUsd: 3 }));
    expect(high.disposition === 'PREVIEW_ONLY' && high.cost.flag).toBe('above_demo_budget');
    const cad = evaluateQl209Analytics(request('yw', 'yw-rosevear-manager', { currency: 'CAD', cadPerUsd: 1.5 }));
    expect(cad.disposition === 'PREVIEW_ONLY' && cad.cost.displayTotal).toBe(5.45);
    const scaled = evaluateQl209Analytics(request('yw', 'yw-rosevear-manager', { volumeMultiplier: 100 }));
    expect(scaled.disposition === 'PREVIEW_ONLY' && scaled.cost.totalUsd).toBeGreaterThan(base.cost.totalUsd);
  });

  it('fails closed for unbounded costs, invalid values, injected fields and bad persona scope', () => {
    const valid = request('icamp', 'camp-rosevear-manager');
    for (const invalid of [
      { ...valid, volumeMultiplier: 7 }, { ...valid, monthlyBudgetUsd: -1 },
      { ...valid, reservePercent: 101 }, { ...valid, cadPerUsd: Infinity },
      { ...valid, currency: 'JPY' }, { ...valid, providerId: 'unknown' },
      { ...valid, organizationId: 'foreign' }, { ...valid, injection: 'something' },
      { ...valid, monthlyBudgetUsd: NaN }
    ]) expect(evaluateQl209Analytics(invalid as Ql209ReportInput)).toMatchObject({ disposition: 'INVALID_REQUEST', report: null });
  });
});

let root: Root; let host: HTMLDivElement;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text));
  if (!button) throw Error(`Missing button ${text}`);
  await act(async () => button.click());
}
async function choose(selector: string, value: string) {
  const field = host.querySelector<HTMLSelectElement>(selector);
  if (!field) throw Error(`Missing ${selector}`);
  await act(async () => { const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!; set.call(field, value); field.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function typeNumber(selector: string, value: string) {
  const field = host.querySelector<HTMLInputElement>(selector);
  if (!field) throw Error(`Missing ${selector}`);
  await act(async () => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; set.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); field.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-209 reporting centre UI and controls', () => {
  it('shows fictional metrics, budget scenarios, scoped denial and company reset', async () => {
    await click('Reporting centre', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql209-release="${QL209_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('PLANNING DATA ONLY');
    expect(host.textContent).toContain('Visible mock handoffs');
    expect(host.textContent).toContain('WITHIN FICTIONAL BUDGET');
    await click('ⓘ Help', '.ql209-head button');
    expect(host.textContent).toContain('not measured performance');
    await typeNumber('#ql209-budget', '1');
    expect(host.textContent).toContain('FICTIONAL BUDGET EXCEEDED');
    await choose('#ql209-profile', 'dnd-owner');
    expect(host.textContent).toContain('ACCESS_DENIED');
    expect(host.textContent).toContain('No company, campground, property or cost totals are disclosed');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector<HTMLSelectElement>('#ql209-profile')?.value).toBe('camp-rosevear-manager');
    expect(host.querySelector<HTMLInputElement>('#ql209-budget')?.value).toBe('25');
    await choose('#ql209-profile', 'camp-isolated-manager');
    expect(host.textContent).toContain('ACCESS_DENIED');
    await click('Yard Workers', '.ql172-brand').catch(async () => click('YW · Property Maintenance', '.ql172-brand'));
    expect(host.querySelector<HTMLSelectElement>('#ql209-profile')?.value).toBe('yw-rosevear-manager');
    await choose('#ql209-profile', 'yw-property-a-reviewer');
    expect(host.textContent).toContain('Tenant-scoped analytics');
  });
});
