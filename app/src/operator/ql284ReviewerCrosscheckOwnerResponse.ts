import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from './ql282IssuerPublicationReview';
import {QL283_OBSERVED_AT,QL283_PUBLIC_SOURCE_RECHECK,QL283_ISSUER_TRUST_GATES,
  type Ql283TrustReference,type Ql283OwnerFollowup,type Ql283RecheckDraft} from './ql283IssuerTrustOwnerFollowup';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';

/** Independent public GitHub main refs and exact immutable Proof-B path GETs.
 * These observations do not authenticate any owner, reviewer, signer or private gateway. */
export const QL284_OBSERVED_AT='2026-10-31T13:31:38Z';
export const QL284_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'1df63b8f4b9995609237a8285fff435c073638c4',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'6d077326f755fcdb301f1bbf2562dc70e95968a3',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'c09e58f07474321df01caa54c7a38f527cdc7873',http:404},
  {source:'yw',repo:'yw',sha:'5027fcb6579f09c521bfdae1095efe39d98ffe64',http:404},
  {source:'icamp',repo:'iCamp',sha:'3c72ff6e2b187a190a34d9596bd6228053b740ea',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'81b2aa449714539c28fd6f8ee4716075c78d3850',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL284_REVIEWER_CROSSCHECK_GATES=[
  {id:'independent-reviewer',label:'Independently authenticate reviewer identity, appointment and permitted relying-party role',status:'NOT_AUTHENTICATED'},
  {id:'origin-reference',label:'Cross-check QL-283 trust reference against independently obtained original issuer origin',status:'NOT_CORROBORATED'},
  {id:'trusted-key',label:'Separately compare witnessed SPKI fingerprint, rotation and revocation against the original issuer',status:'NOT_VERIFIED'},
  {id:'nonce-audience',label:'Validate signed original nonce, expiry, protected audience and anti-replay binding',status:'NOT_VALIDATED'},
  {id:'witness-custody',label:'Obtain original signed reviewer/witness custody record with immutable case linkage',status:'NOT_RECEIVED'},
  {id:'owner-authority',label:'Obtain owner TEST-only authorization for named reviewer and exact source scope',status:'NOT_GIVEN'},
  {id:'independent-conclusion',label:'Record independently witnessed conclusion and audit provenance only after all earlier gates',status:'NOT_PERFORMED'}
] as const;

const caseProblem=(raw:string):string|null=>{
  const value=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value))return 'Provide a nonsecret 5–32-character case reference (letters, digits, dash or underscore).';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(value))
    return 'Never paste credentials, signing material, tokens or challenge secrets.';
  return null;
};
const follows=(start:string,now:Date)=>Number.isFinite(now.getTime())&&now.getTime()>new Date(start).getTime();

export type Ql284ReviewerCrossCheck={checkId:string;trustReference:string;caseReference:string;
  preparedAt:string;gates:typeof QL284_REVIEWER_CROSSCHECK_GATES;verified:0;
  reviewer:'NOT_AUTHENTICATED';issuer:'NOT_AUTHENTICATED';keyPin:'NOT_VERIFIED';
  signature:'NOT_VERIFIED';ownerApproval:'NOT_GIVEN';
  disposition:'INDEPENDENT_CROSSCHECK_PENDING';state:'LOCAL_UNVERIFIED_CLAIM'};

