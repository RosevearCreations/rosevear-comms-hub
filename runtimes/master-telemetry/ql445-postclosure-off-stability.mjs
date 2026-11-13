import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/,HEX=/^[a-f0-9]{64}$/;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(at(x))&&
 at(x)<=now&&now-at(x)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,physicalReceiverCurrentlyOff:false,
 receiver:'UNKNOWN_FRESH_EXTERNAL_OFF_REQUIRED',
 manualIsolationAndIndependentOffRequired:true,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
 ownerAcceptance:'HOLD'});
function validSig(p,s,pin){
 try{
  if(typeof s!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(s)||
   typeof pin!=='string'||pin.length>512)return false;
  const raw=Buffer.from(pin,'base64');if(raw.toString('base64')!==pin)return false;
  const key=createPublicKey({key:raw,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(p)),key,Buffer.from(s,'base64'));
 }catch{return false;}
}
const signed=(e,keys,pin)=>exact(e,['payload','signature'])&&exact(e.payload,keys)&&
 validSig(e.payload,e.signature,pin);

/** Durable, append-only protected QL-445 custody. Readback deliberately
 * never reports live receiver OFF or promotes a connection. */
export function openQl445PostClosureLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL445_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const stat=lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077))
  throw Error('QL445_UNSAFE_PRIVATE_DIRECTORY');
 const file=(kind,id)=>{
  if(!['pending','stable','recurrence'].includes(kind)||!ID.test(id??''))
   throw Error('QL445_INVALID_LEDGER_KEY');
  return join(root,'ql445-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  let raw;
  try{raw=readFileSync(file(kind,id),'utf8');}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.length>4096)throw Error('QL445_OVERSIZED_RECORD');
  let rec;try{rec=JSON.parse(raw);}catch{throw Error('QL445_CORRUPT_RECORD');}
  if(!exact(rec,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   rec.schema!=='rosevear.ql445.protected-postclosure-stability-custody.v1'||
   rec.kind!==kind||rec.incidentId!==id||!HEX.test(rec.evidenceDigest??'')||
   rec.recordDigest!==hash({schema:rec.schema,kind,incidentId:id,
    evidenceDigest:rec.evidenceDigest}))throw Error('QL445_TAMPERED_RECORD');
  return rec;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL445_ALREADY_CLAIMED');
  const rec={schema:'rosevear.ql445.protected-postclosure-stability-custody.v1',
   kind,incidentId:id,evidenceDigest};rec.recordDigest=hash(rec);
  const fd=openSync(file(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(rec));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==rec.recordDigest)
   throw Error('QL445_PROTECTED_READBACK_FAILED');
  return rec;
 };
 return Object.freeze({read,claimOnce});
}
function verifiedQl444(s,ledger){
 if(!s||!['DURABLE_QL444_WITNESSED_OFF_INCIDENT_EVIDENCE_CLOSED',
   'DURABLE_QL444_REMEDIATED_LEASE_EXCEPTION_EVIDENCE_CLOSED'].includes(s.state)||
  s.connection!=='HOLD'||s.activationAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.watchId??'')||
  !ID.test(s.continuityNonce??'')||
  ![s.watchOneDigest,s.watchTwoDigest,s.masterReportsDigest,
    s.pendingReceiptDigest,s.closureReceiptDigest].every(x=>HEX.test(x??''))||
  s.leaseExceptionRemediated!==
   (s.state==='DURABLE_QL444_REMEDIATED_LEASE_EXCEPTION_EVIDENCE_CLOSED')||
  (s.leaseExceptionRemediated?!HEX.test(s.remediationReceiptDigest??''):
   s.remediationReceiptDigest!==null)||typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read('closed',id)?.recordDigest===s.closureReceiptDigest&&
   (s.leaseExceptionRemediated
    ?ledger.read('remediation',id)?.recordDigest===s.remediationReceiptDigest
    :!ledger.read('remediation',id));
 }catch{return false;}
}
const sourceFields=['schema','incidentId','ql444SummaryDigest','ql444ClosureReceiptDigest',
 'previousOffDigest','observedAt'];
const hostFields=['schema','incidentId','watchId','watchNonce','sampleIndex','originalHostId',
 'ql444SummaryDigest','previousOffDigest','receiverState','watchdogArmed',
 'hostSequence','observedAt'];
const witnessFields=['schema','incidentId','watchId','watchNonce','sampleIndex',
 'ql444SummaryDigest','signedHostProbeDigest','previousOffDigest','receiverState',
 'observerSequence','observedAt'];
