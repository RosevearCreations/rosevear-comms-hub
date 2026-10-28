/**
 * QL-250: OFFLINE challenge/response and proposed test-window validation.
 * An Ed25519 signature proves control of a presented private key, NOT that its
 * public key belongs to a business or that a person authorized a network test.
 * This module performs no network/FS I/O and can never release a connection.
 */
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';

export const QL250_RELEASE = 'ql250-independent-six-app-source-refresh-pin-custody-window-witness-held-v1';
const SHA = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const NONCE = /^[A-Za-z0-9_-]{43}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/;
const PATHS = Object.freeze(['/api/integration/v1/health', '/api/integration/v1/capabilities']);
const CHALLENGE_KEYS = ['schemaVersion', 'system', 'repository', 'businessId',
  'tenantId', 'sourceSha', 'proofSha', 'pinnedSpkiSha256', 'challengeId',
  'nonceBase64Url', 'issuedAtMs', 'expiresAtMs'];
const PIN_KEYS = ['system', 'spkiSha256', 'custodyReference'];
const ANSWER_KEYS = ['challengeId', 'publicKeyPem', 'signatureBase64Url'];
const WINDOW_KEYS = ['schemaVersion', 'system', 'businessId', 'tenantId',
  'environment', 'methods', 'paths', 'startUtc', 'endUtc',
  'ownerTestApprovalReceiptId', 'gatewayKeyId'];
const exact = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj) &&
  Object.getPrototypeOf(obj) === Object.prototype && Object.keys(obj).length === keys.length &&
  Object.keys(obj).every(key => keys.includes(key));
const equalHex = (a, b) => HEX64.test(a || '') && HEX64.test(b || '') &&
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const sha256 = x => createHash('sha256').update(x).digest('hex');
const expected = system => QL247_SOURCES.find(source => source.system === system);
const businessId = system => system === 'ai-data-platform' ? 'devilndove' : system;
const tenantOk = (system, tenantId) => ['yw', 'icamp'].includes(system)
  ? typeof tenantId === 'string' && ID.test(tenantId)
  : tenantId === null;
const hold = (status, note) => Object.freeze({ release: QL250_RELEASE, status,
  reason: note, ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
  connectionState: 'DISCONNECTED', scheduledGatewayGets: 0,
  witnessedGatewayGets: 0, writes: 0, calls: 0, sms: 0, dispatch: 0 });

/** Canonical challenge bytes bind key custody to exact nonproduction source and nonce. */
export function ql250ChallengeBytes(challenge) {
  if (!exact(challenge, CHALLENGE_KEYS)) throw new TypeError('DENIED_CHALLENGE_SCHEMA');
  return Buffer.from('rosevear.ql250.pin-custody.challenge.v1\n' +
    CHALLENGE_KEYS.map(key => JSON.stringify([key, challenge[key]])).join('\n'), 'utf8');
}

/**
 * The pin must have been authenticated independently OUTSIDE this function.
 * A caller-supplied pin or custodyReference is never evidence of that fact.
 */
