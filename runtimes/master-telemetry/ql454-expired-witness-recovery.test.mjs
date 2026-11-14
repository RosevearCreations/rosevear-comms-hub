import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl453ExpiryLedger} from './ql453-physical-off-witness-expiry.mjs';
import {openQl454RecoveryLedger,readQl454Recovery,
 runQl454RecoveryReview} from './ql454-expired-witness-recovery.mjs';
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const incidentId='ql454_original_incident_123456';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
function fixture({priorException=true,priorExpired=true,recovered=true,
 hostOn=false,physicalOn=false,lock=true,lease=true,watchdog=true,
 physicalIsolation=true}={}){
 const root=mkdtempSync(join(tmpdir(),'ql454-')),now=Date.now()-500;
 const ql453Ledger=openQl453ExpiryLedger(join(root,'ql453'));
 const recoveryLedger=openQl454RecoveryLedger(join(root,'ql454'));
 const prevPending=ql453Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const prevFinal=ql453Ledger.claimOnce(priorException?'exception':'review',
  incidentId,'b'.repeat(64));
 const prior={state:priorException?'DURABLE_QL453_WITNESS_EXPIRY_EXCEPTION_OPEN':
  'DURABLE_QL453_SIGNED_WITNESS_FRESHNESS_REVIEW_ONLY',
  classification:priorException?'SIGNED_PHYSICAL_OFF_WITNESS_EXPIRED_OR_DIVERGENT_EXCEPTION_OPEN':
   'SIGNED_PHYSICAL_OFF_WITNESS_REVIEW_FRESH_OPEN_HOLD',
  closureDecision:priorException?'ESCALATE_WITNESS_EXPIRY_OR_DIVERGENCE_KEEP_OPEN_HOLD':
   'THREE_MASTER_CLOSURE_PREREQUISITES_REVIEW_ONLY_KEEP_OPEN_HOLD',
  connection:'HOLD',incidentStatus:'OPEN',closureAuthorized:false,
  activationAuthorized:false,physicalReceiverCurrentlyOff:false,masterCount:3,
  originalIncidentId:incidentId,renewalId:'ql453_renewal_abc12345',
  challengeNonce:'ql453_nonce_abcde12345',
  originalWitnessExpiredAtReview:priorException&&priorExpired,
  ownerAcceptance:'DUAL_SIGNED_WITNESS_REASSESSMENT_KEEP_INCIDENT_OPEN_HOLD',
  witnessDigest:'c'.repeat(64),boundaryDigest:'d'.repeat(64),
  reportsDigest:'e'.repeat(64),pendingReceiptDigest:prevPending.recordDigest,
  finalReceiptDigest:prevFinal.recordDigest};
 const recoveryId='ql454_recovery_abc12345',challengeNonce='ql454_nonce_abcde12345';
 const keys={source:key(),recovery:key(),host:key(),anchor:key(),
  physical:key(),authority:key(),sourceOwner:key(),masterOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql454.original-ql453-case.v1',
  incidentId,ql453SummaryDigest:hash(prior),ql453ReceiptDigest:prevFinal.recordDigest,
  ql453WitnessDigest:prior.witnessDigest,incidentStatus:'OPEN_HOLD',
  readAt:iso(now-55000)};
 const previousExpiry=priorException&&priorExpired;
 const response={schema:'rosevear.ql454.independent-expired-witness-recovery.v1',
  incidentId,recoveryId,challengeNonce,ql453ReceiptDigest:prevFinal.recordDigest,
  ql453WitnessDigest:prior.witnessDigest,sourceDigest:hash(source),
  priorExpiry:previousExpiry,
  recoveryDisposition:previousExpiry?
   (recovered?'SIGNED_EXPIRED_WITNESS_RECOVERED_UNDER_HOLD':
    'SIGNED_RECOVERY_UNRESOLVED_KEEP_HOLD'):
   (priorException?'SIGNED_NONEXPIRY_EXCEPTION_UNRESOLVED_KEEP_HOLD':
    'SIGNED_CONTINUITY_RENEWAL_NO_EXPIRY'),
  isolationRecoveryVerified:lock,leaseRecoveryVerified:lease,
  watchdogRecoveryVerified:watchdog,respondedAt:iso(now-53000)};
 const hosts=[];let previousDigest=hash(response),seq=100;
 for(let i=0;i<2;i++){
  const payload={schema:'rosevear.ql454.original-host-renewal-continuity.v1',
   incidentId,recoveryId,challengeNonce,phase:i===0?'BASELINE':'FOLLOWUP',
   sampleIndex:i+1,ql453ReceiptDigest:prevFinal.recordDigest,
   responseDigest:hash(response),sourceDigest:hash(source),
   originalHostId:'DESKTOP-AE894KC',previousDigest,
   receiverState:hostOn&&i===1?'ON':'OFF',
   isolationLock:lock,leaseRevoked:lease,watchdogArmed:watchdog,
   hostSequence:seq+i,observedAt:iso(now+(i===0?-45000:-33000))};
  hosts.push(payload);previousDigest=hash(payload);
 }
 const hostContinuityDigest=hash(hosts);
 const anchor={schema:'rosevear.ql454.independent-recovery-anchor.v1',
  incidentId,recoveryId,challengeNonce,ql453ReceiptDigest:prevFinal.recordDigest,
  sourceDigest:hash(source),responseDigest:hash(response),
  hostContinuityDigest,anchorId:'ql454_external_anchor_abc12345',
  anchorSequence:102,anchorDecision:'HISTORICAL_RECOVERY_ONLY_KEEP_OPEN_HOLD',
  anchoredAt:iso(now-22000)};
 const originalSensorId='ql453_original_sensor_1234';
 const witness={schema:'rosevear.ql454.renewed-physical-recovery-witness.v1',
  incidentId,recoveryId,challengeNonce,ql453ReceiptDigest:prevFinal.recordDigest,
  anchorDigest:hash(anchor),hostContinuityDigest,
  originalHostId:'DESKTOP-AE894KC',receiverId:'ISOLATED_COMMS_RECEIVER',
  sensorId:'ql454_renewed_sensor_12345',originalSensorId,
  receiverState:physicalOn?'ON':'OFF',
  isolationConfirmed:physicalIsolation,observerSequence:103,
  observedAt:iso(now-12000)};
 const healthy=(!priorException||previousExpiry&&recovered)&&!hostOn&&!physicalOn&&
  lock&&lease&&watchdog&&physicalIsolation;
 const classification=healthy?(previousExpiry?
  'SIGNED_HISTORICAL_EXPIRED_WITNESS_RECOVERY_REVIEW_ONLY':
  'SIGNED_HISTORICAL_HOST_CONTINUITY_RENEWAL_REVIEW_ONLY'):
  'SIGNED_WITNESS_RECOVERY_OR_CONTINUITY_EXCEPTION_OPEN';
 const closureDecision=healthy?
  'THREE_MASTER_CEREMONY_READINESS_EVIDENCE_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_RECOVERY_EXCEPTION_KEEP_OPEN_HOLD';
 const recoveryDigest=hash({ql453SummaryDigest:hash(prior),recoveryId,challengeNonce,
  sourceDigest:hash(source),responseDigest:hash(response),hostContinuityDigest,
  anchorDigest:hash(anchor),renewedWitnessDigest:hash(witness),classification});
 const boundary={schema:'rosevear.ql454.independent-ceremony-readiness.v1',
  incidentId,recoveryId,ql453ReceiptDigest:prevFinal.recordDigest,
  recoveryDigest,classification,closureDecision,incidentStatus:'OPEN_HOLD',
  closureAuthorized:false,activationAuthorized:false,
  physicalReceiverCurrentlyOff:false,
  ceremonyAuthorization:'SEPARATE_OWNER_AND_FRESH_PHYSICAL_OFF_REQUIRED',
  attestedAt:iso(now-8000)};
 const boundaryDigest=hash(boundary);
 const votes=MASTERS.map(masterId=>({
  schema:'rosevear.ql454.three-master-ceremony-readiness.v1',
  incidentId,recoveryId,masterId,ql453ReceiptDigest:prevFinal.recordDigest,
  recoveryDigest,boundaryDigest,classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-6000)}));
 const owner={schema:'rosevear.ql454.dual-owner-ceremony-readiness.v1',
  incidentId,recoveryId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql453ReceiptDigest:prevFinal.recordDigest,recoveryDigest,boundaryDigest,
  masterReportsDigest:hash(votes),classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-3000)};
 const envelopes={
  source:signed(source,keys.source),response:signed(response,keys.recovery),
  hosts:hosts.map(h=>signed(h,keys.host)),anchor:signed(anchor,keys.anchor),
  witness:signed(witness,keys.physical),boundary:signed(boundary,keys.authority),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,
   sourceOwnerSignature:signed(owner,keys.sourceOwner).signature,
   masterOwnerSignature:signed(owner,keys.masterOwner).signature}};
 const calls={source:0,recovery:0,host:0,anchor:0,witness:0,boundary:0,masters:0};
 const args={ql453Summary:prior,ql453Ledger,recoveryLedger,recoveryId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl453Case:async()=>{calls.source++;return envelopes.source;}},
  independentRecoveryProvider:{readSignedExpiredWitnessRecovery:async()=>{calls.recovery++;return envelopes.response;}},
  originalHostProvider:{readSignedHostRenewalSamples:async()=>{calls.host++;return envelopes.hosts;}},
  independentAnchorProvider:{readSignedRecoveryAnchor:async()=>{calls.anchor++;return envelopes.anchor;}},
  renewedPhysicalWitnessProvider:{readSignedPhysicalRecoveryWitness:async()=>{calls.witness++;return envelopes.witness;}},
  independentAuthorityProvider:{readSignedClosureCeremonyReadiness:async()=>{calls.boundary++;return envelopes.boundary;}},
  threeMasterProvider:{readSignedClosureReadinessVotes:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owners};
 const opts={nowMs:now,readTrustedNowMs:()=>opts.nowMs,
  trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl453CustodyVerified:true,physicalSensorEnrollmentVerified:true,
  independentSignerPinsVerified:true,separateOwnerRolesVerified:true,originalSensorId,
  commsSourcePin:keys.source.pin,recoveryOfficerPin:keys.recovery.pin,
  originalHostPin:keys.host.pin,externalAnchorPin:keys.anchor.pin,
  renewedWitnessPin:keys.physical.pin,independentAuthorityPin:keys.authority.pin,
  sourceOwnerPin:keys.sourceOwner.pin,masterOwnerPin:keys.masterOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,prior,ql453Ledger,recoveryLedger,recoveryId,challengeNonce,
  source,response,hosts,anchor,witness,boundary,votes,owner,keys,envelopes,args,opts,calls,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.sourceOwner).signature,
   masterOwnerSignature:signed(v,keys.masterOwner).signature};},
  run:()=>runQl454RecoveryReview(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(mutate,reason,config={}){
 const f=fixture(config);try{
  mutate(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL454 signed prior expired witness recovery + original host continuity + fresh independent OFF is historical review only',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL454_WITNESS_RECOVERY_READINESS_REVIEW_ONLY');
  assert.equal(r.expiredWitnessRecoveryEvidenced,true);
  assert.equal(r.originalHostContinuityEvidenced,true);assert.equal(r.masterCount,3);
  assert.equal(r.classification,'SIGNED_HISTORICAL_EXPIRED_WITNESS_RECOVERY_REVIEW_ONLY');
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl454Recovery(f.recoveryLedger,incidentId).state,
   'QL454_DURABLE_RECOVERY_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL454_ONE_USE_RECOVERY_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,recovery:1,host:1,anchor:1,
   witness:1,boundary:1,masters:1});
 }finally{f.cleanup();}
});
test('QL454 predecessor healthy review admits continuity but not fictitious expired-witness recovery',async()=>{
 const f=fixture({priorException:false,priorExpired:false});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL454_WITNESS_RECOVERY_READINESS_REVIEW_ONLY');
  assert.equal(r.expiredWitnessRecoveryEvidenced,false);
  assert.equal(r.classification,'SIGNED_HISTORICAL_HOST_CONTINUITY_RENEWAL_REVIEW_ONLY');
  assert.equal(r.incidentStatus,'OPEN');
 }finally{f.cleanup();}
});
test('QL454 signed unresolved recovery, non-expiry predecessor, ON and compromised isolation escalate',async()=>{
 for(const config of [{recovered:false},{priorExpired:false},{hostOn:true},
  {physicalOn:true},{lock:false},{lease:false},{watchdog:false},
  {physicalIsolation:false}]){
  const f=fixture(config);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL454_WITNESS_RECOVERY_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_WITNESS_RECOVERY_OR_CONTINUITY_EXCEPTION_OPEN');
   assert.equal(r.closureAuthorized,false);assert.equal(r.connection,'HOLD');
   assert.equal(readQl454Recovery(f.recoveryLedger,incidentId).state,
    'QL454_DURABLE_RECOVERY_EXCEPTION_OPEN');
  }finally{f.cleanup();}
 }
});
test('QL454 requires exact QL453 receipt, historical OPEN/HOLD and new nonce',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL454_EXACT_OPEN_QL453_CUSTODY_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.finalReceiptDigest='f'.repeat(64);},
  'QL454_EXACT_OPEN_QL453_CUSTODY_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.classification='SIGNED_CLOSED';},
  'QL454_EXACT_OPEN_QL453_CUSTODY_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL454_EXACT_OPEN_QL453_CUSTODY_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.physicalSensorEnrollmentVerified=false;},
  'QL454_EXACT_OPEN_QL453_CUSTODY_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.renewedWitnessPin=f.opts.originalHostPin;},
  'QL454_ELEVEN_DISTINCT_SIGNER_PINS_REQUIRED');
});
test('QL454 original Comms source and independent expiry recovery must be fresh and cryptographically distinct',async()=>{
 await rejected(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL454_ORIGINAL_CASE_SIGNED_MISMATCH');
 await rejected(f=>{f.envelopes.source=signed({...f.source,
  readAt:iso(f.now-65000)},f.keys.source);},
  'QL454_ORIGINAL_CASE_SIGNED_MISMATCH');
 await rejected(f=>{f.envelopes.response=signed({...f.response,
  recoveryDisposition:'AUTHORIZE_CLOSURE'},f.keys.recovery);},
  'QL454_SIGNED_INDEPENDENT_RECOVERY_INVALID');
 await rejected(f=>{f.envelopes.response=signed({...f.response,
  priorExpiry:false},f.keys.recovery);},
  'QL454_SIGNED_INDEPENDENT_RECOVERY_INVALID');
 await rejected(f=>{f.envelopes.response.signature=f.envelopes.source.signature;},
  'QL454_SIGNED_INDEPENDENT_RECOVERY_INVALID');
 await rejected(f=>{f.args.independentRecoveryProvider.readSignedExpiredWitnessRecovery=
  async()=>{throw Error('offline');};},
  'QL454_INDEPENDENT_RECOVERY_RESPONSE_UNAVAILABLE');
});
test('QL454 original Windows host has exact sequence, 10 second spacing and unbroken signed hash chain',async()=>{
 await rejected(f=>{f.envelopes.hosts.pop();},
  'QL454_TWO_SIGNED_HOST_RENEWAL_SAMPLES_REQUIRED');
 await rejected(f=>{f.envelopes.hosts[0]=signed({...f.hosts[0],
  originalHostId:'TEMPLAR'},f.keys.host);},
  'QL454_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],
  hostSequence:100},f.keys.host);},
  'QL454_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],
  observedAt:iso(f.now-37001)},f.keys.host);},
  'QL454_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],
  previousDigest:'f'.repeat(64)},f.keys.host);},
  'QL454_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.envelopes.hosts[1].signature=f.envelopes.response.signature;},
  'QL454_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
});
test('QL454 independently signed anchor must bind both original-host renewals and recovery',async()=>{
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  hostContinuityDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL454_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  anchorDecision:'CLOSE_INCIDENT'},f.keys.anchor);},
  'QL454_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 await rejected(f=>{f.envelopes.anchor.signature=f.envelopes.hosts[1].signature;},
  'QL454_INDEPENDENT_SIGNED_ANCHOR_INVALID');
});
test('QL454 independent renewed physical witness must be fresh and distinctly enrolled',async()=>{
 await rejected(f=>{f.envelopes.witness=signed({...f.witness,
  observedAt:iso(f.now-16000)},f.keys.physical);},
  'QL454_INDEPENDENT_RENEWAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.witness=signed({...f.witness,
  sensorId:f.opts.originalSensorId},f.keys.physical);},
  'QL454_INDEPENDENT_RENEWAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.witness=signed({...f.witness,
  originalSensorId:'wrong_original_sensor'},f.keys.physical);},
  'QL454_INDEPENDENT_RENEWAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.witness=signed({...f.witness,
  hostContinuityDigest:'f'.repeat(64)},f.keys.physical);},
  'QL454_INDEPENDENT_RENEWAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.witness=signed({...f.witness,
  observerSequence:102},f.keys.physical);},
  'QL454_INDEPENDENT_RENEWAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.witness.signature=f.envelopes.anchor.signature;},
  'QL454_INDEPENDENT_RENEWAL_WITNESS_INVALID_OR_STALE');
});
test('QL454 independent closure-ceremony readiness explicitly prohibits live OFF, closure or activation',async()=>{
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  closureAuthorized:true},f.keys.authority);},
  'QL454_INDEPENDENT_CEREMONY_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  activationAuthorized:true},f.keys.authority);},
  'QL454_INDEPENDENT_CEREMONY_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  physicalReceiverCurrentlyOff:true},f.keys.authority);},
  'QL454_INDEPENDENT_CEREMONY_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  ceremonyAuthorization:'PERMITTED'},f.keys.authority);},
  'QL454_INDEPENDENT_CEREMONY_AUTHORITY_VETO');
});
test('QL454 three distinct Master closure-readiness votes and dual-owner signatures must agree on HOLD',async()=>{
 await rejected(f=>{f.envelopes.votes.pop();},
  'QL454_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 await rejected(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL454_THREE_MASTER_SIGNED_READINESS_VETO');
 await rejected(f=>{f.envelopes.votes[2]=signed({...f.votes[2],
  closureDecision:'CLOSE_NOW'},f.keys.masters[MASTERS[2]]);},
  'QL454_THREE_MASTER_SIGNED_READINESS_VETO');
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL454_DUAL_OWNER_SIGNED_READINESS_VETO');
 await rejected(f=>{f.setOwners({...f.owner,
  masterOwnerId:f.owner.sourceOwnerId});},
  'QL454_DUAL_OWNER_SIGNED_READINESS_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},
  'QL454_DUAL_OWNER_SIGNED_READINESS_VETO');
});
test('QL454 independently trusted final clock detects renewal witness expiry before committing',async()=>{
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+4000;},
  'QL454_PROTECTED_CUSTODY_OR_RENEWED_WITNESS_EXPIRED');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now-500;},
  'QL454_TRUSTED_CLOCK_DRIFT');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>{throw Error('clock');};},
  'QL454_FINAL_CLOCK_UNAVAILABLE');
});
test('QL454 interrupted signed remote intake burns one-use PENDING and requires manual recovery',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl453Case=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL454_ORIGINAL_QL453_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL454_ONE_USE_RECOVERY_ALREADY_ATTEMPTED');
  assert.equal(readQl454Recovery(f.recoveryLedger,incidentId).reason,
   'QL454_PENDING_SUPERVISED_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL454 tampered private receipts and unsafe directory stay HOLD',async()=>{
 const f=fixture();try{
  f.recoveryLedger.claimOnce('pending',incidentId,'a'.repeat(64));
  writeFileSync(join(f.root,'ql454','ql454-pending-'+incidentId+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL454_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl454Recovery(f.recoveryLedger,incidentId).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl454RecoveryLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
