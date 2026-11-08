import type {OwnerEntryRole} from './ql374OwnerEntry';
import type {OwnerIncident,OwnerFreshness} from './ql376OwnerIncidents';

export type OwnerIncidentObservation={
  sequence:number;key:string;category:OwnerIncident['category'];severity:OwnerIncident['severity'];
  title:string;detail:string;nextStep:string;
  firstSeenMs:number;lastSeenMs:number;noLongerShownMs:number|null;
  snapshotAt:string;
};
export type OwnerIncidentHistory={role:OwnerEntryRole|null;nextSequence:number;
  observations:OwnerIncidentObservation[]};
export const EMPTY_OWNER_HISTORY:OwnerIncidentHistory={role:null,nextSequence:1,observations:[]};
export const MAX_OWNER_INCIDENT_HISTORY=40;

/** This bounded, memory-only timeline records changes in what the owner UI
 * displayed, not incident creation/closure in the service or source systems. */
export function observeOwnerIncidents(previous:OwnerIncidentHistory,args:{
  role:OwnerEntryRole;aal2:boolean;freshness:OwnerFreshness;
  incidents:OwnerIncident[];nowMs:number;
}):OwnerIncidentHistory{
  const {role,aal2,freshness,incidents,nowMs}=args;
  if(!aal2||!Number.isFinite(nowMs))return EMPTY_OWNER_HISTORY;
  const base=previous.role===role?previous:{role,nextSequence:1,observations:[]};
  // The server-protected, role-matched timestamp is necessary for a logged
  // observation. Neither an offline mock nor an MFA-only login is evidence.
  if(freshness.kind==='unknown'||!freshness.observedAt||
     !Number.isFinite(Date.parse(freshness.observedAt)))return base;
  const keys=new Set(incidents.map(item=>`${item.id}:${item.severity}:${item.title}`));
  let nextSequence=base.nextSequence;
  let changed=false;
  const observations=base.observations.map(entry=>{
    if(entry.noLongerShownMs!==null)return entry;
    if(!keys.has(entry.key)){
      changed=true;
      return {...entry,noLongerShownMs:nowMs};
    }
    if(entry.lastSeenMs===nowMs && entry.snapshotAt===freshness.observedAt)return entry;
    changed=true;
    return {...entry,lastSeenMs:nowMs,snapshotAt:freshness.observedAt!};
  });
  for(const incident of incidents){
    const key=`${incident.id}:${incident.severity}:${incident.title}`;
    if(observations.some(entry=>entry.key===key&&entry.noLongerShownMs===null))continue;
    observations.push({sequence:nextSequence++,key,category:incident.category,
      severity:incident.severity,title:incident.title,detail:incident.detail,
      nextStep:incident.nextStep,firstSeenMs:nowMs,lastSeenMs:nowMs,
      noLongerShownMs:null,snapshotAt:freshness.observedAt});
    changed=true;
  }
  if(!changed)return base;
  return {role,nextSequence,observations:observations.slice(-MAX_OWNER_INCIDENT_HISTORY)};
}

export function incidentAgeLabel(startMs:number,endMs:number):string{
  if(!Number.isFinite(startMs)||!Number.isFinite(endMs))return 'Unknown observation age';
  const elapsed=Math.max(0,Math.floor((endMs-startMs)/1000));
  if(elapsed<60)return `${elapsed} seconds`;
  const minutes=Math.floor(elapsed/60);
  if(minutes<60)return `${minutes} minute${minutes===1?'':'s'}`;
  const hours=Math.floor(minutes/60);
  return hours<24?`${hours} hour${hours===1?'':'s'}`:`${Math.floor(hours/24)} days`;
}

export function ownerIncidentResolutionGuidance(entry:OwnerIncidentObservation):string{
  if(entry.category==='security')return 'Stop any activation or enrollment changes. Recheck our own MFA and the protected server evidence; original-owner approval remains separate.';
  if(entry.category==='freshness')return 'Refresh the protected server status on our own authenticated session. If timestamps still disagree, compare device clocks and request independent I.T. review.';
  return 'Review the read-only six-app shell catalogue and the protected HOLD aggregate. Obtain independent source authorization before treating a connection as active.';
}
