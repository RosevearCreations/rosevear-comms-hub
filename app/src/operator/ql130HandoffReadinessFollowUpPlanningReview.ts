import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql129HandoffReadinessFollowUpPlanning } from './ql129HandoffReadinessFollowUpPlanning';

type Prior = Ql129HandoffReadinessFollowUpPlanning;
type PlanningReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql130HandoffReadinessFollowUpPlanningReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-130';
    title: string;
    reviewedBuild: 'QL-129';
    followUpPlanningReviewMode: 'display_only_handoff_readiness_follow_up_planning_review';
    followUpPlanningReviewOutcome: 'follow_up_planning_review_ready_for_separate_readiness_decision_only' | 'follow_up_planning_review_revision_required';
    ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved';
    followUpPlanningReviewSummary: { passed: number; review: number; blocked: number };
    followUpPlanningReviewItems: readonly PlanningReviewItem[];
    followUpPlanningReviewScope: readonly string[];
    followUpPlanningReviewAgenda: readonly string[];
    deferredPlanningReviewApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedSourceGateIds = [
  'ql129-source-review-gate-integrity',
  'ql129-source-outcome-and-tally',
  'ql129-owner-and-write-locks',
  'ql129-review-materials-available',
  'ql129-no-owner-capture',
  'ql129-safe-read-private-boundary',
  'ql129-disabled-communication-runtime',
  'ql129-independent-next-review'
] as const;

const statusFor = (condition: boolean): Ql094EvidenceStatus => condition ? 'pass' : 'review';

