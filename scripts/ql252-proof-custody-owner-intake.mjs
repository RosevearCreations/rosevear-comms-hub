/**
 * QL-252. Public source-proof escalation and strictly OFFLINE intake of
 * separately claimed pin provenance / owner TEST-ONLY decisions.
 * Cryptographic consistency is not independent identity verification.
 * No filesystem, network, keys, timers, GET scheduling or runtime mutations.
 */
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';
import { QL248_PATH } from './ql248-proof-commit-reconciliation.mjs';
import { inspectQl251WitnessReturn, inspectQl251LinkedReview }
  from './ql251-witness-return-test-authorization.mjs';

export const QL252_RELEASE = 'ql252-publication-escalation-custody-provenance-owner-test-intake-held-v1';
const SHA = /^[0-9a-f]{40}$/;
const HEX = /^[0-9a-f]{64}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/;
const PATHS = ['/api/integration/v1/health', '/api/integration/v1/capabilities'];
const PROVENANCE_FIELDS = ['schemaVersion', 'system', 'repository', 'businessId',
  'tenantId', 'sourceSha', 'proofSha', 'custodySpkiSha256', 'witnessSpkiSha256',
  'outOfBandChannel', 'pinReceiptId', 'verifierAlias', 'observedAtMs'];
const DECISION_FIELDS = ['schemaVersion', 'system', 'businessId', 'tenantId',
  'sourceSha', 'proofSha', 'witnessReceiptId', 'testRequestId',
  'ownerDecisionId', 'environment', 'methods', 'paths', 'startUtc', 'endUtc',
  'decision', 'issuedAtMs', 'expiresAtMs'];
const ENVELOPE_FIELDS = ['payload', 'publicKeyPem', 'signatureBase64Url'];
const OWNER_PIN_FIELDS = ['system', 'spkiSha256', 'provenanceReceiptId', 'channel'];
const exact = (obj, keys) => !!obj && typeof obj === 'object' && !Array.isArray(obj) &&
  Object.getPrototypeOf(obj) === Object.prototype &&
  Object.keys(obj).length === keys.length && Object.keys(obj).every(key => keys.includes(key));
const eq = (a, b) => HEX.test(a || '') && HEX.test(b || '') &&
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const hash = raw => createHash('sha256').update(raw).digest('hex');
const business = system => system === 'ai-data-platform' ? 'devilndove' : system;
const tenantOk = (system, tenant) => ['yw', 'icamp'].includes(system)
  ? typeof tenant === 'string' && ID.test(tenant) : tenant === null;
const hold = (status, reason, extra = {}) => Object.freeze({
  release: QL252_RELEASE, status, reason, ...extra,
  independentlyAuthenticatedPins: 0, authenticatedOwnerTestDecisions: 0,
  ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
  scheduledGatewayGets: 0, realGatewayGets: 0, connectionState: 'DISCONNECTED',
  realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0
});

/** Zero-network mapping from the *current* public GitHub observation. */
export function inspectQl252PublicationEscalation(rows) {
  if (!Array.isArray(rows) || rows.length !== QL247_SOURCES.length ||
    !QL247_SOURCES.every((s, i) => rows[i]?.system === s.system &&
      rows[i]?.repository === s.repository &&
      (rows[i].mainSha === null || SHA.test(rows[i].mainSha)) &&
      (rows[i].sourceSha == null || SHA.test(rows[i].sourceSha)) &&
      (rows[i].proofRawSha256 == null || HEX.test(rows[i].proofRawSha256))))
    return hold('DENIED_SOURCE_CENSUS', 'Expected the exact six ordered GitHub sources.');
  const queue = rows.map(r => {
    const status = r.status === 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD'
      ? 'PUBLIC_SOURCE_CI_SEEN_INDEPENDENT_PIN_PENDING_HELD'
      : r.status === 'MISSING_PUBLIC_PROOF_AT_MAIN'
        ? 'PUBLISH_SIGNED_PROOF_AT_EXACT_PATH_HELD'
        : r.status === 'NOT_FETCHED_NO_NETWORK_REQUESTED'
          ? 'NOT_RECHECKED_HELD' : 'PROOF_OR_CI_REPAIR_REQUIRED_HELD';
    return Object.freeze({ system: r.system, repository: r.repository,
      observedMainSha: r.mainSha, proofPath: QL248_PATH,
      proofRawSha256: r.proofRawSha256 ?? null, status,
      sourceCiVerified: status === 'PUBLIC_SOURCE_CI_SEEN_INDEPENDENT_PIN_PENDING_HELD' });
  });
  return hold('SIX_APP_PUBLICATION_ESCALATION_HELD',
    'Missing proof publication, origin/CI and independent custody cannot be replaced by a GREEN deployment.',
    { queue, sourceCiSeen: queue.filter(q => q.sourceCiVerified).length,
      missingProofs: queue.filter(q => q.status === 'PUBLISH_SIGNED_PROOF_AT_EXACT_PATH_HELD').length });
}

