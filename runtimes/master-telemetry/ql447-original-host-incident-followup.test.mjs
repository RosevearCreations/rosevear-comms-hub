import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl446ProtectedEscalationLedger} from './ql446-protected-recurrence-escalation.mjs';
import {openQl447IncidentLedger,readQl447IncidentFollowUp,
 runQl447IncidentFollowUp} from './ql447-original-host-incident-followup.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signPayload=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 k.privateKey).toString('base64')});
const iso=x=>new Date(x).toISOString();
const id='ql447_incident_abcdefgh';
function fixture({hostState='OFF',observerState='OFF',lock=true,revoked=true,
 watchdog=true,observedIsolation=true}={}){
 const now=Date.now()-500,root=mkdtempSync(join(tmpdir(),'ql447-'));
 const ql446Ledger=openQl446ProtectedEscalationLedger(join(root,'ql446'));
 const incidentLedger=openQl447IncidentLedger(join(root,'ql447'));
 const pending=ql446Ledger.claimOnce('pending',id,'a'.repeat(64));
 const escalation=ql446Ledger.claimOnce('escalation',id,'b'.repeat(64));
 const prior={state:'DURABLE_QL446_RECURRENCE_REOPENING_CASE_OPEN',
  connection:'HOLD',activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  masterCount:3,recurrenceDetected:true,originalIncidentId:id,
  challengeNonce:'ql446_challenge_abc123',
  classification:'SIGNED_RECURRENCE_ESCALATE_REOPEN',
  pendingReceiptDigest:pending.recordDigest,escalationReceiptDigest:escalation.recordDigest,
  watchDigest:'c'.repeat(64),masterReportsDigest:'d'.repeat(64)};
 const challengeNonce='ql447_challenge_xyz123',followUpId='ql447_followup_abcd1234';
 const keys={source:key(),host:key(),observer:key(),sourceOwner:key(),
  masterOwner:key(),masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql447.original-source-recurrence-incident.v1',
  incidentId:id,ql446SummaryDigest:hash(prior),
  ql446EscalationReceiptDigest:escalation.recordDigest,
  priorClassification:prior.classification,incidentStatus:'OPEN_HOLD',
  observedAt:iso(now-4000)};
 const host={schema:'rosevear.ql447.original-host-isolation-reconfirmation.v1',
  incidentId:id,originalHostId:'DESKTOP-AE894KC',challengeNonce,
  ql446EscalationReceiptDigest:escalation.recordDigest,sourceDigest:hash(source),
  receiverState:hostState,isolationLock:lock,leaseRevoked:revoked,
  watchdogArmed:watchdog,hostSequence:10,observedAt:iso(now-3000)};
 const witness={schema:'rosevear.ql447.independent-isolation-readback.v1',
  incidentId:id,challengeNonce,ql446EscalationReceiptDigest:escalation.recordDigest,
  signedHostDigest:hash(host),receiverState:observerState,
  isolationConfirmed:observedIsolation,observerSequence:11,observedAt:iso(now-2000)};
 const confirmed=hostState==='OFF'&&observerState==='OFF'&&lock&&revoked&&
  watchdog&&observedIsolation;
 const classification=confirmed?'SIGNED_HISTORICAL_ISOLATION_RECONFIRMED_INCIDENT_OPEN':
  'SIGNED_ISOLATION_RECONFIRMATION_EXCEPTION_INCIDENT_OPEN';
 const correctiveDecision=confirmed?
  'CONTINUE_MANUAL_ISOLATION_MONITORING_KEEP_INCIDENT_OPEN':
  'ESCALATE_ISOLATION_FAILURE_FOR_SUPERVISED_CORRECTION_KEEP_OPEN';
 const evidenceDigest=hash({ql446SummaryDigest:hash(prior),challengeNonce,followUpId,
  sourceDigest:hash(source),hostDigest:hash(host),observerDigest:hash(witness),classification});
 const votes=MASTERS.map(masterId=>({schema:'rosevear.ql447.three-master-corrective-followup.v1',
  incidentId:id,followUpId,masterId,ql446EscalationReceiptDigest:escalation.recordDigest,
  isolationEvidenceDigest:evidenceDigest,classification,correctiveDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-1000)}));
 const owner={schema:'rosevear.ql447.dual-owner-corrective-handoff.v1',
  incidentId:id,followUpId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Separate_Master_Owner',
  ql446EscalationReceiptDigest:escalation.recordDigest,isolationEvidenceDigest:evidenceDigest,
  masterReportsDigest:hash(votes),classification,correctiveDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-500)};
 const envelopes={source:signPayload(source,keys.source),host:signPayload(host,keys.host),
  witness:signPayload(witness,keys.observer),
  votes:votes.map(x=>signPayload(x,keys.masters[x.masterId])),
  owner:{payload:owner,
   sourceOwnerSignature:signPayload(owner,keys.sourceOwner).signature,
   masterOwnerSignature:signPayload(owner,keys.masterOwner).signature}};
 const calls={source:0,host:0,witness:0,masters:0};
 const args={ql446Summary:prior,ql446Ledger,incidentLedger,challengeNonce,followUpId,
  originalCommsSourceProvider:{readSignedRecurrenceIncident:async()=>{calls.source++;return envelopes.source;}},
  originalHostProvider:{readSignedIsolationReconfirmation:async()=>{calls.host++;return envelopes.host;}},
  independentObserverProvider:{readSignedIsolationReadback:async()=>{calls.witness++;return envelopes.witness;}},
  threeMasterProvider:{readSignedCorrectiveFollowUps:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owner};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl446CustodyVerified:true,separateOwnerRolesVerified:true,
  independentSignerPinsVerified:true,commsSourcePin:keys.source.pin,
  originalHostPin:keys.host.pin,independentReceiverPin:keys.observer.pin,
  sourceOwnerPin:keys.sourceOwner.pin,masterOwnerPin:keys.masterOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,now,prior,ql446Ledger,incidentLedger,challengeNonce,followUpId,
  source,host,witness,votes,owner,keys,envelopes,args,opts,calls,
  run:()=>runQl447IncidentFollowUp(args,opts),
  setOwner(x){args.finalOwnerDecision={payload:x,
   sourceOwnerSignature:signPayload(x,keys.sourceOwner).signature,
   masterOwnerSignature:signPayload(x,keys.masterOwner).signature};},
  cleanup(){rmSync(root,{recursive:true,force:true});}};
}
async function reject(change,expected,fixtureOptions={}){
 const f=fixture(fixtureOptions);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,expected);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.incidentStatus,'OPEN');
 }finally{f.cleanup();}
}
test('QL447 original-host signed isolation and three-Master follow-up admit historical evidence, never close incident',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL447_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY');
  assert.equal(r.masterCount,3);assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.activationAuthorized,false);assert.equal(r.connection,'HOLD');
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl447IncidentFollowUp(f.incidentLedger,id).state,
   'QL447_DURABLE_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY');
  assert.equal((await f.run()).reason,'QL447_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,host:1,witness:1,masters:1});
 }finally{f.cleanup();}
});
test('QL447 signed host ON or independent receiver ON escalates, never reconfirms OFF',async()=>{
 for(const options of [{hostState:'ON'},{observerState:'ON'},{lock:false},
  {revoked:false},{watchdog:false},{observedIsolation:false}]){
  const f=fixture(options);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL447_ISOLATION_EXCEPTION_CORRECTIVE_FOLLOWUP_OPEN');
   assert.equal(r.classification,'SIGNED_ISOLATION_RECONFIRMATION_EXCEPTION_INCIDENT_OPEN');
   assert.equal(r.incidentStatus,'OPEN');assert.equal(r.physicalReceiverCurrentlyOff,false);
   assert.equal(readQl447IncidentFollowUp(f.incidentLedger,id).state,
    'QL447_DURABLE_ISOLATION_EXCEPTION_ESCALATED');
  }finally{f.cleanup();}
 }
});
test('QL447 only consumes exact QL446 reopened case and protected one-use custody',async()=>{
 await reject(f=>{f.prior.state='DURABLE_QL446_MULTI_HORIZON_OFF_EVIDENCE_ACCEPTED';},
  'QL447_EXACT_REOPENED_QL446_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await reject(f=>{f.prior.escalationReceiptDigest='f'.repeat(64);},
  'QL447_EXACT_REOPENED_QL446_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await reject(f=>{f.args.challengeNonce=f.prior.challengeNonce;},
  'QL447_EXACT_REOPENED_QL446_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await reject(f=>{f.opts.independentQl446CustodyVerified=false;},
  'QL447_EXACT_REOPENED_QL446_CASE_AND_FRESH_CHALLENGE_REQUIRED');
 await reject(f=>{f.opts.originalHostPin=f.opts.independentReceiverPin;},
  'QL447_DISTINCT_INDEPENDENT_SIGNER_PINS_REQUIRED');
});
test('QL447 rejects forged and stale original source and wrong original host',async()=>{
 await reject(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL447_SIGNED_ORIGINAL_INCIDENT_INVALID');
 await reject(f=>{f.envelopes.source=signPayload({...f.source,
  observedAt:iso(f.now-62000)},f.keys.source);},'QL447_SIGNED_ORIGINAL_INCIDENT_INVALID');
 await reject(f=>{f.envelopes.host=signPayload({...f.host,
  originalHostId:'TEMPLAR'},f.keys.host);},'QL447_SIGNED_ORIGINAL_HOST_ISOLATION_INVALID');
 await reject(f=>{f.envelopes.host=signPayload({...f.host,
  challengeNonce:'replayed_nonce_abc'},f.keys.host);},'QL447_SIGNED_ORIGINAL_HOST_ISOLATION_INVALID');
});
test('QL447 rejects forged, regressed and missing independent isolation confirmation',async()=>{
 await reject(f=>{f.envelopes.witness.payload.observerSequence=10;},
  'QL447_SIGNED_INDEPENDENT_ISOLATION_INVALID');
 await reject(f=>{f.envelopes.witness=signPayload({...f.witness,
  signedHostDigest:'0'.repeat(64)},f.keys.observer);},
  'QL447_SIGNED_INDEPENDENT_ISOLATION_INVALID');
 await reject(f=>{f.args.independentObserverProvider.readSignedIsolationReadback=async()=>{
  throw Error('offline');};},'QL447_INDEPENDENT_ISOLATION_OBSERVER_UNAVAILABLE');
});
test('QL447 requires three distinct signed corrective Master decisions and independent owners',async()=>{
 await reject(f=>{f.envelopes.votes.pop();},
  'QL447_THREE_MASTER_CORRECTIVE_REVIEWS_REQUIRED');
 await reject(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL447_THREE_MASTER_SIGNED_CORRECTIVE_VETO');
 await reject(f=>{f.envelopes.votes[0]=signPayload({...f.votes[0],
  incidentStatus:'CLOSED'},f.keys.masters[MASTERS[0]]);},
  'QL447_THREE_MASTER_SIGNED_CORRECTIVE_VETO');
 await reject(f=>{f.setOwner({...f.owner,incidentStatus:'CLOSED'});},
  'QL447_DUAL_OWNER_CORRECTIVE_FOLLOWUP_VETO');
 await reject(f=>{f.setOwner({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},
  'QL447_DUAL_OWNER_CORRECTIVE_FOLLOWUP_VETO');
 await reject(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},
  'QL447_DUAL_OWNER_CORRECTIVE_FOLLOWUP_VETO');
});
test('QL447 interrupted signed source permanently holds pending, replay never bypasses',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedRecurrenceIncident=async()=>{
   throw Error('offline');};
  assert.equal((await f.run()).reason,'QL447_ORIGINAL_REOPENED_INCIDENT_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL447_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
  assert.equal(readQl447IncidentFollowUp(f.incidentLedger,id).reason,
   'QL447_PENDING_REQUIRES_SUPERVISED_RECOVERY');
 }finally{f.cleanup();}
});
test('QL447 corrupt or insecure ledger never approves follow-up',async()=>{
 const f=fixture();try{
  f.incidentLedger.claimOnce('pending',id,'a'.repeat(64));
  writeFileSync(join(f.root,'ql447','ql447-pending-'+id+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL447_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl447IncidentFollowUp(f.incidentLedger,id).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl447IncidentLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
