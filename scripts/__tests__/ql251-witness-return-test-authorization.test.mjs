import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { ql250ChallengeBytes } from '../ql250-pin-custody-window-witness.mjs';
import { inspectQl251WitnessReturn, inspectQl251TestAuthorizationRequest,
  inspectQl251LinkedReview,
  ql251CustodyResponseDigest, ql251WitnessBytes, ql251TestRequestBytes }
  from '../ql251-witness-return-test-authorization.mjs';

const NOW = Date.UTC(2026, 9, 28, 21, 0, 0);
const hash = v => createHash('sha256').update(v).digest('hex');
function setup(i = 0) {
  const s = QL247_SOURCES[i];
  const custodyKeys = generateKeyPairSync('ed25519');
  const witnessKeys = generateKeyPairSync('ed25519');
  const requestKeys = generateKeyPairSync('ed25519');
  const businessId = s.system === 'ai-data-platform' ? 'devilndove' : s.system;
  const tenantId = ['yw', 'icamp'].includes(s.system) ? `np-ql251-tenant-${i}` : null;
  const custodyPin = { system: s.system,
    spkiSha256: hash(custodyKeys.publicKey.export({ type: 'spki', format: 'der' })),
    custodyReference: `np-ql251-custody-${i}` };
  const challenge = { schemaVersion: 'rosevear.ql250.challenge.v1',
    system: s.system, repository: s.repository, businessId, tenantId,
    sourceSha: String(i + 1).repeat(40), proofSha: String.fromCharCode(97 + i).repeat(40),
    pinnedSpkiSha256: custodyPin.spkiSha256, challengeId: `np-ql251-custody-${i}`,
    nonceBase64Url: randomBytes(32).toString('base64url'),
    issuedAtMs: NOW - 1_000, expiresAtMs: NOW + 120_000 };
  const custodyResponse = { challengeId: challenge.challengeId,
    publicKeyPem: custodyKeys.publicKey.export({ type: 'spki', format: 'pem' }),
    signatureBase64Url: sign(null, ql250ChallengeBytes(challenge),
      custodyKeys.privateKey).toString('base64url') };
  const witnessPayload = { schemaVersion: 'rosevear.ql251.witness.v1',
    system: s.system, businessId, tenantId, sourceSha: challenge.sourceSha,
    proofSha: challenge.proofSha, custodyChallengeId: challenge.challengeId,
    custodyResponseSha256: ql251CustodyResponseDigest(custodyResponse),
    custodyPublicSpkiSha256: custodyPin.spkiSha256,
    witnessReceiptId: `np-ql251-witness-${i}`, witnessedAtMs: NOW - 100,
    observation: 'OBSERVED_OFFLINE_KEY_CONTROL_ONLY' };
  const signedWitness = { payload: witnessPayload,
    publicKeyPem: witnessKeys.publicKey.export({ type: 'spki', format: 'pem' }),
    signatureBase64Url: sign(null, ql251WitnessBytes(witnessPayload),
      witnessKeys.privateKey).toString('base64url') };
  const witnessPin = { system: s.system,
    spkiSha256: hash(witnessKeys.publicKey.export({ type: 'spki', format: 'der' })),
    provenanceReceiptId: `np-ql251-witness-pin-${i}` };
  const windowProposal = { schemaVersion: 'rosevear.ql250.window.v1',
    system: s.system, businessId, tenantId, environment: 'nonproduction',
    methods: ['GET'], paths: ['/api/integration/v1/health', '/api/integration/v1/capabilities'],
    startUtc: new Date(NOW + 3_600_000).toISOString(),
    endUtc: new Date(NOW + 4_200_000).toISOString(),
    ownerTestApprovalReceiptId: null, gatewayKeyId: null };
  const requestPayload = { schemaVersion: 'rosevear.ql251.test-request.v1',
    system: s.system, businessId, tenantId, sourceSha: challenge.sourceSha,
    proofSha: challenge.proofSha, witnessReceiptId: witnessPayload.witnessReceiptId,
    testRequestId: `np-ql251-test-request-${i}`, environment: 'nonproduction',
    methods: ['GET'], paths: [...windowProposal.paths],
    startUtc: windowProposal.startUtc, endUtc: windowProposal.endUtc,
    decision: 'REQUEST_INDEPENDENT_OWNER_TEST_REVIEW_ONLY',
    issuedAtMs: NOW - 1_000, expiresAtMs: NOW + 120_000 };
  const signedRequest = { payload: requestPayload,
    publicKeyPem: requestKeys.publicKey.export({ type: 'spki', format: 'pem' }),
    signatureBase64Url: sign(null, ql251TestRequestBytes(requestPayload),
      requestKeys.privateKey).toString('base64url') };
  const requestPin = { system: s.system,
    spkiSha256: hash(requestKeys.publicKey.export({ type: 'spki', format: 'der' })),
    provenanceReceiptId: `np-ql251-request-pin-${i}` };
  return { witness: { challenge, custodyResponse, custodyPin, signedWitness, witnessPin },
    testRequest: { windowProposal, signedRequest, requestPin } };
}

test('QL251 matches six synthetic signed witness claims but never establishes real independent key custody', () => {
  for (let i = 0; i < 6; i++) {
    const x = setup(i);
    const r = inspectQl251WitnessReturn(x.witness, { now: NOW });
    assert.equal(r.status, 'WITNESS_SIGNATURE_MATCHED_REAL_WORLD_PROVENANCE_UNVERIFIED_HELD');
    assert.equal(r.witnessedIndependentCustodians, 0);
    assert.equal(r.realGatewayGets, 0);
    assert.equal(r.ownerTestAuthorization, 'NOT_GIVEN');
    assert.equal(r.connectionState, 'DISCONNECTED');
    assert.equal(r.realPilotHolds, 12);
    for (const k of ['writes', 'calls', 'sms', 'dispatch']) assert.equal(r[k], 0);
  }
});

