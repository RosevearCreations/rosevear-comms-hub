/**
 * QL-468 PRIVATE original-host readiness and independent audit assessor.
 * Read-only pure functions. This module NEVER installs SCM services, rotates
 * certs, binds sockets, runs Windows tasks or accepts a claimed "live" result.
 */
import {createHash, createPublicKey, verify, timingSafeEqual} from 'node:crypto';
import {QL467_SCHEMA, QL467_ACK_SCHEMA} from './ql467-private-event-sink.mjs';

export const QL468_WORKER_SCHEMA='rosevear.comms.ql468.worker-install-review.v1';
export const QL468_ROLLOVER_SCHEMA='rosevear.comms.ql468.certificate-rollover-review.v1';
export const QL468_BOOT_SCHEMA='rosevear.comms.ql468.original-host-boot-claim.v1';
export const QL468_AUDIT_SCHEMA='rosevear.comms.ql468.independent-ack-audit.v1';
export const QL468_ROUTE='/internal/rosevear/master/events/read-only/v1';
const HEX=/^[0-9a-f]{64}$/;
const SHA=/^[0-9a-f]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const nonempty=s=>typeof s==='string'&&ID.test(s);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&
 timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const exact=(o,fields)=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
const fieldsWorker=['schema','host','serviceName','serviceAccount','startupMode','sourceMainSha',
 'workerImageSha256','receiverOffEvidenceSha256','obsoleteTaskDisabled','networkExposure',
 'rollbackPlanSha256','issuedAtMs','expiresAtMs','authorityTransfer','automaticInstall'];
const fieldsRollover=['schema','host','sourceMainSha','rotationId','currentCertLeafSha256',
 'candidateCertLeafSha256','currentIssuerKeySha256','candidateIssuerKeySha256',
 'currentExpiresAtMs','candidateNotBeforeMs','candidateExpiresAtMs',
 'overlapStartMs','overlapEndMs','proposedCutoverMs','issuedAtMs','approvalExpiresAtMs',
 'automaticCutover','receiverActivationRequested','authorityTransfer'];
const fieldsBoot=['schema','host','sourceMainSha','bootId','serviceName','workerImageSha256',
 'serviceStartMode','receiverState','obsoleteTaskDisabled','observedAtMs','authorityTransfer'];
const fieldsAck=['schema','messageId','eventId','tenantId','workspaceId','issuer','audience',
 'sourceDigest','receivedAtMs','disposition','authorityTransfer'];
const fieldsEvent=['schema','protocolVersion','messageId','issuer','audience','tenantId',
 'workspaceId','eventId','eventType','payloadSha256','dataClass','issuedAtMs',
 'expiresAtMs','authorityTransfer'];
const fieldsAudit=['schema','host','sourceMainSha','auditId','bootId','messageId',
 'eventId','ackSha256','envelopeSha256','tlsClientLeafSha256','observedAtMs',
 'originalHostObserved','receiverOffObserved','auditorRole','authorityTransfer'];

const hold=reason=>Object.freeze({state:'HOLD',reason,workerInstalled:false,
 hostRebootAuthorized:false,receiverActivated:false,liveMtlsVerified:false,
 liveAckVerified:false,certRotated:false,firstAckAccepted:false,sourceWrites:0});
function publicKey(pin){
 try{
  if(typeof pin!=='string'||pin.length>512)return null;
  const bytes=Buffer.from(pin,'base64');
  if(bytes.toString('base64')!==pin)return null;
  const key=createPublicKey({key:bytes,type:'spki',format:'der'});
  return key.asymmetricKeyType==='ed25519'?key:null;
 }catch{return null;}
}
export function verifyQl468Packet(packet,pin,fields){
 try{
  if(!exact(packet,['payload','signature'])||!exact(packet.payload,fields)||
   typeof packet.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(packet.signature))return false;
  const k=publicKey(pin);
  return Boolean(k&&verify(null,Buffer.from(JSON.stringify(packet.payload)),k,Buffer.from(packet.signature,'base64')));
 }catch{return false;}
}
const fresh=(issued,expires,now)=>Number.isSafeInteger(now)&&Number.isSafeInteger(issued)&&
 Number.isSafeInteger(expires)&&issued<=now&&now-issued<=300000&&
 expires>now&&expires-issued<=3600000;
