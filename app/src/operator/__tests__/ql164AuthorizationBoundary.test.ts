import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  reviewQl163ExceptionOwnerDecisionBoundary,
  type Ql163DecisionContinuityReview
} from '../ql163ExceptionOwnerDecisionBoundary';
import {
  reviewQl162OwnerCriteriaAndHoldContinuity,
  type Ql162DecisionCriteriaReview
} from '../ql162OwnerCriteriaHoldContinuity';

// The QL-162 replay is an independent fixture in these tests. The production
// reviewer still calls the real QL-162 implementation; only this test module
// replaces it so deliberate tampering can be tested deterministically.
vi.mock('../ql162OwnerCriteriaHoldContinuity', () => ({
  reviewQl162OwnerCriteriaAndHoldContinuity: vi.fn()
}));

const gateIds = [
  'ql162-source-contract', 'ql162-independent-replay',
  'ql162-recount-outcome', 'ql162-owner-criteria',
  'ql162-hold-continuity', 'ql162-follow-up-parity',
  'ql162-zero-open-holds', 'ql162-owner-boundary',
  'ql162-no-live-side-effects'
] as const;

const ownerIds = [
  'ql156-owner-identity', 'ql156-evidence-provenance',
  'ql156-hold-disposition', 'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

function fixture(holds: string[] = ['synthetic-hold-a']): Ql162DecisionCriteriaReview {
  const gates = gateIds.map(id => ({
    id,
    status: id === 'ql162-zero-open-holds' && holds.length > 0 ? 'blocked' as const : 'pass' as const,
    requirement: `Evidence for ${id}`,
    ifBlocked: `Hold pending for ${id}`
  }));
  return {
    build: 'QL-162', reviewedBuild: 'QL-161',
    mode: 'public_synthetic_owner_criteria_reconciliation_only',
    sourceIntegrityVerified: true,
    outcome: holds.length === 0 ? 'synthetic_criteria_reconciled_only' :
      'synthetic_owner_decision_hold_review_blocked',
    gates,
    summary: {
      passed: gates.filter(item => item.status === 'pass').length,
      blocked: gates.filter(item => item.status === 'blocked').length
    },
    ownerCriteria: ownerIds.map(id => ({
      id, requirement: `Separate private human approval for ${id}`,
      status: 'documented_not_approved' as const,
      actualEvidenceVerified: false as const,
      ownerSignOffRecorded: false as const
    })),
    sourceHoldIds: [...holds], replayedHoldIds: [...holds],
    outstandingHoldIds: [...holds],
    followUps: holds.map(holdId => ({
      holdId, proposedRoute: 'synthetic_integrity_review' as const,
      requiredEvidence: `Independent evidence for ${holdId}`,
      status: 'open_manual_review_required' as const,
      independentlyVerifiedEvidence: false as const,
      humanOwnerDecisionRecorded: false as const,
      closurePermitted: false as const,
      escalationDispatched: false as const
    })),
    externalEvidenceVerified: false, realOwnerIdentified: false,
    ownerAuthorizationRecorded: false, consentRecorded: false,
    realHoldClosed: false, realEscalationDispatched: false,
    durableAuditWritten: false, exportEnabled: false,
    downloadEnabled: false, canTransmit: false, livePhoneSmsEnabled: false,
    notice: 'Synthetic fixture, not human approval.'
  };
}

type RemainingInputs = Parameters<typeof reviewQl163ExceptionOwnerDecisionBoundary> extends
  [Ql162DecisionCriteriaReview, ...infer Rest] ? Rest : never;

function runReview(
  actual: Ql162DecisionCriteriaReview,
  independentReplay: Ql162DecisionCriteriaReview,
  priorHoldIds: string[]
): Ql163DecisionContinuityReview {
  vi.mocked(reviewQl162OwnerCriteriaAndHoldContinuity).mockReturnValue(independentReplay);
  const previous = [
    {
      outstandingHoldIds: priorHoldIds,
      ownerDecisionRecorded: false, externalEvidenceAttested: false,
      realExceptionClosed: false, realEscalationSent: false,
      canTransmit: false, livePhoneSmsEnabled: false
    },
    { outstandingHoldIds: priorHoldIds },
    { unresolvedHoldIds: priorHoldIds },
    { outstandingHoldIds: priorHoldIds },
    { outstandingHoldIds: priorHoldIds },
    { outstandingHoldIds: priorHoldIds },
    { outstandingHoldIds: priorHoldIds },
    { unresolvedHoldIds: priorHoldIds },
    { outstandingHoldIds: priorHoldIds },
    { outstandingHoldIds: priorHoldIds },
    { preservedHoldIds: priorHoldIds },
    { outstandingHoldIds: priorHoldIds },
    { unresolvedHoldIds: priorHoldIds }
  ] as unknown as RemainingInputs;
  return reviewQl163ExceptionOwnerDecisionBoundary(actual, ...previous);
}

function tamper(
  change: (candidate: Ql162DecisionCriteriaReview & Record<string, unknown>) => void,
  holds = ['synthetic-hold-a']
): Ql163DecisionContinuityReview {
  const canonical = fixture(holds);
  const changed = structuredClone(canonical) as Ql162DecisionCriteriaReview & Record<string, unknown>;
  change(changed);
  return runReview(changed, canonical, holds);
}

function expectOperationalLock(review: Ql163DecisionContinuityReview) {
  expect(review.followUpAuthorized).toBe(false);
  expect(review.escalationDispatched).toBe(false);
  expect(review.realHoldClosed).toBe(false);
  expect(review.humanDecisionRecorded).toBe(false);
  expect(review.authenticatedHumanOwner).toBe(false);
  expect(review.consentRecorded).toBe(false);
  expect(review.canTransmit).toBe(false);
  expect(review.exportEnabled).toBe(false);
  expect(review.downloadEnabled).toBe(false);
  expect(review.durableAuditWritten).toBe(false);
  expect(review.livePhoneSmsEnabled).toBe(false);
  expect(review.followUps.every(item =>
    !item.authorizedToFollowUp && !item.authorizedToDispatch && !item.authorizedToClose
  )).toBe(true);
}

beforeEach(() => vi.resetAllMocks());

describe('QL-164 synthetic owner authorization regression', () => {
  it('retains a valid held follow-up without permission to act', () => {
    const source = fixture();
    const review = runReview(source, structuredClone(source), ['synthetic-hold-a']);
    expect(review.sourceIntegrityVerified).toBe(true);
    expect(review.gates).toHaveLength(9);
    expect(review.outstandingHoldIds).toContain('synthetic-hold-a');
    expect(review.followUps[0].requiredEvidence).toBe('Independent evidence for synthetic-hold-a');
    expect(review.outcome).toBe('synthetic_follow_up_authorization_held');
    expectOperationalLock(review);
  });

  it('does not issue authorization even when every synthetic gate passes', () => {
    const source = fixture([]);
    const review = runReview(source, structuredClone(source), []);
    expect(review.sourceIntegrityVerified).toBe(true);
    expect(review.summary).toEqual({ passed: 9, blocked: 0 });
    expect(review.outcome).toBe('synthetic_evidence_continuity_only');
    expectOperationalLock(review);
  });

  it.each([
    ['source gate removed', (v: any) => { v.gates.pop(); }],
    ['source blocker changed', (v: any) => { v.gates[0].ifBlocked = 'Suppressed'; }],
    ['summary count altered', (v: any) => { v.summary.passed = 9; }],
    ['outcome forged', (v: any) => { v.outcome = 'synthetic_criteria_reconciled_only'; }],
    ['hold omitted', (v: any) => { v.outstandingHoldIds = []; }],
    ['hold duplicated', (v: any) => { v.outstandingHoldIds.push('synthetic-hold-a'); }],
    ['follow-up evidence changed', (v: any) => { v.followUps[0].requiredEvidence = 'None'; }],
    ['follow-up route changed', (v: any) => { v.followUps[0].proposedRoute = 'wrong_route'; }],
    ['follow-up closure forged', (v: any) => { v.followUps[0].closurePermitted = true; }],
    ['follow-up dispatch forged', (v: any) => { v.followUps[0].escalationDispatched = true; }],
    ['owner sign-off forged', (v: any) => { v.ownerCriteria[0].ownerSignOffRecorded = true; }],
    ['owner authorization forged', (v: any) => { v.ownerAuthorizationRecorded = true; }]
  ])('fails closed when %s', (_name, edit) => {
    const review = tamper(edit);
    expect(review.sourceIntegrityVerified).toBe(false);
    expect(review.outstandingHoldIds).toContain('ql163-evidence-continuity-integrity-hold');
    expect(review.outstandingHoldIds).toContain('synthetic-hold-a');
    expect(review.outcome).toBe('synthetic_follow_up_authorization_held');
    expectOperationalLock(review);
  });
});
