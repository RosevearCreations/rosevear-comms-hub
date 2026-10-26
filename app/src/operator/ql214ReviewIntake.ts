import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import { ql213ReviewForCompany, type Ql213Draft, type Ql213Ledger } from './ql213ReviewPreparation';

export const QL214_RELEASE = 'ql214-four-company-independent-review-intake-release-holds-disabled-preview-v1';
export const QL214_GAP_CATEGORIES = [
  { id: 'source_provenance', label: 'Source provenance and repeatability' },
  { id: 'actual_repair', label: 'Actual code/visual repair evidence' },
  { id: 'human_retest', label: 'Independent manual retest' },
  { id: 'accessibility', label: 'Keyboard, assistive tech and zoom' },
  { id: 'company_isolation', label: 'Company/tenant data isolation' },
  { id: 'consent_privacy', label: 'Consent, privacy and retention' },
  { id: 'provider_safety', label: 'Provider, cost and abuse safeguards' },
  { id: 'release_governance', label: 'Independent sign-off and rollback' }
] as const;
export type Ql214GapCategory = typeof QL214_GAP_CATEGORIES[number]['id'];
export type Ql214GapPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type Ql214FollowUp = 'OPEN_UNVERIFIED' | 'FOLLOWUP_PLANNED' | 'REFERENCE_DRAFTED_UNVERIFIED';
export type Ql214Reviewer = 'unassigned' | 'fictional_security_reviewer' | 'fictional_accessibility_reviewer' | 'fictional_operations_reviewer';
export const QL214_REVIEWERS: readonly Ql214Reviewer[] = [
  'unassigned', 'fictional_security_reviewer', 'fictional_accessibility_reviewer', 'fictional_operations_reviewer'
];
export type Ql214Gap = Readonly<{
  category: Ql214GapCategory;
  priority: Ql214GapPriority;
  followUp: Ql214FollowUp;
  note: string;
}>;
export type Ql214Intake = Readonly<{
  upstreamToken: string;
  reviewer: Ql214Reviewer;
  brief: string;
  phase: 'intake_draft' | 'local_handoff_prepared';
  gaps: readonly Ql214Gap[];
}>;
export type Ql214Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql214Intake>>>>;

