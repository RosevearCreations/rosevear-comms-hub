import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql233CompanyIntegrity, type Ql233Ledger, type Ql233Sources } from './ql233FollowUpIntegrity';

export const QL234_RELEASE = 'ql234-four-company-held-pilot-evidence-source-drift-independent-reassessment-follow-up-continuity-conditional-release-integrity-recheck-disabled-preview-v1';
export const QL234_CHECKS = [
  { id: 'SOURCE_IDENTITY', title: 'Held-pilot evidence source identity', detail: 'Compare fictional source fingerprints and unresolved drift across company cases.' },
  { id: 'REASSESSMENT_CONTINUITY', title: 'Independent reassessment follow-up continuity', detail: 'Inspect unsent referrals, recurring drift and historical overdue follow-up.' },
  { id: 'CONDITIONAL_RELEASE', title: 'Conditional release hold integrity recheck', detail: 'Recheck all twelve actual QL-181 gates without authorizing provider activation.' }
] as const;
export type Ql234Check = typeof QL234_CHECKS[number]['id'];
export type Ql234Drift = 'SOURCE_IDENTITY_RECHECK_PENDING_UNVERIFIED' |
  'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED' | 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED';
export type Ql234Continuity = 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT' |
  'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT' | 'REOPEN_SOURCE_DRIFT_EXCEPTION_DRAFT';
export type Ql234Hold = 'CONDITIONAL_HOLD_RECHECK_PENDING_UNVERIFIED' |
  'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED' | 'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED';
export type Ql234GapRecord = Readonly<{ drift: Ql234Drift; continuity: Ql234Continuity;
  hold: Ql234Hold; note: string; lastCycle: number; driftEvents: number;
  lastDriftCycle: number | null; overdueFollowUpEpisodes: number }>;
export type Ql234Case = Readonly<{ sourceToken: string; holdToken: string; cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql234GapRecord>>;
  checks: Partial<Record<Ql234Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'source_drift_reassessment_continuity_draft' | 'held_conditional_release_integrity_packet_prepared' }>;
export type Ql234Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql234Case>>>>;
export type Ql234Sources = Ql233Sources & Readonly<{ followUpIntegrity: Ql233Ledger }>;
export type Ql234SourceStatus = 'AWAITING_PREPARED_QL233' | 'SOURCE_CURRENT' |
  'QL233_SOURCE_IDENTITY_REVISED' | 'UPSTREAM_STALE' | 'ACTUAL_RELEASE_HOLD_REVISED';

