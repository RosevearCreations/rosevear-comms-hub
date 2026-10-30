/**
 * QL-268: proof publication exceptions and nonproduction GET release decision.
 * Owner progress fields never authenticate a signer, tenant, witness or TEST.
 */
import {QL267_SOURCE_MAIN_RECHECK,ql267ReconcileReturns}
  from './ql267SixAppReceiptReconciliation';

export const QL268_SOURCE_PROOF_RECHECK = [
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'467ca1fad5822ce61c53689bb5826b35e26b5dc0'},
  {source:'devilndove',repo:'devilndove-site',sha:'4cce5d4d44f19803e9f0bb2727831d1655a6abc6'},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'4fd9c0a34ec0a6b60b280ef76461b72d2093380c'},
  {source:'yw',repo:'yw',sha:'642aef0c5936c5b7792fa56f72e15c9f6ca1d27d'},
  {source:'icamp',repo:'iCamp',sha:'4e12312490e2c839fd2090128a2bf70570357bf8'},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'8faeafbfe72339a26319361ad204819e48927304'}
] as const;

export const QL268_PROOF_PATH='docs/integration/ql246-source-proof.json';
export type Ql268SourceId=typeof QL268_SOURCE_PROOF_RECHECK[number]['source'];
export type Ql268OwnerPreparation=Partial<Record<Ql268SourceId,{
  isolatedNonproductionProject?:boolean;
  scopedReadOnlyGetIdentity?:boolean;
  denyCasePlanReviewed?:boolean;
  stopRollbackPrepared?:boolean;
  productionAndPrivateDataExcluded?:boolean;
}>>;
const FIELDS=[
  'isolatedNonproductionProject','scopedReadOnlyGetIdentity','denyCasePlanReviewed',
  'stopRollbackPrepared','productionAndPrivateDataExcluded'
] as const;

function ownKeysEqual(a:Record<string,unknown>,b:Record<string,unknown>,ignored:string[]=[]){
  const ak=Object.keys(a).filter(key=>!ignored.includes(key)).sort();
  const bk=Object.keys(b).filter(key=>!ignored.includes(key)).sort();
  return ak.join('|')===bk.join('|')&&ak.every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]));
}

/** Validate QL-267's *public* status export only. No raw private challenge accepted. */
export function parseQl268PreviousLedger(raw:string){
  if(!raw.trim())return {status:'NOT_RECEIVED' as const,ownerReviewCount:0};
  if(raw.length>48_000)return {status:'REJECTED_UNTRUSTED_OR_MALFORMED' as const,ownerReviewCount:0};
  try{
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('object');
    const v=value as Record<string,unknown>;
    const expected=ql267ReconcileReturns() as unknown as Record<string,unknown>;
    if(!ownKeysEqual(v,expected,[
      'ownerPacketIntake','ownerWalkthroughCount','privateWitnessStatusIntake','rows'
    ]))throw Error('unknown or privileged top-level claim');
    if(!['NOT_RECEIVED','REJECTED_UNTRUSTED_OR_MALFORMED','ACCEPTED_OWNER_REPORT_ONLY']
      .includes(String(v.ownerPacketIntake))||
      !['NOT_RECEIVED','REJECTED_UNTRUSTED_OR_MALFORMED',
        'SANITIZED_CRYPTO_RESULT_RECEIVED_NOT_INDEPENDENTLY_AUTHENTICATED']
        .includes(String(v.privateWitnessStatusIntake))||
      !Number.isInteger(v.ownerWalkthroughCount)||
      (v.ownerWalkthroughCount as number)<0||(v.ownerWalkthroughCount as number)>6||
      !Array.isArray(v.rows)||v.rows.length!==6)throw Error('unrecognized enum');
    const oldRows=expected.rows as Record<string,unknown>[];
    let count=0;
    for(let i=0;i<6;i++){
      const row=v.rows[i];
      if(!row||typeof row!=='object'||Array.isArray(row)||
        !ownKeysEqual(row,oldRows[i],['ownerWalkthrough'])||
        !['OWNER_SELF_REPORT_ONLY','NOT_REPORTED'].includes(String(row.ownerWalkthrough)))
        throw Error('unknown source row');
      if(row.ownerWalkthrough==='OWNER_SELF_REPORT_ONLY')count++;
    }
    if(count!==v.ownerWalkthroughCount||
      (v.ownerPacketIntake!=='ACCEPTED_OWNER_REPORT_ONLY'&&count!==0))
      throw Error('self-report counts inconsistent');
    return {status:'ACCEPTED_NONSECRET_STATUS_ONLY' as const,ownerReviewCount:count};
  }catch{return {status:'REJECTED_UNTRUSTED_OR_MALFORMED' as const,ownerReviewCount:0};}
}

