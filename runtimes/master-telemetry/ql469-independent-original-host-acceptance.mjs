/**
 * QL-469: pure, read-only original-host enrollment, peer ACK and recovery evidence.
 * Valid signatures demonstrate reviewable claims, not physical-host or live network proof.
 * This module never installs a service, binds ports, reboots, sends, or reads secrets.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet,reviewQl468FirstAck} from './ql468-original-host-readiness.mjs';
export const QL469_ENROLL='rosevear.comms.ql469.host-enrollment.v1';
export const QL469_OWNER='rosevear.comms.ql469.owner-review.v1';
export const QL469_WITNESS='rosevear.comms.ql469.independent-review.v1';
export const QL469_PEER='rosevear.comms.ql469.peer-receipt.v1';
export const QL469_RECOVERY='rosevear.comms.ql469.recovery-observation.v1';
export const QL469_RECOVERY_WITNESS='rosevear.comms.ql469.recovery-witness.v1';
const HOST='DESKTOP-AE894KC',SERVICE='Rosevear-CommsHub';
const HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/,ID=/^[A-Za-z0-9_-]{12,96}$/;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const fresh=(at,now)=>Number.isSafeInteger(at)&&Number.isSafeInteger(now)&&at<=now&&now-at<=300000;
const distinct=(...pins)=>pins.every(x=>typeof x==='string'&&x.length>0)&&new Set(pins).size===pins.length;
const hold=reason=>Object.freeze({state:'HOLD',reason,workerEnrolled:false,originalHostVerified:false,livePeerVerified:false,ackAccepted:false,recoveryAccepted:false,receiverActivated:false,serviceStarted:false,hostRebootAuthorized:false,credentialsRead:false,sourceWrites:0});
const hostKeys=['schema','host','sourceMainSha','enrollmentId','bootId','inventorySha256','imageSha256','observedAtMs','receiverState','authorityTransfer'];
const ownerKeys=['schema','host','sourceMainSha','enrollmentId','hostDigest','issuedAtMs','expiresAtMs','automaticInstall','autoStart','receiverActivationRequested','authorityTransfer'];
const witnessKeys=['schema','host','enrollmentId','hostDigest','inventorySha256','observedAtMs','reviewerRole','receiverOffObserved','authorityTransfer'];
const peerKeys=['schema','host','sourceMainSha','bootId','messageId','ackSha256','auditSha256','tlsClientLeafSha256','observedAtMs','clientAuthenticated','durableReplayConfirmed','reviewerRole','authorityTransfer'];
const recoveryKeys=['schema','host','sourceMainSha','recoveryId','bootId','observationId','phase','serviceName','serviceState','imageSha256','receiverState','observedAtMs','automaticRecovery','authorityTransfer'];
const recoverWitnessKeys=['schema','host','sourceMainSha','recoveryId','beforeSha256','afterSha256','observedAtMs','reviewerRole','receiverOffObserved','authorityTransfer'];
export function reviewQl469Enrollment({inventory,hostPacket,ownerPacket,witnessPacket,hostPin,ownerPin,witnessPin,expectedMainSha,nowMs}={}){
 if(!distinct(hostPin,ownerPin,witnessPin)||!verifyQl468Packet(hostPacket,hostPin,hostKeys)||!verifyQl468Packet(ownerPacket,ownerPin,ownerKeys)||!verifyQl468Packet(witnessPacket,witnessPin,witnessKeys))return hold('QL469_DISTINCT_SIGNED_HOST_OWNER_REVIEWER_REQUIRED');
 const h=hostPacket.payload,o=ownerPacket.payload,w=witnessPacket.payload;
 if(!SHA.test(expectedMainSha??'')||h.sourceMainSha!==expectedMainSha||o.sourceMainSha!==expectedMainSha||h.schema!==QL469_ENROLL||o.schema!==QL469_OWNER||w.schema!==QL469_WITNESS||
  h.host!==HOST||o.host!==HOST||w.host!==HOST||!ID.test(h.enrollmentId??'')||!ID.test(h.bootId??'')||
  h.enrollmentId!==o.enrollmentId||h.enrollmentId!==w.enrollmentId||
  !HEX.test(h.imageSha256??'')||!eq(h.inventorySha256,digest(inventory))||
  !eq(o.hostDigest,digest(h))||!eq(w.hostDigest,digest(h))||!eq(w.inventorySha256,h.inventorySha256)||
  !fresh(h.observedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||!fresh(o.issuedAtMs,nowMs)||
  o.issuedAtMs<h.observedAtMs||w.observedAtMs<h.observedAtMs||
  !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||o.expiresAtMs-o.issuedAtMs>3600000||
  h.receiverState!=='OFF'||w.receiverOffObserved!==true||
  w.reviewerRole!=='INDEPENDENT_ORIGINAL_HOST_REVIEWER'||
  o.automaticInstall!==false||o.autoStart!==false||o.receiverActivationRequested!==false||
  h.authorityTransfer!==false||o.authorityTransfer!==false||w.authorityTransfer!==false)return hold('QL469_ENROLLMENT_SCOPE_HASH_FRESHNESS_OR_OFF_DENIED');
 // Inventory from QL468 PowerShell is not itself signed or a proof of provenance.
 if(!inventory||inventory.schema!=='rosevear.comms.ql468.original-host-readonly-inventory.v1'||inventory.host!==HOST||inventory.serviceName!==SERVICE||
  inventory.workerPresent!==true||inventory.workerState!=='Running'||inventory.workerStartMode!=='Manual'||
  inventory.workerServiceAccountMatchesPlan!==true||inventory.receiverPort8788ListenerCount!==0||
  inventory.legacyTaskDisabled!==true||inventory.actionExecuted!==false||inventory.rebootAuthorized!==false)return hold('QL469_ORIGINAL_HOST_INVENTORY_NOT_READY');
 return {...hold('QL469_SIGNED_ENROLLMENT_REVIEW_NOT_PHYSICAL_HOST_PROOF'),state:'SIGNED_ENROLLMENT_REVIEW_HELD',enrollmentId:h.enrollmentId,bootId:h.bootId,inventoryDigest:digest(inventory)};
}
export function reviewQl469PeerReceipt({enrollment,envelope,ack,audit,peerPacket,issuerPin,ackPin,auditorPin,peerPin,tlsClientLeafSha256,expectedMainSha,nowMs}={}){
 if(enrollment?.state!=='SIGNED_ENROLLMENT_REVIEW_HELD'||!distinct(issuerPin,ackPin,auditorPin,peerPin))return hold('QL469_ENROLLMENT_OR_FOUR_INDEPENDENT_KEYS_REQUIRED');
 const verified=reviewQl468FirstAck({envelope,ack,audit,issuerPin,ackPin,auditorPin,tlsClientLeafSha256,expectedMainSha,expectedBootId:enrollment.bootId,nowMs});
 if(verified.state!=='SIGNED_FIRST_ACK_REVIEW_HELD'||!verifyQl468Packet(peerPacket,peerPin,peerKeys))return hold('QL469_ORIGINAL_SIGNED_ACK_AND_PEER_WITNESS_REQUIRED');
 const p=peerPacket.payload;
 if(!SHA.test(expectedMainSha??'')||p.schema!==QL469_PEER||p.host!==HOST||p.sourceMainSha!==expectedMainSha||
  p.bootId!==enrollment.bootId||p.messageId!==envelope.payload.messageId||
  !eq(p.ackSha256,digest(ack))||!eq(p.auditSha256,digest(audit))||!eq(p.tlsClientLeafSha256,tlsClientLeafSha256)||
  !fresh(p.observedAtMs,nowMs)||p.observedAtMs<audit.payload.observedAtMs||
  p.clientAuthenticated!==true||p.durableReplayConfirmed!==true||
  p.reviewerRole!=='INDEPENDENT_PEER_REVIEWER'||p.authorityTransfer!==false)return hold('QL469_PEER_ACK_HASH_MTLS_REPLAY_OR_REVIEW_DENIED');
 return {...hold('QL469_SIGNED_PEER_EVIDENCE_NOT_LIVE_SOCKET_PROOF'),state:'SIGNED_PEER_REVIEW_HELD',enrollmentId:enrollment.enrollmentId,bootId:enrollment.bootId,messageId:p.messageId,ackDigest:digest(ack)};
}
export function reviewQl469Recovery({enrollment,peer,beforePacket,afterPacket,witnessPacket,hostPin,witnessPin,expectedMainSha,nowMs}={}){
 if(enrollment?.state!=='SIGNED_ENROLLMENT_REVIEW_HELD'||peer?.state!=='SIGNED_PEER_REVIEW_HELD'||peer.enrollmentId!==enrollment.enrollmentId||peer.bootId!==enrollment.bootId||
  !distinct(hostPin,witnessPin)||!verifyQl468Packet(beforePacket,hostPin,recoveryKeys)||!verifyQl468Packet(afterPacket,hostPin,recoveryKeys)||!verifyQl468Packet(witnessPacket,witnessPin,recoverWitnessKeys))return hold('QL469_PEER_AND_DISTINCT_SIGNED_RECOVERY_WITNESS_REQUIRED');
 const b=beforePacket.payload,a=afterPacket.payload,w=witnessPacket.payload;
 if(!SHA.test(expectedMainSha??'')||b.sourceMainSha!==expectedMainSha||a.sourceMainSha!==expectedMainSha||w.sourceMainSha!==expectedMainSha||
  b.schema!==QL469_RECOVERY||a.schema!==QL469_RECOVERY||w.schema!==QL469_RECOVERY_WITNESS||
  b.host!==HOST||a.host!==HOST||w.host!==HOST||!ID.test(b.recoveryId??'')||b.recoveryId!==a.recoveryId||b.recoveryId!==w.recoveryId||
  !ID.test(b.observationId??'')||!ID.test(a.observationId??'')||b.observationId===a.observationId||
  b.bootId!==enrollment.bootId||a.bootId!==b.bootId||b.phase!=='BEFORE'||a.phase!=='AFTER'||
  b.serviceName!==SERVICE||a.serviceName!==SERVICE||b.serviceState!=='STOPPED'||a.serviceState!=='RUNNING'||
  !HEX.test(b.imageSha256??'')||!eq(b.imageSha256,a.imageSha256)||b.receiverState!=='OFF'||a.receiverState!=='OFF'||
  b.automaticRecovery!==false||a.automaticRecovery!==false||b.authorityTransfer!==false||a.authorityTransfer!==false||
  !fresh(b.observedAtMs,nowMs)||!fresh(a.observedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
  a.observedAtMs<=b.observedAtMs||w.observedAtMs<a.observedAtMs||
  !eq(w.beforeSha256,digest(b))||!eq(w.afterSha256,digest(a))||
  w.reviewerRole!=='INDEPENDENT_RECOVERY_REVIEWER'||w.receiverOffObserved!==true||w.authorityTransfer!==false)return hold('QL469_RECOVERY_ORDER_DIGEST_REBOOT_OR_OFF_DENIED');
 return {...hold('QL469_SIGNED_RECOVERY_REVIEW_NOT_ACTUAL_FIELD_ACCEPTANCE'),state:'SIGNED_RECOVERY_REVIEW_HELD',enrollmentId:enrollment.enrollmentId,recoveryId:b.recoveryId,recoveryDigest:digest({before:b,after:a,witness:w})};
}
export const QL469_BOUNDARY=Object.freeze({originalHost:HOST,source:'REVIEW_ONLY',worker:'NOT_PHYSICALLY_VERIFIED',peer:'NOT_LIVE_VERIFIED',recovery:'NOT_FIELD_ACCEPTED',receiver:'OFF_OR_UNKNOWN',automaticInstall:false,automaticSend:false,automaticReboot:false,certificateCutover:false});
