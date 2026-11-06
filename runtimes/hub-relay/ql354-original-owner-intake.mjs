/** QL-354: original-owner enrollment intake and ONE nonproduction device challenge.
 * Private Node-only. Neither a public file nor this module can authenticate an
 * original issuer, independently witness a field decision, or issue a DB login.
 */
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {hashWitnessFiles,inspectEnrollmentRequest,verifiedCandidatePins} from './ql340b-enrollment.mjs';
import {verifyDeviceEnrollment} from './enrollment.mjs';
import {verifySignedTestReceipt} from './ql341-private-readback.mjs';

export const QL354_SCHEMA='rosevear.hub.ql354.original-enrollment-intake.v1';
export const QL354_CHALLENGE='rosevear.hub.ql354.one-test-challenge.v1';
const witnessFields=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const sha=value=>createHash('sha256').update(value).digest('hex');
const SHA=/^[a-f0-9]{64}$/;
const held=(state,other={})=>({schema:QL354_SCHEMA,state,approved:false,
  databaseEnrollmentCreated:false,receiverActivated:false,connected:false,
  connectionState:'DISCONNECTED / HOLD',sourceTestAuthorized:false,
  customerCommunications:false,deviceActions:false,...other});
const authenticatedIntakes=new WeakSet();
const recordedIntakes=new WeakSet();
const inspectedOriginalProofs=new WeakSet();

/** Valid signatures and matching files are necessary, NOT evidence that the
 * original issuer or independent on-site witness has been authenticated. */
export function inspectQl354SignedIntake({request,enrollment,pins,candidates,
  evidencePaths,now=Date.now()}={}){
  try{
    const checked=inspectEnrollmentRequest(request,now);
    if(!checked.valid)return held(checked.state);
    const candidatePins=verifiedCandidatePins(candidates);
    if(canonicalize(candidatePins)!==canonicalize(request.ownerAuthorityPins)||
      canonicalize(pins)!==canonicalize(candidatePins)||
      canonicalize(enrollment?.payload)!==canonicalize(request.payload))
      return held('DENY_ORIGINAL_REQUEST_PIN_OR_SIGNED_PAYLOAD_MISMATCH');
    const digests=hashWitnessFiles(evidencePaths);
    if(witnessFields.some(name=>digests[name]!==request.payload[name]))
      return held('DENY_ORIGINAL_EVIDENCE_BYTES_CHANGED');
    const reviewed=verifyDeviceEnrollment(enrollment,pins,now);
    if(!reviewed.enrolled)return held(reviewed.state);
    if(enrollment.payload.deviceId!=='rosevear-windows-hub'||
      enrollment.payload.workloadId!=='hub-probe'||
      enrollment.payload.keyId!=='hub-ql339b')
      return held('DENY_ORIGINAL_DEVICE_IDENTITY_MISMATCH');
    const proof=Object.freeze(held('ORIGINAL_DUAL_SIGNATURES_AND_BYTES_VALID_ISSUER_AND_WITNESS_HOLD',{
      ownerSignaturesVerified:true,originalWitnessBytesMatch:true,
      payloadSha256:checked.payloadSha256,
      enrollmentRecordSha256:sha(canonicalize(enrollment)),
      ownerKeyIds:[pins.source.keyId,pins.master.keyId],
      ownerPublicSpkiSha256:[candidates.source.spkiSha256,candidates.master.spkiSha256],
      issuedAt:request.payload.issuedAt,
      expiresAt:request.payload.expiresAt}));
    inspectedOriginalProofs.add(proof);
    return proof;
  }catch{return held('HOLD_SIGNED_INTAKE_OR_ORIGINAL_EVIDENCE_UNAVAILABLE');}
}

/** Only a privately supplied, independently authenticated issuer verifier AND
 * separate witness verifier may grant a process-local, nonserializable permit.
 * Passing JSON booleans, a TLS chain, or one's own public key is not proof. */
