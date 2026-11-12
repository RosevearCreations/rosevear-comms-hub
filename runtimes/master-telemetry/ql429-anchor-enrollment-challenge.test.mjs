import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl426ProtectedCheckpointStore} from './ql426-durable-pilot-custody.mjs';
import {openQl427ProtectedRecoveryClosureStore} from './ql427-independent-witness-recovery.mjs';
import {openQl428ProtectedReentryDecisionStore} from './ql428-external-anchor-reentry.mjs';
import {openQl429ProtectedEnrollmentLedger,enrollQl429ExternalAnchor,
 issueQl429OriginalHostChallenge,verifyQl429OriginalHostChallenge,
 acceptQl429ThreeMasterPilotWitness} from './ql429-anchor-enrollment-challenge.mjs';

const masters=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const keys=Object.fromEntries([...masters,'anchor','reader','originalHost','owner','reviewer'].map(
 id=>[id,generateKeyPairSync('ed25519')]));
const pub=id=>keys[id].publicKey.export({format:'der',type:'spki'}).toString('base64');
const signed=(id,p)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),keys[id].privateKey).toString('base64')});
const dual=p=>({payload:p,ownerSignature:signed('owner',p).signature,reviewerSignature:signed('reviewer',p).signature});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const now=Date.parse('2026-11-12T16:00:00.000Z');
const at=(n=0)=>new Date(now+n).toISOString();
const scope={ceremonyId:'ceremony_ql429_123456',sourceId:'rosevear-ai-hub',
 episodeId:'episode_ql429_123456',sourceRevision:'a'.repeat(40),controllerRevision:'b'.repeat(40)};
const incidentId='incident_ql429_123456';
const externalStoreId='external_ql429_123456';
const anchorId='anchor_ql429_123456';
const reentryId='reentry_ql429_123456';
const requestId='request_ql429_123456';
const closureHash='c'.repeat(64);
const seq=Object.fromEntries(masters.map(id=>[id,1]));
const entry=(kind,offset,incident=null,rollback=null)=>({
 kind,scope,observedAt:at(offset),evidenceDigest:'d'.repeat(64),sequences:seq,
 incidentId:incident,receiverReadbackDigest:incident?'e'.repeat(64):null,
 rollbackCheckpointDigest:rollback
});
const enrollment={
 schema:'rosevear.ql429.external-anchor-enrollment.v1',externalStoreId,anchorId,
 originalHostMachineId:'DESKTOP-AE894KC',
 pins:{anchor:pub('anchor'),reader:pub('reader'),originalHost:pub('originalHost'),
  masters:Object.fromEntries(masters.map(id=>[id,pub(id)]))},
 ownerId:'Ree_Original',reviewerId:'Jack_Independent',createdAt:at(-10000)
};
const enrollOptions={ownerPin:pub('owner'),reviewerPin:pub('reviewer'),
 protectedOperatorSession:true,independentOwnerCustodyVerified:true,
 independentReviewerCustodyVerified:true,independentExternalStoreVerified:true,
 originalHostIdentityVerified:true,nowMs:now};
const anchorOptions={independentAnchorSignerVerified:true,
 independentReadbackSignerVerified:true,independentExternalStoreVerified:true,
 ql427ClosureIndependentlyVerified:true,protectedOperatorSession:true,nowMs:now};
const challengeOptions={...anchorOptions,ql428OwnerPrecheckIndependentlyVerified:true};
const hostOptions={protectedOperatorSession:true,independentOriginalHostSignerVerified:true,
 nowMs:now+4000};
