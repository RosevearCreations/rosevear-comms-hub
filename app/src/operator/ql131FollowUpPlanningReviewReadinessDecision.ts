import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql130HandoffReadinessFollowUpPlanningReview } from './ql130HandoffReadinessFollowUpPlanningReview';

type Prior = Ql130HandoffReadinessFollowUpPlanningReview;
type ReadinessItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  readinessFinding: string;
  readinessDisposition: string;
  noWriteBoundary: string;
};

export type Ql131FollowUpPlanningReviewReadinessDecision =
  Omit<Prior, 'build' | 'title' | 'reviewedBuild' | 'ownerDecisionStatus' | 'nextQueuedBuild'> & {
    build: 'QL-131';
    title: string;
    reviewedBuild: 'QL-130';
    followUpReadinessMode: 'display_only_follow_up_planning_review_readiness_decision';
    followUpReadinessOutcome: 'ready_for_separate_follow_up_readiness_review_only' | 'follow_up_readiness_revision_required';
    ownerDecisionStatus: 'follow_up_readiness_only_owner_not_approved';
    followUpReadinessSummary: { passed: number; review: number; blocked: number };
    followUpReadinessItems: readonly ReadinessItem[];
    followUpReadinessScope: readonly string[];
    followUpReadinessAgenda: readonly string[];
    outstandingReadinessApprovals: readonly string[];
    nextQueuedBuild: string;
  };

const expectedQl130Ids = [
  'ql130-source-planning-gate-integrity',
  'ql130-source-planning-outcome-reconciliation',
  'ql130-owner-and-persistence-locks',
  'ql130-review-agenda-and-packet-materials',
  'ql130-no-owner-approval-or-consent',
  'ql130-private-data-isolation',
  'ql130-disabled-live-runtime',
  'ql130-separate-readiness-approval-and-release-gates'
] as const;

const checkStatus = (passes: boolean): Ql094EvidenceStatus => passes ? 'pass' : 'review';

