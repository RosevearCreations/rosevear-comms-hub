import { describe, expect, it } from 'vitest';
import { QL250_SOURCE_REFRESH } from '../ql250CustodyWindowReview';
import { QL251_RELEASE, QL251_SIX_APP_PROOF_SNAPSHOT, QL251_TEST_GATE }
  from '../ql251WitnessTestReview';

describe('QL-251 signed source proof recheck and owner test decision review', () => {
  it('pinpoints all six app repos and six newer immutable SHAs at the observed date', () => {
    expect(QL251_RELEASE).toContain('ql251');
    expect(QL251_SIX_APP_PROOF_SNAPSHOT).toHaveLength(6);
    expect(QL251_SIX_APP_PROOF_SNAPSHOT.map(s => s.repository)).toEqual(
      QL250_SOURCE_REFRESH.map(s => s.repository));
    expect(QL251_SIX_APP_PROOF_SNAPSHOT.every(s => /^[0-9a-f]{40}$/.test(s.mainSha))).toBe(true);
    expect(QL251_SIX_APP_PROOF_SNAPSHOT.filter(s => s.advanced)).toHaveLength(6);
    expect(QL251_SIX_APP_PROOF_SNAPSHOT.every(s => s.publicProof === '404')).toBe(true);
  });
  it('keeps test and pilot permission separate; no GET or live communications', () => {
    expect(QL251_TEST_GATE).toMatchObject({ publishedSignedSourceProofs: 0,
      originalCustodyWitnessesIndependentlyAttested: 0,
      authenticatedOwnerNonproductionTestDecisions: 0, authenticatedGatewayGetPairs: 0,
      windowsScheduled: 0, ownerTestAuthorization: 'NOT_GIVEN',
      ownerPilotAuthorization: 'NOT_GIVEN', connectionState: 'DISCONNECTED',
      realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0 });
    expect(QL251_TEST_GATE.paths).toEqual([
      '/api/integration/v1/health', '/api/integration/v1/capabilities']);
  });
});
