import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl426ProtectedCheckpointStore} from './ql426-durable-pilot-custody.mjs';
import {prepareQl427CheckpointWitnessExport,verifyQl427IndependentCheckpointWitness,
 checkQl427PostRollbackIsolation,openQl427ProtectedRecoveryClosureStore,
 acceptQl427ThreeMasterRecoveryClosure} from './ql427-independent-witness-recovery.mjs';

const masters=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const keyIds=[...masters,'witness','receiver','owner','reviewer'];
const keys=Object.fromEntries(keyIds.map(id=>[id,generateKeyPairSync('ed25519')]));
const pin=id=>keys[id].publicKey.export({format:'der',type:'spki'}).toString('base64');
const envelope=(id,payload)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),keys[id].privateKey).toString('base64')});
const ownerSigned=payload=>({payload,
 ownerSignature:sign(null,Buffer.from(JSON.stringify(payload)),keys.owner.privateKey).toString('base64'),
 reviewerSignature:sign(null,Buffer.from(JSON.stringify(payload)),keys.reviewer.privateKey).toString('base64')});
const now=Date.parse('2026-11-12T14:00:00.000Z');
const scope={ceremonyId:'ceremony_ql427_123456',sourceId:'rosevear-ai-hub',
 episodeId:'episode_ql427_123456',sourceRevision:'a'.repeat(40),controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql427_123456';
const digest='d'.repeat(64);
const entry=(kind,seq,incident=null,rollback=null)=>({
 kind,scope,observedAt:new Date(now-20000).toISOString(),evidenceDigest:digest,
 sequences:Object.fromEntries(masters.map(id=>[id,seq])),
 incidentId:incident,receiverReadbackDigest:incident?'e'.repeat(64):null,
 rollbackCheckpointDigest:rollback
});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql427-'));
 const store=openQl426ProtectedCheckpointStore(join(root,'ql426'));
 const closureStore=openQl427ProtectedRecoveryClosureStore(join(root,'ql427'));
 const health=store.append(scope,entry('HEALTH',1),null);
 const rollback=store.append(scope,entry('ROLLBACK',1,incidentId),health.recordDigest);
 const ack=store.append(scope,entry('OWNER_ACK',1,incidentId,rollback.recordDigest),rollback.recordDigest);
 return {root,store,closureStore,ack,close:()=>rmSync(root,{recursive:true,force:true})};
}
const prepOpts={protectedOperatorSession:true,ql426OwnerAckIndependentlyVerified:true,nowMs:now};
const witnessOpts={witnessPin:pin('witness'),independentWitnessPinVerified:true,
 protectedOperatorSession:true,nowMs:now+1000};
const isolateOpts={receiverPin:pin('receiver'),independentReceiverPinVerified:true,
 protectedOperatorSession:true,ql426OwnerAckIndependentlyVerified:true,nowMs:now+2000};
const closeOpts={masterPins:Object.fromEntries(masters.map(m=>[m,pin(m)])),ownerPin:pin('owner'),
 reviewerPin:pin('reviewer'),independentMasterPinsVerified:true,
 independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true,
 protectedOperatorSession:true,nowMs:now+4000};
