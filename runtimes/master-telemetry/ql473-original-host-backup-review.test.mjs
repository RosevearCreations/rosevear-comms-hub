import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {ARCHIVE_OWNER,ARCHIVE_WITNESS,WORKER_OWNER,WORKER_WITNESS,QL473_BOUNDARY,
 reviewQl473BackupClaims,reviewQl473ArchivePlan,reviewQl473WorkerPlan} from './ql473-original-host-backup-review.mjs';
import {QL468_WORKER_SCHEMA} from './ql468-original-host-readiness.mjs';
import {QL472_OWNER,QL472_WITNESS,reviewQl472ManualBootstrap} from './ql472-original-host-source-consolidation.mjs';
const sha='a'.repeat(40),now=Date.now(),paths=[
'C:\\Users\\Ree\\rosevear-comms-hub',
'C:\\Users\\Ree\\rosevear-comms-hub-current',
'C:\\Users\\Ree\\rosevear-comms-hub-clean'];
const consolidation={state:'SOURCE_CONSOLIDATION_REVIEW_HELD',
 sourceMainSha:sha,primarySource:'C:\\rc470',
 items:[{path:'C:\\rc470',localChangesOrUntracked:false,classification:'KEEP_CURRENT_MAIN'},
 ...paths.map(path=>({path,localChangesOrUntracked:true,classification:'BACKUP_LOCAL_CHANGES_BEFORE_REVIEW'})),
 {path:'C:\\Users\\Ree\\rosevear-comms-hub-ql340',localChangesOrUntracked:false,
 classification:'ARCHIVE_CANDIDATE_OWNER_REVIEW'}]};
const claims={schema:'rosevear.comms.ql473.backup-claims.v1',host:'DESKTOP-AE894KC',mainSha:sha,
 automaticCleanup:false,archives:paths.map((sourcePath,i)=>({
 sourcePath,trackedCount:[2013,2159,2177][i],untrackedCount:17,
 archiveSha256:String(i+2).repeat(64),zipEntryCount:2500,
 readOnlyZipChecked:true,restoredCoverageVerified:false,safeToDeleteAutomatically:false}))};
