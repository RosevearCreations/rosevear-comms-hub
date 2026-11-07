import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {SOURCES,canonicalize,payloadForSigning} from '../master-discovery/manifest.mjs';
import {QL360_SCHEMA} from './ql360-original-evidence-archive.mjs';
import {QL361_SCHEMA,QL361_AUDIT_SCHEMA,buildQl361RedactionReport}
  from './ql361-archived-chain-audit.mjs';
import {QL362_APPROVAL_SCHEMA,QL362_HEALTH_SCHEMA,
  createQl362OfflineGetRequest,createQl362FirstSourceGetGate,ql362Cli}
  from './ql362-source-owner-first-get.mjs';

const t=Date.parse('2026-11-07T05:00:00.000Z');
const sha=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const keyDigest=key=>createHash('sha256').update(
  key.publicKey.export({type:'spki',format:'der'})).digest('hex');
const keys={redaction_auditor:generateKeyPairSync('ed25519'),
  source_owner:generateKeyPairSync('ed25519'),
  master_owner:generateKeyPairSync('ed25519'),manifest:generateKeyPairSync('ed25519')};
const sourceId='yw',operationId='d84b917e-671e-48b2-a5dd-673b4645a80a';
const expectedPeers=Object.entries(SOURCES).map(([id,s])=>({
  peer_id:id,peer_kind:['yw','icamp','rosiedazzlers','devilndove'].includes(id)?'business':'support',
  source_repo:s.repo,connection_state:'HOLD',
  source_test_authorized:false,customer_data_allowed:false}));
const candidates=expectedPeers.map(p=>({peerId:p.peer_id,peerKind:p.peer_kind,
  repository:p.source_repo,state:'AWAITING_INDEPENDENT_SOURCE_OWNER_SIGNATURE',
  sourceTestAuthorized:false,customerDataAllowed:false,
  requestedScope:'HEALTH_READ_ONLY_TEST_PROPOSAL_NOT_AUTHORIZATION'}));
const signed=(keyRole,schema,payload)=>({schema,payload,
  signature:sign(null,Buffer.from(canonicalize(payload)),keys[keyRole].privateKey)
    .toString('base64url')});
const evidence={schema:QL360_SCHEMA,kind:'ORIGINAL_POST_TEST_PRIVATE_EVIDENCE_ONLY',
  sessionId:'ql362-test-original-session',deviceId:'rosevear-windows-hub',
  signedTranscriptSha256:'d'.repeat(64),
  externallyPinnedWitnessSpkiSha256:'e'.repeat(64),
  closeoutAt:new Date(t).toISOString(),
  shutdownObservedAt:new Date(t+500).toISOString(),
  receiptCount:1,revocationCount:0,receiverListenerCount:0,
  tailnetGatewayListenerCount:0,authenticatedDatabaseRole:'ql340c_private_receiver',
  peerCount:6,connectedCount:0,
  sources:expectedPeers.map(p=>({id:p.peer_id,kind:p.peer_kind,
    sourceRepository:p.source_repo,state:'HOLD'})).sort((a,b)=>a.id.localeCompare(b.id)),
  customerCommunications:false,deviceActions:false};
const redactionReport=buildQl361RedactionReport({
  archiveId:'ql360-test-original-archive',archiveSha256:sha(evidence),
  peers:expectedPeers.map(p=>({peerId:p.peer_id,kind:p.peer_kind,
    repository:p.source_repo}))});
const auditorPayload={schema:QL361_AUDIT_SCHEMA,role:'redaction_auditor',
  audience:'rosevear-comms-hub:original-archive:TEST',
  scope:'independent-redaction-review-owner-handoff-only',
  archiveId:'ql360-test-original-archive',archiveSha256:sha(evidence),
  redactionReportSha256:sha(redactionReport),
  issuedAt:new Date(t).toISOString(),expiresAt:new Date(t+180_000).toISOString()};
