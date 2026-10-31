import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from './ql282IssuerPublicationReview';
import {QL287_PUBLIC_SOURCE_RECHECK} from './ql287DecisionCustodianDrift';
import {QL288_OBSERVED_AT,QL288_PUBLIC_SOURCE_RECHECK,QL288_REVIEWER_GAPS,
  QL288_CUSTODIAN_PREFLIGHT_GAPS,type Ql288ReviewerIndependenceAudit,
  type Ql288CustodianResolutionPreflight,type Ql288ImmutableExceptionQueue} from './ql288ReceiptCustodianSourceQueue';

/** Fresh public-only GitHub main and exact immutable source Proof-B path checks. */
export const QL289_OBSERVED_AT='2026-10-31T16:48:10Z';
export const QL289_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'8c475583f5d84f8dbb47aa295b0f034e4b7b41c1',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'bf98beea75f0caa8aeb872c2646dcaa6661d7a23',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'e015a719e0ef37d9ecb448a2a70145a7baf0f4d8',http:404},
  {source:'yw',repo:'yw',sha:'7c00eb311b6f9f825dde5c0171aeed932079b086',http:404},
  {source:'icamp',repo:'iCamp',sha:'f28c89dbb0265cb222b8a853ae624bdb9858ca67',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'f2f22f929ed099afbf4d9e56a7e3145c011ab9fc',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL289_REVIEWER_CHALLENGE_GATES=[
  {id:'REVIEWER_IDENTITY',label:'Independent reviewer identity',status:'NOT_AUTHENTICATED'},
  {id:'ISSUER_AUTHORITY',label:'Original issuer trust authority',status:'NOT_AUTHENTICATED'},
  {id:'SIGNED_RECEIPT',label:'Original signed decision receipt',status:'NOT_RECEIVED'},
  {id:'CHALLENGE_NONCE',label:'Reviewer signature challenge nonce',status:'NOT_ISSUED'},
  {id:'SOURCE_ORIGIN',label:'Original receipt source provenance',status:'NOT_CORROBORATED'},
  {id:'INDEPENDENT_WITNESS',label:'Independent witness and chain',status:'NOT_AUTHENTICATED'},
  {id:'OWNER_TEST_APPROVAL',label:'Owner TEST authorization',status:'NOT_GIVEN'}
] as const;
export const QL289_REVIEWER_CHALLENGE_FOCUS=[
  {value:'REVIEWER_RECEIPT_SOURCE_UNCORROBORATED',label:'Reviewer receipt source uncorroborated'},
  {value:'ISSUER_PIN_AND_AUTHORITY_UNVERIFIED',label:'Issuer authority and key pin unverified'},
  {value:'SIGNATURE_CHALLENGE_NOT_ISSUED',label:'Signature challenge not issued'}
] as const;
export type Ql289ReviewerFocus=typeof QL289_REVIEWER_CHALLENGE_FOCUS[number]['value'];

export const QL289_WITNESS_CLOSURE_GATES=[
  {id:'ORIGINAL_PROOF',label:'Original signed Proof-B',status:'ABSENT'},
  {id:'CUSTODIAN_IDENTITY',label:'Independent custodian identity',status:'NOT_AUTHENTICATED'},
  {id:'WITNESS_IDENTITY',label:'Independent witness identity',status:'NOT_AUTHENTICATED'},
  {id:'CUSTODY_CHAIN',label:'Witnessed original custody chain',status:'NOT_CORROBORATED'},
  {id:'SIGNATURE_ORIGIN',label:'Signature and origin verification',status:'NOT_VERIFIED'},
  {id:'OWNER_AUTHORIZATION',label:'Owner TEST approval',status:'NOT_GIVEN'}
] as const;
export const QL289_WITNESS_GAPS=[
  {value:'ORIGINAL_PROOF_STILL_ABSENT',label:'Original signed artifact still absent'},
  {value:'WITNESS_PROVENANCE_NOT_ESTABLISHED',label:'Independent witness provenance not established'},
  {value:'CHAIN_OF_CUSTODY_NOT_CORROBORATED',label:'Chain of custody not corroborated'},
  {value:'OWNER_RESOLUTION_APPROVAL_MISSING',label:'Owner resolution authority missing'}
] as const;
export type Ql289WitnessGap=typeof QL289_WITNESS_GAPS[number]['value'];

const referenceIssue=(raw:string):string|null=>{
  const value=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value))
    return 'Enter a nonsecret case reference of 5–32 letters, digits, underscores or dashes.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(value))
    return 'Do not paste tokens, private keys, protected receipts, personal data or passwords.';
  return null;
};
function laterThan(previous:string,now:Date):boolean{
  const t=now.getTime(),prior=new Date(previous).getTime();
  return Number.isFinite(t)&&Number.isFinite(prior)&&prior>=new Date(QL288_OBSERVED_AT).getTime()&&
    t>prior&&t>=new Date(QL289_OBSERVED_AT).getTime();
}

