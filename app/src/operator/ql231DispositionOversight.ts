import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql230CompanyReview, type Ql230Ledger, type Ql230Sources } from './ql230ReviewerContinuity';

export const QL231_RELEASE = 'ql231-four-company-reviewer-recurrence-disposition-overdue-evidence-recheck-conditional-hold-exception-oversight-disabled-preview-v1';
export const QL231_CHECKS = [
  { id: 'RECURRENCE_DISPOSITION', title: 'Independent reviewer recurrence disposition', detail: 'Review coded fictional dispositions and recurring evidence exceptions.' },
  { id: 'OVERDUE_RECHECK', title: 'Overdue evidence recheck', detail: 'Inspect local decision age, overdue recheck history and separate-review referrals.' },
  { id: 'HOLD_EXCEPTION_OVERSIGHT', title: 'Conditional hold exception oversight', detail: 'Confirm all twelve actual QL-181 holds remain HELD_UNVERIFIED.' }
] as const;
export type Ql231Check = typeof QL231_CHECKS[number]['id'];
export type Ql231Evidence = 'EVIDENCE_RECHECK_PENDING_UNVERIFIED' | 'SIMULATED_RECHECK_MATCH_UNVERIFIED' |
  'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED';
export type Ql231Disposition = 'CONTINUE_HELD_REVIEW_DRAFT' | 'REFER_FURTHER_INDEPENDENT_REVIEW_DRAFT' |
  'REOPEN_EVIDENCE_EXCEPTION_DRAFT';
export type Ql231Recheck = 'RECHECK_MONITOR_HELD_DRAFT' | 'REFER_SEPARATE_RECHECK_DRAFT' |
  'ESCALATE_OVERDUE_RECHECK_DRAFT';
export type Ql231GapRecord = Readonly<{ evidence: Ql231Evidence; disposition: Ql231Disposition;
  recheck: Ql231Recheck; note: string; lastCycle: number; recurrenceEvents: number;
  lastRecurrenceCycle: number | null; overdueRecheckEpisodes: number }>;
export type Ql231Case = Readonly<{ sourceToken: string; cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql231GapRecord>>;
  checks: Partial<Record<Ql231Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'reviewer_recurrence_disposition_recheck_draft' | 'conditional_hold_exception_oversight_packet_prepared' }>;
export type Ql231Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql231Case>>>>;
export type Ql231Sources = Ql230Sources & Readonly<{ reviewerContinuity: Ql230Ledger }>;
export type Ql231SourceStatus = 'AWAITING_PREPARED_QL230' | 'SOURCE_CURRENT' |
  'QL230_REVIEWER_OUTCOME_REVISED' | 'UPSTREAM_STALE';

