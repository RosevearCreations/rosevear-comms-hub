import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Ql298RoutingStudio } from '../Ql298RoutingStudio';
import { ql298Default, ql298Lines, ql298Menus, ql298Simulate, type Ql298Scenario } from '../ql298RoutingStudio';
import { operatorOrganizations } from '../ql191Organizations';

describe('QL-298 isolated multi-line IVR scenario studio', () => {
  it('has four company lines plus an unassigned shared line, with distinct menus', () => {
    expect(ql298Lines).toHaveLength(5);
    expect(new Set(Object.values(ql298Menus).map((menu) => menu[0])).size).toBe(4);
  });

  for (const org of operatorOrganizations) {
    it(`${org.id}: deterministic route, hours, missed call, keypad and ambiguous fallback`, () => {
      const baseline = ql298Default(org.id);
      const run = (changes: Partial<Ql298Scenario>) => ql298Simulate(org.id, { ...baseline, ...changes });
      expect(run({}).outcome).toBe('QUEUE_PREVIEW');
      expect(run({ key: '2' }).destination).toBe('EXISTING_REQUEST_QUEUE_PREVIEW');
      expect(run({ hours: 'after_hours' }).outcome).toBe('VOICEMAIL_PREVIEW');
      expect(run({ hours: 'holiday_closed' }).outcome).toBe('VOICEMAIL_PREVIEW');
      expect(run({ answer: 'no_answer' }).outcome).toBe('MISSED_CALL_PREVIEW');
      expect(run({ answer: 'busy' }).outcome).toBe('MISSED_CALL_PREVIEW');
      expect(run({ answer: 'provider_error' }).outcome).toBe('PROVIDER_ERROR_HOLD');
      expect(run({ key: '9' }).outcome).toBe('INVALID_KEY_HOLD');
      expect(run({ key: '#' }).outcome).toBe('TIMEOUT_HOLD');
      expect(run({ key: '0' }).outcome).toBe('REPEAT_MENU');
      expect(run({ line: 'shared_unidentified' }).outcome).toBe('AMBIGUOUS_HOLD');
      expect(run({ line: 'shared_unidentified', identifiedBusiness: org.id }).outcome).toBe('QUEUE_PREVIEW');
      expect(run({}).liveCalls).toBe(0);
      expect(run({}).writes).toBe(0);
      const html = renderToStaticMarkup(<Ql298RoutingStudio organization={org} />);
      expect(html).toContain('REAL CALLS 0');
      expect(html).toContain(org.name);
    });
  }

  it('blocks cross-company destinations and conflicting identity; rejects malformed keys', () => {
    expect(ql298Simulate('rosiedazzlers', ql298Default('icamp')).outcome).toBe('CROSS_BRAND_HOLD');
    expect(ql298Simulate('rosiedazzlers', { ...ql298Default('rosiedazzlers'), identifiedBusiness: 'icamp' }).outcome).toBe('CROSS_BRAND_HOLD');
    expect(ql298Simulate('rosiedazzlers', { ...ql298Default('rosiedazzlers'), key: '7' }).outcome).toBe('INVALID_SCENARIO_HOLD');
    expect(ql298Simulate('rosiedazzlers', { ...ql298Default('rosiedazzlers'), secret: 'x' }).outcome).toBe('INVALID_SCENARIO_HOLD');
    expect(ql298Simulate('rosiedazzlers', null).outcome).toBe('INVALID_SCENARIO_HOLD');
  });
});
