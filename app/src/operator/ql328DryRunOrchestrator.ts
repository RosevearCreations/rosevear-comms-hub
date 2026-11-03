import {QL327_BASELINE_VERSION,QL327_BREAKING_VERSION,QL327_SOURCE_MATRIX,
  ql327SyntheticFixture,ql327ValidateResponse} from './ql327ContractCompatibility';

/** QL-328 is a pure, in-memory rehearsal: no transport, credentials, persistence or external authority. */
export const QL328_PHASES=[
  {id:'proof',label:'Original proof',condition:'Source-signed original Proof-B and independent custody evidence'},
  {id:'authority',label:'Independent authority',condition:'Signer identity, independent reviewer and exact owner TEST decision'},
  {id:'scope',label:'Tenant isolation',condition:'Exact business tenant or tenantless support role with consent'},
  {id:'contract',label:'Versioned GET contract',condition:'Source-authenticated, least-privilege schema validation'},
  {id:'plan',label:'Private GET plan',condition:'Separately authorized nonproduction GET only; never executed here'},
  {id:'fallback',label:'Stop / reversible packet',condition:'Record UNSENT NO-GO; preserve last known local fixture'}
] as const;
export type Ql328Phase=typeof QL328_PHASES[number]['id'];

export const QL328_SCENARIOS=[
  {id:'baseline',label:'Valid fixture shape, still no authority',signal:'SHAPE_ONLY',phase:'proof',reason:'MISSING_ORIGINAL_PROOF'},
  {id:'http_401',label:'Mock 401 · unauthenticated',signal:'MOCK_HTTP_401',phase:'authority',reason:'AUTHENTICATION_UNPROVEN'},
  {id:'http_403',label:'Mock 403 · access denied',signal:'MOCK_HTTP_403',phase:'authority',reason:'PERMISSION_DENIED'},
  {id:'http_404',label:'Mock 404 · route not found',signal:'MOCK_HTTP_404',phase:'contract',reason:'CONTRACT_ROUTE_MISSING'},
  {id:'http_409',label:'Mock 409 · conflicting state',signal:'MOCK_HTTP_409',phase:'scope',reason:'TENANT_OR_VERSION_CONFLICT'},
  {id:'http_429',label:'Mock 429 · rate limited',signal:'MOCK_HTTP_429',phase:'plan',reason:'RATE_LIMIT_HOLD'},
  {id:'http_500',label:'Mock 500 · source error',signal:'MOCK_HTTP_500',phase:'plan',reason:'SOURCE_UNAVAILABLE'},
  {id:'http_503',label:'Mock 503 · service unavailable',signal:'MOCK_HTTP_503',phase:'plan',reason:'SOURCE_UNAVAILABLE'},
  {id:'timeout',label:'Mock timeout · no response',signal:'MOCK_TIMEOUT',phase:'plan',reason:'TIMEOUT_UNKNOWN'},
  {id:'offline',label:'Mock offline · no network',signal:'MOCK_OFFLINE',phase:'plan',reason:'OFFLINE_UNKNOWN'},
  {id:'replay',label:'Mock replay / duplicate receipt',signal:'MOCK_REPLAY',phase:'fallback',reason:'REPLAY_REJECTED'},
  {id:'cancel',label:'Local cancellation before any request',signal:'LOCAL_CANCEL',phase:'fallback',reason:'CANCELLED_LOCALLY'},
  {id:'missing_proof',label:'Missing independently signed proof',signal:'MOCK_PROOF_ABSENT',phase:'proof',reason:'MISSING_ORIGINAL_PROOF'},
  {id:'wrong_tenant',label:'Wrong business / support tenant',signal:'MOCK_WRONG_TENANT',phase:'scope',reason:'TENANT_BOUNDARY'},
  {id:'missing_consent',label:'Missing fictional consent marker',signal:'MOCK_CONSENT_ABSENT',phase:'scope',reason:'CONSENT_UNPROVEN'},
  {id:'overprivileged',label:'Unexpected write capability',signal:'MOCK_WRITE_PRIVILEGE',phase:'contract',reason:'UNEXPECTED_PRIVILEGE'},
  {id:'breaking_version',label:'Breaking v2 schema proposal',signal:'MOCK_BREAKING_VERSION',phase:'contract',reason:'VERSION_MISMATCH'}
] as const;
export type Ql328Scenario=typeof QL328_SCENARIOS[number]['id'];

export type Ql328Request={sourceId:string;scenario:Ql328Scenario;tenantAlias?:string|null;attempt?:number};
export type Ql328PhaseReadback={id:Ql328Phase;label:string;status:'UNMET'|'SIMULATED_STOP'|'NOT_EXECUTED';note:string};
export type Ql328Packet={
  packetId:string;idempotencyKey:string;disposition:'NO_GO';delivery:'UNSENT';
  origin:'LOCAL_FIXTURE_ONLY';source:string;role:'business'|'support'|'unknown';
  tenantAlias:string|null;scenario:string;signal:string;reason:string;stopPhase:Ql328Phase;
  originalProof:'NOT_VERIFIED';independentAuthority:'NOT_VERIFIED';
  ownerTestApproval:'NOT_GRANTED';consent:'NOT_GRANTED';connection:'DISCONNECTED / HOLD';
  fallback:string;rollbackSteps:readonly string[];mayRetryAutomatically:false;maySend:false;
  signed:false;stored:false;sourceRequests:0;sourceWrites:0;secretReads:0;ackSent:false
};
export type Ql328Outcome={packet:Ql328Packet;phases:Ql328PhaseReadback[];
  fixtureDecision:string;attempt:number;idempotent:true;networkRequests:0;providerWrites:0;
  customerRecords:0;credentialsRead:0;rollbackRemote:false;replaySent:false;allHeld:true};

