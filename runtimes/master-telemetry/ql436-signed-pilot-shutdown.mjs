import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const WINDOW_MS=60000;
const sha256=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,fields)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&fields.every(f=>Object.hasOwn(x,f));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const iso=(s)=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s;
const fresh=(s,now)=>iso(s)&&Number.isSafeInteger(now)&&
 Date.parse(s)<=now&&now-Date.parse(s)<=WINDOW_MS;
const hold=(reason)=>({state:'HOLD',reason,connection:'HOLD',
 receiver:'UNKNOWN_UNTIL_INDEPENDENT_SIGNED_OFF',
 activationAuthorized:false,ownerAcceptance:'HOLD',
 manualReceiverIsolationRequired:true,runtimeUptime:'UNKNOWN',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signed(p,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const key=createPublicKey({key:der,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
function custody(q435,l435,q434,l434,q433,l433,q432,l432,s431){
 const s=q434?.scope;
 if(q435?.state!=='DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION'||
  q435.connection!=='HOLD'||q435.activationAuthorized!==false||
  q435.receiver!=='ISOLATED_ONE_TEST_ON_SIGNED_WITNESS_ONLY'||
  q435.ownerAcceptance!=='DUAL_SIGNED_SINGLE_PILOT_EVIDENCE_REVIEW'||
  q435.manualReceiverIsolationRequired!==true||q435.masterCount!==3||
  q435.slaveGate!=='HOLD_NEXT_MASTER_INTEGRATION_STAGE'||
  q435.permittedNextAction!=='SUPERVISED_FAIL_CLOSED_OFF_AND_SIGNED_RUNTIME_CONTINUITY_RECHECK_ONLY'||
  !ID.test(q435.originalIncidentId??'')||!ID.test(q435.nextCeremonyId??'')||
  !ID.test(q435.nextEpisodeId??'')||!ID.test(q435.challengeId??'')||
  !ID.test(q435.challengeNonce??'')||!iso(q435.leaseExpiresAt)||
  !HEX.test(q435.pendingReceiptDigest??'')||
  !HEX.test(q435.acceptedReceiptDigest??'')||
  !HEX.test(q435.independentOnWitnessDigest??'')||
  q434?.state!=='DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF'||
  q434.connection!=='HOLD'||q434.activationAuthorized!==false||
  q434.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  q434.ownerAcceptance!=='DUAL_SIGNED_READINESS_ONLY'||
  q434.masterCount!==3||
  q434.incidentId!==q435.originalIncidentId||
  q434.nextCeremonyId!==q435.nextCeremonyId||
  q434.nextEpisodeId!==q435.nextEpisodeId||
  !HEX.test(q434.readinessRecordDigest??'')||
  q433?.state!=='DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY'||
  q433.connection!=='HOLD'||q433.incidentId!==q435.originalIncidentId||
  q433.nextCeremonyId!==q435.nextCeremonyId||
  q433.nextEpisodeId!==q435.nextEpisodeId||
  q433.masterCount!==3||!HEX.test(q433.precheckRecordDigest??'')||
  q432?.state!=='DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW'||
  q432.connection!=='HOLD'||q432.receiver!=='OFF_VERIFIED_SIGNED_READBACK'||
  q432.incidentId!==q435.originalIncidentId||
  !HEX.test(q432.ownerReviewReceiptDigest??'')||
  !HEX.test(q432.checkpointDigest??'')||
  !Number.isSafeInteger(q432.checkpointIndex)||q432.checkpointIndex<3||
  !same(q434.scope,q433.scope)||!same(q433.scope,q432.scope)||
  typeof l435?.read!=='function'||typeof l434?.read!=='function'||
  typeof l433?.read!=='function'||typeof l432?.read!=='function'||
  typeof s431?.read!=='function')return null;
 try{
  const p=l435.read('pending',q435.nextCeremonyId),
   a=l435.read('accepted',q435.nextCeremonyId),
   b=l434.read(q435.originalIncidentId),
   c=l433.read(q435.originalIncidentId),
   d=l432.read(q435.originalIncidentId),
   e=s431.read(s);
  if(p?.recordDigest!==q435.pendingReceiptDigest||
   a?.recordDigest!==q435.acceptedReceiptDigest||
   b?.recordDigest!==q434.readinessRecordDigest||
   c?.recordDigest!==q433.precheckRecordDigest||
   d?.recordDigest!==q432.ownerReviewReceiptDigest||
   e?.entry?.kind!=='RECONCILED'||
   e.entry.incidentId!==q435.originalIncidentId||
   e.index!==q432.checkpointIndex||
   e.recordDigest!==q432.checkpointDigest)return null;
  return {ql435PendingDigest:p.recordDigest,ql435AcceptedDigest:a.recordDigest,
   ql434Digest:b.recordDigest,ql433Digest:c.recordDigest,
   ql432Digest:d.recordDigest,ql431Digest:e.recordDigest,scope:s};
 }catch{return null;}
}
export function prepareQl436ShutdownReconciliation({
 ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
 shutdownNonce,incidentReviewId
},{nowMs,protectedOriginalHostSession=false,
 independentQl435DecisionVerified=false}={}){
 if(!protectedOriginalHostSession||!independentQl435DecisionVerified||
  !Number.isSafeInteger(nowMs)||!ID.test(shutdownNonce??'')||
  !ID.test(incidentReviewId??'')||
  !iso(ql435Decision?.leaseExpiresAt)||
  nowMs-Date.parse(ql435Decision.leaseExpiresAt)>WINDOW_MS)
  return hold('PROTECTED_ORIGINAL_HOST_FRESH_POST_PILOT_AUTHORITY_REQUIRED');
 const prior=custody(ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store);
 if(!prior)return hold('EXACT_QL431_TO_QL435_PRIVATE_CUSTODY_REQUIRED');
 const q=ql435Decision;
 const request={schema:'rosevear.ql436.supervised-shutdown-reconciliation.v1',
  scope:prior.scope,originalIncidentId:q.originalIncidentId,
  incidentReviewId,nextCeremonyId:q.nextCeremonyId,
  nextEpisodeId:q.nextEpisodeId,challengeId:q.challengeId,
  originalChallengeNonce:q.challengeNonce,shutdownNonce,
  leaseExpiresAt:q.leaseExpiresAt,
  ql431CheckpointDigest:prior.ql431Digest,
  ql432OwnerReceiptDigest:prior.ql432Digest,
  ql433PrecheckReceiptDigest:prior.ql433Digest,
  ql434ReadinessReceiptDigest:prior.ql434Digest,
  ql435PendingReceiptDigest:prior.ql435PendingDigest,
  ql435AcceptedReceiptDigest:prior.ql435AcceptedDigest,
  ql435IndependentOnWitnessDigest:q.independentOnWitnessDigest,
  originalHostId:'DESKTOP-AE894KC',
  requestedAction:'READ_SIGNED_SHUTDOWN_AND_INDEPENDENT_OFF_NO_REACTIVATION',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL436_SHUTDOWN_RECONCILIATION_PREPARED_NOT_CONFIRMED',
  request,requestDigest:sha256(request),
  connection:'HOLD',receiver:'UNKNOWN_UNTIL_INDEPENDENT_SIGNED_OFF',
  activationAuthorized:false,manualReceiverIsolationRequired:true,
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function originalHostShutdown(env,r,opts){
 const p=env?.payload;
 if(opts.independentOriginalHostPinVerified!==true||
  !exact(env,['payload','signature'])||
  !exact(p,['schema','requestDigest','hostMachineId','scope',
   'originalIncidentId','incidentReviewId','nextCeremonyId',
   'nextEpisodeId','challengeId','originalChallengeNonce',
   'shutdownNonce','leaseExpiresAt','ql435AcceptedReceiptDigest',
   'shutdownMechanism','receiverState','shutdownAt','observedAt',
   'shutdownSequence'])||
  p.schema!=='rosevear.ql436.original-host-signed-shutdown.v1'||
  p.requestDigest!==sha256(r)||p.hostMachineId!=='DESKTOP-AE894KC'||
  !same(p.scope,r.scope)||p.originalIncidentId!==r.originalIncidentId||
  p.incidentReviewId!==r.incidentReviewId||
  p.nextCeremonyId!==r.nextCeremonyId||p.nextEpisodeId!==r.nextEpisodeId||
  p.challengeId!==r.challengeId||
  p.originalChallengeNonce!==r.originalChallengeNonce||
  p.shutdownNonce!==r.shutdownNonce||
  p.leaseExpiresAt!==r.leaseExpiresAt||
  p.ql435AcceptedReceiptDigest!==r.ql435AcceptedReceiptDigest||
  p.shutdownMechanism!=='ORIGINAL_HOST_FAIL_CLOSED_PILOT_DISABLE'||
  p.receiverState!=='OFF'||!Number.isSafeInteger(p.shutdownSequence)||
  p.shutdownSequence<1||
  !fresh(p.shutdownAt,opts.nowMs)||!fresh(p.observedAt,opts.nowMs)||
  Date.parse(p.observedAt)<Date.parse(p.shutdownAt)||
  !signed(p,env.signature,opts.originalHostPin))return false;
 return true;
}
function independentlyVerifiedOff(env,r,host,opts){
 const p=env?.payload;
 return opts.independentReceiverPinVerified===true&&
  exact(env,['payload','signature'])&&
  exact(p,['schema','requestDigest','originalIncidentId','incidentReviewId',
   'nextCeremonyId','challengeId','shutdownNonce',
   'hostShutdownDigest','leaseExpiresAt','receiverState',
   'offContinuitySequence','observedAt'])&&
  p.schema==='rosevear.ql436.independent-receiver-off-readback.v1'&&
  p.requestDigest===sha256(r)&&
  p.originalIncidentId===r.originalIncidentId&&
  p.incidentReviewId===r.incidentReviewId&&
  p.nextCeremonyId===r.nextCeremonyId&&p.challengeId===r.challengeId&&
  p.shutdownNonce===r.shutdownNonce&&
  p.hostShutdownDigest===sha256(host.payload)&&
  p.leaseExpiresAt===r.leaseExpiresAt&&p.receiverState==='OFF'&&
  Number.isSafeInteger(p.offContinuitySequence)&&p.offContinuitySequence>=1&&
  !(!Number.isSafeInteger(host.payload.shutdownSequence)||
    p.offContinuitySequence<host.payload.shutdownSequence)&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  signed(p,env.signature,opts.receiverPin);
}
function classifyLease(request,host,independent){
 const limit=Date.parse(request.leaseExpiresAt);
 const shut=Date.parse(host.payload.shutdownAt);
 const witness=Date.parse(independent.payload.observedAt);
 if(shut>limit)return 'LATE_HOST_SHUTDOWN_ESCALATION';
 if(witness>limit)return 'LATE_INDEPENDENT_OFF_READBACK_ESCALATION';
 return 'WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED';
}
function mastersAccepted(reports,r,host,receiver,disposition,opts){
 if(opts.independentMasterPinsVerified!==true||
  !Array.isArray(reports)||reports.length!==3||!opts.masterPins)return null;
 const seen=new Set(),accepted=[];
 for(const env of reports){
  const p=env?.payload;
  if(!exact(env,['payload','signature'])||
   !exact(p,['schema','masterId','requestDigest','incidentReviewId',
    'originalIncidentId','nextCeremonyId','shutdownNonce',
    'hostShutdownDigest','independentOffDigest','leaseExpiresAt',
    'leaseDisposition','decision','observedAt'])||
   p.schema!=='rosevear.ql436.three-master-shutdown-continuity.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   p.requestDigest!==sha256(r)||
   p.incidentReviewId!==r.incidentReviewId||
   p.originalIncidentId!==r.originalIncidentId||
   p.nextCeremonyId!==r.nextCeremonyId||
   p.shutdownNonce!==r.shutdownNonce||
   p.hostShutdownDigest!==sha256(host.payload)||
   p.independentOffDigest!==sha256(receiver.payload)||
   p.leaseExpiresAt!==r.leaseExpiresAt||
   p.leaseDisposition!==disposition||
   p.decision!=='ACK_SIGNED_OFF_NO_REACTIVATION'||!fresh(p.observedAt,opts.nowMs)||
   Date.parse(p.observedAt)<Date.parse(receiver.payload.observedAt)||
   !signed(p,env.signature,opts.masterPins[p.masterId]))return null;
  seen.add(p.masterId);accepted.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 return {digest:sha256(accepted),
  latest:Math.max(...accepted.map(x=>Date.parse(x.observedAt)))};
}
function ownerReview(env,r,host,off,disposition,masters,opts){
 const p=env?.payload;
 const action=disposition==='WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED'?
  'ACK_SIGNED_OFF_WITHIN_LEASE_RETAIN_HOLD':
  'ACK_SIGNED_OFF_AND_ESCALATE_LEASE_EXCEPTION_RETAIN_HOLD';
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  exact(env,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','requestDigest','incidentReviewId',
   'originalIncidentId','nextCeremonyId','shutdownNonce',
   'hostShutdownDigest','independentOffDigest','mastersDigest',
   'leaseDisposition','action','ownerId','reviewerId','reviewedAt'])&&
  p.schema==='rosevear.ql436.dual-owner-shutdown-incident-review.v1'&&
  p.requestDigest===sha256(r)&&p.incidentReviewId===r.incidentReviewId&&
  p.originalIncidentId===r.originalIncidentId&&
  p.nextCeremonyId===r.nextCeremonyId&&p.shutdownNonce===r.shutdownNonce&&
  p.hostShutdownDigest===sha256(host.payload)&&
  p.independentOffDigest===sha256(off.payload)&&
  p.mastersDigest===masters.digest&&p.leaseDisposition===disposition&&
  p.action===action&&PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&typeof opts.ownerPin==='string'&&
  opts.ownerPin!==opts.reviewerPin&&fresh(p.reviewedAt,opts.nowMs)&&
  Date.parse(p.reviewedAt)>=masters.latest&&
  signed(p,env.ownerSignature,opts.ownerPin)&&
  signed(p,env.reviewerSignature,opts.reviewerPin);
}
export function openQl436ProtectedShutdownLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL436_PROTECTED_ABSOLUTE_LEDGER_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL436_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,ceremony)=>{
  if(!['pending','reconciled'].includes(kind)||!ID.test(ceremony??''))
   throw Error('QL436_INVALID_LEDGER_KEY');
  return join(root,'ql436-'+kind+'-'+ceremony+'.json');
 };
 const read=(kind,ceremony)=>{
  let raw;try{raw=readFileSync(file(kind,ceremony),'utf8');}
  catch(err){if(err.code==='ENOENT')return null;throw err;}
  if(raw.length>4096)throw Error('QL436_RECORD_OVERSIZE');
  let o;try{o=JSON.parse(raw);}catch{throw Error('QL436_RECORD_INVALID');}
  if(!exact(o,['schema','kind','ceremonyId','evidenceDigest','recordDigest'])||
   o.schema!=='rosevear.ql436.isolated-pilot-shutdown-custody.v1'||
   o.kind!==kind||o.ceremonyId!==ceremony||
   !HEX.test(o.evidenceDigest??'')||
   o.recordDigest!==sha256({schema:o.schema,kind,ceremonyId:ceremony,
    evidenceDigest:o.evidenceDigest}))throw Error('QL436_RECORD_TAMPERED');
  return o;
 };
 const claimOnce=(kind,ceremony,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL436_BAD_EVIDENCE_DIGEST');
  if(read(kind,ceremony))throw Error('QL436_REPLAYED_SHUTDOWN');
  const rec={schema:'rosevear.ql436.isolated-pilot-shutdown-custody.v1',
   kind,ceremonyId:ceremony,evidenceDigest};
  rec.recordDigest=sha256(rec);
  const fd=openSync(file(kind,ceremony),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}
  finally{closeSync(fd);}
  const dirfd=openSync(root,'r');
  try{fsyncSync(dirfd);}finally{closeSync(dirfd);}
  if(read(kind,ceremony)?.recordDigest!==rec.recordDigest)
   throw Error('QL436_RECORD_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
/** HOLD-only status for interrupted shutdown review, not proof of receiver OFF. */
export function readQl436IncidentContinuity(ledger,ceremony){
 try{
  const pending=ledger.read('pending',ceremony);
  const reconciled=ledger.read('reconciled',ceremony);
  if(reconciled&&!pending)return hold('QL436_RECONCILED_WITHOUT_PENDING_INVALID');
  if(reconciled)return {state:'DURABLE_RECEIPTS_PRESENT_INDEPENDENT_OFF_RECHECK_REQUIRED',
   connection:'HOLD',receiver:'OFF_MUST_BE_FRESHLY_REVALIDATED',
   activationAuthorized:false,manualReceiverIsolationRequired:true,
   pendingReceiptDigest:pending.recordDigest,
   reconciledReceiptDigest:reconciled.recordDigest,
   slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
  return pending?{...hold('PENDING_SIGNED_SHUTDOWN_RECONCILIATION_INCOMPLETE'),
   pendingReceiptDigest:pending.recordDigest}:hold('NO_SIGNED_SHUTDOWN_REVIEW_ON_FILE');
 }catch{return hold('QL436_DURABLE_INCIDENT_LEDGER_UNREADABLE');}
}
/** Never changes receiver state. Protected original-host and independent
 * external adapters supply signed OFF evidence. PENDING is durably recorded
 * before external reads; any failure retains HOLD and manual isolation.
 */
export async function runQl436SignedShutdownReconciliation({
 ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
 shutdownLedger,shutdownNonce,incidentReviewId,
 originalHostAdapter,independentReceiverAdapter,masterEvidenceProvider,
 ownerDecision
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl435DecisionVerified!==true||
  typeof shutdownLedger?.read!=='function'||
  typeof shutdownLedger?.claimOnce!=='function'||
  typeof originalHostAdapter?.readSignedShutdown!=='function'||
  typeof independentReceiverAdapter?.readSignedOff!=='function'||
  typeof masterEvidenceProvider?.readSignedReports!=='function')
  return hold('QL436_PROTECTED_SUPERVISED_SHUTDOWN_AUTHORITY_REQUIRED');
 const prep=prepareQl436ShutdownReconciliation({
  ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  shutdownNonce,incidentReviewId
 },{nowMs:opts.nowMs,protectedOriginalHostSession:true,
   independentQl435DecisionVerified:true});
 if(prep.state!=='QL436_SHUTDOWN_RECONCILIATION_PREPARED_NOT_CONFIRMED')
  return hold('QL435_SIGNED_PILOT_CUSTODY_OR_REVIEW_SCOPE_INVALID');
 const r=prep.request;
 const pins=[opts.originalHostPin,opts.receiverPin,opts.ownerPin,
  opts.reviewerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(pin=>typeof pin!=='string')||new Set(pins).size!==pins.length)
  return hold('INDEPENDENT_SIGNER_CUSTODY_REQUIRED');
 try{
  if(shutdownLedger.read('pending',r.nextCeremonyId)||
   shutdownLedger.read('reconciled',r.nextCeremonyId))
   return hold('QL436_SHUTDOWN_REVIEW_ALREADY_STARTED_OR_CONCLUDED');
 }catch{return hold('QL436_SHUTDOWN_LEDGER_UNREADABLE');}
 let pending;
 try{
  pending=shutdownLedger.claimOnce('pending',r.nextCeremonyId,sha256({
   requestDigest:prep.requestDigest,originalIncidentId:r.originalIncidentId,
   incidentReviewId:r.incidentReviewId,shutdownNonce,leaseExpiresAt:r.leaseExpiresAt}));
  if(shutdownLedger.read('pending',r.nextCeremonyId)?.recordDigest!==pending.recordDigest)
   throw Error('PENDING_READBACK_FAILED');
 }catch{return hold('QL436_PENDING_INCIDENT_CUSTODY_WRITE_FAILED');}
 let host;
 try{host=await originalHostAdapter.readSignedShutdown({
  request:r,requestDigest:prep.requestDigest,
  pendingReceiptDigest:pending.recordDigest,shutdownNonce,
  requiredState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_SIGNED_SHUTDOWN_UNAVAILABLE');}
 if(!originalHostShutdown(host,r,opts))
  return hold('ORIGINAL_HOST_SIGNED_OFF_SHUTDOWN_NOT_VERIFIED');
 let off;
 try{off=await independentReceiverAdapter.readSignedOff({
  request:r,requestDigest:prep.requestDigest,
  hostShutdownDigest:sha256(host.payload),shutdownNonce,
  requiredState:'OFF'});}
 catch{return hold('INDEPENDENT_RECEIVER_OFF_READBACK_UNAVAILABLE');}
 if(!independentlyVerifiedOff(off,r,host,opts))
  return hold('INDEPENDENT_SIGNED_RECEIVER_OFF_READBACK_REJECTED');
 const disposition=classifyLease(r,host,off);
 let reports;
 try{reports=await masterEvidenceProvider.readSignedReports({
  request:r,hostShutdownDigest:sha256(host.payload),
  independentOffDigest:sha256(off.payload),
  leaseDisposition:disposition});}
 catch{return hold('THREE_MASTER_SIGNED_INCIDENT_CONTINUITY_UNAVAILABLE');}
 const masters=mastersAccepted(reports,r,host,off,disposition,opts);
 if(!masters)return hold('THREE_MASTER_SIGNED_SHUTDOWN_CUSTODY_MISMATCH');
 if(!ownerReview(ownerDecision,r,host,off,disposition,masters,opts))
  return hold('DUAL_OWNER_SHUTDOWN_AND_EXPIRY_REVIEW_REJECTED');
 try{
  const current=custody(ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
   ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store);
  if(!current||current.ql435AcceptedDigest!==r.ql435AcceptedReceiptDigest||
   current.ql431Digest!==r.ql431CheckpointDigest||
   shutdownLedger.read('pending',r.nextCeremonyId)?.recordDigest!==pending.recordDigest)
   return hold('PROTECTED_INCIDENT_CUSTODY_CHANGED_BEFORE_OFF_COMMIT');
  const reconciled=shutdownLedger.claimOnce('reconciled',r.nextCeremonyId,sha256({
   requestDigest:prep.requestDigest,pendingDigest:pending.recordDigest,
   hostShutdownDigest:sha256(host.payload),
   independentOffDigest:sha256(off.payload),leaseDisposition:disposition,
   mastersDigest:masters.digest,ownerDecisionDigest:sha256(ownerDecision.payload)}));
  if(shutdownLedger.read('reconciled',r.nextCeremonyId)?.recordDigest!==reconciled.recordDigest)
   throw Error('QL436_RECONCILED_READBACK_FAILED');
  return {...hold('SIGNATURE_VERIFIED_OFF_RECONCILED_NEXT_CEREMONY_REQUIRES_FRESH_AUTHORITY'),
   state:'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED',
   receiver:'OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK',
   ownerAcceptance:'DUAL_SIGNED_OFF_AND_EXPIRY_REVIEW_ONLY',
   originalIncidentId:r.originalIncidentId,
   incidentReviewId:r.incidentReviewId,nextCeremonyId:r.nextCeremonyId,
   shutdownNonce:r.shutdownNonce,leaseExpiresAt:r.leaseExpiresAt,
   leaseDisposition:disposition,
   leaseExceptionEscalationRequired:disposition!=='WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED',
   masterCount:3,pendingReceiptDigest:pending.recordDigest,
   reconciledReceiptDigest:reconciled.recordDigest,
   permittedNextAction:'SUPERVISED_POST_OFF_CONTINUITY_REVIEW_NO_AUTOMATIC_REENTRY'};
 }catch{return hold('QL436_POST_PILOT_OFF_CUSTODY_COMMIT_OR_REPLAY_FAILED');}
}
