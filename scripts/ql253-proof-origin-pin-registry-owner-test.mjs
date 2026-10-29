/**
 * QL-253: read-only, fail-closed reconciliation of public source origin, an
 * independently *claimed* pin registry challenge and an owner TEST-only
 * exception. Neither public GitHub nor offline packet matching grants authority.
 * This module has no network, storage, gateway, scheduler or provider access.
 */
import { timingSafeEqual } from 'node:crypto';
import { QL247_SOURCES, QL247_PATH } from './ql247-six-app-github-census.mjs';

export const QL253_RELEASE = 'ql253-six-app-origin-pin-registry-owner-test-exception-held-v1';
const SHA = /^[0-9a-f]{40}$/;
const HEX = /^[0-9a-f]{64}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const METHODS = ['GET'];
const PATHS = ['/api/integration/v1/health', '/api/integration/v1/capabilities'];
const PIN_FIELDS = ['schemaVersion', 'system', 'repository', 'sourceSha', 'proofSha',
  'businessId', 'tenantId', 'challengeId', 'nonceBase64Url', 'issuedAtMs',
  'expiresAtMs', 'presentedSpkiSha256', 'registrySpkiSha256',
  'registrySnapshotSha256', 'registryReceiptId', 'custodyReceiptId',
  'independentWitnessReceiptId', 'independentVerifierAlias', 'channel',
  'observedAtMs'];
const OWNER_FIELDS = ['schemaVersion', 'system', 'businessId', 'tenantId',
  'sourceSha', 'proofSha', 'registryReceiptId', 'ownerTestDecision',
  'ownerTestReceiptId', 'environment', 'methods', 'paths', 'startUtc', 'endUtc'];
const exact = (v, fields) => !!v && typeof v === 'object' && !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype &&
  Object.keys(v).length === fields.length &&
  Object.keys(v).every(x => fields.includes(x));
const equalHex = (a, b) => HEX.test(a || '') && HEX.test(b || '') &&
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const business = system => system === 'ai-data-platform' ? 'devilndove' : system;
const tenantOk = (system, tenant) => ['yw', 'icamp'].includes(system)
  ? ID.test(tenant || '') : tenant === null;
const hold = (status, reason, extra = {}) => Object.freeze({
  release: QL253_RELEASE, status, reason, ...extra,
  independentlyTrustedPins: 0, authenticatedOwnerTestApprovals: 0,
  ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
  connectionState: 'DISCONNECTED', phaseB: 'HELD',
  realGatewayGets: 0, scheduledGatewayGets: 0, realPilotHolds: 12,
  writes: 0, calls: 0, sms: 0, dispatch: 0
});

/**
 * The upstream QL-249 checker already validates a self-signature, exact
 * public GitHub CI SHA and A->B ancestry when those bytes exist. QL-253
 * preserves that result, but will not equate public origin with trusted pins.
 */
export function reconcileQl253SixAppOrigins(rows) {
  if (!Array.isArray(rows) || rows.length !== QL247_SOURCES.length ||
    !QL247_SOURCES.every((s, i) => rows[i]?.system === s.system &&
      rows[i]?.repository === s.repository &&
      (rows[i].mainSha === null || SHA.test(rows[i].mainSha)) &&
      (rows[i].sourceSha == null || SHA.test(rows[i].sourceSha)) &&
      (rows[i].proofRawSha256 == null || HEX.test(rows[i].proofRawSha256))))
    return hold('DENIED_SIX_APP_SOURCE_SCOPE', 'Six ordered known source records required.');
  const results = rows.map(r => {
    const status = r.status === 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD'
      ? 'ORIGIN_AND_EXACT_CI_PUBLICLY_OBSERVED_PIN_REGISTRY_HELD'
      : r.status === 'MISSING_PUBLIC_PROOF_AT_MAIN'
        ? 'IMMUTABLE_SIGNED_SOURCE_PROOF_404_HELD'
        : r.status === 'NOT_FETCHED_NO_NETWORK_REQUESTED'
          ? 'NO_NETWORK_RECHECK_REQUESTED_HELD'
          : 'PUBLIC_PROOF_ORIGIN_CI_EXCEPTION_HELD';
    return Object.freeze({ system: r.system, repository: r.repository,
      observedMainSha: r.mainSha, sourceShaA: r.sourceSha,
      rawProofSha256: r.proofRawSha256, proofPath: QL247_PATH, status });
  });
  return hold('SIX_APP_PROOF_ORIGIN_AND_TRUST_RECONCILIATION_HELD',
    'Public GitHub source and CI cannot substitute for independent signer custody or authenticated owner TEST-only approval.',
    { rows: Object.freeze(results), observedPublicOriginCount:
      results.filter(r => r.status === 'ORIGIN_AND_EXACT_CI_PUBLICLY_OBSERVED_PIN_REGISTRY_HELD').length,
    publishedProof404Count: results.filter(r => r.status === 'IMMUTABLE_SIGNED_SOURCE_PROOF_404_HELD').length });
}

