/** QL-346: offline verification only. A signature proves possession of a key,
 * never the original issuer's independent custody or permission to enroll. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {HUB_RELAY_SCHEMA} from './heartbeat.mjs';
import {inspectReviewChallenge,verifyReviewDisposition} from './ql345-issuer-owner-preflight.mjs';
import {inspectOffObservation} from './ql344-off-attestation.mjs';
import {assembleSignedEnrollment,inspectEnrollmentRequest} from './ql340b-enrollment.mjs';

export const QL346_SCHEMA='rosevear.hub.ql346.offline-test-readiness.v1';
const SHA=/^[a-f0-9]{64}$/;
const SIGNATURE=/^[A-Za-z0-9_-]{86}$/;
const WITNESSES=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const ENVELOPE=['schemaVersion','issuer','audience','deviceId','workloadId',
  'environment','sequence','nonce','sessionId','issuedAt','expiresAt',
  'capabilities','queueDepth','relayMode'];
const own=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const sha=b=>createHash('sha256').update(b).digest('hex');
const held=(state,extra={})=>({schema:QL346_SCHEMA,state,
  issuerSignatureCryptographicallyValid:false,devicePinMatches:false,
  originalIssuerIndependentlyAuthenticated:false,
  originalIssuerOutOfBandCustodyApproved:false,
  sourceOwnerTestSignatureValid:false,masterOwnerTestSignatureValid:false,
  readyForDatabaseEnrollment:false,independentHumanReviewRequired:true,
  originalReceiverStopped:false,receiverActivated:false,
  databaseEnrollmentCreated:false,connected:false,
  networkRequests:0,customerCommunications:false,deviceActions:false,...extra});

/** Public-key integrity and original device signature, checked WITHOUT granting
 * fake postgres/TLS/owner flags to the production heartbeat verifier. */
export function verifyOriginalIssuerHeartbeat({packet,deviceCandidate,
  independentlyObservedDeviceSpki,now=Date.now()}={}){
  const e=packet?.envelope;
  if(!own(packet,['envelope','keyId','signature'])||!own(e,ENVELOPE)||
    !own(deviceCandidate,['schema','deviceId','workloadId','keyId',
      'devicePublicKeyPem','deviceSpkiSha256','enrollmentState'])||
    deviceCandidate.schema!=='rosevear.hub.ql339b.public-candidate.v1'||
    deviceCandidate.enrollmentState!=='HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'||
    e.schemaVersion!==HUB_RELAY_SCHEMA||e.issuer!=='rosevear-ai-hub'||
    e.audience!=='rosevear-comms-hub:nonproduction'||e.environment!=='TEST'||
    e.deviceId!=='rosevear-windows-hub'||e.workloadId!=='hub-probe'||
    e.deviceId!==deviceCandidate.deviceId||e.workloadId!==deviceCandidate.workloadId||
    packet.keyId!=='hub-ql339b'||packet.keyId!==deviceCandidate.keyId||
    e.relayMode!=='OUTBOUND_ONLY'||
    JSON.stringify(e.capabilities)!=='["health.read","capabilities.read"]'||
    !Number.isSafeInteger(e.sequence)||e.sequence!==1||e.queueDepth!==0||
    !/^[A-Za-z0-9_-]{22,64}$/.test(e.nonce??'')||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(e.sessionId??'')||
    !SIGNATURE.test(packet.signature??''))
    return held('DENY_WRONG_ORIGINAL_DEVICE_PACKET_SCOPE');
  const issued=Date.parse(e.issuedAt??''),expires=Date.parse(e.expiresAt??'');
  if(!Number.isFinite(now)||!Number.isFinite(issued)||!Number.isFinite(expires)||
    new Date(issued).toISOString()!==e.issuedAt||
    new Date(expires).toISOString()!==e.expiresAt||
    issued>now+30_000||now>=expires||expires-issued!==90_000)
    return held('HOLD_EXPIRED_OR_NONSTANDARD_ORIGINAL_HEARTBEAT');
  try{
    const publicKey=createPublicKey(deviceCandidate.devicePublicKeyPem);
    if(publicKey.asymmetricKeyType!=='ed25519'||
      sha(publicKey.export({type:'spki',format:'der'}))!==deviceCandidate.deviceSpkiSha256||
      !SHA.test(independentlyObservedDeviceSpki??'')||
      deviceCandidate.deviceSpkiSha256!==independentlyObservedDeviceSpki)
      return held('HOLD_DEVICE_PUBLIC_KEY_OR_OUT_OF_BAND_PIN_MISMATCH');
    if(!verify(null,Buffer.from(canonicalize(e)),publicKey,
      Buffer.from(packet.signature,'base64url')))
      return held('DENY_INVALID_ORIGINAL_ISSUER_SIGNATURE');
    return held('ORIGINAL_DEVICE_SIGNATURE_AND_PIN_MATCH_FIELD_CUSTODY_HOLD',{
      issuerSignatureCryptographicallyValid:true,devicePinMatches:true,
      signedEnvelopeSha256:sha(canonicalize(e)),
      devicePublicSpkiSha256:deviceCandidate.deviceSpkiSha256,
      originalIssuerIndependentCustodyProofRequired:true});
  }catch{return held('DENY_UNREADABLE_DEVICE_PUBLIC_KEY_OR_SIGNATURE');}
}

/** QL345 review acknowledgements NEVER substitute for QL340B enrollment signatures.
 * Original issuer provenance and the real receiver field witness remain human gates.
 * This function has no filesystem, database, or network side effects. */
