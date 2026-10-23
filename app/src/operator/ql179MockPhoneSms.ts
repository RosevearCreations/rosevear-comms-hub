/**
 * QL-179 — strictly in-memory provider-neutral phone/SMS event emulator.
 * The mock receipt is an object passed to a pure function, NOT a network webhook.
 * It never validates real provider signatures, sends messages or places calls.
 */
import type { BrandId } from '../types';
import { validateQl173CanonicalSnapshot, type Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';
import { getQl178BrandTasks } from './ql178OperatorTasks';

export const QL179_SCHEMA = 'ql179-mock-event-v1' as const;
export const QL179_FIXTURE_SET = 'ql179-pinned-voice-sms-v1' as const;
export const QL179_MAX_RECEIPTS = 24;
export type Ql179Channel = 'voice' | 'sms';
export type Ql179Direction = 'inbound' | 'outbound_intent';
export type Ql179Kind = 'inbound_call' | 'missed_call' | 'voicemail' | 'inbound_sms' | 'outbound_call_intent' | 'outbound_sms_intent';
export type Ql179Status = 'RECEIVED_MOCK' | 'MISSED_MOCK' | 'VOICEMAIL_MOCK' | 'BLOCKED_MOCK' | 'FAILED_MOCK';
export type Ql179Error = 'NONE' | 'OUTBOUND_DISABLED' | 'MOCK_PROVIDER_TIMEOUT';

export type Ql179MockEvent = Readonly<{
  id: string;
  idempotencyKey: string;
  brandId: BrandId;
  conversationId: string;
  fixtureSourceId: string;
  channel: Ql179Channel;
  direction: Ql179Direction;
  kind: Ql179Kind;
  status: Ql179Status;
  error: Ql179Error;
  occurredAt: string;
  label: string;
  mode: 'SIMULATED_ONLY';
}>;

export type Ql179MockEnvelope = Readonly<{
  schema: typeof QL179_SCHEMA;
  fixtureSet: typeof QL179_FIXTURE_SET;
  transport: 'IN_MEMORY_ONLY';
  signatureState: 'NO_REAL_SIGNATURE_OR_AUTHENTICATION';
  event: Ql179MockEvent;
}>;

export type Ql179Receipt = Readonly<{ sequence: number; envelope: Ql179MockEnvelope; outcome: 'ACCEPTED_MOCK' }>;
export type Ql179Replay = Readonly<{
  receipts: readonly Ql179Receipt[];
  lastResult: 'READY' | 'ACCEPTED_MOCK' | 'DUPLICATE_IGNORED' | 'REJECTED_MOCK';
}>;
export type Ql179FeedRow = Readonly<{
  event: Ql179MockEvent;
  sequence: number;
  subject: string;
  taskTitle: string;
  syntheticOnly: true;
}>;

type Scenario = Readonly<{
  id: string;
  brandId: BrandId;
  sourceId: string;
  kind: Ql179Kind;
  status: Ql179Status;
  error: Ql179Error;
  label: string;
}>;

/** No external addresses, numbers, message bodies, provider IDs or callback URLs. */
const scenarios: readonly Scenario[] = [
  { id: 'rd-inbound-call', brandId: 'rosiedazzlers', sourceId: 'rosie-missed-call', kind: 'inbound_call', status: 'RECEIVED_MOCK', error: 'NONE', label: 'Example inbound call started' },
  { id: 'rd-missed-call', brandId: 'rosiedazzlers', sourceId: 'rosie-missed-call', kind: 'missed_call', status: 'MISSED_MOCK', error: 'NONE', label: 'Example call not answered' },
  { id: 'rd-voicemail', brandId: 'rosiedazzlers', sourceId: 'rosie-missed-call', kind: 'voicemail', status: 'VOICEMAIL_MOCK', error: 'NONE', label: 'Example voicemail indicator (no audio)' },
  { id: 'rd-inbound-sms', brandId: 'rosiedazzlers', sourceId: 'rosie-ceramic-quote', kind: 'inbound_sms', status: 'RECEIVED_MOCK', error: 'NONE', label: 'Example inbound SMS metadata (no text)' },
  { id: 'rd-outbound-sms-blocked', brandId: 'rosiedazzlers', sourceId: 'conversation:conv_rd_demo_1', kind: 'outbound_sms_intent', status: 'BLOCKED_MOCK', error: 'OUTBOUND_DISABLED', label: 'Example outbound SMS request blocked before dispatch' },
  { id: 'dd-inbound-call', brandId: 'devilndove', sourceId: 'devil-custom-order', kind: 'inbound_call', status: 'RECEIVED_MOCK', error: 'NONE', label: 'Example maker inquiry call' },
  { id: 'dd-inbound-sms', brandId: 'devilndove', sourceId: 'devil-maker-story', kind: 'inbound_sms', status: 'RECEIVED_MOCK', error: 'NONE', label: 'Example maker question SMS metadata (no text)' },
  { id: 'dd-voicemail', brandId: 'devilndove', sourceId: 'devil-maker-story', kind: 'voicemail', status: 'VOICEMAIL_MOCK', error: 'NONE', label: 'Example voicemail indicator (no audio)' },
  { id: 'dd-outbound-call-blocked', brandId: 'devilndove', sourceId: 'conversation:conv_dd_demo_1', kind: 'outbound_call_intent', status: 'BLOCKED_MOCK', error: 'OUTBOUND_DISABLED', label: 'Example outbound call request blocked before dial' },
  { id: 'dd-outbound-sms-failed', brandId: 'devilndove', sourceId: 'devil-custom-order', kind: 'outbound_sms_intent', status: 'FAILED_MOCK', error: 'MOCK_PROVIDER_TIMEOUT', label: 'Training-only carrier timeout: no send attempted' }
];

const kindDirection: Readonly<Record<Ql179Kind, Ql179Direction>> = {
  inbound_call: 'inbound', missed_call: 'inbound', voicemail: 'inbound', inbound_sms: 'inbound',
  outbound_call_intent: 'outbound_intent', outbound_sms_intent: 'outbound_intent'
};

function validSource(result: Ql173Migration, brandId: BrandId): boolean {
  return (brandId === 'rosiedazzlers' || brandId === 'devilndove') && result.verified &&
    validateQl173CanonicalSnapshot(result.snapshot).length === 0;
}

function exactFields(input: unknown, fields: readonly string[]): input is Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const keys = Object.keys(input);
  return keys.length === fields.length && keys.every(key => fields.includes(key));
}

