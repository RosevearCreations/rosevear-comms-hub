import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql224CompanyEscalations, type Ql224Ledger, type Ql224Sources } from './ql224OverdueEscalation';

export const QL225_RELEASE = 'ql225-four-company-escalation-outcome-follow-up-aging-independent-evidence-disposition-held-release-reassessment-disabled-preview-v1';
export const QL225_CHECKS = [
  { id: 'OUTCOME_AGING', title: 'Escalation outcome aging', detail: 'Review invented decision ages, follow-up deadlines and retained overdue episodes.' },
  { id: 'INDEPENDENT_DISPOSITION', title: 'Independent evidence disposition', detail: 'Check unverified fictional evidence results and unsent reviewer routes without closing real gaps.' },
  { id: 'HELD_RELEASE_REASSESSMENT', title: 'Held-release reassessment', detail: 'Recheck all twelve actual release holds without claiming pilot approval or independent clearance.' }
] as const;
export type Ql225Check = typeof QL225_CHECKS[number]['id'];
export type Ql225Disposition = 'EVIDENCE_PENDING_UNVERIFIED' | 'SIMULATED_REVIEW_NOTED_UNVERIFIED' | 'SIMULATED_DISCREPANCY_UNVERIFIED';
export type Ql225FollowUp = 'CONTINUE_HELD_MONITOR_DRAFT' | 'REQUEST_EVIDENCE_DRAFT' | 'REFER_INDEPENDENT_DRAFT';
export type Ql225GapRecord = Readonly<{
  disposition: Ql225Disposition;
  followUp: Ql225FollowUp;
  note: string;
  lastCycle: number;
  overdueEpisodes: number;
  discrepancyEvents: number;
  lastDiscrepancyCycle: number | null;
}>;
export type Ql225Case = Readonly<{
  sourceToken: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql225GapRecord>>;
  checks: Partial<Record<Ql225Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'escalation_outcome_disposition_draft' | 'held_release_reassessment_packet_prepared';
}>;
export type Ql225Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql225Case>>>>;
export type Ql225Sources = Ql224Sources & Readonly<{ overdue: Ql224Ledger }>;
export type Ql225SourceStatus = 'AWAITING_PREPARED_QL224' | 'SOURCE_CURRENT' | 'QL224_OUTCOME_REVISED' | 'UPSTREAM_STALE';

