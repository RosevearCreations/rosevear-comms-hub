/**
 * QL-267: read-only owner return reconciliation. Neither browser JSON nor a
 * synthetic cryptographic receipt can approve a private role or a gateway GET.
 */
import {QL266_SOURCE_SNAPSHOT,ql266BuildAcceptanceReview,
  type Ql266OwnerUiReview} from './ql266SixAppProductionAcceptance';

export const QL267_SOURCE_MAIN_RECHECK = [
  {source:'ai-data-platform',repository:'ai-data-platform',sha:'fefb13e63487e6685555ed52fcdb4573838513e7'},
  {source:'devilndove',repository:'devilndove-site',sha:'be17016f56abb4a4425f45845c82396063ae5eb1'},
  {source:'rosiedazzlers',repository:'rosiedazzlers',sha:'b74bea52ac97a3bb084bedb8ef12fb1cc2f1c39b'},
  {source:'yw',repository:'yw',sha:'531e7422b08e8f4836dfe5a5705e4aabd353e74a'},
  {source:'icamp',repository:'iCamp',sha:'4e12312490e2c839fd2090128a2bf70570357bf8'},
  {source:'rosevear-ai-hub',repository:'rosevear-ai-hub',sha:'f20eda8e64e6785361e092636d9526194a2a855e'}
] as const;

export const QL267_PROOF_RECHECK = {
  observedOn:'30 October 2026 Eastern',
  method:'GitHub contents API at exact current main SHA for each source',
  path:'docs/integration/ql246-source-proof.json',
  result:'HTTP_404' as const
};

type IntakeStatus='NOT_RECEIVED'|'REJECTED_UNTRUSTED_OR_MALFORMED'|'ACCEPTED_OWNER_REPORT_ONLY';

function normalize(value:unknown):unknown{
  if(Array.isArray(value))return value.map(normalize);
  if(value!==null&&typeof value==='object')return Object.fromEntries(
    Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,normalize(v)]));
  return value;
}

/** Accept only an EXACT QL-266 nonsecret export, not arbitrary owner claims. */
export function parseQl267WalkthroughReceipt(raw:string):{
  status:IntakeStatus;review:Ql266OwnerUiReview;
}{
  if(!raw.trim())return {status:'NOT_RECEIVED',review:{}};
  if(raw.length>48_000)return {status:'REJECTED_UNTRUSTED_OR_MALFORMED',review:{}};
  try{
    const receipt:unknown=JSON.parse(raw);
    if(!receipt||typeof receipt!=='object'||Array.isArray(receipt))throw Error('object required');
    const object=receipt as Record<string,unknown>;
    if(object.schema!=='rosevear-comms-ql266-production-ui-acceptance/v1'||
      !Array.isArray(object.rows)||object.rows.length!==6)throw Error('schema or rows');
    const owner:Ql266OwnerUiReview={};
    for(let i=0;i<QL266_SOURCE_SNAPSHOT.length;i++){
      const row=object.rows[i];
      if(!row||typeof row!=='object'||Array.isArray(row))throw Error('row');
      const item=row as Record<string,unknown>;
      if(item.source!==QL266_SOURCE_SNAPSHOT[i].source)throw Error('source order');
      if(item.localInterfaceReview==='OWNER_REPORTS_VIEWED_NOT_INDEPENDENTLY_VERIFIED')
        owner[QL266_SOURCE_SNAPSHOT[i].source]=true;
      else if(item.localInterfaceReview!=='NOT_REPORTED')throw Error('owner state');
    }
    const expected=ql266BuildAcceptanceReview(owner);
    if(JSON.stringify(normalize(receipt))!==JSON.stringify(normalize(expected)))
      throw Error('receipt has extra, missing or privileged fields');
    return {status:'ACCEPTED_OWNER_REPORT_ONLY',review:owner};
  }catch{return {status:'REJECTED_UNTRUSTED_OR_MALFORMED',review:{}};}
}

const CRYPTO_FIELDS=[
  'schema','cryptographicPossession','publicPin','challengeFreshness',
  'independentlyAuthenticatedHumanRoles','originalSignedSourceProofB',
  'authenticatedGatewayGets','ownerTestAuthorization','conditionalTestSlot',
  'integration','reason'
];
const CRYPTO_REASONS=new Set([
  'INVALID_OR_UNTRUSTED_INPUT','CHALLENGE_OUTSIDE_FIVE_MINUTE_WINDOW',
  'NONCE_TOO_SHORT','UNSUPPORTED_PUBLIC_KEY_OR_SIGNATURE',
  'INDEPENDENT_PIN_MISMATCH','SIGNATURE_INVALID',
  'HUMAN_CUSTODY_AND_ORIGINAL_PROOF_STILL_REQUIRE_PRIVATE_REVIEW',
  'MALFORMED_CRYPTOGRAPHIC_RECEIPT'
]);