const envelopeFields = ['schema', 'fixtureSet', 'transport', 'signatureState', 'event'];
const eventFields = ['id', 'idempotencyKey', 'brandId', 'conversationId', 'fixtureSourceId', 'channel',
  'direction', 'kind', 'status', 'error', 'occurredAt', 'label', 'mode'];

export function getQl179MockScenarios(result: Ql173Migration, brandId: BrandId): Ql179MockEnvelope[] {
  if (!validSource(result, brandId)) return [];
  const conversations = result.snapshot.conversations.filter(row => row.brandId === brandId);
  const contacts = new Map(result.snapshot.contacts.map(row => [row.id, row]));
  return scenarios.filter(row => row.brandId === brandId).flatMap((scenario, index) => {
    const conversation = conversations.find(row => row.provenance.sourceId === scenario.sourceId);
    if (!conversation || contacts.get(conversation.contactId)?.primaryBrand !== brandId) return [];
    const channel: Ql179Channel = scenario.kind.endsWith('sms') || scenario.kind.includes('sms_') ? 'sms' : 'voice';
    const event: Ql179MockEvent = {
      id: `ql179-${scenario.id}`, idempotencyKey: `ql179:${scenario.id}:${QL179_FIXTURE_SET}`,
      brandId, conversationId: conversation.id, fixtureSourceId: scenario.sourceId, channel,
      direction: kindDirection[scenario.kind], kind: scenario.kind, status: scenario.status,
      error: scenario.error, occurredAt: new Date(Date.parse('2026-10-23T18:00:00Z') + index * 60000).toISOString(),
      label: scenario.label, mode: 'SIMULATED_ONLY'
    };
    return [{ schema: QL179_SCHEMA, fixtureSet: QL179_FIXTURE_SET, transport: 'IN_MEMORY_ONLY',
      signatureState: 'NO_REAL_SIGNATURE_OR_AUTHENTICATION', event }];
  });
}

