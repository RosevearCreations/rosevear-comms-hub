/**
 * QL-471 original-host snapshot intake and owner-gated single-peer readiness.
 * No I/O, private keys, network calls, service management or authority transfer.
 * User-provided JSON and signatures are claims, never physical Windows proof.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
import {reviewQl470WorkerIdentity} from './ql470-original-host-field-assurance.mjs';

export const QL471_OWNER='rosevear.comms.ql471.source-evidence-owner.v1';
export const QL471_WITNESS='rosevear.comms.ql471.independent-snapshot-witness.v1';
export const QL471_HOST='DESKTOP-AE894KC';
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const safeEqual=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const hold=(reason,extra={})=>Object.freeze({state:'HOLD',reason,originalHostFieldVerified:false,
  workerInstalledVerified:false,independentPhysicalWitnessVerified:false,
  singlePeerPilotAuthorized:false,livePeerAccepted:false,automaticInstall:false,
  automaticSend:false,receiverActivated:false,servicesChanged:false,hostRebootAuthorized:false,
  sourceWrites:0,peerSends:0,...extra});
const keys468=['schema','host','observedAtUtc','serviceName','workerPresent','workerStartMode','workerState','workerServiceAccountMatchesPlan','receiverPort8788ListenerCount','legacyTaskPresent','legacyTaskDisabled','privateReceiverOffVerified','independentBootWitnessVerified','firstAckIndependentlyVerified','actionExecuted','rebootAuthorized','state'];
const keys470=['schema','host','observedAtUtc','serviceName','workerPresent','workerState','workerStartMode','workerServiceAccountMatchesPlan','workerBinaryReadable','workerBinarySha256','receiverPort8788ListenerCount','legacyTaskDisabled','receiverOffIndependentlyVerified','independentPeerAccepted','actionExecuted','rebootAuthorized','state'];
const fieldsOwner=['schema','host','sourceMainSha','snapshotSha256','issuedAtMs','expiresAtMs','scope','pilotRequested','ownerApproved','autoInstall','autoSend','autoRestart','receiverActivationRequested','authorityTransfer'];
const fieldsWitness=['schema','host','sourceMainSha','snapshotSha256','observedAtMs','reviewerRole','independentReviewer','hostReachabilityVerified','workerSeenInstalled','receiverOffObserved','authorityTransfer'];
const parse=(v,allowed)=>{
 try{
  if(typeof v==='string'){
   if(v.length<30||v.length>8192) return null;
   v=JSON.parse(v);
  }
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)return null;
  if(Object.keys(v).length!==allowed.length||allowed.some(k=>!Object.prototype.hasOwnProperty.call(v,k))||
     Object.keys(v).some(k=>!allowed.includes(k)))return null;
  return v;
 }catch{return null;}
};
const fresh=(at,now)=>Number.isSafeInteger(at)&&Number.isSafeInteger(now)&&at<=now&&now-at<=300000;
export function intakeQl471Snapshots({ql468,ql470,nowMs=Date.now(),expectedMainSha}={}){
 const a=parse(ql468,keys468),b=parse(ql470,keys470);
 if(!a||!b)return hold('QL471_EXACT_JSON_SNAPSHOT_FIELDS_REQUIRED');
 if(!SHA.test(expectedMainSha??''))return hold('QL471_PRODUCTION_SOURCE_SHA_REQUIRED');
 const tA=Date.parse(a.observedAtUtc),tB=Date.parse(b.observedAtUtc);
 if(!Number.isFinite(tA)||!Number.isFinite(tB)||!Number.isSafeInteger(nowMs)||
    tA>tB||tB-tA>300000||tB>nowMs+5000)
   return hold('QL471_SNAPSHOT_CLOCK_OR_SEQUENCE_INVALID');
 if(a.schema!=='rosevear.comms.ql468.original-host-readonly-inventory.v1'||
    b.schema!=='rosevear.comms.ql470.original-host-inventory.v1'||
    a.host!==QL471_HOST||b.host!==QL471_HOST||
    a.serviceName!=='Rosevear-CommsHub'||b.serviceName!=='Rosevear-CommsHub'||
    a.workerPresent!==b.workerPresent||
    a.workerStartMode!==b.workerStartMode||a.workerState!==b.workerState||
    a.workerServiceAccountMatchesPlan!==b.workerServiceAccountMatchesPlan||
    a.receiverPort8788ListenerCount!==b.receiverPort8788ListenerCount||
    a.receiverPort8788ListenerCount!==0||
    a.legacyTaskPresent!==true||a.legacyTaskDisabled!==true||
    b.legacyTaskDisabled!==true||
    a.privateReceiverOffVerified!==false||a.independentBootWitnessVerified!==false||
    a.firstAckIndependentlyVerified!==false||b.receiverOffIndependentlyVerified!==false||
    b.independentPeerAccepted!==false||a.actionExecuted!==false||
    b.actionExecuted!==false||a.rebootAuthorized!==false||b.rebootAuthorized!==false||
    a.state!=='HOLD_INDEPENDENT_SIGNED_FIELD_REVIEW_REQUIRED'||
    b.state!=='HOLD_INDEPENDENT_ORIGINAL_HOST_WITNESS_REQUIRED')
    return hold('QL471_SNAPSHOT_CONTENT_OR_BOUNDARY_MISMATCH');
 const missing=a.workerPresent===false &&
  a.workerStartMode==='NOT_INSTALLED'&&a.workerState==='NOT_INSTALLED'&&
  a.workerServiceAccountMatchesPlan===false &&
  b.workerBinaryReadable===false&&b.workerBinarySha256===null;
 const present=a.workerPresent===true &&
  a.workerStartMode==='Manual'&&a.workerState==='Running'&&
  a.workerServiceAccountMatchesPlan===true &&
  b.workerBinaryReadable===true&&HEX.test(b.workerBinarySha256??'');
 if(!missing&&!present)return hold('QL471_WORKER_INSTALL_STATE_INCONSISTENT');
 const stale=!fresh(tB,nowMs);
 const snapshotSha256=digest({sourceMainSha:expectedMainSha,ql468:digest(a),ql470:digest(b)});
 const reason=missing?'ORIGINAL_HOST_SERVICE_NOT_INSTALLED':'SIGNED_FIELD_WITNESS_AND_OWNER_GATE_REQUIRED';
 return {...hold(stale?'QL471_HISTORICAL_EVIDENCE_REQUIRES_FRESH_RECHECK':reason),
  state:stale?'HISTORICAL_SNAPSHOT_REVIEW_HELD':missing?'MISSING_WORKER_REVIEW_HELD':'WORKER_CLAIM_REVIEW_HELD',
  host:QL471_HOST,sourceMainSha:expectedMainSha,snapshotSha256,
  ql468Sha256:digest(a),ql470Sha256:digest(b),
  observed468AtMs:tA,observed470AtMs:tB,stale,workerMissing:missing,
  serviceObservedByOwnerClaim:!missing,legacyTaskDisabled:true,receiverPort8788ListenerCount:0};
}
export function reviewQl471SignedIntake({intake,ownerPacket,witnessPacket,ownerPin,witnessPin,
   expectedMainSha,nowMs=Date.now()}={}){
 if(!intake||intake.state==='HOLD'||intake.stale||
  intake.sourceMainSha!==expectedMainSha||!SHA.test(expectedMainSha??'')||
  typeof ownerPin!=='string'||typeof witnessPin!=='string'||!ownerPin||!witnessPin||ownerPin===witnessPin||
  !verifyQl468Packet(ownerPacket,ownerPin,fieldsOwner)||
  !verifyQl468Packet(witnessPacket,witnessPin,fieldsWitness))
  return hold('QL471_FRESH_SNAPSHOTS_AND_INDEPENDENT_SIGNERS_REQUIRED');
 const o=ownerPacket.payload,w=witnessPacket.payload;
 if(o.schema!==QL471_OWNER||w.schema!==QL471_WITNESS||
    o.host!==QL471_HOST||w.host!==QL471_HOST||
    o.sourceMainSha!==expectedMainSha||w.sourceMainSha!==expectedMainSha||
    !safeEqual(o.snapshotSha256,intake.snapshotSha256)||
    !safeEqual(w.snapshotSha256,intake.snapshotSha256)||
    !fresh(o.issuedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
    o.issuedAtMs<intake.observed470AtMs||w.observedAtMs<intake.observed470AtMs||
    !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||
    o.expiresAtMs-o.issuedAtMs>3600000||
    !['READ_ONLY_EVIDENCE_REVIEW','ONE_NONPERSONAL_PEER_PILOT_READINESS_REVIEW'].includes(o.scope)||
    o.ownerApproved!==true||o.pilotRequested!==(o.scope==='ONE_NONPERSONAL_PEER_PILOT_READINESS_REVIEW')||
    o.autoInstall!==false||o.autoSend!==false||o.autoRestart!==false||
    o.receiverActivationRequested!==false||o.authorityTransfer!==false||
    w.reviewerRole!=='INDEPENDENT_ORIGINAL_HOST_OBSERVER'||
    w.independentReviewer!==true||w.hostReachabilityVerified!==true||
    w.workerSeenInstalled!==!intake.workerMissing||
    w.receiverOffObserved!==true||w.authorityTransfer!==false)
  return hold('QL471_SIGNED_CUSTODY_FRESHNESS_OR_SCOPE_MISMATCH');
 return {...hold('QL471_SIGNED_FIELD_REVIEW_ONLY_NOT_PHYSICAL_OR_PILOT_PROOF'),
  state:intake.workerMissing?'SIGNED_MISSING_WORKER_REVIEW_HELD':'SIGNED_WORKER_CLAIM_REVIEW_HELD',
  snapshotSha256:intake.snapshotSha256,ownerScope:o.scope,
  signedOwnerAndWitnessReview:true,workerMissing:intake.workerMissing,
  singlePeerPilotAuthorized:false};
}
export function reviewQl471PilotReadiness({intake,ownerPacket,witnessPacket,ownerPin,witnessPin,
  expectedMainSha,nowMs=Date.now(),workerIdentityArgs}={}){
 const evidence=reviewQl471SignedIntake({intake,ownerPacket,witnessPacket,ownerPin,
  witnessPin,expectedMainSha,nowMs});
 if(!evidence.signedOwnerAndWitnessReview||intake.workerMissing||
    evidence.ownerScope!=='ONE_NONPERSONAL_PEER_PILOT_READINESS_REVIEW')
  return hold('QL471_MISSING_WORKER_OR_OWNER_SCOPE_NOT_ELIGIBLE_FOR_PILOT');
 if(!workerIdentityArgs||[workerIdentityArgs.hostPin,workerIdentityArgs.witnessPin].includes(ownerPin)||
    [workerIdentityArgs.hostPin,workerIdentityArgs.witnessPin].includes(witnessPin))
  return hold('QL471_FOUR_DISTINCT_HOST_OWNER_AND_WITNESS_SIGNERS_REQUIRED');
 const worker=reviewQl470WorkerIdentity({...workerIdentityArgs,expectedMainSha,nowMs});
 if(worker.state!=='SIGNED_WORKER_IDENTITY_REVIEW_HELD'||
    !safeEqual(worker.inventoryDigest,intake.ql470Sha256))
  return hold('QL471_SIGNED_LIVE_WORKER_CLAIM_REQUIRED');
 return {...hold('QL471_ONLY_OWNER_GATED_SINGLE_PEER_PLAN_READY_NO_LIVE_AUTHORIZATION'),
  state:'OWNER_GATED_SINGLE_PEER_PLAN_REVIEW_HELD',
  signedOwnerAndWitnessReview:true,workerIdentityReview:true,
  snapshotSha256:intake.snapshotSha256,
  plannedPeerCount:1,permittedDataClass:'NONPERSONAL_READ_ONLY',
  singlePeerPilotAuthorized:false,livePeerAccepted:false};
}
export const QL471_BOUNDARY=Object.freeze({
 userReportedHost:'DESKTOP-AE894KC',
 userReportedWorker:'NOT_INSTALLED',userReportedPort8788Listeners:0,
 localCheckoutPathsVerifiedByRemote:false,hostActivation:'HOLD',
 independentWitness:'NOT_RECEIVED',allowedSourceOperations:'READ_ONLY',
 ownerGrantForLivePeer:'NOT_GIVEN',autoInstall:false,autoSend:false,
 receiverEnable:false,legacyTaskEnable:false});
