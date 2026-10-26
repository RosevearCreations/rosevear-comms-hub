import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql223CompanyAging, type Ql223Ledger, type Ql223Sources } from './ql223DecisionAging';

export const QL224_RELEASE = 'ql224-four-company-overdue-follow-up-escalation-evidence-reconciliation-independent-hold-continuity-disabled-preview-v1';
export const QL224_CHECKS = [
  { id: 'OVERDUE_ESCALATION_REPLAY', title: 'Overdue escalation replay boundary', detail: 'Verify invented aging and overdue escalation counts; draft routing does not send any real communication.' },
  { id: 'EVIDENCE_RECONCILIATION', title: 'Reconcile fictional evidence source exceptions', detail: 'Review invented evidence comparison states and require independent referral for source conflicts.' },
  { id: 'INDEPENDENT_HOLD_CONTINUITY', title: 'Independent hold continuity proof', detail: 'Confirm all twelve actual QL-181 prerequisites remain HELD_UNVERIFIED and conditional release is blocked.' }
] as const;
export type Ql224Check = typeof QL224_CHECKS[number]['id'];
export type Ql224Evidence = 'STILL_OPEN_UNVERIFIED' | 'FICTIONAL_EVIDENCE_MATCHED_UNVERIFIED' | 'FICTIONAL_SOURCE_CONFLICT';
export type Ql224Route = 'HOLD_AND_MONITOR_DRAFT' | 'REQUEST_NEW_EVIDENCE_DRAFT' | 'REFER_INDEPENDENT_DRAFT';
export type Ql224GapRecord = Readonly<{
  evidence: Ql224Evidence;
  route: Ql224Route;
  note: string;
  lastCycle: number;
  overdueEscalations: number;
  conflictEvents: number;
  lastConflictCycle: number | null;
}>;
export type Ql224Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql224GapRecord>>;
  checks: Partial<Record<Ql224Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'overdue_escalation_replay_draft' | 'independent_hold_continuity_packet_prepared';
}>;
export type Ql224Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql224Case>>>>;
export type Ql224Sources = Ql223Sources & Readonly<{ aging: Ql223Ledger }>;
export type Ql224SourceStatus = 'AWAITING_PREPARED_QL223' | 'SOURCE_CURRENT' | 'QL223_FOLLOW_UP_REVISED' | 'UPSTREAM_STALE';

function sourceToken(source: unknown): string {
  // Synthetic browser-session revision marker, never an attestation or real evidence signature.
  let hash = 2166136261;
  for (const char of JSON.stringify(source)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `invented-overdue-${(hash >>> 0).toString(16)}`;
}
type Ql223View = ReturnType<typeof ql223CompanyAging>['cases'][number];
function tokenFor(item: Ql223View) {
  return sourceToken({ upstream: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, sourceStatus: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, evidence: gap.evidence,
      route: gap.ownerRoute, priority: gap.priority, recurrence: gap.totalRecurrence,
      followUpAge: gap.followUpAge, exceptionEvents: gap.exceptionEvents,
      privateNoteRevision: item.record?.gaps[gap.category]?.note })) });
}

export function ql224CompanyEscalations(sources: Ql224Sources, ledger: Ql224Ledger, company: OrganizationId) {
  const upstream = ql223CompanyAging(sources, sources.aging, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql224SourceStatus = !record ? 'AWAITING_PREPARED_QL223' : !eligible ? 'UPSTREAM_STALE' :
      record.sourceToken !== tokenFor(item) ? 'QL223_FOLLOW_UP_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const followUp = active ? record?.gaps[gap.category] : undefined;
      const age = followUp && record ? Math.max(0, record.cycle - followUp.lastCycle) : null;
      const evidence = followUp?.evidence ?? 'NOT_RECONCILED' as const;
      const route = followUp?.route ?? 'NOT_DRAFTED' as const;
      const independentDue = gap.priority === 'P0' || gap.totalRecurrence > 0 ||
        evidence === 'FICTIONAL_SOURCE_CONFLICT' || (followUp?.overdueEscalations ?? 0) > 0;
      return { ...gap, evidence, route, followUpAge: age,
        nextDueCycle: followUp ? followUp.lastCycle + 3 : null,
        dueSoon: age !== null && age === 2, overdue: age !== null && age >= 3,
        independentDue, referralMissing: independentDue && route !== 'REFER_INDEPENDENT_DRAFT',
        overdueEscalations: followUp?.overdueEscalations ?? 0,
        conflictEvents: followUp?.conflictEvents ?? 0,
        realEvidenceVerified: false as const, realIndependentClosure: false as const };
    });
    const undecided = active ? gaps.filter((gap) => gap.evidence === 'NOT_RECONCILED').length : gaps.length;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const referralsDue = active ? gaps.filter((gap) => gap.referralMissing).length : 0;
    const openEvidence = active ? gaps.filter((gap) => gap.evidence === 'STILL_OPEN_UNVERIFIED').length : 0;
    const sourceConflicts = active ? gaps.filter((gap) => gap.evidence === 'FICTIONAL_SOURCE_CONFLICT').length : 0;
    const historicalEscalations = active ? gaps.reduce((sum, gap) => sum + gap.overdueEscalations, 0) : 0;
    const conflictEvents = active ? gaps.reduce((sum, gap) => sum + gap.conflictEvents, 0) : 0;
    const checksComplete = active && QL224_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && undecided === 0 && overdue === 0 &&
      referralsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, undecided, overdue, dueSoon,
      referralsDue, openEvidence, sourceConflicts, historicalEscalations, conflictEvents,
      checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'independent_hold_continuity_packet_prepared',
      realEvidenceVerified: false as const, realOwnerAuthorization: false as const,
      realIndependentClosure: false as const, transmitted: false as const,
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
    openEvidence: cases.reduce((sum, item) => sum + item.openEvidence, 0),
    sourceConflicts: cases.reduce((sum, item) => sum + item.sourceConflicts, 0),
    historicalEscalations: cases.reduce((sum, item) => sum + item.historicalEscalations, 0),
    conflictEvents: cases.reduce((sum, item) => sum + item.conflictEvents, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 &&
        QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql224Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql224Case): Ql224Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

