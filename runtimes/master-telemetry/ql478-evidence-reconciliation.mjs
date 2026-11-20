/**
 * QL478 three-way source + receiver + independent observer reconciliation.
 * An authentic signed offline audit is NOT proof of physical observation.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
import {verifyQl478SignedAck} from './ql478-private-pilot.mjs';
export const QL478_AUDIT='rosevear.comms.ql478.independent-first-ack-audit.v1';
const HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/;
const AUDIT_FIELDS=['schema','host','sourceMainSha','fieldDigest','messageId','ackDigest',
  'tlsClientLeafSha256','originalHostObserved','firstAckReadBackObserved',
  'workerTaskStillOnDemand','receiverOffAtStart','sourceClonesPreserved',
  'observerIndependent','observedAtMs','rebootPerformed','authorityTransfer'];
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&
 timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const held=(reason,more={})=>Object.freeze({state:'HOLD',reason,
  originalHostPhysicalObservationVerified:false,
  firstProductionAckIndependentlyCertified:false,
  installedWorkerCertified:false,productionReceiverEnabled:false,
  authoritativeSourceTransfer:false,sourceDeletions:0,...more});
export function reconcileQl478IndependentAck({field,ownerWitness,packet,ack,hostPin,receiverPin,
  auditorPacket,auditorPin,clientLeafSha256,nowMs=Date.now()}={}){
 if(field?.state!=='FIELD_EXPORT_REVIEW_HELD'||
   ownerWitness?.state!=='SIGNED_ORIGINAL_HOST_CLAIMS_REVIEW_HELD'||
   !eq(field.fieldDigest,ownerWitness.fieldDigest)||
   ownerWitness.sourceMainSha!==field.sourceMainSha||
   !SHA.test(field.sourceMainSha??''))
   return held('QL478_VERIFIED_FIELD_EXPORT_AND_DISTINCT_OWNER_WITNESS_CLAIMS_REQUIRED');
 if(!auditorPin||auditorPin===receiverPin||!verifyQl468Packet(auditorPacket,auditorPin,AUDIT_FIELDS))
   return held('QL478_DISTINCT_INDEPENDENT_ED25519_FIRST_ACK_AUDITOR_REQUIRED');
 const receipt=verifyQl478SignedAck({packet,ack,hostPin,receiverPin,
  expectedLeafSha256:clientLeafSha256,nowMs});
 if(receipt.state!=='SIGNED_DURABLE_ACK_REVIEW_HELD')
   return held('QL478_SIGNED_DURABLE_ACK_CORRELATION_DENIED');
 const a=auditorPacket.payload;
 if(a.schema!==QL478_AUDIT||a.host!=='DESKTOP-AE894KC'||
   a.sourceMainSha!==field.sourceMainSha||!eq(a.fieldDigest,field.fieldDigest)||
   a.messageId!==receipt.messageId||!eq(a.ackDigest,receipt.ackDigest)||
   !eq(a.tlsClientLeafSha256,clientLeafSha256)||
   a.originalHostObserved!==true||a.firstAckReadBackObserved!==true||
   a.workerTaskStillOnDemand!==true||a.receiverOffAtStart!==true||
   a.sourceClonesPreserved!==true||a.observerIndependent!==true||
   a.rebootPerformed!==false||a.authorityTransfer!==false||
   !Number.isSafeInteger(a.observedAtMs)||a.observedAtMs>nowMs||
   nowMs-a.observedAtMs>300000||a.observedAtMs<ack?.payload?.receivedAtMs)
  return held('QL478_FIRST_ACK_AUDIT_IDENTITY_SCOPE_OR_TIMING_DENIED');
 return {...held('QL478_SIGNED_FIELD_CLAIMS_REVIEWED_INDEPENDENT_PHYSICAL_WITNESS_STILL_REQUIRED'),
   state:'THREE_SIGNED_SOURCES_REVIEW_HELD',signedEvidenceCorrelated:true,
   firstAckCryptographicallyConsistent:true,fieldDigest:field.fieldDigest,
   ackDigest:receipt.ackDigest,messageId:receipt.messageId};
}
