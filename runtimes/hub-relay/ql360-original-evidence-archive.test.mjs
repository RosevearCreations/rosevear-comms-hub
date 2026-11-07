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
import {QL359_CLOSEOUT_ATTESTATION,
  reconcileQl359SupervisedPrivateTest} from './ql359-supervised-private-closeout.mjs';
import {archiveQl360OriginalPostTestEvidence,ql360Cli} from './ql360-original-evidence-archive.mjs';
import {buildQl361RedactionReport,QL361_AUDIT_SCHEMA,
  verifyQl361ArchivedTestAndPrepareHandoff} from './ql361-archived-chain-audit.mjs';

const now=Date.parse('2026-11-07T04:00:00.000Z');
const sha=data=>createHash('sha256').update(data).digest('hex');
const canonSha=value=>sha(canonicalize(value));
const keys={device:generateKeyPairSync('ed25519'),original_issuer:generateKeyPairSync('ed25519'),
  field_witness:generateKeyPairSync('ed25519'),redaction_auditor:generateKeyPairSync('ed25519')};
const ree=createOwnerAuthorityCandidate({role:'source',keyId:'ql360-test-ree',passphrase:'synthetic-ree-only'});
const jack=createOwnerAuthorityCandidate({role:'master',keyId:'ql360-test-jack',passphrase:'synthetic-jack-only'});
const device={schema:'rosevear.hub.ql339b.public-candidate.v1',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:keys.device.publicKey.export({type:'spki',format:'pem'}),
  deviceSpkiSha256:sha(keys.device.publicKey.export({type:'spki',format:'der'})),
  enrollmentState:'HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'};
const candidates={device,source:ree.publicCandidate,master:jack.publicCandidate};
const evidencePaths={},dir=mkdtempSync(join(tmpdir(),'ql360-synthetic-only-'));
for(const name of ['windows','privateTls','tailnetAcl','rollback']){
  evidencePaths[name]=join(dir,`${name}.json`);
  writeFileSync(evidencePaths[name],JSON.stringify({syntheticOnly:true,name}));
}
const request=createEnrollmentRequest({...candidates,witnessHashes:hashWitnessFiles(evidencePaths),now});
const approve=(role,who,passphrase)=>signOwnerRequest({request,role,
  localCandidate:who.publicCandidate,encryptedPrivateKeyPem:who.encryptedPrivateKeyPem,
  passphrase,now});
const {enrollmentRecord:enrollment,ownerAuthorityPins:pins}=assembleSignedEnrollment({request,
  sourceApproval:approve('source',ree,'synthetic-ree-only'),
  masterApproval:approve('master',jack,'synthetic-jack-only'),now});
const payloadSha256=canonSha(request.payload);
const signed=(role,schema,other,expires=60_000)=>{
  const payload={schema,role,...other,issuedAt:new Date(now).toISOString(),
    expiresAt:new Date(now+expires).toISOString()};
  return {schema,payload,signature:sign(null,Buffer.from(canonicalize(payload)),
    keys[role].privateKey).toString('base64url')};
};
const enrollAttest=role=>signed(role,QL355_ATTESTATION,{
  audience:'rosevear-comms-hub:original-enrollment:TEST',
  enrollmentPayloadSha256:payloadSha256,scope:'one-original-device-test-only'},180_000);
const authorities={
  resolvePinnedAuthority:async role=>({role,
    publicKeyPem:keys[role].publicKey.export({type:'spki',format:'pem'}),
    spkiSha256:sha(keys[role].publicKey.export({type:'spki',format:'der'}))}),
  verifyIndependentCustody:async({role,spkiSha256,requestSha256})=>({
    role,spkiSha256,requestSha256,authenticated:true,revoked:false})};
