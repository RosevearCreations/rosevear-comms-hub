import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,chmodSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalize} from './manifest.mjs';
import {QL501_ENDPOINT_PATH,QL501_SOURCE_SCHEMA,QL501_PROVIDER_SCHEMA,
 QL501_REVIEW_SCHEMA,verifyQl501SourcePacket,verifyQl501ProviderAck,
 reviewQl501IndependentProductionHold,createQl501ProviderReceiptAdapter,
 runQl501OneSupervisedTrial} from './ql501-source-signed-delivery-trial.mjs';
import {recordQl501PrivateTrial,inspectQl501PrivateTrialJournal}
 from './ql501-private-trial-journal.mjs';

const now=Date.now(),hex=x=>x.repeat(64);
const names=['source','provider','reviewer','impostor'];
const keys=Object.fromEntries(names.map(n=>[n,generateKeyPairSync('ed25519')]));
const pem=n=>keys[n].publicKey.export({type:'spki',format:'pem'});
const packet=(payload,n)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[n].privateKey).toString('base64url')});
const scope=hex('a'),digest=hex('b');
const approvedPins={sourcePublicKeyPem:pem('source'),
 providerPublicKeyPem:pem('provider'),
 independentReviewerPublicKeyPem:pem('reviewer')};
function fixture(opts={}){
 const source={schema:QL501_SOURCE_SCHEMA,
  trialId:'trial_ql501_test_001',sourceId:'yw',
  sourceEventId:'event_ql501_00001',tenantScopeDigest:scope,
  eventDigest:digest,eventVersion:3,
  purpose:'COMMS_DELIVERY_RECEIPT_RECONCILIATION',
  issuedAtMs:now-500,expiresAtMs:now+60000,
  requestedAction:'ONE_METADATA_ONLY_SOURCE_SIGNED_TRIAL_HOLD',
  customerDataIncluded:false,authorityTransfer:false,
  ...opts.source};
 const sourcePacket=packet(source,opts.sourceSigner??'source');
 const provider={schema:QL501_PROVIDER_SCHEMA,
  trialId:source.trialId,sourceId:source.sourceId,
  sourceEventId:source.sourceEventId,
  tenantScopeDigest:source.tenantScopeDigest,
  sourcePacketDigest:sha(sourcePacket),
  providerReceiptId:'provider_receipt_ql501_001',
  providerActorId:'master_operator_501',
  receivedAtMs:now-400,issuedAtMs:now-200,expiresAtMs:now+60000,
  decision:'HOLD_FOR_INDEPENDENT_REVIEW',
  customerDataIncluded:false,authorityTransfer:false,
  ...opts.provider};
 const providerPacket=packet(provider,opts.providerSigner??'provider');
 const review={schema:QL501_REVIEW_SCHEMA,trialId:source.trialId,
  sourceEventId:source.sourceEventId,
  sourcePacketDigest:sha(sourcePacket),providerPacketDigest:sha(providerPacket),
  reviewerActorId:'external_reviewer_501',
  issuedAtMs:now-100,expiresAtMs:now+60000,
  decision:'HOLD_PENDING_ORIGINAL_FIELD_EVIDENCE',
  productionReleaseRequested:false,
  customerDataIncluded:false,authorityTransfer:false,
  ...opts.reviewer};
 return {sourcePacket,providerPacket,reviewerPacket:packet(review,
  opts.reviewerSigner??'reviewer'),
  approvedPins:{...approvedPins,...opts.pins},approvedSourceId:'yw',
  approvedTenantScopeDigest:scope,now};
}
function sha(v){return createHash('sha256').update(canonicalize(v)).digest('hex');}

function params(f){return {sourcePacket:f.sourcePacket,
 providerPacket:f.providerPacket,approvedPins:f.approvedPins,
 approvedSourceId:f.approvedSourceId,
 approvedTenantScopeDigest:f.approvedTenantScopeDigest,now:f.now};}
