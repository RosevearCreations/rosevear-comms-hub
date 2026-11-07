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
import {acceptQl355FirstPrivateTest} from './ql355-independent-authority.mjs';
import {executeQl357SupervisedEnrollment} from './ql357-original-activation.mjs';
import {prepareQl354OneDeviceChallenge,reconcileQl354SignedChallenge} from './ql354-original-owner-intake.mjs';
import {inspectQl358OriginalFieldAndEnrollment,verifyQl358DedicatedReceiverSession,
  reconcileQl358FirstLiveTest,ql358Cli} from './ql358-field-credential-reconciliation.mjs';

const now=Date.parse('2026-11-07T02:00:00.000Z');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const deviceKey=generateKeyPairSync('ed25519');
const authorities={original_issuer:generateKeyPairSync('ed25519'),
  field_witness:generateKeyPairSync('ed25519')};
const ree=createOwnerAuthorityCandidate({role:'source',keyId:'ql358-original-ree',
  passphrase:'synthetic-test-only-ree-passphrase'});
const jack=createOwnerAuthorityCandidate({role:'master',keyId:'ql358-original-jack',
  passphrase:'synthetic-test-only-jack-passphrase'});
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKey.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:sha(deviceKey.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const candidates={device,source:ree.publicCandidate,master:jack.publicCandidate};
const evidencePaths={},dir=mkdtempSync(join(tmpdir(),'ql358-synthetic-only-'));
for(const role of ['windows','privateTls','tailnetAcl','rollback']){
  evidencePaths[role]=join(dir,role+'.json');
  writeFileSync(evidencePaths[role],JSON.stringify({syntheticOnly:true,role}));
}
const request=createEnrollmentRequest({...candidates,
  witnessHashes:hashWitnessFiles(evidencePaths),now});
const approval=(role,owner,passphrase)=>signOwnerRequest({request,role,
  localCandidate:owner.publicCandidate,encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,
  passphrase,now});
const assembled=assembleSignedEnrollment({request,
  sourceApproval:approval('source',ree,'synthetic-test-only-ree-passphrase'),
  masterApproval:approval('master',jack,'synthetic-test-only-jack-passphrase'),now});
const enrollment=assembled.enrollmentRecord,pins=assembled.ownerAuthorityPins;
const payloadSha256=sha(canonicalize(request.payload));
const attest=role=>{
  const payload={schema:QL355_ATTESTATION,role,
    audience:'rosevear-comms-hub:original-enrollment:TEST',
    enrollmentPayloadSha256:payloadSha256,scope:'one-original-device-test-only',
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+180_000).toISOString()};
  return {schema:QL355_ATTESTATION,payload,
    signature:sign(null,Buffer.from(canonicalize(payload)),
      authorities[role].privateKey).toString('base64url')};
};
const issuerAttestation=attest('original_issuer');
const witnessAttestation=attest('field_witness');
const resolvePinnedAuthority=async role=>({role,
  publicKeyPem:authorities[role].publicKey.export({type:'spki',format:'pem'}),
  spkiSha256:sha(authorities[role].publicKey.export({type:'spki',format:'der'}))});
const verifyIndependentCustody=async({role,spkiSha256,requestSha256})=>({
  role,spkiSha256,requestSha256,authenticated:true,revoked:false});
const proof={request,enrollment,pins,candidates,evidencePaths,issuerAttestation,
  witnessAttestation,resolvePinnedAuthority,verifyIndependentCustody,now};
const peers=['rosiedazzlers','devilndove','icamp','yw','ai-data-platform',
  'rosevear-ai-hub'].map(peer_id=>({peer_id,
    peer_kind:['rosiedazzlers','devilndove','icamp','yw'].includes(peer_id)?'business':'support',
    source_repo:({rosiedazzlers:'rosiedazzlers',devilndove:'devilndove-site',
      icamp:'iCamp',yw:'yw','ai-data-platform':'ai-data-platform',
      'rosevear-ai-hub':'rosevear-ai-hub'})[peer_id],
    connection_state:'HOLD',source_test_authorized:false,customer_data_allowed:false}));
