/**
 * QL-242: independent, strictly offline gateway-audit / owner-receipt signature
 * comparison and reversible state-machine rehearsal. No actual owner identity,
 * server audit provenance, connection, credential or authorization is granted.
 */
import { timingSafeEqual, verify as verifySignature, createPublicKey } from 'node:crypto';
import { QL240_SCHEMA, QL240_SCOPES } from './ql240-nonproduction-receipt-verifier.mjs';
import { ql241PublicKeyFingerprint } from './ql241-external-gateway-retrieval.mjs';

export const QL242_RELEASE = 'ql242-independent-audit-owner-signed-decision-reversible-readonly-rollout-rehearsal-held-v1';
export const QL242_AUDIT_KEYS = Object.freeze([
  'schema_version', 'issuer', 'business_id', 'tenant_id', 'environment', 'kind',
  'method', 'connection_status', 'health_receipt_id', 'capabilities_receipt_id',
  'gateway_audit_id', 'source_revision', 'gateway_key_id', 'nonce', 'issued_at',
  'negative_test_results'
]);
export const QL242_OWNER_KEYS = Object.freeze([
  'schema_version', 'issuer', 'business_id', 'tenant_id', 'environment', 'kind',
  'decision', 'scope', 'gateway_audit_id', 'health_receipt_id',
  'capabilities_receipt_id', 'source_revision', 'rollback_receipt_id',
  'owner_key_id', 'nonce', 'issued_at', 'expires_at'
]);
const NEGATIVES = Object.freeze([
  'wrong_business_denied', 'wrong_tenant_denied', 'revoked_key_denied',
  'write_denied', 'replay_denied'
]);
const allowedScope = Object.freeze(['read_product_reference', 'read_listing_reference']);
const exact = (obj, keys) => !!obj && typeof obj === 'object' && !Array.isArray(obj) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(obj)) &&
  Object.keys(obj).length === keys.length && Object.keys(obj).every((key) => keys.includes(key));
const goodId = (v) => typeof v === 'string' && /^np-[a-z0-9-]{6,70}$/.test(v);
const goodSource = (v) => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const goodPin = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const safe = (status, reason) => Object.freeze({
  release: QL242_RELEASE, status, reason, signedAuditCompared: false,
  signedOwnerDecisionCompared: false, independentlyWitnessedProvenance: false,
  ownerIdentityVerified: false, actualOwnerAuthorization: false,
  realGatewayConnection: 'DISCONNECTED', rehearsalState: 'NOT_STARTED',
  externalRequests: 0, externalWrites: 0, liveCalls: 0, liveSms: 0,
  providerDispatch: 0, realPilotHolds: 12
});

export function ql242Canonical(kind, payload) {
  const keys = kind === 'audit' ? QL242_AUDIT_KEYS : kind === 'owner' ? QL242_OWNER_KEYS : null;
  if (!keys || !exact(payload, keys)) throw new TypeError('Unexpected signed receipt schema.');
  return Buffer.from(keys.map((key) => JSON.stringify([key, payload[key]])).join('\n'), 'utf8');
}

function pinnedKey(pem, expectedFingerprint) {
  if (!goodPin(expectedFingerprint)) return null;
  try {
    const observed = ql241PublicKeyFingerprint(pem);
    if (!timingSafeEqual(Buffer.from(observed, 'hex'), Buffer.from(expectedFingerprint, 'hex'))) return null;
    return createPublicKey(pem);
  } catch { return null; }
}

function signed(envelope, kind, publicKey) {
  const keys = kind === 'audit' ? QL242_AUDIT_KEYS : QL242_OWNER_KEYS;
  if (!exact(envelope, ['payload', 'signature']) || !exact(envelope.payload, keys) ||
      typeof envelope.signature !== 'string' || !/^[A-Za-z0-9_-]{86}$/.test(envelope.signature)) return false;
  try { return verifySignature(null, ql242Canonical(kind, envelope.payload), publicKey,
    Buffer.from(envelope.signature, 'base64url')); } catch { return false; }
}

/**
 * All references are a caller-provided, non-personal QL-241 chain. The code
 * cannot independently authenticate key ownership or the origin of the file.
 */
