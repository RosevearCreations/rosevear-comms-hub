import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl426ProtectedCheckpointStore} from './ql426-durable-pilot-custody.mjs';
import {openQl427ProtectedRecoveryClosureStore} from './ql427-independent-witness-recovery.mjs';
import {prepareQl428ExternalClosureAnchor,recheckQl428IndependentCustody,
 openQl428ProtectedReentryDecisionStore,decideQl428SupervisedPilotReentry} from './ql428-external-anchor-reentry.mjs';

const ids=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const keys=Object.fromEntries([...ids,'anchor','reader','receiver','owner','reviewer'].map(
 id=>[id,generateKeyPairSync('ed25519')]));
const pin=id=>keys[id].publicKey.export({format:'der',type:'spki'}).toString('base64');
const sig=(id,p)=>sign(null,Buffer.from(JSON.stringify(p)),keys[id].privateKey).toString('base64');
const envelope=(id,payload)=>({payload,signature:sig(id,payload)});
const dual=p=>({payload:p,ownerSignature:sig('owner',p),reviewerSignature:sig('reviewer',p)});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const now=Date.parse('2026-11-12T15:00:00.000Z');
const at=offset=>new Date(now+offset).toISOString();
const scope={ceremonyId:'ceremony_ql428_123456',sourceId:'rosevear-ai-hub',
 episodeId:'episode_ql428_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql428_123456';
const anchorId='anchor_ql428_123456';
const storeId='external_ql428_123456';
const requestId='challenge_ql428_123456';
const reentryId='reentry_ql428_123456';
const masterPins=Object.fromEntries(ids.map(id=>[id,pin(id)]));
const opts={anchorPin:pin('anchor'),readbackPin:pin('reader'),
 expectedExternalStoreId:storeId,independentAnchorSignerVerified:true,
 independentReadbackSignerVerified:true,independentExternalStoreVerified:true,
 ql427ClosureIndependentlyVerified:true,protectedOperatorSession:true,nowMs:now};
const decisionOpts={...opts,masterPins,receiverPin:pin('receiver'),
 ownerPin:pin('owner'),reviewerPin:pin('reviewer'),
 independentMasterPinsVerified:true,independentReceiverPinVerified:true,
 independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true};
const seq=Object.fromEntries(ids.map(id=>[id,1]));
const entry=(kind,atOffset,incident=null,rollbackDigest=null)=>({
 kind,scope,observedAt:at(atOffset),evidenceDigest:'d'.repeat(64),
 sequences:seq,incidentId:incident,
 receiverReadbackDigest:incident?'e'.repeat(64):null,
 rollbackCheckpointDigest:rollbackDigest
});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql428-'));
 const checkpointStore=openQl426ProtectedCheckpointStore(join(root,'ql426'));
 const closureStore=openQl427ProtectedRecoveryClosureStore(join(root,'ql427'));
 const decisionStore=openQl428ProtectedReentryDecisionStore(join(root,'ql428'));
 const h=checkpointStore.append(scope,entry('HEALTH',-60000),null);
 const rollback=checkpointStore.append(scope,entry('ROLLBACK',-50000,incidentId),h.recordDigest);
 const ack=checkpointStore.append(scope,entry('OWNER_ACK',-40000,incidentId,rollback.recordDigest),rollback.recordDigest);
 const closure=closureStore.claimOnce(ack.recordDigest,'b'.repeat(64));
 return {root,checkpointStore,closureStore,decisionStore,ack,closure,
  close:()=>rmSync(root,{recursive:true,force:true})};
}
function anchorSigned(f,patch={},backPatch={}){
 const payload={schema:'rosevear.ql428.external-closure-anchor.v1',scope,incidentId,
  checkpointIndex:f.ack.index,checkpointDigest:f.ack.recordDigest,
  closureReceiptDigest:f.closure.recordDigest,closurePayloadDigest:f.closure.payloadDigest,
  anchorId,externalStoreId:storeId,anchorSequence:17,anchoredAt:at(-10000),...patch};
 const readback={schema:'rosevear.ql428.external-anchor-readback.v1',
  scope,anchorId,anchorDigest:hash(payload),requestId,externalStoreId:storeId,
  remoteDurable:true,remoteSequence:17,retrievedAt:at(-3000),...backPatch};
 return {anchor:envelope('anchor',payload),readback:envelope('reader',readback)};
}
function params(f,overrides={}){
 return {checkpointStore:f.checkpointStore,closureStore:f.closureStore,scope,
  anchorClient:{readSignedAnchor:async()=>anchorSigned(f)},
  anchorId,requestId,...overrides};
}
async function custody(f,overrides={},config=opts){
 return recheckQl428IndependentCustody(params(f,overrides),config);
}
function receiverAttestation(f,patch={}){
 const payload={schema:'rosevear.ql428.pre-reentry-receiver-isolation.v1',
  scope,incidentId,closureReceiptDigest:f.closure.recordDigest,
  anchorDigest:hash(anchorSigned(f).anchor.payload),reentryId,
  receiverState:'OFF',observedAt:at(-2000),...patch};
 return envelope('receiver',payload);
}
function reports(f,offOverride={}){
 const off=receiverAttestation(f,offOverride).payload;
 return ids.map(masterId=>envelope(masterId,{
  schema:'rosevear.ql428.master-supervised-reentry.v1',
  masterId,scope,incidentId,closureReceiptDigest:f.closure.recordDigest,
  anchorDigest:hash(anchorSigned(f).anchor.payload),offDigest:hash(off),reentryId,
  status:'REENTRY_PRECHECK_ONLY_NEW_QL424_CEREMONY_REQUIRED',
  observedAt:at(-1000)}));
}
function decision(f,rs,patch={}){
 const ordered=rs.map(r=>r.payload).sort((a,b)=>ids.indexOf(a.masterId)-ids.indexOf(b.masterId));
 return dual({schema:'rosevear.ql428.owner-supervised-reentry.v1',
  scope,incidentId,closureReceiptDigest:f.closure.recordDigest,
  anchorDigest:hash(anchorSigned(f).anchor.payload),
  offDigest:hash(receiverAttestation(f).payload),reentryId,
  reportsDigest:hash(ordered),action:'PREPARE_NEW_SUPERVISED_CEREMONY_KEEP_RECEIVER_OFF',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',decidedAt:at(0),...patch});
}
function decideArgs(f,{off=receiverAttestation(f),rs=reports(f),owner=undefined,...rest}={}){
 return {...params(f),receiverAdapter:{readSignedState:async()=>off},
  reentryId,reports:rs,ownerDecision:owner??decision(f,rs),decisionStore:f.decisionStore,
  ...rest};
}
test('QL-427 durable closure produces a sanitized unanchored export only',()=>{
 const f=fixture();try{
  const result=prepareQl428ExternalClosureAnchor(
   {checkpointStore:f.checkpointStore,closureStore:f.closureStore,scope},
   {protectedOperatorSession:true,ql427ClosureIndependentlyVerified:true,nowMs:now});
  assert.equal(result.state,'EXTERNAL_CLOSURE_ANCHOR_EXPORT_PREPARED');
  assert.equal(result.connection,'HOLD');
  assert.equal(result.exportRecord.closureReceiptDigest,f.closure.recordDigest);
  assert.equal(result.exportRecord.checkpointDigest,f.ack.recordDigest);
  assert.ok(result.exportDigest);
  assert.equal(prepareQl428ExternalClosureAnchor(
   {checkpointStore:f.checkpointStore,closureStore:f.closureStore,scope},
   {protectedOperatorSession:true,nowMs:now}).state,'HOLD');
 }finally{f.close();}
});
test('independent signed anchor and separate fresh external readback match local custody',async()=>{
 const f=fixture();try{
  const r=await custody(f);
  assert.equal(r.state,'INDEPENDENT_EXTERNAL_CUSTODY_MATCHED');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.closureReceiptDigest,f.closure.recordDigest);
  assert.equal(r.anchorDigest,hash(anchorSigned(f).anchor.payload));
  assert.equal((await custody(f,{}, {...opts,independentExternalStoreVerified:false})).state,'HOLD');
 }finally{f.close();}
});
test('forged, stale, drifted, replayed or non-durable external evidence is rejected',async()=>{
 const f=fixture();try{
  const signedAnchor=anchorSigned(f);
  const cases=[
   {...signedAnchor,anchor:{...signedAnchor.anchor,signature:sig('owner',signedAnchor.anchor.payload)}},
   anchorSigned(f,{closureReceiptDigest:'f'.repeat(64)}),
   anchorSigned(f,{incidentId:'foreign_incident_123456'}),
   anchorSigned(f,{}, {remoteDurable:false}),
   anchorSigned(f,{}, {requestId:'replayed_request_123456'}),
   anchorSigned(f,{}, {retrievedAt:at(-61000)}),
   anchorSigned(f,{}, {remoteSequence:16}),
   anchorSigned(f,{}, {anchorDigest:'0'.repeat(64)}),
   {...signedAnchor,readback:{...signedAnchor.readback,
    signature:sig('anchor',signedAnchor.readback.payload)}}
  ];
  for(const result of cases){
   assert.equal((await custody(f,{anchorClient:{readSignedAnchor:async()=>result}})).state,'HOLD');
  }
  assert.equal((await custody(f,{requestId:'different_challenge_123456'})).state,'HOLD');
 }finally{f.close();}
});
test('local QL-427 receipt tampering and a concurrent external read drift fail closed',async()=>{
 const f=fixture();try{
  const dir=join(f.root,'ql427'), file=readdirSync(dir).find(x=>x.endsWith('.json'));
  const old=readFileSync(join(dir,file),'utf8');
  const changed=JSON.parse(old);changed.payloadDigest='f'.repeat(64);
  writeFileSync(join(dir,file),JSON.stringify(changed));
  assert.equal((await custody(f)).state,'HOLD');
  writeFileSync(join(dir,file),old);
  const remote=anchorSigned(f);
  const recheck=await custody(f,{anchorClient:{readSignedAnchor:async()=>{
   writeFileSync(join(dir,file),JSON.stringify(changed));return remote;
  }}});
  assert.equal(recheck.state,'HOLD');
 }finally{f.close();}
});
test('fully signed owner supervised re-entry precheck stays OFF/HOLD and cannot replay',async()=>{
 const f=fixture();try{
  const res=await decideQl428SupervisedPilotReentry(decideArgs(f),decisionOpts);
  assert.equal(res.state,'SUPERVISED_REENTRY_PRECHECK_RECORDED_NO_ACTIVATION');
  assert.equal(res.connection,'HOLD');
  assert.equal(res.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(res.masterCount,3);
  const saved=openQl428ProtectedReentryDecisionStore(join(f.root,'ql428'))
   .read(f.closure.recordDigest,reentryId);
  assert.equal(saved.recordDigest,res.decisionDigest);
  assert.equal((await decideQl428SupervisedPilotReentry(decideArgs(f),decisionOpts)).state,'HOLD');
 }finally{f.close();}
});
test('receiver ON, wrong key and wrong anchor cannot authorize re-entry',async()=>{
 const f=fixture();try{
  const off=receiverAttestation(f);
  const cases=[
   receiverAttestation(f,{receiverState:'ISOLATED_ONE_TEST_ON'}),
   receiverAttestation(f,{anchorDigest:'f'.repeat(64)}),
   receiverAttestation(f,{reentryId:'wrong_reentry_12345'}),
   receiverAttestation(f,{observedAt:at(-62000)}),
   envelope('owner',off.payload)
  ];
  for(const invalidOff of cases){
   const result=await decideQl428SupervisedPilotReentry(decideArgs(f,{off:invalidOff}),decisionOpts);
   assert.equal(result.state,'HOLD');
   assert.equal(f.decisionStore.read(f.closure.recordDigest,reentryId),null);
  }
 }finally{f.close();}
});
test('missing Master, forged signed report, duplicate Master and invalid owner approval block closure',async()=>{
 const f=fixture();try{
  const valid=reports(f);
  const invalidCases=[
   {rs:valid.slice(0,2)},
   {rs:[valid[0],valid[0],valid[2]]},
   {rs:[{...valid[0],signature:sig('owner',valid[0].payload)},valid[1],valid[2]]},
   {owner:{...decision(f,valid),reviewerSignature:valid[1].signature}},
   {owner:decision(f,valid,{reviewerId:'Ree_Original'})},
   {owner:decision(f,valid,{action:'ACTIVATE_RECEIVER'})}
  ];
  for(const invalid of invalidCases){
   const result=await decideQl428SupervisedPilotReentry(decideArgs(f,invalid),decisionOpts);
   assert.equal(result.state,'HOLD');
   assert.equal(f.decisionStore.read(f.closure.recordDigest,reentryId),null);
  }
  assert.equal((await decideQl428SupervisedPilotReentry(decideArgs(f),
   {...decisionOpts,independentOwnerCustodyVerified:false})).state,'HOLD');
 }finally{f.close();}
});
