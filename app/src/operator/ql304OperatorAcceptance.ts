import {operatorOrganizations,type OrganizationId,type OperatorWorkspace} from './ql191Organizations';
import {dashboardQueues} from './ql191DashboardData';
import {ql296Fixtures} from './ql296GuidedIntake';
import {ql297ForOrganization} from './ql297Omnichannel';
import {QL303_GATES,QL303_ROWS} from './ql303CapabilityReadiness';

export const QL304_STEPS=[
  {id:'intake',label:'Guided intake',workspace:'guided_intake',review:'Review the four-choice sample inquiry and UNSENT quote handoff; no price, booking or payment.',category:'intake'},
  {id:'event',label:'Omnichannel event',workspace:'event_timeline',review:'Inspect synthetic source and delivery/error states; replay/recover is memory-only.',category:'call'},
  {id:'inbox',label:'Priority inbox',workspace:'inbox',review:'Find the company-scoped fictional conversation and consent-aware triage.',category:'reply'},
  {id:'contact',label:'Contact context',workspace:'contacts',review:'Check restricted consent and duplicate candidate without merging identities.',category:'reply'},
  {id:'draft',label:'Unsent draft',workspace:'composer',review:'Inspect the redacted local reply draft and recovery; do not send.',category:'reply'},
  {id:'task',label:'Operator task & handoff',workspace:'queue',review:'Review mock owner workload and UNSENT follow-up handoff.',category:'task'},
  {id:'management',label:'Management readback',workspace:'management',review:'Compare the company-only incident/status cards to the mock queue.',category:'task'},
  {id:'statistics',label:'Statistics provenance',workspace:'analytics',review:'Inspect fictional trend/table parity, window freshness and source explanation.',category:'reply'}
] as const satisfies ReadonlyArray<{id:string;label:string;workspace:OperatorWorkspace;review:string;category:string}>;

export type Ql304StepId=typeof QL304_STEPS[number]['id'];
export type Ql304Acceptance={organizationId:OrganizationId;checked:readonly Ql304StepId[];ownerAccepted:false;livePilotAuthorized:false};

export function ql304Journey(organizationId:OrganizationId){
  const company=operatorOrganizations.find(item=>item.id===organizationId);
  const intake=ql296Fixtures.find(item=>item.organizationId===organizationId);
  if(!company||!intake)throw Error('UNKNOWN_COMPANY');
  const events=ql297ForOrganization(organizationId);
  const queue=dashboardQueues[organizationId];
  if(events.length!==6||queue.length!==4||new Set(queue.map(item=>item.category)).size!==4)
    throw Error('INCOMPLETE_OR_CROSS_COMPANY_FIXTURES');
  return {company,intake,events,queue,steps:QL304_STEPS.map(step=>({
    ...step,reference:step.id==='intake'?intake.reference:step.id==='event'?events[0].source:
      queue.find(item=>item.category===step.category)?.id??queue[0].id,
    fixtureOnly:true,externalActions:0
  }))};
}

export function ql304EmptyAcceptance(organizationId:OrganizationId):Ql304Acceptance{
  ql304Journey(organizationId);
  return {organizationId,checked:[],ownerAccepted:false,livePilotAuthorized:false};
}
export function ql304MarkLocalReview(state:Ql304Acceptance,organizationId:OrganizationId,id:Ql304StepId):Ql304Acceptance{
  if(state.organizationId!==organizationId||!QL304_STEPS.some(step=>step.id===id)||state.checked.includes(id))return state;
  return {...state,checked:[...state.checked,id]};
}

export const QL304_RECONCILIATION=QL303_ROWS.map(row=>({
  id:row.id,label:row.label,kind:row.kind,proofHttp:row.observedHttp,
  observedAt:row.observedAt,passedGates:row.approvedGates,requiredGates:QL303_GATES.length,
  status:row.connection,ownerTestApproved:false,gatewayRequests:0
}));

export const QL304_NEXT_BATCH_PROPOSALS=[
  {id:'QL-305',title:'Operator acceptance feedback triage & accessible retest',gate:'Owner observations and cross-device evidence required'},
  {id:'QL-306',title:'Four-business handoff quality & synthetic regression expansion',gate:'No live notifications or staff changes'},
  {id:'QL-307',title:'Immutable proof recheck and independent reviewer evidence intake',gate:'Original Proof-B and verified custody required'},
  {id:'QL-308',title:'Nonproduction tenant scope and credential-free capability contract review',gate:'Owner TEST permission and scoped identities required'},
  {id:'QL-309',title:'Read-only pilot preflight decision packet',gate:'Separate explicit owner authorization; no gateway use by default'},
  {id:'QL-310',title:'Future batch reconciliation and management sign-off review',gate:'No fabricated owner approval or ACK release'}
] as const;
