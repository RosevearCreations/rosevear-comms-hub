import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {hashWitnessFiles} from './ql340b-enrollment.mjs';
import {createQl365aFirstTrustRequest,inspectQl365aFirstTrustRequest,
  inspectQl365aPinnedOwner,signQl365aFirstTrustRequest,
  verifyQl365aSignedFirstTrust,assembleQl365aFirstTrust,
  inspectQl365aSignedCandidate,QL365A_PINS} from './ql365a-first-time-trust.mjs';
import {ql365aCli} from './ql365a-first-time-trust-cli.mjs';

const sha=data=>createHash('sha256').update(data).digest('hex');
const now=Date.parse('2026-11-07T16:00:00.000Z');
const passphrase='QL365A-synthetic-passphrase-only';

function fixture(){
  const temp=mkdtempSync(join(tmpdir(),'ql365a-synthetic-'));
  const source=createOwnerAuthorityCandidate({role:'source',keyId:'source-owner-ql340a',passphrase});
  const master=createOwnerAuthorityCandidate({role:'master',keyId:'comms-master-jack-ql340a',passphrase});
  const sourceOriginalBytes=Buffer.from(JSON.stringify(source.publicCandidate,null,2)+'\n');
  const masterOriginalBytes=Buffer.from(JSON.stringify(master.publicCandidate,null,2)+'\n');
  const pins={source:{keyId:source.publicCandidate.keyId,
    spkiSha256:source.publicCandidate.spkiSha256,originalFileSha256:sha(sourceOriginalBytes)},
  master:{keyId:master.publicCandidate.keyId,
    spkiSha256:master.publicCandidate.spkiSha256,originalFileSha256:sha(masterOriginalBytes)}};
  const devicePair=generateKeyPairSync('ed25519');
  const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
    deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
    devicePublicKeyPem:devicePair.publicKey.export({format:'pem',type:'spki'}),
    deviceSpkiSha256:sha(devicePair.publicKey.export({format:'der',type:'spki'})),
    enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
  const evidencePaths={};
  for(const [index,role] of ['windows','privateTls','tailnetAcl','rollback'].entries()){
    const path=join(temp,`${role}.json`);
    writeFileSync(path,JSON.stringify({schema:'SYNTHETIC_ONLY',role,payload:'x'.repeat(50+index)}));
    evidencePaths[role]=path;
  }
  const witnessHashes=hashWitnessFiles(evidencePaths);
  const offObservation={schema:'rosevear.hub.ql344.receiver-off-observation.v1',
    state:'RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP',
    capturedAt:new Date(now-30_000).toISOString(),computer:'DESKTOP-AE894KC',
    windowsUser:'Ree',receiverPort:8788,localListenerCount:0,
    tailscaleServeNoConfig:true,evidenceDigests:witnessHashes,
    receiverOffObserved:true,originalReceiverStopped:false,
    originalIssuerEvidenceIndependentlyVerified:false,
    independentOriginalOwnerApproval:false,sourceSigned:false,masterSigned:false,
    requestMayBeSigned:false,receiverActivated:false,
    databaseEnrollmentCreated:false,connected:false,
    customerCommunications:false,deviceActions:false};
  const offObservationBytes=Buffer.from(JSON.stringify(offObservation,null,2)+'\n');
  const input={device,source:source.publicCandidate,master:master.publicCandidate,
    sourceOriginalBytes,evidencePaths,offObservation,offObservationBytes,now,pins,
    nonce:'0123456789abcdef0123456789abcdef'};
  const request=()=>createQl365aFirstTrustRequest(input);
  const signRole=(req,role)=>{
    const owner=role==='source'?source:master;
    const originalPublicBytes=role==='source'?sourceOriginalBytes:masterOriginalBytes;
    return signQl365aFirstTrustRequest({request:req,role,
      localCandidate:owner.publicCandidate,originalPublicBytes,
      encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase,now,pins});
  };
  return {input,request,source,master,pins,offObservation,offObservationBytes,
    sourceOriginalBytes,masterOriginalBytes,evidencePaths,signRole};
}

