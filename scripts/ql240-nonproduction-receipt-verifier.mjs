/**
 * QL-240 strictly offline, independent Ed25519 receipt verifier.
 * Consumes caller-pinned public keys and synthetic/nonproduction envelopes.
 * Never creates credentials, listens for requests or contacts a business.
 * Real keys/provenance are NOT provisioned by Comms Hub.
 */
import { verify as verifySignature } from 'node:crypto';

export const QL240_VERIFIER_RELEASE = 'ql240-nonproduction-pinned-receipt-verifier-no-dispatch-v1';
export const QL240_SCHEMA = 'rosevear.integration.v1';
export const QL240_PATHS = Object.freeze({
  health: '/api/integration/v1/health',
  capabilities: '/api/integration/v1/capabilities'
});
export const QL240_SCOPES = Object.freeze({
  rosiedazzlers: Object.freeze({ tenant: null, caps: Object.freeze(['read_quote_reference', 'read_booking_reference']) }),
  devilndove: Object.freeze({ tenant: null, caps: Object.freeze(['read_product_reference', 'read_listing_reference']) }),
  icamp: Object.freeze({ tenant: 'demo-icamp-tenant', caps: Object.freeze(['read_reservation_reference', 'read_site_reference']) }),
  yw: Object.freeze({ tenant: 'demo-yw-tenant', caps: Object.freeze(['read_job_reference', 'read_property_reference']) })
});
const fields = Object.freeze([
  'schema_version', 'gateway_id', 'business_id', 'tenant_id', 'environment',
  'kind', 'method', 'path', 'connection_status', 'capabilities',
  'receipt_id', 'nonce', 'issued_at', 'key_id'
]);
const outer = Object.freeze(['payload', 'signature']);
const MAX_AGE = 300_000;
const exact = (value, keys) => !!value && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value)) &&
  Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));

export function ql240CanonicalReceipt(payload) {
  if (!exact(payload, fields)) throw new TypeError('Only the exact receipt v1 fields may be signed.');
  return Buffer.from(fields.map((key) => JSON.stringify([key, payload[key]])).join('\n'), 'utf8');
}

const deny = (status, reason) => Object.freeze({
  status, reason, actualConnection: 'DISCONNECTED', actualBusinessIdentityVerified: false,
  externalRequests: 0, externalWrites: 0, liveCalls: 0, liveSms: 0,
  providerDispatch: 0, realApproval: false, realPilotHolds: 12
});

/** Registry is trusted only when the caller independently pins its public keys. */
export function createQl240OfflineVerifier(pinnedRegistry) {
  const seen = new Set();
  const priorHealth = new Set();
  function inspect(envelope, scope) {
    if (!exact(scope, ['company', 'tenant', 'now']) ||
      !Object.hasOwn(QL240_SCOPES, scope.company) ||
      !Number.isSafeInteger(scope.now) || scope.now < 0) return deny('DENIED_SCOPE', 'Invalid registered scope.');
    if (!exact(envelope, outer) || !exact(envelope.payload, fields) ||
      typeof envelope.signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(envelope.signature)) {
      return deny('DENIED_SCHEMA', 'Expanded or malformed signed receipt.');
    }
    const p = envelope.payload;
    if (p.schema_version !== QL240_SCHEMA || p.gateway_id !== 'ai-data-platform' ||
      p.business_id !== scope.company || p.environment !== 'nonproduction' ||
      p.method !== 'GET' || !Object.hasOwn(QL240_PATHS, p.kind) ||
      p.path !== QL240_PATHS[p.kind] || p.connection_status !== 'HOLD') {
      return deny('DENIED_SCOPE', 'Only nonproduction held GET receipts from the exact gateway and business are allowed.');
    }
    if (p.tenant_id !== QL240_SCOPES[scope.company].tenant || p.tenant_id !== scope.tenant) {
      return deny('DENIED_TENANT', 'The signed tenant does not match the independently registered owner/tenant.');
    }
    const expected = p.kind === 'health' ? [] : QL240_SCOPES[scope.company].caps;
    if (!Array.isArray(p.capabilities) || p.capabilities.length !== expected.length ||
      new Set(p.capabilities).size !== expected.length || !p.capabilities.every((x) => expected.includes(x))) {
      return deny('DENIED_CAPABILITY', 'Receipt attempts an unknown, duplicated or write/dispatch capability.');
    }
    if (typeof p.receipt_id !== 'string' || !/^mock-[a-z0-9-]{5,70}$/.test(p.receipt_id) ||
      typeof p.nonce !== 'string' || !/^mock-[a-z0-9-]{5,70}$/.test(p.nonce) ||
      !Number.isSafeInteger(p.issued_at) || Math.abs(p.issued_at - scope.now) > MAX_AGE) {
      return deny('DENIED_TIME', 'Receipt ID, nonce or timestamp is malformed, stale or from the future.');
    }
    if (typeof p.key_id !== 'string' || !/^test-[a-z0-9-]{3,64}$/.test(p.key_id)) {
      return deny('DENIED_KEY', 'Missing or invalid pinned key ID.');
    }
    const key = pinnedRegistry?.get(`${p.business_id}:${p.key_id}`);
    if (!key || key.revoked || !key.publicKey || key.businessId !== p.business_id ||
        key.tenantId !== p.tenant_id || key.environment !== 'nonproduction') {
      return deny('DENIED_KEY', 'No independently pinned, active public key matches this exact company and tenant.');
    }
    let signed = false;
    try { signed = verifySignature(null, ql240CanonicalReceipt(p), key.publicKey, Buffer.from(envelope.signature, 'base64url')); }
    catch { return deny('DENIED_SIGNATURE', 'Signature cannot be verified with the pinned key.'); }
    if (!signed) return deny('DENIED_SIGNATURE', 'Receipt signature mismatch.');
    const route = [p.business_id, p.tenant_id ?? '-', p.key_id].join(':');
    if (p.kind === 'capabilities' && !priorHealth.has(route)) {
      return deny('DENIED_SEQUENCE', 'A signed health receipt from this exact company, tenant and current key must precede capabilities.');
    }
    // Key rotation may not revive a previously used receipt or nonce.
    const id = [p.business_id, p.tenant_id ?? '-', p.kind, p.receipt_id, p.nonce].join(':');
    if (seen.has(id)) return deny('DENIED_REPLAY', 'Receipt was already accepted in this isolated verifier session.');
    seen.add(id);
    if (p.kind === 'health') priorHealth.add(route);
    return deny('ISOLATED_SIGNATURE_VERIFIED_HELD', 'Pinned test public key verified; not a real deployed gateway or owner approval.');
  }
  return Object.freeze({ inspect });
}
