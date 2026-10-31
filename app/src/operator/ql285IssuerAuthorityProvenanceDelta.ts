import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from './ql282IssuerPublicationReview';
import {QL284_OBSERVED_AT,QL284_PUBLIC_SOURCE_RECHECK,QL284_REVIEWER_CROSSCHECK_GATES,
  QL284_OWNER_RESPONSE_CLAIM_TYPES,type Ql284ReviewerCrossCheck,type Ql284OwnerResponse,
  type Ql284SourceFollowup} from './ql284ReviewerCrosscheckOwnerResponse';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';

/** Real public GitHub main ref and exact immutable original Proof-B GET results, not authenticated gateway evidence. */
export const QL285_OBSERVED_AT='2026-10-31T13:58:08Z';
export const QL285_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'d2677d2fb0fce8a6aa2aaf76675bcbb55964e79f',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'98d729f56d56a850a7d94a987e90313f362bc519',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'907a4f77b29cd56b3e717f06f4c4a1a458f28e35',http:404},
  {source:'yw',repo:'yw',sha:'5027fcb6579f09c521bfdae1095efe39d98ffe64',http:404},
  {source:'icamp',repo:'iCamp',sha:'e835caf206712d3d4c8104d329417d32f8e7f18c',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'422fa64f0d0220ee4ddf33ba0bb27ab617ab122d',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL285_AUTHORITY_CHALLENGE_GATES=[
  {id:'authority-chain',label:'Resolve original issuer organization, delegated relying-party authority and trust-anchor chain independently',status:'NOT_AUTHENTICATED'},
  {id:'reviewer-scope',label:'Match named independent reviewer role, account, engagement and exact challenge authorization',status:'NOT_CORROBORATED'},
  {id:'key-pin',label:'Separately witness exact issuer SPKI fingerprint, rotation chain and revocation status',status:'NOT_VERIFIED'},
  {id:'nonce',label:'Obtain issuer-generated unpredictable one-use challenge nonce, audience and expiry',status:'NOT_ISSUED'},
  {id:'signed-return',label:'Independently validate original reviewer challenge signature, proof origin and replay controls',status:'NOT_RECEIVED'},
  {id:'custody',label:'Obtain original custodian/witness receipt and immutable signed challenge evidence',status:'NOT_RECEIVED'},
  {id:'owner-consent',label:'Obtain explicit owner TEST-only named-source challenge approval before any external action',status:'NOT_GIVEN'}
] as const;

const referenceProblem=(raw:string):string|null=>{
  const value=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value))
    return 'Use a nonsecret case reference of 5–32 letters, digits, underscores or dashes.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(value))
    return 'Never enter private keys, authorization tokens, signer material or challenge secrets.';
  return null;
};
const after=(prior:string,now:Date)=>Number.isFinite(now.getTime())&&now.getTime()>new Date(prior).getTime();

export type Ql285AuthorityAudit={checkId:string;crosscheckReference:string;authorityCase:string;
  preparedAt:string;gates:typeof QL285_AUTHORITY_CHALLENGE_GATES;verified:0;
  issuer:'NOT_AUTHENTICATED';reviewer:'NOT_AUTHENTICATED';challenge:'NOT_ISSUED';
  signature:'NOT_VERIFIED';ownerApproval:'NOT_GIVEN';disposition:'AUTHORITY_CHALLENGE_PRECONDITIONS_ONLY';
  state:'LOCAL_UNVERIFIED_AUDIT'};

