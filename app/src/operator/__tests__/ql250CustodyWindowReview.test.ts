import { describe, expect, it } from 'vitest';
import { QL249_SOURCE_SNAPSHOT } from '../ql249OriginRetest';
import { QL250_RELEASE, QL250_SOURCE_REFRESH, QL250_READ_ONLY_GATES } from '../ql250CustodyWindowReview';

describe('QL250 source refresh and owner test gates', () => {
  it('records exactly six immutable source SHAs and all six newer revisions', () => {
    expect(QL250_RELEASE).toContain('ql250');
    expect(QL250_SOURCE_REFRESH).toHaveLength(6);
    expect(QL250_SOURCE_REFRESH.every(x => /^[0-9a-f]{40}$/.test(x.mainSha))).toBe(true);
    expect(QL250_SOURCE_REFRESH.filter(x => x.changedSinceQl249)).toHaveLength(6);
    expect(QL250_SOURCE_REFRESH.map(x => x.repository)).toEqual(QL249_SOURCE_SNAPSHOT.map(x => x.repository));
    expect(QL250_SOURCE_REFRESH.every(x => x.proof === '404')).toBe(true);
  });
  it('never treats a GREEN app deployment as owner approval to schedule a live GET', () => {
    expect(QL250_READ_ONLY_GATES).toMatchObject({ publicProofsPresent: 0,
      independentlyPinnedSignerCustody: 0, authenticatedTestOnlyOwnerDecisions: 0,
      gatewayGetWindowsScheduled: 0, independentlyWitnessedGatewayGets: 0,
      ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
      connectionState: 'DISCONNECTED', realPilotHolds: 12,
      writes: 0, calls: 0, sms: 0, dispatch: 0 });
    expect(QL250_READ_ONLY_GATES.methods).toEqual(['GET']);
    expect(QL250_READ_ONLY_GATES.paths).toEqual([
      '/api/integration/v1/health', '/api/integration/v1/capabilities']);
  });
});
