import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const MAX_AGE=60000;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hold=(reason,receiver='UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED')=>({
 state:'HOLD',reason,receiver,connection:'HOLD',ownerAcceptance:'HOLD',
 runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'
});
const iso=t=>typeof t==='string'&&Number.isFinite(Date.parse(t))&&new Date(Date.parse(t)).toISOString()===t;
const fresh=(t,now)=>iso(t)&&Number.isSafeInteger(now)&&Date.parse(t)<=now&&now-Date.parse(t)<=MAX_AGE;
function signed(payload,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
     typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const key=createPublicKey({key:der,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(payload)),
   key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const validScope=s=>exact(s,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 ID.test(s.ceremonyId??'')&&ID.test(s.episodeId??'')&&s.sourceId==='rosevear-ai-hub'&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
/** Read from both independent *local* durable stores; release code cannot
 * independently verify the QL-427 signatures unless operator does so. */
function snapshot(checkpointStore,closureStore,scope){
 if(!validScope(scope)||typeof checkpointStore?.read!=='function'||typeof closureStore?.read!=='function')
  return null;
 try{
  const checkpoint=checkpointStore.read(scope);
  if(checkpoint?.entry?.kind!=='OWNER_ACK'||!equal(checkpoint.entry.scope,scope)||
   !ID.test(checkpoint.entry.incidentId??'')||!HEX.test(checkpoint.recordDigest??'')||
   !Number.isSafeInteger(checkpoint.index)||checkpoint.index<2)return null;
  const closure=closureStore.read(checkpoint.recordDigest);
  if(closure?.schema!=='rosevear.ql427.recovery-receipt.v1'||
   closure.checkpointDigest!==checkpoint.recordDigest||
   !HEX.test(closure.recordDigest??'')||!HEX.test(closure.payloadDigest??''))return null;
  return {scope,incidentId:checkpoint.entry.incidentId,
   checkpointIndex:checkpoint.index,checkpointDigest:checkpoint.recordDigest,
   closureReceiptDigest:closure.recordDigest,closurePayloadDigest:closure.payloadDigest};
 }catch{return null;}
}
/** Export proposal only: independent off-site anchor has NOT been created.
 * Never export private key material or unsanitized source receipts. */
export function prepareQl428ExternalClosureAnchor({checkpointStore,closureStore,scope},{
 protectedOperatorSession=false,ql427ClosureIndependentlyVerified=false,nowMs
}={}){
 if(!protectedOperatorSession||!ql427ClosureIndependentlyVerified||!Number.isSafeInteger(nowMs))
  return hold('PROTECTED_QL427_CLOSURE_AUTHORITY_REQUIRED');
 const s=snapshot(checkpointStore,closureStore,scope);
 if(!s)return hold('QL426_QL427_LOCAL_CUSTODY_UNAVAILABLE');
 const exportRecord={schema:'rosevear.ql428.external-closure-anchor-export.v1',
  ...s,preparedAt:new Date(nowMs).toISOString()};
 return {...hold('ANCHOR_EXPORT_PREPARED_EXTERNAL_CUSTODY_NOT_VERIFIED',
  'OFF_NOT_FRESHLY_VERIFIED'),
  state:'EXTERNAL_CLOSURE_ANCHOR_EXPORT_PREPARED',
  exportRecord,exportDigest:digest(exportRecord)};
}
/** Independent append-only external store supplies a fixed signed anchor AND
 * separately signed fresh readback bound to a protected nonce. Never infer
 * anchor custody from an upload request or a local file. */
export async function recheckQl428IndependentCustody({
 checkpointStore,closureStore,scope,anchorClient,anchorId,requestId
},{
 anchorPin,readbackPin,expectedExternalStoreId,
 independentAnchorSignerVerified=false,independentReadbackSignerVerified=false,
 independentExternalStoreVerified=false,ql427ClosureIndependentlyVerified=false,
 protectedOperatorSession=false,nowMs
}={}){
 if(!protectedOperatorSession||!ql427ClosureIndependentlyVerified||
  !independentAnchorSignerVerified||!independentReadbackSignerVerified||
  !independentExternalStoreVerified||anchorPin===readbackPin||
  !ID.test(anchorId??'')||!ID.test(requestId??'')||
  !ID.test(expectedExternalStoreId??'')||!Number.isSafeInteger(nowMs)||
  typeof anchorClient?.readSignedAnchor!=='function')
  return hold('INDEPENDENT_EXTERNAL_ANCHOR_AUTHORITY_REQUIRED');
 const local=snapshot(checkpointStore,closureStore,scope);
 if(!local)return hold('LOCAL_CUSTODY_MISSING_OR_TAMPERED');
 let answer;
 try{answer=await anchorClient.readSignedAnchor({
  anchorId,requestId,scope,checkpointDigest:local.checkpointDigest});}
 catch{return hold('REMOTE_ANCHOR_READBACK_UNAVAILABLE');}
 const a=answer?.anchor?.payload, r=answer?.readback?.payload;
 const anchorFields=['schema','scope','incidentId','checkpointIndex','checkpointDigest',
  'closureReceiptDigest','closurePayloadDigest','anchorId','externalStoreId',
  'anchorSequence','anchoredAt'];
 const readbackFields=['schema','scope','anchorId','anchorDigest','requestId',
  'externalStoreId','remoteDurable','remoteSequence','retrievedAt'];
 if(!exact(answer,['anchor','readback'])||
  !exact(answer.anchor,['payload','signature'])||!exact(answer.readback,['payload','signature'])||
  !exact(a,anchorFields)||!exact(r,readbackFields)||
  a.schema!=='rosevear.ql428.external-closure-anchor.v1'||
  !equal(a.scope,scope)||!equal(r.scope,scope)||
  Object.entries(local).some(([k,v])=>k!=='scope'&&a[k]!==v)||
  a.anchorId!==anchorId||a.externalStoreId!==expectedExternalStoreId||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<1||
  !iso(a.anchoredAt)||Date.parse(a.anchoredAt)>nowMs||
  !signed(a,answer.anchor.signature,anchorPin)||
  r.schema!=='rosevear.ql428.external-anchor-readback.v1'||
  r.anchorId!==anchorId||r.externalStoreId!==expectedExternalStoreId||
  r.anchorDigest!==digest(a)||r.requestId!==requestId||
  r.remoteDurable!==true||!Number.isSafeInteger(r.remoteSequence)||
  r.remoteSequence<a.anchorSequence||!fresh(r.retrievedAt,nowMs)||
  Date.parse(r.retrievedAt)<Date.parse(a.anchoredAt)||
  !signed(r,answer.readback.signature,readbackPin))
  return hold('EXTERNAL_ANCHOR_CUSTODY_MISMATCH_OR_SIGNATURE_INVALID');
 // Reopen local heads AFTER independent external I/O to catch concurrent drift.
 const after=snapshot(checkpointStore,closureStore,scope);
 if(!after||!equal(after,local))return hold('LOCAL_CUSTODY_DRIFT_DURING_ANCHOR_READBACK');
 return {...hold('EXTERNAL_CUSTODY_MATCHED_NO_RECEIVER_REENTRY',
  'OFF_NOT_FRESHLY_VERIFIED'),
  state:'INDEPENDENT_EXTERNAL_CUSTODY_MATCHED',scope,
  incidentId:local.incidentId,checkpointDigest:local.checkpointDigest,
  closureReceiptDigest:local.closureReceiptDigest,anchorId,
  externalStoreId:expectedExternalStoreId,
  anchorDigest:digest(a),readbackDigest:digest(r),
  observedAt:r.retrievedAt,requestId};
}
/** One-use, immutable metadata-only supervised re-entry decision receipt.
 * It is NOT a receiver-enable command and is keyed by old closure + new intent. */
export function openQl428ProtectedReentryDecisionStore(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('UNSAFE_REENTRY_CUSTODY_DIRECTORY');
 const path=(closureDigest,reentryId)=>{
  if(!HEX.test(closureDigest??'')||!ID.test(reentryId??''))
   throw Error('INVALID_REENTRY_KEY');
  return join(root,'ql428-'+closureDigest+'-'+reentryId+'.json');
 };
 const read=(closureDigest,reentryId)=>{
  let raw;
  try{raw=readFileSync(path(closureDigest,reentryId),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('REENTRY_DECISION_OVERSIZE');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('REENTRY_DECISION_CORRUPT');}
  if(!exact(rec,['schema','closureReceiptDigest','reentryId','payloadDigest','recordDigest'])||
   rec.schema!=='rosevear.ql428.supervised-reentry-decision.v1'||
   rec.closureReceiptDigest!==closureDigest||rec.reentryId!==reentryId||
   !HEX.test(rec.payloadDigest??'')||
   digest({schema:rec.schema,closureReceiptDigest:rec.closureReceiptDigest,
     reentryId:rec.reentryId,payloadDigest:rec.payloadDigest})!==rec.recordDigest)
   throw Error('REENTRY_DECISION_TAMPERED');
  return rec;
 };
 const claimOnce=(closureDigest,reentryId,payloadDigest)=>{
  if(!HEX.test(payloadDigest??''))throw Error('INVALID_DECISION_PAYLOAD');
  if(read(closureDigest,reentryId))throw Error('DUPLICATE_REENTRY_DECISION');
  const rec={schema:'rosevear.ql428.supervised-reentry-decision.v1',
   closureReceiptDigest:closureDigest,reentryId,payloadDigest};
  rec.recordDigest=digest(rec);
  const fd=openSync(path(closureDigest,reentryId),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dirfd=openSync(root,'r');
  try{fsyncSync(dirfd);}finally{closeSync(dirfd);}
  const reopened=read(closureDigest,reentryId);
  if(reopened?.recordDigest!==rec.recordDigest)throw Error('REENTRY_DECISION_READBACK_FAILED');
  return reopened;
 };
 return Object.freeze({read,claimOnce});
}
/** Invokes real external readback again for this decision, verifies a fresh
 * independently signed OFF state and three separately signed master witnesses.
 * Only records an owner-approved PRECHECK; NEVER activates original host. */
export async function decideQl428SupervisedPilotReentry({
 checkpointStore,closureStore,scope,anchorClient,anchorId,requestId,
 receiverAdapter,reentryId,reports,ownerDecision,decisionStore
},{
 masterPins,receiverPin,ownerPin,reviewerPin,nowMs,
 independentMasterPinsVerified=false,independentReceiverPinVerified=false,
 independentOwnerCustodyVerified=false,independentReviewerCustodyVerified=false,
 ...anchorConfig
}={}){
 if(!independentMasterPinsVerified||!independentReceiverPinVerified||
  !independentOwnerCustodyVerified||!independentReviewerCustodyVerified||
  !Number.isSafeInteger(nowMs)||ownerPin===reviewerPin||
  !ID.test(reentryId??'')||typeof receiverAdapter?.readSignedState!=='function'||
  typeof decisionStore?.claimOnce!=='function'||typeof decisionStore?.read!=='function')
  return hold('SUPERVISED_REENTRY_SIGNER_OR_OPERATOR_AUTHORITY_REQUIRED');
 const custody=await recheckQl428IndependentCustody({
  checkpointStore,closureStore,scope,anchorClient,anchorId,requestId
 },{...anchorConfig,nowMs});
 if(custody.state!=='INDEPENDENT_EXTERNAL_CUSTODY_MATCHED')
  return hold('EXTERNAL_CUSTODY_RECHECK_REQUIRED_BEFORE_REENTRY');
 let receiver;
 try{receiver=await receiverAdapter.readSignedState({
  scope,incidentId:custody.incidentId,
  closureReceiptDigest:custody.closureReceiptDigest,
  anchorDigest:custody.anchorDigest,reentryId,requiredState:'OFF'});}
 catch{return hold('FRESH_ORIGINAL_RECEIVER_OFF_READBACK_UNAVAILABLE');}
 const off=receiver?.payload;
 if(!exact(receiver,['payload','signature'])||
  !exact(off,['schema','scope','incidentId','closureReceiptDigest','anchorDigest',
   'reentryId','receiverState','observedAt'])||
  off.schema!=='rosevear.ql428.pre-reentry-receiver-isolation.v1'||
  !equal(off.scope,scope)||off.incidentId!==custody.incidentId||
  off.closureReceiptDigest!==custody.closureReceiptDigest||
  off.anchorDigest!==custody.anchorDigest||off.reentryId!==reentryId||
  off.receiverState!=='OFF'||!fresh(off.observedAt,nowMs)||
  Date.parse(off.observedAt)<Date.parse(custody.observedAt)||
  !signed(off,receiver.signature,receiverPin))
  return hold('FRESH_SIGNED_RECEIVER_OFF_PRECHECK_FAILED');
 const offDigest=digest(off);
 if(!Array.isArray(reports)||reports.length!==3||!masterPins)
  return hold('THREE_FRESH_SIGNED_MASTER_REENTRY_REPORTS_REQUIRED','OFF_VERIFIED_SIGNED_READBACK');
 const bound=[],seen=new Set();
 for(const report of reports){
  const p=report?.payload;
  if(!exact(report,['payload','signature'])||
    !exact(p,['schema','masterId','scope','incidentId','closureReceiptDigest',
      'anchorDigest','offDigest','reentryId','status','observedAt'])||
    p.schema!=='rosevear.ql428.master-supervised-reentry.v1'||
    !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
    !equal(p.scope,scope)||p.incidentId!==custody.incidentId||
    p.closureReceiptDigest!==custody.closureReceiptDigest||
    p.anchorDigest!==custody.anchorDigest||p.offDigest!==offDigest||
    p.reentryId!==reentryId||
    p.status!=='REENTRY_PRECHECK_ONLY_NEW_QL424_CEREMONY_REQUIRED'||
    !fresh(p.observedAt,nowMs)||
    Date.parse(p.observedAt)<Date.parse(off.observedAt)||
    !signed(p,report.signature,masterPins[p.masterId]))
    return hold('THREE_MASTER_REENTRY_PROOF_REJECTED','OFF_VERIFIED_SIGNED_READBACK');
  seen.add(p.masterId);bound.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))
  return hold('THREE_MASTER_REENTRY_INCOMPLETE','OFF_VERIFIED_SIGNED_READBACK');
 const reportsDigest=digest(bound.slice().sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId)));
 const d=ownerDecision?.payload;
 if(!exact(ownerDecision,['payload','ownerSignature','reviewerSignature'])||
  !exact(d,['schema','scope','incidentId','closureReceiptDigest','anchorDigest',
   'offDigest','reentryId','reportsDigest','action','ownerId','reviewerId','decidedAt'])||
  d.schema!=='rosevear.ql428.owner-supervised-reentry.v1'||
  !equal(d.scope,scope)||d.incidentId!==custody.incidentId||
  d.closureReceiptDigest!==custody.closureReceiptDigest||
  d.anchorDigest!==custody.anchorDigest||d.offDigest!==offDigest||
  d.reentryId!==reentryId||d.reportsDigest!==reportsDigest||
  d.action!=='PREPARE_NEW_SUPERVISED_CEREMONY_KEEP_RECEIVER_OFF'||
  !PERSON.test(d.ownerId??'')||!PERSON.test(d.reviewerId??'')||
  d.ownerId===d.reviewerId||!fresh(d.decidedAt,nowMs)||
  Date.parse(d.decidedAt)<Date.parse(off.observedAt)||
  !signed(d,ownerDecision.ownerSignature,ownerPin)||
  !signed(d,ownerDecision.reviewerSignature,reviewerPin))
  return hold('DUAL_SIGNED_SUPERVISED_OWNER_DECISION_REJECTED','OFF_VERIFIED_SIGNED_READBACK');
 try{
  // Detect local drift again immediately before durable decision commit.
  const s=snapshot(checkpointStore,closureStore,scope);
  if(!s||s.checkpointDigest!==custody.checkpointDigest||
    s.closureReceiptDigest!==custody.closureReceiptDigest)
   return hold('LOCAL_CUSTODY_DRIFT_BEFORE_DECISION','OFF_VERIFIED_SIGNED_READBACK');
  const record=decisionStore.claimOnce(custody.closureReceiptDigest,reentryId,digest({
   scope,incidentId:custody.incidentId,anchorDigest:custody.anchorDigest,
   externalReadbackDigest:custody.readbackDigest,offDigest,reportsDigest,ownerDigest:digest(d)}));
  if(decisionStore.read(custody.closureReceiptDigest,reentryId)?.recordDigest!==record.recordDigest)
   return hold('REENTRY_DECISION_DURABLE_READBACK_FAILED','OFF_VERIFIED_SIGNED_READBACK');
  return {...hold('NEW_ORIGINAL_HOST_QL424_CEREMONY_REQUIRED','OFF_VERIFIED_SIGNED_READBACK'),
   state:'SUPERVISED_REENTRY_PRECHECK_RECORDED_NO_ACTIVATION',
   reentryId,decisionDigest:record.recordDigest,
   anchorDigest:custody.anchorDigest,masterCount:3,
   ownerAcceptance:'DUAL_SIGNED_PRECHECK_ONLY'};
 }catch{return hold('REENTRY_DECISION_REPLAY_OR_STORAGE_FAILURE','OFF_VERIFIED_SIGNED_READBACK');}
}