export function inspectQl250CustodyResponse(challenge, response, independentPin,
  { now = Date.now(), consumedChallengeIds = [] } = {}) {
  if (!exact(challenge, CHALLENGE_KEYS) || !exact(response, ANSWER_KEYS) ||
    !exact(independentPin, PIN_KEYS) || !Number.isSafeInteger(now) || now <= 0 ||
    !Array.isArray(consumedChallengeIds) ||
    consumedChallengeIds.some(id => typeof id !== 'string' || id.length > 100))
    return hold('DENIED_CUSTODY_INPUT', 'Invalid, noncanonical or unbounded pin response.');
  const source = expected(challenge.system);
  if (!source || source.repository !== challenge.repository ||
    challenge.schemaVersion !== 'rosevear.ql250.challenge.v1' ||
    challenge.businessId !== businessId(source.system) ||
    !tenantOk(source.system, challenge.tenantId) ||
    !SHA.test(challenge.sourceSha) || !SHA.test(challenge.proofSha) ||
    challenge.sourceSha === challenge.proofSha ||
    !HEX64.test(challenge.pinnedSpkiSha256) ||
    independentPin.system !== source.system ||
    !equalHex(challenge.pinnedSpkiSha256, independentPin.spkiSha256) ||
    typeof independentPin.custodyReference !== 'string' ||
    !/^np-[a-z0-9-]{6,70}$/.test(independentPin.custodyReference) ||
    !ID.test(challenge.challengeId) || !NONCE.test(challenge.nonceBase64Url) ||
    Buffer.from(challenge.nonceBase64Url, 'base64url').length !== 32 ||
    !Number.isSafeInteger(challenge.issuedAtMs) ||
    !Number.isSafeInteger(challenge.expiresAtMs) ||
    challenge.expiresAtMs <= challenge.issuedAtMs ||
    challenge.expiresAtMs - challenge.issuedAtMs > 300_000 ||
    challenge.issuedAtMs > now + 30_000 || challenge.expiresAtMs <= now ||
    consumedChallengeIds.includes(challenge.challengeId))
    return hold('DENIED_CHALLENGE_SCOPE_FRESHNESS_OR_REPLAY',
      'Wrong repository, tenant, source SHA, pin, nonce, time window or reused challenge.');
  if (response.challengeId !== challenge.challengeId ||
    typeof response.publicKeyPem !== 'string' || response.publicKeyPem.length > 2048 ||
    typeof response.signatureBase64Url !== 'string' ||
    !SIGNATURE.test(response.signatureBase64Url))
    return hold('DENIED_RESPONSE_SCOPE', 'The response does not bind to this challenge.');
  try {
    const key = createPublicKey(response.publicKeyPem);
    if (key.asymmetricKeyType !== 'ed25519' ||
      !equalHex(sha256(key.export({ format: 'der', type: 'spki' })),
        independentPin.spkiSha256) ||
      !verify(null, ql250ChallengeBytes(challenge), key,
        Buffer.from(response.signatureBase64Url, 'base64url')))
      return hold('DENIED_CUSTODY_SIGNATURE_OR_PIN',
        'Signature is invalid or the presented key differs from the separately supplied pin.');
    return hold('CUSTODY_RESPONSE_CRYPTOGRAPHICALLY_MATCHED_INDEPENDENT_ATTESTATION_HELD',
      'Only cryptographic key control was checked. Independent pin provenance, signer identity, GitHub proof/CI, the real gateway and owner consent are still unverified.');
  } catch {
    return hold('DENIED_CUSTODY_SIGNATURE_OR_PIN', 'Invalid Ed25519 key or signature.');
  }
}

/** Six distinct key-control packets, still never an out-of-band identity proof. */
export function inspectQl250SixAppCustodyPackets(packets, { now = Date.now(), consumedChallengeIds = [] } = {}) {
  if (!Array.isArray(packets) || packets.length !== QL247_SOURCES.length)
    return hold('DENIED_SIX_APP_CUSTODY_SCOPE', 'Exactly six ordered app packets are required.');
  const pins = new Set(), challenges = new Set();
  const rows = QL247_SOURCES.map((s, index) => {
    const packet = packets[index];
    let result = packet && exact(packet, ['challenge', 'response', 'independentPin']) &&
      packet.challenge?.system === s.system && packet.independentPin?.system === s.system
      ? inspectQl250CustodyResponse(packet.challenge, packet.response, packet.independentPin,
        { now, consumedChallengeIds })
      : hold('DENIED_APP_ORDER_OR_PACKET', 'App identities and packet fields must be exact.');
    if (result.status === 'CUSTODY_RESPONSE_CRYPTOGRAPHICALLY_MATCHED_INDEPENDENT_ATTESTATION_HELD') {
      if (pins.has(packet.independentPin.spkiSha256) || challenges.has(packet.challenge.challengeId) ||
        challenges.has(packet.challenge.nonceBase64Url))
        result = hold('DENIED_CROSS_APP_KEY_OR_CHALLENGE_REUSE',
          'Each source must demonstrate distinct signer keys, challenge IDs and nonces.');
      else {
        pins.add(packet.independentPin.spkiSha256);
        challenges.add(packet.challenge.challengeId);
        challenges.add(packet.challenge.nonceBase64Url);
      }
    }
    return Object.freeze({ system: s.system, status: result.status });
  });
  const matched = rows.filter(r =>
    r.status === 'CUSTODY_RESPONSE_CRYPTOGRAPHICALLY_MATCHED_INDEPENDENT_ATTESTATION_HELD').length;
  return Object.freeze({ ...hold(matched === 6
    ? 'SIX_APP_CUSTODY_CRYPTOGRAPHIC_REVIEW_OWNER_TEST_HELD'
    : 'SIX_APP_CUSTODY_INCOMPLETE_HELD',
    'Even all six valid Ed25519 responses are not independently authenticated custody, owner permission or gateway results.'),
    rows, cryptographicResponsesMatched: matched,
    independentlyAuthenticatedCustodians: 0, realPilotHolds: 12 });
}

