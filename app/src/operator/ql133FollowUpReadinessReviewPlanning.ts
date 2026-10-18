import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql132FollowUpReadinessDecisionReview } from './ql132FollowUpReadinessDecisionReview';

type Prior = Ql132FollowUpReadinessDecisionReview;
type FollowUpPlanningItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql133FollowUpReadinessReviewPlanning =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-133';
    title: string;
    reviewedBuild: 'QL-132';
    readinessReviewFollowUpPlanningMode: 'display_only_readiness_review_follow_up_planning';
    readinessReviewFollowUpPlanningOutcome: 'ready_for_separate_follow_up_planning_review_only' | 'follow_up_planning_revision_required';
    ownerDecisionStatus: 'readiness_review_follow_up_planning_only_owner_not_approved';
    readinessReviewFollowUpPlanningSummary: { passed: number; review: number; blocked: number };
    readinessReviewFollowUpPlanningItems: readonly FollowUpPlanningItem[];
    readinessReviewFollowUpPlanningScope: readonly string[];
    readinessReviewFollowUpPlanningAgenda: readonly string[];
    outstandingPlanningApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl132Ids = [
  'ql132-source-readiness-gate-integrity',
  'ql132-source-outcome-and-summary',
  'ql132-owner-and-write-boundaries',
  'ql132-read-only-review-materials',
  'ql132-owner-decisions-uncollected',
  'ql132-private-data-isolation',
  'ql132-live-communications-disabled',
  'ql132-independent-follow-up-and-release'
] as const;

const evidenceStatus = (passes: boolean): Ql094EvidenceStatus => passes ? 'pass' : 'review';

