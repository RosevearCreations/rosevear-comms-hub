/** QL248 is a deterministic, public-metadata-only plan, not a connection client. */
export const QL248_RELEASE = 'ql248-proof-commit-independent-pin-offline-reconciliation-held-v1';

export const QL248_STAGES = Object.freeze([
  Object.freeze({ title: 'Audited source SHA', evidence: 'An immutable source commit and matching CI run; signed proof is not yet published.' }),
  Object.freeze({ title: 'Separate proof commit SHA', evidence: 'A later immutable commit contains the nonsecret signed proof; no self-referencing SHA.' }),
  Object.freeze({ title: 'Independent SPKI pin', evidence: 'A public Ed25519 key fingerprint independently received outside the proof file.' }),
  Object.freeze({ title: 'Offline verification', evidence: 'Compare raw proof digest, signed canonical fields, source/tenant scope and key pin.' }),
  Object.freeze({ title: 'Actual nonproduction tests', evidence: 'Separately authorize and witness original GETs, denials, audit persistence and revocation.' }),
  Object.freeze({ title: 'Owner decision', evidence: 'A distinct owner-authenticated pilot release is still required; no automatic enablement.' })
]);

export const QL248_HOLD = Object.freeze({
  offlineSignedProofsAvailable: 0,
  independentlyAuthenticatedPins: 0,
  independentlyVerifiedGateways: 0,
  ownerAuthorization: 'NOT_GIVEN',
  connection: 'DISCONNECTED',
  realPilotHolds: 12,
  writes: 0,
  calls: 0,
  sms: 0,
  dispatch: 0
});
