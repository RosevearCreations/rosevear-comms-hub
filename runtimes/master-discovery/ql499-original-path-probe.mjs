/**
 * QL-499: supervised original-host mTLS transport observation and independent
 * signed path review. No HTTP request, source message, receiver activation,
 * credential enrollment, unattended network attempt or customer writes.
 */
import tls from 'node:tls';
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {reviewQl498WithOriginalEvidence} from './ql498-cross-host-runtime-evidence.mjs';

export const QL499_PATH_SCHEMA='rosevear.comms.ql499.independent-path-observation.v1';
const HEX=/^[0-9a-f]{64}$/;
const ID=/^[a-zA-Z0-9_-]{8,96}$/;
const ROLES=['original-windows-owner','master-operator','independent-network-auditor'];
const FIELDS=['schema','ceremonyId','trialId','role','actorId','endpointUrl',
 'serverCertificateSha256','localProbeDigest','ql498RuntimeEvidenceDigest',
 'observationDigest','issuedAtMs','expiresAtMs','requestedAction',
 'customerDataIncluded','authorityTransfer'];
const SHARED=FIELDS.filter(k=>!['role','actorId','observationDigest','issuedAtMs','expiresAtMs'].includes(k));
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const exact=(v,fields)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===fields.length&&fields.every(k=>Object.hasOwn(v,k));
const time=x=>Number.isSafeInteger(x)&&x>0;
const hold=(reason)=>({state:'HOLD',reason,
 networkPathCertified:false,masterRuntimeActivationCertified:false,
 originalWindowsPhysicallyCertified:false,deliveryCertified:false,
 sourceOperationallyCertified:false,customerWrites:false,
 automaticNetworkSend:false});
function endpoint(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||
   u.pathname!=='/internal/comms/master-delivery-trial'||
   !/^([a-z0-9-]+\.)+[a-z0-9-]+$/i.test(u.hostname)||
   /(^localhost$|\.localhost$|\.local$|\.example$|\.test$|\.invalid$)/i.test(u.hostname)||
   !['443','8443',''].includes(u.port))return null;
  return {url:u.href,host:u.hostname,port:Number(u.port||443)};
 }catch{return null}
}
function key(pem){
 try{const k=createPublicKey(pem);return k.asymmetricKeyType==='ed25519'?k:null;}
 catch{return null;}
}
function fingerprint(pem){
 const k=key(pem);
 return k?createHash('sha256').update(k.export({type:'spki',format:'der'})).digest('hex'):null;
}
function signed(packet,pem){
 try{
  if(!exact(packet,['payload','signature'])||
   !exact(packet.payload,FIELDS)||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??''))return false;
  const k=key(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!k&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),k,sig);
 }catch{return false;}
}
const fresh=(p,now)=>time(p.issuedAtMs)&&p.issuedAtMs<=now&&
 now-p.issuedAtMs<=120000&&time(p.expiresAtMs)&&p.expiresAtMs>now&&
 p.expiresAtMs-p.issuedAtMs<=300000;

/** Only a genuine socket supplied by the local TLS client should reach here.
 * Callers cannot turn a signed assertion into an independently certified path.
 */
