/** QL-251: dated public-GitHub observations and OFFLINE HELD decision gates. */
export const QL251_RELEASE = 'ql251-six-app-proof-witness-owner-test-review-held-v1';
export const QL251_OBSERVED = '28 October 2026 (Eastern)';
export const QL251_SIX_APP_PROOF_SNAPSHOT = Object.freeze([
  { system: 'ai-data-platform', repository: 'ai-data-platform',
    mainSha: '262a2e10cb04660d817b447acd8e91eab780e630', publicProof: '404', advanced: true },
  { system: 'devilndove', repository: 'devilndove-site',
    mainSha: '97b5cf18df25bdfa83e6514d8ce659b24ac2f6f8', publicProof: '404', advanced: true },
  { system: 'rosiedazzlers', repository: 'rosiedazzlers',
    mainSha: '6240e05ff1121fe1df293d5a451f8bea62ae639c', publicProof: '404', advanced: true },
  { system: 'yw', repository: 'yw',
    mainSha: 'aa18edd039f93f021b264e58a34a6139d1d1cb2e', publicProof: '404', advanced: true },
  { system: 'icamp', repository: 'iCamp',
    mainSha: '95307163b14a52ab19d51a89829b0e41497397c7', publicProof: '404', advanced: true },
  { system: 'rosevear-ai-hub', repository: 'rosevear-ai-hub',
    mainSha: '1e82f857f393cb8c6b09264a5e938f8ca2053dd0', publicProof: '404', advanced: true }
]);
export const QL251_TEST_GATE = Object.freeze({
  publishedSignedSourceProofs: 0, exactSourceCiProved: 0,
  originalCustodyWitnessesIndependentlyAttested: 0,
  authenticatedOwnerNonproductionTestDecisions: 0,
  authenticatedGatewayGetPairs: 0, windowsScheduled: 0,
  ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
  connectionState: 'DISCONNECTED', realPilotHolds: 12,
  methods: ['GET'], paths: ['/api/integration/v1/health', '/api/integration/v1/capabilities'],
  writes: 0, calls: 0, sms: 0, dispatch: 0
});
