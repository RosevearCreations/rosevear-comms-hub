// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts, eligibleConnectorSamples } from '../ql199ConnectorContracts';
import { makerIntakeFixtures, previewMakerHandoff } from '../ql201DevilNDoveConnector';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text)); if (!button) throw Error(`Missing ${text}`); await act(async () => button.click()); }

describe('QL-201 Devil n Dove mock commission adapter', () => {
  it('maps two allowed fictional inquiries and never prices, publishes, allocates, charges or sends', () => {
    expect(makerIntakeFixtures).toHaveLength(2);
    expect(new Set(makerIntakeFixtures.map((fixture) => fixture.id)).size).toBe(2);
    expect(eligibleConnectorSamples('devilndove').some((fixture) => fixture.id === 'dnd-voicemail')).toBe(true);
    for (const fixture of makerIntakeFixtures) {
      const result = previewMakerHandoff('devilndove', connectorContracts.devilndove, fixture.id);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.preview).toMatchObject({
        threadId: fixture.threadId, review: 'maker_approval_required', quote: 'not_created',
        stock: 'not_reserved', production: 'not_started', media: 'not_imported',
        listing: 'not_published', payment: 'not_requested', communication: 'not_sent'
      });
      for (const foreign of ['rosiedazzlers', 'icamp', 'yw'] as const) {
        expect(previewMakerHandoff(foreign, connectorContracts[foreign], fixture.id)).toEqual({ ok: false, reason: 'wrong_organization' });
      }
    }
    expect(previewMakerHandoff('devilndove', connectorContracts.rosiedazzlers, makerIntakeFixtures[0].id)).toEqual({ ok: false, reason: 'wrong_organization' });
    expect(previewMakerHandoff('devilndove', connectorContracts.devilndove, 'dnd-sms')).toEqual({ ok: false, reason: 'unknown_sample' });
  });
  it('shows Devil n Dove only; previews a mock order and routes to its fictional source', async () => {
    await click('Devil n Dove', '.ql172-brand');
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql201-release="ql201-devilndove-commission-mock-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('SHOP DISCONNECTED');
    await click('Preview maker handoff');
    expect(host.textContent).toContain('Not published');
    expect(host.textContent).toContain('Not reserved');
    await click('ⓘ Help', '.ql201-maker button');
    expect(host.textContent).toContain('Canada-only shipping eligibility');
    await click('View fictional source conversation');
    expect(host.textContent).toContain('Unified inbox');
    await click('Rosie Dazzlers', '.ql172-brand');
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql201-release]')).toBeNull();
    expect(host.querySelector('[data-ql200-release]')).not.toBeNull();
  });
});
