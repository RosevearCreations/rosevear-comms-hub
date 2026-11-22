/**
 * QL-482 — Protected, opt-in HTTPS case-read API for the private QL-480 journal.
 * Never wired to Cloudflare / a public Vite route. Does not listen at import.
 * TLS client certificate, signed operator read and exact source/tenant RBAC
 * must all agree. Only redacted, integrity-checked case projections leave it.
 */
import {createServer} from 'node:https';
import {createHash,createPublicKey,verify} from 'node:crypto';

export const QL482_PATH='/internal/comms/ql482/cases/read';
export const QL482_WITNESS_SCHEMA='rosevear.comms.ql482.independent-yw-lifecycle-review.v1';
const SHA=/^[a-f0-9]{40}$/, HEX=/^[a-f0-9]{64}$/, ID=/^[a-zA-Z0-9_-]{8,96}$/;
const TENANT=/^[a-z][a-z0-9_-]{2,63}$/;
const FINGERPRINT=/^[a-f0-9]{64}$/;
const SOURCES=new Set(['yard-workers','icamp']);
const READ_FIELDS=['schema','requestId','operatorId','sourceApp','environment','tenantId','episodeId','requestedAtMs'];
const WITNESS_FIELDS=['schema','reviewId','reviewerId','sourceApp','environment','tenantId','episodeId',
 'caseId','operatorId','caseStatus','lastSequence','lastReceiptDigest','lastJournalDigest',
 'sourceRevision','reviewedAtMs','scopeClass','originalHostObserved','customerDeliveryVerified',
 'productionAcceptance','authorityTransfer'];
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>own(x,k));
const fingerprint=s=>typeof s==='string'?s.replaceAll(':','').toLowerCase():'';
const deny=(reason,status=403)=>({ok:false,status,body:{state:'HOLD',reason,
  caseReadAuthorized:false,productionAcceptance:false}});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function publicKey(pin){
 try{
  if(typeof pin!=='string'||pin.length>512)return null;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return null;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'?key:null;
 }catch{return null}
}
function signed(packet,pin,fields){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,fields)||
   !/^[A-Za-z0-9+/]{86}==$/.test(packet.signature??''))return false;
  const key=publicKey(pin);
  return !!key&&verify(null,Buffer.from(JSON.stringify(packet.payload)),key,
   Buffer.from(packet.signature,'base64'));
 }catch{return false}
}
const validScope=p=>p&&SOURCES.has(p.sourceApp)&&
 ['SIMULATION','PRIVATE_STAGING'].includes(p.environment)&&
 TENANT.test(p.tenantId??'')&&ID.test(p.episodeId??'');
function safeCase(result){
 return {state:'PROTECTED_PRIVATE_CASE_READ',caseId:result.caseId,
  scope:{...result.scope},caseStatus:result.caseStatus,
  lastSequence:result.lastSequence,openedAtMs:result.openedAtMs,
  recoveredAtMs:result.recoveredAtMs,closedAtMs:result.closedAtMs,
  sourceRevision:result.sourceRevision,lastJournalDigest:result.lastJournalDigest,
  lastReceiptDigest:result.lastReceiptDigest,technicalReceiptState:result.technicalReceiptState,
  operatorAcknowledgementState:result.operatorAcknowledgementState,
  pendingIntentCount:result.pendingIntents.filter(x=>x.status!=='DISPOSED_SIMULATION').length,
  eventCount:result.eventCount,providerDeliveryState:'NOT_SENT',
  sourceRuntimeVerified:false,customerDeliveryVerified:false,
  productionAcceptance:false,authorityTransfer:false};
}
/**
 * ACL contains certificate SHA256 fingerprints mapped to the ONE actual
 * operator identifier and exact allowlisted source/environment/tenant tuples.
 * No wildcard source, no tenant prefix, no browser authentication inheritance.
 */