export function inspectQl242Packet(packet, gatewayPin, ownerPin, now = Date.now()) {
  if (!exact(packet, ['company', 'tenantId', 'healthReceiptId', 'capabilitiesReceiptId',
    'gatewayAuditId', 'sourceRevision', 'gatewayKeyId', 'ownerKeyId',
    'gatewayPublicKeyPem', 'ownerPublicKeyPem', 'audit', 'owner']) ||
      packet.company !== 'devilndove' || packet.tenantId !== null ||
      !goodId(packet.healthReceiptId) || !goodId(packet.capabilitiesReceiptId) ||
      !goodId(packet.gatewayAuditId) || !goodSource(packet.sourceRevision) ||
      !/^np-[a-z0-9-]{4,50}$/.test(packet.gatewayKeyId) ||
      !/^np-owner-[a-z0-9-]{4,50}$/.test(packet.ownerKeyId) ||
      packet.gatewayKeyId === packet.ownerKeyId ||
      packet.healthReceiptId === packet.capabilitiesReceiptId ||
      !Number.isSafeInteger(now) || now < 1) {
    return safe('DENIED_PACKET', 'Only a scoped, non-personal Devil n Dove read-only evidence chain is accepted.');
  }
  const gatewayKey = pinnedKey(packet.gatewayPublicKeyPem, gatewayPin);
  const ownerKey = pinnedKey(packet.ownerPublicKeyPem, ownerPin);
  if (!gatewayKey || !ownerKey || gatewayPin === ownerPin) {
    return safe('DENIED_PIN', 'Require two different, separately pinned Ed25519 public signing keys.');
  }
  if (!signed(packet.audit, 'audit', gatewayKey)) {
    return safe('DENIED_AUDIT_SIGNATURE', 'Gateway audit detached signature is missing, altered or untrusted.');
  }
  const audit = packet.audit.payload;
  if (audit.schema_version !== QL240_SCHEMA || audit.issuer !== 'ai-data-platform' ||
      audit.business_id !== packet.company || audit.tenant_id !== packet.tenantId ||
      audit.environment !== 'nonproduction' || audit.kind !== 'gateway_audit' ||
      audit.method !== 'GET' || audit.connection_status !== 'HOLD' ||
      audit.health_receipt_id !== packet.healthReceiptId ||
      audit.capabilities_receipt_id !== packet.capabilitiesReceiptId ||
      audit.gateway_audit_id !== packet.gatewayAuditId ||
      audit.source_revision !== packet.sourceRevision ||
      audit.gateway_key_id !== packet.gatewayKeyId || !goodId(audit.nonce) ||
      !Number.isSafeInteger(audit.issued_at) || Math.abs(now - audit.issued_at) > 300_000 ||
      !exact(audit.negative_test_results, NEGATIVES) ||
      NEGATIVES.some((key) => audit.negative_test_results[key] !== true)) {
    return safe('DENIED_AUDIT_SCOPE', 'Audit reference, tenant, denied-negative claims, state or freshness differs from the held GET chain.');
  }
  if (!signed(packet.owner, 'owner', ownerKey)) {
    return safe('DENIED_OWNER_SIGNATURE', 'Owner-decision detached signature is missing, altered or untrusted.');
  }
  const owner = packet.owner.payload;
  if (owner.schema_version !== QL240_SCHEMA || owner.issuer !== 'rosevear-owner-review' ||
      owner.business_id !== packet.company || owner.tenant_id !== packet.tenantId ||
      owner.environment !== 'nonproduction' || owner.kind !== 'pilot_decision' ||
      owner.decision !== 'REQUEST_READ_ONLY_REHEARSAL' ||
      !Array.isArray(owner.scope) || owner.scope.length !== allowedScope.length ||
      new Set(owner.scope).size !== allowedScope.length ||
      !owner.scope.every((cap) => allowedScope.includes(cap)) ||
      owner.gateway_audit_id !== packet.gatewayAuditId ||
      owner.health_receipt_id !== packet.healthReceiptId ||
      owner.capabilities_receipt_id !== packet.capabilitiesReceiptId ||
      owner.source_revision !== packet.sourceRevision ||
      !goodId(owner.rollback_receipt_id) || owner.owner_key_id !== packet.ownerKeyId ||
      !goodId(owner.nonce) || owner.nonce === audit.nonce ||
      !Number.isSafeInteger(owner.issued_at) || !Number.isSafeInteger(owner.expires_at) ||
      owner.issued_at > now + 300_000 || now - owner.issued_at > 300_000 ||
      owner.expires_at <= now || owner.expires_at - owner.issued_at > 3_600_000) {
    return safe('DENIED_OWNER_SCOPE', 'Owner request must be time-bound, source-linked and limited to two read-only reference capabilities.');
  }
  return Object.freeze({ ...safe('DUAL_SIGNATURES_CHECKED_HELD',
    'Signed nonproduction audit and owner REHEARSAL REQUEST match supplied pins, but their real-world provenance/identity and owner consent remain UNVERIFIED.'),
    signedAuditCompared: true, signedOwnerDecisionCompared: true,
    company: packet.company, gatewayAuditId: packet.gatewayAuditId,
    sourceRevision: packet.sourceRevision, healthReceiptId: packet.healthReceiptId,
    capabilitiesReceiptId: packet.capabilitiesReceiptId,
    gatewayPublicKeyFingerprintSha256: gatewayPin,
    ownerPublicKeyFingerprintSha256: ownerPin,
    rollbackReceiptId: owner.rollback_receipt_id,
    ownerDecision: 'REQUEST_READ_ONLY_REHEARSAL',
    rehearsalState: 'AUDIT_REVIEW_ONLY_HELD'
  });
}

