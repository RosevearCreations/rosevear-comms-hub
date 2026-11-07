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
import {executeQl357SupervisedEnrollment} from './ql357-original-activation.mjs';
import {prepareQl354OneDeviceChallenge} from './ql354-original-owner-intake.mjs';
import {inspectQl358OriginalFieldAndEnrollment,
  verifyQl358DedicatedReceiverSession} from './ql358-field-credential-reconciliation.mjs';
import {QL359_CLOSEOUT_ATTESTATION,verifyQl359CloseoutWitness,
  reconcileQl359SupervisedPrivateTest,ql359Cli} from './ql359-supervised-private-closeout.mjs';

const now=Date.parse('2026-11-07T03:00:00.000Z');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const deviceKey=generateKeyPairSync('ed25519');
const roots={original_issuer:generateKeyPairSync('ed25519'),field_witness:generateKeyPairSync('ed25519')};
const ree=createOwnerAuthorityCandidate({role:'source',keyId:'ql359-original-ree',passphrase:'only-synthetic-ree'});
const jack=createOwnerAuthorityCandidate({role:'master',keyId:'ql359-original-jack',passphrase:'only-synthetic-jack'});
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',deviceId:'rosevear-windows-hub',
  workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:deviceKey.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:sha(deviceKey.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const candidates={device,source:ree.publicCandidate,master:jack.publicCandidate};
const evidencePaths={},dir=mkdtempSync(join(tmpdir(),'ql359-synthetic-only-'));
for(const name of ['windows','privateTls','tailnetAcl','rollback']){
  evidencePaths[name]=join(dir,`${name}.json`);
  writeFileSync(evidencePaths[name],JSON.stringify({syntheticOnly:true,name}));
}
const request=createEnrollmentRequest({...candidates,witnessHashes:hashWitnessFiles(evidencePaths),now});
const signedRole=(role,authority,passphrase)=>signOwnerRequest({request,role,
  localCandidate:authority.publicCandidate,encryptedPrivateKeyPem:authority.encryptedPrivateKeyPem,
  passphrase,now});
const {enrollmentRecord:enrollment,ownerAuthorityPins:pins}=assembleSignedEnrollment({request,
  sourceApproval:signedRole('source',ree,'only-synthetic-ree'),
  masterApproval:signedRole('master',jack,'only-synthetic-jack'),now});
const payloadSha256=sha(canonicalize(request.payload));
const attestation=role=>{
  const payload={schema:QL355_ATTESTATION,role,
    audience:'rosevear-comms-hub:original-enrollment:TEST',
    enrollmentPayloadSha256:payloadSha256,scope:'one-original-device-test-only',
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+180_000).toISOString()};
  return {schema:QL355_ATTESTATION,payload,signature:sign(null,
    Buffer.from(canonicalize(payload)),roots[role].privateKey).toString('base64url')};
};
const peers=['rosiedazzlers','devilndove','icamp','yw','ai-data-platform','rosevear-ai-hub']
  .map(peer_id=>({peer_id,peer_kind:['rosiedazzlers','devilndove','icamp','yw'].includes(peer_id)?'business':'support',
    source_repo:({rosiedazzlers:'rosiedazzlers',devilndove:'devilndove-site',
      icamp:'iCamp',yw:'yw','ai-data-platform':'ai-data-platform','rosevear-ai-hub':'rosevear-ai-hub'})[peer_id],
    connection_state:'HOLD',source_test_authorized:false,customer_data_allowed:false}));
