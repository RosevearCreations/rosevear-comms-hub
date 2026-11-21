/**
 * QL-480 — Private, durable, brand/tenant-scoped operator case adapter.
 *
 * Source-signed events open exactly one case per episode; recoveries are
 * technical observations and require independently signed operator closure.
 * Store: append-only fsync journal, digest chain, owner-only filesystem.
 * No public receiver, customer records, provider sends, task or autostart.
 */
import {createHash,createPublicKey,verify,timingSafeEqual} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,fstatSync,readFileSync,
 writeSync,fsyncSync,unlinkSync,constants} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';

export const QL480_SOURCE_SCHEMA='rosevear.comms.ql480.scoped-source-event.v1';
export const QL480_OPERATOR_SCHEMA='rosevear.comms.ql480.private-operator-command.v1';
export const QL480_READ_SCHEMA='rosevear.comms.ql480.private-case-read.v1';
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/,ID=/^[a-zA-Z0-9_-]{8,96}$/;
const SCOPE=/^[a-z][a-z0-9_-]{2,63}$/;
const SOURCES=new Set(['yard-workers','icamp']);
const SOURCE_FIELDS=['schema','eventId','sourceApp','environment','tenantId',
 'episodeId','kind','sequence','sourceRevision','sourceRecordId',
 'receiptDigest','observedAtMs','correlationId','causationId','classification'];
const OP_FIELDS=['schema','commandId','action','operatorId','sourceApp',
 'environment','tenantId','episodeId','intentKey','evidenceDigest',
 'occurredAtMs','disposition'];
const READ_FIELDS=['schema','requestId','operatorId','sourceApp',
 'environment','tenantId','episodeId','requestedAtMs'];
const exact=(x,fields)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const digest=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&
 timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const stopped=(reason)=>({state:'HOLD',reason,dispatch:'OFF',
 customerDeliveryVerified:false,productionAcceptance:false});
const scopeKey=p=>[p.sourceApp,p.environment,p.tenantId,p.episodeId].join('|');
const scopeValid=p=>p&&SOURCES.has(p.sourceApp)&&
 ['SIMULATION','PRIVATE_STAGING'].includes(p.environment)&&
 SCOPE.test(p.tenantId??'')&&ID.test(p.episodeId??'');
