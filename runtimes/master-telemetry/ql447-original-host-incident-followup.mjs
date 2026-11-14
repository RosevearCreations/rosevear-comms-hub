import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-447 consumes evidence, not a receiver control channel. All outcomes
 * retain HOLD and an OPEN incident; historical signed OFF is not live OFF. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/;
const SCHEMA='rosevear.ql447.original-host-incident-followup.v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const millis=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(millis(x))&&
 millis(x)<=now&&now-millis(x)<=60000;
const held=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,physicalReceiverCurrentlyOff:false,
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,ownerAcceptance:'HOLD',
 incidentStatus:'OPEN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signatureValid(payload,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const signed=(envelope,keys,pin)=>exact(envelope,['payload','signature'])&&
 exact(envelope.payload,keys)&&signatureValid(envelope.payload,envelope.signature,pin);
const sourceKeys=['schema','incidentId','ql446SummaryDigest','ql446EscalationReceiptDigest',
 'priorClassification','incidentStatus','observedAt'];
const hostKeys=['schema','incidentId','originalHostId','challengeNonce',
 'ql446EscalationReceiptDigest','sourceDigest','receiverState','isolationLock',
 'leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const observerKeys=['schema','incidentId','challengeNonce','ql446EscalationReceiptDigest',
 'signedHostDigest','receiverState','isolationConfirmed','observerSequence','observedAt'];
const masterKeys=['schema','incidentId','followUpId','masterId','ql446EscalationReceiptDigest',
 'isolationEvidenceDigest','classification','correctiveDecision','incidentStatus','reviewedAt'];
const ownerKeys=['schema','incidentId','followUpId','sourceOwnerId','masterOwnerId',
 'ql446EscalationReceiptDigest','isolationEvidenceDigest','masterReportsDigest',
 'classification','correctiveDecision','incidentStatus','reviewedAt'];

