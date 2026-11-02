import {QL270_SOURCES,ql270ClassifyPublicResponse,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL290_OBSERVED_AT,QL290_PUBLIC_SOURCE_RECHECK} from './ql290OriginWitnessPriority';

export const QL303_GATES=[
  {id:'ORIGINAL_PROOF_B',label:'Original signed Proof-B',state:'ABSENT'},
  {id:'INDEPENDENT_ORIGIN',label:'Independent issuer / reviewer / witness custody',state:'UNVERIFIED'},
  {id:'TENANT_SCOPE',label:'Isolated nonproduction tenant',state:'NOT_AUTHORIZED'},
  {id:'SCOPED_GET',label:'Scoped TEST-only GET identity',state:'NOT_AUTHORIZED'},
  {id:'OWNER_TEST',label:'Explicit owner TEST approval',state:'NOT_GIVEN'}
] as const;

/** Six independent, unauthenticated public GitHub immutable-path GETs on 2 Nov 2026; each returned 404. */
export const QL303_OBSERVED_AT='2026-11-02T01:20:55Z';

export const QL303_ROWS=QL270_SOURCES.map(source=>{
  const proof=QL290_PUBLIC_SOURCE_RECHECK.find(row=>row.source===source.id);
  if(!proof)throw Error('MISSING_IMMUTABLE_SOURCE_PIN');
  return {...source,repo:proof.repo,sha:proof.sha,historicalHttp:proof.http,
    historicalAt:QL290_OBSERVED_AT,observedHttp:404,observedAt:QL303_OBSERVED_AT,capability:'REGISTRY_ONLY',permission:'DENIED',
    connection:'DISCONNECTED / HOLD',approvedGates:0,requiredGates:QL303_GATES.length};
});

export type Ql303Observation={source:Ql270SourceId;at:string;status:number|null;kind:ReturnType<typeof ql270ClassifyPublicResponse>|'NETWORK_ERROR'};

export function ql303ImmutableProofUrl(source:Ql270SourceId){
  const row=QL303_ROWS.find(item=>item.id===source);
  if(!row)throw Error('UNKNOWN_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql303Classify(status:number|null){
  return status===null?'NETWORK_ERROR' as const:ql270ClassifyPublicResponse(status);
}

export function ql303AgeDays(at:string,now:Date){
  const start=Date.parse(at),end=now.getTime();
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return null;
  return Math.floor((end-start)/86_400_000);
}

export function ql303NotificationCandidate(source:Ql270SourceId,observation?:Ql303Observation,now=new Date()){
  const row=QL303_ROWS.find(item=>item.id===source);
  if(!row)throw Error('UNKNOWN_SOURCE');
  const status=observation?.kind??ql303Classify(row.observedHttp);
  const at=observation?.at??row.observedAt;
  const age=ql303AgeDays(at,now);
  const stale=age===null||age>=1;
  return {source,recipientRole:'Source owner / independent proof reviewer (unresolved)',
    priority:status==='PUBLIC_FILE_PRESENT_UNVERIFIED'?'PROOF_REVIEW':stale?'STALE_SOURCE_EVIDENCE':'MISSING_SOURCE_PROOF',
    subject:`UNSENT REVIEW · ${row.label} · immutable Proof-B readiness`,
    body:`Local draft only. Source: ${row.label} (${row.kind}); pinned commit ${row.sha}. Public proof result: ${status} (${at}; ${age===null?'age unknown':`${age} full days old`}). All ${QL303_GATES.length} independent permission/proof gates remain unapproved. Request authorized original signed proof and an independent reviewer/witness preflight; do not attempt source gateway GET, activate a connection, or send an ACK.`,
    sent:false,deliveryAttempts:0,connectionEnabled:false};
}
