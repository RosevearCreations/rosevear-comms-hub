import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-449 admits independently anchored evidence for an owner-gated incident
 * disposition review. It never reports live physical OFF or closes/activates. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/;
const SCHEMA='rosevear.ql449.anchored-corrective-off-disposition.v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(at(x))&&
 at(x)<=now&&now-at(x)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,physicalReceiverCurrentlyOff:false,
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,
 ownerAcceptance:'HOLD',incidentStatus:'OPEN',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function validSig(payload,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const keyBytes=Buffer.from(pin,'base64');
  if(keyBytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:keyBytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const signed=(envelope,fields,pin)=>exact(envelope,['payload','signature'])&&
 exact(envelope.payload,fields)&&validSig(envelope.payload,envelope.signature,pin);

export function openQl449DispositionLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL449_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const st=lstatSync(root);
 if(!st.isDirectory()||st.isSymbolicLink()||(st.mode&0o077))
  throw Error('QL449_UNSAFE_LEDGER_DIRECTORY');
 const path=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL449_INVALID_RECEIPT_KEY');
  return join(root,'ql449-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const p=path(kind,id);let stat;
  try{stat=lstatSync(p);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)||stat.size>4096)
   throw Error('QL449_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(p,'utf8'));}catch{throw Error('QL449_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL449_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL449_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};
  r.recordDigest=hash(r);
  const fd=openSync(path(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)throw Error('QL449_READBACK_FAILED');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validPrior(s,ledger){
 if(!s||s.state!=='DURABLE_QL448_CORRECTIVE_PRECONDITIONS_EVIDENCED'||
  s.exceptionClosurePreconditionsEvidenced!==true||
  s.connection!=='HOLD'||s.activationAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.incidentStatus!=='OPEN'||
  s.masterCount!==3||
  s.classification!=='SIGNED_CORRECTIVE_PRECONDITIONS_EVIDENCED_INCIDENT_OPEN'||
  s.ownerAcceptance!=='DUAL_SIGNED_HISTORICAL_CORRECTIVE_FOLLOWUP_KEEP_OPEN'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.remediationId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.pendingReceiptDigest,s.reviewReceiptDigest,s.longHorizonDigest,
    s.masterReportsDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read('reviewed',id)?.recordDigest===s.reviewReceiptDigest&&
   !ledger.read('exception',id);
 }catch{return false;}
}
export function readQl449Disposition(ledger,id){
 try{
  const p=ledger.read('pending',id),review=ledger.read('review',id),
   exception=ledger.read('exception',id);
  if((review||exception)&&(!p||(review&&exception)))
   return hold('QL449_CONFLICTING_DISPOSITION_RECEIPTS');
  if(review)return {...hold('QL449_DISPOSITION_REVIEW_ONLY_INCIDENT_REMAINS_OPEN'),
   state:'QL449_DURABLE_HISTORICAL_OFF_DISPOSITION_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,dispositionReceiptDigest:review.recordDigest};
  if(exception)return {...hold('QL449_SIGNED_OFF_REATTESTATION_EXCEPTION_OPEN'),
   state:'QL449_DURABLE_OFF_REATTESTATION_EXCEPTION_ESCALATED',
   pendingReceiptDigest:p.recordDigest,dispositionReceiptDigest:exception.recordDigest};
  if(p)return {...hold('QL449_PENDING_MANUAL_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL449_NO_PRIVATE_DISPOSITION_RECEIPT');
 }catch{return hold('QL449_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql448SummaryDigest','ql448ReceiptDigest',
 'ql448HorizonDigest','incidentStatus','observedAt'];
const anchorFields=['schema','incidentId','ceremonyId','challengeNonce','ql448ReceiptDigest',
 'sourceDigest','anchorId','anchorSequence','anchorDisposition','anchoredAt'];
const hostFields=['schema','incidentId','ceremonyId','challengeNonce','originalHostId',
 'ql448ReceiptDigest','anchorDigest','receiverState','isolationLock',
 'leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const observerFields=['schema','incidentId','ceremonyId','challengeNonce','ql448ReceiptDigest',
 'anchorDigest','signedHostDigest','receiverState','isolationConfirmed',
 'observerSequence','observedAt'];
const masterFields=['schema','incidentId','ceremonyId','masterId','ql448ReceiptDigest',
 'anchoredOffDigest','classification','dispositionDecision','incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','ceremonyId','sourceOwnerId','masterOwnerId',
 'ql448ReceiptDigest','anchoredOffDigest','masterReportsDigest','classification',
 'dispositionDecision','incidentStatus','reviewedAt'];

/** QL-449 only records independently signed historical off re-attestation.
 * Valid source pins and physical observations must be obtained externally. */
export async function runQl449AnchoredDisposition({
 ql448Summary,ql448Ledger,dispositionLedger,ceremonyId,challengeNonce,
 originalCommsSourceProvider,independentAnchorProvider,originalHostProvider,
 independentObserverProvider,threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof dispositionLedger?.read!=='function'||
  typeof dispositionLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl448ClosureSource!=='function'||
  typeof independentAnchorProvider?.readSignedExternalAnchor!=='function'||
  typeof originalHostProvider?.readSignedFreshOffAttestation!=='function'||
  typeof independentObserverProvider?.readSignedFreshOffObservation!=='function'||
  typeof threeMasterProvider?.readSignedDispositionVotes!=='function')
  return hold('QL449_EXTERNAL_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl448CustodyVerified||!opts.separateOwnerRolesVerified||
  !opts.independentSignerPinsVerified||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(ceremonyId??'')||!ID.test(challengeNonce??'')||
  challengeNonce===ql448Summary?.challengeNonce||
  !validPrior(ql448Summary,ql448Ledger))
  return hold('QL449_EXACT_QL448_CORRECTIVE_PRECONDITIONS_AND_NEW_CHALLENGE_REQUIRED');
 const s=ql448Summary,id=s.originalIncidentId,prior=s.reviewReceiptDigest;
 const pins=[opts.commsSourcePin,opts.externalAnchorPin,opts.originalHostPin,
  opts.independentObserverPin,opts.sourceOwnerPin,opts.masterOwnerPin,
  ...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==pins.length)
  return hold('QL449_DISTINCT_INDEPENDENT_SIGNER_PINS_REQUIRED');
 try{
  if(dispositionLedger.read('pending',id)||dispositionLedger.read('review',id)||
   dispositionLedger.read('exception',id))
   return hold('QL449_ONE_USE_DISPOSITION_ALREADY_ATTEMPTED');
 }catch{return hold('QL449_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=dispositionLedger.claimOnce('pending',id,hash({
   ql448SummaryDigest:hash(s),prior,ceremonyId,challengeNonce}));
  if(dispositionLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('pending');
 }catch{return hold('QL449_PENDING_CUSTODY_COMMIT_FAILED');}
 let source,anchor,host,observer;
 try{source=await originalCommsSourceProvider.readSignedQl448ClosureSource({
  incidentId:id,prior,ceremonyId,challengeNonce,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL449_ORIGINAL_QL448_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql449.original-ql448-open-incident-source.v1'||
  p.incidentId!==id||p.ql448SummaryDigest!==hash(s)||
  p.ql448ReceiptDigest!==prior||p.ql448HorizonDigest!==s.longHorizonDigest||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.observedAt,opts.nowMs))
  return hold('QL449_SIGNED_ORIGINAL_SOURCE_MISMATCH');
 try{anchor=await independentAnchorProvider.readSignedExternalAnchor({
  incidentId:id,prior,ceremonyId,challengeNonce,sourceDigest:hash(p)});}
 catch{return hold('QL449_INDEPENDENT_EXTERNAL_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.externalAnchorPin)||
  a.schema!=='rosevear.ql449.independently-anchored-corrective-closure.v1'||
  a.incidentId!==id||a.ceremonyId!==ceremonyId||
  a.challengeNonce!==challengeNonce||a.ql448ReceiptDigest!==prior||
  a.sourceDigest!==hash(p)||!ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<1||
  a.anchorDisposition!=='CORRECTIVE_CLOSURE_EVIDENCE_ONLY_NOT_FINAL'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<at(p.observedAt))
  return hold('QL449_EXTERNAL_ANCHOR_SIGNED_RECEIPT_INVALID');
 try{host=await originalHostProvider.readSignedFreshOffAttestation({
  incidentId:id,prior,ceremonyId,challengeNonce,anchorDigest:hash(a)});}
 catch{return hold('QL449_ORIGINAL_HOST_FRESH_OFF_UNAVAILABLE');}
 const h=host?.payload;
 if(!signed(host,hostFields,opts.originalHostPin)||
  h.schema!=='rosevear.ql449.original-host-fresh-off-reattestation.v1'||
  h.incidentId!==id||h.ceremonyId!==ceremonyId||
  h.challengeNonce!==challengeNonce||h.originalHostId!=='DESKTOP-AE894KC'||
  h.ql448ReceiptDigest!==prior||h.anchorDigest!==hash(a)||
  !['OFF','ON'].includes(h.receiverState)||
  typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
  typeof h.watchdogArmed!=='boolean'||
  !Number.isSafeInteger(h.hostSequence)||h.hostSequence<=a.anchorSequence||
  !fresh(h.observedAt,opts.nowMs)||at(h.observedAt)<at(a.anchoredAt))
  return hold('QL449_SIGNED_ORIGINAL_HOST_OFF_REATTESTATION_INVALID');
 try{observer=await independentObserverProvider.readSignedFreshOffObservation({
  incidentId:id,prior,ceremonyId,challengeNonce,anchorDigest:hash(a),
  signedHostDigest:hash(h)});}
 catch{return hold('QL449_INDEPENDENT_FRESH_OFF_OBSERVER_UNAVAILABLE');}
 const w=observer?.payload;
 if(!signed(observer,observerFields,opts.independentObserverPin)||
  w.schema!=='rosevear.ql449.independent-fresh-off-observer.v1'||
  w.incidentId!==id||w.ceremonyId!==ceremonyId||
  w.challengeNonce!==challengeNonce||w.ql448ReceiptDigest!==prior||
  w.anchorDigest!==hash(a)||w.signedHostDigest!==hash(h)||
  !['OFF','ON'].includes(w.receiverState)||
  typeof w.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(w.observerSequence)||w.observerSequence<=h.hostSequence||
  !fresh(w.observedAt,opts.nowMs)||at(w.observedAt)<at(h.observedAt))
  return hold('QL449_INDEPENDENT_SIGNED_FRESH_OFF_INVALID');
 const safe=h.receiverState==='OFF'&&w.receiverState==='OFF'&&
  h.isolationLock&&h.leaseRevoked&&h.watchdogArmed&&w.isolationConfirmed;
 const classification=safe?'SIGNED_ANCHORED_HISTORICAL_OFF_REVIEW_ONLY':
  'SIGNED_OFF_REATTESTATION_EXCEPTION_INCIDENT_OPEN';
 const decision=safe?'ADMIT_EVIDENCE_ONLY_KEEP_INCIDENT_OPEN_HOLD':
  'ESCALATE_OFF_EXCEPTION_KEEP_INCIDENT_OPEN_HOLD';
 const anchoredOffDigest=hash({ql448SummaryDigest:hash(s),ceremonyId,challengeNonce,
  sourceDigest:hash(p),anchorDigest:hash(a),
  hostDigest:hash(h),observerDigest:hash(w),classification});
 let votes;
 try{votes=await threeMasterProvider.readSignedDispositionVotes({
  incidentId:id,prior,ceremonyId,anchoredOffDigest,classification,decision});}
 catch{return hold('QL449_THREE_MASTER_DISPOSITION_REVIEW_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL449_THREE_DISTINCT_MASTER_DISPOSITIONS_REQUIRED');
 const seen=new Set(),accepted=[];
 for(const envelope of votes){
  const m=envelope?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(envelope,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql449.three-master-anchored-disposition.v1'||
   m.incidentId!==id||m.ceremonyId!==ceremonyId||
   m.ql448ReceiptDigest!==prior||m.anchoredOffDigest!==anchoredOffDigest||
   m.classification!==classification||m.dispositionDecision!==decision||
   m.incidentStatus!=='OPEN_HOLD'||!fresh(m.reviewedAt,opts.nowMs)||
   at(m.reviewedAt)<at(w.observedAt))
   return hold('QL449_THREE_MASTER_SIGNED_DISPOSITION_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 const reportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql449.dual-owner-incident-disposition.v1'||
  f.incidentId!==id||f.ceremonyId!==ceremonyId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql448ReceiptDigest!==prior||
  f.anchoredOffDigest!==anchoredOffDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.dispositionDecision!==decision||f.incidentStatus!=='OPEN_HOLD'||
  !fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(m=>at(m.reviewedAt)))||
  !validSig(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !validSig(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL449_DUAL_OWNER_SIGNED_DISPOSITION_VETO');
 try{
  if(!validPrior(s,ql448Ledger)||
   dispositionLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   dispositionLedger.read('review',id)||dispositionLedger.read('exception',id)||
   !fresh(w.observedAt,opts.nowMs)||!fresh(f.reviewedAt,opts.nowMs))
   return hold('QL449_PROTECTED_CUSTODY_DRIFT_OR_EXPIRED_EVIDENCE');
  const kind=safe?'review':'exception';
  const receipt=dispositionLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,anchoredOffDigest,reportsDigest,
   ownerDigest:hash(f),classification,decision,incidentStatus:'OPEN_HOLD'}));
  if(dispositionLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(safe?'ANCHORED_HISTORICAL_OFF_ONLY_INCIDENT_REMAINS_OPEN':
   'SIGNED_ORIGINAL_HOST_OFF_EXCEPTION_INCIDENT_REMAINS_OPEN'),
   state:safe?'DURABLE_QL449_ANCHORED_OFF_DISPOSITION_REVIEW_ONLY':
    'DURABLE_QL449_SIGNED_OFF_REATTESTATION_EXCEPTION_OPEN',
   originalIncidentId:id,ceremonyId,challengeNonce,classification,
   dispositionDecision:decision,closureAuthorized:false,masterCount:3,
   anchoredOffDigest,masterReportsDigest:reportsDigest,
   pendingReceiptDigest:pending.recordDigest,
   dispositionReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_HISTORICAL_DISPOSITION_ONLY_OPEN_HOLD',
   permittedNextAction:safe?
    'SEPARATE_EXPLICIT_ORIGINAL_HOST_CLOSURE_CEREMONY_STILL_REQUIRED':
    'SUPERVISED_REMEDIATION_AND_FRESH_INDEPENDENT_OFF_REQUIRED'};
 }catch{return hold('QL449_DURABLE_DISPOSITION_COMMIT_FAILED');}
}
