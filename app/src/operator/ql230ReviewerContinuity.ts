import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql229CompanyReassignment, type Ql229Ledger, type Ql229Sources } from './ql229ReassignmentAudit';

export const QL230_RELEASE = 'ql230-four-company-reassignment-evidence-follow-up-recurrence-independent-reviewer-decision-aging-conditional-hold-continuity-audit-disabled-preview-v1';
export const QL230_CHECKS = [
  { id: 'FOLLOWUP_RECURRENCE', title: 'Reassignment evidence follow-up recurrence', detail: 'Review fictional repeats and historical follow-up episodes.' },
  { id: 'REVIEWER_DECISION_AGING', title: 'Independent reviewer decision aging', detail: 'Inspect unsent reviewer decision drafts, due cycles and separate-reviewer referrals.' },
  { id: 'HOLD_CONTINUITY', title: 'Conditional release hold continuity', detail: 'Recheck all twelve actual QL-181 pilot prerequisites remain HELD_UNVERIFIED.' }
] as const;
export type Ql230Check = typeof QL230_CHECKS[number]['id'];
export type Ql230Outcome = 'REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED' | 'SIMULATED_FOLLOWUP_MATCH_UNVERIFIED' |
  'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED';
export type Ql230ReviewerDecision = 'CONTINUE_REVIEW_HELD_DRAFT' | 'REQUEST_REVIEW_EVIDENCE_DRAFT' |
  'REFER_SEPARATE_REVIEWER_DRAFT';
export type Ql230GapRecord = Readonly<{
  outcome: Ql230Outcome;
  decision: Ql230ReviewerDecision;
  note: string;
  lastCycle: number;
  recurrenceEvents: number;
  lastRecurrenceCycle: number | null;
  overdueReviewerDecisions: number;
}>;
export type Ql230Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql230GapRecord>>;
  checks: Partial<Record<Ql230Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'reassignment_recurrence_reviewer_decision_draft' | 'conditional_hold_continuity_audit_prepared';
}>;
export type Ql230Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql230Case>>>>;
export type Ql230Sources = Ql229Sources & Readonly<{ reassignmentAudit: Ql229Ledger }>;
export type Ql230SourceStatus = 'AWAITING_PREPARED_QL229' | 'SOURCE_CURRENT' |
  'QL229_REASSIGNMENT_REVISED' | 'UPSTREAM_STALE';

