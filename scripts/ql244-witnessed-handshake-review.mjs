/**
 * QL-244: offline, separately pinned signature review of a QL-243 test summary,
 * a six-app credential-registry attestation, and an owner's CONDITIONAL REVIEW
 * REQUEST. This is NOT an approval or a connection initializer.
 */
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { QL240_SCHEMA } from './ql240-nonproduction-receipt-verifier.mjs';
import { ql241PublicKeyFingerprint } from './ql241-external-gateway-retrieval.mjs';
import { inspectQl243Identity, QL243_RELEASE } from './ql243-secure-gateway-connection.mjs';

export const QL244_RELEASE = 'ql244-independently-witnessed-handshake-credential-registry-conditional-pilot-review-held-v1';
export const QL244_SYSTEMS = Object.freeze([
  'ai-data-platform', 'devilndove', 'rosiedazzlers', 'yw', 'icamp', 'rosevear-ai-hub'
]);
export const QL244_REPORT_KEYS = Object.freeze([
  'release', 'status', 'reason', 'company', 'ownerIdentityClaimSignatureChecked',
  'ownerIdentityIndependentlyConfirmed', 'gatewayAuditGetChecked',
  'gatewayAuditDurabilityIndependentlyConfirmed', 'actualOwnerAuthorization',
  'connectionState', 'livePilotRelease', 'getAttempts', 'writeAttempts', 'calls',
  'sms', 'providerDispatch', 'realPilotHolds', 'gatewayAuditId',
  'identityAttestationId', 'sourceRevision', 'healthReceiptId', 'capabilitiesReceiptId',
  'gatewayPublicKeyFingerprintSha256', 'ownerPublicKeyFingerprintSha256',
  'witnessPublicKeyFingerprintSha256'
]);
export const QL244_ASSESSOR_KEYS = Object.freeze([
  'schema_version', 'issuer', 'kind', 'assessor_receipt_id', 'assessor_key_id',
  'business_id', 'tenant_id', 'environment', 'gateway_audit_id',
  'identity_attestation_id', 'health_receipt_id', 'capabilities_receipt_id',
  'source_revision', 'ql243_report_sha256', 'credential_registry',
  'negative_test_results', 'witnessed_at', 'expires_at'
]);
export const QL244_OWNER_KEYS = Object.freeze([
  'schema_version', 'issuer', 'kind', 'decision', 'business_id', 'tenant_id',
  'environment', 'assessor_receipt_id', 'identity_attestation_id',
  'gateway_audit_id', 'source_revision', 'scope', 'rollback_receipt_id',
  'owner_key_id', 'issued_at', 'expires_at'
]);
export const QL244_NEGATIVES = Object.freeze([
  'nonce_replay_denied', 'stale_request_denied', 'cross_business_denied',
  'cross_tenant_denied', 'revoked_key_denied', 'write_denied', 'dispatch_denied'
]);
const REGISTRY_KEYS = ['system_id', 'key_id', 'exchange_receipt_id', 'source_revision',
  'exchange_state', 'review_state'];
const ID = /^np-[a-z0-9-]{6,70}$/;
const KEY_ID = /^np-[a-z0-9-]{4,50}$/;
const PIN = /^[a-f0-9]{64}$/;
const REV = /^[a-f0-9]{40}$/;
const READ_ONLY = ['read_product_reference', 'read_listing_reference'];
const exact = (obj, keys) => !!obj && typeof obj === 'object' && !Array.isArray(obj) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(obj)) &&
  Object.keys(obj).length === keys.length && Object.keys(obj).every(k => keys.includes(k));
const safe = (status, reason) => Object.freeze({
  release: QL244_RELEASE, status, reason, company: 'devilndove',
  assessorSignatureChecked: false, conditionalOwnerRequestSignatureChecked: false,
  witnessedSourceIndependentlyConfirmed: false, credentialExchangeIndependentlyConfirmed: false,
  ownerIdentityIndependentlyConfirmed: false, actualOwnerAuthorization: false,
  conditionalPilotDecision: 'NOT_AUTHORIZED_HELD', actualConnection: 'DISCONNECTED',
  actualWrites: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12
});

export function ql244Canonical(kind, payload) {
  const keys = kind === 'assessor' ? QL244_ASSESSOR_KEYS : kind === 'owner' ? QL244_OWNER_KEYS : null;
  if (!keys || !exact(payload, keys)) throw new TypeError('Unexpected signed witness/owner schema.');
  return Buffer.from(keys.map(k => JSON.stringify([k, payload[k]])).join('\n'), 'utf8');
}

/** Digest excludes free-form narrative, includes every security-relevant QL-243 field. */
export function ql244ReportDigest(report) {
  if (!exact(report, QL244_REPORT_KEYS)) throw new TypeError('Unexpected QL-243 report fields.');
  const keys = QL244_REPORT_KEYS.filter(k => k !== 'reason');
  return createHash('sha256').update(Buffer.from(keys.map(k => JSON.stringify([k, report[k]])).join('\n'), 'utf8')).digest('hex');
}

