import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, generateKeyPairSync, sign } from 'node:crypto';
import { QL240_PATHS, QL240_SCHEMA, ql240CanonicalReceipt } from '../ql240-nonproduction-receipt-verifier.mjs';
import { ql241PublicKeyFingerprint } from '../ql241-external-gateway-retrieval.mjs';
import { ql242Canonical } from '../ql242-gateway-audit-owner-rehearsal.mjs';
import { QL243_RELEASE, QL243_AUDIT_PATH, ql243CanonicalIdentity, ql243CanonicalGet,
  ql243SignedGetHeaders, inspectQl243Identity, testQl243NonproductionConnection
} from '../ql243-secure-gateway-connection.mjs';

const now = 1_790_000_000_000;
const key = Buffer.alloc(32, 0xa6);
function fixture(identityChange = {}, auditChange = {}, ownerChange = {}) {
  const gateway = generateKeyPairSync('ed25519');
  const owner = generateKeyPairSync('ed25519');
  const witness = generateKeyPairSync('ed25519');
  const pem = k => k.publicKey.export({ type: 'spki', format: 'pem' });
  const pins = { gateway: ql241PublicKeyFingerprint(pem(gateway)),
    owner: ql241PublicKeyFingerprint(pem(owner)), witness: ql241PublicKeyFingerprint(pem(witness)) };
  const common = { schema_version: QL240_SCHEMA, business_id: 'devilndove', tenant_id: null,
    environment: 'nonproduction', health_receipt_id: 'np-devilndove-health-001',
    capabilities_receipt_id: 'np-devilndove-caps-001', source_revision: 'a'.repeat(40) };
  const auditPayload = { ...common, issuer: 'ai-data-platform', kind: 'gateway_audit',
    method: 'GET', connection_status: 'HOLD', gateway_audit_id: 'np-devilndove-audit-001',
    gateway_key_id: 'np-devilndove-current', nonce: 'np-gateway-audit-nonce-001', issued_at: now,
    negative_test_results: { wrong_business_denied: true, wrong_tenant_denied: true,
      revoked_key_denied: true, write_denied: true, replay_denied: true }, ...auditChange };
  const ownerPayload = { ...common, issuer: 'rosevear-owner-review', kind: 'pilot_decision',
    decision: 'REQUEST_READ_ONLY_REHEARSAL', scope: ['read_product_reference', 'read_listing_reference'],
    gateway_audit_id: 'np-devilndove-audit-001', rollback_receipt_id: 'np-devilndove-rollback-001',
    owner_key_id: 'np-owner-review-current', nonce: 'np-owner-nonce-001', issued_at: now,
    expires_at: now + 300_000, ...ownerChange };
  const signed = (p, priv, kind) => ({ payload: p,
    signature: sign(null, ql242Canonical(kind, p), priv).toString('base64url') });
  const ql242 = { company: 'devilndove', tenantId: null,
    healthReceiptId: common.health_receipt_id, capabilitiesReceiptId: common.capabilities_receipt_id,
    gatewayAuditId: auditPayload.gateway_audit_id, sourceRevision: common.source_revision,
    gatewayKeyId: auditPayload.gateway_key_id, ownerKeyId: ownerPayload.owner_key_id,
    gatewayPublicKeyPem: pem(gateway), ownerPublicKeyPem: pem(owner),
    audit: signed(auditPayload, gateway.privateKey, 'audit'),
    owner: signed(ownerPayload, owner.privateKey, 'owner') };
  const attestation = { schema_version: QL240_SCHEMA, issuer: 'rosevear-independent-identity-witness',
    attestation_id: 'np-identity-attestation-001', identity_ref: 'np-owner-ref-001',
    method: 'separate_authenticated_channel_challenge', business_id: 'devilndove', tenant_id: null,
    environment: 'nonproduction', owner_key_fingerprint_sha256: pins.owner,
    gateway_audit_id: ql242.gatewayAuditId, health_receipt_id: ql242.healthReceiptId,
    capabilities_receipt_id: ql242.capabilitiesReceiptId, source_revision: ql242.sourceRevision,
    scope: ['read_product_reference', 'read_listing_reference'],
    witnessed_at: now, expires_at: now + 300_000, ...identityChange };
  const bundle = { ql242, identity: { witnessPublicKeyPem: pem(witness), envelope: { payload: attestation,
    signature: sign(null, ql243CanonicalIdentity(attestation), witness.privateKey).toString('base64url') } } };
  const config = { company: 'devilndove', tenantId: null, origin: 'https://gateway.rosevear.example.com',
    keyId: ql242.gatewayKeyId, healthReceiptId: ql242.healthReceiptId,
    capabilitiesReceiptId: ql242.capabilitiesReceiptId, gatewayAuditId: ql242.gatewayAuditId,
    sourceRevision: ql242.sourceRevision };
  function receipt(kind, edits = {}) {
    const p = { schema_version: QL240_SCHEMA, gateway_id: 'ai-data-platform', business_id: 'devilndove',
      tenant_id: null, environment: 'nonproduction', kind, method: 'GET', path: QL240_PATHS[kind],
      connection_status: 'HOLD', capabilities: kind === 'health' ? [] : ['read_product_reference', 'read_listing_reference'],
      receipt_id: kind === 'health' ? ql242.healthReceiptId : ql242.capabilitiesReceiptId,
      nonce: kind === 'health' ? 'np-health-nonce-001' : 'np-capabilities-nonce-001',
      issued_at: now, key_id: config.keyId, ...edits };
    return { payload: p, signature: sign(null, ql240CanonicalReceipt(p), gateway.privateKey).toString('base64url') };
  }
  return { bundle, pins, config, receipt };
}

