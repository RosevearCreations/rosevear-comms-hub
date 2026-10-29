import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { inspectQl249GithubOrigins } from '../ql249-public-github-origin-retest.mjs';
import { reconcileQl253SixAppOrigins, inspectQl253PinRegistryChallenge,
  inspectQl253OwnerTestException, inspectQl253PrivateMiniServerProposal }
  from '../ql253-proof-origin-pin-registry-owner-test.mjs';

const NOW = Date.UTC(2026, 9, 29, 3);
const origin = i => ({ ...QL247_SOURCES[i], mainSha: 'b'.repeat(40),
  sourceSha: 'a'.repeat(40), proofRawSha256: 'c'.repeat(64),
  status: 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD' });
function pinPacket(i = 4) {
  const s = QL247_SOURCES[i];
  return { schemaVersion: 'rosevear.ql253.pin-registry-renewal.v1',
    system: s.system, repository: s.repository, sourceSha: 'a'.repeat(40),
    proofSha: 'b'.repeat(40), businessId: s.system === 'ai-data-platform' ? 'devilndove' : s.system,
    tenantId: ['yw','icamp'].includes(s.system) ? 'np-ql253-camp-tenant' : null,
    challengeId: 'np-ql253-challenge-001',
    nonceBase64Url: randomBytes(32).toString('base64url'), issuedAtMs: NOW - 1000,
    expiresAtMs: NOW + 100000, presentedSpkiSha256: 'd'.repeat(64),
    registrySpkiSha256: 'd'.repeat(64), registrySnapshotSha256: 'e'.repeat(64),
    registryReceiptId: 'np-ql253-registry-001',
    custodyReceiptId: 'np-ql253-custody-001',
    independentWitnessReceiptId: 'np-ql253-witness-001',
    independentVerifierAlias: 'trusted_reviewer',
    channel: 'PRIVATE_TRUST_REGISTRY', observedAtMs: NOW - 500 };
}
function ownerReview(i = 4) {
  const p = pinPacket(i);
  return { schemaVersion: 'rosevear.ql253.owner-test-exception.v1',
    system: p.system, businessId: p.businessId, tenantId: p.tenantId,
    sourceSha: p.sourceSha, proofSha: p.proofSha,
    registryReceiptId: p.registryReceiptId, ownerTestDecision: 'REQUESTED_PRIVATE_REVIEW',
    ownerTestReceiptId: 'NOT_AVAILABLE', environment: 'nonproduction',
    methods: ['GET'], paths: ['/api/integration/v1/health',
      '/api/integration/v1/capabilities'],
    startUtc: new Date(NOW + 60000).toISOString(),
    endUtc: new Date(NOW + 120000).toISOString() };
}

test('QL253 six-app immutable source proof 404 remains disconnected', () => {
  const rows = QL247_SOURCES.map(s => ({ ...s, mainSha: 'f'.repeat(40),
    sourceSha: null, proofRawSha256: null, status: 'MISSING_PUBLIC_PROOF_AT_MAIN' }));
  const result = reconcileQl253SixAppOrigins(rows);
  assert.equal(result.publishedProof404Count, 6);
  assert.equal(result.observedPublicOriginCount, 0);
  assert.equal(result.rows.length, 6);
  assert.ok(result.rows.every(r => r.status === 'IMMUTABLE_SIGNED_SOURCE_PROOF_404_HELD'));
  assert.equal(result.connectionState, 'DISCONNECTED');
  assert.equal(result.realGatewayGets, 0);
  assert.equal(result.realPilotHolds, 12);
});

test('QL253 no-network default never infers a 404', async () => {
  const observed = await inspectQl249GithubOrigins();
  const result = reconcileQl253SixAppOrigins(observed.rows);
  assert.ok(result.rows.every(r => r.status === 'NO_NETWORK_RECHECK_REQUESTED_HELD'));
  assert.equal(result.publishedProof404Count, 0);
  assert.equal(reconcileQl253SixAppOrigins(observed.rows.slice(1)).status,
    'DENIED_SIX_APP_SOURCE_SCOPE');
  const swapped = structuredClone(observed.rows);
  swapped[1].repository = 'unknown';
  assert.equal(reconcileQl253SixAppOrigins(swapped).status,
    'DENIED_SIX_APP_SOURCE_SCOPE');
});

test('QL253 independent public A/B and CI can only reach pin-registry held state', () => {
  const result = reconcileQl253SixAppOrigins(QL247_SOURCES.map((_, i) => origin(i)));
  assert.equal(result.observedPublicOriginCount, 6);
  assert.equal(result.independentlyTrustedPins, 0);
  assert.equal(result.ownerTestAuthorization, 'NOT_GIVEN');
});

test('QL253 private registry metadata match still does not independently verify a custodian', () => {
  for (let i = 0; i < 6; i++) {
    const review = inspectQl253PinRegistryChallenge(origin(i), pinPacket(i), { now: NOW });
    assert.equal(review.status, 'PIN_REGISTRY_METADATA_MATCHED_INDEPENDENT_CUSTODY_STILL_HELD');
    assert.equal(review.independentlyTrustedPins, 0);
    assert.equal(review.realGatewayGets, 0);
  }
});

test('QL253 rejects registry replay, wrong tenant, expired nonce, self-asserted channel and swapped source', () => {
  const p = pinPacket(4);
  const valid = 'PIN_REGISTRY_METADATA_MATCHED_INDEPENDENT_CUSTODY_STILL_HELD';
  assert.notEqual(inspectQl253PinRegistryChallenge(origin(4), p,
    { now: NOW, consumedChallengeIds: [p.challengeId] }).status, valid);
  for (const mutate of [
    x => { x.tenantId = 'np-other'; },
    x => { x.sourceSha = 'f'.repeat(40); },
    x => { x.registrySpkiSha256 = 'e'.repeat(64); },
    x => { x.channel = 'PUBLIC_GITHUB_SELF_ATTESTED'; },
    x => { x.expiresAtMs = NOW - 1; },
    x => { x.independentWitnessReceiptId = x.registryReceiptId; },
    x => { x.privateKey = 'never'; }
  ]) {
    const copy = structuredClone(p); mutate(copy);
    assert.notEqual(inspectQl253PinRegistryChallenge(origin(4), copy, { now: NOW }).status, valid);
  }
});

test('QL253 owner TEST-only request stays HELD and cannot forge approval or broaden GET scope', () => {
  const pin = inspectQl253PinRegistryChallenge(origin(4), pinPacket(4), { now: NOW });
  const claim = ownerReview(4);
  const review = inspectQl253OwnerTestException(origin(4), pin, claim, { now: NOW });
  assert.equal(review.status, 'OWNER_TEST_ONLY_REVIEW_REQUEST_CLAIM_PENDING_PRIVATE_VERIFICATION_HELD');
  assert.equal(review.authenticatedOwnerTestApprovals, 0);
  assert.equal(review.scheduledGatewayGets, 0);
  for (const mutate of [
    x => { x.ownerTestDecision = 'INDEPENDENTLY_VERIFIED_BY_OWNER'; },
    x => { x.ownerTestReceiptId = 'np-fake'; },
    x => { x.methods = ['POST']; },
    x => { x.paths = ['/api/private/vault']; },
    x => { x.tenantId = 'np-foreign'; },
    x => { x.endUtc = new Date(NOW + 40*60000).toISOString(); },
    x => { x.secret = 'not-allowed'; }
  ]) {
    const copy = structuredClone(claim); mutate(copy);
    assert.ok(['DENIED_OWNER_TEST_SCOPE_OR_FALSE_APPROVAL', 'DENIED_OWNER_EXCEPTION_SCHEMA',
      'PUBLIC_PROOF_OR_PRIVATE_PIN_EXCEPTION_STILL_HELD']
      .includes(inspectQl253OwnerTestException(origin(4), pin, copy, { now: NOW }).status));
  }
  assert.equal(inspectQl253OwnerTestException(origin(4), pin,
    { ...claim, registryReceiptId: 'np-different-registry' }, { now: NOW }).status,
  'PUBLIC_PROOF_OR_PRIVATE_PIN_EXCEPTION_STILL_HELD');
});

test('QL253 a missing trusted pin cannot become an owner test decision', () => {
  const claim = ownerReview(4);
  const r = inspectQl253OwnerTestException(origin(4), null, claim, { now: NOW });
  assert.equal(r.status, 'PUBLIC_PROOF_OR_PRIVATE_PIN_EXCEPTION_STILL_HELD');
  assert.equal(r.ownerTestAuthorization, 'NOT_GIVEN');
});

test('QL253 AI Hub 24/7 private mini-server proposal is design-only and fail closed', () => {
  const proposal = { hostRole: 'PRIVATE_RELAY_CANDIDATE',
    transport: 'TAILSCALE_OR_PRIVATE_LAN', publicInbound: false,
    homeVaultExposure: false, gatewayEnabled: false,
    credentialExchangeEnabled: false, ownerPilotApproved: false };
  const r = inspectQl253PrivateMiniServerProposal(proposal);
  assert.equal(r.status, 'PRIVATE_24_7_RELAY_DESIGN_ONLY_HELD');
  assert.equal(r.connectionState, 'DISCONNECTED');
  for (const mutate of [
    p => { p.publicInbound = true; },
    p => { p.homeVaultExposure = true; },
    p => { p.gatewayEnabled = true; },
    p => { p.ownerPilotApproved = true; }
  ]) {
    const invalid = structuredClone(proposal); mutate(invalid);
    assert.equal(inspectQl253PrivateMiniServerProposal(invalid).status,
      'DENIED_PRIVATE_MINI_SERVER_SCOPE');
  }
});
