import {createHash,createPublicKey,verify,timingSafeEqual} from 'node:crypto';
import {isOpaqueHandle} from '../master-custody/rotation.mjs';

/**
 * QL-466 PRIVATE readiness assessor. Never calls KMS, vault, HTTP, Windows SCM,
 * cert store, DB, Tailscale, receiver, or service controller. Actual provider,
 * signed issuer and independent host observations must originate out of band.
 * No live receiver endpoint exists in Comms at this build.
 */
export const QL466_SCHEMA='rosevear.comms.ql466.vault-boot-assurance.v1';
export const QL466_PEER_SINK='/internal/rosevear/master/events/read-only/v1';
export const QL466_SOURCE_STATUS=Object.freeze({
 sinkRoute:'NOT_IMPLEMENTED',httpMethod:'POST',sinkPath:QL466_PEER_SINK,
 workerServiceName:'Rosevear-CommsHub',workerInstalled:'UNVERIFIED',
 workerActivationProtocol:'NOT_IMPLEMENTED',
 privateReceiver:'QL340C_SUPERVISED_TEST_ONLY_OFF_UNKNOWN',
 peerMtls:'UNVERIFIED',pinnedIssuer:'UNVERIFIED',durableAck:'UNVERIFIED',
 ownerAudit:'UNVERIFIED',autostartAuthorized:false,
 restartOrRebootAuthorized:false,credentialsChanged:false,physicalReceiverOffVerified:false
});
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const HEX=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const purposes=['PRIVACY_ENCRYPT','PRIVACY_AUDIT','PEER_SIGN'];
const allowedProviders=['SUPABASE_VAULT','MANAGED_KMS'];
const expectedKeys=(obj,keys)=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj)&&
 Object.keys(obj).length===keys.length&&keys.every(k=>Object.hasOwn(obj,k));
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const time=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s?Date.parse(s):NaN;
const recent=(v,now)=>Number.isSafeInteger(now)&&Number.isFinite(time(v))&&time(v)<=now&&now-time(v)<=300000;
const hold=reason=>Object.freeze({state:'HOLD',reason,live:false,receiverActivated:false,
 secretsRead:false,secretsRotated:false,workerStarted:false,credentialsChanged:false,
 sourceWrites:0,peerSends:0,ackSent:false,ownerApprovalGranted:false,hostRebootAuthorized:false});
const strictSignature=(packet,pin,keys)=>{
 try{
  if(!expectedKeys(packet,['payload','signature'])||!expectedKeys(packet.payload,keys)||
   typeof pin!=='string'||pin.length>512||
   typeof packet.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(packet.signature))return false;
  const der=Buffer.from(pin,'base64');
  if(der.toString('base64')!==pin)return false;
  const pub=createPublicKey({key:der,format:'der',type:'spki'});
  return pub.asymmetricKeyType==='ed25519'&&verify(null,
   Buffer.from(JSON.stringify(packet.payload)),pub,Buffer.from(packet.signature,'base64'));
 }catch{return false;}
};
const inventoryFields=['schema','scopeId','purpose','provider','opaqueRef','keyVersion',
 'state','providerReceiptDigest','sourceCustodyDigest','issuedAt','notBefore',
 'expiresAt','rootKeyAccessible','clientExposed','authorityTransfer'];
const rotationFields=['schema','planId','scopeId','purpose','provider','currentOpaqueRef',
 'candidateOpaqueRef','currentVersion','candidateVersion','sourceMainSha',
 'priorCertLeafDigest','candidateCertLeafDigest','overlapMinutes','candidateNotBefore',
 'candidateExpiresAt','requestedAt','approvalExpiresAt','automaticActivation',
 'authorityTransfer','receiverActivationRequested'];
const bootFields=['schema','originalHost','serviceName','serviceImageDigest','startMode',
 'serviceState','bootId','observedAt','sourceMainSha','obsoleteTaskDisabled',
 'privateReceiverState','privateReceiverActivationRequested','configChanged'];
const independentFields=['schema','originalHost','bootId','bootDigest','auditorId',
 'auditDigest','observedAt','sourceMainSha','ownerAuthObserved',
 'serviceAuthenticityIndependentlyConfirmed','authorityTransfer'];
const same=(l,r)=>typeof l==='string'&&typeof r==='string'&&HEX.test(l)&&HEX.test(r)&&
 timingSafeEqual(Buffer.from(l,'hex'),Buffer.from(r,'hex'));

