import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';

/** QL-443 / cross-master Build 390: admission of signed shutdown evidence
 * only. This module has no receiver actuator, live OFF shortcut, or CONNECTED
 * state. Synthetic CI keys never imply external original-host enrollment. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[a-zA-Z0-9_-]{12,96}$/,PERSON=/^[a-zA-Z0-9_-]{3,80}$/,HEX=/^[a-f0-9]{64}$/;
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const time=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s?Date.parse(s):NaN;
const fresh=(s,now)=>Number.isSafeInteger(now)&&Number.isFinite(time(s))&&
 time(s)<=now&&now-time(s)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,physicalReceiverCurrentlyOff:false,
 ownerAcceptance:'HOLD',receiver:'UNKNOWN_REQUIRES_FRESH_EXTERNAL_OFF',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
 manualIsolationAndIndependentOffRequired:true});
function signature(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({format:'der',type:'spki',key:bytes});
  return key.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(p)),
   key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const signed=(e,fields,pin)=>exact(e,['payload','signature'])&&
 exact(e.payload,fields)&&signature(e.payload,e.signature,pin);
const sourceFields=['schema','incidentId','ql441Digest','ql441DecisionReceiptDigest',
 'assertedState','observedAt'];
const hostFields=['schema','incidentId','challengeId','leaseId','hostMachineId',
 'priorIndependentOnDigest','ql441DecisionReceiptDigest','receiverState',
 'watchdogArmed','shutdownSequence','shutdownAt'];
const offFields=['schema','incidentId','challengeId','leaseId','signedHostShutdownDigest',
 'receiverState','offSequence','observedAt'];
const ql442Fields=['schema','incidentId','ql441Digest','sourceDigest','hostShutdownDigest',
 'independentOffDigest','evidenceDigest','leaseDisposition','classification','reviewedAt'];
const renewalFields=['schema','incidentId','challengeId','leaseId','renewalNonce',
 'ql442DecisionDigest','hostShutdownDigest','historicalOffDigest',
 'receiverState','offSequence','observedAt'];
const masterFields=['schema','masterId','incidentId','ql442DecisionDigest',
 'renewedOffDigest','leaseDisposition','decision','reviewedAt'];
const reviewFields=['schema','incidentId','sourceOwnerId','masterOwnerId',
 'ql442DecisionDigest','renewedOffDigest','masterReportsDigest',
 'leaseDisposition','decision','reviewedAt'];

export function openQl443ProtectedShutdownLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL443_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL443_UNSAFE_LEDGER_DIRECTORY');
 const path=(kind,id)=>{
  if(!['pending','admitted','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL443_INVALID_LEDGER_KEY');
  return join(root,'ql443-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;
  try{raw=readFileSync(path(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL443_OVERSIZED_RECORD');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL443_CORRUPT_RECORD');}
  if(!exact(rec,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql443.protected-shutdown-custody.v1'||
   rec.kind!==kind||rec.incidentId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,kind,incidentId:id,
    evidenceDigest:rec.evidenceDigest}))throw Error('QL443_TAMPERED_RECORD');
  return rec;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??''))throw Error('QL443_INVALID_DIGEST');
  if(read(kind,id))throw Error('QL443_ALREADY_CLAIMED');
  const rec={schema:'rosevear.ql443.protected-shutdown-custody.v1',kind,
   incidentId:id,evidenceDigest};rec.recordDigest=hash(rec);
  const fd=openSync(path(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const dirFd=openSync(root,'r');try{fsyncSync(dirFd);}finally{closeSync(dirFd);}
  if(read(kind,id)?.recordDigest!==rec.recordDigest)
   throw Error('QL443_CUSTODY_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
function verifyPrior(p,ledger){
 if(!p||!['DURABLE_QL441_GO_WITNESSED_ON_REVIEW_ONLY',
  'DURABLE_QL441_NO_GO_WITNESSED_ON_SHUTDOWN_REQUIRED'].includes(p.state)||
  p.connection!=='HOLD'||p.activationAuthorized!==false||
  p.receiver!=='ON_WITNESSED_ISOLATED_LEASE_SHUTDOWN_REQUIRED'||
  ![p.originalIncidentId,p.challengeId,p.leaseId].every(x=>ID.test(x??''))||
  ![p.independentOnDigest,p.pendingReceiptDigest,p.decisionReceiptDigest]
   .every(x=>HEX.test(x??''))||!Number.isFinite(time(p.leaseExpiresAt))||
  typeof ledger?.read!=='function')return false;
 try{return ledger.read('pending',p.originalIncidentId)?.recordDigest===p.pendingReceiptDigest&&
  ledger.read('decision',p.originalIncidentId)?.recordDigest===p.decisionReceiptDigest;}
 catch{return false;}
}
export function readQl443ShutdownContinuity(ledger,incidentId){
 try{
  const p=ledger.read('pending',incidentId),a=ledger.read('admitted',incidentId),
   e=ledger.read('exception',incidentId);
  if((a||e)&&(!p||(a&&e)))return hold('QL443_INCONSISTENT_CUSTODY');
  if(a)return {...hold('DURABLE_ADMISSION_REQUIRES_NEW_EXTERNAL_OFF_NOT_CURRENT_PHYSICAL_PROOF'),
   state:'QL443_DURABLE_SIGNED_OFF_EVIDENCE_ADMITTED_NOT_LIVE_STATE',
   pendingReceiptDigest:p.recordDigest,admissionReceiptDigest:a.recordDigest};
  if(e)return {...hold('QL443_EXPIRED_LEASE_EXCEPTION_PERSISTS'),
   state:'QL443_DURABLE_EXPIRED_LEASE_EXCEPTION_OPEN',
   pendingReceiptDigest:p.recordDigest,exceptionReceiptDigest:e.recordDigest};
  if(p)return {...hold('QL443_PENDING_INCOMPLETE_NON_REPLAYABLE'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL443_NO_PROTECTED_SHUTDOWN_EVIDENCE');
 }catch{return hold('QL443_PRIVATE_CUSTODY_UNREADABLE');}
}
/** Requires proof from Comms QL441, AI Platform QL442, original host,
 * historical independent OFF, fresh independent renewal and three Masters.
 * The result NEVER promotes a connection or claims live OFF. */
