const SHA=/^[a-f0-9]{40}$/;
const EPISODE=/^[A-Za-z0-9_-]{12,96}$/;
const SOURCES=new Set(['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform']);
const MAX_AGE_MS=300_000;
const hold=(reason,items=[])=>({state:'HOLD',reason,items,
  runtimeUptime:'UNKNOWN',ownerDecision:'HOLD',receiver:'OFF',connection:'HOLD',
  slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});

/** Read-only projection from an authenticated protected runtime. Input is
 * evidence metadata, not authority: even independently reviewed evidence
 * cannot turn on Comms receiver or connect another application. */
export function buildQl417MasterDiscrepancyWorklist({episodes=[],decisions=[],
  controllerRevision,nowMs,protectedReadAuthorized=false}={}){
  if(!protectedReadAuthorized||!SHA.test(controllerRevision??'')||
    !Number.isFinite(nowMs)||!Array.isArray(episodes)||episodes.length>200||
    !Array.isArray(decisions)||decisions.length>200)
    return hold('PROTECTED_READ_OR_CONTROLLER_REVISION_UNVERIFIED');

  const byEpisode=new Map();
  for(const episode of episodes){
    if(!episode||!SOURCES.has(episode.sourceId)||
      !EPISODE.test(episode.episodeId??'')||
      !SHA.test(episode.sourceRevision??'')||
      !Number.isFinite(episode.observedAtMs)||episode.observedAtMs>nowMs||
      !['VERIFIED','HOLD','REJECTED'].includes(episode.signatureStatus)||
      !['COMMITTED','MISSING','REPLAYED'].includes(episode.replayStatus)||
      !['MATCHED','MISSING','MISMATCH'].includes(episode.receiverAckStatus))
      return hold('MALFORMED_OR_FUTURE_EPISODE');
    const key=`${episode.sourceId}:${episode.episodeId}`;
    if(byEpisode.has(key))return hold('DUPLICATE_EPISODE_ID');
    byEpisode.set(key,episode);
  }
  const ownerDecisions=new Map();
  for(const decision of decisions){
    if(!decision||!EPISODE.test(decision.episodeId??'')||
      !SOURCES.has(decision.sourceId)||
      !['ACCEPTED_FOR_REVIEW','REOPENED','HOLD'].includes(decision.outcome)||
      !Number.isFinite(decision.decidedAtMs)||decision.decidedAtMs>nowMs||
      decision.ownerVerified!==true||decision.independentReviewerVerified!==true)
      return hold('OWNER_DECISION_PROVENANCE_UNVERIFIED');
    const key=`${decision.sourceId}:${decision.episodeId}`;
    if(!byEpisode.has(key))return hold('ORPHAN_OWNER_DECISION');
    if(ownerDecisions.has(key)&&ownerDecisions.get(key).decidedAtMs===decision.decidedAtMs)
      return hold('AMBIGUOUS_DECISION_ORDER');
    if(!ownerDecisions.has(key)||ownerDecisions.get(key).decidedAtMs<decision.decidedAtMs)
      ownerDecisions.set(key,decision);
  }
  const items=[...byEpisode.entries()].map(([key,episode])=>{
    const ageMs=nowMs-episode.observedAtMs;
    const reasons=[];
    if(ageMs>MAX_AGE_MS)reasons.push('STALE_TELEMETRY');
    if(episode.signatureStatus!=='VERIFIED')reasons.push('SIGNATURE_NOT_VERIFIED');
    if(episode.replayStatus!=='COMMITTED')reasons.push('REPLAY_LEDGER_NOT_COMMITTED');
    if(episode.receiverAckStatus!=='MATCHED')reasons.push('RECEIVER_ACK_NOT_MATCHED');
    const decision=ownerDecisions.get(key);
    if(!decision||decision.outcome!=='ACCEPTED_FOR_REVIEW')reasons.push('OWNER_DECISION_PENDING_OR_REOPENED');
    return {sourceId:episode.sourceId,episodeId:episode.episodeId,
      sourceRevision:episode.sourceRevision,ageSeconds:Math.floor(ageMs/1000),
      age:'AGE_FROM_EVIDENCE_TIMESTAMP_NOT_CONTINUOUS_UPTIME',
      severity:reasons.includes('SIGNATURE_NOT_VERIFIED')||
        reasons.includes('REPLAY_LEDGER_NOT_COMMITTED')?'CRITICAL':
        reasons.length?'REVIEW':'NONE',reasons,
      latestOwnerDecision:decision?.outcome??'NONE',
      latestDecisionAtMs:decision?.decidedAtMs??null,
      connection:'HOLD'};
  }).sort((a,b)=>{
    const rank={CRITICAL:0,REVIEW:1,NONE:2};
    return rank[a.severity]-rank[b.severity]||
      b.ageSeconds-a.ageSeconds||a.sourceId.localeCompare(b.sourceId)||
      a.episodeId.localeCompare(b.episodeId);
  });
  return {...hold('OWNER_GATED_THREE_MASTER_EVIDENCE_WORKLIST',items),
    state:'READ_ONLY_DISCREPANCY_WORKLIST',controllerRevision,
    evaluatedAtMs:nowMs,total:items.length,
    openDiscrepancies:items.filter(x=>x.reasons.length).length};
}
