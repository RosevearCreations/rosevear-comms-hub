/**
 * QL-478 opt-in private SysOp pilot: real mTLS 1.3 + signed aggregate
 * samples + durable signed ACK. Importing never opens a socket.
 *
 * Never a public Worker route, automatic Windows service, or first-host claim.
 */
import {createHash,createPublicKey,createPrivateKey,sign,verify,timingSafeEqual} from 'node:crypto';
import {createServer} from 'node:https';
import {mkdirSync,lstatSync,openSync,closeSync,readFileSync,writeFileSync,fsyncSync,fstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

export const QL478_ROUTE='/internal/rosevear/sysop/telemetry/v1';
export const QL478_SAMPLE='rosevear.comms.ql478.private-sysop-sample.v1';
export const QL478_ACK='rosevear.comms.ql478.durable-telemetry-ack.v1';
const HEX=/^[a-f0-9]{64}$/, SHA=/^[a-f0-9]{40}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const HOST='DESKTOP-AE894KC';
const SAMPLE_FIELDS=['schema','messageId','host','sourceApp','sourceMainSha',
 'workerScriptSha256','fieldDigest','sampleDigest','sampleId','osBootId',
 'observedAtMs','uptimeSeconds','processCount','dataClass','issuedAtMs',
 'expiresAtMs','authorityTransfer','receiverEnableAuthorized'];
const ACK_FIELDS=['schema','messageId','sampleDigest','fieldDigest','issuer','audience',
 'receivedAtMs','disposition','persistentReadBack','tlsClientLeafSha256','authorityTransfer'];
const digest=x=>createHash('sha256').update(Buffer.isBuffer(x)||typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const hold=(status,reason)=>({httpStatus:status,body:{state:'HOLD',reason},noDispatch:true,receiverActivated:false});
function pinKey(pin){
 try{if(typeof pin!=='string'||pin.length>512)return null;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return null;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'?key:null;
 }catch{return null}
}
function signed(packet,pin,fields){
 return exact(packet,['payload','signature'])&&exact(packet.payload,fields)&&
 typeof packet.signature==='string'&&/^[A-Za-z0-9+/]{86}==$/.test(packet.signature)&&
 Boolean(pinKey(pin))&&verify(null,Buffer.from(JSON.stringify(packet.payload)),
  pinKey(pin),Buffer.from(packet.signature,'base64'));
}
function secureDirectory(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))throw Error('QL478_PRIVATE_DIRECTORY_REQUIRED');
 const p=resolve(directory);
 mkdirSync(p,{recursive:true,mode:0o700});
 const s=lstatSync(p);
 if(!s.isDirectory()||s.isSymbolicLink()||(process.platform!=='win32'&&(s.mode&0o077)))
   throw Error('QL478_PRIVATE_DIRECTORY_PERMISSIONS');
 return p;
}
function readReceipt(filename,receiverPin){
 let fd;
 try{fd=openSync(filename,constants.O_RDONLY|constants.O_NOFOLLOW)}
 catch(e){if(e.code==='ENOENT')return null;throw e}
 try{
  const st=fstatSync(fd);
  if(!st.isFile()||(process.platform!=='win32'&&(st.mode&0o077))||st.size>8192)
   throw Error('QL478_RECEIPT_UNSAFE');
  const x=JSON.parse(readFileSync(fd,'utf8'));
  if(!exact(x,['requestDigest','ack'])||!HEX.test(x.requestDigest??'')||
     !signed(x.ack,receiverPin,ACK_FIELDS))throw Error('QL478_RECEIPT_TAMPERED');
  return x;
 }finally{closeSync(fd)}
}
function writeOnce(folder,filename,x){
 const fd=openSync(filename,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 try{writeFileSync(fd,JSON.stringify(x));fsyncSync(fd)}finally{closeSync(fd)}
 const d=openSync(folder,constants.O_RDONLY);try{fsyncSync(d)}finally{closeSync(d)}
}
export function verifyQl478SignedAck({packet,ack,hostPin,receiverPin,expectedLeafSha256,nowMs=Date.now()}={}){
 if(typeof hostPin!=='string'||typeof receiverPin!=='string'||hostPin===receiverPin||
    !signed(packet,hostPin,SAMPLE_FIELDS)||!signed(ack,receiverPin,ACK_FIELDS))
    return {state:'HOLD',reason:'QL478_ACK_SIGNATURE_REQUIRED'};
 const e=packet.payload,a=ack.payload;
 if(a.schema!==QL478_ACK||a.messageId!==e?.messageId||
    !same(a.sampleDigest,e?.sampleDigest)||!same(a.fieldDigest,e?.fieldDigest)||
    !same(a.tlsClientLeafSha256,expectedLeafSha256)||
    a.issuer!=='rosevear-comms-hub'||a.audience!=='rosevear-comms-hub'||
    a.disposition!=='RECEIVED_READ_ONLY'||a.persistentReadBack!==true||
    a.authorityTransfer!==false||
    !Number.isSafeInteger(a.receivedAtMs)||a.receivedAtMs>nowMs||
    nowMs-a.receivedAtMs>300000||a.receivedAtMs<e.issuedAtMs)
  return {state:'HOLD',reason:'QL478_ACK_BINDING_OR_FRESHNESS_INVALID'};
 return {state:'SIGNED_DURABLE_ACK_REVIEW_HELD',messageId:a.messageId,
  ackDigest:digest(ack),sourceMainSha:e.sourceMainSha,fieldDigest:a.fieldDigest,
  peerReceiptAuthenticClaim:true,physicalFirstAckCertified:false};
}
/**
 * Trust is owner-enrolled in the constructor; no header may supply pins.
 * Transport request params are filled ONLY by the mTLS HTTPS adapter.
 */
export function createQl478PrivateSink({directory,hostIssuerPin,receiverPrivateKey,
  expectedField,clientLeafSha256,now=()=>Date.now()}={}){
 if(!expectedField||expectedField.state!=='FIELD_EXPORT_REVIEW_HELD'||
   !SHA.test(expectedField.sourceMainSha??'')||
   !HEX.test(expectedField.fieldDigest??'')||!HEX.test(expectedField.sampleDigest??'')||
   !pinKey(hostIssuerPin)||!HEX.test(clientLeafSha256??''))throw Error('QL478_OWNER_ENROLLED_SOURCE_FIELD_REQUIRED');
 let signer;
 try{signer=receiverPrivateKey?.type==='private'?receiverPrivateKey:createPrivateKey(receiverPrivateKey);
  if(signer.asymmetricKeyType!=='ed25519')throw Error('Invalid signer');
 }catch{throw Error('QL478_PRIVATE_ACK_SIGNER_REQUIRED')}
 const receiverPin=createPublicKey(signer).export({type:'spki',format:'der'}).toString('base64');
 if(receiverPin===hostIssuerPin)throw Error('QL478_DISTINCT_KEYS_REQUIRED');
 const directoryPath=secureDirectory(directory);
 function receive({packet,clientAuthorized=false,actualClientLeafSha256,actualHostIssuerPin}={}){
  if(clientAuthorized!==true||!same(actualClientLeafSha256,clientLeafSha256))
   return hold(401,'QL478_MTLS_CLIENT_CERT_REQUIRED');
  if(actualHostIssuerPin!==hostIssuerPin||!signed(packet,hostIssuerPin,SAMPLE_FIELDS))
   return hold(401,'QL478_PINNED_HOST_SIGNATURE_REQUIRED');
  const p=packet.payload,t=now(),field=expectedField,telemetry=field.telemetry;
  if(p.schema!==QL478_SAMPLE||!UUID.test(p.messageId??'')||p.host!==HOST||
    p.sourceApp!=='rosevear-comms-hub'||p.sourceMainSha!==field.sourceMainSha||
    !HEX.test(p.workerScriptSha256??'')||p.workerScriptSha256!==telemetry.workerScriptSha256||
    !same(p.fieldDigest,field.fieldDigest)||!same(p.sampleDigest,field.sampleDigest)||
    p.sampleId!==field.sampleId||p.osBootId!==telemetry.osBootId||
    p.observedAtMs!==telemetry.observedAtMs||p.uptimeSeconds!==telemetry.uptimeSeconds||
    p.processCount!==telemetry.processCount||
    p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorityTransfer!==false||
    p.receiverEnableAuthorized!==false||!Number.isSafeInteger(t)||
    !Number.isSafeInteger(p.issuedAtMs)||!Number.isSafeInteger(p.expiresAtMs)||
    p.issuedAtMs>t||t-p.issuedAtMs>300000||p.expiresAtMs<=t||
    p.expiresAtMs-p.issuedAtMs>300000)
    return hold(422,'QL478_SCOPE_OR_FRESHNESS_OR_SAMPLE_MISMATCH');
  const requestDigest=digest(packet);
  const file=join(directoryPath,digest([p.sourceApp,p.messageId])+'.json');
  try{
   const old=readReceipt(file,receiverPin);
   if(old)return old.requestDigest===requestDigest?
     {httpStatus:200,body:old.ack,noDispatch:true,receiverActivated:false}:
     hold(409,'QL478_REPLAY_PAYLOAD_CONFLICT');
   const payload={schema:QL478_ACK,messageId:p.messageId,
     sampleDigest:p.sampleDigest,fieldDigest:p.fieldDigest,
     issuer:'rosevear-comms-hub',audience:'rosevear-comms-hub',
     receivedAtMs:t,disposition:'RECEIVED_READ_ONLY',
     persistentReadBack:true,tlsClientLeafSha256:clientLeafSha256,
     authorityTransfer:false};
   const ack={payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),signer).toString('base64')};
   writeOnce(directoryPath,file,{requestDigest,ack});
   const confirmation=readReceipt(file,receiverPin);
   return confirmation?.requestDigest===requestDigest?
     {httpStatus:202,body:confirmation.ack,noDispatch:true,receiverActivated:false}:
     hold(503,'QL478_DURABLE_READBACK_FAILED');
  }catch{return hold(503,'QL478_PRIVATE_LEDGER_UNAVAILABLE_OR_TAMPERED')}
 }
 return Object.freeze({receive,route:QL478_ROUTE,receiverPin,
  state:'UNBOUND_PRIVATE_SOURCE_ONLY',writeScope:'SIGNED_READONLY_ACK'});
}
export function createQl478UnboundHttpsServer({sink,tlsOptions}={}){
 if(!sink||typeof sink.receive!=='function'||!tlsOptions?.ca||!tlsOptions?.cert||
   !tlsOptions?.key||!tlsOptions?.pinnedHostIssuerPin)
    throw Error('QL478_MTLS_TRUST_CONFIG_REQUIRED');
 const server=createServer({ca:tlsOptions.ca,cert:tlsOptions.cert,key:tlsOptions.key,
   minVersion:'TLSv1.3',requestCert:true,rejectUnauthorized:true},async(req,res)=>{
   res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
   if(req.url!==QL478_ROUTE||req.method!=='POST'){res.writeHead(404);res.end('{"state":"HOLD"}');return}
   if(!req.socket.authorized||!req.socket.getPeerCertificate?.(true)?.raw){
     res.writeHead(401);res.end('{"state":"HOLD"}');return}
   const cert=req.socket.getPeerCertificate(true).raw;
   let chunks=[],bytes=0;
   try{for await(const part of req){
     bytes+=part.length;
     if(bytes>4096){res.writeHead(413);res.end('{"state":"HOLD","reason":"QL478_SIZE"}');return}
     chunks.push(part);
   }}catch{res.writeHead(400);res.end('{"state":"HOLD"}');return}
   let packet;try{packet=JSON.parse(Buffer.concat(chunks).toString('utf8'))}
   catch{res.writeHead(400);res.end('{"state":"HOLD"}');return}
   const result=sink.receive({packet,clientAuthorized:req.socket.authorized,
     actualClientLeafSha256:digest(cert),actualHostIssuerPin:tlsOptions.pinnedHostIssuerPin});
   res.writeHead(result.httpStatus);res.end(JSON.stringify(result.body));
 });
 return server; // NO LISTEN until explicit owner-controlled local invocation
}
export const QL478_BOUNDARY=Object.freeze({autoListen:false,autoStart:false,
  defaultReceiver:'OFF',cloudWorkerRoute:false,automaticTransmission:false,
  firstOriginalHostAck:'NOT_OBSERVED',physicalWitness:'INDEPENDENT_OUT_OF_BAND',
  sourceDeletes:0,rebootAuthorized:false});
