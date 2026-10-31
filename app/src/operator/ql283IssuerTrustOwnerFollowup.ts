import {QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';
import {QL282_OBSERVED_AT,QL282_PUBLIC_SOURCE_RECHECK,QL282_ACK_WORKSTREAM,
  QL282_ISSUER_READINESS_GATES,type Ql282IssuerRequest,type Ql282ExceptionDraft} from './ql282IssuerPublicationReview';
import type {Ql279ArrivalClaim} from './ql279ReviewerCustodyEscalation';

/** Independent public GitHub main refs and exact pinned original Proof-B path GETs.
 * Observed on 2026-10-31; no original signer or application gateway was contacted. */
export const QL283_OBSERVED_AT='2026-10-31T05:13:30Z';
export const QL283_PUBLIC_SOURCE_RECHECK=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'5a0d140a8080f890c90f6eb812ff04fa0a194b13',http:404},
  {source:'devilndove',repo:'devilndove-site',sha:'1703e747cc9a20a4348c4cc0d0c6a652acf6cef1',http:404},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'df3d1e29ff6797c0535b781881bf5309060c1f87',http:404},
  {source:'yw',repo:'yw',sha:'5027fcb6579f09c521bfdae1095efe39d98ffe64',http:404},
  {source:'icamp',repo:'iCamp',sha:'1ddcc00f90445445853291c86558512f6d055e7d',http:404},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'81b2aa449714539c28fd6f8ee4716075c78d3850',http:404}
] as const satisfies ReadonlyArray<{source:Ql270SourceId;repo:string;sha:string;http:number}>;

export const QL283_ISSUER_TRUST_GATES=[
  {id:'origin',label:'Independently authenticate the original challenge issuer identity, relying-party scope and source origin',status:'NOT_AUTHENTICATED'},
  {id:'pin',label:'Obtain separately witnessed exact trusted issuer SPKI fingerprint and provenance',status:'NOT_VERIFIED'},
  {id:'rotation',label:'Validate key rotation history and certificate/key validity against an independent trust anchor',status:'NOT_CHECKED'},
  {id:'revocation',label:'Check issuer credential revocation and current authorization with an independent authority',status:'NOT_CHECKED'},
  {id:'challenge',label:'Link protected issuer nonce, audience, expiry and replay policy to the original reviewer challenge',status:'NOT_ISSUED'},
  {id:'witness',label:'Match original signed reviewer receipt, challenge response and witness custody with the same case',status:'NOT_RECEIVED'},
  {id:'approval',label:'Obtain explicit owner TEST-only authorization for exact issuer, reviewer and recipients',status:'NOT_GIVEN'}
] as const;

function referenceError(raw:string):string|null {
  const ref=raw.trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(ref))return 'Use a nonsecret case reference of 5–32 letters, digits, dashes or underscores.';
  if(/^(?:sk[-_]|pk[-_]|token|bearer|password|secret|api[-_]?key)/i.test(ref))
    return 'Do not enter private keys, credentials, challenge secrets or authorization tokens.';
  return null;
}
const validAfter=(at:string,now:Date)=>Number.isFinite(now.getTime())&&now.getTime()>new Date(at).getTime();

export type Ql283TrustReference={checkId:string;issuerReadinessReference:string;trustReference:string;
  preparedAt:string;gates:typeof QL283_ISSUER_TRUST_GATES;verified:0;issuer:'NOT_AUTHENTICATED';
  keyPin:'NOT_VERIFIED';challenge:'NOT_ISSUED';ownerApproval:'NOT_GIVEN';
  disposition:'TRUST_REFERENCE_REVIEW_ONLY';state:'DRAFT_NOT_SENT'};

