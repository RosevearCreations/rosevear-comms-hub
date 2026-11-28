/**
 * QL-506 - metadata-only original-host enrollment *claims* and exact
 * signed exception-ledger reconciliation. Private Node-only module.
 *
 * Public-key signatures prove key possession, never device hardware,
 * operating-system service identity, customer delivery, or provider custody.
 * The supplied ledger projection must come from an independent, approved
 * read-only Comms private database query; this library never fetches data.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {ql505VerifyIndependentReadback} from './ql505-private-runtime.mjs';

const HEX=/^[0-9a-f]{64}$/;
const ID=/^[A-Za-z0-9_-]{8,96}$/;
const APPS=new Set(['icamp','yw','rosiedazzlers','devilndove']);
const REASONS=new Set([
 'PRIVATE_RPC_UNAVAILABLE','PIN_EXPIRED_OR_REVOKED','PRIVATE_JOURNAL_HOLD',
 'IMMUTABLE_CONFLICT','FIELD_REVIEW_UNVERIFIED'
]);
export const QL506_ENROLLMENT_SCHEMA='rosevear.comms.ql506.private-service-identity.v1';
const PROJECT='gxujcwpktaickcgzyvnu';
const FIELDS=['schema','sourceApp','tenantDigest','hostLabel','serviceId',
 'supabaseProject','workerBundleDigest','journalDigest','serviceIdentityDigest',
 'issuedAtMs','expiresAtMs','receiverDisabled','sendDisabled','metadataOnly',
 'authorityTransfer'];
const ROW_FIELDS=['exception_id','source_app','tenant_digest','job_digest',
 'packet_digest','reason_code','status'];
const hold=reason=>({state:'HOLD',reason,fieldCertified:false,
 physicalHostAttested:false,serviceRunningVerified:false,
 providerDeliveryVerified:false,humanAcknowledged:false,
 customerMessageSent:false,receiverStarted:false});
const exact=(v,fields)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===fields.length&&fields.every(key=>Object.hasOwn(v,key));
const sha=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
function keyAndFingerprint(value){
 const key=createPublicKey(value);
 if(key.asymmetricKeyType!=='ed25519')throw Error('ED25519_REQUIRED');
 const fp=createHash('sha256').update(key.export({format:'der',type:'spki'}))
  .digest('hex');
 return {key,fp};
}
/** This can prove a scoped signed assertion only. No enrollment is performed. */
export function ql506VerifyServiceIdentityClaim({
 packet,serviceIdentityPublicKeyPem,sourcePublicKeyPem,
 providerPublicKeyPem,reviewerPublicKeyPem,
 expectedSourceApp,expectedTenantDigest,expectedWorkerBundleDigest,
 expectedJournalDigest,now=Date.now()
}={}){
 const p=packet?.payload;
 try{
  if(!exact(packet,['payload','signature'])||!exact(p,FIELDS)||
   !APPS.has(expectedSourceApp)||p.sourceApp!==expectedSourceApp||
   !HEX.test(expectedTenantDigest??'')||
   p.tenantDigest!==expectedTenantDigest||
   !HEX.test(expectedWorkerBundleDigest??'')||
   p.workerBundleDigest!==expectedWorkerBundleDigest||
   !HEX.test(expectedJournalDigest??'')||
   p.journalDigest!==expectedJournalDigest||
   p.schema!==QL506_ENROLLMENT_SCHEMA||
   p.hostLabel!=='DESKTOP-AE894KC'||
   p.serviceId!=='COMMS_PRIVATE_RECEIPT_WORKER'||
   p.supabaseProject!==PROJECT||
   !HEX.test(p.serviceIdentityDigest??'')||
   p.receiverDisabled!==true||p.sendDisabled!==true||
   p.metadataOnly!==true||p.authorityTransfer!==false||
   !Number.isSafeInteger(now)||
   !Number.isSafeInteger(p.issuedAtMs)||p.issuedAtMs>now||
   now-p.issuedAtMs>120000||
   !Number.isSafeInteger(p.expiresAtMs)||p.expiresAtMs<=now||
   p.expiresAtMs-p.issuedAtMs>180000||
   typeof packet.signature!=='string'||
   !/^[A-Za-z0-9_-]{86}$/.test(packet.signature))
    return hold('QL506_ENROLLMENT_SCOPE_OR_EXPIRY_DENIED');
  const service=keyAndFingerprint(serviceIdentityPublicKeyPem);
  const source=keyAndFingerprint(sourcePublicKeyPem);
  const provider=keyAndFingerprint(providerPublicKeyPem);
  const reviewer=keyAndFingerprint(reviewerPublicKeyPem);
  if(new Set([service.fp,source.fp,provider.fp,reviewer.fp]).size!==4||
   p.serviceIdentityDigest!==service.fp)
   return hold('QL506_FOUR_DISTINCT_PINNED_IDENTITIES_REQUIRED');
  const signature=Buffer.from(packet.signature,'base64url');
  if(signature.length!==64||
   signature.toString('base64url')!==packet.signature||
   !verify(null,Buffer.from(canonicalize(p)),service.key,signature))
   return hold('QL506_UNTRUSTED_SERVICE_IDENTITY_SIGNATURE');
  return {
   state:'QL506_SIGNED_SERVICE_IDENTITY_CLAIM_FIELD_HOLD',
   sourceApp:p.sourceApp,tenantDigest:p.tenantDigest,
   serviceIdentityDigest:service.fp,workerBundleDigest:p.workerBundleDigest,
   journalDigest:p.journalDigest,enrollmentPacketDigest:sha(packet),
   serviceIdentitySignatureVerified:true,
   physicalHostAttested:false,serviceRunningVerified:false,
   providerDeliveryVerified:false,humanAcknowledged:false,
   fieldCertified:false,customerMessageSent:false,receiverStarted:false
  };
 }catch{return hold('QL506_INVALID_IDENTITY_PIN_OR_PACKET')}
}
/**
 * Exact canonical row projection is signed through QL505 receiptDigest.
 * Input rows are untrusted until independently obtained from Comms private
 * RLS/role-controlled readback. A matching fixture can NEVER certify field.
 */
