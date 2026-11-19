import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {QL477_FIELD,QL477_TELEMETRY,QL477_OWNER,QL477_OBSERVER,
 QL477_SIGNED_SAMPLE,QL477_SIGNED_ACK,QL477_BOUNDARY,
 reviewQl477FieldBundle,reviewQl477IndependentWitness,reviewQl477FirstTelemetry
} from './ql477-field-telemetry.mjs';
const now=Date.now(),main='a'.repeat(40),worker='b'.repeat(64),host='DESKTOP-AE894KC';
const run=(id,time)=>({schema:'rosevear.comms.ql476.local-run.v1',
 host,mainSha:main,workerScriptHash:worker,runId:id,
 osBootId:'11111111-1111-4111-8111-111111111111',observedAtMs:time,
 uptimeSeconds:1029,processCount:75,receiverPort8788Listeners:0,peerSent:false});
const first=run('22222222-2222-4222-8222-222222222222',now-20000);
const recovery=run('33333333-3333-4333-8333-333333333333',now-12000);
const install={schema:'rosevear.comms.ql477.install-snapshot.v1',host,mainSha:main,
 exportId:'44444444-4444-4444-8444-444444444444',taskName:'Rosevear-CommsHub-Worker',
 onDemandOnly:true,interactiveOwnerOnly:true,workerScriptSha256:worker,
 receiverPort8788Listeners:0,legacyTaskDisabled:true,serviceAutostartEnabled:false,
 taskLastResult:0,sourceClean:true,sourceDeletions:0,receiverActivated:false,
 peerSent:false,rebootPerformed:false};
const telemetry={schema:QL477_TELEMETRY,host,sourceApp:'rosevear-comms-hub',
 sourceMainSha:main,workerScriptSha256:worker,sampleId:recovery.runId,
 osBootId:recovery.osBootId,observedAtMs:recovery.observedAtMs,
 uptimeSeconds:recovery.uptimeSeconds,processCount:recovery.processCount,
 dataClass:'NON_SENSITIVE_AGGREGATE',customerDataIncluded:false,
 authorizesAction:false,receiverActivated:false,peerSent:false};
const report={schema:QL477_FIELD,host,mainSha:main,exportId:install.exportId,
 observedAtMs:now-2000,install,first,recovery,
 firstFileSha256:'c'.repeat(64),recoveryFileSha256:'d'.repeat(64),telemetry,
 offlineBackupReviewed:false,independentlyWitnessed:false,sourceDeletions:0};
const verify=x=>reviewQl477FieldBundle({report:x,expectedMainSha:main,nowMs:now});
const field=verify(report);
test('local evidence contains 2 distinct safe first/recovery receipts and redacted telemetry',()=>{
 assert.equal(field.state,'FIELD_EXPORT_REVIEW_HELD');
 assert.equal(field.runCount,2);
 assert.equal(field.installedOnOriginalHostCertified,false);
 for(const bad of [{sourceDeletions:1},{offlineBackupReviewed:true},
 {first:recovery},{firstFileSha256:'z'.repeat(64)},
 {telemetry:{...telemetry,customerDataIncluded:true}},
 {telemetry:{...telemetry,processCount:1}},
 {install:{...install,onDemandOnly:false}},
 {install:{...install,receiverPort8788Listeners:1}},
 {recovery:{...recovery,osBootId:'99999999-9999-4999-8999-999999999999'}}])
 assert.equal(verify({...report,...bad}).state,'HOLD');
});
const keys=Object.fromEntries(['owner','witness','host','receiver'].map(k=>[k,generateKeyPairSync('ed25519')]));
const pin=k=>keys[k].publicKey.export({format:'der',type:'spki'}).toString('base64');
const pkt=(x,k)=>({payload:x,signature:sign(null,Buffer.from(JSON.stringify(x)),keys[k].privateKey).toString('base64')});
const owner={schema:QL477_OWNER,host,mainSha:main,fieldDigest:field.fieldDigest,
 issuedAtMs:now-2000,expiresAtMs:now+100000,scope:'SUPERVISED_INSTALL_AND_LOCAL_RECOVERY_REVIEW_ONLY',
 offlineBackupPersonallyVerified:true,installPersonallyWitnessed:true,
 recoveryPersonallyWitnessed:true,automaticStart:false,receiverEnable:false,
 rebootAuthorization:false,authorityTransfer:false};
