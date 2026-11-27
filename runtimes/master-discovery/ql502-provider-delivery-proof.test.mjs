import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {QL502_SOURCE_SCHEMA,QL502_PROVIDER_SCHEMA,QL502_REPLY_SCHEMA,
 reviewQl502VersionedDelivery,reviewQl502RetryPolicy}
 from './ql502-provider-delivery-proof.mjs';

const now=Date.now(),digest=x=>x.repeat(64);
const keys=Object.fromEntries(['owner','provider','impostor'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pem=k=>keys[k].publicKey.export({type:'spki',format:'pem'});
const signed=(payload,actor)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[actor].privateKey).toString('base64url')});
function fixture({sourceChanges={},providerChanges={},replyChanges={},
 ownerSigner='owner',providerSigner='provider',currentVersion=2,withReply=true,
 withDelivery=true}={}){
 const source={schema:QL502_SOURCE_SCHEMA,
  sourceEventId:'source_event_ql502_001',brand:'icamp',
  tenantDigest:digest('a'),threadDigest:digest('b'),
  messageId:'gate_notice_ql502_001',contentDigest:digest('c'),
  messageVersion:1,purpose:'SERVICE_INSTRUCTIONS_VERSIONED',
  issuedAtMs:now-1000,expiresAtMs:now+60000,
  customerDataIncluded:false,authorityTransfer:false,...sourceChanges};
 const sourcePacket=signed(source,ownerSigner);
 function provider(stage,n,changes={}){
  const payload={schema:QL502_PROVIDER_SCHEMA,
   eventId:'provider_event_ql502_'+n,brand:'icamp',
   tenantDigest:source.tenantDigest,messageId:source.messageId,
   messageVersion:source.messageVersion,
   sourcePacketDigest:createHash('sha256').update(canonicalize(sourcePacket)).digest('hex'),
   providerReceiptId:'provider_receipt_502_'+n,
   providerActorId:'master_provider_502',
   stage,claimedAtMs:now-900+n*100,issuedAtMs:now-500+n*100,
   expiresAtMs:now+60000,customerDataIncluded:false,authorityTransfer:false,
   ...changes};
  return signed(payload,providerSigner);
 }
 const providerPackets=[provider('PROVIDER_ACCEPTED',1,providerChanges)];
 if(withDelivery)providerPackets.push(provider('PROVIDER_DELIVERED',2));
 const reply={schema:QL502_REPLY_SCHEMA,
  eventId:'reply_event_ql502_001',brand:'icamp',
  tenantDigest:source.tenantDigest,threadDigest:source.threadDigest,
  messageId:source.messageId,replyToVersion:source.messageVersion,
  currentVersion,sourceEventId:source.sourceEventId,
  issuedAtMs:now-100,expiresAtMs:now+60000,
  requestedAction:'REPLY_TO_SUPERSEDED_VERSION_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false,...replyChanges};
 return {sourcePacket,providerPackets,
  replyPacket:withReply?signed(reply,ownerSigner):null,
  sourcePublicKeyPem:pem('owner'),providerPublicKeyPem:pem('provider'),
  approvedBrand:'icamp',approvedTenantDigest:digest('a'),currentVersion,now};
}

test('QL502 separate accepted and delivered provider signatures, superseded reply and no customer acknowledgment',()=>{
 const x=reviewQl502VersionedDelivery(fixture());
 assert.equal(x.state,'QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD',JSON.stringify(x));
 assert.equal(x.providerAccepted,true);
 assert.equal(x.providerDelivered,true);
 assert.equal(x.replyNeedsReview,true);
 assert.equal(x.replyToVersion,1);
 assert.equal(x.currentVersion,2);
 assert.equal(x.customerAcknowledged,false);
 assert.equal(x.actualNetworkDeliveryIndependentlyObserved,false);
 assert.equal(x.productionSendEnabled,false);
});
test('QL502 source intent alone is saved only, never delivered',()=>{
 const x=reviewQl502VersionedDelivery({...fixture({withReply:false}),providerPackets:[]});
 assert.equal(x.state,'QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD',JSON.stringify(x));
 assert.equal(x.providerDelivered,false);
 assert.equal(x.providerAccepted,false);
});
test('QL502 provider acceptance without delivery cannot be represented as delivered',()=>{
 const x=reviewQl502VersionedDelivery(fixture({withReply:false,withDelivery:false}));
 assert.equal(x.state,'QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD',JSON.stringify(x));
 assert.equal(x.providerAccepted,true);
 assert.equal(x.providerDelivered,false);
});
test('QL502 rejects forged signer, cross tenant, stale version, wrong content and tampered status',()=>{
 const cases=[
  {ownerSigner:'impostor'},{providerSigner:'impostor'},
  {sourceChanges:{tenantDigest:digest('d')}},
  {sourceChanges:{brand:'yw'}},
  {sourceChanges:{contentDigest:'not-a-digest'}},
  {sourceChanges:{messageVersion:3}},
  {sourceChanges:{customerDataIncluded:true}},
  {sourceChanges:{authorityTransfer:true}},
  {providerChanges:{tenantDigest:digest('e')}},
  {providerChanges:{messageVersion:2}},
  {providerChanges:{sourcePacketDigest:digest('f')}},
  {providerChanges:{stage:'PRODUCTION_CONFIRMED'}},
  {providerChanges:{customerDataIncluded:true}},
  {replyChanges:{tenantDigest:digest('f')}},
  {replyChanges:{threadDigest:digest('f')}},
  {replyChanges:{replyToVersion:2}},
  {replyChanges:{currentVersion:3}},
  {replyChanges:{customerDataIncluded:true}},
  {replyChanges:{requestedAction:'SEND_LIVE_REPLY'}},
  {sourceChanges:{issuedAtMs:now-600000}}
 ];
 for(const c of cases){
  const x=reviewQl502VersionedDelivery(fixture(c));
  assert.equal(x.state,'HOLD',JSON.stringify(c));
 }
});
test('QL502 denies duplicated provider receipt IDs and delivery without accepted record',()=>{
 const f=fixture();
 f.providerPackets[1]={...f.providerPackets[0]};
 assert.equal(reviewQl502VersionedDelivery(f).state,'HOLD');
 const withoutAccept=fixture();
 withoutAccept.providerPackets=withoutAccept.providerPackets.slice(1);
 assert.equal(reviewQl502VersionedDelivery(withoutAccept).state,'HOLD');
});
test('QL502 provider signature key cannot be the original source key',()=>{
 const f=fixture();f.providerPublicKeyPem=f.sourcePublicKeyPem;
 assert.equal(reviewQl502VersionedDelivery(f).state,'HOLD');
});
test('QL502 current state checks never authorize a send; cancel, optout, filled slot, dispute, outage and version drift HOLD',()=>{
 const good={brand:'icamp',approvedBrand:'icamp',
  tenantDigest:digest('a'),approvedTenantDigest:digest('a'),
  authorizedOperator:true,consent:'SERVICE_ALLOWED',
  requestedVersion:2,currentVersion:2,expiresAtMs:now+40000,
  providerHealthy:true,now};
 assert.equal(reviewQl502RetryPolicy(good).state,'PRECHECK_ONLY');
 assert.equal(reviewQl502RetryPolicy(good).canSend,false);
 for(const change of [
  {tenantDigest:digest('b')},{authorizedOperator:false},
  {requestedVersion:1},{consent:'OPTED_OUT'},
  {consent:'UNKNOWN'},{cancelled:true},{slotFilled:true},
  {disputedLine:true},{providerHealthy:false},
  {expiresAtMs:now-100},{brand:'yw'}
 ]){
  const result=reviewQl502RetryPolicy({...good,...change});
  assert.equal(result.state,'HOLD',JSON.stringify(change));
  assert.equal(result.canSend,false);
 }
});
