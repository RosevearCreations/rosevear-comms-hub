/** QL-475: original host backup stage and independent read-only review. No I/O. */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
export const QL475_STAGE='rosevear.comms.ql475.archive-stage.v1';
export const QL475_OWNER='rosevear.comms.ql475.backup-owner.v1';
export const QL475_WITNESS='rosevear.comms.ql475.backup-witness.v1';
export const QL475_HOST='DESKTOP-AE894KC';
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/;
const old=Object.freeze({
 'rosevear-comms-hub':['27f7f710cb42da2eb3e829934596e7133a29677b',2013,17],
 'rosevear-comms-hub-current':['8544be0fddeed71aaa1ef676eb692fe66d8d432e',2159,17],
 'rosevear-comms-hub-clean':['56868136d5201cd029bd03ecf2c40ff2043921a7',2177,17]
});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const fresh=(x,n)=>Number.isSafeInteger(x)&&Number.isSafeInteger(n)&&x<=n&&n-x<=300000;
const hold=(reason,additional={})=>Object.freeze({state:'HOLD',reason,archivesDeleted:false,
 sourceCopiesPreserved:true,sourceWrites:0,workerInstalled:false,workerStarted:false,
 receiverActivated:false,hostRebootAuthorized:false,peerSent:false,filesDeleted:0,
 independentPhysicalWitnessAccepted:false,liveBackupAcceptance:false,...additional});
const ownerFields=['schema','host','sourceMainSha','stageDigest','stageId','issuedAtMs','expiresAtMs','scope',
 'offlineCopyIndependentlyObserved','cleanupAuthorized','workerInstallAuthorized',
 'receiverEnableAuthorized','rebootAuthorized','authorityTransfer'];
const witnessFields=['schema','host','sourceMainSha','stageDigest','stageId','observedAtMs',
 'independentReviewer','originalHostObserved','fullRestoreReadBack',
 'offlineCopyIndependentlyObserved','sourceUnchanged','authorityTransfer'];
