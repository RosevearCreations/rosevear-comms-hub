import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,readdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {QL480_SOURCE_SCHEMA,QL480_OPERATOR_SCHEMA,QL480_READ_SCHEMA,
 createQl480PrivateCaseAdapter} from './ql480-scoped-incident-adapter.mjs';
import {QL481_BINDING} from './ql481-private-incident-handover.mjs';
import {createQl482ProtectedCaseReader,QL482_PATH} from './ql482-protected-case-read.mjs';
import {QL483_SOURCE_PROOF,QL483_FIELD_WITNESS,QL483_INGEST_PATH,
 createQl483PrivateYardWorkersLink,createQl483PrivateHttpsServer,
 reviewQl483IndependentYwFieldEvidence,QL483_BOUNDARY}
 from './ql483-original-yw-field.mjs';

const ids=['yw-source','icamp','operator','custodian','reviewer','attacker'];
const keys=Object.fromEntries(ids.map(id=>[id,generateKeyPairSync('ed25519')]));
const pin=id=>keys[id].publicKey.export({type:'spki',format:'der'}).toString('base64');
const signed=(payload,id)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 keys[id].privateKey).toString('base64')});
const t=Date.now()-1000,id=n=>'record_'+String(n).padStart(8,'0'),
 tenantId='rosevear-landscaping', episodeId='yw_episode_00000001';
const rev='d'.repeat(40),fp='a'.repeat(64),readerFp='b'.repeat(64),
 challenge='c'.repeat(64),receipt1='e'.repeat(64),receipt2='f'.repeat(64);
function authPayload(extra={}){
 return {schema:QL481_BINDING,bindingId:id(22),sourceApp:'yard-workers',
  environment:'PRIVATE_STAGING',tenantId,sourceRevision:rev,
  sourceSignerPin:pin('yw-source'),operatorSignerPin:pin('operator'),
  approvedAtMs:t,expiresAtMs:t+600000,
  sourceCustodianId:'yw-custodian',independentReviewerId:'independent-reviewer',
  dataClass:'NON_SENSITIVE_SCOPED_EXCEPTION',
  receiverEnabled:false,customerOperationsAuthorized:false,
  authorityTransfer:false,...extra};
}
function proofPayload(extra={}){
 return {schema:QL483_SOURCE_PROOF,proofId:id(23),bindingId:id(22),
  sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId,
  sourceRevision:rev,sourceSignerPin:pin('yw-source'),
  clientCertSha256:fp,challengeDigest:challenge,challengedAtMs:t+1,
  dataClass:'NON_SENSITIVE_SCOPED_EXCEPTION',
  customerDeliveryAuthorized:false,authorityTransfer:false,...extra};
}
function source(kind,seq,extra={}){
 return signed({schema:QL480_SOURCE_SCHEMA,eventId:id(300+seq),
  sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId,
  episodeId,kind,sequence:seq,sourceRevision:rev,
  sourceRecordId:id(400+seq),
  receiptDigest:seq===1?receipt1:receipt2,observedAtMs:t+seq,
  correlationId:id(600),causationId:id(601),
  classification:'NON_SENSITIVE_SCOPED_EXCEPTION',...extra},'yw-source');
}
function readerPacket(seq=1000,extra={}){
 return signed({schema:QL480_READ_SCHEMA,requestId:id(seq),
  operatorId:'ree-operator',sourceApp:'yard-workers',
  environment:'PRIVATE_STAGING',tenantId,episodeId,
  requestedAtMs:t+50,...extra},'operator');
}
function closePacket(){
 return signed({schema:QL480_OPERATOR_SCHEMA,commandId:id(800),
  action:'CLOSE_CASE',operatorId:'ree-operator',sourceApp:'yard-workers',
  environment:'PRIVATE_STAGING',tenantId,episodeId,intentKey:null,
  evidenceDigest:receipt2,occurredAtMs:t+4,
  disposition:'OWNER_REVIEW'},'operator');
}
function fixture(ctx,overrides={}){
 const root=mkdtempSync(join(tmpdir(),'ql483-private-'));
 ctx.after(()=>rmSync(root,{recursive:true,force:true}));
 const journalDir=join(root,'journal'),enrollmentDir=join(root,'enrollment');
 const now=()=>t+100;
 const adapter=createQl480PrivateCaseAdapter({directory:journalDir,now,
  environment:'PRIVATE_STAGING',sourcePins:{
   'yard-workers':pin('yw-source'),icamp:pin('icamp')},
  operatorPin:pin('operator')});
 const auth=authPayload(overrides.auth);
 const proof=proofPayload(overrides.proof);
 const args={directory:enrollmentDir,adapter,
  sourcePacket:signed(auth,'custodian'),
  reviewerPacket:signed(auth,'reviewer'),
  sourceCustodianPin:pin('custodian'),reviewerPin:pin('reviewer'),
  operatorPin:pin('operator'),sourcePin:pin('yw-source'),
  sourceProofPacket:signed(proof,'yw-source'),clientCertFingerprint:fp,
  expectedChallengeDigest:challenge,expectedRevision:rev,tenantId,now};
 const link=createQl483PrivateYardWorkersLink({...args,
  ...overrides.args});
 const reader=createQl482ProtectedCaseReader({adapter,
  operatorPin:pin('operator'),now,
  acl:{[readerFp]:{operatorId:'ree-operator',role:'case-reader',
   scopes:[{sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId}]}}});
 return {root,journalDir,enrollmentDir,link,adapter,reader,now,args};
}
const ingest=(link,envelope,certificate=fp,authorized=true)=>link.ingest({
 authorized,certificateFingerprint256:certificate,envelope});
