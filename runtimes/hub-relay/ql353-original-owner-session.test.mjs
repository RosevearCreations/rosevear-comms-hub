import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {QL353_COOKIE,QL353_ORIGIN,createQl353OperatorVerifier,
  createQl353AuthenticatedReadback,inspectQl353OriginalReceipt,
  reconcileQl353VerifiedOneReceipt,startQl353LoopbackReadback} from './ql353-original-owner-session.mjs';
import {QL342_RECEIPT_SCHEMA} from './ql342-owner-decision.mjs';
import {IDS} from './ql349-six-peer-orchestrator.mjs';

const sha=v=>createHash('sha256').update(v).digest('hex');
const hex=letter=>letter.repeat(64);
const now=Date.UTC(2026,10,6,18,40,0);
const token=hex('a'),csrf=hex('b'),sessionDigest=sha(token);
const session={state:'ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION',
  operatorId:'ree-original-windows-operator',originalComputer:'DESKTOP-AE894KC',
  sessionSha256:sessionDigest,originalIssuerDecisionSha256:hex('1'),
  sourceOwnerDecisionSha256:hex('2'),masterOwnerDecisionSha256:hex('3'),
  csrfSha256:sha(csrf),issuedAt:now-20_000,expiresAt:now+150_000};
const request=({method='GET',origin=QL353_ORIGIN,site='same-origin',
  cookie=`${QL353_COOKIE}=${token}`,csrfHeader=csrf,host='desktop-ae894kc.tailc43957.ts.net:8443',
  remoteAddress='127.0.0.1'}={})=>({method,socket:{remoteAddress},headers:{
  host,origin,'sec-fetch-site':site,cookie,'x-ql353-csrf':csrfHeader}});
const makeVerifier=(other={})=>createQl353OperatorVerifier({
  lookupServerSession:async digest=>digest===sessionDigest?{...session,...other}:null,
  verifyOriginalOwnerSession:async rec=>({state:'ORIGINAL_ISSUER_AND_DUAL_OWNER_SESSION_VERIFIED',
    originalComputer:'DESKTOP-AE894KC',sessionSha256:rec.sessionSha256,
    originalIssuerDecisionSha256:rec.originalIssuerDecisionSha256,
    sourceOwnerDecisionSha256:rec.sourceOwnerDecisionSha256,
    masterOwnerDecisionSha256:rec.masterOwnerDecisionSha256,
    replayOrRevocationFound:false}),now:()=>now});
const peers=IDS.map(peer_id=>({peer_id,connection_state:'HOLD',
  source_test_authorized:false,customer_data_allowed:false}));
const db=({role='ql340c_private_receiver',enrolled=0,revoked=0,
  receipts=0,rows=peers}={})=>async sql=>{
  if(sql.startsWith('SELECT current_user'))return {rows:[{receiver_role:role}]};
  if(sql.includes('master_hub_device_enrollments_ql339b'))return {rows:[{count:enrolled}]};
  if(sql.includes('master_hub_device_revocations_ql339b'))return {rows:[{count:revoked}]};
  if(sql.includes('master_hub_relay_receipts_ql338'))return {rows:[{count:receipts}]};
  if(sql.includes('master_hub_private_peers_ql341'))return {rows};
  throw Error('Unexpected SQL');
};
const oneReceipt={schema:QL342_RECEIPT_SCHEMA,
  state:'ORIGINAL_SIGNED_ONE_TEST_RECEIPT_VERIFIED_STILL_HELD',verified:true,
  connected:false,peerConnections:0,receiptCount:1,deviceId:'rosevear-windows-hub',
  sourceTestAuthorized:false,ownerPayloadSha256:hex('4'),receivedAt:new Date(now).toISOString()};

test('QL-353 accepts only server-held, issuer-verified, original-Windows short session',async()=>{
  const verify=makeVerifier();
  const result=await verify(request(),'ql353:status');
  assert.equal(result?.state,'VERIFIED_QL353_OPERATOR_READ_ONLY');
  assert.equal(Object.hasOwn(result,'sessionSha256'),false);
  assert.equal((await verify(request({method:'POST'}),'ql350:test:one'))?.csrfVerified,true);
  assert.equal((await verify(request(),'ql350:status'))?.source,'SERVER_VERIFIED_SESSION');
  assert.equal(await verify(request(),'ql353:write'),null);
});

