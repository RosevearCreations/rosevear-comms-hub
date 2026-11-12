import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {join,isAbsolute,resolve} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/, SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/, PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const WINDOW=60000;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
const fresh=(s,now)=>typeof s==='string'&&Number.isSafeInteger(now)&&
 Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&
 Date.parse(s)<=now&&now-Date.parse(s)<=WINDOW;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',receiver:'OFF_PENDING_FRESH_REVALIDATION',
 ownerAcceptance:'HOLD',runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signed(p,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const raw=Buffer.from(pin,'base64');
  if(raw.toString('base64')!==pin)return false;
  const k=createPublicKey({key:raw,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),k,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const scopeValid=s=>exact(s,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
 ID.test(s.ceremonyId??'')&&s.sourceId==='rosevear-ai-hub'&&
 ID.test(s.episodeId??'')&&SHA.test(s.sourceRevision??'')&&
 SHA.test(s.controllerRevision??'');
function trustedDecision(decision,ql432Ledger,ql431Store){
 const s=decision?.scope;
 if(!scopeValid(s)||decision.state!=='DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW'||
  decision.connection!=='HOLD'||decision.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  decision.ownerAcceptance!=='DUAL_SIGNED_RECOVERY_REVIEW_ONLY'||
  decision.slaveGate!=='HOLD_NEXT_MASTER_INTEGRATION_STAGE'||
  decision.nextStep!=='NEW_QL429_QL430_OWNER_SUPERVISED_CEREMONY_ONLY'||
  decision.masterCount!==3||!ID.test(decision.incidentId??'')||
  !Number.isSafeInteger(decision.checkpointIndex)||decision.checkpointIndex<3||
  !HEX.test(decision.checkpointDigest??'')||
  !HEX.test(decision.externalAnchorDigest??'')||
  !HEX.test(decision.independentReadbackDigest??'')||
  !HEX.test(decision.ownerReviewReceiptDigest??'')||
  typeof ql432Ledger?.read!=='function'||typeof ql431Store?.read!=='function')
  return null;
 try{
  const r=ql432Ledger.read(decision.incidentId);
  const c=ql431Store.read(s);
  return r?.recordDigest===decision.ownerReviewReceiptDigest&&
   r.incidentId===decision.incidentId&&
   c?.entry?.kind==='RECONCILED'&&c.entry.incidentId===decision.incidentId&&
   c.index===decision.checkpointIndex&&
   c.recordDigest===decision.checkpointDigest?c:null;
 }catch{return null;}
}
/** Prepares a sanitized proposal, not proof that an independent external anchor
 * exists and not an activation authorization. Consumes no receiver capability.
 */
export function prepareQl433RecoveryDecisionExport({
 ql432Decision,ql432Ledger,ql431Store,exportId,challengeNonce,
 nextCeremonyId,nextEpisodeId
},{
 nowMs,protectedOriginalHostSession=false,independentQl432DecisionVerified=false
}={}){
 if(!protectedOriginalHostSession||!independentQl432DecisionVerified||
  !Number.isSafeInteger(nowMs)||!ID.test(exportId??'')||
  !ID.test(challengeNonce??'')||!ID.test(nextCeremonyId??'')||
  !ID.test(nextEpisodeId??'')||nextCeremonyId===ql432Decision?.scope?.ceremonyId||
  nextEpisodeId===ql432Decision?.scope?.episodeId)
  return hold('ORIGINAL_HOST_RECOVERY_EXPORT_AUTHORITY_OR_NEW_SCOPE_MISSING');
 const checkpoint=trustedDecision(ql432Decision,ql432Ledger,ql431Store);
 if(!checkpoint)return hold('QL432_OWNER_REVIEW_OR_QL431_INCIDENT_CUSTODY_NOT_VERIFIED');
 const d=ql432Decision;
 const exportRecord={schema:'rosevear.ql433.recovery-decision-export.v1',
  scope:d.scope,incidentId:d.incidentId,
  ql431CheckpointIndex:d.checkpointIndex,
  ql431CheckpointDigest:d.checkpointDigest,
  ql432OwnerReviewReceiptDigest:d.ownerReviewReceiptDigest,
  ql432ExternalAnchorDigest:d.externalAnchorDigest,
  ql432IndependentReadbackDigest:d.independentReadbackDigest,
  exportId,challengeNonce,nextCeremonyId,nextEpisodeId,
  nextHostId:'DESKTOP-AE894KC',
  action:'PRECHECK_NEW_OWNER_SUPERVISED_QL429_QL430_ONLY_KEEP_RECEIVER_OFF',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL433_RECOVERY_DECISION_EXPORT_PREPARED_NOT_ANCHORED',
  exportRecord,exportDigest:hash(exportRecord),connection:'HOLD',
  receiver:'OFF_PENDING_FRESH_REVALIDATION',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function verifyExternal(exportRecord,answer,opts){
 const {anchorPin,readerPin,independentAnchorPinVerified,
  independentReaderPinVerified,nowMs}=opts;
 const a=answer?.anchor?.payload,r=answer?.reader?.payload;
 if(!independentAnchorPinVerified||!independentReaderPinVerified||
  typeof anchorPin!=='string'||typeof readerPin!=='string'||anchorPin===readerPin||
  !fresh(exportRecord.preparedAt,nowMs)||
  !exact(answer,['anchor','reader'])||
  !exact(answer.anchor,['payload','signature'])||
  !exact(answer.reader,['payload','signature'])||
  !exact(a,['schema','exportId','challengeNonce','exportDigest',
   'ql431CheckpointDigest','ql432OwnerReviewReceiptDigest',
   'nextCeremonyId','nextEpisodeId','status','anchoredAt'])||
  a.schema!=='rosevear.ql433.external-decision-anchor.v1'||
  a.exportId!==exportRecord.exportId||
  a.challengeNonce!==exportRecord.challengeNonce||
  a.exportDigest!==hash(exportRecord)||
  a.ql431CheckpointDigest!==exportRecord.ql431CheckpointDigest||
  a.ql432OwnerReviewReceiptDigest!==exportRecord.ql432OwnerReviewReceiptDigest||
  a.nextCeremonyId!==exportRecord.nextCeremonyId||
  a.nextEpisodeId!==exportRecord.nextEpisodeId||
  a.status!=='EXTERNAL_IMMUTABLE_DECISION_EXPORT_ANCHORED'||
  !fresh(a.anchoredAt,nowMs)||
  Date.parse(a.anchoredAt)<Date.parse(exportRecord.preparedAt)||
  !signed(a,answer.anchor.signature,anchorPin)||
  !exact(r,['schema','exportId','challengeNonce','exportDigest',
   'anchorDigest','status','readAt'])||
  r.schema!=='rosevear.ql433.independent-decision-anchor-readback.v1'||
  r.exportId!==exportRecord.exportId||
  r.challengeNonce!==exportRecord.challengeNonce||
  r.exportDigest!==hash(exportRecord)||
  r.anchorDigest!==hash(a)||
  r.status!=='INDEPENDENT_EXACT_DECISION_EXPORT_READBACK'||
  !fresh(r.readAt,nowMs)||Date.parse(r.readAt)<Date.parse(a.anchoredAt)||
  !signed(r,answer.reader.signature,readerPin))return null;
 return {anchorDigest:hash(a),readbackDigest:hash(r),readAt:r.readAt};
}
function verifiedOriginalOff(envelope,exportRecord,anchor,opts){
 const p=envelope?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(envelope,['payload','signature'])&&
  exact(p,['schema','hostMachineId','scope','incidentId',
   'exportId','challengeNonce','nextCeremonyId','nextEpisodeId',
   'externalDecisionAnchorDigest','independentReadbackDigest',
   'receiverState','observedAt'])&&
  p.schema==='rosevear.ql433.original-host-reentry-off.v1'&&
  p.hostMachineId==='DESKTOP-AE894KC'&&same(p.scope,exportRecord.scope)&&
  p.incidentId===exportRecord.incidentId&&p.exportId===exportRecord.exportId&&
  p.challengeNonce===exportRecord.challengeNonce&&
  p.nextCeremonyId===exportRecord.nextCeremonyId&&
  p.nextEpisodeId===exportRecord.nextEpisodeId&&
  p.externalDecisionAnchorDigest===anchor.anchorDigest&&
  p.independentReadbackDigest===anchor.readbackDigest&&
  p.receiverState==='OFF'&&fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(anchor.readAt)&&
  signed(p,envelope.signature,opts.originalHostPin);
}
function verifiedIndependentOff(envelope,exportRecord,anchor,host,opts){
 const p=envelope?.payload;
 return opts.independentReceiverPinVerified===true&&
  exact(envelope,['payload','signature'])&&
  exact(p,['schema','scope','incidentId','exportId',
   'challengeNonce','hostEvidenceDigest','decisionReadbackDigest',
   'receiverState','observedAt'])&&
  p.schema==='rosevear.ql433.independent-reentry-off.v1'&&
  same(p.scope,exportRecord.scope)&&
  p.incidentId===exportRecord.incidentId&&
  p.exportId===exportRecord.exportId&&
  p.challengeNonce===exportRecord.challengeNonce&&
  p.hostEvidenceDigest===hash(host.payload)&&
  p.decisionReadbackDigest===anchor.readbackDigest&&
  p.receiverState==='OFF'&&fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  signed(p,envelope.signature,opts.receiverPin);
}
function verifyMasterReports(reports,exp,anchor,receiverDigest,opts,minimumMs){
 if(opts.independentMasterPinsVerified!==true||!opts.masterPins||
  !Array.isArray(reports)||reports.length!==3)return null;
 const seen=new Set(),accepted=[];
 for(const env of reports){
  const p=env?.payload;
  if(!exact(env,['payload','signature'])||
   !exact(p,['schema','masterId','scope','incidentId',
    'ql432OwnerReviewReceiptDigest','externalDecisionReadbackDigest',
    'receiverOffDigest','nextCeremonyId','nextEpisodeId',
    'status','observedAt'])||
   p.schema!=='rosevear.ql433.master-new-ceremony-precheck.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   !same(p.scope,exp.scope)||p.incidentId!==exp.incidentId||
   p.ql432OwnerReviewReceiptDigest!==exp.ql432OwnerReviewReceiptDigest||
   p.externalDecisionReadbackDigest!==anchor.readbackDigest||
   p.receiverOffDigest!==receiverDigest||
   p.nextCeremonyId!==exp.nextCeremonyId||p.nextEpisodeId!==exp.nextEpisodeId||
   p.status!=='NEW_CEREMONY_PRECHECK_ONLY_RECEIVER_OFF'||
   !fresh(p.observedAt,opts.nowMs)||
   Date.parse(p.observedAt)<minimumMs||
   !signed(p,env.signature,opts.masterPins[p.masterId]))return null;
  seen.add(p.masterId);accepted.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {reportsDigest:hash(accepted),
  latestAt:Math.max(...accepted.map(x=>Date.parse(x.observedAt)))};
}
function ownerBoundary(envelope,exp,anchor,receiverDigest,masters,opts){
 const p=envelope?.payload;
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  typeof opts.ownerPin==='string'&&opts.ownerPin!==opts.reviewerPin&&
  exact(envelope,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','scope','incidentId','exportId','challengeNonce',
   'ql432OwnerReviewReceiptDigest','externalDecisionReadbackDigest',
   'receiverOffDigest','mastersDigest','nextCeremonyId','nextEpisodeId',
   'action','ownerId','reviewerId','authorizedAt'])&&
  p.schema==='rosevear.ql433.owner-new-ceremony-precheck.v1'&&
  same(p.scope,exp.scope)&&p.incidentId===exp.incidentId&&
  p.exportId===exp.exportId&&p.challengeNonce===exp.challengeNonce&&
  p.ql432OwnerReviewReceiptDigest===exp.ql432OwnerReviewReceiptDigest&&
  p.externalDecisionReadbackDigest===anchor.readbackDigest&&
  p.receiverOffDigest===receiverDigest&&p.mastersDigest===masters.reportsDigest&&
  p.nextCeremonyId===exp.nextCeremonyId&&p.nextEpisodeId===exp.nextEpisodeId&&
  p.action==='AUTHORIZE_NEW_CEREMONY_PRECHECK_ONLY_RECEIVER_OFF_NO_ACTIVATION'&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&fresh(p.authorizedAt,opts.nowMs)&&
  Date.parse(p.authorizedAt)>=masters.latestAt&&
  signed(p,envelope.ownerSignature,opts.ownerPin)&&
  signed(p,envelope.reviewerSignature,opts.reviewerPin);
}
/** One owner review per original incident; local receipts are NOT a replacement
 * for the independent external anchor or protected owner signer custody.
 */
export function openQl433ProtectedPrecheckLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('PRIVATE_ABSOLUTE_QL433_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('UNSAFE_QL433_LEDGER_DIRECTORY');
 const name=id=>{
  if(!ID.test(id??''))throw Error('INVALID_QL433_INCIDENT_ID');
  return join(root,'ql433-precheck-'+id+'.json');
 };
 const read=id=>{
  let raw;
  try{raw=readFileSync(name(id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL433_RECORD_OVERSIZE');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL433_RECORD_INVALID');}
  if(!exact(rec,['schema','incidentId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql433.owner-precheck-receipt.v1'||
   rec.incidentId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,incidentId:id,
    evidenceDigest:rec.evidenceDigest}))throw Error('QL433_RECORD_TAMPERED');
  return rec;
 };
 const claimOnce=(id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('INVALID_QL433_EVIDENCE_DIGEST');
  if(read(id))throw Error('QL433_INCIDENT_PRECHECK_ALREADY_USED');
  const rec={schema:'rosevear.ql433.owner-precheck-receipt.v1',incidentId:id,evidenceDigest};
  rec.recordDigest=hash(rec);
  const fd=openSync(name(id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dirfd=openSync(root,'r');try{fsyncSync(dirfd);}finally{closeSync(dirfd);}
  if(read(id)?.recordDigest!==rec.recordDigest)
   throw Error('QL433_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
/** Strictly authorizes preparing a NEW QL-429/430 owner-supervised ceremony.
 * No receiver lifecycle methods are called, no old ceremony is revived.
 */
export async function reviewQl433NewCeremonyBoundary({
 ql432Decision,ql432Ledger,ql431Store,precheckLedger,
 exportId,challengeNonce,nextCeremonyId,nextEpisodeId,
 externalDecisionAdapter,originalHostAdapter,independentReceiverAdapter,
 masterProvider,ownerAcceptance
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl432DecisionVerified!==true||!Number.isSafeInteger(opts.nowMs)||
  typeof precheckLedger?.read!=='function'||typeof precheckLedger?.claimOnce!=='function'||
  typeof externalDecisionAdapter?.readSignedDecision!=='function'||
  typeof originalHostAdapter?.readSignedState!=='function'||
  typeof independentReceiverAdapter?.readSignedState!=='function'||
  typeof masterProvider?.readSignedReports!=='function')
  return hold('ORIGINAL_HOST_PROTECTED_NEW_CEREMONY_PRECHECK_AUTHORITY_REQUIRED');
 const prepared=prepareQl433RecoveryDecisionExport({
  ql432Decision,ql432Ledger,ql431Store,exportId,challengeNonce,
  nextCeremonyId,nextEpisodeId
 },{nowMs:opts.nowMs,protectedOriginalHostSession:true,
    independentQl432DecisionVerified:true});
 if(prepared.state!=='QL433_RECOVERY_DECISION_EXPORT_PREPARED_NOT_ANCHORED')
  return hold('ORIGINAL_OWNER_REVIEW_OR_RECOVERY_CHECKPOINT_INVALID');
 const e=prepared.exportRecord;
 const pins=[opts.anchorPin,opts.readerPin,opts.originalHostPin,opts.receiverPin,
  opts.ownerPin,opts.reviewerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string')||new Set(pins).size!==pins.length)
  return hold('INDEPENDENT_TRUSTED_SIGNER_CUSTODY_REQUIRED');
 try{if(precheckLedger.read(e.incidentId))return hold('QL433_ONE_USE_INCIDENT_ALREADY_REVIEWED');}
 catch{return hold('QL433_PRECHECK_LEDGER_UNREADABLE');}
 let external;
 try{external=await externalDecisionAdapter.readSignedDecision({
  exportRecord:e,exportDigest:prepared.exportDigest,exportId,challengeNonce});}
 catch{return hold('EXTERNAL_DECISION_ANCHOR_READBACK_UNAVAILABLE');}
 const anchor=verifyExternal(e,external,opts);
 if(!anchor)return hold('EXTERNAL_INDEPENDENT_DECISION_ANCHOR_SIGNATURE_REJECTED');
 let host;
 try{host=await originalHostAdapter.readSignedState({
  hostMachineId:'DESKTOP-AE894KC',scope:e.scope,incidentId:e.incidentId,
  exportId,challengeNonce,nextCeremonyId,nextEpisodeId,
  externalDecisionAnchorDigest:anchor.anchorDigest,
  independentReadbackDigest:anchor.readbackDigest,requiredState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_FRESH_REENTRY_OFF_UNAVAILABLE');}
 if(!verifiedOriginalOff(host,e,anchor,opts))
  return hold('ORIGINAL_HOST_SIGNED_OFF_REENTRY_CHECK_REJECTED');
 let off;
 try{off=await independentReceiverAdapter.readSignedState({
  scope:e.scope,incidentId:e.incidentId,exportId,challengeNonce,
  hostEvidenceDigest:hash(host.payload),decisionReadbackDigest:anchor.readbackDigest,
  requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_RECEIVER_OFF_EVIDENCE_UNAVAILABLE');}
 if(!verifiedIndependentOff(off,e,anchor,host,opts))
  return hold('INDEPENDENT_SIGNED_OFF_EVIDENCE_REJECTED');
 const offDigest=hash(off.payload);
 let reports;
 try{reports=await masterProvider.readSignedReports({
  scope:e.scope,incidentId:e.incidentId,
  ql432OwnerReviewReceiptDigest:e.ql432OwnerReviewReceiptDigest,
  externalDecisionReadbackDigest:anchor.readbackDigest,
  receiverOffDigest:offDigest,nextCeremonyId,nextEpisodeId});}
 catch{return hold('THREE_MASTER_NEW_CEREMONY_PRECHECK_UNAVAILABLE');}
 const masters=verifyMasterReports(reports,e,anchor,offDigest,opts,
  Date.parse(off.payload.observedAt));
 if(!masters)return hold('THREE_SIGNED_MASTER_NEW_CEREMONY_PRECHECK_REJECTED');
 if(!ownerBoundary(ownerAcceptance,e,anchor,offDigest,masters,opts))
  return hold('DUAL_SIGNED_OWNER_PRECHECK_NO_ACTIVATION_BOUNDARY_REJECTED');
 try{
  // Reopen the durable source ledgers just before consuming the one-use decision.
  const current=trustedDecision(ql432Decision,ql432Ledger,ql431Store);
  if(!current||current.recordDigest!==e.ql431CheckpointDigest||
   current.index!==e.ql431CheckpointIndex)
   return hold('RECOVERY_DECISION_CHANGED_BEFORE_COMMIT');
  const record=precheckLedger.claimOnce(e.incidentId,hash({
   exportDigest:prepared.exportDigest,
   ql432OwnerReviewReceiptDigest:e.ql432OwnerReviewReceiptDigest,
   externalAnchorDigest:anchor.anchorDigest,independentReadbackDigest:anchor.readbackDigest,
   hostOffDigest:hash(host.payload),receiverOffDigest:offDigest,
   mastersDigest:masters.reportsDigest,ownerDigest:hash(ownerAcceptance.payload),
   nextCeremonyId,nextEpisodeId}));
  if(precheckLedger.read(e.incidentId)?.recordDigest!==record.recordDigest)
   throw Error('QL433_DURABLE_READBACK_INVALID');
  return {...hold('PRECHECK_ACCEPTED_SEPARATE_SUPERVISED_CEREMONY_REQUIRED'),
   state:'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY',
   receiver:'OFF_VERIFIED_SIGNED_READBACK',
   ownerAcceptance:'DUAL_SIGNED_NEW_CEREMONY_PRECHECK_ONLY',
   scope:e.scope,incidentId:e.incidentId,nextCeremonyId,nextEpisodeId,
   externalDecisionAnchorDigest:anchor.anchorDigest,
   independentReadbackDigest:anchor.readbackDigest,
   ql432OwnerReviewReceiptDigest:e.ql432OwnerReviewReceiptDigest,
   precheckRecordDigest:record.recordDigest,masterCount:3,
   permittedNextAction:'NEW_QL429_QL430_CEREMONY_WITH_SEPARATE_FRESH_AUTHORITY_NOT_ACTIVATED'};
 }catch{return hold('QL433_ONE_USE_CUSTODY_COMMIT_OR_REPLAY_FAILED');}
}
