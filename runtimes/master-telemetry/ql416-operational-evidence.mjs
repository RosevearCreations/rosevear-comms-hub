import {createHash} from 'node:crypto';
import {reviewQl415RuntimeUptime} from './ql415-runtime-acceptance.mjs';

const SHA=/^[a-f0-9]{40}$/;
const HEX=/^[a-f0-9]{64}$/;
const EPISODE=/^[A-Za-z0-9_-]{12,96}$/;
const hold=(reason)=>({state:'HOLD',reason,uptime:'UNKNOWN',incidents:[],
  ownerDecision:'HOLD',receiver:'OFF',connection:'HOLD',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});

/** Import a single operational one-TEST review, never a connection grant.
 * The caller must authenticate the protected channel, owner and independent
 * reviewer; it must read independently committed replay entries from the
 * protected ledger. The UI must never supply those authority assertions. */
export function reconcileQl416OriginalHostEvidence({telemetryEnvelope,receiverAck,
  pinCustody,installedSourceRevision,protectedLedgerRecord,
  aiDataControllerRevision,expectedAiDataControllerRevision,
  protectedTransportAuthenticated=false,ownerAuthorityVerified=false,
  independentReviewerVerified=false,ownerIncidentAcceptance=false,
  nowMs}={}){
  if(!protectedTransportAuthenticated||!ownerAuthorityVerified||
    !independentReviewerVerified||!SHA.test(installedSourceRevision??'')||
    !SHA.test(aiDataControllerRevision??'')||
    aiDataControllerRevision!==expectedAiDataControllerRevision||
    !Number.isFinite(nowMs))return hold('PROTECTED_MASTER_AUTHORITY_OR_REVISION_MISSING');
  const p=telemetryEnvelope?.payload;
  const ack=receiverAck?.payload;
  const ledger=protectedLedgerRecord;
  if(!EPISODE.test(p?.episodeId??'')||
    p?.sourceId!=='rosevear-ai-hub'||p?.hostId!=='DESKTOP-AE894KC'||
    p?.sourceRevision!==installedSourceRevision||
    !ledger||ledger.state!=='DURABLY_COMMITTED_ON_PROTECTED_RUNTIME'||
    ledger.episodeId!==p.episodeId||
    ledger.sourceRevision!==installedSourceRevision||
    ledger.sourcePayloadSha256!==createHash('sha256').update(JSON.stringify(p)).digest('hex')||
    !HEX.test(ledger.sourcePayloadSha256??'')||
    ack?.sourceEpisodeId!==p.episodeId||
    ack?.sourceRevision!==installedSourceRevision||
    ack?.sourcePayloadSha256!==ledger.sourcePayloadSha256)
    return hold('ORIGINAL_HOST_LEDGER_AND_RECEIVER_CHAIN_UNVERIFIED');
  const review=reviewQl415RuntimeUptime({telemetryEnvelope,receiverAck,pinCustody,
    actualInstalledSourceRevision:installedSourceRevision,
    protectedReplayAdmission:'DURABLY_COMMITTED_ON_PROTECTED_RUNTIME',
    ownerApproval:true,independentReviewerApproval:true,nowMs});
  if(review.state!=='OWNER_REVIEWED_RUNTIME_EVIDENCE')
    return hold(review.reason??'SIGNED_ORIGINAL_HOST_REVIEW_REJECTED');

  // Incident candidates describe reachability gaps in authenticated samples,
  // not confirmed outages. A missing or sparse sample is never 100% uptime.
  const incidents=review.services.filter(row=>row.sampledUptimePercent!==null&&
    row.sampledUptimePercent<100).map(row=>({service:row.service,
      classification:'SIGNED_SAMPLE_REACHABILITY_GAP',
      sampledUptimePercent:row.sampledUptimePercent,
      acceptance:ownerIncidentAcceptance?'OWNER_REVIEWED':'AWAITING_OWNER_REVIEW'}));
  return {state:'SIGNED_ONE_TEST_IMPORTED_FOR_REVIEW',
    source:'rosevear-ai-hub',host:'DESKTOP-AE894KC',
    installedSourceRevision,aiDataControllerRevision,
    episodeId:p.episodeId,correlationId:ack.correlationId,
    capturedAt:review.capturedAt,uptime:'SIGNED_SAMPLED_READ_MODEL_ONLY',
    services:review.services,incidents,
    replay:'INDEPENDENT_PROTECTED_LEDGER_RECORD_MATCHED',
    receiverAck:'INDEPENDENT_SIGNED_ACK_MATCHED',
    ownerDecision:ownerIncidentAcceptance?'INCIDENT_REVIEWED_NO_ACTIVATION':'HOLD',
    receiver:'OFF',connection:'HOLD',
    slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'};
}
