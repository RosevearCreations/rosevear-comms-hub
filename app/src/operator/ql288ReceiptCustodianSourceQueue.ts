import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from './ql282IssuerPublicationReview';
import {QL287_OBSERVED_AT,QL287_PUBLIC_SOURCE_RECHECK,type Ql287DecisionReadback,
  QL287_DECISION_REFERENCE_TYPES,QL287_CUSTODIAN_DISPOSITIONS,
  type Ql287CustodianQueue,type Ql287DriftFollowup} from './ql287DecisionCustodianDrift';
import {QL286_PUBLIC_SOURCE_RECHECK,QL286_REVIEW_OUTCOMES} from './ql286AuthorityOutcomeConflictAging';

/** Public-only GitHub main refs and immutable QL-246 Proof-B path reads, 31 Oct 2026. */
export const QL288_OBSERVED_AT='2026-10-31T16:10:03Z';
export const QL288_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'185811ea69bd99efda68d07e0a06105c3dbaf1a2',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'4ff414855b03db98c81131f297c8ba6f6498b6bd',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'93868e9908151ceacb6c97c21c398df3397a68c2',http:404},
  {source:'yw',repo:'yw',sha:'7e9a2029fdfdeddc89aa8c23d23b25cfb16ff415',http:404},
  {source:'icamp',repo:'iCamp',sha:'3519677806a6fe71e9b5073bfb93a2772dab0220',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'6847daaccc003eee4eed9c44e162c5bb43b9b8cf',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL288_REVIEWER_GAPS=[
  {value:'INDEPENDENT_REVIEWER_RECEIPT_ABSENT',label:'Independent reviewer receipt absent'},
  {value:'ISSUER_SIGNATURE_ORIGIN_UNCORROBORATED',label:'Issuer signature origin uncorroborated'},
  {value:'AUTHORITY_CHALLENGE_NOT_ISSUED',label:'Authority challenge not issued'}
] as const;
export type Ql288ReviewerGap=typeof QL288_REVIEWER_GAPS[number]['value'];
export const QL288_CUSTODIAN_PREFLIGHT_GAPS=[
  {value:'ORIGINAL_SIGNED_ARTIFACT_ABSENT',label:'Original signed Proof-B artifact absent'},
  {value:'CUSTODIAN_WITNESS_CHAIN_UNCORROBORATED',label:'Custodian-witness chain uncorroborated'},
  {value:'RESOLUTION_AUTHORITY_NOT_VERIFIED',label:'Resolution authority not independently verified'}
] as const;
export type Ql288CustodianGap=typeof QL288_CUSTODIAN_PREFLIGHT_GAPS[number]['value'];

function referenceIssue(raw:string):string|null{
  const value=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value))
    return 'Use only a nonsecret 5–32 character case reference (letters, digits, _ or -).';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(value))
    return 'Never enter credentials, private signer material, raw receipts or personal information.';
  return null;
}
function laterThan(previous:string,now:Date):boolean{
  const t=now.getTime(),prior=new Date(previous).getTime();
  return Number.isFinite(t)&&Number.isFinite(prior)&&prior>=new Date(QL287_OBSERVED_AT).getTime()&&
    t>prior&&t>=new Date(QL288_OBSERVED_AT).getTime();
}

export type Ql288ReviewerIndependenceAudit={checkId:string;previousCase:string;
  reviewerReceiptReference:string;issuerAuthorityReference:string;gap:Ql288ReviewerGap;preparedAt:string;
  reviewerReceipt:'NOT_RECEIVED';issuerAuthority:'NOT_AUTHENTICATED';signature:'NOT_VERIFIED';
  challenge:'NOT_ISSUED';independentIdentity:'NOT_ESTABLISHED';originalAccepted:false;
  decisionAccepted:false;ownerApproval:'NOT_GIVEN';externalReviewExecuted:false;
  state:'LOCAL_INDEPENDENCE_GAP_AUDIT_ONLY'};

