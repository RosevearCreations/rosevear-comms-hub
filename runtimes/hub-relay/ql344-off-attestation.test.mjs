import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {inspectOffObservation,reconcileOriginalIssuerEvidence,
  ql344Cli} from './ql344-off-attestation.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const now=Date.parse('2026-11-06T02:46:24.842Z');
const source=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340a',
  passphrase:'test-source-passphrase'}).publicCandidate;
const master=createOwnerAuthorityCandidate({role:'master',keyId:'comms-master-jack-ql340a',
  passphrase:'test-master-passphrase'}).publicCandidate;
const deviceKeys=generateKeyPairSync('ed25519');
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKeys.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:digest(deviceKeys.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'ql344-inert-'));
  const save=(name,contents)=>{const path=join(dir,name);
    writeFileSync(path,typeof contents==='string'?contents:JSON.stringify(contents));return path;};
  const paths=Object.fromEntries(['windows','privateTls','tailnetAcl','rollback']
    .map((name,index)=>[name,save(`${name}.json`,JSON.stringify({
      schema:'synthetic-only',name,sample:'z'.repeat(40+index)}))]));
  const hashes=Object.fromEntries(Object.entries({windows:'windowsWitnessSha256',
    privateTls:'privateTlsWitnessSha256',tailnetAcl:'tailnetAclWitnessSha256',
    rollback:'rollbackWitnessSha256'})
    .map(([name,field])=>[field,digest(readFileSync(paths[name]))]));
  const tls=save('certificate.crt','synthetic-test-cert-'.repeat(8));
  const observation={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
    state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',
    capturedAt:new Date(now).toISOString(),computer:'DESKTOP-AE894KC',
    windowsUser:'Ree',receiverPort:8788,localListenerCount:0,
    tailscaleServeNoConfig:true,inertDrillFileCount:1,evidenceDigests:hashes,
    tlsCertificateFileSha256:digest(readFileSync(tls)),receiverOffObserved:true,
    originalReceiverStopped:false,originalIssuerEvidenceIndependentlyVerified:false,
    independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
    requestMayBeSigned:false,receiverActivated:false,databaseEnrollmentCreated:false,
    connected:false,customerCommunications:false,deviceActions:false};
  const review={schema:'rosevear.hub.ql343.original-owner-evidence-review.v1',
    state:'EVIDENCE_HASHED_ORIGINAL_OWNER_AND_ISSUER_REVIEW_REQUIRED',
    rollbackKind:'INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP',
    evidenceDigests:hashes,rollbackFileSha256:hashes.rollbackWitnessSha256,
    candidateIds:{source:source.keyId,master:master.keyId},
    independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
    originalReceiverStopped:false,originalFieldWitnessApproved:false,
    certificateChainIndependentlyApproved:false,
    tailnetPolicyIndependentlyApproved:false,receiverActivated:false,
    databaseEnrollmentCreated:false,connected:false,requestMayBeSigned:false};
  return {dir,paths,tls,observation,review,device,source,master};
}

test('receiver OFF format is a local observation, never a claim of original active stop',()=>{
  const {observation}=fixture();
  const v=inspectOffObservation(observation,now+1000);
  assert.equal(v.receiverOffObserved,true);
  assert.equal(v.originalReceiverStopped,false);
  assert.equal(v.originalIssuerEvidenceIndependentlyVerified,false);
  assert.equal(v.independentOriginalOwnerApproval,false);
  assert.equal(v.sourceSigned,false);
  assert.equal(v.masterSigned,false);
  assert.equal(v.requestMayBeSigned,false);
  assert.equal(v.receiverActivated,false);
  assert.equal(v.databaseEnrollmentCreated,false);
  assert.equal(v.customerCommunications,false);
  assert.equal(v.deviceActions,false);
});

