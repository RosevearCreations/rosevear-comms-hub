import type { OrganizationId } from './ql191Organizations';

export const QL298_VERSION = 'ql298-four-business-scenario-v1';
export type Ql298Line = OrganizationId | 'shared_unidentified';
export type Ql298Hours = 'open' | 'after_hours' | 'holiday_closed';
export type Ql298Answer = 'answered' | 'no_answer' | 'busy' | 'provider_error';
export type Ql298Key = '1' | '2' | '0' | '9' | '#';
export type Ql298Scenario = Readonly<{ line: Ql298Line; identifiedBusiness: OrganizationId | 'unidentified'; hours: Ql298Hours; answer: Ql298Answer; key: Ql298Key }>;
export type Ql298Outcome = 'QUEUE_PREVIEW' | 'VOICEMAIL_PREVIEW' | 'MISSED_CALL_PREVIEW' | 'REPEAT_MENU' | 'INVALID_KEY_HOLD' | 'TIMEOUT_HOLD' | 'AMBIGUOUS_HOLD' | 'CROSS_BRAND_HOLD' | 'PROVIDER_ERROR_HOLD' | 'INVALID_SCENARIO_HOLD';
export type Ql298Result = Readonly<{ outcome: Ql298Outcome; destination: string; steps: readonly string[]; simulatedOnly: true; liveCalls: 0; forwards: 0; messages: 0; recordings: 0; writes: 0 }>;

export const ql298Lines: readonly { id: Ql298Line; label: string }[] = [
  { id: 'rosiedazzlers', label: 'Rosie Dazzlers demo line' },
  { id: 'devilndove', label: 'Devil n Dove demo line' },
  { id: 'yw', label: 'Yard Workers demo line' },
  { id: 'icamp', label: 'iCamp demo line' },
  { id: 'shared_unidentified', label: 'Shared unidentified demo line' }
];
export const ql298Menus: Readonly<Record<OrganizationId, readonly [string, string]>> = {
  rosiedazzlers: ['New detailing inquiry', 'Existing detailing follow-up'],
  devilndove: ['New custom maker order', 'Existing order follow-up'],
  yw: ['New property-service request', 'Existing job follow-up'],
  icamp: ['New campsite/cottage inquiry', 'Existing stay support']
};
export function ql298Default(organizationId: OrganizationId): Ql298Scenario {
  return { line: organizationId, identifiedBusiness: 'unidentified', hours: 'open', answer: 'answered', key: '1' };
}

export function ql298Simulate(active: OrganizationId, scenario: unknown): Ql298Result {
  const steps: string[] = [];
  const finish = (outcome: Ql298Outcome, destination: string): Ql298Result => ({
    outcome, destination, steps, simulatedOnly: true, liveCalls: 0, forwards: 0, messages: 0, recordings: 0, writes: 0
  });
  if (!scenario || typeof scenario !== 'object' || Array.isArray(scenario)) return finish('INVALID_SCENARIO_HOLD', 'NO_ROUTE');
  const s = scenario as Partial<Ql298Scenario>;
  if (Object.keys(s).length !== 5 || !ql298Lines.some((line) => line.id === s.line) ||
    !['unidentified', 'rosiedazzlers', 'devilndove', 'yw', 'icamp'].includes(s.identifiedBusiness ?? '') ||
    !['open', 'after_hours', 'holiday_closed'].includes(s.hours ?? '') ||
    !['answered', 'no_answer', 'busy', 'provider_error'].includes(s.answer ?? '') ||
    !['1', '2', '0', '9', '#'].includes(s.key ?? '')) return finish('INVALID_SCENARIO_HOLD', 'NO_ROUTE');

  steps.push(`Source: CHECKED_IN_SYNTHETIC/${QL298_VERSION} · no real inbound call`);
  steps.push(`Line: ${ql298Lines.find((line) => line.id === s.line)!.label}`);
  let route: OrganizationId;
  if (s.line === 'shared_unidentified') {
    if (s.identifiedBusiness === 'unidentified') {
      steps.push('Shared line has no verified business identity; no guessing or cross-tenant routing.');
      return finish('AMBIGUOUS_HOLD', 'MANUAL_BRAND_IDENTIFICATION');
    }
    route = s.identifiedBusiness!;
    steps.push(`Manual fictional identification selected ${route}; no identity verification or live transfer.`);
  } else {
    route = s.line!;
    if (s.identifiedBusiness !== 'unidentified' && s.identifiedBusiness !== route) {
      steps.push('Conflicting claimed business and source line; stop before revealing any company context.');
      return finish('CROSS_BRAND_HOLD', 'NO_ROUTE');
    }
  }
  if (route !== active) {
    steps.push('Active company differs from demo destination; tenant gate blocks the route.');
    return finish('CROSS_BRAND_HOLD', 'NO_ROUTE');
  }
  steps.push(`Company gate passed for ${active} fixture only.`);
  if (s.hours !== 'open') {
    steps.push(s.hours === 'holiday_closed' ? 'Synthetic holiday closure applies.' : 'Synthetic after-hours schedule applies.');
    return finish('VOICEMAIL_PREVIEW', 'COMPANY_VOICEMAIL_PLACEHOLDER');
  }
  if (s.answer === 'provider_error') {
    steps.push('Mock carrier error: manual technical review; no provider retry.');
    return finish('PROVIDER_ERROR_HOLD', 'MANUAL_TECHNICAL_REVIEW');
  }
  if (s.answer !== 'answered') {
    steps.push(`Mock ${s.answer!.replace('_', ' ')} event; no message or recording saved.`);
    return finish('MISSED_CALL_PREVIEW', 'COMPANY_MISSED_CALL_PLACEHOLDER');
  }
  if (s.key === '9') { steps.push('Invalid keypad option requires manual fallback.'); return finish('INVALID_KEY_HOLD', 'MANUAL_OPERATOR_REVIEW'); }
  if (s.key === '#') { steps.push('Keypad timed out; no business decision assumed.'); return finish('TIMEOUT_HOLD', 'MANUAL_OPERATOR_REVIEW'); }
  if (s.key === '0') { steps.push('Repeat the fictional menu without queue assignment.'); return finish('REPEAT_MENU', 'MENU_PREVIEW_ONLY'); }
  steps.push(`Menu ${s.key}: ${ql298Menus[active][s.key === '1' ? 0 : 1]}.`);
  return finish('QUEUE_PREVIEW', s.key === '1' ? 'NEW_INQUIRY_QUEUE_PREVIEW' : 'EXISTING_REQUEST_QUEUE_PREVIEW');
}
