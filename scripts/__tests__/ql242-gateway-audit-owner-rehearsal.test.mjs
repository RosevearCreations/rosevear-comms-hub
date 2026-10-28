import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { QL240_SCHEMA } from '../ql240-nonproduction-receipt-verifier.mjs';
import { ql241PublicKeyFingerprint } from '../ql241-external-gateway-retrieval.mjs';
import { QL242_RELEASE, ql242Canonical, inspectQl242Packet, createQl242AuditInspector,
  createQl242Rehearsal, ql242CompanyGate } from '../ql242-gateway-audit-owner-rehearsal.mjs';

const now = 1_790_000_000_000;

function rig(auditChange = {}, ownerChange = {}) {
  const gatewayKeys = generateKeyPairSync('ed25519');
  const ownerKeys = generateKeyPairSync('ed25519');
  const gatewayPublicKeyPem = gatewayKeys.publicKey.export({ type: 'spki', format: 'pem' });
  const ownerPublicKeyPem = ownerKeys.publicKey.export({ type: 'spki', format: 'pem' });
  const gatewayPin = ql241PublicKeyFingerprint(gatewayPublicKeyPem);
  const ownerPin = ql241PublicKeyFingerprint(ownerPublicKeyPem);
  const common = {
    schema_version: QL240_SCHEMA, business_id: 'devilndove', tenant_id: null,
    environment: 'nonproduction', health_receipt_id: 'np-devilndove-health-001',
    capabilities_receipt_id: 'np-devilndove-caps-001',
    source_revision: 'a'.repeat(40)
  };
  const auditPayload = {
    ...common, issuer: 'ai-data-platform', kind: 'gateway_audit', method: 'GET',
    connection_status: 'HOLD', gateway_audit_id: 'np-devilndove-audit-001',
    gateway_key_id: 'np-devilndove-current', nonce: 'np-gateway-audit-nonce-001',
    issued_at: now, negative_test_results: {
      wrong_business_denied: true, wrong_tenant_denied: true, revoked_key_denied: true,
      write_denied: true, replay_denied: true
    }, ...auditChange
  };
  const ownerPayload = {
    ...common, issuer: 'rosevear-owner-review', kind: 'pilot_decision',
    decision: 'REQUEST_READ_ONLY_REHEARSAL',
    scope: ['read_product_reference', 'read_listing_reference'],
    gateway_audit_id: 'np-devilndove-audit-001',
    rollback_receipt_id: 'np-devilndove-rollback-001', owner_key_id: 'np-owner-review-current',
    nonce: 'np-owner-nonce-001', issued_at: now, expires_at: now + 300_000, ...ownerChange
  };
  const audit = { payload: auditPayload, signature: sign(null, ql242Canonical('audit', auditPayload), gatewayKeys.privateKey).toString('base64url') };
  const owner = { payload: ownerPayload, signature: sign(null, ql242Canonical('owner', ownerPayload), ownerKeys.privateKey).toString('base64url') };
  const packet = {
    company: 'devilndove', tenantId: null, healthReceiptId: common.health_receipt_id,
    capabilitiesReceiptId: common.capabilities_receipt_id,
    gatewayAuditId: auditPayload.gateway_audit_id, sourceRevision: common.source_revision,
    gatewayKeyId: auditPayload.gateway_key_id, ownerKeyId: ownerPayload.owner_key_id,
    gatewayPublicKeyPem, ownerPublicKeyPem, audit, owner
  };
  return { packet, gatewayPin, ownerPin };
}