function verifiedPublicKey(pem, pin) {
  if (!PIN.test(pin)) return null;
  try {
    const actual = ql241PublicKeyFingerprint(pem);
    if (!timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(pin, 'hex'))) return null;
    return createPublicKey(pem);
  } catch { return null; }
}

function verifyEnvelope(envelope, kind, key) {
  const keys = kind === 'assessor' ? QL244_ASSESSOR_KEYS : QL244_OWNER_KEYS;
  if (!exact(envelope, ['payload', 'signature']) || !exact(envelope.payload, keys) ||
      typeof envelope.signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(envelope.signature)) return false;
  try { return verify(null, ql244Canonical(kind, envelope.payload), key,
    Buffer.from(envelope.signature, 'base64url')); } catch { return false; }
}

function validQl243Report(report, evidence, pins) {
  return exact(report, QL244_REPORT_KEYS) &&
    report.release === QL243_RELEASE && report.status === 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD' &&
    report.company === 'devilndove' && report.ownerIdentityClaimSignatureChecked === true &&
    report.ownerIdentityIndependentlyConfirmed === false && report.gatewayAuditGetChecked === true &&
    report.gatewayAuditDurabilityIndependentlyConfirmed === false &&
    report.actualOwnerAuthorization === false && report.connectionState === 'DISCONNECTED' &&
    report.livePilotRelease === false && report.getAttempts === 4 && report.writeAttempts === 0 &&
    report.calls === 0 && report.sms === 0 && report.providerDispatch === 0 &&
    report.realPilotHolds === 12 && typeof report.reason === 'string' && report.reason.length <= 300 &&
    report.identityAttestationId === evidence.identityAttestationId &&
    report.gatewayAuditId === evidence.gatewayAuditId &&
    report.healthReceiptId === evidence.healthReceiptId &&
    report.capabilitiesReceiptId === evidence.capabilitiesReceiptId &&
    report.sourceRevision === evidence.sourceRevision &&
    report.gatewayPublicKeyFingerprintSha256 === pins.gateway &&
    report.ownerPublicKeyFingerprintSha256 === pins.owner &&
    report.witnessPublicKeyFingerprintSha256 === pins.witness;
}

/** All SIX registry rows, unique metadata IDs; not actual credential exchange. */
export function ql244ReviewRegistry(rows, sourceRevision) {
  if (!Array.isArray(rows) || rows.length !== QL244_SYSTEMS.length) return false;
  const keys = new Set(); const receipts = new Set();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!exact(row, REGISTRY_KEYS) || row.system_id !== QL244_SYSTEMS[i] ||
        !KEY_ID.test(row.key_id) || !ID.test(row.exchange_receipt_id) ||
        !REV.test(row.source_revision) ||
        row.review_state !== 'OWNER_APPROVAL_NOT_GIVEN_HELD' ||
        row.exchange_state !== (i < 2 ? 'NONPRODUCTION_METADATA_REVIEWED_HELD' : 'NOT_PROVISIONED_HELD') ||
        (row.system_id === 'devilndove' && row.source_revision !== sourceRevision) ||
        keys.has(row.key_id) || receipts.has(row.exchange_receipt_id)) return false;
    keys.add(row.key_id); receipts.add(row.exchange_receipt_id);
  }
  return true;
}

