import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { QL240_SCHEMA } from '../ql240-nonproduction-receipt-verifier.mjs';
import { ql241PublicKeyFingerprint } from '../ql241-external-gateway-retrieval.mjs';
import { ql242Canonical } from '../ql242-gateway-audit-owner-rehearsal.mjs';
import { QL243_RELEASE, ql243CanonicalIdentity } from '../ql243-secure-gateway-connection.mjs';
import { QL244_RELEASE, QL244_SYSTEMS, QL244_NEGATIVES, ql244Canonical,
  ql244ReportDigest, ql244ReviewRegistry, inspectQl244Packet
} from '../ql244-witnessed-handshake-review.mjs';

const now = 1_790_000_000_000;
const key = () => generateKeyPairSync('ed25519');
const pem = k => k.publicKey.export({ type: 'spki', format: 'pem' });
const signed = (payload, priv, canonical) => ({ payload,
  signature: sign(null, canonical(payload), priv).toString('base64url') });
const copy = v => structuredClone(v);

function rig() {
  const gateway = key(), owner = key(), witness = key(), assessor = key();
  const pins = { gateway: ql241PublicKeyFingerprint(pem(gateway)),
    owner: ql241PublicKeyFingerprint(pem(owner)),
    witness: ql241PublicKeyFingerprint(pem(witness)),
    assessor: ql241PublicKeyFingerprint(pem(assessor)) };
  const common = { schema_version: QL240_SCHEMA, business_id: 'devilndove', tenant_id: null,
    environment: 'nonproduction', health_receipt_id: 'np-devilndove-health-001',
    capabilities_receipt_id: 'np-devilndove-caps-001', source_revision: 'a'.repeat(40) };
  const audit = { ...common, issuer: 'ai-data-platform', kind: 'gateway_audit',
    method: 'GET', connection_status: 'HOLD', gateway_audit_id: 'np-devilndove-audit-001',
    gateway_key_id: 'np-devilndove-current', nonce: 'np-gateway-audit-nonce-001', issued_at: now,
    negative_test_results: { wrong_business_denied: true, wrong_tenant_denied: true,
      revoked_key_denied: true, write_denied: true, replay_denied: true } };
  const ownerOld = { ...common, issuer: 'rosevear-owner-review', kind: 'pilot_decision',
    decision: 'REQUEST_READ_ONLY_REHEARSAL', scope: ['read_product_reference', 'read_listing_reference'],
    gateway_audit_id: audit.gateway_audit_id, rollback_receipt_id: 'np-devilndove-rollback-001',
    owner_key_id: 'np-owner-review-current', nonce: 'np-owner-nonce-001', issued_at: now,
    expires_at: now + 300_000 };
  const ql242 = { company: 'devilndove', tenantId: null,
    healthReceiptId: common.health_receipt_id, capabilitiesReceiptId: common.capabilities_receipt_id,
    gatewayAuditId: audit.gateway_audit_id, sourceRevision: common.source_revision,
    gatewayKeyId: audit.gateway_key_id, ownerKeyId: ownerOld.owner_key_id,
    gatewayPublicKeyPem: pem(gateway), ownerPublicKeyPem: pem(owner),
    audit: signed(audit, gateway.privateKey, p => ql242Canonical('audit', p)),
    owner: signed(ownerOld, owner.privateKey, p => ql242Canonical('owner', p)) };
  const identity = { schema_version: QL240_SCHEMA,
    issuer: 'rosevear-independent-identity-witness', attestation_id: 'np-identity-attestation-001',
    identity_ref: 'np-owner-ref-001', method: 'separate_authenticated_channel_challenge',
    business_id: 'devilndove', tenant_id: null, environment: 'nonproduction',
    owner_key_fingerprint_sha256: pins.owner, gateway_audit_id: audit.gateway_audit_id,
    health_receipt_id: common.health_receipt_id, capabilities_receipt_id: common.capabilities_receipt_id,
    source_revision: common.source_revision, scope: ['read_product_reference', 'read_listing_reference'],
    witnessed_at: now, expires_at: now + 300_000 };
  const ql243Bundle = { ql242, identity: { witnessPublicKeyPem: pem(witness),
    envelope: signed(identity, witness.privateKey, ql243CanonicalIdentity) } };
  const ql243Report = { release: QL243_RELEASE, status: 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD',
    reason: 'Synthetic four signed GETs (external provenance not verified).', company: 'devilndove',
    ownerIdentityClaimSignatureChecked: true, ownerIdentityIndependentlyConfirmed: false,
    gatewayAuditGetChecked: true, gatewayAuditDurabilityIndependentlyConfirmed: false,
    actualOwnerAuthorization: false, connectionState: 'DISCONNECTED', livePilotRelease: false,
    getAttempts: 4, writeAttempts: 0, calls: 0, sms: 0, providerDispatch: 0, realPilotHolds: 12,
    gatewayAuditId: audit.gateway_audit_id, identityAttestationId: identity.attestation_id,
    sourceRevision: common.source_revision, healthReceiptId: common.health_receipt_id,
    capabilitiesReceiptId: common.capabilities_receipt_id,
    gatewayPublicKeyFingerprintSha256: pins.gateway,
    ownerPublicKeyFingerprintSha256: pins.owner, witnessPublicKeyFingerprintSha256: pins.witness };
  const registry = QL244_SYSTEMS.map((system_id, i) => ({
    system_id, key_id: 'np-ql244-key-' + (i + 1),
    exchange_receipt_id: 'np-exchange-receipt-' + (i + 1),
    source_revision: i === 1 ? common.source_revision : String(i + 1).repeat(40),
    exchange_state: i < 2 ? 'NONPRODUCTION_METADATA_REVIEWED_HELD' : 'NOT_PROVISIONED_HELD',
    review_state: 'OWNER_APPROVAL_NOT_GIVEN_HELD'
  }));
  const assessorPayload = { schema_version: QL240_SCHEMA,
    issuer: 'rosevear-independent-handshake-assessor', kind: 'nonproduction_handshake_review',
    assessor_receipt_id: 'np-assessor-receipt-001', assessor_key_id: 'np-assessor-current',
    business_id: 'devilndove', tenant_id: null, environment: 'nonproduction',
    gateway_audit_id: audit.gateway_audit_id, identity_attestation_id: identity.attestation_id,
    health_receipt_id: common.health_receipt_id, capabilities_receipt_id: common.capabilities_receipt_id,
    source_revision: common.source_revision, ql243_report_sha256: ql244ReportDigest(ql243Report),
    credential_registry: registry, negative_test_results: Object.fromEntries(QL244_NEGATIVES.map(k => [k, true])),
    witnessed_at: now, expires_at: now + 300_000 };
  const ownerConditional = { schema_version: QL240_SCHEMA, issuer: 'rosevear-owner-review',
    kind: 'conditional_pilot_review', decision: 'REQUEST_CONDITIONAL_READ_ONLY_REVIEW',
    business_id: 'devilndove', tenant_id: null, environment: 'nonproduction',
    assessor_receipt_id: assessorPayload.assessor_receipt_id,
    identity_attestation_id: identity.attestation_id, gateway_audit_id: audit.gateway_audit_id,
    source_revision: common.source_revision, scope: ['read_product_reference', 'read_listing_reference'],
    rollback_receipt_id: ownerOld.rollback_receipt_id, owner_key_id: ownerOld.owner_key_id,
    issued_at: now, expires_at: now + 300_000 };
  const bundle = { ql243Bundle, ql243Report, assessorPublicKeyPem: pem(assessor),
    assessor: signed(assessorPayload, assessor.privateKey, p => ql244Canonical('assessor', p)),
    ownerDecision: signed(ownerConditional, owner.privateKey, p => ql244Canonical('owner', p)) };
  const signAssessor = b => {
    b.assessor.signature = sign(null, ql244Canonical('assessor', b.assessor.payload),
      assessor.privateKey).toString('base64url'); return b;
  };
  const signOwner = b => {
    b.ownerDecision.signature = sign(null, ql244Canonical('owner', b.ownerDecision.payload),
      owner.privateKey).toString('base64url'); return b;
  };
  return { bundle, pins, signAssessor, signOwner };
}