test('QL501 source packet is correctly signed, tenant-bound and nonauthorizing',()=>{
 const f=fixture(),r=verifyQl501SourcePacket({sourcePacket:f.sourcePacket,
  sourcePublicKeyPem:pem('source'),approvedSourceId:'yw',
  approvedTenantScopeDigest:scope,now});
 assert.equal(r.state,'QL501_SOURCE_SIGNED_METADATA_TRIAL_REVIEW_HELD');
 assert.equal(r.sourceSignatureVerified,true);
 assert.equal(r.humanAcknowledged,false);
 assert.equal(r.customerWrites,false);
});
test('QL501 verified source, provider and independent reviewer remain production HOLD',()=>{
 const f=fixture();
 const ack=verifyQl501ProviderAck({...params(f),
  sourcePublicKeyPem:pem('source'),providerPublicKeyPem:pem('provider')});
 assert.equal(ack.state,'QL501_PROVIDER_SIGNED_ACK_REVIEW_HELD',JSON.stringify(ack));
 assert.equal(ack.verifiedNetworkTransferByThisVerifier,false);
 assert.equal(ack.humanAcknowledged,false);
 const review=reviewQl501IndependentProductionHold({...params(f),
  reviewerPacket:f.reviewerPacket});
 assert.equal(review.state,'QL501_THREE_SIGNER_MASTER_RECEIPT_REVIEW_HELD',JSON.stringify(review));
 assert.equal(review.productionReleaseAuthorized,false);
 assert.equal(review.providerAckObservedOverRealNetwork,false);
 assert.equal(review.customerWrites,false);
});
test('QL501 forged source, signer reuse, stale version, cross tenant and customer data fail closed',()=>{
 for(const opt of [
  {sourceSigner:'impostor'},
  {source:{tenantScopeDigest:hex('c')}},
  {source:{sourceId:'rosiedazzlers'}},
  {source:{issuedAtMs:now-400000}},
  {source:{expiresAtMs:now-10}},
  {source:{eventVersion:0}},
  {source:{customerDataIncluded:true}},
  {source:{authorityTransfer:true}},
  {source:{requestedAction:'SEND_CUSTOMER_MESSAGE'}},
  {providerSigner:'impostor'},
  {provider:{tenantScopeDigest:hex('d')}},
  {provider:{sourcePacketDigest:hex('e')}},
  {provider:{receivedAtMs:now+500}},
  {provider:{decision:'ACCEPT_PRODUCTION'}},
  {provider:{customerDataIncluded:true}},
  {provider:{authorityTransfer:true}},
  {reviewerSigner:'impostor'},
  {reviewer:{productionReleaseRequested:true}},
  {reviewer:{decision:'PRODUCTION_GREEN'}},
  {reviewer:{providerPacketDigest:hex('f')}},
  {pins:{sourcePublicKeyPem:pem('provider')}},
  {pins:{independentReviewerPublicKeyPem:pem('provider')}}
 ]){
  const f=fixture(opt);
  const result=reviewQl501IndependentProductionHold({...params(f),
   reviewerPacket:f.reviewerPacket});
  assert.equal(result.state,'HOLD',JSON.stringify(opt));
 }
});
test('QL501 rejects arbitrary extra fields in signed packets',()=>{
 const f=fixture({source:{customerEmail:'not permitted'}});
 assert.equal(verifyQl501SourcePacket({
  sourcePacket:f.sourcePacket,sourcePublicKeyPem:pem('source'),
  approvedSourceId:'yw',approvedTenantScopeDigest:scope,now}).state,'HOLD');
});
test('QL501 provider endpoint contract consumes real TLS socket evidence, never headers',async()=>{
 const f=fixture();
 const actor={reserve:async()=>({state:'DURABLY_RESERVED',
  receiptId:'receipt_master_501',providerActorId:'provider_main_501'}),
  commit:async()=>({state:'DURABLY_COMMITTED',journalHead:hex('c')})};
 const adapter=createQl501ProviderReceiptAdapter({
  approvedSourceId:'yw',approvedTenantScopeDigest:scope,
  sourcePublicKeyPem:pem('source'),providerPublicKeyPem:pem('provider'),
  clientCertificateSha256:hex('d'),privateLedger:actor,
  signProviderAck:async payload=>packet(payload,'provider'),now:()=>now});
 const socket={encrypted:true,authorized:true,
  getProtocol:()=> 'TLSv1.3',
  getPeerCertificate:()=>({fingerprint256:hex('d')})};
 const request={method:'POST',url:QL501_ENDPOINT_PATH,
  headers:{'content-type':'application/json'},socket};
 const good=await adapter.handle({request,sourcePacket:f.sourcePacket});
 assert.equal(good.state,'QL501_PRIVATE_PROVIDER_SIGNED_ACK_READY_REVIEW_HELD',
  JSON.stringify(good));
 assert.equal(good.statusCode,200);
 assert.equal(good.productionReleaseAuthorized,false);
 assert.equal(good.customerWrites,false);
 const ack=verifyQl501ProviderAck({...params(f),providerPacket:good.providerPacket,
  sourcePublicKeyPem:pem('source'),providerPublicKeyPem:pem('provider')});
 assert.equal(ack.state,'QL501_PROVIDER_SIGNED_ACK_REVIEW_HELD',JSON.stringify(ack));
 assert.equal((await adapter.handle({request:{...request,
   headers:{...request.headers,'x-forwarded-client-cert':'fake'}},
  sourcePacket:f.sourcePacket})).state,'HOLD');
 assert.equal((await adapter.handle({request:{...request,socket:{
  ...socket,authorized:false}},sourcePacket:f.sourcePacket})).state,'HOLD');
 const noJournal=createQl501ProviderReceiptAdapter({
  approvedSourceId:'yw',approvedTenantScopeDigest:scope,
  sourcePublicKeyPem:pem('source'),providerPublicKeyPem:pem('provider'),
  clientCertificateSha256:hex('d'),
  privateLedger:{reserve:async()=>({state:'REPLAY'})},
  signProviderAck:async p=>packet(p,'provider'),now:()=>now});
 assert.equal((await noJournal.handle({request,sourcePacket:f.sourcePacket})).state,'HOLD');
});
test('QL501 transport refuses network outside original supervised Windows authority',async()=>{
 const f=fixture();
 const r=await runQl501OneSupervisedTrial({sourcePacket:f.sourcePacket,
  approvedPins,approvedSourceId:'yw',approvedTenantScopeDigest:scope});
 assert.equal(r.state,'HOLD');
 assert.equal(r.automaticNetworkSend,false);
 assert.equal(r.productionReleaseAuthorized,false);
});
function temp(t){
 const directory=mkdtempSync(join(tmpdir(),'ql501-receipt-'));
 chmodSync(directory,0o700);
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 return directory;
}
test('QL501 private ledger records reservation then ACK with no duplicate send',t=>{
 const directory=temp(t),trialId='trial_ql501_00001',
  sourcePacketDigest=hex('a'),providerPacketDigest=hex('b');
 const reserve=recordQl501PrivateTrial({directory,phase:'RESERVED',
  trialId,sourcePacketDigest,now});
 assert.equal(reserve.state,'QL501_TRIAL_JOURNAL_RESERVED_DURABLE_HELD',JSON.stringify(reserve));
 assert.equal(recordQl501PrivateTrial({directory,phase:'RESERVED',
  trialId,sourcePacketDigest,now:now+1}).state,'HOLD');
 assert.equal(recordQl501PrivateTrial({directory,phase:'PROVIDER_ACK_HELD',
  trialId,sourcePacketDigest,providerPacketDigest,now:now+2}).state,
  'QL501_TRIAL_JOURNAL_PROVIDER_ACK_HELD_DURABLE_HELD');
 assert.equal(recordQl501PrivateTrial({directory,phase:'FAILED_OR_UNKNOWN',
  trialId,sourcePacketDigest,now:now+3}).state,'HOLD');
 const snapshot=inspectQl501PrivateTrialJournal({directory});
 assert.equal(snapshot.rows,2);
 assert.equal(snapshot.providerAckRecords,1);
 assert.equal(snapshot.actualProviderDeliveryCertified,false);
});
test('QL501 unknown transport outcome cannot be retried; tamper is detected',t=>{
 const directory=temp(t),trialId='trial_ql501_00002',
  sourcePacketDigest=hex('a');
 assert.equal(recordQl501PrivateTrial({directory,phase:'RESERVED',
  trialId,sourcePacketDigest,now}).state,
  'QL501_TRIAL_JOURNAL_RESERVED_DURABLE_HELD');
 assert.equal(recordQl501PrivateTrial({directory,phase:'FAILED_OR_UNKNOWN',
  trialId,sourcePacketDigest,now:now+1}).state,
  'QL501_TRIAL_JOURNAL_FAILED_OR_UNKNOWN_DURABLE_HELD');
 assert.equal(recordQl501PrivateTrial({directory,phase:'RESERVED',
  trialId,sourcePacketDigest,now:now+2}).state,'HOLD');
 const p=join(directory,'ql501-one-trial-audit.ndjson');
 const data=readFileSync(p,'utf8').replace('"sourcePacketDigest":"'+hex('a')+'"',
  '"sourcePacketDigest":"'+hex('f')+'"');
 writeFileSync(p,data,{mode:0o600});
 assert.equal(inspectQl501PrivateTrialJournal({directory}).state,'HOLD');
});
test('QL501 original-host CLI status is safe; non-original CI cannot send',()=>{
 const cli=fileURLToPath(new URL('./ql501-original-host-cli.mjs',import.meta.url));
 const text=execFileSync(process.execPath,[cli,'--status'],{encoding:'utf8'});
 const output=JSON.parse(text);
 assert.equal(output.state,'QL501_SUPERVISED_SIGNED_TRIAL_NOT_RUN');
 assert.equal(output.automaticNetworkSend,false);
 assert.equal(output.humanAcknowledged,false);
 if(process.platform!=='win32'||process.env.CI==='true'){
  assert.throws(()=>execFileSync(process.execPath,[cli,'--supervised-trial'],
   {stdio:'pipe'}));
 }
});
