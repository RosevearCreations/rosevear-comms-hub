/**
 * QL-245 offline public-metadata verifier.
 * Six independently pinned source signatures + separate assessor signature bind
 * to a current QL-244 held result. Matching signatures do not prove real-world
 * key ownership, external network tests, an owner approval or connectivity.
 */
import { createHash, createPublicKey, timingSafeEqual, verify } from 'node:crypto';
import { QL244_RELEASE, QL244_SYSTEMS } from './ql244-witnessed-handshake-review.mjs';
import { ql241PublicKeyFingerprint } from './ql241-external-gateway-retrieval.mjs';

export const QL245_RELEASE = 'ql245-six-app-evidence-return-exception-triage-read-only-preconditions-held-v1';
export const QL245_SYSTEMS = QL244_SYSTEMS;
export const QL245_NEGATIVES = Object.freeze([
  'nonce_replay_denied', 'stale_request_denied', 'cross_business_denied',
  'cross_tenant_denied', 'revoked_key_denied', 'write_denied', 'dispatch_denied'
]);
export const QL245_SOURCE_KEYS = Object.freeze([
  'schema_version', 'source_system', 'signer_key_id', 'business_id', 'tenant_id',
  'environment', 'source_revision', 'ci_run_url', 'key_id', 'registry_receipt_id',
  'health_receipt_id', 'capabilities_receipt_id', 'gateway_audit_id',
  'allowed_paths', 'scope', 'negative_tests', 'source_receipt_id',
  'audit_storage_review', 'owner_authorization', 'connection_state',
  'issued_at', 'expires_at'
]);
export const QL245_ASSESSOR_KEYS = Object.freeze([
  'schema_version', 'issuer', 'kind', 'ql244_assessor_receipt_id',
  'ql244_source_revision', 'six_source_payloads_sha256', 'review_receipt_id',
  'business_id', 'tenant_id', 'environment', 'real_world_witness_confirmed',
  'owner_pilot_authorized', 'rollback_verified', 'issued_at', 'expires_at'
]);
export const QL245_SUMMARY_KEYS = Object.freeze([
  'release', 'status', 'company', 'assessorSignatureChecked',
  'sourceSignatureChecks', 'realWorldWitnessConfirmed',
  'outOfBandKeyOwnershipIndependentlyConfirmed',
  'externalReadIndependentlyConfirmed', 'credentialExchangeIndependentlyConfirmed',
  'auditStorageIndependentlyConfirmed', 'ownerApprovalIndependentlyConfirmed',
  'ownerPilotAuthorized', 'connectionState', 'livePilotRelease',
  'writes', 'calls', 'sms', 'dispatch', 'realPilotHolds',
  'ql244AssessorReceiptId', 'ql244SourceRevision', 'reviewReceiptId',
  'assessorPublicKeyFingerprintSha256', 'sourceMetadata'
]);
const SOURCE_FIELDS = Object.freeze(['system', 'businessId', 'tenantId', 'sourceRevision',
  'ciRunUrl', 'signerPinSha256', 'sourceReceiptId', 'registryReceiptId',
  'gatewayAuditId', 'healthReceiptId', 'capabilitiesReceiptId']);
const ENVELOPE = ['payload', 'signature'];
const PACKET_KEYS = ['ql244Summary', 'returns', 'assessor'];
const PINS_KEYS = ['sources', 'assessor'];
const SOURCE_ENTRY_KEYS = ['system', 'publicKeyPem', 'envelope'];
const TRUSTED_ROW_KEYS = ['system', 'publicKeyFingerprintSha256', 'businessId', 'tenantId'];
const EXPECTED_PATHS = Object.freeze(['/api/integration/v1/health', '/api/integration/v1/capabilities']);
const EXPECTED_SCOPE = Object.freeze(['read_health', 'read_capabilities']);
const HEX40 = /^[a-f0-9]{40}$/; const HEX64 = /^[a-f0-9]{64}$/;
const ID = /^np-[a-z0-9-]{6,70}$/;
const SIG = /^[A-Za-z0-9_-]{86}$/;
const exact = (x, keys) => !!x && typeof x === 'object' && !Array.isArray(x) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(x)) &&
  Object.keys(x).length === keys.length && Object.keys(x).every(k => keys.includes(k));
const compare = (a,b) => typeof a === 'string' && typeof b === 'string' && HEX64.test(a) &&
  HEX64.test(b) && timingSafeEqual(Buffer.from(a, 'hex'),Buffer.from(b, 'hex'));