export function inspectQl499TlsSocket({socket,endpointUrl,expectedServerCertificateSha256,
 observedAtMs=Date.now()}={}){
 const e=endpoint(endpointUrl);
 if(!e||!HEX.test(expectedServerCertificateSha256??'')||!time(observedAtMs))
  return hold('QL499_PREAPPROVED_ENDPOINT_AND_CERTIFICATE_PIN_REQUIRED');
 try{
  if(socket?.encrypted!==true||socket.authorized!==true||
   socket.getProtocol?.()!=='TLSv1.3')
   return hold('QL499_AUTHORIZED_TLS13_SOCKET_REQUIRED');
  const peer=socket.getPeerCertificate?.(true);
  if(!Buffer.isBuffer(peer?.raw)||peer.raw.length<32)
   return hold('QL499_ORIGINAL_PEER_CERTIFICATE_REQUIRED');
  const observed=createHash('sha256').update(peer.raw).digest('hex');
  if(observed!==expectedServerCertificateSha256)
   return hold('QL499_MASTER_CERTIFICATE_PIN_MISMATCH');
  const projection={endpointUrl:e.url,serverCertificateSha256:observed,
   observedAtMs,tlsProtocol:'TLSv1.3',httpRequestSent:false};
  return {state:'QL499_TLS13_SERVER_CERTIFICATE_PIN_OBSERVED_REVIEW_HELD',
   ...projection,localProbeDigest:hash(projection),
   tls13PeerCertificateMatched:true,
   clientCertificateSubmittedToHandshake:true,
   serverRequiredClientAuthenticationVerified:false,
   independentMasterNetworkPathCertified:false,
   originalWindowsPhysicallyCertified:false,
   deliveryCertified:false,automaticNetworkSend:false,customerWrites:false};
 }catch{return hold('QL499_TLS13_PEER_READBACK_FAILED');}
}
/** Actual, bounded TLS connection with mTLS client credentials; no HTTP bytes.
 * The original owner must separately trigger this; CI never invokes this path.
 */
