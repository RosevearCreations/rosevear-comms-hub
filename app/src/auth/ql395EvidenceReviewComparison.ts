import type {QL391CorrelationPreview} from './ql391IncidentCorrelationPreview';
import {reviewDraftDecisionHistory,type QL394AlertCode,type QL394HistoryEntry,
  type QL394Provenance,type QL394Snapshot} from './ql394DraftDecisionHistory';
import type {QL393Gate} from './ql393OperatorFollowUpDrafts';

export type QL395ComparisonKind='UNCHANGED'|'SIMULATED_GRANT_CHANGE'|
  'REVERTED_TO_HOLD'|'REFERENCE_CHANGED'|'PROVENANCE_CHANGED';
export type QL395GateComparison={
  sourceId:string;correlationId:string;gate:QL393Gate['name'];
  beforeDecision:QL393Gate['state'];afterDecision:QL393Gate['state'];
  beforeProvenance:QL394Provenance;afterProvenance:QL394Provenance;
  beforeReference:string|null;afterReference:string|null;
  kind:QL395ComparisonKind;authorization:'HOLD';
};
export type QL395ResolutionGuidance={
  code:QL394AlertCode;sourceId:string;gate:QL393Gate['name'];
  observedAt:string;requiredReview:string;
  ownerState:'NOT_ATTESTED';resolution:'OPEN_REVIEW_ONLY';
};
export type QL395OwnerContinuity={
  sourceId:string;ownerGate:'SOURCE_OWNER'|'MASTER_OWNER';
  priorScenarioDecision:QL393Gate['state'];latestScenarioDecision:QL393Gate['state'];
  originalOwnerEvidence:'NOT_VERIFIED';continuity:'HOLD_RECHECK_ORIGINAL';
};
export type QL395ComparisonReview={
  state:'INERT_PREVIEW'|'HOLD';correlationId:string|null;
  fromSnapshotId:string|null;toSnapshotId:string|null;
  comparisons:QL395GateComparison[];resolutions:QL395ResolutionGuidance[];
  ownerContinuity:QL395OwnerContinuity[];
  changedGates:number;reason:string;sendEnabled:false;persisted:false;
};

const guidance:Record<QL394AlertCode,string>={
  UNVERIFIED_GRANT_CHANGE:'Obtain independent original owner decision and scope evidence; a synthetic pass cannot authorize an action.',
  GATE_REVERSAL:'Recheck the owner decision and original evidence chain; keep affected source actions on HOLD.',
  PIN_REFERENCE_DRIFT:'Reconcile original source-bound key custody, public pin and witness record without adopting the new reference.',
  CROSS_SOURCE_REFERENCE_REUSE:'Investigate both shell identities independently; reject shared or cross-tenant authorization assumptions.'
};

function pairKey(entry:QL394HistoryEntry){return `${entry.sourceId}/${entry.gate}`;}

/** Rechecks the complete QL-394 synthetic history before comparing two ordered
 * observations. No claimed reference can be promoted to original authority. */
export function compareOperatorEvidenceReviews(
  preview:QL391CorrelationPreview,correlationId:string,
  snapshots:readonly QL394Snapshot[],fromSnapshotId:string,toSnapshotId:string,
  nowMs:number
):QL395ComparisonReview{
  const stopped=(reason:string):QL395ComparisonReview=>({state:'HOLD',correlationId:null,
    fromSnapshotId:null,toSnapshotId:null,comparisons:[],resolutions:[],ownerContinuity:[],
    changedGates:0,reason,sendEnabled:false,persisted:false});
  const history=reviewDraftDecisionHistory(preview,correlationId,snapshots,nowMs);
  if(history.state!=='INERT_PREVIEW')return stopped('QL-394 source-scoped scenario validation failed; comparison is blocked');
  const from=snapshots.find(item=>item.snapshotId===fromSnapshotId);
  const to=snapshots.find(item=>item.snapshotId===toSnapshotId);
  if(!from||!to||fromSnapshotId===toSnapshotId||Date.parse(from.observedAt)>=Date.parse(to.observedAt))
    return stopped('Choose two distinct chronological synthetic observations for comparison');

  const before=history.history.filter(entry=>entry.snapshotId===fromSnapshotId);
  const after=history.history.filter(entry=>entry.snapshotId===toSnapshotId);
  if(!before.length||before.length!==after.length)
    return stopped('Comparable source-scoped synthetic gate histories are unavailable');
  const previousByGate=new Map(before.map(entry=>[pairKey(entry),entry]));
  if(previousByGate.size!==before.length||new Set(after.map(pairKey)).size!==after.length||
    after.some(entry=>!previousByGate.has(pairKey(entry))))
    return stopped('Owner gate identity continuity cannot be established even in the synthetic scenario');

  const comparisons:QL395GateComparison[]=after.map(entry=>{
    const prior=previousByGate.get(pairKey(entry))!;
    const kind:QL395ComparisonKind=prior.referenceId!==entry.referenceId&&prior.referenceId&&entry.referenceId?
      'REFERENCE_CHANGED':prior.decision==='HOLD'&&entry.decision==='SIMULATED_PASS'?
      'SIMULATED_GRANT_CHANGE':prior.decision==='SIMULATED_PASS'&&entry.decision==='HOLD'?
      'REVERTED_TO_HOLD':prior.provenance!==entry.provenance||prior.referenceId!==entry.referenceId?
      'PROVENANCE_CHANGED':'UNCHANGED';
    return {sourceId:entry.sourceId,correlationId:entry.correlationId,gate:entry.gate,
      beforeDecision:prior.decision,afterDecision:entry.decision,
      beforeProvenance:prior.provenance,afterProvenance:entry.provenance,
      beforeReference:prior.referenceId,afterReference:entry.referenceId,kind,authorization:'HOLD'};
  });
  const resolutions:QL395ResolutionGuidance[]=history.alerts
    .filter(alert=>Date.parse(alert.observedAt)>Date.parse(from.observedAt)&&
      Date.parse(alert.observedAt)<=Date.parse(to.observedAt))
    .map(alert=>({code:alert.code,sourceId:alert.sourceId,gate:alert.gate,
      observedAt:alert.observedAt,requiredReview:guidance[alert.code],
      ownerState:'NOT_ATTESTED',resolution:'OPEN_REVIEW_ONLY'}));
  const ownerContinuity:QL395OwnerContinuity[]=comparisons
    .filter(entry=>entry.gate==='SOURCE_OWNER'||entry.gate==='MASTER_OWNER')
    .map(entry=>({sourceId:entry.sourceId,
      ownerGate:entry.gate as QL395OwnerContinuity['ownerGate'],
      priorScenarioDecision:entry.beforeDecision,latestScenarioDecision:entry.afterDecision,
      originalOwnerEvidence:'NOT_VERIFIED',continuity:'HOLD_RECHECK_ORIGINAL'}));
  return {state:'INERT_PREVIEW',correlationId,fromSnapshotId,toSnapshotId,comparisons,
    resolutions,ownerContinuity,changedGates:comparisons.filter(item=>item.kind!=='UNCHANGED').length,
    reason:'Scenario comparison and original-owner recheck guidance only; no decision acceptance or authorization',
    sendEnabled:false,persisted:false};
}