const peers=['rosiedazzlers','devilndove','icamp','yw','ai-data-platform','rosevear-ai-hub']
  .map(peer_id=>({peer_id,peer_kind:['rosiedazzlers','devilndove','icamp','yw'].includes(peer_id)?'business':'support',
    source_repo:({rosiedazzlers:'rosiedazzlers',devilndove:'devilndove-site',
      icamp:'iCamp',yw:'yw','ai-data-platform':'ai-data-platform',
      'rosevear-ai-hub':'rosevear-ai-hub'})[peer_id],
    connection_state:'HOLD',source_test_authorized:false,customer_data_allowed:false,
    // Must NEVER be included in the archive, even if extra fields appear.
    customerEmail:'person@example.invalid',privateCredential:'UNTRUSTED_SECRET_MARKER'}));
let receipt=null;
const query=async sql=>{
  if(sql.includes('administrator_role'))return {rows:[{administrator_role:'postgres'}]};
  if(sql.includes('receiver_role'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
  if(sql.includes('device_enrollments'))return sql.includes('SELECT device_id,workload_id,key_id')?
    {rows:[{device_id:'rosevear-windows-hub',workload_id:'hub-probe',key_id:'hub-ql339b',
      enrollment_state:'REVIEWED_TEST'}]}:{rows:[{enrollment_record:enrollment,revoked_at:null}]};
  if(sql.includes('device_revocations'))return {rows:[{count:0}]};
  if(sql.includes('count(receipt_id)'))return {rows:[{count:receipt?1:0}]};
  if(sql.includes('private_peers'))return {rows:peers};
  if(sql.includes('FROM public.master_hub_relay_receipts_ql338'))return {rows:receipt?[receipt]:[]};
  throw Error(`Unexpected synthetic SQL: ${sql}`);
};
const verifiedCloseout=async()=>{
  receipt=null;
  const adminTransaction=async fn=>fn({query:async sql=>{
    if(sql.includes('current_user'))return {rows:[{intake_role:'postgres'}]};
    if(sql.startsWith('SELECT count'))return {rows:[{count:0}]};
    if(sql.includes('private_peers'))return {rows:peers};
    if(sql.startsWith('INSERT'))return {rows:[{enrollment_id:'29db0fd7-605d-4c71-8ec6-d4e1d7dd3b8b'}]};
    throw Error(`Unexpected admin transaction SQL: ${sql}`);
  }});
  const trust={request,enrollment,pins,candidates,evidencePaths,
    issuerAttestation:enrollAttest('original_issuer'),
    witnessAttestation:enrollAttest('field_witness'),...authorities,now};
  const inserted=await executeQl357SupervisedEnrollment({...trust,adminTransaction});
  assert.equal(inserted.databaseEnrollmentWritten,true,inserted.state);
  const challenge=await prepareQl354OneDeviceChallenge({recordedTicket:inserted.recordedTicket,
    query,now});
  assert.equal(challenge.state,'ONE_UNSIGNED_ORIGINAL_DEVICE_TEST_CHALLENGE_AWAITING_LOCAL_SIGNATURE');
  const packet={envelope:challenge.envelope,keyId:'hub-ql339b',
    signature:sign(null,Buffer.from(canonicalize(challenge.envelope)),keys.device.privateKey)
      .toString('base64url')};
  const field=await inspectQl358OriginalFieldAndEnrollment({...trust,adminQuery:query});
  assert.equal(field.databaseEnrollmentVerified,true,field.state);
  const ticket=await verifyQl358DedicatedReceiverSession({fieldTicket:field,
    withOriginalReeDpapiReceiverSession:async fn=>fn(query),now});
  assert.equal(ticket.dedicatedReceiverCredentialVerified,true,ticket.state);
  receipt={device_id:'rosevear-windows-hub',workload_id:'hub-probe',
    session_id:challenge.envelope.sessionId,sequence_no:1,nonce:challenge.envelope.nonce,
    heartbeat_sha256:canonSha(challenge.envelope),queue_depth:0,
    source_app_id:'rosevear-ai-hub',connection_state:'HOLD',received_at:new Date(now)};
  const transcriptSha256=canonSha({sessionId:challenge.envelope.sessionId,
    nonce:challenge.envelope.nonce,deviceId:'rosevear-windows-hub',
    signedEnvelopeSha256:canonSha(packet.envelope),packetSignature:packet.signature,
    originalReceiptAt:new Date(now).toISOString()});
  const witnessAttestation=signed('field_witness',QL359_CLOSEOUT_ATTESTATION,{
    audience:'rosevear-comms-hub:original-private-test:TEST',
    scope:'first-original-private-test-closeout-only',
    sessionId:challenge.envelope.sessionId,transcriptSha256});
  const closeout=await reconcileQl359SupervisedPrivateTest({receiverTicket:ticket,
    challenge,packet,pins,query,now,witnessAttestation,...authorities,
    verifyPrivateOperator:async()=>({state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',replayOrRevocationFound:false,expiresAt:now+20_000}),
    verifyOriginalTransport:async()=>({state:'ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',peerIp:'100.114.56.26',boundIp:'100.77.246.3',
      tlsPort:8443,tlsVerified:true,privateReceiverLoopbackVerified:true,observedAt:now}),
    verifyOriginalReceiverStopped:async({sessionId,transcriptSha256})=>({
      state:'ORIGINAL_REE_RECEIVER_STOPPED_SUPERVISED',originalComputer:'DESKTOP-AE894KC',
      originalUser:'Ree',privateReceiverPort:8788,listenerCount:0,sessionId,
      transcriptSha256,observedAt:now})});
  assert.equal(closeout.firstPrivateTestReceiptVerified,true,closeout.state);
  return closeout;
};
const shutdown=async({sessionId,transcriptSha256})=>({
  state:'ORIGINAL_REE_TIME_BOUNDED_RECEIVER_SHUTDOWN',originalComputer:'DESKTOP-AE894KC',
  originalUser:'Ree',receiverPort:8788,receiverListenerCount:0,
  tailnetGatewayListenerCount:0,sessionId,transcriptSha256,observedAt:now+2_000});
const privateArchive=()=>{
  let copy;
  return {
    writeOriginalPrivateArchive:async({evidence,evidenceSha256,mode})=>{
      assert.equal(mode,'OWNER_ONLY_CREATE_NEW');
      copy=JSON.parse(JSON.stringify(evidence));
      assert.equal(canonSha(copy),evidenceSha256);
      assert.doesNotMatch(JSON.stringify(copy),/UNTRUSTED_SECRET_MARKER|person@example\.invalid/);
      return {state:'ORIGINAL_REE_PRIVATE_ARCHIVE_WRITTEN_NEW',originalComputer:'DESKTOP-AE894KC',
        originalUser:'Ree',ownerOnlyAcl:true,atomicCreateNew:true,archiveId:'ql360-test-archive-1',
        sha256:evidenceSha256};
    },
    readOriginalPrivateArchive:async()=>({
      state:'ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED',originalComputer:'DESKTOP-AE894KC',
      originalUser:'Ree',ownerOnlyAcl:true,archiveId:'ql360-test-archive-1',
      sha256:canonSha(copy),evidence:copy})};
};

test('QL-360 rejects JSON claims, missing original DB or archive callbacks and unsupervised CLI',async()=>{
  assert.match((await archiveQl360OriginalPostTestEvidence()).state,/ORIGINAL_ARCHIVE_DB/);
  assert.match((await archiveQl360OriginalPostTestEvidence({closeout:{archiveAccepted:true},
    query,observeOriginalShutdown:shutdown,...privateArchive(),now})).state,/REAL_UNREPLAYED/);
  assert.equal(ql360Cli(['--help']).databaseWrites,0);
  assert.throws(()=>ql360Cli(['--archive']),/DENY_UNSUPERVISED/);
});

test('QL-360 genuine signed closeout cannot archive without fresh actual shutdown evidence',async()=>{
  const closeout=await verifiedCloseout();
  const failed=await archiveQl360OriginalPostTestEvidence({closeout,query,
    observeOriginalShutdown:async()=>({receiverListenerCount:0}),...privateArchive(),now:now+3_000});
  assert.match(failed.state,/SHUTDOWN_WITNESS/);
  assert.match((await archiveQl360OriginalPostTestEvidence({closeout,query,
    observeOriginalShutdown:shutdown,...privateArchive(),now:now+3_000})).state,/UNREPLAYED/);
});

test('QL-360 rejects expired shutdown witness and unverified owner-only archive readback',async()=>{
  const closeout=await verifiedCloseout();
  const stale=await archiveQl360OriginalPostTestEvidence({closeout,query,
    observeOriginalShutdown:shutdown,...privateArchive(),now:now+30_000});
  assert.match(stale.state,/SHUTDOWN_WITNESS/);
  const next=await verifiedCloseout();
  const badArchive=privateArchive();
  const bad=await archiveQl360OriginalPostTestEvidence({closeout:next,query,
    observeOriginalShutdown:shutdown,writeOriginalPrivateArchive:badArchive.writeOriginalPrivateArchive,
    readOriginalPrivateArchive:async()=>({ownerOnlyAcl:false}),now:now+3_000});
  assert.match(bad.state,/ARCHIVE_READBACK/);
});

test('QL-360 creates redacted original-only six-app evidence with hash-verified readback, never CONNECTED',async()=>{
  const closeout=await verifiedCloseout();
  const result=await archiveQl360OriginalPostTestEvidence({closeout,query,
    observeOriginalShutdown:shutdown,...privateArchive(),now:now+3_000});
  assert.equal(result.archiveAccepted,true,result.state);
  assert.equal(result.timeBoundShutdownWitnessVerified,true);
  assert.equal(result.sixPeersHeldVerified,true);
  assert.equal(result.exportedEvidenceCount,6);
  assert.equal(result.connected,false);
  assert.equal(result.connectedCount,0);
  assert.equal(result.customerCommunications,false);
  assert.equal(result.deviceActions,false);
});

const originalStoppedRecheck=async({sessionId,transcriptSha256})=>({
  state:'ORIGINAL_REE_ALL_PRIVATE_RECEIVERS_OFF_RECHECK',
  originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',sessionId,
  transcriptSha256,receiverListenerCount:0,tailnetGatewayListenerCount:0,
  observedAt:now+4_000});
const pendingCandidateStore=()=>{
  let copy=null;
  return {
    writeOriginalPrivateHandoff:async({handoff,handoffSha256,mode})=>{
      assert.equal(mode,'OWNER_ONLY_CREATE_NEW');
      assert.equal(canonSha(handoff),handoffSha256);
      assert.equal(handoff.candidates.length,6);
      assert.equal(handoff.connectedCount,0);
      assert.equal(handoff.candidates.every(x=>!x.sourceTestAuthorized),true);
      copy=JSON.parse(JSON.stringify(handoff));
      assert.doesNotMatch(JSON.stringify(copy),/UNTRUSTED_SECRET_MARKER|person@example\.invalid/);
      return {state:'ORIGINAL_REE_QL361_HANDOFF_WRITTEN_NEW',
        originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',
        ownerOnlyAcl:true,atomicCreateNew:true,handoffId:'ql361-candidate-archive-1',
        sha256:handoffSha256};
    },
    readOriginalPrivateHandoff:async()=>({
      state:'ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',
      ownerOnlyAcl:true,handoffId:'ql361-candidate-archive-1',
      sha256:canonSha(copy),handoff:copy}),
    readCopy:()=>copy
  };
};
async function auditedOriginalArchive(){
  const closeout=await verifiedCloseout();
  const store=privateArchive();
  const originalArchive=await archiveQl360OriginalPostTestEvidence({closeout,
    query,observeOriginalShutdown:shutdown,...store,now:now+3_000});
  assert.equal(originalArchive.archiveAccepted,true,originalArchive.state);
  const report=buildQl361RedactionReport({archiveId:originalArchive.archiveId,
    archiveSha256:originalArchive.evidenceSha256,
    peers:peers.map(p=>({peerId:p.peer_id,kind:p.peer_kind,repository:p.source_repo}))});
  const reportSha256=canonSha(report);
  const auditAttestation=signed('redaction_auditor',QL361_AUDIT_SCHEMA,{
    audience:'rosevear-comms-hub:original-archive:TEST',
    scope:'independent-redaction-review-owner-handoff-only',
    archiveId:originalArchive.archiveId,
    archiveSha256:originalArchive.evidenceSha256,
    redactionReportSha256:reportSha256},60_000);
  const candidateStore=pendingCandidateStore();
  return {originalArchive,query,readOriginalPrivateArchive:store.readOriginalPrivateArchive,
    observeOriginalShutdown:originalStoppedRecheck,
    auditAttestation,resolvePinnedAuthority:authorities.resolvePinnedAuthority,
    verifyIndependentCustody:authorities.verifyIndependentCustody,
    ...candidateStore,candidateStore,now:now+5_000};
}

test('QL-361 refuses forged archive claims, missing trust callbacks, and changed original archive bytes',async()=>{
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff()).state,/ORIGINAL_READBACK/);
  const input=await auditedOriginalArchive();
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff({
    ...input,originalArchive:{...input.originalArchive}})).state,/UNREPLAYED/);
  const result=await verifyQl361ArchivedTestAndPrepareHandoff({...input,
    readOriginalPrivateArchive:async()=>({ownerOnlyAcl:false})});
  assert.match(result.state,/ARCHIVE_BYTES_CHANGED/);
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff(input)).state,/UNREPLAYED/);
});

