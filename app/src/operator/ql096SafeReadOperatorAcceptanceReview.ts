import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql095SafeReadOperatorAcceptancePlan } from './ql095SafeReadOperatorAcceptance';

export type Ql096OperatorAcceptanceReviewCheckpoint = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  reviewFinding: string;
  operatorDecision: string;
  evidenceBoundary: string;
};

export type Ql096SafeReadOperatorAcceptanceReview = {
  build: 'QL-096';
  title: string;
  reviewedBuild: 'QL-095';
  reviewMode: 'display_only_operator_review';
  reviewOutcome: 'ready_for_manual_acceptance_record' | 'operator_review_required';
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql095SafeReadOperatorAcceptancePlan['rowSummary'];
  checkpointSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  reviewCheckpoints: readonly Ql096OperatorAcceptanceReviewCheckpoint[];
  signOffRequired: true;
  reviewWarning: string;
  retainedBoundaries: readonly string[];
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function summarizeCheckpoints(checkpoints: readonly Ql096OperatorAcceptanceReviewCheckpoint[]) {
  return checkpoints.reduce(
    (summary, checkpoint) => ({
      passed: summary.passed + (checkpoint.status === 'pass' ? 1 : 0),
      review: summary.review + (checkpoint.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (checkpoint.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

export function buildQl096SafeReadOperatorAcceptanceReview(
  acceptancePlan: Ql095SafeReadOperatorAcceptancePlan
): Ql096SafeReadOperatorAcceptanceReview {
  const allAcceptanceItemsPresent = acceptancePlan.acceptanceItems.length >= 5;
  const allAcceptanceItemsUnblocked = acceptancePlan.acceptanceItems.every((item) => item.status !== 'blocked');
  const hasRowsForReview =
    acceptancePlan.rowSummary.conversationRows > 0 && acceptancePlan.rowSummary.systemStatusRows > 0;
  const hasRejectedRowBoundary = acceptancePlan.rowSummary.rejectedRows >= 0;
  const hasRuntimeLockouts =
    acceptancePlan.rowSummary.runtimeLockouts >= 4 && acceptancePlan.blockedRuntime.length >= 4;
  const dataBoundariesPresent = acceptancePlan.dataBoundaries.length >= 3;
  const manualOnlyMode = acceptancePlan.acceptanceMode === 'operator_plan_only' && acceptancePlan.signOffRequired;

  const reviewCheckpoints: readonly Ql096OperatorAcceptanceReviewCheckpoint[] = [
    {
      id: 'ql096-reviewed-ql095-plan',
      label: 'QL-095 acceptance plan is available for review',
      status: statusWhen(acceptancePlan.build === 'QL-095' && allAcceptanceItemsPresent),
      reviewFinding: `${acceptancePlan.acceptanceItems.length} operator acceptance item(s) are present for ${acceptancePlan.selectedBrandLabel}.`,
      operatorDecision:
        'Confirm the QL-095 checklist is visible, understandable, and complete enough for a manual acceptance note.',
      evidenceBoundary:
        'The review reads QL-095 checklist labels, status flags, prompts, row counts, and warnings only.'
    },
    {
      id: 'ql096-source-and-row-evidence-reviewed',
      label: 'Safe-read source and row evidence can be reviewed without private payloads',
      status: statusWhen(hasRowsForReview && hasRejectedRowBoundary),
      reviewFinding: `${acceptancePlan.rowSummary.conversationRows} conversation row(s), ${acceptancePlan.rowSummary.systemStatusRows} system status row(s), and ${acceptancePlan.rowSummary.rejectedRows} rejected-row diagnostic(s) are summarized.`,
      operatorDecision:
        'Confirm the operator can decide whether the safe-read view is acceptable without asking for raw rejected rows or live customer/provider data.',
      evidenceBoundary:
        'Only row counts, approved public target names, fallback/source labels, and bounded rejected-row reasons may be reviewed.'
    },
    {
      id: 'ql096-runtime-lockout-reviewed',
      label: 'Runtime lockout evidence remains intact',
      status: statusWhen(hasRuntimeLockouts),
      reviewFinding: `${acceptancePlan.rowSummary.runtimeLockouts} visible lockout statement(s) and ${acceptancePlan.blockedRuntime.length} blocked runtime category statement(s) remain attached.`,
      operatorDecision:
        'Confirm no live-read, browser-write, Phone/SMS, callback, archive, consent, audit, retention, AI-send, or live pilot runtime has been enabled.',
      evidenceBoundary:
        'Runtime review is text-only. It must not call providers, send messages, create callbacks, or write to Supabase.'
    },
    {
      id: 'ql096-manual-signoff-boundary-reviewed',
      label: 'Manual sign-off boundary is explicit',
      status: statusWhen(manualOnlyMode && dataBoundariesPresent),
      reviewFinding:
        'QL-095 remains operator-plan-only and QL-096 reviews that plan without adding acceptance persistence.',
      operatorDecision:
        'Record any acceptance outside the browser preview in the normal project notes; do not add a browser submit flow in this build.',
      evidenceBoundary:
        'The browser preview still has no acceptance submit button, database insert, RPC mutation, storage upload, audit insert, or webhook.'
    },
    {
      id: 'ql096-next-gate-reviewed',
      label: 'Next-build gate remains constrained',
      status: statusWhen(allAcceptanceItemsUnblocked && hasRuntimeLockouts),
      reviewFinding:
        'The review can advance only to a future evidence-led plan; it does not authorize live communications or live customer/provider reads.',
      operatorDecision:
        'Use QL-096 as the final display-only review before planning a separate evidence ledger design.',
      evidenceBoundary:
        'Any future acceptance ledger must start as a plan/review build before any write path is considered.'
    }
  ];

  const checkpointSummary = summarizeCheckpoints(reviewCheckpoints);
  const reviewOutcome =
    checkpointSummary.blocked === 0 && checkpointSummary.review === 0
      ? 'ready_for_manual_acceptance_record'
      : 'operator_review_required';

  return {
    build: 'QL-096',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Review',
    reviewedBuild: 'QL-095',
    reviewMode: 'display_only_operator_review',
    reviewOutcome,
    selectedBrandLabel: acceptancePlan.selectedBrandLabel,
    sourceLabel: acceptancePlan.sourceLabel,
    rowSummary: acceptancePlan.rowSummary,
    checkpointSummary,
    reviewCheckpoints,
    signOffRequired: true,
    reviewWarning:
      'QL-096 is a display-only review of the QL-095 acceptance plan. It does not create approval records, enable live data, write to Supabase, send Phone/SMS messages, or run AI delivery paths.',
    retainedBoundaries: [
      'QL-096 reviews QL-095 checklist text, row counts, source labels, approved target names, warnings, and runtime lockouts only.',
      'Approved browser read targets remain public.ql_public_synthetic_conversations and public.ql_public_system_status.',
      'Manual acceptance is still recorded outside the browser preview until a separate evidence-led write plan is designed and reviewed.',
      'No customer/contact/provider payloads, live conversations, callbacks, recordings, archives, consent, audit, or retention records are exposed or written.'
    ],
    blockedRuntime: acceptancePlan.blockedRuntime,
    nextQueuedBuild: 'QL-097 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Plan',
    generatedAt: new Date().toISOString()
  };
}
