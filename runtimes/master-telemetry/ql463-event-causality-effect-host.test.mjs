import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync,chmodSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl462DurableLedger,QL462_SCHEMA} from './ql462-signed-outbox-inbox.mjs';
import {QL463_SCHEMA,QL463_ORIGINAL_HOST,QL463_MASTER_MODULES,
 openQl463CausalLedger,reconcileQl463SignedEvent,claimQl463ExactlyOnceEffect,
 inspectQl463Effect,assessQl463OriginalHostReadiness}
 from './ql463-event-causality-effect-host.mjs';
const h=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const iso=n=>new Date(n).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({type:'spki',format:'der'}).toString('base64')}};
const enc=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 k.privateKey).toString('base64')});
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql463-')),now=Date.now()-500;
 const ql462Ledger=openQl462DurableLedger(join(root,'older'));
 const causalLedger=openQl463CausalLedger(join(root,'causal'));
 const keys={source:key(),master:key(),owner:key(),observer:key()};
 const sourceId='rosiedazzlers',targetAudience='rosevear-comms-hub',
  sourceMainSha='b'.repeat(40),tenantId='tenant_abc12345',
  workspaceId='workspace_abc12345';
 function makeSource(id,idem,bodyDigest){
  const msg={schema:QL462_SCHEMA,messageId:id,idempotencyKey:idem,
   replayNonce:'nonce_abc123456',sourceId,sourceRepository:'rosiedazzlers',
   sourceMainSha,targetAudience,protocol:'1.1',
   capability:'source.security-evidence.read',
   tenantId,workspaceId,subjectId:'subject_abc12345',
   correlationId:'correlation_abc12345',bodyDigest,
   bodyClass:'SOURCE_NONPERSONAL_EVIDENCE',
   issuedAt:iso(now-18000),expiresAt:iso(now+30000),
   requestScope:'SOURCE_READ_ONLY',authorityTransfer:false,
   privateDataIncluded:false,directPeerDatabaseWrite:false,
   ownerCeremonyRequested:false};
  const old=ql462Ledger.append('outbox',idem,{
   messageId:id,idempotencyKey:idem,messageDigest:h(msg),sourceId,
   targetAudience,protocol:'1.1',state:'SIGNED_PENDING_HOLD',
   referenceDigest:'e'.repeat(64)});
  const ack={schema:'rosevear.ql462.master-ack.v1',
   messageId:id,idempotencyKey:idem,sourceId,targetAudience,
   outboxDigest:old.digest,protocol:'1.1',
   reviewState:'SOURCE_REVIEW_ACCEPTED',acceptedAt:iso(now-10000),
   runtimeConnection:'UNVERIFIED_HOLD',authorityTransfer:false};
  const ackRec=ql462Ledger.append('ack',idem,{
   ...old.evidence,state:'SOURCE_REVIEW_ACCEPTED',referenceDigest:h(ack)});
  return {msg,ack,old,ackRec};
 }
 const a=makeSource('message_abc123456','idem_abc123456','c'.repeat(64));
 const event={schema:QL463_SCHEMA,eventId:'ql463_event_abc12345',
  effectKey:'ql463_effect_abc12345',sequence:0,parentEffectKey:'GENESIS',
  parentReceiptDigest:'0'.repeat(64),messageId:a.msg.messageId,
  idempotencyKey:a.msg.idempotencyKey,outboxDigest:a.old.digest,
  ackReceiptDigest:a.ackRec.digest,sourceId,targetAudience,protocol:'1.1',
  tenantId,workspaceId,sourceMainSha,bodyDigest:a.msg.bodyDigest,
  causalEpoch:'ql463_epoch_abc12345',action:'READ_ONLY_CAUSAL_REVIEW',
  issuedAt:iso(now-8000),expiresAt:iso(now+30000),
  authorityTransfer:false,runtimeConnected:false};
 const w={schema:'rosevear.ql463.master-causal-witness.v1',
  eventId:event.eventId,effectKey:event.effectKey,eventDigest:h(event),
  outboxDigest:event.outboxDigest,ackReceiptDigest:event.ackReceiptDigest,
  masterId:targetAudience,reviewDecision:'SOURCE_REVIEW_ONLY_KEEP_OPEN_HOLD',
  reviewedAt:iso(now-6000),incidentStatus:'OPEN_HOLD',authorityTransfer:false};
 const o={schema:'rosevear.ql463.owner-veto.v1',eventId:event.eventId,
  effectKey:event.effectKey,eventDigest:h(event),masterDigest:h(w),
  ownerId:'owner_source_abc12345',
  decision:'REVIEW_ONLY_NO_EXECUTION_KEEP_OPEN_HOLD',
  reviewedAt:iso(now-4000),incidentStatus:'OPEN_HOLD',authorityTransfer:false};
 const opts={ql462Ledger,causalLedger,event:enc(event,keys.source),
  masterWitness:enc(w,keys.master),ownerDecision:enc(o,keys.owner),
  signedOutbox:enc(a.msg,keys.source),signedAck:enc(a.ack,keys.master),
  sourcePin:keys.source.pin,masterPin:keys.master.pin,ownerPin:keys.owner.pin,
  expectedSourceSha:sourceMainSha,nowMs:now,readTrustedNowMs:()=>now};
 function resetWitness(){
  opts.masterWitness=enc({...opts.masterWitness.payload,
   eventId:opts.event.payload.eventId,effectKey:opts.event.payload.effectKey,
   eventDigest:h(opts.event.payload),
   outboxDigest:opts.event.payload.outboxDigest,
   ackReceiptDigest:opts.event.payload.ackReceiptDigest},keys.master);
  opts.ownerDecision=enc({...opts.ownerDecision.payload,
   eventId:opts.event.payload.eventId,effectKey:opts.event.payload.effectKey,
   eventDigest:h(opts.event.payload),
   masterDigest:h(opts.masterWitness.payload)},keys.owner);
 }
 function eventChange(changes){
  opts.event=enc({...opts.event.payload,...changes},keys.source);resetWitness();
 }
 function witnessChange(changes){
  opts.masterWitness=enc({...opts.masterWitness.payload,...changes},keys.master);
  opts.ownerDecision=enc({...opts.ownerDecision.payload,
   masterDigest:h(opts.masterWitness.payload)},keys.owner);
 }
 function ownerChange(changes){
  opts.ownerDecision=enc({...opts.ownerDecision.payload,...changes},keys.owner);
 }
 const host={schema:'rosevear.ql463.host-supervision-readiness.v1',
  originalHost:QL463_ORIGINAL_HOST,batchId:'ql463_host_batch_12345',
  hostIdentity:'ree_original_host_12345',observedAt:iso(now-2500),
  incidentStatus:'OPEN_HOLD',proposedController:'ai-data-platform',
  modules:QL463_MASTER_MODULES.map(moduleId=>({
   moduleId,serviceState:'UNVERIFIED_NOT_PROVISIONED',
   recoveryPlan:'OWNER_APPROVED_FUTURE_ONLY',
   startPermission:false,currentTelemetry:'NOT_CONNECTED'})),
  serviceInstallVerified:false,receiverActivationAuthorized:false,
  physicalReceiverOffVerified:false,serviceControlEnabled:false,
  networkReceiverEnabled:false,homeAutomationConnected:false,
  authorityTransfer:false};
 const run=()=>reconcileQl463SignedEvent(opts);
 return {root,now,keys,ql462Ledger,causalLedger,opts,host,run,
  eventChange,witnessChange,ownerChange,makeSource,
  cleanup:()=>rmSync(root,{recursive:true,force:true}),
  next(parent){
   const next=makeSource('message_next_abc12345','idem_next_abc12345','d'.repeat(64));
   eventChange({eventId:'ql463_event_next_abc12345',
    effectKey:'ql463_effect_next_abc12345',sequence:1,
    parentEffectKey:parent.effectKey,parentReceiptDigest:parent.reconciledDigest,
    messageId:next.msg.messageId,idempotencyKey:next.msg.idempotencyKey,
    outboxDigest:next.old.digest,ackReceiptDigest:next.ackRec.digest,
    bodyDigest:next.msg.bodyDigest});
   opts.signedOutbox=enc(next.msg,keys.source);
   opts.signedAck=enc(next.ack,keys.master);
   return next;
  }
 };
}
function denied(modify,reason){
 const f=fixture();
 try{
  modify(f);
  const r=f.run();
  assert.equal(r.state,'HOLD',JSON.stringify(r));
  assert.equal(r.reason,reason);
  assert.equal(r.runtimeConnected,false);
  assert.equal(r.activationAuthorized,false);
  assert.equal(r.effectExecuted,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL463 signed source, independent Master and owner causal event is durable OPEN/HOLD',()=>{
 const f=fixture();
 try{
  const r=f.run();assert.equal(r.state,'DURABLE_SIGNED_CAUSAL_REVIEW_ONLY',r.reason);
  assert.equal(r.effectExecuted,false);assert.equal(r.runtimeConnected,false);
  assert.equal(inspectQl463Effect(f.causalLedger,r.effectKey).state,
   'CAUSAL_REVIEW_ONLY_AWAITING_OWNER_GATE');
  assert.equal(f.run().reason,'QL463_REPLAY_OR_DUPLICATE_CAUSAL_EFFECT');
 }finally{f.cleanup();}
});
test('QL463 requires 3 independent Ed25519 signers and rejects forged/replayed sources',()=>{
 denied(f=>{f.opts.ownerPin=f.keys.master.pin},
  'QL463_THREE_INDEPENDENT_SIGNATURES_REQUIRED');
 denied(f=>{f.opts.event.signature='A'.repeat(88)},
  'QL463_THREE_INDEPENDENT_SIGNATURES_REQUIRED');
 denied(f=>{f.opts.signedAck.signature='A'.repeat(88)},
  'QL463_THREE_INDEPENDENT_SIGNATURES_REQUIRED');
 denied(f=>{f.opts.masterWitness.signature='A'.repeat(88)},
  'QL463_THREE_INDEPENDENT_SIGNATURES_REQUIRED');
});
test('QL463 reject owner veto, Master witness escalation and fake CONNECTED',()=>{
 denied(f=>f.ownerChange({decision:'AUTHORIZE_EXECUTION'}),
  'QL463_MASTER_OR_OWNER_VETO_DENIED');
 denied(f=>f.witnessChange({reviewDecision:'CLOSE_INCIDENT'}),
  'QL463_MASTER_OR_OWNER_VETO_DENIED');
 denied(f=>f.eventChange({runtimeConnected:true}),
  'QL463_EVENT_SCOPE_CLOCK_OR_IDENTITY_DENIED');
 denied(f=>f.eventChange({action:'OWNER_CEREMONY'}),
  'QL463_EVENT_SCOPE_CLOCK_OR_IDENTITY_DENIED');
 denied(f=>f.eventChange({sourceMainSha:'f'.repeat(40)}),
  'QL463_EVENT_SCOPE_CLOCK_OR_IDENTITY_DENIED');
});
test('QL463 require cryptographically verifiable matching QL462 outbox and signed ACK custody',()=>{
 denied(f=>f.eventChange({ackReceiptDigest:'a'.repeat(64)}),
  'QL463_QL462_ACK_CUSTODY_UNTRUSTED');
 denied(f=>f.eventChange({bodyDigest:'f'.repeat(64)}),
  'QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
 denied(f=>{f.opts.signedAck=enc({...f.opts.signedAck.payload,
  runtimeConnection:'CONNECTED'},f.keys.master)},
  'QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
 denied(f=>{f.opts.signedOutbox=enc({...f.opts.signedOutbox.payload,
  sourceRepository:'iCamp'},f.keys.source)},
  'QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
 denied(f=>{f.opts.signedOutbox=enc({...f.opts.signedOutbox.payload,
  bodyDigest:'f'.repeat(64)},f.keys.source)},
  'QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
 denied(f=>{f.opts.signedAck=enc({...f.opts.signedAck.payload,
  reviewState:'SOURCE_REVIEW_DENIED'},f.keys.master)},
  'QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
});
test('QL463 tenant/workspace mismatch against prior lineage, source and signed outbox deny',()=>{
 denied(f=>f.eventChange({workspaceId:'other_workspace_abc123'}),
  'QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
 denied(f=>f.eventChange({tenantId:'other_tenant_abc123'}),
  'QL463_SIGNED_QL462_SOURCE_OR_ACK_MISMATCH');
 denied(f=>f.eventChange({sequence:1,parentEffectKey:'random_parent_abc123',
  parentReceiptDigest:'f'.repeat(64)}),
  'QL463_PARENT_CAUSAL_CHAIN_TENANT_OR_ORDER_DENIED');
 denied(f=>f.eventChange({parentEffectKey:'a'.repeat(14)}),
  'QL463_GENESIS_CAUSAL_ROOT_INVALID');
});
test('QL463 same original message or same event ID cannot be re-signed under a new effect key',()=>{
 const f=fixture();
 try{
  const original=f.run();assert.equal(original.state,'DURABLE_SIGNED_CAUSAL_REVIEW_ONLY');
  f.eventChange({eventId:'another_event_abc12345',
   effectKey:'another_effect_abc12345'});
  assert.equal(f.run().reason,'QL463_REPLAY_OR_DUPLICATE_CAUSAL_EFFECT');
  f.eventChange({eventId:'ql463_event_abc12345',
   effectKey:'new_effect_abc12345'});
  assert.equal(f.run().reason,'QL463_REPLAY_OR_DUPLICATE_CAUSAL_EFFECT');
 }finally{f.cleanup();}
});
test('QL463 signed linked parent receipt enforces contiguous monotonic causal chain',()=>{
 const f=fixture();
 try{
  const first=f.run();assert.equal(first.state,'DURABLE_SIGNED_CAUSAL_REVIEW_ONLY');
  f.next(first);
  let r=f.run();assert.equal(r.state,'DURABLE_SIGNED_CAUSAL_REVIEW_ONLY',r.reason);
  assert.equal(r.sequence,1);
  assert.equal(f.run().reason,'QL463_REPLAY_OR_DUPLICATE_CAUSAL_EFFECT');
 }finally{f.cleanup();}
});
test('QL463 rechecks trusted clock and refuses expiry between initial review and durable commit',()=>{
 denied(f=>{f.opts.readTrustedNowMs=()=>f.now-1;},
  'QL463_COMMIT_TRUSTED_CLOCK_OR_CUSTODY_CHANGED');
 denied(f=>{f.opts.readTrustedNowMs=()=>f.now+40000;},
  'QL463_COMMIT_TRUSTED_CLOCK_OR_CUSTODY_CHANGED');
 denied(f=>f.eventChange({expiresAt:iso(f.now-1)}),
  'QL463_EVENT_SCOPE_CLOCK_OR_IDENTITY_DENIED');
});
test('QL463 exactly-once effect is a durable NOOP claim, never a remote effect',()=>{
 const f=fixture();
 try{
  const r=f.run();
  const args={causalLedger:f.causalLedger,effectKey:r.effectKey,
   reconciledDigest:r.reconciledDigest,readTrustedNowMs:()=>f.now,
   clockAttested:true,hostReceiverIsolated:true,ownerGated:true};
  const claim=claimQl463ExactlyOnceEffect(args);
  assert.equal(claim.state,'DURABLE_NOOP_EFFECT_CLAIM_ONLY',claim.reason);
  assert.equal(claim.effectExecuted,false);assert.equal(claim.runtimeConnected,false);
  assert.equal(inspectQl463Effect(f.causalLedger,r.effectKey).state,
   'NOOP_EFFECT_CLAIMED_NO_EXECUTION');
  assert.equal(claimQl463ExactlyOnceEffect(args).reason,
   'QL463_REPLAY_WRONG_CAUSAL_DIGEST_OR_ALREADY_CLAIMED');
 }finally{f.cleanup();}
});
test('QL463 deny wrong digest, absent host isolation, no owner signoff and corrupt file',()=>{
 const f=fixture();
 try{
  const r=f.run();
  const args={causalLedger:f.causalLedger,effectKey:r.effectKey,
   reconciledDigest:r.reconciledDigest,readTrustedNowMs:()=>f.now,
   clockAttested:true,hostReceiverIsolated:true,ownerGated:true};
  assert.equal(claimQl463ExactlyOnceEffect({...args,
   reconciledDigest:'f'.repeat(64)}).state,'HOLD');
  assert.equal(claimQl463ExactlyOnceEffect({...args,ownerGated:false}).state,'HOLD');
  assert.equal(claimQl463ExactlyOnceEffect({...args,
   hostReceiverIsolated:false}).state,'HOLD');
  const path=join(f.root,'causal','ql463-reconciled-'+r.effectKey+'.json');
  writeFileSync(path,'{}');
  assert.equal(inspectQl463Effect(f.causalLedger,r.effectKey).state,'HOLD');
  assert.equal(claimQl463ExactlyOnceEffect(args).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl463CausalLedger('relative'),/ABSOLUTE_PRIVATE/);
});
test('QL463 original Windows host signed readiness stays NOT INSTALLED and never asserts physical OFF',()=>{
 const f=fixture();
 try{
  const r=assessQl463OriginalHostReadiness({
   report:enc(f.host,f.keys.observer),hostObserverPin:f.keys.observer.pin,
   nowMs:f.now});
  assert.equal(r.state,'SIGNED_HOST_SUPERVISION_PLAN_REVIEW_ONLY',r.reason);
  assert.equal(r.hostServiceInstalled,false);assert.equal(r.runtimeConnected,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(r.independentWindowsInstallNeeded,true);
  assert.equal(r.moduleCount,3);
 }finally{f.cleanup();}
});
test('QL463 host readiness signature, host ID, service activation, fake health, older witness deny',()=>{
 const f=fixture();
 try{
  const bad=[{...f.host,originalHost:'DIFFERENT_PC'},
   {...f.host,networkReceiverEnabled:true},
   {...f.host,receiverActivationAuthorized:true},
   {...f.host,homeAutomationConnected:true},
   {...f.host,physicalReceiverOffVerified:true},
   {...f.host,modules:f.host.modules.map((m,i)=>i===1?{...m,currentTelemetry:'GREEN'}:m)},
   {...f.host,observedAt:iso(f.now-80000)}];
  for(const b of bad){
   const r=assessQl463OriginalHostReadiness({
    report:enc(b,f.keys.observer),hostObserverPin:f.keys.observer.pin,nowMs:f.now});
   assert.equal(r.state,'HOLD',r.reason);
   assert.equal(r.activationAuthorized,false);
  }
  assert.equal(assessQl463OriginalHostReadiness({
   report:enc(f.host,key()),hostObserverPin:f.keys.observer.pin,
   nowMs:f.now}).state,'HOLD');
 }finally{f.cleanup();}
});
