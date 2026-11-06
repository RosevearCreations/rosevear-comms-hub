import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {prepareIssuerOwnerReview,inspectReviewChallenge,signReviewDisposition,
  verifyReviewDisposition,evaluateTestPreflight,ql345Cli} from './ql345-issuer-owner-preflight.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const at=Date.parse('2026-11-06T04:20:10.000Z');
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

function original(){
  const observation={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
    state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',
    capturedAt:new Date(at).toISOString(),computer:'DESKTOP-AE894KC',
    windowsUser:'Ree',receiverPort:8788,localListenerCount:0,
    tailscaleServeNoConfig:true,inertDrillFileCount:1,evidenceDigests,
    tlsCertificateFileSha256:'e'.repeat(64),receiverOffObserved:true,
    originalReceiverStopped:false,originalIssuerEvidenceIndependentlyVerified:false,
    independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
    requestMayBeSigned:false,receiverActivated:false,databaseEnrollmentCreated:false,
    connected:false,customerCommunications:false,deviceActions:false};
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
  return {observation,reviewPacket,device,
    source:source.publicCandidate,master:master.publicCandidate};
}
const challenge=()=>prepareIssuerOwnerReview({...original(),now:at});
const decide=(packet,role,decision,now=at+5000)=>{
  const key=role==='source'?source:master;
  return signReviewDisposition({challenge:packet,role,decision,
    localCandidate:key.publicCandidate,encryptedPrivateKeyPem:key.encryptedPrivateKeyPem,
    passphrase:`safe-${role}-test-passphrase`,now});
};

test('20-minute public issuer-review challenge has no TEST authorization or receiver activation',()=>{
  const packet=challenge(),inspected=inspectReviewChallenge(packet,at+1);
  assert.equal(inspected.valid,true);
  assert.equal(packet.environment,'TEST');
  assert.equal(packet.audience,'rosevear-comms-hub:nonproduction');
  assert.equal(packet.originalIssuerIndependentlyConfirmed,false);
  assert.equal(packet.sourceOwnerEnrollmentApproved,false);
  assert.equal(packet.masterOwnerEnrollmentApproved,false);
  assert.equal(packet.requestMayBeSigned,false);
  assert.equal(packet.databaseEnrollmentCreated,false);
  assert.equal(packet.receiverActivated,false);
  assert.equal(packet.connected,false);
  assert.equal(Date.parse(packet.expiresAt)-Date.parse(packet.issuedAt),1_200_000);
  assert.equal(inspectReviewChallenge(packet,at+1_200_000).valid,false);
});

test('no public challenge may derive a trusted issuer or claim human approval',()=>{
  const sourceInputs=original();
  for(const mutation of [{originalReceiverStopped:true},{requestMayBeSigned:true},
    {tailscaleServeNoConfig:false},{localListenerCount:2},{receiverActivated:true}]){
    assert.throws(()=>prepareIssuerOwnerReview({...sourceInputs,
      observation:{...sourceInputs.observation,...mutation},now:at}),
    /HOLD_QL344_OFF/);
  }
  assert.throws(()=>prepareIssuerOwnerReview({...sourceInputs,
    reviewPacket:{...sourceInputs.reviewPacket,evidenceDigests:{...evidenceDigests,
      windowsWitnessSha256:'f'.repeat(64)}},now:at}),/HOLD_QL344_OFF/);
  assert.throws(()=>prepareIssuerOwnerReview({...sourceInputs,
    master:sourceInputs.source,now:at}),/DENY_/);
  const packet=challenge();
  for(const mutation of [{originalIssuerIndependentlyConfirmed:true},
    {requestMayBeSigned:true},{sourceOwnerEnrollmentApproved:true},
    {masterOwnerEnrollmentApproved:true},{receiverActivated:true},
    {databaseEnrollmentCreated:true},{connected:true},
    {observationSha256:'0'.repeat(12)}]){
    assert.equal(inspectReviewChallenge({...packet,...mutation},at+100).valid,false);
  }
});

