/**
 * QL-504: offline-by-default, independently PINNED Comms-only private
 * metadata receipt worker. Does not listen, send, enrol, schedule, create a
 * service_role client or touch the original QL-340C TEST receiver.
 *
 * The caller supplies a private root, a separately enrolled pinned issuer
 * registry and a privately authenticated service_role RPC gateway.
 * Durable tamper-evident journal: fsync after QUEUED/ATTEMPT/RETRY/COMMITTED/
 * DEAD_LETTER, O_EXCL lock (crashed lock = HOLD, never auto-break).
 * Exactly-once external writes cannot be proven across a crash; the QL503
 * database RPC is idempotent on exact evidence IDs/digests and replay-safe.
 */
import {
  createHash,createPublicKey
} from 'node:crypto';
import {
  openSync,closeSync,readFileSync,writeSync,fsyncSync,unlinkSync,statSync
} from 'node:fs';
import {resolve} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {buildQl503VerifiedImport,persistQl503VerifiedImport}
 from './ql503-durable-verified-import.mjs';

const HEX=/^[a-f0-9]{64}$/, ID=/^[A-Za-z0-9_-]{8,96}$/;
const APPS=new Set(['icamp','yw','devilndove','rosiedazzlers']);
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const deny=reason=>({state:'HOLD',reason,queued:false,committed:false,
  sends:0,customerWrites:false,receiverStarted:false,
  realProviderCertified:false});
function object(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
function fields(x,keys){return object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k))}
const PIN_KEYS=['id','publicKeyPem','validFromMs','validUntilMs'];
function goodPin(p,now){
  if(!fields(p,PIN_KEYS)||!ID.test(p.id??'')||
    !Number.isSafeInteger(p.validFromMs)||!Number.isSafeInteger(p.validUntilMs)||
    p.validFromMs<=0||p.validUntilMs-p.validFromMs>86400000||
    now<p.validFromMs||now>=p.validUntilMs)return false;
  try{return createPublicKey(p.publicKeyPem).asymmetricKeyType==='ed25519'}catch{return false}
}
function fp(p){return createPublicKey(p.publicKeyPem).export({type:'spki',format:'der'}).toString('base64')}
const CONFIG_FIELDS=['approvedBrand','approvedTenantDigest','currentVersion',
  'workerEnabled','sourcePins','providerPins','maxAttempts'];
