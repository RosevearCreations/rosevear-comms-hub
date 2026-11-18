import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {QL472_OWNER,QL472_WITNESS,QL472_PATHS,QL472_HOST,QL472_SOURCE,QL472_BOUNDARY,
 reviewQl472SourceConsolidation,reviewQl472ManualBootstrap} from './ql472-original-host-source-consolidation.mjs';
import {QL468_WORKER_SCHEMA} from './ql468-original-host-readiness.mjs';
const sha='a'.repeat(40),now=Date.now(),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const keys=Object.fromEntries(['installOwner','installWitness','owner','witness'].map(x=>[x,generateKeyPairSync('ed25519')]));
const pin=x=>keys[x].publicKey.export({type:'spki',format:'der'}).toString('base64');
const signed=(data,key)=>({payload:data,signature:sign(null,Buffer.from(JSON.stringify(data)),keys[key].privateKey).toString('base64')});
const census={schema:'rosevear.comms.ql471.original-host-checkout-census.v1',
 host:QL472_HOST,inspectedAtUtc:new Date(now-9000).toISOString(),
 serviceInspectionSucceeded:true,taskInspectionSucceeded:true,processInspectionSucceeded:true,
 actionExecuted:false,deletionApproved:false,
 repos:QL472_PATHS.map((path,i)=>({
  path,exists:true,gitHead:i===0?sha:String(i).repeat(40),branch:'main',
  tracksExpectedOrigin:true,localChangesOrUntracked:i>=1&&i<=3,
  serviceReferencesPath:false,scheduledTaskReferencesPath:false,
  runningProcessReferencesPath:false,safeToDeleteAutomatically:false}))};
const consolidation=reviewQl472SourceConsolidation({census,expectedMainSha:sha});
const intake={state:'MISSING_WORKER_REVIEW_HELD',workerMissing:true,stale:false,
 sourceMainSha:sha,observed470AtMs:now-16000,receiverPort8788ListenerCount:0,
 snapshotSha256:'f'.repeat(64)};
const install={schema:QL468_WORKER_SCHEMA,host:QL472_HOST,
 serviceName:'Rosevear-CommsHub',serviceAccount:'NT SERVICE\\Rosevear-CommsHub',
 startupMode:'DEMAND_ONLY',sourceMainSha:sha,workerImageSha256:'b'.repeat(64),
 receiverOffEvidenceSha256:'c'.repeat(64),obsoleteTaskDisabled:true,
 networkExposure:'PRIVATE_LOOPBACK_ONLY',rollbackPlanSha256:'d'.repeat(64),
 issuedAtMs:now-13000,expiresAtMs:now+120000,
 authorityTransfer:false,automaticInstall:false};
const workerPlan={owner:signed(install,'installOwner'),witness:signed(install,'installWitness')};
const owner={schema:QL472_OWNER,host:QL472_HOST,sourceMainSha:sha,
 sourcePath:QL472_SOURCE,censusSha256:consolidation.censusSha256,
 snapshotSha256:intake.snapshotSha256,workerPlanSha256:hash(install),
 workerImageSha256:install.workerImageSha256,issuedAtMs:now-10000,expiresAtMs:now+120000,
 scope:'MANUAL_ORIGINAL_HOST_PREPARATION_ONLY',humanHostInstallRequired:true,
 automaticInstall:false,automaticStart:false,autoSend:false,
 receiverActivationRequested:false,cleanupRequested:false,authorityTransfer:false};
const witness={schema:QL472_WITNESS,host:QL472_HOST,sourceMainSha:sha,
 sourcePath:QL472_SOURCE,censusSha256:consolidation.censusSha256,
 snapshotSha256:intake.snapshotSha256,workerPlanSha256:hash(install),
 workerImageSha256:install.workerImageSha256,observedAtMs:now-8000,
 independentReviewer:true,workerAbsentObserved:true,
 legacyTaskDisabledObserved:true,port8788ListenerCount:0,
 automaticInstall:false,authorityTransfer:false};
const args=(o=owner,w=witness)=>({
 consolidation,intake,workerPlan,
 workerOwnerPin:pin('installOwner'),workerWitnessPin:pin('installWitness'),
 ownerPacket:signed(o,'owner'),witnessPacket:signed(w,'witness'),
 ownerPin:pin('owner'),witnessPin:pin('witness'),
 expectedMainSha:sha,nowMs:now});
