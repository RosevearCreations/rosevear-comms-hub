import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from './ql282IssuerPublicationReview';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';
import {QL286_OBSERVED_AT,QL286_PUBLIC_SOURCE_RECHECK,QL286_REVIEW_OUTCOMES,
  QL286_PROVENANCE_CONFLICTS,type Ql286OutcomeComparison,type Ql286ConflictFollowup,
  type Ql286AgingFollowup} from './ql286AuthorityOutcomeConflictAging';

/** Fresh public-only GitHub main SHA + exact immutable Proof-B path GET checks on 31 Oct 2026. */
export const QL287_OBSERVED_AT='2026-10-31T15:08:06Z';
export const QL287_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'067204cebebfac5c36cf3893bbdd8859e5ffb425',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'fd3089ed19f2fd081f1b583de87ada650fa50fee',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'2564268ba3dc5e3483395600169a237749b1f9eb',http:404},
  {source:'yw',repo:'yw',sha:'7e9a2029fdfdeddc89aa8c23d23b25cfb16ff415',http:404},
  {source:'icamp',repo:'iCamp',sha:'4f42e969b192fbc29f64cdd3766ee118e92e42d3',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'66a73c04342fdfd1bcbb2666c6d8dae37840ced1',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL287_DECISION_REFERENCE_TYPES=[
  {value:'CLAIMED_ISSUER_DECISION_REFERENCE',label:'Claimed issuer authority decision reference'},
  {value:'CLAIMED_REVIEWER_SIGNATURE_RECEIPT',label:'Claimed reviewer signature receipt reference'},
  {value:'CLAIMED_INDEPENDENT_WITNESS_REFERENCE',label:'Claimed independent reviewer witness reference'}
] as const;
export type Ql287DecisionReferenceType=typeof QL287_DECISION_REFERENCE_TYPES[number]['value'];
export const QL287_CUSTODIAN_DISPOSITIONS=[
  {value:'ORIGINAL_ARTIFACT_STILL_MISSING',label:'Original custodian artifact still missing'},
  {value:'CHAIN_OF_CUSTODY_UNCORROBORATED',label:'Custodian and witness chain uncorroborated'},
  {value:'SOURCE_DRIFT_REQUIRES_ORIGINAL_RECHECK',label:'New source drift requires independent original recheck'}
] as const;
export type Ql287CustodianDispositionType=typeof QL287_CUSTODIAN_DISPOSITIONS[number]['value'];

function referenceError(raw:string):string|null{
  const value=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value))
    return 'Enter a nonsecret case reference of 5–32 letters, digits, underscores or dashes.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(value))
    return 'Do not enter passwords, tokens, private keys, signer material or original raw receipts.';
  return null;
}
const after=(prior:string,now:Date)=>Number.isFinite(now.getTime())&&
  now.getTime()>new Date(prior).getTime()&&now.getTime()>=new Date(QL287_OBSERVED_AT).getTime();

export type Ql287DecisionReadback={checkId:string;previousCase:string;reference:string;
  priorOutcome:Ql286OutcomeComparison['outcome'];claimedEvidence:Ql287DecisionReferenceType;
  preparedAt:string;independentDecision:'NOT_RECEIVED';originalSignature:'NOT_VERIFIED';
  issuer:'NOT_AUTHENTICATED';reviewer:'NOT_AUTHENTICATED';ownerApproval:'NOT_GIVEN';
  corroborated:false;accepted:false;disposition:'REFERENCE_READBACK_ONLY';
  state:'LOCAL_UNATTESTED_DECISION_REVIEW'};

