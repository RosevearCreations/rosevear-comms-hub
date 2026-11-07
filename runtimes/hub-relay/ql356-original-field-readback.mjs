/** QL-356: exact public-only Ree/Jack handoff and independently verified first TEST.
 * No key material is decrypted here. The original issuer/witness trust roots
 * are held by independent reviewers, not the request, browser or this checkout.
 */
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectPublicAuthorityCandidate} from './owner-authority-custody.mjs';
import {hashWitnessFiles,inspectEnrollmentRequest} from './ql340b-enrollment.mjs';
import {verifyQl355Authority,acceptQl355FirstPrivateTest} from './ql355-independent-authority.mjs';

export const QL356_SCHEMA='rosevear.hub.ql356.original-field-acceptance.v1';
const witnessFields=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const hold=(state,extra={})=>({schema:QL356_SCHEMA,state,
  requestReviewed:false,originalIssuerAuthenticated:false,
  independentWitnessAuthenticated:false,ownersIndependentlyApproved:false,
  databaseEnrollmentVerified:false,firstPrivateTestAccepted:false,
  receiverActivated:false,connected:false,connectionState:'DISCONNECTED / HOLD',
  customerCommunications:false,deviceActions:false,sourceRepositoryWrites:0,
  databaseWrites:0,...extra});

/** Compare the actual original owner's candidate to the request, not merely
 * the reviewer's screenshot or a JSON boolean. Jack is not required to import
 * Ree's four private witness files to check his own pinned public key. */
export function inspectQl356OwnerPublicRequest({request,localCandidate,role,
  evidencePaths,now=Date.now()}={}){
  if(!['source','master'].includes(role))return hold('DENY_UNEXPECTED_ORIGINAL_OWNER_ROLE');
  const inspected=inspectEnrollmentRequest(request,now);
  if(!inspected.valid)return hold(inspected.state);
  const local=inspectPublicAuthorityCandidate(localCandidate,role);
  if(!local.verified||localCandidate?.keyId!==request.ownerAuthorityPins[role].keyId||
    localCandidate.publicKeyPem!==request.ownerAuthorityPins[role].publicKeyPem||
    localCandidate.spkiSha256!==inspected[`${role}SpkiSha256`])
    return hold('DENY_OWNER_KEY_NOT_ORIGINAL_LOCAL_CANDIDATE');
  const common={ownerRole:role,localOwnerPublicPinMatches:true,
    payloadSha256:inspected.payloadSha256,expiresAt:inspected.expiresAt,
    ownerKeyId:localCandidate.keyId,ownerSpkiSha256:localCandidate.spkiSha256};
  if(evidencePaths===undefined)return hold('OWNER_PUBLIC_KEY_MATCHED_REMOTE_ORIGINAL_WITNESS_BYTES_NOT_REVIEWED',common);
  try{
    const digests=hashWitnessFiles(evidencePaths);
    if(witnessFields.some(field=>digests[field]!==request.payload[field]))
      return hold('DENY_ORIGINAL_FOUR_WITNESS_BYTES_CHANGED',common);
    return hold('PUBLIC_OWNER_PIN_AND_FOUR_WITNESSES_MATCH_REVIEW_ONLY',{
      ...common,requestReviewed:true,originalWitnessBytesMatch:true});
  }catch{return hold('HOLD_ORIGINAL_FOUR_WITNESS_FILES_UNAVAILABLE',common);}
}

/** Only separate original issuer and separate independent witness signatures
 * verified against their externally controlled pins can clear custody review.
 * Never auto-upgrade a public-only request into an owner authorization. */
export async function inspectQl356IndependentIssuerPins({request,
  issuerAttestation,witnessAttestation,resolvePinnedAuthority,
  verifyIndependentCustody,now=Date.now()}={}){
  const r=inspectEnrollmentRequest(request,now);
  if(!r.valid)return hold(r.state);
  if(typeof resolvePinnedAuthority!=='function'||typeof verifyIndependentCustody!=='function')
    return hold('HOLD_INDEPENDENT_ORIGINAL_PIN_CUSTODIANS_REQUIRED');
  const [issuer,witness]=await Promise.all([
    verifyQl355Authority({attestation:issuerAttestation,role:'original_issuer',
      payloadSha256:r.payloadSha256,resolvePinnedAuthority,verifyIndependentCustody,now}),
    verifyQl355Authority({attestation:witnessAttestation,role:'field_witness',
      payloadSha256:r.payloadSha256,resolvePinnedAuthority,verifyIndependentCustody,now})]);
  if(issuer.verified!==true||witness.verified!==true||
    issuer.spkiSha256===witness.spkiSha256||
    [issuer.spkiSha256,witness.spkiSha256].includes(r.sourceSpkiSha256)||
    [issuer.spkiSha256,witness.spkiSha256].includes(r.masterSpkiSha256))
    return hold('HOLD_GENUINE_DISTINCT_ISSUER_AND_FIELD_WITNESS_REQUIRED');
  return hold('TWO_INDEPENDENT_EXTERNAL_PIN_CUSTODIES_VERIFIED_OWNER_SIGNATURES_STILL_REQUIRED',{
    originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
    payloadSha256:r.payloadSha256,issuerSpkiSha256:issuer.spkiSha256,
    witnessSpkiSha256:witness.spkiSha256,
    expiresAt:r.expiresAt});
}

/** Even one genuine signed TEST remains separate from all six source grants. */
export async function inspectQl356FirstFieldReceipt(options={}){
  const result=await acceptQl355FirstPrivateTest(options);
  if(result.firstPrivateTestAccepted!==true)return hold(result.state);
  return hold('ONE_GENUINE_ORIGINAL_DEVICE_FIELD_TEST_ACCEPTED_SIX_PEERS_HELD',{
    firstPrivateTestAccepted:true,originalTestReceiptVerified:true,
    authenticatedPrivateOperator:true,receiptCount:1,
    deviceId:result.deviceId,receivedAt:result.receivedAt});
}

const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
export function ql356Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return hold('OFFLINE_FIELD_READBACK_ONLY',{
    commands:['--inspect-request source|master REQUEST LOCAL_OWNER_PUBLIC_CANDIDATE [FOUR_EVIDENCE_PATHS_JSON]'],
    privateKeyAccess:false,networkRequests:0});
  if((args.length===4||args.length===5)&&args[0]==='--inspect-request'){
    const [,role,request,candidate,paths]=args;
    return inspectQl356OwnerPublicRequest({role,request:readJson(request),
      localCandidate:readJson(candidate),evidencePaths:paths?readJson(paths):undefined});
  }
  throw Error('DENY_UNSUPERVISED_QL356_SIGNATURE_DATABASE_OR_RECEIVER_ACTION');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(ql356Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL356_ORIGINAL_FIELD_REVIEW: ${error.message}\n`);process.exitCode=1;}
}
