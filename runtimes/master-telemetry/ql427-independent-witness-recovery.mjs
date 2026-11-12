import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const AGE_MS=120000;
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const sameJson=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=(reason,receiver='UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED')=>({
 state:'HOLD',reason,receiver,connection:'HOLD',ownerAcceptance:'HOLD',
 runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'
});
function recent(value,nowMs){
 return typeof value==='string'&&Number.isSafeInteger(nowMs)&&Number.isFinite(Date.parse(value))&&
  new Date(Date.parse(value)).toISOString()===value&&Date.parse(value)<=nowMs&&
  nowMs-Date.parse(value)<=AGE_MS;
}
function signed(payload,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
    typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const pub=createPublicKey({key:der,format:'der',type:'spki'});
  return pub.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(payload)),pub,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const validScope=s=>exact(s,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 ID.test(s.ceremonyId??'')&&ID.test(s.episodeId??'')&&s.sourceId==='rosevear-ai-hub'&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
const fields=['schema','scope','checkpointIndex','checkpointDigest','incidentId',
 'ownerAckEvidenceDigest','rollbackCheckpointDigest','preparedAt'];
const wellFormedExport=e=>exact(e,fields)&&e.schema==='rosevear.ql427.checkpoint-witness-export.v1'&&
 validScope(e.scope)&&Number.isSafeInteger(e.checkpointIndex)&&e.checkpointIndex>0&&
 HEX.test(e.checkpointDigest??'')&&ID.test(e.incidentId??'')&&
 HEX.test(e.ownerAckEvidenceDigest??'')&&HEX.test(e.rollbackCheckpointDigest??'')&&
 typeof e.preparedAt==='string';
function readOwnerAck(store,scope){
 if(typeof store?.read!=='function'||!validScope(scope))return null;
 try{
  const r=store.read(scope);
  if(r?.entry?.kind!=='OWNER_ACK'||r.entry.incidentId==null||r.entry.scope?.ceremonyId!==scope.ceremonyId||
   !sameJson(r.entry.scope,scope)||!ID.test(r.entry.incidentId)||!HEX.test(r.recordDigest)||
   !HEX.test(r.entry.evidenceDigest)||!HEX.test(r.entry.rollbackCheckpointDigest)||
   !Number.isSafeInteger(r.index)||r.index<2)return null;
  return r;
 }catch{return null;}
}
/** A sanitized deterministic export proposal only; independent witness has NOT yet
 * verified or signed it. An operator must deliver the digest to a separately pinned
 * external witness through an authenticated channel. */
export function prepareQl427CheckpointWitnessExport({store,scope},{
 protectedOperatorSession=false,ql426OwnerAckIndependentlyVerified=false,nowMs
}={}){
 if(!protectedOperatorSession||!ql426OwnerAckIndependentlyVerified||
  !Number.isSafeInteger(nowMs))return fail('PROTECTED_QL426_OWNER_ACK_AUTHORITY_REQUIRED');
 const r=readOwnerAck(store,scope);
 if(!r)return fail('DURABLE_QL426_OWNER_ACK_UNAVAILABLE_OR_TAMPERED');
 const exportRecord={schema:'rosevear.ql427.checkpoint-witness-export.v1',
  scope,checkpointIndex:r.index,checkpointDigest:r.recordDigest,
  incidentId:r.entry.incidentId,ownerAckEvidenceDigest:r.entry.evidenceDigest,
  rollbackCheckpointDigest:r.entry.rollbackCheckpointDigest,
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'CHECKPOINT_EXPORT_PREPARED_NOT_WITNESSED',exportRecord,
  exportDigest:hash(exportRecord),connection:'HOLD',receiver:'OFF_NOT_FRESHLY_VERIFIED',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
/** Separate independent witness signs the prepared exported digest. The witness
 * pin must originate from independently verified protected custody. */
export function verifyQl427IndependentCheckpointWitness({exportRecord,witnessEnvelope},{
 witnessPin,independentWitnessPinVerified=false,protectedOperatorSession=false,nowMs
}={}){
 if(!protectedOperatorSession||!independentWitnessPinVerified||
  !wellFormedExport(exportRecord)||!recent(exportRecord.preparedAt,nowMs))
  return fail('INDEPENDENT_CHECKPOINT_WITNESS_AUTHORITY_REQUIRED');
 const p=witnessEnvelope?.payload;
 if(!exact(witnessEnvelope,['payload','signature'])||
  !exact(p,['schema','scope','checkpointIndex','checkpointDigest','incidentId',
   'exportDigest','witnessId','witnessedAt'])||
  p.schema!=='rosevear.ql427.independent-checkpoint-witness.v1'||
  !sameJson(p.scope,exportRecord.scope)||p.checkpointIndex!==exportRecord.checkpointIndex||
  p.checkpointDigest!==exportRecord.checkpointDigest||
  p.incidentId!==exportRecord.incidentId||
  p.exportDigest!==hash(exportRecord)||!PERSON.test(p.witnessId??'')||
  !recent(p.witnessedAt,nowMs)||Date.parse(p.witnessedAt)<Date.parse(exportRecord.preparedAt)||
  !signed(p,witnessEnvelope.signature,witnessPin))
  return fail('INDEPENDENT_SIGNED_CHECKPOINT_WITNESS_REJECTED');
 return {state:'INDEPENDENT_CHECKPOINT_WITNESS_VERIFIED',
  scope:exportRecord.scope,incidentId:exportRecord.incidentId,
  checkpointIndex:exportRecord.checkpointIndex,
  checkpointDigest:exportRecord.checkpointDigest,
  witnessDigest:hash(p),witnessId:p.witnessId,witnessedAt:p.witnessedAt,
  connection:'HOLD',receiver:'OFF_NOT_FRESHLY_VERIFIED',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function validWitness(w,record,scope){
 return w?.state==='INDEPENDENT_CHECKPOINT_WITNESS_VERIFIED'&&
  sameJson(w.scope,scope)&&w.incidentId===record.entry.incidentId&&
  w.checkpointIndex===record.index&&w.checkpointDigest===record.recordDigest&&
  HEX.test(w.witnessDigest??'');
}
/** A fresh post-owner-ACK receiver OFF observation, separately signed and bound
 * to the witnessed checkpoint and unique isolation check. It never restarts a receiver. */
export async function checkQl427PostRollbackIsolation({store,scope,witnessResult,receiverAdapter,checkId},{
 receiverPin,independentReceiverPinVerified=false,protectedOperatorSession=false,
 ql426OwnerAckIndependentlyVerified=false,nowMs
}={}){
 if(!protectedOperatorSession||!ql426OwnerAckIndependentlyVerified||
  !independentReceiverPinVerified||!Number.isSafeInteger(nowMs)||!ID.test(checkId??'')||
  typeof receiverAdapter?.readSignedState!=='function')
  return fail('PROTECTED_RECEIVER_ISOLATION_AUTHORITY_REQUIRED');
 const record=readOwnerAck(store,scope);
 if(!record||!validWitness(witnessResult,record,scope))
  return fail('EXTERNAL_WITNESS_OR_DURABLE_QL426_ACK_MISMATCH');
 let readback;
 try{readback=await receiverAdapter.readSignedState({
  ceremonyId:scope.ceremonyId,incidentId:record.entry.incidentId,checkId,
  requiredState:'OFF'});}
 catch{return fail('INDEPENDENT_RECEIVER_ISOLATION_READBACK_UNAVAILABLE');}
 const p=readback?.payload;
 if(!exact(readback,['payload','signature'])||
  !exact(p,['schema','scope','incidentId','checkpointDigest','witnessDigest',
   'checkId','receiverState','observedAt'])||
  p.schema!=='rosevear.ql427.post-rollback-isolation.v1'||!sameJson(p.scope,scope)||
  p.incidentId!==record.entry.incidentId||p.checkpointDigest!==record.recordDigest||
  p.witnessDigest!==witnessResult.witnessDigest||p.checkId!==checkId||
  p.receiverState!=='OFF'||!recent(p.observedAt,nowMs)||
  Date.parse(p.observedAt)<=Date.parse(record.entry.observedAt)||
  Date.parse(p.observedAt)<Date.parse(witnessResult.witnessedAt)||
  !signed(p,readback.signature,receiverPin))
  return fail('FRESH_SIGNED_POST_ROLLBACK_RECEIVER_OFF_NOT_VERIFIED');
 return {state:'SIGNED_POST_ROLLBACK_ISOLATION_VERIFIED',
  scope,incidentId:record.entry.incidentId,checkpointDigest:record.recordDigest,
  witnessDigest:witnessResult.witnessDigest,isolationDigest:hash(p),
  checkId,observedAt:p.observedAt,receiver:'OFF_VERIFIED_SIGNED_READBACK',
  connection:'HOLD',ownerAcceptance:'HOLD',
  runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
/** Dedicated one-use, metadata-only closure receipt store. Local disk integrity
 * is insufficient against privileged tail deletion: send closure digest to an
 * externally independent append-only witness for additional custody assurance. */
export function openQl427ProtectedRecoveryClosureStore(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('UNSAFE_RECOVERY_LEDGER_PERMISSIONS');
 const path=checkpointDigest=>{
  if(!HEX.test(checkpointDigest??''))throw Error('INVALID_CHECKPOINT_DIGEST');
  return join(root,'ql427-'+checkpointDigest+'.json');
 };
 const read=checkpointDigest=>{
  let raw;
  try{raw=readFileSync(path(checkpointDigest),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('RECOVERY_RECEIPT_OVERSIZE');
  let record;try{record=JSON.parse(raw);}catch{throw Error('RECOVERY_RECEIPT_CORRUPT');}
  if(!exact(record,['schema','checkpointDigest','payloadDigest','recordDigest'])||
   record.schema!=='rosevear.ql427.recovery-receipt.v1'||
   record.checkpointDigest!==checkpointDigest||!HEX.test(record.payloadDigest)||
   record.recordDigest!==hash({schema:record.schema,
    checkpointDigest:record.checkpointDigest,payloadDigest:record.payloadDigest}))
   throw Error('RECOVERY_RECEIPT_TAMPERED');
  return record;
 };
 const claimOnce=(checkpointDigest,payloadDigest)=>{
  if(!HEX.test(payloadDigest??''))throw Error('INVALID_CLOSURE_DIGEST');
  if(read(checkpointDigest))throw Error('RECOVERY_CLOSURE_ALREADY_RECORDED');
  const record={schema:'rosevear.ql427.recovery-receipt.v1',
   checkpointDigest,payloadDigest};
  record.recordDigest=hash(record);
  const fd=openSync(path(checkpointDigest),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(record));fsyncSync(fd);}finally{closeSync(fd);}
  const dirFd=openSync(root,'r');
  try{fsyncSync(dirFd);}finally{closeSync(dirFd);}
  const reopened=read(checkpointDigest);
  if(reopened?.recordDigest!==record.recordDigest)
   throw Error('RECOVERY_RECEIPT_READBACK_FAILED');
  return reopened;
 };
 return Object.freeze({read,claimOnce});
}
/** Recovery CLOSEOUT is not pilot reactivation. Requires independent 3-Master
 * signed incident closure and distinct dual-signed human approval. */
export function acceptQl427ThreeMasterRecoveryClosure({
 store,scope,witnessResult,isolationResult,reports,ownerAcceptance,closureStore
},{
 masterPins,ownerPin,reviewerPin,
 independentMasterPinsVerified=false,independentOwnerCustodyVerified=false,
 independentReviewerCustodyVerified=false,protectedOperatorSession=false,nowMs
}={}){
 if(!protectedOperatorSession||!independentMasterPinsVerified||
  !independentOwnerCustodyVerified||!independentReviewerCustodyVerified||
  !Number.isSafeInteger(nowMs)||ownerPin===reviewerPin||
  typeof closureStore?.claimOnce!=='function'||typeof closureStore?.read!=='function')
  return fail('PROTECTED_THREE_MASTER_RECOVERY_AUTHORITY_REQUIRED');
 const record=readOwnerAck(store,scope);
 if(!record||!validWitness(witnessResult,record,scope)||
  isolationResult?.state!=='SIGNED_POST_ROLLBACK_ISOLATION_VERIFIED'||
  !sameJson(isolationResult.scope,scope)||isolationResult.incidentId!==record.entry.incidentId||
  isolationResult.checkpointDigest!==record.recordDigest||
  isolationResult.witnessDigest!==witnessResult.witnessDigest||
  !HEX.test(isolationResult.isolationDigest??'')||
  !recent(isolationResult.observedAt,nowMs))
  return fail('DURABLE_OWNER_ACK_WITNESS_OR_ISOLATION_PROOF_REQUIRED');
 if(!Array.isArray(reports)||reports.length!==3||!masterPins)
  return fail('THREE_INDEPENDENT_SIGNED_RECOVERY_REPORTS_REQUIRED');
 const seen=new Set(),bound=[];
 for(const report of reports){
  const p=report?.payload;
  if(!exact(report,['payload','signature'])||
   !exact(p,['schema','masterId','scope','incidentId','checkpointDigest',
    'witnessDigest','isolationDigest','status','observedAt'])||
   p.schema!=='rosevear.ql427.master-recovery-closure.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   !sameJson(p.scope,scope)||p.incidentId!==record.entry.incidentId||
   p.checkpointDigest!==record.recordDigest||
   p.witnessDigest!==witnessResult.witnessDigest||
   p.isolationDigest!==isolationResult.isolationDigest||
   p.status!=='CONFIRMED_ISOLATED_RECOVERY_CLOSED'||
   !recent(p.observedAt,nowMs)||
   Date.parse(p.observedAt)<Date.parse(isolationResult.observedAt)||
   !signed(p,report.signature,masterPins[p.masterId]))
   return fail('THREE_MASTER_RECOVERY_REPORT_REJECTED');
  seen.add(p.masterId);bound.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return fail('THREE_MASTER_RECOVERY_INCOMPLETE');
 const reportsDigest=hash(bound.slice().sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId)));
 const p=ownerAcceptance?.payload;
 if(!exact(ownerAcceptance,['payload','ownerSignature','reviewerSignature'])||
  !exact(p,['schema','scope','incidentId','checkpointDigest','witnessDigest',
   'isolationDigest','reportsDigest','action','closedAt','ownerId','reviewerId'])||
  p.schema!=='rosevear.ql427.owner-recovery-closure.v1'||
  !sameJson(p.scope,scope)||p.incidentId!==record.entry.incidentId||
  p.checkpointDigest!==record.recordDigest||
  p.witnessDigest!==witnessResult.witnessDigest||
  p.isolationDigest!==isolationResult.isolationDigest||
  p.reportsDigest!==reportsDigest||
  p.action!=='ACCEPT_RECOVERY_CLOSURE_KEEP_RECEIVER_OFF'||
  !PERSON.test(p.ownerId??'')||!PERSON.test(p.reviewerId??'')||
  p.ownerId===p.reviewerId||!recent(p.closedAt,nowMs)||
  Date.parse(p.closedAt)<Date.parse(isolationResult.observedAt)||
  !signed(p,ownerAcceptance.ownerSignature,ownerPin)||
  !signed(p,ownerAcceptance.reviewerSignature,reviewerPin))
  return fail('DUAL_SIGNED_OWNER_RECOVERY_CLOSURE_REJECTED');
 try{
  const saved=closureStore.claimOnce(record.recordDigest,hash({
   scope,incidentId:record.entry.incidentId,witnessDigest:witnessResult.witnessDigest,
   isolationDigest:isolationResult.isolationDigest,reportsDigest,ownerDecisionDigest:hash(p)}));
  if(closureStore.read(record.recordDigest)?.recordDigest!==saved.recordDigest)
   return fail('DURABLE_RECOVERY_CLOSURE_READBACK_FAILED');
  return {...fail('ISOLATED_INCIDENT_CLOSED_NEW_CEREMONY_REQUIRED','OFF_VERIFIED_SIGNED_READBACK'),
   state:'DURABLE_THREE_MASTER_RECOVERY_CLOSURE_RECORDED',
   incidentId:record.entry.incidentId,checkpointDigest:record.recordDigest,
   recoveryClosureDigest:saved.recordDigest,masterCount:3,
   ownerAcceptance:'DUAL_SIGNED_RECOVERY_CLOSURE_ONLY'};
 }catch{return fail('RECOVERY_CLOSURE_REPLAY_OR_STORAGE_UNAVAILABLE','OFF_VERIFIED_SIGNED_READBACK');}
}
