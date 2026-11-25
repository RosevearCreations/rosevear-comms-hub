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
 createQl494FirstSourceJournal} from './ql494-first-source-receiver.mjs';
import {QL495_TRIAL_SCHEMA,QL495_ACK_SCHEMA,inspectQl495AttestationDrift,
 createQl495ReceiptProvenance,createQl495MasterTrialJournal,
 validateQl495MasterEndpoint,verifyQl495MasterTrialReceipt,
 trialQl495PrivateMasterDelivery}
 from './ql495-source-provenance-master-trial.mjs';

const at=1795559000000;
const sha=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const identities=QL485_SOURCE_IDS.flatMap(id=>[id+'_source',id+'_owner',id+'_reviewer']).concat(['master','impostor']);
const keys=Object.fromEntries(identities.map(id=>[id,generateKeyPairSync('ed25519')]));
const pem=id=>keys[id].publicKey.export({type:'spki',format:'pem'});
const signed=(payload,id)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[id].privateKey).toString('base64url')});
const sourcePins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 sourceId:id,sourcePublicKeyPem:pem(id+'_source'),sourceRevision:'1'.repeat(40)
}]));
const approvedPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,{
 sourceId:id,publicKeyPem:pem(id+'_source'),approvedRevision:'1'.repeat(40),
 independentlyVerified:true,sourceOwnerApproved:true
}]));
const ownerPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,pem(id+'_owner')]));
const reviewerPins=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,pem(id+'_reviewer')]));
const endpoints=Object.fromEntries(QL485_SOURCE_IDS.map((id,i)=>[id,{
 sourceId:id,url:'https://source'+i+'.private.example.com/internal/comms/source-release',
 serverCertificateSha256:sha('tls-pin-'+id),
 caPem:'-----BEGIN CERTIFICATE-----FAKECA-----END CERTIFICATE-----',
 clientCertificatePem:'-----BEGIN CERTIFICATE-----FAKECLIENT-----END CERTIFICATE-----',
 clientKeyPem:'-----BEGIN PRIVATE KEY-----FAKECLIENTKEY-----END PRIVATE KEY-----'
}]));
const auditDigest=sha('genuine-private-six-source-audit-hash'),masterHead=sha('master-head');
const master=()=>({
 state:'QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD',
 sixSourceAuditDigest:auditDigest,ql493Head:masterHead,
 masterNetworkDeliveryVerified:false,realSourcesVerified:0,
 sourceAuthorized:false,customerWrites:false
});
function fixture(t,withReceipt=true,options={}){
 const directory=mkdtempSync(join(tmpdir(),'ql495-private-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 let now=at,report=master();
 const journal=createQl494FirstSourceJournal({directory,now:()=>now});
 const data={sourceId:'yw',receiptId:'receipt_ql495_0001',
  reviewId:'review_ql495_0001'};
 const source={schema:QL494_ADAPTER_SCHEMA,receiptId:data.receiptId,
  sourceId:data.sourceId,sourceRevision:'1'.repeat(40),
  endpointFingerprint:endpoints.yw.serverCertificateSha256,
  capturedAtMs:at-1000,expiresAtMs:at+200000,
  payloadDigest:sha('signed-original-source-observation'),
  requestedAction:'PRIVATE_RECEIVER_RECEIPT_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 const sourcePacket=signed(source,'yw_source');
 const basic={schema:QL494_REVIEW_SCHEMA,reviewId:data.reviewId,
  receiptId:data.receiptId,sourceId:'yw',
  sourcePacketDigest:sha(sourcePacket),masterAuditDigest:auditDigest,
  masterJournalHead:masterHead,
  requestedAction:'REVIEW_ONE_FIRST_SOURCE_RECEIPT_NO_SEND',
  role:'owner',actorId:'owner_actor_ql495',
  issuedAtMs:at-50,expiresAtMs:at+200000,
  customerDataIncluded:false,authorityTransfer:false};
 const ownerPacket=signed(basic,'yw_owner');
 const reviewerPacket=signed({...basic,role:'independent-reviewer',
  actorId:'reviewer_actor_ql495'},'yw_reviewer');
 let record=null;
 if(withReceipt){
  const saved=journal.append({reviewId:data.reviewId,receiptId:data.receiptId,
   sourceId:'yw',sourceRevision:source.sourceRevision,
   endpointFingerprint:source.endpointFingerprint,
   payloadDigest:source.payloadDigest,sourcePacketDigest:sha(sourcePacket),
   ownerPacketDigest:sha(ownerPacket),reviewerPacketDigest:sha(reviewerPacket),
   masterAuditDigest:auditDigest,masterJournalHead:masterHead});
  assert.equal(saved.state,'DURABLE_PRIVATE_FIRST_SOURCE_RECEIPT_FOR_REVIEW_HELD',
   JSON.stringify(saved));record=saved.receiptRecordDigest;
 }
 const pins={sourcePins:options.sourcePins??sourcePins,
  approvedPins:options.approvedPins??approvedPins,endpoints:options.endpoints??endpoints,
  ownerPins:options.ownerPins??ownerPins,reviewerPins:options.reviewerPins??reviewerPins};
 const provenance=createQl495ReceiptProvenance({
  directory,ql494Journal:journal,readMasterAudit:()=>report,
  ...pins,now:()=>now});
 return {directory,journal,provenance,pins,data,record,sourcePacket,
  ownerPacket,reviewerPacket,now:()=>now,setNow:x=>{now=x},
  setMaster:x=>{report=x},args:()=>({...data,sourcePacket,ownerPacket,reviewerPacket})};
}
test('QL495 initial empty first-source journal does not imply live certified sources',t=>{
 const f=fixture(t,false);
 const r=f.provenance.reconciliation();
 assert.equal(r.state,'QL495_INDEPENDENT_SOURCE_PROVENANCE_DRIFT_READBACK_HELD',JSON.stringify(r));
 assert.equal(r.recordCount,0);
 assert.equal(r.operationallyVerifiedSources,0);
 assert.equal(r.masterNetworkDeliveryVerified,false);
 assert.equal(f.provenance.review(f.args()).state,'HOLD');
});
test('QL495 independently revalidates source signature and two historical reviewer signatures',t=>{
 const f=fixture(t),r=f.provenance.review(f.args());
 assert.equal(r.state,'QL495_HISTORICAL_SOURCE_RECEIPT_PROVENANCE_RECHECKED_HELD',JSON.stringify(r));
 assert.equal(r.sourceRecordDigest,f.record);
 assert.equal(r.sourceSignatureHistoricallyVerified,true);
 assert.equal(r.trialEligibleWhileSourcePacketFresh,true);
 assert.equal(r.originalHardwareProvenanceVerified,false);
 assert.equal(r.masterNetworkDeliveryVerified,false);
 assert.equal(f.provenance.reconciliation().recordCount,1);
});
test('QL495 historical signature remains provable after expiry, but fresh Master trial is blocked',t=>{
 const f=fixture(t);f.setNow(at+450000);
 const r=f.provenance.review(f.args());
 assert.equal(r.state,'QL495_HISTORICAL_SOURCE_RECEIPT_PROVENANCE_RECHECKED_HELD');
 assert.equal(r.trialEligibleWhileSourcePacketFresh,false);
 assert.equal(r.sourceOperationallyCertified,false);
});
test('QL495 denies forged historical packets, substituted review, tampered source data and wrong receipt',t=>{
 const f=fixture(t);
 for(const bad of [
  {...f.args(),sourcePacket:{...f.sourcePacket,signature:'A'.repeat(86)}},
  {...f.args(),ownerPacket:{...f.ownerPacket,signature:'A'.repeat(86)}},
  {...f.args(),reviewerPacket:{...f.reviewerPacket,signature:'A'.repeat(86)}},
  {...f.args(),sourceId:'icamp'},
  {...f.args(),receiptId:'receipt_wrong_0095'},
  {...f.args(),sourcePacket:signed({...f.sourcePacket.payload,
   endpointFingerprint:sha('substituted-tls-pin')},'yw_source')}
 ])assert.equal(f.provenance.review(bad).state,'HOLD',JSON.stringify(bad));
 assert.equal(f.journal.summary().recordCount,1);
});
test('QL495 rejects QL486 signer key and approved revision drift',t=>{
 const changes=[
  {approvedPins:{...approvedPins,yw:{...approvedPins.yw,
   publicKeyPem:pem('impostor')}}},
  {approvedPins:{...approvedPins,yw:{...approvedPins.yw,
   approvedRevision:'2'.repeat(40)}}},
  {approvedPins:{...approvedPins,yw:{...approvedPins.yw,
   independentlyVerified:false}}},
  {endpoints:{...endpoints,yw:{...endpoints.yw,
   serverCertificateSha256:sha('new-tls-endpoint')}}},
  {ownerPins:{...ownerPins,yw:pem('impostor')}}
 ];
 for(const opts of changes){
  const f=fixture(t,true,opts);
  assert.equal(f.provenance.review(f.args()).state,'HOLD');
  assert.equal(f.provenance.reconciliation().state,'HOLD');
 }
});
test('QL495 denies changed QL493 master audit digest and journal head',t=>{
 const f=fixture(t);
 f.setMaster({...master(),ql493Head:sha('changed-ql493-journal')});
 assert.equal(f.provenance.review(f.args()).state,'HOLD');
 assert.equal(f.provenance.reconciliation().state,'HOLD');
 f.setMaster({...master(),sixSourceAuditDigest:sha('changed-master-audit')});
 assert.equal(f.provenance.review(f.args()).state,'HOLD');
});
test('QL495 corrupted old QL494 journal fails closed on independent provenance read',t=>{
 const f=fixture(t),path=join(f.directory,'ql494-first-source-receiver-receipts.ndjson');
 writeFileSync(path,readFileSync(path,'utf8').replace(
  'receipt_ql495_0001','substituted_receipt_495'));
 assert.equal(f.provenance.review(f.args()).state,'HOLD');
 assert.equal(f.provenance.reconciliation().state,'HOLD');
});
test('QL495 drift preflight rejects missing source configs, reused signer and cross-source revision',()=>{
 assert.equal(inspectQl495AttestationDrift().state,'HOLD');
 const p=inspectQl495AttestationDrift({sourcePins,approvedPins,endpoints,ownerPins,reviewerPins});
 assert.equal(p.state,'QL495_SIX_SOURCE_ATTESTATION_PINS_STABLE_NOT_CONNECTED');
 assert.equal(p.actualConnectionsVerified,0);
 const reused={...ownerPins,yw:pem('yw_source')};
 assert.equal(inspectQl495AttestationDrift({
  sourcePins,approvedPins,endpoints,ownerPins:reused,reviewerPins}).state,'HOLD');
 const changed={...sourcePins,yw:{...sourcePins.yw,sourceRevision:'2'.repeat(40)}};
 assert.equal(inspectQl495AttestationDrift({
  sourcePins:changed,approvedPins,endpoints,ownerPins,reviewerPins}).state,'HOLD');
});
test('QL495 signed Master trial receipt must match request exactly and remain review-only',()=>{
 const request={schema:QL495_TRIAL_SCHEMA,trialId:'trial_ql495_0001',
  sourceId:'yw',receiptId:'receipt_ql495_0001',
  recordDigest:sha('record'),masterAuditDigest:auditDigest,
  masterJournalHead:masterHead,provenanceDigest:sha('provenance'),
  sentAtMs:at,requestedAction:'ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 const base={schema:QL495_ACK_SCHEMA,trialId:request.trialId,
  sourceId:'yw',receiptId:request.receiptId,recordDigest:request.recordDigest,
  trialDigest:sha(request),masterAuditDigest:auditDigest,
  masterJournalHead:masterHead,decision:'HOLD_FOR_INDEPENDENT_REVIEW',
  masterActorId:'master_actor_ql495',issuedAtMs:at-50,expiresAtMs:at+60000,
  customerDataIncluded:false,authorityTransfer:false};
 const ack=signed(base,'master');
 const passed=verifyQl495MasterTrialReceipt({requestPayload:request,
  responsePacket:ack,masterPublicKeyPem:pem('master'),now:at});
 assert.equal(passed.state,'QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD',JSON.stringify(passed));
 assert.equal(passed.masterProductionAccepted,false);
 for(const bad of [
  {packet:signed(base,'impostor')},
  {packet:signed({...base,decision:'ACCEPT_PRODUCTION'},'master')},
  {packet:signed({...base,trialDigest:sha('other')},'master')},
  {packet:signed({...base,sourceId:'icamp'},'master')},
  {packet:signed({...base,customerDataIncluded:true},'master')},
  {packet:signed({...base,authorityTransfer:true},'master')},
  {packet:signed({...base,issuedAtMs:at-400000},'master')},
  {packet:signed({...base,expiresAtMs:at-1},'master')}
 ])assert.equal(verifyQl495MasterTrialReceipt({requestPayload:request,
  responsePacket:bad.packet,masterPublicKeyPem:pem('master'),now:at}).state,'HOLD');
});
test('QL495 private Master trial never invokes HTTPS with absent/placeholder certificate material',async()=>{
 const entry={url:'https://master.private.example.com/internal/comms/master-delivery-trial',
  serverCertificateSha256:sha('master-tls-pin'),
  caPem:'-----BEGIN CERTIFICATE-----FAKE----END CERTIFICATE-----',
  clientCertificatePem:'-----BEGIN CERTIFICATE-----FAKE----END CERTIFICATE-----',
  clientKeyPem:'-----BEGIN PRIVATE KEY-----FAKE----END PRIVATE KEY-----'};
 assert.equal(validateQl495MasterEndpoint(entry,{at}).state,'HOLD');
 const r=await trialQl495PrivateMasterDelivery({endpoint:entry,
  requestPayload:{},masterPublicKeyPem:pem('master'),now:()=>at});
 assert.equal(r.state,'HOLD');
});
test('QL495 private signed trial journal detects replay, corrupted lines and remains nonauthorizing',t=>{
 const f=fixture(t);
 const j=createQl495MasterTrialJournal({directory:f.directory,now:()=>at});
 assert.equal(j.summary().trialReceipts,0);
 const requestPayload={schema:QL495_TRIAL_SCHEMA,trialId:'trial_ql495_0001',
  sourceId:'yw',receiptId:'receipt_ql495_0001',
  recordDigest:f.record,masterAuditDigest:auditDigest,
  masterJournalHead:masterHead,provenanceDigest:sha('provenance'),
  sentAtMs:at,requestedAction:'ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 const verifiedResult={state:'QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD',
  verifiedPinnedPrivateTlsTransport:true,masterNetworkDeliveryVerified:true,
  trialId:requestPayload.trialId,sourceId:'yw',
  receiptId:requestPayload.receiptId,masterPacketDigest:sha('real-signed-master-packet'),
  masterDecision:'HOLD_FOR_INDEPENDENT_REVIEW'};
 const saved=j.append({requestPayload,verifiedResult});
 assert.equal(saved.state,'QL495_DURABLE_PINNED_MASTER_TRIAL_RECEIPT_FOR_REVIEW_HELD',JSON.stringify(saved));
 assert.equal(saved.masterProductionAccepted,false);
 assert.equal(j.hasTrial('trial_ql495_0001'),true);
 assert.equal(j.append({requestPayload,verifiedResult}).state,'HOLD');
 const file=join(f.directory,'ql495-master-trial-receipts.ndjson');
 writeFileSync(file,readFileSync(file,'utf8').replace('HOLD_FOR_INDEPENDENT_REVIEW','ACCEPT_PRODUCTION'));
 assert.equal(j.summary().state,'HOLD');
 assert.equal(j.hasTrial('another_trial_495'),true);
});
test('QL495 CLI default status is off, never initiates a Master POST in CI',()=>{
 const cli=fileURLToPath(new URL('./ql495-original-host-cli.mjs',import.meta.url));
 const s=JSON.parse(execFileSync(process.execPath,[cli,'--status'],{encoding:'utf8'}));
 assert.equal(s.state,'QL495_FIRST_SOURCE_PROVENANCE_TRIAL_OFF_BY_DEFAULT');
 assert.equal(s.automaticNetworkSend,false);
 assert.equal(s.liveFirstSourcesCertified,0);
 assert.equal(s.masterProductionAcceptance,false);
 if(process.platform!=='win32'||process.env.CI==='true')
  assert.throws(()=>execFileSync(process.execPath,[cli,'--trial'],{stdio:'pipe'}));
});