export type Ql289ReviewerChallenge={checkId:string;previousCase:string;reviewerCase:string;
  issuerCase:string;challengeReference:string;focus:Ql289ReviewerFocus;preparedAt:string;
  gatesOpen:7;authenticatedGates:0;issuer:'NOT_AUTHENTICATED';reviewer:'NOT_AUTHENTICATED';
  originalSignedReceipt:'NOT_RECEIVED';challengeIssued:false;originCorroborated:false;
  witnessVerified:false;ownerApproval:'NOT_GIVEN';accepted:false;
  state:'LOCAL_UNISSUED_PROVENANCE_CHALLENGE_MATRIX'};

export function ql289PrepareReviewerChallenge(previous:Ql288ReviewerIndependenceAudit,
  reference:string,focus:Ql289ReviewerFocus,now:Date):
  {ok:true;draft:Ql289ReviewerChallenge}|{ok:false;reason:string}{
  if(!previous||previous.reviewerReceipt!=='NOT_RECEIVED'||
    previous.issuerAuthority!=='NOT_AUTHENTICATED'||previous.signature!=='NOT_VERIFIED'||
    previous.challenge!=='NOT_ISSUED'||previous.independentIdentity!=='NOT_ESTABLISHED'||
    previous.originalAccepted!==false||previous.decisionAccepted!==false||
    previous.ownerApproval!=='NOT_GIVEN'||previous.externalReviewExecuted!==false||
    !QL288_REVIEWER_GAPS.some(row=>row.value===previous.gap)||
    previous.state!=='LOCAL_INDEPENDENCE_GAP_AUDIT_ONLY')
    return {ok:false,reason:'An intact unresolved QL-288 independent receipt gap audit must precede this local challenge matrix.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  const refs=[reference.trim(),previous.previousCase,previous.reviewerReceiptReference,previous.issuerAuthorityReference];
  if(new Set(refs.map(value=>value.toLowerCase())).size!==refs.length)
    return {ok:false,reason:'New challenge and prior reviewer/issuer case references must all be distinct. Distinct strings do not verify separate people.'};
  if(!QL289_REVIEWER_CHALLENGE_FOCUS.some(row=>row.value===focus))
    return {ok:false,reason:'Choose a supported unresolved reviewer challenge focus.'};
  if(!laterThan(previous.preparedAt,now))
    return {ok:false,reason:'The challenge matrix must follow the QL-288 draft and the latest observed public recheck.'};
  return {ok:true,draft:{checkId:previous.checkId,previousCase:previous.previousCase,
    reviewerCase:previous.reviewerReceiptReference,issuerCase:previous.issuerAuthorityReference,
    challengeReference:reference.trim(),focus,preparedAt:now.toISOString(),gatesOpen:7,
    authenticatedGates:0,issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',
    originalSignedReceipt:'NOT_RECEIVED',challengeIssued:false,originCorroborated:false,
    witnessVerified:false,ownerApproval:'NOT_GIVEN',accepted:false,
    state:'LOCAL_UNISSUED_PROVENANCE_CHALLENGE_MATRIX'}};
}

export type Ql289WitnessClosureReadiness={source:Ql270SourceId;previousCase:string;
  reference:string;gap:Ql289WitnessGap;priorSha:string;currentSha:string;preparedAt:string;
  gatesOpen:6;authenticatedGates:0;original:'HTTP_404_AT_IMMUTABLE_PIN';
  custodian:'NOT_AUTHENTICATED';witness:'NOT_AUTHENTICATED';signature:'NOT_VERIFIED';
  chainCorroborated:false;ownerApproval:'NOT_GIVEN';closureApproved:false;
  originalAccepted:false;externalDelivery:false;state:'LOCAL_WITNESS_CLOSURE_READINESS_OPEN'};

export function ql289PrepareWitnessClosure(previous:Ql288CustodianResolutionPreflight,
  reference:string,gap:Ql289WitnessGap,now:Date):
  {ok:true;draft:Ql289WitnessClosureReadiness}|{ok:false;reason:string}{
  const ancestor=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const prior=QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!ancestor||!prior||!current||previous.priorSha!==ancestor.sha||previous.currentSha!==prior.sha||
    previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||previous.custodian!=='NOT_AUTHENTICATED'||
    previous.witness!=='NOT_AUTHENTICATED'||previous.originalSignature!=='NOT_VERIFIED'||
    previous.resolutionReceipt!=='NOT_RECEIVED'||previous.originalAccepted!==false||
    previous.resolved!==false||previous.deliveryExecuted!==false||
    !QL288_CUSTODIAN_PREFLIGHT_GAPS.some(row=>row.value===previous.gap)||
    previous.state!=='LOCAL_ORIGINAL_RESOLUTION_PREFLIGHT_OPEN')
    return {ok:false,reason:'Only an intact QL-288 unresolved original custody preflight may enter witness closure review.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  if(reference.trim().toLowerCase()===previous.reference.toLowerCase()||
    reference.trim().toLowerCase()===previous.previousCase.toLowerCase())
    return {ok:false,reason:'Use a distinct local witness closure reference; do not reuse the custodian cases.'};
  if(!QL289_WITNESS_GAPS.some(row=>row.value===gap))
    return {ok:false,reason:'Choose a supported unverified witness closure precondition.'};
  if(!laterThan(previous.preparedAt,now))
    return {ok:false,reason:'Witness review must follow the unresolved QL-288 preflight and observed QL-289 source snapshot.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,
    reference:reference.trim(),gap,priorSha:prior.sha,currentSha:current.sha,
    preparedAt:now.toISOString(),gatesOpen:6,authenticatedGates:0,
    original:'HTTP_404_AT_IMMUTABLE_PIN',custodian:'NOT_AUTHENTICATED',
    witness:'NOT_AUTHENTICATED',signature:'NOT_VERIFIED',chainCorroborated:false,
    ownerApproval:'NOT_GIVEN',closureApproved:false,originalAccepted:false,
    externalDelivery:false,state:'LOCAL_WITNESS_CLOSURE_READINESS_OPEN'}};
}

