import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash,X509Certificate} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {QL478_ROUTE} from './ql478-private-pilot.mjs';
import {QL479_ENROLL,QL479_AUDIT,QL479_BOUNDARY,reviewQl479PeerEnrollment,
 createQl479UnboundRemoteReceiver,buildQl479SignedSample,sendQl479Once,
 reviewQl479IndependentFirstAck} from './ql479-enrolled-remote-pilot.mjs';

const sha=x=>createHash('sha256').update(Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const pins=Object.fromEntries(['owner','custodian','source','receiver','auditor','wrong'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pin=k=>pins[k].publicKey.export({format:'der',type:'spki'}).toString('base64');
const packet=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),pins[k].privateKey).toString('base64')});
const main='a'.repeat(40),host='DESKTOP-AE894KC',now=Date.now();
const field={state:'FIELD_EXPORT_REVIEW_HELD',sourceMainSha:main,
 fieldDigest:'b'.repeat(64),sampleDigest:'c'.repeat(64),
 telemetry:{sampleId:'11111111-1111-4111-8111-111111111111',
  osBootId:'22222222-2222-4222-8222-222222222222',
  observedAtMs:now-15000,uptimeSeconds:323,processCount:61,
  workerScriptSha256:'d'.repeat(64)}};
const enrollment=(serverPin,clientPin,changes={})=>({
 schema:QL479_ENROLL,enrollmentId:'33333333-3333-4333-8333-333333333333',
 pilotMessageId:'44444444-4444-4444-8444-444444444444',sourceHost:host,
 sourceApp:'rosevear-comms-hub',sourceMainSha:main,fieldDigest:field.fieldDigest,
 sampleDigest:field.sampleDigest,sourceSignerPin:pin('source'),receiverSignerPin:pin('receiver'),
 tlsClientLeafSha256:clientPin,tlsServerLeafSha256:serverPin,
 remoteHost:'127.0.0.1',remotePort:9443,route:QL478_ROUTE,
 environment:'ISOLATED_SIMULATION',dataClass:'NON_SENSITIVE_AGGREGATE',
 issuedAtMs:now-1000,expiresAtMs:now+180000,
 messageLimit:1,autostart:false,customerDataIncluded:false,authorityTransfer:false,...changes});
const reviewed=(e,owner='owner',custodian='custodian')=>reviewQl479PeerEnrollment({
 ownerPacket:packet(e,owner),receiverPacket:packet(e,custodian),
 ownerPin:pin(owner),receiverCustodianPin:pin(custodian),field,nowMs:now});
