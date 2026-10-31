import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM} from './ql282IssuerPublicationReview';
import {QL289_OBSERVED_AT,QL289_PUBLIC_SOURCE_RECHECK,
  type Ql289ReviewerChallenge,type Ql289WitnessClosureReadiness,
  type Ql289ReceiptAgingFollowup} from './ql289ProvenanceWitnessReceiptAging';

/** Public repository main resolution and immutable path reads only; no source gateway GET. */
export const QL290_OBSERVED_AT='2026-10-31T17:40:31Z';
export const QL290_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'a7a65c16483ac42ed8f07b9aa95687a640f73874',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'3819fa1ffaa474722b9666d8a96479980d752fac',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'9c6788da1db873d980af6ffdc36ff55a1ffbb9e7',http:404},
  {source:'yw',repo:'yw',sha:'7c00eb311b6f9f825dde5c0171aeed932079b086',http:404},
  {source:'icamp',repo:'iCamp',sha:'202c53627a789841ec1b9b3dd58381e956c33196',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'d37279724b948fdee324e157853d3c32563e82e0',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL290_ORIGIN_GATES=[
  {id:'REVIEWER_IDENTITY',label:'Independent reviewer identity',status:'NOT_AUTHENTICATED'},
  {id:'CLAIMED_ORIGIN',label:'Claimed receipt and issuer origin',status:'NOT_CORROBORATED'},
  {id:'SIGNED_ORIGINAL',label:'Original signed decision',status:'NOT_RECEIVED'},
  {id:'CHALLENGE_AUTHORITY',label:'Authorized challenge issuance',status:'NOT_ISSUED'},
  {id:'ISSUER_KEY_PIN',label:'Issuer key and trust pin',status:'NOT_VERIFIED'},
  {id:'INDEPENDENT_WITNESS',label:'Independent witness',status:'NOT_AUTHENTICATED'},
  {id:'OWNER_TEST',label:'Owner TEST authorization',status:'NOT_GIVEN'}
] as const;
export const QL290_ORIGIN_REASONS=[
  {value:'RECEIPT_ORIGIN_NOT_CORROBORATED',label:'Claimed decision receipt origin uncorroborated'},
  {value:'ISSUER_CHALLENGE_AUTHORITY_MISSING',label:'Original issuer and challenge authority missing'},
  {value:'INDEPENDENT_WITNESS_PIN_MISSING',label:'Independent witness and issuer pin missing'}
] as const;
export type Ql290OriginReason=typeof QL290_ORIGIN_REASONS[number]['value'];

export const QL290_ATTESTATION_GATES=[
  {id:'ORIGINAL_SIGNED_PROOF',label:'Original signed Proof-B receipt',status:'ABSENT'},
  {id:'CUSTODIAN_AUTH',label:'Custodian identity and authority',status:'NOT_AUTHENTICATED'},
  {id:'WITNESS_AUTH',label:'Independent attesting witness',status:'NOT_AUTHENTICATED'},
  {id:'ORIGIN_PIN',label:'Original source pin and signature',status:'NOT_VERIFIED'},
  {id:'CHAIN_ATTESTATION',label:'Signed custody chain attestation',status:'NOT_RECEIVED'},
  {id:'OWNER_TEST',label:'Owner TEST authorization',status:'NOT_GIVEN'}
] as const;
export const QL290_WITNESS_REASONS=[
  {value:'SIGNED_ORIGINAL_ABSENT',label:'Original signed Proof-B still absent'},
  {value:'INDEPENDENT_ATTESTATION_ABSENT',label:'Independent custodian/witness attestation absent'},
  {value:'ORIGINAL_CHAIN_UNCORROBORATED',label:'Original custody chain and signer origin uncorroborated'}
] as const;
export type Ql290WitnessReason=typeof QL290_WITNESS_REASONS[number]['value'];

const referenceIssue=(raw:string):string|null=>{
  const value=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(value))
    return 'Enter a nonsecret case reference of 5–32 letters, digits, underscores or dashes.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(value))
    return 'Do not enter tokens, private keys, protected receipts, passwords or personal data.';
  return null;
};
function chronological(previous:string,now:Date){
  const prior=new Date(previous).getTime(),current=now.getTime();
  return Number.isFinite(prior)&&Number.isFinite(current)&&
    prior>=new Date(QL289_OBSERVED_AT).getTime()&&current>prior&&
    current>=new Date(QL290_OBSERVED_AT).getTime();
}

