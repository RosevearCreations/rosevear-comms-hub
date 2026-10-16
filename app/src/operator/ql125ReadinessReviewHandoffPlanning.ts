import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql124FollowUpReadinessDecisionReview } from './ql124FollowUpReadinessDecisionReview';

type Prior = Ql124FollowUpReadinessDecisionReview;
type HandoffItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql125ReadinessReviewHandoffPlanning =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-125';
    title: string;
    reviewedBuild: 'QL-124';
    handoffPlanningMode: 'display_only_readiness_review_handoff_planning';
    handoffPlanningOutcome: 'handoff_plan_ready_for_separate_review_only' | 'handoff_plan_revision_required';
    ownerDecisionStatus: 'handoff_planning_only_owner_not_approved';
    handoffPlanningSummary: { passed: number; review: number; blocked: number };
    handoffPlanningItems: readonly HandoffItem[];
    handoffPlanningScope: readonly string[];
    handoffPlanAgenda: readonly string[];
    outstandingHandoffApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const requiredQl124GateIds = [
  'ql124-ql123-gate-identities',
  'ql124-ql123-outcome-tally',
  'ql124-implementation-permissions',
  'ql124-review-packet-completeness',
  'ql124-owner-approval-absence',
  'ql124-sensitive-information-exclusions',
  'ql124-public-preview-disabled',
  'ql124-independent-owner-and-release-gates'
] as const;

const asStatus = (ok: boolean): Ql094EvidenceStatus => ok ? 'pass' : 'review';