export function ql283PrepareTrustReference(issuer:Ql282IssuerRequest,reference:string,now:Date):
  {ok:true;draft:Ql283TrustReference}|{ok:false;reason:string} {
  if(!issuer||issuer.verified!==0||issuer.issuer!=='NOT_AUTHENTICATED'||issuer.nonce!=='NOT_ISSUED'||
    issuer.signature!=='NOT_VERIFIED'||issuer.ownerApproval!=='NOT_GIVEN'||
    issuer.disposition!=='ISSUER_READINESS_REVIEW_ONLY'||issuer.state!=='DRAFT_NOT_SENT'||
    !Array.isArray(issuer.gates)||issuer.gates.length!==QL282_ISSUER_READINESS_GATES.length||
    !issuer.gates.every((gate,index)=>gate.id===QL282_ISSUER_READINESS_GATES[index].id&&gate.state===QL282_ISSUER_READINESS_GATES[index].state))
    return {ok:false,reason:'An intact unverified QL-282 issuer readiness claim is required; it does not establish trusted identity.'};
  const error=referenceError(reference);if(error)return {ok:false,reason:error};
  if(!validAfter(issuer.preparedAt,now))return {ok:false,reason:'Trust reference review must follow its original QL-282 request.'};
  return {ok:true,draft:{checkId:issuer.checkId,issuerReadinessReference:issuer.issuerReadinessReference,
    trustReference:reference.trim(),preparedAt:now.toISOString(),gates:QL283_ISSUER_TRUST_GATES,
    verified:0,issuer:'NOT_AUTHENTICATED',keyPin:'NOT_VERIFIED',challenge:'NOT_ISSUED',
    ownerApproval:'NOT_GIVEN',disposition:'TRUST_REFERENCE_REVIEW_ONLY',state:'DRAFT_NOT_SENT'}};
}

export type Ql283OwnerFollowup={source:Ql270SourceId;exceptionReference:string;reference:string;
  originalSourceSha:string;currentSourceSha:string;preparedAt:string;
  original:'HTTP_404_AT_IMMUTABLE_PIN';ownerContacted:false;routed:false;resolved:false;state:'DRAFT_NOT_SENT'};

export function ql283PrepareOwnerFollowup(exception:Ql282ExceptionDraft,reference:string,now:Date):
  {ok:true;draft:Ql283OwnerFollowup}|{ok:false;reason:string} {
  const row=QL282_PUBLIC_SOURCE_RECHECK.find(item=>item.source===exception?.source);
  const current=QL283_PUBLIC_SOURCE_RECHECK.find(item=>item.source===exception?.source);
  if(!row||!current||exception.sourceSha!==row.sha||exception.observedAt!==QL282_OBSERVED_AT||
    exception.original!=='HTTP_404_AT_IMMUTABLE_PIN'||exception.resolved!==false||exception.routed!==false||
    exception.state!=='LOCAL_REVIEW_DRAFT'||
    !['SOURCE_SHA_MOVED_ORIGINAL_MISSING','UNCHANGED_SHA_ORIGINAL_MISSING'].includes(exception.reason))
    return {ok:false,reason:'An unresolved original QL-282 immutable publication exception is required.'};
  const error=referenceError(reference);if(error)return {ok:false,reason:error};
  if(!validAfter(exception.preparedAt,now)||now.getTime()<new Date(QL283_OBSERVED_AT).getTime())
    return {ok:false,reason:'Owner follow-up must follow its QL-282 exception and the QL-283 public recheck.'};
  return {ok:true,draft:{source:exception.source,exceptionReference:exception.reference,
    reference:reference.trim(),originalSourceSha:row.sha,currentSourceSha:current.sha,
    preparedAt:now.toISOString(),original:'HTTP_404_AT_IMMUTABLE_PIN',ownerContacted:false,
    routed:false,resolved:false,state:'DRAFT_NOT_SENT'}};
}

