// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { previewYwHandoff, ywDemoCompanies, ywDemoProperties, ywInquiryFixtures } from '../ql203YwConnector';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text)); if (!button) throw Error(`Missing ${text}`); await act(async () => button.click()); }
async function choose(selector: string, value: string) { const input = host.querySelector<HTMLSelectElement>(selector)!; await act(async () => { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); }); }

describe('QL-203 YW property service mock connector', () => {
  it('accepts four fictional requests but never permits PMS side effects', () => {
    expect(ywDemoCompanies).toHaveLength(2);
    expect(ywDemoProperties).toHaveLength(3);
    expect(ywInquiryFixtures).toHaveLength(5);
    for (const fixture of ywInquiryFixtures.slice(0, 4)) {
      const result = previewYwHandoff('yw', connectorContracts.yw, fixture.companyId, fixture.propertyId, fixture.id);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.preview).toMatchObject({
        companyId: 'yard-rosevear-demo', propertyId: fixture.propertyId, threadId: fixture.threadId,
        propertyVerified: 'not_verified', crewAvailability: 'not_checked', estimate: 'not_issued',
        workOrder: 'not_created', dispatch: 'not_scheduled', billing: 'not_updated', communication: 'not_sent'
      });
      for (const foreign of ['rosiedazzlers', 'devilndove', 'icamp'] as const) {
        expect(previewYwHandoff(foreign, connectorContracts[foreign], fixture.companyId, fixture.propertyId, fixture.id)).toEqual({ ok: false, reason: 'wrong_organization' });
      }
      expect(previewYwHandoff('yw', connectorContracts.yw, 'yard-isolated-demo', 'yw-isolated-lot', fixture.id)).toEqual({ ok: false, reason: 'company_tenant_mismatch' });
    }
  });
  it('denies cross-company properties, mismatched property requests, disabled modules and unknown sources', () => {
    const snow = ywInquiryFixtures[0];
    expect(previewYwHandoff('yw', connectorContracts.icamp, snow.companyId, snow.propertyId, snow.id)).toEqual({ ok: false, reason: 'wrong_organization' });
    expect(previewYwHandoff('yw', connectorContracts.yw, 'missing-company', snow.propertyId, snow.id)).toEqual({ ok: false, reason: 'unknown_company' });
    expect(previewYwHandoff('yw', connectorContracts.yw, snow.companyId, 'missing-property', snow.id)).toEqual({ ok: false, reason: 'unknown_property' });
    expect(previewYwHandoff('yw', connectorContracts.yw, snow.companyId, 'yw-isolated-lot', snow.id)).toEqual({ ok: false, reason: 'property_tenant_mismatch' });
    expect(previewYwHandoff('yw', connectorContracts.yw, snow.companyId, 'yw-farm-road-demo', snow.id)).toEqual({ ok: false, reason: 'property_mismatch' });
    expect(previewYwHandoff('yw', connectorContracts.yw, snow.companyId, snow.propertyId, 'missing-fixture')).toEqual({ ok: false, reason: 'unknown_sample' });
    const tree = ywInquiryFixtures[4];
    expect(previewYwHandoff('yw', connectorContracts.yw, tree.companyId, tree.propertyId, tree.id)).toEqual({ ok: false, reason: 'module_disabled' });
  });
  it('allows a fictional handoff, shows module and property holds, and resets across organizations', async () => {
    await click('YW · Property Maintenance', '.ql172-brand');
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql203-release="ql203-yw-property-service-mock-v1"]')).not.toBeNull();
    await click('Preview YW service handoff');
    expect(host.textContent).toContain('Not created');
    expect(host.textContent).toContain('Not scheduled');
    await click('ⓘ Help', '.ql203-yw button');
    expect(host.textContent).toContain('tenant-scoped property ownership');
    await choose('#ql203-property', 'yw-farm-road-demo');
    await click('Preview YW service handoff');
    expect(host.textContent).toContain('No cross-tenant property information was shown');
    await choose('#ql203-inquiry', 'yw-demo-tree-held');
    await click('Preview YW service handoff');
    expect(host.textContent).toContain('service module is disabled');
    await choose('#ql203-inquiry', 'yw-demo-garbage');
    await click('Preview YW service handoff');
    expect(host.textContent).toContain('Stickers versus seasonal contract');
    await click('View fictional source conversation');
    expect(host.textContent).toContain('Unified inbox');
    await click('iCamp', '.ql172-brand');
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql203-release]')).toBeNull();
    expect(host.querySelector('[data-ql202-release]')).not.toBeNull();
  });
});
