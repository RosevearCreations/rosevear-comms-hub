import {MASTER_SHELL_REGISTRY} from './ql386MasterShellRegistry';
import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import {previewOperatorFollowUps,QL393_DEFAULT_SCENARIO,type QL393Gate,type QL393Scenario} from './ql393OperatorFollowUpDrafts';

export type QL394EvidenceClaim={
  sourceId:string;correlationId:string;gate:QL393Gate['name'];
  referenceId:string;checkedAt:string;
};
export type QL394Snapshot={
  snapshotId:string;observedAt:string;scenario:QL393Scenario;
  evidenceClaims:readonly QL394EvidenceClaim[];
};
export type QL394Provenance='MISSING'|'CONFLICT'|'INVALID'|'STALE_SIMULATED'|'SCENARIO_REFERENCE_ONLY';
export type QL394HistoryEntry={
  snapshotId:string;observedAt:string;sourceId:string;correlationId:string;
  gate:QL393Gate['name'];decision:QL393Gate['state'];
  provenance:QL394Provenance;referenceId:string|null;
};
export type QL394AlertCode='GATE_REVERSAL'|'UNVERIFIED_GRANT_CHANGE'|'PIN_REFERENCE_DRIFT'|'CROSS_SOURCE_REFERENCE_REUSE';
export type QL394DriftAlert={
  code:QL394AlertCode;sourceId:string;gate:QL393Gate['name'];observedAt:string;detail:string;
};
export type QL394History={
  state:'INERT_PREVIEW'|'HOLD';correlationId:string|null;history:QL394HistoryEntry[];
  alerts:QL394DriftAlert[];reason:string;
};

export const QL394_MAX_SNAPSHOTS=12;
export const QL394_MAX_CLAIMS_PER_SNAPSHOT=50;
const FRESH_MS=10*60*1000;
const FUTURE_MS=60*1000;
const utc=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const opaque=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const ref=/^[a-z][a-z0-9-]{1,31}:[A-Za-z0-9_-]{8,100}$/;
const knownSources=new Set<string>(MASTER_SHELL_REGISTRY.map(item=>item.id));
const gateNames=new Set<QL393Gate['name']>(['SOURCE_OWNER','MASTER_OWNER','SOURCE_PIN','RECEIVER','CONSENT']);
const alertDescriptions:Record<QL394AlertCode,string>={
  GATE_REVERSAL:'Previously passing simulated gate returned to HOLD; original authority must be rechecked',
  UNVERIFIED_GRANT_CHANGE:'Simulated HOLD changed to pass without original-owner evidence; no authority granted',
  PIN_REFERENCE_DRIFT:'Claimed signing-pin reference changed across synthetic observations',
  CROSS_SOURCE_REFERENCE_REUSE:'One claimed evidence reference was reused by different shell sources'
};

function validTimestamp(value:unknown){return typeof value==='string'&&utc.test(value)&&Number.isFinite(Date.parse(value));}

/** Builds an ephemeral decision trace from scenario-only snapshots. Claimed
 * reference IDs cannot prove original custody, signing, consent or receiver status. */