/**
 * Accepts only a genuinely provider-signed inventory *claim* and a separately
 * pinned Ed25519 public key. It does not access or activate the provider.
 */
export function inspectQl466VaultAttestation({packet,providerPin,nowMs}={}){
 if(!strictSignature(packet,providerPin,inventoryFields))
  return hold('QL466_PROVIDER_SIGNED_INVENTORY_REQUIRED');
 const m=packet.payload;
 if(m.schema!=='rosevear.comms.ql466.vault-inventory.v1'||
  m.scopeId!=='rosevear-comms-hub'||!purposes.includes(m.purpose)||
  !allowedProviders.includes(m.provider)||!isOpaqueHandle(m)||
  !Number.isSafeInteger(m.keyVersion)||m.keyVersion<1||m.keyVersion>100000||
  m.state!=='ENROLLED_PROVIDER_READ_ONLY'||
  !HEX.test(m.providerReceiptDigest??'')||!HEX.test(m.sourceCustodyDigest??'')||
  !recent(m.issuedAt,nowMs)||!Number.isFinite(time(m.notBefore))||
  !Number.isFinite(time(m.expiresAt))||time(m.notBefore)>nowMs||
  time(m.expiresAt)<=nowMs+3600000||
  m.rootKeyAccessible!==false||m.clientExposed!==false||m.authorityTransfer!==false)
  return hold('QL466_VAULT_SCOPE_EXPIRY_OR_SECRET_BOUNDARY_DENIED');
 return {...hold('QL466_VAULT_INVENTORY_CLAIM_ONLY_NOT_MANAGED_KEY_PROOF'),
  state:'VAULT_INVENTORY_REVIEW_HELD',scopeId:m.scopeId,purpose:m.purpose,
  provider:m.provider,version:m.keyVersion,inventoryDigest:sha(m),
  expiry:m.expiresAt,opaqueRef:m.opaqueRef};
}

/** Both original authorities sign the SAME complete plan with distinct pins. */
export function reviewQl466DualIssuerRotation({inventory,plan,ownerPin,custodianPin,
 nowMs,expectedMainSha}={}){
 if(inventory?.state!=='VAULT_INVENTORY_REVIEW_HELD')return hold('QL466_SOURCE_VAULT_ATTESTATION_REQUIRED');
 if(typeof ownerPin!=='string'||ownerPin===custodianPin)return hold('QL466_INDEPENDENT_PINS_REQUIRED');
 if(!strictSignature(plan?.owner,ownerPin,rotationFields)||
  !strictSignature(plan?.custodian,custodianPin,rotationFields))
  return hold('QL466_BOTH_ORIGINAL_SIGNATURES_REQUIRED');
 const p=plan.owner.payload,q=plan.custodian.payload;
 if(!same(sha(p),sha(q)))return hold('QL466_OWNER_CUSTODIAN_DECISIONS_DIFFER');
 if(p.schema!=='rosevear.comms.ql466.key-rotation-plan.v1'||!ID.test(p.planId??'')||
  p.scopeId!==inventory.scopeId||p.purpose!==inventory.purpose||
  p.provider!==inventory.provider||p.currentOpaqueRef!==inventory.opaqueRef||
  !isOpaqueHandle({provider:p.provider,opaqueRef:p.candidateOpaqueRef})||
  p.candidateOpaqueRef===p.currentOpaqueRef||p.currentVersion!==inventory.version||
  p.candidateVersion!==p.currentVersion+1||!SHA.test(expectedMainSha??'')||
  p.sourceMainSha!==expectedMainSha||
  !HEX.test(p.priorCertLeafDigest??'')||!HEX.test(p.candidateCertLeafDigest??'')||
  p.priorCertLeafDigest===p.candidateCertLeafDigest||
  !Number.isInteger(p.overlapMinutes)||p.overlapMinutes<60||p.overlapMinutes>1440||
  !Number.isFinite(time(p.candidateNotBefore))||
  !Number.isFinite(time(p.candidateExpiresAt))||
  time(p.candidateNotBefore)>nowMs||time(p.candidateExpiresAt)<=nowMs+p.overlapMinutes*60000||
  time(inventory.expiry)<=nowMs+p.overlapMinutes*60000||
  !recent(p.requestedAt,nowMs)||!Number.isFinite(time(p.approvalExpiresAt))||
  time(p.approvalExpiresAt)<=nowMs||
  time(p.approvalExpiresAt)-time(p.requestedAt)>3600000||
  p.automaticActivation!==false||p.authorityTransfer!==false||
  p.receiverActivationRequested!==false)
  return hold('QL466_ROTATION_OVERLAP_PIN_CUSTODY_OR_EXPIRY_DENIED');
 return {...hold('QL466_SIGNED_PLAN_ONLY_NO_CERT_OR_KEY_CUTOVER'),
  state:'DUAL_ISSUER_ROTATION_PLAN_HELD',planDigest:sha(p),scopeId:p.scopeId,
  purpose:p.purpose,currentVersion:p.currentVersion,candidateVersion:p.candidateVersion,
  overlapMinutes:p.overlapMinutes,certRotationApproved:false,
  externalPeerVerified:false,oldKeyRetired:false};
}

