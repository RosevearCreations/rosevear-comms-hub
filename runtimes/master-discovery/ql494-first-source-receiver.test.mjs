import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {QL494_ADAPTER_SCHEMA,QL494_REVIEW_SCHEMA,
 createQl494FirstSourceJournal,createQl494FirstSourceReceiver,
 inspectQl494AdapterReadiness} from './ql494-first-source-receiver.mjs';

const now=1795559000000,sha=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const sourceKey=id=>id+'_source';
const keyNames=QL485_SOURCE_IDS.flatMap(id=>[sourceKey(id),id+'_owner',id+'_reviewer']).concat(['impostor']);
const keys=Object.fromEntries(keyNames.map(id=>[id,generateKeyPairSync('ed25519')]));
const pem=id=>keys[id].publicKey.export({type:'spki',format:'pem'});
const signPacket=(payload,id)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[id].privateKey).toString('base64url')});
const sourcePins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 sourceId:id,sourcePublicKeyPem:pem(sourceKey(id)),
 sourceRevision:'1'.repeat(40)
}]));
const approvedPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 sourceId:id,publicKeyPem:pem(sourceKey(id)),approvedRevision:'1'.repeat(40),
 independentlyVerified:true,sourceOwnerApproved:true
}]));
const ownerPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,pem(id+'_owner')]));
const reviewerPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,pem(id+'_reviewer')]));
const endpoints=Object.fromEntries(QL485_SOURCE_IDS.map((id,i)=>[id,{
 sourceId:id,url:'https://source'+i+'.private.example.com/internal/comms/source-release',
 serverCertificateSha256:sha('tls-pin-'+id),
 caPem:'-----BEGIN CERTIFICATE-----TEST_NOT_REAL----END CERTIFICATE-----',
 clientCertificatePem:'-----BEGIN CERTIFICATE-----TEST_NOT_REAL----END CERTIFICATE-----',
 clientKeyPem:'-----BEGIN PRIVATE KEY-----TEST_NOT_REAL----END PRIVATE KEY-----'
}]));
const auditDigest=sha('ql493-six-source-audit'),journalHead=sha('ql493-journal-head');
const auditReport=()=>({
 state:'QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD',
 sixSourceAuditDigest:auditDigest,ql493Head:journalHead,
 masterNetworkDeliveryVerified:false,realSourcesVerified:0,
 sourceAuthorized:false,customerWrites:false
});
function fixture(t,changes={}){
 const directory=mkdtempSync(join(tmpdir(),'ql494-private-'));
 t.after(()=>rmSync(directory,{force:true,recursive:true}));
 let at=now,audit=auditReport();
 const journal=createQl494FirstSourceJournal({directory,now:()=>at});
 const rec=createQl494FirstSourceReceiver({
  readMasterAudit:()=>audit,journal,sourcePins:changes.sourcePins??sourcePins,
  approvedPins:changes.approvedPins??approvedPins,
  endpoints:changes.endpoints??endpoints,
  ownerPins:changes.ownerPins??ownerPins,
  reviewerPins:changes.reviewerPins??reviewerPins,now:()=>at
 });
 return {directory,journal,rec,at:()=>at,
  time:x=>{at=x},updateAudit:x=>{audit=x}};
}
function packets(f,id='yw',change={}){
 const at=f.at(),source={schema:QL494_ADAPTER_SCHEMA,
  receiptId:'first_src_receipt_00494',sourceId:id,sourceRevision:'1'.repeat(40),
  endpointFingerprint:endpoints[id].serverCertificateSha256,
  capturedAtMs:at-1000,expiresAtMs:at+60000,
  payloadDigest:sha('one-nonsensitive-source-release'),
  requestedAction:'PRIVATE_RECEIVER_RECEIPT_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false,...(change.source??{})};
 const sourcePacket=signPacket(source,change.sourceSigner??sourceKey(id));
 const reviewBase={schema:QL494_REVIEW_SCHEMA,
  reviewId:'first_src_review_00494',receiptId:source.receiptId,sourceId:id,
  sourcePacketDigest:sha(sourcePacket),masterAuditDigest:auditDigest,
  masterJournalHead:journalHead,
  requestedAction:'REVIEW_ONE_FIRST_SOURCE_RECEIPT_NO_SEND',
  role:'owner',actorId:'owner_actor_00494',issuedAtMs:at-50,
  expiresAtMs:at+60000,customerDataIncluded:false,authorityTransfer:false};
 const ownerPacket=signPacket({...reviewBase,...(change.owner??{})},
  change.ownerSigner??id+'_owner');
 const reviewerPacket=signPacket({...reviewBase,role:'independent-reviewer',
  actorId:'reviewer_actor_00494',...(change.reviewer??{})},
  change.reviewerSigner??id+'_reviewer');
 const observation={state:'MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED',sourceId:id,
  bundle:{sourceId:id,adapterPacket:sourcePacket}};
 return {sourceId:id,observation,ownerPacket,reviewerPacket};
}
test('QL494 initial Master reconciliation remains private HOLD with six-source zero and no Master transport',t=>{
 const f=fixture(t);
 const report=f.rec.reconcile();
 assert.equal(report.state,'QL494_INDEPENDENT_FIRST_SOURCE_MASTER_RECONCILIATION_HELD',JSON.stringify(report));
 assert.equal(report.recordCount,0);
 assert.equal(report.masterNetworkDeliveryVerified,false);
 assert.equal(report.originalSourceRuntimeAccepted,false);
 for(const id of QL485_SOURCE_IDS)assert.equal(report.sourceClaimCounts[id],0);
 assert.equal(f.journal.summary().realSourcesCertified,0);
});
test('QL494 source claim requires signed source + independent owner and reviewer + current Master custody',t=>{
 const f=fixture(t),result=f.rec.receive(packets(f));
 assert.equal(result.state,'SIGNED_FIRST_SOURCE_RECEIVER_RECEIPT_REVIEW_HELD',JSON.stringify(result));
 assert.equal(result.oneSupervisedTlsObservationConsumed,true);
 assert.equal(result.sourceOperationallyCertified,false);
 assert.equal(result.masterDelivered,false);
 const report=f.rec.reconcile();
 assert.equal(report.recordCount,1);
 assert.equal(report.sourceClaimCounts.yw,1);
 assert.equal(report.sourceClaimCounts.icamp,0);
 assert.equal(report.masterNetworkDeliveryVerified,false);
});
test('QL494 refuses repeat source receipt and preserves append-only first write',t=>{
 const f=fixture(t),packet=packets(f);
 assert.equal(f.rec.receive(packet).state,'SIGNED_FIRST_SOURCE_RECEIVER_RECEIPT_REVIEW_HELD');
 assert.equal(f.rec.receive(packet).state,'HOLD');
 assert.equal(f.journal.summary().recordCount,1);
});
test('QL494 rejects fake transport status and cross-source receipt substitution',t=>{
 const f=fixture(t);
 for(const changed of [
  {observation:{...packets(f).observation,state:'SIMULATED_PRIVATE_NO_SEND'}},
  {observation:{...packets(f).observation,sourceId:'icamp'}},
  {observation:{state:'MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED',
   sourceId:'yw',bundle:{sourceId:'icamp',adapterPacket:packets(f).observation.bundle.adapterPacket}}}
 ]){
  const input={...packets(f),...changed};
  assert.equal(f.rec.receive(input).state,'HOLD');
 }
 assert.equal(f.journal.summary().recordCount,0);
});
test('QL494 refuses forged source signatures, wrong pinned source keys, revision and TLS fingerprint',t=>{
 const f=fixture(t);
 for(const invalid of [
  {sourceSigner:'impostor'},
  {source:{sourceRevision:'2'.repeat(40)}},
  {source:{endpointFingerprint:sha('wrong-tls-cert')}},
  {source:{sourceId:'icamp'}},
  {source:{payloadDigest:'bad'}},
  {source:{requestedAction:'AUTHORIZE_PRODUCTION_SOURCE'}},
  {source:{customerDataIncluded:true}},
  {source:{expiresAtMs:now-1}}
 ]){
  assert.equal(f.rec.receive(packets(f,'yw',invalid)).state,'HOLD',JSON.stringify(invalid));
 }
 assert.equal(f.journal.summary().recordCount,0);
});
test('QL494 rejects unsigned, mismatched, stale or same-actor independent review signatures',t=>{
 const f=fixture(t);
 for(const invalid of [
  {ownerSigner:'impostor'},
  {reviewerSigner:'impostor'},
  {owner:{issuedAtMs:now-300000}},
  {reviewer:{sourcePacketDigest:sha('wrong-source-packet')}},
  {reviewer:{masterAuditDigest:sha('wrong-audit')}},
  {reviewer:{masterJournalHead:sha('old-master-head')}},
  {owner:{customerDataIncluded:true}},
  {owner:{authorityTransfer:true}},
  {reviewer:{role:'owner'}},
  {reviewer:{actorId:'owner_actor_00494'}},
  {reviewer:{reviewId:'different_review_00494'}},
  {reviewer:{sourceId:'icamp'}}
 ]){
  assert.equal(f.rec.receive(packets(f,'yw',invalid)).state,'HOLD',JSON.stringify(invalid));
 }
});
test('QL494 rejects source-key trust-on-first-use and unapproved revision',t=>{
 const incorrect={...approvedPins,yw:{...approvedPins.yw,
  publicKeyPem:pem('impostor')}};
 const f=fixture(t,{approvedPins:incorrect});
 assert.equal(f.rec.receive(packets(f)).state,'HOLD');
 const unapproved={...approvedPins,yw:{...approvedPins.yw,
  independentlyVerified:false}};
 const g=fixture(t,{approvedPins:unapproved});
 assert.equal(g.rec.receive(packets(g)).state,'HOLD');
 const revision={...approvedPins,yw:{...approvedPins.yw,
  approvedRevision:'2'.repeat(40)}};
 const h=fixture(t,{approvedPins:revision});
 assert.equal(h.rec.receive(packets(h)).state,'HOLD');
});
test('QL494 refuses Master audit drift or substituted QL493 private journal head',t=>{
 const f=fixture(t);
 f.updateAudit({...auditReport(),ql493Head:sha('other-master-journal')});
 assert.equal(f.rec.receive(packets(f)).state,'HOLD');
 f.updateAudit({...auditReport(),masterNetworkDeliveryVerified:true});
 assert.equal(f.rec.receive(packets(f)).state,'HOLD');
 f.updateAudit({...auditReport(),sixSourceAuditDigest:sha('new-master-audit')});
 assert.equal(f.rec.receive(packets(f)).state,'HOLD');
});
test('QL494 rejects corrupted private first-source journal on subsequent read and write',t=>{
 const f=fixture(t);
 assert.equal(f.rec.receive(packets(f)).state,'SIGNED_FIRST_SOURCE_RECEIVER_RECEIPT_REVIEW_HELD');
 const file=join(f.directory,'ql494-first-source-receiver-receipts.ndjson');
 writeFileSync(file,readFileSync(file,'utf8').replace(
  'first_src_receipt_00494','counterfeit_receipt_494'));
 assert.equal(f.journal.summary().state,'HOLD');
 assert.equal(f.rec.reconcile().state,'HOLD');
 assert.equal(f.rec.receive(packets(f)).state,'HOLD');
});
test('QL494 readiness enforces six distinct Ed25519 keys, exact source identity and safe QL488 endpoint policy',()=>{
 const out=inspectQl494AdapterReadiness({endpoints,sourcePins});
 assert.equal(out.state,'QL494_SIX_SOURCE_ADAPTER_PIN_FORMAT_READY_NOT_CONNECTED',JSON.stringify(out));
 assert.equal(out.liveConnectionsVerified,0);
 assert.equal(out.sources.yw.signerKeyIndependentlyVerified,false);
 assert.equal(inspectQl494AdapterReadiness({endpoints:{},sourcePins}).state,'HOLD');
 const duplicate={...sourcePins,icamp:{...sourcePins.icamp,
  sourcePublicKeyPem:sourcePins.yw.sourcePublicKeyPem}};
 assert.equal(inspectQl494AdapterReadiness({endpoints,sourcePins:duplicate}).state,'HOLD');
 const wrong={...sourcePins,yw:{...sourcePins.yw,sourceId:'icamp'}};
 assert.equal(inspectQl494AdapterReadiness({endpoints,sourcePins:wrong}).state,'HOLD');
 const invalid={...endpoints,yw:{...endpoints.yw,
  url:'https://attacker.example.com/other-route'}};
 assert.equal(inspectQl494AdapterReadiness({endpoints:invalid,sourcePins}).state,'HOLD');
});
test('QL494 original host CLI stays OFF on Linux and Windows CI, cannot silently network',()=>{
 const cli=fileURLToPath(new URL('./ql494-original-host-cli.mjs',import.meta.url));
 const s=JSON.parse(execFileSync(process.execPath,[cli,'--status'],{encoding:'utf8'}));
 assert.equal(s.state,'QL494_FIRST_SOURCE_RECEIVER_OFF_BY_DEFAULT');
 assert.equal(s.masterDelivery,false);
 assert.equal(s.unattendedTransport,false);
 assert.equal(s.verifiedLiveSources,0);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--witness'],{stdio:'pipe'}));
});
