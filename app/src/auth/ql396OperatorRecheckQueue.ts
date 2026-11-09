import {MASTER_SHELL_REGISTRY} from './ql386MasterShellRegistry';
import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import {reviewDraftDecisionHistory,QL394_DEMO_HISTORY,type QL394AlertCode,
  type QL394Snapshot,type QL394HistoryEntry,type QL394Provenance} from './ql394DraftDecisionHistory';
import {QL393_DEFAULT_SCENARIO,type QL393Gate} from './ql393OperatorFollowUpDrafts';

export type QL396RecheckRequest={correlationId:string;snapshots:readonly QL394Snapshot[]};
export type QL396AgeBand='NEW'|'AGING'|'OVERDUE';
export type QL396Priority='REVIEW_NOW'|'VERIFY_EVIDENCE';
export type QL396OwnerScope='SOURCE_OWNER'|'MASTER_OWNER'|'SOURCE_SIGNING_CUSTODIAN'|'RECEIVER_OPERATOR'|'CONSENT_CUSTODIAN';
export type QL396QueueItem={
  queueId:string;sourceId:string;correlationId:string;gate:QL393Gate['name'];
  firstSyntheticObservation:string;lastSyntheticObservation:string;
  syntheticAgeMinutes:number;ageBand:QL396AgeBand;priority:QL396Priority;
  scenarioDecision:QL393Gate['state'];evidenceProvenance:QL394Provenance;
  driftCodes:QL394AlertCode[];ownerScope:QL396OwnerScope;guidance:string;
  originalOwnerEvidence:'NOT_VERIFIED';status:'HOLD';sendEnabled:false;persisted:false;
};
export type QL396QueueReview={
  state:'INERT_PREVIEW'|'HOLD';items:QL396QueueItem[];sourceCount:number;
  totalGroups:number;overdue:number;aging:number;newCount:number;
  reason:string;sendEnabled:false;persisted:false;
};
export type QL396QueueFilters={sourceId:string;ageBand:'ALL'|QL396AgeBand};
export const QL396_DEFAULT_FILTERS:QL396QueueFilters={sourceId:'ALL',ageBand:'ALL'};
export const QL396_MAX_GROUPS=6;
const knownSources=new Set<string>(MASTER_SHELL_REGISTRY.map(source=>source.id));
const ownerScopes:Record<QL393Gate['name'],QL396OwnerScope>={
  SOURCE_OWNER:'SOURCE_OWNER',MASTER_OWNER:'MASTER_OWNER',SOURCE_PIN:'SOURCE_SIGNING_CUSTODIAN',
  RECEIVER:'RECEIVER_OPERATOR',CONSENT:'CONSENT_CUSTODIAN'
};
const originalEvidence:Record<QL393Gate['name'],string>={
  SOURCE_OWNER:'Obtain original source-owner scoped decision and independent witness proof.',
  MASTER_OWNER:'Obtain separate original master-owner decision for this exact correlation.',
  SOURCE_PIN:'Independently reconcile the source signing pin, key custody and witness record.',
  RECEIVER:'Verify original private receiver enrollment and server-side replay controls.',
  CONSENT:'Confirm original scoped consent, privacy, retention and audit authorization.'
};
const priorityOrder:Record<QL396Priority,number>={REVIEW_NOW:0,VERIFY_EVIDENCE:1};

/** In-memory scenario queue, never a persisted owner request. Age measures
 * time since illustrative observation, never the age of real approval. */
