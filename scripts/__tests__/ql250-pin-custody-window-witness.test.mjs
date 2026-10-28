import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { ql250CurlPublic } from '../ql250-public-curl-transport.mjs';
import { inspectQl250CustodyResponse, inspectQl250SixAppCustodyPackets, inspectQl250WindowProposal,
  ql250ChallengeBytes, ql250SummarizeSourceRefresh } from '../ql250-pin-custody-window-witness.mjs';

const NOW = Date.UTC(2026, 9, 28, 20, 0, 0);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(i = 0, keys = generateKeyPairSync('ed25519')) {
  const source = QL247_SOURCES[i];
  const pin = { system: source.system, spkiSha256: digest(keys.publicKey.export({ type: 'spki', format: 'der' })),
    custodyReference: `np-custody-review-${i}` };
  const challenge = { schemaVersion: 'rosevear.ql250.challenge.v1', system: source.system,
    repository: source.repository, businessId: source.system === 'ai-data-platform' ?
      'devilndove' : source.system,
    tenantId: ['yw', 'icamp'].includes(source.system) ? `np-tenant-review-${i}` : null,
    sourceSha: String(i + 1).repeat(40), proofSha: String.fromCharCode(97 + i).repeat(40),
    pinnedSpkiSha256: pin.spkiSha256, challengeId: `np-ql250-nonce-${i}`,
    nonceBase64Url: randomBytes(32).toString('base64url'),
    issuedAtMs: NOW - 1000, expiresAtMs: NOW + 120_000 };
  const response = { challengeId: challenge.challengeId,
    publicKeyPem: keys.publicKey.export({ type: 'spki', format: 'pem' }),
    signatureBase64Url: sign(null, ql250ChallengeBytes(challenge), keys.privateKey).toString('base64url') };
  return { source, keys, pin, challenge, response };
}
function window(i = 0) {
  const s = QL247_SOURCES[i];
  return { schemaVersion: 'rosevear.ql250.window.v1', system: s.system,
    businessId: s.system === 'ai-data-platform' ? 'devilndove' : s.system,
    tenantId: ['yw', 'icamp'].includes(s.system) ? `np-tenant-review-${i}` : null,
    environment: 'nonproduction', methods: ['GET'], paths: [
      '/api/integration/v1/health', '/api/integration/v1/capabilities' ],
    startUtc: new Date(NOW + 3_600_000).toISOString(),
    endUtc: new Date(NOW + 4_200_000).toISOString(),
    ownerTestApprovalReceiptId: null, gatewayKeyId: null };
}

test('QL250 cryptographically matches six scoped custody responses but grants no trusted identity, GET or pilot', () => {
  for (let i = 0; i < 6; i++) {
    const { challenge, response, pin } = fixture(i);
    const result = inspectQl250CustodyResponse(challenge, response, pin, { now: NOW });
    assert.equal(result.status, 'CUSTODY_RESPONSE_CRYPTOGRAPHICALLY_MATCHED_INDEPENDENT_ATTESTATION_HELD');
    assert.equal(result.ownerTestAuthorization, 'NOT_GIVEN');
    assert.equal(result.ownerPilotAuthorization, 'NOT_GIVEN');
    assert.equal(result.connectionState, 'DISCONNECTED');
    assert.equal(result.scheduledGatewayGets, 0);
    assert.equal(result.witnessedGatewayGets, 0);
    for (const key of ['writes', 'calls', 'sms', 'dispatch']) assert.equal(result[key], 0);
    assert.equal(JSON.stringify(result).includes('PUBLIC KEY'), false);
  }
});

test('QL250 refuses replay, expiry, swapped tenancy/source and changed challenge scope', () => {
  for (const change of [
    x => { x.challenge.tenantId = 'np-foreign-company'; },
    x => { x.challenge.sourceSha = 'f'.repeat(40); },
    x => { x.challenge.repository = 'unapproved'; },
    x => { x.challenge.expiresAtMs = NOW - 1; },
    x => { x.challenge.issuedAtMs = NOW + 31_000; },
    x => { x.challenge.nonceBase64Url = 'short'; }
  ]) {
    const x = fixture(3); change(x);
    assert.notEqual(inspectQl250CustodyResponse(x.challenge, x.response, x.pin, { now: NOW })
      .status, 'CUSTODY_RESPONSE_CRYPTOGRAPHICALLY_MATCHED_INDEPENDENT_ATTESTATION_HELD');
  }
  const x = fixture();
  assert.equal(inspectQl250CustodyResponse(x.challenge, x.response, x.pin,
    { now: NOW, consumedChallengeIds: [x.challenge.challengeId] }).status,
  'DENIED_CHALLENGE_SCOPE_FRESHNESS_OR_REPLAY');
});

