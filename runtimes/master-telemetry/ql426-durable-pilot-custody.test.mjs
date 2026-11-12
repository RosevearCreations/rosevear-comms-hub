import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {openQl426ProtectedCheckpointStore,runQl426ProtectedPilotAudit,acceptQl426OwnerIncident} from './ql426-durable-pilot-custody.mjs';

const ids=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const keys=Object.fromEntries([...ids,'receiver','owner','reviewer'].map(id=>[id,generateKeyPairSync('ed25519')]));
const pub=id=>keys[id].publicKey.export({format:'der',type:'spki'}).toString('base64');
const signIt=(id,p)=>sign(null,Buffer.from(JSON.stringify(p)),keys[id].privateKey).toString('base64');
const accepted={state:'VERIFIED_THREE_MASTER_ISOLATED_PILOT_ACCEPTANCE',connection:'VERIFIED_CONNECTED_PILOT',
 receiver:'ISOLATED_ONE_TEST_ON',ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',sourceId:'rosevear-ai-hub',
 ceremonyId:'ceremony_ql426_123456',episodeId:'episode_ql426_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40),masterCount:3};
const scope={ceremonyId:accepted.ceremonyId,sourceId:accepted.sourceId,episodeId:accepted.episodeId,
 sourceRevision:accepted.sourceRevision,controllerRevision:accepted.controllerRevision};
const now=Date.parse('2026-11-12T10:00:00.000Z');
const opts={masterPins:Object.fromEntries(ids.map(id=>[id,pub(id)])),receiverPin:pub('receiver'),
 nowMs:now,ql424AcceptanceIndependentlyVerified:true,protectedOperatorSession:true,
 independentMasterPinsVerified:true,independentReceiverPinVerified:true};
const newStore=()=>{const dir=mkdtempSync(join(tmpdir(),'ql426-'));return {dir,store:openQl426ProtectedCheckpointStore(dir),close:()=>rmSync(dir,{recursive:true,force:true})};};
const beat=(id,sequence=1,offset=0)=>{
 const p={schema:'rosevear.ql425.master-pilot-heartbeat.v1',masterId:id,ceremonyId:scope.ceremonyId,
 sourceId:scope.sourceId,episodeId:scope.episodeId,sourceRevision:scope.sourceRevision,
 controllerRevision:scope.controllerRevision,status:'ISOLATED_PILOT_HEALTHY',
 observedAt:new Date(now+offset).toISOString(),sequence};
 return {payload:p,signature:signIt(id,p)};
};
const healthy=(n=1)=>ids.map(id=>beat(id,n));
const signedOff=(incidentId,override={})=>{
 const p={schema:'rosevear.ql426.receiver-rollback-readback.v1',...scope,incidentId,
 receiverState:'OFF',observedAt:new Date(now).toISOString(),...override};
 return {payload:p,signature:signIt('receiver',p)};
};
const adapter=(incidentId,{readback=signedOff(incidentId),disableResult={disabled:true}}={})=>{
 const calls=[];
 return {calls,disableOneTest:async()=>{calls.push('disable');return disableResult;},
 readSignedState:async()=>{calls.push('read');return readback;}};
};
const cycle=({store,heartbeats=healthy(),receiverAdapter=adapter('incident_ql426_123456'),incidentId='incident_ql426_123456'}={})=>
 runQl426ProtectedPilotAudit({accepted,heartbeats,receiverAdapter,store,incidentId},opts);
const acknowledgement=(rollbackDigest,incidentId='incident_ql426_123456',patch={})=>{
 const p={schema:'rosevear.ql426.owner-incident-ack.v1',incidentId,...scope,
 rollbackCheckpointDigest:rollbackDigest,action:'ACKNOWLEDGE_VERIFIED_ISOLATED_ROLLBACK',
 acceptedAt:new Date(now).toISOString(),ownerId:'Ree_Original',reviewerId:'Jack_Independent',...patch};
 return {payload:p,ownerSignature:signIt('owner',p),reviewerSignature:signIt('reviewer',p)};
};
const ownerOpts={ownerPin:pub('owner'),reviewerPin:pub('reviewer'),independentOwnerCustodyVerified:true,
 independentReviewerCustodyVerified:true,protectedOperatorSession:true,nowMs:now};

test('healthy signed 3-Master checkpoint is durable after reopening and cannot replay sequences',async()=>{
 const o=newStore();try{
  let r=await cycle({store:o.store});
  assert.equal(r.state,'DURABLE_VERIFIED_ISOLATED_PILOT_CHECKPOINT');assert.equal(r.checkpointIndex,1);
  assert.equal(r.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
  const reopened=openQl426ProtectedCheckpointStore(o.dir);assert.equal(reopened.read(scope).recordDigest,r.checkpointDigest);
  r=await cycle({store:reopened,heartbeats:healthy(2)});
  assert.equal(r.state,'DURABLE_VERIFIED_ISOLATED_PILOT_CHECKPOINT');assert.equal(r.checkpointIndex,2);
  const a=adapter('incident_ql426_123456');
  r=await cycle({store:reopened,heartbeats:healthy(2),receiverAdapter:a});
  assert.equal(r.state,'DURABLE_VERIFIED_ROLLBACK_INCIDENT');assert.equal(r.connection,'HOLD');
  assert.deepEqual(a.calls,['disable','read']);
  assert.equal(r.checkpointIndex,3);
 }finally{o.close();}
});
test('missing heartbeat triggers signed-off rollback custody and separate dual-signed owner ACK',async()=>{
 const o=newStore();try{
  const a=adapter('incident_ql426_123456');
  let r=await cycle({store:o.store,heartbeats:healthy().slice(0,2),receiverAdapter:a});
  assert.equal(r.state,'DURABLE_VERIFIED_ROLLBACK_INCIDENT');
  assert.equal(r.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  const ack=acknowledgement(r.rollbackCheckpointDigest);
  let result=acceptQl426OwnerIncident({store:o.store,scope,envelope:ack},ownerOpts);
  assert.equal(result.state,'DURABLE_DUAL_SIGNED_OWNER_INCIDENT_ACK');
  assert.equal(result.connection,'HOLD');
  assert.equal(result.checkpointIndex,2);
  assert.equal(acceptQl426OwnerIncident({store:o.store,scope,envelope:ack},ownerOpts).state,'HOLD');
  assert.equal((await cycle({store:o.store})).state,'HOLD');
 }finally{o.close();}
});
test('forged receiver signature and wrong incident cannot confirm OFF',async()=>{
 for(const readback of [
  {...signedOff('incident_ql426_123456'),signature:signIt('owner',signedOff('incident_ql426_123456').payload)},
  signedOff('different_incident_12345'),
  signedOff('incident_ql426_123456',{receiverState:'ISOLATED_ONE_TEST_ON'}),
  signedOff('incident_ql426_123456',{observedAt:new Date(now-61000).toISOString()})
 ]){
  const o=newStore();try{
   const r=await cycle({store:o.store,heartbeats:[],receiverAdapter:adapter('incident_ql426_123456',{readback})});
   assert.equal(r.state,'HOLD');assert.equal(r.connection,'HOLD');
   assert.equal(o.store.read(scope),null);
  }finally{o.close();}
 }
});
test('tampered immutable checkpoint or orphan record is detected fail-closed',async()=>{
 const o=newStore();try{
  await cycle({store:o.store});
  const file=readdirSync(o.dir).find(x=>x.endsWith('.json'));
  const obj=JSON.parse(readFileSync(join(o.dir,file),'utf8'));
  obj.entry.evidenceDigest='f'.repeat(64);writeFileSync(join(o.dir,file),JSON.stringify(obj));
  assert.throws(()=>o.store.read(scope),/CUSTODY_CHAIN_TAMPERED/);
  const r=await cycle({store:o.store});assert.equal(r.state,'HOLD');
 }finally{o.close();}
});
test('owner acceptance rejects wrong signature, mismatched digest and same principal',async()=>{
 const o=newStore();try{
  const r=await cycle({store:o.store,heartbeats:[]});assert.equal(r.state,'DURABLE_VERIFIED_ROLLBACK_INCIDENT');
  for(const e of [
   {...acknowledgement(r.rollbackCheckpointDigest),reviewerSignature:'notasignature'},
   acknowledgement('f'.repeat(64)),
   acknowledgement(r.rollbackCheckpointDigest,'incident_ql426_123456',{reviewerId:'Ree_Original'})
  ]){
   const response=acceptQl426OwnerIncident({store:o.store,scope,envelope:e},ownerOpts);
   assert.equal(response.state,'HOLD');assert.equal(o.store.read(scope).entry.kind,'ROLLBACK');
  }
  assert.equal(acceptQl426OwnerIncident({store:o.store,scope,envelope:acknowledgement(r.rollbackCheckpointDigest)},
   {...ownerOpts,protectedOperatorSession:false}).state,'HOLD');
 }finally{o.close();}
});
test('missing independent runtime authority does not invoke a receiver',async()=>{
 const o=newStore();try{
  const a=adapter('incident_ql426_123456');
  const r=await runQl426ProtectedPilotAudit({accepted,heartbeats:[],receiverAdapter:a,store:o.store,
   incidentId:'incident_ql426_123456'},{...opts,ql424AcceptanceIndependentlyVerified:false});
  assert.equal(r.connection,'HOLD');assert.deepEqual(a.calls,[]);
 }finally{o.close();}
});
