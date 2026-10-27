import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql226CompanyReopens, type Ql226Ledger, type Ql226Sources } from './ql226RecurrenceReopen';

export const QL227_RELEASE = 'ql227-four-company-reopened-recurrence-owner-decision-aging-independent-follow-up-evidence-reconciliation-held-release-audit-disabled-preview-v1';
export const QL227_CHECKS = [
  { id: 'OWNER_DECISION_AGING', title: 'Reopened owner decision aging', detail: 'Inspect fictional owner decisions and retained overdue follow-up episodes.' },
  { id: 'INDEPENDENT_EVIDENCE_RECONCILIATION', title: 'Independent follow-up evidence reconciliation', detail: 'Reconcile invented evidence match or source conflict without claiming actual independent verification.' },
  { id: 'HELD_RELEASE_AUDIT', title: 'Held-release audit', detail: 'Confirm all twelve QL-181 pilot prerequisites remain HELD_UNVERIFIED and real conditional release blocked.' }
] as const;
export type Ql227Check = typeof QL227_CHECKS[number]['id'];
export type Ql227Evidence = 'EVIDENCE_STILL_OPEN_UNVERIFIED' | 'SIMULATED_MATCH_UNVERIFIED' | 'SIMULATED_CONFLICT_UNVERIFIED';
export type Ql227Decision = 'CONTINUE_HELD_FOLLOW_UP_DRAFT' | 'REQUEST_OWNER_EVIDENCE_DRAFT' | 'REFER_INDEPENDENT_RECHECK_DRAFT';
export type Ql227GapRecord = Readonly<{
  evidence: Ql227Evidence;
  decision: Ql227Decision;
  note: string;
  lastCycle: number;
  overdueDecisions: number;
  conflictEvents: number;
  lastConflictCycle: number | null;
}>;
export type Ql227Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql227GapRecord>>;
  checks: Partial<Record<Ql227Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'reopened_owner_decision_evidence_reconciliation_draft' | 'held_release_follow_up_audit_packet_prepared';
}>;
export type Ql227Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql227Case>>>>;
export type Ql227Sources = Ql226Sources & Readonly<{ reopenReview: Ql226Ledger }>;
export type Ql227SourceStatus = 'AWAITING_PREPARED_QL226' | 'SOURCE_CURRENT' | 'QL226_REOPEN_OUTCOME_REVISED' | 'UPSTREAM_STALE';

function sourceToken(source: unknown): string {
  // Only a fictional source-revision marker. This is not a cryptographic signature or real evidence receipt.
  let hash = 2166136261;
  for (const char of JSON.stringify(source)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `synthetic-reconciliation-${(hash >>> 0).toString(16)}`;
}
type Ql226View = ReturnType<typeof ql226CompanyReopens>['cases'][number];
function tokenFor(item: Ql226View) {
  return sourceToken({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, sourceStatus: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, outcome: gap.outcome,
      reopenRoute: gap.reopenRoute, priority: gap.priority, followUpAge: gap.followUpAge,
      reopenEvents: gap.reopenEvents, overdueFollowUps: gap.overdueFollowUps,
      note: item.record?.gaps[gap.category]?.note })) });
}

export function ql227CompanyDecisions(sources: Ql227Sources, ledger: Ql227Ledger, company: OrganizationId) {
  const upstream = ql226CompanyReopens(sources, sources.reopenReview, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql227SourceStatus = !record ? 'AWAITING_PREPARED_QL226' : !eligible ? 'UPSTREAM_STALE' :
      record.sourceToken !== tokenFor(item) ? 'QL226_REOPEN_OUTCOME_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const evidence = current?.evidence ?? 'NOT_RECONCILED' as const;
      const decision = current?.decision ?? 'NOT_DRAFTED' as const;
      const independentDue = gap.priority === 'P0' || gap.totalRecurrence > 0 ||
        gap.reopenEvents > 0 || gap.overdueFollowUps > 0 ||
        gap.overdueEscalations > 0 || gap.conflictEvents > 0 ||
        gap.discrepancyEvents > 0 || gap.overdueEpisodes > 0 ||
        evidence === 'SIMULATED_CONFLICT_UNVERIFIED' ||
        (current?.overdueDecisions ?? 0) > 0;
      return { ...gap, reconciledEvidence: evidence, ownerDecision: decision, decisionAge: age,
        nextDueCycle: current ? current.lastCycle + 3 : null,
        dueSoon: age !== null && age === 2, overdue: age !== null && age >= 3,
        independentDue, referralMissing: independentDue && decision !== 'REFER_INDEPENDENT_RECHECK_DRAFT',
        overdueDecisions: current?.overdueDecisions ?? 0,
        reconciliationConflicts: current?.conflictEvents ?? 0,
        actualIndependentVerification: false as const, actualOwnerApproval: false as const };
    });
    const undecided = active ? gaps.filter((gap) => gap.reconciledEvidence === 'NOT_RECONCILED').length : gaps.length;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const referralsDue = active ? gaps.filter((gap) => gap.referralMissing).length : 0;
    const evidenceOpen = active ? gaps.filter((gap) => gap.reconciledEvidence === 'EVIDENCE_STILL_OPEN_UNVERIFIED').length : 0;
    const conflicts = active ? gaps.filter((gap) => gap.reconciledEvidence === 'SIMULATED_CONFLICT_UNVERIFIED').length : 0;
    const overdueDecisions = active ? gaps.reduce((sum, gap) => sum + gap.overdueDecisions, 0) : 0;
    const conflictEvents = active ? gaps.reduce((sum, gap) => sum + gap.reconciliationConflicts, 0) : 0;
    const checksComplete = active && QL227_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && undecided === 0 && overdue === 0 &&
      referralsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, undecided, overdue, dueSoon,
      referralsDue, evidenceOpen, conflicts, overdueDecisions, conflictEvents,
      checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'held_release_follow_up_audit_packet_prepared',
      realEvidenceVerified: false as const, realIndependentDecision: false as const,
      realOwnerAuthorization: false as const, transmitted: false as const,
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
    evidenceOpen: cases.reduce((sum, item) => sum + item.evidenceOpen, 0),
    conflicts: cases.reduce((sum, item) => sum + item.conflicts, 0),
    overdueDecisions: cases.reduce((sum, item) => sum + item.overdueDecisions, 0),
    conflictEvents: cases.reduce((sum, item) => sum + item.conflictEvents, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 &&
        QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql227Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql227Case): Ql227Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