/** Validate an in-process fixture shape. This is NOT real webhook signature verification. */
export function validateQl179MockEnvelope(result: Ql173Migration, brandId: BrandId, input: unknown):
  { ok: true; envelope: Ql179MockEnvelope } | { ok: false; reason: string } {
  if (!validSource(result, brandId)) return { ok: false, reason: 'Invalid canonical source or brand' };
  if (!exactFields(input, envelopeFields) || !exactFields(input.event, eventFields)) return { ok: false, reason: 'Unrecognized fields or malformed mock envelope' };
  if (input.schema !== QL179_SCHEMA || input.fixtureSet !== QL179_FIXTURE_SET ||
    input.transport !== 'IN_MEMORY_ONLY' || input.signatureState !== 'NO_REAL_SIGNATURE_OR_AUTHENTICATION')
    return { ok: false, reason: 'Wrong fixture version or attempted external transport/authentication' };
  const event = input.event;
  if (event.brandId !== brandId || event.mode !== 'SIMULATED_ONLY') return { ok: false, reason: 'Foreign brand or non-synthetic event' };
  const pinned = getQl179MockScenarios(result, brandId).find(row => row.event.id === event.id);
  if (!pinned || eventFields.some(field => event[field] !== (pinned.event as unknown as Record<string, unknown>)[field]))
    return { ok: false, reason: 'Event does not match trusted checked-in mock fixture' };
  return { ok: true, envelope: pinned };
}

export const emptyQl179Replay = (): Ql179Replay => ({ receipts: [], lastResult: 'READY' });

function validReplay(result: Ql173Migration, brandId: BrandId, history: Ql179Replay): boolean {
  if (!history || !Array.isArray(history.receipts) || history.receipts.length > QL179_MAX_RECEIPTS) return false;
  const keys = new Set<string>();
  return history.receipts.every((entry, index) => {
    if (!entry || entry.sequence !== index + 1 || entry.outcome !== 'ACCEPTED_MOCK') return false;
    const validated = validateQl179MockEnvelope(result, brandId, entry.envelope);
    if (!validated.ok || keys.has(validated.envelope.event.idempotencyKey)) return false;
    keys.add(validated.envelope.event.idempotencyKey);
    return true;
  });
}

export function simulateQl179MockReceipt(
  result: Ql173Migration, brandId: BrandId, previous: Ql179Replay, candidate: unknown
): Ql179Replay {
  if (!validReplay(result, brandId, previous)) return { receipts: [], lastResult: 'REJECTED_MOCK' };
  const validated = validateQl179MockEnvelope(result, brandId, candidate);
  if (!validated.ok) return { ...previous, lastResult: 'REJECTED_MOCK' };
  if (previous.receipts.some(row => row.envelope.event.idempotencyKey === validated.envelope.event.idempotencyKey))
    return { ...previous, lastResult: 'DUPLICATE_IGNORED' };
  if (previous.receipts.length >= QL179_MAX_RECEIPTS) return { ...previous, lastResult: 'REJECTED_MOCK' };
  return { lastResult: 'ACCEPTED_MOCK', receipts: [...previous.receipts,
    { sequence: previous.receipts.length + 1, envelope: validated.envelope, outcome: 'ACCEPTED_MOCK' }] };
}

/** Derive a read-only operator feed from a validated, locally replayed mock receipt ledger. */
export function getQl179OperatorFeed(result: Ql173Migration, brandId: BrandId, history: Ql179Replay): Ql179FeedRow[] {
  if (!validSource(result, brandId) || !validReplay(result, brandId, history)) return [];
  const conversations = new Map(result.snapshot.conversations.filter(row => row.brandId === brandId).map(row => [row.id, row]));
  const tasks = new Map(getQl178BrandTasks(result, brandId).map(row => [row.conversationId, row.taskTitle]));
  return history.receipts.map(row => {
    const event = row.envelope.event;
    return { event, sequence: row.sequence, subject: conversations.get(event.conversationId)?.subject ?? 'Unmatched synthetic thread',
      taskTitle: tasks.get(event.conversationId) ?? 'No matching demo task', syntheticOnly: true as const };
  });
}
