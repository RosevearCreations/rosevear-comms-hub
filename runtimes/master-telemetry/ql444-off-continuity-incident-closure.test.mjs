import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl444ProtectedClosureLedger,readQl444ClosureContinuity,
 runQl444OffContinuityClosure} from './ql444-off-continuity-incident-closure.mjs';
const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const k=()=>{const v=generateKeyPairSync('ed25519');return{privateKey:v.privateKey,
 pin:v.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signPayload=(payload,key)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 key.privateKey).toString('base64')});
const iso=n=>new Date(n).toISOString();
const incidentId='incident_ql444_1234567';
function f({late=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql444-')),now=Date.now()-3500;
 const ledger=openQl444ProtectedClosureLedger(join(root,'ql444'));
 const p={recordDigest:'a'.repeat(64)},a={recordDigest:'b'.repeat(64)},e={recordDigest:'c'.repeat(64)};
 const ql443Ledger={read:(kind,id)=>id!==incidentId?null:kind==='pending'?p:kind===(late?'exception':'admitted')?late?e:a:null};
 const s={state:late?'DURABLE_QL443_EXPIRED_LEASE_EXCEPTION_HANDOFF_OPEN':
  'DURABLE_QL443_SIGNED_SHUTDOWN_EVIDENCE_ADMITTED',
  connection:'HOLD',activationAuthorized:false,physicalReceiverCurrentlyOff:false,
  originalIncidentId:incidentId,renewalNonce:'ql443_renewal_nonce_12345',
  ql442DecisionDigest:'d'.repeat(64),masterReportsDigest:'e'.repeat(64),
  pendingReceiptDigest:p.recordDigest,freshIndependentOffDigest:'',
  masterCount:3,leaseExpired:late,
  ...{[late?'exceptionReceiptDigest':'admissionReceiptDigest']:(late?e:a).recordDigest}};
 const keys={source:k(),old:k(),host:k(),watch:k(),owner:k(),reviewer:k(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,k()]))};
 const prev={schema:'rosevear.ql443.independent-fresh-off-renewal.v1',
  incidentId,challengeId:'ql443_challenge_abcdef',leaseId:'ql443_lease_abcdefgh',
  renewalNonce:s.renewalNonce,ql442DecisionDigest:s.ql442DecisionDigest,
  hostShutdownDigest:'f'.repeat(64),historicalOffDigest:'1'.repeat(64),
  receiverState:'OFF',offSequence:31,observedAt:iso(now-12000)};
 s.freshIndependentOffDigest=hash(prev);
 const source={schema:'rosevear.ql444.ql443-source-custody-readback.v1',
  incidentId,ql443SummaryDigest:hash(s),
  ql443ReceiptDigest:late?e.recordDigest:a.recordDigest,
  disposition:late?'EXPIRED_EXCEPTION':'ADMITTED',observedAt:iso(now-11000)};
 const host={schema:'rosevear.ql444.original-host-off-continuity.v1',incidentId,
  hostMachineId:'DESKTOP-AE894KC',ql443SummaryDigest:hash(s),
  priorOffDigest:hash(prev),receiverState:'OFF',watchdogArmed:true,
  hostSequence:32,observedAt:iso(now-9000)};
 const watchId='ql444_watch_abcdefghi',continuityNonce='ql444_nonce_abcdefghi';
 const w1={schema:'rosevear.ql444.independent-signed-off-continuity-watch.v1',
  incidentId,watchId,continuityNonce,ql443SummaryDigest:hash(s),
  hostContinuityDigest:hash(host),priorOffDigest:hash(prev),receiverState:'OFF',
  offSequence:33,observedAt:iso(now-6000)};
 const w2={...w1,priorOffDigest:hash(w1),offSequence:34,observedAt:iso(now-4000)};
 const fix={schema:'rosevear.ql444.signed-lease-exception-remediation.v1',
  incidentId,remediationId:'ql444_remediation_abc',
  ql443ExceptionReceiptDigest:late?e.recordDigest:'0'.repeat(64),
  watchTwoDigest:hash(w2),causeEvidenceDigest:'2'.repeat(64),
  correctiveEvidenceDigest:'3'.repeat(64),
  outcome:'INDEPENDENTLY_REMEDIATED_KEEP_HOLD',verifiedAt:iso(now-3000),
  ownerId:'Ree_Original',reviewerId:'Jack_Independent'};
 const reports=MASTERS.map(masterId=>({
  schema:'rosevear.ql444.three-master-incident-closure-review.v1',
  incidentId,masterId,ql443SummaryDigest:hash(s),watchTwoDigest:hash(w2),
  remediationDigest:late?hash(fix):null,
  decision:late?'APPROVE_REMEDIATED_EXCEPTION_EVIDENCE_CLOSURE_NO_CONNECT':
   'APPROVE_OFF_EVIDENCE_CLOSURE_NO_CONNECT',reviewedAt:iso(now-2000)}));
 const owner={schema:'rosevear.ql444.dual-owner-incident-evidence-closure.v1',
  incidentId,ownerId:'Ree_Original',reviewerId:'Jack_Independent',
  ql443SummaryDigest:hash(s),watchTwoDigest:hash(w2),
  remediationDigest:late?hash(fix):null,masterReportsDigest:hash(reports),
  decision:late?'CLOSE_REMEDIATED_EXCEPTION_EVIDENCE_ONLY':
   'CLOSE_WITNESSED_OFF_INCIDENT_EVIDENCE_ONLY',reviewedAt:iso(now-1000)};
 const dual=(payload)=>({payload,
  ownerSignature:signPayload(payload,keys.owner).signature,
  reviewerSignature:signPayload(payload,keys.reviewer).signature});
 const envelopes={source:signPayload(source,keys.source),prev:signPayload(prev,keys.old),
  host:signPayload(host,keys.host),w1:signPayload(w1,keys.watch),
  w2:signPayload(w2,keys.watch),fix:dual(fix),
  reports:reports.map(x=>signPayload(x,keys.masters[x.masterId])),owner:dual(owner)};
 const calls={source:0,prev:0,host:0,watch:0,masters:0};
 const args={ql443Summary:s,ql443Ledger,closureLedger:ledger,continuityNonce,watchId,
  ql443SourceProvider:{readSignedQl443Source:async()=>{calls.source++;return envelopes.source;}},
  priorRenewalProvider:{readSignedQl443Renewal:async()=>{calls.prev++;return envelopes.prev;}},
  originalHostContinuityProvider:{readSignedOffContinuity:async()=>{calls.host++;return envelopes.host;}},
  independentOffWatchProvider:{readSignedOffSamples:async()=>{calls.watch++;return [envelopes.w1,envelopes.w2];}},
  exceptionRemediation:late?envelopes.fix:null,
  threeMasterProvider:{readSignedClosureDecisions:async()=>{calls.masters++;return envelopes.reports;}},
  finalOwnerDecision:envelopes.owner};
 const o={nowMs:now,protectedOriginalHostSession:true,trustedClockVerified:true,
  independentQl443SourceVerified:true,separateRuntimeKeyCustodyVerified:true,
  independentRemediationCustodyVerified:true,
  ql443SourcePin:keys.source.pin,ql443ReceiverPin:keys.old.pin,originalHostPin:keys.host.pin,
  watchReceiverPin:keys.watch.pin,ownerPin:keys.owner.pin,reviewerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 return{root,now,ledger,args,o,s,source,prev,host,w1,w2,fix,reports,owner,
  envelopes,keys,calls,dual,run:()=>runQl444OffContinuityClosure(args,o),
  setFix(x){envelopes.fix=dual(x);args.exceptionRemediation=envelopes.fix;},
  setOwner(x){envelopes.owner=dual(x);args.finalOwnerDecision=envelopes.owner;},
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
async function rejection(change,reason,{late=false}={}){
 const x=f({late});try{change(x);const r=await x.run();assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);assert.equal(r.manualIsolationAndIndependentOffRequired,true);
 }finally{x.cleanup();}
}
test('QL444 signed two-sample OFF watch, three Masters and dual owners admit historical closure only',async()=>{
 const x=f();try{
  const r=await x.run();
  assert.equal(r.state,'DURABLE_QL444_WITNESSED_OFF_INCIDENT_EVIDENCE_CLOSED');
  assert.equal(r.masterCount,3);assert.equal(r.ownerAcceptance,'DUAL_SIGNED_INCIDENT_EVIDENCE_CLOSEOUT_ONLY');
  assert.equal(r.activationAuthorized,false);assert.equal(r.connection,'HOLD');
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl444ClosureContinuity(x.ledger,incidentId).state,
   'QL444_PRIVATE_INCIDENT_EVIDENCE_CLOSED_NOT_LIVE_STATE');
  assert.equal((await x.run()).reason,'QL444_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
  assert.equal(x.calls.source,1);
 }finally{x.cleanup();}
});
test('QL444 expired lease requires signed remediation custody before evidence-only closure',async()=>{
 const x=f({late:true});try{
  const r=await x.run();
  assert.equal(r.state,'DURABLE_QL444_REMEDIATED_LEASE_EXCEPTION_EVIDENCE_CLOSED');
  assert.equal(r.leaseExceptionRemediated,true);
  assert.match(r.remediationReceiptDigest,/^[a-f0-9]{64}$/);
  assert.equal(r.activationAuthorized,false);assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl444ClosureContinuity(x.ledger,incidentId).state,
   'QL444_PRIVATE_INCIDENT_EVIDENCE_CLOSED_NOT_LIVE_STATE');
 }finally{x.cleanup();}
});
test('QL444 refuses missing protected receipt, stale session and reused renewal nonce',async()=>{
 await rejection(x=>{x.o.trustedClockVerified=false;},'QL444_EXACT_QL443_PROTECTED_CUSTODY_REQUIRED');
 await rejection(x=>{x.s.pendingReceiptDigest='0'.repeat(64);},'QL444_EXACT_QL443_PROTECTED_CUSTODY_REQUIRED');
 await rejection(x=>{x.args.continuityNonce=x.s.renewalNonce;},'QL444_EXACT_QL443_PROTECTED_CUSTODY_REQUIRED');
 await rejection(x=>{x.o.watchReceiverPin=x.o.originalHostPin;},'QL444_DISTINCT_PINNED_SIGNERS_AND_REMEDIATION_REVIEW_REQUIRED');
});
test('QL444 invalid source and previous QL443 OFF digest reject intake',async()=>{
 await rejection(x=>{x.envelopes.source.payload.ql443SummaryDigest='0'.repeat(64);},'QL444_ORIGINAL_QL443_SOURCE_SIGNATURE_INVALID');
 await rejection(x=>{x.envelopes.prev=signPayload({...x.prev,receiverState:'ON'},x.keys.old);},'QL444_SIGNED_QL443_PRIOR_OFF_CUSTODY_INVALID');
 await rejection(x=>{x.envelopes.prev=signPayload({...x.prev,offSequence:0},x.keys.old);},'QL444_SIGNED_QL443_PRIOR_OFF_CUSTODY_INVALID');
});
test('QL444 original host cannot be TEMPLAR, unarmed, ON or sequence-regressed',async()=>{
 await rejection(x=>{x.envelopes.host=signPayload({...x.host,hostMachineId:'TEMPLAR'},x.keys.host);},'QL444_HOST_SIGNED_OFF_WATCHDOG_OR_SEQUENCE_INVALID');
 await rejection(x=>{x.envelopes.host=signPayload({...x.host,watchdogArmed:false},x.keys.host);},'QL444_HOST_SIGNED_OFF_WATCHDOG_OR_SEQUENCE_INVALID');
 await rejection(x=>{x.envelopes.host=signPayload({...x.host,receiverState:'ON'},x.keys.host);},'QL444_HOST_SIGNED_OFF_WATCHDOG_OR_SEQUENCE_INVALID');
 await rejection(x=>{x.envelopes.host=signPayload({...x.host,hostSequence:31},x.keys.host);},'QL444_HOST_SIGNED_OFF_WATCHDOG_OR_SEQUENCE_INVALID');
});
test('QL444 needs two independent signed OFF samples and increasing sequence with minimum gap',async()=>{
 await rejection(x=>{x.args.independentOffWatchProvider.readSignedOffSamples=async()=>[x.envelopes.w1];},'QL444_TWO_INDEPENDENT_OFF_SAMPLES_REQUIRED');
 await rejection(x=>{x.envelopes.w2=signPayload({...x.w2,offSequence:33},x.keys.watch);},'QL444_INDEPENDENT_OFF_MONOTONIC_TWO_SAMPLE_WATCH_INVALID');
 await rejection(x=>{x.envelopes.w2=signPayload({...x.w2,observedAt:iso(x.now-5500)},x.keys.watch);},'QL444_INDEPENDENT_OFF_MONOTONIC_TWO_SAMPLE_WATCH_INVALID');
 await rejection(x=>{x.envelopes.w2=signPayload({...x.w2,continuityNonce:'reused_nonce_12345'},x.keys.watch);},'QL444_INDEPENDENT_OFF_MONOTONIC_TWO_SAMPLE_WATCH_INVALID');
 await rejection(x=>{x.envelopes.w2=signPayload({...x.w2,receiverState:'ON'},x.keys.watch);},'QL444_INDEPENDENT_OFF_MONOTONIC_TWO_SAMPLE_WATCH_INVALID');
 await rejection(x=>{x.envelopes.w2=signPayload({...x.w2,priorOffDigest:'f'.repeat(64)},x.keys.watch);},'QL444_INDEPENDENT_OFF_MONOTONIC_TWO_SAMPLE_WATCH_INVALID');
});
test('QL444 late lease cannot close without independently signed remediation',async()=>{
 await rejection(x=>{x.args.exceptionRemediation=null;},'QL444_SIGNED_INDEPENDENT_EXCEPTION_REMEDIATION_INVALID',{late:true});
 await rejection(x=>{x.setFix({...x.fix,correctiveEvidenceDigest:'xxx'});},'QL444_SIGNED_INDEPENDENT_EXCEPTION_REMEDIATION_INVALID',{late:true});
 await rejection(x=>{x.setFix({...x.fix,outcome:'APPROVED_CONNECT'});},'QL444_SIGNED_INDEPENDENT_EXCEPTION_REMEDIATION_INVALID',{late:true});
 await rejection(x=>{x.args.exceptionRemediation.reviewerSignature=x.args.exceptionRemediation.ownerSignature;},'QL444_SIGNED_INDEPENDENT_EXCEPTION_REMEDIATION_INVALID',{late:true});
 await rejection(x=>{x.o.independentRemediationCustodyVerified=false;},'QL444_DISTINCT_PINNED_SIGNERS_AND_REMEDIATION_REVIEW_REQUIRED',{late:true});
});
test('QL444 three Master votes cannot be missing, duplicated, forged or connect-claiming',async()=>{
 await rejection(x=>{x.envelopes.reports.pop();},'QL444_THREE_DISTINCT_MASTER_CLOSURES_REQUIRED');
 await rejection(x=>{x.envelopes.reports[1]=x.envelopes.reports[0];},'QL444_THREE_MASTER_SIGNED_CLOSEOUT_REJECTED');
 await rejection(x=>{x.envelopes.reports[0]=signPayload({...x.reports[0],decision:'CONNECT_NOW'},x.keys.masters[MASTERS[0]]);},'QL444_THREE_MASTER_SIGNED_CLOSEOUT_REJECTED');
});
test('QL444 final owner and reviewer cannot silently grant activation',async()=>{
 await rejection(x=>x.setOwner({...x.owner,decision:'CONNECTED'}),'QL444_DUAL_OWNER_SIGNED_CLOSEOUT_INVALID');
 await rejection(x=>x.setOwner({...x.owner,reviewerId:x.owner.ownerId}),'QL444_DUAL_OWNER_SIGNED_CLOSEOUT_INVALID');
 await rejection(x=>{x.args.finalOwnerDecision.reviewerSignature=x.args.finalOwnerDecision.ownerSignature;},'QL444_DUAL_OWNER_SIGNED_CLOSEOUT_INVALID');
});
test('QL444 interrupted intake cannot replay after pending and remediation write',async()=>{
 const x=f({late:true});try{
  x.args.threeMasterProvider.readSignedClosureDecisions=async()=>{throw Error('offline');};
  assert.equal((await x.run()).reason,'QL444_THREE_MASTER_CLOSURE_UNAVAILABLE');
  assert.equal(readQl444ClosureContinuity(x.ledger,incidentId).state,
   'QL444_DURABLE_EXCEPTION_REMEDIATION_PENDING_CLOSURE');
  assert.equal((await x.run()).reason,'QL444_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
 }finally{x.cleanup();}
});
test('QL444 tampered private record always HOLD',async()=>{
 const x=f();try{
  x.ledger.claimOnce('pending',incidentId,'b'.repeat(64));
  writeFileSync(join(x.root,'ql444','ql444-pending-'+incidentId+'.json'),'{}');
  assert.equal((await x.run()).reason,'QL444_LEDGER_UNREADABLE');
  assert.equal(readQl444ClosureContinuity(x.ledger,incidentId).state,'HOLD');
 }finally{x.cleanup();}
});
test('QL444 rejects unsafe relative private evidence directory',()=>{
 assert.throws(()=>openQl444ProtectedClosureLedger('relative'),/ABSOLUTE_PRIVATE_LEDGER/);
});
