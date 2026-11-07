/** QL-358: original field, dedicated receiver credential and first live TEST.
 * Trusted issuer roots, custody checks, private DB sessions and real Windows
 * DPAPI storage are supplied outside this module; no public/self-attested
 * file, boolean, password or HTTP status can authorize an activation.
 */
import {createHash} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {inspectQl354SignedIntake} from './ql354-original-owner-intake.mjs';
import {inspectQl356IndependentIssuerPins} from './ql356-original-field-readback.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';
import {acceptQl357OneCrossDeviceTest} from './ql357-original-activation.mjs';

export const QL358_SCHEMA='rosevear.hub.ql358.original-field-credential-live-test.v1';
const fieldTickets=new WeakSet();
const receiverTickets=new WeakSet();
const held=(state,other={})=>({schema:QL358_SCHEMA,state,
  originalIssuerAuthenticated:false,independentWitnessAuthenticated:false,
  ownersIndependentlyApproved:false,databaseEnrollmentVerified:false,
  dedicatedReceiverCredentialVerified:false,firstLiveTestReceiptVerified:false,
  receiverActivated:false,connected:false,connectedCount:0,
  customerCommunications:false,deviceActions:false,sourceRepositoryWrites:0,
  connectionState:'DISCONNECTED / HOLD',...other});
const digest=value=>createHash('sha256').update(canonicalize(value)).digest('hex');

const exactHeldPeers=rows=>Array.isArray(rows)&&rows.length===6&&
  validateSixHeldPeers(rows).length===6;

/** This is a *read-only* original administrator reconciliation. The separate
 * QL-357 one-use signed enrollment transaction must already be committed.
 * The returned ticket exists only in this process; JSON cannot recreate it. */