test('original reported owner SPKIs stay fixed and synthetic owners are denied by default policy',()=>{
  assert.equal(QL365A_PINS.source.spkiSha256,
    'e3be0648e3c9c7737c2857a8d36d31ea5c74a69211a55ac201347ce220d3158e');
  assert.equal(QL365A_PINS.master.spkiSha256,
    '3b086d0f89e51311b458eb94aa585f7b7a797a86c8061c8cd0b4b4d0b75585d5');
  const f=fixture();
  assert.equal(inspectQl365aPinnedOwner(f.source.publicCandidate,'source',
    {originalBytes:f.sourceOriginalBytes}).verified,false);
  assert.throws(()=>createQl365aFirstTrustRequest({...f.input,pins:QL365A_PINS}),
    /HOLD_QL365A_PINNED_REE_AND_JACK_REQUIRED/);
  assert.equal(inspectQl365aPinnedOwner(f.source.publicCandidate,'source',
    {originalBytes:f.sourceOriginalBytes,pins:f.pins}).verified,true);
});

test('fresh original OFF observation + four byte hashes creates an unsigned 20-minute HOLD',()=>{
  const f=fixture(),request=f.request();
  const check=inspectQl365aFirstTrustRequest(request,now,f.pins);
  assert.equal(check.valid,true);
  assert.equal(request.payload.mode,'FIRST_TIME_DUAL_ORIGINAL_OWNER_TRUST_PROPOSAL_ONLY');
  assert.equal(request.payload.legacyIssuerAuthenticated,false);
  assert.equal(request.payload.legacyWitnessAuthenticated,false);
  assert.equal(request.payload.originalRollbackStopWitnessVerified,false);
  assert.equal(request.payload.baseline.originalReceiverStopped,false);
  assert.equal(request.databaseEnrollmentCreated,false);
  assert.equal(request.receiverActivated,false);
  assert.equal(new Date(check.expiresAt).getTime()-now,1_200_000);
  assert.equal(check.connected,false);
  assert.equal(inspectQl365aFirstTrustRequest(request,now+1_200_001,f.pins).valid,false);
});

test('two separate domain-specific Ed25519 signatures verify as offline candidate only',()=>{
  const f=fixture(),request=f.request(),sourceApproval=f.signRole(request,'source'),
    masterApproval=f.signRole(request,'master');
  assert.notEqual(sourceApproval.signature,masterApproval.signature);
  const checked=verifyQl365aSignedFirstTrust({request,sourceApproval,masterApproval,
    now,pins:f.pins});
  assert.equal(checked.valid,true);
  assert.equal(checked.state,'TWO_ORIGINAL_OWNER_SIGNATURES_VERIFIED_FIRST_TRUST_CANDIDATE_ONLY');
  assert.equal(checked.originalReceiverStopped,false);
  assert.equal(checked.legacyIndependentIssuerWitnessSatisfied,false);
  assert.equal(checked.databaseEnrollmentAuthorized,false);
  assert.equal(checked.receiverActivated,false);
  assert.equal(checked.sixAppGrantsAuthorized,false);
  assert.equal(checked.connected,false);
  const signed=assembleQl365aFirstTrust({request,sourceApproval,masterApproval,now,pins:f.pins});
  assert.equal(inspectQl365aSignedCandidate(signed,now,f.pins).valid,true);
  assert.equal(inspectQl365aSignedCandidate(signed,now+1_200_010,f.pins).valid,false);
});