test('QL250 six-app key custody packets reject cross-app signer reuse and preserve HOLD even when valid', () => {
  const packets = Array.from({ length: 6 }, (_, i) => {
    const x = fixture(i);
    return { challenge: x.challenge, response: x.response, independentPin: x.pin };
  });
  const valid = inspectQl250SixAppCustodyPackets(packets, { now: NOW });
  assert.equal(valid.cryptographicResponsesMatched, 6);
  assert.equal(valid.independentlyAuthenticatedCustodians, 0);
  assert.equal(valid.ownerTestAuthorization, 'NOT_GIVEN');
  assert.equal(valid.witnessedGatewayGets, 0);

  const attack = structuredClone(packets);
  attack[1].independentPin.spkiSha256 = attack[0].independentPin.spkiSha256;
  attack[1].challenge.pinnedSpkiSha256 = attack[0].independentPin.spkiSha256;
  assert.notEqual(inspectQl250SixAppCustodyPackets(attack, { now: NOW }).rows[1].status,
    'CUSTODY_RESPONSE_CRYPTOGRAPHICALLY_MATCHED_INDEPENDENT_ATTESTATION_HELD');
  const sharedKey = generateKeyPairSync('ed25519');
  const reused = packets.map((packet, i) => {
    if (i > 1) return packet;
    const x = fixture(i, sharedKey);
    return { challenge: x.challenge, response: x.response, independentPin: x.pin };
  });
  assert.equal(inspectQl250SixAppCustodyPackets(reused, { now: NOW }).rows[1].status,
    'DENIED_CROSS_APP_KEY_OR_CHALLENGE_REUSE');
  assert.equal(inspectQl250SixAppCustodyPackets(packets.slice(1), { now: NOW }).status,
    'DENIED_SIX_APP_CUSTODY_SCOPE');
});

test('QL250 rejects forged pin, altered message and attacker response', () => {
  const x = fixture(2);
  assert.equal(inspectQl250CustodyResponse(x.challenge, x.response,
    { ...x.pin, spkiSha256: 'f'.repeat(64) }, { now: NOW }).status,
  'DENIED_CHALLENGE_SCOPE_FRESHNESS_OR_REPLAY');
  const forged = fixture(2);
  assert.equal(inspectQl250CustodyResponse(x.challenge,
    { ...x.response, publicKeyPem: forged.response.publicKeyPem }, x.pin,
    { now: NOW }).status, 'DENIED_CUSTODY_SIGNATURE_OR_PIN');
  const tampered = { ...x.response, signatureBase64Url: sign(null,
    Buffer.from('different challenge'), x.keys.privateKey).toString('base64url') };
  assert.equal(inspectQl250CustodyResponse(x.challenge, tampered, x.pin,
    { now: NOW }).status, 'DENIED_CUSTODY_SIGNATURE_OR_PIN');
  assert.equal(inspectQl250CustodyResponse({ ...x.challenge, extra: 'injection' },
    x.response, x.pin, { now: NOW }).status, 'DENIED_CUSTODY_INPUT');
});

test('QL250 future GET windows are unscheduled even with an unverified approval reference', () => {
  for (let i = 0; i < 6; i++) {
    const candidate = window(i);
    const r = inspectQl250WindowProposal(candidate, { now: NOW });
    assert.equal(r.status, 'WINDOW_CANDIDATE_ONLY_OWNER_APPROVAL_NOT_GIVEN_HELD');
    assert.equal(r.scheduledGatewayGets, 0);
    assert.equal(r.connectionState, 'DISCONNECTED');
    assert.equal(inspectQl250WindowProposal({ ...candidate,
      ownerTestApprovalReceiptId: 'np-owner-test-claim-1' }, { now: NOW }).status,
    'OWNER_APPROVAL_REFERENCE_CLAIM_UNVERIFIED_HELD');
  }
});