const fail = (status, reason) => Object.freeze({
  release: QL245_RELEASE, status, reason, company: 'devilndove',
  assessorSignatureChecked:false, sourceSignatureChecks:0, realWorldWitnessConfirmed:false,
  outOfBandKeyOwnershipIndependentlyConfirmed:false,
  externalReadIndependentlyConfirmed:false, credentialExchangeIndependentlyConfirmed:false,
  auditStorageIndependentlyConfirmed:false, ownerApprovalIndependentlyConfirmed:false,
  ownerPilotAuthorized:false, connectionState:'DISCONNECTED',livePilotRelease:false,
  writes:0,calls:0,sms:0,dispatch:0,realPilotHolds:12
});
const fresh = (at, expires, now) => Number.isSafeInteger(at) && Number.isSafeInteger(expires) &&
  at >= now - 300_000 && at <= now + 300_000 &&
  expires > now && expires-at <= 3_600_000;
const canonical = (keys, p) => {
  if (!exact(p,keys)) throw new TypeError('Unknown public signed metadata schema.');
  return Buffer.from(keys.map(k=>JSON.stringify([k,p[k]])).join('\n'),'utf8');
};
const payload = (envelope, keys, key) => {
  if (!exact(envelope,ENVELOPE) || !exact(envelope.payload,keys) ||
    typeof envelope.signature!=='string' || !SIG.test(envelope.signature)) return null;
  try {
    return verify(null,canonical(keys,envelope.payload),key,
      Buffer.from(envelope.signature,'base64url')) ? envelope.payload:null;
  } catch{return null;}
};
const keyForPin = (pem,pin) => {
  if (typeof pem!=='string' || pem.length>2048 || !HEX64.test(pin)) return null;
  try {
    const actual=ql241PublicKeyFingerprint(pem);
    return compare(actual,pin)?createPublicKey(pem):null;
  } catch {return null;}
};

