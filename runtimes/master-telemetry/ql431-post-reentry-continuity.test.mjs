import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,readdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl430ProtectedCeremonyAudit} from './ql430-supervised-pilot-reentry.mjs';
import {openQl431ProtectedContinuityStore,runQl431PostReentryPilotHealth,
 reconcileQl431ThreeMasterIncident} from './ql431-post-reentry-continuity.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const iso=ms=>new Date(ms).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return {privateKey:k.privateKey,
 pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 k.privateKey).toString('base64')});
const scope={ceremonyId:'new_ceremony_ql431_123456',sourceId:'rosevear-ai-hub',
 episodeId:'new_episode_ql431_123456',sourceRevision:'a'.repeat(40),
 controllerRevision:'b'.repeat(40)};
const observation=n=>'observation_ql431_'+String(n).padStart(12,'0');
const incident=n=>'incident_ql431_'+String(n).padStart(12,'0');
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql431-'));
 const audit=openQl430ProtectedCeremonyAudit(join(root,'ql430'));
 const accepted=audit.claimOnce('accepted',scope.ceremonyId,'c'.repeat(64));
 const store=openQl431ProtectedContinuityStore(join(root,'ql431'));
 const masterKeys=Object.fromEntries(MASTERS.map(m=>[m,key()]));
 const receiver=key(),shutdown=key(),owner=key(),reviewer=key(),forger=key();
 const acceptance={...scope,state:'DURABLE_VERIFIED_THREE_MASTER_REENTRY_ISOLATED_PILOT',
  connection:'VERIFIED_CONNECTED_PILOT',receiver:'ISOLATED_ONE_TEST_ON',
  ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',masterCount:3,
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',acceptedRecordDigest:accepted.recordDigest,
  ql429WitnessDigest:'d'.repeat(64),independentReceiverDigest:'e'.repeat(64)};
 let disables=0,enableAttempts=0,invalidAck=false,invalidOff=false,throwDisable=false,
  fakeOn=false,receiverReads=0;
 const receiverAdapter={
  disableOneTest:async({observationId,incidentId,reason})=>{
   disables++;
   if(throwDisable)throw Error('receiver unplugged');
   const p={schema:'rosevear.ql431.signed-fail-closed-shutdown.v1',scope,
    observationId,incidentId,reason,receiverState:'OFF',disabledAt:iso(clock-80)};
   return {disabled:true,signedAck:signed(p,invalidAck?forger:shutdown)};
  },
  enableOneTest:async()=>{enableAttempts++;throw Error('NEVER_ACTIVATE');}
 };
 const independentReceiverAdapter={
  readSignedState:async({observationId,requiredState,incidentId=null,shutdownAckDigest=null})=>{
   receiverReads++;
   const p={schema:'rosevear.ql431.independent-receiver-health.v1',
    scope,ql430AcceptedDigest:accepted.recordDigest,observationId,
    incidentId,shutdownAckDigest,receiverState:requiredState,
    observedAt:iso(clock-50)};
   if(fakeOn&&requiredState==='ISOLATED_ONE_TEST_ON')p.receiverState='OFF';
   return signed(p,invalidOff&&requiredState==='OFF'?forger:receiver);
  }
 };
 let clock=Date.now()-5000;
 const opts={nowMs:clock,masterPins:Object.fromEntries(MASTERS.map(m=>[m,masterKeys[m].pin])),
  shutdownPin:shutdown.pin,independentReceiverPin:receiver.pin,
  originalHostSessionVerified:true,independentQl430AcceptanceVerified:true,
  independentMasterPinsVerified:true,independentReceiverPinVerified:true,
  independentShutdownPinVerified:true};
 const heartbeats=(sequence=1,stamp=clock-150)=>MASTERS.map(masterId=>{
  const p={schema:'rosevear.ql431.master-post-reentry-health.v1',masterId,scope,
   ql430AcceptedDigest:accepted.recordDigest,status:'ISOLATED_PILOT_HEALTHY',
   sequence,observedAt:iso(stamp)};
  return signed(p,masterKeys[masterId]);
 });
 const run=(n,hb=heartbeats(n))=>runQl431PostReentryPilotHealth({
  ql430Acceptance:acceptance,ql430Audit:audit,heartbeats:hb,receiverAdapter,
  independentReceiverAdapter,store,observationId:observation(n),incidentId:incident(n)},opts);
 const reconcile=(n,change)=> {
  const previous=store.read(scope);
  const reports=MASTERS.map(masterId=>{
   const p={schema:'rosevear.ql431.master-incident-custody.v1',masterId,scope,
    incidentId:incident(n),shutdownRecordDigest:previous.recordDigest,
    receiverOffDigest:previous.entry.receiverOffDigest,
    status:'ISOLATED_RECEIVER_OFF_INCIDENT_HELD',observedAt:iso(clock-20)};
   return signed(p,masterKeys[masterId]);
  });
  const p={schema:'rosevear.ql431.owner-incident-reconciliation.v1',scope,
   incidentId:incident(n),shutdownRecordDigest:previous.recordDigest,
   reportsDigest:hash(reports.map(r=>r.payload)),
   action:'ACKNOWLEDGE_FAIL_CLOSED_INCIDENT_KEEP_RECEIVER_OFF',
   ownerId:'Ree_Original',reviewerId:'Jack_Independent',acceptedAt:iso(clock-10)};
  const acceptance={payload:p,
   ownerSignature:signed(p,owner).signature,
   reviewerSignature:signed(p,reviewer).signature};
  const arguments_={store,scope,incidentId:incident(n),reports,ownerAcceptance:acceptance};
  const config={nowMs:clock,masterPins:opts.masterPins,ownerPin:owner.pin,reviewerPin:reviewer.pin,
   protectedOperatorSession:true,independentMasterPinsVerified:true,
   independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true};
  change?.(arguments_,config,{forger,masterKeys});
  return reconcileQl431ThreeMasterIncident(arguments_,config);
 };
 return {root,scope,opts,store,audit,acceptance,heartbeats,run,reconcile,
  advance(ms=1000){clock+=ms;opts.nowMs=clock;},
  get clock(){return clock;},
  counts(){return {disables,enableAttempts,receiverReads};},
  setInvalidAck(x){invalidAck=x;},setInvalidOff(x){invalidOff=x;},
  setThrowDisable(x){throwDisable=x;},setFakeOn(x){fakeOn=x;},
  cleanup(){rmSync(root,{recursive:true,force:true});}};
}

