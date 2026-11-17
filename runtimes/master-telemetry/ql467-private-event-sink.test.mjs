import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtempSync,rmSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {QL467_ROUTE,QL467_SCHEMA,createQl467LocalSink,createQl467UnboundHttpsServer,reviewQl467SignedEnrollment,assessQl467OriginalHostAcceptance} from './ql467-private-event-sink.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const issuer=generateKeyPairSync('ed25519'),ackKey=generateKeyPairSync('ed25519');
const owner=generateKeyPairSync('ed25519'),custodian=generateKeyPairSync('ed25519');
const pin=k=>k.publicKey.export({format:'der',type:'spki'}).toString('base64');
const s=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const now=Date.now()-500,tenantId='tenant_rosevear123',workspaceId='workspace_rosevear123',leaf='a'.repeat(64);
const event={schema:QL467_SCHEMA,protocolVersion:'1.1',messageId:'message_abcdefgh12345',
 issuer:'rosevear-ai-hub',audience:'rosevear-comms-hub',tenantId,workspaceId,
 eventId:'event_abcdefgh12345',eventType:'status.read-only',payloadSha256:'b'.repeat(64),
 dataClass:'NONPERSONAL',issuedAtMs:now-1000,expiresAtMs:now+100000,authorityTransfer:false};
const fixture=()=>{const d=mkdtempSync(join(tmpdir(),'ql467-'));
 const sink=createQl467LocalSink({directory:join(d,'receipts'),sourceIssuerPin:pin(issuer),
  ackPrivateKey:ackKey.privateKey,tenantId,workspaceId,tlsClientLeafSha256:leaf,now:()=>now});
 return {d,sink,close:()=>rmSync(d,{recursive:true,force:true})}};
const request=(e=event)=>({envelope:s(e,issuer),clientAuthorized:true,
 clientLeafSha256:leaf,actualPeerIssuerPin:pin(issuer)});
test('QL467 exact private route is exported, no network listener or background process',()=>{
 const f=fixture();try{
  assert.equal(f.sink.route,QL467_ROUTE);
  assert.equal(f.sink.status,'PRIVATE_ADAPTER_SOURCE_ONLY_NOT_LISTENING');
  assert.equal(f.sink.writesAllowed,'SIGNED_AUDIT_RECEIPT_ONLY');
  assert.throws(()=>createQl467UnboundHttpsServer({sink:f.sink}),/PRIVATE_TLS_OPTIONS/);
 }finally{f.close()}
});
test('QL467 signed nonpersonal mTLS source creates single durable ACK, replay exact and conflict denied',()=>{
 const f=fixture();try{
  const one=f.sink.receive(request());
  assert.equal(one.httpStatus,202);assert.equal(one.body.payload.disposition,'RECEIVED');
  assert.equal(one.body.payload.issuer,'rosevear-comms-hub');
  assert.equal(one.body.payload.authorityTransfer,false);assert.equal(one.dispatched,false);
  const files=readdirSync(join(f.d,'receipts'));assert.equal(files.length,1);
  assert.ok(!readFileSync(join(f.d,'receipts',files[0]),'utf8').includes('example@'));
  const replay=f.sink.receive(request());assert.equal(replay.httpStatus,200);
  assert.deepEqual(replay.body,one.body);
  assert.equal(readdirSync(join(f.d,'receipts')).length,1);
  assert.equal(f.sink.receive(request({...event,eventId:'event_changed_12345'})).httpStatus,409);
 }finally{f.close()}
});
test('QL467 rejects wrong mTLS pin, issuer, forged content, PII, cross-tenant, expiry and unpinned headers',()=>{
 const f=fixture();try{
  const base=request();
  const bad=[{...base,clientAuthorized:false},{...base,clientLeafSha256:'c'.repeat(64)},
   {...base,actualPeerIssuerPin:pin(owner)},
   {...base,envelope:s(event,owner)}];
  for(const b of bad)assert.equal(f.sink.receive(b).httpStatus,401);
  for(const delta of [{tenantId:'tenant_other_abc123'},{workspaceId:'workspace_other_abc123'},
   {dataClass:'PERSONAL'},{customerPhone:'fake'},{expiresAtMs:now-1},
   {issuedAtMs:now-3600000},{authorityTransfer:true},
   {audience:'ai-data-platform'},{protocolVersion:'2.0'}]){
   const result=f.sink.receive(request({...event,...delta}));
   assert.equal(result.httpStatus,delta.customerPhone?401:422,JSON.stringify(delta));
  }
  assert.equal(readdirSync(join(f.d,'receipts')).length,0);
 }finally{f.close()}
});
test('QL467 immutable audit tampering stops ACK and does not recreate external authority',()=>{
 const f=fixture();try{f.sink.receive(request());
  const filename=join(f.d,'receipts',readdirSync(join(f.d,'receipts'))[0]);
  const old=JSON.parse(readFileSync(filename,'utf8'));
  old.ack.payload.disposition='DELIVERED_TO_CUSTOMER';
  writeFileSync(filename,JSON.stringify(old));
  const result=f.sink.receive(request());assert.equal(result.httpStatus,503);
 }finally{f.close()}
});
test('QL467 distinct source-signed owner+custodian review is not Windows installation or boot acceptance',()=>{
 const p={schema:'rosevear.comms.ql467.worker-review.v1',host:'DESKTOP-AE894KC',
  serviceName:'Rosevear-CommsHub',sourceMainSha:'a'.repeat(40),
  workerImageSha256:'d'.repeat(64),mode:'REVIEW_ONLY_NO_INSTALL',
  issuedAtMs:now-1000,expiresAtMs:now+100000,receiverAutostart:false,
  obsoleteTaskEnabled:false,authorityTransfer:false};
 const input={packet:{owner:s(p,owner),custodian:s(p,custodian)},
  ownerPin:pin(owner),custodianPin:pin(custodian),nowMs:now,mainSha:p.sourceMainSha};
 const ok=reviewQl467SignedEnrollment(input);assert.equal(ok.state,'SIGNED_SOURCE_REVIEW_ONLY');
 assert.equal(ok.workerInstalled,false);assert.equal(ok.autostartAuthorized,false);
 assert.equal(reviewQl467SignedEnrollment({...input,custodianPin:pin(owner)}).state,'HOLD');
 assert.equal(reviewQl467SignedEnrollment({...input,packet:{owner:s(p,owner),custodian:s({...p,receiverAutostart:true},custodian)}}).state,'HOLD');
 const acceptance=assessQl467OriginalHostAcceptance({workerEnrollment:ok,
   bootWitness:{state:'synthetic'},peerAck:{state:'synthetic'},independentAudit:{state:'synthetic'}});
 assert.equal(acceptance.state,'HOLD');assert.equal(acceptance.hostRebootAuthorized,false);
 assert.equal(acceptance.liveMtlsVerified,false);assert.equal(acceptance.independentAckVerified,false);
});
