/**
 * QL-264: source-repository-local guides and conditional TEST review.
 * This static operator preview intentionally cannot authenticate private receipts
 * or launch any source gateway, relay, provider, or customer-data request.
 */
import {QL258_APPS,type Ql258App} from './ql258OwnerActionChecklist';
import {QL263_FUTURE_GET_PLAN,QL263_ROSIE_ATTACHMENT_SHA256}
  from './ql263OriginalReceiptsAndTestPlan';

export const QL264_RELEASE='ql264-six-source-repository-direct-docs-and-private-proof-test-gate-held-v1';
export const QL264_OBSERVED='29 October 2026 Eastern';
export const QL264_GUIDE_PATH='docs/integration/ROSEVEAR_COMMS_QL264_CONNECTION_HANDOFF.md';
export const QL264_REPO_OBSERVATIONS=[
  {system:'ai-data-platform',repository:'ai-data-platform',sha:'a28a4874497a416613bc4182b5f895a5132fe0b9'},
  {system:'devilndove',repository:'devilndove-site',sha:'f8c60a8c28c3d5a172f621722e33f2546efbd9d0'},
  {system:'rosiedazzlers',repository:'rosiedazzlers',sha:'da968e2a115794ed34024bf618972671f582326e'},
  {system:'yw',repository:'yw',sha:'0da74570ddc97f224aef15f2a39810ca40c9dd8c'},
  {system:'icamp',repository:'iCamp',sha:'040faeeb064c162fc97c059c9a271983b7f1f6bf'},
  {system:'rosevear-ai-hub',repository:'rosevear-ai-hub',sha:'090df20eef0690e84696d72b144c6a89d6d66d67'}
] as const;

export const QL264_APP_BLOCKERS:Record<Ql258App,string>={
  'ai-data-platform':'Resolve existing signer custody and independently isolate the nonproduction gateway.',
  'devilndove':'Separate maker D1/Etsy/Marketplace from any nonproduction health/capabilities principal.',
  'rosiedazzlers':'Original owner JSON received; private signer roles remain NOT_REPORTED, keep booking/quotes/Gift excluded.',
  'yw':'Establish a different nonproduction Supabase project and tenant; no production landscaping data.',
  'icamp':'Establish a separate nonproduction campground project and synthetic test users.',
  'rosevear-ai-hub':'Private signer unverified; synthetic source contract only; Windows relay stays OFF.'
};

export const QL264_TEST_SLOT={
  ...QL263_FUTURE_GET_PLAN,
  proposal:'CONDITIONAL_REVIEW_ONLY',
  actualPrivateCustodianDecisions:0,
  originalAuthenticatedSourceProofs:0,
  independentTestTenantDecisions:0,
  verifiedOwnerTestApprovals:0,
  allowedSourceGateways:0,
  authenticatedGatewayRequests:0,
  testSlot:'HELD_UNSCHEDULED',
  proofPublication:'NO_ORIGINAL_A_TO_B_PROOF_VERIFIED'
} as const;

export function ql264GuideUrl(repository:string):string{
  if(!QL264_REPO_OBSERVATIONS.some(r=>r.repository===repository))
    throw new Error('Unknown source repository');
  return `https://github.com/RosevearCreations/${repository}/blob/main/${QL264_GUIDE_PATH}`;
}

/** Never promote a public text/JSON receipt into proof of external private identity. */
export function ql264ClassifyReceipt(input:{
  publicFileStatus:'HTTP_404'|'HTTP_200'|'NETWORK_UNKNOWN';
  sourceA?:string;proofB?:string;independentPrivateReceipt?:boolean;
  ownerReportsTestApproved?:boolean;
}){
  const structuralCommitPair=!!(input.sourceA&&input.proofB&&
    /^[a-f0-9]{40}$/.test(input.sourceA)&&/^[a-f0-9]{40}$/.test(input.proofB)&&
    input.sourceA!==input.proofB);
  return {
    sourceCommitStructure:structuralCommitPair?'TWO_DISTINCT_SHA_FORMATS_ONLY':'NOT_SHOWN',
    publicProofVisibility:input.publicFileStatus,
    independentSignerWitnessReviewer:'NOT_VERIFIED',
    realSignatureAndIndependentPin:'NOT_VERIFIED',
    authenticatedOwnerTestAuthorization:'NOT_GIVEN',
    remoteGetExecution:'NOT_RUN',
    currentDecision:'DISCONNECTED / HOLD' as const
  };
}

export function ql264SixAppCoordinationReport(){
  const rows=QL258_APPS.map(app=>{
    const observed=QL264_REPO_OBSERVATIONS.find(row=>row.system===app.system);
    if(!observed)throw new Error(`Missing source observation: ${app.system}`);
    return {
      system:app.system,name:app.name,repository:app.repository,
      historicalPreHandoffMainSha:observed.sha,
      originalProofAtHistoricalSha:'HTTP_404',
      directGitHubGuide:ql264GuideUrl(app.repository),
      sourceSpecificAction:QL264_APP_BLOCKERS[app.system],
      ownerPacket:app.system==='rosiedazzlers'
        ?'ORIGINAL_NONSECRET_OWNER_REPORT_RECEIVED_NOT_SECURITY_EVIDENCE'
        :'NO_NEW_ORIGINAL_PACKET_IN_QL264_REQUEST',
      signerCustody:'NOT_INDEPENDENTLY_AUTHENTICATED',
      proofAtoB:'NOT_VERIFIED',testTenant:'NOT_VERIFIED',
      ownerTest:'NOT_GIVEN',realGatewayGets:0,
      connection:'DISCONNECTED / HOLD'
    };
  });
  return {
    release:QL264_RELEASE,observed:QL264_OBSERVED,
    coordinator:'RosevearCreations/rosevear-comms-hub',
    sourceRepositoryHandoffs:rows.length,
    originalOwnerSelfReports:1,
    originalRosiePacketSha256:QL263_ROSIE_ATTACHMENT_SHA256,
    authenticatedPrivateRoleDecisions:0,
    verifiedSignedProofs:0,verifiedNonproductionTenants:0,
    authenticatedOwnerTestApprovals:0,actualGatewayGets:0,
    proposedSlot:QL264_TEST_SLOT,
    integration:'DISCONNECTED / HOLD',livePilotHolds:12,rows
  };
}
