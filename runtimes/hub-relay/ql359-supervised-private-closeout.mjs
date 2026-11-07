/** QL-359: supervised private TEST closeout on the original Ree host.
 * A release, local candidate, HTTP response or self-signed JSON is not trust.
 * All verifiers are independently authenticated server-side capabilities;
 * this module never creates a pin, credentials, approval or receiver listener.
 */
import {createHash,createPublicKey,timingSafeEqual,verify} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {reconcileQl358FirstLiveTest} from './ql358-field-credential-reconciliation.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';

export const QL359_SCHEMA='rosevear.hub.ql359.original-supervised-private-test.v1';
export const QL359_CLOSEOUT_ATTESTATION='rosevear.hub.ql359.independent-closeout-witness.v1';
const verifiedCloseouts=new WeakSet();
const SHA=/^[a-f0-9]{64}$/;
const held=(state,other={})=>({schema:QL359_SCHEMA,state,
  originalIssuerAuthenticated:false,independentWitnessAuthenticated:false,
  ownersIndependentlyApproved:false,databaseEnrollmentVerified:false,
  dedicatedReceiverCredentialVerified:false,supervisedReceiverStopVerified:false,
  independentCloseoutWitnessVerified:false,firstPrivateTestReceiptVerified:false,
  receiverActivated:false,connected:false,connectedCount:0,
  customerCommunications:false,deviceActions:false,sourceRepositoryWrites:0,
  connectionState:'DISCONNECTED / HOLD',...other});
const sha=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const equalSha=(a,b)=>SHA.test(a??'')&&SHA.test(b??'')&&
  timingSafeEqual(Buffer.from(a,'hex'),Buffer.from(b,'hex'));

/** A separate witness must sign this specific POST-TEST transcript with its
 * previously pinned external Ed25519 key. Never take the verifying PEM from
 * the attestation itself, and never treat an approval boolean as a signature. */
export async function verifyQl359CloseoutWitness({attestation,sessionId,
  transcriptSha256,resolvePinnedAuthority,verifyIndependentCustody,
  now=Date.now()}={}){
  if(typeof resolvePinnedAuthority!=='function'||
    typeof verifyIndependentCustody!=='function'||!Number.isFinite(now)||
    !SHA.test(transcriptSha256??'')||typeof sessionId!=='string'||!sessionId)
    return held('HOLD_PREEXISTING_INDEPENDENT_WITNESS_PIN_AND_CUSTODY_REQUIRED');
  try{
    const body=attestation?.payload;
    if(attestation?.schema!==QL359_CLOSEOUT_ATTESTATION||
      body?.schema!==QL359_CLOSEOUT_ATTESTATION||body.role!=='field_witness'||
      body.audience!=='rosevear-comms-hub:original-private-test:TEST'||
      body.scope!=='first-original-private-test-closeout-only'||
      body.sessionId!==sessionId||!equalSha(body.transcriptSha256,transcriptSha256)||
      !/^[A-Za-z0-9_-]{86}$/.test(attestation.signature??'')||
      !Number.isFinite(Date.parse(body.issuedAt??''))||
      !Number.isFinite(Date.parse(body.expiresAt??''))||
      body.issuedAt!==new Date(Date.parse(body.issuedAt)).toISOString()||
      body.expiresAt!==new Date(Date.parse(body.expiresAt)).toISOString()||
      Date.parse(body.issuedAt)>now+30_000||Date.parse(body.expiresAt)<=now||
      Date.parse(body.expiresAt)-Date.parse(body.issuedAt)>90_000)
      return held('DENY_UNSCOPED_EXPIRED_OR_CHANGED_ORIGINAL_CLOSEOUT_ATTESTATION');
    const pin=await resolvePinnedAuthority('field_witness');
    if(pin?.role!=='field_witness'||!SHA.test(pin.spkiSha256??'')||
      typeof pin.publicKeyPem!=='string'||pin.publicKeyPem.length>2000)
      return held('HOLD_ORIGINAL_EXTERNAL_CLOSEOUT_WITNESS_PIN_NOT_FOUND');
    const key=createPublicKey(pin.publicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      !equalSha(createHash('sha256').update(key.export({type:'spki',format:'der'}))
        .digest('hex'),pin.spkiSha256))
      return held('DENY_ORIGINAL_CLOSEOUT_PIN_FINGERPRINT_MISMATCH');
    const custody=await verifyIndependentCustody({role:'field_witness',
      spkiSha256:pin.spkiSha256,requestSha256:transcriptSha256});
    if(custody?.role!=='field_witness'||custody.authenticated!==true||
      custody.revoked!==false||!equalSha(custody.spkiSha256,pin.spkiSha256)||
      !equalSha(custody.requestSha256,transcriptSha256))
      return held('HOLD_ORIGINAL_CLOSEOUT_WITNESS_CUSTODY_UNAUTHENTICATED');
    const signature=Buffer.from(attestation.signature,'base64url');
    if(signature.length!==64||!verify(null,Buffer.from(canonicalize(body)),key,signature))
      return held('DENY_ORIGINAL_CLOSEOUT_WITNESS_SIGNATURE_INVALID');
    return {schema:QL359_SCHEMA,state:'INDEPENDENT_ORIGINAL_CLOSEOUT_WITNESS_SIGNATURE_VERIFIED',
      verified:true,transcriptSha256,sessionId,witnessSpkiSha256:pin.spkiSha256};
  }catch{return held('HOLD_ORIGINAL_CLOSEOUT_WITNESS_VERIFICATION_UNAVAILABLE');}
}