const rollbackSteps=[
  'Cancel the local rehearsal and discard its preview state; do not contact a source.',
  'Retain the pinned synthetic v1 contract and each independent business boundary.',
  'Hand the UNSENT NO-GO explanation to the source owner and independent reviewer for a separately approved decision.'
] as const;
const safeId=(text:string)=>/^[a-z][a-z0-9-]{1,40}$/.test(text)?text:'unknown-source';

/** Fixed idempotency key is based solely on the fictional source and scenario, never on live tokens. */
export function ql328Orchestrate(request:Ql328Request):Ql328Outcome{
  const source=QL327_SOURCE_MATRIX.find(row=>row.id===request.sourceId);
  const scenario=QL328_SCENARIOS.find(row=>row.id===request.scenario);
  const fallbackScenario=QL328_SCENARIOS[0];
  const selected=scenario??fallbackScenario;
  const fixture=source?ql327SyntheticFixture(source.id):null;
  let fixtureDecision='DENY_UNKNOWN_SOURCE';
  if(fixture && source){
    const trial:{[key:string]:unknown}={...fixture,capabilities:[...fixture.capabilities]};
    if(selected.id==='wrong_tenant')trial.tenant_id=source.role==='support'?'np-other-company-demo':'np-other-business';
    if(selected.id==='missing_consent')delete trial.consent_marker;
    if(selected.id==='overprivileged')trial.capabilities=['write_customer_records'];
    if(selected.id==='breaking_version')trial.schema_version=QL327_BREAKING_VERSION;
    fixtureDecision=ql327ValidateResponse(source.id,trial).decision;
  }
  let reason:string=selected.reason;
  let stopPhase:Ql328Phase=selected.phase;
  if(!source){reason='UNKNOWN_SOURCE';stopPhase='proof';}
  else if(request.tenantAlias!==undefined&&request.tenantAlias!==source.fixtureAlias){
    reason='TENANT_BOUNDARY';stopPhase='scope';
  }
  const id=safeId(source?.id??request.sourceId);
  const packet:Ql328Packet={
    packetId:'QL328-'+id+'-'+selected.id+'-NO-GO',
    idempotencyKey:'ql328|'+id+'|'+selected.id+'|'+QL327_BASELINE_VERSION,
    disposition:'NO_GO',delivery:'UNSENT',origin:'LOCAL_FIXTURE_ONLY',
    source:source?.id??'UNKNOWN',role:source?.role??'unknown',
    tenantAlias:source?.fixtureAlias??null,scenario:selected.id,signal:selected.signal,
    reason,stopPhase,originalProof:'NOT_VERIFIED',
    independentAuthority:'NOT_VERIFIED',ownerTestApproval:'NOT_GRANTED',
    consent:'NOT_GRANTED',connection:'DISCONNECTED / HOLD',
    fallback:'STOP; do not retry, fallback to another tenant, or operate a private gateway.',
    rollbackSteps,mayRetryAutomatically:false,maySend:false,signed:false,stored:false,
    sourceRequests:0,sourceWrites:0,secretReads:0,ackSent:false
  };
  const phases=QL328_PHASES.map(phase=>({
    id:phase.id,label:phase.label,
    status:(phase.id===stopPhase?'SIMULATED_STOP':phase.id==='proof'||phase.id==='authority'?'UNMET':'NOT_EXECUTED') as Ql328PhaseReadback['status'],
    note:phase.id===stopPhase?'Local signal: '+reason:phase.condition+' · NO REAL VALIDATION'
  }));
  return {packet,phases,fixtureDecision,
    attempt:Number.isInteger(request.attempt)&&request.attempt!>=1&&request.attempt!<=3?request.attempt!:1,
    idempotent:true,networkRequests:0,providerWrites:0,customerRecords:0,credentialsRead:0,
    rollbackRemote:false,replaySent:false,allHeld:true};
}

/** "Retry" replays only deterministic calculations, never HTTP; packet and key remain unchanged. */
export function ql328RetryLocally(request:Ql328Request):Ql328Outcome{
  const original=ql328Orchestrate({...request,attempt:1});
  return {...original,attempt:Math.min(3,Math.max(1,Number.isInteger(request.attempt)?request.attempt!:1))};
}

export function ql328FailureMatrix(){
  const cases=QL327_SOURCE_MATRIX.flatMap(row=>QL328_SCENARIOS.map(scenario=>
    ql328Orchestrate({sourceId:row.id,scenario:scenario.id,tenantAlias:row.fixtureAlias})));
  return {cases:cases.length,sourceCount:QL327_SOURCE_MATRIX.length,
    failureSignals:QL328_SCENARIOS.length,noGo:cases.filter(x=>x.packet.disposition==='NO_GO').length,
    allUnsent:cases.every(x=>x.packet.delivery==='UNSENT'&&!x.packet.maySend),
    allHeld:cases.every(x=>x.allHeld&&x.networkRequests===0&&x.providerWrites===0&&
      x.credentialsRead===0&&x.packet.connection==='DISCONNECTED / HOLD'),
    uniqueKeys:new Set(cases.map(x=>x.packet.idempotencyKey)).size,
    businessCount:QL327_SOURCE_MATRIX.filter(x=>x.role==='business').length,
    supportCount:QL327_SOURCE_MATRIX.filter(x=>x.role==='support').length};
}
export const QL328_BOUNDARY={sources:6,businesses:4,support:2,privateGETs:0,
  connected:0,authenticated:0,sourceWrites:0,customerRecords:0,credentialsRead:0,
  realRetries:0,realRollbacks:0,sentPackets:0,ack:'UNDER_REVIEW / PARKED_FOR_LATER',
  windowsRelay:'OFF'} as const;