function validConfig(c,now){
 if(!fields(c,CONFIG_FIELDS)||!APPS.has(c.approvedBrand)||
   !HEX.test(c.approvedTenantDigest??'')||c.workerEnabled!==true||
   !Number.isSafeInteger(c.currentVersion)||c.currentVersion<1||
   !Number.isSafeInteger(c.maxAttempts)||c.maxAttempts<1||c.maxAttempts>4||
   !Array.isArray(c.sourcePins)||!Array.isArray(c.providerPins)||
   !c.sourcePins.length||!c.providerPins.length||
   c.sourcePins.length>3||c.providerPins.length>3)return false;
 const pins=[...c.sourcePins,...c.providerPins];
 if(pins.some(p=>!fields(p,PIN_KEYS)||!ID.test(p.id??'')||
     !Number.isSafeInteger(p.validFromMs)||!Number.isSafeInteger(p.validUntilMs)||
     p.validFromMs<=0||p.validUntilMs-p.validFromMs>86400000||
     p.validUntilMs<=p.validFromMs||
     typeof p.publicKeyPem!=='string'))return false;
 let fingerprints;
 try{fingerprints=pins.map(fp)}catch{return false}
 if(new Set(pins.map(p=>p.id)).size!==pins.length||
    new Set(fingerprints).size!==pins.length)return false;
 if(!c.sourcePins.some(p=>goodPin(p,now))||
    !c.providerPins.some(p=>goodPin(p,now)))return false;
 return true;
}
function approvedRequest(request,config,now){
 if(!fields(request,['sourcePacket','providerPackets','replyPacket'])||
   !object(request.sourcePacket)||!Array.isArray(request.providerPackets)||
   request.providerPackets.length>3||
   (request.replyPacket!==null&&!object(request.replyPacket))||
   JSON.stringify(request).length>18000)return deny('QL504_METADATA_PACKET_BOUNDARY');
 // Explicit independent public-key pins. Rotation means multiple separately
 // approved active pins, not a key supplied by the signed packet.
 for(const source of config.sourcePins.filter(p=>goodPin(p,now)))
 for(const provider of config.providerPins.filter(p=>goodPin(p,now))){
   const serverConfig={
    approvedBrand:config.approvedBrand,
    approvedTenantDigest:config.approvedTenantDigest,
    sourcePublicKeyPem:source.publicKeyPem,
    providerPublicKeyPem:provider.publicKeyPem,
    currentVersion:config.currentVersion,importEnabled:true
   };
   const verdict=buildQl503VerifiedImport({...request,serverConfig,now});
   if(verdict.state==='QL503_VERIFIED_IMPORT_PREPARED_REVIEW_HELD'){
     const p=verdict.args;
     if(p.p_source_app!==config.approvedBrand||
       p.p_tenant_digest!==config.approvedTenantDigest||
       request.sourcePacket.payload.authorityTransfer!==false)
       return deny('QL504_CROSS_TENANT_OR_AUTHORITY');
     return {state:'VERIFIED',verdict,serverConfig,
       sourcePinId:source.id,providerPinId:provider.id};
   }
 }
 return deny('QL504_ORIGINAL_SOURCE_OR_INDEPENDENT_PROVIDER_SIGNATURE_HOLD');
}
function read(file){
 try{
  const stat=statSync(file,{throwIfNoEntry:false});
  if(!stat)return [];
  if(!stat.isFile()||stat.size>1500000)throw Error('QL504_INVALID_JOURNAL');
  const raw=readFileSync(file,'utf8');
  if(!raw)return [];
  if(!raw.endsWith('\n'))throw Error('QL504_TRUNCATED_JOURNAL_HOLD');
  let previous='0'.repeat(64);
  const records=[];
  for(const line of raw.trimEnd().split('\n')){
   const e=JSON.parse(line);
   if(!object(e)||typeof e.digest!=='string')throw Error('QL504_MALFORMED_JOURNAL');
   const {digest,...entry}=e;
   if(entry.seq!==records.length+1||entry.previous!==previous||
     digest!==hash(entry))throw Error('QL504_JOURNAL_HASH_CHAIN_MISMATCH');
   previous=digest;records.push(e);
   if(records.length>120)throw Error('QL504_JOURNAL_CAPACITY_HOLD');
  }
  return records;
 }catch(e){throw Error('QL504_JOURNAL_INTEGRITY_HOLD')}
}
function append(file,existing,data){
 const last=existing.at(-1);
 const entry={seq:existing.length+1,previous:last?.digest??'0'.repeat(64),...data};
 const row={...entry,digest:hash(entry)};
 const fd=openSync(file,'a',0o600);
 try{writeSync(fd,JSON.stringify(row)+'\n');fsyncSync(fd)}finally{closeSync(fd)}
 existing.push(row);
 return row;
}
function recordsById(events){
 const jobs=new Map();
 for(const e of events){
  if(e.kind==='QUEUED'){
   if(jobs.has(e.id))throw Error('QL504_DUPLICATE_JOURNAL_ID');
   jobs.set(e.id,{id:e.id,status:'QUEUED',request:e.request,
     identity:e.identity,attempts:0,dueAt:e.at,reason:null});
  }else{
   const j=jobs.get(e.id);
   if(!j)throw Error('QL504_JOURNAL_ORPHAN');
   if(e.kind==='ATTEMPT'){j.attempts++;j.status='ATTEMPT'}
   if(e.kind==='RETRY'){j.status='RETRY';j.dueAt=e.dueAt;j.reason=e.reason}
   if(e.kind==='COMMITTED'){j.status='COMMITTED';j.reason=null}
   if(e.kind==='DEAD_LETTER'){j.status='DEAD_LETTER';j.reason=e.reason}
  }
 }
 return jobs;
}
const identity=p=>({
 brand:p.p_source_app,tenantDigest:p.p_tenant_digest,
 threadDigest:p.p_thread_digest,messageKey:p.p_message_key,
 version:p.p_message_version,contentDigest:p.p_content_digest,
 sourcePacketDigest:p.p_source_packet_digest,
 evidenceDigests:p.p_events.map(e=>e.digest)
});
function taskId(identity){return hash(identity)}
function withLock(file,action){
 const lockPath=file+'.ql504-lock';
 let lock;
 try{lock=openSync(lockPath,'wx',0o600)}
 catch{return deny('QL504_PRIVATE_JOURNAL_LOCK_HELD')}
 try{return action()}catch{return deny('QL504_JOURNAL_OR_INTEGRITY_HOLD')}
 finally{closeSync(lock);unlinkSync(lockPath)}
}
export function ql504ReadOfflineStatus(file){
 if(typeof file!=='string'||!file)return deny('QL504_PRIVATE_JOURNAL_PATH_REQUIRED');
 try{
  const jobs=recordsById(read(resolve(file)));
  const states={QUEUED:0,ATTEMPT:0,RETRY:0,COMMITTED:0,DEAD_LETTER:0};
  for(const j of jobs.values())states[j.status]++;
  return {state:'OFFLINE_PRIVATE_REVIEW_ONLY',...states,jobCount:jobs.size,
    providerConnected:false,receiverStarted:false,
    customerMessageSent:false,operationalFieldCertified:false};
 }catch{return deny('QL504_PRIVATE_JOURNAL_INTEGRITY_HOLD')}
}
export function ql504Enqueue({journalFile,request,config,now=Date.now()}={}){
 if(typeof journalFile!=='string'||!journalFile||!validConfig(config,now))
  return deny('QL504_OWNER_APPROVED_ACTIVE_PIN_REGISTRY_REQUIRED');
 const reviewed=approvedRequest(request,config,now);
 if(reviewed.state!=='VERIFIED')return reviewed;
 return withLock(resolve(journalFile),()=>{
  const events=read(resolve(journalFile)),jobs=recordsById(events);
  const id=taskId(identity(reviewed.verdict.args));
  const exactIdentity=identity(reviewed.verdict.args);
  for(const j of jobs.values()){
    if(j.identity.brand===exactIdentity.brand&&
      j.identity.tenantDigest===exactIdentity.tenantDigest&&
      j.identity.threadDigest===exactIdentity.threadDigest&&
      j.identity.messageKey===exactIdentity.messageKey&&
      j.identity.version===exactIdentity.version&&
      (j.identity.contentDigest!==exactIdentity.contentDigest||
       j.identity.sourcePacketDigest!==exactIdentity.sourcePacketDigest))
       return deny('QL504_CONFLICTING_IMMUTABLE_MESSAGE_VERSION');
  }
  if(jobs.has(id))return {state:'DUPLICATE_QUEUED_OR_RECORDED',id,
    status:jobs.get(id).status,queued:false,committed:jobs.get(id).status==='COMMITTED',
    sends:0,receiverStarted:false};
  if(jobs.size>=24||events.length>=110)return deny('QL504_QUEUE_CAPACITY_HOLD');
  append(resolve(journalFile),events,{kind:'QUEUED',id,at:now,
    request,identity:exactIdentity});
  return {state:'QL504_DURABLE_QUEUED_NO_SEND',id,queued:true,
    committed:false,providerDeliveredClaimVerified:reviewed.verdict.providerDeliveredClaimVerified,
    sends:0,receiverStarted:false,fieldCertified:false};
 });
}
/** Caller explicitly invokes once. No timer, no network listener. If an
 * independently enrolled private RPC gateway fails, the queue stays durable.
 */