export function buildQl131FollowUpPlanningReviewReadinessDecision(prior: Prior): Ql131FollowUpPlanningReviewReadinessDecision {
  const sourceTotals = prior.followUpPlanningReviewItems.reduce((totals, item) => ({
    passed: totals.passed + Number(item.status === 'pass'),
    review: totals.review + Number(item.status === 'review'),
    blocked: totals.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const uniqueSourceGates =
    prior.build === 'QL-130' &&
    prior.reviewedBuild === 'QL-129' &&
    prior.followUpPlanningReviewItems.length === expectedQl130Ids.length &&
    new Set(prior.followUpPlanningReviewItems.map(item => item.id)).size === expectedQl130Ids.length &&
    expectedQl130Ids.every(id =>
      prior.followUpPlanningReviewItems.some(item => item.id === id && item.status === 'pass')
    );

  const consistentSourceOutcome =
    uniqueSourceGates &&
    prior.followUpPlanningReviewOutcome === 'follow_up_planning_review_ready_for_separate_readiness_decision_only' &&
    sourceTotals.passed === expectedQl130Ids.length &&
    sourceTotals.review === 0 &&
    sourceTotals.blocked === 0 &&
    prior.followUpPlanningReviewSummary.passed === sourceTotals.passed &&
    prior.followUpPlanningReviewSummary.review === sourceTotals.review &&
    prior.followUpPlanningReviewSummary.blocked === sourceTotals.blocked;

  const ownerAndWriteBoundaries =
    prior.ownerDecisionStatus === 'follow_up_planning_review_only_owner_not_approved' &&
    prior.implementationPermission === 'not_granted' &&
    prior.implementationCandidateStatus === 'not_approved' &&
    prior.ledgerWriteStatus === 'planned_not_implemented' &&
    prior.candidateSchemaStatus === 'drafted_not_implemented' &&
    prior.endpointImplementationStatus === 'not_implemented' &&
    prior.browserWriteStatus === 'disabled';

  const packetAndAgendaAvailable =
    prior.followUpPlanningReviewScope.length >= 5 &&
    prior.followUpPlanningReviewAgenda.length >= 7 &&
    prior.ownerDecisionPacketForReview.length >= 5 &&
    prior.ownerDecisionQuestionsForReview.length >= 5 &&
    prior.handoffRequirements.length >= 5 &&
    prior.verificationPlanReview.length >= 7;

  const decisionsRemainDeferred =
    prior.deferredPlanningReviewApprovals.length >= 5 &&
    prior.captureStillNotAuthorized.length >= 5 &&
    prior.ownerDecisionApprovalStillRequired.length >= 5 &&
    prior.deferredOwnerDecisions.length >= 5 &&
    prior.deferredPlanningReviewApprovals.some(text => text.includes('No owner accept')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-130 is a public/synthetic follow-up PLANNING REVIEW only'));

  const safeFieldIsolation =
    prior.candidateLedgerFields.length >= 10 &&
    prior.rejectedPrivateFields.length >= 8 &&
    new Set(prior.candidateLedgerFields).size === prior.candidateLedgerFields.length &&
    prior.candidateLedgerFields.every(field => !prior.rejectedPrivateFields.includes(field));

  const noWritesOrLiveChannels =
    prior.retainedNoWriteRuntime.length >= 4 &&
    prior.implementationStillProhibited.length >= 5 &&
    prior.retainedBoundaries.some(text => text.includes('QL-130 adds no schema')) &&
    prior.retainedBoundaries.some(text => text.includes('QL-130 does not enable Phone/SMS'));

  const independentNextReview =
    prior.futureImplementationPrerequisites.length >= 5 &&
    prior.stopConditions.length >= 10 &&
    prior.verificationPlanReview.length >= 7 &&
    prior.followUpPlanningReviewAgenda.some(text => text.includes('separate owner-unauthorized review readiness decision')) &&
    prior.handoffRequirements.some(text => text.includes('Exact PR-head CI success'));

  const followUpReadinessItems: readonly ReadinessItem[] = [
    {
      id: 'ql131-ql130-source-gate-integrity',
      label: 'All eight expected QL-130 planning review gates exist uniquely and pass',
      status: checkStatus(uniqueSourceGates),
      readinessFinding: 'Expected eight QL-130 gates; observed ' + prior.followUpPlanningReviewItems.length + '.',
      readinessDisposition: 'Any missing, repeated or nonpassing gate requires revision instead of readiness.',
      noWriteBoundary: 'No gate outcomes are written to any database or owner ledger.'
    },
    {
      id: 'ql131-ql130-outcome-and-summary',
      label: 'QL-130 outcome and recomputed pass, review and blocked totals reconcile',
      status: checkStatus(consistentSourceOutcome),
      readinessFinding: sourceTotals.passed + ' passed; ' + sourceTotals.review + ' review; ' + sourceTotals.blocked + ' blocked.',
      readinessDisposition: 'Passing merely qualifies for an independently reviewed follow-up readiness packet.',
      noWriteBoundary: 'No inferred owner acceptance, signature or stored evidence.'
    },
    {
      id: 'ql131-implementation-and-ledger-locks',
      label: 'Owner approval, schema, API, browser, Supabase and evidence persistence stay disabled',
      status: checkStatus(ownerAndWriteBoundaries),
      readinessFinding: 'Owner ' + prior.ownerDecisionStatus + '; implementation ' + prior.implementationPermission + '; browser ' + prior.browserWriteStatus + '.',
      readinessDisposition: 'A readiness decision cannot grant write, consent or implementation permission.',
      noWriteBoundary: 'No migration, Worker/API, database, browser, audit, archive or ledger write.'
    },
    {
      id: 'ql131-readonly-packet-and-review-agenda',
      label: 'Safe synthetic/public packet questions and follow-up review agenda are available',
      status: checkStatus(packetAndAgendaAvailable),
      readinessFinding: prior.followUpPlanningReviewAgenda.length + ' review agenda items and ' + prior.handoffRequirements.length + ' handoff prerequisites.',
      readinessDisposition: 'Keep proposed review materials read-only, without real reviewer assignment or transfer.',
      noWriteBoundary: 'No owner identity, submission, external packet send or retention.'
    },
    {
      id: 'ql131-owner-choice-and-consent-blocked',
      label: 'Owner decisions, signatures and consent remain uncollected and separately authorized',
      status: checkStatus(decisionsRemainDeferred),
      readinessFinding: prior.deferredPlanningReviewApprovals.length + ' approval cautions and ' + prior.captureStillNotAuthorized.length + ' capture bans.',
      readinessDisposition: 'Later authority, privacy, access and retention decisions remain independent.',
      noWriteBoundary: 'No accept/reject/defer/revise, consent, decision history or evidence record.'
    },
    {
      id: 'ql131-sensitive-field-exclusions',
      label: 'Synthetic planning field set remains disjoint from excluded private/provider fields',
      status: checkStatus(safeFieldIsolation),
      readinessFinding: prior.candidateLedgerFields.length + ' proposed planning fields and ' + prior.rejectedPrivateFields.length + ' excluded private fields.',
      readinessDisposition: 'Keep validated synthetic/public safe reads or existing local fallback only.',
      noWriteBoundary: 'No real customer, phone, SMS, provider credential, recording or AI content.'
    },
    {
      id: 'ql131-live-runtime-disabled',
      label: 'Live Phone/SMS, DTMF, callback, recording, provider, AI and pilot paths remain disabled',
      status: checkStatus(noWritesOrLiveChannels),
      readinessFinding: prior.retainedNoWriteRuntime.length + ' no-write runtime controls and ' + prior.implementationStillProhibited.length + ' prohibited implementations.',
      readinessDisposition: 'Review readiness without activating a live communication channel.',
      noWriteBoundary: 'No call, message, provider callback, recording, AI delivery or pilot.'
    },
    {
      id: 'ql131-independent-follow-up-review-and-release',
      label: 'Any next review, owner approval and exact-final-main CI/deployment checks remain independent',
      status: checkStatus(independentNextReview),
      readinessFinding: prior.futureImplementationPrerequisites.length + ' implementation prerequisites and ' + prior.stopConditions.length + ' stop conditions.',
      readinessDisposition: 'A passing QL-131 is eligible only for QL-132 review; no owner or launch approval.',
      noWriteBoundary: 'No implementation entitlement or deployment success is inferred from this review.'
    }
  ];

  const followUpReadinessSummary = followUpReadinessItems.reduce((summary, item) => ({
    passed: summary.passed + Number(item.status === 'pass'),
    review: summary.review + Number(item.status === 'review'),
    blocked: summary.blocked + Number(item.status === 'blocked')
  }), { passed: 0, review: 0, blocked: 0 });

  const followUpReadinessOutcome =
    followUpReadinessSummary.review === 0 && followUpReadinessSummary.blocked === 0
      ? 'ready_for_separate_follow_up_readiness_review_only'
      : 'follow_up_readiness_revision_required';

  return {
    ...prior,
    build: 'QL-131',
    title: 'Handoff Readiness Follow-Up Planning Review Readiness Decision',
    reviewedBuild: 'QL-130',
    followUpReadinessMode: 'display_only_follow_up_planning_review_readiness_decision',
    followUpReadinessOutcome,
    followUpReadinessSummary,
    followUpReadinessItems,
    ownerDecisionStatus: 'follow_up_readiness_only_owner_not_approved',
    implementationPermission: 'not_granted',
    followUpReadinessScope: [
      'Recompute and reconcile eight QL-130 gates, status totals and source outcome, failing closed.',
      'Determine only whether a separate synthetic/public follow-up readiness review is appropriate.',
      'Keep all owner acceptance, signature, consent, schema, database, API, browser and ledger decisions unapproved.',
      'Prohibit Phone/SMS, DTMF, provider callbacks, recording, AI sending and live pilot activation.',
      'Preserve separate owner authority, privacy, retention and exact-final-main release verification.'
    ],
    followUpReadinessAgenda: [
      'Verify QL-130 source gate identities, pass statuses and exact totals.',
      'Recheck public/synthetic-only packet materials, open questions and planning prerequisites.',
      'Inventory future independent owner approval, privacy, security-role and consent requirements.',
      'Keep all accept/reject/defer/revise, signature and evidence capture functions unavailable.',
      'Reassert no database, schema, API, Worker, browser, Supabase, audit or ledger writes.',
      'Reconfirm Phone/SMS, provider callbacks, DTMF, recordings, AI sending and pilots disabled.',
      'Submit only a non-interactive proposal for later QL-132 independent readiness review.'
    ],
    outstandingReadinessApprovals: [
      'No owner approval, denial, signature, consent or decision has been requested or recorded.',
      'Any real handoff needs separately authorized reviewer identity, roles and privacy/retention policy.',
      'Evidence ledger persistence, migrations, browser submissions and API writes remain unapproved.',
      'Live Phone/SMS, provider callbacks, recordings, AI sends and pilots are not permitted.',
      'Release GREEN indicates verified delivery checks only; it is not owner or runtime authorization.'
    ],
    retainedBoundaries: [
      ...prior.retainedBoundaries,
      'QL-131 is a display-only review READINESS DECISION, not a real owner choice or consent.',
      'QL-131 performs no database/schema/API/Worker/Supabase/browser/ledger persistence or audit writes.',
      'QL-131 does not enable Phone/SMS, provider callbacks, recording, AI delivery or a live pilot.'
    ],
    stopConditions: [
      ...prior.stopConditions,
      'Stop for any QL-130 gate absent, duplicated, nonpassing or inconsistent with outcome and summary.',
      'Stop if follow-up readiness is treated as an actual owner decision, consent or implementation permission.',
      'Stop for any private provider/customer data, API/database/browser write, call, SMS or AI delivery.'
    ],
    ownerDecisionPacketReadinessWarning:
      'QL-131 is DISPLAY-ONLY readiness determination after QL-130 follow-up planning review. A passing result permits a separate readiness REVIEW only. No owner decision, consent, implementation, evidence ledger persistence, database/API/browser writes, Phone/SMS, provider callbacks, recordings, AI sending or pilot is authorized.',
    nextQueuedBuild: 'QL-132 — Handoff Readiness Follow-Up Planning Review Readiness Decision Review (proposed; confirm against roadmap)',
    generatedAt: new Date().toISOString()
  };
}
