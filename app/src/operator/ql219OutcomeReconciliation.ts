import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql218CompanyAudit, type Ql218Ledger, type Ql218Sources } from './ql218RecurrenceAudit';

export const QL219_RELEASE = 'ql219-four-company-recurrence-followup-outcome-independent-closure-readiness-disabled-preview-v1';
export const QL219_REVIEW_CHECKS = [
  { id: 'SOURCE_TRACE', title: 'Source and replay trace', detail: 'Compare QL-218 source status with the exact fictional gap outcome.' },
  { id: 'RECURRENCE_REVIEW', title: 'Recurrence escalation', detail: 'Identify recurring exceptions for a future actual independent reviewer.' },
  { id: 'HOLD_PERMISSION', title: 'Release hold and permission boundary', detail: 'Confirm that nothing in this packet lifts the twelve real-pilot holds.' }
] as const;
export type Ql219CheckId = typeof QL219_REVIEW_CHECKS[number]['id'];
export type Ql219Outcome = 'OPEN_EXCEPTION_RECONFIRMED' | 'SOURCE_EVIDENCE_STILL_MISSING' | 'FICTIONAL_COMPARISON_STABLE_UNVERIFIED';
export type Ql219FollowUp = 'MAINTAIN_HOLD_DRAFT' | 'REQUEST_NEW_EVIDENCE_DRAFT' | 'INDEPENDENT_REVIEW_REQUIRED_DRAFT';
export type Ql219GapOutcome = Readonly<{ outcome: Ql219Outcome; followUp: Ql219FollowUp; note: string }>;
export type Ql219Case = Readonly<{
  sourceToken: string;
  outcomes: Partial<Record<Ql214GapCategory, Ql219GapOutcome>>;
  reviewChecks: Partial<Record<Ql219CheckId, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'outcome_reconciliation_draft' | 'independent_review_packet_prepared';
}>;
export type Ql219Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql219Case>>>>;
export type Ql219Sources = Ql218Sources & Readonly<{ recurrence: Ql218Ledger }>;
export type Ql219SourceStatus = 'AWAITING_PREPARED_FOLLOWUP' | 'SOURCE_CURRENT' | 'RECURRENCE_SOURCE_REVISED' | 'UPSTREAM_STALE';

