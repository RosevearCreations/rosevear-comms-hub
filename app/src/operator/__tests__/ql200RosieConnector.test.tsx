// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { previewRosieHandoff, rosieIntakeFixtures } from '../ql200RosieConnector';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const control = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((node) => node.textContent?.includes(text)); if (!control) throw Error(`Missing ${text}`); await act(async () => control.click()); }

describe('QL-200 Rosie quote and booking adapter', () => {
  it('maps exactly two fictional Rosie sources with no pricing or booking side effects', () => {
    expect(rosieIntakeFixtures).toHaveLength(2);
    const ids = rosieIntakeFixtures.map((sample) => sample.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const sample of rosieIntakeFixtures) {
      const result = previewRosieHandoff('rosiedazzlers', connectorContracts.rosiedazzlers, sample.id);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.preview).toMatchObject({
        sourceId: sample.sourceId, state: 'operator_review_required', pricing: 'not_quoted', availability: 'not_checked',
        booking: 'not_created', deposit: 'not_requested', delivery: 'not_sent'
      });
      for (const foreign of ['devilndove', 'icamp', 'yw'] as const) {
        expect(previewRosieHandoff(foreign, connectorContracts[foreign], sample.id)).toEqual({ ok: false, reason: 'wrong_organization' });
      }
    }
    expect(previewRosieHandoff('rosiedazzlers', connectorContracts.devilndove, ids[0])).toEqual({ ok: false, reason: 'wrong_organization' });
    expect(previewRosieHandoff('rosiedazzlers', connectorContracts.rosiedazzlers, 'rd-sms')).toEqual({ ok: false, reason: 'unknown_sample' });
  });
  it('previews a Rosie-only mock handoff and navigates to its fictional inbox source', async () => {
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql200-release="ql200-rosie-quote-booking-mock-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('SOURCE DISCONNECTED');
    await click('Preview handoff fields');
    expect(host.textContent).toContain('Not quoted');
    expect(host.textContent).toContain('Not checked');
    expect(host.textContent).toContain('Not created');
    await click('ⓘ Help', '.ql200-rosie button');
    expect(host.textContent).toContain('No customer names, booking slots, Stripe deposits');
    await click('View fictional source conversation');
    expect(host.textContent).toContain('Unified inbox');
    await click('iCamp', '.ql172-brand');
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql200-release]')).toBeNull();
  });
});
