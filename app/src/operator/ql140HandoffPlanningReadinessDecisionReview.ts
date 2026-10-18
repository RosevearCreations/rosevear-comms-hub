import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql139HandoffFollowUpPlanningReadinessDecision } from './ql139HandoffFollowUpPlanningReadinessDecision';

type Prior = Ql139HandoffFollowUpPlanningReadinessDecision;

type DecisionReviewGate = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql140HandoffPlanningReadinessDecisionReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-140';
    title: string;
    reviewedBuild: 'QL-139';
    handoffPlanningReadinessReviewMode: 'display_only_handoff_planning_readiness_decision_review';
    handoffPlanningReadinessReviewOutcome: 'ready_for_separate_synthetic_follow_up_planning_only' | 'readiness_decision_review_revision_required';
    ownerDecisionStatus: 'readiness_decision_review_only_owner_not_approved';
    handoffPlanningReadinessReviewSummary: { passed: number; review: number; blocked: number };
    handoffPlanningReadinessReviewItems: readonly DecisionReviewGate[];
    handoffPlanningReadinessReviewScope: readonly string[];
    handoffPlanningReadinessReviewAgenda: readonly string[];
    pendingReadinessReviewApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl139Ids = [
  'ql139-ql138-source-gates',
  'ql139-source-outcome-and-counts',
  'ql139-owner-and-write-locks',
  'ql139-public-synthetic-packet',
  'ql139-owner-approval-remains-deferred',
  'ql139-private-field-isolation',
  'ql139-phone-sms-ai-remain-disabled',
  'ql139-independent-ql140-review'
] as const;

function item(id: string, label: string, ok: boolean, finding: string, disposition: string, boundary: string): DecisionReviewGate {
  return {
    id, label, status: ok ? 'pass' : 'review',
    readinessFinding: finding,
    readinessDisposition: disposition,
    noWriteBoundary: boundary
  };
}

