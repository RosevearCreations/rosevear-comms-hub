// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateQl173SyntheticFixtures } from '../../fixtures/ql173CanonicalSynthetic';
import { Ql180RoutingIvrPreview } from '../Ql180RoutingIvrPreview';
import {
  getQl180InboundSamples, QL180_SCENARIO_VERSION, simulateQl180Route,
  type Ql180Request
} from '../ql180RoutingIvr';

const migration = migrateQl173SyntheticFixtures();
const rosie = getQl180InboundSamples(migration, 'rosiedazzlers');
const maker = getQl180InboundSamples(migration, 'devilndove');
const base = (values: Partial<Ql180Request> = {}): Ql180Request => ({
  line: 'rosie_business_demo', hours: 'during_demo_hours', answer: 'answered_demo', digit: '1',
  personalOptIn: false, sourceEnvelope: rosie[0], ...values
});

describe('QL-180 checked-in inbound fixture and pure route decision model', () => {
  it('selects verified inbound voice mock examples only; no outbound or incoming SMS fixtures', () => {
    expect(migration.verified).toBe(true);
    expect(rosie).toHaveLength(1);
    expect(maker).toHaveLength(1);
    expect([...rosie, ...maker].every(row => row.event.kind === 'inbound_call' &&
      row.event.channel === 'voice' && row.event.mode === 'SIMULATED_ONLY')).toBe(true);
  });

  it('routes a Rosie business-line quote key to Rosie only, with zero physical operations', () => {
    const result = simulateQl180Route(migration, 'rosiedazzlers', base());
    expect(result).toMatchObject({ version: QL180_SCENARIO_VERSION, outcome: 'ROUTED_MOCK',
      destination: 'BRAND_OPERATOR_QUEUE_PREVIEW', brandDestination: 'rosiedazzlers',
      simulatedOnly: true, liveCalls: 0, sentMessages: 0, savedVoicemails: 0, externalWrites: 0 });
    expect(result.steps.map(row => row.stage)).toEqual(['fixture', 'line', 'brand', 'hours', 'availability', 'ivr', 'result']);
    expect(JSON.stringify(result)).not.toMatch(/\+1519|555-\d{4}|https?:\/\//);
  });

  it('routes Devil n Dove independently with a pinned Devil n Dove call', () => {
    const result = simulateQl180Route(migration, 'devilndove', base({ line: 'devil_business_demo', sourceEnvelope: maker[0], digit: '2' }));
    expect(result).toMatchObject({ outcome: 'ROUTED_MOCK', brandDestination: 'devilndove' });
    expect(result.steps.some(row => row.description.includes('Devil n Dove'))).toBe(true);
    expect(result.steps.some(row => row.description.includes('Rosie Dazzlers'))).toBe(false);
  });

  it('refuses wrong-business incoming lines before displaying the other business route', () => {
    const result = simulateQl180Route(migration, 'rosiedazzlers', base({ line: 'devil_business_demo' }));
    expect(result).toMatchObject({ outcome: 'BLOCKED_CROSS_BRAND', brandDestination: null, destination: 'NO_ROUTE' });
    expect(result.steps.some(row => row.stage === 'hours')).toBe(false);
  });

  it('shared unknown line uses explicit key 1 or 2 and does not silently infer a business', () => {
    expect(simulateQl180Route(migration, 'rosiedazzlers', base({ line: 'shared_unresolved_demo', digit: '1' }))).toMatchObject({ outcome: 'ROUTED_MOCK', brandDestination: 'rosiedazzlers' });
    expect(simulateQl180Route(migration, 'devilndove', base({ line: 'shared_unresolved_demo', digit: '2', sourceEnvelope: maker[0] }))).toMatchObject({ outcome: 'ROUTED_MOCK', brandDestination: 'devilndove' });
    expect(simulateQl180Route(migration, 'rosiedazzlers', base({ line: 'shared_unresolved_demo', digit: '2' }))).toMatchObject({ outcome: 'BLOCKED_CROSS_BRAND', brandDestination: null });
  });

  it('shared 0 replays identification; 9 invalid and # timeout remain brand-unresolved', () => {
    for (const [digit, outcome] of [['0', 'MENU_REPLAY_MOCK'], ['9', 'INVALID_KEY_MOCK'], ['#', 'BLOCKED_AMBIGUOUS']] as const) {
      const result = simulateQl180Route(migration, 'rosiedazzlers', base({ line: 'shared_unresolved_demo', digit }));
      expect(result).toMatchObject({ outcome, destination: 'BRAND_SELECTION_REQUIRED', brandDestination: null });
      expect(result.steps.some(row => row.stage === 'hours')).toBe(false);
    }
  });

  it('optional personal line is off by default and opt-in does not leak into either business', () => {
    expect(simulateQl180Route(migration, 'rosiedazzlers', base({ line: 'optional_personal_demo' }))).toMatchObject({ outcome: 'BLOCKED_PERSONAL', brandDestination: null });
    const opted = simulateQl180Route(migration, 'rosiedazzlers', base({ line: 'optional_personal_demo', personalOptIn: true }));
    expect(opted).toMatchObject({ outcome: 'PERSONAL_ISOLATED', destination: 'PERSONAL_PREVIEW_ONLY', brandDestination: null });
    expect(opted.steps.some(row => row.stage === 'hours' || row.stage === 'ivr')).toBe(false);
  });

  it('after-hours and holiday branches stop at synthetic voicemail placeholder', () => {
    for (const hours of ['after_demo_hours', 'holiday_closed_demo'] as const) {
      const result = simulateQl180Route(migration, 'rosiedazzlers', base({ hours }));
      expect(result).toMatchObject({ outcome: 'VOICEMAIL_MOCK', brandDestination: 'rosiedazzlers', savedVoicemails: 0 });
      expect(result.steps.some(row => row.stage === 'availability')).toBe(false);
    }
  });

  it('simulates missed-call, busy and provider-error safely with no retries', () => {
    for (const answer of ['no_answer_demo', 'busy_demo'] as const) {
      expect(simulateQl180Route(migration, 'rosiedazzlers', base({ answer }))).toMatchObject({ outcome: 'MISSED_MOCK', savedVoicemails: 0 });
    }
    expect(simulateQl180Route(migration, 'rosiedazzlers', base({ answer: 'mock_provider_error' })))
      .toMatchObject({ outcome: 'ERROR_HOLD_MOCK', destination: 'MANUAL_REVIEW_PREVIEW', externalWrites: 0 });
  });

  it('direct-line keypad 0/9/# safely replays, rejects or times out', () => {
    for (const [digit, outcome] of [['0', 'MENU_REPLAY_MOCK'], ['9', 'INVALID_KEY_MOCK'], ['#', 'KEY_TIMEOUT_MOCK']] as const) {
      expect(simulateQl180Route(migration, 'rosiedazzlers', base({ digit })).outcome).toBe(outcome);
    }
  });

  it('rejects foreign, modified, missing, inconsistent and non-inbound source envelopes', () => {
    const samples: unknown[] = [
      base({ sourceEnvelope: maker[0] }),
      base({ sourceEnvelope: { ...rosie[0], transport: 'REAL_WEBHOOK' } as unknown as Ql180Request['sourceEnvelope'] }),
      base({ sourceEnvelope: { ...rosie[0], event: { ...rosie[0].event, label: 'altered' } } }),
      { ...base(), number: 'real-number' },
      { ...base(), line: 'real-carrier-line' },
      { ...base(), digit: '*' },
      { ...base(), personalOptIn: 'yes' },
      { ...base(), sourceEnvelope: null }, null
    ];
    expect(samples.every(row => simulateQl180Route(migration, 'rosiedazzlers', row).outcome === 'BLOCKED_FIXTURE')).toBe(true);
    expect(simulateQl180Route({ ...migration, verified: false }, 'rosiedazzlers', base()).outcome).toBe('BLOCKED_FIXTURE');
    const drift = structuredClone(migration);
    drift.snapshot.messages[0].humanApproved = true;
    expect(simulateQl180Route(drift, 'rosiedazzlers', base()).outcome).toBe('BLOCKED_FIXTURE');
  });

  it('does not mutate checked-in synthetic source data across all route branches', () => {
    const original = JSON.stringify(migration.snapshot);
    for (const line of ['rosie_business_demo', 'devil_business_demo', 'shared_unresolved_demo', 'optional_personal_demo'] as const) {
      for (const digit of ['1', '2', '0', '9', '#'] as const) simulateQl180Route(migration, 'rosiedazzlers', base({ line, digit }));
    }
    expect(JSON.stringify(migration.snapshot)).toBe(original);
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Ql180RoutingIvrPreview brandId="rosiedazzlers" />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });

async function changeSelect(id: string, value: string) {
  const select = host.querySelector<HTMLSelectElement>(`#${id}`);
  if (!select) throw new Error(`Missing ${id}`);
  await act(async () => { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function press(label: string) {
  const button = [...host.querySelectorAll('button')].find(row => row.textContent?.includes(label));
  if (!button) throw new Error(`Missing action ${label}`);
  await act(async () => button.click());
}

describe('QL-180 accessible in-memory routing preview', () => {
  it('renders line, hours, answer and DTMF controls with an explicit disabled boundary', () => {
    expect(host.textContent).toContain('Multi-line routing & IVR preview simulator');
    expect(host.textContent).toContain('SIMULATED ONLY · ROUTING OFF');
    expect(host.querySelectorAll('#ql180-line option')).toHaveLength(4);
    expect(host.querySelector('#ql180-hours')).toBeTruthy();
    expect(host.querySelector('#ql180-answer')).toBeTruthy();
    expect(host.querySelector('#ql180-digit')).toBeTruthy();
    expect(host.textContent).toContain('Bell Fibe');
  });

  it('runs a mock route, renders a decision trace and clears it', async () => {
    await press('Simulate local route');
    expect(host.textContent).toContain('ROUTED MOCK');
    expect(host.querySelectorAll('.ql180-steps li')).toHaveLength(7);
    expect(host.textContent).toContain('REAL CALLS 0 · SMS 0 · VOICEMAILS SAVED 0 · EXTERNAL WRITES 0');
    await press('Clear route result');
    expect(host.querySelectorAll('.ql180-steps li')).toHaveLength(0);
  });

  it('shows ambiguous shared-key behavior and prevents cross-business routing', async () => {
    await changeSelect('ql180-line', 'shared_unresolved_demo');
    await changeSelect('ql180-digit', '#');
    await press('Simulate local route');
    expect(host.textContent).toContain('BLOCKED AMBIGUOUS');
    await changeSelect('ql180-digit', '2');
    await press('Simulate local route');
    expect(host.textContent).toContain('BLOCKED CROSS BRAND');
    expect(host.textContent).not.toContain('Custom order clarification sample');
  });

  it('requires explicit isolated personal opt-in and never dispatches', async () => {
    await changeSelect('ql180-line', 'optional_personal_demo');
    await press('Simulate local route');
    expect(host.textContent).toContain('BLOCKED PERSONAL');
    const checkbox = host.querySelector<HTMLInputElement>('#ql180-personal')!;
    await act(async () => checkbox.click());
    await press('Simulate local route');
    expect(host.textContent).toContain('PERSONAL ISOLATED');
    expect(host.textContent).toContain('REAL CALLS 0');
  });

  it('resets routing results and line selection when switching the active brand', async () => {
    await press('Simulate local route');
    await act(async () => root.render(<Ql180RoutingIvrPreview brandId="devilndove" />));
    expect(host.querySelector<HTMLSelectElement>('#ql180-line')?.value).toBe('devil_business_demo');
    expect(host.querySelectorAll('.ql180-steps li')).toHaveLength(0);
    await press('Simulate local route');
    expect(host.textContent).toContain('ROUTED MOCK');
    expect(host.textContent).not.toContain('SUV interior detail');
  });

  it('never touches fetch, storage or backend/network code', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('blocked'));
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await press('Simulate local route');
    await changeSelect('ql180-hours', 'holiday_closed_demo');
    await press('Simulate local route');
    expect(host.textContent).toContain('VOICEMAIL MOCK');
    expect(network).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    const code = readFileSync('src/operator/ql180RoutingIvr.ts', 'utf8') + readFileSync('src/operator/Ql180RoutingIvrPreview.tsx', 'utf8');
    expect(code).not.toMatch(/\bfetch\s*\(|\baxios\s*\(|\.from\s*\(|\.insert\s*\(|\.update\s*\(|localStorage\.|sendSms\s*\(|makeCall\s*\(/);
  });
});
