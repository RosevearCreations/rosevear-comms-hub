import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from './ql282IssuerPublicationReview';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import {QL284_PUBLIC_SOURCE_RECHECK} from './ql284ReviewerCrosscheckOwnerResponse';
import {QL285_AUTHORITY_CHALLENGE_GATES,QL285_OBSERVED_AT,QL285_PUBLIC_SOURCE_RECHECK,
  QL285_PROVENANCE_CLAIM_TYPES,type Ql285AuthorityAudit,type Ql285ProvenanceReview,type Ql285DeltaWorkItem}
  from './ql285IssuerAuthorityProvenanceDelta';

/** Public GitHub main refs and immutable-path GET results observed at 10:28 Eastern, 31 October 2026. */
export const QL286_OBSERVED_AT='2026-10-31T14:28:28Z';
export const QL286_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'61b5ee0a479345089df5ddc3043b6b7c2243eb65',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'ee86e795c5b47a4890d002d8027d8de2d54c2a3e',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'2675049179f5c43e8342880579e3ccc04d144a5b',http:404},
  {source:'yw',repo:'yw',sha:'5027fcb6579f09c521bfdae1095efe39d98ffe64',http:404},
  {source:'icamp',repo:'iCamp',sha:'2e66d00e3aefdaaa68118c2f5abead4e49aacb02',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'fd04c17eecb50189745945d57ea44626c52eaa54',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL286_REVIEW_OUTCOMES=[
  {value:'AUTHORITY_CHAIN_UNCORROBORATED',label:'Issuer authority chain uncorroborated'},
  {value:'CHALLENGE_RETURN_NOT_RECEIVED',label:'Original reviewer challenge return not received'},
  {value:'REVIEWER_SCOPE_UNCONFIRMED',label:'Independent reviewer scope not confirmed'}
] as const;
export type Ql286ReviewOutcome=typeof QL286_REVIEW_OUTCOMES[number]['value'];
export const QL286_PROVENANCE_CONFLICTS=[
  {value:'SOURCE_PIN_CHANGED',label:'Source pin changed; claimed origin not revalidated'},
  {value:'ORIGINAL_CUSTODY_RECEIPT_MISSING',label:'Original custody receipt missing'},
  {value:'OWNER_WITNESS_CHAIN_UNCORROBORATED',label:'Owner–witness provenance chain uncorroborated'}
] as const;
export type Ql286ProvenanceConflictType=typeof QL286_PROVENANCE_CONFLICTS[number]['value'];

function nonsecretReference(value:string):string|null {
  const raw=value.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(raw))
    return 'Use a nonsecret case reference of 5–32 letters, digits, underscores or dashes.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(raw))
    return 'Never enter tokens, passwords, signer material or private challenge secrets.';
  return null;
}
const after=(prior:string,now:Date)=>Number.isFinite(now.getTime())&&now.getTime()>new Date(prior).getTime()&&
  now.getTime()>=new Date(QL286_OBSERVED_AT).getTime();
const intactAuthority=(row:Ql285AuthorityAudit)=>Boolean(row&&row.verified===0&&
  row.issuer==='NOT_AUTHENTICATED'&&row.reviewer==='NOT_AUTHENTICATED'&&row.challenge==='NOT_ISSUED'&&
  row.signature==='NOT_VERIFIED'&&row.ownerApproval==='NOT_GIVEN'&&
  row.disposition==='AUTHORITY_CHALLENGE_PRECONDITIONS_ONLY'&&row.state==='LOCAL_UNVERIFIED_AUDIT'&&
  JSON.stringify(row.gates)===JSON.stringify(QL285_AUTHORITY_CHALLENGE_GATES)&&
  typeof row.authorityCase==='string'&&typeof row.crosscheckReference==='string');

export type Ql286OutcomeComparison={checkId:string;previousCase:string;reference:string;
  outcome:Ql286ReviewOutcome;preparedAt:string;unmetGates:number;newVerifiedGates:0;
  issuer:'NOT_AUTHENTICATED';reviewer:'NOT_AUTHENTICATED';signature:'NOT_VERIFIED';
  challenge:'NOT_ISSUED';ownerApproval:'NOT_GIVEN';independentlyReviewed:false;
  disposition:'LOCAL_OUTCOME_COMPARISON_ONLY';state:'AUTHORITY_REVIEW_STILL_OPEN'};