export function reviewDraftDecisionHistory(
  preview:QL391CorrelationPreview,correlationId:string,
  snapshots:readonly QL394Snapshot[],nowMs:number
):QL394History{
  const stopped=(reason:string):QL394History=>({state:'HOLD',correlationId:null,history:[],alerts:[],reason});
  if(!Array.isArray(snapshots)||snapshots.length>QL394_MAX_SNAPSHOTS||
     !Number.isFinite(nowMs)||typeof correlationId!=='string'||!opaque.test(correlationId))
    return stopped('Bounded scenario snapshots and a valid evaluation clock are required');
  const baseline=previewOperatorFollowUps(preview,correlationId,QL393_DEFAULT_SCENARIO);
  if(baseline.state!=='INERT_PREVIEW')return stopped('A valid source-scoped QL-393 synthetic review is required');
  const sources=new Set(baseline.drafts.map(draft=>draft.sourceId));
  if(snapshots.some(snapshot=>!snapshot||typeof snapshot.snapshotId!=='string'||
    !opaque.test(snapshot.snapshotId)||!validTimestamp(snapshot.observedAt)||
    Date.parse(snapshot.observedAt)>nowMs+FUTURE_MS||
    !Array.isArray(snapshot.evidenceClaims)||snapshot.evidenceClaims.length>QL394_MAX_CLAIMS_PER_SNAPSHOT||
    snapshot.evidenceClaims.some((claim:QL394EvidenceClaim)=>!claim||!knownSources.has(claim.sourceId)||
      !sources.has(claim.sourceId)||claim.correlationId!==correlationId||!gateNames.has(claim.gate)||
      typeof claim.referenceId!=='string'||!ref.test(claim.referenceId)||
      typeof claim.checkedAt!=='string'))||
    new Set(snapshots.map(snapshot=>snapshot.snapshotId)).size!==snapshots.length)
    return stopped('Snapshot metadata or source-scoped evidence claims are invalid; no history may be shown');

  const ordered=[...snapshots].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||
    a.snapshotId.localeCompare(b.snapshotId));
  const history:QL394HistoryEntry[]=[];
  const alerts:QL394DriftAlert[]=[];
  const preceding=new Map<string,QL394HistoryEntry>();
  const seenReferences=new Map<string,string>();
  const raisedCrossRefs=new Set<string>();
  const alert=(code:QL394AlertCode,entry:QL394HistoryEntry)=>alerts.push({
    code,sourceId:entry.sourceId,gate:entry.gate,observedAt:entry.observedAt,
    detail:alertDescriptions[code]
  });

  for(const snapshot of ordered){
    const review=previewOperatorFollowUps(preview,correlationId,snapshot.scenario);
    if(review.state!=='INERT_PREVIEW')return stopped('Invalid simulated gate scenario; no partial decision history exposed');
    for(const draft of review.drafts){
      for(const gate of draft.gates){
        const matched=snapshot.evidenceClaims.filter((claim:QL394EvidenceClaim)=>claim.sourceId===draft.sourceId&&
          claim.correlationId===correlationId&&claim.gate===gate.name);
        let provenance:QL394Provenance='MISSING';
        let referenceId:string|null=null;
        if(matched.length>1)provenance='CONFLICT';
        else if(matched.length===1){
          const claim=matched[0];
          if(!validTimestamp(claim.checkedAt)||Date.parse(claim.checkedAt)>nowMs+FUTURE_MS)
            provenance='INVALID';
          else if(nowMs-Date.parse(claim.checkedAt)>FRESH_MS)
            provenance='STALE_SIMULATED';
          else provenance='SCENARIO_REFERENCE_ONLY';
          referenceId=claim.referenceId;
        }
        const entry:QL394HistoryEntry={snapshotId:snapshot.snapshotId,
          observedAt:snapshot.observedAt,sourceId:draft.sourceId,correlationId,
          gate:gate.name,decision:gate.state,provenance,referenceId};
        const key=`${entry.sourceId}:${entry.gate}`;
        const prior=preceding.get(key);
        if(prior?.decision==='SIMULATED_PASS'&&entry.decision==='HOLD')alert('GATE_REVERSAL',entry);
        if(prior?.decision==='HOLD'&&entry.decision==='SIMULATED_PASS')alert('UNVERIFIED_GRANT_CHANGE',entry);
        if(entry.gate==='SOURCE_PIN'&&prior?.referenceId&&entry.referenceId&&prior.referenceId!==entry.referenceId)
          alert('PIN_REFERENCE_DRIFT',entry);
        preceding.set(key,entry);
        if(referenceId){
          const priorSource=seenReferences.get(referenceId);
          if(priorSource&&priorSource!==entry.sourceId&&!raisedCrossRefs.has(referenceId)){
            alert('CROSS_SOURCE_REFERENCE_REUSE',entry);raisedCrossRefs.add(referenceId);
          }
          seenReferences.set(referenceId,priorSource??entry.sourceId);
        }
        history.push(entry);
      }
    }
  }
  return {state:'INERT_PREVIEW',correlationId,history,alerts,
    reason:'In-memory simulated decision trace only; no source authority, live evidence or incident request verified'};
}

// Fixed workshop example used by the owner preview. No original proof bytes,
// decisions, signatures or private data are in these illustrative snapshots.
export const QL394_DEMO_NOW=Date.parse('2026-11-09T09:10:00Z');
export const QL394_DEMO_HISTORY:readonly QL394Snapshot[]=[
  {snapshotId:'snapshot-ql394-0001',observedAt:'2026-11-09T09:00:00Z',
    scenario:QL393_DEFAULT_SCENARIO,evidenceClaims:[
      {sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_PIN',
        referenceId:'pin:QL394DEMO0001',checkedAt:'2026-11-09T09:00:00Z'}]},
  {snapshotId:'snapshot-ql394-0002',observedAt:'2026-11-09T09:03:00Z',
    scenario:{...QL393_DEFAULT_SCENARIO,
      sourceDecisions:[{sourceId:'devilndove',correlationId:'correlation-ql392-workshop',decision:'SIMULATED_APPROVED'}],
      sourcePins:[{sourceId:'devilndove',correlationId:'correlation-ql392-workshop',state:'SIMULATED_MATCH'}]},
    evidenceClaims:[{sourceId:'devilndove',correlationId:'correlation-ql392-workshop',gate:'SOURCE_PIN',
      referenceId:'pin:QL394DEMO0002',checkedAt:'2026-11-09T09:03:00Z'}]},
  {snapshotId:'snapshot-ql394-0003',observedAt:'2026-11-09T09:06:00Z',
    scenario:QL393_DEFAULT_SCENARIO,evidenceClaims:[]}
];
