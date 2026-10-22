// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import {
  summarizeQl168UnresolvedHolds
} from '../ql168UnresolvedHoldPrioritization';
import type { Ql163DecisionContinuityReview } from '../ql163ExceptionOwnerDecisionBoundary';
import { Ql093SafeReadPreview } from '../Ql093SafeReadPreview';

const gateIds = [
  'ql163-source-contract', 'ql163-independent-replay', 'ql163-outcome-integrity',
  'ql163-owner-evidence', 'ql163-hold-lineage', 'ql163-follow-up-evidence',
  'ql163-authorization-boundary', 'ql163-zero-open-holds', 'ql163-no-live-operations'
];
const prerequisiteIds = [
  'ql156-owner-identity', 'ql156-evidence-provenance', 'ql156-hold-disposition',
  'ql156-consent-and-scope', 'ql156-audit-signoff'
];

function fixture(holds: Array<[string, 'synthetic_integrity_review' | 'synthetic_evidence_follow_up']> = [
  ['z-integrity', 'synthetic_integrity_review'],
  ['b-evidence', 'synthetic_evidence_follow_up'],
  ['a-integrity', 'synthetic_integrity_review']
]): Ql163DecisionContinuityReview {
  const gates = gateIds.map(id => ({
    id, status: id === 'ql163-zero-open-holds' && holds.length ? 'blocked' as const : 'pass' as const,
    requirement: `Requirement for ${id}`, ifBlocked: `Keep ${id} blocked`
  }));
  return {
    build: 'QL-163', reviewedBuild: 'QL-162',
    mode: 'public_synthetic_exception_owner_decision_continuity_only',
    sourceIntegrityVerified: true,
    outcome: holds.length ? 'synthetic_follow_up_authorization_held' : 'synthetic_evidence_continuity_only',
    gates, summary: { passed: gates.filter(g => g.status === 'pass').length, blocked: gates.filter(g => g.status === 'blocked').length },
    sourceHoldIds: holds.map(([id]) => id), replayedHoldIds: holds.map(([id]) => id),
    outstandingHoldIds: holds.map(([id]) => id),
    ownerEvidenceRequirements: prerequisiteIds.map(id => ({
      id, requirement: `Private owner evidence for ${id}`,
      evidenceState: 'not_independently_verified' as const,
      humanDecisionState: 'not_recorded' as const,
      authorizesFollowUp: false as const
    })),
    followUps: holds.map(([holdId, proposedRoute]) => ({
      holdId, proposedRoute, requiredEvidence: `Independent synthetic evidence for ${holdId}`,
      provenance: 'QL-162 synthetic follow-up' as const,
      status: 'open_pending_separate_human_review' as const,
      evidenceVerified: false as const, ownerDecisionRecorded: false as const,
      authorizedToFollowUp: false as const, authorizedToDispatch: false as const,
      authorizedToClose: false as const
    })),
    independentlyVerifiedRealEvidence: false, authenticatedHumanOwner: false,
    humanDecisionRecorded: false, consentRecorded: false, followUpAuthorized: false,
    escalationDispatched: false, realHoldClosed: false, durableAuditWritten: false,
    exportEnabled: false, downloadEnabled: false, canTransmit: false,
    livePhoneSmsEnabled: false, notice: 'Synthetic review only'
  };
}

function assertNoAction(summary: ReturnType<typeof summarizeQl168UnresolvedHolds>) {
  expect(summary.actualPriorityOrUrgencyEstablished).toBe(false);
  expect(summary.authorizedToFollowUp).toBe(false);
  expect(summary.authorizedToDispatch).toBe(false);
  expect(summary.authorizedToClose).toBe(false);
  expect(summary.canWriteOrExport).toBe(false);
  expect(summary.livePhoneSmsEnabled).toBe(false);
  expect(summary.lanes.flatMap(lane => lane.heldEvidence).every(item => item.status === 'open_not_authorized')).toBe(true);
}

