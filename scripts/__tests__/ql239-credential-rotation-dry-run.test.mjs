import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QL239_ROTATION_RELEASE, runQl239SyntheticRotation } from '../ql239-credential-rotation-dry-run.mjs';

describe('QL-239 independent four-business invented-key rotation dry run', () => {
  const businesses = ['devilndove', 'rosiedazzlers', 'icamp', 'yw'];
  for (const business of businesses) {
    it(`rotates and revokes ${business} only inside the isolated HMAC rehearsal`, () => {
      const result = runQl239SyntheticRotation(business);
      assert.equal(result.release, QL239_ROTATION_RELEASE);
      for (const check of ['rotated', 'revoked', 'previousHealthHeld', 'previousCapabilitiesHeld',
        'oldKeyDenied', 'requiresFreshHealth', 'newKeyHeld', 'replayDenied',
        'crossTenantDenied', 'revocationDenied', 'commandsDenied']) {
        assert.equal(result[check], true, `${business}: ${check}`);
      }
      assert.equal(result.actualConnection, 'DISCONNECTED');
      assert.equal(result.keyMaterialExported, false);
      for (const count of ['remoteRequests', 'remoteWrites', 'liveCalls', 'liveSms', 'providerDispatch']) assert.equal(result[count], 0);
      assert.equal(result.ownerApproval, false);
      assert.equal(result.realPilotHolds, 12);
      assert.equal(Object.keys(result).some((name) => /secret|credential|privateKey|signature/i.test(name)), false);
    });
  }
  it('has no fallback to unknown companies or a live environment', () => {
    assert.throws(() => runQl239SyntheticRotation('unknown'), TypeError);
  });
});
