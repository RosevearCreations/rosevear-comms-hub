import {createHash,createPublicKey,verify} from 'node:crypto';
/** QL-461: Build 408 compatible, local-only zero-trust policy and protocol evaluator.
 * No network calls, credential install, authority transfer, peer deployment or host activation.
 * Returns policy evidence, NEVER a runtime connection or physical receiver clearance. */
export const SOURCE_IDS=Object.freeze([
 'ai-data-platform','rosevear-ai-hub','rosevear-comms-hub',
 'icamp','yw','devilndove','rosiedazzlers']);
export const MASTER_IDS=Object.freeze(SOURCE_IDS.slice(0,3));
export const REPO_BY_SOURCE=Object.freeze({
 'ai-data-platform':'ai-data-platform','rosevear-ai-hub':'rosevear-ai-hub',
 'rosevear-comms-hub':'rosevear-comms-hub',icamp:'iCamp',
 yw:'yw',devilndove:'devilndove-site',rosiedazzlers:'rosiedazzlers'});
export const ACCESS_TIERS=Object.freeze([
 'T0_PUBLIC_READ','T1_USER_SCOPED','T2_TENANT_SCOPED',
 'T3_OPERATOR_SCOPED','T4_MASTER_GOVERNANCE',
 'T5_ORIGINAL_HOST_OWNER_CEREMONY']);
export const POLICY_COUNT=42;
export const PROTOCOL=Object.freeze({major:1,minor:1,backwardCompatibleMinor:0,
 lockstepReleaseRequired:false,independentDeployAllowed:true,
 unavailablePeerBlocksOnlyDependentFeature:true,localOperationsContinue:true,
 breakingChangesRequireMajorBump:true,unknownCapabilitiesFailClosed:true,
 rawSecretSyncAllowed:false,directPeerDatabaseSyncAllowed:false});
const PAIRS=[
 ['ai-data-platform','rosevear-ai-hub'],['ai-data-platform','rosevear-comms-hub'],
 ['ai-data-platform','icamp'],['ai-data-platform','yw'],
 ['ai-data-platform','devilndove'],['ai-data-platform','rosiedazzlers'],
 ['rosevear-ai-hub','icamp'],['rosevear-ai-hub','yw'],
 ['rosevear-ai-hub','devilndove'],['rosevear-ai-hub','rosiedazzlers'],
 ['rosevear-comms-hub','icamp'],['rosevear-comms-hub','yw'],
 ['rosevear-comms-hub','devilndove'],['rosevear-comms-hub','rosiedazzlers']];
export const DIRECTIONAL_EDGES=Object.freeze(PAIRS.flatMap(([a,b])=>[a+'>'+b,b+'>'+a]));
const CAPS=Object.freeze({
 'source.health.read':0,'source.capabilities.read':0,
 'source.security-evidence.read':1,'source.correlation-evidence.read':1,
 'source.workflow-handoff.read':1});
const HEX=/^[0-9a-f]{64}$/, SHA=/^[0-9a-f]{40}$/;
const ID=/^[A-Za-z0-9_-]{12,120}$/;
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
export const QL461_POLICY_SCHEMA='rosevear.ql461.policy-matrix.v1';
const exact=(v,keys)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===keys.length&&keys.every(x=>Object.hasOwn(v,x));
const at=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
 new Date(Date.parse(s)).toISOString()===s?Date.parse(s):NaN;
const fresh=(s,now,max=300000)=>Number.isSafeInteger(now)&&Number.isFinite(at(s))&&
 at(s)<=now&&now-at(s)<=max;
