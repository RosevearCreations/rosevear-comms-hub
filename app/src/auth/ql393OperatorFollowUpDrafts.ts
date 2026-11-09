import {MASTER_SHELL_REGISTRY} from './ql386MasterShellRegistry';
import type {QL391CorrelationGroup,QL391CorrelationPreview,QL391Freshness} from './ql391IncidentCorrelationPreview';
import {QL392_DEFAULT_FILTERS,reviewOperatorIncidents} from './ql392OperatorIncidentReview';

export type QL393SourceDecision={
  sourceId:string;correlationId:string;decision:'SIMULATED_APPROVED'|'HOLD';
};
export type QL393MasterDecision={correlationId:string;decision:'SIMULATED_APPROVED'|'HOLD'};
export type QL393SourcePin={sourceId:string;correlationId:string;state:'SIMULATED_MATCH'|'HOLD'};
export type QL393ScopedConsent={sourceId:string;correlationId:string;state:'SIMULATED_GRANTED'|'HOLD'};
export type QL393Scenario={
  sourceDecisions:readonly QL393SourceDecision[];
  masterOwnerDecisions:readonly QL393MasterDecision[];
  sourcePins:readonly QL393SourcePin[];
  receiverEnrollment:'SIMULATED_READY'|'HOLD';
  consents:readonly QL393ScopedConsent[];
};
export type QL393Gate={
  name:'SOURCE_OWNER'|'MASTER_OWNER'|'SOURCE_PIN'|'RECEIVER'|'CONSENT';
  state:'HOLD'|'SIMULATED_PASS';detail:string;
};
export type QL393Draft={
  sourceId:string;correlationId:string;
  kind:'CONFLICT_REVIEW'|'EVIDENCE_RECHECK';
  requestedEvidence:'SOURCE_CONFLICT_PROOF'|'SOURCE_SCOPED_READBACK';
  recipientScope:'SOURCE_SHELL';
  reason:'CONFLICT'|'INVALID'|'MISSING'|'STALE'|'UNKNOWN';
  summary:string;gateState:'HOLD'|'SCENARIO_READY_ONLY';
  gates:QL393Gate[];sendEnabled:false;persisted:false;
};
export type QL393Preview={
  state:'INERT_PREVIEW'|'HOLD';correlationId:string|null;drafts:QL393Draft[];
  reason:string;disclaimer:string;
};

const sourceIds=new Set(MASTER_SHELL_REGISTRY.map(source=>source.id));
const correlationPattern=/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const reasons:Record<QL393Draft['reason'],string>={
  CONFLICT:'Conflicting synthetic incident revision requires independent source review',
  INVALID:'Invalid simulated evidence timestamp requires original source verification',
  MISSING:'Missing simulated evidence requires a new source-scoped readback',
  STALE:'Stale simulated evidence requires a refreshed source-scoped readback',
  UNKNOWN:'No matching simulated evidence observation; request original source verification'
};
const freshnessRank:Record<QL391Freshness,number>={
  CURRENT_SIMULATED:0,UNKNOWN:1,STALE:2,MISSING:3,INVALID:4,CONFLICT:5
};
export const QL393_DEFAULT_SCENARIO:QL393Scenario={
  sourceDecisions:[],masterOwnerDecisions:[],sourcePins:[],
  receiverEnrollment:'HOLD',consents:[]
};

function unsafeReason(group:QL391CorrelationGroup,sourceId:string):QL393Draft['reason']|null{
  const events=group.timeline.filter(event=>event.sourceId===sourceId);
  if(events.some(event=>event.eventState==='PREVIEW_CONFLICT'||event.evidenceFreshness==='CONFLICT'))return 'CONFLICT';
  const worst=events.reduce<QL391Freshness>((current,event)=>
    freshnessRank[event.evidenceFreshness]>freshnessRank[current]?event.evidenceFreshness:current,'CURRENT_SIMULATED');
  return worst==='CURRENT_SIMULATED'?null:worst;
}

