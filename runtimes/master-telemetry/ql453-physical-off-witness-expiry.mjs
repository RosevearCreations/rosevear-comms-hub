import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';

/** QL-453 reviews signed past observations, never physical state now.
 * Expired/ON/divergent witnesses are a signed escalation, not a closure. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/,SCHEMA='rosevear.ql453.physical-off-witness-expiry-gate.v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const exact=(o,keys)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const at=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&
 new Date(Date.parse(x)).toISOString()===x?Date.parse(x):NaN;
const fresh=(x,now,limit=60000)=>Number.isSafeInteger(now)&&
 Number.isFinite(at(x))&&at(x)<=now&&now-at(x)<=limit;
const hold=reason=>({state:'HOLD',reason,connection:'HOLD',incidentStatus:'OPEN',
 closureAuthorized:false,activationAuthorized:false,physicalReceiverCurrentlyOff:false,
 receiver:'UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF',
 manualIsolationAndIndependentOffRequired:true,ownerAcceptance:'HOLD',
 slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const verifySig=(payload,sig,pin)=>{
 try{
  if(typeof sig!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(sig)||
   typeof pin!=='string'||pin.length>512)return false;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return false;
  const key=createPublicKey({key:bytes,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(sig,'base64'));
 }catch{return false;}
};
const signed=(envelope,fields,pin)=>exact(envelope,['payload','signature'])&&
 exact(envelope.payload,fields)&&verifySig(envelope.payload,envelope.signature,pin);

export function openQl453ExpiryLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL453_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const dir=lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||(dir.mode&0o077))
  throw Error('QL453_UNSAFE_PRIVATE_DIRECTORY');
 const path=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL453_INVALID_RECEIPT_KEY');
  return join(root,'ql453-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const file=path(kind,id);let stat;
  try{stat=lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)||stat.size>4096)
   throw Error('QL453_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(file,'utf8'));}
  catch{throw Error('QL453_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL453_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))
   throw Error('QL453_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};r.recordDigest=hash(r);
  const fd=openSync(path(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('QL453_DURABLE_READBACK_FAILED');
  return r;
 };
 return Object.freeze({read,claimOnce});
}

function validQl452(s,ledger){
 const exception=s?.state==='DURABLE_QL452_ORIGINAL_HOST_OUTCOME_EXCEPTION_OPEN';
 const audited=s?.state==='DURABLE_QL452_ORIGINAL_HOST_OUTCOME_AUDITED';
 if((!exception&&!audited)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
  s.activationAuthorized!==false||s.closureAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
  s.physicalEvidenceFreshAtIntake!==true||
  s.classification!==(exception?
   'SIGNED_RESPONSE_OUTCOME_OR_PHYSICAL_OFF_EXCEPTION_OPEN':
   'SIGNED_HISTORICAL_PHYSICAL_OFF_RESPONSE_OUTCOME_AUDITED_OPEN')||
  s.closureReviewDecision!==(exception?
   'ESCALATE_UNRESOLVED_PHYSICAL_OFF_EXCEPTION_KEEP_OPEN_HOLD':
   'REVERIFY_CLOSURE_PREREQUISITES_ONLY_KEEP_OPEN_HOLD')||
  s.ownerAcceptance!=='DUAL_SIGNED_HISTORICAL_CLOSURE_REASSESSMENT_OPEN_HOLD'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.auditId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.pendingReceiptDigest,s.outcomeReceiptDigest,s.outcomeDigest,
   s.authorityDigest,s.reportsDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(exception?'exception':'audited',id)?.recordDigest===s.outcomeReceiptDigest&&
   !ledger.read(exception?'audited':'exception',id);
 }catch{return false;}
}
export function readQl453Expiry(ledger,id){
 try{
  const p=ledger.read('pending',id),ok=ledger.read('review',id),
   bad=ledger.read('exception',id);
  if((ok||bad)&&(!p||(ok&&bad)))return hold('QL453_CONFLICTING_FINAL_RECEIPTS');
  if(ok)return {...hold('QL453_SIGNED_HISTORICAL_REVIEW_ONLY'),
   state:'QL453_DURABLE_HISTORY_FRESHNESS_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:ok.recordDigest};
  if(bad)return {...hold('QL453_SIGNED_WITNESS_EXPIRY_ESCALATED'),
   state:'QL453_DURABLE_WITNESS_EXPIRY_EXCEPTION_OPEN',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:bad.recordDigest};
  if(p)return {...hold('QL453_PENDING_MANUAL_OWNER_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL453_NO_PROTECTED_RENEWAL_RECEIPT');
 }catch{return hold('QL453_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql452SummaryDigest','ql452ReceiptDigest',
 'ql452OutcomeDigest','incidentStatus','readAt'];
const originalFields=['schema','incidentId','ql452ReceiptDigest','ql452OutcomeDigest',
 'originalHostId','receiverId','sensorId','receiverState','isolationConfirmed',
 'observerSequence','observedAt'];
const hostFields=['schema','incidentId','renewalId','challengeNonce',
 'ql452ReceiptDigest','sourceDigest','originalHostId','receiverState',
 'isolationLock','leaseRevoked','watchdogArmed','hostSequence','readAt'];
const anchorFields=['schema','incidentId','renewalId','challengeNonce',
 'ql452ReceiptDigest','originalWitnessDigest','hostReadbackDigest',
 'sourceDigest','anchorId','anchorSequence','anchorDecision','anchoredAt'];
const renewalFields=['schema','incidentId','renewalId','challengeNonce',
 'ql452ReceiptDigest','anchorDigest','originalWitnessDigest',
 'hostReadbackDigest','originalHostId','receiverId','sensorId','receiverState',
 'isolationConfirmed','observerSequence','observedAt'];
const boundaryFields=['schema','incidentId','renewalId','ql452ReceiptDigest',
 'witnessDigest','classification','closureDecision','incidentStatus',
 'closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff',
 'separateCeremonyRequired','attestedAt'];
const masterFields=['schema','incidentId','renewalId','masterId','ql452ReceiptDigest',
 'witnessDigest','boundaryDigest','classification','closureDecision',
 'incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','renewalId','sourceOwnerId','masterOwnerId',
 'ql452ReceiptDigest','witnessDigest','boundaryDigest','masterReportsDigest',
 'classification','closureDecision','incidentStatus','reviewedAt'];

/** Trust is bound to original signed QL-452 durable custody, not to a boolean
 * passed by a caller claiming current OFF. readTrustedNowMs is evaluated again
 * at commit to prevent a fresh-at-start witness from expiring during review. */
