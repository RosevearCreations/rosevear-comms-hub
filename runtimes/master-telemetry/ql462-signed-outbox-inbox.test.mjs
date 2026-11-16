import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SOURCE_IDS,ACCESS_TIERS,QL461_POLICY_SCHEMA,certifyQl461Matrix}
 from './ql461-protocol11-tenant-policy.mjs';
import {QL462_SCHEMA,QL462_OWNER_DASHBOARD,QL462_SOURCE_MODULES,
 openQl462DurableLedger,stageQl462SignedOutbox,inspectQl462Outbox,
 reviewQl462SignedAck,deadLetterQl462,reviewQl462LocalContinuity}
 from './ql462-signed-outbox-inbox.mjs';
const iso=n=>new Date(n).toISOString();
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const key=()=>{const k=generateKeyPairSync('ed25519');return{
 privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const tierScopes=['public','self','tenant','operator','master','original-host-owner'];
function fixture({peerProtocol='1.1',peerAvailable=false,capability='source.security-evidence.read'}={}){
 const root=mkdtempSync(join(tmpdir(),'ql462-')),now=Date.now()-500;
 const ledger=openQl462DurableLedger(join(root,'secure'));
 const keys={controller:key(),source:key(),owner:key(),master:key()};
 const sourceId='rosiedazzlers',targetAudience='rosevear-comms-hub';
 const sourceMainSha='b'.repeat(40),controllerSha='a'.repeat(40);
 const policies=SOURCE_IDS.flatMap(a=>ACCESS_TIERS.map((tier,i)=>({
  appId:a,tier,policyVersion:1,subjectScope:tierScopes[i],
  capabilityNamespace:a+'.'+tier.toLowerCase().replaceAll('_','-'),
  allowedActions:i===0?['READ']:i===5?['APPROVE']:['READ','WRITE'],
  tenantBindingRequired:i>=2&&i<=4,workspaceBindingRequired:i>=2&&i<=4,
  resourceScopeDefined:true,denyByDefault:true,crossTenantAccessAllowed:false,
  consentRequiredForPersonalData:i!==0,delegatedGrantAllowed:i>0&&i<5,
  t5NonDelegable:true,ownerReviewed:true,independentlyVerified:true,state:'CERTIFIED'})));
 const matrix={schema:QL461_POLICY_SCHEMA,topologyId:'rosevear-master-shell-seven-apps.v1',
  protocolMajor:1,protocolMinor:1,controllerSha,revision:'ql461_revision_abc123',
  issuedAt:iso(now-10000),expiresAt:iso(now+300000),policies,
  authorizationCount:42,directionalRelationshipCount:28,state:'SIGNED_SOURCE_ONLY'};
 const matrixCert=certifyQl461Matrix(signed(matrix,keys.controller),{
  controllerPin:keys.controller.pin,controllerSha,nowMs:now});
 assert.equal(matrixCert.state,'SIGNED_MATRIX_REVIEW_ONLY');
 const authPayload={
  schema:'rosevear.ql461.workload-action.v1',sourceId,repository:'rosiedazzlers',
  sourceMainSha,targetAudience,protocol:peerProtocol,capability,
  action:'READ',tier:'T2_TENANT_SCOPED',tenantId:'tenant_abc12345',
  workspaceId:'workspace_abc12345',resourceTenantId:'tenant_abc12345',
  resourceWorkspaceId:'workspace_abc12345',subjectId:'subject_abc12345',
  tokenId:'auth_token_abc12345',nonce:'auth_nonce_abc12345',
  issuedAt:iso(now-10000),expiresAt:iso(now+100000),purpose:'SOURCE_AUDIT',
  personalData:false,privilegedScope:false,rawSecretIncluded:false,
  directPeerDatabaseWrite:false,authorityTransfer:false,tlsVerified:true,
  sourceSignedAt:iso(now-9000)};
 const authArgs={matrixCert,request:{kind:'CROSS_APP',proof:signed(authPayload,keys.source)},
  sourcePin:keys.source.pin,peerProtocol,peerAvailable:true,nowMs:now,
  seenTokenIds:new Set(),expectedMainShas:{[sourceId]:sourceMainSha}};
 const payload={schema:QL462_SCHEMA,messageId:'message_abc123456',
  idempotencyKey:'idem_abc123456',replayNonce:'replay_abc123456',
  sourceId,sourceRepository:'rosiedazzlers',sourceMainSha,targetAudience,
  protocol:peerProtocol,capability,tenantId:authPayload.tenantId,
  workspaceId:authPayload.workspaceId,subjectId:authPayload.subjectId,
  correlationId:'correlation_abc123456',bodyDigest:'c'.repeat(64),
  bodyClass:'SOURCE_NONPERSONAL_EVIDENCE',
  issuedAt:iso(now-6000),expiresAt:iso(now+30000),
  requestScope:'SOURCE_READ_ONLY',authorityTransfer:false,
  privateDataIncluded:false,directPeerDatabaseWrite:false,
  ownerCeremonyRequested:false};
 const opts={ledger,envelope:signed(payload,keys.source),
  sourcePin:keys.source.pin,authorizationArgs:authArgs,
  expectedMainShas:{[sourceId]:sourceMainSha},peerProtocol,peerAvailable,nowMs:now};
 const ack={schema:'rosevear.ql462.master-ack.v1',
  messageId:payload.messageId,idempotencyKey:payload.idempotencyKey,
  sourceId,targetAudience,outboxDigest:'',protocol:peerProtocol,
  reviewState:'SOURCE_REVIEW_ACCEPTED',acceptedAt:iso(now-3000),
  runtimeConnection:'UNVERIFIED_HOLD',authorityTransfer:false};
 const dlq={schema:'rosevear.ql462.deadletter-review.v1',
  messageId:payload.messageId,idempotencyKey:payload.idempotencyKey,
  outboxDigest:'',reason:'PEER_UNAVAILABLE',reviewedAt:iso(now-2000),
  sourceOwnerId:'source_owner_abc123',incidentStatus:'OPEN_HOLD',
  authorityTransfer:false};
 return {root,keys,ledger,now,payload,authPayload,authArgs,opts,ack,dlq,
  stage:()=>stageQl462SignedOutbox(opts),
  prepareAck(){this.ack.outboxDigest=this.ledger.read('outbox',payload.idempotencyKey).digest},
  prepareDlq(){this.dlq.outboxDigest=this.ledger.read('outbox',payload.idempotencyKey).digest},
  ackReview(){return reviewQl462SignedAck({ledger,
   ack:signed(this.ack,keys.master),masterPin:keys.master.pin,
   idempotencyKey:payload.idempotencyKey,nowMs:now})},
  deadLetter(){return deadLetterQl462({ledger,review:signed(this.dlq,keys.owner),
   ownerPin:keys.owner.pin,idempotencyKey:payload.idempotencyKey,nowMs:now})},
  cleanup(){rmSync(root,{recursive:true,force:true})}};
}
function denied(mutator,expected){
 const f=fixture();
 try{
  mutator(f);
  const r=f.stage();assert.equal(r.state,'HOLD',JSON.stringify(r));
  assert.equal(r.reason,expected);assert.equal(r.runtimeConnected,false);
  assert.equal(r.activationAuthorized,false);assert.equal(r.closureAuthorized,false);
  assert.equal(r.physicalReceiverCurrentlyOff,false);
 }finally{f.cleanup()}
}
test('QL462 staged offline source proof preserves independent local work and strict OPEN/HOLD',()=>{
 const f=fixture();
 try{
  const v=f.stage();
  assert.equal(v.state,'SIGNED_OUTBOX_PENDING_HOLD',JSON.stringify(v));
  assert.equal(v.peerAvailable,false);assert.equal(v.runtimeConnected,false);
  assert.equal(v.senderEnabled,false);assert.equal(v.receiverEnabled,false);
  assert.equal(v.localOperationsRemainAvailable,true);
  assert.equal(inspectQl462Outbox(f.ledger,f.payload.idempotencyKey).state,
   'PENDING_LOCAL_OUTBOX_HOLD');
  const duplicate=f.stage();
  assert.equal(duplicate.duplicate,true);assert.equal(duplicate.runtimeConnected,false);
  assert.equal(f.ledger.read('ack',f.payload.idempotencyKey),null);
 }finally{f.cleanup();}
});
test('QL462 known protocol 1.0 peer can stage existing public health, no lockstep',()=>{
 const f=fixture({peerProtocol:'1.0',capability:'source.health.read'});
 try{
  f.opts.envelope=signed({...f.payload,protocol:'1.0',capability:'source.health.read'},
   f.keys.source);
  let r=f.stage();assert.equal(r.state,'SIGNED_OUTBOX_PENDING_HOLD',r.reason);
  assert.equal(r.negotiatedProtocol,'1.0');assert.equal(r.peerAvailable,false);
 }finally{f.cleanup()}
});
test('QL462 protocol 1.1-only new capability on v1.0 peer is HOLD while local works',()=>{
 const f=fixture();
 try{
  f.opts.peerProtocol='1.0';f.authArgs.peerProtocol='1.0';
  const v=f.stage();
  assert.equal(v.reason,'QL462_PEER_PROTOCOL_CAPABILITY_UNSUPPORTED');
  const local=reviewQl462LocalContinuity({moduleId:'rosevear-comms-hub',
   localOwnerAuthorized:true,localRoleAuthorized:true,peerAvailable:false});
  assert.equal(local.state,'LOCAL_OWNER_GATED_OPERATION_ALLOWED');
  assert.equal(local.runtimeConnected,false);
  assert.equal(QL462_OWNER_DASHBOARD.local24x7ServiceInstalled,false);
 }finally{f.cleanup()}
});
test('QL462 foreign source/repo, unsigned, stale SHA, private payload and T5 deny',()=>{
 denied(f=>{f.opts.envelope=signed({...f.payload,sourceRepository:'iCamp'},f.keys.source)},
  'QL462_MESSAGE_SCOPE_TENANT_OR_FRESHNESS_DENIED');
 denied(f=>{f.opts.sourcePin=key().pin},
  'QL462_SIGNED_MESSAGE_INVALID');
 denied(f=>{f.opts.envelope=signed({...f.payload,sourceMainSha:'f'.repeat(40)},f.keys.source)},
  'QL462_MESSAGE_SCOPE_TENANT_OR_FRESHNESS_DENIED');
 denied(f=>{f.opts.envelope=signed({...f.payload,privateDataIncluded:true},f.keys.source)},
  'QL462_MESSAGE_SCOPE_TENANT_OR_FRESHNESS_DENIED');
 denied(f=>{f.opts.envelope=signed({...f.payload,ownerCeremonyRequested:true},f.keys.source)},
  'QL462_MESSAGE_SCOPE_TENANT_OR_FRESHNESS_DENIED');
 denied(f=>{f.opts.envelope=signed({...f.payload,directPeerDatabaseWrite:true},f.keys.source)},
  'QL462_MESSAGE_SCOPE_TENANT_OR_FRESHNESS_DENIED');
});
test('QL462 exact QL461 matrix and workload authorization are mandatory',()=>{
 denied(f=>{f.opts.authorizationArgs=null},
  'QL462_SIGNED_QL461_AUTHORIZATION_CONTEXT_REQUIRED');
 denied(f=>{f.opts.authorizationArgs.request.proof.payload.tenantId='other_tenant_123'},
  'QL462_SIGNED_QL461_AUTHORIZATION_CONTEXT_REQUIRED');
 denied(f=>{f.opts.authorizationArgs.sourcePin=key().pin},
  'QL462_SIGNED_QL461_AUTHORIZATION_CONTEXT_REQUIRED');
 denied(f=>{f.opts.authorizationArgs.matrixCert=null},
  'QL462_QL461_TENANT_POLICY_HOLD_QL461_SIGNED_MATRIX_REQUIRED');
});
test('QL462 distinct idempotency conflicts and duplicate/replay do not mutate durable receipt',()=>{
 const f=fixture();
 try{
  const a=f.stage();assert.equal(a.state,'SIGNED_OUTBOX_PENDING_HOLD');
  f.opts.envelope=signed({...f.payload,messageId:'message_different_abc123',
   idempotencyKey:f.payload.idempotencyKey},f.keys.source);
  assert.equal(f.stage().reason,'QL462_IDEMPOTENCY_CONFLICT_OR_REPLAY');
  assert.equal(f.ledger.read('outbox',f.payload.idempotencyKey).digest,a.outboxDigest);
 }finally{f.cleanup()}
});
test('QL462 independently signed master ACK is receipt review only, not DELIVERY',()=>{
 const f=fixture();
 try{
  assert.equal(f.stage().state,'SIGNED_OUTBOX_PENDING_HOLD');
  f.prepareAck();const a=f.ackReview();
  assert.equal(a.state,'SIGNED_MASTER_ACK_REVIEW_ONLY',a.reason);
  assert.equal(a.runtimeConnected,false);
  assert.equal(inspectQl462Outbox(f.ledger,f.payload.idempotencyKey).state,
   'INBOX_SIGNED_ACK_REVIEW_ONLY');
  assert.equal(f.ackReview().reason,'QL462_ACK_REPLAY_OR_DEADLETTER_CONFLICT');
  f.prepareDlq();
  assert.equal(f.deadLetter().reason,'QL462_DEADLETTER_REPLAY_OR_ACK_CONFLICT');
 }finally{f.cleanup()}
});
test('QL462 forged ACK, wrong binding, fake CONNECTED and stale receipt fail closed',()=>{
 const f=fixture();
 try{
  f.stage();f.prepareAck();
  let a=reviewQl462SignedAck({ledger:f.ledger,
   ack:signed(f.ack,key()),masterPin:f.keys.master.pin,
   idempotencyKey:f.payload.idempotencyKey,nowMs:f.now});
  assert.equal(a.reason,'QL462_MASTER_ACK_SIGNATURE_INVALID');
  f.ack.runtimeConnection='CONNECTED';a=f.ackReview();
  assert.equal(a.reason,'QL462_ACK_BINDING_OR_FRESHNESS_DENIED');
  f.ack.runtimeConnection='UNVERIFIED_HOLD';f.ack.outboxDigest='f'.repeat(64);
  assert.equal(f.ackReview().reason,'QL462_ACK_BINDING_OR_FRESHNESS_DENIED');
  assert.equal(f.ledger.read('ack',f.payload.idempotencyKey),null);
 }finally{f.cleanup()}
});
test('QL462 owner-signed deadletter remains HOLD, forbids duplicate ACK and DLQ',()=>{
 const f=fixture();
 try{
  f.stage();f.prepareDlq();
  let d=f.deadLetter();
  assert.equal(d.state,'SIGNED_DEAD_LETTER_OPEN_HOLD');
  assert.equal(d.runtimeConnected,false);
  assert.equal(inspectQl462Outbox(f.ledger,f.payload.idempotencyKey).state,
   'DEAD_LETTER_OPEN_HOLD');
  assert.equal(f.deadLetter().reason,'QL462_DEADLETTER_REPLAY_OR_ACK_CONFLICT');
  f.prepareAck();assert.equal(f.ackReview().reason,'QL462_ACK_REPLAY_OR_DEADLETTER_CONFLICT');
 }finally{f.cleanup()}
});
test('QL462 invalid owner-signature and arbitrary failure reason cannot declare delivery',()=>{
 const f=fixture();
 try{
  f.stage();f.prepareDlq();
  const invalid=deadLetterQl462({ledger:f.ledger,
   review:signed(f.dlq,key()),ownerPin:f.keys.owner.pin,
   idempotencyKey:f.payload.idempotencyKey,nowMs:f.now});
  assert.equal(invalid.reason,'QL462_INDEPENDENT_OWNER_DEADLETTER_SIGNATURE_INVALID');
  f.dlq.reason='RUN_NOW';
  assert.equal(f.deadLetter().reason,'QL462_OWNER_DEADLETTER_BINDING_INVALID');
 }finally{f.cleanup()}
});
test('QL462 private directory, write-once receipt, corruption and cross-source idempotency are fail closed',()=>{
 assert.throws(()=>openQl462DurableLedger('relative'),/ABSOLUTE_PRIVATE/);
 const f=fixture();
 try{
  f.stage();
  const path=join(f.root,'secure','ql462-outbox-'+f.payload.idempotencyKey+'.json');
  writeFileSync(path,'{}');
  assert.equal(inspectQl462Outbox(f.ledger,f.payload.idempotencyKey).reason,
   'QL462_CUSTODY_CORRUPT_OR_UNREADABLE');
  assert.equal(f.stage().reason,'QL462_DURABLE_OUTBOX_CLAIM_FAILED');
 }finally{f.cleanup()}
});
test('QL462 unified three modules, two slave shells and themes are explicit non-activating contracts',()=>{
 assert.deepEqual(QL462_SOURCE_MODULES.map(x=>x.id),[
  'ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
 assert.equal(QL462_OWNER_DASHBOARD.slaves.length,2);
 assert.equal(QL462_OWNER_DASHBOARD.serviceActivation,'NOT_AUTHORIZED_BY_QL462');
 assert.equal(QL462_OWNER_DASHBOARD.homeAssistantIntegration,'DESIGN_ONLY_NOT_CONNECTED');
 assert.equal(QL462_OWNER_DASHBOARD.peerHealth,'UNVERIFIED_HOLD');
 const denied=reviewQl462LocalContinuity({moduleId:'rosevear-ai-hub',
  localOwnerAuthorized:false,localRoleAuthorized:true});
 assert.equal(denied.state,'HOLD');
});
