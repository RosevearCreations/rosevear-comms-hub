/** QL-476: review only. Never confuse a CI signature or local claim with field acceptance. */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
export const QL476_REPORT='rosevear.comms.ql476.on-demand-worker.v1';
export const QL476_OWNER='rosevear.comms.ql476.worker-owner.v1';
export const QL476_WITNESS='rosevear.comms.ql476.worker-witness.v1';
const HOST='DESKTOP-AE894KC',TASK='Rosevear-CommsHub-Worker';
const HEX=/^[a-f0-9]{64}$/,SHA=/^[a-f0-9]{40}$/,ID=/^[a-f0-9-]{36}$/;
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const recent=(t,now)=>Number.isSafeInteger(t)&&Number.isSafeInteger(now)&&t<=now&&now-t<=300000;
const held=(reason,more={})=>Object.freeze({state:'HOLD',reason,
  installedOnOriginalHostVerified:false,firstBootPhysicallyVerified:false,
  physicalRecoveryAccepted:false,receiverActivated:false,livePeerAccepted:false,
  automaticStartAuthorized:false,rebootAuthorized:false,deletedSources:0,...more});
const ownerFields=['schema','host','mainSha','reviewDigest','issuedAtMs','expiresAtMs',
  'scope','explicitLocalInstallObserved','firstRunObserved','recoveryRunObserved',
  'receiverEnableAuthorized','automaticStartAuthorized','rebootAuthorized','authorityTransfer'];
const witnessFields=['schema','host','mainSha','reviewDigest','observedAtMs',
  'independentReviewer','originalHostObserved','taskOnDemandVerified',
  'firstRunReceiptObserved','recoveryReceiptObserved','sourcePreserved','authorityTransfer'];
export function reviewQl476WorkerRuns({first,recovery,expectedMainSha,nowMs=Date.now()}={}){
  if(!SHA.test(expectedMainSha??'')||first?.schema!==QL476_REPORT||
   recovery?.schema!==QL476_REPORT||first.phase!=='VERIFY'||recovery.phase!=='RECOVERED')
    return held('QL476_TWO_ORIGINAL_HOST_RUN_REPORTS_REQUIRED');
  for(const x of [first,recovery]){
    if(x.host!==HOST||x.mainSha!==expectedMainSha||x.taskName!==TASK||
      x.taskTriggerCount!==0||x.taskEnabled!==true||
      x.taskLogonMode!=='INTERACTIVE_OWNER'||x.workerScriptHash!==first.workerScriptHash||
      !HEX.test(x.workerScriptHash??'')||x.receiverPort8788Listeners!==0||
      x.legacyTaskDisabled!==true||x.serviceAutostartEnabled!==false||
      x.sourceWrites!==0||x.sourceDeletes!==0||x.receiverActivated!==false||
      x.rebootPerformed!==false||x.peerSent!==false||x.lastTaskResult!==0||
      !recent(x.observedAtMs,nowMs)||!x.run||!ID.test(x.run.runId??'')||
      !recent(x.run.observedAtMs,nowMs)||x.run.mainSha!==expectedMainSha||
      x.run.workerScriptHash!==x.workerScriptHash||x.run.host!==HOST||
      x.run.receiverPort8788Listeners!==0||x.run.peerSent!==false||
      !Number.isSafeInteger(x.run.uptimeSeconds)||x.run.uptimeSeconds<0||
      !Number.isSafeInteger(x.run.processCount)||x.run.processCount<1)
      return held('QL476_ORIGINAL_HOST_TASK_OR_RECEIVER_OFF_EVIDENCE_INVALID');
  }
  if(first.run.runId===recovery.run.runId||
    first.run.observedAtMs>=recovery.run.observedAtMs||
    first.run.osBootId!==recovery.run.osBootId||
    !ID.test(first.run.osBootId??'')||recovery.priorRunId!==first.run.runId)
    return held('QL476_RECOVERY_MUST_BE_NEW_ON_DEMAND_RUN_SAME_OS_BOOT');
  return {...held('QL476_CLAIMS_ONLY_FIELD_WITNESS_AND_OFFLINE_BACKUP_STILL_REQUIRED'),
   state:'TWO_LOCAL_WORKER_RUNS_REVIEW_HELD',
   mainSha:expectedMainSha,reviewDigest:digest({
     mainSha:expectedMainSha,workerHash:first.workerScriptHash,
     firstId:first.run.runId,recoveryId:recovery.run.runId,osBootId:first.run.osBootId
   }),localRunsReviewed:2,taskHasNoTriggers:true,sysopSampleCaptured:true};
}
export function reviewQl476IndependentAcceptance({runs,ownerPacket,witnessPacket,
  ownerPin,witnessPin,nowMs=Date.now()}={}){
  if(runs?.state!=='TWO_LOCAL_WORKER_RUNS_REVIEW_HELD'||
    typeof ownerPin!=='string'||typeof witnessPin!=='string'||ownerPin===witnessPin||
    !verifyQl468Packet(ownerPacket,ownerPin,ownerFields)||
    !verifyQl468Packet(witnessPacket,witnessPin,witnessFields))
    return held('QL476_TWO_DISTINCT_ED25519_SIGNERS_REQUIRED');
  const o=ownerPacket.payload,w=witnessPacket.payload;
  if(o.schema!==QL476_OWNER||w.schema!==QL476_WITNESS||
    o.host!==HOST||w.host!==HOST||o.mainSha!==runs.mainSha||w.mainSha!==runs.mainSha||
    !eq(o.reviewDigest,runs.reviewDigest)||!eq(w.reviewDigest,runs.reviewDigest)||
    !recent(o.issuedAtMs,nowMs)||!recent(w.observedAtMs,nowMs)||
    !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||
    o.expiresAtMs-o.issuedAtMs>900000||
    o.scope!=='ORIGINAL_HOST_SUPERVISED_TASK_REVIEW_ONLY'||
    o.explicitLocalInstallObserved!==true||o.firstRunObserved!==true||
    o.recoveryRunObserved!==true||o.receiverEnableAuthorized!==false||
    o.automaticStartAuthorized!==false||o.rebootAuthorized!==false||
    o.authorityTransfer!==false||w.independentReviewer!==true||
    w.originalHostObserved!==true||w.taskOnDemandVerified!==true||
    w.firstRunReceiptObserved!==true||w.recoveryReceiptObserved!==true||
    w.sourcePreserved!==true||w.authorityTransfer!==false)
    return held('QL476_SIGNED_SCOPE_FRESHNESS_OR_INDEPENDENCE_MISMATCH');
  return {...held('QL476_SIGNED_CLAIMS_NOT_INDEPENDENT_PHYSICAL_VERIFICATION'),
    state:'SIGNED_LOCAL_WORKER_REVIEW_HELD',twoSignaturesValid:true,
    reviewDigest:runs.reviewDigest};
}
export const QL476_BOUNDARY=Object.freeze({
  windowsTask:'ORIGINAL_HOST_NOT_OBSERVED',startup:'ON_DEMAND_ONLY',
  scmService:'NOT_INSTALLED',port8788:'OFF',firstLivePeer:'HOLD',
  automaticInstall:false,automaticRecovery:false,
  originalHostPhysicalWitness:'OUT_OF_BAND_REQUIRED'
});
