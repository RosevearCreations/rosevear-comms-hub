import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql138HandoffReadinessFollowUpPlanningReview } from './ql138HandoffReadinessFollowUpPlanningReview';

type Prior = Ql138HandoffReadinessFollowUpPlanningReview;

type ReadinessGate = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql139HandoffFollowUpPlanningReadinessDecision =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-139';
    title: string;
    reviewedBuild: 'QL-138';
    handoffFollowUpReadinessMode: 'display_only_handoff_follow_up_planning_readiness_decision';
    handoffFollowUpReadinessOutcome: 'ready_for_separate_readiness_decision_review_only' | 'readiness_decision_revision_required';
    ownerDecisionStatus: 'planning_readiness_only_owner_not_approved';
    handoffFollowUpReadinessSummary: { passed: number; review: number; blocked: number };
    handoffFollowUpReadinessItems: readonly ReadinessGate[];
    handoffFollowUpReadinessScope: readonly string[];
    handoffFollowUpReadinessAgenda: readonly string[];
    deferredReadinessOwnerApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const requiredQl138Ids = [
  'ql138-source-gate-integrity',
  'ql138-recalculated-source-status-and-outcome',
  'ql138-owner-implementation-persistence-locks',
  'ql138-synthetic-packet-review-materials',
  'ql138-no-owner-choice-or-consent-capture',
  'ql138-private-customer-provider-field-isolation',
  'ql138-disabled-live-communications-and-storage',
  'ql138-separate-readiness-decision-and-release'
] as const;

const statusIf = (ok: boolean): Ql094EvidenceStatus => ok ? 'pass' : 'review';

