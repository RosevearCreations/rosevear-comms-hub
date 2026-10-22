import type { Ql163DecisionContinuityReview, Ql163HeldFollowUp } from './ql163ExceptionOwnerDecisionBoundary';

export type Ql168PriorityLane = {
  id: 'integrity' | 'evidence';
  reviewOrder: 1 | 2;
  title: string;
  blocker: string;
  holdIds: readonly string[];
  heldEvidence: readonly {
    holdId: string;
    proposedRoute: Ql163HeldFollowUp['proposedRoute'];
    requiredEvidence: string;
    status: 'open_not_authorized';
  }[];
};

export type Ql168PrerequisiteSummary = {
  id: string;
  requirement: string;
  affectedHoldIds: readonly string[];
  evidenceState: 'not_independently_verified';
  humanDecisionState: 'not_recorded';
};

export type Ql168HoldPrioritySummary = {
  build: 'QL-168';
  reviewedBuild: 'QL-163';
  mode: 'public_synthetic_display_only_priority_summary';
  sourceIntegrityVerified: boolean;
  integrityWarning: string | null;
  outstandingHoldIds: readonly string[];
  lanes: readonly Ql168PriorityLane[];
  blockedGates: readonly { id: string; requirement: string; ifBlocked: string }[];
  ownerPrerequisites: readonly Ql168PrerequisiteSummary[];
  actualPriorityOrUrgencyEstablished: false;
  authorizedToFollowUp: false;
  authorizedToDispatch: false;
  authorizedToClose: false;
  canWriteOrExport: false;
  livePhoneSmsEnabled: false;
  notice: string;
};

const REQUIRED_PREREQUISITES = [
  'ql156-owner-identity',
  'ql156-evidence-provenance',
  'ql156-hold-disposition',
  'ql156-consent-and-scope',
  'ql156-audit-signoff'
] as const;

const REQUIRED_GATES = [
  'ql163-source-contract',
  'ql163-independent-replay',
  'ql163-outcome-integrity',
  'ql163-owner-evidence',
  'ql163-hold-lineage',
  'ql163-follow-up-evidence',
  'ql163-authorization-boundary',
  'ql163-zero-open-holds',
  'ql163-no-live-operations'
] as const;

const isUniqueNonEmpty = (ids: readonly string[]) =>
  ids.every(id => typeof id === 'string' && id.trim().length > 0) &&
  new Set(ids).size === ids.length;

const sameSet = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && isUniqueNonEmpty(left) && isUniqueNonEmpty(right) &&
  left.every(id => right.includes(id));

const safeSort = (ids: readonly string[]) => [...new Set(ids.filter(id =>
  typeof id === 'string' && id.trim().length > 0
))].sort((a, b) => a.localeCompare(b));

/**
 * Display-only review ordering of QL-163 synthetic holds. The order is not
 * business urgency, customer priority, permission or an executable queue.
 */
