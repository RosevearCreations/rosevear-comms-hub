import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,randomBytes,randomUUID,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {ENROLLMENT_SCHEMA,verifyDeviceEnrollment,postgresDeviceTrustResolver} from './enrollment.mjs';
import {createPrivateHubHandler,startLoopbackReceiver} from './private-receiver.mjs';

const device=generateKeyPairSync('ed25519'),source=generateKeyPairSync('ed25519');
const master=generateKeyPairSync('ed25519');
const pub=key=>key.publicKey.export({type:'spki',format:'pem'});
const spki=key=>createHash('sha256').update(key.publicKey.export({type:'spki',format:'der'})).digest('hex');
const approvals={source:{keyId:'owner-source',publicKeyPem:pub(source)},
  master:{keyId:'owner-master',publicKeyPem:pub(master)}};
const current=Date.parse('2026-11-05T19:00:00.000Z');
const p={schema:ENROLLMENT_SCHEMA,issuer:'rosevear-ai-hub',
  audience:'rosevear-comms-hub:nonproduction',environment:'TEST',
  deviceId:'rosevear-windows-hub',workloadId:'hub-probe',keyId:'hub-ql339b',
  devicePublicKeyPem:pub(device),deviceSpkiSha256:spki(device),
  issuedAt:'2026-11-05T19:00:00.000Z',expiresAt:'2026-11-05T19:10:00.000Z',
  windowsWitnessSha256:'a'.repeat(64),privateTlsWitnessSha256:'b'.repeat(64),
  tailnetAclWitnessSha256:'c'.repeat(64),rollbackWitnessSha256:'d'.repeat(64)};
const signedApproval=(role,key)=>({keyId:`owner-${role}`,signature:sign(null,
  Buffer.from(`${role}:${canonicalize(p)}`),key.privateKey).toString('base64url')});
const record={payload:p,approvals:{source:signedApproval('source',source),
  master:signedApproval('master',master)}};
const e={schemaVersion:'rosevear.hub.relay.heartbeat.v1',issuer:'rosevear-ai-hub',
  audience:'rosevear-comms-hub:nonproduction',deviceId:p.deviceId,workloadId:p.workloadId,
  environment:'TEST',sequence:1,nonce:randomBytes(20).toString('base64url'),
  sessionId:randomUUID(),issuedAt:'2026-11-05T19:00:00.000Z',
  expiresAt:'2026-11-05T19:01:30.000Z',
  capabilities:['health.read','capabilities.read'],queueDepth:0,relayMode:'OUTBOUND_ONLY'};
const packet=env=>({envelope:env,keyId:p.keyId,
  signature:sign(null,Buffer.from(canonicalize(env)),device.privateKey).toString('base64url')});

test('two separately pinned owner signatures approve only a short-lived public device pin',()=>{
  const check=verifyDeviceEnrollment(record,approvals,current);
  assert.equal(check.state,'SIGNED_TEST_ENROLLMENT_VERIFIED');
  assert.equal(check.connected,false);
  assert.equal(check.trust.pinnedSpkiSha256,spki(device));
  for(const modified of [
    {payload:{...p,deviceId:'other-device'},approvals:record.approvals},
    {payload:{...p,environment:'PROD'},approvals:record.approvals},
    {payload:{...p,privateTlsWitnessSha256:null},approvals:record.approvals},
    {payload:{...p,deviceSpkiSha256:'f'.repeat(64)},approvals:record.approvals},
    {payload:p,approvals:{...record.approvals,master:record.approvals.source}},
  ])assert.equal(verifyDeviceEnrollment(modified,approvals,current).enrolled,false);
  assert.equal(verifyDeviceEnrollment(record,approvals,current+700_000).enrolled,false);
  assert.equal(verifyDeviceEnrollment(record,{source:approvals.source,master:approvals.source},current).enrolled,false);
});

