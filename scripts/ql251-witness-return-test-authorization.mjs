/**
 * QL-251 — OFFLINE witness and signed TEST-REQUEST review only.
 * Neither a public-key signature nor a user-supplied pin proves independent
 * key custody, owner identity, test authorization or real gateway witnessing.
 * No network, storage, timers, credentials, pilot release or writes.
 */
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';
import { inspectQl250CustodyResponse, inspectQl250WindowProposal }
  from './ql250-pin-custody-window-witness.mjs';

export const QL251_RELEASE = 'ql251-six-app-proof-witness-owner-test-review-held-v1';
const HEX = /^[0-9a-f]{64}$/;
const SHA = /^[0-9a-f]{40}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/;
const PATHS = ['/api/integration/v1/health', '/api/integration/v1/capabilities'];
const WITNESS_KEYS = ['schemaVersion', 'system', 'businessId', 'tenantId', 'sourceSha',
  'proofSha', 'custodyChallengeId', 'custodyResponseSha256', 'custodyPublicSpkiSha256',
  'witnessReceiptId', 'witnessedAtMs', 'observation'];
const TEST_KEYS = ['schemaVersion', 'system', 'businessId', 'tenantId', 'sourceSha',
  'proofSha', 'witnessReceiptId', 'testRequestId', 'environment', 'methods', 'paths',
  'startUtc', 'endUtc', 'decision', 'issuedAtMs', 'expiresAtMs'];
const SIGNED_KEYS = ['payload', 'publicKeyPem', 'signatureBase64Url'];
const PIN_KEYS = ['system', 'spkiSha256', 'provenanceReceiptId'];
const hasExact = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) &&
  Object.getPrototypeOf(o) === Object.prototype && Object.keys(o).length === keys.length &&
  Object.keys(o).every(key => keys.includes(key));
const sha = raw => createHash('sha256').update(raw).digest('hex');
const equal = (a, b) => HEX.test(a || '') && HEX.test(b || '') &&
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const sourceFor = system => QL247_SOURCES.find(s => s.system === system);
const businessFor = system => system === 'ai-data-platform' ? 'devilndove' : system;
const tenantOk = (system, tenant) => ['yw', 'icamp'].includes(system)
  ? typeof tenant === 'string' && ID.test(tenant) : tenant === null;
const held = (status, reason) => Object.freeze({ release: QL251_RELEASE, status, reason,
  witnessedIndependentCustodians: 0, authenticatedOwnerTestDecisions: 0,
  realGatewayGets: 0, scheduledGetWindows: 0, ownerTestAuthorization: 'NOT_GIVEN',
  ownerPilotAuthorization: 'NOT_GIVEN', connectionState: 'DISCONNECTED',
  realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0 });

function canonical(payload, keys, domain) {
  if (!hasExact(payload, keys)) throw new TypeError('DENIED_CANONICAL_SCHEMA');
  return Buffer.from(domain + '\n' +
    keys.map(key => JSON.stringify([key, payload[key]])).join('\n'), 'utf8');
}
export const ql251WitnessBytes = payload =>
  canonical(payload, WITNESS_KEYS, 'rosevear.ql251.independent-witness-return.v1');
export const ql251TestRequestBytes = payload =>
  canonical(payload, TEST_KEYS, 'rosevear.ql251.test-approval-review-request.v1');

function inspectSignature(envelope, publicPin, system, bytes) {
  if (!hasExact(envelope, SIGNED_KEYS) || !hasExact(publicPin, PIN_KEYS) ||
    publicPin.system !== system || !HEX.test(publicPin.spkiSha256 || '') ||
    !ID.test(publicPin.provenanceReceiptId || '') ||
    typeof envelope.publicKeyPem !== 'string' || envelope.publicKeyPem.length > 2048 ||
    typeof envelope.signatureBase64Url !== 'string' || !SIGNATURE.test(envelope.signatureBase64Url))
    return false;
  try {
    const key = createPublicKey(envelope.publicKeyPem);
    return key.asymmetricKeyType === 'ed25519' &&
      equal(sha(key.export({ type: 'spki', format: 'der' })), publicPin.spkiSha256) &&
      verify(null, bytes, key, Buffer.from(envelope.signatureBase64Url, 'base64url'));
  } catch { return false; }
}

