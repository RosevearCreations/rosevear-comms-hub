import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import type { Ql153ReadinessReview } from './ql153SyntheticResolutionReadiness';
import {
  reviewQl154IndependentDecisionContinuity,
  type Ql154IndependentDecisionReview
} from './ql154SyntheticDecisionEvidenceContinuity';

export type Ql155FollowUpGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  followUpIfBlocked: string;
};
export type Ql155HoldAuditCandidate = {
  id: string;
  disposition: 'hold_open_for_later_independent_review';
  evidenceRequired: string;
  ownerReviewRequired: true;
  actualClosureAuthorized: false;
};
export type Ql155SyntheticAuditReadiness = {
  build: 'QL-155';
  reviewedBuild: 'QL-154';
  mode: 'synthetic_audit_readiness_only';
  sourceIntegrityVerified: boolean;
  outcome: 'synthetic_audit_criteria_met_only' | 'synthetic_audit_follow_up_held';
  checks: readonly Ql155FollowUpGate[];
  summary: { passed: number; blocked: number };
  originalHoldIds: readonly string[];
  independentlyReplayedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  followUpCandidates: readonly Ql155HoldAuditCandidate[];
  durableAuditRecorded: false;
  ownerApprovalCaptured: false;
  actualExceptionClosed: false;
  evidencePersisted: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  liveCommunicationsEnabled: false;
  notice: string;
};

const EXPECTED_QL154 = [
  'ql154-lineage',
  'ql154-independent-replay',
  'ql154-outcome-reconciliation',
  'ql154-hold-parity',
  'ql154-no-lost-holds',
  'ql154-decision-drafts',
  'ql154-zero-open-holds',
  'ql154-no-live-runtime'
] as const;

function gate(id: string, requirement: string, passed: boolean, followUpIfBlocked: string): Ql155FollowUpGate {
  return { id, requirement, status: passed ? 'pass' : 'blocked', followUpIfBlocked };
}

