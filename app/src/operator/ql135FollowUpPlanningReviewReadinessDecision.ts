import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql134FollowUpReadinessReviewPlanningReview } from './ql134FollowUpReadinessReviewPlanningReview';

type Prior = Ql134FollowUpReadinessReviewPlanningReview;
type ReadinessDecisionItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql135FollowUpPlanningReviewReadinessDecision =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-135';
    title: string;
    reviewedBuild: 'QL-134';
    followUpPlanningReadinessMode: 'display_only_follow_up_planning_review_readiness_decision';
    followUpPlanningReadinessOutcome: 'ready_for_independent_readiness_decision_review_only' | 'follow_up_planning_readiness_revision_required';
    ownerDecisionStatus: 'follow_up_planning_readiness_only_owner_not_approved';
    followUpPlanningReadinessSummary: { passed: number; review: number; blocked: number };
    followUpPlanningReadinessItems: readonly ReadinessDecisionItem[];
    followUpPlanningReadinessScope: readonly string[];
    followUpPlanningReadinessAgenda: readonly string[];
    deferredReadinessOwnerApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedSourceIds = [
  'ql134-source-gate-integrity',
  'ql134-source-outcome-reconciliation',
  'ql134-owner-and-write-permission-locks',
  'ql134-read-only-packet-and-planning-agenda',
  'ql134-owner-decisions-and-consent-deferred',
  'ql134-private-customer-provider-exclusions',
  'ql134-disabled-live-runtime-and-persistence',
  'ql134-separate-next-review-and-release'
] as const;

const gateStatus = (passes: boolean): Ql094EvidenceStatus => passes ? 'pass' : 'review';

