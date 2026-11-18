import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 QL470_INVENTORY_SCHEMA,QL470_HOST_SCHEMA,QL470_WITNESS_SCHEMA,
 QL470_OWNER_SCHEMA,QL470_PEER_WITNESS_SCHEMA,QL470_BOUNDARY,
 reviewQl470WorkerIdentity,reviewQl470SupervisedFirstPeer
} from './ql470-original-host-field-assurance.mjs';
import {QL469_ENROLL,QL469_OWNER,QL469_WITNESS,QL469_PEER} from './ql469-independent-original-host-acceptance.mjs';
import {QL467_SCHEMA,QL467_ACK_SCHEMA} from './ql467-private-event-sink.mjs';
import {QL468_AUDIT_SCHEMA} from './ql468-original-host-readiness.mjs';
const k=()=>generateKeyPairSync('ed25519');
const keys=Object.fromEntries(['h','w','eh','eo','ew','issuer','ack','auditor','peer','owner','reviewer'].map(x=>[x,k()]));
const pin=k=>k.publicKey.export({format:'der',type:'spki'}).toString('base64');
const signed=(p,k)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),k.privateKey).toString('base64')});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const H='DESKTOP-AE894KC',S='Rosevear-CommsHub',sha='a'.repeat(40),now=Date.now();
const inventory={schema:QL470_INVENTORY_SCHEMA,host:H,observedAtUtc:new Date(now-9000).toISOString(),
 serviceName:S,workerPresent:true,workerState:'Running',workerStartMode:'Manual',
 workerServiceAccountMatchesPlan:true,workerBinaryReadable:true,
 workerBinarySha256:'b'.repeat(64),receiverPort8788ListenerCount:0,
 legacyTaskDisabled:true,receiverOffIndependentlyVerified:false,
 independentPeerAccepted:false,actionExecuted:false,rebootAuthorized:false,
 state:'HOLD_INDEPENDENT_ORIGINAL_HOST_WITNESS_REQUIRED'};
const h={schema:QL470_HOST_SCHEMA,host:H,sourceMainSha:sha,observationId:'observation_abcdef12345',
 bootId:'boot_abcdef123456',inventorySha256:hash(inventory),imageSha256:'b'.repeat(64),
 observedAtMs:now-8500,receiverState:'OFF',authorityTransfer:false};
const w={schema:QL470_WITNESS_SCHEMA,host:H,observationId:h.observationId,sourceMainSha:sha,
 inventorySha256:hash(inventory),hostClaimSha256:hash(h),workerImageSha256:h.imageSha256,
 observedAtMs:now-7000,independentReviewer:true,receiverOffObserved:true,authorityTransfer:false};
const workerArgs=(i=inventory,host=h,witness=w)=>({inventory:i,hostPacket:signed(host,keys.h),
 witnessPacket:signed(witness,keys.w),hostPin:pin(keys.h),witnessPin:pin(keys.w),expectedMainSha:sha,nowMs:now});
test('QL470 original-host read-only inventory is signed correlation only, never physical enrollment',()=>{
 const ok=reviewQl470WorkerIdentity(workerArgs());
 assert.equal(ok.state,'SIGNED_WORKER_IDENTITY_REVIEW_HELD');
 assert.equal(ok.workerPhysicallyVerified,false);assert.equal(ok.receiverActivated,false);
 for(const bad of [{workerPresent:false},{workerState:'Stopped'},{workerStartMode:'Auto'},
  {workerBinaryReadable:false},{workerBinarySha256:'e'.repeat(64)},
  {receiverPort8788ListenerCount:1},{legacyTaskDisabled:false}])
  assert.equal(reviewQl470WorkerIdentity(workerArgs({...inventory,...bad})).state,'HOLD');
 for(const bad of [{host:'ANOTHER-PC'},{imageSha256:'f'.repeat(64)},
  {observedAtMs:now-3600000},{receiverState:'ON'}])
  assert.equal(reviewQl470WorkerIdentity(workerArgs(inventory,{...h,...bad})).state,'HOLD');
 assert.equal(reviewQl470WorkerIdentity(workerArgs(inventory,h,{...w,independentReviewer:false})).state,'HOLD');
 assert.equal(reviewQl470WorkerIdentity({...workerArgs(),witnessPin:pin(keys.h)}).state,'HOLD');
 assert.equal(reviewQl470WorkerIdentity({...workerArgs(),inventory:null}).state,'HOLD');
 assert.equal(reviewQl470WorkerIdentity({...workerArgs(),hostPacket:signed(h,keys.owner)}).state,'HOLD');
});
const i469={schema:'rosevear.comms.ql468.original-host-readonly-inventory.v1',host:H,
 serviceName:S,workerPresent:true,workerState:'Running',workerStartMode:'Manual',
 workerServiceAccountMatchesPlan:true,receiverPort8788ListenerCount:0,
 legacyTaskDisabled:true,actionExecuted:false,rebootAuthorized:false};
