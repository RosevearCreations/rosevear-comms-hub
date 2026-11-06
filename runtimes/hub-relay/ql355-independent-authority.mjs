/** QL-355: private original-issuer and independent field-witness signature verification.
 * This module never bootstraps its own trust, enrolls a database user, signs on
 * behalf of either owner, or opens a private receiver. The trusted identity
 * resolver MUST be implemented outside the request/attestation trust domain.
 */
import {createHash,createPublicKey,timingSafeEqual,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {authorizeQl354IndependentIntake,inspectQl354SignedIntake,
  reconcileQl354SignedChallenge} from './ql354-original-owner-intake.mjs';

export const QL355_SCHEMA='rosevear.hub.ql355.original-authority-test-acceptance.v1';
export const QL355_ATTESTATION='rosevear.hub.ql355.independent-authority-signature.v1';
const SHA=/^[a-f0-9]{64}$/;
const hex=v=>createHash('sha256').update(v).digest('hex');
const held=(state,extra={})=>({schema:QL355_SCHEMA,state,approved:false,
  authenticatedPrivateOperator:false,originalIssuerAuthenticated:false,
  independentWitnessAuthenticated:false,firstPrivateTestAccepted:false,
  receiverActivated:false,connected:false,connectedCount:0,
  customerCommunications:false,deviceActions:false,sourceTestAuthorized:false,
  connectionState:'DISCONNECTED / HOLD',...extra});
const equalSha=(a,b)=>SHA.test(a??'')&&SHA.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));

/** The signed assertion is NOT trusted to specify its own verifying key.
 * `resolvePinnedAuthority` and `verifyIndependentCustody` must be original,
 * separately administered server-side functions. An input JSON approval bit
 * or self-selected PEM can never serve as either function.
 */
export async function verifyQl355Authority({attestation,role,payloadSha256,
  resolvePinnedAuthority,verifyIndependentCustody,now=Date.now()}={}){
  if(!['original_issuer','field_witness'].includes(role)||
    !SHA.test(payloadSha256??'')||typeof resolvePinnedAuthority!=='function'||
    typeof verifyIndependentCustody!=='function'||!Number.isFinite(now))
    return held('HOLD_SEPARATE_TRUSTED_PIN_AND_CUSTODY_VERIFIER_REQUIRED');
  try{
    const body=attestation?.payload;
    if(attestation?.schema!==QL355_ATTESTATION||
      body?.schema!==QL355_ATTESTATION||body.role!==role||
      body.audience!=='rosevear-comms-hub:original-enrollment:TEST'||
      body.enrollmentPayloadSha256!==payloadSha256||
      body.scope!=='one-original-device-test-only'||
      !/^[A-Za-z0-9_-]{86}$/.test(attestation.signature??'')||
      !Number.isFinite(Date.parse(body.issuedAt??''))||
      !Number.isFinite(Date.parse(body.expiresAt??''))||
      Date.parse(body.issuedAt)>now+30_000||
      Date.parse(body.expiresAt)<=now||
      Date.parse(body.expiresAt)-Date.parse(body.issuedAt)>1_200_000||
      body.issuedAt!==new Date(Date.parse(body.issuedAt)).toISOString()||
      body.expiresAt!==new Date(Date.parse(body.expiresAt)).toISOString())
      return held('DENY_CHANGED_EXPIRED_OR_UNSCOPED_INDEPENDENT_ATTESTATION');
    const pinned=await resolvePinnedAuthority(role);
    if(pinned?.role!==role||!SHA.test(pinned?.spkiSha256??'')||
      typeof pinned.publicKeyPem!=='string'||pinned.publicKeyPem.length>2000)
      return held('HOLD_ORIGINAL_INDEPENDENT_AUTHORITY_PIN_UNAVAILABLE');
    const key=createPublicKey(pinned.publicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      !equalSha(hex(key.export({type:'spki',format:'der'})),pinned.spkiSha256))
      return held('DENY_INDEPENDENT_AUTHORITY_PIN_DIGEST_MISMATCH');
    // The custody verifier must authenticate original provenance and revocation
    // independently; matching a copied key, a review ACK or TLS alone is insufficient.
    const custody=await verifyIndependentCustody({role,
      spkiSha256:pinned.spkiSha256,requestSha256:payloadSha256});
    if(custody?.authenticated!==true||custody?.revoked!==false||
      custody.role!==role||!equalSha(custody.spkiSha256,pinned.spkiSha256)||
      !equalSha(custody.requestSha256,payloadSha256))
      return held('HOLD_ORIGINAL_ISSUER_OR_FIELD_WITNESS_CUSTODY_UNAUTHENTICATED');
    const bytes=Buffer.from(attestation.signature,'base64url');
    if(bytes.length!==64||!verify(null,Buffer.from(canonicalize(body)),key,bytes))
      return held('DENY_INDEPENDENT_AUTHORITY_SIGNATURE_INVALID');
    return {schema:QL355_SCHEMA,state:'ORIGINAL_EXTERNAL_AUTHORITY_SIGNATURE_AND_CUSTODY_VERIFIED',
      verified:true,role,payloadSha256,
      spkiSha256:pinned.spkiSha256,attestationSha256:hex(canonicalize(attestation)),
      verifiedAt:new Date(now).toISOString(),expiresAt:body.expiresAt};
  }catch{return held('HOLD_INDEPENDENT_AUTHORITY_READBACK_FAILED');}
}