export function beginQl224Replay(sources: Ql224Sources, ledger: Ql224Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql224Ledger {
  const item = ql223CompanyAging(sources, sources.aging, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const fingerprint = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === fingerprint) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: fingerprint, cycle: 0, gaps: {},
    checks: {}, phase: 'overdue_escalation_replay_draft' });
}

/** Replaying an overdue item requires a fictional independent referral; historical overdue counts survive the refresh. */
export function recordQl224Reconciliation(sources: Ql224Sources, ledger: Ql224Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  evidence: Ql224Evidence, route: Ql224Route, note: string): Ql224Ledger {
  const item = ql224CompanyEscalations(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'overdue_escalation_replay_draft' || !item.gaps.some((gap) => gap.category === category) ||
      !['STILL_OPEN_UNVERIFIED', 'FICTIONAL_EVIDENCE_MATCHED_UNVERIFIED', 'FICTIONAL_SOURCE_CONFLICT'].includes(evidence) ||
      !['HOLD_AND_MONITOR_DRAFT', 'REQUEST_NEW_EVIDENCE_DRAFT', 'REFER_INDEPENDENT_DRAFT'].includes(route) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const wasOverdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (wasOverdue && route !== 'REFER_INDEPENDENT_DRAFT') return ledger;
  const newConflict = evidence === 'FICTIONAL_SOURCE_CONFLICT' && previous?.lastConflictCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { evidence, route, note: note.trim().slice(0, 180),
      lastCycle: item.record.cycle,
      overdueEscalations: (previous?.overdueEscalations ?? 0) + (wasOverdue ? 1 : 0),
      conflictEvents: (previous?.conflictEvents ?? 0) + (newConflict ? 1 : 0),
      lastConflictCycle: newConflict ? item.record.cycle : previous?.lastConflictCycle ?? null } } });
}

export function advanceQl224Cycle(sources: Ql224Sources, ledger: Ql224Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql224Ledger {
  const item = ql224CompanyEscalations(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'overdue_escalation_replay_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl224Check(sources: Ql224Sources, ledger: Ql224Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql224Check): Ql224Ledger {
  const item = ql224CompanyEscalations(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'overdue_escalation_replay_draft' ||
      !QL224_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

/** Local packet only: status receipts cannot authorize a real independent hold release. */
export function prepareQl224Continuity(sources: Ql224Sources, ledger: Ql224Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql224Ledger {
  const item = ql224CompanyEscalations(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'overdue_escalation_replay_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'independent_hold_continuity_packet_prepared' });
}

export function ql224Portfolio(sources: Ql224Sources, ledger: Ql224Ledger) {
  const companies = operatorOrganizations.map((org) => ql224CompanyEscalations(sources, ledger, org.id));
  const count = (key: 'eligible' | 'tracking' | 'prepared' | 'undecided' | 'overdue' | 'dueSoon' |
    'referralsDue' | 'openEvidence' | 'sourceConflicts' | 'historicalEscalations' | 'conflictEvents' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL224_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: count('eligible'), tracking: count('tracking'), prepared: count('prepared'),
    undecided: count('undecided'), overdue: count('overdue'), dueSoon: count('dueSoon'),
    referralsDue: count('referralsDue'), openEvidence: count('openEvidence'),
    sourceConflicts: count('sourceConflicts'), historicalEscalations: count('historicalEscalations'),
    conflictEvents: count('conflictEvents'), stale: count('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentClosure: false as const, actualOwnerAuthorization: false as const,
    actualEvidenceVerified: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const,
    callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** PII-minimized source-linked counts and coded status only; no notes, people or evidence tokens. */
export function ql224CompanyReceipt(sources: Ql224Sources, ledger: Ql224Ledger, company: OrganizationId): string {
  const summary = ql224CompanyEscalations(sources, ledger, company);
  return JSON.stringify({ release: QL224_RELEASE, company,
    scope: 'Fictional overdue follow-up escalation and independent hold continuity review',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    undecided: summary.undecided, overdue: summary.overdue, dueSoon: summary.dueSoon,
    referralsDue: summary.referralsDue, openEvidence: summary.openEvidence,
    sourceConflicts: summary.sourceConflicts, historicalEscalations: summary.historicalEscalations,
    conflictEvents: summary.conflictEvents, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL224_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, evidence: gap.evidence,
        escalationRoute: gap.route, followUpAge: gap.followUpAge, nextDueCycle: gap.nextDueCycle,
        overdue: gap.overdue, dueSoon: gap.dueSoon, referralMissing: gap.referralMissing,
        overdueEscalations: gap.overdueEscalations, conflictEvents: gap.conflictEvents,
        realIndependentClosure: false, realEvidenceVerified: false })),
      conditionalRelease: 'BLOCKED', realOwnerAuthorization: false, independentHoldReleased: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentClosure: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