const h469={schema:QL469_ENROLL,host:H,sourceMainSha:sha,enrollmentId:'enrollment_abcdef123',
 bootId:h.bootId,inventorySha256:hash(i469),imageSha256:'b'.repeat(64),
 observedAtMs:now-9000,receiverState:'OFF',authorityTransfer:false};
const o469={schema:QL469_OWNER,host:H,sourceMainSha:sha,enrollmentId:h469.enrollmentId,
 hostDigest:hash(h469),issuedAtMs:now-8000,expiresAtMs:now+120000,
 automaticInstall:false,autoStart:false,receiverActivationRequested:false,authorityTransfer:false};
const w469={schema:QL469_WITNESS,host:H,enrollmentId:h469.enrollmentId,
 hostDigest:hash(h469),inventorySha256:hash(i469),observedAtMs:now-7000,
 reviewerRole:'INDEPENDENT_ORIGINAL_HOST_REVIEWER',receiverOffObserved:true,authorityTransfer:false};
const enrollArgs={inventory:i469,hostPacket:signed(h469,keys.eh),
 ownerPacket:signed(o469,keys.eo),witnessPacket:signed(w469,keys.ew),
 hostPin:pin(keys.eh),ownerPin:pin(keys.eo),witnessPin:pin(keys.ew)};
const event={schema:QL467_SCHEMA,protocolVersion:'1.1',messageId:'message_abcdef123456',
 issuer:'rosevear-ai-hub',audience:'rosevear-comms-hub',tenantId:'tenant_abcdef123456',
 workspaceId:'workspace_abcdef123456',eventId:'event_abcdef123456',
 eventType:'status.read-only',payloadSha256:'e'.repeat(64),dataClass:'NONPERSONAL',
 issuedAtMs:now-6000,expiresAtMs:now+60000,authorityTransfer:false};
const envelope=signed(event,keys.issuer);
const ack=signed({schema:QL467_ACK_SCHEMA,messageId:event.messageId,eventId:event.eventId,
 tenantId:event.tenantId,workspaceId:event.workspaceId,
 issuer:'rosevear-comms-hub',audience:'rosevear-ai-hub',
 sourceDigest:hash(envelope),receivedAtMs:now-5000,
 disposition:'RECEIVED',authorityTransfer:false},keys.ack);
const audit=signed({schema:QL468_AUDIT_SCHEMA,host:H,sourceMainSha:sha,auditId:'audit_abcdef12345',
 bootId:h.bootId,messageId:event.messageId,eventId:event.eventId,
 ackSha256:hash(ack),envelopeSha256:hash(envelope),
 tlsClientLeafSha256:'f'.repeat(64),observedAtMs:now-4000,
 originalHostObserved:true,receiverOffObserved:true,
 auditorRole:'INDEPENDENT_ORIGINAL_HOST_REVIEWER',authorityTransfer:false},keys.auditor);
const peerPacket=signed({schema:QL469_PEER,host:H,sourceMainSha:sha,bootId:h.bootId,
 messageId:event.messageId,ackSha256:hash(ack),auditSha256:hash(audit),
 tlsClientLeafSha256:'f'.repeat(64),observedAtMs:now-3000,clientAuthenticated:true,
 durableReplayConfirmed:true,reviewerRole:'INDEPENDENT_PEER_REVIEWER',authorityTransfer:false},keys.peer);
const peerArgs={envelope,ack,audit,peerPacket,issuerPin:pin(keys.issuer),ackPin:pin(keys.ack),
 auditorPin:pin(keys.auditor),peerPin:pin(keys.peer),tlsClientLeafSha256:'f'.repeat(64)};
