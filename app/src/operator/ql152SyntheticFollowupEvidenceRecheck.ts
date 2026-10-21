import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import {
  reviewQl151IndependentFollowUps,
  type Ql151IndependentFollowUpReview
} from './ql151SyntheticHoldContinuityFollowup';

export type Ql152RecheckGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  ifBlocked: string;
};

export type Ql152HoldResolutionCandidate = {
  id: string;
  disposition: 'hold_open_pending_independent_evidence';
  evidenceRequirement: string;
  closurePermitted: false;
};

export type Ql152FollowUpEvidenceRecheck = {
  build: 'QL-152';
  reviewedBuild: 'QL-151';
  mode: 'synthetic_public_read_only';
  sourceReconciled: boolean;
  outcome: 'synthetic_follow_up_criteria_only' | 'resolution_review_blocked';
  gates: readonly Ql152RecheckGate[];
  summary: { passed: number; blocked: number };
  originalHoldIds: readonly string[];
  reproducedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  resolutionCandidates: readonly Ql152HoldResolutionCandidate[];
  independentRealWorldEvidenceVerified: false;
  actualHoldResolved: false;
  ownerAcceptanceRecorded: false;
  consentCaptured: false;
  evidencePersisted: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  liveCommunicationsEnabled: false;
  notice: string;
};

const EXPECTED_Ql151 = [
  'ql151-lineage',
  'ql151-counts',
  'ql151-hold-preservation',
  'ql151-hold-reconciliation',
  'ql151-outcome',
  'ql151-zero-open-holds',
  'ql151-runtime-lock'
] as const;

function gate(
  id: string,
  requirement: string,
  ok: boolean,
  ifBlocked: string
): Ql152RecheckGate {
  return { id, status: ok ? 'pass' : 'blocked', requirement, ifBlocked };
}

