import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL303_GATES,QL303_ROWS} from './ql303CapabilityReadiness';
import {QL308_ENDPOINTS,QL308_TENANT_FIXTURES} from './ql308TenantContracts';

export type Ql324Category='all'|'business'|'support';
export type Ql324ScopeDecision='MATCHED_SYNTHETIC_SCOPE_NOT_AUTHORIZED'|'DENY_CROSS_BUSINESS'|'DENY_SUPPORT_IS_NOT_TENANT'|'DENY_UNKNOWN_SOURCE'|'DENY_INVALID_ALIAS';

const roles:Record<Ql270SourceId,{direction:string;boundary:string;responsibility:string}>={
  rosiedazzlers:{direction:'Future scoped GET: detailing intake / quote status → operator preview',boundary:'Only a separately approved Rosie Dazzlers nonproduction tenant; never another company’s customer records.',responsibility:'Business source owner + independent proof reviewer'},
  devilndove:{direction:'Future scoped GET: maker enquiries / draft handoff → operator preview',boundary:'Only a separately approved Devil n Dove nonproduction tenant; no Etsy orders, product photos or shop secrets.',responsibility:'Maker business source owner + independent proof reviewer'},
  icamp:{direction:'Future scoped GET: campground enquiries / service handoff → operator preview',boundary:'Every campground is a separate tenant; Camp Rosevear production data is never a TEST fixture.',responsibility:'Campground source owner + independent proof reviewer'},
  yw:{direction:'Future scoped GET: contractor quote / appointment handoff → operator preview',boundary:'Each contractor is isolated; Rosevear Landscaping production records are not TEST fixtures.',responsibility:'Contractor source owner + independent proof reviewer'},
  'ai-data-platform':{direction:'Optional future scoped reporting feed ⇄ approved aggregate contracts only',boundary:'Shared reporting layer; no customer tenant assignment and no unrestricted cross-business joins.',responsibility:'Reporting platform custodian + independent reviewer'},
  'rosevear-ai-hub':{direction:'Optional future local relay ↔ separately approved internal automation only',boundary:'Private Windows edge service; relay OFF, no cameras, device feeds, passwords or local vault.',responsibility:'Windows relay owner + independent reviewer'}
};

export const QL324_CATALOGUE=QL270_SOURCES.map(source=>{
  const proof=QL303_ROWS.find(item=>item.id===source.id);
  if(!proof)throw Error('MISSING_SOURCE_PROOF_REGISTRY');
  const fixture=QL308_TENANT_FIXTURES.find(item=>item.source===source.id);
  return {
    ...source,...roles[source.id],repo:proof.repo,pinnedCommit:proof.sha,
    publicRepository:`https://github.com/RosevearCreations/${proof.repo}`,
    deployment:'NOT VERIFIED · no public deployment mapping asserted',
    category:source.kind==='Business app'?'business' as const:'support' as const,
    fixtureAlias:fixture?.alias??null,
    allowedReadPaths:QL308_ENDPOINTS.map(endpoint=>endpoint.path),
    method:'GET only · proposed; no request issued',
    capability:'REGISTRY ONLY · NOT VERIFIED',
    permission:'DENIED · 0/5 independent gates',
    proof:`Historical HTTP ${proof.observedHttp} at ${proof.observedAt}`,
    blockers:QL303_GATES.map(gate=>`${gate.label}: ${gate.state}`),
    connection:'DISCONNECTED / HOLD' as const,customerRecordsExposed:0,
    isCustomerTenant:source.kind==='Business app'
  };
});

export type Ql324Entry=typeof QL324_CATALOGUE[number];

/** Catalogue, diagram and table must use precisely the same filtered model. */
export function ql324FilteredCatalogue(category:Ql324Category='all',search=''){
  const needle=search.trim().toLocaleLowerCase('en-CA');
  return QL324_CATALOGUE.filter(row=>(category==='all'||row.category===category)&&
    (!needle||[row.label,row.kind,row.repo,row.benefit,row.boundary].some(text=>text.toLocaleLowerCase('en-CA').includes(needle))));
}

/** This is an entirely local scope preview, NEVER an authorization grant. */
export function ql324CheckSyntheticScope(source:string,alias:string):{decision:Ql324ScopeDecision;authorized:false;customerRecords:0;gatewayRequests:0;connection:'DISCONNECTED / HOLD'}{
  const entry=QL324_CATALOGUE.find(row=>row.id===source);
  let decision:Ql324ScopeDecision;
  if(!entry)decision='DENY_UNKNOWN_SOURCE';
  else if(entry.category==='support')decision='DENY_SUPPORT_IS_NOT_TENANT';
  else if(!/^np-[a-z0-9-]{4,32}$/.test(alias))decision='DENY_INVALID_ALIAS';
  else if(alias!==entry.fixtureAlias)decision='DENY_CROSS_BUSINESS';
  else decision='MATCHED_SYNTHETIC_SCOPE_NOT_AUTHORIZED';
  return {decision,authorized:false,customerRecords:0,gatewayRequests:0,connection:'DISCONNECTED / HOLD'};
}

export const QL324_BOUNDARY={
  businesses:QL324_CATALOGUE.filter(row=>row.isCustomerTenant).length,
  supporting:QL324_CATALOGUE.filter(row=>!row.isCustomerTenant).length,
  connected:0,requests:0,customerRecords:0,approvedGates:0,
  direction:'PROPOSED READ-ONLY / NO NETWORK'
} as const;
