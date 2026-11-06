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
import {insertQl354OriginalEnrollmentOnce,prepareQl354OneDeviceChallenge,
  reconcileQl354SignedChallenge}
  from './ql354-original-owner-intake.mjs';
import {QL355_ATTESTATION,authorizeQl355OriginalCeremony,
  verifyQl355Authority,acceptQl355FirstPrivateTest,ql355Cli} from './ql355-independent-authority.mjs';

const now=Date.parse('2026-11-06T22:00:00.000Z');
const sha=b=>createHash('sha256').update(b).digest('hex');
const issuer=generateKeyPairSync('ed25519');
const witness=generateKeyPairSync('ed25519');
const keyInfo={original_issuer:issuer,field_witness:witness};
const pinFor=role=>({role,publicKeyPem:keyInfo[role].publicKey.export({type:'spki',format:'pem'}),
  spkiSha256:sha(keyInfo[role].publicKey.export({type:'spki',format:'der'}))});
const pinsByRole={original_issuer:pinFor('original_issuer'),field_witness:pinFor('field_witness')};
const resolvePinnedAuthority=async role=>pinsByRole[role];
const verifyIndependentCustody=async({role,spkiSha256,requestSha256})=>({
  authenticated:true,revoked:false,role,spkiSha256,requestSha256});
const payloadHash=sha('separate original signed enrollment body');
const attest=(role,hash=payloadHash)=>{
  const payload={schema:QL355_ATTESTATION,role,
    audience:'rosevear-comms-hub:original-enrollment:TEST',
    enrollmentPayloadSha256:hash,scope:'one-original-device-test-only',
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+120_000).toISOString()};
  return {schema:QL355_ATTESTATION,payload,
    signature:sign(null,Buffer.from(canonicalize(payload)),keyInfo[role].privateKey).toString('base64url')};
};
const verifyAttestation=(role,options={})=>verifyQl355Authority({
  role,attestation:attest(role),payloadSha256:payloadHash,
  resolvePinnedAuthority,verifyIndependentCustody,now,...options});

test('independently anchored Ed25519 issuer and witness signatures bind to one exact TEST payload',async()=>{
  for(const role of ['original_issuer','field_witness']){
    const result=await verifyAttestation(role);
    assert.equal(result.verified,true);
    assert.equal(result.role,role);
    assert.equal(result.payloadSha256,payloadHash);
    assert.equal(result.spkiSha256,pinsByRole[role].spkiSha256);
    assert.equal(result.verifiedAt,new Date(now).toISOString());
  }
  assert.match((await verifyAttestation('original_issuer',{
    resolvePinnedAuthority:null})).state,/TRUSTED_PIN/);
  assert.match((await verifyAttestation('field_witness',{
    verifyIndependentCustody:null})).state,/TRUSTED_PIN/);
});

test('invalid, forged, replayed, self-signed or expired authority assertions fail closed',async()=>{
  const valid=attest('original_issuer');
  for(const bad of [
    {...valid,signature:attest('field_witness').signature},
    {...valid,payload:{...valid.payload,scope:'all-source-live'}},
    {...valid,payload:{...valid.payload,role:'field_witness'}},
    {...valid,payload:{...valid.payload,enrollmentPayloadSha256:sha('different')}},
    {...valid,approved:true,signature:'A'.repeat(86)},
  ])assert.notEqual((await verifyAttestation('original_issuer',{attestation:bad})).verified,true,
    'forged or altered authority must never authenticate');
});

test('independent trust-root custody refuses self-asserted and revoked pins',async()=>{
  for(const custody of [
    async()=>({authenticated:true}),
    async({role,spkiSha256,requestSha256})=>({authenticated:true,revoked:true,
      role,spkiSha256,requestSha256}),
    async({role,spkiSha256,requestSha256})=>({authenticated:true,revoked:false,
      role,spkiSha256,requestSha256:sha('other')})
  ])assert.notEqual((await verifyAttestation('original_issuer',{
    verifyIndependentCustody:custody})).verified,true);
  assert.notEqual((await verifyAttestation('original_issuer',{
    resolvePinnedAuthority:async()=>({...pinsByRole.original_issuer,spkiSha256:sha('fake')})
  })).verified,true);
  assert.notEqual((await verifyAttestation('original_issuer',{
    now:now+121_000})).verified,true);
});

