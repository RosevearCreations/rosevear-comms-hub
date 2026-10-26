import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import type { Ql214GapCategory, Ql214Ledger, Ql214GapPriority } from './ql214ReviewIntake';
import type { Ql215Ledger } from './ql215FollowUpAudit';
import { ql216CompanyReplay, type Ql216Ledger } from './ql216EscalationHandoff';

export const QL217_RELEASE = 'ql217-four-company-owner-handoff-decision-aging-evidence-reassessment-disabled-preview-v1';
export type Ql217EvidenceAction = 'NOT_REASSESSED' | 'SOURCE_RECHECK_DRAFTED' |
  'INDEPENDENT_RETEST_PLANNED' | 'COMPARISON_REPLAY_NOTED_UNVERIFIED';
export type Ql217AgeBand = 'CURRENT_CYCLE' | 'FOLLOWUP_WATCH' | 'DECISION_REASSESSMENT_DUE';
export type Ql217SourceStatus = 'AWAITING_PREPARED_HANDOFF' | 'SOURCE_CURRENT' | 'HANDOFF_CHANGED' | 'UPSTREAM_STALE';
export type Ql217GapDecision = Readonly<{ action: Ql217EvidenceAction; note: string; lastDecisionCycle: number }>;
export type Ql217Case = Readonly<{
  handoffToken: string;
  simulatedCycle: number;
  decisions: Partial<Record<Ql214GapCategory, Ql217GapDecision>>;
  phase: 'local_reassessment_draft' | 'local_reassessment_prepared';
}>;
export type Ql217Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql217Case>>>>;

function fingerprint(input: unknown): string {
  // Local change-detection token, neither a signed reviewer attestation nor an approval receipt.
  let value = 2166136261;
  for (const ch of JSON.stringify(input)) { value ^= ch.charCodeAt(0); value = Math.imul(value, 16777619); }
  return `fictional-handoff-${(value >>> 0).toString(16)}`;
}

type Ql216Case = ReturnType<typeof ql216CompanyReplay>['cases'][number];
function tokenFor(item: Ql216Case): string {
  return fingerprint({ packet: item.packet, source: item.upstreamSourceStatus, cycle: item.cycle,
    gaps: item.gaps.map(({ category, priority, followUp, action, lastReviewCycle, ageBand }) =>
      ({ category, priority, followUp, action, lastReviewCycle, ageBand })) });
}

export function ql217AgeBand(priority: Ql214GapPriority, currentCycle: number, lastDecisionCycle: number): Ql217AgeBand {
  const missed = Math.max(0, currentCycle - lastDecisionCycle);
  if (missed === 0) return 'CURRENT_CYCLE';
  if (missed >= (priority === 'P0' || priority === 'P1' ? 3 : 5)) return 'DECISION_REASSESSMENT_DUE';
  return 'FOLLOWUP_WATCH';
}

