import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql133FollowUpReadinessReviewPlanning } from './ql133FollowUpReadinessReviewPlanning';

type Prior = Ql133FollowUpReadinessReviewPlanning;
type FollowUpPlanningReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql134FollowUpReadinessReviewPlanningReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-134';
    title: string;
    reviewedBuild: 'QL-133';
    readinessFollowUpPlanningReviewMode: 'display_only_readiness_follow_up_planning_review';
    readinessFollowUpPlanningReviewOutcome: 'ready_for_separate_follow_up_planning_readiness_decision_only' | 'follow_up_planning_review_revision_required';
    ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved';
    readinessFollowUpPlanningReviewSummary: { passed: number; review: number; blocked: number };
    readinessFollowUpPlanningReviewItems: readonly FollowUpPlanningReviewItem[];
    readinessFollowUpPlanningReviewScope: readonly string[];
    readinessFollowUpPlanningReviewAgenda: readonly string[];
    pendingFollowUpPlanningReviewApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedSourceGateIds = [
  'ql133-ql132-source-integrity',
  'ql133-source-outcome-reconciliation',
  'ql133-owner-and-write-permissions',
  'ql133-synthetic-packet-and-agenda',
  'ql133-owner-consent-and-choices-deferred',
  'ql133-private-data-isolation',
  'ql133-phone-sms-ai-runtime-disabled',
  'ql133-independent-review-and-release'
] as const;

const checkStatus = (passes: boolean): Ql094EvidenceStatus => passes ? 'pass' : 'review';