function gatesFor(scenario:QL393Scenario,sourceId:string,correlationId:string):QL393Gate[]{
  const matched=scenario.sourceDecisions.filter(item=>item.sourceId===sourceId&&item.correlationId===correlationId);
  const sourceApproved=matched.length===1&&matched[0].decision==='SIMULATED_APPROVED';
  const master=scenario.masterOwnerDecisions.filter(item=>item.correlationId===correlationId);
  const masterApproved=master.length===1&&master[0].decision==='SIMULATED_APPROVED';
  const pins=scenario.sourcePins.filter(item=>item.sourceId===sourceId&&item.correlationId===correlationId);
  const pinMatches=pins.length===1&&pins[0].state==='SIMULATED_MATCH';
  const consents=scenario.consents.filter(item=>item.sourceId===sourceId&&item.correlationId===correlationId);
  const consentMatches=consents.length===1&&consents[0].state==='SIMULATED_GRANTED';
  return [
    {name:'SOURCE_OWNER',state:sourceApproved?'SIMULATED_PASS':'HOLD',
      detail:'Exactly one source-owner decision bound to this source and correlation is required'},
    {name:'MASTER_OWNER',state:masterApproved?'SIMULATED_PASS':'HOLD',
      detail:'Separate master-owner review must approve this exact proposed action'},
    {name:'SOURCE_PIN',state:pinMatches?'SIMULATED_PASS':'HOLD',
      detail:'Original source signing identity and key custody remain unverified'},
    {name:'RECEIVER',state:scenario.receiverEnrollment==='SIMULATED_READY'?'SIMULATED_PASS':'HOLD',
      detail:'Trusted server receiver enrollment and atomic replay protection are not activated'},
    {name:'CONSENT',state:consentMatches?'SIMULATED_PASS':'HOLD',
      detail:'Original scoped operator consent, retention and audit authorization are not attested'}
  ];
}

/** Proposes only source-scoped, fixed-catalogue draft text. Every gate is an
 * untrusted scenario input; even all synthetic passes NEVER permit sending. */
export function previewOperatorFollowUps(
  preview:QL391CorrelationPreview,correlationId:string,scenario:QL393Scenario
):QL393Preview{
  const stopped=(reason:string):QL393Preview=>({state:'HOLD',correlationId:null,drafts:[],reason,
    disclaimer:'No source request, owner approval, incident action or message was created'});
  if(reviewOperatorIncidents(preview,QL392_DEFAULT_FILTERS).state!=='INERT_PREVIEW'||
    typeof correlationId!=='string'||!correlationPattern.test(correlationId))
    return stopped('A valid bounded synthetic review and opaque correlation ID are required');
  if(!scenario||!Array.isArray(scenario.sourceDecisions)||scenario.sourceDecisions.length>50||
    scenario.sourceDecisions.some(item=>!item||!sourceIds.has(item.sourceId)||
      typeof item.correlationId!=='string'||!correlationPattern.test(item.correlationId)||
      !['SIMULATED_APPROVED','HOLD'].includes(item.decision))||
    !Array.isArray(scenario.masterOwnerDecisions)||scenario.masterOwnerDecisions.length>50||
    scenario.masterOwnerDecisions.some(item=>!item||typeof item.correlationId!=='string'||
      !correlationPattern.test(item.correlationId)||!['SIMULATED_APPROVED','HOLD'].includes(item.decision))||
    !Array.isArray(scenario.sourcePins)||scenario.sourcePins.length>50||
    scenario.sourcePins.some(item=>!item||!sourceIds.has(item.sourceId)||
      typeof item.correlationId!=='string'||!correlationPattern.test(item.correlationId)||
      !['SIMULATED_MATCH','HOLD'].includes(item.state))||
    !['SIMULATED_READY','HOLD'].includes(scenario.receiverEnrollment)||
    !Array.isArray(scenario.consents)||scenario.consents.length>50||
    scenario.consents.some(item=>!item||!sourceIds.has(item.sourceId)||
      typeof item.correlationId!=='string'||!correlationPattern.test(item.correlationId)||
      !['SIMULATED_GRANTED','HOLD'].includes(item.state)))
    return stopped('Invalid or unbounded simulated approval inputs; drafts remain blocked');

  const group=preview.groups.find(item=>item.correlationId===correlationId);
  if(!group)return stopped('Selected correlation does not exist in the verified synthetic preview');
  const drafts:QL393Draft[]=[];
  for(const sourceId of group.sourceIds){
    const reason=unsafeReason(group,sourceId);
    if(!reason)continue;
    const gates=gatesFor(scenario,sourceId,correlationId);
    drafts.push({sourceId,correlationId,
      kind:['CONFLICT','INVALID'].includes(reason)?'CONFLICT_REVIEW':'EVIDENCE_RECHECK',
      requestedEvidence:['CONFLICT','INVALID'].includes(reason)?'SOURCE_CONFLICT_PROOF':'SOURCE_SCOPED_READBACK',
      recipientScope:'SOURCE_SHELL',
      reason,summary:reasons[reason],gates,
      gateState:gates.every(gate=>gate.state==='SIMULATED_PASS')?'SCENARIO_READY_ONLY':'HOLD',
      sendEnabled:false,persisted:false});
  }
  return {state:'INERT_PREVIEW',correlationId,drafts,
    reason:drafts.length?'Fixed-language follow-up drafts only; no source request has been transmitted':
      'No synthetic evidence concern warrants a follow-up draft for this group',
    disclaimer:'Even all simulated owner gates passing cannot authorize an original source request, connection, task or message'};
}