export function ql283PinnedProofUrl(source:Ql270SourceId):string {
  const row=QL283_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)throw Error('UNKNOWN_QL283_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql283SourceQueue(asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[]){
  const elapsed=new Date(asOf).getTime()-new Date(QL283_OBSERVED_AT).getTime();
  const ageHours=Number.isFinite(elapsed)&&elapsed>=0?Math.floor(elapsed/3_600_000):null;
  const freshness=ageHours===null?'CLOCK_REVIEW' as const:ageHours>=24?'PUBLIC_RECHECK_DUE' as const:'PINNED_RECENT' as const;
  const rows=QL283_PUBLIC_SOURCE_RECHECK.map(current=>{
    const previous=QL282_PUBLIC_SOURCE_RECHECK.find(row=>row.source===current.source);
    const moved=String(previous?.sha)!==String(current.sha);
    const related=notices.filter(row=>row.source===current.source&&row.notice==='CLAIMED_NOT_CONFIRMED');
    return {...current,previousSha:previous?.sha??null,previousHttp:previous?.http??null,moved,
      reason:'SHA_CHANGED_ORIGINAL_404' as const,status:'RECHECK_REQUIRED' as const,
      authenticatedOriginal:false as const,originalAccepted:false as const,
      notices:related.length,postSnapshotNotices:related.filter(row=>new Date(row.preparedAt).getTime()>new Date(QL283_OBSERVED_AT).getTime()).length,
      stalePinNotices:related.filter(row=>row.sha!==current.sha).length};
  });
  return {rows,observedAt:QL283_OBSERVED_AT,previousObservedAt:QL282_OBSERVED_AT,
    ageHours,freshness,nextRecheckAt:new Date(new Date(QL283_OBSERVED_AT).getTime()+86_400_000).toISOString(),
    moved:rows.filter(row=>row.moved).length,unchanged:rows.filter(row=>!row.moved).length,
    missing:rows.filter(row=>row.http===404).length,sources:QL270_SOURCES.length,
    originalsAccepted:0,authenticatedSourceGets:0,automaticPolling:false,release:'DISCONNECTED / HOLD' as const};
}

export type Ql283RecheckDraft={source:Ql270SourceId;reference:string;sourceSha:string;preparedAt:string;
  action:'MANUAL_PUBLIC_ORIGINAL_RECHECK';scheduled:false;executed:false;state:'DRAFT_NOT_SENT'};

export function ql283PrepareManualRecheck(source:Ql270SourceId,reference:string,now:Date):
  {ok:true;draft:Ql283RecheckDraft}|{ok:false;reason:string} {
  const row=QL283_PUBLIC_SOURCE_RECHECK.find(item=>item.source===source);
  if(!row)return {ok:false,reason:'Select a registered source with a public immutable recheck record.'};
  const error=referenceError(reference);if(error)return {ok:false,reason:error};
  if(!Number.isFinite(now.getTime())||now.getTime()<new Date(QL283_OBSERVED_AT).getTime())
    return {ok:false,reason:'A manual recheck worklist cannot predate its public source observation.'};
  return {ok:true,draft:{source,reference:reference.trim(),sourceSha:row.sha,preparedAt:now.toISOString(),
    action:'MANUAL_PUBLIC_ORIGINAL_RECHECK',scheduled:false,executed:false,state:'DRAFT_NOT_SENT'}};
}

export function ql283AuditPacket(trust:readonly Ql283TrustReference[],owners:readonly Ql283OwnerFollowup[],
  rechecks:readonly Ql283RecheckDraft[],asOf:Date|string,notices:readonly Ql279ArrivalClaim[]=[]):string {
  const queue=ql283SourceQueue(asOf,notices);
  return JSON.stringify({build:'QL-283',mode:'REFERENCE_ONLY_NO_EXTERNAL_ACTION',sourceRecheck:queue,
    issuerTrust:{gates:QL283_ISSUER_TRUST_GATES,verified:0,claims:trust},
    proofBPublication:{originalsAccepted:0,ownerContacted:false,ownerFollowupDrafts:owners},
    manualRechecks:rechecks,ackDelivery:{...QL282_ACK_WORKSTREAM,action:'NONE',active:false},
    security:{integrations:'DISCONNECTED / HOLD',authenticatedGateways:0,realCalls:0,sms:0,
      signerAccess:false,ownerTestApproval:false}},null,2);
}