export function buildQl134FollowUpReadinessReviewPlanningReview(prior: Prior): Ql134FollowUpReadinessReviewPlanningReview {
  const sourceCounts = prior.readinessReviewFollowUpPlanningItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceGateIntegrity =
    prior.build === 'QL-133' &&
    prior.reviewedBuild === 'QL-132' &&
    prior.readinessReviewFollowUpPlanningItems.length === expectedSourceGateIds.length &&
    new Set(prior.readinessReviewFollowUpPlanningItems.map(item => item.id)).size === expectedSourceGateIds.length &&
    expectedSourceGateIds.every(id =>
      prior.readinessReviewFollowUpPlanningItems.some(item => item.id === id && item.status === 'pass')
    );

  const sourceOutcomeReconciled =
    sourceGateIntegrity &&
    prior.readinessReviewFollowUpPlanningOutcome === 'ready_for_separate_follow_up_planning_review_only' &&
    sourceCounts.passed === expectedSourceGateIds.length &&
    sourceCounts.review === 0 &&
    sourceCounts.blocked === 0 &&
    prior.readinessReviewFollowUpPlanningSummary.passed === sourceCounts.passed &&
    prior.readinessReviewFollowUpPlanningSummary.review === sourceCounts.review &&
    prior.readinessReviewFollowUpPlanningSummary.blocked === sourceCounts.blocked;

  const ownerAndWritePermissionsLocked =
    prior.ownerDecisionStatus === 'readiness_review_follow_up_planning_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const syntheticReviewMaterialsReady =
    prior.readinessReviewFollowUpPlanningScope.length >= 5 &&
    prior.readinessReviewFollowUpPlanningAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const ownerChoicesStillDeferred =
    prior.outstandingPlanningApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.outstandingPlanningApprovals.some(value => value.includes('No owner decision')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-133 is a DISPLAY-ONLY follow-up planning stage'));

  const privateDataExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const runtimeAndPersistenceDisabled =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(value => value.includes('QL-133 introduces no schema')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-133 does not enable Phone/SMS'));

  const independentNextGateAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.readinessReviewFollowUpPlanningAgenda.some(value => value.includes('QL-134 plan review')) &&
    prior.handoffRequirements.some(value => value.includes('Exact PR-head CI success'));

  const readinessFollowUpPlanningReviewItems: readonly FollowUpPlanningReviewItem[] = [
    {
      id: 'ql134-source-gate-integrity',
      label: 'Exactly eight uniquely identified QL-133 follow-up planning gates are passing',
      status: checkStatus(sourceGateIntegrity),
      readinessFinding: 'Expected eight QL-133 gates; observed ' + prior.readinessReviewFollowUpPlanningItems.length + '.',
      readinessDisposition: 'Missing, duplicate, blocked or review-state gates require correction before any next planning decision.',
      noWriteBoundary: 'In-memory synthetic review, with no saved evidence or real owner identity.'
    },
    {
      id: 'ql134-source-outcome-reconciliation',
      label: 'Independently recomputed source gate totals agree with QL-133 outcome and summary',
      status: checkStatus(sourceOutcomeReconciled),
      readinessFinding: sourceCounts.passed + ' pass, ' + sourceCounts.review + ' review, ' + sourceCounts.blocked + ' blocked.',
      readinessDisposition: 'Even a passing review permits only a separate future planning readiness decision.',
      noWriteBoundary: 'No consent, signature, owner status or durable review record.'
    },
    {
      id: 'ql134-owner-and-write-permission-locks',
      label: 'Owner authorization, implementation, schema, API, browser, Supabase and ledger writes remain locked',
      status: checkStatus(ownerAndWritePermissionsLocked),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'The plan review is not a grant of implementation or decision-capture authority.',
      noWriteBoundary: 'No database migration, API/Worker, Supabase, browser, audit, archive or ledger write.'
    },
    {
      id: 'ql134-read-only-packet-and-planning-agenda',
      label: 'Synthetic/public handoff questions, agenda, scope and separate-review prerequisites remain available',
      status: checkStatus(syntheticReviewMaterialsReady),
      readinessFinding: prior.readinessReviewFollowUpPlanningAgenda.length + ' planning agenda entries; ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'Review only synthetic/public existing materials; do not transfer actual owner packets.',
      noWriteBoundary: 'No identifying owner data, reviewer assignment, exports, submissions or packets sent.'
    },
    {
      id: 'ql134-owner-decisions-and-consent-deferred',
      label: 'Owner accept/reject/defer/revise, signatures, consent and approvals remain uncollected',
      status: checkStatus(ownerChoicesStillDeferred),
      readinessFinding: prior.outstandingPlanningApprovals.length + ' deferred approval statements; ' + prior.captureStillNotAuthorized.length + ' capture prohibitions.',
      readinessDisposition: 'Any future real owner decision requires distinct authorization, access, privacy and retention review.',
      noWriteBoundary: 'No owner choice, consent state transition, signature, approval history or evidence persistence.'
    },
    {
      id: 'ql134-private-customer-provider-exclusions',
      label: 'Only public/synthetic planning fields remain, excluding private customer and provider data',
      status: checkStatus(privateDataExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate planning fields; ' + prior.rejectedPrivateFields.length + ' excluded fields.',
      readinessDisposition: 'Stay with validated public/synthetic safe reads or local synthetic fallback.',
      noWriteBoundary: 'No live customer phone, text, recording, provider token, consent or AI data.'
    },
    {
      id: 'ql134-disabled-live-runtime-and-persistence',
      label: 'Phone/SMS, DTMF, provider callbacks, recordings, AI sends, live pilot and writes remain disabled',
      status: checkStatus(runtimeAndPersistenceDisabled),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write controls and ' + prior.implementationStillProhibited.length + ' restricted implementation types.',
      readinessDisposition: 'No live communication or persistence functionality is activated by review status.',
      noWriteBoundary: 'No provider connection, call, SMS, recording, AI send or pilot.'
    },
    {
      id: 'ql134-separate-next-review-and-release',
      label: 'A later separately scoped readiness decision, owner authority and exact-main checks remain mandatory',
      status: checkStatus(independentNextGateAndRelease),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' implementation prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'QL-135 may only make a distinct synthetic planning readiness decision after roadmap scope confirmation.',
      noWriteBoundary: 'No owner permission or production launch inferred from passing planning review.'
    }
  ];

  const readinessFollowUpPlanningReviewSummary = readinessFollowUpPlanningReviewItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const readinessFollowUpPlanningReviewOutcome =
    readinessFollowUpPlanningReviewSummary.review === 0 && readinessFollowUpPlanningReviewSummary.blocked === 0
      ? 'ready_for_separate_follow_up_planning_readiness_decision_only'
      : 'follow_up_planning_review_revision_required';

  return {
    ...prior,
    build: 'QL-134',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review',
    reviewedBuild: 'QL-133',
    readinessFollowUpPlanningReviewMode: 'display_only_readiness_follow_up_planning_review',
    readinessFollowUpPlanningReviewOutcome,
    readinessFollowUpPlanningReviewSummary,
    readinessFollowUpPlanningReviewItems,
    ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    readinessFollowUpPlanningReviewScope: [
      'Independently reconcile all eight QL-133 planning gates, counts and source outcome; fail closed on inconsistencies.',
      'Review only synthetic/public handoff questions, agendas and reviewer prerequisites using existing safe reads.',
      'Reaffirm that owner choice, consent, signature, approval and implementation remain separately unauthorized.',
      'Preserve disabled database/schema/API/Worker/browser/ledger writes and all live communications, recordings and AI sending.',
      'Allow only a later separate synthetic/public follow-up planning readiness decision, not a live handoff.'
    ],
    readinessFollowUpPlanningReviewAgenda: [
      'Validate each QL-133 source gate ID, status and independent tally and outcome.',
      'Reconcile synthetic/public packet materials, questions, handoff agenda and missing future prerequisites.',
      'Identify later owner authority, reviewer identity, roles, privacy, consent and retention dependencies.',
      'Leave all owner accept/reject/defer/revise, signature, submission and consent capture unavailable.',
      'Recheck exclusion of real customer/provider records and permitted local synthetic fallback.',
      'Verify no Supabase/API/browser/ledger writes, Phone/SMS, callbacks, recordings, DTMF, AI sends or pilot.',
      'Refer forward only for separately scoped QL-135 read-only planning readiness decision if all checks pass.'
    ],
    pendingFollowUpPlanningReviewApprovals: [
      'No real owner choice, signature, consent, approval or decision record exists in this release.',
      'Reviewer identities, role-based permissions, retention, privacy and owner consent require separate authorization.',
      'Evidence ledger schema, migration, API/Worker and browser persistence remain unapproved.',
      'All Phone/SMS, DTMF, callbacks, recordings, AI sending and live provider pilot stay disabled.',
      'Passing QL-134 does not constitute owner consent, a handoff execution or implementation permission.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-134 is a DISPLAY-ONLY synthetic/public FOLLOW-UP PLANNING REVIEW and never grants owner approval.',
      'QL-134 creates no schema, DB, Supabase, API, Worker, browser, archive, audit or evidence ledger write.',
      'QL-134 does not enable Phone/SMS, DTMF, callbacks, recordings, AI sends or a live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-133 source gate is absent, repeated, not passing or inconsistent with its source summary.',
      'Stop if planning review is confused with real owner accept/reject/defer/revise, signature, consent or implementation.',
      'Stop if private customer/provider data, persistence path, live communications or AI sends are introduced.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-134 is DISPLAY-ONLY review of the QL-133 synthetic/public follow-up plan. Passing allows a distinct future planning READINESS DECISION only. Real owner consent, approval, decision capture, schema/ledger/API/Worker/browser/Supabase writes, live Phone/SMS, callbacks, recording, AI sending and pilot are NOT AUTHORIZED.',
    nextQueuedBuild: 'QL-135 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision (proposed; confirm roadmap)',
    generatedAt: new Date().toISOString()
  };
}
