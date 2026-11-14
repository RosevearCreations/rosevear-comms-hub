import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-451: signed evidence intake only. Never authorizes receiver activation,
 * final incident closure, or a claim that a receiver is physically OFF now. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const HORIZONS=[{name:'SHORT',minimum:0},{name:'MEDIUM',minimum:10000},
 {name:'LONG',minimum:30000}];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[0-9a-f]{64}$/,SCHEMA='rosevear.ql451.anchored-response-off-renewal.v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now)=>Number.isSafeInteger(now)&&Number.isFinite(at(x))&&
 at(x)<=now&&now-at(x)<=60000;
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
const signed=(envelope,keys,pin)=>exact(envelope,['payload','signature'])&&
 exact(envelope.payload,keys)&&verifySig(envelope.payload,envelope.signature,pin);

export function openQl451ResponseLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL451_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const dir=lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||(dir.mode&0o077))
  throw Error('QL451_UNSAFE_LEDGER_DIRECTORY');
 const filename=(kind,id)=>{
  if(!['pending','renewed','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL451_INVALID_RECEIPT_KEY');
  return join(root,'ql451-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const file=filename(kind,id);let st;
  try{st=lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||st.size>4096)
   throw Error('QL451_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(file,'utf8'));}
  catch{throw Error('QL451_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL451_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL451_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};
  r.recordDigest=hash(r);
  const fd=openSync(filename(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('QL451_DURABLE_READBACK_MISMATCH');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl450(s,ledger){
 const exception=s?.state==='DURABLE_QL450_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN';
 const stable=s?.state==='DURABLE_QL450_POST_DISPOSITION_OFF_STABLE_REVIEW_ONLY';
 if((!exception&&!stable)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
  s.activationAuthorized!==false||s.closureAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
  s.ownerAcceptance!=='DUAL_SIGNED_RECURRENCE_CONTINUITY_OPEN_HOLD'||
  s.closureAuthorityBoundary!=='SEPARATE_SUPERVISED_CLOSURE_CEREMONY_REQUIRED'||
  s.classification!==(exception?'SIGNED_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN':
   'SIGNED_HISTORICAL_POST_DISPOSITION_OFF_STABLE_OPEN')||
  s.recurrenceDecision!==(exception?'ESCALATE_SIGNED_RECURRENCE_KEEP_INCIDENT_OPEN_HOLD':
   'HISTORICAL_STABILITY_KEEP_INCIDENT_OPEN_HOLD')||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.reviewId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.pendingReceiptDigest,s.stabilityDigest,s.boundaryDigest,s.masterReportsDigest,
   exception?s.exceptionReceiptDigest:s.stabilityReceiptDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(exception?'exception':'stable',id)?.recordDigest===
    (exception?s.exceptionReceiptDigest:s.stabilityReceiptDigest)&&
   !ledger.read(exception?'stable':'exception',id);
 }catch{return false;}
}
export function readQl451Response(ledger,id){
 try{
  const p=ledger.read('pending',id),good=ledger.read('renewed',id),
   bad=ledger.read('exception',id);
  if((good||bad)&&(!p||(good&&bad)))return hold('QL451_CONFLICTING_RESPONSE_CUSTODY');
  if(good)return {...hold('QL451_HISTORICAL_OFF_RENEWAL_ONLY_NOT_INCIDENT_CLOSURE'),
   state:'QL451_DURABLE_HISTORICAL_RESPONSE_RENEWAL_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,responseReceiptDigest:good.recordDigest};
  if(bad)return {...hold('QL451_RENEWED_RECURRENCE_RESPONSE_EXCEPTION_OPEN'),
   state:'QL451_DURABLE_RESPONSE_RENEWAL_EXCEPTION_ESCALATED',
   pendingReceiptDigest:p.recordDigest,responseReceiptDigest:bad.recordDigest};
  if(p)return {...hold('QL451_PENDING_MANUAL_OWNER_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL451_NO_PROTECTED_RESPONSE_RECEIPT');
 }catch{return hold('QL451_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql450SummaryDigest','ql450ReceiptDigest',
 'ql450StabilityDigest','priorClassification','incidentStatus','observedAt'];
const responseFields=['schema','incidentId','renewalId','challengeNonce',
 'ql450ReceiptDigest','sourceDigest','remediationDisposition','isolationLockVerified',
 'leaseRevokedVerified','watchdogArmedVerified','respondedAt'];
const anchorFields=['schema','incidentId','renewalId','challengeNonce',
 'ql450ReceiptDigest','signedResponseDigest','sourceDigest','anchorId',
 'anchorSequence','anchorStatus','anchoredAt'];
const hostFields=['schema','incidentId','renewalId','challengeNonce',
 'horizon','sampleIndex','originalHostId','ql450ReceiptDigest',
 'responseDigest','anchorDigest','previousDigest','receiverState',
 'isolationLock','leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const observerFields=['schema','incidentId','renewalId','challengeNonce',
 'horizon','sampleIndex','ql450ReceiptDigest','anchorDigest','signedHostDigest',
 'previousDigest','receiverState','isolationConfirmed','observerSequence','observedAt'];
const boundaryFields=['schema','incidentId','renewalId','ql450ReceiptDigest',
 'renewalDigest','classification','closureAuthorized','activationAuthorized',
 'physicalReceiverCurrentlyOff','incidentStatus','authorityBoundary','attestedAt'];
const masterFields=['schema','incidentId','renewalId','masterId',
 'ql450ReceiptDigest','renewalDigest','boundaryDigest',
 'classification','reassessmentDecision','incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','renewalId','sourceOwnerId','masterOwnerId',
 'ql450ReceiptDigest','renewalDigest','boundaryDigest','masterReportsDigest',
 'classification','reassessmentDecision','incidentStatus','reviewedAt'];

/** A signed recurrence response may be complete, but its historical OFF
 * renewal cannot close a case or establish live physical receiver state. */
export async function runQl451ResponseRenewal({
 ql450Summary,ql450Ledger,responseLedger,renewalId,challengeNonce,
 originalCommsSourceProvider,independentResponseProvider,independentAnchorProvider,
 originalHostProvider,independentObserverProvider,independentBoundaryProvider,
 threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof responseLedger?.read!=='function'||typeof responseLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl450Case!=='function'||
  typeof independentResponseProvider?.readSignedRecurrenceResponse!=='function'||
  typeof independentAnchorProvider?.readSignedResponseAnchor!=='function'||
  typeof originalHostProvider?.readSignedOffRenewalSamples!=='function'||
  typeof independentObserverProvider?.readSignedOffRenewalWitnesses!=='function'||
  typeof independentBoundaryProvider?.readSignedClosureReassessmentBoundary!=='function'||
  typeof threeMasterProvider?.readSignedReassessmentVotes!=='function')
  return hold('QL451_EIGHT_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl450CustodyVerified||!opts.separateOwnerRolesVerified||
  !opts.independentSignerPinsVerified||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(renewalId??'')||!ID.test(challengeNonce??'')||
  challengeNonce===ql450Summary?.challengeNonce||
  !validQl450(ql450Summary,ql450Ledger))
  return hold('QL451_EXACT_QL450_OPEN_CASE_AND_NEW_PROTECTED_CHALLENGE_REQUIRED');
 const s=ql450Summary,id=s.originalIncidentId;
 const priorException=s.state==='DURABLE_QL450_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN';
 const prior=priorException?s.exceptionReceiptDigest:s.stabilityReceiptDigest;
 const pins=[opts.commsSourcePin,opts.responseOfficerPin,opts.independentAnchorPin,
  opts.originalHostPin,opts.independentObserverPin,opts.boundaryAuthorityPin,
  opts.sourceOwnerPin,opts.masterOwnerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==pins.length)
  return hold('QL451_ELEVEN_DISTINCT_PINNED_SIGNERS_REQUIRED');
 try{
  if(responseLedger.read('pending',id)||responseLedger.read('renewed',id)||
   responseLedger.read('exception',id))
   return hold('QL451_ONE_USE_RESPONSE_RENEWAL_ALREADY_ATTEMPTED');
 }catch{return hold('QL451_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=responseLedger.claimOnce('pending',id,hash({
   ql450SummaryDigest:hash(s),prior,renewalId,challengeNonce}));
  if(responseLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('pending');
 }catch{return hold('QL451_PENDING_DURABLE_CLAIM_FAILED');}
 let source,response,anchor,hosts,witnesses;
 try{source=await originalCommsSourceProvider.readSignedQl450Case({
  incidentId:id,prior,renewalId,challengeNonce,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL451_ORIGINAL_QL450_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql451.original-ql450-open-source.v1'||
  p.incidentId!==id||p.ql450SummaryDigest!==hash(s)||
  p.ql450ReceiptDigest!==prior||p.ql450StabilityDigest!==s.stabilityDigest||
  p.priorClassification!==s.classification||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.observedAt,opts.nowMs))
  return hold('QL451_ORIGINAL_SIGNED_SOURCE_INVALID');
 try{response=await independentResponseProvider.readSignedRecurrenceResponse({
  incidentId:id,prior,renewalId,challengeNonce,sourceDigest:hash(p)});}
 catch{return hold('QL451_INDEPENDENT_RESPONSE_UNAVAILABLE');}
 const r=response?.payload,dispositions=priorException?
  ['SIGNED_RESPONSE_COMPLETED_UNDER_HOLD','SIGNED_RESPONSE_UNRESOLVED_KEEP_HOLD']:
  ['NO_NEW_RECURRENCE_SIGNED_RENEWAL'];
 if(!signed(response,responseFields,opts.responseOfficerPin)||
  r.schema!=='rosevear.ql451.independent-recurrence-response.v1'||
  r.incidentId!==id||r.renewalId!==renewalId||
  r.challengeNonce!==challengeNonce||r.ql450ReceiptDigest!==prior||
  r.sourceDigest!==hash(p)||!dispositions.includes(r.remediationDisposition)||
  typeof r.isolationLockVerified!=='boolean'||
  typeof r.leaseRevokedVerified!=='boolean'||
  typeof r.watchdogArmedVerified!=='boolean'||
  !fresh(r.respondedAt,opts.nowMs)||at(r.respondedAt)<at(p.observedAt))
  return hold('QL451_SIGNED_RECURRENCE_RESPONSE_INVALID');
 try{anchor=await independentAnchorProvider.readSignedResponseAnchor({
  incidentId:id,prior,renewalId,challengeNonce,
  sourceDigest:hash(p),signedResponseDigest:hash(r)});}
 catch{return hold('QL451_INDEPENDENT_RESPONSE_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.independentAnchorPin)||
  a.schema!=='rosevear.ql451.independent-response-anchor.v1'||
  a.incidentId!==id||a.renewalId!==renewalId||
  a.challengeNonce!==challengeNonce||a.ql450ReceiptDigest!==prior||
  a.signedResponseDigest!==hash(r)||a.sourceDigest!==hash(p)||
  !ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<1||
  a.anchorStatus!=='HISTORICAL_RESPONSE_ONLY_NO_INCIDENT_CLOSURE'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<at(r.respondedAt))
  return hold('QL451_INDEPENDENT_ANCHORED_RESPONSE_INVALID');
 try{hosts=await originalHostProvider.readSignedOffRenewalSamples({
  incidentId:id,prior,renewalId,challengeNonce,
  responseDigest:hash(r),anchorDigest:hash(a)});}
 catch{return hold('QL451_ORIGINAL_HOST_RENEWAL_UNAVAILABLE');}
 try{witnesses=await independentObserverProvider.readSignedOffRenewalWitnesses({
  incidentId:id,prior,renewalId,challengeNonce,anchorDigest:hash(a)});}
 catch{return hold('QL451_INDEPENDENT_OFF_RENEWAL_UNAVAILABLE');}
 if(!Array.isArray(hosts)||hosts.length!==3||
  !Array.isArray(witnesses)||witnesses.length!==3)
  return hold('QL451_THREE_SIGNED_RENEWAL_HORIZONS_REQUIRED');
 let previousDigest=hash(a),previousSequence=a.anchorSequence,
  previousTime=at(a.anchoredAt),firstTime=null,allOff=true;
 for(let i=0;i<3;i++){
  const horizon=HORIZONS[i],he=hosts[i],we=witnesses[i],h=he?.payload,w=we?.payload;
  if(!signed(he,hostFields,opts.originalHostPin)||
   h.schema!=='rosevear.ql451.original-host-off-renewal.v1'||
   h.incidentId!==id||h.renewalId!==renewalId||
   h.challengeNonce!==challengeNonce||h.horizon!==horizon.name||
   h.sampleIndex!==i+1||h.originalHostId!=='DESKTOP-AE894KC'||
   h.ql450ReceiptDigest!==prior||h.responseDigest!==hash(r)||
   h.anchorDigest!==hash(a)||h.previousDigest!==previousDigest||
   !['OFF','ON'].includes(h.receiverState)||
   typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
   typeof h.watchdogArmed!=='boolean'||
   !Number.isSafeInteger(h.hostSequence)||h.hostSequence<=previousSequence||
   !fresh(h.observedAt,opts.nowMs)||at(h.observedAt)<previousTime||
   (i>0&&at(h.observedAt)-firstTime<horizon.minimum))
   return hold('QL451_SIGNED_ORIGINAL_HOST_HORIZON_INVALID');
  if(i===0)firstTime=at(h.observedAt);
  if(!signed(we,observerFields,opts.independentObserverPin)||
   w.schema!=='rosevear.ql451.independent-off-renewal-witness.v1'||
   w.incidentId!==id||w.renewalId!==renewalId||
   w.challengeNonce!==challengeNonce||w.horizon!==horizon.name||
   w.sampleIndex!==i+1||w.ql450ReceiptDigest!==prior||
   w.anchorDigest!==hash(a)||w.signedHostDigest!==hash(h)||
   w.previousDigest!==previousDigest||!['OFF','ON'].includes(w.receiverState)||
   typeof w.isolationConfirmed!=='boolean'||
   !Number.isSafeInteger(w.observerSequence)||
   w.observerSequence<=h.hostSequence||
   !fresh(w.observedAt,opts.nowMs)||at(w.observedAt)<at(h.observedAt))
   return hold('QL451_SIGNED_INDEPENDENT_OFF_HORIZON_INVALID');
  allOff &&=h.receiverState==='OFF'&&w.receiverState==='OFF'&&
   h.isolationLock&&h.leaseRevoked&&h.watchdogArmed&&w.isolationConfirmed;
  previousSequence=w.observerSequence;previousTime=at(w.observedAt);
  previousDigest=hash(w);
 }
 const responseComplete=r.isolationLockVerified&&r.leaseRevokedVerified&&
  r.watchdogArmedVerified&&(!priorException||
   r.remediationDisposition==='SIGNED_RESPONSE_COMPLETED_UNDER_HOLD');
 const renewed=allOff&&responseComplete;
 const classification=renewed?(priorException?
  'SIGNED_CORRECTIVE_RECURRENCE_RESPONSE_OFF_RENEWED_OPEN':
  'SIGNED_HISTORICAL_OFF_RENEWAL_CONTINUES_OPEN'):
  'SIGNED_RESPONSE_OR_OFF_RENEWAL_EXCEPTION_OPEN';
 const reassessmentDecision=renewed?
  'HISTORICAL_CLOSURE_REASSESSMENT_EVIDENCE_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_UNRESOLVED_RECURRENCE_KEEP_OPEN_HOLD';
 const renewalDigest=hash({ql450SummaryDigest:hash(s),renewalId,challengeNonce,
  originalSourceDigest:hash(p),responseDigest:hash(r),anchorDigest:hash(a),
  hostDigests:hosts.map(e=>hash(e.payload)),
  witnessDigests:witnesses.map(e=>hash(e.payload)),classification});
 let boundary;
 try{boundary=await independentBoundaryProvider.readSignedClosureReassessmentBoundary({
  incidentId:id,prior,renewalId,renewalDigest,classification,reassessmentDecision});}
 catch{return hold('QL451_INDEPENDENT_CLOSURE_BOUNDARY_UNAVAILABLE');}
 const b=boundary?.payload;
 if(!signed(boundary,boundaryFields,opts.boundaryAuthorityPin)||
  b.schema!=='rosevear.ql451.independent-closure-reassessment-boundary.v1'||
  b.incidentId!==id||b.renewalId!==renewalId||
  b.ql450ReceiptDigest!==prior||b.renewalDigest!==renewalDigest||
  b.classification!==classification||b.closureAuthorized!==false||
  b.activationAuthorized!==false||b.physicalReceiverCurrentlyOff!==false||
  b.incidentStatus!=='OPEN_HOLD'||
  b.authorityBoundary!=='OWNER_GATED_REASSESSMENT_ONLY_SEPARATE_CLOSURE_CEREMONY'||
  !fresh(b.attestedAt,opts.nowMs)||at(b.attestedAt)<previousTime)
  return hold('QL451_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
 const boundaryDigest=hash(b);let votes;
 try{votes=await threeMasterProvider.readSignedReassessmentVotes({
  incidentId:id,prior,renewalId,renewalDigest,boundaryDigest,
  classification,reassessmentDecision});}
 catch{return hold('QL451_THREE_MASTER_REASSESSMENT_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL451_THREE_DISTINCT_MASTER_REASSESSMENTS_REQUIRED');
 const seen=new Set(),accepted=[];
 for(const e of votes){
  const v=e?.payload;
  if(!MASTERS.includes(v?.masterId)||seen.has(v.masterId)||
   !signed(e,masterFields,opts.masterPins[v.masterId])||
   v.schema!=='rosevear.ql451.three-master-closure-reassessment.v1'||
   v.incidentId!==id||v.renewalId!==renewalId||
   v.ql450ReceiptDigest!==prior||v.renewalDigest!==renewalDigest||
   v.boundaryDigest!==boundaryDigest||v.classification!==classification||
   v.reassessmentDecision!==reassessmentDecision||v.incidentStatus!=='OPEN_HOLD'||
   !fresh(v.reviewedAt,opts.nowMs)||at(v.reviewedAt)<at(b.attestedAt))
   return hold('QL451_THREE_MASTER_SIGNED_VETO');
  seen.add(v.masterId);accepted.push(v);
 }
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 const reportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql451.dual-owner-closure-reassessment.v1'||
  f.incidentId!==id||f.renewalId!==renewalId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql450ReceiptDigest!==prior||
  f.renewalDigest!==renewalDigest||f.boundaryDigest!==boundaryDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.reassessmentDecision!==reassessmentDecision||f.incidentStatus!=='OPEN_HOLD'||
  !fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(v=>at(v.reviewedAt)))||
  !verifySig(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySig(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL451_DUAL_OWNER_REASSESSMENT_VETO');
 try{
  if(!validQl450(s,ql450Ledger)||
   responseLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   responseLedger.read('renewed',id)||responseLedger.read('exception',id)||
   !fresh(witnesses[2].payload.observedAt,opts.nowMs)||
   !fresh(b.attestedAt,opts.nowMs)||!fresh(f.reviewedAt,opts.nowMs))
   return hold('QL451_PROTECTED_CUSTODY_DRIFT_OR_STALE_EVIDENCE');
  const kind=renewed?'renewed':'exception';
  const receipt=responseLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,responseDigest:hash(r),
   renewalDigest,boundaryDigest,reportsDigest,ownerDigest:hash(f),
   classification,reassessmentDecision,incidentStatus:'OPEN_HOLD'}));
  if(responseLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(renewed?'HISTORICAL_RENEWED_OFF_ONLY_NOT_INCIDENT_CLOSURE':
   'SIGNED_RECURRENCE_RESPONSE_OR_OFF_EXCEPTION_REQUIRES_SUPERVISED_ACTION'),
   state:renewed?'DURABLE_QL451_ANCHORED_RESPONSE_OFF_RENEWAL_REVIEW_ONLY':
    'DURABLE_QL451_RESPONSE_RECURRENCE_EXCEPTION_OPEN',
   originalIncidentId:id,renewalId,challengeNonce,classification,
   reassessmentDecision,masterCount:3,renewalDigest,boundaryDigest,reportsDigest,
   responsePreconditionsEvidenced:priorException&&renewed,
   pendingReceiptDigest:pending.recordDigest,
   responseReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_REASSESSMENT_EVIDENCE_ONLY_OPEN_HOLD',
   permittedNextAction:renewed?
    'SEPARATE_FRESH_PHYSICAL_OFF_AND_EXPLICIT_CLOSURE_CEREMONY_REQUIRED':
    'SUPERVISED_RECURRENCE_REMEDIATION_AND_FRESH_INDEPENDENT_OFF_REQUIRED'};
 }catch{return hold('QL451_DURABLE_RESPONSE_COMMIT_FAILED');}
}
