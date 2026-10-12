import type { Ql094EvidenceStatus } from './ql094SafeReadReviewEvidence';
import type { Ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan } from './ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan';

export type Ql100EvidenceLedgerResolutionReviewItem = {
  id: string;
  label: string;
  status: Ql094EvidenceStatus;
  reviewFinding: string;
  operatorDecision: string;
  evidenceBoundary: string;
};

export type Ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview = {
  build: 'QL-100';
  title: string;
  reviewedBuild: 'QL-099';
  reviewMode: 'display_only_resolution_review';
  reviewOutcome: 'ready_for_persistence_plan' | 'resolution_review_required';
  ledgerWriteStatus: Ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan['ledgerWriteStatus'];
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: Ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan['rowSummary'];
  resolutionSummary: Ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan['resolutionSummary'];
  reviewSummary: {
    passed: number;
    review: number;
    blocked: number;
  };
  reviewItems: readonly Ql100EvidenceLedgerResolutionReviewItem[];
  approvedProofFields: readonly string[];
  rejectedPrivateFields: readonly string[];
  deferredWriteRequirements: readonly string[];
  retainedBoundaries: readonly string[];
  reviewWarning: string;
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

function statusWhen(condition: boolean): Ql094EvidenceStatus {
  return condition ? 'pass' : 'review';
}

function summarizeReviewItems(items: readonly Ql100EvidenceLedgerResolutionReviewItem[]) {
  return items.reduce(
    (summary, item) => ({
      passed: summary.passed + (item.status === 'pass' ? 1 : 0),
      review: summary.review + (item.status === 'review' ? 1 : 0),
      blocked: summary.blocked + (item.status === 'blocked' ? 1 : 0)
    }),
    { passed: 0, review: 0, blocked: 0 }
  );
}

export function buildQl100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview(
  resolutionPlan: Ql099SafeReadOperatorAcceptanceEvidenceLedgerResolutionPlan
): Ql100SafeReadOperatorAcceptanceEvidenceLedgerResolutionReview {
  const reviewedQ099 = resolutionPlan.build === 'QL-099';
  const planIsDisplayOnly =
    resolutionPlan.resolutionMode === 'display_only_resolution_plan' && resolutionPlan.ledgerWriteStatus === 'not_implemented';
  const noResolutionBlocks = resolutionPlan.resolutionSummary.blocked === 0;
  const noResolutionReviews = resolutionPlan.resolutionSummary.review === 0;
  const approvedFieldsRemainBounded =
    resolutionPlan.approvedProofFields.length >= 10 &&
    resolutionPlan.approvedProofFields.every((field) => !resolutionPlan.rejectedPrivateFields.includes(field));
  const privateFieldsRemainRejected = resolutionPlan.rejectedPrivateFields.length >= 8;
  const deferredWriteGateIsExplicit = resolutionPlan.deferredWriteRequirements.length >= 4;
  const retainedBoundariesAreExplicit = resolutionPlan.retainedBoundaries.length >= 4 && resolutionPlan.blockedRuntime.length >= 4;
  const safeReadCountsRemainVisible = resolutionPlan.rowSummary.conversationRows > 0 && resolutionPlan.rowSummary.systemStatusRows > 0;

  const reviewItems: readonly Ql100EvidenceLedgerResolutionReviewItem[] = [
    {
      id: 'ql100-review-resolution-plan-mode',
      label: 'QL-099 resolution plan remains display-only',
      status: statusWhen(reviewedQ099 && planIsDisplayOnly),
      reviewFinding: `QL-099 mode is ${resolutionPlan.resolutionMode} and write status is ${resolutionPlan.ledgerWriteStatus}.`,
      operatorDecision: 'Confirm QL-099 resolved the evidence-ledger questions without creating persistence or runtime enablement.',
      evidenceBoundary: 'QL-100 reviews QL-099 plan outputs only; it does not create tables, submit acceptance, or store ledger rows.'
    },
    {
      id: 'ql100-review-resolution-items',
      label: 'Resolution items are closed enough for the next planning step',
      status: statusWhen(noResolutionBlocks && noResolutionReviews),
      reviewFinding: `${resolutionPlan.resolutionSummary.passed} resolution item(s) passed, ${resolutionPlan.resolutionSummary.review} need review, and ${resolutionPlan.resolutionSummary.blocked} are blocked.`,
      operatorDecision: 'Confirm any later persistence planning must start as a separate plan/review build, not as an inherited permission from QL-099 or QL-100.',
      evidenceBoundary: 'Resolution review is a display-only checklist and does not activate browser writes, Supabase mutations, or provider calls.'
    },
    {
      id: 'ql100-review-proof-field-boundary',
      label: 'Approved proof fields stay bounded and private fields stay rejected',
      status: statusWhen(approvedFieldsRemainBounded && privateFieldsRemainRejected),
      reviewFinding: `${resolutionPlan.approvedProofFields.length} approved proof field(s) and ${resolutionPlan.rejectedPrivateFields.length} rejected private field(s) remain separated.`,
      operatorDecision: 'Confirm approved fields are only candidates for a future plan and that private fields remain excluded.',
      evidenceBoundary: 'No private customer/contact/provider payloads, raw rows, recordings, SMS/MMS content, archive payloads, or audit payloads are read or stored.'
    },
    {
      id: 'ql100-review-deferred-write-gate',
      label: 'Deferred write requirements are explicit',
      status: statusWhen(deferredWriteGateIsExplicit),
      reviewFinding: `${resolutionPlan.deferredWriteRequirements.length} deferred write requirement(s) remain attached to the resolution plan.`,
      operatorDecision: 'Confirm persistence cannot begin until a new build restates schema, rollback, retention, owner, and operator approval rules.',
      evidenceBoundary: 'QL-100 does not add a migration, schema, RPC function, insert/update/delete endpoint, local persistence, or storage upload.'
    },
    {
      id: 'ql100-review-runtime-and-safe-read-evidence',
      label: 'Runtime lockouts and safe-read evidence remain visible',
      status: statusWhen(retainedBoundariesAreExplicit && safeReadCountsRemainVisible),
      reviewFinding: `${resolutionPlan.rowSummary.conversationRows} conversation row(s), ${resolutionPlan.rowSummary.systemStatusRows} system status row(s), ${resolutionPlan.retainedBoundaries.length} retained boundary statement(s), and ${resolutionPlan.blockedRuntime.length} blocked runtime statement(s) remain visible.`,
      operatorDecision: 'Confirm the disabled public preview remains safe-read only while surfacing enough evidence for manual operator review.',
      evidenceBoundary: 'Phone/SMS, callbacks, live reads, archives, consent, audit/admin/retention writes, AI generation/send, and live pilot runtime stay disabled.'
    }
  ];

  const reviewSummary = summarizeReviewItems(reviewItems);
  const reviewOutcome = reviewSummary.blocked === 0 && reviewSummary.review === 0 ? 'ready_for_persistence_plan' : 'resolution_review_required';

  return {
    build: 'QL-100',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Resolution Review',
    reviewedBuild: 'QL-099',
    reviewMode: 'display_only_resolution_review',
    reviewOutcome,
    ledgerWriteStatus: resolutionPlan.ledgerWriteStatus,
    selectedBrandLabel: resolutionPlan.selectedBrandLabel,
    sourceLabel: resolutionPlan.sourceLabel,
    rowSummary: resolutionPlan.rowSummary,
    resolutionSummary: resolutionPlan.resolutionSummary,
    reviewSummary,
    reviewItems,
    approvedProofFields: resolutionPlan.approvedProofFields,
    rejectedPrivateFields: resolutionPlan.rejectedPrivateFields,
    deferredWriteRequirements: resolutionPlan.deferredWriteRequirements,
    retainedBoundaries: [
      'QL-100 reviews QL-099 resolution decisions only and does not implement persistence.',
      'Approved proof fields remain future candidates only until a separate persistence plan/review cycle exists.',
      'Rejected private fields remain excluded from public disabled preview evidence and any future bounded ledger.',
      'Manual operator acceptance, schema work, writes, retention rules, and rollback planning remain deferred.'
    ],
    reviewWarning:
      'QL-100 is a display-only resolution review. It does not create a ledger, write Supabase data, store acceptance, send Phone/SMS, call providers, register callbacks, write archives/audits/retention, or run AI delivery paths.',
    blockedRuntime: resolutionPlan.blockedRuntime,
    nextQueuedBuild: 'QL-101 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Plan',
    generatedAt: new Date().toISOString()
  };
}
