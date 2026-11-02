import type {OrganizationId} from './ql191Organizations';
import {operatorOrganizations} from './ql191Organizations';
import {ql299Checks,ql299Devices,type Ql299CheckId,type Ql299Device} from './ql299AccessibilityReview';
import {QL304_STEPS,type Ql304StepId} from './ql304OperatorAcceptance';

export const QL305_FINDINGS=[
  {id:'FOCUS_ORDER',label:'Focus order or visibility',help:'Keyboard sequence and highlighted control do not match reading order.'},
  {id:'SCREEN_READER',label:'Accessible name or announcement',help:'A screen reader does not identify a control, update or heading clearly.'},
  {id:'REFLOW',label:'Zoom / narrow-screen reflow',help:'Content or operation may be lost at 200% text or 400% page zoom.'},
  {id:'CONTRAST',label:'Contrast / forced-colors status',help:'Text, states or focus are difficult to distinguish without relying on color.'},
  {id:'RECOVERY',label:'Saved view or keyboard recovery',help:'A shortcut or recovered layout does not preserve safe navigation.'}
] as const;
export type Ql305Finding=typeof QL305_FINDINGS[number]['id'];
export type Ql305Severity='blocker'|'major'|'minor';
export type Ql305Disposition='needs_retest'|'reproduced_locally'|'unable_to_reproduce'|'deferred';
export type Ql305Case={id:string;organizationId:OrganizationId;device:Ql299Device;check:Ql299CheckId;step:Ql304StepId;
  finding:Ql305Finding;severity:Ql305Severity;disposition:Ql305Disposition;reference:string;origin:'LOCAL_UNVERIFIED';ownerVerified:false;retestVerified:false};
export const QL305_MAX_CASES=24;

export function ql305ValidateReference(value:string):string|null{
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value))return 'Use a nonsecret reference of 5–32 letters, digits, underscores or hyphens.';
  if(/^(?:token|bearer|password|secret|api[-_]?key|sk[-_]|pk[-_])/i.test(value))return 'Do not enter credentials or private evidence.';
  return null;
}
export function ql305Append(cases:readonly Ql305Case[],draft:Omit<Ql305Case,'id'|'origin'|'ownerVerified'|'retestVerified'>){
  if(cases.length>=QL305_MAX_CASES)throw Error('LOCAL_CASE_LIMIT');
  if(!operatorOrganizations.some(company=>company.id===draft.organizationId)||!ql299Devices.includes(draft.device)||
    !ql299Checks.some(check=>check.id===draft.check)||!QL304_STEPS.some(step=>step.id===draft.step)||
    !QL305_FINDINGS.some(finding=>finding.id===draft.finding)||!(['blocker','major','minor'] as const).includes(draft.severity)||
    !(['needs_retest','reproduced_locally','unable_to_reproduce','deferred'] as const).includes(draft.disposition)||
    ql305ValidateReference(draft.reference))throw Error('INVALID_LOCAL_FEEDBACK');
  if(cases.some(item=>item.organizationId===draft.organizationId&&item.reference.toLowerCase()===draft.reference.toLowerCase()))throw Error('DUPLICATE_COMPANY_REFERENCE');
  const next:Ql305Case={...draft,id:`ql305-local-${cases.length+1}`,origin:'LOCAL_UNVERIFIED',ownerVerified:false,retestVerified:false};
  return [...cases,next];
}
export function ql305Retest(cases:readonly Ql305Case[],id:string,organizationId:OrganizationId,disposition:Ql305Disposition){
  if(!(['needs_retest','reproduced_locally','unable_to_reproduce','deferred'] as const).includes(disposition))return cases;
  return cases.map(item=>item.id===id&&item.organizationId===organizationId?{...item,disposition,ownerVerified:false as const,retestVerified:false as const}:item);
}
export function ql305Queue(cases:readonly Ql305Case[],organizationId:OrganizationId,device:'all'|Ql299Device='all'){
  const severityOrder={blocker:0,major:1,minor:2};
  return cases.filter(item=>item.organizationId===organizationId&&(device==='all'||item.device===device))
    .sort((a,b)=>severityOrder[a.severity]-severityOrder[b.severity]||a.id.localeCompare(b.id));
}
export function ql305Coverage(cases:readonly Ql305Case[],organizationId:OrganizationId){
  const scoped=cases.filter(item=>item.organizationId===organizationId);
  return {cases:scoped.length,needRetest:scoped.filter(item=>item.disposition==='needs_retest').length,
    locallyReproduced:scoped.filter(item=>item.disposition==='reproduced_locally').length,
    checklistTotal:ql299Checks.length*ql299Devices.length,ownerVerified:0,retestVerified:0,externalNotifications:0};
}