/** Validates an out-of-band custody *record claim*, not its real-world origin. */
export function inspectQl252CustodyProvenance(witnessPacket, provenance,
  { now = Date.now(), consumedChallengeIds = [] } = {}) {
  if (!exact(provenance, PROVENANCE_FIELDS) || !Number.isSafeInteger(now) || now <= 0)
    return hold('DENIED_PROVENANCE_SCHEMA', 'Exact bounded non-secret custody metadata required.');
  const source = QL247_SOURCES.find(s => s.system === provenance.system);
  const challenge = witnessPacket?.challenge;
  const witness = witnessPacket?.signedWitness?.payload;
  if (!source || provenance.schemaVersion !== 'rosevear.ql252.pin-provenance.v1' ||
    provenance.repository !== source.repository || provenance.businessId !== business(source.system) ||
    !tenantOk(source.system, provenance.tenantId) ||
    !SHA.test(provenance.sourceSha || '') || !SHA.test(provenance.proofSha || '') ||
    provenance.sourceSha === provenance.proofSha ||
    provenance.sourceSha !== challenge?.sourceSha || provenance.proofSha !== challenge?.proofSha ||
    provenance.tenantId !== challenge?.tenantId || provenance.tenantId !== witness?.tenantId ||
    provenance.custodySpkiSha256 !== witness?.custodyPublicSpkiSha256 ||
    provenance.custodySpkiSha256 !== witnessPacket?.custodyPin?.spkiSha256 ||
    provenance.witnessSpkiSha256 !== witnessPacket?.witnessPin?.spkiSha256 ||
    !HEX.test(provenance.custodySpkiSha256 || '') ||
    !HEX.test(provenance.witnessSpkiSha256 || '') ||
    eq(provenance.custodySpkiSha256, provenance.witnessSpkiSha256) ||
    !['PRIVATE_TRUST_REGISTRY', 'IN_PERSON_CUSTODY_REVIEW', 'VERIFIED_CALLBACK_RECORD'].includes(
      provenance.outOfBandChannel) ||
    !ID.test(provenance.pinReceiptId || '') ||
    !/^[a-z][a-z0-9_-]{5,70}$/.test(provenance.verifierAlias || '') ||
    !Number.isSafeInteger(provenance.observedAtMs) ||
    provenance.observedAtMs < challenge?.issuedAtMs ||
    provenance.observedAtMs > now + 30_000 ||
    provenance.observedAtMs >= challenge?.expiresAtMs)
    return hold('DENIED_PROVENANCE_SCOPE', 'Source, tenant, pin, verifier, channel or timestamp differs.');
  const upstream = inspectQl251WitnessReturn(witnessPacket, { now, consumedChallengeIds });
  if (upstream.status !== 'WITNESS_SIGNATURE_MATCHED_REAL_WORLD_PROVENANCE_UNVERIFIED_HELD')
    return hold('DENIED_PROVENANCE_UPSTREAM_WITNESS', 'A valid scoped custody witness claim is required.');
  return hold('PIN_PROVENANCE_METADATA_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD',
    'An asserted out-of-band channel and matching fingerprints are not independently authenticated key ownership.');
}

export function ql252OwnerDecisionBytes(payload) {
  if (!exact(payload, DECISION_FIELDS)) throw new TypeError('DENIED_OWNER_DECISION_SCHEMA');
  return Buffer.from('rosevear.ql252.owner-test-only-review-decision.v1\n' +
    DECISION_FIELDS.map(key => JSON.stringify([key, payload[key]])).join('\n'), 'utf8');
}