/** Deterministically binds a witness return to the actual custody response bytes. */
export function ql251CustodyResponseDigest(response) {
  if (!hasExact(response, ['challengeId', 'publicKeyPem', 'signatureBase64Url']))
    throw new TypeError('DENIED_CUSTODY_RESPONSE_SCHEMA');
  return sha(Buffer.from(JSON.stringify([response.challengeId,
    response.publicKeyPem, response.signatureBase64Url]), 'utf8'));
}

/** Witness signature match is *not* proof that a real independent witness exists. */
export function inspectQl251WitnessReturn(packet, { now = Date.now(), consumedChallengeIds = [] } = {}) {
  if (!hasExact(packet, ['challenge', 'custodyResponse', 'custodyPin',
    'signedWitness', 'witnessPin']) || !hasExact(packet.signedWitness, SIGNED_KEYS) ||
    !hasExact(packet.signedWitness.payload, WITNESS_KEYS) ||
    !Number.isSafeInteger(now) || now <= 0)
    return held('DENIED_WITNESS_INPUT', 'Exact, bounded public witness metadata is required.');
  const challenge = packet.challenge, payload = packet.signedWitness.payload;
  const custody = inspectQl250CustodyResponse(challenge, packet.custodyResponse,
    packet.custodyPin, { now, consumedChallengeIds });
  if (custody.status !== 'CUSTODY_RESPONSE_CRYPTOGRAPHICALLY_MATCHED_INDEPENDENT_ATTESTATION_HELD')
    return held('DENIED_UPSTREAM_CUSTODY_CHALLENGE', 'The underlying Ed25519 key-control response was not valid.');
  const source = sourceFor(payload.system);
  if (!source || !SHA.test(payload.sourceSha || '') || !SHA.test(payload.proofSha || '') ||
    payload.schemaVersion !== 'rosevear.ql251.witness.v1' ||
    payload.system !== challenge.system || payload.businessId !== businessFor(source.system) ||
    payload.tenantId !== challenge.tenantId || !tenantOk(source.system, payload.tenantId) ||
    payload.sourceSha !== challenge.sourceSha || payload.proofSha !== challenge.proofSha ||
    payload.custodyChallengeId !== challenge.challengeId ||
    !equal(payload.custodyResponseSha256, ql251CustodyResponseDigest(packet.custodyResponse)) ||
    !equal(payload.custodyPublicSpkiSha256, packet.custodyPin.spkiSha256) ||
    !ID.test(payload.witnessReceiptId || '') ||
    payload.observation !== 'OBSERVED_OFFLINE_KEY_CONTROL_ONLY' ||
    !Number.isSafeInteger(payload.witnessedAtMs) ||
    payload.witnessedAtMs < challenge.issuedAtMs || payload.witnessedAtMs > now + 30_000 ||
    payload.witnessedAtMs >= challenge.expiresAtMs ||
    !hasExact(packet.witnessPin, PIN_KEYS) ||
    equal(packet.witnessPin.spkiSha256, packet.custodyPin.spkiSha256))
    return held('DENIED_WITNESS_SCOPE_OR_FRESHNESS', 'Foreign source/tenant, stale challenge or custody signer reused as witness.');
  if (!inspectSignature(packet.signedWitness, packet.witnessPin, payload.system,
    ql251WitnessBytes(payload)))
    return held('DENIED_WITNESS_SIGNATURE_OR_PIN', 'The submitted witness signature does not match its separately supplied pin.');
  return held('WITNESS_SIGNATURE_MATCHED_REAL_WORLD_PROVENANCE_UNVERIFIED_HELD',
    'This matches an offline witness *claim* only. Independent witness identity, original key custody, published GitHub proof and gateway receipts remain unverified.');
}

/**
 * No offline document is permitted to self-grant test approval. Only the
 * request-for-approval form is accepted, and the result remains NOT GIVEN.
 */
