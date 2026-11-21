import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createQl480PrivateCaseAdapter,QL480_SOURCE_SCHEMA,
 QL480_READ_SCHEMA,QL480_OPERATOR_SCHEMA} from './ql480-scoped-incident-adapter.mjs';
import {QL481_BINDING,QL481_BOUNDARY,reviewQl481SourceBinding,
 ingestQl481BoundedFieldEvent,prepareQl481Handover,
 createQl481PrivateHandoverLedger} from './ql481-private-incident-handover.mjs';
const names=['yard-workers','icamp','operator','custodian','reviewer','owner','rogue'];
const keys=Object.fromEntries(names.map(n=>[n,generateKeyPairSync('ed25519')]));
const pin=n=>keys[n].publicKey.export({format:'der',type:'spki'}).toString('base64');
const signed=(p,who)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 keys[who].privateKey).toString('base64')});
const now=Date.now(),rev='a'.repeat(40),missing='b'.repeat(64),recovered='c'.repeat(64);
const appScope=(app='yard-workers',tenant='rosevear-landscaping',episode='episode_realistic_001')=>({
 sourceApp:app,tenantId:tenant,environment:'PRIVATE_STAGING',episodeId:episode});
const makeSource=(scope,kind,seq,eventId,receiptDigest=missing)=>signed({
 schema:QL480_SOURCE_SCHEMA,eventId,...scope,kind,sequence:seq,
 sourceRevision:rev,sourceRecordId:'opaque_report_001',
 receiptDigest,observedAtMs:now-(kind==='HEARTBEAT_MISSED'?20000:10000),
 correlationId:'corr_001_valid',causationId:'cause_001_valid',
 classification:'NON_SENSITIVE_SCOPED_EXCEPTION'},scope.sourceApp);
const makeRead=(scope,requestedAtMs=now)=>signed({
 schema:QL480_READ_SCHEMA,requestId:'read_private_001',operatorId:'operator_main',
 ...scope,requestedAtMs},'operator');
const bindingPayload=(app='yard-workers',tenant='rosevear-landscaping',extra={})=>({
 schema:QL481_BINDING,bindingId:'binding_source_001',
 sourceApp:app,environment:'PRIVATE_STAGING',tenantId:tenant,
 sourceRevision:rev,sourceSignerPin:pin(app),operatorSignerPin:pin('operator'),
 approvedAtMs:now-1000,expiresAtMs:now+180000,
 sourceCustodianId:'custodian_main',independentReviewerId:'reviewer_main',
 dataClass:'NON_SENSITIVE_SCOPED_EXCEPTION',receiverEnabled:false,
 customerOperationsAuthorized:false,authorityTransfer:false,...extra});
