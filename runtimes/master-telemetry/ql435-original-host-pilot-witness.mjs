import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const SHA=/^[a-f0-9]{40}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const WINDOW=60000;
const MAX_LEASE=15000;
const digest=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fresh=(s,now)=>typeof s==='string'&&Number.isSafeInteger(now)&&
 Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&
 Date.parse(s)<=now&&now-Date.parse(s)<=WINDOW;
const hold=(reason,postChallenge=false)=>({
 state:'HOLD',reason,connection:'HOLD',activationAuthorized:false,
 receiver:postChallenge?'UNKNOWN_OR_ON_SUPERVISED_FAIL_CLOSED_SHUTDOWN_REQUIRED':'OFF_NOT_ACTIVATED_BY_QL435',
 ownerAcceptance:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
 runtimeUptime:'UNKNOWN',manualReceiverIsolationRequired:postChallenge
});
function signatureValid(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const b=Buffer.from(pin,'base64');
  if(b.toString('base64')!==pin)return false;
  const key=createPublicKey({key:b,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const scopeOk=s=>exact(s,['ceremonyId','sourceId','episodeId','sourceRevision',
 'controllerRevision'])&&ID.test(s.ceremonyId??'')&&
 s.sourceId==='rosevear-ai-hub'&&ID.test(s.episodeId??'')&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
function verifiedPrior(r,l434,p433,l433,d432,l432,s431){
 if(!scopeOk(r?.scope)||!equal(r.scope,p433?.scope)||
  r?.state!=='DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF'||
  r.connection!=='HOLD'||r.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  r.activationAuthorized!==false||
  r.ownerAcceptance!=='DUAL_SIGNED_READINESS_ONLY'||
  r.slaveGate!=='HOLD_NEXT_MASTER_INTEGRATION_STAGE'||
  r.permittedNextAction!=='NEW_QL429_QL430_FRESH_SIGNED_ENROLLMENT_NOT_ACTIVATED'||
  r.masterCount!==3||!ID.test(r.incidentId??'')||
  !ID.test(r.nextCeremonyId??'')||!ID.test(r.nextEpisodeId??'')||
  r.nextCeremonyId===r.scope.ceremonyId||r.nextEpisodeId===r.scope.episodeId||
  !ID.test(r.authorityId??'')||!HEX.test(r.handoffWitnessDigest??'')||
  !HEX.test(r.readinessRecordDigest??'')||
  p433?.state!=='DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY'||
  p433.connection!=='HOLD'||p433.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  p433.masterCount!==3||
  p433.ownerAcceptance!=='DUAL_SIGNED_NEW_CEREMONY_PRECHECK_ONLY'||
  p433.permittedNextAction!=='NEW_QL429_QL430_CEREMONY_WITH_SEPARATE_FRESH_AUTHORITY_NOT_ACTIVATED'||
  p433.incidentId!==r.incidentId||
  p433.nextCeremonyId!==r.nextCeremonyId||
  p433.nextEpisodeId!==r.nextEpisodeId||
  !HEX.test(p433.precheckRecordDigest??'')||
  d432?.state!=='DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW'||
  d432.connection!=='HOLD'||d432.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  d432.ownerAcceptance!=='DUAL_SIGNED_RECOVERY_REVIEW_ONLY'||
  d432.masterCount!==3||!equal(d432.scope,r.scope)||
  d432.incidentId!==r.incidentId||
  d432.ownerReviewReceiptDigest!==p433.ql432OwnerReviewReceiptDigest||
  !HEX.test(d432.checkpointDigest??'')||
  !Number.isSafeInteger(d432.checkpointIndex)||d432.checkpointIndex<3||
  typeof l434?.read!=='function'||typeof l433?.read!=='function'||
  typeof l432?.read!=='function'||typeof s431?.read!=='function')
  return null;
 try{
  const a=l434.read(r.incidentId),b=l433.read(r.incidentId),
   c=l432.read(r.incidentId),d=s431.read(r.scope);
  if(a?.recordDigest!==r.readinessRecordDigest||
   b?.recordDigest!==p433.precheckRecordDigest||
   c?.recordDigest!==d432.ownerReviewReceiptDigest||
   d?.entry?.kind!=='RECONCILED'||d.entry.incidentId!==r.incidentId||
   d.index!==d432.checkpointIndex||d.recordDigest!==d432.checkpointDigest)
   return null;
  return {ql434Digest:a.recordDigest,ql433Digest:b.recordDigest,
   ql432Digest:c.recordDigest,ql431Digest:d.recordDigest};
 }catch{return null;}
}
function contextFrom(r,custody,challengeId,challengeNonce,leaseExpiresAt){
 return {schema:'rosevear.ql435.isolated-pilot-enrollment-request.v1',
  scope:r.scope,incidentId:r.incidentId,
  nextCeremonyId:r.nextCeremonyId,nextEpisodeId:r.nextEpisodeId,
  sourceRevision:r.scope.sourceRevision,controllerRevision:r.scope.controllerRevision,
  originalHostId:'DESKTOP-AE894KC',authorityId:r.authorityId,
  ql431CheckpointDigest:custody.ql431Digest,
  ql432OwnerReceiptDigest:custody.ql432Digest,
  ql433PrecheckReceiptDigest:custody.ql433Digest,
  ql434ReadinessReceiptDigest:custody.ql434Digest,
  ql434HandoffWitnessDigest:r.handoffWitnessDigest,
  challengeId,challengeNonce,leaseExpiresAt,
  requestedAction:'ONE_ISOLATED_PILOT_ON_CHALLENGE_WITH_FAIL_CLOSED_SHUTDOWN_NO_CONNECTED'};
}
/** A signed export proposal does not activate the receiver, sign enrollment,
 * or prove that any external runtime exists.
 */
export function prepareQl435OriginalHostEnrollment({
 ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
 ql432Decision,ql432Ledger,ql431Store,
 challengeId,challengeNonce,leaseExpiresAt
},{nowMs,protectedOriginalHostSession=false,
  independentQl434ReadinessVerified=false}={}){
 if(!protectedOriginalHostSession||!independentQl434ReadinessVerified||
  !Number.isSafeInteger(nowMs)||!ID.test(challengeId??'')||
  !ID.test(challengeNonce??'')||
  typeof leaseExpiresAt!=='string'||!Number.isFinite(Date.parse(leaseExpiresAt))||
  new Date(Date.parse(leaseExpiresAt)).toISOString()!==leaseExpiresAt||
  Date.parse(leaseExpiresAt)<=nowMs||Date.parse(leaseExpiresAt)>nowMs+MAX_LEASE)
  return hold('ORIGINAL_HOST_FRESH_SHORT_LEASE_AND_ENROLLMENT_AUTHORITY_REQUIRED');
 const custody=verifiedPrior(ql434Readiness,ql434Ledger,
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store);
 if(!custody)return hold('EXACT_QL431_TO_QL434_PROTECTED_CHAIN_REQUIRED');
 const request=contextFrom(ql434Readiness,custody,challengeId,challengeNonce,leaseExpiresAt);
 return {state:'QL435_ISOLATED_PILOT_ENROLLMENT_PREPARED_NOT_ISSUED',
  request,requestDigest:digest(request),
  connection:'HOLD',receiver:'OFF_NOT_ACTIVATED_BY_QL435',
  activationAuthorized:false,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function verifiedHostEnrollment(e,request,opts){
 const p=e?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','requestDigest','scope','incidentId','challengeId',
   'challengeNonce','nextCeremonyId','nextEpisodeId','hostMachineId',
   'receiverState','failClosedShutdownArmed','leaseExpiresAt',
   'enrollmentStatus','enrolledAt'])&&
  p.schema==='rosevear.ql435.original-host-fresh-ceremony-enrollment.v1'&&
  p.requestDigest===digest(request)&&equal(p.scope,request.scope)&&
  p.incidentId===request.incidentId&&p.challengeId===request.challengeId&&
  p.challengeNonce===request.challengeNonce&&
  p.nextCeremonyId===request.nextCeremonyId&&
  p.nextEpisodeId===request.nextEpisodeId&&
  p.hostMachineId==='DESKTOP-AE894KC'&&p.receiverState==='OFF'&&
  p.failClosedShutdownArmed===true&&p.leaseExpiresAt===request.leaseExpiresAt&&
  p.enrollmentStatus==='FRESH_ISOLATED_ONE_TEST_ENROLLMENT_NOT_ENABLED'&&
  fresh(p.enrolledAt,opts.nowMs)&&
  Date.parse(p.enrolledAt)<Date.parse(request.leaseExpiresAt)&&
  signatureValid(p,e.signature,opts.originalHostPin);
}
function verifiedIndependentPreOff(e,request,host,opts){
 const p=e?.payload;
 return opts.independentPreOffPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','challengeId','challengeNonce','hostEnrollmentDigest',
   'leaseExpiresAt','receiverState','observedAt'])&&
  p.schema==='rosevear.ql435.independent-pre-on-off.v1'&&
  p.challengeId===request.challengeId&&p.challengeNonce===request.challengeNonce&&
  p.hostEnrollmentDigest===digest(host.payload)&&
  p.leaseExpiresAt===request.leaseExpiresAt&&p.receiverState==='OFF'&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.enrolledAt)&&
  Date.parse(p.observedAt)<Date.parse(request.leaseExpiresAt)&&
  signatureValid(p,e.signature,opts.preOffPin);
}
function verifiedOwnerPermit(e,request,host,preOff,opts){
 const p=e?.payload;
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  exact(e,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','requestDigest','hostEnrollmentDigest','preOffDigest',
   'challengeId','challengeNonce','nextCeremonyId','nextEpisodeId',
   'leaseExpiresAt','action','ownerId','reviewerId','approvedAt'])&&
  p.schema==='rosevear.ql435.owner-single-test-prepermit.v1'&&
  p.requestDigest===digest(request)&&
  p.hostEnrollmentDigest===digest(host.payload)&&
  p.preOffDigest===digest(preOff.payload)&&
  p.challengeId===request.challengeId&&p.challengeNonce===request.challengeNonce&&
  p.nextCeremonyId===request.nextCeremonyId&&p.nextEpisodeId===request.nextEpisodeId&&
  p.leaseExpiresAt===request.leaseExpiresAt&&
  p.action==='PERMIT_ONE_ISOLATED_ON_CHALLENGE_ONLY_NO_GENERAL_CONNECTED'&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&fresh(p.approvedAt,opts.nowMs)&&
  Date.parse(p.approvedAt)>=Date.parse(preOff.payload.observedAt)&&
  Date.parse(p.approvedAt)<Date.parse(request.leaseExpiresAt)&&
  signatureValid(p,e.ownerSignature,opts.ownerPin)&&
  signatureValid(p,e.reviewerSignature,opts.reviewerPin);
}
function verifiedOriginalHostOn(e,request,permit,opts){
 const p=e?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','requestDigest','challengeId','challengeNonce',
   'prePermitDigest','hostMachineId','nextCeremonyId','nextEpisodeId',
   'leaseExpiresAt','receiverState','isolatedMode',
   'failClosedShutdownArmed','observedAt'])&&
  p.schema==='rosevear.ql435.original-host-on-challenge.v1'&&
  p.requestDigest===digest(request)&&p.challengeId===request.challengeId&&
  p.challengeNonce===request.challengeNonce&&
  p.prePermitDigest===digest(permit.payload)&&
  p.hostMachineId==='DESKTOP-AE894KC'&&
  p.nextCeremonyId===request.nextCeremonyId&&p.nextEpisodeId===request.nextEpisodeId&&
  p.leaseExpiresAt===request.leaseExpiresAt&&
  p.receiverState==='ISOLATED_ONE_TEST_ON'&&
  p.isolatedMode===true&&p.failClosedShutdownArmed===true&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(permit.payload.approvedAt)&&
  Date.parse(p.observedAt)<Date.parse(request.leaseExpiresAt)&&
  signatureValid(p,e.signature,opts.originalHostPin);
}
function verifiedIndependentOn(e,request,hostOn,opts){
 const p=e?.payload;
 return opts.independentOnWitnessPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','challengeId','challengeNonce','hostOnDigest',
   'nextCeremonyId','nextEpisodeId','leaseExpiresAt',
   'receiverState','observation','observedAt'])&&
  p.schema==='rosevear.ql435.independent-on-challenge-witness.v1'&&
  p.challengeId===request.challengeId&&p.challengeNonce===request.challengeNonce&&
  p.hostOnDigest===digest(hostOn.payload)&&
  p.nextCeremonyId===request.nextCeremonyId&&p.nextEpisodeId===request.nextEpisodeId&&
  p.leaseExpiresAt===request.leaseExpiresAt&&p.receiverState==='ISOLATED_ONE_TEST_ON'&&
  p.observation==='INDEPENDENT_SINGLE_NONCE_BOUND_PILOT_ON_SEEN'&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(hostOn.payload.observedAt)&&
  Date.parse(p.observedAt)<Date.parse(request.leaseExpiresAt)&&
  signatureValid(p,e.signature,opts.onWitnessPin);
}
function verifiedMasterReports(reports,request,independentOn,opts){
 if(!Array.isArray(reports)||reports.length!==3||opts.independentMasterPinsVerified!==true||
  !opts.masterPins)return null;
 const accepted=[],seen=new Set();
 for(const e of reports){
  const p=e?.payload;
  if(!exact(e,['payload','signature'])||
   !exact(p,['schema','masterId','requestDigest','challengeId',
    'challengeNonce','independentOnWitnessDigest','nextCeremonyId',
    'nextEpisodeId','leaseExpiresAt','status','observedAt'])||
   p.schema!=='rosevear.ql435.master-isolated-pilot-decision.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   p.requestDigest!==digest(request)||
   p.challengeId!==request.challengeId||p.challengeNonce!==request.challengeNonce||
   p.independentOnWitnessDigest!==digest(independentOn.payload)||
   p.nextCeremonyId!==request.nextCeremonyId||p.nextEpisodeId!==request.nextEpisodeId||
   p.leaseExpiresAt!==request.leaseExpiresAt||
   p.status!=='SIGNED_ISOLATED_ON_EVIDENCE_REVIEW_ONLY_NO_GENERAL_CONNECTED'||
   !fresh(p.observedAt,opts.nowMs)||
   Date.parse(p.observedAt)<Date.parse(independentOn.payload.observedAt)||
   Date.parse(p.observedAt)>=Date.parse(request.leaseExpiresAt)||
   !signatureValid(p,e.signature,opts.masterPins[p.masterId]))return null;
  seen.add(p.masterId);accepted.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {reportsDigest:digest(accepted),
  latestAt:Math.max(...accepted.map(x=>Date.parse(x.observedAt)))};
}
function verifiedOwnerDecision(e,request,independentOn,masters,opts){
 const p=e?.payload;
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  exact(e,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','requestDigest','challengeId','challengeNonce',
   'independentOnWitnessDigest','mastersDigest','nextCeremonyId',
   'nextEpisodeId','leaseExpiresAt','action','ownerId','reviewerId','decidedAt'])&&
  p.schema==='rosevear.ql435.dual-owner-isolated-pilot-decision.v1'&&
  p.requestDigest===digest(request)&&p.challengeId===request.challengeId&&
  p.challengeNonce===request.challengeNonce&&
  p.independentOnWitnessDigest===digest(independentOn.payload)&&
  p.mastersDigest===masters.reportsDigest&&
  p.nextCeremonyId===request.nextCeremonyId&&p.nextEpisodeId===request.nextEpisodeId&&
  p.leaseExpiresAt===request.leaseExpiresAt&&
  p.action==='RECOGNIZE_SINGLE_PILOT_ON_EVIDENCE_ONLY_MANDATORY_OFF_RECHECK'&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&fresh(p.decidedAt,opts.nowMs)&&
  Date.parse(p.decidedAt)>=masters.latestAt&&
  Date.parse(p.decidedAt)<Date.parse(request.leaseExpiresAt)&&
  signatureValid(p,e.ownerSignature,opts.ownerPin)&&
  signatureValid(p,e.reviewerSignature,opts.reviewerPin);
}
/** PENDING is durable before first receiver ON challenge evidence is read.
 * No automatic enable is performed; on interrupted/failed challenge require
 * supervised receiver isolation, never claim OFF from an unknown state.
 */
