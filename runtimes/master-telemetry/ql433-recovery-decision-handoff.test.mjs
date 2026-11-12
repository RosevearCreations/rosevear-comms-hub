import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl431ProtectedContinuityStore} from './ql431-post-reentry-continuity.mjs';
import {openQl432ProtectedRecoveryReviewLedger} from './ql432-external-incident-recovery.mjs';
import {openQl433ProtectedPrecheckLedger,prepareQl433RecoveryDecisionExport,
 reviewQl433NewCeremonyBoundary} from './ql433-recovery-decision-handoff.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return {
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 k.privateKey).toString('base64')});
const iso=ms=>new Date(ms).toISOString();
const scope={ceremonyId:'old_ceremony_ql433_123456',sourceId:'rosevear-ai-hub',
 episodeId:'old_episode_ql433_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql433_12345678',exportId='export_ql433_12345678';
const challengeNonce='challenge_ql433_12345678';
const nextCeremonyId='next_ceremony_ql433_123456';
const nextEpisodeId='next_episode_ql433_123456';

function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql433-'));
 const now=Date.now()-10000;
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const ql432Ledger=openQl432ProtectedRecoveryReviewLedger(join(root,'ql432'));
 const precheckLedger=openQl433ProtectedPrecheckLedger(join(root,'ql433'));
 const seq=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const base={kind:'PENDING',scope,observationId:'observation_ql433_123456',
  observedAt:iso(now-3000),ql430AcceptedDigest:'a'.repeat(64),
  evidenceDigest:hash('pending_ql433'),sequences:seq,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const pending=ql431Store.append(scope,base,null);
 const off={...base,kind:'OFF',observedAt:iso(now-2000),
  shutdownAckDigest:'b'.repeat(64),receiverOffDigest:'c'.repeat(64)};
 const offRecord=ql431Store.append(scope,off,pending.recordDigest);
 const reconciled={...off,kind:'RECONCILED',observedAt:iso(now-1000),
  reportsDigest:'d'.repeat(64),ownerDecisionDigest:'e'.repeat(64)};
 const checkpoint=ql431Store.append(scope,reconciled,offRecord.recordDigest);
 const receipt=ql432Ledger.claimOnce(incidentId,'f'.repeat(64));
 const decision={state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_RECOVERY_REVIEW_ONLY',masterCount:3,
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
  nextStep:'NEW_QL429_QL430_OWNER_SUPERVISED_CEREMONY_ONLY',
  scope,incidentId,checkpointIndex:checkpoint.index,
  checkpointDigest:checkpoint.recordDigest,
  externalAnchorDigest:'1'.repeat(64),
  independentReadbackDigest:'2'.repeat(64),
  ownerReviewReceiptDigest:receipt.recordDigest};
 const keys={anchor:key(),reader:key(),originalHost:key(),receiver:key(),owner:key(),
  reviewer:key(),forger:key(),masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const prep=prepareQl433RecoveryDecisionExport({
  ql432Decision:decision,ql432Ledger,ql431Store,exportId,
  challengeNonce,nextCeremonyId,nextEpisodeId
 },{nowMs:now,protectedOriginalHostSession:true,independentQl432DecisionVerified:true});
 assert.equal(prep.state,'QL433_RECOVERY_DECISION_EXPORT_PREPARED_NOT_ANCHORED');
 const e=prep.exportRecord;
 const anchorPayload={schema:'rosevear.ql433.external-decision-anchor.v1',
  exportId,challengeNonce,exportDigest:prep.exportDigest,
  ql431CheckpointDigest:e.ql431CheckpointDigest,
  ql432OwnerReviewReceiptDigest:e.ql432OwnerReviewReceiptDigest,
  nextCeremonyId,nextEpisodeId,
  status:'EXTERNAL_IMMUTABLE_DECISION_EXPORT_ANCHORED',anchoredAt:iso(now)};
 const anchorEnvelope=signed(anchorPayload,keys.anchor);
 const readerPayload={schema:'rosevear.ql433.independent-decision-anchor-readback.v1',
  exportId,challengeNonce,exportDigest:prep.exportDigest,
  anchorDigest:hash(anchorPayload),
  status:'INDEPENDENT_EXACT_DECISION_EXPORT_READBACK',readAt:iso(now)};
 const readerEnvelope=signed(readerPayload,keys.reader);
 const hostPayload={schema:'rosevear.ql433.original-host-reentry-off.v1',
  hostMachineId:'DESKTOP-AE894KC',scope,incidentId,
  exportId,challengeNonce,nextCeremonyId,nextEpisodeId,
  externalDecisionAnchorDigest:hash(anchorPayload),
  independentReadbackDigest:hash(readerPayload),receiverState:'OFF',observedAt:iso(now)};
 const hostEnvelope=signed(hostPayload,keys.originalHost);
 const offPayload={schema:'rosevear.ql433.independent-reentry-off.v1',
  scope,incidentId,exportId,challengeNonce,
  hostEvidenceDigest:hash(hostPayload),decisionReadbackDigest:hash(readerPayload),
  receiverState:'OFF',observedAt:iso(now)};
 const offEnvelope=signed(offPayload,keys.receiver);
 const reports=MASTERS.map(masterId=>{
  const payload={schema:'rosevear.ql433.master-new-ceremony-precheck.v1',
   masterId,scope,incidentId,ql432OwnerReviewReceiptDigest:receipt.recordDigest,
   externalDecisionReadbackDigest:hash(readerPayload),
   receiverOffDigest:hash(offPayload),nextCeremonyId,nextEpisodeId,
   status:'NEW_CEREMONY_PRECHECK_ONLY_RECEIVER_OFF',observedAt:iso(now)};
  return signed(payload,keys.masters[masterId]);
 });
 const ownerPayload={schema:'rosevear.ql433.owner-new-ceremony-precheck.v1',
  scope,incidentId,exportId,challengeNonce,
  ql432OwnerReviewReceiptDigest:receipt.recordDigest,
  externalDecisionReadbackDigest:hash(readerPayload),
  receiverOffDigest:hash(offPayload),
  mastersDigest:hash(reports.map(r=>r.payload)),
  nextCeremonyId,nextEpisodeId,
  action:'AUTHORIZE_NEW_CEREMONY_PRECHECK_ONLY_RECEIVER_OFF_NO_ACTIVATION',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',authorizedAt:iso(now)};
 const ownerAcceptance={payload:ownerPayload,
  ownerSignature:signed(ownerPayload,keys.owner).signature,
  reviewerSignature:signed(ownerPayload,keys.reviewer).signature};
 const counts={external:0,host:0,receiver:0,master:0,enable:0};
 const inputs={ql432Decision:decision,ql432Ledger,ql431Store,precheckLedger,
  exportId,challengeNonce,nextCeremonyId,nextEpisodeId,
  externalDecisionAdapter:{readSignedDecision:async()=>{counts.external++;return {
   anchor:anchorEnvelope,reader:readerEnvelope};}},
  originalHostAdapter:{readSignedState:async()=>{counts.host++;return hostEnvelope;}},
  independentReceiverAdapter:{readSignedState:async()=>{counts.receiver++;return offEnvelope;}},
  masterProvider:{readSignedReports:async()=>{counts.master++;return reports;}},
  ownerAcceptance};
 const options={nowMs:now,protectedOriginalHostSession:true,
  independentQl432DecisionVerified:true,independentAnchorPinVerified:true,
  independentReaderPinVerified:true,independentOriginalHostPinVerified:true,
  independentReceiverPinVerified:true,independentMasterPinsVerified:true,
  independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true,
  anchorPin:keys.anchor.pin,readerPin:keys.reader.pin,
  originalHostPin:keys.originalHost.pin,receiverPin:keys.receiver.pin,
  ownerPin:keys.owner.pin,reviewerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,keys,scope,decision,checkpoint,receipt,ql431Store,ql432Ledger,
  precheckLedger,inputs,options,prep,counts,anchorEnvelope,readerEnvelope,
  hostEnvelope,offEnvelope,reports,ownerAcceptance,
  run:()=>reviewQl433NewCeremonyBoundary(inputs,options),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('signed independent external decision and original host OFF authorize only NEW ceremony precheck and HOLD',async()=>{
 const f=fixture();try{
  const out=await f.run();
  assert.equal(out.state,'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY');
  assert.equal(out.connection,'HOLD');
  assert.equal(out.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(out.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
  assert.equal(out.ownerAcceptance,'DUAL_SIGNED_NEW_CEREMONY_PRECHECK_ONLY');
  assert.equal(out.nextCeremonyId,nextCeremonyId);
  assert.equal(out.nextEpisodeId,nextEpisodeId);
  assert.equal(out.masterCount,3);
  assert.match(out.permittedNextAction,/NOT_ACTIVATED/);
  assert.equal(f.precheckLedger.read(incidentId).recordDigest,out.precheckRecordDigest);
  assert.deepEqual(f.counts,{external:1,host:1,receiver:1,master:1,enable:0});
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.external,1);
 }finally{f.cleanup();}
});
test('export is a proposal only and cannot reuse previous ceremony or episode',()=>{
 const f=fixture();try{
  assert.equal(f.prep.connection,'HOLD');
  assert.equal(f.prep.state,'QL433_RECOVERY_DECISION_EXPORT_PREPARED_NOT_ANCHORED');
  for(const patch of [{nextCeremonyId:scope.ceremonyId},{nextEpisodeId:scope.episodeId}]){
   const result=prepareQl433RecoveryDecisionExport({
    ql432Decision:f.decision,ql432Ledger:f.ql432Ledger,ql431Store:f.ql431Store,
    exportId,challengeNonce,nextCeremonyId,nextEpisodeId,...patch
   },{nowMs:f.options.nowMs,protectedOriginalHostSession:true,
    independentQl432DecisionVerified:true});
   assert.equal(result.state,'HOLD');
  }
 }finally{f.cleanup();}
});
test('unverified owner recovery and missing protected original-host session have no external side effect',async()=>{
 for(const field of ['independentQl432DecisionVerified','protectedOriginalHostSession']){
  const f=fixture();try{
   f.options[field]=false;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.external,0);
  }finally{f.cleanup();}
 }
});
test('forged anchor, independent reader, wrong decision scope or stale challenge cannot pass',async()=>{
 for(const mode of ['anchor','reader','oldDecision','nonce','stale']){
  const f=fixture();try{
   if(mode==='anchor')f.anchorEnvelope.signature=
    signed(f.anchorEnvelope.payload,f.keys.forger).signature;
   if(mode==='reader')f.readerEnvelope.signature=
    signed(f.readerEnvelope.payload,f.keys.forger).signature;
   if(mode==='oldDecision')f.anchorEnvelope.payload.ql431CheckpointDigest='0'.repeat(64);
   if(mode==='nonce')f.readerEnvelope.payload.challengeNonce='wrong_nonce_ql433_123456';
   if(mode==='stale')f.readerEnvelope.payload.readAt=iso(f.options.nowMs-61000);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.host,0);
  }finally{f.cleanup();}
 }
});
test('non-original host, ON state and forged original-host OFF are rejected',async()=>{
 for(const mode of ['TEMPLAR','ON','forged']){
  const f=fixture();try{
   if(mode==='TEMPLAR')f.hostEnvelope.payload.hostMachineId='TEMPLAR';
   if(mode==='ON')f.hostEnvelope.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='forged')f.hostEnvelope.signature=
    signed(f.hostEnvelope.payload,f.keys.forger).signature;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.receiver,0);
  }finally{f.cleanup();}
 }
});
test('independent receiver OFF must be fresh and separately signed',async()=>{
 for(const mode of ['ON','forged']){
  const f=fixture();try{
   if(mode==='ON')f.offEnvelope.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='forged')f.offEnvelope.signature=
    signed(f.offEnvelope.payload,f.keys.forger).signature;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.master,0);
  }finally{f.cleanup();}
 }
});
test('missing, duplicate or forged three Master reports block precheck',async()=>{
 for(const mode of ['missing','duplicate','forged']){
  const f=fixture();try{
   if(mode==='missing')f.reports.pop();
   if(mode==='duplicate')f.reports[2]=f.reports[1];
   if(mode==='forged')f.reports[0].signature=
    signed(f.reports[0].payload,f.keys.forger).signature;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.precheckLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('dual owner approval cannot authorize enable or falsely pass a forged signature',async()=>{
 for(const mode of ['enable','owner','reviewer','noConsent']){
  const f=fixture();try{
   if(mode==='enable')f.ownerAcceptance.payload.action='EXECUTE_ISOLATED_ONE_TEST';
   if(mode==='owner')f.ownerAcceptance.ownerSignature=
    signed(f.ownerAcceptance.payload,f.keys.forger).signature;
   if(mode==='reviewer')f.ownerAcceptance.reviewerSignature=
    signed(f.ownerAcceptance.payload,f.keys.forger).signature;
   if(mode==='noConsent')f.options.independentOwnerCustodyVerified=false;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.precheckLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('torn QL431 checkpoint or forged QL432 private receipt must fail closed before remote read',async()=>{
 for(const mode of ['ql431','ql432']){
  const f=fixture();try{
   if(mode==='ql431')f.decision.checkpointDigest='9'.repeat(64);
   if(mode==='ql432')f.decision.ownerReviewReceiptDigest='8'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.external,0);
  }finally{f.cleanup();}
 }
});
test('private precheck receipt detects tampering and refuses second use',async()=>{
 const f=fixture();try{
  assert.equal((await f.run()).state,'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY');
  const path=join(f.root,'ql433','ql433-precheck-'+incidentId+'.json');
  writeFileSync(path,JSON.stringify({schema:'rosevear.ql433.owner-precheck-receipt.v1'}));
  assert.throws(()=>f.precheckLedger.read(incidentId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.external,1);
 }finally{f.cleanup();}
});
