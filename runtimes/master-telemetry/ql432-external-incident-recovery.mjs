import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const AGE_MS=60000;
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const exact=(x,fields)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&fields.every(f=>Object.hasOwn(x,f));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const recent=(s,now)=>typeof s==='string'&&Number.isSafeInteger(now)&&
 Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&
 Date.parse(s)<=now&&now-Date.parse(s)<=AGE_MS;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 receiver:'OFF_PENDING_INDEPENDENT_RECOVERY_REVALIDATION',ownerAcceptance:'HOLD',
 runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signed(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const pub=createPublicKey({key:bytes,format:'der',type:'spki'});
  return pub.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(p)),
   pub,Buffer.from(s,'base64'));
 }catch{return false;}
}
const scopeFrom=a=>({ceremonyId:a?.ceremonyId,sourceId:a?.sourceId,
 episodeId:a?.episodeId,sourceRevision:a?.sourceRevision,
 controllerRevision:a?.controllerRevision});
const validScope=s=>exact(s,['ceremonyId','sourceId','episodeId',
 'sourceRevision','controllerRevision'])&&ID.test(s.ceremonyId??'')&&
 s.sourceId==='rosevear-ai-hub'&&ID.test(s.episodeId??'')&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
function trustedAccepted(accepted,audit){
 const scope=scopeFrom(accepted);
 if(!validScope(scope)||accepted?.state!=='DURABLE_VERIFIED_THREE_MASTER_REENTRY_ISOLATED_PILOT'||
  accepted.connection!=='VERIFIED_CONNECTED_PILOT'||accepted.receiver!=='ISOLATED_ONE_TEST_ON'||
  accepted.masterCount!==3||accepted.ownerAcceptance!=='DUAL_SIGNED_FOR_ISOLATED_PILOT'||
  accepted.slaveGate!=='HOLD_NEXT_MASTER_INTEGRATION_STAGE'||
  !HEX.test(accepted.acceptedRecordDigest??'')||
  typeof audit?.read!=='function')return null;
 try{
  const saved=audit.read('accepted',scope.ceremonyId);
  return saved?.kind==='accepted'&&saved.ceremonyId===scope.ceremonyId&&
   saved.recordDigest===accepted.acceptedRecordDigest?scope:null;
 }catch{return null;}
}
function reconciledCheckpoint(store,scope,acceptedDigest){
 try{
  if(typeof store?.read!=='function')return null;
  const record=store.read(scope),e=record?.entry;
  if(!record||!Number.isSafeInteger(record.index)||record.index<3||
   !HEX.test(record.recordDigest??'')||e?.kind!=='RECONCILED'||
   !equal(e.scope,scope)||e.ql430AcceptedDigest!==acceptedDigest||
   !ID.test(e.incidentId??'')||!HEX.test(e.receiverOffDigest??'')||
   !HEX.test(e.shutdownAckDigest??'')||!HEX.test(e.reportsDigest??'')||
   !HEX.test(e.ownerDecisionDigest??''))return null;
  return record;
 }catch{return null;}
}
/** This export is a proposal, never evidence that a remote anchor exists.
 * A separate independently pinned external anchor and reader must sign readback.
 */
