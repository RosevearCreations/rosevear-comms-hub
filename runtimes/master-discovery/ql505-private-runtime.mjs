/**
 * QL-505 — Comms-owned *private* one-shot runtime integration.
 * No HTTP listener, scheduled task, provider/customer send, Windows service
 * change, key generation or enrollment. A private original-host supervisor
 * must inject an independently approved QL504 config and service-role
 * database gateway. The public UI cannot call this module.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {ql504Enqueue,ql504DrainOnce}
 from './ql504-private-receipt-worker.mjs';
import {buildQl503VerifiedImport} from './ql503-durable-verified-import.mjs';

const HEX=/^[a-f0-9]{64}$/, ID=/^[A-Za-z0-9_-]{8,96}$/;
const READBACK_SCHEMA='rosevear.comms.ql505.independent-receipt-readback.v1';
const signature=packet=>packet?.signature??'';
const hash=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
const hold=reason=>({state:'HOLD',reason,fieldCertified:false,
 providerDeliveryObserved:false,humanAcknowledged:false,
 customerMessageSent:false,receiverStarted:false});
function exact(x,keys){
 return !!x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
}
function fp(pem){
 const key=createPublicKey(pem);
 if(key.asymmetricKeyType!=='ed25519')throw Error('NON_ED25519');
 return createHash('sha256').update(key.export({format:'der',type:'spki'})).digest('hex');
}
/** Signature review never certifies a physical original-host observation. */
export function ql505VerifyIndependentReadback({
 packet,reviewerPublicKeyPem,sourcePublicKeyPem,providerPublicKeyPem,
 expectedBrand,expectedTenantDigest,expectedJobDigest,
 expectedReceiptDigest,now=Date.now()
}={}){
 const keys=['schema','brand','tenantDigest','jobDigest','receiptDigest',
  'reviewerId','recordCount','issuedAtMs','expiresAtMs','origin',
  'customerDataIncluded','authorityTransfer'];
 const p=packet?.payload;
 try{
  if(!exact(packet,['payload','signature'])||!exact(p,keys)||
   !/^[A-Za-z0-9_-]{86}$/.test(signature(packet))||
   p.schema!==READBACK_SCHEMA||
   p.brand!==expectedBrand||!['icamp','yw','rosiedazzlers','devilndove'].includes(p.brand)||
   p.tenantDigest!==expectedTenantDigest||!HEX.test(p.tenantDigest??'')||
   p.jobDigest!==expectedJobDigest||!HEX.test(p.jobDigest??'')||
   p.receiptDigest!==expectedReceiptDigest||!HEX.test(p.receiptDigest??'')||
   !ID.test(p.reviewerId??'')||
   !Number.isSafeInteger(p.recordCount)||p.recordCount<0||p.recordCount>100||
   p.origin!=='INDEPENDENT_COMMS_FIELD_REVIEW'||
   p.customerDataIncluded!==false||p.authorityTransfer!==false||
   !Number.isSafeInteger(p.issuedAtMs)||p.issuedAtMs>now||
   now-p.issuedAtMs>120000||
   !Number.isSafeInteger(p.expiresAtMs)||p.expiresAtMs<=now||
   p.expiresAtMs-p.issuedAtMs>180000)
    return hold('QL505_READBACK_SCHEMA_OR_SCOPE_DENIED');
  const keysFp=[reviewerPublicKeyPem,sourcePublicKeyPem,providerPublicKeyPem].map(fp);
  if(new Set(keysFp).size!==3)return hold('QL505_THIRD_INDEPENDENT_REVIEWER_PIN_REQUIRED');
  const bytes=Buffer.from(packet.signature,'base64url');
  if(bytes.length!==64||bytes.toString('base64url')!==packet.signature||
    !verify(null,Buffer.from(canonicalize(p)),createPublicKey(reviewerPublicKeyPem),bytes))
    return hold('QL505_UNTRUSTED_INDEPENDENT_REVIEW_SIGNATURE');
  return {state:'QL505_INDEPENDENT_SIGNED_READBACK_CLAIM_REVIEW_HELD',
   brand:p.brand,tenantDigest:p.tenantDigest,jobDigest:p.jobDigest,
   receiptDigest:p.receiptDigest,recordCount:p.recordCount,
   reviewerId:p.reviewerId,packetDigest:hash(packet),
   reviewerSignatureVerified:true,
   originalHostPhysicallyWitnessed:false,
   realProviderDeliveryIndependentlyObserved:false,
   humanAcknowledged:false,fieldCertified:false,
   customerMessageSent:false};
 }catch{return hold('QL505_PIN_OR_SIGNATURE_INVALID')}
}
const mapReason=reason=>({
 BOUNDED_SERVER_RPC_FAILURE:'PRIVATE_RPC_UNAVAILABLE',
 PIN_EXPIRED_REVOKED_PACKET_DRIFT_OR_SCOPE_DENIED:'PIN_EXPIRED_OR_REVOKED',
 QL504_JOURNAL_OR_SERVER_INTEGRITY_HOLD:'PRIVATE_JOURNAL_HOLD'
})[reason]??null;

