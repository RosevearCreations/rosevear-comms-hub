import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl450StabilityLedger} from './ql450-off-stability-closure-boundary.mjs';
import {openQl451ResponseLedger,readQl451Response,
 runQl451ResponseRenewal} from './ql451-anchored-response-off-renewal.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const id='ql451_original_incident_123456';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});

function fixture({priorException=true,responseComplete=true,hostOn=false,
 observerOn=false,lock=true,lease=true,watchdog=true,independentIsolation=true}={}){
 const root=mkdtempSync(join(tmpdir(),'ql451-')),now=Date.now()-500;
 const ql450Ledger=openQl450StabilityLedger(join(root,'ql450'));
 const responseLedger=openQl451ResponseLedger(join(root,'ql451'));
 const p=ql450Ledger.claimOnce('pending',id,'a'.repeat(64));
 const outcome=ql450Ledger.claimOnce(priorException?'exception':'stable',id,'b'.repeat(64));
 const prior={state:priorException?
  'DURABLE_QL450_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN':
  'DURABLE_QL450_POST_DISPOSITION_OFF_STABLE_REVIEW_ONLY',
  classification:priorException?'SIGNED_POST_DISPOSITION_RECURRENCE_EXCEPTION_OPEN':
   'SIGNED_HISTORICAL_POST_DISPOSITION_OFF_STABLE_OPEN',
  recurrenceDecision:priorException?'ESCALATE_SIGNED_RECURRENCE_KEEP_INCIDENT_OPEN_HOLD':
   'HISTORICAL_STABILITY_KEEP_INCIDENT_OPEN_HOLD',
  connection:'HOLD',activationAuthorized:false,closureAuthorized:false,
  physicalReceiverCurrentlyOff:false,incidentStatus:'OPEN',masterCount:3,
  originalIncidentId:id,reviewId:'ql450_review_abc123456',
  challengeNonce:'ql450_nonce_abcde12345',
  ownerAcceptance:'DUAL_SIGNED_RECURRENCE_CONTINUITY_OPEN_HOLD',
  closureAuthorityBoundary:'SEPARATE_SUPERVISED_CLOSURE_CEREMONY_REQUIRED',
  stabilityDigest:'c'.repeat(64),boundaryDigest:'d'.repeat(64),
  masterReportsDigest:'e'.repeat(64),pendingReceiptDigest:p.recordDigest,
  ...{[priorException?'exceptionReceiptDigest':'stabilityReceiptDigest']:outcome.recordDigest}};
 const renewalId='ql451_renewal_abc123456',challengeNonce='ql451_fresh_nonce_abc12345';
 const keys={source:key(),response:key(),anchor:key(),host:key(),observer:key(),
  boundary:key(),owner:key(),secondOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql451.original-ql450-open-source.v1',
  incidentId:id,ql450SummaryDigest:hash(prior),
  ql450ReceiptDigest:outcome.recordDigest,ql450StabilityDigest:prior.stabilityDigest,
  priorClassification:prior.classification,incidentStatus:'OPEN_HOLD',
  observedAt:iso(now-56000)};
 const response={schema:'rosevear.ql451.independent-recurrence-response.v1',
  incidentId:id,renewalId,challengeNonce,ql450ReceiptDigest:outcome.recordDigest,
  sourceDigest:hash(source),remediationDisposition:priorException?
  (responseComplete?'SIGNED_RESPONSE_COMPLETED_UNDER_HOLD':
   'SIGNED_RESPONSE_UNRESOLVED_KEEP_HOLD'):
  'NO_NEW_RECURRENCE_SIGNED_RENEWAL',
  isolationLockVerified:lock,leaseRevokedVerified:lease,
  watchdogArmedVerified:watchdog,respondedAt:iso(now-55000)};
 const anchor={schema:'rosevear.ql451.independent-response-anchor.v1',
  incidentId:id,renewalId,challengeNonce,ql450ReceiptDigest:outcome.recordDigest,
  signedResponseDigest:hash(response),sourceDigest:hash(source),
  anchorId:'ql451_external_anchor_abc12345',anchorSequence:199,
  anchorStatus:'HISTORICAL_RESPONSE_ONLY_NO_INCIDENT_CLOSURE',
  anchoredAt:iso(now-54000)};
 const hosts=[],witnesses=[];let previousDigest=hash(anchor),previousSequence=199;
 for(let i=0;i<3;i++){
  const host={schema:'rosevear.ql451.original-host-off-renewal.v1',
   incidentId:id,renewalId,challengeNonce,
   horizon:['SHORT','MEDIUM','LONG'][i],sampleIndex:i+1,
   originalHostId:'DESKTOP-AE894KC',ql450ReceiptDigest:outcome.recordDigest,
   responseDigest:hash(response),anchorDigest:hash(anchor),previousDigest,
   receiverState:hostOn&&i===1?'ON':'OFF',
   isolationLock:lock,leaseRevoked:lease,watchdogArmed:watchdog,
   hostSequence:previousSequence+1,
   observedAt:iso(now+[-52000,-40000,-19000][i])};
  const witness={schema:'rosevear.ql451.independent-off-renewal-witness.v1',
   incidentId:id,renewalId,challengeNonce,
   horizon:host.horizon,sampleIndex:i+1,
   ql450ReceiptDigest:outcome.recordDigest,
   anchorDigest:hash(anchor),signedHostDigest:hash(host),previousDigest,
   receiverState:observerOn&&i===2?'ON':host.receiverState,
   isolationConfirmed:independentIsolation,observerSequence:host.hostSequence+1,
   observedAt:iso(now+[-51000,-39000,-18000][i])};
  hosts.push(host);witnesses.push(witness);
  previousSequence=witness.observerSequence;previousDigest=hash(witness);
 }
 const safe=!hostOn&&!observerOn&&lock&&lease&&watchdog&&independentIsolation&&
  (!priorException||responseComplete);
 const classification=safe?(priorException?
  'SIGNED_CORRECTIVE_RECURRENCE_RESPONSE_OFF_RENEWED_OPEN':
  'SIGNED_HISTORICAL_OFF_RENEWAL_CONTINUES_OPEN'):
  'SIGNED_RESPONSE_OR_OFF_RENEWAL_EXCEPTION_OPEN';
 const reassessmentDecision=safe?
  'HISTORICAL_CLOSURE_REASSESSMENT_EVIDENCE_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_UNRESOLVED_RECURRENCE_KEEP_OPEN_HOLD';
 const renewalDigest=hash({ql450SummaryDigest:hash(prior),renewalId,challengeNonce,
  originalSourceDigest:hash(source),responseDigest:hash(response),anchorDigest:hash(anchor),
  hostDigests:hosts.map(hash),witnessDigests:witnesses.map(hash),classification});
 const boundary={schema:'rosevear.ql451.independent-closure-reassessment-boundary.v1',
  incidentId:id,renewalId,ql450ReceiptDigest:outcome.recordDigest,renewalDigest,
  classification,closureAuthorized:false,activationAuthorized:false,
  physicalReceiverCurrentlyOff:false,incidentStatus:'OPEN_HOLD',
  authorityBoundary:'OWNER_GATED_REASSESSMENT_ONLY_SEPARATE_CLOSURE_CEREMONY',
  attestedAt:iso(now-15000)};
 const boundaryDigest=hash(boundary);
 const votes=MASTERS.map(masterId=>({
  schema:'rosevear.ql451.three-master-closure-reassessment.v1',
  incidentId:id,renewalId,masterId,ql450ReceiptDigest:outcome.recordDigest,
  renewalDigest,boundaryDigest,classification,reassessmentDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-12000)}));
 const owner={schema:'rosevear.ql451.dual-owner-closure-reassessment.v1',
  incidentId:id,renewalId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql450ReceiptDigest:outcome.recordDigest,renewalDigest,boundaryDigest,
  masterReportsDigest:hash(votes),classification,reassessmentDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-10000)};
 const envelopes={source:signed(source,keys.source),
  response:signed(response,keys.response),anchor:signed(anchor,keys.anchor),
  hosts:hosts.map(h=>signed(h,keys.host)),
  witnesses:witnesses.map(w=>signed(w,keys.observer)),
  boundary:signed(boundary,keys.boundary),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.secondOwner).signature}};
 const calls={source:0,response:0,anchor:0,host:0,witness:0,boundary:0,masters:0};
 const args={ql450Summary:prior,ql450Ledger,responseLedger,renewalId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl450Case:async()=>{calls.source++;return envelopes.source;}},
  independentResponseProvider:{readSignedRecurrenceResponse:async()=>{calls.response++;return envelopes.response;}},
  independentAnchorProvider:{readSignedResponseAnchor:async()=>{calls.anchor++;return envelopes.anchor;}},
  originalHostProvider:{readSignedOffRenewalSamples:async()=>{calls.host++;return envelopes.hosts;}},
  independentObserverProvider:{readSignedOffRenewalWitnesses:async()=>{calls.witness++;return envelopes.witnesses;}},
  independentBoundaryProvider:{readSignedClosureReassessmentBoundary:async()=>{calls.boundary++;return envelopes.boundary;}},
  threeMasterProvider:{readSignedReassessmentVotes:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owners};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl450CustodyVerified:true,separateOwnerRolesVerified:true,
  independentSignerPinsVerified:true,commsSourcePin:keys.source.pin,
  responseOfficerPin:keys.response.pin,independentAnchorPin:keys.anchor.pin,
  originalHostPin:keys.host.pin,independentObserverPin:keys.observer.pin,
  boundaryAuthorityPin:keys.boundary.pin,sourceOwnerPin:keys.owner.pin,
  masterOwnerPin:keys.secondOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,prior,ql450Ledger,responseLedger,renewalId,challengeNonce,
  source,response,anchor,hosts,witnesses,boundary,votes,owner,
  keys,envelopes,args,opts,calls,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.owner).signature,
   masterOwnerSignature:signed(v,keys.secondOwner).signature};},
  run:()=>runQl451ResponseRenewal(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(change,reason,config={}){
 const f=fixture(config);try{
  change(f);const r=await f.run();assert.equal(r.state,'HOLD',r.reason);
  assert.equal(r.reason,reason);assert.equal(r.connection,'HOLD');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.incidentStatus,'OPEN');
 }finally{f.cleanup();}
}
test('QL451 QL450 exception + signed corrected response, anchor and 30s renewal grants only evidence review',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL451_ANCHORED_RESPONSE_OFF_RENEWAL_REVIEW_ONLY');
  assert.equal(r.responsePreconditionsEvidenced,true);assert.equal(r.masterCount,3);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl451Response(f.responseLedger,id).state,
   'QL451_DURABLE_HISTORICAL_RESPONSE_RENEWAL_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL451_ONE_USE_RESPONSE_RENEWAL_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,response:1,anchor:1,host:1,witness:1,boundary:1,masters:1});
 }finally{f.cleanup();}
});
test('QL451 QL450 historical OFF stability can renew but never claims prior exception correction',async()=>{
 const f=fixture({priorException:false});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL451_ANCHORED_RESPONSE_OFF_RENEWAL_REVIEW_ONLY');
  assert.equal(r.classification,'SIGNED_HISTORICAL_OFF_RENEWAL_CONTINUES_OPEN');
  assert.equal(r.responsePreconditionsEvidenced,false);
  assert.equal(r.incidentStatus,'OPEN');
 }finally{f.cleanup();}
});
test('QL451 signed ON, witness divergence, isolation failure, or unresolved response escalates OPEN/HOLD',async()=>{
 for(const config of [{hostOn:true},{observerOn:true},{lock:false},{lease:false},
  {watchdog:false},{independentIsolation:false},{responseComplete:false}]){
  const f=fixture(config);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL451_RESPONSE_RECURRENCE_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_RESPONSE_OR_OFF_RENEWAL_EXCEPTION_OPEN');
   assert.equal(r.responsePreconditionsEvidenced,false);
   assert.equal(r.connection,'HOLD');assert.equal(r.closureAuthorized,false);
   assert.equal(readQl451Response(f.responseLedger,id).state,
    'QL451_DURABLE_RESPONSE_RENEWAL_EXCEPTION_ESCALATED');
  }finally{f.cleanup();}
 }
});
test('QL451 rejects forged/closed QL450 custody, classification and nonce reuse',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL451_EXACT_QL450_OPEN_CASE_AND_NEW_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.exceptionReceiptDigest='f'.repeat(64);},
  'QL451_EXACT_QL450_OPEN_CASE_AND_NEW_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.recurrenceDecision='CLOSE_NOW';},
  'QL451_EXACT_QL450_OPEN_CASE_AND_NEW_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL451_EXACT_QL450_OPEN_CASE_AND_NEW_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.independentAnchorPin=f.opts.responseOfficerPin;},
  'QL451_ELEVEN_DISTINCT_PINNED_SIGNERS_REQUIRED');
});
test('QL451 original Comms source and independent response receipts must be genuine, fresh and bound',async()=>{
 await rejected(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL451_ORIGINAL_SIGNED_SOURCE_INVALID');
 await rejected(f=>{f.envelopes.source=signed({...f.source,
  observedAt:iso(f.now-65000)},f.keys.source);},
  'QL451_ORIGINAL_SIGNED_SOURCE_INVALID');
 await rejected(f=>{f.envelopes.response=signed({...f.response,
  remediationDisposition:'AUTO_CLOSE'},f.keys.response);},
  'QL451_SIGNED_RECURRENCE_RESPONSE_INVALID');
 await rejected(f=>{f.envelopes.response.signature=f.envelopes.source.signature;},
  'QL451_SIGNED_RECURRENCE_RESPONSE_INVALID');
 await rejected(f=>{f.args.independentResponseProvider.readSignedRecurrenceResponse=
  async()=>{throw Error('offline');}},'QL451_INDEPENDENT_RESPONSE_UNAVAILABLE');
});
test('QL451 anchored recurrence response must be independent, exact and never authorize closure',async()=>{
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  anchorStatus:'INCIDENT_CLOSED'},f.keys.anchor);},
  'QL451_INDEPENDENT_ANCHORED_RESPONSE_INVALID');
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  signedResponseDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL451_INDEPENDENT_ANCHORED_RESPONSE_INVALID');
 await rejected(f=>{f.envelopes.anchor.signature=f.envelopes.response.signature;},
  'QL451_INDEPENDENT_ANCHORED_RESPONSE_INVALID');
});
test('QL451 original host is pinned, signed, monotonic and at least 10s/30s horizon spaced',async()=>{
 await rejected(f=>{f.envelopes.hosts[0]=signed({...f.hosts[0],
  originalHostId:'TEMPLAR'},f.keys.host);},
  'QL451_SIGNED_ORIGINAL_HOST_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],
  hostSequence:200},f.keys.host);},'QL451_SIGNED_ORIGINAL_HOST_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],
  observedAt:iso(f.now-46001)},f.keys.host);},
  'QL451_SIGNED_ORIGINAL_HOST_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[2]=signed({...f.hosts[2],
  observedAt:iso(f.now-22001)},f.keys.host);},
  'QL451_SIGNED_ORIGINAL_HOST_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts.pop();},
  'QL451_THREE_SIGNED_RENEWAL_HORIZONS_REQUIRED');
});
test('QL451 independent witness cannot forge host digest, skip signed chain or regress sequence',async()=>{
 await rejected(f=>{f.envelopes.witnesses[0]=signed({...f.witnesses[0],
  signedHostDigest:'f'.repeat(64)},f.keys.observer);},
  'QL451_SIGNED_INDEPENDENT_OFF_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.witnesses[1]=signed({...f.witnesses[1],
  observerSequence:202},f.keys.observer);},
  'QL451_SIGNED_INDEPENDENT_OFF_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.witnesses[2].signature=f.envelopes.hosts[2].signature;},
  'QL451_SIGNED_INDEPENDENT_OFF_HORIZON_INVALID');
});
test('QL451 independent closure boundary always denies incident closure, activation and live physical OFF',async()=>{
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  closureAuthorized:true},f.keys.boundary);},'QL451_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  activationAuthorized:true},f.keys.boundary);},'QL451_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.boundary=signed({...f.boundary,
  physicalReceiverCurrentlyOff:true},f.keys.boundary);},
  'QL451_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
});
test('QL451 three different Masters and both separate owners cannot vote to close or connect',async()=>{
 await rejected(f=>{f.envelopes.votes.pop();},
  'QL451_THREE_DISTINCT_MASTER_REASSESSMENTS_REQUIRED');
 await rejected(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL451_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.envelopes.votes[2]=signed({...f.votes[2],
  reassessmentDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL451_THREE_MASTER_SIGNED_VETO');
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL451_DUAL_OWNER_REASSESSMENT_VETO');
 await rejected(f=>{f.setOwners({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},
  'QL451_DUAL_OWNER_REASSESSMENT_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},
  'QL451_DUAL_OWNER_REASSESSMENT_VETO');
});
test('QL451 interrupted source read burns durable pending and cannot auto replay',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl450Case=async()=>{throw Error('offline')};
  assert.equal((await f.run()).reason,'QL451_ORIGINAL_QL450_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL451_ONE_USE_RESPONSE_RENEWAL_ALREADY_ATTEMPTED');
  assert.equal(readQl451Response(f.responseLedger,id).reason,
   'QL451_PENDING_MANUAL_OWNER_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL451 corrupt, symlink or insecure private ledger holds without physical OFF assertion',async()=>{
 const f=fixture();try{
  f.responseLedger.claimOnce('pending',id,'a'.repeat(64));
  writeFileSync(join(f.root,'ql451','ql451-pending-'+id+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL451_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl451Response(f.responseLedger,id).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl451ResponseLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