/** Non-cryptographic local fingerprint. Never an independent attestation of real evidence. */
function fictionalToken(value: unknown): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-drift-${(hash >>> 0).toString(16)}`;
}
type SourceCase = ReturnType<typeof ql233CompanyIntegrity>['cases'][number];
function sourceToken(item: SourceCase): string {
  return fictionalToken({ upstream: item.record?.sourceToken, hold: item.record?.holdToken,
    phase: item.record?.phase, cycle: item.record?.cycle, checks: item.record?.checks,
    sourceStatus: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      followUp: gap.followUp, reassessment: gap.reassessment, integrity: gap.integrity,
      inheritedIntegrityException: gap.inheritedIntegrityException,
      recurrenceEvents: gap.reassessmentRecurrences, overdueEpisodes: gap.historicalOverdueEpisodes,
      note: item.record?.gaps[gap.category]?.note })) });
}
function holdToken(): string {
  return fictionalToken(QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })));
}
function actualHoldsIntact(): boolean {
  return QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every(({ state }) => state === 'HELD_UNVERIFIED');
}

export function ql234CompanyContinuity(sources: Ql234Sources, ledger: Ql234Ledger,
  company: OrganizationId) {
  const upstream = ql233CompanyIntegrity(sources, sources.followUpIntegrity, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql234SourceStatus = !record ? 'AWAITING_PREPARED_QL233' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== sourceToken(item) ? 'QL233_SOURCE_IDENTITY_REVISED' :
      record.holdToken !== holdToken() || !actualHoldsIntact() ? 'ACTUAL_RELEASE_HOLD_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const drift = current?.drift ?? 'NOT_RECHECKED' as const;
      const continuity = current?.continuity ?? 'NOT_DRAFTED' as const;
      const hold = current?.hold ?? 'NOT_REVALIDATED' as const;
      const inheritedHoldGap = gap.inheritedIntegrityException ||
        gap.integrity !== 'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED';
      const independentFollowUpDue = gap.priority === 'P0' || gap.reassessmentRecurrences > 0 ||
        gap.historicalOverdueEpisodes > 0 || gap.recurrenceEvents > 0 || inheritedHoldGap ||
        drift === 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED' ||
        hold === 'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED' ||
        (current?.driftEvents ?? 0) > 0 || (current?.overdueFollowUpEpisodes ?? 0) > 0;
      const missingIndependentFollowUp = independentFollowUpDue && continuity === 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT';
      return { ...gap, drift, continuity, hold, age,
        dueSoon: age === 2, overdue: age !== null && age >= 3,
        nextDueCycle: current ? current.lastCycle + 3 : null,
        inheritedHoldGap, independentFollowUpDue, missingIndependentFollowUp,
        driftEvents: current?.driftEvents ?? 0,
        overdueFollowUpEpisodes: current?.overdueFollowUpEpisodes ?? 0,
        actualSourceVerified: false as const, actualHoldProofVerified: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => gap.drift === 'NOT_RECHECKED' ||
      gap.drift === 'SOURCE_IDENTITY_RECHECK_PENDING_UNVERIFIED' || gap.hold === 'NOT_REVALIDATED' ||
      gap.hold === 'CONDITIONAL_HOLD_RECHECK_PENDING_UNVERIFIED').length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const missingFollowUps = active ? gaps.filter((gap) => gap.missingIndependentFollowUp).length : 0;
    const openDrift = active ? gaps.filter((gap) => gap.drift === 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED').length : 0;
    const driftEvents = active ? gaps.reduce((sum, gap) => sum + gap.driftEvents, 0) : 0;
    const overdueFollowUpEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.overdueFollowUpEpisodes, 0) : 0;
    const holdExceptions = active ? gaps.filter((gap) => gap.inheritedHoldGap ||
      gap.hold === 'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED').length : 0;
    const checksComplete = active && QL234_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && unreviewed === 0 && dueSoon === 0 &&
      overdue === 0 && missingFollowUps === 0 && openDrift === 0 && holdExceptions === 0 &&
      checksComplete && actualHoldsIntact();
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      missingFollowUps, openDrift, driftEvents, overdueFollowUpEpisodes, holdExceptions,
      checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'held_conditional_release_integrity_packet_prepared',
      actualIndependentReassessment: false as const, actualSourceVerified: false as const,
      actualOwnerAuthorization: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
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
    missingFollowUps: cases.reduce((sum, item) => sum + item.missingFollowUps, 0),
    openDrift: cases.reduce((sum, item) => sum + item.openDrift, 0),
    driftEvents: cases.reduce((sum, item) => sum + item.driftEvents, 0),
    overdueFollowUpEpisodes: cases.reduce((sum, item) => sum + item.overdueFollowUpEpisodes, 0),
    holdExceptions: cases.reduce((sum, item) => sum + item.holdExceptions, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter(({ state }) => state === 'HELD_UNVERIFIED').length,
      allHeld: actualHoldsIntact(), conditionalRelease: 'BLOCKED' as const } };
}
function withCase(ledger: Ql234Ledger, company: OrganizationId, scenario: Ql211ScenarioId,
  record: Ql234Case): Ql234Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}
export function beginQl234DriftAudit(sources: Ql234Sources, ledger: Ql234Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql234Ledger {
  const item = ql233CompanyIntegrity(sources, sources.followUpIntegrity, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length || !actualHoldsIntact()) return ledger;
  const token = sourceToken(item), snapshot = holdToken();
  if (ledger[company]?.[scenario]?.sourceToken === token && ledger[company]?.[scenario]?.holdToken === snapshot) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, holdToken: snapshot, cycle: 0,
    gaps: {}, checks: {}, phase: 'source_drift_reassessment_continuity_draft' });
}
export function recordQl234Drift(sources: Ql234Sources, ledger: Ql234Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  drift: Ql234Drift, continuity: Ql234Continuity, hold: Ql234Hold, note: string): Ql234Ledger {
  const item = ql234CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'source_drift_reassessment_continuity_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['SOURCE_IDENTITY_RECHECK_PENDING_UNVERIFIED', 'SIMULATED_SOURCE_IDENTITY_MATCH_UNVERIFIED', 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED'].includes(drift) ||
      !['CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT', 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT', 'REOPEN_SOURCE_DRIFT_EXCEPTION_DRAFT'].includes(continuity) ||
      !['CONDITIONAL_HOLD_RECHECK_PENDING_UNVERIFIED', 'SIMULATED_CONDITIONAL_HOLD_MATCH_UNVERIFIED', 'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED'].includes(hold) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && continuity !== 'REFER_FRESH_INDEPENDENT_FOLLOW_UP_DRAFT') return ledger;
  if ((drift === 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED' ||
      hold === 'CONDITIONAL_HOLD_EXCEPTION_RECONFIRMED_UNVERIFIED') &&
      continuity === 'CONTINUE_INDEPENDENT_HELD_WATCH_DRAFT') return ledger;
  const recurrence = drift === 'SIMULATED_SOURCE_DRIFT_FOUND_UNVERIFIED' &&
    previous?.lastDriftCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: {},
    gaps: { ...item.record.gaps, [category]: { drift, continuity, hold,
      note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      driftEvents: (previous?.driftEvents ?? 0) + (recurrence ? 1 : 0),
      lastDriftCycle: recurrence ? item.record.cycle : previous?.lastDriftCycle ?? null,
      overdueFollowUpEpisodes: (previous?.overdueFollowUpEpisodes ?? 0) + (overdue ? 1 : 0) } } });
}
export function advanceQl234Cycle(sources: Ql234Sources, ledger: Ql234Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql234Ledger {
  const item = ql234CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'source_drift_reassessment_continuity_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1, checks: {} });
}
export function acknowledgeQl234Check(sources: Ql234Sources, ledger: Ql234Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql234Check): Ql234Ledger {
  const item = ql234CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'source_drift_reassessment_continuity_draft' ||
      !QL234_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}
export function prepareQl234HeldRecheck(sources: Ql234Sources, ledger: Ql234Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql234Ledger {
  const item = ql234CompanyContinuity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'source_drift_reassessment_continuity_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'held_conditional_release_integrity_packet_prepared' });
}
export function ql234Portfolio(sources: Ql234Sources, ledger: Ql234Ledger) {
  const companies = operatorOrganizations.map((organization) => ql234CompanyContinuity(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'unreviewed' | 'dueSoon' | 'overdue' |
    'missingFollowUps' | 'openDrift' | 'driftEvents' | 'overdueFollowUpEpisodes' | 'holdExceptions' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL234_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    missingFollowUps: total('missingFollowUps'), openDrift: total('openDrift'), driftEvents: total('driftEvents'),
    overdueFollowUpEpisodes: total('overdueFollowUpEpisodes'), holdExceptions: total('holdExceptions'),
    stale: total('stale'), allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentReassessment: false as const, actualSourceVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Privacy-minimized status-only receipt, without local evidence notes or raw fingerprints. */
export function ql234CompanyReceipt(sources: Ql234Sources, ledger: Ql234Ledger, company: OrganizationId): string {
  const summary = ql234CompanyContinuity(sources, ledger, company);
  return JSON.stringify({ release: QL234_RELEASE, company,
    scope: 'Fictional held-pilot source drift, independent follow-up continuity and conditional release integrity',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    missingFollowUps: summary.missingFollowUps, openDrift: summary.openDrift,
    driftEvents: summary.driftEvents, overdueFollowUpEpisodes: summary.overdueFollowUpEpisodes,
    holdExceptions: summary.holdExceptions, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL234_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, drift: gap.drift,
        continuity: gap.continuity, hold: gap.hold, age: gap.age, dueSoon: gap.dueSoon,
        overdue: gap.overdue, independentFollowUpDue: gap.independentFollowUpDue,
        driftEvents: gap.driftEvents, overdueEpisodes: gap.overdueFollowUpEpisodes,
        actualIndependentReassessment: false, actualSourceVerified: false })),
      conditionalRelease: 'BLOCKED', ownerAuthorization: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentReassessment: false, actualSourceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, holdTokensIncluded: false,
    reviewerIdentitiesIncluded: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
