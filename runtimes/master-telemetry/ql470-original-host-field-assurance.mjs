/**
 * QL-470 original-host identity and supervised FIRST peer acceptance reviewers.
 * All inputs must be independently sourced. This has no Windows, disk, network,
 * environment, key-custody, signing or activation side effects.
 * A signature-valid claim is never by itself accepted as physical/live evidence.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
import {reviewQl469Enrollment,reviewQl469PeerReceipt} from './ql469-independent-original-host-acceptance.mjs';

export const QL470_INVENTORY_SCHEMA='rosevear.comms.ql470.original-host-inventory.v1';
export const QL470_HOST_SCHEMA='rosevear.comms.ql470.original-host-identity-claim.v1';
export const QL470_WITNESS_SCHEMA='rosevear.comms.ql470.independent-worker-witness.v1';
export const QL470_OWNER_SCHEMA='rosevear.comms.ql470.supervised-first-peer-owner.v1';
export const QL470_PEER_WITNESS_SCHEMA='rosevear.comms.ql470.supervised-first-peer-witness.v1';

const HOST='DESKTOP-AE894KC',SERVICE='Rosevear-CommsHub';
const HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/,ID=/^[A-Za-z0-9_-]{12,96}$/;
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const fresh=(t,now)=>Number.isSafeInteger(t)&&Number.isSafeInteger(now)&&t<=now&&now-t<=300000;
const different=(...pins)=>pins.every(x=>typeof x==='string'&&x.length>0)&&new Set(pins).size===pins.length;
const hold=reason=>Object.freeze({state:'HOLD',reason,workerIdentityReview:false,
  workerPhysicallyVerified:false,livePeerVerified:false,supervisedPeerAccepted:false,
  firstAckIndependentlyAccepted:false,receiverActivated:false,servicesChanged:false,
  hostRebootAuthorized:false,credentialsRead:false,sourceWrites:0,peerSends:0});
const hostFields=['schema','host','sourceMainSha','observationId','bootId',
  'inventorySha256','imageSha256','observedAtMs','receiverState','authorityTransfer'];
const witnessFields=['schema','host','observationId','sourceMainSha','inventorySha256',
  'hostClaimSha256','workerImageSha256','observedAtMs','independentReviewer',
  'receiverOffObserved','authorityTransfer'];
const ownerFields=['schema','host','sourceMainSha','observationId','bootId',
  'messageId','ackSha256','issuedAtMs','expiresAtMs','approvedScope',
  'automaticSend','automaticInstall','receiverActivationRequested',
  'serviceRestartRequested','authorityTransfer'];
const peerWitnessFields=['schema','host','sourceMainSha','observationId','bootId',
  'messageId','ackSha256','ownerDecisionSha256','tlsClientLeafSha256',
  'observedAtMs','independentReviewer','clientCertificateObserved',
  'receiptStorageObserved','receiverOffObserved','authorityTransfer'];

export function reviewQl470WorkerIdentity({inventory,hostPacket,witnessPacket,
  hostPin,witnessPin,expectedMainSha,nowMs}={}){
 if(!different(hostPin,witnessPin)||!verifyQl468Packet(hostPacket,hostPin,hostFields)||
   !verifyQl468Packet(witnessPacket,witnessPin,witnessFields))
   return hold('QL470_DISTINCT_SIGNED_ORIGINAL_HOST_AND_WITNESS_REQUIRED');
 if(!inventory||typeof inventory!=='object'||Array.isArray(inventory))
   return hold('QL470_ORIGINAL_HOST_INVENTORY_REQUIRED');
 const h=hostPacket.payload,w=witnessPacket.payload;
 const observed=Date.parse(inventory.observedAtUtc??'');
 if(!SHA.test(expectedMainSha??'')||h.schema!==QL470_HOST_SCHEMA||
  w.schema!==QL470_WITNESS_SCHEMA||h.host!==HOST||w.host!==HOST||
  h.sourceMainSha!==expectedMainSha||w.sourceMainSha!==expectedMainSha||
  !ID.test(h.observationId??'')||!ID.test(h.bootId??'')||
  w.observationId!==h.observationId||!HEX.test(h.imageSha256??'')||
  !equal(h.inventorySha256,digest(inventory))||
  !equal(w.hostClaimSha256,digest(h))||!equal(w.inventorySha256,h.inventorySha256)||
  !equal(w.workerImageSha256,h.imageSha256)||
  !fresh(h.observedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
  w.observedAtMs<h.observedAtMs||!Number.isFinite(observed)||
  Math.abs(observed-h.observedAtMs)>60000||nowMs-observed>300000||
  h.receiverState!=='OFF'||w.receiverOffObserved!==true||
  w.independentReviewer!==true||h.authorityTransfer!==false||w.authorityTransfer!==false)
  return hold('QL470_HOST_PIN_HASH_CLOCK_OR_INDEPENDENT_WITNESS_DENIED');
 if(inventory.schema!==QL470_INVENTORY_SCHEMA||inventory.host!==HOST||
  inventory.serviceName!==SERVICE||inventory.workerPresent!==true||
  inventory.workerState!=='Running'||inventory.workerStartMode!=='Manual'||
  inventory.workerServiceAccountMatchesPlan!==true||
  inventory.workerBinaryReadable!==true||
  !equal(inventory.workerBinarySha256,h.imageSha256)||
  inventory.receiverPort8788ListenerCount!==0||
  inventory.legacyTaskDisabled!==true||inventory.actionExecuted!==false||
  inventory.rebootAuthorized!==false||inventory.receiverOffIndependentlyVerified!==false||
  inventory.independentPeerAccepted!==false)
  return hold('QL470_WORKER_SERVICE_IMAGE_OR_RECEIVER_OFF_NOT_READY');
 return {...hold('QL470_SIGNED_WORKER_IDENTITY_REVIEW_FIELD_PROOF_HELD'),
  state:'SIGNED_WORKER_IDENTITY_REVIEW_HELD',workerIdentityReview:true,
  bootId:h.bootId,observationId:h.observationId,
  workerImageSha256:h.imageSha256,inventoryDigest:digest(inventory),
  workerPhysicallyVerified:false};
}

/**
 * Re-verify ALL underlying QL-469 original enrollment, QL-467 signed ACK,
 * QL-468 audit and QL-469 peer witness. Additional owner + independent
 * original-host reviewer signatures cannot substitute for real TLS/host proof.
 * This creates no inbound listener and never performs a first live peer send.
 */
