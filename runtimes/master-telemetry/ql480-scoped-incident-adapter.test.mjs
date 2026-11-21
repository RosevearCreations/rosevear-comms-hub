import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {QL480_SOURCE_SCHEMA,QL480_OPERATOR_SCHEMA,QL480_READ_SCHEMA,
 createQl480PrivateCaseAdapter,QL480_BOUNDARY} from './ql480-scoped-incident-adapter.mjs';

const identities=Object.fromEntries(['yard-workers','icamp','operator','untrusted']
 .map(id=>[id,generateKeyPairSync('ed25519')]));
const pin=k=>identities[k].publicKey.export({format:'der',type:'spki'}).toString('base64');
const signed=(payload,who)=>({payload,
 signature:sign(null,Buffer.from(JSON.stringify(payload)),identities[who].privateKey).toString('base64')});
const sourcePins={'yard-workers':pin('yard-workers'),icamp:pin('icamp')};
const uuid=id=>('ev'+String(id).padStart(12,'0'));
const eid=id=>('episode_'+String(id).padStart(8,'0'));
const hash='a'.repeat(64),otherHash='b'.repeat(64),sha='c'.repeat(40);
const t0=Date.now()-60000;
function source({sourceApp='yard-workers',tenantId='rosevear-landscaping',
  environment='SIMULATION',episodeId=eid(1),kind='HEARTBEAT_MISSED',
  eventId=uuid(1),sequence=1,observedAtMs=t0,
  sourceRevision=sha,receiptDigest=hash,sourceRecordId=uuid(100),
  correlationId=uuid(200),causationId=uuid(300),...override}={}){
 const payload={schema:QL480_SOURCE_SCHEMA,eventId,sourceApp,environment,tenantId,
  episodeId,kind,sequence,sourceRevision,sourceRecordId,receiptDigest,
  observedAtMs,correlationId,causationId,
  classification:'NON_SENSITIVE_SCOPED_EXCEPTION',...override};
 return signed(payload,sourceApp);
}
function operator({sourceApp='yard-workers',tenantId='rosevear-landscaping',
 environment='SIMULATION',episodeId=eid(1),action='CLOSE_CASE',
 commandId=uuid(500),intentKey=null,evidenceDigest=otherHash,
 occurredAtMs=t0+30000,operatorId='rosevear-ops',
 disposition='OWNER_REVIEW',...override}={}){
 return signed({schema:QL480_OPERATOR_SCHEMA,commandId,action,
  operatorId,sourceApp,environment,tenantId,episodeId,
  intentKey,evidenceDigest,occurredAtMs,disposition,...override},'operator');
}
function read({sourceApp='yard-workers',tenantId='rosevear-landscaping',
 environment='SIMULATION',episodeId=eid(1),requestId=uuid(600),
 requestedAtMs=Date.now(),operatorId='rosevear-ops'}={}){
 return signed({schema:QL480_READ_SCHEMA,requestId,operatorId,sourceApp,
  environment,tenantId,episodeId,requestedAtMs},'operator');
}
function fixture(fn){
 const dir=mkdtempSync(join(tmpdir(),'ql480-private-'));
 let clock=t0+50000;
 const make=()=>createQl480PrivateCaseAdapter({
  directory:dir,sourcePins,operatorPin:pin('operator'),
  environment:'SIMULATION',now:()=>clock});
 try{return fn({dir,make,advance:n=>clock+=n,now:()=>clock})}
 finally{rmSync(dir,{recursive:true,force:true})}
}
test('QL480 YW & iCamp: two independent synthetic incident journeys, durable restart, one close per episode',()=>{
 fixture(({make,now})=>{
  let adapter=make();
  const open=source();
  let a=adapter.ingest(open);
  assert.equal(a.state,'SCOPED_CASE_EVENT_DURABLY_RECORDED');
  assert.equal(a.transition,'OPEN');
  assert.equal(a.caseStatus,'OPEN');
  assert.equal(a.pendingIntents.length,1);
  assert.equal(a.pendingIntents[0].kind,'OPEN');
  assert.equal(a.providerDeliveryState,'NOT_SENT');
  assert.equal(a.productionAcceptance,false);
  const firstDigest=a.lastJournalDigest;
  const retry=adapter.ingest(open);
  assert.equal(retry.state,'DUPLICATE_SOURCE_EVENT_NO_NEW_EFFECT');
  assert.equal(retry.lastJournalDigest,firstDigest);
  assert.equal(retry.eventCount,1);

  adapter=make(); // a different process reads the fsynced journal
  assert.equal(adapter.read(read({requestedAtMs:now()})).caseStatus,'OPEN');
  assert.equal(adapter.ingest(source({eventId:uuid(2),sequence:2,observedAtMs:t0+5000})).transition,'OCCURRENCE');
  assert.equal(adapter.read(read({requestedAtMs:now()})).eventCount,2);
  const recovered=source({eventId:uuid(3),sequence:3,
   kind:'HEARTBEAT_RECOVERED',observedAtMs:t0+20000,receiptDigest:otherHash});
  const r=adapter.ingest(recovered);
  assert.equal(r.transition,'RECOVERY');
  assert.equal(r.caseStatus,'RECOVERY_PENDING_OPERATOR_REVIEW');
  assert.equal(r.pendingIntents.length,2);
  assert.equal(r.operatorAcknowledgementState,'NOT_ACCEPTED');
  assert.equal(adapter.command(operator({evidenceDigest:hash,occurredAtMs:t0+30000})).state,'HOLD');
  let closed=adapter.command(operator({evidenceDigest:otherHash,occurredAtMs:t0+30000}));
  assert.equal(closed.caseStatus,'CLOSED');
  assert.equal(closed.operatorAcknowledgementState,'SIGNED_OPERATOR_CLOSURE');
  assert.equal(closed.pendingIntents.length,3);
  const journal=closed.lastJournalDigest;
  assert.equal(adapter.command(operator({evidenceDigest:otherHash,occurredAtMs:t0+30000})).lastJournalDigest,journal);
  assert.equal(adapter.ingest(source({eventId:uuid(4),sequence:4,observedAtMs:t0+35000})).reason,
   'QL480_NEW_OUTAGE_REQUIRES_NEW_EPISODE');
  const oldOutage=adapter.ingest(source({eventId:uuid(5),sequence:1,observedAtMs:t0+7000}));
  assert.equal(oldOutage.state,'HISTORICAL_RETAINED_NO_REOPEN');
  assert.equal(oldOutage.caseStatus,'CLOSED');
  adapter=make();
  assert.equal(adapter.read(read({requestedAtMs:now()})).caseStatus,'CLOSED');
  assert.equal(adapter.read(read({requestedAtMs:now()})).transitionCount,3);

  const camp={
   sourceApp:'icamp',tenantId:'camp-rosevear',episodeId:eid(2)};
  const i1=adapter.ingest(source({...camp,eventId:uuid(101),sourceRecordId:uuid(201)}));
  assert.equal(i1.caseStatus,'OPEN');
  assert.notEqual(i1.caseId,closed.caseId);
  assert.equal(adapter.ingest(source({...camp,eventId:uuid(102),sequence:2,
    kind:'HEARTBEAT_RECOVERED',observedAtMs:t0+20000,
    sourceRecordId:uuid(202),receiptDigest:otherHash})).caseStatus,
    'RECOVERY_PENDING_OPERATOR_REVIEW');
  assert.equal(adapter.command(operator({...camp,evidenceDigest:otherHash,commandId:uuid(700)})).caseStatus,'CLOSED');
  assert.equal(adapter.read(read({...camp,requestedAtMs:now()})).caseStatus,'CLOSED');
  assert.equal(adapter.read(read({requestedAtMs:now()})).caseId,closed.caseId);
 });
});
test('QL480 intents: stable keys, exclusive lease, expired lease restart, private disposition never implies delivery',()=>{
 fixture(({make,advance,now})=>{
  let adapter=make();
  const item=adapter.ingest(source());
  const intent=item.pendingIntents[0];
  const claim=(commandId)=>operator({commandId,action:'CLAIM_INTENT',
   intentKey:intent.intentKey,evidenceDigest:null,
   occurredAtMs:now(),disposition:'SIMULATED_PRIVATE_NO_SEND'});
  const finish=(commandId)=>operator({commandId,action:'COMPLETE_INTENT',
   intentKey:intent.intentKey,evidenceDigest:null,
   occurredAtMs:now(),disposition:'SIMULATED_PRIVATE_NO_SEND'});
  const first=adapter.command(claim(uuid(111)));
  assert.equal(first.pendingIntents[0].attempts,1);
  assert.equal(first.pendingIntents[0].status,'LEASED');
  assert.equal(adapter.command(claim(uuid(112))).reason,'QL480_INTENT_LEASE_OR_RETRY_HOLD');
  adapter=make();
  assert.equal(adapter.read(read({requestedAtMs:now()})).pendingIntents[0].status,'LEASED');
  advance(31000);
  const reClaim=adapter.command(claim(uuid(113)));
  assert.equal(reClaim.pendingIntents[0].attempts,2);
  const completed=adapter.command(finish(uuid(114)));
  assert.equal(completed.pendingIntents[0].status,'DISPOSED_SIMULATION');
  assert.equal(completed.pendingIntents[0].lastDisposition,'SIMULATED_PRIVATE_NO_SEND');
  assert.equal(completed.customerDeliveryVerified,false);
  assert.equal(adapter.command(finish(uuid(115))).reason,'QL480_ACTIVE_LEASE_REQUIRED');
  adapter=make();
  assert.equal(adapter.read(read({requestedAtMs:now()})).pendingIntents[0].status,'DISPOSED_SIMULATION');
 });
});
test('QL480 rejects foreign tenant access, unsigned or swapped keys, accidental PII, sequence replay and cross-app contamination',()=>{
 fixture(({make,now})=>{
  const adapter=make();
  assert.equal(adapter.ingest(source({classification:'CUSTOMER_DATA'})).state,'HOLD');
  assert.equal(adapter.ingest(signed(source().payload,'untrusted')).state,'HOLD');
  assert.equal(adapter.ingest(signed({...source().payload,sourceApp:'other'},'yard-workers')).state,'HOLD');
  assert.equal(adapter.ingest(source({sourceRevision:'bad'})).state,'HOLD');
  assert.equal(adapter.ingest(source({customerEmail:'private@domain.org'})).state,'HOLD');
  const a=adapter.ingest(source());
  assert.equal(a.caseStatus,'OPEN');
  const tenantB=adapter.read(read({tenantId:'other-landscaper',requestedAtMs:now()}));
  assert.equal(tenantB.caseStatus,'MISSING');
  assert.equal(tenantB.eventCount,0);
  const tampered=read({requestedAtMs:now()});
  tampered.payload.tenantId='other-landscaper';
  assert.equal(adapter.read(tampered).state,'HOLD');
  const wrongOp=signed(operator().payload,'untrusted');
  assert.equal(adapter.command(wrongOp).state,'HOLD');
  assert.equal(adapter.ingest(source({eventId:uuid(1),sequence:6,receiptDigest:otherHash})).reason,
   'QL480_EVENT_ID_CONFLICT');
  assert.equal(adapter.ingest(source({eventId:uuid(9),kind:'HEARTBEAT_RECOVERED',
    sequence:1,observedAtMs:t0+1000})).state,'HISTORICAL_RETAINED_NO_REOPEN');
  assert.equal(adapter.read(read({requestedAtMs:now()})).caseStatus,'OPEN');
  assert.equal(adapter.ingest(source({sourceApp:'icamp',tenantId:'rosevear-landscaping',
   eventId:uuid(1)})).caseStatus,'OPEN'); // same ID across app must be separated
  assert.equal(adapter.read(read({requestedAtMs:now()})).caseId,a.caseId);
 });
});
test('QL480 journal refuses damaged or truncated private history, and never reconstructs a forged closure',()=>{
 fixture(({make,dir,now})=>{
  const adapter=make();adapter.ingest(source());
  const files=readdirSync(dir).filter(x=>x.endsWith('.ndjson'));
  assert.equal(files.length,1);
  const file=join(dir,files[0]),original=readFileSync(file,'utf8');
  writeFileSync(file,original.slice(0,-2),{mode:0o600});
  assert.equal(make().read(read({requestedAtMs:now()})).state,'HOLD');
  assert.equal(make().ingest(source({eventId:uuid(9),sequence:2})).state,'HOLD');
  writeFileSync(file,original.replace('"transition":"OPEN"','"transition":"RECOVERY"'),{mode:0o600});
  assert.equal(make().read(read({requestedAtMs:now()})).state,'HOLD');
  writeFileSync(file,original,{mode:0o600});
  assert.equal(make().read(read({requestedAtMs:now()})).caseStatus,'OPEN');
 });
});
test('QL480 private staging requires different source keys and never enables live delivery',()=>{
 const dir=mkdtempSync(join(tmpdir(),'ql480-staging-'));
 try{
  assert.throws(()=>createQl480PrivateCaseAdapter({directory:dir,
   sourcePins:{'yard-workers':pin('yard-workers'),icamp:pin('yard-workers')},
   operatorPin:pin('operator')}),/INDEPENDENT_SIGNER/);
  const staging=createQl480PrivateCaseAdapter({directory:dir,sourcePins,
   operatorPin:pin('operator'),environment:'PRIVATE_STAGING'});
  assert.equal(staging.ingest(source()).state,'HOLD');
  assert.equal(staging.publicRoute,false);
  assert.equal(staging.automaticDispatch,false);
  assert.equal(QL480_BOUNDARY.realSourceJourneys,'NOT_OBSERVED');
 }finally{rmSync(dir,{recursive:true,force:true})}
});
