/**
 * QL-262 public evidence receipt and nonproduction decision tracking.
 * Pure public metadata / owner self-report only. No private signer inspection,
 * authenticated gateway, owner TEST approval, secret storage or dispatch.
 */
import {QL258_APPS,type Ql258App} from './ql258OwnerActionChecklist';
import {intakeQl259Packet,type Ql259Ledger} from './ql259SixAppReturnReconciliation';
import {QL260_PROOF_PATH,QL260_SOURCE_REPORTS} from './ql260NarrativeReturnTriage';
import {QL261_GUIDES} from './ql261SixAppPreflight';

export const QL262_RELEASE='ql262-fresh-main-source-proof-and-nonproduction-isolation-evidence-ledger-held-v1';
export const QL262_OBSERVED='29 October 2026 Eastern';
export const QL262_PUBLIC_SOURCES=QL260_SOURCE_REPORTS.map(source=>({
  system:source.system,name:source.name,repository:source.repository,
  observedMainSha:source.mainSha,originalProofAtObservedSha:'HTTP_404'
}));

export type Ql262IsolationDecision=
  'NOT_REVIEWED'|'OWNER_REPORTS_ISOLATED_UNVERIFIED'|
  'OWNER_REPORTS_NOT_ISOLATED'|'OWNER_REPORTS_PRIVATE_REVIEW_PENDING';
export type Ql262IsolationLedger=Record<Ql258App,Ql262IsolationDecision>;
const VALID_DECISIONS:ReadonlyArray<Ql262IsolationDecision>=[
  'NOT_REVIEWED','OWNER_REPORTS_ISOLATED_UNVERIFIED',
  'OWNER_REPORTS_NOT_ISOLATED','OWNER_REPORTS_PRIVATE_REVIEW_PENDING'
];
export const QL262_ISOLATION_OPTIONS=[
  {value:'NOT_REVIEWED',label:'Not reviewed'},
  {value:'OWNER_REPORTS_ISOLATED_UNVERIFIED',label:'Owner reports isolated — not independently verified'},
  {value:'OWNER_REPORTS_NOT_ISOLATED',label:'Owner reports NOT isolated — cannot test'},
  {value:'OWNER_REPORTS_PRIVATE_REVIEW_PENDING',label:'Private reviewer evidence still pending'}
] as const;

export function newQl262IsolationLedger():Ql262IsolationLedger{
  return Object.fromEntries(QL258_APPS.map(app=>[app.system,'NOT_REVIEWED'])) as Ql262IsolationLedger;
}
export function ql262SetIsolation(ledger:Ql262IsolationLedger,system:Ql258App,
  value:Ql262IsolationDecision):Ql262IsolationLedger{
  if(!QL258_APPS.some(app=>app.system===system)||!VALID_DECISIONS.includes(value))
    throw new Error('Invalid app or unsupported owner self-report status');
  return {...ledger,[system]:value};
}

export const intakeQl262OwnerPacket=intakeQl259Packet;

export type Ql262PublicResult=Readonly<{
  system:Ql258App;repository:string;baselineSha:string;newestMainSha:string|null;
  sourceFreshness:'SAME_AS_QL260'|'NEW_SHA_REVIEW_REQUIRED'|'MAIN_SHA_UNKNOWN';
  proofStatus:'MISSING_404'|'PUBLIC_FILE_PRESENT_UNVERIFIED'|'HTTP_UNKNOWN'|'NETWORK_UNKNOWN';
  httpStatus:number|null;
}>;

const SHA=/^[a-f0-9]{40}$/;
const OPTIONS:RequestInit={method:'GET',credentials:'omit',cache:'no-store',
  redirect:'error',referrerPolicy:'no-referrer'};

/**
 * Explicitly invoked in the browser: six PUBLIC main-branch GitHub API GETs,
 * then only pinned immutable raw.githubusercontent.com proof GETs.
 * HTTP 200 cannot establish a valid signature, public key pin or custody.
 */
