import {QL327_SOURCE_MATRIX} from './ql327ContractCompatibility';

/** Canonical QL-329 shell/child control-plane mapping; NOT an identity provider or connector. */
export const QL329_SNAPSHOT_DATE='2026-11-03' as const;
export const QL329_MASTER={
  id:'rosevear-master',label:'Rosevear Master Control Plane',
  state:'ARCHITECTURE_DEFINED_NOT_DEPLOYED',provisioned:false,
  enforcement:'Future authenticated master control plane; no cross-application session exists'
} as const;
export const QL329_COMMS={
  id:'rosevear-comms-hub',label:'Rosevear Comms Hub',
  role:'communications-service',state:'DEPLOYED_DISABLED_PREVIEW',
  connection:'DISCONNECTED / HOLD'
} as const;

export const QL329_SHELLS=[
  {id:'yw',label:'Yard Workers',repository:'RosevearCreations/yw',
    shellState:'EXISTING_PLATFORM_SHELL',integrationIdentity:'yard-workers',
    ownerChild:'Rosevear Landscaping',childFixture:'rosevear-landscaping-demo',
    childPolicy:'MULTIPLE_COMPANIES_UNDER_SHELL',tenantScope:'SHELL_FIRST',
    integrationEndpoint:'GET /api/integration/v1/health',
    transport:'PUBLIC_DESCRIPTION_ONLY; PRIVATE TENANT ACCESS HELD'},
  {id:'icamp',label:'iCamp',repository:'RosevearCreations/iCamp',
    shellState:'EXISTING_MULTITENANT_SAAS',integrationIdentity:'icamp',
    ownerChild:'Camp Rosevear',childFixture:'camp-rosevear-demo',
    childPolicy:'MULTIPLE_CAMPGROUNDS_UNDER_SHELL',tenantScope:'SHELL_FIRST',
    integrationEndpoint:'GET /api/integration/v1/health',
    transport:'SIGNED NONPRODUCTION PER-TENANT READINESS ONLY; HELD'},
  {id:'rosiedazzlers',label:'Auto Detailing · Rosie Dazzlers',repository:'RosevearCreations/rosiedazzlers',
    shellState:'CURRENT_OWNED_BUSINESS_FUTURE_MULTITENANT_SHELL',integrationIdentity:'rosiedazzlers',
    ownerChild:'Rosie Dazzlers',childFixture:'rosie-owned-demo',
    childPolicy:'FUTURE_MULTIPLE_AUTO_DETAILERS',tenantScope:'SHELL_FIRST',
    integrationEndpoint:'GET /api/integration/v1/health',
    transport:'GUARDED GET HANDLER; CONNECTION HELD'},
  {id:'devilndove',label:'Maker Commerce · Devil n Dove',repository:'RosevearCreations/devilndove-site',
    shellState:'CURRENT_OWNED_BUSINESS_FUTURE_MULTITENANT_SHELL',integrationIdentity:'devilndove',
    ownerChild:'Devil n Dove',childFixture:'devil-owned-demo',
    childPolicy:'FUTURE_MULTIPLE_MAKER_SHOPS',tenantScope:'SHELL_FIRST',
    integrationEndpoint:'GET /api/integration/v1/health',
    transport:'GUARDED GET HANDLER; CONNECTION HELD'}
] as const;
export const QL329_SUPPORT=[
  {id:'ai-data-platform',label:'AI Data Platform',role:'INTEGRATION_BROKER',
    repository:'RosevearCreations/ai-data-platform',tenantKind:'NO_CUSTOMER_TENANT',
    transport:'SIGNED NONPRODUCTION BROKER; AUTHORIZATION NOT GRANTED'},
  {id:'rosevear-ai-hub',label:'Rosevear AI Hub',role:'LOCAL_SUPPORT_SERVICE',
    repository:'RosevearCreations/rosevear-ai-hub',tenantKind:'NO_CUSTOMER_TENANT',
    transport:'PRIVATE WINDOWS RELAY OFF; DEVICE STATUS UNVERIFIED'}
] as const;
export const QL329_LEGACY_FIXTURE_NOTE=
  'Previous Comms Hub four-business sample cards remain demonstration workspaces only. '+
  'They are NOT the external integration identities for the YW or iCamp SaaS shells. '+
  'Existing Integration v1 business_id / tenant_id payloads are not silently rewritten.';

export type Ql329SourceId=typeof QL329_SHELLS[number]['id']|typeof QL329_SUPPORT[number]['id'];
export type Ql329Layer='master'|'shell'|'child';
export type Ql329Scenario='shell_connection'|'child_as_connector'|'review_child_context'|
  'wrong_shell_child'|'support_as_child'|'unauthorized_master';
export type Ql329Decision='SHELL_SCOPE_DRAFT_ONLY'|'CHILD_CONTEXT_REQUIRES_EXPLICIT_GRANT'|
  'DENY_CHILD_AS_CONNECTOR'|'DENY_CROSS_SHELL_CHILD'|'DENY_SUPPORT_AS_CUSTOMER'|
  'DENY_UNKNOWN_SOURCE'|'DENY_MASTER_IDENTITY'|'DENY_SHELL_SCOPE';
export type Ql329Input={
  masterId:string;sourceId:string;layer:Ql329Layer;scenario:Ql329Scenario;
  childFixture?:string|null
};
export type Ql329Result={
  decision:Ql329Decision;detail:string;resolvedShell:string|null;
  childContext:string|null;boundary:'SHELL_NOT_CHILD'|'NO_CUSTOMER_TENANT';
  connected:false;authorized:false;credentialReads:0;privateGets:0;writes:0;
  provisionedTenants:0;ownerApprovals:0;ackSent:false;status:'DISCONNECTED / HOLD'
};

