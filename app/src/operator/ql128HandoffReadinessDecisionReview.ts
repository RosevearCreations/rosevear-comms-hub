import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql127HandoffReadinessDecision } from './ql127HandoffReadinessDecision';

type Prior = Ql127HandoffReadinessDecision;
type DecisionReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql128HandoffReadinessDecisionReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-128';
    title: string;
    reviewedBuild: 'QL-127';
    handoffDecisionReviewMode: 'display_only_handoff_readiness_decision_review';
    handoffDecisionReviewOutcome: 'handoff_readiness_review_ready_for_separate_follow_up_planning' | 'handoff_readiness_review_revision_required';
    ownerDecisionStatus: 'handoff_readiness_review_only_owner_not_approved';
    handoffDecisionReviewSummary: { passed: number; review: number; blocked: number };
    handoffDecisionReviewItems: readonly DecisionReviewItem[];
    handoffDecisionReviewScope: readonly string[];
    handoffDecisionReviewAgenda: readonly string[];
    outstandingOwnerReviewApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedPriorGateIds = [
  'ql127-ql126-gate-integrity',
  'ql127-outcome-and-counts',
  'ql127-owner-and-write-locks',
  'ql127-review-materials',
  'ql127-owner-choice-still-deferred',
  'ql127-private-data-exclusions',
  'ql127-live-runtime-disabled',
  'ql127-future-gate-separation'
] as const;

const asEvidenceStatus = (condition: boolean): Ql094EvidenceStatus => condition ? 'pass' : 'review';

