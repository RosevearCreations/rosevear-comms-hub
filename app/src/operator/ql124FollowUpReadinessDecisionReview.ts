import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql123FollowUpReadinessDecision } from './ql123FollowUpReadinessDecision';

type Prior = Ql123FollowUpReadinessDecision;
type Ql124ReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql124FollowUpReadinessDecisionReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-124';
    title: string;
    reviewedBuild: 'QL-123';
    readinessReviewMode: 'display_only_follow_up_readiness_decision_review';
    readinessReviewOutcome: 'review_ready_for_separate_owner_handoff_planning' | 'readiness_review_revision_required';
    ownerDecisionStatus: 'follow_up_readiness_review_only_owner_not_approved';
    readinessReviewSummary: { passed: number; review: number; blocked: number };
    readinessReviewItems: readonly Ql124ReviewItem[];
    readinessReviewScope: readonly string[];
    handoffReviewAgenda: readonly string[];
    deferredApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl123GateIds = [
  'ql123-source-review-integrity',
  'ql123-recomputed-outcome',
  'ql123-owner-write-locks',
  'ql123-owner-packet-materials',
  'ql123-no-owner-choice',
  'ql123-sensitive-field-boundary',
  'ql123-live-runtime-disabled',
  'ql123-future-owner-release-gates'
] as const;

function statusWhen(test: boolean): Ql094EvidenceStatus {
  return test ? 'pass' : 'review';
}