function prepared(f){return prepareQl427CheckpointWitnessExport({store:f.store,scope},prepOpts);}
function witnessEnvelope(p,patch={}){
 return envelope('witness',{schema:'rosevear.ql427.independent-checkpoint-witness.v1',
  scope,checkpointIndex:p.exportRecord.checkpointIndex,checkpointDigest:p.exportRecord.checkpointDigest,
  incidentId,exportDigest:p.exportDigest,witnessId:'independent_witness_1',
  witnessedAt:new Date(now+1000).toISOString(),...patch});
}
function verifiedWitness(p,patch={}){
 return verifyQl427IndependentCheckpointWitness({exportRecord:p.exportRecord,
  witnessEnvelope:witnessEnvelope(p,patch)},witnessOpts);
}
function offEnvelope(w,checkId='isolation_check_ql427',patch={}){
 const p={schema:'rosevear.ql427.post-rollback-isolation.v1',scope,incidentId,
  checkpointDigest:w.checkpointDigest,witnessDigest:w.witnessDigest,
  checkId,receiverState:'OFF',observedAt:new Date(now+2000).toISOString(),...patch};
 return envelope('receiver',p);
}
async function isolated(f,w,{readback,checkId='isolation_check_ql427'}={}){
 return checkQl427PostRollbackIsolation({store:f.store,scope,witnessResult:w,
  checkId,receiverAdapter:{readSignedState:async()=>readback??offEnvelope(w,checkId)}},isolateOpts);
}
function masterReports(w,i,overrides={}){
 return masters.map(masterId=>envelope(masterId,{
  schema:'rosevear.ql427.master-recovery-closure.v1',masterId,scope,incidentId,
  checkpointDigest:w.checkpointDigest,witnessDigest:w.witnessDigest,
  isolationDigest:i.isolationDigest,status:'CONFIRMED_ISOLATED_RECOVERY_CLOSED',
  observedAt:new Date(now+3000).toISOString(),...overrides}));
}
function ownerClosure(w,i,reports,patch={}){
 const sorted=reports.map(r=>r.payload).sort((a,b)=>masters.indexOf(a.masterId)-masters.indexOf(b.masterId));
 // Hash exactly the same JSON payload as the protected verifier.
 const h=awaitlessHash(sorted);
 return ownerSigned({schema:'rosevear.ql427.owner-recovery-closure.v1',
  scope,incidentId,checkpointDigest:w.checkpointDigest,witnessDigest:w.witnessDigest,
  isolationDigest:i.isolationDigest,reportsDigest:h,
  action:'ACCEPT_RECOVERY_CLOSURE_KEEP_RECEIVER_OFF',
  closedAt:new Date(now+4000).toISOString(),ownerId:'Ree_Original',
  reviewerId:'Jack_Independent',...patch});
}
function awaitlessHash(x){return createHash('sha256').update(JSON.stringify(x)).digest('hex');}