export function ql286CompareAuthorityOutcome(previous:Ql285AuthorityAudit,reference:string,
  outcome:Ql286ReviewOutcome,now:Date):{ok:true;draft:Ql286OutcomeComparison}|{ok:false;reason:string} {
  if(!intactAuthority(previous))return {ok:false,reason:'An intact unverified QL-285 authority challenge audit is required.'};
  const issue=nonsecretReference(reference);if(issue)return {ok:false,reason:issue};
  if(!QL286_REVIEW_OUTCOMES.some(row=>row.value===outcome))
    return {ok:false,reason:'Choose a supported pending review comparison category.'};
  if(new Date(previous.preparedAt).getTime()<new Date(QL285_OBSERVED_AT).getTime())
    return {ok:false,reason:'QL-285 authority audit predates the observed public baseline.'};
  if(!after(previous.preparedAt,now))return {ok:false,reason:'Comparison must follow the authority audit and actual QL-286 public recheck.'};
  return {ok:true,draft:{checkId:previous.checkId,previousCase:previous.authorityCase,
    reference:reference.trim(),outcome,preparedAt:now.toISOString(),
    unmetGates:QL285_AUTHORITY_CHALLENGE_GATES.length,newVerifiedGates:0,
    issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',signature:'NOT_VERIFIED',
    challenge:'NOT_ISSUED',ownerApproval:'NOT_GIVEN',independentlyReviewed:false,
    disposition:'LOCAL_OUTCOME_COMPARISON_ONLY',state:'AUTHORITY_REVIEW_STILL_OPEN'}};
}

export type Ql286ConflictFollowup={source:Ql270SourceId;previousCase:string;reference:string;
  conflict:Ql286ProvenanceConflictType;priorSha:string;latestSha:string;preparedAt:string;
  original:'HTTP_404_AT_IMMUTABLE_PIN';ownerIdentity:'NOT_AUTHENTICATED';
  originalReceipt:'NOT_VERIFIED';routed:false;resolved:false;sourceVerified:false;
  disposition:'PROVENANCE_CONFLICT_OPEN';state:'LOCAL_QUARANTINED_FOLLOWUP'};

export function ql286PrepareConflictFollowup(previous:Ql285ProvenanceReview,reference:string,
  conflict:Ql286ProvenanceConflictType,now:Date):{ok:true;draft:Ql286ConflictFollowup}|{ok:false;reason:string} {
  const before=QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const older=QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!before||!current||!older||previous.latestSha!==before.sha||previous.priorSha!==older.sha||
    !QL285_PROVENANCE_CLAIM_TYPES.some(row=>row.value===previous.provenanceType)||
    previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||
    previous.ownerIdentity!=='NOT_AUTHENTICATED'||previous.originalReceipt!=='NOT_VERIFIED'||
    previous.provenance!=='UNAVAILABLE_FOR_INDEPENDENT_RECONCILIATION'||
    previous.routed!==false||previous.resolved!==false||previous.disposition!=='QUARANTINED_REFERENCE_CLAIM'||
    previous.state!=='LOCAL_UNVERIFIED_REVIEW')
    return {ok:false,reason:'Only a quarantined unresolved QL-285 provenance claim can enter conflict follow-up.'};
  const issue=nonsecretReference(reference);if(issue)return {ok:false,reason:issue};
  if(!QL286_PROVENANCE_CONFLICTS.some(row=>row.value===conflict))
    return {ok:false,reason:'Choose a supported original Proof-B provenance conflict category.'};
  if(conflict==='SOURCE_PIN_CHANGED'&&before.sha===current.sha)
    return {ok:false,reason:'This source SHA did not move since QL-285; choose the missing-receipt or custody-chain category.'};
  if(!after(previous.preparedAt,now))return {ok:false,reason:'Conflict follow-up must follow its local predecessor and public recheck.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,reference:reference.trim(),
    conflict,priorSha:before.sha,latestSha:current.sha,preparedAt:now.toISOString(),
    original:'HTTP_404_AT_IMMUTABLE_PIN',ownerIdentity:'NOT_AUTHENTICATED',originalReceipt:'NOT_VERIFIED',
    routed:false,resolved:false,sourceVerified:false,disposition:'PROVENANCE_CONFLICT_OPEN',
    state:'LOCAL_QUARANTINED_FOLLOWUP'}};
}

