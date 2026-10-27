import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql228CompanyContinuity, type Ql228Ledger, type Ql228Sources } from './ql228HandoffContinuity';

export const QL229_RELEASE = 'ql229-four-company-independent-handoff-exception-aging-reassignment-outcome-reconciliation-conditional-release-hold-reassessment-disabled-preview-v1';
export const QL229_CHECKS = [
  { id: 'HANDOFF_EXCEPTION_AGING', title: 'Independent handoff exception aging', detail: 'Inspect fictional handoff deadlines and retained overdue episodes.' },
  { id: 'REASSIGNMENT_OUTCOME_RECONCILIATION', title: 'Reassignment outcome reconciliation', detail: 'Compare simulated owner/reviewer outcomes without claiming real independent agreement.' },
  { id: 'CONDITIONAL_RELEASE_HOLD_REASSESSMENT', title: 'Conditional release hold reassessment', detail: 'Confirm all twelve actual QL-181 pilot prerequisites stay HELD_UNVERIFIED.' }
] as const;
export type Ql229Check = typeof QL229_CHECKS[number]['id'];
export type Ql229Outcome = 'REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED' | 'SIMULATED_REASSIGNMENT_MATCH_UNVERIFIED' |
  'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED';
export type Ql229FollowUp = 'MAINTAIN_HELD_REVIEW_DRAFT' | 'REQUEST_REASSIGNMENT_EVIDENCE_DRAFT' |
  'REFER_INDEPENDENT_RECHECK_DRAFT';
export type Ql229GapRecord = Readonly<{
  outcome: Ql229Outcome;
  followUp: Ql229FollowUp;
  note: string;
  lastCycle: number;
  conflictEvents: number;
  lastConflictCycle: number | null;
  overdueEpisodes: number;
}>;
export type Ql229Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql229GapRecord>>;
  checks: Partial<Record<Ql229Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'independent_handoff_exception_reassignment_review_draft' | 'conditional_hold_reassessment_packet_prepared';
}>;
export type Ql229Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql229Case>>>>;
export type Ql229Sources = Ql228Sources & Readonly<{ handoffContinuity: Ql228Ledger }>;
export type Ql229SourceStatus = 'AWAITING_PREPARED_QL228' | 'SOURCE_CURRENT' |
  'QL228_HANDOFF_OUTCOME_REVISED' | 'UPSTREAM_STALE';

function syntheticToken(source: unknown): string {
  // This browser-local revision detector is not a signature or real reviewer receipt.
  let value = 2166136261;
  for (const char of JSON.stringify(source)) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
  return `fictional-reassignment-${(value >>> 0).toString(16)}`;
}
type UpstreamCase = ReturnType<typeof ql228CompanyContinuity>['cases'][number];
function tokenFor(item: UpstreamCase) {
  return syntheticToken({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, sourceStatus: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      exception: gap.exception, handoff: gap.handoff, independentDue: gap.independentDue,
      recurrenceEvents: gap.recurrenceEvents, overdueHandoffs: gap.overdueHandoffs,
      note: item.record?.gaps[gap.category]?.note })) });
}

export function ql229CompanyReassignment(sources: Ql229Sources, ledger: Ql229Ledger, company: OrganizationId) {
  const upstream = ql228CompanyContinuity(sources, sources.handoffContinuity, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql229SourceStatus = !record ? 'AWAITING_PREPARED_QL228' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== tokenFor(item) ? 'QL228_HANDOFF_OUTCOME_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const outcome = current?.outcome ?? 'NOT_RECONCILED' as const;
      const followUp = current?.followUp ?? 'NOT_DRAFTED' as const;
      const independentDue = gap.independentDue || gap.priority === 'P0' || gap.handoffMissing ||
        gap.recurrenceEvents > 0 || gap.overdueHandoffs > 0 ||
        outcome === 'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED' ||
        (current?.conflictEvents ?? 0) > 0 || (current?.overdueEpisodes ?? 0) > 0;
      return { ...gap, reassignmentOutcome: outcome, reassignmentFollowUp: followUp,
        followUpAge: age, nextDueCycle: current ? current.lastCycle + 3 : null,
        dueSoon: age !== null && age === 2, overdue: age !== null && age >= 3,
        independentDue, recheckMissing: independentDue && followUp !== 'REFER_INDEPENDENT_RECHECK_DRAFT',
        reassignmentConflicts: current?.conflictEvents ?? 0, overdueEpisodes: current?.overdueEpisodes ?? 0,
        actualIndependentReviewer: false as const, realReassignmentAccepted: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => gap.reassignmentOutcome === 'NOT_RECONCILED').length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const rechecksDue = active ? gaps.filter((gap) => gap.recheckMissing).length : 0;
    const conflicting = active ? gaps.filter((gap) => gap.reassignmentOutcome === 'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED').length : 0;
    const conflictEvents = active ? gaps.reduce((sum, gap) => sum + gap.reassignmentConflicts, 0) : 0;
    const overdueEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.overdueEpisodes, 0) : 0;
    const checksComplete = active && QL229_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && unreviewed === 0 && overdue === 0 &&
      rechecksDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      rechecksDue, conflicting, conflictEvents, overdueEpisodes, checksComplete,
      readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'conditional_hold_reassessment_packet_prepared',
      actualOwnerAuthorization: false as const, actualIndependentReassignment: false as const,
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
    rechecksDue: cases.reduce((sum, item) => sum + item.rechecksDue, 0),
    conflicting: cases.reduce((sum, item) => sum + item.conflicting, 0),
    conflictEvents: cases.reduce((sum, item) => sum + item.conflictEvents, 0),
    overdueEpisodes: cases.reduce((sum, item) => sum + item.overdueEpisodes, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql229Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql229Case): Ql229Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

export function beginQl229Reassessment(sources: Ql229Sources, ledger: Ql229Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql229Ledger {
  const item = ql228CompanyContinuity(sources, sources.handoffContinuity, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const token = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === token) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, cycle: 0, gaps: {}, checks: {},
    phase: 'independent_handoff_exception_reassignment_review_draft' });
}

