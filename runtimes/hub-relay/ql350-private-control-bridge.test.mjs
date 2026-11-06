import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SOURCES,canonicalize} from '../master-discovery/manifest.mjs';
import {IDS} from './ql349-six-peer-orchestrator.mjs';
import {QL350_SCHEMA,createQl350PrivateControl,readQl350PrivateSnapshot,
  startQl350LoopbackBridge} from './ql350-private-control-bridge.mjs';

const now=1_800_000_000_000;
const operationId='bdbcf613-d84b-4826-81c2-f8a1f170fc65';
const fixture=JSON.parse(readFileSync(new URL('../master-discovery/fixture.json',import.meta.url)));
const manifest=id=>({...fixture,source_id:id,source_app_id:SOURCES[id].app,
  source_role:SOURCES[id].role,repository:`RosevearCreations/${SOURCES[id].repo}`,
  issuer:SOURCES[id].app,tenant_boundary:SOURCES[id].boundary,
  legacy_integration_v1:{...fixture.legacy_integration_v1,app_id:SOURCES[id].app}});
const sha=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const peerRows=IDS.map(id=>({peer_id:id,
  peer_kind:['rosiedazzlers','devilndove','yw','icamp'].includes(id)?'business':'support',
  source_repo:SOURCES[id].repo,connection_state:'HOLD',
  source_test_authorized:false,customer_data_allowed:false}));
const peers=IDS.map(id=>({peerId:id,connection:'DISCONNECTED / HOLD',
  sourceTestAuthorized:false,customerDataAllowed:false}));
const snapshot=(ready=false)=>({schema:QL350_SCHEMA,
  source:'PRIVATE_POSTGRES_AND_ORIGINAL_SIGNER',peerCount:6,peers,
  originalEnrollmentCount:ready?1:0,originalReceiptCount:ready?1:0,
  firstOriginalSignedReceiptVerified:ready,readyForOneSourceTest:ready,
  connectedCount:0});
const session=(action)=>({state:'AUTHENTICATED_PRIVATE_OPERATOR',action,
  privateOriginVerified:true,csrfVerified:true,source:'SERVER_VERIFIED_SESSION',
  expiresAt:now+90_000});
const authorized=async(_request,action)=>session(action);

test('database status is from dedicated role, exact six HELD peers and no invented signed receipt',async()=>{
  const query=async(sql)=>{
    if(sql.includes('current_user'))return {rows:[{receiver_role:'ql340c_private_receiver'}]};
    if(sql.includes('master_hub_private_peers_ql341'))return {rows:peerRows};
    if(sql.includes('count(receipt_id)'))return {rows:[{count:0}]};
    if(sql.includes('count(enrollment_id)'))return {rows:[{count:0}]};
    throw Error('unexpected SQL');
  };
  const s=await readQl350PrivateSnapshot(query,{now});
  assert.equal(s.peerCount,6);
  assert.equal(s.originalEnrollmentCount,0);
  assert.equal(s.firstOriginalSignedReceiptVerified,false);
  assert.equal(s.readyForOneSourceTest,false);
  assert.equal(s.connectedCount,0);
  await assert.rejects(()=>readQl350PrivateSnapshot(async sql=>
    sql.includes('current_user')?{rows:[{receiver_role:'postgres'}]}:
      {rows:[]}),/DENY_UNVERIFIED_PRIVATE_DATABASE_ROLE/);
});

test('without original enrollment and signed receipt the private bridge cannot dispatch',async()=>{
  let sends=0;
  const control=createQl350PrivateControl({now:()=>now,
    authenticate:authorized,readSnapshot:async()=>snapshot(false),
    sendSignedGet:async()=>{sends++;throw Error('should not send');}});
  const status=await control.inspect({});
  assert.equal(status.state,'HOLD_ORIGINAL_WINDOWS_ENROLLMENT_AND_SIGNED_RECEIPT');
  assert.equal(status.originalEnrollmentCount,0);
  const outcome=await control.runOne({}, {sourceId:'yw',operationId});
  assert.equal(outcome.state,'HOLD_FIRST_ORIGINAL_ENROLLMENT_AND_RECEIPT_REQUIRED');
  assert.equal(sends,0);
  assert.equal(outcome.connectedCount,0);
});