export async function runQl453ExpiryRenewal({
 ql452Summary,ql452Ledger,expiryLedger,renewalId,challengeNonce,
 originalCommsSourceProvider,originalWitnessProvider,originalHostProvider,
 independentAnchorProvider,renewedWitnessProvider,independentAuthorityProvider,
 threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof expiryLedger?.read!=='function'||typeof expiryLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl452Case!=='function'||
  typeof originalWitnessProvider?.readSignedOriginalPhysicalWitness!=='function'||
  typeof originalHostProvider?.readSignedOriginalHostContinuity!=='function'||
  typeof independentAnchorProvider?.readSignedWitnessAnchor!=='function'||
  typeof renewedWitnessProvider?.readSignedRenewedPhysicalWitness!=='function'||
  typeof independentAuthorityProvider?.readSignedClosureGate!=='function'||
  typeof threeMasterProvider?.readSignedThreeMasterGate!=='function')
  return hold('QL453_SEVEN_INDEPENDENT_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl452CustodyVerified||!opts.originalPhysicalSensorEnrollmentVerified||
  !opts.renewedPhysicalSensorEnrollmentVerified||!opts.independentSignerPinsVerified||
  !opts.separateOwnerRolesVerified||!Number.isSafeInteger(opts.nowMs)||
  typeof opts.readTrustedNowMs!=='function'||!ID.test(renewalId??'')||
  !ID.test(challengeNonce??'')||challengeNonce===ql452Summary?.challengeNonce||
  !validQl452(ql452Summary,ql452Ledger))
  return hold('QL453_EXACT_OPEN_QL452_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 const s=ql452Summary,id=s.originalIncidentId,prior=s.outcomeReceiptDigest;
 const pins=[opts.commsSourcePin,opts.originalWitnessPin,opts.originalHostPin,
  opts.anchorPin,opts.renewedWitnessPin,opts.authorityPin,
  opts.sourceOwnerPin,opts.masterOwnerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(pin=>typeof pin!=='string'||!pin)||new Set(pins).size!==11)
  return hold('QL453_ELEVEN_DISTINCT_SIGNER_PINS_REQUIRED');
 try{
  if(expiryLedger.read('pending',id)||expiryLedger.read('review',id)||
   expiryLedger.read('exception',id))
   return hold('QL453_ONE_USE_RENEWAL_ALREADY_ATTEMPTED');
 }catch{return hold('QL453_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=expiryLedger.claimOnce('pending',id,hash({
   ql452SummaryDigest:hash(s),prior,renewalId,challengeNonce}));
  if(expiryLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL453_PENDING_DURABLE_CLAIM_FAILED');}
 let source,original,host,anchor,renewal;
 try{source=await originalCommsSourceProvider.readSignedQl452Case({
  incidentId:id,prior,renewalId,challengeNonce,pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL453_ORIGINAL_SIGNED_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql453.original-ql452-case.v1'||
  p.incidentId!==id||p.ql452SummaryDigest!==hash(s)||
  p.ql452ReceiptDigest!==prior||p.ql452OutcomeDigest!==s.outcomeDigest||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.readAt,opts.nowMs))
  return hold('QL453_ORIGINAL_QL452_CASE_INVALID');
 try{original=await originalWitnessProvider.readSignedOriginalPhysicalWitness({
  incidentId:id,prior,ql452OutcomeDigest:s.outcomeDigest});}
 catch{return hold('QL453_ORIGINAL_SIGNED_WITNESS_UNAVAILABLE');}
 const o=original?.payload;
 if(!signed(original,originalFields,opts.originalWitnessPin)||
  o.schema!=='rosevear.ql453.original-ql452-physical-witness.v1'||
  o.incidentId!==id||o.ql452ReceiptDigest!==prior||
  o.ql452OutcomeDigest!==s.outcomeDigest||
  o.originalHostId!=='DESKTOP-AE894KC'||o.receiverId!=='ISOLATED_COMMS_RECEIVER'||
  !ID.test(o.sensorId??'')||!['OFF','ON'].includes(o.receiverState)||
  typeof o.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(o.observerSequence)||o.observerSequence<1||
  !Number.isFinite(at(o.observedAt))||at(o.observedAt)>opts.nowMs)
  return hold('QL453_ORIGINAL_SIGNED_PHYSICAL_WITNESS_INVALID');
 try{host=await originalHostProvider.readSignedOriginalHostContinuity({
  incidentId:id,prior,renewalId,challengeNonce,sourceDigest:hash(p)});}
 catch{return hold('QL453_ORIGINAL_HOST_READBACK_UNAVAILABLE');}
 const h=host?.payload;
 if(!signed(host,hostFields,opts.originalHostPin)||
  h.schema!=='rosevear.ql453.original-host-continuity.v1'||
  h.incidentId!==id||h.renewalId!==renewalId||
  h.challengeNonce!==challengeNonce||h.ql452ReceiptDigest!==prior||
  h.sourceDigest!==hash(p)||h.originalHostId!=='DESKTOP-AE894KC'||
  !['OFF','ON'].includes(h.receiverState)||
  typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
  typeof h.watchdogArmed!=='boolean'||
  !Number.isSafeInteger(h.hostSequence)||h.hostSequence<1||
  !fresh(h.readAt,opts.nowMs)||at(h.readAt)<at(p.readAt))
  return hold('QL453_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
 try{anchor=await independentAnchorProvider.readSignedWitnessAnchor({
  incidentId:id,prior,renewalId,challengeNonce,sourceDigest:hash(p),
  originalWitnessDigest:hash(o),hostReadbackDigest:hash(h)});}
 catch{return hold('QL453_INDEPENDENT_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.anchorPin)||
  a.schema!=='rosevear.ql453.external-witness-renewal-anchor.v1'||
  a.incidentId!==id||a.renewalId!==renewalId||
  a.challengeNonce!==challengeNonce||a.ql452ReceiptDigest!==prior||
  a.sourceDigest!==hash(p)||a.originalWitnessDigest!==hash(o)||
  a.hostReadbackDigest!==hash(h)||!ID.test(a.anchorId??'')||
  !Number.isSafeInteger(a.anchorSequence)||a.anchorSequence<=h.hostSequence||
  a.anchorDecision!=='SIGNED_WITNESS_HISTORY_ONLY_OPEN_HOLD'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<at(h.readAt))
  return hold('QL453_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 try{renewal=await renewedWitnessProvider.readSignedRenewedPhysicalWitness({
  incidentId:id,prior,renewalId,challengeNonce,
  anchorDigest:hash(a),originalWitnessDigest:hash(o),hostReadbackDigest:hash(h)});}
 catch{return hold('QL453_INDEPENDENT_PHYSICAL_RENEWAL_UNAVAILABLE');}
 const w=renewal?.payload;
 if(!signed(renewal,renewalFields,opts.renewedWitnessPin)||
  w.schema!=='rosevear.ql453.renewed-independent-physical-witness.v1'||
  w.incidentId!==id||w.renewalId!==renewalId||
  w.challengeNonce!==challengeNonce||w.ql452ReceiptDigest!==prior||
  w.anchorDigest!==hash(a)||w.originalWitnessDigest!==hash(o)||
  w.hostReadbackDigest!==hash(h)||w.originalHostId!=='DESKTOP-AE894KC'||
  w.receiverId!=='ISOLATED_COMMS_RECEIVER'||!ID.test(w.sensorId??'')||
  w.sensorId===o.sensorId||!['OFF','ON'].includes(w.receiverState)||
  typeof w.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(w.observerSequence)||
  w.observerSequence<=a.anchorSequence||
  !fresh(w.observedAt,opts.nowMs,15000)||
  at(w.observedAt)<at(a.anchoredAt)||at(w.observedAt)<at(o.observedAt))
  return hold('QL453_RENEWED_PHYSICAL_WITNESS_INVALID_OR_STALE');
 const originalExpired=!fresh(o.observedAt,opts.nowMs,15000);
 const gateHealthy=s.state==='DURABLE_QL452_ORIGINAL_HOST_OUTCOME_AUDITED'&&
  !originalExpired&&o.receiverState==='OFF'&&o.isolationConfirmed&&
  h.receiverState==='OFF'&&h.isolationLock&&h.leaseRevoked&&h.watchdogArmed&&
  w.receiverState==='OFF'&&w.isolationConfirmed;
 const classification=gateHealthy?
  'SIGNED_PHYSICAL_OFF_WITNESS_REVIEW_FRESH_OPEN_HOLD':
  'SIGNED_PHYSICAL_OFF_WITNESS_EXPIRED_OR_DIVERGENT_EXCEPTION_OPEN';
 const closureDecision=gateHealthy?
  'THREE_MASTER_CLOSURE_PREREQUISITES_REVIEW_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_WITNESS_EXPIRY_OR_DIVERGENCE_KEEP_OPEN_HOLD';
 const witnessDigest=hash({ql452SummaryDigest:hash(s),renewalId,challengeNonce,
  sourceDigest:hash(p),originalWitnessDigest:hash(o),hostReadbackDigest:hash(h),
  anchorDigest:hash(a),renewedWitnessDigest:hash(w),
  originalExpired,classification});
 let boundary;
 try{boundary=await independentAuthorityProvider.readSignedClosureGate({
  incidentId:id,prior,renewalId,witnessDigest,classification,closureDecision});}
 catch{return hold('QL453_INDEPENDENT_CLOSURE_GATE_UNAVAILABLE');}
 const b=boundary?.payload;
 if(!signed(boundary,boundaryFields,opts.authorityPin)||
  b.schema!=='rosevear.ql453.independent-closure-gate.v1'||
  b.incidentId!==id||b.renewalId!==renewalId||
  b.ql452ReceiptDigest!==prior||b.witnessDigest!==witnessDigest||
  b.classification!==classification||b.closureDecision!==closureDecision||
  b.incidentStatus!=='OPEN_HOLD'||b.closureAuthorized!==false||
  b.activationAuthorized!==false||b.physicalReceiverCurrentlyOff!==false||
  b.separateCeremonyRequired!==true||
  !fresh(b.attestedAt,opts.nowMs)||at(b.attestedAt)<at(w.observedAt))
  return hold('QL453_INDEPENDENT_CLOSURE_GATE_VETO');
 const boundaryDigest=hash(b);let votes;
 try{votes=await threeMasterProvider.readSignedThreeMasterGate({
  incidentId:id,prior,renewalId,witnessDigest,boundaryDigest,classification,closureDecision});}
 catch{return hold('QL453_THREE_MASTER_RENEWAL_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL453_THREE_DISTINCT_MASTERS_REQUIRED');
 const seen=new Set(),accepted=[];
 for(const envelope of votes){
  const m=envelope?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(envelope,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql453.three-master-closure-gate.v1'||
   m.incidentId!==id||m.renewalId!==renewalId||
   m.ql452ReceiptDigest!==prior||m.witnessDigest!==witnessDigest||
   m.boundaryDigest!==boundaryDigest||m.classification!==classification||
   m.closureDecision!==closureDecision||m.incidentStatus!=='OPEN_HOLD'||
   !fresh(m.reviewedAt,opts.nowMs)||at(m.reviewedAt)<at(b.attestedAt))
   return hold('QL453_THREE_MASTER_SIGNED_GATE_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 const reportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql453.dual-owner-closure-gate.v1'||
  f.incidentId!==id||f.renewalId!==renewalId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql452ReceiptDigest!==prior||
  f.witnessDigest!==witnessDigest||f.boundaryDigest!==boundaryDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.closureDecision!==closureDecision||f.incidentStatus!=='OPEN_HOLD'||
  !fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(m=>at(m.reviewedAt)))||
  !verifySig(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySig(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL453_DUAL_OWNER_SIGNED_GATE_VETO');
 let commitNow;
 try{commitNow=opts.readTrustedNowMs();}
 catch{return hold('QL453_COMMIT_CLOCK_UNAVAILABLE');}
 if(!Number.isSafeInteger(commitNow)||commitNow<opts.nowMs||
  commitNow-opts.nowMs>60000)
  return hold('QL453_TRUSTED_CLOCK_DRIFT');
 try{
  if(!validQl452(s,ql452Ledger)||
   expiryLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   expiryLedger.read('review',id)||expiryLedger.read('exception',id)||
   !fresh(w.observedAt,commitNow,15000)||!fresh(b.attestedAt,commitNow)||
   !fresh(f.reviewedAt,commitNow))
   return hold('QL453_PROTECTED_CUSTODY_OR_RENEWAL_WITNESS_EXPIRED');
  // An original witness that expires during review can never be committed
  // under a previously signed healthy classification. Require a new review.
  if(gateHealthy&&!fresh(o.observedAt,commitNow,15000))
   return hold('QL453_ORIGINAL_WITNESS_EXPIRED_DURING_REVIEW');
  const kind=gateHealthy?'review':'exception';
  const receipt=expiryLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,witnessDigest,boundaryDigest,
   reportsDigest,ownerDigest:hash(f),classification,closureDecision,
   incidentStatus:'OPEN_HOLD'}));
  if(expiryLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(gateHealthy?
   'HISTORICAL_SIGNED_WITNESS_FRESHNESS_ONLY_NO_PHYSICAL_STATE_ASSERTION':
   'WITNESS_EXPIRED_DIVERGENT_OR_PREDECESSOR_EXCEPTION_REQUIRES_SUPERVISED_RESPONSE'),
   state:gateHealthy?'DURABLE_QL453_SIGNED_WITNESS_FRESHNESS_REVIEW_ONLY':
    'DURABLE_QL453_WITNESS_EXPIRY_EXCEPTION_OPEN',
   originalIncidentId:id,renewalId,challengeNonce,
   classification,closureDecision,masterCount:3,witnessDigest,boundaryDigest,
   reportsDigest,originalWitnessExpiredAtReview:originalExpired,
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_WITNESS_REASSESSMENT_KEEP_INCIDENT_OPEN_HOLD',
   permittedNextAction:gateHealthy?
    'NEW_PHYSICAL_OFF_AND_EXPLICIT_OWNER_CLOSURE_CEREMONY_REQUIRED':
    'SUPERVISED_ESCALATION_AND_NEW_INDEPENDENT_OFF_REQUIRED'};
 }catch{return hold('QL453_DURABLE_CLOSURE_GATE_COMMIT_FAILED');}
}
