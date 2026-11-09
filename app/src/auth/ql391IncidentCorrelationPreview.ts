import type {QL390OperatorRow,QL390Simulation} from './ql390IncidentSimulationLedger';

export type QL391EvidenceObservation={
  sourceId:string;correlationId:string;state:'PRESENT'|'MISSING';checkedAt:string|null;
};
export type QL391Freshness='CURRENT_SIMULATED'|'UNKNOWN'|'STALE'|'MISSING'|'INVALID'|'CONFLICT';
export type QL391TimelineEvent={
  sequence:number;sourceId:string;eventCode:string;eventState:QL390OperatorRow['state'];
  occurredAt:string;evidenceFreshness:QL391Freshness;
};
export type QL391CorrelationGroup={
  correlationId:string;sourceIds:string[];firstOccurredAt:string;lastOccurredAt:string;
  overallFreshness:QL391Freshness;timeline:QL391TimelineEvent[];
};
export type QL391CorrelationPreview={
  state:'INERT_PREVIEW'|'HOLD';groups:QL391CorrelationGroup[];
  heldUnverified:number;reason:string;
};

export const QL391_EVIDENCE_FRESH_MS=10*60*1000;
export const QL391_MAX_EVIDENCE_OBSERVATIONS=100;
const FUTURE_TOLERANCE_MS=60*1000;
const rank:Record<QL391Freshness,number>={
  CURRENT_SIMULATED:0,UNKNOWN:1,STALE:2,MISSING:3,INVALID:4,CONFLICT:5
};

function evidenceFreshness(
  sourceId:string,correlationId:string,
  observations:readonly QL391EvidenceObservation[],nowMs:number
):QL391Freshness{
  const matches=observations.filter(item=>item.sourceId===sourceId&&item.correlationId===correlationId);
  if(matches.length===0)return 'UNKNOWN';
  if(matches.length!==1)return 'CONFLICT';
  const record=matches[0];
  if(record.state==='MISSING')return 'MISSING';
  if(record.state!=='PRESENT'||typeof record.checkedAt!=='string'||
     !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(record.checkedAt))return 'INVALID';
  const verifiedMs=Date.parse(record.checkedAt);
  if(!Number.isFinite(verifiedMs)||verifiedMs>nowMs+FUTURE_TOLERANCE_MS)return 'INVALID';
  if(nowMs-verifiedMs>QL391_EVIDENCE_FRESH_MS)return 'STALE';
  return 'CURRENT_SIMULATED';
}

/** Groups only QL-390 synthetic signed-preview rows. Never correlates HELD
 * claims or treats an event timestamp as evidence freshness. All readbacks
 * are caller-supplied simulations, so no group constitutes a real incident. */
export function buildIncidentCorrelationPreview(
  ledger:QL390Simulation,observations:readonly QL391EvidenceObservation[],nowMs:number
):QL391CorrelationPreview{
  const heldUnverified=Array.isArray(ledger?.rows)?ledger.rows.filter(row=>row?.state==='HELD').length:0;
  if(ledger?.state!=='INERT_PREVIEW'||!Array.isArray(ledger.rows)||ledger.rows.length>50||
     ledger.rows.some(row=>!row||!Number.isInteger(row.sequence)||row.sequence<1||
       !['HELD','PREVIEW_NEW','PREVIEW_DUPLICATE','PREVIEW_CONFLICT'].includes(row.state)||
       (row.state!=='HELD'&&(!Number.isFinite(Date.parse(row.occurredAt))||
         typeof row.correlationId!=='string'||row.correlationId.length>128)))||
     !Array.isArray(observations)||
     observations.length>QL391_MAX_EVIDENCE_OBSERVATIONS||!Number.isFinite(nowMs))
    return {state:'HOLD',groups:[],heldUnverified,
      reason:'A bounded, valid synthetic ledger, evidence readback and evaluation clock are required'};

  if(observations.some(record=>!record||typeof record.sourceId!=='string'||
    typeof record.correlationId!=='string'||!['PRESENT','MISSING'].includes(record.state)||
    (record.checkedAt!==null&&typeof record.checkedAt!=='string')))
    return {state:'HOLD',groups:[],heldUnverified,
      reason:'Evidence observations must be valid, bounded and explicitly source-scoped'};

  const grouped=new Map<string,QL390OperatorRow[]>();
  for(const row of ledger.rows){
    if(row.state==='HELD'||row.correlationId==='REDACTED')continue;
    const candidates=grouped.get(row.correlationId)??[];
    candidates.push(row);
    grouped.set(row.correlationId,candidates);
  }
  const groups:QL391CorrelationGroup[]=[];
  for(const [correlationId,rows] of grouped){
    const ordered=[...rows].sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt)||a.sequence-b.sequence);
    const timeline=ordered.map(row=>({
      sequence:row.sequence,sourceId:row.sourceId,eventCode:row.eventCode,
      eventState:row.state,occurredAt:row.occurredAt,
      evidenceFreshness:evidenceFreshness(row.sourceId,correlationId,observations,nowMs)
    }));
    const worst=timeline.reduce<QL391Freshness>((prior,item)=>
      rank[item.evidenceFreshness]>rank[prior]?item.evidenceFreshness:prior,'CURRENT_SIMULATED');
    groups.push({correlationId,sourceIds:[...new Set(ordered.map(row=>row.sourceId))].sort(),
      firstOccurredAt:ordered[0].occurredAt,lastOccurredAt:ordered[ordered.length-1].occurredAt,
      overallFreshness:worst,timeline});
  }
  groups.sort((a,b)=>Date.parse(b.lastOccurredAt)-Date.parse(a.lastOccurredAt)||a.correlationId.localeCompare(b.correlationId));
  return {state:'INERT_PREVIEW',groups,heldUnverified,
    reason:'Opaque cross-source grouping and evidence age are illustrative only; no incident merged, verified, acknowledged or persisted'};
}

export const QL391_ILLUSTRATIVE_TIMELINE=[
  {source:'Yard Workers',code:'SOURCE_HEALTH_STALE',occurred:'09:00',freshness:'CURRENT_SIMULATED'},
  {source:'iCamp',code:'INTEGRATION_DELAYED',occurred:'09:02',freshness:'STALE'}
] as const;
