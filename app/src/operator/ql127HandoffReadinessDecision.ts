import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql126ReadinessReviewHandoffPlanningReview } from './ql126ReadinessReviewHandoffPlanningReview';

type Prior = Ql126ReadinessReviewHandoffPlanningReview;
type HandoffReadinessItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql127HandoffReadinessDecision =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-127';
    title: string;
    reviewedBuild: 'QL-126';
    handoffReadinessMode: 'display_only_owner_handoff_readiness_decision';
    handoffReadinessOutcome: 'ready_for_separate_handoff_readiness_review_only' | 'handoff_readiness_revision_required';
    ownerDecisionStatus: 'handoff_readiness_only_owner_not_approved';
    handoffReadinessSummary: { passed: number; review: number; blocked: number };
    handoffReadinessItems: readonly HandoffReadinessItem[];
    handoffReadinessScope: readonly string[];
    handoffReadinessAgenda: readonly string[];
    pendingHandoffReadinessApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const ql126ExpectedIds = [
  'ql126-source-plan-gate-integrity',
  'ql126-plan-outcome-reconciliation',
  'ql126-owner-and-write-permissions',
  'ql126-handoff-agenda-review',
  'ql126-owner-choice-capture-ban',
  'ql126-private-information-exclusions',
  'ql126-disabled-communications-review',
  'ql126-separate-handoff-and-release-gates'
] as const;

const evidenceStatus = (ok: boolean): Ql094EvidenceStatus => ok ? 'pass' : 'review';