function publicKey(pin){
 try{
  if(typeof pin!=='string'||pin.length>512)return null;
  const b=Buffer.from(pin,'base64');
  if(b.toString('base64')!==pin)return null;
  const k=createPublicKey({key:b,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'?k:null;
 }catch{return null}
}
function signed(env,pin,fields){
 try{return exact(env,['payload','signature'])&&exact(env.payload,fields)&&
   typeof env.signature==='string'&&/^[A-Za-z0-9+/]{86}==$/.test(env.signature)&&
   Boolean(publicKey(pin))&&verify(null,Buffer.from(JSON.stringify(env.payload)),
     publicKey(pin),Buffer.from(env.signature,'base64'));
 }catch{return false}
}
function ensurePrivateDir(path){
 if(typeof path!=='string'||!isAbsolute(path)||path.split(/[\\/]/).includes('..'))
  throw Error('QL480_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const p=resolve(path);
 mkdirSync(p,{recursive:true,mode:0o700});
 const stat=lstatSync(p);
 if(!stat.isDirectory()||stat.isSymbolicLink()||
    (process.platform!=='win32'&&(stat.mode&0o077)))
   throw Error('QL480_OWNER_ONLY_DIRECTORY_REQUIRED');
 return p;
}
function openRead(path){
 let fd;
 try{fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW)}
 catch(e){if(e.code==='ENOENT')return null;throw e}
 return fd;
}
function validateFile(fd){
 const stat=fstatSync(fd);
 if(!stat.isFile()||stat.size>1024*1024||
    (process.platform!=='win32'&&(stat.mode&0o077)))
  throw Error('QL480_PRIVATE_JOURNAL_UNSAFE_OR_TOO_LARGE');
}
function validTime(time,now){return Number.isSafeInteger(time)&&time>0&&time<=now&&
 now-time<=7*24*3600*1000}
function sourceValid(env,pin,now,historical=false){
 const p=env?.payload;
 return signed(env,pin,SOURCE_FIELDS)&&p.schema===QL480_SOURCE_SCHEMA&&
 scopeValid(p)&&ID.test(p.eventId??'')&&
 ['HEARTBEAT_MISSED','HEARTBEAT_RECOVERED'].includes(p.kind)&&
 Number.isSafeInteger(p.sequence)&&p.sequence>0&&p.sequence<=1000000000&&
 SHA.test(p.sourceRevision??'')&&ID.test(p.sourceRecordId??'')&&
 HEX.test(p.receiptDigest??'')&&Number.isSafeInteger(p.observedAtMs)&&
 p.observedAtMs>0&&p.observedAtMs<=now&&
 (historical||now-p.observedAtMs<=7*24*3600*1000)&&
 ID.test(p.correlationId??'')&&ID.test(p.causationId??'')&&
 p.classification==='NON_SENSITIVE_SCOPED_EXCEPTION';
}
function operatorValid(env,pin,now,historical=false){
 const p=env?.payload;
 return signed(env,pin,OP_FIELDS)&&p.schema===QL480_OPERATOR_SCHEMA&&
 scopeValid(p)&&ID.test(p.commandId??'')&&SCOPE.test(p.operatorId??'')&&
 ['CLOSE_CASE','CLAIM_INTENT','COMPLETE_INTENT'].includes(p.action)&&
 (p.intentKey===null||HEX.test(p.intentKey??''))&&
 (p.evidenceDigest===null||HEX.test(p.evidenceDigest??''))&&
 Number.isSafeInteger(p.occurredAtMs)&&p.occurredAtMs>0&&
 p.occurredAtMs<=now&&(historical||now-p.occurredAtMs<=7*24*3600*1000)&&
 ['OWNER_REVIEW','SIMULATED_PRIVATE_NO_SEND'].includes(p.disposition);
}
function readValid(env,pin,now){
 const p=env?.payload;
 return signed(env,pin,READ_FIELDS)&&p.schema===QL480_READ_SCHEMA&&
 scopeValid(p)&&ID.test(p.requestId??'')&&SCOPE.test(p.operatorId??'')&&
 Number.isSafeInteger(p.requestedAtMs)&&p.requestedAtMs<=now&&
 now-p.requestedAtMs<=60000;
}
function newIntent(caseId,kind,eventId,atMs){
 return {intentKey:digest([caseId,kind,eventId]),kind,
   createdAtMs:atMs,status:'PENDING',attempts:0,nextRetryAtMs:atMs,
   leaseUntilMs:null,lastDisposition:'NOT_SENT'};
}
function project(rows,scope){
 const caseId=digest([scope.sourceApp,scope.environment,scope.tenantId,scope.episodeId]).slice(0,32);
 const p={caseId,...scope,status:'MISSING',lastSequence:0,lastReceiptDigest:null,
  lastSourceRecordId:null,sourceRevision:null,openedAtMs:null,recoveredAtMs:null,
  closedAtMs:null,occurrences:0,historical:0,sourceEvents:new Map(),
  commands:new Map(),intents:new Map(),transitionCount:0};
 for(const x of rows){
  const e=x.entry;
  if(e.kind==='SOURCE'){
   const payload=e.envelope.payload;
   p.sourceEvents.set(payload.eventId,digest(e.envelope));
   if(e.transition==='HISTORICAL'){p.historical++;continue}
   p.lastSequence=payload.sequence;
   p.lastReceiptDigest=payload.receiptDigest;
   p.lastSourceRecordId=payload.sourceRecordId;
   p.sourceRevision=payload.sourceRevision;
   if(e.transition==='OPEN'){
    p.status='OPEN';p.openedAtMs=payload.observedAtMs;
    p.transitionCount++;
   }else if(e.transition==='RECOVERY'){
    p.status='RECOVERY_PENDING_OPERATOR_REVIEW';p.recoveredAtMs=payload.observedAtMs;
    p.transitionCount++;
   }else if(e.transition==='OCCURRENCE'){p.occurrences++}
   if(e.intent){if(p.intents.has(e.intent.intentKey))throw Error('QL480_INTENT_REPLAY');
    p.intents.set(e.intent.intentKey,{...e.intent})}
  }else if(e.kind==='OPERATOR'){
   const command=e.envelope.payload;p.commands.set(command.commandId,digest(e.envelope));
   if(command.action==='CLOSE_CASE'){
    p.status='CLOSED';p.closedAtMs=command.occurredAtMs;p.transitionCount++;
    if(e.intent){if(p.intents.has(e.intent.intentKey))throw Error('QL480_INTENT_REPLAY');
      p.intents.set(e.intent.intentKey,{...e.intent})}
   }else if(command.action==='CLAIM_INTENT'){
    const intent=p.intents.get(command.intentKey);
    if(!intent)throw Error('QL480_CLAIM_UNKNOWN_INTENT_IN_LOG');
    intent.status='LEASED';intent.attempts++;intent.leaseUntilMs=e.leaseUntilMs;
    intent.nextRetryAtMs=e.leaseUntilMs;
   }else if(command.action==='COMPLETE_INTENT'){
    const intent=p.intents.get(command.intentKey);
    if(!intent)throw Error('QL480_FINISH_UNKNOWN_INTENT_IN_LOG');
    intent.status='DISPOSED_SIMULATION';intent.lastDisposition='SIMULATED_PRIVATE_NO_SEND';
    intent.leaseUntilMs=null;intent.nextRetryAtMs=null;
   }
  }else throw Error('QL480_UNKNOWN_JOURNAL_ENTRY');
 }
 return p;
}
function safeProjection(p,rows){
 return {state:'PRIVATE_CASE_REVIEW_ONLY',caseId:p.caseId,scope:{
  sourceApp:p.sourceApp,environment:p.environment,tenantId:p.tenantId,
  episodeId:p.episodeId},caseStatus:p.status,
  lastSequence:p.lastSequence,lastReceiptDigest:p.lastReceiptDigest,
  sourceRecordId:p.lastSourceRecordId,sourceRevision:p.sourceRevision,
  openedAtMs:p.openedAtMs,recoveredAtMs:p.recoveredAtMs,
  closedAtMs:p.closedAtMs,occurrences:p.occurrences,historical:p.historical,
  transitionCount:p.transitionCount,
  pendingIntents:[...p.intents.values()].map(i=>({...i})),
  eventCount:rows.length,lastJournalDigest:rows.at(-1)?.digest??null,
  technicalReceiptState:p.recoveredAtMs?'SOURCE_RECOVERY_RECEIPT_RECORDED':'NOT_RECEIVED',
  operatorAcknowledgementState:p.status==='CLOSED'?'SIGNED_OPERATOR_CLOSURE':'NOT_ACCEPTED',
  providerDeliveryState:'NOT_SENT',
  customerDeliveryVerified:false,productionAcceptance:false,dispatch:'OFF'};
}
/**
 * An adapter instance is an explicitly configured private server-side store.
 * Filesystem effects happen ONLY when ingest/command is called.
 * Never attach this directly to a public route or browser.
 */
export function createQl480PrivateCaseAdapter({directory,sourcePins,operatorPin,
 environment='SIMULATION',now=()=>Date.now()}={}){
 if(!['SIMULATION','PRIVATE_STAGING'].includes(environment)||
   !sourcePins||Object.keys(sourcePins).sort().join(',')!=='icamp,yard-workers'||
   !publicKey(sourcePins['yard-workers'])||!publicKey(sourcePins.icamp)||
   !publicKey(operatorPin)||Object.values(sourcePins).includes(operatorPin)||
   sourcePins.icamp===sourcePins['yard-workers'])
   throw Error('QL480_INDEPENDENT_SIGNER_PINS_REQUIRED');
 const folder=ensurePrivateDir(directory);
 const filename=scope=>join(folder,digest(scopeKey(scope))+'.ndjson');
 function readRows(scope){
  const fd=openRead(filename(scope));if(fd===null)return [];
  try{
   validateFile(fd);
   const raw=readFileSync(fd,'utf8');
   if(!raw)return [];
   if(!raw.endsWith('\n'))throw Error('QL480_TRUNCATED_JOURNAL');
   const lines=raw.trimEnd().split('\n');
   if(lines.length>250)throw Error('QL480_JOURNAL_CAPACITY_REACHED');
   let prev='0'.repeat(64);
   const rows=[];
   for(const line of lines){
    const rec=JSON.parse(line);
    if(!exact(rec,['index','previousDigest','entry','digest'])||
      rec.index!==rows.length+1||rec.previousDigest!==prev||
      !equal(rec.digest,digest({index:rec.index,previousDigest:prev,entry:rec.entry})))
      throw Error('QL480_JOURNAL_CHAIN_TAMPERED');
    const entry=rec.entry,scopeIn=entry.envelope?.payload;
    if(!scopeIn||scopeKey(scopeIn)!==scopeKey(scope))throw Error('QL480_JOURNAL_SCOPE_TAMPERED');
    if(entry.kind==='SOURCE'){
     if(!exact(entry,['kind','transition','envelope','intent'])||
       !['OPEN','OCCURRENCE','RECOVERY','HISTORICAL'].includes(entry.transition)||
       !sourceValid(entry.envelope,sourcePins[scope.sourceApp],now(),true))
      throw Error('QL480_JOURNAL_SOURCE_SIGNATURE_TAMPERED');
    }else if(entry.kind==='OPERATOR'){
     if(!['CLOSE_CASE','CLAIM_INTENT','COMPLETE_INTENT'].includes(scopeIn.action)||
       !operatorValid(entry.envelope,operatorPin,now(),true))
      throw Error('QL480_JOURNAL_OPERATOR_SIGNATURE_TAMPERED');
    }else throw Error('QL480_JOURNAL_UNKNOWN_RECORD');
    rows.push(rec);prev=rec.digest;
   }
   return rows;
  }finally{closeSync(fd)}
 }
 function appendRow(scope,rows,entry){
  if(rows.length>=250)throw Error('QL480_JOURNAL_CAPACITY_REACHED');
  const previousDigest=rows.at(-1)?.digest??'0'.repeat(64);
  const record={index:rows.length+1,previousDigest,entry};
  record.digest=digest(record);
  const path=filename(scope);
  const fd=openSync(path,constants.O_WRONLY|constants.O_APPEND|constants.O_CREAT|constants.O_NOFOLLOW,0o600);
  try{
   validateFile(fd);
   const bytes=Buffer.from(JSON.stringify(record)+'\n');
   let written=0;
   while(written<bytes.length){
     const n=writeSync(fd,bytes,written,bytes.length-written);
     if(n<=0)throw Error('QL480_INCOMPLETE_JOURNAL_APPEND');
     written+=n;
   }
   fsyncSync(fd);
  }finally{closeSync(fd)}
  if(process.platform!=='win32'){
    const dfd=openSync(folder,constants.O_RDONLY);
    try{fsyncSync(dfd)}finally{closeSync(dfd)}
  }
  return record;
 }
 function transact(scope,fn){
  const lock=filename(scope)+'.lock';
  let fd;
  try{fd=openSync(lock,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600)}
  catch{return stopped('QL480_EXCLUSIVE_LOCK_UNAVAILABLE')}
  try{
   const rows=readRows(scope),p=project(rows,scope);
   const result=fn(p,rows,entry=>appendRow(scope,rows,entry));
   return result;
  }catch(e){return stopped(e.message.startsWith('QL480_')?e.message:'QL480_PRIVATE_JOURNAL_UNAVAILABLE')}
  finally{closeSync(fd);unlinkSync(lock)}
 }
 function ingest(envelope){
  const data=envelope?.payload,nowMs=now();
  if(!scopeValid(data)||data.environment!==environment||
     !sourceValid(envelope,sourcePins[data.sourceApp],nowMs))
    return stopped('QL480_SIGNED_NON_SENSITIVE_SOURCE_REQUIRED');
  const scope={sourceApp:data.sourceApp,environment,tenantId:data.tenantId,episodeId:data.episodeId};
  return transact(scope,(p,rows,save)=>{
   const existing=p.sourceEvents.get(data.eventId);
   if(existing)return existing===digest(envelope)?
     {...safeProjection(p,rows),state:'DUPLICATE_SOURCE_EVENT_NO_NEW_EFFECT'}:
     stopped('QL480_EVENT_ID_CONFLICT');
   let transition;
   if(data.sequence<=p.lastSequence)transition='HISTORICAL';
   else if(p.status==='MISSING'){
    if(data.kind!=='HEARTBEAT_MISSED')return stopped('QL480_OUTAGE_MUST_PRECEDE_RECOVERY');
    transition='OPEN';
   }else if(p.status==='CLOSED'){
    return stopped('QL480_NEW_OUTAGE_REQUIRES_NEW_EPISODE');
   }else if(data.kind==='HEARTBEAT_MISSED'){
    if(p.status!=='OPEN')return stopped('QL480_NEW_OUTAGE_REQUIRES_NEW_EPISODE');
    transition='OCCURRENCE';
   }else if(data.kind==='HEARTBEAT_RECOVERED'){
    transition='RECOVERY';
   }else return stopped('QL480_INVALID_SOURCE_EVENT');
   const intent=['OPEN','RECOVERY'].includes(transition)?
     newIntent(p.caseId,transition,data.eventId,nowMs):null;
   const entry={kind:'SOURCE',transition,envelope,intent};
   const written=save(entry);
   const next=project([...rows,{...written}],scope);
   return {...safeProjection(next,[...rows,written]),
     state:transition==='HISTORICAL'?'HISTORICAL_RETAINED_NO_REOPEN':
       'SCOPED_CASE_EVENT_DURABLY_RECORDED',transition,recordDigest:written.digest};
  });
 }
 function command(envelope){
  const data=envelope?.payload,nowMs=now();
  if(!scopeValid(data)||data.environment!==environment||
     !operatorValid(envelope,operatorPin,nowMs))
   return stopped('QL480_SIGNED_PRIVATE_OPERATOR_REQUIRED');
  const scope={sourceApp:data.sourceApp,environment,tenantId:data.tenantId,episodeId:data.episodeId};
  return transact(scope,(p,rows,save)=>{
   const previous=p.commands.get(data.commandId);
   if(previous)return previous===digest(envelope)?
    {...safeProjection(p,rows),state:'DUPLICATE_OPERATOR_COMMAND_NO_EFFECT'}:
    stopped('QL480_OPERATOR_COMMAND_ID_CONFLICT');
   let entry;
   if(data.action==='CLOSE_CASE'){
    if(p.status!=='RECOVERY_PENDING_OPERATOR_REVIEW'||
      !equal(data.evidenceDigest,p.lastReceiptDigest)||
      data.intentKey!==null||data.disposition!=='OWNER_REVIEW'||
      data.occurredAtMs<p.recoveredAtMs)
     return stopped('QL480_VERIFIED_RECOVERY_AND_OWNER_REVIEW_REQUIRED');
    entry={kind:'OPERATOR',envelope,
      intent:newIntent(p.caseId,'CASE_CLOSED',data.commandId,nowMs)};
   }else{
    const intent=p.intents.get(data.intentKey);
    if(!intent||data.evidenceDigest!==null||
      data.disposition!=='SIMULATED_PRIVATE_NO_SEND')
      return stopped('QL480_PRIVATE_INTENT_REQUIRED');
    if(data.action==='CLAIM_INTENT'){
     if(intent.status==='DISPOSED_SIMULATION'||intent.attempts>=3||
       (intent.status==='LEASED'&&intent.leaseUntilMs>nowMs)||
       intent.nextRetryAtMs>nowMs)return stopped('QL480_INTENT_LEASE_OR_RETRY_HOLD');
     entry={kind:'OPERATOR',envelope,leaseUntilMs:nowMs+30000};
    }else if(data.action==='COMPLETE_INTENT'){
     if(intent.status!=='LEASED'||intent.leaseUntilMs<=nowMs)
       return stopped('QL480_ACTIVE_LEASE_REQUIRED');
     entry={kind:'OPERATOR',envelope};
    }else return stopped('QL480_OPERATOR_ACTION_NOT_PERMITTED');
   }
   const written=save(entry);
   const next=project([...rows,written],scope);
   return {...safeProjection(next,[...rows,written]),
    state:'PRIVATE_OPERATOR_TRANSITION_DURABLY_RECORDED',
    action:data.action,recordDigest:written.digest};
  });
 }
 function read(readEnvelope){
  const data=readEnvelope?.payload;
  if(!scopeValid(data)||data.environment!==environment||
    !readValid(readEnvelope,operatorPin,now()))
    return stopped('QL480_SCOPED_OPERATOR_READ_SIGNATURE_REQUIRED');
  const scope={sourceApp:data.sourceApp,environment,tenantId:data.tenantId,episodeId:data.episodeId};
  try{const rows=readRows(scope);return safeProjection(project(rows,scope),rows)}
  catch(e){return stopped(e.message.startsWith('QL480_')?e.message:'QL480_READ_INTEGRITY_HOLD')}
 }
 return Object.freeze({ingest,command,read,mode:environment,
   publicRoute:false,automaticDispatch:false,
   storageKind:'FSYNC_PRIVATE_CHAINED_JOURNAL',
   originalHostCertification:'NOT_OBSERVED'});
}
export const QL480_BOUNDARY=Object.freeze({
 mode:'PRIVATE_OPT_IN_ONLY',autoListen:false,publicRoute:false,
 customerDelivery:false,providerAcceptance:false,
 realSourceJourneys:'NOT_OBSERVED',sourceDeletions:0});
