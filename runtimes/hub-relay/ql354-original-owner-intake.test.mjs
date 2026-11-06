import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {createOwnerAuthorityCandidate} from './owner-authority-custody.mjs';
import {assembleSignedEnrollment,createEnrollmentRequest,hashWitnessFiles,
  signOwnerRequest} from './ql340b-enrollment.mjs';
import {authorizeQl354IndependentIntake,inspectQl354SignedIntake,
  insertQl354OriginalEnrollmentOnce,prepareQl354OneDeviceChallenge,
  reconcileQl354SignedChallenge,ql354Cli} from './ql354-original-owner-intake.mjs';
import {canonicalize} from '../master-discovery/manifest.mjs';

const sha=v=>createHash('sha256').update(v).digest('hex');
const now=Date.parse('2026-11-06T20:00:00.000Z');
const source=createOwnerAuthorityCandidate({role:'source',keyId:'original-source-review',
  passphrase:'synthetic-source-passphrase'});
const master=createOwnerAuthorityCandidate({role:'master',keyId:'original-master-review',
  passphrase:'synthetic-master-passphrase'});
const deviceKey=generateKeyPairSync('ed25519');
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKey.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:sha(deviceKey.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const candidates={device,source:source.publicCandidate,master:master.publicCandidate};
const evidencePaths={};
const dir=mkdtempSync(join(tmpdir(),'ql354-nonproduction-fixture-'));
for(const key of ['windows','privateTls','tailnetAcl','rollback']){
  const file=join(dir,`${key}.json`);
  writeFileSync(file,JSON.stringify({testOnly:true,key,uniqueWitness:sha(key)}));
  evidencePaths[key]=file;
}
const witnessHashes=hashWitnessFiles(evidencePaths);
const request=createEnrollmentRequest({...candidates,witnessHashes,now});
const signature=(role,owner,passphrase)=>signOwnerRequest({request,role,
  localCandidate:owner.publicCandidate,encryptedPrivateKeyPem:owner.encryptedPrivateKeyPem,
  passphrase,now});
const sourceApproval=signature('source',source,'synthetic-source-passphrase');
const masterApproval=signature('master',master,'synthetic-master-passphrase');
const assembled=assembleSignedEnrollment({request,sourceApproval,masterApproval,now});
const enrollment=assembled.enrollmentRecord,pins=assembled.ownerAuthorityPins;
const inspect=options=>inspectQl354SignedIntake({request,enrollment,pins,candidates,
  evidencePaths,now,...options});
const issuerHash=sha('external-independently-pinned-issuer');
const witnessHash=sha('separate-independently-pinned-witness');
const issuerVerifier=async(_,payloadSha256)=>({verified:true,payloadSha256,
  originalIssuerKeySha256:issuerHash,verifiedAt:new Date(now).toISOString()});
const witnessVerifier=async(_,payloadSha256)=>({verified:true,payloadSha256,
  independentWitnessKeySha256:witnessHash,verifiedAt:new Date(now).toISOString()});
const authorize=(review=inspect(),extra={})=>authorizeQl354IndependentIntake({review,
  request,enrollment,issuerEvidence:{synthetic:true},fieldWitness:{synthetic:true},
  verifyOriginalIssuer:issuerVerifier,verifyIndependentWitness:witnessVerifier,now,...extra});
const peers=()=>['rosiedazzlers','devilndove','icamp','yw','ai-data-platform',
  'rosevear-ai-hub'].map(peer_id=>({peer_id,connection_state:'HOLD',
    source_test_authorized:false,customer_data_allowed:false}));

test('real Ed25519 dual signatures, exact public pins, four original bytes and TEST scope are verified',()=>{
  const review=inspect();
  assert.equal(review.ownerSignaturesVerified,true);
  assert.equal(review.originalWitnessBytesMatch,true);
  assert.equal(review.approved,false);
  assert.equal(review.connectionState,'DISCONNECTED / HOLD');
  assert.match(review.state,/ISSUER_AND_WITNESS_HOLD/);
  assert.equal(inspect({pins:{...pins,source:{...pins.source,keyId:'forged'}}}).state,
    'DENY_ORIGINAL_REQUEST_PIN_OR_SIGNED_PAYLOAD_MISMATCH');
  assert.equal(inspect({enrollment:{...enrollment,approvals:{...enrollment.approvals,
    master:{...enrollment.approvals.master,signature:sourceApproval.signature}}}}).state,
    'DENY_OWNER_SIGNATURE');
  const changed=join(dir,'changed-witness.json');
  writeFileSync(changed,JSON.stringify({testOnly:true,changed:true,additional:'bytes changed'}));
  assert.equal(inspect({evidencePaths:{...evidencePaths,rollback:changed}}).state,
    'DENY_ORIGINAL_EVIDENCE_BYTES_CHANGED');
  assert.match(inspect({now:now+1_300_000}).state,/EXPIRED/);
  assert.equal(ql354Cli(['--help']).databaseWrites,0);
  assert.throws(()=>ql354Cli(['--enroll']),/DENY_QL354_UNSUPERVISED/);
});

test('browser flags and synthetic approvals cannot authenticate original issuer or witness',async()=>{
  const forged={...inspect(),ownerSignaturesVerified:true,approved:true};
  assert.match((await authorize(forged)).state,/HOLD_INDEPENDENT/);
  assert.match((await authorize(inspect(),{verifyOriginalIssuer:null})).state,/HOLD_INDEPENDENT/);
  assert.match((await authorize(inspect(),{verifyOriginalIssuer:async()=>({verified:true})})).state,
    /HOLD_INDEPENDENT/);
  assert.match((await authorize(inspect(),{verifyOriginalIssuer:async(_,payloadSha256)=>({
    verified:true,payloadSha256,originalIssuerKeySha256:source.publicCandidate.spkiSha256,
    verifiedAt:new Date(now).toISOString()})})).state,/HOLD_INDEPENDENT/);
  assert.match((await authorize(inspect(),{verifyIndependentWitness:async(_,payloadSha256)=>({
    verified:true,payloadSha256,independentWitnessKeySha256:issuerHash,
    verifiedAt:new Date(now).toISOString()})})).state,/HOLD_INDEPENDENT/);
  const approved=await authorize();
  assert.match(approved.state,/ONE_ENROLLMENT_ONLY/);
  assert.equal(approved.enrollment.payload.deviceId,'rosevear-windows-hub');
  assert.equal('password' in approved,false);
  assert.equal((await insertQl354OriginalEnrollmentOnce({permit:JSON.parse(JSON.stringify(approved)),
    transaction:async()=>{},now})).databaseEnrollmentCreated,false);
});

async function insertOnce({role='postgres',existing=0,receiptCount=0,rows=peers()}={}){
  const permit=await authorize();
  let inserts=0;
  const transaction=async callback=>callback({query:async(sql,params)=>{
    if(sql.includes('current_user'))return {rows:[{intake_role:role}]};
    if(sql.includes('device_enrollments')&&sql.includes('count'))return {rows:[{count:existing}]};
    if(sql.includes('device_revocations'))return {rows:[{count:0}]};
    if(sql.includes('relay_receipts'))return {rows:[{count:receiptCount}]};
    if(sql.includes('private_peers'))return {rows};
    if(sql.startsWith('INSERT')){inserts++;
      assert.deepEqual(params.slice(0,3),['rosevear-windows-hub','hub-probe','hub-ql339b']);
      assert.deepEqual(JSON.parse(params[3]),enrollment);
      return {rows:[{enrollment_id:'e204e58d-160b-442c-8d51-28192362267a'}]};}
    throw Error('unexpected-query');
  }});
  const result=await insertQl354OriginalEnrollmentOnce({permit,transaction,now});
  return {result,inserts,permit,transaction};
}

test('enrollment transaction is single-use, parameterized, admin-only, rollback-on-HOLD',async()=>{
  for(const options of [{role:'ql340c_private_receiver'},{existing:1},
    {receiptCount:1},{rows:peers().slice(1)}]){
    const {result,inserts}=await insertOnce(options);
    assert.equal(result.databaseEnrollmentCreated,false);
    assert.equal(inserts,0);
  }
  const {result,inserts,permit,transaction}=await insertOnce();
  assert.equal(result.databaseEnrollmentCreated,true);
  assert.equal(result.receiverActivated,false);
  assert.equal(result.connected,false);
  assert.equal(inserts,1);
  const replay=await insertQl354OriginalEnrollmentOnce({permit,transaction,now});
  assert.equal(replay.databaseEnrollmentCreated,false);
});

test('first challenge requires inserted enrollment plus a different limited receiver DB role',async()=>{
  const {result}=await insertOnce();
  const makeQuery=(role='ql340c_private_receiver')=>async sql=>{
    if(sql.includes('current_user'))return {rows:[{receiver_role:role}]};
    if(sql.includes('device_enrollments'))return {rows:[{enrollment_record:enrollment,revoked_at:null}]};
    if(sql.includes('device_revocations'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers()};
    if(sql.includes('relay_receipts'))return {rows:[{count:0}]};
    throw Error('unexpected-query');
  };
  assert.match((await prepareQl354OneDeviceChallenge({recordedTicket:JSON.parse(
    JSON.stringify(result.recordedTicket)),query:makeQuery(),now})).state,/HOLD/);
  const denied=await prepareQl354OneDeviceChallenge({recordedTicket:result.recordedTicket,
    query:makeQuery('postgres'),now});
  assert.match(denied.state,/DENY_PRIVILEGED/);
  assert.equal(denied.connected,false);
  // A rejected one-shot attempt cannot be replayed with a privileged role.
  assert.match((await prepareQl354OneDeviceChallenge({recordedTicket:result.recordedTicket,
    query:makeQuery(),now})).state,/HOLD_ORIGINAL/);
  const inserted=await insertOnce();
  const challenge=await prepareQl354OneDeviceChallenge({recordedTicket:inserted.result.recordedTicket,
    query:makeQuery(),now});
  assert.equal(challenge.schema,'rosevear.hub.ql354.one-test-challenge.v1');
  assert.equal(challenge.envelope.relayMode,'OUTBOUND_ONLY');
  assert.deepEqual(challenge.envelope.capabilities,['health.read','capabilities.read']);
  assert.equal(challenge.receiverActivated,false);
  const wrongPacket={envelope:{...challenge.envelope,deviceId:'other-device'},
    keyId:'hub-ql339b',signature:'_'.repeat(86)};
  assert.match((await reconcileQl354SignedChallenge({challenge,packet:wrongPacket,
    query:makeQuery(),pins,now})).state,/DENY_OR_EXPIRED/);
});

test('exact first signed receipt, original DB enrollment and device signature remain HELD',async()=>{
  const {result}=await insertOnce();
  let challenge;
  const query=async(sql,params)=>{
    if(sql.includes('current_user'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
    if(sql.includes('device_enrollments'))return {rows:[{enrollment_record:enrollment,revoked_at:null}]};
    if(sql.includes('device_revocations'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers()};
    if(sql.includes('count(receipt_id)'))return {rows:[{count:challenge?1:0}]};
    if(sql.includes('FROM public.master_hub_relay_receipts_ql338'))return {rows:[{
      device_id:'rosevear-windows-hub',workload_id:'hub-probe',
      session_id:challenge.envelope.sessionId,sequence_no:1,
      nonce:challenge.envelope.nonce,heartbeat_sha256:sha(canonicalize(challenge.envelope)),
      queue_depth:0,source_app_id:'rosevear-ai-hub',connection_state:'HOLD',
      received_at:new Date(now)}]};
    throw Error('unexpected-query');
  };
  challenge=await prepareQl354OneDeviceChallenge({recordedTicket:result.recordedTicket,
    query,now});
  const packet={envelope:challenge.envelope,keyId:'hub-ql339b',
    signature:sign(null,Buffer.from(canonicalize(challenge.envelope)),
      deviceKey.privateKey).toString('base64url')};
  const verified=await reconcileQl354SignedChallenge({challenge,packet,query,pins,now});
  assert.equal(verified.state,'FIRST_ORIGINAL_SIGNED_TEST_CHALLENGE_AND_DB_RECEIPT_VERIFIED');
  assert.equal(verified.originalTestReceiptVerified,true);
  assert.equal(verified.connected,false);
  assert.equal(verified.sourceTestAuthorized,false);
  const fake={...packet,signature:'A'.repeat(86)};
  assert.match((await reconcileQl354SignedChallenge({challenge,packet:fake,query,pins,now})).state,
    /DENY_ORIGINAL_DEVICE_SIGNATURE/);
  assert.match((await reconcileQl354SignedChallenge({challenge,packet,query,pins,
    now:now+91_000})).state,/DENY_OR_EXPIRED/);
});
