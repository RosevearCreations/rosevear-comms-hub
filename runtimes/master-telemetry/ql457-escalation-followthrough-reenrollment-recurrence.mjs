import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-457: historical-only independent escalation follow-through and re-enrollment recurrence
 * expiry. Never closes or energizes the physical receiver. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/,SCHEMA='rosevear.ql457.escalation-followthrough-reenrollment-recurrence.v1';
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const exact=(o,fields)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(f=>Object.hasOwn(o,f));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now,limit=60000)=>Number.isSafeInteger(now)&&
 Number.isFinite(at(x))&&at(x)<=now&&now-at(x)<=limit;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',incidentStatus:'OPEN',
 activationAuthorized:false,closureAuthorized:false,physicalReceiverCurrentlyOff:false,
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,ownerAcceptance:'HOLD',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const sigOkay=(p,s,pin)=>{
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const b=Buffer.from(pin,'base64');
  if(b.toString('base64')!==pin)return false;
  const k=createPublicKey({key:b,format:'der',type:'spki'});
  return k.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),k,Buffer.from(s,'base64'));
 }catch{return false;}
};
const signed=(e,fields,pin)=>exact(e,['payload','signature'])&&
 exact(e.payload,fields)&&sigOkay(e.payload,e.signature,pin);

export function openQl457ContinuityLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL457_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL457_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL457_INVALID_RECEIPT_KEY');
  return join(root,'ql457-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const name=file(kind,id);let stat;
  try{stat=lstatSync(name);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)||stat.size>4096)
   throw Error('QL457_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(name,'utf8'));}catch{throw Error('QL457_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==digest({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL457_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL457_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};r.recordDigest=digest(r);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)throw Error('QL457_READBACK_MISMATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl456(s,ledger){
 const exception=s?.state==='DURABLE_QL456_ESCALATION_OR_REENROLLMENT_EXCEPTION_OPEN';
 const review=s?.state==='DURABLE_QL456_RECURRENCE_CLOSURE_EVIDENCE_RENEWAL_REVIEW_ONLY';
 if((!exception&&!review)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
 s.activationAuthorized!==false||s.closureAuthorized!==false||
 s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
 s.classification!==(exception?'SIGNED_ESCALATION_REENROLLMENT_OR_RECURRENCE_EXCEPTION_OPEN':'SIGNED_ESCALATION_OUTCOME_REENROLLMENT_REVIEW_ONLY')||
 s.closureDecision!==(exception?'ESCALATE_UNRESOLVED_OUTCOME_OR_REENROLLMENT_KEEP_INCIDENT_OPEN_HOLD':'RENEW_THREE_MASTER_CLOSURE_EVIDENCE_ONLY_KEEP_OPEN_HOLD')||
 s.ownerAcceptance!=='DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD'||
 !ID.test(s.originalIncidentId??'')||!ID.test(s.monitorId??'')||
 !ID.test(s.challengeNonce??'')||
 typeof s.recoveryExpiredAtReview!=='boolean'||typeof s.ceremonyAuthorityExpiredAtReview!=='boolean'||
 ![s.pendingReceiptDigest,s.finalReceiptDigest,s.monitorDigest,s.gateDigest,s.reportsDigest].every(x=>HEX.test(x??''))||
 typeof ledger?.read!=='function')return false;
 try{const id=s.originalIncidentId;return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
 ledger.read(exception?'exception':'review',id)?.recordDigest===s.finalReceiptDigest&&
 !ledger.read(exception?'review':'exception',id);
 }catch{return false;}
}
export function readQl457Continuity(ledger,id){
 try{
  const p=ledger.read('pending',id),good=ledger.read('review',id),
    bad=ledger.read('exception',id);
  if((good||bad)&&(!p||(good&&bad)))return hold('QL457_CONFLICTING_FINAL_CUSTODY');
  if(good)return {...hold('QL457_HISTORICAL_STABILITY_ONLY'),
   state:'QL457_DURABLE_FOLLOWUP_CONTINUITY_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:good.recordDigest};
  if(bad)return {...hold('QL457_SIGNED_RECURRENCE_OR_AUTHORITY_EXPIRY'),
   state:'QL457_DURABLE_FOLLOWUP_RECURRENCE_EXCEPTION_OPEN',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:bad.recordDigest};
  if(p)return {...hold('QL457_PENDING_MANUAL_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL457_NO_PROTECTED_FRESHNESS_RECEIPT');
 }catch{return hold('QL457_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql456SummaryDigest','ql456ReceiptDigest',
 'ql456MonitorDigest','incidentStatus','readAt'];
const recoveryFields=['schema','incidentId','monitorId','challengeNonce','ql456ReceiptDigest',
 'sourceDigest','recoveryStatus','followUpCaseId','followUpEvidenceDigest','followUpStatus','followUpAcknowledgedAt','sourceEscalationDigest','recoveryIssuedAt','recoveryExpiresAt','signedAt'];
const hostFields=['schema','incidentId','monitorId','challengeNonce','ql456ReceiptDigest',
 'sourceDigest','recoveryDigest','originalHostId','hostReceiverState',
 'isolationLock','leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const anchorFields=['schema','incidentId','monitorId','challengeNonce',
 'ql456ReceiptDigest','sourceDigest','recoveryDigest','hostDigest',
 'anchorId','anchorSequence','anchorDisposition','anchoredAt'];
const witnessFields=['schema','incidentId','monitorId','challengeNonce',
 'ql456ReceiptDigest','anchorDigest','recoveryDigest','hostDigest',
 'originalHostId','receiverId','sensorId','originalSensorId','receiverState',
 'isolationConfirmed','observerSequence','previousObserverSequence','recurrenceCount','recurrenceWindowStart','recurrenceWindowEnd','observedAt'];
const ceremonyFields=['schema','incidentId','monitorId','ql456ReceiptDigest',
 'recoveryDigest','ceremonyId','issuedAt','expiresAt','previousCeremonyId','reEnrollmentStatus','enrollmentRecordDigest','priorEnrollmentDigest','reEnrollmentGeneration','authorityDecision',
 'incidentStatus','closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff'];
const gateFields=['schema','incidentId','monitorId','ql456ReceiptDigest',
 'monitorDigest','classification','closureDecision','incidentStatus',
 'closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff',
 'separateCeremonyRequired','attestedAt'];
const masterFields=['schema','incidentId','monitorId','masterId','ql456ReceiptDigest',
 'monitorDigest','gateDigest','classification','closureDecision','incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','monitorId','sourceOwnerId','masterOwnerId',
 'ql456ReceiptDigest','monitorDigest','gateDigest','masterReportsDigest',
 'classification','closureDecision','incidentStatus','reviewedAt'];

export async function runQl457ContinuityReview({
 ql456Summary,ql456Ledger,continuityLedger,monitorId,challengeNonce,
 originalCommsSourceProvider,independentRecoveryProvider,originalHostProvider,
 independentAnchorProvider,independentPhysicalProvider,ceremonyAuthorityProvider,
 independentGateProvider,threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof continuityLedger?.read!=='function'||typeof continuityLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl456Case!=='function'||
  typeof independentRecoveryProvider?.readSignedRecoveryOutcome!=='function'||
  typeof originalHostProvider?.readSignedOriginalHostOffReview!=='function'||
  typeof independentAnchorProvider?.readSignedContinuityAnchor!=='function'||
  typeof independentPhysicalProvider?.readSignedPhysicalRecurrenceWitness!=='function'||
  typeof ceremonyAuthorityProvider?.readSignedHistoricalCeremonyAuthority!=='function'||
  typeof independentGateProvider?.readSignedIndependentContinuityGate!=='function'||
  typeof threeMasterProvider?.readSignedCeremonyExpiryVotes!=='function')
  return hold('QL457_EIGHT_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl456CustodyVerified||!opts.physicalSensorEnrollmentVerified||
  !opts.independentSignerPinsVerified||!opts.separateOwnerRolesVerified||
  typeof opts.readTrustedNowMs!=='function'||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(opts.originalSensorId??'')||!ID.test(opts.priorCeremonyId??'')||!HEX.test(opts.priorEnrollmentDigest??'')||!ID.test(monitorId??'')||
  !ID.test(challengeNonce??'')||challengeNonce===ql456Summary?.challengeNonce||
  !validQl456(ql456Summary,ql456Ledger))
  return hold('QL457_EXACT_QL456_OPEN_CASE_REQUIRED');
 const s=ql456Summary,id=s.originalIncidentId,prior=s.finalReceiptDigest;
 const pins=[opts.commsSourcePin,opts.recoveryOfficerPin,opts.originalHostPin,
  opts.externalAnchorPin,opts.physicalObserverPin,opts.ceremonyAuthorityPin,
  opts.independentGatePin,opts.sourceOwnerPin,opts.masterOwnerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==12)
  return hold('QL457_TWELVE_DISTINCT_SIGNER_PINS_REQUIRED');
 try{
  if(continuityLedger.read('pending',id)||continuityLedger.read('review',id)||
   continuityLedger.read('exception',id))
   return hold('QL457_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
 }catch{return hold('QL457_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=continuityLedger.claimOnce('pending',id,digest({
   ql456SummaryDigest:digest(s),prior,monitorId,challengeNonce}));
  if(continuityLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL457_PENDING_DURABLE_CLAIM_FAILED');}
 let source,recovery,host,anchor,witness,ceremony;
 try{source=await originalCommsSourceProvider.readSignedQl456Case({
  incidentId:id,prior,monitorId,challengeNonce,pendingDigest:pending.recordDigest});}
 catch{return hold('QL457_ORIGINAL_CASE_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql457.original-ql456-case.v1'||
  p.incidentId!==id||p.ql456SummaryDigest!==digest(s)||
  p.ql456ReceiptDigest!==prior||p.ql456MonitorDigest!==s.monitorDigest||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.readAt,opts.nowMs))
  return hold('QL457_ORIGINAL_SIGNED_CASE_INVALID');
 try{recovery=await independentRecoveryProvider.readSignedRecoveryOutcome({
  incidentId:id,prior,monitorId,challengeNonce,sourceDigest:digest(p)});}
 catch{return hold('QL457_SIGNED_RECOVERY_OUTCOME_UNAVAILABLE');}
 const r=recovery?.payload;
 if(!signed(recovery,recoveryFields,opts.recoveryOfficerPin)||
  r.schema!=='rosevear.ql457.independent-recovery-outcome.v1'||
  r.incidentId!==id||r.monitorId!==monitorId||
  r.challengeNonce!==challengeNonce||r.ql456ReceiptDigest!==prior||
  r.sourceDigest!==digest(p)||!['ESCALATION_OUTCOME_ATTESTED_OPEN_HOLD','UNRESOLVED_OPEN_HOLD'].includes(r.recoveryStatus)||
  !ID.test(r.followUpCaseId??'')||r.followUpCaseId===s.monitorId||
  !HEX.test(r.followUpEvidenceDigest??'')||r.sourceEscalationDigest!==s.monitorDigest||
  !['SIGNED_FOLLOWUP_ACKNOWLEDGED_OPEN_HOLD','FOLLOWUP_PENDING_OPEN_HOLD'].includes(r.followUpStatus)||
  !fresh(r.followUpAcknowledgedAt,opts.nowMs)||at(r.followUpAcknowledgedAt)<at(p.readAt)||
  at(r.followUpAcknowledgedAt)>at(r.signedAt)||
  !fresh(r.signedAt,opts.nowMs)||!Number.isFinite(at(r.recoveryIssuedAt))||
  !Number.isFinite(at(r.recoveryExpiresAt))||
  at(r.recoveryIssuedAt)>at(r.signedAt)||
  at(r.recoveryExpiresAt)<=at(r.recoveryIssuedAt)||
  at(r.recoveryExpiresAt)-at(r.recoveryIssuedAt)>60000||
  at(r.signedAt)<at(p.readAt))
  return hold('QL457_SIGNED_RECOVERY_OUTCOME_INVALID');
 try{host=await originalHostProvider.readSignedOriginalHostOffReview({
  incidentId:id,prior,monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r)});}
 catch{return hold('QL457_ORIGINAL_HOST_OFF_READBACK_UNAVAILABLE');}
 const h=host?.payload;
 if(!signed(host,hostFields,opts.originalHostPin)||
  h.schema!=='rosevear.ql457.original-host-off-review.v1'||
  h.incidentId!==id||h.monitorId!==monitorId||
  h.challengeNonce!==challengeNonce||h.ql456ReceiptDigest!==prior||
  h.sourceDigest!==digest(p)||h.recoveryDigest!==digest(r)||
  h.originalHostId!=='DESKTOP-AE894KC'||
  !['ON','OFF'].includes(h.hostReceiverState)||
  typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
  typeof h.watchdogArmed!=='boolean'||!Number.isSafeInteger(h.hostSequence)||
  h.hostSequence<1||!fresh(h.observedAt,opts.nowMs)||
  at(h.observedAt)<at(r.signedAt))
  return hold('QL457_ORIGINAL_HOST_CONTINUITY_INVALID');
 try{anchor=await independentAnchorProvider.readSignedContinuityAnchor({
  incidentId:id,prior,monitorId,challengeNonce,sourceDigest:digest(p),
  recoveryDigest:digest(r),hostDigest:digest(h)});}
 catch{return hold('QL457_INDEPENDENT_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.externalAnchorPin)||
  a.schema!=='rosevear.ql457.independent-freshness-anchor.v1'||
  a.incidentId!==id||a.monitorId!==monitorId||
  a.challengeNonce!==challengeNonce||a.ql456ReceiptDigest!==prior||
  a.sourceDigest!==digest(p)||a.recoveryDigest!==digest(r)||
  a.hostDigest!==digest(h)||!ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<=h.hostSequence||
  a.anchorDisposition!=='HISTORICAL_MONITOR_ONLY_OPEN_HOLD'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<at(h.observedAt))
  return hold('QL457_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 try{witness=await independentPhysicalProvider.readSignedPhysicalRecurrenceWitness({
  incidentId:id,prior,monitorId,challengeNonce,
  anchorDigest:digest(a),recoveryDigest:digest(r),hostDigest:digest(h)});}
 catch{return hold('QL457_INDEPENDENT_PHYSICAL_RECURRENCE_UNAVAILABLE');}
 const w=witness?.payload;
 if(!signed(witness,witnessFields,opts.physicalObserverPin)||
  w.schema!=='rosevear.ql457.physical-recurrence-witness.v1'||
  w.incidentId!==id||w.monitorId!==monitorId||
  w.challengeNonce!==challengeNonce||w.ql456ReceiptDigest!==prior||
  w.anchorDigest!==digest(a)||w.recoveryDigest!==digest(r)||
  w.hostDigest!==digest(h)||w.originalHostId!=='DESKTOP-AE894KC'||
  w.receiverId!=='ISOLATED_COMMS_RECEIVER'||!ID.test(w.sensorId??'')||
  w.originalSensorId!==opts.originalSensorId||
  w.sensorId===w.originalSensorId||!['ON','OFF'].includes(w.receiverState)||
  typeof w.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(w.observerSequence)||w.observerSequence<=a.anchorSequence||
  !Number.isSafeInteger(w.previousObserverSequence)||w.previousObserverSequence<=a.anchorSequence||
  w.previousObserverSequence>=w.observerSequence||
  !Number.isSafeInteger(w.recurrenceCount)||w.recurrenceCount<0||w.recurrenceCount>999||
  !Number.isFinite(at(w.recurrenceWindowStart))||!Number.isFinite(at(w.recurrenceWindowEnd))||
  at(w.recurrenceWindowEnd)<at(w.recurrenceWindowStart)+10000||
  at(w.recurrenceWindowEnd)>at(w.observedAt)||
  !fresh(w.recurrenceWindowEnd,opts.nowMs,15000)||
  !fresh(w.observedAt,opts.nowMs,15000)||
  at(w.observedAt)<at(a.anchoredAt))
  return hold('QL457_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 try{ceremony=await ceremonyAuthorityProvider.readSignedHistoricalCeremonyAuthority({
  incidentId:id,prior,monitorId,challengeNonce,recoveryDigest:digest(r)});}
 catch{return hold('QL457_HISTORICAL_CEREMONY_AUTHORITY_UNAVAILABLE');}
 const c=ceremony?.payload;
 if(!signed(ceremony,ceremonyFields,opts.ceremonyAuthorityPin)||
  c.schema!=='rosevear.ql457.historical-ceremony-authority.v1'||
  c.incidentId!==id||c.monitorId!==monitorId||
  c.ql456ReceiptDigest!==prior||c.recoveryDigest!==digest(r)||
  !ID.test(c.ceremonyId??'')||c.ceremonyId===opts.priorCeremonyId||
  c.previousCeremonyId!==opts.priorCeremonyId||
  !['REENROLLED_REVIEW_ONLY','PENDING_REENROLLMENT_OPEN_HOLD'].includes(c.reEnrollmentStatus)||
  !HEX.test(c.enrollmentRecordDigest??'')||c.enrollmentRecordDigest===opts.priorEnrollmentDigest||
  c.priorEnrollmentDigest!==opts.priorEnrollmentDigest||
  !Number.isSafeInteger(c.reEnrollmentGeneration)||c.reEnrollmentGeneration<2||
  !Number.isFinite(at(c.issuedAt))||
  !Number.isFinite(at(c.expiresAt))||at(c.expiresAt)<=at(c.issuedAt)||
  at(c.expiresAt)-at(c.issuedAt)>60000||
  c.authorityDecision!=='REENROLLED_HISTORICAL_READINESS_ONLY_NO_CLOSURE'||
  c.incidentStatus!=='OPEN_HOLD'||c.closureAuthorized!==false||
  c.activationAuthorized!==false||c.physicalReceiverCurrentlyOff!==false)
  return hold('QL457_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 const recoveryExpired=opts.nowMs>=at(r.recoveryExpiresAt);
 const ceremonyExpired=opts.nowMs>=at(c.expiresAt);
 const priorException=s.state==='DURABLE_QL456_ESCALATION_OR_REENROLLMENT_EXCEPTION_OPEN';
 const healthy=!priorException&&!recoveryExpired&&!ceremonyExpired&&
  r.recoveryStatus==='ESCALATION_OUTCOME_ATTESTED_OPEN_HOLD'&&
  r.followUpStatus==='SIGNED_FOLLOWUP_ACKNOWLEDGED_OPEN_HOLD'&&
  w.recurrenceCount===0&&
  c.reEnrollmentStatus==='REENROLLED_REVIEW_ONLY'&&
  h.hostReceiverState==='OFF'&&h.isolationLock&&h.leaseRevoked&&
  h.watchdogArmed&&w.receiverState==='OFF'&&w.isolationConfirmed;
 const classification=healthy?'SIGNED_ESCALATION_FOLLOWUP_AND_REENROLLMENT_CONTINUITY_REVIEW_ONLY':
  'SIGNED_RECURRENCE_OR_REENROLLMENT_EXPIRY_EXCEPTION_OPEN';
 const closureDecision=healthy?
  'RENEW_THREE_MASTER_CLOSURE_EVIDENCE_CONTINUITY_KEEP_OPEN_HOLD':
  'ESCALATE_FOLLOWUP_OR_REENROLLMENT_RECURRENCE_KEEP_OPEN_HOLD';
 const monitorDigest=digest({ql456SummaryDigest:digest(s),monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorDigest:digest(a),witnessDigest:digest(w),ceremonyDigest:digest(c),
  recoveryExpired,ceremonyExpired,recurrenceCount:w.recurrenceCount,
  followUpStatus:r.followUpStatus,reEnrollmentGeneration:c.reEnrollmentGeneration,classification});
 let gate;
 try{gate=await independentGateProvider.readSignedIndependentContinuityGate({
  incidentId:id,prior,monitorId,monitorDigest,classification,closureDecision});}
 catch{return hold('QL457_INDEPENDENT_EXPIRY_GATE_UNAVAILABLE');}
 const g=gate?.payload;
 if(!signed(gate,gateFields,opts.independentGatePin)||
  g.schema!=='rosevear.ql457.independent-ceremony-expiry-gate.v1'||
  g.incidentId!==id||g.monitorId!==monitorId||
  g.ql456ReceiptDigest!==prior||g.monitorDigest!==monitorDigest||
  g.classification!==classification||g.closureDecision!==closureDecision||
  g.incidentStatus!=='OPEN_HOLD'||g.closureAuthorized!==false||
  g.activationAuthorized!==false||g.physicalReceiverCurrentlyOff!==false||
  g.separateCeremonyRequired!==true||
  !fresh(g.attestedAt,opts.nowMs)||at(g.attestedAt)<at(w.observedAt))
  return hold('QL457_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 const gateDigest=digest(g);let votes;
 try{votes=await threeMasterProvider.readSignedCeremonyExpiryVotes({
  incidentId:id,prior,monitorId,monitorDigest,gateDigest,classification,closureDecision});}
 catch{return hold('QL457_THREE_MASTER_EXPIRY_GOVERNANCE_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL457_THREE_DISTINCT_MASTERS_REQUIRED');
 const accepted=[],seen=new Set();
 for(const e of votes){
  const m=e?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(e,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql457.three-master-expiry-review.v1'||
   m.incidentId!==id||m.monitorId!==monitorId||
   m.ql456ReceiptDigest!==prior||m.monitorDigest!==monitorDigest||
   m.gateDigest!==gateDigest||m.classification!==classification||
   m.closureDecision!==closureDecision||m.incidentStatus!=='OPEN_HOLD'||
   !fresh(m.reviewedAt,opts.nowMs)||at(m.reviewedAt)<at(g.attestedAt))
   return hold('QL457_THREE_MASTER_SIGNED_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const reportsDigest=digest(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql457.dual-owner-expiry-review.v1'||
  f.incidentId!==id||f.monitorId!==monitorId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql456ReceiptDigest!==prior||
  f.monitorDigest!==monitorDigest||f.gateDigest!==gateDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.closureDecision!==closureDecision||f.incidentStatus!=='OPEN_HOLD'||
  !fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(v=>at(v.reviewedAt)))||
  !sigOkay(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !sigOkay(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL457_DUAL_OWNER_EXPIRY_VETO');
 let commitNow;
 try{commitNow=opts.readTrustedNowMs();}
 catch{return hold('QL457_TRUSTED_COMMIT_CLOCK_UNAVAILABLE');}
 if(!Number.isSafeInteger(commitNow)||commitNow<opts.nowMs||
  commitNow-opts.nowMs>60000)return hold('QL457_TRUSTED_CLOCK_DRIFT');
 try{
  if(!validQl456(s,ql456Ledger)||
   continuityLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   continuityLedger.read('review',id)||continuityLedger.read('exception',id)||
   !fresh(w.observedAt,commitNow,15000)||
   !fresh(g.attestedAt,commitNow)||!fresh(f.reviewedAt,commitNow))
   return hold('QL457_PROTECTED_CUSTODY_OR_INDEPENDENT_OFF_EXPIRED');
  if(healthy&&(commitNow>=at(r.recoveryExpiresAt)||commitNow>=at(c.expiresAt)))
   return hold('QL457_FOLLOWUP_OR_REENROLLMENT_EXPIRED_DURING_REVIEW');
  const kind=healthy?'review':'exception';
  const receipt=continuityLedger.claimOnce(kind,id,digest({
   prior,pendingDigest:pending.recordDigest,monitorDigest,gateDigest,
   reportsDigest,ownerDigest:digest(f),classification,closureDecision,
   incidentStatus:'OPEN_HOLD'}));
  if(continuityLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(healthy?'HISTORICAL_FRESHNESS_REVIEW_ONLY_NO_CLOSURE':
   'RECOVERY_EXPIRED_AUTHORITY_EXPIRED_OR_SIGNED_OFF_RECURRENCE_REQUIRES_SUPERVISION'),
   state:healthy?'DURABLE_QL457_FOLLOWUP_CONTINUITY_REVIEW_ONLY':
    'DURABLE_QL457_FOLLOWUP_RECURRENCE_EXCEPTION_OPEN',
   originalIncidentId:id,monitorId,challengeNonce,classification,
   closureDecision,masterCount:3,recoveryExpiredAtReview:recoveryExpired,
   ceremonyAuthorityExpiredAtReview:ceremonyExpired,
   followUpStatus:r.followUpStatus,recurrenceCount:w.recurrenceCount,
   reEnrollmentGeneration:c.reEnrollmentGeneration,
   monitorDigest,gateDigest,reportsDigest,
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD',
   permittedNextAction:healthy?'SEPARATE_FRESH_PHYSICAL_OFF_AND_OWNER_CEREMONY_REQUIRED':
    'SUPERVISED_RENEWAL_OR_RECURRENCE_RESPONSE_REQUIRED'};
 }catch{return hold('QL457_DURABLE_FRESHNESS_COMMIT_FAILED');}
}
