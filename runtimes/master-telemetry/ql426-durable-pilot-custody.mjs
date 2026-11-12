import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readdirSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync,renameSync,unlinkSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {checkQl425ProtectedPilotContinuity} from './ql425-pilot-health-continuity.mjs';

const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const AGE=60000;
const hold=(reason,receiver='UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED')=>({
 state:'HOLD',reason,receiver,connection:'HOLD',ownerAcceptance:'HOLD',
 runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'
});
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const recent=(s,now)=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&Date.parse(s)<=now&&now-Date.parse(s)<=AGE;
function signed(p,s,spki){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||typeof spki!=='string'||spki.length>512)return false;
  const raw=Buffer.from(spki,'base64');if(raw.toString('base64')!==spki)return false;
  const key=createPublicKey({key:raw,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(p)),key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const scopeValid=s=>exact(s,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 ID.test(s.ceremonyId??'')&&ID.test(s.episodeId??'')&&s.sourceId==='rosevear-ai-hub'&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
const scopeFrom=a=>({ceremonyId:a?.ceremonyId,sourceId:a?.sourceId,episodeId:a?.episodeId,
 sourceRevision:a?.sourceRevision,controllerRevision:a?.controllerRevision});
const emptySeq=()=>Object.fromEntries(MASTERS.map(m=>[m,0]));
const validSeq=s=>exact(s,MASTERS)&&MASTERS.every(m=>Number.isSafeInteger(s[m])&&s[m]>=0);
const entryKeys=['kind','scope','observedAt','evidenceDigest','sequences','incidentId','receiverReadbackDigest','rollbackCheckpointDigest'];
function validEntry(e){
 if(!exact(e,entryKeys)||!scopeValid(e.scope)||!recent(e.observedAt,Date.parse(e.observedAt))||
  !HEX.test(e.evidenceDigest??'')||!validSeq(e.sequences)||!['HEALTH','ROLLBACK','OWNER_ACK'].includes(e.kind))return false;
 if(e.kind==='HEALTH')return e.incidentId===null&&e.receiverReadbackDigest===null&&e.rollbackCheckpointDigest===null&&
  MASTERS.every(m=>e.sequences[m]>0);
 if(e.kind==='ROLLBACK')return ID.test(e.incidentId??'')&&HEX.test(e.receiverReadbackDigest??'')&&e.rollbackCheckpointDigest===null;
 return ID.test(e.incidentId??'')&&HEX.test(e.receiverReadbackDigest??'')&&HEX.test(e.rollbackCheckpointDigest??'');
}
/** Protected Node-only metadata custody. Each checkpoint is immutable; HEAD is fsynced
 * and atomically replaced. Concurrency uses a write-exclusive lock. A crashed transaction
 * or corrupted/missing chain fails closed. External witnessed HEAD digests are still required
 * to detect total or tail deletion by privileged host operators. */
export function openQl426ProtectedCheckpointStore(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))throw Error('PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))throw Error('UNSAFE_CUSTODY_DIRECTORY');
 const files=scope=>{
  if(!scopeValid(scope))throw Error('BAD_PILOT_SCOPE');
  const prefix=hash(scope);
  return {prefix,head:join(root,prefix+'.head'),lock:join(root,prefix+'.lock'),
   path:n=>join(root,prefix+'-'+String(n).padStart(8,'0')+'.json')};
 };
 const read=scope=>{
  const {prefix,head,path}=files(scope);
  const present=readdirSync(root).filter(n=>new RegExp('^'+prefix+'-[0-9]{8}\\.json$').test(n));
  let raw;
  try{raw=readFileSync(head,'utf8');}catch(e){
   if(e.code==='ENOENT'&&present.length===0)return null;
   throw Error('CUSTODY_HEAD_MISSING_OR_UNREADABLE');
  }
  if(raw.length>1024)throw Error('CUSTODY_HEAD_OVERSIZE');
  let h;try{h=JSON.parse(raw);}catch{throw Error('CUSTODY_HEAD_INVALID');}
  if(!exact(h,['schema','count','lastDigest'])||h.schema!=='rosevear.ql426.head.v1'||
   !Number.isSafeInteger(h.count)||h.count<1||h.count>99999999||!HEX.test(h.lastDigest)||present.length!==h.count)
   throw Error('CUSTODY_HEAD_OR_COUNT_TAMPERED');
  let previous=null,record;
  for(let i=1;i<=h.count;i++){
   let data;try{data=readFileSync(path(i),'utf8');}catch{throw Error('CUSTODY_CHAIN_GAP');}
   if(data.length>4096)throw Error('CUSTODY_RECORD_OVERSIZE');
   try{record=JSON.parse(data);}catch{throw Error('CUSTODY_RECORD_INVALID');}
   if(!exact(record,['schema','index','previousDigest','entry','recordDigest'])||
    record.schema!=='rosevear.ql426.checkpoint.v1'||record.index!==i||
    record.previousDigest!==previous||!validEntry(record.entry)||
    JSON.stringify(record.entry.scope)!==JSON.stringify(scope)||
    !HEX.test(record.recordDigest)||hash({schema:record.schema,index:record.index,
      previousDigest:record.previousDigest,entry:record.entry})!==record.recordDigest)
    throw Error('CUSTODY_CHAIN_TAMPERED');
   if(i>1){
    const parentEntry=lastEntry;
    if(parentEntry.kind==='OWNER_ACK'||(parentEntry.kind==='ROLLBACK'&&record.entry.kind!=='OWNER_ACK')||
     (parentEntry.kind==='HEALTH'&&record.entry.kind==='OWNER_ACK'))
     throw Error('INVALID_CUSTODY_TRANSITION');
    if(record.entry.kind==='HEALTH'&&MASTERS.some(m=>record.entry.sequences[m]<=parentEntry.sequences[m]))
     throw Error('CUSTODY_SEQUENCE_REPLAY');
    if(record.entry.kind!=='HEALTH'&&MASTERS.some(m=>record.entry.sequences[m]!==parentEntry.sequences[m]))
     throw Error('CUSTODY_HIGH_WATER_MISMATCH');
   }
   previous=record.recordDigest;
   var lastEntry=record.entry;
  }
  if(h.lastDigest!==previous)throw Error('CUSTODY_HEAD_DIGEST_TAMPERED');
  return record;
 };
 const append=(scope,entry,expectedPreviousDigest)=>{
  if(!scopeValid(scope)||!validEntry(entry)||JSON.stringify(entry.scope)!==JSON.stringify(scope))
   throw Error('INVALID_CHECKPOINT');
  const f=files(scope);
  const fd=openSync(f.lock,'wx',0o600);
  try{
   const prior=read(scope);
   if((prior?.recordDigest??null)!==expectedPreviousDigest)throw Error('CHECKPOINT_CONCURRENT_REPLAY');
   if(prior){
    const prev=prior.entry;
    if(prev.kind==='OWNER_ACK'||(prev.kind==='ROLLBACK'&&entry.kind!=='OWNER_ACK')||
     (prev.kind==='HEALTH'&&entry.kind==='OWNER_ACK'))throw Error('CHECKPOINT_TRANSITION_DENIED');
    if(entry.kind==='HEALTH'&&MASTERS.some(m=>entry.sequences[m]<=prev.sequences[m]))
     throw Error('HEALTH_SEQUENCE_REPLAY');
    if(entry.kind!=='HEALTH'&&MASTERS.some(m=>entry.sequences[m]!==prev.sequences[m]))
     throw Error('HIGH_WATER_MISMATCH');
   }else if(entry.kind==='OWNER_ACK')throw Error('OWNER_ACK_WITHOUT_ROLLBACK');
   const index=(prior?.index??0)+1;
   const record={schema:'rosevear.ql426.checkpoint.v1',index,
    previousDigest:prior?.recordDigest??null,entry};
   record.recordDigest=hash(record);
   const rf=openSync(f.path(index),'wx',0o600);
   try{writeFileSync(rf,JSON.stringify(record));fsyncSync(rf);}finally{closeSync(rf);}
   const temp=join(root,f.prefix+'.head.'+hash(record.recordDigest).slice(0,12)+'.tmp');
   const tf=openSync(temp,'wx',0o600);
   try{writeFileSync(tf,JSON.stringify({schema:'rosevear.ql426.head.v1',count:index,lastDigest:record.recordDigest}));fsyncSync(tf);}finally{closeSync(tf);}
   renameSync(temp,f.head);
   const df=openSync(root,'r');try{fsyncSync(df);}finally{closeSync(df);}
   const reopened=read(scope);
   if(reopened?.recordDigest!==record.recordDigest)throw Error('DURABLE_CHECKPOINT_READBACK_MISMATCH');
   return reopened;
  }finally{closeSync(fd);unlinkSync(f.lock);}
 };
 return Object.freeze({read,append});
}
function baseCheck(accepted,config,store,receiverAdapter,nowMs){
 return scopeValid(scopeFrom(accepted))&&
 accepted?.state==='VERIFIED_THREE_MASTER_ISOLATED_PILOT_ACCEPTANCE'&&
 accepted?.connection==='VERIFIED_CONNECTED_PILOT'&&accepted?.receiver==='ISOLATED_ONE_TEST_ON'&&
 accepted?.ownerAcceptance==='DUAL_SIGNED_FOR_ISOLATED_PILOT'&&accepted.masterCount===3&&
 config?.ql424AcceptanceIndependentlyVerified===true&&config?.protectedOperatorSession===true&&
 config?.independentMasterPinsVerified===true&&config?.independentReceiverPinVerified===true&&
 Number.isSafeInteger(nowMs)&&typeof store?.read==='function'&&typeof store?.append==='function'&&
 typeof receiverAdapter?.disableOneTest==='function'&&typeof receiverAdapter?.readSignedState==='function';
}
function verifiedOff(envelope,accepted,incidentId,pin,nowMs){
 const p=envelope?.payload;
 return exact(envelope,['payload','signature'])&&
 exact(p,['schema','ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision','incidentId','receiverState','observedAt'])&&
 p.schema==='rosevear.ql426.receiver-rollback-readback.v1'&&p.ceremonyId===accepted.ceremonyId&&
 p.sourceId===accepted.sourceId&&p.episodeId===accepted.episodeId&&
 p.sourceRevision===accepted.sourceRevision&&p.controllerRevision===accepted.controllerRevision&&
 p.incidentId===incidentId&&p.receiverState==='OFF'&&recent(p.observedAt,nowMs)&&
 signed(p,envelope.signature,pin);
}
/** One observed cycle. No scheduler or Windows runner is installed. Real QL-424
 * acceptance must first be verified in the protected caller; the browser cannot
 * supply the acceptance or independent trust flags. */
export async function runQl426ProtectedPilotAudit({
 accepted,heartbeats,receiverAdapter,store,incidentId
},{
 masterPins,receiverPin,nowMs,ql424AcceptanceIndependentlyVerified=false,
 protectedOperatorSession=false,independentMasterPinsVerified=false,
 independentReceiverPinVerified=false
}={}){
 const config={ql424AcceptanceIndependentlyVerified,protectedOperatorSession,
  independentMasterPinsVerified,independentReceiverPinVerified};
 if(!baseCheck(accepted,config,store,receiverAdapter,nowMs))
  return hold('INDEPENDENT_QL424_OR_PROTECTED_MONITOR_AUTHORITY_REQUIRED');
 const scope=scopeFrom(accepted);
 let previous;
 try{previous=store.read(scope);}catch{return hold('DURABLE_CUSTODY_READ_UNAVAILABLE');}
 if(previous?.entry.kind==='ROLLBACK'||previous?.entry.kind==='OWNER_ACK')
  return hold('PILOT_ALREADY_ROLLED_BACK_REQUIRES_NEW_CEREMONY','OFF_PENDING_INDEPENDENT_RUNTIME_RECHECK');
 const previousSequences=previous?.entry.sequences??emptySeq();
 const health=await checkQl425ProtectedPilotContinuity({accepted,heartbeats,receiverAdapter,previousSequences},{
  masterPins,independentMasterPinsVerified,protectedOperatorSession,nowMs});
 if(health.state==='VERIFIED_ISOLATED_PILOT_HEALTH_SNAPSHOT'){
  const entry={kind:'HEALTH',scope,observedAt:new Date(nowMs).toISOString(),
   evidenceDigest:health.evidenceDigest,sequences:health.sequences,
   incidentId:null,receiverReadbackDigest:null,rollbackCheckpointDigest:null};
  try{
   const record=store.append(scope,entry,previous?.recordDigest??null);
   return {state:'DURABLE_VERIFIED_ISOLATED_PILOT_CHECKPOINT',connection:'VERIFIED_CONNECTED_PILOT',
    receiver:'ISOLATED_ONE_TEST_ON',runtimeUptime:'SINGLE_SNAPSHOT_NOT_MEASURED_UPTIME',
    ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
    checkpointIndex:record.index,checkpointDigest:record.recordDigest,scope};
  }catch{
   try{await receiverAdapter.disableOneTest({ceremonyId:scope.ceremonyId,reason:'DURABLE_HEALTH_CUSTODY_WRITE_FAILED'});}
   catch{return hold('CUSTODY_WRITE_FAILED_ROLLBACK_UNCONFIRMED');}
   return hold('CUSTODY_WRITE_FAILED_RECEIVER_STATE_NOT_INDEPENDENTLY_VERIFIED');
  }
 }
 // QL-425 has attempted fail-closed disable; only the separately pinned signed
 // receiver OFF readback establishes rollback, not the adapter's acknowledgement.
 if(!ID.test(incidentId??''))return hold('INCIDENT_ID_REQUIRED_FOR_ROLLBACK_READBACK');
 let readback;
 try{readback=await receiverAdapter.readSignedState({ceremonyId:scope.ceremonyId,incidentId});}
 catch{return hold('ROLLBACK_RECEIVER_READBACK_UNAVAILABLE');}
 if(!verifiedOff(readback,accepted,incidentId,receiverPin,nowMs))
  return hold('INDEPENDENT_SIGNED_RECEIVER_OFF_READBACK_INVALID');
 const entry={kind:'ROLLBACK',scope,observedAt:new Date(nowMs).toISOString(),
  evidenceDigest:hash({reason:health.reason,healthState:health.state,scope,incidentId}),
  sequences:previousSequences,incidentId,receiverReadbackDigest:hash(readback.payload),
  rollbackCheckpointDigest:null};
 try{
  const record=store.append(scope,entry,previous?.recordDigest??null);
  return {...hold('PILOT_ROLLED_BACK_PENDING_OWNER_ACK','OFF_VERIFIED_SIGNED_READBACK'),
   state:'DURABLE_VERIFIED_ROLLBACK_INCIDENT',incidentId,
   rollbackCheckpointDigest:record.recordDigest,checkpointIndex:record.index,scope};
 }catch{return hold('SIGNED_OFF_OBSERVED_BUT_INCIDENT_CUSTODY_WRITE_FAILED','OFF_SIGNED_BUT_NOT_DURABLY_RECORDED');}
}
/** Dual-signed human acknowledgement only — never reenables receiver or
 * marks general CONNECTED. The rollback record must already be durable. */
export function acceptQl426OwnerIncident({store,scope,envelope},{
 ownerPin,reviewerPin,independentOwnerCustodyVerified=false,
 independentReviewerCustodyVerified=false,protectedOperatorSession=false,nowMs
}={}){
 if(!independentOwnerCustodyVerified||!independentReviewerCustodyVerified||
  !protectedOperatorSession||!Number.isSafeInteger(nowMs)||ownerPin===reviewerPin||
  typeof store?.read!=='function'||typeof store?.append!=='function'||!scopeValid(scope))
  return hold('INDEPENDENT_OWNER_AND_REVIEWER_AUTHORITY_REQUIRED');
 let previous;
 try{previous=store.read(scope);}catch{return hold('INCIDENT_LEDGER_UNREADABLE');}
 if(previous?.entry.kind!=='ROLLBACK')return hold('DURABLE_VERIFIED_ROLLBACK_REQUIRED');
 const p=envelope?.payload;
 if(!exact(envelope,['payload','ownerSignature','reviewerSignature'])||
  !exact(p,['schema','incidentId','ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision',
   'rollbackCheckpointDigest','action','acceptedAt','ownerId','reviewerId'])||
  p.schema!=='rosevear.ql426.owner-incident-ack.v1'||p.incidentId!==previous.entry.incidentId||
  p.ceremonyId!==scope.ceremonyId||p.sourceId!==scope.sourceId||p.episodeId!==scope.episodeId||
  p.sourceRevision!==scope.sourceRevision||p.controllerRevision!==scope.controllerRevision||
  p.rollbackCheckpointDigest!==previous.recordDigest||p.action!=='ACKNOWLEDGE_VERIFIED_ISOLATED_ROLLBACK'||
  !PERSON.test(p.ownerId??'')||!PERSON.test(p.reviewerId??'')||p.ownerId===p.reviewerId||
  !recent(p.acceptedAt,nowMs)||!signed(p,envelope.ownerSignature,ownerPin)||
  !signed(p,envelope.reviewerSignature,reviewerPin))
  return hold('DUAL_SIGNED_OWNER_INCIDENT_ACK_REJECTED','OFF_VERIFIED_SIGNED_READBACK');
 const entry={kind:'OWNER_ACK',scope,observedAt:new Date(nowMs).toISOString(),
  evidenceDigest:hash(p),sequences:previous.entry.sequences,
  incidentId:p.incidentId,receiverReadbackDigest:previous.entry.receiverReadbackDigest,
  rollbackCheckpointDigest:previous.recordDigest};
 try{
  const record=store.append(scope,entry,previous.recordDigest);
  return {...hold('OWNER_ACK_RECORDED_NEW_CEREMONY_REQUIRED','OFF_VERIFIED_SIGNED_READBACK'),
   state:'DURABLE_DUAL_SIGNED_OWNER_INCIDENT_ACK',
   incidentId:p.incidentId,ackCheckpointDigest:record.recordDigest,checkpointIndex:record.index};
 }catch{return hold('OWNER_ACK_CUSTODY_REPLAY_OR_WRITE_FAILED','OFF_VERIFIED_SIGNED_READBACK');}
}