/** Independently signed original-host worker inventory is still NOT boot proof. */
export function reviewQl466SignedWorkerInventory({boot,hostPin,auditor,auditorPin,
 nowMs,expectedMainSha}={}){
 if(typeof hostPin!=='string'||hostPin===auditorPin)
  return hold('QL466_DISTINCT_HOST_AND_AUDITOR_KEYS_REQUIRED');
 if(!strictSignature(boot,hostPin,bootFields)||
  !strictSignature(auditor,auditorPin,independentFields))
  return hold('QL466_SIGNED_HOST_AND_INDEPENDENT_AUDIT_REQUIRED');
 const b=boot.payload,a=auditor.payload;
 if(b.schema!=='rosevear.comms.ql466.host-worker-observation.v1'||
  a.schema!=='rosevear.comms.ql466.owner-audit.v1'||
  b.originalHost!=='DESKTOP-AE894KC'||a.originalHost!==b.originalHost||
  b.serviceName!=='Rosevear-CommsHub'||!HEX.test(b.serviceImageDigest??'')||
  b.startMode!=='AUTOMATIC'||b.serviceState!=='RUNNING'||
  !ID.test(b.bootId??'')||!recent(b.observedAt,nowMs)||
  !recent(a.observedAt,nowMs)||a.bootId!==b.bootId||
  !same(a.bootDigest,sha(b))||!ID.test(a.auditorId??'')||
  !HEX.test(a.auditDigest??'')||a.sourceMainSha!==b.sourceMainSha||
  !SHA.test(expectedMainSha??'')||b.sourceMainSha!==expectedMainSha||
  b.obsoleteTaskDisabled!==true||b.privateReceiverState!=='UNKNOWN_OR_OFF_NOT_VERIFIED'||
  b.privateReceiverActivationRequested!==false||b.configChanged!==false||
  a.ownerAuthObserved!==true||
  a.serviceAuthenticityIndependentlyConfirmed!==true||
  a.authorityTransfer!==false)
  return hold('QL466_BOOT_WORKER_AUDIT_OR_PRIVATE_RECEIVER_BOUNDARY_DENIED');
 return {...hold('QL466_OBSERVED_WORKER_DECLARATION_NOT_PHYSICAL_BOOT_OR_LIVE_PEER'),
  state:'SIGNED_WORKER_OBSERVATION_REVIEW_HELD',bootDigest:sha(b),
  auditorDigest:sha(a),workerServiceName:b.serviceName,
  privateReceiver:'UNKNOWN_OFF_UNWITNESSED',
  signedBootBeforeRebootAcceptance:false};
}

/**
 * Requires actual deployed sink + mTLS + issuer pins + durable receiver ACK
 * + independent owner audit. The exact Comms route is ABSENT at QL-466:
 * no caller, fixture or signed packet may turn this function LIVE.
 */
export function assessQl466GoNoGo({inventory,rotation,worker,peerClaim}={}){
 if(QL466_SOURCE_STATUS.sinkRoute==='NOT_IMPLEMENTED')
  return {...hold('QL466_PEER_SINK_ROUTE_NOT_IMPLEMENTED'),
   sinkRoute:'NOT_IMPLEMENTED',workerInstall:'UNVERIFIED',
   peerMtlsVerified:false,pinnedEd25519IssuerVerified:false,
   durableAckVerified:false,independentOwnerAuditVerified:false,
   signedWorkerReceiptAvailable:worker?.state==='SIGNED_WORKER_OBSERVATION_REVIEW_HELD',
   vaultInventoryAvailable:inventory?.state==='VAULT_INVENTORY_REVIEW_HELD',
   rotationPlanAvailable:rotation?.state==='DUAL_ISSUER_ROTATION_PLAN_HELD',
   peerClaimAccepted:false};
 return hold('QL466_LIVE_ACTIVATION_NOT_SUPPORTED');
}