export function buildQl128HandoffReadinessDecisionReview(prior: Prior): Ql128HandoffReadinessDecisionReview {
  const recomputed = prior.handoffReadinessItems.reduce((summary, item) => ({
    passed: summary.passed + Number(item.status === 'pass'),
    review: summary.review + Number(item.status === 'review'),
    blocked: summary.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const sourceGateIntegrity =
    prior.build === 'QL-127' &&
    prior.reviewedBuild === 'QL-126' &&
    prior.handoffReadinessItems.length === expectedPriorGateIds.length &&
    new Set(prior.handoffReadinessItems.map(item => item.id)).size === expectedPriorGateIds.length &&
    expectedPriorGateIds.every(id =>
      prior.handoffReadinessItems.some(item => item.id === id && item.status === 'pass')
    );

  const recomputedOutcomeMatches =
    sourceGateIntegrity &&
    prior.handoffReadinessOutcome === 'ready_for_separate_handoff_readiness_review_only' &&
    recomputed.passed === expectedPriorGateIds.length &&
    recomputed.review === 0 &&
    recomputed.blocked === 0 &&
    prior.handoffReadinessSummary.passed === recomputed.passed &&
    prior.handoffReadinessSummary.review === recomputed.review &&
    prior.handoffReadinessSummary.blocked === recomputed.blocked;

  const ownerAndWriteLocks =
    prior.ownerDecisionStatus === 'handoff_readiness_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const syntheticPacketAvailable =
    prior.handoffReadinessScope.length >= 5 &&
    prior.handoffReadinessAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5;

  const ownerCaptureStillForbidden =
    prior.pendingHandoffReadinessApprovals.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.pendingHandoffReadinessApprovals.some(text => text.includes('actual owner decision')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-127 determines readiness for a later separate handoff review only'));

  const privateDataExclusion =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const noLiveCommunications =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-127 performs no ledger')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-127 does not enable any real provider'));

  const independentReviewAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.handoffReadinessAgenda.some(text => text.includes('distinct QL-128 decision review')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const handoffDecisionReviewItems: readonly DecisionReviewItem[] = [
    {
      id: 'ql128-source-readiness-gate-integrity',
      label: 'Exactly eight unique and passing QL-127 handoff readiness decision gates exist',
      status: asEvidenceStatus(sourceGateIntegrity),
      readinessFinding: 'Expected eight source gates; observed ' + prior.handoffReadinessItems.length + '.',
      readinessDisposition: 'Missing, duplicate, review or blocked source gates require readiness revision.',
      noWriteBoundary: 'No gate evidence, approval or owner decision is stored.'
    },
    {
      id: 'ql128-source-outcome-reconciliation',
      label: 'QL-127 readiness outcome agrees with independent tally and approved review-only scope',
      status: asEvidenceStatus(recomputedOutcomeMatches),
      readinessFinding: recomputed.passed + ' pass, ' + recomputed.review + ' review, ' + recomputed.blocked + ' blocked.',
      readinessDisposition: 'A passing review can plan future steps only, never owner or implementation approval.',
      noWriteBoundary: 'No owner signature, consent, accepted status or durable review record.'
    },
    {
      id: 'ql128-owner-permissions-still-locked',
      label: 'Owner, implementation, schema, API, evidence ledger and browser-write permissions remain closed',
      status: asEvidenceStatus(ownerAndWriteLocks),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Do not infer grant from the QL-127 readiness outcome.',
      noWriteBoundary: 'No Supabase/API/Worker/browser/localStorage writes, schema or migrations.'
    },
    {
      id: 'ql128-review-packet-completeness',
      label: 'Public/synthetic packet questions and handoff review agenda remain display-only',
      status: asEvidenceStatus(syntheticPacketAvailable),
      readinessFinding: prior.handoffReadinessAgenda.length + ' agenda items, ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'No owner-identifying packet transfer, decision form, handoff send or capture.',
      noWriteBoundary: 'No submission, real owner identity, export, archive, audit or retained record.'
    },
    {
      id: 'ql128-deferred-owner-choice-restrictions',
      label: 'Owner accept/reject/defer/revise, signatures and consent remain uncollected',
      status: asEvidenceStatus(ownerCaptureStillForbidden),
      readinessFinding: prior.pendingHandoffReadinessApprovals.length + ' pending approval statements; ' + prior.captureStillNotAuthorized.length + ' capture restrictions.',
      readinessDisposition: 'Owner decisions require a separately authorized later mechanism.',
      noWriteBoundary: 'No approval state transition, consent capture, evidence persistence or decision history.'
    },
    {
      id: 'ql128-sensitive-field-exclusions',
      label: 'Candidate synthetic fields remain separate from private customer/provider data',
      status: asEvidenceStatus(privateDataExclusion),
      readinessFinding: prior.candidateLedgerFields.length + ' candidate fields and ' + prior.rejectedPrivateFields.length + ' private exclusions.',
      readinessDisposition: 'Only existing validated public/synthetic reads and local fallback are permitted.',
      noWriteBoundary: 'No live customer, provider, phone, message, consent, call recording or AI data.'
    },
    {
      id: 'ql128-live-runtime-remains-disabled',
      label: 'No-write runtime, Phone/SMS, callbacks, recording, provider, AI delivery and pilot remain disabled',
      status: asEvidenceStatus(noLiveCommunications),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write safeguards and ' + prior.implementationStillProhibited.length + ' implementation bans.',
      readinessDisposition: 'Do not activate any communication runtime based on readiness review.',
      noWriteBoundary: 'No DTMF, call, text, provider hook, callback, recording, AI send or live pilot.'
    },
    {
      id: 'ql128-future-authorization-and-release',
      label: 'Follow-up planning, owner authorization and exact-main release evidence remain distinct gates',
      status: asEvidenceStatus(independentReviewAndRelease),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' prerequisites, ' + prior.stopConditions.length + ' stop conditions, ' + prior.verificationPlanReview.length + ' verification checks.',
      readinessDisposition: 'QL-129 may plan a separate follow-up only; production GREEN requires final-main check successes.',
      noWriteBoundary: 'No automatic promotion, owner consent or implementation authorization.'
    }
  ];

  const handoffDecisionReviewSummary = handoffDecisionReviewItems.reduce((summary, item) => ({
    passed: summary.passed + Number(item.status === 'pass'),
    review: summary.review + Number(item.status === 'review'),
    blocked: summary.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const handoffDecisionReviewOutcome =
    handoffDecisionReviewSummary.review === 0 && handoffDecisionReviewSummary.blocked === 0
      ? 'handoff_readiness_review_ready_for_separate_follow_up_planning'
      : 'handoff_readiness_review_revision_required';

  return {
    ...prior,
    build: 'QL-128',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review',
    reviewedBuild: 'QL-127',
    handoffDecisionReviewMode: 'display_only_handoff_readiness_decision_review',
    handoffDecisionReviewOutcome,
    handoffDecisionReviewSummary,
    handoffDecisionReviewItems,
    ownerDecisionStatus: 'handoff_readiness_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    handoffDecisionReviewScope: [
      'Independently check all eight QL-127 readiness gates and totals; fail closed on disagreement.',
      'Display only existing synthetic/public owner packet questions, readiness review agenda and stop conditions.',
      'Continue requiring separate authorization for any real owner decision or handoff execution.',
      'Keep schema, Supabase/API/browser/ledger writes and all Phone/SMS, callbacks, recording and AI delivery disabled.',
      'Allow only a later read-only follow-up planning proposal, never an owner approval or live activation.'
    ],
    handoffDecisionReviewAgenda: [
      'Compare QL-127 gate IDs and recomputed tallies; hold on a mismatch.',
      'Check synthetic handoff questions and read-only packet completeness.',
      'Review outstanding owner permissions, decision capture, privacy, retention and security prerequisites.',
      'Preserve restrictions on consent, signature, approved/rejected/deferred status and evidence persistence.',
      'Exclude all sensitive customer/provider and communication data.',
      'Reconfirm no Phone/SMS, provider callback, recording, AI send or live pilot is enabled.',
      'Require a separate QL-129 follow-up planning step, not an implementation.'
    ],
    outstandingOwnerReviewApprovals: [
      'Owner approval or denial has not been requested, captured or persisted in QL-128.',
      'Decision capture, signatures, consent and any evidence-ledger storage require separate approval.',
      'Any future owner identity or role-based access requires independent authorization and privacy review.',
      'Live phone/SMS, provider callbacks, recordings, AI sends and live pilot remain disabled.',
      'A successful QL-128 readiness review is not owner permission, consent or launch approval.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-128 reviews QL-127 handoff readiness only; it never captures an owner decision.',
      'QL-128 adds no schema, database, Supabase, API, Worker, audit, archive or browser writes.',
      'QL-128 does not enable Phone/SMS, provider callback, recording, AI delivery or a live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-127 source gate is missing, duplicated, nonpassing or inconsistent.',
      'Stop if the QL-128 review is misrepresented as owner consent or implementation approval.',
      'Stop if private customer/provider data, API/schema writes, phone, SMS or AI send is introduced.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-128 is a DISPLAY-ONLY review of QL-127 handoff readiness. Passing allows a separate future follow-up PLANNING stage only. Owner approval, consent, evidence persistence, implementation, database/API/browser writes, live Phone/SMS, callbacks, recording, AI delivery and pilot remain NOT AUTHORIZED.',
    nextQueuedBuild: 'QL-129 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Review Handoff Readiness Decision Review Follow-Up Planning',
    generatedAt: new Date().toISOString()
  };
}
