/** QL-357: private original-owner enrollment and single TEST acceptance.
 * No caller-supplied approval booleans, public routes, database credentials,
 * automatic receiver start, device action or customer communications.
 */
import {canonicalize} from '../master-discovery/manifest.mjs';
import {inspectQl354SignedIntake,insertQl354OriginalEnrollmentOnce} from './ql354-original-owner-intake.mjs';
import {authorizeQl355OriginalCeremony,acceptQl355FirstPrivateTest} from './ql355-independent-authority.mjs';
import {inspectQl356IndependentIssuerPins} from './ql356-original-field-readback.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';
export const QL357_SCHEMA='rosevear.hub.ql357.original-private-test-activation.v1';
const hold=(state,other={})=>({schema:QL357_SCHEMA,state,
  originalIssuerAuthenticated:false,independentWitnessAuthenticated:false,
  ownersIndependentlyApproved:false,databaseEnrollmentVerified:false,
  receiverReadyForOneTest:false,firstPrivateTestAccepted:false,
  receiverActivated:false,connected:false,connectedCount:0,
  sourceTestAuthorized:false,customerCommunications:false,deviceActions:false,
  sourceRepositoryWrites:0,connectionState:'DISCONNECTED / HOLD',...other});

/** The *only* enrollment write is QL-354's single-use original-owner permit,
 * protected by a private administrator transaction. A failed attempt cannot
 * be retried with the same permit; no JSON proof can manufacture it. */
export async function executeQl357SupervisedEnrollment({request,enrollment,pins,
  candidates,evidencePaths,issuerAttestation,witnessAttestation,
  resolvePinnedAuthority,verifyIndependentCustody,adminTransaction,
  now=Date.now()}={}){
  if(typeof adminTransaction!=='function')return hold('HOLD_PRIVATE_ORIGINAL_ADMINISTRATOR_TRANSACTION_REQUIRED');
  const permit=await authorizeQl355OriginalCeremony({request,enrollment,pins,
    candidates,evidencePaths,issuerAttestation,witnessAttestation,
    resolvePinnedAuthority,verifyIndependentCustody,now});
  if(permit.state!=='INDEPENDENT_ORIGINAL_AUTHORITY_VERIFIED_ONE_ENROLLMENT_ONLY')
    return hold('HOLD_REE_JACK_AND_INDEPENDENT_ISSUER_WITNESS_SIGNED_ENROLLMENT_REQUIRED');
  const result=await insertQl354OriginalEnrollmentOnce({permit,
    transaction:adminTransaction,now});
  if(result.databaseEnrollmentCreated!==true)
    return hold('HOLD_ORIGINAL_ADMIN_TRANSACTION_NOT_COMMITTED_NO_AUTOMATIC_RETRY');
  return hold('ONE_ORIGINAL_ENROLLMENT_WRITTEN_PRIVATE_RECEIVER_STILL_OFF',{
    originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
    ownersIndependentlyApproved:true,databaseEnrollmentWritten:true,
    enrollmentId:result.enrollmentId,
    payloadSha256:result.payloadSha256,
    // Kept only in process. JSON serialization loses QL-354's WeakSet custody;
    // the next challenge still requires the exact authenticated receiver role.
    recordedTicket:result.recordedTicket});
}

/** A private, readonly readiness gate: independent Ed25519 issuer/witness
 * roots, original signed owner enrollment, limited DB role, exact database
 * record and six HELD peers, plus live operator+Tailnet proof. No one of these
 * witnesses is replaceable by a client or local JSON approval flag. */
