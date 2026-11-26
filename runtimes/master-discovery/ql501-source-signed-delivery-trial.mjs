/**
 * QL-501. Source-signed, metadata-only one-shot Master delivery trial and
 * independently provider-signed ACK. Production rights stay HOLD.
 *
 * Transport is opt-in from the original Windows host ONLY; CI has no network.
 * A source signature and a provider ACK never prove human receipt.
 */
import https from 'node:https';
import {checkServerIdentity} from 'node:tls';
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
import {observeQl496ActualMutualTls} from './ql496-master-endpoint-contract.mjs';

export const QL501_ENDPOINT_PATH='/internal/comms/master-source-signed-trial';
export const QL501_SOURCE_SCHEMA='rosevear.comms.ql501.original-source-signed-trial.v1';
export const QL501_PROVIDER_SCHEMA='rosevear.comms.ql501.provider-signed-delivery-ack.v1';
export const QL501_REVIEW_SCHEMA='rosevear.comms.ql501.independent-hold-decision.v1';
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9_-]{8,96}$/;
const SOURCE=['schema','trialId','sourceId','sourceEventId','tenantScopeDigest',
 'eventDigest','eventVersion','purpose','issuedAtMs','expiresAtMs',
 'requestedAction','customerDataIncluded','authorityTransfer'];
const PROVIDER=['schema','trialId','sourceId','sourceEventId','tenantScopeDigest',
 'sourcePacketDigest','providerReceiptId','providerActorId','receivedAtMs',
 'issuedAtMs','expiresAtMs','decision','customerDataIncluded','authorityTransfer'];
const REVIEW=['schema','trialId','sourceEventId','sourcePacketDigest',
 'providerPacketDigest','reviewerActorId','issuedAtMs','expiresAtMs',
 'decision','productionReleaseRequested','customerDataIncluded',
 'authorityTransfer'];
const exact=(obj,keys)=>!!obj&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).length===keys.length&&keys.every(x=>Object.hasOwn(obj,x));
const hash=o=>createHash('sha256').update(canonicalize(o)).digest('hex');
const at=x=>Number.isSafeInteger(x)&&x>0;
const fresh=(p,now)=>at(p.issuedAtMs)&&p.issuedAtMs<=now&&
 now-p.issuedAtMs<=120000&&at(p.expiresAtMs)&&p.expiresAtMs>now&&
 p.expiresAtMs-p.issuedAtMs<=300000;
const hold=reason=>({state:'HOLD',reason,
 sourceOperationallyCertified:false,providerOperationallyCertified:false,
 independentlyObservedDelivery:false,productionReleaseAuthorized:false,
 humanAcknowledged:false,customerWrites:false,automaticNetworkSend:false});
const authority=()=>process.platform==='win32'&&
 process.env.COMPUTERNAME==='DESKTOP-AE894KC'&&
 String(process.env.USERNAME??'').toLowerCase()==='ree'&&
 process.env.CI!=='true';

