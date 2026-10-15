import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql122SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanningReview } from './ql122SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanningReview';

type Prior = Ql122SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewFollowUpPlanningReview;
type ReadinessItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql123FollowUpReadinessDecision =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild' | 'reviewMode' | 'reviewOutcome' | 'reviewSummary' | 'reviewItems' | 'approvedReviewScope'> & {
    build: 'QL-123';
    title: string;
    reviewedBuild: 'QL-122';
    readinessMode: 'display_only_owner_packet_follow_up_readiness_decision';
    readinessOutcome: 'ready_for_later_owner_packet_review_only' | 'follow_up_readiness_revision_required';
    ownerDecisionStatus: 'follow_up_readiness_only_owner_not_approved';
    readinessSummary: { passed: number; review: number; blocked: number };
    readinessItems: readonly ReadinessItem[];
    approvedReadinessScope: readonly string[];
    followUpReadinessAgenda: readonly string[];
    pendingOwnerApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedSourceGateIds = [
  'ql122-ql121-gate-integrity',
  'ql122-ql121-tally-consistency',
  'ql122-permission-lock-review',
  'ql122-follow-up-agenda-review',
  'ql122-owner-capture-ban-review',
  'ql122-sensitive-field-review',
  'ql122-disabled-runtime-review',
  'ql122-future-release-review'
] as const;

const passWhen = (condition: boolean): Ql094EvidenceStatus => condition ? 'pass' : 'review';