const response = (body, init = {}) => new Response(JSON.stringify(body), {
  status: init.status ?? 200,
  headers: { 'content-type': init.contentType ?? 'application/json' }
});

function adapter(f, mutate = () => {}) {
  const observed = [];
  const fetchImpl = async (url, opts) => {
    observed.push({ url, opts });
    if (url.endsWith(QL240_PATHS.health)) return response(f.receipt('health'));
    if (url.endsWith(QL240_PATHS.capabilities)) return response(f.receipt('capabilities'));
    if (url.endsWith(`${QL243_AUDIT_PATH}${f.config.gatewayAuditId}`)) return response(mutate(f.bundle.ql242.audit, observed.length));
    throw new Error('unapproved route');
  };
  return { fetchImpl, observed };
}

describe('QL-243 independently pinned identity claim (not actual owner approval)', () => {
  it('matches 3 independent signatures and fixed chain, but never calls it authorization', () => {
    const f = fixture(); const r = inspectQl243Identity(f.bundle, f.pins, now);
    assert.equal(r.release, QL243_RELEASE);
    assert.equal(r.status, 'IDENTITY_WITNESS_SIGNATURE_CHECKED_HELD');
    assert.equal(r.ownerIdentityClaimSignatureChecked, true);
    assert.equal(r.ownerIdentityIndependentlyConfirmed, false);
    assert.equal(r.gatewayAuditDurabilityIndependentlyConfirmed, false);
    assert.equal(r.actualOwnerAuthorization, false);
    assert.equal(r.connectionState, 'DISCONNECTED');
    assert.equal(r.realPilotHolds, 12);
  });
  it('rejects wrong pins, swapped witness key, same owner and witness and untrusted signature', () => {
    const f = fixture();
    assert.equal(inspectQl243Identity(f.bundle, { ...f.pins, witness: '0'.repeat(64) }, now).status, 'DENIED_WITNESS_SIGNATURE');
    assert.equal(inspectQl243Identity(f.bundle, { ...f.pins, witness: f.pins.owner }, now).status, 'DENIED_INPUT');
    assert.equal(inspectQl243Identity(f.bundle, { ...f.pins, owner: f.pins.gateway }, now).status, 'DENIED_INPUT');
    assert.equal(inspectQl243Identity({ ...f.bundle, identity: { ...f.bundle.identity,
      envelope: { ...f.bundle.identity.envelope, signature: 'A'.repeat(86) } } }, f.pins, now).status, 'DENIED_WITNESS_SIGNATURE');
  });
  it('rejects stale, foreign, off-scope and self-declared identity claims', () => {
    for (const change of [
      { expires_at: now - 1 }, { witnessed_at: now - 86_400_001 },
      { business_id: 'icamp' }, { tenant_id: 'other' },
      { source_revision: 'b'.repeat(40) }, { owner_key_fingerprint_sha256: '1'.repeat(64) },
      { method: 'self_signed_owner_approval' }, { environment: 'production' },
      { scope: ['send_sms', 'read_listing_reference'] },
      { gateway_audit_id: 'np-not-the-gateway-audit' }
    ]) {
      const f = fixture(change);
      assert.equal(inspectQl243Identity(f.bundle, f.pins, now).status, 'DENIED_WITNESS_SCOPE');
    }
  });
  it('rejects wrong upstream audit, owner and appended credentials', () => {
    const f = fixture({}, { method: 'POST' });
    assert.equal(inspectQl243Identity(f.bundle, f.pins, now).status, 'DENIED_UPSTREAM');
    const g = fixture({}, {}, { decision: 'APPROVE_PILOT' });
    assert.equal(inspectQl243Identity(g.bundle, g.pins, now).status, 'DENIED_UPSTREAM');
    const h = fixture();
    assert.equal(inspectQl243Identity({ ...h.bundle, token: 'do-not-paste' }, h.pins, now).status, 'DENIED_INPUT');
  });
});

