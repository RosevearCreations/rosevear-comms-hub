/**
 * QL-495 — independent QL-494 signed receipt provenance & source drift;
 * optional narrowly scoped PRIVATE mTLS Master delivery trial.
 * Never treats a signature, test fixture, local hostname or response as
 * physical-original-host certification or automatic source acceptance.
 */
import {createHash,createPublicKey,createPrivateKey,verify,X509Certificate} from 'node:crypto';
import {readFileSync,lstatSync,openSync,closeSync,fstatSync,constants} from 'node:fs';
import {join,resolve,isAbsolute} from 'node:path';
import {request as httpsRequest} from 'node:https';
import {checkServerIdentity} from 'node:tls';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {validateQl488Enrollment} from './ql488-original-host-transport.mjs';
import {QL494_ADAPTER_SCHEMA,QL494_REVIEW_SCHEMA,inspectQl494AdapterReadiness}
 from './ql494-first-source-receiver.mjs';

export const QL495_TRIAL_SCHEMA='rosevear.comms.ql495.master-delivery-trial.v1';
export const QL495_ACK_SCHEMA='rosevear.comms.ql495.signed-master-trial-receipt.v1';
const HEX=/^[0-9a-f]{64}$/,SHA=/^[0-9a-f]{40}$/,
 ID=/^[A-Za-z0-9_-]{8,96}$/;
const ROW=['sequence','previousDigest','reviewId','receiptId','sourceId',
 'sourceRevision','endpointFingerprint','payloadDigest','sourcePacketDigest',
 'ownerPacketDigest','reviewerPacketDigest','masterAuditDigest','masterJournalHead',
 'recordedAtMs','recordDigest'];
const RECEIPT=['schema','receiptId','sourceId','sourceRevision','endpointFingerprint',
 'capturedAtMs','expiresAtMs','payloadDigest','requestedAction','customerDataIncluded',
 'authorityTransfer'];
const REVIEW=['schema','reviewId','receiptId','sourceId','sourcePacketDigest',
 'masterAuditDigest','masterJournalHead','requestedAction','role','actorId',
 'issuedAtMs','expiresAtMs','customerDataIncluded','authorityTransfer'];
const TRIAL=['schema','trialId','sourceId','receiptId','recordDigest',
 'masterAuditDigest','masterJournalHead','provenanceDigest','sentAtMs',
 'requestedAction','customerDataIncluded','authorityTransfer'];
const ACK=['schema','trialId','sourceId','receiptId','recordDigest','trialDigest',
 'masterAuditDigest','masterJournalHead','decision','masterActorId','issuedAtMs',
 'expiresAtMs','customerDataIncluded','authorityTransfer'];
const hash=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const exact=(value,fields)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).length===fields.length&&fields.every(k=>Object.hasOwn(value,k));
const ms=n=>Number.isSafeInteger(n)&&n>0;
const hold=reason=>({state:'HOLD',reason,sourceCertified:false,
 physicalOriginalHostCertified:false,masterDeliveryVerified:false,
 masterProductionAccepted:false,customerWrites:false,automaticSend:false});
