import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql131FollowUpPlanningReviewReadinessDecision } from './ql131FollowUpPlanningReviewReadinessDecision';

type Prior = Ql131FollowUpPlanningReviewReadinessDecision;
type ReadinessReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql132FollowUpReadinessDecisionReview =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-132';
    title: string;
    reviewedBuild: 'QL-131';
    followUpReadinessReviewMode: 'display_only_follow_up_readiness_decision_review';
    followUpReadinessReviewOutcome: 'follow_up_readiness_review_ready_for_separate_follow_up_planning_only' | 'follow_up_readiness_review_revision_required';
    ownerDecisionStatus: 'follow_up_readiness_review_only_owner_not_approved';
    followUpReadinessReviewSummary: { passed: number; review: number; blocked: number };
    followUpReadinessReviewItems: readonly ReadinessReviewItem[];
    followUpReadinessReviewScope: readonly string[];
    followUpReadinessReviewAgenda: readonly string[];
    pendingOwnerReadinessReviewApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl131GateIds = [
  'ql131-ql130-source-gate-integrity',
  'ql131-ql130-outcome-and-summary',
  'ql131-implementation-and-ledger-locks',
  'ql131-readonly-packet-and-review-agenda',
  'ql131-owner-choice-and-consent-blocked',
  'ql131-sensitive-field-exclusions',
  'ql131-live-runtime-disabled',
  'ql131-independent-follow-up-review-and-release'
] as const;

const asStatus = (passes: boolean): Ql094EvidenceStatus => passes ? 'pass' : 'review';

