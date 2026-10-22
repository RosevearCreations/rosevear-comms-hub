import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import type { Ql153ReadinessReview } from './ql153SyntheticResolutionReadiness';
import type { Ql154IndependentDecisionReview } from './ql154SyntheticDecisionEvidenceContinuity';
import type { Ql155SyntheticAuditReadiness } from './ql155SyntheticAuditReadiness';
import type { Ql156IndependentEvidenceReview } from './ql156SyntheticAuditEvidenceValidation';
import type { Ql157PrerequisiteReconciliation } from './ql157OwnerPrerequisiteGovernance';
import type { Ql158OwnerGovernanceReview } from './ql158GovernanceEvidenceEscalation';
import type { Ql159EscalationContinuityReview } from './ql159SyntheticEscalationResolutionContinuity';
import type { Ql160IndependentDecisionEvidence } from './ql160IndependentResolutionDecisionEvidence';
import {
  reviewQl161OwnerDecisionPrerequisites,
  type Ql161OwnerDecisionReview,
  type Ql161ExceptionGovernanceItem
} from './ql161OwnerDecisionPrerequisites';

export type Ql162ContinuityGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  ifBlocked: string;
};

export type Ql162OwnerCriterion = {
  id: string;
  requirement: string;
  status: 'documented_not_approved';
  actualEvidenceVerified: false;
  ownerSignOffRecorded: false;
};

export type Ql162HoldFollowUp = {
  holdId: string;
  proposedRoute: Ql161ExceptionGovernanceItem['proposedRoute'];
  requiredEvidence: string;
  status: 'open_manual_review_required';
  independentlyVerifiedEvidence: false;
  humanOwnerDecisionRecorded: false;
  closurePermitted: false;
  escalationDispatched: false;
};

