import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql136FollowUpPlanningReadinessDecisionReview } from './ql136FollowUpPlanningReadinessDecisionReview';

type Prior = Ql136FollowUpPlanningReadinessDecisionReview;
type PlanningGate = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql137HandoffReadinessReviewFollowUpPlanning =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-137';
    title: string;
    reviewedBuild: 'QL-136';
    handoffReviewFollowUpPlanningMode: 'display_only_handoff_readiness_review_follow_up_planning';
    handoffReviewFollowUpPlanningOutcome: 'ready_for_independent_follow_up_planning_review_only' | 'follow_up_planning_revision_required';
    ownerDecisionStatus: 'follow_up_planning_only_owner_not_approved';
    handoffReviewFollowUpPlanningSummary: { passed: number; review: number; blocked: number };
    handoffReviewFollowUpPlanningItems: readonly PlanningGate[];
    handoffReviewFollowUpPlanningScope: readonly string[];
    handoffReviewFollowUpPlanningAgenda: readonly string[];
    pendingPlanningOwnerApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl136GateIds = [
  'ql136-ql135-gate-integrity',
  'ql136-outcome-and-counts',
  'ql136-owner-permission-and-write-locks',
  'ql136-public-synthetic-materials',
  'ql136-owner-decisions-and-consent-deferred',
  'ql136-private-field-exclusion',
  'ql136-disabled-communications-and-persistence',
  'ql136-independent-next-gate-and-release'
] as const;

const statusIf = (condition: boolean): Ql094EvidenceStatus => condition ? 'pass' : 'review';

