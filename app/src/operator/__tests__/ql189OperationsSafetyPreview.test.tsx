// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql189OperationsSafetyPreview } from '../Ql189OperationsSafetyPreview';
import {
  QL189_VERSION, QL189_SAFETY_CASES, QL189_LIVE_PREREQUISITES,
  QL189_SAMPLE_LIMITS, viewQl189DryRun
} from '../ql189OperationsSafetyPreview';

const scenario = (overrides: Record<string, unknown> = {}) => ({
  activeBrand: 'rosiedazzlers', targetBrand: 'rosiedazzlers',
  mockEventsInMinute: 0, rollingMockCents: 0, nextMockCostCents: 100,
  incidentStopped: false, ...overrides
});

describe('QL-189 browser-only operations safety projections', () => {
  it('uses explicitly fictional thresholds and a finite playbook', () => {
    expect(QL189_VERSION).toBe('ql189-synthetic-operations-safety-controls-v1');
    expect(QL189_SAFETY_CASES).toHaveLength(8);
    expect(QL189_LIVE_PREREQUISITES).toHaveLength(6);
    expect(QL189_SAMPLE_LIMITS).toEqual({ mockEventsPerMinute: 3,
      maxMockEventCents: 250, rollingMockBudgetCents: 500, rollingMockWindowHours: 24 });
    expect(new Set(QL189_SAFETY_CASES.map(row => row.key)).size).toBe(8);
  });

  for (const brand of ['rosiedazzlers', 'devilndove'] as const) for (const [label, props, disposition] of [
    ['clean', {}, 'WOULD_PASS_MOCK'],
    ['rate cap', { mockEventsInMinute: 3 }, 'RATE_BLOCKED'],
    ['spend cap', { rollingMockCents: 450 }, 'COST_BLOCKED'],
    ['event cap', { nextMockCostCents: 300 }, 'COST_BLOCKED'],
    ['incident stop', { incidentStopped: true }, 'HALTED_MOCK']
  ] as const) {
    it(`${brand} ${label}: outcome has no live grants or external effects`, () => {
      const value = viewQl189DryRun(scenario({ activeBrand: brand, targetBrand: brand, ...props }));
      expect(value).toMatchObject({ version: QL189_VERSION, brandId: brand, disposition,
        illustrativeOnly: true, realSafetyControlsInstalled: false,
        liveDispatchAllowed: false, realCostChargedCents: 0,
        realStopSwitchInstalled: false, livePilotAuthorized: false,
        heldPrerequisites: 12, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    });
  }

  it('rejects cross-business preview before showing any other-brand result', () => {
    expect(viewQl189DryRun(scenario({ targetBrand: 'devilndove', incidentStopped: true })))
      .toMatchObject({ disposition: 'CROSS_BRAND_REJECTED', brandId: null });
  });

  it('rejects unknown, malformed and negative synthetic review input', () => {
    for (const patch of [
      { targetBrand: 'personal' }, { mockEventsInMinute: -1 },
      { mockEventsInMinute: 1.5 }, { rollingMockCents: -1 },
      { rollingMockCents: '500' }, { nextMockCostCents: NaN },
      { nextMockCostCents: 0 }, { incidentStopped: 'true' },
      { activeBrand: { toString: () => 'rosiedazzlers' } }
    ]) expect(viewQl189DryRun(scenario(patch)))
      .toMatchObject({ disposition: 'INVALID_PREVIEW_REQUEST', brandId: null });
  });

  it('gives incident stop precedence over fictional rate and cost', () => {
    expect(viewQl189DryRun(scenario({ mockEventsInMinute: 4,
      rollingMockCents: 500, nextMockCostCents: 300, incidentStopped: true })).disposition)
      .toBe('HALTED_MOCK');
  });

  it('enforces exact budget boundary but not real provider spending', () => {
    expect(viewQl189DryRun(scenario({ rollingMockCents: 250, nextMockCostCents: 250 })).disposition)
      .toBe('WOULD_PASS_MOCK');
    expect(viewQl189DryRun(scenario({ rollingMockCents: 251, nextMockCostCents: 250 })).disposition)
      .toBe('COST_BLOCKED');
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql189OperationsSafetyPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function select(id: string, value: string) {
  await act(async () => { const el = host.querySelector<HTMLSelectElement>(`#${id}`)!;
    el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-189 accessible operator preview and non-mutation', () => {
  it('labels all five inputs, shows help and makes no live claim', () => {
    expect(host.textContent).toContain('Operations safety controls — synthetic rehearsal');
    expect(host.textContent).toContain('NO LIVE SAFETY SERVICE · 12 PILOT HOLDS');
    expect(host.textContent).toContain('Training-only predictions');
    expect(host.textContent).toContain('ILLUSTRATIVE RESULT · WOULD_PASS_MOCK');
    expect(host.textContent).toContain('Real cost: $0');
    expect(host.querySelectorAll('.ql189-controls label[for]')).toHaveLength(5);
    expect(host.querySelectorAll('.ql189-table-wrap tbody tr')).toHaveLength(8);
    expect(host.querySelectorAll('.ql189-help summary')).toHaveLength(3);
    expect(host.querySelector('.ql189-result[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('explores mock rate, cost, stop and cross-brand outcomes without IO', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const remove = vi.spyOn(Storage.prototype, 'removeItem');
    await select('ql189-minute', '3');
    expect(host.textContent).toContain('ILLUSTRATIVE RESULT · RATE_BLOCKED');
    await select('ql189-minute', '0');
    await select('ql189-budget', '450');
    expect(host.textContent).toContain('ILLUSTRATIVE RESULT · COST_BLOCKED');
    await select('ql189-stop', 'stopped');
    expect(host.textContent).toContain('ILLUSTRATIVE RESULT · HALTED_MOCK');
    await select('ql189-brand', 'devilndove');
    expect(host.textContent).toContain('ILLUSTRATIVE RESULT · CROSS_BRAND_REJECTED');
    expect(network).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('resets dry-run settings upon remount to other brand', async () => {
    await select('ql189-stop', 'stopped');
    await act(async () => root.render(<Ql189OperationsSafetyPreview key="changed" brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql189-brand')?.value).toBe('devilndove');
    expect(host.querySelector<HTMLSelectElement>('#ql189-stop')?.value).toBe('normal');
    expect(host.textContent).toContain('for Devil n Dove');
    expect(host.textContent).toContain('ILLUSTRATIVE RESULT · WOULD_PASS_MOCK');
  });

  it('appears on Phone/SMS safety alongside previous safety modules', async () => {
    await act(async () => root.render(<OperatorShell key="full-shell" />));
    const button = [...host.querySelectorAll<HTMLButtonElement>('.ql172-nav-button')]
      .find(item => item.textContent?.includes('Phone/SMS safety'))!;
    await act(async () => button.click());
    expect(host.querySelector('.ql189-operations')).not.toBeNull();
    expect(host.querySelector('.ql188-security')).not.toBeNull();
    expect(host.querySelector('.ql187-cost')).not.toBeNull();
    expect(host.querySelector('.ql179-emulator')).not.toBeNull();
  });

  it('uses accessible focus, touch sizing, mobile and forced-contrast CSS', () => {
    const css = readFileSync('src/operator/ql189-operations-safety.css', 'utf8');
    for (const expected of ['min-height:44px', 'max-width:700px', 'max-width:375px',
      ':focus-visible', 'forced-colors:active']) expect(css).toContain(expected);
  });
});