function keyInfo(pem){
 try{const k=createPublicKey(pem);return k.asymmetricKeyType==='ed25519'?{
 key:k,fingerprint:createHash('sha256').update(k.export({type:'spki',format:'der'}))
  .digest('hex')}:null}catch{return null}
}
function signed(packet,pem,fields){
 try{
  const pk=keyInfo(pem);
  if(!pk||!exact(packet,['payload','signature'])||
   !exact(packet.payload,fields)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const sig=Buffer.from(packet.signature,'base64url');
  return sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),pk.key,sig);
 }catch{return false}
}
function ownerDirectory(directory){
 if(typeof directory!=='string'||!isAbsolute(directory)||
  directory.split(/[\\/]/).includes('..'))throw Error('QL495_PRIVATE_ABSOLUTE_DIRECTORY_REQUIRED');
 const p=resolve(directory),st=lstatSync(p);
 if(!st.isDirectory()||st.isSymbolicLink()||
  (process.platform!=='win32'&&(st.mode&0o077)))
  throw Error('QL495_PRIVATE_DIRECTORY_UNSAFE');
 return p;
}
function readStoredRows(directory){
 const file=join(ownerDirectory(directory),'ql494-first-source-receiver-receipts.ndjson');
 let fd;
 try{
  try{const st=lstatSync(file);if(!st.isFile()||st.isSymbolicLink())
   throw Error('QL495_QL494_JOURNAL_FILE_UNSAFE')}
  catch(e){if(e.code==='ENOENT')return [];throw e}
  fd=openSync(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
  const st=fstatSync(fd);
  if(!st.isFile()||st.size<1||st.size>2000000||
   (process.platform!=='win32'&&(st.mode&0o077)))
   throw Error('QL495_QL494_JOURNAL_PERMISSION_OR_SIZE_HOLD');
  const raw=readFileSync(fd,'utf8');
  if(!raw.endsWith('\n'))throw Error('QL495_QL494_JOURNAL_TRUNCATED');
  const rows=raw.trimEnd().split('\n').map(x=>JSON.parse(x));
  if(rows.length>64)throw Error('QL495_QL494_JOURNAL_CAPACITY');
  const ids=new Set(),reviews=new Set();
  let head=null,prevTime=0;
  for(const [i,r] of rows.entries()){
   if(!exact(r,ROW)||r.sequence!==i+1||r.previousDigest!==head||
    !ID.test(r.receiptId??'')||ids.has(r.receiptId)||
    !ID.test(r.reviewId??'')||reviews.has(r.reviewId)||
    !QL485_SOURCE_IDS.includes(r.sourceId)||!SHA.test(r.sourceRevision??'')||
    ![r.endpointFingerprint,r.payloadDigest,r.sourcePacketDigest,r.ownerPacketDigest,
     r.reviewerPacketDigest,r.masterAuditDigest,r.recordDigest].every(x=>HEX.test(x??''))||
    !(r.masterJournalHead===null||HEX.test(r.masterJournalHead??''))||
    !ms(r.recordedAtMs)||r.recordedAtMs<prevTime||
    hash(Object.fromEntries(ROW.filter(x=>x!=='recordDigest')
     .map(x=>[x,r[x]])))!==r.recordDigest)
    throw Error('QL495_QL494_INDEPENDENT_HASH_CHAIN_TAMPER');
   head=r.recordDigest;prevTime=r.recordedAtMs;
   ids.add(r.receiptId);reviews.add(r.reviewId);
  }
  return rows;
 }finally{if(fd!==undefined)closeSync(fd)}
}
function trustedSource(sourceId,sourcePins,approvedPins,endpoints,ownerPins,reviewerPins){
 const pin=sourcePins?.[sourceId],approved=approvedPins?.[sourceId],
  e=endpoints?.[sourceId],o=keyInfo(ownerPins?.[sourceId]),r=keyInfo(reviewerPins?.[sourceId]),
  s=keyInfo(pin?.sourcePublicKeyPem),a=keyInfo(approved?.publicKeyPem);
 if(!pin||!approved||!e||!o||!r||!s||!a||
  new Set([o.fingerprint,r.fingerprint,s.fingerprint]).size!==3||
  s.fingerprint!==a.fingerprint||approved.sourceId!==sourceId||
  approved.independentlyVerified!==true||
  approved.sourceOwnerApproved!==true||
  approved.approvedRevision!==pin.sourceRevision||
  e.sourceId!==sourceId||pin.sourceId!==sourceId||
  !SHA.test(pin.sourceRevision??'')||
  !HEX.test(e.serverCertificateSha256??''))return false;
 return true;
}
function checkHistoricalPacket(row,sourcePacket,ownerPacket,reviewerPacket,pins,at){
 const {sourcePins,approvedPins,ownerPins,reviewerPins,endpoints}=pins;
 if(!trustedSource(row.sourceId,sourcePins,approvedPins,endpoints,ownerPins,reviewerPins))
  return 'QL495_SOURCE_ATTESTATION_OR_PIN_DRIFT_HOLD';
 if(hash(sourcePacket)!==row.sourcePacketDigest||
  hash(ownerPacket)!==row.ownerPacketDigest||
  hash(reviewerPacket)!==row.reviewerPacketDigest)
  return 'QL495_HISTORICAL_SIGNED_PACKET_DIGEST_MISMATCH';
 const pin=sourcePins[row.sourceId],sp=sourcePacket?.payload,
  op=ownerPacket?.payload,rp=reviewerPacket?.payload;
 if(!signed(sourcePacket,pin.sourcePublicKeyPem,RECEIPT)||
  !signed(ownerPacket,ownerPins[row.sourceId],REVIEW)||
  !signed(reviewerPacket,reviewerPins[row.sourceId],REVIEW))
  return 'QL495_HISTORICAL_SIGNATURE_OR_SCHEMA_INVALID';
 if(sp.schema!==QL494_ADAPTER_SCHEMA||sp.receiptId!==row.receiptId||
  sp.sourceId!==row.sourceId||sp.sourceRevision!==row.sourceRevision||
  sp.endpointFingerprint!==row.endpointFingerprint||
  sp.endpointFingerprint!==endpoints[row.sourceId].serverCertificateSha256||
  sp.payloadDigest!==row.payloadDigest||
  sp.requestedAction!=='PRIVATE_RECEIVER_RECEIPT_REVIEW_ONLY'||
  sp.customerDataIncluded!==false||sp.authorityTransfer!==false||
  !ms(sp.capturedAtMs)||sp.capturedAtMs>row.recordedAtMs||
  row.recordedAtMs-sp.capturedAtMs>120000||
  !ms(sp.expiresAtMs)||sp.expiresAtMs<=row.recordedAtMs||
  sp.expiresAtMs-sp.capturedAtMs>300000)
  return 'QL495_HISTORICAL_SOURCE_SCOPE_OR_TIME_DRIFT';
 const reviews=[['owner',op],['independent-reviewer',rp]];
 for(const [role,p] of reviews){
  if(p?.schema!==QL494_REVIEW_SCHEMA||p.role!==role||
   p.reviewId!==row.reviewId||p.receiptId!==row.receiptId||
   p.sourceId!==row.sourceId||p.sourcePacketDigest!==row.sourcePacketDigest||
   p.masterAuditDigest!==row.masterAuditDigest||
   p.masterJournalHead!==row.masterJournalHead||
   p.requestedAction!=='REVIEW_ONE_FIRST_SOURCE_RECEIPT_NO_SEND'||
   !ID.test(p.actorId??'')||!ms(p.issuedAtMs)||p.issuedAtMs>row.recordedAtMs||
   row.recordedAtMs-p.issuedAtMs>120000||!ms(p.expiresAtMs)||
   p.expiresAtMs<=row.recordedAtMs||
   p.expiresAtMs-p.issuedAtMs>300000||
   p.customerDataIncluded!==false||p.authorityTransfer!==false)
   return 'QL495_HISTORICAL_INDEPENDENT_REVIEW_DRIFT';
 }
 if(op.actorId===rp.actorId)return 'QL495_OWNER_REVIEWER_ID_REUSE';
 if(row.recordedAtMs>at)return 'QL495_FUTURE_RECORDED_RECEIPT';
 return null;
}
export function inspectQl495AttestationDrift({sourcePins,approvedPins,
 endpoints,ownerPins,reviewerPins}={}){
 try{validateQl488Enrollment(endpoints)}
 catch{return hold('QL495_SIX_SOURCE_MTLS_ENDPOINT_CUSTODY_REQUIRED')}
 const readiness=inspectQl494AdapterReadiness({endpoints,sourcePins});
 if(readiness.state!=='QL494_SIX_SOURCE_ADAPTER_PIN_FORMAT_READY_NOT_CONNECTED')
  return hold('QL495_INDEPENDENT_ADAPTER_KEY_FORMAT_HOLD');
 const status={},failing=[];
 for(const id of QL485_SOURCE_IDS){
  const pass=trustedSource(id,sourcePins,approvedPins,endpoints,ownerPins,reviewerPins);
  status[id]={sourceId:id,attestationPinStable:pass,
   localAdapterReadinessOnly:pass,actualEndpointConnected:false,
   physicalHostCertified:false};
  if(!pass)failing.push(id);
 }
 return {state:failing.length?'HOLD':'QL495_SIX_SOURCE_ATTESTATION_PINS_STABLE_NOT_CONNECTED',
  sourceCount:6,driftedSources:failing,sources:status,
  actualConnectionsVerified:0,masterNetworkDeliveryVerified:false,
  sourceOperationallyCertified:false,automaticSend:false};
}
export function createQl495ReceiptProvenance({directory,ql494Journal,readMasterAudit,
 sourcePins,approvedPins,endpoints,ownerPins,reviewerPins,now=()=>Date.now()}={}){
 if(typeof ql494Journal?.summary!=='function'||typeof readMasterAudit!=='function')
  throw Error('QL495_GENUINE_QL494_AND_QL493_CUSTODY_REQUIRED');
 const dir=ownerDirectory(directory);
 function audited(){
  try{
   const rows=readStoredRows(dir),snap=ql494Journal.summary(),
    a=readMasterAudit(),b=readMasterAudit();
   if(snap?.state!=='QL494_PRIVATE_FIRST_SOURCE_RECEIPTS_HELD'||
    snap.recordCount!==rows.length||
    snap.latestDigest!==(rows.at(-1)?.recordDigest??null)||
    QL485_SOURCE_IDS.some(id=>snap.perSource?.[id]!==rows.filter(r=>r.sourceId===id).length)||
    a?.state!=='QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD'||
    b?.state!==a.state||!HEX.test(a.sixSourceAuditDigest??'')||
    a.sixSourceAuditDigest!==b.sixSourceAuditDigest||
    a.ql493Head!==b.ql493Head||
    !(a.ql493Head===null||HEX.test(a.ql493Head??''))||
    a.masterNetworkDeliveryVerified!==false||a.sourceAuthorized!==false||
    a.customerWrites!==false||a.realSourcesVerified!==0)
    return null;
   return {rows,master:a,sourceHead:snap.latestDigest};
  }catch{return null}
 }
 function review({sourceId,receiptId,sourcePacket,ownerPacket,reviewerPacket}={}){
  const snapshot=audited(),at=now();
  if(!snapshot)return hold('QL495_INDEPENDENT_PRIOR_JOURNAL_READBACK_HOLD');
  const row=snapshot.rows.find(x=>x.sourceId===sourceId&&x.receiptId===receiptId);
  if(!row)return hold('QL495_REAL_PRIOR_SOURCE_RECEIPT_REQUIRED');
  if(row.masterAuditDigest!==snapshot.master.sixSourceAuditDigest||
   row.masterJournalHead!==snapshot.master.ql493Head)
   return hold('QL495_SOURCE_TO_MASTER_AUDIT_DRIFT');
  const error=checkHistoricalPacket(row,sourcePacket,ownerPacket,reviewerPacket,
   {sourcePins,approvedPins,endpoints,ownerPins,reviewerPins},at);
  if(error)return hold(error);
  const provenance={sourceId,receiptId,sourceRecordDigest:row.recordDigest,
   sourceJournalHead:snapshot.sourceHead,
   masterAuditDigest:snapshot.master.sixSourceAuditDigest,
   masterJournalHead:snapshot.master.ql493Head,
   signedPacketDigest:row.sourcePacketDigest,recordedAtMs:row.recordedAtMs};
  return {state:'QL495_HISTORICAL_SOURCE_RECEIPT_PROVENANCE_RECHECKED_HELD',
   ...provenance,provenanceDigest:hash(provenance),
   trialEligibleWhileSourcePacketFresh:sourcePacket.payload.expiresAtMs>at,
   sourceSignatureHistoricallyVerified:true,
   originalHardwareProvenanceVerified:false,masterNetworkDeliveryVerified:false,
   sourceOperationallyCertified:false,customerWrites:false};
 }
 function reconciliation(){
  const snapshot=audited();
  if(!snapshot)return hold('QL495_INDEPENDENT_SOURCE_MASTER_LEDGER_TAMPER_OR_DRIFT');
  const drift=inspectQl495AttestationDrift({sourcePins,approvedPins,endpoints,
   ownerPins,reviewerPins});
  const counts=Object.fromEntries(QL485_SOURCE_IDS.map(id=>[id,
   snapshot.rows.filter(r=>r.sourceId===id).length]));
  if(drift.state==='HOLD')return hold('QL495_SOURCE_ATTESTATION_DRIFT_HOLD');
  for(const r of snapshot.rows){
   if(r.sourceRevision!==sourcePins[r.sourceId].sourceRevision||
    r.endpointFingerprint!==endpoints[r.sourceId].serverCertificateSha256)
    return hold('QL495_RECORDED_RECEIPT_SOURCE_REVISION_OR_TLS_PIN_DRIFT');
   if(r.masterAuditDigest!==snapshot.master.sixSourceAuditDigest||
    r.masterJournalHead!==snapshot.master.ql493Head)
    return hold('QL495_RECORDED_MASTER_CUSTODY_DRIFT');
  }
  return {state:'QL495_INDEPENDENT_SOURCE_PROVENANCE_DRIFT_READBACK_HELD',
   recordCount:snapshot.rows.length,sourceCounts:counts,
   sourceJournalHead:snapshot.sourceHead,
   masterAuditDigest:snapshot.master.sixSourceAuditDigest,
   masterJournalHead:snapshot.master.ql493Head,
   independentHistoricalSignaturesRecheckedOnRead:false,
   masterNetworkDeliveryVerified:false,operationallyVerifiedSources:0,
   customerWrites:false,automaticSend:false};
 }
 return Object.freeze({review,reconciliation,networkSend:false,
  physicalHostCertified:false,sourceWrites:false});
}
/** Validate one PRE-ENROLLED private Master mTLS target, never TOFU. */
export function validateQl495MasterEndpoint(entry,{at=Date.now()}={}){
 try{
  if(!exact(entry,['url','serverCertificateSha256','caPem',
    'clientCertificatePem','clientKeyPem'])||!HEX.test(entry.serverCertificateSha256??''))
   throw Error('missing');
  const u=new URL(entry.url);
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||
   u.pathname!=='/internal/comms/master-delivery-trial'||
   !/^([a-z0-9-]+\.)+[a-z0-9-]+$/i.test(u.hostname)||
   u.hostname.endsWith('.localhost')||u.hostname.endsWith('.local')||
   ![443,8443].includes(Number(u.port||443)))
   throw Error('not approved private route');
  const ca=new X509Certificate(entry.caPem),
   cert=new X509Certificate(entry.clientCertificatePem),
   key=createPrivateKey(entry.clientKeyPem);
  if(!createPublicKey(key).export({type:'spki',format:'der'}).equals(
    cert.publicKey.export({type:'spki',format:'der'}))||
   !ms(at)||[ca,cert].some(c=>at<Date.parse(c.validFrom)||at>Date.parse(c.validTo)))
   throw Error('certificate mismatch or expired');
  return {state:'QL495_MASTER_MTLS_LOCAL_PREFLIGHT_NOT_CONNECTED',
   masterEndpointPinPresent:true,masterNetworkDeliveryVerified:false,
   sourceCertified:false,customerWrites:false};
 }catch{return hold('QL495_INDEPENDENT_MASTER_MTLS_ENDPOINT_PREREQUISITES_MISSING')}
}
export function verifyQl495MasterTrialReceipt({requestPayload,responsePacket,
 masterPublicKeyPem,now=Date.now()}={}){
 const p=responsePacket?.payload;
 if(!signed(responsePacket,masterPublicKeyPem,ACK)||
  !exact(requestPayload,TRIAL)||requestPayload.schema!==QL495_TRIAL_SCHEMA||
  p.schema!==QL495_ACK_SCHEMA||
  !ID.test(p.masterActorId??'')||
  !['HOLD_FOR_INDEPENDENT_REVIEW','DENY'].includes(p.decision)||
  p.trialId!==requestPayload.trialId||
  p.sourceId!==requestPayload.sourceId||p.receiptId!==requestPayload.receiptId||
  p.recordDigest!==requestPayload.recordDigest||
  p.trialDigest!==hash(requestPayload)||
  p.masterAuditDigest!==requestPayload.masterAuditDigest||
  p.masterJournalHead!==requestPayload.masterJournalHead||
  !ms(p.issuedAtMs)||p.issuedAtMs>now||now-p.issuedAtMs>120000||
  !ms(p.expiresAtMs)||p.expiresAtMs<=now||
  p.expiresAtMs-p.issuedAtMs>300000||
  p.customerDataIncluded!==false||p.authorityTransfer!==false)
  return hold('QL495_PINNED_LIVE_MASTER_RECEIPT_INVALID_OR_STALE');
 return {state:'QL495_SIGNED_MASTER_DELIVERY_TRIAL_RECEIPT_HELD',
  trialId:p.trialId,sourceId:p.sourceId,receiptId:p.receiptId,
  masterDecision:p.decision,masterPacketDigest:hash(responsePacket),
  masterSignerVerifiedAtIntake:true,originalHostPhysicallyVerified:false,
  sourceOperationallyCertified:false,masterProductionAccepted:false,
  customerWrites:false,automaticSend:false};
}
/** One explicitly owner-authorized POST. No logging of endpoint config or response body. */
export async function trialQl495PrivateMasterDelivery({endpoint,
 requestPayload,masterPublicKeyPem,now=()=>Date.now()}={}){
 const preflight=validateQl495MasterEndpoint(endpoint,{at:now()});
 if(preflight.state==='HOLD')return preflight;
 if(!exact(requestPayload,TRIAL)||requestPayload.schema!==QL495_TRIAL_SCHEMA||
  !ID.test(requestPayload.trialId??'')||
  !QL485_SOURCE_IDS.includes(requestPayload.sourceId)||
  !ID.test(requestPayload.receiptId??'')||
  ![requestPayload.recordDigest,requestPayload.masterAuditDigest,
   requestPayload.provenanceDigest].every(x=>HEX.test(x??''))||
  !(requestPayload.masterJournalHead===null||
   HEX.test(requestPayload.masterJournalHead??''))||
  requestPayload.requestedAction!=='ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY'||
  requestPayload.customerDataIncluded!==false||
  requestPayload.authorityTransfer!==false||
  !ms(requestPayload.sentAtMs)||Math.abs(now()-requestPayload.sentAtMs)>120000||
  !keyInfo(masterPublicKeyPem))
  return hold('QL495_EXACT_CURRENT_METADATA_ONLY_TRIAL_REQUEST_REQUIRED');
 return await new Promise(resolveResult=>{
  let done=false;const finish=value=>{if(!done){done=true;resolveResult(value)}};
  const u=new URL(endpoint.url),body=JSON.stringify(requestPayload);
  const req=httpsRequest(u,{method:'POST',timeout:5000,agent:false,
   minVersion:'TLSv1.3',rejectUnauthorized:true,
   ca:endpoint.caPem,cert:endpoint.clientCertificatePem,key:endpoint.clientKeyPem,
   headers:{'content-type':'application/json','accept':'application/json',
    'cache-control':'no-store','content-length':Buffer.byteLength(body)},
   checkServerIdentity:(host,cert)=>{
    const err=checkServerIdentity(host,cert);
    if(err)return err;
    if((cert.fingerprint256??'').replaceAll(':','').toLowerCase()!==
      endpoint.serverCertificateSha256)
     return Error('QL495_PINNED_MASTER_CERTIFICATE_MISMATCH');
   }},res=>{
   if(res.statusCode!==200||
    !/^application\/json(?:;|$)/i.test(String(res.headers['content-type']??''))){
    res.resume();finish(hold('QL495_MASTER_HTTP_STATUS_OR_CONTENT_TYPE_HOLD'));return;
   }
   let bytes=0,raw='';
   res.on('data',chunk=>{bytes+=chunk.length;if(bytes>16384){
    req.destroy();finish(hold('QL495_MASTER_RESPONSE_TOO_LARGE'));return}
    raw+=chunk.toString('utf8')});
   res.on('end',()=>{try{
    const packet=JSON.parse(raw);
    const checked=verifyQl495MasterTrialReceipt({requestPayload,
      responsePacket:packet,masterPublicKeyPem,now:now()});
    finish({...checked,verifiedPinnedPrivateTlsTransport:checked.state!=='HOLD',
     masterNetworkDeliveryVerified:checked.state!=='HOLD',
     masterProductionAccepted:false});
   }catch{finish(hold('QL495_MALFORMED_MASTER_SIGNED_RECEIPT'))}});
  });
  req.on('timeout',()=>req.destroy(Error('QL495_TIMEOUT')));
  req.on('error',()=>finish(hold('QL495_MASTER_TLS_NETWORK_OR_HANDSHAKE_FAILED')));
  req.end(body);
 });
}
