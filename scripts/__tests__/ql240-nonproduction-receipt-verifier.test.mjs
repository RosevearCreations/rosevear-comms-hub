import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import {
  QL240_VERIFIER_RELEASE, QL240_SCHEMA, QL240_SCOPES, QL240_PATHS,
  ql240CanonicalReceipt, createQl240OfflineVerifier
} from '../ql240-nonproduction-receipt-verifier.mjs';

const now = 1_790_000_000_000;
const companies = Object.keys(QL240_SCOPES);

function rig(company = 'devilndove') {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const tenant = QL240_SCOPES[company].tenant;
  const keyId = `test-${company}-current`;
  const registry = new Map([[`${company}:${keyId}`, { businessId: company, tenantId: tenant, environment: 'nonproduction', revoked: false, publicKey }]]);
  const verifier = createQl240OfflineVerifier(registry);
  const scope = { company, tenant, now };
  function receipt(kind = 'health', id = `mock-${company}-${kind}-0001`) {
    const payload = {
      schema_version: QL240_SCHEMA, gateway_id: 'ai-data-platform', business_id: company,
      tenant_id: tenant, environment: 'nonproduction', kind, method: 'GET', path: QL240_PATHS[kind],
      connection_status: 'HOLD', capabilities: kind === 'health' ? [] : [...QL240_SCOPES[company].caps],
      receipt_id: id, nonce: id + '-nonce', issued_at: now, key_id: keyId
    };
    return { payload, signature: sign(null, ql240CanonicalReceipt(payload), privateKey).toString('base64url') };
  }
  return { registry, verifier, scope, receipt, keyId, publicKey };
}

describe('QL-240 offline pinned Ed25519 nonproduction receipt verification', () => {
  it('pins the version and verifies a held health/capabilities pair for each of four fictional tenants', () => {
    assert.match(QL240_VERIFIER_RELEASE, /^ql240-/);
    for (const company of companies) {
      const { verifier, scope, receipt } = rig(company);
      for (const kind of ['health', 'capabilities']) {
        const result = verifier.inspect(receipt(kind), scope);
        assert.equal(result.status, 'ISOLATED_SIGNATURE_VERIFIED_HELD');
        assert.equal(result.actualConnection, 'DISCONNECTED');
        assert.equal(result.actualBusinessIdentityVerified, false);
        assert.equal(result.realApproval, false);
        assert.equal(result.realPilotHolds, 12);
        for (const effect of ['externalRequests', 'externalWrites', 'liveCalls', 'liveSms', 'providerDispatch']) assert.equal(result[effect], 0);
      }
    }
  });

  it('rejects cross-business, foreign campground and foreign company tenants', () => {
    const x = rig('icamp');
    const a = x.receipt();
    assert.equal(x.verifier.inspect(a, { ...x.scope, company: 'yw' }).status, 'DENIED_SCOPE');
    assert.equal(x.verifier.inspect(a, { ...x.scope, tenant: 'demo-other-campground' }).status, 'DENIED_TENANT');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, tenant_id: 'demo-other-campground' } }, x.scope).status, 'DENIED_TENANT');
    const yw = rig('yw');
    assert.equal(yw.verifier.inspect(yw.receipt(), { ...yw.scope, tenant: 'demo-other-company' }).status, 'DENIED_TENANT');
  });

  it('rejects write routes, elevated capability lists, cross-application gateway and production response', () => {
    const x = rig();
    const a = x.receipt('capabilities');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, path: '/api/integration/v1/commands' } }, x.scope).status, 'DENIED_SCOPE');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, capabilities: ['send_sms', 'read_listing_reference'] } }, x.scope).status, 'DENIED_CAPABILITY');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, gateway_id: 'rosevear-comms-hub' } }, x.scope).status, 'DENIED_SCOPE');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, environment: 'production' } }, x.scope).status, 'DENIED_SCOPE');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, connection_status: 'CONNECTED' } }, x.scope).status, 'DENIED_SCOPE');
  });

  it('enforces exact field shape, canonical signature binding, freshness and replay', () => {
    const x = rig();
    const a = x.receipt();
    assert.equal(x.verifier.inspect({ ...a, customerEmail: 'deny' }, x.scope).status, 'DENIED_SCHEMA');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, secret: 'deny' } }, x.scope).status, 'DENIED_SCHEMA');
    assert.equal(x.verifier.inspect({ ...a, payload: { ...a.payload, receipt_id: 'mock-different-valid-id' } }, x.scope).status, 'DENIED_SIGNATURE');
    assert.equal(x.verifier.inspect({ ...a, signature: 'A'.repeat(86) }, x.scope).status, 'DENIED_SIGNATURE');
    assert.equal(x.verifier.inspect(a, { ...x.scope, now: now + 300001 }).status, 'DENIED_TIME');
    assert.equal(x.verifier.inspect(a, x.scope).status, 'ISOLATED_SIGNATURE_VERIFIED_HELD');
    assert.equal(x.verifier.inspect(a, x.scope).status, 'DENIED_REPLAY');
  });

  it('rejects unpinned/revoked keys and rotated old keys without accepting a different business key', () => {
    const x = rig();
    const pending = x.receipt();
    const entry = x.registry.get(`devilndove:${x.keyId}`);
    entry.revoked = true;
    assert.equal(x.verifier.inspect(pending, x.scope).status, 'DENIED_KEY');
    x.registry.delete(`devilndove:${x.keyId}`);
    assert.equal(x.verifier.inspect(pending, x.scope).status, 'DENIED_KEY');
    x.registry.set(`devilndove:${x.keyId}`, { ...entry, revoked: false, businessId: 'icamp' });
    assert.equal(x.verifier.inspect(pending, x.scope).status, 'DENIED_KEY');
    assert.throws(() => ql240CanonicalReceipt({ altered: true }), TypeError);
  });

  it('rejects capabilities without prior signed health for the same tenant and key', () => {
    const x = rig('yw');
    assert.equal(x.verifier.inspect(x.receipt('capabilities'), x.scope).status, 'DENIED_SEQUENCE');
    assert.equal(x.verifier.inspect(x.receipt('health'), x.scope).status, 'ISOLATED_SIGNATURE_VERIFIED_HELD');
    assert.equal(x.verifier.inspect(x.receipt('capabilities'), x.scope).status, 'ISOLATED_SIGNATURE_VERIFIED_HELD');
  });
});