function makeSignedOwnerIntake(){
  const source=createOwnerAuthorityCandidate({role:'source',keyId:'ree-original-ql355',passphrase:'synthetic-ree-passphrase-2026'});
  const master=createOwnerAuthorityCandidate({role:'master',keyId:'jack-original-ql355',passphrase:'synthetic-jack-passphrase-2026'});
  const deviceKey=generateKeyPairSync('ed25519');
  const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
    deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
    devicePublicKeyPem:deviceKey.publicKey.export({type:'spki',format:'pem'}),
    deviceSpkiSha256:sha(deviceKey.publicKey.export({type:'spki',format:'der'})),
    enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
  const candidates={device,source:source.publicCandidate,master:master.publicCandidate};
  const dir=mkdtempSync(join(tmpdir(),'ql355-fixtures-'));
  const evidencePaths={};
  for(const label of ['windows','privateTls','tailnetAcl','rollback']){
    evidencePaths[label]=join(dir,`${label}.json`);
    writeFileSync(evidencePaths[label],JSON.stringify({synthetic:true,label}));
  }
  const request=createEnrollmentRequest({...candidates,
    witnessHashes:hashWitnessFiles(evidencePaths),now});
  const approval=(role,user,passphrase)=>signOwnerRequest({request,role,
    localCandidate:user.publicCandidate,encryptedPrivateKeyPem:user.encryptedPrivateKeyPem,
    passphrase,now});
  const assembled=assembleSignedEnrollment({request,
    sourceApproval:approval('source',source,'synthetic-ree-passphrase-2026'),
    masterApproval:approval('master',master,'synthetic-jack-passphrase-2026'),now});
  return {request,enrollment:assembled.enrollmentRecord,pins:assembled.ownerAuthorityPins,
    candidates,evidencePaths,deviceKey};
}

test('QL-355 genuine owner ceremony yields at most one private nonserializable QL-354 intake permit',async()=>{
  const original=makeSignedOwnerIntake();
  const common={...original,
    issuerAttestation:attest('original_issuer',sha(canonicalize(original.request.payload))),
    witnessAttestation:attest('field_witness',sha(canonicalize(original.request.payload))),
    resolvePinnedAuthority,verifyIndependentCustody,now};
  const permit=await authorizeQl355OriginalCeremony(common);
  assert.equal(permit.state,'INDEPENDENT_ORIGINAL_AUTHORITY_VERIFIED_ONE_ENROLLMENT_ONLY');
  assert.equal(permit.payloadSha256,sha(canonicalize(original.request.payload)));
  const denied=await authorizeQl355OriginalCeremony({...common,
    verifyIndependentCustody:async()=>({authenticated:true})});
  assert.match(denied.state,/HOLD_ORIGINAL_ISSUER/);
  const spoof=await authorizeQl355OriginalCeremony({...common,
    issuerAttestation:{approved:true},witnessAttestation:{approved:true}});
  assert.match(spoof.state,/HOLD_ORIGINAL_ISSUER/);
});

