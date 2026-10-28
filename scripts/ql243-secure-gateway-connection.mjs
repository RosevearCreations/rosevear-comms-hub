/**
 * QL-243: explicitly invoked, server-side, nonproduction-only evidence probe.
 * A valid witness signature is NOT an owner release decision. No browser/runtime
 * import, stored key, write route, connector activation or provider dispatch.
 */
import { createHash, createHmac, createPublicKey, randomBytes, timingSafeEqual, verify } from 'node:crypto';
import { QL240_PATHS, QL240_SCHEMA } from './ql240-nonproduction-receipt-verifier.mjs';
import { ql241Origin, ql241PublicKeyFingerprint, retrieveQl241NonproductionProof } from './ql241-external-gateway-retrieval.mjs';
import { QL242_AUDIT_KEYS, createQl242AuditInspector, ql242Canonical } from './ql242-gateway-audit-owner-rehearsal.mjs';

export const QL243_RELEASE = 'ql243-independent-owner-attestation-durable-audit-authenticated-nonproduction-readonly-held-v1';
export const QL243_AUDIT_PATH = '/api/integration/v1/audit/receipts/';
export const QL243_IDENTITY_KEYS = Object.freeze([
  'schema_version', 'issuer', 'attestation_id', 'identity_ref', 'method',
  'business_id', 'tenant_id', 'environment', 'owner_key_fingerprint_sha256',
  'gateway_audit_id', 'health_receipt_id', 'capabilities_receipt_id',
  'source_revision', 'scope', 'witnessed_at', 'expires_at'
]);
const READ_SCOPES = ['read_product_reference', 'read_listing_reference'];
const ID = /^np-[a-z0-9-]{6,70}$/;
const PIN = /^[a-f0-9]{64}$/;
const KEY_ID = /^np-[a-z0-9-]{4,50}$/;
const SHA = /^[a-f0-9]{40}$/;
const exact = (v, keys) => !!v && typeof v === 'object' && !Array.isArray(v) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(v)) &&
  Object.keys(v).length === keys.length && Object.keys(v).every(k => keys.includes(k));
const held = (status, reason, getAttempts = 0) => Object.freeze({
  release: QL243_RELEASE, status, reason, company: 'devilndove',
  ownerIdentityClaimSignatureChecked: false, ownerIdentityIndependentlyConfirmed: false,
  gatewayAuditGetChecked: false, gatewayAuditDurabilityIndependentlyConfirmed: false,
  actualOwnerAuthorization: false, connectionState: 'DISCONNECTED',
  livePilotRelease: false, getAttempts, writeAttempts: 0, calls: 0, sms: 0,
  providerDispatch: 0, realPilotHolds: 12
});

/** Authenticated witness signs an opaque owner-key binding, NOT an approval. */
export function ql243CanonicalIdentity(payload) {
  if (!exact(payload, QL243_IDENTITY_KEYS)) throw new TypeError('Unexpected identity attestation fields.');
  return Buffer.from(QL243_IDENTITY_KEYS.map(k => JSON.stringify([k, payload[k]])).join('\n'), 'utf8');
}