/** Does not invent a provider ACK or authorization from its injected gateway.
 * Enqueue is durable and verifiably signed by QL504; drain revalidates before
 * the ONLY possible database receipt write. Exceptions are separately routed
 * to the QL505 service_role-only RPC after a genuine terminal dead-letter.
 */
export async function ql505RunOnePrivateCycle({
 journalFile,request,config,receiptGateway,exceptionGateway,
 privateRuntimeAuthority,now=Date.now()
}={}){
 if(!exact(privateRuntimeAuthority,['approvedByOriginalOwner','commsRuntime',
  'privateGatewayEnrolled','allowOnlyMetadata'])||
  privateRuntimeAuthority.approvedByOriginalOwner!==true||
  privateRuntimeAuthority.commsRuntime!=='COMMS_PRIVATE_RUNTIME'||
  privateRuntimeAuthority.privateGatewayEnrolled!==true||
  privateRuntimeAuthority.allowOnlyMetadata!==true)
  return hold('QL505_ORIGINAL_COMMS_RUNTIME_APPROVAL_REQUIRED');
 if(!receiptGateway||typeof receiptGateway.rpc!=='function')
  return hold('QL505_PRIVATE_RECEIPT_RPC_REQUIRED');
 // Test-only injected gateways must never be treated as a real field witness.
 const queued=ql504Enqueue({journalFile,request,config,now});
 if(!['QL504_DURABLE_QUEUED_NO_SEND','DUPLICATE_QUEUED_OR_RECORDED'].includes(queued.state))
  return hold(queued.reason??queued.state);
 if(queued.status==='COMMITTED')
  return {state:'QL505_PRIOR_RECEIPT_ALREADY_COMMITTED',
   jobDigest:queued.id,customerMessageSent:false,
   externallyDelivered:false,humanAcknowledged:false};
 const result=await ql504DrainOnce({
  journalFile,config,rpcGateway:receiptGateway,now});
 if(result.state==='QL504_PRIVATE_RPC_COMMITTED_NO_SEND')
  return {state:'QL505_COMMS_METADATA_COMMITTED_NO_SEND',
   jobDigest:result.id,committed:true,customerMessageSent:false,
   providerDeliveryObserved:false,humanAcknowledged:false,
   originalHostPhysicallyWitnessed:false};
 if(result.state!=='QL504_DEAD_LETTER_HOLD')
  return {state:'QL505_LOCAL_RETRY_OR_HOLD',
   jobDigest:queued.id,reason:result.reason??result.state,
   committed:false,customerMessageSent:false};
 if(result.id!==queued.id)
  return hold('QL505_DEAD_LETTER_JOB_ID_MISMATCH');
 const routed=await ql505RecordException({
  exceptionGateway,request,config,jobDigest:result.id,
  reason:result.reason,now
 });
 return {...routed,jobDigest:result.id,customerMessageSent:false};
}
/** Only opaque metadata; QL505 DB SQL function is service-role-only and
 * idempotent, while public clients have no INSERT/UPDATE/EXECUTE privileges.
 * A second call with identical signed source and job ID can retry
 * exception recording after a database outage without re-sending a message.
 */