export function inspectQl251TestAuthorizationRequest(packet, { now = Date.now() } = {}) {
  if (!hasExact(packet, ['windowProposal', 'signedRequest', 'requestPin']) ||
    !hasExact(packet.signedRequest, SIGNED_KEYS) ||
    !hasExact(packet.signedRequest.payload, TEST_KEYS) ||
    !Number.isSafeInteger(now) || now <= 0)
    return held('DENIED_TEST_REQUEST_INPUT', 'Only an exact signed test-review request is accepted.');
  const p = packet.signedRequest.payload, w = packet.windowProposal;
  const windowReview = inspectQl250WindowProposal(w, { now });
  if (!['WINDOW_CANDIDATE_ONLY_OWNER_APPROVAL_NOT_GIVEN_HELD',
    'OWNER_APPROVAL_REFERENCE_CLAIM_UNVERIFIED_HELD'].includes(windowReview.status))
    return held('DENIED_UPSTREAM_WINDOW_SCOPE', 'Only a future read-only nonproduction window may be reviewed.');
  const source = sourceFor(p.system);
  if (!source || p.schemaVersion !== 'rosevear.ql251.test-request.v1' ||
    p.system !== w.system || p.businessId !== w.businessId ||
    p.tenantId !== w.tenantId || !tenantOk(source.system, p.tenantId) ||
    !SHA.test(p.sourceSha || '') || !SHA.test(p.proofSha || '') ||
    p.sourceSha === p.proofSha ||
    !ID.test(p.witnessReceiptId || '') || !ID.test(p.testRequestId || '') ||
    p.environment !== 'nonproduction' || JSON.stringify(p.methods) !== '["GET"]' ||
    JSON.stringify(p.paths) !== JSON.stringify(PATHS) ||
    p.startUtc !== w.startUtc || p.endUtc !== w.endUtc ||
    p.decision !== 'REQUEST_INDEPENDENT_OWNER_TEST_REVIEW_ONLY' ||
    !Number.isSafeInteger(p.issuedAtMs) || !Number.isSafeInteger(p.expiresAtMs) ||
    p.issuedAtMs > now + 30_000 || p.expiresAtMs <= now ||
    p.expiresAtMs - p.issuedAtMs > 300_000 || p.expiresAtMs <= p.issuedAtMs)
    return held('DENIED_TEST_REQUEST_SCOPE', 'A self-authorizing, stale, cross-app or non-GET request is prohibited.');
  if (!inspectSignature(packet.signedRequest, packet.requestPin, p.system,
    ql251TestRequestBytes(p)))
    return held('DENIED_TEST_REQUEST_SIGNATURE_OR_PIN', 'Request signature or claimed signer pin is invalid.');
  return held('TEST_REVIEW_REQUEST_SIGNATURE_MATCHED_OWNER_AUTHORIZATION_NOT_GIVEN_HELD',
    'The signed document is a request, NOT independently authenticated owner consent. A separate private decision and original gateway witness are required before any test.');
}

/** Cross-check the two separately signed requests without treating either as owner consent. */
export function inspectQl251LinkedReview(packet, options = {}) {
  if (!hasExact(packet, ['witnessPacket', 'testRequestPacket']))
    return held('DENIED_LINKED_REVIEW_SCHEMA', 'Exact witness and test-review request packets required.');
  const witness = inspectQl251WitnessReturn(packet.witnessPacket, options);
  const test = inspectQl251TestAuthorizationRequest(packet.testRequestPacket, options);
  if (witness.status !== 'WITNESS_SIGNATURE_MATCHED_REAL_WORLD_PROVENANCE_UNVERIFIED_HELD' ||
    test.status !== 'TEST_REVIEW_REQUEST_SIGNATURE_MATCHED_OWNER_AUTHORIZATION_NOT_GIVEN_HELD')
    return held('DENIED_LINKED_UPSTREAM_CLAIMS', 'One or both signed packets failed strict offline validation.');
  const w = packet.witnessPacket.signedWitness.payload,
    t = packet.testRequestPacket.signedRequest.payload;
  if (w.system !== t.system || w.businessId !== t.businessId ||
    w.tenantId !== t.tenantId || w.sourceSha !== t.sourceSha ||
    w.proofSha !== t.proofSha || w.witnessReceiptId !== t.witnessReceiptId)
    return held('DENIED_LINKED_SOURCE_TENANT_WITNESS_DRIFT',
      'Source, tenant or witness receipt differs between separately signed claims.');
  return held('WITNESS_AND_TEST_REQUEST_LINKED_ONLY_OWNER_TEST_HELD',
    'Both signatures and linkage are internally consistent, but authentic witness custody, origin proof, original audits and a separate authenticated owner test decision remain missing.');
}
