import {MASTER_SHELL_REGISTRY} from './ql386MasterShellRegistry';
import type {QL391CorrelationGroup,QL391CorrelationPreview,QL391Freshness,QL391TimelineEvent} from './ql391IncidentCorrelationPreview';

export type QL392Priority='REVIEW_NOW'|'VERIFY_EVIDENCE'|'MONITOR_ONLY';
export type QL392Filters={
  sourceId:string;
  freshness:'ALL'|'ATTENTION'|'CURRENT';
  priority:'ALL'|QL392Priority;
};
export type QL392GroupReview={
  correlationId:string;sourceIds:string[];latestOccurredAt:string;timelineCount:number;
  freshness:QL391Freshness;priority:QL392Priority;guidance:string;
};
export type QL392SourceImpact={
  sourceId:string;name:string;correlatedGroups:number;timelineEntries:number;
  attentionGroups:number;highestPriority:QL392Priority|'NONE';
};
export type QL392Review={
  state:'INERT_PREVIEW'|'HOLD';groups:QL392GroupReview[];
  impact:QL392SourceImpact[];totalGroups:number;attentionGroups:number;
  heldUnverified:number;reason:string;
};

const knownSources=new Set<string>(MASTER_SHELL_REGISTRY.map(source=>source.id));
const priorities:Record<QL392Priority,number>={REVIEW_NOW:0,VERIFY_EVIDENCE:1,MONITOR_ONLY:2};
const freshnessCodes=new Set<QL391Freshness>(['CURRENT_SIMULATED','UNKNOWN','STALE','MISSING','INVALID','CONFLICT']);
const freshnessRank:Record<QL391Freshness,number>={
  CURRENT_SIMULATED:0,UNKNOWN:1,STALE:2,MISSING:3,INVALID:4,CONFLICT:5
};
export const QL392_DEFAULT_FILTERS:QL392Filters={sourceId:'ALL',freshness:'ALL',priority:'ALL'};

function priorityFor(group:QL391CorrelationGroup):{priority:QL392Priority;guidance:string}{
  const events=group.timeline;
  if(events.some(item=>item.eventState==='PREVIEW_CONFLICT'||
      item.evidenceFreshness==='CONFLICT'||item.evidenceFreshness==='INVALID'))
    return {priority:'REVIEW_NOW',guidance:'Synthetic conflict or invalid evidence: reconcile source claims before follow-up'};
  if(events.some(item=>item.evidenceFreshness!=='CURRENT_SIMULATED'))
    return {priority:'VERIFY_EVIDENCE',guidance:'Evidence missing, stale or unknown: request a source-scoped verified readback'};
  return {priority:'MONITOR_ONLY',guidance:'Illustrative observations are recent; no live action or acknowledgement is authorized'};
}

function validEvent(event:QL391TimelineEvent,group:QL391CorrelationGroup):boolean{
  return event&&Number.isInteger(event.sequence)&&event.sequence>0&&
    group.sourceIds.includes(event.sourceId)&&knownSources.has(event.sourceId)&&
    ['PREVIEW_NEW','PREVIEW_DUPLICATE','PREVIEW_CONFLICT'].includes(event.eventState)&&
    freshnessCodes.has(event.evidenceFreshness)&&Number.isFinite(Date.parse(event.occurredAt))&&
    /^[A-Z][A-Z0-9_]{2,63}$/.test(event.eventCode);
}

function validGroup(group:QL391CorrelationGroup):boolean{
  return Boolean(group&&typeof group.correlationId==='string'&&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(group.correlationId)&&
    Array.isArray(group.sourceIds)&&group.sourceIds.length>0&&group.sourceIds.length<=6&&
    group.sourceIds.every(id=>knownSources.has(id))&&new Set(group.sourceIds).size===group.sourceIds.length&&
    Array.isArray(group.timeline)&&group.timeline.length>0&&group.timeline.length<=50&&
    group.timeline.every(event=>validEvent(event,group))&&
    new Set(group.timeline.map(event=>event.sourceId)).size===group.sourceIds.length&&
    freshnessCodes.has(group.overallFreshness)&&
    group.firstOccurredAt===group.timeline[0].occurredAt&&
    group.lastOccurredAt===group.timeline[group.timeline.length-1].occurredAt&&
    group.timeline.every((event,index)=>index===0||
      Date.parse(group.timeline[index-1].occurredAt)<=Date.parse(event.occurredAt)));
}

/** Read-only QL-391 projection. This does not create tasks, deliver alerts,
 * verify source identity, expand tenant access or claim a live incident. */
