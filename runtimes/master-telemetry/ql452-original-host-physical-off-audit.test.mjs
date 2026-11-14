import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl451ResponseLedger} from './ql451-anchored-response-off-renewal.mjs';
import {openQl452OutcomeLedger,readQl452Outcome,
 runQl452OutcomeAudit} from './ql452-original-host-physical-off-audit.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const ID='ql452_original_incident_123456';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
function fixture({priorException=false,hostOn=false,sensorOn=false,
 responseEffective=true,lock=true,lease=true,watchdog=true,
 independentIsolation=true}={}){
 const now=Date.now()-500,root=mkdtempSync(join(tmpdir(),'ql452-'));
 const ql451Ledger=openQl451ResponseLedger(join(root,'ql451'));
 const outcomeLedger=openQl452OutcomeLedger(join(root,'ql452'));
 const p=ql451Ledger.claimOnce('pending',ID,'a'.repeat(64));
 const receipt=ql451Ledger.claimOnce(priorException?'exception':'renewed',ID,'b'.repeat(64));
 const prior={state:priorException?
  'DURABLE_QL451_RESPONSE_RECURRENCE_EXCEPTION_OPEN':
  'DURABLE_QL451_ANCHORED_RESPONSE_OFF_RENEWAL_REVIEW_ONLY',
  originalIncidentId:ID,renewalId:'ql451_renewal_test_abc123',
  challengeNonce:'ql451_nonce_abcde12345',
  classification:priorException?'SIGNED_RESPONSE_OR_OFF_RENEWAL_EXCEPTION_OPEN':
   'SIGNED_CORRECTIVE_RECURRENCE_RESPONSE_OFF_RENEWED_OPEN',
  reassessmentDecision:priorException?'ESCALATE_UNRESOLVED_RECURRENCE_KEEP_OPEN_HOLD':
   'HISTORICAL_CLOSURE_REASSESSMENT_EVIDENCE_ONLY_KEEP_OPEN_HOLD',
  connection:'HOLD',incidentStatus:'OPEN',activationAuthorized:false,
  closureAuthorized:false,physicalReceiverCurrentlyOff:false,masterCount:3,
  responsePreconditionsEvidenced:!priorException,
  ownerAcceptance:'DUAL_SIGNED_REASSESSMENT_EVIDENCE_ONLY_OPEN_HOLD',
  pendingReceiptDigest:p.recordDigest,responseReceiptDigest:receipt.recordDigest,
  renewalDigest:'c'.repeat(64),boundaryDigest:'d'.repeat(64),
  reportsDigest:'e'.repeat(64)};
 const auditId='ql452_outcome_audit_abc123',challengeNonce='ql452_fresh_nonce_abc123';
 const keys={source:key(),host:key(),anchor:key(),physical:key(),authority:key(),
  sourceOwner:key(),masterOwner:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql452.original-ql451-open-source.v1',
  incidentId:ID,ql451SummaryDigest:hash(prior),
  ql451ReceiptDigest:receipt.recordDigest,ql451RenewalDigest:prior.renewalDigest,
  originalClassification:prior.classification,incidentStatus:'OPEN_HOLD',
  observedAt:iso(now-13000)};
 const host={schema:'rosevear.ql452.original-host-response-outcome.v1',
  incidentId:ID,auditId,challengeNonce,ql451ReceiptDigest:receipt.recordDigest,
  sourceDigest:hash(source),originalHostId:'DESKTOP-AE894KC',
  responseOutcome:responseEffective?'SIGNED_RESPONSE_EFFECTIVE_UNDER_HOLD':
   'SIGNED_RESPONSE_UNRESOLVED_KEEP_HOLD',
  hostReceiverState:hostOn?'ON':'OFF',isolationLock:lock,
  leaseRevoked:lease,watchdogArmed:watchdog,hostSequence:100,
  reportedAt:iso(now-12000)};
 const anchor={schema:'rosevear.ql452.independent-outcome-anchor.v1',
  incidentId:ID,auditId,challengeNonce,ql451ReceiptDigest:receipt.recordDigest,
  sourceDigest:hash(source),hostOutcomeDigest:hash(host),
  anchorId:'ql452_independent_anchor_12345',anchorSequence:101,
  anchorDisposition:'HISTORICAL_OUTCOME_ONLY_NO_CLOSURE',
  anchoredAt:iso(now-11000)};
 const physical={schema:'rosevear.ql452.independent-physical-off-readback.v1',
  incidentId:ID,auditId,challengeNonce,ql451ReceiptDigest:receipt.recordDigest,
  anchorDigest:hash(anchor),signedHostOutcomeDigest:hash(host),
  originalHostId:'DESKTOP-AE894KC',receiverId:'ISOLATED_COMMS_RECEIVER',
  sensorId:'ql452_external_sensor_12345',
  independentPhysicalReadback:'SIGNED_EXTERNAL_SENSOR_OBSERVATION_ONLY',
  receiverState:sensorOn?'ON':'OFF',isolationConfirmed:independentIsolation,
  observerSequence:102,observedAt:iso(now-9000)};
 const safe=!hostOn&&!sensorOn&&responseEffective&&lock&&lease&&watchdog&&
  independentIsolation;
 const classification=safe?
  'SIGNED_HISTORICAL_PHYSICAL_OFF_RESPONSE_OUTCOME_AUDITED_OPEN':
  'SIGNED_RESPONSE_OUTCOME_OR_PHYSICAL_OFF_EXCEPTION_OPEN';
 const closureReviewDecision=safe?
  'REVERIFY_CLOSURE_PREREQUISITES_ONLY_KEEP_OPEN_HOLD':
  'ESCALATE_UNRESOLVED_PHYSICAL_OFF_EXCEPTION_KEEP_OPEN_HOLD';
 const outcomeDigest=hash({ql451SummaryDigest:hash(prior),auditId,challengeNonce,
  originalSourceDigest:hash(source),hostOutcomeDigest:hash(host),
  anchoredOutcomeDigest:hash(anchor),physicalReadbackDigest:hash(physical),
  classification});
 const authority={schema:'rosevear.ql452.independent-closure-authority.v1',
  incidentId:ID,auditId,ql451ReceiptDigest:receipt.recordDigest,
  outcomeDigest,classification,incidentStatus:'OPEN_HOLD',
  activationAuthorized:false,closureAuthorized:false,
  physicalReceiverCurrentlyOff:false,
  authorityDisposition:'REASSESSMENT_ONLY_NEW_SUPERVISED_PHYSICAL_CEREMONY_REQUIRED',
  attestedAt:iso(now-7000)};
 const authorityDigest=hash(authority);
 const votes=MASTERS.map(masterId=>({
  schema:'rosevear.ql452.three-master-closure-reverification.v1',
  incidentId:ID,auditId,masterId,ql451ReceiptDigest:receipt.recordDigest,
  outcomeDigest,authorityDigest,classification,closureReviewDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-5000)}));
 const owner={schema:'rosevear.ql452.dual-owner-closure-outcome-audit.v1',
  incidentId:ID,auditId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',
  ql451ReceiptDigest:receipt.recordDigest,
  outcomeDigest,authorityDigest,masterReportsDigest:hash(votes),
  classification,closureReviewDecision,incidentStatus:'OPEN_HOLD',
  reviewedAt:iso(now-3000)};
 const envelopes={source:signed(source,keys.source),
  host:signed(host,keys.host),anchor:signed(anchor,keys.anchor),
  physical:signed(physical,keys.physical),
  authority:signed(authority,keys.authority),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,
   sourceOwnerSignature:signed(owner,keys.sourceOwner).signature,
   masterOwnerSignature:signed(owner,keys.masterOwner).signature}};
 const calls={source:0,host:0,anchor:0,physical:0,authority:0,masters:0};
 const args={ql451Summary:prior,ql451Ledger,outcomeLedger,auditId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl451OutcomeSource:async()=>{calls.source++;return envelopes.source;}},
  originalHostProvider:{readSignedOriginalHostResponseOutcome:async()=>{calls.host++;return envelopes.host;}},
  independentAnchorProvider:{readSignedOutcomeAnchor:async()=>{calls.anchor++;return envelopes.anchor;}},
  independentPhysicalObserverProvider:{readSignedPhysicalOffReadback:async()=>{calls.physical++;return envelopes.physical;}},
  independentAuthorityProvider:{readSignedClosureAuthorityReverification:async()=>{calls.authority++;return envelopes.authority;}},
  threeMasterProvider:{readSignedClosureReviewVotes:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owners};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl451CustodyVerified:true,separateOwnerRolesVerified:true,
  independentSignerPinsVerified:true,independentPhysicalSensorEnrollmentVerified:true,
  commsSourcePin:keys.source.pin,originalHostPin:keys.host.pin,
  externalAnchorPin:keys.anchor.pin,independentPhysicalObserverPin:keys.physical.pin,
  independentAuthorityPin:keys.authority.pin,
  sourceOwnerPin:keys.sourceOwner.pin,masterOwnerPin:keys.masterOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,now,prior,ql451Ledger,outcomeLedger,auditId,challengeNonce,
  source,host,anchor,physical,authority,votes,owner,keys,envelopes,args,opts,calls,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.sourceOwner).signature,
   masterOwnerSignature:signed(v,keys.masterOwner).signature};},
  run:()=>runQl452OutcomeAudit(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(change,reason,settings={}){
 const f=fixture(settings);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.closureAuthorized,false);assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL452 independent fresh signed physical OFF and original-host outcome admit only OPEN/HOLD historical review',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL452_ORIGINAL_HOST_OUTCOME_AUDITED');
  assert.equal(r.physicalEvidenceFreshAtIntake,true);
  assert.equal(r.masterCount,3);assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.connection,'HOLD');assert.equal(r.closureAuthorized,false);
  assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl452Outcome(f.outcomeLedger,ID).state,
   'QL452_DURABLE_HISTORICAL_OFF_OUTCOME_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL452_ONE_USE_AUDIT_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,host:1,anchor:1,physical:1,authority:1,masters:1});
 }finally{f.cleanup();}
});
test('QL452 QL451 exception intake and signed corrective outcome do not authorize closure',async()=>{
 const f=fixture({priorException:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL452_ORIGINAL_HOST_OUTCOME_AUDITED');
  assert.equal(r.incidentStatus,'OPEN');assert.equal(r.closureAuthorized,false);
 }finally{f.cleanup();}
});
test('QL452 signed original-host unresolved, host ON, sensor ON, control failures escalate',async()=>{
 for(const config of [{responseEffective:false},{hostOn:true},{sensorOn:true},
  {lock:false},{lease:false},{watchdog:false},{independentIsolation:false}]){
  const f=fixture(config);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL452_ORIGINAL_HOST_OUTCOME_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_RESPONSE_OUTCOME_OR_PHYSICAL_OFF_EXCEPTION_OPEN');
   assert.equal(r.incidentStatus,'OPEN');assert.equal(r.closureAuthorized,false);
   assert.equal(readQl452Outcome(f.outcomeLedger,ID).state,
    'QL452_DURABLE_PHYSICAL_OFF_EXCEPTION_ESCALATED');
  }finally{f.cleanup();}
 }
});
test('QL452 exact QL451 receipts, OPEN/HOLD, challenge and signed sensor enrollment are required',async()=>{
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL452_EXACT_OPEN_QL451_OUTCOME_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.responseReceiptDigest='f'.repeat(64);},
  'QL452_EXACT_OPEN_QL451_OUTCOME_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL452_EXACT_OPEN_QL451_OUTCOME_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.independentPhysicalSensorEnrollmentVerified=false;},
  'QL452_EXACT_OPEN_QL451_OUTCOME_AND_NEW_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.independentPhysicalObserverPin=f.opts.originalHostPin;},
  'QL452_TEN_DISTINCT_SIGNER_PINS_REQUIRED');
});
test('QL452 original Comms QL451 source must match exact signed incident and fresh observation',async()=>{
 await rejected(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL452_ORIGINAL_CASE_SOURCE_INVALID');
 await rejected(f=>{f.envelopes.source=signed({...f.source,
  observedAt:iso(f.now-65000)},f.keys.source);},
  'QL452_ORIGINAL_CASE_SOURCE_INVALID');
 await rejected(f=>{f.args.originalCommsSourceProvider.readSignedQl451OutcomeSource=
  async()=>{throw Error('offline');};},'QL452_ORIGINAL_QL451_SOURCE_UNAVAILABLE');
});
test('QL452 original Windows host signed outcome, lock and signed provenance cannot be substituted',async()=>{
 await rejected(f=>{f.envelopes.host=signed({...f.host,
  originalHostId:'TEMPLAR'},f.keys.host);},
  'QL452_ORIGINAL_HOST_RESPONSE_OUTCOME_INVALID');
 await rejected(f=>{f.envelopes.host=signed({...f.host,
  responseOutcome:'AUTOMATIC_CLOSURE'},f.keys.host);},
  'QL452_ORIGINAL_HOST_RESPONSE_OUTCOME_INVALID');
 await rejected(f=>{f.envelopes.host.signature=f.envelopes.source.signature;},
  'QL452_ORIGINAL_HOST_RESPONSE_OUTCOME_INVALID');
 await rejected(f=>{f.args.originalHostProvider.readSignedOriginalHostResponseOutcome=
  async()=>{throw Error('offline');};},'QL452_ORIGINAL_HOST_RESPONSE_OUTCOME_UNAVAILABLE');
});
test('QL452 independent anchored host outcome binds exact QL451, host and nonce',async()=>{
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  hostOutcomeDigest:'f'.repeat(64)},f.keys.anchor);},
  'QL452_SIGNED_OUTCOME_ANCHOR_INVALID');
 await rejected(f=>{f.envelopes.anchor=signed({...f.anchor,
  anchorDisposition:'CLOSED'},f.keys.anchor);},
  'QL452_SIGNED_OUTCOME_ANCHOR_INVALID');
 await rejected(f=>{f.envelopes.anchor.signature=f.envelopes.host.signature;},
  'QL452_SIGNED_OUTCOME_ANCHOR_INVALID');
});
test('QL452 physically independent signer enforces <=15s observation freshness and host binding',async()=>{
 await rejected(f=>{f.envelopes.physical=signed({...f.physical,
  observedAt:iso(f.now-16000)},f.keys.physical);},
  'QL452_INDEPENDENT_PHYSICAL_OFF_FRESHNESS_INVALID');
 await rejected(f=>{f.envelopes.physical=signed({...f.physical,
  signedHostOutcomeDigest:'f'.repeat(64)},f.keys.physical);},
  'QL452_INDEPENDENT_PHYSICAL_OFF_FRESHNESS_INVALID');
 await rejected(f=>{f.envelopes.physical=signed({...f.physical,
  originalHostId:'TEMPLAR'},f.keys.physical);},
  'QL452_INDEPENDENT_PHYSICAL_OFF_FRESHNESS_INVALID');
 await rejected(f=>{f.envelopes.physical=signed({...f.physical,
  observerSequence:101},f.keys.physical);},
  'QL452_INDEPENDENT_PHYSICAL_OFF_FRESHNESS_INVALID');
 await rejected(f=>{f.envelopes.physical.signature=f.envelopes.anchor.signature;},
  'QL452_INDEPENDENT_PHYSICAL_OFF_FRESHNESS_INVALID');
});
test('QL452 distinct independent authority cannot claim physical OFF now, activate or close',async()=>{
 await rejected(f=>{f.envelopes.authority=signed({...f.authority,
  physicalReceiverCurrentlyOff:true},f.keys.authority);},
  'QL452_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.authority=signed({...f.authority,
  activationAuthorized:true},f.keys.authority);},
  'QL452_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.authority=signed({...f.authority,
  closureAuthorized:true},f.keys.authority);},
  'QL452_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
 await rejected(f=>{f.envelopes.authority.signature=f.envelopes.physical.signature;},
  'QL452_INDEPENDENT_CLOSURE_AUTHORITY_VETO');
});
test('QL452 three distinct Master closure authority re-verifications are mandatory',async()=>{
 await rejected(f=>{f.envelopes.votes.pop();},
  'QL452_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 await rejected(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL452_THREE_MASTER_CLOSURE_VETO');
 await rejected(f=>{f.envelopes.votes[2]=signed({...f.votes[2],
  closureReviewDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL452_THREE_MASTER_CLOSURE_VETO');
});
test('QL452 dual signed owners cannot override independent boundary or approve closure',async()=>{
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL452_DUAL_OWNER_CLOSURE_REASSESSMENT_VETO');
 await rejected(f=>{f.setOwners({...f.owner,
  closureReviewDecision:'ACTIVATE'});},
  'QL452_DUAL_OWNER_CLOSURE_REASSESSMENT_VETO');
 await rejected(f=>{f.setOwners({...f.owner,
  masterOwnerId:f.owner.sourceOwnerId});},
  'QL452_DUAL_OWNER_CLOSURE_REASSESSMENT_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},
  'QL452_DUAL_OWNER_CLOSURE_REASSESSMENT_VETO');
});
test('QL452 interrupted original source preserves PENDING without automatic replay',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl451OutcomeSource=async()=>{
   throw Error('offline');};
  assert.equal((await f.run()).reason,'QL452_ORIGINAL_QL451_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL452_ONE_USE_AUDIT_ALREADY_ATTEMPTED');
  assert.equal(readQl452Outcome(f.outcomeLedger,ID).reason,
   'QL452_PENDING_SUPERVISED_RECOVERY_REQUIRED');
 }finally{f.cleanup();}
});
test('QL452 private receipt tamper, unsafe path and mismatched custody HOLD',async()=>{
 const f=fixture();try{
  f.outcomeLedger.claimOnce('pending',ID,'a'.repeat(64));
  writeFileSync(join(f.root,'ql452','ql452-pending-'+ID+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL452_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl452Outcome(f.outcomeLedger,ID).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl452OutcomeLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
