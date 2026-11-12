import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl430ProtectedCeremonyAudit} from './ql430-supervised-pilot-reentry.mjs';
import {openQl431ProtectedContinuityStore} from './ql431-post-reentry-continuity.mjs';
import {prepareQl432IncidentAnchorExport,openQl432ProtectedRecoveryReviewLedger,
 runQl432OwnerGatedRecoveryReview} from './ql432-external-incident-recovery.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const key=()=>{const v=generateKeyPairSync('ed25519');return {
 privateKey:v.privateKey,pin:v.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 k.privateKey).toString('base64')});
const scope={ceremonyId:'ceremony_ql432_123456789',sourceId:'rosevear-ai-hub',
 episodeId:'episode_ql432_123456789',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql432_123456789';
const anchorId='external_anchor_ql432_123456789';
const challengeNonce='nonce_ql432_123456789';
const iso=ms=>new Date(ms).toISOString();
function setup(){
 const root=mkdtempSync(join(tmpdir(),'ql432-'));
 const now=Date.now()-5000;
 const audit=openQl430ProtectedCeremonyAudit(join(root,'ql430'));
 const acceptedAudit=audit.claimOnce('accepted',scope.ceremonyId,'a'.repeat(64));
 const accepted={...scope,state:'DURABLE_VERIFIED_THREE_MASTER_REENTRY_ISOLATED_PILOT',
  connection:'VERIFIED_CONNECTED_PILOT',receiver:'ISOLATED_ONE_TEST_ON',
  ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',masterCount:3,
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
  acceptedRecordDigest:acceptedAudit.recordDigest};
 const ql431Store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const sequences=Object.fromEntries(MASTERS.map(m=>[m,0]));
 const base={kind:'PENDING',scope,observationId:'observation_ql432_123456',
  observedAt:iso(now-3000),ql430AcceptedDigest:acceptedAudit.recordDigest,
  evidenceDigest:hash('pending'),sequences,incidentId,
  shutdownAckDigest:null,receiverOffDigest:null,reportsDigest:null,ownerDecisionDigest:null};
 const pending=ql431Store.append(scope,base,null);
 const off={...base,kind:'OFF',observedAt:iso(now-2000),
  shutdownAckDigest:'d'.repeat(64),receiverOffDigest:'e'.repeat(64)};
 const shutdown=ql431Store.append(scope,off,pending.recordDigest);
 const reconciled={...off,kind:'RECONCILED',observedAt:iso(now-1000),
  reportsDigest:'f'.repeat(64),ownerDecisionDigest:'a'.repeat(64)};
 const checkpoint=ql431Store.append(scope,reconciled,shutdown.recordDigest);
 const keys={anchor:key(),reader:key(),originalHost:key(),receiver:key(),
  owner:key(),reviewer:key(),forger:key(),masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const reviewLedger=openQl432ProtectedRecoveryReviewLedger(join(root,'review'));
 const prep=prepareQl432IncidentAnchorExport({ql431Store,scope,
  ql430AcceptedDigest:accepted.acceptedRecordDigest,anchorId,challengeNonce},{
  protectedOperatorSession:true,nowMs:now});
 assert.equal(prep.state,'EXTERNAL_INCIDENT_ANCHOR_EXPORT_PREPARED_NOT_WITNESSED');
 const exportRecord=prep.exportRecord;
 const anchorPayload={schema:'rosevear.ql432.external-incident-anchor.v1',
  anchorId,challengeNonce,exportDigest:prep.exportDigest,scope,incidentId,
  checkpointIndex:checkpoint.index,checkpointDigest:checkpoint.recordDigest,
  receiverOffDigest:reconciled.receiverOffDigest,
  status:'EXTERNALLY_ANCHORED_IMMUTABLE_CHECKPOINT',anchoredAt:iso(now)};
 const anchorEnvelope=signed(anchorPayload,keys.anchor);
 const readerPayload={schema:'rosevear.ql432.independent-anchor-readback.v1',
  anchorId,challengeNonce,exportDigest:prep.exportDigest,
  anchorDigest:hash(anchorPayload),checkpointDigest:checkpoint.recordDigest,
  status:'INDEPENDENT_EXTERNAL_CHECKPOINT_READBACK_MATCHED',readAt:iso(now)};
 const readerEnvelope=signed(readerPayload,keys.reader);
 const hostPayload={schema:'rosevear.ql432.original-host-recovery-readback.v1',
  hostMachineId:'DESKTOP-AE894KC',scope,incidentId,challengeNonce,
  externalAnchorDigest:hash(anchorPayload),readbackDigest:hash(readerPayload),
  receiverState:'OFF',observedAt:iso(now)};
 const hostEnvelope=signed(hostPayload,keys.originalHost);
 const offPayload={schema:'rosevear.ql432.independent-recovery-receiver.v1',
  scope,incidentId,challengeNonce,hostEvidenceDigest:hash(hostPayload),
  readbackDigest:hash(readerPayload),receiverState:'OFF',observedAt:iso(now)};
 const offEnvelope=signed(offPayload,keys.receiver);
 const reports=MASTERS.map(masterId=>{
  const p={schema:'rosevear.ql432.master-recovery-review.v1',
   masterId,scope,incidentId,checkpointDigest:checkpoint.recordDigest,
   readbackDigest:hash(readerPayload),receiverOffDigest:hash(offPayload),
   status:'RECONCILED_OFF_NEW_CEREMONY_REQUIRED',observedAt:iso(now)};
  return signed(p,keys.masters[masterId]);
 });
 const ownerPayload={schema:'rosevear.ql432.owner-isolated-continuity-review.v1',
  scope,incidentId,checkpointDigest:checkpoint.recordDigest,
  readbackDigest:hash(readerPayload),receiverOffDigest:hash(offPayload),
  reportsDigest:hash(reports.map(r=>r.payload)),
  action:'ACKNOWLEDGE_RECOVERY_ONLY_NEW_ISOLATED_CEREMONY_REQUIRED_KEEP_OFF',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',reviewedAt:iso(now)};
 const ownerAcceptance={payload:ownerPayload,
  ownerSignature:signed(ownerPayload,keys.owner).signature,
  reviewerSignature:signed(ownerPayload,keys.reviewer).signature};
 const counts={anchor:0,host:0,off:0,masters:0,enable:0};
 const input={ql430Acceptance:accepted,ql430Audit:audit,ql431Store,reviewLedger,
  anchorId,challengeNonce,
  externalAnchorAdapter:{readSignedAnchor:async()=>{counts.anchor++;return {
   anchor:anchorEnvelope,reader:readerEnvelope};}},
  originalHostAdapter:{readSignedState:async()=>{counts.host++;return hostEnvelope;}},
  independentReceiverAdapter:{readSignedState:async()=>{counts.off++;return offEnvelope;}},
  masterEvidenceProvider:{readSignedReports:async()=>{counts.masters++;return reports;}},
  ownerAcceptance};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl430AcceptanceVerified:true,
  anchorPin:keys.anchor.pin,readerPin:keys.reader.pin,
  originalHostPin:keys.originalHost.pin,receiverPin:keys.receiver.pin,
  ownerPin:keys.owner.pin,reviewerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin])),
  independentAnchorPinVerified:true,independentReaderPinVerified:true,
  independentOriginalHostPinVerified:true,independentReceiverPinVerified:true,
  independentMasterPinsVerified:true,independentOwnerCustodyVerified:true,
  independentReviewerCustodyVerified:true};
 return {root,scope,incidentId,anchorId,challengeNonce,accepted,checkpoint,ql431Store,
  reviewLedger,prep,keys,opts,input,counts,anchorEnvelope,readerEnvelope,
  hostEnvelope,offEnvelope,reports,ownerAcceptance,
  run:()=>runQl432OwnerGatedRecoveryReview(input,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('QL432 independent external signed anchor + original host OFF + 3 Masters + dual owner delivers HOLD-only review',async()=>{
 const f=setup();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(r.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
  assert.equal(r.masterCount,3);
  assert.equal(r.nextStep,'NEW_QL429_QL430_OWNER_SUPERVISED_CEREMONY_ONLY');
  assert.equal(f.reviewLedger.read(incidentId).recordDigest,r.ownerReviewReceiptDigest);
  assert.deepEqual(f.counts,{anchor:1,host:1,off:1,masters:1,enable:0});
  const replay=await f.run();
  assert.equal(replay.state,'HOLD');
  assert.equal(f.counts.anchor,1);
 }finally{f.cleanup();}
});
test('QL432 incident anchor export never claims anchored or connected',()=>{
 const f=setup();try{
  assert.equal(f.prep.state,'EXTERNAL_INCIDENT_ANCHOR_EXPORT_PREPARED_NOT_WITNESSED');
  assert.equal(f.prep.connection,'HOLD');
  assert.equal(f.prep.exportRecord.checkpointDigest,f.checkpoint.recordDigest);
 }finally{f.cleanup();}
});
test('missing protected original-host or independently verified custody never queries external anchor',async()=>{
 for(const field of ['protectedOriginalHostSession','independentQl430AcceptanceVerified']){
  const f=setup();try{
   f.opts[field]=false;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.anchor,0);
  }finally{f.cleanup();}
 }
});
test('external anchor missing, forged, wrong checkpoint, replayed nonce and substituted reader all fail closed',async()=>{
 for(const what of ['missing','forged','checkpoint','nonce','reader']){
  const f=setup();try{
   if(what==='missing')f.input.externalAnchorAdapter.readSignedAnchor=async()=>{throw Error('offline')};
   if(what==='forged')f.anchorEnvelope.signature=signed(f.anchorEnvelope.payload,f.keys.forger).signature;
   if(what==='checkpoint')f.anchorEnvelope.payload.checkpointDigest='f'.repeat(64);
   if(what==='nonce')f.readerEnvelope.payload.challengeNonce='different_nonce_ql432';
   if(what==='reader')f.readerEnvelope.signature=signed(f.readerEnvelope.payload,f.keys.forger).signature;
   const result=await f.run();
   assert.equal(result.state,'HOLD',what);
   assert.equal(f.counts.host,0,what);
   assert.equal(f.reviewLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('wrong original-host machine, forged original-host signature or host receiver ON do not proceed',async()=>{
 for(const what of ['machine','forged','on']){
  const f=setup();try{
   if(what==='machine')f.hostEnvelope.payload.hostMachineId='TEMPLAR';
   if(what==='on')f.hostEnvelope.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(what==='forged')f.hostEnvelope.signature=signed(f.hostEnvelope.payload,f.keys.forger).signature;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.off,0);
   assert.equal(f.reviewLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('independent signed receiver OFF is required, never trust host OFF alone',async()=>{
 for(const what of ['on','forged']){
  const f=setup();try{
   if(what==='on')f.offEnvelope.payload.receiverState='ISOLATED_ONE_TEST_ON';
   if(what==='forged')f.offEnvelope.signature=signed(f.offEnvelope.payload,f.keys.forger).signature;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.counts.masters,0);
  }finally{f.cleanup();}
 }
});
test('missing, duplicated or forged Master recovery signature blocks owner review',async()=>{
 for(const what of ['missing','duplicate','forged']){
  const f=setup();try{
   if(what==='missing')f.reports.pop();
   if(what==='duplicate')f.reports[2]=f.reports[1];
   if(what==='forged')f.reports[0].signature=signed(f.reports[0].payload,f.keys.forger).signature;
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.reviewLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('dual-owner decision requires independent owner, independent reviewer and precise HOLD action',async()=>{
 for(const what of ['forged','ownerMissing','reviewerNotVerified','action']){
  const f=setup();try{
   if(what==='forged')f.ownerAcceptance.ownerSignature=signed(f.ownerAcceptance.payload,f.keys.forger).signature;
   if(what==='ownerMissing')f.opts.independentOwnerCustodyVerified=false;
   if(what==='reviewerNotVerified')f.opts.independentReviewerCustodyVerified=false;
   if(what==='action')f.ownerAcceptance.payload.action='ACTIVATE_RECEIVER';
   assert.equal((await f.run()).state,'HOLD');
   assert.equal(f.reviewLedger.read(incidentId),null);
  }finally{f.cleanup();}
 }
});
test('stale or altered QL431 ledger checkpoint cannot be replaced with unanchored state',async()=>{
 const f=setup();try{
  const head=readdirSync(join(f.root,'ql431')).find(n=>n.endsWith('.head'));
  writeFileSync(join(f.root,'ql431',head),JSON.stringify({
   schema:'rosevear.ql431.head.v1',count:2,lastDigest:'a'.repeat(64)}));
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.anchor,0);
 }finally{f.cleanup();}
});
test('review ledger is one-use, tamper detected and never reactivates receiver',async()=>{
 const f=setup();try{
  await f.run();
  const path=join(f.root,'review','ql432-review-'+incidentId+'.json');
  writeFileSync(path,'{"schema":"rosevear.ql432.owner-review-receipt.v1"}');
  assert.throws(()=>f.reviewLedger.read(incidentId),/TAMPERED/);
  assert.equal((await f.run()).state,'HOLD');
  assert.equal(f.counts.enable,0);
 }finally{f.cleanup();}
});