export async function ql505RecordException({
 exceptionGateway,request,config,jobDigest,reason,now=Date.now()
}={}){
 const reasonCode=mapReason(reason);
 const p=request?.sourcePacket?.payload;
 if(!reasonCode||!p||!HEX.test(p.tenantDigest??'')||
  !['icamp','yw','rosiedazzlers','devilndove'].includes(p.brand)||
  !HEX.test(jobDigest??'')||
  typeof exceptionGateway?.rpc!=='function'||
  !config||config.workerEnabled!==true||
  config.approvedBrand!==p.brand||
  config.approvedTenantDigest!==p.tenantDigest||
  !Array.isArray(config.sourcePins)||!Array.isArray(config.providerPins))
  return hold('QL505_ROUTING_REQUIRES_PRIOR_VALID_PRIVATE_JOB_AND_GATEWAY');
 // Exception records must be bound to the **same original signed message**
 // that QL504 accepted, never an arbitrary caller supplied job digest.
 let signedVerified=false;
 for(const source of config.sourcePins)for(const provider of config.providerPins){
  if(now<source.validFromMs||now>=source.validUntilMs||
   now<provider.validFromMs||now>=provider.validUntilMs)continue;
  const verdict=buildQl503VerifiedImport({
   ...request,now,serverConfig:{
    approvedBrand:config.approvedBrand,
    approvedTenantDigest:config.approvedTenantDigest,
    sourcePublicKeyPem:source.publicKeyPem,
    providerPublicKeyPem:provider.publicKeyPem,
    currentVersion:config.currentVersion,importEnabled:true
   }
  });
  if(verdict.state!=='QL503_VERIFIED_IMPORT_PREPARED_REVIEW_HELD')continue;
  const args=verdict.args;
  const originalIdentity={
   brand:args.p_source_app,tenantDigest:args.p_tenant_digest,
   threadDigest:args.p_thread_digest,messageKey:args.p_message_key,
   version:args.p_message_version,contentDigest:args.p_content_digest,
   sourcePacketDigest:args.p_source_packet_digest,
   evidenceDigests:args.p_events.map(e=>e.digest)
  };
  if(hash(originalIdentity)===jobDigest){signedVerified=true;break;}
 }
 if(!signedVerified)return hold('QL505_UNSIGNED_OR_MISMATCHED_ORIGINAL_DEAD_LETTER');
 try{
  const packetDigest=hash(request.sourcePacket);
  const exceptionId=hash({jobDigest,reasonCode,packetDigest});
  const result=await exceptionGateway.rpc('ql505_record_receipt_exception',{
   p_source_app:p.brand,p_tenant_digest:p.tenantDigest,
   p_exception_id:exceptionId,p_job_digest:jobDigest,
   p_packet_digest:packetDigest,p_reason_code:reasonCode
  });
  if(result?.error||
   result?.data?.state!=='QL505_PRIVATE_EXCEPTION_DURABLE_HOLD'||
   result?.data?.exceptionId!==exceptionId||
   result?.data?.reason!==reasonCode)
   return hold('QL505_DURABLE_EXCEPTION_RPC_NOT_CONFIRMED');
  return {state:'QL505_DURABLE_OPERATOR_EXCEPTION_HOLD',
   exceptionId,reasonCode,tenantDigest:p.tenantDigest,brand:p.brand,
   privateExceptionRecorded:true,customerMessageSent:false,
   realProviderDeliveryObserved:false,humanAcknowledged:false,
   originalHostFieldCertified:false};
 }catch{return hold('QL505_DURABLE_EXCEPTION_RPC_UNAVAILABLE')}
}