export function buildQl127HandoffReadinessDecision(prior: Prior): Ql127HandoffReadinessDecision {
  const sourceCounts = prior.handoffReviewItems.reduce((total, item) => ({
    passed: total.passed + Number(item.status === 'pass'),
    review: total.review + Number(item.status === 'review'),
    blocked: total.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceIntegrity =
    prior.build === 'QL-126' &&
    prior.reviewedBuild === 'QL-125' &&
    prior.handoffReviewItems.length === ql126ExpectedIds.length &&
    new Set(prior.handoffReviewItems.map(item => item.id)).size === ql126ExpectedIds.length &&
    ql126ExpectedIds.every(id => prior.handoffReviewItems.some(item => item.id === id && item.status === 'pass'));

  const reconciledSource =
    sourceIntegrity &&
    prior.handoffReviewOutcome === 'handoff_planning_review_ready_for_separate_readiness_decision' &&
    sourceCounts.passed === ql126ExpectedIds.length &&
    sourceCounts.review === 0 &&
    sourceCounts.blocked === 0 &&
    sourceCounts.passed === prior.handoffReviewSummary.passed &&
    sourceCounts.review === prior.handoffReviewSummary.review &&
    sourceCounts.blocked === prior.handoffReviewSummary.blocked;

  const ownerAndWriteLocks =
    prior.ownerDecisionStatus === 'handoff_planning_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const packetHandoffOnly =
    prior.approvedHandoffReviewScope.length >= 5 &&
    prior.handoffReviewFollowUpAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5;

  const deferredOwnerCapture =
    prior.pendingOwnerHandoffRequirements.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.pendingOwnerHandoffRequirements.some(text => text.includes('No owner decision')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-126 is a handoff planning REVIEW only'));

  const sensitiveDataExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const noLiveRuntime =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-126 adds no database')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-126 does not activate Phone/SMS'));

  const independentAuthorization =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.handoffReviewFollowUpAgenda.some(text => text.includes('separate authorization gate')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const handoffReadinessItems: readonly HandoffReadinessItem[] = [
    {
      id: 'ql127-ql126-gate-integrity',
      label: 'All eight QL-126 handoff planning review gates are unique and passing',
      status: evidenceStatus(sourceIntegrity),
      readinessFinding: 'Expected eight unique source gates; observed ' + prior.handoffReviewItems.length + '.',
      readinessDisposition: 'Any missing, duplicated, review or blocked source gate forces revision.',
      noWriteBoundary: 'No stored gate result, journal or owner choice.'
    },
    {
      id: 'ql127-outcome-and-counts',
      label: 'QL-126 outcome and independently recomputed gate counts agree',
      status: evidenceStatus(reconciledSource),
      readinessFinding: sourceCounts.passed + ' passed; ' + sourceCounts.review + ' review; ' + sourceCounts.blocked + ' blocked.',
      readinessDisposition: 'Passing source counts authorize only a later independent readiness review.',
      noWriteBoundary: 'No acceptance, signature, consent or durable evidence.'
    },
    {
      id: 'ql127-owner-and-write-locks',
      label: 'Owner approval remains absent and all implementation, schema, API and browser write locks remain closed',
      status: evidenceStatus(ownerAndWriteLocks),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser writes ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Readiness never grants permission to capture decisions or implement persistence.',
      noWriteBoundary: 'No migrations, Supabase, API, Worker, browser, ledger or audit writes.'
    },
    {
      id: 'ql127-review-materials',
      label: 'Handoff packet questions, approved scope and review agenda stay synthetic and read-only',
      status: evidenceStatus(packetHandoffOnly),
      readinessFinding: prior.handoffReviewFollowUpAgenda.length + ' review agenda items, ' + prior.handoffRequirements.length + ' handoff requirements.',
      readinessDisposition: 'Prepare only for separate review; do not transmit a handoff or collect decisions.',
      noWriteBoundary: 'No owner identity, submission, handoff transfer, saved packet or export.'
    },
    {
      id: 'ql127-owner-choice-still-deferred',
      label: 'Accept, reject, defer, revise, signature and consent remain uncollected',
      status: evidenceStatus(deferredOwnerCapture),
      readinessFinding: prior.pendingOwnerHandoffRequirements.length + ' pending requirements; ' + prior.captureStillNotAuthorized.length + ' capture restrictions.',
      readinessDisposition: 'Future owner capture needs separate explicit review and approval.',
      noWriteBoundary: 'No owner decision, consent capture, status transition, retention record or evidence ledger.'
    },
    {
      id: 'ql127-private-data-exclusions',
      label: 'Proposed planning fields exclude all private or provider data',
      status: evidenceStatus(sensitiveDataExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate planning fields and ' + prior.rejectedPrivateFields.length + ' rejected private fields.',
      readinessDisposition: 'Continue to use only validated synthetic/public safe reads and local fallback.',
      noWriteBoundary: 'No real customer, Phone/SMS, provider, recording, consent, or AI content.'
    },
    {
      id: 'ql127-live-runtime-disabled',
      label: 'Communication runtime and evidence persistence remain disabled',
      status: evidenceStatus(noLiveRuntime),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write runtime safeguards; ' + prior.implementationStillProhibited.length + ' prohibited implementations.',
      readinessDisposition: 'No provider connectivity, calls, texts, recording, AI delivery or pilot.',
      noWriteBoundary: 'No live Phone/SMS, DTMF, callback, recording, AI send or consent transaction.'
    },
    {
      id: 'ql127-future-gate-separation',
      label: 'A separate handoff readiness review, owner authorization, and exact-main deployment verification remain required',
      status: evidenceStatus(independentAuthorization),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' prerequisites; ' + prior.stopConditions.length + ' stop conditions and ' + prior.verificationPlanReview.length + ' release checks.',
      readinessDisposition: 'Even a passing QL-127 is not owner approval, production activation or permission to persist.',
      noWriteBoundary: 'QL-128 review and any future owner decision are separately gated.'
    }
  ];

  const handoffReadinessSummary = handoffReadinessItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffReadinessOutcome =
    handoffReadinessSummary.review === 0 && handoffReadinessSummary.blocked === 0
      ? 'ready_for_separate_handoff_readiness_review_only'
      : 'handoff_readiness_revision_required';

  return {
    ...prior,
    build: 'QL-127',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision',
    reviewedBuild: 'QL-126',
    handoffReadinessMode: 'display_only_owner_handoff_readiness_decision',
    handoffReadinessOutcome,
    handoffReadinessSummary,
    handoffReadinessItems,
    ownerDecisionStatus: 'handoff_readiness_only_owner_not_approved',
    implementationPermission: 'not_granted',
    handoffReadinessScope: [
      'Recompute all eight QL-126 handoff planning review gates and fail closed on disagreement.',
      'Review handoff readiness only; any actual owner packet transfer needs independent later authorization.',
      'Preserve no-decision/no-consent and all schema, API, browser and evidence-ledger write prohibitions.',
      'Keep all live Phone/SMS, callbacks, recording, DTMF, AI and pilot functionality disabled.',
      'Permit only a separate QL-128 readiness decision review; do not capture or implement owner decisions.'
    ],
    handoffReadinessAgenda: [
      'Verify QL-126 gate identities, statuses and computed totals before considering handoff readiness.',
      'Inventory synthetic/public-only packet questions and handoff prerequisites without transferring data.',
      'Identify any needed reviewer authority and privacy/retention controls for a future separate process.',
      'Keep every owner accept/reject/defer/revise, signature and consent choice unrecorded.',
      'Prohibit schema, endpoint, database, browser, localStorage or ledger persistence.',
      'Reconfirm disabled provider, Phone/SMS, callback, recording, AI and live pilot behaviors.',
      'Require a distinct QL-128 decision review; passing this stage is not implementation authorization.'
    ],
    pendingHandoffReadinessApprovals: [
      'An actual owner decision has not been requested, captured or persisted.',
      'No owner signature, consent, accept/reject/defer/revise status or durable decision record exists.',
      'Future decision capture, security roles, schema, API and retention require explicit separate approval.',
      'Live provider callbacks, Phone/SMS, recordings, AI sends and any pilot remain disallowed.',
      'Production GREEN describes only the verified release checks, not owner or runtime enablement.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-127 determines readiness for a later separate handoff review only, not owner approval.',
      'QL-127 performs no ledger, database, API, Worker or browser persistence.',
      'QL-127 does not enable any real provider, Phone/SMS, callback, recording, AI send or pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-126 handoff review gate is missing, repeated or inconsistent with its source summary.',
      'Stop if readiness is treated as owner consent, a captured owner decision or permission to implement.',
      'Stop for any real/private data, schema/API/database write, provider action or live message.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-127 is a DISPLAY-ONLY readiness decision for a later independent handoff review. Ready is NOT an owner decision, permission to persist, implementation approval or live enablement. All Phone/SMS, provider callbacks, recordings, AI delivery, pilot, consent capture, schema, browser/API/Supabase writes and evidence ledger writes remain disabled.',
    nextQueuedBuild: 'QL-128 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review',
    generatedAt: new Date().toISOString()
  };
}
