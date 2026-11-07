import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {createEnrollmentRequest,assembleSignedEnrollment,hashWitnessFiles,
  signOwnerRequest} from './ql340b-enrollment.mjs';
import {QL355_ATTESTATION} from './ql355-independent-authority.mjs';
import {prepareQl354OneDeviceChallenge} from './ql354-original-owner-intake.mjs';
import {executeQl357SupervisedEnrollment,inspectQl357PrivateReceiverReadiness,
  acceptQl357OneCrossDeviceTest,ql357Cli} from './ql357-original-activation.mjs';

const now=Date.parse('2026-11-07T01:00:00.000Z');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const deviceKey=generateKeyPairSync('ed25519');
const issuerKey=generateKeyPairSync('ed25519');
const witnessKey=generateKeyPairSync('ed25519');
const keys={original_issuer:issuerKey,field_witness:witnessKey};
const source=createOwnerAuthorityCandidate({role:'source',keyId:'ql357-ree-source',
  passphrase:'synthetic-ree-test-owner-passphrase'});
const master=createOwnerAuthorityCandidate({role:'master',keyId:'ql357-jack-master',
  passphrase:'synthetic-jack-test-owner-passphrase'});
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKey.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:digest(deviceKey.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const candidates={device,source:source.publicCandidate,master:master.publicCandidate};
const evidencePaths={};
const dir=mkdtempSync(join(tmpdir(),'ql357-only-synthetic-'));
for(const role of ['windows','privateTls','tailnetAcl','rollback']){
  evidencePaths[role]=join(dir,role+'.json');
  writeFileSync(evidencePaths[role],JSON.stringify({syntheticOnly:true,role,bytes:digest(role)}));
}
const request=createEnrollmentRequest({...candidates,
  witnessHashes:hashWitnessFiles(evidencePaths),now});
const approval=(role,owner,passphrase)=>signOwnerRequest({request,role,
  localCandidate:owner.publicCandidate,
  encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,passphrase,now});
const assembled=assembleSignedEnrollment({request,
  sourceApproval:approval('source',source,'synthetic-ree-test-owner-passphrase'),
  masterApproval:approval('master',master,'synthetic-jack-test-owner-passphrase'),now});
const enrollment=assembled.enrollmentRecord,pins=assembled.ownerAuthorityPins;
const hash=digest(canonicalize(request.payload));
const attest=role=>{
  const payload={schema:QL355_ATTESTATION,role,
    audience:'rosevear-comms-hub:original-enrollment:TEST',
    enrollmentPayloadSha256:hash,scope:'one-original-device-test-only',
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+180_000).toISOString()};
  return {schema:QL355_ATTESTATION,payload,
    signature:sign(null,Buffer.from(canonicalize(payload)),keys[role].privateKey).toString('base64url')};
};
const issuerAttestation=attest('original_issuer'),witnessAttestation=attest('field_witness');
const resolvePinnedAuthority=async role=>({role,
  publicKeyPem:keys[role].publicKey.export({type:'spki',format:'pem'}),
  spkiSha256:digest(keys[role].publicKey.export({type:'spki',format:'der'}))});
const verifyIndependentCustody=async({role,spkiSha256,requestSha256})=>({
  role,spkiSha256,requestSha256,authenticated:true,revoked:false});
const common={request,enrollment,pins,candidates,evidencePaths,
  issuerAttestation,witnessAttestation,resolvePinnedAuthority,verifyIndependentCustody,now};
const peers=['rosiedazzlers','devilndove','icamp','yw','ai-data-platform',
  'rosevear-ai-hub'].map(peer_id=>({peer_id,
    peer_kind:['rosiedazzlers','devilndove','icamp','yw'].includes(peer_id)?'business':'support',
    source_repo:({rosiedazzlers:'rosiedazzlers',devilndove:'devilndove-site',
      icamp:'iCamp',yw:'yw','ai-data-platform':'ai-data-platform',
      'rosevear-ai-hub':'rosevear-ai-hub'})[peer_id],
    connection_state:'HOLD',source_test_authorized:false,customer_data_allowed:false}));
const operator=async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
  originalComputer:'DESKTOP-AE894KC',replayOrRevocationFound:false,expiresAt:now+30_000});
const transport=async()=>({state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
  originalComputer:'DESKTOP-AE894KC',peerIp:'100.114.56.26',boundIp:'100.77.246.3',
  tlsPort:8443,tlsVerified:true,privateReceiverLoopbackVerified:true,observedAt:now});
