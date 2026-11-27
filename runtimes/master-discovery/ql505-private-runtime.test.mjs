import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {canonicalize} from './manifest.mjs';
import {QL502_SOURCE_SCHEMA,QL502_PROVIDER_SCHEMA} from './ql502-provider-delivery-proof.mjs';
import {ql505RunOnePrivateCycle,ql505RecordException,ql505VerifyIndependentReadback}
 from './ql505-private-runtime.mjs';
import {ql505OriginalRuntimeReadiness,ql505CreateOriginalPrivateRpcGateway}
 from './ql505-private-db-gateway.mjs';

const now=Date.now(),hex=c=>c.repeat(64),keys=Object.fromEntries(
 ['owner','provider','reviewer','impostor'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pub=k=>keys[k].publicKey.export({format:'pem',type:'spki'});
const signed=(p,k)=>({payload:p,signature:sign(null,
 Buffer.from(canonicalize(p)),keys[k].privateKey).toString('base64url')});
const digest=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const config={
 approvedBrand:'icamp',approvedTenantDigest:hex('a'),currentVersion:2,
 workerEnabled:true,maxAttempts:1,
 sourcePins:[{id:'source_owner_ql505',publicKeyPem:pub('owner'),
  validFromMs:now-30000,validUntilMs:now+60000}],
 providerPins:[{id:'provider_test_ql505',publicKeyPem:pub('provider'),
  validFromMs:now-30000,validUntilMs:now+60000}]
};
function fixture(opts={}){
 const source={
  schema:QL502_SOURCE_SCHEMA,sourceEventId:'source_event_ql505_01',
  brand:'icamp',tenantDigest:hex('a'),threadDigest:hex('b'),
  messageId:'arrival_gate_ql505_01',contentDigest:hex('c'),
  messageVersion:1,purpose:'SERVICE_INSTRUCTIONS_VERSIONED',
  issuedAtMs:now-1500,expiresAtMs:now+50000,
  customerDataIncluded:false,authorityTransfer:false,...opts.source
 };
 const sourcePacket=signed(source,opts.sourceKey??'owner');
 const provider={
  schema:QL502_PROVIDER_SCHEMA,eventId:'provider_accepted_ql505_01',
  brand:source.brand,tenantDigest:source.tenantDigest,
  messageId:source.messageId,messageVersion:source.messageVersion,
  sourcePacketDigest:digest(sourcePacket),
  providerReceiptId:'provider_receipt_ql505_01',
  providerActorId:'independent_provider_ql505',
  stage:'PROVIDER_ACCEPTED',claimedAtMs:now-1200,issuedAtMs:now-900,
  expiresAtMs:now+50000,customerDataIncluded:false,authorityTransfer:false,
  ...opts.provider
 };
 return {sourcePacket,providerPackets:[signed(provider,opts.providerKey??'provider')],
  replyPacket:null};
}
const privateRuntimeAuthority={
 approvedByOriginalOwner:true,commsRuntime:'COMMS_PRIVATE_RUNTIME',
 privateGatewayEnrolled:true,allowOnlyMetadata:true
};
function scratch(){
 const dir=mkdtempSync(join(tmpdir(),'ql505-private-'));
 return {journalFile:join(dir,'ql504-private-receipts.jsonl'),
  cleanup:()=>rmSync(dir,{force:true,recursive:true})};
}
test('QL505 owner-gated private runtime rejects no approval and never writes to provider',async()=>{
 const file=scratch();
 try{
  let calls=0;
  const receiptGateway={rpc:async()=>{calls++;throw Error('must not call')}};
  const x=await ql505RunOnePrivateCycle({
   journalFile:file.journalFile,request:fixture(),config,
   receiptGateway,privateRuntimeAuthority:{approvedByOriginalOwner:false}
  });
  assert.equal(x.state,'HOLD');assert.equal(calls,0);
  assert.equal(x.customerMessageSent,false);
 }finally{file.cleanup()}
});
test('QL505 private Comms gateway records an ACCEPTED-only source/receipt atomically, no delivery/human claim',async()=>{
 const file=scratch();
 try{
  const methods=[];
  const receiptGateway={rpc:async(name,args)=>{
   methods.push(name);
   assert.equal(args.p_source_app,'icamp');
   assert.equal(args.p_tenant_digest,hex('a'));
   assert.equal(args.p_events.length,1);
   assert.equal(args.p_events[0].kind,'PROVIDER_ACCEPTED');
   return {data:{state:'DURABLE_METADATA_REVIEW_HELD',
    messageKey:args.p_message_key,version:args.p_message_version,
    evidenceReviewed:1},error:null};
  }};
  const result=await ql505RunOnePrivateCycle({
   journalFile:file.journalFile,request:fixture(),config,
   receiptGateway,privateRuntimeAuthority,now
  });
  assert.equal(result.state,'QL505_COMMS_METADATA_COMMITTED_NO_SEND',JSON.stringify(result));
  assert.equal(result.committed,true);
  assert.equal(result.providerDeliveryObserved,false);
  assert.equal(result.humanAcknowledged,false);
  assert.deepEqual(methods,['ql503_record_verified_delivery']);
 }finally{file.cleanup()}
});
test('QL505 terminal RPC outage routes one metadata-only HOLD exception to service-role-only endpoint',async()=>{
 const file=scratch();
 try{
  let exceptionCalls=0,sent=0;
  const receiptGateway={rpc:async()=>{sent++;return {data:null,error:{code:'unavailable'}}}};
  const exceptionGateway={rpc:async(name,args)=>{
   exceptionCalls++;
   assert.equal(name,'ql505_record_receipt_exception');
   assert.equal(args.p_source_app,'icamp');
   assert.equal(args.p_reason_code,'PRIVATE_RPC_UNAVAILABLE');
   assert.equal(args.p_tenant_digest,hex('a'));
   assert.match(args.p_exception_id,/^[0-9a-f]{64}$/);
   return {data:{state:'QL505_PRIVATE_EXCEPTION_DURABLE_HOLD',
    exceptionId:args.p_exception_id,reason:args.p_reason_code},
    error:null};
  }};
  const x=await ql505RunOnePrivateCycle({
   journalFile:file.journalFile,request:fixture(),config,
   receiptGateway,exceptionGateway,privateRuntimeAuthority,now
  });
  assert.equal(x.state,'QL505_DURABLE_OPERATOR_EXCEPTION_HOLD',JSON.stringify(x));
  assert.equal(exceptionCalls,1);
  assert.equal(sent,1);
  assert.equal(x.realProviderDeliveryObserved,false);
  assert.equal(x.customerMessageSent,false);
  // No second outgoing provider/campaign retry is implied.
 }finally{file.cleanup()}
});
test('QL505 rejected tenant, forged source, and unknown digest cannot route arbitrary exceptions',async()=>{
 const gateway={rpc:async()=>{throw Error('unreachable')}};
 const checks=[
  {request:fixture({source:{tenantDigest:hex('f')}}),jobDigest:hex('e')},
  {request:fixture({sourceKey:'impostor'}),jobDigest:hex('e')},
  {request:fixture(),jobDigest:hex('e')},
  {request:fixture(),jobDigest:hex('f'),reason:'UNSUPPORTED_CODE'}
 ];
 for(const item of checks){
  const x=await ql505RecordException({
   ...item,config,reason:item.reason??'BOUNDED_SERVER_RPC_FAILURE',
   exceptionGateway:gateway,now
  });
  assert.equal(x.state,'HOLD',JSON.stringify(item).slice(0,400));
 }
});
test('QL505 independent reviewer signature is distinct from source/provider and scope-bound',()=>{
 const payload={
  schema:'rosevear.comms.ql505.independent-receipt-readback.v1',
  brand:'icamp',tenantDigest:hex('a'),jobDigest:hex('b'),
  receiptDigest:hex('c'),reviewerId:'independent_reviewer_ql505',
  recordCount:1,issuedAtMs:now-100,expiresAtMs:now+40000,
  origin:'INDEPENDENT_COMMS_FIELD_REVIEW',
  customerDataIncluded:false,authorityTransfer:false
 };
 const packet=signed(payload,'reviewer');
 const baseline={packet,reviewerPublicKeyPem:pub('reviewer'),
  sourcePublicKeyPem:pub('owner'),providerPublicKeyPem:pub('provider'),
  expectedBrand:'icamp',expectedTenantDigest:hex('a'),
  expectedJobDigest:hex('b'),expectedReceiptDigest:hex('c'),now};
 const good=ql505VerifyIndependentReadback(baseline);
 assert.equal(good.state,'QL505_INDEPENDENT_SIGNED_READBACK_CLAIM_REVIEW_HELD');
 assert.equal(good.reviewerSignatureVerified,true);
 assert.equal(good.originalHostPhysicallyWitnessed,false);
 assert.equal(good.realProviderDeliveryIndependentlyObserved,false);
 for(const changed of [
  {expectedTenantDigest:hex('f')},
  {reviewerPublicKeyPem:pub('owner')},
  {expectedJobDigest:hex('f')},
  {packet:signed({...payload,recordCount:101},'reviewer')},
  {packet:signed({...payload,customerDataIncluded:true},'reviewer')},
  {packet:signed({...payload,issuedAtMs:now-700000},'reviewer')},
  {packet:signed({...payload,origin:'SYNTHETIC'},'reviewer')},
  {packet:signed(payload,'impostor')}
 ]){
  assert.equal(ql505VerifyIndependentReadback({...baseline,...changed}).state,
   'HOLD',Object.keys(changed).join(','));
 }
});
test('QL505 original-device gateway remains unavailable on nonoriginal CI and cannot leak keys',()=>{
 const status=ql505OriginalRuntimeReadiness();
 assert.equal(status.receiverStarted,false);
 assert.equal(status.customerMessageSent,false);
 const c=ql505CreateOriginalPrivateRpcGateway({
  serviceKey:'sb_secret_fake_test_only_a_safe_client_never_connects'
 });
 assert.equal(c.state,'HOLD'); // Linux and GitHub Windows CI are not Ree's original host
 assert.equal(c.customerMessageSent,false);
});
