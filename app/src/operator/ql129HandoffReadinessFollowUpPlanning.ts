import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql128HandoffReadinessDecisionReview } from './ql128HandoffReadinessDecisionReview';

type Prior = Ql128HandoffReadinessDecisionReview;
type FollowUpItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql129HandoffReadinessFollowUpPlanning =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-129';
    title: string;
    reviewedBuild: 'QL-128';
    followUpPlanningMode: 'display_only_handoff_readiness_review_follow_up_planning';
    followUpPlanningOutcome: 'follow_up_plan_ready_for_separate_review_only' | 'follow_up_plan_revision_required';
    ownerDecisionStatus: 'follow_up_planning_only_owner_not_approved';
    followUpPlanningSummary: { passed: number; review: number; blocked: number };
    followUpPlanningItems: readonly FollowUpItem[];
    followUpPlanningScope: readonly string[];
    followUpPlanningAgenda: readonly string[];
    pendingFollowUpApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedSourceGateIds = [
  'ql128-source-readiness-gate-integrity',
  'ql128-source-outcome-reconciliation',
  'ql128-owner-permissions-still-locked',
  'ql128-review-packet-completeness',
  'ql128-deferred-owner-choice-restrictions',
  'ql128-sensitive-field-exclusions',
  'ql128-live-runtime-remains-disabled',
  'ql128-future-authorization-and-release'
] as const;
const passIf = (value: boolean): Ql094EvidenceStatus => value ? 'pass' : 'review';

