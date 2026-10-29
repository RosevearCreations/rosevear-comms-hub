/**
 * QL-254: offline-only immutable proof follow-up, signed independent-witness
 * claim comparison and reversible private mini-server rehearsal. No network,
 * owner authorization, secrets, private host access, timers or live services.
 */
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { QL247_SOURCES } from './ql247-six-app-github-census.mjs';
import { QL253_SOURCES_SNAPSHOT } from './ql254-source-snapshot.mjs';
import { inspectQl253PinRegistryChallenge }
  from './ql253-proof-origin-pin-registry-owner-test.mjs';

export const QL254_RELEASE = 'ql254-original-proof-witness-private-relay-readiness-held-v1';
const SHA = /^[a-f0-9]{40}$/;
const HEX = /^[a-f0-9]{64}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const SIG = /^[A-Za-z0-9_-]{86}$/;
const exact = (o, fields) => !!o && typeof o === 'object' && !Array.isArray(o) &&
  Object.getPrototypeOf(o) === Object.prototype && Object.keys(o).length === fields.length &&
  Object.keys(o).every(key => fields.includes(key));
const sha256 = v => createHash('sha256').update(v).digest('hex');
const equal = (a, b) => HEX.test(a || '') && HEX.test(b || '') &&
  timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
const business = system => system === 'ai-data-platform' ? 'devilndove' : system;
const tenantOk = (system, tenant) => ['yw', 'icamp'].includes(system)
  ? ID.test(tenant || '') : tenant === null;
const held = (status, reason, extra = {}) => Object.freeze({
  release: QL254_RELEASE, status, reason, ...extra,
  independentlyTrustedWitnesses: 0, trustedSourcePins: 0, authenticatedOwnerTests: 0,
  ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
  connectionState: 'DISCONNECTED', phaseB: 'HELD', realGatewayGets: 0,
  scheduledGatewayGets: 0, privateRelayEnabled: false, livePilotHolds: 12,
  writes: 0, calls: 0, sms: 0, dispatch: 0
});

/** Compare a fresh *observed* six-app GitHub census with the dated QL-253 one. */
export function inspectQl254SixAppFollowup(rows, previous = QL253_SOURCES_SNAPSHOT) {
  if (!Array.isArray(rows) || !Array.isArray(previous) || rows.length !== 6 || previous.length !== 6 ||
    !QL247_SOURCES.every((s, i) => rows[i]?.system === s.system &&
      rows[i]?.repository === s.repository && previous[i]?.system === s.system &&
      previous[i]?.repository === s.repository && SHA.test(previous[i].mainSha) &&
      (rows[i].mainSha === null || SHA.test(rows[i].mainSha)) &&
      (rows[i].sourceSha == null || SHA.test(rows[i].sourceSha)) &&
      (rows[i].proofRawSha256 == null || HEX.test(rows[i].proofRawSha256))))
    return held('DENIED_SIX_APP_FOLLOWUP_SCOPE', 'Six correctly ordered immutable GitHub source records required.');
  const queue = rows.map((r, i) => {
    const result = r.status === 'MISSING_PUBLIC_PROOF_AT_MAIN'
      ? r.mainSha !== previous[i].mainSha ? 'SOURCE_ADVANCED_PROOF_STILL_404_HELD' : 'SAME_SOURCE_PROOF_STILL_404_HELD'
      : r.status === 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD'
        ? 'PUBLIC_A_B_CI_VERIFIED_PRIVATE_TRUST_HELD'
        : r.status === 'NOT_FETCHED_NO_NETWORK_REQUESTED'
          ? 'NO_PUBLIC_RECHECK_REQUESTED_HELD' : 'ORIGIN_OR_PROOF_EXCEPTION_HELD';
    return Object.freeze({ system: r.system, repository: r.repository,
      previousMainSha: previous[i].mainSha, observedMainSha: r.mainSha,
      sourceShaA: r.sourceSha ?? null, proofSha256: r.proofRawSha256 ?? null,
      status: result });
  });
  return held('SIX_APP_PROOF_FOLLOWUP_QUEUE_HELD',
    'Original public source proof, independent key custody and actual owner TEST approval are separate gates.',
    { queue: Object.freeze(queue), stillMissingProofs: queue.filter(x => x.status.endsWith('PROOF_STILL_404_HELD')).length,
      publicAandCiObserved: queue.filter(x => x.status === 'PUBLIC_A_B_CI_VERIFIED_PRIVATE_TRUST_HELD').length });
}

