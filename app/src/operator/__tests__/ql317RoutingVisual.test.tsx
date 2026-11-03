// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { operatorOrganizations } from '../ql191Organizations';
import { Ql298RoutingStudio } from '../Ql298RoutingStudio';
import { ql298Default, ql298Simulate } from '../ql298RoutingStudio';
import { ql317Example, ql317Examples, ql317RouteMap } from '../ql317RouteMap';

const expected = {
  baseline: ['QUEUE_PREVIEW', 'NEW_INQUIRY_QUEUE_PREVIEW'],
  wrong_brand: ['CROSS_BRAND_HOLD', 'NO_ROUTE'],
  unknown_line: ['AMBIGUOUS_HOLD', 'MANUAL_BRAND_IDENTIFICATION'],
  closed_hours: ['VOICEMAIL_PREVIEW', 'COMPANY_VOICEMAIL_PLACEHOLDER'],
  missing_option: ['INVALID_KEY_HOLD', 'MANUAL_OPERATOR_REVIEW'],
  repeat_loop: ['REPEAT_MENU', 'MENU_PREVIEW_ONLY'],
  timeout: ['TIMEOUT_HOLD', 'MANUAL_OPERATOR_REVIEW'],
  carrier_error: ['PROVIDER_ERROR_HOLD', 'MANUAL_TECHNICAL_REVIEW'],
  shared_claim: ['QUEUE_PREVIEW', 'NEW_INQUIRY_QUEUE_PREVIEW']
} as const;

