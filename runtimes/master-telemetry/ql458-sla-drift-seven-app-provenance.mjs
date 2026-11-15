import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-458: historical-only multi-horizon follow-through SLA, independent ceremony drift and seven-app provenance
 * expiry. Never closes or energizes the physical receiver. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
export const SEVEN_APPS=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub',
 'iCamp','yw','devilndove-site','rosiedazzlers']);
const ROLES=['MASTER_CONTROLLER','MASTER_WITNESS','MASTER_COMMS','CAMPGROUND_SHELL',
 'WORKFORCE_SHELL','COMMERCE_COMPANY','DETAILING_COMPANY'];
const SHA=/^[a-f0-9]{40}$/;
const TOPOLOGY='rosevear-master-shell-seven-apps.v1';
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/,SCHEMA='rosevear.ql458.sla-drift-seven-app-provenance.v1';
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

export function openQl458ProvenanceLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL458_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL458_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL458_INVALID_RECEIPT_KEY');
  return join(root,'ql458-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const name=file(kind,id);let stat;
  try{stat=lstatSync(name);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)||stat.size>4096)
   throw Error('QL458_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(name,'utf8'));}catch{throw Error('QL458_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==digest({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL458_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL458_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};r.recordDigest=digest(r);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)throw Error('QL458_READBACK_MISMATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl457(s,ledger){
 const exception=s?.state==='DURABLE_QL457_FOLLOWUP_RECURRENCE_EXCEPTION_OPEN';
 const review=s?.state==='DURABLE_QL457_FOLLOWUP_CONTINUITY_REVIEW_ONLY';
 if((!exception&&!review)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
 s.activationAuthorized!==false||s.closureAuthorized!==false||
 s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
 s.classification!==(exception?'SIGNED_RECURRENCE_OR_REENROLLMENT_EXPIRY_EXCEPTION_OPEN':'SIGNED_ESCALATION_FOLLOWUP_AND_REENROLLMENT_CONTINUITY_REVIEW_ONLY')||
 s.closureDecision!==(exception?'ESCALATE_FOLLOWUP_OR_REENROLLMENT_RECURRENCE_KEEP_OPEN_HOLD':'RENEW_THREE_MASTER_CLOSURE_EVIDENCE_CONTINUITY_KEEP_OPEN_HOLD')||
 s.ownerAcceptance!=='DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD'||
 !ID.test(s.originalIncidentId??'')||!ID.test(s.monitorId??'')||
 !ID.test(s.challengeNonce??'')||
 typeof s.recoveryExpiredAtReview!=='boolean'||typeof s.ceremonyAuthorityExpiredAtReview!=='boolean'||
 !['SIGNED_FOLLOWUP_ACKNOWLEDGED_OPEN_HOLD','FOLLOWUP_PENDING_OPEN_HOLD'].includes(s.followUpStatus)||
 !Number.isSafeInteger(s.recurrenceCount)||s.recurrenceCount<0||
 !Number.isSafeInteger(s.reEnrollmentGeneration)||s.reEnrollmentGeneration<2||
 ![s.pendingReceiptDigest,s.finalReceiptDigest,s.monitorDigest,s.gateDigest,s.reportsDigest].every(x=>HEX.test(x??''))||
 typeof ledger?.read!=='function')return false;
 try{const id=s.originalIncidentId;return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
 ledger.read(exception?'exception':'review',id)?.recordDigest===s.finalReceiptDigest&&
 !ledger.read(exception?'review':'exception',id);
 }catch{return false;}
}
export function readQl458Provenance(ledger,id){
 try{
  const p=ledger.read('pending',id),good=ledger.read('review',id),
    bad=ledger.read('exception',id);
  if((good||bad)&&(!p||(good&&bad)))return hold('QL458_CONFLICTING_FINAL_CUSTODY');
  if(good)return {...hold('QL458_HISTORICAL_STABILITY_ONLY'),
   state:'QL458_DURABLE_SEVEN_APP_PROVENANCE_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:good.recordDigest};
  if(bad)return {...hold('QL458_SIGNED_RECURRENCE_OR_AUTHORITY_EXPIRY'),
   state:'QL458_DURABLE_SLA_OR_PROVENANCE_EXCEPTION_OPEN',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:bad.recordDigest};
  if(p)return {...hold('QL458_PENDING_MANUAL_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL458_NO_PROTECTED_FRESHNESS_RECEIPT');
 }catch{return hold('QL458_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql457SummaryDigest','ql457ReceiptDigest',
 'ql457MonitorDigest','incidentStatus','readAt'];
const recoveryFields=['schema','incidentId','monitorId','challengeNonce','ql457ReceiptDigest',
 'sourceDigest','recoveryStatus','followUpCaseId','followUpEvidenceDigest','followUpStatus','followUpAcknowledgedAt','followUpOpenedAt','lastOwnerResponseAt','sourceEscalationDigest','recoveryIssuedAt','recoveryExpiresAt','signedAt'];
const hostFields=['schema','incidentId','monitorId','challengeNonce','ql457ReceiptDigest',
 'sourceDigest','recoveryDigest','originalHostId','hostReceiverState',
 'isolationLock','leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const anchorFields=['schema','incidentId','monitorId','challengeNonce',
 'ql457ReceiptDigest','sourceDigest','recoveryDigest','hostDigest',
 'anchorId','anchorSequence','anchorDisposition','anchoredAt'];
const witnessFields=['schema','incidentId','monitorId','challengeNonce',
 'ql457ReceiptDigest','anchorDigest','recoveryDigest','hostDigest',
 'originalHostId','receiverId','sensorId','originalSensorId','receiverState',
 'isolationConfirmed','observerSequence','previousObserverSequence','recurrenceCount','recurrenceWindowStart','recurrenceWindowEnd','observedAt'];
const ceremonyFields=['schema','incidentId','monitorId','ql457ReceiptDigest',
 'recoveryDigest','ceremonyId','issuedAt','expiresAt','previousCeremonyId','reEnrollmentStatus','enrollmentRecordDigest','priorEnrollmentDigest','reEnrollmentGeneration','challengeNonce','challengeDigest','issuerClockDriftMs','enrollmentWitnessDigest','observedAt','authorityDecision',
 'incidentStatus','closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff'];
const gateFields=['schema','incidentId','monitorId','ql457ReceiptDigest',
 'monitorDigest','classification','closureDecision','incidentStatus',
 'closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff',
 'separateCeremonyRequired','attestedAt'];
const masterFields=['schema','incidentId','monitorId','masterId','ql457ReceiptDigest',
 'monitorDigest','gateDigest','classification','closureDecision','incidentStatus','reviewedAt'];
const appFields=['schema','incidentId','monitorId','challengeNonce','priorReceiptDigest',
 'appId','repoFullName','role','topologyId','controllerSha','mainSha','sourceManifestDigest',
 'sourceSignerId','sourceReadAt','runtimeConnection','authorityTransfer','privilegedScope',
 'tenantBoundary','sourceStatus'];
const ownerFields=['schema','incidentId','monitorId','sourceOwnerId','masterOwnerId',
 'ql457ReceiptDigest','monitorDigest','gateDigest','masterReportsDigest',
 'classification','closureDecision','incidentStatus','reviewedAt'];

export async function runQl458ProvenanceReview({
 ql457Summary,ql457Ledger,provenanceLedger,monitorId,challengeNonce,
 originalCommsSourceProvider,independentRecoveryProvider,originalHostProvider,
 independentAnchorProvider,independentPhysicalProvider,ceremonyAuthorityProvider,
 independentGateProvider,threeMasterProvider,sevenAppProvider,finalOwnerDecision
},opts={}){
 if(typeof provenanceLedger?.read!=='function'||typeof provenanceLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl457Case!=='function'||
  typeof independentRecoveryProvider?.readSignedRecoveryOutcome!=='function'||
  typeof originalHostProvider?.readSignedOriginalHostOffReview!=='function'||
  typeof independentAnchorProvider?.readSignedProvenanceAnchor!=='function'||
  typeof independentPhysicalProvider?.readSignedPhysicalRecurrenceWitness!=='function'||
  typeof ceremonyAuthorityProvider?.readSignedHistoricalCeremonyAuthority!=='function'||
  typeof independentGateProvider?.readSignedIndependentProvenanceGate!=='function'||
  typeof threeMasterProvider?.readSignedCeremonyExpiryVotes!=='function'||
  typeof sevenAppProvider?.readSignedSevenAppProvenance!=='function')
  return hold('QL458_NINE_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl457CustodyVerified||!opts.physicalSensorEnrollmentVerified||
  !opts.independentSignerPinsVerified||!opts.separateOwnerRolesVerified||
  !opts.independentlyPinnedSevenAppSourcesVerified||
  typeof opts.readTrustedNowMs!=='function'||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(opts.originalSensorId??'')||!ID.test(opts.priorCeremonyId??'')||
  !SHA.test(opts.controllerSha??'')||!HEX.test(opts.priorEnrollmentDigest??'')||!ID.test(monitorId??'')||
  !ID.test(challengeNonce??'')||challengeNonce===ql457Summary?.challengeNonce||
  !validQl457(ql457Summary,ql457Ledger))
  return hold('QL458_EXACT_QL457_OPEN_CASE_REQUIRED');
 const s=ql457Summary,id=s.originalIncidentId,prior=s.finalReceiptDigest;
 const pins=[opts.commsSourcePin,opts.recoveryOfficerPin,opts.originalHostPin,
  opts.externalAnchorPin,opts.physicalObserverPin,opts.ceremonyAuthorityPin,
  opts.independentGatePin,opts.sourceOwnerPin,opts.masterOwnerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m]),...SEVEN_APPS.map(a=>opts.appPins?.[a])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==19||
  SEVEN_APPS.some(a=>!SHA.test(opts.expectedMainShas?.[a]??''))||
  opts.controllerSha!==opts.expectedMainShas['ai-data-platform'])
  return hold('QL458_NINETEEN_DISTINCT_SIGNER_PINS_OR_PINNED_SHA_REQUIRED');
 try{
  if(provenanceLedger.read('pending',id)||provenanceLedger.read('review',id)||
   provenanceLedger.read('exception',id))
   return hold('QL458_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
 }catch{return hold('QL458_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=provenanceLedger.claimOnce('pending',id,digest({
   ql457SummaryDigest:digest(s),prior,monitorId,challengeNonce}));
  if(provenanceLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL458_PENDING_DURABLE_CLAIM_FAILED');}
 let source,recovery,host,anchor,witness,ceremony;
 try{source=await originalCommsSourceProvider.readSignedQl457Case({
  incidentId:id,prior,monitorId,challengeNonce,pendingDigest:pending.recordDigest});}
 catch{return hold('QL458_ORIGINAL_CASE_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql458.original-ql457-case.v1'||
  p.incidentId!==id||p.ql457SummaryDigest!==digest(s)||
  p.ql457ReceiptDigest!==prior||p.ql457MonitorDigest!==s.monitorDigest||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.readAt,opts.nowMs))
  return hold('QL458_ORIGINAL_SIGNED_CASE_INVALID');
 try{recovery=await independentRecoveryProvider.readSignedRecoveryOutcome({
  incidentId:id,prior,monitorId,challengeNonce,sourceDigest:digest(p)});}
 catch{return hold('QL458_SIGNED_RECOVERY_OUTCOME_UNAVAILABLE');}
 const r=recovery?.payload;
 if(!signed(recovery,recoveryFields,opts.recoveryOfficerPin)||
  r.schema!=='rosevear.ql458.independent-recovery-outcome.v1'||
  r.incidentId!==id||r.monitorId!==monitorId||
  r.challengeNonce!==challengeNonce||r.ql457ReceiptDigest!==prior||
  r.sourceDigest!==digest(p)||!['ESCALATION_OUTCOME_ATTESTED_OPEN_HOLD','UNRESOLVED_OPEN_HOLD'].includes(r.recoveryStatus)||
  !ID.test(r.followUpCaseId??'')||r.followUpCaseId===s.monitorId||
  !HEX.test(r.followUpEvidenceDigest??'')||r.sourceEscalationDigest!==s.monitorDigest||
  !['SIGNED_FOLLOWUP_ACKNOWLEDGED_OPEN_HOLD','FOLLOWUP_PENDING_OPEN_HOLD'].includes(r.followUpStatus)||
  !fresh(r.followUpAcknowledgedAt,opts.nowMs)||at(r.followUpAcknowledgedAt)<at(p.readAt)||
  !Number.isFinite(at(r.followUpOpenedAt))||at(r.followUpOpenedAt)>at(r.followUpAcknowledgedAt)||
  !Number.isFinite(at(r.lastOwnerResponseAt))||
  at(r.lastOwnerResponseAt)<at(r.followUpOpenedAt)||
  at(r.lastOwnerResponseAt)>at(r.signedAt)||
  at(r.followUpAcknowledgedAt)>at(r.signedAt)||
  !fresh(r.signedAt,opts.nowMs)||!Number.isFinite(at(r.recoveryIssuedAt))||
  !Number.isFinite(at(r.recoveryExpiresAt))||
  at(r.recoveryIssuedAt)>at(r.signedAt)||
  at(r.recoveryExpiresAt)<=at(r.recoveryIssuedAt)||
  at(r.recoveryExpiresAt)-at(r.recoveryIssuedAt)>60000||
  at(r.signedAt)<at(p.readAt))
  return hold('QL458_SIGNED_RECOVERY_OUTCOME_INVALID');
 try{host=await originalHostProvider.readSignedOriginalHostOffReview({
  incidentId:id,prior,monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r)});}
 catch{return hold('QL458_ORIGINAL_HOST_OFF_READBACK_UNAVAILABLE');}
 const h=host?.payload;
 if(!signed(host,hostFields,opts.originalHostPin)||
  h.schema!=='rosevear.ql458.original-host-off-review.v1'||
  h.incidentId!==id||h.monitorId!==monitorId||
  h.challengeNonce!==challengeNonce||h.ql457ReceiptDigest!==prior||
  h.sourceDigest!==digest(p)||h.recoveryDigest!==digest(r)||
  h.originalHostId!=='DESKTOP-AE894KC'||
  !['ON','OFF'].includes(h.hostReceiverState)||
  typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
  typeof h.watchdogArmed!=='boolean'||!Number.isSafeInteger(h.hostSequence)||
  h.hostSequence<1||!fresh(h.observedAt,opts.nowMs)||
  at(h.observedAt)<at(r.signedAt))
  return hold('QL458_ORIGINAL_HOST_CONTINUITY_INVALID');
 try{anchor=await independentAnchorProvider.readSignedProvenanceAnchor({
  incidentId:id,prior,monitorId,challengeNonce,sourceDigest:digest(p),
  recoveryDigest:digest(r),hostDigest:digest(h)});}
 catch{return hold('QL458_INDEPENDENT_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.externalAnchorPin)||
  a.schema!=='rosevear.ql458.independent-freshness-anchor.v1'||
  a.incidentId!==id||a.monitorId!==monitorId||
  a.challengeNonce!==challengeNonce||a.ql457ReceiptDigest!==prior||
  a.sourceDigest!==digest(p)||a.recoveryDigest!==digest(r)||
  a.hostDigest!==digest(h)||!ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<=h.hostSequence||
  a.anchorDisposition!=='HISTORICAL_MONITOR_ONLY_OPEN_HOLD'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<at(h.observedAt))
  return hold('QL458_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 try{witness=await independentPhysicalProvider.readSignedPhysicalRecurrenceWitness({
  incidentId:id,prior,monitorId,challengeNonce,
  anchorDigest:digest(a),recoveryDigest:digest(r),hostDigest:digest(h)});}
 catch{return hold('QL458_INDEPENDENT_PHYSICAL_RECURRENCE_UNAVAILABLE');}
 const w=witness?.payload;
 if(!signed(witness,witnessFields,opts.physicalObserverPin)||
  w.schema!=='rosevear.ql458.physical-recurrence-witness.v1'||
  w.incidentId!==id||w.monitorId!==monitorId||
  w.challengeNonce!==challengeNonce||w.ql457ReceiptDigest!==prior||
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
  return hold('QL458_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 try{ceremony=await ceremonyAuthorityProvider.readSignedHistoricalCeremonyAuthority({
  incidentId:id,prior,monitorId,challengeNonce,recoveryDigest:digest(r)});}
 catch{return hold('QL458_HISTORICAL_CEREMONY_AUTHORITY_UNAVAILABLE');}
 const c=ceremony?.payload;
 if(!signed(ceremony,ceremonyFields,opts.ceremonyAuthorityPin)||
  c.schema!=='rosevear.ql458.historical-ceremony-authority.v1'||
  c.incidentId!==id||c.monitorId!==monitorId||
  c.ql457ReceiptDigest!==prior||c.recoveryDigest!==digest(r)||
  !ID.test(c.ceremonyId??'')||c.ceremonyId===opts.priorCeremonyId||
  c.previousCeremonyId!==opts.priorCeremonyId||
  !['REENROLLED_REVIEW_ONLY','PENDING_REENROLLMENT_OPEN_HOLD'].includes(c.reEnrollmentStatus)||
  !HEX.test(c.enrollmentRecordDigest??'')||c.enrollmentRecordDigest===opts.priorEnrollmentDigest||
  c.priorEnrollmentDigest!==opts.priorEnrollmentDigest||
  c.challengeNonce!==challengeNonce||
  c.challengeDigest!==digest({incidentId:id,monitorId,challengeNonce,prior,
    priorEnrollmentDigest:opts.priorEnrollmentDigest})||
  !HEX.test(c.enrollmentWitnessDigest??'')||
  !Number.isSafeInteger(c.issuerClockDriftMs)||
  !fresh(c.observedAt,opts.nowMs)||
  !Number.isSafeInteger(c.reEnrollmentGeneration)||c.reEnrollmentGeneration<=s.reEnrollmentGeneration||
  !Number.isFinite(at(c.issuedAt))||
  !Number.isFinite(at(c.expiresAt))||at(c.expiresAt)<=at(c.issuedAt)||
  at(c.expiresAt)-at(c.issuedAt)>60000||
  c.authorityDecision!=='REENROLLED_HISTORICAL_READINESS_ONLY_NO_CLOSURE'||
  c.incidentStatus!=='OPEN_HOLD'||c.closureAuthorized!==false||
  c.activationAuthorized!==false||c.physicalReceiverCurrentlyOff!==false)
  return hold('QL458_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');

 // Seven independent app manifests are read-only source evidence, never live CONNECTED.
 let appRecords;
 try{appRecords=await sevenAppProvider.readSignedSevenAppProvenance({
  incidentId:id,monitorId,challengeNonce,prior,controllerSha:opts.controllerSha,
  expectedMainShas:{...opts.expectedMainShas}});}
 catch{return hold('QL458_SEVEN_APP_SOURCE_MANIFESTS_UNAVAILABLE');}
 if(!Array.isArray(appRecords)||appRecords.length!==SEVEN_APPS.length)
  return hold('QL458_SEVEN_DISTINCT_SIGNED_APP_SOURCES_REQUIRED');
 const manifests=[],sourceIds=new Set();let denied=0;
 for(let i=0;i<SEVEN_APPS.length;i++){
  const app=SEVEN_APPS[i],record=appRecords[i],m=record?.payload;
  if(!signed(record,appFields,opts.appPins[app])||
   m.schema!=='rosevear.ql458.app-source-provenance.v1'||
   m.incidentId!==id||m.monitorId!==monitorId||
   m.challengeNonce!==challengeNonce||m.priorReceiptDigest!==prior||
   m.appId!==app||m.repoFullName!=='RosevearCreations/'+app||
   m.role!==ROLES[i]||m.topologyId!==TOPOLOGY||
   m.controllerSha!==opts.controllerSha||
   m.mainSha!==opts.expectedMainShas[app]||
   !HEX.test(m.sourceManifestDigest??'')||
   !ID.test(m.sourceSignerId??'')||sourceIds.has(m.sourceSignerId)||
   !fresh(m.sourceReadAt,opts.nowMs)||
   m.runtimeConnection!=='UNVERIFIED_HOLD'||
   m.authorityTransfer!==false||m.privilegedScope!==false||
   m.tenantBoundary!=='ISOLATED_READ_ONLY'||
   !['SOURCE_SIGNED_HELD','SOURCE_DENIED'].includes(m.sourceStatus))
   return hold('QL458_SEVEN_APP_IDENTITY_SCHEMA_PRIVILEGE_OR_PIN_VETO');
  sourceIds.add(m.sourceSignerId);manifests.push(m);
  if(m.sourceStatus==='SOURCE_DENIED')denied++;
 }
 const sourceManifestDigest=digest(manifests);
 const SLA={followUp5m:at(r.followUpAcknowledgedAt)-at(r.followUpOpenedAt)>300000,
  ownerResponse1h:opts.nowMs-at(r.lastOwnerResponseAt)>3600000,
  followUp24h:opts.nowMs-at(r.followUpOpenedAt)>86400000};
 const slaEscalated=Object.values(SLA).some(Boolean);
 const ceremonyDrifted=Math.abs(c.issuerClockDriftMs)>30000;
 const recoveryExpired=opts.nowMs>=at(r.recoveryExpiresAt);
 const ceremonyExpired=opts.nowMs>=at(c.expiresAt);
 const priorException=s.state==='DURABLE_QL457_FOLLOWUP_RECURRENCE_EXCEPTION_OPEN';
 const healthy=!priorException&&!recoveryExpired&&!ceremonyExpired&&
  !slaEscalated&&!ceremonyDrifted&&denied===0&&s.recurrenceCount===0&&
  r.recoveryStatus==='ESCALATION_OUTCOME_ATTESTED_OPEN_HOLD'&&
  r.followUpStatus==='SIGNED_FOLLOWUP_ACKNOWLEDGED_OPEN_HOLD'&&
  w.recurrenceCount===0&&
  c.reEnrollmentStatus==='REENROLLED_REVIEW_ONLY'&&
  h.hostReceiverState==='OFF'&&h.isolationLock&&h.leaseRevoked&&
  h.watchdogArmed&&w.receiverState==='OFF'&&w.isolationConfirmed;
 const classification=healthy?'SIGNED_MULTIHORIZON_SLA_CEREMONY_AND_SEVEN_APP_SOURCE_REVIEW_ONLY':
  'SIGNED_SLA_DRIFT_OR_SEVEN_APP_SOURCE_EXCEPTION_OPEN';
 const closureDecision=healthy?
  'RENEW_THREE_MASTER_SOURCE_PROVENANCE_KEEP_OPEN_HOLD':
  'ESCALATE_SLA_OR_SOURCE_DRIFT_KEEP_OPEN_HOLD';
 const monitorDigest=digest({ql457SummaryDigest:digest(s),monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorDigest:digest(a),witnessDigest:digest(w),ceremonyDigest:digest(c),
  recoveryExpired,ceremonyExpired,recurrenceCount:w.recurrenceCount,
  followUpStatus:r.followUpStatus,reEnrollmentGeneration:c.reEnrollmentGeneration,
  sourceManifestDigest,sourceCount:manifests.length,deniedCount:denied,
  slaBands:SLA,ceremonyDrifted,classification});
 let gate;
 try{gate=await independentGateProvider.readSignedIndependentProvenanceGate({
  incidentId:id,prior,monitorId,monitorDigest,classification,closureDecision});}
 catch{return hold('QL458_INDEPENDENT_EXPIRY_GATE_UNAVAILABLE');}
 const g=gate?.payload;
 if(!signed(gate,gateFields,opts.independentGatePin)||
  g.schema!=='rosevear.ql458.independent-ceremony-expiry-gate.v1'||
  g.incidentId!==id||g.monitorId!==monitorId||
  g.ql457ReceiptDigest!==prior||g.monitorDigest!==monitorDigest||
  g.classification!==classification||g.closureDecision!==closureDecision||
  g.incidentStatus!=='OPEN_HOLD'||g.closureAuthorized!==false||
  g.activationAuthorized!==false||g.physicalReceiverCurrentlyOff!==false||
  g.separateCeremonyRequired!==true||
  !fresh(g.attestedAt,opts.nowMs)||at(g.attestedAt)<at(w.observedAt))
  return hold('QL458_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 const gateDigest=digest(g);let votes;
 try{votes=await threeMasterProvider.readSignedCeremonyExpiryVotes({
  incidentId:id,prior,monitorId,monitorDigest,gateDigest,classification,closureDecision});}
 catch{return hold('QL458_THREE_MASTER_EXPIRY_GOVERNANCE_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL458_THREE_DISTINCT_MASTERS_REQUIRED');
 const accepted=[],seen=new Set();
 for(const e of votes){
  const m=e?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(e,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql458.three-master-expiry-review.v1'||
   m.incidentId!==id||m.monitorId!==monitorId||
   m.ql457ReceiptDigest!==prior||m.monitorDigest!==monitorDigest||
   m.gateDigest!==gateDigest||m.classification!==classification||
   m.closureDecision!==closureDecision||m.incidentStatus!=='OPEN_HOLD'||
   !fresh(m.reviewedAt,opts.nowMs)||at(m.reviewedAt)<at(g.attestedAt))
   return hold('QL458_THREE_MASTER_SIGNED_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const reportsDigest=digest(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql458.dual-owner-expiry-review.v1'||
  f.incidentId!==id||f.monitorId!==monitorId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql457ReceiptDigest!==prior||
  f.monitorDigest!==monitorDigest||f.gateDigest!==gateDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.closureDecision!==closureDecision||f.incidentStatus!=='OPEN_HOLD'||
  !fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(v=>at(v.reviewedAt)))||
  !sigOkay(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !sigOkay(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL458_DUAL_OWNER_EXPIRY_VETO');
 let commitNow;
 try{commitNow=opts.readTrustedNowMs();}
 catch{return hold('QL458_TRUSTED_COMMIT_CLOCK_UNAVAILABLE');}
 if(!Number.isSafeInteger(commitNow)||commitNow<opts.nowMs||
  commitNow-opts.nowMs>60000)return hold('QL458_TRUSTED_CLOCK_DRIFT');
 try{
  if(!validQl457(s,ql457Ledger)||
   provenanceLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   provenanceLedger.read('review',id)||provenanceLedger.read('exception',id)||
   appRecords.some(e=>!fresh(e.payload.sourceReadAt,commitNow))||
   !fresh(c.observedAt,commitNow)||
   !fresh(w.observedAt,commitNow,15000)||
   !fresh(g.attestedAt,commitNow)||!fresh(f.reviewedAt,commitNow))
   return hold('QL458_PROTECTED_CUSTODY_OR_SOURCE_FRESHNESS_EXPIRED');
  if(healthy&&(commitNow>=at(r.recoveryExpiresAt)||commitNow>=at(c.expiresAt)))
   return hold('QL458_FOLLOWUP_OR_REENROLLMENT_EXPIRED_DURING_REVIEW');
  const kind=healthy?'review':'exception';
  const receipt=provenanceLedger.claimOnce(kind,id,digest({
   prior,pendingDigest:pending.recordDigest,monitorDigest,gateDigest,
   reportsDigest,ownerDigest:digest(f),sourceManifestDigest,slaBands:SLA,
   ceremonyDrifted,classification,closureDecision,
   incidentStatus:'OPEN_HOLD'}));
  if(provenanceLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(healthy?'HISTORICAL_SOURCE_PROVENANCE_REVIEW_ONLY_NO_CLOSURE':
   'SLA_AGING_CEREMONY_DRIFT_OR_APP_SOURCE_DENIAL_REQUIRES_SUPERVISION'),
   state:healthy?'DURABLE_QL458_SEVEN_APP_PROVENANCE_REVIEW_ONLY':
    'DURABLE_QL458_SLA_OR_PROVENANCE_EXCEPTION_OPEN',
   originalIncidentId:id,monitorId,challengeNonce,classification,
   closureDecision,masterCount:3,recoveryExpiredAtReview:recoveryExpired,
   ceremonyAuthorityExpiredAtReview:ceremonyExpired,
   followUpStatus:r.followUpStatus,recurrenceCount:w.recurrenceCount,
   reEnrollmentGeneration:c.reEnrollmentGeneration,
   slaBands:SLA,ceremonyDrifted,sourceManifestDigest,
   sourceCount:manifests.length,sourceDenials:denied,
   monitorDigest,gateDigest,reportsDigest,
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD',
   permittedNextAction:healthy?'SEPARATE_FRESH_PHYSICAL_OFF_AND_OWNER_CEREMONY_REQUIRED':
    'SUPERVISED_RENEWAL_OR_RECURRENCE_RESPONSE_REQUIRED'};
 }catch{return hold('QL458_DURABLE_FRESHNESS_COMMIT_FAILED');}
}
