import type { Ql149IndependentAcceptance } from './ql149SyntheticAuditAcceptance';
import type { Ql150AcceptanceContinuity } from './ql150SyntheticAcceptanceContinuity';
import type { Ql151IndependentFollowUpReview } from './ql151SyntheticHoldContinuityFollowup';
import type { Ql152FollowUpEvidenceRecheck } from './ql152SyntheticFollowupEvidenceRecheck';
import type { Ql153ReadinessReview } from './ql153SyntheticResolutionReadiness';
import type { Ql154IndependentDecisionReview } from './ql154SyntheticDecisionEvidenceContinuity';
import type { Ql155SyntheticAuditReadiness } from './ql155SyntheticAuditReadiness';
import type { Ql156IndependentEvidenceReview } from './ql156SyntheticAuditEvidenceValidation';
import type { Ql157PrerequisiteReconciliation } from './ql157OwnerPrerequisiteGovernance';
import {
  reviewQl158OwnerGovernanceEscalations,
  type Ql158OwnerGovernanceReview,
  type Ql158EscalationDraft
} from './ql158GovernanceEvidenceEscalation';

export type Ql159ContinuityGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  ifBlocked: string;
};
export type Ql159ResolutionFollowUp = {
  holdId: string;
  proposedRoute: Ql158EscalationDraft['route'];
  evidenceNeeded: string;
  disposition: 'retain_open_for_independent_follow_up';
  readiness: 'real_resolution_not_authorized';
  independentEvidencePending: true;
  humanDecisionPending: true;
  dispatched: false;
  realClosureAuthorized: false;
};
export type Ql159EscalationContinuityReview = {
  build: 'QL-159';
  sourceBuild: 'QL-158';
  mode: 'synthetic_follow_up_continuity_only';
  outcome: 'synthetic_continuity_criteria_met_only' | 'synthetic_resolution_follow_up_held';
  sourceIntegrityVerified: boolean;
  gates: readonly Ql159ContinuityGate[];
  summary: { passed: number; blocked: number };
  originalHoldIds: readonly string[];
  replayedHoldIds: readonly string[];
  unresolvedHoldIds: readonly string[];
  resolutionFollowUps: readonly Ql159ResolutionFollowUp[];
  realOwnerVerified: false;
  ownerApprovalRecorded: false;
  independentExternalEvidenceVerified: false;
  escalationDispatched: false;
  realExceptionClosed: false;
  auditPersisted: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const QL158_GATE_IDS = [
  'ql158-source-contract',
  'ql158-independent-replay',
  'ql158-outcome-consistency',
  'ql158-owner-prerequisite-continuity',
  'ql158-hold-lineage',
  'ql158-follow-up-provenance',
  'ql158-escalation-proposal',
  'ql158-zero-open-holds',
  'ql158-runtime-boundary'
] as const;

const PREREQUISITES = [
  'ql156-owner-identity',
  'ql156-evidence-provenance',
  'ql156-hold-disposition',
  'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

function check(id: string, requirement: string, ok: boolean, ifBlocked: string): Ql159ContinuityGate {
  return { id, requirement, status: ok ? 'pass' : 'blocked', ifBlocked };
}
function routeFor(id: string): Ql158EscalationDraft['route'] {
  return /integrity|source|governance|review-readiness|review-hold/.test(id)
    ? 'synthetic_integrity_review' : 'synthetic_evidence_follow_up';
}

// Independent deterministic replay; generated packets and follow-ups are display-only.
// All real evidence collection, owner decisions and hold mutations are out of scope.
export function reviewQl159SyntheticEscalationContinuity(
  source: Ql158OwnerGovernanceReview,
  governance: Ql157PrerequisiteReconciliation,
  validation: Ql156IndependentEvidenceReview,
  audit: Ql155SyntheticAuditReadiness,
  decision: Ql154IndependentDecisionReview,
  resolution: Ql153ReadinessReview,
  evidence: Ql152FollowUpEvidenceRecheck,
  priorFollowUps: Ql151IndependentFollowUpReview,
  priorContinuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql159EscalationContinuityReview {
  const replay = reviewQl158OwnerGovernanceEscalations(
    governance, validation, audit, decision, resolution, evidence,
    priorFollowUps, priorContinuity, acceptance
  );

  const ids = source.gates.map(item => item.id);
  const contract =
    source.build === 'QL-158' &&
    source.reviewedBuild === 'QL-157' &&
    source.mode === 'synthetic_governance_escalation_proposal_only' &&
    source.gates.length === QL158_GATE_IDS.length &&
    new Set(ids).size === QL158_GATE_IDS.length &&
    QL158_GATE_IDS.every(id => ids.includes(id));

  const reproducedGates =
    contract && source.gates.every(actual => replay.gates.some(expected =>
      actual.id === expected.id &&
      actual.requirement === expected.requirement &&
      actual.status === expected.status &&
      actual.reviewIfBlocked === expected.reviewIfBlocked
    ));
  const counted = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const outcomesReconciled =
    reproducedGates &&
    counted.passed === source.summary.passed &&
    counted.blocked === source.summary.blocked &&
    counted.passed === replay.summary.passed &&
    counted.blocked === replay.summary.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const originalHoldIds = [...new Set(source.outstandingHoldIds)];
  const replayedHoldIds = [...new Set(replay.outstandingHoldIds)];
  const upstreamHoldIds = [...new Set([
    ...governance.outstandingHoldIds, ...validation.outstandingHoldIds,
    ...audit.outstandingHoldIds, ...decision.unresolvedHoldIds,
    ...resolution.outstandingHoldIds, ...evidence.outstandingHoldIds,
    ...priorFollowUps.preservedHoldIds, ...priorContinuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const holdContinuity =
    originalHoldIds.length === source.outstandingHoldIds.length &&
    replayedHoldIds.length === originalHoldIds.length &&
    replayedHoldIds.every(id => originalHoldIds.includes(id)) &&
    upstreamHoldIds.every(id => originalHoldIds.includes(id)) &&
    source.sourceHoldIds.every(id => originalHoldIds.includes(id)) &&
    source.replayedHoldIds.every(id => originalHoldIds.includes(id));

  const prerequisiteIds = [...new Set(source.ownerPrerequisiteIds)];
  const ownerCriteriaIntact =
    source.ownerPrerequisiteIds.length === PREREQUISITES.length &&
    prerequisiteIds.length === PREREQUISITES.length &&
    PREREQUISITES.every(id => prerequisiteIds.includes(id)) &&
    prerequisiteIds.length === replay.ownerPrerequisiteIds.length &&
    prerequisiteIds.every(id => replay.ownerPrerequisiteIds.includes(id)) &&
    governance.prerequisites.length === PREREQUISITES.length &&
    governance.prerequisites.every(item =>
      item.approvalRecorded === false &&
      item.status === 'documented_not_authorized' &&
      item.verificationPath === 'separate_private_human_review_required'
    );

  const escalationIntegrity =
    holdContinuity &&
    source.escalationDrafts.length === originalHoldIds.length &&
    new Set(source.escalationDrafts.map(item => item.holdId)).size === originalHoldIds.length &&
    source.escalationDrafts.every(actual =>
      actual.status === 'proposed_not_dispatched' &&
      actual.holdRemainsOpen === true &&
      actual.ownerReviewRequired === true &&
      actual.escalationSent === false &&
      actual.closureAuthorized === false &&
      actual.route === routeFor(actual.holdId) &&
      actual.evidenceRequirement.trim().length > 0 &&
      replay.escalationDrafts.some(expected =>
        expected.holdId === actual.holdId &&
        expected.route === actual.route &&
        expected.status === actual.status &&
        expected.evidenceRequirement === actual.evidenceRequirement &&
        expected.ownerReviewRequired === actual.ownerReviewRequired &&
        expected.holdRemainsOpen === actual.holdRemainsOpen &&
        expected.escalationSent === actual.escalationSent &&
        expected.closureAuthorized === actual.closureAuthorized
      )
    ) &&
    originalHoldIds.every(id => source.escalationDrafts.some(item => item.holdId === id));

  const runtimeLocked =
    source.realEvidenceAttested === false &&
    source.ownerVerified === false &&
    source.ownerApprovalRecorded === false &&
    source.realEscalationDispatched === false &&
    source.actualHoldClosed === false &&
    source.consentRecorded === false &&
    source.durableAuditWritten === false &&
    source.evidenceExportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.livePhoneSmsEnabled === false &&
    replay.realEvidenceAttested === false &&
    replay.ownerVerified === false &&
    replay.ownerApprovalRecorded === false &&
    replay.realEscalationDispatched === false &&
    replay.actualHoldClosed === false &&
    replay.consentRecorded === false &&
    replay.durableAuditWritten === false &&
    replay.evidenceExportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.livePhoneSmsEnabled === false &&
    governance.realOwnerVerified === false &&
    governance.ownerApprovalRecorded === false &&
    governance.consentRecorded === false &&
    governance.actualExceptionClosed === false &&
    governance.durableAuditPersisted === false &&
    governance.evidenceExportEnabled === false &&
    governance.downloadEnabled === false &&
    governance.canTransmit === false &&
    governance.livePhoneSmsEnabled === false;

  const syntheticResolutionCriteria =
    contract && reproducedGates && outcomesReconciled &&
    holdContinuity && ownerCriteriaIntact && escalationIntegrity && runtimeLocked &&
    source.sourceIntegrityVerified &&
    originalHoldIds.length === 0 &&
    counted.blocked === 0 &&
    governance.summary.blocked === 0 &&
    validation.summary.blocked === 0 &&
    audit.summary.blocked === 0 &&
    decision.summary.blocked === 0 &&
    resolution.summary.blocked === 0 &&
    evidence.summary.blocked === 0 &&
    priorFollowUps.summary.blocked === 0 &&
    priorContinuity.summary.blocked === 0 &&
    acceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_governance_integrity_ready_only';

  const sourceIntegrityVerified =
    contract && reproducedGates && outcomesReconciled &&
    holdContinuity && ownerCriteriaIntact && escalationIntegrity && runtimeLocked;
  const gates: readonly Ql159ContinuityGate[] = [
    check('ql159-exact-lineage', 'QL-158 identity and nine unique expected gate IDs',
      contract, 'Recreate the synthetic escalation reviewer with its exact contract.'),
    check('ql159-replay-evidence', 'Exact gate status, requirement and blocked follow-up replay',
      reproducedGates, 'Reject altered evidence and preserve the original exception hold.'),
    check('ql159-recount-outcomes', 'Independent totals, outcome and integrity flag agree',
      outcomesReconciled, 'Recheck the mismatched outcome without authorizing resolution.'),
    check('ql159-hold-continuity', 'No unresolved QL-149–QL-158 synthetic hold is lost or duplicated',
      holdContinuity, 'Restore every missing or altered hold identifier.'),
    check('ql159-owner-prerequisites', 'Five unique owner-review criteria remain intact and unapproved',
      ownerCriteriaIntact, 'Require separately authorized owner review, not a fixture approval.'),
    check('ql159-escalation-provenance', 'One unchanged non-dispatched escalation draft per open hold',
      escalationIntegrity, 'Reconstruct the missing evidence requirement and keep the hold open.'),
    check('ql159-resolution-readiness', 'Synthetic-only resolution criteria require zero open holds and blocked gates',
      syntheticResolutionCriteria, 'Record a follow-up proposal only; real resolution remains unauthorized.'),
    check('ql159-runtime-boundaries', 'No real approval, consent, escalation delivery, closure, durable audit or transmission',
      runtimeLocked, 'Block any live write, communication or owner decision side effect.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  const unresolvedHoldIds = [...new Set([
    ...originalHoldIds, ...replayedHoldIds, ...upstreamHoldIds,
    ...(!sourceIntegrityVerified ? ['ql159-evidence-reconciliation-hold'] : []),
    ...(summary.blocked > 0 && originalHoldIds.length === 0 ?
      ['ql159-resolution-review-hold'] : [])
  ])];
  const resolutionFollowUps: readonly Ql159ResolutionFollowUp[] = unresolvedHoldIds.map(holdId => ({
    holdId,
    proposedRoute: routeFor(holdId),
    evidenceNeeded: source.escalationDrafts.find(item => item.holdId === holdId)?.evidenceRequirement ??
      'Independent synthetic evidence and later authorized human review are required.',
    disposition: 'retain_open_for_independent_follow_up' as const,
    readiness: 'real_resolution_not_authorized' as const,
    independentEvidencePending: true as const,
    humanDecisionPending: true as const,
    dispatched: false as const,
    realClosureAuthorized: false as const
  }));
  return {
    build: 'QL-159', sourceBuild: 'QL-158',
    mode: 'synthetic_follow_up_continuity_only',
    outcome: summary.blocked === 0 && unresolvedHoldIds.length === 0 ?
      'synthetic_continuity_criteria_met_only' : 'synthetic_resolution_follow_up_held',
    sourceIntegrityVerified, gates, summary,
    originalHoldIds, replayedHoldIds, unresolvedHoldIds, resolutionFollowUps,
    realOwnerVerified: false, ownerApprovalRecorded: false,
    independentExternalEvidenceVerified: false, escalationDispatched: false,
    realExceptionClosed: false, auditPersisted: false,
    exportEnabled: false, downloadEnabled: false, canTransmit: false,
    livePhoneSmsEnabled: false,
    notice: 'QL-159 verifies only read-only synthetic follow-up continuity. Evidence is not independently attested, no escalation is dispatched, and no real owner approval, resolution, durable audit, export or live communications are authorized.'
  };
}
