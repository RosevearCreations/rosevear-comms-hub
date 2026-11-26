/**
 * QL-498: signed cross-host runtime *claims*, not activation authority.
 * Never starts a listener, contacts a remote endpoint, signs for an owner,
 * enables an operator, or certifies physical observation or network delivery.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {reviewQl497IndependentMasterEnrollment,
 reviewQl497IndependentOriginalDevice,reconcileQl497BidirectionalReceipts}
 from './ql497-independent-master-enrollment.mjs';

export const QL498_RUNTIME_SCHEMA='rosevear.comms.ql498.cross-host-runtime-observation.v1';
const HEX=/^[0-9a-f]{64}$/;
const ID=/^[a-zA-Z0-9_-]{8,96}$/;
const ROLES=['master-operator','original-host-owner','independent-provider'];
const FIELDS=['schema','ceremonyId','enrollmentDigest','hardwareAuditDigest',
 'trialId','sourceId','clientRecordDigest','masterRecordDigest',
 'masterEndpointUrl','masterCertificateSha256','deviceEnrollmentDigest',
 'runtimeInstanceDigest','observationDigest','role','actorId',
 'observedAtMs','issuedAtMs','expiresAtMs','runtimeStateClaim',
 'requestedAction','customerDataIncluded','authorityTransfer'];
const COMMON=FIELDS.filter(x=>!['role','actorId','observationDigest',
 'observedAtMs','issuedAtMs','expiresAtMs'].includes(x));
const digest=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const exact=(v,keys)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const time=x=>Number.isSafeInteger(x)&&x>0;
const hold=reason=>({state:'HOLD',reason,
 independentMasterActivationCertified:false,
 originalWindowsDeviceCertified:false,networkPathCertified:false,
 sourceOperationallyCertified:false,endToEndDeliveryCertified:false,
 productionMasterAccepted:false,automaticNetworkSend:false,customerWrites:false});
function publicKey(pem){
 try{
  const k=createPublicKey(pem);
  return k.asymmetricKeyType==='ed25519'?k:null;
 }catch{return null;}
}
function keyFingerprint(pem){
 const k=publicKey(pem);
 return k?createHash('sha256').update(k.export({type:'spki',format:'der'}))
  .digest('hex'):null;
}
function verified(packet,pem){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,FIELDS)||
   typeof packet.signature!=='string'||
   !/^[a-zA-Z0-9_-]{86}$/.test(packet.signature))return false;
  const sig=Buffer.from(packet.signature,'base64url');
  return sig.length===64&&sig.toString('base64url')===packet.signature&&
   verify(null,Buffer.from(canonicalize(packet.payload)),publicKey(pem),sig);
 }catch{return false;}
}
function fresh(payload,now){
 return time(payload.observedAtMs)&&time(payload.issuedAtMs)&&
  time(payload.expiresAtMs)&&payload.observedAtMs<=payload.issuedAtMs&&
  payload.issuedAtMs<=now&&now-payload.issuedAtMs<=120000&&
  payload.observedAtMs>=now-120000&&payload.expiresAtMs>now&&
  payload.expiresAtMs-payload.issuedAtMs<=300000;
}
/**
 * Verifies three independent signatures over *reported* runtime metadata.
 * QL497 review projections passed here are NOT trusted as raw source proof.
 * Consequently the result is never an activation or delivery certificate.
 */
