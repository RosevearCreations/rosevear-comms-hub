import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import { ql214CompanyReview, type Ql214Gap, type Ql214GapCategory, type Ql214Ledger,
  type Ql214Intake } from './ql214ReviewIntake';

export const QL215_RELEASE = 'ql215-four-company-reviewer-gap-aging-source-hold-audit-disabled-preview-v1';
export type Ql215FollowUpAction = 'NOT_REVIEWED' | 'FOLLOWUP_DRAFTED' | 'REFERENCE_RECHECK_PLANNED' | 'ESCALATION_DRAFTED';
export type Ql215AgeBand = 'CURRENT_CYCLE' | 'WATCH_CYCLES' | 'ESCALATION_REVIEW_DUE';
export type Ql215SourceStatus = 'AWAITING_PREPARED_INTAKE' | 'SOURCE_CURRENT' | 'SOURCE_CHANGED' | 'UPSTREAM_STALE';
export type Ql215GapReview = Readonly<{ action: Ql215FollowUpAction; note: string; lastReviewCycle: number }>;
export type Ql215Case = Readonly<{
  sourceToken: string;
  simulatedCycle: number;
  reviews: Partial<Record<Ql214GapCategory, Ql215GapReview>>;
}>;
export type Ql215Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql215Case>>>>;

