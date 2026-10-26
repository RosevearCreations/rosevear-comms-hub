import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql219CompanyReconciliation, type Ql219Ledger, type Ql219Sources } from './ql219OutcomeReconciliation';

export const QL220_RELEASE = 'ql220-four-company-independent-review-reopen-closure-exception-owner-followup-disabled-preview-v1';
export const QL220_CHECKS = [
  { id: 'REOPEN_PROVENANCE', label: 'Review reopening provenance', description: 'Compare every status-only exception against the prepared QL-219 packet.' },
  { id: 'OWNER_FOLLOWUP', label: 'Owner follow-up and independent review', description: 'Confirm next steps remain unsent drafts; no independent human decision is claimed.' },
  { id: 'HOLD_CONTINUITY', label: 'Closure and release hold continuity', description: 'Confirm all twelve QL-181 real-pilot holds remain HELD_UNVERIFIED.' }
] as const;
export type Ql220Check = typeof QL220_CHECKS[number]['id'];
export type Ql220Disposition = 'REOPEN_EXCEPTION_DRAFT' | 'MONITOR_OPEN_HOLD_DRAFT' | 'NO_NEW_EVIDENCE_UNVERIFIED';
export type Ql220NextStep = 'OWNER_EVIDENCE_REQUEST_DRAFT' | 'INDEPENDENT_REVIEW_ESCALATION_DRAFT' | 'MAINTAIN_HOLD_DRAFT';
export type Ql220Gap = Readonly<{ disposition: Ql220Disposition; nextStep: Ql220NextStep; note: string; lastCycle: number }>;
export type Ql220Case = Readonly<{
  sourceToken: string;
  reopenReason: string;
  cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql220Gap>>;
  checks: Partial<Record<Ql220Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'reopen_monitoring_draft' | 'owner_followup_audit_prepared';
}>;
export type Ql220Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql220Case>>>>;
export type Ql220Sources = Ql219Sources & Readonly<{ closure: Ql219Ledger }>;
export type Ql220SourceStatus = 'AWAITING_PREPARED_QL219' | 'SOURCE_CURRENT' | 'CLOSURE_SOURCE_REVISED' | 'UPSTREAM_STALE';

function sourceToken(input: unknown): string {
  // Untrusted browser-session change marker, never a signature or evidence hash.
  let hash = 2166136261;
  for (const char of JSON.stringify(input)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `synthetic-reopen-${(hash >>> 0).toString(16)}`;
}

type Ql219CaseView = ReturnType<typeof ql219CompanyReconciliation>['cases'][number];
function tokenFor(item: Ql219CaseView) {
  return sourceToken({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    sourceStatus: item.sourceStatus, reviewChecks: item.record?.reviewChecks,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      recurrenceCount: gap.recurrenceCount, outcome: gap.outcome, closureFollowUp: gap.closureFollowUp,
      // Changing a source note must freeze later monitoring, but never copy it to a public receipt.
      sourceNote: item.record?.outcomes[gap.category]?.note })) });
}

export function ql220CompanyMonitoring(sources: Ql220Sources, ledger: Ql220Ledger, company: OrganizationId) {
  const upstream = ql219CompanyReconciliation(sources, sources.closure, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql220SourceStatus = !record ? 'AWAITING_PREPARED_QL219' :
      !eligible ? 'UPSTREAM_STALE' : record.sourceToken !== tokenFor(item) ? 'CLOSURE_SOURCE_REVISED' : 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const decision = sourceStatus === 'SOURCE_CURRENT' ? record?.gaps[gap.category] : undefined;
      const followUpAge = decision && record ? Math.max(0, record.cycle - decision.lastCycle) : null;
      return { ...gap,
        reopenDisposition: decision?.disposition ?? 'NOT_REVIEWED' as const,
        ownerFollowUp: decision?.nextStep ?? 'NOT_DRAFTED' as const,
        followUpAge,
        followUpOverdue: followUpAge !== null && followUpAge >= 3,
        independentEscalationNeeded: gap.recurrenceCount > 0,
        independentlyClosed: false as const, evidenceVerified: false as const };
    });
    const checksComplete = sourceStatus === 'SOURCE_CURRENT' && QL220_CHECKS.every((check) =>
      record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const undecided = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.reopenDisposition === 'NOT_REVIEWED').length : gaps.length;
    const due = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.followUpOverdue).length : 0;
    const escalationGaps = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) =>
      gap.independentEscalationNeeded && gap.ownerFollowUp !== 'INDEPENDENT_REVIEW_ESCALATION_DRAFT').length : 0;
    const readyForLocalAudit = sourceStatus === 'SOURCE_CURRENT' && gaps.length > 0 && undecided === 0 &&
      due === 0 && escalationGaps === 0 && checksComplete;
    return { ...item, record, eligible, sourceStatus, gaps, undecided, due, escalationGaps,
      checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'owner_followup_audit_prepared',
      actualIndependentReopen: false as const, actualIndependentClosure: false as const,
      ownerAuthorized: false as const, transmitted: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) => !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned, eligible: cases.filter((item) => item.eligible).length,
    tracked: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    undecided: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.undecided : 0), 0),
    overdue: cases.reduce((sum, item) => sum + item.due, 0),
    escalationsDue: cases.reduce((sum, item) => sum + item.escalationGaps, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const } };
}

