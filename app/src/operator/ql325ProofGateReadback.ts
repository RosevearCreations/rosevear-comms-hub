import {QL270_PROOF_SNAPSHOT,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL289_OBSERVED_AT,QL289_PUBLIC_SOURCE_RECHECK} from './ql289ProvenanceWitnessReceiptAging';
import {QL290_OBSERVED_AT,QL290_PUBLIC_SOURCE_RECHECK} from './ql290OriginWitnessPriority';
import {QL303_GATES,QL303_OBSERVED_AT,QL303_ROWS} from './ql303CapabilityReadiness';
import {QL324_CATALOGUE} from './ql324ConnectionCatalogue';

/** Completion timestamp of six credential-free public GETs, not a live-health timestamp. */
export const QL325_OBSERVED_AT='2026-11-03T16:32:38Z';
export const QL325_PUBLIC_RESULTS=[
  {source:'rosiedazzlers',http:404},
  {source:'devilndove',http:404},
  {source:'icamp',http:404},
  {source:'yw',http:404},
  {source:'ai-data-platform',http:404},
  {source:'rosevear-ai-hub',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;http:number}>;

export type Ql325PublicResult='PRESENT_UNVERIFIED'|'MISSING_404'|'FORBIDDEN_403'|
  'RATE_LIMITED_429'|'AUTH_REQUIRED_401'|'NETWORK_ERROR'|'OTHER_PUBLIC_ERROR';

/** Public response classification is information only. None can authorize a connection. */
export function ql325ClassifyResponse(status:number|null):{
  result:Ql325PublicResult;meaning:string;proofAccepted:false;permissionGranted:false
}{
  const map:Record<number,{result:Ql325PublicResult;meaning:string}>={
    200:{result:'PRESENT_UNVERIFIED',meaning:'Public file exists. Signer, origin, custody and authority remain unverified.'},
    401:{result:'AUTH_REQUIRED_401',meaning:'Public request was not authorized; no private authentication attempted.'},
    403:{result:'FORBIDDEN_403',meaning:'Public request was forbidden. It does not establish proof presence or absence.'},
    404:{result:'MISSING_404',meaning:'File not found at this immutable commit and exact path.'},
    429:{result:'RATE_LIMITED_429',meaning:'Public request was rate limited. Proof presence remains unknown.'}
  };
  const found=status===null?{result:'NETWORK_ERROR' as const,meaning:'No valid HTTP response; evidence unknown.'}:
    map[status]??{result:'OTHER_PUBLIC_ERROR' as const,meaning:'Unexpected HTTP status; independent review required.'};
  return {...found,proofAccepted:false,permissionGranted:false};
}

export function ql325ImmutableUrl(repo:string,sha:string){
  if(!/^[A-Za-z][A-Za-z0-9-]*$/.test(repo)||!/^[a-f0-9]{40}$/.test(sha))throw Error('INVALID_IMMUTABLE_PROOF_REFERENCE');
  return `https://api.github.com/repos/RosevearCreations/${repo}/contents/docs/integration/ql246-source-proof.json?ref=${sha}`;
}

const ownerNextSteps:Record<(typeof QL303_GATES)[number]['id'],string>={
  ORIGINAL_PROOF_B:'Source owner provides the genuine signed original at a verifiable immutable path.',
  INDEPENDENT_ORIGIN:'Independent custodian and witness verify issuer identity, signer key, provenance and chain.',
  TENANT_SCOPE:'Source owner independently verifies an isolated nonproduction tenant; no production aliases.',
  SCOPED_GET:'Security reviewer authorizes a least-privilege TEST-only identity for scoped GET contracts.',
  OWNER_TEST:'Owner explicitly authorizes the exact TEST scope after independent evidence review.'
};
export const QL325_FIVE_GATES=QL303_GATES.map(gate=>({...gate,next:ownerNextSteps[gate.id],approved:false as const}));

function priorPin<T extends {source:Ql270SourceId}>(rows:readonly T[],source:Ql270SourceId):T{
  const found=rows.find(row=>row.source===source);
  if(!found)throw Error(`MISSING_HISTORICAL_SOURCE_${source}`);
  return found;
}

export const QL325_ROWS=QL324_CATALOGUE.map(source=>{
  const initial=priorPin(QL270_PROOF_SNAPSHOT,source.id);
  const q289=priorPin(QL289_PUBLIC_SOURCE_RECHECK,source.id);
  const q290=priorPin(QL290_PUBLIC_SOURCE_RECHECK,source.id);
  const q303=QL303_ROWS.find(row=>row.id===source.id);
  const q325=priorPin(QL325_PUBLIC_RESULTS,source.id);
  if(!q303||source.pinnedCommit!==q303.sha)throw Error(`MISMATCHED_SOURCE_PIN_${source.id}`);
  const history=[
    {build:'QL-270',at:'2026-10-30 (time not recorded)',sha:initial.sha,http:404,kind:'Public main-ref snapshot'},
    {build:'QL-289',at:QL289_OBSERVED_AT,sha:q289.sha,http:q289.http,kind:'Immutable-path historical GET'},
    {build:'QL-290',at:QL290_OBSERVED_AT,sha:q290.sha,http:q290.http,kind:'Immutable-path historical GET'},
    {build:'QL-303',at:QL303_OBSERVED_AT,sha:q303.sha,http:q303.observedHttp,kind:'Immutable-path historical GET'},
    {build:'QL-325',at:QL325_OBSERVED_AT,sha:q303.sha,http:q325.http,kind:'Immutable-path public GET · latest recorded'}
  ];
  const driftTransitions=history.slice(1).filter((stage,index)=>stage.sha!==history[index].sha).length;
  return {...source,history,current:{sha:q303.sha,http:q325.http,at:QL325_OBSERVED_AT,
      url:ql325ImmutableUrl(source.repo,q303.sha),...ql325ClassifyResponse(q325.http)},
    driftTransitions,approvedGates:0 as const,requiredGates:5 as const,
    authorized:false as const,privateGatewayGets:0 as const,sourceWrites:0 as const};
});

export function ql325SnapshotFreshness(now:Date){
  const elapsed=now.getTime()-Date.parse(QL325_OBSERVED_AT);
  if(!Number.isFinite(elapsed)||elapsed<0)return {state:'CLOCK_REVIEW' as const,hours:null};
  return {state:elapsed>=86_400_000?'STALE_RECHECK_REQUIRED' as const:'DATED_PUBLIC_SNAPSHOT' as const,
    hours:Math.floor(elapsed/3_600_000)};
}

export const QL325_BOUNDARY={sources:6,businesses:4,support:2,publicProofGETs:6,
  authenticatedGatewayGETs:0,sourceWrites:0,approvedGates:0,connected:0,ownerTESTApprovals:0,
  ackDelivery:'UNDER_REVIEW / PARKED_FOR_LATER',privateRelay:'OFF'} as const;