/** Session-only replay rehearsal; production replay suppression belongs to the gateway database. */
export function createQl242AuditInspector() {
  const seen = new Set();
  function inspect(packet, gatewayPin, ownerPin, now = Date.now()) {
    const checked = inspectQl242Packet(packet, gatewayPin, ownerPin, now);
    if (checked.status !== 'DUAL_SIGNATURES_CHECKED_HELD') return checked;
    const id = `${packet.company}:${packet.gatewayAuditId}:${packet.audit.payload.nonce}:${packet.owner.payload.nonce}`;
    if (seen.has(id)) return safe('DENIED_REPLAY', 'This pair of signed receipts was already inspected in the isolated session.');
    seen.add(id);
    return checked;
  }
  return Object.freeze({ inspect });
}

/** No write callback, no provider config, no browser IO; deterministic reversible rehearsal. */
export function createQl242Rehearsal(result) {
  let state = 'NOT_STARTED';
  const events = [];
  const eligible = result?.status === 'DUAL_SIGNATURES_CHECKED_HELD' &&
    result.signedAuditCompared === true && result.signedOwnerDecisionCompared === true &&
    result.actualOwnerAuthorization === false && result.realGatewayConnection === 'DISCONNECTED';
  const transition = (action) => {
    const next = action === 'prepare' && state === 'NOT_STARTED' && eligible ? 'REVIEW_PREPARED_HELD' :
      action === 'rehearse' && state === 'REVIEW_PREPARED_HELD' && eligible ? 'SIMULATED_READ_ONLY_HELD' :
      action === 'rollback' && state === 'SIMULATED_READ_ONLY_HELD' ? 'ROLLED_BACK_HELD' : null;
    if (next) { state = next; events.push(next); }
    return Object.freeze({ state, transitionAccepted: Boolean(next),
      rollbackAvailable: state === 'SIMULATED_READ_ONLY_HELD', events: Object.freeze([...events]),
      actualConnection: 'DISCONNECTED', realOwnerAuthorization: false,
      externalWrites: 0, providerDispatch: 0, liveCalls: 0, liveSms: 0, realPilotHolds: 12 });
  };
  return Object.freeze({ transition });
}

export function ql242CompanyGate(company) {
  return { company, eligibleForActualRelease: false, actualConnection: 'DISCONNECTED',
    realPilotHolds: 12, auditKeyInstalled: false, ownerApprovalVerified: false,
    rehearsalAllowed: Object.hasOwn(QL240_SCOPES, company) && company === 'devilndove' };
}
