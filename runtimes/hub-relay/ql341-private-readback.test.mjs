import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {readbackCli,readPrivateSixPeerSnapshot,verifySignedTestReceipt,
  validateSixHeldPeers} from './ql341-private-readback.mjs';

const SHA=x=>createHash('sha256').update(x).digest('hex');
const keys={source:generateKeyPairSync('ed25519'),master:generateKeyPairSync('ed25519'),
  device:generateKeyPairSync('ed25519')};
const pem=x=>keys[x].publicKey.export({format:'pem',type:'spki'});
const at=Date.parse('2026-11-05T22:00:00.000Z');
const pins={schema:'rosevear.hub.ql339b.owner-authorities.v1',
  source:{keyId:'synthetic-source',publicKeyPem:pem('source')},
  master:{keyId:'synthetic-master',publicKeyPem:pem('master')}};
const ownerPayload={schema:'rosevear.hub.relay.enrollment.v1',issuer:'rosevear-ai-hub',
  audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:pem('device'),
  deviceSpkiSha256:SHA(keys.device.publicKey.export({format:'der',type:'spki'})),
  issuedAt:new Date(at-30_000).toISOString(),expiresAt:new Date(at+600_000).toISOString(),
  windowsWitnessSha256:SHA('synthetic-windows'),privateTlsWitnessSha256:SHA('synthetic-tls'),
  tailnetAclWitnessSha256:SHA('synthetic-acl'),rollbackWitnessSha256:SHA('synthetic-rollback')};
const enrollment={payload:ownerPayload,approvals:Object.fromEntries(['source','master'].map(role=>[
  role,{keyId:pins[role].keyId,signature:sign(null,
    Buffer.from(`${role}:${canonicalize(ownerPayload)}`),keys[role].privateKey).toString('base64url')}]))};
const env={schemaVersion:'rosevear.hub.relay.heartbeat.v1',issuer:'rosevear-ai-hub',
  audience:'rosevear-comms-hub:nonproduction',deviceId:'rosevear-windows-hub',
  workloadId:'hub-probe',environment:'TEST',sequence:1,
  nonce:'exampleNonceWith22Chars0123',sessionId:'59d4eb96-ff78-4524-857a-a6a60ec813ce',
  issuedAt:new Date(at-20_000).toISOString(),expiresAt:new Date(at+80_000).toISOString(),
  capabilities:['health.read','capabilities.read'],queueDepth:0,relayMode:'OUTBOUND_ONLY'};
const packet={envelope:env,keyId:'hub-ql339b',
  signature:sign(null,Buffer.from(canonicalize(env)),keys.device.privateKey).toString('base64url')};
const peers=[['rosiedazzlers','business','rosiedazzlers'],
  ['devilndove','business','devilndove-site'],['icamp','business','iCamp'],['yw','business','yw'],
  ['ai-data-platform','support','ai-data-platform'],['rosevear-ai-hub','support','rosevear-ai-hub']]
  .map(([peer_id,peer_kind,source_repo])=>({peer_id,peer_kind,source_repo,
    connection_state:'HOLD',source_test_authorized:false,customer_data_allowed:false}));
const receipt={device_id:env.deviceId,workload_id:env.workloadId,session_id:env.sessionId,
  sequence_no:env.sequence,nonce:env.nonce,heartbeat_sha256:SHA(canonicalize(env)),
  queue_depth:env.queueDepth,source_app_id:'rosevear-ai-hub',connection_state:'HOLD',
  received_at:new Date(at).toISOString()};
const query=(options={})=>async sql=>{
  if(sql.startsWith('SELECT current_user'))return {rows:[{receiver_role:options.role??'ql340c_private_receiver'}]};
  if(sql.includes('master_hub_private_peers_ql341'))return {rows:options.peers??peers};
  if(sql.includes('count(receipt_id)'))return {rows:[{count:options.heldCount??1}]};
  if(sql.includes('FROM public.master_hub_relay_receipts_ql338'))return {rows:options.receipts??[receipt]};
  if(sql.includes('FROM public.master_hub_device_enrollments_ql339b'))
    return {rows:[{enrollment_record:enrollment,revoked_at:options.revoked??null}]};
  throw Error('UNEXPECTED_PRIVATE_SQL');
};

