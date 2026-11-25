import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL495_TRIAL_SCHEMA,QL495_ACK_SCHEMA}
 from './ql495-source-provenance-master-trial.mjs';
import {QL496_CHALLENGE_SCHEMA,QL496_DEVICE_SCHEMA,QL496_REVIEW_SCHEMA}
 from './ql496-master-endpoint-contract.mjs';
import {QL497_ENROLL_SCHEMA,QL497_LEDGER_SCHEMA,QL497_HARDWARE_SCHEMA,
 reviewQl497IndependentMasterEnrollment,
 reviewQl497IndependentOriginalDevice,
 readQl497ClientReceipt,readQl497MasterReceipt,
 reconcileQl497BidirectionalReceipts}
 from './ql497-independent-master-enrollment.mjs';

const now=Date.now(),hex=ch=>ch.repeat(64);
const h=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const identities=['provider','owner','reviewer','master','client','attestor',
 'hardware-auditor','impostor'];
const keys=Object.fromEntries(identities.map(x=>[x,generateKeyPairSync('ed25519')]));
const pem=x=>keys[x].publicKey.export({type:'spki',format:'pem'});
const signed=(payload,name)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[name].privateKey).toString('base64url')});
function enrollment(changes={}){
 const base={schema:QL497_ENROLL_SCHEMA,
  enrollmentId:'enrollment_ql497_01',
  masterEndpointUrl:'https://master.private.rosevear.internal/internal/comms/master-delivery-trial',
  masterCertificateSha256:hex('a'),
  masterSignerPublicKeyDigest:createHash('sha256').update(
    keys.master.publicKey.export({type:'spki',format:'der'})).digest('hex'),
  clientCertificateSha256:hex('b'),deviceEnrollmentDigest:hex('c'),
  providerCustodyDigest:hex('d'),
  requestedAction:'REVIEW_PRIVATE_MASTER_ENDPOINT_CUSTODY_ONLY',
  role:'provider',actorId:'provider_actor_497',
  issuedAtMs:now-500,expiresAtMs:now+60000,
  customerDataIncluded:false,authorityTransfer:false};
 const provider=signed({...base,...changes.provider},changes.providerSigner??'provider');
 const owner=signed({...base,role:'owner',actorId:'owner_actor_497',
  ...changes.owner},changes.ownerSigner??'owner');
 const reviewer=signed({...base,role:'independent-reviewer',
  actorId:'reviewer_actor_497',...changes.reviewer},
  changes.reviewerSigner??'reviewer');
 const pins={providerPublicKeyPem:pem('provider'),ownerPublicKeyPem:pem('owner'),
  reviewerPublicKeyPem:pem('reviewer'),masterPublicKeyPem:pem('master'),
  ...changes.pins};
 return {enrollmentPackets:{providerPacket:provider,ownerPacket:owner,
  reviewerPacket:reviewer},approvedPins:pins,now};
}
test('QL497 independent Master enrollment is cryptographically reviewed, never connected or promoted',()=>{
 const out=reviewQl497IndependentMasterEnrollment(enrollment());
 assert.equal(out.state,'QL497_THREE_PARTY_MASTER_ENDPOINT_ENROLLMENT_REVIEW_HELD',JSON.stringify(out));
 assert.equal(out.signerKeysDistinct,true);
 assert.equal(out.actualPrivateTlsConnected,false);
 assert.equal(out.masterEndpointEnrolled,false);
 assert.equal(out.originalDevicePhysicallyCertified,false);
});
test('QL497 three-party Master enrollment rejects forged signer, changed cert, role reuse and stale scope',()=>{
 for(const ch of [
  {providerSigner:'impostor'},
  {reviewerSigner:'impostor'},
  {owner:{masterCertificateSha256:hex('f')}},
  {owner:{role:'provider'}},
  {owner:{actorId:'provider_actor_497'}},
  {provider:{masterEndpointUrl:'https://not-real.example/internal/comms/master-delivery-trial'}},
  {provider:{masterEndpointUrl:'http://master.private.rosevear.internal/internal/comms/master-delivery-trial'}},
  {provider:{customerDataIncluded:true}},
  {provider:{authorityTransfer:true}},
  {reviewer:{expiresAtMs:now-1}},
  {pins:{reviewerPublicKeyPem:pem('owner')}},
  {pins:{masterPublicKeyPem:pem('impostor')}}
 ])assert.equal(reviewQl497IndependentMasterEnrollment(enrollment(ch)).state,'HOLD',
  JSON.stringify(Object.keys(ch)));
});
const trial={schema:QL495_TRIAL_SCHEMA,trialId:'trial_ql497_0001',
 sourceId:'yw',receiptId:'receipt_ql497_0001',
 recordDigest:hex('1'),masterAuditDigest:hex('2'),
 masterJournalHead:hex('3'),provenanceDigest:hex('4'),
 sentAtMs:now-100,requestedAction:'ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY',
 customerDataIncluded:false,authorityTransfer:false};