const witnessOptions={...hostOptions,ownerPin:pub('owner'),reviewerPin:pub('reviewer'),
 independentMasterSignerPinsVerified:true,independentOwnerCustodyVerified:true,
 independentReviewerCustodyVerified:true};
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'ql429-'));
 const checkpointStore=openQl426ProtectedCheckpointStore(join(root,'ql426'));
 const closureStore=openQl427ProtectedRecoveryClosureStore(join(root,'ql427'));
 const decisionStore=openQl428ProtectedReentryDecisionStore(join(root,'ql428'));
 const ledger=openQl429ProtectedEnrollmentLedger(join(root,'ql429'));
 const h=checkpointStore.append(scope,entry('HEALTH',-60000),null);
 const rollback=checkpointStore.append(scope,entry('ROLLBACK',-50000,incidentId),h.recordDigest);
 const ack=checkpointStore.append(scope,entry('OWNER_ACK',-40000,incidentId,rollback.recordDigest),rollback.recordDigest);
 const closure=closureStore.claimOnce(ack.recordDigest,'a'.repeat(64));
 const prior=decisionStore.claimOnce(closure.recordDigest,reentryId,'b'.repeat(64));
 return {root,checkpointStore,closureStore,decisionStore,ledger,ack,closure,prior,
  close:()=>rmSync(root,{recursive:true,force:true})};
}
function approval(e=enrollment){return dual({schema:'rosevear.ql429.enrollment-owner-approval.v1',
 enrollmentDigest:hash(e),action:'ENROLL_OFF_HOST_PUBLIC_PINS_NO_RECEIVER_ACTIVATION',
 signedAt:at(-5000)});}
function proofs(e=enrollment){return Object.fromEntries(['anchor','reader','originalHost'].map(role=>
 [role,signed(role,{schema:'rosevear.ql429.pin-possession.v1',
  enrollmentDigest:hash(e),role,observedAt:at(-4000)})]));}