function sourceToken(source: unknown): string {
  // Synthetic source revision marker only. It is never a cryptographic signature or real attestation.
  let hash = 2166136261;
  for (const char of JSON.stringify(source)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-disposition-${(hash >>> 0).toString(16)}`;
}
type Ql224View = ReturnType<typeof ql224CompanyEscalations>['cases'][number];
function tokenFor(item: Ql224View): string {
  return sourceToken({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, sourceStatus: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, evidence: gap.evidence,
      route: gap.route, priority: gap.priority, followUpAge: gap.followUpAge,
      overdueEscalations: gap.overdueEscalations, conflictEvents: gap.conflictEvents,
      note: item.record?.gaps[gap.category]?.note })) });
}

export function ql225CompanyDispositions(sources: Ql225Sources, ledger: Ql225Ledger, company: OrganizationId) {
  const upstream = ql224CompanyEscalations(sources, sources.overdue, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql225SourceStatus = !record ? 'AWAITING_PREPARED_QL224' : !eligible ? 'UPSTREAM_STALE' :
      record.sourceToken !== tokenFor(item) ? 'QL224_OUTCOME_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const followUp = active ? record?.gaps[gap.category] : undefined;
      const age = followUp && record ? Math.max(0, record.cycle - followUp.lastCycle) : null;
      const disposition = followUp?.disposition ?? 'NOT_DISPOSITIONED' as const;
      const route = followUp?.followUp ?? 'NOT_DRAFTED' as const;
      const independentDue = gap.priority === 'P0' || gap.totalRecurrence > 0 ||
        gap.overdueEscalations > 0 || gap.conflictEvents > 0 ||
        disposition === 'SIMULATED_DISCREPANCY_UNVERIFIED' || (followUp?.overdueEpisodes ?? 0) > 0;
      return { ...gap, disposition, dispositionRoute: route, followUpAge: age,
        nextDueCycle: followUp ? followUp.lastCycle + 3 : null,
        dueSoon: age !== null && age === 2, overdue: age !== null && age >= 3,
        independentDue, referralMissing: independentDue && route !== 'REFER_INDEPENDENT_DRAFT',
        overdueEpisodes: followUp?.overdueEpisodes ?? 0,
        discrepancyEvents: followUp?.discrepancyEvents ?? 0,
        actualEvidenceVerified: false as const, actualIndependentDecision: false as const };
    });
    const undecided = active ? gaps.filter((gap) => gap.disposition === 'NOT_DISPOSITIONED').length : gaps.length;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const referralsDue = active ? gaps.filter((gap) => gap.referralMissing).length : 0;
    const evidencePending = active ? gaps.filter((gap) => gap.disposition === 'EVIDENCE_PENDING_UNVERIFIED').length : 0;
    const discrepancies = active ? gaps.filter((gap) => gap.disposition === 'SIMULATED_DISCREPANCY_UNVERIFIED').length : 0;
    const overdueEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.overdueEpisodes, 0) : 0;
    const discrepancyEvents = active ? gaps.reduce((sum, gap) => sum + gap.discrepancyEvents, 0) : 0;
    const checksComplete = active && QL225_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const allHeld = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && undecided === 0 && overdue === 0 &&
      referralsDue === 0 && checksComplete && allHeld;
    return { ...item, record, eligible, sourceStatus, gaps, undecided, overdue, dueSoon,
      referralsDue, evidencePending, discrepancies, overdueEpisodes, discrepancyEvents,
      checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'held_release_reassessment_packet_prepared',
      actualEvidenceVerified: false as const, actualOwnerAuthorization: false as const,
      actualIndependentDecision: false as const, transmitted: false as const,
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
    evidencePending: cases.reduce((sum, item) => sum + item.evidencePending, 0),
    discrepancies: cases.reduce((sum, item) => sum + item.discrepancies, 0),
    overdueEpisodes: cases.reduce((sum, item) => sum + item.overdueEpisodes, 0),
    discrepancyEvents: cases.reduce((sum, item) => sum + item.discrepancyEvents, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 &&
        QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql225Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql225Case): Ql225Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

export function beginQl225Disposition(sources: Ql225Sources, ledger: Ql225Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql225Ledger {
  const item = ql224CompanyEscalations(sources, sources.overdue, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length) return ledger;
  const fingerprint = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === fingerprint) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: fingerprint, cycle: 0, gaps: {},
    checks: {}, phase: 'escalation_outcome_disposition_draft' });
}

/** Fictional recheck only; an overdue refresh must be referred independently, never automatically closed. */
export function recordQl225Disposition(sources: Ql225Sources, ledger: Ql225Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  disposition: Ql225Disposition, followUp: Ql225FollowUp, note: string): Ql225Ledger {
  const item = ql225CompanyDispositions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'escalation_outcome_disposition_draft' || !item.gaps.some((gap) => gap.category === category) ||
      !['EVIDENCE_PENDING_UNVERIFIED', 'SIMULATED_REVIEW_NOTED_UNVERIFIED', 'SIMULATED_DISCREPANCY_UNVERIFIED'].includes(disposition) ||
      !['CONTINUE_HELD_MONITOR_DRAFT', 'REQUEST_EVIDENCE_DRAFT', 'REFER_INDEPENDENT_DRAFT'].includes(followUp) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const wasOverdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (wasOverdue && followUp !== 'REFER_INDEPENDENT_DRAFT') return ledger;
  const newDiscrepancy = disposition === 'SIMULATED_DISCREPANCY_UNVERIFIED' &&
    previous?.lastDiscrepancyCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { disposition, followUp, note: note.trim().slice(0, 180),
      lastCycle: item.record.cycle,
      overdueEpisodes: (previous?.overdueEpisodes ?? 0) + (wasOverdue ? 1 : 0),
      discrepancyEvents: (previous?.discrepancyEvents ?? 0) + (newDiscrepancy ? 1 : 0),
      lastDiscrepancyCycle: newDiscrepancy ? item.record.cycle : previous?.lastDiscrepancyCycle ?? null } } });
}

export function advanceQl225Cycle(sources: Ql225Sources, ledger: Ql225Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql225Ledger {
  const item = ql225CompanyDispositions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'escalation_outcome_disposition_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl225Check(sources: Ql225Sources, ledger: Ql225Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql225Check): Ql225Ledger {
  const item = ql225CompanyDispositions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'escalation_outcome_disposition_draft' ||
      !QL225_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

/** Packet is strictly local; it neither resolves an actual hold nor authorizes release. */
export function prepareQl225HeldReassessment(sources: Ql225Sources, ledger: Ql225Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql225Ledger {
  const item = ql225CompanyDispositions(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'escalation_outcome_disposition_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'held_release_reassessment_packet_prepared' });
}

export function ql225Portfolio(sources: Ql225Sources, ledger: Ql225Ledger) {
  const companies = operatorOrganizations.map((org) => ql225CompanyDispositions(sources, ledger, org.id));
  const count = (key: 'eligible' | 'tracking' | 'prepared' | 'undecided' | 'overdue' | 'dueSoon' |
    'referralsDue' | 'evidencePending' | 'discrepancies' | 'overdueEpisodes' | 'discrepancyEvents' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL225_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: count('eligible'), tracking: count('tracking'), prepared: count('prepared'),
    undecided: count('undecided'), overdue: count('overdue'), dueSoon: count('dueSoon'),
    referralsDue: count('referralsDue'), evidencePending: count('evidencePending'),
    discrepancies: count('discrepancies'), overdueEpisodes: count('overdueEpisodes'),
    discrepancyEvents: count('discrepancyEvents'), stale: count('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentDisposition: false as const, actualEvidenceVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const,
    callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Coded status/count receipt excludes notes, identities and revision fingerprints. */
export function ql225CompanyReceipt(sources: Ql225Sources, ledger: Ql225Ledger, company: OrganizationId): string {
  const summary = ql225CompanyDispositions(sources, ledger, company);
  return JSON.stringify({ release: QL225_RELEASE, company,
    scope: 'Synthetic escalation outcome aging, fictional independent evidence dispositions and held-release reassessment',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    undecided: summary.undecided, overdue: summary.overdue, dueSoon: summary.dueSoon,
    referralsDue: summary.referralsDue, evidencePending: summary.evidencePending,
    discrepancies: summary.discrepancies, overdueEpisodes: summary.overdueEpisodes,
    discrepancyEvents: summary.discrepancyEvents, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL225_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, disposition: gap.disposition,
        followUpRoute: gap.dispositionRoute, followUpAge: gap.followUpAge,
        nextDueCycle: gap.nextDueCycle, overdue: gap.overdue, dueSoon: gap.dueSoon,
        referralMissing: gap.referralMissing, overdueEpisodes: gap.overdueEpisodes,
        discrepancyEvents: gap.discrepancyEvents, realIndependentDisposition: false,
        realEvidenceVerified: false })),
      conditionalRelease: 'BLOCKED', realOwnerAuthorization: false, independentHoldReleased: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentDisposition: false, actualEvidenceVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