function sourceToken(intake: Ql214Intake) {
  // In-memory source comparison token, not a security signature or approval receipt.
  let hash = 2166136261;
  for (const char of JSON.stringify(intake)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `preview-intake-${(hash >>> 0).toString(16)}`;
}

export function ql215AgeBand(gap: Pick<Ql214Gap, 'priority'>, simulatedCycle: number, lastReviewCycle: number): Ql215AgeBand {
  const lag = Math.max(0, simulatedCycle - lastReviewCycle);
  if (lag === 0) return 'CURRENT_CYCLE';
  if (lag >= (gap.priority === 'P0' || gap.priority === 'P1' ? 3 : 5)) return 'ESCALATION_REVIEW_DUE';
  return 'WATCH_CYCLES';
}

export function ql215CompanyAudit(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, ledger: Ql215Ledger, company: OrganizationId) {
  const upstream = ql214CompanyReview(trial, repair, review, intake, company);
  const cases = upstream.cases.map((caseEntry) => {
    const record = ledger[company]?.[caseEntry.scenario] ?? null;
    const preparedIntake = caseEntry.intake?.phase === 'local_handoff_prepared' && !caseEntry.stale ? caseEntry.intake : null;
    const sourceStatus: Ql215SourceStatus = !record ? 'AWAITING_PREPARED_INTAKE' :
      caseEntry.stale || !preparedIntake ? 'UPSTREAM_STALE' :
      record.sourceToken !== sourceToken(preparedIntake) ? 'SOURCE_CHANGED' : 'SOURCE_CURRENT';
    const gaps = (preparedIntake?.gaps ?? []).map((gap) => {
      const local = record?.reviews[gap.category];
      return { ...gap, action: sourceStatus === 'SOURCE_CURRENT' ? local?.action ?? 'NOT_REVIEWED' : 'NOT_REVIEWED',
        lastReviewCycle: sourceStatus === 'SOURCE_CURRENT' ? local?.lastReviewCycle ?? 0 : 0,
        ageBand: ql215AgeBand(gap, record?.simulatedCycle ?? 0, local?.lastReviewCycle ?? 0) };
    });
    return { ...caseEntry, record, sourceStatus,
      eligible: Boolean(preparedIntake), gaps,
      cycle: record?.simulatedCycle ?? 0,
      escalationDue: sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.ageBand === 'ESCALATION_REVIEW_DUE').length : 0,
      held: true as const, independentlyReviewed: false as const, actuallyClosed: false as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((id) => !cases.some((item) => item.scenario === id)).length;
  return { company, cases, sourceGaps: upstream.gaps,
    tracked: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    escalations: cases.reduce((sum, item) => sum + item.escalationDue, 0),
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    orphaned, openFindings: upstream.openFindings,
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((hold) => hold.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
      realPilot: 'HELD_UNVERIFIED' as const, ownerSignoff: false as const,
      externalWrites: 0 as const, calls: 0 as const, messages: 0 as const } };
}

function withCase(ledger: Ql215Ledger, company: OrganizationId, id: Ql211ScenarioId, record: Ql215Case): Ql215Ledger {
  return { ...ledger, [company]: { ...ledger[company], [id]: record } };
}

/** An explicit local tracking session for an already-prepared QL-214 fictional handoff. */
export function beginQl215Tracking(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, ledger: Ql215Ledger, company: OrganizationId, id: Ql211ScenarioId): Ql215Ledger {
  const item = ql214CompanyReview(trial, repair, review, intake, company).cases.find((entry) => entry.scenario === id);
  if (!item || item.stale || item.intake?.phase !== 'local_handoff_prepared') return ledger;
  const token = sourceToken(item.intake);
  if (ledger[company]?.[id]?.sourceToken === token) return ledger;
  return withCase(ledger, company, id, { sourceToken: token, simulatedCycle: 0, reviews: {} });
}

/** Advances explicit *simulated* review cycles, never real dates or external reminders. */
export function advanceQl215Cycle(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, ledger: Ql215Ledger, company: OrganizationId, id: Ql211ScenarioId): Ql215Ledger {
  const item = ql215CompanyAudit(trial, repair, review, intake, ledger, company).cases.find((entry) => entry.scenario === id);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.record || item.record.simulatedCycle >= 20) return ledger;
  return withCase(ledger, company, id, { ...item.record, simulatedCycle: item.record.simulatedCycle + 1 });
}

/** Logs an owner-entered fictional follow-up draft; all gap and release holds remain open. */
export function noteQl215FollowUp(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, ledger: Ql215Ledger, company: OrganizationId, id: Ql211ScenarioId,
  category: Ql214GapCategory, action: Ql215FollowUpAction, note: string): Ql215Ledger {
  const item = ql215CompanyAudit(trial, repair, review, intake, ledger, company).cases.find((entry) => entry.scenario === id);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.record ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['FOLLOWUP_DRAFTED', 'REFERENCE_RECHECK_PLANNED', 'ESCALATION_DRAFTED'].includes(action) ||
      note.trim().length < 8) return ledger;
  return withCase(ledger, company, id, { ...item.record,
    reviews: { ...item.record.reviews, [category]: { action, note: note.slice(0, 180),
      lastReviewCycle: item.record.simulatedCycle } } });
}

export function ql215Portfolio(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, ledger: Ql215Ledger) {
  const companies = operatorOrganizations.map((organization) =>
    ql215CompanyAudit(trial, repair, review, intake, ledger, organization.id));
  return { release: QL215_RELEASE, companies,
    tracked: companies.reduce((sum, item) => sum + item.tracked, 0),
    escalations: companies.reduce((sum, item) => sum + item.escalations, 0),
    stale: companies.reduce((sum, item) => sum + item.stale, 0),
    heldPrerequisites: QL181_PREREQUISITES,
    allReleaseHoldsPreserved: companies.every((row) => row.holdAudit.allHeld),
    livePilotReady: false as const, ownerApprovalCaptured: false as const,
    independentApproval: false as const, providerConnected: false as const,
    externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Status-only local receipt; excludes source tokens, reviewers and free-text notes. */
export function ql215CompanyReceipt(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, ledger: Ql215Ledger, company: OrganizationId): string {
  const data = ql215CompanyAudit(trial, repair, review, intake, ledger, company);
  return JSON.stringify({ release: QL215_RELEASE, company,
    scope: 'Fictional simulated review cycles, source reconciliation and read-only hold audit',
    tracked: data.tracked, stale: data.stale, orphaned: data.orphaned, escalations: data.escalations,
    cases: data.cases.map((item) => ({ scenario: item.scenario, priority: item.priority,
      sourceStatus: item.sourceStatus, simulatedCycle: item.cycle,
      gaps: item.gaps.map((gap) => ({ category: gap.category, priority: gap.priority,
        action: gap.action, ageBand: gap.ageBand, stillOpen: true })),
      independentClosure: false, releaseHold: 'HELD_UNVERIFIED' })),
    holdAudit: data.holdAudit, prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', sourceTokenIncluded: false, notesIncluded: false,
    independentApproval: false, realOwnerAuthorization: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
