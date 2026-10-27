import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql227CompanyDecisions, type Ql227Ledger, type Ql227Sources } from './ql227DecisionEvidenceAudit';

export const QL228_RELEASE = 'ql228-four-company-owner-evidence-exception-recurrence-independent-handoff-follow-up-conditional-hold-continuity-disabled-preview-v1';
export const QL228_CHECKS = [
  { id: 'EXCEPTION_RECURRENCE', title: 'Evidence exception recurrence', detail: 'Review simulated recurrence events and retained historical exceptions per company.' },
  { id: 'INDEPENDENT_HANDOFF_FOLLOW_UP', title: 'Independent handoff follow-up', detail: 'Review draft reassignment, simulated due dates and unverified reviewer outcomes.' },
  { id: 'CONDITIONAL_HOLD_CONTINUITY', title: 'Conditional hold continuity', detail: 'Recheck that all twelve actual QL-181 prerequisites are HELD_UNVERIFIED.' }
] as const;
export type Ql228Check = typeof QL228_CHECKS[number]['id'];
export type Ql228Exception = 'EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED' | 'SIMULATED_MATCH_UNVERIFIED' |
  'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED';
export type Ql228Handoff = 'MAINTAIN_HELD_HANDOFF_DRAFT' | 'REQUEST_INDEPENDENT_EVIDENCE_DRAFT' |
  'REASSIGN_INDEPENDENT_HANDOFF_DRAFT';
export type Ql228GapRecord = Readonly<{
  exception: Ql228Exception;
  handoff: Ql228Handoff;
  note: string;
  lastCycle: number;
  recurrenceEvents: number;
  lastRecurrenceCycle: number | null;
  overdueHandoffs: number;
}>;
export type Ql228Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql228GapRecord>>;
  checks: Partial<Record<Ql228Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'independent_handoff_recurrence_follow_up_draft' | 'conditional_hold_continuity_packet_prepared';
}>;
export type Ql228Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql228Case>>>>;
export type Ql228Sources = Ql227Sources & Readonly<{ evidenceAudit: Ql227Ledger }>;
export type Ql228SourceStatus = 'AWAITING_PREPARED_QL227' | 'SOURCE_CURRENT' |
  'QL227_EVIDENCE_DECISION_REVISED' | 'UPSTREAM_STALE';

function fingerprint(value: unknown): string {
  // This is only a fictional in-browser change detector, never proof of evidence identity.
  let valueHash = 2166136261;
  for (const char of JSON.stringify(value)) { valueHash ^= char.charCodeAt(0); valueHash = Math.imul(valueHash, 16777619); }
  return `fictional-handoff-${(valueHash >>> 0).toString(16)}`;
}
type UpstreamCase = ReturnType<typeof ql227CompanyDecisions>['cases'][number];
function tokenFor(item: UpstreamCase): string {
  return fingerprint({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, sourceStatus: item.sourceStatus,
    checks: item.record?.checks, gaps: item.gaps.map((gap) => ({ category: gap.category,
      reconciledEvidence: gap.reconciledEvidence, ownerDecision: gap.ownerDecision,
      priority: gap.priority, independentDue: gap.independentDue, overdueDecisions: gap.overdueDecisions,
      reconciliationConflicts: gap.reconciliationConflicts, note: item.record?.gaps[gap.category]?.note })) });
}

