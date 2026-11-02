import {operatorOrganizations,type OrganizationId,type OperatorWorkspace} from './ql191Organizations';
import {dashboardQueues,type QueueCategory} from './ql191DashboardData';
import {ql296Fixtures,ql296Handoff} from './ql296GuidedIntake';
import {ql297ForOrganization,emptyQl297Session,ql297Apply,ql297Timeline} from './ql297Omnichannel';
import {seedQueueForOrganization,taskVersion} from './ql194WorkQueue';
import {ql301Incidents} from './ql301ManagementDashboard';

export const QL306_LANES=[
  {id:'intake',label:'Intake to quote review',workspace:'guided_intake',category:'intake',requirement:'Validate all four example fields; prepare an UNSENT internal estimator handoff.'},
  {id:'missed_call',label:'Missed event to triage',workspace:'event_timeline',category:'call',requirement:'Keep provider-neutral source proof, error state and callback plan in mock-only review.'},
  {id:'reply',label:'Inbox to draft and assignment',workspace:'inbox',category:'reply',requirement:'Respect consent and preserve a redacted UNSENT draft before fictional task review.'},
  {id:'task',label:'Task to management readback',workspace:'queue',category:'task',requirement:'Retain fictional owner, blocked status, task version and no external staff change.'}
] as const satisfies readonly {id:string;label:string;workspace:OperatorWorkspace;category:QueueCategory;requirement:string}[];
export type Ql306LaneId=typeof QL306_LANES[number]['id'];
export type Ql306LocalOutcome='not_reviewed'|'needs_retest'|'locally_consistent'|'exception_noted';
export type Ql306ReviewState=Partial<Record<OrganizationId,Partial<Record<Ql306LaneId,Ql306LocalOutcome>>>>;

export function ql306Audit(organizationId:OrganizationId){
  const company=operatorOrganizations.find(item=>item.id===organizationId);
  const intake=ql296Fixtures.find(item=>item.organizationId===organizationId);
  if(!company||!intake)throw Error('UNKNOWN_COMPANY');
  const queue=dashboardQueues[organizationId];
  const events=ql297ForOrganization(organizationId);
  const tasks=seedQueueForOrganization(organizationId).tasks;
  const incidents=ql301Incidents(organizationId);
  if(queue.length!==4||events.length!==6||tasks.length!==4||incidents.length!==4||
     queue.some(item=>!item.id||!item.channel)||events.some(item=>item.organizationId!==organizationId)||
     tasks.some(item=>item.organizationId!==organizationId))throw Error('INCOMPLETE_SCOPED_FIXTURES');
  const handoff=ql296Handoff(organizationId,Object.fromEntries(intake.fields.map(field=>[field.id,field.choices[0]])));
  if(!handoff||handoff.lines.length!==4)throw Error('INTAKE_HANDOFF_INCOMPLETE');
  const replay=ql297Apply(emptyQl297Session(organizationId),organizationId,events[0].id,'replay');
  const replayAgain=ql297Apply(replay,organizationId,events[0].id,'replay');
  if(replayAgain.receipts.length!==1||ql297Timeline(replay,organizationId).length!==1)throw Error('EVENT_REPLAY_NOT_IDEMPOTENT');
  const rows=QL306_LANES.map(lane=>{
    const sample=queue.find(item=>item.category===lane.category);
    const incident=incidents.find(item=>item.category===lane.category);
    if(!sample||!incident)throw Error('MISSING_QUALITY_LANE');
    const task=tasks.find(item=>item.status==='open'&&item.priority==='high')??tasks[0];
    return {...lane,sourceReference:lane.id==='intake'?handoff.reference:lane.id==='missed_call'?events[0].source:sample.id,
      sampleTitle:sample.title,incidentStatus:incident.status,taskReference:task.id,taskSnapshot:taskVersion(task),
      simulatedOnly:true,externalSends:0,ownerVerified:false};
  });
  return {organizationId,company,rows,summary:{lanes:4,fixtureQueue:queue.length,mockEvents:events.length,mockTasks:tasks.length,
    validIntakeFields:handoff.lines.length,idempotentReplay:true,externalSends:0,ownerAccepted:false}};
}

export function ql306Review(state:Ql306ReviewState,organizationId:OrganizationId,lane:Ql306LaneId,outcome:Ql306LocalOutcome):Ql306ReviewState{
  if(!operatorOrganizations.some(company=>company.id===organizationId)||!QL306_LANES.some(item=>item.id===lane)||
     !(['not_reviewed','needs_retest','locally_consistent','exception_noted'] as const).includes(outcome))throw Error('INVALID_LOCAL_QUALITY_REVIEW');
  const next={...(state[organizationId]??{})};
  if(outcome==='not_reviewed')delete next[lane];else next[lane]=outcome;
  return {...state,[organizationId]:next};
}

export function ql306LocalSummary(state:Ql306ReviewState,organizationId:OrganizationId){
  ql306Audit(organizationId);
  const outcomes=QL306_LANES.map(row=>state[organizationId]?.[row.id]??'not_reviewed');
  return {total:4,pending:outcomes.filter(item=>item==='not_reviewed').length,
    consistent:outcomes.filter(item=>item==='locally_consistent').length,
    exceptions:outcomes.filter(item=>item==='exception_noted'||item==='needs_retest').length,
    ownerVerified:0,externalHandoffs:0};
}