function verifySigned(envelope,pin){
 try{
  if(!exact(envelope,['payload','signature'])||
   typeof pin!=='string'||pin.length>512||
   typeof envelope.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature))
   return false;
  const b=Buffer.from(pin,'base64');
  if(b.toString('base64')!==pin)return false;
  const key=createPublicKey({key:b,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&
   verify(null,Buffer.from(JSON.stringify(envelope.payload)),key,
    Buffer.from(envelope.signature,'base64'));
 }catch{return false;}
}
const HOLD=(reason,scope='CROSS_APP')=>({state:'HOLD',reason,scope,connection:'HOLD',
 runtimeConnected:false,authorityTransfer:false,activationAuthorized:false,
 closureAuthorized:false,physicalReceiverCurrentlyOff:false,
 originalHostIncident:'OPEN',localOperationsRemainAvailable:true,
 peerDeployRequired:false});
const REVIEW=(data)=>({...HOLD('SIGNED_POLICY_REVIEW_NOT_RUNTIME_ACCEPTANCE'),
 state:'SOURCE_POLICY_ELIGIBLE_REVIEW_ONLY',...data});
const EXPECTED_SCOPES=['public','self','tenant','operator','master','original-host-owner'];
const tierNS=t=>t.toLowerCase().replaceAll('_','-');
const policyFields=['appId','tier','policyVersion','subjectScope',
 'capabilityNamespace','allowedActions','tenantBindingRequired',
 'workspaceBindingRequired','resourceScopeDefined','denyByDefault',
 'crossTenantAccessAllowed','consentRequiredForPersonalData',
 'delegatedGrantAllowed','t5NonDelegable','ownerReviewed','independentlyVerified',
 'state'];
const matrixFields=['schema','topologyId','protocolMajor','protocolMinor',
 'controllerSha','revision','issuedAt','expiresAt','policies',
 'authorizationCount','directionalRelationshipCount','state'];
/** Validate a single pre-enrolled controller-signed matrix, no fetching peers. */
export function certifyQl461Matrix(envelope,{controllerPin,controllerSha,nowMs}={}){
 if(!verifySigned(envelope,controllerPin)||!exact(envelope.payload,matrixFields))
  return {state:'HOLD',reason:'QL461_MATRIX_SIGNATURE_OR_SCHEMA'};
 const m=envelope.payload;
 if(m.schema!==QL461_POLICY_SCHEMA||
  m.topologyId!=='rosevear-master-shell-seven-apps.v1'||
  m.protocolMajor!==1||m.protocolMinor!==1||
  !SHA.test(controllerSha??'')||m.controllerSha!==controllerSha||
  !ID.test(m.revision??'')||m.state!=='SIGNED_SOURCE_ONLY'||
  !fresh(m.issuedAt,nowMs)||!Number.isFinite(at(m.expiresAt))||
  at(m.expiresAt)<=nowMs||at(m.expiresAt)-at(m.issuedAt)>3600000||
  m.authorizationCount!==POLICY_COUNT||
  m.directionalRelationshipCount!==DIRECTIONAL_EDGES.length||
  !Array.isArray(m.policies)||m.policies.length!==POLICY_COUNT)
  return {state:'HOLD',reason:'QL461_MATRIX_VERSION_OR_42_POLICY_DENIAL'};
 const seen=new Set();
 for(const p of m.policies){
  if(!exact(p,policyFields)||!SOURCE_IDS.includes(p.appId)||
   !ACCESS_TIERS.includes(p.tier))return {state:'HOLD',reason:'QL461_UNRECOGNIZED_SCOPE'};
  const t=ACCESS_TIERS.indexOf(p.tier),key=p.appId+'|'+p.tier;
  if(seen.has(key)||p.policyVersion!==1||
   p.subjectScope!==EXPECTED_SCOPES[t]||
   p.capabilityNamespace!==p.appId+'.'+tierNS(p.tier)||
   !Array.isArray(p.allowedActions)||p.allowedActions.length===0||
   p.allowedActions.some(a=>!['READ','WRITE','EXECUTE','APPROVE'].includes(a))||
   new Set(p.allowedActions).size!==p.allowedActions.length||
   !p.resourceScopeDefined||!p.denyByDefault||
   p.crossTenantAccessAllowed!==false||
   p.tenantBindingRequired!==(t>=2&&t<=4)||
   p.workspaceBindingRequired!==(t>=2&&t<=4)||
   p.consentRequiredForPersonalData!==(t!==0)||
   p.delegatedGrantAllowed!==(t>0&&t<5)||
   p.t5NonDelegable!==true||
   !p.ownerReviewed||!p.independentlyVerified||p.state!=='CERTIFIED'||
   (t===0&&(p.allowedActions.length!==1||p.allowedActions[0]!=='READ'))||
   (t===5&&(p.allowedActions.length!==1||p.allowedActions[0]!=='APPROVE')))
   return {state:'HOLD',reason:'QL461_ROLE_TENANT_WILDCARD_OR_PRIVILEGE_DENIAL'};
  seen.add(key);
 }
 const full=SOURCE_IDS.every(a=>ACCESS_TIERS.every(t=>seen.has(a+'|'+t)));
 if(!full)return {state:'HOLD',reason:'QL461_INCOMPLETE_MATRIX'};
 return {state:'SIGNED_MATRIX_REVIEW_ONLY',digest:hash(m),matrix:m,
  policyCount:POLICY_COUNT,relationshipCount:DIRECTIONAL_EDGES.length,
  protocol:'1.1',runtimeConnected:false};
}
export function negotiateQl461Protocol({local='1.1',peer,peerAvailable=true,
 capability,changeType='ADDITIVE',explicitMajorHandoff=false}={}){
 if(local!=='1.1')return HOLD('QL461_LOCAL_PROTOCOL_CONFIGURATION_INVALID');
 if(!peerAvailable)return HOLD('QL461_ONLY_DEPENDENT_PEER_CAPABILITY_HELD');
 if(changeType==='BREAKING'&&!explicitMajorHandoff)
  return HOLD('QL461_BREAKING_CHANGE_REQUIRES_MAJOR_VERSION_HANDOFF');
 if(!Object.hasOwn(CAPS,capability??''))
  return HOLD('QL461_UNKNOWN_CAPABILITY_FAIL_CLOSED');
 if(!['1.0','1.1'].includes(peer))
  return HOLD('QL461_PEER_MAJOR_OR_SCHEMA_UNSUPPORTED');
 if(peer==='1.0'&&CAPS[capability]>0)
  return HOLD('QL461_V11_CAPABILITY_HELD_ON_V10_PEER');
 if(changeType==='BREAKING')return HOLD('QL461_BREAKING_CHANGE_NOT_PERMITTED_ON_V1');
 return {state:'COMPATIBLE_SOURCE_ONLY',negotiatedProtocol:peer,
  capability,featureAdditiveOnly:true,requiresLockstepRelease:false,
  unrelatedLocalOperationsContinue:true,peerDeployRequired:false,
  runtimeConnected:false};
}
const proofFields=['schema','sourceId','repository','sourceMainSha','targetAudience',
 'protocol','capability','action','tier','tenantId','workspaceId',
 'resourceTenantId','resourceWorkspaceId','subjectId','tokenId','nonce',
 'issuedAt','expiresAt','purpose','personalData','privilegedScope',
 'rawSecretIncluded','directPeerDatabaseWrite','authorityTransfer',
 'tlsVerified','sourceSignedAt'];
const consentFields=['schema','sourceId','tenantId','workspaceId','subjectId',
 'purpose','capability','issuedAt','expiresAt','revoked','propagatedWithdrawal',
 'mayGrantCapability','personalDataIncluded'];
const delegationFields=['schema','sourceId','audience','tenantId','workspaceId',
 'subjectId','capability','action','issuedAt','expiresAt','subdelegation',
 'authorityTransfer','t5Allowed','consequentialWriteWithoutOwnerGate',
 'revoked','ownerReviewed'];
/** Review source proof, never perform network request. Local operations bypass peer
 * synchronization ONLY with independently owned app-local approval. */
export function evaluateQl461Authorization({
 matrixCert,request,sourcePin,ownerConsentPin,delegationPin,
 consent,delegation,peerAvailable=true,peerProtocol='1.0',
 nowMs,seenTokenIds,expectedMainShas,localPermit=false
}={}){
 if(request?.kind==='LOCAL'){
  if(request.localAppId&&SOURCE_IDS.includes(request.localAppId)&&
   localPermit===true&&request.localTenantApproved===true&&
   request.localRoleApproved===true)
   return {...HOLD('APP_LOCAL_POLICY_CONTINUES_INDEPENDENTLY','LOCAL'),
    state:'APP_LOCAL_GATE_ONLY',localOperationsRemainAvailable:true};
  return HOLD('QL461_LOCAL_OWNER_POLICY_NOT_PROVEN','LOCAL');
 }
 if(!matrixCert||matrixCert.state!=='SIGNED_MATRIX_REVIEW_ONLY'||
  !matrixCert.matrix||hash(matrixCert.matrix)!==matrixCert.digest)
  return HOLD('QL461_SIGNED_MATRIX_REQUIRED');
 if(!exact(request,['kind','proof'])||request.kind!=='CROSS_APP'||
  !exact(request.proof,['payload','signature']))
  return HOLD('QL461_CROSS_APP_SIGNATURE_REQUIRED');
 const p=request.proof.payload;
 if(!exact(p,proofFields)||p.schema!=='rosevear.ql461.workload-action.v1'||!SOURCE_IDS.includes(p.sourceId)||
  !MASTER_IDS.includes(p.targetAudience)||
  REPO_BY_SOURCE[p.sourceId]!==p.repository||
  !SHA.test(expectedMainShas?.[p.sourceId]??'')||
  p.sourceMainSha!==expectedMainShas[p.sourceId]||
  !verifySigned(request.proof,sourcePin))
  return HOLD('QL461_SIGNED_SOURCE_IDENTITY_OR_SHA_DENIED');
 if(p.action!=='READ'||p.tier==='T5_ORIGINAL_HOST_OWNER_CEREMONY'||
  !ACCESS_TIERS.includes(p.tier)||p.privilegedScope!==false||
  p.rawSecretIncluded!==false||p.directPeerDatabaseWrite!==false||
  p.authorityTransfer!==false||p.tlsVerified!==true||
  !ID.test(p.tokenId??'')||!ID.test(p.nonce??'')||
  !ID.test(p.subjectId??''))
  return HOLD('QL461_PRIVILEGED_T5_OR_UNSCOPED_ACTION_DENIED');
 const compatibility=negotiateQl461Protocol({
  peer:peerProtocol,peerAvailable,capability:p.capability});
 if(compatibility.state!=='COMPATIBLE_SOURCE_ONLY')
  return {...HOLD(compatibility.reason),negotiatedProtocol:null};
 if(p.protocol!==compatibility.negotiatedProtocol)
  return HOLD('QL461_SIGNATURE_PROTOCOL_DOWNGRADE_DENIED');
 if(!DIRECTIONAL_EDGES.includes(p.sourceId+'>'+p.targetAudience))
  return HOLD('QL461_DIRECTIONAL_MASTER_AUDIENCE_DENIED');
 const rule=matrixCert.matrix.policies.find(x=>x.appId===p.sourceId&&x.tier===p.tier);
 if(!rule||!rule.allowedActions.includes('READ')||!rule.denyByDefault)
  return HOLD('QL461_RBAC_POLICY_DENIED');
 if(!Number.isSafeInteger(nowMs)||!fresh(p.issuedAt,nowMs,300000)||
  !fresh(p.sourceSignedAt,nowMs,300000)||
  !Number.isFinite(at(p.expiresAt))||nowMs>=at(p.expiresAt)||
  at(p.expiresAt)-at(p.issuedAt)>300000||
  at(p.sourceSignedAt)<at(p.issuedAt)||
  at(p.sourceSignedAt)>=at(p.expiresAt)||
  typeof seenTokenIds?.has!=='function'||seenTokenIds.has(p.tokenId))
  return HOLD('QL461_EXPIRY_OR_REPLAY_DENIED');
 if(typeof p.tenantId!=='string'||!ID.test(p.tenantId)||
  !ID.test(p.resourceTenantId??'')||p.tenantId!==p.resourceTenantId||
  !ID.test(p.workspaceId??'')||p.workspaceId!==p.resourceWorkspaceId||
  !ID.test(p.purpose??'')||p.purpose==='NONE')
  return HOLD('QL461_CROSS_TENANT_OR_WORKSPACE_DENIED');
 if(p.personalData){
  const c=consent?.payload;
  if(!exact(c,consentFields)||!verifySigned(consent,ownerConsentPin)||
   c.schema!=='rosevear.ql461.purpose-consent.v1'||
   c.sourceId!==p.sourceId||c.tenantId!==p.tenantId||
   c.workspaceId!==p.workspaceId||c.subjectId!==p.subjectId||
   c.capability!==p.capability||c.purpose!==p.purpose||
   !fresh(c.issuedAt,nowMs,86400000)||!Number.isFinite(at(c.expiresAt))||
   at(c.expiresAt)<=nowMs||c.revoked!==false||
   c.propagatedWithdrawal!==false||c.mayGrantCapability!==false||
   c.personalDataIncluded!==false)
   return HOLD('QL461_CONSENT_PURPOSE_OR_REVOCATION_DENIED');
 }else if(consent!==undefined&&consent!==null){
  // Consent receipts cannot be repurposed into privilege grants.
  if(consent.payload?.mayGrantCapability!==false)
   return HOLD('QL461_CONSENT_MAY_NOT_GRANT_CAPABILITY');
 }
 if(delegation!==undefined&&delegation!==null){
  const d=delegation.payload;
  if(!exact(d,delegationFields)||!verifySigned(delegation,delegationPin)||
   d.schema!=='rosevear.ql461.delegation.v1'||
   d.sourceId!==p.sourceId||d.audience!==p.targetAudience||
   d.tenantId!==p.tenantId||d.workspaceId!==p.workspaceId||
   d.subjectId!==p.subjectId||d.capability!==p.capability||
   d.action!==p.action||p.tier==='T0_PUBLIC_READ'||
   !fresh(d.issuedAt,nowMs,86400000)||
   !Number.isFinite(at(d.expiresAt))||at(d.expiresAt)<=nowMs||
   at(d.expiresAt)-at(d.issuedAt)>86400000||
   d.subdelegation!==false||d.authorityTransfer!==false||
   d.t5Allowed!==false||d.consequentialWriteWithoutOwnerGate!==false||
   d.revoked!==false||d.ownerReviewed!==true)
   return HOLD('QL461_UNSCOPED_DELEGATION_OR_OWNER_GATE_DENIED');
 }
 return REVIEW({sourceId:p.sourceId,targetAudience:p.targetAudience,
  capability:p.capability,tenantId:p.tenantId,workspaceId:p.workspaceId,
  protocol:compatibility.negotiatedProtocol,
  policyDigest:matrixCert.digest,sourceProofDigest:hash(p),
  ownerConsentVerified:p.personalData,
  independentDeployAllowed:true,onlyRequestedCrossAppFeatureReviewed:true,
  tokenId:p.tokenId,nonAuthorizing:true});
}
