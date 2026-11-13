import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl444ProtectedClosureLedger} from './ql444-off-continuity-incident-closure.mjs';
import {openQl445PostClosureLedger,readQl445Continuity,
 runQl445PostClosureStability} from './ql445-postclosure-off-stability.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({type:'spki',format:'der'}).toString('base64')}};
const signed=(payload,k)=>({payload,
 signature:sign(null,Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const iso=x=>new Date(x).toISOString();
const id='incident_ql445_1234567';

function fixture({recurrence=false,remediated=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql445-')),now=Date.now()-1000;
 const ql444Ledger=openQl444ProtectedClosureLedger(join(root,'ql444'));
 const watchLedger=openQl445PostClosureLedger(join(root,'ql445'));
 const oldPending=ql444Ledger.claimOnce('pending',id,'a'.repeat(64));
 const fix=remediated?ql444Ledger.claimOnce('remediation',id,'b'.repeat(64)):null;
 const oldClosed=ql444Ledger.claimOnce('closed',id,'c'.repeat(64));
 const s={state:remediated?'DURABLE_QL444_REMEDIATED_LEASE_EXCEPTION_EVIDENCE_CLOSED':
  'DURABLE_QL444_WITNESSED_OFF_INCIDENT_EVIDENCE_CLOSED',
  connection:'HOLD',activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  masterCount:3,originalIncidentId:id,watchId:'watch_ql444_123456',
  continuityNonce:'nonce_ql444_123456',leaseExceptionRemediated:remediated,
  watchOneDigest:'1'.repeat(64),watchTwoDigest:'2'.repeat(64),
  masterReportsDigest:'3'.repeat(64),pendingReceiptDigest:oldPending.recordDigest,
  remediationReceiptDigest:fix?.recordDigest??null,
  closureReceiptDigest:oldClosed.recordDigest};
 const keys={source:key(),host:key(),observer:key(),owner:key(),reviewer:key(),
  masters:Object.fromEntries(MASTERS.map(x=>[x,key()]))};
 const watchId='watch_ql445_abcdef',watchNonce='nonce_ql445_abcdef';
 const source={schema:'rosevear.ql445.original-comms-ql444-source.v1',
  incidentId:id,ql444SummaryDigest:hash(s),ql444ClosureReceiptDigest:s.closureReceiptDigest,
  previousOffDigest:s.watchTwoDigest,observedAt:iso(now-10000)};
 const host1={schema:'rosevear.ql445.original-host-postclosure-probe.v1',
  incidentId:id,watchId,watchNonce,sampleIndex:1,originalHostId:'DESKTOP-AE894KC',
  ql444SummaryDigest:hash(s),previousOffDigest:s.watchTwoDigest,
  receiverState:'OFF',watchdogArmed:true,hostSequence:100,observedAt:iso(now-8000)};
 const witness1={schema:'rosevear.ql445.independent-postclosure-observation.v1',
  incidentId:id,watchId,watchNonce,sampleIndex:1,ql444SummaryDigest:hash(s),
  signedHostProbeDigest:hash(host1),previousOffDigest:s.watchTwoDigest,
  receiverState:'OFF',observerSequence:101,observedAt:iso(now-7000)};
 const host2={...host1,sampleIndex:2,previousOffDigest:hash(witness1),
  receiverState:recurrence?'ON':'OFF',hostSequence:102,observedAt:iso(now-4000)};
 const witness2={...witness1,sampleIndex:2,signedHostProbeDigest:hash(host2),
  previousOffDigest:hash(witness1),receiverState:recurrence?'ON':'OFF',
  observerSequence:103,observedAt:iso(now-3000)};
 const classification=recurrence?'SIGNED_ON_RECURRENCE_REOPEN':
  'RECONCILED_HISTORICAL_OFF_STABILITY_ONLY';
 const decision=recurrence?'REOPEN_POSTCLOSURE_RECEIVER_INCIDENT_KEEP_HOLD':
  'ACCEPT_OFF_STABILITY_EVIDENCE_ONLY_NO_CONNECT';
 const watchDigest=hash({ql444SummaryDigest:hash(s),watchNonce,watchId,
  hosts:[host1,host2].map(hash),observers:[witness1,witness2].map(hash),classification});
 const masters=MASTERS.map(masterId=>({
  schema:'rosevear.ql445.three-master-stability-review.v1',
  incidentId:id,masterId,ql444ClosureReceiptDigest:s.closureReceiptDigest,
  postClosureWatchDigest:watchDigest,classification,decision,reviewedAt:iso(now-2000)}));
 const owner={schema:'rosevear.ql445.two-owner-postclosure-stability-decision.v1',
  incidentId:id,sourceOwnerId:'Ree_Original',masterOwnerId:'Jack_Independent',
  ql444ClosureReceiptDigest:s.closureReceiptDigest,postClosureWatchDigest:watchDigest,
  masterReportsDigest:hash(masters),classification,decision,reviewedAt:iso(now-1200)};
 const envelopes={source:signed(source,keys.source),
  hosts:[signed(host1,keys.host),signed(host2,keys.host)],
  observers:[signed(witness1,keys.observer),signed(witness2,keys.observer)],
  masters:masters.map(m=>signed(m,keys.masters[m.masterId])),
  owner:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.reviewer).signature}};
 const calls={source:0,hosts:0,witnesses:0,masters:0};
 const args={ql444Summary:s,ql444Ledger,watchLedger,watchNonce,watchId,
  originalCommsSourceProvider:{readSignedQl444Source:async()=>{calls.source++;return envelopes.source;}},
  originalHostProvider:{readSignedPostClosureProbes:async()=>{calls.hosts++;return envelopes.hosts;}},
  independentObserverProvider:{readSignedPostClosureObservations:async()=>{calls.witnesses++;return envelopes.observers;}},
  threeMasterProvider:{readSignedPostClosureDecisions:async()=>{calls.masters++;return envelopes.masters;}},
  finalOwnerDecision:envelopes.owner};
 const o={nowMs:now,protectedOriginalHostSession:true,trustedClockVerified:true,
  independentQl444CustodyVerified:true,twoOwnerIdentityVerified:true,
  pinsIndependentlyVerified:true,commsSourcePin:keys.source.pin,
  originalHostPin:keys.host.pin,independentObserverPin:keys.observer.pin,
  sourceOwnerPin:keys.owner.pin,masterOwnerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,now,args,o,keys,s,source,host1,host2,witness1,witness2,watchDigest,
  masters,owner,envelopes,watchLedger,ql444Ledger,calls,
  run:()=>runQl445PostClosureStability(args,o),
  reSignOwner(x){envelopes.owner={payload:x,
   sourceOwnerSignature:signed(x,keys.owner).signature,
   masterOwnerSignature:signed(x,keys.reviewer).signature};
   args.finalOwnerDecision=envelopes.owner;},
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}

async function rejects(mutate,reason,options={}){
 const f=fixture(options);try{
  mutate(f);const r=await f.run();
  assert.equal(r.state,'HOLD',reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(r.manualIsolationAndIndependentOffRequired,true);
 }finally{f.cleanup();}
}
test('QL445 two independently signed OFF readings -> durable historical stability, never live connected',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL445_POSTCLOSURE_OFF_STABILITY_EVIDENCE_ADMITTED');
  assert.equal(r.recurrenceDetected,false);assert.equal(r.masterCount,3);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl445Continuity(f.watchLedger,id).state,
   'QL445_DURABLE_POSTCLOSURE_OFF_EVIDENCE_ONLY');
  assert.equal((await f.run()).reason,'QL445_WATCH_ALREADY_ATTEMPTED_NO_REPLAY');
  assert.equal(f.calls.source,1);
 }finally{f.cleanup();}
});
test('QL445 both sign a post-closure ON recurrence -> durable open safety case, never activation',async()=>{
 const f=fixture({recurrence:true,remediated:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL445_SIGNED_ON_RECURRENCE_INCIDENT_OPEN');
  assert.equal(r.recurrenceDetected,true);
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_RECURRENCE_REOPEN_ONLY');
  assert.equal(r.activationAuthorized,false);assert.equal(r.connection,'HOLD');
  assert.equal(readQl445Continuity(f.watchLedger,id).state,
   'QL445_DURABLE_POSTCLOSURE_RECURRENCE_CASE_OPEN');
 }finally{f.cleanup();}
});
test('QL445 remediated late lease can receive OFF-only post-closure review without activation',async()=>{
 const f=fixture({remediated:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL445_POSTCLOSURE_OFF_STABILITY_EVIDENCE_ADMITTED');
  assert.equal(r.activationAuthorized,false);
 }finally{f.cleanup();}
});
test('QL445 exact QL444 custody, original session and new nonce are prerequisites',async()=>{
 await rejects(f=>{f.o.trustedClockVerified=false;},'QL445_EXACT_QL444_CLOSURE_AND_NEW_WATCH_REQUIRED');
 await rejects(f=>{f.s.closureReceiptDigest='0'.repeat(64);},'QL445_EXACT_QL444_CLOSURE_AND_NEW_WATCH_REQUIRED');
 await rejects(f=>{f.args.watchNonce=f.s.continuityNonce;},'QL445_EXACT_QL444_CLOSURE_AND_NEW_WATCH_REQUIRED');
 await rejects(f=>{f.args.watchId=f.s.watchId;},'QL445_EXACT_QL444_CLOSURE_AND_NEW_WATCH_REQUIRED');
 await rejects(f=>{f.o.originalHostPin=f.o.independentObserverPin;},'QL445_DISTINCT_PINNED_SIGNER_CUSTODY_REQUIRED');
});
test('QL445 original signed Comms source exact custody and staleness are checked',async()=>{
 await rejects(f=>{f.envelopes.source.payload.ql444SummaryDigest='0'.repeat(64);},'QL445_QL444_SIGNED_SOURCE_CUSTODY_INVALID');
 await rejects(f=>{f.envelopes.source=signed({...f.source,observedAt:iso(f.now-65000)},f.keys.source);},'QL445_QL444_SIGNED_SOURCE_CUSTODY_INVALID');
 await rejects(f=>{f.args.originalCommsSourceProvider.readSignedQl444Source=async()=>{throw Error('off');};},'QL445_ORIGINAL_COMMS_SOURCE_UNAVAILABLE');
});
test('QL445 rejects unarmed, ON-disguised, non-original, regressed host proof',async()=>{
 await rejects(f=>{f.envelopes.hosts[0]=signed({...f.host1,originalHostId:'TEMPLAR'},f.keys.host);},'QL445_SIGNED_ORIGINAL_HOST_POSTCLOSURE_PROBE_INVALID');
 await rejects(f=>{f.envelopes.hosts[0]=signed({...f.host1,watchdogArmed:false},f.keys.host);},'QL445_SIGNED_ORIGINAL_HOST_POSTCLOSURE_PROBE_INVALID');
 await rejects(f=>{f.envelopes.hosts[0]=signed({...f.host1,hostSequence:0},f.keys.host);},'QL445_SIGNED_ORIGINAL_HOST_POSTCLOSURE_PROBE_INVALID');
 await rejects(f=>{f.envelopes.hosts[0]=signed({...f.host1,watchNonce:'wrong_nonce_123456'},f.keys.host);},'QL445_SIGNED_ORIGINAL_HOST_POSTCLOSURE_PROBE_INVALID');
});
test('QL445 requires two fresh signed independent observations with hash-linked monotonic order',async()=>{
 await rejects(f=>{f.envelopes.observers.pop();},'QL445_TWO_RECONCILED_POSTCLOSURE_ATTESTATIONS_REQUIRED');
 await rejects(f=>{f.envelopes.observers[1]=signed({...f.witness2,previousOffDigest:'0'.repeat(64)},f.keys.observer);},'QL445_INDEPENDENT_SIGNED_POSTCLOSURE_OFF_INVALID');
 await rejects(f=>{f.envelopes.observers[1]=signed({...f.witness2,observerSequence:101},f.keys.observer);},'QL445_INDEPENDENT_SIGNED_POSTCLOSURE_OFF_INVALID');
 await rejects(f=>{f.envelopes.observers[1]=signed({...f.witness2,observedAt:iso(f.now-65000)},f.keys.observer);},'QL445_INDEPENDENT_SIGNED_POSTCLOSURE_OFF_INVALID');
 await rejects(f=>{f.envelopes.observers[0]=signed({...f.witness1,signedHostProbeDigest:'0'.repeat(64)},f.keys.observer);},'QL445_INDEPENDENT_SIGNED_POSTCLOSURE_OFF_INVALID');
});
test('QL445 host OFF and independent ON divergence cannot pass as stable',async()=>{
 await rejects(f=>{f.envelopes.observers[0]=signed({...f.witness1,receiverState:'ON'},f.keys.observer);},'QL445_DIVERGENT_SIGNED_STATES_POTENTIAL_RECURRENCE');
});
test('QL445 three Masters must uniquely consent to exact stable/recurrence classification',async()=>{
 await rejects(f=>{f.envelopes.masters.pop();},'QL445_THREE_DISTINCT_MASTER_STABILITY_VOTES_REQUIRED');
 await rejects(f=>{f.envelopes.masters[1]=f.envelopes.masters[0];},'QL445_THREE_MASTER_SIGNED_STABILITY_DECISION_REJECTED');
 await rejects(f=>{f.envelopes.masters[0]=signed({...f.masters[0],decision:'CONNECT_NOW'},f.keys.masters[MASTERS[0]]);},'QL445_THREE_MASTER_SIGNED_STABILITY_DECISION_REJECTED');
 await rejects(f=>{f.envelopes.masters[0]=signed({...f.masters[0],postClosureWatchDigest:'0'.repeat(64)},f.keys.masters[MASTERS[0]]);},'QL445_THREE_MASTER_SIGNED_STABILITY_DECISION_REJECTED');
});
test('QL445 two separately signed owners cannot merge identities or authorize CONNECTED',async()=>{
 await rejects(f=>{f.reSignOwner({...f.owner,decision:'CONNECTED'});},'QL445_TWO_INDEPENDENT_OWNER_STABILITY_DECISION_REJECTED');
 await rejects(f=>{f.reSignOwner({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},'QL445_TWO_INDEPENDENT_OWNER_STABILITY_DECISION_REJECTED');
 await rejects(f=>{f.args.finalOwnerDecision.masterOwnerSignature=f.args.finalOwnerDecision.sourceOwnerSignature;},'QL445_TWO_INDEPENDENT_OWNER_STABILITY_DECISION_REJECTED');
});
test('QL445 interrupted source call burns one-use pending and keeps incident HOLD',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl444Source=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL445_ORIGINAL_COMMS_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL445_WATCH_ALREADY_ATTEMPTED_NO_REPLAY');
  assert.equal(readQl445Continuity(f.watchLedger,id).reason,'QL445_PENDING_NONREPLAYABLE');
 }finally{f.cleanup();}
});
test('QL445 rejects tampered private custody and relative directories',async()=>{
 const f=fixture();try{
  f.watchLedger.claimOnce('pending',id,'a'.repeat(64));
  writeFileSync(join(f.root,'ql445','ql445-pending-'+id+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL445_WATCH_CUSTODY_UNREADABLE');
  assert.equal(readQl445Continuity(f.watchLedger,id).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl445PostClosureLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