export function buildQl135FollowUpPlanningReviewReadinessDecision(prior: Prior): Ql135FollowUpPlanningReviewReadinessDecision {
  const sourceCounts = prior.readinessFollowUpPlanningReviewItems.reduce((counts, item) => ({
    passed: counts.passed + Number(item.status === 'pass'),
    review: counts.review + Number(item.status === 'review'),
    blocked: counts.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceGateIntegrity =
    prior.build === 'QL-134' &&
    prior.reviewedBuild === 'QL-133' &&
    prior.readinessFollowUpPlanningReviewItems.length === expectedSourceIds.length &&
    new Set(prior.readinessFollowUpPlanningReviewItems.map(item => item.id)).size === expectedSourceIds.length &&
    expectedSourceIds.every(id => prior.readinessFollowUpPlanningReviewItems.some(item => item.id === id && item.status === 'pass'));

  const sourceOutcomeReconciled =
    sourceGateIntegrity &&
    prior.readinessFollowUpPlanningReviewOutcome === 'ready_for_separate_follow_up_planning_readiness_decision_only' &&
    sourceCounts.passed === expectedSourceIds.length &&
    sourceCounts.review === 0 &&
    sourceCounts.blocked === 0 &&
    prior.readinessFollowUpPlanningReviewSummary.passed === sourceCounts.passed &&
    prior.readinessFollowUpPlanningReviewSummary.review === sourceCounts.review &&
    prior.readinessFollowUpPlanningReviewSummary.blocked === sourceCounts.blocked;

  const ownerAndWriteLocksClosed =
    prior.ownerDecisionStatus === 'follow_up_planning_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const readOnlyMaterialsAvailable =
    prior.readinessFollowUpPlanningReviewScope.length >= 5 &&
    prior.readinessFollowUpPlanningReviewAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const noOwnerCapture =
    prior.pendingFollowUpPlanningReviewApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.pendingFollowUpPlanningReviewApprovals.some(value => value.includes('No real owner choice')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-134 is a DISPLAY-ONLY synthetic/public FOLLOW-UP PLANNING REVIEW'));

  const privateFieldsExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const runtimeAndPersistenceDisabled =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(value => value.includes('QL-134 creates no schema')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-134 does not enable Phone/SMS'));

  const independentFutureReview =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.readinessFollowUpPlanningReviewAgenda.some(value => value.includes('QL-135 read-only planning readiness decision')) &&
    prior.handoffRequirements.some(value => value.includes('Exact PR-head CI success'));

  const followUpPlanningReadinessItems: readonly ReadinessDecisionItem[] = [
    {
      id: 'ql135-source-gates-unique-and-passing',
      label: 'QL-134 has exactly eight unique, expected passing follow-up planning review gates',
      status: gateStatus(sourceGateIntegrity),
      readinessFinding: 'Eight expected source IDs, ' + prior.readinessFollowUpPlanningReviewItems.length + ' observed.',
      readinessDisposition: 'Any missing, duplicate, nonpassing or blocked source gate prevents readiness.',
      noWriteBoundary: 'In-memory public/synthetic validation only, without saved evidence.'
    },
    {
      id: 'ql135-source-review-totals-and-outcome',
      label: 'QL-134 review outcome and independently recomputed pass/review/blocked totals match',
      status: gateStatus(sourceOutcomeReconciled),
      readinessFinding: sourceCounts.passed + ' passed; ' + sourceCounts.review + ' review; ' + sourceCounts.blocked + ' blocked.',
      readinessDisposition: 'Readiness authorizes only a separately scoped, independent readiness decision review.',
      noWriteBoundary: 'No owner acceptance, real decision, signature, consent or permanent status.'
    },
    {
      id: 'ql135-no-owner-or-implementation-writes',
      label: 'Owner and implementation approval plus all schema/API/browser/Supabase/ledger write paths remain locked',
      status: gateStatus(ownerAndWriteLocksClosed),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'This readiness decision cannot grant owner, migration, API or browser permissions.',
      noWriteBoundary: 'No API/Worker, Supabase, schema, browser, archive, audit or evidence-ledger write.'
    },
    {
      id: 'ql135-synthetic-packet-prerequisites',
      label: 'Public/synthetic packet, questions, agenda and future review prerequisites are available for inspection',
      status: gateStatus(readOnlyMaterialsAvailable),
      readinessFinding: prior.readinessFollowUpPlanningReviewAgenda.length + ' agenda steps, ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'Planning remains a proposal without transferring real packets or assigning actual reviewers.',
      noWriteBoundary: 'No identity, submission, owner packet send, export or retention.'
    },
    {
      id: 'ql135-owner-choices-consent-still-deferred',
      label: 'Owner approval, acceptance, rejection, revision, deferral, signature and consent remain uncollected',
      status: gateStatus(noOwnerCapture),
      readinessFinding: prior.pendingFollowUpPlanningReviewApprovals.length + ' deferred approval notices and ' + prior.captureStillNotAuthorized.length + ' capture restrictions.',
      readinessDisposition: 'Separate owner authority, access, privacy, audit and retention decisions remain mandatory.',
      noWriteBoundary: 'No real owner choice, consent event, evidence history or signed decision.'
    },
    {
      id: 'ql135-restricted-fields-excluded',
      label: 'Candidate planning fields remain disjoint from sensitive customer/provider information',
      status: gateStatus(privateFieldsExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' synthetic candidates and ' + prior.rejectedPrivateFields.length + ' excluded private fields.',
      readinessDisposition: 'Continue only safe public/synthetic reads and local fallback.',
      noWriteBoundary: 'No real customer phone, SMS, recordings, provider secrets, consent or AI data.'
    },
    {
      id: 'ql135-live-communications-remain-off',
      label: 'Live Phone/SMS, DTMF, provider callbacks, recordings, AI sends, pilots and persistence remain disabled',
      status: gateStatus(runtimeAndPersistenceDisabled),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' runtime no-write guards, ' + prior.implementationStillProhibited.length + ' disabled implementations.',
      readinessDisposition: 'A passing readiness decision cannot activate any provider or communications channel.',
      noWriteBoundary: 'No calls, texts, callback, provider connect, recording, AI sending or pilot.'
    },
    {
      id: 'ql135-next-review-is-distinct',
      label: 'QL-136 review, owner authorization and exact-final-main release checks stay independent',
      status: gateStatus(independentFutureReview),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'Any future review remains synthetic/public-only and must be separately scoped and validated.',
      noWriteBoundary: 'No real owner approval, deployment status or write permission inferred.'
    }
  ];

  const followUpPlanningReadinessSummary = followUpPlanningReadinessItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const followUpPlanningReadinessOutcome =
    followUpPlanningReadinessSummary.review === 0 && followUpPlanningReadinessSummary.blocked === 0
      ? 'ready_for_independent_readiness_decision_review_only'
      : 'follow_up_planning_readiness_revision_required';

  return {
    ...prior,
    build: 'QL-135',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision',
    reviewedBuild: 'QL-134',
    followUpPlanningReadinessMode: 'display_only_follow_up_planning_review_readiness_decision',
    followUpPlanningReadinessOutcome,
    followUpPlanningReadinessSummary,
    followUpPlanningReadinessItems,
    ownerDecisionStatus: 'follow_up_planning_readiness_only_owner_not_approved',
    implementationPermission: 'not_granted',
    followUpPlanningReadinessScope: [
      'Recalculate all eight QL-134 review gates, verify unique identities, source summary and expected outcome.',
      'Decide only whether a separate safe-read review may consider synthetic/public handoff planning readiness.',
      'Keep owner decisions, signatures, consent, roles, privacy, retention and implementation permissions deferred.',
      'Preserve no schema, database/API/Worker/Supabase/browser/ledger writes and disabled live Phone/SMS, callback, recording, AI runtime.',
      'Proceed only to QL-136 independent readiness decision review; do not transfer packets, approve owner choices or activate services.'
    ],
    followUpPlanningReadinessAgenda: [
      'Reconcile exact QL-134 gate identities, passing statuses and independently calculated totals.',
      'Inventory existing public/synthetic packet, review scope, future questions and handoff prerequisites.',
      'Describe separate reviewer identity, roles, privacy, consent and retention approvals still needed.',
      'Recheck owner accept/reject/defer/revise, signatures and consent controls stay absent.',
      'Confirm private customer/provider fields excluded and safe local fallback retained.',
      'Reconfirm no schema/ledger/API/browser/Supabase writes or live Phone/SMS, DTMF, callbacks, recordings, AI sends or pilots.',
      'Refer only a read-only planning readiness decision for separate QL-136 review if all eight gates pass.'
    ],
    deferredReadinessOwnerApprovals: [
      'No owner choice, signature, consent, approval, rejection, deferral or revision has been collected.',
      'Any real reviewer identity, role/access authorization, privacy and data-retention policies require later approval.',
      'Ledger schema/migration, API/browser/Supabase writes and durable evidence capture remain unapproved.',
      'Live calls, SMS, provider callbacks, recordings, AI sends and any pilot remain disabled.',
      'Passing QL-135 readiness permits only a separate QL-136 review; it is not owner or implementation permission.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-135 is a DISPLAY-ONLY planning-review READINESS DECISION, not an owner choice or consent.',
      'QL-135 adds no schema, database, Worker/API, Supabase, browser, audit, archive or evidence-ledger writes.',
      'QL-135 does not enable Phone/SMS, DTMF, callback, recording, AI sending or live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-134 gate is missing, duplicate, nonpassing or inconsistent with reported outcomes.',
      'Stop if review readiness is treated as real owner authorization, consent or implementation permission.',
      'Stop on private customer/provider data, any persistence path, live communications or AI sending.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-135 is DISPLAY-ONLY readiness decision over QL-134 synthetic/public planning review. A passing result permits a separate QL-136 REVIEW only. Owner choices, approval, consent, ledger/schema/API/browser/Supabase writes, live Phone/SMS, provider callbacks, recordings, AI sends and pilots are NOT AUTHORIZED.',
    nextQueuedBuild: 'QL-136 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review (proposed; confirm roadmap)',
    generatedAt: new Date().toISOString()
  };
}