export function ql287PrepareDecisionReadback(previous:Ql286OutcomeComparison,reference:string,
  claimedEvidence:Ql287DecisionReferenceType,now:Date):{ok:true;draft:Ql287DecisionReadback}|{ok:false;reason:string}{
  if(!previous||!QL286_REVIEW_OUTCOMES.some(row=>row.value===previous.outcome)||
    previous.unmetGates!==7||previous.newVerifiedGates!==0||previous.independentlyReviewed!==false||
    previous.issuer!=='NOT_AUTHENTICATED'||previous.reviewer!=='NOT_AUTHENTICATED'||
    previous.signature!=='NOT_VERIFIED'||previous.challenge!=='NOT_ISSUED'||
    previous.ownerApproval!=='NOT_GIVEN'||previous.disposition!=='LOCAL_OUTCOME_COMPARISON_ONLY'||
    previous.state!=='AUTHORITY_REVIEW_STILL_OPEN')
    return {ok:false,reason:'An intact unresolved QL-286 reviewer outcome comparison must precede evidence readback.'};
  const issue=referenceError(reference);if(issue)return {ok:false,reason:issue};
  if(!QL287_DECISION_REFERENCE_TYPES.some(row=>row.value===claimedEvidence))
    return {ok:false,reason:'Choose a supported unverified decision reference category.'};
  if(!after(previous.preparedAt,now)||new Date(previous.preparedAt).getTime()<new Date(QL286_OBSERVED_AT).getTime())
    return {ok:false,reason:'Evidence readback must follow its QL-286 local outcome and actual QL-287 recheck.'};
  return {ok:true,draft:{checkId:previous.checkId,previousCase:previous.reference,
    reference:reference.trim(),priorOutcome:previous.outcome,claimedEvidence,preparedAt:now.toISOString(),
    independentDecision:'NOT_RECEIVED',originalSignature:'NOT_VERIFIED',issuer:'NOT_AUTHENTICATED',
    reviewer:'NOT_AUTHENTICATED',ownerApproval:'NOT_GIVEN',corroborated:false,accepted:false,
    disposition:'REFERENCE_READBACK_ONLY',state:'LOCAL_UNATTESTED_DECISION_REVIEW'}};
}

export type Ql287CustodianQueue={source:Ql270SourceId;previousCase:string;reference:string;
  priorConflict:Ql286ConflictFollowup['conflict'];queueReason:Ql287CustodianDispositionType;
  previousSha:string;latestSha:string;preparedAt:string;
  original:'HTTP_404_AT_IMMUTABLE_PIN';custodian:'NOT_AUTHENTICATED';
  originalReceipt:'NOT_VERIFIED';queuedExternally:false;delivered:false;resolved:false;
  disposition:'CUSTODIAN_CONFLICT_OPEN';state:'LOCAL_UNSENT_DISPOSITION_QUEUE'};

export function ql287PrepareCustodianQueue(previous:Ql286ConflictFollowup,reference:string,
  queueReason:Ql287CustodianDispositionType,now:Date):{ok:true;draft:Ql287CustodianQueue}|{ok:false;reason:string}{
  const prior=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!prior||!current||previous.latestSha!==prior.sha||previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||
    !QL286_PROVENANCE_CONFLICTS.some(row=>row.value===previous.conflict)||
    previous.ownerIdentity!=='NOT_AUTHENTICATED'||previous.originalReceipt!=='NOT_VERIFIED'||
    previous.routed!==false||previous.resolved!==false||previous.sourceVerified!==false||
    previous.disposition!=='PROVENANCE_CONFLICT_OPEN'||previous.state!=='LOCAL_QUARANTINED_FOLLOWUP')
    return {ok:false,reason:'Only an intact unresolved QL-286 local provenance conflict may enter custodian disposition review.'};
  const issue=referenceError(reference);if(issue)return {ok:false,reason:issue};
  if(!QL287_CUSTODIAN_DISPOSITIONS.some(row=>row.value===queueReason))
    return {ok:false,reason:'Choose a supported local custodian conflict reason.'};
  if(queueReason==='SOURCE_DRIFT_REQUIRES_ORIGINAL_RECHECK'&&String(prior.sha)===String(current.sha))
    return {ok:false,reason:'This source pin has not moved; choose the missing-original or custody-chain reason.'};
  if(!after(previous.preparedAt,now)||new Date(previous.preparedAt).getTime()<new Date(QL286_OBSERVED_AT).getTime())
    return {ok:false,reason:'Custodian queue review must follow the unresolved conflict and observed source recheck.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,
    reference:reference.trim(),priorConflict:previous.conflict,queueReason,previousSha:prior.sha,
    latestSha:current.sha,preparedAt:now.toISOString(),original:'HTTP_404_AT_IMMUTABLE_PIN',
    custodian:'NOT_AUTHENTICATED',originalReceipt:'NOT_VERIFIED',queuedExternally:false,
    delivered:false,resolved:false,disposition:'CUSTODIAN_CONFLICT_OPEN',state:'LOCAL_UNSENT_DISPOSITION_QUEUE'}};
}