export async function authorizeQl354IndependentIntake({review,request,enrollment,
  issuerEvidence,fieldWitness,verifyOriginalIssuer,verifyIndependentWitness,
  now=Date.now()}={}){
  if(!inspectedOriginalProofs.has(review)||
    review?.state!=='ORIGINAL_DUAL_SIGNATURES_AND_BYTES_VALID_ISSUER_AND_WITNESS_HOLD'||
    review.ownerSignaturesVerified!==true||review.originalWitnessBytesMatch!==true||
    !SHA.test(review.payloadSha256??'')||
    sha(canonicalize(request?.payload))!==review.payloadSha256||
    sha(canonicalize(enrollment))!==review.enrollmentRecordSha256||
    !Number.isFinite(now)||now>=Date.parse(review.expiresAt)||
    typeof verifyOriginalIssuer!=='function'||typeof verifyIndependentWitness!=='function')
    return held('HOLD_INDEPENDENT_ISSUER_AND_FIELD_VERIFIERS_REQUIRED');
  try{
    const issuer=await verifyOriginalIssuer(issuerEvidence,review.payloadSha256);
    const witness=await verifyIndependentWitness(fieldWitness,review.payloadSha256);
    if(issuer?.verified!==true||witness?.verified!==true||
      issuer.payloadSha256!==review.payloadSha256||
      witness.payloadSha256!==review.payloadSha256||
      !SHA.test(issuer.originalIssuerKeySha256??'')||
      !SHA.test(witness.independentWitnessKeySha256??'')||
      issuer.originalIssuerKeySha256===witness.independentWitnessKeySha256||
      review.ownerPublicSpkiSha256.includes(issuer.originalIssuerKeySha256)||
      review.ownerPublicSpkiSha256.includes(witness.independentWitnessKeySha256)||
      !Number.isFinite(Date.parse(issuer.verifiedAt??''))||
      !Number.isFinite(Date.parse(witness.verifiedAt??''))||
      Date.parse(issuer.verifiedAt)<Date.parse(review.issuedAt)-30_000||
      Date.parse(witness.verifiedAt)<Date.parse(review.issuedAt)-30_000||
      Date.parse(issuer.verifiedAt)>now+30_000||
      Date.parse(witness.verifiedAt)>now+30_000)
      return held('HOLD_INDEPENDENT_ISSUER_OR_WITNESS_NOT_AUTHENTICATED');
    const permit=Object.freeze({schema:QL354_SCHEMA,
      state:'INDEPENDENT_ORIGINAL_AUTHORITY_VERIFIED_ONE_ENROLLMENT_ONLY',
      payloadSha256:review.payloadSha256,enrollment,expiresAt:review.expiresAt,
      originalIssuerKeySha256:issuer.originalIssuerKeySha256,
      independentWitnessKeySha256:witness.independentWitnessKeySha256});
    inspectedOriginalProofs.delete(review);
    authenticatedIntakes.add(permit);
    return permit;
  }catch{return held('HOLD_EXTERNAL_AUTHORITY_VERIFICATION_FAILED');}
}

/** The administrator's independently authenticated private transaction is
 * required only for this ONE exact immutable TEST enrollment. The original
 * Windows receiver must never receive this administrator credential. */
export async function insertQl354OriginalEnrollmentOnce({permit,transaction,
  now=Date.now()}={}){
  if(!authenticatedIntakes.has(permit)||typeof transaction!=='function'||
    now>=Date.parse(permit.expiresAt))
    return held('HOLD_ORIGINAL_ADMINISTRATOR_AND_LIVE_OWNER_PERMIT_REQUIRED');
  // A failed attempt needs a fresh independent review, never an automatic retry.
  authenticatedIntakes.delete(permit);
  try{
    const result=await transaction(async tx=>{
      const role=await tx.query('SELECT current_user AS intake_role');
      if(role.rows?.[0]?.intake_role!=='postgres')
        throw Error('DENY_UNAUTHORIZED_ORIGINAL_ENROLLMENT_ADMINISTRATOR');
      const existing=await tx.query('SELECT count(*)::int AS count FROM public.master_hub_device_enrollments_ql339b');
      const revocations=await tx.query('SELECT count(*)::int AS count FROM public.master_hub_device_revocations_ql339b');
      const receipts=await tx.query('SELECT count(*)::int AS count FROM public.master_hub_relay_receipts_ql338');
      if(existing.rows?.[0]?.count!==0||revocations.rows?.[0]?.count!==0||
        receipts.rows?.[0]?.count!==0)
        throw Error('HOLD_ONE_ORIGINAL_ENROLLMENT_NO_PREVIOUS_RECEIPTS_REQUIRED');
      const peers=await tx.query(`SELECT peer_id,connection_state,source_test_authorized,
        customer_data_allowed FROM public.master_hub_private_peers_ql341`);
      if(!Array.isArray(peers.rows)||peers.rows.length!==6||
        new Set(peers.rows.map(p=>p.peer_id)).size!==6||
        peers.rows.some(p=>p.connection_state!=='HOLD'||
          p.source_test_authorized!==false||p.customer_data_allowed!==false))
        throw Error('HOLD_SIX_HELD_PEER_BOUNDARY_REQUIRED');
      const p=permit.enrollment.payload;
      const inserted=await tx.query(`INSERT INTO public.master_hub_device_enrollments_ql339b
        (device_id,workload_id,key_id,enrollment_state,enrollment_record)
        VALUES ($1,$2,$3,'REVIEWED_TEST',$4::jsonb) ON CONFLICT DO NOTHING
        RETURNING enrollment_id`,[p.deviceId,p.workloadId,p.keyId,
        JSON.stringify(permit.enrollment)]);
      if(inserted.rows?.length!==1||!inserted.rows[0].enrollment_id)
        throw Error('HOLD_ORIGINAL_ENROLLMENT_NOT_INSERTED_EXACTLY_ONCE');
      return inserted.rows[0];
    });
    const receipt=Object.freeze({schema:QL354_SCHEMA,
      state:'ONE_ORIGINAL_SIGNED_TEST_ENROLLMENT_WRITTEN_RECEIVER_STILL_HELD',
      payloadSha256:permit.payloadSha256,
      enrollmentId:result.enrollment_id,expiresAt:permit.expiresAt});
    recordedIntakes.add(receipt);
    return {...held(receipt.state),databaseEnrollmentCreated:true,
      enrollmentId:receipt.enrollmentId,payloadSha256:receipt.payloadSha256,
      expiresAt:receipt.expiresAt,recordedTicket:receipt};
  }catch{return held('HOLD_ORIGINAL_ENROLLMENT_TRANSACTION_ROLLED_BACK_NO_RETRY');}
}

