/**
 * QL-507: verified preparatory claims only; NOT on-device physical attestation,
 * a provider delivery witness, runtime activation, or customer send authority.
 * Private server-side library. Does not read secrets or make network calls.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {canonicalize} from './manifest.mjs';
import {ql506VerifyServiceIdentityClaim} from './ql506-enrollment-reconciliation.mjs';
import {reviewQl502VersionedDelivery} from './ql502-provider-delivery-proof.mjs';
export const QL507_WITNESS_SCHEMA='rosevear.comms.ql507.original-host-pilot-witness.v1';
const HEX=/^[0-9a-f]{64}$/;
const ID=/^[A-Za-z0-9_-]{8,96}$/;
const APPS=new Set(['icamp','yw','rosiedazzlers','devilndove']);
const WITNESS_FIELDS=['schema','sourceApp','tenantDigest','hostLabel',
 'serviceId','enrollmentPacketDigest','sourcePacketDigest','providerPacketDigest',
 'observerId','serviceMode','receiverOff','senderOff','metadataOnly',
 'observedAtMs','expiresAtMs','customerDataIncluded','authorityTransfer'];
const exact=(x,fields)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&fields.every(k=>Object.hasOwn(x,k));
const digest=x=>createHash('sha256').update(canonicalize(x)).digest('hex');
function pub(pem){
 const k=createPublicKey(pem);
 if(k.asymmetricKeyType!=='ed25519')throw Error('ED25519_REQUIRED');
 return {key:k,fingerprint:createHash('sha256')
  .update(k.export({format:'der',type:'spki'})).digest('hex')};
}
const hold=reason=>({state:'HOLD',reason,
 independentlyPhysicallyWitnessed:false,
 originalServiceRunning:false,fieldCertified:false,
 providerDeliveryObserved:false,humanAcknowledged:false,
 sendAuthorized:false,customerMessageSent:false,receiverStarted:false});
/**
 * Requires 5 distinct, independently enrolled public-key pins:
 * source, provider, reviewer, service and on-site independent observer.
 * A passing signature validates signed CLAIMS only; controlled field
 * activation and independent physical checks require a separate ceremony.
 */