export function beginQl227Audit(sources: Ql227Sources, ledger: Ql227Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql227Ledger {
  const item = ql226CompanyReopens(sources, sources.reopenReview, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const fingerprint = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === fingerprint) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: fingerprint, cycle: 0, gaps: {}, checks: {},
    phase: 'reopened_owner_decision_evidence_reconciliation_draft' });
}

/** Simulated independent evidence never satisfies any actual QL-181 prerequisite. */
export function recordQl227Decision(sources: Ql227Sources, ledger: Ql227Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  evidence: Ql227Evidence, decision: Ql227Decision, note: string): Ql227Ledger {
  const item = ql227CompanyDecisions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reopened_owner_decision_evidence_reconciliation_draft' || !item.gaps.some((gap) => gap.category === category) ||
      !['EVIDENCE_STILL_OPEN_UNVERIFIED', 'SIMULATED_MATCH_UNVERIFIED', 'SIMULATED_CONFLICT_UNVERIFIED'].includes(evidence) ||
      !['CONTINUE_HELD_FOLLOW_UP_DRAFT', 'REQUEST_OWNER_EVIDENCE_DRAFT', 'REFER_INDEPENDENT_RECHECK_DRAFT'].includes(decision) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const wasOverdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (wasOverdue && decision !== 'REFER_INDEPENDENT_RECHECK_DRAFT') return ledger;
  const newConflict = evidence === 'SIMULATED_CONFLICT_UNVERIFIED' && previous?.lastConflictCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { evidence, decision, note: note.trim().slice(0, 180),
      lastCycle: item.record.cycle,
      overdueDecisions: (previous?.overdueDecisions ?? 0) + (wasOverdue ? 1 : 0),
      conflictEvents: (previous?.conflictEvents ?? 0) + (newConflict ? 1 : 0),
      lastConflictCycle: newConflict ? item.record.cycle : previous?.lastConflictCycle ?? null } } });
}

export function advanceQl227Cycle(sources: Ql227Sources, ledger: Ql227Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql227Ledger {
  const item = ql227CompanyDecisions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reopened_owner_decision_evidence_reconciliation_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl227Check(sources: Ql227Sources, ledger: Ql227Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql227Check): Ql227Ledger {
  const item = ql227CompanyDecisions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'reopened_owner_decision_evidence_reconciliation_draft' ||
      !QL227_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

export function prepareQl227HeldAudit(sources: Ql227Sources, ledger: Ql227Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql227Ledger {
  const item = ql227CompanyDecisions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'reopened_owner_decision_evidence_reconciliation_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'held_release_follow_up_audit_packet_prepared' });
}

export function ql227Portfolio(sources: Ql227Sources, ledger: Ql227Ledger) {
  const companies = operatorOrganizations.map((org) => ql227CompanyDecisions(sources, ledger, org.id));
  const count = (key: 'eligible' | 'tracking' | 'prepared' | 'undecided' | 'overdue' | 'dueSoon' |
    'referralsDue' | 'evidenceOpen' | 'conflicts' | 'overdueDecisions' | 'conflictEvents' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL227_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: count('eligible'), tracking: count('tracking'), prepared: count('prepared'),
    undecided: count('undecided'), overdue: count('overdue'), dueSoon: count('dueSoon'),
    referralsDue: count('referralsDue'), evidenceOpen: count('evidenceOpen'), conflicts: count('conflicts'),
    overdueDecisions: count('overdueDecisions'), conflictEvents: count('conflictEvents'), stale: count('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualEvidenceVerified: false as const, actualIndependentReview: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const,
    callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Only coded fictional outcomes and cycle counts, excluding notes, people and evidence fingerprints. */
export function ql227CompanyReceipt(sources: Ql227Sources, ledger: Ql227Ledger, company: OrganizationId): string {
  const summary = ql227CompanyDecisions(sources, ledger, company);
  return JSON.stringify({ release: QL227_RELEASE, company,
    scope: 'Reopened fictional owner decision aging and independent follow-up evidence reconciliation with held release audit',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    undecided: summary.undecided, overdue: summary.overdue, dueSoon: summary.dueSoon,
    referralsDue: summary.referralsDue, evidenceOpen: summary.evidenceOpen,
    conflicts: summary.conflicts, overdueDecisions: summary.overdueDecisions,
    conflictEvents: summary.conflictEvents, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL227_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, evidence: gap.reconciledEvidence,
        ownerDecision: gap.ownerDecision, decisionAge: gap.decisionAge,
        nextDueCycle: gap.nextDueCycle, overdue: gap.overdue, dueSoon: gap.dueSoon,
        referralMissing: gap.referralMissing, overdueDecisions: gap.overdueDecisions,
        conflictEvents: gap.reconciliationConflicts, actualEvidenceVerified: false,
        actualIndependentReview: false })),
      conditionalRelease: 'BLOCKED', realOwnerAuthorization: false, independentHoldReleased: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentReview: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
