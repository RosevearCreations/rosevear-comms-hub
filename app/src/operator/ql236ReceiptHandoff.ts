import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql235CompanyWatch, type Ql235Sources, type Ql235Ledger } from './ql235RenewalWatch';

export const QL236_RELEASE = 'ql236-four-company-independent-renewal-handoff-receipt-aging-recurrence-held-release-continuity-disabled-preview-v1';
export const QL236_CHECKS = [
  { id: 'RECEIPT_SOURCE', title: 'Prepared QL-235 receipt source', detail: 'Confirm the fictional renewal packet has not changed or become stale.' },
  { id: 'INDEPENDENT_HANDOFF', title: 'Independent unsent handoff continuity', detail: 'Reconcile fictional receipt exceptions, overdue cycles and new independent follow-up drafts.' },
  { id: 'CONDITIONAL_HOLD', title: 'Conditional release hold integrity', detail: 'Check the twelve real QL-181 prerequisites without authorizing a pilot.' }
] as const;
export type Ql236Check = typeof QL236_CHECKS[number]['id'];
export type Ql236Receipt = 'INDEPENDENT_RECEIPT_PENDING_UNVERIFIED' |
  'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED' | 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED';
export type Ql236Handoff = 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT' |
  'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT' | 'REOPEN_INDEPENDENT_RECEIPT_EXCEPTION_DRAFT';
export type Ql236Hold = 'CONDITIONAL_PROOF_PENDING_UNVERIFIED' |
  'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED' | 'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED';
export type Ql236GapRecord = Readonly<{ receipt: Ql236Receipt; handoff: Ql236Handoff;
  hold: Ql236Hold; note: string; lastCycle: number; exceptionEvents: number;
  lastExceptionCycle: number | null; overdueEpisodes: number }>;
export type Ql236Case = Readonly<{ sourceToken: string; holdToken: string; cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql236GapRecord>>;
  checks: Partial<Record<Ql236Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'independent_receipt_handoff_draft' | 'conditional_held_receipt_packet_prepared' }>;
export type Ql236Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql236Case>>>>;
export type Ql236Sources = Ql235Sources & Readonly<{ renewalWatch: Ql235Ledger }>;
export type Ql236SourceStatus = 'AWAITING_PREPARED_QL235' | 'SOURCE_CURRENT' |
  'UPSTREAM_STALE' | 'QL235_RECEIPT_SOURCE_REVISED' | 'ACTUAL_HOLD_REVISED';