test('QL483 enrollment uses four distinct signed pins, source challenge and write-once private readback',ctx=>{
 const f=fixture(ctx);
 assert.equal(f.link.review().state,'HOLD');
 const first=f.link.enroll();
 assert.equal(first.state,'DURABLE_SIGNED_YW_ENROLLMENT_COMMITTED_HELD');
 assert.match(first.enrollmentDigest,/^[a-f0-9]{64}$/);
 assert.equal(first.originalHostVerified,false);
 assert.equal(f.link.review().state,'SUPERVISED_PRIVATE_YW_ENROLLMENT_REVIEW_HELD');
 assert.equal(f.link.enroll().state,'DURABLE_SIGNED_YW_ENROLLMENT_REPLAY_HELD');
 const file=readdirSync(f.enrollmentDir).find(s=>s.endsWith('.json'));
 const old=JSON.parse(readFileSync(join(f.enrollmentDir,file),'utf8'));
 writeFileSync(join(f.enrollmentDir,file),JSON.stringify({...old,tenantId:'foreign-company'}));
 assert.equal(f.link.review().reason,'QL483_PRIVATE_ENROLLMENT_READBACK_TAMPERED');
 assert.equal(QL483_BOUNDARY.autoStart,false);
});
test('QL483 cert-bound source ingress, exact tenant and source revision block unsafe data',ctx=>{
 const f=fixture(ctx);
 assert.equal(ingest(f.link,source('HEARTBEAT_MISSED',1)).state,'HOLD');
 assert.equal(f.link.enroll().state,'DURABLE_SIGNED_YW_ENROLLMENT_COMMITTED_HELD');
 assert.equal(ingest(f.link,source('HEARTBEAT_MISSED',1),readerFp).reason,
  'QL483_YW_SOURCE_MTLS_CLIENT_DENIED');
 assert.equal(ingest(f.link,source('HEARTBEAT_MISSED',1),fp,false).state,'HOLD');
 assert.equal(ingest(f.link,source('HEARTBEAT_MISSED',1,{tenantId:'foreign-company'})).state,'HOLD');
 assert.equal(ingest(f.link,source('HEARTBEAT_MISSED',1,{sourceRevision:'0'.repeat(40)})).state,'HOLD');
 const faked=source('HEARTBEAT_MISSED',1);
 faked.signature=signed(faked.payload,'attacker').signature;
 assert.equal(ingest(f.link,faked).state,'HOLD');
 const opened=ingest(f.link,source('HEARTBEAT_MISSED',1));
 assert.equal(opened.state,'SIGNED_YW_PRIVATE_EVENT_READBACK_HELD');
 assert.equal(opened.caseStatus,'OPEN');
 assert.equal(opened.productionAcceptance,false);
 assert.equal(opened.originalHostVerified,false);
 assert.equal(ingest(f.link,source('HEARTBEAT_MISSED',1)).lastSequence,1);
 assert.equal(ingest(f.link,source('HEARTBEAT_RECOVERED',2)).caseStatus,
  'RECOVERY_PENDING_OPERATOR_REVIEW');
});
test('QL483 rejects expired challenge, scope drift, forged reviewer and trust-on-first-use',ctx=>{
 const f=fixture(ctx);
 const reject=[
  {sourceProofPacket:signed(proofPayload({clientCertSha256:'0'.repeat(64)}),'yw-source')},
  {sourceProofPacket:signed(proofPayload({challengeDigest:'0'.repeat(64)}),'yw-source')},
  {sourceProofPacket:signed(proofPayload(),'attacker')},
  {sourcePacket:signed(authPayload({tenantId:'foreign-company'}),'custodian')},
  {reviewerPacket:signed(authPayload(),'attacker')},
  {sourceProofPacket:signed(proofPayload({challengedAtMs:t-130000}),'yw-source')},
 ];
 for(const bad of reject){
  const link=createQl483PrivateYardWorkersLink({...f.args,...bad,
   directory:join(f.root,'bad_'+Math.random().toString(36).slice(2))});
  assert.equal(link.enroll().state,'HOLD');
 }
 assert.throws(()=>createQl483PrivateYardWorkersLink({...f.args,
  sourcePin:pin('reviewer')}),/INDEPENDENT_PRIVATE_TRUST/);
 assert.throws(()=>createQl483PrivateYardWorkersLink({...f.args,
  clientCertFingerprint:'*'}),/INDEPENDENT_PRIVATE_TRUST/);
});
test('QL483 original Yard Workers outage -> recovery -> signed operator closure -> independent review (staging only)',ctx=>{
 const f=fixture(ctx);
 assert.equal(f.link.enroll().state,'DURABLE_SIGNED_YW_ENROLLMENT_COMMITTED_HELD');
 assert.equal(ingest(f.link,source('HEARTBEAT_MISSED',1)).caseStatus,'OPEN');
 assert.equal(ingest(f.link,source('HEARTBEAT_RECOVERED',2)).caseStatus,
  'RECOVERY_PENDING_OPERATOR_REVIEW');
 assert.equal(f.adapter.command(closePacket()).caseStatus,'CLOSED');
 const packet=readerPacket(),read=f.reader.read({
  authorized:true,certificateFingerprint256:readerFp,
  operatorReadPacket:packet});
 assert.equal(read.status,200);
 assert.equal(read.body.caseStatus,'CLOSED');
 const witness={schema:QL483_FIELD_WITNESS,reviewId:id(999),
  sourceApp:'yard-workers',environment:'PRIVATE_STAGING',tenantId,
  episodeId,caseId:read.body.caseId,operatorId:'ree-operator',
  enrollmentDigest:f.link.review().enrollmentDigest,
  sourceRevision:rev,lastSequence:2,
  lastReceiptDigest:read.body.lastReceiptDigest,
  lastJournalDigest:read.body.lastJournalDigest,
  reviewedAtMs:f.now(),originalHostWitnessed:false,
  actualBusinessSourceAccepted:false,customerDeliveryVerified:false,
  authorityTransfer:false};
 const verify=(packet=signed(witness,'reviewer'))=>reviewQl483IndependentYwFieldEvidence({
  link:f.link,adapter:f.adapter,operatorReadPacket:readerPacket(1001),
  witnessPacket:packet,reviewerPin:pin('reviewer'),sourcePin:pin('yw-source'),
  operatorPin:pin('operator'),nowMs:f.now()});
 const good=verify();
 assert.equal(good.state,'INDEPENDENT_SIGNED_PRIVATE_YW_FIELD_CRYPTO_REVIEW_HELD');
 assert.equal(good.productionAcceptance,false);
 assert.match(good.fieldAcceptance,/HOLD_ORIGINAL/);
 for(const modified of [
  {tenantId:'other-landscaping'}, {lastJournalDigest:'0'.repeat(64)},
  {originalHostWitnessed:true}, {actualBusinessSourceAccepted:true},
  {lastSequence:3}
 ]){
  assert.equal(verify(signed({...witness,...modified},'reviewer')).state,'HOLD');
 }
 assert.equal(verify(signed(witness,'attacker')).state,'HOLD');
 // Deliberate journal damage must stop independent review rather than pass.
 const journal=readdirSync(f.journalDir).find(x=>x.endsWith('.ndjson'));
 const file=join(f.journalDir,journal);
 writeFileSync(file,readFileSync(file,'utf8').replace(/"previousDigest"/,'"badDigest"'));
 assert.equal(verify().state,'HOLD');
});
test('QL483 no automatic HTTPS listener; TLS and reader required',ctx=>{
 const f=fixture(ctx);
 assert.throws(()=>createQl483PrivateHttpsServer({reader:f.reader,link:f.link}),
  /PRIVATE_TLS_LINK_AND_READER_REQUIRED/);
 assert.equal(QL483_INGEST_PATH,'/internal/comms/ql483/yard-workers/events');
 assert.equal(QL482_PATH,'/internal/comms/ql482/cases/read');
 assert.equal(f.link.publicRoute,false);
 assert.equal(f.link.automaticDispatch,false);
});
