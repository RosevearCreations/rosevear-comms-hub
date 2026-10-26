import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql225CompanyDispositions, type Ql225Ledger, type Ql225Sources } from './ql225EvidenceDisposition';

export const QL226_RELEASE = 'ql226-four-company-independent-evidence-disposition-recurrence-owner-follow-up-reopen-conditional-release-hold-recheck-disabled-preview-v1';
export const QL226_CHECKS = [
  { id: 'RECURRENCE_COMPARISON', title: 'Independent evidence recurrence comparison', detail: 'Inspect invented repeated evidence exceptions and de-duplicated reopen events.' },
  { id: 'OWNER_REOPEN_FOLLOW_UP', title: 'Owner follow-up reopen and aging', detail: 'Review synthetic late owner follow-ups and mandatory unsent independent referrals.' },
  { id: 'CONDITIONAL_HOLD_RECHECK', title: 'Conditional release hold recheck', detail: 'Reaffirm the twelve unchanged actual QL-181 prerequisites; no real release decision is available.' }
] as const;
export type Ql226Check = typeof QL226_CHECKS[number]['id'];
export type Ql226Outcome = 'MONITOR_OPEN_UNVERIFIED' | 'REOPENED_EXCEPTION_UNVERIFIED' | 'SIMULATED_RECHECK_RECORDED_UNVERIFIED';
export type Ql226Route = 'MAINTAIN_HOLD_DRAFT' | 'REQUEST_EVIDENCE_DRAFT' | 'REFER_INDEPENDENT_DRAFT';
export type Ql226GapRecord = Readonly<{
  outcome: Ql226Outcome;
  route: Ql226Route;
  note: string;
  lastCycle: number;
  reopenEvents: number;
  lastReopenCycle: number | null;
  overdueFollowUps: number;
}>;
export type Ql226Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql226GapRecord>>;
  checks: Partial<Record<Ql226Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'independent_recurrence_reopen_draft' | 'conditional_release_hold_recheck_packet_prepared';
}>;
export type Ql226Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql226Case>>>>;
export type Ql226Sources = Ql225Sources & Readonly<{ disposition: Ql225Ledger }>;
export type Ql226SourceStatus = 'AWAITING_PREPARED_QL225' | 'SOURCE_CURRENT' | 'QL225_DISPOSITION_REVISED' | 'UPSTREAM_STALE';

function sourceToken(source: unknown): string {
  // Local synthetic revision marker, not a signature, credential, receipt of real independent review or attestation.
  let hash = 2166136261;
  for (const char of JSON.stringify(source)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `invented-reopen-${(hash >>> 0).toString(16)}`;
}
type Ql225View = ReturnType<typeof ql225CompanyDispositions>['cases'][number];
function tokenFor(item: Ql225View): string {
  return sourceToken({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, sourceStatus: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, disposition: gap.disposition,
      followUpRoute: gap.dispositionRoute, priority: gap.priority, followUpAge: gap.followUpAge,
      overdueEpisodes: gap.overdueEpisodes, discrepancyEvents: gap.discrepancyEvents,
      previousNote: item.record?.gaps[gap.category]?.note })) });
}

export function ql226CompanyReopens(sources: Ql226Sources, ledger: Ql226Ledger, company: OrganizationId) {
  const upstream = ql225CompanyDispositions(sources, sources.disposition, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql226SourceStatus = !record ? 'AWAITING_PREPARED_QL225' : !eligible ? 'UPSTREAM_STALE' :
      record.sourceToken !== tokenFor(item) ? 'QL225_DISPOSITION_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const followUp = active ? record?.gaps[gap.category] : undefined;
      const age = followUp && record ? Math.max(0, record.cycle - followUp.lastCycle) : null;
      const outcome = followUp?.outcome ?? 'NOT_REASSESSED' as const;
      const route = followUp?.route ?? 'NOT_DRAFTED' as const;
      const independentDue = gap.priority === 'P0' || gap.totalRecurrence > 0 ||
        gap.overdueEscalations > 0 || gap.conflictEvents > 0 ||
        gap.overdueEpisodes > 0 || gap.discrepancyEvents > 0 ||
        outcome === 'REOPENED_EXCEPTION_UNVERIFIED' || (followUp?.reopenEvents ?? 0) > 0 ||
        (followUp?.overdueFollowUps ?? 0) > 0;
      return { ...gap, outcome, reopenRoute: route, followUpAge: age,
        nextDueCycle: followUp ? followUp.lastCycle + 3 : null,
        dueSoon: age !== null && age === 2, overdue: age !== null && age >= 3,
        independentDue, referralMissing: independentDue && route !== 'REFER_INDEPENDENT_DRAFT',
        reopenEvents: followUp?.reopenEvents ?? 0, overdueFollowUps: followUp?.overdueFollowUps ?? 0,
        realIndependentRecheck: false as const, realEvidenceVerified: false as const };
    });
    const undecided = active ? gaps.filter((gap) => gap.outcome === 'NOT_REASSESSED').length : gaps.length;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const referralsDue = active ? gaps.filter((gap) => gap.referralMissing).length : 0;
    const reopened = active ? gaps.filter((gap) => gap.outcome === 'REOPENED_EXCEPTION_UNVERIFIED').length : 0;
    const stillOpen = active ? gaps.filter((gap) => gap.outcome === 'MONITOR_OPEN_UNVERIFIED').length : 0;
    const reopenEvents = active ? gaps.reduce((sum, gap) => sum + gap.reopenEvents, 0) : 0;
    const overdueFollowUps = active ? gaps.reduce((sum, gap) => sum + gap.overdueFollowUps, 0) : 0;
    const checksComplete = active && QL226_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && undecided === 0 && overdue === 0 &&
      referralsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, undecided, overdue, dueSoon,
      referralsDue, reopened, stillOpen, reopenEvents, overdueFollowUps, checksComplete,
      readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'conditional_release_hold_recheck_packet_prepared',
      realEvidenceVerified: false as const, realOwnerAuthorization: false as const,
      realIndependentRecheck: false as const, transmitted: false as const,
      releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) =>
    !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    undecided: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.undecided : 0), 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    dueSoon: cases.reduce((sum, item) => sum + item.dueSoon, 0),
    referralsDue: cases.reduce((sum, item) => sum + item.referralsDue, 0),
    reopened: cases.reduce((sum, item) => sum + item.reopened, 0),
    stillOpen: cases.reduce((sum, item) => sum + item.stillOpen, 0),
    reopenEvents: cases.reduce((sum, item) => sum + item.reopenEvents, 0),
    overdueFollowUps: cases.reduce((sum, item) => sum + item.overdueFollowUps, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 &&
        QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql226Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql226Case): Ql226Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

