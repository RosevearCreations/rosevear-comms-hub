import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql125ReadinessReviewHandoffPlanning } from './ql125ReadinessReviewHandoffPlanning';

type Prior = Ql125ReadinessReviewHandoffPlanning;
type ReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql126ReadinessReviewHandoffPlanningReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-126';
    title: string;
    reviewedBuild: 'QL-125';
    handoffReviewMode: 'display_only_handoff_planning_review';
    handoffReviewOutcome: 'handoff_planning_review_ready_for_separate_readiness_decision' | 'handoff_planning_review_revision_required';
    ownerDecisionStatus: 'handoff_planning_review_only_owner_not_approved';
    handoffReviewSummary: { passed: number; review: number; blocked: number };
    handoffReviewItems: readonly ReviewItem[];
    approvedHandoffReviewScope: readonly string[];
    handoffReviewFollowUpAgenda: readonly string[];
    pendingOwnerHandoffRequirements: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl125GateIds = [
  'ql125-ql124-source-integrity',
  'ql125-prior-outcome-tally',
  'ql125-implementation-write-locks',
  'ql125-owner-handoff-materials',
  'ql125-owner-approval-unrecorded',
  'ql125-safe-read-fields',
  'ql125-runtime-boundaries',
  'ql125-independent-approvals-and-checks'
] as const;
const statusFor = (passes: boolean): Ql094EvidenceStatus => passes ? 'pass' : 'review';