export function buildQl137HandoffReadinessReviewFollowUpPlanning(prior: Prior): Ql137HandoffReadinessReviewFollowUpPlanning {
  const recomputed = prior.followUpReadinessDecisionReviewItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const validSourceGates =
    prior.build === 'QL-136' &&
    prior.reviewedBuild === 'QL-135' &&
    prior.followUpReadinessDecisionReviewItems.length === expectedQl136GateIds.length &&
    new Set(prior.followUpReadinessDecisionReviewItems.map(item => item.id)).size === expectedQl136GateIds.length &&
    expectedQl136GateIds.every(id =>
      prior.followUpReadinessDecisionReviewItems.some(item => item.id === id && item.status === 'pass'));

  const matchingSourceOutcome =
    validSourceGates &&
    prior.followUpReadinessDecisionReviewOutcome === 'ready_for_separate_read_only_follow_up_planning_only' &&
    recomputed.passed === expectedQl136GateIds.length && recomputed.review === 0 && recomputed.blocked === 0 &&
    prior.followUpReadinessDecisionReviewSummary.passed === recomputed.passed &&
    prior.followUpReadinessDecisionReviewSummary.review === recomputed.review &&
    prior.followUpReadinessDecisionReviewSummary.blocked === recomputed.blocked;

  const ownerAndWriteLocks =
    prior.ownerDecisionStatus === 'follow_up_readiness_decision_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const readOnlyMaterials =
    prior.followUpReadinessDecisionReviewScope.length >= 5 &&
    prior.followUpReadinessDecisionReviewAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const deferredOwnerChoices =
    prior.deferredReadinessReviewApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.deferredReadinessReviewApprovals.some(value => value.includes('No real owner decision')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-136 is a DISPLAY-ONLY public/synthetic READINESS DECISION REVIEW'));

  const restrictedFieldsExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const disabledRuntime =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(value => value.includes('QL-136 performs no schema')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-136 does not enable Phone/SMS'));

  const separatedFutureReview =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.followUpReadinessDecisionReviewAgenda.some(value => value.includes('QL-137 follow-up planning')) &&
    prior.handoffRequirements.some(value => value.includes('Exact PR-head CI success'));

  const handoffReviewFollowUpPlanningItems: readonly PlanningGate[] = [
    {
      id: 'ql137-ql136-source-gate-integrity',
      label: 'All eight required QL-136 readiness-review gates are unique and passing',
      status: statusIf(validSourceGates),
      readinessFinding: 'Expected eight source gates; observed ' + prior.followUpReadinessDecisionReviewItems.length + '.',
      readinessDisposition: 'Missing, repeated or nonpassing source evidence requires revision.',
      noWriteBoundary: 'In-memory public/synthetic checks only, no durable gate or owner record.'
    },
    {
      id: 'ql137-review-totals-and-outcome',
      label: 'QL-136 outcome and independently recalculated gate totals agree',
      status: statusIf(matchingSourceOutcome),
      readinessFinding: recomputed.passed + ' passed, ' + recomputed.review + ' review, ' + recomputed.blocked + ' blocked.',
      readinessDisposition: 'Passing supports a future independent plan review only, not owner approval.',
      noWriteBoundary: 'No stored approval, consent, signature or evidence record.'
    },
    {
      id: 'ql137-owner-and-persistence-locks',
      label: 'Owner consent, implementation, schema, API, Supabase, browser and ledger writes remain locked',
      status: statusIf(ownerAndWriteLocks),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'No permission changes follow from synthetic planning status.',
      noWriteBoundary: 'No migration, API, Worker, Supabase, browser, audit, archive or ledger write.'
    },
    {
      id: 'ql137-readonly-owner-packet-and-agenda',
      label: 'Synthetic/public handoff packet, questions, review agenda and prerequisites are available',
      status: statusIf(readOnlyMaterials),
      readinessFinding: prior.followUpReadinessDecisionReviewAgenda.length + ' source agenda steps; ' + prior.handoffRequirements.length + ' handoff requirements.',
      readinessDisposition: 'Prepare a later reviewer agenda without transferring real owner packets.',
      noWriteBoundary: 'No real identity, reviewer assignment, packet transfer, export or submission.'
    },
    {
      id: 'ql137-owner-consent-still-deferred',
      label: 'Owner accept/reject/defer/revise, signatures, consent and approval remain uncollected',
      status: statusIf(deferredOwnerChoices),
      readinessFinding: prior.deferredReadinessReviewApprovals.length + ' deferred approvals and ' + prior.captureStillNotAuthorized.length + ' capture prohibitions.',
      readinessDisposition: 'Future real consent and owner roles require independent authorization and retention review.',
      noWriteBoundary: 'No captured consent, status transition, decision history or signature.'
    },
    {
      id: 'ql137-private-field-exclusions',
      label: 'Synthetic candidates exclude private customer and provider fields',
      status: statusIf(restrictedFieldsExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' proposed fields; ' + prior.rejectedPrivateFields.length + ' private exclusions.',
      readinessDisposition: 'Keep validated public/synthetic reads and local fallback only.',
      noWriteBoundary: 'No private phone, text, call, provider credentials, recording or AI content.'
    },
    {
      id: 'ql137-disabled-live-communications',
      label: 'Phone/SMS, DTMF, provider callbacks, recordings, AI sending, pilot and writes remain off',
      status: statusIf(disabledRuntime),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write controls; ' + prior.implementationStillProhibited.length + ' prohibited implementations.',
      readinessDisposition: 'Follow-up planning cannot activate live communications or evidence persistence.',
      noWriteBoundary: 'No live call, SMS, callback, recording, AI send or pilot.'
    },
    {
      id: 'ql137-independent-next-review',
      label: 'QL-138 planning review, owner authority and final-main release checks remain separate',
      status: statusIf(separatedFutureReview),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'Next review must independently confirm roadmap scope and maintain all no-write locks.',
      noWriteBoundary: 'No real owner authorization, implementation, approval or launch inferred.'
    }
  ];

  const handoffReviewFollowUpPlanningSummary = handoffReviewFollowUpPlanningItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffReviewFollowUpPlanningOutcome =
    handoffReviewFollowUpPlanningSummary.review === 0 && handoffReviewFollowUpPlanningSummary.blocked === 0
      ? 'ready_for_independent_follow_up_planning_review_only'
      : 'follow_up_planning_revision_required';

  return {
    ...prior,
    build: 'QL-137',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning',
    reviewedBuild: 'QL-136',
    handoffReviewFollowUpPlanningMode: 'display_only_handoff_readiness_review_follow_up_planning',
    handoffReviewFollowUpPlanningOutcome,
    handoffReviewFollowUpPlanningSummary,
    handoffReviewFollowUpPlanningItems,
    ownerDecisionStatus: 'follow_up_planning_only_owner_not_approved',
    implementationPermission: 'not_granted',
    handoffReviewFollowUpPlanningScope: [
      'Reconcile exactly eight QL-136 gate identities, source outcome and independent pass/review/blocked totals.',
      'Plan only later public/synthetic safe-read handoff discussion and reviewer questions without real packet transfer.',
      'Identify the separate owner identity, permission, consent, security, privacy and retention requirements.',
      'Maintain schema/API/Worker/Supabase/browser/evidence ledger no-write and private-field restrictions.',
      'Advance only to a distinct QL-138 planning review; no live Phone/SMS, recording, AI sending or pilot.'
    ],
    handoffReviewFollowUpPlanningAgenda: [
      'Verify QL-136 source gate identities, passing statuses and computed counts.',
      'Inventory synthetic/public handoff packet questions and outstanding readiness prerequisites.',
      'Record planning-only security, owner authority, reviewer role, consent and retention dependencies in display text.',
      'Prohibit owner choice, signature, consent and actual reviewer assignment or packet transmission.',
      'Continue to exclude all real customer/provider fields and preserve local synthetic fallback.',
      'Confirm no ledger/API/Supabase/browser writes, Phone/SMS, DTMF, callbacks, recording, AI sending or pilot.',
      'Forward only a read-only proposal to separately scoped QL-138 follow-up planning review.'
    ],
    pendingPlanningOwnerApprovals: [
      'No actual owner decision, approval, rejection, signature or consent has been captured.',
      'Real owner and reviewer identity, roles, privacy/access and retention require separate authorization.',
      'Ledger schema, migrations, API/browser/Supabase persistence and audit implementation remain unapproved.',
      'Live Phone/SMS, DTMF, provider callbacks, recordings, AI sending and pilot remain disabled.',
      'Passing QL-137 is only synthetic planning readiness for a later review, never implementation permission.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-137 is DISPLAY-ONLY public/synthetic FOLLOW-UP PLANNING and never records an owner decision.',
      'QL-137 adds no database, schema, API, Worker, Supabase, browser, audit, archive or evidence-ledger writes.',
      'QL-137 does not activate Phone/SMS, callbacks, recording, AI sending or live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop on a missing, repeated, nonpassing or contradictory QL-136 source gate.',
      'Stop when a synthetic planning outcome is treated as owner consent, signature, approval or implementation.',
      'Stop on any private customer/provider data, persistence path or live provider/AI operation.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-137 is DISPLAY-ONLY follow-up planning after QL-136 synthetic/public readiness decision review. Passing permits only a later QL-138 independent planning REVIEW. No owner consent, decision, implementation, ledger/schema/API/browser/Supabase writes, live Phone/SMS, provider callbacks, recordings, AI sending or pilot is authorized.',
    nextQueuedBuild: 'QL-138 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review (proposed; confirm against roadmap)',
    generatedAt: new Date().toISOString()
  };
}