export function buildQl124FollowUpReadinessDecisionReview(prior: Prior): Ql124FollowUpReadinessDecisionReview {
  const calculated = prior.readinessItems.reduce((total, item) => ({
    passed: total.passed + Number(item.status === 'pass'),
    review: total.review + Number(item.status === 'review'),
    blocked: total.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceGateIntegrity =
    prior.build === 'QL-123' &&
    prior.reviewedBuild === 'QL-122' &&
    prior.readinessItems.length === expectedQl123GateIds.length &&
    new Set(prior.readinessItems.map(item => item.id)).size === expectedQl123GateIds.length &&
    expectedQl123GateIds.every(id => prior.readinessItems.some(item => item.id === id && item.status === 'pass'));

  const sourceOutcomeIntegrity =
    sourceGateIntegrity &&
    prior.readinessOutcome === 'ready_for_later_owner_packet_review_only' &&
    calculated.passed === expectedQl123GateIds.length &&
    calculated.review === 0 &&
    calculated.blocked === 0 &&
    prior.readinessSummary.passed === calculated.passed &&
    prior.readinessSummary.review === calculated.review &&
    prior.readinessSummary.blocked === calculated.blocked;

  const permissionBoundary =
    prior.ownerDecisionStatus === 'follow_up_readiness_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const ownerPacketAvailable =
    prior.followUpReadinessAgenda.length >= 7 &&
    prior.approvedReadinessScope.length >= 5 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5;

  const ownerConsentStillAbsent =
    prior.pendingOwnerApprovals.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.pendingOwnerApprovals.some(item => item.includes('not consent'));

  const privateFieldExclusions =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const disabledRuntime =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-123 is readiness for later owner packet review only')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-123 does not enable provider calls'));

  const futureReleaseGates =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.pendingOwnerApprovals.some(text => text.includes('later authorized process')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const readinessReviewItems: readonly Ql124ReviewItem[] = [
    {
      id: 'ql124-ql123-gate-identities',
      label: 'QL-123 has exactly eight unique, passing source readiness gates',
      status: statusWhen(sourceGateIntegrity),
      readinessFinding: 'Expected eight QL-123 gate IDs, observed ' + prior.readinessItems.length + '.',
      readinessDisposition: 'Missing, duplicate or non-passing source gates require revision instead of a handoff.',
      noWriteBoundary: 'No persisted gate record or owner decision is created.'
    },
    {
      id: 'ql124-ql123-outcome-tally',
      label: 'QL-123 ready-for-later-review outcome reconciles with recomputed totals',
      status: statusWhen(sourceOutcomeIntegrity),
      readinessFinding: 'Recomputed ' + calculated.passed + ' pass, ' + calculated.review + ' review, ' + calculated.blocked + ' blocked.',
      readinessDisposition: 'A clean source is eligible for separate handoff planning, never implementation approval.',
      noWriteBoundary: 'No consent, owner acceptance or durable evidence of approval is inferred.'
    },
    {
      id: 'ql124-implementation-permissions',
      label: 'Owner, implementation, schema, API, ledger and browser write locks remain closed',
      status: statusWhen(permissionBoundary),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Read-only review only; the owner must separately authorize future implementation.',
      noWriteBoundary: 'No schema migration, database insert, browser save, endpoint mutation or ledger write.'
    },
    {
      id: 'ql124-review-packet-completeness',
      label: 'QL-123 readiness agenda, review packet and owner questions remain inspectable',
      status: statusWhen(ownerPacketAvailable),
      readinessFinding: prior.followUpReadinessAgenda.length + ' readiness agenda steps and ' + prior.handoffRequirements.length + ' handoff requirements.',
      readinessDisposition: 'Pass packet material for planning only, not to an implementation queue.',
      noWriteBoundary: 'No owner-choice form, submission, audit trail, export or data retention.'
    },
    {
      id: 'ql124-owner-approval-absence',
      label: 'No owner decision or consent has been captured or inferred',
      status: statusWhen(ownerConsentStillAbsent),
      readinessFinding: prior.pendingOwnerApprovals.length + ' outstanding approvals; ' + prior.captureStillNotAuthorized.length + ' capture prohibitions.',
      readinessDisposition: 'Accept, reject, defer, revise, signature and consent are still unrecorded future decisions.',
      noWriteBoundary: 'No accepted/rejected/deferred owner status is persisted or treated as approved.'
    },
    {
      id: 'ql124-sensitive-information-exclusions',
      label: 'Synthetic planning fields remain distinct from excluded private information',
      status: statusWhen(privateFieldExclusions),
      readinessFinding: prior.candidateLedgerFields.length + ' unique candidate fields, ' + prior.rejectedPrivateFields.length + ' excluded fields.',
      readinessDisposition: 'Remain on validated public/synthetic safe reads or local synthetic fallback.',
      noWriteBoundary: 'No customer, provider, SMS, voice, callback, consent, recording or AI data.'
    },
    {
      id: 'ql124-public-preview-disabled',
      label: 'Phone/SMS, provider, callback, evidence writes, AI delivery and live pilot remain disabled',
      status: statusWhen(disabledRuntime),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write runtime safeguards and ' + prior.implementationStillProhibited.length + ' implementation bans.',
      readinessDisposition: 'A readiness review cannot activate any live communication or data path.',
      noWriteBoundary: 'No outgoing messages, calls, recording, provider callback, retention writes or AI send.'
    },
    {
      id: 'ql124-independent-owner-and-release-gates',
      label: 'Future owner approval and independent deployment verification remain separate gates',
      status: statusWhen(futureReleaseGates),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites, ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'A later handoff review requires its own authorization. Production GREEN must be verified on the exact main commit.',
      noWriteBoundary: 'Do not equate a passing review with owner approval, release authorization or final deployment success.'
    }
  ];

  const readinessReviewSummary = readinessReviewItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const readinessReviewOutcome =
    readinessReviewSummary.review === 0 && readinessReviewSummary.blocked === 0
      ? 'review_ready_for_separate_owner_handoff_planning'
      : 'readiness_review_revision_required';

  return {
    ...prior,
    build: 'QL-124',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Decision Review',
    reviewedBuild: 'QL-123',
    readinessReviewMode: 'display_only_follow_up_readiness_decision_review',
    readinessReviewOutcome,
    readinessReviewSummary,
    readinessReviewItems,
    ownerDecisionStatus: 'follow_up_readiness_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    readinessReviewScope: [
      'Independently recompute all eight QL-123 readiness gate results and source totals; fail closed on changes.',
      'Review the synthetic/public safe-read owner packet, its agenda, and the still-outstanding prerequisites.',
      'Keep owner approval, capture, evidence ledger persistence, schema, API and browser writes prohibited.',
      'Retain no-live-runtime protections for all Phone/SMS, callback, recording, DTMF and AI delivery operations.',
      'Gate any QL-125 handoff planning behind this review, without authorizing implementation or decisions.'
    ],
    handoffReviewAgenda: [
      'Verify QL-123 gate identifiers, statuses, and recalculated readiness totals.',
      'List all material requiring correction before any later owner-review handoff.',
      'Inspect synthetic/public-safe candidate planning fields against private-field exclusions.',
      'Review prior owner packet questions without collecting or storing answers.',
      'Confirm separate owner approval, privacy, authorization, retention, and security requirements.',
      'Reconfirm disabled calls, SMS, recording, provider, AI, callback and live-pilot paths.',
      'Reserve QL-125 for separate read-only handoff planning only; no implementation or owner capture.'
    ],
    deferredApprovals: [
      'No owner decision or approval was recorded in QL-123 or QL-124.',
      'No evidence-ledger persistence, migration, endpoint or browser write has been approved.',
      'No real customer, provider, communication, call recording, consent, audit or retention access is authorized.',
      'No live pilot, messaging, callbacks or AI sending is authorized.',
      'Any later owner decision requires separately reviewed and expressly authorized capture controls.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-124 reviews prior readiness only; a passing review never grants owner approval.',
      'QL-124 has no API/browser/Supabase persistence, migrations, signatures or decision capture.',
      'QL-124 does not enable Phone/SMS, provider callbacks, recordings, AI sending or live pilots.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if a QL-123 source gate is missing, duplicated, non-passing or contradictory.',
      'Stop if QL-124 readiness is described as owner approval or permission to implement.',
      'Stop on any attempted private-data read, persistence, schema, provider integration or live messaging path.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-124 is DISPLAY-ONLY review of QL-123 readiness. Passing permits planning a later owner packet handoff only. Owner approval, consent, implementation and data persistence remain NOT AUTHORIZED. No Supabase/API/browser writes, schema, Phone/SMS, provider callbacks, recordings, audit, retention, AI delivery or live pilot.',
    nextQueuedBuild: 'QL-125 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Planning',
    generatedAt: new Date().toISOString()
  };
}