export function reviewQl470SupervisedFirstPeer({workerArgs,enrollmentArgs,peerArgs,
  ownerPacket,independentPacket,ownerPin,witnessPin,expectedMainSha,nowMs}={}){
 const worker=reviewQl470WorkerIdentity({...workerArgs,expectedMainSha,nowMs});
 const enrollment=reviewQl469Enrollment({...enrollmentArgs,expectedMainSha,nowMs});
 if(worker.state!=='SIGNED_WORKER_IDENTITY_REVIEW_HELD'||
   enrollment.state!=='SIGNED_ENROLLMENT_REVIEW_HELD'||
   worker.bootId!==enrollment.bootId)
  return hold('QL470_ORIGINAL_HOST_WORKER_AND_Q469_ENROLLMENT_PROOF_REQUIRED');
 const peer=reviewQl469PeerReceipt({...peerArgs,enrollment,expectedMainSha,nowMs});
 if(peer.state!=='SIGNED_PEER_REVIEW_HELD'||peer.bootId!==worker.bootId)
  return hold('QL470_SIGNED_FIRST_ACK_AND_Q469_PEER_PROOF_REQUIRED');
 const pins=[ownerPin,witnessPin,workerArgs?.hostPin,workerArgs?.witnessPin,
   enrollmentArgs?.hostPin,enrollmentArgs?.ownerPin,enrollmentArgs?.witnessPin,
   peerArgs?.issuerPin,peerArgs?.ackPin,peerArgs?.auditorPin,peerArgs?.peerPin];
 if(!different(ownerPin,witnessPin)||pins.slice(2).some(p=>p===ownerPin||p===witnessPin)||
  !verifyQl468Packet(ownerPacket,ownerPin,ownerFields)||
  !verifyQl468Packet(independentPacket,witnessPin,peerWitnessFields))
  return hold('QL470_OWNER_AND_INDEPENDENT_FIRST_PEER_SIGNERS_REQUIRED');
 const o=ownerPacket.payload,w=independentPacket.payload;
 const ackHash=digest(peerArgs.ack),tlsLeaf=peerArgs.tlsClientLeafSha256;
 if(!SHA.test(expectedMainSha??'')||o.schema!==QL470_OWNER_SCHEMA||
  w.schema!==QL470_PEER_WITNESS_SCHEMA||o.host!==HOST||w.host!==HOST||
  o.sourceMainSha!==expectedMainSha||w.sourceMainSha!==expectedMainSha||
  o.observationId!==worker.observationId||w.observationId!==worker.observationId||
  o.bootId!==worker.bootId||w.bootId!==worker.bootId||
  o.messageId!==peer.messageId||w.messageId!==peer.messageId||
  !equal(o.ackSha256,ackHash)||!equal(w.ackSha256,ackHash)||
  !equal(w.ownerDecisionSha256,digest(o))||
  !equal(w.tlsClientLeafSha256,tlsLeaf)||
  !fresh(o.issuedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
  w.observedAtMs<o.issuedAtMs||!Number.isSafeInteger(o.expiresAtMs)||
  o.expiresAtMs<=nowMs||o.expiresAtMs-o.issuedAtMs>3600000||
  o.approvedScope!=='ONE_READ_ONLY_PEER_RECEIPT_REVIEW'||
  o.automaticSend!==false||o.automaticInstall!==false||
  o.receiverActivationRequested!==false||o.serviceRestartRequested!==false||
  w.independentReviewer!==true||w.clientCertificateObserved!==true||
  w.receiptStorageObserved!==true||w.receiverOffObserved!==true||
  o.authorityTransfer!==false||w.authorityTransfer!==false)
  return hold('QL470_SUPERVISED_PEER_ACK_SCOPE_OR_FIELD_OBSERVATION_DENIED');
 return {...hold('QL470_SIGNED_SUPERVISED_PEER_CLAIM_FIELD_ACCEPTANCE_HELD'),
  state:'SIGNED_FIRST_PEER_REVIEW_HELD',workerObservationId:worker.observationId,
  messageId:peer.messageId,ackDigest:ackHash,
  workerPhysicallyVerified:false,livePeerVerified:false,supervisedPeerAccepted:false};
}
export const QL470_BOUNDARY=Object.freeze({mode:'READ_ONLY_SOURCE_REVIEW',
  originalHost:HOST,realHostSession:'NOT_COLLECTED',actualWorkerEnrollment:'HOLD',
  livePeer:'NOT_OBSERVED',firstPeerAcceptance:'HOLD',receiver:'OFF_OR_UNKNOWN',
  automaticInstall:false,automaticSend:false,automaticRestart:false,
  automaticReboot:false,certificateCutover:false,externalFieldEvidenceRequired:true});
