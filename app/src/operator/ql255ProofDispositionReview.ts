/** QL-255: attached source team replies reconciled against public immutable GitHub. */
export const QL255_RELEASE = 'ql255-six-app-original-proof-custody-owner-mini-server-review-held-v1';
export const QL255_OBSERVED = '29 October 2026, 10:09 a.m. Eastern';
export const QL255_PROOF_PATH = 'docs/integration/ql246-source-proof.json';
export const QL255_RESPONSE_DISPOSITIONS = Object.freeze([
  {system:'AI Data Platform',repository:'ai-data-platform',
    mainSha:'c658bce8c207dcbfdf6c9afa5f304428dd3e31d3',
    response:'Reported missing signed proof', proof:'404'},
  {system:'Devil n Dove',repository:'devilndove-site',
    mainSha:'5017939f3b63e3f63d79a83f34357956cbafd0b4',
    response:'Reported missing proof; no custody or owner TEST verification',proof:'404'},
  {system:'Rosie Dazzlers',repository:'rosiedazzlers',
    mainSha:'79751649527a3b4a887ce252f8a1c5b93a9434bd',
    response:'Reported missing proof; no gateway test or gift resend',proof:'404'},
  {system:'Yard Workers',repository:'yw',
    mainSha:'2c7b07037beb1b0ac239eb1b994cb6a87fd1923e',
    response:'Integration HOLD; original signature and private witness missing',proof:'404'},
  {system:'iCamp',repository:'iCamp',
    mainSha:'32b7c466ad34f7018863c8b837f94c5a3b1103a5',
    response:'Reported tests passing; production build validation still underway when reported',proof:'404'},
  {system:'Rosevear AI Hub',repository:'rosevear-ai-hub',
    mainSha:'9cac2ebcb386bec7dfcf2379acb0998c531c6aa1',
    response:'Software release complete; integration separately held',proof:'404'}
]);
export const QL255_OWNER_RELAY_GATES = Object.freeze({
  originalSignedProofs:0, independentlyPinnedSigners:0,
  independentlyAuthenticatedWitnesses:0, verifiedOwnerTestDecisions:0,
  ownerTestAuthorization:'NOT_GIVEN', ownerPilotAuthorization:'NOT_GIVEN',
  actualGatewayGets:0, scheduledWindows:0, privateMiniServerStarted:false,
  stopAndRollback:'DOCUMENTED SIMULATION ONLY', connections:'DISCONNECTED',
  livePilotHolds:12,writes:0,calls:0,sms:0,dispatch:0
});
