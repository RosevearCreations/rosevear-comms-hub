import {QL326_ROWS} from './ql326ConnectionConfiguration';
import {QL308_ENDPOINTS} from './ql308TenantContracts';

/** All contracts are deliberately synthetic: no proof, secrets, provider data or requests. */
export const QL327_BASELINE_VERSION='rosevear.integration.v1';
export const QL327_ADDITIVE_VERSION='rosevear.integration.v1.1';
export const QL327_BREAKING_VERSION='rosevear.integration.v2';
export const QL327_REQUIRED_FIELDS=[
  'schema_version','source_system','environment','method','endpoint','role',
  'business_id','tenant_id','consent_marker','capabilities','connection_status'
] as const;
export const QL327_VERSION_MATRIX=[
  {id:QL327_BASELINE_VERSION,label:'v1 · pinned local fixture',shape:'BASELINE',
    optionalFields:[] as string[],outcome:'SHAPE_ONLY · NOT AUTHORIZED',rollback:'Keep the reviewed v1 synthetic fixture; no deployed rollback.'},
  {id:QL327_ADDITIVE_VERSION,label:'v1.1 · optional trace label',shape:'ADDITIVE_CANDIDATE',
    optionalFields:['trace_label'],outcome:'COMPATIBLE DRAFT · NOT AUTHORIZED',rollback:'Drop the optional local field and recheck v1; no remote change.'},
  {id:QL327_BREAKING_VERSION,label:'v2 · breaking proposal',shape:'UNSUPPORTED',
    optionalFields:[] as string[],outcome:'NO-GO · VERSION MISMATCH',rollback:'Hold v1 fixture and request independent schema review; no automatic upgrade.'}
] as const;
export type Ql327Role='business'|'support';
export type Ql327Response={
  schema_version:string;source_system:string;environment:string;method:string;endpoint:string;
  role:Ql327Role;business_id:string|null;tenant_id:string|null;consent_marker:string;
  capabilities:string[];connection_status:string;trace_label?:string
};
const syntheticCapability:Record<string,string>={
  rosiedazzlers:'preview_detailing_quote_status',
  devilndove:'preview_maker_enquiry_status',
  icamp:'preview_campground_request_status',
  yw:'preview_contractor_quote_status',
  'ai-data-platform':'preview_aggregate_health_only',
  'rosevear-ai-hub':'preview_local_relay_off_health'
};
export const QL327_SOURCE_MATRIX=QL326_ROWS.map(row=>({
  id:row.id,label:row.label,role:row.category as Ql327Role,owner:row.responsibility,
  fixtureAlias:row.fixtureAlias,businessId:row.category==='business'?`np-${row.id}-business`:null,
  allowedCapability:syntheticCapability[row.id],method:'GET' as const,
  endpoints:QL308_ENDPOINTS.map(endpoint=>endpoint.path),
  baselineVersion:QL327_BASELINE_VERSION,candidateVersion:QL327_ADDITIVE_VERSION,
  connected:false as const,authenticated:false as const,approved:false as const,
  consentGranted:false as const,status:'DISCONNECTED / HOLD' as const
}));

export function ql327SyntheticFixture(source:string,version:string=QL327_BASELINE_VERSION):Ql327Response{
  const row=QL327_SOURCE_MATRIX.find(item=>item.id===source);
  if(!row)throw Error('UNKNOWN_SYNTHETIC_SOURCE');
  return {schema_version:version,source_system:row.id,environment:'test',method:'GET',
    endpoint:'/api/integration/v1/capabilities',role:row.role,
    business_id:row.businessId,tenant_id:row.fixtureAlias,
    consent_marker:row.role==='business'?'SYNTHETIC_PREVIEW_ONLY':'NO_CUSTOMER_CONSENT_APPLICABLE',
    capabilities:[row.allowedCapability],connection_status:'HOLD',
    ...(version===QL327_ADDITIVE_VERSION?{trace_label:'synthetic-trace'}:{})};
}

export type Ql327Decision='BASELINE_SHAPE_ONLY_NOT_AUTHORIZED'|'ADDITIVE_DRAFT_NOT_AUTHORIZED'|
  'DENY_UNKNOWN_SOURCE'|'DENY_NOT_OBJECT'|'DENY_MISSING_CONSENT'|'DENY_REMOVED_FIELD'|
  'DENY_VERSION_MISMATCH'|'DENY_UNEXPECTED_FIELD'|'DENY_METHOD_OR_ENDPOINT'|
  'DENY_SOURCE_IDENTITY'|'DENY_ROLE_BOUNDARY'|'DENY_TENANT_BOUNDARY'|
  'DENY_CONSENT_MARKER'|'DENY_UNEXPECTED_PRIVILEGE'|'DENY_ELEVATED_CONNECTION'|'DENY_UNSAFE_TRACE';