export function ql289PinnedProofUrl(source:Ql270SourceId):string{
  const row=QL289_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL289_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql289ExceptionReceiptAging(asOf:Date|string,
  priorQueue:readonly Ql288ImmutableExceptionQueue[]=[]){
  const elapsed=new Date(asOf).getTime()-new Date(QL289_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'RECHECK_DUE' as const:
    'FRESH_IMMUTABLE_SNAPSHOT' as const;
  const rows=QL289_PUBLIC_SOURCE_RECHECK.map(current=>{
    const prior=QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const moved=String(prior?.sha)!==String(current.sha);
    const localPrior=priorQueue.filter(row=>row.source===current.source&&row.currentSha===prior?.sha&&
      !row.scheduled&&!row.sent&&!row.executed&&!row.originalAccepted&&
      row.state==='LOCAL_UNSENT_IMMUTABLE_RECHECK_QUEUE');
    return {...current,previousSha:prior?.sha??null,moved,linkedLocalQueue:localPrior.length,
      receipt:'NOT_RECEIVED' as const,exception:moved?'PIN_DRIFT_AND_ORIGINAL_MISSING' as const:
        'PIN_STABLE_ORIGINAL_MISSING' as const,
      originalAccepted:false as const,independentReceiptVerified:false as const,
      authenticatedGatewayGET:false as const};
  });
  return {rows,observedAt:QL289_OBSERVED_AT,previousObservedAt:QL288_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL289_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    originalReceiptsReceived:0,acceptedOriginals:0,authenticatedGatewayGETs:0,
    automaticPolling:false,release:'DISCONNECTED / HOLD' as const};
}

export const QL289_RECEIPT_AGING_REASONS=[
  {value:'PIN_CHANGED_RECEIPT_NOT_RECEIVED',label:'Pin changed; original receipt not received'},
  {value:'ORIGINAL_PUBLICATION_EXCEPTION_REMAINS',label:'Original publication exception remains open'},
  {value:'INDEPENDENT_RECEIPT_REVALIDATION_PENDING',label:'Independent receipt revalidation still pending'}
] as const;
export type Ql289ReceiptAgingReason=typeof QL289_RECEIPT_AGING_REASONS[number]['value'];
export type Ql289ReceiptAgingFollowup={source:Ql270SourceId;previousCase:string;
  reference:string;priorSha:string;currentSha:string;moved:boolean;reason:Ql289ReceiptAgingReason;
  preparedAt:string;sourceOriginal:'HTTP_404_AT_IMMUTABLE_PIN';receipt:'NOT_RECEIVED';
  scheduled:false;sent:false;executed:false;originalAccepted:false;ownerApproval:'NOT_GIVEN';
  state:'LOCAL_UNSENT_EXCEPTION_RECEIPT_AGING_FOLLOWUP'};

export function ql289PrepareReceiptAging(previous:Ql288ImmutableExceptionQueue,
  reference:string,reason:Ql289ReceiptAgingReason,now:Date):
  {ok:true;draft:Ql289ReceiptAgingFollowup}|{ok:false;reason:string}{
  const ancestor=QL287_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const prior=QL288_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!ancestor||!prior||!current||previous.previousSha!==ancestor.sha||
    previous.currentSha!==prior.sha||previous.pinMoved!==(String(ancestor.sha)!==String(prior.sha))||
    previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||previous.ownerSignoff!=='NOT_GIVEN'||
    previous.independentGET!=='NOT_EXECUTED'||previous.scheduled!==false||
    previous.sent!==false||previous.executed!==false||previous.originalAccepted!==false||
    previous.state!=='LOCAL_UNSENT_IMMUTABLE_RECHECK_QUEUE')
    return {ok:false,reason:'An intact QL-288 unsent, unexecuted immutable exception queue item is required.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  if(reference.trim().toLowerCase()===previous.reference.toLowerCase()||
    reference.trim().toLowerCase()===previous.previousCase.toLowerCase())
    return {ok:false,reason:'Create a distinct local aging follow-up reference.'};
  if(!QL289_RECEIPT_AGING_REASONS.some(row=>row.value===reason))
    return {ok:false,reason:'Choose a supported unresolved receipt aging reason.'};
  if(reason==='PIN_CHANGED_RECEIPT_NOT_RECEIVED'&&String(prior.sha)===String(current.sha))
    return {ok:false,reason:'This pin did not move; select a source-publication or receipt-validation reason.'};
  if(!laterThan(previous.preparedAt,now))
    return {ok:false,reason:'Receipt aging must follow the QL-288 draft and actual QL-289 public snapshot.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,
    reference:reference.trim(),priorSha:prior.sha,currentSha:current.sha,
    moved:String(prior.sha)!==String(current.sha),reason,preparedAt:now.toISOString(),
    sourceOriginal:'HTTP_404_AT_IMMUTABLE_PIN',receipt:'NOT_RECEIVED',
    scheduled:false,sent:false,executed:false,originalAccepted:false,
    ownerApproval:'NOT_GIVEN',state:'LOCAL_UNSENT_EXCEPTION_RECEIPT_AGING_FOLLOWUP'}};
}

export function ql289AuditPacket(challenges:readonly Ql289ReviewerChallenge[],
  witnesses:readonly Ql289WitnessClosureReadiness[],
  aging:readonly Ql289ReceiptAgingFollowup[],asOf:Date|string,
  prior:readonly Ql288ImmutableExceptionQueue[]=[]){
  return JSON.stringify({build:'QL-289',mode:'LOCAL_UNVERIFIED_CHALLENGE_AND_WITNESS_READINESS_ONLY',
    reviewerProvenance:{authenticatedDecisions:0,issuedChallenges:0,
      gates:QL289_REVIEWER_CHALLENGE_GATES,challenges},
    custodianWitness:{verifiedClosures:0,originalReceipts:0,
      gates:QL289_WITNESS_CLOSURE_GATES,witnesses},
    sixAppReceiptAging:ql289ExceptionReceiptAging(asOf,prior),localUnsentFollowups:aging,
    ackDeliveryEvidence:{...QL282_ACK_WORKSTREAM,active:false,action:'NONE'},
    integrationSecurity:{state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false}},null,2);
}