export function ql288PrepareReviewerIndependence(previous:Ql287DecisionReadback,
  reviewerRef:string,issuerRef:string,gap:Ql288ReviewerGap,now:Date):
  {ok:true;draft:Ql288ReviewerIndependenceAudit}|{ok:false;reason:string}{
  if(!previous||previous.independentDecision!=='NOT_RECEIVED'||
    !QL287_DECISION_REFERENCE_TYPES.some(row=>row.value===previous.claimedEvidence)||
    !QL286_REVIEW_OUTCOMES.some(row=>row.value===previous.priorOutcome)||
    previous.originalSignature!=='NOT_VERIFIED'||previous.issuer!=='NOT_AUTHENTICATED'||
    previous.reviewer!=='NOT_AUTHENTICATED'||previous.ownerApproval!=='NOT_GIVEN'||
    previous.corroborated!==false||previous.accepted!==false||
    previous.disposition!=='REFERENCE_READBACK_ONLY'||previous.state!=='LOCAL_UNATTESTED_DECISION_REVIEW')
    return {ok:false,reason:'An intact, unattested QL-287 decision readback is required.'};
  const issue=referenceIssue(reviewerRef)||referenceIssue(issuerRef);if(issue)return {ok:false,reason:issue};
  const distinct=new Set([reviewerRef.trim().toLowerCase(),issuerRef.trim().toLowerCase(),
    previous.reference.toLowerCase(),previous.previousCase.toLowerCase()]);
  if(distinct.size!==4)return {ok:false,reason:'Reviewer and issuer references must be distinct from each other and from predecessor cases; distinct references do not prove independent identity.'};
  if(!QL288_REVIEWER_GAPS.some(item=>item.value===gap))
    return {ok:false,reason:'Choose a supported unverified reviewer independence gap.'};
  if(!laterThan(previous.preparedAt,now))
    return {ok:false,reason:'The audit must follow the QL-287 decision readback and observed QL-288 recheck.'};
  return {ok:true,draft:{checkId:previous.checkId,previousCase:previous.reference,
    reviewerReceiptReference:reviewerRef.trim(),issuerAuthorityReference:issuerRef.trim(),gap,
    preparedAt:now.toISOString(),reviewerReceipt:'NOT_RECEIVED',issuerAuthority:'NOT_AUTHENTICATED',
    signature:'NOT_VERIFIED',challenge:'NOT_ISSUED',independentIdentity:'NOT_ESTABLISHED',
    originalAccepted:false,decisionAccepted:false,ownerApproval:'NOT_GIVEN',
    externalReviewExecuted:false,state:'LOCAL_INDEPENDENCE_GAP_AUDIT_ONLY'}};
}

export type Ql288CustodianResolutionPreflight={source:Ql270SourceId;previousCase:string;
  reference:string;gap:Ql288CustodianGap;priorSha:string;currentSha:string;preparedAt:string;
  original:'HTTP_404_AT_IMMUTABLE_PIN';custodian:'NOT_AUTHENTICATED';
  witness:'NOT_AUTHENTICATED';originalSignature:'NOT_VERIFIED';
  resolutionReceipt:'NOT_RECEIVED';originalAccepted:false;resolved:false;
  deliveryExecuted:false;state:'LOCAL_ORIGINAL_RESOLUTION_PREFLIGHT_OPEN'};

export function ql288PrepareCustodianResolution(previous:Ql287CustodianQueue,
  reference:string,gap:Ql288CustodianGap,now:Date):
  {ok:true;draft:Ql288CustodianResolutionPreflight}|{ok:false;reason:string}{
  const prior=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const ancestor=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!prior||!current||!ancestor||previous.previousSha!==ancestor.sha||
    !QL287_CUSTODIAN_DISPOSITIONS.some(row=>row.value===previous.queueReason)||
    previous.latestSha!==prior.sha||
    previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||previous.custodian!=='NOT_AUTHENTICATED'||
    previous.originalReceipt!=='NOT_VERIFIED'||previous.queuedExternally!==false||
    previous.delivered!==false||previous.resolved!==false||
    previous.disposition!=='CUSTODIAN_CONFLICT_OPEN'||previous.state!=='LOCAL_UNSENT_DISPOSITION_QUEUE')
    return {ok:false,reason:'A genuine unresolved, unsent QL-287 custodian conflict is required.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  if(reference.trim().toLowerCase()===previous.reference.toLowerCase())
    return {ok:false,reason:'Use a new preflight case reference, not the prior conflict reference.'};
  if(!QL288_CUSTODIAN_PREFLIGHT_GAPS.some(item=>item.value===gap))
    return {ok:false,reason:'Choose an unresolved original custody preflight gap.'};
  if(!laterThan(previous.preparedAt,now))
    return {ok:false,reason:'Preflight must follow the QL-287 local queue and QL-288 public recheck.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,
    reference:reference.trim(),gap,priorSha:prior.sha,currentSha:current.sha,
    preparedAt:now.toISOString(),original:'HTTP_404_AT_IMMUTABLE_PIN',
    custodian:'NOT_AUTHENTICATED',witness:'NOT_AUTHENTICATED',originalSignature:'NOT_VERIFIED',
    resolutionReceipt:'NOT_RECEIVED',originalAccepted:false,resolved:false,
    deliveryExecuted:false,state:'LOCAL_ORIGINAL_RESOLUTION_PREFLIGHT_OPEN'}};
}

