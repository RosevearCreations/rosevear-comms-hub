import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql214GapCategory } from './ql214ReviewIntake';
import { ql231CompanyDisposition, type Ql231Ledger, type Ql231Sources } from './ql231DispositionOversight';

export const QL232_RELEASE = 'ql232-four-company-overdue-recheck-escalation-outcomes-independent-disposition-recurrence-conditional-hold-proof-revalidation-disabled-preview-v1';
export const QL232_CHECKS = [
  { id: 'ESCALATION_OUTCOME', title: 'Overdue recheck escalation outcomes', detail: 'Review fictional escalations, histories and held handoff exceptions.' },
  { id: 'INDEPENDENT_DISPOSITION', title: 'Independent disposition recurrence', detail: 'Inspect repeat disposition decisions and unsent independent referrals.' },
  { id: 'HOLD_PROOF', title: 'Conditional hold proof revalidation', detail: 'Recheck all twelve actual QL-181 prerequisites without treating fictional proof as authorization.' }
] as const;
export type Ql232Check = typeof QL232_CHECKS[number]['id'];
export type Ql232Escalation = 'ESCALATION_OUTCOME_PENDING_UNVERIFIED' | 'SIMULATED_ESCALATION_HANDOFF_UNVERIFIED' |
  'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED';
export type Ql232Disposition = 'MAINTAIN_INDEPENDENT_HOLD_DRAFT' | 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT' |
  'REOPEN_ESCALATION_EXCEPTION_DRAFT';
export type Ql232Proof = 'HOLD_PROOF_REVALIDATION_PENDING_UNVERIFIED' | 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED' |
  'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED';
export type Ql232GapRecord = Readonly<{ escalation: Ql232Escalation; disposition: Ql232Disposition;
  proof: Ql232Proof; note: string; lastCycle: number; recurrenceEvents: number;
  lastRecurrenceCycle: number | null; overdueDispositionEpisodes: number }>;
export type Ql232Case = Readonly<{ sourceToken: string; proofToken: string; cycle: number;
  gaps: Partial<Record<Ql214GapCategory, Ql232GapRecord>>;
  checks: Partial<Record<Ql232Check, 'ACKNOWLEDGED_UNVERIFIED'>>;
  phase: 'overdue_escalation_disposition_proof_review_draft' | 'held_proof_revalidation_packet_prepared' }>;
export type Ql232Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql232Case>>>>;
export type Ql232Sources = Ql231Sources & Readonly<{ dispositionOversight: Ql231Ledger }>;
export type Ql232SourceStatus = 'AWAITING_PREPARED_QL231' | 'SOURCE_CURRENT' |
  'QL231_DISPOSITION_REVISED' | 'UPSTREAM_STALE' | 'HOLD_PROOF_REVISED';