/**
 * A test-window proposal is display-only. It never stores credentials, invokes
 * a timer, performs GET, or interprets an approval reference as actual consent.
 */
export function inspectQl250WindowProposal(proposal, { now = Date.now() } = {}) {
  if (!exact(proposal, WINDOW_KEYS) || !Number.isSafeInteger(now) || now <= 0)
    return hold('DENIED_WINDOW_SCHEMA', 'Use exactly the public, narrow test-window fields.');
  const source = expected(proposal.system);
  if (!source || proposal.schemaVersion !== 'rosevear.ql250.window.v1' ||
    proposal.businessId !== businessId(source.system) ||
    !tenantOk(source.system, proposal.tenantId) ||
    proposal.environment !== 'nonproduction' ||
    JSON.stringify(proposal.methods) !== '["GET"]' ||
    JSON.stringify(proposal.paths) !== JSON.stringify(PATHS) ||
    proposal.gatewayKeyId !== null &&
    (typeof proposal.gatewayKeyId !== 'string' || !ID.test(proposal.gatewayKeyId)) ||
    proposal.ownerTestApprovalReceiptId !== null &&
    (typeof proposal.ownerTestApprovalReceiptId !== 'string' ||
      !ID.test(proposal.ownerTestApprovalReceiptId)))
    return hold('DENIED_WINDOW_SCOPE', 'Not a read-only, tenant-scoped nonproduction proposal.');
  const start = Date.parse(proposal.startUtc), end = Date.parse(proposal.endUtc);
  if (typeof proposal.startUtc !== 'string' || typeof proposal.endUtc !== 'string' ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(proposal.startUtc) ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(proposal.endUtc) ||
    !Number.isFinite(start) || !Number.isFinite(end) ||
    new Date(start).toISOString() !== proposal.startUtc ||
    new Date(end).toISOString() !== proposal.endUtc ||
    start <= now || start > now + 14 * 86_400_000 ||
    end <= start || end - start > 30 * 60_000)
    return hold('DENIED_WINDOW_TIME', 'A proposed test window must be UTC, future, within 14 days and at most 30 minutes.');
  return hold(proposal.ownerTestApprovalReceiptId === null
    ? 'WINDOW_CANDIDATE_ONLY_OWNER_APPROVAL_NOT_GIVEN_HELD'
    : 'OWNER_APPROVAL_REFERENCE_CLAIM_UNVERIFIED_HELD',
  'No appointment was scheduled. An independently authenticated owner test decision, scoped server credentials, witnesses and original receipts are required before ANY GET. Pilot permission is separate.');
}

/** Public source summary stays held, regardless of a submitted origin report. */
export function ql250SummarizeSourceRefresh(rows) {
  if (!Array.isArray(rows) || rows.length !== 6 ||
    !QL247_SOURCES.every((s, i) => rows[i]?.system === s.system &&
      rows[i]?.repository === s.repository &&
      (rows[i].mainSha === null || SHA.test(rows[i].mainSha)) &&
      ['MISSING_PUBLIC_PROOF_AT_MAIN', 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD',
        'NOT_FETCHED_NO_NETWORK_REQUESTED', 'HEAD_FETCH_FAILED', 'ORIGIN_PROVENANCE_FETCH_FAILED',
        'PROOF_FETCH_FAILED'].includes(rows[i].status)))
    return hold('DENIED_SOURCE_REFRESH_INPUT', 'Six ordered known sources are required.');
  const notFetched = rows.every(r => r.status === 'NOT_FETCHED_NO_NETWORK_REQUESTED');
  return Object.freeze({ ...hold(notFetched
    ? 'NO_PUBLIC_SOURCE_REQUESTS_PERFORMED_HELD'
    : 'SIX_APP_PUBLIC_ORIGIN_REFRESH_RECORDED_TEST_HELD',
    'Public GitHub origin metadata cannot establish independently pinned key custody or an approved gateway test.'),
    observedMainShas: rows.map(r => ({ system: r.system, mainSha: r.mainSha, status: r.status })),
    publicOriginAndCiObserved: rows.filter(r =>
      r.status === 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD').length,
    independentlyAttestedSignerPins: 0, scheduledTestWindows: 0,
    realPilotHolds: 12 });
}
