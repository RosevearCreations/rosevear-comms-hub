import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {QL475_STAGE,QL475_OWNER,QL475_WITNESS,QL475_BOUNDARY,
 reviewQl475ArchiveStage,reviewQl475SignedIndependentRestore,reviewQl475SourcePreservation
} from './ql475-three-archive-acceptance.mjs';
const sha='a'.repeat(40),now=Date.now(),host='DESKTOP-AE894KC';
const original=[
 ['rosevear-comms-hub','27f7f710cb42da2eb3e829934596e7133a29677b',2013],
 ['rosevear-comms-hub-current','8544be0fddeed71aaa1ef676eb692fe66d8d432e',2159],
 ['rosevear-comms-hub-clean','56868136d5201cd029bd03ecf2c40ff2043921a7',2177]];
const report={schema:QL475_STAGE,host,sourceMainSha:sha,stageId:'ql475_mock_stage_001',
 observedAtMs:now-10000,filesDeleted:0,filesMoved:0,workerModified:false,receiverModified:false,
 sourceModified:false,independentlyWitnessed:false,
 archives:original.map(([sourceName,sourceHead,trackedChanges],i)=>({
  sourceName,sourceHead,trackedChanges,untrackedEntries:17,sourceFileCount:3000,
  zipEntryCount:3000,restoredFileCount:3000,zipSha256:String(i+1).repeat(64),
  sourceTreeSha256:String(i+4).repeat(64),restoredTreeSha256:String(i+4).repeat(64),
  zipReadBackVerified:true,allRestoredFileHashesMatch:true,hiddenAndUntrackedIncluded:true,
  isolatedRestoration:true,noPathTraversalOrDuplicates:true,sourceUnchanged:true,
  safeToDeleteAutomatically:false}))};