describe('QL-168 synthetic hold prioritization and evidence summary', () => {
  it('groups deterministic review order by integrity versus evidence blockers', () => {
    const result = summarizeQl168UnresolvedHolds(fixture());
    expect(result.sourceIntegrityVerified).toBe(true);
    expect(result.outstandingHoldIds).toEqual(['a-integrity', 'b-evidence', 'z-integrity']);
    expect(result.lanes.map(lane => [lane.reviewOrder, lane.id, lane.holdIds])).toEqual([
      [1, 'integrity', ['a-integrity', 'z-integrity']],
      [2, 'evidence', ['b-evidence']]
    ]);
    expect(result.blockedGates.map(gate => gate.id)).toEqual(['ql163-zero-open-holds']);
    assertNoAction(result);
  });

  it('lists the five unsigned owner prerequisites for every unresolved hold', () => {
    const result = summarizeQl168UnresolvedHolds(fixture());
    expect(result.ownerPrerequisites.map(item => item.id)).toEqual(prerequisiteIds);
    expect(result.ownerPrerequisites.every(item =>
      item.affectedHoldIds.length === 3 &&
      item.evidenceState === 'not_independently_verified' &&
      item.humanDecisionState === 'not_recorded'
    )).toBe(true);
  });

  it('is stable when input holds and requirements are reordered', () => {
    const source = fixture();
    const reordered = structuredClone(source);
    reordered.outstandingHoldIds = [...reordered.outstandingHoldIds].reverse();
    reordered.followUps = [...reordered.followUps].reverse();
    reordered.ownerEvidenceRequirements = [...reordered.ownerEvidenceRequirements].reverse();
    const a = summarizeQl168UnresolvedHolds(source);
    const b = summarizeQl168UnresolvedHolds(reordered);
    expect(b.lanes).toEqual(a.lanes);
    expect(b.ownerPrerequisites).toEqual(a.ownerPrerequisites);
  });

  it('shows a truthful zero-hold fixture without authorizing action', () => {
    const result = summarizeQl168UnresolvedHolds(fixture([]));
    expect(result.sourceIntegrityVerified).toBe(true);
    expect(result.outstandingHoldIds).toEqual([]);
    expect(result.lanes.every(lane => lane.holdIds.length === 0)).toBe(true);
    assertNoAction(result);
  });

  it.each([
    ['missing follow-up', (value: any) => { value.followUps.pop(); }],
    ['duplicate hold ID', (value: any) => { value.outstandingHoldIds.push('a-integrity'); }],
    ['invented follow-up route', (value: any) => { value.followUps[0].proposedRoute = 'dispatch_now'; }],
    ['forged owner decision', (value: any) => { value.ownerEvidenceRequirements[0].humanDecisionState = 'signed'; }],
    ['missing prerequisite', (value: any) => { value.ownerEvidenceRequirements.pop(); }],
    ['unexpected gate', (value: any) => { value.gates[0].id = 'approval-gate'; }],
    ['malformed gate status', (value: any) => { value.gates[0].status = 'approved'; value.summary.passed -= 1; }],
    ['incorrect gate counts', (value: any) => { value.summary.blocked = 0; }],
    ['forged outcome', (value: any) => { value.outcome = 'synthetic_evidence_continuity_only'; }],
    ['changed source hold lineage', (value: any) => { value.sourceHoldIds.pop(); }],
    ['missing evidence text', (value: any) => { delete value.followUps[0].requiredEvidence; }],
    ['forged dispatch permission', (value: any) => { value.followUps[0].authorizedToDispatch = true; }],
    ['forged closure permission', (value: any) => { value.realHoldClosed = true; }],
    ['unverified source', (value: any) => { value.sourceIntegrityVerified = false; }]
  ])('fails closed when %s', (_name, tamper) => {
    const input = structuredClone(fixture());
    tamper(input);
    const result = summarizeQl168UnresolvedHolds(input);
    expect(result.sourceIntegrityVerified).toBe(false);
    expect(result.integrityWarning).toContain('Every listed hold stays');
    expect(result.lanes[0].holdIds).toEqual(result.outstandingHoldIds);
    expect(result.lanes[1].holdIds).toHaveLength(0);
    expect(result.ownerPrerequisites.every(item => item.humanDecisionState === 'not_recorded')).toBe(true);
    expect(result.blockedGates.map(gate => gate.id)).toEqual(['ql168-source-integrity-hold']);
    assertNoAction(result);
  });

  it('renders a read-only, accessible QL-168 summary with no action controls', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<Ql093SafeReadPreview />));
      await act(async () => host.querySelector<HTMLButtonElement>('.ql093-toggle')!.click());
      const panel = host.querySelector<HTMLElement>('[aria-label="QL-168 unresolved hold prioritization and evidence summary"]');
      expect(panel).not.toBeNull();
      expect(panel?.querySelector('h3')?.textContent).toContain('Unresolved holds grouped by blocker and prerequisite');
      expect(panel?.querySelectorAll('.ql168-lane')).toHaveLength(2);
      expect(panel?.textContent).toContain('Private owner-decision prerequisites');
      expect(panel?.textContent).toContain('No actual priority, follow-up or dispatch');
      expect(panel?.querySelectorAll('button, input, select, form')).toHaveLength(0);
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });
});