test('Ree and Jack can sign separate REVIEW acknowledgements, never enrollment approvals',()=>{
  const packet=challenge();
  const ree=decide(packet,'source','REVIEW_ACKNOWLEDGED_NO_ENROLLMENT');
  const jack=decide(packet,'master','REVIEW_ACKNOWLEDGED_NO_ENROLLMENT');
  assert.equal(verifyReviewDisposition({challenge:packet,disposition:ree,
    role:'source',now:at+10_000}).valid,true);
  assert.equal(verifyReviewDisposition({challenge:packet,disposition:jack,
    role:'master',now:at+10_000}).valid,true);
  const preflight=evaluateTestPreflight({challenge:packet,
    sourceDecision:ree,masterDecision:jack,now:at+10_000});
  assert.equal(preflight.state,'DUAL_REVIEW_ACKNOWLEDGED_ORIGINAL_ISSUER_UNCONFIRMED_TEST_HOLD');
  assert.equal(preflight.sourceReviewSignatureValid,true);
  assert.equal(preflight.masterReviewSignatureValid,true);
  assert.equal(preflight.originalIssuerIndependentlyConfirmed,false);
  assert.equal(preflight.requestMayBeSigned,false);
  assert.equal(preflight.sourceEnrollmentSignaturePresent,false);
  assert.equal(preflight.masterEnrollmentSignaturePresent,false);
  assert.equal(preflight.receiverActivated,false);
  assert.equal(preflight.connected,false);
});

test('HOLD/REJECT decisions, tampering, replay, mismatched role or key always deny',()=>{
  const packet=challenge();
  const ree=decide(packet,'source','HOLD');
  const jack=decide(packet,'master','REVIEW_ACKNOWLEDGED_NO_ENROLLMENT');
  const preflight=evaluateTestPreflight({challenge:packet,
    sourceDecision:ree,masterDecision:jack,now:at+10_000});
  assert.equal(preflight.state,'HOLD_ORIGINAL_OWNER_DECLINED_OR_PAUSED');
  assert.equal(preflight.requestMayBeSigned,false);
  assert.equal(verifyReviewDisposition({challenge:packet,disposition:{...ree,
    decision:'REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'},role:'source',now:at+10_000}).valid,false);
  assert.equal(verifyReviewDisposition({challenge:packet,disposition:{...ree,
    enrollmentAuthorized:true},role:'source',now:at+10_000}).valid,false);
  assert.equal(verifyReviewDisposition({challenge:packet,disposition:ree,
    role:'master',now:at+10_000}).valid,false);
  assert.equal(verifyReviewDisposition({challenge:packet,disposition:ree,
    role:'source',now:at+1_200_001}).valid,false);
  assert.equal(evaluateTestPreflight({challenge:packet,
    sourceDecision:ree,masterDecision:null,now:at+10_000}).state,
    'HOLD_SEPARATE_ORIGINAL_OWNER_REVIEW_REQUIRED');
  assert.throws(()=>decide(packet,'source','APPROVE_ENROLLMENT'),/DENY_/);
  assert.throws(()=>signReviewDisposition({challenge:packet,role:'master',
    decision:'HOLD',localCandidate:source.publicCandidate,
    encryptedPrivateKeyPem:source.encryptedPrivateKeyPem,
    passphrase:'safe-source-test-passphrase',now:at+1000}),/DENY_/);
});

test('CLI is read-only on CI, cannot stage or sign on a non-original computer',async()=>{
  const guide=await ql345Cli(['--help']);
  assert.equal(guide.networkRequests,0);
  assert.equal(guide.automaticApproval,false);
  assert.equal(guide.privateKeyExported,false);
  const dir=mkdtempSync(join(tmpdir(),'ql345-'));
  const file=join(dir,'challenge.json');writeFileSync(file,JSON.stringify(challenge()));
  const inspected=await ql345Cli(['--inspect',file]);
  assert.equal(inspected.valid,false);
  await assert.rejects(ql345Cli(['--decide','source',file,'HOLD']),
    /HOLD_INDEPENDENT_ORIGINAL_WINDOWS_OWNER_HOST_REQUIRED/);
  await assert.rejects(ql345Cli(['--stage-local','a','b','c','d','e']),
    /HOLD_INDEPENDENT_ORIGINAL_WINDOWS_OWNER_HOST_REQUIRED/);
  await assert.rejects(ql345Cli(['--approve','source',file]),/DENY_UNKNOWN_QL345/);
});