function key(pem){
 try{const k=createPublicKey(pem);return k.asymmetricKeyType==='ed25519'?k:null;}
 catch{return null;}
}
const pin=pem=>{
 const k=key(pem);
 return k?createHash('sha256').update(k.export({type:'spki',format:'der'}))
  .digest('hex'):null;
};
function checkedPacket(packet,pem,fields){
 try{
  const k=key(pem);
  if(!k||!exact(packet,['payload','signature'])||
   !exact(packet.payload,fields)||
   typeof packet.signature!=='string'||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature))return false;
  const sig=Buffer.from(packet.signature,'base64url');
  return sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),k,sig);
 }catch{return false;}
}
function scopeValid(p){
 return p.schema===QL501_SOURCE_SCHEMA&&ID.test(p.trialId??'')&&
  ID.test(p.sourceEventId??'')&&QL485_SOURCE_IDS.includes(p.sourceId)&&
  HEX.test(p.tenantScopeDigest??'')&&HEX.test(p.eventDigest??'')&&
  Number.isSafeInteger(p.eventVersion)&&p.eventVersion>0&&
  p.purpose==='COMMS_DELIVERY_RECEIPT_RECONCILIATION'&&
  p.requestedAction==='ONE_METADATA_ONLY_SOURCE_SIGNED_TRIAL_HOLD'&&
  p.customerDataIncluded===false&&p.authorityTransfer===false;
}
export function verifyQl501SourcePacket({sourcePacket,sourcePublicKeyPem,
 approvedSourceId,approvedTenantScopeDigest,now=Date.now()}={}){
 const p=sourcePacket?.payload;
 if(!checkedPacket(sourcePacket,sourcePublicKeyPem,SOURCE)||
  !scopeValid(p)||!fresh(p,now)||p.sourceId!==approvedSourceId||
  p.tenantScopeDigest!==approvedTenantScopeDigest||
  !HEX.test(approvedTenantScopeDigest??''))
  return hold('QL501_FRESH_PINNED_ORIGINAL_SOURCE_SIGNATURE_REQUIRED');
 return {state:'QL501_SOURCE_SIGNED_METADATA_TRIAL_REVIEW_HELD',
  trialId:p.trialId,sourceId:p.sourceId,sourceEventId:p.sourceEventId,
  eventVersion:p.eventVersion,tenantScopeDigest:p.tenantScopeDigest,
  sourcePacketDigest:hash(sourcePacket),
  sourceSignatureVerified:true,
  originalSourceRuntimeCertified:false,providerReceiptObserved:false,
  humanAcknowledged:false,customerWrites:false,automaticNetworkSend:false};
}
export function verifyQl501ProviderAck({sourcePacket,providerPacket,
 sourcePublicKeyPem,providerPublicKeyPem,
 approvedSourceId,approvedTenantScopeDigest,now=Date.now()}={}){
 const source=verifyQl501SourcePacket({sourcePacket,sourcePublicKeyPem,
  approvedSourceId,approvedTenantScopeDigest,now});
 if(source.state==='HOLD')return source;
 const p=providerPacket?.payload,s=sourcePacket.payload;
 if(!checkedPacket(providerPacket,providerPublicKeyPem,PROVIDER)||
  !fresh(p,now)||p.schema!==QL501_PROVIDER_SCHEMA||
  p.trialId!==s.trialId||p.sourceId!==s.sourceId||
  p.sourceEventId!==s.sourceEventId||
  p.tenantScopeDigest!==s.tenantScopeDigest||
  p.sourcePacketDigest!==source.sourcePacketDigest||
  !ID.test(p.providerReceiptId??'')||!ID.test(p.providerActorId??'')||
  !at(p.receivedAtMs)||p.receivedAtMs<s.issuedAtMs||
  p.receivedAtMs>p.issuedAtMs||p.receivedAtMs>now||
  !['HOLD_FOR_INDEPENDENT_REVIEW','DENY'].includes(p.decision)||
  p.customerDataIncluded!==false||p.authorityTransfer!==false||
  pin(sourcePublicKeyPem)===pin(providerPublicKeyPem))
  return hold('QL501_PINNED_PROVIDER_ACK_MISSING_STALE_OR_MISMATCHED');
 return {state:'QL501_PROVIDER_SIGNED_ACK_REVIEW_HELD',
  trialId:s.trialId,sourceId:s.sourceId,
  sourceEventId:s.sourceEventId,
  tenantScopeDigest:s.tenantScopeDigest,
  sourcePacketDigest:source.sourcePacketDigest,
  providerPacketDigest:hash(providerPacket),
  providerReceiptId:p.providerReceiptId,providerDecision:p.decision,
  sourceSignatureVerified:true,providerSignatureVerified:true,
  providerClaimedReceiptAtMs:p.receivedAtMs,
  verifiedNetworkTransferByThisVerifier:false,
  originalWindowsPhysicallyCertified:false,
  humanAcknowledged:false,productionReleaseAuthorized:false,
  customerWrites:false,automaticNetworkSend:false};
}
export function reviewQl501IndependentProductionHold({sourcePacket,
 providerPacket,reviewerPacket,approvedPins,approvedSourceId,
 approvedTenantScopeDigest,now=Date.now()}={}){
 if(!exact(approvedPins,['sourcePublicKeyPem','providerPublicKeyPem',
  'independentReviewerPublicKeyPem']))return hold('QL501_THREE_DISTINCT_PREPINNED_SIGNERS_REQUIRED');
 const digests=Object.values(approvedPins).map(pin);
 if(digests.some(x=>!x)||new Set(digests).size!==3)
  return hold('QL501_SIGNER_PIN_REUSE_OR_MISSING');
 const ack=verifyQl501ProviderAck({sourcePacket,providerPacket,
  sourcePublicKeyPem:approvedPins.sourcePublicKeyPem,
  providerPublicKeyPem:approvedPins.providerPublicKeyPem,
  approvedSourceId,approvedTenantScopeDigest,now});
 if(ack.state==='HOLD')return ack;
 const p=reviewerPacket?.payload;
 if(!checkedPacket(reviewerPacket,approvedPins.independentReviewerPublicKeyPem,REVIEW)||
  !fresh(p,now)||p.schema!==QL501_REVIEW_SCHEMA||
  p.trialId!==ack.trialId||p.sourceEventId!==ack.sourceEventId||
  p.sourcePacketDigest!==ack.sourcePacketDigest||
  p.providerPacketDigest!==ack.providerPacketDigest||
  !ID.test(p.reviewerActorId??'')||
  !['HOLD_PENDING_ORIGINAL_FIELD_EVIDENCE','DENY'].includes(p.decision)||
  p.productionReleaseRequested!==false||
  p.customerDataIncluded!==false||p.authorityTransfer!==false)
  return hold('QL501_INDEPENDENT_RELEASE_HOLD_REVIEW_REQUIRED');
 return {state:'QL501_THREE_SIGNER_MASTER_RECEIPT_REVIEW_HELD',
  trialId:ack.trialId,sourceEventId:ack.sourceEventId,
  sourcePacketDigest:ack.sourcePacketDigest,
  providerPacketDigest:ack.providerPacketDigest,
  reviewerPacketDigest:hash(reviewerPacket),
  sourceProviderReviewerSignaturesVerified:true,
  originalWindowsPhysicallyCertified:false,
  independentProviderRuntimeObserved:false,
  providerAckObservedOverRealNetwork:false,
  independentlyObservedDelivery:false,
  humanAcknowledged:false,productionReleaseAuthorized:false,
  customerWrites:false,automaticNetworkSend:false};
}
function endpoint(config){
 try{
  if(!exact(config,['url','serverCertificateSha256','caPem',
   'clientCertificatePem','clientKeyPem'])||
   !HEX.test(config.serverCertificateSha256??''))return null;
  const u=new URL(config.url);
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||
   u.pathname!==QL501_ENDPOINT_PATH||
   !/^([a-z0-9-]+\.)+[a-z0-9-]+$/i.test(u.hostname)||
   /\.(example|test|invalid|localhost|local)$/i.test(u.hostname)||
   ![443,8443].includes(Number(u.port||443)))return null;
  if(['caPem','clientCertificatePem','clientKeyPem'].some(n=>
   !(typeof config[n]==='string'||Buffer.isBuffer(config[n]))||
   config[n].length<32||config[n].length>131072))return null;
  return u;
 }catch{return null;}
}
/** Exactly one manually initiated HTTPS POST. No redirect, retries, customer
 * payload, persistent keepalive, or live release authority.
 */