export function buildQl130HandoffReadinessFollowUpPlanningReview(prior: Prior): Ql130HandoffReadinessFollowUpPlanningReview {
  const recomputedSource = prior.followUpPlanningItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceGateIntegrity =
    prior.build === 'QL-129' &&
    prior.reviewedBuild === 'QL-128' &&
    prior.followUpPlanningItems.length === expectedSourceGateIds.length &&
    new Set(prior.followUpPlanningItems.map(item => item.id)).size === expectedSourceGateIds.length &&
    expectedSourceGateIds.every(id =>
      prior.followUpPlanningItems.some(item => item.id === id && item.status === 'pass')
    );

  const sourceOutcomeReconciled =
    sourceGateIntegrity &&
    prior.followUpPlanningOutcome === 'follow_up_plan_ready_for_separate_review_only' &&
    recomputedSource.passed === expectedSourceGateIds.length &&
    recomputedSource.review === 0 &&
    recomputedSource.blocked === 0 &&
    prior.followUpPlanningSummary.passed === recomputedSource.passed &&
    prior.followUpPlanningSummary.review === recomputedSource.review &&
    prior.followUpPlanningSummary.blocked === recomputedSource.blocked;

  const permissionsStayClosed =
    prior.ownerDecisionStatus === 'follow_up_planning_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const reviewMaterialsComplete =
    prior.followUpPlanningScope.length >= 5 &&
    prior.followUpPlanningAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const noOwnerChoiceCaptured =
    prior.pendingFollowUpApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.pendingFollowUpApprovals.some(text => text.includes('No owner permission')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-129 is synthetic/public safe-read FOLLOW-UP PLANNING only'));

  const privateFieldsExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const communicationAndWriteRuntimeDisabled =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-129 adds no schema')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-129 does not enable any Phone/SMS'));

  const independentFutureReviewAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.followUpPlanningAgenda.some(text => text.includes('QL-130 as an independent planning REVIEW')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const followUpPlanningReviewItems: readonly PlanningReviewItem[] = [
    {
      id: 'ql130-source-planning-gate-integrity',
      label: 'QL-129 includes exactly eight unique passing follow-up planning gates',
      status: statusFor(sourceGateIntegrity),
      readinessFinding: 'Expected eight QL-129 source gates; observed ' + prior.followUpPlanningItems.length + '.',
      readinessDisposition: 'Missing, duplicate, blocked or review-state gates require a corrected plan before any later review.',
      noWriteBoundary: 'No real owner, evidence ledger or durable gate record is captured.'
    },
    {
      id: 'ql130-source-planning-outcome-reconciliation',
      label: 'QL-129 follow-up plan result and recomputed pass/review/blocked totals are consistent',
      status: statusFor(sourceOutcomeReconciled),
      readinessFinding: recomputedSource.passed + ' pass, ' + recomputedSource.review + ' review, ' + recomputedSource.blocked + ' blocked.',
      readinessDisposition: 'Passing totals make this plan reviewable, never approved for implementation.',
      noWriteBoundary: 'No acceptance, consent, digital signature or persisted disposition.'
    },
    {
      id: 'ql130-owner-and-persistence-locks',
      label: 'Owner, implementation, schema, API, browser, Supabase and ledger write locks remain closed',
      status: statusFor(permissionsStayClosed),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser writes ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'No decision capture, database write, migration or API mutation can follow from this review.',
      noWriteBoundary: 'No schema, API/Worker, Supabase, browser, audit, archive or evidence-ledger mutation.'
    },
    {
      id: 'ql130-review-agenda-and-packet-materials',
      label: 'Synthetic/public handoff packet, follow-up agenda and release prerequisites remain inspectable',
      status: statusFor(reviewMaterialsComplete),
      readinessFinding: prior.followUpPlanningAgenda.length + ' agenda steps, ' + prior.handoffRequirements.length + ' handoff requirements.',
      readinessDisposition: 'Review proposed roles and prerequisites without identifying a real owner or executing a handoff.',
      noWriteBoundary: 'No owner identity, submission, packet export, reviewer assignment or retained decision.'
    },
    {
      id: 'ql130-no-owner-approval-or-consent',
      label: 'All accept, reject, defer, revise, signature, approval and consent operations remain prohibited',
      status: statusFor(noOwnerChoiceCaptured),
      readinessFinding: prior.pendingFollowUpApprovals.length + ' deferred approvals; ' + prior.captureStillNotAuthorized.length + ' capture restrictions.',
      readinessDisposition: 'A future owner approval requires separate explicit security, authority, privacy and retention review.',
      noWriteBoundary: 'No recorded choice, consent event, status transition or evidence persistence.'
    },
    {
      id: 'ql130-private-data-isolation',
      label: 'Public/synthetic planning fields remain disjoint from banned customer/provider private fields',
      status: statusFor(privateFieldsExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate planning fields; ' + prior.rejectedPrivateFields.length + ' rejected fields.',
      readinessDisposition: 'Retain existing validated public/synthetic reads or local synthetic fallback only.',
      noWriteBoundary: 'No customer phone, provider tokens, SMS, calls, recordings, consent or AI data.'
    },
    {
      id: 'ql130-disabled-live-runtime',
      label: 'Phone/SMS, DTMF, provider callbacks, call recording, AI delivery and live pilot remain disabled',
      status: statusFor(communicationAndWriteRuntimeDisabled),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write safeguards; ' + prior.implementationStillProhibited.length + ' implementation prohibitions.',
      readinessDisposition: 'No live channels may be enabled by reviewing follow-up planning.',
      noWriteBoundary: 'No live calls/texts, provider callbacks, recording, AI sending or live pilot.'
    },
    {
      id: 'ql130-separate-readiness-approval-and-release-gates',
      label: 'Any later planning readiness decision, owner permission and exact-main release tests remain independent',
      status: statusFor(independentFutureReviewAndRelease),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'QL-131 scope must be confirmed separately; GREEN requires independent checks on exact final main SHA.',
      noWriteBoundary: 'Passing this review never grants implementation or real owner approval.'
    }
  ];

  const followUpPlanningReviewSummary = followUpPlanningReviewItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });
  const followUpPlanningReviewOutcome =
    followUpPlanningReviewSummary.review === 0 && followUpPlanningReviewSummary.blocked === 0
      ? 'follow_up_planning_review_ready_for_separate_readiness_decision_only'
      : 'follow_up_planning_review_revision_required';

  return {
    ...prior,
    build: 'QL-130',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review Follow-Up Planning Review',
    reviewedBuild: 'QL-129',
    followUpPlanningReviewMode: 'display_only_handoff_readiness_follow_up_planning_review',
    followUpPlanningReviewOutcome,
    followUpPlanningReviewSummary,
    followUpPlanningReviewItems,
    ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    followUpPlanningReviewScope: [
      'Independently validate QL-129 gate identities, pass statuses, summary and outcome, stopping on any discrepancy.',
      'Review only public/synthetic follow-up packet scope, agenda and prerequisites using existing read-only sources.',
      'Maintain separate owner permission and decision/consent capture gates; never collect real choices here.',
      'Maintain disabled ledger, schema, API, browser, Phone/SMS, provider callback, recording, AI and pilot operation.',
      'Reserve a later independent readiness decision and confirm the next build scope from the roadmap.'
    ],
    followUpPlanningReviewAgenda: [
      'Reconcile the eight QL-129 gate IDs, review statuses and independent summary totals.',
      'Inventory synthetic packet questions, planned handoff prerequisites, and outstanding exceptions.',
      'Verify owner authority, privacy, role-based access, consent, audit and retention requirements remain deferred.',
      'Check that no accept/reject/defer/revise, consent or signature capture is implemented.',
      'Reaffirm strict public/synthetic-only evidence inputs and sensitive-field exclusion.',
      'Recheck no database/API/browser writes, live Phone/SMS, provider callback, recording, AI delivery or pilot.',
      'Refer next only for a separate owner-unauthorized review readiness decision after roadmap scope confirmation.'
    ],
    deferredPlanningReviewApprovals: [
      'No owner accept, reject, defer, revise, signature or consent decision has been collected.',
      'Owner decision capture, roles, evidence ledger, retention and audit controls require separate explicit permission.',
      'Real reviewer identities and packet transfers remain unauthorized and unrecorded.',
      'Phone/SMS, DTMF, provider callbacks, recordings, AI sending and live pilot remain disabled.',
      'A passing review may only inform future synthetic/public planning and cannot initiate implementation.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-130 is a public/synthetic follow-up PLANNING REVIEW only, not owner approval or permission to implement.',
      'QL-130 adds no schema, API, Worker, Supabase, browser, archive, audit, local storage or evidence-ledger writes.',
      'QL-130 does not enable Phone/SMS, DTMF, provider callbacks, recording, AI sends or live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop when a QL-129 planning gate is absent, duplicated, non-passing or inconsistent with its source outcome.',
      'Stop on any attempted owner choice or consent capture or any claim that planning review equals authorization.',
      'Stop on any customer/provider private-data access, persistence path or live communications/AI delivery.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-130 is DISPLAY-ONLY review of QL-129 follow-up planning with public/synthetic safe reads. Passing permits consideration of a later independently scoped readiness decision only. Owner consent, decision capture, implementation, database/API/browser/ledger writes, Phone/SMS, provider callbacks, recordings, AI sending and live pilot remain NOT AUTHORIZED.',
    nextQueuedBuild: 'QL-131 — Handoff Readiness Follow-Up Planning Review Readiness Decision (scope to be confirmed against roadmap)',
    generatedAt: new Date().toISOString()
  };
}