test('injected approval, a listening receiver, an active stop claim and stale data fail closed',()=>{
  const {observation}=fixture();
  for(const mutation of [{originalReceiverStopped:true},{localListenerCount:1},
    {tailscaleServeNoConfig:false},{receiverActivated:true},
    {originalIssuerEvidenceIndependentlyVerified:true},
    {requestMayBeSigned:true},{sourceSigned:true},{masterSigned:true},
    {connected:true},{databaseEnrollmentCreated:true},
    {independentOriginalOwnerApproval:true},{computer:'OTHER-PC'},
    {windowsUser:'other'},{inertDrillFileCount:0},
    {tlsCertificateFileSha256:'0'.repeat(63)}]){
    assert.equal(inspectOffObservation({...observation,...mutation},now+1000)
      .receiverOffObserved,false,JSON.stringify(mutation));
  }
  assert.equal(inspectOffObservation(observation,now+86_400_001).receiverOffObserved,false);
  assert.equal(inspectOffObservation(observation,now-70_000).receiverOffObserved,false);
});

test('matching original file bytes and distinct Ed25519 public candidates stay HOLD',()=>{
  const f=fixture();
  const assessed=reconcileOriginalIssuerEvidence({...f,now:now+1000,
    evidencePaths:f.paths,tlsCertificatePath:f.tls,reviewPacket:f.review});
  assert.equal(assessed.originalBytesMatch,true);
  assert.equal(assessed.distinctOwnerKeysVerified,true);
  assert.equal(assessed.sourceKeyId,source.keyId);
  assert.equal(assessed.masterKeyId,master.keyId);
  assert.equal(assessed.requestMayBeSigned,false);
  assert.equal(assessed.originalIssuerEvidenceIndependentlyVerified,false);
  assert.equal(assessed.sourceSigned,false);
  assert.equal(assessed.masterSigned,false);
  assert.equal(assessed.connected,false);
  writeFileSync(f.paths.windows,'tampered-observation-file-'.repeat(3));
  assert.equal(reconcileOriginalIssuerEvidence({...f,now:now+1000,
    evidencePaths:f.paths,tlsCertificatePath:f.tls,reviewPacket:f.review})
    .originalBytesMatch,undefined);
});

test('review conflict, duplicate paths, wrong candidate and spoofed issuer stay held',()=>{
  const f=fixture();
  const base={...f,now:now+1000,evidencePaths:f.paths,
    tlsCertificatePath:f.tls,reviewPacket:f.review};
  assert.equal(reconcileOriginalIssuerEvidence({...base,
    reviewPacket:{...f.review,rollbackKind:'CLAIMED_REAL_RECEIVER_STOP_REQUIRES_INDEPENDENT_WITNESS'}})
    .state,'HOLD_QL343_EVIDENCE_REVIEW_CONFLICT');
  assert.equal(reconcileOriginalIssuerEvidence({...base,
    evidencePaths:{...f.paths,rollback:f.paths.windows}}).state,
    'HOLD_ORIGINAL_FILE_OR_PUBLIC_SIGNER_MISMATCH');
  assert.equal(reconcileOriginalIssuerEvidence({...base,master:f.source}).state,
    'HOLD_ORIGINAL_FILE_OR_PUBLIC_SIGNER_MISMATCH');
  assert.equal(reconcileOriginalIssuerEvidence({...base,
    observation:{...f.observation,originalIssuerEvidenceIndependentlyVerified:true}})
    .receiverOffObserved,false);
});

test('CLI is offline, read-only and forbids owner signing commands',async()=>{
  const help=await ql344Cli(['--help']);
  assert.equal(help.networkRequests,0);
  assert.equal(help.privateKeysRead,false);
  assert.equal(help.signingImplemented,false);
  const f=fixture();
  const path=join(f.dir,'observation.json');writeFileSync(path,JSON.stringify({
    ...f.observation,capturedAt:'2020-01-01T00:00:00.000Z'}));
  assert.equal((await ql344Cli(['--inspect',path])).state,
    'HOLD_INVALID_OR_STALE_RECEIVER_OFF_DOCUMENT');
  await assert.rejects(ql344Cli(['--sign','source',path]),
    /DENY_QL344_UNKNOWN_OR_SIGNING_ACTION/);
});