export function openQl435ProtectedPilotLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL435_ABSOLUTE_PROTECTED_LEDGER_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL435_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','accepted'].includes(kind)||!ID.test(id??''))
   throw Error('QL435_INVALID_LEDGER_KEY');
  return join(root,'ql435-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;
  try{raw=readFileSync(file(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL435_RECORD_OVERSIZE');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL435_RECORD_CORRUPT');}
  if(!exact(rec,['schema','kind','ceremonyId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql435.pilot-custody-receipt.v1'||
   rec.kind!==kind||rec.ceremonyId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==digest({schema:rec.schema,kind,ceremonyId:id,
    evidenceDigest:rec.evidenceDigest}))
   throw Error('QL435_RECEIPT_TAMPERED');
  return rec;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL435_BAD_CUSTODY_DIGEST');
  if(read(kind,id))throw Error('QL435_REPLAYED_CEREMONY');
  const rec={schema:'rosevear.ql435.pilot-custody-receipt.v1',
   kind,ceremonyId:id,evidenceDigest};
  rec.recordDigest=digest(rec);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dirfd=openSync(root,'r');try{fsyncSync(dirfd);}finally{closeSync(dirfd);}
  if(read(kind,id)?.recordDigest!==rec.recordDigest)throw Error('QL435_CUSTODY_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
export async function runQl435OriginalHostPilotDecision({
 ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
 ql432Decision,ql432Ledger,ql431Store,pilotLedger,
 challengeId,challengeNonce,leaseExpiresAt,
 originalHostAdapter,independentPreOffProvider,
 ownerPrePermit,independentOnWitnessProvider,
 masterEvidenceProvider,ownerDecision
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl434ReadinessVerified!==true||
  typeof pilotLedger?.read!=='function'||typeof pilotLedger?.claimOnce!=='function'||
  typeof originalHostAdapter?.readSignedEnrollment!=='function'||
  typeof originalHostAdapter?.readSignedOnChallenge!=='function'||
  typeof independentPreOffProvider?.readSignedOff!=='function'||
  typeof independentOnWitnessProvider?.readSignedOn!=='function'||
  typeof masterEvidenceProvider?.readSignedReports!=='function')
  return hold('ORIGINAL_HOST_SUPERVISED_ISOLATED_PILOT_AUTHORITY_REQUIRED');
 const prep=prepareQl435OriginalHostEnrollment({
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store,
  challengeId,challengeNonce,leaseExpiresAt
 },{nowMs:opts.nowMs,protectedOriginalHostSession:true,
   independentQl434ReadinessVerified:true});
 if(prep.state!=='QL435_ISOLATED_PILOT_ENROLLMENT_PREPARED_NOT_ISSUED')
  return hold('PRIOR_CUSTODY_OR_BOUNDED_FRESH_CHALLENGE_INVALID');
 const req=prep.request;
 const pins=[opts.originalHostPin,opts.preOffPin,opts.onWitnessPin,
  opts.ownerPin,opts.reviewerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string')||new Set(pins).size!==pins.length)
  return hold('INDEPENDENT_PINNED_SIGNER_CUSTODY_REQUIRED');
 try{
  if(pilotLedger.read('pending',req.nextCeremonyId)||
   pilotLedger.read('accepted',req.nextCeremonyId))
   return hold('QL435_CEREMONY_ALREADY_CONSUMED');
 }catch{return hold('QL435_PRIVATE_PILOT_LEDGER_UNREADABLE');}
 let enrollment;
 try{enrollment=await originalHostAdapter.readSignedEnrollment({
  request:req,requestDigest:prep.requestDigest,
  challengeId,challengeNonce,requiredState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_ENROLLMENT_NOT_AVAILABLE');}
 if(!verifiedHostEnrollment(enrollment,req,opts))
  return hold('FRESH_ORIGINAL_HOST_FAIL_CLOSED_ENROLLMENT_REJECTED');
 let preOff;
 try{preOff=await independentPreOffProvider.readSignedOff({
  request:req,hostEnrollmentDigest:digest(enrollment.payload),requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_PRE_CHALLENGE_RECEIVER_OFF_UNAVAILABLE');}
 if(!verifiedIndependentPreOff(preOff,req,enrollment,opts))
  return hold('SIGNED_PRE_CHALLENGE_INDEPENDENT_OFF_REJECTED');
 if(!verifiedOwnerPermit(ownerPrePermit,req,enrollment,preOff,opts))
  return hold('OWNER_DUAL_SIGNED_SHORT_LEASE_PREPERMIT_REJECTED');
 // Commit a one-use incident checkpoint *before* requesting any ON evidence.
 let pending;
 try{
  const latest=verifiedPrior(ql434Readiness,ql434Ledger,ql433Precheck,
   ql433Ledger,ql432Decision,ql432Ledger,ql431Store);
  if(!latest||latest.ql434Digest!==req.ql434ReadinessReceiptDigest||
   latest.ql431Digest!==req.ql431CheckpointDigest)
   return hold('PRIOR_CUSTODY_CHANGED_BEFORE_ISOLATED_PILOT_CHALLENGE');
  pending=pilotLedger.claimOnce('pending',req.nextCeremonyId,digest({
   requestDigest:prep.requestDigest,enrollmentDigest:digest(enrollment.payload),
   independentPreOffDigest:digest(preOff.payload),
   prePermitDigest:digest(ownerPrePermit.payload)}));
  if(pilotLedger.read('pending',req.nextCeremonyId)?.recordDigest!==pending.recordDigest)
   throw Error('QL435_PENDING_CUSTODY_NOT_DURABLY_READABLE');
 }catch{return hold('PENDING_ISOLATED_PILOT_CUSTODY_WRITE_FAILED');}
 // From here the signed ON challenge may have occurred. Never claim OFF from
 // a missing or invalid response; original-host fail-closed shutdown is needed.
 let hostOn;
 try{hostOn=await originalHostAdapter.readSignedOnChallenge({
  request:req,challengeId,challengeNonce,
  prePermitDigest:digest(ownerPrePermit.payload),
  pendingReceiptDigest:pending.recordDigest,
  leaseExpiresAt});}
 catch{return hold('ORIGINAL_HOST_ON_CHALLENGE_UNAVAILABLE_REQUIRE_SHUTDOWN',true);}
 if(!verifiedOriginalHostOn(hostOn,req,ownerPrePermit,opts))
  return hold('ORIGINAL_HOST_SIGNED_ISOLATED_ON_CHALLENGE_INVALID_REQUIRE_SHUTDOWN',true);
 let witness;
 try{witness=await independentOnWitnessProvider.readSignedOn({
  request:req,hostOnDigest:digest(hostOn.payload),challengeId,challengeNonce,
  leaseExpiresAt});}
 catch{return hold('INDEPENDENT_ON_CHALLENGE_WITNESS_UNAVAILABLE_REQUIRE_SHUTDOWN',true);}
 if(!verifiedIndependentOn(witness,req,hostOn,opts))
  return hold('INDEPENDENT_SIGNED_ON_WITNESS_REJECTED_REQUIRE_SHUTDOWN',true);
 let reports;
 try{reports=await masterEvidenceProvider.readSignedReports({
  request:req,independentOnWitnessDigest:digest(witness.payload),
  challengeId,challengeNonce,leaseExpiresAt});}
 catch{return hold('THREE_MASTER_ON_EVIDENCE_DECISION_UNAVAILABLE_REQUIRE_SHUTDOWN',true);}
 const masters=verifiedMasterReports(reports,req,witness,opts);
 if(!masters)return hold('THREE_MASTER_ISOLATED_ON_DECISION_REJECTED_REQUIRE_SHUTDOWN',true);
 if(!verifiedOwnerDecision(ownerDecision,req,witness,masters,opts))
  return hold('DUAL_OWNER_ISOLATED_ON_REVIEW_REJECTED_REQUIRE_SHUTDOWN',true);
 try{
  const latest=verifiedPrior(ql434Readiness,ql434Ledger,ql433Precheck,
   ql433Ledger,ql432Decision,ql432Ledger,ql431Store);
  if(!latest||latest.ql434Digest!==req.ql434ReadinessReceiptDigest||
   latest.ql431Digest!==req.ql431CheckpointDigest||
   pilotLedger.read('pending',req.nextCeremonyId)?.recordDigest!==pending.recordDigest)
   return hold('DURABLE_CUSTODY_CHANGED_DURING_ISOLATED_ON_REQUIRE_SHUTDOWN',true);
  const accepted=pilotLedger.claimOnce('accepted',req.nextCeremonyId,digest({
   requestDigest:prep.requestDigest,pendingRecordDigest:pending.recordDigest,
   hostOnDigest:digest(hostOn.payload),independentOnWitnessDigest:digest(witness.payload),
   mastersDigest:masters.reportsDigest,ownerDecisionDigest:digest(ownerDecision.payload)}));
  if(pilotLedger.read('accepted',req.nextCeremonyId)?.recordDigest!==accepted.recordDigest)
   throw Error('QL435_ACCEPTED_CUSTODY_NOT_READABLE');
  // Evidence accepted, not runtime CONNECTED or full production activation.
  return {...hold('PILOT_ON_EVIDENCE_ACCEPTED_OFF_REVALIDATION_REQUIRED',true),
   state:'DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION',
   receiver:'ISOLATED_ONE_TEST_ON_SIGNED_WITNESS_ONLY',
   ownerAcceptance:'DUAL_SIGNED_SINGLE_PILOT_EVIDENCE_REVIEW',
   originalIncidentId:req.incidentId,
   nextCeremonyId:req.nextCeremonyId,nextEpisodeId:req.nextEpisodeId,
   challengeId:req.challengeId,challengeNonce:req.challengeNonce,
   leaseExpiresAt:req.leaseExpiresAt,masterCount:3,
   pendingReceiptDigest:pending.recordDigest,
   acceptedReceiptDigest:accepted.recordDigest,
   independentOnWitnessDigest:digest(witness.payload),
   permittedNextAction:'SUPERVISED_FAIL_CLOSED_OFF_AND_SIGNED_RUNTIME_CONTINUITY_RECHECK_ONLY'};
 }catch{return hold('PILOT_ON_EVIDENCE_CUSTODY_COMMIT_FAILED_REQUIRE_SHUTDOWN',true);}
}
