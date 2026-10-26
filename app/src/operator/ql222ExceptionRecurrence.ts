import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql221CompanyReassessment, type Ql221Ledger, type Ql221Sources } from './ql221EvidenceRefresh';

export const QL222_RELEASE = 'ql222-four-company-evidence-refresh-exception-recurrence-owner-decisions-hold-recheck-disabled-preview-v1';
export const QL222_CHECKS = [
  { id: 'RECURRENCE_PROVENANCE', title: 'Source-linked recurrence comparison', detail: 'Compare each local recurrence count and fictional QL-221 source without asserting independent verification.' },
  { id: 'OWNER_DECISION_HANDOFF', title: 'Owner follow-up handoff boundary', detail: 'Owner decisions and independent escalations remain unsent drafts, not approvals or notices.' },
  { id: 'INDEPENDENT_HOLD_RECHECK', title: 'Independent release-hold recheck', detail: 'Check all twelve QL-181 pilot prerequisites remain HELD_UNVERIFIED and cannot be bypassed.' }
] as const;
export type Ql222Check = typeof QL222_CHECKS[number]['id'];
export type Ql222Recurrence = 'RECONFIRMED_OPEN' | 'REPEATED_AFTER_REFRESH' | 'SIMULATED_SOURCE_EXCEPTION';
export type Ql222Decision = 'MAINTAIN_HOLD_DRAFT' | 'REQUEST_EVIDENCE_DRAFT' | 'ESCALATE_INDEPENDENT_DRAFT';
export type Ql222Gap = Readonly<{ recurrence: Ql222Recurrence; ownerDecision: Ql222Decision;
  note: string; lastCycle: number; repeatCount: number; lastRepeatCycle: number | null }>;
export type Ql222Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql222Gap>>;
  checks: Partial<Record<Ql222Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'owner_decision_replay_draft' | 'independent_hold_recheck_packet_prepared';
}>;
export type Ql222Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql222Case>>>>;
export type Ql222Sources = Ql221Sources & Readonly<{ refresh: Ql221Ledger }>;
export type Ql222SourceStatus = 'AWAITING_PREPARED_QL221' | 'SOURCE_CURRENT' | 'EVIDENCE_REFRESH_REVISED' | 'UPSTREAM_STALE';

function token(input: unknown): string {
  // Browser-session revision marker, not a collision-resistant digest or a real reviewer signature.
  let hash = 2166136261;
  for (const char of JSON.stringify(input)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `invented-recurrence-${(hash >>> 0).toString(16)}`;
}

type Ql221CaseView = ReturnType<typeof ql221CompanyReassessment>['cases'][number];
function tokenFor(item: Ql221CaseView) {
  return token({ upstream: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, status: item.sourceStatus, checks: item.record?.checks,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      recurrenceCount: gap.recurrenceCount, refresh: gap.refresh, evidenceSource: gap.evidenceSource,
      ownerAction: gap.ownerAction, refreshAge: gap.refreshAge,
      sourceNote: item.record?.gapRefreshes[gap.category]?.note })) });
}

export function ql222CompanyRecurrence(sources: Ql222Sources, ledger: Ql222Ledger, company: OrganizationId) {
  const upstream = ql221CompanyReassessment(sources, sources.refresh, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql222SourceStatus = !record ? 'AWAITING_PREPARED_QL221' : !eligible ? 'UPSTREAM_STALE' :
      record.sourceToken !== tokenFor(item) ? 'EVIDENCE_REFRESH_REVISED' : 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const decision = sourceStatus === 'SOURCE_CURRENT' ? record?.gaps[gap.category] : undefined;
      const followUpAge = decision && record ? Math.max(0, record.cycle - decision.lastCycle) : null;
      const repeatCount = decision?.repeatCount ?? 0;
      const totalRecurrence = gap.recurrenceCount + repeatCount;
      return { ...gap, decision: decision?.recurrence ?? 'NOT_REVIEWED' as const,
        ownerDecision: decision?.ownerDecision ?? 'NOT_DRAFTED' as const,
        repeatCount, totalRecurrence, followUpAge,
        overdue: followUpAge !== null && followUpAge >= 3,
        escalationRequired: totalRecurrence > 0,
        actualEvidenceVerified: false as const, actualIndependentClosure: false as const };
    });
    const undecided = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.decision === 'NOT_REVIEWED').length : gaps.length;
    const overdue = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.overdue).length : 0;
    const escalationsDue = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.escalationRequired &&
      gap.ownerDecision !== 'ESCALATE_INDEPENDENT_DRAFT').length : 0;
    const checksComplete = sourceStatus === 'SOURCE_CURRENT' && QL222_CHECKS.every((check) =>
      record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = sourceStatus === 'SOURCE_CURRENT' && gaps.length > 0 && undecided === 0 &&
      overdue === 0 && escalationsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, undecided, overdue, escalationsDue,
      checksComplete, readyForLocalAudit,
      repeatEvents: gaps.reduce((sum, gap) => sum + gap.repeatCount, 0),
      prepared: readyForLocalAudit && record?.phase === 'independent_hold_recheck_packet_prepared',
      realOwnerDecision: false as const, realIndependentRecheck: false as const,
      realClosure: false as const, transmitted: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) =>
    !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    undecided: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.undecided : 0), 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    escalationsDue: cases.reduce((sum, item) => sum + item.escalationsDue, 0),
    repeatEvents: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.repeatEvents : 0), 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql222Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql222Case): Ql222Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