export function buildQl126ReadinessReviewHandoffPlanningReview(prior: Prior): Ql126ReadinessReviewHandoffPlanningReview {
  const sourceCounts = prior.handoffPlanningItems.reduce((summary, item) => ({
    passed: summary.passed + Number(item.status === 'pass'),
    review: summary.review + Number(item.status === 'review'),
    blocked: summary.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const uniqueSourceGates =
    prior.build === 'QL-125' &&
    prior.reviewedBuild === 'QL-124' &&
    prior.handoffPlanningItems.length === expectedQl125GateIds.length &&
    new Set(prior.handoffPlanningItems.map(item => item.id)).size === expectedQl125GateIds.length &&
    expectedQl125GateIds.every(id =>
      prior.handoffPlanningItems.some(item => item.id === id && item.status === 'pass')
    );

  const sourceOutcomeMatches =
    uniqueSourceGates &&
    prior.handoffPlanningOutcome === 'handoff_plan_ready_for_separate_review_only' &&
    sourceCounts.passed === expectedQl125GateIds.length &&
    sourceCounts.review === 0 &&
    sourceCounts.blocked === 0 &&
    sourceCounts.passed === prior.handoffPlanningSummary.passed &&
    sourceCounts.review === prior.handoffPlanningSummary.review &&
    sourceCounts.blocked === prior.handoffPlanningSummary.blocked;

  const ownerAndWriteLocks =
    prior.ownerDecisionStatus === 'handoff_planning_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const handoffPacketReviewable =
    prior.handoffPlanningScope.length >= 5 &&
    prior.handoffPlanAgenda.length >= 8 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5;

  const captureStillProhibited =
    prior.outstandingHandoffApprovals.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.outstandingHandoffApprovals.some(item => item.includes('have not been collected')) &&
    prior.retainedBoundaries.some(item => item.includes('QL-125 is handoff PLANNING only'));

  const sensitiveFieldsExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const noWriteRuntimeContinues =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(item => item.includes('QL-125 adds no database')) &&
    prior.retainedBoundaries.some(item => item.includes('QL-125 does not activate provider'));

  const separateApprovalAndReleaseGates =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.handoffPlanAgenda.some(item => item.includes('explicitly authorized process')) &&
    prior.handoffRequirements.some(item => item.includes('Exact PR-head CI success'));

  const handoffReviewItems: readonly ReviewItem[] = [
    {
      id: 'ql126-source-plan-gate-integrity',
      label: 'All eight expected QL-125 handoff planning gates are unique and passing',
      status: statusFor(uniqueSourceGates),
      readinessFinding: 'Expected eight QL-125 gate IDs, observed ' + prior.handoffPlanningItems.length + '.',
      readinessDisposition: 'Any missing, duplicate, review or blocked gate requires a revised handoff plan.',
      noWriteBoundary: 'Source checks run in memory; no evidence or owner decision is saved.'
    },
    {
      id: 'ql126-plan-outcome-reconciliation',
      label: 'QL-125 handoff planning result agrees with recomputed gate counts',
      status: statusFor(sourceOutcomeMatches),
      readinessFinding: sourceCounts.passed + ' passed, ' + sourceCounts.review + ' review and ' + sourceCounts.blocked + ' blocked.',
      readinessDisposition: 'A passing planning review permits considering a separate readiness decision only.',
      noWriteBoundary: 'No status is recorded as owner acceptance, consent, approval or signature.'
    },
    {
      id: 'ql126-owner-and-write-permissions',
      label: 'Owner and all schema, API, browser, ledger and persistence permissions remain locked',
      status: statusFor(ownerAndWriteLocks),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + ', implementation ' + prior.implementationPermission + ', browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Retain unapproved implementation state until an explicit separately authorized future step.',
      noWriteBoundary: 'No Supabase migration, API/Worker mutation, browser submission, archive, audit or ledger write.'
    },
    {
      id: 'ql126-handoff-agenda-review',
      label: 'Handoff scope, owner packet, open questions and review agenda are available',
      status: statusFor(handoffPacketReviewable),
      readinessFinding: prior.handoffPlanAgenda.length + ' agenda steps, ' + prior.handoffRequirements.length + ' handoff requirements.',
      readinessDisposition: 'Review synthetic/public approved inputs without collecting owner responses.',
      noWriteBoundary: 'No handoff submission, decision form, real owner identity, export or saved packet.'
    },
    {
      id: 'ql126-owner-choice-capture-ban',
      label: 'Deferred approvals and explicit bans on owner decision or consent capture remain',
      status: statusFor(captureStillProhibited),
      readinessFinding: prior.outstandingHandoffApprovals.length + ' outstanding approvals and ' + prior.captureStillNotAuthorized.length + ' capture prohibitions.',
      readinessDisposition: 'Approval, refusal, deferral, revision, signatures and consent still require separate authorization.',
      noWriteBoundary: 'No inferred or recorded owner choice, consent, accepted state or retention event.'
    },
    {
      id: 'ql126-private-information-exclusions',
      label: 'Candidate planning fields remain disjoint from excluded private/provider data',
      status: statusFor(sensitiveFieldsExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' planning-only fields and ' + prior.rejectedPrivateFields.length + ' private-field exclusions.',
      readinessDisposition: 'Use existing validated public/synthetic read-only rows or local fallback.',
      noWriteBoundary: 'No real customer, telephone, message, provider, recording, consent or AI content.'
    },
    {
      id: 'ql126-disabled-communications-review',
      label: 'No-write and disabled Phone/SMS, callback, recording, provider and AI safeguards remain',
      status: statusFor(noWriteRuntimeContinues),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write safeguards; ' + prior.implementationStillProhibited.length + ' banned implementation targets.',
      readinessDisposition: 'The review does not enable any external communications or live-pilot runtime.',
      noWriteBoundary: 'No SMS/call send, DTMF, recording, callback, provider hook, AI draft/send or live pilot.'
    },
    {
      id: 'ql126-separate-handoff-and-release-gates',
      label: 'A later readiness decision, owner authorization and exact-main release checks remain separate',
      status: statusFor(separateApprovalAndReleaseGates),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites, ' + prior.stopConditions.length + ' stop conditions, ' + prior.verificationPlanReview.length + ' verification steps.',
      readinessDisposition: 'Move only to a separate QL-127 readiness decision review if all QL-126 checks pass.',
      noWriteBoundary: 'No promotion or implementation status is inferred from planning review alone.'
    }
  ];

  const handoffReviewSummary = handoffReviewItems.reduce((summary, item) => ({
    passed: summary.passed + Number(item.status === 'pass'),
    review: summary.review + Number(item.status === 'review'),
    blocked: summary.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffReviewOutcome =
    handoffReviewSummary.review === 0 && handoffReviewSummary.blocked === 0
      ? 'handoff_planning_review_ready_for_separate_readiness_decision'
      : 'handoff_planning_review_revision_required';

  return {
    ...prior,
    build: 'QL-126',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Planning Review',
    reviewedBuild: 'QL-125',
    handoffReviewMode: 'display_only_handoff_planning_review',
    handoffReviewOutcome,
    handoffReviewSummary,
    handoffReviewItems,
    ownerDecisionStatus: 'handoff_planning_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    approvedHandoffReviewScope: [
      'Independently reconcile all eight QL-125 handoff gates, identities, statuses and counts; fail closed.',
      'Review the read-only handoff scope, questions and agenda using synthetic/public approved evidence only.',
      'Preserve explicitly unavailable owner choice capture and all ledger, schema, endpoint and browser write bans.',
      'Keep live Phone/SMS, call, provider callback, recording, AI sending and pilot operation disabled.',
      'Forward only a read-only readiness decision proposal, without owner approval or implementation.'
    ],
    handoffReviewFollowUpAgenda: [
      'Recompute all eight QL-125 handoff planning gate statuses, rejecting inconsistencies.',
      'Confirm the proposed owner handoff agenda and scope remain non-interactive.',
      'Enumerate missing approvals, operator authority and privacy/retention requirements without capturing identities.',
      'Retain a separate authorization gate for all accept/reject/defer/revise, consent or signature actions.',
      'Reject private fields and provider/customer data from the synthetic planning evidence.',
      'Confirm no Supabase/API/browser writes or live Phone/SMS, callback, recording or AI sends are enabled.',
      'Advance to a separate QL-127 handoff readiness decision only if all review gates pass.'
    ],
    pendingOwnerHandoffRequirements: [
      'No owner decision, consent, approval, rejection, deferral, revision or signature has been captured.',
      'No owner-decision capture UI, ledger schema, write endpoint, browser persistence or audit/retention is authorized.',
      'A future reviewer and permission model require a separate explicit privacy and authorization review.',
      'Live provider callbacks, Phone/SMS, recording, AI sending and pilot connectivity remain disabled.',
      'Passing QL-126 review permits only a subsequent readiness decision, never live implementation.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-126 is a handoff planning REVIEW only and does not capture or authorize an owner decision.',
      'QL-126 adds no database, API, Worker, browser, audit, archive or retention writes.',
      'QL-126 does not activate Phone/SMS, provider callback, recording, AI delivery or live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-125 gate is missing, repeated, nonpassing or inconsistent with its summary.',
      'Stop if a planning review is mistaken for an owner approval or authorization to capture consent.',
      'Stop if private data, schema/API/DB/browser writes or live provider/telephony/AI paths appear.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-126 is DISPLAY-ONLY review of QL-125 owner handoff planning. Passing only permits consideration of a separate readiness decision; it does not approve owner choices, ledger persistence, schema, database/API/browser writes or any Phone/SMS, callback, recording, consent, AI send or live pilot.',
    nextQueuedBuild: 'QL-127 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision',
    generatedAt: new Date().toISOString()
  };
}
