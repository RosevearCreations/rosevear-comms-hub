import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl429ProtectedEnrollmentLedger} from './ql429-anchor-enrollment-challenge.mjs';
import {openQl430ProtectedCeremonyAudit,runQl430SupervisedPilotReentry
} from './ql430-supervised-pilot-reentry.mjs';
import {openQl424ProtectedCeremonyLedger,enrollQl424OriginalHostAuthority
} from './ql424-supervised-activation.mjs';
import {restoration,directory,sender,receiver,owner,reviewer,masterKeys,
 masters,sourceId,episodeId,now,revision,controllerRevision,signIt,hash,date,
 cleanupQl424Fixture} from './ql424-test-fixture.mjs';

test.after(cleanupQl424Fixture);
const signRaw=(p,k)=>sign(null,Buffer.from(JSON.stringify(p)),k.privateKey).toString('base64');
const key=()=>{const x=generateKeyPairSync('ed25519');return {
 privateKey:x.privateKey,pin:x.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const originalHost=key(),anchor=key(),reader=key(),independentReceiver=key();
const SHA=d=>createHash('sha256').update(d).digest('hex');
const externalStoreId='external_ql430_123456';
const reentryId='reentry_ql430_123456';
const newCeremonyId='new_ceremony_ql430_123456';
const oldScope={ceremonyId:'old_ceremony_ql430_123456',
 sourceId:'rosevear-ai-hub',episodeId:'prior_episode_ql430_123456',
 sourceRevision:revision,controllerRevision};
const incidentId='incident_ql430_123456';
function setup(){
 const root=mkdtempSync(join(tmpdir(),'ql430-'));
 const protectedAudit=openQl430ProtectedCeremonyAudit(join(root,'audit'));
 const ql429Ledger=openQl429ProtectedEnrollmentLedger(join(root,'ql429'));
 const ql424Ledger=openQl424ProtectedCeremonyLedger(directory());
 const ql423=restoration();
 const pins={anchor:anchor.pin,reader:reader.pin,originalHost:originalHost.pin,
  masters:Object.fromEntries(masters.map(id=>[id,masterKeys[id].pin]))};
 const enrollment={schema:'rosevear.ql429.external-anchor-enrollment.v1',
  externalStoreId,anchorId:'anchor_ql430_123456',
  originalHostMachineId:'DESKTOP-AE894KC',pins,ownerId:'Ree_Original',
  reviewerId:'Jack_Independent',createdAt:date(now-4000)};
 const enrollRec=ql429Ledger.claimOnce('enrollment',externalStoreId,{
  enrollment,ownerApprovalDigest:'a'.repeat(64),proofDigests:{anchor:'b'.repeat(64),
   reader:'c'.repeat(64),originalHost:'d'.repeat(64)}});
 const challenge={schema:'rosevear.ql429.original-host-challenge.v1',scope:oldScope,
  incidentId,externalStoreId,anchorDigest:'e'.repeat(64),
  closureReceiptDigest:'f'.repeat(64),reentryId,
  ql428PrecheckDigest:'a'.repeat(64),challengeId:'c'.repeat(48),
  issuedAt:date(now-3000),expiresAt:date(now+57000)};
 ql429Ledger.claimOnce('challenge',reentryId,{enrollmentDigest:enrollRec.recordDigest,challenge});
 const hp={schema:'rosevear.ql429.original-host-fresh-response.v1',
  scope:oldScope,incidentId,externalStoreId,reentryId,
  challengeDigest:hash(challenge),challengeId:challenge.challengeId,
  hostMachineId:'DESKTOP-AE894KC',receiverState:'OFF',
  nextCeremonyId:newCeremonyId,respondedAt:date(now-1500)};
 const hostEnvelope={payload:hp,signature:signRaw(hp,originalHost)};
 const witnessRec=ql429Ledger.claimOnce('witness',reentryId,{
  enrollmentDigest:enrollRec.recordDigest,challengeDigest:hash(challenge),
  hostResponseDigest:hash(hp),mastersDigest:'f'.repeat(64),
  ownerDecisionDigest:'e'.repeat(64),nextCeremonyId:newCeremonyId});
 const sourceDigest=SHA(Buffer.from(sender.pin,'base64'));
 const enrollmentPayload={schema:'rosevear.ql424.original-host-enrollment.v1',
  sourceId,hostId:'DESKTOP-AE894KC',sourceRevision:revision,controllerRevision,
  sourceSignerSpki:sender.pin,sourceSignerSha256:sourceDigest,
  enrollmentId:'enrollment_ql430_123456',enrolledAt:date(now-40000),
  ownerId:'owner_identity_001',reviewerId:'reviewer_identity_001'};
 const certificate={payload:enrollmentPayload,
  ownerSignature:signIt(enrollmentPayload,owner),
  reviewerSignature:signIt(enrollmentPayload,reviewer)};
 const enrolled=enrollQl424OriginalHostAuthority(certificate,{
  independentlyPinnedSourceSha256:sourceDigest,ownerPin:owner.pin,reviewerPin:reviewer.pin,
  ownerAuthorityVerified:true,independentReviewerVerified:true,protectedEnrollmentSession:true,
  expectedSourceRevision:revision,expectedControllerRevision:controllerRevision,
  nowMs:now,ledger:ql424Ledger});
 assert.equal(enrolled.state,'SUPERVISED_SOURCE_PUBLIC_PIN_ENROLLED');
 const restored=ql423.input.store.read(sourceId+':'+episodeId);
 const cp={schema:'rosevear.ql424.supervised-receiver-ceremony.v1',
  sourceId,hostId:'DESKTOP-AE894KC',episodeId,
  sourceRevision:revision,controllerRevision,
  custodyRecordDigest:restored.recordDigest,
  priorDecisionId:ql423.input.operatorDecision.payload.decisionId,
  enrollmentId:enrolled.enrollmentId,ceremonyId:newCeremonyId,
  mode:'ISOLATED_ONE_TEST',issuedAt:date(now-100),
  ownerId:enrolled.ownerId,reviewerId:enrolled.reviewerId};
 const activation={payload:cp,ownerSignature:signIt(cp,owner),
  reviewerSignature:signIt(cp,reviewer)};
 const ap={schema:'rosevear.ql430.supervised-reentry-authorization.v1',
  externalStoreId,reentryId,ql429WitnessDigest:witnessRec.recordDigest,
  challengeDigest:hash(challenge),nextCeremonyId:newCeremonyId,
  activationDigest:hash(cp),action:'EXECUTE_NEW_SUPERVISED_QL424_ISOLATED_ONE_TEST',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',authorizedAt:date(now-200)};
 const reentryAuthorization={payload:ap,ownerSignature:signIt(ap,owner),
  reviewerSignature:signIt(ap,reviewer)};
 let enabled=0,disabled=0;
 const onState={schema:'rosevear.ql424.protected-receiver-state.v1',
  ceremonyId:newCeremonyId,sourceId,episodeId,sourceRevision:revision,
  controllerRevision,receiverState:'ISOLATED_ONE_TEST_ON',observedAt:date(now-80)};
 const adapter={
  enableOneTest:async()=>{enabled++;return {accepted:true}},
  readSignedState:async()=>({payload:onState,signature:signIt(onState,receiver)}),
  disableOneTest:async()=>{disabled++;return {disabled:true}}
 };
 const independentState={schema:'rosevear.ql430.independent-receiver-runtime.v1',
  ceremonyId:newCeremonyId,sourceId,episodeId,sourceRevision:revision,
  controllerRevision,ql429WitnessDigest:witnessRec.recordDigest,
  challengeId:challenge.challengeId,receiverState:'ISOLATED_ONE_TEST_ON',
  observedAt:date(now-60)};
 const independentReceiverAdapter={
  readSignedState:async()=>({payload:independentState,
   signature:signRaw(independentState,independentReceiver)})};
 const runtimeEvidenceProvider={readSignedAcceptance:async({
   ceremony,receiverAttestationDigest,ql429WitnessDigest})=>{
  const ql424Reports=masters.map(masterId=>{
   const p={schema:'rosevear.ql424.master-operational-acceptance.v1',masterId,
    ceremonyId:newCeremonyId,sourceId,episodeId,sourceRevision:revision,
    controllerRevision,custodyRecordDigest:ceremony.recordDigest,
    receiverState:'ISOLATED_ONE_TEST_ON',status:'VERIFIED_LIVE_PILOT',
    observedAt:date(now-50)};
   return {payload:p,signature:signIt(p,masterKeys[masterId])};
  });
  const ql424OwnerPayload={schema:'rosevear.ql424.supervised-operational-acceptance.v1',
   ceremonyId:newCeremonyId,sourceId,episodeId,sourceRevision:revision,
   controllerRevision,custodyRecordDigest:ceremony.recordDigest,
   reportsDigest:hash(ql424Reports.map(x=>x.payload)),
   action:'ACCEPT_ISOLATED_OPERATIONAL_PILOT',acceptedAt:date(now-40),
   ownerId:'owner_identity_001',reviewerId:'reviewer_identity_001'};
  const ql424Owner={payload:ql424OwnerPayload,
   ownerSignature:signIt(ql424OwnerPayload,owner),
   reviewerSignature:signIt(ql424OwnerPayload,reviewer)};
  const acceptedDigest=hash({ql424Masters:ql424Reports.map(x=>x.payload),
   ql424Owner:ql424OwnerPayload});
  const reports=masters.map(masterId=>{
   const p={schema:'rosevear.ql430.master-runtime-acceptance.v1',masterId,
    ceremonyId:newCeremonyId,sourceId,episodeId,sourceRevision:revision,
    controllerRevision,ql429WitnessDigest,
    independentReceiverDigest:receiverAttestationDigest,
    ql424AcceptanceDigest:acceptedDigest,
    status:'VERIFIED_NEW_ISOLATED_ONE_TEST_RUNTIME',observedAt:date(now-30)};
   return {payload:p,signature:signIt(p,masterKeys[masterId])};
  });
  const ownerPayload={schema:'rosevear.ql430.owner-runtime-acceptance.v1',
   ceremonyId:newCeremonyId,sourceId,episodeId,sourceRevision:revision,
   controllerRevision,ql429WitnessDigest,independentReceiverDigest:receiverAttestationDigest,
   ql424AcceptanceDigest:acceptedDigest,reportsDigest:hash(reports.map(x=>x.payload)),
   action:'ACCEPT_FRESH_ISOLATED_PILOT_ONLY_KEEP_SLAVE_GATE_HOLD',
   ownerId:'Ree_Original',reviewerId:'Jack_Independent',acceptedAt:date(now-20)};
  return {ql424:{reports:ql424Reports,ownerAcceptance:ql424Owner},
   reports,ownerAcceptance:{payload:ownerPayload,
    ownerSignature:signIt(ownerPayload,owner),
    reviewerSignature:signIt(ownerPayload,reviewer)}};
 }};
 const ql424Inputs={enrollment:enrolled,activation,ql423Input:ql423.input,
  ql423Options:ql423.opts,ledger:ql424Ledger,receiverAdapter:adapter};
 const ql424Options={expectedSourceRevision:revision,
  expectedControllerRevision:controllerRevision,ownerPin:owner.pin,reviewerPin:reviewer.pin,
  receiverPin:receiver.pin,protectedOperatorSession:true,
  independentReceiverCustodyVerified:true,independentEnrollmentCustodyVerified:true,
  executeIntent:'EXECUTE_ISOLATED_ONE_TEST_CEREMONY',nowMs:now};
 const inputs={ql429Ledger,externalStoreId,reentryId,hostEnvelope,reentryAuthorization,
  ql424Inputs,ql424Options,protectedAudit,independentReceiverAdapter,
  runtimeEvidenceProvider};
 const opts={nowMs:now,ownerPin:owner.pin,reviewerPin:reviewer.pin,
  independentReceiverPin:independentReceiver.pin,
  masterPins:Object.fromEntries(masters.map(m=>[m,masterKeys[m].pin])),
  originalHostSessionVerified:true,independentQl429WitnessVerified:true,
  independentDualOwnerVerified:true,independentReceiverPinVerified:true,
  independentMasterPinsVerified:true,independentQl424AuthorityVerified:true};
 return {root,inputs,opts,protectedAudit,ql429Ledger,challenge,witnessRec,
  independentState,adapter,counts:()=>({enabled,disabled}),
  close:()=>rmSync(root,{recursive:true,force:true})};
}

test('valid QL-429 signed original-host witness plus fresh QL-424 ceremony and three-Master runtime yields isolated pilot only',async()=>{
 const a=setup();try{
  const r=await runQl430SupervisedPilotReentry(a.inputs,a.opts);
  assert.equal(r.state,'DURABLE_VERIFIED_THREE_MASTER_REENTRY_ISOLATED_PILOT');
  assert.equal(r.connection,'VERIFIED_CONNECTED_PILOT');
  assert.equal(r.receiver,'ISOLATED_ONE_TEST_ON');
  assert.equal(r.runtimeUptime,'SINGLE_SIGNED_RUNTIME_SNAPSHOT_NOT_CONTINUOUS_UPTIME');
  assert.equal(r.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
  assert.deepEqual(a.counts(),{enabled:1,disabled:0});
  assert.equal(openQl430ProtectedCeremonyAudit(join(a.root,'audit'))
   .read('accepted',newCeremonyId).recordDigest,r.acceptedRecordDigest);
  assert.equal((await runQl430SupervisedPilotReentry(a.inputs,a.opts)).state,'HOLD');
  assert.deepEqual(a.counts(),{enabled:1,disabled:0});
 }finally{a.close();}
});
test('missing protected original-host session and missing independently verified QL429 witness never enable',async()=>{
 for(const modify of [
  opts=>{opts.originalHostSessionVerified=false;},
  opts=>{opts.independentQl429WitnessVerified=false;},
  opts=>{opts.independentDualOwnerVerified=false;},
  opts=>{opts.independentQl424AuthorityVerified=false;}
 ]){
  const a=setup();try{
   modify(a.opts);
   assert.equal((await runQl430SupervisedPilotReentry(a.inputs,a.opts)).state,'HOLD');
   assert.deepEqual(a.counts(),{enabled:0,disabled:0});
  }finally{a.close();}
 }
});
test('wrong reused old ceremony, forged dual owner re-entry signature and wrong enrolled Master pin block enable',async()=>{
 for(const modify of [
  a=>{a.inputs.ql424Inputs.activation.payload.ceremonyId=oldScope.ceremonyId;},
  a=>{a.inputs.reentryAuthorization.ownerSignature=signIt(a.inputs.reentryAuthorization.payload,receiver);},
  a=>{a.opts.masterPins[masters[0]]=sender.pin;},
  a=>{a.inputs.ql424Options.protectedOperatorSession=false;}
 ]){
  const a=setup();try{
   modify(a);
   assert.equal((await runQl430SupervisedPilotReentry(a.inputs,a.opts)).state,'HOLD');
   assert.equal(a.counts().enabled,0);
  }finally{a.close();}
 }
});
test('forged independent receiver signature, ON state and stale runtime witness attempt fail-closed disable',async()=>{
 for(const mutate of [
  a=>{a.inputs.independentReceiverAdapter.readSignedState=async()=>({
   payload:a.independentState,signature:signIt(a.independentState,owner)});},
  a=>{const p={...a.independentState,receiverState:'OFF'};a.inputs.independentReceiverAdapter.readSignedState=async()=>({
   payload:p,signature:signRaw(p,independentReceiver)});},
  a=>{const p={...a.independentState,observedAt:date(now-61000)};
   a.inputs.independentReceiverAdapter.readSignedState=async()=>({
    payload:p,signature:signRaw(p,independentReceiver)});}
 ]){
  const a=setup();try{
   mutate(a);
   const r=await runQl430SupervisedPilotReentry(a.inputs,a.opts);
   assert.equal(r.state,'HOLD');assert.equal(r.connection,'HOLD');
   assert.deepEqual(a.counts(),{enabled:1,disabled:1});
   assert.equal(a.protectedAudit.read('accepted',newCeremonyId),null);
  }finally{a.close();}
 }
});
test('missing, duplicate or forged independent three-Master acceptance triggers fail-close',async()=>{
 for(const mutate of [
  async a=>{const orig=a.inputs.runtimeEvidenceProvider.readSignedAcceptance;
   a.inputs.runtimeEvidenceProvider.readSignedAcceptance=async args=>{
    const ev=await orig(args);ev.reports=ev.reports.slice(0,2);return ev;};},
  async a=>{const orig=a.inputs.runtimeEvidenceProvider.readSignedAcceptance;
   a.inputs.runtimeEvidenceProvider.readSignedAcceptance=async args=>{
    const ev=await orig(args);ev.reports=[ev.reports[0],ev.reports[0],ev.reports[2]];return ev;};},
  async a=>{const orig=a.inputs.runtimeEvidenceProvider.readSignedAcceptance;
   a.inputs.runtimeEvidenceProvider.readSignedAcceptance=async args=>{
    const ev=await orig(args);ev.ql424.reports[1].signature=signIt(ev.ql424.reports[1].payload,owner);return ev;};},
  async a=>{const orig=a.inputs.runtimeEvidenceProvider.readSignedAcceptance;
   a.inputs.runtimeEvidenceProvider.readSignedAcceptance=async args=>{
    const ev=await orig(args);ev.ownerAcceptance.reviewerSignature=signIt(ev.ownerAcceptance.payload,receiver);return ev;};}
 ]){
  const a=setup();try{
   await mutate(a);
   const r=await runQl430SupervisedPilotReentry(a.inputs,a.opts);
   assert.equal(r.state,'HOLD');
   assert.deepEqual(a.counts(),{enabled:1,disabled:1});
  }finally{a.close();}
 }
});
test('cannot silently retry failed ceremony after append-only preactivation latch',async()=>{
 const a=setup();try{
  a.inputs.independentReceiverAdapter.readSignedState=async()=>{throw Error('offline')};
  assert.equal((await runQl430SupervisedPilotReentry(a.inputs,a.opts)).state,'HOLD');
  assert.equal(a.protectedAudit.read('attempt',newCeremonyId).kind,'attempt');
  assert.equal((await runQl430SupervisedPilotReentry(a.inputs,a.opts)).state,'HOLD');
  assert.deepEqual(a.counts(),{enabled:1,disabled:1});
 }finally{a.close();}
});
test('receiver rollback failure cannot be shown as OFF or verified CONNECTED',async()=>{
 const a=setup();try{
  a.inputs.independentReceiverAdapter.readSignedState=async()=>{throw Error('offline')};
  a.adapter.disableOneTest=async()=>{throw Error('offline')};
  const r=await runQl430SupervisedPilotReentry(a.inputs,a.opts);
  assert.equal(r.state,'HOLD');
  assert.equal(r.receiver,'UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED');
  assert.equal(a.protectedAudit.read('accepted',newCeremonyId),null);
 }finally{a.close();}
});