export async function runQl501OneSupervisedTrial({config,sourcePacket,
 approvedPins,approvedSourceId,approvedTenantScopeDigest,
 now=()=>Date.now()}={}){
 if(!authority())return hold('QL501_ORIGINAL_WINDOWS_SUPERVISED_OPERATOR_REQUIRED');
 const url=endpoint(config);
 if(!url||!exact(approvedPins,['sourcePublicKeyPem','providerPublicKeyPem',
  'independentReviewerPublicKeyPem']))
  return hold('QL501_PREAPPROVED_TLS13_PROVIDER_AND_KEYS_REQUIRED');
 const verifySource=verifyQl501SourcePacket({sourcePacket,
  sourcePublicKeyPem:approvedPins.sourcePublicKeyPem,
  approvedSourceId,approvedTenantScopeDigest,now:now()});
 if(verifySource.state==='HOLD')return verifySource;
 return await new Promise(resolve=>{
  let req,done=false;
  const finish=result=>{if(!done){done=true;resolve(result);}};
  const body=JSON.stringify({sourcePacket});
  try{
   if(Buffer.byteLength(body)>4096)return finish(hold('QL501_METADATA_TRIAL_TOO_LARGE'));
   req=https.request(url,{method:'POST',timeout:5000,agent:false,
    minVersion:'TLSv1.3',maxVersion:'TLSv1.3',
    rejectUnauthorized:true,ca:config.caPem,cert:config.clientCertificatePem,
    key:config.clientKeyPem,
    headers:{'content-type':'application/json','accept':'application/json',
     'cache-control':'no-store','content-length':Buffer.byteLength(body)},
    checkServerIdentity:(hostname,certificate)=>{
     const err=checkServerIdentity(hostname,certificate);
     if(err)return err;
     return String(certificate.fingerprint256??'')
      .replaceAll(':','').toLowerCase()===config.serverCertificateSha256?
      undefined:Error('QL501_TLS_CERT_PIN_MISMATCH');
    }},response=>{
     if(response.statusCode!==200||
      !/^application\/json(?:;|$)/i.test(String(response.headers['content-type']??''))){
      response.resume();return finish(hold('QL501_PROVIDER_RESPONSE_STATUS_HOLD'));
     }
     let bytes=0,raw='';
     response.on('data',chunk=>{
      bytes+=chunk.length;
      if(bytes>8192){req.destroy();finish(hold('QL501_PROVIDER_RESPONSE_OVERSIZE'))}
      else raw+=chunk.toString('utf8');
     });
     response.on('end',()=>{
      if(done)return;
      try{
       const providerPacket=JSON.parse(raw);
       const result=verifyQl501ProviderAck({sourcePacket,providerPacket,
        sourcePublicKeyPem:approvedPins.sourcePublicKeyPem,
        providerPublicKeyPem:approvedPins.providerPublicKeyPem,
        approvedSourceId,approvedTenantScopeDigest,now:now()});
       finish(result.state==='HOLD'?result:{...result,
        state:'QL501_PINNED_LIVE_MASTER_SIGNED_ACK_OBSERVED_REVIEW_HELD',
        actualPinnedClientTlsRequestCompleted:true,
        independentThirdPartyNetworkWitness:false,
        productionReleaseAuthorized:false,humanAcknowledged:false});
      }catch{finish(hold('QL501_UNREADABLE_PROVIDER_ACK'));}
     });
    });
   req.once('timeout',()=>req.destroy(Error('QL501_SINGLE_TRIAL_TIMEOUT')));
   req.once('error',()=>finish(hold('QL501_ORIGINAL_MASTER_TLS_OR_TRANSPORT_FAILED')));
   req.end(body);
  }catch{finish(hold('QL501_SUPERVISED_TRIAL_SETUP_FAILED'));}
 });
}
/** Server-side adapter: a real independent provider must install/operate this
 * explicitly, with a durable journal and separately controlled signing key.
 */
