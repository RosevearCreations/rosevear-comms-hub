import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl445PostClosureLedger} from './ql445-postclosure-off-stability.mjs';
import {openQl446ProtectedEscalationLedger,readQl446Escalation,
 runQl446ProtectedReopening} from './ql446-protected-recurrence-escalation.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 k.privateKey).toString('base64')});
const iso=x=>new Date(x).toISOString();
const id='ql446_incident_123456789',masters=MASTERS;
function fixture({priorRecurrence=false,newOn=false,divergent=false}={}){
 const now=Date.now()-1000,root=mkdtempSync(join(tmpdir(),'ql446-'));
 const ql445Ledger=openQl445PostClosureLedger(join(root,'ql445'));
 const escalationLedger=openQl446ProtectedEscalationLedger(join(root,'ql446'));
 const pendingPrior=ql445Ledger.claimOnce('pending',id,'a'.repeat(64));
 const priorKind=priorRecurrence?'recurrence':'stable';
 const priorProof=ql445Ledger.claimOnce(priorKind,id,'b'.repeat(64));
 const prior={state:priorRecurrence?'DURABLE_QL445_SIGNED_ON_RECURRENCE_INCIDENT_OPEN':
   'DURABLE_QL445_POSTCLOSURE_OFF_STABILITY_EVIDENCE_ADMITTED',
  connection:'HOLD',activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  originalIncidentId:id,watchId:'watch_ql445_123456',watchNonce:'nonce_ql445_123456',
  masterCount:3,recurrenceDetected:priorRecurrence,
  pendingReceiptDigest:pendingPrior.recordDigest,
  postClosureWatchDigest:'c'.repeat(64),masterReportsDigest:'d'.repeat(64),
  ...{[priorRecurrence?'recurrenceReceiptDigest':'stabilityReceiptDigest']:priorProof.recordDigest}};
 const keys={source:key(),host:key(),observer:key(),officer:key(),owner:key(),reviewer:key(),
  masters:Object.fromEntries(masters.map(m=>[m,key()]))};
 const challengeNonce='ql446_new_nonce_abcde';
 const source={schema:'rosevear.ql446.original-ql445-source-custody.v1',
  incidentId:id,ql445SummaryDigest:hash(prior),ql445ReceiptDigest:priorProof.recordDigest,
  priorWatchDigest:prior.postClosureWatchDigest,
  priorClassification:priorRecurrence?'SIGNED_ON_RECURRENCE_REOPEN':
   'RECONCILED_HISTORICAL_OFF_STABILITY_ONLY',observedAt:iso(now-24000)};
 const times=[[-20000,-19000],[-13000,-12000],[-8000,-7000]];
 let prevDigest=prior.postClosureWatchDigest;
 const hosts=[],witnesses=[];
 for(let i=0;i<3;i++){
  const state=(i===1&&newOn)?'ON':'OFF';
  const host={schema:'rosevear.ql446.original-host-horizon-probe.v1',
   incidentId:id,challengeNonce,horizon:['SHORT','MEDIUM','LONG'][i],
   sampleIndex:i+1,originalHostId:'DESKTOP-AE894KC',ql445SummaryDigest:hash(prior),
   previousDigest:prevDigest,receiverState:state,watchdogArmed:true,
   hostSequence:100+i*2,observedAt:iso(now+times[i][0])};
  const witness={schema:'rosevear.ql446.independent-receiver-horizon-proof.v1',
   incidentId:id,challengeNonce,horizon:host.horizon,sampleIndex:host.sampleIndex,
   ql445SummaryDigest:hash(prior),signedHostDigest:hash(host),
   previousDigest:prevDigest,receiverState:(i===1&&divergent)?'ON':state,
   observerSequence:101+i*2,observedAt:iso(now+times[i][1])};
  hosts.push(host);witnesses.push(witness);prevDigest=hash(witness);
 }
 const classification=divergent?'SIGNED_STATE_DIVERGENCE_SAFETY_ESCALATION':
  (priorRecurrence||newOn)?'SIGNED_RECURRENCE_ESCALATE_REOPEN':
   'RECONCILED_MULTI_HORIZON_OFF_HISTORICAL_ONLY';
 const escalated=classification!=='RECONCILED_MULTI_HORIZON_OFF_HISTORICAL_ONLY';
 const decision=escalated?'REOPEN_INCIDENT_KEEP_HOLD_REQUIRE_INDEPENDENT_ISOLATION':
  'ACCEPT_MULTI_HORIZON_OFF_EVIDENCE_KEEP_HOLD';
 const watchDigest=hash({ql445SummaryDigest:hash(prior),challengeNonce,
  hostDigests:hosts.map(hash),observerDigests:witnesses.map(hash),classification});
 const escalation={schema:'rosevear.ql446.independent-officer-recurrence-escalation.v1',
  incidentId:id,reopeningCaseId:'ql446_reopen_case_abc',
  ql445ReceiptDigest:priorProof.recordDigest,multiHorizonWatchDigest:watchDigest,
  sourceEvidenceDigest:hash(source),severity:'RECEIVER_SAFETY_CRITICAL_RECHECK',
  decision:'OPEN_PROTECTED_INCIDENT_KEEP_OFF_ISOLATION',observedAt:iso(now-6000)};
 const votes=masters.map(masterId=>({schema:'rosevear.ql446.three-master-reopening-decision.v1',
  incidentId:id,masterId,ql445ReceiptDigest:priorProof.recordDigest,
  multiHorizonWatchDigest:watchDigest,escalationDigest:escalated?hash(escalation):null,
  classification,decision,reviewedAt:iso(now-5000)}));
 const owner={schema:'rosevear.ql446.dual-owner-reopening-gate.v1',
  incidentId:id,sourceOwnerId:'Ree_Original',masterOwnerId:'Jack_Independent',
  ql445ReceiptDigest:priorProof.recordDigest,multiHorizonWatchDigest:watchDigest,
  escalationDigest:escalated?hash(escalation):null,masterReportsDigest:hash(votes),
  classification,decision,reviewedAt:iso(now-4000)};
 const envelopes={source:signed(source,keys.source),
  hosts:hosts.map(p=>signed(p,keys.host)),
  witnesses:witnesses.map(p=>signed(p,keys.observer)),
  escalation:signed(escalation,keys.officer),
  votes:votes.map(p=>signed(p,keys.masters[p.masterId])),
  owner:{payload:owner,
   sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.reviewer).signature}};
 const calls={source:0,host:0,receiver:0,officer:0,masters:0};
 const args={ql445Summary:prior,ql445Ledger,escalationLedger,challengeNonce,
  originalCommsSourceProvider:{readSignedQl445Source:async()=>{calls.source++;return envelopes.source;}},
  originalHostProvider:{readSignedHorizonSamples:async()=>{calls.host++;return envelopes.hosts;}},
  independentObserverProvider:{readSignedHorizonObservations:async()=>{calls.receiver++;return envelopes.witnesses;}},
  signedEscalationProvider:{readSignedReopeningEscalation:async()=>{calls.officer++;return envelopes.escalation;}},
  threeMasterProvider:{readSignedHorizonDecisions:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owner};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl445CustodyVerified:true,separateOwnerRolesVerified:true,
  independentSignerPinsVerified:true,commsSourcePin:keys.source.pin,
  originalHostPin:keys.host.pin,independentReceiverPin:keys.observer.pin,
  escalationOfficerPin:keys.officer.pin,sourceOwnerPin:keys.owner.pin,
  masterOwnerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(masters.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,prior,ql445Ledger,escalationLedger,keys,source,hosts,witnesses,
  escalation,votes,owner,envelopes,args,opts,calls,watchDigest,escalated,
  setOwner(p){envelopes.owner={payload:p,
   sourceOwnerSignature:signed(p,keys.owner).signature,
   masterOwnerSignature:signed(p,keys.reviewer).signature};args.finalOwnerDecision=envelopes.owner;},
  run:()=>runQl446ProtectedReopening(args,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
async function reject(change,expected,opt={}){
 const f=fixture(opt);try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);
  assert.equal(r.reason,expected);assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL446 stable QL445 -> three signed horizons, historical OFF evidence only',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL446_MULTI_HORIZON_OFF_EVIDENCE_ACCEPTED');
  assert.equal(r.recurrenceDetected,false);assert.equal(r.masterCount,3);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl446Escalation(f.escalationLedger,id).state,
   'QL446_DURABLE_MULTI_HORIZON_OFF_EVIDENCE_ONLY');
  assert.equal((await f.run()).reason,'QL446_ONE_USE_REOPENING_ALREADY_ATTEMPTED');
  assert.equal(f.calls.source,1);assert.equal(f.calls.officer,0);
 }finally{f.cleanup();}
});
test('QL446 existing QL445 recurrence remains escalated even when later three OFF samples agree',async()=>{
 const f=fixture({priorRecurrence:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL446_RECURRENCE_REOPENING_CASE_OPEN');
  assert.equal(r.classification,'SIGNED_RECURRENCE_ESCALATE_REOPEN');
  assert.equal(r.recurrenceDetected,true);
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_PROTECTED_REOPENING_ONLY');
  assert.equal(r.activationAuthorized,false);assert.equal(r.connection,'HOLD');
  assert.equal(readQl446Escalation(f.escalationLedger,id).state,
   'QL446_DURABLE_REOPENING_ESCALATION_CASE_OPEN');
 }finally{f.cleanup();}
});
test('QL446 new agreed ON during MEDIUM horizon escalates independently and keeps HOLD',async()=>{
 const f=fixture({newOn:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL446_RECURRENCE_REOPENING_CASE_OPEN');
  assert.equal(r.recurrenceDetected,true);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
});
test('QL446 contradictory host OFF and independent receiver ON escalates rather than stable',async()=>{
 const f=fixture({divergent:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL446_RECURRENCE_REOPENING_CASE_OPEN');
  assert.equal(r.classification,'SIGNED_STATE_DIVERGENCE_SAFETY_ESCALATION');
 }finally{f.cleanup();}
});
test('QL446 exact QL445 signed custody, independent original host and distinct keys are required',async()=>{
 await reject(f=>{f.prior.pendingReceiptDigest='0'.repeat(64);},'QL446_EXACT_QL445_AND_PROTECTED_HORIZON_CHALLENGE_REQUIRED');
 await reject(f=>{f.opts.trustedClockVerified=false;},'QL446_EXACT_QL445_AND_PROTECTED_HORIZON_CHALLENGE_REQUIRED');
 await reject(f=>{f.args.challengeNonce=f.prior.watchNonce;},'QL446_EXACT_QL445_AND_PROTECTED_HORIZON_CHALLENGE_REQUIRED');
 await reject(f=>{f.opts.originalHostPin=f.opts.independentReceiverPin;},'QL446_INDEPENDENT_DISTINCT_SIGNERS_REQUIRED');
});
test('QL446 rejects forged or stale signed original Comms QL445 source',async()=>{
 await reject(f=>{f.envelopes.source.payload.ql445ReceiptDigest='0'.repeat(64);},'QL446_SIGNED_QL445_SOURCE_CUSTODY_MISMATCH');
 await reject(f=>{f.envelopes.source=signed({...f.source,observedAt:iso(f.now-65000)},f.keys.source);},'QL446_SIGNED_QL445_SOURCE_CUSTODY_MISMATCH');
 await reject(f=>{f.args.originalCommsSourceProvider.readSignedQl445Source=async()=>{throw Error('offline');};},'QL446_SIGNED_QL445_ORIGINAL_SOURCE_UNAVAILABLE');
});
test('QL446 original Windows host must be original, signed, protected and monotonic',async()=>{
 await reject(f=>{f.envelopes.hosts[0]=signed({...f.hosts[0],originalHostId:'TEMPLAR'},f.keys.host);},'QL446_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],watchdogArmed:false},f.keys.host);},'QL446_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],hostSequence:100},f.keys.host);},'QL446_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.hosts[2]=signed({...f.hosts[2],challengeNonce:'replayed_abcde1234'},f.keys.host);},'QL446_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
});
test('QL446 multi-horizon genuinely spans SHORT, MEDIUM 4s and LONG 10s',async()=>{
 await reject(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],observedAt:iso(f.now-18000)},f.keys.host);},'QL446_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.hosts[2]=signed({...f.hosts[2],observedAt:iso(f.now-11001)},f.keys.host);},'QL446_ORIGINAL_HOST_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.hosts.pop();},'QL446_THREE_HORIZONS_WITH_DISTINCT_ATTESTATIONS_REQUIRED');
 await reject(f=>{f.envelopes.witnesses.pop();},'QL446_THREE_HORIZONS_WITH_DISTINCT_ATTESTATIONS_REQUIRED');
});
test('QL446 rejects missing, regressed, unsigned or out-of-order independent observers',async()=>{
 await reject(f=>{f.envelopes.witnesses[1]=signed({...f.witnesses[1],previousDigest:'f'.repeat(64)},f.keys.observer);},'QL446_INDEPENDENT_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.witnesses[2]=signed({...f.witnesses[2],observerSequence:103},f.keys.observer);},'QL446_INDEPENDENT_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.witnesses[1]=signed({...f.witnesses[1],signedHostDigest:'e'.repeat(64)},f.keys.observer);},'QL446_INDEPENDENT_SIGNED_HORIZON_INVALID');
 await reject(f=>{f.envelopes.witnesses[0].signature=f.envelopes.hosts[0].signature;},'QL446_INDEPENDENT_SIGNED_HORIZON_INVALID');
});
test('QL446 recurrence cannot reopen without independently signed severity/cause escalation',async()=>{
 await reject(f=>{f.args.signedEscalationProvider.readSignedReopeningEscalation=async()=>{throw Error('down');};},'QL446_EXTERNAL_SIGNED_RECURRENCE_ESCALATION_UNAVAILABLE',{newOn:true});
 await reject(f=>{f.envelopes.escalation=signed({...f.escalation,severity:'LOW'},f.keys.officer);},'QL446_INDEPENDENT_RECURRENCE_ESCALATION_INVALID',{newOn:true});
 await reject(f=>{f.envelopes.escalation=signed({...f.escalation,decision:'CLOSE_NOW'},f.keys.officer);},'QL446_INDEPENDENT_RECURRENCE_ESCALATION_INVALID',{newOn:true});
 await reject(f=>{f.envelopes.escalation.signature=f.envelopes.source.signature;},'QL446_INDEPENDENT_RECURRENCE_ESCALATION_INVALID',{newOn:true});
});
test('QL446 all three independent Master votes must bind exact classification and reopening decision',async()=>{
 await reject(f=>{f.envelopes.votes.pop();},'QL446_THREE_MASTER_RESPONSES_REQUIRED');
 await reject(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},'QL446_THREE_MASTER_SIGNED_REOPENING_VETO');
 await reject(f=>{f.envelopes.votes[0]=signed({...f.votes[0],decision:'CONNECT_NOW'},f.keys.masters[MASTERS[0]]);},'QL446_THREE_MASTER_SIGNED_REOPENING_VETO');
 await reject(f=>{f.envelopes.votes[2]=signed({...f.votes[2],multiHorizonWatchDigest:'0'.repeat(64)},f.keys.masters[MASTERS[2]]);},'QL446_THREE_MASTER_SIGNED_REOPENING_VETO');
});
test('QL446 final source and Master owner must sign identical gate, cannot CONNECT',async()=>{
 await reject(f=>{f.setOwner({...f.owner,decision:'CONNECTED'});},'QL446_INDEPENDENT_DUAL_OWNER_REOPENING_DECISION_REJECTED');
 await reject(f=>{f.setOwner({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},'QL446_INDEPENDENT_DUAL_OWNER_REOPENING_DECISION_REJECTED');
 await reject(f=>{f.args.finalOwnerDecision.masterOwnerSignature=f.args.finalOwnerDecision.sourceOwnerSignature;},'QL446_INDEPENDENT_DUAL_OWNER_REOPENING_DECISION_REJECTED');
});
test('QL446 interrupted external intake burns one-use pending and never falsely reports stable',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl445Source=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL446_SIGNED_QL445_ORIGINAL_SOURCE_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL446_ONE_USE_REOPENING_ALREADY_ATTEMPTED');
  assert.equal(readQl446Escalation(f.escalationLedger,id).reason,
   'QL446_PENDING_REQUIRES_MANUAL_RECOVERY');
 }finally{f.cleanup();}
});
test('QL446 tampered ledger always HOLD, and absolute protected directory required',async()=>{
 const f=fixture();try{
  f.escalationLedger.claimOnce('pending',id,'a'.repeat(64));
  writeFileSync(join(f.root,'ql446','ql446-pending-'+id+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL446_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl446Escalation(f.escalationLedger,id).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl446ProtectedEscalationLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