describe('QL-242 separate pinned gateway audit / owner decision signatures', () => {
  it('compares two independently pinned signatures but never grants real approval or connectivity', () => {
    const x = rig();
    const outcome = inspectQl242Packet(x.packet, x.gatewayPin, x.ownerPin, now);
    assert.equal(outcome.release, QL242_RELEASE);
    assert.equal(outcome.status, 'DUAL_SIGNATURES_CHECKED_HELD');
    assert.equal(outcome.signedAuditCompared, true);
    assert.equal(outcome.signedOwnerDecisionCompared, true);
    assert.equal(outcome.independentlyWitnessedProvenance, false);
    assert.equal(outcome.ownerIdentityVerified, false);
    assert.equal(outcome.actualOwnerAuthorization, false);
    assert.equal(outcome.realGatewayConnection, 'DISCONNECTED');
    assert.equal(outcome.realPilotHolds, 12);
    assert.equal(outcome.rollbackReceiptId, 'np-devilndove-rollback-001');
    for (const key of ['externalRequests', 'externalWrites', 'liveCalls', 'liveSms', 'providerDispatch']) assert.equal(outcome[key], 0);
  });

  it('denies unpinned, swapped and same owner/gateway keys', () => {
    const x = rig();
    assert.equal(inspectQl242Packet(x.packet, '0'.repeat(64), x.ownerPin, now).status, 'DENIED_PIN');
    assert.equal(inspectQl242Packet(x.packet, x.ownerPin, x.gatewayPin, now).status, 'DENIED_PIN');
    assert.equal(inspectQl242Packet(x.packet, x.gatewayPin, x.gatewayPin, now).status, 'DENIED_PIN');
    const same = { ...x.packet, ownerPublicKeyPem: x.packet.gatewayPublicKeyPem };
    assert.equal(inspectQl242Packet(same, x.gatewayPin, x.gatewayPin, now).status, 'DENIED_PIN');
  });

  it('rejects tampering, expanded personal/private fields and broken signature source links', () => {
    const x = rig();
    assert.equal(inspectQl242Packet({ ...x.packet, token: 'secret' }, x.gatewayPin, x.ownerPin, now).status, 'DENIED_PACKET');
    assert.equal(inspectQl242Packet({ ...x.packet, audit: { ...x.packet.audit, signature: 'A'.repeat(86) } }, x.gatewayPin, x.ownerPin, now).status, 'DENIED_AUDIT_SIGNATURE');
    assert.equal(inspectQl242Packet({ ...x.packet, owner: { ...x.packet.owner, signature: 'A'.repeat(86) } }, x.gatewayPin, x.ownerPin, now).status, 'DENIED_OWNER_SIGNATURE');
    assert.equal(inspectQl242Packet({ ...x.packet, gatewayAuditId: 'np-wrong-audit-id' }, x.gatewayPin, x.ownerPin, now).status, 'DENIED_AUDIT_SCOPE');
    assert.equal(inspectQl242Packet({ ...x.packet, sourceRevision: 'b'.repeat(40) }, x.gatewayPin, x.ownerPin, now).status, 'DENIED_AUDIT_SCOPE');
    assert.throws(() => ql242Canonical('owner', { secret: true }), TypeError);
  });

  it('denies gateway write methods, false negative tests, wrong company/tenant and stale audit', () => {
    for (const changes of [
      { method: 'POST' }, { business_id: 'yw' }, { tenant_id: 'foreign-company' },
      { environment: 'production' }, { connection_status: 'CONNECTED' },
      { negative_test_results: { wrong_business_denied: true, wrong_tenant_denied: true,
        revoked_key_denied: false, write_denied: true, replay_denied: true } },
      { issued_at: now - 400_000 }
    ]) {
      const x = rig(changes);
      assert.equal(inspectQl242Packet(x.packet, x.gatewayPin, x.ownerPin, now).status, 'DENIED_AUDIT_SCOPE');
    }
  });

  it('denies forged owner authorization, unexpected scope, expired owner receipt and mismatched audit', () => {
    for (const changes of [
      { decision: 'AUTHORIZE_LIVE_DISPATCH' }, { decision: 'APPROVE' },
      { scope: ['send_sms', 'read_listing_reference'] },
      { scope: ['read_product_reference', 'read_product_reference'] },
      { environment: 'production' }, { business_id: 'icamp' },
      { gateway_audit_id: 'np-different-audit-001' },
      { rollback_receipt_id: '' }, { expires_at: now - 1 },
      { expires_at: now + 3_600_001 }
    ]) {
      const x = rig({}, changes);
      assert.equal(inspectQl242Packet(x.packet, x.gatewayPin, x.ownerPin, now).status, 'DENIED_OWNER_SCOPE');
    }
  });

  it('blocks replay in one isolated verifier session, never claims durable gateway replay suppression', () => {
    const x = rig();
    const verifier = createQl242AuditInspector();
    assert.equal(verifier.inspect(x.packet, x.gatewayPin, x.ownerPin, now).status, 'DUAL_SIGNATURES_CHECKED_HELD');
    assert.equal(verifier.inspect(x.packet, x.gatewayPin, x.ownerPin, now).status, 'DENIED_REPLAY');
    const another = rig();
    assert.equal(verifier.inspect(another.packet, another.gatewayPin, another.ownerPin, now).status, 'DENIED_REPLAY');
  });

  it('only rehearses and rolls back an isolated read-only state; denies out-of-order actions', () => {
    const x = rig();
    const good = inspectQl242Packet(x.packet, x.gatewayPin, x.ownerPin, now);
    const run = createQl242Rehearsal(good);
    assert.equal(run.transition('rehearse').transitionAccepted, false);
    assert.equal(run.transition('prepare').state, 'REVIEW_PREPARED_HELD');
    const simulated = run.transition('rehearse');
    assert.equal(simulated.state, 'SIMULATED_READ_ONLY_HELD');
    assert.equal(simulated.rollbackAvailable, true);
    assert.equal(simulated.actualConnection, 'DISCONNECTED');
    assert.equal(run.transition('rehearse').transitionAccepted, false);
    const restored = run.transition('rollback');
    assert.equal(restored.state, 'ROLLED_BACK_HELD');
    assert.equal(restored.rollbackAvailable, false);
    assert.equal(restored.actualConnection, 'DISCONNECTED');
    assert.equal(restored.externalWrites, 0);
    assert.equal(run.transition('rollback').transitionAccepted, false);
    const denied = createQl242Rehearsal(inspectQl242Packet(x.packet, '0'.repeat(64), x.ownerPin, now));
    assert.equal(denied.transition('prepare').transitionAccepted, false);
    for (const company of ['rosiedazzlers', 'devilndove', 'icamp', 'yw']) {
      const state = ql242CompanyGate(company);
      assert.equal(state.actualConnection, 'DISCONNECTED');
      assert.equal(state.realPilotHolds, 12);
      assert.equal(state.eligibleForActualRelease, false);
      assert.equal(state.rehearsalAllowed, company === 'devilndove');
    }
  });
});
