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
import {openQl437ProtectedClosureLedger} from './ql437-anchored-off-closure.mjs';
import {openQl438ProtectedExceptionLedger} from './ql438-expired-lease-remediation.mjs';
import {prepareQl439NewCeremonyReadiness,openQl439ProtectedReadinessLedger,
 readQl439ReadinessContinuity,runQl439RenewedAnchorOffReadiness}
 from './ql439-renewed-off-readiness.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const k=()=>{const key=generateKeyPairSync('ed25519');return {
 privateKey:key.privateKey,pin:key.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,key)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 key.privateKey).toString('base64')});
const iso=n=>new Date(n).toISOString();
const scope={ceremonyId:'old_ceremony_ql439_123456',sourceId:'rosevear-ai-hub',
 episodeId:'old_episode_ql439_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql439_12345678',
 nextCeremonyId='next_ceremony_ql439_123456',
 nextEpisodeId='next_episode_ql439_123456',
 proposedCeremonyId='proposed_ceremony_ql439_123456',
 proposedEpisodeId='proposed_episode_ql439_123456',
 renewalNonce='renew_nonce_ql439_12345678';
function fixture({lateOff=false,incorrectClosure=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql439-'));
 const now=Date.now()-5000,leaseExpiresAt=iso(now-10000);
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const ql432Ledger=openQl432ProtectedRecoveryReviewLedger(join(root,'ql432'));
 const ql433Ledger=openQl433ProtectedPrecheckLedger(join(root,'ql433'));
 const ql434Ledger=openQl434ProtectedReadinessLedger(join(root,'ql434'));
 const ql435Ledger=openQl435ProtectedPilotLedger(join(root,'ql435'));
 const ql436Ledger=openQl436ProtectedShutdownLedger(join(root,'ql436'));
 const ql437Ledger=openQl437ProtectedClosureLedger(join(root,'ql437'));
 const ql438Ledger=openQl438ProtectedExceptionLedger(join(root,'ql438'));
 const readinessLedger=openQl439ProtectedReadinessLedger(join(root,'ql439'));
 const seq=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const initial={kind:'PENDING',scope,observationId:'observation_ql439_123456',
  observedAt:iso(now-3500),ql430AcceptedDigest:'a'.repeat(64),
  evidenceDigest:hash('ql439_initial'),sequences:seq,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const first=ql431Store.append(scope,initial,null);
 const off={...initial,kind:'OFF',observedAt:iso(now-2500),
  shutdownAckDigest:'b'.repeat(64),receiverOffDigest:'c'.repeat(64)};
 const second=ql431Store.append(scope,off,first.recordDigest);
 const terminal={...off,kind:'RECONCILED',observedAt:iso(now-1500),
  reportsDigest:'d'.repeat(64),ownerDecisionDigest:'e'.repeat(64)};
 const checkpoint=ql431Store.append(scope,terminal,second.recordDigest);
 const r432=ql432Ledger.claimOnce(incidentId,'1'.repeat(64));
 const ql432Decision={state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',masterCount:3,scope,incidentId,
  checkpointIndex:checkpoint.index,checkpointDigest:checkpoint.recordDigest,
  ownerReviewReceiptDigest:r432.recordDigest};
 const r433=ql433Ledger.claimOnce(incidentId,'2'.repeat(64));
 const ql433Precheck={state:'DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY',
  connection:'HOLD',scope,incidentId,nextCeremonyId,nextEpisodeId,
  precheckRecordDigest:r433.recordDigest};
 const r434=ql434Ledger.claimOnce(incidentId,'3'.repeat(64));
 const ql434Readiness={state:'DURABLE_QL434_SIGNED_NEW_CEREMONY_READINESS_HANDOFF',
  connection:'HOLD',activationAuthorized:false,scope,incidentId,
  nextCeremonyId,nextEpisodeId,readinessRecordDigest:r434.recordDigest};
 const p435=ql435Ledger.claimOnce('pending',nextCeremonyId,'4'.repeat(64));
 const a435=ql435Ledger.claimOnce('accepted',nextCeremonyId,'5'.repeat(64));
 const ql435Decision={state:'DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION',
  connection:'HOLD',activationAuthorized:false,
  originalIncidentId:incidentId,nextCeremonyId,nextEpisodeId,leaseExpiresAt,
  pendingReceiptDigest:p435.recordDigest,acceptedReceiptDigest:a435.recordDigest};
 const p436=ql436Ledger.claimOnce('pending',nextCeremonyId,'6'.repeat(64));
 const r436=ql436Ledger.claimOnce('reconciled',nextCeremonyId,'7'.repeat(64));
 const leaseDisposition=lateOff?'LATE_INDEPENDENT_OFF_READBACK_ESCALATION':
  'LATE_HOST_SHUTDOWN_ESCALATION';
 const ql436Review={state:'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED',
  connection:'HOLD',activationAuthorized:false,
  receiver:'OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK',
  originalIncidentId:incidentId,nextCeremonyId,leaseExpiresAt,
  leaseDisposition,leaseExceptionEscalationRequired:true,
  pendingReceiptDigest:p436.recordDigest,reconciledReceiptDigest:r436.recordDigest};
 const p437=ql437Ledger.claimOnce('pending',incidentId,'8'.repeat(64));
 const f437=ql437Ledger.claimOnce('final',incidentId,'9'.repeat(64));
 const ql437Exception={state:'DURABLE_QL437_EXPIRED_LEASE_EXCEPTION_OPEN_INDEPENDENT_CUSTODY',
  connection:'HOLD',activationAuthorized:false,incidentClosed:false,
  leaseExceptionOpen:true,ownerAcceptance:'DUAL_SIGNED_LEASE_EXCEPTION_OPEN',
  receiver:'OFF_VERIFIED_BY_HOST_AND_INDEPENDENT_POST_SHUTDOWN_WITNESS',
  masterCount:3,originalIncidentId:incidentId,nextCeremonyId,leaseDisposition,
  externalAnchorDigest:'a'.repeat(64),independentReadbackDigest:'b'.repeat(64),
  pendingReceiptDigest:p437.recordDigest,finalReceiptDigest:f437.recordDigest};
 const p438=ql438Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const c438=ql438Ledger.claimOnce('closed',incidentId,'b'.repeat(64));
 const ql438Closure={state:incorrectClosure?'HOLD':
  'DURABLE_QL438_OWNER_GATED_LEASE_EXCEPTION_CLOSURE_READBACK',
  connection:'HOLD',activationAuthorized:false,
  receiver:'OFF_VERIFIED_SIGNED_REMEDIATION_WITNESS',
  ownerAcceptance:'DUAL_SIGNED_CORRECTIVE_EVIDENCE_EXCEPTION_CLOSURE_ONLY',
  leaseExceptionOpen:false,incidentClosed:true,masterCount:3,
  permittedNextAction:'NEW_SEPARATELY_AUTHORIZED_SUPERVISED_CEREMONY_NO_AUTOMATIC_REENTRY',
  originalIncidentId:incidentId,nextCeremonyId,
  remediationId:'remediation_ql439_12345678',leaseDisposition,
  priorQl437ExternalAnchorDigest:ql437Exception.externalAnchorDigest,
  remediationAnchorDigest:'c'.repeat(64),
  independentAnchorReadbackDigest:'d'.repeat(64),
  pendingReceiptDigest:p438.recordDigest,closedReceiptDigest:c438.recordDigest};
 const keys={renewal:k(),reader:k(),host:k(),receiver:k(),owner:k(),reviewer:k(),
  forger:k(),masters:Object.fromEntries(MASTERS.map(m=>[m,k()]))};
 const base={ql438Closure,ql438Ledger,ql437Exception,ql437Ledger,
  ql436Review,ql436Ledger,ql435Decision,ql435Ledger,
  ql434Readiness,ql434Ledger,ql433Precheck,ql433Ledger,
  ql432Decision,ql432Ledger,ql431Store,
  proposedCeremonyId,proposedEpisodeId,renewalNonce};
 const prepared=prepareQl439NewCeremonyReadiness(base,{
  nowMs:now,protectedOriginalHostSession:true,
  independentQl438ClosureVerified:true});
 if(!incorrectClosure)assert.equal(prepared.state,'QL439_NEW_CEREMONY_READINESS_PREPARED_NOT_AUTHORIZED');
 const req=prepared.request;
 const renewalPayload=req?{
  schema:'rosevear.ql439.independent-corrective-closure-anchor-renewal.v1',
  requestDigest:prepared.requestDigest,originalIncidentId:incidentId,
  previousRemediationAnchorDigest:req.ql438CorrectiveAnchorDigest,
  previousIndependentReaderDigest:req.ql438IndependentReaderDigest,
  proposedCeremonyId,proposedEpisodeId,renewalNonce,
  status:'INDEPENDENT_RENEWED_CORRECTIVE_CLOSURE_ANCHOR_NO_ACTIVATION',
  renewedAt:iso(now)}:null;
 const renewal=renewalPayload?signed(renewalPayload,keys.renewal):null;
 const readerPayload=req?{
  schema:'rosevear.ql439.independent-renewed-anchor-readback.v1',
  requestDigest:prepared.requestDigest,originalIncidentId:incidentId,
  proposedCeremonyId,renewalNonce,renewedAnchorDigest:hash(renewalPayload),
  previousIndependentReaderDigest:req.ql438IndependentReaderDigest,
  status:'INDEPENDENT_SIGNED_RENEWED_ANCHOR_READBACK',readAt:iso(now)}:null;
 const reader=readerPayload?signed(readerPayload,keys.reader):null;
 const hostPayload=req?{
  schema:'rosevear.ql439.original-host-post-remediation-off.v1',
  requestDigest:prepared.requestDigest,originalIncidentId:incidentId,
  hostMachineId:'DESKTOP-AE894KC',scope,
  proposedCeremonyId,proposedEpisodeId,renewalNonce,
  renewedAnchorDigest:hash(renewalPayload),
  renewedReadbackDigest:hash(readerPayload),receiverState:'OFF',
  failClosedShutdownArmed:true,offContinuitySequence:18,observedAt:iso(now)}:null;
 const host=hostPayload?signed(hostPayload,keys.host):null;
 const offPayload=req?{
  schema:'rosevear.ql439.independent-post-remediation-off.v1',
  requestDigest:prepared.requestDigest,originalIncidentId:incidentId,
  proposedCeremonyId,proposedEpisodeId,renewalNonce,
  hostOffDigest:hash(hostPayload),renewedAnchorReadbackDigest:hash(readerPayload),
  receiverState:'OFF',offContinuitySequence:18,observedAt:iso(now)}:null;
 const independentOff=offPayload?signed(offPayload,keys.receiver):null;
 const reports=req?MASTERS.map(masterId=>{
  const p={schema:'rosevear.ql439.master-corrective-continuity-readiness.v1',
   masterId,requestDigest:prepared.requestDigest,
   originalIncidentId:incidentId,proposedCeremonyId,proposedEpisodeId,
   renewalNonce,renewedAnchorReadbackDigest:hash(readerPayload),
   independentOffDigest:hash(offPayload),
   status:'SIGNED_NEW_CEREMONY_PREPARED_ONLY_RECEIVER_OFF_NO_ACTIVATION',
   reviewedAt:iso(now)};
  return signed(p,keys.masters[masterId]);}):[];
 const masterDigest=reports.length?hash(reports.map(x=>x.payload)):null;
 const ownerPayload=req?{
  schema:'rosevear.ql439.dual-owner-new-ceremony-readiness.v1',
  requestDigest:prepared.requestDigest,originalIncidentId:incidentId,
  proposedCeremonyId,proposedEpisodeId,renewalNonce,
  renewedAnchorDigest:hash(renewalPayload),
  renewedReadbackDigest:hash(readerPayload),
  independentOffDigest:hash(offPayload),masterReportsDigest:masterDigest,
  priorClosureState:'QL438_DURABLE_CORRECTIVE_EXCEPTION_CLOSED',
  action:'OWNER_REVIEW_PREPARE_FRESH_QL429_QL430_AUTHORITY_ONLY_NO_ACTIVATION',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',approvedAt:iso(now)}:null;
 const ownerDecision=ownerPayload?{payload:ownerPayload,
  ownerSignature:signed(ownerPayload,keys.owner).signature,
  reviewerSignature:signed(ownerPayload,keys.reviewer).signature}:null;
 const counts={renew:0,host:0,receiver:0,masters:0,enable:0};
 const inputs={...base,readinessLedger,
  externalRenewalProvider:{readSignedRenewal:async()=>{counts.renew++;return {anchor:renewal,reader};}},
  originalHostAdapter:{readSignedOff:async()=>{counts.host++;return host;}},
  independentReceiverAdapter:{readSignedOff:async()=>{counts.receiver++;return independentOff;}},
  masterEvidenceProvider:{readSignedReports:async()=>{counts.masters++;return reports;}},
  ownerDecision};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl438ClosureVerified:true,
  independentRenewalPinVerified:true,independentRenewalReaderPinVerified:true,
  independentOriginalHostPinVerified:true,independentReceiverPinVerified:true,
  independentMasterPinsVerified:true,
  independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true,
  renewalPin:keys.renewal.pin,renewalReaderPin:keys.reader.pin,
  originalHostPin:keys.host.pin,receiverPin:keys.receiver.pin,
  ownerPin:keys.owner.pin,reviewerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,keys,base,prepared,inputs,opts,counts,renewal,reader,host,independentOff,
  reports,ownerDecision,ql438Closure,ql437Exception,ql436Review,ql435Decision,
  ql434Readiness,ql433Precheck,ql432Decision,readinessLedger,
  run:()=>runQl439RenewedAnchorOffReadiness(inputs,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('QL439 signed renewed closure, independent OFF, 3-Master and dual owner gives readiness only',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL439_NEW_CEREMONY_REENTRY_READINESS_ONLY');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(r.receiver,'OFF_VERIFIED_POST_REMEDIATION_INDEPENDENT_READBACK');
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_NEW_CEREMONY_PREPARATION_ONLY');
  assert.equal(r.masterCount,3);
  assert.equal(r.proposedCeremonyId,proposedCeremonyId);
  assert.equal(r.proposedEpisodeId,proposedEpisodeId);
  assert.match(r.permittedNextAction,/NOT_ACTIVATED/);
  assert.deepEqual(f.counts,{renew:1,host:1,receiver:1,masters:1,enable:0});
  assert.equal(f.readinessLedger.read('pending',incidentId)?.recordDigest,r.pendingReceiptDigest);
  assert.equal(f.readinessLedger.read('readiness',incidentId)?.recordDigest,r.readinessReceiptDigest);
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.renew,1);
 }finally{f.cleanup();}
});
test('QL439 late independent OFF remedy also permits signed readiness only, no activation',async()=>{
 const f=fixture({lateOff:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL439_NEW_CEREMONY_REENTRY_READINESS_ONLY');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(f.prepared.request.leaseDisposition,'LATE_INDEPENDENT_OFF_READBACK_ESCALATION');
 }finally{f.cleanup();}
});
test('QL439 only a valid QL438 closed exception qualifies, never HOLD or OPEN',async()=>{
 const f=fixture({incorrectClosure:true});try{
  assert.equal(f.prepared.state,'HOLD');
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.renew,0);
  assert.equal(f.readinessLedger.read('pending',incidentId),null);
 }finally{f.cleanup();}
});
test('QL439 unsigned proposal is not external evidence or permission to enable',()=>{
 const f=fixture();try{
  assert.equal(f.prepared.state,'QL439_NEW_CEREMONY_READINESS_PREPARED_NOT_AUTHORIZED');
  assert.equal(f.prepared.connection,'HOLD');
  assert.equal(f.prepared.activationAuthorized,false);
  assert.equal(f.prepared.request.ql438ClosedReceiptDigest,f.ql438Closure.closedReceiptDigest);
  assert.equal(f.prepared.request.originalHostId,'DESKTOP-AE894KC');
 }finally{f.cleanup();}
});
test('QL439 owner-host independent QL438 verification required before any external call',async()=>{
 for(const field of ['protectedOriginalHostSession','independentQl438ClosureVerified']){
  const f=fixture();try{
   f.opts[field]=false;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.renew,0);
   assert.equal(f.readinessLedger.read('pending',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL439 new ceremony and episode must not reuse prior ceremony identities',()=>{
 const f=fixture();try{
  for(const [field,value] of [['proposedCeremonyId',nextCeremonyId],
   ['proposedEpisodeId',nextEpisodeId],
   ['proposedCeremonyId',scope.ceremonyId],['proposedEpisodeId',scope.episodeId]]){
   const r=prepareQl439NewCeremonyReadiness({...f.base,[field]:value},{
    nowMs:f.opts.nowMs,protectedOriginalHostSession:true,
    independentQl438ClosureVerified:true});
   assert.equal(r.state,'HOLD',field);
  }
 }finally{f.cleanup();}
});
test('QL439 renewed external anchor and distinct signed reader reject forged, replayed, stale or wrong prior anchor',async()=>{
 for(const mode of ['forgedAnchor','forgedReader','nonce','stale','priorAnchor','readerDigest']){
  const f=fixture();try{
   if(mode==='forgedAnchor')f.renewal.signature=
    signed(f.renewal.payload,f.keys.forger).signature;
   if(mode==='forgedReader')f.reader.signature=
    signed(f.reader.payload,f.keys.forger).signature;
   if(mode==='nonce')f.reader.payload.renewalNonce='replayed_nonce_ql439';
   if(mode==='stale')f.reader.payload.readAt=iso(f.opts.nowMs-61000);
   if(mode==='priorAnchor')f.renewal.payload.previousRemediationAnchorDigest='0'.repeat(64);
   if(mode==='readerDigest')f.reader.payload.renewedAnchorDigest='1'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.host,0);
   assert.ok(f.readinessLedger.read('pending',incidentId));
   assert.equal(f.readinessLedger.read('readiness',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL439 forged or TEMPLAR original host, ON state or disabled fail-closed watchdog reject before receiver readback',async()=>{
 for(const mode of ['forged','TEMPLAR','ON','notArmed','stale','wrongCeremony']){
  const f=fixture();try{
   if(mode==='forged')f.host.signature=signed(f.host.payload,f.keys.forger).signature;
   if(mode==='TEMPLAR')f.host.payload.hostMachineId='TEMPLAR';
   if(mode==='ON')f.host.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='notArmed')f.host.payload.failClosedShutdownArmed=false;
   if(mode==='stale')f.host.payload.observedAt=iso(f.opts.nowMs-61000);
   if(mode==='wrongCeremony')f.host.payload.proposedCeremonyId='wrong_ceremony_ql439_123456';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.receiver,0);
  }finally{f.cleanup();}
 }
});
test('QL439 independent receiver must sign fresh OFF bound to host and monotonic sequence',async()=>{
 for(const mode of ['missing','forged','ON','sequence','hostDigest','oldReadback','nonce']){
  const f=fixture();try{
   if(mode==='missing')f.inputs.independentReceiverAdapter.readSignedOff=
    async()=>{throw Error('receiver observer unavailable')};
   if(mode==='forged')f.independentOff.signature=
    signed(f.independentOff.payload,f.keys.forger).signature;
   if(mode==='ON')f.independentOff.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='sequence')f.independentOff.payload.offContinuitySequence=17;
   if(mode==='hostDigest')f.independentOff.payload.hostOffDigest='2'.repeat(64);
   if(mode==='oldReadback')f.independentOff.payload.renewedAnchorReadbackDigest='3'.repeat(64);
   if(mode==='nonce')f.independentOff.payload.renewalNonce='wrong_nonce_ql439_12345';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.masters,0);
   assert.equal(f.readinessLedger.read('readiness',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL439 three Master signed readiness reviews require all independent and matching OFF, no ON transition',async()=>{
 for(const mode of ['missing','duplicate','forged','wrongOff','connected']){
  const f=fixture();try{
   if(mode==='missing')f.reports.pop();
   if(mode==='duplicate')f.reports[2]=f.reports[1];
   if(mode==='forged')f.reports[0].signature=
    signed(f.reports[0].payload,f.keys.forger).signature;
   if(mode==='wrongOff')f.reports[0].payload.independentOffDigest='4'.repeat(64);
   if(mode==='connected')f.reports[0].payload.status='SIX_MASTER_CONNECTED';
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.readinessLedger.read('readiness',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL439 dual owners cannot forge, substitute the decision or approve activation',async()=>{
 for(const mode of ['owner','reviewer','activate','wrongNewCeremony','wrongMasters','custody']){
  const f=fixture();try{
   if(mode==='owner')f.ownerDecision.ownerSignature=
    signed(f.ownerDecision.payload,f.keys.forger).signature;
   if(mode==='reviewer')f.ownerDecision.reviewerSignature=
    signed(f.ownerDecision.payload,f.keys.forger).signature;
   if(mode==='activate')f.ownerDecision.payload.action='ACTIVATE_RECEIVER_CONNECTED_NOW';
   if(mode==='wrongNewCeremony')f.ownerDecision.payload.proposedCeremonyId='other_new_ceremony_ql439';
   if(mode==='wrongMasters')f.ownerDecision.payload.masterReportsDigest='5'.repeat(64);
   if(mode==='custody')f.opts.independentReviewerCustodyVerified=false;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.readinessLedger.read('readiness',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL439 QL431 through QL438 modified prior receipts or false closure refuse before external readback',async()=>{
 for(const mode of ['ql431','ql432','ql433','ql434','ql435','ql436','ql437','ql438','ql438Open']){
  const f=fixture();try{
   if(mode==='ql431')f.ql432Decision.checkpointDigest='6'.repeat(64);
   if(mode==='ql432')f.ql432Decision.ownerReviewReceiptDigest='7'.repeat(64);
   if(mode==='ql433')f.ql433Precheck.precheckRecordDigest='8'.repeat(64);
   if(mode==='ql434')f.ql434Readiness.readinessRecordDigest='9'.repeat(64);
   if(mode==='ql435')f.ql435Decision.acceptedReceiptDigest='0'.repeat(64);
   if(mode==='ql436')f.ql436Review.reconciledReceiptDigest='1'.repeat(64);
   if(mode==='ql437')f.ql437Exception.finalReceiptDigest='2'.repeat(64);
   if(mode==='ql438')f.ql438Closure.closedReceiptDigest='3'.repeat(64);
   if(mode==='ql438Open')f.ql438Closure.leaseExceptionOpen=true;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.renew,0);
   assert.equal(f.readinessLedger.read('pending',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL439 interrupted renewal consumes PENDING; second attempt cannot replay the same incident',async()=>{
 const f=fixture();try{
  f.inputs.externalRenewalProvider.readSignedRenewal=async()=>{throw Error('anchor unavailable')};
  const r=await f.run();
  assert.equal(r.state,'HOLD');
  assert.ok(f.readinessLedger.read('pending',incidentId));
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(readQl439ReadinessContinuity(f.readinessLedger,incidentId).state,'HOLD');
  writeFileSync(join(f.root,'ql439','ql439-pending-'+incidentId+'.json'),
   '{"schema":"rosevear.ql439.corrective-closure-readiness-custody.v1"}');
  assert.throws(()=>f.readinessLedger.read('pending',incidentId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
 }finally{f.cleanup();}
});
test('QL439 private readiness receipt alone never proves live OFF or grants reentry',async()=>{
 const f=fixture();try{
  assert.equal((await f.run()).state,'DURABLE_QL439_NEW_CEREMONY_REENTRY_READINESS_ONLY');
  const r=readQl439ReadinessContinuity(f.readinessLedger,incidentId);
  assert.equal(r.state,'QL439_DURABLE_PRIVATE_READINESS_FRESH_OFF_RECHECK_REQUIRED');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(f.counts.enable,0);
 }finally{f.cleanup();}
});
