import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {openQl441ProtectedChallengeLedger} from './ql441-protected-challenge-go-nogo.mjs';
import {openQl443ProtectedShutdownLedger,runQl443ProtectedShutdownAdmission,
 readQl443ShutdownContinuity} from './ql443-protected-shutdown-custody.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signWith=(payload,k)=>({payload,
 signature:sign(null,Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const iso=n=>new Date(n).toISOString();
const incidentId='ql443_incident_1234567';
function fixture({late=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ql443-'));
 const now=Date.now()-2000;
 const ql441Ledger=openQl441ProtectedChallengeLedger(join(root,'ql441'));
 const shutdownLedger=openQl443ProtectedShutdownLedger(join(root,'ql443'));
 const p=ql441Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const d=ql441Ledger.claimOnce('decision',incidentId,'b'.repeat(64));
 const summary={state:'DURABLE_QL441_GO_WITNESSED_ON_REVIEW_ONLY',
  connection:'HOLD',activationAuthorized:false,
  receiver:'ON_WITNESSED_ISOLATED_LEASE_SHUTDOWN_REQUIRED',
  originalIncidentId:incidentId,challengeId:'ql443_challenge_abcdef',
  leaseId:'ql443_lease_abcdefgh',
  leaseExpiresAt:iso(now+(late?-2200:30000)),independentOnDigest:'c'.repeat(64),
  pendingReceiptDigest:p.recordDigest,decisionReceiptDigest:d.recordDigest};
 const keys={source:key(),host:key(),historical:key(),adp:key(),renewal:key(),
  owner:key(),reviewer:key(),masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const o={nowMs:now,protectedOriginalHostSession:true,
  independentSourceCustodyVerified:true,trustedClockVerified:true,
  originalHostPinVerified:true,independentReceiverPinsVerified:true,
  aiPlatformSignerPinVerified:true,ownerRolesIndependentlyVerified:true,
  commsSourcePin:keys.source.pin,originalHostPin:keys.host.pin,
  historicalReceiverPin:keys.historical.pin,aiPlatformPin:keys.adp.pin,
  freshReceiverPin:keys.renewal.pin,ownerPin:keys.owner.pin,
  reviewerPin:keys.reviewer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 const source={schema:'rosevear.ql442.original-comms-ql441-source-proof.v1',
  incidentId,ql441Digest:hash(summary),ql441DecisionReceiptDigest:d.recordDigest,
  assertedState:'QL441_SIGNED_DECISION_EXISTS_NO_CURRENT_RECEIVER_ASSUMPTION',
  observedAt:iso(now-3000)};
 const host={schema:'rosevear.ql442.original-host-signed-shutdown.v1',
  incidentId,challengeId:summary.challengeId,leaseId:summary.leaseId,
  hostMachineId:'DESKTOP-AE894KC',priorIndependentOnDigest:summary.independentOnDigest,
  ql441DecisionReceiptDigest:d.recordDigest,receiverState:'OFF',
  watchdogArmed:true,shutdownSequence:30,shutdownAt:iso(now-2500)};
 const off={schema:'rosevear.ql442.independent-receiver-off-readback.v1',
  incidentId,challengeId:summary.challengeId,leaseId:summary.leaseId,
  signedHostShutdownDigest:hash(host),receiverState:'OFF',offSequence:31,
  observedAt:iso(now-1500)};
 const decision={schema:'rosevear.ql443.signed-ai-platform-ql442-closure-evidence.v1',
  incidentId,ql441Digest:hash(summary),sourceDigest:hash(source),
  hostShutdownDigest:hash(host),independentOffDigest:hash(off),
  evidenceDigest:'e'.repeat(64),
  leaseDisposition:late?'EXPIRED_EXCEPTION':'ON_TIME',
  classification:late?'LATE_OFF_ATTESTED_LEASE_EXCEPTION_OPEN':
   'SIGNED_OFF_PILOT_CLOSURE_READY_FOR_DURABLE_ADMISSION',
  reviewedAt:iso(now-1000)};
 const renewalNonce='ql443_renewal_nonce_12345';
 const renewal={schema:'rosevear.ql443.independent-fresh-off-renewal.v1',
  incidentId,challengeId:summary.challengeId,leaseId:summary.leaseId,
  renewalNonce,ql442DecisionDigest:hash(decision),hostShutdownDigest:hash(host),
  historicalOffDigest:hash(off),receiverState:'OFF',offSequence:32,
  observedAt:iso(now-700)};
 const reports=MASTERS.map(masterId=>({
  schema:'rosevear.ql443.three-master-fresh-off-closure-renewal.v1',
  masterId,incidentId,ql442DecisionDigest:hash(decision),
  renewedOffDigest:hash(renewal),leaseDisposition:late?'EXPIRED_EXCEPTION':'ON_TIME',
  decision:late?'KEEP_EXPIRED_LEASE_EXCEPTION_OPEN':
   'SIGNED_OFF_EVIDENCE_ADMISSION_ONLY_NO_ACTIVATION',
  reviewedAt:iso(now-300)}));
 const owner={schema:'rosevear.ql443.dual-owner-protected-shutdown-admission.v1',
  incidentId,sourceOwnerId:'Ree_Original',masterOwnerId:'Jack_Independent',
  ql442DecisionDigest:hash(decision),renewedOffDigest:hash(renewal),
  masterReportsDigest:hash(reports),leaseDisposition:late?'EXPIRED_EXCEPTION':'ON_TIME',
  decision:late?'ACKNOWLEDGE_EXPIRED_LEASE_EXCEPTION_KEEP_OPEN':
   'ADMIT_SIGNED_SHUTDOWN_EVIDENCE_ONLY_NO_CONNECT',reviewedAt:iso(now)};
 const envelopes={
  source:signWith(source,keys.source),host:signWith(host,keys.host),
  off:signWith(off,keys.historical),decision:signWith(decision,keys.adp),
  renewal:signWith(renewal,keys.renewal),
  reports:reports.map(x=>signWith(x,keys.masters[x.masterId])),
  owner:{payload:owner,ownerSignature:signWith(owner,keys.owner).signature,
   reviewerSignature:signWith(owner,keys.reviewer).signature}};
 const calls={source:0,host:0,off:0,decision:0,renewal:0,masters:0};
 const args={ql441Summary:summary,ql441Ledger,shutdownLedger,renewalNonce,
  commsSourceProvider:{readSignedQl441Source:async()=>{calls.source++;return envelopes.source;}},
  originalHostShutdownProvider:{readSignedShutdown:async()=>{calls.host++;return envelopes.host;}},
  independentHistoricalOffProvider:{readSignedOff:async()=>{calls.off++;return envelopes.off;}},
  aiPlatformQl442Provider:{readSignedQl442Decision:async()=>{calls.decision++;return envelopes.decision;}},
  independentRenewalOffProvider:{readSignedFreshOff:async()=>{calls.renewal++;return envelopes.renewal;}},
  threeMasterProvider:{readSignedRenewalDecisions:async()=>{calls.masters++;return envelopes.reports;}},
  finalOwnerDecision:envelopes.owner};
 const reSignOwner=payload=>{envelopes.owner={payload,
  ownerSignature:signWith(payload,keys.owner).signature,
  reviewerSignature:signWith(payload,keys.reviewer).signature};
  args.finalOwnerDecision=envelopes.owner;};
 return {root,now,args,o,envelopes,keys,summary,source,host,off,decision,
  renewal,reports,owner,calls,ql441Ledger,shutdownLedger,reSignOwner,
  run:()=>runQl443ProtectedShutdownAdmission(args,o),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
async function reject(change,reason){
 const f=fixture();try{
  change(f);
  const r=await f.run();
  assert.equal(r.reason,reason);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(r.manualIsolationAndIndependentOffRequired,true);
 }finally{f.cleanup();}
}

test('QL443 exact on-time signed receipts produce durable evidence admission only, not a live OFF/CONNECTED claim',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL443_SIGNED_SHUTDOWN_EVIDENCE_ADMITTED');
  assert.equal(r.ownerAcceptance,'DUAL_SIGNED_OFF_EVIDENCE_ADMISSION_ONLY');
  assert.equal(r.leaseExpired,false);assert.equal(r.masterCount,3);
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
  assert.equal(r.receiver,'UNKNOWN_REQUIRES_FRESH_EXTERNAL_OFF');
  assert.equal(f.calls.renewal,1);
  const reboot=readQl443ShutdownContinuity(f.shutdownLedger,incidentId);
  assert.equal(reboot.state,'QL443_DURABLE_SIGNED_OFF_EVIDENCE_ADMITTED_NOT_LIVE_STATE');
  assert.equal(reboot.physicalReceiverCurrentlyOff,false);
  assert.equal((await f.run()).reason,'QL443_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
  assert.equal(f.calls.source,1);
 }finally{f.cleanup();}
});
test('QL443 later OFF after lease expiry yields durable exception; never calls it closed',async()=>{
 const f=fixture({late:true});try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL443_EXPIRED_LEASE_EXCEPTION_HANDOFF_OPEN');
  assert.equal(r.leaseExpired,true);assert.equal(r.connection,'HOLD');
  assert.equal(r.activationAuthorized,false);
  assert.equal(readQl443ShutdownContinuity(f.shutdownLedger,incidentId).state,
   'QL443_DURABLE_EXPIRED_LEASE_EXCEPTION_OPEN');
 }finally{f.cleanup();}
});
test('QL443 protected source, complete QL441 custody, trusted clock and unique signers required',async()=>{
 await reject(f=>{f.o.trustedClockVerified=false;},'QL443_EXACT_QL441_ONE_USE_OR_PROTECTED_CLOCK_INVALID');
 await reject(f=>{f.summary.decisionReceiptDigest='0'.repeat(64);},'QL443_EXACT_QL441_ONE_USE_OR_PROTECTED_CLOCK_INVALID');
 await reject(f=>{f.o.ownerPin=f.o.reviewerPin;},'QL443_DISTINCT_VERIFIED_SIGNATURE_CUSTODY_REQUIRED');
 await reject(f=>{f.o.originalHostPinVerified=false;},'QL443_DISTINCT_VERIFIED_SIGNATURE_CUSTODY_REQUIRED');
 await reject(f=>{f.args.renewalNonce='x';},'QL443_EXACT_QL441_ONE_USE_OR_PROTECTED_CLOCK_INVALID');
});
test('QL443 fails closed with unavailable or forged Comms original QL441 source',async()=>{
 await reject(f=>{f.args.commsSourceProvider.readSignedQl441Source=async()=>{throw Error('offline');};},
  'QL443_COMMS_SOURCE_EVIDENCE_UNAVAILABLE');
 await reject(f=>{f.envelopes.source.payload.ql441Digest='0'.repeat(64);},
  'QL443_ORIGINAL_COMMS_SOURCE_SIGNATURE_INVALID');
 await reject(f=>{f.envelopes.source=signWith({...f.source,observedAt:iso(f.now-65000)},f.keys.source);},
  'QL443_ORIGINAL_COMMS_SOURCE_SIGNATURE_INVALID');
});
test('QL443 must see original-host signed OFF and armed watchdog, never TEMPLAR',async()=>{
 await reject(f=>{f.envelopes.host=signWith({...f.host,hostMachineId:'TEMPLAR'},f.keys.host);},
  'QL443_SIGNED_ORIGINAL_HOST_OFF_SHUTDOWN_INVALID');
 await reject(f=>{f.envelopes.host=signWith({...f.host,receiverState:'ON'},f.keys.host);},
  'QL443_SIGNED_ORIGINAL_HOST_OFF_SHUTDOWN_INVALID');
 await reject(f=>{f.envelopes.host=signWith({...f.host,watchdogArmed:false},f.keys.host);},
  'QL443_SIGNED_ORIGINAL_HOST_OFF_SHUTDOWN_INVALID');
 await reject(f=>{f.envelopes.host=signWith({...f.host,leaseId:'wrong_lease_12345'},f.keys.host);},
  'QL443_SIGNED_ORIGINAL_HOST_OFF_SHUTDOWN_INVALID');
});
test('QL443 rejects fabricated, regressed and missing historical independent OFF',async()=>{
 await reject(f=>{f.envelopes.off=signWith({...f.off,offSequence:29},f.keys.historical);},
  'QL443_HISTORICAL_INDEPENDENT_OFF_INVALID');
 await reject(f=>{f.envelopes.off=signWith({...f.off,receiverState:'ON'},f.keys.historical);},
  'QL443_HISTORICAL_INDEPENDENT_OFF_INVALID');
 await reject(f=>{f.args.independentHistoricalOffProvider.readSignedOff=async()=>{throw Error('offline');};},
  'QL443_HISTORICAL_INDEPENDENT_OFF_UNAVAILABLE');
 await reject(f=>{f.envelopes.off=signWith({...f.off,signedHostShutdownDigest:'0'.repeat(64)},f.keys.historical);},
  'QL443_HISTORICAL_INDEPENDENT_OFF_INVALID');
});
test('QL443 refuses fabricated, late/early inconsistent or unsigned AI Platform QL442 closure evidence',async()=>{
 await reject(f=>{f.envelopes.decision=signWith({...f.decision,classification:'CONNECTED'},f.keys.adp);},
  'QL443_QL442_SOURCE_CLOSURE_EVIDENCE_REJECTED');
 await reject(f=>{f.envelopes.decision=signWith({...f.decision,leaseDisposition:'EXPIRED_EXCEPTION'},f.keys.adp);},
  'QL443_QL442_SOURCE_CLOSURE_EVIDENCE_REJECTED');
 await reject(f=>{f.envelopes.decision.signature=f.envelopes.source.signature;},
  'QL443_QL442_SOURCE_CLOSURE_EVIDENCE_REJECTED');
});
test('QL443 renewal must be strictly newer, scoped to fresh nonce, signed OFF and source decision',async()=>{
 await reject(f=>{f.envelopes.renewal=signWith({...f.renewal,offSequence:31},f.keys.renewal);},
  'QL443_INDEPENDENT_RENEWED_OFF_OR_MONOTONICITY_INVALID');
 await reject(f=>{f.envelopes.renewal=signWith({...f.renewal,receiverState:'ON'},f.keys.renewal);},
  'QL443_INDEPENDENT_RENEWED_OFF_OR_MONOTONICITY_INVALID');
 await reject(f=>{f.envelopes.renewal=signWith({...f.renewal,renewalNonce:'nonce_replay_12345'},f.keys.renewal);},
  'QL443_INDEPENDENT_RENEWED_OFF_OR_MONOTONICITY_INVALID');
 await reject(f=>{f.envelopes.renewal=signWith({...f.renewal,observedAt:iso(f.now-65000)},f.keys.renewal);},
  'QL443_INDEPENDENT_RENEWED_OFF_OR_MONOTONICITY_INVALID');
 await reject(f=>{f.args.independentRenewalOffProvider.readSignedFreshOff=async()=>{throw Error('offline');};},
  'QL443_INDEPENDENT_FRESH_OFF_UNAVAILABLE');
});
test('QL443 rejects two, duplicate, forged or CONNECTED-claim three-Master reports',async()=>{
 await reject(f=>{f.envelopes.reports.pop();},'QL443_THREE_DISTINCT_MASTER_REPORTS_REQUIRED');
 await reject(f=>{f.envelopes.reports[1]=f.envelopes.reports[0];},
  'QL443_THREE_MASTER_RENEWAL_SIGNED_CONSENSUS_REJECTED');
 await reject(f=>{f.envelopes.reports[0]=signWith({...f.reports[0],decision:'CONNECT_NOW'},f.keys.masters[MASTERS[0]]);},
  'QL443_THREE_MASTER_RENEWAL_SIGNED_CONSENSUS_REJECTED');
 await reject(f=>{f.envelopes.reports[0]=signWith({...f.reports[0],renewedOffDigest:'0'.repeat(64)},f.keys.masters[MASTERS[0]]);},
  'QL443_THREE_MASTER_RENEWAL_SIGNED_CONSENSUS_REJECTED');
});
test('QL443 no two-owner signed closeout or expired lease endorsement means HOLD',async()=>{
 await reject(f=>{f.reSignOwner({...f.owner,decision:'CONNECT_NOW'});},
  'QL443_FINAL_INDEPENDENT_DUAL_OWNER_DECISION_INVALID');
 await reject(f=>{f.reSignOwner({...f.owner,masterOwnerId:f.owner.sourceOwnerId});},
  'QL443_FINAL_INDEPENDENT_DUAL_OWNER_DECISION_INVALID');
 await reject(f=>{f.args.finalOwnerDecision.reviewerSignature=f.args.finalOwnerDecision.ownerSignature;},
  'QL443_FINAL_INDEPENDENT_DUAL_OWNER_DECISION_INVALID');
 await reject(f=>{f.reSignOwner({...f.owner,masterReportsDigest:'a'.repeat(64)});},
  'QL443_FINAL_INDEPENDENT_DUAL_OWNER_DECISION_INVALID');
});
test('QL443 interruption permanently reserves incident and cannot replay post-crash evidence',async()=>{
 const f=fixture();try{
  f.args.aiPlatformQl442Provider.readSignedQl442Decision=async()=>{throw Error('down');};
  assert.equal((await f.run()).reason,'QL443_AI_PLATFORM_QL442_DECISION_UNAVAILABLE');
  assert.equal((await f.run()).reason,'QL443_ONE_USE_INCIDENT_ALREADY_ATTEMPTED');
  assert.equal(readQl443ShutdownContinuity(f.shutdownLedger,incidentId).reason,
   'QL443_PENDING_INCOMPLETE_NON_REPLAYABLE');
 }finally{f.cleanup();}
});
test('QL443 corrupt private evidence never grants closeout or external reads',async()=>{
 const f=fixture();try{
  f.shutdownLedger.claimOnce('pending',incidentId,'e'.repeat(64));
  writeFileSync(join(f.root,'ql443','ql443-pending-'+incidentId+'.json'),'{}');
  assert.equal((await f.run()).reason,'QL443_CUSTODY_UNREADABLE');
  assert.equal(f.calls.source,0);
  assert.equal(readQl443ShutdownContinuity(f.shutdownLedger,incidentId).state,'HOLD');
 }finally{f.cleanup();}
});
test('QL443 private ledger needs an absolute protected directory',()=>{
 assert.throws(()=>openQl443ProtectedShutdownLedger('relative'),/ABSOLUTE_PRIVATE/);
});