export function ql245Canonical(kind,payloadValue){
  if(kind!=='source'&&kind!=='assessor')throw new TypeError('Unexpected signed metadata kind.');
  return canonical(kind==='source'?QL245_SOURCE_KEYS:QL245_ASSESSOR_KEYS,payloadValue);
}
export function ql245Digest(signedReturns){
  if(!Array.isArray(signedReturns)||signedReturns.length!==QL245_SYSTEMS.length)
    throw new TypeError('Exactly six signed source payloads required.');
  const bytes=signedReturns.map((p,i)=> {
    if (p.source_system!==QL245_SYSTEMS[i]) throw new TypeError('Six-app order mismatch.');
    return canonical(QL245_SOURCE_KEYS,p);
  });
  return createHash('sha256').update(Buffer.concat(bytes.flatMap(b=>[
    Buffer.from(String(b.length)+'\n'),b,Buffer.from('\n')
  ]))).digest('hex');
}
function validSummary(s) {
  const fields=[
    'release','status','reason','company','assessorSignatureChecked',
    'conditionalOwnerRequestSignatureChecked','witnessedSourceIndependentlyConfirmed',
    'credentialExchangeIndependentlyConfirmed','ownerIdentityIndependentlyConfirmed',
    'actualOwnerAuthorization','conditionalPilotDecision','actualConnection',
    'actualWrites','calls','sms','providerDispatch','realPilotHolds','gatewayAuditId',
    'identityAttestationId','assessorReceiptId','sourceRevision',
    'gatewayPublicKeyFingerprintSha256','ownerPublicKeyFingerprintSha256',
    'witnessPublicKeyFingerprintSha256','assessorPublicKeyFingerprintSha256','credentialMetadata'
  ];
  return exact(s,fields) && s.release===QL244_RELEASE &&
    s.status==='TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD' &&
    s.company==='devilndove' && s.assessorSignatureChecked===true &&
    s.conditionalOwnerRequestSignatureChecked===true &&
    s.witnessedSourceIndependentlyConfirmed===false &&
    s.credentialExchangeIndependentlyConfirmed===false &&
    s.ownerIdentityIndependentlyConfirmed===false &&
    s.actualOwnerAuthorization===false &&
    s.conditionalPilotDecision==='CONDITIONAL_REVIEW_REQUEST_ONLY_HELD' &&
    s.actualConnection==='DISCONNECTED' && s.actualWrites===0 &&
    s.calls===0 && s.sms===0 && s.providerDispatch===0 &&
    s.realPilotHolds===12 && HEX40.test(s.sourceRevision) &&
    ID.test(s.assessorReceiptId) && ID.test(s.gatewayAuditId) &&
    new Set(['gatewayPublicKeyFingerprintSha256','ownerPublicKeyFingerprintSha256',
      'witnessPublicKeyFingerprintSha256','assessorPublicKeyFingerprintSha256']
      .map(k=>s[k])).size===4 &&
    ['gatewayPublicKeyFingerprintSha256','ownerPublicKeyFingerprintSha256',
      'witnessPublicKeyFingerprintSha256','assessorPublicKeyFingerprintSha256']
      .every(k=>typeof s[k]==='string'&&HEX64.test(s[k])) &&
    Array.isArray(s.credentialMetadata) && s.credentialMetadata.length===6 &&
    QL245_SYSTEMS.every((system,i)=>{
      const row=s.credentialMetadata[i];
      return exact(row,['system','keyId','receiptId','review']) &&
        row.system===system && ID.test(row.keyId) && ID.test(row.receiptId) &&
        row.review==='OWNER_APPROVAL_NOT_GIVEN_HELD';
    });
}
function validSource(p,system,trust,summary,now) {
  if(p.schema_version!=='rosevear.integration.v1' ||
    p.source_system!==system || !ID.test(p.signer_key_id) ||
    p.business_id!==trust.businessId || p.tenant_id!==trust.tenantId ||
    p.environment!=='nonproduction' || !HEX40.test(p.source_revision) ||
    !/^https:\/\/github\.com\/RosevearCreations\/[a-zA-Z0-9_.-]+\/actions\/runs\/[0-9]+$/.test(p.ci_run_url) ||
    !ID.test(p.key_id) || !ID.test(p.registry_receipt_id) ||
    !ID.test(p.health_receipt_id) || !ID.test(p.capabilities_receipt_id) ||
    !ID.test(p.gateway_audit_id) ||
    !Array.isArray(p.allowed_paths) || JSON.stringify(p.allowed_paths)!==JSON.stringify(EXPECTED_PATHS) ||
    !Array.isArray(p.scope) || JSON.stringify(p.scope)!==JSON.stringify(EXPECTED_SCOPE) ||
    !exact(p.negative_tests,QL245_NEGATIVES) ||
    !QL245_NEGATIVES.every(k=>p.negative_tests[k]===true) ||
    !ID.test(p.source_receipt_id) ||
    p.audit_storage_review!=='INDEPENDENT_RESTART_PROOF_PENDING' ||
    p.owner_authorization!=='NOT_GIVEN' || p.connection_state!=='DISCONNECTED' ||
    !fresh(p.issued_at,p.expires_at,now)) return false;
  if(system==='devilndove' && (
    p.source_revision!==summary.sourceRevision ||
    p.gateway_audit_id!==summary.gatewayAuditId)) return false;
  return true;
}
/**
 * Caller supplies seven distinct public pins from separate trusted channels.
 * No network calls, secret handling, owner release or independent real-world
 * source verification is performed.
 */
