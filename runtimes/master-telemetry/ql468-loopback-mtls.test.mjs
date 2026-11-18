/** QL-468 isolated loopback mTLS integration; no original host, private receiver or persistent keys. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash,X509Certificate} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request as httpsRequest} from 'node:https';
import {createQl467LocalSink,createQl467UnboundHttpsServer,QL467_ROUTE,QL467_SCHEMA} from './ql467-private-event-sink.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('QL468 real ephemeral TLS1.3 mutual-auth loopback POST, signed ACK, replay and no-client rejection',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ql468-mtls-'));
 const cmd=(...args)=>execFileSync('openssl',args,{cwd:dir,stdio:'ignore',timeout:10000});
 let server;
 try{
  cmd('req','-x509','-newkey','rsa:2048','-nodes','-keyout','ca.key','-out','ca.crt','-days','1','-subj','/CN=QL468IsolatedTestCA');
  cmd('req','-newkey','rsa:2048','-nodes','-keyout','server.key','-out','server.csr','-subj','/CN=127.0.0.1');
  writeFileSync(join(dir,'server.ext'),'subjectAltName=IP:127.0.0.1\nextendedKeyUsage=serverAuth\n');
  cmd('x509','-req','-in','server.csr','-CA','ca.crt','-CAkey','ca.key','-CAcreateserial',
    '-out','server.crt','-days','1','-sha256','-extfile','server.ext');
  cmd('req','-newkey','rsa:2048','-nodes','-keyout','client.key','-out','client.csr','-subj','/CN=QL468EphemeralClient');
  writeFileSync(join(dir,'client.ext'),'extendedKeyUsage=clientAuth\n');
  cmd('x509','-req','-in','client.csr','-CA','ca.crt','-CAkey','ca.key','-CAcreateserial',
    '-out','client.crt','-days','1','-sha256','-extfile','client.ext');
  const read=x=>readFileSync(join(dir,x));
  const issuer=generateKeyPairSync('ed25519'),recipient=generateKeyPairSync('ed25519');
  const pin=issuer.publicKey.export({type:'spki',format:'der'}).toString('base64');
  const leaf=sha(new X509Certificate(read('client.crt')).raw);
  const now=Date.now();
  const tenantId='tenant_loopback12345',workspaceId='workspace_loopback12345';
  mkdirSync(join(dir,'receipts'),{mode:0o700});
  const sink=createQl467LocalSink({directory:join(dir,'receipts'),sourceIssuerPin:pin,
    ackPrivateKey:recipient.privateKey,tenantId,workspaceId,tlsClientLeafSha256:leaf,now:()=>now});
  const opts={ca:read('ca.crt'),cert:read('server.crt'),key:read('server.key'),
    pinnedSourceIssuerPin:pin};
  server=createQl467UnboundHttpsServer({tlsOptions:opts,sink});
  assert.equal(server.listening,false,'source never automatically listens');
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const addr=server.address();assert.ok(addr?.port>0);
  const p={schema:QL467_SCHEMA,protocolVersion:'1.1',messageId:'message_loopback1234',
    issuer:'rosevear-ai-hub',audience:'rosevear-comms-hub',tenantId,workspaceId,
    eventId:'event_loopback123456',eventType:'status.read-only',payloadSha256:'b'.repeat(64),
    dataClass:'NONPERSONAL',issuedAtMs:now-1000,expiresAtMs:now+60000,authorityTransfer:false};
  const signed=payload=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),issuer.privateKey).toString('base64')});
  const post=(envelope,certificate=true)=>new Promise((resolve,reject)=>{
   const cfg={host:'127.0.0.1',port:addr.port,method:'POST',path:QL467_ROUTE,
    ca:read('ca.crt'),rejectUnauthorized:true,minVersion:'TLSv1.3',
    ...(certificate?{cert:read('client.crt'),key:read('client.key')}:{})};
   const req=httpsRequest(cfg,res=>{let body='';res.on('data',c=>body+=c);
    res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(body)}))});
   req.on('error',reject);req.end(JSON.stringify(envelope));
  });
  const good=signed(p),one=await post(good);
  assert.equal(one.status,202);assert.equal(one.body.payload.disposition,'RECEIVED');
  assert.equal(one.body.payload.sourceDigest,sha(Buffer.from(JSON.stringify(good))));
  const again=await post(good);assert.equal(again.status,200);
  assert.deepEqual(again.body,one.body);
  assert.equal((await post(signed({...p,eventId:'event_different12345'}))).status,409);
  assert.equal((await post(signed({...p,dataClass:'PERSONAL'}))).status,422);
  await assert.rejects(post(good,false));
  assert.equal(readdirSync(join(dir,'receipts')).length,1);
 }finally{
  if(server?.listening)await new Promise(resolve=>server.close(resolve));
  rmSync(dir,{recursive:true,force:true});
 }
});
