import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {inspectQl347Handoff,inspectSingleTestAndSixPeers,ql348Cli,
  QL348_SCHEMA} from './ql348-supervised-test-diagnostics.mjs';

const hash=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const receipt={schema:'rosevear.hub.ql347.custody-handoff.v1',
  ql346EvidenceSha256:'a'.repeat(64),issuerCustodyDecision:'HOLD',
  issuerEvidenceSha256:'b'.repeat(64),ownerDecisionDigests:[
    {role:'source',decision:'REVIEW_ACKNOWLEDGED_NO_ENROLLMENT',digest:'c'.repeat(64)},
    {role:'master',decision:'REVIEW_ACKNOWLEDGED_NO_ENROLLMENT',digest:'d'.repeat(64)}]};
const handoff={schema:receipt.schema,state:'RECONCILED_OFFLINE_HANDOFF_INDEPENDENT_AUTHORITY_HOLD',
  receipt,receiptSha256:hash(receipt),issuerCustodyVerified:false,
  ownerEnrollmentAuthorized:false,receiverActivated:false,databaseEnrollmentCreated:false,
  connected:false,networkRequests:0,customerCommunications:false,deviceActions:false};
const peers=[['ai-data-platform','support','ai-data-platform'],
  ['devilndove','business','devilndove-site'],['icamp','business','iCamp'],
  ['rosevear-ai-hub','support','rosevear-ai-hub'],
  ['rosiedazzlers','business','rosiedazzlers'],['yw','business','yw']]
  .map(([peer_id,peer_kind,source_repo])=>({peer_id,peer_kind,source_repo,
    connection_state:'HOLD',source_test_authorized:false,customer_data_allowed:false}));
const makeQuery=({role='ql340c_private_receiver',rows=peers,count=0}={})=>{
  const sql=[];
  const query=async statement=>{sql.push(statement);
    if(/current_user/.test(statement))return {rows:[{receiver_role:role}]};
    if(/private_peers_ql341/.test(statement))return {rows};
    if(/count\(receipt_id\)/.test(statement))return {rows:[{count}]};
    if(/FROM public.master_hub_relay_receipts_ql338/.test(statement))return {rows:[]};
    if(/device_enrollments_ql339b/.test(statement))return {rows:[]};
    throw Error('UNEXPECTED_QUERY');};
  return {query,sql};
};

test('supervised preflight is a format readback, never self-granted authority',async()=>{
  assert.equal(inspectQl347Handoff(handoff).handoffFormatValid,true);
  for(const mutation of [
    {ownerEnrollmentAuthorized:true},{issuerCustodyVerified:true},
    {connected:true},{networkRequests:1},{receiptSha256:'f'.repeat(64)},
    {receipt:{...receipt,issuerCustodyDecision:'APPROVED'}},
    {receipt:{...receipt,ownerDecisionDigests:[receipt.ownerDecisionDigests[0],
      receipt.ownerDecisionDigests[0]]}}])
    assert.equal(inspectQl347Handoff({...handoff,...mutation}).handoffFormatValid,false);
  assert.equal((await ql348Cli(['--help'])).noEnrollment,true);
  for(const command of ['--activate','--enroll','--send-once'])
    await assert.rejects(ql348Cli([command]),/DENY_UNSUPERVISED/);
});

test('six independently queried source records remain disconnected with zero customer effects',async()=>{
  const {query,sql}=makeQuery();
  const result=await inspectSingleTestAndSixPeers(query,{handoff,now:Date.now()});
  assert.equal(result.schema,QL348_SCHEMA);
  assert.equal(result.peerCount,6);
  assert.equal(result.connectedCount,0);
  assert.equal(result.singleTestReceiptVerified,false);
  assert.equal(result.diagnostics.length,6);
  assert.ok(result.diagnostics.every(p=>p.state==='DISCONNECTED / HOLD'&&
    p.sourceTestAuthorized===false&&p.customerDataAllowed===false));
  assert.equal(result.databaseWrites,0);
  assert.ok(sql.every(s=>/^SELECT\s/i.test(s)));
});

test('invalid handoff is held BEFORE any DB query; elevated or incomplete peers fail',async()=>{
  const {query,sql}=makeQuery();
  assert.match((await inspectSingleTestAndSixPeers(query,{handoff:{...handoff,
    receiverActivated:true}})).state,/^HOLD_/);
  assert.equal(sql.length,0);
  for(const rows of [peers.slice(0,5),peers.map((p,i)=>i? p:{...p,connection_state:'CONNECTED'}),
    peers.map((p,i)=>i? p:{...p,source_test_authorized:true})]){
    await assert.rejects(inspectSingleTestAndSixPeers(makeQuery({rows}).query,{handoff}),
      /HOLD_SIX_PEER|DENY_UNREVIEWED/);
  }
  await assert.rejects(inspectSingleTestAndSixPeers(makeQuery({role:'postgres'}).query,{handoff}),
    /DENY_UNVERIFIED_PRIVATE_DATABASE_ROLE/);
});

test('no one-test receipt can be claimed from a duplicate, absent or unverified enrollment',async()=>{
  const result=await inspectSingleTestAndSixPeers(makeQuery({count:2}).query,{
    handoff,packet:{envelope:{deviceId:'rosevear-windows-hub',workloadId:'hub-probe'},
      keyId:'hub-ql339b'},pins:{},ownerReview:{schema:'rosevear.hub.ql342.owner-enrollment-review.v1',
      state:'ORIGINAL_OWNER_SIGNATURES_VALID_FIELD_DECISION_PENDING',
      originalOwnerSignaturesVerified:true,fourCurrentWitnessHashesMatch:true,
      sourceTestAuthorized:false,databaseEnrollmentCreated:false,approved:false,
      payloadSha256:'a'.repeat(64)}});
  assert.equal(result.singleTestReceiptVerified,false);
  assert.equal(result.connectedCount,0);
  assert.equal(result.state,'HOLD_ONE_INDEPENDENTLY_VERIFIED_TEST_RECEIPT_REQUIRED');
});