export function ql285PrepareAuthorityAudit(crosscheck:Ql284ReviewerCrossCheck,reference:string,now:Date):
  {ok:true;draft:Ql285AuthorityAudit}|{ok:false;reason:string} {
  if(!crosscheck||crosscheck.verified!==0||crosscheck.reviewer!=='NOT_AUTHENTICATED'||
    crosscheck.issuer!=='NOT_AUTHENTICATED'||crosscheck.keyPin!=='NOT_VERIFIED'||
    crosscheck.signature!=='NOT_VERIFIED'||crosscheck.ownerApproval!=='NOT_GIVEN'||
    crosscheck.disposition!=='INDEPENDENT_CROSSCHECK_PENDING'||crosscheck.state!=='LOCAL_UNVERIFIED_CLAIM'||
    !Array.isArray(crosscheck.gates)||crosscheck.gates.length!==QL284_REVIEWER_CROSSCHECK_GATES.length||
    !crosscheck.gates.every((gate,i)=>gate.id===QL284_REVIEWER_CROSSCHECK_GATES[i].id&&gate.status===QL284_REVIEWER_CROSSCHECK_GATES[i].status))
    return {ok:false,reason:'An intact unverified QL-284 reviewer trust cross-check must precede an issuer authority challenge audit.'};
  const error=referenceProblem(reference);if(error)return {ok:false,reason:error};
  if(!after(crosscheck.preparedAt,now))return {ok:false,reason:'Authority audit preparation must follow its QL-284 cross-check.'};
  return {ok:true,draft:{checkId:crosscheck.checkId,crosscheckReference:crosscheck.caseReference,
    authorityCase:reference.trim(),preparedAt:now.toISOString(),gates:QL285_AUTHORITY_CHALLENGE_GATES,
    verified:0,issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',challenge:'NOT_ISSUED',
    signature:'NOT_VERIFIED',ownerApproval:'NOT_GIVEN',disposition:'AUTHORITY_CHALLENGE_PRECONDITIONS_ONLY',
    state:'LOCAL_UNVERIFIED_AUDIT'}};
}

export const QL285_PROVENANCE_CLAIM_TYPES=[
  {value:'OWNER_SOURCE_REFERENCE',label:'Claimed owner/source publication reference only'},
  {value:'CUSTODIAN_RECEIPT_REFERENCE',label:'Claimed original custodian receipt reference only'},
  {value:'INDEPENDENT_WITNESS_REFERENCE',label:'Claimed independent witness reference only'}
] as const;
export type Ql285ProvenanceType=typeof QL285_PROVENANCE_CLAIM_TYPES[number]['value'];
export type Ql285ProvenanceReview={source:Ql270SourceId;ownerResponseReference:string;reference:string;
  provenanceType:Ql285ProvenanceType;priorSha:string;latestSha:string;preparedAt:string;
  ownerIdentity:'NOT_AUTHENTICATED';originalReceipt:'NOT_VERIFIED';original:'HTTP_404_AT_IMMUTABLE_PIN';
  provenance:'UNAVAILABLE_FOR_INDEPENDENT_RECONCILIATION';routed:false;resolved:false;
  disposition:'QUARANTINED_REFERENCE_CLAIM';state:'LOCAL_UNVERIFIED_REVIEW'};

export function ql285PrepareProvenance(response:Ql284OwnerResponse,reference:string,
  provenanceType:Ql285ProvenanceType,now:Date):{ok:true;draft:Ql285ProvenanceReview}|{ok:false;reason:string} {
  const previous=QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source===response?.source);
  const current=QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source===response?.source);
  if(!previous||!current||response.observedSourceSha!==previous.sha||
    !QL284_OWNER_RESPONSE_CLAIM_TYPES.some(row=>row.value===response.responseType)||
    response.ownerIdentity!=='NOT_AUTHENTICATED'||response.responseReceipt!=='NOT_VERIFIED'||
    response.original!=='HTTP_404_AT_IMMUTABLE_PIN'||response.externallyContacted!==false||
    response.delivered!==false||response.routed!==false||response.resolved!==false||
    response.state!=='LOCAL_UNVERIFIED_CLAIM')
    return {ok:false,reason:'Only an intact unresolved QL-284 local owner-response claim can be reconciled.'};
  const error=referenceProblem(reference);if(error)return {ok:false,reason:error};
  if(!QL285_PROVENANCE_CLAIM_TYPES.some(row=>row.value===provenanceType))
    return {ok:false,reason:'Select a supported unverified provenance-reference category.'};
  if(!after(response.preparedAt,now)||now.getTime()<new Date(QL285_OBSERVED_AT).getTime())
    return {ok:false,reason:'Provenance review must follow the QL-284 claim and QL-285 public observation.'};
  return {ok:true,draft:{source:response.source,ownerResponseReference:response.responseReference,
    reference:reference.trim(),provenanceType,priorSha:previous.sha,latestSha:current.sha,
    preparedAt:now.toISOString(),ownerIdentity:'NOT_AUTHENTICATED',originalReceipt:'NOT_VERIFIED',
    original:'HTTP_404_AT_IMMUTABLE_PIN',provenance:'UNAVAILABLE_FOR_INDEPENDENT_RECONCILIATION',
    routed:false,resolved:false,disposition:'QUARANTINED_REFERENCE_CLAIM',state:'LOCAL_UNVERIFIED_REVIEW'}};
}