test('tampered, swapped, replayed or single owner signatures reject without enrollment',()=>{
  const f=fixture(),request=f.request(),sourceApproval=f.signRole(request,'source'),
    masterApproval=f.signRole(request,'master');
  const verify=(r,s,m)=>verifyQl365aSignedFirstTrust({request:r,
    sourceApproval:s,masterApproval:m,now,pins:f.pins});
  assert.equal(verify(request,sourceApproval,undefined).valid,false);
  assert.equal(verify(request,masterApproval,sourceApproval).valid,false);
  assert.equal(verify(request,{...sourceApproval,signature:masterApproval.signature},masterApproval).valid,false);
  assert.equal(verify(request,sourceApproval,{...masterApproval,signature:'a'.repeat(86)}).valid,false);
  assert.equal(verify({...request,payload:{...request.payload,nonce:'f'.repeat(32)}},
    sourceApproval,masterApproval).valid,false);
  assert.equal(inspectQl365aFirstTrustRequest({...request,payload:{...request.payload,
    legacyIssuerAuthenticated:true}},now,f.pins).valid,false);
  assert.equal(inspectQl365aFirstTrustRequest({...request,payload:{...request.payload,
    databaseEnrollmentAuthorized:true}},now,f.pins).valid,false);
  assert.equal(inspectQl365aFirstTrustRequest({...request,receiverActivated:true},now,f.pins).valid,false);
  assert.throws(()=>f.signRole({...request,payload:{...request.payload,deviceActions:true}},'source'),
    /DENY_QL365A/);
});

test('claimed active rollback stop, stale observation, wrong original host or byte drift fail',()=>{
  const f=fixture();
  const bad=change=>createQl365aFirstTrustRequest({...f.input,
    offObservation:{...f.offObservation,...change}});
  for(const mutation of [{originalReceiverStopped:true},{localListenerCount:1},
    {tailscaleServeNoConfig:false},{receiverActivated:true},{computer:'DIFFERENT'},
    {databaseEnrollmentCreated:true},{connected:true},{requestMayBeSigned:true},
    {originalIssuerEvidenceIndependentlyVerified:true},{sourceSigned:true}]){
    assert.throws(()=>bad(mutation),/HOLD_QL365A_GENUINE_INITIAL_OFF_OBSERVATION_REQUIRED/);
  }
  assert.throws(()=>bad({capturedAt:new Date(now-600_000).toISOString()}),
    /HOLD_QL365A_FRESH_INITIAL_OFF_OBSERVATION_REQUIRED/);
  assert.throws(()=>bad({evidenceDigests:{...f.offObservation.evidenceDigests,
    rollbackWitnessSha256:'f'.repeat(64)}}),/DENY_QL365A_OFF_OBSERVATION_WITNESS_DIGEST_DRIFT/);
  const tampered=join(f.evidencePaths.rollback,'..','modified-rollback.json');
  writeFileSync(tampered,'tamper-'.repeat(30));
  assert.throws(()=>createQl365aFirstTrustRequest({...f.input,
    evidencePaths:{...f.evidencePaths,rollback:tampered}}),
    /DENY_QL365A_OFF_OBSERVATION_WITNESS_DIGEST_DRIFT/);
  assert.throws(()=>createQl365aFirstTrustRequest({...f.input,
    sourceOriginalBytes:Buffer.from('unapproved source bytes')}),
    /HOLD_QL365A_PINNED_REE_AND_JACK_REQUIRED/);
});

test('CI or other nonoriginal host can inspect status, never prepare, sign or assemble',async()=>{
  const status=await ql365aCli(['--status']);
  assert.equal(status.connected,false);
  assert.equal(status.receiverActivated,false);
  assert.equal(status.databaseEnrollmentAuthorized,false);
  assert.equal(status.independentIssuerAuthenticated,false);
  assert.equal(status.independentWitnessAuthenticated,false);
  if(process.platform!=='win32'){
    for(const args of [['--prepare','one','two','three'],['--inspect','file'],
      ['--sign','one','two','three'],['--assemble','one','two','three'],
      ['--inspect-signed','one']])
      await assert.rejects(ql365aCli(args),/DENY_QL365A_NONORIGINAL_OWNER_ACTION/);
  }
  assert.equal((await ql365aCli(['--help'])).receiverActivated,false);
});
