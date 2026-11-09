import {MASTER_SHELL_REGISTRY} from './ql386MasterShellRegistry';

export type RoutingShape='one-to-one'|'one-to-many'|'many-to-one'|'many-to-many';
export type RouteDraft={sources:readonly string[];targets:readonly string[];shape:RoutingShape;
  purpose:'communications'|'monitoring';tenantScope:'shell'|'customer';sourceApproved:boolean;targetApproved:boolean};
export type RoutingReview={state:'DENIED'|'DESIGN_ONLY';reason:string;sourceCount:number;targetCount:number};

export const MASTER_ROUTING_PATTERNS=[
  {shape:'one-to-one',label:'One shell to one approved peer',example:'A business shell requests a Comms Hub notification'},
  {shape:'one-to-many',label:'One approved publisher to multiple peers',example:'A Comms Hub notice targets separately authorized shells'},
  {shape:'many-to-one',label:'Multiple sources to one receiver',example:'Six shell-level health reports feed the AI Data Platform broker'},
  {shape:'many-to-many',label:'Several publishers and receivers',example:'A coordinated cross-application workflow with scoped approvals on every edge'}
] as const;

/** Validation of a proposed routing topology only. Even a matching route is not
 * executable: original owner approvals, tenant-specific grants, payload scope,
 * receiver enrollment and source-signed evidence remain separate gates. */
export function reviewRoutingDraft(draft:RouteDraft):RoutingReview{
  const summary={sourceCount:draft.sources.length,targetCount:draft.targets.length};
  const known=new Set<string>(MASTER_SHELL_REGISTRY.map(item=>item.id));
  if(!draft.sources.length||!draft.targets.length)return {state:'DENIED',reason:'Both source and destination must be declared',...summary};
  if([...draft.sources,...draft.targets].some(id=>!known.has(id)))return {state:'DENIED',reason:'Unknown application or tenant is not an approved shell-level source',...summary};
  if(new Set(draft.sources).size!==draft.sources.length||new Set(draft.targets).size!==draft.targets.length)
    return {state:'DENIED',reason:'Duplicate routing identities must be reconciled',...summary};
  if(draft.sources.some(id=>draft.targets.includes(id)))return {state:'DENIED',reason:'Self-routing requires a separately reviewed contract',...summary};
  const shape:RoutingShape=draft.sources.length===1?(draft.targets.length===1?'one-to-one':'one-to-many'):
    (draft.targets.length===1?'many-to-one':'many-to-many');
  if(shape!==draft.shape)return {state:'DENIED',reason:'Declared routing cardinality does not match sources and targets',...summary};
  if(draft.tenantScope!=='shell')return {state:'DENIED',reason:'Customer/tenant routing requires an independent tenant-scoped contract',...summary};
  if(draft.purpose==='monitoring'&&!draft.targets.every(id=>id==='ai-data-platform'))
    return {state:'DENIED',reason:'Module monitoring and completion evidence belong to AI Data Platform',...summary};
  if(!draft.sourceApproved||!draft.targetApproved)return {state:'DENIED',reason:'Both source and receiver approvals are required for a real route',...summary};
  return {state:'DESIGN_ONLY',reason:'Topology matches; no transport, customer access or activation is authorized by this software review',...summary};
}