export function createQl482ProtectedCaseReader({adapter,operatorPin,acl,now=()=>Date.now()}={}){
 if(!adapter||typeof adapter.read!=='function'||!publicKey(operatorPin)||
  !acl||typeof acl!=='object'||Array.isArray(acl)||Object.keys(acl).length===0)
  throw Error('QL482_PRIVATE_ADAPTER_OPERATOR_AND_ACL_REQUIRED');
 const permissions=new Map();
 for(const [fp,entry] of Object.entries(acl)){
  if(!FINGERPRINT.test(fp)||!exact(entry,['operatorId','role','scopes'])||
   !TENANT.test(entry.operatorId??'')||entry.role!=='case-reader'||
   !Array.isArray(entry.scopes)||entry.scopes.length===0)
    throw Error('QL482_EXACT_CERTIFICATE_ROLE_REQUIRED');
  const allowed=new Set();
  for(const scope of entry.scopes){
   if(!exact(scope,['sourceApp','environment','tenantId'])||
     !SOURCES.has(scope.sourceApp)||
     !['SIMULATION','PRIVATE_STAGING'].includes(scope.environment)||
     !TENANT.test(scope.tenantId??''))
    throw Error('QL482_EXACT_SOURCE_TENANT_RBAC_REQUIRED');
   allowed.add([scope.sourceApp,scope.environment,scope.tenantId].join('|'));
  }
  permissions.set(fp,{operatorId:entry.operatorId,allowed});
 }
 const nonces=new Map();
 function read({authorized,certificateFingerprint256,operatorReadPacket}={}){
  const fp=fingerprint(certificateFingerprint256);
  const role=authorized===true&&permissions.get(fp);
  if(!role)return deny('QL482_MUTUAL_TLS_CLIENT_NOT_ENROLLED',401);
  const p=operatorReadPacket?.payload,t=now();
  if(!validScope(p)||!exact(p,READ_FIELDS)||
   p.schema!=='rosevear.comms.ql480.private-case-read.v1'||
   !ID.test(p.requestId??'')||p.operatorId!==role.operatorId||
   !Number.isSafeInteger(p.requestedAtMs)||p.requestedAtMs>t||
   t-p.requestedAtMs>60000||
   !role.allowed.has([p.sourceApp,p.environment,p.tenantId].join('|')))
   return deny('QL482_SOURCE_SPECIFIC_OPERATOR_SCOPE_DENIED');
  if(!signed(operatorReadPacket,operatorPin,READ_FIELDS))
   return deny('QL482_SIGNED_OPERATOR_READ_REQUIRED',401);
  for(const [key,expiry] of nonces)if(expiry<=t)nonces.delete(key);
  const replayKey=fp+'|'+p.requestId;
  if(nonces.has(replayKey))return deny('QL482_READ_REQUEST_REPLAY_DENIED',409);
  // Strictly bounded memory: refuse new requests rather than discard live nonces.
  if(nonces.size>=2048)return deny('QL482_READ_NONCE_CAPACITY_HOLD',503);
  nonces.set(replayKey,t+60000);
  let result;
  try{result=adapter.read(operatorReadPacket)}
  catch{return deny('QL482_PRIVATE_JOURNAL_UNAVAILABLE',503)}
  if(result?.state!=='PRIVATE_CASE_REVIEW_ONLY')return deny(
   'QL482_SIGNED_JOURNAL_INTEGRITY_READ_FAILED',503);
  if(result?.scope?.sourceApp!==p.sourceApp||
   result?.scope?.environment!==p.environment||
   result?.scope?.tenantId!==p.tenantId||
   result?.scope?.episodeId!==p.episodeId)
   return deny('QL482_ADAPTER_SCOPE_MISMATCH',503);
  if(result.caseStatus==='MISSING')return deny('QL482_CASE_NOT_FOUND',404);
  if(!['OPEN','RECOVERY_PENDING_OPERATOR_REVIEW','CLOSED'].includes(result.caseStatus)||
    !HEX.test(result.lastJournalDigest??'')||
    !HEX.test(result.lastReceiptDigest??'')||
    !SHA.test(result.sourceRevision??''))
   return deny('QL482_PRIVATE_JOURNAL_PROOF_INCOMPLETE',503);
  return {ok:true,status:200,body:safeCase(result)};
 }
 return Object.freeze({read,mode:'PRIVATE_MUTUAL_TLS_CASE_READ_ONLY',
  publicRoute:false,customerWrites:false,automaticDispatch:false});
}
/**
 * A cryptographic independent review of the FINAL closed Yard Workers
 * journal. A synthetic reviewer proves evidence consistency, not that an
 * original business system or original Windows device was observed.
 */