/** Accept only QL-266's sanitized enum output; never accept a private nonce. */
export function parseQl267PrivateWitnessStatus(raw:string){
  if(!raw.trim())return 'NOT_RECEIVED' as const;
  if(raw.length>4_000)return 'REJECTED_UNTRUSTED_OR_MALFORMED' as const;
  try{
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('object');
    const v=value as Record<string,unknown>;
    if(Object.keys(v).sort().join('|')!==[...CRYPTO_FIELDS].sort().join('|')||
      v.schema!=='rosevear-comms-ql266-witness-crypto/v1'||
      !['NOT_VERIFIED','SIGNATURE_VALID_ONLY'].includes(String(v.cryptographicPossession))||
      !['NOT_VERIFIED','PIN_MATCHED'].includes(String(v.publicPin))||
      !['NOT_VERIFIED','WITHIN_FIVE_MINUTES'].includes(String(v.challengeFreshness))||
      v.independentlyAuthenticatedHumanRoles!=='NOT_VERIFIED'||
      v.originalSignedSourceProofB!=='NOT_AVAILABLE'||
      v.authenticatedGatewayGets!==0||v.ownerTestAuthorization!=='NOT_GIVEN'||
      v.conditionalTestSlot!=='HELD_UNSCHEDULED'||
      v.integration!=='DISCONNECTED / HOLD'||!CRYPTO_REASONS.has(String(v.reason)))throw Error('claims');
    if(v.cryptographicPossession==='SIGNATURE_VALID_ONLY'&&(
      v.publicPin!=='PIN_MATCHED'||v.challengeFreshness!=='WITHIN_FIVE_MINUTES'||
      v.reason!=='HUMAN_CUSTODY_AND_ORIGINAL_PROOF_STILL_REQUIRE_PRIVATE_REVIEW'))throw Error('inconsistent');
    return 'SANITIZED_CRYPTO_RESULT_RECEIVED_NOT_INDEPENDENTLY_AUTHENTICATED' as const;
  }catch{return 'REJECTED_UNTRUSTED_OR_MALFORMED' as const;}
}

export function ql267ReconcileReturns(ownerRaw='',witnessRaw=''){
  const owner=parseQl267WalkthroughReceipt(ownerRaw);
  const witnessStatus=parseQl267PrivateWitnessStatus(witnessRaw);
  const rows=QL267_SOURCE_MAIN_RECHECK.map(source=>{
    const last=QL266_SOURCE_SNAPSHOT.find(x=>x.source===source.source);
    if(!last)throw Error('missing QL-266 source');
    return {
      source:source.source,repository:`RosevearCreations/${source.repository}`,
      observedMainSha:source.sha,previousQl266Sha:last.sha,
      freshness:last.sha===source.sha?'SAME_IMMUTABLE_SHA':'NEWER_OR_DIFFERENT_MAIN_SHA_RECHECKED',
      ownerWalkthrough:owner.review[source.source]===true?'OWNER_SELF_REPORT_ONLY':'NOT_REPORTED',
      originalSignedProofPath:QL267_PROOF_RECHECK.path,
      originalSignedProofStatus:'HTTP_404' as const,
      independentlyAuthenticatedCustodian:'NOT_VERIFIED' as const,
      distinctNonceWitness:'NOT_VERIFIED' as const,
      independentReviewer:'NOT_VERIFIED' as const,
      isolatedNonproductionTenant:'NOT_VERIFIED' as const,
      sourceGatewayEnabled:false,
      authenticatedGatewayGets:0,
      integration:'DISCONNECTED / HOLD' as const
    };
  });
  return {
    schema:'rosevear-comms-ql267-six-app-reconciliation/v1',
    date:QL267_PROOF_RECHECK.observedOn,
    originalSignedProof404Count:rows.length,
    ownerPacketIntake:owner.status,
    ownerWalkthroughCount:rows.filter(row=>row.ownerWalkthrough==='OWNER_SELF_REPORT_ONLY').length,
    privateWitnessStatusIntake:witnessStatus,
    actualPrivatelyAuthenticatedRoleDecision:'NOT_RECEIVED' as const,
    proofBPublication:'NOT_VERIFIED_OR_AVAILABLE' as const,
    independentlyVerifiedNonproductionIsolation:'NOT_RECEIVED' as const,
    ownerTestAuthorization:'NOT_GIVEN' as const,
    conditionalDryRun:'HELD_UNSCHEDULED' as const,
    requestedWindow:'MAX_TWO_POSITIVE_PLUS_SEVEN_DENIAL_GETS_PER_APP_WITHIN_15_MINUTES' as const,
    scheduledWindowCount:0,
    authenticatedGatewayGets:0,
    livePilotHolds:12,
    integration:'DISCONNECTED / HOLD' as const,
    rows
  };
}