export function ql284PrepareCrossCheck(trust:Ql283TrustReference,reference:string,now:Date):
  {ok:true;draft:Ql284ReviewerCrossCheck}|{ok:false;reason:string} {
  if(!trust||trust.verified!==0||trust.issuer!=='NOT_AUTHENTICATED'||trust.keyPin!=='NOT_VERIFIED'||
    trust.challenge!=='NOT_ISSUED'||trust.ownerApproval!=='NOT_GIVEN'||
    trust.disposition!=='TRUST_REFERENCE_REVIEW_ONLY'||trust.state!=='DRAFT_NOT_SENT'||
    !Array.isArray(trust.gates)||trust.gates.length!==QL283_ISSUER_TRUST_GATES.length||
    !trust.gates.every((gate,index)=>gate.id===QL283_ISSUER_TRUST_GATES[index].id&&gate.status===QL283_ISSUER_TRUST_GATES[index].status))
    return {ok:false,reason:'Only an intact, unverified QL-283 trust-reference draft may enter independent cross-check.'};
  const problem=caseProblem(reference);if(problem)return {ok:false,reason:problem};
  if(!follows(trust.preparedAt,now))return {ok:false,reason:'Cross-check preparation must follow the QL-283 trust reference.'};
  return {ok:true,draft:{checkId:trust.checkId,trustReference:trust.trustReference,
    caseReference:reference.trim(),preparedAt:now.toISOString(),gates:QL284_REVIEWER_CROSSCHECK_GATES,
    verified:0,reviewer:'NOT_AUTHENTICATED',issuer:'NOT_AUTHENTICATED',keyPin:'NOT_VERIFIED',
    signature:'NOT_VERIFIED',ownerApproval:'NOT_GIVEN',
    disposition:'INDEPENDENT_CROSSCHECK_PENDING',state:'LOCAL_UNVERIFIED_CLAIM'}};
}

export const QL284_OWNER_RESPONSE_CLAIM_TYPES=[
  {value:'ORIGINAL_PUBLICATION_PENDING',label:'Owner claims original publication is pending'},
  {value:'ORIGINAL_SOURCE_CLAIMED',label:'Owner claims original source was supplied — unverified'},
  {value:'FOLLOWUP_CLARIFICATION_REQUESTED',label:'Owner claims clarification is required'}
] as const;
export type Ql284OwnerResponseType=typeof QL284_OWNER_RESPONSE_CLAIM_TYPES[number]['value'];
export type Ql284OwnerResponse={source:Ql270SourceId;followupReference:string;responseReference:string;
  responseType:Ql284OwnerResponseType;followupSourceSha:string;observedSourceSha:string;preparedAt:string;
  ownerIdentity:'NOT_AUTHENTICATED';responseReceipt:'NOT_VERIFIED';original:'HTTP_404_AT_IMMUTABLE_PIN';
  externallyContacted:false;delivered:false;routed:false;resolved:false;state:'LOCAL_UNVERIFIED_CLAIM'};

export function ql284PrepareOwnerResponse(followup:Ql283OwnerFollowup,reference:string,
  type:Ql284OwnerResponseType,now:Date):{ok:true;draft:Ql284OwnerResponse}|{ok:false;reason:string} {
  const prior=QL283_PUBLIC_SOURCE_RECHECK.find(row=>row.source===followup?.source);
  const current=QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source===followup?.source);
  if(!prior||!current||followup.currentSourceSha!==prior.sha||followup.original!=='HTTP_404_AT_IMMUTABLE_PIN'||
    followup.ownerContacted!==false||followup.routed!==false||followup.resolved!==false||followup.state!=='DRAFT_NOT_SENT')
    return {ok:false,reason:'A genuine unresolved QL-283 local publication owner follow-up must be selected first.'};
  const problem=caseProblem(reference);if(problem)return {ok:false,reason:problem};
  if(!QL284_OWNER_RESPONSE_CLAIM_TYPES.some(row=>row.value===type))
    return {ok:false,reason:'Select one of the supported unverified owner response claim types.'};
  if(!follows(followup.preparedAt,now)||now.getTime()<new Date(QL284_OBSERVED_AT).getTime())
    return {ok:false,reason:'Owner response claim must follow its QL-283 follow-up and the QL-284 public observation.'};
  return {ok:true,draft:{source:followup.source,followupReference:followup.reference,
    responseReference:reference.trim(),responseType:type,followupSourceSha:prior.sha,
    observedSourceSha:current.sha,preparedAt:now.toISOString(),ownerIdentity:'NOT_AUTHENTICATED',
    responseReceipt:'NOT_VERIFIED',original:'HTTP_404_AT_IMMUTABLE_PIN',externallyContacted:false,
    delivered:false,routed:false,resolved:false,state:'LOCAL_UNVERIFIED_CLAIM'}};
}

