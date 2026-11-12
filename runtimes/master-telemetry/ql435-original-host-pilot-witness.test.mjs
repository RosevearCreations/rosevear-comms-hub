import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl431ProtectedContinuityStore} from './ql431-post-reentry-continuity.mjs';
import {openQl432ProtectedRecoveryReviewLedger} from './ql432-external-incident-recovery.mjs';
import {openQl433ProtectedPrecheckLedger} from './ql433-recovery-decision-handoff.mjs';
import {openQl434ProtectedReadinessLedger} from './ql434-protected-ceremony-readiness.mjs';
import {openQl435ProtectedPilotLedger,prepareQl435OriginalHostEnrollment,
 runQl435OriginalHostPilotDecision} from './ql435-original-host-pilot-witness.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const keys=()=>{const k=generateKeyPairSync('ed25519');return {
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 k.privateKey).toString('base64')});
const iso=t=>new Date(t).toISOString();
const scope={ceremonyId:'old_ceremony_ql435_123456',sourceId:'rosevear-ai-hub',
 episodeId:'old_episode_ql435_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql435_12345678';
const nextCeremonyId='next_ceremony_ql435_123456';
const nextEpisodeId='next_episode_ql435_123456';
const challengeId='challenge_ql435_12345678',challengeNonce='nonce_ql435_12345678';
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql435-'));
 const now=Date.now()-5000,leaseExpiresAt=iso(now+10000);
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const ql432Ledger=openQl432ProtectedRecoveryReviewLedger(join(root,'ql432'));
 const ql433Ledger=openQl433ProtectedPrecheckLedger(join(root,'ql433'));
 const ql434Ledger=openQl434ProtectedReadinessLedger(join(root,'ql434'));
 const pilotLedger=openQl435ProtectedPilotLedger(join(root,'ql435'));
 const seq=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const base={kind:'PENDING',scope,observationId:'observation_ql435_123456',
  observedAt:iso(now-3000),ql430AcceptedDigest:'a'.repeat(64),
  evidenceDigest:hash('ql435_pending'),sequences:seq,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const pending=ql431Store.append(scope,base,null);
 const off={...base,kind:'OFF',observedAt:iso(now-2000),
  shutdownAckDigest:'b'.repeat(64),receiverOffDigest:'c'.repeat(64)};
 const offReceipt=ql431Store.append(scope,off,pending.recordDigest);
 const reconciled={...off,kind:'RECONCILED',observedAt:iso(now-1000),
  reportsDigest:'d'.repeat(64),ownerDecisionDigest:'e'.repeat(64)};
 const ql431=ql431Store.append(scope,reconciled,offReceipt.recordDigest);
 const ql432=ql432Ledger.claimOnce(incidentId,'1'.repeat(64));
 const ql432Decision={state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_RECOVERY_REVIEW_ONLY',
  masterCount:3,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
  nextStep:'NEW_QL429_QL430_OWNER_SUPERVISED_CEREMONY_ONLY',
  scope,incidentId,checkpointIndex:ql431.index,checkpointDigest:ql431.recordDigest,
  externalAnchorDigest:'2'.repeat(64),independentReadbackDigest:'3'.repeat(64),
  ownerReviewReceiptDigest:ql432.recordDigest};
 const ql433=ql433Ledger.claimOnce(incidentId,'4'.repeat(64));
 const ql433Precheck={state:'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_NEW_CEREMONY_PRECHECK_ONLY',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',masterCount:3,
  permittedNextAction:'NEW_QL429_QL430_CEREMONY_WITH_SEPARATE_FRESH_AUTHORITY_NOT_ACTIVATED',
  scope,incidentId,nextCeremonyId,nextEpisodeId,
  externalDecisionAnchorDigest:'5'.repeat(64),independentReadbackDigest:'6'.repeat(64),
  ql432OwnerReviewReceiptDigest:ql432.recordDigest,
  precheckRecordDigest:ql433.recordDigest};
 const ql434=ql434Ledger.claimOnce(incidentId,'7'.repeat(64));
 const ql434Readiness={state:'DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_READINESS_ONLY',
  activationAuthorized:false,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
  masterCount:3,scope,incidentId,nextCeremonyId,nextEpisodeId,
  authorityId:'authority_ql435_12345678',
  handoffWitnessDigest:'8'.repeat(64),
  readinessRecordDigest:ql434.recordDigest,
  permittedNextAction:'NEW_QL429_QL430_FRESH_SIGNED_ENROLLMENT_NOT_ACTIVATED'};
 const keysFor={host:keys(),preOff:keys(),onWitness:keys(),owner:keys(),
  reviewer:keys(),forger:keys(),masters:Object.fromEntries(MASTERS.map(m=>[m,keys()]))};
 const prep=prepareQl435OriginalHostEnrollment({
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,
  ql431Store,challengeId,challengeNonce,leaseExpiresAt
 },{nowMs:now,protectedOriginalHostSession:true,independentQl434ReadinessVerified:true});
 assert.equal(prep.state,'QL435_ISOLATED_PILOT_ENROLLMENT_PREPARED_NOT_ISSUED');
 const request=prep.request;
 const enrollmentPayload={schema:'rosevear.ql435.original-host-fresh-ceremony-enrollment.v1',
  requestDigest:prep.requestDigest,scope,incidentId,challengeId,challengeNonce,
  nextCeremonyId,nextEpisodeId,hostMachineId:'DESKTOP-AE894KC',
  receiverState:'OFF',failClosedShutdownArmed:true,leaseExpiresAt,
  enrollmentStatus:'FRESH_ISOLATED_ONE_TEST_ENROLLMENT_NOT_ENABLED',
  enrolledAt:iso(now)};
 const enrollment=signed(enrollmentPayload,keysFor.host);
 const preOffPayload={schema:'rosevear.ql435.independent-pre-on-off.v1',
  challengeId,challengeNonce,hostEnrollmentDigest:hash(enrollmentPayload),
  leaseExpiresAt,receiverState:'OFF',observedAt:iso(now)};
 const preOff=signed(preOffPayload,keysFor.preOff);
 const prePermitPayload={schema:'rosevear.ql435.owner-single-test-prepermit.v1',
  requestDigest:prep.requestDigest,hostEnrollmentDigest:hash(enrollmentPayload),
  preOffDigest:hash(preOffPayload),challengeId,challengeNonce,
  nextCeremonyId,nextEpisodeId,leaseExpiresAt,
  action:'PERMIT_ONE_ISOLATED_ON_CHALLENGE_ONLY_NO_GENERAL_CONNECTED',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',approvedAt:iso(now)};
 const ownerPrePermit={payload:prePermitPayload,
  ownerSignature:signed(prePermitPayload,keysFor.owner).signature,
  reviewerSignature:signed(prePermitPayload,keysFor.reviewer).signature};
 const onPayload={schema:'rosevear.ql435.original-host-on-challenge.v1',
  requestDigest:prep.requestDigest,challengeId,challengeNonce,
  prePermitDigest:hash(prePermitPayload),hostMachineId:'DESKTOP-AE894KC',
  nextCeremonyId,nextEpisodeId,leaseExpiresAt,
  receiverState:'ISOLATED_ONE_TEST_ON',isolatedMode:true,
  failClosedShutdownArmed:true,observedAt:iso(now)};
 const hostOn=signed(onPayload,keysFor.host);
 const witnessPayload={schema:'rosevear.ql435.independent-on-challenge-witness.v1',
  challengeId,challengeNonce,hostOnDigest:hash(onPayload),
  nextCeremonyId,nextEpisodeId,leaseExpiresAt,
  receiverState:'ISOLATED_ONE_TEST_ON',
  observation:'INDEPENDENT_SINGLE_NONCE_BOUND_PILOT_ON_SEEN',
  observedAt:iso(now)};
 const witness=signed(witnessPayload,keysFor.onWitness);
 const reports=MASTERS.map(masterId=>{
  const p={schema:'rosevear.ql435.master-isolated-pilot-decision.v1',
   masterId,requestDigest:prep.requestDigest,challengeId,challengeNonce,
   independentOnWitnessDigest:hash(witnessPayload),nextCeremonyId,nextEpisodeId,
   leaseExpiresAt,status:'SIGNED_ISOLATED_ON_EVIDENCE_REVIEW_ONLY_NO_GENERAL_CONNECTED',
   observedAt:iso(now)};
  return signed(p,keysFor.masters[masterId]);
 });
 const decisionPayload={schema:'rosevear.ql435.dual-owner-isolated-pilot-decision.v1',
  requestDigest:prep.requestDigest,challengeId,challengeNonce,
  independentOnWitnessDigest:hash(witnessPayload),
  mastersDigest:hash(reports.map(r=>r.payload)),nextCeremonyId,nextEpisodeId,
  leaseExpiresAt,action:'RECOGNIZE_SINGLE_PILOT_ON_EVIDENCE_ONLY_MANDATORY_OFF_RECHECK',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',decidedAt:iso(now)};
 const ownerDecision={payload:decisionPayload,
  ownerSignature:signed(decisionPayload,keysFor.owner).signature,
  reviewerSignature:signed(decisionPayload,keysFor.reviewer).signature};
 const counts={enrollment:0,preOff:0,on:0,witness:0,masters:0,enable:0};
 const inputs={ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store,pilotLedger,
  challengeId,challengeNonce,leaseExpiresAt,
  originalHostAdapter:{
   readSignedEnrollment:async()=>{counts.enrollment++;return enrollment;},
   readSignedOnChallenge:async()=>{counts.on++;return hostOn;}},
  independentPreOffProvider:{readSignedOff:async()=>{counts.preOff++;return preOff;}},
  ownerPrePermit,
  independentOnWitnessProvider:{readSignedOn:async()=>{counts.witness++;return witness;}},
  masterEvidenceProvider:{readSignedReports:async()=>{counts.masters++;return reports;}},
  ownerDecision};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl434ReadinessVerified:true,
  independentOriginalHostPinVerified:true,independentPreOffPinVerified:true,
  independentOnWitnessPinVerified:true,independentMasterPinsVerified:true,
  independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true,
  originalHostPin:keysFor.host.pin,preOffPin:keysFor.preOff.pin,
  onWitnessPin:keysFor.onWitness.pin,ownerPin:keysFor.owner.pin,
  reviewerPin:keysFor.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keysFor.masters[m].pin]))};
 return {root,keysFor,scope,ql431Store,ql432Ledger,ql433Ledger,ql434Ledger,
  pilotLedger,ql432Decision,ql433Precheck,ql434Readiness,
  enrollment,preOff,ownerPrePermit,hostOn,witness,reports,ownerDecision,
  prep,inputs,opts,counts,
  run:()=>runQl435OriginalHostPilotDecision(inputs,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('QL435 accepts one signed isolated ON challenge as HOLD-only evidence, with no activation call',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(r.receiver,'ISOLATED_ONE_TEST_ON_SIGNED_WITNESS_ONLY');
  assert.equal(r.manualReceiverIsolationRequired,true);
  assert.equal(r.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
  assert.equal(r.masterCount,3);
  assert.equal(r.leaseExpiresAt,f.prep.request.leaseExpiresAt);
  assert.match(r.permittedNextAction,/SUPERVISED_FAIL_CLOSED_OFF/);
  assert.equal(f.pilotLedger.read('pending',nextCeremonyId)?.recordDigest,r.pendingReceiptDigest);
  assert.equal(f.pilotLedger.read('accepted',nextCeremonyId)?.recordDigest,r.acceptedReceiptDigest);
  assert.deepEqual(f.counts,{enrollment:1,preOff:1,on:1,witness:1,masters:1,enable:0});
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.on,1);
 }finally{f.cleanup();}
});
test('request preparation is not signed, not activated and keeps receiver OFF',()=>{
 const f=fixture();try{
  assert.equal(f.prep.state,'QL435_ISOLATED_PILOT_ENROLLMENT_PREPARED_NOT_ISSUED');
  assert.equal(f.prep.receiver,'OFF_NOT_ACTIVATED_BY_QL435');
  assert.equal(f.prep.connection,'HOLD');
  assert.equal(f.prep.activationAuthorized,false);
  assert.equal(f.prep.request.nextCeremonyId,nextCeremonyId);
 }finally{f.cleanup();}
});
test('missing protected original-host session and unverified QL434 custody never query runtime',async()=>{
 for(const field of ['protectedOriginalHostSession','independentQl434ReadinessVerified']){
  const f=fixture();try{
   f.opts[field]=false;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.enrollment,0);
  }finally{f.cleanup();}
 }
});
test('lease must be fresh and limited to 15 seconds; no stale or indefinite ON',()=>{
 const f=fixture();try{
  for(const lease of [iso(f.opts.nowMs+16000),iso(f.opts.nowMs-1000)]){
   const r=prepareQl435OriginalHostEnrollment({
    ql434Readiness:f.ql434Readiness,ql434Ledger:f.ql434Ledger,
    ql433Precheck:f.ql433Precheck,ql433Ledger:f.ql433Ledger,
    ql432Decision:f.ql432Decision,ql432Ledger:f.ql432Ledger,
    ql431Store:f.ql431Store,challengeId,challengeNonce,leaseExpiresAt:lease
   },{nowMs:f.opts.nowMs,protectedOriginalHostSession:true,
    independentQl434ReadinessVerified:true});
   assert.equal(r.state,'HOLD');
  }
 }finally{f.cleanup();}
});
test('forged or wrong original-host enrollment and missing fail-closed arm reject before ON',async()=>{
 for(const mode of ['TEMPLAR','ON','notArmed','forged','nonce']){
  const f=fixture();try{
   if(mode==='TEMPLAR')f.enrollment.payload.hostMachineId='TEMPLAR';
   if(mode==='ON')f.enrollment.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='notArmed')f.enrollment.payload.failClosedShutdownArmed=false;
   if(mode==='forged')f.enrollment.signature=signed(f.enrollment.payload,f.keysFor.forger).signature;
   if(mode==='nonce')f.enrollment.payload.challengeNonce='replayed_nonce_ql435';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.preOff,0);
   assert.equal(f.counts.on,0);
  }finally{f.cleanup();}
 }
});
test('independent signed OFF is required BEFORE the owners prepermit and ON challenge',async()=>{
 for(const mode of ['ON','forged']){
  const f=fixture();try{
   if(mode==='ON')f.preOff.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='forged')f.preOff.signature=signed(f.preOff.payload,f.keysFor.forger).signature;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.on,0);
   assert.equal(f.pilotLedger.read('pending',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('missing or forged dual-owner prepermit rejects BEFORE any ON challenge',async()=>{
 for(const mode of ['owner','reviewer','action','custody']){
  const f=fixture();try{
   if(mode==='owner')f.ownerPrePermit.ownerSignature=
    signed(f.ownerPrePermit.payload,f.keysFor.forger).signature;
   if(mode==='reviewer')f.ownerPrePermit.reviewerSignature=
    signed(f.ownerPrePermit.payload,f.keysFor.forger).signature;
   if(mode==='action')f.ownerPrePermit.payload.action='AUTHORIZE_GENERAL_CONNECTED';
   if(mode==='custody')f.opts.independentReviewerCustodyVerified=false;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.on,0);
   assert.equal(f.pilotLedger.read('pending',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('invalid original-host ON challenge fails closed, consumes pending and requires supervised shutdown',async()=>{
 for(const mode of ['OFF','notArmed','forged','nonce']){
  const f=fixture();try{
   if(mode==='OFF')f.hostOn.payload.receiverState='OFF';
   if(mode==='notArmed')f.hostOn.payload.failClosedShutdownArmed=false;
   if(mode==='forged')f.hostOn.signature=signed(f.hostOn.payload,f.keysFor.forger).signature;
   if(mode==='nonce')f.hostOn.payload.challengeNonce='old_nonce_ql435_123456';
   const result=await f.run();
   assert.equal(result.state,'HOLD',mode);
   assert.equal(result.manualReceiverIsolationRequired,true);
   assert.equal(f.counts.witness,0);
   assert.ok(f.pilotLedger.read('pending',nextCeremonyId));
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.on,1);
  }finally{f.cleanup();}
 }
});
test('independent ON witness missing, OFF, forged or replayed fails closed with pending consumed',async()=>{
 for(const mode of ['missing','OFF','forged','nonce']){
  const f=fixture();try{
   if(mode==='missing')f.inputs.independentOnWitnessProvider.readSignedOn=async()=>{throw Error('no witness')};
   if(mode==='OFF')f.witness.payload.receiverState='OFF';
   if(mode==='forged')f.witness.signature=signed(f.witness.payload,f.keysFor.forger).signature;
   if(mode==='nonce')f.witness.payload.challengeNonce='wrong_nonce_ql435_123456';
   const result=await f.run();
   assert.equal(result.state,'HOLD',mode);
   assert.equal(result.connection,'HOLD');
   assert.equal(result.manualReceiverIsolationRequired,true);
   assert.ok(f.pilotLedger.read('pending',nextCeremonyId));
   assert.equal(f.counts.masters,0);
  }finally{f.cleanup();}
 }
});
test('three Master ON reports require every distinct signer bound to exact nonce and witness',async()=>{
 for(const mode of ['missing','duplicate','forged','wrongWitness']){
  const f=fixture();try{
   if(mode==='missing')f.reports.pop();
   if(mode==='duplicate')f.reports[2]=f.reports[1];
   if(mode==='forged')f.reports[0].signature=
    signed(f.reports[0].payload,f.keysFor.forger).signature;
   if(mode==='wrongWitness')f.reports[0].payload.independentOnWitnessDigest='0'.repeat(64);
   const result=await f.run();
   assert.equal(result.state,'HOLD',mode);
   assert.equal(result.manualReceiverIsolationRequired,true);
   assert.ok(f.pilotLedger.read('pending',nextCeremonyId));
   assert.equal(f.pilotLedger.read('accepted',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('dual-owner post-ON decision cannot approve CONNECTED and cannot be forged',async()=>{
 for(const mode of ['CONNECTED','owner','reviewer']){
  const f=fixture();try{
   if(mode==='CONNECTED')f.ownerDecision.payload.action='PROMOTE_ALL_APPS_CONNECTED';
   if(mode==='owner')f.ownerDecision.ownerSignature=
    signed(f.ownerDecision.payload,f.keysFor.forger).signature;
   if(mode==='reviewer')f.ownerDecision.reviewerSignature=
    signed(f.ownerDecision.payload,f.keysFor.forger).signature;
   const result=await f.run();
   assert.equal(result.state,'HOLD',mode);
   assert.equal(result.manualReceiverIsolationRequired,true);
   assert.equal(f.pilotLedger.read('accepted',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('broken QL431/432/433/434 chain refuses enrollment before querying original host',async()=>{
 for(const mode of ['ql431','ql432','ql433','ql434']){
  const f=fixture();try{
   if(mode==='ql431')f.ql432Decision.checkpointDigest='9'.repeat(64);
   if(mode==='ql432')f.ql432Decision.ownerReviewReceiptDigest='8'.repeat(64);
   if(mode==='ql433')f.ql433Precheck.precheckRecordDigest='7'.repeat(64);
   if(mode==='ql434')f.ql434Readiness.readinessRecordDigest='6'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.enrollment,0);
  }finally{f.cleanup();}
 }
});
test('tampered private PENDING receipt fails re-read and does not replay ON after interruption',async()=>{
 const f=fixture();try{
  f.inputs.originalHostAdapter.readSignedOnChallenge=async()=>{throw Error('crash after pending')};
  const first=await f.run();
  assert.equal(first.state,'HOLD');
  assert.equal(first.manualReceiverIsolationRequired,true);
  assert.ok(f.pilotLedger.read('pending',nextCeremonyId));
  assert.equal((await f.run()).state,'HOLD');
  writeFileSync(join(f.root,'ql435','ql435-pending-'+nextCeremonyId+'.json'),
   '{"schema":"rosevear.ql435.pilot-custody-receipt.v1"}');
  assert.throws(()=>f.pilotLedger.read('pending',nextCeremonyId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
 }finally{f.cleanup();}
});