test('QL472 preserves source and three locally changed copies with zero deletion',()=>{
 assert.equal(consolidation.state,'SOURCE_CONSOLIDATION_REVIEW_HELD');
 assert.equal(consolidation.dirtyCopyCount,3);
 assert.equal(consolidation.archiveCandidateCount,1);
 assert.ok(consolidation.items.every(x=>x.safeToDeleteAutomatically===false));
 for(const c of [
  {...census,serviceInspectionSucceeded:false},
  {...census,deletionApproved:true},
  {...census,repos:census.repos.slice(1)},
  {...census,repos:census.repos.map((r,i)=>i===1?{...r,serviceReferencesPath:true}:r)},
  {...census,repos:census.repos.map((r,i)=>i===0?{...r,localChangesOrUntracked:true}:r)},
  {...census,repos:census.repos.map((r,i)=>i===0?{...r,gitHead:'e'.repeat(40)}:r)}
 ])assert.equal(reviewQl472SourceConsolidation({census:c,expectedMainSha:sha}).state,'HOLD');
});
test('QL472 four independent signatures review only manual preparation',()=>{
 const x=reviewQl472ManualBootstrap(args());
 assert.equal(x.state,'SIGNED_MANUAL_BOOTSTRAP_PLAN_REVIEW_HELD');
 assert.equal(x.signedPlanReview,true);
 assert.equal(x.installationAuthorized,false);assert.equal(x.firstPeerAllowed,false);
 assert.equal(x.cleanupAuthorized,false);assert.equal(x.filesDeleted,0);
 for(const bad of [{automaticInstall:true},{automaticStart:true},{autoSend:true},
  {cleanupRequested:true},{receiverActivationRequested:true},
  {scope:'AUTOMATIC_INSTALL'},{humanHostInstallRequired:false},
  {sourcePath:'C:\\other'},{sourceMainSha:'e'.repeat(40)},
  {snapshotSha256:'e'.repeat(64)},{workerPlanSha256:'9'.repeat(64)},
  {expiresAtMs:now-1},{issuedAtMs:now-400000}])
  assert.equal(reviewQl472ManualBootstrap(args({...owner,...bad})).state,'HOLD');
 for(const bad of [{independentReviewer:false},{workerAbsentObserved:false},
  {legacyTaskDisabledObserved:false},{port8788ListenerCount:1},
  {automaticInstall:true},{workerImageSha256:'9'.repeat(64)}])
  assert.equal(reviewQl472ManualBootstrap(args(owner,{...witness,...bad})).state,'HOLD');
 assert.equal(reviewQl472ManualBootstrap({...args(),witnessPin:pin('owner')}).state,'HOLD');
 assert.equal(reviewQl472ManualBootstrap({...args(),workerOwnerPin:pin('owner')}).state,'HOLD');
 assert.equal(reviewQl472ManualBootstrap({...args(),workerPlan:{
  ...workerPlan,owner:signed({...install,automaticInstall:true},'installOwner')}}).state,'HOLD');
});
test('QL472 fresh host evidence gates do not accept historical or installed service',()=>{
 for(const bad of [{stale:true},{workerMissing:false},{state:'HISTORICAL_SNAPSHOT_REVIEW_HELD'},
  {observed470AtMs:now-400000},{receiverPort8788ListenerCount:1},
  {sourceMainSha:'8'.repeat(40)}])
  assert.equal(reviewQl472ManualBootstrap({...args(),intake:{...intake,...bad}}).state,'HOLD');
 assert.equal(reviewQl472ManualBootstrap({...args(),consolidation:{...consolidation,state:'HOLD'}}).state,'HOLD');
 assert.equal(QL472_BOUNDARY.automaticInstall,false);
 assert.equal(QL472_BOUNDARY.livePeer,'HOLD');
});
test('QL472 original-host PowerShell script is inspect only and zero deletion',()=>{
 const ps=readFileSync(new URL('./ql472-original-host-consolidation-readonly.ps1',import.meta.url),'utf8');
 assert.match(ps,/HOLD_QL472_ORIGINAL_HOST_REQUIRED/);
 assert.match(ps,/ql471-original-host-checkout-census.ps1/);
 assert.match(ps,/safeToDeleteAutomatically=\$false/);
 assert.match(ps,/filesDeleted=0/);assert.match(ps,/filesMoved=0/);
 assert.doesNotMatch(ps,/\b(?:Remove-Item|Move-Item|Copy-Item|git pull|git fetch|git checkout|New-Service|Set-Service|Stop-Service|Start-Service|Restart-Computer|Register-ScheduledTask|Invoke-WebRequest|Invoke-RestMethod)\b/i);
});