const isMainSha=sha=>typeof sha==='string'&&SHA.test(sha);
function dual(plan,pinOwner,pinWitness,fields){
 if(!publicKey(pinOwner)||!publicKey(pinWitness)||pinOwner===pinWitness||
  !verifyQl468Packet(plan?.owner,pinOwner,fields)||
  !verifyQl468Packet(plan?.witness,pinWitness,fields))return null;
 return eq(digest(plan.owner.payload),digest(plan.witness.payload))?plan.owner.payload:null;
}
/** Signatures only authorize reviewing a *proposal*. Never install or enable SCM. */
export function reviewQl468WorkerInstall({plan,ownerPin,witnessPin,expectedMainSha,nowMs}={}){
 const p=dual(plan,ownerPin,witnessPin,fieldsWorker);
 if(!p)return hold('QL468_TWO_DISTINCT_ORIGINAL_SIGNERS_REQUIRED');
 if(!isMainSha(expectedMainSha)||p.sourceMainSha!==expectedMainSha||
  p.schema!==QL468_WORKER_SCHEMA||p.host!=='DESKTOP-AE894KC'||
  p.serviceName!=='Rosevear-CommsHub'||p.serviceAccount!=='NT SERVICE\\Rosevear-CommsHub'||
  p.startupMode!=='DEMAND_ONLY'||p.networkExposure!=='PRIVATE_LOOPBACK_ONLY'||
  !HEX.test(p.workerImageSha256??'')||!HEX.test(p.rollbackPlanSha256??'')||
  !HEX.test(p.receiverOffEvidenceSha256??'')||
  p.obsoleteTaskDisabled!==true||p.automaticInstall!==false||p.authorityTransfer!==false||
  !fresh(p.issuedAtMs,p.expiresAtMs,nowMs))
  return hold('QL468_WORKER_PLAN_SCOPE_OR_OFF_EVIDENCE_DENIED');
 return {...hold('QL468_SIGNED_INSTALL_REVIEW_ONLY_NO_ORIGINAL_HOST_PROOF'),
  state:'SIGNED_INSTALL_PLAN_REVIEW_HELD',planDigest:digest(p),
  privateReceiver:'OFF_ATTESTATION_UNCORROBORATED',workerImageSha256:p.workerImageSha256};
}
/**
 * Validate overlap policy from separate signed authorities. The plan is NOT
 * a certificate rotation; TLS key custody and cutover remain external HOLD.
 */
export function reviewQl468CertRollover({plan,ownerPin,witnessPin,expectedMainSha,nowMs}={}){
 const p=dual(plan,ownerPin,witnessPin,fieldsRollover);
 if(!p)return hold('QL468_DUAL_SIGNED_CERT_PLAN_REQUIRED');
 const window=p.overlapEndMs-p.overlapStartMs;
 if(!isMainSha(expectedMainSha)||p.sourceMainSha!==expectedMainSha||
  p.schema!==QL468_ROLLOVER_SCHEMA||p.host!=='DESKTOP-AE894KC'||!nonempty(p.rotationId)||
  ![p.currentCertLeafSha256,p.candidateCertLeafSha256,
    p.currentIssuerKeySha256,p.candidateIssuerKeySha256].every(x=>HEX.test(x??''))||
  eq(p.currentCertLeafSha256,p.candidateCertLeafSha256)||
  eq(p.currentIssuerKeySha256,p.candidateIssuerKeySha256)||
  !fresh(p.issuedAtMs,p.approvalExpiresAtMs,nowMs)||
  ![p.currentExpiresAtMs,p.candidateNotBeforeMs,p.candidateExpiresAtMs,
    p.overlapStartMs,p.overlapEndMs,p.proposedCutoverMs].every(Number.isSafeInteger)||
  window<3600000||window>86400000||
  p.overlapStartMs<nowMs-300000||p.overlapStartMs>nowMs+86400000||
  p.currentExpiresAtMs<p.overlapEndMs+600000||
  p.candidateNotBeforeMs>p.overlapStartMs||
  p.candidateExpiresAtMs<=p.overlapEndMs+86400000||
  p.proposedCutoverMs<p.overlapStartMs||p.proposedCutoverMs>p.overlapEndMs||
  p.automaticCutover!==false||p.receiverActivationRequested!==false||
  p.authorityTransfer!==false)
  return hold('QL468_CERT_OVERLAP_EXPIRY_OR_ISSUER_PIN_DENIED');
 return {...hold('QL468_CERT_ROTATION_PLAN_ONLY_NO_KEY_READ_OR_CUTOVER'),
  state:'SIGNED_CERT_ROLLOVER_REVIEW_HELD',planDigest:digest(p),
  overlapHours:window/3600000,currentLeafSha256:p.currentCertLeafSha256,
  candidateLeafSha256:p.candidateCertLeafSha256,cutoverAuthorized:false};
}
/** A signed field claim cannot by itself prove an original-host reboot. */
export function reviewQl468BootClaim({packet,hostPin,expectedMainSha,nowMs}={}){
 if(!verifyQl468Packet(packet,hostPin,fieldsBoot))return hold('QL468_ORIGINAL_HOST_SIGNED_BOOT_CLAIM_REQUIRED');
 const p=packet.payload;
 if(p.schema!==QL468_BOOT_SCHEMA||p.host!=='DESKTOP-AE894KC'||
  p.serviceName!=='Rosevear-CommsHub'||p.sourceMainSha!==expectedMainSha||
  !isMainSha(expectedMainSha)||!nonempty(p.bootId)||!HEX.test(p.workerImageSha256??'')||
  p.serviceStartMode!=='DEMAND_ONLY'||p.receiverState!=='OFF'||p.obsoleteTaskDisabled!==true||
  p.authorityTransfer!==false||!Number.isSafeInteger(nowMs)||
  !Number.isSafeInteger(p.observedAtMs)||p.observedAtMs>nowMs||
  nowMs-p.observedAtMs>300000)
  return hold('QL468_BOOT_CLAIM_NOT_ORIGINAL_HOST_OR_RECEIVER_OFF');
 return {...hold('QL468_SIGNED_BOOT_CLAIM_STILL_NEEDS_INDEPENDENT_PHYSICAL_WITNESS'),
  state:'SIGNED_BOOT_CLAIM_HELD',bootClaimDigest:digest(p),bootId:p.bootId};
}
/**
 * First ACK: cryptographic consistency across the actual QL467 event, signed
 * durable recipient ACK and a different pinned human audit key. No field
 * may claim physical observation merely because this source review passes.
 */
