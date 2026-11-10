import {QL375_SHELLS} from './ql375OwnerStatus';
import type {QL405SourceId} from './ql405AcknowledgementLedger';
import {QL408_AUDIT_GATES,type QL408GateCode} from './ql408ProtectedAdapterContract';

export type QL409AuditEvent={sourceId:string;caseId:string;eventId:string;
  observedAt:string;gate:QL408GateCode;
  actorRole:'SOURCE_OWNER'|'INDEPENDENT_REVIEWER'|'MASTER_OWNER'|'RECEIVER_OPERATOR';
  decision:'HOLD'|'REJECTED'|'REVIEW_REQUESTED';reference:string};
export const QL409_DEMO_CAPTURED='2026-11-10T15:00:00.000Z';
export const QL409_DEMO_EVENTS:readonly QL409AuditEvent[]=Object.freeze([
  {sourceId:'yw',caseId:'demo_ql409_yw',eventId:'demo_event_001',
    observedAt:'2026-11-10T13:00:00.000Z',gate:'SOURCE_CUSTODY',
    actorRole:'SOURCE_OWNER',decision:'REVIEW_REQUESTED',reference:'demo_ref_yw_001'},
  {sourceId:'yw',caseId:'demo_ql409_yw',eventId:'demo_event_002',
    observedAt:'2026-11-10T14:00:00.000Z',gate:'INDEPENDENT_REVIEW',
    actorRole:'INDEPENDENT_REVIEWER',decision:'HOLD',reference:'demo_ref_yw_002'},
  {sourceId:'icamp',caseId:'demo_ql409_icamp',eventId:'demo_event_003',
    observedAt:'2026-11-10T12:00:00.000Z',gate:'CONSENT',
    actorRole:'RECEIVER_OPERATOR',decision:'REJECTED',reference:'demo_ref_icamp_003'}
]);
const OPAQUE=/^[A-Za-z0-9][A-Za-z0-9_-]{7,95}$/;
const ROLES=['SOURCE_OWNER','INDEPENDENT_REVIEWER','MASTER_OWNER','RECEIVER_OPERATOR'];
const DECISIONS=['HOLD','REJECTED','REVIEW_REQUESTED'];
const MAX_AGE_MS=24*60*60*1000;

/** Inert source-scoped operator view. Neither input records nor claimed roles
 * are signatures; this function never makes an authorization decision. */
export function reviewQl409AuditDecisions(sourceId:QL405SourceId,records:readonly unknown[],
  nowMs:number,capturedAt=QL409_DEMO_CAPTURED){
  const errors:string[]=[];
  const validSource=QL375_SHELLS.some(source=>source.id===sourceId);
  const captured=Date.parse(capturedAt);
  if(!validSource||!Number.isFinite(nowMs))errors.push('INVALID_SOURCE_OR_CLOCK');
  const stale=!Number.isFinite(captured)||!Number.isFinite(nowMs)||
    nowMs<captured||nowMs-captured>MAX_AGE_MS;
  const seen=new Set<string>();
  const timeline:QL409AuditEvent[]=[];
  for(const unknownRecord of records){
    if(!unknownRecord||typeof unknownRecord!=='object'||Array.isArray(unknownRecord)){
      errors.push('INVALID_AUDIT_RECORD');continue;
    }
    const row=unknownRecord as Record<string,unknown>;
    if(Object.keys(row).some(key=>!['sourceId','caseId','eventId','observedAt',
      'gate','actorRole','decision','reference'].includes(key))||
      row.sourceId!==sourceId||typeof row.caseId!=='string'||!OPAQUE.test(row.caseId)||
      typeof row.eventId!=='string'||!OPAQUE.test(row.eventId)||
      typeof row.reference!=='string'||!OPAQUE.test(row.reference)||
      typeof row.observedAt!=='string'||!QL408_AUDIT_GATES.some(g=>g.code===row.gate)||
      !ROLES.includes(String(row.actorRole))||!DECISIONS.includes(String(row.decision))){
      errors.push('INVALID_OR_CROSS_SOURCE_AUDIT');continue;
    }
    const at=Date.parse(row.observedAt);
    if(!Number.isFinite(at)||new Date(at).toISOString()!==row.observedAt||
      at>nowMs||at>captured||seen.has(row.eventId)){
      errors.push('DUPLICATE_OR_INVALID_TIME');continue;
    }
    seen.add(row.eventId);
    timeline.push(row as QL409AuditEvent);
  }
  timeline.sort((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.eventId.localeCompare(b.eventId));
  const worklist=timeline.map(item=>({sourceId:item.sourceId,caseId:item.caseId,
    eventId:item.eventId,gate:item.gate,priority:item.decision==='REJECTED'?'REVIEW_NOW':
      stale?'REFRESH_STALE_EVIDENCE':'INDEPENDENT_FOLLOW_UP',
    route:item.actorRole==='INDEPENDENT_REVIEWER'?'MASTER_OWNER_REVIEW':
      'INDEPENDENT_REVIEW_REQUIRED'}));
  if(!timeline.length)errors.push('NO_SOURCE_AUDIT_EVENTS');
  if(stale)errors.push('STALE_REVIEW_SNAPSHOT');
  return {sourceId,timeline,worklist,errors:[...new Set(errors)],stale,
    state:'RECEIVER_OFF_RECOVERY_REVIEW' as const,
    connection:'HOLD' as const,receiverEnabled:false,oneTestAuthorized:false,
    persisted:false,networkRequests:0,credentialsDisclosed:false};
}