export function reviewOperatorIncidents(preview:QL391CorrelationPreview,filters:QL392Filters):QL392Review{
  const emptyImpact=MASTER_SHELL_REGISTRY.map(source=>({sourceId:source.id,name:source.name,
    correlatedGroups:0,timelineEntries:0,attentionGroups:0,highestPriority:'NONE' as const}));
  const held=Number.isInteger(preview?.heldUnverified)&&preview.heldUnverified>=0?preview.heldUnverified:0;
  const stopped=(reason:string):QL392Review=>({state:'HOLD',groups:[],impact:emptyImpact,
    totalGroups:0,attentionGroups:0,heldUnverified:held,reason});
  if(preview?.state!=='INERT_PREVIEW'||!Array.isArray(preview.groups)||preview.groups.length>50||
     preview.groups.some(group=>!validGroup(group))||
     preview.groups.reduce((sum,group)=>sum+group.timeline.length,0)>50||
     new Set(preview.groups.map(group=>group.correlationId)).size!==preview.groups.length)
    return stopped('A valid bounded QL-391 synthetic correlation preview is required');
  if(!filters||!['ALL',...knownSources].includes(filters.sourceId)||
     !['ALL','ATTENTION','CURRENT'].includes(filters.freshness)||
     !['ALL','REVIEW_NOW','VERIFY_EVIDENCE','MONITOR_ONLY'].includes(filters.priority))
    return stopped('Unrecognized source, freshness or priority filter; no operator results released');

  const all=preview.groups.map(group=>{
    const {priority,guidance}=priorityFor(group);
    const freshness=group.timeline.reduce<QL391Freshness>((worst,event)=>
      freshnessRank[event.evidenceFreshness]>freshnessRank[worst]?event.evidenceFreshness:worst,'CURRENT_SIMULATED');
    return {correlationId:group.correlationId,sourceIds:[...group.sourceIds],
      latestOccurredAt:group.lastOccurredAt,timelineCount:group.timeline.length,
      freshness,priority,guidance};
  });
  const impact:QL392SourceImpact[]=MASTER_SHELL_REGISTRY.map(source=>{
    const matching=all.filter(group=>group.sourceIds.includes(source.id));
    return {sourceId:source.id,name:source.name,correlatedGroups:matching.length,
      timelineEntries:preview.groups.filter(group=>group.sourceIds.includes(source.id))
        .reduce((sum,group)=>sum+group.timeline.filter(event=>event.sourceId===source.id).length,0),
      attentionGroups:matching.filter(group=>group.priority!=='MONITOR_ONLY').length,
      highestPriority:matching.length?matching.reduce<QL392Priority>((best,group)=>
        priorities[group.priority]<priorities[best]?group.priority:best,'MONITOR_ONLY'):'NONE'};
  });
  const groups=all.filter(group=>
    (filters.sourceId==='ALL'||group.sourceIds.includes(filters.sourceId))&&
    (filters.freshness==='ALL'||(filters.freshness==='ATTENTION'?group.priority!=='MONITOR_ONLY':
      group.freshness==='CURRENT_SIMULATED'&&group.priority==='MONITOR_ONLY'))&&
    (filters.priority==='ALL'||group.priority===filters.priority))
    .sort((a,b)=>priorities[a.priority]-priorities[b.priority]||
      Date.parse(b.latestOccurredAt)-Date.parse(a.latestOccurredAt)||
      a.correlationId.localeCompare(b.correlationId));
  return {state:'INERT_PREVIEW',groups,impact,totalGroups:all.length,
    attentionGroups:all.filter(group=>group.priority!=='MONITOR_ONLY').length,
    heldUnverified:held,
    reason:'Priority suggestions and source impact are derived from synthetic scenarios only; no operator work or permissions changed'};
}

// Fixed illustrative records for the owner preview: no signing credentials, source
// requests, live incident fetches or customer records are supplied.
const demoEvent=(sourceId:string,eventCode:string,occurredAt:string,
  evidenceFreshness:QL391Freshness,eventState:QL391TimelineEvent['eventState']='PREVIEW_NEW',sequence=1):QL391TimelineEvent=>({
  sequence,sourceId,eventCode,occurredAt,evidenceFreshness,eventState
});
const demoGroup=(correlationId:string,timeline:QL391TimelineEvent[],
  overallFreshness:QL391Freshness):QL391CorrelationGroup=>({
  correlationId,sourceIds:[...new Set(timeline.map(event=>event.sourceId))].sort(),
  firstOccurredAt:timeline[0].occurredAt,lastOccurredAt:timeline[timeline.length-1].occurredAt,
  overallFreshness,timeline
});
export const QL392_ILLUSTRATIVE_PREVIEW:QL391CorrelationPreview={
  state:'INERT_PREVIEW',heldUnverified:1,reason:'Static synthetic demonstration only',groups:[
    demoGroup('correlation-ql392-integration',[
      demoEvent('yw','SOURCE_HEALTH_STALE','2026-11-09T09:00:00Z','CURRENT_SIMULATED'),
      demoEvent('icamp','INTEGRATION_DELAYED','2026-11-09T09:02:00Z','STALE','PREVIEW_NEW',2)
    ],'STALE'),
    demoGroup('correlation-ql392-workshop',[
      demoEvent('devilndove','SOURCE_ROUTE_DRIFT','2026-11-09T09:04:00Z','CONFLICT','PREVIEW_CONFLICT')
    ],'CONFLICT'),
    demoGroup('correlation-ql392-service',[
      demoEvent('rosiedazzlers','SERVICE_REVIEW','2026-11-09T09:06:00Z','CURRENT_SIMULATED')
    ],'CURRENT_SIMULATED'),
    demoGroup('correlation-ql392-local',[
      demoEvent('rosevear-ai-hub','LOCAL_EVIDENCE_MISSING','2026-11-09T09:07:00Z','MISSING')
    ],'MISSING')
  ]
};