export function verifyQl482YardWorkersLifecycle({adapter,operatorReadPacket,
  witnessPacket,witnessPin,operatorPin,sourcePin,nowMs=Date.now()}={}){
 const p=witnessPacket?.payload;
 if(!publicKey(witnessPin)||!publicKey(sourcePin)||!publicKey(operatorPin)||
  new Set([witnessPin,operatorPin,sourcePin]).size!==3||
  !signed(witnessPacket,witnessPin,WITNESS_FIELDS)||
  !validScope(p)||p.sourceApp!=='yard-workers'||
  p.schema!==QL482_WITNESS_SCHEMA||!ID.test(p.reviewId??'')||
  !TENANT.test(p.reviewerId??'')||p.reviewerId===p.operatorId||
  p.operatorId!==operatorReadPacket?.payload?.operatorId||
  p.caseStatus!=='CLOSED'||!HEX.test(p.lastReceiptDigest??'')||
  !HEX.test(p.lastJournalDigest??'')||!SHA.test(p.sourceRevision??'')||
  !Number.isSafeInteger(p.lastSequence)||p.lastSequence<2||
  !Number.isSafeInteger(p.reviewedAtMs)||p.reviewedAtMs>nowMs||
  nowMs-p.reviewedAtMs>300000||
  p.scopeClass!=='NON_SENSITIVE_SCOPED_EXCEPTION'||
  p.originalHostObserved!==false||p.customerDeliveryVerified!==false||
  p.productionAcceptance!==false||p.authorityTransfer!==false)
  return {state:'HOLD',reason:'QL482_INDEPENDENT_YW_WITNESS_INVALID'};
 const request=operatorReadPacket?.payload;
 if(!request||request.sourceApp!=='yard-workers'||
   request.environment!==p.environment||request.tenantId!==p.tenantId||
   request.episodeId!==p.episodeId)
  return {state:'HOLD',reason:'QL482_YW_CASE_SCOPE_MISMATCH'};
 let result;
 try{result=adapter.read(operatorReadPacket)}catch{return {state:'HOLD',reason:'QL482_JOURNAL_UNAVAILABLE'}}
 if(result.state!=='PRIVATE_CASE_REVIEW_ONLY'||result.caseStatus!=='CLOSED'||
   result.caseId!==p.caseId||result.lastSequence!==p.lastSequence||
   result.lastReceiptDigest!==p.lastReceiptDigest||
   result.lastJournalDigest!==p.lastJournalDigest||
   result.sourceRevision!==p.sourceRevision||
   result.scope.sourceApp!=='yard-workers'||result.scope.tenantId!==p.tenantId||
   result.scope.environment!==p.environment||result.scope.episodeId!==p.episodeId||
   result.technicalReceiptState!=='SOURCE_RECOVERY_RECEIPT_RECORDED'||
   result.operatorAcknowledgementState!=='SIGNED_OPERATOR_CLOSURE'||
   !result.openedAtMs||!result.recoveredAtMs||!result.closedAtMs||
   result.openedAtMs>result.recoveredAtMs||
   result.recoveredAtMs>result.closedAtMs)
  return {state:'HOLD',reason:'QL482_YW_SIGNED_LIFECYCLE_INCOMPLETE_OR_CHANGED'};
 return {state:'INDEPENDENT_SIGNED_PRIVATE_YW_LIFECYCLE_REVIEW_HELD',
  caseId:result.caseId,sourceApp:'yard-workers',tenantId:p.tenantId,
  journalDigest:result.lastJournalDigest,receiptDigest:result.lastReceiptDigest,
  witnessDigest:digest(p),customerDeliveryVerified:false,
  originalHostObserved:false,productionAcceptance:false,
  fieldAcceptance:'HOLD_ORIGINAL_SOURCE_AND_INDEPENDENT_FIELD_WITNESS_REQUIRED'};
}
/** Explicitly constructed private TLS server. No automatic startup or host binding. */
export function createQl482HttpsServer({tlsOptions,reader}={}){
 if(!tlsOptions?.key||!tlsOptions?.cert||!tlsOptions?.ca||
   !reader||typeof reader.read!=='function')
  throw Error('QL482_TLS_KEYS_CA_AND_PROTECTED_READER_REQUIRED');
 const server=createServer({...tlsOptions,requestCert:true,rejectUnauthorized:true,
  minVersion:'TLSv1.3'},async(req,res)=>{
  const headers={'content-type':'application/json; charset=utf-8',
   'cache-control':'no-store, max-age=0','x-content-type-options':'nosniff',
   'referrer-policy':'no-referrer','content-security-policy':"default-src 'none'",
   'strict-transport-security':'max-age=31536000'};
  const respond=(status,body)=>{res.writeHead(status,headers);res.end(JSON.stringify(body))};
  if(req.url!==QL482_PATH||req.method!=='POST'){
   respond(404,{state:'HOLD',reason:'QL482_ROUTE_NOT_AVAILABLE'});return;
  }
  if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){
   respond(415,{state:'HOLD',reason:'QL482_JSON_REQUIRED'});return;
  }
  let size=0,raw='';
  try{
   for await(const chunk of req){
    size+=chunk.length;
    if(size>4096){respond(413,{state:'HOLD',reason:'QL482_BODY_TOO_LARGE'});return}
    raw+=chunk.toString('utf8');
   }
   const body=JSON.parse(raw);
   if(!exact(body,['operatorReadPacket'])){
    respond(400,{state:'HOLD',reason:'QL482_EXACT_REQUEST_REQUIRED'});return}
   const cert=req.socket.getPeerCertificate?.();
   const result=reader.read({authorized:req.socket.authorized===true,
     certificateFingerprint256:cert?.fingerprint256,
     operatorReadPacket:body.operatorReadPacket});
   respond(result.status,result.body);
  }catch{respond(400,{state:'HOLD',reason:'QL482_INVALID_PRIVATE_REQUEST'})}
 });
 return server;
}
export const QL482_BOUNDARY=Object.freeze({
  autoListen:false,cloudflarePublicRoute:false,sourceConnect:false,
  originalHostVerified:false,liveYardWorkersCaseVerified:false,
  icampFieldCaseVerified:false,customerDelivery:'NOT_SENT'});
