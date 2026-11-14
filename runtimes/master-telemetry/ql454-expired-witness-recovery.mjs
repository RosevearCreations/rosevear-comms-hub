import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';

/** QL-454: historical signed recovery and renewal evidence, NOT a closure,
 * live OFF attestation, automation receiver command or authority to connect. */
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID=/^[A-Za-z0-9_-]{12,96}$/,PERSON=/^[A-Za-z0-9_-]{3,80}$/;
const HEX=/^[a-f0-9]{64}$/,SCHEMA='rosevear.ql454.expired-witness-recovery.v1';
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
function verifySig(payload,signature,pin){
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
const signed=(envelope,fields,pin)=>exact(envelope,['payload','signature'])&&
 exact(envelope.payload,fields)&&verifySig(envelope.payload,envelope.signature,pin);

export function openQl454RecoveryLedger(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||directory.includes('..'))
  throw Error('QL454_ABSOLUTE_PRIVATE_LEDGER_REQUIRED');
 const root=resolve(directory);mkdirSync(root,{recursive:true,mode:0o700});
 const dir=lstatSync(root);
 if(!dir.isDirectory()||dir.isSymbolicLink()||(dir.mode&0o077))
  throw Error('QL454_UNSAFE_PRIVATE_DIRECTORY');
 const path=(kind,id)=>{
  if(!['pending','review','exception'].includes(kind)||!ID.test(id??''))
   throw Error('QL454_INVALID_RECEIPT_KEY');
  return join(root,'ql454-'+kind+'-'+id+'.json');
 };
 const read=(kind,id)=>{
  const file=path(kind,id);let stat;
  try{stat=lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!stat.isFile()||stat.isSymbolicLink()||(stat.mode&0o077)||stat.size>4096)
   throw Error('QL454_UNSAFE_RECEIPT');
  let r;try{r=JSON.parse(readFileSync(file,'utf8'));}
  catch{throw Error('QL454_CORRUPT_RECEIPT');}
  if(!exact(r,['schema','kind','incidentId','evidenceDigest','recordDigest'])||
   r.schema!==SCHEMA||r.kind!==kind||r.incidentId!==id||
   !HEX.test(r.evidenceDigest??'')||
   r.recordDigest!==hash({schema:SCHEMA,kind,incidentId:id,evidenceDigest:r.evidenceDigest}))
   throw Error('QL454_TAMPERED_RECEIPT');
  return r;
 };
 const claimOnce=(kind,id,evidenceDigest)=>{
  if(!HEX.test(evidenceDigest??'')||read(kind,id))throw Error('QL454_ALREADY_CLAIMED');
  const r={schema:SCHEMA,kind,incidentId:id,evidenceDigest};r.recordDigest=hash(r);
  const fd=openSync(path(kind,id),'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(r));fsyncSync(fd);}finally{closeSync(fd);}
  const d=openSync(root,'r');try{fsyncSync(d);}finally{closeSync(d);}
  if(read(kind,id)?.recordDigest!==r.recordDigest)
   throw Error('QL454_DURABLE_READBACK_FAILED');
  return r;
 };
 return Object.freeze({read,claimOnce});
}
function validQl453(s,ledger){
 const exception=s?.state==='DURABLE_QL453_WITNESS_EXPIRY_EXCEPTION_OPEN';
 const review=s?.state==='DURABLE_QL453_SIGNED_WITNESS_FRESHNESS_REVIEW_ONLY';
 if((!exception&&!review)||s.connection!=='HOLD'||s.incidentStatus!=='OPEN'||
  s.closureAuthorized!==false||s.activationAuthorized!==false||
  s.physicalReceiverCurrentlyOff!==false||s.masterCount!==3||
  typeof s.originalWitnessExpiredAtReview!=='boolean'||
  (review&&s.originalWitnessExpiredAtReview)||
  s.classification!==(exception?
   'SIGNED_PHYSICAL_OFF_WITNESS_EXPIRED_OR_DIVERGENT_EXCEPTION_OPEN':
   'SIGNED_PHYSICAL_OFF_WITNESS_REVIEW_FRESH_OPEN_HOLD')||
  s.closureDecision!==(exception?
   'ESCALATE_WITNESS_EXPIRY_OR_DIVERGENCE_KEEP_OPEN_HOLD':
   'THREE_MASTER_CLOSURE_PREREQUISITES_REVIEW_ONLY_KEEP_OPEN_HOLD')||
  s.ownerAcceptance!=='DUAL_SIGNED_WITNESS_REASSESSMENT_KEEP_INCIDENT_OPEN_HOLD'||
  !ID.test(s.originalIncidentId??'')||!ID.test(s.renewalId??'')||
  !ID.test(s.challengeNonce??'')||
  ![s.pendingReceiptDigest,s.finalReceiptDigest,s.witnessDigest,
   s.boundaryDigest,s.reportsDigest].every(x=>HEX.test(x??''))||
  typeof ledger?.read!=='function')return false;
 try{
  const id=s.originalIncidentId;
  return ledger.read('pending',id)?.recordDigest===s.pendingReceiptDigest&&
   ledger.read(exception?'exception':'review',id)?.recordDigest===s.finalReceiptDigest&&
   !ledger.read(exception?'review':'exception',id);
 }catch{return false;}
}
export function readQl454Recovery(ledger,id){
 try{
  const p=ledger.read('pending',id),good=ledger.read('review',id),
   bad=ledger.read('exception',id);
  if((good||bad)&&(!p||(good&&bad)))return hold('QL454_CONFLICTING_RECOVERY_RECEIPTS');
  if(good)return {...hold('QL454_HISTORICAL_RECOVERY_REVIEW_ONLY'),
   state:'QL454_DURABLE_RECOVERY_REVIEW_ONLY',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:good.recordDigest};
  if(bad)return {...hold('QL454_ORIGINAL_HOST_RECOVERY_EXCEPTION_OPEN'),
   state:'QL454_DURABLE_RECOVERY_EXCEPTION_OPEN',
   pendingReceiptDigest:p.recordDigest,finalReceiptDigest:bad.recordDigest};
  if(p)return {...hold('QL454_PENDING_SUPERVISED_RECOVERY_REQUIRED'),
   pendingReceiptDigest:p.recordDigest};
  return hold('QL454_NO_SIGNED_RECOVERY_RECEIPT');
 }catch{return hold('QL454_PRIVATE_CUSTODY_UNREADABLE');}
}
const sourceFields=['schema','incidentId','ql453SummaryDigest','ql453ReceiptDigest',
 'ql453WitnessDigest','incidentStatus','readAt'];
const responseFields=['schema','incidentId','recoveryId','challengeNonce',
 'ql453ReceiptDigest','ql453WitnessDigest','sourceDigest','priorExpiry',
 'recoveryDisposition','isolationRecoveryVerified','leaseRecoveryVerified',
 'watchdogRecoveryVerified','respondedAt'];
const hostFields=['schema','incidentId','recoveryId','challengeNonce','phase',
 'sampleIndex','ql453ReceiptDigest','responseDigest','sourceDigest',
 'originalHostId','previousDigest','receiverState','isolationLock',
 'leaseRevoked','watchdogArmed','hostSequence','observedAt'];
const anchorFields=['schema','incidentId','recoveryId','challengeNonce',
 'ql453ReceiptDigest','sourceDigest','responseDigest','hostContinuityDigest',
 'anchorId','anchorSequence','anchorDecision','anchoredAt'];
const witnessFields=['schema','incidentId','recoveryId','challengeNonce',
 'ql453ReceiptDigest','anchorDigest','hostContinuityDigest',
 'originalHostId','receiverId','sensorId','originalSensorId','receiverState',
 'isolationConfirmed','observerSequence','observedAt'];
const boundaryFields=['schema','incidentId','recoveryId','ql453ReceiptDigest',
 'recoveryDigest','classification','closureDecision','incidentStatus',
 'closureAuthorized','activationAuthorized','physicalReceiverCurrentlyOff',
 'ceremonyAuthorization','attestedAt'];
const masterFields=['schema','incidentId','recoveryId','masterId','ql453ReceiptDigest',
 'recoveryDigest','boundaryDigest','classification','closureDecision',
 'incidentStatus','reviewedAt'];
const ownerFields=['schema','incidentId','recoveryId','sourceOwnerId','masterOwnerId',
 'ql453ReceiptDigest','recoveryDigest','boundaryDigest','masterReportsDigest',
 'classification','closureDecision','incidentStatus','reviewedAt'];

/** All adapters provide independently signed read-only historical evidence.
 * No method operates the original Windows receiver or grants physical authority. */
export async function runQl454RecoveryReview({
 ql453Summary,ql453Ledger,recoveryLedger,recoveryId,challengeNonce,
 originalCommsSourceProvider,independentRecoveryProvider,originalHostProvider,
 independentAnchorProvider,renewedPhysicalWitnessProvider,
 independentAuthorityProvider,threeMasterProvider,finalOwnerDecision
},opts={}){
 if(typeof recoveryLedger?.read!=='function'||typeof recoveryLedger?.claimOnce!=='function'||
  typeof originalCommsSourceProvider?.readSignedQl453Case!=='function'||
  typeof independentRecoveryProvider?.readSignedExpiredWitnessRecovery!=='function'||
  typeof originalHostProvider?.readSignedHostRenewalSamples!=='function'||
  typeof independentAnchorProvider?.readSignedRecoveryAnchor!=='function'||
  typeof renewedPhysicalWitnessProvider?.readSignedPhysicalRecoveryWitness!=='function'||
  typeof independentAuthorityProvider?.readSignedClosureCeremonyReadiness!=='function'||
  typeof threeMasterProvider?.readSignedClosureReadinessVotes!=='function')
  return hold('QL454_SEVEN_INDEPENDENT_READONLY_ADAPTERS_REQUIRED');
 if(!opts.trustedClockVerified||!opts.protectedOriginalHostSession||
  !opts.independentQl453CustodyVerified||!opts.physicalSensorEnrollmentVerified||
  !opts.independentSignerPinsVerified||!opts.separateOwnerRolesVerified||
  typeof opts.readTrustedNowMs!=='function'||!Number.isSafeInteger(opts.nowMs)||
  !ID.test(opts.originalSensorId??'')||!ID.test(recoveryId??'')||
  !ID.test(challengeNonce??'')||challengeNonce===ql453Summary?.challengeNonce||
  !validQl453(ql453Summary,ql453Ledger))
  return hold('QL454_EXACT_OPEN_QL453_CUSTODY_AND_NEW_CHALLENGE_REQUIRED');
 const s=ql453Summary,id=s.originalIncidentId,prior=s.finalReceiptDigest;
 const priorException=s.state==='DURABLE_QL453_WITNESS_EXPIRY_EXCEPTION_OPEN';
 const priorExpiry=priorException&&s.originalWitnessExpiredAtReview;
 const pins=[opts.commsSourcePin,opts.recoveryOfficerPin,opts.originalHostPin,
  opts.externalAnchorPin,opts.renewedWitnessPin,opts.independentAuthorityPin,
  opts.sourceOwnerPin,opts.masterOwnerPin,...MASTERS.map(m=>opts.masterPins?.[m])];
 if(pins.some(p=>typeof p!=='string'||!p)||new Set(pins).size!==11)
  return hold('QL454_ELEVEN_DISTINCT_SIGNER_PINS_REQUIRED');
 try{
  if(recoveryLedger.read('pending',id)||recoveryLedger.read('review',id)||
   recoveryLedger.read('exception',id))
   return hold('QL454_ONE_USE_RECOVERY_ALREADY_ATTEMPTED');
 }catch{return hold('QL454_PRIVATE_CUSTODY_UNREADABLE');}
 let pending;
 try{
  pending=recoveryLedger.claimOnce('pending',id,hash({
   ql453SummaryDigest:hash(s),prior,recoveryId,challengeNonce}));
  if(recoveryLedger.read('pending',id)?.recordDigest!==pending.recordDigest)
   throw Error('readback');
 }catch{return hold('QL454_PENDING_DURABLE_CLAIM_FAILED');}
 let source,response,hosts,anchor,witness;
 try{source=await originalCommsSourceProvider.readSignedQl453Case({
  incidentId:id,prior,recoveryId,challengeNonce,
  pendingReceiptDigest:pending.recordDigest});}
 catch{return hold('QL454_ORIGINAL_QL453_SOURCE_UNAVAILABLE');}
 const p=source?.payload;
 if(!signed(source,sourceFields,opts.commsSourcePin)||
  p.schema!=='rosevear.ql454.original-ql453-case.v1'||
  p.incidentId!==id||p.ql453SummaryDigest!==hash(s)||
  p.ql453ReceiptDigest!==prior||p.ql453WitnessDigest!==s.witnessDigest||
  p.incidentStatus!=='OPEN_HOLD'||!fresh(p.readAt,opts.nowMs))
  return hold('QL454_ORIGINAL_CASE_SIGNED_MISMATCH');
 try{response=await independentRecoveryProvider.readSignedExpiredWitnessRecovery({
  incidentId:id,prior,recoveryId,challengeNonce,
  sourceDigest:hash(p),priorExpiry});}
 catch{return hold('QL454_INDEPENDENT_RECOVERY_RESPONSE_UNAVAILABLE');}
 const r=response?.payload;
 const disposition=priorExpiry?
  ['SIGNED_EXPIRED_WITNESS_RECOVERED_UNDER_HOLD','SIGNED_RECOVERY_UNRESOLVED_KEEP_HOLD']:
  (priorException?['SIGNED_NONEXPIRY_EXCEPTION_UNRESOLVED_KEEP_HOLD']:
   ['SIGNED_CONTINUITY_RENEWAL_NO_EXPIRY']);
 if(!signed(response,responseFields,opts.recoveryOfficerPin)||
  r.schema!=='rosevear.ql454.independent-expired-witness-recovery.v1'||
  r.incidentId!==id||r.recoveryId!==recoveryId||
  r.challengeNonce!==challengeNonce||r.ql453ReceiptDigest!==prior||
  r.ql453WitnessDigest!==s.witnessDigest||r.sourceDigest!==hash(p)||
  r.priorExpiry!==priorExpiry||!disposition.includes(r.recoveryDisposition)||
  typeof r.isolationRecoveryVerified!=='boolean'||
  typeof r.leaseRecoveryVerified!=='boolean'||
  typeof r.watchdogRecoveryVerified!=='boolean'||
  !fresh(r.respondedAt,opts.nowMs)||at(r.respondedAt)<at(p.readAt))
  return hold('QL454_SIGNED_INDEPENDENT_RECOVERY_INVALID');
 try{hosts=await originalHostProvider.readSignedHostRenewalSamples({
  incidentId:id,prior,recoveryId,challengeNonce,
  sourceDigest:hash(p),responseDigest:hash(r)});}
 catch{return hold('QL454_ORIGINAL_HOST_RENEWAL_UNAVAILABLE');}
 if(!Array.isArray(hosts)||hosts.length!==2)
  return hold('QL454_TWO_SIGNED_HOST_RENEWAL_SAMPLES_REQUIRED');
 const h0=hosts[0]?.payload,h1=hosts[1]?.payload;
 let previousDigest=hash(r),previousSequence=0,previousTime=at(r.respondedAt);
 let firstTime=null,hostHealthy=true;
 for(let i=0;i<2;i++){
  const h=hosts[i]?.payload,phase=i===0?'BASELINE':'FOLLOWUP';
  if(!signed(hosts[i],hostFields,opts.originalHostPin)||
   h.schema!=='rosevear.ql454.original-host-renewal-continuity.v1'||
   h.incidentId!==id||h.recoveryId!==recoveryId||
   h.challengeNonce!==challengeNonce||h.phase!==phase||h.sampleIndex!==i+1||
   h.ql453ReceiptDigest!==prior||h.responseDigest!==hash(r)||
   h.sourceDigest!==hash(p)||h.originalHostId!=='DESKTOP-AE894KC'||
   h.previousDigest!==previousDigest||!['OFF','ON'].includes(h.receiverState)||
   typeof h.isolationLock!=='boolean'||typeof h.leaseRevoked!=='boolean'||
   typeof h.watchdogArmed!=='boolean'||!Number.isSafeInteger(h.hostSequence)||
   h.hostSequence<=previousSequence||!fresh(h.observedAt,opts.nowMs)||
   at(h.observedAt)<previousTime||
   (i===1&&at(h.observedAt)-firstTime<10000))
   return hold('QL454_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
  if(i===0)firstTime=at(h.observedAt);
  hostHealthy &&=h.receiverState==='OFF'&&h.isolationLock&&
   h.leaseRevoked&&h.watchdogArmed;
  previousDigest=hash(h);previousSequence=h.hostSequence;
  previousTime=at(h.observedAt);
 }
 const hostContinuityDigest=hash(hosts.map(e=>e.payload));
 try{anchor=await independentAnchorProvider.readSignedRecoveryAnchor({
  incidentId:id,prior,recoveryId,challengeNonce,sourceDigest:hash(p),
  responseDigest:hash(r),hostContinuityDigest});}
 catch{return hold('QL454_EXTERNAL_RECOVERY_ANCHOR_UNAVAILABLE');}
 const a=anchor?.payload;
 if(!signed(anchor,anchorFields,opts.externalAnchorPin)||
  a.schema!=='rosevear.ql454.independent-recovery-anchor.v1'||
  a.incidentId!==id||a.recoveryId!==recoveryId||
  a.challengeNonce!==challengeNonce||a.ql453ReceiptDigest!==prior||
  a.sourceDigest!==hash(p)||a.responseDigest!==hash(r)||
  a.hostContinuityDigest!==hostContinuityDigest||
  !ID.test(a.anchorId??'')||!Number.isSafeInteger(a.anchorSequence)||
  a.anchorSequence<=previousSequence||
  a.anchorDecision!=='HISTORICAL_RECOVERY_ONLY_KEEP_OPEN_HOLD'||
  !fresh(a.anchoredAt,opts.nowMs)||at(a.anchoredAt)<previousTime)
  return hold('QL454_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 try{witness=await renewedPhysicalWitnessProvider.readSignedPhysicalRecoveryWitness({
  incidentId:id,prior,recoveryId,challengeNonce,anchorDigest:hash(a),
  hostContinuityDigest});}
 catch{return hold('QL454_RENEWED_PHYSICAL_WITNESS_UNAVAILABLE');}
 const w=witness?.payload;
 if(!signed(witness,witnessFields,opts.renewedWitnessPin)||
  w.schema!=='rosevear.ql454.renewed-physical-recovery-witness.v1'||
  w.incidentId!==id||w.recoveryId!==recoveryId||
  w.challengeNonce!==challengeNonce||w.ql453ReceiptDigest!==prior||
  w.anchorDigest!==hash(a)||w.hostContinuityDigest!==hostContinuityDigest||
  w.originalHostId!=='DESKTOP-AE894KC'||
  w.receiverId!=='ISOLATED_COMMS_RECEIVER'||!ID.test(w.sensorId??'')||
  w.originalSensorId!==opts.originalSensorId||
  w.sensorId===w.originalSensorId||!['OFF','ON'].includes(w.receiverState)||
  typeof w.isolationConfirmed!=='boolean'||
  !Number.isSafeInteger(w.observerSequence)||
  w.observerSequence<=a.anchorSequence||
  !fresh(w.observedAt,opts.nowMs,15000)||
  at(w.observedAt)<at(a.anchoredAt))
  return hold('QL454_INDEPENDENT_RENEWAL_WITNESS_INVALID_OR_STALE');
 const corrected=priorExpiry&&
  r.recoveryDisposition==='SIGNED_EXPIRED_WITNESS_RECOVERED_UNDER_HOLD';
 const permitted=corrected||!priorException;
 const health=permitted&&hostHealthy&&
  r.isolationRecoveryVerified&&r.leaseRecoveryVerified&&r.watchdogRecoveryVerified&&
  w.receiverState==='OFF'&&w.isolationConfirmed;
 const classification=health?(corrected?
  'SIGNED_HISTORICAL_EXPIRED_WITNESS_RECOVERY_REVIEW_ONLY':
  'SIGNED_HISTORICAL_HOST_CONTINUITY_RENEWAL_REVIEW_ONLY'):
  'SIGNED_WITNESS_RECOVERY_OR_CONTINUITY_EXCEPTION_OPEN';
 const closureDecision=health?
  'THREE_MASTER_CEREMONY_READINESS_EVIDENCE_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_RECOVERY_EXCEPTION_KEEP_OPEN_HOLD';
 const recoveryDigest=hash({ql453SummaryDigest:hash(s),recoveryId,challengeNonce,
  sourceDigest:hash(p),responseDigest:hash(r),hostContinuityDigest,
  anchorDigest:hash(a),renewedWitnessDigest:hash(w),classification});
 let boundary;
 try{boundary=await independentAuthorityProvider.readSignedClosureCeremonyReadiness({
  incidentId:id,prior,recoveryId,recoveryDigest,classification,closureDecision});}
 catch{return hold('QL454_INDEPENDENT_CEREMONY_GATE_UNAVAILABLE');}
 const b=boundary?.payload;
 if(!signed(boundary,boundaryFields,opts.independentAuthorityPin)||
  b.schema!=='rosevear.ql454.independent-ceremony-readiness.v1'||
  b.incidentId!==id||b.recoveryId!==recoveryId||
  b.ql453ReceiptDigest!==prior||b.recoveryDigest!==recoveryDigest||
  b.classification!==classification||b.closureDecision!==closureDecision||
  b.incidentStatus!=='OPEN_HOLD'||b.closureAuthorized!==false||
  b.activationAuthorized!==false||b.physicalReceiverCurrentlyOff!==false||
  b.ceremonyAuthorization!=='SEPARATE_OWNER_AND_FRESH_PHYSICAL_OFF_REQUIRED'||
  !fresh(b.attestedAt,opts.nowMs)||at(b.attestedAt)<at(w.observedAt))
  return hold('QL454_INDEPENDENT_CEREMONY_AUTHORITY_VETO');
 const boundaryDigest=hash(b);let votes;
 try{votes=await threeMasterProvider.readSignedClosureReadinessVotes({
  incidentId:id,prior,recoveryId,recoveryDigest,boundaryDigest,
  classification,closureDecision});}
 catch{return hold('QL454_THREE_MASTER_READINESS_UNAVAILABLE');}
 if(!Array.isArray(votes)||votes.length!==3)
  return hold('QL454_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 const accepted=[],seen=new Set();
 for(const envelope of votes){
  const m=envelope?.payload;
  if(!MASTERS.includes(m?.masterId)||seen.has(m.masterId)||
   !signed(envelope,masterFields,opts.masterPins[m.masterId])||
   m.schema!=='rosevear.ql454.three-master-ceremony-readiness.v1'||
   m.incidentId!==id||m.recoveryId!==recoveryId||
   m.ql453ReceiptDigest!==prior||m.recoveryDigest!==recoveryDigest||
   m.boundaryDigest!==boundaryDigest||m.classification!==classification||
   m.closureDecision!==closureDecision||m.incidentStatus!=='OPEN_HOLD'||
   !fresh(m.reviewedAt,opts.nowMs)||at(m.reviewedAt)<at(b.attestedAt))
   return hold('QL454_THREE_MASTER_SIGNED_READINESS_VETO');
  seen.add(m.masterId);accepted.push(m);
 }
 accepted.sort((x,y)=>MASTERS.indexOf(x.masterId)-MASTERS.indexOf(y.masterId));
 const reportsDigest=hash(accepted),f=finalOwnerDecision?.payload;
 if(!exact(finalOwnerDecision,['payload','sourceOwnerSignature','masterOwnerSignature'])||
  !exact(f,ownerFields)||
  f.schema!=='rosevear.ql454.dual-owner-ceremony-readiness.v1'||
  f.incidentId!==id||f.recoveryId!==recoveryId||
  !PERSON.test(f.sourceOwnerId??'')||!PERSON.test(f.masterOwnerId??'')||
  f.sourceOwnerId===f.masterOwnerId||f.ql453ReceiptDigest!==prior||
  f.recoveryDigest!==recoveryDigest||f.boundaryDigest!==boundaryDigest||
  f.masterReportsDigest!==reportsDigest||f.classification!==classification||
  f.closureDecision!==closureDecision||f.incidentStatus!=='OPEN_HOLD'||
  !fresh(f.reviewedAt,opts.nowMs)||
  at(f.reviewedAt)<Math.max(...accepted.map(m=>at(m.reviewedAt)))||
  !verifySig(f,finalOwnerDecision.sourceOwnerSignature,opts.sourceOwnerPin)||
  !verifySig(f,finalOwnerDecision.masterOwnerSignature,opts.masterOwnerPin))
  return hold('QL454_DUAL_OWNER_SIGNED_READINESS_VETO');
 let commitNow;
 try{commitNow=opts.readTrustedNowMs();}
 catch{return hold('QL454_FINAL_CLOCK_UNAVAILABLE');}
 if(!Number.isSafeInteger(commitNow)||commitNow<opts.nowMs||
  commitNow-opts.nowMs>60000)
  return hold('QL454_TRUSTED_CLOCK_DRIFT');
 try{
  if(!validQl453(s,ql453Ledger)||
   recoveryLedger.read('pending',id)?.recordDigest!==pending.recordDigest||
   recoveryLedger.read('review',id)||recoveryLedger.read('exception',id)||
   !fresh(w.observedAt,commitNow,15000)||
   !fresh(b.attestedAt,commitNow)||!fresh(f.reviewedAt,commitNow))
   return hold('QL454_PROTECTED_CUSTODY_OR_RENEWED_WITNESS_EXPIRED');
  const kind=health?'review':'exception';
  const receipt=recoveryLedger.claimOnce(kind,id,hash({
   prior,pendingDigest:pending.recordDigest,recoveryDigest,boundaryDigest,
   reportsDigest,ownerDigest:hash(f),classification,closureDecision,
   incidentStatus:'OPEN_HOLD'}));
  if(recoveryLedger.read(kind,id)?.recordDigest!==receipt.recordDigest)
   throw Error('readback');
  return {...hold(health?
   'HISTORICAL_WITNESS_RECOVERY_ONLY_NO_CURRENT_PHYSICAL_OFF_OR_CLOSURE':
   'SIGNED_RECOVERY_OR_ORIGINAL_HOST_CONTINUITY_EXCEPTION_REQUIRES_SUPERVISION'),
   state:health?'DURABLE_QL454_WITNESS_RECOVERY_READINESS_REVIEW_ONLY':
    'DURABLE_QL454_WITNESS_RECOVERY_EXCEPTION_OPEN',
   originalIncidentId:id,recoveryId,challengeNonce,classification,closureDecision,
   masterCount:3,expiredWitnessRecoveryEvidenced:corrected&&health,
   originalHostContinuityEvidenced:hostHealthy,
   recoveryDigest,boundaryDigest,reportsDigest,
   pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:receipt.recordDigest,
   ownerAcceptance:'DUAL_SIGNED_CEREMONY_READINESS_KEEP_INCIDENT_OPEN_HOLD',
   permittedNextAction:health?
    'SEPARATE_OWNER_GATED_PHYSICAL_OFF_CEREMONY_STILL_REQUIRED':
    'SUPERVISED_WITNESS_RECOVERY_AND_ORIGINAL_HOST_OFF_REQUIRED'};
 }catch{return hold('QL454_DURABLE_RECOVERY_COMMIT_FAILED');}
}