export function buildQl139HandoffFollowUpPlanningReadinessDecision(prior: Prior): Ql139HandoffFollowUpPlanningReadinessDecision {
  const sourceCounts = prior.handoffFollowUpPlanningReviewItems.reduce((acc, gate) => ({
    passed: acc.passed + Number(gate.status === 'pass'),
    review: acc.review + Number(gate.status === 'review'),
    blocked: acc.blocked + Number(gate.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceIdsValid =
    prior.build === 'QL-138' &&
    prior.reviewedBuild === 'QL-137' &&
    prior.handoffFollowUpPlanningReviewItems.length === requiredQl138Ids.length &&
    new Set(prior.handoffFollowUpPlanningReviewItems.map(gate => gate.id)).size === requiredQl138Ids.length &&
    requiredQl138Ids.every(id => prior.handoffFollowUpPlanningReviewItems.some(gate => gate.id === id && gate.status === 'pass'));

  const sourceOutcomeValid =
    sourceIdsValid &&
    prior.handoffFollowUpPlanningReviewOutcome === 'ready_for_separate_follow_up_planning_readiness_decision_only' &&
    sourceCounts.passed === requiredQl138Ids.length &&
    sourceCounts.review === 0 && sourceCounts.blocked === 0 &&
    sourceCounts.passed === prior.handoffFollowUpPlanningReviewSummary.passed &&
    sourceCounts.review === prior.handoffFollowUpPlanningReviewSummary.review &&
    sourceCounts.blocked === prior.handoffFollowUpPlanningReviewSummary.blocked;

  const permissionsLocked =
    prior.ownerDecisionStatus === 'follow_up_planning_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const packetForSafeReadOnly =
    prior.handoffFollowUpPlanningReviewScope.length >= 5 &&
    prior.handoffFollowUpPlanningReviewAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const ownerDecisionsDeferred =
    prior.outstandingPlanningReviewApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.outstandingPlanningReviewApprovals.some(value => value.includes('No actual owner decision')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-138 is DISPLAY-ONLY public/synthetic FOLLOW-UP PLANNING REVIEW'));

  const privateDataExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const noLiveRuntimeOrWrites =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(value => value.includes('QL-138 creates no schema')) &&
    prior.retainedBoundaries.some(value => value.includes('QL-138 does not enable Phone/SMS'));

  const separateFutureReview =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.handoffFollowUpPlanningReviewAgenda.some(value => value.includes('QL-139 planning readiness decision')) &&
    prior.handoffRequirements.some(value => value.includes('Exact PR-head CI success'));

  const defineGate = (
    id: string, label: string, passes: boolean, finding: string, disposition: string, boundary: string
  ): ReadinessGate => ({
    id, label, status: statusIf(passes),
    readinessFinding: finding,
    readinessDisposition: disposition,
    noWriteBoundary: boundary
  });

  const handoffFollowUpReadinessItems: readonly ReadinessGate[] = [
    defineGate('ql139-ql138-source-gates', 'Exactly eight unique expected QL-138 review gates pass',
      sourceIdsValid,
      'QL-138 review gate count: ' + prior.handoffFollowUpPlanningReviewItems.length + '.',
      'A missing, duplicate, blocked or nonpassing gate requires review correction.',
      'No saved evidence, owner choice or database mutation'),
    defineGate('ql139-source-outcome-and-counts', 'QL-138 source outcome and independently recomputed totals agree',
      sourceOutcomeValid,
      sourceCounts.passed + ' passed, ' + sourceCounts.review + ' review, ' + sourceCounts.blocked + ' blocked.',
      'Passing allows only QL-140 independent readiness decision review.',
      'No owner acceptance, consent, signature or recorded decision'),
    defineGate('ql139-owner-and-write-locks', 'Owner approval and all schema, API, Supabase, browser and ledger writes remain prohibited',
      permissionsLocked,
      'Owner ' + prior.ownerDecisionStatus + '; permission ' + prior.implementationPermission + '.',
      'A planning readiness decision must not grant implementation permission.',
      'No Worker/API/database/browser/audit/evidence ledger writes'),
    defineGate('ql139-public-synthetic-packet', 'Public/synthetic packet, questions, agenda and handoff prerequisites remain readable',
      packetForSafeReadOnly,
      prior.handoffFollowUpPlanningReviewAgenda.length + ' agenda items and ' + prior.handoffRequirements.length + ' requirements.',
      'Only public/synthetic safe reads or existing local fallback; no real packet handoff.',
      'No owner identity capture, exports, assignments or transfer'),
    defineGate('ql139-owner-approval-remains-deferred', 'Owner choices, signatures, consent and approval remain uncollected',
      ownerDecisionsDeferred,
      prior.outstandingPlanningReviewApprovals.length + ' open approvals, ' + prior.captureStillNotAuthorized.length + ' capture bans.',
      'Future owner authority, roles, privacy, retention and consent require separate authorization.',
      'No accept, reject, defer, revise, signature, approval or consent'),
    defineGate('ql139-private-field-isolation', 'Candidate synthetic planning fields exclude private provider/customer information',
      privateDataExcluded,
      prior.candidateLedgerFields.length + ' candidates, ' + prior.rejectedPrivateFields.length + ' excluded fields.',
      'Use validated public/synthetic sources only.',
      'No real customer phone, SMS, recording, provider secret or AI payload'),
    defineGate('ql139-phone-sms-ai-remain-disabled', 'Phone/SMS, provider callbacks, recordings, AI sends, pilot and data persistence remain disabled',
      noLiveRuntimeOrWrites,
      prior.retainedNoWriteRuntime.length + ' no-write safeguards and ' + prior.implementationStillProhibited.length + ' prohibited actions.',
      'The readiness decision cannot activate a communication or provider runtime.',
      'No call, SMS, callback, recording, AI delivery, live pilot or ledger write'),
    defineGate('ql139-independent-ql140-review', 'QL-140 review, owner permission and release checks remain separately required',
      separateFutureReview,
      prior.futureImplementationPrerequisites.length + ' prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      'Passing permits separate read-only readiness review only, not implementation.',
      'No owner approval, launch authorization or release check inferred')
  ];

  const handoffFollowUpReadinessSummary = handoffFollowUpReadinessItems.reduce((acc, gate) => ({
    passed: acc.passed + Number(gate.status === 'pass'),
    review: acc.review + Number(gate.status === 'review'),
    blocked: acc.blocked + Number(gate.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffFollowUpReadinessOutcome =
    handoffFollowUpReadinessSummary.review === 0 && handoffFollowUpReadinessSummary.blocked === 0
      ? 'ready_for_separate_readiness_decision_review_only'
      : 'readiness_decision_revision_required';

  return {
    ...prior,
    build: 'QL-139',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision',
    reviewedBuild: 'QL-138',
    handoffFollowUpReadinessMode: 'display_only_handoff_follow_up_planning_readiness_decision',
    handoffFollowUpReadinessOutcome,
    handoffFollowUpReadinessSummary,
    handoffFollowUpReadinessItems,
    ownerDecisionStatus: 'planning_readiness_only_owner_not_approved',
    implementationPermission: 'not_granted',
    handoffFollowUpReadinessScope: [
      'Independently verify all eight expected QL-138 review gate IDs, pass statuses, count and source result.',
      'Determine only whether a later read-only QL-140 readiness review may be proposed.',
      'Keep all owner approvals, decisions, consent and real owner identity/permission capture deferred.',
      'Preserve evidence-ledger, schema, API, Worker, Supabase, browser no-write and restricted private-field locks.',
      'Leave Phone/SMS, DTMF, provider callbacks, recording, AI sending and live pilot disabled.'
    ],
    handoffFollowUpReadinessAgenda: [
      'Recalculate QL-138 pass/review/blocked tallies and exact unique source IDs.',
      'Compare QL-138 review outcome and status summary with the independently calculated result.',
      'Inventory read-only public/synthetic packet, questions and owner handoff prerequisites.',
      'List future reviewer roles, owner authority, privacy, consent, audit and retention dependencies without capturing decisions.',
      'Confirm real customer/provider private fields remain excluded from the synthetic safe-read interface.',
      'Check evidence ledger, schema, API, Supabase/browser writes and all live communications or AI sends remain prohibited.',
      'Hand forward only a synthetic/public QL-140 independent review proposal, never an operational activation.'
    ],
    deferredReadinessOwnerApprovals: [
      'No owner accept/reject/defer/revise choice, approval, consent or signature has been recorded.',
      'Any real reviewer identity, roles, authority, access controls, privacy or retention needs separate approval.',
      'Evidence ledger persistence, migrations and API/Worker/Supabase/browser writes remain unauthorized.',
      'Phone/SMS, DTMF, provider callbacks, recordings, AI sends and live pilot remain disabled.',
      'A passing QL-139 readiness decision is not permission to implement or operate live services.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-139 is DISPLAY-ONLY synthetic/public FOLLOW-UP PLANNING READINESS DECISION, never owner consent.',
      'QL-139 performs no schema, API/Worker, Supabase, database, browser, audit, archive or evidence-ledger writes.',
      'QL-139 does not enable Phone/SMS, DTMF, callbacks, recordings, AI delivery or a live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-138 source gate is missing, duplicated, nonpassing or inconsistent with its result.',
      'Stop if synthetic readiness is mistaken for owner approval, decision capture, consent or implementation permission.',
      'Stop on private customer/provider information, writes, live calls/messages, callbacks or AI sends.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-139 is DISPLAY-ONLY readiness determination over QL-138 synthetic/public follow-up planning review. Passing permits separate QL-140 REVIEW only. Owner choices, consent, persistence, migrations, API/Worker/Supabase/browser writes, Phone/SMS, provider callbacks, recordings, AI sending and pilots remain NOT AUTHORIZED.',
    nextQueuedBuild: 'QL-140 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review Follow-Up Planning Review Readiness Decision Review (proposed; confirm roadmap)',
    generatedAt: new Date().toISOString()
  };
}
