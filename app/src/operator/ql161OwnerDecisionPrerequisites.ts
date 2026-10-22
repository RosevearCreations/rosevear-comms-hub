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
import {
  reviewQl160IndependentResolutionDecisionEvidence,
  type Ql160IndependentDecisionEvidence,
  type Ql160ResolutionDecisionBoundary
} from './ql160IndependentResolutionDecisionEvidence';

export type Ql161GovernanceGate = {
  id: string;
  status: 'pass' | 'blocked';
  requirement: string;
  ifBlocked: string;
};

export type Ql161OwnerPrerequisite = {
  id: string;
  requirement: string;
  status: 'documented_pending_separate_owner_authorization';
  evidenceVerified: false;
  signOffRecorded: false;
};

export type Ql161ExceptionGovernanceItem = {
  holdId: string;
  proposedRoute: Ql160ResolutionDecisionBoundary['syntheticRoute'];
  requiredEvidence: string;
  disposition: 'open_not_resolved';
  requiresExternalEvidence: true;
  requiresHumanDecision: true;
  actionPerformed: false;
  realClosureAuthorized: false;
};

export type Ql161OwnerDecisionReview = {
  build: 'QL-161';
  reviewedBuild: 'QL-160';
  mode: 'public_synthetic_owner_prerequisite_review_only';
  sourceIntegrityVerified: boolean;
  outcome: 'synthetic_prerequisite_criteria_met_only' | 'synthetic_exception_governance_held';
  gates: readonly Ql161GovernanceGate[];
  summary: { passed: number; blocked: number };
  ownerPrerequisites: readonly Ql161OwnerPrerequisite[];
  originalHoldIds: readonly string[];
  independentlyReplayedHoldIds: readonly string[];
  outstandingHoldIds: readonly string[];
  exceptionGovernance: readonly Ql161ExceptionGovernanceItem[];
  externalEvidenceAttested: false;
  actualOwnerIdentified: false;
  ownerDecisionRecorded: false;
  consentRecorded: false;
  realEscalationSent: false;
  realExceptionClosed: false;
  durableAuditWritten: false;
  exportEnabled: false;
  downloadEnabled: false;
  canTransmit: false;
  livePhoneSmsEnabled: false;
  warning: string;
};

const REQUIRED_QL160_GATES = [
  'ql160-source-contract',
  'ql160-independent-replay',
  'ql160-outcome-consistency',
  'ql160-hold-parity',
  'ql160-resolution-evidence',
  'ql160-owner-boundary',
  'ql160-synthetic-ready',
  'ql160-no-real-action'
] as const;

const REQUIRED_OWNER_CRITERIA = [
  ['ql156-owner-identity', 'Authorized owner identity and role verification in a separate private workflow'],
  ['ql156-evidence-provenance', 'Fresh independently checked evidence with origin and integrity review'],
  ['ql156-hold-disposition', 'Explicit human disposition for every unresolved hold ID'],
  ['ql156-consent-and-scope', 'Authorized consent, privacy and communications scope determination'],
  ['ql156-audit-signoff', 'Durable access-controlled audit evidence and human sign-off']
] as const;

function gate(id: string, requirement: string, passed: boolean, ifBlocked: string): Ql161GovernanceGate {
  return { id, requirement, status: passed ? 'pass' : 'blocked', ifBlocked };
}