export type Ql290OriginReconciliation={previousCase:string;reviewerCase:string;issuerCase:string;
  reference:string;reason:Ql290OriginReason;preparedAt:string;gatesOpen:7;authenticatedGates:0;
  signedOrigin:'NOT_RECEIVED';issuer:'NOT_AUTHENTICATED';challengeIssued:false;
  corroborated:false;independentDecisionAccepted:false;ownerApproval:'NOT_GIVEN';
  state:'LOCAL_UNVERIFIED_ORIGIN_RECONCILIATION'};
export function ql290PrepareOrigin(previous:Ql289ReviewerChallenge,reference:string,
  reason:Ql290OriginReason,now:Date):{ok:true;draft:Ql290OriginReconciliation}|{ok:false;reason:string}{
  if(!previous||previous.state!=='LOCAL_UNISSUED_PROVENANCE_CHALLENGE_MATRIX'||
    previous.gatesOpen!==7||previous.authenticatedGates!==0||
    previous.issuer!=='NOT_AUTHENTICATED'||previous.reviewer!=='NOT_AUTHENTICATED'||
    previous.originalSignedReceipt!=='NOT_RECEIVED'||previous.challengeIssued!==false||
    previous.originCorroborated!==false||previous.witnessVerified!==false||
    previous.ownerApproval!=='NOT_GIVEN'||previous.accepted!==false)
    return {ok:false,reason:'An intact, unissued and unverified QL-289 challenge matrix is required.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  const refs=[reference.trim(),previous.challengeReference,previous.previousCase,
    previous.reviewerCase,previous.issuerCase];
  if(new Set(refs.map(value=>value.toLowerCase())).size!==refs.length)
    return {ok:false,reason:'All local origin, challenge, reviewer and issuer references must be distinct; this does not prove independent identities.'};
  if(!QL290_ORIGIN_REASONS.some(row=>row.value===reason))
    return {ok:false,reason:'Choose a supported unresolved origin reconciliation reason.'};
  if(!chronological(previous.preparedAt,now))
    return {ok:false,reason:'Reconciliation must follow the QL-289 local matrix and QL-290 public observation.'};
  return {ok:true,draft:{previousCase:previous.challengeReference,reviewerCase:previous.reviewerCase,
    issuerCase:previous.issuerCase,reference:reference.trim(),reason,preparedAt:now.toISOString(),
    gatesOpen:7,authenticatedGates:0,signedOrigin:'NOT_RECEIVED',issuer:'NOT_AUTHENTICATED',
    challengeIssued:false,corroborated:false,independentDecisionAccepted:false,
    ownerApproval:'NOT_GIVEN',state:'LOCAL_UNVERIFIED_ORIGIN_RECONCILIATION'}};
}

export type Ql290WitnessAttestation={source:Ql270SourceId;previousCase:string;reference:string;
  reason:Ql290WitnessReason;previousSha:string;currentSha:string;preparedAt:string;
  gatesOpen:6;authenticatedGates:0;original:'HTTP_404_AT_IMMUTABLE_PIN';
  attestation:'NOT_RECEIVED';custodian:'NOT_AUTHENTICATED';witness:'NOT_AUTHENTICATED';
  signature:'NOT_VERIFIED';closureApproved:false;originalAccepted:false;
  ownerApproval:'NOT_GIVEN';externalDelivery:false;
  state:'LOCAL_UNATTESTED_ORIGINAL_WITNESS_PREFLIGHT'};