/** Local simulated outcomes never prove any real independent handoff or clear a QL-181 hold. */
export function recordQl229Reassignment(sources: Ql229Sources, ledger: Ql229Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  outcome: Ql229Outcome, followUp: Ql229FollowUp, note: string): Ql229Ledger {
  const item = ql229CompanyReassignment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_handoff_exception_reassignment_review_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['REASSIGNMENT_EVIDENCE_OPEN_UNVERIFIED', 'SIMULATED_REASSIGNMENT_MATCH_UNVERIFIED', 'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED'].includes(outcome) ||
      !['MAINTAIN_HELD_REVIEW_DRAFT', 'REQUEST_REASSIGNMENT_EVIDENCE_DRAFT', 'REFER_INDEPENDENT_RECHECK_DRAFT'].includes(followUp) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && followUp !== 'REFER_INDEPENDENT_RECHECK_DRAFT') return ledger;
  const newConflict = outcome === 'SIMULATED_REASSIGNMENT_CONFLICT_UNVERIFIED' &&
    previous?.lastConflictCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { outcome, followUp, note: note.trim().slice(0, 180),
      lastCycle: item.record.cycle,
      conflictEvents: (previous?.conflictEvents ?? 0) + (newConflict ? 1 : 0),
      lastConflictCycle: newConflict ? item.record.cycle : previous?.lastConflictCycle ?? null,
      overdueEpisodes: (previous?.overdueEpisodes ?? 0) + (overdue ? 1 : 0) } } });
}

export function advanceQl229Cycle(sources: Ql229Sources, ledger: Ql229Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql229Ledger {
  const item = ql229CompanyReassignment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_handoff_exception_reassignment_review_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl229Check(sources: Ql229Sources, ledger: Ql229Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql229Check): Ql229Ledger {
  const item = ql229CompanyReassignment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_handoff_exception_reassignment_review_draft' ||
      !QL229_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

export function prepareQl229HoldReassessment(sources: Ql229Sources, ledger: Ql229Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql229Ledger {
  const item = ql229CompanyReassignment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'independent_handoff_exception_reassignment_review_draft' ||
      !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'conditional_hold_reassessment_packet_prepared' });
}

export function ql229Portfolio(sources: Ql229Sources, ledger: Ql229Ledger) {
  const companies = operatorOrganizations.map((organization) => ql229CompanyReassignment(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'unreviewed' | 'dueSoon' | 'overdue' |
    'rechecksDue' | 'conflicting' | 'conflictEvents' | 'overdueEpisodes' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL229_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    rechecksDue: total('rechecksDue'), conflicting: total('conflicting'),
    conflictEvents: total('conflictEvents'), overdueEpisodes: total('overdueEpisodes'), stale: total('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentReassignment: false as const, actualEvidenceVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Coded status receipt, never export notes, reviewer names or source tokens. */
export function ql229CompanyReceipt(sources: Ql229Sources, ledger: Ql229Ledger, company: OrganizationId): string {
  const summary = ql229CompanyReassignment(sources, ledger, company);
  return JSON.stringify({ release: QL229_RELEASE, company,
    scope: 'Unverified independent handoff aging, reassignment reconciliation and conditional hold reassessment',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    rechecksDue: summary.rechecksDue, conflicting: summary.conflicting,
    conflictEvents: summary.conflictEvents, overdueEpisodes: summary.overdueEpisodes,
    stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL229_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, reassignmentOutcome: gap.reassignmentOutcome,
        reassignmentFollowUp: gap.reassignmentFollowUp, followUpAge: gap.followUpAge,
        nextDueCycle: gap.nextDueCycle, dueSoon: gap.dueSoon, overdue: gap.overdue,
        recheckMissing: gap.recheckMissing, conflictEvents: gap.reassignmentConflicts,
        overdueEpisodes: gap.overdueEpisodes, actualIndependentReview: false })),
      conditionalRelease: 'BLOCKED', actualOwnerAuthorization: false, independentRelease: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentReassignment: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