const WITNESS_FIELDS = ['schemaVersion', 'system', 'repository', 'businessId', 'tenantId',
  'sourceSha', 'proofSha', 'registryReceiptId', 'custodyReceiptId', 'witnessReceiptId',
  'registrySnapshotSha256', 'custodySpkiSha256', 'witnessSpkiSha256',
  'challengeId', 'nonceSha256', 'witnessedAtMs', 'observation'];
const ENVELOPE_FIELDS = ['payload', 'publicKeyPem', 'signatureBase64Url'];
const PIN_FIELDS = ['system', 'spkiSha256', 'provenanceReceiptId'];

export function ql254WitnessCanonicalBytes(payload) {
  if (!exact(payload, WITNESS_FIELDS)) throw new TypeError('DENIED_WITNESS_PAYLOAD_SCHEMA');
  return Buffer.from('rosevear.ql254.private-pin-witness.v1\n' +
    WITNESS_FIELDS.map(field => JSON.stringify([field, payload[field]])).join('\n'), 'utf8');
}

/** A valid signature here is a candidate receipt, NOT real independent custody. */
export function inspectQl254PrivateRegistryWitness(origin, registryPacket, signedWitness,
  witnessPin, { now = Date.now(), consumedChallengeIds = [] } = {}) {
  if (!exact(signedWitness, ENVELOPE_FIELDS) ||
    !exact(signedWitness.payload, WITNESS_FIELDS) || !exact(witnessPin, PIN_FIELDS) ||
    !Number.isSafeInteger(now) || now <= 0)
    return held('DENIED_PRIVATE_WITNESS_SCHEMA', 'Exact signed, non-secret witness claim required.');
  const r = inspectQl253PinRegistryChallenge(origin, registryPacket,
    { now, consumedChallengeIds });
  if (r.status !== 'PIN_REGISTRY_METADATA_MATCHED_INDEPENDENT_CUSTODY_STILL_HELD')
    return held('DENIED_PRIVATE_WITNESS_UPSTREAM_ORIGIN', 'The original A/B source and renewed registry challenge must match.');
  const p = signedWitness.payload;
  const source = QL247_SOURCES.find(s => s.system === p.system);
  if (!source || p.schemaVersion !== 'rosevear.ql254.private-pin-witness.v1' ||
    p.repository !== source.repository || p.businessId !== business(source.system) ||
    !tenantOk(source.system, p.tenantId) || p.tenantId !== registryPacket.tenantId ||
    p.sourceSha !== registryPacket.sourceSha || p.proofSha !== registryPacket.proofSha ||
    p.registryReceiptId !== registryPacket.registryReceiptId ||
    p.custodyReceiptId !== registryPacket.custodyReceiptId ||
    p.witnessReceiptId !== registryPacket.independentWitnessReceiptId ||
    p.challengeId !== registryPacket.challengeId ||
    !equal(p.registrySnapshotSha256, registryPacket.registrySnapshotSha256) ||
    !equal(p.custodySpkiSha256, registryPacket.registrySpkiSha256) ||
    !equal(p.nonceSha256, sha256(Buffer.from(registryPacket.nonceBase64Url, 'base64url'))) ||
    !HEX.test(p.witnessSpkiSha256 || '') ||
    equal(p.witnessSpkiSha256, p.custodySpkiSha256) ||
    p.observation !== 'OFFLINE_REGISTRY_KEY_CONTROL_OBSERVED_ONLY' ||
    !Number.isSafeInteger(p.witnessedAtMs) ||
    p.witnessedAtMs < registryPacket.issuedAtMs ||
    p.witnessedAtMs >= registryPacket.expiresAtMs || p.witnessedAtMs > now + 30_000 ||
    witnessPin.system !== p.system || !equal(witnessPin.spkiSha256, p.witnessSpkiSha256) ||
    !ID.test(witnessPin.provenanceReceiptId || '') ||
    witnessPin.provenanceReceiptId === p.witnessReceiptId ||
    typeof signedWitness.publicKeyPem !== 'string' || signedWitness.publicKeyPem.length > 2048 ||
    !SIG.test(signedWitness.signatureBase64Url || ''))
    return held('DENIED_PRIVATE_WITNESS_ROLE_TENANT_FRESHNESS',
      'Witness must be distinct and bound to exact source, registry, tenant, nonce and receipt.');
  try {
    const key = createPublicKey(signedWitness.publicKeyPem);
    const digest = sha256(key.export({ type: 'spki', format: 'der' }));
    if (key.asymmetricKeyType !== 'ed25519' || !equal(digest, witnessPin.spkiSha256) ||
      !verify(null, ql254WitnessCanonicalBytes(p), key,
        Buffer.from(signedWitness.signatureBase64Url, 'base64url')))
      return held('DENIED_PRIVATE_WITNESS_SIGNATURE', 'Signature or separately supplied public witness pin differs.');
  } catch { return held('DENIED_PRIVATE_WITNESS_SIGNATURE', 'Invalid witness signing key or signature.'); }
  return held('PRIVATE_REGISTRY_WITNESS_SIGNATURE_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD',
    'Original signed witness metadata matches cryptographically. Independent private custodian identity and owner permission are not established.');
}