test('database lookup supplies server-owned trust, never client boolean claims',async()=>{
  const queries=[];
  const resolver=postgresDeviceTrustResolver(async(sql,args)=>{
    queries.push({sql,args});return {rows:[{enrollment_record:record,revoked_at:null}]};
  },approvals,()=>current);
  assert.equal((await resolver(p.deviceId,p.workloadId,p.keyId)).deviceId,p.deviceId);
  assert.deepEqual(queries[0].args,[p.deviceId,p.workloadId,p.keyId]);
  assert.match(queries[0].sql,/enrollment_state='REVIEWED_TEST'/);
  assert.equal(await resolver('bad device',p.workloadId,p.keyId),null);
  assert.equal(await postgresDeviceTrustResolver(async()=>({rows:[{
    enrollment_record:record,revoked_at:'2026-11-05T19:00:00Z'}]}),approvals,()=>current)(p.deviceId,p.workloadId,p.keyId),null);
});

test('real loopback HTTP TEST exchange stores one signed, held receipt; repeat denied',async t=>{
  const issued=new Set();let inserted=0;
  const server=await startLoopbackReceiver({
    now:()=>current,
    resolveTrust:async()=>verifyDeviceEnrollment(record,approvals,current).trust,
    transaction:async fn=>fn({query:async(sql,params)=>{
      assert.match(sql,/INSERT INTO public.master_hub_relay_receipts_ql338/);
      const unique=`${params[0]}:${params[2]}:${params[3]}:${params[4]}`;
      if(issued.has(unique))return {rows:[]};
      issued.add(unique);inserted++;return {rows:[{receipt_id:randomUUID()}]};
    }})
  });
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const endpoint=`http://127.0.0.1:${server.address().port}/private/ql339b/hub/heartbeat`;
  const post=(body,header='application/json')=>fetch(endpoint,{method:'POST',
    headers:{'Content-Type':header},body:JSON.stringify(body)});
  const first=await post(packet(e));assert.equal(first.status,202);
  const saved=await first.json();assert.equal(saved.state,'SAVED_ONE_HELD_DEVICE_RECEIPT');
  assert.equal(saved.privateConnection,'DISCONNECTED / HOLD');
  assert.equal((await post(packet(e))).status,409);assert.equal(inserted,1);
  assert.equal((await post({...packet(e),trust:{sourceOwnerTestApproval:true}})).status,403);
  assert.equal((await post(packet({...e,deviceId:'another-device'}))).status,403);
  assert.equal((await post(packet(e),'text/plain')).status,415);
  assert.equal((await fetch(endpoint,{method:'GET'})).status,404);
  assert.equal(inserted,1);
});

test('missing approved server-side pin never reaches the receipt ledger',async t=>{
  let wrote=false;
  const server=await startLoopbackReceiver({resolveTrust:async()=>null,
    transaction:async()=>{wrote=true;throw Error('unexpected');}});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const r=await fetch(`http://127.0.0.1:${server.address().port}/private/ql339b/hub/heartbeat`,
    {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(packet(e))});
  assert.equal(r.status,403);assert.equal((await r.json()).state,'HOLD_DEVICE_NOT_ENROLLED');
  assert.equal(wrote,false);
  assert.throws(()=>createPrivateHubHandler({resolveTrust:async()=>null}),/PRIVATE_TRUST/);
});

test('the reviewed pin/revocation schema remains private, immutable and browser-denied',()=>{
  const sql=readFileSync(new URL('../../supabase/migrations/20261105183936_ql339b_private_device_enrollment_and_revocation.sql',import.meta.url),'utf8');
  assert.match(sql,/master_hub_device_enrollments_ql339b ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/master_hub_device_enrollments_ql339b FORCE ROW LEVEL SECURITY/);
  assert.match(sql,/master_hub_device_revocations_ql339b FORCE ROW LEVEL SECURITY/);
  assert.match(sql,/REVOKE ALL ON public\.master_hub_device_enrollments_ql339b FROM PUBLIC,anon,authenticated,service_role/);
  assert.match(sql,/GRANT SELECT ON public\.master_hub_device_enrollments_ql339b TO service_role/);
  assert.match(sql,/ql339b_enrollments_append_only BEFORE UPDATE OR DELETE/);
  assert.match(sql,/ql339b_revocations_append_only BEFORE UPDATE OR DELETE/);
  assert.doesNotMatch(sql,/GRANT (INSERT|UPDATE|DELETE).* TO (anon|authenticated|service_role)/);
});
