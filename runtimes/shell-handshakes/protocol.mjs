/** QL-335 Ed25519 shell-level TEST protocol, private Node runtime ONLY.
 * An externally attested broker signs the challenge; the source signs the
 * receipt with its OWN KMS handle. No browser, stored secret or tenant fallback.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';

export const SHELL_CONTRACT='rosevear.shell.nonproduction.v1';
export const SHELL_GET_PATHS=Object.freeze([
  '/api/integration/v1/shell/health','/api/integration/v1/shell/capabilities'
]);
export const SHELLS=Object.freeze({
  yw:{sourceAppId:'yard-workers',sourceIssuer:'yard-workers'},
  icamp:{sourceAppId:'icamp',sourceIssuer:'icamp'}
});
const HEX=/^[a-f0-9]{64}$/;
const NONCE=/^[A-Za-z0-9_-]{43}$/;
const scopeFor=path=>path?.endsWith('/capabilities')?'read_shell_capabilities':'read_shell_health';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ALLOWED=new Set(['status','shell_id','source_app_id','contract','environment','method','path',
  'issuer','audience','scope','nonce','issued_at','expires_at','manifest_sha256','owner_receipt_sha256',
  'source_owner_receipt_sha256','workload_id']);
export const digest=x=>createHash('sha256').update(x).digest('hex');
const exact=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).length===keys.size&&Object.keys(obj).every(k=>keys.has(k));
const bytes=obj=>Buffer.from(canonicalize(obj),'utf8');
const verdict=(status,extra={})=>Object.freeze({status,authenticated:false,connected:false,
  privateReads:0,childReads:0,writes:0,communicationsSent:0,...extra});
const validTime=(c,now)=>Number.isSafeInteger(now)&&Number.isSafeInteger(c?.issued_at)&&
  Number.isSafeInteger(c?.expires_at)&&c.expires_at>c.issued_at&&
  c.expires_at-c.issued_at<=120_000&&c.issued_at<=now+15_000&&c.expires_at>now;
const isSource=(c,s)=>Object.hasOwn(SHELLS,s)&&c?.shell_id===s&&
  c.source_app_id===SHELLS[s].sourceAppId&&c.audience===SHELLS[s].sourceIssuer;
const trustReady=t=>t?.independentSourceSigner===true&&t.ownerTestAuthorized===true&&
  t.sourceOwnerTestAuthorized===true&&t.workloadVerified===true&&
  t.keyHandleActive===true&&t.manifestVerified===true&&t.nonproductionOriginPinned===true&&
  HEX.test(t?.ownerReceipt??'')&&HEX.test(t?.sourceReceipt??'')&&
  t.ownerReceipt!==t.sourceReceipt&&HEX.test(t?.manifestSha256??'')&&UUID.test(t?.workloadId??'')&&
  /^[a-zA-Z0-9_-]{12,100}$/.test(t?.brokerKeyId??'')&&
  /^[a-zA-Z0-9_-]{12,100}$/.test(t?.sourceKeyId??'');
const validChallenge=c=>exact(c,ALLOWED)&&Object.hasOwn(SHELLS,c.shell_id)&&
  isSource(c,c.shell_id)&&c.contract===SHELL_CONTRACT&&c.status==='SHELL_TEST_CHALLENGE'&&
  c.environment==='nonproduction'&&c.method==='GET'&&SHELL_GET_PATHS.includes(c.path)&&
  c.issuer==='ai-data-platform'&&c.scope===scopeFor(c.path)&&NONCE.test(c.nonce??'')&&
  HEX.test(c.manifest_sha256??'')&&HEX.test(c.owner_receipt_sha256??'')&&
  HEX.test(c.source_owner_receipt_sha256??'')&&c.owner_receipt_sha256!==c.source_owner_receipt_sha256&&
  UUID.test(c.workload_id??'')&&Number.isSafeInteger(c.issued_at)&&
  Number.isSafeInteger(c.expires_at)&&c.expires_at>c.issued_at&&
  c.expires_at-c.issued_at<=120_000;

/** Build a canonical challenge without signing it. No KMS = no sendable request. */
export function makeShellChallenge({shellId,path,nonce,nowMs,trust}={}){
  if(!Object.hasOwn(SHELLS,shellId)||!SHELL_GET_PATHS.includes(path)||
    !NONCE.test(nonce??'')||!Number.isSafeInteger(nowMs)||!trustReady(trust))
    return verdict('HOLD_MISSING_SIGNED_TEST_AUTHORITY');
  const challenge={status:'SHELL_TEST_CHALLENGE',contract:SHELL_CONTRACT,
    shell_id:shellId,source_app_id:SHELLS[shellId].sourceAppId,
    environment:'nonproduction',method:'GET',path,issuer:'ai-data-platform',
    audience:SHELLS[shellId].sourceIssuer,scope:scopeFor(path),nonce,
    issued_at:nowMs,expires_at:nowMs+90_000,
    manifest_sha256:trust.manifestSha256,owner_receipt_sha256:trust.ownerReceipt,
    source_owner_receipt_sha256:trust.sourceReceipt,workload_id:trust.workloadId};
  return verdict('CHALLENGE_READY_PRIVATE_SIGNING_REQUIRED',{challenge,
    challengeSha256:digest(bytes(challenge))});
}

