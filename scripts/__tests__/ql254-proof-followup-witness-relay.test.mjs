import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { QL247_SOURCES } from '../ql247-six-app-github-census.mjs';
import { inspectQl254SixAppFollowup, inspectQl254PrivateRegistryWitness,
  ql254WitnessCanonicalBytes, inspectQl254ReversiblePrivateRelay }
  from '../ql254-proof-followup-witness-relay.mjs';

const NOW = Date.UTC(2026, 9, 29, 4, 0, 0);
const hash = v => createHash('sha256').update(v).digest('hex');
const A = 'a'.repeat(40), B = 'b'.repeat(40), C = 'c'.repeat(64);
const sourceRows = status => QL247_SOURCES.map(s => ({ ...s, mainSha: B, sourceSha: null,
  proofRawSha256: null, status }));
const source = i => ({ ...QL247_SOURCES[i], mainSha: B, sourceSha: A,
  status: 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD' });

function fixture(i = 4) {
  // Generated fixture keys are ephemeral and NEVER represent actual source evidence.
  const s = QL247_SOURCES[i], witnessKeys = generateKeyPairSync('ed25519');
  const witnessSpki = hash(witnessKeys.publicKey.export({ type: 'spki', format: 'der' }));
  const registry = { schemaVersion: 'rosevear.ql253.pin-registry-renewal.v1',
    system: s.system, repository: s.repository, sourceSha: A, proofSha: B,
    businessId: s.system === 'ai-data-platform' ? 'devilndove' : s.system,
    tenantId: ['yw','icamp'].includes(s.system) ? 'np-test-tenant-001' : null,
    challengeId: 'np-challenge-001', nonceBase64Url: randomBytes(32).toString('base64url'),
    issuedAtMs: NOW - 5000, expiresAtMs: NOW + 180000,
    presentedSpkiSha256: C, registrySpkiSha256: C, registrySnapshotSha256: 'd'.repeat(64),
    registryReceiptId: 'np-registry-001', custodyReceiptId: 'np-custody-001',
    independentWitnessReceiptId: 'np-witness-001', independentVerifierAlias: 'independent_reviewer',
    channel: 'PRIVATE_TRUST_REGISTRY', observedAtMs: NOW - 1000 };
  const payload = { schemaVersion: 'rosevear.ql254.private-pin-witness.v1',
    system: s.system, repository: s.repository, businessId: registry.businessId,
    tenantId: registry.tenantId, sourceSha: A, proofSha: B,
    registryReceiptId: registry.registryReceiptId, custodyReceiptId: registry.custodyReceiptId,
    witnessReceiptId: registry.independentWitnessReceiptId,
    registrySnapshotSha256: registry.registrySnapshotSha256,
    custodySpkiSha256: registry.registrySpkiSha256, witnessSpkiSha256: witnessSpki,
    challengeId: registry.challengeId,
    nonceSha256: hash(Buffer.from(registry.nonceBase64Url, 'base64url')),
    witnessedAtMs: NOW - 1000, observation: 'OFFLINE_REGISTRY_KEY_CONTROL_OBSERVED_ONLY' };
  const signed = p => ({ payload: p,
    publicKeyPem: witnessKeys.publicKey.export({ type: 'spki', format: 'pem' }),
    signatureBase64Url: sign(null, ql254WitnessCanonicalBytes(p), witnessKeys.privateKey).toString('base64url') });
  const pin = { system: s.system, spkiSha256: witnessSpki,
    provenanceReceiptId: 'np-private-witness-pin-001' };
  return { registry, signed: signed(payload), pin, signPayload: signed };
}

function relayFixture() {
  const plan = { schemaVersion: 'rosevear.ql254.private-relay-rehearsal.v1',
    role: 'ROSEVEAR_AI_HUB_PRIVATE_RELAY_CANDIDATE',
    transport: 'TAILSCALE_OR_PRIVATE_LAN', serviceEnabled: false,
    publicInbound: false, outboundOnly: true, restrictToGatewayApi: true,
    tenantIsolation: true, vaultAndCameraAccess: false,
    secretsInRepository: false, credentialExchangeEnabled: false,
    ownerTestAuthorized: false, ownerPilotAuthorized: false,
    stopProcedureRecorded: true, restoreProcedureRecorded: true,
    watchdogIntervalSeconds: 60, rehearsalId: 'np-ql254-dryrun-001' };
  const events = ['BASELINE_DISABLED', 'SIMULATED_ENABLE', 'SIMULATED_STOP',
    'ROLLED_BACK_DISABLED'].map((step, i) => ({ step, atMs: NOW-4000+i*1000,
      serviceActuallyStarted: false }));
  return { plan, events };
}

test('QL254 dated six-app 404 origin drift is an action queue, never an auth grant', () => {
  const res = inspectQl254SixAppFollowup(sourceRows('MISSING_PUBLIC_PROOF_AT_MAIN'));
  assert.equal(res.queue.length, 6);
  assert.equal(res.stillMissingProofs, 6);
  assert.ok(res.queue.every(x => x.status === 'SOURCE_ADVANCED_PROOF_STILL_404_HELD'));
  assert.equal(res.realGatewayGets, 0);
  assert.equal(res.livePilotHolds, 12);
  assert.equal(res.connectionState, 'DISCONNECTED');
  assert.equal(inspectQl254SixAppFollowup(sourceRows('MISSING_PUBLIC_PROOF_AT_MAIN').slice(1)).status,
    'DENIED_SIX_APP_FOLLOWUP_SCOPE');
});

test('QL254 zero network does not claim source proof 404', () => {
  const rows = QL247_SOURCES.map(s => ({ ...s, mainSha: null,
    status: 'NOT_FETCHED_NO_NETWORK_REQUESTED' }));
  const result = inspectQl254SixAppFollowup(rows);
  assert.equal(result.stillMissingProofs, 0);
  assert.ok(result.queue.every(x => x.status === 'NO_PUBLIC_RECHECK_REQUESTED_HELD'));
  const sourceProgress = QL247_SOURCES.map(s => ({ ...s, mainSha: B, sourceSha: A,
    proofRawSha256: C, status: 'PUBLIC_GITHUB_ORIGIN_AND_SOURCE_CI_OBSERVED_PIN_PENDING_HELD' }));
  const advanced = inspectQl254SixAppFollowup(sourceProgress);
  assert.equal(advanced.publicAandCiObserved, 6);
  assert.equal(advanced.trustedSourcePins, 0);
});

test('QL254 valid synthetic witness signature still remains independently untrusted', () => {
  for(let i=0;i<6;i++){
    const f=fixture(i);
    const result=inspectQl254PrivateRegistryWitness(source(i),f.registry,f.signed,f.pin,{now:NOW});
    assert.equal(result.status,'PRIVATE_REGISTRY_WITNESS_SIGNATURE_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD');
    assert.equal(result.independentlyTrustedWitnesses,0);
    assert.equal(result.ownerTestAuthorization,'NOT_GIVEN');
    assert.equal(result.realGatewayGets,0);
  }
});

test('QL254 private witness rejects tampering, expiry, replay, same custody key and foreign tenant', () => {
  const f=fixture();
  for(const mutator of [
    x=>{x.signed.payload.sourceSha='e'.repeat(40);},
    x=>{x.signed.payload.tenantId='np-wrong-tenant';},
    x=>{x.signed.payload.nonceSha256='f'.repeat(64);},
    x=>{x.signed.payload.custodySpkiSha256=x.signed.payload.witnessSpkiSha256;},
    x=>{x.registry.expiresAtMs=NOW-1;},
    x=>{x.pin.spkiSha256='f'.repeat(64);},
    x=>{x.signed.payload.observation='APPROVED_OWNER_TEST';},
    x=>{x.signed.privateKey='forbidden';}
  ]) {
    const copy=structuredClone({registry:f.registry,signed:f.signed,pin:f.pin});
    mutator(copy);
    assert.notEqual(inspectQl254PrivateRegistryWitness(source(4),copy.registry,
      copy.signed,copy.pin,{now:NOW}).status,
    'PRIVATE_REGISTRY_WITNESS_SIGNATURE_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD');
  }
  assert.equal(inspectQl254PrivateRegistryWitness(source(4),f.registry,f.signed,f.pin,
    {now:NOW,consumedChallengeIds:[f.registry.challengeId]}).status,
  'DENIED_PRIVATE_WITNESS_UPSTREAM_ORIGIN');
});

test('QL254 reversible AI Hub rehearsal is simulation only and ends disabled', () => {
  const f=relayFixture();
  const r=inspectQl254ReversiblePrivateRelay(f.plan,f.events,{now:NOW});
  assert.equal(r.status,'REVERSIBLE_PRIVATE_RELAY_SIMULATION_ONLY_HELD');
  assert.equal(r.simulationSteps,4);
  assert.equal(r.rollbackEndState,'DISABLED');
  assert.equal(r.privateRelayEnabled,false);
  assert.equal(r.scheduledGatewayGets,0);
});

test('QL254 private relay rejects actual service enable, public inbound, vault access and forged owner approval', () => {
  const f=relayFixture();
  for(const mutate of [
    p=>{p.publicInbound=true;},
    p=>{p.serviceEnabled=true;},
    p=>{p.vaultAndCameraAccess=true;},
    p=>{p.ownerTestAuthorized=true;},
    p=>{p.ownerPilotAuthorized=true;},
    p=>{p.credentialExchangeEnabled=true;},
    p=>{p.tenantIsolation=false;},
    p=>{p.stopProcedureRecorded=false;},
    p=>{p.watchdogIntervalSeconds=0;}
  ]){
    const plan=structuredClone(f.plan); mutate(plan);
    assert.equal(inspectQl254ReversiblePrivateRelay(plan,f.events,{now:NOW}).status,
      'DENIED_PRIVATE_RELAY_AUTHORIZATION_OR_ISOLATION');
  }
  const events=structuredClone(f.events); events[2].serviceActuallyStarted=true;
  assert.equal(inspectQl254ReversiblePrivateRelay(f.plan,events,{now:NOW}).status,
    'DENIED_RELAY_REHEARSAL_SCHEMA_OR_SEQUENCE');
  const events2=structuredClone(f.events); events2[3].step='STILL_RUNNING';
  assert.equal(inspectQl254ReversiblePrivateRelay(f.plan,events2,{now:NOW}).status,
    'DENIED_RELAY_REHEARSAL_SCHEMA_OR_SEQUENCE');
});
