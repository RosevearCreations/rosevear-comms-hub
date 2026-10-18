import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql137HandoffReadinessReviewFollowUpPlanning } from './ql137HandoffReadinessReviewFollowUpPlanning';

type Prior = Ql137HandoffReadinessReviewFollowUpPlanning;
type PlanningReviewGate = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql138HandoffReadinessFollowUpPlanningReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-138';
    title: string;
    reviewedBuild: 'QL-137';
    handoffFollowUpPlanningReviewMode: 'display_only_handoff_follow_up_planning_review';
    handoffFollowUpPlanningReviewOutcome: 'ready_for_separate_follow_up_planning_readiness_decision_only' | 'follow_up_planning_review_revision_required';
    ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved';
    handoffFollowUpPlanningReviewSummary: { passed: number; review: number; blocked: number };
    handoffFollowUpPlanningReviewItems: readonly PlanningReviewGate[];
    handoffFollowUpPlanningReviewScope: readonly string[];
    handoffFollowUpPlanningReviewAgenda: readonly string[];
    outstandingPlanningReviewApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const requiredSourceIds = [
  'ql137-ql136-source-gate-integrity',
  'ql137-review-totals-and-outcome',
  'ql137-owner-and-persistence-locks',
  'ql137-readonly-owner-packet-and-agenda',
  'ql137-owner-consent-still-deferred',
  'ql137-private-field-exclusions',
  'ql137-disabled-live-communications',
  'ql137-independent-next-review'
] as const;

const gateStatus = (ok: boolean): Ql094EvidenceStatus => ok ? 'pass' : 'review';

