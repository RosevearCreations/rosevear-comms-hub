import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql220CompanyMonitoring, type Ql220Ledger, type Ql220Sources } from './ql220ReopenMonitoring';

export const QL221_RELEASE = 'ql221-four-company-reopened-exception-reassessment-evidence-refresh-hold-continuity-disabled-preview-v1';
export const QL221_CHECKS = [
  { id: 'REFRESH_TRACE', title: 'Refresh source identity', detail: 'Compare all fictional refresh outcomes against the current prepared QL-220 audit.' },
  { id: 'FOLLOWUP_REASSESSMENT', title: 'Owner follow-up reassessment', detail: 'Keep repeat exceptions escalated and owner instructions drafted, never delivered.' },
  { id: 'RELEASE_HOLD_CONTINUITY', title: 'Release hold continuity', detail: 'Recheck all twelve real-pilot QL-181 prerequisites without changing their status.' }
] as const;
export type Ql221Check = typeof QL221_CHECKS[number]['id'];
export type Ql221Refresh = 'SOURCE_UNCHANGED_UNVERIFIED' | 'FICTIONAL_NEW_EVIDENCE_PENDING_REVIEW' | 'EVIDENCE_GAP_STILL_OPEN';
export type Ql221EvidenceSource = 'QL220_LOCAL_REPLAY' | 'FICTIONAL_OWNER_ATTACHMENT' | 'SIMULATED_RETEST_RECORD';
export type Ql221Action = 'MAINTAIN_HOLD_DRAFT' | 'OWNER_RETEST_REQUEST_DRAFT' | 'INDEPENDENT_REVIEW_ESCALATION_DRAFT';
export type Ql221Gap = Readonly<{ refresh: Ql221Refresh; source: Ql221EvidenceSource;
  action: Ql221Action; note: string; lastCycle: number }>;
export type Ql221Case = Readonly<{ sourceToken: string; cycle: number;
  gapRefreshes: Partial<Record<Ql214GapCategory, Ql221Gap>>;
  checks: Partial<Record<Ql221Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'evidence_refresh_draft' | 'release_hold_continuity_audit_prepared' }>;
export type Ql221Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql221Case>>>>;
export type Ql221Sources = Ql220Sources & Readonly<{ reopen: Ql220Ledger }>;
export type Ql221SourceStatus = 'AWAITING_PREPARED_QL220' | 'SOURCE_CURRENT' | 'REOPEN_SOURCE_REVISED' | 'UPSTREAM_STALE';

