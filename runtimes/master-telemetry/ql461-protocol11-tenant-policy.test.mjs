import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {SOURCE_IDS,MASTER_IDS,ACCESS_TIERS,POLICY_COUNT,DIRECTIONAL_EDGES,
 PROTOCOL,QL461_POLICY_SCHEMA,certifyQl461Matrix,negotiateQl461Protocol,
 evaluateQl461Authorization} from './ql461-protocol11-tenant-policy.mjs';
const iso=n=>new Date(n).toISOString();
const key=()=>{const k=generateKeyPairSync('ed25519');return{
  privateKey:k.privateKey,pin:k.publicKey.export({format:'der',type:'spki'}).toString('base64')}};
const signed=(payload,k)=>({payload,signature:sign(null,
 Buffer.from(JSON.stringify(payload)),k.privateKey).toString('base64')});
const tierNS=t=>t.toLowerCase().replaceAll('_','-');
const scopes=['public','self','tenant','operator','master','original-host-owner'];
const policy=(app,t,i)=>({
 appId:app,tier:t,policyVersion:1,subjectScope:scopes[i],
 capabilityNamespace:app+'.'+tierNS(t),
 allowedActions:i===0?['READ']:i===5?['APPROVE']:['READ','WRITE'],
 tenantBindingRequired:i>=2&&i<=4,workspaceBindingRequired:i>=2&&i<=4,
 resourceScopeDefined:true,denyByDefault:true,crossTenantAccessAllowed:false,
 consentRequiredForPersonalData:i!==0,delegatedGrantAllowed:i>0&&i<5,
 t5NonDelegable:true,ownerReviewed:true,independentlyVerified:true,
 state:'CERTIFIED'
});
function fixture(){
 const now=Date.now()-500,k={controller:key(),source:key(),owner:key(),delegation:key()};
 const sha='a'.repeat(40),sourceSha='b'.repeat(40);
 const policies=SOURCE_IDS.flatMap(a=>ACCESS_TIERS.map((t,i)=>policy(a,t,i)));
 const matrix={schema:QL461_POLICY_SCHEMA,topologyId:'rosevear-master-shell-seven-apps.v1',
  protocolMajor:1,protocolMinor:1,controllerSha:sha,revision:'ql461_revision_abc123',
  issuedAt:iso(now-10000),expiresAt:iso(now+1800000),policies,
  authorizationCount:42,directionalRelationshipCount:28,state:'SIGNED_SOURCE_ONLY'};
 let envelope=signed(matrix,k.controller);
 const matrixOpts={controllerPin:k.controller.pin,controllerSha:sha,nowMs:now};
 const sourceId='rosiedazzlers',target='rosevear-comms-hub';
 const p={schema:'rosevear.ql461.workload-action.v1',sourceId,
  repository:'rosiedazzlers',sourceMainSha:sourceSha,targetAudience:target,
  protocol:'1.1',capability:'source.security-evidence.read',
  action:'READ',tier:'T2_TENANT_SCOPED',tenantId:'tenant_abc12345',
  workspaceId:'workspace_abc12345',resourceTenantId:'tenant_abc12345',
  resourceWorkspaceId:'workspace_abc12345',subjectId:'subject_abc12345',
  tokenId:'token_abc123456',nonce:'nonce_abc123456',
  issuedAt:iso(now-10000),expiresAt:iso(now+30000),purpose:'AUDIT_APPROVED',
  personalData:true,privilegedScope:false,rawSecretIncluded:false,
  directPeerDatabaseWrite:false,authorityTransfer:false,tlsVerified:true,
  sourceSignedAt:iso(now-9000)};
 const c={schema:'rosevear.ql461.purpose-consent.v1',sourceId,
  tenantId:p.tenantId,workspaceId:p.workspaceId,subjectId:p.subjectId,
  purpose:p.purpose,capability:p.capability,issuedAt:iso(now-15000),
  expiresAt:iso(now+3600000),revoked:false,propagatedWithdrawal:false,
  mayGrantCapability:false,personalDataIncluded:false};
 const d={schema:'rosevear.ql461.delegation.v1',sourceId,
  audience:target,tenantId:p.tenantId,workspaceId:p.workspaceId,
  subjectId:p.subjectId,capability:p.capability,action:'READ',
  issuedAt:iso(now-20000),expiresAt:iso(now+3600000),
  subdelegation:false,authorityTransfer:false,t5Allowed:false,
  consequentialWriteWithoutOwnerGate:false,revoked:false,ownerReviewed:true};
 const args={matrixCert:certifyQl461Matrix(envelope,matrixOpts),
  request:{kind:'CROSS_APP',proof:signed(p,k.source)},sourcePin:k.source.pin,
  ownerConsentPin:k.owner.pin,delegationPin:k.delegation.pin,
  consent:signed(c,k.owner),peerAvailable:true,peerProtocol:'1.1',
  nowMs:now,seenTokenIds:new Set(),expectedMainShas:{rosiedazzlers:sourceSha}};
 const setProof=next=>{args.request={kind:'CROSS_APP',proof:signed(next,k.source)}};
 const setConsent=next=>{args.consent=signed(next,k.owner)};
 const setDelegation=next=>{args.delegation=signed(next,k.delegation)};
 const run=()=>evaluateQl461Authorization(args);
 return {now,k,matrix,matrixOpts,envelope,args,p,c,d,setProof,setConsent,setDelegation,run};
}
function deny(change,reason){
 const f=fixture();change(f);
 const result=f.run();
 assert.equal(result.state,'HOLD',JSON.stringify(result));
 assert.equal(result.reason,reason);
 assert.equal(result.runtimeConnected,false);
 assert.equal(result.activationAuthorized,false);
 assert.equal(result.closureAuthorized,false);
 assert.equal(result.physicalReceiverCurrentlyOff,false);
 return result;
}
test('QL461 exact canonical 42 policies, 28 edges, seven identities and six Build408 access tiers',()=>{
 assert.equal(SOURCE_IDS.length,7);assert.equal(ACCESS_TIERS.length,6);
 assert.equal(POLICY_COUNT,42);assert.equal(DIRECTIONAL_EDGES.length,28);
 assert.equal(MASTER_IDS.length,3);
 const f=fixture();
 assert.equal(f.args.matrixCert.state,'SIGNED_MATRIX_REVIEW_ONLY');
 assert.equal(f.args.matrixCert.policyCount,42);
 assert.equal(f.args.matrixCert.relationshipCount,28);
 assert.equal(PROTOCOL.lockstepReleaseRequired,false);
 assert.equal(PROTOCOL.directPeerDatabaseSyncAllowed,false);
});
test('QL461 signed Rosiedazzlers → Comms tenant proof and consent succeed WITHOUT live connectivity',()=>{
 const f=fixture();
 const r=f.run();
 assert.equal(r.state,'SOURCE_POLICY_ELIGIBLE_REVIEW_ONLY',JSON.stringify(r));
 assert.equal(r.protocol,'1.1');assert.equal(r.sourceId,'rosiedazzlers');
 assert.equal(r.targetAudience,'rosevear-comms-hub');
 assert.equal(r.runtimeConnected,false);
 assert.equal(r.activationAuthorized,false);
 assert.equal(r.closureAuthorized,false);
 assert.equal(r.physicalReceiverCurrentlyOff,false);
 assert.equal(r.localOperationsRemainAvailable,true);
});
test('QL461 independent release works if Vercel peer blocked: only dependent capability held',()=>{
 const f=fixture();f.args.peerAvailable=false;
 let r=f.run();assert.equal(r.state,'HOLD');
 assert.equal(r.reason,'QL461_ONLY_DEPENDENT_PEER_CAPABILITY_HELD');
 assert.equal(r.localOperationsRemainAvailable,true);
 const local=evaluateQl461Authorization({request:{kind:'LOCAL',localAppId:'rosevear-comms-hub',
  localTenantApproved:true,localRoleApproved:true},localPermit:true});
 assert.equal(local.state,'APP_LOCAL_GATE_ONLY');assert.equal(local.runtimeConnected,false);
 assert.equal(local.peerDeployRequired,false);
 deny(f=>{f.args.request={kind:'LOCAL',localAppId:'rosevear-comms-hub',
  localTenantApproved:true,localRoleApproved:true};},
  'QL461_LOCAL_OWNER_POLICY_NOT_PROVEN');
});
test('QL461 protocol 1.1 negotiates known v1.0 capabilities without lockstep release',()=>{
 let f=fixture();f.args.peerProtocol='1.0';
 f.setProof({...f.p,protocol:'1.0',capability:'source.health.read',personalData:false});
 f.args.consent=null;
 let r=f.run();
 assert.equal(r.state,'SOURCE_POLICY_ELIGIBLE_REVIEW_ONLY',JSON.stringify(r));
 assert.equal(r.protocol,'1.0');assert.equal(r.peerDeployRequired,false);
 f=fixture();f.args.peerProtocol='1.0';
 r=f.run();assert.equal(r.reason,'QL461_V11_CAPABILITY_HELD_ON_V10_PEER');
 assert.equal(r.localOperationsRemainAvailable,true);
 for(const peer of ['2.0','0.9',undefined]){
  const x=negotiateQl461Protocol({peer,capability:'source.health.read'});
  assert.equal(x.state,'HOLD');
 }
 assert.equal(negotiateQl461Protocol({peer:'1.1',capability:'source.unknown'}).reason,
  'QL461_UNKNOWN_CAPABILITY_FAIL_CLOSED');
 assert.equal(negotiateQl461Protocol({peer:'1.1',capability:'source.health.read',
  changeType:'BREAKING'}).reason,'QL461_BREAKING_CHANGE_REQUIRES_MAJOR_VERSION_HANDOFF');
 assert.equal(negotiateQl461Protocol({peer:'1.1',capability:'source.health.read',
  changeType:'BREAKING',explicitMajorHandoff:true}).reason,
  'QL461_BREAKING_CHANGE_NOT_PERMITTED_ON_V1');
});
test('QL461 matrix signatures, namespace mismatch, missing and duplicate policies fail closed',()=>{
 const f=fixture();
 const forged=signed({...f.matrix,policies:f.matrix.policies.slice(1)},f.k.controller);
 assert.equal(certifyQl461Matrix(forged,f.matrixOpts).state,'HOLD');
 const dup=f.matrix.policies.map(x=>({...x}));dup[1]=dup[0];
 assert.equal(certifyQl461Matrix(signed({...f.matrix,policies:dup},f.k.controller),f.matrixOpts).state,'HOLD');
 const wild=f.matrix.policies.map(x=>({...x}));wild[4].capabilityNamespace='*';
 assert.equal(certifyQl461Matrix(signed({...f.matrix,policies:wild},f.k.controller),f.matrixOpts).state,'HOLD');
 const x=signed({...f.matrix,protocolMajor:2},f.k.controller);
 assert.equal(certifyQl461Matrix(x,f.matrixOpts).state,'HOLD');
 assert.equal(certifyQl461Matrix(f.envelope,{...f.matrixOpts,controllerSha:'b'.repeat(40)}).state,'HOLD');
 assert.equal(certifyQl461Matrix({...f.envelope,signature:'a'.repeat(88)},f.matrixOpts).state,'HOLD');
 deny(f=>{f.args.matrixCert=null},'QL461_SIGNED_MATRIX_REQUIRED');
});
test('QL461 signed source SHA/alias, peer audience, strict role and T5 cannot cross boundary',()=>{
 deny(f=>{f.setProof({...f.p,repository:'devilndove-site'})},
  'QL461_SIGNED_SOURCE_IDENTITY_OR_SHA_DENIED');
 deny(f=>{f.setProof({...f.p,sourceMainSha:'f'.repeat(40)})},
  'QL461_SIGNED_SOURCE_IDENTITY_OR_SHA_DENIED');
 deny(f=>{f.args.sourcePin=key().pin},
  'QL461_SIGNED_SOURCE_IDENTITY_OR_SHA_DENIED');
 deny(f=>{f.setProof({...f.p,targetAudience:'yw'})},
  'QL461_SIGNED_SOURCE_IDENTITY_OR_SHA_DENIED');
 deny(f=>{f.setProof({...f.p,action:'WRITE'})},
  'QL461_PRIVILEGED_T5_OR_UNSCOPED_ACTION_DENIED');
 deny(f=>{f.setProof({...f.p,tier:'T5_ORIGINAL_HOST_OWNER_CEREMONY'})},
  'QL461_PRIVILEGED_T5_OR_UNSCOPED_ACTION_DENIED');
 deny(f=>{f.setProof({...f.p,privilegedScope:true})},
  'QL461_PRIVILEGED_T5_OR_UNSCOPED_ACTION_DENIED');
 deny(f=>{f.setProof({...f.p,rawSecretIncluded:true})},
  'QL461_PRIVILEGED_T5_OR_UNSCOPED_ACTION_DENIED');
 deny(f=>{f.setProof({...f.p,directPeerDatabaseWrite:true})},
  'QL461_PRIVILEGED_T5_OR_UNSCOPED_ACTION_DENIED');
});
test('QL461 cross-tenant, cross-workspace and purpose scope never silently elevate',()=>{
 deny(f=>{f.setProof({...f.p,resourceTenantId:'tenant_other_abc123'})},
  'QL461_CROSS_TENANT_OR_WORKSPACE_DENIED');
 deny(f=>{f.setProof({...f.p,resourceWorkspaceId:'workspace_other_abc123'})},
  'QL461_CROSS_TENANT_OR_WORKSPACE_DENIED');
 deny(f=>{f.setProof({...f.p,purpose:'NONE'})},
  'QL461_CROSS_TENANT_OR_WORKSPACE_DENIED');
 deny(f=>{f.setProof({...f.p,tenantId:'*'})},
  'QL461_CROSS_TENANT_OR_WORKSPACE_DENIED');
});
test('QL461 revoked/mismatched purpose-bound consent and false consent grants deny',()=>{
 deny(f=>{f.setConsent({...f.c,revoked:true,propagatedWithdrawal:true})},
  'QL461_CONSENT_PURPOSE_OR_REVOCATION_DENIED');
 deny(f=>{f.setConsent({...f.c,tenantId:'tenant_another123'})},
  'QL461_CONSENT_PURPOSE_OR_REVOCATION_DENIED');
 deny(f=>{f.setConsent({...f.c,purpose:'ANALYTICS'})},
  'QL461_CONSENT_PURPOSE_OR_REVOCATION_DENIED');
 deny(f=>{f.setConsent({...f.c,mayGrantCapability:true})},
  'QL461_CONSENT_PURPOSE_OR_REVOCATION_DENIED');
 deny(f=>{f.args.consent=null},'QL461_CONSENT_PURPOSE_OR_REVOCATION_DENIED');
});
test('QL461 delegation is exact read-only <=24h, single-hop and owner-gated',()=>{
 const f=fixture();f.setDelegation(f.d);
 assert.equal(f.run().state,'SOURCE_POLICY_ELIGIBLE_REVIEW_ONLY');
 deny(f=>{f.setDelegation({...f.d,expiresAt:iso(f.now+90000000)})},
  'QL461_UNSCOPED_DELEGATION_OR_OWNER_GATE_DENIED');
 deny(f=>{f.setDelegation({...f.d,subdelegation:true})},
  'QL461_UNSCOPED_DELEGATION_OR_OWNER_GATE_DENIED');
 deny(f=>{f.setDelegation({...f.d,authorityTransfer:true})},
  'QL461_UNSCOPED_DELEGATION_OR_OWNER_GATE_DENIED');
 deny(f=>{f.setDelegation({...f.d,audience:'rosevear-ai-hub'})},
  'QL461_UNSCOPED_DELEGATION_OR_OWNER_GATE_DENIED');
 deny(f=>{f.setDelegation({...f.d,consequentialWriteWithoutOwnerGate:true})},
  'QL461_UNSCOPED_DELEGATION_OR_OWNER_GATE_DENIED');
});
test('QL461 proof signature, token expiry, reused JTI, transport and protocol downgrade fail closed',()=>{
 deny(f=>{f.args.seenTokenIds.add(f.p.tokenId)},'QL461_EXPIRY_OR_REPLAY_DENIED');
 deny(f=>{f.setProof({...f.p,expiresAt:iso(f.now-1)})},
  'QL461_EXPIRY_OR_REPLAY_DENIED');
 deny(f=>{f.setProof({...f.p,issuedAt:iso(f.now-301000)})},
  'QL461_EXPIRY_OR_REPLAY_DENIED');
 deny(f=>{f.setProof({...f.p,tlsVerified:false})},
  'QL461_PRIVILEGED_T5_OR_UNSCOPED_ACTION_DENIED');
 deny(f=>{f.args.peerProtocol='1.0';f.setProof({...f.p,protocol:'1.1',capability:'source.health.read'})},
  'QL461_SIGNATURE_PROTOCOL_DOWNGRADE_DENIED');
 deny(f=>{{const s=f.args.request.proof.signature;f.args.request.proof.signature=(s[0]==='A'?'B':'A')+s.slice(1)}},
  'QL461_SIGNED_SOURCE_IDENTITY_OR_SHA_DENIED');
});
