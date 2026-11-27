import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {canonicalize} from './manifest.mjs';
import {QL502_SOURCE_SCHEMA,QL502_PROVIDER_SCHEMA,QL502_REPLY_SCHEMA}
 from './ql502-provider-delivery-proof.mjs';
import {ql504Enqueue,ql504DrainOnce,ql504ReadOfflineStatus}
 from './ql504-private-receipt-worker.mjs';
const now=Date.now(), hex=c=>c.repeat(64);
const keys=Object.fromEntries(['source','provider','newSource','newProvider','impostor']
 .map(id=>[id,generateKeyPairSync('ed25519')]));
const pub=id=>keys[id].publicKey.export({type:'spki',format:'pem'});
const signPacket=(payload,id)=>({payload,
 signature:sign(null,Buffer.from(canonicalize(payload)),
 keys[id].privateKey).toString('base64url')});
const digest=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const pin=(id,from=now-60000,to=now+60000)=>({id:'pin_'+id+'_ql504',publicKeyPem:pub(id),
 validFromMs:from,validUntilMs:to});
function sample({sourceSigner='source',providerSigner='provider',brand='icamp',
 tenant=hex('a'),content=hex('c'),withProvider=true,withDelivery=true,
 withReply=false,sourceVersion=1}={}){
 const source={
  schema:QL502_SOURCE_SCHEMA,sourceEventId:'source_event_ql504_001',
  brand,tenantDigest:tenant,threadDigest:hex('b'),
  messageId:'gate_ql504_001',contentDigest:content,messageVersion:sourceVersion,
  purpose:'SERVICE_INSTRUCTIONS_VERSIONED',
  issuedAtMs:now-2000,expiresAtMs:now+65000,
  customerDataIncluded:false,authorityTransfer:false
 };
 const sourcePacket=signPacket(source,sourceSigner);
 const stage=(kind,i)=>({
  schema:QL502_PROVIDER_SCHEMA,eventId:'provider_event_ql504_'+i,
  brand,tenantDigest:tenant,messageId:source.messageId,messageVersion:sourceVersion,
  sourcePacketDigest:digest(sourcePacket),
  providerReceiptId:'receipt_ql504_'+i,providerActorId:'independent_provider_ql504',
  stage:kind,claimedAtMs:now-1500+i*150,issuedAtMs:now-1350+i*150,
  expiresAtMs:now+65000,customerDataIncluded:false,authorityTransfer:false});
 const providerPackets=[];
 if(withProvider)providerPackets.push(signPacket(stage('PROVIDER_ACCEPTED',1),providerSigner));
 if(withProvider&&withDelivery)providerPackets.push(signPacket(stage('PROVIDER_DELIVERED',2),providerSigner));
 const reply={schema:QL502_REPLY_SCHEMA,eventId:'reply_event_ql504_001',
  brand,tenantDigest:tenant,threadDigest:source.threadDigest,
  messageId:source.messageId,sourceEventId:source.sourceEventId,
  replyToVersion:sourceVersion,currentVersion:2,
  issuedAtMs:now-200,expiresAtMs:now+65000,
  requestedAction:'REPLY_TO_SUPERSEDED_VERSION_REVIEW_ONLY',
  customerDataIncluded:false,authorityTransfer:false};
 return {sourcePacket,providerPackets,replyPacket:withReply?signPacket(reply,sourceSigner):null};
}
const config=(override={})=>({
 approvedBrand:'icamp',approvedTenantDigest:hex('a'),
 currentVersion:2,workerEnabled:true,
 sourcePins:[pin('source')],providerPins:[pin('provider')],
 maxAttempts:3,...override});