/** Session-only change marker, never a signature of an independently obtained receipt. */
function token(value: unknown) {
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-receipt-${(hash >>> 0).toString(16)}`;
}
type SourceCase = ReturnType<typeof ql235CompanyWatch>['cases'][number];
function sourceToken(item: SourceCase) {
  return token({ upstream: item.record?.sourceToken, hold: item.record?.holdToken,
    phase: item.record?.phase, cycle: item.record?.cycle, checks: item.record?.checks,
    status: item.sourceStatus, gaps: item.gaps.map((gap) => ({ category: gap.category,
      renewal: gap.renewal, referral: gap.referral, hold: gap.hold,
      reopenEvents: gap.reopenEvents, overdueEpisodes: gap.overdueEpisodes,
      independentRenewalDue: gap.independentRenewalDue, inheritedHoldGap: gap.inheritedHoldGap,
      note: item.record?.gaps[gap.category]?.note })) });
}
function holdToken() { return token(QL181_PREREQUISITES.map(({ id, state }) => ({ id, state }))); }
function holdsIntact() {
  return QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every(({ state }) => state === 'HELD_UNVERIFIED');
}

export function ql236CompanyReceipts(sources: Ql236Sources, ledger: Ql236Ledger, company: OrganizationId) {
  const upstream = ql235CompanyWatch(sources, sources.renewalWatch, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql236SourceStatus = !record ? 'AWAITING_PREPARED_QL235' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== sourceToken(item) ? 'QL235_RECEIPT_SOURCE_REVISED' :
      record.holdToken !== holdToken() || !holdsIntact() ? 'ACTUAL_HOLD_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const receipt = current?.receipt ?? 'NOT_RECORDED' as const;
      const handoff = current?.handoff ?? 'NOT_DRAFTED' as const;
      const hold = current?.hold ?? 'NOT_RECHECKED' as const;
      const independentReceiptDue = gap.independentRenewalDue || gap.reopenEvents > 0 ||
        gap.overdueEpisodes > 0 || gap.priority === 'P0' || (current?.exceptionEvents ?? 0) > 0 ||
        (current?.overdueEpisodes ?? 0) > 0 || receipt === 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED' ||
        hold === 'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED';
      return { ...gap, receipt, handoff, hold, age,
        dueSoon: age === 2, overdue: age !== null && age >= 3,
        independentReceiptDue,
        missingIndependentReceipt: independentReceiptDue && handoff === 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT',
        exceptionEvents: current?.exceptionEvents ?? 0,
        overdueEpisodes: current?.overdueEpisodes ?? 0,
        actualReceiptVerified: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => ['NOT_RECORDED', 'INDEPENDENT_RECEIPT_PENDING_UNVERIFIED'].includes(gap.receipt) ||
      ['NOT_RECHECKED', 'CONDITIONAL_PROOF_PENDING_UNVERIFIED'].includes(gap.hold)).length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const openExceptions = active ? gaps.filter((gap) => gap.receipt === 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED').length : 0;
    const missingReceipts = active ? gaps.filter((gap) => gap.missingIndependentReceipt).length : 0;
    const holdExceptions = active ? gaps.filter((gap) => gap.inheritedHoldGap || gap.hold === 'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED').length : 0;
    const exceptionEvents = active ? gaps.reduce((sum, gap) => sum + gap.exceptionEvents, 0) : 0;
    const overdueEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.overdueEpisodes, 0) : 0;
    const checksComplete = active && QL236_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const ready = active && gaps.length > 0 && !unreviewed && !dueSoon && !overdue &&
      !openExceptions && !missingReceipts && !holdExceptions && checksComplete && holdsIntact();
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      openExceptions, missingReceipts, holdExceptions, exceptionEvents, overdueEpisodes,
      checksComplete, ready, prepared: ready && record?.phase === 'conditional_held_receipt_packet_prepared',
      actualIndependentReceipt: false as const, actualOwnerAuthorization: false as const,
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
    openExceptions: cases.reduce((sum, item) => sum + item.openExceptions, 0),
    missingReceipts: cases.reduce((sum, item) => sum + item.missingReceipts, 0),
    holdExceptions: cases.reduce((sum, item) => sum + item.holdExceptions, 0),
    exceptionEvents: cases.reduce((sum, item) => sum + item.exceptionEvents, 0),
    overdueEpisodes: cases.reduce((sum, item) => sum + item.overdueEpisodes, 0),
    holdAudit: { expected: 12 as const, held: QL181_PREREQUISITES.filter(({ state }) => state === 'HELD_UNVERIFIED').length,
      allHeld: holdsIntact(), conditionalRelease: 'BLOCKED' as const } };
}
function withCase(ledger: Ql236Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql236Case): Ql236Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}
export function beginQl236Receipt(sources: Ql236Sources, ledger: Ql236Ledger, company: OrganizationId, scenario: Ql211ScenarioId): Ql236Ledger {
  const item = ql235CompanyWatch(sources, sources.renewalWatch, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length || !holdsIntact()) return ledger;
  const snapshot = sourceToken(item), hold = holdToken();
  if (ledger[company]?.[scenario]?.sourceToken === snapshot && ledger[company]?.[scenario]?.holdToken === hold) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: snapshot, holdToken: hold,
    cycle: 0, gaps: {}, checks: {}, phase: 'independent_receipt_handoff_draft' });
}
export function recordQl236Receipt(sources: Ql236Sources, ledger: Ql236Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, receipt: Ql236Receipt,
  handoff: Ql236Handoff, hold: Ql236Hold, note: string): Ql236Ledger {
  const item = ql236CompanyReceipts(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'independent_receipt_handoff_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['INDEPENDENT_RECEIPT_PENDING_UNVERIFIED', 'SIMULATED_INDEPENDENT_RECEIPT_MATCH_UNVERIFIED', 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED'].includes(receipt) ||
      !['CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT', 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT', 'REOPEN_INDEPENDENT_RECEIPT_EXCEPTION_DRAFT'].includes(handoff) ||
      !['CONDITIONAL_PROOF_PENDING_UNVERIFIED', 'SIMULATED_CONDITIONAL_PROOF_MATCH_UNVERIFIED', 'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED'].includes(hold) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && handoff !== 'REFER_FRESH_INDEPENDENT_RECEIPT_DRAFT') return ledger;
  if ((receipt === 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED' || hold === 'CONDITIONAL_PROOF_EXCEPTION_UNVERIFIED') &&
      handoff === 'CONTINUE_UNSENT_HELD_FOLLOWUP_DRAFT') return ledger;
  const exception = receipt === 'SIMULATED_RECEIPT_EXCEPTION_UNVERIFIED' && previous?.lastExceptionCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record, checks: {}, gaps: { ...item.record.gaps,
    [category]: { receipt, handoff, hold, note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      exceptionEvents: (previous?.exceptionEvents ?? 0) + (exception ? 1 : 0),
      lastExceptionCycle: exception ? item.record.cycle : previous?.lastExceptionCycle ?? null,
      overdueEpisodes: (previous?.overdueEpisodes ?? 0) + (overdue ? 1 : 0) } } });
}
export function advanceQl236Cycle(sources: Ql236Sources, ledger: Ql236Ledger, company: OrganizationId, scenario: Ql211ScenarioId): Ql236Ledger {
  const item = ql236CompanyReceipts(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'independent_receipt_handoff_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1, checks: {} });
}
export function acknowledgeQl236Check(sources: Ql236Sources, ledger: Ql236Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, check: Ql236Check): Ql236Ledger {
  const item = ql236CompanyReceipts(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'independent_receipt_handoff_draft' ||
      !QL236_CHECKS.some((entry) => entry.id === check) || item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}
export function prepareQl236HeldReceipt(sources: Ql236Sources, ledger: Ql236Ledger, company: OrganizationId, scenario: Ql211ScenarioId): Ql236Ledger {
  const item = ql236CompanyReceipts(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || !item.ready || item.record.phase !== 'independent_receipt_handoff_draft') return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'conditional_held_receipt_packet_prepared' });
}
export function ql236Portfolio(sources: Ql236Sources, ledger: Ql236Ledger) {
  const companies = operatorOrganizations.map((org) => ql236CompanyReceipts(sources, ledger, org.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'stale' | 'unreviewed' |
    'dueSoon' | 'overdue' | 'openExceptions' | 'missingReceipts' | 'holdExceptions' |
    'exceptionEvents' | 'overdueEpisodes') => companies.reduce((sum, item) => sum + item[key], 0);
  return { release: QL236_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'), stale: total('stale'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    openExceptions: total('openExceptions'), missingReceipts: total('missingReceipts'),
    holdExceptions: total('holdExceptions'), exceptionEvents: total('exceptionEvents'),
    overdueEpisodes: total('overdueEpisodes'), allReleaseHoldsPreserved: companies.every((item) => item.holdAudit.allHeld),
    actualIndependentReceipt: false as const, actualOwnerAuthorization: false as const,
    livePilotReady: false as const, providerConnected: false as const,
    externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}
/** Status-only local receipt. Never export unsent notes, source tokens or reviewer identity. */
export function ql236CompanyReceipt(sources: Ql236Sources, ledger: Ql236Ledger, company: OrganizationId) {
  const summary = ql236CompanyReceipts(sources, ledger, company);
  return JSON.stringify({ release: QL236_RELEASE, company,
    scope: 'Fictional independent renewal handoff receipt aging and conditional held-pilot continuity',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared, stale: summary.stale,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    openExceptions: summary.openExceptions, missingReceipts: summary.missingReceipts,
    holdExceptions: summary.holdExceptions, exceptionEvents: summary.exceptionEvents,
    overdueEpisodes: summary.overdueEpisodes, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL236_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, receipt: gap.receipt, handoff: gap.handoff,
        hold: gap.hold, age: gap.age, dueSoon: gap.dueSoon, overdue: gap.overdue,
        exceptionEvents: gap.exceptionEvents, overdueEpisodes: gap.overdueEpisodes,
        independentReceiptDue: gap.independentReceiptDue, actualReceiptVerified: false })),
      conditionalRelease: 'BLOCKED', ownerAuthorization: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', notesIncluded: false, sourceTokensIncluded: false,
    holdTokensIncluded: false, identitiesIncluded: false, externalWrites: 0,
    callsPlaced: 0, messagesSent: 0 }, null, 2);
}