/** The QL-358 receiver ticket is an in-process, single-use capability.
 * It is consumed BEFORE closeout, including when the receipt fails. A second
 * invocation or JSON copy cannot pass. The original device, operator and
 * Tailnet cryptographic checks remain delegated to QL-358 / QL-355.
 *
 * The closeout callbacks MUST be separate original-host authenticated probes
 * and independently authenticated witness custody checks, never caller JSON
 * or self-selected public keys. All post-TEST database reads are read-only.
 */
export async function reconcileQl359SupervisedPrivateTest({receiverTicket,
  challenge,packet,pins,query,verifyPrivateOperator,verifyOriginalTransport,
  verifyOriginalReceiverStopped,witnessAttestation,resolvePinnedAuthority,
  verifyIndependentCustody,
  now=Date.now()}={}){
  if(typeof query!=='function'||typeof verifyOriginalReceiverStopped!=='function'||
    typeof resolvePinnedAuthority!=='function'||
    typeof verifyIndependentCustody!=='function'||!Number.isFinite(now))
    return held('HOLD_ORIGINAL_PRIVATE_DB_STOP_AND_INDEPENDENT_WITNESS_REQUIRED');

  const accepted=await reconcileQl358FirstLiveTest({receiverTicket,challenge,packet,
    pins,query,verifyPrivateOperator,verifyOriginalTransport,now});
  if(accepted.firstLiveTestReceiptVerified!==true||accepted.verifiedReceiptCount!==1)
    return held('HOLD_ORIGINAL_ONE_USE_TICKET_AND_REAL_DEVICE_RECEIPT_REQUIRED',{
      upstreamState:accepted.state});
  const sessionId=challenge?.envelope?.sessionId;
  const nonce=challenge?.envelope?.nonce;
  if(typeof sessionId!=='string'||!sessionId||typeof nonce!=='string'||!nonce||
    packet?.envelope?.sessionId!==sessionId||packet?.envelope?.nonce!==nonce)
    return held('DENY_CHANGED_OR_UNBOUND_PRIVATE_TEST_TRANSCRIPT');
  const transcriptSha256=sha({sessionId,nonce,deviceId:accepted.deviceId,
    signedEnvelopeSha256:sha(packet.envelope),packetSignature:packet.signature,
    originalReceiptAt:String(accepted.receivedAt)});
  try{
    const stop=await verifyOriginalReceiverStopped({sessionId,nonce,transcriptSha256});
    if(stop?.state!=='ORIGINAL_REE_RECEIVER_STOPPED_SUPERVISED'||
      stop.originalComputer!=='DESKTOP-AE894KC'||stop.originalUser!=='Ree'||
      stop.privateReceiverPort!==8788||stop.listenerCount!==0||
      stop.sessionId!==sessionId||stop.transcriptSha256!==transcriptSha256||
      !Number.isFinite(stop.observedAt)||Math.abs(now-stop.observedAt)>30_000)
      return held('HOLD_ORIGINAL_REE_RECEIVER_STOP_NOT_INDEPENDENTLY_OBSERVED');

    const witness=await verifyQl359CloseoutWitness({attestation:witnessAttestation,
      sessionId,transcriptSha256,resolvePinnedAuthority,verifyIndependentCustody,now});
    if(witness.verified!==true)
      return held('HOLD_INDEPENDENT_ORIGINAL_CLOSEOUT_WITNESS_REQUIRED');

    const identity=await query('SELECT current_user AS receiver_role');
    const receipts=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
    const revocations=await query(`SELECT count(revocation_id)::int AS count
      FROM public.master_hub_device_revocations_ql339b WHERE device_id='rosevear-windows-hub'
        AND workload_id='hub-probe' AND key_id='hub-ql339b'`);
    const peers=await query(`SELECT peer_id,peer_kind,source_repo,connection_state,
      source_test_authorized,customer_data_allowed FROM public.master_hub_private_peers_ql341`);
    if(identity.rows?.[0]?.receiver_role!=='ql340c_private_receiver'||
      receipts.rows?.[0]?.count!==1||revocations.rows?.[0]?.count!==0||
      !Array.isArray(peers.rows)||peers.rows.length!==6||
      validateSixHeldPeers(peers.rows).length!==6)
      return held('HOLD_POST_TEST_RECEIPT_REVOCATION_OR_SIX_HELD_PEER_DRIFT');

    const result=Object.freeze(held('ONE_SUPERVISED_ORIGINAL_PRIVATE_TEST_CLOSED_SIX_PEERS_STILL_HELD',{
      originalIssuerAuthenticated:true,independentWitnessAuthenticated:true,
      ownersIndependentlyApproved:true,databaseEnrollmentVerified:true,
      dedicatedReceiverCredentialVerified:true,supervisedReceiverStopVerified:true,
      independentCloseoutWitnessVerified:true,firstPrivateTestReceiptVerified:true,
      verifiedReceiptCount:1,deviceId:accepted.deviceId,sessionId,
      transcriptSha256,independentWitnessPinSha256:witness.witnessSpkiSha256,
      closedAt:new Date(now).toISOString()}));
    verifiedCloseouts.add(result);
    return result;
  }catch{return held('HOLD_ORIGINAL_POST_TEST_READBACK_OR_CLOSEOUT_FAILED');}
}

