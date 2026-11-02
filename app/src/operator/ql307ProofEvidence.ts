import {QL303_ROWS,QL303_GATES,ql303Classify,ql303ImmutableProofUrl} from './ql303CapabilityReadiness';
import type {Ql270SourceId} from './ql270ConnectionCentre';

/** Public immutable-path GET observations, taken independently of browser runtime. Never fetch private gateways. */
export const QL307_OBSERVED_AT='2026-11-02T12:32:28Z';
export const QL307_PUBLIC_RECHECK=QL303_ROWS.map(row=>({
  source:row.id,repo:row.repo,sha:row.sha,http:404 as number,observedAt:QL307_OBSERVED_AT,
  priorHttp:row.observedHttp,priorAt:row.observedAt,url:ql303ImmutableProofUrl(row.id)
}));

export const QL307_EVIDENCE_KINDS=[
  {id:'ORIGINAL_PROOF_B',label:'Original signed Proof-B reference'},
  {id:'ISSUER_PIN',label:'Issuer identity / pinned key reference'},
  {id:'INDEPENDENT_REVIEWER',label:'Independent reviewer authority reference'},
  {id:'WITNESS_CUSTODY',label:'Witness / custody-chain reference'},
  {id:'OWNER_TEST',label:'Explicit owner TEST decision reference'}
] as const;
export type Ql307EvidenceKind=typeof QL307_EVIDENCE_KINDS[number]['id'];
export type Ql307ReviewState='AWAITING_INDEPENDENT_VERIFICATION'|'REFERENCE_NEEDS_CORRECTION'|'REFERRED_FOR_EXTERNAL_REVIEW';
export type Ql307Intake={id:string;source:Ql270SourceId;kind:Ql307EvidenceKind;reference:string;state:Ql307ReviewState};

export function ql307ClassifyPublicStatus(http:number|null){
  return http===null?'NETWORK_ERROR' as const:ql303Classify(http);
}

/** Nonsecret references only, never credentials, signed content, raw URLs or identities. */
export function ql307ReferenceError(input:string):string|null{
  const value=input.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,39}$/.test(value))return 'Use a reference of 5–40 letters, numbers, dashes or underscores; no links or private data.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key|auth|eyJ)/i.test(value))return 'Do not enter credentials, tokens, identity details, signatures or private evidence.';
  return null;
}

export function ql307IntakeDraft(source:Ql270SourceId,kind:Ql307EvidenceKind,reference:string,prior:readonly Ql307Intake[]){
  if(!QL307_PUBLIC_RECHECK.some(row=>row.source===source))return {error:'Unknown source',entry:null};
  if(!QL307_EVIDENCE_KINDS.some(row=>row.id===kind))return {error:'Unknown evidence type',entry:null};
  const error=ql307ReferenceError(reference);
  if(error)return {error,entry:null};
  const normalized=reference.trim();
  if(prior.some(row=>row.source===source&&row.kind===kind&&row.reference===normalized))return {error:'This reference is already in this source queue.',entry:null};
  return {error:null,entry:{id:`${source}-${kind}-${normalized}`,source,kind,reference:normalized,state:'AWAITING_INDEPENDENT_VERIFICATION' as const}};
}

export function ql307ReviewSummary(entries:readonly Ql307Intake[]){
  return {sources:QL307_PUBLIC_RECHECK.length,missing:QL307_PUBLIC_RECHECK.filter(row=>row.http===404).length,
    pending:entries.length,independentlyVerified:0,approvedGates:0,requiredGates:QL303_GATES.length,
    publicRequestsInBrowser:0,privateGatewayRequests:0,notificationsSent:0,connectionEnabled:false,
    release:'DISCONNECTED / HOLD' as const};
}