export function ql288PinnedProofUrl(source:Ql270SourceId):string{
  const row=QL288_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL288_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql288ImmutableExceptions(asOf:Date|string,
  priorFollowups:readonly Ql287DriftFollowup[]=[]){
  const delta=new Date(asOf).getTime()-new Date(QL288_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(delta)&&delta>=0?Math.floor(delta/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'RECHECK_DUE' as const:
    'FRESH_PUBLIC_RECHECK' as const;
  const rows=QL288_PUBLIC_SOURCE_RECHECK.map(current=>{
    const prior=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const moved=String(prior?.sha)!==String(current.sha);
    const linked=priorFollowups.filter(row=>row.source===current.source&&row.currentSha===prior?.sha&&
      !row.scheduled&&!row.executed&&!row.originalAccepted&&row.state==='LOCAL_SOURCE_REFRESH_FOLLOWUP_PENDING');
    return {...current,priorSha:prior?.sha??null,moved,linkedDrafts:linked.length,
      reason:moved?'PIN_CHANGED_ORIGINAL_MISSING' as const:'PIN_STABLE_ORIGINAL_MISSING' as const,
      exception:'PUBLICATION_EXCEPTION_OPEN' as const,originalAccepted:false as const,
      independentOriginVerified:false as const,authenticatedGatewayGET:false as const};
  });
  return {rows,observedAt:QL288_OBSERVED_AT,previousObservedAt:QL287_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL288_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    acceptedOriginals:0,authenticatedGatewayGETs:0,automaticPolling:false,
    integrationState:'DISCONNECTED / HOLD' as const};
}

export type Ql288ImmutableExceptionQueue={source:Ql270SourceId;previousCase:string;
  reference:string;previousSha:string;currentSha:string;pinMoved:boolean;preparedAt:string;
  original:'HTTP_404_AT_IMMUTABLE_PIN';ownerSignoff:'NOT_GIVEN';
  independentGET:'NOT_EXECUTED';scheduled:false;sent:false;executed:false;originalAccepted:false;
  state:'LOCAL_UNSENT_IMMUTABLE_RECHECK_QUEUE'};

export function ql288PrepareImmutableQueue(previous:Ql287DriftFollowup,reference:string,now:Date):
  {ok:true;draft:Ql288ImmutableExceptionQueue}|{ok:false;reason:string}{
  const prior=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const ancestor=QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!prior||!current||!ancestor||previous.priorSha!==ancestor.sha||
    previous.sourceMoved!==(String(ancestor.sha)!==String(prior.sha))||
    previous.currentSha!==prior.sha||
    previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||previous.scheduled!==false||
    previous.executed!==false||previous.originalAccepted!==false||
    previous.state!=='LOCAL_SOURCE_REFRESH_FOLLOWUP_PENDING')
    return {ok:false,reason:'A QL-287 unexecuted source drift draft is required.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  if(reference.trim().toLowerCase()===previous.reference.toLowerCase())
    return {ok:false,reason:'Create a distinct QL-288 local queue reference.'};
  if(!laterThan(previous.preparedAt,now))
    return {ok:false,reason:'Queue review must follow the QL-287 local follow-up and the public QL-288 snapshot.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,reference:reference.trim(),
    previousSha:prior.sha,currentSha:current.sha,pinMoved:String(prior.sha)!==String(current.sha),
    preparedAt:now.toISOString(),original:'HTTP_404_AT_IMMUTABLE_PIN',ownerSignoff:'NOT_GIVEN',
    independentGET:'NOT_EXECUTED',scheduled:false,sent:false,executed:false,originalAccepted:false,
    state:'LOCAL_UNSENT_IMMUTABLE_RECHECK_QUEUE'}};
}

export function ql288AuditPacket(review:readonly Ql288ReviewerIndependenceAudit[],
  custody:readonly Ql288CustodianResolutionPreflight[],
  rechecks:readonly Ql288ImmutableExceptionQueue[],asOf:Date|string,
  previous:readonly Ql287DriftFollowup[]=[]){
  return JSON.stringify({build:'QL-288',mode:'READ_ONLY_LOCAL_PRECONDITIONS_NO_EXTERNAL_APPROVAL',
    reviewerIndependence:{authenticatedReceipts:0,independentDecisions:0,review},
    originalCustodian:{verifiedResolutions:0,deliveredReceipts:0,preflight:custody},
    publicImmutableException:ql288ImmutableExceptions(asOf,previous),unsentRecheckQueue:rechecks,
    ackDeliveryEvidence:{...QL282_ACK_WORKSTREAM,active:false,action:'NONE'},
    integrationSecurity:{state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false}},null,2);
}
