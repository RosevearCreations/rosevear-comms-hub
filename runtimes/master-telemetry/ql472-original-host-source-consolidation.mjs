/** QL-472: PURE read-only checkout preservation and signed bootstrap PLAN review.
 * Signed bytes establish provenance claims, not physical host authorization.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet,reviewQl468WorkerInstall} from './ql468-original-host-readiness.mjs';
export const QL472_OWNER='rosevear.comms.ql472.owner-manual-bootstrap.v1';
export const QL472_WITNESS='rosevear.comms.ql472.independent-manual-bootstrap.v1';
export const QL472_HOST='DESKTOP-AE894KC';
export const QL472_SOURCE='C:\\rc470';
export const QL472_PATHS=Object.freeze([
 'C:\\rc470','C:\\Users\\Ree\\rosevear-comms-hub',
 'C:\\Users\\Ree\\rosevear-comms-hub-current','C:\\Users\\Ree\\rosevear-comms-hub-clean',
 'C:\\Users\\Ree\\rosevear-comms-hub-ql340'
]);
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const when=(at,now)=>Number.isSafeInteger(at)&&Number.isSafeInteger(now)&&at<=now&&now-at<=300000;
const norm=x=>typeof x==='string'?x.toLowerCase():null;
const hold=(reason,more={})=>Object.freeze({state:'HOLD',reason,installationAuthorized:false,
 workerInstalled:false,receiverActivated:false,firstPeerAllowed:false,cleanupAuthorized:false,
 filesDeleted:0,filesMoved:0,windowsServicesChanged:0,hostRebootAuthorized:false,
 externalHostVerified:false,signedClaimIsHostProof:false,...more});
const ownerFields=['schema','host','sourceMainSha','sourcePath','censusSha256',
 'snapshotSha256','workerPlanSha256','workerImageSha256','issuedAtMs','expiresAtMs',
 'scope','humanHostInstallRequired','automaticInstall','automaticStart',
 'autoSend','receiverActivationRequested','cleanupRequested','authorityTransfer'];
const witnessFields=['schema','host','sourceMainSha','sourcePath','censusSha256',
 'snapshotSha256','workerPlanSha256','workerImageSha256','observedAtMs',
 'independentReviewer','workerAbsentObserved','legacyTaskDisabledObserved',
 'port8788ListenerCount','automaticInstall','authorityTransfer'];

export function reviewQl472SourceConsolidation({census,expectedMainSha}={}){
 if(!SHA.test(expectedMainSha??'')||!census||census.schema!=='rosevear.comms.ql471.original-host-checkout-census.v1'||
 census.host!==QL472_HOST||!Array.isArray(census.repos)||census.repos.length!==5||
 census.serviceInspectionSucceeded!==true||census.taskInspectionSucceeded!==true||
 census.processInspectionSucceeded!==true||census.actionExecuted!==false||
 census.deletionApproved!==false)return hold('QL472_COMPLETE_ORIGINAL_HOST_CENSUS_REQUIRED');
 const seen=new Set(),items=[];
 for(const x of census.repos){
  if(!x||!QL472_PATHS.some(p=>norm(p)===norm(x.path))||seen.has(norm(x.path))||
    x.exists!==true||x.branch!=='main'||!SHA.test(x.gitHead??'')||
    x.tracksExpectedOrigin!==true||typeof x.localChangesOrUntracked!=='boolean'||
    x.serviceReferencesPath!==false||x.scheduledTaskReferencesPath!==false||
    x.runningProcessReferencesPath!==false||x.safeToDeleteAutomatically!==false)
    return hold('QL472_UNVERIFIED_DIRTY_OR_REFERENCED_CHECKOUT');
  seen.add(norm(x.path));
  const primary=norm(x.path)===norm(QL472_SOURCE);
  if(primary&&(x.gitHead!==expectedMainSha||x.localChangesOrUntracked))
    return hold('QL472_PRIMARY_SOURCE_MUST_BE_CLEAN_CURRENT_MAIN');
  items.push({path:x.path,gitHead:x.gitHead,localChangesOrUntracked:x.localChangesOrUntracked,
   classification:primary?'KEEP_CURRENT_MAIN':
    x.localChangesOrUntracked?'BACKUP_LOCAL_CHANGES_BEFORE_REVIEW':'ARCHIVE_CANDIDATE_OWNER_REVIEW',
   safeToDeleteAutomatically:false});
 }
 if(seen.size!==5)return hold('QL472_FIVE_UNIQUE_CHECKOUTS_REQUIRED');
 return {...hold('QL472_OWNER_BACKUPS_AND_ARCHIVE_REVIEW_REQUIRED'),
   state:'SOURCE_CONSOLIDATION_REVIEW_HELD',
   sourceMainSha:expectedMainSha,primarySource:QL472_SOURCE,
   censusSha256:hash({host:census.host,time:census.inspectedAtUtc,
    repos:census.repos.map(x=>({path:norm(x.path),sha:x.gitHead,dirty:x.localChangesOrUntracked}))}),
   dirtyCopyCount:items.filter(x=>x.localChangesOrUntracked).length,
   archiveCandidateCount:items.filter(x=>x.classification==='ARCHIVE_CANDIDATE_OWNER_REVIEW').length,
   items};
}
/** Four mutually independent signers review an INSTALL PLAN; do not execute. */
export function reviewQl472ManualBootstrap({consolidation,intake,workerPlan,
  workerOwnerPin,workerWitnessPin,ownerPacket,witnessPacket,ownerPin,witnessPin,
  expectedMainSha,nowMs=Date.now()}={}){
 if(consolidation?.state!=='SOURCE_CONSOLIDATION_REVIEW_HELD'||
   consolidation.sourceMainSha!==expectedMainSha||
   intake?.state!=='MISSING_WORKER_REVIEW_HELD'||intake.workerMissing!==true||
   intake.stale!==false||intake.sourceMainSha!==expectedMainSha||
   intake.receiverPort8788ListenerCount!==0||
   !when(intake.observed470AtMs,nowMs))
  return hold('QL472_FRESH_MISSING_WORKER_HOST_INTAKE_REQUIRED');
 const pins=[workerOwnerPin,workerWitnessPin,ownerPin,witnessPin];
 if(pins.some(p=>typeof p!=='string'||p.length<30)||new Set(pins).size!==4||
   !verifyQl468Packet(ownerPacket,ownerPin,ownerFields)||
   !verifyQl468Packet(witnessPacket,witnessPin,witnessFields))
  return hold('QL472_FOUR_DISTINCT_ED25519_SIGNERS_REQUIRED');
 const install=reviewQl468WorkerInstall({
  plan:workerPlan,ownerPin:workerOwnerPin,witnessPin:workerWitnessPin,expectedMainSha,nowMs});
 if(install.state!=='SIGNED_INSTALL_PLAN_REVIEW_HELD')
  return hold('QL472_Q468_SIGNED_WORKER_PREPARATION_PLAN_REQUIRED');
 const a=ownerPacket.payload,b=witnessPacket.payload;
 if(a.schema!==QL472_OWNER||b.schema!==QL472_WITNESS||
   a.host!==QL472_HOST||b.host!==QL472_HOST||
   a.sourceMainSha!==expectedMainSha||b.sourceMainSha!==expectedMainSha||
   norm(a.sourcePath)!==norm(QL472_SOURCE)||norm(b.sourcePath)!==norm(QL472_SOURCE)||
   !eq(a.censusSha256,consolidation.censusSha256)||
   !eq(b.censusSha256,consolidation.censusSha256)||
   !eq(a.snapshotSha256,intake.snapshotSha256)||
   !eq(b.snapshotSha256,intake.snapshotSha256)||
   !eq(a.workerPlanSha256,install.planDigest)||
   !eq(b.workerPlanSha256,install.planDigest)||
   !eq(a.workerImageSha256,install.workerImageSha256)||
   !eq(b.workerImageSha256,install.workerImageSha256)||
   !when(a.issuedAtMs,nowMs)||!when(b.observedAtMs,nowMs)||
   a.issuedAtMs<intake.observed470AtMs||b.observedAtMs<intake.observed470AtMs||
   !Number.isSafeInteger(a.expiresAtMs)||a.expiresAtMs<=nowMs||
   a.expiresAtMs-a.issuedAtMs>900000||
   a.scope!=='MANUAL_ORIGINAL_HOST_PREPARATION_ONLY'||
   a.humanHostInstallRequired!==true||a.automaticInstall!==false||
   a.automaticStart!==false||a.autoSend!==false||
   a.receiverActivationRequested!==false||a.cleanupRequested!==false||
   a.authorityTransfer!==false||b.independentReviewer!==true||
   b.workerAbsentObserved!==true||b.legacyTaskDisabledObserved!==true||
   b.port8788ListenerCount!==0||b.automaticInstall!==false||
   b.authorityTransfer!==false)
  return hold('QL472_BOOTSTRAP_SCOPE_HASH_OR_FRESHNESS_DENIED');
 return {...hold('QL472_SIGNED_PLAN_ONLY_NO_WINDOWS_INSTALL_OR_PEER_PERMISSION'),
  state:'SIGNED_MANUAL_BOOTSTRAP_PLAN_REVIEW_HELD',signedPlanReview:true,
  sourceMainSha:expectedMainSha,censusSha256:consolidation.censusSha256,
  workerPlanSha256:install.planDigest,workerImageSha256:install.workerImageSha256,
  originalWorkerStillAbsent:true};
}
export const QL472_BOUNDARY=Object.freeze({
 userObservedWorker:'NOT_INSTALLED',port8788ListenerCount:0,
 legacyStartupTask:'DISABLED',canonicalSource:'C:\\rc470',
 threeDirtyCopiesPreserved:true,cleanArchiveCandidateCount:1,
 automaticInstall:false,automaticCleanup:false,livePeer:'HOLD'
});