test('first actual TEST acceptance requires separately verified private session, transport and DB receipt',async()=>{
  const common={challenge:{},packet:{},pins:{},query:async()=>{throw Error('no real database');},
    now,verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',replayOrRevocationFound:false,expiresAt:now+30_000}),
    verifyOriginalTransport:async()=>({
      state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',peerIp:'100.114.56.26',boundIp:'100.77.246.3',
      tlsPort:8443,tlsVerified:true,privateReceiverLoopbackVerified:true,observedAt:now})};
  assert.match((await acceptQl355FirstPrivateTest({...common,
    verifyPrivateOperator:null})).state,/HOLD_GENUINE/);
  assert.match((await acceptQl355FirstPrivateTest({...common,
    verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',expiresAt:now-1})})).state,/DENY_UNAUTHENTICATED/);
  assert.match((await acceptQl355FirstPrivateTest({...common,
    verifyOriginalTransport:async()=>({...await common.verifyOriginalTransport(),
      peerIp:'203.0.113.1'})})).state,/HOLD_ORIGINAL_PRIVATE_TRANSPORT/);
  const noDatabase=await acceptQl355FirstPrivateTest(common);
  assert.equal(noDatabase.firstPrivateTestAccepted,false);
  assert.equal(noDatabase.connectedCount,0);
  assert.equal(noDatabase.connectionState,'DISCONNECTED / HOLD');
  assert.equal(ql355Cli(['--help']).databaseWrites,0);
  assert.throws(()=>ql355Cli(['--start']),/DENY_QL355_UNSUPERVISED/);
});

test('one truly device-signed TEST and one exact private DB receipt reconcile without connecting six apps',async()=>{
  const original=makeSignedOwnerIntake();
  const hash=sha(canonicalize(original.request.payload));
  const permit=await authorizeQl355OriginalCeremony({...original,
    issuerAttestation:attest('original_issuer',hash),
    witnessAttestation:attest('field_witness',hash),
    resolvePinnedAuthority,verifyIndependentCustody,now});
  const peers=['rosiedazzlers','devilndove','icamp','yw','ai-data-platform',
    'rosevear-ai-hub'].map(peer_id=>({peer_id,connection_state:'HOLD',
      source_test_authorized:false,customer_data_allowed:false}));
  const transaction=async callback=>callback({query:async(sql)=>{
    if(sql.includes('current_user'))return {rows:[{intake_role:'postgres'}]};
    if(sql.startsWith('SELECT count'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers};
    if(sql.startsWith('INSERT'))return {rows:[{enrollment_id:'c9eb25b0-560d-41e5-8190-f6301e15440e'}]};
    throw Error('DENY_UNEXPECTED_SQL');
  }});
  const inserted=await insertQl354OriginalEnrollmentOnce({permit,transaction,now});
  assert.equal(inserted.databaseEnrollmentCreated,true);
  let challenge;
  const query=async(sql)=>{
    if(sql.includes('current_user'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
    if(sql.includes('device_enrollments'))return {rows:[{enrollment_record:original.enrollment,revoked_at:null}]};
    if(sql.includes('device_revocations'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers};
    if(sql.includes('count(receipt_id)'))return {rows:[{count:challenge?1:0}]};
    if(sql.includes('FROM public.master_hub_relay_receipts_ql338'))return {rows:[{
      device_id:'rosevear-windows-hub',workload_id:'hub-probe',
      session_id:challenge.envelope.sessionId,sequence_no:1,
      nonce:challenge.envelope.nonce,heartbeat_sha256:sha(canonicalize(challenge.envelope)),
      queue_depth:0,source_app_id:'rosevear-ai-hub',connection_state:'HOLD',
      received_at:new Date(now)}]};
    throw Error('DENY_UNEXPECTED_SQL');
  };
  challenge=await prepareQl354OneDeviceChallenge({recordedTicket:inserted.recordedTicket,query,now});
  assert.equal(challenge.state,'ONE_UNSIGNED_ORIGINAL_DEVICE_TEST_CHALLENGE_AWAITING_LOCAL_SIGNATURE');
  const packet={envelope:challenge.envelope,keyId:'hub-ql339b',
    signature:sign(null,Buffer.from(canonicalize(challenge.envelope)),
      original.deviceKey.privateKey).toString('base64url')};
  const review=await reconcileQl354SignedChallenge({challenge,packet,query,pins:original.pins,now});
  assert.equal(review.originalTestReceiptVerified,true,review.state);
  const accepted=await acceptQl355FirstPrivateTest({challenge,packet,query,
    pins:original.pins,now,
    verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',replayOrRevocationFound:false,expiresAt:now+20_000}),
    verifyOriginalTransport:async()=>({state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',peerIp:'100.114.56.26',boundIp:'100.77.246.3',
      tlsPort:8443,tlsVerified:true,privateReceiverLoopbackVerified:true,observedAt:now})});
  assert.equal(accepted.firstPrivateTestAccepted,true,accepted.state);
  assert.equal(accepted.originalTestReceiptVerified,true);
  assert.equal(accepted.connected,false);
  assert.equal(accepted.connectedCount,0);
  assert.equal(accepted.sourceTestAuthorized,false);
  assert.equal(accepted.receiverActivated,false);
});