const handoff={schema:QL361_SCHEMA,kind:'OWNER_PRIVATE_OFFLINE_SOURCE_REVIEW_ONLY',
  archiveId:auditorPayload.archiveId,archiveSha256:auditorPayload.archiveSha256,
  redactionAuditSha256:auditorPayload.redactionReportSha256,
  independentAuditorSpkiSha256:keyDigest(keys.redaction_auditor),
  auditAttestation:{payload:auditorPayload,
    signature:signed('redaction_auditor',QL361_AUDIT_SCHEMA,auditorPayload).signature},
  receiverStopped:true,connectedCount:0,candidateCount:6,candidates,
  customerCommunications:false,deviceActions:false,
  nextAction:'SIX_SEPARATE_SOURCE_OWNER_SIGNED_TEST_DECISIONS_REQUIRED'};
const handoffSha256=sha(handoff),handoffId='ql361-test-original-handoff';
const fixture=JSON.parse(readFileSync(new URL('../master-discovery/fixture.json',import.meta.url)));
const manifest={...structuredClone(fixture),signature:{algorithm:'Ed25519',
  key_id:'source-key-ql362-test',value:'',state:'SIGNED'}};
manifest.signature.value=sign(null,payloadForSigning(manifest),
  keys.manifest.privateKey).toString('base64url');
const pinnedSource={sourceId,repository:'RosevearCreations/yw',
  commitSha:'c'.repeat(40),sourceOrigin:'https://yw-private.example.invalid',
  manifest,manifestTrustPin:{sourceId,issuer:'yard-workers',
    keyId:'source-key-ql362-test',
    publicKeyPem:keys.manifest.publicKey.export({format:'pem',type:'spki'}),
    independentlyVerified:true,approvedSourceOwner:true,originalProofB:true}};
const intent=createQl362OfflineGetRequest({handoff,sourceId,operationId,
  pinnedSource:{...pinnedSource,manifestSha256:sha(manifest)},issuedAt:t});
const requestSha256=sha(intent);
const decision=role=>signed(role,QL362_APPROVAL_SCHEMA,{
  schema:QL362_APPROVAL_SCHEMA,role,sourceId,requestSha256,
  audience:'rosevear-comms-hub:source-only-health-get:TEST',
  decision:'APPROVE_EXACTLY_ONE_SOURCE_HEALTH_GET',
  issuedAt:new Date(t).toISOString(),expiresAt:new Date(t+90_000).toISOString()});
const sourceOwnerApproval=decision('source_owner');
const masterOwnerApproval=decision('master_owner');
const safeBody={schema:QL362_HEALTH_SCHEMA,sourceId,operationId,
  health:'ok',connected:false,customerDataAllowed:false,deviceActions:false};

