import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl454RecoveryLedger} from './ql454-expired-witness-recovery.mjs';
import {openQl455FreshnessLedger,readQl455Freshness,
 runQl455FreshnessReview} from './ql455-recovery-freshness-authority-expiry.mjs';
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const incidentId='ql455_original_incident_123456';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
function fixture({priorException=false,recoveryExpired=false,ceremonyExpired=false,
 hostOn=false,witnessOn=false,recovered=true,lock=true,lease=true,watchdog=true,
 physicalIsolation=true}={}){
 const root=mkdtempSync(join(tmpdir(),'ql455-')),now=Date.now()-500;
 const ql454Ledger=openQl454RecoveryLedger(join(root,'ql454'));
 const freshnessLedger=openQl455FreshnessLedger(join(root,'ql455'));
 const pending=ql454Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const priorOutcome=ql454Ledger.claimOnce(priorException?'exception':'review',incidentId,'b'.repeat(64));
 const prior={state:priorException?'DURABLE_QL454_WITNESS_RECOVERY_EXCEPTION_OPEN':
  'DURABLE_QL454_WITNESS_RECOVERY_READINESS_REVIEW_ONLY',
  originalIncidentId:incidentId,recoveryId:'ql454_recovery_abc12345',
  challengeNonce:'ql454_nonce_abcde12345',
  classification:priorException?'SIGNED_WITNESS_RECOVERY_OR_CONTINUITY_EXCEPTION_OPEN':
   'SIGNED_HISTORICAL_EXPIRED_WITNESS_RECOVERY_REVIEW_ONLY',
  closureDecision:priorException?'ESCALATE_RECOVERY_EXCEPTION_KEEP_OPEN_HOLD':
   'THREE_MASTER_CEREMONY_READINESS_EVIDENCE_ONLY_KEEP_OPEN_HOLD',
  connection:'HOLD',incidentStatus:'OPEN',activationAuthorized:false,
  closureAuthorized:false,physicalReceiverCurrentlyOff:false,masterCount:3,
  expiredWitnessRecoveryEvidenced:!priorException,
  originalHostContinuityEvidenced:!priorException,
  ownerAcceptance:'DUAL_SIGNED_CEREMONY_READINESS_KEEP_INCIDENT_OPEN_HOLD',
  pendingReceiptDigest:pending.recordDigest,
  finalReceiptDigest:priorOutcome.recordDigest,
  recoveryDigest:'c'.repeat(64),boundaryDigest:'d'.repeat(64),
  reportsDigest:'e'.repeat(64)};
 const monitorId='ql455_monitor_abc123456',challengeNonce='ql455_nonce_abcde12345';
 const keys={source:key(),recovery:key(),host:key(),anchor:key(),witness:key(),
  ceremony:key(),gate:key(),owner:key(),masterOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const p={schema:'rosevear.ql455.original-ql454-case.v1',
  incidentId,ql454SummaryDigest:digest(prior),ql454ReceiptDigest:priorOutcome.recordDigest,
  ql454RecoveryDigest:prior.recoveryDigest,incidentStatus:'OPEN_HOLD',
  readAt:iso(now-12000)};
 const r={schema:'rosevear.ql455.independent-recovery-outcome.v1',
  incidentId,monitorId,challengeNonce,ql454ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryStatus:recovered?'RECOVERED_UNDER_HOLD':'UNRESOLVED_OPEN_HOLD',
  recoveryIssuedAt:iso(now-11500),
  recoveryExpiresAt:iso(now+(recoveryExpired?-100:10000)),
  signedAt:iso(now-11000)};
 const h={schema:'rosevear.ql455.original-host-off-review.v1',
  incidentId,monitorId,challengeNonce,ql454ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryDigest:digest(r),originalHostId:'DESKTOP-AE894KC',
  hostReceiverState:hostOn?'ON':'OFF',isolationLock:lock,leaseRevoked:lease,
  watchdogArmed:watchdog,hostSequence:100,observedAt:iso(now-10000)};
 const a={schema:'rosevear.ql455.independent-freshness-anchor.v1',
  incidentId,monitorId,challengeNonce,ql454ReceiptDigest:priorOutcome.recordDigest,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorId:'ql455_external_anchor_abc12345',anchorSequence:101,
  anchorDisposition:'HISTORICAL_MONITOR_ONLY_OPEN_HOLD',anchoredAt:iso(now-9000)};
 const originalSensorId='ql454_original_sensor_12345';
 const w={schema:'rosevear.ql455.physical-recurrence-witness.v1',
  incidentId,monitorId,challengeNonce,ql454ReceiptDigest:priorOutcome.recordDigest,
  anchorDigest:digest(a),recoveryDigest:digest(r),hostDigest:digest(h),
  originalHostId:'DESKTOP-AE894KC',receiverId:'ISOLATED_COMMS_RECEIVER',
  sensorId:'ql455_new_sensor_abc12345',originalSensorId,
  receiverState:witnessOn?'ON':'OFF',isolationConfirmed:physicalIsolation,
  observerSequence:102,observedAt:iso(now-3000)};
 const c={schema:'rosevear.ql455.historical-ceremony-authority.v1',
  incidentId,monitorId,ql454ReceiptDigest:priorOutcome.recordDigest,
  recoveryDigest:digest(r),ceremonyId:'ql455_historical_ceremony_12345',
  issuedAt:iso(now-10500),expiresAt:iso(now+(ceremonyExpired?-100:10000)),
  authorityDecision:'HISTORICAL_READINESS_ONLY_NO_CLOSURE',
  incidentStatus:'OPEN_HOLD',closureAuthorized:false,
  activationAuthorized:false,physicalReceiverCurrentlyOff:false};
 const health=!priorException&&!recoveryExpired&&!ceremonyExpired&&!hostOn&&!witnessOn&&
  recovered&&lock&&lease&&watchdog&&physicalIsolation;
 const classification=health?'SIGNED_RECOVERY_AND_CEREMONY_FRESHNESS_REVIEW_ONLY':
  'SIGNED_RECOVERY_EXPIRY_OR_OFF_RECURRENCE_EXCEPTION_OPEN';
 const closureDecision=health?'REVERIFY_THREE_MASTER_READINESS_ONLY_KEEP_INCIDENT_OPEN_HOLD':
  'ESCALATE_EXPIRED_AUTHORITY_OR_RECURRENCE_KEEP_INCIDENT_OPEN_HOLD';
 const monitorDigest=digest({ql454SummaryDigest:digest(prior),monitorId,challengeNonce,
  sourceDigest:digest(p),recoveryDigest:digest(r),hostDigest:digest(h),
  anchorDigest:digest(a),witnessDigest:digest(w),ceremonyDigest:digest(c),
  recoveryExpired,ceremonyExpired,classification});
 const g={schema:'rosevear.ql455.independent-ceremony-expiry-gate.v1',
  incidentId,monitorId,ql454ReceiptDigest:priorOutcome.recordDigest,
  monitorDigest,classification,closureDecision,incidentStatus:'OPEN_HOLD',
  closureAuthorized:false,activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  separateCeremonyRequired:true,attestedAt:iso(now-2000)};
 const gateDigest=digest(g);
 const votes=MASTERS.map(masterId=>({
  schema:'rosevear.ql455.three-master-expiry-review.v1',
  incidentId,monitorId,masterId,ql454ReceiptDigest:priorOutcome.recordDigest,
  monitorDigest,gateDigest,classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1500)}));
 const owner={schema:'rosevear.ql455.dual-owner-expiry-review.v1',
  incidentId,monitorId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql454ReceiptDigest:priorOutcome.recordDigest,monitorDigest,gateDigest,
  masterReportsDigest:digest(votes),classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1000)};
 const env={source:signed(p,keys.source),recovery:signed(r,keys.recovery),
  host:signed(h,keys.host),anchor:signed(a,keys.anchor),witness:signed(w,keys.witness),
  ceremony:signed(c,keys.ceremony),gate:signed(g,keys.gate),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.masterOwner).signature}};
 const args={ql454Summary:prior,ql454Ledger,freshnessLedger,monitorId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl454Case:async()=>env.source},
  independentRecoveryProvider:{readSignedRecoveryOutcome:async()=>env.recovery},
  originalHostProvider:{readSignedOriginalHostOffReview:async()=>env.host},
  independentAnchorProvider:{readSignedFreshnessAnchor:async()=>env.anchor},
  independentPhysicalProvider:{readSignedPhysicalRecurrenceWitness:async()=>env.witness},
  ceremonyAuthorityProvider:{readSignedHistoricalCeremonyAuthority:async()=>env.ceremony},
  independentGateProvider:{readSignedIndependentClosureGate:async()=>env.gate},
  threeMasterProvider:{readSignedCeremonyExpiryVotes:async()=>env.votes},
  finalOwnerDecision:env.owners};
 const opts={nowMs:now,readTrustedNowMs:()=>opts.nowMs,
  trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl454CustodyVerified:true,physicalSensorEnrollmentVerified:true,
  independentSignerPinsVerified:true,separateOwnerRolesVerified:true,
  originalSensorId,commsSourcePin:keys.source.pin,recoveryOfficerPin:keys.recovery.pin,
  originalHostPin:keys.host.pin,externalAnchorPin:keys.anchor.pin,
  physicalObserverPin:keys.witness.pin,ceremonyAuthorityPin:keys.ceremony.pin,
  independentGatePin:keys.gate.pin,sourceOwnerPin:keys.owner.pin,
  masterOwnerPin:keys.masterOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,prior,ql454Ledger,freshnessLedger,monitorId,challengeNonce,
  p,r,h,a,w,c,g,votes,owner,keys,env,args,opts,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.owner).signature,
   masterOwnerSignature:signed(v,keys.masterOwner).signature};},
  run:()=>runQl455FreshnessReview(args,opts),
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
test('QL455 independent signed recovery, physical OFF and historical authority yield review only OPEN/HOLD',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL455_RECOVERY_FRESHNESS_REVIEW_ONLY');
  assert.equal(r.masterCount,3);assert.equal(r.ceremonyAuthorityExpiredAtReview,false);
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.connection,'HOLD');
  assert.equal(readQl455Freshness(f.freshnessLedger,incidentId).state,
   'QL455_DURABLE_RECOVERY_FRESHNESS_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL455_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
 }finally{f.cleanup();}
});
test('QL455 signed recovery expiry, ceremony authority expiry, physical ON and host-control recurrence escalate',async()=>{
 for(const config of [{recoveryExpired:true},{ceremonyExpired:true},{hostOn:true},
  {witnessOn:true},{lock:false},{lease:false},{watchdog:false},
  {physicalIsolation:false},{recovered:false},{priorException:true}]){
  const f=fixture(config);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL455_RECOVERY_EXPIRY_OR_OFF_RECURRENCE_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_RECOVERY_EXPIRY_OR_OFF_RECURRENCE_EXCEPTION_OPEN');
   assert.equal(r.closureAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
   assert.equal(readQl455Freshness(f.freshnessLedger,incidentId).state,
    'QL455_DURABLE_AUTHORITY_EXPIRY_OR_RECURRENCE_EXCEPTION_OPEN');
  }finally{f.cleanup();}
 }
});
test('QL455 validates original QL454 private custody, holder nonce and twelve separate signer pins',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},'QL455_EXACT_QL454_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.prior.finalReceiptDigest='f'.repeat(64);},'QL455_EXACT_QL454_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},'QL455_EXACT_QL454_OPEN_CASE_REQUIRED');
 await rejected(f=>{f.opts.originalHostPin=f.opts.physicalObserverPin;},'QL455_TWELVE_DISTINCT_SIGNER_PINS_REQUIRED');
});
test('QL455 original source, recovery provenance, expiry interval and Ed25519 must verify',async()=>{
 await rejected(f=>{f.env.source.payload.incidentStatus='CLOSED';},'QL455_ORIGINAL_SIGNED_CASE_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,recoveryStatus:'CLOSED'},f.keys.recovery);},
  'QL455_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery=signed({...f.r,
  recoveryExpiresAt:iso(f.now-50000)},f.keys.recovery);},
  'QL455_SIGNED_RECOVERY_OUTCOME_INVALID');
 await rejected(f=>{f.env.recovery.signature=f.env.source.signature;},
  'QL455_SIGNED_RECOVERY_OUTCOME_INVALID');
});
test('QL455 original Windows host, independent anchor, recurrence sensor and witness age are scoped and signed',async()=>{
 await rejected(f=>{f.env.host=signed({...f.h,originalHostId:'TEMPLAR'},f.keys.host);},
  'QL455_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.env.anchor=signed({...f.a,hostDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL455_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 await rejected(f=>{f.env.witness=signed({...f.w,observedAt:iso(f.now-16000)},f.keys.witness);},
  'QL455_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,sensorId:f.opts.originalSensorId},f.keys.witness);},
  'QL455_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.env.witness=signed({...f.w,receiverId:'WRONG_RECEIVER'},f.keys.witness);},
  'QL455_INDEPENDENT_RECURRENCE_WITNESS_INVALID_OR_STALE');
});
test('QL455 historical ceremony authority can expire, but cannot permit closure or activation',async()=>{
 await rejected(f=>{f.env.ceremony=signed({...f.c,closureAuthorized:true},f.keys.ceremony);},
  'QL455_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,authorityDecision:'AUTHORIZE_ON'},f.keys.ceremony);},
  'QL455_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
 await rejected(f=>{f.env.ceremony=signed({...f.c,expiresAt:iso(f.now-50000)},f.keys.ceremony);},
  'QL455_CEREMONY_AUTHORITY_SIGNED_PROVENANCE_INVALID');
});
test('QL455 independent gate, three Master votes and both owners cannot override OPEN/HOLD',async()=>{
 await rejected(f=>{f.env.gate=signed({...f.g,closureAuthorized:true},f.keys.gate);},
  'QL455_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 await rejected(f=>{f.env.gate=signed({...f.g,physicalReceiverCurrentlyOff:true},f.keys.gate);},
  'QL455_INDEPENDENT_CLOSURE_EXPIRY_GATE_VETO');
 await rejected(f=>{f.env.votes.pop();},'QL455_THREE_DISTINCT_MASTERS_REQUIRED');
 await rejected(f=>{f.env.votes[1]=f.env.votes[0];},'QL455_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.env.votes[2]=signed({...f.votes[2],
  closureDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL455_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL455_DUAL_OWNER_EXPIRY_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},'QL455_DUAL_OWNER_EXPIRY_VETO');
});
test('QL455 independent final clock prevents accepting expired recovery/authority and stale physical witness',async()=>{
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+22000;},
  'QL455_PROTECTED_CUSTODY_OR_INDEPENDENT_OFF_EXPIRED');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+11000;},
  'QL455_RECOVERY_OR_CEREMONY_EXPIRED_DURING_REVIEW');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now-1;},'QL455_TRUSTED_CLOCK_DRIFT');
});
test('QL455 interrupted external source read leaves immutable pending and no silent rerun',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl454Case=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL455_ORIGINAL_CASE_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL455_ONE_USE_MONITOR_ALREADY_ATTEMPTED');
  assert.equal(readQl455Freshness(f.freshnessLedger,incidentId).reason,
   'QL455_PENDING_MANUAL_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL455 corrupted private custody and unsafe directory reject intake',async()=>{
 const f=fixture();try{
  f.freshnessLedger.claimOnce('pending',incidentId,'f'.repeat(64));
  writeFileSync(join(f.root,'ql455','ql455-pending-'+incidentId+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL455_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl455Freshness(f.freshnessLedger,incidentId).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl455FreshnessLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
