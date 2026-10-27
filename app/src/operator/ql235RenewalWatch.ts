import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql234CompanyContinuity, type Ql234Sources, type Ql234Ledger } from './ql234SourceDriftContinuity';

export const QL235_RELEASE = 'ql235-four-company-source-drift-reopen-aging-independent-renewal-held-release-watch-disabled-preview-v1';
export const QL235_CHECKS = [
  { id: 'UPSTREAM_RENEWAL', title: 'QL-234 evidence renewal source', detail: 'Recompare the prepared fictional QL-234 packet and prior source-drift history.' },
  { id: 'INDEPENDENT_HANDOFF', title: 'Independent renewal handoff', detail: 'Review only unsent independent follow-up and renewed exception drafts.' },
  { id: 'HELD_RELEASE', title: 'Unchanged conditional release holds', detail: 'Inspect twelve actual QL-181 gates, which stay held and unverified.' }
] as const;
export type Ql235Check = typeof QL235_CHECKS[number]['id'];
export type Ql235Renewal = 'RENEWAL_EVIDENCE_PENDING_UNVERIFIED' |
  'SIMULATED_RENEWAL_MATCH_UNVERIFIED' | 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED';
export type Ql235Referral = 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT' |
  'REFER_INDEPENDENT_RENEWAL_DRAFT' | 'REOPEN_INDEPENDENT_EXCEPTION_DRAFT';
export type Ql235Hold = 'HOLD_RECHECK_PENDING_UNVERIFIED' |
  'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED' | 'HELD_PROOF_EXCEPTION_UNVERIFIED';
export type Ql235Gap = Readonly<{ renewal: Ql235Renewal; referral: Ql235Referral; hold: Ql235Hold;
  note: string; lastCycle: number; reopenEvents: number; lastReopenCycle: number | null;
  overdueEpisodes: number }>;
export type Ql235Case = Readonly<{ sourceToken: string; holdToken: string; cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql235Gap>>;
  checks: Partial<Record<Ql235Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'independent_renewal_watch_draft' | 'held_renewal_audit_packet_prepared' }>;
export type Ql235Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql235Case>>>>;
export type Ql235Sources = Ql234Sources & Readonly<{ sourceDrift: Ql234Ledger }>;
export type Ql235SourceStatus = 'AWAITING_PREPARED_QL234' | 'SOURCE_CURRENT' |
  'UPSTREAM_STALE' | 'QL234_EVIDENCE_REVISED' | 'ACTUAL_HOLD_REVISED';