export function buildQl132FollowUpReadinessDecisionReview(prior: Prior): Ql132FollowUpReadinessDecisionReview {
  const sourceTotals = prior.followUpReadinessItems.reduce((sum, item) => ({
    passed: sum.passed + Number(item.status === 'pass'),
    review: sum.review + Number(item.status === 'review'),
    blocked: sum.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const uniquePassingSourceGates =
    prior.build === 'QL-131' &&
    prior.reviewedBuild === 'QL-130' &&
    prior.followUpReadinessItems.length === expectedQl131GateIds.length &&
    new Set(prior.followUpReadinessItems.map(item => item.id)).size === expectedQl131GateIds.length &&
    expectedQl131GateIds.every(id =>
      prior.followUpReadinessItems.some(item => item.id === id && item.status === 'pass')
    );

  const reconciledSourceOutcome =
    uniquePassingSourceGates &&
    prior.followUpReadinessOutcome === 'ready_for_separate_follow_up_readiness_review_only' &&
    sourceTotals.passed === expectedQl131GateIds.length &&
    sourceTotals.review === 0 &&
    sourceTotals.blocked === 0 &&
    prior.followUpReadinessSummary.passed === sourceTotals.passed &&
    prior.followUpReadinessSummary.review === sourceTotals.review &&
    prior.followUpReadinessSummary.blocked === sourceTotals.blocked;

  const ownerAndPersistenceLocks =
    prior.ownerDecisionStatus === 'follow_up_readiness_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const syntheticPacketCompleteness =
    prior.followUpReadinessScope.length >= 5 &&
    prior.followUpReadinessAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const ownerChoicesDeferred =
    prior.outstandingReadinessApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.outstandingReadinessApprovals.some(text => text.includes('No owner approval')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-131 is a display-only review READINESS DECISION'));

  const privateFieldsRemainExcluded =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const liveRuntimeRemainsDisabled =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-131 performs no database')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-131 does not enable Phone/SMS'));

  const separateAuthorizationAndRelease =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.followUpReadinessAgenda.some(text => text.includes('QL-132 independent readiness review')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const followUpReadinessReviewItems: readonly ReadinessReviewItem[] = [
    {
      id: 'ql132-source-readiness-gate-integrity',
      label: 'Exactly eight unique, expected QL-131 readiness decision gates are passing',
      status: asStatus(uniquePassingSourceGates),
      readinessFinding: 'Expected eight distinct QL-131 readiness gates; observed ' + prior.followUpReadinessItems.length + '.',
      readinessDisposition: 'Missing, duplicated, review or blocked gates force a corrected QL-131 decision.',
      noWriteBoundary: 'In-memory verification only; no audit row, owner decision or persistent ledger.'
    },
    {
      id: 'ql132-source-outcome-and-summary',
      label: 'QL-131 readiness outcome and independently recomputed status counts agree',
      status: asStatus(reconciledSourceOutcome),
      readinessFinding: sourceTotals.passed + ' passed, ' + sourceTotals.review + ' review, ' + sourceTotals.blocked + ' blocked.',
      readinessDisposition: 'Passing reconciliation permits only future synthetic/public follow-up planning.',
      noWriteBoundary: 'No accepted status, approval, signature, consent or retained review packet.'
    },
    {
      id: 'ql132-owner-and-write-boundaries',
      label: 'Owner, implementation, schema, API, browser, Supabase and ledger writes remain unauthorized',
      status: asStatus(ownerAndPersistenceLocks),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'Review success cannot grant write, implementation or owner-capture permission.',
      noWriteBoundary: 'No migrations, API/Worker/database/browser/local storage, archive, audit or evidence writes.'
    },
    {
      id: 'ql132-read-only-review-materials',
      label: 'Read-only owner packet questions, scope and synthetic/public readiness agenda remain available',
      status: asStatus(syntheticPacketCompleteness),
      readinessFinding: prior.followUpReadinessAgenda.length + ' agenda items and ' + prior.handoffRequirements.length + ' handoff requirements.',
      readinessDisposition: 'Review synthetic inputs without transferring packets, collecting owner identity or assigning reviewers.',
      noWriteBoundary: 'No handoff send, forms, export, submission, signature or stored owner packet.'
    },
    {
      id: 'ql132-owner-decisions-uncollected',
      label: 'Owner accept, reject, defer, revise, signatures and consent are all still prohibited',
      status: asStatus(ownerChoicesDeferred),
      readinessFinding: prior.outstandingReadinessApprovals.length + ' outstanding requirements; ' + prior.captureStillNotAuthorized.length + ' capture restrictions.',
      readinessDisposition: 'Independent future authority, privacy, identity, consent and retention review remains mandatory.',
      noWriteBoundary: 'No owner-choice history, consent ledger, status transition or durable evidence.'
    },
    {
      id: 'ql132-private-data-isolation',
      label: 'Candidate safe-read planning fields remain disjoint from excluded private and provider data',
      status: asStatus(privateFieldsRemainExcluded),
      readinessFinding: prior.candidateLedgerFields.length + ' synthetic planning fields; ' + prior.rejectedPrivateFields.length + ' private exclusions.',
      readinessDisposition: 'Only previously validated public/synthetic reads or local fallback are permitted.',
      noWriteBoundary: 'No real customer, phone, SMS, provider credentials, recordings, consent or AI data.'
    },
    {
      id: 'ql132-live-communications-disabled',
      label: 'All Phone/SMS, DTMF, provider callback, recording, AI send and live pilot paths remain disabled',
      status: asStatus(liveRuntimeRemainsDisabled),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write safeguards and ' + prior.implementationStillProhibited.length + ' implementation prohibitions.',
      readinessDisposition: 'Never activate communications or persistence during a readiness decision review.',
      noWriteBoundary: 'No calls, text messages, provider callbacks, recordings, AI delivery or pilot.'
    },
    {
      id: 'ql132-independent-follow-up-and-release',
      label: 'Any later follow-up planning, owner authorization and exact-main release proof remain independent',
      status: asStatus(separateAuthorizationAndRelease),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' future prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'QL-133 planning remains separately scoped; App CI or deployment success is not owner approval.',
      noWriteBoundary: 'No implementation permission, consent, saved decision or activation is inferred.'
    }
  ];

  const followUpReadinessReviewSummary = followUpReadinessReviewItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const followUpReadinessReviewOutcome =
    followUpReadinessReviewSummary.review === 0 && followUpReadinessReviewSummary.blocked === 0
      ? 'follow_up_readiness_review_ready_for_separate_follow_up_planning_only'
      : 'follow_up_readiness_review_revision_required';

  return {
    ...prior,
    build: 'QL-132',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision Review',
    reviewedBuild: 'QL-131',
    followUpReadinessReviewMode: 'display_only_follow_up_readiness_decision_review',
    followUpReadinessReviewOutcome,
    followUpReadinessReviewSummary,
    followUpReadinessReviewItems,
    ownerDecisionStatus: 'follow_up_readiness_review_only_owner_not_approved',
    implementationPermission: 'not_granted',
    followUpReadinessReviewScope: [
      'Independently validate all eight QL-131 readiness gate identities, statuses, source outcome and recomputed summary.',
      'Review only existing synthetic/public owner packet materials, future questions, agenda and safety boundaries.',
      'Keep all owner decisions, signatures and consent uncollected and preserve authorization as a separate later process.',
      'Retain all schema/Supabase/API/browser/ledger no-write and Phone/SMS, callback, recording, AI send and pilot bans.',
      'Advance only to a separately scoped read-only follow-up planning review, never live implementation.'
    ],
    followUpReadinessReviewAgenda: [
      'Confirm QL-131 source IDs, passing statuses, correct source outcome and recomputed gate counts.',
      'Inspect public/synthetic-only packet, handoff questions and operator prerequisites without transfer.',
      'Review future owner authority, access control, privacy, retention and consent prerequisites without capturing choices.',
      'Reject any accept/reject/defer/revise, signature, consent or persistent state in the review UI.',
      'Check strict private-data field exclusions and validated local fallback behaviors.',
      'Confirm no database/API/browser writes, live Phone/SMS, DTMF, callbacks, recording, AI sends or pilot.',
      'Forward only a synthetic/public follow-up planning proposal if all eight review gates pass.'
    ],
    pendingOwnerReadinessReviewApprovals: [
      'No owner decision, approval, rejection, deferral, revision, signature or consent was requested or recorded.',
      'Future owner identities, reviewer roles, access and privacy/retention requirements require separate authorization.',
      'Any ledger schema, Supabase/API/browser persistence and audit trail implementation remains unapproved.',
      'Provider callbacks, Phone/SMS, DTMF, recording, AI sending and live pilot are not authorized.',
      'Passing QL-132 review cannot be treated as real owner acceptance, implementation permission or launch approval.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-132 is synthetic/public readiness decision REVIEW only and never captures or grants owner approval.',
      'QL-132 adds no schema, Supabase, API, Worker, browser, audit, archive or evidence-ledger write.',
      'QL-132 does not enable Phone/SMS, provider callbacks, recording, AI sending or live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop if any QL-131 gate is missing, duplicate, nonpassing or inconsistent with outcome or summary.',
      'Stop if a review is interpreted as real owner consent, approval, signature or implementation permission.',
      'Stop if any private provider/customer data, persistence path or live communication/AI send is introduced.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-132 is DISPLAY-ONLY review of QL-131 follow-up readiness decision. Passing only permits independently scoped future read-only follow-up planning. No owner decision, consent, schema/ledger/API/browser/Supabase write, live Phone/SMS, recording, provider callback, AI delivery or pilot is authorized.',
    nextQueuedBuild: 'QL-133 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review Follow-Up Planning (proposed; confirm against roadmap)',
    generatedAt: new Date().toISOString()
  };
}
