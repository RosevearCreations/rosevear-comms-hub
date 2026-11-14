import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl452OutcomeLedger} from './ql452-original-host-physical-off-audit.mjs';
import {openQl453ExpiryLedger,readQl453Expiry,
 runQl453ExpiryRenewal} from './ql453-physical-off-witness-expiry.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const incidentId='ql453_original_incident_123456';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});

function fixture({priorException=false,originalExpired=false,originalOn=false,
 renewalOn=false,hostOn=false,lock=true,lease=true,watchdog=true,
 originalIsolation=true,renewalIsolation=true}={}){
 const root=mkdtempSync(join(tmpdir(),'ql453-')),now=Date.now()-500;
 const ql452Ledger=openQl452OutcomeLedger(join(root,'ql452'));
 const expiryLedger=openQl453ExpiryLedger(join(root,'ql453'));
 const pending452=ql452Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const outcome452=ql452Ledger.claimOnce(priorException?'exception':'audited',incidentId,'b'.repeat(64));
 const prior={state:priorException?'DURABLE_QL452_ORIGINAL_HOST_OUTCOME_EXCEPTION_OPEN':
  'DURABLE_QL452_ORIGINAL_HOST_OUTCOME_AUDITED',
  originalIncidentId:incidentId,auditId:'ql452_audit_abc12345',
  challengeNonce:'ql452_nonce_abcde12345',
  classification:priorException?'SIGNED_RESPONSE_OUTCOME_OR_PHYSICAL_OFF_EXCEPTION_OPEN':
   'SIGNED_HISTORICAL_PHYSICAL_OFF_RESPONSE_OUTCOME_AUDITED_OPEN',
  closureReviewDecision:priorException?'ESCALATE_UNRESOLVED_PHYSICAL_OFF_EXCEPTION_KEEP_OPEN_HOLD':
   'REVERIFY_CLOSURE_PREREQUISITES_ONLY_KEEP_OPEN_HOLD',
  connection:'HOLD',incidentStatus:'OPEN',activationAuthorized:false,
  closureAuthorized:false,physicalReceiverCurrentlyOff:false,masterCount:3,
  physicalEvidenceFreshAtIntake:true,
  ownerAcceptance:'DUAL_SIGNED_HISTORICAL_CLOSURE_REASSESSMENT_OPEN_HOLD',
  pendingReceiptDigest:pending452.recordDigest,outcomeReceiptDigest:outcome452.recordDigest,
  outcomeDigest:'c'.repeat(64),authorityDigest:'d'.repeat(64),reportsDigest:'e'.repeat(64)};
 const renewalId='ql453_renewal_abc12345',challengeNonce='ql453_nonce_abcde12345';
 const keys={source:key(),original:key(),host:key(),anchor:key(),renewed:key(),
  authority:key(),sourceOwner:key(),masterOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql453.original-ql452-case.v1',
  incidentId,ql452SummaryDigest:hash(prior),ql452ReceiptDigest:outcome452.recordDigest,
  ql452OutcomeDigest:prior.outcomeDigest,incidentStatus:'OPEN_HOLD',
  readAt:iso(now-12000)};
 const original={schema:'rosevear.ql453.original-ql452-physical-witness.v1',
  incidentId,ql452ReceiptDigest:outcome452.recordDigest,
  ql452OutcomeDigest:prior.outcomeDigest,originalHostId:'DESKTOP-AE894KC',
  receiverId:'ISOLATED_COMMS_RECEIVER',sensorId:'original_sensor_abc123456',
  receiverState:originalOn?'ON':'OFF',isolationConfirmed:originalIsolation,
  observerSequence:80,observedAt:iso(now-(originalExpired?30000:10000))};
 const host={schema:'rosevear.ql453.original-host-continuity.v1',
  incidentId,renewalId,challengeNonce,ql452ReceiptDigest:outcome452.recordDigest,
  sourceDigest:hash(source),originalHostId:'DESKTOP-AE894KC',
  receiverState:hostOn?'ON':'OFF',isolationLock:lock,leaseRevoked:lease,
  watchdogArmed:watchdog,hostSequence:100,readAt:iso(now-9000)};
 const anchor={schema:'rosevear.ql453.external-witness-renewal-anchor.v1',
  incidentId,renewalId,challengeNonce,ql452ReceiptDigest:outcome452.recordDigest,
  originalWitnessDigest:hash(original),hostReadbackDigest:hash(host),
  sourceDigest:hash(source),anchorId:'ql453_external_anchor_12345',
  anchorSequence:101,anchorDecision:'SIGNED_WITNESS_HISTORY_ONLY_OPEN_HOLD',
  anchoredAt:iso(now-8000)};
 const renewed={schema:'rosevear.ql453.renewed-independent-physical-witness.v1',
  incidentId,renewalId,challengeNonce,ql452ReceiptDigest:outcome452.recordDigest,
  anchorDigest:hash(anchor),originalWitnessDigest:hash(original),
  hostReadbackDigest:hash(host),originalHostId:'DESKTOP-AE894KC',
  receiverId:'ISOLATED_COMMS_RECEIVER',sensorId:'renewed_sensor_abc123456',
  receiverState:renewalOn?'ON':'OFF',isolationConfirmed:renewalIsolation,
  observerSequence:102,observedAt:iso(now-6000)};
 const healthy=!priorException&&!originalExpired&&!originalOn&&!renewalOn&&!hostOn&&
  lock&&lease&&watchdog&&originalIsolation&&renewalIsolation;
 const classification=healthy?'SIGNED_PHYSICAL_OFF_WITNESS_REVIEW_FRESH_OPEN_HOLD':
  'SIGNED_PHYSICAL_OFF_WITNESS_EXPIRED_OR_DIVERGENT_EXCEPTION_OPEN';
 const closureDecision=healthy?
  'THREE_MASTER_CLOSURE_PREREQUISITES_REVIEW_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_WITNESS_EXPIRY_OR_DIVERGENCE_KEEP_OPEN_HOLD';
 const witnessDigest=hash({ql452SummaryDigest:hash(prior),renewalId,challengeNonce,
  sourceDigest:hash(source),originalWitnessDigest:hash(original),
  hostReadbackDigest:hash(host),anchorDigest:hash(anchor),
  renewedWitnessDigest:hash(renewed),originalExpired,classification});
 const boundary={schema:'rosevear.ql453.independent-closure-gate.v1',
  incidentId,renewalId,ql452ReceiptDigest:outcome452.recordDigest,
  witnessDigest,classification,closureDecision,incidentStatus:'OPEN_HOLD',
  closureAuthorized:false,activationAuthorized:false,
  physicalReceiverCurrentlyOff:false,separateCeremonyRequired:true,
  attestedAt:iso(now-4000)};
 const boundaryDigest=hash(boundary);
 const votes=MASTERS.map(masterId=>({
  schema:'rosevear.ql453.three-master-closure-gate.v1',
  incidentId,renewalId,masterId,ql452ReceiptDigest:outcome452.recordDigest,
  witnessDigest,boundaryDigest,classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-3000)}));
 const owner={schema:'rosevear.ql453.dual-owner-closure-gate.v1',
  incidentId,renewalId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql452ReceiptDigest:outcome452.recordDigest,witnessDigest,boundaryDigest,
  masterReportsDigest:hash(votes),classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1000)};
 const envelopes={source:signed(source,keys.source),original:signed(original,keys.original),
  host:signed(host,keys.host),anchor:signed(anchor,keys.anchor),
  renewed:signed(renewed,keys.renewed),boundary:signed(boundary,keys.authority),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.sourceOwner).signature,
   masterOwnerSignature:signed(owner,keys.masterOwner).signature}};
 const calls={source:0,original:0,host:0,anchor:0,renewed:0,boundary:0,votes:0};
 const args={ql452Summary:prior,ql452Ledger,expiryLedger,renewalId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl452Case:async()=>{calls.source++;return envelopes.source;}},
  originalWitnessProvider:{readSignedOriginalPhysicalWitness:async()=>{calls.original++;return envelopes.original;}},
  originalHostProvider:{readSignedOriginalHostContinuity:async()=>{calls.host++;return envelopes.host;}},
  independentAnchorProvider:{readSignedWitnessAnchor:async()=>{calls.anchor++;return envelopes.anchor;}},
  renewedWitnessProvider:{readSignedRenewedPhysicalWitness:async()=>{calls.renewed++;return envelopes.renewed;}},
  independentAuthorityProvider:{readSignedClosureGate:async()=>{calls.boundary++;return envelopes.boundary;}},
  threeMasterProvider:{readSignedThreeMasterGate:async()=>{calls.votes++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owners};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl452CustodyVerified:true,originalPhysicalSensorEnrollmentVerified:true,
  renewedPhysicalSensorEnrollmentVerified:true,independentSignerPinsVerified:true,
  separateOwnerRolesVerified:true,readTrustedNowMs:()=>opts.nowMs,
  commsSourcePin:keys.source.pin,originalWitnessPin:keys.original.pin,
  originalHostPin:keys.host.pin,anchorPin:keys.anchor.pin,
  renewedWitnessPin:keys.renewed.pin,authorityPin:keys.authority.pin,
  sourceOwnerPin:keys.sourceOwner.pin,masterOwnerPin:keys.masterOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,now,prior,ql452Ledger,expiryLedger,renewalId,challengeNonce,
  source,original,host,anchor,renewed,boundary,votes,owner,keys,envelopes,args,opts,calls,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.sourceOwner).signature,
   masterOwnerSignature:signed(v,keys.masterOwner).signature};},
  run:()=>runQl453ExpiryRenewal(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(mutate,reason,options={}){
 const f=fixture(options);try{
  mutate(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL453 fresh separate signed OFF witnesses, independent authority and all three Masters admit historical review only',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL453_SIGNED_WITNESS_FRESHNESS_REVIEW_ONLY');
  assert.equal(r.originalWitnessExpiredAtReview,false);
  assert.equal(r.masterCount,3);assert.equal(r.connection,'HOLD');
  assert.equal(r.incidentStatus,'OPEN');assert.equal(r.closureAuthorized,false);
  assert.equal(r.activationAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl453Expiry(f.expiryLedger,incidentId).state,
   'QL453_DURABLE_HISTORY_FRESHNESS_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL453_ONE_USE_RENEWAL_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,original:1,host:1,anchor:1,
   renewed:1,boundary:1,votes:1});
 }finally{f.cleanup();}
});
test('QL453 expired original physical witness is durable signed escalation even when renewal witness OFF',async()=>{
 const f=fixture({originalExpired:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL453_WITNESS_EXPIRY_EXCEPTION_OPEN');
  assert.equal(r.originalWitnessExpiredAtReview,true);
  assert.equal(r.classification,'SIGNED_PHYSICAL_OFF_WITNESS_EXPIRED_OR_DIVERGENT_EXCEPTION_OPEN');
  assert.equal(r.incidentStatus,'OPEN');assert.equal(r.closureAuthorized,false);
  assert.equal(readQl453Expiry(f.expiryLedger,incidentId).state,
   'QL453_DURABLE_WITNESS_EXPIRY_EXCEPTION_OPEN');
 }finally{f.cleanup();}
});
test('QL453 signed ON/divergence, isolation controls or QL452 predecessor exception escalates',async()=>{
 for(const options of [{originalOn:true},{renewalOn:true},{hostOn:true},
  {lock:false},{lease:false},{watchdog:false},{originalIsolation:false},
  {renewalIsolation:false},{priorException:true}]){
  const f=fixture(options);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL453_WITNESS_EXPIRY_EXCEPTION_OPEN');
   assert.equal(r.closureAuthorized,false);assert.equal(r.connection,'HOLD');
  }finally{f.cleanup();}
 }
});
test('QL453 requires exact QL452 OPEN/HOLD original custody, fresh nonce and separate enrolled physical sensors',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL453_EXACT_OPEN_QL452_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.outcomeReceiptDigest='f'.repeat(64);},
  'QL453_EXACT_OPEN_QL452_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL453_EXACT_OPEN_QL452_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.renewedPhysicalSensorEnrollmentVerified=false;},
  'QL453_EXACT_OPEN_QL452_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.renewedWitnessPin=f.opts.originalWitnessPin;},
  'QL453_ELEVEN_DISTINCT_SIGNER_PINS_REQUIRED');
});
test('QL453 source and original historical physical sensor reject invalid original provenance',async()=>{
 await rejected(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL453_ORIGINAL_QL452_CASE_INVALID');
 await rejected(f=>{f.envelopes.source=signed({...f.source,
  readAt:iso(f.now-70000)},f.keys.source);},
  'QL453_ORIGINAL_QL452_CASE_INVALID');
 await rejected(f=>{f.envelopes.original=signed({...f.original,
  originalHostId:'TEMPLAR'},f.keys.original);},
  'QL453_ORIGINAL_SIGNED_PHYSICAL_WITNESS_INVALID');
 await rejected(f=>{f.envelopes.original.signature=f.envelopes.source.signature;},
  'QL453_ORIGINAL_SIGNED_PHYSICAL_WITNESS_INVALID');
});
test('QL453 original Windows host identity, protections and external anchor hashes are mandatory',async()=>{
 await rejected(f=>{f.envelopes.host=signed({...f.host,
  originalHostId:'TEMPLAR'},f.keys.host);},
  'QL453_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.envelopes.host=signed({...f.host,
  readAt:iso(f.now-70000)},f.keys.host);},
  'QL453_SIGNED_ORIGINAL_HOST_CONTINUITY_INVALID');
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  originalWitnessDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL453_INDEPENDENT_SIGNED_ANCHOR_INVALID');
 await rejected(f=>{f.envelopes.anchor.signature=f.envelopes.host.signature;},
  'QL453_INDEPENDENT_SIGNED_ANCHOR_INVALID');
});
test('QL453 independent renewal observation must be <=15 seconds old, physically separate and monotonic',async()=>{
 await rejected(f=>{f.envelopes.renewed=signed({...f.renewed,
  observedAt:iso(f.now-16000)},f.keys.renewed);},
  'QL453_RENEWED_PHYSICAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.renewed=signed({...f.renewed,
  sensorId:f.original.sensorId},f.keys.renewed);},
  'QL453_RENEWED_PHYSICAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.renewed=signed({...f.renewed,
  observerSequence:101},f.keys.renewed);},
  'QL453_RENEWED_PHYSICAL_WITNESS_INVALID_OR_STALE');
 await rejected(f=>{f.envelopes.renewed=signed({...f.renewed,
  anchorDigest:'f'.repeat(64)},f.keys.renewed);},
  'QL453_RENEWED_PHYSICAL_WITNESS_INVALID_OR_STALE');
});
test('QL453 independent closure authority must veto live receiver OFF, activation and closure',async()=>{
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  physicalReceiverCurrentlyOff:true},f.keys.authority);},
  'QL453_INDEPENDENT_CLOSURE_GATE_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  activationAuthorized:true},f.keys.authority);},
  'QL453_INDEPENDENT_CLOSURE_GATE_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  closureAuthorized:true},f.keys.authority);},
  'QL453_INDEPENDENT_CLOSURE_GATE_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  separateCeremonyRequired:false},f.keys.authority);},
  'QL453_INDEPENDENT_CLOSURE_GATE_VETO');
});
test('QL453 three Master signatures and separate two-owner signatures cannot bypass HOLD',async()=>{
 await rejected(f=>{f.envelopes.votes.pop();},'QL453_THREE_DISTINCT_MASTERS_REQUIRED');
 await rejected(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL453_THREE_MASTER_SIGNED_GATE_VETO');
 await rejected(f=>{f.envelopes.votes[2]=signed({...f.votes[2],
  closureDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL453_THREE_MASTER_SIGNED_GATE_VETO');
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL453_DUAL_OWNER_SIGNED_GATE_VETO');
 await rejected(f=>{f.setOwners({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},
  'QL453_DUAL_OWNER_SIGNED_GATE_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},
  'QL453_DUAL_OWNER_SIGNED_GATE_VETO');
});
test('QL453 final trusted clock rechecks renewal sensor and original witness freshness before commit',async()=>{
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+10000;},
  'QL453_PROTECTED_CUSTODY_OR_RENEWAL_WITNESS_EXPIRED');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now+7000;},
  'QL453_ORIGINAL_WITNESS_EXPIRED_DURING_REVIEW');
 await rejected(f=>{f.opts.readTrustedNowMs=()=>f.now-1000;},
  'QL453_TRUSTED_CLOCK_DRIFT');
});
test('QL453 interrupted source creates protected PENDING and cannot silently replay',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl452Case=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL453_ORIGINAL_SIGNED_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL453_ONE_USE_RENEWAL_ALREADY_ATTEMPTED');
  assert.equal(readQl453Expiry(f.expiryLedger,incidentId).reason,
   'QL453_PENDING_MANUAL_OWNER_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL453 unsafe private ledger and tampered receipt fail closed',async()=>{
 const f=fixture();try{
  f.expiryLedger.claimOnce('pending',incidentId,'a'.repeat(64));
  writeFileSync(join(f.root,'ql453','ql453-pending-'+incidentId+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL453_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl453Expiry(f.expiryLedger,incidentId).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl453ExpiryLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