export function ql290PrepareAttestation(previous:Ql289WitnessClosureReadiness,reference:string,
  reason:Ql290WitnessReason,now:Date):{ok:true;draft:Ql290WitnessAttestation}|{ok:false;reason:string}{
  const prior=QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL290_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!prior||!current||previous.currentSha!==prior.sha||
    previous.original!=='HTTP_404_AT_IMMUTABLE_PIN'||previous.gatesOpen!==6||
    previous.authenticatedGates!==0||previous.custodian!=='NOT_AUTHENTICATED'||
    previous.witness!=='NOT_AUTHENTICATED'||previous.signature!=='NOT_VERIFIED'||
    previous.chainCorroborated!==false||previous.ownerApproval!=='NOT_GIVEN'||
    previous.closureApproved!==false||previous.originalAccepted!==false||
    previous.externalDelivery!==false||previous.state!=='LOCAL_WITNESS_CLOSURE_READINESS_OPEN')
    return {ok:false,reason:'Only an intact QL-289 unresolved witness closure case at its original source SHA is eligible.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  if([previous.reference,previous.previousCase].some(old=>old.toLowerCase()===reference.trim().toLowerCase()))
    return {ok:false,reason:'The attestation preflight reference must differ from prior local custody cases.'};
  if(!QL290_WITNESS_REASONS.some(row=>row.value===reason))
    return {ok:false,reason:'Choose a supported unmet original attestation condition.'};
  if(!chronological(previous.preparedAt,now))
    return {ok:false,reason:'Attestation preflight must follow QL-289 and the observed QL-290 source recheck.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,reference:reference.trim(),
    reason,previousSha:prior.sha,currentSha:current.sha,preparedAt:now.toISOString(),
    gatesOpen:6,authenticatedGates:0,original:'HTTP_404_AT_IMMUTABLE_PIN',
    attestation:'NOT_RECEIVED',custodian:'NOT_AUTHENTICATED',witness:'NOT_AUTHENTICATED',
    signature:'NOT_VERIFIED',closureApproved:false,originalAccepted:false,
    ownerApproval:'NOT_GIVEN',externalDelivery:false,
    state:'LOCAL_UNATTESTED_ORIGINAL_WITNESS_PREFLIGHT'}};
}

export function ql290PinnedProofUrl(source:Ql270SourceId){
  const row=QL290_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL290_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}