export async function runQl443ProtectedShutdownAdmission({
 ql441Summary,ql441Ledger,shutdownLedger,renewalNonce,
 commsSourceProvider,originalHostShutdownProvider,independentHistoricalOffProvider,
 aiPlatformQl442Provider,independentRenewalOffProvider,threeMasterProvider,
 finalOwnerDecision
},o={}){
 if(typeof shutdownLedger?.read!=='function'||
  typeof shutdownLedger?.claimOnce!=='function'||
  typeof commsSourceProvider?.readSignedQl441Source!=='function'||
  typeof originalHostShutdownProvider?.readSignedShutdown!=='function'||
  typeof independentHistoricalOffProvider?.readSignedOff!=='function'||
  typeof aiPlatformQl442Provider?.readSignedQl442Decision!=='function'||
  typeof independentRenewalOffProvider?.readSignedFreshOff!=='function'||
  typeof threeMasterProvider?.readSignedRenewalDecisions!=='function')
  return hold('QL443_EXTERNAL_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!o.protectedOriginalHostSession||!o.independentSourceCustodyVerified||
  !o.trustedClockVerified||!Number.isSafeInteger(o.nowMs)||
  !ID.test(renewalNonce??'')||!verifyPrior(ql441Summary,ql441Ledger))
  return hold('QL443_EXACT_QL441_ONE_USE_OR_PROTECTED_CLOCK_INVALID');
 const p=ql441Summary,id=p.originalIncidentId;
 const pins=[o.commsSourcePin,o.originalHostPin,o.historicalReceiverPin,
  o.aiPlatformPin,o.freshReceiverPin,o.ownerPin,o.reviewerPin,
  ...MASTERS.map(m=>o.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string'||!x)||new Set(pins).size!==pins.length||
  !o.originalHostPinVerified||!o.independentReceiverPinsVerified||
  !o.aiPlatformSignerPinVerified||!o.ownerRolesIndependentlyVerified)
  return hold('QL443_DISTINCT_VERIFIED_SIGNATURE_CUSTODY_REQUIRED');
 try{
  if(shutdownLedger.read('pending',id)||shutdownLedger.read('admitted',id)||
   shutdownLedger.read('exception',id))
   return hold('QL443_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
 }catch{return hold('QL443_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=shutdownLedger.claimOnce('pending',id,hash({incidentId:id,
   ql441DecisionReceiptDigest:p.decisionReceiptDigest,
   independentOnDigest:p.independentOnDigest,renewalNonce}));
  if(shutdownLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('pending');
 }catch{return hold('QL443_PENDING_PROTECTED_CUSTODY_FAILED');}
 let source;
 try{source=await commsSourceProvider.readSignedQl441Source({incidentId:id,
  decisionReceiptDigest:p.decisionReceiptDigest,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL443_COMMS_SOURCE_EVIDENCE_UNAVAILABLE');}
 if(!signed(source,sourceFields,o.commsSourcePin)||
  source.payload.schema!=='rosevear.ql442.original-comms-ql441-source-proof.v1'||
  source.payload.incidentId!==id||
  source.payload.ql441Digest!==hash(p)||
  source.payload.ql441DecisionReceiptDigest!==p.decisionReceiptDigest||
  source.payload.assertedState!=='QL441_SIGNED_DECISION_EXISTS_NO_CURRENT_RECEIVER_ASSUMPTION'||
  !fresh(source.payload.observedAt,o.nowMs))
  return hold('QL443_ORIGINAL_COMMS_SOURCE_SIGNATURE_INVALID');
 let host;
 try{host=await originalHostShutdownProvider.readSignedShutdown({incidentId:id,
  sourceDigest:hash(source.payload)});}
 catch{return hold('QL443_ORIGINAL_HOST_SHUTDOWN_MISSING');}
 if(!signed(host,hostFields,o.originalHostPin)||
  host.payload.schema!=='rosevear.ql442.original-host-signed-shutdown.v1'||
  host.payload.incidentId!==id||host.payload.challengeId!==p.challengeId||
  host.payload.leaseId!==p.leaseId||
  host.payload.hostMachineId!=='DESKTOP-AE894KC'||
  host.payload.priorIndependentOnDigest!==p.independentOnDigest||
  host.payload.ql441DecisionReceiptDigest!==p.decisionReceiptDigest||
  host.payload.receiverState!=='OFF'||host.payload.watchdogArmed!==true||
  !Number.isSafeInteger(host.payload.shutdownSequence)||
  host.payload.shutdownSequence<1||!Number.isFinite(time(host.payload.shutdownAt))||
  time(host.payload.shutdownAt)>o.nowMs||
  time(host.payload.shutdownAt)<time(p.leaseExpiresAt)-120000)
  return hold('QL443_SIGNED_ORIGINAL_HOST_OFF_SHUTDOWN_INVALID');
 let off;
 try{off=await independentHistoricalOffProvider.readSignedOff({
  incidentId:id,signedHostShutdownDigest:hash(host.payload)});}
 catch{return hold('QL443_HISTORICAL_INDEPENDENT_OFF_UNAVAILABLE');}
 if(!signed(off,offFields,o.historicalReceiverPin)||
  off.payload.schema!=='rosevear.ql442.independent-receiver-off-readback.v1'||
  off.payload.incidentId!==id||off.payload.challengeId!==p.challengeId||
  off.payload.leaseId!==p.leaseId||
  off.payload.signedHostShutdownDigest!==hash(host.payload)||
  off.payload.receiverState!=='OFF'||
  !Number.isSafeInteger(off.payload.offSequence)||
  off.payload.offSequence<host.payload.shutdownSequence||
  !Number.isFinite(time(off.payload.observedAt))||
  time(off.payload.observedAt)<time(host.payload.shutdownAt)||
  time(off.payload.observedAt)>o.nowMs)
  return hold('QL443_HISTORICAL_INDEPENDENT_OFF_INVALID');
 const late=time(host.payload.shutdownAt)>time(p.leaseExpiresAt)||
  time(off.payload.observedAt)>time(p.leaseExpiresAt);
 let ql442;
 try{ql442=await aiPlatformQl442Provider.readSignedQl442Decision({
  incidentId:id,hostShutdownDigest:hash(host.payload),independentOffDigest:hash(off.payload)});}
 catch{return hold('QL443_AI_PLATFORM_QL442_DECISION_UNAVAILABLE');}
 if(!signed(ql442,ql442Fields,o.aiPlatformPin)||
  ql442.payload.schema!=='rosevear.ql443.signed-ai-platform-ql442-closure-evidence.v1'||
  ql442.payload.incidentId!==id||ql442.payload.ql441Digest!==hash(p)||
  ql442.payload.sourceDigest!==hash(source.payload)||
  ql442.payload.hostShutdownDigest!==hash(host.payload)||
  ql442.payload.independentOffDigest!==hash(off.payload)||
  !HEX.test(ql442.payload.evidenceDigest??'')||
  ql442.payload.leaseDisposition!==(late?'EXPIRED_EXCEPTION':'ON_TIME')||
  ql442.payload.classification!==(late?'LATE_OFF_ATTESTED_LEASE_EXCEPTION_OPEN':
   'SIGNED_OFF_PILOT_CLOSURE_READY_FOR_DURABLE_ADMISSION')||
  !fresh(ql442.payload.reviewedAt,o.nowMs)||
  time(ql442.payload.reviewedAt)<time(off.payload.observedAt))
  return hold('QL443_QL442_SOURCE_CLOSURE_EVIDENCE_REJECTED');
 const ql442Digest=hash(ql442.payload);
 let renewed;
 try{renewed=await independentRenewalOffProvider.readSignedFreshOff({
  incidentId:id,renewalNonce,ql442DecisionDigest:ql442Digest,
  historicalOffDigest:hash(off.payload)});}
 catch{return hold('QL443_INDEPENDENT_FRESH_OFF_UNAVAILABLE');}
 if(!signed(renewed,renewalFields,o.freshReceiverPin)||
  renewed.payload.schema!=='rosevear.ql443.independent-fresh-off-renewal.v1'||
  renewed.payload.incidentId!==id||renewed.payload.challengeId!==p.challengeId||
  renewed.payload.leaseId!==p.leaseId||
  renewed.payload.renewalNonce!==renewalNonce||
  renewed.payload.ql442DecisionDigest!==ql442Digest||
  renewed.payload.hostShutdownDigest!==hash(host.payload)||
  renewed.payload.historicalOffDigest!==hash(off.payload)||
  renewed.payload.receiverState!=='OFF'||
  !Number.isSafeInteger(renewed.payload.offSequence)||
  renewed.payload.offSequence<=off.payload.offSequence||
  !fresh(renewed.payload.observedAt,o.nowMs)||
  time(renewed.payload.observedAt)<time(ql442.payload.reviewedAt))
  return hold('QL443_INDEPENDENT_RENEWED_OFF_OR_MONOTONICITY_INVALID');
 let reports;
 try{reports=await threeMasterProvider.readSignedRenewalDecisions({
  incidentId:id,renewedOffDigest:hash(renewed.payload),ql442DecisionDigest:ql442Digest});}
 catch{return hold('QL443_THREE_MASTER_RENEWAL_UNAVAILABLE');}
 if(!Array.isArray(reports)||reports.length!==3)
  return hold('QL443_THREE_DISTINCT_MASTER_REPORTS_REQUIRED');
 const seen=new Set(),accepted=[];
 for(const r of reports){
  const m=r?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(r,masterFields,o.masterPins[m.masterId])||
   m.schema!=='rosevear.ql443.three-master-fresh-off-closure-renewal.v1'||
   m.incidentId!==id||m.ql442DecisionDigest!==ql442Digest||
   m.renewedOffDigest!==hash(renewed.payload)||
   m.leaseDisposition!==(late?'EXPIRED_EXCEPTION':'ON_TIME')||
   m.decision!==(late?'KEEP_EXPIRED_LEASE_EXCEPTION_OPEN':
    'SIGNED_OFF_EVIDENCE_ADMISSION_ONLY_NO_ACTIVATION')||
   !fresh(m.reviewedAt,o.nowMs)||
   time(m.reviewedAt)<time(renewed.payload.observedAt))
   return hold('QL443_THREE_MASTER_RENEWAL_SIGNED_CONSENSUS_REJECTED');
  seen.add(m.masterId);accepted.push(m);
 }
 if(MASTERS.some(m=>!seen.has(m)))return hold('QL443_MASTER_IDENTITY_COVERAGE_INVALID');
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const masterReportsDigest=hash(accepted);
 const owner=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','ownerSignature','reviewerSignature'])||
  !exact(owner,reviewFields)||
  owner.schema!=='rosevear.ql443.dual-owner-protected-shutdown-admission.v1'||
  owner.incidentId!==id||!PERSON.test(owner.sourceOwnerId??'')||
  !PERSON.test(owner.masterOwnerId??'')||
  owner.sourceOwnerId===owner.masterOwnerId||
  owner.ql442DecisionDigest!==ql442Digest||
  owner.renewedOffDigest!==hash(renewed.payload)||
  owner.masterReportsDigest!==masterReportsDigest||
  owner.leaseDisposition!==(late?'EXPIRED_EXCEPTION':'ON_TIME')||
  owner.decision!==(late?'ACKNOWLEDGE_EXPIRED_LEASE_EXCEPTION_KEEP_OPEN':
   'ADMIT_SIGNED_SHUTDOWN_EVIDENCE_ONLY_NO_CONNECT')||
  !fresh(owner.reviewedAt,o.nowMs)||
  time(owner.reviewedAt)<Math.max(...accepted.map(r=>time(r.reviewedAt)))||
  !signature(owner,finalOwnerDecision.ownerSignature,o.ownerPin)||
  !signature(owner,finalOwnerDecision.reviewerSignature,o.reviewerPin))
  return hold('QL443_FINAL_INDEPENDENT_DUAL_OWNER_DECISION_INVALID');
 try{
  if(!verifyPrior(p,ql441Ledger)||
   shutdownLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   shutdownLedger.read('admitted',id)||shutdownLedger.read('exception',id))
   return hold('QL443_PROTECTED_PRIOR_OR_PENDING_CUSTODY_DRIFT');
  const kind=late?'exception':'admitted';
  const record=shutdownLedger.claimOnce(kind,id,hash({
   pendingReceiptDigest:pending.recordDigest,ql441Digest:hash(p),
   sourceDigest:hash(source.payload),hostDigest:hash(host.payload),
   historicalOffDigest:hash(off.payload),ql442DecisionDigest:ql442Digest,
   renewedOffDigest:hash(renewed.payload),masterReportsDigest,
   ownerDigest:hash(owner),late}));
  if(shutdownLedger.read(kind,id)?.recordDigest!==record.recordDigest)
   throw Error('durable readback');
  return {...hold(late?'EXPIRED_LEASE_EXCEPTION_DURABLY_OPEN':
   'SIGNED_OFF_EVIDENCE_DURABLY_ADMITTED_NO_CURRENT_STATE_PROOF'),
   state:late?'DURABLE_QL443_EXPIRED_LEASE_EXCEPTION_HANDOFF_OPEN':
    'DURABLE_QL443_SIGNED_SHUTDOWN_EVIDENCE_ADMITTED',
   ownerAcceptance:late?'DUAL_SIGNED_LATE_EXCEPTION_OPEN':
    'DUAL_SIGNED_OFF_EVIDENCE_ADMISSION_ONLY',
   originalIncidentId:id,renewalNonce,ql442DecisionDigest:ql442Digest,
   freshIndependentOffDigest:hash(renewed.payload),masterReportsDigest,
   pendingReceiptDigest:pending.recordDigest,
   ...{[late?'exceptionReceiptDigest':'admissionReceiptDigest']:record.recordDigest},
   masterCount:3,leaseExpired:late,
   permittedNextAction:late?'SIGNED_EXCEPTION_REMEDIATION_AND_FRESH_OFF':
    'SEPARATE_LIVE_OFF_CONFIRMATION_BEFORE_REAL_PILOT_CLOSEOUT'};
 }catch{return hold('QL443_DURABLE_CUSTODY_ADMISSION_FAILED');}
}