test('operator identity and CSRF are private server facts; forged browser booleans are denied',async()=>{
  let reads=0;
  const control=createQl350PrivateControl({now:()=>now,
    authenticate:async()=>({...session('ql350:status'),csrfVerified:false}),
    readSnapshot:async()=>{reads++;return snapshot(true);}});
  assert.equal((await control.inspect({ownerApproved:true,csrfVerified:true})).state,
    'DENY_UNAUTHENTICATED_PRIVATE_OPERATOR');
  assert.equal((await control.runOne({ownerApproved:true},
    {sourceId:'yw',operationId})).state,'DENY_UNAUTHENTICATED_PRIVATE_OPERATOR');
  assert.equal(reads,0);
});

test('one independently signed GET and append-only witness remain TEST HELD',async()=>{
  let sends=0,witnesses=0;
  const control=createQl350PrivateControl({now:()=>now,
    authenticate:authorized,readSnapshot:async()=>snapshot(true),
    resolvePinnedSource:async id=>({sourceId:id,commitSha:'a'.repeat(40),manifest:manifest(id)}),
    authorizeSource:async req=>({status:'INDEPENDENT_PRIVATE_TEST_AUTHORITY_VERIFIED',
      requestSha256:sha(req),originalOwnerVerified:true,sourceOwnerVerified:true,
      sourceSignerVerified:true,nonproductionIsolationVerified:true}),
    sendSignedGet:async req=>{sends++;return {sourceId:req.sourceId,
      operationId:req.operationId,method:'GET',path:req.path,httpStatus:200,
      redirected:false,byteLength:145};},
    verifySourceReceipt:async req=>({status:'ORIGINAL_SOURCE_SIGNED_TEST_RECEIPT_VERIFIED',
      sourceId:req.sourceId,operationId:req.operationId,receiptSha256:'f'.repeat(64)}),
    appendIndependentWitness:async evidence=>{witnesses++;return {
      state:'INDEPENDENT_APPEND_ONLY_TEST_WITNESS_CONFIRMED',...evidence};}});
  const outcome=await control.runOne({},{sourceId:'yw',operationId});
  assert.equal(outcome.state,'ONE_SOURCE_SIGNED_TEST_WITNESS_VERIFIED_STILL_HELD');
  assert.equal(outcome.authenticatedTest,true);
  assert.equal(outcome.connectedCount,0);
  assert.equal(sends,1);assert.equal(witnesses,1);
  assert.equal((await control.runOne({},{sourceId:'yw',operationId})).state,
    'DENY_REPLAYED_PRIVATE_TEST_INTENT');
});

test('no witness, source signer or exact pinned source means HOLD without false success',async()=>{
  let sends=0;
  const control=createQl350PrivateControl({now:()=>now,
    authenticate:authorized,readSnapshot:async()=>snapshot(true),
    resolvePinnedSource:async id=>({sourceId:id,commitSha:'a'.repeat(40),manifest:manifest(id)}),
    sendSignedGet:async()=>{sends++;}});
  const outcome=await control.runOne({},{sourceId:'icamp',operationId});
  assert.equal(outcome.state,'HOLD_PRIVATE_SIGNER_AND_WITNESS_ADAPTERS_NOT_CONFIGURED');
  assert.equal(outcome.connectedCount,0);assert.equal(sends,0);
});