/** Issues only an unsigned, time-limited request to the ORIGINAL device signer.
 * It cannot send it, sign for the device, start a listener or create a receipt. */
export async function prepareQl354OneDeviceChallenge({recordedTicket,query,
  now=Date.now()}={}){
  const nonce=randomBytes(24).toString('base64url'),sessionId=randomUUID();
  if(!recordedIntakes.has(recordedTicket)||typeof query!=='function'||
    now>=Date.parse(recordedTicket.expiresAt)||
    !/^[A-Za-z0-9_-]{22,64}$/.test(nonce)||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(sessionId))
    return held('HOLD_ORIGINAL_ENROLLED_DEVICE_AND_FRESH_TEST_CHALLENGE_REQUIRED');
  recordedIntakes.delete(recordedTicket);
  try{
    const role=await query('SELECT current_user AS receiver_role');
    if(role.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
      return held('DENY_PRIVILEGED_OR_UNAUTHENTICATED_TEST_RECEIVER_ROLE');
    const enrollment=await query(`SELECT enrollment_record FROM public.master_hub_device_enrollments_ql339b
      WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
        AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`);
    if(enrollment.rows?.length!==1||
      sha(canonicalize(enrollment.rows[0].enrollment_record.payload))!==recordedTicket.payloadSha256)
      return held('HOLD_EXACT_ORIGINAL_DATABASE_ENROLLMENT_NOT_OBSERVED');
    const revocations=await query(`SELECT count(revocation_id)::int AS count
      FROM public.master_hub_device_revocations_ql339b
      WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe' AND key_id='hub-ql339b'`);
    if(revocations.rows?.[0]?.count!==0)
      return held('DENY_ORIGINAL_DEVICE_REVOKED');
    const peers=await query(`SELECT peer_id,connection_state,source_test_authorized,
      customer_data_allowed FROM public.master_hub_private_peers_ql341`);
    if(peers.rows?.length!==6||new Set(peers.rows.map(p=>p.peer_id)).size!==6||
      peers.rows.some(p=>p.connection_state!=='HOLD'||
        p.source_test_authorized!==false||p.customer_data_allowed!==false))
      return held('HOLD_SIX_PEERS_MUST_REMAIN_UNCONNECTED');
    const receipts=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
    if(receipts.rows?.[0]?.count!==0)return held('DENY_PREEXISTING_TEST_RECEIPT_OR_REPLAY');
    return {schema:QL354_CHALLENGE,
      state:'ONE_UNSIGNED_ORIGINAL_DEVICE_TEST_CHALLENGE_AWAITING_LOCAL_SIGNATURE',
      payloadSha256:recordedTicket.payloadSha256,
      envelope:{schemaVersion:'rosevear.hub.relay.heartbeat.v1',issuer:'rosevear-ai-hub',
        audience:'rosevear-comms-hub:nonproduction',deviceId:'rosevear-windows-hub',
        workloadId:'hub-probe',environment:'TEST',sequence:1,nonce,sessionId,
        issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+90_000).toISOString(),
        capabilities:['health.read','capabilities.read'],queueDepth:0,relayMode:'OUTBOUND_ONLY'},
      connected:false,sourceTestAuthorized:false,customerCommunications:false,
      deviceActions:false,receiverActivated:false};
  }catch{return held('HOLD_PRIVATE_RECEIVER_READBACK_FAILED');}
}

