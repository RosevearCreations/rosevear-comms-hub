import { describe, expect, it } from 'vitest';
import { QL248_RELEASE, QL248_STAGES, QL248_HOLD } from '../ql248ProofCommitReadiness';

describe('QL-248 source-proof two-revision plan', () => {
  it('keeps an immutable source revision and a different proof-bearing commit', () => {
    expect(QL248_RELEASE).toContain('ql248');
    expect(QL248_STAGES).toHaveLength(6);
    expect(QL248_STAGES[0].title).toContain('source SHA');
    expect(QL248_STAGES[1].title).toContain('proof commit SHA');
  });
  it('cannot enable gateway connections or customer operations', () => {
    expect(QL248_HOLD).toMatchObject({
      offlineSignedProofsAvailable: 0, independentlyAuthenticatedPins: 0,
      independentlyVerifiedGateways: 0, connection: 'DISCONNECTED',
      ownerAuthorization: 'NOT_GIVEN', realPilotHolds: 12,
      writes: 0, calls: 0, sms: 0, dispatch: 0
    });
  });
});