describe('QL-317 deterministic IVR decision map and safe fallback parity', () => {
  for (const org of operatorOrganizations) {
    it(`${org.id}: nine guided cases match QL-298 source outcomes and hold boundaries`, () => {
      expect(ql317Examples).toHaveLength(Object.keys(expected).length);
      for (const { id } of ql317Examples) {
        const scenario = ql317Example(org.id, id);
        const map = ql317RouteMap(org.id, scenario);
        expect([map.result.outcome, map.result.destination]).toEqual(expected[id]);
        expect(map.result).toEqual(ql298Simulate(org.id, scenario));
        expect(map.stages.map(({ id }) => id)).toEqual(['line', 'business', 'hours', 'menu', 'fallback']);
        expect(map.stages.every(({ detail }) => detail.trim().length > 0)).toBe(true);
        expect(map.stages[4].detail).toContain(map.result.destination.replaceAll('_', ' '));
        expect(map.result).toMatchObject({ simulatedOnly: true, liveCalls: 0, forwards: 0, messages: 0, recordings: 0, writes: 0 });
        expect(map.guidance).toMatch(/preview|placeholder|hold|blocked|review|repeat|route|retry|one cycle|operator|identification/i);
      }
      expect(ql317RouteMap(org.id, ql317Example(org.id, 'wrong_brand')).stages[1].state).toBe('BLOCKED');
      expect(ql317RouteMap(org.id, ql317Example(org.id, 'unknown_line')).stages[2].state).toBe('NOT_REACHED');
      expect(ql317RouteMap(org.id, ql317Example(org.id, 'closed_hours')).stages[3].state).toBe('NOT_REACHED');
      expect(ql317RouteMap(org.id, ql317Example(org.id, 'missing_option')).stages[3].state).toBe('BLOCKED');
      expect(ql317RouteMap(org.id, ql317Example(org.id, 'repeat_loop')).stages[4].state).toBe('BLOCKED');
      expect(ql317RouteMap(org.id, ql317Example(org.id, 'repeat_loop')).guidance).toContain('no automatic');
    });
    it(`${org.id}: two diagrams and tables render identical five-stage label/state/details`, () => {
      const html = renderToStaticMarkup(<Ql298RoutingStudio organization={org} />);
      const page = document.createElement('div'); page.innerHTML = html;
      expect(page.querySelector('[data-ql317-release="diagram-table-fallback-v1"]')).not.toBeNull();
      expect(page.textContent).toContain(org.name);
      expect(page.textContent).toContain('DISABLED SYNTHETIC PREVIEW');
      for (const letter of ['A', 'B']) {
        const section = page.querySelector(`[data-scenario="${letter}"]`)!;
        const diagram = [...section.querySelectorAll('.ql317-map li')];
        const rows = [...section.querySelectorAll('.ql317-table-wrap tbody tr')];
        expect(diagram).toHaveLength(5); expect(rows).toHaveLength(5);
        for (let stage = 0; stage < 5; stage++) {
          expect(diagram[stage].getAttribute('data-ql317-step')).toBe(rows[stage].getAttribute('data-ql317-step'));
          expect(diagram[stage].getAttribute('data-ql317-state')).toBe(rows[stage].getAttribute('data-ql317-state'));
          expect(diagram[stage].querySelector('strong')!.textContent).toBe(rows[stage].querySelector('th')!.textContent);
          expect(diagram[stage].querySelector('p')!.textContent).toBe(rows[stage].querySelectorAll('td')[1].textContent);
          expect(diagram[stage].querySelector('.ql317-pill')!.textContent).toBe(rows[stage].querySelectorAll('td')[0].textContent);
        }
      }
      expect(page.querySelectorAll('table caption')).toHaveLength(2);
      expect(page.textContent).toContain('REAL CALLS 0');
      expect(page.textContent).toContain('EXTERNAL WRITES 0');
      expect(page.querySelectorAll('.ql317-preset button:disabled')).toHaveLength(2);
    });
  }

  it('still fails closed on malformed unknown lines and no implicit automatic fallback loop', () => {
    const base = ql298Default('rosiedazzlers');
    const result = ql298Simulate('rosiedazzlers', { ...base, line: 'unknown_phone_number' });
    expect(result.outcome).toBe('INVALID_SCENARIO_HOLD');
    expect(result.destination).toBe('NO_ROUTE');
    expect(ql317RouteMap('rosiedazzlers', { ...base, key: '0' }).result.steps).not.toContain('Queue assignment');
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<Ql298RoutingStudio organization={operatorOrganizations[0]} />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

async function select(selector: string, value: string) {
  const field = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { field.value = value; field.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function click(text: string, scenario: string) {
  const button = [...host.querySelectorAll<HTMLButtonElement>(`${scenario} button`)].find((candidate) => candidate.textContent?.includes(text));
  if (!button) throw new Error(`Missing button: ${text}`);
  await act(async () => button.click());
}

describe('QL-317 guided comparison, local edits and revert', () => {
  it('loads blocked example, edits and reverts A without changing B, with diagram-table parity', async () => {
    await select('#ql317-preset-A', 'wrong_brand');
    expect(host.querySelector('[data-scenario="A"] .ql317-result')?.textContent).toContain('CROSS BRAND HOLD');
    expect(host.querySelector('[data-scenario="B"] .ql317-result')?.textContent).toContain('VOICEMAIL PREVIEW');
    const line = host.querySelector<HTMLSelectElement>('[data-scenario="A"] .ql298-fields select')!;
    await select('[data-scenario="A"] .ql298-fields select', 'rosiedazzlers');
    expect(line.value).toBe('rosiedazzlers');
    expect(host.querySelector('[data-scenario="A"] .ql317-result')?.textContent).toContain('QUEUE PREVIEW');
    const revert = host.querySelector<HTMLButtonElement>('[data-scenario="A"] .ql317-preset button')!;
    expect(revert.disabled).toBe(false);
    await click('Revert edits', '[data-scenario="A"]');
    expect(revert.disabled).toBe(true);
    expect(host.querySelector('[data-scenario="A"] .ql317-result')?.textContent).toContain('CROSS BRAND HOLD');
    for (const side of ['A', 'B']) {
      const section = host.querySelector(`[data-scenario="${side}"]`)!;
      expect([...section.querySelectorAll('.ql317-map li')].map((step) => step.getAttribute('data-ql317-state')))
        .toEqual([...section.querySelectorAll('tbody tr')].map((step) => step.getAttribute('data-ql317-state')));
    }
  });
  it('explains single-cycle repeat, exposes help, and restores both defaults', async () => {
    await select('#ql317-preset-B', 'repeat_loop');
    expect(host.querySelector('[data-scenario="B"] .ql317-result')?.textContent).toContain('REPEAT MENU');
    expect(host.querySelector('[data-scenario="B"] .ql317-map')?.textContent).toContain('single cycle');
    await click('Routing help', '.ql317-hero');
    expect(host.querySelector('#ql317-help')?.textContent).toContain('Nothing auto-runs');
    await click('Reset both sample scenarios', '.ql298-actions');
    expect(host.querySelector<HTMLSelectElement>('#ql317-preset-A')?.value).toBe('baseline');
    expect(host.querySelector<HTMLSelectElement>('#ql317-preset-B')?.value).toBe('closed_hours');
    expect(host.querySelector('[data-scenario="B"] .ql317-result')?.textContent).toContain('VOICEMAIL PREVIEW');
  });
});
