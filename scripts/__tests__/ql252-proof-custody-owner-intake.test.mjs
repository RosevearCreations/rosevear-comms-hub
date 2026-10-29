import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { ql250ChallengeBytes } from '../ql250-pin-custody-window-witness.mjs';
import { ql251CustodyResponseDigest, ql251WitnessBytes, ql251TestRequestBytes }
  from '../ql251-witness-return-test-authorization.mjs';
import { inspectQl252PublicationEscalation, inspectQl252CustodyProvenance,
  inspectQl252OwnerTestDecision, ql252OwnerDecisionBytes }
  from '../ql252-proof-custody-owner-intake.mjs';

const NOW = Date.UTC(2026, 9, 29, 1);
const hash = v => createHash('sha256').update(v).digest('hex');
const keyPair = () => generateKeyPairSync('ed25519');
const pem = key => key.publicKey.export({ type: 'spki', format: 'pem' });
const pin = key => hash(key.publicKey.export({ type: 'spki', format: 'der' }));
const envelope = (payload, key, bytes) => ({ payload, publicKeyPem: pem(key),
  signatureBase64Url: sign(null, bytes(payload), key.privateKey).toString('base64url') });
function setup(i = 0) {
  const source = QL247_SOURCES[i];
  const { system, repository } = source;
  const businessId = system === 'ai-data-platform' ? 'devilndove' : system;
  const tenantId = ['yw', 'icamp'].includes(system) ? `np-ql252-tenant-${i}` : null;
  const custody = keyPair(), witness = keyPair(), requester = keyPair(), owner = keyPair();
  const sourceSha = String(i + 1).repeat(40), proofSha = String.fromCharCode(97 + i).repeat(40);
  const challenge = { schemaVersion: 'rosevear.ql250.challenge.v1', system, repository,
    businessId, tenantId, sourceSha, proofSha, pinnedSpkiSha256: pin(custody),
    challengeId: `np-ql252-custody-${i}`, nonceBase64Url: randomBytes(32).toString('base64url'),
    issuedAtMs: NOW - 1_000, expiresAtMs: NOW + 120_000 };
  const custodyResponse = { challengeId: challenge.challengeId, publicKeyPem: pem(custody),
    signatureBase64Url: sign(null, ql250ChallengeBytes(challenge),
      custody.privateKey).toString('base64url') };
  const witnessPayload = { schemaVersion: 'rosevear.ql251.witness.v1', system,
    businessId, tenantId, sourceSha, proofSha,
    custodyChallengeId: challenge.challengeId,
    custodyResponseSha256: ql251CustodyResponseDigest(custodyResponse),
    custodyPublicSpkiSha256: pin(custody), witnessReceiptId: `np-ql252-witness-${i}`,
    witnessedAtMs: NOW - 500, observation: 'OBSERVED_OFFLINE_KEY_CONTROL_ONLY' };
  const witnessPacket = { challenge, custodyResponse,
    custodyPin: { system, spkiSha256: pin(custody), custodyReference: `np-ql252-pin-${i}` },
    signedWitness: envelope(witnessPayload, witness, ql251WitnessBytes),
    witnessPin: { system, spkiSha256: pin(witness), provenanceReceiptId: `np-ql252-witness-pin-${i}` } };
  const custodyProvenance = { schemaVersion: 'rosevear.ql252.pin-provenance.v1',
    system, repository, businessId, tenantId, sourceSha, proofSha,
    custodySpkiSha256: pin(custody), witnessSpkiSha256: pin(witness),
    outOfBandChannel: 'PRIVATE_TRUST_REGISTRY', pinReceiptId: `np-ql252-oob-${i}`,
    verifierAlias: 'independent_reviewer', observedAtMs: NOW - 400 };
  const startUtc = new Date(NOW + 3_600_000).toISOString();
  const endUtc = new Date(NOW + 4_200_000).toISOString();
  const paths = ['/api/integration/v1/health', '/api/integration/v1/capabilities'];
  const request = { schemaVersion: 'rosevear.ql251.test-request.v1', system,
    businessId, tenantId, sourceSha, proofSha,
    witnessReceiptId: witnessPayload.witnessReceiptId,
    testRequestId: `np-ql252-request-${i}`, environment: 'nonproduction',
    methods: ['GET'], paths, startUtc, endUtc,
    decision: 'REQUEST_INDEPENDENT_OWNER_TEST_REVIEW_ONLY',
    issuedAtMs: NOW - 1_000, expiresAtMs: NOW + 120_000 };
  const testRequestPacket = { windowProposal: {
    schemaVersion: 'rosevear.ql250.window.v1', system, businessId, tenantId,
    environment: 'nonproduction', methods: ['GET'], paths, startUtc, endUtc,
    ownerTestApprovalReceiptId: null, gatewayKeyId: null
  }, signedRequest: envelope(request, requester, ql251TestRequestBytes),
  requestPin: { system, spkiSha256: pin(requester),
    provenanceReceiptId: `np-ql252-request-pin-${i}` } };
  const decision = { schemaVersion: 'rosevear.ql252.owner-test-decision.v1',
    system, businessId, tenantId, sourceSha, proofSha,
    witnessReceiptId: request.witnessReceiptId, testRequestId: request.testRequestId,
    ownerDecisionId: `np-ql252-owner-decision-${i}`, environment: 'nonproduction',
    methods: ['GET'], paths, startUtc, endUtc,
    decision: 'APPROVE_TEST_ONLY_REVIEW_CLAIM',
    issuedAtMs: NOW - 500, expiresAtMs: NOW + 110_000 };
  return { witnessPacket, custodyProvenance, testRequestPacket,
    ownerDecisionEnvelope: envelope(decision, owner, ql252OwnerDecisionBytes),
    ownerPin: { system, spkiSha256: pin(owner),
      provenanceReceiptId: `np-ql252-owner-pin-${i}`,
      channel: 'PRIVATE_OWNER_IDENTITY_VERIFICATION_PENDING' } };
}

