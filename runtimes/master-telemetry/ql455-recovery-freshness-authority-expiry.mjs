import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-455: historical-only recovery freshness and signed ceremony-authority
 * expiry. Never closes or energizes the physical receiver. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/,SCHEMA='rosevear.ql455.recovery-freshness-authority-expiry.v1';
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

export function openQl455FreshnessLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL455_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL455_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL455_INVALID_RECEIPT_KEY');
  return join(root,'ql455-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const name=file(kind,id);let stat;
  try{stat=lstatSync(name);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)||stat.size>4096)
   throw Error('QL455_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(name,'utf8'));}catch{throw Error('QL455_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==digest({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL455_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL455_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};r.recordDigest=digest(r);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)throw Error('QL455_READBACK_MISMATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl454(s,ledger){
 const issue=s?.state==='DURABLE_QL454_WITNESS_RECOVERY_EXCEPTION_OPEN';
 const stable=s?.state==='DURABLE_QL454_WITNESS_RECOVERY_READINESS_REVIEW_ONLY';
 if((!issue&&!stable)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
  s.activationAuthorized!==false||s.closureAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
  typeof s.expiredWitnessRecoveryEvidenced!=='boolean'||
  typeof s.originalHostContinuityEvidenced!=='boolean'||
  (issue&&s.expiredWitnessRecoveryEvidenced)||
  s.classification!==(issue?'SIGNED_WITNESS_RECOVERY_OR_CONTINUITY_EXCEPTION_OPEN':
   (s.expiredWitnessRecoveryEvidenced?
    'SIGNED_HISTORICAL_EXPIRED_WITNESS_RECOVERY_REVIEW_ONLY':
    'SIGNED_HISTORICAL_HOST_CONTINUITY_RENEWAL_REVIEW_ONLY'))||
  s.closureDecision!==(issue?'ESCALATE_RECOVERY_EXCEPTION_KEEP_OPEN_HOLD':
   'THREE_MASTER_CEREMONY_READINESS_EVIDENCE_ONLY_KEEP_OPEN_HOLD')||
  s.ownerAcceptance!=='DUAL_SIGNED_CEREMONY_READINESS_KEEP_INCIDENT_OPEN_HOLD'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.recoveryId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.pendingReceiptDigest,s.finalReceiptDigest,s.recoveryDigest,
    s.boundaryDigest,s.reportsDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(issue?'exception':'review',id)?.recordDigest===s.finalReceiptDigest&&
   !ledger.read(issue?'review':'exception',id);
 }catch{return false;}
}
export function readQl455Freshness(ledger,id){
 try{
  const p=ledger.read('pending',id),good=ledger.read('review',id),
    bad=ledger.read('exception',id);
  if((good||bad)&&(!p||(good&&bad)))return hold('QL455_CONFLICTING_FINAL_CUSTODY');
  if(good)return {...hold('QL455_HISTORICAL_STABILITY_ONLY'),
   state:'QL455_DURABLE_RECOVERY_FRESHNESS_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:good.recordDigest};
  if(bad)return {...hold('QL455_SIGNED_RECURRENCE_OR_AUTHORITY_EXPIRY'),
   state:'QL455_DURABLE_AUTHORITY_EXPIRY_OR_RECURRENCE_EXCEPTION_OPEN',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:bad.recordDigest};
  if(p)return {...hold('QL455_PENDING_MANUAL_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL455_NO_PROTECTED_FRESHNESS_RECEIPT');
 }catch{return hold('QL455_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql454SummaryDigest','ql454ReceiptDigest',
 'ql454RecoveryDigest','incidentStatus','readAt'];
const recoveryFields=['schema','incidentId','monitorId','challengeNonce','ql454ReceiptDigest',
 'sourceDigest','recoveryStatus','recoveryIssuedAt','recoveryExpiresAt','signedAt'];
const hostFields=['schema','incidentId','monitorId','challengeNonce','ql454ReceiptDigest',
 'sourceDigest','recoveryDigest','originalHostId','hostReceiverState',
 'isolationLock','leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const anchorFields=['schema','incidentId','monitorId','challengeNonce',
 'ql454ReceiptDigest','sourceDigest','recoveryDigest','hostDigest',
 'anchorId','anchorSequence','anchorDisposition','anchoredAt'];
const witnessFields=['schema','incidentId','monitorId','challengeNonce',
 'ql454ReceiptDigest','anchorDigest','recoveryDigest','hostDigest',
 'originalHostId','receiverId','sensorId','originalSensorId','receiverState',
 'isolationConfirmed','observerSequence','observedAt'];
const ceremonyFields=['schema','incidentId','monitorId','ql454ReceiptDigest',
 'recoveryDigest','ceremonyId','issuedAt','expiresAt','authorityDecision',
 'incidentStatus','closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff'];
const gateFields=['schema','incidentId','monitorId','ql454ReceiptDigest',
 'monitorDigest','classification','closureDecision','incidentStatus',
 'closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff',
 'separateCeremonyRequired','attestedAt'];
const masterFields=['schema','incidentId','monitorId','masterId','ql454ReceiptDigest',
 'monitorDigest','gateDigest','classification','closureDecision','incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','monitorId','sourceOwnerId','masterOwnerId',
 'ql454ReceiptDigest','monitorDigest','gateDigest','masterReportsDigest',
 'classification','closureDecision','incidentStatus','reviewedAt'];

export async function runQl455FreshnessReview({
 ql454Summary,ql454Ledger,freshnessLedger,monitorId,challengeNonce,
 originalCommsSourceProvider,independentRecoveryProvider,originalHostProvider,
 independentAnchorProvider,independentPhysicalProvider,ceremonyAuthorityProvider,
 independentGateProvider,threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof freshnessLedger?.read!=='function'||typeof freshnessLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl454Case!=='function'||
  typeof independentRecoveryProvider?.readSignedRecoveryOutcome!=='function'||
  typeof originalHostProvider?.readSignedOriginalHostOffReview!=='function'||
  typeof independentAnchorProvider?.readSignedFreshnessAnchor!=='function'||
  typeof independentPhysicalProvider?.readSignedPhysicalRecurrenceWitness!=='function'||
  typeof ceremonyAuthorityProvider?.readSignedHistoricalCeremonyAuthority!=='function'||
  typeof independentGateProvider?.readSignedIndependentClosureGate!=='function'||
  typeof threeMasterProvider?.readSignedCeremonyExpiryVotes!=='function')
  return hold('QL455_EIGHT_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl454CustodyVerified||!opts.physicalSensorEnrollmentVerified||
  !opts.independentSignerPinsVerified||!opts.separateOwnerRolesVerified||
  typeof opts.readTrustedNowMs!=='function'||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(opts.originalSensorId??'')||!ID.test(monitorId??'')||
  !ID.test(challengeNonce??'')||challengeNonce===ql454Summary?.challengeNonce||
  !validQl454(ql454Summary,ql454Ledger))
  return hold('QL455_EXACT_QL454_OPEN_CASE_REQUIRED');
 const s=ql454Summary,id=s.originalIncidentId,prior=s.finalReceiptDigest;
 const pins=[opts.commsSourcePin,opts.recoveryOfficerPin,opts.originalHostPin,
  opts.externalAnchorPin,opts.physicalObserverPin,opts.ceremonyAuthorityPin,
  opts.independentGatePin,opts.sourceOwnerPin,opts.masterOwnerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==12)
  return hold('QL455_TWELVE_DISTINCT_SIGNER_PINS_REQUIRED');
 try{
  if(freshnessLedger.read('pending',id)||freshnessLedger.read('review',id)||
   freshnessLedger.read('exception',id))
   return hold('QL455_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
 }catch{return hold('QL455_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=freshnessLedger.claimOnce('pending',id,digest({
   ql454SummaryDigest:digest(s),prior,monitorId,challengeNonce}));
  if(freshnessLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL455_PENDING_DURABLE_CLAIM_FAILED');}
 let source,recovery,host,anchor,witness,ceremony;
 try{source=await originalCommsSourceProvider.readSignedQl454Case({
  incidentId:id,prior,monitorId,challengeNonce,pendingDigest:pending.recordDigest});}
 catch{return hold('QL455_ORIGINAL_CASE_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql455.original-ql454-case.v1'||
  p.incidentId!==id||p.ql454SummaryDigest!==digest(s)||
  p.ql454ReceiptDigest!==prior||p.ql454RecoveryDigest!==s.recoveryDigest||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.readAt,opts.nowMs))
  return hold('QL455_ORIGINAL_SIGNED_CASE_INVALID');
 try{recovery=await independentRecoveryProvider.readSignedRecoveryOutcome({
  incidentId:id,prior,monitorId,challengeNonce,sourceDigest:digest(p)});}
 catch{return hold('QL455_SIGNED_RECOVERY_OUTCOME_UNAVAILABLE');}
 const r=recovery?.payload;
 if(!signed(recovery,recoveryFields,opts.recoveryOfficerPin)||
  r.schema!=='rosevear.ql455.independent-recovery-outcome.v1'||
  r.incidentId!==id||r.monitorId!==monitorId||
  r.challengeNonce!==challengeNonce||r.ql454ReceiptDigest!==prior||
  r.sourceDigest!==digest(p)||!['RECOVERED_UNDER_HOLD','UNRESOLVED_OPEN_HOLD'].includes(r.recoveryStatus)||
  !fresh(r.signedAt,opts.nowMs)||!Number.isFinite(at(r.recoveryIssuedAt))||
  !Number.isFinite(at(r.recoveryExpiresAt))||
  at(r.recoveryIssuedAt)>at(r.signedAt)||
  at(r.recoveryExpiresAt)<=at(r.recoveryIssuedAt)||
  at(r.recoveryExpiresAt)-at(r.recoveryIssuedAt)>60000||
  at(r.signedAt)<at(p.readAt))
  return hold('QL455_SIGNED_RECOVERY_OUTCOME_INVALID');
 try{host=await originalHostProvider.readSignedOriginalHostOffReview({
  incidentId:id,prior,monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r)});}
 catch{return hold('QL455_ORIGINAL_HOST_OFF_READBACK_UNAVAILABLE');}
 const h=host?.payload;
 if(!signed(host,hostFields,opts.originalHostPin)||
  h.schema!=='rosevear.ql455.original-host-off-review.v1'||
  h.incidentId!==id||h.monitorId!==monitorId||
  h.challengeNonce!==challengeNonce||h.ql454ReceiptDigest!==prior||
  h.sourceDigest!==digest(p)||h.recoveryDigest!==digest(r)||
  h.originalHostId!=='DESKTOP-AE894KC'||
  !['ON','OFF'].includes(h.hostReceiverState)||
  typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
  typeof h.watchdogArmed!=='boolean'||!Number.isSafeInteger(h.hostSequence)||
  h.hostSequence<1||!fresh(h.observedAt,opts.nowMs)||
  at(h.observedAt)<at(r.signedAt))
  return hold('QL455_ORIGINAL_HOST_CONTINUITY_INVALID');
 try{anchor=await independentAnchorProvider.readSignedFreshnessAnchor({
  incidentId:id,prior,monitorId,challengeNonce,sourceDigest:digest(p),
  recoveryDigest:digest(r),hostDigest:digest(h)});}
 catch{return hold('QL455_INDEPENDENT_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.externalAnchorPin)||
  a.schema!=='rosevear.ql455.independent-freshness-anchor.v1'||
  a.incidentId!==id||a.monitorId!==monitorId||
  a.challengeNonce!==challengeNonce||a.ql454ReceiptDigest!==prior||
  a.sourceDigest!==digest(p)||a.recoveryDigest!==digest(r)||
  a.hostDigest!==digest(h)||!ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<=h.hostSequence||
  a.anchorDisposition!=='HISTORICAL_MONITOR_ONLY_OPEN_HOLD'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<at(h.observedAt))
  return hold('QL455_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 try{witness=await independentPhysicalProvider.readSignedPhysicalRecurrenceWitness({
  incidentId:id,prior,monitorId,challengeNonce,
  anchorDigest:digest(a),recoveryDigest:digest(r),hostDigest:digest(h)});}
 catch{return hold('QL455_INDEPENDENT_PHYSICAL_RECURRENCE_UNAVAILABLE');}
 const w=witness?.payload;
 if(!signed(witness,witnessFields,opts.physicalObserverPin)||
  w.schema!=='rosevear.ql455.physical-recurrence-witness.v1'||
  w.incidentId!==id||w.monitorId!==monitorId||
  w.challengeNonce!==challengeNonce||w.ql454ReceiptDigest!==prior||
  w.anchorDigest!==digest(a)||w.recoveryDigest!==digest(r)||
  w.hostDigest!==digest(h)||w.originalHostId!=='DESKTOP-AE894KC'||
  w.receiverId!=='ISOLATED_COMMS_RECEIVER'||!ID.test(w.sensorId??'')||
  w.originalSensorId!==opts.originalSensorId||
  w.sensorId===w.originalSensorId||!['ON','OFF'].includes(w.receiverState)||
  typeof w.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(w.observerSequence)||w.observerSequence<=a.anchorSequence||
  !fresh(w.observedAt,opts.nowMs,15000)||
  at(w.observedAt)<at(a.anchoredAt))
  return hold('QL455_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 try{ceremony=await ceremonyAuthorityProvider.readSignedHistoricalCeremonyAuthority({
  incidentId:id,prior,monitorId,challengeNonce,recoveryDigest:digest(r)});}
 catch{return hold('QL455_HISTORICAL_CEREMONY_AUTHORITY_UNAVAILABLE');}
 const c=ceremony?.payload;
 if(!signed(ceremony,ceremonyFields,opts.ceremonyAuthorityPin)||
  c.schema!=='rosevear.ql455.historical-ceremony-authority.v1'||
  c.incidentId!==id||c.monitorId!==monitorId||
  c.ql454ReceiptDigest!==prior||c.recoveryDigest!==digest(r)||
  !ID.test(c.ceremonyId??'')||!Number.isFinite(at(c.issuedAt))||
  !Number.isFinite(at(c.expiresAt))||at(c.expiresAt)<=at(c.issuedAt)||
  at(c.expiresAt)-at(c.issuedAt)>60000||
  c.authorityDecision!=='HISTORICAL_READINESS_ONLY_NO_CLOSURE'||
  c.incidentStatus!=='OPEN_HOLD'||c.closureAuthorized!==false||
  c.activationAuthorized!==false||c.physicalReceiverCurrentlyOff!==false)
  return hold('QL455_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 const recoveryExpired=opts.nowMs>=at(r.recoveryExpiresAt);
 const ceremonyExpired=opts.nowMs>=at(c.expiresAt);
 const priorException=s.state==='DURABLE_QL454_WITNESS_RECOVERY_EXCEPTION_OPEN';
 const healthy=!priorException&&!recoveryExpired&&!ceremonyExpired&&
  r.recoveryStatus==='RECOVERED_UNDER_HOLD'&&
  h.hostReceiverState==='OFF'&&h.isolationLock&&h.leaseRevoked&&
  h.watchdogArmed&&w.receiverState==='OFF'&&w.isolationConfirmed;
 const classification=healthy?'SIGNED_RECOVERY_AND_CEREMONY_FRESHNESS_REVIEW_ONLY':
  'SIGNED_RECOVERY_EXPIRY_OR_OFF_RECURRENCE_EXCEPTION_OPEN';
 const closureDecision=healthy?
  'REVERIFY_THREE_MASTER_READINESS_ONLY_KEEP_INCIDENT_OPEN_HOLD':
  'ESCALATE_EXPIRED_AUTHORITY_OR_RECURRENCE_KEEP_INCIDENT_OPEN_HOLD';
 const monitorDigest=digest({ql454SummaryDigest:digest(s),monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorDigest:digest(a),witnessDigest:digest(w),ceremonyDigest:digest(c),
  recoveryExpired,ceremonyExpired,classification});
 let gate;
 try{gate=await independentGateProvider.readSignedIndependentClosureGate({
  incidentId:id,prior,monitorId,monitorDigest,classification,closureDecision});}
 catch{return hold('QL455_INDEPENDENT_EXPIRY_GATE_UNAVAILABLE');}
 const g=gate?.payload;
 if(!signed(gate,gateFields,opts.independentGatePin)||
  g.schema!=='rosevear.ql455.independent-ceremony-expiry-gate.v1'||
  g.incidentId!==id||g.monitorId!==monitorId||
  g.ql454ReceiptDigest!==prior||g.monitorDigest!==monitorDigest||
  g.classification!==classification||g.closureDecision!==closureDecision||
  g.incidentStatus!=='OPEN_HOLD'||g.closureAuthorized!==false||
  g.activationAuthorized!==false||g.physicalReceiverCurrentlyOff!==false||
  g.separateCeremonyRequired!==true||
  !fresh(g.attestedAt,opts.nowMs)||at(g.attestedAt)<at(w.observedAt))
  return hold('QL455_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 const gateDigest=digest(g);let votes;
 try{votes=await threeMasterProvider.readSignedCeremonyExpiryVotes({
  incidentId:id,prior,monitorId,monitorDigest,gateDigest,classification,closureDecision});}
 catch{return hold('QL455_THREE_MASTER_EXPIRY_GOVERNANCE_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL455_THREE_DISTINCT_MASTERS_REQUIRED');
 const accepted=[],seen=new Set();
 for(const e of votes){
  const m=e?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(e,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql455.three-master-expiry-review.v1'||
   m.incidentId!==id||m.monitorId!==monitorId||
   m.ql454ReceiptDigest!==prior||m.monitorDigest!==monitorDigest||
   m.gateDigest!==gateDigest||m.classification!==classification||
   m.closureDecision!==closureDecision||m.incidentStatus!=='OPEN_HOLD'||
   !fresh(m.reviewedAt,opts.nowMs)||at(m.reviewedAt)<at(g.attestedAt))
   return hold('QL455_THREE_MASTER_SIGNED_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const reportsDigest=digest(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql455.dual-owner-expiry-review.v1'||
  f.incidentId!==id||f.monitorId!==monitorId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql454ReceiptDigest!==prior||
  f.monitorDigest!==monitorDigest||f.gateDigest!==gateDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.closureDecision!==closureDecision||f.incidentStatus!=='OPEN_HOLD'||
  !fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(v=>at(v.reviewedAt)))||
  !sigOkay(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !sigOkay(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL455_DUAL_OWNER_EXPIRY_VETO');
 let commitNow;
 try{commitNow=opts.readTrustedNowMs();}
 catch{return hold('QL455_TRUSTED_COMMIT_CLOCK_UNAVAILABLE');}
 if(!Number.isSafeInteger(commitNow)||commitNow<opts.nowMs||
  commitNow-opts.nowMs>60000)return hold('QL455_TRUSTED_CLOCK_DRIFT');
 try{
  if(!validQl454(s,ql454Ledger)||
   freshnessLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   freshnessLedger.read('review',id)||freshnessLedger.read('exception',id)||
   !fresh(w.observedAt,commitNow,15000)||
   !fresh(g.attestedAt,commitNow)||!fresh(f.reviewedAt,commitNow))
   return hold('QL455_PROTECTED_CUSTODY_OR_INDEPENDENT_OFF_EXPIRED');
  if(healthy&&(commitNow>=at(r.recoveryExpiresAt)||commitNow>=at(c.expiresAt)))
   return hold('QL455_RECOVERY_OR_CEREMONY_EXPIRED_DURING_REVIEW');
  const kind=healthy?'review':'exception';
  const receipt=freshnessLedger.claimOnce(kind,id,digest({
   prior,pendingDigest:pending.recordDigest,monitorDigest,gateDigest,
   reportsDigest,ownerDigest:digest(f),classification,closureDecision,
   incidentStatus:'OPEN_HOLD'}));
  if(freshnessLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(healthy?'HISTORICAL_FRESHNESS_REVIEW_ONLY_NO_CLOSURE':
   'RECOVERY_EXPIRED_AUTHORITY_EXPIRED_OR_SIGNED_OFF_RECURRENCE_REQUIRES_SUPERVISION'),
   state:healthy?'DURABLE_QL455_RECOVERY_FRESHNESS_REVIEW_ONLY':
    'DURABLE_QL455_RECOVERY_EXPIRY_OR_OFF_RECURRENCE_EXCEPTION_OPEN',
   originalIncidentId:id,monitorId,challengeNonce,classification,
   closureDecision,masterCount:3,recoveryExpiredAtReview:recoveryExpired,
   ceremonyAuthorityExpiredAtReview:ceremonyExpired,
   monitorDigest,gateDigest,reportsDigest,
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD',
   permittedNextAction:healthy?'SEPARATE_FRESH_PHYSICAL_OFF_AND_OWNER_CEREMONY_REQUIRED':
    'SUPERVISED_RENEWAL_OR_RECURRENCE_RESPONSE_REQUIRED'};
 }catch{return hold('QL455_DURABLE_FRESHNESS_COMMIT_FAILED');}
}
