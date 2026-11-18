import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
 QL468_WORKER_SCHEMA,QL468_ROLLOVER_SCHEMA,QL468_BOOT_SCHEMA,QL468_AUDIT_SCHEMA,
 QL468_DEPLOYMENT_BOUNDARY,reviewQl468WorkerInstall,reviewQl468CertRollover,
 reviewQl468BootClaim,reviewQl468FirstAck
} from './ql468-original-host-readiness.mjs';
import {QL467_SCHEMA,QL467_ACK_SCHEMA} from './ql467-private-event-sink.mjs';
const key=()=>generateKeyPairSync('ed25519');
const keys={owner:key(),witness:key(),host:key(),issuer:key(),ack:key(),auditor:key()};
const pin=k=>k.publicKey.export({type:'spki',format:'der'}).toString('base64');
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const now=Date.now()-100,sha='a'.repeat(40),H='DESKTOP-AE894KC',D=86400000;
const worker={schema:QL468_WORKER_SCHEMA,host:H,serviceName:'Rosevear-CommsHub',
 serviceAccount:'NT SERVICE\\Rosevear-CommsHub',startupMode:'DEMAND_ONLY',
 sourceMainSha:sha,workerImageSha256:'b'.repeat(64),receiverOffEvidenceSha256:'c'.repeat(64),
 obsoleteTaskDisabled:true,networkExposure:'PRIVATE_LOOPBACK_ONLY',
 rollbackPlanSha256:'d'.repeat(64),issuedAtMs:now-1000,expiresAtMs:now+120000,
 authorityTransfer:false,automaticInstall:false};
const signedDual=p=>({owner:signed(p,keys.owner),witness:signed(p,keys.witness)});
const dualArgs={ownerPin:pin(keys.owner),witnessPin:pin(keys.witness),expectedMainSha:sha,nowMs:now};
test('QL468 signed worker plan is STRICT review only and never authorizes SCM installation',()=>{
 const ok=reviewQl468WorkerInstall({...dualArgs,plan:signedDual(worker)});
 assert.equal(ok.state,'SIGNED_INSTALL_PLAN_REVIEW_HELD');
 for(const field of ['workerInstalled','hostRebootAuthorized','receiverActivated'])assert.equal(ok[field],false);
 for(const patch of [{automaticInstall:true},{startupMode:'AUTO'},{obsoleteTaskDisabled:false},
  {receiverOffEvidenceSha256:'invalid'},{host:'OTHER-HOST'},
  {networkExposure:'PUBLIC'},{issuedAtMs:now-3600000},{sourceMainSha:'1'.repeat(40)}]){
  const result=reviewQl468WorkerInstall({...dualArgs,plan:signedDual({...worker,...patch})});
  assert.equal(result.state,'HOLD',JSON.stringify(patch));
 }
 assert.equal(reviewQl468WorkerInstall({...dualArgs,plan:signedDual(worker),witnessPin:pin(keys.owner)}).state,'HOLD');
 assert.equal(reviewQl468WorkerInstall({...dualArgs,plan:{owner:signed(worker,keys.owner),
  witness:signed({...worker,receiverOffEvidenceSha256:'e'.repeat(64)},keys.witness)}}).state,'HOLD');
 assert.equal(reviewQl468WorkerInstall({...dualArgs,plan:{owner:signed(worker,keys.owner),
  witness:signed(worker,keys.owner)}}).state,'HOLD');
});
const rotation={schema:QL468_ROLLOVER_SCHEMA,host:H,sourceMainSha:sha,
 rotationId:'rotation_abcdef12345',currentCertLeafSha256:'a'.repeat(64),
 candidateCertLeafSha256:'b'.repeat(64),currentIssuerKeySha256:'c'.repeat(64),
 candidateIssuerKeySha256:'d'.repeat(64),currentExpiresAtMs:now+4*D,
 candidateNotBeforeMs:now-1000,candidateExpiresAtMs:now+6*D,
 overlapStartMs:now+10000,overlapEndMs:now+7200000,
 proposedCutoverMs:now+3600000,issuedAtMs:now-1000,approvalExpiresAtMs:now+120000,
 automaticCutover:false,receiverActivationRequested:false,authorityTransfer:false};
test('QL468 cert rollover requires overlap, expiry safety, independent signatures; never cuts over',()=>{
 const ok=reviewQl468CertRollover({...dualArgs,plan:signedDual(rotation)});
 assert.equal(ok.state,'SIGNED_CERT_ROLLOVER_REVIEW_HELD');
 assert.equal(ok.certRotated,false);assert.equal(ok.cutoverAuthorized,false);
 for(const patch of [
  {currentCertLeafSha256:rotation.candidateCertLeafSha256},
  {currentIssuerKeySha256:rotation.candidateIssuerKeySha256},
  {candidateNotBeforeMs:now+30000},
  {currentExpiresAtMs:now+7200001},
  {candidateExpiresAtMs:now+7200001},
  {overlapEndMs:now+1800000},
  {overlapEndMs:now+25*3600000},
  {proposedCutoverMs:now+8000000},
  {automaticCutover:true},{receiverActivationRequested:true},{authorityTransfer:true},
  {approvalExpiresAtMs:now-1}
 ])assert.equal(reviewQl468CertRollover({...dualArgs,plan:signedDual({...rotation,...patch})}).state,'HOLD',JSON.stringify(patch));
});
const boot={schema:QL468_BOOT_SCHEMA,host:H,sourceMainSha:sha,
 bootId:'boot_abcdef123456',serviceName:'Rosevear-CommsHub',workerImageSha256:'b'.repeat(64),
 serviceStartMode:'DEMAND_ONLY',receiverState:'OFF',
 obsoleteTaskDisabled:true,observedAtMs:now-1200,authorityTransfer:false};
