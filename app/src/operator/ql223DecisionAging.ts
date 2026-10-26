import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql222CompanyRecurrence, type Ql222Ledger, type Ql222Sources } from './ql222ExceptionRecurrence';

export const QL223_RELEASE = 'ql223-four-company-owner-decision-aging-evidence-follow-up-conditional-hold-oversight-disabled-preview-v1';
export const QL223_CHECKS = [
  { id: 'OWNER_AGING_REPLAY', title: 'Recheck local owner decision aging', detail: 'Check all case and gap ages against the fictional follow-up cycle and retain overdue holds.' },
  { id: 'EVIDENCE_EXCEPTION_CHAIN', title: 'Trace exception evidence follow-up', detail: 'Review invented evidence statuses and unsent referrals without presenting any source as verified.' },
  { id: 'CONDITIONAL_HOLD_OVERSIGHT', title: 'Preserve conditional release holds', detail: 'All twelve QL-181 real pilot prerequisites remain HELD_UNVERIFIED, regardless of this local packet.' }
] as const;
export type Ql223Check = typeof QL223_CHECKS[number]['id'];
export type Ql223Evidence = 'REQUEST_PENDING_UNSENT' | 'FICTIONAL_REFRESH_NOTED' | 'FICTIONAL_EXCEPTION_RECURRED';
export type Ql223OwnerRoute = 'CONTINUE_HOLD_DRAFT' | 'REQUEST_MORE_EVIDENCE_DRAFT' | 'REFER_INDEPENDENT_DRAFT';
export type Ql223FollowUp = Readonly<{
  evidence: Ql223Evidence;
  ownerRoute: Ql223OwnerRoute;
  note: string;
  lastUpdatedCycle: number;
  exceptionEvents: number;
  lastExceptionCycle: number | null;
}>;
export type Ql223Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql223FollowUp>>;
  checks: Partial<Record<Ql223Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'follow_up_aging_draft' | 'conditional_hold_oversight_packet_prepared';
}>;
export type Ql223Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql223Case>>>>;
export type Ql223Sources = Ql222Sources & Readonly<{ exception: Ql222Ledger }>;
export type Ql223SourceStatus = 'AWAITING_PREPARED_QL222' | 'SOURCE_CURRENT' | 'QL222_DECISION_REVISED' | 'UPSTREAM_STALE';

function fingerprint(source: unknown): string {
  // Fictional browser-session invalidation hint only; never a real evidence signature.
  let hash = 2166136261;
  for (const char of JSON.stringify(source)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `simulated-followup-${(hash >>> 0).toString(16)}`;
}

type Ql222View = ReturnType<typeof ql222CompanyRecurrence>['cases'][number];
function fingerprintFor(item: Ql222View) {
  return fingerprint({ source: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, status: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      recurrenceCount: gap.totalRecurrence, ownerDecision: gap.ownerDecision,
      decision: gap.decision, followUpAge: gap.followUpAge,
      upstreamNote: item.record?.gaps[gap.category]?.note })) });
}

export function ql223CompanyAging(sources: Ql223Sources, ledger: Ql223Ledger, company: OrganizationId) {
  const previous = ql222CompanyRecurrence(sources, sources.exception, company);
  const cases = previous.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql223SourceStatus = !record ? 'AWAITING_PREPARED_QL222' : !eligible ? 'UPSTREAM_STALE' :
      record.sourceToken !== fingerprintFor(item) ? 'QL222_DECISION_REVISED' : 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const followUp = sourceStatus === 'SOURCE_CURRENT' ? record?.gaps[gap.category] : undefined;
      const age = followUp && record ? Math.max(0, record.cycle - followUp.lastUpdatedCycle) : null;
      const evidence = followUp?.evidence ?? 'NOT_REVIEWED' as const;
      const ownerRoute = followUp?.ownerRoute ?? 'NOT_DRAFTED' as const;
      const oversightNeeded = gap.totalRecurrence > 0 || gap.priority === 'P0' ||
        evidence === 'FICTIONAL_EXCEPTION_RECURRED';
      return { ...gap, evidence, ownerRoute, followUpAge: age,
        dueAtCycle: followUp ? followUp.lastUpdatedCycle + 3 : null,
        approaching: age !== null && age === 2,
        overdue: age !== null && age >= 3,
        oversightNeeded, referralDue: oversightNeeded && ownerRoute !== 'REFER_INDEPENDENT_DRAFT',
        exceptionEvents: followUp?.exceptionEvents ?? 0,
        independentEvidenceVerified: false as const, actualOwnerApproval: false as const };
    });
    const active = sourceStatus === 'SOURCE_CURRENT';
    const undecided = active ? gaps.filter((gap) => gap.evidence === 'NOT_REVIEWED').length : gaps.length;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const approaching = active ? gaps.filter((gap) => gap.approaching).length : 0;
    const referralsDue = active ? gaps.filter((gap) => gap.referralDue).length : 0;
    const pendingEvidence = active ? gaps.filter((gap) => gap.evidence === 'REQUEST_PENDING_UNSENT').length : 0;
    const checksComplete = active && QL223_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && undecided === 0 && overdue === 0 &&
      referralsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, undecided, overdue, approaching,
      referralsDue, pendingEvidence, checksComplete, readyForLocalAudit,
      exceptionEvents: active ? gaps.reduce((sum, gap) => sum + gap.exceptionEvents, 0) : 0,
      prepared: readyForLocalAudit && record?.phase === 'conditional_hold_oversight_packet_prepared',
      actualEvidenceVerified: false as const, actualOwnerApproval: false as const,
      independentHoldReleased: false as const, realClosure: false as const,
      transmitted: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) =>
    !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    undecided: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.undecided : 0), 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    approaching: cases.reduce((sum, item) => sum + item.approaching, 0),
    referralsDue: cases.reduce((sum, item) => sum + item.referralsDue, 0),
    pendingEvidence: cases.reduce((sum, item) => sum + item.pendingEvidence, 0),
    exceptionEvents: cases.reduce((sum, item) => sum + item.exceptionEvents, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 &&
        QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql223Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql223Case): Ql223Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