/** A genuine device-signed packet and a persisted DB receipt are both required.
 * No simulated packet or HTTP response alone can promote six held peers. */
export async function reconcileQl354SignedChallenge({challenge,packet,query,pins,
  now=Date.now()}={}){
  if(challenge?.schema!==QL354_CHALLENGE||
    challenge.state!=='ONE_UNSIGNED_ORIGINAL_DEVICE_TEST_CHALLENGE_AWAITING_LOCAL_SIGNATURE'||
    canonicalize(challenge.envelope)!==canonicalize(packet?.envelope)||
    packet?.keyId!=='hub-ql339b'||now>=Date.parse(challenge.envelope.expiresAt))
    return held('DENY_OR_EXPIRED_ORIGINAL_SIGNED_CHALLENGE');
  try{
    const role=await query('SELECT current_user AS receiver_role');
    if(role.rows?.[0]?.receiver_role!=='ql340c_private_receiver')
      return held('DENY_UNVERIFIED_PRIVATE_RECEIVER_ROLE');
    const count=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
    if(count.rows?.[0]?.count!==1)
      return held('HOLD_EXACTLY_ONE_ORIGINAL_TEST_RECEIPT_REQUIRED');
    const receipt=await verifySignedTestReceipt(query,
      // Signature authority comes from the *database* original enrollment,
      // never from a public request: read limited original pins separately.
      await resolveOriginalPins(query,challenge.payloadSha256,pins,now),packet,now);
    if(receipt.verified!==true)return held(receipt.state);
    return held('FIRST_ORIGINAL_SIGNED_TEST_CHALLENGE_AND_DB_RECEIPT_VERIFIED',{
      originalTestReceiptVerified:true,deviceId:receipt.deviceId,
      receivedAt:receipt.receivedAt,receiptCount:1});
  }catch{return held('HOLD_ORIGINAL_SIGNED_TEST_READBACK_FAILED');}
}

async function resolveOriginalPins(query,expectedPayloadSha256,pins,now){
  const result=await query(`SELECT enrollment_record FROM public.master_hub_device_enrollments_ql339b
    WHERE device_id='rosevear-windows-hub' AND workload_id='hub-probe'
      AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`);
  if(result.rows?.length!==1||
    sha(canonicalize(result.rows[0].enrollment_record?.payload))!==expectedPayloadSha256)
    throw Error('HOLD_SIGNED_ORIGINAL_DATABASE_ENROLLMENT_REQUIRED');
  // The caller must load these pins from the independently approved original
  // local-host ACL directory; they are NEVER accepted from the packet or HTTP.
  if(pins?.schema!=='rosevear.hub.ql339b.owner-authorities.v1'||
    verifyDeviceEnrollment(result.rows[0].enrollment_record,pins,now).enrolled!==true)
    throw Error('HOLD_INDEPENDENT_LOCAL_OWNER_PUBLIC_PINS_REQUIRED');
  return pins;
}

const readJson=path=>JSON.parse(readFileSync(resolve(path),'utf8'));
export function ql354Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('OFFLINE_ORIGINAL_OWNER_INTAKE_GUIDE',{
    commands:['--inspect REQUEST.json SIGNED_ENROLLMENT.json OWNER_PINS.json DEVICE_PUBLIC.json SOURCE_PUBLIC.json MASTER_PUBLIC.json EVIDENCE_PATHS.json'],
    databaseWrites:0,privateKeyAccess:false,networkRequests:0});
  if(args.length===8&&args[0]==='--inspect'){
    const [,request,enrollment,pins,device,source,master,paths]=args;
    return inspectQl354SignedIntake({request:readJson(request),enrollment:readJson(enrollment),
      pins:readJson(pins),candidates:{device:readJson(device),source:readJson(source),
        master:readJson(master)},evidencePaths:readJson(paths)});
  }
  throw Error('DENY_QL354_UNSUPERVISED_ENROLLMENT_OR_TEST_ACTION');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(ql354Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL354_ORIGINAL_OWNER_INTAKE: ${error.message}\n`);process.exitCode=1;}
}
