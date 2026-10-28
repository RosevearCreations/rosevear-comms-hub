/**
 * Explicit operator-invoked, credential-free GET verifier for nonproduction
 * gateway health/capabilities only. Never used in the browser or at runtime.
 * Pin provenance, gateway audit storage and reviewer identity need an external
 * independent reviewer; a matching user-supplied fingerprint does not prove them.
 */
import { createHash, createPublicKey, timingSafeEqual, verify as verifySignature } from 'node:crypto';
import { isIP } from 'node:net';
import { QL240_PATHS, QL240_SCHEMA, QL240_SCOPES, ql240CanonicalReceipt } from './ql240-nonproduction-receipt-verifier.mjs';

export const QL241_RELEASE = 'ql241-external-nonproduction-get-pinned-public-key-owner-authorization-held-v1';
const MAX_BYTES = 16_384;
const MAX_AGE = 300_000;
const ENVELOPE_KEYS = ['payload', 'signature'];
const PAYLOAD_KEYS = [
  'schema_version', 'gateway_id', 'business_id', 'tenant_id', 'environment',
  'kind', 'method', 'path', 'connection_status', 'capabilities',
  'receipt_id', 'nonce', 'issued_at', 'key_id'
];
const exact = (value, keys) => !!value && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value)) &&
  Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));
const safeId = (value) => typeof value === 'string' && /^np-[a-z0-9-]{6,70}$/.test(value);
const held = (status, reason, reads = 0) => Object.freeze({
  release: QL241_RELEASE, status, reason, signedGetReceiptsVerified: false,
  independentlyVerifiedPinProvenance: false, gatewayAuditIndependentlyVerified: false,
  realOwnerAuthorization: false, actualConnection: 'DISCONNECTED',
  externalGetAttempts: reads, externalWrites: 0, calls: 0, sms: 0,
  providerDispatch: 0, realPilotHolds: 12
});

/** The exact origin is operator-selected: no redirects, query, credentials or private hosts. */
export function ql241Origin(candidate) {
  if (typeof candidate !== 'string') return null;
  try {
    const u = new URL(candidate);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== 'https:' || u.username || u.password || u.port ||
        u.pathname !== '/' || u.search || u.hash ||
        !h.includes('.') || isIP(h) || h === 'localhost' ||
        h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') ||
        h.endsWith('.example') || h.endsWith('.test') || h.endsWith('.invalid')) return null;
    return u.origin;
  } catch { return null; }
}

/** SHA-256 over the DER/SPKI bytes of the public Ed25519 key. */
export function ql241PublicKeyFingerprint(pem) {
  if (typeof pem !== 'string' || !/^-----BEGIN PUBLIC KEY-----\r?\n[A-Za-z0-9+/=\r\n]+-----END PUBLIC KEY-----\r?\n?$/.test(pem)) {
    throw new TypeError('Only public SPKI PEM is accepted, never private key material.');
  }
  const key = createPublicKey(pem);
  if (key.asymmetricKeyType !== 'ed25519') throw new TypeError('Only Ed25519 public keys are accepted.');
  return createHash('sha256').update(key.export({ format: 'der', type: 'spki' })).digest('hex');
}

/** Config is local non-secret metadata; the expected fingerprint MUST arrive separately. */
export function ql241ValidateConfig(config, independentlySuppliedFingerprint, now = Date.now()) {
  if (!exact(config, ['company', 'tenantId', 'origin', 'keyId', 'publicKeyPem', 'healthReceiptId', 'capabilitiesReceiptId']) ||
      !Object.hasOwn(QL240_SCOPES, config.company) ||
      config.tenantId !== QL240_SCOPES[config.company].tenant ||
      !ql241Origin(config.origin) || config.origin !== ql241Origin(config.origin) ||
      typeof config.keyId !== 'string' || !/^np-[a-z0-9-]{4,50}$/.test(config.keyId) ||
      !safeId(config.healthReceiptId) || !safeId(config.capabilitiesReceiptId) ||
      config.healthReceiptId === config.capabilitiesReceiptId ||
      !Number.isSafeInteger(now) || now <= 0 ||
      typeof independentlySuppliedFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(independentlySuppliedFingerprint)) {
    return { ok: false, result: held('DENIED_CONFIG', 'Require exact non-secret, nonproduction origin, scope, IDs and a separately supplied public-key fingerprint.') };
  }
  try {
    const actualFingerprint = ql241PublicKeyFingerprint(config.publicKeyPem);
    if (!timingSafeEqual(Buffer.from(actualFingerprint, 'hex'), Buffer.from(independentlySuppliedFingerprint, 'hex'))) {
      return { ok: false, result: held('DENIED_PIN', 'Public key does not match the separately supplied fingerprint.') };
    }
    return { ok: true, publicKey: createPublicKey(config.publicKeyPem), fingerprint: actualFingerprint };
  } catch {
    return { ok: false, result: held('DENIED_PIN', 'Invalid pinned Ed25519 public key.') };
  }
}

