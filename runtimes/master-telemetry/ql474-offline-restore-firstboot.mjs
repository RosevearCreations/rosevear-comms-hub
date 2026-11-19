/** QL-474 pure offline restore, first boot and 7-source readiness review.
 * All signed packets are claims only. No service, network or file operations.
 */
import {createHash,timingSafeEqual} from 'node:crypto';
import {verifyQl468Packet} from './ql468-original-host-readiness.mjs';
export const QL474_RESTORE_OWNER='rosevear.comms.ql474.restore-owner.v1';
export const QL474_RESTORE_WITNESS='rosevear.comms.ql474.restore-witness.v1';
export const QL474_BOOT_OWNER='rosevear.comms.ql474.boot-owner.v1';
export const QL474_BOOT_WITNESS='rosevear.comms.ql474.boot-witness.v1';
export const QL474_SOURCES=Object.freeze(['rosevear-comms-hub','rosevear-comms-hub-current','rosevear-comms-hub-clean']);
export const QL474_PEERS=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub','yw','icamp','rosiedazzlers','devilndove-site']);
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/;
const dig=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&HEX.test(a)&&HEX.test(b)&&timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));
const fresh=(x,now)=>Number.isSafeInteger(x)&&Number.isSafeInteger(now)&&x<=now&&now-x<=300000;
const held=(reason,extra={})=>Object.freeze({state:'HOLD',reason,archiveDeleted:false,workerInstalled:false,
 workerStarted:false,physicalBootVerified:false,actualRestoreWitnessVerified:false,
 receiverEnabled:false,peerAccepted:false,customerSend:false,hostRebootAuthorized:false,
 filesDeleted:0,filesMoved:0,...extra});