test('six original private peers are exact, tenant separated and immutable HOLD',()=>{
  assert.equal(validateSixHeldPeers(peers).length,6);
  assert.throws(()=>validateSixHeldPeers(peers.slice(1)),/INCOMPLETE/);
  assert.throws(()=>validateSixHeldPeers([...peers.slice(0,5),peers[0]]),/ELEVATED/);
  assert.throws(()=>validateSixHeldPeers(peers.map((p,i)=>i? p : {...p,connection_state:'CONNECTED'})),/ELEVATED/);
  assert.throws(()=>validateSixHeldPeers(peers.map((p,i)=>i? p : {...p,customer_data_allowed:true})),/ELEVATED/);
});
test('private DB plus ORIGINAL owner/device signature and one exact HOLD receipt prove only TEST',async()=>{
  const result=await verifySignedTestReceipt(query(),pins,packet,at+1000);
  assert.equal(result.verified,true);
  assert.equal(result.connected,false);
  assert.equal(result.state,'ORIGINAL_SIGNED_TEST_HEARTBEAT_AND_DB_RECEIPT_VERIFIED');
  const pgTyped=await verifySignedTestReceipt(query({receipts:[{...receipt,
    received_at:new Date(at)}]}),pins,packet,at+1000);
  assert.equal(pgTyped.verified,true,'PostgreSQL timestamptz Date must verify');
  const snap=await readPrivateSixPeerSnapshot(query(),{pins,packet,now:at+1000});
  assert.equal(snap.peerCount,6);assert.equal(snap.connectedCount,0);
  assert.equal(snap.witness.verified,true);
  assert.equal(snap.customerCommunications,0);
  assert.equal(snap.authorizedExternalGets,0);
});
test('no real original packet, missing receipt, altered signature, revocation or excess scope DENY',async()=>{
  const snap=await readPrivateSixPeerSnapshot(query(),{now:at+1000});
  assert.equal(snap.witness.verified,false);
  assert.equal(snap.heldDeviceReceiptCount,1);
  assert.equal((await verifySignedTestReceipt(query({receipts:[]}),pins,packet,at)).verified,false);
  assert.equal((await verifySignedTestReceipt(query({receipts:[{...receipt,heartbeat_sha256:'a'.repeat(64)}]}),pins,packet,at)).verified,false);
  assert.equal((await verifySignedTestReceipt(query(),pins,{...packet,signature:'b'.repeat(86)},at)).verified,false);
  assert.equal((await verifySignedTestReceipt(query({revoked:'2026-11-05T22:00:00Z'}),pins,packet,at)).verified,false);
  await assert.rejects(()=>readPrivateSixPeerSnapshot(query({role:'postgres'})),/DENY_UNVERIFIED/);
  await assert.rejects(()=>readPrivateSixPeerSnapshot(query({peers:[]})),/INCOMPLETE/);
});
test('private CLI and SQL remain read-only, browser-denied and network-disabled',async()=>{
  assert.equal((await readbackCli(['--help'])).databaseWrites,0);
  await assert.rejects(()=>readbackCli(['--readback']),/HOLD_OWNER_WINDOWS/);
  const sql=readFileSync(new URL('../../supabase/migrations/20261106004637_ql341_six_private_peers_and_receipt_readback.sql',import.meta.url),'utf8');
  assert.match(sql,/FOR SELECT TO ql340c_private_receiver/);
  assert.match(sql,/FORCE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL ON public\.master_hub_private_peers_ql341/);
  assert.match(sql,/customer_data_allowed=false/);
  assert.doesNotMatch(sql,/GRANT (UPDATE|DELETE|ALL) .* TO ql340c_private_receiver/);
  const operator=readFileSync(new URL('./ql340c-windows-operator.ps1',import.meta.url),'utf8');
  assert.match(operator,/if \(\$Readback\)/);
  assert.match(operator,/HOLD_STOP_RECEIVER_BEFORE_READ_ONLY_RECONCILIATION/);
});