/** Signature must be delivered by the independently authorised broker KMS. */
export async function signShellChallenge(challenge,signWithBrokerKms){
  if(!validChallenge(challenge)||typeof signWithBrokerKms!=='function')
    return verdict('HOLD_NO_VERIFIED_BROKER_SIGNER');
  try {
    const signed=await signWithBrokerKms(bytes(challenge));
    if(signed?.attested!==true||typeof signed.keyId!=='string'||
      !/^[a-zA-Z0-9_-]{12,100}$/.test(signed.keyId)||
      !/^[A-Za-z0-9_-]{86}$/.test(signed.signature??''))return verdict('HOLD_UNATTESTED_BROKER_SIGNATURE');
    return verdict('SIGNED_SHELL_CHALLENGE_PREPARED',{envelope:{challenge,
      signature:signed.signature,keyId:signed.keyId}});
  }catch{return verdict('HOLD_BROKER_KMS_UNAVAILABLE');}
}

/** Source-side verification is independent: no signed response without durable
 * nonce claim, original owner/source consent and source-KMS signing authority.
 */
export async function acceptAtSource(envelope,{expectedShell,nowMs,trust,brokerPublicKeyPem,
  claimNonce,signWithSourceKms}={}){
  const c=envelope?.challenge;
  if(!Object.hasOwn(SHELLS,expectedShell)||!validChallenge(c)||
    !isSource(c,expectedShell)||c.contract!==SHELL_CONTRACT||c.status!=='SHELL_TEST_CHALLENGE'||
    c.environment!=='nonproduction'||c.method!=='GET'||!SHELL_GET_PATHS.includes(c.path)||
    c.issuer!=='ai-data-platform'||c.scope!==scopeFor(c.path)||!NONCE.test(c.nonce??'')||
    !validTime(c,nowMs)||!trustReady(trust)||
    c.manifest_sha256!==trust.manifestSha256||
    c.owner_receipt_sha256!==trust.ownerReceipt||
    c.source_owner_receipt_sha256!==trust.sourceReceipt||
    c.workload_id!==trust.workloadId)
    return verdict('DENY_SHELL_IDENTITY_SCOPE_OR_AUTHORITY');
  if(typeof brokerPublicKeyPem!=='string'||typeof claimNonce!=='function'||
    typeof signWithSourceKms!=='function'||!/^[-_A-Za-z0-9]{86}$/.test(envelope.signature??'')||
    envelope.keyId!==trust.brokerKeyId)
    return verdict('HOLD_NO_ORIGINAL_BROKER_KEY_OR_NONCE_STORE');
  try {
    const key=createPublicKey(brokerPublicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      !verify(null,bytes(c),key,Buffer.from(envelope.signature,'base64url')))
      return verdict('DENY_INVALID_BROKER_SIGNATURE');
    if(await claimNonce({shellId:expectedShell,nonceSha256:digest(c.nonce),
      challengeSha256:digest(bytes(c)),expiresAt:c.expires_at})!==true)
      return verdict('DENY_REPLAY_OR_NONCE_STORE_UNAVAILABLE');
    const receipt={contract:SHELL_CONTRACT,shell_id:expectedShell,
      source_app_id:SHELLS[expectedShell].sourceAppId,environment:'nonproduction',
      status:'AUTHENTICATED_READONLY_TEST_HELD',capabilities_enabled:false,
      tenant_data_included:false,source_issuer:SHELLS[expectedShell].sourceIssuer,
      challenge_sha256:digest(bytes(c)),nonce_sha256:digest(c.nonce),
      answered_at:nowMs,expires_at:c.expires_at};
    const sig=await signWithSourceKms(bytes(receipt));
    if(sig?.attested!==true||!/^[-_A-Za-z0-9]{86}$/.test(sig.signature??'')||
      !/^[a-zA-Z0-9_-]{12,100}$/.test(sig.keyId??''))
      return verdict('HOLD_UNATTESTED_SOURCE_KMS');
    return verdict('SOURCE_SIGNED_READONLY_RECEIPT',{envelope:{receipt,
      signature:sig.signature,keyId:sig.keyId}});
  }catch{return verdict('HOLD_SOURCE_VERIFICATION_FAILURE');}
}

