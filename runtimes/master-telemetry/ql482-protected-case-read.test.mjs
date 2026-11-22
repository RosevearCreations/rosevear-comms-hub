import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {QL480_SOURCE_SCHEMA,QL480_OPERATOR_SCHEMA,QL480_READ_SCHEMA,
 createQl480PrivateCaseAdapter} from './ql480-scoped-incident-adapter.mjs';
import {QL482_WITNESS_SCHEMA,QL482_PATH,QL482_BOUNDARY,
 createQl482ProtectedCaseReader,createQl482HttpsServer,
 verifyQl482YardWorkersLifecycle} from './ql482-protected-case-read.mjs';

const keys=Object.fromEntries(['yard-workers','icamp','operator','reviewer','outsider']
 .map(id=>[id,generateKeyPairSync('ed25519')]));
const pin=id=>keys[id].publicKey.export({format:'der',type:'spki'}).toString('base64');
const signed=(payload,id)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),
 keys[id].privateKey).toString('base64')});
const fingerprint='a'.repeat(64), otherFingerprint='b'.repeat(64), sha='c'.repeat(40);
const receipt1='d'.repeat(64),receipt2='e'.repeat(64),t0=Date.now()-1000;
const episode='episode_00000001',tenant='rosevear-landscaping';
const id=n=>'record_'+String(n).padStart(8,'0');
function source(kind,sequence,extra={}){
 return signed({schema:QL480_SOURCE_SCHEMA,eventId:id(sequence),sourceApp:'yard-workers',
  environment:'SIMULATION',tenantId:tenant,episodeId:episode,kind,sequence,
  sourceRevision:sha,sourceRecordId:id(100+sequence),
  receiptDigest:sequence===1?receipt1:receipt2,observedAtMs:t0+sequence,
  correlationId:id(300),causationId:id(400),
  classification:'NON_SENSITIVE_SCOPED_EXCEPTION',...extra},'yard-workers');
}
const readPayload=(requestId=id(1000),overrides={})=>({
 schema:QL480_READ_SCHEMA,requestId,operatorId:'ree-operator',
 sourceApp:'yard-workers',environment:'SIMULATION',tenantId:tenant,
 episodeId:episode,requestedAtMs:t0+20,...overrides});