/** Signed test-only decision *claim*; a real owner's independently verified consent is still absent. */
export function inspectQl252OwnerTestDecision(packet,
  { now = Date.now(), consumedChallengeIds = [] } = {}) {
  if (!exact(packet, ['witnessPacket', 'testRequestPacket', 'custodyProvenance',
    'ownerDecisionEnvelope', 'ownerPin']) ||
    !exact(packet.ownerDecisionEnvelope, ENVELOPE_FIELDS) ||
    !exact(packet.ownerDecisionEnvelope.payload, DECISION_FIELDS) ||
    !exact(packet.ownerPin, OWNER_PIN_FIELDS) || !Number.isSafeInteger(now) || now <= 0)
    return hold('DENIED_OWNER_DECISION_SCHEMA', 'Exact offline decision and independent review chain required.');
  const linked = inspectQl251LinkedReview({ witnessPacket: packet.witnessPacket,
    testRequestPacket: packet.testRequestPacket }, { now, consumedChallengeIds });
  if (linked.status !== 'WITNESS_AND_TEST_REQUEST_LINKED_ONLY_OWNER_TEST_HELD')
    return hold('DENIED_OWNER_DECISION_UPSTREAM_REVIEW', 'Witness and test request must match.');
  const provenance = inspectQl252CustodyProvenance(packet.witnessPacket,
    packet.custodyProvenance, { now, consumedChallengeIds });
  if (provenance.status !== 'PIN_PROVENANCE_METADATA_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD')
    return hold('DENIED_OWNER_DECISION_PROVENANCE', 'Claimed independent custody metadata failed verification.');
  const p = packet.ownerDecisionEnvelope.payload;
  const t = packet.testRequestPacket.signedRequest.payload;
  if (!QL247_SOURCES.some(s => s.system === p.system) ||
    p.schemaVersion !== 'rosevear.ql252.owner-test-decision.v1' ||
    p.system !== t.system || p.businessId !== t.businessId || p.tenantId !== t.tenantId ||
    p.sourceSha !== t.sourceSha || p.proofSha !== t.proofSha ||
    p.witnessReceiptId !== t.witnessReceiptId || p.testRequestId !== t.testRequestId ||
    !ID.test(p.ownerDecisionId || '') ||
    p.environment !== 'nonproduction' || JSON.stringify(p.methods) !== '["GET"]' ||
    JSON.stringify(p.paths) !== JSON.stringify(PATHS) ||
    p.startUtc !== t.startUtc || p.endUtc !== t.endUtc ||
    !['APPROVE_TEST_ONLY_REVIEW_CLAIM', 'DECLINE_TEST_ONLY_REVIEW_CLAIM'].includes(p.decision) ||
    !Number.isSafeInteger(p.issuedAtMs) || !Number.isSafeInteger(p.expiresAtMs) ||
    p.issuedAtMs > now + 30_000 || p.expiresAtMs <= now ||
    p.expiresAtMs <= p.issuedAtMs || p.expiresAtMs - p.issuedAtMs > 300_000)
    return hold('DENIED_OWNER_DECISION_SCOPE', 'Approval claim is stale, cross-app, cross-tenant, non-GET or pilot-wide.');
  const pin = packet.ownerPin;
  if (pin.system !== p.system || !HEX.test(pin.spkiSha256 || '') ||
    !ID.test(pin.provenanceReceiptId || '') ||
    pin.channel !== 'PRIVATE_OWNER_IDENTITY_VERIFICATION_PENDING' ||
    [packet.custodyProvenance.custodySpkiSha256,
      packet.custodyProvenance.witnessSpkiSha256,
      packet.testRequestPacket.requestPin.spkiSha256].some(key => eq(key, pin.spkiSha256)))
    return hold('DENIED_OWNER_PIN_ROLE_ISOLATION', 'Owner reviewer needs a distinct independently verified key and identity.');
  const signed = packet.ownerDecisionEnvelope;
  if (typeof signed.publicKeyPem !== 'string' || signed.publicKeyPem.length > 2048 ||
    !SIGNATURE.test(signed.signatureBase64Url || ''))
    return hold('DENIED_OWNER_DECISION_SIGNATURE', 'Malformed owner decision signature.');
  try {
    const key = createPublicKey(signed.publicKeyPem);
    if (key.asymmetricKeyType !== 'ed25519' ||
      !eq(hash(key.export({ type: 'spki', format: 'der' })), pin.spkiSha256) ||
      !verify(null, ql252OwnerDecisionBytes(p), key,
        Buffer.from(signed.signatureBase64Url, 'base64url')))
      return hold('DENIED_OWNER_DECISION_SIGNATURE', 'Owner decision signature or separately supplied pin mismatched.');
  } catch {
    return hold('DENIED_OWNER_DECISION_SIGNATURE', 'Invalid Ed25519 owner decision evidence.');
  }
  return hold(p.decision === 'DECLINE_TEST_ONLY_REVIEW_CLAIM'
    ? 'SIGNED_TEST_ONLY_DECLINE_CLAIM_AUTHORITY_UNVERIFIED_HELD'
    : 'SIGNED_TEST_ONLY_APPROVAL_CLAIM_AUTHORITY_UNVERIFIED_HELD',
  'Signature consistency is not actual owner consent; independent identity, signed source proof, original gateway audit and separate runner authorization remain required.');
}
