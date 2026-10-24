/**
 * QL-180 — deterministic multi-line / IVR rehearsal, never a carrier routing table.
 * All input comes from pinned QL-173/179 fixtures and explicit UI demo choices.
 */
import type { BrandId } from '../types';
import type { Ql173Migration } from '../fixtures/ql173CanonicalSynthetic';
import {
  getQl179MockScenarios, validateQl179MockEnvelope, type Ql179MockEnvelope
} from './ql179MockPhoneSms';

export const QL180_SCENARIO_VERSION = 'ql180-ivr-route-preview-v1' as const;
export type Ql180Line = 'rosie_business_demo' | 'devil_business_demo' | 'shared_unresolved_demo' | 'optional_personal_demo';
export type Ql180Hours = 'during_demo_hours' | 'after_demo_hours' | 'holiday_closed_demo';
export type Ql180Answer = 'answered_demo' | 'no_answer_demo' | 'busy_demo' | 'mock_provider_error';
export type Ql180Key = '1' | '2' | '0' | '9' | '#';
export type Ql180Outcome =
  'ROUTED_MOCK' | 'VOICEMAIL_MOCK' | 'MISSED_MOCK' | 'MENU_REPLAY_MOCK' |
  'INVALID_KEY_MOCK' | 'KEY_TIMEOUT_MOCK' | 'ERROR_HOLD_MOCK' |
  'BLOCKED_AMBIGUOUS' | 'BLOCKED_CROSS_BRAND' | 'BLOCKED_PERSONAL' |
  'PERSONAL_ISOLATED' | 'BLOCKED_FIXTURE';

export type Ql180Request = Readonly<{
  line: Ql180Line;
  hours: Ql180Hours;
  answer: Ql180Answer;
  digit: Ql180Key;
  personalOptIn: boolean;
  sourceEnvelope: Ql179MockEnvelope;
}>;
export type Ql180Step = Readonly<{ stage: 'fixture' | 'line' | 'brand' | 'hours' | 'availability' | 'ivr' | 'result'; description: string }>;
export type Ql180Result = Readonly<{
  version: typeof QL180_SCENARIO_VERSION;
  outcome: Ql180Outcome;
  brandDestination: BrandId | null;
  destination: string;
  steps: readonly Ql180Step[];
  simulatedOnly: true;
  liveCalls: 0;
  sentMessages: 0;
  savedVoicemails: 0;
  externalWrites: 0;
}>;

export const QL180_LINES: ReadonlyArray<{ value: Ql180Line; label: string }> = [
  { value: 'rosie_business_demo', label: 'Rosie Dazzlers business line (sample)' },
  { value: 'devil_business_demo', label: 'Devil n Dove business line (sample)' },
  { value: 'shared_unresolved_demo', label: 'Shared hub · unidentified incoming line (sample)' },
  { value: 'optional_personal_demo', label: 'Optional personal line · isolated (sample)' }
];

const allowedHours: readonly Ql180Hours[] = ['during_demo_hours', 'after_demo_hours', 'holiday_closed_demo'];
const allowedAnswers: readonly Ql180Answer[] = ['answered_demo', 'no_answer_demo', 'busy_demo', 'mock_provider_error'];
const allowedDigits: readonly Ql180Key[] = ['1', '2', '0', '9', '#'];
const fields: readonly string[] = ['line', 'hours', 'answer', 'digit', 'personalOptIn', 'sourceEnvelope'];
const brandLabel: Readonly<Record<BrandId, string>> = { rosiedazzlers: 'Rosie Dazzlers', devilndove: 'Devil n Dove' };

/** Only inbound mock CALL events from a verified canonical source can be routed. */
export function getQl180InboundSamples(migration: Ql173Migration, brandId: BrandId): Ql179MockEnvelope[] {
  return getQl179MockScenarios(migration, brandId).filter(row =>
    row.event.kind === 'inbound_call' && row.event.channel === 'voice' && row.event.direction === 'inbound' &&
    row.event.status === 'RECEIVED_MOCK');
}

function validRequest(migration: Ql173Migration, brandId: BrandId, input: unknown): input is Ql180Request {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const candidate = input as Partial<Ql180Request>;
  if (Object.keys(input).length !== fields.length || Object.keys(input).some(key => !fields.includes(key)) ||
    !QL180_LINES.some(row => row.value === candidate.line) ||
    !allowedHours.includes(candidate.hours as Ql180Hours) ||
    !allowedAnswers.includes(candidate.answer as Ql180Answer) ||
    !allowedDigits.includes(candidate.digit as Ql180Key) ||
    typeof candidate.personalOptIn !== 'boolean') return false;
  const validated = validateQl179MockEnvelope(migration, brandId, candidate.sourceEnvelope);
  return validated.ok && getQl180InboundSamples(migration, brandId).some(row =>
    row.event.id === validated.envelope.event.id);
}