export async function ql262FreshPublicProofCheck(
  request:typeof fetch=fetch):Promise<ReadonlyArray<Ql262PublicResult>>{
  return Promise.all(QL262_PUBLIC_SOURCES.map(async source=>{
    const common={system:source.system,repository:source.repository,
      baselineSha:source.observedMainSha};
    let sha:string|null=null;
    try{
      const branch=await request(`https://api.github.com/repos/RosevearCreations/${source.repository}/branches/main`,OPTIONS);
      if(branch.status===200){
        const response:unknown=await branch.json();
        if(response&&typeof response==='object'&&!Array.isArray(response)){
          const value=response as Record<string,unknown>;
          const commit=value.commit;
          if(value.name==='main'&&commit&&typeof commit==='object'&&!Array.isArray(commit)){
            const candidate=(commit as Record<string,unknown>).sha;
            if(typeof candidate==='string'&&SHA.test(candidate))sha=candidate;
          }
        }
      }
    }catch{/* Inaccessible, rate-limited or malformed public GitHub response => UNKNOWN. */}
    if(!sha)return {...common,newestMainSha:null,sourceFreshness:'MAIN_SHA_UNKNOWN',
      proofStatus:'NETWORK_UNKNOWN',httpStatus:null} as Ql262PublicResult;
    const freshness=sha===source.observedMainSha?'SAME_AS_QL260':'NEW_SHA_REVIEW_REQUIRED';
    try{
      const raw=await request(`https://raw.githubusercontent.com/RosevearCreations/${source.repository}/${sha}/${QL260_PROOF_PATH}`,OPTIONS);
      return {...common,newestMainSha:sha,sourceFreshness:freshness,
        proofStatus:raw.status===404?'MISSING_404':
          raw.status===200?'PUBLIC_FILE_PRESENT_UNVERIFIED':'HTTP_UNKNOWN',
        httpStatus:raw.status} as Ql262PublicResult;
    }catch{return {...common,newestMainSha:sha,sourceFreshness:freshness,
      proofStatus:'NETWORK_UNKNOWN',httpStatus:null} as Ql262PublicResult;}
  }));
}

/** A public receipt, even HTTP 200 and 6/6 owner JSON, never releases private gates. */
export function ql262EvidenceLedger(owners:Ql259Ledger,isolation:Ql262IsolationLedger,
  publicChecks:ReadonlyArray<Ql262PublicResult>|null=null){
  const rows=QL262_PUBLIC_SOURCES.map(source=>{
    const packet=owners[source.system];
    const decision=isolation[source.system];
    const publicResult=publicChecks?.find(row=>row.system===source.system);
    const guide=QL261_GUIDES.find(row=>row.system===source.system)!;
    const hardTenantGate=source.system==='yw'||source.system==='icamp';
    return {
      system:source.system,name:source.name,repository:source.repository,
      packet:packet?'EXACT_QL258_SCHEMA_RECEIVED_SELF_REPORT_ONLY':'NO_ORIGINAL_QL258_OWNER_PACKET',
      isolatedNonproductionDecision:decision,
      isolationIndependentVerification:'NOT_RECEIVED',
      dedicatedTenantProofNeeded:hardTenantGate,
      signerCustodyWitnessReview:'NOT_RECEIVED',
      currentSourceSha:publicResult?.newestMainSha??null,
      publicProof:publicResult?.proofStatus??'HISTORICAL_404_RECHECK_REQUIRED',
      publicSourceFreshness:publicResult?.sourceFreshness??'NOT_RUN',
      signedProofIndependentlyVerified:false,
      ownerTestAuthorization:'NOT_GIVEN',authenticatedGatewayGets:0,
      integration:'DISCONNECTED / HOLD',nextSourceAction:guide.blocker
    };
  });
  return {release:QL262_RELEASE,observedBaseline:QL262_OBSERVED,
    test:'NONSECRET_OWNER_RECEIPT_AND_PUBLIC_GITHUB_FRESHNESS_ONLY',
    originalSanitizedOwnerPackets:rows.filter(row=>row.packet.startsWith('EXACT_')).length,
    ownerIsolationReports:rows.filter(row=>row.isolatedNonproductionDecision!=='NOT_REVIEWED').length,
    currentPublicProofChecks:publicChecks?.length??0,
    independentlyAuthenticatedSignerCustodians:0,
    verifiedPublicSignedProofs:0,
    independentlyVerifiedTestTenants:0,
    authenticatedOwnerTestApprovals:0,authenticatedGatewayGets:0,
    livePilotHolds:12,connection:'DISCONNECTED',readyForGatewayTest:false,
    rows};
}