const stage=reviewQl475ArchiveStage({report,sourceMainSha:sha,nowMs:now});
const keys=Object.fromEntries(['owner','witness'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pin=k=>keys[k].publicKey.export({format:'der',type:'spki'}).toString('base64');
const pkt=(x,k)=>({payload:x,signature:sign(null,Buffer.from(JSON.stringify(x)),keys[k].privateKey).toString('base64')});
const owner={schema:QL475_OWNER,host,sourceMainSha:sha,stageDigest:stage.stageDigest,
 stageId:stage.stageId,issuedAtMs:now-5000,expiresAtMs:now+120000,
 scope:'OFFLINE_BACKUP_AND_RESTORE_REVIEW_ONLY',offlineCopyIndependentlyObserved:true,
 cleanupAuthorized:false,workerInstallAuthorized:false,receiverEnableAuthorized:false,
 rebootAuthorized:false,authorityTransfer:false};
const witness={schema:QL475_WITNESS,host,sourceMainSha:sha,stageDigest:stage.stageDigest,
 stageId:stage.stageId,observedAtMs:now-4000,independentReviewer:true,
 originalHostObserved:true,fullRestoreReadBack:true,offlineCopyIndependentlyObserved:true,
 sourceUnchanged:true,authorityTransfer:false};
const signed=(a=owner,b=witness)=>reviewQl475SignedIndependentRestore({
 stage,ownerPacket:pkt(a,'owner'),witnessPacket:pkt(b,'witness'),
 ownerPin:pin('owner'),witnessPin:pin('witness'),sourceMainSha:sha,nowMs:now});
test('QL475 stage requires all changed and untracked files from 3 exact source revisions',()=>{
 assert.equal(stage.state,'THREE_ARCHIVES_STAGED_AND_RESTORED_REVIEW_HELD');
 assert.equal(stage.localFileCount,9000);assert.equal(stage.liveBackupAcceptance,false);
 for(const bad of [{filesDeleted:1},{sourceModified:true},
  {archives:report.archives.slice(1)},
  {archives:report.archives.map((x,i)=>i===0?{...x,untrackedEntries:16}:x)},
  {archives:report.archives.map((x,i)=>i===1?{...x,restoredFileCount:1}:x)},
  {archives:report.archives.map((x,i)=>i===2?{...x,sourceName:report.archives[0].sourceName}:x)},
  {archives:report.archives.map((x,i)=>i===2?{...x,sourceTreeSha256:'f'.repeat(64)}:x)}])
 assert.equal(reviewQl475ArchiveStage({report:{...report,...bad},sourceMainSha:sha,nowMs:now}).state,'HOLD');
 assert.equal(reviewQl475ArchiveStage({report,sourceMainSha:sha,nowMs:now+500000}).state,'HOLD');
});
test('QL475 signatures require two distinct independently pinned reviewers',()=>{
 const z=signed();assert.equal(z.state,'SIGNED_RESTORE_CLAIMS_REVIEW_HELD');
 assert.equal(z.liveBackupAcceptance,false);assert.equal(z.workerInstalled,false);
 for(const bad of [{cleanupAuthorized:true},{workerInstallAuthorized:true},
  {receiverEnableAuthorized:true},{rebootAuthorized:true},{scope:'DELETE'},
  {offlineCopyIndependentlyObserved:false}])
 assert.equal(signed({...owner,...bad}).state,'HOLD');
 for(const bad of [{independentReviewer:false},{fullRestoreReadBack:false},
  {originalHostObserved:false},{sourceUnchanged:false}])
 assert.equal(signed(owner,{...witness,...bad}).state,'HOLD');
 assert.equal(reviewQl475SignedIndependentRestore({
  stage,ownerPacket:pkt(owner,'owner'),witnessPacket:pkt(witness,'witness'),
  ownerPin:pin('owner'),witnessPin:pin('owner'),sourceMainSha:sha,nowMs:now
 }).state,'HOLD');
});
test('QL475 protected consolidation requires all five intact checkouts',()=>{
 const census={schema:'rosevear.comms.ql471.original-host-checkout-census.v1',
 host,actionExecuted:false,deletionApproved:false,serviceInspectionSucceeded:true,
 taskInspectionSucceeded:true,processInspectionSucceeded:true,
 repos:[['C:\\rc470',sha,false],
  ...original.map(([name,head])=>['C:\\Users\\Ree\\'+name,head,true]),
  ['C:\\Users\\Ree\\rosevear-comms-hub-ql340','6'.repeat(40),false]
 ].map(([path,gitHead,localChangesOrUntracked])=>({
  path,gitHead,localChangesOrUntracked,exists:true,branch:'main',tracksExpectedOrigin:true,
  serviceReferencesPath:false,scheduledTaskReferencesPath:false,
  runningProcessReferencesPath:false,safeToDeleteAutomatically:false}))};
 const x=reviewQl475SourcePreservation({signed:signed(),census,mainSha:sha});
 assert.equal(x.state,'PRESERVED_CHECKOUTS_REVIEW_HELD');
 assert.equal(x.preservedOldCopies,3);assert.equal(x.approvedDeletions,0);
 assert.equal(reviewQl475SourcePreservation({signed:signed(),
  census:{...census,repos:census.repos.slice(0,4)},mainSha:sha}).state,'HOLD');
 assert.equal(reviewQl475SourcePreservation({signed:signed(),
  census:{...census,repos:census.repos.map((x,i)=>i===2?{...x,localChangesOrUntracked:false}:x)},mainSha:sha}).state,'HOLD');
});
test('QL475 Windows stages require explicit owner switch and no service or deletion actions',()=>{
 const src=readFileSync(new URL('./ql475-three-archive-original-host.ps1',import.meta.url),'utf8');
 assert.match(src,/HOLD_QL475_ORIGINAL_HOST_REQUIRED/);
 assert.match(src,/ApproveLocalStage/);
 assert.match(src,/CreateEntryFromFile/);
 assert.match(src,/Get-FileHash/);
 assert.match(src,/filesDeleted=0/);
 assert.doesNotMatch(src,/\b(?:Remove-Item|git reset|git clean|New-Service|Set-Service|Start-Service|Stop-Service|Restart-Computer|Register-ScheduledTask)\b/i);
 assert.equal(QL475_BOUNDARY.automaticDelete,false);
});