/** Broker verifies the independently pinned source response and its nonce;
 * even verified TEST receipts do NOT authorize child data or production sends.
 */
export async function verifyAtMaster(challenge,sourceEnvelope,{sourcePublicKeyPem,
  nowMs,claimReceiptNonce,trust}={}){
  const r=sourceEnvelope?.receipt;
  if(!validChallenge(challenge)||
    !trustReady(trust)||!validTime(challenge,nowMs)||
    !r||Object.keys(r).sort().join('|')!==[
      'contract','shell_id','source_app_id','environment','status','capabilities_enabled',
      'tenant_data_included','source_issuer','challenge_sha256','nonce_sha256','answered_at',
      'expires_at'].sort().join('|')||
    r.contract!==SHELL_CONTRACT||r.shell_id!==challenge.shell_id||
    r.source_app_id!==challenge.source_app_id||r.source_issuer!==SHELLS[challenge.shell_id].sourceIssuer||
    r.environment!=='nonproduction'||r.status!=='AUTHENTICATED_READONLY_TEST_HELD'||
    r.capabilities_enabled!==false||r.tenant_data_included!==false||
    r.challenge_sha256!==digest(bytes(challenge))||r.nonce_sha256!==digest(challenge.nonce)||
    r.expires_at!==challenge.expires_at||!Number.isSafeInteger(r.answered_at)||
    r.answered_at<challenge.issued_at||r.answered_at>nowMs||
    typeof claimReceiptNonce!=='function'||typeof sourcePublicKeyPem!=='string'||
    !/^[-_A-Za-z0-9]{86}$/.test(sourceEnvelope.signature??'')||
    sourceEnvelope.keyId!==trust.sourceKeyId)
    return verdict('DENY_SOURCE_RECEIPT_SCOPE_OR_REPLAY');
  try {
    const key=createPublicKey(sourcePublicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      !verify(null,bytes(r),key,Buffer.from(sourceEnvelope.signature,'base64url')))
      return verdict('DENY_INVALID_SOURCE_SIGNATURE');
    if(await claimReceiptNonce({shellId:challenge.shell_id,nonceSha256:r.nonce_sha256,
      receiptSha256:digest(bytes(r)),expiresAt:r.expires_at})!==true)
      return verdict('DENY_SOURCE_RECEIPT_REPLAY');
    return verdict('SIGNED_NONPRODUCTION_SHELL_TEST_RECONCILED',{
      authenticated:true,connected:false,privateReads:1,
      sourceReceiptSha256:digest(bytes(r)),acceptedAt:nowMs});
  }catch{return verdict('HOLD_SOURCE_RECEIPT_VERIFICATION_FAILURE');}
}