export function ql290PriorityReport(asOf:Date|string,predecessors:readonly Ql289ReceiptAgingFollowup[]=[]){
  const elapsed=new Date(asOf).getTime()-new Date(QL290_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'RECHECK_DUE' as const:
    'FRESH_IMMUTABLE_SNAPSHOT' as const;
  const rows=QL290_PUBLIC_SOURCE_RECHECK.map((current,index)=>{
    const prior=QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const moved=prior?.sha!==current.sha;
    const priority=moved?'P0' as const:'P1' as const;
    const linked=predecessors.filter(row=>row.source===current.source&&row.currentSha===prior?.sha&&
      !row.scheduled&&!row.sent&&!row.executed&&!row.originalAccepted&&
      row.state==='LOCAL_UNSENT_EXCEPTION_RECEIPT_AGING_FOLLOWUP').length;
    return {...current,previousSha:prior?.sha??null,moved,priority,linkedPredecessors:linked,
      rankHint:index,exception:moved?'DRIFT_AND_ORIGINAL_ABSENT' as const:'ORIGINAL_ABSENT' as const,
      originalReceived:false as const,originalAccepted:false as const,
      authenticatedGatewayGET:false as const};
  }).sort((a,b)=>a.priority.localeCompare(b.priority)||a.source.localeCompare(b.source));
  return {rows,observedAt:QL290_OBSERVED_AT,priorObservedAt:QL289_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL290_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    changed:rows.filter(row=>row.moved).length,stable:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    priorityP0:rows.filter(row=>row.priority==='P0').length,
    priorityP1:rows.filter(row=>row.priority==='P1').length,
    acceptedOriginals:0,authenticatedGatewayGETs:0,automaticPolling:false,
    integrationState:'DISCONNECTED / HOLD' as const};
}

export const QL290_PRIORITY_REASONS=[
  {value:'PIN_DRIFT_AND_ORIGINAL_ABSENT',label:'Immutable SHA drift and original Proof-B absent'},
  {value:'ORIGINAL_ABSENT_FOLLOWUP',label:'Original Proof-B absent at stable pin'},
  {value:'INDEPENDENT_RECHECK_NEEDED',label:'Independent public recheck and receipt review needed'}
] as const;
export type Ql290PriorityReason=typeof QL290_PRIORITY_REASONS[number]['value'];
export type Ql290PriorityItem={source:Ql270SourceId;previousCase:string;reference:string;
  previousSha:string;currentSha:string;priority:'P0'|'P1';reason:Ql290PriorityReason;
  preparedAt:string;original:'HTTP_404_AT_IMMUTABLE_PIN';scheduled:false;
  sent:false;executed:false;originalAccepted:false;ownerApproval:'NOT_GIVEN';
  state:'LOCAL_UNSENT_SOURCE_EXCEPTION_PRIORITY_ITEM'};
export function ql290PreparePriority(previous:Ql289ReceiptAgingFollowup,reference:string,
  reason:Ql290PriorityReason,now:Date):{ok:true;draft:Ql290PriorityItem}|{ok:false;reason:string}{
  const prior=QL289_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  const current=QL290_PUBLIC_SOURCE_RECHECK.find(row=>row.source===previous?.source);
  if(!prior||!current||previous.currentSha!==prior.sha||
    previous.sourceOriginal!=='HTTP_404_AT_IMMUTABLE_PIN'||previous.receipt!=='NOT_RECEIVED'||
    previous.scheduled!==false||previous.sent!==false||previous.executed!==false||
    previous.originalAccepted!==false||previous.ownerApproval!=='NOT_GIVEN'||
    previous.state!=='LOCAL_UNSENT_EXCEPTION_RECEIPT_AGING_FOLLOWUP')
    return {ok:false,reason:'An intact, unsent QL-289 original receipt aging follow-up at its source pin is required.'};
  const issue=referenceIssue(reference);if(issue)return {ok:false,reason:issue};
  if([previous.reference,previous.previousCase].some(old=>old.toLowerCase()===reference.trim().toLowerCase()))
    return {ok:false,reason:'Use a new local priority queue reference distinct from prior cases.'};
  if(!QL290_PRIORITY_REASONS.some(row=>row.value===reason))
    return {ok:false,reason:'Choose a supported original source exception reason.'};
  if(reason==='PIN_DRIFT_AND_ORIGINAL_ABSENT'&&prior.sha===current.sha)
    return {ok:false,reason:'This source SHA is stable; choose the original-absence follow-up reason.'};
  if(reason==='ORIGINAL_ABSENT_FOLLOWUP'&&prior.sha!==current.sha)
    return {ok:false,reason:'This source SHA moved; use the drift reason or independent recheck.'};
  if(!chronological(previous.preparedAt,now))
    return {ok:false,reason:'Priority item must follow QL-289 and the QL-290 public pinned recheck.'};
  return {ok:true,draft:{source:previous.source,previousCase:previous.reference,
    reference:reference.trim(),previousSha:prior.sha,currentSha:current.sha,
    priority:prior.sha===current.sha?'P1':'P0',reason,preparedAt:now.toISOString(),
    original:'HTTP_404_AT_IMMUTABLE_PIN',scheduled:false,sent:false,executed:false,
    originalAccepted:false,ownerApproval:'NOT_GIVEN',
    state:'LOCAL_UNSENT_SOURCE_EXCEPTION_PRIORITY_ITEM'}};
}

export function ql290AuditPacket(origins:readonly Ql290OriginReconciliation[],
  witnesses:readonly Ql290WitnessAttestation[],priorityItems:readonly Ql290PriorityItem[],
  asOf:Date|string,previous:readonly Ql289ReceiptAgingFollowup[]=[]){
  return JSON.stringify({build:'QL-290',mode:'UNVERIFIED_LOCAL_PRECONDITIONS_AND_PUBLIC_SOURCE_ONLY',
    reviewerOrigins:{authenticated:0,acceptedDecisions:0,gates:QL290_ORIGIN_GATES,origins},
    witnessAttestation:{receivedOriginals:0,verifiedAttestations:0,gates:QL290_ATTESTATION_GATES,witnesses},
    sixAppExceptions:ql290PriorityReport(asOf,previous),localUnsentPriorityItems:priorityItems,
    ackDeliveryEvidence:{...QL282_ACK_WORKSTREAM,active:false,action:'NONE'},
    integrationSecurity:{state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false}},null,2);
}
