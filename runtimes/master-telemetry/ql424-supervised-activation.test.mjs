import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openQl424ProtectedCeremonyLedger,enrollQl424OriginalHostAuthority,
 runQl424SupervisedReceiverCeremony,verifyQl424ThreeMasterAcceptance
} from './ql424-supervised-activation.mjs';
import {restoration,directory,sender,receiver,owner,reviewer,masterKeys,
 masters,sourceId,episodeId,now,revision,controllerRevision,signIt,hash,date,
 cleanupQl424Fixture} from './ql424-test-fixture.mjs';

test.after(cleanupQl424Fixture);
const sourceDigest=createHash('sha256').update(Buffer.from(sender.pin,'base64')).digest('hex');
function setup(){
 const ledger=openQl424ProtectedCeremonyLedger(directory());
 const p={schema:'rosevear.ql424.original-host-enrollment.v1',
  sourceId,hostId:'DESKTOP-AE894KC',sourceRevision:revision,controllerRevision,
  sourceSignerSpki:sender.pin,sourceSignerSha256:sourceDigest,
  enrollmentId:'enrollment_000001',enrolledAt:date(now-40000),
  ownerId:'owner_identity_001',reviewerId:'reviewer_identity_001'};
 const certificate={payload:p,ownerSignature:signIt(p,owner),
   reviewerSignature:signIt(p,reviewer)};
 const enrollmentArgs={independentlyPinnedSourceSha256:sourceDigest,
  ownerPin:owner.pin,reviewerPin:reviewer.pin,
  ownerAuthorityVerified:true,independentReviewerVerified:true,
  protectedEnrollmentSession:true,expectedSourceRevision:revision,
  expectedControllerRevision:controllerRevision,nowMs:now,ledger};
 const enrolled=enrollQl424OriginalHostAuthority(certificate,enrollmentArgs);
 assert.equal(enrolled.state,'SUPERVISED_SOURCE_PUBLIC_PIN_ENROLLED');
 const prior=restoration();
 const record=prior.input.store.read(sourceId+':'+episodeId);
 const cp={schema:'rosevear.ql424.supervised-receiver-ceremony.v1',
  sourceId,hostId:'DESKTOP-AE894KC',episodeId,sourceRevision:revision,
  controllerRevision,custodyRecordDigest:record.recordDigest,
  priorDecisionId:prior.input.operatorDecision.payload.decisionId,
  enrollmentId:enrolled.enrollmentId,ceremonyId:'ceremony_000001',
  mode:'ISOLATED_ONE_TEST',issuedAt:date(now-1000),
  ownerId:enrolled.ownerId,reviewerId:enrolled.reviewerId};
 const activation={payload:cp,ownerSignature:signIt(cp,owner),
  reviewerSignature:signIt(cp,reviewer)};
 let enabledCount=0,disabledCount=0;
 const statePayload={schema:'rosevear.ql424.protected-receiver-state.v1',
  ceremonyId:cp.ceremonyId,sourceId,episodeId,
  sourceRevision:revision,controllerRevision,
  receiverState:'ISOLATED_ONE_TEST_ON',observedAt:date(now-500)};
 const adapter={
  enableOneTest:async()=>{enabledCount++;return {accepted:true};},
  readSignedState:async()=>({payload:statePayload,
   signature:signIt(statePayload,receiver)}),
  disableOneTest:async()=>{disabledCount++;}
 };
 const ceremonyInputs={enrollment:enrolled,activation,
  ql423Input:prior.input,ql423Options:prior.opts,ledger,receiverAdapter:adapter};
 const ceremonyOptions={expectedSourceRevision:revision,
  expectedControllerRevision:controllerRevision,
  ownerPin:owner.pin,reviewerPin:reviewer.pin,receiverPin:receiver.pin,
  protectedOperatorSession:true,independentReceiverCustodyVerified:true,
  independentEnrollmentCustodyVerified:true,
  executeIntent:'EXECUTE_ISOLATED_ONE_TEST_CEREMONY',nowMs:now};
 return {ledger,p,certificate,enrollmentArgs,enrolled,ceremonyInputs,ceremonyOptions,
  adapter,statePayload,counts:()=>({enabledCount,disabledCount})};
}
test('enroll original-Ree public signer only with independently pinned SHA and two signatures',()=>{
 const a=setup();assert.equal(a.enrolled.sourceSignerSha256,sourceDigest);
 assert.equal(a.enrolled.connection,'HOLD');assert.equal(a.enrolled.receiver,'OFF');
 const repeated=enrollQl424OriginalHostAuthority(a.certificate,a.enrollmentArgs);
 assert.equal(repeated.reason,'ENROLLMENT_REPLAY_OR_STORE_UNAVAILABLE');
 const wrong={...a.certificate,payload:{...a.p,hostId:'TEMPLAR'}};
 assert.equal(enrollQl424OriginalHostAuthority(wrong,{...a.enrollmentArgs,
  ledger:openQl424ProtectedCeremonyLedger(directory())}).state,'HOLD');
 const b=setup();
 b.enrollmentArgs.independentlyPinnedSourceSha256='0'.repeat(64);
 assert.equal(enrollQl424OriginalHostAuthority(b.certificate,b.enrollmentArgs).state,'HOLD');
});
test('isolated receiver starts only after full QL423 signed replay and owner ceremony',async()=>{
 const a=setup();const result=await runQl424SupervisedReceiverCeremony(
  a.ceremonyInputs,a.ceremonyOptions);
 assert.equal(result.state,'ISOLATED_RECEIVER_ACTIVATED_PENDING_THREE_MASTER_ACCEPTANCE');
 assert.equal(result.receiver,'ISOLATED_ONE_TEST_ON');
 assert.equal(result.connection,'HOLD');assert.equal(result.ownerAcceptance,'HOLD');
 assert.deepEqual(a.counts(),{enabledCount:1,disabledCount:0});
 const repeat=await runQl424SupervisedReceiverCeremony(a.ceremonyInputs,a.ceremonyOptions);
 assert.equal(repeat.reason,'ACTIVATION_CEREMONY_ALREADY_USED_OR_STORE_UNAVAILABLE');
 assert.deepEqual(a.counts(),{enabledCount:1,disabledCount:0});
});
test('no protected session, tampered operator signature or source revision never executes',async()=>{
 const a=setup();
 const without=await runQl424SupervisedReceiverCeremony(
  a.ceremonyInputs,{...a.ceremonyOptions,protectedOperatorSession:false});
 assert.equal(without.state,'HOLD');
 a.ceremonyInputs.activation.ownerSignature=a.ceremonyInputs.activation.reviewerSignature;
 const forged=await runQl424SupervisedReceiverCeremony(a.ceremonyInputs,a.ceremonyOptions);
 assert.equal(forged.state,'HOLD');assert.equal(a.counts().enabledCount,0);
 const b=setup();b.ceremonyInputs.ql423Options.masterPins[masters[0]]=sender.pin;
 const invalid=await runQl424SupervisedReceiverCeremony(b.ceremonyInputs,b.ceremonyOptions);
 assert.equal(invalid.reason,'SIGNED_QL423_MASTER_PROOF_OR_RESTORATION_NOT_READY');
 assert.equal(b.counts().enabledCount,0);
});
test('invalid separately signed receiver readback invokes rollback',async()=>{
 const a=setup();
 a.adapter.readSignedState=async()=>({payload:a.statePayload,
  signature:signIt(a.statePayload,owner)});
 const r=await runQl424SupervisedReceiverCeremony(a.ceremonyInputs,a.ceremonyOptions);
 assert.equal(r.reason,'ISOLATED_RECEIVER_ACTIVATION_OR_READBACK_FAILED');
 assert.deepEqual(a.counts(),{enabledCount:1,disabledCount:1});
 assert.equal(r.connection,'HOLD');
});
function acceptance(ceremony){
 const reports=masters.map(masterId=>{
  const p={schema:'rosevear.ql424.master-operational-acceptance.v1',
   masterId,ceremonyId:ceremony.ceremonyId,sourceId,episodeId,
   sourceRevision:revision,controllerRevision,custodyRecordDigest:ceremony.recordDigest,
   receiverState:'ISOLATED_ONE_TEST_ON',status:'VERIFIED_LIVE_PILOT',
   observedAt:date(now-300)};
  return {payload:p,signature:signIt(p,masterKeys[masterId])};
 });
 const sorted=reports.map(r=>r.payload).sort((a,b)=>
  masters.indexOf(a.masterId)-masters.indexOf(b.masterId));
 const p={schema:'rosevear.ql424.supervised-operational-acceptance.v1',
  ceremonyId:ceremony.ceremonyId,sourceId,episodeId,
  sourceRevision:revision,controllerRevision,
  custodyRecordDigest:ceremony.recordDigest,reportsDigest:hash(sorted),
  action:'ACCEPT_ISOLATED_OPERATIONAL_PILOT',acceptedAt:date(now),
  ownerId:'owner_identity_001',reviewerId:'reviewer_identity_001'};
 const ownerAcceptance={payload:p,ownerSignature:signIt(p,owner),
  reviewerSignature:signIt(p,reviewer)};
 const opts={masterPins:Object.fromEntries(masters.map(m=>[m,masterKeys[m].pin])),
  receiverPin:receiver.pin,ownerPin:owner.pin,reviewerPin:reviewer.pin,
  independentMasterPinsVerified:true,independentOwnerCustodyVerified:true,
  independentReceiverRuntimeVerified:true,nowMs:now};
 return {reports,ownerAcceptance,opts};
}
test('three signed Masters plus dual owner acceptance produce isolated pilot only',async()=>{
 const a=setup(),ceremony=await runQl424SupervisedReceiverCeremony(
  a.ceremonyInputs,a.ceremonyOptions);
 const x=acceptance(ceremony);
 const r=verifyQl424ThreeMasterAcceptance({ceremony,reports:x.reports,
  ownerAcceptance:x.ownerAcceptance},x.opts);
 assert.equal(r.state,'VERIFIED_THREE_MASTER_ISOLATED_PILOT_ACCEPTANCE');
 assert.equal(r.connection,'VERIFIED_CONNECTED_PILOT');
 assert.equal(r.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
 assert.equal(r.runtimeUptime,'NOT_MEASURED_FROM_CEREMONY');
});
test('missing master, tampered source, forged owner or receiver proof fail closed',async()=>{
 const a=setup(),ceremony=await runQl424SupervisedReceiverCeremony(
  a.ceremonyInputs,a.ceremonyOptions);
 const b=acceptance(ceremony);
 assert.equal(verifyQl424ThreeMasterAcceptance({ceremony,reports:b.reports.slice(1),
  ownerAcceptance:b.ownerAcceptance},b.opts).state,'HOLD');
 const c=acceptance(ceremony);c.reports[1].payload.status='UNKNOWN';
 assert.equal(verifyQl424ThreeMasterAcceptance({ceremony,reports:c.reports,
  ownerAcceptance:c.ownerAcceptance},c.opts).state,'HOLD');
 const d=acceptance(ceremony);d.ownerAcceptance.ownerSignature=signIt(d.ownerAcceptance.payload,receiver);
 assert.equal(verifyQl424ThreeMasterAcceptance({ceremony,reports:d.reports,
  ownerAcceptance:d.ownerAcceptance},d.opts).state,'HOLD');
 const e=acceptance(ceremony);
 assert.equal(verifyQl424ThreeMasterAcceptance({ceremony:{...ceremony,receiverProof:{
  ...ceremony.receiverProof,signature:'invalid'}},
  reports:e.reports,ownerAcceptance:e.ownerAcceptance},e.opts).state,'HOLD');
});

test('rollback failure remains an explicit unknown receiver state',async()=>{
 const a=setup();
 a.adapter.readSignedState=async()=>{throw Error('unavailable')};
 a.adapter.disableOneTest=async()=>{throw Error('rollback inaccessible')};
 const r=await runQl424SupervisedReceiverCeremony(a.ceremonyInputs,a.ceremonyOptions);
 assert.equal(r.reason,'RECEIVER_ROLLBACK_FAILED_MANUAL_RECOVERY_REQUIRED');
 assert.equal(r.receiver,'UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED');
 assert.equal(r.connection,'HOLD');
});
test('malformed source SPKI never crashes enrollment or bypasses authority',()=>{
 const a=setup(),p={...a.p,sourceSignerSpki:'not-der'};
 const certificate={payload:p,ownerSignature:signIt(p,owner),
  reviewerSignature:signIt(p,reviewer)};
 const result=enrollQl424OriginalHostAuthority(certificate,{
  ...a.enrollmentArgs,ledger:openQl424ProtectedCeremonyLedger(directory())});
 assert.equal(result.state,'HOLD');
});