export function buildQl138HandoffReadinessFollowUpPlanningReview(prior: Prior): Ql138HandoffReadinessFollowUpPlanningReview {
  const sourceTotals = prior.handoffReviewFollowUpPlanningItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceGateIntegrity =
    prior.build === 'QL-137' &&
    prior.reviewedBuild === 'QL-136' &&
    prior.handoffReviewFollowUpPlanningItems.length === requiredSourceIds.length &&
    new Set(prior.handoffReviewFollowUpPlanningItems.map(item => item.id)).size === requiredSourceIds.length &&
    requiredSourceIds.every(id =>
      prior.handoffReviewFollowUpPlanningItems.some(item => item.id === id && item.status === 'pass'));

  const sourceOutcomeReconciled =
    sourceGateIntegrity &&
    prior.handoffReviewFollowUpPlanningOutcome === 'ready_for_independent_follow_up_planning_review_only' &&
    sourceTotals.passed === requiredSourceIds.length &&
    sourceTotals.review === 0 &&
    sourceTotals.blocked === 0 &&
    prior.handoffReviewFollowUpPlanningSummary.passed === sourceTotals.passed &&
    prior.handoffReviewFollowUpPlanningSummary.review === sourceTotals.review &&
    prior.handoffReviewFollowUpPlanningSummary.blocked === sourceTotals.blocked;

  const ownerAndWriteLocksClosed =
    prior.ownerDecisionStatus === 'follow_up_planning_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const syntheticPacketAvailable =
    prior.handoffReviewFollowUpPlanningScope.length >= 5 &&
    prior.handoffReviewFollowUpPlanningAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const ownerChoicesDeferred =
    prior.pendingPlanningOwnerApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.pendingPlanningOwnerApprovals.some(value => value.includes('No actual owner decision')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-137 is DISPLAY-ONLY public/synthetic FOLLOW-UP PLANNING'));

  const privateFieldsExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const disabledLiveRuntimeAndWrites =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(value => value.includes('QL-137 adds no database')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-137 does not activate Phone/SMS'));

  const separateNextDecisionAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.handoffReviewFollowUpPlanningAgenda.some(value => value.includes('QL-138 follow-up planning review')) &&
    prior.handoffRequirements.some(value => value.includes('Exact PR-head CI success'));

  const handoffFollowUpPlanningReviewItems: readonly PlanningReviewGate[] = [
    {
      id: 'ql138-source-gate-integrity',
      label: 'QL-137 contains exactly eight distinct expected passing follow-up planning gates',
      status: gateStatus(sourceGateIntegrity),
      readinessFinding: 'Expected eight QL-137 source gates, observed ' + prior.handoffReviewFollowUpPlanningItems.length + '.',
      readinessDisposition: 'Any missing, duplicated, nonpassing or blocked source gate forces revision.',
      noWriteBoundary: 'In-memory synthetic gate inspection only, not a durable owner/evidence record.'
    },
    {
      id: 'ql138-recalculated-source-status-and-outcome',
      label: 'QL-137 planning outcome and independent pass/review/blocked totals reconcile',
      status: gateStatus(sourceOutcomeReconciled),
      readinessFinding: sourceTotals.passed + ' passing, ' + sourceTotals.review + ' review, ' + sourceTotals.blocked + ' blocked.',
      readinessDisposition: 'A passing planning review allows only a separate future readiness decision.',
      noWriteBoundary: 'No owner acceptance, signature, consent, status transition or evidence persistence.'
    },
    {
      id: 'ql138-owner-implementation-persistence-locks',
      label: 'Owner/implementation approval and schema, API, Worker, Supabase, browser and ledger writes stay blocked',
      status: gateStatus(ownerAndWriteLocksClosed),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'No new write, role, permission or operational grant is implied by planning readiness.',
      noWriteBoundary: 'No database, API/Worker, browser, Supabase, audit, archive or ledger mutation.'
    },
    {
      id: 'ql138-synthetic-packet-review-materials',
      label: 'Public/synthetic owner questions, handoff packet, agenda and prerequisites remain reviewable',
      status: gateStatus(syntheticPacketAvailable),
      readinessFinding: prior.handoffReviewFollowUpPlanningAgenda.length + ' planning agenda items and ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'A later reviewer may plan independently but cannot receive a real owner packet here.',
      noWriteBoundary: 'No real owner identity, submission, transfer, export or assignment.'
    },
    {
      id: 'ql138-no-owner-choice-or-consent-capture',
      label: 'Owner decisions, accept/reject/defer/revise, consent, signatures and approvals remain uncollected',
      status: gateStatus(ownerChoicesDeferred),
      readinessFinding: prior.pendingPlanningOwnerApprovals.length + ' deferred approvals and ' + prior.captureStillNotAuthorized.length + ' capture restrictions.',
      readinessDisposition: 'Real owner authorization, roles, privacy, consent and retention remain separate future requirements.',
      noWriteBoundary: 'No consent ledger, owner choice, decision history, signature or evidence record.'
    },
    {
      id: 'ql138-private-customer-provider-field-isolation',
      label: 'Candidate synthetic safe-read fields remain disjoint from excluded customer/provider private fields',
      status: gateStatus(privateFieldsExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate fields and ' + prior.rejectedPrivateFields.length + ' excluded fields.',
      readinessDisposition: 'Retain validated synthetic/public reads and existing local fallback only.',
      noWriteBoundary: 'No customer phone, SMS, calls, provider secrets, recordings, consent or AI data.'
    },
    {
      id: 'ql138-disabled-live-communications-and-storage',
      label: 'Live Phone/SMS, DTMF, callbacks, recordings, AI sending, pilot and persistence remain disabled',
      status: gateStatus(disabledLiveRuntimeAndWrites),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write safeguards and ' + prior.implementationStillProhibited.length + ' prohibited implementations.',
      readinessDisposition: 'A planning review does not activate providers, real calls, messaging or storage.',
      noWriteBoundary: 'No calls, texts, provider callbacks, recordings, AI send or pilot.'
    },
    {
      id: 'ql138-separate-readiness-decision-and-release',
      label: 'QL-139 readiness decision, owner authority and exact-main deployment evidence remain separate',
      status: gateStatus(separateNextDecisionAndRelease),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future requirements; ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'A later separate read-only readiness decision requires its own gate and release proof.',
      noWriteBoundary: 'No actual owner permission, implementation approval, release success or live activation inferred.'
    }
  ];

  const handoffFollowUpPlanningReviewSummary = handoffFollowUpPlanningReviewItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffFollowUpPlanningReviewOutcome =
    handoffFollowUpPlanningReviewSummary.review === 0 && handoffFollowUpPlanningReviewSummary.blocked === 0
      ? 'ready_for_separate_follow_up_planning_readiness_decision_only'
      : 'follow_up_planning_review_revision_required';

  return {
    ...prior,
    build: 'QL-138',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review',
    reviewedBuild: 'QL-137',
    handoffFollowUpPlanningReviewMode: 'display_only_handoff_follow_up_planning_review',
    handoffFollowUpPlanningReviewOutcome,
    handoffFollowUpPlanningReviewSummary,
    handoffFollowUpPlanningReviewItems,
    ownerDecisionStatus: 'follow_up_planning_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    handoffFollowUpPlanningReviewScope: [
      'Independently validate eight unique QL-137 planning gates, status totals and declared source outcome.',
      'Review synthetic/public owner packet questions, agenda and outstanding handoff requirements, without actual transfer.',
      'Keep owner consent, approval, identity, signature and permission requirements deferred to a separate process.',
      'Retain schema/API/Worker/Supabase/browser/ledger no-write and private-field isolation constraints.',
      'Authorize only a future QL-139 separate synthetic/public planning readiness decision, no live activation.'
    ],
    handoffFollowUpPlanningReviewAgenda: [
      'Recompute all eight QL-137 source gate statuses, unique IDs and summary totals.',
      'Reconcile source outcome and all synthetic/public owner review packet materials.',
      'Identify unresolved future reviewer access, owner authority, privacy, consent and retention dependencies.',
      'Ensure accept/reject/defer/revise, signatures, consent capture and real handoff are unavailable.',
      'Confirm only public/synthetic data are read and local fallback remains safe.',
      'Recheck blocked evidence ledger/Supabase/browser/API writes and disabled Phone/SMS, callbacks, recordings and AI sends.',
      'Refer a separate nonpublishing QL-139 planning readiness decision only after all eight checks pass.'
    ],
    outstandingPlanningReviewApprovals: [
      'No actual owner decision, approval, rejection, signature or consent has been captured.',
      'Real owner/reviewer identity, roles, access permissions, privacy and retention require separate authorization.',
      'Ledger schema, migrations, API/Worker, Supabase/browser writes and audit persistency remain unapproved.',
      'Phone/SMS, DTMF, provider callbacks, recording, AI sending and a live pilot remain disabled.',
      'A passing QL-138 plan review is not owner permission, evidence persistence or launch authorization.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-138 is DISPLAY-ONLY public/synthetic FOLLOW-UP PLANNING REVIEW without real owner approval.',
      'QL-138 creates no schema, database, API, Worker, Supabase, browser, archive, audit or evidence-ledger write.',
      'QL-138 does not enable Phone/SMS, callbacks, recordings, AI sending or a live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-137 planning source gate is missing, duplicate, nonpassing or inconsistent with the outcome.',
      'Stop if a synthetic planning review is interpreted as real owner consent, approval, signature or implementation.',
      'Stop if a private record, schema/API/browser write, provider callback or AI live send is introduced.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-138 is DISPLAY-ONLY independent review of QL-137 synthetic/public follow-up planning. Passing permits only a separate QL-139 planning readiness DECISION. No owner choice, consent, implementation, database/API/browser/ledger/Supabase write, live Phone/SMS, provider callback, recording, AI send or pilot is authorized.',
    nextQueuedBuild: 'QL-139 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision (proposed; confirm roadmap)',
    generatedAt: new Date().toISOString()
  };
}
