import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/, HEX=/^[a-f0-9]{64}$/, PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(at(x))&&
 at(x)<=now&&now-at(x)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',activationAuthorized:false,
 physicalReceiverCurrentlyOff:false,receiver:'UNKNOWN_FRESH_EXTERNAL_OFF_REQUIRED',
 manualIsolationAndIndependentOffRequired:true,ownerAcceptance:'HOLD',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function signature(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(p)),
   key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const signed=(e,fields,pin)=>exact(e,['payload','signature'])&&exact(e.payload,fields)&&
 signature(e.payload,e.signature,pin);

/** No overwrites: 0700 private directory, 0600 exclusive files, fsynced commit
 * and record-hash readback. This holds receipts, not current hardware state. */
export function openQl444ProtectedClosureLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL444_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL444_UNSAFE_PRIVATE_LEDGER');
 const path=(kind,id)=>{
  if(!['pending','remediation','closed'].includes(kind)||!ID.test(id??''))
   throw Error('QL444_INVALID_LEDGER_KEY');
  return join(root,'ql444-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;
  try{raw=readFileSync(path(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL444_RECORD_OVERSIZE');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL444_CORRUPT_RECORD');}
  if(!exact(rec,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql444.protected-off-continuity-closure-custody.v1'||
   rec.kind!==kind||rec.incidentId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,kind,incidentId:id,
    evidenceDigest:rec.evidenceDigest}))throw Error('QL444_TAMPERED_RECORD');
  return rec;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL444_DUPLICATE_CLAIM');
  const rec={schema:'rosevear.ql444.protected-off-continuity-closure-custody.v1',
   kind,incidentId:id,evidenceDigest};rec.recordDigest=hash(rec);
  const fd=openSync(path(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dir=openSync(root,'r');try{fsyncSync(dir);}finally{closeSync(dir);}
  if(read(kind,id)?.recordDigest!==rec.recordDigest)
   throw Error('QL444_PRIVATE_READBACK_MISMATCH');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
function verifiedQl443(s,ledger){
 if(!s||!['DURABLE_QL443_SIGNED_SHUTDOWN_EVIDENCE_ADMITTED',
  'DURABLE_QL443_EXPIRED_LEASE_EXCEPTION_HANDOFF_OPEN'].includes(s.state)||
  s.connection!=='HOLD'||s.activationAuthorized!==false||
  s.masterCount!==3||s.physicalReceiverCurrentlyOff!==false||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.renewalNonce??'')||
  ![s.ql442DecisionDigest,s.freshIndependentOffDigest,s.masterReportsDigest,
   s.pendingReceiptDigest].every(x=>HEX.test(x??''))||
  s.leaseExpired!==(s.state==='DURABLE_QL443_EXPIRED_LEASE_EXCEPTION_HANDOFF_OPEN')||
  typeof ledger?.read!=='function')return false;
 const kind=s.leaseExpired?'exception':'admitted';
 const receipt=s.leaseExpired?s.exceptionReceiptDigest:s.admissionReceiptDigest;
 if(!HEX.test(receipt??''))return false;
 try{return ledger.read('pending',s.originalIncidentId)?.recordDigest===s.pendingReceiptDigest&&
  ledger.read(kind,s.originalIncidentId)?.recordDigest===receipt&&
  !ledger.read(s.leaseExpired?'admitted':'exception',s.originalIncidentId);}
 catch{return false;}
}
const priorFields=['schema','incidentId','challengeId','leaseId','renewalNonce',
 'ql442DecisionDigest','hostShutdownDigest','historicalOffDigest',
 'receiverState','offSequence','observedAt'];
const sourceFields=['schema','incidentId','ql443SummaryDigest','ql443ReceiptDigest',
 'disposition','observedAt'];
const hostFields=['schema','incidentId','hostMachineId','ql443SummaryDigest',
 'priorOffDigest','receiverState','watchdogArmed','hostSequence','observedAt'];
const watchFields=['schema','incidentId','watchId','continuityNonce','ql443SummaryDigest',
 'hostContinuityDigest','priorOffDigest','receiverState','offSequence','observedAt'];
const fixFields=['schema','incidentId','remediationId','ql443ExceptionReceiptDigest',
 'watchTwoDigest','causeEvidenceDigest','correctiveEvidenceDigest',
 'outcome','verifiedAt','ownerId','reviewerId'];
const masterFields=['schema','incidentId','masterId','ql443SummaryDigest',
 'watchTwoDigest','remediationDigest','decision','reviewedAt'];
const ownerFields=['schema','incidentId','ownerId','reviewerId','ql443SummaryDigest',
 'watchTwoDigest','remediationDigest','masterReportsDigest','decision','reviewedAt'];

export function readQl444ClosureContinuity(ledger,id){
 try{
  const p=ledger.read('pending',id),m=ledger.read('remediation',id),c=ledger.read('closed',id);
  if((m||c)&&!p)return hold('QL444_PRIVATE_CUSTODY_INCONSISTENT');
  if(c)return {...hold('HISTORICAL_CLOSED_EVIDENCE_NOT_CURRENT_RECEIVER_OFF'),
   state:'QL444_PRIVATE_INCIDENT_EVIDENCE_CLOSED_NOT_LIVE_STATE',
   pendingReceiptDigest:p.recordDigest,
   remediationReceiptDigest:m?.recordDigest??null,closureReceiptDigest:c.recordDigest};
  if(m)return {...hold('QL444_REMEDIATION_PENDING_CLOSURE'),
   state:'QL444_DURABLE_EXCEPTION_REMEDIATION_PENDING_CLOSURE',
   pendingReceiptDigest:p.recordDigest,remediationReceiptDigest:m.recordDigest};
  if(p)return {...hold('QL444_UNRESOLVED_ONE_USE_PENDING'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL444_NO_INCIDENT_CLOSURE_RECORD');
 }catch{return hold('QL444_PRIVATE_LEDGER_UNREADABLE');}
}

/** Read-only witness intake, one-use closure custody; never actuates ON/OFF,
 * grants CONNECTED, or claims a historical OFF implies current physical OFF. */
export async function runQl444OffContinuityClosure({
 ql443Summary,ql443Ledger,closureLedger,continuityNonce,watchId,
 ql443SourceProvider,priorRenewalProvider,originalHostContinuityProvider,
 independentOffWatchProvider,exceptionRemediation,threeMasterProvider,
 finalOwnerDecision
},o={}){
 if(typeof closureLedger?.read!=='function'||typeof closureLedger?.claimOnce!=='function'||
  typeof ql443SourceProvider?.readSignedQl443Source!=='function'||
  typeof priorRenewalProvider?.readSignedQl443Renewal!=='function'||
  typeof originalHostContinuityProvider?.readSignedOffContinuity!=='function'||
  typeof independentOffWatchProvider?.readSignedOffSamples!=='function'||
  typeof threeMasterProvider?.readSignedClosureDecisions!=='function')
  return hold('QL444_EXTERNAL_PROTECTED_READONLY_ADAPTERS_REQUIRED');
 if(!o.protectedOriginalHostSession||!o.trustedClockVerified||
  !o.independentQl443SourceVerified||!o.separateRuntimeKeyCustodyVerified||
  !Number.isSafeInteger(o.nowMs)||!ID.test(continuityNonce??'')||
  continuityNonce===ql443Summary?.renewalNonce||!ID.test(watchId??'')||
  !verifiedQl443(ql443Summary,ql443Ledger))
  return hold('QL444_EXACT_QL443_PROTECTED_CUSTODY_REQUIRED');
 const s=ql443Summary,id=s.originalIncidentId,late=s.leaseExpired;
 const pins=[o.ql443SourcePin,o.ql443ReceiverPin,o.originalHostPin,o.watchReceiverPin,
  o.ownerPin,o.reviewerPin,...MASTERS.map(m=>o.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string'||!x)||new Set(pins).size!==pins.length||
  !o.independentRemediationCustodyVerified&&late)
  return hold('QL444_DISTINCT_PINNED_SIGNERS_AND_REMEDIATION_REVIEW_REQUIRED');
 try{
  if(closureLedger.read('pending',id)||closureLedger.read('remediation',id)||
   closureLedger.read('closed',id))return hold('QL444_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
 }catch{return hold('QL444_LEDGER_UNREADABLE');}
 let pending;
 try{
  pending=closureLedger.claimOnce('pending',id,hash({ql443Digest:hash(s),
   previousReceiptDigest:late?s.exceptionReceiptDigest:s.admissionReceiptDigest,
   continuityNonce,watchId}));
  if(closureLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('pending readback');
 }catch{return hold('QL444_PENDING_PRIVATE_CUSTODY_FAILED');}
 let src;
 try{src=await ql443SourceProvider.readSignedQl443Source({incidentId:id,
  ql443SummaryDigest:hash(s),pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL444_ORIGINAL_QL443_SOURCE_UNAVAILABLE');}
 if(!signed(src,sourceFields,o.ql443SourcePin)||
  src.payload.schema!=='rosevear.ql444.ql443-source-custody-readback.v1'||
  src.payload.incidentId!==id||src.payload.ql443SummaryDigest!==hash(s)||
  src.payload.ql443ReceiptDigest!==(late?s.exceptionReceiptDigest:s.admissionReceiptDigest)||
  src.payload.disposition!==(late?'EXPIRED_EXCEPTION':'ADMITTED')||
  !fresh(src.payload.observedAt,o.nowMs))
  return hold('QL444_ORIGINAL_QL443_SOURCE_SIGNATURE_INVALID');
 let previous;
 try{previous=await priorRenewalProvider.readSignedQl443Renewal({incidentId:id,
  previousOffDigest:s.freshIndependentOffDigest});}
 catch{return hold('QL444_PREVIOUS_SIGNED_RECEIVER_OFF_UNAVAILABLE');}
 if(!signed(previous,priorFields,o.ql443ReceiverPin)||
  previous.payload.schema!=='rosevear.ql443.independent-fresh-off-renewal.v1'||
  previous.payload.incidentId!==id||previous.payload.renewalNonce!==s.renewalNonce||
  previous.payload.ql442DecisionDigest!==s.ql442DecisionDigest||
  previous.payload.receiverState!=='OFF'||
  !ID.test(previous.payload.challengeId??'')||!ID.test(previous.payload.leaseId??'')||
  !HEX.test(previous.payload.hostShutdownDigest??'')||
  !HEX.test(previous.payload.historicalOffDigest??'')||
  !Number.isSafeInteger(previous.payload.offSequence)||
  previous.payload.offSequence<1||!Number.isFinite(at(previous.payload.observedAt))||
  at(previous.payload.observedAt)>o.nowMs||
  hash(previous.payload)!==s.freshIndependentOffDigest)
  return hold('QL444_SIGNED_QL443_PRIOR_OFF_CUSTODY_INVALID');
 let host;
 try{host=await originalHostContinuityProvider.readSignedOffContinuity({
  incidentId:id,priorOffDigest:hash(previous.payload)});}
 catch{return hold('QL444_ORIGINAL_HOST_OFF_CONTINUITY_UNAVAILABLE');}
 if(!signed(host,hostFields,o.originalHostPin)||
  host.payload.schema!=='rosevear.ql444.original-host-off-continuity.v1'||
  host.payload.incidentId!==id||host.payload.hostMachineId!=='DESKTOP-AE894KC'||
  host.payload.ql443SummaryDigest!==hash(s)||
  host.payload.priorOffDigest!==hash(previous.payload)||
  host.payload.receiverState!=='OFF'||host.payload.watchdogArmed!==true||
  !Number.isSafeInteger(host.payload.hostSequence)||
  host.payload.hostSequence<=previous.payload.offSequence||
  !fresh(host.payload.observedAt,o.nowMs)||
  at(host.payload.observedAt)<at(previous.payload.observedAt))
  return hold('QL444_HOST_SIGNED_OFF_WATCHDOG_OR_SEQUENCE_INVALID');
 let watches;
 try{watches=await independentOffWatchProvider.readSignedOffSamples({
  incidentId:id,watchId,continuityNonce,hostContinuityDigest:hash(host.payload)});}
 catch{return hold('QL444_INDEPENDENT_OFF_CONTINUITY_WATCH_UNAVAILABLE');}
 if(!Array.isArray(watches)||watches.length!==2)
  return hold('QL444_TWO_INDEPENDENT_OFF_SAMPLES_REQUIRED');
 const [w1,w2]=watches;
 for(const [index,w] of watches.entries()){
  if(!signed(w,watchFields,o.watchReceiverPin)||
   w.payload.schema!=='rosevear.ql444.independent-signed-off-continuity-watch.v1'||
   w.payload.incidentId!==id||w.payload.watchId!==watchId||
   w.payload.continuityNonce!==continuityNonce||
   w.payload.ql443SummaryDigest!==hash(s)||
   w.payload.hostContinuityDigest!==hash(host.payload)||
   w.payload.priorOffDigest!==(index===0?hash(previous.payload):hash(w1.payload))||
   w.payload.receiverState!=='OFF'||
   !Number.isSafeInteger(w.payload.offSequence)||
   w.payload.offSequence<=(index===0?host.payload.hostSequence:w1.payload.offSequence)||
   !fresh(w.payload.observedAt,o.nowMs)||
   at(w.payload.observedAt)<(index===0?at(host.payload.observedAt):at(w1.payload.observedAt)+1000))
   return hold('QL444_INDEPENDENT_OFF_MONOTONIC_TWO_SAMPLE_WATCH_INVALID');
 }
 let remediationDigest=null,remediationRecord=null;
 if(late){
  const e=exceptionRemediation?.payload;
  if(!exact(exceptionRemediation,['payload','ownerSignature','reviewerSignature'])||
   !exact(e,fixFields)||
   e.schema!=='rosevear.ql444.signed-lease-exception-remediation.v1'||
   e.incidentId!==id||!ID.test(e.remediationId??'')||
   e.ql443ExceptionReceiptDigest!==s.exceptionReceiptDigest||
   e.watchTwoDigest!==hash(w2.payload)||
   !HEX.test(e.causeEvidenceDigest??'')||
   !HEX.test(e.correctiveEvidenceDigest??'')||
   e.outcome!=='INDEPENDENTLY_REMEDIATED_KEEP_HOLD'||
   !PERSON.test(e.ownerId??'')||!PERSON.test(e.reviewerId??'')||
   e.ownerId===e.reviewerId||!fresh(e.verifiedAt,o.nowMs)||
   at(e.verifiedAt)<at(w2.payload.observedAt)||
   !signature(e,exceptionRemediation.ownerSignature,o.ownerPin)||
   !signature(e,exceptionRemediation.reviewerSignature,o.reviewerPin))
   return hold('QL444_SIGNED_INDEPENDENT_EXCEPTION_REMEDIATION_INVALID');
  remediationDigest=hash(e);
  try{
   if(!verifiedQl443(s,ql443Ledger)||
    closureLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
    return hold('QL444_REMEDIATION_CUSTODY_SOURCE_DRIFT');
   remediationRecord=closureLedger.claimOnce('remediation',id,hash({
    pendingReceiptDigest:pending.recordDigest,ql443ExceptionReceiptDigest:s.exceptionReceiptDigest,
    watchTwoDigest:hash(w2.payload),remediationDigest}));
   if(closureLedger.read('remediation',id)?.recordDigest!==remediationRecord.recordDigest)
    throw Error('remediation readback');
  }catch{return hold('QL444_PRIVATE_REMEDIATION_COMMIT_FAILED');}
 }
 let reports;
 try{reports=await threeMasterProvider.readSignedClosureDecisions({incidentId:id,
  watchTwoDigest:hash(w2.payload),remediationDigest});}
 catch{return hold('QL444_THREE_MASTER_CLOSURE_UNAVAILABLE');}
 if(!Array.isArray(reports)||reports.length!==3)
  return hold('QL444_THREE_DISTINCT_MASTER_CLOSURES_REQUIRED');
 const accepted=[],seen=new Set();
 for(const r of reports){
  const m=r?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(r,masterFields,o.masterPins[m.masterId])||
   m.schema!=='rosevear.ql444.three-master-incident-closure-review.v1'||
   m.incidentId!==id||m.ql443SummaryDigest!==hash(s)||
   m.watchTwoDigest!==hash(w2.payload)||
   m.remediationDigest!==(late?remediationDigest:null)||
   m.decision!==(late?'APPROVE_REMEDIATED_EXCEPTION_EVIDENCE_CLOSURE_NO_CONNECT':
    'APPROVE_OFF_EVIDENCE_CLOSURE_NO_CONNECT')||
   !fresh(m.reviewedAt,o.nowMs)||
   at(m.reviewedAt)<at(late?exceptionRemediation.payload.verifiedAt:w2.payload.observedAt))
   return hold('QL444_THREE_MASTER_SIGNED_CLOSEOUT_REJECTED');
  seen.add(m.masterId);accepted.push(m);
 }
 if(MASTERS.some(m=>!seen.has(m)))return hold('QL444_MASTER_IDENTITY_COVERAGE_INVALID');
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const masterReportsDigest=hash(accepted);
 const oFinal=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','ownerSignature','reviewerSignature'])||
  !exact(oFinal,ownerFields)||
  oFinal.schema!=='rosevear.ql444.dual-owner-incident-evidence-closure.v1'||
  oFinal.incidentId!==id||!PERSON.test(oFinal.ownerId??'')||
  !PERSON.test(oFinal.reviewerId??'')||oFinal.ownerId===oFinal.reviewerId||
  oFinal.ql443SummaryDigest!==hash(s)||
  oFinal.watchTwoDigest!==hash(w2.payload)||
  oFinal.remediationDigest!==(late?remediationDigest:null)||
  oFinal.masterReportsDigest!==masterReportsDigest||
  oFinal.decision!==(late?'CLOSE_REMEDIATED_EXCEPTION_EVIDENCE_ONLY':
   'CLOSE_WITNESSED_OFF_INCIDENT_EVIDENCE_ONLY')||
  !fresh(oFinal.reviewedAt,o.nowMs)||
  at(oFinal.reviewedAt)<Math.max(...accepted.map(x=>at(x.reviewedAt)))||
  !signature(oFinal,finalOwnerDecision.ownerSignature,o.ownerPin)||
  !signature(oFinal,finalOwnerDecision.reviewerSignature,o.reviewerPin))
  return hold('QL444_DUAL_OWNER_SIGNED_CLOSEOUT_INVALID');
 try{
  if(!verifiedQl443(s,ql443Ledger)||
   closureLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   (late&&closureLedger.read('remediation',id)?.recordDigest!==remediationRecord.recordDigest)||
   (!late&&closureLedger.read('remediation',id))||closureLedger.read('closed',id)||
   !fresh(w2.payload.observedAt,o.nowMs)||!fresh(oFinal.reviewedAt,o.nowMs))
   return hold('QL444_PRIVATE_CUSTODY_OR_SIGNED_OFF_FRESHNESS_DRIFT');
  const record=closureLedger.claimOnce('closed',id,hash({
   pendingReceiptDigest:pending.recordDigest,
   remediationReceiptDigest:remediationRecord?.recordDigest??null,
   ql443SummaryDigest:hash(s),sourceDigest:hash(src.payload),
   priorOffDigest:hash(previous.payload),hostDigest:hash(host.payload),
   watchOneDigest:hash(w1.payload),watchTwoDigest:hash(w2.payload),
   remediationDigest,masterReportsDigest,ownerDigest:hash(oFinal)}));
  if(closureLedger.read('closed',id)?.recordDigest!==record.recordDigest)
   throw Error('closeout readback');
  return {...hold('SIGNED_INCIDENT_EVIDENCE_CLOSED_NOT_PHYSICAL_RUNTIME_CLAIM'),
   state:late?'DURABLE_QL444_REMEDIATED_LEASE_EXCEPTION_EVIDENCE_CLOSED':
    'DURABLE_QL444_WITNESSED_OFF_INCIDENT_EVIDENCE_CLOSED',
   ownerAcceptance:'DUAL_SIGNED_INCIDENT_EVIDENCE_CLOSEOUT_ONLY',
   originalIncidentId:id,watchId,continuityNonce,leaseExceptionRemediated:late,
   watchOneDigest:hash(w1.payload),watchTwoDigest:hash(w2.payload),
   masterReportsDigest,pendingReceiptDigest:pending.recordDigest,
   remediationReceiptDigest:remediationRecord?.recordDigest??null,
   closureReceiptDigest:record.recordDigest,masterCount:3,
   permittedNextAction:'INDEPENDENT_EXTERNAL_OFF_WATCH_BEFORE_ANY_RUNTIME_STATE_DECISION'};
 }catch{return hold('QL444_FINAL_DURABLE_CLOSURE_COMMIT_FAILED');}
}