/** Three separate out-of-band pin inputs; a self-signed identity claim is denied. */
export function inspectQl243Identity(bundle, pins, now = Date.now()) {
  if (!exact(bundle, ['ql242', 'identity']) || !exact(bundle.identity, ['witnessPublicKeyPem', 'envelope']) ||
      !exact(pins, ['gateway', 'owner', 'witness']) ||
      !Object.values(pins).every(v => typeof v === 'string' && PIN.test(v)) ||
      new Set(Object.values(pins)).size !== 3 || !Number.isSafeInteger(now) || now < 1) {
    return held('DENIED_INPUT', 'Require exact QL-242 packet, independent witness and three distinct out-of-band public key pins.');
  }
  const verified = createQl242AuditInspector().inspect(bundle.ql242, pins.gateway, pins.owner, now);
  if (verified.status !== 'DUAL_SIGNATURES_CHECKED_HELD') {
    return held('DENIED_UPSTREAM', 'The separate QL-242 gateway and owner rehearsal-request signatures did not reconcile.');
  }
  const { envelope, witnessPublicKeyPem } = bundle.identity;
  if (!exact(envelope, ['payload', 'signature']) || !exact(envelope.payload, QL243_IDENTITY_KEYS) ||
      typeof envelope.signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(envelope.signature)) {
    return held('DENIED_ATTESTATION', 'External identity witness envelope is malformed.');
  }
  let witnessKey;
  try {
    const pin = ql241PublicKeyFingerprint(witnessPublicKeyPem);
    if (!timingSafeEqual(Buffer.from(pin, 'hex'), Buffer.from(pins.witness, 'hex'))) throw new Error('pin');
    witnessKey = createPublicKey(witnessPublicKeyPem);
    if (!verify(null, ql243CanonicalIdentity(envelope.payload), witnessKey,
      Buffer.from(envelope.signature, 'base64url'))) throw new Error('signature');
  } catch { return held('DENIED_WITNESS_SIGNATURE', 'Witness public-key pin or detached signature did not verify.'); }
  const p = envelope.payload;
  if (p.schema_version !== QL240_SCHEMA || p.issuer !== 'rosevear-independent-identity-witness' ||
      !ID.test(p.attestation_id) || !ID.test(p.identity_ref) ||
      p.method !== 'separate_authenticated_channel_challenge' ||
      p.business_id !== 'devilndove' || p.tenant_id !== null ||
      p.environment !== 'nonproduction' || p.owner_key_fingerprint_sha256 !== pins.owner ||
      p.gateway_audit_id !== verified.gatewayAuditId ||
      p.health_receipt_id !== verified.healthReceiptId ||
      p.capabilities_receipt_id !== verified.capabilitiesReceiptId ||
      p.source_revision !== verified.sourceRevision || !SHA.test(p.source_revision) ||
      !Array.isArray(p.scope) || p.scope.length !== READ_SCOPES.length ||
      new Set(p.scope).size !== READ_SCOPES.length || !p.scope.every(x => READ_SCOPES.includes(x)) ||
      !Number.isSafeInteger(p.witnessed_at) || !Number.isSafeInteger(p.expires_at) ||
      p.witnessed_at > now + 300_000 || p.witnessed_at < now - 86_400_000 ||
      p.expires_at <= now || p.expires_at - p.witnessed_at > 86_400_000) {
    return held('DENIED_WITNESS_SCOPE', 'Witness is stale, foreign, unbound to the gateway evidence or requests a non-read-only scope.');
  }
  return Object.freeze({ ...held('IDENTITY_WITNESS_SIGNATURE_CHECKED_HELD',
    'A separately pinned external witness signed the owner-key binding. Its real-world independence and owner identity still require out-of-band confirmation.'),
    ownerIdentityClaimSignatureChecked: true, identityAttestationId: p.attestation_id,
    identityRef: p.identity_ref, gatewayAuditId: verified.gatewayAuditId,
    healthReceiptId: verified.healthReceiptId, capabilitiesReceiptId: verified.capabilitiesReceiptId,
    sourceRevision: verified.sourceRevision, gatewayPublicKeyFingerprintSha256: pins.gateway,
    ownerPublicKeyFingerprintSha256: pins.owner, witnessPublicKeyFingerprintSha256: pins.witness
  });
}

/** Canonical signing input, exactly as all six companion apps must implement. */
export function ql243CanonicalGet({ path, timestamp, nonce, keyId, company = 'devilndove' }) {
  const allowed = typeof path === 'string' && (Object.values(QL240_PATHS).includes(path) ||
    (path.startsWith(QL243_AUDIT_PATH) && ID.test(path.slice(QL243_AUDIT_PATH.length))));
  if (!allowed ||
      !Number.isSafeInteger(timestamp) || timestamp <= 0 || !ID.test(nonce) ||
      !KEY_ID.test(keyId) || company !== 'devilndove') throw new TypeError('Invalid nonproduction read-only request.');
  return Buffer.from(['rosevear.integration.v1', 'GET', path, String(timestamp), nonce,
    'rosevear-comms-hub', 'ai-data-platform', company, '-', 'nonproduction',
    createHash('sha256').update('').digest('hex'), keyId].join('\n'), 'utf8');
}

export function ql243SignedGetHeaders(path, keyId, secret, timestamp, nonce) {
  if (!Buffer.isBuffer(secret) || secret.byteLength !== 32) throw new TypeError('A distinct 256-bit gateway test key is required.');
  const message = ql243CanonicalGet({ path, timestamp, nonce, keyId });
  const signature = createHmac('sha256', secret).update(message).digest('base64url');
  return Object.freeze({
    Accept: 'application/json', 'X-Rosevear-Contract': 'rosevear.integration.v1',
    'X-Rosevear-Environment': 'nonproduction', 'X-Rosevear-Source': 'rosevear-comms-hub',
    'X-Rosevear-Destination': 'ai-data-platform', 'X-Rosevear-Business': 'devilndove',
    'X-Rosevear-Tenant': '-', 'X-Rosevear-Key-Id': keyId,
    'X-Rosevear-Timestamp': String(timestamp), 'X-Rosevear-Nonce': nonce,
    'X-Rosevear-Signature': signature
  });
}

async function readBoundedJson(response) {
  if (response?.status !== 200 || !/^application\/json(?:;|$)/i.test(response.headers?.get('content-type') ?? '')) return null;
  const length = response.headers?.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > 16_384)) return null;
  try {
    if (!response.body?.getReader) { const txt = await response.text(); return Buffer.byteLength(txt) <= 16_384 ? JSON.parse(txt) : null; }
    const reader = response.body.getReader(); const chunks = []; let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        total += value.byteLength; if (total > 16_384) return null; chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return null; }
}