function enroll(f,e=enrollment,ap=approval(e),pr=proofs(e),opts=enrollOptions){
 return enrollQl429ExternalAnchor({ledger:f.ledger,enrollment:e,ownerApproval:ap,proofs:pr},opts);
}
function anchorSigned(f,patch={},readPatch={}){
 const p={schema:'rosevear.ql428.external-closure-anchor.v1',scope,incidentId,
  checkpointIndex:f.ack.index,checkpointDigest:f.ack.recordDigest,
  closureReceiptDigest:f.closure.recordDigest,closurePayloadDigest:f.closure.payloadDigest,
  anchorId,externalStoreId,anchorSequence:14,anchoredAt:at(-25000),...patch};
 const r={schema:'rosevear.ql428.external-anchor-readback.v1',scope,anchorId,
  anchorDigest:hash(p),requestId,externalStoreId,remoteDurable:true,
  remoteSequence:14,retrievedAt:at(-1000),...readPatch};
 return {anchor:signed('anchor',p),readback:signed('reader',r)};
}
function issueArgs(f,overrides={}){
 return {ledger:f.ledger,checkpointStore:f.checkpointStore,closureStore:f.closureStore,
  decisionStore:f.decisionStore,scope,anchorClient:{readSignedAnchor:async()=>anchorSigned(f)},
  externalStoreId,reentryId,closureReceiptDigest:f.closure.recordDigest,requestId,...overrides};
}
async function issue(f,overrides={},opts=challengeOptions){
 return issueQl429OriginalHostChallenge(issueArgs(f,overrides),opts);
}
function hostEnvelope(challenge,patch={}){
 const p={schema:'rosevear.ql429.original-host-fresh-response.v1',scope,incidentId,
  externalStoreId,reentryId,challengeDigest:hash(challenge),
  challengeId:challenge.challengeId,hostMachineId:'DESKTOP-AE894KC',
  receiverState:'OFF',nextCeremonyId:'new_ceremony_ql429_123456',
  respondedAt:at(1000),...patch};
 return signed('originalHost',p);
}
function witnesses(challenge,response,patch={}){
 return masters.map(masterId=>signed(masterId,{
  schema:'rosevear.ql429.master-pilot-reentry-witness.v1',
  masterId,scope,incidentId,externalStoreId,
  closureReceiptDigest:challenge.closureReceiptDigest,reentryId,
  challengeDigest:hash(challenge),hostResponseDigest:hash(response.payload),
  nextCeremonyId:response.payload.nextCeremonyId,
  status:'WITNESSED_NEW_SUPERVISED_PILOT_PRECHECK_ONLY',
  witnessedAt:at(2000),...patch}));
}
function ownerDecision(challenge,response,rs,patch={}){
 const ordered=rs.map(x=>x.payload).sort((a,b)=>masters.indexOf(a.masterId)-masters.indexOf(b.masterId));
 return dual({schema:'rosevear.ql429.owner-three-master-pilot-witness.v1',
  scope,incidentId,externalStoreId,reentryId,closureReceiptDigest:challenge.closureReceiptDigest,
  challengeDigest:hash(challenge),hostResponseDigest:hash(response.payload),
  nextCeremonyId:response.payload.nextCeremonyId,mastersDigest:hash(ordered),
  action:'ACCEPT_SIGNED_PRECHECK_ONLY_REQUIRE_NEW_QL424_CEREMONY_KEEP_OFF',
  ownerId:'Ree_Original',reviewerId:'Jack_Independent',approvedAt:at(3000),
  ...patch});
}
async function setupWitness(f){
 assert.equal(enroll(f).state,'DURABLE_EXTERNAL_ANCHOR_PUBLIC_PINS_ENROLLED');
 const {challenge,state}=await issue(f);
 assert.equal(state,'FRESH_ORIGINAL_HOST_CHALLENGE_ISSUED');
 const host=hostEnvelope(challenge),rs=witnesses(challenge,host);
 return {challenge,host,rs,owner:ownerDecision(challenge,host,rs)};
}
test('signed independent owner plus key-possession proofs durably enroll public pins; duplicate refused',()=>{
 const f=fixture();try{
  const r=enroll(f);
  assert.equal(r.state,'DURABLE_EXTERNAL_ANCHOR_PUBLIC_PINS_ENROLLED');
  assert.equal(r.connection,'HOLD');
  const persisted=openQl429ProtectedEnrollmentLedger(join(f.root,'ql429'))
   .read('enrollment',externalStoreId);
  assert.equal(persisted.payload.enrollment.pins.originalHost,pub('originalHost'));
  assert.equal(enroll(f).state,'HOLD');
 }finally{f.close();}
});
test('enrollment rejects swapped pins, forged original host, reused owners and missing physical authority',()=>{
 const cases=[
  {...enrollment,pins:{...enrollment.pins,reader:pub('anchor')}},
  {...enrollment,originalHostMachineId:'TEMPLAR'},
  {...enrollment,reviewerId:'Ree_Original'}
 ];
 for(const e of cases){const f=fixture();try{assert.equal(enroll(f,e,approval(e),proofs(e)).state,'HOLD');}finally{f.close();}}
 const f=fixture();try{
  const forged=proofs();forged.originalHost=signed('owner',forged.originalHost.payload);
  assert.equal(enroll(f,enrollment,approval(),forged).state,'HOLD');
  assert.equal(enroll(f,enrollment,approval(),proofs(),
   {...enrollOptions,originalHostIdentityVerified:false}).state,'HOLD');
 }finally{f.close();}
});
test('fresh original-host challenge requires the verified QL-428 durable precheck and remote readback',async()=>{
 const f=fixture();try{
  assert.equal(enroll(f).state,'DURABLE_EXTERNAL_ANCHOR_PUBLIC_PINS_ENROLLED');
  const r=await issue(f);
  assert.equal(r.state,'FRESH_ORIGINAL_HOST_CHALLENGE_ISSUED');
  assert.equal(r.connection,'HOLD');
  assert.notEqual(r.challenge.challengeId,scope.ceremonyId);
  assert.equal((await issue(f)).state,'HOLD');
 }finally{f.close();}
});
test('expired QL-428 receipt, forged off-host anchor and absent independent checks cannot issue',async()=>{
 const f=fixture();try{
  enroll(f);
  const wrong=anchorSigned(f,{checkpointDigest:'f'.repeat(64)});
  assert.equal((await issue(f,{anchorClient:{readSignedAnchor:async()=>wrong}})).state,'HOLD');
  assert.equal((await issue(f,{}, {...challengeOptions,ql428OwnerPrecheckIndependentlyVerified:false})).state,'HOLD');
  assert.equal((await issue(f,{closureReceiptDigest:'f'.repeat(64)})).state,'HOLD');
  assert.equal(f.ledger.read('challenge',reentryId),null);
 }finally{f.close();}
});
test('signed original-host OFF challenge and next distinct ceremony are required',async()=>{
 const f=fixture();try{
  const {challenge,host}=await setupWitness(f);
  const result=verifyQl429OriginalHostChallenge({ledger:f.ledger,externalStoreId,reentryId,
   hostEnvelope:host},hostOptions);
  assert.equal(result.state,'SIGNED_ORIGINAL_HOST_CHALLENGE_VERIFIED');
  assert.equal(result.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  const cases=[
   hostEnvelope(challenge,{receiverState:'ON'}),
   hostEnvelope(challenge,{hostMachineId:'TEMPLAR'}),
   hostEnvelope(challenge,{nextCeremonyId:scope.ceremonyId}),
   hostEnvelope(challenge,{challengeId:'wrong_challenge_12345'}),
   hostEnvelope(challenge,{respondedAt:at(-60000)}),
   signed('owner',host.payload)
  ];
  for(const h of cases){
   assert.equal(verifyQl429OriginalHostChallenge({
    ledger:f.ledger,externalStoreId,reentryId,hostEnvelope:h},hostOptions).state,'HOLD');
  }
  assert.equal(verifyQl429OriginalHostChallenge({
   ledger:f.ledger,externalStoreId,reentryId,hostEnvelope:host},{
    ...hostOptions,nowMs:now+62000}).state,'HOLD');
 }finally{f.close();}
});
test('three independent Master signatures, dual human approval and durable reentry witness never activate receiver',async()=>{
 const f=fixture();try{
  const {host,rs,owner}=await setupWitness(f);
  const args={ledger:f.ledger,externalStoreId,reentryId,hostEnvelope:host,reports:rs,ownerDecision:owner};
  const r=acceptQl429ThreeMasterPilotWitness(args,witnessOptions);
  assert.equal(r.state,'DURABLE_THREE_MASTER_PILOT_REENTRY_WITNESS_NO_ACTIVATION');
  assert.equal(r.connection,'HOLD');
  assert.equal(r.receiver,'OFF_VERIFIED_SIGNED_READBACK');
  assert.equal(r.masterCount,3);
  assert.equal(openQl429ProtectedEnrollmentLedger(join(f.root,'ql429'))
   .read('witness',reentryId).recordDigest,r.witnessDigest);
  assert.equal(acceptQl429ThreeMasterPilotWitness(args,witnessOptions).state,'HOLD');
 }finally{f.close();}
});
test('missing, duplicate, forged Master or unsanctioned owner action stays HOLD',async()=>{
 const f=fixture();try{
  const {challenge,host,rs,owner}=await setupWitness(f);
  const args={ledger:f.ledger,externalStoreId,reentryId,hostEnvelope:host,reports:rs,
   ownerDecision:owner};
  const cases=[
   {...args,reports:rs.slice(0,2)},
   {...args,reports:[rs[0],rs[0],rs[2]]},
   {...args,reports:[signed('owner',rs[0].payload),rs[1],rs[2]]},
   {...args,ownerDecision:ownerDecision(challenge,host,rs,{action:'ENABLE_RECEIVER'})},
   {...args,ownerDecision:ownerDecision(challenge,host,rs,{reviewerId:'Ree_Original'})},
   {...args,ownerDecision:{...owner,reviewerSignature:signed('owner',owner.payload).signature}}
  ];
  for(const bad of cases)assert.equal(acceptQl429ThreeMasterPilotWitness(bad,witnessOptions).state,'HOLD');
  assert.equal(f.ledger.read('witness',reentryId),null);
 }finally{f.close();}
});
test('tampered durable challenge and original-host enrollment fail closed',async()=>{
 const f=fixture();try{
  const {host}=await setupWitness(f);
  const file=readdirSync(join(f.root,'ql429')).find(n=>n.includes('-challenge-'));
  const path=join(f.root,'ql429',file);
  const obj=JSON.parse(readFileSync(path,'utf8'));
  obj.payload.challenge.challengeId='forged_challenge_12345';
  writeFileSync(path,JSON.stringify(obj));
  assert.equal(verifyQl429OriginalHostChallenge({
   ledger:f.ledger,externalStoreId,reentryId,hostEnvelope:host},hostOptions).state,'HOLD');
 }finally{f.close();}
});