export function ql284PinnedProofUrl(source:Ql270SourceId):string {
  const row=QL284_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL284_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql284SourceRevalidation(asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[]){
  const elapsed=new Date(asOf).getTime()-new Date(QL284_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'PUBLIC_RECHECK_DUE' as const:'PINNED_RECENT' as const;
  const rows=QL284_PUBLIC_SOURCE_RECHECK.map(current=>{
    const previous=QL283_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const moved=String(previous?.sha)!==String(current.sha);
    const related=notices.filter(row=>row.source===current.source&&row.notice==='CLAIMED_NOT_CONFIRMED');
    return {...current,previousSha:previous?.sha??null,previousHttp:previous?.http??null,moved,
      reason:(moved?'SOURCE_SHA_CHANGED_ORIGINAL_404':'SOURCE_SHA_UNCHANGED_ORIGINAL_404') as
        'SOURCE_SHA_CHANGED_ORIGINAL_404'|'SOURCE_SHA_UNCHANGED_ORIGINAL_404',
      status:'ORIGINAL_PUBLICATION_EXCEPTION_OPEN' as const,originalVerified:false as const,
      authenticatedSourceGet:false as const,notices:related.length,
      postSnapshotNotices:related.filter(row=>new Date(row.preparedAt).getTime()>new Date(QL284_OBSERVED_AT).getTime()).length,
      stalePinNotices:related.filter(row=>row.sha!==current.sha).length};
  });
  return {rows,observedAt:QL284_OBSERVED_AT,previousObservedAt:QL283_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL284_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    originalsAccepted:0,authenticatedSourceGets:0,automaticPolling:false,release:'DISCONNECTED / HOLD' as const};
}

export type Ql284SourceFollowup={source:Ql270SourceId;manualCaseReference:string;reference:string;
  previousSha:string;observedSha:string;preparedAt:string;original:'HTTP_404_AT_IMMUTABLE_PIN';
  taskScheduled:false;taskExecuted:false;originalAccepted:false;state:'LOCAL_PENDING_REVALIDATION_REVIEW'};

export function ql284PrepareSourceFollowup(previous:Ql283RecheckDraft,reference:string,now:Date):
  {ok:true;draft:Ql284SourceFollowup}|{ok:false;reason:string} {
  const before=QL283_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!before||!current||previous.sourceSha!==before.sha||previous.action!=='MANUAL_PUBLIC_ORIGINAL_RECHECK'||
    previous.scheduled!==false||previous.executed!==false||previous.state!=='DRAFT_NOT_SENT')
    return {ok:false,reason:'An unexecuted QL-283 local manual recheck request is required.'};
  const problem=caseProblem(reference);if(problem)return {ok:false,reason:problem};
  if(!follows(previous.preparedAt,now)||now.getTime()<new Date(QL284_OBSERVED_AT).getTime())
    return {ok:false,reason:'Revalidation follow-up cannot predate its predecessor and actual QL-284 public snapshot.'};
  return {ok:true,draft:{source:previous.source,manualCaseReference:previous.reference,
    reference:reference.trim(),previousSha:before.sha,observedSha:current.sha,preparedAt:now.toISOString(),
    original:'HTTP_404_AT_IMMUTABLE_PIN',taskScheduled:false,taskExecuted:false,
    originalAccepted:false,state:'LOCAL_PENDING_REVALIDATION_REVIEW'}};
}

export function ql284AuditPacket(reviews:readonly Ql284ReviewerCrossCheck[],responses:readonly Ql284OwnerResponse[],
  followups:readonly Ql284SourceFollowup[],asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[]){
  return JSON.stringify({build:'QL-284',scope:'UNVERIFIED_LOCAL_REVIEW_ONLY',
    publicSourceRevalidation:ql284SourceRevalidation(asOf,notices),
    reviewerCrossCheck:{verified:0,gates:QL284_REVIEWER_CROSSCHECK_GATES,localDrafts:reviews},
    ownerResponseIntake:{authenticatedOwnerResponses:0,originalAccepted:0,localUnverifiedClaims:responses},
    sourceManualFollowups:followups,
    acknowledgementDeliveryEvidence:{...QL282_ACK_WORKSTREAM,active:false,action:'NONE'},
    integrationSecurity:{state:'DISCONNECTED / HOLD',authenticatedGETs:0,realCalls:0,sms:0,
      signerAccess:false,ownerTestApproval:false}},null,2);
}
