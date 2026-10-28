import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { QL240_PATHS, QL240_SCOPES, QL240_SCHEMA, ql240CanonicalReceipt } from '../ql240-nonproduction-receipt-verifier.mjs';
import { ql241Origin, ql241PublicKeyFingerprint, ql241ValidateConfig,
  retrieveQl241NonproductionProof } from '../ql241-external-gateway-retrieval.mjs';

const now = 1_790_000_000_000;
function rig(company = 'devilndove') {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const tenantId = QL240_SCOPES[company].tenant;
  const config = { company, tenantId, origin: 'https://gateway.example.org',
    keyId: `np-${company}-current`, publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
    healthReceiptId: `np-${company}-health-001`, capabilitiesReceiptId: `np-${company}-caps-001` };
  const pin = ql241PublicKeyFingerprint(config.publicKeyPem);
  function response(kind, overrides = {}) {
    const payload = { schema_version: QL240_SCHEMA, gateway_id: 'ai-data-platform',
      business_id: company, tenant_id: tenantId, environment: 'nonproduction', kind,
      method: 'GET', path: QL240_PATHS[kind], connection_status: 'HOLD',
      capabilities: kind === 'health' ? [] : [...QL240_SCOPES[company].caps],
      receipt_id: config[`${kind}ReceiptId`], nonce: `np-${company}-${kind}-nonce`, issued_at: now,
      key_id: config.keyId, ...overrides };
    return { payload, signature: sign(null, ql240CanonicalReceipt(payload), privateKey).toString('base64url') };
  }
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const kind = url.endsWith('/health') ? 'health' : 'capabilities';
    return { status: 200, headers: { get: (name) => name === 'content-type' ? 'application/json' : null },
      text: async () => JSON.stringify(response(kind)) };
  };
  return { config, pin, response, calls, fetchImpl };
}

describe('QL-241 explicitly invoked external GET and independently supplied public-key pin', () => {
  it('accepts isolated signed direct GET envelopes for four scoped companies while keeping every release HOLD', async () => {
    for (const company of Object.keys(QL240_SCOPES)) {
      const x = rig(company);
      const result = await retrieveQl241NonproductionProof(x.config, x.pin, { fetchImpl: x.fetchImpl, now });
      assert.equal(result.status, 'SIGNED_GET_PAIR_CHECKED_HELD');
      assert.equal(result.externalGetAttempts, 2);
      assert.equal(result.signedGetReceiptsVerified, true);
      assert.equal(result.realOwnerAuthorization, false);
      assert.equal(result.independentlyVerifiedPinProvenance, false);
      assert.equal(result.gatewayAuditIndependentlyVerified, false);
      assert.equal(result.actualConnection, 'DISCONNECTED');
      assert.equal(result.realPilotHolds, 12);
      for (const effect of ['externalWrites', 'calls', 'sms', 'providerDispatch']) assert.equal(result[effect], 0);
      assert.deepEqual(x.calls.map((call) => call.url), [
        x.config.origin + QL240_PATHS.health, x.config.origin + QL240_PATHS.capabilities
      ]);
      for (const call of x.calls) {
        assert.equal(call.options.method, 'GET');
        assert.equal(call.options.redirect, 'manual');
        assert.equal(call.options.credentials, 'omit');
      }
    }
  });

  it('denies incorrect pins before making any network request', async () => {
    const x = rig();
    const result = await retrieveQl241NonproductionProof(x.config, '0'.repeat(64), { fetchImpl: x.fetchImpl, now });
    assert.equal(result.status, 'DENIED_PIN');
    assert.equal(x.calls.length, 0);
    assert.throws(() => ql241PublicKeyFingerprint('-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----'));
  });

  it('rejects localhost/private address, HTTP, query, credentials, overexpanded schema and foreign tenant before requests', async () => {
    const x = rig('icamp');
    for (const origin of ['http://gateway.example.org', 'https://127.0.0.1', 'https://localhost',
      'https://gateway.example.org?debug=1', 'https://a:b@gateway.example.org', 'https://gateway.example.org:8443']) {
      assert.equal(ql241Origin(origin), null);
      assert.equal(ql241ValidateConfig({ ...x.config, origin }, x.pin, now).ok, false);
    }
    assert.equal(ql241ValidateConfig({ ...x.config, extra: 'customer' }, x.pin, now).ok, false);
    assert.equal(ql241ValidateConfig({ ...x.config, tenantId: 'another-camp' }, x.pin, now).ok, false);
    assert.equal(x.calls.length, 0);
  });

  it('rejects foreign tenant, unknown write capability, tampered signature and wrong receipt IDs', async () => {
    const x = rig('yw');
    for (const overrides of [
      { tenant_id: 'demo-another-company' }, { capabilities: ['send_sms', 'read_property_reference'] },
      { method: 'POST' }, { path: '/api/integration/v1/commands' },
      { receipt_id: 'np-not-current-receipt' }
    ]) {
      const fetched = async (url) => ({ status: 200, headers: { get: (n) => n === 'content-type' ? 'application/json' : null },
        text: async () => JSON.stringify(x.response(url.endsWith('/health') ? 'health' : 'capabilities', overrides)) });
      const denied = await retrieveQl241NonproductionProof(x.config, x.pin, { fetchImpl: fetched, now });
      assert.notEqual(denied.status, 'SIGNED_GET_PAIR_CHECKED_HELD');
    }
    const forged = async (url) => ({ status: 200, headers: { get: (n) => n === 'content-type' ? 'application/json' : null },
      text: async () => JSON.stringify({ ...x.response(url.endsWith('/health') ? 'health' : 'capabilities'), signature: 'A'.repeat(86) }) });
    assert.equal((await retrieveQl241NonproductionProof(x.config, x.pin, { fetchImpl: forged, now })).status, 'DENIED_SIGNATURE');
  });

  it('rejects expired receipts, redirects, authentication walls, oversized bodies and injected private fields', async () => {
    const x = rig();
    assert.equal((await retrieveQl241NonproductionProof(x.config, x.pin, { fetchImpl: x.fetchImpl, now: now + 300001 })).status, 'DENIED_RECEIPT');
    for (const status of [302, 401, 403, 500]) {
      const denied = await retrieveQl241NonproductionProof(x.config, x.pin, { now,
        fetchImpl: async () => ({ status, headers: { get: () => 'application/json' } }) });
      assert.equal(denied.status, 'DENIED_HTTP');
      assert.equal(denied.externalGetAttempts, 1);
    }
    const huge = await retrieveQl241NonproductionProof(x.config, x.pin, { now,
      fetchImpl: async () => ({ status: 200, headers: { get: (n) => n === 'content-type' ? 'application/json' : null }, text: async () => 'x'.repeat(20_000) }) });
    assert.equal(huge.status, 'DENIED_SIZE');
    const injected = await retrieveQl241NonproductionProof(x.config, x.pin, { now, fetchImpl: async (url) => ({
      status: 200, headers: { get: (n) => n === 'content-type' ? 'application/json' : null },
      text: async () => JSON.stringify({ ...x.response(url.endsWith('/health') ? 'health' : 'capabilities'), customerEmail: 'private@example.org' })
    }) });
    assert.equal(injected.status, 'DENIED_SCHEMA');
  });
});