export function ql506ReconcileSignedExceptionReadback({
 enrollmentPacket,readbackPacket,ledgerRows,
 serviceIdentityPublicKeyPem,sourcePublicKeyPem,providerPublicKeyPem,
 reviewerPublicKeyPem,expectedSourceApp,expectedTenantDigest,
 expectedWorkerBundleDigest,expectedJournalDigest,
 expectedJobDigest,now=Date.now()
}={}){
 const enrolled=ql506VerifyServiceIdentityClaim({
  packet:enrollmentPacket,serviceIdentityPublicKeyPem,
  sourcePublicKeyPem,providerPublicKeyPem,reviewerPublicKeyPem,
  expectedSourceApp,expectedTenantDigest,expectedWorkerBundleDigest,
  expectedJournalDigest,now
 });
 if(enrolled.state==='HOLD')return enrolled;
 if(!HEX.test(expectedJobDigest??'')||
  !Array.isArray(ledgerRows)||ledgerRows.length<1||ledgerRows.length>100)
  return hold('QL506_PRIVATE_LEDGER_READBACK_REQUIRED');
 const ids=new Set();
 for(const row of ledgerRows){
  if(!exact(row,ROW_FIELDS)||
   !HEX.test(row.exception_id??'')||!HEX.test(row.job_digest??'')||
   !HEX.test(row.packet_digest??'')||
   row.job_digest!==expectedJobDigest||
   row.source_app!==expectedSourceApp||
   row.tenant_digest!==expectedTenantDigest||
   row.status!=='HOLD'||!REASONS.has(row.reason_code)||
   ids.has(row.exception_id))
   return hold('QL506_LEDGER_SCOPE_DUPLICATE_OR_MUTATION_DENIED');
  ids.add(row.exception_id);
 }
 const ordered=[...ledgerRows].sort((a,b)=>a.exception_id.localeCompare(b.exception_id));
 const ledgerDigest=sha(ordered);
 const result=ql505VerifyIndependentReadback({
  packet:readbackPacket,reviewerPublicKeyPem,sourcePublicKeyPem,
  providerPublicKeyPem,expectedBrand:expectedSourceApp,
  expectedTenantDigest,expectedJobDigest,
  expectedReceiptDigest:ledgerDigest,now
 });
 if(result.state!=='QL505_INDEPENDENT_SIGNED_READBACK_CLAIM_REVIEW_HELD'||
  result.recordCount!==ordered.length)
  return hold('QL506_INDEPENDENT_READBACK_SIGNATURE_OR_LEDGER_MISMATCH');
 return {
  state:'QL506_SIGNED_EXCEPTION_LEDGER_RECONCILED_FIELD_HOLD',
  sourceApp:expectedSourceApp,tenantDigest:expectedTenantDigest,
  jobDigest:expectedJobDigest,recordCount:ordered.length,
  ledgerDigest,enrollmentPacketDigest:enrolled.enrollmentPacketDigest,
  reviewerPacketDigest:result.packetDigest,
  serviceIdentitySignatureVerified:true,reviewerSignatureVerified:true,
  exactPrivateLedgerProjectionMatched:true,
  physicalHostAttested:false,serviceRunningVerified:false,
  providerDeliveryVerified:false,humanAcknowledged:false,
  fieldCertified:false,customerMessageSent:false,receiverStarted:false
 };
}
/** For an independent private reader to calculate its signed row digest. */
export function ql506ProjectLedgerDigest(rows){
 if(!Array.isArray(rows)||rows.length<1||rows.length>100)
  return hold('QL506_NONEMPTY_PRIVATE_LEDGER_REQUIRED');
 const ids=new Set();
 for(const row of rows){
  if(!exact(row,ROW_FIELDS)||!HEX.test(row.exception_id??'')||
   !HEX.test(row.job_digest??'')||!HEX.test(row.packet_digest??'')||
   !HEX.test(row.tenant_digest??'')||!APPS.has(row.source_app)||
   !REASONS.has(row.reason_code)||row.status!=='HOLD'||
   ids.has(row.exception_id))
   return hold('QL506_LEDGER_METADATA_INVALID');
  ids.add(row.exception_id);
 }
 return {state:'QL506_EXACT_METADATA_DIGEST_ONLY',
  digest:sha([...rows].sort((a,b)=>a.exception_id.localeCompare(b.exception_id))),
  recordCount:rows.length,customerMessageSent:false,receiverStarted:false};
}
