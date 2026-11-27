/**
 * QL-502 — brand/tenant/version-scoped independently signed delivery evidence.
 * Never exposes raw customer text, cross-tenant mail or automatic send grants.
 * Provider acceptance and delivery are independent evidence states.
 * Actual network capture and customer acknowledgement are OUTSIDE this module.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
export const QL502_SOURCE_SCHEMA='rosevear.comms.ql502.source-versioned-message-intent.v1';
export const QL502_PROVIDER_SCHEMA='rosevear.comms.ql502.provider-delivery-evidence.v1';
export const QL502_REPLY_SCHEMA='rosevear.comms.ql502.owning-source-inbound-reply.v1';
const SOURCES=['icamp','yw','rosiedazzlers','devilndove'];
const SOURCE=['schema','sourceEventId','brand','tenantDigest','threadDigest','messageId',
 'contentDigest','messageVersion','issuedAtMs','expiresAtMs','purpose',
 'customerDataIncluded','authorityTransfer'];
const PROVIDER=['schema','eventId','brand','tenantDigest','messageId','messageVersion',
 'sourcePacketDigest','providerReceiptId','providerActorId','stage','claimedAtMs',
 'issuedAtMs','expiresAtMs','customerDataIncluded','authorityTransfer'];
const REPLY=['schema','eventId','brand','tenantDigest','threadDigest','messageId',
 'replyToVersion','currentVersion','sourceEventId','issuedAtMs','expiresAtMs',
 'requestedAction','customerDataIncluded','authorityTransfer'];
const ID=/^[A-Za-z0-9_-]{8,96}$/,HEX=/^[0-9a-f]{64}$/;
const hash=v=>createHash('sha256').update(canonicalize(v)).digest('hex');
const own=(obj,fields)=>!!obj&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).length===fields.length&&fields.every(k=>Object.hasOwn(obj,k));
const ms=x=>Number.isSafeInteger(x)&&x>0;
const recent=(p,now)=>ms(p.issuedAtMs)&&p.issuedAtMs<=now&&now-p.issuedAtMs<=120000&&
 ms(p.expiresAtMs)&&p.expiresAtMs>now&&p.expiresAtMs-p.issuedAtMs<=300000;
const hold=reason=>({state:'HOLD',reason,providerDelivered:false,
 providerAccepted:false,customerAcknowledged:false,liveNetworkObserved:false,
 tenantAuthorized:false,autoSend:false,customerWrites:false});
function key(pem){
 try{const k=createPublicKey(pem);return k.asymmetricKeyType==='ed25519'?k:null}
 catch{return null}
}
function fingerprint(pem){
 const k=key(pem);
 return k?createHash('sha256').update(k.export({type:'spki',format:'der'})).digest('hex'):null;
}
function signed(packet,pem,fields){
 try{
  if(!own(packet,['payload','signature'])||!own(packet.payload,fields)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const k=key(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!k&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),k,sig);
 }catch{return false}
}
export function reviewQl502VersionedDelivery({
 sourcePacket,providerPackets=[],replyPacket=null,
 sourcePublicKeyPem,providerPublicKeyPem,
 approvedBrand,approvedTenantDigest,currentVersion,now=Date.now()
}={}){
 if(!SOURCES.includes(approvedBrand)||!HEX.test(approvedTenantDigest??'')||
  !Number.isSafeInteger(currentVersion)||currentVersion<1||
  !signed(sourcePacket,sourcePublicKeyPem,SOURCE)||
  !key(providerPublicKeyPem)||
  fingerprint(sourcePublicKeyPem)===fingerprint(providerPublicKeyPem))
  return hold('QL502_PREAPPROVED_DISTINCT_SOURCE_AND_PROVIDER_SIGNATURES_REQUIRED');
 const source=sourcePacket.payload;
 if(source.schema!==QL502_SOURCE_SCHEMA||
  source.brand!==approvedBrand||source.tenantDigest!==approvedTenantDigest||
  !ID.test(source.sourceEventId??'')||!ID.test(source.messageId??'')||
  !HEX.test(source.threadDigest??'')||!HEX.test(source.contentDigest??'')||
  !Number.isSafeInteger(source.messageVersion)||source.messageVersion<1||
  source.messageVersion>currentVersion||
  source.purpose!=='SERVICE_INSTRUCTIONS_VERSIONED'||
  !recent(source,now)||source.customerDataIncluded!==false||
  source.authorityTransfer!==false)
  return hold('QL502_SOURCE_INTENT_EXPIRED_OR_OUT_OF_TENANT_VERSION_SCOPE');
 if(!Array.isArray(providerPackets)||providerPackets.length>4)return hold('QL502_BOUNDED_PROVIDER_RECEIPT_LIST_REQUIRED');
 const sourceDigest=hash(sourcePacket),seenEvents=new Set(),seenReceipts=new Set();
 let accepted=false,delivered=false,acceptedAt=null,deliveredAt=null,deliveryReceiptId=null;
 for(const packet of providerPackets){
  if(!signed(packet,providerPublicKeyPem,PROVIDER))
   return hold('QL502_UNSIGNED_PROVIDER_STATUS_DENIED');
  const p=packet.payload;
  if(p.schema!==QL502_PROVIDER_SCHEMA||p.brand!==approvedBrand||
   p.tenantDigest!==approvedTenantDigest||p.messageId!==source.messageId||
   p.messageVersion!==source.messageVersion||
   p.sourcePacketDigest!==sourceDigest||
   !ID.test(p.eventId??'')||seenEvents.has(p.eventId)||
   !ID.test(p.providerReceiptId??'')||seenReceipts.has(p.providerReceiptId)||
   !ID.test(p.providerActorId??'')||!recent(p,now)||
   !ms(p.claimedAtMs)||p.claimedAtMs<source.issuedAtMs||
   p.claimedAtMs>p.issuedAtMs||
   !['PROVIDER_ACCEPTED','PROVIDER_DELIVERED'].includes(p.stage)||
   p.customerDataIncluded!==false||p.authorityTransfer!==false)
   return hold('QL502_PROVIDER_CLAIM_TENANT_VERSION_REPLAY_OR_TIMESTAMP_DRIFT');
  seenEvents.add(p.eventId);seenReceipts.add(p.providerReceiptId);
  if(p.stage==='PROVIDER_ACCEPTED'){
   if(accepted||delivered)return hold('QL502_PROVIDER_ACCEPTANCE_EVENT_OUT_OF_ORDER');
   accepted=true;acceptedAt=p.claimedAtMs;
  }else{
   if(!accepted||delivered||p.claimedAtMs<acceptedAt)
    return hold('QL502_DELIVERED_CLAIM_WITHOUT_PREVIOUS_ACCEPTANCE');
   delivered=true;deliveredAt=p.claimedAtMs;deliveryReceiptId=p.providerReceiptId;
  }
 }
 let replyNeedsReview=false,replyToVersion=null;
 if(replyPacket!==null){
  if(!signed(replyPacket,sourcePublicKeyPem,REPLY))
   return hold('QL502_OWNING_SOURCE_SIGNED_INBOUND_REPLY_REQUIRED');
  const p=replyPacket.payload;
  if(p.schema!==QL502_REPLY_SCHEMA||p.brand!==approvedBrand||
   p.tenantDigest!==approvedTenantDigest||p.threadDigest!==source.threadDigest||
   p.messageId!==source.messageId||p.sourceEventId!==source.sourceEventId||
   !ID.test(p.eventId??'')||seenEvents.has(p.eventId)||
   p.currentVersion!==currentVersion||
   p.replyToVersion!==source.messageVersion||
   p.replyToVersion>=p.currentVersion||!recent(p,now)||
   p.requestedAction!=='REPLY_TO_SUPERSEDED_VERSION_REVIEW_ONLY'||
   p.customerDataIncluded!==false||p.authorityTransfer!==false)
   return hold('QL502_CROSS_TENANT_OR_UNMATCHED_REPLY_VERSION');
  replyNeedsReview=true;replyToVersion=p.replyToVersion;
 }
 return {state:'QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD',
  brand:approvedBrand,tenantDigest:approvedTenantDigest,
  messageId:source.messageId,messageVersion:source.messageVersion,currentVersion,
  superseded:source.messageVersion<currentVersion,
  sourcePacketDigest:sourceDigest,
  providerAccepted:accepted,providerDelivered:delivered,
  acceptedClaimAtMs:acceptedAt,deliveredClaimAtMs:deliveredAt,
  deliveryReceiptId,replyNeedsReview,replyToVersion,
  originalSourceSignatureVerified:true,
  independentProviderSignaturesVerified:providerPackets.length>0,
  owningSourceReplySignatureVerified:replyPacket!==null,
  providerEvidenceIsSignedClaimOnly:true,
  actualNetworkDeliveryIndependentlyObserved:false,
  customerAcknowledged:false,
  authenticatedOperatorSessionVerified:false,tenantAuthorized:false,
  productionSendEnabled:false,autoSend:false,customerWrites:false};
}
export function reviewQl502RetryPolicy({
 brand,tenantDigest,approvedBrand,approvedTenantDigest,
 authorizedOperator,consent,requestedVersion,currentVersion,
 cancelled=false,slotFilled=false,disputedLine=false,providerHealthy=false,
 expiresAtMs,now=Date.now()
}={}){
 const reason=
  brand!==approvedBrand||!SOURCES.includes(brand)||
   tenantDigest!==approvedTenantDigest||!HEX.test(tenantDigest??'')||
   authorizedOperator!==true?'SCOPE_OR_OPERATOR_DENIED':
  !Number.isSafeInteger(requestedVersion)||requestedVersion<1||
   requestedVersion!==currentVersion?'STALE_VERSION':
  !ms(expiresAtMs)||expiresAtMs<=now?'EXPIRED':
  consent!=='SERVICE_ALLOWED'?'OPT_OUT_OR_CONSENT_UNKNOWN':
  cancelled?'CANCELLED':
  slotFilled?'OFFER_FILLED':
  disputedLine?'DISPUTED_CHARGE':
  !providerHealthy?'PROVIDER_OUTAGE':null;
 if(reason)return {state:'HOLD',reason,canSend:false,customerWrites:false};
 return {state:'PRECHECK_ONLY',reason:'REQUERY_LIVE_OWNER_PERMISSION_AND_PROVIDER_BEFORE_SEND',
  canSend:false,customerWrites:false};
}
