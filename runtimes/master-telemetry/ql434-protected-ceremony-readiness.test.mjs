import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl431ProtectedContinuityStore} from './ql431-post-reentry-continuity.mjs';
import {openQl432ProtectedRecoveryReviewLedger} from './ql432-external-incident-recovery.mjs';
import {openQl433ProtectedPrecheckLedger} from './ql433-recovery-decision-handoff.mjs';
import {openQl434ProtectedReadinessLedger,prepareQl434ProtectedAuthorityExport,
 runQl434OriginalHostSupervisedReadiness} from './ql434-protected-ceremony-readiness.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const kp=()=>{const k=generateKeyPairSync('ed25519');return {
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signPayload=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 k.privateKey).toString('base64')});
const iso=t=>new Date(t).toISOString();
const scope={ceremonyId:'old_ceremony_ql434_123456',sourceId:'rosevear-ai-hub',
 episodeId:'old_episode_ql434_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql434_12345678';
const nextCeremonyId='new_ceremony_ql434_123456';
const nextEpisodeId='new_episode_ql434_123456';
const authorityId='authority_ql434_12345678',challengeNonce='challenge_ql434_12345678';

function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql434-'));
 const now=Date.now()-15000;
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const ql432Ledger=openQl432ProtectedRecoveryReviewLedger(join(root,'ql432'));
 const ql433Ledger=openQl433ProtectedPrecheckLedger(join(root,'ql433'));
 const readinessLedger=openQl434ProtectedReadinessLedger(join(root,'ql434'));
 const seq=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const base={kind:'PENDING',scope,observationId:'observation_ql434_123456',
  observedAt:iso(now-4000),ql430AcceptedDigest:'a'.repeat(64),
  evidenceDigest:hash('pending_ql434'),sequences:seq,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const pending=ql431Store.append(scope,base,null);
 const off={...base,kind:'OFF',observedAt:iso(now-3000),
  shutdownAckDigest:'b'.repeat(64),receiverOffDigest:'c'.repeat(64)};
 const offRecord=ql431Store.append(scope,off,pending.recordDigest);
 const reconciled={...off,kind:'RECONCILED',observedAt:iso(now-2000),
  reportsDigest:'d'.repeat(64),ownerDecisionDigest:'e'.repeat(64)};
 const checkpoint=ql431Store.append(scope,reconciled,offRecord.recordDigest);
 const ql432Receipt=ql432Ledger.claimOnce(incidentId,'a'.repeat(64));
 const ql432Decision={state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_RECOVERY_REVIEW_ONLY',
  masterCount:3,slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
  nextStep:'NEW_QL429_QL430_OWNER_SUPERVISED_CEREMONY_ONLY',
  scope,incidentId,checkpointIndex:checkpoint.index,
  checkpointDigest:checkpoint.recordDigest,
  ownerReviewReceiptDigest:ql432Receipt.recordDigest,
  externalAnchorDigest:'1'.repeat(64),independentReadbackDigest:'2'.repeat(64)};
 const ql433Receipt=ql433Ledger.claimOnce(incidentId,'f'.repeat(64));
 const ql433Precheck={state:'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_NEW_CEREMONY_PRECHECK_ONLY',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',masterCount:3,
  permittedNextAction:'NEW_QL429_QL430_CEREMONY_WITH_SEPARATE_FRESH_AUTHORITY_NOT_ACTIVATED',
  scope,incidentId,nextCeremonyId,nextEpisodeId,
  externalDecisionAnchorDigest:'3'.repeat(64),
  independentReadbackDigest:'4'.repeat(64),
  ql432OwnerReviewReceiptDigest:ql432Receipt.recordDigest,
  precheckRecordDigest:ql433Receipt.recordDigest};
 const keys={issuer:kp(),witness:kp(),host:kp(),receiver:kp(),owner:kp(),
  reviewer:kp(),forger:kp(),masters:Object.fromEntries(MASTERS.map(m=>[m,kp()]))};
 const prep=prepareQl434ProtectedAuthorityExport({
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  authorityId,challengeNonce
 },{nowMs:now,protectedOriginalHostSession:true,independentQl433PrecheckVerified:true});
 assert.equal(prep.state,'QL434_NEW_CEREMONY_AUTHORITY_EXPORT_PREPARED_NOT_SIGNED');
 const e=prep.exportRecord;
 const issuerPayload={schema:'rosevear.ql434.independent-authority-handoff.v1',
  authorityId,challengeNonce,exportDigest:prep.exportDigest,
  scope,incidentId,ql433PrecheckReceiptDigest:ql433Receipt.recordDigest,
  nextCeremonyId,nextEpisodeId,
  status:'NEW_CEREMONY_READINESS_HANDOFF_NOT_ACTIVATION',
  issuedAt:iso(now)};
 const issuerEnvelope=signPayload(issuerPayload,keys.issuer);
 const witnessPayload={schema:'rosevear.ql434.independent-authority-witness.v1',
  authorityId,challengeNonce,exportDigest:prep.exportDigest,
  issuerDigest:hash(issuerPayload),nextCeremonyId,nextEpisodeId,
  status:'INDEPENDENT_HANDOFF_READBACK_NO_ACTIVATION',
  witnessedAt:iso(now)};
 const witnessEnvelope=signPayload(witnessPayload,keys.witness);
 const hostPayload={schema:'rosevear.ql434.original-host-new-ceremony-readiness.v1',
  hostMachineId:'DESKTOP-AE894KC',scope,incidentId,authorityId,challengeNonce,
  nextCeremonyId,nextEpisodeId,sourceRevision:scope.sourceRevision,
  controllerRevision:scope.controllerRevision,
  handoffWitnessDigest:hash(witnessPayload),receiverState:'OFF',
  readiness:'HOST_READY_FOR_SEPARATE_NEW_SUPERVISED_CEREMONY_ONLY',
  observedAt:iso(now)};
 const hostEnvelope=signPayload(hostPayload,keys.host);
 const receiverPayload={schema:'rosevear.ql434.independent-receiver-off.v1',
  scope,incidentId,authorityId,challengeNonce,hostReadinessDigest:hash(hostPayload),
  handoffWitnessDigest:hash(witnessPayload),receiverState:'OFF',observedAt:iso(now)};
 const receiverEnvelope=signPayload(receiverPayload,keys.receiver);
 const reports=MASTERS.map(masterId=>{
  const payload={schema:'rosevear.ql434.master-reentry-readiness.v1',
   masterId,scope,incidentId,authorityId,
   ql433PrecheckReceiptDigest:ql433Receipt.recordDigest,
   handoffWitnessDigest:hash(witnessPayload),
   receiverOffDigest:hash(receiverPayload),nextCeremonyId,nextEpisodeId,
   status:'NEW_CEREMONY_PREPARATION_ONLY_NOT_ACTIVATED',observedAt:iso(now)};
  return signPayload(payload,keys.masters[masterId]);
 });
 const ownerPayload={schema:'rosevear.ql434.dual-owner-new-ceremony-readiness.v1',
  scope,incidentId,authorityId,challengeNonce,
  ql433PrecheckReceiptDigest:ql433Receipt.recordDigest,
  handoffWitnessDigest:hash(witnessPayload),receiverOffDigest:hash(receiverPayload),
  mastersDigest:hash(reports.map(r=>r.payload)),nextCeremonyId,nextEpisodeId,
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',
  action:'AUTHORIZE_NEW_CEREMONY_READINESS_ONLY_RECEIVER_OFF_NO_ACTIVATION',
  authorizedAt:iso(now)};
 const ownerAcceptance={payload:ownerPayload,
  ownerSignature:signPayload(ownerPayload,keys.owner).signature,
  reviewerSignature:signPayload(ownerPayload,keys.reviewer).signature};
 const counts={handoff:0,host:0,receiver:0,masters:0,enable:0};
 const input={ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  readinessLedger,authorityId,challengeNonce,
  authorityHandoffProvider:{readSignedHandoff:async()=>{counts.handoff++;return {
   issuer:issuerEnvelope,witness:witnessEnvelope};}},
  originalHostAdapter:{readSignedReadiness:async()=>{counts.host++;return hostEnvelope;}},
  independentReceiverAdapter:{readSignedState:async()=>{counts.receiver++;return receiverEnvelope;}},
  masterEvidenceProvider:{readSignedReports:async()=>{counts.masters++;return reports;}},
  ownerAcceptance};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl433PrecheckVerified:true,
  issuerPin:keys.issuer.pin,witnessPin:keys.witness.pin,
  originalHostPin:keys.host.pin,receiverPin:keys.receiver.pin,
  ownerPin:keys.owner.pin,reviewerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin])),
  independentIssuerPinVerified:true,independentWitnessPinVerified:true,
  independentOriginalHostPinVerified:true,independentReceiverPinVerified:true,
  independentMasterPinsVerified:true,independentOwnerCustodyVerified:true,
  independentReviewerCustodyVerified:true};
 return {root,keys,scope,ql431Store,ql432Ledger,ql433Ledger,readinessLedger,
  ql432Decision,ql433Precheck,prep,input,opts,counts,
  issuerEnvelope,witnessEnvelope,hostEnvelope,receiverEnvelope,reports,ownerAcceptance,
  run:()=>runQl434OriginalHostSupervisedReadiness(input,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('QL434 independently witnessed authority and original-host OFF readiness produce HOLD-only durable new-ceremony receipt',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(r.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(r.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
  assert.equal(r.masterCount,3);
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_READINESS_ONLY');
  assert.equal(r.nextCeremonyId,nextCeremonyId);
  assert.match(r.permittedNextAction,/NOT_ACTIVATED/);
  assert.equal(f.readinessLedger.read(incidentId)?.recordDigest,r.readinessRecordDigest);
  assert.deepEqual(f.counts,{handoff:1,host:1,receiver:1,masters:1,enable:0});
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.handoff,1);
 }finally{f.cleanup();}
});
test('QL434 prepared export is expressly unsigned and non-activating',()=>{
 const f=fixture();try{
  assert.equal(f.prep.state,'QL434_NEW_CEREMONY_AUTHORITY_EXPORT_PREPARED_NOT_SIGNED');
  assert.equal(f.prep.connection,'HOLD');
  assert.equal(f.prep.activationAuthorized,false);
  assert.equal(f.prep.exportRecord.ql433PrecheckReceiptDigest,
   f.ql433Precheck.precheckRecordDigest);
  assert.equal(f.prep.exportRecord.hostMachineId,'DESKTOP-AE894KC');
 }finally{f.cleanup();}
});
test('QL434 denies missing protected original host and unverified prior authority without fetching signed handoff',async()=>{
 for(const field of ['protectedOriginalHostSession','independentQl433PrecheckVerified']){
  const f=fixture();try{
   f.opts[field]=false;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.handoff,0);
  }finally{f.cleanup();}
 }
});
test('QL434 rejects forged issuer/witness, changed exact scope, stale readback and replay nonce',async()=>{
 for(const mode of ['issuer','witness','scope','stale','nonce']){
  const f=fixture();try{
   if(mode==='issuer')f.issuerEnvelope.signature=
    signPayload(f.issuerEnvelope.payload,f.keys.forger).signature;
   if(mode==='witness')f.witnessEnvelope.signature=
    signPayload(f.witnessEnvelope.payload,f.keys.forger).signature;
   if(mode==='scope')f.issuerEnvelope.payload.scope.sourceRevision='c'.repeat(40);
   if(mode==='stale')f.witnessEnvelope.payload.witnessedAt=iso(f.opts.nowMs-61000);
   if(mode==='nonce')f.witnessEnvelope.payload.challengeNonce='old_nonce_ql434_123456';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.host,0,mode);
  }finally{f.cleanup();}
 }
});
test('QL434 original-host readiness rejects TEMPLAR, ON, changed revision and forged signer',async()=>{
 for(const mode of ['TEMPLAR','ON','revision','forged']){
  const f=fixture();try{
   if(mode==='TEMPLAR')f.hostEnvelope.payload.hostMachineId='TEMPLAR';
   if(mode==='ON')f.hostEnvelope.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='revision')f.hostEnvelope.payload.controllerRevision='c'.repeat(40);
   if(mode==='forged')f.hostEnvelope.signature=
    signPayload(f.hostEnvelope.payload,f.keys.forger).signature;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.receiver,0,mode);
  }finally{f.cleanup();}
 }
});
test('QL434 independently signed receiver OFF is required, not only original host testimony',async()=>{
 for(const mode of ['ON','forged','stale']){
  const f=fixture();try{
   if(mode==='ON')f.receiverEnvelope.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='forged')f.receiverEnvelope.signature=
    signPayload(f.receiverEnvelope.payload,f.keys.forger).signature;
   if(mode==='stale')f.receiverEnvelope.payload.observedAt=iso(f.opts.nowMs-61000);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.masters,0,mode);
  }finally{f.cleanup();}
 }
});
test('QL434 three Master reports require all distinct signers and consistent handoff',async()=>{
 for(const mode of ['missing','duplicate','forged','wrongHandoff']){
  const f=fixture();try{
   if(mode==='missing')f.reports.pop();
   if(mode==='duplicate')f.reports[2]=f.reports[1];
   if(mode==='forged')f.reports[0].signature=
    signPayload(f.reports[0].payload,f.keys.forger).signature;
   if(mode==='wrongHandoff')f.reports[0].payload.handoffWitnessDigest='a'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.readinessLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL434 owner and independent reviewer cannot authorize activation',async()=>{
 for(const mode of ['activate','ownerForged','reviewerForged','ownerMissing']){
  const f=fixture();try{
   if(mode==='activate')f.ownerAcceptance.payload.action='ENABLE_RECEIVER_AND_CONNECT';
   if(mode==='ownerForged')f.ownerAcceptance.ownerSignature=
    signPayload(f.ownerAcceptance.payload,f.keys.forger).signature;
   if(mode==='reviewerForged')f.ownerAcceptance.reviewerSignature=
    signPayload(f.ownerAcceptance.payload,f.keys.forger).signature;
   if(mode==='ownerMissing')f.opts.independentOwnerCustodyVerified=false;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.readinessLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL434 invalid predecessor QL431, QL432 or QL433 exact receipt blocks remote handoff',async()=>{
 for(const mode of ['ql431','ql432','ql433','reactivate']){
  const f=fixture();try{
   if(mode==='ql431')f.ql432Decision.checkpointDigest='9'.repeat(64);
   if(mode==='ql432')f.ql432Decision.ownerReviewReceiptDigest='8'.repeat(64);
   if(mode==='ql433')f.ql433Precheck.precheckRecordDigest='7'.repeat(64);
   if(mode==='reactivate')f.ql433Precheck.permittedNextAction='ACTIVATE_EXISTING_CEREMONY';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.handoff,0);
  }finally{f.cleanup();}
 }
});
test('QL434 local one-use ledger detects tampering, rejects replay and never enables a receiver',async()=>{
 const f=fixture();try{
  assert.equal((await f.run()).state,'DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF');
  const file=join(f.root,'ql434','ql434-readiness-'+incidentId+'.json');
  writeFileSync(file,JSON.stringify({schema:'rosevear.ql434.readiness-receipt.v1'}));
  assert.throws(()=>f.readinessLedger.read(incidentId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.enable,0);
 }finally{f.cleanup();}
});