const privateQuery=async(sql)=>{
  if(sql.includes('current_user'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
  if(sql.includes('device_enrollments'))return {rows:[{enrollment_record:enrollment,revoked_at:null}]};
  if(sql.includes('device_revocations'))return {rows:[{count:0}]};
  if(sql.includes('count(receipt_id)'))return {rows:[{count:0}]};
  if(sql.includes('private_peers'))return {rows:peers};
  throw Error('Unexpected private SQL '+sql);
};

test('QL-357 cannot create enrollment without genuine outside signature and administrator function',async()=>{
  const none=await executeQl357SupervisedEnrollment({...common});
  assert.match(none.state,/PRIVATE_ORIGINAL_ADMINISTRATOR/);
  const forged=await executeQl357SupervisedEnrollment({...common,
    issuerAttestation:{approved:true},adminTransaction:async()=>{throw Error('must not call');}});
  assert.match(forged.state,/HOLD_REE_JACK/);
  const fakeCustody=await executeQl357SupervisedEnrollment({...common,
    verifyIndependentCustody:async()=>({authenticated:true}),
    adminTransaction:async()=>{throw Error('must not call');}});
  assert.equal(fakeCustody.databaseEnrollmentWritten,undefined);
  assert.equal(fakeCustody.connected,false);
});

test('QL-357 consumes a genuine in-memory enrollment permit through one original admin transaction',async()=>{
  let writes=0;
  const adminTransaction=async run=>run({query:async(sql,params)=>{
    if(sql.includes('current_user'))return {rows:[{intake_role:'postgres'}]};
    if(sql.startsWith('SELECT count'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers};
    if(sql.startsWith('INSERT')){
      assert.equal(params[0],'rosevear-windows-hub');writes++;
      return {rows:[{enrollment_id:'e21f839e-e009-4a39-82d7-c0450a5b0ce1'}]};
    }
    throw Error('Unexpected admin SQL');
  }});
  const result=await executeQl357SupervisedEnrollment({...common,adminTransaction});
  assert.equal(result.databaseEnrollmentWritten,true,result.state);
  assert.equal(writes,1);
  assert.equal(result.receiverReadyForOneTest,false);
  assert.equal(result.connected,false);
  const challenge=await prepareQl354OneDeviceChallenge({
    recordedTicket:result.recordedTicket,query:privateQuery,now});
  assert.equal(challenge.state,'ONE_UNSIGNED_ORIGINAL_DEVICE_TEST_CHALLENGE_AWAITING_LOCAL_SIGNATURE');
  assert.equal(challenge.receiverActivated,false);
  const packet={envelope:challenge.envelope,keyId:'hub-ql339b',
    signature:sign(null,Buffer.from(canonicalize(challenge.envelope)),
      deviceKey.privateKey).toString('base64url')};
  const query=async(sql)=>{
    if(sql.includes('count(receipt_id)'))return {rows:[{count:1}]};
    if(sql.includes('FROM public.master_hub_relay_receipts_ql338'))return {rows:[{
      device_id:'rosevear-windows-hub',workload_id:'hub-probe',
      session_id:challenge.envelope.sessionId,sequence_no:1,
      nonce:challenge.envelope.nonce,
      heartbeat_sha256:digest(canonicalize(challenge.envelope)),
      queue_depth:0,source_app_id:'rosevear-ai-hub',connection_state:'HOLD',
      received_at:new Date(now)}]};
    return privateQuery(sql);
  };
  const accepted=await acceptQl357OneCrossDeviceTest({challenge,packet,query,
    pins,verifyPrivateOperator:operator,verifyOriginalTransport:transport,now});
  assert.equal(accepted.firstPrivateTestAccepted,true,accepted.state);
  assert.equal(accepted.originalReceiptCount,1);
  assert.equal(accepted.connectedCount,0);
});

test('QL-357 private readiness verifies original signatures, pinned issuer/witness, exact DB, role, session, transport',async()=>{
  const ready=await inspectQl357PrivateReceiverReadiness({...common,
    query:privateQuery,verifyPrivateOperator:operator,verifyOriginalTransport:transport});
  assert.equal(ready.receiverReadyForOneTest,true,ready.state);
  assert.equal(ready.databaseEnrollmentVerified,true);
  assert.equal(ready.originalIssuerAuthenticated,true);
  assert.equal(ready.ownersIndependentlyApproved,true);
  assert.deepEqual(ready.authorizedTestScope,['health.read','capabilities.read']);
  assert.equal(ready.connected,false);
  const unauthorized=await inspectQl357PrivateReceiverReadiness({...common,
    query:privateQuery,verifyPrivateOperator:async()=>({approved:true}),
    verifyOriginalTransport:transport});
  assert.match(unauthorized.state,/PRIVATE_OPERATOR/);
});

test('QL-357 wrong receiver role, missing enrollment, changed witness and transport deny readiness',async()=>{
  for(const [key,value] of [
    ['query',async sql=>sql.includes('current_user')?{rows:[{receiver_role:'postgres'}]}:privateQuery(sql)],
    ['query',async sql=>sql.includes('device_enrollments')?{rows:[]}:privateQuery(sql)],
    ['verifyOriginalTransport',async()=>({...await transport(),peerIp:'203.0.113.10'})],
    ['verifyIndependentCustody',async()=>({authenticated:true})]
  ]){
    const result=await inspectQl357PrivateReceiverReadiness({...common,
      query:privateQuery,verifyPrivateOperator:operator,
      verifyOriginalTransport:transport,[key]:value});
    assert.notEqual(result.receiverReadyForOneTest,true,result.state);
    assert.equal(result.connected,false);
  }
  const changed=join(dir,'changed-witness.json');
  writeFileSync(changed,JSON.stringify({bad:true,bytes:'x'.repeat(64)}));
  assert.equal((await inspectQl357PrivateReceiverReadiness({...common,
    evidencePaths:{...evidencePaths,rollback:changed},query:privateQuery,
    verifyPrivateOperator:operator,verifyOriginalTransport:transport})).receiverReadyForOneTest,false);
});

test('QL-357 no synthetic receipt, HTTP 503 or public CLI claim can authorize source peers',async()=>{
  const r=await acceptQl357OneCrossDeviceTest({});
  assert.equal(r.firstPrivateTestAccepted,false);
  assert.equal(r.connectedCount,0);
  assert.equal(r.customerCommunications,false);
  assert.equal(ql357Cli(['--help']).databaseWrites,0);
  assert.throws(()=>ql357Cli(['--start']),/DENY_UNSUPERVISED/);
});
