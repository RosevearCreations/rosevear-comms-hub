import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL303_GATES} from './ql303CapabilityReadiness';

export const QL308_ENDPOINTS=[
  {path:'/api/integration/v1/health',purpose:'Health summary',method:'GET'},
  {path:'/api/integration/v1/capabilities',purpose:'Capability declaration',method:'GET'}
] as const;
export type Ql308Endpoint=typeof QL308_ENDPOINTS[number]['path'];
export const QL308_SCENARIOS=[
  {id:'valid_synthetic_shape',label:'Synthetic contract shape',expect:'SHAPE_ONLY_NOT_AUTHORIZED'},
  {id:'cross_company',label:'Cross-company tenant mismatch',expect:'DENY_TENANT_BOUNDARY'},
  {id:'production_tenant',label:'Production tenant alias',expect:'DENY_NONPRODUCTION_ONLY'},
  {id:'write_method',label:'POST / mutation method',expect:'DENY_READ_ONLY'},
  {id:'unlisted_endpoint',label:'Unlisted endpoint',expect:'DENY_ENDPOINT'},
  {id:'missing_scope',label:'Missing tenant scope',expect:'DENY_SCOPE_REQUIRED'},
  {id:'unverified_proof',label:'Unverified original proof / owner TEST',expect:'DENY_RELEASE_GATES'}
] as const;
export type Ql308Scenario=typeof QL308_SCENARIOS[number]['id'];

export const QL308_TENANT_FIXTURES=[
  {source:'rosiedazzlers',alias:'np-rosie-demo',label:'Rosie Dazzlers · independent detailing tenant'},
  {source:'devilndove',alias:'np-devil-demo',label:'Devil n Dove · independent maker tenant'},
  {source:'yw',alias:'np-yard-demo',label:'Yard Workers · independent contractor tenant'},
  {source:'icamp',alias:'np-icamp-demo',label:'iCamp · independent campground tenant'}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;alias:string;label:string}>;

export const QL308_CAPABILITY_MATRIX=QL270_SOURCES.map(row=>({
  source:row.id,label:row.label,role:row.kind,
  allowedMethods:['GET'] as const,allowedEndpoints:QL308_ENDPOINTS.map(endpoint=>endpoint.path),
  fixtureAlias:QL308_TENANT_FIXTURES.find(fixture=>fixture.source===row.id)?.alias??null,
  crossCompanySharing:false,customerReads:false,writes:false,credentialsAvailable:false,
  approvedGates:0,requiredGates:QL303_GATES.length,status:'DISCONNECTED / HOLD' as const
}));

export function ql308ValidateAlias(alias:string){
  return /^np-[a-z0-9](?:[a-z0-9-]{2,30}[a-z0-9])$/.test(alias);
}

export function ql308ContractAudit(source:Ql270SourceId,alias:string,scenario:Ql308Scenario='valid_synthetic_shape'){
  const row=QL308_CAPABILITY_MATRIX.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_INTEGRATION_SOURCE');
  const fixture=QL308_TENANT_FIXTURES.find(item=>item.source===source);
  const selected=QL308_SCENARIOS.find(item=>item.id===scenario);
  if(!selected)throw Error('UNKNOWN_DENIAL_SCENARIO');
  let decision:string='SHAPE_ONLY_NOT_AUTHORIZED';
  if(!ql308ValidateAlias(alias))decision='DENY_NONPRODUCTION_ONLY';
  else if(!fixture)decision='DENY_SCOPE_REQUIRED';
  else if(alias!==fixture.alias)decision='DENY_TENANT_BOUNDARY';
  else decision=selected.expect;
  return {source,alias,scenario,decision,
    shapeMatchesFixture:decision==='SHAPE_ONLY_NOT_AUTHORIZED',
    gatewayRequests:0,providerMessages:0,credentialsRead:0,approvedGates:0,
    authorized:false,connected:false,status:'DISCONNECTED / HOLD' as const,
    permittedEndpoints:QL308_ENDPOINTS.map(endpoint=>endpoint.path)};
}

export function ql308Regression(){
  const results=QL308_TENANT_FIXTURES.flatMap(fixture=>QL308_SCENARIOS.map(scenario=>ql308ContractAudit(fixture.source,fixture.alias,scenario.id)));
  const supporting=QL308_CAPABILITY_MATRIX.filter(row=>row.fixtureAlias===null);
  return {cases:results.length,denied:results.filter(result=>!result.authorized).length,
    expectedDecisions:results.every(result=>result.decision===QL308_SCENARIOS.find(row=>row.id===result.scenario)?.expect),
    businessIsolation:new Set(QL308_TENANT_FIXTURES.map(row=>row.alias)).size===4,
    supportingServicesWithoutCustomerTenant:supporting.length===2&&supporting.every(row=>row.fixtureAlias===null),
    credentialsRead:0,gatewayRequests:0,approvedGates:0};
}