const queries=async(sql)=>{
  if(sql.includes('administrator_role'))return {rows:[{administrator_role:'postgres'}]};
  if(sql.includes('receiver_role'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
  if(sql.includes('device_enrollments'))return {rows:[{enrollment_record:enrollment,revoked_at:null}]};
  if(sql.includes('device_revocations'))return {rows:[{count:0}]};
  if(sql.includes('count(receipt_id)'))return {rows:[{count:0}]};
  if(sql.includes('private_peers'))return {rows:peers};
  throw Error(`Unexpected SQL ${sql}`);
};
const field=()=>inspectQl358OriginalFieldAndEnrollment({...proof,adminQuery:queries});

test('QL-358 original field requires independently pinned issuer, two owners and original DB admin',async()=>{
  assert.match((await inspectQl358OriginalFieldAndEnrollment(proof)).state,/ADMINISTRATOR/);
  assert.match((await inspectQl358OriginalFieldAndEnrollment({...proof,
    issuerAttestation:{approved:true},adminQuery:queries})).state,/EXTERNALLY_PINNED/);
  assert.match((await inspectQl358OriginalFieldAndEnrollment({...proof,
    verifyIndependentCustody:async()=>({authenticated:true}),adminQuery:queries})).state,/EXTERNALLY_PINNED/);
  assert.match((await inspectQl358OriginalFieldAndEnrollment({...proof,
    adminQuery:async sql=>sql.includes('administrator_role')?
      {rows:[{administrator_role:'ql340c_private_receiver'}]}:queries(sql)})).state,/NONORIGINAL_ADMINISTRATOR/);
  assert.match((await inspectQl358OriginalFieldAndEnrollment({...proof,
    adminQuery:async sql=>sql.includes('device_enrollments')?{rows:[]}:queries(sql)})).state,/ENROLLMENT_NOT_FOUND/);
});

test('QL-358 exact original signed DB record and six held peer readback yields one private field ticket',async()=>{
  const result=await field();
  assert.equal(result.databaseEnrollmentVerified,true,result.state);
  assert.equal(result.originalIssuerAuthenticated,true);
  assert.equal(result.independentWitnessAuthenticated,true);
  assert.equal(result.ownersIndependentlyApproved,true);
  assert.equal(result.connected,false);
  assert.equal(result.receiverActivated,false);
  const forged=JSON.parse(JSON.stringify(result));
  const attempted=await verifyQl358DedicatedReceiverSession({fieldTicket:forged,
    withOriginalReeDpapiReceiverSession:async()=>true,now});
  assert.match(attempted.state,/ORIGINAL_FIELD_TICKET/);
});

test('QL-358 dedicated private credential requires verified restricted role and actual checked callback',async()=>{
  let ticket=await field();
  const fake=await verifyQl358DedicatedReceiverSession({fieldTicket:ticket,
    withOriginalReeDpapiReceiverSession:async()=>true,now});
  assert.match(fake.state,/SESSION_NOT_VERIFIED/);
  ticket=await field();
  const wrong=await verifyQl358DedicatedReceiverSession({fieldTicket:ticket,
    withOriginalReeDpapiReceiverSession:async fn=>fn(async sql=>sql.includes('receiver_role')?
      {rows:[{receiver_role:'postgres'}]}:queries(sql)),now});
  assert.match(wrong.state,/WRONG_ROLE/);
  ticket=await field();
  const legit=await verifyQl358DedicatedReceiverSession({fieldTicket:ticket,
    withOriginalReeDpapiReceiverSession:async fn=>fn(queries),now});
  assert.equal(legit.dedicatedReceiverCredentialVerified,true,legit.state);
  assert.equal(legit.connected,false);
  const replay=await verifyQl358DedicatedReceiverSession({fieldTicket:ticket,
    withOriginalReeDpapiReceiverSession:async fn=>fn(queries),now});
  assert.match(replay.state,/ORIGINAL_FIELD_TICKET/);
});

test('QL-358 altered original evidence, prior receipt, or drifted peers stays HOLD',async()=>{
  const changed=join(dir,'changed-rollback.json');
  writeFileSync(changed,JSON.stringify({notOriginal:true}));
  assert.equal((await inspectQl358OriginalFieldAndEnrollment({...proof,
    evidencePaths:{...evidencePaths,rollback:changed},adminQuery:queries})).databaseEnrollmentVerified,false);
  for(const altered of [
    sql=>sql.includes('count(receipt_id)')?{rows:[{count:1}]}:queries(sql),
    sql=>sql.includes('private_peers')?{rows:peers.map((p,i)=>i===0?
      {...p,source_test_authorized:true}:p)}:queries(sql)
  ]){
    assert.equal((await inspectQl358OriginalFieldAndEnrollment({...proof,
      adminQuery:altered})).databaseEnrollmentVerified,false);
  }
});

test('QL-358 first live reconciliation cannot accept synthetic receipt, replay or CLI activation',async()=>{
  const fieldTicket=await field();
  const receiverTicket=await verifyQl358DedicatedReceiverSession({fieldTicket,
    withOriginalReeDpapiReceiverSession:async fn=>fn(queries),now});
  const noReceipt=await reconcileQl358FirstLiveTest({receiverTicket,now});
  assert.match(noReceipt.state,/REAL_ORIGINAL_DEVICE_SIGNATURE/);
  assert.equal(noReceipt.firstLiveTestReceiptVerified,false);
  assert.match((await reconcileQl358FirstLiveTest({receiverTicket,now})).state,/SINGLE_USE/);
  assert.equal(ql358Cli(['--help']).databaseWrites,0);
  assert.throws(()=>ql358Cli(['--enroll']),/DENY_UNSUPERVISED/);
});

test('QL-358 genuine synthetic cryptographic receipt path still has all six apps held',async()=>{
  const adminTransaction=async run=>run({query:async(sql,params)=>{
    if(sql.includes('current_user'))return {rows:[{intake_role:'postgres'}]};
    if(sql.startsWith('SELECT count'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers};
    if(sql.startsWith('INSERT'))return {rows:[{enrollment_id:'c87430a1-79fd-4880-a380-f913d60b47fa'}]};
    throw Error('Unexpected admin SQL');
  }});
  const enrolled=await executeQl357SupervisedEnrollment({...proof,adminTransaction});
  assert.equal(enrolled.databaseEnrollmentWritten,true,enrolled.state);
  const challenge=await prepareQl354OneDeviceChallenge({recordedTicket:enrolled.recordedTicket,
    query:queries,now});
  assert.equal(challenge.state,'ONE_UNSIGNED_ORIGINAL_DEVICE_TEST_CHALLENGE_AWAITING_LOCAL_SIGNATURE');
  const packet={envelope:challenge.envelope,keyId:'hub-ql339b',
    signature:sign(null,Buffer.from(canonicalize(challenge.envelope)),
      deviceKey.privateKey).toString('base64url')};
  const postReceipt=async sql=>{
    if(sql.includes('count(receipt_id)'))return {rows:[{count:1}]};
    if(sql.includes('FROM public.master_hub_relay_receipts_ql338'))return {rows:[{
      device_id:'rosevear-windows-hub',workload_id:'hub-probe',
      session_id:challenge.envelope.sessionId,sequence_no:1,
      nonce:challenge.envelope.nonce,
      heartbeat_sha256:sha(canonicalize(challenge.envelope)),queue_depth:0,
      source_app_id:'rosevear-ai-hub',connection_state:'HOLD',received_at:new Date(now)}]};
    return queries(sql);
  };
  const fieldTicket=await field();
  const receiverTicket=await verifyQl358DedicatedReceiverSession({fieldTicket,
    withOriginalReeDpapiReceiverSession:async fn=>fn(queries),now});
  const authenticatedOperator=async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
    originalComputer:'DESKTOP-AE894KC',replayOrRevocationFound:false,expiresAt:now+20_000});
  const verifiedTransport=async()=>({state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
    originalComputer:'DESKTOP-AE894KC',peerIp:'100.114.56.26',boundIp:'100.77.246.3',
    tlsPort:8443,tlsVerified:true,privateReceiverLoopbackVerified:true,observedAt:now});
  const originalReceiptInputs={challenge,packet,query:postReceipt,pins,now,
    verifyPrivateOperator:authenticatedOperator,verifyOriginalTransport:verifiedTransport};
  const underlying=await reconcileQl354SignedChallenge({challenge,packet,query:postReceipt,pins,now});
  assert.equal(underlying.originalTestReceiptVerified,true,underlying.state);
  const raw=await acceptQl355FirstPrivateTest(originalReceiptInputs);
  assert.equal(raw.firstPrivateTestAccepted,true,raw.state);
  const tested=await reconcileQl358FirstLiveTest({receiverTicket,challenge,packet,
    query:postReceipt,pins,now,verifyPrivateOperator:authenticatedOperator,
    verifyOriginalTransport:verifiedTransport});
  assert.equal(tested.firstLiveTestReceiptVerified,true,`${tested.state}: ${tested.reconciliationState}`);
  assert.equal(tested.verifiedReceiptCount,1);
  assert.equal(tested.connectedCount,0);
  assert.equal(tested.customerCommunications,false);
});
