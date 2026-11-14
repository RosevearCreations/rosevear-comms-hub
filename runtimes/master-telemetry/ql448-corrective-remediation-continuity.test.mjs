import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl447IncidentLedger} from './ql447-original-host-incident-followup.mjs';
import {openQl448RemediationLedger,readQl448Remediation,
 runQl448CorrectiveReview} from './ql448-corrective-remediation-continuity.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>new Date(x).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const id='ql448_original_incident_123456';
function fixture({priorException=true,hostOn=false,witnessOn=false,lock=true,
 lease=true,watchdog=true,observerIsolation=true,remComplete=true}={}){
 const now=Date.now()-500,root=mkdtempSync(join(tmpdir(),'ql448-'));
 const ql447Ledger=openQl447IncidentLedger(join(root,'ql447'));
 const remediationLedger=openQl448RemediationLedger(join(root,'ql448'));
 const p=ql447Ledger.claimOnce('pending',id,'a'.repeat(64));
 const q=ql447Ledger.claimOnce(priorException?'exception':'reconfirmed',id,'b'.repeat(64));
 const prior={state:priorException?'DURABLE_QL447_ISOLATION_EXCEPTION_CORRECTIVE_FOLLOWUP_OPEN':
   'DURABLE_QL447_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY',
  connection:'HOLD',activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  incidentStatus:'OPEN',masterCount:3,originalIncidentId:id,
  followUpId:'ql447_original_followup_1234',
  ownerAcceptance:'DUAL_SIGNED_CORRECTIVE_FOLLOWUP_KEEP_OPEN',
  classification:priorException?'SIGNED_ISOLATION_RECONFIRMATION_EXCEPTION_INCIDENT_OPEN':
   'SIGNED_HISTORICAL_ISOLATION_RECONFIRMED_INCIDENT_OPEN',
  isolationEvidenceDigest:'c'.repeat(64),masterReportsDigest:'d'.repeat(64),
  pendingReceiptDigest:p.recordDigest,followUpReceiptDigest:q.recordDigest};
 const challengeNonce='ql448_new_nonce_abcde12345';
 const remediationId='ql448_remediation_abc12345';
 const keys={source:key(),officer:key(),host:key(),receiver:key(),
  owner:key(),otherOwner:key(),masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const source={schema:'rosevear.ql448.original-ql447-source.v1',incidentId:id,
  ql447SummaryDigest:hash(prior),ql447ReceiptDigest:q.recordDigest,
  priorClassification:prior.classification,incidentStatus:'OPEN_HOLD',
  observedAt:iso(now-54000)};
 const remediation={schema:'rosevear.ql448.independent-corrective-remediation.v1',
  incidentId:id,remediationId,ql447SummaryDigest:hash(prior),
  ql447ReceiptDigest:q.recordDigest,sourceDigest:hash(source),
  correctiveDisposition:priorException?(remComplete?
   'SIGNED_CORRECTIVE_ACTION_COMPLETE_UNDER_HOLD':
   'SIGNED_CORRECTIVE_ACTION_INCOMPLETE_KEEP_HOLD'):'NO_EXCEPTION_SIGNED_CONTINUITY_RECHECK',
  isolationLockVerified:lock,leaseRevokedVerified:lease,
  watchdogArmedVerified:watchdog,remediatedAt:iso(now-53000)};
 const hostTimes=[-51000,-39000,-18000],witnessTimes=[-50000,-38000,-17000];
 let previousDigest=hash(remediation);
 const hosts=[],witnesses=[];
 for(let i=0;i<3;i++){
  const host={schema:'rosevear.ql448.original-host-long-horizon-probe.v1',
   incidentId:id,remediationId,challengeNonce,
   horizon:['SHORT','MEDIUM','LONG'][i],sampleIndex:i+1,
   originalHostId:'DESKTOP-AE894KC',ql447ReceiptDigest:q.recordDigest,
   remediationDigest:hash(remediation),previousDigest,
   receiverState:(hostOn&&i===1)?'ON':'OFF',isolationLock:lock,
   leaseRevoked:lease,watchdogArmed:watchdog,hostSequence:100+i*2,
   observedAt:iso(now+hostTimes[i])};
  const observer={schema:'rosevear.ql448.independent-long-horizon-observation.v1',
   incidentId:id,remediationId,challengeNonce,
   horizon:host.horizon,sampleIndex:i+1,ql447ReceiptDigest:q.recordDigest,
   signedHostDigest:hash(host),previousDigest,
   receiverState:(witnessOn&&i===2)?'ON':host.receiverState,
   isolationConfirmed:observerIsolation,observerSequence:101+i*2,
   observedAt:iso(now+witnessTimes[i])};
  hosts.push(host);witnesses.push(observer);
  previousDigest=hash(observer);
 }
 const preconditionsMet=lock&&lease&&watchdog&&observerIsolation&&
  !hostOn&&!witnessOn&&(!priorException||remComplete);
 const classification=!preconditionsMet?'SIGNED_LONG_HORIZON_ISOLATION_EXCEPTION_OPEN':
  priorException?'SIGNED_CORRECTIVE_PRECONDITIONS_EVIDENCED_INCIDENT_OPEN':
   'SIGNED_LONG_HORIZON_HISTORICAL_CONTINUITY_INCIDENT_OPEN';
 const correctiveDecision=!preconditionsMet?
  'ESCALATE_UNRESOLVED_EXCEPTION_SUPERVISED_REMEDIATION_KEEP_HOLD':
  priorException?'ATTEST_CORRECTIVE_CLOSURE_PRECONDITIONS_ONLY_KEEP_OPEN':
   'ATTEST_HISTORICAL_OFF_CONTINUITY_ONLY_KEEP_OPEN';
 const horizonDigest=hash({ql447SummaryDigest:hash(prior),challengeNonce,remediationId,
  sourceDigest:hash(source),remediationDigest:hash(remediation),
  hostDigests:hosts.map(hash),observerDigests:witnesses.map(hash),classification});
 const votes=MASTERS.map(masterId=>({schema:'rosevear.ql448.three-master-long-horizon-review.v1',
  incidentId:id,remediationId,masterId,ql447ReceiptDigest:q.recordDigest,
  longHorizonDigest:horizonDigest,classification,correctiveDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-4000)}));
 const owner={schema:'rosevear.ql448.dual-owner-corrective-continuity.v1',
  incidentId:id,remediationId,sourceOwnerId:'Original_Source_Owner',
  masterOwnerId:'Independent_Master_Owner',ql447ReceiptDigest:q.recordDigest,
  longHorizonDigest:horizonDigest,masterReportsDigest:hash(votes),
  classification,correctiveDecision,incidentStatus:'OPEN_HOLD',
  reviewedAt:iso(now-3000)};
 const envelopes={source:signed(source,keys.source),remediation:signed(remediation,keys.officer),
  hosts:hosts.map(v=>signed(v,keys.host)),
  witnesses:witnesses.map(v=>signed(v,keys.receiver)),
  votes:votes.map(v=>signed(v,keys.masters[v.masterId])),
  owners:{payload:owner,sourceOwnerSignature:signed(owner,keys.owner).signature,
   masterOwnerSignature:signed(owner,keys.otherOwner).signature}};
 const calls={source:0,remediation:0,hosts:0,observers:0,masters:0};
 const args={ql447Summary:prior,ql447Ledger,remediationLedger,remediationId,challengeNonce,
  originalCommsSourceProvider:{readSignedQl447Incident:async()=>{calls.source++;return envelopes.source;}},
  independentRemediationProvider:{readSignedCorrectiveReceipt:async()=>{calls.remediation++;return envelopes.remediation;}},
  originalHostProvider:{readSignedLongHorizonProbes:async()=>{calls.hosts++;return envelopes.hosts;}},
  independentObserverProvider:{readSignedLongHorizonObservations:async()=>{calls.observers++;return envelopes.witnesses;}},
  threeMasterProvider:{readSignedCorrectiveContinuityVotes:async()=>{calls.masters++;return envelopes.votes;}},
  finalOwnerDecision:envelopes.owners};
 const opts={nowMs:now,trustedClockVerified:true,protectedOriginalHostSession:true,
  independentQl447CustodyVerified:true,separateOwnerRolesVerified:true,
  independentSignerPinsVerified:true,commsSourcePin:keys.source.pin,
  remediationOfficerPin:keys.officer.pin,originalHostPin:keys.host.pin,
  independentReceiverPin:keys.receiver.pin,sourceOwnerPin:keys.owner.pin,
  masterOwnerPin:keys.otherOwner.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return {root,now,prior,ql447Ledger,remediationLedger,remediationId,challengeNonce,
  source,remediation,hosts,witnesses,votes,owner,keys,envelopes,args,opts,calls,
  setOwners(v){args.finalOwnerDecision={payload:v,
   sourceOwnerSignature:signed(v,keys.owner).signature,
   masterOwnerSignature:signed(v,keys.otherOwner).signature};},
  run:()=>runQl448CorrectiveReview(args,opts),
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
async function rejected(change,reason,setup={}){
 const f=fixture(setup);
 try{
  change(f);const r=await f.run();
  assert.equal(r.state,'HOLD',r.reason);assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.activationAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL448 exact QL447 exception + signed remediation + 30s three-Master long horizon admits preconditions ONLY',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL448_CORRECTIVE_PRECONDITIONS_EVIDENCED');
  assert.equal(r.exceptionClosurePreconditionsEvidenced,true);
  assert.equal(r.masterCount,3);assert.equal(r.incidentStatus,'OPEN');
  assert.equal(r.activationAuthorized,false);assert.equal(r.connection,'HOLD');
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl448Remediation(f.remediationLedger,id).state,
   'QL448_DURABLE_CORRECTIVE_PRECONDITIONS_REVIEWED_INCIDENT_OPEN');
  assert.equal((await f.run()).reason,'QL448_ONE_USE_CORRECTIVE_REVIEW_ALREADY_ATTEMPTED');
  assert.deepEqual(f.calls,{source:1,remediation:1,hosts:1,observers:1,masters:1});
 }finally{f.cleanup();}
});
test('QL448 prior QL447 signed reconfirmed OFF is continuity, not exception closure',async()=>{
 const f=fixture({priorException:false});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL448_CORRECTIVE_PRECONDITIONS_EVIDENCED');
  assert.equal(r.classification,'SIGNED_LONG_HORIZON_HISTORICAL_CONTINUITY_INCIDENT_OPEN');
  assert.equal(r.exceptionClosurePreconditionsEvidenced,false);
  assert.equal(r.incidentStatus,'OPEN');
 }finally{f.cleanup();}
});
test('QL448 signed ON, conflicting OFF or incomplete lease/lock/watchdog/remediation escalates without closure',async()=>{
 for(const options of [{hostOn:true},{witnessOn:true},{lock:false},{lease:false},
  {watchdog:false},{observerIsolation:false},{remComplete:false}]){
  const f=fixture(options);try{
   const r=await f.run();
   assert.equal(r.state,'DURABLE_QL448_UNRESOLVED_ISOLATION_EXCEPTION_OPEN');
   assert.equal(r.classification,'SIGNED_LONG_HORIZON_ISOLATION_EXCEPTION_OPEN');
   assert.equal(r.exceptionClosurePreconditionsEvidenced,false);
   assert.equal(r.incidentStatus,'OPEN');assert.equal(r.physicalReceiverCurrentlyOff,false);
   assert.equal(readQl448Remediation(f.remediationLedger,id).state,
    'QL448_DURABLE_CORRECTIVE_EXCEPTION_FOLLOWUP_OPEN');
  }finally{f.cleanup();}
 }
});
test('QL448 refuses unsigned or mismatched QL447 closure/receipt and replayed challenge',async()=>{
 await rejected(f=>{f.prior.state='DURABLE_QL447_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY';},
  'QL448_EXACT_QL447_OPEN_CASE_AND_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.followUpReceiptDigest='f'.repeat(64);},
  'QL448_EXACT_QL447_OPEN_CASE_AND_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.prior.incidentStatus='CLOSED';},
  'QL448_EXACT_QL447_OPEN_CASE_AND_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.args.challengeNonce=f.prior.followUpId;},
  'QL448_EXACT_QL447_OPEN_CASE_AND_PROTECTED_CHALLENGE_REQUIRED');
 await rejected(f=>{f.opts.originalHostPin=f.opts.independentReceiverPin;},
  'QL448_INDEPENDENT_DISTINCT_PINNED_SIGNERS_REQUIRED');
});
test('QL448 original incident source and independent corrective officer must be signed and fresh',async()=>{
 await rejected(f=>{f.envelopes.source.payload.incidentStatus='CLOSED';},
  'QL448_ORIGINAL_SOURCE_SIGNED_READBACK_INVALID');
 await rejected(f=>{f.envelopes.source=signed({...f.source,observedAt:iso(f.now-65000)},f.keys.source);},
  'QL448_ORIGINAL_SOURCE_SIGNED_READBACK_INVALID');
 await rejected(f=>{f.args.independentRemediationProvider.readSignedCorrectiveReceipt=async()=>{
  throw Error('unavailable');};},'QL448_INDEPENDENT_REMEDIATION_RECEIPT_UNAVAILABLE');
 await rejected(f=>{f.envelopes.remediation=signed({...f.remediation,
  correctiveDisposition:'CLAIM_CLOSED'},f.keys.officer);},
  'QL448_INDEPENDENT_CORRECTIVE_RECEIPT_INVALID');
 await rejected(f=>{f.envelopes.remediation.signature=f.envelopes.source.signature;},
  'QL448_INDEPENDENT_CORRECTIVE_RECEIPT_INVALID');
});
test('QL448 original host is pinned, signed, strictly chained and spans >=10s/30s',async()=>{
 await rejected(f=>{f.envelopes.hosts[0]=signed({...f.hosts[0],originalHostId:'TEMPLAR'},f.keys.host);},
  'QL448_ORIGINAL_HOST_SIGNED_LONG_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],hostSequence:99},f.keys.host);},
  'QL448_ORIGINAL_HOST_SIGNED_LONG_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[1]=signed({...f.hosts[1],observedAt:iso(f.now-45001)},f.keys.host);},
  'QL448_ORIGINAL_HOST_SIGNED_LONG_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts[2]=signed({...f.hosts[2],observedAt:iso(f.now-21001)},f.keys.host);},
  'QL448_ORIGINAL_HOST_SIGNED_LONG_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.hosts.pop();},'QL448_THREE_SIGNED_LONG_HORIZONS_REQUIRED');
});
test('QL448 independent witness never accepts forged host binding, regressed sequence or missing horizon',async()=>{
 await rejected(f=>{f.envelopes.witnesses[0]=signed({...f.witnesses[0],
  signedHostDigest:'f'.repeat(64)},f.keys.receiver);},
  'QL448_INDEPENDENT_SIGNED_LONG_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.witnesses[1]=signed({...f.witnesses[1],
  observerSequence:102},f.keys.receiver);},
  'QL448_INDEPENDENT_SIGNED_LONG_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.witnesses[2].signature=f.envelopes.hosts[2].signature;},
  'QL448_INDEPENDENT_SIGNED_LONG_HORIZON_INVALID');
 await rejected(f=>{f.envelopes.witnesses.pop();},'QL448_THREE_SIGNED_LONG_HORIZONS_REQUIRED');
});
test('QL448 all three distinct Master corrective votes must bind exact historical outcome',async()=>{
 await rejected(f=>{f.envelopes.votes.pop();},'QL448_THREE_DISTINCT_MASTER_VOTES_REQUIRED');
 await rejected(f=>{f.envelopes.votes[1]=f.envelopes.votes[0];},
  'QL448_THREE_MASTER_CORRECTIVE_VETO');
 await rejected(f=>{f.envelopes.votes[2]=signed({...f.votes[2],
  correctiveDecision:'CLOSE_AND_CONNECT'},f.keys.masters[MASTERS[2]]);},
  'QL448_THREE_MASTER_CORRECTIVE_VETO');
});
test('QL448 independent dual-owner correction does not permit incident CLOSED or CONNECTED',async()=>{
 await rejected(f=>{f.setOwners({...f.owner,incidentStatus:'CLOSED'});},
  'QL448_DUAL_OWNER_CORRECTIVE_VETO');
 await rejected(f=>{f.setOwners({...f.owner,correctiveDecision:'CONNECTED'});},
  'QL448_DUAL_OWNER_CORRECTIVE_VETO');
 await rejected(f=>{f.setOwners({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},
  'QL448_DUAL_OWNER_CORRECTIVE_VETO');
 await rejected(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},'QL448_DUAL_OWNER_CORRECTIVE_VETO');
});
test('QL448 interrupted private intake burns one-use pending without permission to retry',async()=>{
 const f=fixture();try{
  f.args.originalCommsSourceProvider.readSignedQl447Incident=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL448_ORIGINAL_QL447_INCIDENT_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL448_ONE_USE_CORRECTIVE_REVIEW_ALREADY_ATTEMPTED');
  assert.equal(readQl448Remediation(f.remediationLedger,id).reason,
   'QL448_PENDING_REQUIRES_OWNER_RECOVERY');
 }finally{f.cleanup();}
});
test('QL448 corrupt exclusive private ledger is HOLD; absolute protected path required',async()=>{
 const f=fixture();try{
  f.remediationLedger.claimOnce('pending',id,'a'.repeat(64));
  writeFileSync(join(f.root,'ql448','ql448-pending-'+id+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL448_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal(readQl448Remediation(f.remediationLedger,id).state,'HOLD');
 }finally{f.cleanup();}
 assert.throws(()=>openQl448RemediationLedger('relative'),/ABSOLUTE_PRIVATE_DIRECTORY/);
});