describe('QL-244 four pinned signatures, credential metadata and held pilot review', () => {
  it('validates two additional signatures and six registry rows but denies actual approval', () => {
    const f = rig(); const r = inspectQl244Packet(f.bundle, f.pins, now);
    assert.equal(r.release, QL244_RELEASE);
    assert.equal(r.status, 'TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD');
    assert.equal(r.assessorSignatureChecked, true);
    assert.equal(r.conditionalOwnerRequestSignatureChecked, true);
    assert.equal(r.credentialMetadata.length, 6);
    assert.equal(r.actualOwnerAuthorization, false);
    assert.equal(r.witnessedSourceIndependentlyConfirmed, false);
    assert.equal(r.credentialExchangeIndependentlyConfirmed, false);
    assert.equal(r.actualConnection, 'DISCONNECTED');
    assert.equal(r.realPilotHolds, 12);
    for (const k of ['actualWrites', 'calls', 'sms', 'providerDispatch']) assert.equal(r[k], 0);
  });
  it('denies missing, swapped, reused or forged assessor signature/pin', () => {
    const f = rig();
    assert.equal(inspectQl244Packet(f.bundle, { ...f.pins, assessor: f.pins.owner }, now).status, 'DENIED_PACKET');
    assert.equal(inspectQl244Packet(f.bundle, { ...f.pins, assessor: '0'.repeat(64) }, now).status, 'DENIED_ASSESSOR_SIGNATURE');
    const b = copy(f.bundle); b.assessor.signature = 'A'.repeat(86);
    assert.equal(inspectQl244Packet(b, f.pins, now).status, 'DENIED_ASSESSOR_SIGNATURE');
    assert.equal(inspectQl244Packet({ ...f.bundle, secret: 'wrong' }, f.pins, now).status, 'DENIED_PACKET');
  });
  it('denies forged QL-243 GET/authorization, changed source and extra data', () => {
    const f = rig();
    for (const edit of [{ actualOwnerAuthorization: true }, { connectionState: 'CONNECTED' },
      { getAttempts: 0 }, { gatewayAuditId: 'np-other-audit' }, { sourceRevision: 'b'.repeat(40) },
      { writeAttempts: 1 }, { token: 'private' }]) {
      const b = { ...f.bundle, ql243Report: { ...f.bundle.ql243Report, ...edit } };
      assert.equal(inspectQl244Packet(b, f.pins, now).status, 'DENIED_QL243_CHAIN');
    }
  });
  it('denies signed assessor record for wrong tenant, environment, digest or source', () => {
    const f = rig();
    for (const edit of [{ tenant_id: 'foreign' }, { business_id: 'yw' },
      { environment: 'production' }, { ql243_report_sha256: '0'.repeat(64) },
      { source_revision: 'f'.repeat(40) }]) {
      const b = copy(f.bundle); Object.assign(b.assessor.payload, edit); f.signAssessor(b);
      assert.equal(inspectQl244Packet(b, f.pins, now).status, 'DENIED_ASSESSOR_SCOPE');
    }
  });
  it('denies omitted/duplicate/reordered/approved per-app credential metadata', () => {
    const f = rig(); assert.equal(ql244ReviewRegistry(f.bundle.assessor.payload.credential_registry, 'a'.repeat(40)), true);
    for (const mutate of [
      r => r.pop(), r => { r[1].key_id = r[0].key_id; },
      r => { r[1].exchange_receipt_id = r[0].exchange_receipt_id; },
      r => { r[2].system_id = 'devilndove'; },
      r => { r[1].source_revision = 'f'.repeat(40); },
      r => { r[0].exchange_state = 'CONNECTED'; },
      r => { r[3].review_state = 'APPROVED'; }
    ]) {
      const b = copy(f.bundle); mutate(b.assessor.payload.credential_registry); f.signAssessor(b);
      assert.equal(inspectQl244Packet(b, f.pins, now).status, 'DENIED_ASSESSOR_SCOPE');
    }
  });
  it('denies false denials, stale evidence or expired assessor', () => {
    const f = rig();
    for (const edit of [
      { negative_test_results: { ...f.bundle.assessor.payload.negative_test_results, cross_tenant_denied: false } },
      { witnessed_at: now - 500_000 }, { witnessed_at: now + 500_000 },
      { expires_at: now - 1 }, { expires_at: now + 3_600_001 }
    ]) {
      const b = copy(f.bundle); Object.assign(b.assessor.payload, edit); f.signAssessor(b);
      assert.equal(inspectQl244Packet(b, f.pins, now).status, 'DENIED_ASSESSOR_SCOPE');
    }
  });
  it('denies a separately signed OWNER approval, foreign scope or altered rollback', () => {
    const f = rig();
    for (const edit of [{ decision: 'APPROVE_CONNECT' }, { decision: 'SEND_SMS' },
      { scope: ['read_product_reference', 'send_sms'] }, { rollback_receipt_id: 'np-other-receipt' },
      { assessor_receipt_id: 'np-other-assessor' }, { environment: 'production' },
      { issuer: 'foreign-owner' }, { expires_at: now - 1 }]) {
      const b = copy(f.bundle); Object.assign(b.ownerDecision.payload, edit); f.signOwner(b);
      assert.equal(inspectQl244Packet(b, f.pins, now).status, 'DENIED_OWNER_SCOPE');
    }
  });
  it('denies bad conditional owner signature and mismatched owner key', () => {
    const f = rig(); const b = copy(f.bundle);
    b.ownerDecision.signature = 'A'.repeat(86);
    assert.equal(inspectQl244Packet(b, f.pins, now).status, 'DENIED_OWNER_SIGNATURE');
    const c = copy(f.bundle); c.ql243Bundle.ql242.ownerPublicKeyPem = c.ql243Bundle.ql242.gatewayPublicKeyPem;
    assert.equal(inspectQl244Packet(c, f.pins, now).status, 'DENIED_QL243_CHAIN');
  });
  it('hashes all security-relevant fields, excluding only free-form narrative', () => {
    const f = rig(), good = ql244ReportDigest(f.bundle.ql243Report);
    assert.equal(good, f.bundle.assessor.payload.ql243_report_sha256);
    assert.notEqual(ql244ReportDigest({ ...f.bundle.ql243Report, getAttempts: 3 }), good);
    assert.equal(ql244ReportDigest({ ...f.bundle.ql243Report, reason: 'changed text' }), good);
    assert.throws(() => ql244ReportDigest({ ...f.bundle.ql243Report, secret: 'bad' }));
    assert.throws(() => ql244Canonical('owner', { secret: true }));
  });
});