test('QL-353 rejects cookies from outside verified origin, stale session, guessed token and CSRF bypass',async()=>{
  const verify=makeVerifier();
  const cases=[
    request({remoteAddress:'100.114.56.26'}),
    request({host:'desktop-ae894kc.tailc43957.ts.net:8788'}),
    request({origin:'https://evil.example'}),
    request({cookie:`${QL353_COOKIE}=${hex('c')}`}),
    request({cookie:`${QL353_COOKIE}=${token}; ${QL353_COOKIE}=${token}`}),
    request({cookie:`${QL353_COOKIE}=${token.slice(0,20)}`})];
  for(const item of cases)assert.equal(await verify(item,'ql353:status'),null);
  assert.equal(await verify(request({method:'POST',csrfHeader:hex('c')}),'ql350:test:one'),null);
  assert.equal(await verify(request({method:'POST',site:'cross-site'}),'ql350:test:one'),null);
  assert.equal(await makeVerifier({expiresAt:now-1})(request(),'ql353:status'),null);
  assert.equal(await makeVerifier({expiresAt:now+300_001})(request(),'ql353:status'),null);
  const revoked=createQl353OperatorVerifier({lookupServerSession:async()=>session,
    verifyOriginalOwnerSession:async()=>({state:'ORIGINAL_ISSUER_AND_DUAL_OWNER_SESSION_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',sessionSha256:sessionDigest,
      originalIssuerDecisionSha256:session.originalIssuerDecisionSha256,
      sourceOwnerDecisionSha256:session.sourceOwnerDecisionSha256,
      masterOwnerDecisionSha256:session.masterOwnerDecisionSha256,
      replayOrRevocationFound:true}),
    now:()=>now});
  assert.equal(await revoked(request(),'ql353:status'),null);
  const swappedMaster=createQl353OperatorVerifier({lookupServerSession:async()=>session,
    verifyOriginalOwnerSession:async()=>({
      state:'ORIGINAL_ISSUER_AND_DUAL_OWNER_SESSION_VERIFIED',
      originalComputer:'DESKTOP-AE894KC',sessionSha256:sessionDigest,
      originalIssuerDecisionSha256:session.originalIssuerDecisionSha256,
      sourceOwnerDecisionSha256:session.sourceOwnerDecisionSha256,
      masterOwnerDecisionSha256:hex('f'),replayOrRevocationFound:false}),now:()=>now});
  assert.equal(await swappedMaster(request(),'ql353:status'),null);
});

test('QL-353 live database zero enrollment and zero receipts remain distinctly held',async()=>{
  const result=await inspectQl353OriginalReceipt(db());
  assert.equal(result.state,'HOLD_ORIGINAL_OWNER_DATABASE_ENROLLMENT_MISSING');
  assert.equal(result.originalEnrollmentCount,0);
  assert.equal(result.originalReceiptCount,0);
  assert.equal(result.heldPeerCount,6);
  assert.equal(result.connectionState,'DISCONNECTED / HOLD');
  assert.equal(result.databaseMutations,0);
});

test('QL-353 never accepts NOLOGIN bypass, revoked owner, extra receipt, or another app in connected state',async()=>{
  for(const [opts,expected] of [
    [{role:'postgres'},'DENY_UNVERIFIED_OR_LOGIN_ENABLED_RECEIVER_IDENTITY'],
    [{enrolled:1,revoked:1},'HOLD_ORIGINAL_OWNER_DEVICE_REVOKED'],
    [{enrolled:1,receipts:2},'DENY_AMBIGUOUS_OR_CORRUPT_PRIVATE_RECEIPT_COUNTS'],
    [{enrolled:1,receipts:1,rows:peers.map((r,i)=>i===0?{...r,connection_state:'CONNECTED'}:r)},'DENY_PEER_CONNECTIONS_NOT_EXACTLY_SIX_HELD'],
    [{enrolled:1,receipts:0},'HOLD_EXACTLY_ONE_SIGNED_DEVICE_TEST_RECEIPT_REQUIRED'],
    [{enrolled:1,receipts:1},'HOLD_ORIGINAL_SIGNED_PACKET_AND_OWNER_DECISION_REQUIRED']]){
    assert.equal((await inspectQl353OriginalReceipt(db(opts))).state,expected);
  }
});