function command(){
 return signed({schema:QL480_OPERATOR_SCHEMA,commandId:id(900),action:'CLOSE_CASE',
  operatorId:'ree-operator',sourceApp:'yard-workers',environment:'SIMULATION',
  tenantId:tenant,episodeId:episode,intentKey:null,evidenceDigest:receipt2,
  occurredAtMs:t0+9,disposition:'OWNER_REVIEW'},'operator');
}
function fixture(t){
 const directory=mkdtempSync(join(tmpdir(),'ql482-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const clock=()=>t0+100;
 const adapter=createQl480PrivateCaseAdapter({directory,
  sourcePins:{'yard-workers':pin('yard-workers'),icamp:pin('icamp')},
  operatorPin:pin('operator'),now:clock});
 const reader=createQl482ProtectedCaseReader({adapter,operatorPin:pin('operator'),
  now:clock,acl:{[fingerprint]:{operatorId:'ree-operator',role:'case-reader',
   scopes:[{sourceApp:'yard-workers',environment:'SIMULATION',tenantId:tenant}]}}});
 const request=(name=id(1000),extra={})=>signed(readPayload(name,extra),'operator');
 const read=(packet,fp=fingerprint,authorized=true)=>reader.read({
  authorized,certificateFingerprint256:fp,operatorReadPacket:packet});
 return {adapter,reader,read,request,clock};
}
test('QL482 source-specific mutual TLS, signatures and exact tenant grants',t=>{
 const {adapter,read,request}=fixture(t);
 assert.equal(adapter.ingest(source('HEARTBEAT_MISSED',1)).state,'SCOPED_CASE_EVENT_DURABLY_RECORDED');
 const original=request();
 assert.equal(read(original).body.caseStatus,'OPEN');
 assert.equal(read(original).status,409); // replay
 assert.equal(read(request(id(1001)),otherFingerprint).status,401);
 assert.equal(read(request(id(1002)),fingerprint,false).status,401);
 assert.equal(read(signed(readPayload(id(1003)),'outsider')).status,401);
 assert.equal(read(request(id(1004),{tenantId:'other-landscaping'})).status,403);
 assert.equal(read(request(id(1005),{sourceApp:'icamp'})).status,403);
 assert.equal(read(request(id(1006),{environment:'PRIVATE_STAGING'})).status,403);
 assert.equal(read(request(id(1007),{requestedAtMs:t0-70000})).status,403);
 assert.equal(read(request(id(1008),{requestedAtMs:t0+10000})).status,403);
 const projected=read(request(id(1009))).body;
 assert.equal(projected.productionAcceptance,false);
 assert.equal(projected.providerDeliveryState,'NOT_SENT');
 assert.equal('sourceRecordId' in projected,false);
 assert.equal('pendingIntents' in projected,false);
 assert.equal('customerId' in projected,false);
 assert.equal(QL482_BOUNDARY.autoListen,false);
});
test('QL482 independent signed YW missing -> recovered -> operator close (synthetic only)',t=>{
 const {adapter,read,request,clock}=fixture(t);
 assert.equal(adapter.ingest(source('HEARTBEAT_MISSED',1)).caseStatus,'OPEN');
 assert.equal(adapter.ingest(source('HEARTBEAT_RECOVERED',2)).caseStatus,'RECOVERY_PENDING_OPERATOR_REVIEW');
 const closure=adapter.command(command());
 assert.equal(closure.state,'PRIVATE_OPERATOR_TRANSITION_DURABLY_RECORDED');
 assert.equal(closure.caseStatus,'CLOSED');
 const signedRead=request(id(1100));
 const final=read(signedRead);
 assert.equal(final.status,200);
 assert.equal(final.body.caseStatus,'CLOSED');
 const witnessPayload={schema:QL482_WITNESS_SCHEMA,reviewId:id(999),
  reviewerId:'independent-reviewer',sourceApp:'yard-workers',
  environment:'SIMULATION',tenantId:tenant,episodeId:episode,
  caseId:final.body.caseId,operatorId:'ree-operator',caseStatus:'CLOSED',
  lastSequence:2,lastReceiptDigest:final.body.lastReceiptDigest,
  lastJournalDigest:final.body.lastJournalDigest,sourceRevision:sha,
  reviewedAtMs:clock(),scopeClass:'NON_SENSITIVE_SCOPED_EXCEPTION',
  originalHostObserved:false,customerDeliveryVerified:false,
  productionAcceptance:false,authorityTransfer:false};
 const witness=signed(witnessPayload,'reviewer');
 const verify=(packet=witness,adapterUnderTest=adapter)=>verifyQl482YardWorkersLifecycle({
  adapter:adapterUnderTest,operatorReadPacket:signedRead,witnessPacket:packet,
  witnessPin:pin('reviewer'),operatorPin:pin('operator'),
  sourcePin:pin('yard-workers'),nowMs:clock()});
 const verified=verify();
 assert.equal(verified.state,'INDEPENDENT_SIGNED_PRIVATE_YW_LIFECYCLE_REVIEW_HELD');
 assert.equal(verified.productionAcceptance,false);
 assert.match(verified.fieldAcceptance,/HOLD_ORIGINAL/);
 assert.equal(verify(signed({...witnessPayload,tenantId:'other-company'},'reviewer')).state,'HOLD');
 assert.equal(verify(signed({...witnessPayload,lastJournalDigest:'f'.repeat(64)},'reviewer')).state,'HOLD');
 assert.equal(verify({...witness,signature:signed(witnessPayload,'outsider').signature}).state,'HOLD');
 assert.equal(verify(signed({...witnessPayload,originalHostObserved:true},'reviewer')).state,'HOLD');
 assert.equal(verifyQl482YardWorkersLifecycle({adapter,operatorReadPacket:signedRead,
  witnessPacket:witness,witnessPin:pin('operator'),operatorPin:pin('operator'),
  sourcePin:pin('yard-workers'),nowMs:clock()}).state,'HOLD');
});
test('QL482 empty, unapproved and wildcard ACL fail closed',t=>{
 const {adapter}=fixture(t);
 for(const acl of [{}, {'*':{operatorId:'ree-operator',role:'case-reader',scopes:[]}},
  {[fingerprint]:{operatorId:'ree-operator',role:'admin',scopes:[{
   sourceApp:'yard-workers',environment:'SIMULATION',tenantId:tenant}]}},
  {[fingerprint]:{operatorId:'ree-operator',role:'case-reader',scopes:[{
   sourceApp:'yard-workers',environment:'SIMULATION',tenantId:'*'}]}}]){
  assert.throws(()=>createQl482ProtectedCaseReader({adapter,operatorPin:pin('operator'),acl}));
 }
 assert.throws(()=>createQl482HttpsServer({reader:{read(){}}}),/TLS_KEYS_CA/);
 assert.equal(QL482_PATH,'/internal/comms/ql482/cases/read');
});
