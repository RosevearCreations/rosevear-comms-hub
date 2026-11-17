/**
 * QL-467 opt-in PRIVATE HTTPS read-only event sink adapter.
 * Exported only: no port, service, task, database migration or receiver is
 * installed or started by importing this module or by the public Worker.
 */
import {createHash,createPublicKey,createPrivateKey,sign,verify,timingSafeEqual} from 'node:crypto';
import {createServer} from 'node:https';
import {mkdirSync,lstatSync,openSync,closeSync,readFileSync,writeFileSync,fsyncSync,fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

export const QL467_ROUTE='/internal/rosevear/master/events/read-only/v1';
export const QL467_SCHEMA='rosevear.master.event.read-only.ql467.v1';
export const QL467_ACK_SCHEMA='rosevear.master.event.read-only.ack.ql467.v1';
const ID=/^[a-zA-Z0-9_-]{12,96}$/;
const HEX=/^[a-f0-9]{64}$/;
const fields=['schema','protocolVersion','messageId','issuer','audience','tenantId','workspaceId','eventId','eventType','payloadSha256','dataClass','issuedAtMs','expiresAtMs','authorityTransfer'];
const shapes=(o,ks)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===ks.length&&ks.every(k=>Object.hasOwn(o,k));
const sha=s=>createHash('sha256').update(s).digest('hex');
const eql=(a,b)=>HEX.test(a??'')&&HEX.test(b??'')&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const validKey=(pin)=>{try{if(typeof pin!=='string'||pin.length>512)return null;
 const b=Buffer.from(pin,'base64');if(b.toString('base64')!==pin)return null;
 const p=createPublicKey({key:b,type:'spki',format:'der'});return p.asymmetricKeyType==='ed25519'?p:null;}catch{return null}};
function validSignature(packet,pin,keys){
 if(!shapes(packet,['payload','signature'])||!shapes(packet.payload,keys)||
  typeof packet.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(packet.signature))return false;
 const key=validKey(pin);if(!key)return false;
 return verify(null,Buffer.from(JSON.stringify(packet.payload)),key,Buffer.from(packet.signature,'base64'));
}
const reply=(status,code,ack)=>({httpStatus:status,body:ack??{state:'HOLD',reason:code},executed:false,dispatched:false,workerActivated:false});
/** Acceptable signed enrollment is narrow TEST-only; not Windows worker installation. */
export function reviewQl467SignedEnrollment({packet,ownerPin,custodianPin,nowMs,mainSha}={}){
 const ks=['schema','host','serviceName','sourceMainSha','workerImageSha256','mode','issuedAtMs','expiresAtMs','receiverAutostart','obsoleteTaskEnabled','authorityTransfer'];
 if(ownerPin===custodianPin||!validSignature(packet?.owner,ownerPin,ks)||
  !validSignature(packet?.custodian,custodianPin,ks))
  return {state:'HOLD',reason:'QL467_INDEPENDENT_ORIGINAL_SIGNERS_REQUIRED',workerInstalled:false};
 const a=packet.owner.payload,b=packet.custodian.payload;
 if(JSON.stringify(a)!==JSON.stringify(b)||a.schema!=='rosevear.comms.ql467.worker-review.v1'||
  a.host!=='DESKTOP-AE894KC'||a.serviceName!=='Rosevear-CommsHub'||
  !HEX.test(a.workerImageSha256??'')||!(/^[a-f0-9]{40}$/.test(mainSha??''))||
  a.sourceMainSha!==mainSha||a.mode!=='REVIEW_ONLY_NO_INSTALL'||
  !Number.isSafeInteger(nowMs)||!Number.isSafeInteger(a.issuedAtMs)||
  !Number.isSafeInteger(a.expiresAtMs)||a.issuedAtMs>nowMs||
  nowMs-a.issuedAtMs>300000||a.expiresAtMs<=nowMs||
  a.expiresAtMs-a.issuedAtMs>3600000||a.receiverAutostart!==false||
  a.obsoleteTaskEnabled!==false||a.authorityTransfer!==false)
  return {state:'HOLD',reason:'QL467_ENROLLMENT_MISMATCH_OR_EXPIRED',workerInstalled:false};
 return {state:'SIGNED_SOURCE_REVIEW_ONLY',workerInstalled:false,
  bootWitnessVerified:false,receiverOffVerified:false,autostartAuthorized:false,
  enrollmentDigest:sha(JSON.stringify(a))};
}
function privateDir(path){
 if(typeof path!=='string'||!isAbsolute(path)||path.split(/[\\/]/).includes('..'))throw Error('QL467_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(path);mkdirSync(root,{recursive:true,mode:0o700});
 const s=lstatSync(root);if(s.isSymbolicLink()||!s.isDirectory()||(s.mode&0o077))throw Error('QL467_PRIVATE_DIRECTORY_PERMISSIONS');
 return root;
}
/**
 * Makes a private durable read-only receipt store, not a customer database.
 * No PII is accepted; receipt is signed before fsync write-once.
 */
export function createQl467LocalSink({directory,sourceIssuerPin,ackPrivateKey,tenantId,workspaceId,
 tlsClientLeafSha256,now=()=>Date.now()}={}){
 const root=privateDir(directory);
 const publicKey=validKey(sourceIssuerPin);
 if(!publicKey||!ID.test(tenantId??'')||!ID.test(workspaceId??'')||
  !HEX.test(tlsClientLeafSha256??''))throw Error('QL467_PINNED_SOURCE_SCOPE_REQUIRED');
 let signer;
 try{signer=createPrivateKey(ackPrivateKey);
  if(signer.asymmetricKeyType!=='ed25519')throw Error('bad key');
 }catch{throw Error('QL467_PRIVATE_ACK_SIGNER_REQUIRED')}
 function read(filename){
  let fd;try{fd=openSync(filename,constants.O_RDONLY|constants.O_NOFOLLOW)}
  catch(e){if(e.code==='ENOENT')return null;throw e}
  try{const st=fstatSync(fd);if(!st.isFile()||(st.mode&0o077)||st.size>4096)throw Error('QL467_DURABLE_RECEIPT_UNSAFE');
   const raw=readFileSync(fd,'utf8'),parsed=JSON.parse(raw);
   if(!shapes(parsed,['requestDigest','ack'])||!HEX.test(parsed.requestDigest??'')||
    !validSignature(parsed.ack,createPublicKey(signer).export({type:'spki',format:'der'}).toString('base64'),
      ['schema','messageId','eventId','tenantId','workspaceId','issuer','audience','sourceDigest','receivedAtMs','disposition','authorityTransfer']))
    throw Error('QL467_DURABLE_RECEIPT_TAMPERED');
   return parsed;
  }finally{closeSync(fd)}
 }
 function write(filename,value){
  const fd=openSync(filename,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  try{writeFileSync(fd,JSON.stringify(value));fsyncSync(fd)}finally{closeSync(fd)}
  const d=openSync(root,constants.O_RDONLY);try{fsyncSync(d)}finally{closeSync(d)}
 }
 function receive({envelope,clientAuthorized,clientLeafSha256,actualPeerIssuerPin}={}){
  if(clientAuthorized!==true||!eql(clientLeafSha256,tlsClientLeafSha256))
   return reply(401,'QL467_MTLS_PEER_NOT_VERIFIED');
  if(actualPeerIssuerPin!==sourceIssuerPin||!validSignature(envelope,sourceIssuerPin,fields))
   return reply(401,'QL467_PINNED_ED25519_SIGNATURE_REQUIRED');
  const e=envelope.payload,t=now();
  if(e.schema!==QL467_SCHEMA||!['1.0','1.1'].includes(e.protocolVersion)||
   !ID.test(e.messageId??'')||!ID.test(e.eventId??'')||
   e.issuer!=='rosevear-ai-hub'||e.audience!=='rosevear-comms-hub'||
   e.tenantId!==tenantId||e.workspaceId!==workspaceId||
   !['status.read-only','incident.read-only'].includes(e.eventType)||
   !HEX.test(e.payloadSha256??'')||e.dataClass!=='NONPERSONAL'||
   e.authorityTransfer!==false||!Number.isSafeInteger(t)||
   !Number.isSafeInteger(e.issuedAtMs)||!Number.isSafeInteger(e.expiresAtMs)||
   e.issuedAtMs>t||t-e.issuedAtMs>300000||e.expiresAtMs<=t||
   e.expiresAtMs-e.issuedAtMs>300000)
   return reply(422,'QL467_SCOPE_EXPIRY_OR_DATA_CLASS_DENIED');
  const requestDigest=sha(JSON.stringify(envelope));
  const file=join(root,sha(JSON.stringify([tenantId,workspaceId,e.messageId]))+'.json');
  try{
   const old=read(file);
   if(old)return old.requestDigest===requestDigest
     ?reply(200,'QL467_IDEMPOTENT_REPLAY',old.ack)
     :reply(409,'QL467_REPLAY_PAYLOAD_CONFLICT');
   const payload={schema:QL467_ACK_SCHEMA,messageId:e.messageId,eventId:e.eventId,
    tenantId,workspaceId,issuer:'rosevear-comms-hub',audience:'rosevear-ai-hub',
    sourceDigest:requestDigest,receivedAtMs:t,disposition:'RECEIVED',
    authorityTransfer:false};
   const ack={payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),signer).toString('base64')};
   write(file,{requestDigest,ack});
   const confirmed=read(file);
   return confirmed?.requestDigest===requestDigest?reply(202,'QL467_DURABLE_READ_ONLY_ACK',ack)
    :reply(503,'QL467_WRITE_READBACK_NOT_CONFIRMED');
  }catch(e){return reply(503,'QL467_RECEIPT_STORE_UNAVAILABLE_OR_TAMPERED')}
 }
 return Object.freeze({receive,route:QL467_ROUTE,
  status:'PRIVATE_ADAPTER_SOURCE_ONLY_NOT_LISTENING',writesAllowed:'SIGNED_AUDIT_RECEIPT_ONLY'});
}
/** An unbound HTTPS server; caller must separately implement verified owner-controlled launch.
 * No auto-listen, no Windows installer and no public Worker route are created. */
export function createQl467UnboundHttpsServer({tlsOptions,sink}={}){
 if(!sink||typeof sink.receive!=='function'||!tlsOptions?.ca||!tlsOptions?.cert||!tlsOptions?.key)
  throw Error('QL467_PRIVATE_TLS_OPTIONS_REQUIRED');
 const server=createServer({...tlsOptions,requestCert:true,rejectUnauthorized:true,minVersion:'TLSv1.3'},
  async(req,res)=>{
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
   if(req.url!==QL467_ROUTE||req.method!=='POST'){res.writeHead(404);res.end('{"state":"HOLD","reason":"QL467_UNROUTED"}');return;}
   if(!req.socket.authorized||!req.socket.getPeerCertificate?.(true)?.raw){
    res.writeHead(401);res.end('{"state":"HOLD","reason":"QL467_MTLS_REQUIRED"}');return;}
   const peer=req.socket.getPeerCertificate(true).raw;
   let raw='';for await(const chunk of req){raw+=chunk.toString('utf8');
    if(Buffer.byteLength(raw)>8192){res.writeHead(413);res.end('{"state":"HOLD","reason":"QL467_BODY_TOO_LARGE"}');return;}}
   let envelope;try{envelope=JSON.parse(raw)}catch{res.writeHead(400);res.end('{"state":"HOLD","reason":"QL467_INVALID_JSON"}');return;}
   // Issuer pin comes ONLY from owner-enrolled server trust configuration,
   // never from request headers, body, forwarded certs or peer self-assertion.
   const result=sink.receive({envelope,clientAuthorized:req.socket.authorized,
    clientLeafSha256:sha(peer),actualPeerIssuerPin:tlsOptions.pinnedSourceIssuerPin});
   res.writeHead(result.httpStatus);res.end(JSON.stringify(result.body));
  });
 return server;
}
/** Signed boot/ACK packages are REVIEW material only, never a live authorization. */
export function assessQl467OriginalHostAcceptance({workerEnrollment,bootWitness,peerAck,independentAudit}={}){
 return {state:'HOLD',reason:'QL467_ORIGINAL_HOST_PHYSICAL_BOOT_AND_PEER_ACK_NOT_INDEPENDENTLY_ACCEPTED',
  workerEnrollmentSourceReview:workerEnrollment?.state==='SIGNED_SOURCE_REVIEW_ONLY',
  submittedBootWitness:Boolean(bootWitness),submittedPeerAck:Boolean(peerAck),
  submittedIndependentAudit:Boolean(independentAudit),
  actualHostRunVerified:false,liveMtlsVerified:false,independentAckVerified:false,
  privateReceiver:'OFF_OR_UNKNOWN_NOT_WITNESSED',hostRebootAuthorized:false};
}
