import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import type { Ql214GapCategory, Ql214GapPriority, Ql214Ledger } from './ql214ReviewIntake';
import type { Ql215Ledger } from './ql215FollowUpAudit';
import type { Ql216Ledger } from './ql216EscalationHandoff';
import { ql217CompanyReassessment, type Ql217Ledger } from './ql217OwnerReassessment';

export const QL218_RELEASE = 'ql218-four-company-exception-recurrence-owner-decision-replay-hold-followup-disabled-preview-v1';
export type Ql218Disposition = 'SOURCE_RECHECK_DRAFT' | 'OWNER_DECISION_REPLAY_DRAFT' | 'INDEPENDENT_EXCEPTION_REVIEW_DRAFT';
export type Ql218FollowUp = 'HOLD_MONITOR_DRAFT' | 'NEW_EVIDENCE_REQUEST_DRAFT' | 'INDEPENDENT_REVIEW_ESCALATION_DRAFT';
export type Ql218AgeBand = 'CURRENT_CYCLE' | 'WATCH' | 'FOLLOWUP_DUE';
export type Ql218SourceStatus = 'AWAITING_PREPARED_REASSESSMENT' | 'SOURCE_CURRENT' | 'REASSESSMENT_CHANGED' | 'UPSTREAM_STALE';
export type Ql218Replay = Readonly<{
  disposition: Ql218Disposition;
  followUp: Ql218FollowUp;
  note: string;
  lastReplayCycle: number;
  replayCount: number;
  recurrenceCount: number;
}>;
export type Ql218Case = Readonly<{
  sourceToken: string;
  cycle: number;
  decisions: Partial<Record<Ql214GapCategory, Ql218Replay>>;
  phase: 'local_replay_draft' | 'local_hold_followup_prepared';
}>;
export type Ql218Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql218Case>>>>;

export type Ql218Sources = Readonly<{
  trial: Ql211Ledger;
  repair: Ql212Ledger;
  review: Ql213Ledger;
  intake: Ql214Ledger;
  audit: Ql215Ledger;
  handoff: Ql216Ledger;
  reassessment: Ql217Ledger;
}>;