test('QL-353 accepts one original device receipt only after the independent QL-342 verifier',async()=>{
  const evidence={originalEnrollmentCount:1,originalRevocationCount:0,
    originalReceiptCount:1,heldPeerCount:6};
  const passed=reconcileQl353VerifiedOneReceipt(oneReceipt,evidence);
  assert.equal(passed.state,'ONE_ORIGINAL_SIGNED_TEST_RECEIPT_INDEPENDENTLY_VERIFIED_STILL_HELD');
  assert.equal(passed.verifiedSignedReceipt,true);
  assert.equal(passed.sourceTestAuthorized,false);
  assert.equal(passed.connectedCount,0);
  for(const changed of [{...oneReceipt,receiptCount:2},{...oneReceipt,verified:false},
    {...oneReceipt,connected:true},{...oneReceipt,deviceId:'other'}]){
    const result=reconcileQl353VerifiedOneReceipt(changed,evidence);
    assert.equal(result.state,'HOLD_INDEPENDENT_SIGNATURE_OR_WITNESS_RECONCILIATION_FAILED');
  }
  // A crafted packet and owner decision still cannot bypass the actual QL-342
  // Ed25519 verifier in the public QL-353 reconciliation entrypoint.
  const held=await inspectQl353OriginalReceipt(db({enrolled:1,receipts:1}),{
    pins:{},packet:{},decision:{},now});
  assert.equal(held.state,'HOLD_INDEPENDENT_SIGNATURE_OR_WITNESS_RECONCILIATION_FAILED');
});

test('QL-353 private readback denies missing operator and preserves HOLD on DB failure',async()=>{
  const rejected=createQl353AuthenticatedReadback({verifyOperator:async()=>null,query:db()});
  assert.equal((await rejected.inspect(request())).state,'DENY_UNAUTHENTICATED_PRIVATE_OPERATOR');
  const allowed=createQl353AuthenticatedReadback({verifyOperator:makeVerifier(),query:db()});
  const out=await allowed.inspect(request());
  assert.equal(out.authenticatedPrivateOperator,true);
  assert.equal(out.verifiedOriginalEnrollment,false);
  assert.equal(out.connectionState,'DISCONNECTED / HOLD');
  const noReader=createQl353AuthenticatedReadback({verifyOperator:makeVerifier()});
  assert.equal((await noReader.inspect(request())).state,'HOLD_PRIVATE_DATABASE_READER_REQUIRED');
});

test('QL-353 adds no database schema grant or public browser credential route',()=>{
  const source=readFileSync(fileURLToPath(new URL('./ql353-original-owner-session.mjs',import.meta.url)),'utf8');
  assert.doesNotMatch(source,/\b(?:INSERT|UPDATE|DELETE|GRANT|CREATE ROLE)\b\s+(?:INTO|ON|FROM|TO|ROLE)/i);
  assert.doesNotMatch(source,/VITE_SUPABASE|service_role|process\.env\.DATABASE_URL/);
  assert.match(source,/verifyOneHeldTestReceipt/);
  assert.match(source,/sourceRepositoryWrites:0/);
});

test('QL-353 read-only HTTP sidecar stays loopback and does not expose a POST enrollment or login route',async()=>{
  const readback=createQl353AuthenticatedReadback({verifyOperator:async()=>null,query:db()});
  const server=await startQl353LoopbackReadback({readback});
  try{
    assert.equal(server.address().address,'127.0.0.1');
    const base=`http://127.0.0.1:${server.address().port}`;
    const unauthorized=await fetch(`${base}/private/ql353/status`);
    assert.equal(unauthorized.status,403);
    assert.equal((await unauthorized.json()).state,'DENY_UNAUTHENTICATED_PRIVATE_OPERATOR');
    assert.equal(unauthorized.headers.get('access-control-allow-origin'),null);
    const mutation=await fetch(`${base}/private/ql353/status`,{method:'POST'});
    assert.equal(mutation.status,404);
    const unknown=await fetch(`${base}/private/ql353/enroll`);
    assert.equal(unknown.status,404);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