export function reviewOperatorRecheckQueue(preview:QL391CorrelationPreview,
  requests:readonly QL396RecheckRequest[],nowMs:number):QL396QueueReview{
  const stopped=(reason:string):QL396QueueReview=>({state:'HOLD',items:[],sourceCount:0,
    totalGroups:0,overdue:0,aging:0,newCount:0,reason,sendEnabled:false,persisted:false});
  if(!Array.isArray(requests)||!requests.length||requests.length>QL396_MAX_GROUPS||
    !Number.isFinite(nowMs)||requests.some(item=>!item||typeof item.correlationId!=='string'||
      !Array.isArray(item.snapshots)||item.snapshots.length===0)||
    new Set(requests.map(item=>item.correlationId)).size!==requests.length)
    return stopped('Bounded distinct source-scoped synthetic recheck groups are required');
  const items:QL396QueueItem[]=[];
  for(const request of requests){
    const review=reviewDraftDecisionHistory(preview,request.correlationId,request.snapshots,nowMs);
    if(review.state!=='INERT_PREVIEW'||!review.history.length)
      return stopped('Invalid or empty original-evidence scenario blocks the entire preview queue');
    const byGate=new Map<string,QL394HistoryEntry[]>();
    for(const entry of review.history){
      const key=`${entry.sourceId}:${entry.gate}`;
      byGate.set(key,[...(byGate.get(key)??[]),entry]);
    }
    for(const gateEntries of byGate.values()){
      gateEntries.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||
        a.snapshotId.localeCompare(b.snapshotId));
      const first=gateEntries[0],last=gateEntries[gateEntries.length-1];
      if(!knownSources.has(last.sourceId))return stopped('Unregistered source cannot enter the owner queue');
      const age=Math.max(0,Math.floor((nowMs-Date.parse(first.observedAt))/60000));
      const ageBand:QL396AgeBand=age>=30?'OVERDUE':age>=10?'AGING':'NEW';
      const driftCodes=[...new Set(review.alerts.filter(alert=>
        alert.sourceId===last.sourceId&&alert.gate===last.gate).map(alert=>alert.code))];
      const priority:QL396Priority=ageBand==='OVERDUE'||driftCodes.length?'REVIEW_NOW':'VERIFY_EVIDENCE';
      const guidance=ageBand==='OVERDUE'?
        'Simulated review age exceeds 30 minutes; escalate for independent owner evidence review.':
        ageBand==='AGING'?'Synthetic review is aging; schedule authorized original evidence recheck.':
          'Await original evidence through the established owner process; do not send a request.';
      items.push({queueId:`${last.correlationId}/${last.sourceId}/${last.gate}`,
        sourceId:last.sourceId,correlationId:last.correlationId,gate:last.gate,
        firstSyntheticObservation:first.observedAt,lastSyntheticObservation:last.observedAt,
        syntheticAgeMinutes:age,ageBand,priority,
        scenarioDecision:last.decision,evidenceProvenance:last.provenance,
        driftCodes,ownerScope:ownerScopes[last.gate],
        guidance:`${originalEvidence[last.gate]} ${guidance}`,
        originalOwnerEvidence:'NOT_VERIFIED',status:'HOLD',sendEnabled:false,persisted:false});
    }
  }
  if(new Set(items.map(item=>item.queueId)).size!==items.length)
    return stopped('Duplicate source/correlation/owner gate cannot enter recheck queue');
  items.sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority]||
    b.syntheticAgeMinutes-a.syntheticAgeMinutes||a.queueId.localeCompare(b.queueId));
  return {state:'INERT_PREVIEW',items,sourceCount:new Set(items.map(item=>item.sourceId)).size,
    totalGroups:requests.length,overdue:items.filter(item=>item.ageBand==='OVERDUE').length,
    aging:items.filter(item=>item.ageBand==='AGING').length,
    newCount:items.filter(item=>item.ageBand==='NEW').length,
    reason:'Aging applies only to synthetic observations; actual approval age and live operator work are unknown',
    sendEnabled:false,persisted:false};
}

export function filterOperatorRecheckQueue(queue:QL396QueueReview,
  filters:QL396QueueFilters):QL396QueueItem[]{
  if(queue.state!=='INERT_PREVIEW'||!filters||
    (filters.sourceId!=='ALL'&&!knownSources.has(filters.sourceId))||
    !['ALL','NEW','AGING','OVERDUE'].includes(filters.ageBand))return [];
  return queue.items.filter(item=>(filters.sourceId==='ALL'||item.sourceId===filters.sourceId)&&
    (filters.ageBand==='ALL'||item.ageBand===filters.ageBand));
}

export const QL396_DEMO_NOW=Date.parse('2026-11-09T09:45:00Z');
export const QL396_DEMO_REQUESTS:readonly QL396RecheckRequest[]=[
  {correlationId:'correlation-ql392-workshop',snapshots:QL394_DEMO_HISTORY},
  {correlationId:'correlation-ql392-integration',snapshots:[{
    snapshotId:'snapshot-ql396-icamp',observedAt:'2026-11-09T09:20:00Z',
    scenario:QL393_DEFAULT_SCENARIO,evidenceClaims:[]}]},
  {correlationId:'correlation-ql392-local',snapshots:[{
    snapshotId:'snapshot-ql396-local',observedAt:'2026-11-09T09:39:00Z',
    scenario:QL393_DEFAULT_SCENARIO,evidenceClaims:[]}]}
];
