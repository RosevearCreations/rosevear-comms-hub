import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign,X509Certificate} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request as httpsRequest} from 'node:https';
import {
 QL478_ROUTE,QL478_SAMPLE,QL478_BOUNDARY,createQl478PrivateSink,
 createQl478UnboundHttpsServer,verifyQl478SignedAck
} from './ql478-private-pilot.mjs';
import {QL478_AUDIT,reconcileQl478IndependentAck} from './ql478-evidence-reconciliation.mjs';

const sha=x=>createHash('sha256').update(Buffer.isBuffer(x)||typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const keys=Object.fromEntries(['host','receiver','owner','witness','auditor'].map(n=>[n,generateKeyPairSync('ed25519')]));
const pin=n=>keys[n].publicKey.export({type:'spki',format:'der'}).toString('base64');
const signature=(payload,who)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 keys[who].privateKey).toString('base64')});
const now=Date.now(),host='DESKTOP-AE894KC',sourceMainSha='a'.repeat(40);
const field={state:'FIELD_EXPORT_REVIEW_HELD',sourceMainSha,
 fieldDigest:'b'.repeat(64),sampleDigest:'c'.repeat(64),
 sampleId:'88888888-8888-4888-8888-888888888888',
 telemetry:{workerScriptSha256:'d'.repeat(64),
  osBootId:'11111111-1111-4111-8111-111111111111',observedAtMs:now-12000,
  uptimeSeconds:433,processCount:79}};
const envPayload={schema:QL478_SAMPLE,
 messageId:'22222222-2222-4222-8222-222222222222',host,
 sourceApp:'rosevear-comms-hub',sourceMainSha,workerScriptSha256:'d'.repeat(64),
 fieldDigest:field.fieldDigest,sampleDigest:field.sampleDigest,sampleId:field.sampleId,
 osBootId:field.telemetry.osBootId,observedAtMs:field.telemetry.observedAtMs,
 uptimeSeconds:field.telemetry.uptimeSeconds,processCount:field.telemetry.processCount,
 dataClass:'NON_SENSITIVE_AGGREGATE',issuedAtMs:now-2000,expiresAtMs:now+120000,
 authorityTransfer:false,receiverEnableAuthorized:false};