export async function inspectQl357PrivateReceiverReadiness({request,enrollment,
  pins,candidates,evidencePaths,issuerAttestation,witnessAttestation,
  resolvePinnedAuthority,verifyIndependentCustody,query,
  verifyPrivateOperator,verifyOriginalTransport,now=Date.now()}={}){
  if(typeof query!=='function'||typeof verifyPrivateOperator!=='function'||
    typeof verifyOriginalTransport!=='function')
    return hold('HOLD_ORIGINAL_LIMITED_DB_OPERATOR_AND_TRANSPORT_VERIFIERS_REQUIRED');
  const signed=inspectQl354SignedIntake({request,enrollment,pins,candidates,
    evidencePaths,now});
  if(signed.ownerSignaturesVerified!==true||signed.originalWitnessBytesMatch!==true)
    return hold('HOLD_EXACT_REE_JACK_SIGNED_ORIGINAL_WITNESS_PROOF_REQUIRED');
  const external=await inspectQl356IndependentIssuerPins({request,
    issuerAttestation,witnessAttestation,resolvePinnedAuthority,
    verifyIndependentCustody,now});
  if(external.originalIssuerAuthenticated!==true||
    external.independentWitnessAuthenticated!==true||
    external.payloadSha256!==signed.payloadSha256)
    return hold('HOLD_INDEPENDENT_ORIGINAL_ISSUER_AND_WITNESS_PINS_REQUIRED');
  const evidence={originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
    ownersIndependentlyApproved:true,payloadSha256:signed.payloadSha256};
  try{
    const identity=await query('SELECT current_user AS receiver_role');
    if(identity.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
      return hold('DENY_NOT_ORIGINAL_LIMITED_RECEIVER_DB_ROLE',evidence);
    const original=await query(`SELECT enrollment_record FROM public.master_hub_device_enrollments_ql339b
      WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
        AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`);
    if(original.rows?.length!==1||
      canonicalize(original.rows[0].enrollment_record)!==canonicalize(enrollment))
      return hold('HOLD_EXACT_ORIGINAL_SIGNED_DB_ENROLLMENT_NOT_OBSERVED',evidence);
    const revoked=await query(`SELECT count(revocation_id)::int AS count
      FROM public.master_hub_device_revocations_ql339b
      WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe' AND key_id='hub-ql339b'`);
    const receipts=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
    const peers=await query(`SELECT peer_id,peer_kind,source_repo,connection_state,
      source_test_authorized,customer_data_allowed FROM public.master_hub_private_peers_ql341`);
    if(revoked.rows?.[0]?.count!==0||receipts.rows?.[0]?.count!==0||
      validateSixHeldPeers(peers.rows).length!==6)
      return hold('HOLD_NO_REVOCATION_NO_PREVIOUS_RECEIPT_SIX_PEERS_HELD_REQUIRED',evidence);
    const operator=await verifyPrivateOperator();
    if(operator?.state!=='ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION'||
      operator.originalComputer!=='DESKTOP-AE894KC'||
      operator.replayOrRevocationFound!==false||
      !Number.isFinite(operator.expiresAt)||operator.expiresAt<=now)
      return hold('HOLD_AUTHENTIC_ORIGINAL_PRIVATE_OPERATOR_SESSION_REQUIRED',evidence);
    const transport=await verifyOriginalTransport();
    if(transport?.state!=='ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED'||
      transport.originalComputer!=='DESKTOP-AE894KC'||
      transport.peerIp!=='100.114.56.26'||transport.boundIp!=='100.77.246.3'||
      transport.tlsPort!==8443||transport.tlsVerified!==true||
      transport.privateReceiverLoopbackVerified!==true||
      !Number.isFinite(transport.observedAt)||Math.abs(now-transport.observedAt)>30_000)
      return hold('HOLD_AUTHENTIC_ORIGINAL_TAILNET_TRANSPORT_REQUIRED',evidence);
    return hold('ORIGINAL_PRIVATE_RECEIVER_VERIFIED_READY_FOR_ONE_SUPERVISED_TEST',{
      ...evidence,databaseEnrollmentVerified:true,receiverReadyForOneTest:true,
      authorizedTestScope:['health.read','capabilities.read'],
      nextAction:'One fresh device-signed TEST and one exact immutable database receipt; no six-app activation'});
  }catch{return hold('HOLD_PRIVATE_DATABASE_OR_ORIGINAL_FIELD_READBACK_FAILED',evidence);}
}

/** Receipt verification is delegated to the original cryptographic and
 * PostgreSQL reconciler; matching an HTTP status or a screenshot is not proof. */
export async function acceptQl357OneCrossDeviceTest(options={}){
  const result=await acceptQl355FirstPrivateTest(options);
  if(result.firstPrivateTestAccepted!==true||result.originalTestReceiptVerified!==true||
    result.receiptCount!==1||result.deviceId!=='rosevear-windows-hub')
    return hold('HOLD_ONE_GENUINE_DEVICE_SIGNATURE_AND_IMMUTABLE_DB_RECEIPT_REQUIRED');
  return hold('ONE_ORIGINAL_CROSS_DEVICE_TEST_RECEIPT_VERIFIED_SIX_APPS_STILL_HELD',{
    firstPrivateTestAccepted:true,originalTestReceiptVerified:true,
    originalReceiptCount:1,deviceId:result.deviceId,receivedAt:result.receivedAt});
}

export function ql357Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return hold('OWNER_SUPERVISED_PRIVATE_FIELD_GUIDE_ONLY',{
    commands:['--help'],databaseWrites:0,receiverStarts:0,
    privateKeyAccess:false,networkRequests:0});
  throw Error('DENY_UNSUPERVISED_QL357_ENROLLMENT_RECEIVER_START_OR_DEVICE_SIGNING');
}
if(process.argv[1]&&process.argv[1].endsWith('ql357-original-activation.mjs')){
  try{process.stdout.write(JSON.stringify(ql357Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL357_ORIGINAL_ACTIVATION: ${error.message}\n`);process.exitCode=1;}
}
