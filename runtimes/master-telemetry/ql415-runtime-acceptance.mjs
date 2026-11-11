import {createHash,createPublicKey,verify} from 'node:crypto';
import {reviewQl414OwnerDecision} from './ql414-one-test-transport.mjs';

const SHA=/^[a-f0-9]{40}$/;
const HASH=/^[a-f0-9]{64}$/;
const hold=(reason)=>({state:'HOLD',reason,uptime:'UNKNOWN',
  signerCustody:'HOLD',connection:'HOLD',receiver:'OFF',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});

/** Read-only owner custody review. Separately trusted reviewer attestations
 * are supplied by an authenticated protected authority, not a browser form. */
export function reviewQl415PinCustody({sourcePin,receiverPin,
  independentlyWitnessedSourceSha256,independentlyWitnessedReceiverSha256,
  sourceHost,sourceRevision,ownerAuthorityVerified,
  independentReviewerAuthorityVerified}={}){
  if(!ownerAuthorityVerified||!independentReviewerAuthorityVerified||
    sourceHost!=='DESKTOP-AE894KC'||!SHA.test(sourceRevision??'')||
    !HASH.test(independentlyWitnessedSourceSha256??'')||
    !HASH.test(independentlyWitnessedReceiverSha256??''))
    return hold('INDEPENDENT_PIN_CUSTODY_UNVERIFIED');
  try{
    const sourceBytes=Buffer.from(sourcePin,'base64');
    const receiverBytes=Buffer.from(receiverPin,'base64');
    if(sourceBytes.toString('base64')!==sourcePin||
      receiverBytes.toString('base64')!==receiverPin||
      createHash('sha256').update(sourceBytes).digest('hex')!==independentlyWitnessedSourceSha256||
      createHash('sha256').update(receiverBytes).digest('hex')!==independentlyWitnessedReceiverSha256||
      createPublicKey({key:sourceBytes,format:'der',type:'spki'}).asymmetricKeyType!=='ed25519'||
      createPublicKey({key:receiverBytes,format:'der',type:'spki'}).asymmetricKeyType!=='ed25519')
      return hold('CUSTODY_PIN_MISMATCH');
    return {state:'PIN_CUSTODY_REVIEWED',sourceHost,sourceRevision,
      independentlyWitnessedSourceSha256,independentlyWitnessedReceiverSha256,
      sourcePin,receiverPin,connection:'HOLD',receiver:'OFF'};
  }catch{return hold('CUSTODY_PIN_INVALID');}
}

/** Verify one original-host signed telemetry envelope and independent receiver
 * ACK without replaying the consumed operational episode. This is a review
 * read model; the protected runtime owns original replay admission. */
export function reviewQl415RuntimeUptime({telemetryEnvelope,receiverAck,
  pinCustody,actualInstalledSourceRevision,protectedReplayAdmission,
  ownerApproval,independentReviewerApproval,nowMs}={}){
  if(pinCustody?.state!=='PIN_CUSTODY_REVIEWED'||
    !SHA.test(actualInstalledSourceRevision??'')||
    actualInstalledSourceRevision!==pinCustody.sourceRevision||
    protectedReplayAdmission!=='DURABLY_COMMITTED_ON_PROTECTED_RUNTIME'||
    !ownerApproval||!independentReviewerApproval||!Number.isFinite(nowMs))
    return hold('ORIGINAL_HOST_RUNTIME_ACCEPTANCE_UNAVAILABLE');
  const p=telemetryEnvelope?.payload;
  if(p?.sourceId!=='rosevear-ai-hub'||p?.hostId!=='DESKTOP-AE894KC'||
    p?.sourceRevision!==actualInstalledSourceRevision||
    !Array.isArray(p.samples)||p.samples.length<2||p.samples.length>1440||
    !Number.isFinite(Date.parse(p.capturedAt))||
    Date.parse(p.capturedAt)>nowMs||nowMs-Date.parse(p.capturedAt)>300000)
    return hold('ORIGINAL_HOST_TELEMETRY_MISSING_OR_STALE');
  let valid=false;
  try{valid=verify(null,Buffer.from(JSON.stringify(p)),
    createPublicKey({key:Buffer.from(pinCustody.sourcePin,'base64'),format:'der',type:'spki'}),
    Buffer.from(telemetryEnvelope.signature,'base64'));}
  catch{return hold('ORIGINAL_HOST_TELEMETRY_SIGNATURE_REJECTED');}
  if(!valid)return hold('ORIGINAL_HOST_TELEMETRY_SIGNATURE_REJECTED');
  const ack=reviewQl414OwnerDecision(receiverAck,{trustedReceiverPublicPin:pinCustody.receiverPin,
    expectedSourceRevision:actualInstalledSourceRevision,
    ownerApproval:true,independentReviewerApproval:true,nowMs});
  if(ack.state!=='OWNER_SUPERVISED_ACK_REVIEWED'||
    receiverAck.payload.sourceEpisodeId!==p.episodeId||
    receiverAck.payload.sourcePayloadSha256!==createHash('sha256').update(
      JSON.stringify(p)).digest('hex'))return hold('SIGNED_RECEIVER_ACK_NOT_CORRELATED');
  const rows=['hub_api_8765','hub_client_5173','hub_caddy_8443'].map(service=>{
    const samples=p.samples.filter(x=>x.service===service);
    return {service,samples:samples.length,
      sampledUptimePercent:samples.length<2?null:Math.round(
        samples.filter(x=>x.reachable).length/samples.length*10000)/100};
  });
  return {state:'OWNER_REVIEWED_RUNTIME_EVIDENCE',uptime:'SIGNED_SAMPLES_REVIEWED',
    sampleWindow:'SIGNED_METADATA_ONLY_NOT_CONTINUOUS_SLA',services:rows,
    capturedAt:p.capturedAt,sourceRevision:actualInstalledSourceRevision,
    signerCustody:'INDEPENDENTLY_REVIEWED',receiverAck:'SIGNED_AND_CORRELATED',
    connection:'HOLD',receiver:'OFF',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