test('QL468 boot signature alone is a CLAIM, no physical reboot witnessed',()=>{
 const ok=reviewQl468BootClaim({packet:signed(boot,keys.host),hostPin:pin(keys.host),
  expectedMainSha:sha,nowMs:now});
 assert.equal(ok.state,'SIGNED_BOOT_CLAIM_HELD');assert.equal(ok.hostRebootAuthorized,false);
 assert.equal(reviewQl468BootClaim({packet:signed({...boot,receiverState:'ON'},keys.host),
 hostPin:pin(keys.host),expectedMainSha:sha,nowMs:now}).state,'HOLD');
 assert.equal(reviewQl468BootClaim({packet:signed(boot,keys.owner),hostPin:pin(keys.host),
 expectedMainSha:sha,nowMs:now}).state,'HOLD');
});
const event={schema:QL467_SCHEMA,protocolVersion:'1.1',messageId:'message_abcdef123456',
 issuer:'rosevear-ai-hub',audience:'rosevear-comms-hub',tenantId:'tenant_abcdef123456',
 workspaceId:'workspace_abc123456',eventId:'event_abcdef123456',
 eventType:'incident.read-only',payloadSha256:'c'.repeat(64),dataClass:'NONPERSONAL',
 issuedAtMs:now-3000,expiresAtMs:now+60000,authorityTransfer:false};
const envelope=signed(event,keys.issuer);
const ack=signed({schema:QL467_ACK_SCHEMA,messageId:event.messageId,eventId:event.eventId,
 tenantId:event.tenantId,workspaceId:event.workspaceId,issuer:'rosevear-comms-hub',
 audience:'rosevear-ai-hub',sourceDigest:hash(envelope),receivedAtMs:now-2000,
 disposition:'RECEIVED',authorityTransfer:false},keys.ack);
const audit={schema:QL468_AUDIT_SCHEMA,host:H,sourceMainSha:sha,
 auditId:'audit_abcdef12345',bootId:boot.bootId,messageId:event.messageId,
 eventId:event.eventId,ackSha256:hash(ack),envelopeSha256:hash(envelope),
 tlsClientLeafSha256:'f'.repeat(64),observedAtMs:now-1000,
 originalHostObserved:true,receiverOffObserved:true,
 auditorRole:'INDEPENDENT_ORIGINAL_HOST_REVIEWER',authorityTransfer:false};
const ackArgs={envelope,ack,audit:signed(audit,keys.auditor),
 issuerPin:pin(keys.issuer),ackPin:pin(keys.ack),auditorPin:pin(keys.auditor),
 tlsClientLeafSha256:audit.tlsClientLeafSha256,expectedMainSha:sha,
 expectedBootId:boot.bootId,nowMs:now};
test('QL468 original signed event, exact durable ACK and independent audit correlation is review, not live proof',()=>{
 const ok=reviewQl468FirstAck(ackArgs);
 assert.equal(ok.state,'SIGNED_FIRST_ACK_REVIEW_HELD');
 assert.equal(ok.liveMtlsVerified,false);assert.equal(ok.liveAckVerified,false);
 assert.equal(ok.firstAckAccepted,false);assert.equal(ok.sourceWrites,0);
 for(const patch of [
  {eventId:'event_wrong123456'},{bootId:'boot_wrong123456'},
  {tlsClientLeafSha256:'e'.repeat(64)},{ackSha256:'d'.repeat(64)},
  {sourceMainSha:'e'.repeat(40)},{originalHostObserved:false},
  {receiverOffObserved:false},{auditorRole:'SELF_REVIEW'},
  {authorityTransfer:true},{observedAtMs:now-3600000}
 ]){
  const bad=reviewQl468FirstAck({...ackArgs,audit:signed({...audit,...patch},keys.auditor)});
  assert.equal(bad.state,'HOLD',JSON.stringify(patch));
 }
 assert.equal(reviewQl468FirstAck({...ackArgs,ack:signed({...ack.payload,disposition:'DELIVERED'},keys.ack)}).state,'HOLD');
 assert.equal(reviewQl468FirstAck({...ackArgs,issuerPin:pin(keys.owner)}).state,'HOLD');
 assert.equal(reviewQl468FirstAck({...ackArgs,auditorPin:pin(keys.ack)}).state,'HOLD');
 assert.equal(reviewQl468FirstAck({...ackArgs,envelope:signed({...event,dataClass:'PERSONAL'},keys.issuer)}).state,'HOLD');
 assert.equal(reviewQl468FirstAck({...ackArgs,envelope:signed({...event,customerPhone:'fake'},keys.issuer)}).state,'HOLD');
});
test('QL468 original Windows inventory remains inspect-only with no automatic activation controls',()=>{
 const source=readFileSync(new URL('./ql468-original-host-readonly.ps1',import.meta.url),'utf8');
 assert.match(source,/HOLD_QL468_ORIGINAL_WINDOWS_HOST_REQUIRED/);
 assert.match(source,/Get-CimInstance Win32_Service/);
 assert.match(source,/Get-ScheduledTask/);
 assert.match(source,/Get-NetTCPConnection/);
 assert.match(source,/independentBootWitnessVerified = \$false/);
 assert.doesNotMatch(source,/\b(?:New-Service|Set-Service|Start-Service|Stop-Service|Restart-Computer|Register-ScheduledTask|Set-ScheduledTask|tailscale serve)\b/i);
 assert.equal(QL468_DEPLOYMENT_BOUNDARY.httpListener,'NOT_STARTED');
 assert.equal(QL468_DEPLOYMENT_BOUNDARY.automaticInstall,false);
 assert.equal(QL468_DEPLOYMENT_BOUNDARY.firstAck,'NOT_INDEPENDENTLY_ACCEPTED');
});
