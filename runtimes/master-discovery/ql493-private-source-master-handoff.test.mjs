import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {createQl491ReviewJournal} from './ql491-exception-intake.mjs';
import {createQl492PrivateWitnessLedger,createQl492FieldReview}
 from './ql492-field-witness-audit.mjs';
import {inspectQl493MtlSReadiness,QL493_HANDOFF_SCHEMA,QL493_ACK_SCHEMA,
 createQl493HandoffJournal,createQl493MasterHandoff}
 from './ql493-private-source-master-handoff.mjs';
const at=1795530000000;
const keys=Object.fromEntries(['owner','reviewer','master','impostor'].map(k=>[
 k,generateKeyPairSync('ed25519')]));
const hash=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const pem=k=>keys[k].publicKey.export({type:'spki',format:'pem'});
const signPacket=(p,k)=>({payload:p,signature:sign(null,
 Buffer.from(canonicalize(p)),keys[k].privateKey).toString('base64url')});
const pins={ownerPublicKeyPem:pem('owner'),reviewerPublicKeyPem:pem('reviewer'),
 masterPublicKeyPem:pem('master')};
function fixture(t,{customPins=pins}={}){
 const directory=mkdtempSync(join(tmpdir(),'ql493-private-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 let now=at;
 const ql491=createQl491ReviewJournal({directory,now:()=>now});
 const ql492=createQl492PrivateWitnessLedger({directory,now:()=>now});
 const source=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
  operatorPublicKeyPem:pem('owner'),reviewerPublicKeyPem:pem('reviewer')
 }]));
 const review=createQl492FieldReview({directory,
  ql491Journal:ql491,ql492Ledger:ql492,exceptionPins:source,now:()=>now});
 const journal=createQl493HandoffJournal({directory,now:()=>now});
 const custody=createQl493MasterHandoff({
  readAudit:()=>review.auditReadback(),journal,pins:customPins,now:()=>now});
 return {directory,ql491,ql492,review,journal,custody,now:()=>now,
  time:ms=>{now=ms}};
}
function pair(f,change={}){
 const a=f.review.auditReadback(),t=f.now();
 const base={schema:QL493_HANDOFF_SCHEMA,handoffId:'handoff_ql493_0001',
  auditDigest:a.auditEvidenceDigest,ql491JournalHead:a.priorJournalHead,
  ql492JournalHead:a.ql492JournalHead,sourceCount:6,
  recipient:'rosevear-master',
  requestedAction:'OFFLINE_AUDIT_HANDOFF_FOR_INDEPENDENT_REVIEW',
  role:'owner',actorId:'original_owner_0001',
  issuedAtMs:t-100,expiresAtMs:t+50000,
  customerDataIncluded:false,authorityTransfer:false};
 return {ownerPacket:signPacket({...base,...change.owner},change.ownerSigner??'owner'),
  reviewerPacket:signPacket({...base,role:'independent-reviewer',
   actorId:'independent_reviewer_0001',...change.reviewer},
   change.reviewerSigner??'reviewer')};
}
function ack(f,staged,change={}){
 const a=f.review.auditReadback(),t=f.now();
 const p={schema:QL493_ACK_SCHEMA,ackId:'master_ack_ql493_0001',
  handoffId:'handoff_ql493_0001',stageRecordDigest:staged.stageRecordDigest,
  auditDigest:a.auditEvidenceDigest,
  acknowledgedAction:'ACKNOWLEDGE_OFFLINE_AUDIT_PACKET_ONLY',
  role:'independent-master-auditor',actorId:'master_reviewer_0001',
  issuedAtMs:t-50,expiresAtMs:t+60000,deliveryObserved:false,
  customerDataIncluded:false,authorityTransfer:false,...change.payload};
 return {masterPacket:signPacket(p,change.signer??'master')};
}
test('QL493 initial audit is offline six-source HOLD with zero network or fake source proof',t=>{
 const f=fixture(t),r=f.custody.audit();
 assert.equal(r.state,'QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD',JSON.stringify(r));
 assert.equal(r.realSourcesVerified,0);
 assert.equal(r.masterNetworkDeliveryVerified,false);
 assert.equal(r.stagedOfflineHandoffs,0);
 assert.equal(r.sourceAuthorized,false);
 assert.equal(f.journal.summary().records,0);
});
test('QL493 signed offline two-party handoff stores private metadata, never sends or certifies',t=>{
 const f=fixture(t),p=pair(f);
 const saved=f.custody.stage(p);
 assert.equal(saved.state,'TWO_PARTY_OFFLINE_MASTER_HANDOFF_STAGED_HELD',JSON.stringify(saved));
 assert.equal(saved.masterDeliveryVerified,false);
 assert.equal(saved.networkSent,false);
 assert.equal(f.journal.summary().stagedHandoffs,1);
 assert.equal(f.custody.audit().masterNetworkDeliveryVerified,false);
 assert.equal(f.custody.stage(p).state,'HOLD');
 assert.equal(f.journal.summary().records,1);
});
test('QL493 independently pinned Master ACK packet can be recorded but cannot assert delivery',t=>{
 const f=fixture(t),s=f.custody.stage(pair(f));
 assert.equal(s.state,'TWO_PARTY_OFFLINE_MASTER_HANDOFF_STAGED_HELD');
 const received=f.custody.recordMasterAck(ack(f,s));
 assert.equal(received.state,'INDEPENDENT_SIGNED_MASTER_ACK_PACKET_RECORDED_HELD',JSON.stringify(received));
 assert.equal(received.networkDeliveryVerified,false);
 assert.equal(received.masterProductionAcceptance,false);
 assert.equal(f.custody.audit().separatelySignedAckPacketsRecorded,1);
 assert.equal(f.custody.audit().masterAcceptedProduction,false);
 assert.equal(f.custody.recordMasterAck(ack(f,s)).state,'HOLD');
});
test('QL493 rejects wrong, stale, reused reviewer, altered recipient and authority transfer',t=>{
 const f=fixture(t);
 for(const ch of [
  {reviewerSigner:'impostor'}, {owner:{issuedAtMs:at-400000}},
  {reviewer:{auditDigest:hash('other-audit')}},
  {reviewer:{role:'owner'}},
  {reviewer:{actorId:'original_owner_0001'}},
  {owner:{recipient:'other-master'}},
  {owner:{authorityTransfer:true}},
  {reviewer:{sourceCount:1}},
  {owner:{ql492JournalHead:hash('fake-journal')}},
  {reviewer:{requestedAction:'AUTO_SEND_TO_MASTER'}}
 ])assert.equal(f.custody.stage(pair(f,ch)).state,'HOLD',JSON.stringify(ch));
 assert.equal(f.journal.summary().records,0);
});
test('QL493 rejects nonindependent signer pin identities even when signatures technically verify',t=>{
 const bad={ownerPublicKeyPem:pem('owner'),reviewerPublicKeyPem:pem('owner'),
  masterPublicKeyPem:pem('master')};
 const f=fixture(t,{customPins:bad});
 assert.equal(f.custody.stage(pair(f)).state,'HOLD');
 assert.equal(f.journal.summary().records,0);
});
test('QL493 Master ACK rejects wrong signer, forged stage, claimed delivery and wrong receipt',t=>{
 const f=fixture(t),s=f.custody.stage(pair(f));
 for(const change of [
  {signer:'impostor'},
  {payload:{deliveryObserved:true}},
  {payload:{stageRecordDigest:hash('fake-stage')}},
  {payload:{handoffId:'other_handoff_0001'}},
  {payload:{auditDigest:hash('other-audit')}},
  {payload:{role:'owner'}},
  {payload:{expiresAtMs:at-10}},
  {payload:{authorityTransfer:true}}
 ])assert.equal(f.custody.recordMasterAck(ack(f,s,change)).state,'HOLD',
  JSON.stringify(change));
 assert.equal(f.journal.summary().signedMasterAckPackets,0);
});
test('QL493 handoff refuses changed QL492 evidence head after signatures were issued',t=>{
 const f=fixture(t),signed=pair(f);
 assert.equal(f.ql491.appendIntake({readbackDigest:hash('readback-new'),
  inventoryDigest:hash([]),snapshotDigest:hash('updated'),
  caseCount:0,openCount:0,overdueCount:0,closedCount:0,
  unmatchedClosures:0,sourceHoldCount:6}).state,
  'DURABLE_SIGNED_INTAKE_RECONCILED_HELD');
 assert.equal(f.custody.stage(signed).state,'HOLD');
 assert.equal(f.journal.summary().records,0);
});
test('QL493 durable signed ACK only refers to a current unchanged independent six-source audit',t=>{
 const f=fixture(t),s=f.custody.stage(pair(f));
 const old=ack(f,s);
 assert.equal(f.ql491.appendIntake({readbackDigest:hash('new-readback'),
  inventoryDigest:hash([]),snapshotDigest:hash('fresh'),
  caseCount:0,openCount:0,overdueCount:0,closedCount:0,
  unmatchedClosures:0,sourceHoldCount:6}).state,
  'DURABLE_SIGNED_INTAKE_RECONCILED_HELD');
 assert.equal(f.custody.recordMasterAck(old).state,'HOLD');
 assert.equal(f.journal.summary().signedMasterAckPackets,0);
});
test('QL493 tampered private handoff chain fails closed for audit and stage',t=>{
 const f=fixture(t);
 assert.equal(f.custody.stage(pair(f)).state,'TWO_PARTY_OFFLINE_MASTER_HANDOFF_STAGED_HELD');
 const file=join(f.directory,'ql493-master-handoffs.ndjson');
 writeFileSync(file,readFileSync(file,'utf8').replace('STAGE_OFFLINE','LIVE_DELIVERED'));
 assert.equal(f.journal.summary().state,'HOLD');
 assert.equal(f.custody.audit().state,'HOLD');
 assert.equal(f.custody.stage(pair(f)).state,'HOLD');
});
test('QL493 mTLS preflight denies missing six sources and fake certs without touching network',()=>{
 assert.equal(inspectQl493MtlSReadiness().state,'HOLD');
 assert.equal(inspectQl493MtlSReadiness({endpoints:{}}).state,'HOLD');
 const endpoints=Object.fromEntries(QL485_SOURCE_IDS.map((id,i)=>[id,{
  sourceId:id,url:'https://source'+i+'.private.example.com/internal/comms/source-release',
  serverCertificateSha256:hash('pin-'+id),
  caPem:'-----BEGIN CERTIFICATE-----FAKECA-----END CERTIFICATE-----',
  clientCertificatePem:'-----BEGIN CERTIFICATE-----FAKECLIENT-----END CERTIFICATE-----',
  clientKeyPem:'-----BEGIN PRIVATE KEY-----FAKEKEY-----END PRIVATE KEY-----'
 }]));
 const result=inspectQl493MtlSReadiness({endpoints});
 assert.equal(result.state,'HOLD');
 assert.equal(result.locallyParseableSources,0);
 assert.equal(result.transportConnectionsVerified,0);
 assert.equal(result.sources.yw.remoteServerFingerprintChecked,false);
 const swapped=structuredClone(endpoints);
 swapped.icamp.serverCertificateSha256=endpoints.yw.serverCertificateSha256;
 assert.equal(inspectQl493MtlSReadiness({endpoints:swapped}).state,'HOLD');
 const badPath=structuredClone(endpoints);
 badPath.yw.url='http://example.com/internal/comms/source-release';
 assert.equal(inspectQl493MtlSReadiness({endpoints:badPath}).state,'HOLD');
});
test('QL493 CLI status is inert on CI and cannot run automatic field actions',()=>{
 const cli=fileURLToPath(new URL('./ql493-original-host-cli.mjs',import.meta.url));
 const s=JSON.parse(execFileSync(process.execPath,[cli,'--status'],{encoding:'utf8'}));
 assert.equal(s.state,'QL493_PRIVATE_ENROLLMENT_OFF_BY_DEFAULT');
 assert.equal(s.verifiedLiveSources,0);
 assert.equal(s.masterNetworkDelivery,false);
 assert.equal(s.automaticProbe,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--probe','missing','yw'],{stdio:'pipe'}));
});
