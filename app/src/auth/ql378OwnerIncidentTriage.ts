import type {OwnerIncidentObservation} from './ql377OwnerIncidentHistory';

export type OwnerIncidentEvidence='recent'|'expiring'|'expired'|'clock-review'|'unavailable';
export type OwnerIncidentPriority='verify-evidence'|'action'|'review'|'monitor'|'historical';
export type OwnerIncidentTriageGroup={
  id:string;latest:OwnerIncidentObservation;occurrences:OwnerIncidentObservation[];
  evidence:OwnerIncidentEvidence;priority:OwnerIncidentPriority;stillDisplayed:boolean;
};
export type OwnerIncidentTriageOptions={
  nowMs:number;search:string;status:'all'|'showing'|'ended';
  severity:'all'|OwnerIncidentObservation['severity'];groupRepeats:boolean;
};

/** Evidence is a protected *aggregate timestamp*, never a per-source probe. */
export function ownerTriageEvidence(snapshotAt:string,nowMs:number):OwnerIncidentEvidence{
  const observedMs=Date.parse(snapshotAt);
  if(!Number.isFinite(observedMs)||!Number.isFinite(nowMs))return 'unavailable';
  const elapsedMs=nowMs-observedMs;
  if(elapsedMs< -10000)return 'clock-review';
  if(elapsedMs>120000)return 'expired';
  if(elapsedMs>=90000)return 'expiring';
  return 'recent';
}

export const OWNER_EVIDENCE_LABELS:Record<OwnerIncidentEvidence,string>={
  recent:'Recent protected aggregate (not independently source-verified)',
  expiring:'Protected aggregate approaching expiry',
  expired:'Historical aggregate — refresh required',
  'clock-review':'Clock discrepancy — verify timestamp',
  unavailable:'Protected aggregate timestamp unavailable'
};

export function ownerTriagePriority(entry:OwnerIncidentObservation,
  evidence:OwnerIncidentEvidence):OwnerIncidentPriority{
  if(entry.noLongerShownMs!==null)return 'historical';
  if(evidence!=='recent'&&evidence!=='expiring')return 'verify-evidence';
  if(entry.severity==='action')return 'action';
  if(entry.severity==='warning')return 'review';
  return 'monitor';
}

const priorities:OwnerIncidentPriority[]=['verify-evidence','action','review','monitor','historical'];
const searchText=(entry:OwnerIncidentObservation)=>
  [entry.title,entry.category,entry.severity,entry.detail,entry.nextStep].join(' ').toLocaleLowerCase();

/** Groups repeated UI observations without deleting or coalescing their
 * original occurrence timestamps, display transitions or sequence IDs. */
export function ownerIncidentTriage(observations:readonly OwnerIncidentObservation[],
  options:OwnerIncidentTriageOptions):OwnerIncidentTriageGroup[]{
  const term=options.search.trim().slice(0,100).toLocaleLowerCase();
  const selected=observations.filter(entry=>
    (options.status==='all'||(options.status==='showing'?entry.noLongerShownMs===null:entry.noLongerShownMs!==null))&&
    (options.severity==='all'||entry.severity===options.severity)&&
    (!term||searchText(entry).includes(term)));
  const map=new Map<string,OwnerIncidentObservation[]>();
  for(const entry of selected){
    const key=options.groupRepeats?entry.key:`occurrence-${entry.sequence}`;
    const group=map.get(key)??[];
    group.push(entry);
    map.set(key,group);
  }
  return Array.from(map,([id,occurrences])=>{
    const ordered=occurrences.slice().sort((a,b)=>a.sequence-b.sequence);
    // If repeated, the newest occurrence is the current display candidate.
    const latest=ordered[ordered.length-1];
    const evidence=ownerTriageEvidence(latest.snapshotAt,options.nowMs);
    return {id,latest,occurrences:ordered,evidence,
      priority:ownerTriagePriority(latest,evidence),
      stillDisplayed:latest.noLongerShownMs===null};
  }).sort((a,b)=>priorities.indexOf(a.priority)-priorities.indexOf(b.priority)||
    b.latest.firstSeenMs-a.latest.firstSeenMs||b.latest.sequence-a.latest.sequence);
}