function verifyReceipt(envelope, kind, config, publicKey, now, seen) {
  if (!exact(envelope, ENVELOPE_KEYS) || !exact(envelope.payload, PAYLOAD_KEYS) ||
      typeof envelope.signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(envelope.signature)) {
    return 'DENIED_SCHEMA';
  }
  const p = envelope.payload;
  if (p.schema_version !== QL240_SCHEMA || p.gateway_id !== 'ai-data-platform' ||
      p.business_id !== config.company || p.tenant_id !== config.tenantId ||
      p.environment !== 'nonproduction' || p.kind !== kind ||
      p.method !== 'GET' || p.path !== QL240_PATHS[kind] ||
      p.connection_status !== 'HOLD') return 'DENIED_SCOPE';
  const caps = kind === 'health' ? [] : QL240_SCOPES[config.company].caps;
  if (!Array.isArray(p.capabilities) || p.capabilities.length !== caps.length ||
      new Set(p.capabilities).size !== caps.length || !p.capabilities.every((cap) => caps.includes(cap))) return 'DENIED_CAPABILITY';
  if (p.key_id !== config.keyId || !safeId(p.receipt_id) || !safeId(p.nonce) ||
      p.receipt_id !== config[`${kind}ReceiptId`] || !Number.isSafeInteger(p.issued_at) ||
      Math.abs(p.issued_at - now) > MAX_AGE) return 'DENIED_RECEIPT';
  const replayKey = `${config.company}:${config.tenantId}:${p.key_id}:${p.receipt_id}:${p.nonce}`;
  if (seen.has(replayKey)) return 'DENIED_REPLAY';
  let verified = false;
  try { verified = verifySignature(null, ql240CanonicalReceipt(p), publicKey, Buffer.from(envelope.signature, 'base64url')); }
  catch { return 'DENIED_SIGNATURE'; }
  if (!verified) return 'DENIED_SIGNATURE';
  seen.add(replayKey);
  return null;
}

/** Injectable fetch allows isolated CI tests. Only explicitly called GETs happen. */
export async function retrieveQl241NonproductionProof(config, independentlySuppliedFingerprint, {
  fetchImpl = globalThis.fetch, now = Date.now(), signal
} = {}) {
  const valid = ql241ValidateConfig(config, independentlySuppliedFingerprint, now);
  if (!valid.ok) return valid.result;
  if (typeof fetchImpl !== 'function') return held('DENIED_FETCH', 'No read-only GET adapter available.');
  const seen = new Set();
  let reads = 0;
  for (const kind of ['health', 'capabilities']) {
    const url = config.origin + QL240_PATHS[kind];
    let response;
    try {
      reads++;
      response = await fetchImpl(url, {
        method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store',
        headers: { Accept: 'application/json' }, signal: signal ?? AbortSignal.timeout(8_000)
      });
    } catch { return held('DENIED_FETCH', `Nonproduction ${kind} GET failed or timed out.`, reads); }
    if (response.status !== 200 || !/^application\/json(?:;|$)/i.test(response.headers?.get('content-type') ?? '')) {
      return held('DENIED_HTTP', `Nonproduction ${kind} GET did not return a direct JSON HTTP 200.`, reads);
    }
    const declared = response.headers?.get('content-length');
    if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BYTES)) {
      return held('DENIED_SIZE', 'Response is larger than the non-personal receipt envelope limit.', reads);
    }
    let envelope;
    try {
      let body;
      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        let received = 0;
        const chunks = [];
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.byteLength;
            if (received > MAX_BYTES) return held('DENIED_SIZE', 'Response exceeded receipt envelope limit.', reads);
            chunks.push(value);
          }
        } finally { await reader.cancel().catch(() => {}); }
        body = Buffer.concat(chunks).toString('utf8');
      } else {
        // Test-only response adapters may have no readable stream.
        body = await response.text();
      }
      if (Buffer.byteLength(body, 'utf8') > MAX_BYTES) return held('DENIED_SIZE', 'Response exceeded receipt envelope limit.', reads);
      envelope = JSON.parse(body);
    } catch { return held('DENIED_SCHEMA', `Invalid JSON in ${kind} response.`, reads); }
    const result = verifyReceipt(envelope, kind, config, valid.publicKey, now, seen);
    if (result) return held(result, `External ${kind} receipt cannot be accepted with this company, tenant, pin and GET scope.`, reads);
  }
  return Object.freeze({ ...held('SIGNED_GET_PAIR_CHECKED_HELD',
    'Two live GET response signatures match the caller-supplied fingerprint. Pin provenance, revoked key, durable gateway audit and owner identity remain unverified.' , reads),
    signedGetReceiptsVerified: true, company: config.company,
    tenantId: config.tenantId, keyId: config.keyId,
    publicKeyFingerprintSha256: valid.fingerprint,
    healthReceiptId: config.healthReceiptId, capabilitiesReceiptId: config.capabilitiesReceiptId
  });
}