export function assessControlledTestReadiness({observation,challenge,
  sourceReview,masterReview,request,sourceApproval,masterApproval,
  packet,deviceCandidate,independentlyObservedDeviceSpki,now=Date.now()}={}){
  const off=inspectOffObservation(observation,now);
  const review=inspectReviewChallenge(challenge,now);
  if(!off.receiverOffObserved||!review.valid||
    review.challengeSha256!==sourceReview?.challengeSha256||
    review.challengeSha256!==masterReview?.challengeSha256||
    challenge.observationSha256!==off.observationSha256||
    challenge.tlsCertificateFileSha256!==off.tlsCertificateFileSha256||
    WITNESSES.some(k=>challenge.evidenceDigests[k]!==off.evidenceDigests[k]))
    return held('HOLD_ORIGINAL_RECEIVER_OFF_OR_REVIEW_MISMATCH');
  const source=verifyReviewDisposition({challenge,disposition:sourceReview,role:'source',now});
  const master=verifyReviewDisposition({challenge,disposition:masterReview,role:'master',now});
  if(!source.valid||!master.valid||
    source.decision!=='REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'||
    master.decision!=='REVIEW_ACKNOWLEDGED_NO_ENROLLMENT')
    return held('HOLD_TWO_SEPARATE_ORIGINAL_OWNER_REVIEW_SIGNATURES_REQUIRED',{
      sourceReviewValid:source.valid,masterReviewValid:master.valid});
  const inspected=inspectEnrollmentRequest(request,now);
  if(!inspected.valid||
    request.payload.deviceId!=='rosevear-windows-hub'||
    request.payload.workloadId!=='hub-probe'||
    request.payload.keyId!=='hub-ql339b'||
    request.payload.deviceSpkiSha256!==deviceCandidate?.deviceSpkiSha256||
    request.payload.devicePublicKeyPem!==deviceCandidate?.devicePublicKeyPem||
    WITNESSES.some(k=>request.payload[k]!==challenge.evidenceDigests[k])||
    ['source','master'].some(k=>
      request.ownerAuthorityPins[k].keyId!==challenge.ownerAuthorityPins[k].keyId||
      request.ownerAuthorityPins[k].publicKeyPem!==challenge.ownerAuthorityPins[k].publicKeyPem))
    return held('HOLD_DIFFERENT_DEVICE_OWNER_OR_ORIGINAL_TEST_EVIDENCE');
  let signed;
  try{signed=assembleSignedEnrollment({request,sourceApproval,masterApproval,now});}
  catch{return held('HOLD_SEPARATE_QL340B_TEST_ENROLLMENT_SIGNATURES_REQUIRED');}
  if(signed.state!=='SIGNED_TEST_ENROLLMENT_READY_FOR_INDEPENDENT_FIELD_WITNESS')
    return held('DENY_UNEXPECTED_OWNER_SIGNING_STATE');
  const issuer=verifyOriginalIssuerHeartbeat({packet,deviceCandidate,
    independentlyObservedDeviceSpki,now});
  if(!issuer.issuerSignatureCryptographicallyValid)
    return held('HOLD_INDEPENDENT_ORIGINAL_ISSUER_SIGNATURE_OR_PIN_REQUIRED',{
      issuerProofState:issuer.state,
      sourceOwnerTestSignatureValid:true,masterOwnerTestSignatureValid:true});
  return held('CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD',{
    issuerSignatureCryptographicallyValid:true,devicePinMatches:true,
    signedEnvelopeSha256:issuer.signedEnvelopeSha256,
    sourceReviewValid:true,masterReviewValid:true,
    sourceOwnerTestSignatureValid:true,masterOwnerTestSignatureValid:true,
    ownerRequestPayloadSha256:inspected.payloadSha256,
    nextAction:'Independent issuer-custody and real receiver-OFF field review required before separate DB enrollment authorization'});
}

const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
export function ql346Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('OFFLINE_READ_ONLY_QL346_GUIDE',{
    commands:['--verify-issuer HEARTBEAT.json DEVICE_PUBLIC.json INDEPENDENTLY_OBSERVED_DEVICE_SPKI_SHA256',
      '--preflight OFF.json CHALLENGE.json SOURCE_REVIEW.json MASTER_REVIEW.json TEST_REQUEST.json SOURCE_TEST_APPROVAL.json MASTER_TEST_APPROVAL.json HEARTBEAT.json DEVICE_PUBLIC.json INDEPENDENTLY_OBSERVED_DEVICE_SPKI_SHA256'],
    privateKeysRead:false,automaticOwnerApproval:false,signingImplemented:false});
  if(args.length===4&&args[0]==='--verify-issuer')return verifyOriginalIssuerHeartbeat({
    packet:readJson(args[1]),deviceCandidate:readJson(args[2]),
    independentlyObservedDeviceSpki:args[3]});
  if(args.length===11&&args[0]==='--preflight')return assessControlledTestReadiness({
    observation:readJson(args[1]),challenge:readJson(args[2]),
    sourceReview:readJson(args[3]),masterReview:readJson(args[4]),
    request:readJson(args[5]),sourceApproval:readJson(args[6]),
    masterApproval:readJson(args[7]),packet:readJson(args[8]),
    deviceCandidate:readJson(args[9]),independentlyObservedDeviceSpki:args[10]});
  throw Error('DENY_QL346_UNKNOWN_OR_LIVE_ENROLLMENT_ACTION');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(ql346Cli())+'\n');}
  catch{process.stderr.write('HOLD_QL346_PRIVATE_TEST_ENROLLMENT_NOT_AUTHORIZED\n');process.exitCode=1;}
}