function fictionalToken(value: unknown): string {
  // Local revision marker only. Never an independent evidence signature or authorization.
  let hash = 2166136261;
  for (const char of JSON.stringify(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-proof-${(hash >>> 0).toString(16)}`;
}
type SourceCase = ReturnType<typeof ql231CompanyDisposition>['cases'][number];
function sourceToken(item: SourceCase): string {
  return fictionalToken({ sourceToken: item.record?.sourceToken, phase: item.record?.phase,
    cycle: item.record?.cycle, checks: item.record?.checks, status: item.sourceStatus,
    gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
      evidence: gap.evidence, disposition: gap.disposition, recheck: gap.recheck,
      recurrenceEvents: gap.recheckRecurrences, overdueRecheckEpisodes: gap.overdueRecheckEpisodes,
      note: item.record?.gaps[gap.category]?.note })) });
}
function holdProofToken(): string {
  return fictionalToken(QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })));
}
function actualHoldsAllHeld(): boolean {
  return QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED');
}

export function ql232CompanyProof(sources: Ql232Sources, ledger: Ql232Ledger, company: OrganizationId) {
  const upstream = ql231CompanyDisposition(sources, sources.dispositionOversight, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared && item.gaps.length > 0;
    const sourceStatus: Ql232SourceStatus = !record ? 'AWAITING_PREPARED_QL231' : !eligible ?
      'UPSTREAM_STALE' : record.sourceToken !== sourceToken(item) ? 'QL231_DISPOSITION_REVISED' :
      record.proofToken !== holdProofToken() || !actualHoldsAllHeld() ? 'HOLD_PROOF_REVISED' : 'SOURCE_CURRENT';
    const active = sourceStatus === 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const current = active ? record?.gaps[gap.category] : undefined;
      const age = current && record ? Math.max(0, record.cycle - current.lastCycle) : null;
      const escalation = current?.escalation ?? 'NOT_RECONCILED' as const;
      const disposition = current?.disposition ?? 'NOT_DRAFTED' as const;
      const proof = current?.proof ?? 'NOT_REVALIDATED' as const;
      const separateDispositionDue = gap.priority === 'P0' || gap.recheckRecurrences > 0 ||
        gap.overdueRecheckEpisodes > 0 || gap.recurrenceDue ||
        escalation === 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED' ||
        proof === 'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED' ||
        (current?.recurrenceEvents ?? 0) > 0 || (current?.overdueDispositionEpisodes ?? 0) > 0;
      const missingDisposition = separateDispositionDue && disposition === 'MAINTAIN_INDEPENDENT_HOLD_DRAFT' ||
        escalation === 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED' &&
          !['REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT', 'REOPEN_ESCALATION_EXCEPTION_DRAFT'].includes(disposition);
      return { ...gap, escalation, disposition, proof, age,
        dueSoon: age === 2, overdue: age !== null && age >= 3,
        nextDueCycle: current ? current.lastCycle + 3 : null,
        separateDispositionDue, missingDisposition,
        dispositionRecurrences: current?.recurrenceEvents ?? 0,
        overdueDispositionEpisodes: current?.overdueDispositionEpisodes ?? 0,
        actualEscalationVerified: false as const, actualHoldProofVerified: false as const };
    });
    const unreviewed = active ? gaps.filter((gap) => gap.escalation === 'NOT_RECONCILED' || gap.proof === 'NOT_REVALIDATED').length : gaps.length;
    const dueSoon = active ? gaps.filter((gap) => gap.dueSoon).length : 0;
    const overdue = active ? gaps.filter((gap) => gap.overdue).length : 0;
    const missingDispositions = active ? gaps.filter((gap) => gap.missingDisposition).length : 0;
    const recurring = active ? gaps.filter((gap) => gap.escalation === 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED').length : 0;
    const recurrenceEvents = active ? gaps.reduce((sum, gap) => sum + gap.dispositionRecurrences, 0) : 0;
    const overdueDispositionEpisodes = active ? gaps.reduce((sum, gap) => sum + gap.overdueDispositionEpisodes, 0) : 0;
    const proofGaps = active ? gaps.filter((gap) => gap.proof === 'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED').length : 0;
    const checksComplete = active && QL232_CHECKS.every((check) => record?.checks[check.id] === 'ACKNOWLEDGED_UNVERIFIED');
    const readyForLocalAudit = active && gaps.length > 0 && unreviewed === 0 && overdue === 0 &&
      missingDispositions === 0 && checksComplete && actualHoldsAllHeld();
    return { ...item, record, eligible, sourceStatus, gaps, unreviewed, dueSoon, overdue,
      missingDispositions, recurring, recurrenceEvents, overdueDispositionEpisodes, proofGaps,
      checksComplete, readyForLocalAudit,
      prepared: readyForLocalAudit && record?.phase === 'held_proof_revalidation_packet_prepared',
      actualIndependentDisposition: false as const, actualProofVerified: false as const,
      actualOwnerAuthorization: false as const, releaseHold: 'HELD_UNVERIFIED' as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) => !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.prepared).length,
    unreviewed: cases.reduce((sum, item) => sum + (item.sourceStatus === 'SOURCE_CURRENT' ? item.unreviewed : 0), 0),
    dueSoon: cases.reduce((sum, item) => sum + item.dueSoon, 0),
    overdue: cases.reduce((sum, item) => sum + item.overdue, 0),
    missingDispositions: cases.reduce((sum, item) => sum + item.missingDispositions, 0),
    recurring: cases.reduce((sum, item) => sum + item.recurring, 0),
    recurrenceEvents: cases.reduce((sum, item) => sum + item.recurrenceEvents, 0),
    overdueDispositionEpisodes: cases.reduce((sum, item) => sum + item.overdueDispositionEpisodes, 0),
    proofGaps: cases.reduce((sum, item) => sum + item.proofGaps, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: actualHoldsAllHeld(), conditionalRelease: 'BLOCKED' as const } };
}
function withCase(ledger: Ql232Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql232Case): Ql232Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}
export function beginQl232ProofReview(sources: Ql232Sources, ledger: Ql232Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql232Ledger {
  const item = ql231CompanyDisposition(sources, sources.dispositionOversight, company).cases.find((entry) => entry.scenario === scenario);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.gaps.length || !actualHoldsAllHeld()) return ledger;
  const token = sourceToken(item), proofToken = holdProofToken();
  if (ledger[company]?.[scenario]?.sourceToken === token && ledger[company]?.[scenario]?.proofToken === proofToken) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, proofToken, cycle: 0, gaps: {}, checks: {},
    phase: 'overdue_escalation_disposition_proof_review_draft' });
}
export function recordQl232Outcome(sources: Ql232Sources, ledger: Ql232Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, escalation: Ql232Escalation,
  disposition: Ql232Disposition, proof: Ql232Proof, note: string): Ql232Ledger {
  const item = ql232CompanyProof(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'overdue_escalation_disposition_proof_review_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['ESCALATION_OUTCOME_PENDING_UNVERIFIED', 'SIMULATED_ESCALATION_HANDOFF_UNVERIFIED', 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED'].includes(escalation) ||
      !['MAINTAIN_INDEPENDENT_HOLD_DRAFT', 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT', 'REOPEN_ESCALATION_EXCEPTION_DRAFT'].includes(disposition) ||
      !['HOLD_PROOF_REVALIDATION_PENDING_UNVERIFIED', 'SIMULATED_HELD_PROOF_MATCH_UNVERIFIED', 'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED'].includes(proof) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.gaps[category];
  const overdue = !!previous && item.record.cycle - previous.lastCycle >= 3;
  if (overdue && disposition !== 'REFER_NEW_INDEPENDENT_DISPOSITION_DRAFT') return ledger;
  if ((escalation === 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED' || proof === 'HOLD_PROOF_GAP_RECONFIRMED_UNVERIFIED') &&
      disposition === 'MAINTAIN_INDEPENDENT_HOLD_DRAFT') return ledger;
  const recurrence = escalation === 'SIMULATED_ESCALATION_EXCEPTION_RECURRED_UNVERIFIED' &&
    previous?.lastRecurrenceCycle !== item.record.cycle;
  return withCase(ledger, company, scenario, { ...item.record, gaps: { ...item.record.gaps,
    [category]: { escalation, disposition, proof, note: note.trim().slice(0, 180), lastCycle: item.record.cycle,
      recurrenceEvents: (previous?.recurrenceEvents ?? 0) + (recurrence ? 1 : 0),
      lastRecurrenceCycle: recurrence ? item.record.cycle : previous?.lastRecurrenceCycle ?? null,
      overdueDispositionEpisodes: (previous?.overdueDispositionEpisodes ?? 0) + (overdue ? 1 : 0) } } });
}
export function advanceQl232Cycle(sources: Ql232Sources, ledger: Ql232Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql232Ledger {
  const item = ql232CompanyProof(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'overdue_escalation_disposition_proof_review_draft' || item.record.cycle >= 12) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}
export function acknowledgeQl232Check(sources: Ql232Sources, ledger: Ql232Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId, check: Ql232Check): Ql232Ledger {
  const item = ql232CompanyProof(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' ||
      item.record.phase !== 'overdue_escalation_disposition_proof_review_draft' ||
      !QL232_CHECKS.some((candidate) => candidate.id === check) ||
      item.record.checks[check] === 'ACKNOWLEDGED_UNVERIFIED') return ledger;
  return withCase(ledger, company, scenario, { ...item.record,
    checks: { ...item.record.checks, [check]: 'ACKNOWLEDGED_UNVERIFIED' } });
}
export function prepareQl232HeldProof(sources: Ql232Sources, ledger: Ql232Ledger,
  company: OrganizationId, scenario: Ql211ScenarioId): Ql232Ledger {
  const item = ql232CompanyProof(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.record.phase !== 'overdue_escalation_disposition_proof_review_draft' || !item.readyForLocalAudit) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'held_proof_revalidation_packet_prepared' });
}
export function ql232Portfolio(sources: Ql232Sources, ledger: Ql232Ledger) {
  const companies = operatorOrganizations.map((organization) => ql232CompanyProof(sources, ledger, organization.id));
  const total = (key: 'eligible' | 'tracking' | 'prepared' | 'unreviewed' | 'dueSoon' | 'overdue' |
    'missingDispositions' | 'recurring' | 'recurrenceEvents' | 'overdueDispositionEpisodes' | 'proofGaps' | 'stale') =>
    companies.reduce((sum, company) => sum + company[key], 0);
  return { release: QL232_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: total('eligible'), tracking: total('tracking'), prepared: total('prepared'),
    unreviewed: total('unreviewed'), dueSoon: total('dueSoon'), overdue: total('overdue'),
    missingDispositions: total('missingDispositions'), recurring: total('recurring'),
    recurrenceEvents: total('recurrenceEvents'), overdueDispositionEpisodes: total('overdueDispositionEpisodes'),
    proofGaps: total('proofGaps'), stale: total('stale'),
    allReleaseHoldsPreserved: companies.every((company) => company.holdAudit.allHeld),
    actualIndependentDisposition: false as const, actualHoldProofVerified: false as const,
    actualOwnerAuthorization: false as const, livePilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Status-only receipt: excludes notes, synthetic source/proof tokens, reviewer identities and private data. */
export function ql232CompanyReceipt(sources: Ql232Sources, ledger: Ql232Ledger, company: OrganizationId): string {
  const summary = ql232CompanyProof(sources, ledger, company);
  return JSON.stringify({ release: QL232_RELEASE, company,
    scope: 'Fictional overdue recheck escalation, independent disposition recurrence and held proof revalidation',
    eligible: summary.eligible, tracking: summary.tracking, prepared: summary.prepared,
    unreviewed: summary.unreviewed, dueSoon: summary.dueSoon, overdue: summary.overdue,
    missingDispositions: summary.missingDispositions, recurring: summary.recurring,
    recurrenceEvents: summary.recurrenceEvents, overdueDispositionEpisodes: summary.overdueDispositionEpisodes,
    proofGaps: summary.proofGaps, stale: summary.stale, orphaned: summary.orphaned,
    cases: summary.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      cycle: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.cycle ?? 0 : null,
      checks: QL232_CHECKS.map((check) => ({ id: check.id, status: item.sourceStatus === 'SOURCE_CURRENT' ?
        item.record?.checks[check.id] ?? 'NOT_REVIEWED' : 'NOT_CURRENT' })),
      gaps: item.gaps.map((gap) => ({ category: gap.category, escalation: gap.escalation,
        disposition: gap.disposition, proof: gap.proof, age: gap.age, dueSoon: gap.dueSoon,
        overdue: gap.overdue, missingDisposition: gap.missingDisposition,
        recurrenceEvents: gap.dispositionRecurrences, overdueDispositionEpisodes: gap.overdueDispositionEpisodes,
        actualIndependentDisposition: false, actualHoldProofVerified: false })),
      conditionalRelease: 'BLOCKED', realOwnerAuthorization: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualIndependentDisposition: false, actualHoldProofVerified: false,
    notesIncluded: false, sourceTokensIncluded: false, proofTokensIncluded: false,
    reviewerIdentitiesIncluded: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
