// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts, eligibleConnectorSamples, previewConnectorMapping } from '../ql199ConnectorContracts';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text)); if (!button) throw Error(`Missing ${text}`); await act(async () => button.click()); }

describe('QL-199 mock-only connector contracts', () => {
  it('defines distinct scoped contracts with no runtime capability for all four businesses', () => {
    const ids = ['rosiedazzlers', 'devilndove', 'icamp', 'yw'] as const;
    expect(new Set(ids.map((id) => connectorContracts[id].id)).size).toBe(4);
    for (const id of ids) {
      const contract = connectorContracts[id];
      expect(contract.organizationId).toBe(id);
      expect(contract.state).toBe('mock_only');
      expect(contract.requiredGates).toHaveLength(4);
      const samples = eligibleConnectorSamples(id);
      expect(samples.length).toBeGreaterThan(0);
      const result = previewConnectorMapping(id, contract, 'intake_preview', samples[0].id);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.preview).toMatchObject({ organizationId: id, sourceId: samples[0].id, safety: 'fictional_unconnected' });
      expect(previewConnectorMapping(id, contract, 'intake_preview', 'unknown')).toEqual({ ok: false, reason: 'source_not_allowed' });
      expect(previewConnectorMapping(id, contract, 'live_send' as never, samples[0].id)).toEqual({ ok: false, reason: 'operation_blocked' });
      const foreignId = ids.find((other) => other !== id)!;
      expect(previewConnectorMapping(id, connectorContracts[foreignId], 'intake_preview', samples[0].id)).toEqual({ ok: false, reason: 'organization_mismatch' });
      expect(previewConnectorMapping(id, contract, 'intake_preview', eligibleConnectorSamples(foreignId)[0].id)).toEqual({ ok: false, reason: 'source_not_allowed' });
    }
  });
  it('shows a usable mapping rehearsal and resets it on company changes', async () => {
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql199-release="ql199-mock-connector-contracts-v1"]')).not.toBeNull();
    expect(host.textContent).toContain('NOT CONNECTED');
    await click('ⓘ Help');
    expect(host.textContent).toContain('does not import data');
    await click('Show required approval gates');
    expect(host.querySelectorAll('#ql199-gates li')).toHaveLength(4);
    await click('Inspect fictional mapping');
    expect(host.textContent).toContain('Valid sample mapping');
    expect(host.textContent).toContain('DEMO-');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql199-release]')).not.toBeNull();
    expect(host.textContent).toContain('Campground guest and reservation intake');
    expect(host.textContent).not.toContain('Valid sample mapping');
  });
});
