/** Read-only browser explanation. No Node harness, persistence, HTTP or provider runtime is imported. */
import type { BrandId } from '../types';

export const QL189_VERSION = 'ql189-synthetic-operations-safety-controls-v1' as const;
export const QL189_SAMPLE_LIMITS = Object.freeze({
  mockEventsPerMinute: 3, maxMockEventCents: 250, rollingMockBudgetCents: 500,
  rollingMockWindowHours: 24
});

export const QL189_SAFETY_CASES = [
  { key: 'limit', name: 'Burst and cross-business rate limits', outcome: 'RATE_BLOCKED',
    note: 'Each business has its own fictional three-event/minute window. Denied events never reserve fictional spend.' },
  { key: 'cost', name: 'Estimated provider cost guardrails', outcome: 'COST_BLOCKED',
    note: 'An invented per-event cap and rolling 24-hour cap reject projected overages, without payment or provider billing.' },
  { key: 'stop', name: 'Owner incident stop rehearsal', outcome: 'HALTED_MOCK',
    note: 'A fictional owner can stop mock intake for one business, without touching any actual infrastructure.' },
  { key: 'resume', name: 'Incident restart and rollback rehearsal', outcome: 'RESUMED_MOCK',
    note: 'A mock resumption cannot erase in-memory replay or spend history; real rollback needs separate owner sign-off.' },
  { key: 'scope', name: 'Cross-business isolation', outcome: 'DENIED_INPUT_OR_SCOPE',
    note: 'Untrusted business selection is never a substitute for server-side verified identity and tenant grants.' },
  { key: 'clock', name: 'Clock rollback and replay boundaries', outcome: 'DENIED_CLOCK',
    note: 'Synthetic clock rewind fails closed and accepted mock operation IDs cannot reserve twice.' },
  { key: 'audit', name: 'Privacy-safe operational evidence', outcome: 'REDACTED_MOCK_ONLY',
    note: 'A bounded audit shows only business, controlled disposition and minute bucket; no phone, body, session or secret.' },
  { key: 'no_live', name: 'Live-pilot hold remains active', outcome: 'NO_LIVE_DISPATCH',
    note: 'No real rate limit, alert pipeline, spend guard, rollback, telemetry collector or provider endpoint exists.' }
] as const;

export const QL189_LIVE_PREREQUISITES = [
  'Use a protected server runtime and provider-verified webhook authentication; never trust browser-selected business or role.',
  'Atomic distributed per-tenant/per-route rate caps, concurrency controls, bounded queues, provider-specific retries and 429/503 policy.',
  'Owner-approved real budget, provider tariffs/currency/taxes, independent billing reconciliation, pre-dispatch reservation and durable idempotency.',
  'Provider-side suspend/disable procedure, credential revocation, DNS/routing rollback, incident owner contact and timed recovery rehearsal.',
  'Privacy-minimized metrics, alert thresholds, restricted observability retention, incident evidence and no customer content in logs.',
  'Staging isolation, incident simulation, restoration review, Supabase role/RLS checks and independent QL-181 pilot authorization.'
] as const;

export type Ql189PreviewInput = Readonly<{
  activeBrand: unknown; targetBrand: unknown; mockEventsInMinute: unknown;
  rollingMockCents: unknown; nextMockCostCents: unknown; incidentStopped: unknown;
}>;

export type Ql189PreviewResult = Readonly<{
  version: typeof QL189_VERSION;
  disposition: 'INVALID_PREVIEW_REQUEST' | 'CROSS_BRAND_REJECTED' | 'HALTED_MOCK' |
    'RATE_BLOCKED' | 'COST_BLOCKED' | 'WOULD_PASS_MOCK';
  brandId: BrandId | null; explanation: string;
  illustrativeOnly: true; realSafetyControlsInstalled: false;
  liveDispatchAllowed: false; realCostChargedCents: 0; realStopSwitchInstalled: false;
  livePilotAuthorized: false; heldPrerequisites: 12;
  externalWrites: 0; callsPlaced: 0; messagesSent: 0;
}>;

/** No mutable browser state, storage, network or cryptographic execution. */
export function viewQl189DryRun(input: Ql189PreviewInput): Ql189PreviewResult {
  const base = { version: QL189_VERSION, illustrativeOnly: true, realSafetyControlsInstalled: false,
    liveDispatchAllowed: false, realCostChargedCents: 0, realStopSwitchInstalled: false,
    livePilotAuthorized: false, heldPrerequisites: 12,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 } as const;
  const brands = ['rosiedazzlers', 'devilndove'];
  if (!input || !brands.includes(input.activeBrand as string) || !brands.includes(input.targetBrand as string) ||
      !Number.isSafeInteger(input.mockEventsInMinute) || !Number.isSafeInteger(input.rollingMockCents) ||
      !Number.isSafeInteger(input.nextMockCostCents) || typeof input.incidentStopped !== 'boolean' ||
      (input.mockEventsInMinute as number) < 0 || (input.mockEventsInMinute as number) > 100 ||
      (input.rollingMockCents as number) < 0 || (input.rollingMockCents as number) > 100_000 ||
      (input.nextMockCostCents as number) <= 0 || (input.nextMockCostCents as number) > 100_000)
    return { ...base, brandId: null, disposition: 'INVALID_PREVIEW_REQUEST',
      explanation: 'Invalid synthetic numbers, business or incident selection.' };
  if (input.activeBrand !== input.targetBrand)
    return { ...base, brandId: null, disposition: 'CROSS_BRAND_REJECTED',
      explanation: 'Illustrative cross-business request denied; no other-brand evidence is shown.' };
  const brandId = input.activeBrand as BrandId;
  if (input.incidentStopped)
    return { ...base, brandId, disposition: 'HALTED_MOCK',
      explanation: 'The hypothetical incident stop blocks the mock operation before spend or rate evaluation.' };
  if ((input.mockEventsInMinute as number) >= QL189_SAMPLE_LIMITS.mockEventsPerMinute)
    return { ...base, brandId, disposition: 'RATE_BLOCKED',
      explanation: 'The selected fictional one-minute count meets or exceeds the mock threshold.' };
  if ((input.nextMockCostCents as number) > QL189_SAMPLE_LIMITS.maxMockEventCents ||
      (input.rollingMockCents as number) + (input.nextMockCostCents as number) > QL189_SAMPLE_LIMITS.rollingMockBudgetCents)
    return { ...base, brandId, disposition: 'COST_BLOCKED',
      explanation: 'The invented cost estimate exceeds the mock per-operation or rolling budget.' };
  return { ...base, brandId, disposition: 'WOULD_PASS_MOCK',
    explanation: 'This fictional review fits the sample thresholds, but cannot send, call, reserve real money or authorize a pilot.' };
}
