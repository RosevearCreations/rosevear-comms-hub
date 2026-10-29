/** QL-253 dated public-only observations. Never a live gateway connection. */
export const QL253_RELEASE = 'ql253-six-app-origin-pin-registry-owner-test-exception-held-v1';
export const QL253_OBSERVED = '28 October 2026, 10:43 p.m. Eastern';
export const QL253_PUBLIC_PROOF_PATH = 'docs/integration/ql246-source-proof.json';
export const QL253_SIX_APP_ORIGIN_RECHECK = Object.freeze([
  { system: 'AI Data Platform', repository: 'ai-data-platform',
    mainSha: '76f73363a9a29a34ed8bf09b6b4ff58a0dc77482', publicProof: '404' },
  { system: 'Devil n Dove', repository: 'devilndove-site',
    mainSha: '962cd59efe8ebfeda623b6f82b95c030adfc3ab4', publicProof: '404' },
  { system: 'Rosie Dazzlers', repository: 'rosiedazzlers',
    mainSha: '65c3654309426c0e654262e7a9d46a113d1ed6a4', publicProof: '404' },
  { system: 'Yard Workers', repository: 'yw',
    mainSha: '25436da1c91a374f7ebd195508a33fdee259873e', publicProof: '404' },
  { system: 'iCamp', repository: 'iCamp',
    mainSha: '4397a1d74a7a058b64cc9a991fd3ccfd42c02d39', publicProof: '404' },
  { system: 'Rosevear AI Hub', repository: 'rosevear-ai-hub',
    mainSha: 'f81dc739b8af0bcd6c8ffae00aa5ecc9b9dd197d', publicProof: '404' }
]);
export const QL253_TRUST_AND_TEST_GATES = Object.freeze({
  publishedProofsAtSnapshot: 0, independentlyPinnedKeys: 0,
  independentCustodyWitnesses: 0, authenticatedOwnerTestApprovals: 0,
  authenticatedGatewayGets: 0, ownerTestAuthorization: 'NOT_GIVEN',
  ownerPilotAuthorization: 'NOT_GIVEN', connectionState: 'DISCONNECTED',
  miniServerRole: 'OPTIONAL PRIVATE RELAY DESIGN ONLY / HELD',
  miniServerPublicInbound: false, miniServerVaultExposure: false,
  realPilotHolds: 12, writes: 0, calls: 0, sms: 0, dispatch: 0
});