function withCase(ledger: Ql220Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql220Case): Ql220Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

/** Explicit, case-only local reopening of a prepared fictional packet. No real review is reopened. */
export function beginQl220Reopen(sources: Ql220Sources, ledger: Ql220Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, reason: string): Ql220Ledger {
  const item = ql219CompanyReconciliation(sources, sources.closure, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length || reason.trim().length < 8) return ledger;
  const token = tokenFor(item);
  if (ledger[company]?.[scenario]?.sourceToken === token) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, reopenReason: reason.trim().slice(0, 180),
    cycle: 0, gaps: {}, checks: {}, phase: 'reopen_monitoring_draft' });
}

/** Strictly synthetic classification of an open gap. A case in prepared phase cannot be edited. */
export function recordQl220Exception(sources: Ql220Sources, ledger: Ql220Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, disposition: Ql220Disposition,
  nextStep: Ql220NextStep, note: string): Ql220Ledger {
  const item = ql220CompanyMonitoring(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'reopen_monitoring_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['REOPEN_EXCEPTION_DRAFT', 'MONITOR_OPEN_HOLD_DRAFT', 'NO_NEW_EVIDENCE_UNVERIFIED'].includes(disposition) ||
      !['OWNER_EVIDENCE_REQUEST_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT', 'MAINTAIN_HOLD_DRAFT'].includes(nextStep) ||
      note.trim().length < 8) return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    gaps: { ...item.record.gaps, [category]: { disposition, nextStep, note: note.trim().slice(0, 180),
      lastCycle: item.record.cycle } } });
}

/** Advances synthetic review cycles; no real time, email, calendar event, or reminder is created. */
export function advanceQl220Cycle(sources: Ql220Sources, ledger: Ql220Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId): Ql220Ledger {
  const item = ql220CompanyMonitoring(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'reopen_monitoring_draft' ||
      item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

export function acknowledgeQl220Check(sources: Ql220Sources, ledger: Ql220Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, check: Ql220Check): Ql220Ledger {
  const item = ql220CompanyMonitoring(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'reopen_monitoring_draft' ||
      !QL220_CHECKS.some((entry) => entry.id === check) || item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

/** Local audit preparation only: never represents real-world independent closure or owner authorization. */
export function prepareQl220FollowUpAudit(sources: Ql220Sources, ledger: Ql220Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId): Ql220Ledger {
  const item = ql220CompanyMonitoring(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'reopen_monitoring_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'owner_followup_audit_prepared' });
}

export function ql220Portfolio(sources: Ql220Sources, ledger: Ql220Ledger) {
  const companies = operatorOrganizations.map((organization) => ql220CompanyMonitoring(sources, ledger, organization.id));
  const total = (name: 'eligible' | 'tracked' | 'prepared' | 'undecided' | 'overdue' | 'escalationsDue' | 'stale') =>
    companies.reduce((sum, company) => sum + company[name], 0);
  return { release: QL220_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracked: total('tracked'), prepared: total('prepared'),
    undecided: total('undecided'), overdue: total('overdue'),
    escalationsDue: total('escalationsDue'), stale: total('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    livePilotReady: false as const, actualIndependentReopen: false as const,
    actualIndependentClosure: false as const, actualOwnerApproval: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Share only status codes and bounded counts, never notes, source fingerprints or identities. */
export function ql220CompanyReceipt(sources: Ql220Sources, ledger: Ql220Ledger, company: OrganizationId): string {
  const data = ql220CompanyMonitoring(sources, ledger, company);
  return JSON.stringify({ release: QL220_RELEASE, company, scope: 'Synthetic reopen and owner follow-up audit only',
    eligible: data.eligible, tracked: data.tracked, prepared: data.prepared, undecided: data.undecided,
    overdue: data.overdue, escalationsDue: data.escalationsDue, stale: data.stale, orphaned: data.orphaned,
    cases: data.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL220_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, recurrenceCount: gap.recurrenceCount,
        disposition: gap.reopenDisposition, nextStep: gap.ownerFollowUp, followUpAge: gap.followUpAge,
        followUpOverdue: gap.followUpOverdue, evidenceVerified: false, independentlyClosed: false })),
      ownerAuthorized: false, independentlyClosed: false, actualIndependentReopen: false,
      releaseHold: 'HELD_UNVERIFIED' })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentClosure: false, actualOwnerApproval: false,
    sourceTokensIncluded: false, notesIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
