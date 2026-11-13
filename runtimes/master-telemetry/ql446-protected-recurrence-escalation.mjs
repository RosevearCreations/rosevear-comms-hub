import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-446 only records signed *evidence*. It has no ON/OFF actuator and
 * does not elevate a historical OFF sample into current physical state. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HORIZONS=[{id:'SHORT',minMs:0},{id:'MEDIUM',minMs:4000},{id:'LONG',minMs:10000}];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/,HEX=/^[a-f0-9]{64}$/;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const recent=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(at(x))&&
 at(x)<=now&&now-at(x)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,physicalReceiverCurrentlyOff:false,
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,
 ownerAcceptance:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function verifySig(payload,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const signed=(e,keys,pin)=>exact(e,['payload','signature'])&&exact(e.payload,keys)&&
 verifySig(e.payload,e.signature,pin);

export function openQl446ProtectedEscalationLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL446_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL446_UNSAFE_LEDGER_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','watch','escalation'].includes(kind)||!ID.test(id??''))
   throw Error('QL446_INVALID_CUSTODY_KEY');
  return join(root,'ql446-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;try{raw=readFileSync(file(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL446_RECORD_TOO_LARGE');
  let r;try{r=JSON.parse(raw);}catch{throw Error('QL446_CORRUPT_CUSTODY');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!=='rosevear.ql446.protected-recurrence-escalation.v1'||
   r.kind!==kind||r.incidentId!==id||!HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:r.schema,kind,incidentId:id,
    evidenceDigest:r.evidenceDigest}))throw Error('QL446_TAMPERED_CUSTODY');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))
   throw Error('QL446_ALREADY_CLAIMED');
  const r={schema:'rosevear.ql446.protected-recurrence-escalation.v1',
   kind,incidentId:id,evidenceDigest};r.recordDigest=hash(r);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const dir=openSync(root,'r');try{fsyncSync(dir);}finally{closeSync(dir);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('QL446_DURABLE_READBACK_FAILED');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validPrior(summary,ledger){
 const r=summary;
 if(!r||!['DURABLE_QL445_POSTCLOSURE_OFF_STABILITY_EVIDENCE_ADMITTED',
 'DURABLE_QL445_SIGNED_ON_RECURRENCE_INCIDENT_OPEN'].includes(r.state)||
  r.connection!=='HOLD'||r.activationAuthorized!==false||
  r.physicalReceiverCurrentlyOff!==false||r.masterCount!==3||
  r.recurrenceDetected!==
    (r.state==='DURABLE_QL445_SIGNED_ON_RECURRENCE_INCIDENT_OPEN')||
  !ID.test(r.originalIncidentId??'')||!ID.test(r.watchId??'')||
  !ID.test(r.watchNonce??'')||
  ![r.pendingReceiptDigest,r.postClosureWatchDigest,r.masterReportsDigest]
    .every(x=>HEX.test(x??''))||
  !HEX.test((r.recurrenceDetected?r.recurrenceReceiptDigest:r.stabilityReceiptDigest)??'')||
  typeof ledger?.read!=='function')return false;
 try{
  const id=r.originalIncidentId,kind=r.recurrenceDetected?'recurrence':'stable';
  return ledger.read('pending',id)?.recordDigest===r.pendingReceiptDigest&&
   ledger.read(kind,id)?.recordDigest===(r.recurrenceDetected?
    r.recurrenceReceiptDigest:r.stabilityReceiptDigest)&&
   !ledger.read(r.recurrenceDetected?'stable':'recurrence',id);
 }catch{return false;}
}
const sourceFields=['schema','incidentId','ql445SummaryDigest','ql445ReceiptDigest',
 'priorWatchDigest','priorClassification','observedAt'];
const hostFields=['schema','incidentId','challengeNonce','horizon','sampleIndex',
 'originalHostId','ql445SummaryDigest','previousDigest','receiverState',
 'watchdogArmed','hostSequence','observedAt'];
const receiverFields=['schema','incidentId','challengeNonce','horizon','sampleIndex',
 'ql445SummaryDigest','signedHostDigest','previousDigest','receiverState',
 'observerSequence','observedAt'];
const escalationFields=['schema','incidentId','reopeningCaseId','ql445ReceiptDigest',
 'multiHorizonWatchDigest','sourceEvidenceDigest','severity','decision','observedAt'];
const masterFields=['schema','incidentId','masterId','ql445ReceiptDigest',
 'multiHorizonWatchDigest','escalationDigest','classification','decision','reviewedAt'];
const ownersFields=['schema','incidentId','sourceOwnerId','masterOwnerId',
 'ql445ReceiptDigest','multiHorizonWatchDigest','escalationDigest',
 'masterReportsDigest','classification','decision','reviewedAt'];

export function readQl446Escalation(ledger,id){
 try{
  const p=ledger.read('pending',id),watch=ledger.read('watch',id),
   escalated=ledger.read('escalation',id);
  if((watch||escalated)&&(!p||(watch&&escalated)))
   return hold('QL446_CONFLICTING_PROTECTED_RECEIPTS');
  if(escalated)return {...hold('QL446_SIGNED_RECURRENCE_REOPENING_CASE_REMAINS_OPEN'),
   state:'QL446_DURABLE_REOPENING_ESCALATION_CASE_OPEN',
   pendingReceiptDigest:p.recordDigest,escalationReceiptDigest:escalated.recordDigest};
  if(watch)return {...hold('QL446_SIGNED_HISTORICAL_OFF_MONITORING_ONLY'),
   state:'QL446_DURABLE_MULTI_HORIZON_OFF_EVIDENCE_ONLY',
   pendingReceiptDigest:p.recordDigest,watchReceiptDigest:watch.recordDigest};
  if(p)return {...hold('QL446_PENDING_REQUIRES_MANUAL_RECOVERY'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL446_NO_PROTECTED_ESCALATION_RECORD');
 }catch{return hold('QL446_PRIVATE_CUSTODY_UNREADABLE');}
}

/** Multi-horizon OFF witness intake and protected recurrence reopening.
 * Existing QL445 recurrence always remains escalated despite fresh OFF
 * samples. A new ON or unsigned state mismatch can never be marked stable. */
export async function runQl446ProtectedReopening({
 ql445Summary,ql445Ledger,escalationLedger,challengeNonce,
 originalCommsSourceProvider,originalHostProvider,independentObserverProvider,
 signedEscalationProvider,threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof escalationLedger?.read!=='function'||
  typeof escalationLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl445Source!=='function'||
  typeof originalHostProvider?.readSignedHorizonSamples!=='function'||
  typeof independentObserverProvider?.readSignedHorizonObservations!=='function'||
  typeof signedEscalationProvider?.readSignedReopeningEscalation!=='function'||
  typeof threeMasterProvider?.readSignedHorizonDecisions!=='function')
  return hold('QL446_EXTERNAL_READONLY_SIGNED_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl445CustodyVerified||!opts.separateOwnerRolesVerified||
  !Number.isSafeInteger(opts.nowMs)||!ID.test(challengeNonce??'')||
  challengeNonce===ql445Summary?.watchNonce||
  !validPrior(ql445Summary,ql445Ledger))
  return hold('QL446_EXACT_QL445_AND_PROTECTED_HORIZON_CHALLENGE_REQUIRED');
 const s=ql445Summary,id=s.originalIncidentId,priorReceipt=s.recurrenceDetected?
  s.recurrenceReceiptDigest:s.stabilityReceiptDigest;
 const pins=[opts.commsSourcePin,opts.originalHostPin,opts.independentReceiverPin,
  opts.escalationOfficerPin,opts.sourceOwnerPin,opts.masterOwnerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==pins.length||
  !opts.independentSignerPinsVerified)
  return hold('QL446_INDEPENDENT_DISTINCT_SIGNERS_REQUIRED');
 try{
  if(escalationLedger.read('pending',id)||escalationLedger.read('watch',id)||
   escalationLedger.read('escalation',id))
   return hold('QL446_ONE_USE_REOPENING_ALREADY_ATTEMPTED');
 }catch{return hold('QL446_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=escalationLedger.claimOnce('pending',id,hash({
   originalIncidentId:id,ql445Digest:hash(s),priorReceipt,challengeNonce}));
  if(escalationLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('pending');
 }catch{return hold('QL446_PENDING_PRIVATE_COMMIT_FAILED');}
 let source;
 try{source=await originalCommsSourceProvider.readSignedQl445Source({
  incidentId:id,priorReceipt,challengeNonce,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL446_SIGNED_QL445_ORIGINAL_SOURCE_UNAVAILABLE');}
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  source.payload.schema!=='rosevear.ql446.original-ql445-source-custody.v1'||
  source.payload.incidentId!==id||
  source.payload.ql445SummaryDigest!==hash(s)||
  source.payload.ql445ReceiptDigest!==priorReceipt||
  source.payload.priorWatchDigest!==s.postClosureWatchDigest||
  source.payload.priorClassification!==(s.recurrenceDetected?
   'SIGNED_ON_RECURRENCE_REOPEN':'RECONCILED_HISTORICAL_OFF_STABILITY_ONLY')||
  !recent(source.payload.observedAt,opts.nowMs))
  return hold('QL446_SIGNED_QL445_SOURCE_CUSTODY_MISMATCH');
 let hosts,witnesses;
 try{hosts=await originalHostProvider.readSignedHorizonSamples({
  incidentId:id,challengeNonce,priorReceipt,sourceDigest:hash(source.payload)});}
 catch{return hold('QL446_ORIGINAL_HOST_MULTI_HORIZON_UNAVAILABLE');}
 try{witnesses=await independentObserverProvider.readSignedHorizonObservations({
  incidentId:id,challengeNonce,priorReceipt,sourceDigest:hash(source.payload)});}
 catch{return hold('QL446_INDEPENDENT_MULTI_HORIZON_UNAVAILABLE');}
 if(!Array.isArray(hosts)||hosts.length!==3||!Array.isArray(witnesses)||
  witnesses.length!==3)
  return hold('QL446_THREE_HORIZONS_WITH_DISTINCT_ATTESTATIONS_REQUIRED');
 let prevDigest=s.postClosureWatchDigest,prevSequence=0,prevTime=at(source.payload.observedAt);
 let firstTime=null,recurrence=s.recurrenceDetected,divergence=false;
 for(let i=0;i<HORIZONS.length;i++){
  const horizon=HORIZONS[i],h=hosts[i],w=witnesses[i],p=h?.payload,r=w?.payload;
  if(!signed(h,hostFields,opts.originalHostPin)||
   p.schema!=='rosevear.ql446.original-host-horizon-probe.v1'||
   p.incidentId!==id||p.challengeNonce!==challengeNonce||
   p.horizon!==horizon.id||p.sampleIndex!==i+1||
   p.originalHostId!=='DESKTOP-AE894KC'||
   p.ql445SummaryDigest!==hash(s)||p.previousDigest!==prevDigest||
   p.watchdogArmed!==true||!['OFF','ON'].includes(p.receiverState)||
   !Number.isSafeInteger(p.hostSequence)||p.hostSequence<=prevSequence||
   !recent(p.observedAt,opts.nowMs)||at(p.observedAt)<prevTime||
   (i>0&&at(p.observedAt)-firstTime<horizon.minMs))
   return hold('QL446_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
  if(i===0)firstTime=at(p.observedAt);
  if(!signed(w,receiverFields,opts.independentReceiverPin)||
   r.schema!=='rosevear.ql446.independent-receiver-horizon-proof.v1'||
   r.incidentId!==id||r.challengeNonce!==challengeNonce||
   r.horizon!==horizon.id||r.sampleIndex!==i+1||
   r.ql445SummaryDigest!==hash(s)||r.signedHostDigest!==hash(p)||
   r.previousDigest!==prevDigest||!['OFF','ON'].includes(r.receiverState)||
   !Number.isSafeInteger(r.observerSequence)||
   r.observerSequence<=p.hostSequence||
   !recent(r.observedAt,opts.nowMs)||at(r.observedAt)<at(p.observedAt))
   return hold('QL446_INDEPENDENT_SIGNED_HORIZON_INVALID');
  if(p.receiverState!==r.receiverState)divergence=true;
  if(p.receiverState==='ON'||r.receiverState==='ON')recurrence=true;
  prevSequence=r.observerSequence;prevTime=at(r.observedAt);
  prevDigest=hash(r);
 }
 const classification=divergence?'SIGNED_STATE_DIVERGENCE_SAFETY_ESCALATION':
  recurrence?'SIGNED_RECURRENCE_ESCALATE_REOPEN':
  'RECONCILED_MULTI_HORIZON_OFF_HISTORICAL_ONLY';
 const escalated=classification!=='RECONCILED_MULTI_HORIZON_OFF_HISTORICAL_ONLY';
 const masterDecision=escalated?'REOPEN_INCIDENT_KEEP_HOLD_REQUIRE_INDEPENDENT_ISOLATION':
  'ACCEPT_MULTI_HORIZON_OFF_EVIDENCE_KEEP_HOLD';
 const watchDigest=hash({ql445SummaryDigest:hash(s),challengeNonce,
  hostDigests:hosts.map(x=>hash(x.payload)),
  observerDigests:witnesses.map(x=>hash(x.payload)),classification});
 let escalation=null,escalationDigest=null;
 if(escalated){
  try{escalation=await signedEscalationProvider.readSignedReopeningEscalation({
   incidentId:id,challengeNonce,watchDigest,classification});}
  catch{return hold('QL446_EXTERNAL_SIGNED_RECURRENCE_ESCALATION_UNAVAILABLE');}
  const e=escalation?.payload;
  if(!signed(escalation,escalationFields,opts.escalationOfficerPin)||
   e.schema!=='rosevear.ql446.independent-officer-recurrence-escalation.v1'||
   e.incidentId!==id||!ID.test(e.reopeningCaseId??'')||
   e.ql445ReceiptDigest!==priorReceipt||
   e.multiHorizonWatchDigest!==watchDigest||
   e.sourceEvidenceDigest!==hash(source.payload)||
   e.severity!=='RECEIVER_SAFETY_CRITICAL_RECHECK'||
   e.decision!=='OPEN_PROTECTED_INCIDENT_KEEP_OFF_ISOLATION'||
   !recent(e.observedAt,opts.nowMs)||
   at(e.observedAt)<prevTime)
   return hold('QL446_INDEPENDENT_RECURRENCE_ESCALATION_INVALID');
  escalationDigest=hash(e);
 }
 let masters;
 try{masters=await threeMasterProvider.readSignedHorizonDecisions({
  incidentId:id,classification,watchDigest,escalationDigest});}
 catch{return hold('QL446_THREE_MASTER_HORIZON_REVIEW_UNAVAILABLE');}
 if(!Array.isArray(masters)||masters.length!==3)
  return hold('QL446_THREE_MASTER_RESPONSES_REQUIRED');
 const accepted=[],seen=new Set();
 for(const envelope of masters){
  const m=envelope?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(envelope,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql446.three-master-reopening-decision.v1'||
   m.incidentId!==id||m.ql445ReceiptDigest!==priorReceipt||
   m.multiHorizonWatchDigest!==watchDigest||
   m.escalationDigest!==escalationDigest||
   m.classification!==classification||m.decision!==masterDecision||
   !recent(m.reviewedAt,opts.nowMs)||
   at(m.reviewedAt)<(escalated?at(escalation.payload.observedAt):prevTime))
   return hold('QL446_THREE_MASTER_SIGNED_REOPENING_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const reportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownersFields)||
  f.schema!=='rosevear.ql446.dual-owner-reopening-gate.v1'||
  f.incidentId!==id||!PERSON.test(f.sourceOwnerId??'')||
  !PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||
  f.ql445ReceiptDigest!==priorReceipt||
  f.multiHorizonWatchDigest!==watchDigest||
  f.escalationDigest!==escalationDigest||f.masterReportsDigest!==reportsDigest||
  f.classification!==classification||f.decision!==masterDecision||
  !recent(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(x=>at(x.reviewedAt)))||
  !verifySig(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySig(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL446_INDEPENDENT_DUAL_OWNER_REOPENING_DECISION_REJECTED');
 try{
  if(!validPrior(s,ql445Ledger)||
   escalationLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   escalationLedger.read('watch',id)||escalationLedger.read('escalation',id)||
   !recent(witnesses[2].payload.observedAt,opts.nowMs)||
   !recent(f.reviewedAt,opts.nowMs))
   return hold('QL446_PROTECTED_CUSTODY_DRIFT_OR_EXPIRED_EVIDENCE');
  const kind=escalated?'escalation':'watch';
  const r=escalationLedger.claimOnce(kind,id,hash({
   ql445ReceiptDigest:priorReceipt,pendingDigest:pending.recordDigest,
   sourceDigest:hash(source.payload),watchDigest,escalationDigest,
   reportsDigest,finalOwnerDigest:hash(f),classification}));
  if(escalationLedger.read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('readback');
  return {...hold(escalated?'SIGNED_RECURRENCE_CASE_REOPENED_NO_RECEIVER_ACTIVATION':
   'HISTORICAL_MULTI_HORIZON_OFF_EVIDENCE_ONLY'),
   state:escalated?'DURABLE_QL446_RECURRENCE_REOPENING_CASE_OPEN':
    'DURABLE_QL446_MULTI_HORIZON_OFF_EVIDENCE_ACCEPTED',
   ownerAcceptance:escalated?'DUAL_SIGNED_PROTECTED_REOPENING_ONLY':
    'DUAL_SIGNED_HISTORICAL_OFF_MONITORING_ONLY',
   originalIncidentId:id,challengeNonce,classification,recurrenceDetected:escalated,
   watchDigest,masterReportsDigest:reportsDigest,masterCount:3,
   pendingReceiptDigest:pending.recordDigest,
   ...{[escalated?'escalationReceiptDigest':'watchReceiptDigest']:r.recordDigest},
   permittedNextAction:escalated?
    'MANUAL_ISOLATION_SUPERVISED_REOPENING_NO_AUTOMATIC_ON':
    'CONTINUE_INDEPENDENT_OFF_MONITORING_WITH_HOLD'};
 }catch{return hold('QL446_DURABLE_REOPENING_COMMIT_FAILED');}
}
