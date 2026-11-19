import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {QL476_REPORT,QL476_OWNER,QL476_WITNESS,QL476_BOUNDARY,
  reviewQl476WorkerRuns,reviewQl476IndependentAcceptance} from './ql476-supervised-worker.mjs';
const now=Date.now(),sha='a'.repeat(40),host='DESKTOP-AE894KC';
const run=(id,time)=>({runId:id,osBootId:'11111111-1111-4111-8111-111111111111',
 host,mainSha:sha,workerScriptHash:'b'.repeat(64),observedAtMs:time,
 receiverPort8788Listeners:0,peerSent:false,uptimeSeconds:1200,processCount:42});
const first={schema:QL476_REPORT,phase:'VERIFY',host,mainSha:sha,
 taskName:'Rosevear-CommsHub-Worker',taskTriggerCount:0,taskEnabled:true,
 taskLogonMode:'INTERACTIVE_OWNER',workerScriptHash:'b'.repeat(64),
 receiverPort8788Listeners:0,legacyTaskDisabled:true,
 serviceAutostartEnabled:false,sourceWrites:0,sourceDeletes:0,
 receiverActivated:false,rebootPerformed:false,peerSent:false,
 lastTaskResult:0,observedAtMs:now-20000,
 run:run('22222222-2222-4222-8222-222222222222',now-21000)};
const recovery={...first,phase:'RECOVERED',observedAtMs:now-10000,
 priorRunId:first.run.runId,run:run('33333333-3333-4333-8333-333333333333',now-11000)};
const reviewed=reviewQl476WorkerRuns({first,recovery,expectedMainSha:sha,nowMs:now});
test('two on-demand worker runs yield review HELD, not field GREEN',()=>{
 assert.equal(reviewed.state,'TWO_LOCAL_WORKER_RUNS_REVIEW_HELD');
 assert.equal(reviewed.localRunsReviewed,2);
 assert.equal(reviewed.firstBootPhysicallyVerified,false);
 assert.equal(reviewed.livePeerAccepted,false);
 for(const bad of [{taskTriggerCount:1},{receiverPort8788Listeners:1},
  {serviceAutostartEnabled:true},{workerScriptHash:'f'.repeat(64)},
  {sourceDeletes:1},{peerSent:true},{legacyTaskDisabled:false},
  {taskEnabled:false},{lastTaskResult:1}])
  assert.equal(reviewQl476WorkerRuns({first,recovery:{...recovery,...bad},
    expectedMainSha:sha,nowMs:now}).state,'HOLD');
 assert.equal(reviewQl476WorkerRuns({first,recovery:{...recovery,run:first.run},
   expectedMainSha:sha,nowMs:now}).state,'HOLD');
 assert.equal(reviewQl476WorkerRuns({first,recovery:{...recovery,
   run:{...recovery.run,osBootId:'55555555-5555-4555-8555-555555555555'}},
   expectedMainSha:sha,nowMs:now}).state,'HOLD');
});
const keys=Object.fromEntries(['owner','witness'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pin=k=>keys[k].publicKey.export({format:'der',type:'spki'}).toString('base64');
const packet=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),keys[k].privateKey).toString('base64')});
const o={schema:QL476_OWNER,host,mainSha:sha,reviewDigest:reviewed.reviewDigest,
 issuedAtMs:now-3000,expiresAtMs:now+120000,
 scope:'ORIGINAL_HOST_SUPERVISED_TASK_REVIEW_ONLY',
 explicitLocalInstallObserved:true,firstRunObserved:true,recoveryRunObserved:true,
 receiverEnableAuthorized:false,automaticStartAuthorized:false,
 rebootAuthorized:false,authorityTransfer:false};
const w={schema:QL476_WITNESS,host,mainSha:sha,reviewDigest:reviewed.reviewDigest,
 observedAtMs:now-1000,independentReviewer:true,originalHostObserved:true,
 taskOnDemandVerified:true,firstRunReceiptObserved:true,
 recoveryReceiptObserved:true,sourcePreserved:true,authorityTransfer:false};
const witness=(a=o,b=w,p1='owner',p2='witness')=>reviewQl476IndependentAcceptance({
 runs:reviewed,ownerPacket:packet(a,'owner'),witnessPacket:packet(b,'witness'),
 ownerPin:pin(p1),witnessPin:pin(p2),nowMs:now});
test('signed out-of-band claims cannot automatically activate or prove physical acceptance',()=>{
 assert.equal(witness().state,'SIGNED_LOCAL_WORKER_REVIEW_HELD');
 assert.equal(witness().physicalRecoveryAccepted,false);
 assert.equal(witness(o,w,'owner','owner').state,'HOLD');
 for(const bad of [{automaticStartAuthorized:true},{receiverEnableAuthorized:true},
  {rebootAuthorized:true},{scope:'LIVE'}])assert.equal(witness({...o,...bad}).state,'HOLD');
 for(const bad of [{independentReviewer:false},{sourcePreserved:false},
  {originalHostObserved:false}])assert.equal(witness(o,{...w,...bad}).state,'HOLD');
});
test('Windows source is explicitly on-demand, fenced from CI and never deletes old backups',()=>{
 const ps=readFileSync(new URL('./ql476-original-host-worker.ps1',import.meta.url),'utf8');
 assert.match(ps,/HOLD_QL476_ORIGINAL_HOST_REQUIRED/);
 assert.match(ps,/Register-ScheduledTask/);
 assert.match(ps,/Start-ScheduledTask/);
 assert.match(ps,/Get-FileHash/);
 assert.match(ps,/ApproveInstall/);
 assert.match(ps,/ApproveFirstRun/);
 assert.match(ps,/ApproveRecovery/);
 assert.match(ps,/sourceDeletes=0/);
 assert.doesNotMatch(ps,/\b(?:Remove-Item|Restart-Computer|New-Service|Set-Service|Start-Service|Register-Service|Enable-ScheduledTask)\b/i);
 assert.equal(QL476_BOUNDARY.automaticInstall,false);
});