test('QL252 creates six explicit public proof escalations and does not mistake no-fetch for 404', () => {
  const rows = QL247_SOURCES.map(s => ({ ...s, mainSha: 'a'.repeat(40),
    sourceSha: null, proofRawSha256: null, status: 'MISSING_PUBLIC_PROOF_AT_MAIN' }));
  const observed = inspectQl252PublicationEscalation(rows);
  assert.equal(observed.missingProofs, 6);
  assert.equal(observed.queue.length, 6);
  assert.ok(observed.queue.every(r => r.proofPath === 'docs/integration/ql246-source-proof.json'));
  assert.ok(observed.queue.every(r => r.status === 'PUBLISH_SIGNED_PROOF_AT_EXACT_PATH_HELD'));
  assert.equal(observed.connectionState, 'DISCONNECTED');
  const notFetched = rows.map(r => ({ ...r, mainSha: null, status: 'NOT_FETCHED_NO_NETWORK_REQUESTED' }));
  assert.equal(inspectQl252PublicationEscalation(notFetched).missingProofs, 0);
  assert.equal(inspectQl252PublicationEscalation(rows.slice(1)).status, 'DENIED_SOURCE_CENSUS');
});

test('QL252 matches six synthetic out-of-band pin records but does not authenticate real custody', () => {
  for (let i = 0; i < 6; i++) {
    const p = setup(i);
    const result = inspectQl252CustodyProvenance(p.witnessPacket,
      p.custodyProvenance, { now: NOW });
    assert.equal(result.status, 'PIN_PROVENANCE_METADATA_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD');
    assert.equal(result.independentlyAuthenticatedPins, 0);
    assert.equal(result.realGatewayGets, 0);
    assert.equal(result.ownerTestAuthorization, 'NOT_GIVEN');
  }
});