export function buildQl129HandoffReadinessFollowUpPlanning(prior: Prior): Ql129HandoffReadinessFollowUpPlanning {
  const sourceCounts = prior.handoffDecisionReviewItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceGateIntegrity =
    prior.build === 'QL-128' &&
    prior.reviewedBuild === 'QL-127' &&
    prior.handoffDecisionReviewItems.length === expectedSourceGateIds.length &&
    new Set(prior.handoffDecisionReviewItems.map(item => item.id)).size === expectedSourceGateIds.length &&
    expectedSourceGateIds.every(id =>
      prior.handoffDecisionReviewItems.some(item => item.id === id && item.status === 'pass')
    );
  const sourceOutcomeIntegrity =
    sourceGateIntegrity &&
    prior.handoffDecisionReviewOutcome === 'handoff_readiness_review_ready_for_separate_follow_up_planning' &&
    sourceCounts.passed === expectedSourceGateIds.length &&
    sourceCounts.review === 0 &&
    sourceCounts.blocked === 0 &&
    prior.handoffDecisionReviewSummary.passed === sourceCounts.passed &&
    prior.handoffDecisionReviewSummary.review === sourceCounts.review &&
    prior.handoffDecisionReviewSummary.blocked === sourceCounts.blocked;
  const writeLockIntegrity =
    prior.ownerDecisionStatus === 'handoff_readiness_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';
  const packetAndFollowUpMaterials =
    prior.handoffDecisionReviewScope.length >= 5 &&
    prior.handoffDecisionReviewAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5;
  const ownerDecisionStillDeferred =
    prior.outstandingOwnerReviewApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.outstandingOwnerReviewApprovals.some(text => text.includes('has not been requested')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-128 reviews QL-127 handoff readiness only'));
  const noPrivateFields =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));
  const disabledRuntime =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-128 adds no schema')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-128 does not enable Phone/SMS'));
  const separatedFuturePermissions =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.handoffDecisionReviewAgenda.some(text => text.includes('separate QL-129 follow-up planning step')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const followUpPlanningItems: readonly FollowUpItem[] = [
    {
      id: 'ql129-source-review-gate-integrity',
      label: 'QL-128 contains exactly eight unique and passing readiness-review gates',
      status: passIf(sourceGateIntegrity),
      readinessFinding: 'Expected eight source gates; observed ' + prior.handoffDecisionReviewItems.length + '.',
      readinessDisposition: 'A missing, duplicated, review or blocked gate forces revision instead of follow-up planning.',
      noWriteBoundary: 'No gate statuses or reviewer choices are saved.'
    },
    {
      id: 'ql129-source-outcome-and-tally',
      label: 'The QL-128 result and independently recomputed gate totals agree',
      status: passIf(sourceOutcomeIntegrity),
      readinessFinding: sourceCounts.passed + ' pass, ' + sourceCounts.review + ' review, ' + sourceCounts.blocked + ' blocked.',
      readinessDisposition: 'Passing counts permit only a later follow-up plan review, never a live handoff.',
      noWriteBoundary: 'No approval, signature, consent or durable evidence is inferred.'
    },
    {
      id: 'ql129-owner-and-write-locks',
      label: 'Owner and schema, API, browser, Supabase and evidence ledger permissions remain locked',
      status: passIf(writeLockIntegrity),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'The plan must not grant write permissions or implementation approval.',
      noWriteBoundary: 'No schema migration, API/Worker/Supabase/browser mutation, archive or audit row.'
    },
    {
      id: 'ql129-review-materials-available',
      label: 'The synthetic/public packet, questions and review agenda remain available for planning only',
      status: passIf(packetAndFollowUpMaterials),
      readinessFinding: prior.handoffDecisionReviewAgenda.length + ' agenda steps and ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'List future reviewers, questions and dependencies without transferring real packets or identities.',
      noWriteBoundary: 'No owner packet send, submission, export, signature or storage.'
    },
    {
      id: 'ql129-no-owner-capture',
      label: 'All owner decisions, signatures and consent remain deferred without capture',
      status: passIf(ownerDecisionStillDeferred),
      readinessFinding: prior.outstandingOwnerReviewApprovals.length + ' deferred approvals and ' + prior.captureStillNotAuthorized.length + ' capture prohibitions.',
      readinessDisposition: 'Require separately approved owner identity, access, consent and retention mechanisms.',
      noWriteBoundary: 'No accepted/rejected/deferred status, decision history or consent record.'
    },
    {
      id: 'ql129-safe-read-private-boundary',
      label: 'Planning fields remain disjoint from excluded private customer/provider information',
      status: passIf(noPrivateFields),
      readinessFinding: prior.candidateLedgerFields.length + ' proposed planning fields, ' + prior.rejectedPrivateFields.length + ' private exclusions.',
      readinessDisposition: 'Continue only with validated public/synthetic reads and local fallback.',
      noWriteBoundary: 'No real customer, call, SMS, recording, provider credential, consent or AI data.'
    },
    {
      id: 'ql129-disabled-communication-runtime',
      label: 'Live Phone/SMS, DTMF, provider, callback, recording, AI delivery and pilot remain disabled',
      status: passIf(disabledRuntime),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write safeguards and ' + prior.implementationStillProhibited.length + ' prohibited implementation targets.',
      readinessDisposition: 'A follow-up plan may not activate a live communications path.',
      noWriteBoundary: 'No live provider interaction, text, call, callback, recording, AI send or pilot.'
    },
    {
      id: 'ql129-independent-next-review',
      label: 'Separate QL-130 review, owner authorization and exact-main promotion checks remain required',
      status: passIf(separatedFuturePermissions),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites, ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'Permit only independent review of this follow-up plan; do not treat CI success as owner approval.',
      noWriteBoundary: 'No owner authorization, active production feature or evidence-ledger persistence.'
    }
  ];
  const followUpPlanningSummary = followUpPlanningItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });
  const followUpPlanningOutcome = followUpPlanningSummary.review === 0 && followUpPlanningSummary.blocked === 0
    ? 'follow_up_plan_ready_for_separate_review_only'
    : 'follow_up_plan_revision_required';

  return {
    ...prior,
    build: 'QL-129',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review Follow-Up Planning',
    reviewedBuild: 'QL-128',
    followUpPlanningMode: 'display_only_handoff_readiness_review_follow_up_planning',
    followUpPlanningOutcome,
    followUpPlanningSummary,
    followUpPlanningItems,
    ownerDecisionStatus: 'follow_up_planning_only_owner_not_approved',
    implementationPermission: 'not_granted',
    followUpPlanningScope: [
      'Reconcile all eight QL-128 readiness-review gates and stop on any discrepancy.',
      'Plan a later reviewer handoff process using only existing synthetic/public read-only evidence.',
      'Identify missing owner permission, privacy, identity, retention and review requirements without collecting decisions.',
      'Retain all database/API/browser/ledger write bans and live communications and AI send restrictions.',
      'Proceed only to QL-130 independent read-only follow-up planning review, not implementation.'
    ],
    followUpPlanningAgenda: [
      'Recompute QL-128 gate identities, statuses and totals; flag missing or inconsistent evidence.',
      'Inventory synthetic/public packet questions and outstanding handoff prerequisites for a future reviewer.',
      'Describe what owner authority, access permissions and privacy/retention review must happen later.',
      'Keep all accept/reject/defer/revise, consent and signatures out of the current UI.',
      'Preserve customer/provider/private-field exclusions and no-write runtime constraints.',
      'Confirm no live Phone/SMS, DTMF, provider callback, recording, AI send or pilot path is active.',
      'Set QL-130 as an independent planning REVIEW only; no real handoff, decisions or implementation.'
    ],
    pendingFollowUpApprovals: [
      'No owner permission, decision, signature or consent has been requested or recorded.',
      'Owner decision capture and evidence ledger schema, API, browser and retention policies require later approval.',
      'A real reviewer, identity, roles, access and packet-transfer policy remain to be independently authorized.',
      'Phone/SMS, provider callbacks, recordings, AI sending and any live pilot remain disabled.',
      'Passing QL-129 planning is not authority for acceptance, implementation, migration or live delivery.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-129 is synthetic/public safe-read FOLLOW-UP PLANNING only, never owner approval.',
      'QL-129 adds no schema, API, Worker, Supabase, browser, archive, audit or evidence-ledger writes.',
      'QL-129 does not enable any Phone/SMS, callback, recording, provider, AI sending or pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-128 readiness-review gate is missing, repeated, inconsistent or nonpassing.',
      'Stop if a follow-up plan is interpreted as real owner authorization, consent or decision capture.',
      'Stop on any private data access, live provider/Phone/SMS operation, new schema or persistence.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-129 is DISPLAY-ONLY synthetic/public follow-up PLANNING after QL-128 readiness review. Passing allows separate planning review only. No owner decision, consent, implementation, ledger/database/API/browser write, live Phone/SMS, provider callback, recording, AI sending or pilot is authorized.',
    nextQueuedBuild: 'QL-130 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review Follow-Up Planning Review',
    generatedAt: new Date().toISOString()
  };
}
