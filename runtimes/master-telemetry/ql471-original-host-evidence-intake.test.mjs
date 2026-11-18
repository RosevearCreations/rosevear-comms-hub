import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 QL471_OWNER,QL471_WITNESS,QL471_BOUNDARY,intakeQl471Snapshots,
 reviewQl471SignedIntake,reviewQl471PilotReadiness
} from './ql471-original-host-evidence-intake.mjs';

const sha='a'.repeat(40),now=Date.now(),host='DESKTOP-AE894KC';
const start=new Date(now-30000).toISOString(),end=new Date(now-10000).toISOString();
const a={schema:'rosevear.comms.ql468.original-host-readonly-inventory.v1',host,
 observedAtUtc:start,serviceName:'Rosevear-CommsHub',workerPresent:false,
 workerStartMode:'NOT_INSTALLED',workerState:'NOT_INSTALLED',
 workerServiceAccountMatchesPlan:false,receiverPort8788ListenerCount:0,
 legacyTaskPresent:true,legacyTaskDisabled:true,privateReceiverOffVerified:false,
 independentBootWitnessVerified:false,firstAckIndependentlyVerified:false,
 actionExecuted:false,rebootAuthorized:false,
 state:'HOLD_INDEPENDENT_SIGNED_FIELD_REVIEW_REQUIRED'};
const b={schema:'rosevear.comms.ql470.original-host-inventory.v1',host,
 observedAtUtc:end,serviceName:'Rosevear-CommsHub',workerPresent:false,
 workerState:'NOT_INSTALLED',workerStartMode:'NOT_INSTALLED',
 workerServiceAccountMatchesPlan:false,workerBinaryReadable:false,
 workerBinarySha256:null,receiverPort8788ListenerCount:0,
 legacyTaskDisabled:true,receiverOffIndependentlyVerified:false,
 independentPeerAccepted:false,actionExecuted:false,rebootAuthorized:false,
 state:'HOLD_INDEPENDENT_ORIGINAL_HOST_WITNESS_REQUIRED'};
const v=(a0=a,b0=b,clock=now)=>intakeQl471Snapshots({ql468:JSON.stringify(a0),ql470:JSON.stringify(b0),nowMs:clock,expectedMainSha:sha});
const h=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const pair=()=>generateKeyPairSync('ed25519');
const ownerKey=pair(),witnessKey=pair();
const pin=k=>k.publicKey.export({format:'der',type:'spki'}).toString('base64');
const packet=(payload,key)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),key.privateKey).toString('base64')});
const intake=v();
const owner={schema:QL471_OWNER,host,sourceMainSha:sha,snapshotSha256:intake.snapshotSha256,
 issuedAtMs:now-5000,expiresAtMs:now+120000,scope:'READ_ONLY_EVIDENCE_REVIEW',
 pilotRequested:false,ownerApproved:true,autoInstall:false,autoSend:false,
 autoRestart:false,receiverActivationRequested:false,authorityTransfer:false};
const witness={schema:QL471_WITNESS,host,sourceMainSha:sha,snapshotSha256:intake.snapshotSha256,
 observedAtMs:now-4000,reviewerRole:'INDEPENDENT_ORIGINAL_HOST_OBSERVER',
 independentReviewer:true,hostReachabilityVerified:true,workerSeenInstalled:false,
 receiverOffObserved:true,authorityTransfer:false};
const review=(o=owner,w=witness)=>reviewQl471SignedIntake({intake,ownerPacket:packet(o,ownerKey),
 witnessPacket:packet(w,witnessKey),ownerPin:pin(ownerKey),witnessPin:pin(witnessKey),
 expectedMainSha:sha,nowMs:now});