// Independent in-memory review of QL-154 from existing public/synthetic fixtures.
// This models audit readiness criteria but creates NO actual durable audit log.
export function reviewQl155SyntheticAuditFollowUp(
  source: Ql154IndependentDecisionReview,
  resolution: Ql153ReadinessReview,
  evidence: Ql152FollowUpEvidenceRecheck,
  followUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql155SyntheticAuditReadiness {
  const replay = reviewQl154IndependentDecisionContinuity(
    resolution, evidence, followUps, continuity, acceptance
  );
  const ids = source.gates.map(item => item.id);
  const exactContract =
    source.build === 'QL-154' &&
    source.reviewedBuild === 'QL-153' &&
    source.mode === 'read_only_synthetic_evidence_continuity' &&
    source.gates.length === EXPECTED_QL154.length &&
    new Set(ids).size === EXPECTED_QL154.length &&
    EXPECTED_QL154.every(id => ids.includes(id));

  const independentReplay = exactContract &&
    source.gates.every(actual => replay.gates.some(expected =>
      actual.id === expected.id &&
      actual.status === expected.status &&
      actual.requirement === expected.requirement &&
      actual.ifBlocked === expected.ifBlocked
    ));
  const recomputed = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const outcomeReconciled = independentReplay &&
    recomputed.passed === source.summary.passed &&
    recomputed.blocked === source.summary.blocked &&
    recomputed.passed === replay.summary.passed &&
    recomputed.blocked === replay.summary.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const originalHoldIds = [...new Set(source.unresolvedHoldIds)];
  const independentlyReplayedHoldIds = [...new Set(replay.unresolvedHoldIds)];
  const priorHolds = [...new Set([
    ...resolution.outstandingHoldIds,
    ...evidence.outstandingHoldIds,
    ...followUps.preservedHoldIds,
    ...continuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const uniqueSourceHolds = originalHoldIds.length === source.unresolvedHoldIds.length;
  const holdContinuity =
    uniqueSourceHolds &&
    independentlyReplayedHoldIds.length === originalHoldIds.length &&
    independentlyReplayedHoldIds.every(id => originalHoldIds.includes(id)) &&
    priorHolds.every(id => originalHoldIds.includes(id));

  const heldEvidenceValid =
    holdContinuity &&
    source.heldEvidence.length === originalHoldIds.length &&
    new Set(source.heldEvidence.map(item => item.id)).size === originalHoldIds.length &&
    originalHoldIds.every(id => source.heldEvidence.some(item =>
      item.id === id && item.disposition === 'unresolved_synthetic_hold' &&
      item.actualClosureAuthorized === false && item.nextReview.length > 0
    )) &&
    source.heldEvidence.every(actual => replay.heldEvidence.some(expected =>
      actual.id === expected.id &&
      actual.disposition === expected.disposition &&
      actual.nextReview === expected.nextReview &&
      actual.actualClosureAuthorized === expected.actualClosureAuthorized
    ));

  const noSideEffects =
    source.independentRealWorldEvidenceVerified === false &&
    source.actualHoldClosed === false &&
    source.ownerApprovalCaptured === false &&
    source.consentCaptured === false &&
    source.durableAuditWritten === false &&
    source.exportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.livePhoneSmsEnabled === false &&
    replay.independentRealWorldEvidenceVerified === false &&
    replay.actualHoldClosed === false &&
    replay.ownerApprovalCaptured === false &&
    replay.consentCaptured === false &&
    replay.durableAuditWritten === false &&
    replay.exportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.livePhoneSmsEnabled === false &&
    resolution.realOwnerApproval === false &&
    resolution.actualHoldClosure === false &&
    resolution.evidencePersisted === false &&
    resolution.exportEnabled === false &&
    resolution.downloadEnabled === false &&
    resolution.canTransmit === false &&
    resolution.liveCommunicationsEnabled === false;

  const sourceIntegrityVerified =
    exactContract && independentReplay && outcomeReconciled &&
    holdContinuity && heldEvidenceValid && noSideEffects;
  const noUnresolvedHolds =
    sourceIntegrityVerified &&
    source.sourceIntegrityVerified &&
    originalHoldIds.length === 0 &&
    priorHolds.length === 0 &&
    recomputed.blocked === 0 &&
    resolution.summary.blocked === 0 &&
    evidence.summary.blocked === 0 &&
    followUps.summary.blocked === 0 &&
    continuity.summary.blocked === 0 &&
    acceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_review_criteria_only';

  const checks: readonly Ql155FollowUpGate[] = [
    gate('ql155-lineage', 'Exact QL-154 eight-gate contract and source lineage', exactContract,
      'Keep the synthetic audit review held until source identity is restored.'),
    gate('ql155-independent-replay', 'Reproduced gate statuses and descriptions match every QL-154 criterion',
      independentReplay, 'Recheck the fixture without asserting a real audit finding.'),
    gate('ql155-count-outcome', 'Recomputed pass/blocked totals and outcomes match both source and replay',
      outcomeReconciled, 'Correct inconsistent synthetic totals and retain prior holds.'),
    gate('ql155-preserved-holds', 'No QL-149 to QL-154 unresolved hold ID is dropped or duplicated',
      holdContinuity, 'Restore all missing hold identifiers without closing any.'),
    gate('ql155-audit-candidates', 'One non-closable, unchanged synthetic evidence candidate per hold',
      heldEvidenceValid, 'Recreate the read-only follow-up candidate from source.'),
    gate('ql155-zero-open-holds', 'No unresolved synthetic hold or blocked check for criteria-ready status',
      noUnresolvedHolds, 'Keep the review held and request separately verified synthetic evidence.'),
    gate('ql155-no-durable-audit', 'No durable audit, actual approval, closure, export or live communications',
      noSideEffects, 'Block any live side effect before revisiting audit readiness.'),
    gate('ql155-human-decision-boundary', 'Passing synthetic criteria never authorizes real owner review or closure',
      noSideEffects && outcomeReconciled, 'Keep proposed actions unexecuted; real sign-off is out of scope.')
  ];
  const summary = {
    passed: checks.filter(item => item.status === 'pass').length,
    blocked: checks.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...originalHoldIds, ...independentlyReplayedHoldIds, ...priorHolds,
    ...(!sourceIntegrityVerified ? ['ql155-source-integrity-hold'] : []),
    ...(summary.blocked > 0 && originalHoldIds.length === 0 ? ['ql155-review-readiness-hold'] : [])
  ])];
  const followUpCandidates: readonly Ql155HoldAuditCandidate[] =
    outstandingHoldIds.map(id => ({
      id,
      disposition: 'hold_open_for_later_independent_review' as const,
      evidenceRequired:
        'Separate, new public/synthetic evidence and later explicit human review criteria are required.',
      ownerReviewRequired: true as const,
      actualClosureAuthorized: false as const
    }));

  return {
    build: 'QL-155',
    reviewedBuild: 'QL-154',
    mode: 'synthetic_audit_readiness_only',
    sourceIntegrityVerified,
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_audit_criteria_met_only' : 'synthetic_audit_follow_up_held',
    checks, summary, originalHoldIds, independentlyReplayedHoldIds,
    outstandingHoldIds, followUpCandidates,
    durableAuditRecorded: false,
    ownerApprovalCaptured: false,
    actualExceptionClosed: false,
    evidencePersisted: false,
    exportEnabled: false,
    downloadEnabled: false,
    canTransmit: false,
    liveCommunicationsEnabled: false,
    notice: 'Read-only synthetic audit-readiness review. Not a real audit record, sign-off, owner consent, actual exception closure, evidence export, or live service.'
  };
}
