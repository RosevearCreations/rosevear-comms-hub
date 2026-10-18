import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql135FollowUpPlanningReviewReadinessDecision } from './ql135FollowUpPlanningReviewReadinessDecision';

type Prior = Ql135FollowUpPlanningReviewReadinessDecision;
type DecisionReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql136FollowUpPlanningReadinessDecisionReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-136';
    title: string;
    reviewedBuild: 'QL-135';
    followUpReadinessDecisionReviewMode: 'display_only_follow_up_planning_readiness_decision_review';
    followUpReadinessDecisionReviewOutcome: 'ready_for_separate_read_only_follow_up_planning_only' | 'follow_up_readiness_decision_review_revision_required';
    ownerDecisionStatus: 'follow_up_readiness_decision_review_only_owner_not_approved';
    followUpReadinessDecisionReviewSummary: { passed: number; review: number; blocked: number };
    followUpReadinessDecisionReviewItems: readonly DecisionReviewItem[];
    followUpReadinessDecisionReviewScope: readonly string[];
    followUpReadinessDecisionReviewAgenda: readonly string[];
    deferredReadinessReviewApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl135Ids = [
  'ql135-source-gates-unique-and-passing',
  'ql135-source-review-totals-and-outcome',
  'ql135-no-owner-or-implementation-writes',
  'ql135-synthetic-packet-prerequisites',
  'ql135-owner-choices-consent-still-deferred',
  'ql135-restricted-fields-excluded',
  'ql135-live-communications-remain-off',
  'ql135-next-review-is-distinct'
] as const;

const gate = (ok: boolean): Ql094EvidenceStatus => ok ? 'pass' : 'review';

