import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {createQl491ReviewJournal} from './ql491-exception-intake.mjs';
import {QL492_PROOF_SCHEMA,QL492_DUE_SCHEMA,
 createQl492PrivateWitnessLedger,createQl492FieldReview}
 from './ql492-field-witness-audit.mjs';
const at=1732430000000,DAY=86400000;
const hash=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const keys=Object.fromEntries(QL485_SOURCE_IDS.flatMap(id=>
 [id+'_owner',id+'_reviewer']).concat('impostor').map(id=>[
 id,generateKeyPairSync('ed25519')]));
const publicPem=id=>keys[id].publicKey.export({type:'spki',format:'pem'});
const signPacket=(payload,id)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[id].privateKey).toString('base64url')});
const pins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 operatorPublicKeyPem:publicPem(id+'_owner'),
 reviewerPublicKeyPem:publicPem(id+'_reviewer')
}]));
function fixture(t,{withFollowup=true}={}){
 const directory=mkdtempSync(join(tmpdir(),'ql492-private-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 let now=at,deadline=at+DAY;
 const journal=createQl491ReviewJournal({directory,now:()=>at});
 let follow=null;
 if(withFollowup){
  const i=journal.appendIntake({readbackDigest:hash('readback'),
   inventoryDigest:hash([]),snapshotDigest:hash('snapshot'),
   caseCount:0,openCount:0,overdueCount:0,closedCount:0,
   unmatchedClosures:0,sourceHoldCount:6});
  assert.equal(i.state,'DURABLE_SIGNED_INTAKE_RECONCILED_HELD');
  const f=journal.appendFollowup({requestId:'proof_request_00492',
   sourceId:'yw',readbackDigest:hash('readback'),captureDigest:null,
   ownerPacketDigest:hash('ql491-owner'),
   reviewerPacketDigest:hash('ql491-reviewer'),reviewDeadlineAtMs:deadline});
  assert.equal(f.state,'DURABLE_FIELD_PROOF_FOLLOWUP_REQUEST_HELD');
  follow={requestId:'proof_request_00492',sourceId:'yw',
   recordDigest:f.recordDigest,readbackDigest:hash('readback'),
   captureDigest:null,reviewDeadlineAtMs:deadline};
 }
 const ledger=createQl492PrivateWitnessLedger({directory,now:()=>now});
 const review=createQl492FieldReview({directory,ql491Journal:journal,ql492Ledger:ledger,
  exceptionPins:pins,now:()=>now});
 return {directory,journal,ledger,review,follow,deadline,
  changeTime:x=>{now=x},time:()=>now};
}
function signPair(f,kind,overrides={}){
 const now=f.time(),r=f.follow;
 const base=kind==='proof'?{
  schema:QL492_PROOF_SCHEMA,receiptId:'receipt_ql492_00001',
  requestId:r.requestId,sourceId:r.sourceId,followupRecordDigest:r.recordDigest,
  readbackDigest:r.readbackDigest,captureDigest:r.captureDigest,
  observedEvidenceDigest:hash('real-observed-independent-metadata'),
  observedAtMs:at+10,disposition:'SUBMITTED_FOR_INDEPENDENT_REVIEW_ONLY',
  role:'owner',actorId:'real_owner_00492',issuedAtMs:now-20,
  expiresAtMs:now+60000,physicalCertificationClaimed:false,
  customerDataIncluded:false,authorityTransfer:false
 }:{
  schema:QL492_DUE_SCHEMA,escalationId:'escalation_ql492_00001',
  requestId:r.requestId,sourceId:r.sourceId,followupRecordDigest:r.recordDigest,
  reviewDeadlineAtMs:r.reviewDeadlineAtMs,proofReceiptDigest:null,
  requestedAction:'ESCALATE_DUE_FOR_MANUAL_REVIEW_NO_SEND',
  role:'owner',actorId:'real_owner_00492',issuedAtMs:now-20,
  expiresAtMs:now+60000,customerDataIncluded:false,authorityTransfer:false
 };
 const owner={...base,...(overrides.owner??{})};
 const reviewer={...base,role:'independent-reviewer',
  actorId:'real_reviewer_00492',...(overrides.reviewer??{})};
 return {ownerPacket:signPacket(owner,overrides.ownerSigner??'yw_owner'),
  reviewerPacket:signPacket(reviewer,overrides.reviewerSigner??'yw_reviewer')};
}
test('QL492 absent credentials and no followups remain six-source offline audit HOLD not certified',t=>{
 const f=fixture(t,{withFollowup:false});
 const a=f.review.auditReadback();
 assert.equal(a.state,'PRIVATE_SOURCE_TO_MASTER_AUDIT_READBACK_HELD',JSON.stringify(a));
 assert.equal(a.sourceCount,6);
 assert.equal(a.masterDelivery,false);
 assert.equal(a.originalSourcesVerified,0);
 assert.equal(a.realFieldProofsCertified,0);
 for(const id of QL485_SOURCE_IDS){
  assert.equal(a.sources[id].followupRequests,0);
  assert.equal(a.sources[id].genuinelyVerifiedSource,false);
 }
 assert.equal(f.ledger.summary().records,0);
});
test('QL492 one prior QL491 request is independently rehased in metadata-only master audit',t=>{
 const f=fixture(t),a=f.review.auditReadback();
 assert.equal(a.state,'PRIVATE_SOURCE_TO_MASTER_AUDIT_READBACK_HELD');
 assert.equal(a.sources.yw.followupRequests,1);
 assert.equal(a.sources.yw.dueForReview,0);
 assert.equal(a.audience,'rosevear-master');
 assert.equal(a.transport,'OFFLINE_READ_ONLY_NO_SEND');
 assert.equal(a.masterAcknowledged,false);
 assert.equal(f.ledger.summary().records,0);
});
test('QL492 two independent signed proof claims are retained but never physically certified',t=>{
 const f=fixture(t);f.changeTime(at+100);
 const p=signPair(f,'proof');
 const a=f.review.acceptProof(p);
 assert.equal(a.state,'SIGNED_FIELD_WITNESS_CLAIM_INTAKE_HELD',JSON.stringify(a));
 assert.equal(a.actualWitnessProven,false);
 assert.equal(a.fieldCertified,false);
 assert.equal(f.ledger.summary().witnessClaims,1);
 assert.equal(f.review.auditReadback().sources.yw.signedClaimsSubmitted,1);
 assert.equal(f.review.acceptProof(p).state,'HOLD');
 assert.equal(f.ledger.summary().records,1);
});
test('QL492 rejects forged signatures, signer reuse, source mismatch, stale, and physical certification claims',t=>{
 const f=fixture(t);f.changeTime(at+100);
 for(const bad of [
  {reviewerSigner:'impostor'},
  {owner:{issuedAtMs:at-300000}},
  {reviewer:{sourceId:'icamp'}},
  {reviewer:{requestId:'wrong_request_00492'}},
  {reviewer:{observedEvidenceDigest:hash('a-mismatched-observation')}},
  {owner:{physicalCertificationClaimed:true}},
  {owner:{customerDataIncluded:true}},
  {reviewer:{actorId:'real_owner_00492'}},
  {owner:{followupRecordDigest:hash('forged-followup')}},
  {owner:{observedAtMs:at-100}}
 ])assert.equal(f.review.acceptProof(signPair(f,'proof',bad)).state,'HOLD',
  JSON.stringify(bad));
 assert.equal(f.ledger.summary().records,0);
});
test('QL492 escalates only genuinely due signed requests, no scheduled sends',t=>{
 const f=fixture(t);
 assert.equal(f.review.escalateDue(signPair(f,'due')).state,'HOLD');
 f.changeTime(f.deadline+2000);
 const r=f.review.auditReadback();
 assert.equal(r.sources.yw.dueForReview,1);
 const due=signPair(f,'due'),accepted=f.review.escalateDue(due);
 assert.equal(accepted.state,'SIGNED_PROOF_DUE_REVIEW_ESCALATION_HELD',JSON.stringify(accepted));
 assert.equal(accepted.externalMessageSent,false);
 assert.equal(accepted.automaticEscalation,false);
 assert.equal(f.ledger.summary().manualDueEscalations,1);
 assert.equal(f.review.auditReadback().sources.yw.dueForReview,0);
 assert.equal(f.review.escalateDue(due).state,'HOLD');
});
test('QL492 due escalation must bind current proof receipt digest, not stale null',t=>{
 const f=fixture(t);f.changeTime(at+100);
 const r=f.review.acceptProof(signPair(f,'proof'));
 assert.equal(r.state,'SIGNED_FIELD_WITNESS_CLAIM_INTAKE_HELD');
 f.changeTime(f.deadline+2000);
 assert.equal(f.review.escalateDue(signPair(f,'due')).state,'HOLD');
 const due=signPair(f,'due',{
  owner:{proofReceiptDigest:r.receiptDigest},
  reviewer:{proofReceiptDigest:r.receiptDigest}
 });
 assert.equal(f.review.escalateDue(due).state,'SIGNED_PROOF_DUE_REVIEW_ESCALATION_HELD');
 assert.equal(f.review.auditReadback().sources.yw.manualDueEscalations,1);
 assert.equal(f.review.auditReadback().realFieldProofsCertified,0);
});
test('QL492 due escalation rejects wrong source, stale approval and modified deadline',t=>{
 const f=fixture(t);f.changeTime(f.deadline+1000);
 for(const bad of [
  {reviewerSigner:'impostor'},
  {owner:{issuedAtMs:at}},
  {reviewer:{sourceId:'icamp'}},
  {owner:{reviewDeadlineAtMs:f.deadline+DAY}},
  {reviewer:{requestedAction:'SEND_EMAIL_NOW'}},
  {owner:{authorityTransfer:true}}
 ])assert.equal(f.review.escalateDue(signPair(f,'due',bad)).state,'HOLD',
  JSON.stringify(bad));
 assert.equal(f.ledger.summary().records,0);
});
test('QL492 both QL491 and QL492 tampered journals fail closed on independent audit',t=>{
 const f=fixture(t),path=join(f.directory,'ql491-intake-field-followups.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace(
  'FIELD_PROOF_FOLLOWUP','COUNTERFEIT_FIELD_PROOF'));
 assert.equal(f.review.auditReadback().state,'HOLD');
 assert.equal(f.review.acceptProof(signPair(f,'proof')).state,'HOLD');
});
test('QL492 tampered new journal fails closed and refuses all subsequent writes',t=>{
 const f=fixture(t);f.changeTime(at+100);
 assert.equal(f.review.acceptProof(signPair(f,'proof')).state,
  'SIGNED_FIELD_WITNESS_CLAIM_INTAKE_HELD');
 const path=join(f.directory,'ql492-witness-due-audit.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace('WITNESS_INTAKE','CERTIFIED_LIVE'));
 assert.equal(f.ledger.summary().state,'HOLD');
 assert.equal(f.review.auditReadback().state,'HOLD');
 assert.equal(f.review.acceptProof(signPair(f,'proof')).state,'HOLD');
});
test('QL492 immutable master audit digest stays stable as due dates age',t=>{
 const f=fixture(t),a=f.review.auditReadback();
 f.changeTime(f.deadline+1000);
 const b=f.review.auditReadback();
 assert.equal(a.auditEvidenceDigest,b.auditEvidenceDigest);
 assert.equal(a.sources.yw.dueForReview,0);
 assert.equal(b.sources.yw.dueForReview,1);
 assert.equal(a.masterDelivery,false);
});
test('QL492 original-host CLI status remains disabled and cannot intake from CI',()=>{
 const cli=fileURLToPath(new URL('./ql492-original-host-cli.mjs',import.meta.url));
 const s=JSON.parse(execFileSync(process.execPath,[cli,'--status'],{encoding:'utf8'}));
 assert.equal(s.state,'QL492_NO_SEND_OFF_BY_DEFAULT');
 assert.equal(s.automaticEscalation,false);
 assert.equal(s.realFieldProofsCertified,0);
 assert.equal(s.customerWrites,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--intake','x','y'],{stdio:'pipe'}));
});
