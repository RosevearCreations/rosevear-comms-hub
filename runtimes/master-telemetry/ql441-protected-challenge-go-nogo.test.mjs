import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl440ProtectedCeremonyLedger} from './ql440-fresh-ceremony-authorization.mjs';
import {openQl441ProtectedChallengeLedger,prepareQl441Challenge,
 readQl441ChallengeContinuity,runQl441ProtectedChallenge}
 from './ql441-protected-challenge-go-nogo.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=()=>{const keys=generateKeyPairSync('ed25519');return{
 privateKey:keys.privateKey,pin:keys.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 k.privateKey).toString('base64')});
const iso=n=>new Date(n).toISOString();
const incident='incident_ql441_12345678';
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql441-'));
 const now=Date.now()-3000;
 const issuedLedger=openQl440ProtectedCeremonyLedger(join(root,'ql440'));
 const challengeLedger=openQl441ProtectedChallengeLedger(join(root,'ql441'));
 const pending440=issuedLedger.claimOnce('pending',incident,'a'.repeat(64));
 const issued440=issuedLedger.claimOnce('issued',incident,'b'.repeat(64));
 const keys={issuer:key(),source:key(),master:key(),consumer:key(),host:key(),
  receiver:key(),masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 const priorIssuePayload={schema:'rosevear.ql440.original-host-signed-ceremony-issuance.v1',
  requestDigest:'c'.repeat(64),hostMachineId:'DESKTOP-AE894KC',
  ceremonyId:'fresh_ql441_ceremony',episodeId:'fresh_ql441_episode',
  ceremonyNonce:'ql440_ceremony_nonce_441',independentOffDigest:'d'.repeat(64),
  masterDecisionDigest:'e'.repeat(64),ownerDecisionDigest:'f'.repeat(64),
  authority:'FRESH_QL429_QL430_CEREMONY_CHALLENGE_ONLY_NO_RECEIVER_ON',issuedAt:iso(now-10000)};
 let priorIssue=signed(priorIssuePayload,keys.issuer);
 const prior={state:'DURABLE_QL440_NEW_CEREMONY_AUTHORIZATION_PREREQUISITES_ACCEPTED',
  connection:'HOLD',activationAuthorized:false,ceremonyAuthorizationIssued:true,
  masterCount:3,receiver:'OFF_VERIFIED_FRESH_HOST_AND_INDEPENDENT_OBSERVER',
  ownerAcceptance:'DUAL_SIGNED_CEREMONY_CHALLENGE_ISSUANCE_ONLY',
  permittedNextAction:'SEPARATE_PROTECTED_QL429_QL430_SUPERVISED_CHALLENGE_NO_AUTOMATIC_ON',
  originalIncidentId:incident,ceremonyId:priorIssuePayload.ceremonyId,
  episodeId:priorIssuePayload.episodeId,ceremonyNonce:priorIssuePayload.ceremonyNonce,
  independentOffDigest:priorIssuePayload.independentOffDigest,
  masterDecisionDigest:priorIssuePayload.masterDecisionDigest,
  originalHostIssuanceDigest:hash(priorIssuePayload),
  pendingReceiptDigest:pending440.recordDigest,issuanceReceiptDigest:issued440.recordDigest};
 const challengeId='ql441_challenge_abcdef',challengeNonce='ql441_challenge_nonce_abcd',
  leaseId='ql441_lease_abcdef',leaseExpiresAt=iso(now+30000);
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl440SourceVerified:true,originalHostIssuerPinVerified:true,
  originalSourceOwnerCustodyVerified:true,independentMasterOwnerCustodyVerified:true,
  originalHostConsumerPinVerified:true,originalHostOnPinVerified:true,
  independentReceiverOnPinVerified:true,independentMasterPinsVerified:true,
  originalHostIssuerPin:keys.issuer.pin,sourceOwnerPin:keys.source.pin,
  masterOwnerPin:keys.master.pin,hostConsumerPin:keys.consumer.pin,
  hostOnPin:keys.host.pin,independentReceiverOnPin:keys.receiver.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))};
 const args={ql440Authorization:prior,ql440Ledger:issuedLedger,challengeId,
  challengeNonce,leaseId,leaseExpiresAt,challengeLedger};
 const prep=prepareQl441Challenge(args,opts);
 assert.equal(prep.state,'QL441_PROTECTED_CHALLENGE_PREPARED_NO_ACTIVATION');
 const r=prep.request;
 const sourcePayload={schema:'rosevear.ql441.separate-owner-isolated-witness-approval.v1',
  ownerRole:'source',ownerId:'Ree_Original',requestDigest:prep.requestDigest,
  challengeId,leaseId,leaseExpiresAt,
  action:'AUTHORIZE_BOUNDED_ISOLATED_ON_OBSERVATION_ONLY_NO_CONNECT',approvedAt:iso(now)};
 const masterPayload={...sourcePayload,ownerRole:'master',ownerId:'Jack_Independent'};
 args.ownerApprovals={source:signed(sourcePayload,keys.source),
  master:signed(masterPayload,keys.master)};
 const consumePayload={schema:'rosevear.ql441.original-host-protected-challenge-consumption.v1',
  requestDigest:prep.requestDigest,hostMachineId:'DESKTOP-AE894KC',challengeId,
  challengeNonce,leaseId,leaseExpiresAt,ql440IssuerDigest:hash(priorIssuePayload),
  sourceOwnerDigest:hash(sourcePayload),masterOwnerDigest:hash(masterPayload),
  watchdogArmed:true,consumptionSequence:10,consumedAt:iso(now)};
 let consume=signed(consumePayload,keys.consumer);
 const hostPayload={schema:'rosevear.ql441.original-host-isolated-on-observation.v1',
  requestDigest:prep.requestDigest,hostMachineId:'DESKTOP-AE894KC',
  challengeId,challengeNonce,leaseId,leaseExpiresAt,
  consumptionDigest:hash(consumePayload),receiverState:'ON',watchdogArmed:true,
  onSequence:11,observedAt:iso(now)};
 let host=signed(hostPayload,keys.host);
 const independentPayload={schema:'rosevear.ql441.independent-isolated-receiver-on-readback.v1',
  requestDigest:prep.requestDigest,challengeId,challengeNonce,leaseId,leaseExpiresAt,
  hostOnDigest:hash(hostPayload),receiverState:'ON',onSequence:11,observedAt:iso(now)};
 let independent=signed(independentPayload,keys.receiver);
 let reports=MASTERS.map(masterId=>signed({
  schema:'rosevear.ql441.three-master-on-witness-decision.v1',masterId,
  requestDigest:prep.requestDigest,independentOnDigest:hash(independentPayload),
  decision:'GO_WITNESS_ACCEPTANCE_ONLY_NO_CONNECT',reviewedAt:iso(now)},
  keys.masters[masterId]));
 const finalPayload={schema:'rosevear.ql441.dual-owner-on-witness-final-decision.v1',
  requestDigest:prep.requestDigest,independentOnDigest:hash(independentPayload),
  masterReportsDigest:hash(reports.map(x=>x.payload)),
  sourceOwnerDigest:hash(sourcePayload),masterOwnerDigest:hash(masterPayload),
  decision:'DUAL_OWNER_GO_ACCEPT_WITNESSED_ON_AND_REQUIRE_SHUTDOWN',
  sourceOwnerId:sourcePayload.ownerId,masterOwnerId:masterPayload.ownerId,
  reviewedAt:iso(now)};
 const signFinal=p=>({payload:p,sourceSignature:signed(p,keys.source).signature,
  masterSignature:signed(p,keys.master).signature});
 args.finalOwnerDecision=signFinal(finalPayload);
 const count={issue:0,consume:0,host:0,receiver:0,masters:0};
 args.originalIssuerProvider={readSignedIssuance:async()=>{count.issue++;return priorIssue;}};
 args.originalHostConsumer={readSignedConsumption:async()=>{count.consume++;return consume;}};
 args.originalHostOnProvider={readSignedOn:async()=>{count.host++;return host;}};
 args.independentOnProvider={readSignedOn:async()=>{count.receiver++;return independent;}};
 args.masterDecisionProvider={readSignedDecisions:async()=>{count.masters++;return reports;}};
 return {root,now,prior,priorIssuePayload,issuedLedger,challengeLedger,
  challengeId,challengeNonce,leaseId,leaseExpiresAt,
  opts,args,keys,prep,request:r,sourcePayload,masterPayload,
  consumePayload,hostPayload,independentPayload,finalPayload,reports,count,
  setIssue:p=>{priorIssue=signed(p,keys.issuer);},
  setConsume:p=>{consume=signed(p,keys.consumer);},
  setHost:p=>{host=signed(p,keys.host);},
  setIndependent:p=>{independent=signed(p,keys.receiver);},
  setReport:(n,p)=>{reports[n]=signed(p,keys.masters[p.masterId]??keys.masters[MASTERS[n]]);},
  setFinal:p=>{args.finalOwnerDecision=signFinal(p);},
  run:()=>runQl441ProtectedChallenge(args,opts),
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
async function rejectCase(change,reason){
 const f=fixture();
 try{change(f);const result=await f.run();
  assert.equal(result.connection,'HOLD');assert.equal(result.activationAuthorized,false);
  assert.equal(result.manualReceiverIsolationRequired,true);
  assert.equal(result.reason,reason);
 }finally{f.cleanup();}
}
test('QL441 exact signed protected QL440 consumes one challenge; GO only acknowledges ON witness',async()=>{
 const f=fixture();
 try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL441_GO_WITNESSED_ON_REVIEW_ONLY');
  assert.equal(r.decision,'GO_WITNESS_ACCEPTANCE_ONLY');
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.receiver,'ON_WITNESSED_ISOLATED_LEASE_SHUTDOWN_REQUIRED');
  assert.equal(r.masterCount,3);assert.equal(r.manualReceiverIsolationRequired,true);
  assert.equal(f.count.issue,1);assert.equal(f.count.receiver,1);
  const reboot=readQl441ChallengeContinuity(f.challengeLedger,incident);
  assert.equal(reboot.state,'QL441_PRIVATE_DECISION_FRESH_OFF_AND_LEASE_CLOSEOUT_REQUIRED');
  assert.equal(reboot.connection,'HOLD');assert.equal(reboot.activationAuthorized,false);
  const again=await f.run();
  assert.equal(again.reason,'QL441_ONE_USE_INCIDENT_ALREADY_CONSUMED');
  assert.equal(f.count.issue,1);
 }finally{f.cleanup();}
});
test('QL441 signed independent three-Master NO_GO has durable STOP even with witnessed ON',async()=>{
 const f=fixture();
 try{
  const report={...f.reports[1].payload,decision:'NO_GO_SHUTDOWN_REQUIRED'};
  f.setReport(1,report);
  const alteredReports=f.reports.map(x=>x.payload);
  f.setFinal({...f.finalPayload,masterReportsDigest:hash(alteredReports),
   decision:'DUAL_OWNER_NO_GO_REQUIRE_IMMEDIATE_SHUTDOWN'});
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL441_NO_GO_WITNESSED_ON_SHUTDOWN_REQUIRED');
  assert.equal(r.decision,'NO_GO_SHUTDOWN_REQUIRED');
  assert.equal(r.activationAuthorized,false);assert.equal(r.connection,'HOLD');
  assert.equal(r.manualReceiverIsolationRequired,true);
 }finally{f.cleanup();}
});
test('QL441 fails closed on altered QL440, reused nonce, overlong lease and wrong protected session',async()=>{
 await rejectCase(f=>{f.prior.ceremonyAuthorizationIssued=false;},
  'QL441_PROTECTED_QL440_OR_BOUNDED_LEASE_INVALID');
 await rejectCase(f=>{f.args.challengeNonce=f.prior.ceremonyNonce;},
  'QL441_PROTECTED_QL440_OR_BOUNDED_LEASE_INVALID');
 await rejectCase(f=>{f.args.leaseExpiresAt=iso(f.now+300000);},
  'QL441_PROTECTED_QL440_OR_BOUNDED_LEASE_INVALID');
 await rejectCase(f=>{f.opts.protectedOriginalHostSession=false;},
  'QL441_PROTECTED_QL440_OR_BOUNDED_LEASE_INVALID');
 await rejectCase(f=>{f.prior.issuanceReceiptDigest='b'.repeat(64);},
  'QL441_PROTECTED_QL440_OR_BOUNDED_LEASE_INVALID');
});
test('QL441 separates source and Master owner identity; blocks collusion, impersonation and reused keys',async()=>{
 await rejectCase(f=>{f.args.ownerApprovals.master=f.args.ownerApprovals.source;},
  'QL441_SEPARATE_SIGNED_OWNER_APPROVALS_REQUIRED');
 await rejectCase(f=>{f.opts.masterOwnerPin=f.opts.sourceOwnerPin;},
  'QL441_INDEPENDENT_SIGNER_CUSTODY_REQUIRED');
 await rejectCase(f=>{f.opts.originalSourceOwnerCustodyVerified=false;},
  'QL441_SEPARATE_SIGNED_OWNER_APPROVALS_REQUIRED');
 await rejectCase(f=>{f.args.ownerApprovals.source.payload.ownerId='Imposter';},
  'QL441_SEPARATE_SIGNED_OWNER_APPROVALS_REQUIRED');
});
test('QL441 QL440 original signer, host challenge consumption, machine and watchdog must verify',async()=>{
 await rejectCase(f=>f.setIssue({...f.priorIssuePayload,hostMachineId:'TEMPLAR'}),
  'QL441_QL440_ORIGINAL_ISSUER_INVALID');
 await rejectCase(f=>f.setConsume({...f.consumePayload,hostMachineId:'TEMPLAR'}),
  'QL441_PROTECTED_HOST_CONSUMPTION_INVALID');
 await rejectCase(f=>f.setConsume({...f.consumePayload,watchdogArmed:false}),
  'QL441_PROTECTED_HOST_CONSUMPTION_INVALID');
 await rejectCase(f=>f.setConsume({...f.consumePayload,ql440IssuerDigest:'a'.repeat(64)}),
  'QL441_PROTECTED_HOST_CONSUMPTION_INVALID');
});
test('QL441 rejects signed host ON with wrong machine, unarmed watchdog, sequence rollback',async()=>{
 await rejectCase(f=>f.setHost({...f.hostPayload,hostMachineId:'TEMPLAR'}),
  'QL441_ORIGINAL_HOST_ON_LEASE_INVALID');
 await rejectCase(f=>f.setHost({...f.hostPayload,watchdogArmed:false}),
  'QL441_ORIGINAL_HOST_ON_LEASE_INVALID');
 await rejectCase(f=>f.setHost({...f.hostPayload,onSequence:10}),
  'QL441_ORIGINAL_HOST_ON_LEASE_INVALID');
 await rejectCase(f=>f.setHost({...f.hostPayload,receiverState:'OFF'}),
  'QL441_ORIGINAL_HOST_ON_LEASE_INVALID');
});
test('QL441 rejects missing, stale, mismatched or OFF independent ON witness',async()=>{
 await rejectCase(f=>{f.args.independentOnProvider.readSignedOn=async()=>{throw Error('down');};},
  'QL441_INDEPENDENT_ON_WITNESS_UNAVAILABLE');
 await rejectCase(f=>f.setIndependent({...f.independentPayload,receiverState:'OFF'}),
  'QL441_INDEPENDENT_ON_WITNESS_OR_LEASE_INVALID');
 await rejectCase(f=>f.setIndependent({...f.independentPayload,onSequence:10}),
  'QL441_INDEPENDENT_ON_WITNESS_OR_LEASE_INVALID');
 await rejectCase(f=>f.setIndependent({...f.independentPayload,observedAt:iso(f.now-120000)}),
  'QL441_INDEPENDENT_ON_WITNESS_OR_LEASE_INVALID');
 await rejectCase(f=>f.setIndependent({...f.independentPayload,hostOnDigest:'c'.repeat(64)}),
  'QL441_INDEPENDENT_ON_WITNESS_OR_LEASE_INVALID');
});
test('QL441 rejects incomplete, forged, duplicate and stale Masters',async()=>{
 await rejectCase(f=>{f.reports.pop();},'QL441_SIGNED_THREE_MASTER_ON_DECISION_REJECTED');
 await rejectCase(f=>{f.reports[1]=f.reports[0];},
  'QL441_SIGNED_THREE_MASTER_ON_DECISION_REJECTED');
 await rejectCase(f=>f.setReport(0,{...f.reports[0].payload,reviewedAt:iso(f.now-120000)}),
  'QL441_SIGNED_THREE_MASTER_ON_DECISION_REJECTED');
 await rejectCase(f=>f.setReport(0,{...f.reports[0].payload,decision:'CONNECT_NOW'}),
  'QL441_SIGNED_THREE_MASTER_ON_DECISION_REJECTED');
});
test('QL441 cannot accept GO without final separate signed dual-owner matching decision',async()=>{
 await rejectCase(f=>f.setFinal({...f.finalPayload,decision:'CONNECT_NOW'}),
  'QL441_FINAL_DUAL_OWNER_ON_DECISION_REJECTED');
 await rejectCase(f=>{f.args.finalOwnerDecision.masterSignature=f.args.finalOwnerDecision.sourceSignature;},
  'QL441_FINAL_DUAL_OWNER_ON_DECISION_REJECTED');
 await rejectCase(f=>f.setFinal({...f.finalPayload,masterReportsDigest:'e'.repeat(64)}),
  'QL441_FINAL_DUAL_OWNER_ON_DECISION_REJECTED');
});
test('QL441 interruption consumes incident once; reboot never reads old ON as current state',async()=>{
 const f=fixture();
 try{
  f.args.originalHostConsumer.readSignedConsumption=async()=>{throw Error('off');};
  const first=await f.run();
  assert.equal(first.reason,'QL441_ORIGINAL_HOST_CONSUMPTION_UNAVAILABLE');
  assert.equal(readQl441ChallengeContinuity(f.challengeLedger,incident).connection,'HOLD');
  const retry=await f.run();
  assert.equal(retry.reason,'QL441_ONE_USE_INCIDENT_ALREADY_CONSUMED');
 }finally{f.cleanup();}
});
test('QL441 tampered protected custody is HOLD and blocks external reads',async()=>{
 const f=fixture();
 try{
  f.challengeLedger.claimOnce('pending',incident,'f'.repeat(64));
  writeFileSync(join(f.root,'ql441','ql441-pending-'+incident+'.json'),'{}');
  const result=await f.run();
  assert.equal(result.reason,'QL441_LEDGER_UNREADABLE');
  assert.equal(f.count.issue,0);
  assert.equal(readQl441ChallengeContinuity(f.challengeLedger,incident).connection,'HOLD');
 }finally{f.cleanup();}
});
test('QL441 refuses relative or weakly protected ledger',()=>{
 const f=fixture();
 try{assert.throws(()=>openQl441ProtectedChallengeLedger('relative'),
  /ABSOLUTE_PRIVATE_LEDGER/);}
 finally{f.cleanup();}
});
