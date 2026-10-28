/** QL250 dated, PUBLIC source-only observation. Nothing here grants a connection. */
export const QL250_RELEASE = 'ql250-independent-six-app-source-refresh-pin-custody-window-witness-held-v1';
export const QL250_OBSERVED = '28 October 2026 (Eastern)';
export const QL250_SOURCE_REFRESH = Object.freeze([
  { system: 'ai-data-platform', repository: 'ai-data-platform',
    mainSha: 'aad88d820faa86d7115d9c19b5fd0d3507da9dcd', proof: '404', changedSinceQl249: true },
  { system: 'devilndove', repository: 'devilndove-site',
    mainSha: '23f564a974dc6e0b0c52b1ca24616d2697857e4f', proof: '404', changedSinceQl249: true },
  { system: 'rosiedazzlers', repository: 'rosiedazzlers',
    mainSha: '636159d033aa9764987d01eae7f1100c2c689c7a', proof: '404', changedSinceQl249: true },
  { system: 'yw', repository: 'yw',
    mainSha: '3f4668416dcafa2612767a79ad4e06840112ac37', proof: '404', changedSinceQl249: true },
  { system: 'icamp', repository: 'iCamp',
    mainSha: '371abeec1e65c1809d059cafcb81136a0b6d369a', proof: '404', changedSinceQl249: true },
  { system: 'rosevear-ai-hub', repository: 'rosevear-ai-hub',
    mainSha: '44c48f56c039ff539a98965eaa1d5a6b5c188ed4', proof: '404', changedSinceQl249: true }
]);

export const QL250_READ_ONLY_GATES = Object.freeze({
  publicProofsPresent: 0, sourceCiForSignedProofObserved: 0,
  independentlyPinnedSignerCustody: 0, authenticatedTestOnlyOwnerDecisions: 0,
  gatewayGetWindowsScheduled: 0, independentlyWitnessedGatewayGets: 0,
  connectionState: 'DISCONNECTED', ownerTestAuthorization: 'NOT_GIVEN',
  ownerPilotAuthorization: 'NOT_GIVEN', realPilotHolds: 12,
  methods: ['GET'], paths: ['/api/integration/v1/health', '/api/integration/v1/capabilities'],
  writes: 0, calls: 0, sms: 0, dispatch: 0
});