export function inspectQl245Packet(packet, trusted, now=Date.now()) {
  if(!exact(packet,PACKET_KEYS)||!exact(trusted,PINS_KEYS)||
    !validSummary(packet.ql244Summary) ||
    !Array.isArray(packet.returns)||packet.returns.length!==6 ||
    !Array.isArray(trusted.sources)||trusted.sources.length!==6 ||
    !Number.isSafeInteger(now)||now<1) {
    return fail('DENIED_PACKET','Six public signed source responses and a held QL-244 summary required.');
  }
  const signed=[], metadata=[], pins=[], allIds=new Set();
  for(let i=0;i<6;i++){
    const row=packet.returns[i], trust=trusted.sources[i], system=QL245_SYSTEMS[i];
    if(!exact(row,SOURCE_ENTRY_KEYS)||row.system!==system||
      !exact(trust,TRUSTED_ROW_KEYS)||trust.system!==system||
      !HEX64.test(trust.publicKeyFingerprintSha256) ||
      typeof trust.businessId!=='string' || trust.businessId.length>72 ||
      !(trust.tenantId===null||typeof trust.tenantId==='string'&&ID.test(trust.tenantId)) ||
      (system==='yw'||system==='icamp' ? trust.tenantId===null : trust.tenantId!==null) ||
      trust.businessId!==(system==='ai-data-platform'?'devilndove':system)) {
      return fail('DENIED_TENANT_SCOPE','Independent app/business/tenant pin registry mismatch.');
    }
    const key=keyForPin(row.publicKeyPem,trust.publicKeyFingerprintSha256);
    const p=key&&payload(row.envelope,QL245_SOURCE_KEYS,key);
    if(!p) return fail('DENIED_SOURCE_SIGNATURE','Source signature or separately supplied signer pin invalid.');
    if(!validSource(p,system,trust,packet.ql244Summary,now)) {
      return fail('DENIED_SOURCE_EVIDENCE','Signed source claim is stale, foreign or exceeds the read-only HOLD scope.');
    }
    const ids=[p.signer_key_id,p.key_id,p.registry_receipt_id,p.source_receipt_id];
    if(ids.some(x=>allIds.has(x)))return fail('DENIED_DUPLICATES','Duplicated source signing or credential metadata identifiers.');
    ids.forEach(x=>allIds.add(x));
    if(pins.includes(trust.publicKeyFingerprintSha256) ||
      ['ownerPublicKeyFingerprintSha256','witnessPublicKeyFingerprintSha256',
        'assessorPublicKeyFingerprintSha256'].some(k=>
        trust.publicKeyFingerprintSha256===packet.ql244Summary[k]))
      return fail('DENIED_DUPLICATES','All six source signing keys must be distinct.');
    pins.push(trust.publicKeyFingerprintSha256);
    signed.push(p);
    metadata.push(Object.freeze({
      system,businessId:p.business_id,tenantId:p.tenant_id,sourceRevision:p.source_revision,
      ciRunUrl:p.ci_run_url,signerPinSha256:trust.publicKeyFingerprintSha256,
      sourceReceiptId:p.source_receipt_id,registryReceiptId:p.registry_receipt_id,
      gatewayAuditId:p.gateway_audit_id,healthReceiptId:p.health_receipt_id,
      capabilitiesReceiptId:p.capabilities_receipt_id
    }));
  }
  if(!exact(packet.assessor,['publicKeyPem','envelope']) ||
    typeof trusted.assessor!=='string'||!HEX64.test(trusted.assessor)||
    pins.includes(trusted.assessor) ||
    [packet.ql244Summary.ownerPublicKeyFingerprintSha256,
      packet.ql244Summary.witnessPublicKeyFingerprintSha256]
      .includes(trusted.assessor))return fail('DENIED_ASSESSOR_PIN','Independent reviewer signer pin missing or reused.');
  const key=keyForPin(packet.assessor.publicKeyPem,trusted.assessor);
  const a=key&&payload(packet.assessor.envelope,QL245_ASSESSOR_KEYS,key);
  if(!a)return fail('DENIED_ASSESSOR_SIGNATURE','Independent reviewer detached signature failed.');
  if(a.schema_version!=='rosevear.integration.v1' ||
     a.issuer!=='rosevear-independent-six-app-assessor' ||
     a.kind!=='six_app_signed_metadata_review' ||
     a.ql244_assessor_receipt_id!==packet.ql244Summary.assessorReceiptId ||
     a.ql244_source_revision!==packet.ql244Summary.sourceRevision ||
     a.six_source_payloads_sha256!==ql245Digest(signed) ||
     !ID.test(a.review_receipt_id) || a.business_id!=='devilndove' ||
     a.tenant_id!==null || a.environment!=='nonproduction' ||
     a.real_world_witness_confirmed!==false ||
     a.owner_pilot_authorized!==false || a.rollback_verified!==false ||
     !fresh(a.issued_at,a.expires_at,now)) {
    return fail('DENIED_ASSESSOR_SCOPE','Reviewer cannot grant owner consent, attest unverifiable real-world facts or alter scope.');
  }
  return Object.freeze({
    release:QL245_RELEASE,
    status:'SEVEN_PUBLIC_SIGNATURES_MATCHED_REAL_PROOF_PENDING_HELD',
    company:'devilndove',
    assessorSignatureChecked:true,sourceSignatureChecks:6,
    realWorldWitnessConfirmed:false,
    outOfBandKeyOwnershipIndependentlyConfirmed:false,
    externalReadIndependentlyConfirmed:false,
    credentialExchangeIndependentlyConfirmed:false,
    auditStorageIndependentlyConfirmed:false,
    ownerApprovalIndependentlyConfirmed:false,
    ownerPilotAuthorized:false,connectionState:'DISCONNECTED',
    livePilotRelease:false,writes:0,calls:0,sms:0,dispatch:0,realPilotHolds:12,
    ql244AssessorReceiptId:a.ql244_assessor_receipt_id,
    ql244SourceRevision:a.ql244_source_revision,
    reviewReceiptId:a.review_receipt_id,
    assessorPublicKeyFingerprintSha256:trusted.assessor,
    sourceMetadata:Object.freeze(metadata)
  });
}