export function buildQl133FollowUpReadinessReviewPlanning(prior: Prior): Ql133FollowUpReadinessReviewPlanning {
  const recomputed = prior.followUpReadinessReviewItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceIntegrity =
    prior.build === 'QL-132' &&
    prior.reviewedBuild === 'QL-131' &&
    prior.followUpReadinessReviewItems.length === expectedQl132Ids.length &&
    new Set(prior.followUpReadinessReviewItems.map(item => item.id)).size === expectedQl132Ids.length &&
    expectedQl132Ids.every(id =>
      prior.followUpReadinessReviewItems.some(item => item.id === id && item.status === 'pass')
    );

  const reconciledReview =
    sourceIntegrity &&
    prior.followUpReadinessReviewOutcome === 'follow_up_readiness_review_ready_for_separate_follow_up_planning_only' &&
    recomputed.passed === expectedQl132Ids.length &&
    recomputed.review === 0 &&
    recomputed.blocked === 0 &&
    prior.followUpReadinessReviewSummary.passed === recomputed.passed &&
    prior.followUpReadinessReviewSummary.review === recomputed.review &&
    prior.followUpReadinessReviewSummary.blocked === recomputed.blocked;

  const ownerAndImplementationLocks =
    prior.ownerDecisionStatus === 'follow_up_readiness_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const onlySyntheticHandoffMaterials =
    prior.followUpReadinessReviewScope.length >= 5 &&
    prior.followUpReadinessReviewAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const ownerDecisionsDeferred =
    prior.pendingOwnerReadinessReviewApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.pendingOwnerReadinessReviewApprovals.some(text => text.includes('No owner decision')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-132 is synthetic/public readiness decision REVIEW only'));

  const privateDataExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const disabledLiveRuntime =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-132 adds no schema')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-132 does not enable Phone/SMS'));

  const separateNextReviewAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.followUpReadinessReviewAgenda.some(text => text.includes('follow-up planning proposal')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const readinessReviewFollowUpPlanningItems: readonly FollowUpPlanningItem[] = [
    {
      id: 'ql133-ql132-source-integrity',
      label: 'Eight unique expected QL-132 readiness-review gates pass',
      status: evidenceStatus(sourceIntegrity),
      readinessFinding: 'Expected eight unique QL-132 gates; observed ' + prior.followUpReadinessReviewItems.length + '.',
      readinessDisposition: 'Any missing, duplicate, blocked or review-state gate requires plan revision.',
      noWriteBoundary: 'Only in-memory synthetic evidence; no persistent gate ledger.'
    },
    {
      id: 'ql133-source-outcome-reconciliation',
      label: 'QL-132 outcome and independently recomputed gate totals agree',
      status: evidenceStatus(reconciledReview),
      readinessFinding: recomputed.passed + ' pass; ' + recomputed.review + ' review; ' + recomputed.blocked + ' blocked.',
      readinessDisposition: 'Passing review permits consideration of a later read-only follow-up plan review only.',
      noWriteBoundary: 'No owner acceptance, signatures, consent or durable evidence.'
    },
    {
      id: 'ql133-owner-and-write-permissions',
      label: 'Owner authorization and schema, API, browser, Supabase and ledger writes remain locked',
      status: evidenceStatus(ownerAndImplementationLocks),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser writes ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Planning cannot grant implementation or decision-capture permission.',
      noWriteBoundary: 'No database migration, API/Worker, browser, audit or ledger mutation.'
    },
    {
      id: 'ql133-synthetic-packet-and-agenda',
      label: 'Synthetic/public-only owner packet, questions, planning scope and agenda remain displayable',
      status: evidenceStatus(onlySyntheticHandoffMaterials),
      readinessFinding: prior.followUpReadinessReviewAgenda.length + ' agenda steps; ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'Inventory requirements without real packet transfer, reviewer assignment or submission.',
      noWriteBoundary: 'No identifying owner or customer records, packet export or handoff transmission.'
    },
    {
      id: 'ql133-owner-consent-and-choices-deferred',
      label: 'Owner decisions, signatures, approvals and consent remain uncollected',
      status: evidenceStatus(ownerDecisionsDeferred),
      readinessFinding: prior.pendingOwnerReadinessReviewApprovals.length + ' deferred approvals and ' + prior.captureStillNotAuthorized.length + ' capture prohibitions.',
      readinessDisposition: 'Any later real review must separately resolve identity, privacy, retention, roles and consent.',
      noWriteBoundary: 'No real accept, reject, defer, revise, sign, consent or saved decision.'
    },
    {
      id: 'ql133-private-data-isolation',
      label: 'Candidate synthetic planning fields exclude private customer and provider information',
      status: evidenceStatus(privateDataExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate planning fields; ' + prior.rejectedPrivateFields.length + ' restricted fields.',
      readinessDisposition: 'Continue validated synthetic/public safe reads with local fallback only.',
      noWriteBoundary: 'No real calls, phone numbers, SMS, provider tokens, recordings or AI payloads.'
    },
    {
      id: 'ql133-phone-sms-ai-runtime-disabled',
      label: 'Live Phone/SMS, DTMF, callbacks, recording, provider, AI sending and pilot remain disabled',
      status: evidenceStatus(disabledLiveRuntime),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write controls; ' + prior.implementationStillProhibited.length + ' prohibited actions.',
      readinessDisposition: 'No live runtime can be enabled by a passing follow-up plan.',
      noWriteBoundary: 'No phone call, SMS, provider callback, recording, AI send or pilot.'
    },
    {
      id: 'ql133-independent-review-and-release',
      label: 'QL-134 review, owner authorization and exact-main release checks remain independent',
      status: evidenceStatus(separateNextReviewAndRelease),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' implementation prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'QL-134 follow-up planning review remains a separately scoped read-only step.',
      noWriteBoundary: 'No owner approval or release success inferred from proposed plan status.'
    }
  ];

  const readinessReviewFollowUpPlanningSummary = readinessReviewFollowUpPlanningItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });
  const readinessReviewFollowUpPlanningOutcome =
    readinessReviewFollowUpPlanningSummary.review === 0 && readinessReviewFollowUpPlanningSummary.blocked === 0
      ? 'ready_for_separate_follow_up_planning_review_only'
      : 'follow_up_planning_revision_required';

  return {
    ...prior,
    build: 'QL-133',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning',
    reviewedBuild: 'QL-132',
    readinessReviewFollowUpPlanningMode: 'display_only_readiness_review_follow_up_planning',
    readinessReviewFollowUpPlanningOutcome,
    readinessReviewFollowUpPlanningSummary,
    readinessReviewFollowUpPlanningItems,
    ownerDecisionStatus: 'readiness_review_follow_up_planning_only_owner_not_approved',
    implementationPermission: 'not_granted',
    readinessReviewFollowUpPlanningScope: [
      'Validate QL-132 eight unique gates, independent pass/review/blocked summary and exact source outcome.',
      'Inventory public/synthetic handoff follow-up questions, agenda and reviewer prerequisites without transfer.',
      'Identify separately needed real owner authority, roles, security, privacy, consent and retention controls.',
      'Preserve all evidence-ledger, schema, API, Supabase, browser write and live Phone/SMS, AI and recording bans.',
      'Prepare only a later QL-134 read-only follow-up planning review; never execute a handoff.'
    ],
    readinessReviewFollowUpPlanningAgenda: [
      'Verify the QL-132 review gate list, source integrity and independently recomputed totals.',
      'Inventory existing synthetic/public follow-up planning agenda, owner packet questions and missing approvals.',
      'Identify separate reviewer identities, security roles, privacy and retention prerequisites for future approval.',
      'Keep owner accept/reject/defer/revise, signatures and consent absent from the current UI.',
      'Exclude real customer/provider data and preserve local safe-read fallback.',
      'Reconfirm API/browser/Supabase writes, Phone/SMS, DTMF, callbacks, recordings, AI and live pilots disabled.',
      'Require independent QL-134 plan review and exact-release check verification before any new milestone.'
    ],
    outstandingPlanningApprovals: [
      'No owner decision, approval, rejection, deferral, revision, consent or signature has been captured.',
      'Real owner identity, reviewer permissions, consent, retention and privacy rules require separate authorization.',
      'Schema/API/browser/Supabase evidence-ledger persistence and audit implementation remain unapproved.',
      'Phone/SMS, DTMF, callbacks, recordings, AI sends and a live provider pilot remain disabled.',
      'A passing synthetic QL-133 plan is not owner permission or authority to implement.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-133 is a DISPLAY-ONLY follow-up planning stage based on QL-132, not approval or capture.',
      'QL-133 introduces no schema, database, API, Worker, browser, archive, audit or evidence-ledger write.',
      'QL-133 does not enable Phone/SMS, provider callbacks, recordings, AI sends or a live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-132 gate is missing, duplicated, nonpassing or inconsistent with its summary.',
      'Stop if planning is treated as an owner decision, signature, consent or implementation approval.',
      'Stop if any private data, schema/API/Supabase/browser write or live provider/AI operation occurs.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-133 is DISPLAY-ONLY follow-up planning after QL-132 review. Passing permits only a separate later follow-up PLANNING REVIEW. Owner approval, consent, schema, ledger, API/browser/Supabase writes, Phone/SMS, callbacks, recordings, AI sends and live pilots are NOT AUTHORIZED.',
    nextQueuedBuild: 'QL-134 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review (proposed; confirm roadmap)',
    generatedAt: new Date().toISOString()
  };
}