function fingerprint(data: unknown): string {
  // Change detection only; not a cryptographic hash, signed evidence or proof of approval.
  let hash = 2166136261;
  for (const char of JSON.stringify(data)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-recurrence-${(hash >>> 0).toString(16)}`;
}

type Ql217Case = ReturnType<typeof ql217CompanyReassessment>['cases'][number];
function tokenFor(item: Ql217Case) {
  return fingerprint({ upstream: item.record?.handoffToken, phase: item.record?.phase,
    cycle: item.cycle, sourceStatus: item.sourceStatus,
    gaps: item.gaps.map(({ category, priority, followUp, decisionAction, lastDecisionCycle, decisionAge }) =>
      ({ category, priority, followUp, decisionAction, lastDecisionCycle, decisionAge,
        note: item.record?.decisions[category]?.note })) });
}

export function ql218AgeBand(priority: Ql214GapPriority, cycle: number, lastReplayCycle: number): Ql218AgeBand {
  const missed = Math.max(0, cycle - lastReplayCycle);
  if (missed === 0) return 'CURRENT_CYCLE';
  return missed >= (priority === 'P0' || priority === 'P1' ? 2 : 4) ? 'FOLLOWUP_DUE' : 'WATCH';
}

export function ql218CompanyAudit(sources: Ql218Sources, ledger: Ql218Ledger, company: OrganizationId) {
  const upstream = ql217CompanyReassessment(sources.trial, sources.repair, sources.review,
    sources.intake, sources.audit, sources.handoff, sources.reassessment, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.preparedForHumanReview && item.gaps.length > 0;
    const sourceStatus: Ql218SourceStatus = !record ? 'AWAITING_PREPARED_REASSESSMENT' :
      !eligible ? 'UPSTREAM_STALE' : record.sourceToken !== tokenFor(item) ? 'REASSESSMENT_CHANGED' : 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const replay = sourceStatus === 'SOURCE_CURRENT' ? record?.decisions[gap.category] : undefined;
      return { ...gap, replayCount: replay?.replayCount ?? 0, recurrenceCount: replay?.recurrenceCount ?? 0,
        replayDisposition: replay?.disposition ?? 'NOT_REPLAYED' as const,
        followUp: replay?.followUp ?? 'NOT_DRAFTED' as const,
        lastReplayCycle: replay?.lastReplayCycle ?? 0,
        followUpAge: ql218AgeBand(gap.priority, record?.cycle ?? 0, replay?.lastReplayCycle ?? 0),
        independentlyVerified: false as const };
    });
    return { ...item, record, eligible, sourceStatus, gaps, cycle: record?.cycle ?? 0,
      preparedFollowUp: sourceStatus === 'SOURCE_CURRENT' && record?.phase === 'local_hold_followup_prepared',
      recurrence: sourceStatus === 'SOURCE_CURRENT' ? gaps.reduce((sum, gap) => sum + gap.recurrenceCount, 0) : 0,
      followUpDue: sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.followUpAge === 'FOLLOWUP_DUE').length : 0,
      releaseHold: 'HELD_UNVERIFIED' as const, actualOwnerDecision: false as const,
      independentApproval: false as const, transmitted: false as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((scenario) => !cases.some((item) => item.scenario === scenario)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.preparedFollowUp).length,
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    recurrence: cases.reduce((sum, item) => sum + item.recurrence, 0),
    followUpDue: cases.reduce((sum, item) => sum + item.followUpDue, 0),
    releaseAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((prerequisite) => prerequisite.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((prerequisite) => prerequisite.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const, ownerApproval: false as const, independentVerification: false as const } };
}

function withCase(ledger: Ql218Ledger, company: OrganizationId, scenario: Ql211ScenarioId, record: Ql218Case): Ql218Ledger {
  return { ...ledger, [company]: { ...ledger[company], [scenario]: record } };
}

/** Explicit reset to the current QL-217 fictional reassessment, never automatic acceptance of revised evidence. */
export function beginQl218Replay(sources: Ql218Sources, ledger: Ql218Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId): Ql218Ledger {
  const upstream = ql217CompanyReassessment(sources.trial, sources.repair, sources.review,
    sources.intake, sources.audit, sources.handoff, sources.reassessment, company).cases.find((item) => item.scenario === scenario);
  if (!upstream || upstream.sourceStatus !== 'SOURCE_CURRENT' || !upstream.preparedForHumanReview || !upstream.gaps.length) return ledger;
  const token = tokenFor(upstream);
  if (ledger[company]?.[scenario]?.sourceToken === token) return ledger;
  return withCase(ledger, company, scenario, { sourceToken: token, cycle: 0, decisions: {}, phase: 'local_replay_draft' });
}

/** The only clock is a bounded explicit, invented review cycle. It is never a reminder or elapsed time. */
export function advanceQl218Cycle(sources: Ql218Sources, ledger: Ql218Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId): Ql218Ledger {
  const item = ql218CompanyAudit(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.cycle >= 20) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, cycle: item.record.cycle + 1 });
}

/** Repeated fictional owner replay after a new cycle counts a recurrence, never independently verified closure. */
export function recordQl218Replay(sources: Ql218Sources, ledger: Ql218Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId, category: Ql214GapCategory, disposition: Ql218Disposition,
  followUp: Ql218FollowUp, note: string): Ql218Ledger {
  const item = ql218CompanyAudit(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'local_replay_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['SOURCE_RECHECK_DRAFT', 'OWNER_DECISION_REPLAY_DRAFT', 'INDEPENDENT_EXCEPTION_REVIEW_DRAFT'].includes(disposition) ||
      !['HOLD_MONITOR_DRAFT', 'NEW_EVIDENCE_REQUEST_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT'].includes(followUp) ||
      note.trim().length < 8) return ledger;
  const previous = item.record.decisions[category];
  if (previous && previous.lastReplayCycle === item.record.cycle) return ledger; // no same-cycle recurrence inflation
  return withCase(ledger, company, scenario, { ...item.record,
    decisions: { ...item.record.decisions, [category]: { disposition, followUp, note: note.trim().slice(0, 180),
      lastReplayCycle: item.record.cycle, replayCount: (previous?.replayCount ?? 0) + 1,
      recurrenceCount: (previous?.recurrenceCount ?? 0) + (previous ? 1 : 0) } } });
}

/** Prepare a local audit only when all source gaps have drafted decisions and hold follow-ups. */
export function prepareQl218HoldAudit(sources: Ql218Sources, ledger: Ql218Ledger, company: OrganizationId,
  scenario: Ql211ScenarioId): Ql218Ledger {
  const item = ql218CompanyAudit(sources, ledger, company).cases.find((entry) => entry.scenario === scenario);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'local_replay_draft' ||
      item.gaps.length === 0 || item.gaps.some((gap) => gap.replayDisposition === 'NOT_REPLAYED') ||
      item.gaps.some((gap) => gap.followUpAge === 'FOLLOWUP_DUE')) return ledger;
  return withCase(ledger, company, scenario, { ...item.record, phase: 'local_hold_followup_prepared' });
}

export function ql218Portfolio(sources: Ql218Sources, ledger: Ql218Ledger) {
  const companies = operatorOrganizations.map((organization) => ql218CompanyAudit(sources, ledger, organization.id));
  return { release: QL218_RELEASE, companies, prerequisites: QL181_PREREQUISITES,
    eligible: companies.reduce((sum, company) => sum + company.eligible, 0),
    tracking: companies.reduce((sum, company) => sum + company.tracking, 0),
    prepared: companies.reduce((sum, company) => sum + company.prepared, 0),
    stale: companies.reduce((sum, company) => sum + company.stale, 0),
    recurrence: companies.reduce((sum, company) => sum + company.recurrence, 0),
    followUpDue: companies.reduce((sum, company) => sum + company.followUpDue, 0),
    allReleaseHoldsPreserved: companies.every((company) => company.releaseAudit.allHeld),
    livePilotReady: false as const, independentReviewVerified: false as const, ownerDecisionCaptured: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Machine-readable case counts/statuses only; no source tokens or drafted text in receipt. */
export function ql218CompanyReceipt(sources: Ql218Sources, ledger: Ql218Ledger, company: OrganizationId): string {
  const audit = ql218CompanyAudit(sources, ledger, company);
  return JSON.stringify({ release: QL218_RELEASE, company,
    scope: 'Session-only fictional recurrence and owner replay; never an actual follow-up or review',
    eligible: audit.eligible, tracking: audit.tracking, prepared: audit.prepared, stale: audit.stale,
    orphaned: audit.orphaned, recurrence: audit.recurrence, followUpDue: audit.followUpDue,
    cases: audit.cases.map((item) => ({ scenario: item.scenario, sourceStatus: item.sourceStatus,
      cycle: item.cycle, phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase : 'NOT_CURRENT',
      gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
        replayCount: gap.replayCount, recurrenceCount: gap.recurrenceCount,
        disposition: gap.replayDisposition, followUp: gap.followUp, age: gap.followUpAge,
        independentlyVerified: false })),
      actualOwnerDecision: false, independentApproval: false, releaseHold: 'HELD_UNVERIFIED' })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualOwnerAuthorization: false, independentReviewVerified: false,
    sourceTokensIncluded: false, notesIncluded: false, customerIdentitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
