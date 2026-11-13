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
import {openQl436ProtectedShutdownLedger} from './ql436-signed-pilot-shutdown.mjs';
import {openQl437ProtectedClosureLedger,prepareQl437PostShutdownEvidenceExport,
 readQl437IncidentClosureContinuity,runQl437AnchoredOffClosure} from './ql437-anchored-off-closure.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=()=>{const pair=generateKeyPairSync('ed25519');return {
 privateKey:pair.privateKey,pin:pair.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 k.privateKey).toString('base64')});
const iso=ms=>new Date(ms).toISOString();
const scope={ceremonyId:'old_ceremony_ql437_123456',sourceId:'rosevear-ai-hub',
 episodeId:'old_episode_ql437_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql437_12345678',incidentReviewId='review_ql437_12345678';
const nextCeremonyId='next_ceremony_ql437_123456',
 nextEpisodeId='next_episode_ql437_123456',
 shutdownNonce='shutdown_ql437_123456789',
 exportId='export_ql437_12345678',anchorChallengeNonce='nonce_ql437_123456789';

function fixture({late=false,lateOff=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql437-'));
 const now=Date.now()-10000,leaseExpiresAt=iso(now-4000);
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const ql432Ledger=openQl432ProtectedRecoveryReviewLedger(join(root,'ql432'));
 const ql433Ledger=openQl433ProtectedPrecheckLedger(join(root,'ql433'));
 const ql434Ledger=openQl434ProtectedReadinessLedger(join(root,'ql434'));
 const ql435Ledger=openQl435ProtectedPilotLedger(join(root,'ql435'));
 const ql436Ledger=openQl436ProtectedShutdownLedger(join(root,'ql436'));
 const closureLedger=openQl437ProtectedClosureLedger(join(root,'ql437'));
 const seq=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const initial={kind:'PENDING',scope,observationId:'observation_ql437_123456',
  observedAt:iso(now-3000),ql430AcceptedDigest:'a'.repeat(64),
  evidenceDigest:hash('ql437_pending'),sequences:seq,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const start=ql431Store.append(scope,initial,null);
 const off={...initial,kind:'OFF',observedAt:iso(now-2000),
  shutdownAckDigest:'b'.repeat(64),receiverOffDigest:'c'.repeat(64)};
 const step=ql431Store.append(scope,off,start.recordDigest);
 const terminal={...off,kind:'RECONCILED',observedAt:iso(now-1000),
  reportsDigest:'d'.repeat(64),ownerDecisionDigest:'e'.repeat(64)};
 const c=ql431Store.append(scope,terminal,step.recordDigest);
 const r432=ql432Ledger.claimOnce(incidentId,'1'.repeat(64));
 const ql432Decision={state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',masterCount:3,
  scope,incidentId,checkpointIndex:c.index,checkpointDigest:c.recordDigest,
  ownerReviewReceiptDigest:r432.recordDigest};
 const r433=ql433Ledger.claimOnce(incidentId,'2'.repeat(64));
 const ql433Precheck={state:'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY',
  connection:'HOLD',masterCount:3,scope,incidentId,nextCeremonyId,nextEpisodeId,
  precheckRecordDigest:r433.recordDigest};
 const r434=ql434Ledger.claimOnce(incidentId,'3'.repeat(64));
 const ql434Readiness={state:'DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF',
  connection:'HOLD',activationAuthorized:false,
  receiver:'OFF_VERIFIED_SIGNED_READBACK',masterCount:3,
  scope,incidentId,nextCeremonyId,nextEpisodeId,readinessRecordDigest:r434.recordDigest};
 const r435p=ql435Ledger.claimOnce('pending',nextCeremonyId,'4'.repeat(64));
 const r435a=ql435Ledger.claimOnce('accepted',nextCeremonyId,'5'.repeat(64));
 const ql435Decision={state:'DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION',
  connection:'HOLD',activationAuthorized:false,masterCount:3,
  receiver:'ISOLATED_ONE_TEST_ON_SIGNED_WITNESS_ONLY',
  ownerAcceptance:'DUAL_SIGNED_SINGLE_PILOT_EVIDENCE_REVIEW',
  originalIncidentId:incidentId,nextCeremonyId,nextEpisodeId,leaseExpiresAt,
  pendingReceiptDigest:r435p.recordDigest,acceptedReceiptDigest:r435a.recordDigest};
 const r436p=ql436Ledger.claimOnce('pending',nextCeremonyId,'6'.repeat(64));
 const r436r=ql436Ledger.claimOnce('reconciled',nextCeremonyId,'7'.repeat(64));
 const disposition=late?'LATE_HOST_SHUTDOWN_ESCALATION':
  lateOff?'LATE_INDEPENDENT_OFF_READBACK_ESCALATION':
   'WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED';
 const ql436Review={state:'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED',
  connection:'HOLD',receiver:'OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK',
  ownerAcceptance:'DUAL_SIGNED_OFF_AND_EXPIRY_REVIEW_ONLY',
  activationAuthorized:false,masterCount:3,
  permittedNextAction:'SUPERVISED_POST_OFF_CONTINUITY_REVIEW_NO_AUTOMATIC_REENTRY',
  originalIncidentId:incidentId,incidentReviewId,nextCeremonyId,shutdownNonce,
  leaseExpiresAt,leaseDisposition:disposition,
  leaseExceptionEscalationRequired:late||lateOff,
  pendingReceiptDigest:r436p.recordDigest,reconciledReceiptDigest:r436r.recordDigest};
 const keys={anchor:key(),reader:key(),host:key(),receiver:key(),
  exception:key(),owner:key(),reviewer:key(),forger:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const base={ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store,exportId,anchorChallengeNonce};
 const prepared=prepareQl437PostShutdownEvidenceExport(base,{
  nowMs:now,protectedOriginalHostSession:true,independentQl436ReviewVerified:true});
 assert.equal(prepared.state,'QL437_OFF_EVIDENCE_EXPORT_PREPARED_NOT_EXTERNALLY_ANCHORED');
 const r=prepared.exportRecord;
 const anchorPayload={schema:'rosevear.ql437.external-off-evidence-anchor.v1',
  exportId,anchorChallengeNonce,exportDigest:prepared.exportDigest,
  originalIncidentId:incidentId,incidentReviewId,nextCeremonyId,
  ql436ReconciledReceiptDigest:r436r.recordDigest,leaseDisposition:disposition,
  status:'EXTERNAL_IMMUTABLE_SIGNED_OFF_EVIDENCE_ANCHORED',anchoredAt:iso(now)};
 const anchor=signed(anchorPayload,keys.anchor);
 const readerPayload={schema:'rosevear.ql437.independent-off-anchor-readback.v1',
  exportId,anchorChallengeNonce,exportDigest:prepared.exportDigest,
  externalAnchorDigest:hash(anchorPayload),originalIncidentId:incidentId,
  status:'INDEPENDENT_EXACT_ANCHORED_OFF_EVIDENCE_READBACK',readAt:iso(now)};
 const reader=signed(readerPayload,keys.reader);
 const hostPayload={schema:'rosevear.ql437.original-host-post-shutdown-off.v1',
  hostMachineId:'DESKTOP-AE894KC',scope,originalIncidentId:incidentId,
  nextCeremonyId,exportId,anchorChallengeNonce,
  anchorDigest:hash(anchorPayload),independentReadbackDigest:hash(readerPayload),
  receiverState:'OFF',shutdownContinuitySequence:15,observedAt:iso(now)};
 const host=signed(hostPayload,keys.host);
 const offPayload={schema:'rosevear.ql437.independent-post-shutdown-off.v1',
  originalIncidentId:incidentId,nextCeremonyId,exportId,anchorChallengeNonce,
  hostOffDigest:hash(hostPayload),independentAnchorReadbackDigest:hash(readerPayload),
  receiverState:'OFF',offContinuitySequence:15,observedAt:iso(now)};
 const receiver=signed(offPayload,keys.receiver);
 const reports=MASTERS.map(masterId=>{
  const p={schema:'rosevear.ql437.master-post-shutdown-incident-continuity.v1',
   masterId,originalIncidentId:incidentId,nextCeremonyId,
   exportDigest:prepared.exportDigest,
   independentAnchorReadbackDigest:hash(readerPayload),
   independentOffDigest:hash(offPayload),leaseDisposition:disposition,
   status:'SIGNED_POST_SHUTDOWN_OFF_HOLD_NO_REENTRY',observedAt:iso(now)};
  return signed(p,keys.masters[masterId]);
 });
 const mastersDigest=hash(reports.map(x=>x.payload));
 const exceptionPayload={schema:'rosevear.ql437.independent-expired-lease-custody.v1',
  originalIncidentId:incidentId,incidentReviewId,nextCeremonyId,
  exportDigest:prepared.exportDigest,
  independentAnchorReadbackDigest:hash(readerPayload),
  independentOffDigest:hash(offPayload),mastersDigest,
  leaseDisposition:disposition,
  status:'LEASE_EXCEPTION_INDEPENDENT_CUSTODY_OPEN_NOT_CLOSED',recordedAt:iso(now)};
 const exception=signed(exceptionPayload,keys.exception);
 const ownerPayload={schema:'rosevear.ql437.dual-owner-incident-closure-readback.v1',
  originalIncidentId:incidentId,incidentReviewId,
  exportDigest:prepared.exportDigest,
  independentAnchorReadbackDigest:hash(readerPayload),
  independentOffDigest:hash(offPayload),mastersDigest,
  exceptionCustodyDigest:late||lateOff?hash(exceptionPayload):null,
  leaseDisposition:disposition,
  action:late||lateOff?'ACK_LEASE_EXCEPTION_OPEN_NO_INCIDENT_CLOSURE_KEEP_HOLD':
   'ACK_ON_TIME_POST_SHUTDOWN_INCIDENT_CLOSURE_NO_REENTRY_KEEP_HOLD',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',reviewedAt:iso(now)};
 const ownerDecision={payload:ownerPayload,
  ownerSignature:signed(ownerPayload,keys.owner).signature,
  reviewerSignature:signed(ownerPayload,keys.reviewer).signature};
 const calls={anchor:0,host:0,receiver:0,masters:0,exception:0,enable:0};
 const inputs={...base,closureLedger,
  externalAnchorProvider:{readSignedAnchor:async()=>{calls.anchor++;return {anchor,reader};}},
  originalHostAdapter:{readSignedOff:async()=>{calls.host++;return host;}},
  independentReceiverAdapter:{readSignedOff:async()=>{calls.receiver++;return receiver;}},
  masterProvider:{readSignedReports:async()=>{calls.masters++;return reports;}},
  independentExceptionProvider:{readSignedException:async()=>{
   calls.exception++;return exception;}},
  ownerDecision};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl436ReviewVerified:true,
  independentAnchorPinVerified:true,independentReaderPinVerified:true,
  independentOriginalHostPinVerified:true,independentReceiverPinVerified:true,
  independentExceptionPinVerified:true,independentMasterPinsVerified:true,
  independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true,
  anchorPin:keys.anchor.pin,readerPin:keys.reader.pin,
  originalHostPin:keys.host.pin,receiverPin:keys.receiver.pin,
  exceptionPin:keys.exception.pin,ownerPin:keys.owner.pin,reviewerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,keys,base,inputs,opts,prepared,anchor,reader,host,receiver,
  reports,exception,ownerDecision,calls,disposition,
  ql436Review,ql435Decision,ql434Readiness,ql433Precheck,ql432Decision,
  closureLedger,run:()=>runQl437AnchoredOffClosure(inputs,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('QL437 independently anchored on-time signed OFF and dual-owner closure retain HOLD without activation',async()=>{
 const f=fixture();try{
  const result=await f.run();
  assert.equal(result.state,'DURABLE_QL437_OWNER_SUPERVISED_INCIDENT_CLOSURE_READBACK');
  assert.equal(result.incidentClosed,true);
  assert.equal(result.leaseExceptionOpen,false);
  assert.equal(result.connection,'HOLD');
  assert.equal(result.activationAuthorized,false);
  assert.equal(result.receiver,'OFF_VERIFIED_BY_HOST_AND_INDEPENDENT_POST_SHUTDOWN_WITNESS');
  assert.equal(result.masterCount,3);
  assert.equal(result.ownerAcceptance,'DUAL_SIGNED_INCIDENT_CLOSURE_NO_REENTRY');
  assert.match(result.permittedNextAction,/NO_AUTOMATIC_REENTRY/);
  assert.equal(f.closureLedger.read('pending',incidentId).recordDigest,result.pendingReceiptDigest);
  assert.equal(f.closureLedger.read('final',incidentId).recordDigest,result.finalReceiptDigest);
  assert.deepEqual(f.calls,{anchor:1,host:1,receiver:1,masters:1,exception:0,enable:0});
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.calls.anchor,1);
 }finally{f.cleanup();}
});
test('QL437 late host shutdown is independently preserved OPEN and cannot be labeled closed',async()=>{
 const f=fixture({late:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL437_EXPIRED_LEASE_EXCEPTION_OPEN_INDEPENDENT_CUSTODY');
  assert.equal(r.incidentClosed,false);
  assert.equal(r.leaseExceptionOpen,true);
  assert.equal(r.leaseDisposition,'LATE_HOST_SHUTDOWN_ESCALATION');
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_LEASE_EXCEPTION_OPEN');
  assert.equal(r.connection,'HOLD');
  assert.equal(f.calls.exception,1);
 }finally{f.cleanup();}
});
test('QL437 late independent OFF readback is independently preserved OPEN',async()=>{
 const f=fixture({lateOff:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL437_EXPIRED_LEASE_EXCEPTION_OPEN_INDEPENDENT_CUSTODY');
  assert.equal(r.incidentClosed,false);
  assert.equal(r.leaseDisposition,'LATE_INDEPENDENT_OFF_READBACK_ESCALATION');
  assert.equal(f.calls.exception,1);
 }finally{f.cleanup();}
});
test('QL437 export is a proposal, never an independently anchored proof by itself',()=>{
 const f=fixture();try{
  assert.equal(f.prepared.connection,'HOLD');
  assert.equal(f.prepared.activationAuthorized,false);
  assert.equal(f.prepared.state,'QL437_OFF_EVIDENCE_EXPORT_PREPARED_NOT_EXTERNALLY_ANCHORED');
  assert.equal(f.prepared.exportRecord.ql436ReconciledReceiptDigest,
   f.ql436Review.reconciledReceiptDigest);
 }finally{f.cleanup();}
});
test('QL437 protected original-host authority and independent QL436 custody gate precede external anchor',async()=>{
 for(const mode of ['host','ql436Verified']){
  const f=fixture();try{
   if(mode==='host')f.opts.protectedOriginalHostSession=false;
   else f.opts.independentQl436ReviewVerified=false;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.calls.anchor,0);
   assert.equal(f.closureLedger.read('pending',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL437 forged external anchor, reader, replayed nonce and stale readback fail closed',async()=>{
 for(const mode of ['anchor','reader','nonce','stale','digest']){
  const f=fixture();try{
   if(mode==='anchor')f.anchor.signature=
    signed(f.anchor.payload,f.keys.forger).signature;
   if(mode==='reader')f.reader.signature=
    signed(f.reader.payload,f.keys.forger).signature;
   if(mode==='nonce')f.reader.payload.anchorChallengeNonce='replayed_nonce_ql437';
   if(mode==='stale')f.reader.payload.readAt=iso(f.opts.nowMs-61000);
   if(mode==='digest')f.anchor.payload.ql436ReconciledReceiptDigest='a'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.calls.host,0);
   assert.ok(f.closureLedger.read('pending',incidentId));
  }finally{f.cleanup();}
 }
});
test('QL437 TEMPLAR, host ON, forged original host or stale host OFF fail closed',async()=>{
 for(const mode of ['TEMPLAR','ON','forged','stale']){
  const f=fixture();try{
   if(mode==='TEMPLAR')f.host.payload.hostMachineId='TEMPLAR';
   if(mode==='ON')f.host.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='forged')f.host.signature=
    signed(f.host.payload,f.keys.forger).signature;
   if(mode==='stale')f.host.payload.observedAt=iso(f.opts.nowMs-61000);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.calls.receiver,0);
  }finally{f.cleanup();}
 }
});
test('QL437 independent receiver OFF witness is mandatory; ON, replay, sequence and forgery fail',async()=>{
 for(const mode of ['missing','ON','wrongHost','lowSeq','forged','nonce']){
  const f=fixture();try{
   if(mode==='missing')f.inputs.independentReceiverAdapter.readSignedOff=
    async()=>{throw Error('unavailable')};
   if(mode==='ON')f.receiver.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='wrongHost')f.receiver.payload.hostOffDigest='a'.repeat(64);
   if(mode==='lowSeq')f.receiver.payload.offContinuitySequence=14;
   if(mode==='forged')f.receiver.signature=
    signed(f.receiver.payload,f.keys.forger).signature;
   if(mode==='nonce')f.receiver.payload.anchorChallengeNonce='old_nonce_ql437';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.calls.masters,0);
   assert.equal(f.closureLedger.read('final',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL437 three Master signed readbacks require all distinct and bound to the same anchor',async()=>{
 for(const mode of ['missing','duplicate','forged','wrongAnchor']){
  const f=fixture();try{
   if(mode==='missing')f.reports.pop();
   if(mode==='duplicate')f.reports[2]=f.reports[1];
   if(mode==='forged')f.reports[0].signature=
    signed(f.reports[0].payload,f.keys.forger).signature;
   if(mode==='wrongAnchor')f.reports[0].payload.independentAnchorReadbackDigest='a'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.closureLedger.read('final',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL437 late lease needs separately signed exception OPEN custody before dual-owner decision',async()=>{
 for(const mode of ['missing','forged','falseClosed','wrongMaster']){
  const f=fixture({late:true});try{
   if(mode==='missing')f.inputs.independentExceptionProvider.readSignedException=
    async()=>{throw Error('custody down')};
   if(mode==='forged')f.exception.signature=
    signed(f.exception.payload,f.keys.forger).signature;
   if(mode==='falseClosed')f.exception.payload.status='CLOSED';
   if(mode==='wrongMaster')f.exception.payload.mastersDigest='b'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.closureLedger.read('final',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL437 owners cannot forge closure or close an expired lease',async()=>{
 for(const mode of ['owner','reviewer','connected','falseClosed','missingCustody']){
  const f=fixture({late:true});try{
   if(mode==='owner')f.ownerDecision.ownerSignature=
    signed(f.ownerDecision.payload,f.keys.forger).signature;
   if(mode==='reviewer')f.ownerDecision.reviewerSignature=
    signed(f.ownerDecision.payload,f.keys.forger).signature;
   if(mode==='connected')f.ownerDecision.payload.action='PROMOTE_ALL_APPS_CONNECTED';
   if(mode==='falseClosed')f.ownerDecision.payload.action=
    'ACK_ON_TIME_POST_SHUTDOWN_INCIDENT_CLOSURE_NO_REENTRY_KEEP_HOLD';
   if(mode==='missingCustody')f.opts.independentReviewerCustodyVerified=false;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.closureLedger.read('final',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL437 tampered QL431–436 predecessor chain blocks remote anchoring',async()=>{
 for(const mode of ['ql431','ql432','ql433','ql434','ql435','ql436','disposition']){
  const f=fixture();try{
   if(mode==='ql431')f.ql432Decision.checkpointDigest='9'.repeat(64);
   if(mode==='ql432')f.ql432Decision.ownerReviewReceiptDigest='8'.repeat(64);
   if(mode==='ql433')f.ql433Precheck.precheckRecordDigest='7'.repeat(64);
   if(mode==='ql434')f.ql434Readiness.readinessRecordDigest='6'.repeat(64);
   if(mode==='ql435')f.ql435Decision.acceptedReceiptDigest='5'.repeat(64);
   if(mode==='ql436')f.ql436Review.reconciledReceiptDigest='4'.repeat(64);
   if(mode==='disposition')f.ql436Review.leaseDisposition='UNKNOWN';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.calls.anchor,0);
   assert.equal(f.closureLedger.read('pending',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL437 interrupted external anchoring leaves PENDING, replay denied, private tampering detected',async()=>{
 const f=fixture();try{
  f.inputs.externalAnchorProvider.readSignedAnchor=async()=>{throw Error('anchor unavailable')};
  assert.equal((await f.run()).state,'HOLD');
  assert.ok(f.closureLedger.read('pending',incidentId));
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(readQl437IncidentClosureContinuity(f.closureLedger,incidentId).state,'HOLD');
  writeFileSync(join(f.root,'ql437','ql437-pending-'+incidentId+'.json'),
   '{"schema":"rosevear.ql437.incident-closure-custody.v1"}');
  assert.throws(()=>f.closureLedger.read('pending',incidentId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
 }finally{f.cleanup();}
});
test('QL437 private final readback alone never proves live OFF or activation',async()=>{
 const f=fixture();try{
  assert.equal((await f.run()).state,'DURABLE_QL437_OWNER_SUPERVISED_INCIDENT_CLOSURE_READBACK');
  const restored=readQl437IncidentClosureContinuity(f.closureLedger,incidentId);
  assert.equal(restored.state,'QL437_PRIVATE_FINAL_RECORD_PRESENT_NOT_LIVE_OFF_PROOF');
  assert.equal(restored.connection,'HOLD');
  assert.equal(restored.activationAuthorized,false);
  assert.equal(f.calls.enable,0);
 }finally{f.cleanup();}
});