/**
 * Binds a fresh 5-minute pin-registry claim to a publicly observed A/B origin.
 * A matching claim still needs real independent out-of-band verification.
 */
export function inspectQl253PinRegistryChallenge(origin, packet,
  { now = Date.now(), consumedChallengeIds = [] } = {}) {
  if (!exact(packet, PIN_FIELDS) || !Number.isSafeInteger(now) || now <= 0 ||
    !Array.isArray(consumedChallengeIds))
    return hold('DENIED_REGISTRY_PACKET_SCHEMA', 'Exact non-secret registry claim and clock required.');
  const source = QL247_SOURCES.find(s => s.system === packet.system);
  if (!source || packet.schemaVersion !== 'rosevear.ql253.pin-registry-renewal.v1' ||
    packet.repository !== source.repository || packet.businessId !== business(source.system) ||
    !tenantOk(source.system, packet.tenantId) ||
    origin?.system !== source.system || origin?.repository !== source.repository ||
    origin?.status !== 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD' ||
    !SHA.test(packet.sourceSha || '') || !SHA.test(packet.proofSha || '') ||
    packet.sourceSha === packet.proofSha || packet.sourceSha !== origin.sourceSha ||
    packet.proofSha !== origin.mainSha ||
    !equalHex(packet.presentedSpkiSha256, packet.registrySpkiSha256) ||
    !HEX.test(packet.registrySnapshotSha256 || '') ||
    !ID.test(packet.challengeId || '') || consumedChallengeIds.includes(packet.challengeId) ||
    !ID.test(packet.registryReceiptId || '') || !ID.test(packet.custodyReceiptId || '') ||
    !ID.test(packet.independentWitnessReceiptId || '') ||
    new Set([packet.registryReceiptId, packet.custodyReceiptId,
      packet.independentWitnessReceiptId]).size !== 3 ||
    !/^[a-z][a-z0-9_-]{5,70}$/.test(packet.independentVerifierAlias || '') ||
    !['PRIVATE_TRUST_REGISTRY', 'IN_PERSON_CUSTODY_REVIEW', 'VERIFIED_CALLBACK_RECORD']
      .includes(packet.channel) ||
    typeof packet.nonceBase64Url !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(packet.nonceBase64Url) ||
    Buffer.from(packet.nonceBase64Url, 'base64url').length !== 32 ||
    !Number.isSafeInteger(packet.issuedAtMs) || !Number.isSafeInteger(packet.expiresAtMs) ||
    !Number.isSafeInteger(packet.observedAtMs) || packet.issuedAtMs > now + 30_000 ||
    packet.expiresAtMs <= now || packet.expiresAtMs <= packet.issuedAtMs ||
    packet.expiresAtMs - packet.issuedAtMs > 300_000 ||
    packet.observedAtMs < packet.issuedAtMs || packet.observedAtMs > now + 30_000 ||
    packet.observedAtMs >= packet.expiresAtMs)
    return hold('DENIED_PIN_ORIGIN_CUSTODY_SCOPE_OR_REPLAY',
      'A/B, tenant, pin, distinct receipts, freshness or independent channel claim is invalid.');
  return hold('PIN_REGISTRY_METADATA_MATCHED_INDEPENDENT_CUSTODY_STILL_HELD',
    'A digest and claimed out-of-band witness cannot authenticate a real custodian or private registry.',
    { registryReceiptId: packet.registryReceiptId, system: packet.system,
      tenantId: packet.tenantId, sourceSha: packet.sourceSha, proofSha: packet.proofSha });
}