export function beginQl226Reopen(sources: Ql226Sources, ledger: Ql226Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql226Ledger {
  const item = ql225CompanyDispositions(sources, sources.disposition, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const fingerprint = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === fingerprint) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: fingerprint, cycle: 0, gaps: {},
    checks: {}, phase: 'independent_recurrence_reopen_draft' });
}

/** Reopening fictional evidence is not a real reviewer disposition or authorization to clear release holds. */
export function recordQl226Reopen(sources: Ql226Sources, ledger: Ql226Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  outcome: Ql226Outcome, route: Ql226Route, note: string): Ql226Ledger {
  const item = ql226CompanyReopens(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_recurrence_reopen_draft' || !item.gaps.some((gap) => gap.category === category) ||
      !['MONITOR_OPEN_UNVERIFIED', 'REOPENED_EXCEPTION_UNVERIFIED', 'SIMULATED_RECHECK_RECORDED_UNVERIFIED'].includes(outcome) ||
      !['MAINTAIN_HOLD_DRAFT', 'REQUEST_EVIDENCE_DRAFT', 'REFER_INDEPENDENT_DRAFT'].includes(route) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const wasOverdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (wasOverdue && route !== 'REFER_INDEPENDENT_DRAFT') return ledger;
  const newReopen = outcome === 'REOPENED_EXCEPTION_UNVERIFIED' && previous?.lastReopenCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { outcome, route, note: note.trim().slice(0, 180),
      lastCycle: item.record.cycle,
      reopenEvents: (previous?.reopenEvents ?? 0) + (newReopen ? 1 : 0),
      lastReopenCycle: newReopen ? item.record.cycle : previous?.lastReopenCycle ?? null,
      overdueFollowUps: (previous?.overdueFollowUps ?? 0) + (wasOverdue ? 1 : 0) } } });
}

export function advanceQl226Cycle(sources: Ql226Sources, ledger: Ql226Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql226Ledger {
  const item = ql226CompanyReopens(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_recurrence_reopen_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl226Check(sources: Ql226Sources, ledger: Ql226Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql226Check): Ql226Ledger {
  const item = ql226CompanyReopens(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_recurrence_reopen_draft' ||
      !QL226_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

export function prepareQl226HoldRecheck(sources: Ql226Sources, ledger: Ql226Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql226Ledger {
  const item = ql226CompanyReopens(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'independent_recurrence_reopen_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'conditional_release_hold_recheck_packet_prepared' });
}

export function ql226Portfolio(sources: Ql226Sources, ledger: Ql226Ledger) {
  const companies = operatorOrganizations.map((org) => ql226CompanyReopens(sources, ledger, org.id));
  const count = (key: 'eligible' | 'tracking' | 'prepared' | 'undecided' | 'overdue' | 'dueSoon' |
    'referralsDue' | 'reopened' | 'stillOpen' | 'reopenEvents' | 'overdueFollowUps' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL226_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: count('eligible'), tracking: count('tracking'), prepared: count('prepared'),
    undecided: count('undecided'), overdue: count('overdue'), dueSoon: count('dueSoon'),
    referralsDue: count('referralsDue'), reopened: count('reopened'), stillOpen: count('stillOpen'),
    reopenEvents: count('reopenEvents'), overdueFollowUps: count('overdueFollowUps'), stale: count('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentRecheck: false as const, actualEvidenceVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const,
    callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Coded status only; never export fictional narrative notes or reviewer/source identities. */
export function ql226CompanyReceipt(sources: Ql226Sources, ledger: Ql226Ledger, company: OrganizationId): string {
  const summary = ql226CompanyReopens(sources, ledger, company);
  return JSON.stringify({ release: QL226_RELEASE, company,
    scope: 'Invented independent disposition recurrence, owner follow-up reopening and conditional release hold recheck',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    undecided: summary.undecided, overdue: summary.overdue, dueSoon: summary.dueSoon,
    referralsDue: summary.referralsDue, reopened: summary.reopened, stillOpen: summary.stillOpen,
    reopenEvents: summary.reopenEvents, overdueFollowUps: summary.overdueFollowUps,
    stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL226_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, outcome: gap.outcome,
        followUpRoute: gap.reopenRoute, followUpAge: gap.followUpAge, nextDueCycle: gap.nextDueCycle,
        overdue: gap.overdue, dueSoon: gap.dueSoon, referralMissing: gap.referralMissing,
        reopenEvents: gap.reopenEvents, overdueFollowUps: gap.overdueFollowUps,
        realIndependentRecheck: false, realEvidenceVerified: false })),
      conditionalRelease: 'BLOCKED', actualOwnerAuthorization: false, independentHoldReleased: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentRecheck: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
