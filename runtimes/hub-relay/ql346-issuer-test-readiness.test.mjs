import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,randomBytes,randomUUID,sign} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {prepareIssuerOwnerReview,signReviewDisposition} from './ql345-issuer-owner-preflight.mjs';
import {createEnrollmentRequest,signOwnerRequest} from './ql340b-enrollment.mjs';
import {QL346_SCHEMA,verifyOriginalIssuerHeartbeat,
  assessControlledTestReadiness,ql346Cli} from './ql346-issuer-test-readiness.mjs';

const at=Date.parse('2026-11-06T14:00:00.000Z');
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340a',
  passphrase:'safe-source-test-passphrase'});
const master=createOwnerAuthorityCandidate({role:'master',keyId:'comms-master-jack-ql340a',
  passphrase:'safe-master-test-passphrase'});
const deviceKeys=generateKeyPairSync('ed25519');
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKeys.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:sha(deviceKeys.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const evidenceDigests={windowsWitnessSha256:'a'.repeat(64),
  privateTlsWitnessSha256:'b'.repeat(64),tailnetAclWitnessSha256:'c'.repeat(64),
  rollbackWitnessSha256:'d'.repeat(64)};
const observation={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
  state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',capturedAt:new Date(at).toISOString(),
  computer:'DESKTOP-AE894KC',windowsUser:'Ree',receiverPort:8788,
  localListenerCount:0,tailscaleServeNoConfig:true,inertDrillFileCount:1,
  evidenceDigests,tlsCertificateFileSha256:'e'.repeat(64),
  receiverOffObserved:true,originalReceiverStopped:false,
  originalIssuerEvidenceIndependentlyVerified:false,independentOriginalOwnerApproval:false,
  sourceSigned:false,masterSigned:false,requestMayBeSigned:false,
  receiverActivated:false,databaseEnrollmentCreated:false,connected:false,
  customerCommunications:false,deviceActions:false};
const reviewPacket={schema:'rosevear.hub.ql343.original-owner-evidence-review.v1',
  state:'EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED',
  rollbackKind:'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',evidenceDigests,
  rollbackFileSha256:evidenceDigests.rollbackWitnessSha256,
  candidateIds:{source:source.publicCandidate.keyId,master:master.publicCandidate.keyId},
  independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
  originalReceiverStopped:false,originalFieldWitnessApproved:false,
  certificateChainIndependentlyApproved:false,tailnetPolicyIndependentlyApproved:false,
  receiverActivated:false,databaseEnrollmentCreated:false,connected:false,
  requestMayBeSigned:false};
const packetAt=(now=at)=>{
  const envelope={schemaVersion:'rosevear.hub.relay.heartbeat.v1',issuer:'rosevear-ai-hub',
    audience:'rosevear-comms-hub:nonproduction',deviceId:'rosevear-windows-hub',
    workloadId:'hub-probe',environment:'TEST',sequence:1,
    nonce:randomBytes(20).toString('base64url'),sessionId:randomUUID(),
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+90_000).toISOString(),
    capabilities:['health.read','capabilities.read'],queueDepth:0,relayMode:'OUTBOUND_ONLY'};
  return {envelope,keyId:'hub-ql339b',signature:sign(null,
    Buffer.from(canonicalize(envelope)),deviceKeys.privateKey).toString('base64url')};
};
function original({now=at}={}){
  const challenge=prepareIssuerOwnerReview({observation,reviewPacket,device,
    source:source.publicCandidate,master:master.publicCandidate,now});
  const decision=role=>{
    const key=role==='source'?source:master;
    return signReviewDisposition({challenge,role,
      decision:'REVIEW_ACKNOWLEDGED_NO_ENROLLMENT',
      localCandidate:key.publicCandidate,encryptedPrivateKeyPem:key.encryptedPrivateKeyPem,
      passphrase:`safe-${role}-test-passphrase`,now:now+1_000});
  };
  const request=createEnrollmentRequest({device,source:source.publicCandidate,
    master:master.publicCandidate,witnessHashes:evidenceDigests,now});
  const approval=role=>{
    const key=role==='source'?source:master;
    return signOwnerRequest({request,role,localCandidate:key.publicCandidate,
      encryptedPrivateKeyPem:key.encryptedPrivateKeyPem,
      passphrase:`safe-${role}-test-passphrase`,now:now+1_000});
  };
  return {observation,challenge,sourceReview:decision('source'),
    masterReview:decision('master'),request,sourceApproval:approval('source'),
    masterApproval:approval('master'),packet:packetAt(now),deviceCandidate:device,
    independentlyObservedDeviceSpki:device.deviceSpkiSha256,now:now+2_000};
}

test('original QL339B signed TEST heartbeat and exact independently observed candidate pin are verified offline',()=>{
  const packet=packetAt();
  const result=verifyOriginalIssuerHeartbeat({packet,deviceCandidate:device,
    independentlyObservedDeviceSpki:device.deviceSpkiSha256,now:at+2_000});
  assert.equal(result.schema,QL346_SCHEMA);
  assert.equal(result.issuerSignatureCryptographicallyValid,true);
  assert.equal(result.devicePinMatches,true);
  assert.equal(result.originalIssuerIndependentlyAuthenticated,false);
  assert.equal(result.originalIssuerOutOfBandCustodyApproved,false);
  assert.equal(result.receiverActivated,false);
  assert.equal(result.databaseEnrollmentCreated,false);
  assert.equal(result.networkRequests,0);
});