/** Public owner decision is only an intake claim; cannot approve a GET or pilot. */
export function inspectQl253OwnerTestException(origin, pinResult, review, { now = Date.now() } = {}) {
  if (!exact(review, OWNER_FIELDS) || !Number.isSafeInteger(now) || now <= 0)
    return hold('DENIED_OWNER_EXCEPTION_SCHEMA', 'Exact non-secret TEST-only exception record required.');
  const source = QL247_SOURCES.find(s => s.system === review.system);
  if (!source || review.schemaVersion !== 'rosevear.ql253.owner-test-exception.v1' ||
    review.businessId !== business(source.system) || !tenantOk(source.system, review.tenantId) ||
    origin?.system !== source.system || origin?.repository !== source.repository ||
    !SHA.test(review.sourceSha || '') || !SHA.test(review.proofSha || '') ||
    origin.sourceSha !== review.sourceSha || origin.mainSha !== review.proofSha ||
    !ID.test(review.registryReceiptId || '') ||
    review.environment !== 'nonproduction' ||
    JSON.stringify(review.methods) !== JSON.stringify(METHODS) ||
    JSON.stringify(review.paths) !== JSON.stringify(PATHS) ||
    !['NOT_GIVEN', 'REQUESTED_PRIVATE_REVIEW'].includes(review.ownerTestDecision) ||
    review.ownerTestReceiptId !== 'NOT_AVAILABLE' ||
    typeof review.startUtc !== 'string' || typeof review.endUtc !== 'string' ||
    !Number.isFinite(Date.parse(review.startUtc)) ||
    !Number.isFinite(Date.parse(review.endUtc)) ||
    Date.parse(review.startUtc) <= now || Date.parse(review.endUtc) <= Date.parse(review.startUtc) ||
    Date.parse(review.endUtc) - Date.parse(review.startUtc) > 1_800_000)
    return hold('DENIED_OWNER_TEST_SCOPE_OR_FALSE_APPROVAL',
      'Wrong business, tenant, time window, method, path or fabricated owner approval.');
  if (pinResult?.status !== 'PIN_REGISTRY_METADATA_MATCHED_INDEPENDENT_CUSTODY_STILL_HELD' ||
    pinResult.registryReceiptId !== review.registryReceiptId ||
    pinResult.system !== review.system || pinResult.tenantId !== review.tenantId ||
    pinResult.sourceSha !== review.sourceSha || pinResult.proofSha !== review.proofSha)
    return hold('PUBLIC_PROOF_OR_PRIVATE_PIN_EXCEPTION_STILL_HELD',
      'The source and privately witnessed key must pass separate independent review.');
  return hold('OWNER_TEST_ONLY_REVIEW_REQUEST_CLAIM_PENDING_PRIVATE_VERIFICATION_HELD',
    'An owner-review request or public approval claim cannot authenticate the owner or schedule gateway GETs.');
}

/** Private hub is an optional later transport, not a shortcut around trust. */
export function inspectQl253PrivateMiniServerProposal(proposal) {
  const fields = ['hostRole', 'transport', 'publicInbound', 'homeVaultExposure',
    'gatewayEnabled', 'credentialExchangeEnabled', 'ownerPilotApproved'];
  if (!exact(proposal, fields) || proposal.hostRole !== 'PRIVATE_RELAY_CANDIDATE' ||
    proposal.transport !== 'TAILSCALE_OR_PRIVATE_LAN' ||
    proposal.publicInbound !== false || proposal.homeVaultExposure !== false ||
    proposal.gatewayEnabled !== false || proposal.credentialExchangeEnabled !== false ||
    proposal.ownerPilotApproved !== false)
    return hold('DENIED_PRIVATE_MINI_SERVER_SCOPE',
      'Private relay must be separately authorized and cannot expose home/vault devices or open inbound ports.');
  return hold('PRIVATE_24_7_RELAY_DESIGN_ONLY_HELD',
    'Rosevear AI Hub PC is a possible private 24/7 relay; no host access, services or credentials are activated.');
}
