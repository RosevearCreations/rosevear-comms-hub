import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const REMEDIATIONS={
 LATE_HOST_SHUTDOWN_ESCALATION:{
  cause:'ORIGINAL_HOST_PILOT_SHUTDOWN_OVERRAN_LEASE',
  action:'ORIGINAL_HOST_FAIL_CLOSED_SHUTDOWN_WATCHDOG_REMEDIATED'},
 LATE_INDEPENDENT_OFF_READBACK_ESCALATION:{
  cause:'INDEPENDENT_RECEIVER_OFF_RECEIPT_LATE',
  action:'INDEPENDENT_OFF_WITNESS_DELIVERY_REMEDIATED'}
};
const HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const iso=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s;
const fresh=(s,now)=>iso(s)&&Number.isSafeInteger(now)&&
 Date.parse(s)<=now&&now-Date.parse(s)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 receiver:'UNKNOWN_UNTIL_FRESH_INDEPENDENT_OFF_REVALIDATION',
 activationAuthorized:false,manualReceiverIsolationRequired:true,
 ownerAcceptance:'HOLD',runtimeUptime:'UNKNOWN',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signed(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const key=createPublicKey({key:der,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const validScope=s=>exact(s,['ceremonyId','sourceId','episodeId',
 'sourceRevision','controllerRevision'])&&s.sourceId==='rosevear-ai-hub'&&
 ID.test(s.ceremonyId??'')&&ID.test(s.episodeId??'')&&
 SHA.test(s.sourceRevision??'')&&SHA.test(s.controllerRevision??'');
function protectedLineage({
 ql437Exception,ql437Ledger,ql436Review,ql436Ledger,
 ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store
}){
 const a=ql437Exception,b=ql436Review,c=ql435Decision,d=ql434Readiness,
  e=ql433Precheck,f=ql432Decision,s=d?.scope;
 if(!validScope(s)||
  a?.state!=='DURABLE_QL437_EXPIRED_LEASE_EXCEPTION_OPEN_INDEPENDENT_CUSTODY'||
  a.connection!=='HOLD'||a.activationAuthorized!==false||
  a.receiver!=='OFF_VERIFIED_BY_HOST_AND_INDEPENDENT_POST_SHUTDOWN_WITNESS'||
  a.ownerAcceptance!=='DUAL_SIGNED_LEASE_EXCEPTION_OPEN'||
  a.incidentClosed!==false||a.leaseExceptionOpen!==true||
  a.masterCount!==3||
  a.permittedNextAction!=='OWNER_SUPERVISED_LEASE_EXCEPTION_REMEDIATION_NO_REENTRY'||
  !ID.test(a.originalIncidentId??'')||!ID.test(a.nextCeremonyId??'')||
  (!Object.hasOwn(REMEDIATIONS,a.leaseDisposition))||
  !HEX.test(a.externalAnchorDigest??'')||
  !HEX.test(a.independentReadbackDigest??'')||
  !HEX.test(a.pendingReceiptDigest??'')||!HEX.test(a.finalReceiptDigest??'')||
  b?.state!=='DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED'||
  b.connection!=='HOLD'||b.activationAuthorized!==false||
  b.receiver!=='OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK'||
  b.ownerAcceptance!=='DUAL_SIGNED_OFF_AND_EXPIRY_REVIEW_ONLY'||
  b.leaseExceptionEscalationRequired!==true||
  b.originalIncidentId!==a.originalIncidentId||
  b.nextCeremonyId!==a.nextCeremonyId||
  b.leaseDisposition!==a.leaseDisposition||
  !ID.test(b.incidentReviewId??'')||!iso(b.leaseExpiresAt)||
  !HEX.test(b.pendingReceiptDigest??'')||!HEX.test(b.reconciledReceiptDigest??'')||
  c?.state!=='DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION'||
  c.connection!=='HOLD'||c.activationAuthorized!==false||
  c.originalIncidentId!==a.originalIncidentId||
  c.nextCeremonyId!==a.nextCeremonyId||
  c.leaseExpiresAt!==b.leaseExpiresAt||
  !HEX.test(c.pendingReceiptDigest??'')||!HEX.test(c.acceptedReceiptDigest??'')||
  d?.state!=='DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF'||
  d.connection!=='HOLD'||d.activationAuthorized!==false||
  d.incidentId!==a.originalIncidentId||d.nextCeremonyId!==a.nextCeremonyId||
  d.nextEpisodeId!==c.nextEpisodeId||
  !HEX.test(d.readinessRecordDigest??'')||
  e?.state!=='DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY'||
  e.connection!=='HOLD'||e.incidentId!==a.originalIncidentId||
  e.nextCeremonyId!==a.nextCeremonyId||e.nextEpisodeId!==c.nextEpisodeId||
  !HEX.test(e.precheckRecordDigest??'')||
  f?.state!=='DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW'||
  f.connection!=='HOLD'||f.incidentId!==a.originalIncidentId||
  !HEX.test(f.ownerReviewReceiptDigest??'')||
  !HEX.test(f.checkpointDigest??'')||
  !Number.isSafeInteger(f.checkpointIndex)||f.checkpointIndex<3||
  !equal(s,e.scope)||!equal(e.scope,f.scope)||
  typeof ql437Ledger?.read!=='function'||
  typeof ql436Ledger?.read!=='function'||
  typeof ql435Ledger?.read!=='function'||
  typeof ql434Ledger?.read!=='function'||
  typeof ql433Ledger?.read!=='function'||
  typeof ql432Ledger?.read!=='function'||
  typeof ql431Store?.read!=='function')return null;
 try{
  const q37p=ql437Ledger.read('pending',a.originalIncidentId);
  const q37f=ql437Ledger.read('final',a.originalIncidentId);
  const q36p=ql436Ledger.read('pending',a.nextCeremonyId);
  const q36r=ql436Ledger.read('reconciled',a.nextCeremonyId);
  const q35p=ql435Ledger.read('pending',a.nextCeremonyId);
  const q35a=ql435Ledger.read('accepted',a.nextCeremonyId);
  const q34=ql434Ledger.read(a.originalIncidentId);
  const q33=ql433Ledger.read(a.originalIncidentId);
  const q32=ql432Ledger.read(a.originalIncidentId);
  const q31=ql431Store.read(s);
  if(q37p?.recordDigest!==a.pendingReceiptDigest||
   q37f?.recordDigest!==a.finalReceiptDigest||
   q36p?.recordDigest!==b.pendingReceiptDigest||
   q36r?.recordDigest!==b.reconciledReceiptDigest||
   q35p?.recordDigest!==c.pendingReceiptDigest||
   q35a?.recordDigest!==c.acceptedReceiptDigest||
   q34?.recordDigest!==d.readinessRecordDigest||
   q33?.recordDigest!==e.precheckRecordDigest||
   q32?.recordDigest!==f.ownerReviewReceiptDigest||
   q31?.entry?.kind!=='RECONCILED'||
   q31.entry.incidentId!==a.originalIncidentId||
   q31.index!==f.checkpointIndex||
   q31.recordDigest!==f.checkpointDigest)return null;
  return {scope:s,ql431:q31.recordDigest,ql432:q32.recordDigest,
   ql433:q33.recordDigest,ql434:q34.recordDigest,
   ql435Pending:q35p.recordDigest,ql435Accepted:q35a.recordDigest,
   ql436Pending:q36p.recordDigest,ql436Reconciled:q36r.recordDigest,
   ql437Pending:q37p.recordDigest,ql437Final:q37f.recordDigest};
 }catch{return null;}
}
export function prepareQl438ExpiredLeaseCorrectiveIntake({
 ql437Exception,ql437Ledger,ql436Review,ql436Ledger,
 ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
 remediationId,challengeNonce
},{nowMs,protectedOriginalHostSession=false,
 independentQl437ExceptionVerified=false}={}){
 if(!Number.isSafeInteger(nowMs)||!protectedOriginalHostSession||
  !independentQl437ExceptionVerified||
  !ID.test(remediationId??'')||!ID.test(challengeNonce??''))
  return hold('PROTECTED_ORIGINAL_HOST_EXPIRED_LEASE_REMEDIATION_AUTHORITY_REQUIRED');
 const prior=protectedLineage({ql437Exception,ql437Ledger,
  ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store});
 if(!prior)return hold('QL431_TO_QL437_EXACT_OPEN_EXCEPTION_CUSTODY_REQUIRED');
 const q=ql437Exception,b=ql436Review,mode=REMEDIATIONS[q.leaseDisposition];
 const request={schema:'rosevear.ql438.expired-lease-corrective-intake.v1',
  scope:prior.scope,originalIncidentId:q.originalIncidentId,
  incidentReviewId:b.incidentReviewId,
  nextCeremonyId:q.nextCeremonyId,
  leaseExpiresAt:b.leaseExpiresAt,leaseDisposition:q.leaseDisposition,
  rootCauseCode:mode.cause,correctiveActionCode:mode.action,
  ql431CheckpointDigest:prior.ql431,ql432OwnerReceiptDigest:prior.ql432,
  ql433PrecheckReceiptDigest:prior.ql433,
  ql434ReadinessReceiptDigest:prior.ql434,
  ql435PendingReceiptDigest:prior.ql435Pending,
  ql435AcceptedReceiptDigest:prior.ql435Accepted,
  ql436PendingReceiptDigest:prior.ql436Pending,
  ql436ReconciledReceiptDigest:prior.ql436Reconciled,
  ql437PendingReceiptDigest:prior.ql437Pending,
  ql437FinalReceiptDigest:prior.ql437Final,
  ql437ExternalAnchorDigest:q.externalAnchorDigest,
  ql437IndependentReadbackDigest:q.independentReadbackDigest,
  originalHostId:'DESKTOP-AE894KC',remediationId,challengeNonce,
  requestedAction:'REVIEW_SIGNED_CORRECTIVE_EVIDENCE_KEEP_RECEIVER_OFF_NO_REENTRY',
  preparedAt:new Date(nowMs).toISOString()};
 return {state:'QL438_CORRECTIVE_INTAKE_PREPARED_NOT_ACCEPTED',
  request,requestDigest:digest(request),connection:'HOLD',
  activationAuthorized:false,receiver:'UNKNOWN_PENDING_FRESH_SIGNED_OFF',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
function hostReport(e,r,opts){
 const p=e?.payload;
 return opts.independentOriginalHostPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','requestDigest','hostMachineId','scope',
   'originalIncidentId','remediationId','challengeNonce','leaseDisposition',
   'rootCauseCode','correctiveActionCode','actionEvidenceDigest',
   'receiverState','failClosedShutdownArmed','repairSequence','observedAt'])&&
  p.schema==='rosevear.ql438.original-host-corrective-action.v1'&&
  p.requestDigest===digest(r)&&p.hostMachineId==='DESKTOP-AE894KC'&&
  equal(p.scope,r.scope)&&p.originalIncidentId===r.originalIncidentId&&
  p.remediationId===r.remediationId&&p.challengeNonce===r.challengeNonce&&
  p.leaseDisposition===r.leaseDisposition&&
  p.rootCauseCode===r.rootCauseCode&&
  p.correctiveActionCode===r.correctiveActionCode&&
  HEX.test(p.actionEvidenceDigest??'')&&p.receiverState==='OFF'&&
  p.failClosedShutdownArmed===true&&
  Number.isSafeInteger(p.repairSequence)&&p.repairSequence>=1&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(r.preparedAt)&&
  signed(p,e.signature,opts.originalHostPin);
}
function freshOff(e,r,host,opts){
 const p=e?.payload;
 return opts.independentReceiverPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','originalIncidentId','remediationId',
   'challengeNonce','hostCorrectiveDigest','ql437IndependentReadbackDigest',
   'receiverState','offContinuitySequence','observedAt'])&&
  p.schema==='rosevear.ql438.independent-receiver-remediation-off.v1'&&
  p.originalIncidentId===r.originalIncidentId&&
  p.remediationId===r.remediationId&&p.challengeNonce===r.challengeNonce&&
  p.hostCorrectiveDigest===digest(host.payload)&&
  p.ql437IndependentReadbackDigest===r.ql437IndependentReadbackDigest&&
  p.receiverState==='OFF'&&
  Number.isSafeInteger(p.offContinuitySequence)&&
  p.offContinuitySequence>=host.payload.repairSequence&&
  fresh(p.observedAt,opts.nowMs)&&
  Date.parse(p.observedAt)>=Date.parse(host.payload.observedAt)&&
  signed(p,e.signature,opts.receiverPin);
}
function independentRemediator(e,r,host,off,opts){
 const p=e?.payload;
 return opts.independentRemediatorPinVerified===true&&
  exact(e,['payload','signature'])&&
  exact(p,['schema','originalIncidentId','remediationId',
   'challengeNonce','requestDigest','hostCorrectiveDigest',
   'independentOffDigest','leaseDisposition','rootCauseCode',
   'correctiveActionCode','status','witnessedAt'])&&
  p.schema==='rosevear.ql438.independent-corrective-witness.v1'&&
  p.originalIncidentId===r.originalIncidentId&&
  p.remediationId===r.remediationId&&p.challengeNonce===r.challengeNonce&&
  p.requestDigest===digest(r)&&
  p.hostCorrectiveDigest===digest(host.payload)&&
  p.independentOffDigest===digest(off.payload)&&
  p.leaseDisposition===r.leaseDisposition&&
  p.rootCauseCode===r.rootCauseCode&&
  p.correctiveActionCode===r.correctiveActionCode&&
  p.status==='INDEPENDENT_REMEDIATION_REVIEW_OFF_CONFIRMED_NO_REENTRY'&&
  fresh(p.witnessedAt,opts.nowMs)&&
  Date.parse(p.witnessedAt)>=Date.parse(off.payload.observedAt)&&
  signed(p,e.signature,opts.remediatorPin);
}
function masterReviews(reports,r,witness,opts){
 if(opts.independentMasterPinsVerified!==true||
  !Array.isArray(reports)||reports.length!==3||!opts.masterPins)return null;
 const seen=new Set(),accepted=[];
 for(const e of reports){
  const p=e?.payload;
  if(!exact(e,['payload','signature'])||
   !exact(p,['schema','masterId','originalIncidentId',
    'remediationId','requestDigest','independentRemediatorDigest',
    'leaseDisposition','status','observedAt'])||
   p.schema!=='rosevear.ql438.master-remediation-closure-review.v1'||
   !MASTERS.includes(p.masterId)||seen.has(p.masterId)||
   p.originalIncidentId!==r.originalIncidentId||
   p.remediationId!==r.remediationId||p.requestDigest!==digest(r)||
   p.independentRemediatorDigest!==digest(witness.payload)||
   p.leaseDisposition!==r.leaseDisposition||
   p.status!=='SIGNED_CORRECTIVE_REVIEW_NO_RUNTIME_REENTRY'||
   !fresh(p.observedAt,opts.nowMs)||
   Date.parse(p.observedAt)<Date.parse(witness.payload.witnessedAt)||
   !signed(p,e.signature,opts.masterPins[p.masterId]))return null;
  seen.add(p.masterId);accepted.push(p);
 }
 if(MASTERS.some(m=>!seen.has(m)))return null;
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 return {digest:digest(accepted),
  latestAt:Math.max(...accepted.map(x=>Date.parse(x.observedAt)))};
}
function externalClosureReceipt(envelopes,r,witness,masters,opts){
 const a=envelopes?.anchor?.payload,b=envelopes?.reader?.payload;
 if(opts.independentAnchorPinVerified!==true||
  opts.independentReaderPinVerified!==true||
  opts.anchorPin===opts.readerPin||
  !exact(envelopes,['anchor','reader'])||
  !exact(envelopes.anchor,['payload','signature'])||
  !exact(envelopes.reader,['payload','signature'])||
  !exact(a,['schema','originalIncidentId','remediationId',
   'challengeNonce','requestDigest','independentRemediatorDigest',
   'masterDigest','priorQl437ExternalAnchorDigest','status','anchoredAt'])||
  a.schema!=='rosevear.ql438.external-corrective-closure-anchor.v1'||
  a.originalIncidentId!==r.originalIncidentId||
  a.remediationId!==r.remediationId||a.challengeNonce!==r.challengeNonce||
  a.requestDigest!==digest(r)||
  a.independentRemediatorDigest!==digest(witness.payload)||
  a.masterDigest!==masters.digest||
  a.priorQl437ExternalAnchorDigest!==r.ql437ExternalAnchorDigest||
  a.status!=='EXTERNAL_SIGNED_REMEDIATION_CUSTODY_ANCHORED_NO_REENTRY'||
  !fresh(a.anchoredAt,opts.nowMs)||
  Date.parse(a.anchoredAt)<masters.latestAt||
  !signed(a,envelopes.anchor.signature,opts.anchorPin)||
  !exact(b,['schema','originalIncidentId','remediationId',
   'challengeNonce','requestDigest','externalAnchorDigest','status','readAt'])||
  b.schema!=='rosevear.ql438.independent-closure-anchor-readback.v1'||
  b.originalIncidentId!==r.originalIncidentId||
  b.remediationId!==r.remediationId||b.challengeNonce!==r.challengeNonce||
  b.requestDigest!==digest(r)||b.externalAnchorDigest!==digest(a)||
  b.status!=='INDEPENDENT_SIGNED_REMEDIATION_ANCHOR_READBACK'||
  !fresh(b.readAt,opts.nowMs)||
  Date.parse(b.readAt)<Date.parse(a.anchoredAt)||
  !signed(b,envelopes.reader.signature,opts.readerPin))
  return null;
 return {anchorDigest:digest(a),readerDigest:digest(b),readAt:b.readAt};
}
function verifiedDualOwner(e,r,witness,masters,external,opts){
 const p=e?.payload;
 return opts.independentOwnerCustodyVerified===true&&
  opts.independentReviewerCustodyVerified===true&&
  opts.ownerPin!==opts.reviewerPin&&
  exact(e,['payload','ownerSignature','reviewerSignature'])&&
  exact(p,['schema','originalIncidentId','remediationId',
   'challengeNonce','requestDigest','independentRemediatorDigest',
   'mastersDigest','externalAnchorDigest','externalReadbackDigest',
   'priorExceptionStatus','leaseDisposition','action',
   'ownerId','reviewerId','reviewedAt'])&&
  p.schema==='rosevear.ql438.dual-owner-expired-lease-closure.v1'&&
  p.originalIncidentId===r.originalIncidentId&&
  p.remediationId===r.remediationId&&p.challengeNonce===r.challengeNonce&&
  p.requestDigest===digest(r)&&
  p.independentRemediatorDigest===digest(witness.payload)&&
  p.mastersDigest===masters.digest&&
  p.externalAnchorDigest===external.anchorDigest&&
  p.externalReadbackDigest===external.readerDigest&&
  p.priorExceptionStatus==='QL437_EXPIRED_LEASE_OPEN'&&
  p.leaseDisposition===r.leaseDisposition&&
  p.action==='CLOSE_EXPIRED_LEASE_EXCEPTION_CORRECTIVE_EVIDENCE_ONLY_KEEP_HOLD'&&
  PERSON.test(p.ownerId??'')&&PERSON.test(p.reviewerId??'')&&
  p.ownerId!==p.reviewerId&&fresh(p.reviewedAt,opts.nowMs)&&
  Date.parse(p.reviewedAt)>=Date.parse(external.readAt)&&
  signed(p,e.ownerSignature,opts.ownerPin)&&
  signed(p,e.reviewerSignature,opts.reviewerPin);
}
export function openQl438ProtectedExceptionLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL438_ABSOLUTE_PROTECTED_DIRECTORY_REQUIRED');
 const root=resolve(directory);
 mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL438_UNSAFE_PROTECTED_DIRECTORY');
 const pathname=(kind,id)=>{
  if(!['pending','closed'].includes(kind)||!ID.test(id??''))
   throw Error('QL438_INVALID_LEDGER_KEY');
  return join(root,'ql438-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;try{raw=readFileSync(pathname(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL438_RECORD_OVERSIZE');
  let r;try{r=JSON.parse(raw);}catch{throw Error('QL438_RECORD_INVALID');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!=='rosevear.ql438.expired-lease-exception-ledger.v1'||
   r.kind!==kind||r.incidentId!==id||!HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==digest({schema:r.schema,kind,incidentId:id,
    evidenceDigest:r.evidenceDigest}))throw Error('QL438_RECORD_TAMPERED');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL438_BAD_EVIDENCE_DIGEST');
  if(read(kind,id))throw Error('QL438_EXCEPTION_ALREADY_CONSUMED');
  const r={schema:'rosevear.ql438.expired-lease-exception-ledger.v1',
   kind,incidentId:id,evidenceDigest};
  r.recordDigest=digest(r);
  const fd=openSync(pathname(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}
  finally{closeSync(fd);}
  const dfd=openSync(root,'r');try{fsyncSync(dfd);}finally{closeSync(dfd);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('QL438_READBACK_DID_NOT_MATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
/** Private record readback alone never proves ongoing physical receiver OFF. */
export function readQl438ExceptionClosureContinuity(ledger,incidentId){
 try{
  const pending=ledger.read('pending',incidentId);
  const closed=ledger.read('closed',incidentId);
  if(closed&&!pending)return hold('QL438_CLOSED_WITHOUT_PENDING_INTEGRITY_FAILURE');
  if(closed)return {...hold('PRIVATE_EXCEPTION_CLOSURE_RECORDED_FRESH_OFF_CHECK_REQUIRED'),
   state:'QL438_PRIVATE_CLOSURE_RECEIPT_NOT_LIVE_OFF_PROOF',
   pendingReceiptDigest:pending.recordDigest,
   closedReceiptDigest:closed.recordDigest};
  if(pending)return {...hold('QL438_CORRECTIVE_EVIDENCE_PROCESSING_INCOMPLETE'),
   pendingReceiptDigest:pending.recordDigest};
  return hold('QL438_NO_SIGNED_REMEDIATION_CUSTODY_ON_FILE');
 }catch{return hold('QL438_PROTECTED_EXCEPTION_LEDGER_UNREADABLE');}
}
/** Never enables or disables the physical receiver. External adapters must
 * independently supply signed owner-host, receiver-OFF and remediation proofs.
 */
export async function runQl438ExpiredLeaseExceptionClosure({
 ql437Exception,ql437Ledger,ql436Review,ql436Ledger,
 ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
 ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
 remediationLedger,remediationId,challengeNonce,
 originalHostAdapter,independentReceiverAdapter,
 independentRemediatorAdapter,masterProvider,
 externalClosureAnchorProvider,ownerDecision
},opts={}){
 if(opts.protectedOriginalHostSession!==true||
  opts.independentQl437ExceptionVerified!==true||
  typeof remediationLedger?.read!=='function'||
  typeof remediationLedger?.claimOnce!=='function'||
  typeof originalHostAdapter?.readSignedCorrectiveAction!=='function'||
  typeof independentReceiverAdapter?.readSignedOff!=='function'||
  typeof independentRemediatorAdapter?.readSignedWitness!=='function'||
  typeof masterProvider?.readSignedReports!=='function'||
  typeof externalClosureAnchorProvider?.readSignedClosureAnchor!=='function')
  return hold('PROTECTED_OWNER_SUPERVISED_EXPIRED_LEASE_CORRECTIVE_SESSION_REQUIRED');
 const args={ql437Exception,ql437Ledger,ql436Review,ql436Ledger,
  ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  remediationId,challengeNonce};
 const prep=prepareQl438ExpiredLeaseCorrectiveIntake(args,{
  nowMs:opts.nowMs,protectedOriginalHostSession:true,
  independentQl437ExceptionVerified:true});
 if(prep.state!=='QL438_CORRECTIVE_INTAKE_PREPARED_NOT_ACCEPTED')
  return hold('QL437_OPEN_EXCEPTION_AND_EXACT_PRIOR_CUSTODY_REQUIRED');
 const r=prep.request;
 const pins=[opts.originalHostPin,opts.receiverPin,opts.remediatorPin,
  opts.anchorPin,opts.readerPin,opts.ownerPin,opts.reviewerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(pin=>typeof pin!=='string')||new Set(pins).size!==pins.length)
  return hold('DISTINCT_INDEPENDENT_SIGNING_KEY_CUSTODY_REQUIRED');
 try{
  if(remediationLedger.read('pending',r.originalIncidentId)||
   remediationLedger.read('closed',r.originalIncidentId))
   return hold('ORIGINAL_INCIDENT_ALREADY_USED_FOR_CORRECTIVE_CLOSURE');
 }catch{return hold('QL438_PRIVATE_REMEDIATION_LEDGER_UNREADABLE');}
 let pending;
 try{
  pending=remediationLedger.claimOnce('pending',r.originalIncidentId,digest({
   requestDigest:prep.requestDigest,
   ql437FinalReceiptDigest:r.ql437FinalReceiptDigest,
   independentReadbackDigest:r.ql437IndependentReadbackDigest,
   remediationId,challengeNonce,leaseDisposition:r.leaseDisposition}));
  if(remediationLedger.read('pending',r.originalIncidentId)?.recordDigest!==
   pending.recordDigest)throw Error('PENDING_RECEIPT_READBACK_FAILED');
 }catch{return hold('QL438_PENDING_CORRECTIVE_EVIDENCE_CUSTODY_WRITE_FAILED');}
 let host;
 try{host=await originalHostAdapter.readSignedCorrectiveAction({
  request:r,requestDigest:prep.requestDigest,
  pendingReceiptDigest:pending.recordDigest,requiredReceiverState:'OFF'});}
 catch{return hold('ORIGINAL_HOST_SIGNED_CORRECTIVE_ACTION_UNAVAILABLE');}
 if(!hostReport(host,r,opts))
  return hold('ORIGINAL_HOST_SIGNED_CORRECTIVE_ACTION_REJECTED');
 let off;
 try{off=await independentReceiverAdapter.readSignedOff({
  request:r,hostCorrectiveDigest:digest(host.payload),requiredReceiverState:'OFF'});}
 catch{return hold('INDEPENDENT_FRESH_RECEIVER_OFF_UNAVAILABLE');}
 if(!freshOff(off,r,host,opts))
  return hold('INDEPENDENT_RECEIVER_OFF_SIGNATURE_OR_SEQUENCE_INVALID');
 let witness;
 try{witness=await independentRemediatorAdapter.readSignedWitness({
  request:r,hostCorrectiveDigest:digest(host.payload),
  independentOffDigest:digest(off.payload)});}
 catch{return hold('INDEPENDENT_REMEDIATION_WITNESS_UNAVAILABLE');}
 if(!independentRemediator(witness,r,host,off,opts))
  return hold('INDEPENDENT_REMEDIATION_ATTESTATION_REJECTED');
 let reports;
 try{reports=await masterProvider.readSignedReports({
  request:r,independentRemediatorDigest:digest(witness.payload)});}
 catch{return hold('THREE_MASTER_CORRECTIVE_REVIEWS_UNAVAILABLE');}
 const masters=masterReviews(reports,r,witness,opts);
 if(!masters)return hold('THREE_MASTER_SIGNED_CORRECTIVE_CONTINUITY_INVALID');
 let closure;
 try{closure=await externalClosureAnchorProvider.readSignedClosureAnchor({
  request:r,independentRemediatorDigest:digest(witness.payload),
  mastersDigest:masters.digest,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('INDEPENDENT_EXTERNAL_REMEDIATION_ANCHOR_UNAVAILABLE');}
 const external=externalClosureReceipt(closure,r,witness,masters,opts);
 if(!external)return hold('EXTERNAL_REMEDIATION_ANCHOR_OR_INDEPENDENT_READER_REJECTED');
 if(!verifiedDualOwner(ownerDecision,r,witness,masters,external,opts))
  return hold('DUAL_OWNER_SIGNED_EXCEPTION_CLOSURE_REJECTED');
 try{
  const latest=protectedLineage(args);
  if(!latest||latest.ql437Final!==r.ql437FinalReceiptDigest||
   latest.ql436Reconciled!==r.ql436ReconciledReceiptDigest||
   latest.ql431!==r.ql431CheckpointDigest||
   remediationLedger.read('pending',r.originalIncidentId)?.recordDigest!==
    pending.recordDigest)
   return hold('QL431_TO_QL437_CUSTODY_CHANGED_BEFORE_EXCEPTION_CLOSURE');
  const closed=remediationLedger.claimOnce('closed',r.originalIncidentId,digest({
   requestDigest:prep.requestDigest,pendingReceiptDigest:pending.recordDigest,
   originalHostCorrectiveDigest:digest(host.payload),
   independentReceiverOffDigest:digest(off.payload),
   independentRemediatorDigest:digest(witness.payload),
   mastersDigest:masters.digest,
   externalAnchorDigest:external.anchorDigest,
   independentAnchorReadbackDigest:external.readerDigest,
   ownerDecisionDigest:digest(ownerDecision.payload)}));
  if(remediationLedger.read('closed',r.originalIncidentId)?.recordDigest!==
   closed.recordDigest)throw Error('CLOSED_RECEIPT_READBACK_FAILED');
  return {...hold('SIGNED_REMEDIATION_EXCEPTION_CLOSED_NO_RECEIVER_REENTRY'),
   state:'DURABLE_QL438_OWNER_GATED_LEASE_EXCEPTION_CLOSURE_READBACK',
   receiver:'OFF_VERIFIED_SIGNED_REMEDIATION_WITNESS',
   ownerAcceptance:'DUAL_SIGNED_CORRECTIVE_EVIDENCE_EXCEPTION_CLOSURE_ONLY',
   leaseExceptionOpen:false,incidentClosed:true,
   originalIncidentId:r.originalIncidentId,
   nextCeremonyId:r.nextCeremonyId,remediationId,
   leaseDisposition:r.leaseDisposition,
   priorQl437ExternalAnchorDigest:r.ql437ExternalAnchorDigest,
   remediationAnchorDigest:external.anchorDigest,
   independentAnchorReadbackDigest:external.readerDigest,
   pendingReceiptDigest:pending.recordDigest,
   closedReceiptDigest:closed.recordDigest,masterCount:3,
   permittedNextAction:'NEW_SEPARATELY_AUTHORIZED_SUPERVISED_CEREMONY_NO_AUTOMATIC_REENTRY'};
 }catch{return hold('QL438_FINAL_EXCEPTION_CUSTODY_COMMIT_OR_REPLAY_FAILED');}
}
