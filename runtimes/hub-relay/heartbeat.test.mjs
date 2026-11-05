import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {verifyHubHeartbeat,privateHubHeartbeatLedger} from './heartbeat.mjs';

const now=Date.parse('2026-11-05T15:00:00.000Z');
const keys=generateKeyPairSync('ed25519');
const signed=e=>({envelope:e,keyId:'hub-ql338',signature:sign(null,
  Buffer.from(canonicalize(e)),keys.privateKey).toString('base64url')});
const e={schemaVersion:'rosevear.hub.relay.heartbeat.v1',issuer:'rosevear-ai-hub',
  audience:'rosevear-comms-hub:nonproduction',
  deviceId:'hub-windows-owner-1',workloadId:'hub-probe',environment:'TEST',sequence:1,
  nonce:'abcdefghijABCDEFGHIJ1234',sessionId:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  issuedAt:'2026-11-05T15:00:00.000Z',expiresAt:'2026-11-05T15:01:30.000Z',
  capabilities:['health.read','capabilities.read'],queueDepth:0,relayMode:'OUTBOUND_ONLY'};
const trust={deviceId:e.deviceId,workloadId:e.workloadId,issuer:'rosevear-ai-hub',
  sourceOwnerTestApproval:true,masterOwnerTestApproval:true,originalDeviceWitness:true,
  independentSignerCustody:true,serverWorkloadVerified:true,privateTlsOriginPinned:true,
  tailnetAclDeniedUnapprovedDevices:true,rollbackWitnessVerified:true,killSwitchArmed:true,
  pinnedKeyId:'hub-ql338',pinnedPublicKeyPem:keys.publicKey.export({format:'pem',type:'spki'}),
  pinnedSpkiSha256:createHash('sha256').update(keys.publicKey.export({format:'der',type:'spki'})).digest('hex')};

test('QL-338 signed TEST device receipt is held pending real Windows origin',()=>{
  const result=verifyHubHeartbeat(signed(e),trust,now);
  assert.equal(result.state,'SIGNED_TEST_DEVICE_PROOF_VERIFIED_RECEIPT_PENDING');
  assert.equal(result.verifiedSignature,true);
  assert.equal(result.privateConnection,'DISCONNECTED / HOLD');
  assert.equal(result.relayActivated,false);
  assert.equal(result.deviceActions,0);
});

test('QL-338 field and scope denials protect device, audience, and secrets',()=>{
  for(const altered of [{deviceId:'other-device'},{issuer:'unknown'},
    {audience:'wrong-service'},{environment:'PROD'},
    {capabilities:['camera.read']},{queueDepth:101},{sequence:0},{relayMode:'INBOUND_PUBLIC'},
    {privateKey:'forbidden'},{expiresAt:'2026-11-05T14:59:59.000Z'}]){
    assert.match(verifyHubHeartbeat(signed({...e,...altered}),trust,now).state,/^(DENY|HOLD)/);
  }
  for(const altered of [{sourceOwnerTestApproval:false},{masterOwnerTestApproval:false},
    {deviceId:'another-machine'},{serverWorkloadVerified:false},
    {privateTlsOriginPinned:false},{tailnetAclDeniedUnapprovedDevices:false},
    {rollbackWitnessVerified:false},{keyRevoked:true},{peerRedirected:true},
    {pinnedSpkiSha256:'f'.repeat(64)}]){
    assert.match(verifyHubHeartbeat(signed(e),{...trust,...altered},now).state,/^(DENY|HOLD)/);
  }
  assert.equal(verifyHubHeartbeat({...signed(e),signature:'a'.repeat(86)},trust,now).state,
    'DENY_INVALID_DEVICE_SIGNATURE');
});

test('QL-338 atomic HOLD receipt insert suppresses duplicate and nonce replay',async()=>{
  const seen=new Set();let written=0;
  const tx=async fn=>fn({query:async(sql,params)=>{
    if(!sql.includes('INSERT INTO'))throw Error('UNEXPECTED_QUERY');
    const dedupe=params[0]+':'+params[2]+':'+params[3];
    if(seen.has(dedupe))return {rows:[]};
    seen.add(dedupe);written++;return {rows:[{receipt_id:'one'}]};
  }});
  const inbox=privateHubHeartbeatLedger(tx);
  assert.equal((await inbox.receive(signed(e),trust,now)).state,'SAVED_ONE_HELD_DEVICE_RECEIPT');
  assert.equal((await inbox.receive(signed(e),trust,now)).state,'DUPLICATE_OR_REPLAY_NO_EFFECT');
  assert.equal(written,1);
  assert.equal((await inbox.receive(signed(e),{...trust,sourceOwnerTestApproval:false},now)).state,
    'HOLD_UNVERIFIED_DEVICE_OR_OWNER_AUTHORITY');
  assert.equal(written,1);
});

test('QL-338 storage failure propagates; no false successful receipt',async()=>{
  const inbox=privateHubHeartbeatLedger(async fn=>fn({query:async()=>{throw Error('DB_DOWN');}}));
  await assert.rejects(()=>inbox.receive(signed(e),trust,now),/DB_DOWN/);
  assert.throws(()=>privateHubHeartbeatLedger(null),/PRIVATE_ATOMIC/);
});