test('QL478 sink is unbound and rejects missing original enrollment, directory traversal or same signer',()=>{
 const dir=mkdtempSync(join(tmpdir(),'ql478-config-'));
 try{
 assert.throws(()=>createQl478PrivateSink({directory:dir}),/OWNER_ENROLLED/);
 assert.throws(()=>createQl478PrivateSink({directory:dir+'/../unsafe',hostIssuerPin:pin('host'),
  receiverPrivateKey:keys.receiver.privateKey,expectedField:field,
  clientLeafSha256:'a'.repeat(64)}),/PRIVATE_DIRECTORY/);
 assert.throws(()=>createQl478UnboundHttpsServer({}),/MTLS_TRUST/);
 assert.equal(QL478_BOUNDARY.defaultReceiver,'OFF');
 assert.equal(QL478_BOUNDARY.autoListen,false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('QL478 real TLS1.3 loopback; pinned cert/signature, durable first ACK, replay, no PII and tamper',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ql478-mtls-'));
 const cmd=(...args)=>execFileSync('openssl',args,{cwd:dir,timeout:10000,stdio:'ignore'});
 let server;
 try{
  cmd('req','-x509','-newkey','rsa:2048','-nodes','-keyout','ca.key','-out','ca.crt',
    '-days','1','-subj','/CN=QL478IsolatedTestCA');
  cmd('req','-newkey','rsa:2048','-nodes','-keyout','server.key','-out','server.csr',
    '-subj','/CN=127.0.0.1');
  writeFileSync(join(dir,'server.ext'),'subjectAltName=IP:127.0.0.1\nextendedKeyUsage=serverAuth\n');
  cmd('x509','-req','-in','server.csr','-CA','ca.crt','-CAkey','ca.key',
    '-CAcreateserial','-out','server.crt','-days','1','-sha256','-extfile','server.ext');
  cmd('req','-newkey','rsa:2048','-nodes','-keyout','client.key','-out','client.csr',
    '-subj','/CN=QL478OwnerApprovedTestClient');
  writeFileSync(join(dir,'client.ext'),'extendedKeyUsage=clientAuth\n');
  cmd('x509','-req','-in','client.csr','-CA','ca.crt','-CAkey','ca.key',
    '-CAcreateserial','-out','client.crt','-days','1','-sha256','-extfile','client.ext');
  const read=n=>readFileSync(join(dir,n));
  const leaf=sha(new X509Certificate(read('client.crt')).raw);
  mkdirSync(join(dir,'ledger'),{mode:0o700});
  const sink=createQl478PrivateSink({directory:join(dir,'ledger'),hostIssuerPin:pin('host'),
   receiverPrivateKey:keys.receiver.privateKey,expectedField:field,clientLeafSha256:leaf,now:()=>now});
  server=createQl478UnboundHttpsServer({sink,tlsOptions:{
    ca:read('ca.crt'),cert:read('server.crt'),key:read('server.key'),
    pinnedHostIssuerPin:pin('host')}});
  assert.equal(server.listening,false,'no import-time listener allowed');
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const port=server.address().port;
  const post=(packet,{cert=true,path=QL478_ROUTE}={})=>new Promise((resolve,reject)=>{
   const req=httpsRequest({hostname:'127.0.0.1',port,path,method:'POST',
    ca:read('ca.crt'),rejectUnauthorized:true,minVersion:'TLSv1.3',
    ...(cert?{cert:read('client.crt'),key:read('client.key')}:{})},res=>{
     let body='';res.on('data',s=>body+=s);
     res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(body)}));
   });req.on('error',reject);req.end(JSON.stringify(packet));
  });
  const p=signature(envPayload,'host');
  const accepted=await post(p);
  assert.equal(accepted.status,202,JSON.stringify(accepted));
  assert.equal(accepted.body.payload.disposition,'RECEIVED_READ_ONLY');
  assert.equal(accepted.body.payload.persistentReadBack,true);
  assert.equal(verifyQl478SignedAck({packet:p,ack:accepted.body,hostPin:pin('host'),receiverPin:pin('receiver'),
    expectedLeafSha256:leaf,nowMs:now}).state,'SIGNED_DURABLE_ACK_REVIEW_HELD');
  assert.deepEqual((await post(p)).body,accepted.body);
  assert.equal((await post(p)).status,200);
  assert.equal((await post(signature({...envPayload,issuedAtMs:now-1500},'host'))).status,409);
  assert.equal((await post(signature({...envPayload,
    messageId:'33333333-3333-4333-8333-333333333333',customerEmail:'not-allowed@example.org'},'host'))).status,401);
  assert.equal((await post(signature({...envPayload,
    messageId:'33333333-3333-4333-8333-333333333333',dataClass:'PERSONAL'},'host'))).status,422);
  assert.equal((await post(signature({...envPayload,
    messageId:'33333333-3333-4333-8333-333333333333'},'owner'))).status,401);
  assert.equal((await post(p,{path:'/public'})).status,404);
  await assert.rejects(post(p,{cert:false}));
  const records=readdirSync(join(dir,'ledger'));
  assert.equal(records.length,1);
  const file=join(dir,'ledger',records[0]),saved=JSON.parse(readFileSync(file,'utf8'));
  saved.ack.payload.persistentReadBack=false;
  writeFileSync(file,JSON.stringify(saved),{mode:0o600});
  assert.equal((await post(p)).status,503,'tampered ledger never returns ACK');
  assert.equal(readdirSync(join(dir,'ledger')).length,1);
 }finally{if(server?.listening)await new Promise(resolve=>server.close(resolve));
  rmSync(dir,{recursive:true,force:true})}
});
test('QL478 original-host independent ACK reconciliation is signed-review HOLD, not field GREEN',()=>{
 const signedAckPayload={schema:'rosevear.comms.ql478.durable-telemetry-ack.v1',
  messageId:envPayload.messageId,sampleDigest:field.sampleDigest,
  fieldDigest:field.fieldDigest,issuer:'rosevear-comms-hub',audience:'rosevear-comms-hub',
  receivedAtMs:now-1000,disposition:'RECEIVED_READ_ONLY',persistentReadBack:true,
  tlsClientLeafSha256:'e'.repeat(64),authorityTransfer:false};
 const packet=signature(envPayload,'host'),ack=signature(signedAckPayload,'receiver');
 const audit={schema:QL478_AUDIT,host,sourceMainSha,
  fieldDigest:field.fieldDigest,messageId:envPayload.messageId,
  ackDigest:sha(ack),tlsClientLeafSha256:'e'.repeat(64),
  originalHostObserved:true,firstAckReadBackObserved:true,workerTaskStillOnDemand:true,
  receiverOffAtStart:true,sourceClonesPreserved:true,observerIndependent:true,
  observedAtMs:now-400,rebootPerformed:false,authorityTransfer:false};
 const witness={state:'SIGNED_ORIGINAL_HOST_CLAIMS_REVIEW_HELD',
  fieldDigest:field.fieldDigest,sourceMainSha};
 const run=(patch={},witnessArg=witness)=>reconcileQl478IndependentAck({
  field,ownerWitness:witnessArg,packet,ack,hostPin:pin('host'),
  auditorPacket:signature({...audit,...patch},'auditor'),auditorPin:pin('auditor'),
  receiverPin:pin('receiver'),clientLeafSha256:'e'.repeat(64),nowMs:now});
 const a=run();
 assert.equal(a.state,'THREE_SIGNED_SOURCES_REVIEW_HELD');
 assert.equal(a.originalHostPhysicalObservationVerified,false);
 assert.equal(a.firstProductionAckIndependentlyCertified,false);
 for(const patch of [{receiverOffAtStart:false},{observerIndependent:false},
 {rebootPerformed:true},{tlsClientLeafSha256:'f'.repeat(64)},
 {sourceClonesPreserved:false},{ackDigest:'0'.repeat(64)},
 {observedAtMs:now-800000}])
  assert.equal(run(patch).state,'HOLD',JSON.stringify(patch));
 assert.equal(run({}, {state:'HOLD'}).state,'HOLD');
 assert.equal(verifyQl478SignedAck({packet,ack,hostPin:pin('host'),receiverPin:pin('owner'),
  expectedLeafSha256:'e'.repeat(64),nowMs:now}).state,'HOLD');
});
test('QL478 owner-only original-host readback cannot be executed by CI and has no network sender',()=>{
 const script=readFileSync(new URL('./ql478-original-host-reconcile.ps1',import.meta.url),'utf8');
 assert.match(script,/HOLD_QL478_ORIGINAL_HOST_REQUIRED/);
 assert.match(script,/ApproveLocalReconciliation/);
 assert.match(script,/Get-FileHash/);
 assert.match(script,/Get-ScheduledTask/);
 assert.doesNotMatch(script,/\b(?:Register-ScheduledTask|Start-ScheduledTask|Remove-Item|Restart-Computer|New-Service|Invoke-WebRequest|Invoke-RestMethod|Start-Process)\b/i);
});