// Independently recomputes the prior synthetic reviewer in memory. It does not
// fetch independent real-world evidence, record a human decision, or resolve a hold.
export function recheckQl152SyntheticFollowUpEvidence(
  source: Ql151IndependentFollowUpReview,
  priorContinuity: Ql150AcceptanceContinuity,
  priorAcceptance: Ql149IndependentAcceptance
): Ql152FollowUpEvidenceRecheck {
  const replay = reviewQl151IndependentFollowUps(priorContinuity, priorAcceptance);
  const sourceIds = source.checks.map(item => item.id);
  const sourceContract =
    source.build === 'QL-151' &&
    source.reviewedBuild === 'QL-150' &&
    source.mode === 'public_synthetic_review_only' &&
    source.checks.length === EXPECTED_Ql151.length &&
    new Set(sourceIds).size === EXPECTED_Ql151.length &&
    EXPECTED_Ql151.every(id => sourceIds.includes(id));

  const replayMatches = sourceContract &&
    source.checks.every(current => replay.checks.some(expected =>
      current.id === expected.id &&
      current.status === expected.status &&
      current.evidence === expected.evidence &&
      current.followUpIfBlocked === expected.followUpIfBlocked
    ));

  const counts = {
    passed: source.checks.filter(item => item.status === 'pass').length,
    blocked: source.checks.filter(item => item.status === 'blocked').length
  };
  const totalsAndOutcomeMatch = replayMatches &&
    counts.passed === source.summary.passed &&
    counts.blocked === source.summary.blocked &&
    counts.passed === replay.summary.passed &&
    counts.blocked === replay.summary.blocked &&
    source.outcome === replay.outcome;

  const originalIds = [...new Set(source.preservedHoldIds)];
  const reproducedIds = [...new Set(replay.preservedHoldIds)];
  const sourceHoldsUnique = originalIds.length === source.preservedHoldIds.length;
  const holdContinuity =
    sourceHoldsUnique &&
    reproducedIds.length === originalIds.length &&
    reproducedIds.every(id => originalIds.includes(id)) &&
    priorContinuity.outstandingHoldIds.every(id => originalIds.includes(id)) &&
    priorAcceptance.unresolvedHoldIds.every(id => originalIds.includes(id));

  const followUpIntegrity =
    source.followUps.length === originalIds.length &&
    new Set(source.followUps.map(item => item.id)).size === originalIds.length &&
    originalIds.every(id => source.followUps.some(item =>
      item.id === id &&
      item.status === 'open_for_synthetic_review' &&
      item.restriction === 'no_auto_closure_or_persistence' &&
      item.action.length > 0
    )) &&
    source.followUps.every(item => replay.followUps.some(expected =>
      item.id === expected.id &&
      item.action === expected.action &&
      item.status === expected.status &&
      item.restriction === expected.restriction
    ));

  const noRealChanges =
    source.independentOwnerAcceptance === false &&
    source.actualHoldClosed === false &&
    source.consentCaptured === false &&
    source.evidencePersisted === false &&
    source.exportEnabled === false &&
    source.canTransmit === false &&
    source.liveCommunicationsEnabled === false &&
    replay.independentOwnerAcceptance === false &&
    replay.actualHoldClosed === false &&
    replay.consentCaptured === false &&
    replay.evidencePersisted === false &&
    replay.exportEnabled === false &&
    replay.canTransmit === false &&
    replay.liveCommunicationsEnabled === false &&
    priorContinuity.closureRecorded === false &&
    priorContinuity.acceptanceRecorded === false &&
    priorContinuity.ownerApprovalGranted === false &&
    priorContinuity.storedAuditLog === false &&
    priorContinuity.exportEnabled === false &&
    priorContinuity.downloadEnabled === false &&
    priorContinuity.canTransmit === false &&
    priorContinuity.liveCommunicationsEnabled === false &&
    priorAcceptance.acceptanceRecorded === false &&
    priorAcceptance.realExceptionClosed === false &&
    priorAcceptance.ownerApprovalGranted === false &&
    priorAcceptance.persistedAuditLog === false &&
    priorAcceptance.exportEnabled === false &&
    priorAcceptance.liveCommunicationsEnabled === false;

  const cleanSyntheticCriteria =
    totalsAndOutcomeMatch &&
    holdContinuity &&
    followUpIntegrity &&
    originalIds.length === 0 &&
    counts.blocked === 0 &&
    priorContinuity.summary.blocked === 0 &&
    priorContinuity.sourceIntegrityVerified &&
    priorAcceptance.summary.blocked === 0 &&
    source.outcome === 'criteria_satisfied_synthetic_only';

  const sourceReconciled =
    sourceContract && replayMatches && totalsAndOutcomeMatch &&
    holdContinuity && followUpIntegrity && noRealChanges;

  const gates: readonly Ql152RecheckGate[] = [
    gate('ql152-lineage', 'Exact seven QL-151 review IDs and source lineage', sourceContract,
      'Rebuild the QL-151 synthetic review from its approved input.'),
    gate('ql152-independent-replay', 'Every gate status and review description replays exactly', replayMatches,
      'Hold the decision and recheck source checks independently.'),
    gate('ql152-count-outcome', 'Independent gate totals and outcome reconcile', totalsAndOutcomeMatch,
      'Do not accept a passing label without matching evidence.'),
    gate('ql152-preserved-holds', 'All open hold identifiers persist across QL-149 to QL-151 and the replay',
      holdContinuity, 'Restore missing or duplicate IDs; do not silently clear holds.'),
    gate('ql152-follow-up-integrity', 'Every unresolved hold has exactly one unchanged synthetic follow-up',
      followUpIntegrity, 'Keep the hold open and restore its proposed follow-up.'),
    gate('ql152-synthetic-resolution-criteria', 'No blocked gate or unresolved hold remains in the synthetic fixture',
      cleanSyntheticCriteria, 'Require new independent synthetic review evidence before considering a new decision.'),
    gate('ql152-no-real-resolution', 'No stored audit, approval, closure, export, download or live communications',
      noRealChanges, 'Stop any unauthorized side-effect before another synthetic review.')
  ];

  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };

  const outstandingHoldIds = [...new Set([
    ...originalIds,
    ...reproducedIds,
    ...priorContinuity.outstandingHoldIds,
    ...priorAcceptance.unresolvedHoldIds,
    ...(!sourceReconciled ? ['ql152-source-integrity-hold'] : []),
    ...(summary.blocked > 0 && originalIds.length === 0 ? ['ql152-review-criteria-hold'] : [])
  ])];

  const resolutionCandidates: readonly Ql152HoldResolutionCandidate[] =
    outstandingHoldIds.map(id => ({
      id,
      disposition: 'hold_open_pending_independent_evidence' as const,
      evidenceRequirement:
        'An independently reviewed, new synthetic-only source check and explicit later decision criteria are required.',
      closurePermitted: false as const
    }));

  return {
    build: 'QL-152', reviewedBuild: 'QL-151', mode: 'synthetic_public_read_only',
    sourceReconciled,
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_follow_up_criteria_only' : 'resolution_review_blocked',
    gates, summary, originalHoldIds: originalIds, reproducedHoldIds: reproducedIds,
    outstandingHoldIds, resolutionCandidates,
    independentRealWorldEvidenceVerified: false, actualHoldResolved: false,
    ownerAcceptanceRecorded: false, consentCaptured: false,
    evidencePersisted: false, exportEnabled: false,
    downloadEnabled: false, canTransmit: false,
    liveCommunicationsEnabled: false,
    notice: 'Read-only synthetic follow-up replay. Even a passing result does not constitute fresh real-world evidence, owner acceptance, permission to close holds, a stored audit or a production deployment verdict.'
  };
}