let afterReceipt=false;
let activeReceipt=null;
const query=async sql=>{
  if(sql.includes('administrator_role'))return {rows:[{administrator_role:'postgres'}]};
  if(sql.includes('receiver_role'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
  if(sql.includes('device_enrollments'))return {rows:[{enrollment_record:enrollment,revoked_at:null}]};
  if(sql.includes('device_revocations'))return {rows:[{count:0}]};
  if(sql.includes('count(receipt_id)'))return {rows:[{count:afterReceipt?1:0}]};
  if(sql.includes('private_peers'))return {rows:peers};
  if(sql.includes('FROM public.master_hub_relay_receipts_ql338'))
    return {rows:activeReceipt?[activeReceipt]:[]};
  throw Error(`Unexpected query: ${sql}`);
};
const fieldInputs={request,enrollment,pins,candidates,evidencePaths,now,
  issuerAttestation:attestation('original_issuer'),witnessAttestation:attestation('field_witness'),
  resolvePinnedAuthority:async role=>({role,
    publicKeyPem:roots[role].publicKey.export({type:'spki',format:'pem'}),
    spkiSha256:sha(roots[role].publicKey.export({type:'spki',format:'der'}))}),
  verifyIndependentCustody:async({role,spkiSha256,requestSha256})=>({
    role,spkiSha256,requestSha256,authenticated:true,revoked:false}),adminQuery:query};
const witnessChecks={resolvePinnedAuthority:fieldInputs.resolvePinnedAuthority,
  verifyIndependentCustody:fieldInputs.verifyIndependentCustody};
const signCloseout=({challenge,packet})=>{
  const sessionId=challenge.envelope.sessionId;
  const transcriptSha256=sha(canonicalize({sessionId,nonce:challenge.envelope.nonce,
    deviceId:'rosevear-windows-hub',signedEnvelopeSha256:sha(canonicalize(packet.envelope)),
    packetSignature:packet.signature,originalReceiptAt:new Date(now).toISOString()}));
  const payload={schema:QL359_CLOSEOUT_ATTESTATION,role:'field_witness',
    audience:'rosevear-comms-hub:original-private-test:TEST',
    scope:'first-original-private-test-closeout-only',sessionId,transcriptSha256,
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+60_000).toISOString()};
  return {schema:QL359_CLOSEOUT_ATTESTATION,payload,
    signature:sign(null,Buffer.from(canonicalize(payload)),roots.field_witness.privateKey)
      .toString('base64url')};
};
const receiverTicket=async()=>{
  afterReceipt=false;
  const field=await inspectQl358OriginalFieldAndEnrollment(fieldInputs);
  assert.equal(field.databaseEnrollmentVerified,true,field.state);
  const ticket=await verifyQl358DedicatedReceiverSession({fieldTicket:field,
    withOriginalReeDpapiReceiverSession:async run=>run(query),now});
  assert.equal(ticket.dedicatedReceiverCredentialVerified,true,ticket.state);
  return ticket;
};

const realSignedSyntheticTest=async()=>{
  afterReceipt=false;
  activeReceipt=null;
  const adminTransaction=async run=>run({query:async sql=>{
    if(sql.includes('current_user'))return {rows:[{intake_role:'postgres'}]};
    if(sql.startsWith('SELECT count'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers};
    if(sql.startsWith('INSERT'))return {rows:[{enrollment_id:'e6aa3dc1-6b49-492b-9d9d-c08e62261dba'}]};
    throw Error(`Unrecognized enrollment SQL: ${sql}`);
  }});
  const enrolled=await executeQl357SupervisedEnrollment({...fieldInputs,adminTransaction});
  assert.equal(enrolled.databaseEnrollmentWritten,true,enrolled.state);
  const challenge=await prepareQl354OneDeviceChallenge({recordedTicket:enrolled.recordedTicket,
    query,now});
  assert.equal(challenge.state,'ONE_UNSIGNED_ORIGINAL_DEVICE_TEST_CHALLENGE_AWAITING_LOCAL_SIGNATURE');
  const packet={envelope:challenge.envelope,keyId:'hub-ql339b',
    signature:sign(null,Buffer.from(canonicalize(challenge.envelope)),
      deviceKey.privateKey).toString('base64url')};
  activeReceipt={device_id:'rosevear-windows-hub',workload_id:'hub-probe',
    session_id:challenge.envelope.sessionId,sequence_no:1,
    nonce:challenge.envelope.nonce,heartbeat_sha256:sha(canonicalize(challenge.envelope)),
    queue_depth:0,source_app_id:'rosevear-ai-hub',connection_state:'HOLD',
    received_at:new Date(now)};
  const ticket=await receiverTicket();
  afterReceipt=true;
  const input={receiverTicket:ticket,challenge,packet,pins,query,now,
    ...witnessChecks,witnessAttestation:signCloseout({challenge,packet}),
    verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',replayOrRevocationFound:false,expiresAt:now+20_000}),
    verifyOriginalTransport:async()=>({state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',peerIp:'100.114.56.26',boundIp:'100.77.246.3',
      tlsPort:8443,tlsVerified:true,privateReceiverLoopbackVerified:true,observedAt:now})};
  return input;
};

test('QL-359 refuses missing original private probes, forged JSON tickets, and CLI automation',async()=>{
  const forbidden=await reconcileQl359SupervisedPrivateTest({receiverTicket:{state:'APPROVED'},
    query,verifyOriginalReceiverStopped:async()=>({}),...witnessChecks,now});
  assert.match(forbidden.state,/ONE_USE_TICKET/);
  assert.match((await reconcileQl359SupervisedPrivateTest()).state,/PRIVATE_DB_STOP/);
  assert.equal(ql359Cli(['--help']).roleGrants,0);
  assert.throws(()=>ql359Cli(['--activate']),/DENY_UNSUPERVISED/);
});

test('QL-359 consumes a valid single-use ticket on an absent original receipt',async()=>{
  const ticket=await receiverTicket();
  const extra={receiverTicket:ticket,query,verifyOriginalReceiverStopped:async()=>({}),
    ...witnessChecks,now};
  assert.match((await reconcileQl359SupervisedPrivateTest(extra)).state,/REAL_DEVICE_RECEIPT/);
  assert.match((await reconcileQl359SupervisedPrivateTest(extra)).upstreamState,/SINGLE_USE/);
});

test('QL-359 cannot accept a mere fake post-receipt status or a self-declared witness',async()=>{
  const ticket=await receiverTicket();
  afterReceipt=true;
  let stopCalled=false;
  const rejected=await reconcileQl359SupervisedPrivateTest({receiverTicket:ticket,query,
    verifyOriginalReceiverStopped:async()=>{stopCalled=true;return {listenerCount:0};},
    ...witnessChecks,now});
  assert.equal(stopCalled,false); // Real signed packet and immutable matching receipt first.
  assert.equal(rejected.firstPrivateTestReceiptVerified,false);
  assert.equal(rejected.connected,false);
});

test('QL-359 demands original-host observed receiver stop and independently authenticated exact transcript',async()=>{
  // Proof accepted by QL-358 must be a real original-device-signed packet.
  // This upstream rejection prevents either callback from turning synthetic
  // evidence, test data, or a forged receipt into genuine activation.
  const ticket=await receiverTicket();
  const fake={receiverTicket:ticket,challenge:{envelope:{sessionId:'fabricated',nonce:'fake'}},
    packet:{envelope:{sessionId:'fabricated',nonce:'fake'},signature:'fake'},query,
    pins,verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION'}),
    verifyOriginalTransport:async()=>({tlsVerified:true}),
    verifyOriginalReceiverStopped:async()=>({state:'ORIGINAL_REE_RECEIVER_STOPPED_SUPERVISED'}),
    ...witnessChecks,now};
  assert.match((await reconcileQl359SupervisedPrivateTest(fake)).state,/REAL_DEVICE_RECEIPT/);
  assert.equal((await reconcileQl359SupervisedPrivateTest(fake)).firstPrivateTestReceiptVerified,false);
});

test('QL-359 original signed packet still requires a truly observed STOP and external closeout witness',async()=>{
  const signed=await realSignedSyntheticTest();
  const failedStop=await reconcileQl359SupervisedPrivateTest({...signed,
    verifyOriginalReceiverStopped:async()=>({listenerCount:0})});
  assert.match(failedStop.state,/STOP_NOT_INDEPENDENTLY_OBSERVED/);
  const signed2=await realSignedSyntheticTest();
  const failedWitness=await reconcileQl359SupervisedPrivateTest({...signed2,
    verifyOriginalReceiverStopped:async({sessionId,transcriptSha256})=>({
      state:'ORIGINAL_REE_RECEIVER_STOPPED_SUPERVISED',originalComputer:'DESKTOP-AE894KC',
      originalUser:'Ree',privateReceiverPort:8788,listenerCount:0,sessionId,transcriptSha256,
      observedAt:now}),witnessAttestation:{authenticated:true}});
  assert.match(failedWitness.state,/INDEPENDENT_ORIGINAL_CLOSEOUT_WITNESS/);
});

test('QL-359 will not bootstrap witness trust from its own signed payload or a forged pin',async()=>{
  const signed=await realSignedSyntheticTest();
  const checked=await verifyQl359CloseoutWitness({...witnessChecks,
    attestation:signed.witnessAttestation,sessionId:signed.challenge.envelope.sessionId,
    transcriptSha256:signed.witnessAttestation.payload.transcriptSha256,now});
  assert.equal(checked.verified,true,checked.state);
  const untrusted=await verifyQl359CloseoutWitness({...witnessChecks,
    resolvePinnedAuthority:async()=>({role:'field_witness',
      publicKeyPem:roots.original_issuer.publicKey.export({type:'spki',format:'pem'}),
      spkiSha256:sha(roots.original_issuer.publicKey.export({type:'spki',format:'der'}))}),
    attestation:signed.witnessAttestation,sessionId:signed.challenge.envelope.sessionId,
    transcriptSha256:signed.witnessAttestation.payload.transcriptSha256,now});
  assert.match(untrusted.state,/SIGNATURE_INVALID/);
  const revoked=await verifyQl359CloseoutWitness({...witnessChecks,
    verifyIndependentCustody:async()=>({authenticated:true,revoked:true}),
    attestation:signed.witnessAttestation,sessionId:signed.challenge.envelope.sessionId,
    transcriptSha256:signed.witnessAttestation.payload.transcriptSha256,now});
  assert.match(revoked.state,/CUSTODY_UNAUTHENTICATED/);
});

test('QL-359 accepts one synthetically cryptographic device receipt only after independent closeout; six sources remain HOLD',async()=>{
  const signed=await realSignedSyntheticTest();
  const result=await reconcileQl359SupervisedPrivateTest({...signed,
    verifyOriginalReceiverStopped:async({sessionId,transcriptSha256})=>({
      state:'ORIGINAL_REE_RECEIVER_STOPPED_SUPERVISED',originalComputer:'DESKTOP-AE894KC',
      originalUser:'Ree',privateReceiverPort:8788,listenerCount:0,sessionId,transcriptSha256,
      observedAt:now})});
  assert.equal(result.firstPrivateTestReceiptVerified,true,result.state);
  assert.equal(result.supervisedReceiverStopVerified,true);
  assert.equal(result.independentCloseoutWitnessVerified,true);
  assert.equal(result.verifiedReceiptCount,1);
  assert.equal(result.connected,false);
  assert.equal(result.connectedCount,0);
  assert.equal(result.customerCommunications,false);
  assert.match((await reconcileQl359SupervisedPrivateTest({...signed,
    verifyOriginalReceiverStopped:async()=>({}),
    witnessAttestation:{approved:true}})).upstreamState,/SINGLE_USE/);
});