test('private loopback HTTP requires exact path, server session, same-origin CSRF and bounded body',async()=>{
  const control=createQl350PrivateControl({now:()=>now,
    authenticate:authorized,readSnapshot:async()=>snapshot(false)});
  const server=await startQl350LoopbackBridge({control,
    authenticateRequest:async()=>null,
    expectedOrigin:'https://hub.tailnet.ts.net'});
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const forbidden=await fetch(`${base}/private/ql350/test`,{method:'POST',
      headers:{'content-type':'application/json',origin:'https://evil.example',
        'sec-fetch-site':'same-origin'},body:JSON.stringify({sourceId:'yw',operationId})});
    assert.equal(forbidden.status,403);
    const unknown=await fetch(`${base}/private/ql350/arbitrary`);
    assert.equal(unknown.status,404);
    const status=await fetch(`${base}/private/ql350/status`);
    assert.equal(status.status,403); // request adapter did not provide signed session
    const invalid=await fetch(`${base}/private/ql350/test`,{method:'POST',
      headers:{'content-type':'application/json',origin:'https://hub.tailnet.ts.net',
        'sec-fetch-site':'same-origin'},body:JSON.stringify({sourceId:'yw',operationId,
          ownerApproved:true})});
    assert.equal(invalid.status,403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('authenticated same-origin private status works but HTTP TEST remains blocked before enrollment',async()=>{
  const control=createQl350PrivateControl({now:()=>now,
    authenticate:authorized,readSnapshot:async()=>snapshot(false)});
  const server=await startQl350LoopbackBridge({control,
    authenticateRequest:async()=>({originalHostVerified:true}),
    expectedOrigin:'https://hub.tailnet.ts.net'});
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const response=await fetch(`${base}/private/ql350/status`);
    assert.equal(response.status,200);
    const status=await response.json();
    assert.equal(status.authenticatedPrivateOperator,true);
    assert.equal(status.connectedCount,0);
    const headers={'content-type':'application/json',origin:'https://hub.tailnet.ts.net',
      'sec-fetch-site':'same-origin'};
    const denied=await fetch(`${base}/private/ql350/test`,{method:'POST',headers,
      body:JSON.stringify({sourceId:'rosiedazzlers',operationId})});
    assert.equal(denied.status,202);
    assert.equal((await denied.json()).state,
      'HOLD_FIRST_ORIGINAL_ENROLLMENT_AND_RECEIPT_REQUIRED');
    const forged=await fetch(`${base}/private/ql350/test`,{method:'POST',headers,
      body:JSON.stringify({sourceId:'rosiedazzlers',operationId,ownerApproved:true})});
    assert.equal(forged.status,400);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('failed independent source witness stays isolated and requires review',async()=>{
  let sends=0;
  const control=createQl350PrivateControl({now:()=>now,
    authenticate:authorized,readSnapshot:async()=>snapshot(true),
    resolvePinnedSource:async id=>({sourceId:id,commitSha:'a'.repeat(40),manifest:manifest(id)}),
    authorizeSource:async req=>({status:'INDEPENDENT_PRIVATE_TEST_AUTHORITY_VERIFIED',
      requestSha256:sha(req),originalOwnerVerified:true,sourceOwnerVerified:true,
      sourceSignerVerified:true,nonproductionIsolationVerified:true}),
    sendSignedGet:async req=>{sends++;return {sourceId:req.sourceId,
      operationId:req.operationId,method:'GET',path:req.path,
      httpStatus:200,redirected:false,byteLength:128};},
    verifySourceReceipt:async req=>({status:'ORIGINAL_SOURCE_SIGNED_TEST_RECEIPT_VERIFIED',
      sourceId:req.sourceId,operationId:req.operationId,receiptSha256:'f'.repeat(64)}),
    appendIndependentWitness:async()=>({state:'UNVERIFIED_WITNESS'})});
  const result=await control.runOne({},{sourceId:'icamp',operationId});
  assert.equal(result.state,'HOLD_SOURCE_WITNESS_NOT_INDEPENDENTLY_PERSISTED');
  assert.equal(result.retryAutomatically,false);
  assert.equal(result.connectedCount,0);
  assert.equal(sends,1);
  assert.equal((await control.runOne({},{sourceId:'icamp',operationId})).state,
    'DENY_REPLAYED_PRIVATE_TEST_INTENT');
});