export function createQl501ProviderReceiptAdapter({approvedSourceId,
 approvedTenantScopeDigest,sourcePublicKeyPem,providerPublicKeyPem,
 clientCertificateSha256,privateLedger,signProviderAck,
 now=()=>Date.now()}={}){
 async function handle({request,sourcePacket}={}){
  if(request?.method!=='POST'||request.url!==QL501_ENDPOINT_PATH||
   !/^application\/json(?:;|$)/i.test(String(request.headers?.['content-type']??'')))
   return hold('QL501_EXACT_PRIVATE_POST_REQUIRED');
  const tls=observeQl496ActualMutualTls(request);
  if(tls.state==='HOLD'||tls.clientCertificateSha256!==clientCertificateSha256||
   !HEX.test(clientCertificateSha256??''))
   return hold('QL501_GENUINE_PINNED_ORIGINAL_MTLS_CLIENT_REQUIRED');
  const src=verifyQl501SourcePacket({sourcePacket,sourcePublicKeyPem,
   approvedSourceId,approvedTenantScopeDigest,now:now()});
  if(src.state==='HOLD')return src;
  if(typeof privateLedger?.reserve!=='function'||typeof privateLedger?.commit!=='function'||
   typeof signProviderAck!=='function'||!key(providerPublicKeyPem)||
   pin(sourcePublicKeyPem)===pin(providerPublicKeyPem))
   return hold('QL501_SEPARATE_PROVIDER_SIGNER_AND_DURABLE_LEDGER_REQUIRED');
  try{
   const reserved=await privateLedger.reserve({
    trialId:src.trialId,sourcePacketDigest:src.sourcePacketDigest});
   if(reserved?.state!=='DURABLY_RESERVED')
    return hold('QL501_REPLAY_OR_ORIGINAL_PROVIDER_JOURNAL_UNAVAILABLE');
   const timestamp=now(),payload={schema:QL501_PROVIDER_SCHEMA,
    trialId:src.trialId,sourceId:src.sourceId,sourceEventId:src.sourceEventId,
    tenantScopeDigest:src.tenantScopeDigest,
    sourcePacketDigest:src.sourcePacketDigest,
    providerReceiptId:reserved.receiptId,
    providerActorId:reserved.providerActorId,
    receivedAtMs:timestamp,issuedAtMs:timestamp,expiresAtMs:timestamp+60000,
    decision:'HOLD_FOR_INDEPENDENT_REVIEW',
    customerDataIncluded:false,authorityTransfer:false};
   const packet=await signProviderAck(payload);
   if(canonicalize(packet?.payload)!==canonicalize(payload)||
    verifyQl501ProviderAck({sourcePacket,providerPacket:packet,
     sourcePublicKeyPem,providerPublicKeyPem,
     approvedSourceId,approvedTenantScopeDigest,now:now()}).state==='HOLD')
    return hold('QL501_PROVIDER_SIGNER_PIN_OR_ACK_MISMATCH');
   const committed=await privateLedger.commit({
    trialId:src.trialId,providerPacketDigest:hash(packet)});
   if(committed?.state!=='DURABLY_COMMITTED')
    return hold('QL501_ORIGINAL_PROVIDER_ACK_NOT_DURABLY_COMMITTED');
   return {state:'QL501_PRIVATE_PROVIDER_SIGNED_ACK_READY_REVIEW_HELD',
    statusCode:200,contentType:'application/json',providerPacket:packet,
    originalProviderJournalHead:committed.journalHead??null,
    productionReleaseAuthorized:false,customerWrites:false,
    automaticNetworkSend:false};
  }catch{return hold('QL501_PROVIDER_CUSTODY_OR_SIGNER_FAILURE');}
 }
 return Object.freeze({handle,networkListener:false,automaticReceiver:false,
  customerWrites:false});
}
