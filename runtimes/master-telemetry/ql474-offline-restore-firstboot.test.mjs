import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,sign} from 'node:crypto';
import {QL474_RESTORE_OWNER,QL474_RESTORE_WITNESS,QL474_BOOT_OWNER,QL474_BOOT_WITNESS,QL474_BOUNDARY,
 reviewQl474RestoreReadback,reviewQl474SignedRestore,reviewQl474FirstBoot,reviewQl474SevenAppSourceStatus} from './ql474-offline-restore-firstboot.mjs';
const sha='a'.repeat(40),now=Date.now();
const keys=Object.fromEntries(['ro','rw','bo','bw'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pin=k=>keys[k].publicKey.export({format:'der',type:'spki'}).toString('base64');
const pkt=(v,k)=>({payload:v,signature:sign(null,Buffer.from(JSON.stringify(v)),keys[k].privateKey).toString('base64')});
const report={schema:'rosevear.comms.ql474.restore-readback.v1',host:'DESKTOP-AE894KC',
 mainSha:sha,filesDeleted:0,actionExecuted:false,archiveDeletionAuthorized:false,
 archives:['rosevear-comms-hub','rosevear-comms-hub-current','rosevear-comms-hub-clean'].map((sourceName,i)=>({
  sourceName,zipSha256:String(i+1).repeat(64),restoredFilesSha256:String(i+4).repeat(64),
  zipEntryCount:100,restoredCount:100,fileHashesMatched:true,restoreIsolated:true,
  pathTraversalFree:true,duplicateFree:true,symlinksRejected:true
 }))};
const review=reviewQl474RestoreReadback({report,mainSha:sha});
const ro={schema:QL474_RESTORE_OWNER,host:'DESKTOP-AE894KC',mainSha:sha,digest:review.digest,
 issuedAtMs:now-8000,expiresAtMs:now+120000,scope:'OFFLINE_RESTORE_REVIEW_ONLY',
 noDelete:true,noInstall:true,authorityTransfer:false};
const rw={schema:QL474_RESTORE_WITNESS,host:'DESKTOP-AE894KC',mainSha:sha,digest:review.digest,
 observedAtMs:now-7000,independent:true,offlineRestoredFilesMatched:true,
 checkoutIsolated:true,authorityTransfer:false};
const signed=(a=ro,b=rw)=>reviewQl474SignedRestore({
 restore:review,ownerPacket:pkt(a,'ro'),witnessPacket:pkt(b,'rw'),
 ownerPin:pin('ro'),witnessPin:pin('rw'),mainSha:sha,nowMs:now});
test('QL474 exact three restore groups preserve all files and fail closed',()=>{
 assert.equal(review.state,'RESTORED_FILE_HASHES_REVIEW_HELD');
 assert.equal(review.filesReviewed,300);assert.equal(review.archiveDeleted,false);
 for(const bad of [{archives:report.archives.slice(1)},{filesDeleted:1},
  {archives:report.archives.map((x,i)=>i===0?{...x,restoredCount:99}:x)},
  {archives:report.archives.map((x,i)=>i===1?{...x,sourceName:report.archives[0].sourceName}:x)},
  {archives:report.archives.map((x,i)=>i===2?{...x,pathTraversalFree:false}:x)}])
 assert.equal(reviewQl474RestoreReadback({report:{...report,...bad},mainSha:sha}).state,'HOLD');
});
test('QL474 signed restore claims remain HELD, never archive deletion',()=>{
 assert.equal(signed().state,'SIGNED_RESTORE_READBACK_REVIEW_HELD');
 for(const b of [{noDelete:false},{scope:'DELETE'},{digest:'9'.repeat(64)},{issuedAtMs:now-500000}])
 assert.equal(signed({...ro,...b}).state,'HOLD');
 for(const b of [{independent:false},{offlineRestoredFilesMatched:false},{checkoutIsolated:false}])
 assert.equal(signed(ro,{...rw,...b}).state,'HOLD');
});
test('QL474 separately signed first boot does not authorize receiver, reboot or peer',()=>{
 const restore=signed(),bo={schema:QL474_BOOT_OWNER,host:'DESKTOP-AE894KC',mainSha:sha,
 digest:restore.digest,workerSha256:'f'.repeat(64),issuedAtMs:now-6000,
 expiresAtMs:now+120000,scope:'FIRST_BOOT_CLAIM_REVIEW_ONLY',
 noAutoStart:true,noReceiver:true,noSend:true,noReboot:true,authorityTransfer:false};
 const bw={schema:QL474_BOOT_WITNESS,host:'DESKTOP-AE894KC',mainSha:sha,
 digest:restore.digest,workerSha256:'f'.repeat(64),observedAtMs:now-5000,
 independent:true,serviceState:'Running',startupMode:'Manual',
 port8788Listeners:0,legacyTaskDisabled:true,originalHostObserved:true,
 authorityTransfer:false};
 const run=(a=bo,b=bw)=>reviewQl474FirstBoot({restore,ownerPacket:pkt(a,'bo'),witnessPacket:pkt(b,'bw'),
 ownerPin:pin('bo'),witnessPin:pin('bw'),mainSha:sha,nowMs:now});
 const z=run();assert.equal(z.state,'SIGNED_FIRST_BOOT_REVIEW_HELD');
 assert.equal(z.physicalBootVerified,false);assert.equal(z.receiverEnabled,false);
 for(const b of [{noReceiver:false},{noReboot:false},{noSend:false},{scope:'START'}])
 assert.equal(run({...bo,...b}).state,'HOLD');
 for(const b of [{serviceState:'NOT_INSTALLED'},{port8788Listeners:1},{legacyTaskDisabled:false},{originalHostObserved:false}])
 assert.equal(run(bo,{...bw,...b}).state,'HOLD');
});
test('QL474 exactly 3 masters plus 4 applications; unknown metrics not invented',()=>{
 const z=reviewQl474SevenAppSourceStatus();
 assert.equal(z.state,'SEVEN_APP_READINESS_REVIEW_HELD');
 assert.equal(z.rows.length,7);assert.equal(z.masters,3);assert.equal(z.applications,4);
 assert.equal(z.verifiedLiveLinks,0);
 assert.ok(z.rows.every(a=>a.requestCount===null&&a.sysopRebootVerified===false));
 assert.equal(reviewQl474SevenAppSourceStatus({reports:{unknown:{}}}).state,'HOLD');
 assert.equal(QL474_BOUNDARY.automaticInstall,false);
});
test('QL474 read-only Windows verifier cannot install, remove, extract or reboot',()=>{
 const s=readFileSync(new URL('./ql474-offline-restore-readonly.ps1',import.meta.url),'utf8');
 assert.match(s,/HOLD_QL474_ORIGINAL_HOST_REQUIRED/);
 assert.match(s,/Get-FileHash/);
 assert.match(s,/filesDeleted=0/);
 assert.doesNotMatch(s,/\b(?:Remove-Item|Move-Item|Copy-Item|Expand-Archive|New-Service|Set-Service|Start-Service|Stop-Service|Restart-Computer|Register-ScheduledTask)\b/i);
});