const masterFields=['schema','incidentId','masterId','ql444ClosureReceiptDigest',
 'postClosureWatchDigest','classification','decision','reviewedAt'];
const ownerFields=['schema','incidentId','sourceOwnerId','masterOwnerId',
 'ql444ClosureReceiptDigest','postClosureWatchDigest','masterReportsDigest',
 'classification','decision','reviewedAt'];

export function readQl445Continuity(ledger,id){
 try{
  const p=ledger.read('pending',id),stable=ledger.read('stable',id),
   recurrence=ledger.read('recurrence',id);
  if((stable||recurrence)&&(!p||(stable&&recurrence)))
   return hold('QL445_CONTRADICTORY_PROTECTED_CUSTODY');
  if(recurrence)return {...hold('QL445_SIGNED_RECURRENCE_INCIDENT_REQUIRES_OWNER_ATTENTION'),
   state:'QL445_DURABLE_POSTCLOSURE_RECURRENCE_CASE_OPEN',
   pendingReceiptDigest:p.recordDigest,recurrenceReceiptDigest:recurrence.recordDigest};
  if(stable)return {...hold('QL445_SIGNED_HISTORICAL_STABILITY_NOT_CURRENT_OFF'),
   state:'QL445_DURABLE_POSTCLOSURE_OFF_EVIDENCE_ONLY',
   pendingReceiptDigest:p.recordDigest,stabilityReceiptDigest:stable.recordDigest};
  if(p)return {...hold('QL445_PENDING_NONREPLAYABLE'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL445_NO_POSTCLOSURE_WATCH_CUSTODY');
 }catch{return hold('QL445_PRIVATE_CUSTODY_UNREADABLE');}
}

/** QL-445 never energizes a receiver, authorizes CONNECTED or infers live
 * OFF from prior custody. A signed ON recurrence is a new OPEN safety case. */
export async function runQl445PostClosureStability({
 ql444Summary,ql444Ledger,watchLedger,watchNonce,watchId,
 originalCommsSourceProvider,originalHostProvider,independentObserverProvider,
 threeMasterProvider,finalOwnerDecision
},o={}){
 if(typeof watchLedger?.read!=='function'||typeof watchLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl444Source!=='function'||
  typeof originalHostProvider?.readSignedPostClosureProbes!=='function'||
  typeof independentObserverProvider?.readSignedPostClosureObservations!=='function'||
  typeof threeMasterProvider?.readSignedPostClosureDecisions!=='function')
  return hold('QL445_EXTERNAL_INDEPENDENT_READONLY_ADAPTERS_REQUIRED');
 if(!o.protectedOriginalHostSession||!o.trustedClockVerified||
  !o.independentQl444CustodyVerified||!o.twoOwnerIdentityVerified||
  !Number.isSafeInteger(o.nowMs)||!ID.test(watchNonce??'')||
  !ID.test(watchId??'')||watchNonce===ql444Summary?.continuityNonce||
  watchId===ql444Summary?.watchId||
  !verifiedQl444(ql444Summary,ql444Ledger))
  return hold('QL445_EXACT_QL444_CLOSURE_AND_NEW_WATCH_REQUIRED');
 const s=ql444Summary,id=s.originalIncidentId;
 const pins=[o.commsSourcePin,o.originalHostPin,o.independentObserverPin,
  o.sourceOwnerPin,o.masterOwnerPin,...MASTERS.map(m=>o.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string'||!x)||new Set(pins).size!==pins.length||
  !o.pinsIndependentlyVerified)
  return hold('QL445_DISTINCT_PINNED_SIGNER_CUSTODY_REQUIRED');
 try{
  if(watchLedger.read('pending',id)||watchLedger.read('stable',id)||
   watchLedger.read('recurrence',id))
   return hold('QL445_WATCH_ALREADY_ATTEMPTED_NO_REPLAY');
 }catch{return hold('QL445_WATCH_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=watchLedger.claimOnce('pending',id,hash({
   ql444SummaryDigest:hash(s),closureReceiptDigest:s.closureReceiptDigest,
   previousOffDigest:s.watchTwoDigest,watchNonce,watchId}));
  if(watchLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL445_PRIVATE_PENDING_FAILED');}
 let source;
 try{source=await originalCommsSourceProvider.readSignedQl444Source({
  incidentId:id,ql444ClosureReceiptDigest:s.closureReceiptDigest});}
 catch{return hold('QL445_ORIGINAL_COMMS_SOURCE_UNAVAILABLE');}
 if(!signed(source,sourceFields,o.commsSourcePin)||
  source.payload.schema!=='rosevear.ql445.original-comms-ql444-source.v1'||
  source.payload.incidentId!==id||source.payload.ql444SummaryDigest!==hash(s)||
  source.payload.ql444ClosureReceiptDigest!==s.closureReceiptDigest||
  source.payload.previousOffDigest!==s.watchTwoDigest||
  !fresh(source.payload.observedAt,o.nowMs))
  return hold('QL445_QL444_SIGNED_SOURCE_CUSTODY_INVALID');
 let hosts,observations;
 try{hosts=await originalHostProvider.readSignedPostClosureProbes({
  incidentId:id,watchNonce,watchId,sourceDigest:hash(source.payload)});}
 catch{return hold('QL445_ORIGINAL_HOST_CONTINUITY_UNAVAILABLE');}
 try{observations=await independentObserverProvider.readSignedPostClosureObservations({
  incidentId:id,watchNonce,watchId});}
 catch{return hold('QL445_INDEPENDENT_OFF_ATTESTATIONS_UNAVAILABLE');}
 if(!Array.isArray(hosts)||hosts.length!==2||
  !Array.isArray(observations)||observations.length!==2)
  return hold('QL445_TWO_RECONCILED_POSTCLOSURE_ATTESTATIONS_REQUIRED');
 let prevDigest=s.watchTwoDigest,prevSequence=0,prevTime=at(source.payload.observedAt),risk=false;
 for(let i=0;i<2;i++){
  const h=hosts[i],w=observations[i],p=h?.payload,r=w?.payload;
  if(!signed(h,hostFields,o.originalHostPin)||
   p.schema!=='rosevear.ql445.original-host-postclosure-probe.v1'||
   p.incidentId!==id||p.watchId!==watchId||p.watchNonce!==watchNonce||
   p.sampleIndex!==i+1||p.originalHostId!=='DESKTOP-AE894KC'||
   p.ql444SummaryDigest!==hash(s)||p.previousOffDigest!==prevDigest||
   !['OFF','ON'].includes(p.receiverState)||p.watchdogArmed!==true||
   !Number.isSafeInteger(p.hostSequence)||p.hostSequence<=prevSequence||
   !fresh(p.observedAt,o.nowMs)||at(p.observedAt)<prevTime+(i===0?0:1000))
   return hold('QL445_SIGNED_ORIGINAL_HOST_POSTCLOSURE_PROBE_INVALID');
  if(!signed(w,witnessFields,o.independentObserverPin)||
   r.schema!=='rosevear.ql445.independent-postclosure-observation.v1'||
   r.incidentId!==id||r.watchId!==watchId||r.watchNonce!==watchNonce||
   r.sampleIndex!==i+1||r.ql444SummaryDigest!==hash(s)||
   r.signedHostProbeDigest!==hash(p)||r.previousOffDigest!==prevDigest||
   !['OFF','ON'].includes(r.receiverState)||
   !Number.isSafeInteger(r.observerSequence)||
   r.observerSequence<=p.hostSequence||
   !fresh(r.observedAt,o.nowMs)||at(r.observedAt)<at(p.observedAt))
   return hold('QL445_INDEPENDENT_SIGNED_POSTCLOSURE_OFF_INVALID');
  if(p.receiverState!==r.receiverState)
   return {...hold('QL445_DIVERGENT_SIGNED_STATES_POTENTIAL_RECURRENCE'),
    recurrenceSuspected:true};
  risk ||=r.receiverState==='ON';
  prevDigest=hash(r);prevSequence=r.observerSequence;prevTime=at(r.observedAt);
 }
 const classification=risk?'SIGNED_ON_RECURRENCE_REOPEN':'RECONCILED_HISTORICAL_OFF_STABILITY_ONLY';
 const decision=risk?'REOPEN_POSTCLOSURE_RECEIVER_INCIDENT_KEEP_HOLD':
  'ACCEPT_OFF_STABILITY_EVIDENCE_ONLY_NO_CONNECT';
 const watchDigest=hash({ql444SummaryDigest:hash(s),watchNonce,watchId,
  hosts:hosts.map(x=>hash(x.payload)),observers:observations.map(x=>hash(x.payload)),
  classification});
 let masters;
 try{masters=await threeMasterProvider.readSignedPostClosureDecisions({
  incidentId:id,classification,watchDigest});}
 catch{return hold('QL445_THREE_MASTER_STABILITY_REVIEW_UNAVAILABLE');}
 if(!Array.isArray(masters)||masters.length!==3)
  return hold('QL445_THREE_DISTINCT_MASTER_STABILITY_VOTES_REQUIRED');
 const seen=new Set(),accepted=[];
 for(const e of masters){
  const p=e?.payload;
  if(!MASTERS.includes(p?.masterId)||seen.has(p.masterId)||
   !signed(e,masterFields,o.masterPins[p.masterId])||
   p.schema!=='rosevear.ql445.three-master-stability-review.v1'||
   p.incidentId!==id||p.ql444ClosureReceiptDigest!==s.closureReceiptDigest||
   p.postClosureWatchDigest!==watchDigest||
   p.classification!==classification||p.decision!==decision||
   !fresh(p.reviewedAt,o.nowMs)||at(p.reviewedAt)<prevTime)
   return hold('QL445_THREE_MASTER_SIGNED_STABILITY_DECISION_REJECTED');
  seen.add(p.masterId);accepted.push(p);
 }
 accepted.sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId));
 const masterReportsDigest=hash(accepted),final=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(final,ownerFields)||
  final.schema!=='rosevear.ql445.two-owner-postclosure-stability-decision.v1'||
  final.incidentId!==id||!PERSON.test(final.sourceOwnerId??'')||
  !PERSON.test(final.masterOwnerId??'')||
  final.sourceOwnerId===final.masterOwnerId||
  final.ql444ClosureReceiptDigest!==s.closureReceiptDigest||
  final.postClosureWatchDigest!==watchDigest||
  final.masterReportsDigest!==masterReportsDigest||
  final.classification!==classification||final.decision!==decision||
  !fresh(final.reviewedAt,o.nowMs)||
  at(final.reviewedAt)<Math.max(...accepted.map(x=>at(x.reviewedAt)))||
  !validSig(final,finalOwnerDecision.sourceOwnerSignature,o.sourceOwnerPin)||
  !validSig(final,finalOwnerDecision.masterOwnerSignature,o.masterOwnerPin))
  return hold('QL445_TWO_INDEPENDENT_OWNER_STABILITY_DECISION_REJECTED');
 try{
  if(!verifiedQl444(s,ql444Ledger)||
   watchLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   watchLedger.read('stable',id)||watchLedger.read('recurrence',id)||
   !fresh(observations[1].payload.observedAt,o.nowMs)||
   !fresh(final.reviewedAt,o.nowMs))
   return hold('QL445_PROTECTED_CUSTODY_OR_WATCH_FRESHNESS_DRIFT');
  const kind=risk?'recurrence':'stable';
  const saved=watchLedger.claimOnce(kind,id,hash({
   ql444ClosureReceiptDigest:s.closureReceiptDigest,
   pendingReceiptDigest:pending.recordDigest,watchDigest,
   masterReportsDigest,finalOwnerDigest:hash(final),classification}));
  if(watchLedger.read(kind,id)?.recordDigest!==saved.recordDigest)
   throw Error('readback');
  return {...hold(risk?'SIGNED_POSTCLOSURE_ON_RECURRENCE_REQUIRES_INCIDENT_REOPEN':
   'SIGNED_HISTORICAL_OFF_STABILITY_ONLY_NOT_LIVE_RUNTIME'),
   state:risk?'DURABLE_QL445_SIGNED_ON_RECURRENCE_INCIDENT_OPEN':
    'DURABLE_QL445_POSTCLOSURE_OFF_STABILITY_EVIDENCE_ADMITTED',
   ownerAcceptance:risk?'DUAL_SIGNED_RECURRENCE_REOPEN_ONLY':
    'DUAL_SIGNED_HISTORICAL_STABILITY_EVIDENCE_ONLY',
   originalIncidentId:id,watchId,watchNonce,
   classification,postClosureWatchDigest:watchDigest,masterReportsDigest,
   pendingReceiptDigest:pending.recordDigest,
   ...{[risk?'recurrenceReceiptDigest':'stabilityReceiptDigest']:saved.recordDigest},
   masterCount:3,recurrenceDetected:risk,
   permittedNextAction:risk?
    'NEW_INDEPENDENT_INCIDENT_AND_RECEIVER_ISOLATION':
    'CONTINUE_INDEPENDENT_FRESH_OFF_WATCH_WITHOUT_ACTIVATION'};
 }catch{return hold('QL445_PROTECTED_STABILITY_OR_RECURRENCE_COMMIT_FAILED');}
}