function tokenFor(draft: Ql213Draft): string {
  // Not a credential, approval signature or secure digest: only a session-local stale-source sentinel.
  let hash = 2166136261;
  for (const char of JSON.stringify(draft)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-upstream-${(hash >>> 0).toString(16)}`;
}

export function ql214CompanyReview(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  ledger: Ql214Ledger, company: OrganizationId) {
  const upstream = ql213ReviewForCompany(trial, repair, review, company);
  const cases = upstream.items.map((item) => {
    const intake = ledger[company]?.[item.finding.id] ?? null;
    const stale = Boolean(intake && (item.readiness !== 'PREPARED_FOR_REVIEW_UNVERIFIED' || !item.draft ||
      item.stale || intake.upstreamToken !== tokenFor(item.draft)));
    return { scenario: item.finding.id, title: item.finding.title, priority: item.finding.priority,
      upstreamReadiness: item.readiness, eligible: item.readiness === 'PREPARED_FOR_REVIEW_UNVERIFIED',
      intake, stale, evidenceGapCount: intake?.gaps.length ?? 0,
      openReleaseHold: true as const, independentReviewerAuthenticated: false as const,
      actualIndependentReview: false as const, realOwnerApproval: false as const };
  });
  const orphaned = Object.keys(ledger[company] ?? {}).filter((id) => !cases.some((item) => item.scenario === id)).length;
  return { company, cases, openFindings: cases.length,
    drafts: cases.filter((item) => item.intake && !item.stale).length,
    handoffsPrepared: cases.filter((item) => item.intake?.phase === 'local_handoff_prepared' && !item.stale).length,
    gaps: cases.reduce((count, item) => count + (item.stale ? 0 : item.evidenceGapCount), 0),
    stale: cases.filter((item) => item.stale).length + orphaned, orphaned,
    prerequisites: QL181_PREREQUISITES, releaseHold: 'HELD_UNVERIFIED' as const,
    ownerApproved: false as const, independentlyReviewed: false as const, livePilotReady: false as const };
}

function withIntake(ledger: Ql214Ledger, company: OrganizationId, id: Ql211ScenarioId, intake: Ql214Intake): Ql214Ledger {
  return { ...ledger, [company]: { ...ledger[company], [id]: intake } };
}

function currentIntake(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger, ledger: Ql214Ledger,
  company: OrganizationId, id: Ql211ScenarioId) {
  const item = ql214CompanyReview(trial, repair, review, ledger, company).cases.find((candidate) => candidate.scenario === id);
  return item?.eligible && item.intake && !item.stale ? item.intake : null;
}

/** Requires completed QL-213 local preparation. Neither an intake nor a review is assumed or seeded. */
export function beginQl214Intake(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  ledger: Ql214Ledger, company: OrganizationId, id: Ql211ScenarioId): Ql214Ledger {
  const item = ql213ReviewForCompany(trial, repair, review, company).items.find((candidate) => candidate.finding.id === id);
  if (!item || item.readiness !== 'PREPARED_FOR_REVIEW_UNVERIFIED' || !item.draft) return ledger;
  const token = tokenFor(item.draft);
  if (ledger[company]?.[id]?.upstreamToken === token) return ledger;
  // UI requires explicit confirmation when replacing an outdated review packet.
  return withIntake(ledger, company, id, { upstreamToken: token, reviewer: 'unassigned', brief: '',
    phase: 'intake_draft', gaps: [] });
}

export function draftQl214Intake(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  ledger: Ql214Ledger, company: OrganizationId, id: Ql211ScenarioId,
  reviewer: Ql214Reviewer, brief: string): Ql214Ledger {
  const intake = currentIntake(trial, repair, review, ledger, company, id);
  if (!intake || intake.phase !== 'intake_draft' || !QL214_REVIEWERS.includes(reviewer)) return ledger;
  return withIntake(ledger, company, id, { ...intake, reviewer, brief: brief.slice(0, 200) });
}

/** At most one gap per category; editing a gap never closes it or removes a policy hold. */
export function upsertQl214Gap(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  ledger: Ql214Ledger, company: OrganizationId, id: Ql211ScenarioId,
  gap: Ql214Gap): Ql214Ledger {
  const intake = currentIntake(trial, repair, review, ledger, company, id);
  if (!intake || intake.phase !== 'intake_draft' || !QL214_GAP_CATEGORIES.some((entry) => entry.id === gap.category) ||
      !['P0', 'P1', 'P2', 'P3'].includes(gap.priority) ||
      !['OPEN_UNVERIFIED', 'FOLLOWUP_PLANNED', 'REFERENCE_DRAFTED_UNVERIFIED'].includes(gap.followUp) ||
      gap.note.trim().length < 8) return ledger;
  const next: Ql214Gap = { category: gap.category, priority: gap.priority,
    followUp: gap.followUp, note: gap.note.slice(0, 180) };
  return withIntake(ledger, company, id, { ...intake,
    gaps: [...intake.gaps.filter((entry) => entry.category !== gap.category), next] });
}

/** Local preparation only: does not dispatch, authenticate reviewers, close findings or lift holds. */
export function prepareQl214Handoff(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  ledger: Ql214Ledger, company: OrganizationId, id: Ql211ScenarioId): Ql214Ledger {
  const intake = currentIntake(trial, repair, review, ledger, company, id);
  if (!intake || intake.phase !== 'intake_draft' || intake.reviewer === 'unassigned' ||
      intake.brief.trim().length < 8 || intake.gaps.length === 0 ||
      intake.gaps.some((gap) => gap.followUp === 'OPEN_UNVERIFIED')) return ledger;
  return withIntake(ledger, company, id, { ...intake, phase: 'local_handoff_prepared' });
}

export function ql214Portfolio(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger, ledger: Ql214Ledger) {
  const companies = operatorOrganizations.map((organization) => ql214CompanyReview(trial, repair, review, ledger, organization.id));
  return { release: QL214_RELEASE, companies,
    openFindings: companies.reduce((sum, row) => sum + row.openFindings, 0),
    drafts: companies.reduce((sum, row) => sum + row.drafts, 0),
    evidenceGaps: companies.reduce((sum, row) => sum + row.gaps, 0),
    stale: companies.reduce((sum, row) => sum + row.stale, 0),
    locallyPrepared: companies.reduce((sum, row) => sum + row.handoffsPrepared, 0),
    heldPrerequisites: QL181_PREREQUISITES, livePilotReady: false as const,
    independentlyReviewed: false as const, ownerApproved: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Fixed-schema summary. No free-text, local source token, reviewer identity, or customer identifiers. */
export function ql214CompanyReceipt(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  ledger: Ql214Ledger, company: OrganizationId): string {
  const row = ql214CompanyReview(trial, repair, review, ledger, company);
  return JSON.stringify({ release: QL214_RELEASE, company,
    scope: 'Fictional local review intake and conditional hold register only — no independent signoff',
    openFindings: row.openFindings, drafts: row.drafts, gaps: row.gaps, stale: row.stale, orphaned: row.orphaned,
    cases: row.cases.map(({ scenario, priority, intake, stale }) => ({ scenario, priority, stale,
      phase: intake?.phase ?? 'not_started', reviewAssigned: Boolean(intake && intake.reviewer !== 'unassigned'),
      evidenceGaps: intake?.gaps.map(({ category, priority, followUp }) => ({ category, priority, followUp })) ?? [],
      releaseHold: 'HELD_UNVERIFIED', independentReviewCompleted: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', realOwnerApproval: false, independentApproval: false,
    actualRepairVerified: false, textIncluded: false, reviewerIdentityIncluded: false,
    providerConnected: false, callsPlaced: 0, messagesSent: 0, externalWrites: 0 }, null, 2);
}