export async function probeQl499ActualTls({endpointUrl,
 expectedServerCertificateSha256,caPem,clientCertificatePem,clientKeyPem,
 timeoutMs=5000}={}){
 const e=endpoint(endpointUrl);
 const certInputs=[caPem,clientCertificatePem,clientKeyPem];
 if(!e||!HEX.test(expectedServerCertificateSha256??'')||
  !Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>10000||
  certInputs.some(x=>!(Buffer.isBuffer(x)||typeof x==='string')||
   x.length<32||x.length>131072))
  return hold('QL499_OWNER_APPROVED_PRIVATE_MTLS_MATERIAL_REQUIRED');
 return new Promise(resolve=>{
  let socket,settled=false;
  function finish(value){
   if(settled)return;
   settled=true;
   try{socket?.destroy();}catch{}
   resolve(value);
  }
  try{
   socket=tls.connect({host:e.host,port:e.port,servername:e.host,
    minVersion:'TLSv1.3',maxVersion:'TLSv1.3',
    rejectUnauthorized:true,ca:caPem,cert:clientCertificatePem,
    key:clientKeyPem,checkServerIdentity:tls.checkServerIdentity});
   socket.setTimeout(timeoutMs);
   socket.once('secureConnect',()=>finish(inspectQl499TlsSocket({
    socket,endpointUrl:e.url,expectedServerCertificateSha256})));
   socket.once('error',()=>finish(hold('QL499_ORIGINAL_TLS_PROBE_CONNECTION_FAILED')));
   socket.once('timeout',()=>finish(hold('QL499_ORIGINAL_TLS_PROBE_TIMEOUT')));
   socket.once('close',()=>finish(hold('QL499_ORIGINAL_TLS_SOCKET_CLOSED')));
  }catch{finish(hold('QL499_ORIGINAL_TLS_PROBE_SETUP_FAILED'));}
 });
}
/** Independent signers can review observations, not certify causation or delivery. */
export function reviewQl499IndependentPathClaims({ql498Result,localProbe,
 witnessPackets,approvedPins,now=Date.now()}={}){
 if(ql498Result?.state!=='QL498_GENUINE_SIGNED_EVIDENCE_REVIEW_HELD'||
  localProbe?.state!=='QL499_TLS13_SERVER_CERTIFICATE_PIN_OBSERVED_REVIEW_HELD'||
  localProbe.tls13PeerCertificateMatched!==true||
  localProbe.httpRequestSent!==false||
  !HEX.test(localProbe.localProbeDigest??'')||
  !HEX.test(ql498Result.signedRuntimeEvidenceDigest??''))
  return hold('QL499_REVERIFIED_QL498_AND_ORIGINAL_TLS_OBSERVATION_REQUIRED');
 if(!exact(approvedPins,['originalOwnerPublicKeyPem','masterOperatorPublicKeyPem',
   'networkAuditorPublicKeyPem'])||
  !exact(witnessPackets,['ownerPacket','masterPacket','auditorPacket']))
  return hold('QL499_THREE_INDEPENDENT_PATH_SIGNERS_REQUIRED');
 const pems=[approvedPins.originalOwnerPublicKeyPem,
  approvedPins.masterOperatorPublicKeyPem,approvedPins.networkAuditorPublicKeyPem];
 const ids=pems.map(fingerprint);
 if(ids.some(x=>!x)||new Set(ids).size!==3)
  return hold('QL499_DISTINCT_PREPINNED_SIGNERS_REQUIRED');
 const packets=[witnessPackets.ownerPacket,witnessPackets.masterPacket,
  witnessPackets.auditorPacket];
 if(packets.some((p,i)=>!signed(p,pems[i])||
  p.payload.role!==ROLES[i]||!fresh(p.payload,now)))
  return hold('QL499_FRESH_EXTERNAL_PROVIDER_AND_ORIGINAL_OWNER_SIGNATURES_REQUIRED');
 const [first,...rest]=packets.map(x=>x.payload);
 if(first.schema!==QL499_PATH_SCHEMA||
  !ID.test(first.ceremonyId??'')||!ID.test(first.trialId??'')||
  !ID.test(first.actorId??'')||
  packets.some(p=>!ID.test(p.payload.actorId??'')||
   !HEX.test(p.payload.observationDigest??''))||
  new Set(packets.map(p=>p.payload.actorId)).size!==3||
  new Set(packets.map(p=>p.payload.observationDigest)).size!==3||
  rest.some(x=>SHARED.some(k=>x[k]!==first[k]))||
  first.ceremonyId!==ql498Result.ceremonyId||
  first.trialId!==ql498Result.trialId||
  first.endpointUrl!==localProbe.endpointUrl||
  first.serverCertificateSha256!==localProbe.serverCertificateSha256||
  first.localProbeDigest!==localProbe.localProbeDigest||
  first.ql498RuntimeEvidenceDigest!==ql498Result.signedRuntimeEvidenceDigest||
  first.requestedAction!=='INDEPENDENT_NETWORK_PATH_REVIEW_ONLY'||
  first.customerDataIncluded!==false||first.authorityTransfer!==false)
  return hold('QL499_CROSS_HOST_DIGEST_OR_CEREMONY_SCOPE_MISMATCH');
 return {state:'QL499_SIGNED_CROSS_HOST_PATH_CLAIMS_REVIEW_HELD',
  ceremonyId:first.ceremonyId,trialId:first.trialId,
  pathWitnessDigest:hash(packets.map(hash)),
  threeDistinctPathSignaturesVerified:true,
  localTlsSocketObservedByReviewFunction:false,
  independentNetworkPathCertified:false,
  originalWindowsPhysicallyCertified:false,
  masterRuntimeActivationCertified:false,deliveryCertified:false,
  customerWrites:false,automaticNetworkSend:false};
}
/** Do not trust caller-supplied QL498 review flags without original packets. */
export function reviewQl499WithOriginalEvidence({ql498Evidence,localProbe,
 witnessPackets,approvedPins,now=Date.now()}={}){
 if(!ql498Evidence)return hold('QL499_ORIGINAL_QL497_QL498_SIGNED_INPUTS_REQUIRED');
 const review=reviewQl498WithOriginalEvidence({...ql498Evidence,now});
 const result=reviewQl499IndependentPathClaims({ql498Result:review,
  localProbe,witnessPackets,approvedPins,now});
 return result.state==='HOLD'?result:{...result,
  ql497AndQl498OriginalSignaturesReverified:true,
  state:'QL499_ORIGINAL_SIGNED_PATH_REVIEW_HELD',
  independentNetworkPathCertified:false,masterRuntimeActivationCertified:false};
}