export type Ql162DecisionCriteriaReview = {
  build: 'QL-162';
  reviewedBuild: 'QL-161';
  mode: 'public_synthetic_owner_criteria_reconciliation_only';
  sourceIntegrityVerified: boolean;
  outcome: 'synthetic_criteria_reconciled_only' | 'synthetic_owner_decision_hold_review_blocked';
  gates: readonly Ql162ContinuityGate[];
  summary: { passed: number; blocked: number };
  ownerCriteria: readonly Ql162OwnerCriterion[];
  sourceHoldIds: readonly string[];
  replayedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  followUps: readonly Ql162HoldFollowUp[];
  externalEvidenceVerified: false;
  realOwnerIdentified: false;
  ownerAuthorizationRecorded: false;
  consentRecorded: false;
  realHoldClosed: false;
  realEscalationDispatched: false;
  durableAuditWritten: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const EXACT_GATES = [
  'ql161-source-contract',
  'ql161-independent-replay',
  'ql161-count-outcome',
  'ql161-hold-lineage',
  'ql161-decision-evidence',
  'ql161-owner-criteria',
  'ql161-authorization-boundary',
  'ql161-zero-open-holds',
  'ql161-no-live-side-effects'
] as const;

const EXACT_CRITERIA = [
  'ql156-owner-identity',
  'ql156-evidence-provenance',
  'ql156-hold-disposition',
  'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

function gate(id: string, requirement: string, ok: boolean, ifBlocked: string): Ql162ContinuityGate {
  return { id, requirement, status: ok ? 'pass' : 'blocked', ifBlocked };
}

// Pure deterministic synthetic reviewer. This does not read external records,
// collect approvals, send escalation messages, or update a hold.
export function reviewQl162OwnerCriteriaAndHoldContinuity(
  source: Ql161OwnerDecisionReview,
  decisionEvidence: Ql160IndependentDecisionEvidence,
  resolution: Ql159EscalationContinuityReview,
  escalations: Ql158OwnerGovernanceReview,
  governance: Ql157PrerequisiteReconciliation,
  validation: Ql156IndependentEvidenceReview,
  audit: Ql155SyntheticAuditReadiness,
  decision: Ql154IndependentDecisionReview,
  readiness: Ql153ReadinessReview,
  evidence: Ql152FollowUpEvidenceRecheck,
  priorFollowUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql162DecisionCriteriaReview {
  const replay = reviewQl161OwnerDecisionPrerequisites(
    decisionEvidence, resolution, escalations, governance, validation,
    audit, decision, readiness, evidence, priorFollowUps, continuity, acceptance
  );
  const ids = source.gates.map(item => item.id);
  const contract = source.build === 'QL-161' &&
    source.reviewedBuild === 'QL-160' &&
    source.mode === 'public_synthetic_owner_prerequisite_review_only' &&
    ids.length === EXACT_GATES.length &&
    new Set(ids).size === EXACT_GATES.length &&
    EXACT_GATES.every(id => ids.includes(id));

  const replayMatches = contract && source.gates.every(actual =>
    replay.gates.some(expected =>
      expected.id === actual.id &&
      expected.status === actual.status &&
      expected.requirement === actual.requirement &&
      expected.ifBlocked === actual.ifBlocked
    )
  );
  const recounted = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const totalsMatch = replayMatches &&
    source.summary.passed === recounted.passed &&
    source.summary.blocked === recounted.blocked &&
    replay.summary.passed === recounted.passed &&
    replay.summary.blocked === recounted.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const criteriaIds = source.ownerPrerequisites.map(item => item.id);
  const criteriaIntact =
    criteriaIds.length === EXACT_CRITERIA.length &&
    new Set(criteriaIds).size === EXACT_CRITERIA.length &&
    EXACT_CRITERIA.every(id => criteriaIds.includes(id)) &&
    source.ownerPrerequisites.every(actual =>
      actual.status === 'documented_pending_separate_owner_authorization' &&
      actual.evidenceVerified === false &&
      actual.signOffRecorded === false &&
      actual.requirement.trim().length > 0 &&
      replay.ownerPrerequisites.some(expected =>
        expected.id === actual.id &&
        expected.requirement === actual.requirement &&
        expected.status === actual.status &&
        expected.evidenceVerified === actual.evidenceVerified &&
        expected.signOffRecorded === actual.signOffRecorded
      )
    );

  const sourceHoldIds = [...new Set(source.outstandingHoldIds)];
  const replayedHoldIds = [...new Set(replay.outstandingHoldIds)];
  const earlierHoldIds = [...new Set([
    ...decisionEvidence.outstandingHoldIds,
    ...resolution.unresolvedHoldIds,
    ...escalations.outstandingHoldIds,
    ...governance.outstandingHoldIds,
    ...validation.outstandingHoldIds,
    ...audit.outstandingHoldIds,
    ...decision.unresolvedHoldIds,
    ...readiness.outstandingHoldIds,
    ...evidence.outstandingHoldIds,
    ...priorFollowUps.preservedHoldIds,
    ...continuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const holdParity =
    sourceHoldIds.length === source.outstandingHoldIds.length &&
    sourceHoldIds.length === replayedHoldIds.length &&
    replayedHoldIds.every(id => sourceHoldIds.includes(id)) &&
    earlierHoldIds.every(id => sourceHoldIds.includes(id)) &&
    source.originalHoldIds.every(id => sourceHoldIds.includes(id)) &&
    source.independentlyReplayedHoldIds.every(id => sourceHoldIds.includes(id));

  const followUpsIntact = holdParity &&
    source.exceptionGovernance.length === sourceHoldIds.length &&
    new Set(source.exceptionGovernance.map(item => item.holdId)).size === sourceHoldIds.length &&
    sourceHoldIds.every(id => source.exceptionGovernance.some(item => item.holdId === id)) &&
    source.exceptionGovernance.every(actual =>
      actual.disposition === 'open_not_resolved' &&
      actual.requiresExternalEvidence === true &&
      actual.requiresHumanDecision === true &&
      actual.actionPerformed === false &&
      actual.realClosureAuthorized === false &&
      actual.requiredEvidence.trim().length > 0 &&
      replay.exceptionGovernance.some(expected =>
        expected.holdId === actual.holdId &&
        expected.proposedRoute === actual.proposedRoute &&
        expected.requiredEvidence === actual.requiredEvidence &&
        expected.disposition === actual.disposition &&
        expected.requiresExternalEvidence === actual.requiresExternalEvidence &&
        expected.requiresHumanDecision === actual.requiresHumanDecision &&
        expected.actionPerformed === actual.actionPerformed &&
        expected.realClosureAuthorized === actual.realClosureAuthorized
      )
    );

  const runtimeLocked =
    source.externalEvidenceAttested === false &&
    source.actualOwnerIdentified === false &&
    source.ownerDecisionRecorded === false &&
    source.consentRecorded === false &&
    source.realEscalationSent === false &&
    source.realExceptionClosed === false &&
    source.durableAuditWritten === false &&
    source.exportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.livePhoneSmsEnabled === false &&
    replay.externalEvidenceAttested === false &&
    replay.actualOwnerIdentified === false &&
    replay.ownerDecisionRecorded === false &&
    replay.consentRecorded === false &&
    replay.realEscalationSent === false &&
    replay.realExceptionClosed === false &&
    replay.durableAuditWritten === false &&
    replay.exportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.livePhoneSmsEnabled === false &&
    decisionEvidence.verifiedExternalEvidence === false &&
    decisionEvidence.ownerIdentityVerified === false &&
    decisionEvidence.ownerDecisionRecorded === false &&
    decisionEvidence.actualHoldClosed === false &&
    decisionEvidence.escalationDispatched === false &&
    decisionEvidence.durableAuditWritten === false &&
    decisionEvidence.exportEnabled === false &&
    decisionEvidence.canTransmit === false &&
    decisionEvidence.liveCommunicationsEnabled === false;

  const ownerCriteria: readonly Ql162OwnerCriterion[] = criteriaIntact ?
    source.ownerPrerequisites.map(item => ({
      id: item.id,
      requirement: item.requirement,
      status: 'documented_not_approved' as const,
      actualEvidenceVerified: false as const,
      ownerSignOffRecorded: false as const
    })) : [];

  const sourceIntegrityVerified =
    contract && replayMatches && totalsMatch &&
    criteriaIntact && holdParity && followUpsIntact && runtimeLocked;
  const zeroOpenHolds = sourceIntegrityVerified &&
    source.sourceIntegrityVerified &&
    sourceHoldIds.length === 0 && earlierHoldIds.length === 0 &&
    recounted.blocked === 0 &&
    decisionEvidence.summary.blocked === 0 &&
    resolution.summary.blocked === 0 &&
    escalations.summary.blocked === 0 &&
    governance.summary.blocked === 0 &&
    validation.summary.blocked === 0 &&
    audit.summary.blocked === 0 &&
    decision.summary.blocked === 0 &&
    readiness.summary.blocked === 0 &&
    evidence.summary.blocked === 0 &&
    priorFollowUps.summary.blocked === 0 &&
    continuity.summary.blocked === 0 &&
    acceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_prerequisite_criteria_met_only';

  const gates: readonly Ql162ContinuityGate[] = [
    gate('ql162-source-contract', 'QL-161 exact nine-gate lineage and identity', contract,
      'Restore exact source contract before treating synthetic criteria as reviewed.'),
    gate('ql162-independent-replay', 'Every gate status and blocker matches independent fixture replay', replayMatches,
      'Recompute the source; keep all affected exception holds open.'),
    gate('ql162-recount-outcome', 'Counts, outcome and source integrity reconcile with replay', totalsMatch,
      'Reject unsupported readiness labels or altered totals.'),
    gate('ql162-owner-criteria', 'All five exact unapproved owner prerequisites remain unchanged', criteriaIntact,
      'Restore the documented prerequisites without recording sign-off.'),
    gate('ql162-hold-continuity', 'No unresolved hold ID from QL-149 to QL-161 is omitted or duplicated', holdParity,
      'Reinstate every missing synthetic hold identifier.'),
    gate('ql162-follow-up-parity', 'One unchanged, unexecuted evidence follow-up exists for each open hold', followUpsIntact,
      'Restore the original evidence requirement without authorizing closure.'),
    gate('ql162-zero-open-holds', 'Synthetic criteria-ready requires zero open holds and blocked gates', zeroOpenHolds,
      'Keep the review held for additional independent synthetic evidence.'),
    gate('ql162-owner-boundary', 'All criteria remain unsigned and require separately authorized human review',
      criteriaIntact && runtimeLocked, 'Do not convert fixture review into owner approval.'),
    gate('ql162-no-live-side-effects', 'No real consent, escalation, closure, audit, export, or Phone/SMS',
      runtimeLocked, 'Restore read-only no-live operational restrictions.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };

  const outstandingHoldIds = [...new Set([
    ...sourceHoldIds, ...replayedHoldIds, ...earlierHoldIds,
    ...(!sourceIntegrityVerified ? ['ql162-source-integrity-hold'] : []),
    ...(summary.blocked > 0 && sourceHoldIds.length === 0 ?
      ['ql162-decision-readiness-hold'] : [])
  ])];
  const followUps: readonly Ql162HoldFollowUp[] = outstandingHoldIds.map(holdId => {
    const existing = source.exceptionGovernance.find(item => item.holdId === holdId);
    return {
      holdId,
      proposedRoute: existing?.proposedRoute ?? 'synthetic_integrity_review',
      requiredEvidence: existing?.requiredEvidence ??
        'Independent synthetic evidence and a separate authorized owner decision required.',
      status: 'open_manual_review_required' as const,
      independentlyVerifiedEvidence: false as const,
      humanOwnerDecisionRecorded: false as const,
      closurePermitted: false as const,
      escalationDispatched: false as const
    };
  });

  return {
    build: 'QL-162', reviewedBuild: 'QL-161',
    mode: 'public_synthetic_owner_criteria_reconciliation_only',
    sourceIntegrityVerified,
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_criteria_reconciled_only' : 'synthetic_owner_decision_hold_review_blocked',
    gates, summary, ownerCriteria, sourceHoldIds,
    replayedHoldIds, outstandingHoldIds, followUps,
    externalEvidenceVerified: false, realOwnerIdentified: false,
    ownerAuthorizationRecorded: false, consentRecorded: false,
    realHoldClosed: false, realEscalationDispatched: false,
    durableAuditWritten: false, exportEnabled: false,
    downloadEnabled: false, canTransmit: false, livePhoneSmsEnabled: false,
    notice: 'QL-162 reconciles in-memory synthetic owner prerequisites and exception holds only. No real owner approval, external evidence attestation, consent, closure, audit, export or live Phone/SMS is authorized.'
  };
}