const witness={schema:QL477_OBSERVER,host,mainSha:main,fieldDigest:field.fieldDigest,
 observedAtMs:now-1000,independentObserver:true,originalHostSeen:true,
 taskActionVerified:true,offlineRestoreSeen:true,firstReceiptSeen:true,
 recoveryReceiptSeen:true,sourceIntact:true,authorityTransfer:false};
const observe=(o=owner,w=witness,op='owner',wp='witness')=>reviewQl477IndependentWitness({
 field,ownerPacket:pkt(o,'owner'),witnessPacket:pkt(w,'witness'),
 ownerPin:pin(op),witnessPin:pin(wp),nowMs:now});
test('owner/witness signatures are independently pinned and remain source REVIEW HELD',()=>{
 assert.equal(observe().state,'SIGNED_ORIGINAL_HOST_CLAIMS_REVIEW_HELD');
 assert.equal(observe().independentPhysicalRecoveryCertified,false);
 assert.equal(observe(owner,witness,'owner','owner').state,'HOLD');
 for(const bad of [{automaticStart:true},{receiverEnable:true},{rebootAuthorization:true},
 {offlineBackupPersonallyVerified:false},{fieldDigest:'e'.repeat(64)}])
 assert.equal(observe({...owner,...bad}).state,'HOLD');
 assert.equal(observe(owner,{...witness,independentObserver:false}).state,'HOLD');
});
const envelope={schema:QL477_SIGNED_SAMPLE,issuer:'rosevear-comms-hub',
 audience:'rosevear-comms-hub',messageId:'55555555-5555-4555-8555-555555555555',
 sampleDigest:field.sampleDigest,issuedAtMs:now-3000,expiresAtMs:now+60000,
 dataClass:'NON_SENSITIVE_AGGREGATE',authorityTransfer:false};
const ack={schema:QL477_SIGNED_ACK,issuer:'rosevear-comms-hub',
 audience:'rosevear-comms-hub',sourceApp:'rosevear-comms-hub',
 messageId:envelope.messageId,sampleDigest:field.sampleDigest,
 receivedAtMs:now-1500,disposition:'RECEIVED_READ_ONLY',persistentReadBack:true,
 authorityTransfer:false};
const receive=(e=envelope,a=ack,prior=[])=>reviewQl477FirstTelemetry({
 field,envelope:pkt(e,'host'),ack:pkt(a,'receiver'),
 hostPin:pin('host'),receiverPin:pin('receiver'),priorMessageIds:prior,nowMs:now});
test('distinct cryptographic source and ACK, bounded TTL, replay and read-only only',()=>{
 assert.equal(receive().state,'SIGNED_FIRST_TELEMETRY_REVIEW_HELD');
 assert.equal(receive().firstTelemetryAccepted,false);
 assert.equal(receive(envelope,ack,[envelope.messageId]).state,'HOLD');
 assert.equal(receive({...envelope,expiresAtMs:now-1}).state,'HOLD');
 assert.equal(receive({...envelope,dataClass:'CUSTOMER'}).state,'HOLD');
 assert.equal(receive(envelope,{...ack,persistentReadBack:false}).state,'HOLD');
 assert.equal(receive(envelope,{...ack,sampleDigest:'f'.repeat(64)}).state,'HOLD');
});
test('QL477 Windows export fences original host, cannot create tasks or send telemetry',()=>{
 const script=readFileSync(new URL('./ql477-original-host-evidence.ps1',import.meta.url),'utf8');
 assert.match(script,/HOLD_QL477_ORIGINAL_HOST_REQUIRED/);
 assert.match(script,/ApproveLocalExport/);
 assert.match(script,/Get-FileHash/);
 assert.match(script,/Get-ScheduledTask/);
 assert.match(script,/NON_SENSITIVE_AGGREGATE/);
 assert.doesNotMatch(script,/\b(?:Register-ScheduledTask|Start-ScheduledTask|Remove-Item|Restart-Computer|New-Service|Invoke-WebRequest|Invoke-RestMethod|Start-Process|Set-ScheduledTask)\b/i);
 assert.equal(QL477_BOUNDARY.automaticTransmission,false);
});