export function buildQl136FollowUpPlanningReadinessDecisionReview(prior: Prior): Ql136FollowUpPlanningReadinessDecisionReview {
  const sourceTotals = prior.followUpPlanningReadinessItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const allUniqueExpectedPassing =
    prior.build === 'QL-135' &&
    prior.reviewedBuild === 'QL-134' &&
    prior.followUpPlanningReadinessItems.length === expectedQl135Ids.length &&
    new Set(prior.followUpPlanningReadinessItems.map(item => item.id)).size === expectedQl135Ids.length &&
    expectedQl135Ids.every(id => prior.followUpPlanningReadinessItems.some(item => item.id === id && item.status === 'pass'));

  const sourceReconciled =
    allUniqueExpectedPassing &&
    prior.followUpPlanningReadinessOutcome === 'ready_for_independent_readiness_decision_review_only' &&
    sourceTotals.passed === expectedQl135Ids.length &&
    sourceTotals.review === 0 && sourceTotals.blocked === 0 &&
    prior.followUpPlanningReadinessSummary.passed === sourceTotals.passed &&
    prior.followUpPlanningReadinessSummary.review === sourceTotals.review &&
    prior.followUpPlanningReadinessSummary.blocked === sourceTotals.blocked;

  const allOwnerAndWriteLocksClosed =
    prior.ownerDecisionStatus === 'follow_up_planning_readiness_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const reviewPacketAvailable =
    prior.followUpPlanningReadinessScope.length >= 5 &&
    prior.followUpPlanningReadinessAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const ownerChoicesUncollected =
    prior.deferredReadinessOwnerApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.deferredReadinessOwnerApprovals.some(value => value.includes('No owner choice')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-135 is a DISPLAY-ONLY planning-review READINESS DECISION'));

  const privateDataStillExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const liveRuntimeAndWritesDisabled =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(value => value.includes('QL-135 adds no schema')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-135 does not enable Phone/SMS'));

  const nextStepIndependent =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.followUpPlanningReadinessAgenda.some(value => value.includes('QL-136 review')) &&
    prior.handoffRequirements.some(value => value.includes('Exact PR-head CI success'));

  const followUpReadinessDecisionReviewItems: readonly DecisionReviewItem[] = [
    {
      id: 'ql136-ql135-gate-integrity',
      label: 'Exactly eight unique expected QL-135 readiness decision gates pass',
      status: gate(allUniqueExpectedPassing),
      readinessFinding: 'Expected eight QL-135 readiness gates; observed ' + prior.followUpPlanningReadinessItems.length + '.',
      readinessDisposition: 'Any missing, duplicated or nonpassing readiness gate requires revision.',
      noWriteBoundary: 'In-memory synthetic source review only; no persisted gate, owner or audit record.'
    },
    {
      id: 'ql136-outcome-and-counts',
      label: 'QL-135 review-ready outcome matches independently recomputed pass/review/blocked counts',
      status: gate(sourceReconciled),
      readinessFinding: sourceTotals.passed + ' pass, ' + sourceTotals.review + ' review, ' + sourceTotals.blocked + ' blocked.',
      readinessDisposition: 'Passing is only readiness for later separate read-only follow-up planning.',
      noWriteBoundary: 'No owner acceptance, consent, signature, audit history or stored status.'
    },
    {
      id: 'ql136-owner-permission-and-write-locks',
      label: 'Owner, implementation, schema, Worker/API, Supabase, browser and ledger permissions remain locked',
      status: gate(allOwnerAndWriteLocksClosed),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + ', implementation ' + prior.implementationPermission + ', browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Review never grants permission to capture decisions, write data or activate a service.',
      noWriteBoundary: 'No schema migration, API/Worker/Supabase/browser, ledger, audit or archive mutation.'
    },
    {
      id: 'ql136-public-synthetic-materials',
      label: 'Safe-read synthetic/public packet, agenda, questions and prerequisites remain available',
      status: gate(reviewPacketAvailable),
      readinessFinding: prior.followUpPlanningReadinessAgenda.length + ' agenda steps; ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'Inspect synthetic packets in-place only; no real reviewer assignment or handoff.',
      noWriteBoundary: 'No owner identity, packet submission/export, transfer, consent or retention.'
    },
    {
      id: 'ql136-owner-decisions-and-consent-deferred',
      label: 'Owner accept/reject/defer/revise, signatures, permission and consent remain uncollected',
      status: gate(ownerChoicesUncollected),
      readinessFinding: prior.deferredReadinessOwnerApprovals.length + ' deferred approvals; ' + prior.captureStillNotAuthorized.length + ' capture prohibitions.',
      readinessDisposition: 'Future real owner review requires separately authorized identity, roles, privacy, consent and retention.',
      noWriteBoundary: 'No real owner choice, consent ledger, signature, decision status or evidence row.'
    },
    {
      id: 'ql136-private-field-exclusion',
      label: 'Candidate public/synthetic planning fields exclude private customer/provider information',
      status: gate(privateDataStillExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate fields; ' + prior.rejectedPrivateFields.length + ' excluded private fields.',
      readinessDisposition: 'Use only validated public/synthetic safe reads and local synthetic fallback.',
      noWriteBoundary: 'No private phones, SMS, calls, recordings, provider secrets, consent or AI content.'
    },
    {
      id: 'ql136-disabled-communications-and-persistence',
      label: 'Live Phone/SMS, DTMF, callbacks, recordings, provider, AI, pilot and write runtime remain disabled',
      status: gate(liveRuntimeAndWritesDisabled),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write runtime controls; ' + prior.implementationStillProhibited.length + ' implementation restrictions.',
      readinessDisposition: 'Passing review cannot activate phone, text, recording, AI send or persistent evidence.',
      noWriteBoundary: 'No live communication, provider connect, callback, recording, AI send or pilot.'
    },
    {
      id: 'ql136-independent-next-gate-and-release',
      label: 'Later follow-up planning, owner permission and exact-final-main release verification stay independent',
      status: gate(nextStepIndependent),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites; ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'QL-137 planning is a separate nonpublishing decision; CI does not grant owner approval.',
      noWriteBoundary: 'No owner authorization, implementation entitlement, release success or live activation inferred.'
    }
  ];

  const followUpReadinessDecisionReviewSummary = followUpReadinessDecisionReviewItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });
  const followUpReadinessDecisionReviewOutcome =
    followUpReadinessDecisionReviewSummary.review === 0 && followUpReadinessDecisionReviewSummary.blocked === 0
      ? 'ready_for_separate_read_only_follow_up_planning_only'
      : 'follow_up_readiness_decision_review_revision_required';

  return {
    ...prior,
    build: 'QL-136',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review',
    reviewedBuild: 'QL-135',
    followUpReadinessDecisionReviewMode: 'display_only_follow_up_planning_readiness_decision_review',
    followUpReadinessDecisionReviewOutcome,
    followUpReadinessDecisionReviewSummary,
    followUpReadinessDecisionReviewItems,
    ownerDecisionStatus: 'follow_up_readiness_decision_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    followUpReadinessDecisionReviewScope: [
      'Independently validate all eight QL-135 readiness decision gates, unique IDs, statuses, summary and source outcome.',
      'Review only existing public/synthetic packet, agenda and readiness prerequisites without real handoff.',
      'Keep owner choices, signatures, consent, implementation, schema/API/browser/Supabase/ledger writes locked.',
      'Preserve private field isolation and disabled Phone/SMS, DTMF, callbacks, recordings, AI sending and live pilot.',
      'Recommend only a separately scoped QL-137 read-only follow-up planning step if all gates pass.'
    ],
    followUpReadinessDecisionReviewAgenda: [
      'Recompute QL-135 gate counts and verify each expected unique passing source ID.',
      'Confirm QL-135 review-ready source outcome and exact independently calculated status totals.',
      'Inventory public/synthetic packet questions, review agenda, open handoff prerequisites and owners not contacted.',
      'List separate owner identity, authority, consent, privacy, access and retention approvals still required.',
      'Reconfirm no private customer/provider fields, database/API/browser writes, real owner choice or consent capture.',
      'Check all live Phone/SMS, DTMF, provider callbacks, recordings, AI sends and pilot paths remain disabled.',
      'Refer forward only to distinct nonpublishing QL-137 follow-up planning and exact release evidence checks.'
    ],
    deferredReadinessReviewApprovals: [
      'No real owner decision, rejection, approval, signature, consent or captured status has been requested or recorded.',
      'Future owner and reviewer roles, identity, privacy, access and retention conditions require independent approval.',
      'Evidence ledger, schema/migrations and API/Worker/Supabase/browser persistence are not approved.',
      'Live Phone/SMS, DTMF, callbacks, recordings, provider connections, AI sends and pilots remain prohibited.',
      'Passing QL-136 review means only possible next planning; it is not authority to implement or communicate.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-136 is a DISPLAY-ONLY public/synthetic READINESS DECISION REVIEW, never an owner decision or consent.',
      'QL-136 performs no schema, database, API/Worker, Supabase, browser, audit, archive or evidence-ledger writes.',
      'QL-136 does not enable Phone/SMS, DTMF, callbacks, recordings, AI sends or live pilots.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-135 readiness gate is missing, duplicated, nonpassing or inconsistent with its reported outcome.',
      'Stop if readiness review is treated as owner approval, consent, signature, implementation or release authorization.',
      'Stop on any private customer/provider data, persistence path, live provider communication or AI send.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-136 is DISPLAY-ONLY independent review of QL-135 public/synthetic readiness decision. Passing allows only future separately scoped read-only follow-up planning. No owner approval, consent, schema/ledger/API/browser/Supabase writes, Phone/SMS, provider callback, recording, AI sending or live pilot is authorized.',
    nextQueuedBuild: 'QL-137 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning (proposed; confirm roadmap)',
    generatedAt: new Date().toISOString()
  };
}