function revisionToken(value: unknown): string {
  // Synthetic local change token, not cryptographic evidence or reviewer authentication.
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-disposition-${(hash >>> 0).toString(16)}`;
}
type SourceCase = ReturnType<typeof ql230CompanyReview>['cases'][number];
function sourceToken(item: SourceCase): string {
  return revisionToken({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, status: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      followupOutcome: gap.followupOutcome, reviewerDecision: gap.reviewerDecision,
      followupRecurrences: gap.followupRecurrences, overdueReviewerDecisions: gap.overdueReviewerDecisions,
      note: item.record?.gaps[gap.category]?.note })) });
}

export function ql231CompanyDisposition(sources: Ql231Sources, ledger: Ql231Ledger, company: OrganizationId) {
  const upstream = ql230CompanyReview(sources, sources.reviewerContinuity, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql231SourceStatus = !record ? 'AWAITING_PREPARED_QL230' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== sourceToken(item) ? 'QL230_REVIEWER_OUTCOME_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const evidence = current?.evidence ?? 'NOT_RECHECKED' as const;
      const disposition = current?.disposition ?? 'NOT_DISPOSITIONED' as const;
      const recheck = current?.recheck ?? 'NOT_DRAFTED' as const;
      const recurrenceDue = gap.priority === 'P0' || gap.followupRecurrences > 0 || gap.overdueReviewerDecisions > 0 ||
        gap.separateReviewDue || evidence === 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED' ||
        (current?.recurrenceEvents ?? 0) > 0 || (current?.overdueRecheckEpisodes ?? 0) > 0;
      const missingSeparateRecheck = recurrenceDue && !['REFER_SEPARATE_RECHECK_DRAFT', 'ESCALATE_OVERDUE_RECHECK_DRAFT'].includes(recheck);
      const missingDisposition = evidence === 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED' &&
        disposition !== 'REOPEN_EVIDENCE_EXCEPTION_DRAFT' && disposition !== 'REFER_FURTHER_INDEPENDENT_REVIEW_DRAFT';
      return { ...gap, evidence, disposition, recheck, age, nextDueCycle: current ? current.lastCycle + 3 : null,
        dueSoon: age === 2, overdue: age !== null && age >= 3, recurrenceDue,
        missingSeparateRecheck, missingDisposition, recheckRecurrences: current?.recurrenceEvents ?? 0,
        overdueRecheckEpisodes: current?.overdueRecheckEpisodes ?? 0,
        actualRecheckVerified: false as const, actualIndependentDisposition: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => gap.evidence === 'NOT_RECHECKED').length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const separateRechecksDue = active ? gaps.filter((gap) => gap.missingSeparateRecheck).length : 0;
    const dispositionExceptions = active ? gaps.filter((gap) => gap.missingDisposition).length : 0;
    const recurring = active ? gaps.filter((gap) => gap.evidence === 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED').length : 0;
    const recurrenceEvents = active ? gaps.reduce((sum, gap) => sum + gap.recheckRecurrences, 0) : 0;
    const overdueRecheckEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.overdueRecheckEpisodes, 0) : 0;
    const checksComplete = active && QL231_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const holdsAllHeld = QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && unreviewed === 0 && overdue === 0 &&
      separateRechecksDue === 0 && dispositionExceptions === 0 && checksComplete && holdsAllHeld;
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      separateRechecksDue, dispositionExceptions, recurring, recurrenceEvents, overdueRecheckEpisodes,
      checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'conditional_hold_exception_oversight_packet_prepared',
      actualIndependentDisposition: false as const, actualEvidenceVerified: false as const,
      actualOwnerAuthorization: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) => !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    unreviewed: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.unreviewed : 0), 0),
    dueSoon: cases.reduce((sum, item) => sum + item.dueSoon, 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    separateRechecksDue: cases.reduce((sum, item) => sum + item.separateRechecksDue, 0),
    dispositionExceptions: cases.reduce((sum, item) => sum + item.dispositionExceptions, 0),
    recurring: cases.reduce((sum, item) => sum + item.recurring, 0),
    recurrenceEvents: cases.reduce((sum, item) => sum + item.recurrenceEvents, 0),
    overdueRecheckEpisodes: cases.reduce((sum, item) => sum + item.overdueRecheckEpisodes, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql231Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql231Case): Ql231Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}
export function beginQl231Disposition(sources: Ql231Sources, ledger: Ql231Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql231Ledger {
  const item = ql230CompanyReview(sources, sources.reviewerContinuity, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const token = sourceToken(item);
  if (ledger[company]?.[scenario]?.sourceToken === token) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, cycle: 0, gaps: {}, checks: {},
    phase: 'reviewer_recurrence_disposition_recheck_draft' });
}

export function recordQl231Recheck(sources: Ql231Sources, ledger: Ql231Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, evidence: Ql231Evidence,
  disposition: Ql231Disposition, recheck: Ql231Recheck, note: string): Ql231Ledger {
  const item = ql231CompanyDisposition(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reviewer_recurrence_disposition_recheck_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['EVIDENCE_RECHECK_PENDING_UNVERIFIED', 'SIMULATED_RECHECK_MATCH_UNVERIFIED', 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED'].includes(evidence) ||
      !['CONTINUE_HELD_REVIEW_DRAFT', 'REFER_FURTHER_INDEPENDENT_REVIEW_DRAFT', 'REOPEN_EVIDENCE_EXCEPTION_DRAFT'].includes(disposition) ||
      !['RECHECK_MONITOR_HELD_DRAFT', 'REFER_SEPARATE_RECHECK_DRAFT', 'ESCALATE_OVERDUE_RECHECK_DRAFT'].includes(recheck) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && recheck !== 'ESCALATE_OVERDUE_RECHECK_DRAFT') return ledger;
  if (evidence === 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED' && disposition === 'CONTINUE_HELD_REVIEW_DRAFT') return ledger;
  const recurrence = evidence === 'SIMULATED_RECHECK_EXCEPTION_UNVERIFIED' && previous?.lastRecurrenceCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record, gaps: { ...item.record.gaps,
    [category]: { evidence, disposition, recheck, note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      recurrenceEvents: (previous?.recurrenceEvents ?? 0) + (recurrence ? 1 : 0),
      lastRecurrenceCycle: recurrence ? item.record.cycle : previous?.lastRecurrenceCycle ?? null,
      overdueRecheckEpisodes: (previous?.overdueRecheckEpisodes ?? 0) + (overdue ? 1 : 0) } } });
}
export function advanceQl231Cycle(sources: Ql231Sources, ledger: Ql231Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql231Ledger {
  const item = ql231CompanyDisposition(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reviewer_recurrence_disposition_recheck_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}
export function acknowledgeQl231Check(sources: Ql231Sources, ledger: Ql231Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql231Check): Ql231Ledger {
  const item = ql231CompanyDisposition(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reviewer_recurrence_disposition_recheck_draft' ||
      !QL231_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}
export function prepareQl231Oversight(sources: Ql231Sources, ledger: Ql231Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql231Ledger {
  const item = ql231CompanyDisposition(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'reviewer_recurrence_disposition_recheck_draft' ||
      !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'conditional_hold_exception_oversight_packet_prepared' });
}
export function ql231Portfolio(sources: Ql231Sources, ledger: Ql231Ledger) {
  const companies = operatorOrganizations.map((organization) => ql231CompanyDisposition(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'unreviewed' | 'dueSoon' | 'overdue' |
    'separateRechecksDue' | 'dispositionExceptions' | 'recurring' | 'recurrenceEvents' | 'overdueRecheckEpisodes' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL231_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    separateRechecksDue: total('separateRechecksDue'), dispositionExceptions: total('dispositionExceptions'),
    recurring: total('recurring'), recurrenceEvents: total('recurrenceEvents'),
    overdueRecheckEpisodes: total('overdueRecheckEpisodes'), stale: total('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentDisposition: false as const, actualEvidenceVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Redacted status counts only; never export fictional private notes or source fingerprints. */
export function ql231CompanyReceipt(sources: Ql231Sources, ledger: Ql231Ledger, company: OrganizationId): string {
  const summary = ql231CompanyDisposition(sources, ledger, company);
  return JSON.stringify({ release: QL231_RELEASE, company,
    scope: 'Fictional reviewer recurrence disposition, overdue evidence recheck and conditional hold oversight',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    separateRechecksDue: summary.separateRechecksDue, dispositionExceptions: summary.dispositionExceptions,
    recurring: summary.recurring, recurrenceEvents: summary.recurrenceEvents,
    overdueRecheckEpisodes: summary.overdueRecheckEpisodes, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL231_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, evidence: gap.evidence,
        disposition: gap.disposition, recheck: gap.recheck, age: gap.age, nextDueCycle: gap.nextDueCycle,
        dueSoon: gap.dueSoon, overdue: gap.overdue, missingSeparateRecheck: gap.missingSeparateRecheck,
        missingDisposition: gap.missingDisposition, recurrenceEvents: gap.recheckRecurrences,
        overdueRecheckEpisodes: gap.overdueRecheckEpisodes, actualIndependentDisposition: false,
        actualEvidenceRecheck: false })), conditionalRelease: 'BLOCKED', actualOwnerAuthorization: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentDisposition: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
