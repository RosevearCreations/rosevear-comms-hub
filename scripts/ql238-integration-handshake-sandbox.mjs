/**
 * QL-238 isolated Node-only signed health/capabilities contract exercise.
 * Never mounts an HTTP listener, uses an app's credentials or calls a provider.
 * The invented ephemeral keys do NOT prove authentication of any real business.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const QL238_SERVER_VERSION = 'ql238-integration-v1-isolated-health-capabilities-hmac-review';
export const QL238_SCHEMA = 'rosevear.integration.v1';
const MAX_AGE_MS = 300_000;
const specs = Object.freeze({
  rosiedazzlers: { tenant: null, read: ['read_quote_reference', 'read_booking_reference'] },
  devilndove: { tenant: null, read: ['read_product_reference', 'read_listing_reference'] },
  icamp: { tenant: 'demo-icamp-tenant', read: ['read_reservation_reference', 'read_site_reference'] },
  yw: { tenant: 'demo-yw-tenant', read: ['read_job_reference', 'read_property_reference'] }
});
const paths = Object.freeze({
  health: '/api/integration/v1/health',
  capabilities: '/api/integration/v1/capabilities'
});
const exact = (object, keys) => object && typeof object === 'object' && !Array.isArray(object) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(object)) &&
  Object.keys(object).length === keys.length && Object.keys(object).every((key) => keys.includes(key));
const nonceValid = (value) => typeof value === 'string' && /^mock-[a-z0-9-]{1,48}$/.test(value);
const clockValid = (value) => Number.isSafeInteger(value) && value >= 0;

function result(status, explanation, fields = {}) {
  return Object.freeze({
    status, explanation, ...fields, actualConnection: 'DISCONNECTED',
    authenticBusinessIdentityVerified: false, realNetworkResponse: false,
    providerDispatch: 0, phoneCalls: 0, smsSent: 0, remoteWrites: 0,
    ownerApproval: false, realPilotHolds: 12
  });
}

export function createQl238IsolatedHandshake() {
  const keys = new Map(Object.keys(specs).map((company) =>
    [company, { secret: randomBytes(32), version: 1, revoked: false }]));
  const used = new Set();
  const priorHealth = new Set();
  const receipts = [];

  function signingBytes(envelope) {
    return [
      QL238_SCHEMA, envelope.applicationId, envelope.tenantId ?? '-',
      envelope.gatewayId, envelope.environment, envelope.method, envelope.path,
      envelope.keyVersion, envelope.nonce, envelope.issuedAt
    ].join('\n');
  }
  function sign(envelope, secret) {
    return createHmac('sha256', secret).update(signingBytes(envelope), 'utf8').digest('hex');
  }

  /** Only make fixtures for a closed, synthetic policy registry. */
  function makeSignedFixture(company, kind, nonce, issuedAt) {
    const scope = specs[company];
    const key = keys.get(company);
    if (!scope || !paths[kind] || !nonceValid(nonce) || !clockValid(issuedAt) || key.revoked) {
      throw new TypeError('Unknown or revoked fictional application handshake fixture.');
    }
    const envelope = Object.freeze({
      applicationId: company, gatewayId: 'ai-data-platform',
      tenantId: scope.tenant, environment: 'disabled-preview', method: 'GET',
      path: paths[kind], keyVersion: key.version, nonce, issuedAt
    });
    return Object.freeze({ ...envelope, signature: sign(envelope, key.secret) });
  }

  /** Everything stays in-process. The only matching result is a HELD sample response. */
  function inspect(request) {
    if (!exact(request, ['expectedBusiness', 'expectedTenant', 'expectedEnvironment', 'envelope', 'now']) ||
        !specs[request.expectedBusiness] || !clockValid(request.now) ||
        request.expectedEnvironment !== 'disabled-preview') {
      return result('DENIED_ROUTE', 'Malformed or non-preview gateway route.');
    }
    const { expectedBusiness, expectedTenant, envelope, now } = request;
    if (!exact(envelope, ['applicationId', 'gatewayId', 'tenantId', 'environment', 'method',
      'path', 'keyVersion', 'nonce', 'issuedAt', 'signature']) ||
      !specs[envelope.applicationId] || !nonceValid(envelope.nonce) || !clockValid(envelope.issuedAt) ||
      !Number.isSafeInteger(envelope.keyVersion) ||
      typeof envelope.signature !== 'string' || !/^[0-9a-f]{64}$/.test(envelope.signature)) {
      return result('DENIED_SCHEMA', 'Malformed or expanded signed preview envelope.');
    }
    if (envelope.applicationId !== expectedBusiness) {
      return result('DENIED_BUSINESS', 'Server sender does not match the configured business route.');
    }
    if (envelope.tenantId !== expectedTenant || specs[expectedBusiness].tenant !== expectedTenant) {
      return result('DENIED_TENANT', 'Tenant differs from the trusted, immutable business route.');
    }
    if (envelope.gatewayId !== 'ai-data-platform' || envelope.method !== 'GET' ||
      !Object.values(paths).includes(envelope.path)) {
      return result('DENIED_ROUTE', 'No direct app-to-app path, POST command or unregistered route is allowed.');
    }
    if (envelope.environment !== 'disabled-preview') {
      return result('DENIED_ENVIRONMENT', 'Only disabled-preview environment is accepted by the isolated harness.');
    }
    if (Math.abs(now - envelope.issuedAt) > MAX_AGE_MS) {
      return result('DENIED_TIME', 'Timestamp outside the five-minute rehearsal freshness window.');
    }
    const credential = keys.get(expectedBusiness);
    if (credential.revoked || envelope.keyVersion !== credential.version) {
      return result('DENIED_KEY', 'Revoked or rotated ephemeral test key.');
    }
    const supplied = Buffer.from(envelope.signature, 'hex');
    const expected = Buffer.from(sign(envelope, credential.secret), 'hex');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return result('DENIED_SIGNATURE', 'HMAC does not match signed raw canonical fields.');
    }
    const route = [expectedBusiness, expectedTenant ?? 'single-business'].join(':');
    const kind = envelope.path === paths.health ? 'health' : 'capabilities';
    if (kind === 'capabilities' && !priorHealth.has(route)) {
      return result('DENIED_SEQUENCE', 'A held mock health response must precede capabilities for this business/tenant.');
    }
    const idempotencyKey = [route, kind, envelope.nonce].join(':');
    if (used.has(idempotencyKey)) {
      return result('DENIED_REPLAY', 'A repeat nonce does not create a new handshake receipt.');
    }
    used.add(idempotencyKey);
    if (kind === 'health') priorHealth.add(route);
    const response = Object.freeze({
      application_id: expectedBusiness, application_version: 'demo-only',
      contract_version: QL238_SCHEMA, environment: 'disabled-preview',
      connection_status: 'HOLD',
      ...(kind === 'capabilities' ? { capabilities: Object.freeze([...specs[expectedBusiness].read]) } : {})
    });
    const receipt = Object.freeze({
      company: expectedBusiness, tenantScope: expectedTenant ? 'TENANT_SCOPED' : 'BUSINESS_SCOPED',
      kind, state: 'SIMULATED_RESPONSE_HELD', sampleOnly: true
    });
    receipts.push(receipt);
    return result('SIMULATED_RESPONSE_HELD', 'Invented isolated HMAC verified; never contacted a business application.',
      { response, receipt });
  }

  function rotateTestKey(company) {
    const credential = keys.get(company);
    if (!credential) return false;
    keys.set(company, { secret: randomBytes(32), version: credential.version + 1, revoked: false });
    for (const key of [...priorHealth]) if (key.startsWith(company + ':')) priorHealth.delete(key);
    return true;
  }
  function revokeTestKey(company) {
    const credential = keys.get(company);
    if (!credential) return false;
    credential.revoked = true;
    for (const key of [...priorHealth]) if (key.startsWith(company + ':')) priorHealth.delete(key);
    return true;
  }
  function visibleReceipts(company, tenant) {
    if (!specs[company] || specs[company].tenant !== tenant) return Object.freeze([]);
    const scope = tenant ? 'TENANT_SCOPED' : 'BUSINESS_SCOPED';
    return Object.freeze(receipts.filter((entry) => entry.company === company && entry.tenantScope === scope));
  }
  function requestCommand() {
    return result('DENIED_COMMAND', 'No commands, customer transfer, SMS, voice or provider dispatch exist in this harness.');
  }
  return Object.freeze({ makeSignedFixture, inspect, rotateTestKey, revokeTestKey, visibleReceipts, requestCommand });
}
