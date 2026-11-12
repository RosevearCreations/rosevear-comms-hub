import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {join,isAbsolute,resolve} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/, SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/, PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const WINDOW_MS=60000;
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const exact=(v,fields)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===fields.length&&fields.every(f=>Object.hasOwn(v,f));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fresh=(s,now)=>typeof s==='string'&&Number.isSafeInteger(now)&&
 Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&
 Date.parse(s)<=now&&now-Date.parse(s)<=WINDOW_MS;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 receiver:'OFF_PENDING_ORIGINAL_HOST_READINESS_REVALIDATION',
 ownerAcceptance:'HOLD',activationAuthorized:false,
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',runtimeUptime:'UNKNOWN'});
function signatureValid(payload,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
    typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const key=createPublicKey({key:der,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
function validScope(s){
 return exact(s,['ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision'])&&
  ID.test(s.ceremonyId??'')&&s.sourceId==='rosevear-ai-hub'&&
  ID.test(s.episodeId??'')&&SHA.test(s.sourceRevision??'')&&
  SHA.test(s.controllerRevision??'');
}
/** Require the protected durable QL-431/432/433 chain, not a browser-generated
 * status field or a precheck produced by the current caller.
 */
function verifiedPriorCustody(precheck,ql433Ledger,decision,ql432Ledger,ql431Store){
 const scope=precheck?.scope;
 if(!validScope(scope)||precheck?.state!=='DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY'||
  precheck.connection!=='HOLD'||precheck.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  precheck.ownerAcceptance!=='DUAL_SIGNED_NEW_CEREMONY_PRECHECK_ONLY'||
  precheck.slaveGate!=='HOLD_NEXT_MASTER_INTEGRATION_STAGE'||
  precheck.masterCount!==3||!ID.test(precheck.incidentId??'')||
  !ID.test(precheck.nextCeremonyId??'')||!ID.test(precheck.nextEpisodeId??'')||
  precheck.nextCeremonyId===scope.ceremonyId||
  precheck.nextEpisodeId===scope.episodeId||
  precheck.permittedNextAction!=='NEW_QL429_QL430_CEREMONY_WITH_SEPARATE_FRESH_AUTHORITY_NOT_ACTIVATED'||
  !HEX.test(precheck.externalDecisionAnchorDigest??'')||
  !HEX.test(precheck.independentReadbackDigest??'')||
  !HEX.test(precheck.ql432OwnerReviewReceiptDigest??'')||
  !HEX.test(precheck.precheckRecordDigest??'')||
  decision?.state!=='DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW'||
  decision?.connection!=='HOLD'||decision?.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  decision?.ownerAcceptance!=='DUAL_SIGNED_RECOVERY_REVIEW_ONLY'||
  decision?.masterCount!==3||
  decision?.nextStep!=='NEW_QL429_QL430_OWNER_SUPERVISED_CEREMONY_ONLY'||
  decision?.slaveGate!=='HOLD_NEXT_MASTER_INTEGRATION_STAGE'||
  !same(decision.scope,scope)||decision.incidentId!==precheck.incidentId||
  decision.ownerReviewReceiptDigest!==precheck.ql432OwnerReviewReceiptDigest||
  !HEX.test(decision.checkpointDigest??'')||
  !Number.isSafeInteger(decision.checkpointIndex)||decision.checkpointIndex<3||
  typeof ql433Ledger?.read!=='function'||typeof ql432Ledger?.read!=='function'||
  typeof ql431Store?.read!=='function')return null;
 try{
  const a=ql433Ledger.read(precheck.incidentId);
  const b=ql432Ledger.read(precheck.incidentId);
  const c=ql431Store.read(scope);
  if(a?.recordDigest!==precheck.precheckRecordDigest||
   a.incidentId!==precheck.incidentId||
   b?.recordDigest!==decision.ownerReviewReceiptDigest||
   b.incidentId!==decision.incidentId||
   c?.entry?.kind!=='RECONCILED'||
   c.entry.incidentId!==precheck.incidentId||
   c.index!==decision.checkpointIndex||c.recordDigest!==decision.checkpointDigest)
   return null;
  return {ql431CheckpointIndex:c.index,ql431CheckpointDigest:c.recordDigest,
   ql432ReceiptDigest:b.recordDigest,ql433ReceiptDigest:a.recordDigest};
 }catch{return null;}
}
/** Authoring an export never signs, anchors, or authorizes activation. */
export function prepareQl434ProtectedAuthorityExport({
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
 authorityId,challengeNonce
},{
 nowMs,protectedOriginalHostSession=false,independentQl433PrecheckVerified=false
}={}){
 if(!protectedOriginalHostSession||!independentQl433PrecheckVerified||
  !Number.isSafeInteger(nowMs)||!ID.test(authorityId??'')||
  !ID.test(challengeNonce??''))return hold('QL434_PROTECTED_ORIGINAL_HOST_AUTHORITY_REQUIRED');
 const prior=verifiedPriorCustody(ql433Precheck,ql433Ledger,ql432Decision,
  ql432Ledger,ql431Store);
 if(!prior)return hold('QL433_QL432_QL431_DURABLE_CUSTODY_CHAIN_NOT_VERIFIED');
 const p=ql433Precheck;
 const exportRecord={schema:'rosevear.ql434.new-ceremony-authority-export.v1',
  scope:p.scope,incidentId:p.incidentId,
  ql431CheckpointIndex:prior.ql431CheckpointIndex,
  ql431CheckpointDigest:prior.ql431CheckpointDigest,
  ql432OwnerReceiptDigest:prior.ql432ReceiptDigest,
  ql433PrecheckReceiptDigest:prior.ql433ReceiptDigest,
  ql433DecisionAnchorDigest:p.externalDecisionAnchorDigest,
  ql433IndependentReadbackDigest:p.independentReadbackDigest,
  nextCeremonyId:p.nextCeremonyId,nextEpisodeId:p.nextEpisodeId,
  hostMachineId:'DESKTOP-AE894KC',
  sourceRevision:p.scope.sourceRevision,
  controllerRevision:p.scope.controllerRevision,
  authorityId,challengeNonce,
  action:'PREPARE_NEW_SUPERVISED_QL429_QL430_CEREMONY_NO_RECEIVER_ACTIVATION',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL434_NEW_CEREMONY_AUTHORITY_EXPORT_PREPARED_NOT_SIGNED',
  exportRecord,exportDigest:hash(exportRecord),connection:'HOLD',
  receiver:'OFF_PENDING_ORIGINAL_HOST_READINESS_REVALIDATION',
  activationAuthorized:false,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function verifiedAuthorityHandoff(exp,envelope,opts){
 const {nowMs,issuerPin,witnessPin,independentIssuerPinVerified,
  independentWitnessPinVerified}=opts;
 const i=envelope?.issuer?.payload,w=envelope?.witness?.payload;
 if(!independentIssuerPinVerified||!independentWitnessPinVerified||
  typeof issuerPin!=='string'||typeof witnessPin!=='string'||
  issuerPin===witnessPin||!fresh(exp.preparedAt,nowMs)||
  !exact(envelope,['issuer','witness'])||
  !exact(envelope.issuer,['payload','signature'])||
  !exact(envelope.witness,['payload','signature'])||
  !exact(i,['schema','authorityId','challengeNonce','exportDigest',
   'scope','incidentId','ql433PrecheckReceiptDigest',
   'nextCeremonyId','nextEpisodeId','status','issuedAt'])||
  i.schema!=='rosevear.ql434.independent-authority-handoff.v1'||
  i.authorityId!==exp.authorityId||i.challengeNonce!==exp.challengeNonce||
  i.exportDigest!==hash(exp)||!same(i.scope,exp.scope)||
  i.incidentId!==exp.incidentId||
  i.ql433PrecheckReceiptDigest!==exp.ql433PrecheckReceiptDigest||
  i.nextCeremonyId!==exp.nextCeremonyId||
  i.nextEpisodeId!==exp.nextEpisodeId||
  i.status!=='NEW_CEREMONY_READINESS_HANDOFF_NOT_ACTIVATION'||
  !fresh(i.issuedAt,nowMs)||Date.parse(i.issuedAt)<Date.parse(exp.preparedAt)||
  !signatureValid(i,envelope.issuer.signature,issuerPin)||
  !exact(w,['schema','authorityId','challengeNonce','exportDigest',
   'issuerDigest','nextCeremonyId','nextEpisodeId','status','witnessedAt'])||
  w.schema!=='rosevear.ql434.independent-authority-witness.v1'||
  w.authorityId!==exp.authorityId||
  w.challengeNonce!==exp.challengeNonce||w.exportDigest!==hash(exp)||
  w.issuerDigest!==hash(i)||w.nextCeremonyId!==exp.nextCeremonyId||
  w.nextEpisodeId!==exp.nextEpisodeId||
  w.status!=='INDEPENDENT_HANDOFF_READBACK_NO_ACTIVATION'||
  !fresh(w.witnessedAt,nowMs)||
  Date.parse(w.witnessedAt)<Date.parse(i.issuedAt)||
  !signatureValid(w,envelope.witness.signature,witnessPin))return null;
 return {issuerDigest:hash(i),witnessDigest:hash(w),witnessedAt:w.witnessedAt};
}
function originalHostReady(envelope,exp,handoff,opts){
 const p=envelope?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(envelope,['payload','signature'])&&
  exact(p,['schema','hostMachineId','scope','incidentId','authorityId',
   'challengeNonce','nextCeremonyId','nextEpisodeId','sourceRevision',
   'controllerRevision','handoffWitnessDigest','receiverState',
   'readiness','observedAt'])&&
  p.schema==='rosevear.ql434.original-host-new-ceremony-readiness.v1'&&
  p.hostMachineId==='DESKTOP-AE894KC'&&same(p.scope,exp.scope)&&
  p.incidentId===exp.incidentId&&p.authorityId===exp.authorityId&&
  p.challengeNonce===exp.challengeNonce&&
  p.nextCeremonyId===exp.nextCeremonyId&&
  p.nextEpisodeId===exp.nextEpisodeId&&
  p.sourceRevision===exp.sourceRevision&&
  p.controllerRevision===exp.controllerRevision&&
  p.handoffWitnessDigest===handoff.witnessDigest&&
  p.receiverState==='OFF'&&
  p.readiness==='HOST_READY_FOR_SEPARATE_NEW_SUPERVISED_CEREMONY_ONLY'&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(handoff.witnessedAt)&&
  signatureValid(p,envelope.signature,opts.originalHostPin);
}
function independentReceiverOff(envelope,exp,handoff,host,opts){
 const p=envelope?.payload;
 return opts.independentReceiverPinVerified===true&&
  exact(envelope,['payload','signature'])&&
  exact(p,['schema','scope','incidentId','authorityId',
   'challengeNonce','hostReadinessDigest','handoffWitnessDigest',
   'receiverState','observedAt'])&&
  p.schema==='rosevear.ql434.independent-receiver-off.v1'&&
  same(p.scope,exp.scope)&&p.incidentId===exp.incidentId&&
  p.authorityId===exp.authorityId&&p.challengeNonce===exp.challengeNonce&&
  p.hostReadinessDigest===hash(host.payload)&&
  p.handoffWitnessDigest===handoff.witnessDigest&&
  p.receiverState==='OFF'&&fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  signatureValid(p,envelope.signature,opts.receiverPin);
}
function masterReports(reports,exp,handoff,receiverDigest,opts,minAt){
 if(!Array.isArray(reports)||reports.length!==3||
  opts.independentMasterPinsVerified!==true||!opts.masterPins)return null;
 const seen=new Set(),items=[];
 for(const envelope of reports){
  const p=envelope?.payload;
  if(!exact(envelope,['payload','signature'])||
   !exact(p,['schema','masterId','scope','incidentId','authorityId',
    'ql433PrecheckReceiptDigest','handoffWitnessDigest','receiverOffDigest',
    'nextCeremonyId','nextEpisodeId','status','observedAt'])||
   p.schema!=='rosevear.ql434.master-reentry-readiness.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   !same(p.scope,exp.scope)||p.incidentId!==exp.incidentId||
   p.authorityId!==exp.authorityId||
   p.ql433PrecheckReceiptDigest!==exp.ql433PrecheckReceiptDigest||
   p.handoffWitnessDigest!==handoff.witnessDigest||
   p.receiverOffDigest!==receiverDigest||
   p.nextCeremonyId!==exp.nextCeremonyId||
   p.nextEpisodeId!==exp.nextEpisodeId||
   p.status!=='NEW_CEREMONY_PREPARATION_ONLY_NOT_ACTIVATED'||
   !fresh(p.observedAt,opts.nowMs)||
   Date.parse(p.observedAt)<minAt||
   !signatureValid(p,envelope.signature,opts.masterPins[p.masterId]))return null;
  seen.add(p.masterId);items.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 items.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {digest:hash(items),lastAt:Math.max(...items.map(x=>Date.parse(x.observedAt)))};
}
function dualOwnerBoundary(envelope,exp,handoff,receiverDigest,masters,opts){
 const p=envelope?.payload;
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  typeof opts.ownerPin==='string'&&opts.ownerPin!==opts.reviewerPin&&
  exact(envelope,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','scope','incidentId','authorityId','challengeNonce',
   'ql433PrecheckReceiptDigest','handoffWitnessDigest','receiverOffDigest',
   'mastersDigest','nextCeremonyId','nextEpisodeId','ownerId','reviewerId',
   'action','authorizedAt'])&&
  p.schema==='rosevear.ql434.dual-owner-new-ceremony-readiness.v1'&&
  same(p.scope,exp.scope)&&p.incidentId===exp.incidentId&&
  p.authorityId===exp.authorityId&&p.challengeNonce===exp.challengeNonce&&
  p.ql433PrecheckReceiptDigest===exp.ql433PrecheckReceiptDigest&&
  p.handoffWitnessDigest===handoff.witnessDigest&&
  p.receiverOffDigest===receiverDigest&&p.mastersDigest===masters.digest&&
  p.nextCeremonyId===exp.nextCeremonyId&&p.nextEpisodeId===exp.nextEpisodeId&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&
  p.action==='AUTHORIZE_NEW_CEREMONY_READINESS_ONLY_RECEIVER_OFF_NO_ACTIVATION'&&
  fresh(p.authorizedAt,opts.nowMs)&&Date.parse(p.authorizedAt)>=masters.lastAt&&
  signatureValid(p,envelope.ownerSignature,opts.ownerPin)&&
  signatureValid(p,envelope.reviewerSignature,opts.reviewerPin);
}
/** Protected local one-use receipt is only a custody checkpoint; privileged
 * deletion of the directory is outside its threat boundary.
 */
export function openQl434ProtectedReadinessLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL434_PROTECTED_ABSOLUTE_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL434_UNSAFE_PROTECTED_DIRECTORY');
 const path=incident=>{
  if(!ID.test(incident??''))throw Error('QL434_INVALID_INCIDENT_ID');
  return join(root,'ql434-readiness-'+incident+'.json');
 };
 const read=incident=>{
  let raw;
  try{raw=readFileSync(path(incident),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL434_RECORD_OVERSIZE');
  let r;try{r=JSON.parse(raw);}catch{throw Error('QL434_RECORD_INVALID');}
  if(!exact(r,['schema','incidentId','evidenceDigest','recordDigest'])||
   r.schema!=='rosevear.ql434.readiness-receipt.v1'||
   r.incidentId!==incident||!HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:r.schema,incidentId:incident,
    evidenceDigest:r.evidenceDigest}))throw Error('QL434_RECORD_TAMPERED');
  return r;
 };
 const claimOnce=(incident,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL434_INVALID_EVIDENCE_DIGEST');
  if(read(incident))throw Error('QL434_INCIDENT_ALREADY_CONSUMED');
  const r={schema:'rosevear.ql434.readiness-receipt.v1',incidentId:incident,evidenceDigest};
  r.recordDigest=hash(r);
  const fd=openSync(path(incident),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const dfd=openSync(root,'r');try{fsyncSync(dfd);}finally{closeSync(dfd);}
  if(read(incident)?.recordDigest!==r.recordDigest)
   throw Error('QL434_READBACK_DID_NOT_MATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
/** Code only, no runtime enrollment. Evidence has to be issued and fetched by
 * real independently protected adapters; no receiver activation is possible.
 */
export async function runQl434OriginalHostSupervisedReadiness({
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
 readinessLedger,authorityId,challengeNonce,
 authorityHandoffProvider,originalHostAdapter,independentReceiverAdapter,
 masterEvidenceProvider,ownerAcceptance
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl433PrecheckVerified!==true||
  !Number.isSafeInteger(opts.nowMs)||
  typeof readinessLedger?.read!=='function'||
  typeof readinessLedger?.claimOnce!=='function'||
  typeof authorityHandoffProvider?.readSignedHandoff!=='function'||
  typeof originalHostAdapter?.readSignedReadiness!=='function'||
  typeof independentReceiverAdapter?.readSignedState!=='function'||
  typeof masterEvidenceProvider?.readSignedReports!=='function')
  return hold('ORIGINAL_HOST_PROTECTED_READINESS_SESSION_REQUIRED');
 const prep=prepareQl434ProtectedAuthorityExport({
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  authorityId,challengeNonce
 },{nowMs:opts.nowMs,protectedOriginalHostSession:true,
   independentQl433PrecheckVerified:true});
 if(prep.state!=='QL434_NEW_CEREMONY_AUTHORITY_EXPORT_PREPARED_NOT_SIGNED')
  return hold('DURABLE_PREDECESSOR_CHAIN_OR_NEW_CEREMONY_SCOPE_INVALID');
 const e=prep.exportRecord;
 const pins=[opts.issuerPin,opts.witnessPin,opts.originalHostPin,opts.receiverPin,
  opts.ownerPin,opts.reviewerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string')||new Set(pins).size!==pins.length)
  return hold('INDEPENDENT_SIGNER_PIN_CUSTODY_NOT_SATISFIED');
 try{if(readinessLedger.read(e.incidentId))return hold('ORIGINAL_INCIDENT_ALREADY_USED_FOR_READINESS');}
 catch{return hold('QL434_PROTECTED_READINESS_LEDGER_UNREADABLE');}
 let handoff;
 try{handoff=await authorityHandoffProvider.readSignedHandoff({
  exportRecord:e,exportDigest:prep.exportDigest,authorityId,challengeNonce});}
 catch{return hold('INDEPENDENT_SIGNED_HANDOFF_NOT_AVAILABLE');}
 const witness=verifiedAuthorityHandoff(e,handoff,opts);
 if(!witness)return hold('INDEPENDENT_AUTHORITY_SIGNATURE_OR_WITNESS_INVALID');
 let host;
 try{host=await originalHostAdapter.readSignedReadiness({
  hostMachineId:'DESKTOP-AE894KC',scope:e.scope,incidentId:e.incidentId,
  authorityId,challengeNonce,nextCeremonyId:e.nextCeremonyId,
  nextEpisodeId:e.nextEpisodeId,
  handoffWitnessDigest:witness.witnessDigest,requiredState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_SIGNED_READINESS_UNAVAILABLE');}
 if(!originalHostReady(host,e,witness,opts))
  return hold('ORIGINAL_HOST_SIGNED_OFF_AND_NEW_CEREMONY_READINESS_INVALID');
 let off;
 try{off=await independentReceiverAdapter.readSignedState({
  scope:e.scope,incidentId:e.incidentId,authorityId,challengeNonce,
  hostReadinessDigest:hash(host.payload),handoffWitnessDigest:witness.witnessDigest,
  requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_RECEIVER_OFF_READBACK_UNAVAILABLE');}
 if(!independentReceiverOff(off,e,witness,host,opts))
  return hold('INDEPENDENT_SIGNED_RECEIVER_OFF_INVALID');
 const receiverOffDigest=hash(off.payload);
 let reports;
 try{reports=await masterEvidenceProvider.readSignedReports({
  scope:e.scope,incidentId:e.incidentId,authorityId,
  ql433PrecheckReceiptDigest:e.ql433PrecheckReceiptDigest,
  handoffWitnessDigest:witness.witnessDigest,receiverOffDigest,
  nextCeremonyId:e.nextCeremonyId,nextEpisodeId:e.nextEpisodeId});}
 catch{return hold('THREE_MASTER_READINESS_REPORTS_UNAVAILABLE');}
 const masters=masterReports(reports,e,witness,receiverOffDigest,opts,
  Date.parse(off.payload.observedAt));
 if(!masters)return hold('THREE_INDEPENDENT_FRESH_MASTER_READINESS_REPORTS_REJECTED');
 if(!dualOwnerBoundary(ownerAcceptance,e,witness,receiverOffDigest,masters,opts))
  return hold('DUAL_OWNER_NEW_CEREMONY_ONLY_AUTHORITY_REJECTED');
 try{
  const current=verifiedPriorCustody(ql433Precheck,ql433Ledger,
   ql432Decision,ql432Ledger,ql431Store);
  if(!current||current.ql433ReceiptDigest!==e.ql433PrecheckReceiptDigest||
   current.ql432ReceiptDigest!==e.ql432OwnerReceiptDigest||
   current.ql431CheckpointDigest!==e.ql431CheckpointDigest||
   current.ql431CheckpointIndex!==e.ql431CheckpointIndex)
   return hold('PRIOR_DURABLE_CUSTODY_CHANGED_BEFORE_READINESS_COMMIT');
  const r=readinessLedger.claimOnce(e.incidentId,hash({
   exportDigest:prep.exportDigest,issuerDigest:witness.issuerDigest,
   handoffWitnessDigest:witness.witnessDigest,hostDigest:hash(host.payload),
   receiverOffDigest,mastersDigest:masters.digest,
   ownerDigest:hash(ownerAcceptance.payload),
   nextCeremonyId:e.nextCeremonyId,nextEpisodeId:e.nextEpisodeId}));
  if(readinessLedger.read(e.incidentId)?.recordDigest!==r.recordDigest)
   throw Error('READINESS_RECEIPT_READBACK_FAILED');
  return {...hold('NEW_SUPERVISED_CEREMONY_SEPARATE_AUTHORITY_REQUIRED'),
   state:'DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF',
   receiver:'OFF_VERIFIED_SIGNED_READBACK',
   ownerAcceptance:'DUAL_SIGNED_READINESS_ONLY',
   incidentId:e.incidentId,scope:e.scope,
   nextCeremonyId:e.nextCeremonyId,nextEpisodeId:e.nextEpisodeId,
   authorityId,handoffWitnessDigest:witness.witnessDigest,
   readinessRecordDigest:r.recordDigest,masterCount:3,
   permittedNextAction:'NEW_QL429_QL430_FRESH_SIGNED_ENROLLMENT_NOT_ACTIVATED'};
 }catch{return hold('QL434_ONE_USE_READINESS_LEDGER_OR_REPLAY_FAILED');}
}