/** Local change-detection marker only: it is not a cryptographic evidence signature. */
function token(value: unknown) {
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-renewal-${(hash >>> 0).toString(16)}`;
}
type SourceCase = ReturnType<typeof ql234CompanyContinuity>['cases'][number];
function sourceToken(item: SourceCase) {
  return token({ upstream: item.record?.sourceToken, hold: item.record?.holdToken,
    phase: item.record?.phase, cycle: item.record?.cycle, checks: item.record?.checks,
    status: item.sourceStatus, gaps: item.gaps.map((gap) => ({ category: gap.category,
      drift: gap.drift, continuity: gap.continuity, hold: gap.hold, driftEvents: gap.driftEvents,
      overdueEpisodes: gap.overdueFollowUpEpisodes, inheritedHoldGap: gap.inheritedHoldGap,
      note: item.record?.gaps[gap.category]?.note })) });
}
function holdToken() { return token(QL181_PREREQUISITES.map(({ id, state }) => ({ id, state }))); }
function holdsIntact() {
  return QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every(({ state }) => state === 'HELD_UNVERIFIED');
}

export function ql235CompanyWatch(sources: Ql235Sources, ledger: Ql235Ledger, company: OrganizationId) {
  const upstream = ql234CompanyContinuity(sources, sources.sourceDrift, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql235SourceStatus = !record ? 'AWAITING_PREPARED_QL234' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== sourceToken(item) ? 'QL234_EVIDENCE_REVISED' :
      record.holdToken !== holdToken() || !holdsIntact() ? 'ACTUAL_HOLD_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const renewal = current?.renewal ?? 'NOT_RENEWED' as const;
      const referral = current?.referral ?? 'NOT_DRAFTED' as const;
      const hold = current?.hold ?? 'NOT_RECHECKED' as const;
      const independentRenewalDue = gap.independentFollowUpDue || gap.driftEvents > 0 ||
        gap.overdueFollowUpEpisodes > 0 || (current?.reopenEvents ?? 0) > 0 ||
        (current?.overdueEpisodes ?? 0) > 0 || renewal === 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED' ||
        hold === 'HELD_PROOF_EXCEPTION_UNVERIFIED';
      return { ...gap, renewal, referral, hold, age, dueSoon: age === 2,
        overdue: age !== null && age >= 3, nextDueCycle: current ? current.lastCycle + 3 : null,
        independentRenewalDue,
        missingIndependentRenewal: independentRenewalDue && referral === 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT',
        reopenEvents: current?.reopenEvents ?? 0, overdueEpisodes: current?.overdueEpisodes ?? 0,
        actualRenewalVerified: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => ['NOT_RENEWED', 'RENEWAL_EVIDENCE_PENDING_UNVERIFIED'].includes(gap.renewal) ||
      ['NOT_RECHECKED', 'HOLD_RECHECK_PENDING_UNVERIFIED'].includes(gap.hold)).length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const reopened = active ? gaps.filter((gap) => gap.renewal === 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED').length : 0;
    const missingRenewals = active ? gaps.filter((gap) => gap.missingIndependentRenewal).length : 0;
    const holdExceptions = active ? gaps.filter((gap) => gap.inheritedHoldGap || gap.hold === 'HELD_PROOF_EXCEPTION_UNVERIFIED').length : 0;
    const reopenEvents = active ? gaps.reduce((sum, gap) => sum + gap.reopenEvents, 0) : 0;
    const overdueEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.overdueEpisodes, 0) : 0;
    const checksComplete = active && QL235_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const ready = active && gaps.length > 0 && !unreviewed && !dueSoon && !overdue && !reopened &&
      !missingRenewals && !holdExceptions && checksComplete && holdsIntact();
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue, reopened,
      missingRenewals, holdExceptions, reopenEvents, overdueEpisodes, checksComplete, ready,
      prepared: ready && record?.phase === 'held_renewal_audit_packet_prepared',
      actualIndependentReview: false as const, actualOwnerAuthorization: false as const,
      conditionalRelease: 'BLOCKED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) =>
    !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    unreviewed: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.unreviewed : 0), 0),
    dueSoon: cases.reduce((sum, item) => sum + item.dueSoon, 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    reopened: cases.reduce((sum, item) => sum + item.reopened, 0),
    missingRenewals: cases.reduce((sum, item) => sum + item.missingRenewals, 0),
    holdExceptions: cases.reduce((sum, item) => sum + item.holdExceptions, 0),
    reopenEvents: cases.reduce((sum, item) => sum + item.reopenEvents, 0),
    overdueEpisodes: cases.reduce((sum, item) => sum + item.overdueEpisodes, 0),
    holdAudit: { held: QL181_PREREQUISITES.filter(({ state }) => state === 'HELD_UNVERIFIED').length,
      expected: 12 as const, allHeld: holdsIntact(), conditionalRelease: 'BLOCKED' as const } };
}
function withCase(ledger: Ql235Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql235Case): Ql235Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}
export function beginQl235Renewal(sources: Ql235Sources, ledger: Ql235Ledger, company: OrganizationId, scenario: Ql211ScenarioId): Ql235Ledger {
  const item = ql234CompanyContinuity(sources, sources.sourceDrift, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length || !holdsIntact()) return ledger;
  const snapshot = sourceToken(item), hold = holdToken();
  if (ledger[company]?.[scenario]?.sourceToken === snapshot && ledger[company]?.[scenario]?.holdToken === hold) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: snapshot, holdToken: hold,
    cycle: 0, gaps: {}, checks: {}, phase: 'independent_renewal_watch_draft' });
}
export function recordQl235Renewal(sources: Ql235Sources, ledger: Ql235Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, renewal: Ql235Renewal, referral: Ql235Referral,
  hold: Ql235Hold, note: string): Ql235Ledger {
  const item = ql235CompanyWatch(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'independent_renewal_watch_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['RENEWAL_EVIDENCE_PENDING_UNVERIFIED', 'SIMULATED_RENEWAL_MATCH_UNVERIFIED', 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED'].includes(renewal) ||
      !['MAINTAIN_HELD_RENEWAL_WATCH_DRAFT', 'REFER_INDEPENDENT_RENEWAL_DRAFT', 'REOPEN_INDEPENDENT_EXCEPTION_DRAFT'].includes(referral) ||
      !['HOLD_RECHECK_PENDING_UNVERIFIED', 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'HELD_PROOF_EXCEPTION_UNVERIFIED'].includes(hold) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && referral !== 'REFER_INDEPENDENT_RENEWAL_DRAFT') return ledger;
  if ((renewal === 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED' || hold === 'HELD_PROOF_EXCEPTION_UNVERIFIED') &&
    referral === 'MAINTAIN_HELD_RENEWAL_WATCH_DRAFT') return ledger;
  const reopen = renewal === 'SIMULATED_DRIFT_EXCEPTION_REOPENED_UNVERIFIED' && previous?.lastReopenCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record, checks: {}, gaps: { ...item.record.gaps,
    [category]: { renewal, referral, hold, note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      reopenEvents: (previous?.reopenEvents ?? 0) + (reopen ? 1 : 0),
      lastReopenCycle: reopen ? item.record.cycle : previous?.lastReopenCycle ?? null,
      overdueEpisodes: (previous?.overdueEpisodes ?? 0) + (overdue ? 1 : 0) } } });
}
export function advanceQl235Cycle(sources: Ql235Sources, ledger: Ql235Ledger, company: OrganizationId, scenario: Ql211ScenarioId): Ql235Ledger {
  const item = ql235CompanyWatch(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
    item.record.phase !== 'independent_renewal_watch_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1, checks: {} });
}
export function acknowledgeQl235Check(sources: Ql235Sources, ledger: Ql235Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, check: Ql235Check): Ql235Ledger {
  const item = ql235CompanyWatch(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'independent_renewal_watch_draft' ||
    !QL235_CHECKS.some((entry) => entry.id === check) || item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record, checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}
export function prepareQl235HeldAudit(sources: Ql235Sources, ledger: Ql235Ledger, company: OrganizationId, scenario: Ql211ScenarioId): Ql235Ledger {
  const item = ql235CompanyWatch(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || !item.ready || item.record.phase !== 'independent_renewal_watch_draft') return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'held_renewal_audit_packet_prepared' });
}
export function ql235Portfolio(sources: Ql235Sources, ledger: Ql235Ledger) {
  const companies = operatorOrganizations.map((organization) => ql235CompanyWatch(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'stale' | 'unreviewed' | 'dueSoon' |
    'overdue' | 'reopened' | 'missingRenewals' | 'holdExceptions' | 'reopenEvents' | 'overdueEpisodes') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL235_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'), stale: total('stale'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'), reopened: total('reopened'),
    missingRenewals: total('missingRenewals'), holdExceptions: total('holdExceptions'),
    reopenEvents: total('reopenEvents'), overdueEpisodes: total('overdueEpisodes'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentReview: false as const, actualOwnerAuthorization: false as const,
    livePilotReady: false as const, providerConnected: false as const,
    externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}
/** Privacy-minimized receipt: deliberately excludes notes, source/hold tokens and identities. */
export function ql235CompanyReceipt(sources: Ql235Sources, ledger: Ql235Ledger, company: OrganizationId) {
  const summary = ql235CompanyWatch(sources, ledger, company);
  return JSON.stringify({ release: QL235_RELEASE, company,
    scope: 'Fictional source drift reopening, independent renewal aging and blocked held-release audit',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared, stale: summary.stale,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    reopened: summary.reopened, reopenEvents: summary.reopenEvents, overdueEpisodes: summary.overdueEpisodes,
    missingRenewals: summary.missingRenewals, holdExceptions: summary.holdExceptions, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL235_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, renewal: gap.renewal,
        referral: gap.referral, hold: gap.hold, age: gap.age, dueSoon: gap.dueSoon,
        overdue: gap.overdue, reopenEvents: gap.reopenEvents, overdueEpisodes: gap.overdueEpisodes,
        independentRenewalDue: gap.independentRenewalDue, actualRenewalVerified: false })),
      conditionalRelease: 'BLOCKED', ownerAuthorization: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', notesIncluded: false, sourceTokensIncluded: false,
    holdTokensIncluded: false, identitiesIncluded: false, externalWrites: 0,
    callsPlaced: 0, messagesSent: 0 }, null, 2);
}