/** Only four individually signed, authenticated GETs, including a repeat audit GET. */
export async function testQl243NonproductionConnection(bundle, pins, config, secret, {
  fetchImpl = globalThis.fetch, now = Date.now()
} = {}) {
  const identity = inspectQl243Identity(bundle, pins, now);
  if (identity.status !== 'IDENTITY_WITNESS_SIGNATURE_CHECKED_HELD') return identity;
  if (!exact(config, ['company', 'tenantId', 'origin', 'keyId', 'healthReceiptId', 'capabilitiesReceiptId',
    'gatewayAuditId', 'sourceRevision']) || config.company !== 'devilndove' || config.tenantId !== null ||
    config.origin !== ql241Origin(config.origin) || !KEY_ID.test(config.keyId) ||
    config.healthReceiptId !== identity.healthReceiptId || config.capabilitiesReceiptId !== identity.capabilitiesReceiptId ||
    config.gatewayAuditId !== identity.gatewayAuditId || config.sourceRevision !== identity.sourceRevision ||
    !Buffer.isBuffer(secret) || secret.byteLength !== 32 || typeof fetchImpl !== 'function') {
    return held('DENIED_CONNECTION_CONFIG', 'Require exact nonproduction gateway origin, chain references and server-only per-app 256-bit HMAC key.');
  }
  const allowed = new Set([...Object.values(QL240_PATHS), `${QL243_AUDIT_PATH}${config.gatewayAuditId}`]);
  const seenNonces = new Set(); let attempts = 0;
  const signedFetch = (url, opts = {}) => {
    const parsed = new URL(url);
    if (parsed.origin !== config.origin || parsed.search || parsed.hash || !allowed.has(parsed.pathname) ||
        opts.method !== 'GET' || opts.redirect !== 'manual' || opts.credentials !== 'omit') throw new TypeError('Only exact nonproduction GET paths are allowed.');
    const nonce = `np-${randomBytes(16).toString('hex')}`;
    if (seenNonces.has(nonce)) throw new Error('nonce reused'); seenNonces.add(nonce);
    attempts++;
    return fetchImpl(url, { method: 'GET', redirect: 'manual', cache: 'no-store', credentials: 'omit',
      headers: ql243SignedGetHeaders(parsed.pathname, config.keyId, secret, now, nonce),
      signal: AbortSignal.timeout(8_000) });
  };
  const pair = await retrieveQl241NonproductionProof({
    company: config.company, tenantId: config.tenantId, origin: config.origin,
    keyId: config.keyId, publicKeyPem: bundle.ql242.gatewayPublicKeyPem,
    healthReceiptId: config.healthReceiptId, capabilitiesReceiptId: config.capabilitiesReceiptId
  }, pins.gateway, { fetchImpl: signedFetch, now });
  if (pair.status !== 'SIGNED_GET_PAIR_CHECKED_HELD') {
    return held('DENIED_SIGNED_GET_PAIR', `Authenticated health/capabilities pair failed: ${pair.status}.`, attempts);
  }
  const auditPath = `${QL243_AUDIT_PATH}${config.gatewayAuditId}`;
  for (let i = 0; i < 2; i++) {
    let proof;
    try { proof = await readBoundedJson(await signedFetch(config.origin + auditPath, {
      method: 'GET', redirect: 'manual', credentials: 'omit'
    })); } catch { return held('DENIED_AUDIT_GET', 'Audit GET failed or timed out.', attempts); }
    if (!exact(proof, ['payload', 'signature']) || !exact(proof.payload, QL242_AUDIT_KEYS) ||
        proof.signature !== bundle.ql242.audit.signature ||
        !ql243AuditBytesEqual(proof.payload, bundle.ql242.audit.payload)) {
      return held('DENIED_AUDIT_GET', 'Repeated signed audit GET disagreed with the independently pinned QL-242 audit packet.', attempts);
    }
  }
  return Object.freeze({ ...held('AUTHENTICATED_FOUR_GETS_CHECKED_HELD',
    'Four authenticated nonproduction GETs and two identical audit signatures were checked. Gateway durability, identity provenance, owner authorization and pilot release are still held.', attempts),
    ownerIdentityClaimSignatureChecked: true, gatewayAuditGetChecked: true,
    gatewayAuditId: identity.gatewayAuditId, identityAttestationId: identity.identityAttestationId,
    sourceRevision: identity.sourceRevision, healthReceiptId: identity.healthReceiptId,
    capabilitiesReceiptId: identity.capabilitiesReceiptId,
    gatewayPublicKeyFingerprintSha256: pins.gateway, ownerPublicKeyFingerprintSha256: pins.owner,
    witnessPublicKeyFingerprintSha256: pins.witness
  });
}

function ql243AuditBytesEqual(a, b) {
  try { return timingSafeEqual(ql242Canonical('audit', a), ql242Canonical('audit', b)); }
  catch { return false; }
}