export function reviewQl468FirstAck({envelope,ack,audit,issuerPin,ackPin,auditorPin,
 tlsClientLeafSha256,expectedMainSha,expectedBootId,nowMs}={}){
 if(![issuerPin,ackPin,auditorPin].every(publicKey)||
  issuerPin===ackPin||issuerPin===auditorPin||ackPin===auditorPin||
  !verifyQl468Packet(envelope,issuerPin,fieldsEvent)||
  !verifyQl468Packet(ack,ackPin,fieldsAck)||
  !verifyQl468Packet(audit,auditorPin,fieldsAudit))
  return hold('QL468_THREE_INDEPENDENT_SIGNED_SOURCES_REQUIRED');
 const e=envelope.payload,k=ack.payload,a=audit.payload;
 if(e.schema!==QL467_SCHEMA||!['1.0','1.1'].includes(e.protocolVersion)||
  e.issuer!=='rosevear-ai-hub'||e.audience!=='rosevear-comms-hub'||
  !nonempty(e.messageId)||!nonempty(e.eventId)||!nonempty(e.tenantId)||
  !nonempty(e.workspaceId)||!HEX.test(e.payloadSha256??'')||
  !['incident.read-only','status.read-only'].includes(e.eventType)||
  e.dataClass!=='NONPERSONAL'||e.authorityTransfer!==false||
  !Number.isSafeInteger(e.issuedAtMs)||!Number.isSafeInteger(e.expiresAtMs)||
  e.issuedAtMs>nowMs||e.expiresAtMs<=e.issuedAtMs||
  k.schema!==QL467_ACK_SCHEMA||k.issuer!=='rosevear-comms-hub'||
  k.audience!=='rosevear-ai-hub'||k.messageId!==e.messageId||
  k.eventId!==e.eventId||k.tenantId!==e.tenantId||
  k.workspaceId!==e.workspaceId||k.disposition!=='RECEIVED'||
  !eq(k.sourceDigest,digest(envelope))||k.authorityTransfer!==false||
  !Number.isSafeInteger(k.receivedAtMs)||k.receivedAtMs<e.issuedAtMs||
  k.receivedAtMs>nowMs||nowMs-k.receivedAtMs>300000||
  a.schema!==QL468_AUDIT_SCHEMA||a.host!=='DESKTOP-AE894KC'||
  a.sourceMainSha!==expectedMainSha||!isMainSha(expectedMainSha)||
  a.bootId!==expectedBootId||!nonempty(a.bootId)||!nonempty(a.auditId)||
  a.messageId!==e.messageId||a.eventId!==e.eventId||
  !eq(a.ackSha256,digest(ack))||!eq(a.envelopeSha256,digest(envelope))||
  !eq(a.tlsClientLeafSha256,tlsClientLeafSha256)||
  a.auditorRole!=='INDEPENDENT_ORIGINAL_HOST_REVIEWER'||
  a.originalHostObserved!==true||a.receiverOffObserved!==true||
  a.authorityTransfer!==false||!Number.isSafeInteger(a.observedAtMs)||
  a.observedAtMs<k.receivedAtMs||a.observedAtMs>nowMs||
  nowMs-a.observedAtMs>300000)
  return hold('QL468_FIRST_ACK_CORRELATION_OR_INDEPENDENT_AUDIT_DENIED');
 return {...hold('QL468_SIGNED_PACKET_REVIEW_ONLY_LIVE_HOST_CORROBORATION_MISSING'),
  state:'SIGNED_FIRST_ACK_REVIEW_HELD',ackDigest:digest(ack),
  auditDigest:digest(a),messageId:e.messageId,bootId:a.bootId,
  firstAckAccepted:false,originalHostIndependentlyVerified:false};
}
export const QL468_DEPLOYMENT_BOUNDARY=Object.freeze({
 route:QL468_ROUTE,httpListener:'NOT_STARTED',windowsService:'NOT_INSTALLED_OR_UNVERIFIED',
 reboot:'HOLD',liveMtls:'NOT_OBSERVED',firstAck:'NOT_INDEPENDENTLY_ACCEPTED',
 receiver:'QL340C_SUPERVISED_TEST_ONLY_OFF_UNKNOWN',automaticInstall:false,
 automaticRotation:false,ownerEvidence:'OUT_OF_BAND_REQUIRED'});