const ackPayload={schema:QL495_ACK_SCHEMA,trialId:trial.trialId,
 sourceId:trial.sourceId,receiptId:trial.receiptId,
 recordDigest:trial.recordDigest,trialDigest:h(trial),
 masterAuditDigest:trial.masterAuditDigest,masterJournalHead:trial.masterJournalHead,
 decision:'HOLD_FOR_INDEPENDENT_REVIEW',
 masterActorId:'master_actor_ql497',issuedAtMs:now-60,expiresAtMs:now+60000,
 customerDataIncluded:false,authorityTransfer:false};
const ack=signed(ackPayload,'master'),masterPacketDigest=h(ack);
const clientBase={sequence:1,previousDigest:null,trialId:trial.trialId,
 sourceId:trial.sourceId,receiptId:trial.receiptId,
 sourceRecordDigest:trial.recordDigest,provenanceDigest:trial.provenanceDigest,
 masterAuditDigest:trial.masterAuditDigest,
 masterJournalHead:trial.masterJournalHead,
 masterSignedPacketDigest:masterPacketDigest,
 masterDecision:'HOLD_FOR_INDEPENDENT_REVIEW',recordedAtMs:now-40};
const masterBase={sequence:1,previousDigest:null,trialId:trial.trialId,
 sourceId:trial.sourceId,receiptId:trial.receiptId,
 sourceRecordDigest:trial.recordDigest,provenanceDigest:trial.provenanceDigest,
 masterAuditDigest:trial.masterAuditDigest,
 masterJournalHead:trial.masterJournalHead,
 requestDigest:h(trial),masterPacketDigest,
 clientCertificateSha256:hex('b'),recordedAtMs:now-70};