export function reviewQl475ArchiveStage({report,sourceMainSha,nowMs=Date.now()}={}){
 if(!SHA.test(sourceMainSha??'')||report?.schema!==QL475_STAGE||report.host!==QL475_HOST||
 report.sourceMainSha!==sourceMainSha||!fresh(report.observedAtMs,nowMs)||
 !/^[A-Za-z0-9_-]{12,96}$/.test(report.stageId??'')||
 report.filesDeleted!==0||report.filesMoved!==0||report.workerModified!==false||
 report.receiverModified!==false||report.sourceModified!==false||
 report.independentlyWitnessed!==false||!Array.isArray(report.archives)||report.archives.length!==3)
 return hold('QL475_COMPLETE_CURRENT_ORIGINAL_HOST_STAGE_REQUIRED');
 const seen=new Set(),items=[];
 for(const a of report.archives){
  const expect=a&&old[a.sourceName];
  if(!expect||seen.has(a.sourceName)||a.sourceHead!==expect[0]||
    a.trackedChanges!==expect[1]||a.untrackedEntries!==expect[2]||
    !HEX.test(a.zipSha256??'')||!HEX.test(a.sourceTreeSha256??'')||
    !equal(a.sourceTreeSha256,a.restoredTreeSha256)||
    !Number.isSafeInteger(a.sourceFileCount)||a.sourceFileCount<1||
    a.zipEntryCount!==a.sourceFileCount||a.restoredFileCount!==a.sourceFileCount||
    a.zipReadBackVerified!==true||a.allRestoredFileHashesMatch!==true||
    a.hiddenAndUntrackedIncluded!==true||a.isolatedRestoration!==true||
    a.noPathTraversalOrDuplicates!==true||a.sourceUnchanged!==true||
    a.safeToDeleteAutomatically!==false)
   return hold('QL475_ARCHIVE_COVERAGE_OR_CHANGED_SOURCE_MISMATCH');
  seen.add(a.sourceName);
  items.push({name:a.sourceName,head:a.sourceHead,zip:a.zipSha256,
   tree:a.sourceTreeSha256,count:a.sourceFileCount});
 }
 if(seen.size!==3)return hold('QL475_THREE_DISTINCT_OLD_CHECKOUTS_REQUIRED');
 const stageDigest=digest({main:sourceMainSha,host:report.host,stageId:report.stageId,
   archives:items.sort((a,b)=>a.name.localeCompare(b.name))});
 return {...hold('QL475_LOCAL_ARCHIVES_ONLY_NOT_WITNESSED_OFFLINE'),
  state:'THREE_ARCHIVES_STAGED_AND_RESTORED_REVIEW_HELD',stageDigest,sourceMainSha,
  stageId:report.stageId,localFileCount:items.reduce((n,x)=>n+x.count,0),localRestoreVerified:true};
}
export function reviewQl475SignedIndependentRestore({stage,ownerPacket,witnessPacket,
 ownerPin,witnessPin,sourceMainSha,nowMs=Date.now()}={}){
 if(stage?.state!=='THREE_ARCHIVES_STAGED_AND_RESTORED_REVIEW_HELD'||stage.sourceMainSha!==sourceMainSha||
 typeof ownerPin!=='string'||typeof witnessPin!=='string'||ownerPin===witnessPin||
 !verifyQl468Packet(ownerPacket,ownerPin,ownerFields)||!verifyQl468Packet(witnessPacket,witnessPin,witnessFields))
 return hold('QL475_TWO_INDEPENDENT_SOURCE_SIGNERS_REQUIRED');
 const o=ownerPacket.payload,w=witnessPacket.payload;
 if(o.schema!==QL475_OWNER||w.schema!==QL475_WITNESS||
 o.host!==QL475_HOST||w.host!==QL475_HOST||o.sourceMainSha!==sourceMainSha||w.sourceMainSha!==sourceMainSha||
 !equal(o.stageDigest,stage.stageDigest)||!equal(w.stageDigest,stage.stageDigest)||
 o.stageId!==stage.stageId||w.stageId!==stage.stageId||
 !fresh(o.issuedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
 !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||o.expiresAtMs-o.issuedAtMs>900000||
 o.scope!=='OFFLINE_BACKUP_AND_RESTORE_REVIEW_ONLY'||o.offlineCopyIndependentlyObserved!==true||
 o.cleanupAuthorized!==false||o.workerInstallAuthorized!==false||
 o.receiverEnableAuthorized!==false||o.rebootAuthorized!==false||o.authorityTransfer!==false||
 w.independentReviewer!==true||w.originalHostObserved!==true||
 w.fullRestoreReadBack!==true||w.offlineCopyIndependentlyObserved!==true||
 w.sourceUnchanged!==true||w.authorityTransfer!==false)
 return hold('QL475_SIGNED_RESTORE_SCOPE_FRESHNESS_OR_INDEPENDENCE_INVALID');
 return {...hold('QL475_SIGNED_CLAIM_IS_NOT_INDEPENDENT_PHYSICAL_FIELD_PROOF'),
  state:'SIGNED_RESTORE_CLAIMS_REVIEW_HELD',stageDigest:stage.stageDigest,signedClaimsValidated:true};
}
export function reviewQl475SourcePreservation({signed,census,mainSha}={}){
 if(signed?.state!=='SIGNED_RESTORE_CLAIMS_REVIEW_HELD'||!SHA.test(mainSha??'')||
 census?.schema!=='rosevear.comms.ql471.original-host-checkout-census.v1'||
 census.host!==QL475_HOST||!Array.isArray(census.repos)||census.repos.length!==5||
 census.deletionApproved!==false||census.actionExecuted!==false||
 census.serviceInspectionSucceeded!==true||census.taskInspectionSucceeded!==true||
 census.processInspectionSucceeded!==true)
 return hold('QL475_SIGNED_RESTORE_AND_CURRENT_FIVE_FOLDER_CENSUS_REQUIRED');
 const seen=new Set();let oldCount=0,mainCount=0,archiveCount=0;
 for(const r of census.repos){
  const path=r?.path?.toLowerCase();
  if(!path||seen.has(path)||r.exists!==true||r.branch!=='main'||r.tracksExpectedOrigin!==true||
   r.serviceReferencesPath!==false||r.scheduledTaskReferencesPath!==false||
   r.runningProcessReferencesPath!==false||r.safeToDeleteAutomatically!==false)
  return hold('QL475_MISSING_OR_REFERENCED_SOURCE_PATH');
  seen.add(path);
  if(path==='c:\\rc470'){
   if(r.gitHead!==mainSha||r.localChangesOrUntracked!==false)return hold('QL475_PRIMARY_MAIN_NOT_CURRENT_CLEAN');mainCount++;
  }else if(path==='c:\\users\\ree\\rosevear-comms-hub-ql340'){
   if(r.localChangesOrUntracked!==false)return hold('QL475_ARCHIVE_CANDIDATE_CHANGED');archiveCount++;
  }else{
   const name=Object.keys(old).find(x=>path==='c:\\users\\ree\\'+x);
   if(!name||r.gitHead!==old[name][0]||r.localChangesOrUntracked!==true)
    return hold('QL475_OLD_MODIFIED_SOURCE_NOT_PRESERVED');
   oldCount++;
  }
 }
 if(oldCount!==3||mainCount!==1||archiveCount!==1)return hold('QL475_UNEXPECTED_SOURCE_TOPOLOGY');
 return {...hold('QL475_SOURCE_PRESERVED_NO_BRANCH_OR_DIRECTORY_REMOVAL'),
 state:'PRESERVED_CHECKOUTS_REVIEW_HELD',preservedOldCopies:3,cleanWorkingMain:true,
 archiveCandidateCount:1,approvedDeletions:0};
}
export const QL475_BOUNDARY=Object.freeze({lastOwnerWorker:'NOT_INSTALLED',automaticDelete:false,
 automaticInstall:false,actualOfflineBackupObservedByCI:false,
 actualFirstBootObservedByCI:false,firstPeer:'HOLD'});
