import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Ql297Omnichannel } from '../Ql297Omnichannel';
import { emptyQl297Session, ql297Apply, ql297Events, ql297ForOrganization, ql297Timeline } from '../ql297Omnichannel';
import { operatorOrganizations } from '../ql191Organizations';

describe('QL-297 mock-only omnichannel event contract', () => {
  it('has five channels and identical isolated sample coverage across four companies', () => {
    expect(new Set(ql297Events.map((event) => event.organizationId)).size).toBe(4);
    expect(new Set(ql297Events.map((event) => event.channel))).toEqual(new Set(['phone', 'sms', 'email-style', 'voicemail', 'missed-call']));
    expect(new Set(ql297Events.map((event) => event.id)).size).toBe(24);
    expect(ql297Events.every((event) => event.source.startsWith('CHECKED_IN_SYNTHETIC/'))).toBe(true);
  });

  for (const org of operatorOrganizations) {
    it(`${org.id}: idempotent originals, one failure recovery, zero cross-company records`, () => {
      const events = ql297ForOrganization(org.id);
      expect(events).toHaveLength(6);
      const failed = events.find((event) => event.delivery === 'FAILED_MOCK')!;
      const blocked = events.find((event) => event.delivery === 'BLOCKED_MOCK')!;
      const initial = emptyQl297Session(org.id);
      expect(ql297Apply(initial, org.id, failed.id, 'recover').receipts).toHaveLength(0);
      const accepted = ql297Apply(initial, org.id, failed.id, 'replay');
      expect(accepted.receipts).toHaveLength(1);
      expect(ql297Apply(accepted, org.id, failed.id, 'replay').receipts).toHaveLength(1);
      const recovered = ql297Apply(accepted, org.id, failed.id, 'recover');
      expect(recovered.receipts.map((receipt) => receipt.outcome)).toEqual(['FAILED_MOCK', 'RECOVERED_MOCK']);
      expect(ql297Apply(recovered, org.id, failed.id, 'recover').receipts).toHaveLength(2);
      expect(ql297Apply(recovered, org.id, blocked.id, 'recover').receipts).toHaveLength(2);
      expect(ql297Apply(recovered, org.id, 'ql297-icamp-999', 'replay').receipts).toHaveLength(2);
      expect(ql297Timeline(recovered, org.id).map((row) => row.attempt)).toEqual([1, 2]);
      expect(ql297Timeline(recovered, org.id).every((row) => row.organizationId === org.id)).toBe(true);
      expect(renderToStaticMarkup(<Ql297Omnichannel organization={org} />)).toContain('NO CUSTOMER SEND');
    });
  }

  it('rejects altered session company context', () => {
    const event = ql297ForOrganization('rosiedazzlers')[0];
    const foreign = emptyQl297Session('icamp');
    expect(ql297Apply(foreign, 'rosiedazzlers', event.id, 'replay')).toEqual(foreign);
    expect(ql297Timeline(foreign, 'rosiedazzlers')).toEqual([]);
  });
});
