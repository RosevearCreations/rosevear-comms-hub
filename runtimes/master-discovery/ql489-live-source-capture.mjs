/**
 * QL-489: one-source-at-a-time ORIGINAL Windows supervised live capture.
 * mTLS transport + fresh independent source/owner/reviewer signatures + signed
 * Windows witness are mandatory. A signed host claim is not physical proof.
 * No customer effects, auto polling, public routes, branch writes or grants.
 */
import {createHash,createPublicKey,verify,randomBytes} from 'node:crypto';
import {QL485_SOURCE_IDS,verifyQl485SourceNotice} from './ql485-signed-release-negotiation.mjs';
import {canonicalize} from './manifest.mjs';
import {probeQl488PrivateEndpoint,validateQl488Enrollment}
 from './ql488-original-host-transport.mjs';

export const QL489_WITNESS_SCHEMA='rosevear.comms.ql489.windows-transport-witness.v1';
export const QL489_EXCEPTION_SCHEMA='rosevear.comms.ql489.signed-exception-closure.v1';
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[a-zA-Z0-9_-]{8,96}$/;
const FIELDS=['schema','witnessId','sourceId','windowsHost','windowsUser',
 'serverCertificateSha256','bundleDigest','transport','observedAtMs',
 'customerDataIncluded','authorityTransfer'];
const EXCEPTION_FIELDS=['schema','caseId','sourceId','captureRecordDigest','reasonCode',
 'disposition','role','actorId','issuedAtMs','expiresAtMs','authorityTransfer'];
const BUNDLE_FIELDS=['sourceId','noticePacket','sourceAttestationPacket','ownerPacket','reviewerPacket'];
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(x=>Object.hasOwn(o,x));
const digest=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,originalWindowsPhysicallyCertified:false,
 sourceAuthority:false,customerWrites:false,automaticMerge:false});
function pinned(pem){
 try{const k=createPublicKey(pem);return k.asymmetricKeyType==='ed25519'?k:null}
 catch{return null}
}
function signed(packet,pem,fields){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,fields)||
   typeof packet.signature!=='string'||!/^[A-Za-z0-9_-]{86}$/.test(packet.signature))
   return false;
  const key=pinned(pem),sig=Buffer.from(packet.signature,'base64url');
  return !!key&&sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),key,sig);
 }catch{return false}
}
function fresh(at,now){
 return Number.isSafeInteger(at)&&at>0&&at<=now&&now-at<=120000;
}
function registryTrusted(snap){
 return snap?.state==='PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD'&&
  snap.sourceCount===6&&HEX.test(snap.registryDigest??'')&&
  QL485_SOURCE_IDS.every(id=>snap.sources?.[id]&&
   snap.sources[id].state!=='PRIVATE_SOURCE_ATTESTATION_TAMPER_HOLD');
}
/**
 * This constructor accepts a transport function for deterministic tests; the
 * original-host CLI wires the actual QL488 pinned HTTPS/mTLS client.
 */
