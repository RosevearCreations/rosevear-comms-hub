import type {OwnerProgress} from './ql370OwnerProgress';
import type {OwnerEntryRole} from './ql374OwnerEntry';
import {ownerEntryTruth} from './ql374OwnerEntry';

type Truth=ReturnType<typeof ownerEntryTruth>;
export type OwnerIncidentCategory='security'|'freshness'|'connection';
export type OwnerIncidentSeverity='action'|'warning'|'information';
export type OwnerIncident={
  id:string;category:OwnerIncidentCategory;severity:OwnerIncidentSeverity;
  title:string;detail:string;nextStep:string;
};

export type OwnerFreshness={
  label:string;kind:'current'|'expiring'|'stale'|'future'|'unknown';
  ageSeconds:number|null;observedAt:string|null;
};

/** A raw timestamp is not trusted as this owner's status until the protected
 * AAL2 readback identifies their role. No independent shell probes occur. */
export function ownerReadbackFreshness(args:{
  progress:OwnerProgress|null;role:OwnerEntryRole;aal2:boolean;nowMs:number;
}):OwnerFreshness{
  const {progress,role,aal2,nowMs}=args;
  if(!aal2||!progress?.sessionAal2Verified||progress.ownerRole!==role||
     progress.state!=='ORIGINAL_OWNER_PROGRESS_READ_ONLY'||!Number.isFinite(nowMs)){
    return {label:'No verified personal readback',kind:'unknown',ageSeconds:null,observedAt:null};
  }
  const stamp=Date.parse(progress.snapshotAt);
  if(!Number.isFinite(stamp))return {
    label:'Invalid protected timestamp',kind:'unknown',ageSeconds:null,observedAt:null
  };
  const age=Math.floor((nowMs-stamp)/1000);
  if(age < -10)return {label:'Clock discrepancy — review',kind:'future',ageSeconds:age,observedAt:progress.snapshotAt};
  if(age>120)return {label:'Expired — refresh required',kind:'stale',ageSeconds:age,observedAt:progress.snapshotAt};
  if(age>=90)return {label:'Expiring soon — refresh',kind:'expiring',ageSeconds:age,observedAt:progress.snapshotAt};
  return {label:'Recent protected readback',kind:'current',ageSeconds:age,observedAt:progress.snapshotAt};
}

/** Operator-facing incidents are derived solely from the protected owner
 * readback. They are not persisted, assigned, acknowledged or auto-resolved. */
export function ownerIncidents(truth:Truth,freshness:OwnerFreshness):OwnerIncident[]{
  const incidents:OwnerIncident[]=[];
  if(truth.state==='STOP_REVIEW')incidents.push({
    id:'security-stop',category:'security',severity:'action',title:'Protected truth discrepancy',
    detail:'The protected aggregate snapshot conflicts with the expected shell HOLD, audit or owner membership state.',
    nextStep:'Stop here. Review I.T. status and ask an original owner to investigate the server evidence.'
  });
  else if(truth.state==='MFA_REQUIRED')incidents.push({
    id:'security-mfa',category:'security',severity:'action',title:'Personal authenticator required',
    detail:'AAL2 is not verified for this owner session. No protected status is trusted.',
    nextStep:'Complete our own personal MFA challenge before refreshing protected status.'
  });
  if(freshness.kind==='future'||freshness.kind==='stale')incidents.push({
    id:'freshness-expired',category:'freshness',severity:'action',title:freshness.label,
    detail:freshness.kind==='future'?'The server timestamp is ahead of the local clock by more than ten seconds. Do not treat this reading as current.':
      'The protected readback is older than two minutes. Its previous HOLD state is historical, not a current connection verdict.',
    nextStep:'Check both clocks when necessary, then use the protected owner status refresh below.'
  });
  else if(freshness.kind==='expiring'||freshness.kind==='unknown')incidents.push({
    id:'freshness-review',category:'freshness',severity:'warning',title:freshness.label,
    detail:freshness.kind==='unknown'?'There is no trustworthy, role-matched protected timestamp to review.':
      'The last verified snapshot is approaching its two-minute expiry.',
    nextStep:'Return to the server-protected owner status refresh; this view cannot initiate or approve connections.'
  });
  if(truth.state==='READBACK_REQUIRED'&&freshness.kind==='current')incidents.push({
    id:'security-unmatched',category:'security',severity:'warning',title:'Protected status does not match this session',
    detail:'A timestamp alone is insufficient to establish an authorized, reconciled owner readback.',
    nextStep:'Confirm our personal role and obtain a fresh server-verified status.'
  });
  incidents.push({
    id:'connections-held',category:'connection',severity:'information',
    title:truth.held?'Six application shells held':'Application connections not independently verified',
    detail:truth.held?'A recent protected aggregate reported 6 of 6 shells DISCONNECTED / HOLD. It is not six independent live source checks.':
      'There is no fresh, consistent six-shell aggregate proving individual live connections. Do not infer access.',
    nextStep:'Use the six-app read-only detail cards for identity context. Source approval and customer access remain separate.'
  });
  return incidents;
}