function setup(overrides={}){
  const counters={gets:0,claims:0,witnesses:0};
  let current=t+1_000;
  const options={now:()=>current,
    readOriginalPrivateHandoff:async()=>({
      state:'ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',ownerOnlyAcl:true,
      handoffId,sha256:handoffSha256,handoff}),
    readOriginalPrivateArchive:async()=>({
      state:'ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',ownerOnlyAcl:true,
      archiveId:handoff.archiveId,sha256:handoff.archiveSha256,evidence}),
    resolvePinnedAuthority:async(role,id)=>({role,...(id?{sourceId:id}:{}),
      publicKeyPem:keys[role].publicKey.export({type:'spki',format:'pem'}),
      spkiSha256:keyDigest(keys[role])}),
    verifyIndependentCustody:async({role,sourceId:source,spkiSha256,requestSha256})=>({
      role,...(source?{sourceId:source}:{}),spkiSha256,requestSha256,
      authenticated:true,revoked:false}),
    resolvePinnedSource:async()=>pinnedSource,
    verifyOriginalPrivateOperator:async()=>({
      state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
      originalComputer:'DESKTOP-AE894KC',replayOrRevocationFound:false,
      expiresAt:current+20_000}),
    observeOriginalReceiverOff:async()=>({
      state:'ORIGINAL_REE_ALL_PRIVATE_RECEIVERS_OFF_RECHECK',
      originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',
      receiverListenerCount:0,tailnetGatewayListenerCount:0,observedAt:current}),
    query:async sql=>{
      if(sql.includes('receiver_role'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
      if(sql.includes('device_enrollments'))return {rows:[{
        device_id:'rosevear-windows-hub',workload_id:'hub-probe',
        key_id:'hub-ql339b',enrollment_state:'REVIEWED_TEST'}]};
      if(sql.includes('count(receipt_id)'))return {rows:[{count:1}]};
      if(sql.includes('device_revocations'))return {rows:[{count:0}]};
      if(sql.includes('private_peers'))return {rows:expectedPeers};
      throw Error('synthetic: unexpected query');
    },
    claimSingleUseOperation:async({sourceId:id,operationId:op,requestSha256:digest})=>{
      counters.claims++;return {state:'ORIGINAL_PRIVATE_SINGLE_USE_SOURCE_GET_CLAIMED',
        sourceId:id,operationId:op,requestSha256:digest,durableUniqueClaim:true};},
    sendSignedGet:async({request})=>{
      counters.gets++;return {sourceId:request.sourceId,
        operationId:request.operationId,sourceOrigin:request.sourceOrigin,
        method:'GET',path:request.path,httpStatus:200,redirected:false,
        byteLength:Buffer.byteLength(JSON.stringify(safeBody)),body:safeBody};},
    verifySignedSourceReceipt:async({request,requestSha256:digest,receiptSha256})=>({
      state:'INDEPENDENT_PINNED_SOURCE_GET_RECEIPT_VERIFIED',
      sourceId:request.sourceId,operationId:request.operationId,
      requestSha256:digest,receiptSha256,sourceSignerAuthenticated:true,
      nonproductionIsolationVerified:true}),
    appendIndependentWitness:async({sourceId:id,operationId:op,requestSha256:digest,receiptSha256})=>{
      counters.witnesses++;return {state:'PRIVATE_ONE_SOURCE_APPEND_ONLY_TEST_WITNESS_COMMITTED',
        sourceId:id,operationId:op,requestSha256:digest,receiptSha256,
        immutableReadbackVerified:true};},...overrides};
  return {gate:createQl362FirstSourceGetGate(options),counters,
    setClock:value=>current=value,
    input:{handoffId,expectedHandoffSha256:handoffSha256,sourceId,
      operationId,request:intent,sourceOwnerApproval,masterOwnerApproval}};
}

test('QL-362 offline request is exactly scoped, unprivileged and contains no credentials',()=>{
  assert.equal(intent.method,'GET');
  assert.equal(intent.path,'/api/integration/v1/shell/health');
  assert.equal(intent.environment,'TEST');
  assert.equal(intent.persistentConnectionAllowed,false);
  assert.equal(intent.customerDataAllowed,false);
  assert.throws(()=>createQl362OfflineGetRequest({handoff,sourceId,operationId,
    pinnedSource:{...pinnedSource,sourceOrigin:'http://127.0.0.1/private',
      manifestSha256:sha(manifest)},issuedAt:t}),/EXACT_ORIGINAL/);
  assert.equal(ql362Cli(['--help']).networkRequests,0);
  assert.throws(()=>ql362Cli(['--get','yw']),/DENY_UNSUPERVISED/);
});

test('QL-362 first independently approved source-only GET returns a signed witness, never CONNECTED',async()=>{
  const x=setup();const result=await x.gate.runFirst(x.input);
  assert.equal(result.firstSourceGetVerified,true,result.state);
  assert.equal(result.sourceOwnerSignatureVerified,true);
  assert.equal(result.masterOwnerSignatureVerified,true);
  assert.equal(result.originalArchivedTestVerified,true);
  assert.equal(result.connected,false);
  assert.equal(result.connectedCount,0);
  assert.equal(result.otherPeersHeld,5);
  assert.equal(x.counters.claims,1);
  assert.equal(x.counters.gets,1);
  assert.equal(x.counters.witnesses,1);
  assert.match((await x.gate.runFirst(x.input)).state,/REPLAYED/);
  assert.equal(x.counters.gets,1);
});

test('QL-362 fails closed when original private archive hash, auditor or STOP readback drift',async()=>{
  const wrong=setup({readOriginalPrivateArchive:async()=>({
    state:'ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED',
    originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',ownerOnlyAcl:true,
    archiveId:handoff.archiveId,sha256:'0'.repeat(64),evidence})});
  assert.match((await wrong.gate.runFirst(wrong.input)).state,/ARCHIVE_READBACK_CHANGED/);
  const audit=setup({verifyIndependentCustody:async()=>({revoked:true})});
  assert.match((await audit.gate.runFirst(audit.input)).state,/REDACTION_AUDIT/);
  const live=setup({observeOriginalReceiverOff:async()=>({receiverListenerCount:1})});
  assert.match((await live.gate.runFirst(live.input)).state,/SHUTDOWN_REQUIRED/);
  assert.equal(wrong.counters.gets+audit.counters.gets+live.counters.gets,0);
});

test('QL-362 refuses altered source/master owner signatures, expiry and duplicate IDs',async()=>{
  const invalid=setup();
  assert.match((await invalid.gate.runFirst({...invalid.input,
    sourceOwnerApproval:{...sourceOwnerApproval,signature:'A'.repeat(86)}})).state,
    /SOURCE_OWNER_SIGNED/);
  const master=setup();
  assert.match((await master.gate.runFirst({...master.input,
    masterOwnerApproval:{...masterOwnerApproval,signature:'A'.repeat(86)}})).state,
    /MASTER_OWNER_SIGNED/);
  const stale=setup();stale.setClock(t+100_000);
  assert.match((await stale.gate.runFirst(stale.input)).state,/STALE_EXACT/);
  const changed=setup();
  assert.match((await changed.gate.runFirst({...changed.input,
    request:{...intent,path:'/api/customers'}})).state,/DOES_NOT_MATCH/);
  assert.equal(invalid.counters.gets+master.counters.gets+stale.counters.gets+
    changed.counters.gets,0);
});

test('QL-362 requires a durable unique operation claim and one safe redacted GET response',async()=>{
  const noClaim=setup({claimSingleUseOperation:async()=>({durableUniqueClaim:false})});
  assert.match((await noClaim.gate.runFirst(noClaim.input)).state,/DURABLE_ONE_USE/);
  const redirect=setup({sendSignedGet:async()=>({redirected:true,httpStatus:302})});
  assert.match((await redirect.gate.runFirst(redirect.input)).state,/RESPONSE_SCOPE_OR_REDACTION/);
  const leak=setup({sendSignedGet:async()=>({sourceId,operationId,
    sourceOrigin:pinnedSource.sourceOrigin,method:'GET',path:intent.path,
    redirected:false,httpStatus:200,byteLength:300,
    body:{...safeBody,customerEmail:'person@example.invalid'}})});
  assert.match((await leak.gate.runFirst(leak.input)).state,/RESPONSE_SCOPE_OR_REDACTION/);
  assert.equal(redirect.counters.witnesses+leak.counters.witnesses,0);
});

test('QL-362 denies counterfeit source signer response and missing immutable TEST witness',async()=>{
  const noSigner=setup({verifySignedSourceReceipt:async()=>({sourceSignerAuthenticated:false})});
  assert.match((await noSigner.gate.runFirst(noSigner.input)).state,/SIGNED_RESPONSE/);
  const noWitness=setup({appendIndependentWitness:async()=>({immutableReadbackVerified:false})});
  assert.match((await noWitness.gate.runFirst(noWitness.input)).state,/IMMUTABLE_SOURCE_TEST/);
  assert.equal(noSigner.counters.gets,1);
  assert.equal(noWitness.counters.gets,1);
});

test('QL-362 rejects unauthorized source, incomplete original DB or changed source signer',async()=>{
  const db=setup({query:async sql=>sql.includes('count(receipt_id)')?
    {rows:[{count:0}]}:setupQuery(sql)});
  assert.match((await db.gate.runFirst(db.input)).state,/DATABASE_DRIFT/);
  const manifestPin=setup({resolvePinnedSource:async()=>({...pinnedSource,
    manifestTrustPin:{...pinnedSource.manifestTrustPin,approvedSourceOwner:false}})});
  assert.match((await manifestPin.gate.runFirst(manifestPin.input)).state,/SIGNED_SOURCE_MANIFEST/);
  const wrongPeer=setup();
  assert.match((await wrongPeer.gate.runFirst({...wrongPeer.input,
    sourceId:'not-a-source'})).state,/MALFORMED/);
});

function setupQuery(sql){
  if(sql.includes('receiver_role'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
  if(sql.includes('device_enrollments'))return {rows:[{device_id:'rosevear-windows-hub',
    workload_id:'hub-probe',key_id:'hub-ql339b',enrollment_state:'REVIEWED_TEST'}]};
  if(sql.includes('device_revocations'))return {rows:[{count:0}]};
  if(sql.includes('private_peers'))return {rows:expectedPeers};
  return {rows:[]};
}