describe('QL-243 opt-in server-side authenticated nonproduction GET probes', () => {
  it('uses exactly four signed GETs, unique nonces and the HMAC canonical contract; remains HELD', async () => {
    const f = fixture(); const a = adapter(f, audit => audit);
    const r = await testQl243NonproductionConnection(f.bundle, f.pins, f.config, key, { now, fetchImpl: a.fetchImpl });
    assert.equal(r.status, 'AUTHENTICATED_FOUR_GETS_CHECKED_HELD');
    assert.equal(r.getAttempts, 4); assert.equal(a.observed.length, 4);
    assert.equal(r.gatewayAuditGetChecked, true); assert.equal(r.gatewayAuditDurabilityIndependentlyConfirmed, false);
    assert.equal(r.actualOwnerAuthorization, false); assert.equal(r.writeAttempts, 0);
    assert.equal(r.connectionState, 'DISCONNECTED'); assert.equal(r.realPilotHolds, 12);
    const nonces = new Set();
    for (const { url, opts } of a.observed) {
      assert.equal(opts.method, 'GET'); assert.equal(opts.redirect, 'manual');
      assert.equal(opts.credentials, 'omit'); assert.equal(opts.cache, 'no-store');
      assert.equal(opts.headers['X-Rosevear-Environment'], 'nonproduction');
      const nonce = opts.headers['X-Rosevear-Nonce']; nonces.add(nonce);
      const expected = createHmac('sha256', key).update(ql243CanonicalGet({
        path: new URL(url).pathname, timestamp: now, nonce, keyId: f.config.keyId
      })).digest('base64url');
      assert.equal(opts.headers['X-Rosevear-Signature'], expected);
    }
    assert.equal(nonces.size, 4);
  });
  it('fails closed without test key, exact gateway scope or independently pinned identity', async () => {
    const f = fixture(); let calls = 0;
    const fetchImpl = async () => { calls++; throw new Error('not expected'); };
    assert.equal((await testQl243NonproductionConnection(f.bundle, f.pins, f.config, Buffer.alloc(16), { now, fetchImpl })).status, 'DENIED_CONNECTION_CONFIG');
    assert.equal((await testQl243NonproductionConnection(f.bundle, f.pins, { ...f.config, origin: 'http://localhost:3000' }, key, { now, fetchImpl })).status, 'DENIED_CONNECTION_CONFIG');
    assert.equal((await testQl243NonproductionConnection(f.bundle, f.pins, { ...f.config, company: 'yw', tenantId: 'cross-tenant' }, key, { now, fetchImpl })).status, 'DENIED_CONNECTION_CONFIG');
    assert.equal((await testQl243NonproductionConnection(f.bundle, { ...f.pins, witness: '0'.repeat(64) }, f.config, key, { now, fetchImpl })).status, 'DENIED_WITNESS_SIGNATURE');
    assert.equal(calls, 0);
  });
  it('denies changed audit across the two GET reads', async () => {
    const f = fixture(); const a = adapter(f, (audit, count) => count === 4 ? { ...audit, signature: 'A'.repeat(86) } : audit);
    const r = await testQl243NonproductionConnection(f.bundle, f.pins, f.config, key, { now, fetchImpl: a.fetchImpl });
    assert.equal(r.status, 'DENIED_AUDIT_GET'); assert.equal(r.getAttempts, 4);
  });
  it('denies unsigned, stale, foreign tenant, HTTP redirect and overlarge health/capabilities', async () => {
    const f = fixture();
    for (const fetchImpl of [
      async () => new Response('redirect', { status: 302, headers: { location: 'https://other.example.com' } }),
      async () => new Response(JSON.stringify(f.receipt('health')), { status: 200, headers: { 'content-type': 'text/plain' } }),
      async () => new Response('x'.repeat(20_000), { status: 200, headers: { 'content-type': 'application/json' } }),
      async () => response({ ...f.receipt('health'), signature: 'A'.repeat(86) }),
      async () => response(f.receipt('health', { tenant_id: 'other-tenant' }))
    ]) {
      const r = await testQl243NonproductionConnection(f.bundle, f.pins, f.config, key, { now, fetchImpl });
      assert.equal(r.status, 'DENIED_SIGNED_GET_PAIR'); assert.equal(r.getAttempts, 1);
    }
  });
  it('denies missing/rejected audit proof and never turns it into a release grant', async () => {
    const f = fixture(); let requests = 0;
    const fetchImpl = async (url) => {
      requests++;
      if (url.endsWith(QL240_PATHS.health)) return response(f.receipt('health'));
      if (url.endsWith(QL240_PATHS.capabilities)) return response(f.receipt('capabilities'));
      return new Response('not found', { status: 404 });
    };
    const r = await testQl243NonproductionConnection(f.bundle, f.pins, f.config, key, { now, fetchImpl });
    assert.equal(r.status, 'DENIED_AUDIT_GET'); assert.equal(requests, 3);
    assert.equal(r.actualOwnerAuthorization, false); assert.equal(r.connectionState, 'DISCONNECTED');
  });
  it('refuses request signing for mutating route, invalid nonce or invalid server secret', () => {
    const f = fixture();
    for (const path of ['/api/integration/v1/commands', '/api/integration/v1/events',
      '/api/integration/v1/health?expand=1', '/api/integration/v1/audit/receipts/not-valid']) {
      assert.throws(() => ql243CanonicalGet({ path, timestamp: now,
        nonce: 'np-valid-nonce-123', keyId: f.config.keyId }));
    }
    assert.throws(() => ql243SignedGetHeaders(QL240_PATHS.health, f.config.keyId, Buffer.alloc(16), now, 'np-valid-nonce-123'));
    assert.throws(() => ql243SignedGetHeaders(QL240_PATHS.health, f.config.keyId, key, now, 'nonce-short'));
  });
});
