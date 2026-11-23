import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {validateQl488Enrollment,probeQl488PrivateEndpoint,createQl488DecisionLedger,createQl488OperatorCustody} from './ql488-original-host-transport.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const endpoints=()=>Object.fromEntries(QL485_SOURCE_IDS.map((id,i)=>[id,{
 sourceId:id,url:'https://source'+i+'.private.example/internal/comms/source-release',
 serverCertificateSha256:digest('unique-trust-'+id),
 caPem:'---- BEGIN TEST CA ----'+'c'.repeat(50),
 clientCertificatePem:'---- BEGIN TEST CERT ----'+'d'.repeat(50),
 clientKeyPem:'---- BEGIN TEST KEY ----'+'e'.repeat(50)
}]));
const decision=()=>({sourceId:'yw',decisionId:'decision_00001',decision:'ACKNOWLEDGE_HOLD',
 decisionDigest:'a'.repeat(64),receiptDigest:'b'.repeat(64),registryDigest:'c'.repeat(64)});
function fixture(ctx){
 const root=mkdtempSync(join(tmpdir(),'ql488-private-'));
 ctx.after(()=>rmSync(root,{recursive:true,force:true}));
 return {root,ledger:createQl488DecisionLedger({directory:root,now:()=>1740000000000})};
}
test('QL488 exact six-source distinct private mTLS enrollments, no implicit connection',()=>{
 const e=endpoints();
 const r=validateQl488Enrollment(e);
 assert.equal(r.state,'SIX_SOURCE_TRANSPORT_CONFIG_VALIDATED_NOT_CONNECTED');
 assert.equal(r.transportProved,false);
 assert.equal(r.automaticListen,false);
 assert.throws(()=>validateQl488Enrollment({yw:e.yw}),/SIX_SOURCE/);
 assert.throws(()=>validateQl488Enrollment({...e,icamp:{...e.icamp,url:e.yw.url}}),/TRANSPORT_REUSE/);
 assert.throws(()=>validateQl488Enrollment({...e,icamp:{...e.icamp,serverCertificateSha256:e.yw.serverCertificateSha256}}),/TRANSPORT_REUSE/);
 for(const bad of ['http://source.example/internal/comms/source-release','https://user:secret@source.example/internal/comms/source-release','https://source.example/private?token=x','https://localhost/internal/comms/source-release']){
  assert.throws(()=>validateQl488Enrollment({...e,yw:{...e.yw,url:bad}}),/HTTPS_URL/);
 }
});
test('QL488 probe rejects unconfigured source and bounded timeout without contacting network',async()=>{
 const r=await probeQl488PrivateEndpoint({sourceId:'not-a-source',url:'https://example.com',serverCertificateSha256:'a'.repeat(64)});
 assert.equal(r.state,'HOLD');
 const r2=await probeQl488PrivateEndpoint(endpoints().yw,{timeoutMs:0});
 assert.equal(r2.reason,'QL488_BOUNDED_TIMEOUT_REQUIRED');
});
test('QL488 private operator journal survives restart with per-source isolation and replay',ctx=>{
 const f=fixture(ctx),p=decision();
 assert.equal(f.ledger.summary().decisionCount,0);
 const first=f.ledger.append(p);
 assert.equal(first.state,'DURABLE_OPERATOR_DECISION_RECORDED_HELD',JSON.stringify(first));
 assert.equal(first.authorityTransfer,false);
 assert.equal(f.ledger.append(p).state,'DURABLE_DECISION_REPLAY_HELD');
 assert.equal(f.ledger.append({...p,decisionDigest:'f'.repeat(64)}).state,'HOLD');
 const second=f.ledger.append({...p,sourceId:'icamp'});
 assert.equal(second.sequence,2);
 const after=createQl488DecisionLedger({directory:f.root});
 assert.equal(after.summary().decisionCount,2);
 assert.equal(after.summary().perSource.yw,1);
 assert.equal(after.summary().perSource.icamp,1);
 assert.equal(after.summary().productionAcceptance,false);
});
test('QL488 altered custody journal is a tamper HOLD and cannot append',ctx=>{
 const f=fixture(ctx);
 f.ledger.append(decision());
 const path=join(f.root,'ql488-operator-decisions.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace('ACKNOWLEDGE_HOLD','AUTO_APPROVE'));
 assert.equal(f.ledger.summary().state,'HOLD');
 assert.equal(f.ledger.append({...decision(),decisionId:'decision_00002'}).state,'HOLD');
});
test('QL488 rejects unsigned decisions and binds successful independent HOLD review to matching durable registry evidence',ctx=>{
 const f=fixture(ctx);
 const snap={state:'PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD',registryDigest:'c'.repeat(64),
  sources:{yw:{evidenceDigest:'b'.repeat(64)}}};
 const registry={summary:()=>snap};
 const sync={reconcile:()=>({state:'HOLD'})};
 let custody=createQl488OperatorCustody({sync,registry,ledger:f.ledger});
 assert.equal(custody.record({signedDecision:{},receiptDigest:'b'.repeat(64)}).state,'HOLD');
 sync.reconcile=()=>({state:'OPERATOR_DECISION_RECORDED_IN_MEMORY_HOLD',
  sourceId:'yw',decision:'ACKNOWLEDGE_HOLD',decisionDigest:'a'.repeat(64)});
 custody=createQl488OperatorCustody({sync,registry,ledger:f.ledger});
 const signedDecision={payload:{decisionId:'decision_00001',registryDigest:'c'.repeat(64)}};
 assert.equal(custody.record({signedDecision,receiptDigest:'f'.repeat(64)}).state,'HOLD');
 assert.equal(custody.record({signedDecision,receiptDigest:'b'.repeat(64)}).state,'DURABLE_OPERATOR_DECISION_RECORDED_HELD');
 assert.equal(custody.automaticApproval,false);
});
