import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-452 admits signed physical OFF observations for historical outcome review.
 * Evidence freshness never means current physical OFF or grants incident closure. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[0-9a-f]{64}$/,SCHEMA='rosevear.ql452.original-host-outcome-physical-off.v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(o,fields)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now,limit=60000)=>Number.isSafeInteger(now)&&
 Number.isFinite(at(x))&&at(x)<=now&&now-at(x)<=limit;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',
 activationAuthorized:false,closureAuthorized:false,
 physicalReceiverCurrentlyOff:false,incidentStatus:'OPEN',
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,ownerAcceptance:'HOLD',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
function verifySignature(payload,signature,pin){
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
 exact(e.payload,fields)&&verifySignature(e.payload,e.signature,pin);

export function openQl452OutcomeLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL452_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const dir=lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||(dir.mode&0o077))
  throw Error('QL452_UNSAFE_PRIVATE_DIRECTORY');
 const filename=(kind,id)=>{
  if(!['pending','audited','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL452_INVALID_RECEIPT_KEY');
  return join(root,'ql452-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const file=filename(kind,id);let st;
  try{st=lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)||st.size>4096)
   throw Error('QL452_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(file,'utf8'));}
  catch{throw Error('QL452_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL452_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL452_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};
  r.recordDigest=hash(r);
  const fd=openSync(filename(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('QL452_DURABLE_READBACK_FAILED');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl451(s,ledger){
 const exception=s?.state==='DURABLE_QL451_RESPONSE_RECURRENCE_EXCEPTION_OPEN';
 const renewed=s?.state==='DURABLE_QL451_ANCHORED_RESPONSE_OFF_RENEWAL_REVIEW_ONLY';
 if((!exception&&!renewed)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
  s.activationAuthorized!==false||s.closureAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
  s.ownerAcceptance!=='DUAL_SIGNED_REASSESSMENT_EVIDENCE_ONLY_OPEN_HOLD'||
  s.classification!==(exception?'SIGNED_RESPONSE_OR_OFF_RENEWAL_EXCEPTION_OPEN':
   (s.responsePreconditionsEvidenced?
    'SIGNED_CORRECTIVE_RECURRENCE_RESPONSE_OFF_RENEWED_OPEN':
    'SIGNED_HISTORICAL_OFF_RENEWAL_CONTINUES_OPEN'))||
  s.reassessmentDecision!==(exception?'ESCALATE_UNRESOLVED_RECURRENCE_KEEP_OPEN_HOLD':
   'HISTORICAL_CLOSURE_REASSESSMENT_EVIDENCE_ONLY_KEEP_OPEN_HOLD')||
  typeof s.responsePreconditionsEvidenced!=='boolean'||
  (exception&&s.responsePreconditionsEvidenced)||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.renewalId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.pendingReceiptDigest,s.responseReceiptDigest,s.renewalDigest,
   s.boundaryDigest,s.reportsDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(exception?'exception':'renewed',id)?.recordDigest===s.responseReceiptDigest&&
   !ledger.read(exception?'renewed':'exception',id);
 }catch{return false;}
}
export function readQl452Outcome(ledger,id){
 try{
  const p=ledger.read('pending',id),good=ledger.read('audited',id),
   bad=ledger.read('exception',id);
  if((good||bad)&&(!p||(good&&bad)))return hold('QL452_CONFLICTING_OUTCOME_CUSTODY');
  if(good)return {...hold('QL452_HISTORICAL_OFF_OUTCOME_ONLY_CLOSURE_DENIED'),
   state:'QL452_DURABLE_HISTORICAL_OFF_OUTCOME_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,outcomeReceiptDigest:good.recordDigest};
  if(bad)return {...hold('QL452_SIGNED_OUTCOME_OR_PHYSICAL_OFF_EXCEPTION_OPEN'),
   state:'QL452_DURABLE_PHYSICAL_OFF_EXCEPTION_ESCALATED',
   pendingReceiptDigest:p.recordDigest,outcomeReceiptDigest:bad.recordDigest};
  if(p)return {...hold('QL452_PENDING_SUPERVISED_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL452_NO_PRIVATE_OUTCOME_RECEIPT');
 }catch{return hold('QL452_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql451SummaryDigest','ql451ReceiptDigest',
 'ql451RenewalDigest','originalClassification','incidentStatus','observedAt'];
const hostFields=['schema','incidentId','auditId','challengeNonce',
 'ql451ReceiptDigest','sourceDigest','originalHostId','responseOutcome',
 'hostReceiverState','isolationLock','leaseRevoked','watchdogArmed',
 'hostSequence','reportedAt'];
const anchorFields=['schema','incidentId','auditId','challengeNonce',
 'ql451ReceiptDigest','sourceDigest','hostOutcomeDigest','anchorId',
 'anchorSequence','anchorDisposition','anchoredAt'];
const physicalFields=['schema','incidentId','auditId','challengeNonce',
 'ql451ReceiptDigest','anchorDigest','signedHostOutcomeDigest',
 'originalHostId','receiverId','sensorId','independentPhysicalReadback',
 'receiverState','isolationConfirmed','observerSequence','observedAt'];
const authorityFields=['schema','incidentId','auditId','ql451ReceiptDigest',
 'outcomeDigest','classification','incidentStatus','activationAuthorized',
 'closureAuthorized','physicalReceiverCurrentlyOff','authorityDisposition','attestedAt'];
const masterFields=['schema','incidentId','auditId','masterId',
 'ql451ReceiptDigest','outcomeDigest','authorityDigest','classification',
 'closureReviewDecision','incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','auditId','sourceOwnerId','masterOwnerId',
 'ql451ReceiptDigest','outcomeDigest','authorityDigest','masterReportsDigest',
 'classification','closureReviewDecision','incidentStatus','reviewedAt'];

/** All sources are read-only externally signed evidence. There is no control path. */
export async function runQl452OutcomeAudit({
 ql451Summary,ql451Ledger,outcomeLedger,auditId,challengeNonce,
 originalCommsSourceProvider,originalHostProvider,independentAnchorProvider,
 independentPhysicalObserverProvider,independentAuthorityProvider,
 threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof outcomeLedger?.read!=='function'||typeof outcomeLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl451OutcomeSource!=='function'||
  typeof originalHostProvider?.readSignedOriginalHostResponseOutcome!=='function'||
  typeof independentAnchorProvider?.readSignedOutcomeAnchor!=='function'||
  typeof independentPhysicalObserverProvider?.readSignedPhysicalOffReadback!=='function'||
  typeof independentAuthorityProvider?.readSignedClosureAuthorityReverification!=='function'||
  typeof threeMasterProvider?.readSignedClosureReviewVotes!=='function')
  return hold('QL452_SEVEN_SIGNED_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl451CustodyVerified||!opts.separateOwnerRolesVerified||
  !opts.independentSignerPinsVerified||!opts.independentPhysicalSensorEnrollmentVerified||
  !Number.isSafeInteger(opts.nowMs)||!ID.test(auditId??'')||
  !ID.test(challengeNonce??'')||challengeNonce===ql451Summary?.challengeNonce||
  !validQl451(ql451Summary,ql451Ledger))
  return hold('QL452_EXACT_OPEN_QL451_OUTCOME_AND_NEW_CHALLENGE_REQUIRED');
 const s=ql451Summary,id=s.originalIncidentId,prior=s.responseReceiptDigest;
 const pins=[opts.commsSourcePin,opts.originalHostPin,opts.externalAnchorPin,
  opts.independentPhysicalObserverPin,opts.independentAuthorityPin,
  opts.sourceOwnerPin,opts.masterOwnerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(x=>typeof x!=='string'||!x)||new Set(pins).size!==pins.length)
  return hold('QL452_TEN_DISTINCT_SIGNER_PINS_REQUIRED');
 try{
  if(outcomeLedger.read('pending',id)||outcomeLedger.read('audited',id)||
   outcomeLedger.read('exception',id))
   return hold('QL452_ONE_USE_AUDIT_ALREADY_ATTEMPTED');
 }catch{return hold('QL452_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=outcomeLedger.claimOnce('pending',id,hash({
   ql451SummaryDigest:hash(s),prior,auditId,challengeNonce}));
  if(outcomeLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL452_PENDING_DURABLE_CLAIM_FAILED');}
 let source,host,anchor,physical;
 try{source=await originalCommsSourceProvider.readSignedQl451OutcomeSource({
  incidentId:id,prior,auditId,challengeNonce,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL452_ORIGINAL_QL451_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql452.original-ql451-open-source.v1'||
  p.incidentId!==id||p.ql451SummaryDigest!==hash(s)||
  p.ql451ReceiptDigest!==prior||p.ql451RenewalDigest!==s.renewalDigest||
  p.originalClassification!==s.classification||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.observedAt,opts.nowMs))
  return hold('QL452_ORIGINAL_CASE_SOURCE_INVALID');
 try{host=await originalHostProvider.readSignedOriginalHostResponseOutcome({
  incidentId:id,prior,auditId,challengeNonce,sourceDigest:hash(p)});}
 catch{return hold('QL452_ORIGINAL_HOST_RESPONSE_OUTCOME_UNAVAILABLE');}
 const h=host?.payload;
 if(!signed(host,hostFields,opts.originalHostPin)||
  h.schema!=='rosevear.ql452.original-host-response-outcome.v1'||
  h.incidentId!==id||h.auditId!==auditId||h.challengeNonce!==challengeNonce||
  h.ql451ReceiptDigest!==prior||h.sourceDigest!==hash(p)||
  h.originalHostId!=='DESKTOP-AE894KC'||
  !['SIGNED_RESPONSE_EFFECTIVE_UNDER_HOLD','SIGNED_RESPONSE_UNRESOLVED_KEEP_HOLD']
   .includes(h.responseOutcome)||
  !['ON','OFF'].includes(h.hostReceiverState)||
  typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
  typeof h.watchdogArmed!=='boolean'||!Number.isSafeInteger(h.hostSequence)||
  h.hostSequence<1||!fresh(h.reportedAt,opts.nowMs)||
  at(h.reportedAt)<at(p.observedAt))
  return hold('QL452_ORIGINAL_HOST_RESPONSE_OUTCOME_INVALID');
 try{anchor=await independentAnchorProvider.readSignedOutcomeAnchor({
  incidentId:id,prior,auditId,challengeNonce,
  sourceDigest:hash(p),hostOutcomeDigest:hash(h)});}
 catch{return hold('QL452_EXTERNAL_RESPONSE_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.externalAnchorPin)||
  a.schema!=='rosevear.ql452.independent-outcome-anchor.v1'||
  a.incidentId!==id||a.auditId!==auditId||a.challengeNonce!==challengeNonce||
  a.ql451ReceiptDigest!==prior||a.sourceDigest!==hash(p)||
  a.hostOutcomeDigest!==hash(h)||!ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<=h.hostSequence||
  a.anchorDisposition!=='HISTORICAL_OUTCOME_ONLY_NO_CLOSURE'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<at(h.reportedAt))
  return hold('QL452_SIGNED_OUTCOME_ANCHOR_INVALID');
 try{physical=await independentPhysicalObserverProvider.readSignedPhysicalOffReadback({
  incidentId:id,prior,auditId,challengeNonce,anchorDigest:hash(a),
  signedHostOutcomeDigest:hash(h)});}
 catch{return hold('QL452_INDEPENDENT_PHYSICAL_OFF_UNAVAILABLE');}
 const w=physical?.payload;
 if(!signed(physical,physicalFields,opts.independentPhysicalObserverPin)||
  w.schema!=='rosevear.ql452.independent-physical-off-readback.v1'||
  w.incidentId!==id||w.auditId!==auditId||w.challengeNonce!==challengeNonce||
  w.ql451ReceiptDigest!==prior||w.anchorDigest!==hash(a)||
  w.signedHostOutcomeDigest!==hash(h)||
  w.originalHostId!=='DESKTOP-AE894KC'||
  w.receiverId!=='ISOLATED_COMMS_RECEIVER'||
  !ID.test(w.sensorId??'')||
  w.independentPhysicalReadback!=='SIGNED_EXTERNAL_SENSOR_OBSERVATION_ONLY'||
  !['OFF','ON'].includes(w.receiverState)||
  typeof w.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(w.observerSequence)||
  w.observerSequence<=a.anchorSequence||
  !fresh(w.observedAt,opts.nowMs,15000)||
  at(w.observedAt)<at(a.anchoredAt))
  return hold('QL452_INDEPENDENT_PHYSICAL_OFF_FRESHNESS_INVALID');
 const outcomeSafe=h.responseOutcome==='SIGNED_RESPONSE_EFFECTIVE_UNDER_HOLD'&&
  h.hostReceiverState==='OFF'&&h.isolationLock&&h.leaseRevoked&&
  h.watchdogArmed&&w.receiverState==='OFF'&&w.isolationConfirmed;
 const classification=outcomeSafe?
  'SIGNED_HISTORICAL_PHYSICAL_OFF_RESPONSE_OUTCOME_AUDITED_OPEN':
  'SIGNED_RESPONSE_OUTCOME_OR_PHYSICAL_OFF_EXCEPTION_OPEN';
 const closureReviewDecision=outcomeSafe?
  'REVERIFY_CLOSURE_PREREQUISITES_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_UNRESOLVED_PHYSICAL_OFF_EXCEPTION_KEEP_OPEN_HOLD';
 const outcomeDigest=hash({ql451SummaryDigest:hash(s),auditId,challengeNonce,
  originalSourceDigest:hash(p),hostOutcomeDigest:hash(h),
  anchoredOutcomeDigest:hash(a),physicalReadbackDigest:hash(w),classification});
 let authority;
 try{authority=await independentAuthorityProvider.readSignedClosureAuthorityReverification({
  incidentId:id,prior,auditId,outcomeDigest,classification,closureReviewDecision});}
 catch{return hold('QL452_INDEPENDENT_CLOSURE_AUTHORITY_UNAVAILABLE');}
 const b=authority?.payload;
 if(!signed(authority,authorityFields,opts.independentAuthorityPin)||
  b.schema!=='rosevear.ql452.independent-closure-authority.v1'||
  b.incidentId!==id||b.auditId!==auditId||
  b.ql451ReceiptDigest!==prior||b.outcomeDigest!==outcomeDigest||
  b.classification!==classification||b.incidentStatus!=='OPEN_HOLD'||
  b.activationAuthorized!==false||b.closureAuthorized!==false||
  b.physicalReceiverCurrentlyOff!==false||
  b.authorityDisposition!=='REASSESSMENT_ONLY_NEW_SUPERVISED_PHYSICAL_CEREMONY_REQUIRED'||
  !fresh(b.attestedAt,opts.nowMs)||
  at(b.attestedAt)<at(w.observedAt))
  return hold('QL452_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
 const authorityDigest=hash(b);let votes;
 try{votes=await threeMasterProvider.readSignedClosureReviewVotes({
  incidentId:id,prior,auditId,outcomeDigest,authorityDigest,
  classification,closureReviewDecision});}
 catch{return hold('QL452_THREE_MASTER_CLOSURE_AUTHORITY_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL452_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 const seen=new Set(),accepted=[];
 for(const e of votes){
  const m=e?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(e,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql452.three-master-closure-reverification.v1'||
   m.incidentId!==id||m.auditId!==auditId||
   m.ql451ReceiptDigest!==prior||m.outcomeDigest!==outcomeDigest||
   m.authorityDigest!==authorityDigest||
   m.classification!==classification||
   m.closureReviewDecision!==closureReviewDecision||
   m.incidentStatus!=='OPEN_HOLD'||!fresh(m.reviewedAt,opts.nowMs)||
   at(m.reviewedAt)<at(b.attestedAt))
   return hold('QL452_THREE_MASTER_CLOSURE_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 const reportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql452.dual-owner-closure-outcome-audit.v1'||
  f.incidentId!==id||f.auditId!==auditId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql451ReceiptDigest!==prior||
  f.outcomeDigest!==outcomeDigest||f.authorityDigest!==authorityDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.closureReviewDecision!==closureReviewDecision||
  f.incidentStatus!=='OPEN_HOLD'||!fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(m=>at(m.reviewedAt)))||
  !verifySignature(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySignature(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL452_DUAL_OWNER_CLOSURE_REASSESSMENT_VETO');
 try{
  if(!validQl451(s,ql451Ledger)||
   outcomeLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   outcomeLedger.read('audited',id)||outcomeLedger.read('exception',id)||
   !fresh(w.observedAt,opts.nowMs,15000)||
   !fresh(b.attestedAt,opts.nowMs)||!fresh(f.reviewedAt,opts.nowMs))
   return hold('QL452_PROTECTED_SOURCE_DRIFT_OR_OFF_EVIDENCE_STALE');
  const kind=outcomeSafe?'audited':'exception';
  const receipt=outcomeLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,
   sourceDigest:hash(p),hostDigest:hash(h),anchorDigest:hash(a),
   witnessDigest:hash(w),outcomeDigest,authorityDigest,reportsDigest,
   ownerDigest:hash(f),classification,closureReviewDecision,
   incidentStatus:'OPEN_HOLD'}));
  if(outcomeLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(outcomeSafe?
   'SIGNED_HISTORICAL_OFF_AUDIT_ONLY_NO_CURRENT_PHYSICAL_ASSERTION':
   'SIGNED_OUTCOME_EXCEPTION_SUPERVISED_REMEDIATION_REQUIRED'),
   state:outcomeSafe?'DURABLE_QL452_ORIGINAL_HOST_OUTCOME_AUDITED':
    'DURABLE_QL452_ORIGINAL_HOST_OUTCOME_EXCEPTION_OPEN',
   originalIncidentId:id,auditId,challengeNonce,classification,
   closureReviewDecision,masterCount:3,physicalEvidenceFreshAtIntake:true,
   outcomeDigest,authorityDigest,reportsDigest,
   pendingReceiptDigest:pending.recordDigest,
   outcomeReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_HISTORICAL_CLOSURE_REASSESSMENT_OPEN_HOLD',
   permittedNextAction:outcomeSafe?
    'SEPARATE_PHYSICAL_OFF_AND_EXPLICIT_OWNER_CLOSURE_CEREMONY_REQUIRED':
    'SUPERVISED_ORIGINAL_HOST_REMEDIATION_AND_NEW_INDEPENDENT_OFF_REQUIRED'};
 }catch{return hold('QL452_DURABLE_OUTCOME_COMMIT_FAILED');}
}
