/**
 * QL-503 server-only, opt-in, source/provider-signed durable import.
 *
 * This module NEVER creates a Supabase service-role client or starts a
 * provider listener. The operator of a separately approved server must supply
 * a PRIVATE server-role RPC gateway and independently pinned source/provider
 * verification keys. No component imports it in the public React bundle.
 *
 * The public database RPC itself only enforces durable structure and replay
 * invariants: Ed25519 packets MUST be verified here before calling the RPC.
 */
import {createHash} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {reviewQl502VersionedDelivery}
 from './ql502-provider-delivery-proof.mjs';

const sha=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,durableWrite:false,
 providerConnectionActivated:false,customerMessageSent:false,
 operationalProviderConfirmed:false,actualNetworkDeliveryObserved:false,
 humanAcknowledged:false});
const appNames=new Set(['icamp','yw','devilndove','rosiedazzlers']);
function exact(x,names){
 return !!x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).length===names.length&&names.every(k=>Object.hasOwn(x,k));
}
function authConfig(c){
 return exact(c,['approvedBrand','approvedTenantDigest','sourcePublicKeyPem',
  'providerPublicKeyPem','currentVersion','importEnabled'])&&
  appNames.has(c.approvedBrand)&&c.importEnabled===true&&
  /^[0-9a-f]{64}$/.test(c.approvedTenantDigest??'')&&
  typeof c.sourcePublicKeyPem==='string'&&
  typeof c.providerPublicKeyPem==='string'&&
  Number.isSafeInteger(c.currentVersion)&&c.currentVersion>0;
}

/** Readable metadata-only request for a verified pre-approved source packet.
 * sourcePacket may describe a saved intent with zero provider receipts.
 * Provider ACCEPTED must be signed, and DELIVERED must have its own distinct
 * signed stage. Neither can assert a human read or app-wide CONNECTED state.
 */
export function buildQl503VerifiedImport({
 sourcePacket,providerPackets=[],replyPacket=null,serverConfig,
 now=Date.now()
}={}){
 if(!authConfig(serverConfig))
  return hold('QL503_SEPARATELY_ENROLLED_SERVER_SOURCE_CONFIG_REQUIRED');
 const verdict=reviewQl502VersionedDelivery({
  sourcePacket,providerPackets,replyPacket,
  sourcePublicKeyPem:serverConfig.sourcePublicKeyPem,
  providerPublicKeyPem:serverConfig.providerPublicKeyPem,
  approvedBrand:serverConfig.approvedBrand,
  approvedTenantDigest:serverConfig.approvedTenantDigest,
  currentVersion:serverConfig.currentVersion,now
 });
 if(verdict.state!=='QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD')
  return hold('QL503_SOURCE_PROVIDER_OR_INBOUND_SIGNATURE_REVIEW_FAILED');
 const src=sourcePacket.payload;
 const events=providerPackets.map(packet=>{
  const p=packet.payload;
  return {id:p.eventId,kind:p.stage,digest:sha(packet),
   receipt:p.providerReceiptId,signer:'INDEPENDENT_PROVIDER',
   currentVersion:null,occurredAt:new Date(p.claimedAtMs).toISOString()};
 });
 if(replyPacket){
  const p=replyPacket.payload;
  events.push({id:p.eventId,kind:'INBOUND_REPLY',
   digest:sha(replyPacket),receipt:null,signer:'ORIGINAL_SOURCE',
   currentVersion:p.currentVersion,
   occurredAt:new Date(p.issuedAtMs).toISOString()});
 }
 return {state:'QL503_VERIFIED_IMPORT_PREPARED_REVIEW_HELD',
  args:{
   p_source_app:src.brand,p_tenant_digest:src.tenantDigest,
   p_thread_digest:src.threadDigest,p_message_key:src.messageId,
   p_message_version:src.messageVersion,p_content_digest:src.contentDigest,
   p_source_packet_digest:verdict.sourcePacketDigest,
   p_issued_at:new Date(src.issuedAtMs).toISOString(),
   p_events:events
  },
  providerAcceptedClaimVerified:verdict.providerAccepted,
  providerDeliveredClaimVerified:verdict.providerDelivered,
  superseded:verdict.superseded,replyNeedsReview:verdict.replyNeedsReview,
  liveNetworkWitnessVerified:false,humanAcknowledged:false,
  networkMessageSent:false,durableWrite:false};
}

/** This action is NOT callable from a browser. The only permitted gateway is
 * an authenticated PRIVATE, owner-enrolled server_role Supabase RPC client.
 * The original application and the independent provider keys stay separate.
 */
export async function persistQl503VerifiedImport({
 rpcGateway,sourcePacket,providerPackets=[],replyPacket=null,
 serverConfig,now=Date.now()
}={}){
 if(!rpcGateway||typeof rpcGateway.rpc!=='function')
  return hold('QL503_SERVER_ONLY_RPC_GATEWAY_REQUIRED');
 const reviewed=buildQl503VerifiedImport({
  sourcePacket,providerPackets,replyPacket,serverConfig,now});
 if(reviewed.state==='HOLD')return reviewed;
 try{
  const result=await rpcGateway.rpc('ql503_record_verified_delivery',reviewed.args);
  if(result?.error||result?.data?.state!=='DURABLE_METADATA_REVIEW_HELD'||
   result?.data?.messageKey!==reviewed.args.p_message_key||
   result?.data?.version!==reviewed.args.p_message_version)
   return hold('QL503_DATABASE_IMPORT_REJECTED_OR_UNVERIFIED');
  return {state:'QL503_DURABLE_SIGNED_METADATA_REVIEW_HELD',
   messageKey:reviewed.args.p_message_key,
   messageVersion:reviewed.args.p_message_version,
   tenantDigest:reviewed.args.p_tenant_digest,
   sourceApp:reviewed.args.p_source_app,
   eventsReviewed:result.data.evidenceReviewed,
   providerAcceptedClaimVerified:reviewed.providerAcceptedClaimVerified,
   providerDeliveredClaimVerified:reviewed.providerDeliveredClaimVerified,
   sourceProviderSignaturesVerified:true,durableWrite:true,
   actualProviderNetworkWitnessVerified:false,
   operatorSessionVerified:false,humanAcknowledged:false,
   customerMessageSent:false,receiverActivated:false,
   productionAuthorityTransferred:false};
 }catch{return hold('QL503_SERVER_RECEIPT_IMPORT_UNAVAILABLE');}
}