const bind=(app='yard-workers',tenant='rosevear-landscaping',extra={})=>{
 const payload=bindingPayload(app,tenant,extra);
 return reviewQl481SourceBinding({
 sourcePacket:signed(payload,'custodian'),
 reviewerPacket:signed(payload,'reviewer'),
 sourceCustodianPin:pin('custodian'),reviewerPin:pin('reviewer'),
 operatorPin:pin('operator'),sourcePin:pin(app),sourceApp:app,
 tenantId:tenant,expectedRevision:rev,nowMs:now});
};
function fixture(fn){
 const dir=mkdtempSync(join(tmpdir(),'ql481-'));
 try{
  const makeAdapter=(environment='PRIVATE_STAGING')=>createQl480PrivateCaseAdapter({
   directory:join(dir,'cases'),sourcePins:{'yard-workers':pin('yard-workers'),icamp:pin('icamp')},
   operatorPin:pin('operator'),environment,now:()=>now});
  const ledger=()=>createQl481PrivateHandoverLedger({
    directory:join(dir,'handovers'),ownerPin:pin('owner'),reviewerPin:pin('reviewer'),
    adapter:makeAdapter(),now:()=>now});
  return fn({dir,makeAdapter,ledger});
 }finally{rmSync(dir,{force:true,recursive:true})}
}
test('QL481 independent source binding requires distinct real signatures and exact tenant/source/expiry',()=>{
 const v=bind();assert.equal(v.state,'SIGNED_PRIVATE_STAGING_SCOPE_REVIEW_HELD');
 assert.equal(v.sourceConnected,false);
 for(const bad of [{receiverEnabled:true},{authorityTransfer:true},
  {customerOperationsAuthorized:true},{environment:'SIMULATION'},
  {dataClass:'CUSTOMER_PII'},{tenantId:'foreign-tenant'},
  {sourceSignerPin:pin('icamp')},{sourceRevision:'f'.repeat(40)},
  {expiresAtMs:now-1},{approvedAtMs:now+50},
  {sourceCustodianId:'reviewer_main'}]){
   assert.equal(bind('yard-workers','rosevear-landscaping',bad).state,'HOLD',JSON.stringify(bad));
 }
 const wrong=reviewQl481SourceBinding({sourcePacket:signed(bindingPayload(),'custodian'),
  reviewerPacket:signed(bindingPayload(),'rogue'),
  sourceCustodianPin:pin('custodian'),reviewerPin:pin('reviewer'),
  operatorPin:pin('operator'),sourcePin:pin('yard-workers'),
  sourceApp:'yard-workers',tenantId:'rosevear-landscaping',expectedRevision:rev,nowMs:now});
 assert.equal(wrong.state,'HOLD');
});
test('QL481: independently scoped YW and iCamp staged events and durable signed handover readback',()=>{
 fixture(({dir,makeAdapter,ledger})=>{
  const adapter=makeAdapter();
  const results=[];
  for(const [idx,scope] of [
   appScope(),appScope('icamp','camp-rosevear','episode_camp_0001')].entries()){
   const ready=bind(scope.sourceApp,scope.tenantId);
   const open=makeSource(scope,'HEARTBEAT_MISSED',1,'event_missing_'+idx);
   let a=ingestQl481BoundedFieldEvent({adapter,binding:ready,envelope:open,nowMs:now});
   assert.equal(a.state,'SCOPED_PRIVATE_STAGING_EVENT_COMMITTED_HELD');
   assert.equal(a.caseStatus,'OPEN');
   assert.equal(ingestQl481BoundedFieldEvent({adapter,binding:ready,
    envelope:open,nowMs:now}).eventCount,1);
   const rec=makeSource(scope,'HEARTBEAT_RECOVERED',2,'event_recovery_'+idx,recovered);
   a=ingestQl481BoundedFieldEvent({adapter,binding:ready,envelope:rec,nowMs:now});
   assert.equal(a.caseStatus,'RECOVERY_PENDING_OPERATOR_REVIEW');
   const read=makeRead(scope);
   const prepared=prepareQl481Handover({adapter,operatorReadPacket:read,
    ownerSigner:keys.owner.privateKey,handoverId:'handover_opaque_'+idx,
    operatorId:'operator_main',nowMs:now});
   assert.equal(prepared.state,'SIGNED_HANDOVER_PREPARED_NOT_ACCEPTED');
   const packet=prepared.ownerPacket;
   assert.equal(packet.payload.customerDeliveryVerified,false);
   const reviewerPacket=signed(packet.payload,'reviewer');
   let ack=ledger().commit({ownerPacket:packet,reviewerPacket,operatorReadPacket:read});
   assert.equal(ack.state,'DURABLE_SIGNED_HANDOVER_ACK_REVIEW_HELD',JSON.stringify(ack));
   assert.equal(ack.durableReadBack,true);
   assert.equal(ack.authorityTransfer,false);
   const repeat=ledger().commit({ownerPacket:packet,reviewerPacket,operatorReadPacket:read});
   assert.equal(repeat.state,'DURABLE_SIGNED_HANDOVER_ACK_REPLAY_HELD');
   assert.equal(repeat.handoverDigest,ack.handoverDigest);
   results.push(ack);
  }
  assert.equal(results.length,2);
  assert.notEqual(results[0].caseId,results[1].caseId);
  const files=readdirSync(join(dir,'handovers'));
  assert.equal(files.length,2);
  assert.equal(QL481_BOUNDARY.publicRoute,false);
  assert.equal(QL481_BOUNDARY.realYWLiveCase,false);
 });
});
test('QL481 rejects changed case after preparation, replay conflicts and tampered ledger',()=>{
 fixture(({dir,makeAdapter,ledger})=>{
  const adapter=makeAdapter(),scope=appScope(),ready=bind();
  adapter.ingest(makeSource(scope,'HEARTBEAT_MISSED',1,'event_initial_001'));
  const read=makeRead(scope);
  const prepared=prepareQl481Handover({adapter,operatorReadPacket:read,
   ownerSigner:keys.owner.privateKey,handoverId:'handover_initial_001',
   operatorId:'operator_main',nowMs:now});
  const ownerPacket=prepared.ownerPacket;
  const reviewerPacket=signed(ownerPacket.payload,'reviewer');
  const bogus=signed({...ownerPacket.payload,tenantId:'foreign-tenant'},'reviewer');
  assert.equal(ledger().commit({ownerPacket,reviewerPacket:bogus,operatorReadPacket:read}).state,'HOLD');
  adapter.ingest(makeSource(scope,'HEARTBEAT_RECOVERED',2,'event_rec_001',recovered));
  assert.equal(ledger().commit({ownerPacket,reviewerPacket,operatorReadPacket:read}).reason,
   'QL481_HANDOVER_REPLAYED_OR_SOURCE_STATE_CHANGED');
  const current=prepareQl481Handover({adapter,operatorReadPacket:read,
   ownerSigner:keys.owner.privateKey,handoverId:'handover_current_001',
   operatorId:'operator_main',nowMs:now});
  const matched=signed(current.ownerPacket.payload,'reviewer');
  assert.equal(ledger().commit({ownerPacket:current.ownerPacket,
   reviewerPacket:matched,operatorReadPacket:read}).state,'DURABLE_SIGNED_HANDOVER_ACK_REVIEW_HELD');
  const alt=prepareQl481Handover({adapter,operatorReadPacket:makeRead(scope,now-100),
   ownerSigner:keys.owner.privateKey,handoverId:'handover_current_001',
   operatorId:'operator_main',nowMs:now-100});
  assert.equal(ledger().commit({ownerPacket:alt.ownerPacket,
   reviewerPacket:signed(alt.ownerPacket.payload,'reviewer'),
   operatorReadPacket:read}).state,'HOLD');
  const file=join(dir,'handovers',readdirSync(join(dir,'handovers'))[0]);
  const data=JSON.parse(readFileSync(file,'utf8'));
  data.ack.durableReadBack=false;
  writeFileSync(file,JSON.stringify(data),{mode:0o600});
  assert.equal(ledger().commit({ownerPacket:current.ownerPacket,
   reviewerPacket:matched,operatorReadPacket:read}).state,'HOLD');
 });
});
test('QL481 signed source scope is never a substitute for real YW/iCamp operator enrollment',()=>{
 fixture(({makeAdapter})=>{
  const adapter=makeAdapter();
  const good=bind();
  assert.equal(ingestQl481BoundedFieldEvent({adapter,binding:good,
   envelope:makeSource(appScope('icamp','camp-rosevear'),'HEARTBEAT_MISSED',1,
    'event_foreign_001'),nowMs:now}).state,'HOLD');
  assert.equal(ingestQl481BoundedFieldEvent({adapter,binding:good,
   envelope:makeSource(appScope(),'HEARTBEAT_MISSED',1,'event_expired_001'),
   nowMs:now+400000}).state,'HOLD');
  assert.equal(ingestQl481BoundedFieldEvent({adapter,binding:good,
   envelope:signed({...makeSource(appScope(),'HEARTBEAT_MISSED',1,'event_spoof_001').payload,
    customerName:'not-allowed'},'yard-workers'),nowMs:now}).state,'HOLD');
  const never=prepareQl481Handover({adapter,operatorReadPacket:makeRead(appScope()),
   ownerSigner:keys.owner.privateKey,handoverId:'handover_missing_001',
   operatorId:'operator_main',nowMs:now});
  assert.equal(never.state,'HOLD');
 });
});