export type Ql327Gate='registry'|'schema'|'route'|'source'|'scope'|'consent'|'capabilities'|'hold'|'complete';
export type Ql327Validation={decision:Ql327Decision;stage:Ql327Gate;detail:string;rollback:string;
  shapeCompatible:boolean;authorized:false;authenticated:false;requests:0;writes:0;
  customerRecords:0;secretReads:0;consentGranted:false;connection:'DISCONNECTED / HOLD'};
const lastKnown='Keep the pinned v1 local fixture, quarantine this candidate, and request a source-owner and independent reviewer decision. No remote rollback or retry.';

/** Strict, pure compatibility check. No GET is performed, including for valid fixtures. */
export function ql327ValidateResponse(source:string,input:unknown):Ql327Validation{
  const row=QL327_SOURCE_MATRIX.find(item=>item.id===source);
  let decision:Ql327Decision='BASELINE_SHAPE_ONLY_NOT_AUTHORIZED';
  let stage:Ql327Gate='complete';
  let detail='Synthetic v1 shape matched. No signature, consent grant, source handshake or owner TEST approval exists.';
  const reject=(code:Ql327Decision,at:Ql327Gate,why:string)=>{decision=code;stage=at;detail=why;};
  if(!row)reject('DENY_UNKNOWN_SOURCE','registry','The source is not registered among the six independent roles.');
  else if(!input||typeof input!=='object'||Array.isArray(input))
    reject('DENY_NOT_OBJECT','schema','A response must be a non-null object of documented synthetic fields.');
  else{
    const item=input as Record<string,unknown>;
    const missing=QL327_REQUIRED_FIELDS.filter(key=>!Object.hasOwn(item,key));
    if(!Object.hasOwn(item,'consent_marker'))
      reject('DENY_MISSING_CONSENT','consent','Missing fixture consent marker; never infer actual user consent.');
    else if(missing.length)
      reject('DENY_REMOVED_FIELD','schema',`Required field missing: ${missing.join(', ')}. A removed field is breaking.`);
    else if(![QL327_BASELINE_VERSION,QL327_ADDITIVE_VERSION].includes(String(item.schema_version)))
      reject('DENY_VERSION_MISMATCH','schema','Unknown or breaking schema version; keep the pinned v1 fixture.');
    else{
      const allowed=[...QL327_REQUIRED_FIELDS,...(item.schema_version===QL327_ADDITIVE_VERSION?['trace_label']:[])];
      const extras=Object.keys(item).filter(key=>!allowed.includes(key as typeof QL327_REQUIRED_FIELDS[number]));
      if(extras.length)reject('DENY_UNEXPECTED_FIELD','schema','Unexpected response fields are not accepted, including customer records and credentials.');
      else if(item.method!=='GET'||!row.endpoints.includes(item.endpoint as typeof row.endpoints[number])||item.environment!=='test')
        reject('DENY_METHOD_OR_ENDPOINT','route','Only documented mock TEST GET paths are allowed; no writes or live environment.');
      else if(item.source_system!==row.id)
        reject('DENY_SOURCE_IDENTITY','source','The declared source does not match the independently selected registry row.');
      else if(item.role!==row.role)
        reject('DENY_ROLE_BOUNDARY','scope','Business and supporting-system roles are never interchangeable.');
      else if(item.business_id!==row.businessId||item.tenant_id!==row.fixtureAlias)
        reject('DENY_TENANT_BOUNDARY','scope','The business/tenant pair differs from the exact fictional source fixture.');
      else if(item.consent_marker!==(row.role==='business'?'SYNTHETIC_PREVIEW_ONLY':'NO_CUSTOMER_CONSENT_APPLICABLE'))
        reject('DENY_CONSENT_MARKER','consent','Only explicit fictional markers are accepted; no real consent is granted.');
      else if(!Array.isArray(item.capabilities)||item.capabilities.length!==1||item.capabilities[0]!==row.allowedCapability)
        reject('DENY_UNEXPECTED_PRIVILEGE','capabilities','Only this source’s single non-operational preview capability is allowed.');
      else if(item.connection_status!=='HOLD')
        reject('DENY_ELEVATED_CONNECTION','hold','A fixture cannot assert CONNECTED, READY or permission to perform a request.');
      else if(item.trace_label!==undefined&&
        (item.schema_version!==QL327_ADDITIVE_VERSION||typeof item.trace_label!=='string'||
          !/^[a-z][a-z0-9-]{2,31}$/.test(item.trace_label)))
        reject('DENY_UNSAFE_TRACE','schema','An optional v1.1 trace label must be a small nonsecret slug.');
      else if(item.schema_version===QL327_ADDITIVE_VERSION){
        decision='ADDITIVE_DRAFT_NOT_AUTHORIZED';
        detail='Optional v1.1 trace label is locally compatible. Upgrade and real handshake remain unauthorized.';
      }
    }
  }
  return {decision,stage,detail,rollback:lastKnown,
    shapeCompatible:decision==='BASELINE_SHAPE_ONLY_NOT_AUTHORIZED'||decision==='ADDITIVE_DRAFT_NOT_AUTHORIZED',
    authorized:false,authenticated:false,requests:0,writes:0,customerRecords:0,secretReads:0,
    consentGranted:false,connection:'DISCONNECTED / HOLD'};
}

