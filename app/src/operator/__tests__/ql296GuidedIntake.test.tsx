import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Ql296GuidedIntake } from '../Ql296GuidedIntake';
import { ql296Fixtures, ql296Handoff, validateQl296 } from '../ql296GuidedIntake';
import { operatorOrganizations } from '../ql191Organizations';

describe('QL-296 four-company synthetic intake isolation', () => {
  it('has four distinct fixtures, question sets and review routes', () => {
    expect(ql296Fixtures.map((fixture) => fixture.organizationId).sort()).toEqual(['devilndove', 'icamp', 'rosiedazzlers', 'yw']);
    expect(new Set(ql296Fixtures.map((fixture) => fixture.reviewer)).size).toBe(4);
    expect(new Set(ql296Fixtures.map((fixture) => fixture.fields[0].id)).size).toBe(4);
  });

  for (const fixture of ql296Fixtures) {
    it(`${fixture.organizationId}: requires all four valid questions and produces an unsent-only handoff`, () => {
      expect(validateQl296(fixture.organizationId, {}).missing).toHaveLength(4);
      expect(ql296Handoff(fixture.organizationId, {})).toBeNull();
      const answers = Object.fromEntries(fixture.fields.map((field) => [field.id, field.choices[0]]));
      expect(validateQl296(fixture.organizationId, answers).valid).toBe(true);
      expect(ql296Handoff(fixture.organizationId, answers)).toMatchObject({ reference: fixture.reference, status: 'UNSENT — INTERNAL SIMULATION ONLY' });
      expect(validateQl296(fixture.organizationId, { ...answers, [fixture.fields[0].id]: 'spoof' }).valid).toBe(false);
      expect(validateQl296(fixture.organizationId, { ...answers, crossTenantId: 'other' }).issues).toHaveLength(1);
      const organization = operatorOrganizations.find((item) => item.id === fixture.organizationId)!;
      const html = renderToStaticMarkup(<Ql296GuidedIntake organization={organization} />);
      expect(html).toContain(fixture.scenario);
      expect(html).toContain('NO LIVE QUOTE');
    });
  }

  it('does not accept another company’s selections', () => {
    const rosie = ql296Fixtures[0];
    const answers = Object.fromEntries(rosie.fields.map((field) => [field.id, field.choices[0]]));
    expect(ql296Handoff('icamp', answers)).toBeNull();
  });
});