export function prepareQl432IncidentAnchorExport({ql431Store,scope,ql430AcceptedDigest,
 anchorId,challengeNonce},{
 protectedOperatorSession=false,nowMs
}={}){
 if(!protectedOperatorSession||!Number.isSafeInteger(nowMs)||
  !validScope(scope)||!HEX.test(ql430AcceptedDigest??'')||
  !ID.test(anchorId??'')||!ID.test(challengeNonce??''))
  return hold('PRIVATE_INCIDENT_ANCHOR_EXPORT_AUTHORITY_REQUIRED');
 const checkpoint=reconciledCheckpoint(ql431Store,scope,ql430AcceptedDigest);
 if(!checkpoint)return hold('QL431_DURABLE_RECONCILED_INCIDENT_CHECKPOINT_REQUIRED');
 const record={schema:'rosevear.ql432.incident-anchor-export.v1',
  scope,ql430AcceptedDigest,incidentId:checkpoint.entry.incidentId,
  checkpointIndex:checkpoint.index,checkpointDigest:checkpoint.recordDigest,
  receiverOffDigest:checkpoint.entry.receiverOffDigest,
  anchorId,challengeNonce,preparedAt:new Date(nowMs).toISOString()};
 return {state:'EXTERNAL_INCIDENT_ANCHOR_EXPORT_PREPARED_NOT_WITNESSED',
  exportRecord:record,exportDigest:hash(record),connection:'HOLD',
  receiver:'OFF_PENDING_INDEPENDENT_RECOVERY_REVALIDATION',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function verifyAnchorEvidence(exportRecord,readback,opts){
 const {nowMs,anchorPin,readerPin,independentAnchorPinVerified,
  independentReaderPinVerified}=opts;
 if(!independentAnchorPinVerified||!independentReaderPinVerified||
  typeof anchorPin!=='string'||typeof readerPin!=='string'||
  anchorPin===readerPin||!recent(exportRecord?.preparedAt,nowMs))
  return null;
 const a=readback?.anchor?.payload,r=readback?.reader?.payload;
 if(!exact(readback,['anchor','reader'])||
  !exact(readback.anchor,['payload','signature'])||
  !exact(readback.reader,['payload','signature'])||
  !exact(a,['schema','anchorId','challengeNonce','exportDigest','scope',
   'incidentId','checkpointIndex','checkpointDigest','receiverOffDigest',
   'status','anchoredAt'])||
  a.schema!=='rosevear.ql432.external-incident-anchor.v1'||
  a.anchorId!==exportRecord.anchorId||a.challengeNonce!==exportRecord.challengeNonce||
  a.exportDigest!==hash(exportRecord)||!equal(a.scope,exportRecord.scope)||
  a.incidentId!==exportRecord.incidentId||
  a.checkpointIndex!==exportRecord.checkpointIndex||
  a.checkpointDigest!==exportRecord.checkpointDigest||
  a.receiverOffDigest!==exportRecord.receiverOffDigest||
  a.status!=='EXTERNALLY_ANCHORED_IMMUTABLE_CHECKPOINT'||
  !recent(a.anchoredAt,nowMs)||
  Date.parse(a.anchoredAt)<Date.parse(exportRecord.preparedAt)||
  !signed(a,readback.anchor.signature,anchorPin)||
  !exact(r,['schema','anchorId','challengeNonce','exportDigest','anchorDigest',
   'checkpointDigest','status','readAt'])||
  r.schema!=='rosevear.ql432.independent-anchor-readback.v1'||
  r.anchorId!==exportRecord.anchorId||r.challengeNonce!==exportRecord.challengeNonce||
  r.exportDigest!==hash(exportRecord)||r.anchorDigest!==hash(a)||
  r.checkpointDigest!==exportRecord.checkpointDigest||
  r.status!=='INDEPENDENT_EXTERNAL_CHECKPOINT_READBACK_MATCHED'||
  !recent(r.readAt,nowMs)||Date.parse(r.readAt)<Date.parse(a.anchoredAt)||
  !signed(r,readback.reader.signature,readerPin))return null;
 return {externalAnchorDigest:hash(a),readbackDigest:hash(r),
  witnessedAt:r.readAt};
}
function verifiedHostOff(envelope,exportRecord,anchor,opts){
 const p=envelope?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(envelope,['payload','signature'])&&
  exact(p,['schema','hostMachineId','scope','incidentId','challengeNonce',
   'externalAnchorDigest','readbackDigest','receiverState','observedAt'])&&
  p.schema==='rosevear.ql432.original-host-recovery-readback.v1'&&
  p.hostMachineId==='DESKTOP-AE894KC'&&equal(p.scope,exportRecord.scope)&&
  p.incidentId===exportRecord.incidentId&&
  p.challengeNonce===exportRecord.challengeNonce&&
  p.externalAnchorDigest===anchor.externalAnchorDigest&&
  p.readbackDigest===anchor.readbackDigest&&p.receiverState==='OFF'&&
  recent(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(anchor.witnessedAt)&&
  signed(p,envelope.signature,opts.originalHostPin);
}
function verifiedIndependentReceiverOff(envelope,exportRecord,anchor,host,opts){
 const p=envelope?.payload;
 return opts.independentReceiverPinVerified===true&&
  exact(envelope,['payload','signature'])&&
  exact(p,['schema','scope','incidentId','challengeNonce','hostEvidenceDigest',
   'readbackDigest','receiverState','observedAt'])&&
  p.schema==='rosevear.ql432.independent-recovery-receiver.v1'&&
  equal(p.scope,exportRecord.scope)&&p.incidentId===exportRecord.incidentId&&
  p.challengeNonce===exportRecord.challengeNonce&&
  p.hostEvidenceDigest===hash(host.payload)&&p.readbackDigest===anchor.readbackDigest&&
  p.receiverState==='OFF'&&recent(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  signed(p,envelope.signature,opts.receiverPin);
}
function masterRecoveryReports(reports,exportRecord,anchor,receiverDigest,opts,minimumMs){
 if(!Array.isArray(reports)||reports.length!==3||
  opts.independentMasterPinsVerified!==true||!opts.masterPins)return null;
 const seen=new Set(),ordered=[];
 for(const env of reports){
  const p=env?.payload;
  if(!exact(env,['payload','signature'])||
   !exact(p,['schema','masterId','scope','incidentId','checkpointDigest',
    'readbackDigest','receiverOffDigest','status','observedAt'])||
   p.schema!=='rosevear.ql432.master-recovery-review.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   !equal(p.scope,exportRecord.scope)||p.incidentId!==exportRecord.incidentId||
   p.checkpointDigest!==exportRecord.checkpointDigest||
   p.readbackDigest!==anchor.readbackDigest||
   p.receiverOffDigest!==receiverDigest||
   p.status!=='RECONCILED_OFF_NEW_CEREMONY_REQUIRED'||
   !recent(p.observedAt,opts.nowMs)||
   Date.parse(p.observedAt)<minimumMs||
   !signed(p,env.signature,opts.masterPins[p.masterId]))
   return null;
  seen.add(p.masterId);ordered.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 ordered.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {reportsDigest:hash(ordered),
  lastObservedAt:Math.max(...ordered.map(x=>Date.parse(x.observedAt)))};
}
function ownerReview(envelope,exportRecord,anchor,receiverDigest,masters,opts){
 const p=envelope?.payload;
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  typeof opts.ownerPin==='string'&&opts.ownerPin!==opts.reviewerPin&&
  exact(envelope,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','scope','incidentId','checkpointDigest','readbackDigest',
   'receiverOffDigest','reportsDigest','action','ownerId','reviewerId','reviewedAt'])&&
  p.schema==='rosevear.ql432.owner-isolated-continuity-review.v1'&&
  equal(p.scope,exportRecord.scope)&&p.incidentId===exportRecord.incidentId&&
  p.checkpointDigest===exportRecord.checkpointDigest&&
  p.readbackDigest===anchor.readbackDigest&&p.receiverOffDigest===receiverDigest&&
  p.reportsDigest===masters.reportsDigest&&
  p.action==='ACKNOWLEDGE_RECOVERY_ONLY_NEW_ISOLATED_CEREMONY_REQUIRED_KEEP_OFF'&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&recent(p.reviewedAt,opts.nowMs)&&
  Date.parse(p.reviewedAt)>=masters.lastObservedAt&&
  signed(p,envelope.ownerSignature,opts.ownerPin)&&
  signed(p,envelope.reviewerSignature,opts.reviewerPin);
}
/** A metadata-only one-use receipt: no receiver lifecycle methods and no
 * private keys. Local custody must still be independently anchored off-host.
 */
export function openQl432ProtectedRecoveryReviewLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_REVIEW_LEDGER_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('UNSAFE_QL432_REVIEW_DIRECTORY');
 const path=id=>{
  if(!ID.test(id??''))throw Error('INVALID_QL432_INCIDENT_ID');
  return join(root,'ql432-review-'+id+'.json');
 };
 const read=id=>{
  let s;
  try{s=readFileSync(path(id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(s.length>4096)throw Error('QL432_RECORD_OVERSIZE');
  let rec;try{rec=JSON.parse(s);}catch{throw Error('QL432_RECORD_CORRUPT');}
  if(!exact(rec,['schema','incidentId','payloadDigest','recordDigest'])||
   rec.schema!=='rosevear.ql432.owner-review-receipt.v1'||
   rec.incidentId!==id||!HEX.test(rec.payloadDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,incidentId:id,
    payloadDigest:rec.payloadDigest}))throw Error('QL432_REVIEW_RECORD_TAMPERED');
  return rec;
 };
 const claimOnce=(incidentId,payloadDigest)=>{
  if(!HEX.test(payloadDigest??''))throw Error('INVALID_QL432_REVIEW_DIGEST');
  if(read(incidentId))throw Error('QL432_INCIDENT_REVIEW_ALREADY_USED');
  const rec={schema:'rosevear.ql432.owner-review-receipt.v1',
   incidentId,payloadDigest};
  rec.recordDigest=hash(rec);
  const fd=openSync(path(incidentId),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const directoryFd=openSync(root,'r');
  try{fsyncSync(directoryFd);}finally{closeSync(directoryFd);}
  if(read(incidentId)?.recordDigest!==rec.recordDigest)
   throw Error('QL432_REVIEW_RECEIPT_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
/** Original-host supervised read-only decision. A signed anchor + independent
 * readback + signed OFF revalidation + three Masters + dual owners are required.
 * Never resumes QL-431 after shutdown, never enables a receiver, and never
 * promotes a source to general CONNECTED. The QL-431 incident remains terminal.
 */
export async function runQl432OwnerGatedRecoveryReview({
 ql430Acceptance,ql430Audit,ql431Store,reviewLedger,
 anchorId,challengeNonce,externalAnchorAdapter,
 originalHostAdapter,independentReceiverAdapter,
 masterEvidenceProvider,ownerAcceptance
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl430AcceptanceVerified!==true||
  !Number.isSafeInteger(opts.nowMs)||!ID.test(anchorId??'')||
  !ID.test(challengeNonce??'')||
  typeof externalAnchorAdapter?.readSignedAnchor!=='function'||
  typeof originalHostAdapter?.readSignedState!=='function'||
  typeof independentReceiverAdapter?.readSignedState!=='function'||
  typeof masterEvidenceProvider?.readSignedReports!=='function'||
  typeof reviewLedger?.read!=='function'||typeof reviewLedger?.claimOnce!=='function')
  return hold('ORIGINAL_HOST_PROTECTED_RECOVERY_AUTHORITY_REQUIRED');
 const scope=trustedAccepted(ql430Acceptance,ql430Audit);
 if(!scope)return hold('ORIGINAL_QL430_DURABLE_ACCEPTANCE_NOT_VERIFIED');
 const prep=prepareQl432IncidentAnchorExport({
  ql431Store,scope,ql430AcceptedDigest:ql430Acceptance.acceptedRecordDigest,
  anchorId,challengeNonce},{protectedOperatorSession:true,nowMs:opts.nowMs});
 if(prep.state!=='EXTERNAL_INCIDENT_ANCHOR_EXPORT_PREPARED_NOT_WITNESSED')
  return hold('QL431_RECONCILED_INCIDENT_NOT_DURABLY_PRESENT');
 const e=prep.exportRecord;
 if(typeof opts.originalHostPin!=='string'||opts.originalHostPin===opts.receiverPin||
  opts.anchorPin===opts.readerPin||opts.originalHostPin===opts.anchorPin||
  opts.originalHostPin===opts.readerPin||opts.receiverPin===opts.anchorPin||
  opts.receiverPin===opts.readerPin)
  return hold('INDEPENDENT_ORIGINAL_HOST_AND_EXTERNAL_SIGNER_CUSTODY_REQUIRED');
 try{if(reviewLedger.read(e.incidentId))
  return hold('RECOVERY_REVIEW_INCIDENT_ALREADY_USED');}
 catch{return hold('PRIVATE_RECOVERY_REVIEW_LEDGER_UNREADABLE');}
 let anchored;
 try{anchored=await externalAnchorAdapter.readSignedAnchor({
  exportRecord:e,exportDigest:prep.exportDigest,
  anchorId,challengeNonce,checkpointDigest:e.checkpointDigest});}
 catch{return hold('EXTERNAL_ANCHOR_OR_INDEPENDENT_READBACK_UNAVAILABLE');}
 const anchor=verifyAnchorEvidence(e,anchored,opts);
 if(!anchor)return hold('FRESH_INDEPENDENT_EXTERNAL_ANCHOR_READBACK_REJECTED');
 let host;
 try{host=await originalHostAdapter.readSignedState({
  hostMachineId:'DESKTOP-AE894KC',scope,incidentId:e.incidentId,
  challengeNonce,externalAnchorDigest:anchor.externalAnchorDigest,
  readbackDigest:anchor.readbackDigest,requiredState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_RECOVERY_READBACK_UNAVAILABLE');}
 if(!verifiedHostOff(host,e,anchor,opts))
  return hold('SIGNED_ORIGINAL_HOST_RECEIVER_OFF_NOT_REVALIDATED');
 let off;
 try{off=await independentReceiverAdapter.readSignedState({
  scope,incidentId:e.incidentId,challengeNonce,
  hostEvidenceDigest:hash(host.payload),readbackDigest:anchor.readbackDigest,
  requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_RECEIVER_OFF_READBACK_UNAVAILABLE');}
 if(!verifiedIndependentReceiverOff(off,e,anchor,host,opts))
  return hold('INDEPENDENT_SIGNED_RECEIVER_OFF_RECOVERY_MISMATCH');
 const offDigest=hash(off.payload);
 let reports;
 try{reports=await masterEvidenceProvider.readSignedReports({
  scope,incidentId:e.incidentId,checkpointDigest:e.checkpointDigest,
  readbackDigest:anchor.readbackDigest,receiverOffDigest:offDigest});}
 catch{return hold('THREE_MASTER_RECOVERY_EVIDENCE_UNAVAILABLE');}
 const masters=masterRecoveryReports(reports,e,anchor,offDigest,opts,
  Date.parse(off.payload.observedAt));
 if(!masters)return hold('THREE_FRESH_INDEPENDENT_MASTER_RECOVERY_SIGNATURES_REJECTED');
 if(!ownerReview(ownerAcceptance,e,anchor,offDigest,masters,opts))
  return hold('INDEPENDENT_DUAL_OWNER_ISOLATED_PILOT_REVIEW_REJECTED');
 try{
  // Re-read current signed-chain HEAD: no stale externally pinned tail may be accepted.
  const current=reconciledCheckpoint(ql431Store,scope,ql430Acceptance.acceptedRecordDigest);
  if(!current||current.recordDigest!==e.checkpointDigest||
   current.index!==e.checkpointIndex||current.entry.incidentId!==e.incidentId)
   return hold('INCIDENT_CHECKPOINT_CHANGED_SINCE_EXTERNAL_READBACK');
  const saved=reviewLedger.claimOnce(e.incidentId,hash({
   scope,ql430AcceptedDigest:ql430Acceptance.acceptedRecordDigest,
   checkpointDigest:e.checkpointDigest,anchorDigest:anchor.externalAnchorDigest,
   readbackDigest:anchor.readbackDigest,
   originalHostOffDigest:hash(host.payload),receiverOffDigest:offDigest,
   mastersDigest:masters.reportsDigest,ownerDigest:hash(ownerAcceptance.payload)}));
  if(reviewLedger.read(e.incidentId)?.recordDigest!==saved.recordDigest)
   throw Error('QL432_OWNER_REVIEW_NOT_DURABLY_READABLE');
  return {...hold('OWNER_REVIEW_ACCEPTED_NEW_SUPERVISED_CEREMONY_REQUIRED'),
   state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
   receiver:'OFF_VERIFIED_SIGNED_READBACK',
   ownerAcceptance:'DUAL_SIGNED_RECOVERY_REVIEW_ONLY',
   scope,incidentId:e.incidentId,checkpointIndex:e.checkpointIndex,
   checkpointDigest:e.checkpointDigest,externalAnchorDigest:anchor.externalAnchorDigest,
   independentReadbackDigest:anchor.readbackDigest,
   ownerReviewReceiptDigest:saved.recordDigest,masterCount:3,
   nextStep:'NEW_QL429_QL430_OWNER_SUPERVISED_CEREMONY_ONLY'};
 }catch{return hold('QL432_OWNER_REVIEW_CUSTODY_WRITE_OR_REPLAY_FAILED');}
}
