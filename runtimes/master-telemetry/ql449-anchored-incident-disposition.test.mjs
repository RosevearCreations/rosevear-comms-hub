import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl448RemediationLedger} from './ql448-corrective-remediation-continuity.mjs';
import {openQl449DispositionLedger,readQl449Disposition,
 runQl449AnchoredDisposition} from './ql449-anchored-incident-disposition.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const id='ql449_original_incident_123456';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 k.privateKey).toString('base64')});
function fixture({hostState='OFF',observerState='OFF',lock=true,lease=true,
 watchdog=true,observerIsolation=true}={}){
 const root=mkdtempSync(join(tmpdir(),'ql449-')),now=Date.now()-500;
 const ql448Ledger=openQl448RemediationLedger(join(root,'ql448'));
 const dispositionLedger=openQl449DispositionLedger(join(root,'ql449'));
 const p=ql448Ledger.claimOnce('pending',id,'a'.repeat(64));
 const reviewed=ql448Ledger.claimOnce('reviewed',id,'b'.repeat(64));
 const prior={state:'DURABLE_QL448_CORRECTIVE_PRECONDITIONS_EVIDENCED',
  exceptionClosurePreconditionsEvidenced:true,
  connection:'HOLD',activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  incidentStatus:'OPEN',masterCount:3,originalIncidentId:id,
  remediationId:'ql448_remediation_12345',challengeNonce:'ql448_nonce_abcde12345',
  classification:'SIGNED_CORRECTIVE_PRECONDITIONS_EVIDENCED_INCIDENT_OPEN',
  ownerAcceptance:'DUAL_SIGNED_HISTORICAL_CORRECTIVE_FOLLOWUP_KEEP_OPEN',
  pendingReceiptDigest:p.recordDigest,reviewReceiptDigest:reviewed.recordDigest,
  longHorizonDigest:'c'.repeat(64),masterReportsDigest:'d'.repeat(64)};
 const ceremonyId='ql449_ceremony_abc12345',challengeNonce='ql449_new_nonce_abcde12345';
 const keys={source:key(),anchor:key(),host:key(),observer:key(),owner:key(),
  secondOwner:key(),masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql449.original-ql448-open-incident-source.v1',
  incidentId:id,ql448SummaryDigest:hash(prior),
  ql448ReceiptDigest:reviewed.recordDigest,ql448HorizonDigest:prior.longHorizonDigest,
  incidentStatus:'OPEN_HOLD',observedAt:iso(now-12000)};
 const anchor={schema:'rosevear.ql449.independently-anchored-corrective-closure.v1',
  incidentId:id,ceremonyId,challengeNonce,ql448ReceiptDigest:reviewed.recordDigest,
  sourceDigest:hash(source),anchorId:'independent_anchor_123456',
  anchorSequence:100,anchorDisposition:'CORRECTIVE_CLOSURE_EVIDENCE_ONLY_NOT_FINAL',
  anchoredAt:iso(now-10000)};
 const host={schema:'rosevear.ql449.original-host-fresh-off-reattestation.v1',
  incidentId:id,ceremonyId,challengeNonce,originalHostId:'DESKTOP-AE894KC',
  ql448ReceiptDigest:reviewed.recordDigest,anchorDigest:hash(anchor),
  receiverState:hostState,isolationLock:lock,leaseRevoked:lease,
  watchdogArmed:watchdog,hostSequence:101,observedAt:iso(now-8000)};
 const observer={schema:'rosevear.ql449.independent-fresh-off-observer.v1',
  incidentId:id,ceremonyId,challengeNonce,
  ql448ReceiptDigest:reviewed.recordDigest,
  anchorDigest:hash(anchor),signedHostDigest:hash(host),
  receiverState:observerState,isolationConfirmed:observerIsolation,
  observerSequence:102,observedAt:iso(now-6000)};
 const safe=hostState==='OFF'&&observerState==='OFF'&&lock&&lease&&
  watchdog&&observerIsolation;
 const classification=safe?'SIGNED_ANCHORED_HISTORICAL_OFF_REVIEW_ONLY':
  'SIGNED_OFF_REATTESTATION_EXCEPTION_INCIDENT_OPEN';
 const decision=safe?'ADMIT_EVIDENCE_ONLY_KEEP_INCIDENT_OPEN_HOLD':
  'ESCALATE_OFF_EXCEPTION_KEEP_INCIDENT_OPEN_HOLD';
 const anchoredOffDigest=hash({ql448SummaryDigest:hash(prior),ceremonyId,challengeNonce,
  sourceDigest:hash(source),anchorDigest:hash(anchor),hostDigest:hash(host),
  observerDigest:hash(observer),classification});
 const votes=MASTERS.map(masterId=>({schema:'rosevear.ql449.three-master-anchored-disposition.v1',
  incidentId:id,ceremonyId,masterId,ql448ReceiptDigest:reviewed.recordDigest,
  anchoredOffDigest,classification,dispositionDecision:decision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-4000)}));
 const owner={schema:'rosevear.ql449.dual-owner-incident-disposition.v1',
  incidentId:id,ceremonyId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql448ReceiptDigest:reviewed.recordDigest,anchoredOffDigest,
  masterReportsDigest:hash(votes),classification,dispositionDecision:decision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-3000)};
 const envelopes={source:signed(source,keys.source),anchor:signed(anchor,keys.anchor),
  host:signed(host,keys.host),observer:signed(observer,keys.observer),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.secondOwner).signature}};
 const calls={source:0,anchor:0,host:0,observer:0,masters:0};
 const args={ql448Summary:prior,ql448Ledger,dispositionLedger,ceremonyId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl448ClosureSource:async()=>{calls.source++;return envelopes.source;}},
  independentAnchorProvider:{readSignedExternalAnchor:async()=>{calls.anchor++;return envelopes.anchor;}},
  originalHostProvider:{readSignedFreshOffAttestation:async()=>{calls.host++;return envelopes.host;}},
  independentObserverProvider:{readSignedFreshOffObservation:async()=>{calls.observer++;return envelopes.observer;}},
  threeMasterProvider:{readSignedDispositionVotes:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owners};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl448CustodyVerified:true,separateOwnerRolesVerified:true,
  independentSignerPinsVerified:true,commsSourcePin:keys.source.pin,
  externalAnchorPin:keys.anchor.pin,originalHostPin:keys.host.pin,
  independentObserverPin:keys.observer.pin,sourceOwnerPin:keys.owner.pin,
  masterOwnerPin:keys.secondOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,prior,ql448Ledger,dispositionLedger,ceremonyId,challengeNonce,
  source,anchor,host,observer,votes,owner,keys,envelopes,args,opts,calls,
  setOwners(p){args.finalOwnerDecision={payload:p,
   sourceOwnerSignature:signed(p,keys.owner).signature,
   masterOwnerSignature:signed(p,keys.secondOwner).signature};},
  run:()=>runQl449AnchoredDisposition(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(change,reason,setup={}){
 const f=fixture(setup);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.incidentStatus,'OPEN');
 }finally{f.cleanup();}
}
test('QL449 signed independent anchor plus fresh OFF admits ONLY owner-gated historical disposition review',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL449_ANCHORED_OFF_DISPOSITION_REVIEW_ONLY');
  assert.equal(r.closureAuthorized,false);assert.equal(r.masterCount,3);
  assert.equal(r.incidentStatus,'OPEN');assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl449Disposition(f.dispositionLedger,id).state,
   'QL449_DURABLE_HISTORICAL_OFF_DISPOSITION_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL449_ONE_USE_DISPOSITION_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,anchor:1,host:1,observer:1,masters:1});
 }finally{f.cleanup();}
});
test('QL449 signed ON, divergence or weakened isolation escalates; never closes or connects',async()=>{
 for(const options of [{hostState:'ON'},{observerState:'ON'},{lock:false},
  {lease:false},{watchdog:false},{observerIsolation:false}]){
  const f=fixture(options);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL449_SIGNED_OFF_REATTESTATION_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_OFF_REATTESTATION_EXCEPTION_INCIDENT_OPEN');
   assert.equal(r.incidentStatus,'OPEN');assert.equal(r.closureAuthorized,false);
   assert.equal(readQl449Disposition(f.dispositionLedger,id).state,
    'QL449_DURABLE_OFF_REATTESTATION_EXCEPTION_ESCALATED');
  }finally{f.cleanup();}
 }
});
test('QL449 rejects non-exception QL448, unverified private custody and replay nonce',async()=>{
 await rejected(f=>{f.prior.exceptionClosurePreconditionsEvidenced=false;},
  'QL449_EXACT_QL448_CORRECTIVE_PRECONDITIONS_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.reviewReceiptDigest='f'.repeat(64);},
  'QL449_EXACT_QL448_CORRECTIVE_PRECONDITIONS_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL449_EXACT_QL448_CORRECTIVE_PRECONDITIONS_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL449_EXACT_QL448_CORRECTIVE_PRECONDITIONS_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.externalAnchorPin=f.opts.originalHostPin;},
  'QL449_DISTINCT_INDEPENDENT_SIGNER_PINS_REQUIRED');
});
test('QL449 original Comms source must be signed and original open QL448 receipt exact',async()=>{
 await rejected(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL449_SIGNED_ORIGINAL_SOURCE_MISMATCH');
 await rejected(f=>{f.envelopes.source=signed({...f.source,observedAt:iso(f.now-65000)},
  f.keys.source);},'QL449_SIGNED_ORIGINAL_SOURCE_MISMATCH');
 await rejected(f=>{f.args.originalCommsSourceProvider.readSignedQl448ClosureSource=
  async()=>{throw Error('offline');};},'QL449_ORIGINAL_QL448_SOURCE_UNAVAILABLE');
});
test('QL449 independent anchor must bind exact original receipt, nonce and distinct signer',async()=>{
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  ql448ReceiptDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL449_EXTERNAL_ANCHOR_SIGNED_RECEIPT_INVALID');
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  anchorDisposition:'CLOSED'},f.keys.anchor);},
  'QL449_EXTERNAL_ANCHOR_SIGNED_RECEIPT_INVALID');
 await rejected(f=>{f.envelopes.anchor.signature=f.envelopes.source.signature;},
  'QL449_EXTERNAL_ANCHOR_SIGNED_RECEIPT_INVALID');
 await rejected(f=>{f.args.independentAnchorProvider.readSignedExternalAnchor=
  async()=>{throw Error('offline');};},'QL449_INDEPENDENT_EXTERNAL_ANCHOR_UNAVAILABLE');
});
test('QL449 original host must be DESKTOP-AE894KC signed after anchor, never synthetic other host',async()=>{
 await rejected(f=>{f.envelopes.host=signed({...f.host,originalHostId:'TEMPLAR'},
  f.keys.host);},'QL449_SIGNED_ORIGINAL_HOST_OFF_REATTESTATION_INVALID');
 await rejected(f=>{f.envelopes.host=signed({...f.host,anchorDigest:'f'.repeat(64)},
  f.keys.host);},'QL449_SIGNED_ORIGINAL_HOST_OFF_REATTESTATION_INVALID');
 await rejected(f=>{f.envelopes.host=signed({...f.host,
  observedAt:iso(f.now-11000)},f.keys.host);},
  'QL449_SIGNED_ORIGINAL_HOST_OFF_REATTESTATION_INVALID');
});
test('QL449 independent OFF observation signature must bind host digest and monotonic sequence',async()=>{
 await rejected(f=>{f.envelopes.observer=signed({...f.observer,
  signedHostDigest:'0'.repeat(64)},f.keys.observer);},
  'QL449_INDEPENDENT_SIGNED_FRESH_OFF_INVALID');
 await rejected(f=>{f.envelopes.observer=signed({...f.observer,
  observerSequence:101},f.keys.observer);},
  'QL449_INDEPENDENT_SIGNED_FRESH_OFF_INVALID');
 await rejected(f=>{f.envelopes.observer.signature=f.envelopes.host.signature;},
  'QL449_INDEPENDENT_SIGNED_FRESH_OFF_INVALID');
});
test('QL449 three distinct Master dispositions must all sign exact open HOLD classification',async()=>{
 await rejected(f=>{f.envelopes.votes.pop();},'QL449_THREE_DISTINCT_MASTER_DISPOSITIONS_REQUIRED');
 await rejected(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL449_THREE_MASTER_SIGNED_DISPOSITION_VETO');
 await rejected(f=>{f.envelopes.votes[2]=signed({...f.votes[2],
  dispositionDecision:'CLOSE_NOW'},f.keys.masters[MASTERS[2]]);},
  'QL449_THREE_MASTER_SIGNED_DISPOSITION_VETO');
});
test('QL449 dual owners must sign same open-HOLD evidence without authority to close',async()=>{
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL449_DUAL_OWNER_SIGNED_DISPOSITION_VETO');
 await rejected(f=>{f.setOwners({...f.owner,dispositionDecision:'CONNECTED'});},
  'QL449_DUAL_OWNER_SIGNED_DISPOSITION_VETO');
 await rejected(f=>{f.setOwners({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},
  'QL449_DUAL_OWNER_SIGNED_DISPOSITION_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},
  'QL449_DUAL_OWNER_SIGNED_DISPOSITION_VETO');
});
test('QL449 interrupted source intake burns protected one-use pending, manual recovery required',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl448ClosureSource=async()=>{
   throw Error('offline');};
  assert.equal((await f.run()).reason,'QL449_ORIGINAL_QL448_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL449_ONE_USE_DISPOSITION_ALREADY_ATTEMPTED');
  assert.equal(readQl449Disposition(f.dispositionLedger,id).reason,
   'QL449_PENDING_MANUAL_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL449 corrupt or wrong-path custody fails closed without live OFF assertion',async()=>{
 const f=fixture();try{
  f.dispositionLedger.claimOnce('pending',id,'a'.repeat(64));
  writeFileSync(join(f.root,'ql449','ql449-pending-'+id+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL449_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl449Disposition(f.dispositionLedger,id).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl449DispositionLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
