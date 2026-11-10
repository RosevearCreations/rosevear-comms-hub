import {QL375_SHELLS} from './ql375OwnerStatus';
import type {QL405SourceId} from './ql405AcknowledgementLedger';
import {reviewQl409AuditDecisions,type QL409AuditEvent} from './ql409AuditDecisionReview';

export type QL410HealthObservation={sourceId:string;hostId:string;observedAt:string;
  service:string;reachable:boolean;latencyMs:number;observationId:string};
const OPAQUE=/^[A-Za-z0-9][A-Za-z0-9_-]{7,95}$/;
const MAX_AGE_MS=5*60*1000;
const FIELDS=['sourceId','hostId','observedAt','service','reachable','latencyMs','observationId'];

/** A status review, not a receipt verifier. The browser never polls an endpoint. */
export function reviewQl410HostObservation(sourceId:QL405SourceId,claim:unknown,nowMs:number){
  const unknown={sourceId,status:'UNKNOWN' as const,reason:'NO_VERIFIED_HOST_OBSERVATION',
    observedAt:null as string|null,uptimePercent:null as number|null,
    receiverEnabled:false,oneTestAuthorized:false,connection:'HOLD' as const};
  if(!QL375_SHELLS.some(item=>item.id===sourceId)||!Number.isFinite(nowMs))
    return {...unknown,reason:'INVALID_SOURCE_OR_CLOCK'};
  if(!claim)return unknown;
  if(typeof claim!=='object'||Array.isArray(claim))return {...unknown,reason:'MALFORMED_OBSERVATION'};
  const row=claim as Record<string,unknown>;
  if(Object.keys(row).some(key=>!FIELDS.includes(key))||FIELDS.some(key=>!(key in row))||
    row.sourceId!==sourceId||row.hostId!=='DESKTOP-AE894KC'||
    typeof row.service!=='string'||!OPAQUE.test(row.service)||
    typeof row.observationId!=='string'||!OPAQUE.test(row.observationId)||
    typeof row.reachable!=='boolean'||typeof row.latencyMs!=='number'||
    !Number.isFinite(row.latencyMs)||row.latencyMs<0||row.latencyMs>60000||
    typeof row.observedAt!=='string')return {...unknown,reason:'INVALID_OR_CROSS_SOURCE_OBSERVATION'};
  const at=Date.parse(row.observedAt);
  if(!Number.isFinite(at)||new Date(at).toISOString()!==row.observedAt||at>nowMs)
    return {...unknown,reason:'INVALID_OR_FUTURE_OBSERVATION'};
  if(nowMs-at>MAX_AGE_MS)return {...unknown,status:'STALE' as const,
    reason:'HOST_OBSERVATION_TOO_OLD',observedAt:row.observedAt};
  return {...unknown,status:row.reachable?'UP' as const:'DOWN' as const,
    reason:'UNATTESTED_LOCAL_OBSERVATION',observedAt:row.observedAt};
}

/** Export deliberately contains only public demonstration data and exception routes. */
export function buildQl410DecisionExport(sourceId:QL405SourceId,
  records:readonly unknown[],nowMs:number,capturedAt:string){
  const review=reviewQl409AuditDecisions(sourceId,records,nowMs,capturedAt);
  const safe=(event:QL409AuditEvent)=>({sourceId:event.sourceId,caseId:event.caseId,
    eventId:event.eventId,observedAt:event.observedAt,gate:event.gate,
    decision:event.decision});
  return {schema:'rosevear.ql410.owner-review.v1',sourceId,
    label:'INERT_DEMONSTRATION_NOT_PROTECTED_EVIDENCE',
    exportedAt:new Date(Number.isFinite(nowMs)?nowMs:0).toISOString(),
    receiver:'OFF',connection:'HOLD',oneTestAuthorized:false,
    status:'UNVERIFIED',timeline:review.timeline.map(safe),
    worklist:review.worklist.map(item=>({sourceId:item.sourceId,caseId:item.caseId,
      eventId:item.eventId,gate:item.gate,priority:item.priority,route:item.route})),
    exceptions:review.errors,hostMonitoring:'UNKNOWN',
    note:'No signed original receipt, person identity, credentials or live uptime attestation.'};
}
