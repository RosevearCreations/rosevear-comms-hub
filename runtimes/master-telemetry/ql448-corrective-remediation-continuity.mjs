import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-448 is evidence-only. A passed historical OFF horizon never proves
 * physical current OFF or permits receiver activation or incident closure. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HORIZONS=[{id:'SHORT',minimum:0},{id:'MEDIUM',minimum:10000},{id:'LONG',minimum:30000}];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/;
const SCHEMA='rosevear.ql448.signed-corrective-long-horizon.v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const time=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(time(x))&&
 time(x)<=now&&now-time(x)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,physicalReceiverCurrentlyOff:false,
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,ownerAcceptance:'HOLD',
 incidentStatus:'OPEN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function verifySigned(payload,signature,pin){
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
const signed=(e,fields,pin)=>exact(e,['payload','signature'])&&
 exact(e.payload,fields)&&verifySigned(e.payload,e.signature,pin);

export function openQl448RemediationLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL448_ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const dir=lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||(dir.mode&0o077))
  throw Error('QL448_UNSAFE_PRIVATE_DIRECTORY');
 const filename=(kind,id)=>{
  if(!['pending','reviewed','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL448_INVALID_CUSTODY_KEY');
  return join(root,'ql448-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const path=filename(kind,id);let st;
  try{st=lstatSync(path);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||
   st.size>4096)throw Error('QL448_UNSAFE_RECEIPT');
  let record;try{record=JSON.parse(readFileSync(path,'utf8'));}
  catch{throw Error('QL448_CORRUPT_RECEIPT');}
  if(!exact(record,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   record.schema!==SCHEMA||record.kind!==kind||record.incidentId!==id||
   !HEX.test(record.evidenceDigest??'')||
   record.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,
    evidenceDigest:record.evidenceDigest}))
   throw Error('QL448_TAMPERED_RECEIPT');
  return record;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))
   throw Error('QL448_ALREADY_CLAIMED');
  const record={schema:SCHEMA,kind,incidentId:id,evidenceDigest};
  record.recordDigest=hash(record);
  const fd=openSync(filename(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(record));fsyncSync(fd);}finally{closeSync(fd);}
  const df=openSync(root,'r');try{fsyncSync(df);}finally{closeSync(df);}
  if(read(kind,id)?.recordDigest!==record.recordDigest)
   throw Error('QL448_DURABLE_READBACK_MISMATCH');
  return record;
 };
 return Object.freeze({read,claimOnce});
}
function validQl447(s,ledger){
 const exception=s?.state==='DURABLE_QL447_ISOLATION_EXCEPTION_CORRECTIVE_FOLLOWUP_OPEN';
 const reviewed=s?.state==='DURABLE_QL447_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY';
 if((!exception&&!reviewed)||s.connection!=='HOLD'||
  s.activationAuthorized!==false||s.physicalReceiverCurrentlyOff!==false||
  s.incidentStatus!=='OPEN'||s.masterCount!==3||
  s.ownerAcceptance!=='DUAL_SIGNED_CORRECTIVE_FOLLOWUP_KEEP_OPEN'||
  s.classification!==(exception?'SIGNED_ISOLATION_RECONFIRMATION_EXCEPTION_INCIDENT_OPEN':
   'SIGNED_HISTORICAL_ISOLATION_RECONFIRMED_INCIDENT_OPEN')||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.followUpId??'')||
  ![s.pendingReceiptDigest,s.followUpReceiptDigest,
   s.isolationEvidenceDigest,s.masterReportsDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(exception?'exception':'reconfirmed',id)?.recordDigest===
    s.followUpReceiptDigest&&!ledger.read(exception?'reconfirmed':'exception',id);
 }catch{return false;}
}
export function readQl448Remediation(ledger,id){
 try{
  const p=ledger.read('pending',id),ok=ledger.read('reviewed',id),
   e=ledger.read('exception',id);
  if((ok||e)&&(!p||(ok&&e)))return hold('QL448_CONFLICTING_CUSTODY');
  if(ok)return {...hold('QL448_HISTORICAL_LONG_HORIZON_EVIDENCE_ONLY'),
   state:'QL448_DURABLE_CORRECTIVE_PRECONDITIONS_REVIEWED_INCIDENT_OPEN',
   pendingReceiptDigest:p.recordDigest,reviewReceiptDigest:ok.recordDigest};
  if(e)return {...hold('QL448_UNRESOLVED_CORRECTIVE_EXCEPTION_OPEN'),
   state:'QL448_DURABLE_CORRECTIVE_EXCEPTION_FOLLOWUP_OPEN',
   pendingReceiptDigest:p.recordDigest,exceptionReceiptDigest:e.recordDigest};
  if(p)return {...hold('QL448_PENDING_REQUIRES_OWNER_RECOVERY'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL448_NO_PRIVATE_CORRECTIVE_RECEIPT');
 }catch{return hold('QL448_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql447SummaryDigest','ql447ReceiptDigest',
 'priorClassification','incidentStatus','observedAt'];
const remediationFields=['schema','incidentId','remediationId','ql447SummaryDigest',
 'ql447ReceiptDigest','sourceDigest','correctiveDisposition',
 'isolationLockVerified','leaseRevokedVerified','watchdogArmedVerified','remediatedAt'];
const hostFields=['schema','incidentId','remediationId','challengeNonce','horizon',
 'sampleIndex','originalHostId','ql447ReceiptDigest','remediationDigest',
 'previousDigest','receiverState','isolationLock','leaseRevoked','watchdogArmed',
 'hostSequence','observedAt'];
const witnessFields=['schema','incidentId','remediationId','challengeNonce','horizon',
 'sampleIndex','ql447ReceiptDigest','signedHostDigest','previousDigest',
 'receiverState','isolationConfirmed','observerSequence','observedAt'];
const masterFields=['schema','incidentId','remediationId','masterId','ql447ReceiptDigest',
 'longHorizonDigest','classification','correctiveDecision','incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','remediationId','sourceOwnerId','masterOwnerId',
 'ql447ReceiptDigest','longHorizonDigest','masterReportsDigest','classification',
 'correctiveDecision','incidentStatus','reviewedAt'];

/** Independent corrective receipts and fresh multi-horizon signed original
 * Windows host + independent-observer pairs; never closes an incident. */
export async function runQl448CorrectiveReview({
 ql447Summary,ql447Ledger,remediationLedger,remediationId,challengeNonce,
 originalCommsSourceProvider,independentRemediationProvider,originalHostProvider,
 independentObserverProvider,threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof remediationLedger?.read!=='function'||
  typeof remediationLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl447Incident!=='function'||
  typeof independentRemediationProvider?.readSignedCorrectiveReceipt!=='function'||
  typeof originalHostProvider?.readSignedLongHorizonProbes!=='function'||
  typeof independentObserverProvider?.readSignedLongHorizonObservations!=='function'||
  typeof threeMasterProvider?.readSignedCorrectiveContinuityVotes!=='function')
  return hold('QL448_EXTERNAL_READONLY_SIGNED_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl447CustodyVerified||!opts.separateOwnerRolesVerified||
  !Number.isSafeInteger(opts.nowMs)||!ID.test(remediationId??'')||
  !ID.test(challengeNonce??'')||
  challengeNonce===ql447Summary?.followUpId||
  !validQl447(ql447Summary,ql447Ledger))
  return hold('QL448_EXACT_QL447_OPEN_CASE_AND_PROTECTED_CHALLENGE_REQUIRED');
 const s=ql447Summary,id=s.originalIncidentId,prior=s.followUpReceiptDigest;
 const priorException=s.state==='DURABLE_QL447_ISOLATION_EXCEPTION_CORRECTIVE_FOLLOWUP_OPEN';
 const pins=[opts.commsSourcePin,opts.remediationOfficerPin,opts.originalHostPin,
  opts.independentReceiverPin,opts.sourceOwnerPin,opts.masterOwnerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==pins.length||
  !opts.independentSignerPinsVerified)
  return hold('QL448_INDEPENDENT_DISTINCT_PINNED_SIGNERS_REQUIRED');
 try{
  if(remediationLedger.read('pending',id)||remediationLedger.read('reviewed',id)||
   remediationLedger.read('exception',id))
   return hold('QL448_ONE_USE_CORRECTIVE_REVIEW_ALREADY_ATTEMPTED');
 }catch{return hold('QL448_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=remediationLedger.claimOnce('pending',id,hash({
   prior,ql447SummaryDigest:hash(s),remediationId,challengeNonce}));
  if(remediationLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('pending');
 }catch{return hold('QL448_PENDING_COMMIT_FAILED');}
 let source,remediation,hosts,witnesses;
 try{source=await originalCommsSourceProvider.readSignedQl447Incident({
  incidentId:id,prior,remediationId,challengeNonce,pendingDigest:pending.recordDigest});}
 catch{return hold('QL448_ORIGINAL_QL447_INCIDENT_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql448.original-ql447-source.v1'||
  p.incidentId!==id||p.ql447SummaryDigest!==hash(s)||
  p.ql447ReceiptDigest!==prior||p.priorClassification!==s.classification||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.observedAt,opts.nowMs))
  return hold('QL448_ORIGINAL_SOURCE_SIGNED_READBACK_INVALID');
 try{remediation=await independentRemediationProvider.readSignedCorrectiveReceipt({
  incidentId:id,remediationId,prior,sourceDigest:hash(p),challengeNonce});}
 catch{return hold('QL448_INDEPENDENT_REMEDIATION_RECEIPT_UNAVAILABLE');}
 const r=remediation?.payload;
 const dispositions=priorException?
  ['SIGNED_CORRECTIVE_ACTION_COMPLETE_UNDER_HOLD',
   'SIGNED_CORRECTIVE_ACTION_INCOMPLETE_KEEP_HOLD']:
  ['NO_EXCEPTION_SIGNED_CONTINUITY_RECHECK'];
 if(!signed(remediation,remediationFields,opts.remediationOfficerPin)||
  r.schema!=='rosevear.ql448.independent-corrective-remediation.v1'||
  r.incidentId!==id||r.remediationId!==remediationId||
  r.ql447SummaryDigest!==hash(s)||r.ql447ReceiptDigest!==prior||
  r.sourceDigest!==hash(p)||!dispositions.includes(r.correctiveDisposition)||
  typeof r.isolationLockVerified!=='boolean'||
  typeof r.leaseRevokedVerified!=='boolean'||
  typeof r.watchdogArmedVerified!=='boolean'||
  !fresh(r.remediatedAt,opts.nowMs)||
  time(r.remediatedAt)<time(p.observedAt))
  return hold('QL448_INDEPENDENT_CORRECTIVE_RECEIPT_INVALID');
 try{hosts=await originalHostProvider.readSignedLongHorizonProbes({
  incidentId:id,remediationId,challengeNonce,prior,remediationDigest:hash(r)});}
 catch{return hold('QL448_ORIGINAL_HOST_LONG_HORIZON_UNAVAILABLE');}
 try{witnesses=await independentObserverProvider.readSignedLongHorizonObservations({
  incidentId:id,remediationId,challengeNonce,prior,remediationDigest:hash(r)});}
 catch{return hold('QL448_INDEPENDENT_LONG_HORIZON_UNAVAILABLE');}
 if(!Array.isArray(hosts)||hosts.length!==3||!Array.isArray(witnesses)||
  witnesses.length!==3)
  return hold('QL448_THREE_SIGNED_LONG_HORIZONS_REQUIRED');
 let previousDigest=hash(r),previousSequence=0,previousTime=time(r.remediatedAt);
 let firstTime=null,allSafe=true;
 for(let i=0;i<3;i++){
  const horizon=HORIZONS[i],h=hosts[i],w=witnesses[i];
  const hp=h?.payload,wp=w?.payload;
  if(!signed(h,hostFields,opts.originalHostPin)||
   hp.schema!=='rosevear.ql448.original-host-long-horizon-probe.v1'||
   hp.incidentId!==id||hp.remediationId!==remediationId||
   hp.challengeNonce!==challengeNonce||hp.horizon!==horizon.id||
   hp.sampleIndex!==i+1||hp.originalHostId!=='DESKTOP-AE894KC'||
   hp.ql447ReceiptDigest!==prior||hp.remediationDigest!==hash(r)||
   hp.previousDigest!==previousDigest||
   !['OFF','ON'].includes(hp.receiverState)||
   typeof hp.isolationLock!=='boolean'||typeof hp.leaseRevoked!=='boolean'||
   typeof hp.watchdogArmed!=='boolean'||
   !Number.isSafeInteger(hp.hostSequence)||hp.hostSequence<=previousSequence||
   !fresh(hp.observedAt,opts.nowMs)||time(hp.observedAt)<previousTime||
   (i>0&&time(hp.observedAt)-firstTime<horizon.minimum))
   return hold('QL448_ORIGINAL_HOST_SIGNED_LONG_HORIZON_INVALID');
  if(i===0)firstTime=time(hp.observedAt);
  if(!signed(w,witnessFields,opts.independentReceiverPin)||
   wp.schema!=='rosevear.ql448.independent-long-horizon-observation.v1'||
   wp.incidentId!==id||wp.remediationId!==remediationId||
   wp.challengeNonce!==challengeNonce||wp.horizon!==horizon.id||
   wp.sampleIndex!==i+1||wp.ql447ReceiptDigest!==prior||
   wp.signedHostDigest!==hash(hp)||wp.previousDigest!==previousDigest||
   !['OFF','ON'].includes(wp.receiverState)||
   typeof wp.isolationConfirmed!=='boolean'||
   !Number.isSafeInteger(wp.observerSequence)||
   wp.observerSequence<=hp.hostSequence||
   !fresh(wp.observedAt,opts.nowMs)||
   time(wp.observedAt)<time(hp.observedAt))
   return hold('QL448_INDEPENDENT_SIGNED_LONG_HORIZON_INVALID');
  allSafe &&=hp.receiverState==='OFF'&&wp.receiverState==='OFF'&&
   hp.isolationLock&&hp.leaseRevoked&&hp.watchdogArmed&&wp.isolationConfirmed;
  previousSequence=wp.observerSequence;
  previousTime=time(wp.observedAt);previousDigest=hash(wp);
 }
 const remedySafe=r.isolationLockVerified&&r.leaseRevokedVerified&&
  r.watchdogArmedVerified&&
  (!priorException||r.correctiveDisposition==='SIGNED_CORRECTIVE_ACTION_COMPLETE_UNDER_HOLD');
 const preconditionsMet=allSafe&&remedySafe;
 const classification=!preconditionsMet?'SIGNED_LONG_HORIZON_ISOLATION_EXCEPTION_OPEN':
  priorException?'SIGNED_CORRECTIVE_PRECONDITIONS_EVIDENCED_INCIDENT_OPEN':
  'SIGNED_LONG_HORIZON_HISTORICAL_CONTINUITY_INCIDENT_OPEN';
 const correctiveDecision=!preconditionsMet?
  'ESCALATE_UNRESOLVED_EXCEPTION_SUPERVISED_REMEDIATION_KEEP_HOLD':
  priorException?'ATTEST_CORRECTIVE_CLOSURE_PRECONDITIONS_ONLY_KEEP_OPEN':
  'ATTEST_HISTORICAL_OFF_CONTINUITY_ONLY_KEEP_OPEN';
 const horizonDigest=hash({ql447SummaryDigest:hash(s),challengeNonce,remediationId,
  sourceDigest:hash(p),remediationDigest:hash(r),
  hostDigests:hosts.map(e=>hash(e.payload)),
  observerDigests:witnesses.map(e=>hash(e.payload)),classification});
 let votes;
 try{votes=await threeMasterProvider.readSignedCorrectiveContinuityVotes({
  incidentId:id,prior,remediationId,horizonDigest,classification,correctiveDecision});}
 catch{return hold('QL448_THREE_MASTER_LONG_HORIZON_REVIEW_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL448_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 const accepted=[],seen=new Set();
 for(const e of votes){
  const m=e?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(e,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql448.three-master-long-horizon-review.v1'||
   m.incidentId!==id||m.remediationId!==remediationId||
   m.ql447ReceiptDigest!==prior||m.longHorizonDigest!==horizonDigest||
   m.classification!==classification||m.correctiveDecision!==correctiveDecision||
   m.incidentStatus!=='OPEN_HOLD'||!fresh(m.reviewedAt,opts.nowMs)||
   time(m.reviewedAt)<previousTime)
   return hold('QL448_THREE_MASTER_CORRECTIVE_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const reportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql448.dual-owner-corrective-continuity.v1'||
  f.incidentId!==id||f.remediationId!==remediationId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql447ReceiptDigest!==prior||
  f.longHorizonDigest!==horizonDigest||f.masterReportsDigest!==reportsDigest||
  f.classification!==classification||f.correctiveDecision!==correctiveDecision||
  f.incidentStatus!=='OPEN_HOLD'||!fresh(f.reviewedAt,opts.nowMs)||
  time(f.reviewedAt)<Math.max(...accepted.map(m=>time(m.reviewedAt)))||
  !verifySigned(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySigned(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL448_DUAL_OWNER_CORRECTIVE_VETO');
 try{
  if(!validQl447(s,ql447Ledger)||
   remediationLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   remediationLedger.read('reviewed',id)||remediationLedger.read('exception',id)||
   !fresh(witnesses[2].payload.observedAt,opts.nowMs)||
   !fresh(f.reviewedAt,opts.nowMs))
   return hold('QL448_PRIVATE_CUSTODY_DRIFT_OR_EXPIRED_EVIDENCE');
  const kind=preconditionsMet?'reviewed':'exception';
  const receipt=remediationLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,sourceDigest:hash(p),
   remediationDigest:hash(r),horizonDigest,reportsDigest,ownerDigest:hash(f),
   classification,correctiveDecision,incidentStatus:'OPEN_HOLD'}));
  if(remediationLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(preconditionsMet?'SIGNED_HISTORICAL_PRECONDITIONS_ONLY_NOT_INCIDENT_CLOSURE':
   'SIGNED_LONG_HORIZON_EXCEPTION_REQUIRES_SUPERVISED_CORRECTION'),
   state:preconditionsMet?'DURABLE_QL448_CORRECTIVE_PRECONDITIONS_EVIDENCED':
    'DURABLE_QL448_UNRESOLVED_ISOLATION_EXCEPTION_OPEN',
   originalIncidentId:id,remediationId,challengeNonce,classification,
   correctiveDecision,exceptionClosurePreconditionsEvidenced:priorException&&preconditionsMet,
   masterCount:3,longHorizonDigest:horizonDigest,masterReportsDigest:reportsDigest,
   pendingReceiptDigest:pending.recordDigest,
   ...{[preconditionsMet?'reviewReceiptDigest':'exceptionReceiptDigest']:receipt.recordDigest},
   ownerAcceptance:'DUAL_SIGNED_HISTORICAL_CORRECTIVE_FOLLOWUP_KEEP_OPEN',
   permittedNextAction:preconditionsMet?
    'INDEPENDENT_FRESH_OFF_AND_EXPLICIT_INCIDENT_CLOSURE_CEREMONY_REQUIRED':
    'SUPERVISED_ISOLATION_REMEDIATION_AND_FRESH_HORIZON_REQUIRED'};
 }catch{return hold('QL448_DURABLE_REMEDIATION_COMMIT_FAILED');}
}
