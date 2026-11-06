import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SOURCES,canonicalize} from '../master-discovery/manifest.mjs';
import {IDS,inspectPublicSixSourceInventory,inspectSixPeerPrivateQueue,proposeFutureSource,
  createQl349Coordinator} from './ql349-six-peer-orchestrator.mjs';

const base=JSON.parse(readFileSync(new URL('../master-discovery/fixture.json',import.meta.url)));
const sha=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const manifest=id=>({...base,source_id:id,source_app_id:SOURCES[id].app,
  source_role:SOURCES[id].role,repository:`RosevearCreations/${SOURCES[id].repo}`,
  issuer:SOURCES[id].app,tenant_boundary:SOURCES[id].boundary,
  legacy_integration_v1:{...base.legacy_integration_v1,app_id:SOURCES[id].app}});
const sources=IDS.map(id=>({sourceId:id,commitSha:'1'.repeat(40),manifest:manifest(id)}));
const peers=IDS.map(id=>({peer_id:id,peer_kind:IDS.indexOf(id)<4?'business':'support',
  source_repo:SOURCES[id].repo,connection_state:'HOLD',
  source_test_authorized:false,customer_data_allowed:false}));
const operationId='bdbcf613-d84b-4826-81c2-f8a1f170fc65';
const args={sourceId:'yw',operationId,manifest:manifest('yw'),commitSha:'1'.repeat(40)};

test('six known source manifests reconcile without elevating legacy children or support identities',()=>{
  const result=inspectPublicSixSourceInventory(sources);
  assert.equal(result.sourceCount,6);
  assert.equal(result.connected,false);
  assert.deepEqual(result.sources.map(s=>s.sourceId),IDS);
  assert.ok(result.sources.every(s=>s.publicDescriptorState==='DISCOVERED_UNSIGNED_HELD'));
  for(const variant of [sources.slice(1),[...sources.slice(0,5),sources[0]],
    sources.map((v,i)=>i? v:{...v,commitSha:'main'}),
    sources.map((v,i)=>i? v:{...v,manifest:{...v.manifest,connection_state:'CONNECTED'}})])
    assert.match(inspectPublicSixSourceInventory(variant).state,/^HOLD_|^DENY_/);
});

test('all six database peers remain HOLD even after public manifests are found',()=>{
  const result=inspectSixPeerPrivateQueue(peers);
  assert.equal(result.peerCount,6);
  assert.equal(result.connectedCount,0);
  assert.equal(result.queue.length,6);
  assert.ok(result.queue.every(p=>p.state==='DISCONNECTED / HOLD'));
  assert.match(inspectSixPeerPrivateQueue(peers.map((p,i)=>i? p:{...p,
    source_test_authorized:true})).state,/^HOLD_/);
});

test('future application onboarding is a non-authorizing source proposal with no arbitrary GET',()=>{
  const proposal=proposeFutureSource({sourceId:'new-test-app',
    repository:'RosevearCreations/new-test-app',kind:'business_shell',
    manifestSha256:'c'.repeat(64)});
  assert.equal(proposal.state,'FUTURE_SOURCE_PROPOSAL_INDEPENDENT_REVIEW_HELD');
  assert.equal(proposal.registryWrites,0);
  assert.equal(proposal.privateNetworkRequests,0);
  assert.equal(proposal.connected,false);
  for(const mutation of [{sourceId:'yw'},
    {repository:'https://unsafe.example/secret'},
    {manifestSha256:'not-a-digest'}])
    assert.match(proposeFutureSource({...proposal.proposal,...mutation}).state,/DENY_/);
});

test('without independently verified private adapters nothing transmits',async()=>{
  const coordinator=createQl349Coordinator();
  const result=await coordinator.runOne(args);
  assert.equal(result.state,'HOLD_PRIVATE_SIGNER_TRANSPORT_AND_WITNESS_REQUIRED');
  assert.equal(result.connected,false);
  assert.equal(coordinator.inspect().attemptedCount,1);
  assert.equal((await coordinator.runOne(args)).state,'DENY_REPLAYED_SOURCE_TEST_OPERATION');
  assert.match((await coordinator.runOne({...args,sourceId:'unknown',operationId:
    '7f374c6e-2e50-4ed4-8b09-f5279f80933b'})).state,/DENY/);
});

test('one authorized signed TEST GET requires independent source receipt proof and never connects',async()=>{
  let sent=0,verified=0,clock=1_800_000_000_000;
  const coordinator=createQl349Coordinator({now:()=>clock,
    authorize:async request=>({status:'INDEPENDENT_PRIVATE_TEST_AUTHORITY_VERIFIED',
      requestSha256:sha(request),originalOwnerVerified:true,
      sourceOwnerVerified:true,sourceSignerVerified:true,
      nonproductionIsolationVerified:true}),
    sendSignedGet:async request=>{sent++;return {sourceId:request.sourceId,
      operationId:request.operationId,method:'GET',path:request.path,
      httpStatus:200,redirected:false,byteLength:400};},
    verifyReceipt:async request=>{verified++;return {
      status:'ORIGINAL_SOURCE_SIGNED_TEST_RECEIPT_VERIFIED',
      sourceId:request.sourceId,operationId:request.operationId,
      receiptSha256:'f'.repeat(64)};}});
  const result=await coordinator.runOne(args);
  assert.equal(result.state,'ONE_SOURCE_SIGNED_TEST_VERIFIED_STILL_HELD');
  assert.equal(result.authenticatedTest,true);
  assert.equal(result.connected,false);
  assert.equal(result.sourceWrites,0);
  assert.equal(result.customerDataAccess,false);
  assert.equal(sent,1);assert.equal(verified,1);
  clock+=100_000;
  assert.equal((await coordinator.runOne(args)).state,'DENY_REPLAYED_SOURCE_TEST_OPERATION');
});

test('concurrent attempts, untrusted authority, redirect and forged receipt stay isolated',async()=>{
  let release,sendCount=0;
  const deferred=new Promise(resolve=>{release=resolve;});
  const coordinator=createQl349Coordinator({
    authorize:async request=>{await deferred;return {status:'INDEPENDENT_PRIVATE_TEST_AUTHORITY_VERIFIED',
      requestSha256:sha(request),originalOwnerVerified:true,
      sourceOwnerVerified:true,sourceSignerVerified:true,
      nonproductionIsolationVerified:true};},
    sendSignedGet:async request=>{sendCount++;return {sourceId:request.sourceId,
      operationId:request.operationId,method:'GET',path:request.path,
      httpStatus:302,redirected:true,byteLength:10};},
    verifyReceipt:async()=>{throw Error('must not verify a redirect');}});
  const first=coordinator.runOne(args);
  assert.equal(coordinator.inspect().activeCount,1);
  assert.equal((await coordinator.runOne({...args,operationId:
    '2694024f-229b-4627-9780-12f5f5bfa697'})).state,'HOLD_ANOTHER_SOURCE_TEST_IN_PROGRESS');
  release();
  const result=await first;
  assert.equal(sendCount,1);
  assert.equal(result.retryAutomatically,false);
  assert.equal(result.connected,false);
  assert.match(result.state,/RECOVERY_REVIEW_REQUIRED/);
  const noTrust=createQl349Coordinator({authorize:async()=>({status:'APPROVED'}),
    sendSignedGet:async()=>{throw Error('must not send');},verifyReceipt:async()=>{}});
  assert.equal((await noTrust.runOne(args)).state,'HOLD_INDEPENDENT_SOURCE_OWNER_OR_ISSUER_AUTHORITY');
});