test('QL251 refuses a reused/expired upstream challenge, swapped source or tenant and altered custody response', () => {
  const x = setup(3);
  assert.equal(inspectQl251WitnessReturn(x.witness,
    { now: NOW, consumedChallengeIds: [x.witness.challenge.challengeId] }).status,
  'DENIED_UPSTREAM_CUSTODY_CHALLENGE');
  assert.equal(inspectQl251WitnessReturn(x.witness,
    { now: NOW + 400_000 }).status, 'DENIED_UPSTREAM_CUSTODY_CHALLENGE');
  for (const mutate of [
    p => { p.tenantId = 'np-wrong-tenant'; },
    p => { p.sourceSha = 'f'.repeat(40); },
    p => { p.observation = 'OWNER_APPROVED_GATEWAY_TEST'; },
    p => { p.witnessedAtMs = NOW + 80_000; },
    p => { p.custodyResponseSha256 = 'f'.repeat(64); }
  ]) {
    const copy = structuredClone(x.witness);
    mutate(copy.signedWitness.payload);
    assert.equal(inspectQl251WitnessReturn(copy, { now: NOW }).status,
      'DENIED_WITNESS_SCOPE_OR_FRESHNESS');
  }
  const changed = structuredClone(x.witness);
  changed.custodyResponse.signatureBase64Url = 'a'.repeat(86);
  assert.equal(inspectQl251WitnessReturn(changed, { now: NOW }).status,
    'DENIED_UPSTREAM_CUSTODY_CHALLENGE');
});

test('QL251 denies forged independent witness signatures, signer reuse or untrusted public pins', () => {
  const x = setup(1);
  const tamper = structuredClone(x.witness);
  tamper.signedWitness.signatureBase64Url = 'a'.repeat(86);
  assert.equal(inspectQl251WitnessReturn(tamper, { now: NOW }).status,
    'DENIED_WITNESS_SIGNATURE_OR_PIN');
  const reuse = structuredClone(x.witness);
  reuse.witnessPin.spkiSha256 = reuse.custodyPin.spkiSha256;
  assert.equal(inspectQl251WitnessReturn(reuse, { now: NOW }).status,
    'DENIED_WITNESS_SCOPE_OR_FRESHNESS');
  const extra = structuredClone(x.witness);
  extra.secret = 'must not be accepted';
  assert.equal(inspectQl251WitnessReturn(extra, { now: NOW }).status, 'DENIED_WITNESS_INPUT');
});

test('QL251 matches review-request signatures for all six but never converts requests into actual owner permission', () => {
  for (let i = 0; i < 6; i++) {
    const x = setup(i);
    const r = inspectQl251TestAuthorizationRequest(x.testRequest, { now: NOW });
    assert.equal(r.status, 'TEST_REVIEW_REQUEST_SIGNATURE_MATCHED_OWNER_AUTHORIZATION_NOT_GIVEN_HELD');
    assert.equal(r.authenticatedOwnerTestDecisions, 0);
    assert.equal(r.scheduledGetWindows, 0);
    assert.equal(r.realGatewayGets, 0);
    assert.equal(r.ownerTestAuthorization, 'NOT_GIVEN');
    assert.equal(r.ownerPilotAuthorization, 'NOT_GIVEN');
  }
});

test('QL251 rejects falsified owner approval, real writes, foreign endpoints, stale requests and forged signatures', () => {
  const x = setup(4);
  for (const modify of [
    p => { p.decision = 'APPROVED'; },
    p => { p.methods = ['POST']; },
    p => { p.paths = ['/api/internal/gates/open']; },
    p => { p.tenantId = 'np-foreign-tenant'; },
    p => { p.expiresAtMs = NOW - 1; },
    p => { p.system = 'devilndove'; }
  ]) {
    const packet = structuredClone(x.testRequest);
    modify(packet.signedRequest.payload);
    assert.equal(inspectQl251TestAuthorizationRequest(packet, { now: NOW }).status,
      'DENIED_TEST_REQUEST_SCOPE');
  }
  const forged = structuredClone(x.testRequest);
  forged.signedRequest.signatureBase64Url = 'b'.repeat(86);
  assert.equal(inspectQl251TestAuthorizationRequest(forged, { now: NOW }).status,
    'DENIED_TEST_REQUEST_SIGNATURE_OR_PIN');
  const forbidden = structuredClone(x.testRequest);
  forbidden.windowProposal.paths = ['https://192.168.0.1/private'];
  assert.equal(inspectQl251TestAuthorizationRequest(forbidden, { now: NOW }).status,
    'DENIED_UPSTREAM_WINDOW_SCOPE');
});

test('QL251 reconciles witness and owner-test request to the same signed app/tenant/proof but stays HELD', () => {
  for (let i = 0; i < 6; i++) {
    const x = setup(i);
    const packet = { witnessPacket: x.witness, testRequestPacket: x.testRequest };
    const r = inspectQl251LinkedReview(packet, { now: NOW });
    assert.equal(r.status, 'WITNESS_AND_TEST_REQUEST_LINKED_ONLY_OWNER_TEST_HELD');
    assert.equal(r.ownerTestAuthorization, 'NOT_GIVEN');
    assert.equal(r.ownerPilotAuthorization, 'NOT_GIVEN');
    assert.equal(r.scheduledGetWindows, 0);
  }
  const a = setup(0), b = setup(1);
  assert.equal(inspectQl251LinkedReview({ witnessPacket: a.witness,
    testRequestPacket: b.testRequest }, { now: NOW }).status,
  'DENIED_LINKED_SOURCE_TENANT_WITNESS_DRIFT');
});
