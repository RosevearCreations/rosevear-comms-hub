/** QL-473: nonexecuting, independently signed original-host backup/worker plans. */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
import {reviewQl472ManualBootstrap} from './ql472-original-host-source-consolidation.mjs';
export const ARCHIVE_OWNER='rosevear.comms.ql473.archive-owner.v1';
export const ARCHIVE_WITNESS='rosevear.comms.ql473.archive-witness.v1';
export const WORKER_OWNER='rosevear.comms.ql473.worker-owner.v1';
export const WORKER_WITNESS='rosevear.comms.ql473.worker-witness.v1';
const HOST='DESKTOP-AE894KC',MAIN='C:\\rc470',SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/;
const QL340='C:\\Users\\Ree\\rosevear-comms-hub-ql340';
const modified=[['C:\\Users\\Ree\\rosevear-comms-hub',2013,17],
 ['C:\\Users\\Ree\\rosevear-comms-hub-current',2159,17],
 ['C:\\Users\\Ree\\rosevear-comms-hub-clean',2177,17]];
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const recent=(t,now)=>Number.isSafeInteger(t)&&Number.isSafeInteger(now)&&t<=now&&now-t<=300000;
const hold=(reason,extra={})=>Object.freeze({state:'HOLD',reason,backupsRestoredVerified:false,
 archiveDeletionAuthorized:false,archiveDeleted:false,workerInstallAuthorized:false,
 workerInstalled:false,workerStarted:false,receiverActivated:false,firstPeerAllowed:false,
 filesDeleted:0,filesMoved:0,rebootAuthorized:false,sourceWrites:0,...extra});
