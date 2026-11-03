import {QL324_CATALOGUE} from './ql324ConnectionCatalogue';
import {QL308_ENDPOINTS} from './ql308TenantContracts';

/** Naming and configuration guidance only. No environment variable is read or written here. */
export const QL326_ENVIRONMENTS=[
  {id:'local',label:'Local design',meaning:'Loopback example only · no private gateway connection'},
  {id:'preview',label:'Public disabled preview',meaning:'Documentation / synthetic review only'},
  {id:'test',label:'Future nonproduction TEST',meaning:'Requires independent authorization before any actual request'}
] as const;
export type Ql326Environment=typeof QL326_ENVIRONMENTS[number]['id'];

export const QL326_NAMES=[
  {name:'source_system',where:'Contract field · nonsecret',note:'Stable app ID from the QL-270 source registry'},
  {name:'business_id',where:'Contract field · nonsecret',note:'Source-owned business scope, never another company'},
  {name:'tenant_id',where:'Contract field · nonsecret',note:'Source-issued tenant ID or null; demo aliases are not grants'},
  {name:'environment',where:'Contract field · nonsecret',note:'Future authenticated contract uses nonproduction only'},
  {name:'schema_version',where:'Response field · nonsecret',note:'rosevear.integration.v1 is a proposed compatibility label'},
  {name:'ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64',where:'Future server/test-runner secret NAME ONLY',note:'Do not set, paste, reveal, or expose through VITE_ browser code'},
  {name:'VITE_ENABLE_SUPABASE_CLIENT',where:'Separate optional browser flag · keep false',note:'Not needed for six-source proof/configuration readback'},
  {name:'VITE_ENABLE_HOSTED_DATABASE',where:'Separate optional browser flag · keep false',note:'Not needed for this guide; no database mutation'}
] as const;

export const QL326_RESPONSE_FIELDS=[
  {path:'/api/integration/v1/health',fields:'schema_version · source_system · environment · business_id · tenant_id · connection_status=HOLD · signed envelope'},
  {path:'/api/integration/v1/capabilities',fields:'schema_version · source_system · scoped read-only capabilities[] · connection_status=HOLD · signed envelope'}
] as const;
export const QL326_FAILURE_FALLBACKS=[
  {case:'Missing proof, owner authorization or scoped identity',action:'NO-GO · keep DISCONNECTED / HOLD'},
  {case:'401 / 403 / tenant or signature mismatch',action:'DENY · no unauthenticated fallback'},
  {case:'404 / missing contract route',action:'NOT IMPLEMENTED · no substitute endpoint'},
  {case:'429 / 5xx / timeout / offline',action:'UNKNOWN · stop, no automatic retry or provider request'},
  {case:'Invalid / stale / over-privileged response',action:'REJECT · independent security and source-owner review'}
] as const;

export const QL326_ROWS=QL324_CATALOGUE.map(source=>({
  id:source.id,label:source.label,role:source.kind,category:source.category,
  scope:source.boundary,fixtureAlias:source.fixtureAlias,
  environments:QL326_ENVIRONMENTS.map(item=>item.id),
  allowedPaths:QL308_ENDPOINTS.map(item=>item.path),method:'GET' as const,
  expected:QL326_RESPONSE_FIELDS,responsibility:source.responsibility,
  fallback:'NO-GO · no private request or automatic retry',
  fields:['source_system','business_id','tenant_id','environment','schema_version'],
  connection:'DISCONNECTED / HOLD' as const,configured:false as const,authorized:false as const
}));

export type Ql326Draft={source:string;environment:string;tenantAlias:string;origin:string;reference:string};
export type Ql326Decision='DRAFT_ONLY_NOT_AUTHORIZED'|'DENY_UNKNOWN_SOURCE'|'DENY_PRODUCTION_ENVIRONMENT'|
  'DENY_CROSS_BUSINESS_TENANT'|'DENY_SUPPORT_AS_CUSTOMER'|'DENY_UNSAFE_METADATA'|
  'DENY_CREDENTIAL_OR_PERSONAL_DATA'|'DENY_UNVERIFIED_ORIGIN';
export function ql326ValidateDraft(draft:Ql326Draft):{
  decision:Ql326Decision;safeDraft:boolean;authorized:false;requests:0;credentialsRead:0;saved:false;
  connection:'DISCONNECTED / HOLD';detail:string
}{
  const row=QL326_ROWS.find(item=>item.id===draft.source);
  let decision:Ql326Decision='DRAFT_ONLY_NOT_AUTHORIZED';
  let detail='Nonsecret local shape only. All five independent gates remain unapproved.';
  const inputs=[draft.tenantAlias,draft.origin,draft.reference];
  const secretOrPersonal=/\b(?:bearer|secret|token|password|api[_-]?key|private[_-]?key|service[_-]?role|customer|email|address|phone|ssn)(?=[^a-z]|[0-9]|$)|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b\d{3}[- .]\d{3}[- .]\d{4}\b/i;
  if(!row){decision='DENY_UNKNOWN_SOURCE';detail='This source is not registered.';}
  else if(!QL326_ENVIRONMENTS.some(item=>item.id===draft.environment)){
    decision='DENY_PRODUCTION_ENVIRONMENT';detail='Only local, preview and future nonproduction TEST are descriptive options.';
  }else if(inputs.some(value=>secretOrPersonal.test(value))){
    decision='DENY_CREDENTIAL_OR_PERSONAL_DATA';detail='Do not enter secrets, credentials, customer information or identifying personal details.';
  }else if(!/^[a-z][a-z0-9-]{2,31}$/.test(draft.reference)){
    decision='DENY_UNSAFE_METADATA';detail='Use only a 3–32 character nonsecret reference of lowercase letters, digits and dashes.';
  }else if(row.category==='support'&&draft.tenantAlias.trim()){
    decision='DENY_SUPPORT_AS_CUSTOMER';detail='A support system can never take a customer tenant alias.';
  }else if(row.category==='business'&&draft.tenantAlias!==row.fixtureAlias){
    decision='DENY_CROSS_BUSINESS_TENANT';detail='Only the exact fictional alias for this business may be reviewed locally.';
  }else if(draft.origin.trim()){
    let allowed=false;
    try{
      const url=new URL(draft.origin.trim());
      const clean=!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/'&&
        !/%(?:40|3f|23|2f|5c)/i.test(draft.origin);
      if(draft.environment==='local')allowed=clean&&url.protocol==='http:'&&
        ['localhost','127.0.0.1'].includes(url.hostname);
      else allowed=clean&&url.protocol==='https:'&&
        /^(?:(?:demo|sample|preview|test)\.)?example\.test$/.test(url.hostname)&&!url.port;
    }catch{allowed=false;}
    if(!allowed){decision='DENY_UNVERIFIED_ORIGIN';detail='Only loopback HTTP for local or example.test HTTPS for preview/TEST are accepted; no real hosts, paths, query, fragments or userinfo.';}
  }
  return {decision,safeDraft:decision==='DRAFT_ONLY_NOT_AUTHORIZED',authorized:false,
    requests:0,credentialsRead:0,saved:false,connection:'DISCONNECTED / HOLD',detail};
}

export const QL326_BOUNDARY={sources:6,businesses:4,support:2,approved:0,connected:0,
  gatewayRequests:0,sourceWrites:0,savedDrafts:0,credentialsRead:0,privateRelay:'OFF',
  ack:'UNDER_REVIEW / PARKED_FOR_LATER'} as const;
