import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-450 historical signed continuity only. Does not close incidents,
 * infer current physical OFF or authorize reactivation. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HORIZONS=[{name:'SHORT',minimum:0},{name:'MEDIUM',minimum:10000},
 {name:'LONG',minimum:30000}];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[0-9a-f]{64}$/;
const SCHEMA='rosevear.ql450.post-disposition-off-stability-boundary.v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(o,fields)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(f=>Object.hasOwn(o,f));
const timestamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(timestamp(x))&&
 timestamp(x)<=now&&now-timestamp(x)<=60000;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,closureAuthorized:false,
 physicalReceiverCurrentlyOff:false,incidentStatus:'OPEN',
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,ownerAcceptance:'HOLD',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function verifySig(payload,signature,pin){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||
   typeof pin!=='string'||pin.length>512)return false;
  const spki=Buffer.from(pin,'base64');
  if(spki.toString('base64')!==pin)return false;
  const key=createPublicKey({key:spki,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
const signed=(envelope,fields,pin)=>exact(envelope,['payload','signature'])&&
 exact(envelope.payload,fields)&&verifySig(envelope.payload,envelope.signature,pin);

export function openQl450StabilityLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL450_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const dir=lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||(dir.mode&0o077))
  throw Error('QL450_UNSAFE_LEDGER_DIRECTORY');
 const filename=(kind,id)=>{
  if(!['pending','stable','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL450_INVALID_RECEIPT_KEY');
  return join(root,'ql450-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const file=filename(kind,id);let st;
  try{st=lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||st.size>4096)
   throw Error('QL450_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(file,'utf8'));}
  catch{throw Error('QL450_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL450_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))
   throw Error('QL450_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};
  r.recordDigest=hash(r);
  const fd=openSync(filename(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('QL450_RECEIPT_READBACK_MISMATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl449(s,ledger){
 if(!s||s.state!=='DURABLE_QL449_ANCHORED_OFF_DISPOSITION_REVIEW_ONLY'||
  s.classification!=='SIGNED_ANCHORED_HISTORICAL_OFF_REVIEW_ONLY'||
  s.dispositionDecision!=='ADMIT_EVIDENCE_ONLY_KEEP_INCIDENT_OPEN_HOLD'||
  s.connection!=='HOLD'||s.activationAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.closureAuthorized!==false||
  s.incidentStatus!=='OPEN'||s.masterCount!==3||
  s.ownerAcceptance!=='DUAL_SIGNED_HISTORICAL_DISPOSITION_ONLY_OPEN_HOLD'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.ceremonyId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.anchoredOffDigest,s.pendingReceiptDigest,s.dispositionReceiptDigest,
   s.masterReportsDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read('review',id)?.recordDigest===s.dispositionReceiptDigest&&
   !ledger.read('exception',id);
 }catch{return false;}
}
export function readQl450Stability(ledger,id){
 try{
  const p=ledger.read('pending',id),stable=ledger.read('stable',id),
   exception=ledger.read('exception',id);
  if((stable||exception)&&(!p||(stable&&exception)))
   return hold('QL450_CONFLICTING_STABILITY_RECEIPTS');
  if(stable)return {...hold('QL450_HISTORICAL_STABILITY_ONLY_CLOSURE_DENIED'),
   state:'QL450_DURABLE_HISTORICAL_OFF_STABILITY_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,stabilityReceiptDigest:stable.recordDigest};
  if(exception)return {...hold('QL450_SIGNED_RECURRENCE_OR_BOUNDARY_EXCEPTION_OPEN'),
   state:'QL450_DURABLE_OFF_RECURRENCE_EXCEPTION_ESCALATED',
   pendingReceiptDigest:p.recordDigest,exceptionReceiptDigest:exception.recordDigest};
  if(p)return {...hold('QL450_PENDING_SUPERVISED_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL450_NO_PROTECTED_STABILITY_RECEIPT');
 }catch{return hold('QL450_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql449SummaryDigest','ql449ReceiptDigest',
 'ql449AnchoredOffDigest','incidentStatus','observedAt'];
const anchorFields=['schema','incidentId','reviewId','challengeNonce','ql449ReceiptDigest',
 'sourceDigest','anchorId','anchorSequence','anchorStatus','observedAt'];
const hostFields=['schema','incidentId','reviewId','challengeNonce','horizon','sampleIndex',
 'originalHostId','ql449ReceiptDigest','independentAnchorDigest','previousDigest',
 'receiverState','isolationLock','leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const observerFields=['schema','incidentId','reviewId','challengeNonce','horizon','sampleIndex',
 'ql449ReceiptDigest','independentAnchorDigest','signedHostDigest','previousDigest',
 'receiverState','isolationConfirmed','observerSequence','observedAt'];
const boundaryFields=['schema','incidentId','reviewId','ql449ReceiptDigest',
 'stabilityDigest','classification','closureAuthorized','activationAuthorized',
 'physicalReceiverCurrentlyOff','incidentStatus','authorityBoundary','attestedAt'];
const masterFields=['schema','incidentId','reviewId','masterId','ql449ReceiptDigest',
 'stabilityDigest','boundaryDigest','classification','recurrenceDecision',
 'incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','reviewId','sourceOwnerId','masterOwnerId',
 'ql449ReceiptDigest','stabilityDigest','boundaryDigest','masterReportsDigest',
 'classification','recurrenceDecision','incidentStatus','reviewedAt'];

/** Original host, independent observer, independent authority boundary,
 * three Master signers and two owners: no source can authorize closure. */
export async function runQl450StabilityReview({
 ql449Summary,ql449Ledger,stabilityLedger,reviewId,challengeNonce,
 originalCommsSourceProvider,independentAnchorProvider,originalHostProvider,
 independentObserverProvider,independentBoundaryProvider,threeMasterProvider,
 finalOwnerDecision
},opts={}){
 if(typeof stabilityLedger?.read!=='function'||typeof stabilityLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl449Disposition!=='function'||
  typeof independentAnchorProvider?.readSignedQl449AnchorReadback!=='function'||
  typeof originalHostProvider?.readSignedOffStabilitySamples!=='function'||
  typeof independentObserverProvider?.readSignedOffStabilityWitnesses!=='function'||
  typeof independentBoundaryProvider?.readSignedClosureAuthorityBoundary!=='function'||
  typeof threeMasterProvider?.readSignedRecurrencePreventionVotes!=='function')
  return hold('QL450_INDEPENDENT_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl449CustodyVerified||!opts.separateOwnerRolesVerified||
  !opts.independentSignerPinsVerified||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(reviewId??'')||!ID.test(challengeNonce??'')||
  challengeNonce===ql449Summary?.challengeNonce||
  !validQl449(ql449Summary,ql449Ledger))
  return hold('QL450_EXACT_OPEN_QL449_DISPOSITION_AND_FRESH_CHALLENGE_REQUIRED');
 const s=ql449Summary,id=s.originalIncidentId,prior=s.dispositionReceiptDigest;
 const pins=[opts.commsSourcePin,opts.independentAnchorPin,opts.originalHostPin,
  opts.independentObserverPin,opts.boundaryAuthorityPin,opts.sourceOwnerPin,
  opts.masterOwnerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==pins.length)
  return hold('QL450_ALL_TEN_DISTINCT_PINNED_SIGNERS_REQUIRED');
 try{
  if(stabilityLedger.read('pending',id)||stabilityLedger.read('stable',id)||
   stabilityLedger.read('exception',id))
   return hold('QL450_ONE_USE_STABILITY_REVIEW_ALREADY_ATTEMPTED');
 }catch{return hold('QL450_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=stabilityLedger.claimOnce('pending',id,hash({
   ql449SummaryDigest:hash(s),prior,reviewId,challengeNonce}));
  if(stabilityLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL450_PENDING_DURABLE_CLAIM_FAILED');}
 let source,anchor,hosts,witnesses;
 try{source=await originalCommsSourceProvider.readSignedQl449Disposition({
  incidentId:id,prior,reviewId,challengeNonce,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL450_ORIGINAL_QL449_DISPOSITION_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql450.original-ql449-source.v1'||
  p.incidentId!==id||p.ql449SummaryDigest!==hash(s)||
  p.ql449ReceiptDigest!==prior||p.ql449AnchoredOffDigest!==s.anchoredOffDigest||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.observedAt,opts.nowMs))
  return hold('QL450_SIGNED_ORIGINAL_DISPOSITION_SOURCE_INVALID');
 try{anchor=await independentAnchorProvider.readSignedQl449AnchorReadback({
  incidentId:id,prior,reviewId,challengeNonce,sourceDigest:hash(p)});}
 catch{return hold('QL450_INDEPENDENT_Q449_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.independentAnchorPin)||
  a.schema!=='rosevear.ql450.independent-ql449-anchor-readback.v1'||
  a.incidentId!==id||a.reviewId!==reviewId||
  a.challengeNonce!==challengeNonce||a.ql449ReceiptDigest!==prior||
  a.sourceDigest!==hash(p)||!ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<1||
  a.anchorStatus!=='ANCHORED_HISTORY_ONLY_NO_CLOSURE'||
  !fresh(a.observedAt,opts.nowMs)||timestamp(a.observedAt)<timestamp(p.observedAt))
  return hold('QL450_INDEPENDENT_ANCHOR_SIGNED_MISMATCH');
 try{hosts=await originalHostProvider.readSignedOffStabilitySamples({
  incidentId:id,prior,reviewId,challengeNonce,anchorDigest:hash(a)});}
 catch{return hold('QL450_ORIGINAL_HOST_SAMPLES_UNAVAILABLE');}
 try{witnesses=await independentObserverProvider.readSignedOffStabilityWitnesses({
  incidentId:id,prior,reviewId,challengeNonce,anchorDigest:hash(a)});}
 catch{return hold('QL450_INDEPENDENT_OFF_WITNESSES_UNAVAILABLE');}
 if(!Array.isArray(hosts)||hosts.length!==3||
  !Array.isArray(witnesses)||witnesses.length!==3)
  return hold('QL450_THREE_SEPARATE_SIGNED_HORIZONS_REQUIRED');
 let previousDigest=hash(a),previousSeq=a.anchorSequence,
  previousTime=timestamp(a.observedAt),firstTime=null,safe=true;
 for(let i=0;i<3;i++){
  const horizon=HORIZONS[i],he=hosts[i],we=witnesses[i],
   h=he?.payload,w=we?.payload;
  if(!signed(he,hostFields,opts.originalHostPin)||
   h.schema!=='rosevear.ql450.original-host-off-stability.v1'||
   h.incidentId!==id||h.reviewId!==reviewId||
   h.challengeNonce!==challengeNonce||h.horizon!==horizon.name||
   h.sampleIndex!==i+1||h.originalHostId!=='DESKTOP-AE894KC'||
   h.ql449ReceiptDigest!==prior||h.independentAnchorDigest!==hash(a)||
   h.previousDigest!==previousDigest||!['OFF','ON'].includes(h.receiverState)||
   typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
   typeof h.watchdogArmed!=='boolean'||
   !Number.isSafeInteger(h.hostSequence)||h.hostSequence<=previousSeq||
   !fresh(h.observedAt,opts.nowMs)||timestamp(h.observedAt)<previousTime||
   (i>0&&timestamp(h.observedAt)-firstTime<horizon.minimum))
   return hold('QL450_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
  if(i===0)firstTime=timestamp(h.observedAt);
  if(!signed(we,observerFields,opts.independentObserverPin)||
   w.schema!=='rosevear.ql450.independent-off-stability-witness.v1'||
   w.incidentId!==id||w.reviewId!==reviewId||
   w.challengeNonce!==challengeNonce||w.horizon!==horizon.name||
   w.sampleIndex!==i+1||w.ql449ReceiptDigest!==prior||
   w.independentAnchorDigest!==hash(a)||
   w.signedHostDigest!==hash(h)||w.previousDigest!==previousDigest||
   !['OFF','ON'].includes(w.receiverState)||
   typeof w.isolationConfirmed!=='boolean'||
   !Number.isSafeInteger(w.observerSequence)||w.observerSequence<=h.hostSequence||
   !fresh(w.observedAt,opts.nowMs)||
   timestamp(w.observedAt)<timestamp(h.observedAt))
   return hold('QL450_INDEPENDENT_SIGNED_WITNESS_HORIZON_INVALID');
  safe &&=h.receiverState==='OFF'&&w.receiverState==='OFF'&&
   h.isolationLock&&h.leaseRevoked&&h.watchdogArmed&&w.isolationConfirmed;
  previousDigest=hash(w);previousSeq=w.observerSequence;
  previousTime=timestamp(w.observedAt);
 }
 const classification=safe?'SIGNED_HISTORICAL_POST_DISPOSITION_OFF_STABLE_OPEN':
  'SIGNED_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN';
 const recurrenceDecision=safe?'HISTORICAL_STABILITY_KEEP_INCIDENT_OPEN_HOLD':
  'ESCALATE_SIGNED_RECURRENCE_KEEP_INCIDENT_OPEN_HOLD';
 const stabilityDigest=hash({ql449SummaryDigest:hash(s),reviewId,challengeNonce,
  sourceDigest:hash(p),anchorDigest:hash(a),
  hostDigests:hosts.map(e=>hash(e.payload)),
  witnessDigests:witnesses.map(e=>hash(e.payload)),classification});
 let boundary;
 try{boundary=await independentBoundaryProvider.readSignedClosureAuthorityBoundary({
  incidentId:id,prior,reviewId,stabilityDigest,classification,recurrenceDecision});}
 catch{return hold('QL450_INDEPENDENT_CLOSURE_BOUNDARY_UNAVAILABLE');}
 const b=boundary?.payload;
 if(!signed(boundary,boundaryFields,opts.boundaryAuthorityPin)||
  b.schema!=='rosevear.ql450.independent-closure-boundary.v1'||
  b.incidentId!==id||b.reviewId!==reviewId||
  b.ql449ReceiptDigest!==prior||b.stabilityDigest!==stabilityDigest||
  b.classification!==classification||b.closureAuthorized!==false||
  b.activationAuthorized!==false||b.physicalReceiverCurrentlyOff!==false||
  b.incidentStatus!=='OPEN_HOLD'||
  b.authorityBoundary!=='SEPARATE_OWNER_CEREMONY_REQUIRED_NO_AUTOMATIC_CLOSURE'||
  !fresh(b.attestedAt,opts.nowMs)||
  timestamp(b.attestedAt)<previousTime)
  return hold('QL450_INDEPENDENT_BOUNDARY_AUTHORITY_VETO');
 const boundaryDigest=hash(b);let votes;
 try{votes=await threeMasterProvider.readSignedRecurrencePreventionVotes({
  incidentId:id,prior,reviewId,stabilityDigest,boundaryDigest,
  classification,recurrenceDecision});}
 catch{return hold('QL450_THREE_MASTER_RECURRENCE_VOTES_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL450_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 const seen=new Set(),accepted=[];
 for(const envelope of votes){
  const v=envelope?.payload;
  if(!MASTERS.includes(v?.masterId)||seen.has(v.masterId)||
   !signed(envelope,masterFields,opts.masterPins[v.masterId])||
   v.schema!=='rosevear.ql450.three-master-recurrence-prevention.v1'||
   v.incidentId!==id||v.reviewId!==reviewId||
   v.ql449ReceiptDigest!==prior||v.stabilityDigest!==stabilityDigest||
   v.boundaryDigest!==boundaryDigest||v.classification!==classification||
   v.recurrenceDecision!==recurrenceDecision||v.incidentStatus!=='OPEN_HOLD'||
   !fresh(v.reviewedAt,opts.nowMs)||timestamp(v.reviewedAt)<timestamp(b.attestedAt))
   return hold('QL450_THREE_MASTER_RECURRENCE_VETO');
  seen.add(v.masterId);accepted.push(v);
 }
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 const masterReportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql450.dual-owner-recurrence-continuity.v1'||
  f.incidentId!==id||f.reviewId!==reviewId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||
  f.ql449ReceiptDigest!==prior||f.stabilityDigest!==stabilityDigest||
  f.boundaryDigest!==boundaryDigest||f.masterReportsDigest!==masterReportsDigest||
  f.classification!==classification||f.recurrenceDecision!==recurrenceDecision||
  f.incidentStatus!=='OPEN_HOLD'||!fresh(f.reviewedAt,opts.nowMs)||
  timestamp(f.reviewedAt)<Math.max(...accepted.map(v=>timestamp(v.reviewedAt)))||
  !verifySig(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySig(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL450_DUAL_OWNER_CONTINUITY_VETO');
 try{
  if(!validQl449(s,ql449Ledger)||
   stabilityLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   stabilityLedger.read('stable',id)||stabilityLedger.read('exception',id)||
   !fresh(witnesses[2].payload.observedAt,opts.nowMs)||
   !fresh(b.attestedAt,opts.nowMs)||!fresh(f.reviewedAt,opts.nowMs))
   return hold('QL450_PROTECTED_SOURCE_DRIFT_OR_STALE_EVIDENCE');
  const kind=safe?'stable':'exception';
  const receipt=stabilityLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,stabilityDigest,boundaryDigest,
   masterReportsDigest,ownerDigest:hash(f),classification,recurrenceDecision,
   incidentStatus:'OPEN_HOLD'}));
  if(stabilityLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(safe?'HISTORICAL_OFF_STABILITY_ONLY_CLOSURE_NOT_PERMITTED':
   'SIGNED_POST_DISPOSITION_RECURRENCE_REQUIRES_SUPERVISED_RESPONSE'),
   state:safe?'DURABLE_QL450_POST_DISPOSITION_OFF_STABLE_REVIEW_ONLY':
    'DURABLE_QL450_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN',
   originalIncidentId:id,reviewId,challengeNonce,classification,recurrenceDecision,
   masterCount:3,stabilityDigest,boundaryDigest,masterReportsDigest,
   pendingReceiptDigest:pending.recordDigest,
   ...{[safe?'stabilityReceiptDigest':'exceptionReceiptDigest']:receipt.recordDigest},
   ownerAcceptance:'DUAL_SIGNED_RECURRENCE_CONTINUITY_OPEN_HOLD',
   closureAuthorityBoundary:'SEPARATE_SUPERVISED_CLOSURE_CEREMONY_REQUIRED',
   permittedNextAction:safe?'FRESH_INDEPENDENT_OFF_REQUIRED_FOR_SEPARATE_CLOSURE':
    'SUPERVISED_ISOLATION_REMEDIATION_REQUIRED'};
 }catch{return hold('QL450_DURABLE_STABILITY_RECEIPT_COMMIT_FAILED');}
}