export function ql228CompanyContinuity(sources: Ql228Sources, ledger: Ql228Ledger, company: OrganizationId) {
  const upstream = ql227CompanyDecisions(sources, sources.evidenceAudit, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql228SourceStatus = !record ? 'AWAITING_PREPARED_QL227' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== tokenFor(item) ? 'QL227_EVIDENCE_DECISION_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const exception = current?.exception ?? 'NOT_RECONCILED' as const;
      const handoff = current?.handoff ?? 'NOT_DRAFTED' as const;
      const independentDue = gap.independentDue || gap.priority === 'P0' ||
        gap.reconciliationConflicts > 0 || gap.overdueDecisions > 0 ||
        gap.referralMissing || exception === 'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED' ||
        (current?.recurrenceEvents ?? 0) > 0 || (current?.overdueHandoffs ?? 0) > 0;
      return { ...gap, exception, handoff, handoffAge: age,
        nextDueCycle: current ? current.lastCycle + 3 : null,
        dueSoon: age !== null && age === 2, overdue: age !== null && age >= 3,
        independentDue, handoffMissing: independentDue && handoff !== 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT',
        recurrenceEvents: current?.recurrenceEvents ?? 0, overdueHandoffs: current?.overdueHandoffs ?? 0,
        actualIndependentHandoff: false as const, actualEvidenceDisposition: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => gap.exception === 'NOT_RECONCILED').length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const handoffsDue = active ? gaps.filter((gap) => gap.handoffMissing).length : 0;
    const recurring = active ? gaps.filter((gap) => gap.exception === 'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED').length : 0;
    const recurrenceEvents = active ? gaps.reduce((total, gap) => total + gap.recurrenceEvents, 0) : 0;
    const overdueHandoffs = active ? gaps.reduce((total, gap) => total + gap.overdueHandoffs, 0) : 0;
    const checksComplete = active && QL228_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && unreviewed === 0 && overdue === 0 &&
      handoffsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      handoffsDue, recurring, recurrenceEvents, overdueHandoffs, checksComplete,
      readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'conditional_hold_continuity_packet_prepared',
      actualOwnerDecision: false as const, actualIndependentHandoff: false as const,
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
    handoffsDue: cases.reduce((sum, item) => sum + item.handoffsDue, 0),
    recurring: cases.reduce((sum, item) => sum + item.recurring, 0),
    recurrenceEvents: cases.reduce((sum, item) => sum + item.recurrenceEvents, 0),
    overdueHandoffs: cases.reduce((sum, item) => sum + item.overdueHandoffs, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql228Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql228Case): Ql228Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

export function beginQl228FollowUp(sources: Ql228Sources, ledger: Ql228Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql228Ledger {
  const item = ql227CompanyDecisions(sources, sources.evidenceAudit, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const token = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === token) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, cycle: 0, gaps: {}, checks: {},
    phase: 'independent_handoff_recurrence_follow_up_draft' });
}

/** All decisions remain in-browser synthetic drafts and cannot release a real communication hold. */
export function recordQl228FollowUp(sources: Ql228Sources, ledger: Ql228Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  exception: Ql228Exception, handoff: Ql228Handoff, note: string): Ql228Ledger {
  const item = ql228CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_handoff_recurrence_follow_up_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['EVIDENCE_EXCEPTION_STILL_OPEN_UNVERIFIED', 'SIMULATED_MATCH_UNVERIFIED', 'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED'].includes(exception) ||
      !['MAINTAIN_HELD_HANDOFF_DRAFT', 'REQUEST_INDEPENDENT_EVIDENCE_DRAFT', 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT'].includes(handoff) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && handoff !== 'REASSIGN_INDEPENDENT_HANDOFF_DRAFT') return ledger;
  const newRecurrence = exception === 'SIMULATED_RECURRENT_EXCEPTION_UNVERIFIED' &&
    previous?.lastRecurrenceCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record, gaps: { ...item.record.gaps,
    [category]: { exception, handoff, note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      recurrenceEvents: (previous?.recurrenceEvents ?? 0) + (newRecurrence ? 1 : 0),
      lastRecurrenceCycle: newRecurrence ? item.record.cycle : previous?.lastRecurrenceCycle ?? null,
      overdueHandoffs: (previous?.overdueHandoffs ?? 0) + (overdue ? 1 : 0) } } });
}

export function advanceQl228Cycle(sources: Ql228Sources, ledger: Ql228Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql228Ledger {
  const item = ql228CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_handoff_recurrence_follow_up_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl228Check(sources: Ql228Sources, ledger: Ql228Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql228Check): Ql228Ledger {
  const item = ql228CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_handoff_recurrence_follow_up_draft' ||
      !QL228_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

export function prepareQl228Continuity(sources: Ql228Sources, ledger: Ql228Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql228Ledger {
  const item = ql228CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'independent_handoff_recurrence_follow_up_draft' ||
      !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'conditional_hold_continuity_packet_prepared' });
}

export function ql228Portfolio(sources: Ql228Sources, ledger: Ql228Ledger) {
  const companies = operatorOrganizations.map((organization) => ql228CompanyContinuity(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'unreviewed' | 'dueSoon' |
    'overdue' | 'handoffsDue' | 'recurring' | 'recurrenceEvents' | 'overdueHandoffs' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL228_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    handoffsDue: total('handoffsDue'), recurring: total('recurring'),
    recurrenceEvents: total('recurrenceEvents'), overdueHandoffs: total('overdueHandoffs'), stale: total('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentHandoff: false as const, actualEvidenceVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Redacted coded in-browser statuses only: never emit private notes or source fingerprints. */
export function ql228CompanyReceipt(sources: Ql228Sources, ledger: Ql228Ledger, company: OrganizationId): string {
  const summary = ql228CompanyContinuity(sources, ledger, company);
  return JSON.stringify({ release: QL228_RELEASE, company,
    scope: 'Fictional evidence exception recurrence and independent handoff follow-up held-release audit',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    handoffsDue: summary.handoffsDue, recurring: summary.recurring,
    recurrenceEvents: summary.recurrenceEvents, overdueHandoffs: summary.overdueHandoffs,
    stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL228_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, exception: gap.exception,
        handoff: gap.handoff, handoffAge: gap.handoffAge, nextDueCycle: gap.nextDueCycle,
        dueSoon: gap.dueSoon, overdue: gap.overdue, handoffMissing: gap.handoffMissing,
        recurrenceEvents: gap.recurrenceEvents, overdueHandoffs: gap.overdueHandoffs,
        actualIndependentHandoff: false, actualEvidenceVerified: false })),
      conditionalRelease: 'BLOCKED', actualOwnerAuthorization: false, independentHoldReleased: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentHandoff: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
