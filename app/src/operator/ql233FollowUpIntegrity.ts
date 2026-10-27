import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql232CompanyProof, type Ql232Ledger, type Ql232Sources } from './ql232EscalationProof';

export const QL233_RELEASE = 'ql233-four-company-escalation-proof-exception-follow-up-aging-independent-decision-reassessment-held-pilot-release-integrity-audit-disabled-preview-v1';
export const QL233_CHECKS = [
  { id: 'EXCEPTION_AGING', title: 'Escalation proof exception aging', detail: 'Compare fictional follow-up cycles, previous overdue episodes and exceptions still open.' },
  { id: 'INDEPENDENT_REASSESSMENT', title: 'Independent decision reassessment', detail: 'Inspect untransmitted independent decision referrals for repeated or late findings.' },
  { id: 'HELD_PILOT_INTEGRITY', title: 'Held-pilot release integrity', detail: 'Reconcile the twelve actual QL-181 HELD_UNVERIFIED prerequisites against the unchanged source snapshot.' }
] as const;
export type Ql233Check = typeof QL233_CHECKS[number]['id'];
export type Ql233FollowUp = 'FOLLOW_UP_PENDING_UNVERIFIED' | 'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED' |
  'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED';
export type Ql233Reassessment = 'MAINTAIN_HELD_DECISION_DRAFT' | 'REFER_INDEPENDENT_REASSESSMENT_DRAFT' |
  'REOPEN_INDEPENDENT_DECISION_DRAFT';
export type Ql233Integrity = 'HELD_PILOT_PROOF_PENDING_UNVERIFIED' | 'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED' |
  'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED';
export type Ql233GapRecord = Readonly<{ followUp: Ql233FollowUp; reassessment: Ql233Reassessment;
  integrity: Ql233Integrity; note: string; lastCycle: number; recurrenceEvents: number;
  lastRecurrenceCycle: number | null; historicalOverdueEpisodes: number }>;
export type Ql233Case = Readonly<{ sourceToken: string; holdToken: string; cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql233GapRecord>>;
  checks: Partial<Record<Ql233Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'exception_follow_up_integrity_review_draft' | 'held_pilot_integrity_audit_prepared' }>;
export type Ql233Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql233Case>>>>;
export type Ql233Sources = Ql232Sources & Readonly<{ escalationProof: Ql232Ledger }>;
export type Ql233SourceStatus = 'AWAITING_PREPARED_QL232' | 'SOURCE_CURRENT' |
  'QL232_ESCALATION_PROOF_REVISED' | 'UPSTREAM_STALE' | 'HELD_PILOT_PROOF_REVISED';