/** Bridges real external signatures into QL-354's non-serializable one-use
 * enrollment permit. All four injected functions are server-only. Neither
 * a browser-submitted registry nor the attestation's own key is accepted. */
export async function authorizeQl355OriginalCeremony({request,enrollment,pins,
  candidates,evidencePaths,issuerAttestation,witnessAttestation,
  resolvePinnedAuthority,verifyIndependentCustody,now=Date.now()}={}){
  const review=inspectQl354SignedIntake({request,enrollment,pins,candidates,evidencePaths,now});
  if(review.ownerSignaturesVerified!==true)
    return held('HOLD_ORIGINAL_REE_AND_JACK_SIGNED_INTAKE_REQUIRED');
  const verifyRole=async(attestation,hash,role)=>{
    const result=await verifyQl355Authority({attestation,role,payloadSha256:hash,
      resolvePinnedAuthority,verifyIndependentCustody,now});
    return {verified:result.verified===true,payloadSha256:hash,
      ...(role==='original_issuer'?{originalIssuerKeySha256:result.spkiSha256}:
        {independentWitnessKeySha256:result.spkiSha256}),
      verifiedAt:result.verifiedAt};
  };
  const permit=await authorizeQl354IndependentIntake({review,request,enrollment,
    issuerEvidence:issuerAttestation,fieldWitness:witnessAttestation,
    verifyOriginalIssuer:(a,h)=>verifyRole(a,h,'original_issuer'),
    verifyIndependentWitness:(a,h)=>verifyRole(a,h,'field_witness'),now});
  if(permit.state!=='INDEPENDENT_ORIGINAL_AUTHORITY_VERIFIED_ONE_ENROLLMENT_ONLY')
    return held('HOLD_ORIGINAL_ISSUER_WITNESS_OR_TWO_OWNER_AUTHORITY_REQUIRED');
  return permit; // In-memory one-use permit, never publish or serialize.
}

/** Read-only independent acceptance: exactly one original signed DB receipt,
 * trusted local transport and a real owner-authenticated private session.
 * This does NOT promote any source application to CONNECTED. */
export async function acceptQl355FirstPrivateTest({challenge,packet,query,pins,
  verifyPrivateOperator,verifyOriginalTransport,now=Date.now()}={}){
  if(typeof query!=='function'||typeof verifyPrivateOperator!=='function'||
    typeof verifyOriginalTransport!=='function'||!Number.isFinite(now))
    return held('HOLD_GENUINE_PRIVATE_OPERATOR_TRANSPORT_AND_POSTGRES_REQUIRED');
  try{
    const operator=await verifyPrivateOperator();
    if(operator?.state!=='ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION'||
      operator.originalComputer!=='DESKTOP-AE894KC'||
      operator.replayOrRevocationFound!==false||
      !Number.isFinite(operator.expiresAt)||operator.expiresAt<=now)
      return held('DENY_UNAUTHENTICATED_OR_EXPIRED_PRIVATE_OPERATOR');
    const transport=await verifyOriginalTransport();
    if(transport?.state!=='ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED'||
      transport.originalComputer!=='DESKTOP-AE894KC'||
      transport.peerIp!=='100.114.56.26'||transport.boundIp!=='100.77.246.3'||
      transport.tlsPort!==8443||transport.tlsVerified!==true||
      transport.privateReceiverLoopbackVerified!==true||
      !Number.isFinite(transport.observedAt)||Math.abs(now-transport.observedAt)>30_000)
      return held('HOLD_ORIGINAL_PRIVATE_TRANSPORT_NOT_AUTHENTICATED');
    const result=await reconcileQl354SignedChallenge({challenge,packet,query,pins,now});
    if(result.originalTestReceiptVerified!==true||result.receiptCount!==1||
      result.deviceId!=='rosevear-windows-hub')
      return held('HOLD_EXACTLY_ONE_GENUINE_ORIGINAL_TEST_RECEIPT_REQUIRED');
    return held('FIRST_PRIVATE_ORIGINAL_DEVICE_TEST_ACCEPTED_SIX_SOURCES_STILL_HELD',{
      authenticatedPrivateOperator:true,originalTestReceiptVerified:true,
      firstPrivateTestAccepted:true,receiverTransportVerified:true,
      deviceId:result.deviceId,receivedAt:result.receivedAt,receiptCount:1});
  }catch{return held('HOLD_ORIGINAL_FIRST_TEST_ACCEPTANCE_READBACK_FAILED');}
}

export function ql355Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('OFFLINE_INDEPENDENT_AUTHORITY_GUIDE',{
    commands:['--help'],databaseWrites:0,privateKeyAccess:false,
    receiverStarts:0,networkRequests:0});
  throw Error('DENY_QL355_UNSUPERVISED_ORIGINAL_ENROLLMENT_AND_TEST');
}
