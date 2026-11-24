/**
 * QL-494: first private source adapter / receiver receipt custody.
 * Pure adapter validation and a private durable, fail-closed claim journal.
 * A signed source claim + mTLS observation is NOT physical provenance.
 * No background receiver, public route, Master delivery or source writes.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {mkdirSync,lstatSync,openSync,closeSync,fstatSync,readFileSync,
 writeFileSync,fsyncSync,unlinkSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';

export const QL494_ADAPTER_SCHEMA='rosevear.comms.ql494.private-source-adapter-receipt.v1';
export const QL494_REVIEW_SCHEMA='rosevear.comms.ql494.independent-first-source-review.v1';
const HEX=/^[0-9a-f]{64}$/,SHA=/^[0-9a-f]{40}$/,
 ID=/^[a-zA-Z0-9_-]{8,96}$/;
const RECEIPT=['schema','receiptId','sourceId','sourceRevision','endpointFingerprint',
 'capturedAtMs','expiresAtMs','payloadDigest','requestedAction',
 'customerDataIncluded','authorityTransfer'];
const REVIEW=['schema','reviewId','receiptId','sourceId','sourcePacketDigest',
 'masterAuditDigest','masterJournalHead','requestedAction','role','actorId',
 'issuedAtMs','expiresAtMs','customerDataIncluded','authorityTransfer'];
const ROW=['sequence','previousDigest','reviewId','receiptId','sourceId',
 'sourceRevision','endpointFingerprint','payloadDigest','sourcePacketDigest',
 'ownerPacketDigest','reviewerPacketDigest','masterAuditDigest','masterJournalHead',
 'recordedAtMs','recordDigest'];
const hash=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const ms=x=>Number.isSafeInteger(x)&&x>0;
const hold=reason=>({state:'HOLD',reason,originalHostPhysicallyVerified:false,
 firstSourceOperationallyCertified:false,masterDeliveryVerified:false,
 sourceAuthorized:false,customerWrites:false,automaticReceiver:false});
function verifySigned(packet,key,fields){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,fields)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const k=createPublicKey(key),sig=Buffer.from(packet.signature,'base64url');
  return k.asymmetricKeyType==='ed25519'&&sig.length===64&&
   sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),k,sig);
 }catch{return false}
}
function safeDir(dir){
 if(typeof dir!=='string'||!isAbsolute(dir)||dir.split(/[\\/]/).includes('..'))
  throw Error('QL494_PRIVATE_ABSOLUTE_DIR_REQUIRED');
 const p=resolve(dir);mkdirSync(p,{recursive:true,mode:0o700});
 const st=lstatSync(p);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))throw Error('QL494_PRIVATE_DIR_UNSAFE');
 return p;
}
function readRows(dir){
 const path=join(dir,'ql494-first-source-receiver-receipts.ndjson');
 let fd;
 try{
  try{const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink())
   throw Error('QL494_RECEIPT_LOG_UNSAFE')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const st=fstatSync(fd);
  if(!st.isFile()||st.size<1||st.size>2000000||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL494_LOG_PERMISSION_SIZE_DENIED');
  const raw=readFileSync(fd,'utf8');
  if(!raw.endsWith('\n'))throw Error('QL494_TRUNCATED_LOG');
  const rows=raw.trimEnd().split('\n').map(x=>JSON.parse(x));
  if(rows.length>64)throw Error('QL494_LOG_CAPACITY');
  const seen=new Set(),reviewIds=new Set();
  let previous=null,lastTime=0;
  for(const [i,r] of rows.entries()){
   if(!exact(r,ROW)||r.sequence!==i+1||r.previousDigest!==previous||
    !ID.test(r.receiptId??'')||seen.has(r.receiptId)||
    !ID.test(r.reviewId??'')||reviewIds.has(r.reviewId)||
    !QL485_SOURCE_IDS.includes(r.sourceId)||!SHA.test(r.sourceRevision??'')||
    ![r.endpointFingerprint,r.payloadDigest,r.sourcePacketDigest,
     r.ownerPacketDigest,r.reviewerPacketDigest,r.masterAuditDigest,
     r.recordDigest].every(x=>HEX.test(x??''))||
    !(r.masterJournalHead===null||HEX.test(r.masterJournalHead??''))||
    !ms(r.recordedAtMs)||r.recordedAtMs<lastTime||
    hash(Object.fromEntries(ROW.filter(x=>x!=='recordDigest')
     .map(x=>[x,r[x]])))!==r.recordDigest)
    throw Error('QL494_REPLAY_OR_HASH_CHAIN_TAMPER');
   seen.add(r.receiptId);reviewIds.add(r.reviewId);
   previous=r.recordDigest;lastTime=r.recordedAtMs;
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
export function createQl494FirstSourceJournal({directory,now=()=>Date.now()}={}){
 const dir=safeDir(directory),file=join(dir,'ql494-first-source-receiver-receipts.ndjson'),
  lock=join(dir,'.ql494-first-source-receiver-receipts.lock');
 function append(body){
  const keys=ROW.filter(x=>!['sequence','previousDigest','recordedAtMs','recordDigest'].includes(x));
  if(!exact(body,keys)||!ID.test(body.reviewId??'')||
   !ID.test(body.receiptId??'')||!QL485_SOURCE_IDS.includes(body.sourceId)||
   !SHA.test(body.sourceRevision??'')||
   ![body.endpointFingerprint,body.payloadDigest,body.sourcePacketDigest,
    body.ownerPacketDigest,body.reviewerPacketDigest,body.masterAuditDigest]
    .every(x=>HEX.test(x??''))||
   !(body.masterJournalHead===null||HEX.test(body.masterJournalHead??'')))
   return hold('QL494_EXACT_SOURCE_BOUND_RECEIPT_REQUIRED');
  let lockFd;
  try{lockFd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
    constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600)}
  catch{return hold('QL494_EXCLUSIVE_WRITER_REQUIRED')}
  try{
   const rows=readRows(dir);
   if(rows.length>=64)return hold('QL494_JOURNAL_CAPACITY');
   if(rows.some(x=>x.receiptId===body.receiptId||
     x.reviewId===body.reviewId))
    return hold('QL494_SIGNED_RECEIPT_REPLAY_DENIED');
   const base={sequence:rows.length+1,previousDigest:rows.at(-1)?.recordDigest??null,
    ...body,recordedAtMs:now()};
   const row={...base,recordDigest:hash(base)};
   const out=openSync(file,constants.O_WRONLY|constants.O_APPEND|
    (constants.O_NOFOLLOW||0)|
    (rows.length===0?constants.O_CREAT|constants.O_EXCL:0),0o600);
   try{writeFileSync(out,JSON.stringify(row)+'\n');fsyncSync(out)}
   finally{closeSync(out)}
   const after=readRows(dir);
   if(after.length!==rows.length+1||after.at(-1).recordDigest!==row.recordDigest)
    return hold('QL494_FSYNC_INDEPENDENT_READBACK_FAILED');
   return {state:'DURABLE_PRIVATE_FIRST_SOURCE_RECEIPT_FOR_REVIEW_HELD',
    receiptRecordDigest:row.recordDigest,networkSent:false,sourceAuthorized:false,
    masterDeliveryVerified:false};
  }catch{return hold('QL494_PRIVATE_JOURNAL_WRITE_OR_TAMPER_HOLD')}
  finally{closeSync(lockFd);try{unlinkSync(lock)}catch{}}
 }
 function summary(){
  try{const rows=readRows(dir);return {state:'QL494_PRIVATE_FIRST_SOURCE_RECEIPTS_HELD',
   recordCount:rows.length,latestDigest:rows.at(-1)?.recordDigest??null,
   perSource:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,
    rows.filter(r=>r.sourceId===id).length])),
   realSourcesCertified:0,masterDeliveryVerified:false,customerWrites:false}}
  catch{return hold('QL494_JOURNAL_TAMPER_HOLD')}
 }
 return Object.freeze({append,summary,automaticReceiver:false,customerWrites:false});
}
export function inspectQl494AdapterReadiness({endpoints,sourcePins}={}){
 const bad=hold('QL494_SIX_SOURCE_PINNED_ADAPTER_CONFIG_REQUIRED');
 if(!exact(endpoints,QL485_SOURCE_IDS)||
  !exact(sourcePins,QL485_SOURCE_IDS))return bad;
 const distinct=new Set(),sources={};
 for(const id of QL485_SOURCE_IDS){
  const e=endpoints[id],pin=sourcePins[id];
  if(!exact(pin,['sourceId','sourcePublicKeyPem','sourceRevision'])||
   pin.sourceId!==id||!SHA.test(pin.sourceRevision??'')||
   !exact(e,['sourceId','url','serverCertificateSha256','caPem',
    'clientCertificatePem','clientKeyPem'])||
   e.sourceId!==id||!HEX.test(e.serverCertificateSha256??''))
   return bad;
  let key;
  try{key=createPublicKey(pin.sourcePublicKeyPem)}
  catch{return bad}
  if(key.asymmetricKeyType!=='ed25519')return bad;
  const identity=key.export({type:'spki',format:'der'}).toString('hex');
  if(distinct.has(identity))return hold('QL494_SOURCE_KEY_REUSE_DENIED');
  distinct.add(identity);
  sources[id]={sourceId:id,sourceRevision:pin.sourceRevision,
   signerKeyIndependentlyVerified:false,endpointConfigurationPresent:true,
   privateMtlSHandshakeObserved:false,sourceOperationallyAccepted:false};
 }
 return {state:'QL494_SIX_SOURCE_ADAPTER_PIN_FORMAT_READY_NOT_CONNECTED',
  sourceCount:6,sources,liveConnectionsVerified:0,
  independentEnrollmentRequired:true,sourceAuthorized:false};
}
function validSource(packet,pin,endpoint,at){
 const p=packet?.payload;
 return !!pin&&!!endpoint&&verifySigned(packet,pin.sourcePublicKeyPem,RECEIPT)&&
  p.schema===QL494_ADAPTER_SCHEMA&&ID.test(p.receiptId??'')&&
  p.sourceId===pin.sourceId&&p.sourceRevision===pin.sourceRevision&&
  p.endpointFingerprint===endpoint.serverCertificateSha256&&
  HEX.test(p.payloadDigest??'')&&ms(p.capturedAtMs)&&p.capturedAtMs<=at&&
  at-p.capturedAtMs<=120000&&ms(p.expiresAtMs)&&p.expiresAtMs>at&&
  p.expiresAtMs-p.capturedAtMs<=300000&&
  p.requestedAction==='PRIVATE_RECEIVER_RECEIPT_REVIEW_ONLY'&&
  p.customerDataIncluded===false&&p.authorityTransfer===false;
}
function validReview(packet,pin,role,at){
 const p=packet?.payload;
 return verifySigned(packet,pin,REVIEW)&&p.schema===QL494_REVIEW_SCHEMA&&
  ID.test(p.reviewId??'')&&ID.test(p.receiptId??'')&&
  QL485_SOURCE_IDS.includes(p.sourceId)&&
  HEX.test(p.sourcePacketDigest??'')&&HEX.test(p.masterAuditDigest??'')&&
  (p.masterJournalHead===null||HEX.test(p.masterJournalHead??''))&&
  p.requestedAction==='REVIEW_ONE_FIRST_SOURCE_RECEIPT_NO_SEND'&&
  p.role===role&&ID.test(p.actorId??'')&&ms(p.issuedAtMs)&&p.issuedAtMs<=at&&
  at-p.issuedAtMs<=120000&&ms(p.expiresAtMs)&&p.expiresAtMs>at&&
  p.expiresAtMs-p.issuedAtMs<=300000&&
  p.customerDataIncluded===false&&p.authorityTransfer===false;
}
export function createQl494FirstSourceReceiver({readMasterAudit,
 journal,sourcePins,ownerPins,reviewerPins,endpoints,
 now=()=>Date.now()}={}){
 if(typeof readMasterAudit!=='function'||
  typeof journal?.append!=='function'||typeof journal?.summary!=='function')
  throw Error('QL494_INDEPENDENT_PRIVATE_MASTER_AND_JOURNAL_REQUIRED');
 function verifiedMaster(){
  try{
   const a=readMasterAudit(),b=readMasterAudit();
   if(a?.state!=='QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD'||
    b?.state!==a.state||
    !HEX.test(a.sixSourceAuditDigest??'')||
    a.sixSourceAuditDigest!==b.sixSourceAuditDigest||
    a.ql493Head!==b.ql493Head||
    !(a.ql493Head===null||HEX.test(a.ql493Head??''))||
    a.masterNetworkDeliveryVerified!==false||
    a.realSourcesVerified!==0||
    a.sourceAuthorized!==false||
    a.customerWrites!==false||
    b.masterNetworkDeliveryVerified!==false||
    journal.summary()?.state!=='QL494_PRIVATE_FIRST_SOURCE_RECEIPTS_HELD')
    return null;
   return a;
  }catch{return null}
 }
 function receive({sourceId,observation,ownerPacket,reviewerPacket}={}){
  const at=now(),master=verifiedMaster(),e=endpoints?.[sourceId],
   pin=sourcePins?.[sourceId],op=ownerPacket?.payload,rp=reviewerPacket?.payload,
   sourcePacket=observation?.bundle?.adapterPacket;
  if(!master)return hold('QL494_INDEPENDENT_QL493_MASTER_READBACK_REQUIRED');
  if(!QL485_SOURCE_IDS.includes(sourceId)||
   !e||e.sourceId!==sourceId||!pin||
   observation?.state!=='MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED'||
   observation.sourceId!==sourceId||observation.bundle?.sourceId!==sourceId||
   !validSource(sourcePacket,pin,e,at))
   return hold('QL494_ONE_ACTUAL_PINNED_SOURCE_ADAPTER_PACKET_REQUIRED');
  const ownerKey=ownerPins?.[sourceId],reviewKey=reviewerPins?.[sourceId];
  let identityA,identityB,identityC;
  try{
   identityA=createPublicKey(ownerKey).export({format:'der',type:'spki'}).toString('hex');
   identityB=createPublicKey(reviewKey).export({format:'der',type:'spki'}).toString('hex');
   identityC=createPublicKey(pin.sourcePublicKeyPem).export({format:'der',type:'spki'}).toString('hex');
  }catch{return hold('QL494_INDEPENDENT_SIGNER_PINS_REQUIRED')}
  if(new Set([identityA,identityB,identityC]).size!==3||
   !validReview(ownerPacket,ownerKey,'owner',at)||
   !validReview(reviewerPacket,reviewKey,'independent-reviewer',at)||
   op.actorId===rp.actorId)
   return hold('QL494_DISTINCT_OWNER_REVIEWER_SIGNATURES_REQUIRED');
  const digest=hash(sourcePacket),receipt=sourcePacket.payload;
  const keys=['reviewId','receiptId','sourceId','sourcePacketDigest',
   'masterAuditDigest','masterJournalHead','requestedAction'];
  if(!keys.every(k=>op[k]===rp[k])||
   op.receiptId!==receipt.receiptId||op.sourceId!==sourceId||
   op.sourcePacketDigest!==digest||
   op.masterAuditDigest!==master.sixSourceAuditDigest||
   op.masterJournalHead!==master.ql493Head)
   return hold('QL494_RECEIPT_OR_MASTER_PROOF_SCOPE_MISMATCH');
  const saved=journal.append({reviewId:op.reviewId,receiptId:receipt.receiptId,
   sourceId,sourceRevision:receipt.sourceRevision,
   endpointFingerprint:receipt.endpointFingerprint,
   payloadDigest:receipt.payloadDigest,
   sourcePacketDigest:digest,ownerPacketDigest:hash(ownerPacket),
   reviewerPacketDigest:hash(reviewerPacket),
   masterAuditDigest:master.sixSourceAuditDigest,
   masterJournalHead:master.ql493Head});
  if(saved.state!=='DURABLE_PRIVATE_FIRST_SOURCE_RECEIPT_FOR_REVIEW_HELD')
   return hold('QL494_REPLAY_OR_PRIVATE_RECEIPT_CUSTODY_HOLD');
  return {state:'SIGNED_FIRST_SOURCE_RECEIVER_RECEIPT_REVIEW_HELD',
   sourceId,receiptRecordDigest:saved.receiptRecordDigest,
   oneSupervisedTlsObservationConsumed:true,
   originalHostPhysicallyVerified:false,sourceOperationallyCertified:false,
   masterDelivered:false,customerWrites:false};
 }
 function reconcile(){
  const master=verifiedMaster(),snap=journal.summary();
  if(!master||snap?.state!=='QL494_PRIVATE_FIRST_SOURCE_RECEIPTS_HELD')
   return hold('QL494_SOURCE_TO_MASTER_INDEPENDENT_READBACK_FAILED');
  return {state:'QL494_INDEPENDENT_FIRST_SOURCE_MASTER_RECONCILIATION_HELD',
   masterAuditDigest:master.sixSourceAuditDigest,
   masterJournalHead:master.ql493Head,
   firstSourceReceiptJournalDigest:snap.latestDigest,
   recordCount:snap.recordCount,sourceClaimCounts:snap.perSource,
   independentSignatureReverificationOnRead:false,
   originalSourceRuntimeAccepted:false,originalHostPhysicallyVerified:false,
   masterNetworkDeliveryVerified:false,masterAcceptedProduction:false,
   customerWrites:false};
 }
 return Object.freeze({receive,reconcile,networkListener:false,automaticPoll:false,
  sourceWrites:false,customerWrites:false,masterDelivery:false});
}