/** Full packet is public metadata only; three existing pins plus a distinct assessor pin. */
export function inspectQl244Packet(packet, pins, now = Date.now()) {
  if (!exact(packet, ['ql243Bundle', 'ql243Report', 'assessorPublicKeyPem',
    'assessor', 'ownerDecision']) || !exact(pins, ['gateway', 'owner', 'witness', 'assessor']) ||
    Object.values(pins).some(v => typeof v !== 'string' || !PIN.test(v)) ||
    new Set(Object.values(pins)).size !== 4 || !Number.isSafeInteger(now) || now < 1) {
    return safe('DENIED_PACKET', 'Require a non-personal QL-243 chain and four distinct, separately trusted public-key pins.');
  }
  const evidence = inspectQl243Identity(packet.ql243Bundle,
    { gateway: pins.gateway, owner: pins.owner, witness: pins.witness }, now);
  if (evidence.status !== 'IDENTITY_WITNESS_SIGNATURE_CHECKED_HELD' ||
      !validQl243Report(packet.ql243Report, evidence, pins)) {
    return safe('DENIED_QL243_CHAIN', 'QL-243 signature, four-GET summary, identity witness or source/receipt chain differs.');
  }
  const assessorKey = verifiedPublicKey(packet.assessorPublicKeyPem, pins.assessor);
  if (!assessorKey || !verifyEnvelope(packet.assessor, 'assessor', assessorKey)) {
    return safe('DENIED_ASSESSOR_SIGNATURE', 'Independent assessor key pin and detached test-record signature did not match.');
  }
  const a = packet.assessor.payload;
  if (a.schema_version !== QL240_SCHEMA ||
      a.issuer !== 'rosevear-independent-handshake-assessor' ||
      a.kind !== 'nonproduction_handshake_review' ||
      !ID.test(a.assessor_receipt_id) || !KEY_ID.test(a.assessor_key_id) ||
      a.business_id !== 'devilndove' || a.tenant_id !== null ||
      a.environment !== 'nonproduction' ||
      a.gateway_audit_id !== evidence.gatewayAuditId ||
      a.identity_attestation_id !== evidence.identityAttestationId ||
      a.health_receipt_id !== evidence.healthReceiptId ||
      a.capabilities_receipt_id !== evidence.capabilitiesReceiptId ||
      a.source_revision !== evidence.sourceRevision ||
      a.ql243_report_sha256 !== ql244ReportDigest(packet.ql243Report) ||
      !ql244ReviewRegistry(a.credential_registry, evidence.sourceRevision) ||
      !exact(a.negative_test_results, QL244_NEGATIVES) ||
      QL244_NEGATIVES.some(k => a.negative_test_results[k] !== true) ||
      !Number.isSafeInteger(a.witnessed_at) || !Number.isSafeInteger(a.expires_at) ||
      a.witnessed_at > now + 300_000 || a.witnessed_at < now - 300_000 ||
      a.expires_at <= now || a.expires_at - a.witnessed_at > 3_600_000) {
    return safe('DENIED_ASSESSOR_SCOPE', 'Assessor claim lacks six distinct held credentials, denied-negatives or fresh exact references.');
  }
  const ownerKey = verifiedPublicKey(packet.ql243Bundle.ql242.ownerPublicKeyPem, pins.owner);
  if (!ownerKey || !verifyEnvelope(packet.ownerDecision, 'owner', ownerKey)) {
    return safe('DENIED_OWNER_SIGNATURE', 'Owner conditional *review request* signature is missing or does not match its pin.');
  }
  const o = packet.ownerDecision.payload;
  if (o.schema_version !== QL240_SCHEMA || o.issuer !== 'rosevear-owner-review' ||
      o.kind !== 'conditional_pilot_review' ||
      o.decision !== 'REQUEST_CONDITIONAL_READ_ONLY_REVIEW' ||
      o.business_id !== 'devilndove' || o.tenant_id !== null ||
      o.environment !== 'nonproduction' ||
      o.assessor_receipt_id !== a.assessor_receipt_id ||
      o.identity_attestation_id !== evidence.identityAttestationId ||
      o.gateway_audit_id !== evidence.gatewayAuditId ||
      o.source_revision !== evidence.sourceRevision ||
      !Array.isArray(o.scope) || o.scope.length !== READ_ONLY.length ||
      new Set(o.scope).size !== READ_ONLY.length ||
      !o.scope.every(s => READ_ONLY.includes(s)) ||
      !ID.test(o.rollback_receipt_id) ||
      o.rollback_receipt_id !== packet.ql243Bundle.ql242.owner.payload.rollback_receipt_id ||
      o.owner_key_id !== packet.ql243Bundle.ql242.ownerKeyId ||
      !Number.isSafeInteger(o.issued_at) || !Number.isSafeInteger(o.expires_at) ||
      o.issued_at > now + 300_000 || o.issued_at < now - 300_000 ||
      o.expires_at <= now || o.expires_at - o.issued_at > 3_600_000) {
    return safe('DENIED_OWNER_SCOPE', 'Only a fresh, rollback-linked CONDITIONAL REVIEW REQUEST is accepted, not approval.');
  }
  return Object.freeze({ ...safe('TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD',
    'Assessor/owner review-request signatures match distinct caller-supplied pins, but identities, real-world test execution, credential transfers, durable audit and owner permission remain independently UNVERIFIED.'),
    assessorSignatureChecked: true, conditionalOwnerRequestSignatureChecked: true,
    conditionalPilotDecision: 'CONDITIONAL_REVIEW_REQUEST_ONLY_HELD',
    gatewayAuditId: evidence.gatewayAuditId, identityAttestationId: evidence.identityAttestationId,
    assessorReceiptId: a.assessor_receipt_id, sourceRevision: evidence.sourceRevision,
    gatewayPublicKeyFingerprintSha256: pins.gateway,
    ownerPublicKeyFingerprintSha256: pins.owner,
    witnessPublicKeyFingerprintSha256: pins.witness,
    assessorPublicKeyFingerprintSha256: pins.assessor,
    credentialMetadata: Object.freeze(a.credential_registry.map(r => Object.freeze({
      system: r.system_id, keyId: r.key_id, receiptId: r.exchange_receipt_id,
      review: 'OWNER_APPROVAL_NOT_GIVEN_HELD'
    })))
  });
}