export function ql287PinnedProofUrl(source:Ql270SourceId):string{
  const row=QL287_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL287_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql287SourceDrift(asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[],
  priorFollowups:readonly Ql286AgingFollowup[]=[]){
  const elapsed=new Date(asOf).getTime()-new Date(QL287_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'RECHECK_DUE' as const:'FRESH_PINNED_RECHECK' as const;
  const rows=QL287_PUBLIC_SOURCE_RECHECK.map(current=>{
    const previous=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const claims=notices.filter(row=>row.source===current.source&&row.notice==='CLAIMED_NOT_CONFIRMED');
    const linked=priorFollowups.filter(row=>row.source===current.source&&row.currentSha===previous?.sha&&
      row.scheduled===false&&row.executed===false&&row.originalAccepted===false&&
      row.state==='LOCAL_SOURCE_EXCEPTION_AGING_RECHECK_PENDING');
    return {...current,previousSha:previous?.sha??null,moved:String(previous?.sha)!==String(current.sha),
      disposition:'PUBLICATION_EXCEPTION_OPEN' as const,sourceOriginal:'HTTP_404_AT_IMMUTABLE_PIN' as const,
      claims:claims.length,postSnapshotClaims:claims.filter(row=>new Date(row.preparedAt).getTime()>new Date(QL287_OBSERVED_AT).getTime()).length,
      stalePinClaims:claims.filter(row=>row.sha!==current.sha).length,
      localRecheckDrafts:linked.length,acceptedOriginal:false as const,authenticatedGatewayGET:false as const};
  });
  return {rows,observedAt:QL287_OBSERVED_AT,previousObservedAt:QL286_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL287_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    verifiedOriginals:0,authenticatedGatewayGETs:0,automaticPolling:false,release:'DISCONNECTED / HOLD' as const};
}

export type Ql287DriftFollowup={source:Ql270SourceId;previousCase:string;reference:string;
  priorSha:string;currentSha:string;sourceMoved:boolean;preparedAt:string;
  original:'HTTP_404_AT_IMMUTABLE_PIN';scheduled:false;executed:false;originalAccepted:false;
  state:'LOCAL_SOURCE_REFRESH_FOLLOWUP_PENDING'};

export function ql287PrepareDriftFollowup(previous:Ql286AgingFollowup,reference:string,now:Date):
  {ok:true;draft:Ql287DriftFollowup}|{ok:false;reason:string}{
  const prior=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!prior||!current||previous.currentSha!==prior.sha||previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||
    previous.scheduled!==false||previous.executed!==false||previous.originalAccepted!==false||
    previous.state!=='LOCAL_SOURCE_EXCEPTION_AGING_RECHECK_PENDING')
    return {ok:false,reason:'A QL-286 unexecuted and unaccepted aging follow-up is required.'};
  const issue=referenceError(reference);if(issue)return {ok:false,reason:issue};
  if(!after(previous.preparedAt,now)||new Date(previous.preparedAt).getTime()<new Date(QL286_OBSERVED_AT).getTime())
    return {ok:false,reason:'Refresh follow-up must follow the QL-286 local item and actual public recheck.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,
    reference:reference.trim(),priorSha:prior.sha,currentSha:current.sha,sourceMoved:String(prior.sha)!==String(current.sha),
    preparedAt:now.toISOString(),original:'HTTP_404_AT_IMMUTABLE_PIN',scheduled:false,executed:false,
    originalAccepted:false,state:'LOCAL_SOURCE_REFRESH_FOLLOWUP_PENDING'}};
}

export function ql287AuditPacket(decisions:readonly Ql287DecisionReadback[],custody:readonly Ql287CustodianQueue[],
  followups:readonly Ql287DriftFollowup[],asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[],
  previous:readonly Ql286AgingFollowup[]=[]){
  return JSON.stringify({build:'QL-287',mode:'LOCAL_UNVERIFIED_REFERENCE_READBACK_ONLY',
    reviewerDecision:{accepted:0,independentlyAuthenticated:0,readbacks:decisions},
    originalCustodian:{verifiedReceipts:0,externalQueueDeliveries:0,dispositionQueue:custody},
    sourceRefresh:ql287SourceDrift(asOf,notices,previous),localManualFollowups:followups,
    ackDeliveryEvidence:{...QL282_ACK_WORKSTREAM,active:false,action:'NONE'},
    integrationSecurity:{state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false}},null,2);
}
