import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {canonicalize} from './manifest.mjs';
import {QL502_SOURCE_SCHEMA,QL502_PROVIDER_SCHEMA,QL502_REPLY_SCHEMA}
 from './ql502-provider-delivery-proof.mjs';
import {buildQl503VerifiedImport,persistQl503VerifiedImport}
 from './ql503-durable-verified-import.mjs';

const now=Date.now(),hex=x=>x.repeat(64);
const keys=Object.fromEntries(['source','provider','impostor']
 .map(id=>[id,generateKeyPairSync('ed25519')]));
const pem=id=>keys[id].publicKey.export({type:'spki',format:'pem'});
const signed=(payload,id)=>({payload,signature:sign(null,
 Buffer.from(canonicalize(payload)),keys[id].privateKey).toString('base64url')});
const digest=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
function fixture({sourceChanges={},providerChanges={},replyChanges={},
 sourceSigner='source',providerSigner='provider',
 withProvider=true,withDelivery=true,withReply=false,configured=true}={}){
 const source={schema:QL502_SOURCE_SCHEMA,sourceEventId:'source_event_ql503_001',
  brand:'icamp',tenantDigest:hex('a'),threadDigest:hex('b'),
  messageId:'gate_notice_ql503_001',contentDigest:hex('c'),messageVersion:1,
  purpose:'SERVICE_INSTRUCTIONS_VERSIONED',
  issuedAtMs:now-1500,expiresAtMs:now+60000,
  customerDataIncluded:false,authorityTransfer:false,...sourceChanges};
 const sourcePacket=signed(source,sourceSigner);
 const p=stage=>({schema:QL502_PROVIDER_SCHEMA,
  eventId:stage==='PROVIDER_ACCEPTED'?'provider_accepted_ql503':'provider_delivered_ql503',
  brand:source.brand,tenantDigest:source.tenantDigest,
  messageId:source.messageId,messageVersion:source.messageVersion,
  sourcePacketDigest:digest(sourcePacket),
  providerReceiptId:stage==='PROVIDER_ACCEPTED'?
   'receipt_ql503_accepted_001':'receipt_ql503_delivered_001',
  providerActorId:'original_provider_ql503',stage,
  claimedAtMs:stage==='PROVIDER_ACCEPTED'?now-1200:now-900,
  issuedAtMs:stage==='PROVIDER_ACCEPTED'?now-1100:now-800,
  expiresAtMs:now+60000,customerDataIncluded:false,
  authorityTransfer:false,...providerChanges});
 const providerPackets=[];
 if(withProvider)providerPackets.push(signed(p('PROVIDER_ACCEPTED'),providerSigner));
 if(withProvider&&withDelivery)providerPackets.push(signed(p('PROVIDER_DELIVERED'),providerSigner));
 const reply={schema:QL502_REPLY_SCHEMA,eventId:'reply_to_old_gate_ql503',
  brand:source.brand,tenantDigest:source.tenantDigest,
  threadDigest:source.threadDigest,messageId:source.messageId,
  replyToVersion:1,currentVersion:2,sourceEventId:source.sourceEventId,
  issuedAtMs:now-250,expiresAtMs:now+60000,
  requestedAction:'REPLY_TO_SUPERSEDED_VERSION_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false,...replyChanges};
 return {sourcePacket,providerPackets,
  replyPacket:withReply?signed(reply,'source'):null,
  serverConfig:{approvedBrand:'icamp',approvedTenantDigest:hex('a'),
   sourcePublicKeyPem:pem('source'),providerPublicKeyPem:pem('provider'),
   currentVersion:2,importEnabled:configured},
  now};
}
test('QL503 original signed version and independently signed acceptance/delivery become exact metadata-only RPC parameters',()=>{
 const x=buildQl503VerifiedImport(fixture());
 assert.equal(x.state,'QL503_VERIFIED_IMPORT_PREPARED_REVIEW_HELD',JSON.stringify(x));
 assert.equal(x.args.p_source_app,'icamp');
 assert.equal(x.args.p_message_version,1);
 assert.equal(x.args.p_events.length,2);
 assert.deepEqual(x.args.p_events.map(e=>e.kind),['PROVIDER_ACCEPTED','PROVIDER_DELIVERED']);
 assert.equal(x.args.p_events[0].signer,'INDEPENDENT_PROVIDER');
 assert.equal(x.providerDeliveredClaimVerified,true);
 assert.equal(x.humanAcknowledged,false);
 assert.equal(x.networkMessageSent,false);
});
test('QL503 saved intent and provider accepted do not pretend to have been delivered',()=>{
 for(const f of [
  fixture({withProvider:false}),fixture({withDelivery:false})
 ]){
  const x=buildQl503VerifiedImport(f);
  assert.equal(x.state,'QL503_VERIFIED_IMPORT_PREPARED_REVIEW_HELD',JSON.stringify(x));
  assert.equal(x.providerDeliveredClaimVerified,false);
  assert.equal(x.humanAcknowledged,false);
 }
});
test('QL503 outdated reply keeps original thread/version, requires original source signature and no automatic send',()=>{
 const x=buildQl503VerifiedImport(fixture({withReply:true}));
 assert.equal(x.state,'QL503_VERIFIED_IMPORT_PREPARED_REVIEW_HELD',JSON.stringify(x));
 assert.equal(x.args.p_events[2].kind,'INBOUND_REPLY');
 assert.equal(x.args.p_events[2].currentVersion,2);
 assert.equal(x.args.p_events[2].receipt,null);
 assert.equal(x.args.p_events[2].signer,'ORIGINAL_SOURCE');
 assert.equal(x.replyNeedsReview,true);
 assert.equal(x.networkMessageSent,false);
});
test('QL503 rejects foreign tenant, forged signer, expired intent, spoofed payload, wrong provider receipt and missing approval',()=>{
 const invalid=[
  {sourceSigner:'impostor'},
  {providerSigner:'impostor'},
  {sourceChanges:{tenantDigest:hex('f')}},
  {sourceChanges:{brand:'yw'}},
  {sourceChanges:{messageVersion:3}},
  {sourceChanges:{contentDigest:hex('f'),customerDataIncluded:true}},
  {sourceChanges:{issuedAtMs:now-500000}},
  {providerChanges:{sourcePacketDigest:hex('f')}},
  {providerChanges:{customerDataIncluded:true}},
  {replyChanges:{tenantDigest:hex('f')},withReply:true},
  {configured:false}
 ];
 for(const change of invalid){
  const x=buildQl503VerifiedImport(fixture(change));
  assert.equal(x.state,'HOLD',JSON.stringify(change));
 }
});
test('QL503 server-only RPC is opt-in, binds exact key and never exposes customer sending',async()=>{
 const f=fixture();
 let count=0,seen=null;
 const rpcGateway={async rpc(name,args){
  count++;seen={name,args};
  return {data:{state:'DURABLE_METADATA_REVIEW_HELD',messageKey:args.p_message_key,
   version:args.p_message_version,evidenceReviewed:args.p_events.length},error:null};
 }};
 assert.equal((await persistQl503VerifiedImport({...f})).state,'HOLD');
 assert.equal(count,0);
 const result=await persistQl503VerifiedImport({...f,rpcGateway});
 assert.equal(result.state,'QL503_DURABLE_SIGNED_METADATA_REVIEW_HELD',JSON.stringify(result));
 assert.equal(count,1);
 assert.equal(seen.name,'ql503_record_verified_delivery');
 assert.equal(result.customerMessageSent,false);
 assert.equal(result.actualProviderNetworkWitnessVerified,false);
 assert.equal(result.humanAcknowledged,false);
 assert.equal(result.durableWrite,true);
});
test('QL503 refuses false database success, error, mismatched version, and altered signer without writing',async()=>{
 const f=fixture();
 for(const data of [
  {state:'DURABLE_METADATA_REVIEW_HELD',messageKey:'other_key',version:1},
  {state:'HOLD',messageKey:f.sourcePacket.payload.messageId,version:1},
  {state:'DURABLE_METADATA_REVIEW_HELD',messageKey:f.sourcePacket.payload.messageId,version:3}
 ]){
  const x=await persistQl503VerifiedImport({...f,rpcGateway:{rpc:async()=>({data,error:null})}});
  assert.equal(x.state,'HOLD',JSON.stringify(data));
 }
 const gateway={rpc:async()=>{throw Error('offline')}};
 assert.equal((await persistQl503VerifiedImport({...f,rpcGateway:gateway})).state,'HOLD');
});
test('QL503 production migration has three forced-RLS tables, no browser writes, no seeded grants and invoker-only RPC',()=>{
 const file=new URL('../../supabase/migrations/20261127124701_ql503_authenticated_scoped_delivery_ledger.sql',import.meta.url);
 const sql=readFileSync(file,'utf8');
 for(const table of ['tenant_read_grants','delivery_messages','delivery_evidence']){
  assert.ok(sql.includes('ALTER TABLE public.ql503_'+table+' FORCE ROW LEVEL SECURITY'));
 }
 assert.match(sql,/TO authenticated/);
 assert.match(sql,/REVOKE ALL ON public\.ql503_tenant_read_grants/);
 assert.match(sql,/SECURITY INVOKER/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.ql503_record_verified_delivery/);
 assert.doesNotMatch(sql,/INSERT INTO public\.ql503_tenant_read_grants[\s\S]*VALUES\s*\(/i);
 assert.doesNotMatch(sql,/GRANT (?:INSERT|UPDATE|DELETE|ALL) ON public\.ql503_delivery_messages TO authenticated/i);
});
