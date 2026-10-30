/** QL-266: exact-commit public evidence and strictly non-authorizing UI review. */
import {QL265_SOURCE_APPS} from './ql265LocalSixAppPreflight';

export const QL266_SOURCE_SNAPSHOT = [
  {source:'ai-data-platform',sha:'fefb13e63487e6685555ed52fcdb4573838513e7'},
  {source:'devilndove',sha:'93c09040d45e2b544270f7e77e633f4d8739bcef'},
  {source:'rosiedazzlers',sha:'a5bd0ded1044a8ce5a0f394fa2266a1e1e495c6c'},
  {source:'yw',sha:'531e7422b08e8f4836dfe5a5705e4aabd353e74a'},
  {source:'icamp',sha:'4e12312490e2c839fd2090128a2bf70570357bf8'},
  {source:'rosevear-ai-hub',sha:'a2e8e1839cd54b7941121143b97b4d148a15c243'}
] as const;

export const QL266_PUBLIC_RECHECK = {
  date:'29 October 2026 Eastern',
  method:'GitHub contents API at six immutable QL-265 main SHAs',
  path:'docs/integration/ql246-source-proof.json',
  observedStatus:'HTTP_404' as const,
  verifiedOriginalSignedProofCount:0
} as const;

export type Ql266SourceId = typeof QL266_SOURCE_SNAPSHOT[number]['source'];
export type Ql266OwnerUiReview = Partial<Record<Ql266SourceId,boolean>>;

/** An owner checkbox is a useful review receipt but NEVER private witness verification. */
export function ql266BuildAcceptanceReview(ownerUiReview:Ql266OwnerUiReview={}){
  const rows=QL266_SOURCE_SNAPSHOT.map(source=>{
    const app=QL265_SOURCE_APPS.find(row=>row.id===source.source);
    if(!app) throw new Error('QL-266 source does not match QL-265 registry');
    return {
      source:source.source,
      repository:`RosevearCreations/${app.repo}`,
      interfacePath:app.ui,
      inspectedMainCommit:source.sha,
      originalProofFile:QL266_PUBLIC_RECHECK.path,
      originalProofStatus:'HTTP_404' as const,
      localInterfaceReview:ownerUiReview[source.source]===true
        ?'OWNER_REPORTS_VIEWED_NOT_INDEPENDENTLY_VERIFIED' as const
        :'NOT_REPORTED' as const,
      independentlyAuthenticatedCustodian:'NOT_VERIFIED' as const,
      separateNonceWitness:'NOT_VERIFIED' as const,
      distinctReviewer:'NOT_VERIFIED' as const,
      independentlyPinnedPublicSpki:'NOT_VERIFIED' as const,
      isolatedNonproductionTenant:'NOT_VERIFIED' as const,
      originalSignedProofB:'NOT_AVAILABLE' as const,
      ownerTestAuthorization:'NOT_GIVEN' as const,
      authenticatedGatewayGets:0,
      integration:'DISCONNECTED / HOLD' as const
    };
  });
  const ownerReviewedCount=rows.filter(row=>row.localInterfaceReview!== 'NOT_REPORTED').length;
  return {
    schema:'rosevear-comms-ql266-production-ui-acceptance/v1',
    release:'QL-266',
    sourceCount:rows.length,
    ownerReviewedCount,
    ownerUiReviewComplete:ownerReviewedCount===rows.length,
    originalProof404Count:rows.filter(row=>row.originalProofStatus==='HTTP_404').length,
    signerCustodianWitnessReviewerStatus:'NOT_INDEPENDENTLY_VERIFIED' as const,
    originalSignedProofBStatus:'NOT_AVAILABLE' as const,
    nonproductionIsolation:'NOT_VERIFIED' as const,
    ownerTestAuthorization:'NOT_GIVEN' as const,
    sourceGatewaysEnabled:0,
    authenticatedGatewayGets:0,
    maximumConditionalWindow:'TWO_POSITIVE_SEVEN_DENIAL_GETS_PER_APP_IN_15_MINUTES' as const,
    conditionalTestSlot:'HELD_UNSCHEDULED' as const,
    nextPrivateAction:'Appoint and independently authenticate private custodian, distinct nonce witness and reviewer; verify real signer, restricted store and out-of-band SPKI; then publish original signed A-to-B proof and obtain isolated nonproduction tenant and owner TEST authorization.' as const,
    livePilotHolds:12,
    integration:'DISCONNECTED / HOLD' as const,
    rows
  };
}