const archiveOwnerFields=['schema','host','mainSha','backupHash','archivePath','issuedAtMs','expiresAtMs','scope','autoDelete','actualDeleteAuthorized','authorityTransfer'];
const archiveWitnessFields=['schema','host','mainSha','backupHash','archivePath','observedAtMs','independentReviewer','sourceUnreferenced','restoredBackupVerified','authorityTransfer'];
const workerOwnerFields=['schema','host','mainSha','backupHash','bootstrapHash','issuedAtMs','expiresAtMs','scope','automaticInstall','automaticStart','receiverEnable','peerSend','authorityTransfer'];
const workerWitnessFields=['schema','host','mainSha','backupHash','bootstrapHash','observedAtMs','independentReviewer','workerAbsentObserved','rollbackReviewed','authorityTransfer'];
export function reviewQl473BackupClaims({consolidation,claims,expectedMainSha}={}){
 if(!SHA.test(expectedMainSha??'')||consolidation?.state!=='SOURCE_CONSOLIDATION_REVIEW_HELD'||
 consolidation.sourceMainSha!==expectedMainSha||consolidation.primarySource!==MAIN||
 claims?.schema!=='rosevear.comms.ql473.backup-claims.v1'||claims.host!==HOST||
 claims.mainSha!==expectedMainSha||claims.automaticCleanup!==false||
 !Array.isArray(claims.archives)||claims.archives.length!==3)
 return hold('QL473_THREE_DIRTY_COPY_BACKUP_CLAIMS_REQUIRED');
 for(let i=0;i<modified.length;i++){
  const [path,tracked,untracked]=modified[i],a=claims.archives[i];
  const source=consolidation.items?.find(x=>x.path.toLowerCase()===path.toLowerCase());
  if(!a||a.sourcePath!==path||a.trackedCount!==tracked||a.untrackedCount!==untracked||
   !HEX.test(a.archiveSha256??'')||a.zipEntryCount<tracked+untracked||
   a.readOnlyZipChecked!==true||a.restoredCoverageVerified!==false||
   a.safeToDeleteAutomatically!==false||source?.localChangesOrUntracked!==true)
   return hold('QL473_BACKUP_COVERAGE_OR_HASH_CLAIMS_MISSING');
 }
 return {...hold('QL473_REAL_BACKUP_BYTES_AND_RESTORE_NEED_INDEPENDENT_HOST_PROOF'),
  state:'BACKUP_CLAIMS_REVIEW_HELD',backupHash:digest(claims),mainSha:expectedMainSha,
  sourceCopyCount:3};
}
export function reviewQl473ArchivePlan({backups,consolidation,ownerPacket,witnessPacket,ownerPin,witnessPin,expectedMainSha,nowMs=Date.now()}={}){
 if(backups?.state!=='BACKUP_CLAIMS_REVIEW_HELD'||consolidation?.state!=='SOURCE_CONSOLIDATION_REVIEW_HELD'||
 typeof ownerPin!=='string'||typeof witnessPin!=='string'||ownerPin===witnessPin||
 !verifyQl468Packet(ownerPacket,ownerPin,archiveOwnerFields)||
 !verifyQl468Packet(witnessPacket,witnessPin,archiveWitnessFields))
 return hold('QL473_TWO_DISTINCT_ARCHIVE_SIGNERS_REQUIRED');
 const o=ownerPacket.payload,w=witnessPacket.payload;
 const archive=consolidation.items.find(x=>x.path.toLowerCase()===QL340.toLowerCase());
 if(!archive||archive.localChangesOrUntracked!==false||archive.classification!=='ARCHIVE_CANDIDATE_OWNER_REVIEW'||
 o.schema!==ARCHIVE_OWNER||w.schema!==ARCHIVE_WITNESS||o.host!==HOST||w.host!==HOST||
 o.mainSha!==expectedMainSha||w.mainSha!==expectedMainSha||
 !equal(o.backupHash,backups.backupHash)||!equal(w.backupHash,backups.backupHash)||
 o.archivePath!==QL340||w.archivePath!==QL340||!recent(o.issuedAtMs,nowMs)||
 !recent(w.observedAtMs,nowMs)||!Number.isSafeInteger(o.expiresAtMs)||
 o.expiresAtMs<=nowMs||o.expiresAtMs-o.issuedAtMs>900000||
 o.scope!=='OFFLINE_ARCHIVE_REVIEW_ONLY'||o.autoDelete!==false||
 o.actualDeleteAuthorized!==false||o.authorityTransfer!==false||
 w.independentReviewer!==true||w.sourceUnreferenced!==true||
 w.restoredBackupVerified!==false||w.authorityTransfer!==false)
 return hold('QL473_ARCHIVE_CANDIDATE_SCOPE_OR_SIGNER_INVALID');
 return {...hold('QL473_SIGNED_ARCHIVE_PLAN_NO_DELETION'),
  state:'SIGNED_ARCHIVE_PLAN_REVIEW_HELD',signedReview:true,archivePath:QL340};
}
export function reviewQl473WorkerPlan({backups,bootstrapArgs,ownerPacket,witnessPacket,ownerPin,witnessPin,expectedMainSha,nowMs=Date.now()}={}){
 const bootstrap=reviewQl472ManualBootstrap({...bootstrapArgs,expectedMainSha,nowMs});
 const otherPins=[bootstrapArgs?.workerOwnerPin,bootstrapArgs?.workerWitnessPin,bootstrapArgs?.ownerPin,bootstrapArgs?.witnessPin];
 if(otherPins.some(p=>p===ownerPin||p===witnessPin))return hold('QL473_SUPERVISORS_MUST_BE_INDEPENDENT_OF_Q472_SIGNERS');
 if(backups?.state!=='BACKUP_CLAIMS_REVIEW_HELD'||
 bootstrap?.state!=='SIGNED_MANUAL_BOOTSTRAP_PLAN_REVIEW_HELD'||
 bootstrap.sourceMainSha!==expectedMainSha||typeof ownerPin!=='string'||
 typeof witnessPin!=='string'||ownerPin===witnessPin||
 !verifyQl468Packet(ownerPacket,ownerPin,workerOwnerFields)||
 !verifyQl468Packet(witnessPacket,witnessPin,workerWitnessFields))
 return hold('QL473_Q472_BOOTSTRAP_AND_TWO_SUPERVISORS_REQUIRED');
 const o=ownerPacket.payload,w=witnessPacket.payload;
 const baseHash=digest({main:bootstrap.sourceMainSha,worker:bootstrap.workerPlanSha256,
 census:bootstrap.censusSha256});
 if(o.schema!==WORKER_OWNER||w.schema!==WORKER_WITNESS||
 o.host!==HOST||w.host!==HOST||o.mainSha!==expectedMainSha||w.mainSha!==expectedMainSha||
 !equal(o.backupHash,backups.backupHash)||!equal(w.backupHash,backups.backupHash)||
 !equal(o.bootstrapHash,baseHash)||!equal(w.bootstrapHash,baseHash)||
 !recent(o.issuedAtMs,nowMs)||!recent(w.observedAtMs,nowMs)||
 !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||
 o.expiresAtMs-o.issuedAtMs>900000||
 o.scope!=='MANUAL_ORIGINAL_HOST_WORKER_ENROLLMENT_REVIEW_ONLY'||
 o.automaticInstall!==false||o.automaticStart!==false||
 o.receiverEnable!==false||o.peerSend!==false||o.authorityTransfer!==false||
 w.independentReviewer!==true||w.workerAbsentObserved!==true||
 w.rollbackReviewed!==true||w.authorityTransfer!==false)
 return hold('QL473_SUPERVISED_WORKER_SCOPE_OR_WITNESS_DENIED');
 return {...hold('QL473_SIGNED_ENROLLMENT_PLAN_NOT_PHYSICAL_AUTHORITY'),
 state:'SIGNED_WORKER_PLAN_REVIEW_HELD',signedReview:true};
}
export const QL473_BOUNDARY=Object.freeze({originalWorker:'NOT_INSTALLED',
 actualBackupArchives:'NOT_OBSERVED',automaticArchiveDeletion:false,
 automaticWorkerInstall:false,firstLivePeer:'HOLD'});
