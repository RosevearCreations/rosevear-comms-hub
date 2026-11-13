import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl439ProtectedReadinessLedger} from './ql439-renewed-off-readiness.mjs';
import {openQl440ProtectedCeremonyLedger,prepareQl440Authorization,
 readQl440AuthorizationContinuity,runQl440FreshCeremonyAuthorization}
 from './ql440-fresh-ceremony-authorization.mjs';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=()=>{const pair=generateKeyPairSync('ed25519');return {
 privateKey:pair.privateKey,pin:pair.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 k.privateKey).toString('base64')});
const iso=x=>new Date(x).toISOString();
const incident='incident_ql440_12345678';
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql440-')),now=Date.now()-3000;
 const priorLedger=openQl439ProtectedReadinessLedger(join(root,'prior'));
 const ledger=openQl440ProtectedCeremonyLedger(join(root,'issuance'));
 const p=priorLedger.claimOnce('pending',incident,'a'.repeat(64));
 const ready=priorLedger.claimOnce('readiness',incident,'b'.repeat(64));
 const prior={
  state:'DURABLE_QL439_NEW_CEREMONY_REENTRY_READINESS_ONLY',
  connection:'HOLD',activationAuthorized:false,masterCount:3,
  receiver:'OFF_VERIFIED_POST_REMEDIATION_INDEPENDENT_READBACK',
  ownerAcceptance:'DUAL_SIGNED_NEW_CEREMONY_PREPARATION_ONLY',
  permittedNextAction:'NEW_QL429_QL430_FRESH_SEPARATELY_AUTHORIZED_ENROLLMENT_NOT_ACTIVATED',
  originalIncidentId:incident,previousCeremonyId:'previous_ql440_ceremony',
  proposedCeremonyId:'fresh_ql440_ceremony',proposedEpisodeId:'fresh_ql440_episode',
  renewalNonce:'renewal_nonce_ql440',
  renewedClosureAnchorDigest:'c'.repeat(64),
  independentRenewalReadbackDigest:'d'.repeat(64),
  pendingReceiptDigest:p.recordDigest,readinessReceiptDigest:ready.recordDigest};
 const ceremonyNonce='ceremony_nonce_ql440_fresh';
 const args={ql439Readiness:prior,ql439Ledger:priorLedger,
  ceremonyNonce,authorizationLedger:ledger};
 const opts={nowMs:now,protectedOriginalHostSession:true,
  independentQl439SourceVerified:true,independentOriginalHostPinVerified:true,
  independentReceiverPinVerified:true,independentMasterPinsVerified:true,
  independentOwnerCustodyVerified:true,independentReviewerCustodyVerified:true,
  independentOriginalHostIssuerPinVerified:true};
 const keys={host:key(),receiver:key(),owner:key(),reviewer:key(),issuer:key(),
  masters:Object.fromEntries(MASTERS.map(m=>[m,key()]))};
 Object.assign(opts,{hostOffPin:keys.host.pin,receiverPin:keys.receiver.pin,
  ownerPin:keys.owner.pin,reviewerPin:keys.reviewer.pin,
  hostIssuerPin:keys.issuer.pin,
  masterPins:Object.fromEntries(MASTERS.map(m=>[m,keys.masters[m].pin]))});
 const prep=prepareQl440Authorization(args,opts);
 assert.equal(prep.state,'QL440_AUTHORIZATION_REQUEST_PREPARED_ONLY');
 const request=prep.request;
 const hostPayload={schema:'rosevear.ql440.original-host-preauthorization-off.v1',
  requestDigest:prep.requestDigest,hostMachineId:'DESKTOP-AE894KC',
  ceremonyId:request.ceremonyId,episodeId:request.episodeId,
  ceremonyNonce,receiverState:'OFF',watchdogArmed:true,offSequence:7,observedAt:iso(now)};
 const offPayload={schema:'rosevear.ql440.independent-preauthorization-off.v1',
  requestDigest:prep.requestDigest,ceremonyId:request.ceremonyId,
  episodeId:request.episodeId,ceremonyNonce,
  hostOffDigest:hash(hostPayload),receiverState:'OFF',offSequence:7,observedAt:iso(now)};
 let host=signed(hostPayload,keys.host),off=signed(offPayload,keys.receiver);
 let reports=MASTERS.map(masterId=>signed({
  schema:'rosevear.ql440.three-master-activation-prerequisite.v1',
  masterId,requestDigest:prep.requestDigest,
  independentOffDigest:hash(offPayload),
  decision:'PREREQUISITES_ACCEPTED_NEW_CEREMONY_CHALLENGE_ONLY_NO_ON',
  reviewedAt:iso(now)},keys.masters[masterId]));
 const orderedReports=reports.map(e=>e.payload);
 const ownerPayload={schema:'rosevear.ql440.dual-owner-ceremony-issuance-decision.v1',
  requestDigest:prep.requestDigest,independentOffDigest:hash(offPayload),
  masterDecisionDigest:hash(orderedReports),
  decision:'ISSUE_FRESH_CEREMONY_CHALLENGE_AUTHORITY_ONLY_NO_ON',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',issuedAt:iso(now)};
 let ownerDecision={payload:ownerPayload,
  ownerSignature:signed(ownerPayload,keys.owner).signature,
  reviewerSignature:signed(ownerPayload,keys.reviewer).signature};
 const issuancePayload={schema:'rosevear.ql440.original-host-signed-ceremony-issuance.v1',
  requestDigest:prep.requestDigest,hostMachineId:'DESKTOP-AE894KC',
  ceremonyId:request.ceremonyId,episodeId:request.episodeId,ceremonyNonce,
  independentOffDigest:hash(offPayload),masterDecisionDigest:hash(orderedReports),
  ownerDecisionDigest:hash(ownerPayload),
  authority:'FRESH_QL429_QL430_CEREMONY_CHALLENGE_ONLY_NO_RECEIVER_ON',issuedAt:iso(now)};
 let issuance=signed(issuancePayload,keys.issuer);
 const count={host:0,off:0,masters:0,issue:0};
 args.originalHostOffAdapter={readSignedOff:async()=>{count.host++;return host;}};
 args.independentReceiverAdapter={readSignedOff:async()=>{count.off++;return off;}};
 args.masterDecisionProvider={readSignedDecisions:async()=>{count.masters++;return reports;}};
 args.originalHostIssuer={issueSignedAuthorization:async()=>{count.issue++;return issuance;}};
 args.ownerDecision=ownerDecision;
 const run=()=>runQl440FreshCeremonyAuthorization(args,opts);
 const resignHost=p=>{host=signed(p,keys.host);};
 const resignOff=p=>{off=signed(p,keys.receiver);};
 const resignReport=(idx,p)=>{reports[idx]=signed(p,keys.masters[p.masterId]??keys.masters[MASTERS[idx]]);};
 const resignIssue=p=>{issuance=signed(p,keys.issuer);};
 const resignOwners=p=>{
  ownerDecision={payload:p,ownerSignature:signed(p,keys.owner).signature,
   reviewerSignature:signed(p,keys.reviewer).signature};args.ownerDecision=ownerDecision;
 };
 return {root,prior,priorLedger,ledger,args,opts,keys,prep,request,
  hostPayload,offPayload,ownerPayload,issuancePayload,reports,
  run,resignHost,resignOff,resignReport,resignIssue,resignOwners,count,
  cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
async function rejectCase(change,reason){
 const f=fixture();try{change(f);const r=await f.run();
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.ceremonyAuthorizationIssued,false);
  if(reason)assert.equal(r.reason,reason);
 }finally{f.cleanup();}
}
test('QL440 fresh signed host+independent OFF, 3 Masters, dual owner, signed issuer and durable HOLD',async()=>{
 const f=fixture();try{
  const r=await f.run();
  assert.equal(r.state,'DURABLE_QL440_NEW_CEREMONY_AUTHORIZATION_PREREQUISITES_ACCEPTED');
  assert.equal(r.connection,'HOLD');assert.equal(r.activationAuthorized,false);
  assert.equal(r.receiver,'OFF_VERIFIED_FRESH_HOST_AND_INDEPENDENT_OBSERVER');
  assert.equal(r.ceremonyAuthorizationIssued,true);assert.equal(r.masterCount,3);
  assert.equal(f.count.issue,1);
  const later=readQl440AuthorizationContinuity(f.ledger,incident);
  assert.equal(later.connection,'HOLD');assert.equal(later.activationAuthorized,false);
  assert.equal(later.state,'QL440_DURABLE_PRIVATE_ISSUANCE_NEW_OFF_AND_OWNER_CHALLENGE_REQUIRED');
  const replay=await f.run();
  assert.equal(replay.reason,'QL440_ALREADY_ATTEMPTED_ONE_USE_INCIDENT');
  assert.equal(f.count.host,1);
 }finally{f.cleanup();}
});
test('QL440 refuses missing protected QL439 source, old nonce, changed receipt',async()=>{
 await rejectCase(f=>{f.opts.independentQl439SourceVerified=false;},
  'QL439_EXACT_READINESS_OR_NEW_NONCE_INVALID');
 await rejectCase(f=>{f.args.ceremonyNonce=f.prior.renewalNonce;},
  'QL439_EXACT_READINESS_OR_NEW_NONCE_INVALID');
 await rejectCase(f=>{f.prior.readinessReceiptDigest='a'.repeat(64);},
  'QL439_EXACT_READINESS_OR_NEW_NONCE_INVALID');
 await rejectCase(f=>{f.prior.state='HOLD';},
  'QL439_EXACT_READINESS_OR_NEW_NONCE_INVALID');
});
test('QL440 rejects wrong host, receiver ON or disarmed watchdog',async()=>{
 await rejectCase(f=>f.resignHost({...f.hostPayload,hostMachineId:'TEMPLAR'}),
  'QL440_ORIGINAL_HOST_OFF_OR_WATCHDOG_INVALID');
 await rejectCase(f=>f.resignHost({...f.hostPayload,receiverState:'ON'}),
  'QL440_ORIGINAL_HOST_OFF_OR_WATCHDOG_INVALID');
 await rejectCase(f=>f.resignHost({...f.hostPayload,watchdogArmed:false}),
  'QL440_ORIGINAL_HOST_OFF_OR_WATCHDOG_INVALID');
});
test('QL440 rejects independent ON, stale, forged, or sequence rollback',async()=>{
 await rejectCase(f=>f.resignOff({...f.offPayload,receiverState:'ON'}),
  'QL440_INDEPENDENT_OFF_SIGNATURE_OR_SEQUENCE_INVALID');
 await rejectCase(f=>f.resignOff({...f.offPayload,offSequence:6}),
  'QL440_INDEPENDENT_OFF_SIGNATURE_OR_SEQUENCE_INVALID');
 await rejectCase(f=>f.resignOff({...f.offPayload,observedAt:iso(f.opts.nowMs-120000)}),
  'QL440_INDEPENDENT_OFF_SIGNATURE_OR_SEQUENCE_INVALID');
 await rejectCase(f=>{f.opts.receiverPin=f.keys.host.pin;},
  'DISTINCT_INDEPENDENT_ED25519_SIGNER_PINS_REQUIRED');
});
test('QL440 rejects missing/duplicate Master, ON decision, owner mutation',async()=>{
 await rejectCase(f=>{f.reports.pop();},'QL440_THREE_MASTER_PREREQUISITES_REJECTED');
 await rejectCase(f=>{f.reports[1]=f.reports[0];},
  'QL440_THREE_MASTER_PREREQUISITES_REJECTED');
 await rejectCase(f=>f.resignReport(0,{...f.reports[0].payload,
  decision:'RECEIVER_ON_APPROVED'}),'QL440_THREE_MASTER_PREREQUISITES_REJECTED');
 await rejectCase(f=>f.resignOwners({...f.ownerPayload,
  decision:'RECEIVER_ON_APPROVED'}),'QL440_DUAL_OWNER_CEREMONY_AUTHORITY_REJECTED');
});
test('QL440 rejects issuer wrong machine, broadened authority and stale issuance',async()=>{
 await rejectCase(f=>f.resignIssue({...f.issuancePayload,
  hostMachineId:'TEMPLAR'}),'QL440_ORIGINAL_HOST_AUTHORIZATION_SIGNATURE_INVALID');
 await rejectCase(f=>f.resignIssue({...f.issuancePayload,
  authority:'ACTIVATE_RECEIVER_ON'}),'QL440_ORIGINAL_HOST_AUTHORIZATION_SIGNATURE_INVALID');
 await rejectCase(f=>f.resignIssue({...f.issuancePayload,
  issuedAt:iso(f.opts.nowMs-120000)}),'QL440_ORIGINAL_HOST_AUTHORIZATION_SIGNATURE_INVALID');
});
test('QL440 interrupted run stays pending, no retried external readback',async()=>{
 const f=fixture();try{
  f.args.independentReceiverAdapter.readSignedOff=async()=>{throw Error('offline');};
  const first=await f.run();
  assert.equal(first.reason,'QL440_INDEPENDENT_OFF_UNAVAILABLE');
  const status=readQl440AuthorizationContinuity(f.ledger,incident);
  assert.equal(status.connection,'HOLD');assert.equal(status.ceremonyAuthorizationIssued,false);
  const retry=await f.run();
  assert.equal(retry.reason,'QL440_ALREADY_ATTEMPTED_ONE_USE_INCIDENT');
  assert.equal(f.count.host,1);
 }finally{f.cleanup();}
});
test('QL440 durable record tamper returns HOLD and prevents issuing',async()=>{
 const f=fixture();try{
  f.ledger.claimOnce('pending',incident,'f'.repeat(64));
  writeFileSync(join(f.root,'issuance','ql440-pending-'+incident+'.json'),'{}');
  const r=await f.run();
  assert.equal(r.reason,'QL440_LEDGER_UNREADABLE');
  assert.equal(readQl440AuthorizationContinuity(f.ledger,incident).connection,'HOLD');
 }finally{f.cleanup();}
});
test('QL440 requires restrictive absolute private directory',()=>{
 const f=fixture();try{
  assert.throws(()=>openQl440ProtectedCeremonyLedger('relative/path'),
   /ABSOLUTE_PRIVATE_LEDGER/);
 }finally{f.cleanup();}
});
