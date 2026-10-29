/** QL-252 observed public GitHub source receipts; no gateway or owner consent. */
export const QL252_RELEASE = 'ql252-publication-escalation-custody-provenance-owner-test-intake-held-v1';
export const QL252_OBSERVED = '28 October 2026 (Eastern)';
export const QL252_PUBLIC_PROOF_PATH = 'docs/integration/ql246-source-proof.json';
export const QL252_SIX_APP_SOURCE_ESCALATION = Object.freeze([
  { system: 'ai-data-platform', repository: 'ai-data-platform',
    mainSha: '037b18247e59cb68d1f7ca5d7149595bd7487957', publicProof: '404' },
  { system: 'devilndove', repository: 'devilndove-site',
    mainSha: '340d6da39abed229094527dfc91a7fd423fabd02', publicProof: '404' },
  { system: 'rosiedazzlers', repository: 'rosiedazzlers',
    mainSha: '901b01e9c01cbbeac190ae9793b0b5aa29a7c4dd', publicProof: '404' },
  { system: 'yw', repository: 'yw',
    mainSha: 'a4fceebafea8f09fb1f0e71eb1ad99a7a77e3168', publicProof: '404' },
  { system: 'icamp', repository: 'iCamp',
    mainSha: '5f7caaef37a2f8ec8ba2eb2913564e1a3b3c62c9', publicProof: '404' },
  { system: 'rosevear-ai-hub', repository: 'rosevear-ai-hub',
    mainSha: '4faac87c3ae2e4857066d9b819663d49f133b939', publicProof: '404' }
]);
export const QL252_REVIEW_GATES = Object.freeze({
  sourceProofsAtObservedMain: 0, independentlyTrustedCustodyPins: 0,
  independentlyVerifiedOwnerDecisions: 0, originalAuthenticatedGatewayGets: 0,
  scheduledGatewayGetWindows: 0, ownerTestAuthorization: 'NOT_GIVEN',
  ownerPilotAuthorization: 'NOT_GIVEN', connectionState: 'DISCONNECTED',
  realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0
});