export function openQl447IncidentLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL447_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL447_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','reconfirmed','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL447_INVALID_RECORD_KEY');
  return join(root,'ql447-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const filename=file(kind,id);
  let st;try{st=lstatSync(filename);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||
   st.size>4096)throw Error('QL447_UNSAFE_PRIVATE_RECORD');
  let record;try{record=JSON.parse(readFileSync(filename,'utf8'));}
  catch{throw Error('QL447_CORRUPT_RECORD');}
  if(!exact(record,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   record.schema!==SCHEMA||record.kind!==kind||record.incidentId!==id||
   !HEX.test(record.evidenceDigest??'')||
   record.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,
    evidenceDigest:record.evidenceDigest}))throw Error('QL447_TAMPERED_RECORD');
  return record;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL447_ALREADY_CLAIMED');
  const record={schema:SCHEMA,kind,incidentId:id,evidenceDigest};
  record.recordDigest=hash(record);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(record));fsyncSync(fd);}finally{closeSync(fd);}
  const df=openSync(root,'r');try{fsyncSync(df);}finally{closeSync(df);}
  if(read(kind,id)?.recordDigest!==record.recordDigest)
   throw Error('QL447_PRIVATE_READBACK_FAILED');
  return record;
 };
 return Object.freeze({read,claimOnce});
}
function validPrior(prior,ledger){
 if(!prior||prior.state!=='DURABLE_QL446_RECURRENCE_REOPENING_CASE_OPEN'||
  prior.connection!=='HOLD'||prior.activationAuthorized!==false||
  prior.physicalReceiverCurrentlyOff!==false||prior.masterCount!==3||
  prior.recurrenceDetected!==true||
  !['SIGNED_RECURRENCE_ESCALATE_REOPEN',
   'SIGNED_STATE_DIVERGENCE_SAFETY_ESCALATION'].includes(prior.classification)||
  !ID.test(prior.originalIncidentId??'')||!ID.test(prior.challengeNonce??'')||
  ![prior.pendingReceiptDigest,prior.escalationReceiptDigest,prior.watchDigest,
    prior.masterReportsDigest].every(v=>HEX.test(v??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=prior.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===prior.pendingReceiptDigest&&
   ledger.read('escalation',id)?.recordDigest===prior.escalationReceiptDigest&&
   !ledger.read('watch',id);
 }catch{return false;}
}
export function readQl447IncidentFollowUp(ledger,id){
 try{
  const p=ledger.read('pending',id),ok=ledger.read('reconfirmed',id),
   err=ledger.read('exception',id);
  if((ok||err)&&(!p||(ok&&err)))
   return held('QL447_CONFLICTING_OR_ORPHANED_FOLLOWUP');
  if(ok)return {...held('QL447_HISTORICAL_SIGNED_ISOLATION_ONLY_INCIDENT_OPEN'),
   state:'QL447_DURABLE_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY',
   pendingReceiptDigest:p.recordDigest,followUpReceiptDigest:ok.recordDigest};
  if(err)return {...held('QL447_SIGNED_ISOLATION_EXCEPTION_INCIDENT_OPEN'),
   state:'QL447_DURABLE_ISOLATION_EXCEPTION_ESCALATED',
   pendingReceiptDigest:p.recordDigest,followUpReceiptDigest:err.recordDigest};
  if(p)return {...held('QL447_PENDING_REQUIRES_SUPERVISED_RECOVERY'),
   pendingReceiptDigest:p.recordDigest};
  return held('QL447_NO_PROTECTED_INCIDENT_FOLLOWUP');
 }catch{return held('QL447_PRIVATE_CUSTODY_UNREADABLE');}
}
/** Requires *external* pinned source, host and independent observer signers.
 * A successful receipt never closes a recurrence case or claims live OFF. */
export async function runQl447IncidentFollowUp({
 ql446Summary,ql446Ledger,incidentLedger,challengeNonce,followUpId,
 originalCommsSourceProvider,originalHostProvider,independentObserverProvider,
 threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof incidentLedger?.read!=='function'||
  typeof incidentLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedRecurrenceIncident!=='function'||
  typeof originalHostProvider?.readSignedIsolationReconfirmation!=='function'||
  typeof independentObserverProvider?.readSignedIsolationReadback!=='function'||
  typeof threeMasterProvider?.readSignedCorrectiveFollowUps!=='function')
  return held('QL447_EXTERNAL_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl446CustodyVerified||!opts.separateOwnerRolesVerified||
  !Number.isSafeInteger(opts.nowMs)||!ID.test(challengeNonce??'')||
  !ID.test(followUpId??'')||challengeNonce===ql446Summary?.challengeNonce||
  !validPrior(ql446Summary,ql446Ledger))
  return held('QL447_EXACT_REOPENED_QL446_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 const s=ql446Summary,id=s.originalIncidentId,prior=s.escalationReceiptDigest;
 const pins=[opts.commsSourcePin,opts.originalHostPin,opts.independentReceiverPin,
  opts.sourceOwnerPin,opts.masterOwnerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string'||!x)||new Set(pins).size!==pins.length||
  !opts.independentSignerPinsVerified)
  return held('QL447_DISTINCT_INDEPENDENT_SIGNER_PINS_REQUIRED');
 try{
  if(incidentLedger.read('pending',id)||incidentLedger.read('reconfirmed',id)||
   incidentLedger.read('exception',id))
   return held('QL447_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
 }catch{return held('QL447_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=incidentLedger.claimOnce('pending',id,hash({
   incidentId:id,ql446SummaryDigest:hash(s),prior,challengeNonce,followUpId}));
  if(incidentLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('pending');
 }catch{return held('QL447_PENDING_PRIVATE_COMMIT_FAILED');}
 let source,host,observer;
 try{source=await originalCommsSourceProvider.readSignedRecurrenceIncident({
  incidentId:id,prior,challengeNonce,followUpId,pendingDigest:pending.recordDigest});}
 catch{return held('QL447_ORIGINAL_REOPENED_INCIDENT_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceKeys,opts.commsSourcePin)||
  p.schema!=='rosevear.ql447.original-source-recurrence-incident.v1'||
  p.incidentId!==id||p.ql446SummaryDigest!==hash(s)||
  p.ql446EscalationReceiptDigest!==prior||
  p.priorClassification!==s.classification||p.incidentStatus!=='OPEN_HOLD'||
  !fresh(p.observedAt,opts.nowMs))
  return held('QL447_SIGNED_ORIGINAL_INCIDENT_INVALID');
 try{host=await originalHostProvider.readSignedIsolationReconfirmation({
  incidentId:id,challengeNonce,followUpId,prior,sourceDigest:hash(p)});}
 catch{return held('QL447_ORIGINAL_HOST_ISOLATION_UNAVAILABLE');}
 const h=host?.payload;
 if(!signed(host,hostKeys,opts.originalHostPin)||
  h.schema!=='rosevear.ql447.original-host-isolation-reconfirmation.v1'||
  h.incidentId!==id||h.originalHostId!=='DESKTOP-AE894KC'||
  h.challengeNonce!==challengeNonce||h.ql446EscalationReceiptDigest!==prior||
  h.sourceDigest!==hash(p)||!['ON','OFF'].includes(h.receiverState)||
  !['boolean'].includes(typeof h.isolationLock)||
  typeof h.leaseRevoked!=='boolean'||typeof h.watchdogArmed!=='boolean'||
  !Number.isSafeInteger(h.hostSequence)||h.hostSequence<1||
  !fresh(h.observedAt,opts.nowMs)||millis(h.observedAt)<millis(p.observedAt))
  return held('QL447_SIGNED_ORIGINAL_HOST_ISOLATION_INVALID');
 try{observer=await independentObserverProvider.readSignedIsolationReadback({
  incidentId:id,challengeNonce,followUpId,prior,signedHostDigest:hash(h)});}
 catch{return held('QL447_INDEPENDENT_ISOLATION_OBSERVER_UNAVAILABLE');}
 const w=observer?.payload;
 if(!signed(observer,observerKeys,opts.independentReceiverPin)||
  w.schema!=='rosevear.ql447.independent-isolation-readback.v1'||
  w.incidentId!==id||w.challengeNonce!==challengeNonce||
  w.ql446EscalationReceiptDigest!==prior||w.signedHostDigest!==hash(h)||
  !['ON','OFF'].includes(w.receiverState)||
  typeof w.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(w.observerSequence)||w.observerSequence<=h.hostSequence||
  !fresh(w.observedAt,opts.nowMs)||millis(w.observedAt)<millis(h.observedAt))
  return held('QL447_SIGNED_INDEPENDENT_ISOLATION_INVALID');
 const confirmed=h.receiverState==='OFF'&&w.receiverState==='OFF'&&
  h.isolationLock&&h.leaseRevoked&&h.watchdogArmed&&w.isolationConfirmed;
 const classification=confirmed?'SIGNED_HISTORICAL_ISOLATION_RECONFIRMED_INCIDENT_OPEN':
  'SIGNED_ISOLATION_RECONFIRMATION_EXCEPTION_INCIDENT_OPEN';
 const correctiveDecision=confirmed?'CONTINUE_MANUAL_ISOLATION_MONITORING_KEEP_INCIDENT_OPEN':
  'ESCALATE_ISOLATION_FAILURE_FOR_SUPERVISED_CORRECTION_KEEP_OPEN';
 const evidenceDigest=hash({ql446SummaryDigest:hash(s),challengeNonce,followUpId,
  sourceDigest:hash(p),hostDigest:hash(h),observerDigest:hash(w),classification});
 let votes;
 try{votes=await threeMasterProvider.readSignedCorrectiveFollowUps({
  incidentId:id,followUpId,prior,evidenceDigest,classification,correctiveDecision});}
 catch{return held('QL447_THREE_MASTER_CORRECTIVE_FOLLOWUP_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return held('QL447_THREE_MASTER_CORRECTIVE_REVIEWS_REQUIRED');
 const accepted=[],seen=new Set();
 for(const envelope of votes){
  const v=envelope?.payload;
  if(!MASTERS.includes(v?.masterId)||seen.has(v.masterId)||
   !signed(envelope,masterKeys,opts.masterPins[v.masterId])||
   v.schema!=='rosevear.ql447.three-master-corrective-followup.v1'||
   v.incidentId!==id||v.followUpId!==followUpId||
   v.ql446EscalationReceiptDigest!==prior||
   v.isolationEvidenceDigest!==evidenceDigest||
   v.classification!==classification||v.correctiveDecision!==correctiveDecision||
   v.incidentStatus!=='OPEN_HOLD'||
   !fresh(v.reviewedAt,opts.nowMs)||millis(v.reviewedAt)<millis(w.observedAt))
   return held('QL447_THREE_MASTER_SIGNED_CORRECTIVE_VETO');
  seen.add(v.masterId);accepted.push(v);
 }
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const masterReportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerKeys)||f.schema!=='rosevear.ql447.dual-owner-corrective-handoff.v1'||
  f.incidentId!==id||f.followUpId!==followUpId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql446EscalationReceiptDigest!==prior||
  f.isolationEvidenceDigest!==evidenceDigest||
  f.masterReportsDigest!==masterReportsDigest||
  f.classification!==classification||f.correctiveDecision!==correctiveDecision||
  f.incidentStatus!=='OPEN_HOLD'||!fresh(f.reviewedAt,opts.nowMs)||
  millis(f.reviewedAt)<Math.max(...accepted.map(v=>millis(v.reviewedAt)))||
  !signatureValid(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !signatureValid(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return held('QL447_DUAL_OWNER_CORRECTIVE_FOLLOWUP_VETO');
 try{
  if(!validPrior(s,ql446Ledger)||
   incidentLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   incidentLedger.read('reconfirmed',id)||incidentLedger.read('exception',id)||
   !fresh(w.observedAt,opts.nowMs)||!fresh(f.reviewedAt,opts.nowMs))
   return held('QL447_PRIOR_CUSTODY_DRIFT_OR_EVIDENCE_EXPIRED');
  const kind=confirmed?'reconfirmed':'exception';
  const record=incidentLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,evidenceDigest,masterReportsDigest,
   ownerDigest:hash(f),classification,correctiveDecision,incidentStatus:'OPEN_HOLD'}));
  if(incidentLedger.read(kind,id)?.recordDigest!==record.recordDigest)
   throw Error('readback');
  return {...held(confirmed?'SIGNED_HISTORICAL_ISOLATION_ONLY_CASE_REMAINS_OPEN':
   'SIGNED_ISOLATION_EXCEPTION_CORRECTIVE_ESCALATION_CASE_OPEN'),
   state:confirmed?'DURABLE_QL447_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY':
    'DURABLE_QL447_ISOLATION_EXCEPTION_CORRECTIVE_FOLLOWUP_OPEN',
   originalIncidentId:id,followUpId,classification,correctiveDecision,
   masterCount:3,masterReportsDigest,isolationEvidenceDigest:evidenceDigest,
   pendingReceiptDigest:pending.recordDigest,followUpReceiptDigest:record.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_CORRECTIVE_FOLLOWUP_KEEP_OPEN',
   permittedNextAction:confirmed?'FRESH_INDEPENDENT_OFF_WATCH_MANUAL_ISOLATION_ONLY':
    'SUPERVISED_ISOLATION_EXCEPTION_REMEDIATION_REQUIRED'};
 }catch{return held('QL447_DURABLE_CORRECTIVE_FOLLOWUP_COMMIT_FAILED');}
}
