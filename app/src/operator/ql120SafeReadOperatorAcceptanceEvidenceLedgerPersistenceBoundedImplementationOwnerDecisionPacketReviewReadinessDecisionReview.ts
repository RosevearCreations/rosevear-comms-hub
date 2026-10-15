import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql119SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecision } from './ql119SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecision';

type Prior = Ql119SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecision;
type ReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql120SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecisionReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-120';
    title: string;
    reviewedBuild: 'QL-119';
    reviewMode: 'display_only_owner_packet_readiness_decision_review';
    reviewOutcome: 'owner_packet_readiness_review_ready_for_owner_consideration' | 'owner_packet_readiness_review_revision_required';
    ownerDecisionStatus: 'readiness_review_only_owner_not_approved';
    reviewSummary: { passed: number; review: number; blocked: number };
    reviewItems: readonly ReviewItem[];
    approvedReviewScope: readonly string[];
    ownerDecisionPacketReadinessWarning: string;
    nextQueuedBuild: string;
  };

const requiredPriorGateIds = [
  'ql119-prior-review-ready',
  'ql119-permission-lock-ready',
  'ql119-owner-review-packet-ready',
  'ql119-decision-capture-ban-ready',
  'ql119-private-field-exclusion-ready',
  'ql119-implementation-gate-ready',
  'ql119-public-safe-runtime-ready'
] as const;

const statusWhen = (condition: boolean): Ql094EvidenceStatus => condition ? 'pass' : 'review';