const clientRecord={...clientBase,recordDigest:h(clientBase)};
const masterRecord={...masterBase,recordDigest:h(masterBase)};
function reconciliation(opts={}){
 const base={schema:QL497_LEDGER_SCHEMA,reconciliationId:'reconcile_ql497_0001',
  trialId:trial.trialId,sourceId:trial.sourceId,receiptId:trial.receiptId,
  requestDigest:h(trial),sourceRecordDigest:trial.recordDigest,
  masterPacketDigest,masterAuditDigest:trial.masterAuditDigest,
  masterJournalHead:trial.masterJournalHead,
  clientRecordDigest:clientRecord.recordDigest,
  masterRecordDigest:masterRecord.recordDigest,
  role:'client',actorId:'client_actor_497',
  issuedAtMs:now-50,expiresAtMs:now+60000,
  customerDataIncluded:false,authorityTransfer:false};
 const cl=signed({...base,...opts.client},opts.clientSigner??'client');
 const ma=signed({...base,role:'master',actorId:'master_actor_497',
  ...opts.master},opts.masterSigner??'master');
 return {trial,masterPacket:ack,clientRecord,masterRecord,
  clientReadbackPacket:cl,masterReadbackPacket:ma,
  approvedPins:{clientPublicKeyPem:pem('client'),
   masterPublicKeyPem:pem('master'),...opts.pins},now};
}
test('QL497 bidirectional independently signed client + Master ledger records reconcile only to HOLD',()=>{
 const r=reconcileQl497BidirectionalReceipts(reconciliation());
 assert.equal(r.state,'QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD',JSON.stringify(r));
 assert.equal(r.ownerClientAndIndependentMasterSignaturesVerified,true);
 assert.equal(r.endToEndDeliveryCertified,false);
 assert.equal(r.independentNetworkPathAudited,false);
 assert.equal(r.productionMasterAccepted,false);
});
test('QL497 refuses wrong signed client/master readback, forged ACK, altered receipt, wrong audit',()=>{
 const f=reconciliation();
 for(const changes of [
  {clientSigner:'impostor'}, {masterSigner:'impostor'},
  {client:{masterRecordDigest:hex('f')}},
  {master:{sourceRecordDigest:hex('e')}},
  {client:{role:'master'}},
  {master:{actorId:'client_actor_497'}},
  {client:{customerDataIncluded:true}},
  {master:{expiresAtMs:now-10}},
  {pins:{masterPublicKeyPem:pem('impostor')}}
 ]){
  const p=reconciliation(changes);
  assert.equal(reconcileQl497BidirectionalReceipts(p).state,'HOLD',
   JSON.stringify(Object.keys(changes)));
 }
 assert.equal(reconcileQl497BidirectionalReceipts({...f,
  masterPacket:{...ack,signature:'A'.repeat(86)}}).state,'HOLD');
 assert.equal(reconcileQl497BidirectionalReceipts({...f,
  clientRecord:{...clientRecord,recordDigest:hex('f')}}).state,'HOLD');
 assert.equal(reconcileQl497BidirectionalReceipts({...f,
  masterRecord:{...masterRecord,masterAuditDigest:hex('f')}}).state,'HOLD');
 assert.equal(reconcileQl497BidirectionalReceipts({...f,
  trial:{...trial,masterJournalHead:hex('f')}}).state,'HOLD');
});
test('QL497 independent original client and Master journal readers detect missing/forged/partial records',t=>{
 const clientDir=mkdtempSync(join(tmpdir(),'ql497-client-'));
 const masterDir=mkdtempSync(join(tmpdir(),'ql497-master-'));
 t.after(()=>{rmSync(clientDir,{recursive:true,force:true});
  rmSync(masterDir,{recursive:true,force:true})});
 writeFileSync(join(clientDir,'ql495-master-trial-receipts.ndjson'),
  JSON.stringify(clientRecord)+'\n',{mode:0o600});
 writeFileSync(join(masterDir,'ql496-master-receiver-trial.ndjson'),
  JSON.stringify(masterRecord)+'\n',{mode:0o600});
 const a=readQl497ClientReceipt({directory:clientDir,trialId:trial.trialId,now});
 const b=readQl497MasterReceipt({directory:masterDir,trialId:trial.trialId,now});
 assert.equal(a.state,'QL497_SIGNED_CLIENT_TRIAL_JOURNAL_RECORD_READ_HELD');
 assert.equal(b.state,'QL497_SIGNED_MASTER_TRIAL_JOURNAL_RECORD_READ_HELD');
 assert.equal(a.record.recordDigest,clientRecord.recordDigest);
 assert.equal(b.record.recordDigest,masterRecord.recordDigest);
 assert.equal(a.independentOriginalClientVerified,false);
 writeFileSync(join(clientDir,'ql495-master-trial-receipts.ndjson'),
  JSON.stringify({...clientRecord,sourceRecordDigest:hex('a')})+'\n');
 assert.equal(readQl497ClientReceipt({directory:clientDir,trialId:trial.trialId}).state,'HOLD');
 writeFileSync(join(masterDir,'ql496-master-receiver-trial.ndjson'),
  JSON.stringify(masterRecord)); // deliberate incomplete line
 assert.equal(readQl497MasterReceipt({directory:masterDir,trialId:trial.trialId}).state,'HOLD');
 assert.equal(readQl497ClientReceipt({directory:masterDir,trialId:trial.trialId}).state,'HOLD');
});
function deviceFixture(opts={}){
 const ch={schema:QL496_CHALLENGE_SCHEMA,challengeId:'challenge_ql497_0001',
  sourceId:'yw',receiptId:trial.receiptId,trialId:trial.trialId,
  deviceEnrollmentDigest:hex('c'),
  issuedAtMs:now-500,expiresAtMs:now+60000,
  customerDataIncluded:false,authorityTransfer:false};
 const challengePacket=signed(ch,'master');
 const evidence={schema:QL496_DEVICE_SCHEMA,evidenceId:'evidence_ql497_0001',
  challengeId:ch.challengeId,sourceId:'yw',receiptId:trial.receiptId,
  trialId:trial.trialId,sourceRecordDigest:trial.recordDigest,
  masterPacketDigest,deviceEnrollmentDigest:hex('c'),
  witnessActorId:'attestor_actor_497',observedAtMs:now-300,
  issuedAtMs:now-200,expiresAtMs:now+60000,
  devicePhysicallyObserved:true,customerDataIncluded:false,authorityTransfer:false};
 const attestationPacket=signed(evidence,'attestor');
 const reviews={schema:QL496_REVIEW_SCHEMA,reviewId:'review_ql497_0001',
  evidenceId:evidence.evidenceId,challengeId:ch.challengeId,
  sourceId:'yw',trialId:trial.trialId,
  masterPacketDigest,deviceEvidenceDigest:h(attestationPacket),
  role:'owner',actorId:'owner_actor_497',
  issuedAtMs:now-100,expiresAtMs:now+60000,
  decision:'REVIEW_ONLY_NO_PRODUCTION_AUTHORITY',
  customerDataIncluded:false,authorityTransfer:false};
 const ownerPacket=signed(reviews,'owner');
 const reviewerPacket=signed({...reviews,role:'independent-reviewer',
  actorId:'reviewer_actor_497'},'reviewer');
 const hardware={schema:QL497_HARDWARE_SCHEMA,
  deviceEnrollmentDigest:hex('c'),challengeId:ch.challengeId,
  trialId:trial.trialId,independentObservationDigest:h(attestationPacket),
  masterPacketDigest,providerActorId:'hardware_provider_497',
  observedAtMs:now-250,issuedAtMs:now-50,expiresAtMs:now+50000,
  requestedAction:'INDEPENDENT_HARDWARE_AUDIT_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false,...opts.hardware};
 const hardwareAuditPacket=signed(hardware,opts.hardwareSigner??'hardware-auditor');
 const pins={attestorPublicKeyPem:pem('attestor'),
  ownerPublicKeyPem:pem('owner'),reviewerPublicKeyPem:pem('reviewer'),
  masterPublicKeyPem:pem('master'),hardwareAuditorPublicKeyPem:pem('hardware-auditor'),
  deviceEnrollmentDigest:hex('c'),...opts.pins};
 return {challengePacket,attestationPacket,ownerPacket,reviewerPacket,
  hardwareAuditPacket,pins,trial,masterPacket:ack,now};
}
test('QL497 independent external hardware audit signatures remain review-only, not certificate',()=>{
 const r=reviewQl497IndependentOriginalDevice(deviceFixture());
 assert.equal(r.state,'QL497_INDEPENDENT_DEVICE_HARDWARE_AUDIT_REVIEW_HELD',
  JSON.stringify(r));
 assert.equal(r.originalDevicePhysicallyCertified,false);
 assert.equal(r.independentProviderSignatureVerified,true);
 for(const opts of [
  {hardwareSigner:'impostor'},
  {hardware:{deviceEnrollmentDigest:hex('f')}},
  {hardware:{challengeId:'challenge_other_497'}},
  {hardware:{providerActorId:'owner_actor_497'}},
  {hardware:{issuedAtMs:now-200000}},
  {hardware:{authorityTransfer:true}},
  {pins:{hardwareAuditorPublicKeyPem:pem('owner')}}
 ])assert.equal(reviewQl497IndependentOriginalDevice(deviceFixture(opts)).state,'HOLD',
  JSON.stringify(Object.keys(opts)));
});
test('QL497 original Windows CLI default remains inert and no enrollment on CI',()=>{
 const cli=fileURLToPath(new URL('./ql497-original-host-cli.mjs',import.meta.url));
 const s=JSON.parse(execFileSync(process.execPath,[cli,'--status'],
  {encoding:'utf8'}));
 assert.equal(s.state,'QL497_INDEPENDENT_MASTER_ENROLLMENT_OFF_BY_DEFAULT');
 assert.equal(s.liveMasterEndpointEnrolled,false);
 assert.equal(s.originalDevicePhysicallyCertified,false);
 assert.equal(s.automaticNetworkSend,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--local-receipt'],{stdio:'pipe'}));
});