export function buildQl140HandoffPlanningReadinessDecisionReview(prior: Prior): Ql140HandoffPlanningReadinessDecisionReview {
  const actualCounts = prior.handoffFollowUpReadinessItems.reduce((sum, gate) => ({
    passed: sum.passed + Number(gate.status === 'pass'),
    review: sum.review + Number(gate.status === 'review'),
    blocked: sum.blocked + Number(gate.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const exactSourceGates =
    prior.build === 'QL-139' &&
    prior.reviewedBuild === 'QL-138' &&
    prior.handoffFollowUpReadinessItems.length === expectedQl139Ids.length &&
    new Set(prior.handoffFollowUpReadinessItems.map(gate => gate.id)).size === expectedQl139Ids.length &&
    expectedQl139Ids.every(id =>
      prior.handoffFollowUpReadinessItems.some(gate => gate.id === id && gate.status === 'pass'));

  const sourceOutcomeReconciled =
    exactSourceGates &&
    prior.handoffFollowUpReadinessOutcome === 'ready_for_separate_readiness_decision_review_only' &&
    actualCounts.passed === expectedQl139Ids.length &&
    actualCounts.review === 0 &&
    actualCounts.blocked === 0 &&
    prior.handoffFollowUpReadinessSummary.passed === actualCounts.passed &&
    prior.handoffFollowUpReadinessSummary.review === actualCounts.review &&
    prior.handoffFollowUpReadinessSummary.blocked === actualCounts.blocked;

  const ownerAndWriteLocksClosed =
    prior.ownerDecisionStatus === 'planning_readiness_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const packetSafeReadOnly =
    prior.handoffFollowUpReadinessScope.length >= 5 &&
    prior.handoffFollowUpReadinessAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const ownerChoicesStillDeferred =
    prior.deferredReadinessOwnerApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.deferredReadinessOwnerApprovals.some(x => x.includes('No owner accept/reject/defer/revise choice')) &&
    prior.retainedBoundaries.some(x => x.includes('QL-139 is DISPLAY-ONLY synthetic/public FOLLOW-UP PLANNING READINESS DECISION'));

  const privateDataExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(x => !prior.rejectedPrivateFields.includes(x));

  const liveRuntimeAndWritesOff =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(x => x.includes('QL-139 performs no schema')) &&
    prior.retainedBoundaries.some(x => x.includes('QL-139 does not enable Phone/SMS'));

  const independentNextReviewAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.handoffFollowUpReadinessAgenda.some(x => x.includes('QL-140 independent review proposal')) &&
    prior.handoffRequirements.some(x => x.includes('Exact PR-head CI success'));

  const handoffPlanningReadinessReviewItems: readonly DecisionReviewGate[] = [
    item('ql140-source-gate-integrity', 'Exactly eight expected QL-139 readiness gates are uniquely identified and passing',
      exactSourceGates, 'QL-139 gate count: ' + prior.handoffFollowUpReadinessItems.length + '.',
      'If any gate is absent, repeated, nonpassing or blocked, require revision.',
      'No owner evidence, audit row, approval or persistent gate status'),
    item('ql140-recompute-source-outcome', 'QL-139 outcome and independently recalculated pass/review/blocked totals reconcile',
      sourceOutcomeReconciled, actualCounts.passed + ' passed; ' + actualCounts.review + ' review; ' + actualCounts.blocked + ' blocked.',
      'Success permits only separately scoped read-only follow-up planning.',
      'No real owner acceptance, consent, signature or durable review disposition'),
    item('ql140-owner-and-implementation-locks', 'Owner/implementation approval and all schema/API/Worker/Supabase/browser/ledger writes remain prohibited',
      ownerAndWriteLocksClosed, 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '.',
      'No real owner permission or implementation grant can follow from readiness review.',
      'No schema migrations, database/API/browser changes, audit/archive or evidence-ledger writes'),
    item('ql140-synthetic-packet-review', 'Public/synthetic handoff packet, questions, agenda and prerequisites remain read-only',
      packetSafeReadOnly, prior.handoffFollowUpReadinessAgenda.length + ' agenda entries; ' + prior.handoffRequirements.length + ' requirements.',
      'Real owner/reviewer assignment or actual packet transfer requires future authorization.',
      'No real identities, private handoff packets, exports, submissions or transmissions'),
    item('ql140-owner-consent-and-capture-deferred', 'All owner decisions, signatures, consent and real approvals remain deferred',
      ownerChoicesStillDeferred, prior.deferredReadinessOwnerApprovals.length + ' deferred approvals; ' + prior.captureStillNotAuthorized.length + ' capture bans.',
      'A future owner approval needs separate identity, access, privacy, consent and retention decisions.',
      'No accept/reject/defer/revise, signature, consent, status history or evidence ledger'),
    item('ql140-private-data-exclusion', 'Synthetic planning fields remain disjoint from private customer/provider data',
      privateDataExcluded, prior.candidateLedgerFields.length + ' proposed fields; ' + prior.rejectedPrivateFields.length + ' excluded fields.',
      'Continue validated public/synthetic safe reads or existing local fallback only.',
      'No real phone numbers, SMS, calls, provider credentials, recordings or AI payloads'),
    item('ql140-live-provider-and-write-ban', 'Phone/SMS, callbacks, DTMF, recordings, AI sending, pilots and persistence remain disabled',
      liveRuntimeAndWritesOff, prior.retainedNoWriteRuntime.length + ' runtime controls; ' + prior.implementationStillProhibited.length + ' prohibited capabilities.',
      'An accepted synthetic review does not activate live providers or storage.',
      'No real call, text, provider callback, recording, AI delivery or pilot'),
    item('ql140-independent-follow-up-authorization', 'Any QL-141 planning, owner authority and exact-final-main release checks remain separate',
      independentNextReviewAndRelease, prior.futureImplementationPrerequisites.length + ' prerequisites; ' + prior.stopConditions.length + ' stop conditions.',
      'QL-141 remains a separately scoped synthetic-only review progression, never owner authorization.',
      'No implementation permission, operational launch or production success inferred')
  ];

  const handoffPlanningReadinessReviewSummary = handoffPlanningReadinessReviewItems.reduce((sum, gate) => ({
    passed: sum.passed + Number(gate.status === 'pass'),
    review: sum.review + Number(gate.status === 'review'),
    blocked: sum.blocked + Number(gate.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffPlanningReadinessReviewOutcome =
    handoffPlanningReadinessReviewSummary.review === 0 && handoffPlanningReadinessReviewSummary.blocked === 0
      ? 'ready_for_separate_synthetic_follow_up_planning_only'
      : 'readiness_decision_review_revision_required';

  return {
    ...prior,
    build: 'QL-140',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review',
    reviewedBuild: 'QL-139',
    handoffPlanningReadinessReviewMode: 'display_only_handoff_planning_readiness_decision_review',
    handoffPlanningReadinessReviewOutcome,
    handoffPlanningReadinessReviewSummary,
    handoffPlanningReadinessReviewItems,
    ownerDecisionStatus: 'readiness_decision_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    handoffPlanningReadinessReviewScope: [
      'Reconcile the eight QL-139 source gates and their independently calculated totals/outcome.',
      'Inspect synthetic/public handoff agenda, packet questions and review prerequisites without a real handoff.',
      'Keep real owner choices, approvals, consent, access, privacy and retention authorization deferred.',
      'Preserve no-write schema, Worker, API, browser, Supabase, archive, audit, evidence ledger and private field restrictions.',
      'Permit only separately scoped synthetic/public QL-141 follow-up planning, not a live activation.'
    ],
    handoffPlanningReadinessReviewAgenda: [
      'Verify each of the eight expected QL-139 unique gate IDs, statuses and recalculated counts.',
      'Compare source outcome with verified pass/review/blocked status summary.',
      'Inspect public/synthetic only packet questions and independent reviewer requirements.',
      'Describe separate future owner authority, identity, access, security, privacy, consent and retention conditions.',
      'Keep actual owner accept/reject/defer/revise decisions, consent, signatures and submissions disabled.',
      'Reconfirm no real customer/provider private data, schema/API/ledger writes, calls, SMS, DTMF, callbacks, recording or AI sends.',
      'Refer only a synthetic/public QL-141 follow-up planning proposal after all eight gates pass.'
    ],
    pendingReadinessReviewApprovals: [
      'No actual owner consent, approval, signature, rejection, deferral or revision has been requested or recorded.',
      'Real owner/reviewer identities, roles, access policies, privacy and retention require later authorization.',
      'Evidence ledger, schema/migrations, API/Worker/Supabase/browser persistence and audit remain unapproved.',
      'Phone/SMS, DTMF, provider callbacks, recordings, AI sends and live pilot are prohibited.',
      'QL-140 review readiness does not authorize implementation, owner acceptance or live communication.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-140 is display-only synthetic/public READINESS DECISION REVIEW; not real owner approval, signature or consent.',
      'QL-140 adds no schema, database, Worker/API, browser, Supabase, archive, audit or evidence-ledger write.',
      'QL-140 does not enable Phone/SMS, DTMF, callbacks, recordings, AI sending or pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if a QL-139 gate is missing, repeated, nonpassing or inconsistent with the prior result.',
      'Stop if synthetic readiness review is mistaken for actual owner consent, approval or implementation.',
      'Stop on any private customer/provider data, persistence path, real call/SMS, callback or AI send.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-140 DISPLAY-ONLY public/synthetic review of QL-139 planning readiness. Passing permits only a future QL-141 separately scoped read-only plan. No owner choice, consent, implementation, database/API/browser/Supabase/ledger writes, live Phone/SMS, callbacks, recordings, AI sending or pilot is authorized.',
    nextQueuedBuild: 'QL-141 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning (proposed; confirm roadmap)',
    generatedAt: new Date().toISOString()
  };
}