/** Explicit start or case-only reset when upstream QL-222 is prepared and source current. */
export function beginQl223FollowUp(sources: Ql223Sources, ledger: Ql223Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql223Ledger {
  const item = ql222CompanyRecurrence(sources, sources.exception, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const sourceToken = fingerprintFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === sourceToken) return ledger;
  return withCase(ledger, company, scenario, { sourceToken, cycle: 0, gaps: {}, checks: {}, phase: 'follow_up_aging_draft' });
}

/** No real owner approval: recorded evidence and disposition are fictional, unsent classifications. */
export function recordQl223FollowUp(sources: Ql223Sources, ledger: Ql223Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  evidence: Ql223Evidence, ownerRoute: Ql223OwnerRoute, note: string): Ql223Ledger {
  const item = ql223CompanyAging(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'follow_up_aging_draft' || !item.gaps.some((gap) => gap.category === category) ||
      !['REQUEST_PENDING_UNSENT', 'FICTIONAL_REFRESH_NOTED', 'FICTIONAL_EXCEPTION_RECURRED'].includes(evidence) ||
      !['CONTINUE_HOLD_DRAFT', 'REQUEST_MORE_EVIDENCE_DRAFT', 'REFER_INDEPENDENT_DRAFT'].includes(ownerRoute) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const newException = evidence === 'FICTIONAL_EXCEPTION_RECURRED' &&
    previous?.lastExceptionCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { evidence, ownerRoute, note: note.trim().slice(0, 180),
      lastUpdatedCycle: item.record.cycle,
      exceptionEvents: (previous?.exceptionEvents ?? 0) + (newException ? 1 : 0),
      lastExceptionCycle: newException ? item.record.cycle : previous?.lastExceptionCycle ?? null } } });
}

export function advanceQl223Cycle(sources: Ql223Sources, ledger: Ql223Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql223Ledger {
  const item = ql223CompanyAging(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'follow_up_aging_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl223Check(sources: Ql223Sources, ledger: Ql223Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql223Check): Ql223Ledger {
  const item = ql223CompanyAging(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'follow_up_aging_draft' ||
      !QL223_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

/** Locks a local status packet; cannot lift any real hold or certify any evidence. */
export function prepareQl223HoldOversight(sources: Ql223Sources, ledger: Ql223Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql223Ledger {
  const item = ql223CompanyAging(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'follow_up_aging_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'conditional_hold_oversight_packet_prepared' });
}

export function ql223Portfolio(sources: Ql223Sources, ledger: Ql223Ledger) {
  const companies = operatorOrganizations.map((org) => ql223CompanyAging(sources, ledger, org.id));
  const count = (key: 'eligible' | 'tracking' | 'prepared' | 'undecided' | 'overdue' |
    'approaching' | 'referralsDue' | 'pendingEvidence' | 'exceptionEvents' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL223_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: count('eligible'), tracking: count('tracking'), prepared: count('prepared'),
    undecided: count('undecided'), overdue: count('overdue'), approaching: count('approaching'),
    referralsDue: count('referralsDue'), pendingEvidence: count('pendingEvidence'),
    exceptionEvents: count('exceptionEvents'), stale: count('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualOwnerApproval: false as const, actualIndependentRecheck: false as const,
    actualClosure: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const,
    callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Fixed-shape redacted status receipt: notes, source fingerprints and people are excluded. */
export function ql223CompanyReceipt(sources: Ql223Sources, ledger: Ql223Ledger, company: OrganizationId): string {
  const summary = ql223CompanyAging(sources, ledger, company);
  return JSON.stringify({ release: QL223_RELEASE, company,
    scope: 'Fictional owner decision aging and conditional release hold oversight',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    undecided: summary.undecided, overdue: summary.overdue, approaching: summary.approaching,
    referralsDue: summary.referralsDue, pendingEvidence: summary.pendingEvidence,
    exceptionEvents: summary.exceptionEvents, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL223_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, evidence: gap.evidence,
        ownerRoute: gap.ownerRoute, followUpAge: gap.followUpAge, dueAtCycle: gap.dueAtCycle,
        overdue: gap.overdue, approaching: gap.approaching, referralDue: gap.referralDue,
        exceptionEvents: gap.exceptionEvents, independentEvidenceVerified: false, realOwnerApproval: false })),
      conditionalRelease: 'BLOCKED', actualOwnerApproval: false, actualIndependentRecheck: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentRecheck: false, actualClosure: false,
    notesIncluded: false, sourceTokensIncluded: false, personIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