test('QL-361 denies live receiver, absent signed auditor or stale original archive capability',async()=>{
  const active=await auditedOriginalArchive();
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff({...active,
    observeOriginalShutdown:async()=>({receiverListenerCount:1})})).state,/STOP_RECHECK/);
  const unsigned=await auditedOriginalArchive();
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff({...unsigned,
    auditAttestation:{...unsigned.auditAttestation,signature:'A'.repeat(86)}})).state,/SIGNED_REDACTION_AUDIT/);
  const stale=await auditedOriginalArchive();
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff({
    ...stale,now:now+700_000})).state,/UNREPLAYED/);
});

test('QL-361 rechecks one immutable receipt and six HELD peers, with independent signed redaction audit',async()=>{
  const input=await auditedOriginalArchive();
  const result=await verifyQl361ArchivedTestAndPrepareHandoff(input);
  assert.equal(result.ownerControlledHandoffVerified,true,result.state);
  assert.equal(result.archivedOriginalChainVerified,true);
  assert.equal(result.independentRedactionAuditVerified,true);
  assert.equal(result.candidateCount,6);
  assert.equal(result.connected,false);
  assert.equal(result.databaseWrites,0);
  const handoff=input.candidateStore.readCopy();
  assert.equal(handoff.auditAttestation.payload.role,'redaction_auditor');
  assert.equal(handoff.candidates.every(p=>p.state==='AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE'),true);
  assert.equal(handoff.candidates.every(p=>p.customerDataAllowed===false),true);
  assert.equal(handoff.nextAction,'SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED');
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff(input)).state,/UNREPLAYED/);
});

test('QL-361 refuses drifted database receipt counts and private handoff write/readback claims',async()=>{
  const drift=await auditedOriginalArchive();
  const out=await verifyQl361ArchivedTestAndPrepareHandoff({...drift,
    query:async sql=>sql.includes('count(receipt_id)')?{rows:[{count:2}]}:query(sql)});
  assert.match(out.state,/PEER_DRIFT/);
  const badStore=await auditedOriginalArchive();
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff({...badStore,
    writeOriginalPrivateHandoff:async()=>({ownerOnlyAcl:false})})).state,/CANDIDATE_WRITE/);
  const badReadback=await auditedOriginalArchive();
  assert.match((await verifyQl361ArchivedTestAndPrepareHandoff({...badReadback,
    readOriginalPrivateHandoff:async()=>({sha256:'0'.repeat(64)})})).state,/READBACK_CHANGED/);
});