function fictionalRevision(value: unknown): string {
  // Not a cryptographic signature or real independent reviewer evidence receipt.
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-reviewer-${(hash >>> 0).toString(16)}`;
}
type UpstreamCase = ReturnType<typeof ql229CompanyReassignment>['cases'][number];
function sourceTokenFor(item: UpstreamCase): string {
  return fictionalRevision({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, sourceStatus: item.sourceStatus, checks: item.record?.checks,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      reassignmentOutcome: gap.reassignmentOutcome, reassignmentFollowUp: gap.reassignmentFollowUp,
      independentDue: gap.independentDue, reassignmentConflicts: gap.reassignmentConflicts,
      overdueEpisodes: gap.overdueEpisodes, note: item.record?.gaps[gap.category]?.note })) });
}

export function ql230CompanyReview(sources: Ql230Sources, ledger: Ql230Ledger, company: OrganizationId) {
  const upstream = ql229CompanyReassignment(sources, sources.reassignmentAudit, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql230SourceStatus = !record ? 'AWAITING_PREPARED_QL229' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== sourceTokenFor(item) ? 'QL229_REASSIGNMENT_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const outcome = current?.outcome ?? 'NOT_RECONCILED' as const;
      const decision = current?.decision ?? 'NOT_DRAFTED' as const;
      const separateReviewDue = gap.independentDue || gap.priority === 'P0' || gap.recheckMissing ||
        gap.reassignmentConflicts > 0 || gap.overdueEpisodes > 0 ||
        outcome === 'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED' ||
        (current?.recurrenceEvents ?? 0) > 0 || (current?.overdueReviewerDecisions ?? 0) > 0;
      return { ...gap, followupOutcome: outcome, reviewerDecision: decision,
        reviewerDecisionAge: age, nextDueCycle: current ? current.lastCycle + 3 : null,
        dueSoon: age !== null && age === 2, overdue: age !== null && age >= 3,
        separateReviewDue, separateReviewMissing: separateReviewDue && decision !== 'REFER_SEPARATE_REVIEWER_DRAFT',
        followupRecurrences: current?.recurrenceEvents ?? 0,
        overdueReviewerDecisions: current?.overdueReviewerDecisions ?? 0,
        actualReviewerDecision: false as const, actualFollowupVerified: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => gap.followupOutcome === 'NOT_RECONCILED').length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const separateReviewsDue = active ? gaps.filter((gap) => gap.separateReviewMissing).length : 0;
    const recurring = active ? gaps.filter((gap) => gap.followupOutcome === 'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED').length : 0;
    const recurrenceEvents = active ? gaps.reduce((sum, gap) => sum + gap.followupRecurrences, 0) : 0;
    const overdueReviewerDecisions = active ? gaps.reduce((sum, gap) => sum + gap.overdueReviewerDecisions, 0) : 0;
    const checksComplete = active && QL230_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && unreviewed === 0 && overdue === 0 &&
      separateReviewsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      separateReviewsDue, recurring, recurrenceEvents, overdueReviewerDecisions, checksComplete,
      readyForLocalAudit, prepared: readyForLocalAudit && record?.phase === 'conditional_hold_continuity_audit_prepared',
      actualOwnerAuthorization: false as const, actualIndependentReview: false as const,
      actualEvidenceVerified: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) =>
    !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    unreviewed: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.unreviewed : 0), 0),
    dueSoon: cases.reduce((sum, item) => sum + item.dueSoon, 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    separateReviewsDue: cases.reduce((sum, item) => sum + item.separateReviewsDue, 0),
    recurring: cases.reduce((sum, item) => sum + item.recurring, 0),
    recurrenceEvents: cases.reduce((sum, item) => sum + item.recurrenceEvents, 0),
    overdueReviewerDecisions: cases.reduce((sum, item) => sum + item.overdueReviewerDecisions, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql230Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql230Case): Ql230Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

export function beginQl230ReviewerReview(sources: Ql230Sources, ledger: Ql230Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql230Ledger {
  const item = ql229CompanyReassignment(sources, sources.reassignmentAudit, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const sourceToken = sourceTokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === sourceToken) return ledger;
  return withCase(ledger, company, scenario, { sourceToken, cycle: 0, gaps: {}, checks: {},
    phase: 'reassignment_recurrence_reviewer_decision_draft' });
}

/** Fictional separate-reviewer decisions never constitute contact, approval or actual release authorization. */
export function recordQl230Decision(sources: Ql230Sources, ledger: Ql230Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  outcome: Ql230Outcome, decision: Ql230ReviewerDecision, note: string): Ql230Ledger {
  const item = ql230CompanyReview(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reassignment_recurrence_reviewer_decision_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['REASSIGNMENT_FOLLOWUP_OPEN_UNVERIFIED', 'SIMULATED_FOLLOWUP_MATCH_UNVERIFIED', 'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED'].includes(outcome) ||
      !['CONTINUE_REVIEW_HELD_DRAFT', 'REQUEST_REVIEW_EVIDENCE_DRAFT', 'REFER_SEPARATE_REVIEWER_DRAFT'].includes(decision) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && decision !== 'REFER_SEPARATE_REVIEWER_DRAFT') return ledger;
  const newRecurrence = outcome === 'SIMULATED_RECURRENT_FOLLOWUP_UNVERIFIED' &&
    previous?.lastRecurrenceCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record, gaps: { ...item.record.gaps,
    [category]: { outcome, decision, note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      recurrenceEvents: (previous?.recurrenceEvents ?? 0) + (newRecurrence ? 1 : 0),
      lastRecurrenceCycle: newRecurrence ? item.record.cycle : previous?.lastRecurrenceCycle ?? null,
      overdueReviewerDecisions: (previous?.overdueReviewerDecisions ?? 0) + (overdue ? 1 : 0) } } });
}

export function advanceQl230Cycle(sources: Ql230Sources, ledger: Ql230Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql230Ledger {
  const item = ql230CompanyReview(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reassignment_recurrence_reviewer_decision_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl230Check(sources: Ql230Sources, ledger: Ql230Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql230Check): Ql230Ledger {
  const item = ql230CompanyReview(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reassignment_recurrence_reviewer_decision_draft' ||
      !QL230_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

export function prepareQl230HoldAudit(sources: Ql230Sources, ledger: Ql230Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql230Ledger {
  const item = ql230CompanyReview(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'reassignment_recurrence_reviewer_decision_draft' ||
      !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'conditional_hold_continuity_audit_prepared' });
}

export function ql230Portfolio(sources: Ql230Sources, ledger: Ql230Ledger) {
  const companies = operatorOrganizations.map((organization) => ql230CompanyReview(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'unreviewed' | 'dueSoon' | 'overdue' |
    'separateReviewsDue' | 'recurring' | 'recurrenceEvents' | 'overdueReviewerDecisions' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL230_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    separateReviewsDue: total('separateReviewsDue'), recurring: total('recurring'),
    recurrenceEvents: total('recurrenceEvents'), overdueReviewerDecisions: total('overdueReviewerDecisions'),
    stale: total('stale'), allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentReview: false as const, actualEvidenceVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Status-only receipt. No private notes, evidence fingerprints or actual reviewer identities. */
export function ql230CompanyReceipt(sources: Ql230Sources, ledger: Ql230Ledger, company: OrganizationId): string {
  const summary = ql230CompanyReview(sources, ledger, company);
  return JSON.stringify({ release: QL230_RELEASE, company,
    scope: 'Fictional reassignment evidence recurrence, reviewer decision aging and conditional hold continuity',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    separateReviewsDue: summary.separateReviewsDue, recurring: summary.recurring,
    recurrenceEvents: summary.recurrenceEvents, overdueReviewerDecisions: summary.overdueReviewerDecisions,
    stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL230_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, followupOutcome: gap.followupOutcome,
        reviewerDecision: gap.reviewerDecision, reviewerDecisionAge: gap.reviewerDecisionAge,
        nextDueCycle: gap.nextDueCycle, dueSoon: gap.dueSoon, overdue: gap.overdue,
        separateReviewMissing: gap.separateReviewMissing, followupRecurrences: gap.followupRecurrences,
        overdueReviewerDecisions: gap.overdueReviewerDecisions,
        actualIndependentReviewer: false, actualFollowupVerified: false })),
      conditionalRelease: 'BLOCKED', realOwnerAuthorization: false, independentHoldReleased: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentReview: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
