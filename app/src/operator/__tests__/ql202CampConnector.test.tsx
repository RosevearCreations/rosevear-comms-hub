// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { campDemoTenants, campIntakeFixtures, previewCampHandoff } from '../ql202CampConnector';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text)); if (!button) throw Error(`Missing ${text}`); await act(async () => button.click()); }
async function choose(selector: string, value: string) { const input = host.querySelector<HTMLSelectElement>(selector)!; await act(async () => { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); }); }

describe('QL-202 iCamp mock connector', () => {
  it('limits two fictional guest/booking fixtures to Camp Rosevear and holds all side effects', () => {
    expect(campIntakeFixtures).toHaveLength(2);
    expect(campDemoTenants).toHaveLength(2);
    for (const fixture of campIntakeFixtures) {
      const result = previewCampHandoff('icamp', connectorContracts.icamp, 'camp-rosevear-demo', fixture.id);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.preview).toMatchObject({
        campgroundId: 'camp-rosevear-demo', threadId: fixture.threadId,
        availability: 'not_checked', reservation: 'not_created', visitorPass: 'not_issued',
        gateAccess: 'not_granted', payment: 'not_requested', communication: 'not_sent'
      });
      expect(previewCampHandoff('icamp', connectorContracts.icamp, 'camp-isolated-demo', fixture.id)).toEqual({ ok: false, reason: 'tenant_mismatch' });
      for (const foreign of ['rosiedazzlers', 'devilndove', 'yw'] as const) {
        expect(previewCampHandoff(foreign, connectorContracts[foreign], 'camp-rosevear-demo', fixture.id)).toEqual({ ok: false, reason: 'wrong_organization' });
      }
    }
    expect(previewCampHandoff('icamp', connectorContracts.rosiedazzlers, 'camp-rosevear-demo', campIntakeFixtures[0].id)).toEqual({ ok: false, reason: 'wrong_organization' });
    expect(previewCampHandoff('icamp', connectorContracts.icamp, 'unknown', campIntakeFixtures[0].id)).toEqual({ ok: false, reason: 'unknown_campground' });
    expect(previewCampHandoff('icamp', connectorContracts.icamp, 'camp-rosevear-demo', 'camp-voice')).toEqual({ ok: false, reason: 'unknown_sample' });
  });
  it('previews Camp Rosevear; rejects the wrong campground and resets across companies', async () => {
    await click('iCamp', '.ql172-brand');
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql202-release="ql202-icamp-guest-reservation-mock-v1"]')).not.toBeNull();
    await click('Preview campground handoff');
    expect(host.textContent).toContain('Not created');
    expect(host.textContent).toContain('Not granted');
    await click('ⓘ Help', '.ql202-camp button');
    expect(host.textContent).toContain('per-campground tenancy');
    await choose('#ql202-campground', 'camp-isolated-demo');
    await click('Preview campground handoff');
    expect(host.textContent).toContain('No cross-campground data was shown');
    expect(host.textContent).not.toContain('Staff review required — fictional handoff');
    await choose('#ql202-campground', 'camp-rosevear-demo');
    await click('Preview campground handoff');
    await click('View fictional source conversation');
    expect(host.textContent).toContain('Unified inbox');
    await click('Devil n Dove', '.ql172-brand');
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql202-release]')).toBeNull();
    expect(host.querySelector('[data-ql201-release]')).not.toBeNull();
  });
});
