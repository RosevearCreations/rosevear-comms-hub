/** QL-254 dated immutable public GitHub source check, never real gateway state. */
export const QL254_RELEASE = 'ql254-original-proof-witness-private-relay-readiness-held-v1';
export const QL254_OBSERVED = '28 October 2026, 11:42 p.m. Eastern';
export const QL254_PUBLIC_PROOF_PATH = 'docs/integration/ql246-source-proof.json';
export const QL254_SIX_APP_FOLLOWUP = Object.freeze([
  { system: 'AI Data Platform', repository: 'ai-data-platform',
    mainSha: '9e570d82707fd476b43458fa869776bac9ddc65f', proof: '404' },
  { system: 'Devil n Dove', repository: 'devilndove-site',
    mainSha: 'ae145e67d526119a90612e8e4151dc84416d1446', proof: '404' },
  { system: 'Rosie Dazzlers', repository: 'rosiedazzlers',
    mainSha: '056de275482a3b4a00e17610f634b1b79f3490c0', proof: '404' },
  { system: 'Yard Workers', repository: 'yw',
    mainSha: '37cac7dc25caa153088f0b58a76df98b23539730', proof: '404' },
  { system: 'iCamp', repository: 'iCamp',
    mainSha: '19db62c90a12bf48da74e4e063fb16c3b6f6c1ce', proof: '404' },
  { system: 'Rosevear AI Hub', repository: 'rosevear-ai-hub',
    mainSha: 'd2cab6dfa98be39c8dd2775a020fe8c644768ceb', proof: '404' }
]);
export const QL254_GATES = Object.freeze({
  publicOriginalProofs: 0, independentlyTrustedPins: 0,
  independentlyVerifiedWitnesses: 0, ownerTestAuthorization: 'NOT_GIVEN',
  ownerPilotAuthorization: 'NOT_GIVEN', verifiedGatewayGetPairs: 0,
  privateRelayActuallyEnabled: false, privateRelayRehearsal: 'OFFLINE ONLY / HELD',
  connectionState: 'DISCONNECTED', livePilotHolds: 12,
  writes: 0, calls: 0, sms: 0, dispatch: 0
});