test('QL471 takes exact host evidence, reports missing service and does not invent live acceptance',()=>{
 assert.equal(intake.state,'MISSING_WORKER_REVIEW_HELD');
 assert.equal(intake.workerMissing,true);
 assert.equal(intake.receiverPort8788ListenerCount,0);
 assert.equal(intake.workerInstalledVerified,false);
 assert.equal(intake.singlePeerPilotAuthorized,false);
 for(const bad of [{workerPresent:true},{legacyTaskDisabled:false},
  {privateReceiverOffVerified:true},{receiverPort8788ListenerCount:1},
  {host:'ANOTHER-PC'},{actionExecuted:true},{unexpected:'secret'}])
  assert.equal(v({...a,...bad}).state,'HOLD');
 for(const bad of [{workerPresent:true},{workerBinaryReadable:true},
  {receiverPort8788ListenerCount:1},{independentPeerAccepted:true},
  {workerBinarySha256:'f'.repeat(64)},{observedAtUtc:'not-a-date'},
  {commandLine:'private token'},{legacyTaskDisabled:false}])
  assert.equal(v(a,{...b,...bad}).state,'HOLD');
 assert.equal(intakeQl471Snapshots({ql468:'not json',ql470:b,expectedMainSha:sha,nowMs:now}).state,'HOLD');
 assert.equal(v(a,b,now+3600000).state,'HISTORICAL_SNAPSHOT_REVIEW_HELD');
});
test('QL471 signers validate hash and reviewer separation, but missing worker stays HELD',()=>{
 const ok=review();
 assert.equal(ok.state,'SIGNED_MISSING_WORKER_REVIEW_HELD');
 assert.equal(ok.singlePeerPilotAuthorized,false);
 assert.equal(ok.workerInstalledVerified,false);
 for(const bad of [{autoSend:true},{autoInstall:true},{autoRestart:true},
  {receiverActivationRequested:true},{scope:'AUTO_SEND'},
  {snapshotSha256:'b'.repeat(64)},{ownerApproved:false},{pilotRequested:true},
  {issuedAtMs:now-400000}])
  assert.equal(review({...owner,...bad}).state,'HOLD');
 for(const bad of [{independentReviewer:false},{hostReachabilityVerified:false},
  {receiverOffObserved:false},{workerSeenInstalled:true},
  {snapshotSha256:'c'.repeat(64)}])
  assert.equal(review(owner,{...witness,...bad}).state,'HOLD');
 assert.equal(reviewQl471SignedIntake({intake,ownerPacket:packet(owner,ownerKey),
 witnessPacket:packet(witness,witnessKey),ownerPin:pin(ownerKey),
 witnessPin:pin(ownerKey),expectedMainSha:sha,nowMs:now}).state,'HOLD');
 assert.equal(reviewQl471SignedIntake({intake:v(a,b,now+3600000),
 ownerPacket:packet(owner,ownerKey),witnessPacket:packet(witness,witnessKey),
 ownerPin:pin(ownerKey),witnessPin:pin(witnessKey),
 expectedMainSha:sha,nowMs:now+3600000}).state,'HOLD');
});
test('QL471 owner pilot intent cannot authorize absent worker, even with signed claims',()=>{
 const pilot={...owner,scope:'ONE_NONPERSONAL_PEER_PILOT_READINESS_REVIEW',pilotRequested:true};
 const result=reviewQl471PilotReadiness({intake,ownerPacket:packet(pilot,ownerKey),
 witnessPacket:packet(witness,witnessKey),ownerPin:pin(ownerKey),
 witnessPin:pin(witnessKey),expectedMainSha:sha,nowMs:now});
 assert.equal(result.state,'HOLD');
 assert.equal(result.singlePeerPilotAuthorized,false);
 assert.equal(result.peerSends,0);
 assert.equal(QL471_BOUNDARY.userReportedWorker,'NOT_INSTALLED');
});
test('QL471 Windows census is inspection-only, marks ALL directories deletion-unapproved',()=>{
 const src=readFileSync(new URL('./ql471-original-host-checkout-census.ps1',import.meta.url),'utf8');
 assert.match(src,/HOLD_QL471_ORIGINAL_WINDOWS_HOST_REQUIRED/);
 assert.match(src,/Get-CimInstance Win32_Service/);
 assert.match(src,/Get-ScheduledTask/);
 assert.match(src,/Get-CimInstance Win32_Process/);
 assert.match(src,/localChangesOrUntracked = \$dirty/);
 assert.match(src,/safeToDeleteAutomatically = \$false/);
 assert.doesNotMatch(src,/\b(?:Remove-Item|git pull|git fetch|git checkout|New-Service|Set-Service|Stop-Service|Start-Service|Restart-Computer|Register-ScheduledTask|Invoke-RestMethod|Invoke-WebRequest)\b/i);
 assert.equal(QL471_BOUNDARY.autoInstall,false);
});