const backups=reviewQl473BackupClaims({consolidation,claims,expectedMainSha:sha});
const keys=Object.fromEntries(['owner','witness','supervisor','workerWitness','installOwner','installWitness','bootstrapOwner','bootstrapWitness'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pin=k=>keys[k].publicKey.export({format:'der',type:'spki'}).toString('base64');
const pkt=(v,k)=>({payload:v,signature:sign(null,Buffer.from(JSON.stringify(v)),keys[k].privateKey).toString('base64')});
const o={schema:ARCHIVE_OWNER,host:'DESKTOP-AE894KC',mainSha:sha,backupHash:backups.backupHash,
 archivePath:'C:\\Users\\Ree\\rosevear-comms-hub-ql340',issuedAtMs:now-9000,
 expiresAtMs:now+120000,scope:'OFFLINE_ARCHIVE_REVIEW_ONLY',autoDelete:false,
 actualDeleteAuthorized:false,authorityTransfer:false};
const w={schema:ARCHIVE_WITNESS,host:'DESKTOP-AE894KC',mainSha:sha,backupHash:backups.backupHash,
 archivePath:o.archivePath,observedAtMs:now-8000,independentReviewer:true,
 sourceUnreferenced:true,restoredBackupVerified:false,authorityTransfer:false};
const archive=(a=o,b=w)=>reviewQl473ArchivePlan({backups,consolidation,
 ownerPacket:pkt(a,'owner'),witnessPacket:pkt(b,'witness'),
 ownerPin:pin('owner'),witnessPin:pin('witness'),expectedMainSha:sha,nowMs:now});
test('all three dirty checkouts require backed-up evidence and remain protected',()=>{
 assert.equal(backups.state,'BACKUP_CLAIMS_REVIEW_HELD');
 assert.equal(backups.backupsRestoredVerified,false);
 for(const bad of [{archives:claims.archives.slice(1)},{automaticCleanup:true},
  {archives:claims.archives.map((x,i)=>i===0?{...x,zipEntryCount:3}:x)},
  {archives:claims.archives.map((x,i)=>i===2?{...x,readOnlyZipChecked:false}:x)}])
 assert.equal(reviewQl473BackupClaims({consolidation,claims:{...claims,...bad},expectedMainSha:sha}).state,'HOLD');
});
test('independent archive signatures are review ONLY and never delete ql340',()=>{
 const x=archive();assert.equal(x.state,'SIGNED_ARCHIVE_PLAN_REVIEW_HELD');
 assert.equal(x.archiveDeletionAuthorized,false);
 for(const bad of [{autoDelete:true},{actualDeleteAuthorized:true},
  {archivePath:paths[1]},{scope:'DELETE'},{issuedAtMs:now-700000}])
 assert.equal(archive({...o,...bad}).state,'HOLD');
 for(const bad of [{independentReviewer:false},{sourceUnreferenced:false},
  {restoredBackupVerified:true}])
 assert.equal(archive(o,{...w,...bad}).state,'HOLD');
});

const bootstrapCensus={...consolidation,censusSha256:'c'.repeat(64)};
const intake={state:'MISSING_WORKER_REVIEW_HELD',workerMissing:true,stale:false,
 sourceMainSha:sha,observed470AtMs:now-18000,receiverPort8788ListenerCount:0,
 snapshotSha256:'f'.repeat(64)};
const install={schema:QL468_WORKER_SCHEMA,host:'DESKTOP-AE894KC',
 serviceName:'Rosevear-CommsHub',serviceAccount:'NT SERVICE\\Rosevear-CommsHub',
 startupMode:'DEMAND_ONLY',sourceMainSha:sha,workerImageSha256:'b'.repeat(64),
 receiverOffEvidenceSha256:'c'.repeat(64),obsoleteTaskDisabled:true,
 networkExposure:'PRIVATE_LOOPBACK_ONLY',rollbackPlanSha256:'d'.repeat(64),
 issuedAtMs:now-14000,expiresAtMs:now+120000,
 authorityTransfer:false,automaticInstall:false};
const installPlan={owner:pkt(install,'installOwner'),witness:pkt(install,'installWitness')};
const bOwner={schema:QL472_OWNER,host:'DESKTOP-AE894KC',sourceMainSha:sha,
 sourcePath:'C:\\rc470',censusSha256:bootstrapCensus.censusSha256,
 snapshotSha256:intake.snapshotSha256,workerPlanSha256:createHash('sha256').update(JSON.stringify(install)).digest('hex'),
 workerImageSha256:install.workerImageSha256,issuedAtMs:now-11000,
 expiresAtMs:now+120000,scope:'MANUAL_ORIGINAL_HOST_PREPARATION_ONLY',
 humanHostInstallRequired:true,automaticInstall:false,automaticStart:false,
 autoSend:false,receiverActivationRequested:false,cleanupRequested:false,
 authorityTransfer:false};
const bWitness={schema:QL472_WITNESS,host:'DESKTOP-AE894KC',sourceMainSha:sha,
 sourcePath:'C:\\rc470',censusSha256:bootstrapCensus.censusSha256,
 snapshotSha256:intake.snapshotSha256,workerPlanSha256:bOwner.workerPlanSha256,
 workerImageSha256:install.workerImageSha256,observedAtMs:now-10000,
 independentReviewer:true,workerAbsentObserved:true,legacyTaskDisabledObserved:true,
 port8788ListenerCount:0,automaticInstall:false,authorityTransfer:false};
const bootstrapArgs={consolidation:bootstrapCensus,intake,workerPlan:installPlan,
 workerOwnerPin:pin('installOwner'),workerWitnessPin:pin('installWitness'),
 ownerPacket:pkt(bOwner,'bootstrapOwner'),witnessPacket:pkt(bWitness,'bootstrapWitness'),
 ownerPin:pin('bootstrapOwner'),witnessPin:pin('bootstrapWitness')};

test('supervised worker plan requires independent signatures and still cannot install',()=>{
 const bootstrap=reviewQl472ManualBootstrap({...bootstrapArgs,expectedMainSha:sha,nowMs:now});
 assert.equal(bootstrap.state,'SIGNED_MANUAL_BOOTSTRAP_PLAN_REVIEW_HELD');
 const hash=createHash;
 const bh=hash('sha256').update(JSON.stringify({main:sha,worker:bootstrap.workerPlanSha256,census:bootstrap.censusSha256})).digest('hex');
 const a={schema:WORKER_OWNER,host:'DESKTOP-AE894KC',mainSha:sha,backupHash:backups.backupHash,
 bootstrapHash:bh,issuedAtMs:now-5000,expiresAtMs:now+90000,
 scope:'MANUAL_ORIGINAL_HOST_WORKER_ENROLLMENT_REVIEW_ONLY',
 automaticInstall:false,automaticStart:false,receiverEnable:false,peerSend:false,authorityTransfer:false};
 const b={schema:WORKER_WITNESS,host:'DESKTOP-AE894KC',mainSha:sha,backupHash:backups.backupHash,
 bootstrapHash:bh,observedAtMs:now-4000,independentReviewer:true,
 workerAbsentObserved:true,rollbackReviewed:true,authorityTransfer:false};
 const run=(x=a,y=b)=>reviewQl473WorkerPlan({backups,bootstrapArgs,
 ownerPacket:pkt(x,'supervisor'),witnessPacket:pkt(y,'workerWitness'),
 ownerPin:pin('supervisor'),witnessPin:pin('workerWitness'),expectedMainSha:sha,nowMs:now});
 assert.equal(run().state,'SIGNED_WORKER_PLAN_REVIEW_HELD');
 assert.equal(run().workerInstallAuthorized,false);
 for(const x of [{automaticInstall:true},{automaticStart:true},{receiverEnable:true},
 {peerSend:true},{scope:'INSTALL_AUTOMATICALLY'}])assert.equal(run({...a,...x}).state,'HOLD');
 assert.equal(run(a,{...b,rollbackReviewed:false}).state,'HOLD');
 assert.equal(reviewQl473WorkerPlan({backups,bootstrapArgs:{...bootstrapArgs,workerPlan:{...installPlan,owner:pkt({...install,automaticInstall:true},'installOwner')}},ownerPacket:pkt(a,'supervisor'),witnessPacket:pkt(b,'workerWitness'),ownerPin:pin('supervisor'),witnessPin:pin('workerWitness'),expectedMainSha:sha,nowMs:now}).state,'HOLD');
 assert.equal(QL473_BOUNDARY.automaticWorkerInstall,false);
});
test('QL473 original-host Powershell inspection never modifies files or services',()=>{
 const s=readFileSync(new URL('./ql473-original-host-backup-readonly.ps1',import.meta.url),'utf8');
 assert.match(s,/HOLD_QL473_ORIGINAL_HOST_REQUIRED/);
 assert.match(s,/Get-FileHash/);
 assert.match(s,/filesDeleted=0/);
 assert.doesNotMatch(s,/\b(?:Remove-Item|Move-Item|Copy-Item|New-Service|Set-Service|Start-Service|Stop-Service|Restart-Computer|Register-ScheduledTask)\b/i);
});