test('QL479 enrollment is signed, narrow, pinned and fails closed on multiple owner and peer threats',()=>{
 const good=enrollment('e'.repeat(64),'f'.repeat(64));
 const x=reviewed(good);
 assert.equal(x.state,'SIMULATION_ENROLLED_HELD');
 assert.equal(x.originalHostCertified,false);
 assert.equal(reviewed(good,'owner','owner').state,'HOLD');
 for(const patch of [{remoteHost:'evil.org'},{remotePort:8788},{environment:'SUPERVISED_REMOTE'},
  {sourceMainSha:'0'.repeat(40)},{fieldDigest:'0'.repeat(64)},
  {customerDataIncluded:true},{autostart:true},{messageLimit:2},
  {route:'/public'},{dataClass:'PII'},{authorityTransfer:true},
  {expiresAtMs:now-1},{issuedAtMs:now+5000}])
   assert.equal(reviewed({...good,...patch}).state,'HOLD',JSON.stringify(patch));
 const production=reviewed(enrollment('e'.repeat(64),'f'.repeat(64),{
  environment:'SUPERVISED_REMOTE',remoteHost:'telemetry.rosevear.example.com'}));
 assert.equal(production.state,'REMOTE_ENROLLED_REVIEW_HELD');
 assert.equal(production.productionPeerEnrolled,false);
 assert.equal(QL479_BOUNDARY.autoListen,false);
 assert.equal(QL479_BOUNDARY.publicCloudflareEndpoint,false);
});
test('QL479 real mutually authenticated TLS1.3 over TCP and durable ACK with bounded one-message permit',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ql479-remote-'));
 let receiver;
 const openssl=(...args)=>execFileSync('openssl',args,{cwd:dir,stdio:'ignore',timeout:10000});
 try{
  openssl('req','-x509','-newkey','rsa:2048','-nodes','-keyout','ca.key','-out','ca.crt',
   '-days','1','-subj','/CN=QL479IsolatedCA');
  openssl('req','-newkey','rsa:2048','-nodes','-keyout','server.key','-out','server.csr',
   '-subj','/CN=127.0.0.1');
  writeFileSync(join(dir,'server.ext'),'subjectAltName=IP:127.0.0.1\nextendedKeyUsage=serverAuth\n');
  openssl('x509','-req','-in','server.csr','-CA','ca.crt','-CAkey','ca.key',
   '-CAcreateserial','-out','server.crt','-days','1','-sha256','-extfile','server.ext');
  openssl('req','-newkey','rsa:2048','-nodes','-keyout','client.key','-out','client.csr',
   '-subj','/CN=QL479SimulationHost');
  writeFileSync(join(dir,'client.ext'),'extendedKeyUsage=clientAuth\n');
  openssl('x509','-req','-in','client.csr','-CA','ca.crt','-CAkey','ca.key',
   '-CAcreateserial','-out','client.crt','-days','1','-sha256','-extfile','client.ext');
  const read=n=>readFileSync(join(dir,n));
  const cp=sha(new X509Certificate(read('client.crt')).raw);
  const sp=sha(new X509Certificate(read('server.crt')).raw);
  const e=enrollment(sp,cp),review=reviewed(e);
  mkdirSync(join(dir,'receipts'),{mode:0o700});
  receiver=createQl479UnboundRemoteReceiver({enrollmentReview:review,field,
    directory:join(dir,'receipts'),receiverPrivateKey:pins.receiver.privateKey,
    tlsOptions:{ca:read('ca.crt'),cert:read('server.crt'),key:read('server.key'),
      pinnedHostIssuerPin:pin('source')},now:()=>now});
  assert.equal(receiver.server.listening,false);
  await new Promise((yes,no)=>{
   receiver.server.once('error',no);
   receiver.server.listen(0,'127.0.0.1',yes);
  });
  const port=receiver.server.address().port;
  const signed=buildQl479SignedSample({enrollmentReview:review,field,
    hostPrivateKey:pins.source.privateKey,nowMs:now});
  const transport={ca:read('ca.crt'),cert:read('client.crt'),key:read('client.key')};
  const send=(pkt=signed,tls=transport,r=review)=>sendQl479Once({
   enrollmentReview:r,field,packet:pkt,tlsOptions:tls,simulationPort:port,nowMs:now});
  const first=await send();
  assert.equal(first.state,'SIMULATED_REMOTE_MTLS_ACK_HELD',JSON.stringify(first));
  assert.equal(first.serverCertPinned,true);
  assert.equal(first.durableAckSigned,true);
  assert.equal(first.originalHostCertified,false);
  const replay=await send();
  assert.equal(replay.state,'SIMULATED_REMOTE_MTLS_ACK_HELD');
  assert.equal(first.ackDigest,replay.ackDigest);
  assert.equal(readdirSync(join(dir,'receipts')).length,1);
  const mutated=packet({...signed.payload,issuedAtMs:now-500},'source');
  assert.equal((await send(mutated)).state,'HOLD','same message id with changed payload denied');
  assert.equal((await send(packet({...signed.payload,processCount:70},'source'))).state,'HOLD');
  assert.equal((await send(packet({...signed.payload,messageId:'55555555-5555-4555-8555-555555555555'},'source'))).state,'HOLD');
  assert.equal((await send(packet({...signed.payload,extraPersonal:'secret'},'source'))).state,'HOLD');
  assert.equal((await send(signed,{...transport,cert:read('server.crt')})).state,'HOLD');
  const wrongServer=reviewed(enrollment('0'.repeat(64),cp));
  assert.equal((await send(signed,transport,wrongServer)).state,'HOLD');
  const nowAudit=Date.now();
  const audit={schema:QL479_AUDIT,enrollmentId:e.enrollmentId,
   sourceMainSha:main,fieldDigest:field.fieldDigest,
   messageId:e.pilotMessageId,ackDigest:first.ackDigest,
   tlsClientLeafSha256:cp,tlsServerLeafSha256:sp,
   remoteHost:e.remoteHost,remotePort:e.remotePort,
   originalHostSeen:true,receiverLedgerSeen:true,
   sourceClonesPreserved:true,observerIndependent:true,
   observedAtMs:nowAudit,rebootPerformed:false,authorityTransfer:false};
  const auditReview=reviewQl479IndependentFirstAck({enrollmentReview:review,field,
   transport:first,auditorPacket:packet(audit,'auditor'),auditorPin:pin('auditor'),
   ownerPin:pin('owner'),receiverCustodianPin:pin('custodian'),nowMs:nowAudit});
  assert.equal(auditReview.state,'INDEPENDENTLY_SIGNED_REMOTE_ACK_REVIEW_HELD');
  assert.equal(auditReview.independentFirstAckCertified,false);
  for(const changed of [{observerIndependent:false},{receiverLedgerSeen:false},
     {sourceClonesPreserved:false},{ackDigest:'0'.repeat(64)},
     {rebootPerformed:true},{observedAtMs:nowAudit-900000}])
    assert.equal(reviewQl479IndependentFirstAck({
     enrollmentReview:review,field,transport:first,
     auditorPacket:packet({...audit,...changed},'auditor'),auditorPin:pin('auditor'),
     ownerPin:pin('owner'),receiverCustodianPin:pin('custodian'),nowMs:nowAudit
    }).state,'HOLD',JSON.stringify(changed));
  const ledgerFile=join(dir,'receipts',readdirSync(join(dir,'receipts'))[0]);
  const record=JSON.parse(readFileSync(ledgerFile,'utf8'));record.ack.payload.authorityTransfer=true;
  writeFileSync(ledgerFile,JSON.stringify(record));
  assert.equal((await send()).state,'HOLD','corrupt readback cannot re-ack');
 }finally{
  if(receiver?.server?.listening)
   await new Promise(done=>receiver.server.close(done));
  rmSync(dir,{recursive:true,force:true});
 }
});