const RELAY_FIELDS = ['schemaVersion', 'role', 'transport', 'serviceEnabled',
  'publicInbound', 'outboundOnly', 'restrictToGatewayApi', 'tenantIsolation',
  'vaultAndCameraAccess', 'secretsInRepository', 'credentialExchangeEnabled',
  'ownerTestAuthorized', 'ownerPilotAuthorized', 'stopProcedureRecorded',
  'restoreProcedureRecorded', 'watchdogIntervalSeconds', 'rehearsalId'];
const EVENT_FIELDS = ['step', 'atMs', 'serviceActuallyStarted'];
const STEPS = ['BASELINE_DISABLED', 'SIMULATED_ENABLE', 'SIMULATED_STOP', 'ROLLED_BACK_DISABLED'];

/** In-memory simulation of relay reversibility; it cannot start the PC service. */
export function inspectQl254ReversiblePrivateRelay(plan, events, { now = Date.now() } = {}) {
  if (!exact(plan, RELAY_FIELDS) || !Array.isArray(events) || events.length !== 4 ||
    !events.every((event, i) => exact(event, EVENT_FIELDS) && event.step === STEPS[i] &&
      Number.isSafeInteger(event.atMs) && event.atMs > 0 &&
      event.atMs <= now + 30_000 && event.serviceActuallyStarted === false &&
      (i === 0 || event.atMs > events[i - 1].atMs)) ||
    !Number.isSafeInteger(now) || now <= 0)
    return held('DENIED_RELAY_REHEARSAL_SCHEMA_OR_SEQUENCE', 'Four ordered simulation-only events required.');
  if (plan.schemaVersion !== 'rosevear.ql254.private-relay-rehearsal.v1' ||
    plan.role !== 'ROSEVEAR_AI_HUB_PRIVATE_RELAY_CANDIDATE' ||
    plan.transport !== 'TAILSCALE_OR_PRIVATE_LAN' || plan.serviceEnabled !== false ||
    plan.publicInbound !== false || plan.outboundOnly !== true ||
    plan.restrictToGatewayApi !== true || plan.tenantIsolation !== true ||
    plan.vaultAndCameraAccess !== false || plan.secretsInRepository !== false ||
    plan.credentialExchangeEnabled !== false || plan.ownerTestAuthorized !== false ||
    plan.ownerPilotAuthorized !== false || plan.stopProcedureRecorded !== true ||
    plan.restoreProcedureRecorded !== true ||
    !Number.isInteger(plan.watchdogIntervalSeconds) ||
    plan.watchdogIntervalSeconds < 30 || plan.watchdogIntervalSeconds > 300 ||
    !ID.test(plan.rehearsalId || ''))
    return held('DENIED_PRIVATE_RELAY_AUTHORIZATION_OR_ISOLATION',
      'Private PC must remain disconnected, least-privilege and explicitly reversible.');
  return held('REVERSIBLE_PRIVATE_RELAY_SIMULATION_ONLY_HELD',
    'The planned stop/restore sequence is internally consistent; no service, test window, connection or private host has been accessed.',
    { simulationSteps: STEPS.length, rollbackEndState: 'DISABLED' });
}