/** Explicitly starts or resets only an eligible source-current QL-221 fictional audit. */
export function beginQl222Replay(sources: Ql222Sources, ledger: Ql222Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql222Ledger {
  const item = ql221CompanyReassessment(sources, sources.refresh, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const sourceToken = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === sourceToken) return ledger;
  return withCase(ledger, company, scenario, { sourceToken, cycle: 0,
    gaps: {}, checks: {}, phase: 'owner_decision_replay_draft' });
}

/** A repeat increments only once per cycle/category, regardless of how many times its draft is edited. */
export function recordQl222Decision(sources: Ql222Sources, ledger: Ql222Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, recurrence: Ql222Recurrence,
  ownerDecision: Ql222Decision, note: string): Ql222Ledger {
  const item = ql222CompanyRecurrence(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'owner_decision_replay_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['RECONFIRMED_OPEN', 'REPEATED_AFTER_REFRESH', 'SIMULATED_SOURCE_EXCEPTION'].includes(recurrence) ||
      !['MAINTAIN_HOLD_DRAFT', 'REQUEST_EVIDENCE_DRAFT', 'ESCALATE_INDEPENDENT_DRAFT'].includes(ownerDecision) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const isNewRepeat = recurrence === 'REPEATED_AFTER_REFRESH' && previous?.lastRepeatCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { recurrence, ownerDecision,
      note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      repeatCount: (previous?.repeatCount ?? 0) + (isNewRepeat ? 1 : 0),
      lastRepeatCycle: isNewRepeat ? item.record.cycle : previous?.lastRepeatCycle ?? null } } });
}

/** Bounded fictional aging; cannot create reminders or contact an external provider. */
export function advanceQl222Cycle(sources: Ql222Sources, ledger: Ql222Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql222Ledger {
  const item = ql222CompanyRecurrence(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'owner_decision_replay_draft' ||
      item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl222Check(sources: Ql222Sources, ledger: Ql222Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql222Check): Ql222Ledger {
  const item = ql222CompanyRecurrence(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'owner_decision_replay_draft' ||
      !QL222_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

/** Local draft packet only; an independent release hold recheck never lifts a hold or approves real closure. */
export function prepareQl222HoldRecheck(sources: Ql222Sources, ledger: Ql222Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql222Ledger {
  const item = ql222CompanyRecurrence(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'owner_decision_replay_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'independent_hold_recheck_packet_prepared' });
}

export function ql222Portfolio(sources: Ql222Sources, ledger: Ql222Ledger) {
  const companies = operatorOrganizations.map((organization) => ql222CompanyRecurrence(sources, ledger, organization.id));
  const count = (key: 'eligible' | 'tracking' | 'prepared' | 'undecided' | 'overdue' | 'escalationsDue' | 'repeatEvents' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL222_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: count('eligible'), tracking: count('tracking'), prepared: count('prepared'),
    undecided: count('undecided'), overdue: count('overdue'),
    escalationsDue: count('escalationsDue'), repeatEvents: count('repeatEvents'), stale: count('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentReview: false as const, actualOwnerDecision: false as const,
    actualClosure: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const,
    callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** PII-minimized status receipt: no notes, customer details, reviewer identity or source token. */
export function ql222CompanyReceipt(sources: Ql222Sources, ledger: Ql222Ledger, company: OrganizationId): string {
  const summary = ql222CompanyRecurrence(sources, ledger, company);
  return JSON.stringify({ release: QL222_RELEASE, company,
    scope: 'Fictional recurrence, owner-decision and release-hold recheck only',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    undecided: summary.undecided, overdue: summary.overdue,
    escalationsDue: summary.escalationsDue, repeatEvents: summary.repeatEvents,
    stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL222_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, recurrenceCount: gap.totalRecurrence,
        repeatEvents: gap.repeatCount, recurrence: gap.decision, ownerDecision: gap.ownerDecision,
        followUpAge: gap.followUpAge, overdue: gap.overdue,
        independentEvidenceVerified: false, actualClosure: false })),
      realOwnerApproval: false, realIndependentRecheck: false, releaseHold: 'HELD_UNVERIFIED' })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentClosure: false,
    actualOwnerApproval: false, notesIncluded: false, sourceTokensIncluded: false,
    reviewerIdentitiesIncluded: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