// Reconciles only a deterministic synthetic fixture. It must never validate
// external evidence, identify an owner, close holds, or dispatch escalations.
export function reviewQl161OwnerDecisionPrerequisites(
  source: Ql160IndependentDecisionEvidence,
  resolution: Ql159EscalationContinuityReview,
  escalations: Ql158OwnerGovernanceReview,
  governance: Ql157PrerequisiteReconciliation,
  validation: Ql156IndependentEvidenceReview,
  audit: Ql155SyntheticAuditReadiness,
  decision: Ql154IndependentDecisionReview,
  readiness: Ql153ReadinessReview,
  evidence: Ql152FollowUpEvidenceRecheck,
  followUps: Ql151IndependentFollowUpReview,
  continuity: Ql150AcceptanceContinuity,
  acceptance: Ql149IndependentAcceptance
): Ql161OwnerDecisionReview {
  const replay = reviewQl160IndependentResolutionDecisionEvidence(
    resolution, escalations, governance, validation, audit, decision,
    readiness, evidence, followUps, continuity, acceptance
  );

  const gateIds = source.gates.map(item => item.id);
  const contract =
    source.build === 'QL-160' &&
    source.reviewedBuild === 'QL-159' &&
    source.mode === 'synthetic_owner_boundary_review_only' &&
    gateIds.length === REQUIRED_QL160_GATES.length &&
    new Set(gateIds).size === REQUIRED_QL160_GATES.length &&
    REQUIRED_QL160_GATES.every(id => gateIds.includes(id));

  const gateReplay = contract && source.gates.every(actual =>
    replay.gates.some(expected =>
      actual.id === expected.id &&
      actual.status === expected.status &&
      actual.requirement === expected.requirement &&
      actual.onBlock === expected.onBlock
    )
  );
  const recounted = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const countsAndOutcome = gateReplay &&
    source.summary.passed === recounted.passed &&
    source.summary.blocked === recounted.blocked &&
    replay.summary.passed === recounted.passed &&
    replay.summary.blocked === recounted.blocked &&
    source.outcome === replay.outcome &&
    source.sourceIntegrityVerified === replay.sourceIntegrityVerified;

  const originalHoldIds = [...new Set(source.outstandingHoldIds)];
  const replayHoldIds = [...new Set(replay.outstandingHoldIds)];
  const previousHolds = [...new Set([
    ...resolution.unresolvedHoldIds,
    ...escalations.outstandingHoldIds,
    ...governance.outstandingHoldIds,
    ...validation.outstandingHoldIds,
    ...audit.outstandingHoldIds,
    ...decision.unresolvedHoldIds,
    ...readiness.outstandingHoldIds,
    ...evidence.outstandingHoldIds,
    ...followUps.preservedHoldIds,
    ...continuity.outstandingHoldIds,
    ...acceptance.unresolvedHoldIds
  ])];
  const uniqueHolds = originalHoldIds.length === source.outstandingHoldIds.length;
  const holdParity = uniqueHolds &&
    originalHoldIds.length === replayHoldIds.length &&
    replayHoldIds.every(id => originalHoldIds.includes(id)) &&
    previousHolds.every(id => originalHoldIds.includes(id)) &&
    source.originalHoldIds.every(id => originalHoldIds.includes(id)) &&
    source.independentlyReplayedHoldIds.every(id => originalHoldIds.includes(id));

  const boundaryIntegrity = holdParity &&
    source.decisionBoundaries.length === originalHoldIds.length &&
    new Set(source.decisionBoundaries.map(item => item.holdId)).size === originalHoldIds.length &&
    originalHoldIds.every(id => source.decisionBoundaries.some(item => item.holdId === id)) &&
    source.decisionBoundaries.every(actual =>
      actual.disposition === 'keep_open_for_separate_owner_review' &&
      actual.humanReviewRequired === true &&
      actual.independentEvidenceRequired === true &&
      actual.realOwnerAcceptanceRecorded === false &&
      actual.realResolutionAuthorized === false &&
      actual.escalationDispatched === false &&
      actual.evidenceNeeded.trim().length > 0 &&
      replay.decisionBoundaries.some(expected =>
        actual.holdId === expected.holdId &&
        actual.syntheticRoute === expected.syntheticRoute &&
        actual.evidenceNeeded === expected.evidenceNeeded &&
        actual.disposition === expected.disposition &&
        actual.humanReviewRequired === expected.humanReviewRequired &&
        actual.independentEvidenceRequired === expected.independentEvidenceRequired &&
        actual.realOwnerAcceptanceRecorded === expected.realOwnerAcceptanceRecorded &&
        actual.realResolutionAuthorized === expected.realResolutionAuthorized &&
        actual.escalationDispatched === expected.escalationDispatched
      )
    );

  const criterionIds = source.documentedOwnerPrerequisites;
  const prerequisitesIntact =
    criterionIds.length === REQUIRED_OWNER_CRITERIA.length &&
    new Set(criterionIds).size === REQUIRED_OWNER_CRITERIA.length &&
    REQUIRED_OWNER_CRITERIA.every(([id]) => criterionIds.includes(id)) &&
    criterionIds.length === replay.documentedOwnerPrerequisites.length &&
    criterionIds.every(id => replay.documentedOwnerPrerequisites.includes(id)) &&
    governance.prerequisites.length === REQUIRED_OWNER_CRITERIA.length &&
    governance.prerequisites.every(item =>
      item.approvalRecorded === false &&
      item.status === 'documented_not_authorized' &&
      item.verificationPath === 'separate_private_human_review_required' &&
      item.description.trim().length > 0
    );

  const noRealOperations =
    source.verifiedExternalEvidence === false &&
    source.ownerIdentityVerified === false &&
    source.ownerConsentCaptured === false &&
    source.ownerDecisionRecorded === false &&
    source.actualHoldClosed === false &&
    source.durableAuditWritten === false &&
    source.escalationDispatched === false &&
    source.exportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.liveCommunicationsEnabled === false &&
    replay.verifiedExternalEvidence === false &&
    replay.ownerIdentityVerified === false &&
    replay.ownerConsentCaptured === false &&
    replay.ownerDecisionRecorded === false &&
    replay.actualHoldClosed === false &&
    replay.durableAuditWritten === false &&
    replay.escalationDispatched === false &&
    replay.exportEnabled === false &&
    replay.downloadEnabled === false &&
    replay.canTransmit === false &&
    replay.liveCommunicationsEnabled === false &&
    resolution.realOwnerVerified === false &&
    resolution.ownerApprovalRecorded === false &&
    resolution.independentExternalEvidenceVerified === false &&
    resolution.escalationDispatched === false &&
    resolution.realExceptionClosed === false &&
    resolution.auditPersisted === false &&
    resolution.canTransmit === false &&
    resolution.livePhoneSmsEnabled === false;

  const ownerPrerequisites: readonly Ql161OwnerPrerequisite[] = REQUIRED_OWNER_CRITERIA.map(
    ([id, requirement]) => ({
      id,
      requirement,
      status: 'documented_pending_separate_owner_authorization' as const,
      evidenceVerified: false as const,
      signOffRecorded: false as const
    })
  );
  const ownerBoundary = prerequisitesIntact &&
    ownerPrerequisites.every(item =>
      item.status === 'documented_pending_separate_owner_authorization' &&
      item.evidenceVerified === false && item.signOffRecorded === false
    ) &&
    noRealOperations;

  const sourceIntegrityVerified =
    contract && gateReplay && countsAndOutcome && holdParity &&
    boundaryIntegrity && prerequisitesIntact && ownerBoundary && noRealOperations;

  const syntheticZeroHolds = sourceIntegrityVerified &&
    source.sourceIntegrityVerified &&
    originalHoldIds.length === 0 && previousHolds.length === 0 &&
    recounted.blocked === 0 &&
    resolution.summary.blocked === 0 &&
    escalations.summary.blocked === 0 &&
    governance.summary.blocked === 0 &&
    validation.summary.blocked === 0 &&
    audit.summary.blocked === 0 &&
    decision.summary.blocked === 0 &&
    readiness.summary.blocked === 0 &&
    evidence.summary.blocked === 0 &&
    followUps.summary.blocked === 0 &&
    continuity.summary.blocked === 0 &&
    acceptance.summary.blocked === 0 &&
    source.outcome === 'synthetic_decision_criteria_met_only';

  const gates: readonly Ql161GovernanceGate[] = [
    gate('ql161-source-contract', 'Eight exact QL-160 gate IDs and source lineage', contract,
      'Reconstruct the expected synthetic source before review.'),
    gate('ql161-independent-replay', 'Every gate status, requirement and blocker reproduces', gateReplay,
      'Keep prior holds open and recheck altered fixture evidence.'),
    gate('ql161-count-outcome', 'Pass and block counts, outcome and integrity agree with replay', countsAndOutcome,
      'Reject unsupported synthetic readiness labels.'),
    gate('ql161-hold-lineage', 'All unresolved hold IDs from QL-149 through QL-160 survive unchanged', holdParity,
      'Restore missing or duplicate synthetic hold identifiers.'),
    gate('ql161-decision-evidence', 'Exactly one unchanged non-executable decision boundary per hold', boundaryIntegrity,
      'Restore each hold-specific evidence requirement without authorizing closure.'),
    gate('ql161-owner-criteria', 'All five documented owner prerequisite IDs remain intact', prerequisitesIntact,
      'Reconcile requirements without recording a human approval.'),
    gate('ql161-authorization-boundary', 'Every owner prerequisite still requires separate review and sign-off', ownerBoundary,
      'Do not treat synthetic governance readiness as real owner approval.'),
    gate('ql161-zero-open-holds', 'Synthetic criteria-ready requires zero unresolved holds and blocked source gates', syntheticZeroHolds,
      'Retain the hold and prepare separate evidence and manual owner review.'),
    gate('ql161-no-live-side-effects', 'No real external evidence, consent, decision, closure, audit, export or communications', noRealOperations,
      'Restore strict read-only, no-dispatch operational boundaries.')
  ];
  const summary = {
    passed: gates.filter(item => item.status === 'pass').length,
    blocked: gates.filter(item => item.status === 'blocked').length
  };
  const outstandingHoldIds = [...new Set([
    ...originalHoldIds, ...replayHoldIds, ...previousHolds,
    ...(!sourceIntegrityVerified ? ['ql161-source-integrity-hold'] : []),
    ...(summary.blocked > 0 && originalHoldIds.length === 0 ? ['ql161-owner-prerequisite-review-hold'] : [])
  ])];
  const exceptionGovernance: readonly Ql161ExceptionGovernanceItem[] =
    outstandingHoldIds.map(holdId => {
      const fromSource = source.decisionBoundaries.find(item => item.holdId === holdId);
      return {
        holdId,
        proposedRoute: fromSource?.syntheticRoute ?? 'synthetic_integrity_review',
        requiredEvidence: fromSource?.evidenceNeeded ??
          'Independent evidence verification and separate authorized human owner decision required.',
        disposition: 'open_not_resolved' as const,
        requiresExternalEvidence: true as const,
        requiresHumanDecision: true as const,
        actionPerformed: false as const,
        realClosureAuthorized: false as const
      };
    });

  return {
    build: 'QL-161', reviewedBuild: 'QL-160',
    mode: 'public_synthetic_owner_prerequisite_review_only',
    sourceIntegrityVerified,
    outcome: summary.blocked === 0 && outstandingHoldIds.length === 0 ?
      'synthetic_prerequisite_criteria_met_only' : 'synthetic_exception_governance_held',
    gates, summary, ownerPrerequisites, originalHoldIds,
    independentlyReplayedHoldIds: replayHoldIds,
    outstandingHoldIds, exceptionGovernance,
    externalEvidenceAttested: false, actualOwnerIdentified: false,
    ownerDecisionRecorded: false, consentRecorded: false,
    realEscalationSent: false, realExceptionClosed: false,
    durableAuditWritten: false, exportEnabled: false,
    downloadEnabled: false, canTransmit: false, livePhoneSmsEnabled: false,
    warning: 'QL-161 is an in-memory public synthetic decision prerequisite review. All owner checks are documented but unapproved. No actual owner, consent, external evidence, escalation delivery, audit, exception closure or live communications.'
  };
}