function harness(fn){
 const dir=mkdtempSync(join(tmpdir(),'ql504-safe-'));
 const file=join(dir,'private-journal.jsonl');
 const work={journalFile:file,config:config(),request:sample(),now};
 try{
  const result=fn(work);
  if(result&&typeof result.then==='function')
   return result.finally(()=>rmSync(dir,{recursive:true,force:true}));
  rmSync(dir,{recursive:true,force:true});return result;
 }catch(e){rmSync(dir,{recursive:true,force:true});throw e}
}
test('QL504 metadata-only source signed + independent provider signed durable queue, no network and replay dedupe',()=>harness(w=>{
 const q=ql504Enqueue(w);
 assert.equal(q.state,'QL504_DURABLE_QUEUED_NO_SEND',JSON.stringify(q));
 assert.equal(q.providerDeliveredClaimVerified,true);
 assert.equal(q.sends,0);
 const dup=ql504Enqueue(w);
 assert.equal(dup.state,'DUPLICATE_QUEUED_OR_RECORDED');
 const s=ql504ReadOfflineStatus(w.journalFile);
 assert.equal(s.QUEUED,1);assert.equal(s.jobCount,1);
 assert.equal(s.customerMessageSent,false);
 assert.equal(readFileSync(w.journalFile,'utf8').trimEnd().split('\n').length,1);
}));
test('QL504 private verified server RPC commits once and survives status readback',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ql504-private-'));const file=join(dir,'journal.jsonl');
 try{
  const w={journalFile:file,config:config(),request:sample(),now};
  assert.equal(ql504Enqueue(w).state,'QL504_DURABLE_QUEUED_NO_SEND');
  let calls=0;
  const gateway={async rpc(method,args){
   calls++;assert.equal(method,'ql503_record_verified_delivery');
   assert.equal(args.p_tenant_digest,hex('a'));
   assert.equal(args.p_events.length,2);
   return {data:{state:'DURABLE_METADATA_REVIEW_HELD',
    messageKey:args.p_message_key,version:args.p_message_version,
    evidenceReviewed:args.p_events.length},error:null};
  }};
  const done=await ql504DrainOnce({...w,rpcGateway:gateway});
  assert.equal(done.state,'QL504_PRIVATE_RPC_COMMITTED_NO_SEND',JSON.stringify(done));
  assert.equal(done.sends,0);assert.equal(done.humanAcknowledged,false);
  assert.equal(calls,1);
  assert.equal(ql504ReadOfflineStatus(file).COMMITTED,1);
  const repeat=await ql504DrainOnce({...w,rpcGateway:gateway});
  assert.equal(repeat.state,'QL504_NO_DUE_PRIVATE_WORK');assert.equal(calls,1);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('QL504 bounded replay from original immutable tenant and same packet after offline RPC outage',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ql504-retry-'));const file=join(dir,'journal.jsonl');
 try{
  const w={journalFile:file,config:config({maxAttempts:2}),request:sample(),now};
  assert.equal(ql504Enqueue(w).state,'QL504_DURABLE_QUEUED_NO_SEND');
  let calls=0;
  const bad={async rpc(){calls++;return {error:{message:'provider offline'}}}};
  const first=await ql504DrainOnce({...w,rpcGateway:bad});
  assert.equal(first.state,'QL504_BOUNDED_RETRY_HELD',JSON.stringify(first));
  assert.equal(first.attempts,1);assert.equal(first.sends,0);
  const early=await ql504DrainOnce({...w,rpcGateway:bad,now:now+500});
  assert.equal(early.state,'QL504_NO_DUE_PRIVATE_WORK');assert.equal(calls,1);
  const last=await ql504DrainOnce({...w,rpcGateway:bad,now:first.dueAt});
  assert.equal(last.state,'QL504_DEAD_LETTER_HOLD',JSON.stringify(last));
  assert.equal(last.attempts,2);assert.equal(calls,2);
  assert.equal(ql504ReadOfflineStatus(file).DEAD_LETTER,1);
  const again=await ql504DrainOnce({...w,rpcGateway:bad,now:now+5000});
  assert.equal(again.state,'QL504_NO_DUE_PRIVATE_WORK');assert.equal(calls,2);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('QL504 missing private gateway cannot drain or consume attempts',async()=>harness(async w=>{
 ql504Enqueue(w);
 const result=await ql504DrainOnce(w);
 assert.equal(result.state,'HOLD');
 assert.equal(ql504ReadOfflineStatus(w.journalFile).QUEUED,1);
}));
test('QL504 deny cross-tenant, forged source/provider, invalid signer pins, disabled worker and stale version',()=>harness(w=>{
 const scenarios=[
  {request:sample({tenant:hex('e')})},
  {request:sample({brand:'yw'})},
  {request:sample({sourceSigner:'impostor'})},
  {request:sample({providerSigner:'impostor'})},
  {request:sample({sourceVersion:3})},
  {config:config({workerEnabled:false})},
  {config:config({sourcePins:[pin('impostor')]})},
  {config:config({providerPins:[pin('source')]})},
  {config:config({providerPins:[pin('provider',now-100000,now-5000)]})}
 ];
 for(const patch of scenarios){
  const x=ql504Enqueue({...w,...patch});
  assert.equal(x.state,'HOLD',JSON.stringify(patch));
 }
 assert.equal(ql504ReadOfflineStatus(w.journalFile).jobCount,0);
}));
test('QL504 distinct simultaneously approved key rotation supports separately signed source and provider versions',()=>harness(w=>{
 const rotated=config({sourcePins:[pin('source'),pin('newSource')],
  providerPins:[pin('provider'),pin('newProvider')]});
 const result=ql504Enqueue({...w,config:rotated,
  request:sample({sourceSigner:'newSource',providerSigner:'newProvider'})});
 assert.equal(result.state,'QL504_DURABLE_QUEUED_NO_SEND',JSON.stringify(result));
 const reused=ql504Enqueue({...w,config:rotated,
  request:sample({sourceSigner:'source',providerSigner:'provider'})});
 assert.equal(reused.state,'HOLD'); // same immutable message/version, different signed source digest
}));
test('QL504 expired historical signer pin is not trusted, while newly approved signer remains usable',()=>harness(w=>{
 const rotated=config({sourcePins:[pin('source',now-85000,now-25000),pin('newSource')],
  providerPins:[pin('provider',now-85000,now-25000),pin('newProvider')]});
 const fresh=ql504Enqueue({...w,config:rotated,
  request:sample({sourceSigner:'newSource',providerSigner:'newProvider'})});
 assert.equal(fresh.state,'QL504_DURABLE_QUEUED_NO_SEND',JSON.stringify(fresh));
 const rejected=ql504Enqueue({...w,config:rotated,
  request:sample({sourceSigner:'source',providerSigner:'provider'})});
 assert.equal(rejected.state,'HOLD');
}));
test('QL504 accepted-only receipt never means delivered and conflicting message content is denied',()=>harness(w=>{
 const approved=ql504Enqueue({...w,request:sample({withDelivery:false})});
 assert.equal(approved.state,'QL504_DURABLE_QUEUED_NO_SEND');
 assert.equal(approved.providerDeliveredClaimVerified,false);
 const conflict=ql504Enqueue({...w,request:sample({content:hex('f')})});
 assert.equal(conflict.state,'HOLD');
}));
test('QL504 corruption and conflicting private journal lock fail closed, never break a lock',()=>harness(w=>{
 ql504Enqueue(w);
 const lock=w.journalFile+'.ql504-lock';
 writeFileSync(lock,'someone else holds original private process lock');
 try{assert.equal(ql504Enqueue(w).state,'HOLD')}
 finally{rmSync(lock,{force:true})}
 const raw=readFileSync(w.journalFile,'utf8');
 writeFileSync(w.journalFile,raw.replace('QUEUED','COMMITTED'));
 assert.equal(ql504ReadOfflineStatus(w.journalFile).state,'HOLD');
 assert.equal(ql504Enqueue(w).state,'HOLD');
}));
test('QL504 current original-host reader and worker do not start network listeners, auto customer sends or producer key generation',()=>{
 const file=readFileSync(new URL('./ql504-private-receipt-worker.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(file,/\b(?:fetch|createServer|listen|sendMail|sendSMS|createPrivateKey|generateKeyPair)\s*\(/);
 assert.match(file,/fsyncSync/);
 assert.match(file,/ql503_record_verified_delivery|persistQl503VerifiedImport/);
});
