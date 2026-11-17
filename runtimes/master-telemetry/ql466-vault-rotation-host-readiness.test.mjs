import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {QL466_SCHEMA,QL466_SOURCE_STATUS,QL466_PEER_SINK,
 inspectQl466VaultAttestation,reviewQl466DualIssuerRotation,
 reviewQl466SignedWorkerInventory,assessQl466GoNoGo} from './ql466-vault-rotation-host-readiness.mjs';
const key=()=>generateKeyPairSync('ed25519');
const pin=k=>k.publicKey.export({type:'spki',format:'der'}).toString('base64');
const signed=(payload,k)=>({payload,signature:sign(null,Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const now=Date.now()-1000,iso=x=>new Date(x).toISOString();
const sourceSha='b'.repeat(40),H='a'.repeat(64);
const provider=key(),owner=key(),custodian=key(),host=key(),auditor=key();
const inventory={schema:'rosevear.comms.ql466.vault-inventory.v1',
 scopeId:'rosevear-comms-hub',purpose:'PRIVACY_ENCRYPT',provider:'SUPABASE_VAULT',
 opaqueRef:'vault:12345678-1234-1234-1234-123456789abc',keyVersion:1,
 state:'ENROLLED_PROVIDER_READ_ONLY',providerReceiptDigest:H,sourceCustodyDigest:H,
 issuedAt:iso(now-1000),notBefore:iso(now-60000),expiresAt:iso(now+86400000),
 rootKeyAccessible:false,clientExposed:false,authorityTransfer:false};
const plan={schema:'rosevear.comms.ql466.key-rotation-plan.v1',
 planId:'plan_abcdefgh12345',scopeId:inventory.scopeId,purpose:inventory.purpose,
 provider:inventory.provider,currentOpaqueRef:inventory.opaqueRef,
 candidateOpaqueRef:'vault:12345678-1234-1234-1234-123456789abd',
 currentVersion:1,candidateVersion:2,sourceMainSha:sourceSha,
 priorCertLeafDigest:'c'.repeat(64),candidateCertLeafDigest:'d'.repeat(64),
 overlapMinutes:60,candidateNotBefore:iso(now-3000),
 candidateExpiresAt:iso(now+2*86400000),
 requestedAt:iso(now-5000),approvalExpiresAt:iso(now+150000),
 automaticActivation:false,authorityTransfer:false,receiverActivationRequested:false};
const validInventory=()=>inspectQl466VaultAttestation({packet:signed(inventory,provider),providerPin:pin(provider),nowMs:now});
const validPlan=()=>reviewQl466DualIssuerRotation({inventory:validInventory(),
 plan:{owner:signed(plan,owner),custodian:signed(plan,custodian)},
 ownerPin:pin(owner),custodianPin:pin(custodian),nowMs:now,expectedMainSha:sourceSha});
const boot={schema:'rosevear.comms.ql466.host-worker-observation.v1',
 originalHost:'DESKTOP-AE894KC',serviceName:'Rosevear-CommsHub',
 serviceImageDigest:'e'.repeat(64),startMode:'AUTOMATIC',serviceState:'RUNNING',
 bootId:'boot_abcdefgh123456',observedAt:iso(now-1000),sourceMainSha:sourceSha,
 obsoleteTaskDisabled:true,privateReceiverState:'UNKNOWN_OR_OFF_NOT_VERIFIED',
 privateReceiverActivationRequested:false,configChanged:false};
const audit={schema:'rosevear.comms.ql466.owner-audit.v1',
 originalHost:boot.originalHost,bootId:boot.bootId,bootDigest:hash(boot),
 auditorId:'auditor_abcdef123456',auditDigest:'f'.repeat(64),
 observedAt:iso(now-1000),sourceMainSha:sourceSha,
 ownerAuthObserved:true,serviceAuthenticityIndependentlyConfirmed:true,authorityTransfer:false};
const hostReview=()=>reviewQl466SignedWorkerInventory({boot:signed(boot,host),hostPin:pin(host),
 auditor:signed(audit,auditor),auditorPin:pin(auditor),nowMs:now,expectedMainSha:sourceSha});
test('QL466 neither Windows worker nor private receiver is authorized by source release',()=>{
 assert.equal(QL466_SOURCE_STATUS.sinkRoute,'NOT_IMPLEMENTED');
 assert.equal(QL466_PEER_SINK,'/internal/rosevear/master/events/read-only/v1');
 assert.equal(QL466_SOURCE_STATUS.workerServiceName,'Rosevear-CommsHub');
 assert.equal(QL466_SOURCE_STATUS.workerInstalled,'UNVERIFIED');
 assert.equal(QL466_SOURCE_STATUS.workerActivationProtocol,'NOT_IMPLEMENTED');
 assert.equal(QL466_SOURCE_STATUS.privateReceiver,'QL340C_SUPERVISED_TEST_ONLY_OFF_UNKNOWN');
 assert.equal(QL466_SOURCE_STATUS.autostartAuthorized,false);
 assert.equal(QL466_SOURCE_STATUS.physicalReceiverOffVerified,false);
});
test('QL466 synthetic signed provider inventory is review-only and denies rogue provider, scope, key, expiry',()=>{
 const ok=validInventory();
 assert.equal(ok.state,'VAULT_INVENTORY_REVIEW_HELD');
 assert.equal(ok.secretsRead,false);assert.equal(ok.live,false);
 for(const change of [
  {scopeId:'ai-data-platform'},{purpose:'SHELL_ADMIN'},
  {provider:'PLAIN_TEXT'},{opaqueRef:'plaintext:secret'},
  {rootKeyAccessible:true},{clientExposed:true},{authorityTransfer:true},
  {expiresAt:iso(now+5000)},{issuedAt:iso(now-3600000)},
  {keyVersion:0},{email:'private@example.invalid'}
 ]){
  const result=inspectQl466VaultAttestation({packet:signed({...inventory,...change},provider),
   providerPin:pin(provider),nowMs:now});
  assert.equal(result.state,'HOLD',JSON.stringify(change));
 }
 assert.equal(inspectQl466VaultAttestation({packet:signed(inventory,owner),providerPin:pin(provider),nowMs:now}).state,'HOLD');
});
test('QL466 dual authority plan is signed, expiry-safe, distinct pinned and NEVER a live cutover',()=>{
 const ok=validPlan();
 assert.equal(ok.state,'DUAL_ISSUER_ROTATION_PLAN_HELD');
 assert.equal(ok.secretsRotated,false);assert.equal(ok.certRotationApproved,false);
 assert.equal(ok.oldKeyRetired,false);assert.equal(ok.peerSends,0);
 const inputs={inventory:validInventory(),ownerPin:pin(owner),custodianPin:pin(custodian),
 nowMs:now,expectedMainSha:sourceSha};
 const review=(one,two=one)=>reviewQl466DualIssuerRotation({...inputs,
  plan:{owner:signed(one,owner),custodian:signed(two,custodian)}});
 assert.equal(review({...plan,automaticActivation:true}).state,'HOLD');
 assert.equal(review({...plan,receiverActivationRequested:true}).state,'HOLD');
 assert.equal(review({...plan,overlapMinutes:1500}).state,'HOLD');
 assert.equal(review({...plan,candidateExpiresAt:iso(now+10000)}).state,'HOLD');
 assert.equal(review({...plan,priorCertLeafDigest:plan.candidateCertLeafDigest}).state,'HOLD');
 assert.equal(review({...plan,sourceMainSha:'a'.repeat(40)}).state,'HOLD');
 assert.equal(review(plan,{...plan,candidateVersion:42}).reason,'QL466_OWNER_CUSTODIAN_DECISIONS_DIFFER');
 const samePin=reviewQl466DualIssuerRotation({...inputs,custodianPin:pin(owner),
  plan:{owner:signed(plan,owner),custodian:signed(plan,owner)}});
 assert.equal(samePin.reason,'QL466_INDEPENDENT_PINS_REQUIRED');
});
test('QL466 independent original host signed observation still cannot assert real reboot or sink',()=>{
 const ok=hostReview();
 assert.equal(ok.state,'SIGNED_WORKER_OBSERVATION_REVIEW_HELD');
 assert.equal(ok.hostRebootAuthorized,false);
 assert.equal(ok.privateReceiver,'UNKNOWN_OFF_UNWITNESSED');
 assert.equal(ok.signedBootBeforeRebootAcceptance,false);
 const args={boot:signed(boot,host),hostPin:pin(host),auditor:signed(audit,auditor),
 auditorPin:pin(auditor),nowMs:now,expectedMainSha:sourceSha};
 assert.equal(reviewQl466SignedWorkerInventory({...args,hostPin:pin(auditor)}).state,'HOLD');
 assert.equal(reviewQl466SignedWorkerInventory({...args,auditorPin:pin(host)}).state,'HOLD');
 for(const change of [{serviceName:'Rosevear-AIHub'},{obsoleteTaskDisabled:false},
  {privateReceiverState:'RUNNING'},{privateReceiverActivationRequested:true},
  {configChanged:true},{serviceState:'NOT_INSTALLED'},{observedAt:iso(now-3600000)}]){
  const p={...boot,...change};
  const adjusted={...audit,bootDigest:hash(p)};
  const res=reviewQl466SignedWorkerInventory({...args,boot:signed(p,host),auditor:signed(adjusted,auditor)});
  assert.equal(res.state,'HOLD',JSON.stringify(change));
 }
});
test('QL466 even cryptographically correct synthetic proof can never activate missing sink or reboot',()=>{
 const a=assessQl466GoNoGo({inventory:validInventory(),rotation:validPlan(),worker:hostReview(),
 peerClaim:{mtls:true,validEd25519Issuer:true,durableAck:true,ownerAudit:true}});
 assert.equal(a.state,'HOLD');
 assert.equal(a.reason,'QL466_PEER_SINK_ROUTE_NOT_IMPLEMENTED');
 assert.equal(a.vaultInventoryAvailable,true);
 assert.equal(a.rotationPlanAvailable,true);
 assert.equal(a.signedWorkerReceiptAvailable,true);
 assert.equal(a.durableAckVerified,false);
 assert.equal(a.hostRebootAuthorized,false);
 assert.equal(a.workerStarted,false);assert.equal(a.secretsRotated,false);
});