export function createQl489LiveCapture({
 endpoints,pins,exceptionPins,windowsHostPublicKeyPem,registry,journal,
 transport=probeQl488PrivateEndpoint,signWitness,now=()=>Date.now()
}={}){
 validateQl488Enrollment(endpoints);
 if(!exact(pins,QL485_SOURCE_IDS)||!exact(exceptionPins,QL485_SOURCE_IDS)||
  !pinned(windowsHostPublicKeyPem)||
  QL485_SOURCE_IDS.some(id=>!pins[id]||pins[id].sourceId!==id||
   pins[id].publicKeyPem===windowsHostPublicKeyPem||
   !pinned(exceptionPins[id]?.operatorPublicKeyPem)||
   !pinned(exceptionPins[id]?.reviewerPublicKeyPem)||
   exceptionPins[id].operatorPublicKeyPem===exceptionPins[id].reviewerPublicKeyPem||
   [exceptionPins[id].operatorPublicKeyPem,exceptionPins[id].reviewerPublicKeyPem].some(
    x=>x===pins[id].publicKeyPem||x===windowsHostPublicKeyPem))||
  new Set(QL485_SOURCE_IDS.flatMap(id=>[
   exceptionPins[id].operatorPublicKeyPem,exceptionPins[id].reviewerPublicKeyPem])).size!==12||
  typeof registry?.commit!=='function'||typeof registry?.summary!=='function'||
  typeof journal?.appendCapture!=='function'||typeof journal?.findCapture!=='function'||
  typeof journal?.appendClosure!=='function'||typeof transport!=='function'||
  typeof signWitness!=='function')
  throw Error('QL489_INDEPENDENT_PINS_REGISTRY_JOURNAL_AND_SUPERVISED_WITNESS_REQUIRED');

 async function captureOne(sourceId,{supervised=false}={}){
  if(!supervised||!QL485_SOURCE_IDS.includes(sourceId))
   return hold('QL489_EXPLICIT_ONE_SOURCE_SUPERVISION_REQUIRED');
  let before;
  try{before=registry.summary()}catch{return hold('QL489_PRIVATE_REGISTRY_UNAVAILABLE')}
  if(!registryTrusted(before))return hold('QL489_PRIVATE_REGISTRY_TAMPER_OR_SCOPE_HOLD');
  let observed;
  try{observed=await transport(endpoints[sourceId])}
  catch{return hold('QL489_PRIVATE_TRANSPORT_UNAVAILABLE')}
  if(observed?.state!=='MUTUAL_TLS_TRANSPORT_OBSERVED_UNVERIFIED'||
   observed.sourceId!==sourceId||!exact(observed.bundle,BUNDLE_FIELDS)||
   observed.bundle.sourceId!==sourceId)
   return hold('QL489_INDEPENDENT_LIVE_MTLS_BUNDLE_REQUIRED');
  const bundle=observed.bundle;
  // The external registry independently checks all THREE signer packets.
  const notice=verifyQl485SourceNotice({packet:bundle.noticePacket,pin:pins[sourceId],
   nowMs:now()});
  if(notice.state==='HOLD'||!notice.noticeDigest)
   return hold('QL489_FRESH_INDEPENDENT_SOURCE_NOTICE_REQUIRED');
  const payload={schema:QL489_WITNESS_SCHEMA,
   witnessId:'witness_'+randomBytes(12).toString('hex'),
   sourceId,windowsHost:'DESKTOP-AE894KC',windowsUser:'ree',
   serverCertificateSha256:endpoints[sourceId].serverCertificateSha256,
   bundleDigest:digest(bundle),transport:'MUTUAL_TLS_1_3',
   observedAtMs:now(),customerDataIncluded:false,authorityTransfer:false};
  let witness;
  try{witness=await signWitness(payload)}catch{return hold('QL489_WINDOWS_WITNESS_SIGNATURE_UNAVAILABLE')}
  if(!signed(witness,windowsHostPublicKeyPem,FIELDS)||
   canonicalize(witness.payload)!==canonicalize(payload)||
   !fresh(payload.observedAtMs,now()))
   return hold('QL489_PINNED_ORIGINAL_WINDOWS_WITNESS_SIGNATURE_REQUIRED');
  let committed,after;
  try{
   committed=registry.commit(bundle);
   after=registry.summary();
  }catch{return hold('QL489_SOURCE_ATTESTATION_REGISTRY_WRITE_FAILED')}
  if(!['DURABLE_PINNED_SOURCE_REVISION_CLAIM_RECORDED_HELD',
   'DURABLE_SOURCE_CONTRACT_CHANGE_PENDING_OWNER_APPROVAL'].includes(committed?.state)||
   committed.durableReadback!==true||!HEX.test(committed.recordDigest??'')||
   !registryTrusted(after)||
   after.sources[sourceId].evidenceDigest!==committed.recordDigest||
   after.sources[sourceId].attestationCount!==before.sources[sourceId].attestationCount+1)
   return hold('QL489_FRESH_THREE_SIGNER_DURABLE_ATTESTATION_REQUIRED');
  const recorded=journal.appendCapture({sourceId,receiptDigest:committed.recordDigest,
   registryDigest:after.registryDigest,witnessDigest:digest(witness),
   endpointFingerprint:endpoints[sourceId].serverCertificateSha256,
   bundleDigest:digest(bundle)});
  if(recorded?.state!=='DURABLE_SIGNED_CAPTURE_HELD')
   return hold('QL489_LIVE_CAPTURE_CUSTODY_WRITE_OR_REPLAY_HOLD');
  return {state:'DURABLE_SIGNED_LIVE_CAPTURE_HELD',sourceId,
   captureRecordDigest:recorded.recordDigest,sourceReceiptDigest:committed.recordDigest,
   signedWitnessDigest:digest(witness),sourceSignatureEvidenceRecorded:true,
   signedWindowsTransportClaimRecorded:true,originalWindowsPhysicallyCertified:false,
   liveSourceFieldCertified:false,authorityTransfer:false,customerWrites:false};
 }
 function closeException({sourceId,captureRecordDigest,operatorPacket,reviewerPacket}={}){
  if(!QL485_SOURCE_IDS.includes(sourceId)||!HEX.test(captureRecordDigest??''))
   return hold('QL489_CAPTURE_SCOPE_REQUIRED');
  const found=journal.findCapture(sourceId,captureRecordDigest);
  if(found?.state!=='CAPTURE_EVIDENCE_FOUND')
   return hold('QL489_ORIGINAL_DURABLE_CAPTURE_REQUIRED');
  let snap;
  try{snap=registry.summary()}catch{return hold('QL489_PRIVATE_REGISTRY_UNAVAILABLE')}
  if(!registryTrusted(snap)||snap.sources[sourceId].evidenceDigest!==found.record.receiptDigest||
   snap.registryDigest!==found.record.registryDigest)
   return hold('QL489_CAPTURE_REGISTRY_STALE_OR_TAMPERED');
  const op=operatorPacket?.payload,review=reviewerPacket?.payload;
  const trust=pins[sourceId],exceptionTrust=exceptionPins[sourceId];
  // Separately pinned operator and reviewer keys.
  const opPem=exceptionTrust?.operatorPublicKeyPem;
  const reviewPem=exceptionTrust?.reviewerPublicKeyPem;
  if(!pinned(opPem)||!pinned(reviewPem)||opPem===reviewPem||
   [opPem,reviewPem].includes(trust.publicKeyPem)||
   [opPem,reviewPem].includes(windowsHostPublicKeyPem)||
   !signed(operatorPacket,opPem,EXCEPTION_FIELDS)||
   !signed(reviewerPacket,reviewPem,EXCEPTION_FIELDS))
   return hold('QL489_INDEPENDENT_SIGNED_OPERATOR_AND_REVIEWER_REQUIRED');
  const valid=(p,role)=>p.schema===QL489_EXCEPTION_SCHEMA&&
   p.role===role&&p.sourceId===sourceId&&p.captureRecordDigest===captureRecordDigest&&
   ID.test(p.caseId??'')&&ID.test(p.actorId??'')&&
   /^[A-Z][A-Z0-9_]{4,63}$/.test(p.reasonCode??'')&&
   p.disposition==='CLOSED_FOR_OPERATOR_REVIEW_HELD'&&
   fresh(p.issuedAtMs,now())&&Number.isSafeInteger(p.expiresAtMs)&&
   p.expiresAtMs>now()&&p.expiresAtMs-p.issuedAtMs<=300000&&
   p.authorityTransfer===false;
  if(!valid(op,'operator')||!valid(review,'independent-reviewer')||
   op.caseId!==review.caseId||op.reasonCode!==review.reasonCode||
   op.disposition!==review.disposition||op.actorId===review.actorId)
   return hold('QL489_SAME_CASE_FRESH_DISTINCT_REVIEW_REQUIRED');
  const recorded=journal.appendClosure({sourceId,caseId:op.caseId,
   captureRecordDigest,operatorDigest:digest(operatorPacket),
   reviewerDigest:digest(reviewerPacket),reasonCode:op.reasonCode});
  if(recorded.state!=='DURABLE_SIGNED_EXCEPTION_CLOSED_HELD'&&
   recorded.state!=='DURABLE_EXCEPTION_CLOSURE_REPLAY_HELD')
   return hold('QL489_DURABLE_EXCEPTION_CLOSURE_UNAVAILABLE');
  return {state:recorded.state,sourceId,caseId:op.caseId,
   closureRecordDigest:recorded.recordDigest,sourceAuthority:false,
   productionAcceptance:false,originalWindowsPhysicallyCertified:false,
   customerWrites:false,automaticMerge:false};
 }
 return Object.freeze({captureOne,closeException,
  state:'QL489_ORIGINAL_WINDOWS_MANUAL_ONLY',autoPoll:false,
  automaticClosure:false,publicRoute:false,customerWrites:false,
  automaticMerge:false,sourceAuthority:false});
}
