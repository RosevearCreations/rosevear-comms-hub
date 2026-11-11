import {createPublicKey,createHash,verify} from 'node:crypto';
import {reviewQl412ThreeMasterTelemetry} from './ql412-protected-enrollment.mjs';

const SHA=/^[a-f0-9]{40}$/;
const RECEIPT=/^[a-zA-Z0-9_-]{12,96}$/;
const fail=(reason)=>({state:'HOLD',reason,receiver:'OFF',connection:'HOLD',
  masterSync:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',ack:null});
const exact=(o,fields)=>o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));

/** One-TEST transport *handler*, not an HTTP listener. Its caller must supply
 * an authenticated private channel, separately authorized owner/reviewer
 * ceremony and independently enrolled sender/receiver public key pins.
 * The receiver signing callback must be held only by the protected service;
 * no private keys or raw transport packets are returned to public UI. */
export function handleQl414OneTest(request,{transportAuthenticated=false,
  ownerAuthorizationVerified=false,independentReviewerVerified=false,
  enrollment,ledger,expectedSourceRevision,aiDataControllerRevision,
  receiverKeyId,receiverPublicPin,receiverSign,nowMs}={}){
  if(!transportAuthenticated||!ownerAuthorizationVerified||
    !independentReviewerVerified||!enrollment||!ledger||
    typeof receiverSign!=='function'||!receiverPublicPin||
    typeof receiverKeyId!=='string'||!RECEIPT.test(receiverKeyId)||
    !Number.isFinite(nowMs)||!SHA.test(expectedSourceRevision??''))
    return fail('PROTECTED_ONE_TEST_OWNER_OR_RECEIVER_AUTHORITY_MISSING');
  if(!exact(request,['operation','correlationId','envelope'])||
    request.operation!=='MASTER360_ONE_TEST_READ_ONLY'||
    !RECEIPT.test(request.correlationId))return fail('INVALID_ONE_TEST_CONTRACT');
  let receiverKey;
  try{
    receiverKey=createPublicKey({key:Buffer.from(receiverPublicPin,'base64'),
      format:'der',type:'spki'});
    if(receiverKey.asymmetricKeyType!=='ed25519')return fail('INVALID_RECEIVER_PIN');
  }catch{return fail('INVALID_RECEIVER_PIN');}
  const checked=reviewQl412ThreeMasterTelemetry(request.envelope,{enrollment,
    ledger,expectedRevision:expectedSourceRevision,nowMs,aiDataControllerRevision});
  if(checked.telemetry!=='SIGNED_SOURCE_METADATA_VERIFIED')
    return fail(checked.reason??'SOURCE_TELEMETRY_REJECTED');
  const metadata={schema:'rosevear.master360.ql414.receiver-ack.v1',
    operation:'MASTER360_ONE_TEST_READ_ONLY',
    sourceId:'rosevear-ai-hub',hostId:'DESKTOP-AE894KC',
    sourceRevision:expectedSourceRevision,
    sourceEpisodeId:request.envelope.payload.episodeId,
    correlationId:request.correlationId,
    receivedAt:new Date(nowMs).toISOString(),
    receiverKeyId,
    sourcePayloadSha256:createHash('sha256').update(
      JSON.stringify(request.envelope.payload)).digest('hex'),
    decision:'METADATA_VERIFIED_FOR_OWNER_REVIEW',
    connection:'HOLD'};
  try{
    const bytes=Buffer.from(JSON.stringify(metadata));
    const signature=receiverSign(bytes);
    if(!Buffer.isBuffer(signature)||signature.length!==64||
      !verify(null,bytes,receiverKey,signature))return fail('RECEIVER_SIGNER_PROOF_REJECTED');
    return {state:'SIGNED_RECEIVER_ACK_FOR_REVIEW',ack:{payload:metadata,
      signature:signature.toString('base64')},
      telemetry:'SIGNED_SOURCE_METADATA_VERIFIED',
      incidentCandidates:checked.incidents,receiver:'OFF',connection:'HOLD',
      masterSync:'HOLD',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
  }catch{return fail('RECEIVER_SIGNER_UNAVAILABLE');}
}

/** The owner decision record is an inert audit recommendation, not activation. */
export function reviewQl414OwnerDecision(ack,{trustedReceiverPublicPin,
  expectedSourceRevision,ownerApproval,independentReviewerApproval,
  nowMs}={}){
  if(!ownerApproval||!independentReviewerApproval||!trustedReceiverPublicPin||
    !SHA.test(expectedSourceRevision??'')||!Number.isFinite(nowMs)||
    !exact(ack,['payload','signature']))return fail('INDEPENDENT_OWNER_DECISION_EVIDENCE_MISSING');
  const p=ack.payload;
  if(!exact(p,['schema','operation','sourceId','hostId','sourceRevision',
    'sourceEpisodeId','correlationId','receivedAt','receiverKeyId',
    'sourcePayloadSha256','decision','connection'])||
    p.schema!=='rosevear.master360.ql414.receiver-ack.v1'||
    p.operation!=='MASTER360_ONE_TEST_READ_ONLY'||
    p.sourceId!=='rosevear-ai-hub'||p.hostId!=='DESKTOP-AE894KC'||
    p.sourceRevision!==expectedSourceRevision||p.connection!=='HOLD'||
    p.decision!=='METADATA_VERIFIED_FOR_OWNER_REVIEW'||
    !Number.isFinite(Date.parse(p.receivedAt))||
    Date.parse(p.receivedAt)>nowMs||nowMs-Date.parse(p.receivedAt)>5*60_000)
    return fail('STALE_OR_MISMATCHED_RECEIVER_ACK');
  try{
    const key=createPublicKey({key:Buffer.from(trustedReceiverPublicPin,'base64'),
      format:'der',type:'spki'});
    if(key.asymmetricKeyType!=='ed25519'||!verify(null,
      Buffer.from(JSON.stringify(p)),key,Buffer.from(ack.signature,'base64')))
      return fail('RECEIVER_ACK_SIGNATURE_REJECTED');
  }catch{return fail('RECEIVER_ACK_SIGNATURE_REJECTED');}
  return {...fail('OWNER_REVIEW_RECORDED_CONNECTION_NOT_GRANTED'),
    state:'OWNER_SUPERVISED_ACK_REVIEWED',
    reviewedCorrelationId:p.correlationId,
    reviewedSourceRevision:p.sourceRevision,
    receiverAck:'SIGNATURE_VERIFIED_FOR_REVIEW'};
}