export function ql217CompanyReassessment(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, handoff: Ql216Ledger, ledger: Ql217Ledger, company: OrganizationId) {
  const upstream = ql216CompanyReplay(trial, repair, review, intake, audit, handoff, company);
  const cases = upstream.cases.map((item) => {
    const record = ledger[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && item.prepared;
    const sourceStatus: Ql217SourceStatus = !record ? 'AWAITING_PREPARED_HANDOFF' :
      !eligible ? 'UPSTREAM_STALE' : record.handoffToken !== tokenFor(item) ? 'HANDOFF_CHANGED' : 'SOURCE_CURRENT';
    const gaps = item.gaps.map((gap) => {
      const decision = sourceStatus === 'SOURCE_CURRENT' ? record?.decisions[gap.category] : undefined;
      const lastDecisionCycle = decision?.lastDecisionCycle ?? 0;
      return { ...gap, decisionAction: decision?.action ?? 'NOT_REASSESSED' as Ql217EvidenceAction,
        lastDecisionCycle, decisionAge: ql217AgeBand(gap.priority, record?.simulatedCycle ?? 0, lastDecisionCycle),
        remainsUnverified: true as const };
    });
    return { ...item, record, eligible, sourceStatus, gaps,
      cycle: record?.simulatedCycle ?? 0,
      decisionDue: sourceStatus === 'SOURCE_CURRENT' ? gaps.filter((gap) => gap.decisionAge === 'DECISION_REASSESSMENT_DUE').length : 0,
      preparedForHumanReview: sourceStatus === 'SOURCE_CURRENT' && record?.phase === 'local_reassessment_prepared',
      releaseHold: 'HELD_UNVERIFIED' as const, independentEvidenceVerified: false as const,
      actualOwnerApproval: false as const, externalDispatch: false as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((id) => !cases.some((item) => item.scenario === id)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    tracking: cases.filter((item) => item.record && item.sourceStatus === 'SOURCE_CURRENT').length,
    prepared: cases.filter((item) => item.preparedForHumanReview).length,
    stale: cases.filter((item) => item.record && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    decisionDue: cases.reduce((sum, item) => sum + item.decisionDue, 0),
    holdAudit: { expected: 12 as const, observed: QL181_PREREQUISITES.length,
      held: QL181_PREREQUISITES.filter((item) => item.state === 'HELD_UNVERIFIED').length,
      allHeld: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((item) => item.state === 'HELD_UNVERIFIED'),
      conditionalRelease: 'BLOCKED' as const, actualOwnerApproval: false as const, independentReview: false as const } };
}

function withRecord(ledger: Ql217Ledger, company: OrganizationId, id: Ql211ScenarioId, record: Ql217Case): Ql217Ledger {
  return { ...ledger, [company]: { ...ledger[company], [id]: record } };
}

/** Explicit opt-in to rehearse unresolved QL-216 handoff evidence. A real independent review is not created. */
export function beginQl217Reassessment(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, handoff: Ql216Ledger, ledger: Ql217Ledger,
  company: OrganizationId, id: Ql211ScenarioId): Ql217Ledger {
  const item = ql216CompanyReplay(trial, repair, review, intake, audit, handoff, company).cases.find((caseItem) => caseItem.scenario === id);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.prepared || !item.packet) return ledger;
  const token = tokenFor(item);
  if (ledger[company]?.[id]?.handoffToken === token) return ledger;
  return withRecord(ledger, company, id, { handoffToken: token, simulatedCycle: 0,
    decisions: {}, phase: 'local_reassessment_draft' });
}

/** No timers, calendar promises, notifications or external reminders: one click represents one invented cycle. */
export function advanceQl217DecisionCycle(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, handoff: Ql216Ledger, ledger: Ql217Ledger,
  company: OrganizationId, id: Ql211ScenarioId): Ql217Ledger {
  const item = ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, company).cases.find((caseItem) => caseItem.scenario === id);
  if (!item || !item.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.simulatedCycle >= 20) return ledger;
  return withRecord(ledger, company, id, { ...item.record, simulatedCycle: item.record.simulatedCycle + 1 });
}

/** Record a fictional gap-level independent-evidence request or replay plan; never mark evidence verified. */
export function noteQl217EvidenceReassessment(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, handoff: Ql216Ledger, ledger: Ql217Ledger,
  company: OrganizationId, id: Ql211ScenarioId, category: Ql214GapCategory,
  action: Ql217EvidenceAction, note: string): Ql217Ledger {
  const item = ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, company).cases.find((caseItem) => caseItem.scenario === id);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'local_reassessment_draft' ||
      !item.gaps.some((gap) => gap.category === category) ||
      !['SOURCE_RECHECK_DRAFTED', 'INDEPENDENT_RETEST_PLANNED', 'COMPARISON_REPLAY_NOTED_UNVERIFIED'].includes(action) ||
      note.trim().length < 8) return ledger;
  return withRecord(ledger, company, id, { ...item.record,
    decisions: { ...item.record.decisions,
      [category]: { action, note: note.trim().slice(0, 180), lastDecisionCycle: item.record.simulatedCycle } } });
}

/** Prepared means locally organized for future human review; independent verification remains false. */
export function prepareQl217Reassessment(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, handoff: Ql216Ledger, ledger: Ql217Ledger,
  company: OrganizationId, id: Ql211ScenarioId): Ql217Ledger {
  const item = ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, company).cases.find((caseItem) => caseItem.scenario === id);
  if (!item?.record || item.sourceStatus !== 'SOURCE_CURRENT' || item.record.phase !== 'local_reassessment_draft' ||
      item.gaps.length === 0 || item.gaps.some((gap) => gap.decisionAction === 'NOT_REASSESSED')) return ledger;
  return withRecord(ledger, company, id, { ...item.record, phase: 'local_reassessment_prepared' });
}

export function ql217Portfolio(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, handoff: Ql216Ledger, ledger: Ql217Ledger) {
  const companies = operatorOrganizations.map((company) => ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, company.id));
  return { release: QL217_RELEASE, companies,
    eligible: companies.reduce((sum, item) => sum + item.eligible, 0),
    tracking: companies.reduce((sum, item) => sum + item.tracking, 0),
    prepared: companies.reduce((sum, item) => sum + item.prepared, 0),
    stale: companies.reduce((sum, item) => sum + item.stale, 0),
    decisionDue: companies.reduce((sum, item) => sum + item.decisionDue, 0),
    allReleaseHoldsPreserved: companies.every((item) => item.holdAudit.allHeld),
    prerequisites: QL181_PREREQUISITES, livePilotReady: false as const,
    ownerApprovalCaptured: false as const, independentEvidenceVerified: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** No source tokens, notes, reviewer names or customer information in this fixed-schema local receipt. */
export function ql217CompanyReceipt(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, handoff: Ql216Ledger, ledger: Ql217Ledger, company: OrganizationId) {
  const data = ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, company);
  return JSON.stringify({ release: QL217_RELEASE, company,
    scope: 'Fictional owner decision aging and locally prepared evidence reassessment only',
    eligible: data.eligible, tracking: data.tracking, prepared: data.prepared,
    stale: data.stale, orphaned: data.orphaned, decisionDue: data.decisionDue,
    cases: data.cases.map((item) => ({ scenario: item.scenario, priority: item.priority,
      sourceStatus: item.sourceStatus, simulatedCycle: item.cycle,
      phase: item.sourceStatus === 'SOURCE_CURRENT' ? item.record?.phase ?? 'not_started' : 'NOT_CURRENT',
      gapReview: item.gaps.map(({ category, priority, decisionAge, decisionAction }) =>
        ({ category, priority, decisionAge, decisionAction, independentEvidenceVerified: false })),
      realReviewerSignoff: false, ownerApproval: false, releaseHold: 'HELD_UNVERIFIED' })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualOwnerAuthorization: false,
    independentApproval: false, notesIncluded: false, sourceTokensIncluded: false,
    identitiesIncluded: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
