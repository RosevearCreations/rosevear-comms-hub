import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl449DispositionLedger} from './ql449-anchored-incident-disposition.mjs';
import {openQl450StabilityLedger,readQl450Stability,
 runQl450StabilityReview} from './ql450-off-stability-closure-boundary.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const id='ql450_original_incident_123456';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return {
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});

function fixture({hostOn=false,observerOn=false,lock=true,lease=true,
 watchdog=true,observerIsolation=true}={}){
 const now=Date.now()-500,root=mkdtempSync(join(tmpdir(),'ql450-'));
 const ql449Ledger=openQl449DispositionLedger(join(root,'ql449'));
 const stabilityLedger=openQl450StabilityLedger(join(root,'ql450'));
 const p=ql449Ledger.claimOnce('pending',id,'a'.repeat(64));
 const review=ql449Ledger.claimOnce('review',id,'b'.repeat(64));
 const prior={state:'DURABLE_QL449_ANCHORED_OFF_DISPOSITION_REVIEW_ONLY',
  classification:'SIGNED_ANCHORED_HISTORICAL_OFF_REVIEW_ONLY',
  dispositionDecision:'ADMIT_EVIDENCE_ONLY_KEEP_INCIDENT_OPEN_HOLD',
  connection:'HOLD',activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  closureAuthorized:false,incidentStatus:'OPEN',masterCount:3,
  originalIncidentId:id,ceremonyId:'ql449_ceremony_abc12345',
  challengeNonce:'ql449_nonce_abcde12345',
  ownerAcceptance:'DUAL_SIGNED_HISTORICAL_DISPOSITION_ONLY_OPEN_HOLD',
  anchoredOffDigest:'c'.repeat(64),masterReportsDigest:'d'.repeat(64),
  pendingReceiptDigest:p.recordDigest,dispositionReceiptDigest:review.recordDigest};
 const reviewId='ql450_stability_abc12345',challengeNonce='ql450_nonce_abcde12345';
 const keys={source:key(),anchor:key(),host:key(),observer:key(),boundary:key(),
  owner:key(),secondOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql450.original-ql449-source.v1',incidentId:id,
  ql449SummaryDigest:hash(prior),ql449ReceiptDigest:review.recordDigest,
  ql449AnchoredOffDigest:prior.anchoredOffDigest,incidentStatus:'OPEN_HOLD',
  observedAt:iso(now-55000)};
 const anchor={schema:'rosevear.ql450.independent-ql449-anchor-readback.v1',
  incidentId:id,reviewId,challengeNonce,ql449ReceiptDigest:review.recordDigest,
  sourceDigest:hash(source),anchorId:'ql450_independent_anchor_1234',
  anchorSequence:99,anchorStatus:'ANCHORED_HISTORY_ONLY_NO_CLOSURE',
  observedAt:iso(now-54000)};
 const hosts=[],witnesses=[];
 let previousDigest=hash(anchor),previousSeq=99;
 for(let i=0;i<3;i++){
  const host={schema:'rosevear.ql450.original-host-off-stability.v1',
   incidentId:id,reviewId,challengeNonce,horizon:['SHORT','MEDIUM','LONG'][i],
   sampleIndex:i+1,originalHostId:'DESKTOP-AE894KC',
   ql449ReceiptDigest:review.recordDigest,independentAnchorDigest:hash(anchor),
   previousDigest,receiverState:hostOn&&i===1?'ON':'OFF',
   isolationLock:lock,leaseRevoked:lease,watchdogArmed:watchdog,
   hostSequence:previousSeq+1,observedAt:iso(now+[-51000,-39000,-18000][i])};
  const witness={schema:'rosevear.ql450.independent-off-stability-witness.v1',
   incidentId:id,reviewId,challengeNonce,horizon:host.horizon,
   sampleIndex:i+1,ql449ReceiptDigest:review.recordDigest,
   independentAnchorDigest:hash(anchor),signedHostDigest:hash(host),
   previousDigest,receiverState:observerOn&&i===2?'ON':host.receiverState,
   isolationConfirmed:observerIsolation,observerSequence:host.hostSequence+1,
   observedAt:iso(now+[-50000,-38000,-17000][i])};
  hosts.push(host);witnesses.push(witness);
  previousSeq=witness.observerSequence;previousDigest=hash(witness);
 }
 const safe=!hostOn&&!observerOn&&lock&&lease&&watchdog&&observerIsolation;
 const classification=safe?'SIGNED_HISTORICAL_POST_DISPOSITION_OFF_STABLE_OPEN':
  'SIGNED_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN';
 const recurrenceDecision=safe?'HISTORICAL_STABILITY_KEEP_INCIDENT_OPEN_HOLD':
  'ESCALATE_SIGNED_RECURRENCE_KEEP_INCIDENT_OPEN_HOLD';
 const stabilityDigest=hash({ql449SummaryDigest:hash(prior),reviewId,challengeNonce,
  sourceDigest:hash(source),anchorDigest:hash(anchor),
  hostDigests:hosts.map(hash),witnessDigests:witnesses.map(hash),classification});
 const boundary={schema:'rosevear.ql450.independent-closure-boundary.v1',
  incidentId:id,reviewId,ql449ReceiptDigest:review.recordDigest,
  stabilityDigest,classification,closureAuthorized:false,activationAuthorized:false,
  physicalReceiverCurrentlyOff:false,incidentStatus:'OPEN_HOLD',
  authorityBoundary:'SEPARATE_OWNER_CEREMONY_REQUIRED_NO_AUTOMATIC_CLOSURE',
  attestedAt:iso(now-14000)};
 const boundaryDigest=hash(boundary);
 const votes=MASTERS.map(masterId=>({schema:'rosevear.ql450.three-master-recurrence-prevention.v1',
  incidentId:id,reviewId,masterId,ql449ReceiptDigest:review.recordDigest,
  stabilityDigest,boundaryDigest,classification,recurrenceDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-11000)}));
 const owner={schema:'rosevear.ql450.dual-owner-recurrence-continuity.v1',
  incidentId:id,reviewId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql449ReceiptDigest:review.recordDigest,stabilityDigest,boundaryDigest,
  masterReportsDigest:hash(votes),classification,recurrenceDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-9000)};
 const envelopes={source:signed(source,keys.source),anchor:signed(anchor,keys.anchor),
  hosts:hosts.map(h=>signed(h,keys.host)),
  witnesses:witnesses.map(w=>signed(w,keys.observer)),
  boundary:signed(boundary,keys.boundary),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.secondOwner).signature}};
 const calls={source:0,anchor:0,hosts:0,witnesses:0,boundary:0,masters:0};
 const args={ql449Summary:prior,ql449Ledger,stabilityLedger,reviewId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl449Disposition:async()=>{calls.source++;return envelopes.source;}},
  independentAnchorProvider:{readSignedQl449AnchorReadback:async()=>{calls.anchor++;return envelopes.anchor;}},
  originalHostProvider:{readSignedOffStabilitySamples:async()=>{calls.hosts++;return envelopes.hosts;}},
  independentObserverProvider:{readSignedOffStabilityWitnesses:async()=>{calls.witnesses++;return envelopes.witnesses;}},
  independentBoundaryProvider:{readSignedClosureAuthorityBoundary:async()=>{calls.boundary++;return envelopes.boundary;}},
  threeMasterProvider:{readSignedRecurrencePreventionVotes:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owners};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl449CustodyVerified:true,separateOwnerRolesVerified:true,
  independentSignerPinsVerified:true,commsSourcePin:keys.source.pin,
  independentAnchorPin:keys.anchor.pin,originalHostPin:keys.host.pin,
  independentObserverPin:keys.observer.pin,boundaryAuthorityPin:keys.boundary.pin,
  sourceOwnerPin:keys.owner.pin,masterOwnerPin:keys.secondOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,now,prior,ql449Ledger,stabilityLedger,reviewId,challengeNonce,
  source,anchor,hosts,witnesses,boundary,votes,owner,keys,envelopes,args,opts,calls,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.owner).signature,
   masterOwnerSignature:signed(v,keys.secondOwner).signature};},
  run:()=>runQl450StabilityReview(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(change,reason,config={}){
 const f=fixture(config);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.activationAuthorized,false);assert.equal(r.closureAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL450 signed post-disposition SHORT/MEDIUM/LONG OFF + authority boundary admits only historical review',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL450_POST_DISPOSITION_OFF_STABLE_REVIEW_ONLY');
  assert.equal(r.masterCount,3);assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.connection,'HOLD');assert.equal(r.closureAuthorized,false);
  assert.equal(r.activationAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl450Stability(f.stabilityLedger,id).state,
   'QL450_DURABLE_HISTORICAL_OFF_STABILITY_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL450_ONE_USE_STABILITY_REVIEW_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,anchor:1,hosts:1,witnesses:1,boundary:1,masters:1});
 }finally{f.cleanup();}
});
test('QL450 signed ON, witness divergence, isolation/lease/watchdog failure escalates recurrence OPEN/HOLD',async()=>{
 for(const options of [{hostOn:true},{observerOn:true},{lock:false},{lease:false},
  {watchdog:false},{observerIsolation:false}]){
  const f=fixture(options);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL450_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN');
   assert.equal(r.incidentStatus,'OPEN');assert.equal(r.closureAuthorized,false);
   assert.equal(readQl450Stability(f.stabilityLedger,id).state,
    'QL450_DURABLE_OFF_RECURRENCE_EXCEPTION_ESCALATED');
  }finally{f.cleanup();}
 }
});
test('QL450 rejects unmatched QL449 result, missing private receipt, closed source and reused nonce',async()=>{
 await rejected(f=>{f.prior.state='DURABLE_QL449_SIGNED_OFF_REATTESTATION_EXCEPTION_OPEN';},
  'QL450_EXACT_OPEN_QL449_DISPOSITION_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.dispositionReceiptDigest='f'.repeat(64);},
  'QL450_EXACT_OPEN_QL449_DISPOSITION_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL450_EXACT_OPEN_QL449_DISPOSITION_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL450_EXACT_OPEN_QL449_DISPOSITION_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.independentObserverPin=f.opts.originalHostPin;},
  'QL450_ALL_TEN_DISTINCT_PINNED_SIGNERS_REQUIRED');
});
test('QL450 original Comms incident and anchored QL449 readback require separate fresh signatures',async()=>{
 await rejected(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL450_SIGNED_ORIGINAL_DISPOSITION_SOURCE_INVALID');
 await rejected(f=>{f.envelopes.source=signed({...f.source,
  observedAt:iso(f.now-65000)},f.keys.source);},
  'QL450_SIGNED_ORIGINAL_DISPOSITION_SOURCE_INVALID');
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  anchorStatus:'CURRENT_RECEIVER_OFF'},f.keys.anchor);},
  'QL450_INDEPENDENT_ANCHOR_SIGNED_MISMATCH');
 await rejected(f=>{f.envelopes.anchor.signature=f.envelopes.source.signature;},
  'QL450_INDEPENDENT_ANCHOR_SIGNED_MISMATCH');
 await rejected(f=>{f.args.independentAnchorProvider.readSignedQl449AnchorReadback=
  async()=>{throw Error('offline');};},'QL450_INDEPENDENT_Q449_ANCHOR_UNAVAILABLE');
});
test('QL450 enforces original Windows host, signature chains, monotonic sequences and >=10/30s horizons',async()=>{
 await rejected(f=>{f.envelopes.hosts[0]=signed({...f.hosts[0],
  originalHostId:'TEMPLAR'},f.keys.host);},
  'QL450_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],
  hostSequence:100},f.keys.host);},'QL450_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],
  observedAt:iso(f.now-45001)},f.keys.host);},
  'QL450_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[2]=signed({...f.hosts[2],
  observedAt:iso(f.now-21001)},f.keys.host);},
  'QL450_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts.pop();},
  'QL450_THREE_SEPARATE_SIGNED_HORIZONS_REQUIRED');
});
test('QL450 independent observer must bind exact original host hash, evidence chain and fresh sequence',async()=>{
 await rejected(f=>{f.envelopes.witnesses[0]=signed({...f.witnesses[0],
  signedHostDigest:'f'.repeat(64)},f.keys.observer);},
  'QL450_INDEPENDENT_SIGNED_WITNESS_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.witnesses[1]=signed({...f.witnesses[1],
  observerSequence:102},f.keys.observer);},
  'QL450_INDEPENDENT_SIGNED_WITNESS_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.witnesses[2].signature=f.envelopes.hosts[2].signature;},
  'QL450_INDEPENDENT_SIGNED_WITNESS_HORIZON_INVALID');
});
test('QL450 independent signed closure authority must explicitly veto connection, closure and live OFF claim',async()=>{
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  closureAuthorized:true},f.keys.boundary);},'QL450_INDEPENDENT_BOUNDARY_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  activationAuthorized:true},f.keys.boundary);},'QL450_INDEPENDENT_BOUNDARY_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  physicalReceiverCurrentlyOff:true},f.keys.boundary);},
  'QL450_INDEPENDENT_BOUNDARY_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary.signature=f.envelopes.anchor.signature;},
  'QL450_INDEPENDENT_BOUNDARY_AUTHORITY_VETO');
});
test('QL450 all three independent Master recurrence votes must bind exact boundary and OPEN/HOLD',async()=>{
 await rejected(f=>{f.envelopes.votes.pop();},
  'QL450_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 await rejected(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL450_THREE_MASTER_RECURRENCE_VETO');
 await rejected(f=>{f.envelopes.votes[2]=signed({...f.votes[2],
  recurrenceDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL450_THREE_MASTER_RECURRENCE_VETO');
});
test('QL450 dual independent owners cannot bypass closure boundary or change signed classification',async()=>{
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL450_DUAL_OWNER_CONTINUITY_VETO');
 await rejected(f=>{f.setOwners({...f.owner,recurrenceDecision:'ACTIVATE'});},
  'QL450_DUAL_OWNER_CONTINUITY_VETO');
 await rejected(f=>{f.setOwners({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},
  'QL450_DUAL_OWNER_CONTINUITY_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},
  'QL450_DUAL_OWNER_CONTINUITY_VETO');
});
test('QL450 interrupted remote signed source read burns one-use pending; no automatic retry',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl449Disposition=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL450_ORIGINAL_QL449_DISPOSITION_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL450_ONE_USE_STABILITY_REVIEW_ALREADY_ATTEMPTED');
  assert.equal(readQl450Stability(f.stabilityLedger,id).reason,
   'QL450_PENDING_SUPERVISED_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL450 tampered private receipt and unsafe ledger path are HOLD, never current physical OFF',async()=>{
 const f=fixture();try{
  f.stabilityLedger.claimOnce('pending',id,'a'.repeat(64));
  writeFileSync(join(f.root,'ql450','ql450-pending-'+id+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL450_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl450Stability(f.stabilityLedger,id).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl450StabilityLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