export function reviewQl498SignedRuntimeClaims({enrollmentResult,
 hardwareResult,receiptResult,runtimePackets,approvedPins,now=Date.now()}={}){
 if(enrollmentResult?.state!=='QL497_THREE_PARTY_MASTER_ENDPOINT_ENROLLMENT_REVIEW_HELD'||
  hardwareResult?.state!=='QL497_INDEPENDENT_DEVICE_HARDWARE_AUDIT_REVIEW_HELD'||
  receiptResult?.state!=='QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD')
  return hold('QL498_COMPLETE_QL497_REVIEW_PROJECTIONS_REQUIRED');
 if(!exact(approvedPins,['masterOperatorPublicKeyPem',
   'originalOwnerPublicKeyPem','providerPublicKeyPem','masterSignerPublicKeyPem'])||
  !exact(runtimePackets,['masterOperatorPacket','originalOwnerPacket',
   'providerPacket']))return hold('QL498_THREE_INDEPENDENT_RUNTIME_WITNESS_CONFIG_REQUIRED');
 const keys=[approvedPins.masterOperatorPublicKeyPem,
  approvedPins.originalOwnerPublicKeyPem,approvedPins.providerPublicKeyPem,
  approvedPins.masterSignerPublicKeyPem];
 const keyHashes=keys.map(keyFingerprint);
 if(keyHashes.some(x=>!x)||new Set(keyHashes).size!==4||
  keyHashes[3]!==enrollmentResult.masterSignerDigest)
  return hold('QL498_DISTINCT_PINNED_MASTER_AND_WITNESS_KEYS_REQUIRED');
 const packets=[runtimePackets.masterOperatorPacket,
  runtimePackets.originalOwnerPacket,runtimePackets.providerPacket];
 if(packets.some((p,i)=>!verified(p,keys[i])||
  p.payload.role!==ROLES[i]||!fresh(p.payload,now)))
  return hold('QL498_THREE_FRESH_SIGNED_RUNTIME_OBSERVATIONS_REQUIRED');
 const [first,...others]=packets.map(x=>x.payload);
 if(first.schema!==QL498_RUNTIME_SCHEMA||!ID.test(first.ceremonyId??'')||
  !ID.test(first.trialId??'')||!ID.test(first.actorId??'')||
  ![first.enrollmentDigest,first.hardwareAuditDigest,
    first.clientRecordDigest,first.masterRecordDigest,
    first.masterCertificateSha256,first.deviceEnrollmentDigest,
    first.runtimeInstanceDigest].every(x=>HEX.test(x??''))||
  packets.some(p=>!HEX.test(p.payload.observationDigest??'')||
   !ID.test(p.payload.actorId??''))||
  new Set(packets.map(p=>p.payload.actorId)).size!==3||
  new Set(packets.map(p=>p.payload.observationDigest)).size!==3||
  others.some(p=>COMMON.some(k=>p[k]!==first[k]))||
  first.requestedAction!=='REVIEW_SUPERVISED_MASTER_RUNTIME_EVIDENCE_ONLY'||
  first.runtimeStateClaim!=='RUNNING_REPORTED_NOT_CERTIFIED'||
  first.customerDataIncluded!==false||first.authorityTransfer!==false||
  first.enrollmentDigest!==enrollmentResult.enrollmentDigest||
  first.hardwareAuditDigest!==hardwareResult.hardwareAuditDigest||
  first.trialId!==receiptResult.trialId||
  first.trialId!==hardwareResult.trialId||
  first.sourceId!==receiptResult.sourceId||
  first.clientRecordDigest!==receiptResult.clientRecordDigest||
  first.masterRecordDigest!==receiptResult.masterRecordDigest||
  first.masterEndpointUrl!==enrollmentResult.url||
  first.masterCertificateSha256!==enrollmentResult.tlsFingerprint||
  first.deviceEnrollmentDigest!==enrollmentResult.deviceEnrollmentDigest)
  return hold('QL498_CROSS_HOST_SCOPE_CERTIFICATE_OR_TRIAL_MISMATCH');
 return {
  state:'QL498_INDEPENDENT_SIGNED_RUNTIME_CLAIMS_REVIEW_HELD',
  ceremonyId:first.ceremonyId,trialId:first.trialId,
  signedRuntimeEvidenceDigest:digest(packets.map(digest)),
  threeDistinctWitnessSignaturesVerified:true,
  threeIndependentObservationDigestsReported:true,
  ql497RawInputsReverified:false,
  actualMasterServiceReachabilityVerified:false,
  originalHostPhysicalPresenceVerified:false,
  independentMasterActivationCertified:false,
  originalWindowsDeviceCertified:false,networkPathCertified:false,
  sourceOperationallyCertified:false,endToEndDeliveryCertified:false,
  productionMasterAccepted:false,automaticNetworkSend:false,customerWrites:false};
}
/** Recheck original signed QL497 inputs, never trust a caller's prior review flag. */
export function reviewQl498WithOriginalEvidence({enrollmentEvidence,
 hardwareEvidence,receiptEvidence,runtimePackets,approvedPins,now=Date.now()}={}){
 if(!enrollmentEvidence||!hardwareEvidence||!receiptEvidence)
  return hold('QL498_GENUINE_THREE_PART_QL497_ORIGINAL_EVIDENCE_REQUIRED');
 const enrollment=reviewQl497IndependentMasterEnrollment({...enrollmentEvidence,now});
 const hardware=reviewQl497IndependentOriginalDevice({...hardwareEvidence,now});
 const receipts=reconcileQl497BidirectionalReceipts({...receiptEvidence,now});
 if(enrollment.state!=='QL497_THREE_PARTY_MASTER_ENDPOINT_ENROLLMENT_REVIEW_HELD'||
  hardware.state!=='QL497_INDEPENDENT_DEVICE_HARDWARE_AUDIT_REVIEW_HELD'||
  receipts.state!=='QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD')
  return hold('QL498_QL497_RAW_CRYPTOGRAPHIC_REVERIFICATION_FAILED');
 const result=reviewQl498SignedRuntimeClaims({enrollmentResult:enrollment,
  hardwareResult:hardware,receiptResult:receipts,runtimePackets,
  approvedPins,now});
 if(result.state==='HOLD')return result;
 return {...result,ql497RawInputsReverified:true,
  state:'QL498_GENUINE_SIGNED_EVIDENCE_REVIEW_HELD',
  actualMasterServiceReachabilityVerified:false,
  independentMasterActivationCertified:false,
  originalWindowsDeviceCertified:false,endToEndDeliveryCertified:false};
}