const owner={schema:QL470_OWNER_SCHEMA,host:H,sourceMainSha:sha,observationId:h.observationId,
 bootId:h.bootId,messageId:event.messageId,ackSha256:hash(ack),issuedAtMs:now-2000,
 expiresAtMs:now+120000,approvedScope:'ONE_READ_ONLY_PEER_RECEIPT_REVIEW',
 automaticSend:false,automaticInstall:false,receiverActivationRequested:false,
 serviceRestartRequested:false,authorityTransfer:false};
const reviewer={schema:QL470_PEER_WITNESS_SCHEMA,host:H,sourceMainSha:sha,
 observationId:h.observationId,bootId:h.bootId,messageId:event.messageId,
 ackSha256:hash(ack),ownerDecisionSha256:hash(owner),
 tlsClientLeafSha256:'f'.repeat(64),observedAtMs:now-1000,
 independentReviewer:true,clientCertificateObserved:true,
 receiptStorageObserved:true,receiverOffObserved:true,authorityTransfer:false};
const args=(o=owner,w=reviewer)=>({workerArgs:workerArgs(),enrollmentArgs:enrollArgs,peerArgs,
 ownerPacket:signed(o,keys.owner),independentPacket:signed(w,keys.reviewer),
 ownerPin:pin(keys.owner),witnessPin:pin(keys.reviewer),expectedMainSha:sha,nowMs:now});
test('QL470 re-verifies underlying QL469 peer ACK and independent live-claim signatures; still HELD',()=>{
 const ok=reviewQl470SupervisedFirstPeer(args());
 assert.equal(ok.state,'SIGNED_FIRST_PEER_REVIEW_HELD');
 assert.equal(ok.livePeerVerified,false);assert.equal(ok.supervisedPeerAccepted,false);
 for(const bad of [{ackSha256:'c'.repeat(64)},{automaticSend:true},
  {approvedScope:'AUTO_SEND'},{receiverActivationRequested:true},{serviceRestartRequested:true},
  {issuedAtMs:now-900000}])
  assert.equal(reviewQl470SupervisedFirstPeer(args({...owner,...bad})).state,'HOLD');
 for(const bad of [{independentReviewer:false},{clientCertificateObserved:false},
  {receiptStorageObserved:false},{receiverOffObserved:false},{tlsClientLeafSha256:'d'.repeat(64)}])
  assert.equal(reviewQl470SupervisedFirstPeer(args(owner,{...reviewer,...bad})).state,'HOLD');
 assert.equal(reviewQl470SupervisedFirstPeer({...args(),witnessPin:pin(keys.owner)}).state,'HOLD');
 assert.equal(reviewQl470SupervisedFirstPeer({...args(),peerArgs:{...peerArgs,ack:signed({...ack.payload,disposition:'DELIVERED'},keys.ack)}}).state,'HOLD');
 assert.equal(reviewQl470SupervisedFirstPeer({...args(),workerArgs:{...workerArgs(),inventory:{...inventory,workerPresent:false}}}).state,'HOLD');
 assert.equal(QL470_BOUNDARY.automaticSend,false);
});
test('QL470 Windows script is inspect-only and cannot run on CI or manipulate local services',()=>{
 const src=readFileSync(new URL('./ql470-original-host-evidence-readonly.ps1',import.meta.url),'utf8');
 assert.match(src,/HOLD_QL470_ORIGINAL_WINDOWS_HOST_REQUIRED/);
 assert.match(src,/Get-CimInstance Win32_Service/);
 assert.match(src,/Get-ScheduledTask/);
 assert.match(src,/Get-NetTCPConnection/);
 assert.match(src,/Get-FileHash/);
 assert.match(src,/independentPeerAccepted = \$false/);
 assert.doesNotMatch(src,/\b(?:New-Service|Set-Service|Start-Service|Stop-Service|Restart-Computer|Register-ScheduledTask|Set-ScheduledTask|tailscale serve|Invoke-WebRequest|Invoke-RestMethod)\b/i);
 assert.equal(QL470_BOUNDARY.livePeer,'NOT_OBSERVED');
});