test('QL252 fails closed for swapped tenant, pin, proof, role and untrusted channel', () => {
  const original = setup(4);
  for (const mutate of [
    p => { p.tenantId = 'np-foreign-tenant'; },
    p => { p.proofSha = 'f'.repeat(40); },
    p => { p.witnessSpkiSha256 = 'f'.repeat(64); },
    p => { p.outOfBandChannel = 'GITHUB_SELF_ASSERTED'; },
    p => { p.custodySpkiSha256 = p.witnessSpkiSha256; },
    p => { p.observedAtMs = NOW + 500_000; },
    p => { p.secret = 'not-allowed'; }
  ]) {
    const copy = structuredClone(original);
    mutate(copy.custodyProvenance);
    assert.notEqual(inspectQl252CustodyProvenance(copy.witnessPacket,
      copy.custodyProvenance, { now: NOW }).status,
    'PIN_PROVENANCE_METADATA_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD');
  }
});

test('QL252 matches signed test-only owner decision claims for six, never grants consent', () => {
  for (let i = 0; i < 6; i++) {
    const p = setup(i);
    const result = inspectQl252OwnerTestDecision(p, { now: NOW });
    assert.equal(result.status, 'SIGNED_TEST_ONLY_APPROVAL_CLAIM_AUTHORITY_UNVERIFIED_HELD');
    assert.equal(result.authenticatedOwnerTestDecisions, 0);
    assert.equal(result.ownerTestAuthorization, 'NOT_GIVEN');
    assert.equal(result.ownerPilotAuthorization, 'NOT_GIVEN');
    assert.equal(result.scheduledGatewayGets, 0);
    assert.equal(result.realGatewayGets, 0);
    assert.equal(result.realPilotHolds, 12);
    for (const k of ['writes', 'calls', 'sms', 'dispatch']) assert.equal(result[k], 0);
  }
});

test('QL252 rejects forged owner signatures, signer reuse, wrong scopes, replay and stale proof', () => {
  const original = setup(3);
  const valid = 'SIGNED_TEST_ONLY_APPROVAL_CLAIM_AUTHORITY_UNVERIFIED_HELD';
  for (const mutate of [
    p => { p.ownerDecisionEnvelope.signatureBase64Url = 'a'.repeat(86); },
    p => { p.ownerPin.spkiSha256 = p.testRequestPacket.requestPin.spkiSha256; },
    p => { p.ownerPin.channel = 'PUBLIC_GITHUB_PIN'; },
    p => { p.ownerDecisionEnvelope.payload.decision = 'APPROVE_LIVE_PILOT'; },
    p => { p.ownerDecisionEnvelope.payload.methods = ['POST']; },
    p => { p.ownerDecisionEnvelope.payload.paths = ['/api/private/vault']; },
    p => { p.ownerDecisionEnvelope.payload.tenantId = 'np-foreign-tenant'; },
    p => { p.ownerDecisionEnvelope.payload.proofSha = 'f'.repeat(40); },
    p => { p.ownerDecisionEnvelope.payload.endUtc = new Date(NOW + 8_000_000).toISOString(); },
    p => { p.ownerDecisionEnvelope.payload.expiresAtMs = NOW - 1; },
    p => { p.ownerDecisionEnvelope.payload.token = 'unexpected'; }
  ]) {
    const p = structuredClone(original);
    mutate(p);
    assert.notEqual(inspectQl252OwnerTestDecision(p, { now: NOW }).status, valid);
  }
  assert.equal(inspectQl252OwnerTestDecision(original,
    { now: NOW, consumedChallengeIds: [original.witnessPacket.challenge.challengeId] }).status,
  'DENIED_OWNER_DECISION_UPSTREAM_REVIEW');
});

test('QL252 signed decline is held, not mistaken for a pilot release', () => {
  const p = setup(0);
  const owner = keyPair();
  p.ownerPin.spkiSha256 = pin(owner);
  p.ownerDecisionEnvelope = envelope({ ...p.ownerDecisionEnvelope.payload,
    decision: 'DECLINE_TEST_ONLY_REVIEW_CLAIM' }, owner, ql252OwnerDecisionBytes);
  assert.equal(inspectQl252OwnerTestDecision(p, { now: NOW }).status,
    'SIGNED_TEST_ONLY_DECLINE_CLAIM_AUTHORITY_UNVERIFIED_HELD');
});
