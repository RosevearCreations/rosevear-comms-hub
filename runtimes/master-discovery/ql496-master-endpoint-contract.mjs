/**
 * QL-496: NON-LISTENING, caller-integrated private Master trial endpoint.
 * Caller must separately provision the real TLS server, independently enroll
 * signer identities, and obtain real signed source and physical field evidence.
 * All returned acknowledgments remain HOLD; never production approval.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {openSync,closeSync,readFileSync,writeFileSync,fsyncSync,unlinkSync,
 fstatSync,lstatSync,constants} from 'node:fs';
import {isAbsolute,resolve,join} from 'node:path';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {QL495_TRIAL_SCHEMA,QL495_ACK_SCHEMA,verifyQl495MasterTrialReceipt}
 from './ql495-source-provenance-master-trial.mjs';

export const QL496_PATH='/internal/comms/master-delivery-trial';
export const QL496_CHALLENGE_SCHEMA='rosevear.comms.ql496.device-presence-challenge.v1';
export const QL496_DEVICE_SCHEMA='rosevear.comms.ql496.independent-device-evidence.v1';
export const QL496_REVIEW_SCHEMA='rosevear.comms.ql496.independent-device-review.v1';
const HEX=/^[0-9a-f]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const TRIAL=['schema','trialId','sourceId','receiptId','recordDigest',
 'masterAuditDigest','masterJournalHead','provenanceDigest','sentAtMs',
 'requestedAction','customerDataIncluded','authorityTransfer'];
const ACK=['schema','trialId','sourceId','receiptId','recordDigest','trialDigest',
 'masterAuditDigest','masterJournalHead','decision','masterActorId','issuedAtMs',
 'expiresAtMs','customerDataIncluded','authorityTransfer'];
const CHALLENGE=['schema','challengeId','sourceId','receiptId','trialId',
 'deviceEnrollmentDigest','issuedAtMs','expiresAtMs',
 'customerDataIncluded','authorityTransfer'];
const DEVICE=['schema','evidenceId','challengeId','sourceId','receiptId','trialId',
 'sourceRecordDigest','masterPacketDigest','deviceEnrollmentDigest',
 'witnessActorId','observedAtMs','issuedAtMs','expiresAtMs',
 'devicePhysicallyObserved','customerDataIncluded','authorityTransfer'];
const REVIEW=['schema','reviewId','evidenceId','challengeId','sourceId',
 'trialId','masterPacketDigest','deviceEvidenceDigest','role','actorId',
 'issuedAtMs','expiresAtMs','decision','customerDataIncluded','authorityTransfer'];
const LEDGER=['sequence','previousDigest','trialId','sourceId','receiptId',
 'sourceRecordDigest','provenanceDigest','masterAuditDigest','masterJournalHead',
 'requestDigest','masterPacketDigest','clientCertificateSha256',
 'recordedAtMs','recordDigest'];
const hash=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
const ms=n=>Number.isSafeInteger(n)&&n>0;
const hold=reason=>({state:'HOLD',reason,originalDevicePhysicallyCertified:false,
 firstSourceOperationallyCertified:false,productionMasterAccepted:false,
 customerWrites:false,automaticReceiver:false});
function key(pem){
 try{const k=createPublicKey(pem);return k.asymmetricKeyType==='ed25519'?k:null}
 catch{return null}
}
function idKey(pem){
 const k=key(pem);
 return k?createHash('sha256').update(k.export({type:'spki',format:'der'})).digest('hex'):null;
}
function signed(packet,pem,fields){
 try{
  if(!exact(packet,['payload','signature'])||
    !exact(packet.payload,fields)||
    !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const k=key(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!k&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),k,sig);
 }catch{return false}
}
function privateDir(p){
 if(typeof p!=='string'||!isAbsolute(p)||
   p.split(/[\\/]/).includes('..'))throw Error('QL496_PRIVATE_ABSOLUTE_PATH_REQUIRED');
 const dir=resolve(p),st=lstatSync(dir);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL496_PRIVATE_DIRECTORY_UNSAFE');
 return dir;
}
function readRows(dir){
 const path=join(dir,'ql496-master-receiver-trial.ndjson');let fd;
 try{
  try{const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink())
   throw Error('QL496_LEDGER_SYMLINK_OR_FILE_HOLD')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const st=fstatSync(fd);
  if(!st.isFile()||st.size<1||st.size>1000000||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL496_LEDGER_SIZE_PERMISSIONS_HOLD');
  const raw=readFileSync(fd,'utf8');
  if(!raw.endsWith('\n'))throw Error('QL496_TRUNCATED_LEDGER');
  const rows=raw.trimEnd().split('\n').map(x=>JSON.parse(x));
  if(rows.length>64)throw Error('QL496_LEDGER_CAPACITY');
  let previous=null,time=0;const ids=new Set();
  for(const [i,r] of rows.entries()){
   if(!exact(r,LEDGER)||r.sequence!==i+1||
    r.previousDigest!==previous||!ID.test(r.trialId??'')||ids.has(r.trialId)||
    !ID.test(r.receiptId??'')||!QL485_SOURCE_IDS.includes(r.sourceId)||
    ![r.sourceRecordDigest,r.provenanceDigest,r.masterAuditDigest,
      r.requestDigest,r.masterPacketDigest,r.clientCertificateSha256,
      r.recordDigest].every(x=>HEX.test(x??''))||
    !(r.masterJournalHead===null||HEX.test(r.masterJournalHead??''))||
    !ms(r.recordedAtMs)||r.recordedAtMs<time||
    hash(Object.fromEntries(LEDGER.filter(x=>x!=='recordDigest')
      .map(x=>[x,r[x]])))!==r.recordDigest)
    throw Error('QL496_LEDGER_HASH_CHAIN_OR_REPLAY_TAMPER');
   previous=r.recordDigest;time=r.recordedAtMs;ids.add(r.trialId);
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
export function createQl496MasterReceiverLedger({directory,now=()=>Date.now()}={}){
 const dir=privateDir(directory),path=join(dir,'ql496-master-receiver-trial.ndjson'),
  lock=join(dir,'.ql496-master-trial.lock');
 function summary(){
  try{const rows=readRows(dir);
   return {state:'QL496_PRIVATE_MASTER_RECEIVER_TRIALS_HELD',
    count:rows.length,lastDigest:rows.at(-1)?.recordDigest??null,
    originalDevicePhysicallyCertified:false,productionMasterAccepted:false,
    customerWrites:false,automaticReceiver:false};}
  catch{return hold('QL496_RECEIVER_LEDGER_TAMPER_HOLD')}
 }
 function find(trialId){
  try{return readRows(dir).find(x=>x.trialId===trialId)??null}
  catch{return {state:'HOLD'}}
 }
 function append({trial,ack,clientCertificateSha256,masterPublicKeyPem}={}){
  if(!exact(trial,TRIAL)||!signed(ack,masterPublicKeyPem,ACK)||
   !HEX.test(clientCertificateSha256??''))return hold('QL496_SIGNED_RECEIPT_AND_CLIENT_CERT_REQUIRED');
  const p=ack.payload;
  if(p.trialId!==trial.trialId||p.sourceId!==trial.sourceId||
   p.receiptId!==trial.receiptId||p.trialDigest!==hash(trial)||
   p.decision!=='HOLD_FOR_INDEPENDENT_REVIEW')
   return hold('QL496_ONLY_NONAUTHORIZING_SIGNED_RECEIPT_ACCEPTED');
  let fd;
  try{fd=openSync(lock,constants.O_WRONLY|constants.O_CREAT|
   constants.O_EXCL|(constants.O_NOFOLLOW||0),0o600)}
  catch{return hold('QL496_EXCLUSIVE_WRITER_REQUIRED')}
  try{
   const rows=readRows(dir);
   if(rows.length>=64||rows.some(x=>x.trialId===trial.trialId))
    return hold('QL496_TRIAL_REPLAY_OR_CAPACITY_HOLD');
   const base={sequence:rows.length+1,
    previousDigest:rows.at(-1)?.recordDigest??null,
    trialId:trial.trialId,sourceId:trial.sourceId,receiptId:trial.receiptId,
    sourceRecordDigest:trial.recordDigest,
    provenanceDigest:trial.provenanceDigest,
    masterAuditDigest:trial.masterAuditDigest,
    masterJournalHead:trial.masterJournalHead,requestDigest:hash(trial),
    masterPacketDigest:hash(ack),clientCertificateSha256,recordedAtMs:now()};
   const row={...base,recordDigest:hash(base)};
   const out=openSync(path,constants.O_WRONLY|constants.O_APPEND|
    (constants.O_NOFOLLOW||0)|
    (rows.length?0:constants.O_CREAT|constants.O_EXCL),0o600);
   try{writeFileSync(out,JSON.stringify(row)+'\n');fsyncSync(out)}
   finally{closeSync(out)}
   const confirmed=readRows(dir);
   if(confirmed.length!==rows.length+1||
    confirmed.at(-1).recordDigest!==row.recordDigest)
    return hold('QL496_FSYNC_RECEIVER_READBACK_FAILED');
   return {state:'QL496_SIGNED_MASTER_TRIAL_DURABLY_HELD',
    trialId:trial.trialId,recordDigest:row.recordDigest,
    networkDeliveredToOriginalHost:false,
    originalDevicePhysicallyCertified:false,
    productionMasterAccepted:false,customerWrites:false};
  }catch{return hold('QL496_PRIVATE_MASTER_LEDGER_WRITE_HOLD')}
  finally{closeSync(fd);try{unlinkSync(lock)}catch{}}
 }
 return Object.freeze({summary,find,append,networkListener:false,
  automaticReceiver:false,customerWrites:false});
}
/** Call from an actual Node https.Server mTLS request, never forwarded headers. */
export function observeQl496ActualMutualTls(request){
 try{
  const socket=request?.socket;
  if(!socket?.encrypted||socket.authorized!==true||
   typeof socket.getProtocol!=='function'||
   socket.getProtocol()!=='TLSv1.3'||
   typeof socket.getPeerCertificate!=='function')throw Error('no socket proof');
  if(request.headers?.['x-forwarded-client-cert']||
   request.headers?.['x-ssl-client-cert']||
   request.headers?.['x-client-cert'])throw Error('forged header boundary');
  const cert=socket.getPeerCertificate(true);
  const fingerprint=String(cert?.fingerprint256??'').replaceAll(':','').toLowerCase();
  if(!HEX.test(fingerprint))throw Error('no certificate');
  return {state:'QL496_ORIGIN_TLS13_MTLS_OBSERVATION_UNVERIFIED',
   clientCertificateSha256:fingerprint,networkListenerStartedByModule:false};
 }catch{return hold('QL496_ACTUAL_AUTHORIZED_TLS13_PEER_CERT_REQUIRED')}
}
function approvedAudit(read){
 try{
  const a=read(),b=read();
  if(a?.state!=='QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD'||
   b?.state!==a.state||!HEX.test(a.sixSourceAuditDigest??'')||
   a.sixSourceAuditDigest!==b.sixSourceAuditDigest||
   !(a.ql493Head===null||HEX.test(a.ql493Head??''))||
   a.ql493Head!==b.ql493Head||
   a.masterNetworkDeliveryVerified!==false||
   a.realSourcesVerified!==0||
   a.sourceAuthorized!==false||a.customerWrites!==false)return null;
  return a;
 }catch{return null}
}
export function validateQl496MasterEndpointTrial({request,trial,clientPins,
 readMasterAudit,readSourceProvenance,now=Date.now()}={}){
 if(request?.method!=='POST'||request?.url!==QL496_PATH||
  !/^application\/json(?:;|$)/i.test(String(request.headers?.['content-type']??'')))
  return hold('QL496_EXACT_PRIVATE_JSON_POST_CONTRACT_REQUIRED');
 const tls=observeQl496ActualMutualTls(request);
 if(tls.state==='HOLD')return tls;
 if(!exact(clientPins,['clientCertificateSha256','masterPublicKeyPem'])||
  !HEX.test(clientPins.clientCertificateSha256??'')||
  !key(clientPins.masterPublicKeyPem)||
  clientPins.clientCertificateSha256!==tls.clientCertificateSha256)
  return hold('QL496_PREAPPROVED_MTLS_CLIENT_CERT_PIN_REQUIRED');
 if(!exact(trial,TRIAL)||trial.schema!==QL495_TRIAL_SCHEMA||
  !ID.test(trial.trialId??'')||!ID.test(trial.receiptId??'')||
  !QL485_SOURCE_IDS.includes(trial.sourceId)||
  ![trial.recordDigest,trial.masterAuditDigest,trial.provenanceDigest]
   .every(x=>HEX.test(x??''))||
  !(trial.masterJournalHead===null||HEX.test(trial.masterJournalHead??''))||
  trial.requestedAction!=='ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY'||
  trial.customerDataIncluded!==false||trial.authorityTransfer!==false||
  !ms(trial.sentAtMs)||trial.sentAtMs>now||
  now-trial.sentAtMs>120000)
  return hold('QL496_FRESH_METADATA_ONLY_QL495_REQUEST_REQUIRED');
 if(typeof readMasterAudit!=='function'||typeof readSourceProvenance!=='function')
  return hold('QL496_INDEPENDENT_SOURCE_AND_MASTER_READERS_REQUIRED');
 const audit=approvedAudit(readMasterAudit);
 if(!audit||trial.masterAuditDigest!==audit.sixSourceAuditDigest||
  trial.masterJournalHead!==audit.ql493Head)
  return hold('QL496_CURRENT_SIGNED_QL493_AUDIT_REQUIRED');
 try{
  const a=readSourceProvenance(trial),b=readSourceProvenance(trial);
  if(a?.state!=='QL495_HISTORICAL_SOURCE_RECEIPT_PROVENANCE_RECHECKED_HELD'||
   b?.state!==a.state||a.trialEligibleWhileSourcePacketFresh!==true||
   b.trialEligibleWhileSourcePacketFresh!==true||
   a.sourceId!==trial.sourceId||a.receiptId!==trial.receiptId||
   a.sourceRecordDigest!==trial.recordDigest||
   a.masterAuditDigest!==trial.masterAuditDigest||
   a.masterJournalHead!==trial.masterJournalHead||
   a.provenanceDigest!==trial.provenanceDigest||
   b.provenanceDigest!==a.provenanceDigest||
   a.sourceSignatureHistoricallyVerified!==true||
   b.sourceSignatureHistoricallyVerified!==true||
   a.originalHardwareProvenanceVerified!==false)
   return hold('QL496_GENUINE_RECHECKED_FIRST_SOURCE_SIGNED_PACKET_REQUIRED');
  return {state:'QL496_SIGNED_FIRST_SOURCE_MASTER_TRIAL_CONTRACT_READY_HELD',
   clientCertificateSha256:tls.clientCertificateSha256,
   sourceId:trial.sourceId,trialId:trial.trialId,receiptId:trial.receiptId,
   requestDigest:hash(trial),
   originalDevicePhysicallyCertified:false,
   sourceOperationallyCertified:false,productionMasterAccepted:false,
   customerWrites:false};
 }catch{return hold('QL496_INDEPENDENT_SIGNED_SOURCE_READBACK_FAILED')}
}
/** Injected signer must be separately approved and its signature reverified. */
export function createQl496MasterEndpointContract({ledger,clientPins,
 readMasterAudit,readSourceProvenance,signMasterAck,now=()=>Date.now()}={}){
 if(typeof ledger?.append!=='function'||typeof ledger?.find!=='function'||
  typeof ledger?.summary!=='function'||typeof signMasterAck!=='function')
  throw Error('QL496_INDEPENDENT_RECEIVER_SIGNER_AND_DURABLE_LEDGER_REQUIRED');
 async function handle({request,trial}={}){
  const at=now(),v=validateQl496MasterEndpointTrial({request,trial,
   clientPins,readMasterAudit,readSourceProvenance,now:at});
  if(v.state==='HOLD')return v;
  if(ledger.summary().state!=='QL496_PRIVATE_MASTER_RECEIVER_TRIALS_HELD'||
   ledger.find(trial.trialId)!==null)
   return hold('QL496_EXISTING_TRIAL_REPLAY_OR_UNREADABLE_LEDGER');
  const body={schema:QL495_ACK_SCHEMA,trialId:trial.trialId,
   sourceId:trial.sourceId,receiptId:trial.receiptId,
   recordDigest:trial.recordDigest,trialDigest:hash(trial),
   masterAuditDigest:trial.masterAuditDigest,
   masterJournalHead:trial.masterJournalHead,
   decision:'HOLD_FOR_INDEPENDENT_REVIEW',
   masterActorId:'independent_master_ql496',
   issuedAtMs:at,expiresAtMs:at+60000,
   customerDataIncluded:false,authorityTransfer:false};
  let ack;
  try{ack=await signMasterAck(body)}
  catch{return hold('QL496_SEPARATE_MASTER_SIGNER_UNAVAILABLE')}
  if(!exact(ack,['payload','signature'])||
   canonicalize(ack.payload)!==canonicalize(body)||
   verifyQl495MasterTrialReceipt({requestPayload:trial,responsePacket:ack,
    masterPublicKeyPem:clientPins.masterPublicKeyPem,now:now()}).state!==
     'QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD')
   return hold('QL496_INDEPENDENT_PINNED_MASTER_SIGNED_ACK_FAILED');
  const stored=ledger.append({trial,ack,
   clientCertificateSha256:v.clientCertificateSha256,
   masterPublicKeyPem:clientPins.masterPublicKeyPem});
  if(stored.state!=='QL496_SIGNED_MASTER_TRIAL_DURABLY_HELD')return stored;
  return {state:'QL496_SIGNED_PRIVATE_MASTER_TRIAL_RESPONSE_READY_HELD',
   statusCode:200,contentType:'application/json',
   signedResponsePacket:ack,receiverLedgerDigest:stored.recordDigest,
   originalDevicePhysicallyCertified:false,clientReceivedResponseVerified:false,
   sourceOperationallyCertified:false,productionMasterAccepted:false,
   customerWrites:false,automaticReceiver:false};
 }
 return Object.freeze({handle,networkListener:false,automaticReceiver:false});
}
/** Independent external field witness evidence is REVIEW-ONLY, not physical certification. */
export function verifyQl496IndependentDeviceEvidence({challengePacket,attestationPacket,
 ownerPacket,reviewerPacket,pins,trial,masterPacket,now=Date.now()}={}){
 const a=attestationPacket?.payload,o=ownerPacket?.payload,r=reviewerPacket?.payload;
 const keys=[pins?.attestorPublicKeyPem,pins?.ownerPublicKeyPem,
  pins?.reviewerPublicKeyPem,pins?.masterPublicKeyPem].map(idKey);
 if(keys.some(x=>!x)||new Set(keys).size!==4)
  return hold('QL496_FOUR_DISTINCT_PREAPPROVED_ED25519_KEYS_REQUIRED');
 if(!signed(challengePacket,pins.masterPublicKeyPem,CHALLENGE)||
   !signed(attestationPacket,pins.attestorPublicKeyPem,DEVICE)||
   !signed(ownerPacket,pins.ownerPublicKeyPem,REVIEW)||
   !signed(reviewerPacket,pins.reviewerPublicKeyPem,REVIEW)||
   !exact(trial,TRIAL)||!signed(masterPacket,pins.masterPublicKeyPem,ACK))
  return hold('QL496_GENUINE_INDEPENDENT_DEVICE_AND_MASTER_SIGNATURES_REQUIRED');
 const ch=challengePacket.payload;
 if(ch.schema!==QL496_CHALLENGE_SCHEMA||
  !ID.test(ch.challengeId??'')||ch.challengeId!==a.challengeId||
  ch.sourceId!==trial.sourceId||ch.receiptId!==trial.receiptId||
  ch.trialId!==trial.trialId||ch.deviceEnrollmentDigest!==pins.deviceEnrollmentDigest||
  !ms(ch.issuedAtMs)||ch.issuedAtMs>now||
  now-ch.issuedAtMs>120000||!ms(ch.expiresAtMs)||
  ch.expiresAtMs<=now||ch.expiresAtMs-ch.issuedAtMs>300000||
  a.observedAtMs<ch.issuedAtMs||a.observedAtMs>ch.expiresAtMs||
  ch.customerDataIncluded!==false||ch.authorityTransfer!==false)
  return hold('QL496_INDEPENDENT_MASTER_CHALLENGE_MISSING_OR_STALE');
 if(a.schema!==QL496_DEVICE_SCHEMA||o.schema!==QL496_REVIEW_SCHEMA||
  r.schema!==QL496_REVIEW_SCHEMA||
  ![a.evidenceId,a.challengeId,a.witnessActorId,o.reviewId,
    o.actorId,r.actorId].every(x=>ID.test(x??''))||
  o.reviewId!==r.reviewId||o.actorId===r.actorId||
  [o.actorId,r.actorId].includes(a.witnessActorId)||
  a.sourceId!==trial.sourceId||a.receiptId!==trial.receiptId||
  a.trialId!==trial.trialId||
  a.sourceRecordDigest!==trial.recordDigest||
  a.masterPacketDigest!==hash(masterPacket)||
  a.deviceEnrollmentDigest!==pins.deviceEnrollmentDigest||
  !HEX.test(a.deviceEnrollmentDigest??'')||
  a.devicePhysicallyObserved!==true||
  a.customerDataIncluded!==false||a.authorityTransfer!==false||
  !ms(a.issuedAtMs)||!ms(a.observedAtMs)||a.observedAtMs>a.issuedAtMs||
  a.issuedAtMs>now||now-a.issuedAtMs>120000||
  !ms(a.expiresAtMs)||a.expiresAtMs<=now||
  a.expiresAtMs-a.issuedAtMs>300000||
  [o,r].some((p,i)=>p.evidenceId!==a.evidenceId||
    p.challengeId!==a.challengeId||p.sourceId!==a.sourceId||
    p.trialId!==a.trialId||p.masterPacketDigest!==a.masterPacketDigest||
    p.deviceEvidenceDigest!==hash(attestationPacket)||
    p.role!==(i===0?'owner':'independent-reviewer')||
    p.decision!=='REVIEW_ONLY_NO_PRODUCTION_AUTHORITY'||
    !ms(p.issuedAtMs)||p.issuedAtMs>now||
    now-p.issuedAtMs>120000||!ms(p.expiresAtMs)||
    p.expiresAtMs<=now||p.expiresAtMs-p.issuedAtMs>300000||
    p.customerDataIncluded!==false||p.authorityTransfer!==false))
  return hold('QL496_DEVICE_WITNESS_SCOPE_CHALLENGE_OR_FRESHNESS_HOLD');
 const signedAck=verifyQl495MasterTrialReceipt({requestPayload:trial,
  responsePacket:masterPacket,masterPublicKeyPem:pins.masterPublicKeyPem,now});
 if(signedAck.state!=='QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD')
  return hold('QL496_DEVICE_WITNESS_MASTER_ACK_MISMATCH');
 return {state:'QL496_INDEPENDENT_SIGNED_DEVICE_EVIDENCE_REVIEW_HELD',
  trialId:trial.trialId,deviceEvidenceDigest:hash(attestationPacket),
  reviewDigest:hash({ownerPacket,reviewerPacket}),
  masterPacketDigest:hash(masterPacket),
  externalFieldWitnessSignaturesVerified:true,
  hardwareIdentityIndependentlyAudited:false,
  originalDevicePhysicallyCertified:false,
  productionMasterAccepted:false,customerWrites:false};
}
export function reconcileQl496SignedDelivery({ledger,trial,masterPacket,
 masterPublicKeyPem,originalClientVerified}={}){
 const record=ledger?.find?.(trial?.trialId);
 if(!record||record.state==='HOLD'||!exact(trial,TRIAL)||
  record.sourceId!==trial.sourceId||record.receiptId!==trial.receiptId||
  record.requestDigest!==hash(trial)||
  record.sourceRecordDigest!==trial.recordDigest||
  record.provenanceDigest!==trial.provenanceDigest||
  record.masterAuditDigest!==trial.masterAuditDigest||
  record.masterJournalHead!==trial.masterJournalHead||
  record.masterPacketDigest!==hash(masterPacket)||
  verifyQl495MasterTrialReceipt({requestPayload:trial,
   responsePacket:masterPacket,masterPublicKeyPem}).state!==
   'QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD')
  return hold('QL496_SIGNED_MASTER_SOURCE_DELIVERY_RECONCILIATION_FAILED');
 return {state:'QL496_SOURCE_MASTER_SIGNED_DELIVERY_RECONCILED_HELD',
  trialId:trial.trialId,masterReceiverLedgerDigest:record.recordDigest,
  sourceReceiptDigest:record.sourceRecordDigest,
  masterPacketDigest:record.masterPacketDigest,
  originalClientReceiptIndependentlyVerified:false,
  clientReportedReceipt:originalClientVerified===true,
  networkDeliveryToClientCertified:false,
  originalDevicePhysicallyCertified:false,
  productionMasterAccepted:false,customerWrites:false};
}
