import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl455FreshnessLedger} from './ql455-recovery-freshness-authority-expiry.mjs';
import {openQl456ClosureLedger,readQl456Closure,
 runQl456ClosureReview} from './ql456-escalation-reenrollment-closure-evidence.mjs';
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const incidentId='ql456_original_incident_123456';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
function fixture({priorException=false,recoveryExpired=false,ceremonyExpired=false,reenrollmentPending=false,
 hostOn=false,witnessOn=false,recovered=true,lock=true,lease=true,watchdog=true,
 physicalIsolation=true}={}){
 const root=mkdtempSync(join(tmpdir(),'ql456-')),now=Date.now()-500;
 const ql455Ledger=openQl455FreshnessLedger(join(root,'ql455'));
 const closureLedger=openQl456ClosureLedger(join(root,'ql456'));
 const pending=ql455Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const priorOutcome=ql455Ledger.claimOnce(priorException?'exception':'review',incidentId,'b'.repeat(64));
 const prior={state:priorException?'DURABLE_QL455_RECOVERY_EXPIRY_OR_OFF_RECURRENCE_EXCEPTION_OPEN':'DURABLE_QL455_RECOVERY_FRESHNESS_REVIEW_ONLY',
 originalIncidentId:incidentId,monitorId:'ql455_prior_monitor_123456',challengeNonce:'ql455_prior_nonce_123456',
 classification:priorException?'SIGNED_RECOVERY_EXPIRY_OR_OFF_RECURRENCE_EXCEPTION_OPEN':'SIGNED_RECOVERY_AND_CEREMONY_FRESHNESS_REVIEW_ONLY',
 closureDecision:priorException?'ESCALATE_EXPIRED_AUTHORITY_OR_RECURRENCE_KEEP_INCIDENT_OPEN_HOLD':'REVERIFY_THREE_MASTER_READINESS_ONLY_KEEP_INCIDENT_OPEN_HOLD',
 connection:'HOLD',incidentStatus:'OPEN',activationAuthorized:false,closureAuthorized:false,physicalReceiverCurrentlyOff:false,
 masterCount:3,recoveryExpiredAtReview:priorException,ceremonyAuthorityExpiredAtReview:priorException,
 ownerAcceptance:'DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD',pendingReceiptDigest:pending.recordDigest,
 finalReceiptDigest:priorOutcome.recordDigest,monitorDigest:'c'.repeat(64),gateDigest:'d'.repeat(64),reportsDigest:'e'.repeat(64)};
 const monitorId='ql456_monitor_abc123456',challengeNonce='ql456_nonce_abcde12345';
 const keys={source:key(),recovery:key(),host:key(),anchor:key(),witness:key(),
  ceremony:key(),gate:key(),owner:key(),masterOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const p={schema:'rosevear.ql456.original-ql455-case.v1',
  incidentId,ql455SummaryDigest:digest(prior),ql455ReceiptDigest:priorOutcome.recordDigest,
  ql455MonitorDigest:prior.monitorDigest,incidentStatus:'OPEN_HOLD',
  readAt:iso(now-12000)};
 const r={schema:'rosevear.ql456.independent-recovery-outcome.v1',
  incidentId,monitorId,challengeNonce,ql455ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryStatus:recovered?'ESCALATION_OUTCOME_ATTESTED_OPEN_HOLD':'UNRESOLVED_OPEN_HOLD',
  recoveryIssuedAt:iso(now-11500),
  recoveryExpiresAt:iso(now+(recoveryExpired?-100:10000)),
  signedAt:iso(now-11000)};
 const h={schema:'rosevear.ql456.original-host-off-review.v1',
  incidentId,monitorId,challengeNonce,ql455ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryDigest:digest(r),originalHostId:'DESKTOP-AE894KC',
  hostReceiverState:hostOn?'ON':'OFF',isolationLock:lock,leaseRevoked:lease,
  watchdogArmed:watchdog,hostSequence:100,observedAt:iso(now-10000)};
 const a={schema:'rosevear.ql456.independent-freshness-anchor.v1',
  incidentId,monitorId,challengeNonce,ql455ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorId:'ql456_external_anchor_abc12345',anchorSequence:101,
  anchorDisposition:'HISTORICAL_MONITOR_ONLY_OPEN_HOLD',anchoredAt:iso(now-9000)};
 const originalSensorId='ql455_original_sensor_12345';
 const w={schema:'rosevear.ql456.physical-recurrence-witness.v1',
  incidentId,monitorId,challengeNonce,ql455ReceiptDigest:priorOutcome.recordDigest,
  anchorDigest:digest(a),recoveryDigest:digest(r),hostDigest:digest(h),
  originalHostId:'DESKTOP-AE894KC',receiverId:'ISOLATED_COMMS_RECEIVER',
  sensorId:'ql456_new_sensor_abc12345',originalSensorId,
  receiverState:witnessOn?'ON':'OFF',isolationConfirmed:physicalIsolation,
  observerSequence:102,observedAt:iso(now-3000)};
 const c={schema:'rosevear.ql456.historical-ceremony-authority.v1',
  incidentId,monitorId,ql455ReceiptDigest:priorOutcome.recordDigest,
  recoveryDigest:digest(r),ceremonyId:'ql456_historical_ceremony_12345',
  issuedAt:iso(now-10500),expiresAt:iso(now+(ceremonyExpired?-100:10000)),
  previousCeremonyId:'ql455_old_ceremony_12345',
  reEnrollmentStatus:reenrollmentPending?'PENDING_REENROLLMENT_OPEN_HOLD':'REENROLLED_REVIEW_ONLY',
  enrollmentRecordDigest:'f'.repeat(64),
  authorityDecision:'REENROLLED_HISTORICAL_READINESS_ONLY_NO_CLOSURE',
  incidentStatus:'OPEN_HOLD',closureAuthorized:false,
  activationAuthorized:false,physicalReceiverCurrentlyOff:false};
 const health=!priorException&&!recoveryExpired&&!ceremonyExpired&&!reenrollmentPending&&
  !hostOn&&!witnessOn&&
  recovered&&lock&&lease&&watchdog&&physicalIsolation;
 const classification=health?'SIGNED_ESCALATION_OUTCOME_REENROLLMENT_REVIEW_ONLY':
  'SIGNED_ESCALATION_REENROLLMENT_OR_RECURRENCE_EXCEPTION_OPEN';
 const closureDecision=health?'RENEW_THREE_MASTER_CLOSURE_EVIDENCE_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_UNRESOLVED_OUTCOME_OR_REENROLLMENT_KEEP_INCIDENT_OPEN_HOLD';
 const monitorDigest=digest({ql455SummaryDigest:digest(prior),monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorDigest:digest(a),witnessDigest:digest(w),ceremonyDigest:digest(c),
  recoveryExpired,ceremonyExpired,classification});
 const g={schema:'rosevear.ql456.independent-ceremony-expiry-gate.v1',
  incidentId,monitorId,ql455ReceiptDigest:priorOutcome.recordDigest,
  monitorDigest,classification,closureDecision,incidentStatus:'OPEN_HOLD',
  closureAuthorized:false,activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  separateCeremonyRequired:true,attestedAt:iso(now-2000)};
 const gateDigest=digest(g);
 const votes=MASTERS.map(masterId=>({
  schema:'rosevear.ql456.three-master-expiry-review.v1',
  incidentId,monitorId,masterId,ql455ReceiptDigest:priorOutcome.recordDigest,
  monitorDigest,gateDigest,classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1500)}));
 const owner={schema:'rosevear.ql456.dual-owner-expiry-review.v1',
  incidentId,monitorId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql455ReceiptDigest:priorOutcome.recordDigest,monitorDigest,gateDigest,
  masterReportsDigest:digest(votes),classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1000)};
 const env={source:signed(p,keys.source),recovery:signed(r,keys.recovery),
  host:signed(h,keys.host),anchor:signed(a,keys.anchor),witness:signed(w,keys.witness),
  ceremony:signed(c,keys.ceremony),gate:signed(g,keys.gate),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.masterOwner).signature}};
 const args={ql455Summary:prior,ql455Ledger,closureLedger,monitorId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl455Case:async()=>env.source},
  independentRecoveryProvider:{readSignedRecoveryOutcome:async()=>env.recovery},
  originalHostProvider:{readSignedOriginalHostOffReview:async()=>env.host},
  independentAnchorProvider:{readSignedClosureAnchor:async()=>env.anchor},
  independentPhysicalProvider:{readSignedPhysicalRecurrenceWitness:async()=>env.witness},
  ceremonyAuthorityProvider:{readSignedHistoricalCeremonyAuthority:async()=>env.ceremony},
  independentGateProvider:{readSignedIndependentClosureGate:async()=>env.gate},
  threeMasterProvider:{readSignedCeremonyExpiryVotes:async()=>env.votes},
  finalOwnerDecision:env.owners};
 const opts={nowMs:now,readTrustedNowMs:()=>opts.nowMs,
  trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl455CustodyVerified:true,physicalSensorEnrollmentVerified:true,
  independentSignerPinsVerified:true,separateOwnerRolesVerified:true,
  originalSensorId,priorCeremonyId:'ql455_old_ceremony_12345',commsSourcePin:keys.source.pin,recoveryOfficerPin:keys.recovery.pin,
  originalHostPin:keys.host.pin,externalAnchorPin:keys.anchor.pin,
  physicalObserverPin:keys.witness.pin,ceremonyAuthorityPin:keys.ceremony.pin,
  independentGatePin:keys.gate.pin,sourceOwnerPin:keys.owner.pin,
  masterOwnerPin:keys.masterOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,prior,ql455Ledger,closureLedger,monitorId,challengeNonce,
  p,r,h,a,w,c,g,votes,owner,keys,env,args,opts,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.owner).signature,
   masterOwnerSignature:signed(v,keys.masterOwner).signature};},
  run:()=>runQl456ClosureReview(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(change,reason,config={}){
 const f=fixture(config);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL456 independent signed recovery, physical OFF and historical authority yield review only OPEN/HOLD',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL456_RECURRENCE_CLOSURE_EVIDENCE_RENEWAL_REVIEW_ONLY');
  assert.equal(r.masterCount,3);assert.equal(r.ceremonyAuthorityExpiredAtReview,false);
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.connection,'HOLD');
  assert.equal(readQl456Closure(f.closureLedger,incidentId).state,
   'QL456_DURABLE_CLOSURE_EVIDENCE_RENEWAL_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL456_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
 }finally{f.cleanup();}
});
test('QL456 signed recovery expiry, ceremony authority expiry, physical ON and host-control recurrence escalate',async()=>{
 for(const config of [{recoveryExpired:true},{ceremonyExpired:true},{reenrollmentPending:true},{hostOn:true},
  {witnessOn:true},{lock:false},{lease:false},{watchdog:false},
  {physicalIsolation:false},{recovered:false},{priorException:true}]){
  const f=fixture(config);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL456_ESCALATION_OR_REENROLLMENT_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_ESCALATION_REENROLLMENT_OR_RECURRENCE_EXCEPTION_OPEN');
   assert.equal(r.closureAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
   assert.equal(readQl456Closure(f.closureLedger,incidentId).state,
    'QL456_DURABLE_ESCALATION_REENROLLMENT_EXCEPTION_OPEN');
  }finally{f.cleanup();}
 }
});
test('QL456 validates original QL455 private custody, holder nonce and twelve separate signer pins',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},'QL456_EXACT_QL455_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.prior.finalReceiptDigest='f'.repeat(64);},'QL456_EXACT_QL455_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},'QL456_EXACT_QL455_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.opts.originalHostPin=f.opts.physicalObserverPin;},'QL456_TWELVE_DISTINCT_SIGNER_PINS_REQUIRED');
});
test('QL456 original source, recovery provenance, expiry interval and Ed25519 must verify',async()=>{
 await rejected(f=>{f.env.source.payload.incidentStatus='CLOSED';},'QL456_ORIGINAL_SIGNED_CASE_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,recoveryStatus:'CLOSED'},f.keys.recovery);},
  'QL456_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,
  recoveryExpiresAt:iso(f.now-50000)},f.keys.recovery);},
  'QL456_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery.signature=f.env.source.signature;},
  'QL456_SIGNED_RECOVERY_OUTCOME_INVALID');
});
test('QL456 original Windows host, independent anchor, recurrence sensor and witness age are scoped and signed',async()=>{
 await rejected(f=>{f.env.host=signed({...f.h,originalHostId:'TEMPLAR'},f.keys.host);},
  'QL456_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.env.anchor=signed({...f.a,hostDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL456_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 await rejected(f=>{f.env.witness=signed({...f.w,observedAt:iso(f.now-16000)},f.keys.witness);},
  'QL456_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,sensorId:f.opts.originalSensorId},f.keys.witness);},
  'QL456_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,receiverId:'WRONG_RECEIVER'},f.keys.witness);},
  'QL456_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
});
test('QL456 historical ceremony authority can expire, but cannot permit closure or activation',async()=>{
 await rejected(f=>{f.env.ceremony=signed({...f.c,previousCeremonyId:'INVALID_OLD'},f.keys.ceremony);},'QL456_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,ceremonyId:f.opts.priorCeremonyId},f.keys.ceremony);},'QL456_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,closureAuthorized:true},f.keys.ceremony);},
  'QL456_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,authorityDecision:'AUTHORIZE_ON'},f.keys.ceremony);},
  'QL456_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,expiresAt:iso(f.now-50000)},f.keys.ceremony);},
  'QL456_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
});
test('QL456 independent gate, three Master votes and both owners cannot override OPEN/HOLD',async()=>{
 await rejected(f=>{f.env.gate=signed({...f.g,closureAuthorized:true},f.keys.gate);},
  'QL456_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 await rejected(f=>{f.env.gate=signed({...f.g,physicalReceiverCurrentlyOff:true},f.keys.gate);},
  'QL456_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 await rejected(f=>{f.env.votes.pop();},'QL456_THREE_DISTINCT_MASTERS_REQUIRED');
 await rejected(f=>{f.env.votes[1]=f.env.votes[0];},'QL456_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.env.votes[2]=signed({...f.votes[2],
  closureDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL456_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL456_DUAL_OWNER_EXPIRY_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},'QL456_DUAL_OWNER_EXPIRY_VETO');
});
test('QL456 independent final clock prevents accepting expired recovery/authority and stale physical witness',async()=>{
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+22000;},
  'QL456_PROTECTED_CUSTODY_OR_INDEPENDENT_OFF_EXPIRED');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+11000;},
  'QL456_RECOVERY_OR_CEREMONY_EXPIRED_DURING_REVIEW');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now-1;},'QL456_TRUSTED_CLOCK_DRIFT');
});
test('QL456 interrupted external source read leaves immutable pending and no silent rerun',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl455Case=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL456_ORIGINAL_CASE_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL456_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
  assert.equal(readQl456Closure(f.closureLedger,incidentId).reason,
   'QL456_PENDING_MANUAL_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL456 corrupted private custody and unsafe directory reject intake',async()=>{
 const f=fixture();try{
  f.closureLedger.claimOnce('pending',incidentId,'f'.repeat(64));
  writeFileSync(join(f.root,'ql456','ql456-pending-'+incidentId+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL456_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl456Closure(f.closureLedger,incidentId).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl456ClosureLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