export function buildQl123FollowUpReadinessDecision(prior: Prior): Ql123FollowUpReadinessDecision {
  const recomputed = prior.reviewItems.reduce(
    (summary, item) => ({
      passed: summary.passed + Number(item.status === 'pass'),
      review: summary.review + Number(item.status === 'review'),
      blocked: summary.blocked + Number(item.status === 'blocked')
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
  const priorGateIntegrity =
    prior.build === 'QL-122' &&
    prior.reviewedBuild === 'QL-121' &&
    prior.reviewItems.length === expectedSourceGateIds.length &&
    new Set(prior.reviewItems.map((item) => item.id)).size === expectedSourceGateIds.length &&
    expectedSourceGateIds.every((id) =>
      prior.reviewItems.some((item) => item.id === id && item.status === 'pass')
    );

  const priorOutcomeReconciled =
    priorGateIntegrity &&
    prior.reviewOutcome === 'follow_up_planning_review_ready_for_separate_readiness_decision' &&
    recomputed.passed === expectedSourceGateIds.length &&
    recomputed.review === 0 &&
    recomputed.blocked === 0 &&
    prior.reviewSummary.passed === recomputed.passed &&
    prior.reviewSummary.review === recomputed.review &&
    prior.reviewSummary.blocked === recomputed.blocked;

  const ownerAndWriteLocks =
    prior.ownerDecisionStatus === 'follow_up_plan_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const reviewPacketStillReadOnly =
    prior.reviewFollowUpAgenda.length >= 6 &&
    prior.approvedReviewScope.length >= 5 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.followUpAgenda.length >= 8;

  const ownerDecisionCaptureProhibited =
    prior.outstandingOwnerRequirements.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.requiredCorrectionsBeforeOwnerDecisionCapture.length >= 5 &&
    prior.outstandingOwnerRequirements.some((text) => text.includes('No owner approval'));

  const privateFieldExclusion =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every((field) => !prior.rejectedPrivateFields.includes(field));

  const disabledRuntimeVerified =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.retainedBoundaries.some((boundary) => boundary.includes('QL-122 is follow-up planning REVIEW only')) &&
    prior.implementationStillProhibited.length >= 5;

  const laterGateSeparation =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.outstandingOwnerRequirements.some((text) => text.includes('separate')) &&
    prior.handoffRequirements.some((text) => text.includes('Exact PR-head CI success'));

  const readinessItems: readonly ReadinessItem[] = [
    {
      id: 'ql123-source-review-integrity',
      label: 'All eight QL-122 review gates exist uniquely and pass',
      status: passWhen(priorGateIntegrity),
      readinessFinding: 'Expected 8 source gates, observed ' + prior.reviewItems.length + '.',
      readinessDisposition: 'Missing, duplicated, review or blocked source items force revision before further owner consideration.',
      noWriteBoundary: 'No gate result or owner decision is persisted.'
    },
    {
      id: 'ql123-recomputed-outcome',
      label: 'QL-122 status tally and follow-up review outcome are internally consistent',
      status: passWhen(priorOutcomeReconciled),
      readinessFinding: 'Recomputed ' + recomputed.passed + ' pass, ' + recomputed.review + ' review, ' + recomputed.blocked + ' blocked.',
      readinessDisposition: 'A clean tally only permits a later packet review stage, not implementation.',
      noWriteBoundary: 'No owner acceptance, approval, signature, consent, or durable evidence record.'
    },
    {
      id: 'ql123-owner-write-locks',
      label: 'Owner approval remains absent and all implementation/write locks remain closed',
      status: passWhen(ownerAndWriteLocks),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Keep ledger, schema, endpoint and browser writes disabled regardless of the readiness result.',
      noWriteBoundary: 'No database migration, Supabase/API/Worker mutation, browser submit, or localStorage decision.'
    },
    {
      id: 'ql123-owner-packet-materials',
      label: 'Agenda, packet, questions and handoff requirements remain read-only',
      status: passWhen(reviewPacketStillReadOnly),
      readinessFinding: prior.reviewFollowUpAgenda.length + ' review agenda items, ' + prior.ownerDecisionQuestionsForReview.length + ' owner questions and ' + prior.handoffRequirements.length + ' handoff requirements.',
      readinessDisposition: 'Keep accept/reject/defer/revise as discussion topics only.',
      noWriteBoundary: 'No capture control, export, audit row, archive or retention write.'
    },
    {
      id: 'ql123-no-owner-choice',
      label: 'No owner choice is inferred from the review and separate authorization is still required',
      status: passWhen(ownerDecisionCaptureProhibited),
      readinessFinding: prior.deferredOwnerDecisions.length + ' deferred choices and ' + prior.captureStillNotAuthorized.length + ' capture restrictions retained.',
      readinessDisposition: 'Do not conflate passing readiness with explicit owner acceptance of a future implementation.',
      noWriteBoundary: 'No accepted, rejected, deferred, revised or signed owner outcome is saved.'
    },
    {
      id: 'ql123-sensitive-field-boundary',
      label: 'Sensitive customer and provider fields remain excluded from synthetic planning data',
      status: passWhen(privateFieldExclusion),
      readinessFinding: prior.candidateLedgerFields.length + ' unique proposed planning fields; ' + prior.rejectedPrivateFields.length + ' rejected private fields.',
      readinessDisposition: 'Use only validated public/synthetic safe reads or the existing local fallback.',
      noWriteBoundary: 'No live customer, phone/SMS, call, callback, recording, consent, provider, retention or AI data.'
    },
    {
      id: 'ql123-live-runtime-disabled',
      label: 'Disabled-preview and no-write communication restrictions remain enforced',
      status: passWhen(disabledRuntimeVerified),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write safeguards and ' + prior.implementationStillProhibited.length + ' prohibited targets.',
      readinessDisposition: 'No provider connectivity, live Phone/SMS, AI send or pilot execution is authorized.',
      noWriteBoundary: 'No calls, texts, callbacks, DTMF, recordings, AI delivery or live pilot.'
    },
    {
      id: 'ql123-future-owner-release-gates',
      label: 'Independent owner authorization and exact-main release verification remain mandatory',
      status: passWhen(laterGateSeparation),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites, ' + prior.stopConditions.length + ' stop conditions and ' + prior.verificationPlanReview.length + ' verification steps retained.',
      readinessDisposition: 'A subsequent owner packet review requires its own authorization process. CI/deployment checks are separate from owner approval.',
      noWriteBoundary: 'Do not label production GREEN from earlier checks or bypass independent final-main verification.'
    }
  ];
  const readinessSummary = readinessItems.reduce(
    (summary, item) => ({
      passed: summary.passed + Number(item.status === 'pass'),
      review: summary.review + Number(item.status === 'review'),
      blocked: summary.blocked + Number(item.status === 'blocked')
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
  const readinessOutcome = readinessSummary.review === 0 && readinessSummary.blocked === 0
    ? 'ready_for_later_owner_packet_review_only'
    : 'follow_up_readiness_revision_required';

  return {
    ...prior,
    build: 'QL-123',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Decision',
    reviewedBuild: 'QL-122',
    readinessMode: 'display_only_owner_packet_follow_up_readiness_decision',
    readinessOutcome,
    ownerDecisionStatus: 'follow_up_readiness_only_owner_not_approved',
    implementationPermission: 'not_granted',
    readinessSummary,
    readinessItems,
    approvedReadinessScope: [
      'Recheck all eight QL-122 review gates and their source tally; fail closed on disagreement.',
      'Present the owner packet review prerequisites as display-only next-step guidance.',
      'Allow only existing public/synthetic safe-read sources and local synthetic fallback.',
      'Prohibit any owner approval, capture, ledger implementation or persistence.',
      'Retain independent final-main release checks; readiness is not live enablement.'
    ],
    followUpReadinessAgenda: [
      'Verify QL-122 source gate integrity and re-derived totals before considering any handoff.',
      'Identify missing, changed or blocked prerequisites; send those back for revision.',
      'Review packet questions without recording accept/reject/defer/revise selections.',
      'Confirm candidate field and private-data exclusions before any future schema proposal.',
      'Require independently approved owner decision-capture design for any later stage.',
      'Keep future implementation and provider activation gated by separate authorization.',
      'Use QL-124 solely to review the QL-123 readiness decision; do not implement writes.'
    ],
    pendingOwnerApprovals: [
      'Owner implementation approval has not been requested or stored by QL-123.',
      'Owner decision capture and durable evidence storage require a later authorized process.',
      'Candidate schema, write APIs, permission boundaries and retention policy remain unapproved.',
      'Provider connectivity, Phone/SMS activity, call recording, AI delivery and live pilot remain disabled.',
      'A passing readiness status is not consent, implementation permission or production activation approval.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-123 is readiness for later owner packet review only and does not approve implementation.',
      'QL-123 has no approval, decision, signature, consent, API/browser/Supabase write or evidence persistence.',
      'QL-123 does not enable provider calls, Phone/SMS, callbacks, recordings, AI delivery or a live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-122 source gate is missing, duplicated, failed, or inconsistent.',
      'Stop if readiness is treated as owner consent or implementation authorization.',
      'Stop if live customer/provider data, a schema, write endpoint, or live phone/AI operation is introduced.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-123 is a DISPLAY-ONLY readiness decision about later owner packet review. Ready does NOT mean owner approval or implementation permission. No ledger writes, schema, migrations, browser/API/Supabase persistence, Phone/SMS, provider callbacks, recordings, consent, audits, archives, AI delivery or live pilot is enabled.',
    nextQueuedBuild: 'QL-124 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Decision Review',
    generatedAt: new Date().toISOString()
  };
}