/** QL-360 archive can consume the genuine QL-359 closeout once. JSON copies,
 * forged booleans, expired receipts and replays are NOT capabilities. */
export function consumeQl359VerifiedCloseoutForArchive({closeout,now=Date.now()}={}){
  if(!Number.isFinite(now)||!verifiedCloseouts.has(closeout))return null;
  verifiedCloseouts.delete(closeout);
  const closedAt=Date.parse(closeout.closedAt);
  if(!Number.isFinite(closedAt)||now<closedAt||now-closedAt>90_000||
    closeout.firstPrivateTestReceiptVerified!==true||
    closeout.independentCloseoutWitnessVerified!==true||
    closeout.supervisedReceiverStopVerified!==true||
    closeout.verifiedReceiptCount!==1||closeout.connected!==false||
    !SHA.test(closeout.transcriptSha256??'')||
    !SHA.test(closeout.independentWitnessPinSha256??''))return null;
  return Object.freeze({closedAt,deviceId:closeout.deviceId,
    sessionId:closeout.sessionId,transcriptSha256:closeout.transcriptSha256,
    independentWitnessPinSha256:closeout.independentWitnessPinSha256});
}

export function ql359Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('SUPERVISED_PRIVATE_TEST_OWNER_GUIDE_ONLY',{
    commands:['--help'],credentialWrites:0,roleGrants:0,receiverStarts:0,
    databaseWrites:0,networkRequests:0,privateKeyAccess:false});
  throw Error('DENY_UNSUPERVISED_QL359_ORIGINAL_AUTHORITY_OR_PRIVATE_TEST');
}
if(process.argv[1]?.endsWith('ql359-supervised-private-closeout.mjs')){
  try{process.stdout.write(JSON.stringify(ql359Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL359: ${error.message}\n`);process.exitCode=1;}
}