/** Fail closed for invalid fixture, unidentified line, brand mismatch or personal-line access. */
export function simulateQl180Route(migration: Ql173Migration, activeBrand: BrandId, input: unknown): Ql180Result {
  const steps: Ql180Step[] = [];
  const finish = (outcome: Ql180Outcome, destination: string, brandDestination: BrandId | null = null): Ql180Result => ({
    version: QL180_SCENARIO_VERSION, outcome, brandDestination, destination, steps,
    simulatedOnly: true, liveCalls: 0, sentMessages: 0, savedVoicemails: 0, externalWrites: 0
  });
  if (!validRequest(migration, activeBrand, input)) {
    steps.push({ stage: 'fixture', description: 'Unverified inbound fixture or unsupported input. Simulation denied.' });
    return finish('BLOCKED_FIXTURE', 'NO_ROUTE');
  }
  steps.push({ stage: 'fixture', description: 'Pinned QL-179 inbound-call example verified in local memory; no call received.' });
  steps.push({ stage: 'line', description: QL180_LINES.find(row => row.value === input.line)!.label });

  if (input.line === 'optional_personal_demo') {
    if (!input.personalOptIn) {
      steps.push({ stage: 'brand', description: 'Personal line is off by default. No forwarding or cross-brand delivery.' });
      return finish('BLOCKED_PERSONAL', 'NO_ROUTE');
    }
    steps.push({ stage: 'brand', description: 'Personal rehearsal remains isolated, without any business routing or contact data.' });
    return finish('PERSONAL_ISOLATED', 'PERSONAL_PREVIEW_ONLY');
  }

  let routeBrand: BrandId;
  if (input.line === 'shared_unresolved_demo') {
    if (input.digit === '0') {
      steps.push({ stage: 'ivr', description: 'Key 0 repeats brand selection. No brand guessed.' });
      return finish('MENU_REPLAY_MOCK', 'BRAND_SELECTION_REQUIRED');
    }
    if (input.digit === '9' || input.digit === '#') {
      steps.push({ stage: 'ivr', description: input.digit === '#' ? 'No brand key selected before simulated timeout.' : 'Unrecognized brand key; no business identity assumed.' });
      return finish(input.digit === '#' ? 'BLOCKED_AMBIGUOUS' : 'INVALID_KEY_MOCK', 'BRAND_SELECTION_REQUIRED');
    }
    routeBrand = input.digit === '1' ? 'rosiedazzlers' : 'devilndove';
    steps.push({ stage: 'ivr', description: `Synthetic key ${input.digit} selected ${brandLabel[routeBrand]} explicitly.` });
  } else {
    routeBrand = input.line === 'rosie_business_demo' ? 'rosiedazzlers' : 'devilndove';
  }

  if (routeBrand !== activeBrand) {
    steps.push({ stage: 'brand', description: 'Incoming line selection conflicts with active operator business; stop without displaying another brand’s conversation.' });
    return finish('BLOCKED_CROSS_BRAND', 'NO_ROUTE');
  }
  steps.push({ stage: 'brand', description: `${brandLabel[routeBrand]} sample line matches active business context.` });

  if (input.hours !== 'during_demo_hours') {
    steps.push({ stage: 'hours', description: input.hours === 'holiday_closed_demo' ? 'Synthetic holiday closure: no live schedule consulted.' : 'Synthetic after-hours rule: no live schedule consulted.' });
    steps.push({ stage: 'result', description: 'Voicemail indicator only; no greeting, audio, recording or callback created.' });
    return finish('VOICEMAIL_MOCK', 'BRAND_VOICEMAIL_PREVIEW', routeBrand);
  }
  steps.push({ stage: 'hours', description: 'Synthetic business-hours open; no calendar or account settings changed.' });

  if (input.answer === 'mock_provider_error') {
    steps.push({ stage: 'availability', description: 'Simulated provider error: hold and flag manual investigation; no retry or carrier request.' });
    return finish('ERROR_HOLD_MOCK', 'MANUAL_REVIEW_PREVIEW', routeBrand);
  }
  if (input.answer === 'no_answer_demo' || input.answer === 'busy_demo') {
    steps.push({ stage: 'availability', description: input.answer === 'no_answer_demo' ? 'Synthetic no-answer / missed call.' : 'Synthetic busy-line / unanswered call.' });
    steps.push({ stage: 'result', description: 'Missed-call and voicemail placeholder only; no audio saved or text sent.' });
    return finish('MISSED_MOCK', 'BRAND_VOICEMAIL_PREVIEW', routeBrand);
  }
  steps.push({ stage: 'availability', description: 'Synthetic answer reached the local IVR decision preview.' });
  if (input.line !== 'shared_unresolved_demo') {
    if (input.digit === '9') {
      steps.push({ stage: 'ivr', description: 'Invalid key; route requires an operator review. No dispatch.' });
      return finish('INVALID_KEY_MOCK', 'MANUAL_REVIEW_PREVIEW', routeBrand);
    }
    if (input.digit === '#') {
      steps.push({ stage: 'ivr', description: 'Simulated keypad timeout; voicemail placeholder only.' });
      return finish('KEY_TIMEOUT_MOCK', 'BRAND_VOICEMAIL_PREVIEW', routeBrand);
    }
    if (input.digit === '0') {
      steps.push({ stage: 'ivr', description: 'Key 0 repeats operator menu; no live transfer.' });
      return finish('MENU_REPLAY_MOCK', 'OPERATOR_MENU_PREVIEW', routeBrand);
    }
  }
  steps.push({ stage: 'ivr', description: input.line === 'shared_unresolved_demo' ?
    'Brand selection resolved; queue preview only.' :
    input.digit === '1' ? 'Key 1: new inquiry / quote-intake preview.' : 'Key 2: existing-customer follow-up preview.' });
  steps.push({ stage: 'result', description: 'Route would enter a brand-scoped operator queue; no call, transfer or message issued.' });
  return finish('ROUTED_MOCK', 'BRAND_OPERATOR_QUEUE_PREVIEW', routeBrand);
}