export function ql507ReviewPilotPreparation({
 enrollmentPacket,witnessPacket,sourcePacket,providerPacket,
 sourcePublicKeyPem,providerPublicKeyPem,reviewerPublicKeyPem,
 serviceIdentityPublicKeyPem,observerPublicKeyPem,
 expectedSourceApp,expectedTenantDigest,expectedWorkerBundleDigest,
 expectedJournalDigest,currentVersion,now=Date.now()
}={}){
 try{
  if(!APPS.has(expectedSourceApp)||!HEX.test(expectedTenantDigest??'')||
   !Number.isSafeInteger(now))
   return hold('QL507_EXPECTED_SOURCE_TENANT_REQUIRED');
  const enrolled=ql506VerifyServiceIdentityClaim({
   packet:enrollmentPacket,sourcePublicKeyPem,providerPublicKeyPem,
   reviewerPublicKeyPem,serviceIdentityPublicKeyPem,
   expectedSourceApp,expectedTenantDigest,expectedWorkerBundleDigest,
   expectedJournalDigest,now
  });
  if(enrolled.state!=='QL506_SIGNED_SERVICE_IDENTITY_CLAIM_FIELD_HOLD')
   return hold('QL507_PRIVATE_SERVICE_IDENTITY_OR_SCOPE_HOLD');
  const names=[sourcePublicKeyPem,providerPublicKeyPem,
   reviewerPublicKeyPem,serviceIdentityPublicKeyPem,observerPublicKeyPem]
   .map(pub);
  if(new Set(names.map(v=>v.fingerprint)).size!==5)
   return hold('QL507_FIFTH_INDEPENDENT_OBSERVER_PIN_REQUIRED');
  const review=reviewQl502VersionedDelivery({
   sourcePacket,providerPackets:[providerPacket],replyPacket:null,
   sourcePublicKeyPem,providerPublicKeyPem,
   approvedBrand:expectedSourceApp,approvedTenantDigest:expectedTenantDigest,
   currentVersion,now
  });
  if(review.state!=='QL502_SIGNED_VERSIONED_DELIVERY_REVIEW_HELD'||
   !review.providerAccepted||review.providerDelivered||
   review.superseded||review.replyNeedsReview)
   return hold('QL507_CURRENT_VERSION_SIGNED_PROVIDER_ACCEPTANCE_REQUIRED');
  const p=witnessPacket?.payload;
  if(!exact(witnessPacket,['payload','signature'])||
   !exact(p,WITNESS_FIELDS)||p.schema!==QL507_WITNESS_SCHEMA||
   p.sourceApp!==expectedSourceApp||p.tenantDigest!==expectedTenantDigest||
   p.hostLabel!=='DESKTOP-AE894KC'||
   p.serviceId!=='COMMS_PRIVATE_RECEIPT_WORKER'||
   p.enrollmentPacketDigest!==digest(enrollmentPacket)||
   p.sourcePacketDigest!==digest(sourcePacket)||
   p.providerPacketDigest!==digest(providerPacket)||
   !ID.test(p.observerId??'')||
   p.serviceMode!=='MANUAL_NOT_STARTED'||
   p.receiverOff!==true||p.senderOff!==true||
   p.metadataOnly!==true||p.customerDataIncluded!==false||
   p.authorityTransfer!==false||
   !Number.isSafeInteger(p.observedAtMs)||
   p.observedAtMs>now||now-p.observedAtMs>120000||
   !Number.isSafeInteger(p.expiresAtMs)||
   p.expiresAtMs<=now||p.expiresAtMs-p.observedAtMs>180000||
   !/^[A-Za-z0-9_-]{86}$/.test(witnessPacket.signature??''))
   return hold('QL507_OBSERVER_SCOPE_HOST_OR_EXPIRY_DENIED');
  const sig=Buffer.from(witnessPacket.signature,'base64url');
  if(sig.length!==64||sig.toString('base64url')!==witnessPacket.signature||
   !verify(null,Buffer.from(canonicalize(p)),names[4].key,sig))
   return hold('QL507_OBSERVER_SIGNATURE_FORGED');
  return {state:'QL507_SIGNED_PILOT_PREPARATION_CLAIMS_FIELD_HOLD',
   sourceApp:expectedSourceApp,tenantDigest:expectedTenantDigest,
   currentVersion,enrollmentDigest:digest(enrollmentPacket),
   sourceDigest:review.sourcePacketDigest,
   providerDigest:digest(providerPacket),witnessDigest:digest(witnessPacket),
   fiveDistinctSignerPinsVerified:true,
   sourceProviderAcceptanceClaimVerified:true,
   independentObserverClaimSignatureVerified:true,
   originalHostPhysicalPresenceVerified:false,
   originalServiceRunning:false,
   independentlyPhysicallyWitnessed:false,
   providerDeliveryObserved:false,humanAcknowledged:false,
   fieldCertified:false,sendAuthorized:false,customerMessageSent:false,
   receiverStarted:false,
   outstanding:[
    'Original-device physical identity and service identity need independent witnessed evidence',
    'Private service-role credential custody and original process presence remain unverified',
    'Provider acceptance signature is not network delivery or a customer acknowledgement',
    'Separately authorized supervised one-time pilot is required before any live send'
   ]};
 }catch{return hold('QL507_INVALID_KEY_PACKET_OR_SIGNATURE')}
}
/** No packet is enough to release the field gates automatically. */
export function ql507PilotGateSummary(verdict){
 const signed=verdict?.state==='QL507_SIGNED_PILOT_PREPARATION_CLAIMS_FIELD_HOLD';
 return {build:'QL-507',state:'FIELD_HOLD',signedPreparationClaimsVerified:signed,
  originalWindowsWitnessCertified:false,serviceCredentialCustodyCertified:false,
  realProviderDeliveryCertified:false,receiverStarted:false,sendAuthorized:false,
  customerMessageSent:false,remaining:[
   'Independent physical original-host observation',
   'Authenticated service process and credential-custody witness',
   'Genuine provider-side delivery readback',
   'Explicit owner-approved supervised pilot'
  ]};
}