/** Session-only revision fingerprint; never a cryptographic signature or independent verification. */
function fictionalToken(value: unknown): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-integrity-${(hash >>> 0).toString(16)}`;
}
type SourceCase = ReturnType<typeof ql232CompanyProof>['cases'][number];
function sourceToken(item: SourceCase): string {
  return fictionalToken({ source: item.record?.sourceToken, proof: item.record?.proofToken,
    phase: item.record?.phase, cycle: item.record?.cycle, checks: item.record?.checks,
    status: item.sourceStatus, gaps: item.gaps.map((gap) => ({ category: gap.category,
      priority: gap.priority, escalation: gap.escalation, disposition: gap.disposition,
      proof: gap.proof, recurrence: gap.dispositionRecurrences,
      overdueEpisodes: gap.overdueDispositionEpisodes, note: item.record?.gaps[gap.category]?.note })) });
}
function holdToken(): string {
  return fictionalToken(QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })));
}
function actualHoldsIntact(): boolean {
  return QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
}

export function ql233CompanyIntegrity(sources: Ql233Sources, ledger: Ql233Ledger, company: OrganizationId) {
  const upstream = ql232CompanyProof(sources, sources.escalationProof, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql233SourceStatus = !record ? 'AWAITING_PREPARED_QL232' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== sourceToken(item) ? 'QL232_ESCALATION_PROOF_REVISED' :
      record.holdToken !== holdToken() || !actualHoldsIntact() ? 'HELD_PILOT_PROOF_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const followUp = current?.followUp ?? 'NOT_RECONCILED' as const;
      const reassessment = current?.reassessment ?? 'NOT_DRAFTED' as const;
      const integrity = current?.integrity ?? 'NOT_REVALIDATED' as const;
      const independentDecisionDue = gap.priority === 'P0' || gap.dispositionRecurrences > 0 ||
        gap.overdueDispositionEpisodes > 0 || gap.recurrenceEvents > 0 ||
        followUp === 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED' ||
        integrity === 'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED' ||
        (current?.recurrenceEvents ?? 0) > 0 || (current?.historicalOverdueEpisodes ?? 0) > 0;
      const missingIndependentDecision = independentDecisionDue && reassessment === 'MAINTAIN_HELD_DECISION_DRAFT' ||
        followUp === 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED' && reassessment === 'MAINTAIN_HELD_DECISION_DRAFT';
      return { ...gap, followUp, reassessment, integrity, age, dueSoon: age === 2,
        overdue: age !== null && age >= 3, nextDueCycle: current ? current.lastCycle + 3 : null,
        independentDecisionDue, missingIndependentDecision,
        inheritedIntegrityException: gap.proof !== 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED',
        reassessmentRecurrences: current?.recurrenceEvents ?? 0,
        historicalOverdueEpisodes: current?.historicalOverdueEpisodes ?? 0,
        actualIndependentDecision: false as const, actualPilotProofVerified: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => gap.followUp === 'NOT_RECONCILED' ||
      gap.followUp === 'FOLLOW_UP_PENDING_UNVERIFIED' || gap.integrity === 'NOT_REVALIDATED' ||
      gap.integrity === 'HELD_PILOT_PROOF_PENDING_UNVERIFIED').length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const missingReassessments = active ? gaps.filter((gap) => gap.missingIndependentDecision).length : 0;
    const recurring = active ? gaps.filter((gap) => gap.followUp === 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED').length : 0;
    const recurrenceEvents = active ? gaps.reduce((sum, gap) => sum + gap.reassessmentRecurrences, 0) : 0;
    const historicalOverdueEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.historicalOverdueEpisodes, 0) : 0;
    const integrityExceptions = active ? gaps.filter((gap) => gap.inheritedIntegrityException ||
      gap.integrity === 'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED').length : 0;
    const checksComplete = active && QL233_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && unreviewed === 0 && overdue === 0 &&
      missingReassessments === 0 && integrityExceptions === 0 && checksComplete && actualHoldsIntact();
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      missingReassessments, recurring, recurrenceEvents, historicalOverdueEpisodes,
      integrityExceptions, checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'held_pilot_integrity_audit_prepared',
      actualIndependentDecision: false as const, actualOwnerSignoff: false as const,
      actualReleaseAuthorized: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
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
    missingReassessments: cases.reduce((sum, item) => sum + item.missingReassessments, 0),
    recurring: cases.reduce((sum, item) => sum + item.recurring, 0),
    recurrenceEvents: cases.reduce((sum, item) => sum + item.recurrenceEvents, 0),
    historicalOverdueEpisodes: cases.reduce((sum, item) => sum + item.historicalOverdueEpisodes, 0),
    integrityExceptions: cases.reduce((sum, item) => sum + item.integrityExceptions, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: actualHoldsIntact(), pilotRelease: 'BLOCKED' as const } };
}
function withCase(ledger: Ql233Ledger, company: OrganizationId, scenario: Ql211ScenarioId,
  record: Ql233Case): Ql233Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}
export function beginQl233IntegrityAudit(sources: Ql233Sources, ledger: Ql233Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql233Ledger {
  const item = ql232CompanyProof(sources, sources.escalationProof, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length || !actualHoldsIntact()) return ledger;
  const token = sourceToken(item), snapshot = holdToken();
  if (ledger[company]?.[scenario]?.sourceToken === token && ledger[company]?.[scenario]?.holdToken === snapshot) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, holdToken: snapshot, cycle: 0,
    gaps: {}, checks: {}, phase: 'exception_follow_up_integrity_review_draft' });
}
export function recordQl233FollowUp(sources: Ql233Sources, ledger: Ql233Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, category: Ql214GapCategory,
  followUp: Ql233FollowUp, reassessment: Ql233Reassessment, integrity: Ql233Integrity,
  note: string): Ql233Ledger {
  const item = ql233CompanyIntegrity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'exception_follow_up_integrity_review_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['FOLLOW_UP_PENDING_UNVERIFIED', 'SIMULATED_FOLLOW_UP_RECORDED_UNVERIFIED', 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED'].includes(followUp) ||
      !['MAINTAIN_HELD_DECISION_DRAFT', 'REFER_INDEPENDENT_REASSESSMENT_DRAFT', 'REOPEN_INDEPENDENT_DECISION_DRAFT'].includes(reassessment) ||
      !['HELD_PILOT_PROOF_PENDING_UNVERIFIED', 'SIMULATED_HELD_PILOT_PROOF_MATCH_UNVERIFIED', 'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED'].includes(integrity) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && reassessment !== 'REFER_INDEPENDENT_REASSESSMENT_DRAFT') return ledger;
  if ((followUp === 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED' ||
       integrity === 'HELD_PILOT_PROOF_EXCEPTION_UNVERIFIED') &&
      reassessment === 'MAINTAIN_HELD_DECISION_DRAFT') return ledger;
  const recurrence = followUp === 'SIMULATED_EXCEPTION_REOPENED_UNVERIFIED' &&
    previous?.lastRecurrenceCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: {}, // Any changed evidence requires a fresh local integrity acknowledgement.
    gaps: { ...item.record.gaps, [category]: { followUp, reassessment, integrity,
      note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      recurrenceEvents: (previous?.recurrenceEvents ?? 0) + (recurrence ? 1 : 0),
      lastRecurrenceCycle: recurrence ? item.record.cycle : previous?.lastRecurrenceCycle ?? null,
      historicalOverdueEpisodes: (previous?.historicalOverdueEpisodes ?? 0) + (overdue ? 1 : 0) } } });
}
export function advanceQl233Cycle(sources: Ql233Sources, ledger: Ql233Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql233Ledger {
  const item = ql233CompanyIntegrity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'exception_follow_up_integrity_review_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1, checks: {} });
}
export function acknowledgeQl233Check(sources: Ql233Sources, ledger: Ql233Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql233Check): Ql233Ledger {
  const item = ql233CompanyIntegrity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'exception_follow_up_integrity_review_draft' ||
      !QL233_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}
export function prepareQl233HeldAudit(sources: Ql233Sources, ledger: Ql233Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql233Ledger {
  const item = ql233CompanyIntegrity(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'exception_follow_up_integrity_review_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'held_pilot_integrity_audit_prepared' });
}
export function ql233Portfolio(sources: Ql233Sources, ledger: Ql233Ledger) {
  const companies = operatorOrganizations.map((organization) => ql233CompanyIntegrity(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'unreviewed' | 'dueSoon' | 'overdue' |
    'missingReassessments' | 'recurring' | 'recurrenceEvents' | 'historicalOverdueEpisodes' |
    'integrityExceptions' | 'stale') => companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL233_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    missingReassessments: total('missingReassessments'), recurring: total('recurring'),
    recurrenceEvents: total('recurrenceEvents'), historicalOverdueEpisodes: total('historicalOverdueEpisodes'),
    integrityExceptions: total('integrityExceptions'), stale: total('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentDecision: false as const, actualPilotProofVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Status-only JSON receipt. No synthetic notes, source tokens, proof tokens or reviewer identities. */
export function ql233CompanyReceipt(sources: Ql233Sources, ledger: Ql233Ledger, company: OrganizationId): string {
  const summary = ql233CompanyIntegrity(sources, ledger, company);
  return JSON.stringify({ release: QL233_RELEASE, company,
    scope: 'Fictional escalation exception aging, independent reassessment and held-pilot integrity audit',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    missingReassessments: summary.missingReassessments, recurring: summary.recurring,
    recurrenceEvents: summary.recurrenceEvents, historicalOverdueEpisodes: summary.historicalOverdueEpisodes,
    integrityExceptions: summary.integrityExceptions, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL233_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, followUp: gap.followUp,
        reassessment: gap.reassessment, integrity: gap.integrity, age: gap.age,
        dueSoon: gap.dueSoon, overdue: gap.overdue, missingIndependentDecision: gap.missingIndependentDecision,
        recurrenceEvents: gap.reassessmentRecurrences, historicalOverdueEpisodes: gap.historicalOverdueEpisodes,
        actualIndependentDecision: false, actualPilotProofVerified: false })),
      pilotRelease: 'BLOCKED', ownerAuthorization: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    pilotRelease: 'BLOCKED', actualIndependentDecision: false, actualPilotProofVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, holdTokensIncluded: false,
    reviewerIdentitiesIncluded: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
