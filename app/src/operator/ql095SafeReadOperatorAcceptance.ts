import type { Ql094EvidenceStatus, Ql094SafeReadReviewEvidence } from './ql094SafeReadReviewEvidence';

type Ql095AcceptanceStatus = Ql094EvidenceStatus;

export type Ql095OperatorAcceptanceItem = {
  id: string;
  label: string;
  status: Ql095AcceptanceStatus;
  operatorAction: string;
  acceptanceEvidence: string;
  signOffQuestion: string;
};

export type Ql095SafeReadOperatorAcceptancePlan = {
  build: 'QL-095';
  title: string;
  reviewedBuild: 'QL-094';
  acceptanceMode: 'operator_plan_only';
  readinessStatus: 'ready_for_operator_acceptance' | 'needs_operator_review';
  selectedBrandLabel: string;
  sourceLabel: string;
  rowSummary: {
    conversationRows: number;
    systemStatusRows: number;
    rejectedRows: number;
    runtimeLockouts: number;
  };
  acceptanceItems: readonly Ql095OperatorAcceptanceItem[];
  signOffRequired: true;
  operatorWarning: string;
  dataBoundaries: readonly string[];
  blockedRuntime: readonly string[];
  nextQueuedBuild: string;
  generatedAt: string;
};

const brandLabels: Record<Ql094SafeReadReviewEvidence['selectedBrandId'], string> = {
  rosiedazzlers: 'Rosie Dazzlers',
  devilndove: 'Devil n Dove'
};

function statusWhen(condition: boolean): Ql095AcceptanceStatus {
  return condition ? 'pass' : 'review';
}

export function buildQl095SafeReadOperatorAcceptancePlan(
  evidence: Ql094SafeReadReviewEvidence
): Ql095SafeReadOperatorAcceptancePlan {
  const hasDisplayRows = evidence.rowCounts.conversationRows > 0 && evidence.rowCounts.systemStatusRows > 0;
  const hasRuntimeLockouts = evidence.rowCounts.runtimeLockouts >= 4;
  const sourceReviewed = evidence.evidenceItems.every((item) => item.status !== 'blocked');
  const readTargetsReviewed = evidence.approvedReadTargets.length === 2;
  const blockedRuntimeReviewed = evidence.blockedRuntime.length >= 4;
  const readinessStatus = hasDisplayRows && hasRuntimeLockouts && sourceReviewed && readTargetsReviewed && blockedRuntimeReviewed
    ? 'ready_for_operator_acceptance'
    : 'needs_operator_review';

  const acceptanceItems: readonly Ql095OperatorAcceptanceItem[] = [
    {
      id: 'ql095-open-and-select-brand',
      label: 'Open preview and select the intended brand',
      status: statusWhen(hasDisplayRows),
      operatorAction: 'Open the Safe Reads panel, choose Rosie Dazzlers or Devil n Dove, and confirm the visible rows match the selected brand.',
      acceptanceEvidence: `${evidence.rowCounts.conversationRows} conversation card(s) and ${evidence.rowCounts.systemStatusRows} system status row(s) are visible for the current safe-read result.`,
      signOffQuestion: 'Can the operator see the selected brand context without seeing any live customer/contact/provider payload?'
    },
    {
      id: 'ql095-read-source-review',
      label: 'Confirm the safe-read source label',
      status: statusWhen(sourceReviewed),
      operatorAction: 'Review the active source label, source mode, fallback notice, and QL-094 evidence items before treating the preview as accepted.',
      acceptanceEvidence: `Active source: ${evidence.activeSourceLabel}; read-only client status: ${evidence.readOnlyClientStatus.replaceAll('_', ' ')}.`,
      signOffQuestion: 'Does the operator understand whether this run is local fallback, validated synthetic Supabase, or mixed fallback?'
    },
    {
      id: 'ql095-rejected-row-review',
      label: 'Review rejected-row diagnostics without raw payloads',
      status: 'pass',
      operatorAction: 'Check the rejected-row count and bounded reasons. Do not ask the browser to reveal, export, or persist raw rejected payloads.',
      acceptanceEvidence: `${evidence.rowCounts.rejectedRows} rejected row diagnostic(s) are summarized by count and reason only.`,
      signOffQuestion: 'Are rejected rows explained well enough for acceptance without exposing private data?'
    },
    {
      id: 'ql095-runtime-lockout-review',
      label: 'Confirm runtime lockouts remain visible',
      status: statusWhen(hasRuntimeLockouts && blockedRuntimeReviewed),
      operatorAction: 'Read the blocked runtime list and confirm Phone/SMS, AI, live callbacks, writes, archive, consent, audit, and retention paths remain disabled.',
      acceptanceEvidence: `${evidence.rowCounts.runtimeLockouts} lockout statement(s) remain attached, with ${evidence.blockedRuntime.length} blocked runtime category statement(s).`,
      signOffQuestion: 'Can the operator clearly see that QL-095 is not a live communications release?'
    },
    {
      id: 'ql095-manual-signoff-record',
      label: 'Record manual operator acceptance outside the browser preview',
      status: 'pass',
      operatorAction: 'Use this plan as the checklist for a human acceptance note. The preview does not create, store, or submit acceptance records.',
      acceptanceEvidence: 'QL-095 provides acceptance prompts and evidence text only; it does not add a submit button, database write, callback, or audit insert.',
      signOffQuestion: 'Has the operator recorded acceptance in the normal project notes before any future live-read or live-send build is considered?'
    }
  ];

  return {
    build: 'QL-095',
    title: 'Public Disabled Preview Safe Read Operator Acceptance Plan',
    reviewedBuild: 'QL-094',
    acceptanceMode: 'operator_plan_only',
    readinessStatus,
    selectedBrandLabel: brandLabels[evidence.selectedBrandId],
    sourceLabel: evidence.activeSourceLabel,
    rowSummary: {
      conversationRows: evidence.rowCounts.conversationRows,
      systemStatusRows: evidence.rowCounts.systemStatusRows,
      rejectedRows: evidence.rowCounts.rejectedRows,
      runtimeLockouts: evidence.rowCounts.runtimeLockouts
    },
    acceptanceItems,
    signOffRequired: true,
    operatorWarning:
      'QL-095 is an acceptance plan only. It must not be treated as approval to enable live customer reads, browser writes, Phone/SMS callbacks, AI send, or live pilot runtime.',
    dataBoundaries: [
      'Operator acceptance uses QL-094 evidence: counts, labels, fallback text, rejected-row summaries, approved target names, and lockout statements only.',
      'Approved browser read targets remain public.ql_public_synthetic_conversations and public.ql_public_system_status.',
      'The browser preview does not store acceptance, send messages, call providers, create callbacks, or write audits.'
    ],
    blockedRuntime: evidence.blockedRuntime,
    nextQueuedBuild: 'QL-096 — Public Disabled Preview Safe Read Operator Acceptance Review',
    generatedAt: new Date().toISOString()
  };
}