test('QL-426 owner-ACK custody yields a metadata-only external witness export',()=>{
 const f=fixture();try{
  const p=prepared(f);
  assert.equal(p.state,'CHECKPOINT_EXPORT_PREPARED_NOT_WITNESSED');
  assert.equal(p.exportRecord.checkpointDigest,f.ack.recordDigest);
  assert.equal(p.exportRecord.incidentId,incidentId);
  assert.equal(p.connection,'HOLD');
  assert.equal(verifiedWitness(p).state,'INDEPENDENT_CHECKPOINT_WITNESS_VERIFIED');
  assert.equal(prepareQl427CheckpointWitnessExport({store:f.store,scope},
   {...prepOpts,ql426OwnerAckIndependentlyVerified:false}).state,'HOLD');
 }finally{f.close();}
});
test('independent witness rejects forged signatures, foreign digest and stale witness',()=>{
 const f=fixture();try{
  const p=prepared(f);
  const good=witnessEnvelope(p);
  assert.equal(verifyQl427IndependentCheckpointWitness({exportRecord:p.exportRecord,
    witnessEnvelope:{...good,signature:envelope('owner',good.payload).signature}},witnessOpts).state,'HOLD');
  assert.equal(verifiedWitness(p,{checkpointDigest:'f'.repeat(64)}).state,'HOLD');
  assert.equal(verifiedWitness(p,{witnessedAt:new Date(now-121000).toISOString()}).state,'HOLD');
  assert.equal(verifyQl427IndependentCheckpointWitness({exportRecord:p.exportRecord,
   witnessEnvelope:good},{...witnessOpts,independentWitnessPinVerified:false}).state,'HOLD');
 }finally{f.close();}
});
test('post-rollback isolation accepts only fresh separate signed receiver OFF readback',async()=>{
 const f=fixture();try{
  const w=verifiedWitness(prepared(f));
  const i=await isolated(f,w);
  assert.equal(i.state,'SIGNED_POST_ROLLBACK_ISOLATION_VERIFIED');
  assert.equal(i.connection,'HOLD');
  assert.equal(i.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal((await isolated(f,w,{readback:offEnvelope(w,'isolation_check_ql427',
   {receiverState:'ISOLATED_ONE_TEST_ON'})})).state,'HOLD');
  assert.equal((await isolated(f,w,{readback:offEnvelope(w,'isolation_check_ql427',
   {observedAt:new Date(now-121000).toISOString()})})).state,'HOLD');
  assert.equal((await isolated(f,w,{readback:envelope('owner',offEnvelope(w).payload)})).state,'HOLD');
  assert.equal((await isolated(f,w,{readback:offEnvelope(w,'wrong_check_id_12345')})).state,'HOLD');
 }finally{f.close();}
});
test('three separately signed Masters and dual owner custody record one closure, never CONNECTED',async()=>{
 const f=fixture();try{
  const w=verifiedWitness(prepared(f)),i=await isolated(f,w),reports=masterReports(w,i);
  const owner=ownerClosure(w,i,reports);
  const args={store:f.store,scope,witnessResult:w,isolationResult:i,reports,
   ownerAcceptance:owner,closureStore:f.closureStore};
  const done=acceptQl427ThreeMasterRecoveryClosure(args,closeOpts);
  assert.equal(done.state,'DURABLE_THREE_MASTER_RECOVERY_CLOSURE_RECORDED');
  assert.equal(done.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(done.connection,'HOLD');
  assert.equal(done.masterCount,3);
  assert.equal(openQl427ProtectedRecoveryClosureStore(join(f.root,'ql427'))
   .read(f.ack.recordDigest).recordDigest,done.recoveryClosureDigest);
  assert.equal(acceptQl427ThreeMasterRecoveryClosure(args,closeOpts).state,'HOLD');
 }finally{f.close();}
});
test('missing Master, mixed ceremony and owner signature forgery fail closed',async()=>{
 const f=fixture();try{
  const w=verifiedWitness(prepared(f)),i=await isolated(f,w),reports=masterReports(w,i);
  const good=ownerClosure(w,i,reports);
  const base={store:f.store,scope,witnessResult:w,isolationResult:i,closureStore:f.closureStore};
  assert.equal(acceptQl427ThreeMasterRecoveryClosure({...base,reports:reports.slice(0,2),
   ownerAcceptance:good},closeOpts).state,'HOLD');
  const altered=masterReports(w,i,{incidentId:'different_incident_1234'});
  assert.equal(acceptQl427ThreeMasterRecoveryClosure({...base,reports:altered,
   ownerAcceptance:good},closeOpts).state,'HOLD');
  assert.equal(acceptQl427ThreeMasterRecoveryClosure({...base,reports,
   ownerAcceptance:{...good,reviewerSignature:reports[0].signature}},closeOpts).state,'HOLD');
  assert.equal(acceptQl427ThreeMasterRecoveryClosure({...base,reports,
   ownerAcceptance:ownerClosure(w,i,reports,{reviewerId:'Ree_Original'})},closeOpts).state,'HOLD');
  assert.equal(f.closureStore.read(f.ack.recordDigest),null);
 }finally{f.close();}
});
test('external witness cannot mask missing or corrupted QL-426 owner ACK',async()=>{
 const f=fixture();try{
  const p=prepared(f),w=verifiedWitness(p);
  const wrong={...scope,episodeId:'episode_other_123456'};
  assert.equal(prepareQl427CheckpointWitnessExport({store:f.store,scope:wrong},prepOpts).state,'HOLD');
  assert.equal((await checkQl427PostRollbackIsolation({store:f.store,scope:wrong,witnessResult:w,
   checkId:'isolation_check_ql427',receiverAdapter:{readSignedState:async()=>offEnvelope(w)}},
   isolateOpts)).state,'HOLD');
 }finally{f.close();}
});