/** Pure hierarchy and scope check. Never accept a child as connector origin or grant access. */
export function ql329EvaluatePlan(input:Ql329Input):Ql329Result{
  const shell=QL329_SHELLS.find(item=>item.id===input.sourceId);
  const support=QL329_SUPPORT.find(item=>item.id===input.sourceId);
  const childOwner=QL329_SHELLS.find(item=>item.childFixture===input.childFixture);
  let decision:Ql329Decision='SHELL_SCOPE_DRAFT_ONLY';
  let detail='The proposed connector belongs to this application shell; no signed proof or master approval exists.';
  if(input.masterId!==QL329_MASTER.id){
    decision='DENY_MASTER_IDENTITY';detail='A recognized master scope is required even for a local draft.';
  }else if(!shell&&!support){
    decision='DENY_UNKNOWN_SOURCE';detail='An unknown or child-named application is never an integration source.';
  }else if(support){
    decision='DENY_SUPPORT_AS_CUSTOMER';detail='Supporting services cannot be selected as customer shells or child businesses.';
  }else if(input.scenario==='unauthorized_master'){
    decision='DENY_MASTER_IDENTITY';detail='An unprovisioned master cannot claim authenticated authority.';
  }else if(input.scenario==='support_as_child'){
    decision='DENY_SUPPORT_AS_CUSTOMER';detail='Support systems never become customer tenants.';
  }else if(input.scenario==='child_as_connector'||input.layer==='child'){
    decision='DENY_CHILD_AS_CONNECTOR';detail='Connect the shell, not an individual campground, detailer, shop or landscaper.';
  }else if(input.layer!=='master'&&input.layer!=='shell'){
    decision='DENY_SHELL_SCOPE';detail='The connection must originate at the master/shell boundary.';
  }else if(input.scenario==='wrong_shell_child'||(input.childFixture!==undefined&&
    input.childFixture!==null&&childOwner?.id!==shell!.id)){
    decision='DENY_CROSS_SHELL_CHILD';detail='A child from another shell (or an unknown child) cannot be routed across tenants.';
  }else if(input.scenario==='review_child_context'||input.childFixture!==undefined&&input.childFixture!==null){
    decision='CHILD_CONTEXT_REQUIRES_EXPLICIT_GRANT';
    detail='Child context is a later shell-owned permission, never a connector identity or automatic master grant.';
  }
  return {decision,detail,resolvedShell:shell?.id??null,
    childContext:shell&&input.childFixture===shell.childFixture?input.childFixture:null,
    boundary:support?'NO_CUSTOMER_TENANT':'SHELL_NOT_CHILD',
    connected:false,authorized:false,credentialReads:0,privateGets:0,writes:0,
    provisionedTenants:0,ownerApprovals:0,ackSent:false,status:'DISCONNECTED / HOLD'};
}
export const QL329_SCENARIOS=[
  {id:'shell_connection',label:'Master → selected shell · no child context'},
  {id:'child_as_connector',label:'Attempt direct child as connector · denied'},
  {id:'review_child_context',label:'Child context needs exact delegated permission'},
  {id:'wrong_shell_child',label:'Cross-shell child reference · denied'},
  {id:'support_as_child',label:'Supporting service as customer · denied'},
  {id:'unauthorized_master',label:'Claim master authority without login · denied'}
] as const;

export function ql329IntegrityReadback(){
  const sourceIds=[...QL329_SHELLS.map(x=>x.id),...QL329_SUPPORT.map(x=>x.id)];
  const previouslyRegistered=QL327_SOURCE_MATRIX.map(x=>x.id);
  const samples=QL329_SHELLS.flatMap(shell=>QL329_SCENARIOS.map(s=>ql329EvaluatePlan({
    masterId:QL329_MASTER.id,sourceId:shell.id,layer:s.id==='child_as_connector'?'child':'master',
    scenario:s.id as Ql329Scenario,
    childFixture:s.id==='wrong_shell_child'?
      QL329_SHELLS.find(other=>other.id!==shell.id)!.childFixture:
      s.id==='review_child_context'?shell.childFixture:undefined
  })));
  return {
    shells:QL329_SHELLS.length,supporting:QL329_SUPPORT.length,
    uniqueSources:new Set(sourceIds).size,
    reconciledLegacySources:sourceIds.length===previouslyRegistered.length&&
      sourceIds.every(id=>previouslyRegistered.includes(id)),
    uniqueDemoChildKeys:new Set(QL329_SHELLS.map(x=>x.childFixture)).size,
    cases:samples.length,allHeld:samples.every(x=>!x.authorized&&!x.connected&&
      !x.writes&&!x.privateGets&&!x.credentialReads),
    allNoGrant:samples.every(x=>x.decision!=='SHELL_SCOPE_DRAFT_ONLY'||
      x.status==='DISCONNECTED / HOLD'),liveConnections:0,
    masterProvisioned:false,masterSessions:0,crossTenantReads:0,physicalDeviceAcceptance:false
  };
}
export const QL329_BOUNDS={shells:4,support:2,connected:0,sourceWrites:0,
  privateGets:0,secretReads:0,masterSessions:0,childTenantGrants:0,
  ack:'UNDER_REVIEW / PARKED_FOR_LATER',windowsRelay:'OFF'} as const;