function fingerprint(input: unknown): string {
  // Browser-local invalidation marker, not a signed attestation or collision-resistant digest.
  let hash = 2166136261;
  for (const char of JSON.stringify(input)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-outcome-${(hash >>> 0).toString(16)}`;
}

type Ql218Case = ReturnType<typeof ql218CompanyAudit>['cases'][number];
function tokenFor(item: Ql218Case) {
  return fingerprint({ upstream: item.record?.sourceToken, phase: item.record?.phase, cycle: item.cycle,
    sourceStatus: item.sourceStatus, prepared: item.preparedFollowUp,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      replayDisposition: gap.replayDisposition, followUp: gap.followUp, followUpAge: gap.followUpAge,
      lastReplayCycle: gap.lastReplayCycle, replayCount: gap.replayCount, recurrenceCount: gap.recurrenceCount,
      privateSourceNote: item.record?.decisions[gap.category]?.note })) });
}

export function ql219CompanyReconciliation(sources: Ql219Sources, ledger: Ql219Ledger, company: OrganizationId) {
  const upstream = ql218CompanyAudit(sources, sources.recurrence, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.preparedFollowUp && item.gaps.length > 0;
    const sourceStatus: Ql219SourceStatus = !record ? 'AWAITING_PREPARED_FOLLOWUP' :
      !eligible ? 'UPSTREAM_STALE' : record.sourceToken !== tokenFor(item) ? 'RECURRENCE_SOURCE_REVISED' : 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const reconciliation = sourceStatus === 'SOURCE_CURRENT' ? record?.outcomes[gap.category] : undefined;
      return { ...gap, outcome: reconciliation?.outcome ?? 'NOT_RECONCILED' as const,
        closureFollowUp: reconciliation?.followUp ?? 'NOT_DRAFTED' as const,
        requiresIndependentEscalation: gap.recurrenceCount > 0,
        independentEvidenceVerified: false as const, independentlyClosed: false as const };
    });
    const reviewChecksComplete = sourceStatus === 'SOURCE_CURRENT' && QL219_REVIEW_CHECKS.every((check) =>
      record?.reviewChecks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const recurrenceEscalationDue = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) =>
      gap.requiresIndependentEscalation && gap.closureFollowUp !== 'INDEPENDENT_REVIEW_REQUIRED_DRAFT').length : 0;
    const unresolvedOutcomes = sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.outcome === 'NOT_RECONCILED').length : gaps.length;
    const readyForHumanInspection = sourceStatus === 'SOURCE_CURRENT' && gaps.length > 0 &&
      unresolvedOutcomes === 0 && recurrenceEscalationDue === 0 && reviewChecksComplete;
    return { ...item, record, eligible, sourceStatus, gaps, reviewChecksComplete,
      recurrenceEscalationDue, unresolvedOutcomes, readyForHumanInspection,
      prepared: readyForHumanInspection && record?.phase === 'independent_review_packet_prepared',
      actualIndependentClosure: false as const, actualOwnerApproval: false as const,
      releaseHold: 'HELD_UNVERIFIED' as const, transmitted: false as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((id) => !cases.some((item) => item.scenario === id)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    readyForHumanInspection: cases.filter((item) => item.readyForHumanInspection).length,
    recurrenceEscalationDue: cases.reduce((sum, item) => sum + item.recurrenceEscalationDue, 0),
    unresolvedOutcomes: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.unresolvedOutcomes : 0), 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const, actualIndependentClosure: false as const } };
}

function withCase(ledger: Ql219Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql219Case): Ql219Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

/** Explicitly start or reset only an eligible, prepared, current QL-218 fictional recurrence audit. */
export function beginQl219Reconciliation(sources: Ql219Sources, ledger: Ql219Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql219Ledger {
  const upstream = ql218CompanyAudit(sources, sources.recurrence, company).cases.find((item) => item.scenario === scenario);
  if (!upstream || upstream.sourceStatus !== 'SOURCE_CURRENT' || !upstream.preparedFollowUp || !upstream.gaps.length) return ledger;
  const sourceToken = tokenFor(upstream);
  if (ledger[company]?.[scenario]?.sourceToken === sourceToken) return ledger;
  return withCase(ledger, company, scenario, { sourceToken, outcomes: {}, reviewChecks: {}, phase: 'outcome_reconciliation_draft' });
}

/** An unverified disposition/next-step is not proof that a gap is resolved. */
export function recordQl219Outcome(sources: Ql219Sources, ledger: Ql219Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  outcome: Ql219Outcome, followUp: Ql219FollowUp, note: string): Ql219Ledger {
  const item = ql219CompanyReconciliation(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'outcome_reconciliation_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['OPEN_EXCEPTION_RECONFIRMED', 'SOURCE_EVIDENCE_STILL_MISSING', 'FICTIONAL_COMPARISON_STABLE_UNVERIFIED'].includes(outcome) ||
      !['MAINTAIN_HOLD_DRAFT', 'REQUEST_NEW_EVIDENCE_DRAFT', 'INDEPENDENT_REVIEW_REQUIRED_DRAFT'].includes(followUp) ||
      note.trim().length < 8) return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    outcomes: { ...item.record.outcomes, [category]: { outcome, followUp, note: note.trim().slice(0, 180) } } });
}

/** Each acknowledgment only means the operator has reviewed a fictional readiness requirement. */
export function acknowledgeQl219Check(sources: Ql219Sources, ledger: Ql219Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, checkId: Ql219CheckId): Ql219Ledger {
  const item = ql219CompanyReconciliation(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'outcome_reconciliation_draft' ||
      !QL219_REVIEW_CHECKS.some((check) => check.id === checkId) ||
      item.record.reviewChecks[checkId] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    reviewChecks: { ...item.record.reviewChecks, [checkId]: 'ACKNOWLEDGED_UNVERIFIED' } });
}

/** Prepares a local packet for future human review; no actual independent closure or release ever results. */
export function prepareQl219Review(sources: Ql219Sources, ledger: Ql219Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql219Ledger {
  const item = ql219CompanyReconciliation(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'outcome_reconciliation_draft' || !item.readyForHumanInspection) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'independent_review_packet_prepared' });
}

export function ql219Portfolio(sources: Ql219Sources, ledger: Ql219Ledger) {
  const companies = operatorOrganizations.map((organization) => ql219CompanyReconciliation(sources, ledger, organization.id));
  return { release: QL219_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: companies.reduce((sum, company) => sum + company.eligible, 0),
    tracking: companies.reduce((sum, company) => sum + company.tracking, 0),
    prepared: companies.reduce((sum, company) => sum + company.prepared, 0),
    readyForHumanInspection: companies.reduce((sum, company) => sum + company.readyForHumanInspection, 0),
    recurrenceEscalationDue: companies.reduce((sum, company) => sum + company.recurrenceEscalationDue, 0),
    unresolvedOutcomes: companies.reduce((sum, company) => sum + company.unresolvedOutcomes, 0),
    stale: companies.reduce((sum, company) => sum + company.stale, 0),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    livePilotReady: false as const, actualIndependentClosure: false as const,
    actualOwnerApproval: false as const, providerConnected: false as const,
    externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** No source tokens, notes, reviewer names, contact information or signatures in receipt. */
export function ql219CompanyReceipt(sources: Ql219Sources, ledger: Ql219Ledger, company: OrganizationId): string {
  const data = ql219CompanyReconciliation(sources, ledger, company);
  return JSON.stringify({ release: QL219_RELEASE, company,
    scope: 'Fictional recurrence outcome reconciliation and local independent-closure readiness only',
    eligible: data.eligible, tracking: data.tracking, prepared: data.prepared,
    readyForHumanInspection: data.readyForHumanInspection, recurrenceEscalationDue: data.recurrenceEscalationDue,
    unresolvedOutcomes: data.unresolvedOutcomes, stale: data.stale, orphaned: data.orphaned,
    cases: data.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      readyForHumanInspection: item.readyForHumanInspection,
      reviewChecks: QL219_REVIEW_CHECKS.map((check) => ({ id: check.id,
        status: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.reviewChecks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
        recurrenceCount: gap.recurrenceCount, outcome: gap.outcome, followUp: gap.closureFollowUp,
        independentEvidenceVerified: false, independentlyClosed: false })),
      actualOwnerApproval: false, actualIndependentClosure: false, releaseHold: 'HELD_UNVERIFIED' })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentClosure: false, actualOwnerAuthorization: false,
    sourceTokensIncluded: false, notesIncluded: false, reviewerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
