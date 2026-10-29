import { describe, expect, it } from 'vitest';
import { QL251_SIX_APP_PROOF_SNAPSHOT } from '../ql251WitnessTestReview';
import { QL252_RELEASE, QL252_OBSERVED, QL252_PUBLIC_PROOF_PATH,
  QL252_SIX_APP_SOURCE_ESCALATION, QL252_REVIEW_GATES } from '../ql252ProofEscalationReview';

describe('QL-252 six-app source proof publication escalation and owner-test-only review', () => {
  it('identifies six freshly rechecked sources and the exact publication gap', () => {
    expect(QL252_RELEASE).toContain('ql252');
    expect(QL252_OBSERVED).toContain('2026');
    expect(QL252_PUBLIC_PROOF_PATH).toBe('docs/integration/ql246-source-proof.json');
    expect(QL252_SIX_APP_SOURCE_ESCALATION.map(s => s.repository))
      .toEqual(QL251_SIX_APP_PROOF_SNAPSHOT.map(s => s.repository));
    expect(QL252_SIX_APP_SOURCE_ESCALATION).toHaveLength(6);
    expect(QL252_SIX_APP_SOURCE_ESCALATION.every(s => /^[0-9a-f]{40}$/.test(s.mainSha)))
      .toBe(true);
    expect(QL252_SIX_APP_SOURCE_ESCALATION.every(s => s.publicProof === '404')).toBe(true);
    expect(QL252_SIX_APP_SOURCE_ESCALATION.every((s, i) =>
      s.mainSha !== QL251_SIX_APP_PROOF_SNAPSHOT[i].mainSha)).toBe(true);
  });
  it('never treats signed-looking owner consent or pin provenance as test permission', () => {
    expect(QL252_REVIEW_GATES).toMatchObject({ sourceProofsAtObservedMain: 0,
      independentlyTrustedCustodyPins: 0, independentlyVerifiedOwnerDecisions: 0,
      originalAuthenticatedGatewayGets: 0, scheduledGatewayGetWindows: 0,
      ownerTestAuthorization: 'NOT_GIVEN', ownerPilotAuthorization: 'NOT_GIVEN',
      connectionState: 'DISCONNECTED', realPilotHolds: 12,
      writes: 0, calls: 0, sms: 0, dispatch: 0 });
  });
});
