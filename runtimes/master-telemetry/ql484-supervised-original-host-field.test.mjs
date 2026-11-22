import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {mkdtempSync,rmSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {QL480_SOURCE_SCHEMA,QL480_OPERATOR_SCHEMA,QL480_READ_SCHEMA,
 createQl480PrivateCaseAdapter} from './ql480-scoped-incident-adapter.mjs';
import {QL481_BINDING} from './ql481-private-incident-handover.mjs';
import {createQl482ProtectedCaseReader} from './ql482-protected-case-read.mjs';
import {QL483_SOURCE_PROOF,createQl483PrivateYardWorkersLink}
 from './ql483-original-yw-field.mjs';
import {QL484_SOURCE,QL484_HOST,QL484_REVIEW,QL484_BOUNDARY,
 createQl484SupervisedYwFieldReview,classifyQl484SourceUpdate}
 from './ql484-supervised-original-host-field.mjs';

const ids=['source','custodian','reviewer','operator','host','icamp','attacker'];
const keys=Object.fromEntries(ids.map(k=>[k,generateKeyPairSync('ed25519')]));
const pin=id=>keys[id].publicKey.export({format:'der',type:'spki'}).toString('base64');
const signFor=(payload,id)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 keys[id].privateKey).toString('base64')});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const t=Date.now()-2000,rev='a'.repeat(40),comms='b'.repeat(40),
 srcCert='c'.repeat(64),opCert='d'.repeat(64),challenge='e'.repeat(64),
 ownerChallenge='f'.repeat(64),receipt1='1'.repeat(64),receipt2='2'.repeat(64),
 tenantId='rosevear-landscaping',episodeId='episode_yw_00000001',
 hostId='ree-desktop-ae894kc';
const id=n=>'record_'+String(n).padStart(8,'0');
const binding={
 schema:QL481_BINDING,bindingId:id(100),sourceApp:'yard-workers',
 environment:'PRIVATE_STAGING',tenantId,sourceRevision:rev,
 sourceSignerPin:pin('source'),operatorSignerPin:pin('operator'),
 approvedAtMs:t,expiresAtMs:t+600000,
 sourceCustodianId:'yw-custodian',independentReviewerId:'third-party-reviewer',
 dataClass:'NON_SENSITIVE_SCOPED_EXCEPTION',
 receiverEnabled:false,customerOperationsAuthorized:false,
 authorityTransfer:false};
const proof={
 schema:QL483_SOURCE_PROOF,proofId:id(101),bindingId:id(100),
 sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId,
 sourceRevision:rev,sourceSignerPin:pin('source'),
 clientCertSha256:srcCert,challengeDigest:challenge,challengedAtMs:t+1,
 dataClass:'NON_SENSITIVE_SCOPED_EXCEPTION',
 customerDeliveryAuthorized:false,authorityTransfer:false};
const sourceEvent=(kind,seq)=>signFor({
 schema:QL480_SOURCE_SCHEMA,eventId:id(200+seq),
 sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId,episodeId,
 kind,sequence:seq,sourceRevision:rev,sourceRecordId:id(300+seq),
 receiptDigest:seq===1?receipt1:receipt2,observedAtMs:t+seq,
 correlationId:id(700),causationId:id(701),
 classification:'NON_SENSITIVE_SCOPED_EXCEPTION'},'source');
const read=(seq=1000)=>signFor({
 schema:QL480_READ_SCHEMA,requestId:id(seq),operatorId:'ree-operator',
 sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId,episodeId,
 requestedAtMs:t+50},'operator');
const closure=()=>signFor({
 schema:QL480_OPERATOR_SCHEMA,commandId:id(800),
 action:'CLOSE_CASE',operatorId:'ree-operator',sourceApp:'yard-workers',
 environment:'PRIVATE_STAGING',tenantId,episodeId,intentKey:null,
 evidenceDigest:receipt2,occurredAtMs:t+4,
 disposition:'OWNER_REVIEW'},'operator');