export function buildQl125ReadinessReviewHandoffPlanning(prior: Prior): Ql125ReadinessReviewHandoffPlanning {
  const sourceTally = prior.readinessReviewItems.reduce((result, item) => ({
    passed: result.passed + Number(item.status === 'pass'),
    review: result.review + Number(item.status === 'review'),
    blocked: result.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceIntegrity =
    prior.build === 'QL-124' &&
    prior.reviewedBuild === 'QL-123' &&
    prior.readinessReviewItems.length === requiredQl124GateIds.length &&
    new Set(prior.readinessReviewItems.map(item => item.id)).size === requiredQl124GateIds.length &&
    requiredQl124GateIds.every(id =>
      prior.readinessReviewItems.some(item => item.id === id && item.status === 'pass')
    );

  const sourceOutcome =
    sourceIntegrity &&
    prior.readinessReviewOutcome === 'review_ready_for_separate_owner_handoff_planning' &&
    sourceTally.passed === requiredQl124GateIds.length &&
    sourceTally.review === 0 &&
    sourceTally.blocked === 0 &&
    sourceTally.passed === prior.readinessReviewSummary.passed &&
    sourceTally.review === prior.readinessReviewSummary.review &&
    sourceTally.blocked === prior.readinessReviewSummary.blocked;

  const permissionsClosed =
    prior.ownerDecisionStatus === 'follow_up_readiness_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const handoffMaterialsReady =
    prior.handoffReviewAgenda.length >= 7 &&
    prior.readinessReviewScope.length >= 5 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const noOwnerDecisionCaptured =
    prior.deferredApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.deferredApprovals.some(text => text.includes('No owner decision or approval')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-124 reviews prior readiness only'));

  const privateDataExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const noLiveActivation =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-124 does not enable Phone/SMS')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-124 has no API/browser/Supabase persistence'));

  const independentAuthorizationAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.handoffReviewAgenda.some(text => text.includes('separate owner approval')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success')) &&
    prior.verificationPlanReview.length >= 7;

  const handoffPlanningItems: readonly HandoffItem[] = [
    {
      id: 'ql125-ql124-source-integrity',
      label: 'The eight QL-124 review gates remain complete, unique and passing',
      status: asStatus(sourceIntegrity),
      readinessFinding: 'Expected eight QL-124 gates; observed ' + prior.readinessReviewItems.length + '.',
      readinessDisposition: 'Any omitted, duplicate or nonpassing gate blocks handoff planning.',
      noWriteBoundary: 'The source evidence is checked in memory only; no ledger write.'
    },
    {
      id: 'ql125-prior-outcome-tally',
      label: 'QL-124 review outcome matches independently recomputed pass, review and block counts',
      status: asStatus(sourceOutcome),
      readinessFinding: sourceTally.passed + ' passed, ' + sourceTally.review + ' review, ' + sourceTally.blocked + ' blocked.',
      readinessDisposition: 'Passing counts permit separate handoff plan review only; they are not implementation approval.',
      noWriteBoundary: 'No readiness status is stored as owner consent or acceptance.'
    },
    {
      id: 'ql125-implementation-write-locks',
      label: 'Owner decision, implementation, candidate schema and all browser/API/ledger writes remain locked',
      status: asStatus(permissionsClosed),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Explicit separately reviewed owner authorization remains mandatory before any later write capability.',
      noWriteBoundary: 'No Supabase migration, API/Worker mutation, browser submit or durable evidence ledger.'
    },
    {
      id: 'ql125-owner-handoff-materials',
      label: 'The review agenda, owner packet and handoff prerequisites are available as read-only materials',
      status: asStatus(handoffMaterialsReady),
      readinessFinding: prior.handoffReviewAgenda.length + ' review agenda steps, ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'Only plan who would review and which materials are needed; do not record answers or choices.',
      noWriteBoundary: 'No approvals, signatures, exports, audit records or other captures.'
    },
    {
      id: 'ql125-owner-approval-unrecorded',
      label: 'All actual owner accept/reject/defer/revise and consent choices remain explicitly unrecorded',
      status: asStatus(noOwnerDecisionCaptured),
      readinessFinding: prior.deferredApprovals.length + ' deferred approval requirements; ' + prior.captureStillNotAuthorized.length + ' capture restrictions.',
      readinessDisposition: 'A future handoff requires a separately authorized owner decision procedure.',
      noWriteBoundary: 'No owner status transition, evidence row, browser/local storage or consent transaction.'
    },
    {
      id: 'ql125-safe-read-fields',
      label: 'Candidate planning-only fields remain separate from private or provider information',
      status: asStatus(privateDataExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' planning-only candidate fields and ' + prior.rejectedPrivateFields.length + ' rejected private fields.',
      readinessDisposition: 'Use the existing validated synthetic/public safe reads or local synthetic fallback.',
      noWriteBoundary: 'No real customer names, phone/SMS, provider credentials, recordings, consent or AI data.'
    },
    {
      id: 'ql125-runtime-boundaries',
      label: 'The disabled preview continues without live communications, AI sending or persistence',
      status: asStatus(noLiveActivation),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write runtime controls and ' + prior.implementationStillProhibited.length + ' implementation bans.',
      readinessDisposition: 'Handoff planning cannot activate a pilot, provider, SMS, call or AI delivery.',
      noWriteBoundary: 'No calls, texts, DTMF, callback, recording, provider webhook, AI sends or live pilot.'
    },
    {
      id: 'ql125-independent-approvals-and-checks',
      label: 'Separate owner permission, stop conditions and exact-main promotion verification remain required',
      status: asStatus(independentAuthorizationAndRelease),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future implementation prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'QL-126 can review planning only. Production GREEN must be supported by all checks on the final main SHA.',
      noWriteBoundary: 'No implied approval, provider enablement, decision capture or production-status shortcut.'
    }
  ];

  const handoffPlanningSummary = handoffPlanningItems.reduce((total, item) => ({
    passed: total.passed + Number(item.status === 'pass'),
    review: total.review + Number(item.status === 'review'),
    blocked: total.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffPlanningOutcome = handoffPlanningSummary.review === 0 && handoffPlanningSummary.blocked === 0
    ? 'handoff_plan_ready_for_separate_review_only'
    : 'handoff_plan_revision_required';

  return {
    ...prior,
    build: 'QL-125',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Planning',
    reviewedBuild: 'QL-124',
    handoffPlanningMode: 'display_only_readiness_review_handoff_planning',
    handoffPlanningOutcome,
    ownerDecisionStatus: 'handoff_planning_only_owner_not_approved',
    implementationPermission: 'not_granted',
    handoffPlanningSummary,
    handoffPlanningItems,
    handoffPlanningScope: [
      'Recalculate and inspect all eight QL-124 review checks; stop on any mismatch.',
      'Plan a future owner handoff using only approved public/synthetic read-only packet material.',
      'Keep owner approve/reject/defer/revise and signature or consent collection outside the current preview.',
      'Preserve disabled ledger/schema/endpoint/browser writes and all live communications/AI restrictions.',
      'Advance only to a separately authorized review of this handoff plan, not to implementation.'
    ],
    handoffPlanAgenda: [
      'Reconcile all eight QL-124 gate identities, statuses and summary counts.',
      'Identify the potential handoff reviewer and decision authority without saving identifying details.',
      'Inventory synthetic/public packet questions, prerequisites and deferred owner choices.',
      'Identify privacy, access, consent, retention and security topics requiring later review.',
      'Distinguish proposed planning fields from banned private or provider fields.',
      'Require an explicitly authorized process before any owner answer, consent or signature is collected.',
      'Confirm all Phone/SMS, provider, callback, recording, AI-send and pilot operations remain disabled.',
      'Reserve QL-126 for read-only handoff planning review, with no API/ledger/browser persistence.'
    ],
    outstandingHandoffApprovals: [
      'Owner acceptance, approval, refusal, deferral and consent have not been collected.',
      'Who can approve or receive any future handoff still requires separate authorization.',
      'Decision-capture UI, ledger schema, API access, retention and audit policy remain unapproved.',
      'Provider callbacks, live Phone/SMS, call recording, AI sending and pilot launch remain disabled.',
      'A successful handoff plan review is not authority to make, capture or enforce a real owner choice.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-125 is handoff PLANNING only and cannot store or imply any actual owner decision.',
      'QL-125 adds no database, API, Worker, local-storage or browser writes.',
      'QL-125 does not activate provider, Phone/SMS, callback, recording, AI delivery or live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop handoff planning on missing, duplicate or inconsistent QL-124 gates or summaries.',
      'Stop if a passing QL-125 plan is interpreted as owner approval, consent, or implementation authority.',
      'Stop on any private/customer data, write endpoint, schema, provider connection or live message.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-125 is DISPLAY-ONLY owner handoff PLANNING following a QL-124 readiness review. A passing plan allows a separate planning review only. Owner approval, consent, data persistence and live operations are NOT AUTHORIZED; browser/API/Supabase writes, Phone/SMS, callbacks, recording, AI sends and pilots remain disabled.',
    nextQueuedBuild: 'QL-126 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Planning Review',
    generatedAt: new Date().toISOString()
  };
}