export function ql286PinnedProofUrl(source:Ql270SourceId):string {
  const row=QL286_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL286_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql286ExceptionAging(asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[],
  previousItems:readonly Ql285DeltaWorkItem[]=[]){
  const elapsed=new Date(asOf).getTime()-new Date(QL286_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'RECHECK_DUE' as const:'CURRENT_PINNED_SNAPSHOT' as const;
  const rows=QL286_PUBLIC_SOURCE_RECHECK.map(current=>{
    const previous=QL285_PUBLIC_SOURCE_RECHECK.find(item=>item.source===current.source);
    const moved=current.sha!==previous?.sha;
    const related=notices.filter(row=>row.source===current.source&&row.notice==='CLAIMED_NOT_CONFIRMED');
    const linked=previousItems.filter(row=>row.source===current.source&&
      row.observedSha===previous?.sha&&
      row.originalAccepted===false&&row.reviewExecuted===false&&row.reviewScheduled===false&&
      row.state==='LOCAL_PENDING_PUBLICATION_DELTA_REVIEW');
    return {...current,previousSha:previous?.sha??null,moved,
      exception:'ORIGINAL_PROOF_B_HTTP_404' as const,disposition:'PUBLICATION_EXCEPTION_OPEN' as const,
      priorSnapshotAt:QL285_OBSERVED_AT,ageHours,
      bucket:ageHours===null?'CLOCK_REVIEW' as const:ageHours>=72?'OVER_72_HOURS' as const:
        ageHours>=24?'OVER_24_HOURS' as const:'UNDER_24_HOURS' as const,
      notices:related.length,postSnapshotNotices:related.filter(row=>new Date(row.preparedAt).getTime()>new Date(QL286_OBSERVED_AT).getTime()).length,
      stalePinNotices:related.filter(row=>row.sha!==current.sha).length,
      linkedManualItems:linked.length,originalVerified:false as const,automaticGET:false as const};
  });
  return {rows,observedAt:QL286_OBSERVED_AT,priorObservedAt:QL285_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL286_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    originalsAccepted:0,authenticatedSourceGets:0,automaticPolling:false,
    release:'DISCONNECTED / HOLD' as const};
}

export type Ql286AgingFollowup={source:Ql270SourceId;previousCase:string;reference:string;
  priorSha:string;currentSha:string;preparedAt:string;sourceChanged:boolean;
  original:'HTTP_404_AT_IMMUTABLE_PIN';scheduled:false;executed:false;originalAccepted:false;
  state:'LOCAL_SOURCE_EXCEPTION_AGING_RECHECK_PENDING'};

export function ql286PrepareAgingFollowup(previous:Ql285DeltaWorkItem,reference:string,now:Date):
  {ok:true;draft:Ql286AgingFollowup}|{ok:false;reason:string} {
  const before=QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const older=QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!before||!current||!older||previous.observedSha!==before.sha||previous.priorSha!==older.sha||
    previous.sourceChanged!==(older.sha!==before.sha)||previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||
    previous.reviewScheduled!==false||previous.reviewExecuted!==false||previous.originalAccepted!==false||
    previous.state!=='LOCAL_PENDING_PUBLICATION_DELTA_REVIEW')
    return {ok:false,reason:'Only an unscheduled, unexecuted QL-285 source delta item can enter aging follow-up.'};
  const issue=nonsecretReference(reference);if(issue)return {ok:false,reason:issue};
  if(!after(previous.preparedAt,now))return {ok:false,reason:'Aging follow-up must follow its source delta and public recheck.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,reference:reference.trim(),
    priorSha:before.sha,currentSha:current.sha,sourceChanged:before.sha!==current.sha,preparedAt:now.toISOString(),
    original:'HTTP_404_AT_IMMUTABLE_PIN',scheduled:false,executed:false,originalAccepted:false,
    state:'LOCAL_SOURCE_EXCEPTION_AGING_RECHECK_PENDING'}};
}

export function ql286AuditPacket(outcomes:readonly Ql286OutcomeComparison[],conflicts:readonly Ql286ConflictFollowup[],
  agingItems:readonly Ql286AgingFollowup[],asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[],
  previousItems:readonly Ql285DeltaWorkItem[]=[]){
  return JSON.stringify({build:'QL-286',mode:'LOCAL_UNVERIFIED_REVIEW_ONLY',
    authorityOutcome:{verified:0,issuedChallenges:0,independentReviews:0,comparisons:outcomes},
    proofBProvenance:{originalsVerified:0,ownerAuthenticated:0,conflicts},
    sourceExceptionAging:ql286ExceptionAging(asOf,notices,previousItems),localAgingFollowups:agingItems,
    ackDeliveryEvidence:{...QL282_ACK_WORKSTREAM,active:false,action:'NONE'},
    integrationSecurity:{state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false}},null,2);
}
