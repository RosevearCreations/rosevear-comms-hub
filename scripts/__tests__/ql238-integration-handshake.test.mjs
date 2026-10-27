import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createQl238IsolatedHandshake, QL238_SCHEMA, QL238_SERVER_VERSION } from '../ql238-integration-handshake-sandbox.mjs';

const now = 1_790_000_000_000;
const companies = [
  ['rosiedazzlers', null],
  ['devilndove', null],
  ['icamp', 'demo-icamp-tenant'],
  ['yw', 'demo-yw-tenant']
];

function trial(company = 'devilndove', tenant = null) {
  const sandbox = createQl238IsolatedHandshake();
  const signed = (kind, nonce) => sandbox.makeSignedFixture(company, kind, nonce, now);
  const inspect = (envelope, route = {}) => sandbox.inspect({
    expectedBusiness: company, expectedTenant: tenant,
    expectedEnvironment: 'disabled-preview', envelope, now, ...route
  });
  return { sandbox, signed, inspect };
}

describe('QL-238 isolated server-side health/capabilities handshake readiness', () => {
  it('pins contract v1 and verifies all four fictional HMAC handshakes while preserving actual connection holds', () => {
    assert.match(QL238_SERVER_VERSION, /^ql238-/);
    assert.equal(QL238_SCHEMA, 'rosevear.integration.v1');
    for (const [company, tenant] of companies) {
      const { sandbox, signed, inspect } = trial(company, tenant);
      const health = inspect(signed('health', 'mock-health-' + company));
      assert.equal(health.status, 'SIMULATED_RESPONSE_HELD');
      assert.deepEqual(health.response, {
        application_id: company, application_version: 'demo-only',
        contract_version: QL238_SCHEMA, environment: 'disabled-preview', connection_status: 'HOLD'
      });
      const caps = inspect(signed('capabilities', 'mock-capabilities-' + company));
      assert.equal(caps.status, 'SIMULATED_RESPONSE_HELD');
      assert.ok(caps.response.capabilities.length > 0);
      assert.ok(caps.response.capabilities.every((name) => name.startsWith('read_')));
      assert.ok(!JSON.stringify(caps.response).includes('secret'));
      assert.equal(caps.actualConnection, 'DISCONNECTED');
      assert.equal(caps.authenticBusinessIdentityVerified, false);
      assert.equal(caps.realNetworkResponse, false);
      assert.equal(caps.remoteWrites, 0);
      assert.equal(caps.smsSent, 0);
      assert.equal(caps.phoneCalls, 0);
      assert.equal(caps.realPilotHolds, 12);
      assert.equal(sandbox.visibleReceipts(company, tenant).length, 2);
      assert.equal(sandbox.visibleReceipts(company, 'demo-another-tenant').length, 0);
    }
  });

  it('requires health before capabilities for the exact company and tenant', () => {
    const { signed, inspect } = trial('yw', 'demo-yw-tenant');
    assert.equal(inspect(signed('capabilities', 'mock-first')).status, 'DENIED_SEQUENCE');
    assert.equal(inspect(signed('health', 'mock-second')).status, 'SIMULATED_RESPONSE_HELD');
    assert.equal(inspect(signed('capabilities', 'mock-third')).status, 'SIMULATED_RESPONSE_HELD');
  });

  it('rejects cross-business, cross-campground and cross-company tenant routes with no receipt', () => {
    const { sandbox, signed, inspect } = trial('icamp', 'demo-icamp-tenant');
    const env = signed('health', 'mock-isolate');
    assert.equal(inspect(env, { expectedBusiness: 'devilndove' }).status, 'DENIED_BUSINESS');
    assert.equal(inspect(env, { expectedTenant: 'demo-wrong-campground' }).status, 'DENIED_TENANT');
    assert.equal(inspect(env, { expectedTenant: null }).status, 'DENIED_TENANT');
    assert.deepEqual(sandbox.visibleReceipts('icamp', 'demo-icamp-tenant'), []);
    const yw = trial('yw', 'demo-yw-tenant');
    assert.equal(yw.inspect(yw.signed('health', 'mock-isolate'), { expectedTenant: 'demo-other-company' }).status, 'DENIED_TENANT');
  });

  it('refuses tampered signature, method, gateway route, timestamp and added personal data', () => {
    const { sandbox, signed, inspect } = trial();
    const env = signed('health', 'mock-original');
    assert.equal(inspect({ ...env, signature: '0'.repeat(64) }).status, 'DENIED_SIGNATURE');
    assert.equal(inspect({ ...env, method: 'POST' }).status, 'DENIED_ROUTE');
    assert.equal(inspect({ ...env, gatewayId: 'rosevear-comms-hub' }).status, 'DENIED_ROUTE');
    assert.equal(inspect({ ...env, environment: 'production' }).status, 'DENIED_ENVIRONMENT');
    assert.equal(inspect({ ...env, issuedAt: now - 1 }).status, 'DENIED_SIGNATURE');
    assert.equal(inspect(env, { now: now + 300_001 }).status, 'DENIED_TIME');
    assert.equal(inspect({ ...env, customerEmail: 'someone@example.invalid' }).status, 'DENIED_SCHEMA');
    assert.equal(inspect({ ...env, path: '/api/integration/v1/commands' }).status, 'DENIED_ROUTE');
    assert.equal(sandbox.visibleReceipts('devilndove', null).length, 0);
  });

  it('refuses idempotency replay even with a valid second synthetic request', () => {
    const { sandbox, signed, inspect } = trial();
    const env = signed('health', 'mock-replay');
    assert.equal(inspect(env).status, 'SIMULATED_RESPONSE_HELD');
    assert.equal(inspect(env).status, 'DENIED_REPLAY');
    assert.equal(inspect(signed('health', 'mock-replay')).status, 'DENIED_REPLAY');
    assert.equal(sandbox.visibleReceipts('devilndove', null).length, 1);
  });

  it('holds a captured signature after key revocation and invalidates old signatures after rotation', () => {
    const revoked = trial();
    const pending = revoked.signed('health', 'mock-pending');
    assert.equal(revoked.sandbox.revokeTestKey('devilndove'), true);
    assert.equal(revoked.inspect(pending).status, 'DENIED_KEY');
    assert.throws(() => revoked.signed('health', 'mock-new'), TypeError);
    const rotated = trial('yw', 'demo-yw-tenant');
    const old = rotated.signed('health', 'mock-before');
    assert.equal(rotated.sandbox.rotateTestKey('yw'), true);
    assert.equal(rotated.inspect(old).status, 'DENIED_KEY');
    assert.equal(rotated.inspect(rotated.signed('capabilities', 'mock-after')).status, 'DENIED_SEQUENCE');
    assert.equal(rotated.inspect(rotated.signed('health', 'mock-fresh')).status, 'SIMULATED_RESPONSE_HELD');
  });

  it('has no outgoing or command execution path even after a valid simulated health response', () => {
    const { sandbox, signed, inspect } = trial();
    assert.equal(inspect(signed('health', 'mock-normal')).status, 'SIMULATED_RESPONSE_HELD');
    for (const kind of ['send_sms', 'place_call', 'create_reservation', 'update_etsy']) {
      const result = sandbox.requestCommand({ kind });
      assert.equal(result.status, 'DENIED_COMMAND');
      assert.equal(result.remoteWrites, 0);
      assert.equal(result.providerDispatch, 0);
      assert.equal(result.ownerApproval, false);
    }
  });
});