const restoreOwnerFields=['schema','host','mainSha','digest','issuedAtMs','expiresAtMs','scope','noDelete','noInstall','authorityTransfer'];
const restoreWitnessFields=['schema','host','mainSha','digest','observedAtMs','independent','offlineRestoredFilesMatched','checkoutIsolated','authorityTransfer'];
const bootOwnerFields=['schema','host','mainSha','digest','workerSha256','issuedAtMs','expiresAtMs','scope','noAutoStart','noReceiver','noSend','noReboot','authorityTransfer'];
const bootWitnessFields=['schema','host','mainSha','digest','workerSha256','observedAtMs','independent','serviceState','startupMode','port8788Listeners','legacyTaskDisabled','originalHostObserved','authorityTransfer'];
export function reviewQl474RestoreReadback({report,mainSha}={}){
 if(!SHA.test(mainSha??'')||report?.schema!=='rosevear.comms.ql474.restore-readback.v1'||
 report.host!=='DESKTOP-AE894KC'||report.mainSha!==mainSha||report.filesDeleted!==0||
 report.actionExecuted!==false||report.archiveDeletionAuthorized!==false||
 !Array.isArray(report.archives)||report.archives.length!==3)return held('QL474_COMPLETE_HOST_RESTORE_REPORT_REQUIRED');
 const seen=new Set();
 for(const a of report.archives){
  if(!a||!QL474_SOURCES.includes(a.sourceName)||seen.has(a.sourceName)||
   !HEX.test(a.zipSha256??'')||!HEX.test(a.restoredFilesSha256??'')||
   !Number.isSafeInteger(a.zipEntryCount)||a.zipEntryCount<=0||
   a.restoredCount!==a.zipEntryCount||a.fileHashesMatched!==true||
   a.restoreIsolated!==true||a.pathTraversalFree!==true||a.duplicateFree!==true||
   a.symlinksRejected!==true)return held('QL474_FILE_LEVEL_RESTORE_UNVERIFIED');
  seen.add(a.sourceName);
 }
 return {...held('QL474_INDEPENDENT_RESTORE_SIGNERS_NOT_YET_PROVIDED'),
  state:'RESTORED_FILE_HASHES_REVIEW_HELD',
  digest:dig({mainSha,archives:report.archives.map(a=>[a.sourceName,a.zipSha256,a.restoredFilesSha256,a.restoredCount]).sort((a,b)=>a[0].localeCompare(b[0]))}),
  archivesReviewed:3,filesReviewed:report.archives.reduce((sum,a)=>sum+a.restoredCount,0)};
}
export function reviewQl474SignedRestore({restore,ownerPacket,witnessPacket,ownerPin,witnessPin,mainSha,nowMs=Date.now()}={}){
 if(restore?.state!=='RESTORED_FILE_HASHES_REVIEW_HELD'||!SHA.test(mainSha??'')||
 typeof ownerPin!=='string'||typeof witnessPin!=='string'||ownerPin===witnessPin||
 !verifyQl468Packet(ownerPacket,ownerPin,restoreOwnerFields)||
 !verifyQl468Packet(witnessPacket,witnessPin,restoreWitnessFields))return held('QL474_TWO_INDEPENDENT_RESTORE_SIGNERS_REQUIRED');
 const o=ownerPacket.payload,w=witnessPacket.payload;
 if(o.schema!==QL474_RESTORE_OWNER||w.schema!==QL474_RESTORE_WITNESS||
 o.host!=='DESKTOP-AE894KC'||w.host!==o.host||o.mainSha!==mainSha||w.mainSha!==mainSha||
 !eq(o.digest,restore.digest)||!eq(w.digest,restore.digest)||
 !fresh(o.issuedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
 !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||o.expiresAtMs-o.issuedAtMs>900000||
 o.scope!=='OFFLINE_RESTORE_REVIEW_ONLY'||o.noDelete!==true||o.noInstall!==true||o.authorityTransfer!==false||
 w.independent!==true||w.offlineRestoredFilesMatched!==true||w.checkoutIsolated!==true||w.authorityTransfer!==false)
  return held('QL474_SIGNED_RESTORE_SCOPE_INVALID');
 return {...held('QL474_SIGNED_RESTORE_REPORT_IS_NOT_PHYSICAL_WITNESS'),
  state:'SIGNED_RESTORE_READBACK_REVIEW_HELD',digest:restore.digest,signedClaimsVerified:true};
}
export function reviewQl474FirstBoot({restore,ownerPacket,witnessPacket,ownerPin,witnessPin,mainSha,nowMs=Date.now()}={}){
 if(restore?.state!=='SIGNED_RESTORE_READBACK_REVIEW_HELD'||!SHA.test(mainSha??'')||
 typeof ownerPin!=='string'||typeof witnessPin!=='string'||ownerPin===witnessPin||
 !verifyQl468Packet(ownerPacket,ownerPin,bootOwnerFields)||
 !verifyQl468Packet(witnessPacket,witnessPin,bootWitnessFields))
 return held('QL474_SEPARATELY_SIGNED_FIRST_BOOT_REQUIRED');
 const o=ownerPacket.payload,w=witnessPacket.payload;
 if(o.schema!==QL474_BOOT_OWNER||w.schema!==QL474_BOOT_WITNESS||
 o.host!=='DESKTOP-AE894KC'||w.host!==o.host||o.mainSha!==mainSha||w.mainSha!==mainSha||
 !eq(o.digest,restore.digest)||!eq(w.digest,restore.digest)||!eq(o.workerSha256,w.workerSha256)||
 !fresh(o.issuedAtMs,nowMs)||!fresh(w.observedAtMs,nowMs)||
 !Number.isSafeInteger(o.expiresAtMs)||o.expiresAtMs<=nowMs||o.expiresAtMs-o.issuedAtMs>900000||
 o.scope!=='FIRST_BOOT_CLAIM_REVIEW_ONLY'||o.noAutoStart!==true||o.noReceiver!==true||
 o.noSend!==true||o.noReboot!==true||o.authorityTransfer!==false||
 w.independent!==true||w.serviceState!=='Running'||w.startupMode!=='Manual'||
 w.port8788Listeners!==0||w.legacyTaskDisabled!==true||w.originalHostObserved!==true||
 w.authorityTransfer!==false)return held('QL474_BOOT_WITNESS_OR_SERVICE_STATE_INVALID');
 return {...held('QL474_SIGNED_FIRST_BOOT_CLAIM_NOT_LIVE_ACCEPTANCE'),
 state:'SIGNED_FIRST_BOOT_REVIEW_HELD',workerSha256:o.workerSha256,signedBootClaimsVerified:true};
}
export function reviewQl474SevenAppSourceStatus({reports={}}={}){
 if(!reports||typeof reports!=='object'||Array.isArray(reports)||
 Object.keys(reports).some(k=>!QL474_PEERS.includes(k)))return held('QL474_INVALID_SOURCE_SET');
 const rows=QL474_PEERS.map((id,index)=>({
  id,role:index<3?'MASTER':'APPLICATION',
  sourceContractPresent:Boolean(reports[id]?.schema==='rosevear.sysop.statistics.v1'&&
   reports[id].appId===id&&reports[id].dataClass==='NON_SENSITIVE_AGGREGATE'&&reports[id].authorizesAction===false),
  signedEndpointAndOriginalHostVerified:false,liveMetricsVerified:false,
  sysopRebootVerified:false,requestCount:null,jobCount:null,queueDepth:null,
  status:'HOLD_FIELD_SOURCE_ENROLLMENT'
 }));
 return {...held('QL474_SEVEN_APP_SOURCE_TRANSPORT_NOT_INDEPENDENTLY_ACCEPTED'),
  state:'SEVEN_APP_READINESS_REVIEW_HELD',masters:3,applications:4,
  verifiedLiveLinks:0,rows};
}
export const QL474_BOUNDARY=Object.freeze({lastObservedWindowsWorker:'NOT_INSTALLED',
 automaticRestore:false,archiveDeletion:false,automaticInstall:false,
 rebootAuthority:false,firstLivePeer:'HOLD',sevenAppLiveAccepted:0});