export function buildQl120SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecisionReview(
  prior: Prior
): Ql120SafeReadOperatorAcceptanceEvidenceLedgerPersistenceBoundedImplementationOwnerDecisionPacketReviewReadinessDecisionReview {
  const priorGateIntegrity =
    prior.build === 'QL-119' &&
    prior.reviewedBuild === 'QL-118' &&
    prior.readinessItems.length === requiredPriorGateIds.length &&
    new Set(prior.readinessItems.map((item) => item.id)).size === requiredPriorGateIds.length &&
    requiredPriorGateIds.every((id) => prior.readinessItems.some((item) => item.id === id && item.status === 'pass'));
  const tally = prior.readinessItems.reduce(
    (sum, item) => ({
      passed: sum.passed + Number(item.status === 'pass'),
      review: sum.review + Number(item.status === 'review'),
      blocked: sum.blocked + Number(item.status === 'blocked')
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
  const readinessConsistent = priorGateIntegrity &&
    prior.readinessOutcome === 'owner_packet_ready_for_later_decision_review' &&
    prior.readinessSummary.passed === tally.passed &&
    prior.readinessSummary.review === tally.review &&
    prior.readinessSummary.blocked === tally.blocked &&
    tally.passed === 7 && tally.review === 0 && tally.blocked === 0;
  const permissionsLocked =
    prior.ownerDecisionStatus === 'packet_readiness_decision_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';
  const ownerPacketOnly =
    prior.reviewedPacketReviewAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.ownerDecisionReviewPrerequisites.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5;
  const decisionCaptureBanned =
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.requiredCorrectionsBeforeOwnerDecisionCapture.length >= 5 &&
    prior.retainedBoundaries.some((item) => item.includes('does not approve implementation'));
  const privateDataExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    prior.candidateLedgerFields.every((field) => !prior.rejectedPrivateFields.includes(field));
  const disabledRuntimeRetained =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.retainedBoundaries.length >= 5 &&
    prior.implementationStillProhibited.length >= 5;
  const futureGatesRetained =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.approvedReadinessScope.length >= 5;

  const reviewItems: readonly ReviewItem[] = [
    {
      id: 'ql120-source-gates',
      label: 'All seven QL-119 gate identifiers are present, unique and passing',
      status: statusWhen(priorGateIntegrity),
      readinessFinding: 'QL-119 expected gate count: 7; actual: ' + prior.readinessItems.length + '.',
      readinessDisposition: 'Any missing, duplicate, blocked or review gate requires packet revision before further consideration.',
      noWriteBoundary: 'Gate review cannot capture an owner decision or persist evidence.'
    },
    {
      id: 'ql120-readiness-consistency',
      label: 'QL-119 review totals match its stated readiness outcome',
      status: statusWhen(readinessConsistent),
      readinessFinding: 'Computed: ' + tally.passed + ' pass, ' + tally.review + ' review, ' + tally.blocked + ' blocked; outcome: ' + prior.readinessOutcome + '.',
      readinessDisposition: 'A passing packet is ready for later owner consideration only; it is not owner approval.',
      noWriteBoundary: 'No acceptance, signature, authority, or durable decision is created.'
    },
    {
      id: 'ql120-write-permission-locks',
      label: 'Owner status and all implementation/write locks remain unchanged',
      status: statusWhen(permissionsLocked),
      readinessFinding: 'Owner: ' + prior.ownerDecisionStatus + '; implementation: ' + prior.implementationPermission + '; browser: ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Keep ledger, schema, endpoint and browser mutations disabled even if all review checks pass.',
      noWriteBoundary: 'No Supabase mutation, migration, Worker/API write or browser save/submit.'
    },
    {
      id: 'ql120-owner-packet-boundary',
      label: 'Owner review questions, agenda and approval prerequisites are present',
      status: statusWhen(ownerPacketOnly),
      readinessFinding: prior.reviewedPacketReviewAgenda.length + ' agenda entries and ' + prior.ownerDecisionQuestionsForReview.length + ' questions retained.',
      readinessDisposition: 'Treat accept/reject/defer/revise as discussion topics, never selectable or stored outcomes.',
      noWriteBoundary: 'No decision buttons, hidden writes, consent, records or exports.'
    },
    {
      id: 'ql120-capture-ban',
      label: 'Decision capture prohibitions and correction gates remain explicit',
      status: statusWhen(decisionCaptureBanned),
      readinessFinding: prior.captureStillNotAuthorized.length + ' capture prohibitions and ' + prior.requiredCorrectionsBeforeOwnerDecisionCapture.length + ' pre-capture corrections retained.',
      readinessDisposition: 'Separate owner authorization and independently reviewed implementation scope remain required.',
      noWriteBoundary: 'No local persistence, logs, audits, archive, approval or signature capture.'
    },
    {
      id: 'ql120-private-data-boundary',
      label: 'Candidate planning fields and excluded private fields do not overlap',
      status: statusWhen(privateDataExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate fields; ' + prior.rejectedPrivateFields.length + ' private exclusions.',
      readinessDisposition: 'Use only public/synthetic safe-read review text and preserve all rejected field exclusions.',
      noWriteBoundary: 'No private customer, contact, SMS, voice, callback, recording, consent, provider or AI data.'
    },
    {
      id: 'ql120-disabled-runtime-boundary',
      label: 'Disabled preview, no-write runtime and implementation bans remain intact',
      status: statusWhen(disabledRuntimeRetained),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' runtime safeguards and ' + prior.implementationStillProhibited.length + ' prohibited implementation targets.',
      readinessDisposition: 'Fail closed on any widening of Phone/SMS, provider, callback, AI or pilot runtime.',
      noWriteBoundary: 'No provider calls, sends, inbound voice/SMS, DTMF, AI delivery or live pilot.'
    },
    {
      id: 'ql120-future-gate-boundary',
      label: 'Stop conditions and separately required future approval/deployment gates are retained',
      status: statusWhen(futureGatesRetained),
      readinessFinding: prior.stopConditions.length + ' stop conditions and ' + prior.verificationPlanReview.length + ' verification steps.',
      readinessDisposition: 'Reviewing a readiness result is not sufficient to authorize or deploy an implementation.',
      noWriteBoundary: 'Do not claim production GREEN without exact final main SHA and all independent deploy checks.'
    }
  ];

  const reviewSummary = reviewItems.reduce(
    (sum, item) => ({
      passed: sum.passed + Number(item.status === 'pass'),
      review: sum.review + Number(item.status === 'review'),
      blocked: sum.blocked + Number(item.status === 'blocked')
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
  const reviewOutcome = reviewSummary.review === 0 && reviewSummary.blocked === 0
    ? 'owner_packet_readiness_review_ready_for_owner_consideration'
    : 'owner_packet_readiness_review_revision_required';

  return {
    ...prior,
    build: 'QL-120',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Readiness Decision Review',
    reviewedBuild: 'QL-119',
    reviewMode: 'display_only_owner_packet_readiness_decision_review',
    reviewOutcome,
    ownerDecisionStatus: 'readiness_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    reviewSummary,
    reviewItems,
    approvedReviewScope: [
      'Reconcile QL-119 seven readiness checks with actual statuses and computed totals; fail closed on disagreement.',
      'Inspect owner packet completeness, no-write boundary, exclusions and stop conditions.',
      'Treat owner decisions, approval, refusal and deferral as read-only discussion items only.',
      'Review does not grant implementation permission, schema authorization or Phone/SMS/live pilot enablement.',
      'Require explicit separate owner approval and exact-main production GREEN checks for any later implementation.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-120 is a readiness decision review only and does not approve implementation.',
      'QL-120 has no decision or consent capture, persistence, write endpoints, provider sends or live pilot.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-120 is a DISPLAY-ONLY review of QL-119 readiness. Even a clean review means ready for later owner consideration, NOT owner approval. No decision, signature or acceptance is captured; Supabase/API/browser writes, Phone/SMS, DTMF, callbacks, recordings, audits, archives, retention, AI delivery and live pilot remain disabled.',
    nextQueuedBuild: 'QL-121 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Planning',
    generatedAt: new Date().toISOString()
  };
}