export function summarizeQl168UnresolvedHolds(source: Ql163DecisionContinuityReview): Ql168HoldPrioritySummary {
  const holdIds = safeSort([
    ...source.outstandingHoldIds,
    ...source.followUps.map(item => item.holdId)
  ]);
  const gateIds = source.gates.map(item => item.id);
  const prerequisiteIds = source.ownerEvidenceRequirements.map(item => item.id);
  const expectedGateCounts = {
    passed: source.gates.filter(item => item.status === 'pass').length,
    blocked: source.gates.filter(item => item.status === 'blocked').length
  };
  const sourceContract = source.build === 'QL-163' &&
    source.reviewedBuild === 'QL-162' &&
    source.mode === 'public_synthetic_exception_owner_decision_continuity_only' &&
    sameSet(gateIds, REQUIRED_GATES) &&
    source.gates.every(item => item.status === 'pass' || item.status === 'blocked') &&
    source.summary.passed === expectedGateCounts.passed &&
    source.summary.blocked === expectedGateCounts.blocked &&
    source.summary.passed + source.summary.blocked === source.gates.length &&
    source.outcome === (source.outstandingHoldIds.length > 0 || source.summary.blocked > 0
      ? 'synthetic_follow_up_authorization_held' : 'synthetic_evidence_continuity_only') &&
    sameSet(prerequisiteIds, REQUIRED_PREREQUISITES) &&
    source.ownerEvidenceRequirements.every(item =>
      typeof item.requirement === 'string' && item.requirement.trim().length > 0 &&
      item.evidenceState === 'not_independently_verified' &&
      item.humanDecisionState === 'not_recorded' &&
      item.authorizesFollowUp === false
    ) &&
    sameSet(source.sourceHoldIds, source.outstandingHoldIds) &&
    sameSet(source.replayedHoldIds, source.outstandingHoldIds) &&
    sameSet(source.outstandingHoldIds, source.followUps.map(item => item.holdId)) &&
    source.followUps.every(item =>
      typeof item.requiredEvidence === 'string' && item.requiredEvidence.trim().length > 0 &&
      (item.proposedRoute === 'synthetic_integrity_review' || item.proposedRoute === 'synthetic_evidence_follow_up') &&
      item.provenance === 'QL-162 synthetic follow-up' &&
      item.status === 'open_pending_separate_human_review' &&
      item.evidenceVerified === false &&
      item.ownerDecisionRecorded === false &&
      item.authorizedToFollowUp === false &&
      item.authorizedToDispatch === false &&
      item.authorizedToClose === false
    ) &&
    source.independentlyVerifiedRealEvidence === false &&
    source.authenticatedHumanOwner === false &&
    source.humanDecisionRecorded === false &&
    source.consentRecorded === false &&
    source.followUpAuthorized === false &&
    source.escalationDispatched === false &&
    source.realHoldClosed === false &&
    source.durableAuditWritten === false &&
    source.exportEnabled === false &&
    source.downloadEnabled === false &&
    source.canTransmit === false &&
    source.livePhoneSmsEnabled === false;

  const sourceIntegrityVerified = source.sourceIntegrityVerified && sourceContract;
  const byId = new Map(source.followUps.map(item => [item.holdId, item]));
  const buildLane = (
    id: Ql168PriorityLane['id'], reviewOrder: Ql168PriorityLane['reviewOrder'],
    title: string, blocker: string, ids: readonly string[]
  ): Ql168PriorityLane => ({
    id, reviewOrder, title, blocker, holdIds: ids,
    heldEvidence: ids.map(holdId => {
      const item = byId.get(holdId);
      return {
        holdId,
        proposedRoute: sourceIntegrityVerified ? item!.proposedRoute : 'synthetic_integrity_review' as const,
        requiredEvidence: sourceIntegrityVerified ? item!.requiredEvidence :
          'Reconcile source integrity and independently verify the missing evidence in a separate private review.',
        status: 'open_not_authorized' as const
      };
    })
  });
  const integrityIds = sourceIntegrityVerified
    ? holdIds.filter(id => byId.get(id)?.proposedRoute === 'synthetic_integrity_review')
    : holdIds;
  const evidenceIds = sourceIntegrityVerified
    ? holdIds.filter(id => byId.get(id)?.proposedRoute === 'synthetic_evidence_follow_up')
    : [];
  const lanes = [
    buildLane('integrity', 1, 'Source and integrity blockers',
      'Check synthetic lineage, provenance and source consistency before relying on an evidence summary.', integrityIds),
    buildLane('evidence', 2, 'Evidence follow-up blockers',
      'Separately verify evidence for open synthetic holds; this does not authorize a real follow-up.', evidenceIds)
  ] as const;

  const ownerPrerequisites: Ql168PrerequisiteSummary[] = sourceIntegrityVerified
    ? source.ownerEvidenceRequirements
      .map(item => ({
        id: item.id, requirement: item.requirement, affectedHoldIds: holdIds,
        evidenceState: 'not_independently_verified' as const,
        humanDecisionState: 'not_recorded' as const
      }))
      .sort((a, b) => REQUIRED_PREREQUISITES.indexOf(a.id as typeof REQUIRED_PREREQUISITES[number]) -
        REQUIRED_PREREQUISITES.indexOf(b.id as typeof REQUIRED_PREREQUISITES[number]))
    : REQUIRED_PREREQUISITES.map(id => ({
      id, requirement: 'Independent private owner evidence and human sign-off remain unverified.',
      affectedHoldIds: holdIds,
      evidenceState: 'not_independently_verified' as const,
      humanDecisionState: 'not_recorded' as const
    }));

  return {
    build: 'QL-168', reviewedBuild: 'QL-163',
    mode: 'public_synthetic_display_only_priority_summary',
    sourceIntegrityVerified,
    integrityWarning: sourceIntegrityVerified ? null :
      'Synthetic evidence or authorization contract is incomplete. Every listed hold stays in the first integrity-review group.',
    outstandingHoldIds: holdIds, lanes,
    blockedGates: sourceIntegrityVerified
      ? source.gates.filter(item => item.status === 'blocked').map(item => ({
        id: item.id, requirement: item.requirement, ifBlocked: item.ifBlocked
      }))
      : [{
        id: 'ql168-source-integrity-hold',
        requirement: 'QL-163 synthetic source integrity or owner authorization contract is not verified',
        ifBlocked: 'Reconcile the original in-memory evidence before trusting any proposed route or prerequisite.'
      }],
    ownerPrerequisites,
    actualPriorityOrUrgencyEstablished: false,
    authorizedToFollowUp: false, authorizedToDispatch: false,
    authorizedToClose: false, canWriteOrExport: false,
    livePhoneSmsEnabled: false,
    notice: 'Review order only, using synthetic evidence. No customer urgency, owner approval, follow-up, dispatch, hold closure, export, persistence or live Phone/SMS is established.'
  };
}