export const QL327_SCENARIOS=[
  {id:'baseline',label:'Valid local v1 shape',expect:'BASELINE_SHAPE_ONLY_NOT_AUTHORIZED'},
  {id:'removed_field',label:'Required field removed',expect:'DENY_REMOVED_FIELD'},
  {id:'schema_mismatch',label:'Breaking schema version',expect:'DENY_VERSION_MISMATCH'},
  {id:'wrong_tenant',label:'Other business tenant',expect:'DENY_TENANT_BOUNDARY'},
  {id:'absent_consent',label:'Missing consent marker',expect:'DENY_MISSING_CONSENT'},
  {id:'unexpected_privilege',label:'Unexpected write privilege',expect:'DENY_UNEXPECTED_PRIVILEGE'},
  {id:'support_as_business',label:'Support role as a business',expect:'DENY_ROLE_BOUNDARY'},
  {id:'wrong_source',label:'Other source identity',expect:'DENY_SOURCE_IDENTITY'},
  {id:'write_method',label:'POST instead of GET',expect:'DENY_METHOD_OR_ENDPOINT'},
  {id:'unknown_field',label:'Unexpected customer field',expect:'DENY_UNEXPECTED_FIELD'},
  {id:'assert_connected',label:'Fixture claims connected',expect:'DENY_ELEVATED_CONNECTION'}
] as const;
export type Ql327Scenario=typeof QL327_SCENARIOS[number]['id'];

/** Mutates a newly created mock object, never a response from a source or network. */
export function ql327RunScenario(source:string,scenario:Ql327Scenario='baseline',version:string=QL327_BASELINE_VERSION){
  const fixture=ql327SyntheticFixture(source,version);
  const simulated:Record<string,unknown>={...fixture,capabilities:[...fixture.capabilities]};
  if(scenario==='removed_field')delete simulated.capabilities;
  if(scenario==='schema_mismatch')simulated.schema_version=QL327_BREAKING_VERSION;
  if(scenario==='wrong_tenant')simulated.tenant_id='np-other-company-demo';
  if(scenario==='absent_consent')delete simulated.consent_marker;
  if(scenario==='unexpected_privilege')simulated.capabilities=[...fixture.capabilities,'write_customer_records'];
  if(scenario==='support_as_business')simulated.role=fixture.role==='support'?'business':'support';
  if(scenario==='wrong_source')simulated.source_system=source==='rosiedazzlers'?'devilndove':'rosiedazzlers';
  if(scenario==='write_method')simulated.method='POST';
  if(scenario==='unknown_field')simulated.customer_email='REDACTED_SYNTHETIC_ONLY';
  if(scenario==='assert_connected')simulated.connection_status='CONNECTED';
  const result=ql327ValidateResponse(source,simulated);
  return {scenario,source,version,fixture:simulated,result,
    requestedRealHandshake:false,networkRequests:0,providerWrites:0,rollbackApplied:false};
}

export function ql327RegressionMatrix(){
  const samples=QL327_SOURCE_MATRIX.flatMap(row=>QL327_SCENARIOS.map(scenario=>ql327RunScenario(row.id,scenario.id)));
  return {cases:samples.length,rejected:samples.filter(sample=>!sample.result.shapeCompatible).length,
    matchesDeclaredDecisions:samples.every(sample=>sample.result.decision===QL327_SCENARIOS.find(s=>s.id===sample.scenario)?.expect),
    businessCount:QL327_SOURCE_MATRIX.filter(row=>row.role==='business').length,
    supportCount:QL327_SOURCE_MATRIX.filter(row=>row.role==='support').length,
    allHeld:samples.every(sample=>!sample.result.authorized&&sample.result.requests===0&&sample.result.writes===0&&
      sample.result.connection==='DISCONNECTED / HOLD'),
    authenticatedHandshakes:0,sourceRequests:0,sourceWrites:0};
}

export const QL327_BOUNDARY={sources:6,businesses:4,support:2,versions:3,
  productionConnections:0,authenticatedHandshakes:0,gatewayRequests:0,sourceWrites:0,
  customerRecords:0,secretReads:0,ownerApprovals:0,privateRelay:'OFF',
  ack:'UNDER_REVIEW / PARKED_FOR_LATER'} as const;
