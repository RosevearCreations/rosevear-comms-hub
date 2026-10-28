/** Read-only snapshot of independently inspected GitHub main refs, 28 Oct 2026. */
export const QL247_RELEASE = 'ql247-six-app-github-source-census-owner-safe-connection-preconditions-held-v1';
export const QL247_OBSERVED = '2026-10-28';

export const QL247_SOURCE_CENSUS = [
  { system: 'AI Data Platform', repository: 'ai-data-platform',
    mainSha: '3c73fbbc696ce2b840d4b5b8bab4d59c3dc9b644',
    blocker: 'Missing QL-246 proof and latest app return' },
  { system: 'Devil n Dove', repository: 'devilndove-site',
    mainSha: '80e51fdf31cd9cc2b3fd5303e05adafed8b3d292',
    blocker: 'Missing separately pinned proof and original gateway receipt' },
  { system: 'Rosie Dazzlers', repository: 'rosiedazzlers',
    mainSha: '60d86f86456c6a0949b701ace72eb2746a7045dc',
    blocker: 'Independent receipt and seven-denial witness pending' },
  { system: 'Yard Workers', repository: 'yw',
    mainSha: '2e9327bd436fb395d204efcb856381e40906f0cc',
    blocker: 'Build 477 promotion and issued tenant proof pending' },
  { system: 'iCamp', repository: 'iCamp',
    mainSha: '9f175a16135dc0acdb499a962ec747a1a52df90c',
    blocker: 'Independent campground receipt and key custody pending' },
  { system: 'Rosevear AI Hub', repository: 'rosevear-ai-hub',
    mainSha: '7c098e0d895b4a82af26871056eaef3cc67ff97b',
    blocker: 'Private nonproduction test runner, key and audit not provisioned' }
] as const;

export const QL247_DECISION = Object.freeze({
  actualConnection: 'DISCONNECTED', actualOwnerApproval: 'NOT GIVEN',
  genuinePublicProofs: 0, independentlyVerifiedSignatures: 0,
  livePilotHolds: 12, calls: 0, sms: 0, writes: 0, dispatch: 0
});
