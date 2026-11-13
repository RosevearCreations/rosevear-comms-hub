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
import {openQl438ProtectedExceptionLedger,prepareQl438ExpiredLeaseCorrectiveIntake,
 readQl438ExceptionClosureContinuity,runQl438ExpiredLeaseExceptionClosure}
 from './ql438-expired-lease-remediation.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return {
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 k.privateKey).toString('base64')});
const iso=n=>new Date(n).toISOString();
const scope={ceremonyId:'old_ceremony_ql438_123456',sourceId:'rosevear-ai-hub',
 episodeId:'old_episode_ql438_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql438_12345678',reviewId='review_ql438_123456789',
 nextCeremonyId='next_ceremony_ql438_123456',
 nextEpisodeId='next_episode_ql438_123456',
 remediationId='remediation_ql438_123456',challengeNonce='nonce_ql438_123456789';
function fixture({lateOff=false,alreadyClosed=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql438-'));
 const now=Date.now()-5000,leaseExpiresAt=iso(now-10000);
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const ql432Ledger=openQl432ProtectedRecoveryReviewLedger(join(root,'ql432'));
 const ql433Ledger=openQl433ProtectedPrecheckLedger(join(root,'ql433'));
 const ql434Ledger=openQl434ProtectedReadinessLedger(join(root,'ql434'));
 const ql435Ledger=openQl435ProtectedPilotLedger(join(root,'ql435'));
 const ql436Ledger=openQl436ProtectedShutdownLedger(join(root,'ql436'));
 const ql437Ledger=openQl437ProtectedClosureLedger(join(root,'ql437'));
 const remediationLedger=openQl438ProtectedExceptionLedger(join(root,'ql438'));
 const seq=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const base={kind:'PENDING',scope,observationId:'observation_ql438_123456',
  observedAt:iso(now-3500),ql430AcceptedDigest:'a'.repeat(64),
  evidenceDigest:hash('pending_ql438'),sequences:seq,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const first=ql431Store.append(scope,base,null);
 const off={...base,kind:'OFF',observedAt:iso(now-2500),
  shutdownAckDigest:'b'.repeat(64),receiverOffDigest:'c'.repeat(64)};
 const second=ql431Store.append(scope,off,first.recordDigest);
 const reconciled={...off,kind:'RECONCILED',observedAt:iso(now-1500),
  reportsDigest:'d'.repeat(64),ownerDecisionDigest:'e'.repeat(64)};
 const checkpoint=ql431Store.append(scope,reconciled,second.recordDigest);
 const r432=ql432Ledger.claimOnce(incidentId,'1'.repeat(64));
 const ql432Decision={state:'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW',
  connection:'HOLD',receiver:'OFF_VERIFIED_SIGNED_READBACK',
  masterCount:3,scope,incidentId,
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
 const r435p=ql435Ledger.claimOnce('pending',nextCeremonyId,'4'.repeat(64));
 const r435a=ql435Ledger.claimOnce('accepted',nextCeremonyId,'5'.repeat(64));
 const ql435Decision={state:'DURABLE_QL435_ISOLATED_PILOT_ON_EVIDENCE_DECISION',
  connection:'HOLD',activationAuthorized:false,
  originalIncidentId:incidentId,nextCeremonyId,nextEpisodeId,leaseExpiresAt,
  pendingReceiptDigest:r435p.recordDigest,
  acceptedReceiptDigest:r435a.recordDigest};
 const r436p=ql436Ledger.claimOnce('pending',nextCeremonyId,'6'.repeat(64));
 const r436r=ql436Ledger.claimOnce('reconciled',nextCeremonyId,'7'.repeat(64));
 const leaseDisposition=alreadyClosed?'WITHIN_LEASE_INDEPENDENT_OFF_CONFIRMED':
  lateOff?'LATE_INDEPENDENT_OFF_READBACK_ESCALATION':
  'LATE_HOST_SHUTDOWN_ESCALATION';
 const ql436Review={state:'DURABLE_QL436_POST_PILOT_SIGNED_OFF_RECONCILED',
  connection:'HOLD',activationAuthorized:false,
  receiver:'OFF_VERIFIED_HOST_AND_INDEPENDENT_READBACK',
  ownerAcceptance:'DUAL_SIGNED_OFF_AND_EXPIRY_REVIEW_ONLY',
  originalIncidentId:incidentId,incidentReviewId:reviewId,nextCeremonyId,
  leaseExpiresAt,leaseDisposition,
  leaseExceptionEscalationRequired:!alreadyClosed,
  pendingReceiptDigest:r436p.recordDigest,
  reconciledReceiptDigest:r436r.recordDigest};
 const r437p=ql437Ledger.claimOnce('pending',incidentId,'8'.repeat(64));
 const r437f=ql437Ledger.claimOnce('final',incidentId,'9'.repeat(64));
 const ql437Exception={state:alreadyClosed?
  'DURABLE_QL437_OWNER_SUPERVISED_INCIDENT_CLOSURE_READBACK':
  'DURABLE_QL437_EXPIRED_LEASE_EXCEPTION_OPEN_INDEPENDENT_CUSTODY',
  connection:'HOLD',activationAuthorized:false,
  receiver:'OFF_VERIFIED_BY_HOST_AND_INDEPENDENT_POST_SHUTDOWN_WITNESS',
  ownerAcceptance:alreadyClosed?'DUAL_SIGNED_INCIDENT_CLOSURE_NO_REENTRY':
   'DUAL_SIGNED_LEASE_EXCEPTION_OPEN',
  incidentClosed:alreadyClosed,leaseExceptionOpen:!alreadyClosed,masterCount:3,
  permittedNextAction:alreadyClosed?
   'NEW_SEPARATELY_AUTHORIZED_CEREMONY_REQUIRED_NO_AUTOMATIC_REENTRY':
   'OWNER_SUPERVISED_LEASE_EXCEPTION_REMEDIATION_NO_REENTRY',
  originalIncidentId:incidentId,nextCeremonyId,leaseDisposition,
  externalAnchorDigest:'a'.repeat(64),
  independentReadbackDigest:'b'.repeat(64),
  pendingReceiptDigest:r437p.recordDigest,finalReceiptDigest:r437f.recordDigest};
 const k={host:key(),receiver:key(),remediator:key(),anchor:key(),reader:key(),
  owner:key(),reviewer:key(),forger:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const baseInput={ql437Exception,ql437Ledger,ql436Review,ql436Ledger,
  ql435Decision,ql435Ledger,ql434Readiness,ql434Ledger,
  ql433Precheck,ql433Ledger,ql432Decision,ql432Ledger,ql431Store,
  remediationId,challengeNonce};
 const prep=prepareQl438ExpiredLeaseCorrectiveIntake(baseInput,{
  nowMs:now,protectedOriginalHostSession:true,
  independentQl437ExceptionVerified:true});
 if(!alreadyClosed)assert.equal(prep.state,'QL438_CORRECTIVE_INTAKE_PREPARED_NOT_ACCEPTED');
 const r=prep.request;
 const hostPayload=alreadyClosed?null:{
  schema:'rosevear.ql438.original-host-corrective-action.v1',
  requestDigest:prep.requestDigest,hostMachineId:'DESKTOP-AE894KC',
  scope,originalIncidentId:incidentId,remediationId,challengeNonce,
  leaseDisposition,rootCauseCode:r.rootCauseCode,
  correctiveActionCode:r.correctiveActionCode,
  actionEvidenceDigest:'c'.repeat(64),receiverState:'OFF',
  failClosedShutdownArmed:true,repairSequence:17,observedAt:iso(now)};
 const host=hostPayload?signed(hostPayload,k.host):null;
 const offPayload=hostPayload?{
  schema:'rosevear.ql438.independent-receiver-remediation-off.v1',
  originalIncidentId:incidentId,remediationId,challengeNonce,
  hostCorrectiveDigest:hash(hostPayload),
  ql437IndependentReadbackDigest:r.ql437IndependentReadbackDigest,
  receiverState:'OFF',offContinuitySequence:17,observedAt:iso(now)}:null;
 const receiver=offPayload?signed(offPayload,k.receiver):null;
 const remediatorPayload=offPayload?{
  schema:'rosevear.ql438.independent-corrective-witness.v1',
  originalIncidentId:incidentId,remediationId,challengeNonce,
  requestDigest:prep.requestDigest,hostCorrectiveDigest:hash(hostPayload),
  independentOffDigest:hash(offPayload),leaseDisposition,
  rootCauseCode:r.rootCauseCode,correctiveActionCode:r.correctiveActionCode,
  status:'INDEPENDENT_REMEDIATION_REVIEW_OFF_CONFIRMED_NO_REENTRY',
  witnessedAt:iso(now)}:null;
 const remediator=remediatorPayload?signed(remediatorPayload,k.remediator):null;
 const reports=remediatorPayload?MASTERS.map(masterId=>{
  const p={schema:'rosevear.ql438.master-remediation-closure-review.v1',
   masterId,originalIncidentId:incidentId,remediationId,
   requestDigest:prep.requestDigest,
   independentRemediatorDigest:hash(remediatorPayload),
   leaseDisposition,status:'SIGNED_CORRECTIVE_REVIEW_NO_RUNTIME_REENTRY',
   observedAt:iso(now)};
  return signed(p,k.masters[masterId]);}):[];
 const masterDigest=reports.length?hash(reports.map(v=>v.payload)):null;
 const anchorPayload=remediatorPayload?{
  schema:'rosevear.ql438.external-corrective-closure-anchor.v1',
  originalIncidentId:incidentId,remediationId,challengeNonce,
  requestDigest:prep.requestDigest,
  independentRemediatorDigest:hash(remediatorPayload),
  masterDigest,priorQl437ExternalAnchorDigest:r.ql437ExternalAnchorDigest,
  status:'EXTERNAL_SIGNED_REMEDIATION_CUSTODY_ANCHORED_NO_REENTRY',
  anchoredAt:iso(now)}:null;
 const anchor=anchorPayload?signed(anchorPayload,k.anchor):null;
 const readerPayload=anchorPayload?{
  schema:'rosevear.ql438.independent-closure-anchor-readback.v1',
  originalIncidentId:incidentId,remediationId,challengeNonce,
  requestDigest:prep.requestDigest,externalAnchorDigest:hash(anchorPayload),
  status:'INDEPENDENT_SIGNED_REMEDIATION_ANCHOR_READBACK',
  readAt:iso(now)}:null;
 const reader=readerPayload?signed(readerPayload,k.reader):null;
 const ownerPayload=readerPayload?{
  schema:'rosevear.ql438.dual-owner-expired-lease-closure.v1',
  originalIncidentId:incidentId,remediationId,challengeNonce,
  requestDigest:prep.requestDigest,
  independentRemediatorDigest:hash(remediatorPayload),
  mastersDigest:masterDigest,externalAnchorDigest:hash(anchorPayload),
  externalReadbackDigest:hash(readerPayload),
  priorExceptionStatus:'QL437_EXPIRED_LEASE_OPEN',leaseDisposition,
  action:'CLOSE_EXPIRED_LEASE_EXCEPTION_CORRECTIVE_EVIDENCE_ONLY_KEEP_HOLD',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',reviewedAt:iso(now)}:null;
 const ownerDecision=ownerPayload?{payload:ownerPayload,
  ownerSignature:signed(ownerPayload,k.owner).signature,
  reviewerSignature:signed(ownerPayload,k.reviewer).signature}:null;
 const counts={host:0,receiver:0,remediator:0,masters:0,anchor:0,enable:0};
 const input={...baseInput,remediationLedger,
  originalHostAdapter:{readSignedCorrectiveAction:async()=>{counts.host++;return host;}},
  independentReceiverAdapter:{readSignedOff:async()=>{counts.receiver++;return receiver;}},
  independentRemediatorAdapter:{readSignedWitness:async()=>{
   counts.remediator++;return remediator;}},
  masterProvider:{readSignedReports:async()=>{counts.masters++;return reports;}},
  externalClosureAnchorProvider:{readSignedClosureAnchor:async()=>{
   counts.anchor++;return {anchor,reader};}},ownerDecision};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl437ExceptionVerified:true,
  independentOriginalHostPinVerified:true,independentReceiverPinVerified:true,
  independentRemediatorPinVerified:true,independentMasterPinsVerified:true,
  independentAnchorPinVerified:true,independentReaderPinVerified:true,
  independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true,
  originalHostPin:k.host.pin,receiverPin:k.receiver.pin,
  remediatorPin:k.remediator.pin,anchorPin:k.anchor.pin,readerPin:k.reader.pin,
  ownerPin:k.owner.pin,reviewerPin:k.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,k.masters[m].pin]))};
 return {root,k,scope,prep,baseInput,input,opts,counts,host,receiver,remediator,
  reports,anchor,reader,ownerDecision,ql437Exception,ql436Review,
  ql435Decision,ql434Readiness,ql433Precheck,ql432Decision,
  remediationLedger,run:()=>runQl438ExpiredLeaseExceptionClosure(input,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('QL438 distinct signed remediation, three Masters, independent external anchor and dual owners close exception only, retain HOLD',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL438_OWNER_GATED_LEASE_EXCEPTION_CLOSURE_READBACK');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(r.leaseExceptionOpen,false);
  assert.equal(r.incidentClosed,true);
  assert.equal(r.receiver,'OFF_VERIFIED_SIGNED_REMEDIATION_WITNESS');
  assert.equal(r.masterCount,3);
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_CORRECTIVE_EVIDENCE_EXCEPTION_CLOSURE_ONLY');
  assert.match(r.permittedNextAction,/NO_AUTOMATIC_REENTRY/);
  assert.equal(f.remediationLedger.read('pending',incidentId)?.recordDigest,r.pendingReceiptDigest);
  assert.equal(f.remediationLedger.read('closed',incidentId)?.recordDigest,r.closedReceiptDigest);
  assert.deepEqual(f.counts,{host:1,receiver:1,remediator:1,masters:1,anchor:1,enable:0});
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.host,1);
 }finally{f.cleanup();}
});
test('QL438 late independent OFF witness remediation has different required corrective action',async()=>{
 const f=fixture({lateOff:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL438_OWNER_GATED_LEASE_EXCEPTION_CLOSURE_READBACK');
  assert.equal(f.prep.request.rootCauseCode,'INDEPENDENT_RECEIVER_OFF_RECEIPT_LATE');
  assert.equal(f.prep.request.correctiveActionCode,'INDEPENDENT_OFF_WITNESS_DELIVERY_REMEDIATED');
  assert.equal(r.leaseDisposition,'LATE_INDEPENDENT_OFF_READBACK_ESCALATION');
  assert.equal(r.connection,'HOLD');
 }finally{f.cleanup();}
});
test('QL438 an already closed on-time QL437 incident is never eligible for expired-lease exception closure',async()=>{
 const f=fixture({alreadyClosed:true});try{
  assert.equal(f.prep.state,'HOLD');
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.host,0);
  assert.equal(f.remediationLedger.read('pending',incidentId),null);
 }finally{f.cleanup();}
});
test('QL438 intake export is not an approval, OFF proof, or runtime activation',()=>{
 const f=fixture();try{
  assert.equal(f.prep.state,'QL438_CORRECTIVE_INTAKE_PREPARED_NOT_ACCEPTED');
  assert.equal(f.prep.connection,'HOLD');
  assert.equal(f.prep.activationAuthorized,false);
  assert.equal(f.prep.request.ql437FinalReceiptDigest,
   f.ql437Exception.finalReceiptDigest);
  assert.equal(f.prep.request.originalHostId,'DESKTOP-AE894KC');
 }finally{f.cleanup();}
});
test('QL438 unverified QL437 exception or unprotected original-host session rejects before PENDING',async()=>{
 for(const field of ['protectedOriginalHostSession','independentQl437ExceptionVerified']){
  const f=fixture();try{
   f.opts[field]=false;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.host,0);
   assert.equal(f.remediationLedger.read('pending',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL438 rejects TEMPLAR, forged host evidence, ON receiver, unarmed shutdown and wrong remediation mode',async()=>{
 for(const mode of ['TEMPLAR','forged','ON','notArmed','wrongMode','nonce','stale']){
  const f=fixture();try{
   if(mode==='TEMPLAR')f.host.payload.hostMachineId='TEMPLAR';
   if(mode==='forged')f.host.signature=signed(f.host.payload,f.k.forger).signature;
   if(mode==='ON')f.host.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='notArmed')f.host.payload.failClosedShutdownArmed=false;
   if(mode==='wrongMode')f.host.payload.correctiveActionCode='JUST_IGNORE_LEASE';
   if(mode==='nonce')f.host.payload.challengeNonce='replay_nonce_ql438_12345';
   if(mode==='stale')f.host.payload.observedAt=iso(f.opts.nowMs-61000);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.receiver,0);
   assert.ok(f.remediationLedger.read('pending',incidentId));
  }finally{f.cleanup();}
 }
});
test('QL438 independent receiver OFF is separate signed and monotonic; no host-only clearance',async()=>{
 for(const mode of ['missing','forged','ON','sequence','wrongHost','oldReadback']){
  const f=fixture();try{
   if(mode==='missing')f.input.independentReceiverAdapter.readSignedOff=
    async()=>{throw Error('receiver unavailable')};
   if(mode==='forged')f.receiver.signature=signed(f.receiver.payload,f.k.forger).signature;
   if(mode==='ON')f.receiver.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(mode==='sequence')f.receiver.payload.offContinuitySequence=16;
   if(mode==='wrongHost')f.receiver.payload.hostCorrectiveDigest='1'.repeat(64);
   if(mode==='oldReadback')f.receiver.payload.ql437IndependentReadbackDigest='2'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.remediator,0);
   assert.equal(f.remediationLedger.read('closed',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL438 independent remediation witness must sign correct mode, OFF and nonce',async()=>{
 for(const mode of ['missing','forged','wrongFix','nonce','changedOff']){
  const f=fixture();try{
   if(mode==='missing')f.input.independentRemediatorAdapter.readSignedWitness=
    async()=>{throw Error('no independent review')};
   if(mode==='forged')f.remediator.signature=
    signed(f.remediator.payload,f.k.forger).signature;
   if(mode==='wrongFix')f.remediator.payload.correctiveActionCode='UNVERIFIED';
   if(mode==='nonce')f.remediator.payload.challengeNonce='old_nonce_ql438_1234';
   if(mode==='changedOff')f.remediator.payload.independentOffDigest='2'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.masters,0);
   assert.equal(f.remediationLedger.read('closed',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL438 three-Master signed corrective review requires every distinct, authentic and matching Master',async()=>{
 for(const mode of ['missing','duplicate','forged','wrongWitness']){
  const f=fixture();try{
   if(mode==='missing')f.reports.pop();
   if(mode==='duplicate')f.reports[2]=f.reports[1];
   if(mode==='forged')f.reports[0].signature=
    signed(f.reports[0].payload,f.k.forger).signature;
   if(mode==='wrongWitness')f.reports[0].payload.independentRemediatorDigest='3'.repeat(64);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.anchor,0);
   assert.equal(f.remediationLedger.read('closed',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL438 external corrective anchor must have independent signed immutable readback',async()=>{
 for(const mode of ['missing','forgedAnchor','forgedReader','badNonce','priorAnchor','wrongMasters','stale']){
  const f=fixture();try{
   if(mode==='missing')f.input.externalClosureAnchorProvider.readSignedClosureAnchor=
    async()=>{throw Error('external anchor down')};
   if(mode==='forgedAnchor')f.anchor.signature=signed(f.anchor.payload,f.k.forger).signature;
   if(mode==='forgedReader')f.reader.signature=signed(f.reader.payload,f.k.forger).signature;
   if(mode==='badNonce')f.reader.payload.challengeNonce='old_nonce_ql438_1234';
   if(mode==='priorAnchor')f.anchor.payload.priorQl437ExternalAnchorDigest='4'.repeat(64);
   if(mode==='wrongMasters')f.anchor.payload.masterDigest='5'.repeat(64);
   if(mode==='stale')f.reader.payload.readAt=iso(f.opts.nowMs-61000);
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.remediationLedger.read('closed',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL438 owner and reviewer cannot forge, omit custody or approve receiver reentry',async()=>{
 for(const mode of ['owner','reviewer','connected','wrongIncident','custody']){
  const f=fixture();try{
   if(mode==='owner')f.ownerDecision.ownerSignature=
    signed(f.ownerDecision.payload,f.k.forger).signature;
   if(mode==='reviewer')f.ownerDecision.reviewerSignature=
    signed(f.ownerDecision.payload,f.k.forger).signature;
   if(mode==='connected')f.ownerDecision.payload.action='ENABLE_RECEIVER_GENERAL_CONNECTED';
   if(mode==='wrongIncident')f.ownerDecision.payload.originalIncidentId='other_incident_ql438_1234';
   if(mode==='custody')f.opts.independentReviewerCustodyVerified=false;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.remediationLedger.read('closed',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL438 prior QL431 through QL437 private record mutation blocks remote corrective read',async()=>{
 for(const mode of ['ql431','ql432','ql433','ql434','ql435','ql436','ql437','closedQL437']){
  const f=fixture();try{
   if(mode==='ql431')f.ql432Decision.checkpointDigest='9'.repeat(64);
   if(mode==='ql432')f.ql432Decision.ownerReviewReceiptDigest='8'.repeat(64);
   if(mode==='ql433')f.ql433Precheck.precheckRecordDigest='7'.repeat(64);
   if(mode==='ql434')f.ql434Readiness.readinessRecordDigest='6'.repeat(64);
   if(mode==='ql435')f.ql435Decision.acceptedReceiptDigest='5'.repeat(64);
   if(mode==='ql436')f.ql436Review.reconciledReceiptDigest='4'.repeat(64);
   if(mode==='ql437')f.ql437Exception.finalReceiptDigest='3'.repeat(64);
   if(mode==='closedQL437')f.ql437Exception.incidentClosed=true;
   assert.equal((await f.run()).state,'HOLD',mode);
   assert.equal(f.counts.host,0);
   assert.equal(f.remediationLedger.read('pending',incidentId),null);
  }finally{f.cleanup();}
 }
});
test('QL438 interrupted corrective-action intake consumes PENDING once; tampering fails closed',async()=>{
 const f=fixture();try{
  f.input.originalHostAdapter.readSignedCorrectiveAction=async()=>{throw Error('host down')};
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.remediationLedger.read('pending',incidentId)?.kind,'pending');
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(readQl438ExceptionClosureContinuity(f.remediationLedger,incidentId).state,'HOLD');
  writeFileSync(join(f.root,'ql438','ql438-pending-'+incidentId+'.json'),
   '{"schema":"rosevear.ql438.expired-lease-exception-ledger.v1"}');
  assert.throws(()=>f.remediationLedger.read('pending',incidentId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
 }finally{f.cleanup();}
});
test('QL438 stored private CLOSED receipt cannot independently prove current receiver OFF or CONNECTED',async()=>{
 const f=fixture();try{
  assert.equal((await f.run()).state,'DURABLE_QL438_OWNER_GATED_LEASE_EXCEPTION_CLOSURE_READBACK');
  const read=readQl438ExceptionClosureContinuity(f.remediationLedger,incidentId);
  assert.equal(read.state,'QL438_PRIVATE_CLOSURE_RECEIPT_NOT_LIVE_OFF_PROOF');
  assert.equal(read.connection,'HOLD');
  assert.equal(read.activationAuthorized,false);
  assert.equal(f.counts.enable,0);
 }finally{f.cleanup();}
});