function fixture(ctx){
 const root=mkdtempSync(join(tmpdir(),'ql484-review-'));
 ctx.after(()=>rmSync(root,{recursive:true,force:true}));
 const journal=join(root,'journal'),enrollment=join(root,'enrollment'),
  sessions=join(root,'sessions'),now=()=>t+100;
 const adapter=createQl480PrivateCaseAdapter({directory:journal,
  environment:'PRIVATE_STAGING',now,
  sourcePins:{'yard-workers':pin('source'),icamp:pin('icamp')},
  operatorPin:pin('operator')});
 const link=createQl483PrivateYardWorkersLink({
  directory:enrollment,adapter,
  sourcePacket:signFor(binding,'custodian'),
  reviewerPacket:signFor(binding,'reviewer'),
  sourceCustodianPin:pin('custodian'),reviewerPin:pin('reviewer'),
  operatorPin:pin('operator'),sourcePin:pin('source'),
  sourceProofPacket:signFor(proof,'source'),clientCertFingerprint:srcCert,
  expectedChallengeDigest:challenge,expectedRevision:rev,tenantId,now});
 const reader=createQl482ProtectedCaseReader({adapter,
  operatorPin:pin('operator'),now,
  acl:{[opCert]:{operatorId:'ree-operator',role:'case-reader',scopes:[
   {sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId}]}}});
 const review=createQl484SupervisedYwFieldReview({directory:sessions,
  link,adapter,reader,sourcePin:pin('source'),ownerHostPin:pin('host'),
  reviewerPin:pin('reviewer'),operatorPin:pin('operator'),
  originalHostId:hostId,expectedSourceRevision:rev,
  expectedCommsMainRevision:comms,sourceClientFingerprint:srcCert,
  operatorClientFingerprint:opCert,expectedOwnerChallengeDigest:ownerChallenge,
  now});
 const open=()=>link.ingest({authorized:true,
  certificateFingerprint256:srcCert,envelope:sourceEvent('HEARTBEAT_MISSED',1)});
 const recover=()=>link.ingest({authorized:true,
  certificateFingerprint256:srcCert,envelope:sourceEvent('HEARTBEAT_RECOVERED',2)});
 const setup=()=>{
  assert.equal(link.enroll().state,'DURABLE_SIGNED_YW_ENROLLMENT_COMMITTED_HELD');
  assert.equal(open().caseStatus,'OPEN');
  assert.equal(recover().caseStatus,'RECOVERY_PENDING_OPERATOR_REVIEW');
  assert.equal(adapter.command(closure()).caseStatus,'CLOSED');
 };
 const bundle=(overrides={})=>{
  const fresh=read(overrides.requestSeq??1000);
  const preview=reader.read({authorized:true,certificateFingerprint256:opCert,
   operatorReadPacket:read((overrides.requestSeq??1000)+100)});
  assert.equal(preview.status,200,JSON.stringify(preview));
  const body=preview.body,sid=id(overrides.sessionNum??900);
  const p={schema:QL484_SOURCE,sessionId:sid,sourceApp:'yard-workers',
   environment:'PRIVATE_STAGING',tenantId,episodeId,caseId:body.caseId,
   sourceRevision:rev,commsMainRevision:comms,sourceCertSha256:srcCert,
   operatorCertSha256:opCert,enrollmentDigest:link.review().enrollmentDigest,
   lastSequence:body.lastSequence,lastReceiptDigest:body.lastReceiptDigest,
   lastJournalDigest:body.lastJournalDigest,
   operatorRequestDigest:hash(fresh),challengedAtMs:t+60,
   sourceRuntimeClaimed:true,customerFieldsIncluded:false,
   dispatchAuthorized:false,...(overrides.source??{})};
  const sourceObservationPacket=signFor(p,overrides.sourceSigner??'source');
  const responseDigest=hash(body);
  const h={schema:QL484_HOST,sessionId:sid,originalHostId:hostId,
   sourceEvidenceDigest:hash(sourceObservationPacket),
   operatorReadResponseDigest:responseDigest,
   ownerChallengeDigest:ownerChallenge,hostSignerPin:pin('host'),
   observedAtMs:t+70,physicalPresenceClaimed:true,
   customerFieldsIncluded:false,dispatchAuthorized:false,
   ...(overrides.host??{})};
  const hostObservationPacket=signFor(h,overrides.hostSigner??'host');
  const w={schema:QL484_REVIEW,sessionId:sid,
   reviewerId:'third-party-reviewer',
   sourceEvidenceDigest:hash(sourceObservationPacket),
   hostEvidenceDigest:hash(hostObservationPacket),
   operatorReadResponseDigest:responseDigest,
   sourceRevision:rev,commsMainRevision:comms,
   reviewedAtMs:t+80,reviewKind:'CRYPTOGRAPHIC_PRIVATE_REVIEW',
   independentPhysicalAttestation:false,customerDeliveryVerified:false,
   authorityTransfer:false,...(overrides.reviewer??{})};
  const reviewerPacket=signFor(w,overrides.reviewerSigner??'reviewer');
  return {sourceObservationPacket,hostObservationPacket,
   reviewerPacket,operatorReadPacket:fresh,operatorTlsAuthorized:true,
   operatorClientCertificateFingerprint:opCert};
 };
 return {root,journal,sessions,adapter,link,reader,review,setup,bundle,now};
}
test('QL484 signed YW, host, operator TLS and independent reviewer correlation is durable but NOT field-certified',ctx=>{
 const f=fixture(ctx);f.setup();
 const b=f.bundle(),result=f.review.commit(b);
 assert.equal(result.state,'DURABLE_SIGNED_YW_SESSION_CORRELATION_HELD',JSON.stringify(result));
 assert.equal(result.durableReadback,true);
 assert.equal(result.productionAcceptance,false);
 assert.equal(result.originalHostVerified,false);
 assert.match(result.fieldAcceptance,/HOLD_ORIGINAL/);
 assert.equal(f.review.commit(b).reason,'QL484_SESSION_ALREADY_RECORDED_USE_READBACK');
 const rc=f.review.readReceipt(b.sourceObservationPacket.payload.sessionId,
  {tenantId,episodeId});
 assert.equal(rc.state,'DURABLE_PRIVATE_YW_CRYPTO_RECEIPT_READBACK_HELD');
 assert.equal(rc.productionAcceptance,false);
 assert.equal(f.review.readReceipt(b.sourceObservationPacket.payload.sessionId,
  {tenantId:'foreign-company',episodeId}).state,'HOLD');
 assert.equal(f.review.publicRoute,false);
 assert.equal(f.review.automaticActivation,false);
 assert.equal(QL484_BOUNDARY.originalHostPhysicalVerification,'NOT_PERFORMED_BY_CI');
});
test('QL484 rejects missing original source enrollment, wrong cert, mismatched release, forged signer and trust drift',ctx=>{
 const f=fixture(ctx);
 assert.equal(f.review.commit({sourceObservationPacket:{payload:{sessionId:id(900)}}}).state,'HOLD');
 f.setup();
 for(const [i,mod] of [
  {operatorClientCertificateFingerprint:srcCert},
  {operatorTlsAuthorized:false},
  {sourceObservationPacket:{payload:{sessionId:id(900)}}}
 ].entries()){
  const b=f.bundle({sessionNum:901,requestSeq:1001+i});
  assert.equal(f.review.commit({...b,...mod}).state,'HOLD');
 }
 for(const [i,variation] of [
  {source:{tenantId:'foreign-company'}},
  {source:{sourceRevision:'0'.repeat(40)}},
  {source:{commsMainRevision:'0'.repeat(40)}},
  {source:{lastJournalDigest:'0'.repeat(64)}},
  {source:{operatorCertSha256:srcCert}},
  {sourceSigner:'attacker'},
  {host:{ownerChallengeDigest:'0'.repeat(64)}},
  {host:{physicalPresenceClaimed:false}},
  {hostSigner:'attacker'},
  {reviewer:{sourceRevision:'0'.repeat(40)}},
  {reviewer:{independentPhysicalAttestation:true}},
  {reviewerSigner:'attacker'}
 ].entries()){
  const b=f.bundle({sessionNum:902,requestSeq:1100+i,...variation});
  assert.equal(f.review.commit(b).state,'HOLD',JSON.stringify(variation));
 }
});
test('QL484 rejects source journal tampering and spoofed private reviewer readback',ctx=>{
 const f=fixture(ctx);f.setup();
 const b=f.bundle({requestSeq:1700});
 const file=readdirSync(f.journal).find(p=>p.endsWith('.ndjson'));
 assert.ok(file);
 const path=join(f.journal,file);
 writeFileSync(path,readFileSync(path,'utf8').replace(/"previousDigest"/,'"tamperedDigest"'));
 assert.equal(f.review.commit(b).state,'HOLD');
});
test('QL484 separate source release update and Git ancestry accurately; no remote app is a Git merge',()=>{
 const status=classifyQl484SourceUpdate({commitsAhead:540,commitsBehind:520,
  declaredYwMainSha:'f'.repeat(40),pinnedYwSourceSha:'e'.repeat(40)});
 assert.equal(status.gitAncestry,'DIVERGED');
 assert.equal(status.yardWorkersSource,'SOURCE_REVISION_CHANGED_REENROLLMENT_REQUIRED');
 assert.equal(status.sourceUpdatesAreGitDivergence,false);
 assert.equal(status.automaticMerge,false);
 assert.equal(classifyQl484SourceUpdate({commitsAhead:0,commitsBehind:0,
  declaredYwMainSha:rev,pinnedYwSourceSha:rev}).gitAncestry,'IN_SYNC');
 assert.equal(classifyQl484SourceUpdate({commitsAhead:-1,commitsBehind:0,
  declaredYwMainSha:rev,pinnedYwSourceSha:rev}).state,'HOLD');
});