export function ql285PinnedProofUrl(source:Ql270SourceId):string {
  const row=QL285_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL285_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql285PublicationDelta(asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[]){
  const elapsed=new Date(asOf).getTime()-new Date(QL285_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'PUBLIC_RECHECK_DUE' as const:'PINNED_RECENT' as const;
  const rows=QL285_PUBLIC_SOURCE_RECHECK.map(current=>{
    const previous=QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const moved=String(previous?.sha)!==String(current.sha);
    const related=notices.filter(row=>row.source===current.source&&row.notice==='CLAIMED_NOT_CONFIRMED');
    return {...current,previousSha:previous?.sha??null,previousHttp:previous?.http??null,moved,
      reason:(moved?'CHANGED_SHA_ORIGINAL_404':'UNCHANGED_SHA_ORIGINAL_404') as
        'CHANGED_SHA_ORIGINAL_404'|'UNCHANGED_SHA_ORIGINAL_404',
      queue:'PUBLICATION_EXCEPTION_DELTA_REVIEW' as const,originalVerified:false as const,
      authenticatedGET:false as const,notices:related.length,
      postSnapshotNotices:related.filter(row=>new Date(row.preparedAt).getTime()>new Date(QL285_OBSERVED_AT).getTime()).length,
      stalePinNotices:related.filter(row=>row.sha!==current.sha).length};
  });
  return {rows,observedAt:QL285_OBSERVED_AT,previousObservedAt:QL284_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL285_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    originalsAccepted:0,authenticatedSourceGets:0,automaticPolling:false,release:'DISCONNECTED / HOLD' as const};
}

export type Ql285DeltaWorkItem={source:Ql270SourceId;previousCase:string;reference:string;
  priorSha:string;observedSha:string;preparedAt:string;original:'HTTP_404_AT_IMMUTABLE_PIN';
  sourceChanged:boolean;reviewScheduled:false;reviewExecuted:false;originalAccepted:false;
  state:'LOCAL_PENDING_PUBLICATION_DELTA_REVIEW'};

export function ql285PrepareDeltaWorkItem(previous:Ql284SourceFollowup,reference:string,now:Date):
  {ok:true;draft:Ql285DeltaWorkItem}|{ok:false;reason:string} {
  const before=QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!before||!current||previous.observedSha!==before.sha||previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||
    previous.taskScheduled!==false||previous.taskExecuted!==false||previous.originalAccepted!==false||
    previous.state!=='LOCAL_PENDING_REVALIDATION_REVIEW')
    return {ok:false,reason:'An unexecuted, unaccepted QL-284 manual source follow-up is required.'};
  const error=referenceProblem(reference);if(error)return {ok:false,reason:error};
  if(!after(previous.preparedAt,now)||now.getTime()<new Date(QL285_OBSERVED_AT).getTime())
    return {ok:false,reason:'Delta work item cannot predate its QL-284 source follow-up or actual public observation.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,
    reference:reference.trim(),priorSha:before.sha,observedSha:current.sha,preparedAt:now.toISOString(),
    original:'HTTP_404_AT_IMMUTABLE_PIN',sourceChanged:before.sha!==String(current.sha),
    reviewScheduled:false,reviewExecuted:false,originalAccepted:false,
    state:'LOCAL_PENDING_PUBLICATION_DELTA_REVIEW'}};
}

export function ql285AuditPacket(authorities:readonly Ql285AuthorityAudit[],provenance:readonly Ql285ProvenanceReview[],
  deltaItems:readonly Ql285DeltaWorkItem[],asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[]){
  return JSON.stringify({build:'QL-285',mode:'LOCAL_UNVERIFIED_AUDIT_ONLY',
    publicationDelta:ql285PublicationDelta(asOf,notices),
    authorityChallenge:{gates:QL285_AUTHORITY_CHALLENGE_GATES,verified:0,challengeIssued:false,localAudits:authorities},
    ownerProvenance:{authenticatedOwnerResponses:0,originalsVerified:0,localQuarantinedClaims:provenance},
    sourceDeltaWorkItems:deltaItems,
    ackDeliveryEvidence:{...QL282_ACK_WORKSTREAM,active:false,action:'NONE'},
    integrationSecurity:{state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false}},null,2);
}