/** No private verifier outcome or owner checkbox can authorize an actual slot. */
export function ql268ReleaseLedger(owner:Ql268OwnerPreparation={},previousJson=''){
  const previous=parseQl268PreviousLedger(previousJson);
  const rows=QL268_SOURCE_PROOF_RECHECK.map(source=>{
    const prior=QL267_SOURCE_MAIN_RECHECK.find(x=>x.source===source.source);
    if(!prior)throw Error('source registry mismatch');
    const progress=owner[source.source]??{};
    const prepared=FIELDS.filter(field=>progress[field]===true).length;
    return {
      source:source.source,repository:`RosevearCreations/${source.repo}`,
      currentMainSha:source.sha,previousQl267Sha:prior.sha,
      observationFreshness:source.sha===prior.sha?'SAME_IMMUTABLE_SHA':'RECHECKED_NEW_MAIN_SHA',
      originalProofPath:QL268_PROOF_PATH,
      originalSignedProofB:'HTTP_404_NOT_AVAILABLE' as const,
      publicationException:'MISSING_ORIGINAL_SIGNED_PROOF_B' as const,
      ownerPreparationReported:prepared,
      ownerPreparationQuestions:FIELDS.length,
      preparationDisposition:prepared===FIELDS.length?'OWNER_REPORTS_READY_NOT_VERIFIED' as const
        :'INCOMPLETE_OWNER_SELF_REPORT' as const,
      independentlyAuthenticatedCustodian:'NOT_VERIFIED' as const,
      distinctAuthenticatedNonceWitness:'NOT_VERIFIED' as const,
      separateAuthenticatedReviewer:'NOT_VERIFIED' as const,
      independentlyPinnedSignerSpki:'NOT_VERIFIED' as const,
      independentNonproductionTenantAttestation:'NOT_VERIFIED' as const,
      sourceConnectionEnabled:false,
      authorizedGatewayGets:0,
      integration:'DISCONNECTED / HOLD' as const
    };
  });
  return {
    schema:'rosevear-comms-ql268-proofb-isolation-release/v1',
    publicRecheckDate:'30 October 2026 Eastern',
    sourceCount:6,
    exactMainProof404Count:rows.length,
    previousQl267LedgerIntake:previous.status,
    previousOwnerSelfReports:previous.ownerReviewCount,
    ownerPreparationCompleteSelfReports:rows.filter(x=>x.ownerPreparationReported===5).length,
    originalSignedProofBStatus:'NONE_VERIFIED' as const,
    privateRolesAndOutOfBandPin:'NOT_INDEPENDENTLY_VERIFIED' as const,
    independentNonproductionIsolation:'NOT_VERIFIED' as const,
    realOwnerTestAuthorization:'NOT_GIVEN' as const,
    boundedGetTrial:'HELD_UNSCHEDULED' as const,
    conditionalGetContract:'TWO_POSITIVE_AND_SEVEN_DENIAL_READ_ONLY_GETS_PER_APP_WITHIN_15_MINUTES' as const,
    scheduledWindowCount:0,
    authenticatedGatewayGetCount:0,
    livePilotHolds:12,
    integration:'DISCONNECTED / HOLD' as const,
    nextSpecificBlocker:'Private approved signer, distinct independent human witness and reviewer, out-of-band Ed25519 pin, genuine source-signed proof B and isolated nonproduction tenant with separately authenticated owner TEST-only approval are absent.' as const,
    rows
  };
}