test('QL250 rejects forbidden writes, private endpoints, tenant scope, unsafe or stale times', () => {
  for (const modify of [
    x => { x.methods = ['POST']; },
    x => { x.paths = ['https://192.168.1.1/private']; },
    x => { x.environment = 'production'; },
    x => { x.gatewayKeyId = 'raw-credential'; },
    x => { x.ownerTestApprovalReceiptId = 'owner-approved'; },
    x => { x.extra = 'secret'; }
  ]) {
    const x = window(); modify(x);
    assert.match(inspectQl250WindowProposal(x, { now: NOW }).status, /^DENIED_WINDOW_/);
  }
  for (const modify of [
    x => { x.startUtc = new Date(NOW - 1).toISOString(); },
    x => { x.endUtc = new Date(NOW + 6_000_000).toISOString(); },
    x => { x.endUtc = 'not-date'; },
    x => { x.startUtc = new Date(NOW + 15 * 86_400_000).toISOString(); }
  ]) {
    const x = window(4); modify(x);
    assert.equal(inspectQl250WindowProposal(x, { now: NOW }).status, 'DENIED_WINDOW_TIME');
  }
});

test('QL250 refuses forged or missing source reports, never treats public source proof as gateway proof', () => {
  const rows = QL247_SOURCES.map(s => ({ ...s, mainSha: 'a'.repeat(40),
    status: 'MISSING_PUBLIC_PROOF_AT_MAIN' }));
  const result = ql250SummarizeSourceRefresh(rows);
  assert.equal(result.observedMainShas.length, 6);
  assert.equal(result.independentlyAttestedSignerPins, 0);
  assert.equal(result.scheduledTestWindows, 0);
  assert.equal(result.realPilotHolds, 12);
  assert.equal(ql250SummarizeSourceRefresh(rows.slice(1)).status, 'DENIED_SOURCE_REFRESH_INPUT');
  assert.equal(ql250SummarizeSourceRefresh(rows.map(r => ({ ...r,
    status: 'CONNECTED' }))).status, 'DENIED_SOURCE_REFRESH_INPUT');
});

test('QL250 cURL transport only permits fixed public GitHub URLs without shell, secrets or redirects', async () => {
  const valid = 'https://api.github.com/repos/RosevearCreations/ai-data-platform/commits/main';
  let argv;
  const result = await ql250CurlPublic(valid, async (program, args, opts) => {
    argv = { program, args, opts };
    return { stdout: JSON.stringify({ ref: 'refs/heads/main',
      object: { sha: 'a'.repeat(40) } }) + '\n__QL250_HTTP_STATUS__200' };
  });
  assert.equal(result.status, 200);
  assert.equal(JSON.parse(result.body).sha, 'a'.repeat(40));
  assert.equal(argv.program, 'curl');
  assert.equal(argv.args[0], '-q');
  assert.equal(argv.args.at(-1), valid.replace('/commits/main', '/git/ref/heads/main'));
  assert.equal(argv.opts.shell, false);
  assert.equal(argv.args.includes('--max-redirs'), true);
  assert.equal(argv.args.includes('Authorization'), false);
  await assert.rejects(() => ql250CurlPublic('https://example.com/private',
    async () => { throw Error('SHOULD_NOT_RUN'); }), /DENIED_PUBLIC_GITHUB_URL/);
  await assert.rejects(() => ql250CurlPublic(valid, async () =>
    ({ stdout: 'redirect\n__QL250_HTTP_STATUS__302' })), /DENIED_HTTP_STATUS_OR_SIZE/);
  await assert.rejects(() => ql250CurlPublic(valid, async () =>
    ({ stdout: JSON.stringify({ ref: 'refs/heads/dev', object: { sha: 'a'.repeat(40) } }) +
       '\n__QL250_HTTP_STATUS__200' })), /DENIED_GITHUB_REF_SCOPE/);
  assert.deepEqual(await ql250CurlPublic(valid, async () =>
    ({ stdout: 'Not Found\n__QL250_HTTP_STATUS__404' })), { status: 404, body: null });
});
