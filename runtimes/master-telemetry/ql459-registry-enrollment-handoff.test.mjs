import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openQl458ProvenanceLedger} from './ql458-sla-drift-seven-app-provenance.mjs';
import {QL459_APPS,QL459_ROLES,QL459_MASTERS,QL459_REGISTRY,
 QL459_REGISTRY_FINGERPRINT,openQl459RegistryLedger,readQl459Registry,
 runQl459RegistryReview} from './ql459-registry-enrollment-handoff.mjs';
const iso=n=>new Date(n).toISOString();
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const incidentId='ql459_original_incident_123456';
function fixture({priorException=false,sourceDenied=false,expiredCertificate=false,
 expiredRegistry=false}={}){
 const dir=mkdtempSync(join(tmpdir(),'ql459-')),now=Date.now()-500;
 const ql458Ledger=openQl458ProvenanceLedger(join(dir,'ql458'));
 const registryLedger=openQl459RegistryLedger(join(dir,'ql459'));
 const pending=ql458Ledger.claimOnce('pending',incidentId,'a'.repeat(64));
 const past=ql458Ledger.claimOnce(priorException?'exception':'review',incidentId,'b'.repeat(64));
 const previous={
  state:priorException?'DURABLE_QL458_SLA_OR_PROVENANCE_EXCEPTION_OPEN':
   'DURABLE_QL458_SEVEN_APP_PROVENANCE_REVIEW_ONLY',
  originalIncidentId:incidentId,monitorId:'ql458_previous_monitor_abc12345',
  challengeNonce:'ql458_previous_nonce_abc12345',
  connection:'HOLD',incidentStatus:'OPEN',activationAuthorized:false,
  closureAuthorized:false,physicalReceiverCurrentlyOff:false,masterCount:3,
  ownerAcceptance:'DUAL_SIGNED_RECOVERY_EXPIRY_KEEP_OPEN_HOLD',
  sourceCount:7,sourceDenials:priorException?1:0,
  sourceManifestDigest:'c'.repeat(64),
  classification:priorException?'SIGNED_SLA_DRIFT_OR_SEVEN_APP_SOURCE_EXCEPTION_OPEN':
   'SIGNED_MULTIHORIZON_SLA_CEREMONY_AND_SEVEN_APP_SOURCE_REVIEW_ONLY',
  closureDecision:priorException?'ESCALATE_SLA_OR_SOURCE_DRIFT_KEEP_OPEN_HOLD':
   'RENEW_THREE_MASTER_SOURCE_PROVENANCE_KEEP_OPEN_HOLD',
  pendingReceiptDigest:pending.recordDigest,finalReceiptDigest:past.recordDigest,
  monitorDigest:'d'.repeat(64),gateDigest:'e'.repeat(64),reportsDigest:'f'.repeat(64)
 };
 const batchId='ql459_batch_abc123456',challengeNonce='ql459_nonce_abcdef12345';
 const appKeys=Object.fromEntries(QL459_APPS.map(a=>[a,key()]));
 const masterKeys=Object.fromEntries(QL459_MASTERS.map(m=>[m,key()]));
 const ownerKeys={source:key(),master:key()};
 const expectedMainShas=Object.fromEntries(QL459_APPS.map((a,i)=>[a,(i+1).toString(16).repeat(40)]));
 const controllerSha=expectedMainShas['ai-data-platform'];
 const g={schema:'rosevear.ql459.controller-registry.v1',batchId,
  incidentId,challengeNonce,priorReceiptDigest:past.recordDigest,
  registryFingerprint:QL459_REGISTRY_FINGERPRINT,controllerSha,
  contract:QL459_REGISTRY,issuedAt:iso(now-12000),
  expiresAt:iso(now+(expiredRegistry?-100:10000)),status:'SOURCE_ONLY_HOLD'};
 const registry=signed(g,appKeys['ai-data-platform']),registryDigest=hash(g);
 const certPayloads=QL459_APPS.map((a,i)=>({
  schema:'rosevear.ql459.enrollment-certificate.v1',
  batchId,incidentId,challengeNonce,registryDigest,appId:a,appRole:QL459_ROLES[i],
  repoFullName:'RosevearCreations/'+a,mainSha:expectedMainShas[a],
  controllerSha,keyPin:appKeys[a].pin,certificateId:'ql459_cert_'+i+'_abc123456',
  generation:2,previousEnrollmentDigest:(i+1).toString(16).repeat(64),
  scope:'SOURCE_READ_ONLY',audience:a,tenantBoundary:'ISOLATED_READ_ONLY',
  authorityTransfer:false,issuedAt:iso(now-11000),
  expiresAt:iso(now+(expiredCertificate&&i===5?-100:9000))}));
 const certDigests=certPayloads.map(hash);
 const ackPayloads=QL459_APPS.map((a,i)=>({
  schema:'rosevear.ql459.enrollment-ack.v1',batchId,incidentId,
  challengeNonce,appId:a,certificateDigest:certDigests[i],
  acknowledgedAt:iso(now-9000),ackState:'SIGNED_ACK_HELD',
  runtimeConnection:'UNVERIFIED_HOLD'}));
 const enrollment=QL459_APPS.map((a,i)=>({
  certificate:signed(certPayloads[i],appKeys['ai-data-platform']),
  acceptance:signed(ackPayloads[i],appKeys[a])}));
 const enrollmentDigest=hash(certDigests);
 const manifestPayloads=QL459_APPS.map((a,i)=>({
  schema:'rosevear.ql459.source-handoff.v1',batchId,incidentId,
  challengeNonce,appId:a,repoFullName:'RosevearCreations/'+a,
  mainSha:expectedMainShas[a],registryDigest,
  certificateDigest:certDigests[i],sourceManifestDigest:(i+1).toString(16).repeat(64),
  tenantBoundary:'ISOLATED_READ_ONLY',sourceScope:'SOURCE_READ_ONLY',
  privilegedScope:false,authorityTransfer:false,
  sourceStatus:sourceDenied&&i===4?'DENIED_SOURCE':'SIGNED_SOURCE_HELD',
  runtimeConnection:'UNVERIFIED_HOLD',sourceReadAt:iso(now-6000)}));
 const manifests=manifestPayloads.map((m,i)=>signed(m,appKeys[m.appId]));
 const manifestDigest=hash(manifestPayloads);
 const exception=priorException||sourceDenied||expiredRegistry||expiredCertificate;
 const classification=exception?'SIGNED_PREVIOUS_EXCEPTION_OR_SOURCE_DENIAL_OPEN':
  'SIGNED_SEVEN_APP_REGISTRY_HANDOFF_REVIEW_ONLY';
 const closureDecision=exception?'ESCALATE_SIGNED_SOURCE_DENIAL_KEEP_OPEN_HOLD':
  'REVIEW_SOURCE_ENROLLMENTS_KEEP_OPEN_HOLD';
 const votePayloads=QL459_MASTERS.map(masterId=>({
  schema:'rosevear.ql459.master-review.v1',batchId,incidentId,masterId,
  registryDigest,enrollmentDigest,manifestDigest,classification,closureDecision,
  incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-5000)}));
 const votes=votePayloads.map(v=>signed(v,masterKeys[v.masterId]));
 const o={schema:'rosevear.ql459.dual-owner-handoff.v1',batchId,incidentId,
  sourceOwnerId:'Original_Source_Owner',masterOwnerId:'Independent_Master_Owner',
  registryDigest,enrollmentDigest,manifestDigest,masterReportsDigest:hash(votePayloads),
  classification,closureDecision,incidentStatus:'OPEN_HOLD',reviewedAt:iso(now-4000)};
 const owners={payload:o,sourceOwnerSignature:signed(o,ownerKeys.source).signature,
  masterOwnerSignature:signed(o,ownerKeys.master).signature};
 const env={registry,enrollment,manifests,votes,owners};
 const args={ql458Summary:previous,ql458Ledger,registryLedger,batchId,challengeNonce,
  controllerRegistryProvider:{readSignedRegistry:async()=>env.registry},
  controllerEnrollmentProvider:{readSignedEnrollmentCertificates:async()=>env.enrollment},
  sevenAppManifestProvider:{readSignedSourceHandoff:async()=>env.manifests},
  threeMasterProvider:{readSignedHandoffVotes:async()=>env.votes},
  finalOwnerDecision:env.owners};
 const opts={nowMs:now,readTrustedNowMs:()=>opts.nowMs,
  trustedClockVerified:true,originalHostHoldVerified:true,
  independentQl458CustodyVerified:true,preEnrolledPinsVerified:true,
  controllerSourceVerified:true,tenantBoundaryVerified:true,
  trustedRegistryFingerprint:QL459_REGISTRY_FINGERPRINT,
  expectedMainShas,controllerSha,controllerPin:appKeys['ai-data-platform'].pin,
  appPins:Object.fromEntries(QL459_APPS.map(a=>[a,appKeys[a].pin])),
  masterPins:Object.fromEntries(QL459_MASTERS.map(a=>[a,masterKeys[a].pin])),
  sourceOwnerPin:ownerKeys.source.pin,masterOwnerPin:ownerKeys.master.pin};
 return {dir,now,previous,ql458Ledger,registryLedger,batchId,challengeNonce,
  g,registryDigest,certPayloads,ackPayloads,certDigests,manifestPayloads,
  votePayloads,o,appKeys,masterKeys,ownerKeys,env,args,opts,
  run:()=>runQl459RegistryReview(args,opts),
  setOwner(p){args.finalOwnerDecision={payload:p,
   sourceOwnerSignature:signed(p,ownerKeys.source).signature,
   masterOwnerSignature:signed(p,ownerKeys.master).signature};},
  cleanup:()=>rmSync(dir,{recursive:true,force:true})};
}
async function denied(change,reason,config={}){
 const f=fixture(config);
 try{
  change(f);
  const result=await f.run();
  assert.equal(result.state,'HOLD',result.reason);
  assert.equal(result.reason,reason);
  assert.equal(result.connection,'HOLD');
  assert.equal(result.incidentStatus,'OPEN');
  assert.equal(result.closureAuthorized,false);
  assert.equal(result.activationAuthorized,false);
  assert.equal(result.runtimeConnected,false);
  assert.equal(result.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup();}
}
test('QL459 7 controller certificates, distinct app ACKs, signed read-only manifests and owners produce historical review only',async()=>{
 const f=fixture();
 try{
  const v=await f.run();
  assert.equal(v.state,'DURABLE_QL459_SOURCE_HANDOFF_REVIEW_ONLY',v.reason);
  assert.equal(v.sourceCount,7);assert.equal(v.sourceDenials,0);
  assert.equal(v.masterCount,3);assert.equal(v.runtimeConnected,false);
  assert.equal(v.activationAuthorized,false);assert.equal(v.closureAuthorized,false);
  assert.equal(v.physicalReceiverCurrentlyOff,false);
  assert.equal(readQl459Registry(f.registryLedger,incidentId).state,
   'QL459_DURABLE_SOURCE_HANDOFF_REVIEW_ONLY');
  assert.equal((await f.run()).reason,'QL459_ONE_USE_BATCH_ALREADY_ATTEMPTED');
 }finally{f.cleanup();}
});
test('QL459 genuine prior QL458 exceptions, signed source DENIED or expired certificates stay OPEN exception',async()=>{
 for(const cfg of [{priorException:true},{sourceDenied:true},
  {expiredCertificate:true},{expiredRegistry:true}]){
  const f=fixture(cfg);
  try{
   const v=await f.run();
   assert.equal(v.state,'DURABLE_QL459_SOURCE_OR_ENROLLMENT_EXCEPTION_OPEN',v.reason);
   assert.equal(v.connection,'HOLD');
   assert.equal(v.closureAuthorized,false);
   assert.equal(readQl459Registry(f.registryLedger,incidentId).state,
    'QL459_DURABLE_SOURCE_OR_ENROLLMENT_EXCEPTION_OPEN');
  }finally{f.cleanup();}
 }
});
test('QL459 requires original protected QL458 receipts, exact incident and pre-enrolled independent pin set',async()=>{
 await denied(f=>{f.previous.incidentStatus='CLOSED';},
  'QL459_INDEPENDENT_PREDECESSOR_AND_TRUST_ROOT_REQUIRED');
 await denied(f=>{f.previous.finalReceiptDigest='a'.repeat(64);},
  'QL459_INDEPENDENT_PREDECESSOR_AND_TRUST_ROOT_REQUIRED');
 await denied(f=>{f.opts.trustedRegistryFingerprint='f'.repeat(64);},
  'QL459_INDEPENDENT_PREDECESSOR_AND_TRUST_ROOT_REQUIRED');
 await denied(f=>{f.opts.appPins.iCamp=f.opts.appPins.yw;},
  'QL459_TWELVE_DISTINCT_TRUST_PINS_AND_EXACT_SOURCE_SHAS_REQUIRED');
 await denied(f=>{f.opts.expectedMainShas.yw='1'.repeat(40);},
  'QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
 await denied(f=>{f.args.challengeNonce=f.previous.challengeNonce;},
  'QL459_INDEPENDENT_PREDECESSOR_AND_TRUST_ROOT_REQUIRED');
});
test('QL459 controller cannot forge canonical version, source identity, schema or signed registration',async()=>{
 await denied(f=>{f.env.registry=signed({...f.g,contract:{...f.g.contract,version:2}},
   f.appKeys['ai-data-platform']);},
  'QL459_CONTROLLER_SIGNATURE_OR_CANONICAL_SCHEMA_INVALID');
 await denied(f=>{f.env.registry.signature=f.env.enrollment[2].acceptance.signature;},
  'QL459_CONTROLLER_SIGNATURE_OR_CANONICAL_SCHEMA_INVALID');
 await denied(f=>{f.env.registry=signed({...f.g,controllerSha:'f'.repeat(40)},
  f.appKeys['ai-data-platform']);},
  'QL459_CONTROLLER_SIGNATURE_OR_CANONICAL_SCHEMA_INVALID');
});
test('QL459 controller certificates and app ACKs validate exact audience, role, nonce and signer',async()=>{
 await denied(f=>{f.env.enrollment.pop();},
  'QL459_SEVEN_CONTROLLER_CERTIFICATES_AND_ACKS_REQUIRED');
 await denied(f=>{f.env.enrollment[3].certificate=signed({...f.certPayloads[3],appRole:'MASTER_CONTROLLER'},
  f.appKeys['ai-data-platform']);},
  'QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
 await denied(f=>{f.env.enrollment[3].certificate=signed({...f.certPayloads[3],audience:'yw'},
  f.appKeys['ai-data-platform']);},
  'QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
 await denied(f=>{f.env.enrollment[3].certificate=signed({...f.certPayloads[3],scope:'WRITE_ALL'},
  f.appKeys['ai-data-platform']);},
  'QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
 await denied(f=>{f.env.enrollment[2].acceptance.signature=f.env.enrollment[0].acceptance.signature;},
  'QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
 await denied(f=>{f.env.enrollment[2].acceptance=signed({...f.ackPayloads[2],runtimeConnection:'CONNECTED'},
  f.appKeys['rosevear-comms-hub']);},
  'QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
 await denied(f=>{f.env.enrollment[4].certificate=signed({...f.certPayloads[4],
  certificateId:f.certPayloads[0].certificateId},f.appKeys['ai-data-platform']);},
  'QL459_SIGNED_CERTIFICATE_SCOPE_OR_INDEPENDENT_ACK_INVALID');
});
test('QL459 signed source manifests block cross-tenant privilege, stale SHA, missing signatures and fake CONNECTED',async()=>{
 await denied(f=>{f.env.manifests.pop();},'QL459_SEVEN_SOURCE_MANIFESTS_REQUIRED');
 await denied(f=>{[f.env.manifests[3],f.env.manifests[4]]=
  [f.env.manifests[4],f.env.manifests[3]];},
  'QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
 await denied(f=>{f.env.manifests[4]=signed({...f.manifestPayloads[4],privilegedScope:true},f.appKeys.yw);},
  'QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
 await denied(f=>{f.env.manifests[3]=signed({...f.manifestPayloads[3],tenantBoundary:'SHARED'},f.appKeys.iCamp);},
  'QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
 await denied(f=>{f.env.manifests[5]=signed({...f.manifestPayloads[5],mainSha:'f'.repeat(40)},f.appKeys['devilndove-site']);},
  'QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
 await denied(f=>{f.env.manifests[0]=signed({...f.manifestPayloads[0],runtimeConnection:'CONNECTED'},
  f.appKeys['ai-data-platform']);},'QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
 await denied(f=>{f.env.manifests[6].signature=f.env.manifests[2].signature;},
  'QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
 await denied(f=>{f.env.manifests[6]=signed({...f.manifestPayloads[6],sourceReadAt:iso(f.now-70000)},
  f.appKeys.rosiedazzlers);},'QL459_SOURCE_IDENTITY_PRIVILEGE_OR_SIGNATURE_DENIED');
});
test('QL459 independent three-Master and dual-owner signatures preserve OPEN/HOLD',async()=>{
 await denied(f=>{f.env.votes.pop();},'QL459_THREE_SIGNED_MASTERS_REQUIRED');
 await denied(f=>{f.env.votes[2].signature=f.env.votes[1].signature;},
  'QL459_INDEPENDENT_THREE_MASTER_VETO');
 await denied(f=>{f.setOwner({...f.o,incidentStatus:'CLOSED'});},
  'QL459_DISTINCT_DUAL_OWNER_VETO');
 await denied(f=>{f.args.finalOwnerDecision.masterOwnerSignature=
  f.args.finalOwnerDecision.sourceOwnerSignature;},'QL459_DISTINCT_DUAL_OWNER_VETO');
});
test('QL459 final trusted-clock TOCTOU rejects expiry, stale source and backwards clock',async()=>{
 await denied(f=>{f.opts.readTrustedNowMs=()=>f.now+11000;},
  'QL459_ENROLLMENT_EXPIRED_DURING_COMMIT');
 await denied(f=>{f.opts.readTrustedNowMs=()=>f.now+62000;},
  'QL459_TRUSTED_CLOCK_DRIFT');
 await denied(f=>{f.opts.readTrustedNowMs=()=>f.now-1;},
  'QL459_TRUSTED_CLOCK_DRIFT');
});
test('QL459 consumed pending receipt after failed external intake never silently replays',async()=>{
 const f=fixture();
 try{
  f.args.controllerRegistryProvider.readSignedRegistry=async()=>{throw Error('offline');};
  assert.equal((await f.run()).reason,'QL459_CONTROLLER_REGISTRY_UNAVAILABLE');
  assert.equal(readQl459Registry(f.registryLedger,incidentId).reason,
   'QL459_MANUAL_INTERRUPTED_CUSTODY_REVIEW_REQUIRED');
  assert.equal((await f.run()).reason,'QL459_ONE_USE_BATCH_ALREADY_ATTEMPTED');
 }finally{f.cleanup();}
});
test('QL459 private custody corruption and relative directory are rejected',async()=>{
 const f=fixture();
 try{
  f.registryLedger.claimOnce('pending',incidentId,'f'.repeat(64));
  writeFileSync(join(f.dir,'ql459','ql459-pending-'+incidentId+'.json'),'{}');
  assert.equal(readQl459Registry(f.registryLedger,incidentId).reason,
   'QL459_PRIVATE_CUSTODY_UNREADABLE');
  assert.equal((await f.run()).reason,'QL459_PRIVATE_CUSTODY_UNREADABLE');
 }finally{f.cleanup();}
 assert.throws(()=>openQl459RegistryLedger('relative'),/ABSOLUTE_PRIVATE_DIRECTORY/);
});