function fingerprint(input: unknown): string {
  // Session-local revision marker only, not cryptographic provenance or a human attestation.
  let hash = 2166136261;
  for (const char of JSON.stringify(input)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-refresh-${(hash >>> 0).toString(16)}`;
}

type Ql220CaseView = ReturnType<typeof ql220CompanyMonitoring>['cases'][number];
function tokenFor(item: Ql220CaseView): string {
  return fingerprint({ upstreamSource: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, reopenReason: item.record?.reopenReason,
    checks: item.record?.checks, sourceStatus: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      recurrenceCount: gap.recurrenceCount, reopenDisposition: gap.reopenDisposition,
      ownerFollowUp: gap.ownerFollowUp, followUpAge: gap.followUpAge,
      lastCycle: item.record?.gaps[gap.category]?.lastCycle,
      note: item.record?.gaps[gap.category]?.note })) });
}

export function ql221CompanyReassessment(sources: Ql221Sources, ledger: Ql221Ledger, company: OrganizationId) {
  const upstream = ql220CompanyMonitoring(sources, sources.reopen, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql221SourceStatus = !record ? 'AWAITING_PREPARED_QL220' : !eligible ? 'UPSTREAM_STALE' :
      record.sourceToken !== tokenFor(item) ? 'REOPEN_SOURCE_REVISED' : 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const refresh = sourceStatus === 'SOURCE_CURRENT' ? record?.gapRefreshes[gap.category] : undefined;
      const age = refresh && record ? Math.max(0, record.cycle - refresh.lastCycle) : null;
      return { ...gap,
        refresh: refresh?.refresh ?? 'NOT_REASSESSED' as const,
        evidenceSource: refresh?.source ?? 'NOT_LINKED' as const,
        ownerAction: refresh?.action ?? 'NOT_DRAFTED' as const,
        refreshAge: age, refreshOverdue: age !== null && age >= 3,
        requiresIndependentEscalation: gap.recurrenceCount > 0,
        independentEvidenceVerified: false as const, actualClosure: false as const };
    });
    const unrefreshed = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.refresh === 'NOT_REASSESSED').length : gaps.length;
    const overdue = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.refreshOverdue).length : 0;
    const escalationDue = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.requiresIndependentEscalation &&
      gap.ownerAction !== 'INDEPENDENT_REVIEW_ESCALATION_DRAFT').length : 0;
    const checksComplete = sourceStatus === 'SOURCE_CURRENT' && QL221_CHECKS.every((check) =>
      record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const holdsContinuing = QL181_PREREQUISITES.length === 12 &&
      QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
    const readyForLocalAudit = sourceStatus === 'SOURCE_CURRENT' && gaps.length > 0 && unrefreshed === 0 &&
      overdue === 0 && escalationDue === 0 && checksComplete && holdsContinuing;
    return { ...item, record, eligible, sourceStatus, gaps, unrefreshed, overdue,
      escalationDue, checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'release_hold_continuity_audit_prepared',
      actualIndependentReassessment: false as const, actualEvidenceVerification: false as const,
      actualClosure: false as const, actualOwnerApproval: false as const,
      transmitted: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) =>
    !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    unrefreshed: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.unrefreshed : 0), 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    escalationDue: cases.reduce((sum, item) => sum + item.escalationDue, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql221Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql221Case): Ql221Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

/** Start or explicitly reset only an eligible, current, locally prepared QL-220 case. */
export function beginQl221Refresh(sources: Ql221Sources, ledger: Ql221Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql221Ledger {
  const source = ql220CompanyMonitoring(sources, sources.reopen, company).cases.find((item) => item.scenario === scenario);
  if (!source || source.sourceStatus !== 'SOURCE_CURRENT' || !source.prepared || !source.gaps.length) return ledger;
  const token = tokenFor(source);
  if (ledger[company]?.[scenario]?.sourceToken === token) return ledger;
  return withCase(ledger, company, scenario,
    { sourceToken: token, cycle: 0, gapRefreshes: {}, checks: {}, phase: 'evidence_refresh_draft' });
}

/** Only fixture-label evidence may be referenced; no actual file, URL, or PII may be linked. */
export function recordQl221Refresh(sources: Ql221Sources, ledger: Ql221Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, refresh: Ql221Refresh,
  evidenceSource: Ql221EvidenceSource, action: Ql221Action, note: string): Ql221Ledger {
  const item = ql221CompanyReassessment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'evidence_refresh_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['SOURCE_UNCHANGED_UNVERIFIED', 'FICTIONAL_NEW_EVIDENCE_PENDING_REVIEW', 'EVIDENCE_GAP_STILL_OPEN'].includes(refresh) ||
      !['QL220_LOCAL_REPLAY', 'FICTIONAL_OWNER_ATTACHMENT', 'SIMULATED_RETEST_RECORD'].includes(evidenceSource) ||
      !['MAINTAIN_HOLD_DRAFT', 'OWNER_RETEST_REQUEST_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT'].includes(action) ||
      note.trim().length < 8) return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    gapRefreshes: { ...item.record.gapRefreshes, [category]: {
      refresh, source: evidenceSource, action, note: note.trim().slice(0, 180), lastCycle: item.record.cycle } } });
}

/** Synthetic aging is bounded; no calendar task, SMS or email is ever created. */
export function advanceQl221Cycle(sources: Ql221Sources, ledger: Ql221Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql221Ledger {
  const item = ql221CompanyReassessment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'evidence_refresh_draft' ||
      item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl221Check(sources: Ql221Sources, ledger: Ql221Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql221Check): Ql221Ledger {
  const item = ql221CompanyReassessment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'evidence_refresh_draft' ||
      !QL221_CHECKS.some((entry) => entry.id === check) || item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario,
    { ...item.record, checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

/** Local status-only packet; never an independent evidence acceptance or release authorization. */
export function prepareQl221ContinuityAudit(sources: Ql221Sources, ledger: Ql221Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql221Ledger {
  const item = ql221CompanyReassessment(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'evidence_refresh_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'release_hold_continuity_audit_prepared' });
}

export function ql221Portfolio(sources: Ql221Sources, ledger: Ql221Ledger) {
  const companies = operatorOrganizations.map((org) => ql221CompanyReassessment(sources, ledger, org.id));
  const count = (key: 'eligible' | 'tracking' | 'prepared' | 'unrefreshed' | 'overdue' | 'escalationDue' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL221_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: count('eligible'), tracking: count('tracking'), prepared: count('prepared'),
    unrefreshed: count('unrefreshed'), overdue: count('overdue'), escalationDue: count('escalationDue'), stale: count('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    realIndependentReassessment: false as const, realEvidenceVerified: false as const,
    livePilotReady: false as const, actualIndependentClosure: false as const,
    actualOwnerApproval: false as const, providerConnected: false as const,
    externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Fixed-schema status-only receipt; excludes notes, tokens, identities and fabricated source contents. */
export function ql221CompanyReceipt(sources: Ql221Sources, ledger: Ql221Ledger, company: OrganizationId): string {
  const summary = ql221CompanyReassessment(sources, ledger, company);
  return JSON.stringify({ release: QL221_RELEASE, company,
    scope: 'Four-company fictional evidence refresh and local held-release continuity only',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unrefreshed: summary.unrefreshed, overdue: summary.overdue,
    escalationDue: summary.escalationDue, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL221_CHECKS.map((check) => ({ id: check.id,
        status: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, recurrenceCount: gap.recurrenceCount,
        refresh: gap.refresh, evidenceSource: gap.evidenceSource, ownerAction: gap.ownerAction,
        refreshAge: gap.refreshAge, refreshOverdue: gap.refreshOverdue,
        independentEvidenceVerified: false, actualClosure: false })),
      ownerAuthorized: false, actualIndependentReassessment: false, actualClosure: false, releaseHold: 'HELD_UNVERIFIED' })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentClosure: false, actualOwnerApproval: false,
    sourceTokensIncluded: false, notesIncluded: false, reviewerIdentitiesIncluded: false,
    attachmentsIncluded: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