test('fresh three-Master signed post-reentry health and independent ON are durable bounded snapshots',async()=>{
 const a=fixture();try{
  const first=await a.run(1);
  assert.equal(first.state,'DURABLE_QL431_POST_REENTRY_HEALTH_SNAPSHOT');
  assert.equal(first.connection,'VERIFIED_CONNECTED_PILOT');
  assert.equal(first.runtimeUptime,'SIGNED_SINGLE_CYCLE_NOT_MEASURED_UPTIME');
  assert.equal(first.slaveGate,'HOLD_NEXT_MASTER_INTEGRATION_STAGE');
  assert.equal(a.store.read(scope).entry.kind,'HEALTH');
  a.advance();
  const second=await a.run(2);
  assert.equal(second.state,'DURABLE_QL431_POST_REENTRY_HEALTH_SNAPSHOT');
  assert.equal(second.checkpointIndex,2);
  assert.notEqual(first.checkpointDigest,second.checkpointDigest);
  assert.deepEqual(a.counts(),{disables:0,enableAttempts:0,receiverReads:2});
  const replay=await a.run(2);
  assert.equal(replay.state,'HOLD');
  assert.equal(a.counts().disables,0);
 }finally{a.cleanup();}
});
test('missing three-Master heartbeat causes signed fail-closed shutdown and independent OFF custody',async()=>{
 const a=fixture();try{
  const result=await a.run(1,a.heartbeats().slice(0,2));
  assert.equal(result.state,'DURABLE_SIGNED_FAIL_CLOSED_SHUTDOWN');
  assert.equal(result.connection,'HOLD');
  assert.equal(result.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(a.store.read(scope).entry.kind,'OFF');
  assert.equal(a.store.read(scope).index,2);
  assert.deepEqual(a.counts(),{disables:1,enableAttempts:0,receiverReads:1});
  const again=await a.run(2);
  assert.equal(again.state,'HOLD');
  assert.equal(a.counts().disables,1);
 }finally{a.cleanup();}
});
test('duplicate, forged, replayed and stale heartbeats each trigger fail closed',async()=>{
 for(const variant of ['duplicate','forged','stale','replayed']){
  const a=fixture();try{
   if(variant==='replayed'){
    assert.equal((await a.run(1)).state,'DURABLE_QL431_POST_REENTRY_HEALTH_SNAPSHOT');
    a.advance();
   }
   let reports=a.heartbeats(variant==='replayed'?1:2);
   if(variant==='duplicate')reports[2]=reports[1];
   if(variant==='forged')reports[0].signature=signed(reports[0].payload,key()).signature;
   if(variant==='stale')reports=a.heartbeats(2,a.clock-61000);
   const r=await a.run(variant==='replayed'?2:1,reports);
   assert.equal(r.state,'DURABLE_SIGNED_FAIL_CLOSED_SHUTDOWN',variant);
   assert.equal(r.connection,'HOLD');
   assert.equal(a.counts().disables,1);
  }finally{a.cleanup();}
 }
});
test('invalid signed ON receiver state triggers fail-closed shutdown, not healthy status',async()=>{
 const a=fixture();try{
  a.setFakeOn(true);
  assert.equal((await a.run(1)).state,'DURABLE_SIGNED_FAIL_CLOSED_SHUTDOWN');
  assert.equal(a.counts().disables,1);
 }finally{a.cleanup();}
});
test('unsigned shutdown acknowledgement or forged OFF readback never claims receiver OFF',async()=>{
 for(const mode of ['ack','off','throw']){
  const a=fixture();try{
   if(mode==='ack')a.setInvalidAck(true);
   if(mode==='off')a.setInvalidOff(true);
   if(mode==='throw')a.setThrowDisable(true);
   const r=await a.run(1,[]);
   assert.equal(r.state,'HOLD');
   assert.equal(r.receiver,'UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED');
   assert.equal(a.store.read(scope).entry.kind,'PENDING');
   assert.equal(a.counts().disables,1);
  }finally{a.cleanup();}
 }
});
test('missing QL430 signed durable acceptance prevents any monitor action',async()=>{
 const a=fixture();try{
  a.acceptance.acceptedRecordDigest='f'.repeat(64);
  const result=await a.run(1);
  assert.equal(result.state,'HOLD');
  assert.deepEqual(a.counts(),{disables:0,enableAttempts:0,receiverReads:0});
 }finally{a.cleanup();}
});
test('reconciles signed OFF incident with three unique Masters and dual-owner signatures, never reconnects',async()=>{
 const a=fixture();try{
  assert.equal((await a.run(1,[])).state,'DURABLE_SIGNED_FAIL_CLOSED_SHUTDOWN');
  const done=a.reconcile(1);
  assert.equal(done.state,'DURABLE_QL431_THREE_MASTER_INCIDENT_RECONCILED');
  assert.equal(done.masterCount,3);
  assert.equal(done.connection,'HOLD');
  assert.equal(done.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(a.store.read(scope).entry.kind,'RECONCILED');
  assert.equal(a.reconcile(1).state,'HOLD');
  assert.equal(a.counts().enableAttempts,0);
 }finally{a.cleanup();}
});
test('rejects duplicate Master signatures, forged owner and wrong original-host session',async()=>{
 for(const mode of ['duplicate','forgedOwner','session']){
  const a=fixture();try{
   await a.run(1,[]);
   const r=a.reconcile(1,(args,config,{forger})=>{
    if(mode==='duplicate')args.reports[2]=args.reports[1];
    if(mode==='forgedOwner')args.ownerAcceptance.ownerSignature=
     signed(args.ownerAcceptance.payload,forger).signature;
    if(mode==='session')config.protectedOperatorSession=false;
   });
   assert.equal(r.state,'HOLD');
   assert.equal(a.store.read(scope).entry.kind,'OFF');
  }finally{a.cleanup();}
 }
});
test('tampered local head blocks false continuity and does not silently reconnect',async()=>{
 const a=fixture();try{
  assert.equal((await a.run(1)).state,'DURABLE_QL431_POST_REENTRY_HEALTH_SNAPSHOT');
  const head=readdirSync(join(a.root,'ql431')).find(f=>f.endsWith('.head'));
  writeFileSync(join(a.root,'ql431',head),'{"schema":"rosevear.ql431.head.v1","count":3,"lastDigest":"'+
   'a'.repeat(64)+'"}');
  assert.throws(()=>a.store.read(scope),/QL431_HEAD_TAMPERED/);
  a.advance();
  assert.equal((await a.run(2)).state,'HOLD');
 }finally{a.cleanup();}
});
