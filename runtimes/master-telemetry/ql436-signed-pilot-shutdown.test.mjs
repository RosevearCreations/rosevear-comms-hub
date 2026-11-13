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
import {openQl435ProtectedPilotLedger} from './ql435-original-host-pilot-witness.mjs';
import {prepareQl436ShutdownReconciliation,openQl436ProtectedShutdownLedger,
 readQl436IncidentContinuity,runQl436SignedShutdownReconciliation} from './ql436-signed-pilot-shutdown.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const kp=()=>{const k=generateKeyPairSync('ed25519');return {
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 k.privateKey).toString('base64')});
const iso=ms=>new Date(ms).toISOString();
const scope={ceremonyId:'old_ceremony_ql436_123456',sourceId:'rosevear-ai-hub',
 episodeId:'old_episode_ql436_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql436_12345678',reviewId='review_ql436_123456789',
 nextCeremonyId='next_ceremony_ql436_123456',
 nextEpisodeId='next_episode_ql436_123456',
 challengeId='challenge_ql436_12345678',
 originalChallengeNonce='original_nonce_ql436_123456',
 shutdownNonce='shutdown_nonce_ql436_123456';
function fixture({leaseDeltaMs=2000,shutdownOffsetMs=-1000,offOffsetMs=0}={}){
 const root=mkdtempSync(join(tmpdir(),'ql436-'));
 const now=Date.now()-5000,leaseExpiresAt=iso(now+leaseDeltaMs);
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const ql432Ledger=openQl432ProtectedRecoveryReviewLedger(join(root,'ql432'));
 const ql433Ledger=openQl433ProtectedPrecheckLedger(join(root,'ql433'));
 const ql434Ledger=openQl434ProtectedReadinessLedger(join(root,'ql434'));
 const ql435Ledger=openQl435ProtectedPilotLedger(join(root,'ql435'));
 const shutdownLedger=openQl436ProtectedShutdownLedger(join(root,'ql436'));
 const seq=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const base={kind:'PENDING',scope,observationId:'observation_ql436_123456',
  observedAt:iso(now-4000),ql430AcceptedDigest:'a'.repeat(64),
  evidenceDigest:hash('ql436_initial'),sequences:seq,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const p=ql431Store.append(scope,base,null);
 const off={...base,kind:'OFF',observedAt:iso(now-3000),
  shutdownAckDigest:'b'.repeat(64),receiverOffDigest:'c'.repeat(64)};
 const o=ql431Store.append(scope,off,p.recordDigest);
 const rc={...off,kind:'RECONCILED',observedAt:iso(now-2000),
  reportsDigest:'d'.repeat(64),ownerDecisionDigest:'e'.repeat(64)};
 const c=ql431Store.append(scope,rc,o.recordDigest);
 const r432=ql432Ledger.claimOnce(incidentId,'1'.repeat(64));
 const ql432Decision={state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_RECOVERY_REVIEW_ONLY',masterCount:3,
  scope,incidentId,checkpointIndex:c.index,checkpointDigest:c.recordDigest,
  ownerReviewReceiptDigest:r432.recordDigest};
 const r433=ql433Ledger.claimOnce(incidentId,'2'.repeat(64));
 const ql433Precheck={state:'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY',
  connection:'HOLD',ownerAcceptance:'DUAL_SIGNED_NEW_CEREMONY_PRECHECK_ONLY',
  masterCount:3,scope,incidentId,nextCeremonyId,nextEpisodeId,
  precheckRecordDigest:r433.recordDigest};
 const r434=ql434Ledger.claimOnce(incidentId,'3'.repeat(64));
 const ql434Readiness={state:'DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF',
  connection:'HOLD',activationAuthorized:false,
  receiver:'OFF_VERIFIED_SIGNED_READBACK',
  ownerAcceptance:'DUAL_SIGNED_READINESS_ONLY',
  masterCount:3,scope,incidentId,nextCeremonyId,nextEpisodeId,
  readinessRecordDigest:r434.recordDigest};
 const ql435Pending=ql435Ledger.claimOnce('pending',nextCeremonyId,'4'.repeat(64));
 const ql435Accepted=ql435Ledger.claimOnce('accepted',nextCeremonyId,'5'.repeat(64));
 const ql435Decision={state:'DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION',
  connection:'HOLD',activationAuthorized:false,
  receiver:'ISOLATED_ONE_TEST_ON_SIGNED_WITNESS_ONLY',
  ownerAcceptance:'DUAL_SIGNED_SINGLE_PILOT_EVIDENCE_REVIEW',
  manualReceiverIsolationRequired:true,masterCount:3,
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
  permittedNextAction:'SUPERVISED_FAIL_CLOSED_OFF_AND_SIGNED_RUNTIME_CONTINUITY_RECHECK_ONLY',
  originalIncidentId:incidentId,nextCeremonyId,nextEpisodeId,challengeId,
  challengeNonce:originalChallengeNonce,leaseExpiresAt,
  pendingReceiptDigest:ql435Pending.recordDigest,
  acceptedReceiptDigest:ql435Accepted.recordDigest,
  independentOnWitnessDigest:'6'.repeat(64)};
 const key={host:kp(),receiver:kp(),owner:kp(),reviewer:kp(),forger:kp(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,kp()]))};
 const prep=prepareQl436ShutdownReconciliation({
  ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  shutdownNonce,incidentReviewId:reviewId
 },{nowMs:now,protectedOriginalHostSession:true,independentQl435DecisionVerified:true});
 assert.equal(prep.state,'QL436_SHUTDOWN_RECONCILIATION_PREPARED_NOT_CONFIRMED');
 const req=prep.request;
 const hostPayload={schema:'rosevear.ql436.original-host-signed-shutdown.v1',
  requestDigest:prep.requestDigest,hostMachineId:'DESKTOP-AE894KC',
  scope,originalIncidentId:incidentId,incidentReviewId:reviewId,
  nextCeremonyId,nextEpisodeId,challengeId,
  originalChallengeNonce,shutdownNonce,leaseExpiresAt,
  ql435AcceptedReceiptDigest:ql435Accepted.recordDigest,
  shutdownMechanism:'ORIGINAL_HOST_FAIL_CLOSED_PILOT_DISABLE',
  receiverState:'OFF',shutdownAt:iso(now+shutdownOffsetMs),observedAt:iso(now),
  shutdownSequence:12};
 const host=signed(hostPayload,key.host);
 const offPayload={schema:'rosevear.ql436.independent-receiver-off-readback.v1',
  requestDigest:prep.requestDigest,originalIncidentId:incidentId,
  incidentReviewId:reviewId,nextCeremonyId,challengeId,shutdownNonce,
  hostShutdownDigest:hash(hostPayload),leaseExpiresAt,
  receiverState:'OFF',offContinuitySequence:12,observedAt:iso(now+offOffsetMs)};
 const receiver=signed(offPayload,key.receiver);
 const leaseDisposition=Date.parse(hostPayload.shutdownAt)>Date.parse(leaseExpiresAt)?
  'LATE_HOST_SHUTDOWN_ESCALATION':
  Date.parse(offPayload.observedAt)>Date.parse(leaseExpiresAt)?
   'LATE_INDEPENDENT_OFF_READBACK_ESCALATION':
   'WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED';
 const reports=MASTERS.map(masterId=>{
  const payload={schema:'rosevear.ql436.three-master-shutdown-continuity.v1',
   masterId,requestDigest:prep.requestDigest,incidentReviewId:reviewId,
   originalIncidentId:incidentId,nextCeremonyId,shutdownNonce,
   hostShutdownDigest:hash(hostPayload),independentOffDigest:hash(offPayload),
   leaseExpiresAt,leaseDisposition,
   decision:'ACK_SIGNED_OFF_NO_REACTIVATION',observedAt:iso(now+offOffsetMs)};
  return signed(payload,key.masters[masterId]);
 });
 const decisionPayload={schema:'rosevear.ql436.dual-owner-shutdown-incident-review.v1',
  requestDigest:prep.requestDigest,incidentReviewId:reviewId,
  originalIncidentId:incidentId,nextCeremonyId,shutdownNonce,
  hostShutdownDigest:hash(hostPayload),independentOffDigest:hash(offPayload),
  mastersDigest:hash(reports.map(x=>x.payload)),leaseDisposition,
  action:leaseDisposition==='WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED'?
   'ACK_SIGNED_OFF_WITHIN_LEASE_RETAIN_HOLD':
   'ACK_SIGNED_OFF_AND_ESCALATE_LEASE_EXCEPTION_RETAIN_HOLD',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',
  reviewedAt:iso(now+offOffsetMs)};
 const ownerDecision={payload:decisionPayload,
  ownerSignature:signed(decisionPayload,key.owner).signature,
  reviewerSignature:signed(decisionPayload,key.reviewer).signature};
 const counts={host:0,receiver:0,masters:0,enable:0};
 const input={ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  shutdownLedger,shutdownNonce,incidentReviewId:reviewId,
  originalHostAdapter:{readSignedShutdown:async()=>{counts.host++;return host;}},
  independentReceiverAdapter:{readSignedOff:async()=>{counts.receiver++;return receiver;}},
  masterEvidenceProvider:{readSignedReports:async()=>{counts.masters++;return reports;}},
  ownerDecision};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl435DecisionVerified:true,
  originalHostPin:key.host.pin,receiverPin:key.receiver.pin,
  ownerPin:key.owner.pin,reviewerPin:key.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,key.masters[m].pin])),
  independentOriginalHostPinVerified:true,independentReceiverPinVerified:true,
  independentMasterPinsVerified:true,
  independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true};
 return {root,key,scope,ql431Store,ql432Ledger,ql433Ledger,ql434Ledger,
  ql435Ledger,shutdownLedger,ql435Decision,ql434Readiness,
  ql433Precheck,ql432Decision,host,receiver,reports,ownerDecision,leaseDisposition,
  prep,input,opts,counts,run:()=>runQl436SignedShutdownReconciliation(input,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('QL436 durable signed shutdown with independently observed OFF and three Masters retains HOLD',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(r.receiver,'OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK');
  assert.equal(r.leaseDisposition,'WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED');
  assert.equal(r.leaseExceptionEscalationRequired,false);
  assert.equal(r.masterCount,3);
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_OFF_AND_EXPIRY_REVIEW_ONLY');
  assert.equal(f.shutdownLedger.read('pending',nextCeremonyId)?.recordDigest,r.pendingReceiptDigest);
  assert.equal(f.shutdownLedger.read('reconciled',nextCeremonyId)?.recordDigest,r.reconciledReceiptDigest);
  assert.deepEqual(f.counts,{host:1,receiver:1,masters:1,enable:0});
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.host,1);
  assert.equal(readQl436IncidentContinuity(f.shutdownLedger,nextCeremonyId).connection,'HOLD');
 }finally{f.cleanup();}
});
test('preparation is explicitly not shutdown proof or CONNECTED',()=>{
 const f=fixture();try{
  assert.equal(f.prep.state,'QL436_SHUTDOWN_RECONCILIATION_PREPARED_NOT_CONFIRMED');
  assert.equal(f.prep.receiver,'UNKNOWN_UNTIL_INDEPENDENT_SIGNED_OFF');
  assert.equal(f.prep.connection,'HOLD');
  assert.equal(f.prep.activationAuthorized,false);
  assert.equal(f.prep.request.ql435AcceptedReceiptDigest,
   f.ql435Decision.acceptedReceiptDigest);
 }finally{f.cleanup();}
});
test('missing original-host authorization or independent accepted pilot custody never creates pending',async()=>{
 for(const field of ['protectedOriginalHostSession','independentQl435DecisionVerified']){
  const f=fixture();try{
   f.opts[field]=false;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.shutdownLedger.read('pending',nextCeremonyId),null);
   assert.equal(f.counts.host,0);
  }finally{f.cleanup();}
 }
});
test('original host shutdown forged, wrong machine, ON, wrong nonce or stale fails closed with pending custody',async()=>{
 for(const mode of ['forged','TEMPLAR','ON','nonce','stale']){
  const f=fixture();try{
   if(mode==='forged')f.host.signature=signed(f.host.payload,f.key.forger).signature;
   if(mode==='TEMPLAR')f.host.payload.hostMachineId='TEMPLAR';
   if(mode==='ON')f.host.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='nonce')f.host.payload.shutdownNonce='wrong_nonce_ql436';
   if(mode==='stale')f.host.payload.observedAt=iso(f.opts.nowMs-61000);
   const r=await f.run();
   assert.equal(r.state,'HOLD',mode);
   assert.equal(r.receiver,'UNKNOWN_UNTIL_INDEPENDENT_SIGNED_OFF');
   assert.equal(r.manualReceiverIsolationRequired,true);
   assert.equal(f.counts.receiver,0);
   assert.ok(f.shutdownLedger.read('pending',nextCeremonyId));
   assert.equal(f.shutdownLedger.read('reconciled',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('missing, forged, ON, replayed or stale independent OFF cannot turn incident CLOSED',async()=>{
 for(const mode of ['missing','forged','ON','nonce','oldHostDigest','sequence']){
  const f=fixture();try{
   if(mode==='missing')f.input.independentReceiverAdapter.readSignedOff=
    async()=>{throw Error('OFF witness unavailable')};
   if(mode==='forged')f.receiver.signature=
    signed(f.receiver.payload,f.key.forger).signature;
   if(mode==='ON')f.receiver.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='nonce')f.receiver.payload.shutdownNonce='old_nonce_ql436_123456';
   if(mode==='oldHostDigest')f.receiver.payload.hostShutdownDigest='a'.repeat(64);
   if(mode==='sequence')f.receiver.payload.offContinuitySequence=11;
   const r=await f.run();
   assert.equal(r.state,'HOLD',mode);
   assert.equal(r.receiver,'UNKNOWN_UNTIL_INDEPENDENT_SIGNED_OFF');
   assert.ok(f.shutdownLedger.read('pending',nextCeremonyId));
   assert.equal(f.shutdownLedger.read('reconciled',nextCeremonyId),null);
   assert.equal(f.counts.masters,0);
  }finally{f.cleanup();}
 }
});
test('late host shutdown is reconciled as an escalated lease violation, never on time',async()=>{
 const f=fixture({leaseDeltaMs:-2000,shutdownOffsetMs:-1000});
 try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED');
  assert.equal(r.leaseDisposition,'LATE_HOST_SHUTDOWN_ESCALATION');
  assert.equal(r.leaseExceptionEscalationRequired,true);
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
 }finally{f.cleanup();}
});
test('independent OFF readback after lease expiry is an escalation even if host shutdown was timely',async()=>{
 const f=fixture({leaseDeltaMs:-500,shutdownOffsetMs:-1000});
 try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED');
  assert.equal(r.leaseDisposition,'LATE_INDEPENDENT_OFF_READBACK_ESCALATION');
  assert.equal(r.leaseExceptionEscalationRequired,true);
  assert.equal(r.connection,'HOLD');
 }finally{f.cleanup();}
});
test('three-Master incident continuity rejects absent, duplicated, forged and mismatched lease disposition',async()=>{
 for(const mode of ['missing','duplicate','forged','wrongLease']){
  const f=fixture();try{
   if(mode==='missing')f.reports.pop();
   if(mode==='duplicate')f.reports[2]=f.reports[1];
   if(mode==='forged')f.reports[0].signature=
    signed(f.reports[0].payload,f.key.forger).signature;
   if(mode==='wrongLease')f.reports[0].payload.leaseDisposition='LATE_HOST_SHUTDOWN_ESCALATION';
   const r=await f.run();
   assert.equal(r.state,'HOLD',mode);
   assert.ok(f.shutdownLedger.read('pending',nextCeremonyId));
   assert.equal(f.shutdownLedger.read('reconciled',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('dual owner cannot conceal late lease, forge signature, or promote CONNECTED',async()=>{
 for(const mode of ['forgedOwner','forgedReviewer','CONNECTED','missingCustody']){
  const f=fixture();try{
   if(mode==='forgedOwner')f.ownerDecision.ownerSignature=
    signed(f.ownerDecision.payload,f.key.forger).signature;
   if(mode==='forgedReviewer')f.ownerDecision.reviewerSignature=
    signed(f.ownerDecision.payload,f.key.forger).signature;
   if(mode==='CONNECTED')f.ownerDecision.payload.action='PROMOTE_ALL_APPS_CONNECTED';
   if(mode==='missingCustody')f.opts.independentOwnerCustodyVerified=false;
   const r=await f.run();
   assert.equal(r.state,'HOLD',mode);
   assert.equal(f.shutdownLedger.read('reconciled',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('late lease cannot be silently accepted using an on-time owner decision',async()=>{
 const f=fixture({leaseDeltaMs:-2000,shutdownOffsetMs:-1000});
 try{
  f.ownerDecision.payload.action='ACK_SIGNED_OFF_WITHIN_LEASE_RETAIN_HOLD';
  const r=await f.run();
  assert.equal(r.state,'HOLD');
  assert.equal(f.shutdownLedger.read('reconciled',nextCeremonyId),null);
 }finally{f.cleanup();}
});
test('mutated QL431 through QL435 chain blocks shutdown review before pending is recorded',async()=>{
 for(const mode of ['ql431','ql432','ql433','ql434','ql435']){
  const f=fixture();try{
   if(mode==='ql431')f.ql432Decision.checkpointDigest='8'.repeat(64);
   if(mode==='ql432')f.ql432Decision.ownerReviewReceiptDigest='7'.repeat(64);
   if(mode==='ql433')f.ql433Precheck.precheckRecordDigest='6'.repeat(64);
   if(mode==='ql434')f.ql434Readiness.readinessRecordDigest='5'.repeat(64);
   if(mode==='ql435')f.ql435Decision.acceptedReceiptDigest='4'.repeat(64);
   const r=await f.run();
   assert.equal(r.state,'HOLD',mode);
   assert.equal(f.counts.host,0);
   assert.equal(f.shutdownLedger.read('pending',nextCeremonyId),null);
  }finally{f.cleanup();}
 }
});
test('shutdown request failure leaves durable incident pending and replay is prohibited',async()=>{
 const f=fixture();
 try{
  f.input.originalHostAdapter.readSignedShutdown=async()=>{throw Error('host unavailable')};
  const r=await f.run();
  assert.equal(r.state,'HOLD');
  assert.ok(f.shutdownLedger.read('pending',nextCeremonyId));
  assert.equal(f.shutdownLedger.read('reconciled',nextCeremonyId),null);
  assert.equal(readQl436IncidentContinuity(f.shutdownLedger,nextCeremonyId).state,'HOLD');
  assert.equal((await f.run()).state,'HOLD');
 }finally{f.cleanup();}
});
test('tampered shutdown receipt is detected, and never grants a new ON challenge',async()=>{
 const f=fixture();try{
  assert.equal((await f.run()).state,'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED');
  writeFileSync(join(f.root,'ql436','ql436-reconciled-'+nextCeremonyId+'.json'),
   '{"schema":"rosevear.ql436.isolated-pilot-shutdown-custody.v1"}');
  assert.throws(()=>f.shutdownLedger.read('reconciled',nextCeremonyId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.enable,0);
 }finally{f.cleanup();}
});
