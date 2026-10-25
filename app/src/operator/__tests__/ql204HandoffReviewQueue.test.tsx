// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { connectorContracts } from '../ql199ConnectorContracts';
import { buildMockReviewQueue } from '../ql204HandoffReviewQueue';
import type { OrganizationId } from '../ql191Organizations';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') { const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text)); if (!button) throw Error(`Missing ${text}`); await act(async () => button.click()); }
async function select(selector: string, value: string) { const input = host.querySelector<HTMLSelectElement>(selector)!; await act(async () => { input.value = value; input.dispatchEvent(new Event('change', { bubbles: true })); }); }
async function type(selector: string, value: string) { const input = host.querySelector<HTMLInputElement>(selector)!; await act(async () => { const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; native.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); }

describe('QL-204 four-company mock handoff review queue', () => {
  it('composes the four proven adapters with exact organization and no external actions', () => {
    const expected: Record<OrganizationId, [number, number]> = { rosiedazzlers: [2, 0], devilndove: [2, 0], icamp: [2, 0], yw: [4, 1] };
    const seen = new Set<string>();
    for (const id of Object.keys(expected) as OrganizationId[]) {
      const result = buildMockReviewQueue(id, connectorContracts[id]);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect([result.items.length, result.heldSamples]).toEqual(expected[id]);
      for (const item of result.items) {
        expect(item).toMatchObject({ organizationId: id, review: 'staff_required', externalActions: 'disabled' });
        expect(item.reference).toMatch(/^DEMO-/);
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      for (const foreign of Object.keys(expected).filter((value) => value !== id) as OrganizationId[]) {
        expect(buildMockReviewQueue(id, connectorContracts[foreign])).toEqual({ ok: false, reason: 'organization_mismatch' });
      }
    }
    expect(seen.size).toBe(10);
    const yw = buildMockReviewQueue('yw', connectorContracts.yw);
    if (yw.ok) expect(yw.items.some((item) => item.id === 'yw-demo-tree-held')).toBe(false);
  });
  it('filters, searches and locally reviews Rosie items without sending or persisting', async () => {
    await click('Connector centre', '.ql172-nav-button');
    expect(host.querySelector('[data-ql204-release="ql204-four-company-handoff-review-mock-v1"]')).not.toBeNull();
    expect(host.querySelectorAll('.ql204-item')).toHaveLength(2);
    await click('ⓘ Help', '.ql204-queue button');
    expect(host.textContent).toContain('Switching companies clears these local review flags');
    await click('Mark reviewed in session', '.ql204-actions button');
    expect(host.querySelectorAll('.ql204-item')).toHaveLength(1);
    expect(host.textContent).toContain('1');
    await select('#ql204-view', 'all');
    expect(host.querySelectorAll('.ql204-item')).toHaveLength(2);
    expect(host.textContent).toContain('Reviewed in this browser session only');
    await type('#ql204-search', 'ceramic');
    expect(host.querySelectorAll('.ql204-item')).toHaveLength(1);
    expect(host.textContent).toContain('Ceramic coating inquiry');
    await click('Open fictional inbox source', '.ql204-actions button');
    expect(host.textContent).toContain('Unified inbox');
  });
  it('never displays prior company items or review state after an organization switch', async () => {
    await click('Connector centre', '.ql172-nav-button');
    await click('Mark reviewed in session', '.ql204-actions button');
    await click('YW · Property Maintenance', '.ql172-brand');
    expect(host.querySelectorAll('.ql204-item')).toHaveLength(4);
    expect(host.textContent).toContain('Stickers versus seasonal contract');
    expect(host.textContent).not.toContain('Ceramic coating inquiry');
    await select('#ql204-view', 'high_priority');
    expect(host.querySelectorAll('.ql204-item')).toHaveLength(2);
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.querySelectorAll('.ql204-item')).toHaveLength(2);
    expect(host.querySelector<HTMLSelectElement>('#ql204-view')?.value).toBe('needs_review');
    expect(host.textContent).not.toContain('Urgent septic service triage');
  });
});