export async function ql504DrainOnce({journalFile,config,rpcGateway,
 now=Date.now()}={}){
 if(typeof journalFile!=='string'||!journalFile||!validConfig(config,now))
  return deny('QL504_ACTIVE_OWNER_PIN_REGISTRY_REQUIRED');
 if(!rpcGateway||typeof rpcGateway.rpc!=='function')
  return deny('QL504_PRIVATE_SERVER_ROLE_GATEWAY_REQUIRED');
 const file=resolve(journalFile),lockPath=file+'.ql504-lock';
 let lock;
 try{lock=openSync(lockPath,'wx',0o600)}
 catch{return deny('QL504_PRIVATE_JOURNAL_LOCK_HELD')}
 try{
  const events=read(file),jobs=recordsById(events);
  const job=[...jobs.values()].find(j=>!['COMMITTED','DEAD_LETTER'].includes(j.status)&&j.dueAt<=now);
  if(!job)return {state:'QL504_NO_DUE_PRIVATE_WORK',sends:0,committed:false};
  const reviewed=approvedRequest(job.request,config,now);
  const verified=reviewed.state==='VERIFIED'&&
    taskId(identity(reviewed.verdict.args))===job.id&&
    hash(identity(reviewed.verdict.args))===hash(job.identity);
  if(!verified){
   append(file,events,{kind:'DEAD_LETTER',id:job.id,at:now,
    reason:'PIN_EXPIRED_REVOKED_PACKET_DRIFT_OR_SCOPE_DENIED'});
   return {state:'QL504_DEAD_LETTER_HOLD',id:job.id,
    reason:'PIN_EXPIRED_REVOKED_PACKET_DRIFT_OR_SCOPE_DENIED',
    sends:0,committed:false};
  }
  const attempts=job.attempts+1;
  append(file,events,{kind:'ATTEMPT',id:job.id,at:now});
  const result=await persistQl503VerifiedImport({...job.request,
    serverConfig:reviewed.serverConfig,rpcGateway,now});
  if(result.state==='QL503_DURABLE_SIGNED_METADATA_REVIEW_HELD'){
   append(file,events,{kind:'COMMITTED',id:job.id,at:now});
   return {state:'QL504_PRIVATE_RPC_COMMITTED_NO_SEND',
    id:job.id,attempts,committed:true,sends:0,
    independentlyObservedDelivery:false,humanAcknowledged:false,
    receiverStarted:false};
  }
  if(attempts>=config.maxAttempts){
   append(file,events,{kind:'DEAD_LETTER',id:job.id,at:now,
    reason:'BOUNDED_SERVER_RPC_FAILURE'});
   return {state:'QL504_DEAD_LETTER_HOLD',id:job.id,attempts,
    reason:'BOUNDED_SERVER_RPC_FAILURE',committed:false,sends:0};
  }
  const dueAt=now+Math.min(8000,1000*(2**(attempts-1)));
  append(file,events,{kind:'RETRY',id:job.id,at:now,dueAt,
    reason:'PRIVATE_RPC_FAILED_NO_DELIVERY_ASSERTION'});
  return {state:'QL504_BOUNDED_RETRY_HELD',id:job.id,attempts,
    dueAt,committed:false,sends:0};
 }catch{return deny('QL504_JOURNAL_OR_SERVER_INTEGRITY_HOLD')}
 finally{closeSync(lock);unlinkSync(lockPath)}
}