test('self-asserted or mismatched original device, pinned identity, signature, audience and TTL are denied',()=>{
  const packet=packetAt();
  const input={packet,deviceCandidate:device,independentlyObservedDeviceSpki:device.deviceSpkiSha256,now:at+1_000};
  for(const mutation of [
    {packet:{...packet,signature:'0'.repeat(86)}},
    {packet:{...packet,keyId:'different'}},
    {packet:{...packet,envelope:{...packet.envelope,audience:'rosevear-comms-hub:production'}}},
    {packet:{...packet,envelope:{...packet.envelope,environment:'PRODUCTION'}}},
    {packet:{...packet,envelope:{...packet.envelope,expiresAt:new Date(at+120_000).toISOString()}}},
    {packet:{...packet,envelope:{...packet.envelope,queueDepth:20}}},
    {packet:{...packet,envelope:{...packet.envelope,capabilities:['device.write']}}},
    {deviceCandidate:{...device,deviceSpkiSha256:'0'.repeat(64)}},
    {independentlyObservedDeviceSpki:undefined},
    {independentlyObservedDeviceSpki:'0'.repeat(64)},
    {now:at+90_000},
  ]){
    const result=verifyOriginalIssuerHeartbeat({...input,...mutation});
    assert.equal(result.issuerSignatureCryptographicallyValid,false,result.state);
    assert.equal(result.readyForDatabaseEnrollment,false);
  }
});

test('even authentic synthetic cryptographic source, master and device signatures never create issuer trust or DB enrollment',()=>{
  const result=assessControlledTestReadiness(original());
  assert.equal(result.state,
    'CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD');
  assert.equal(result.sourceReviewValid,true);
  assert.equal(result.masterReviewValid,true);
  assert.equal(result.sourceOwnerTestSignatureValid,true);
  assert.equal(result.masterOwnerTestSignatureValid,true);
  assert.equal(result.issuerSignatureCryptographicallyValid,true);
  assert.equal(result.originalIssuerIndependentlyAuthenticated,false);
  assert.equal(result.readyForDatabaseEnrollment,false);
  assert.equal(result.originalReceiverStopped,false);
  assert.equal(result.receiverActivated,false);
  assert.equal(result.connected,false);
});

test('missing QL340B TEST owner approvals cannot be replaced by QL345 signed reviews',()=>{
  const input=original();
  for(const mutation of [{sourceApproval:input.sourceReview},
    {masterApproval:input.masterReview},{sourceApproval:undefined},
    {masterApproval:{...input.masterApproval,signature:'A'.repeat(86)}},
    {request:{...input.request,payload:{...input.request.payload,
      tailnetAclWitnessSha256:'e'.repeat(64)}}},
    {request:{...input.request,payload:{...input.request.payload,
      audience:'rosevear-comms-hub:production'}}},
    {independentlyObservedDeviceSpki:undefined}]){
    const result=assessControlledTestReadiness({...input,...mutation});
    assert.equal(result.readyForDatabaseEnrollment,false);
    assert.equal(result.originalIssuerIndependentlyAuthenticated,false);
    assert.equal(result.connected,false);
    assert.notEqual(result.state,
      'CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD');
  }
});

test('original receiver OFF, challenge lifetime, independent review and cross-packet owner consistency are mandatory',()=>{
  const input=original();
  for(const mutation of [
    {observation:{...observation,localListenerCount:1}},
    {observation:{...observation,originalReceiverStopped:true}},
    {now:at+1_200_000},
    {sourceReview:{...input.sourceReview,decision:'HOLD'}},
    {masterReview:input.sourceReview},
    {challenge:{...input.challenge,observationSha256:'f'.repeat(64)}},
    {request:{...input.request,ownerAuthorityPins:{...input.request.ownerAuthorityPins,
      source:input.request.ownerAuthorityPins.master}}},
  ]){
    const result=assessControlledTestReadiness({...input,...mutation});
    assert.equal(result.readyForDatabaseEnrollment,false);
    assert.equal(result.sourceOwnerTestSignatureValid===true&&
      result.masterOwnerTestSignatureValid===true&&
      result.issuerSignatureCryptographicallyValid===true,false,result.state);
  }
});

test('CLI exposes only offline read/verify, no signing, activation or network operation',()=>{
  const help=ql346Cli(['--help']);
  assert.equal(help.networkRequests,0);
  assert.equal(help.privateKeysRead,false);
  assert.equal(help.signingImplemented,false);
  assert.throws(()=>ql346Cli(['--enroll']),/DENY_QL346/);
  assert.throws(()=>ql346Cli(['--send-once']),/DENY_QL346/);
  const dir=mkdtempSync(join(tmpdir(),'ql346-public-'));
  const packetPath=join(dir,'heartbeat.json'),publicPath=join(dir,'public.json');
  writeFileSync(packetPath,JSON.stringify(packetAt()));
  writeFileSync(publicPath,JSON.stringify(device));
  const state=ql346Cli(['--verify-issuer',packetPath,publicPath,device.deviceSpkiSha256]);
  assert.equal(state.issuerSignatureCryptographicallyValid,false); // original sample is expired
  assert.equal(state.databaseEnrollmentCreated,false);
});
