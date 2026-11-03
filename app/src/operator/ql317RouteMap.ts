/** QL-317: display-only projection of the QL-298 deterministic, disabled simulator. */
import type { OrganizationId } from './ql191Organizations';
import { ql298Default, ql298Lines, ql298Menus, ql298Simulate, type Ql298Outcome, type Ql298Scenario } from './ql298RoutingStudio';

export type Ql317CaseId = 'baseline' | 'wrong_brand' | 'unknown_line' | 'closed_hours' | 'missing_option' | 'repeat_loop' | 'timeout' | 'carrier_error' | 'shared_claim';
export type Ql317StageId = 'line' | 'business' | 'hours' | 'menu' | 'fallback';
export type Ql317StageState = 'PREVIEW' | 'BLOCKED' | 'NOT_REACHED';
export type Ql317Stage = Readonly<{ id: Ql317StageId; title: string; state: Ql317StageState; detail: string }>;

export const ql317Examples: readonly { id: Ql317CaseId; label: string; guidance: string }[] = [
  { id: 'baseline', label: 'New inquiry · valid demo line', guidance: 'A local queue preview, never an actual transfer.' },
  { id: 'wrong_brand', label: 'Wrong business line · blocked', guidance: 'The active business gate must prevent cross-business context.' },
  { id: 'unknown_line', label: 'Unknown shared-line identity · hold', guidance: 'A shared line cannot guess which business the caller intended.' },
  { id: 'closed_hours', label: 'Closed hours · voicemail placeholder', guidance: 'The demo hours rule prevents IVR menu routing.' },
  { id: 'missing_option', label: 'Missing menu option · review hold', guidance: 'Key 9 is not mapped and cannot silently select another queue.' },
  { id: 'repeat_loop', label: 'Repeat menu · one-cycle stop', guidance: 'Key 0 offers one preview only; no automatic repeat or loop.' },
  { id: 'timeout', label: 'Timeout · manual hold', guidance: 'No keypad choice is assumed.' },
  { id: 'carrier_error', label: 'Mock carrier error · technical hold', guidance: 'There is no retry against any provider.' },
  { id: 'shared_claim', label: 'Shared line · manually claimed business', guidance: 'A fictional claim is not verified identity or permission to dispatch.' }
];

export function ql317Example(active: OrganizationId, example: Ql317CaseId): Ql298Scenario {
  const base = ql298Default(active);
  const other = ql298Lines.find((line) => line.id !== active && line.id !== 'shared_unidentified')!.id as OrganizationId;
  switch (example) {
    case 'wrong_brand': return { ...base, line: other };
    case 'unknown_line': return { ...base, line: 'shared_unidentified' };
    case 'closed_hours': return { ...base, hours: 'after_hours' };
    case 'missing_option': return { ...base, key: '9' };
    case 'repeat_loop': return { ...base, key: '0' };
    case 'timeout': return { ...base, key: '#' };
    case 'carrier_error': return { ...base, answer: 'provider_error' };
    case 'shared_claim': return { ...base, line: 'shared_unidentified', identifiedBusiness: active };
    default: return base;
  }
}

const fallbackReadback: Readonly<Record<Ql298Outcome, string>> = {
  QUEUE_PREVIEW: 'Disabled company queue preview only; no assignment or delivery.',
  VOICEMAIL_PREVIEW: 'Closed-hours voicemail placeholder; no message or recording created.',
  MISSED_CALL_PREVIEW: 'Missed-call placeholder; no callback or message created.',
  REPEAT_MENU: 'Repeat-menu preview terminates after one cycle; no automatic retry or fallback loop.',
  INVALID_KEY_HOLD: 'Unknown option blocked; manual operator review only.',
  TIMEOUT_HOLD: 'No keypad input; manual operator review only.',
  AMBIGUOUS_HOLD: 'Unknown shared-line business; manual brand identification required.',
  CROSS_BRAND_HOLD: 'Cross-business conflict blocked; no destination or contact context exposed.',
  PROVIDER_ERROR_HOLD: 'Mock carrier failure held for manual technical review; no provider retry.',
  INVALID_SCENARIO_HOLD: 'Unsupported scenario blocked; no route is available.'
};

export function ql317RouteMap(active: OrganizationId, scenario: Ql298Scenario) {
  const result = ql298Simulate(active, scenario);
  const blockedIdentity = ['AMBIGUOUS_HOLD', 'CROSS_BRAND_HOLD', 'INVALID_SCENARIO_HOLD'].includes(result.outcome);
  const closed = !blockedIdentity && scenario.hours !== 'open';
  const reachedMenu = !blockedIdentity && !closed && scenario.answer === 'answered';
  const invalidOption = reachedMenu && ['0', '9', '#'].includes(scenario.key);
  const isHold = result.outcome.includes('HOLD') || result.outcome === 'REPEAT_MENU';
  const menuText = scenario.key === '1' || scenario.key === '2'
    ? `${scenario.key} · ${ql298Menus[active][scenario.key === '1' ? 0 : 1]}`
    : scenario.key === '0' ? '0 · Repeat requested; single cycle only'
      : scenario.key === '9' ? '9 · Unmapped menu option' : '# · Simulated timeout';
  const stages: readonly Ql317Stage[] = [
    { id: 'line', title: '01 · Incoming line', state: result.outcome === 'INVALID_SCENARIO_HOLD' ? 'BLOCKED' : 'PREVIEW',
      detail: ql298Lines.find((line) => line.id === scenario.line)?.label ?? 'Unknown / unsupported demo line' },
    { id: 'business', title: '02 · Business gate', state: blockedIdentity ? 'BLOCKED' : 'PREVIEW',
      detail: blockedIdentity ? fallbackReadback[result.outcome] : scenario.line === 'shared_unidentified'
        ? `Manually claimed ${active} demo identity; not independently verified.` : `${active} fixture matched; no real routing grant.` },
    { id: 'hours', title: '03 · Hours & answer', state: blockedIdentity ? 'NOT_REACHED' : 'PREVIEW',
      detail: blockedIdentity ? 'Skipped: business gate stopped this route.' : closed
        ? `${scenario.hours.replaceAll('_', ' ')} · fictional voicemail path.` : `${scenario.hours} · ${scenario.answer.replaceAll('_', ' ')} (both simulated).` },
    { id: 'menu', title: '04 · IVR choice', state: !reachedMenu ? 'NOT_REACHED' : invalidOption ? 'BLOCKED' : 'PREVIEW',
      detail: reachedMenu ? menuText : 'Skipped: previous gate or answer state ended the route.' },
    { id: 'fallback', title: '05 · Final safe path', state: isHold ? 'BLOCKED' : 'PREVIEW',
      detail: `${result.destination.replaceAll('_', ' ')} · ${fallbackReadback[result.outcome]}` }
  ];
  return { result, stages, isHold, guidance: fallbackReadback[result.outcome] } as const;
}