export async function inspectQl358OriginalFieldAndEnrollment({request,enrollment,pins,
  candidates,evidencePaths,issuerAttestation,witnessAttestation,
  resolvePinnedAuthority,verifyIndependentCustody,adminQuery,now=Date.now()}={}){
  if(typeof adminQuery!=='function'||!Number.isFinite(now))
    return held('HOLD_ORIGINAL_PRIVATE_ADMINISTRATOR_READBACK_REQUIRED');
  const signed=inspectQl354SignedIntake({request,enrollment,pins,candidates,
    evidencePaths,now});
  if(signed.ownerSignaturesVerified!==true||signed.originalWitnessBytesMatch!==true)
    return held('HOLD_REE_JACK_SIGNED_EXACT_ORIGINAL_FOUR_WITNESSES_REQUIRED');
  const independent=await inspectQl356IndependentIssuerPins({request,
    issuerAttestation,witnessAttestation,resolvePinnedAuthority,
    verifyIndependentCustody,now});
  if(independent.originalIssuerAuthenticated!==true||
    independent.independentWitnessAuthenticated!==true||
    independent.payloadSha256!==signed.payloadSha256)
    return held('HOLD_DISTINCT_EXTERNALLY_PINNED_ISSUER_AND_WITNESS_REQUIRED');
  const evidence={originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
    ownersIndependentlyApproved:true,payloadSha256:signed.payloadSha256};
  try{
    const role=await adminQuery('SELECT current_user AS administrator_role');
    if(role.rows?.[0]?.administrator_role!=='postgres')
      return held('DENY_NONORIGINAL_ADMINISTRATOR_READBACK',evidence);
    const actual=await adminQuery(`SELECT enrollment_record FROM public.master_hub_device_enrollments_ql339b
      WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
        AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`);
    if(actual.rows?.length!==1||
      canonicalize(actual.rows[0].enrollment_record)!==canonicalize(enrollment))
      return held('HOLD_EXACT_ORIGINAL_SIGNED_DATABASE_ENROLLMENT_NOT_FOUND',evidence);
    const revoked=await adminQuery(`SELECT count(revocation_id)::int AS count
      FROM public.master_hub_device_revocations_ql339b WHERE device_id='rosevear-windows-hub'
        AND workload_id='hub-probe' AND key_id='hub-ql339b'`);
    const receipts=await adminQuery('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
    const peers=await adminQuery(`SELECT peer_id,peer_kind,source_repo,connection_state,
      source_test_authorized,customer_data_allowed FROM public.master_hub_private_peers_ql341`);
    if(revoked.rows?.[0]?.count!==0||receipts.rows?.[0]?.count!==0||
      !exactHeldPeers(peers.rows))
      return held('HOLD_ZERO_REVOCATIONS_ZERO_RECEIPTS_SIX_PEERS_HELD_REQUIRED',evidence);
    const ticket=Object.freeze(held('ORIGINAL_ENROLLMENT_AUTHENTICATED_CREDENTIAL_PROVISIONING_OWNER_ONLY',{
      ...evidence,databaseEnrollmentVerified:true,
      issuedAt:now,expiresAt:Math.min(Date.parse(request.payload.expiresAt),now+90_000),
      nextAction:'Original administrator separately approves limited role and dedicated secret; Ree stores it only with QL-340C current-user DPAPI'}));
    fieldTickets.add(ticket);
    return ticket;
  }catch{return held('HOLD_ORIGINAL_ADMINISTRATOR_READBACK_UNAVAILABLE',evidence);}
}

/** The original operator stores the approved URL under Windows DPAPI using
 * the existing QL-340C prompt, not here. An independently authenticated
 * limited-role connection now proves the correct credential and six HELD
 * records; the in-memory field ticket is consumed even on failure. */
export async function verifyQl358DedicatedReceiverSession({fieldTicket,
  withOriginalReeDpapiReceiverSession,now=Date.now()}={}){
  if(!fieldTickets.has(fieldTicket)||typeof withOriginalReeDpapiReceiverSession!=='function'||
    !Number.isFinite(now)||now>=fieldTicket.expiresAt)
    return held('HOLD_ORIGINAL_FIELD_TICKET_AND_REE_DPAPI_CREDENTIAL_REQUIRED');
  fieldTickets.delete(fieldTicket);
  try{
    let checked=false;
    const result=await withOriginalReeDpapiReceiverSession(async query=>{
      const identity=await query('SELECT current_user AS receiver_role');
      if(identity.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
        throw Error('DENY_NOT_DEDICATED_RECEIVER_ROLE');
      const actual=await query(`SELECT enrollment_record FROM public.master_hub_device_enrollments_ql339b
        WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
          AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`);
      if(actual.rows?.length!==1||
        digest(actual.rows[0].enrollment_record?.payload)!==fieldTicket.payloadSha256)
        throw Error('DENY_DIFFERENT_ENROLLMENT');
      const receipts=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
      const peers=await query(`SELECT peer_id,peer_kind,source_repo,connection_state,
        source_test_authorized,customer_data_allowed FROM public.master_hub_private_peers_ql341`);
      if(receipts.rows?.[0]?.count!==0||!exactHeldPeers(peers.rows))
        throw Error('HOLD_PRIVATE_RECEIVER_NO_PRIOR_RECEIPT_AND_SIX_HELD_REQUIRED');
      checked=true;
      return true;
    });
    if(result!==true||checked!==true)
      return held('HOLD_PRIVATE_DPAPI_RECEIVER_SESSION_NOT_VERIFIED');
    const ticket=Object.freeze(held('ORIGINAL_LIMITED_RECEIVER_SESSION_VERIFIED_ONE_TEST_ONLY',{
      originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
      ownersIndependentlyApproved:true,databaseEnrollmentVerified:true,
      dedicatedReceiverCredentialVerified:true,issuedAt:now,
      expiresAt:Math.min(fieldTicket.expiresAt,now+45_000)}));
    receiverTickets.add(ticket);
    return ticket;
  }catch{return held('HOLD_WRONG_ROLE_ENROLLMENT_OR_UNAUTHENTICATED_DPAPI_SESSION');}
}

/** Only the genuine device-signed packet and exactly one immutable real DB
 * receipt can close the TEST; the six application grants remain HELD. */
export async function reconcileQl358FirstLiveTest({receiverTicket,
  now=Date.now(),...originalReceiptInputs}={}){
  if(!receiverTickets.has(receiverTicket)||!Number.isFinite(now)||
    now>=receiverTicket.expiresAt)
    return held('HOLD_ORIGINAL_SINGLE_USE_RECEIVER_TICKET_REQUIRED');
  receiverTickets.delete(receiverTicket);
  const result=await acceptQl357OneCrossDeviceTest({...originalReceiptInputs,now});
  if(result.firstPrivateTestAccepted!==true||result.originalTestReceiptVerified!==true||
    result.originalReceiptCount!==1||result.deviceId!=='rosevear-windows-hub')
    return held('HOLD_REAL_ORIGINAL_DEVICE_SIGNATURE_AND_ONE_IMMUTABLE_RECEIPT_REQUIRED',{
      reconciliationState:result.state});
  return held('FIRST_AUTHENTIC_ORIGINAL_TEST_RECEIPT_RECONCILED_SIX_APPS_HELD',{
    originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
    ownersIndependentlyApproved:true,databaseEnrollmentVerified:true,
    dedicatedReceiverCredentialVerified:true,firstLiveTestReceiptVerified:true,
    verifiedReceiptCount:1,deviceId:result.deviceId,receivedAt:result.receivedAt});
}

export function ql358Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('PRIVATE_ORIGINAL_OWNER_FIELD_GUIDE_ONLY',{
    commands:['--help'],credentialExports:0,roleGrants:0,receiverStarts:0,
    databaseWrites:0,networkRequests:0,privateKeyAccess:false});
  throw Error('DENY_UNSUPERVISED_QL358_CREDENTIAL_ENROLLMENT_OR_LIVE_TEST');
}
if(process.argv[1]&&process.argv[1].endsWith('ql358-field-credential-reconciliation.mjs')){
  try{process.stdout.write(JSON.stringify(ql358Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL358_ORIGINAL_FIELD: ${error.message}\n`);process.exitCode=1;}
}
