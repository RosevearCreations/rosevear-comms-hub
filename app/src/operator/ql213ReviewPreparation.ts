import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import { ql212QueueForCompany, type Ql212Entry, type Ql212Ledger,
  type Ql212ReplayRun, type Ql212QueueItem } from './ql212RepairQueue';

export const QL213_RELEASE = 'ql213-four-company-retest-comparison-independent-review-prep-disabled-preview-v1';

export const QL213_REVIEW_CHECKS = [
  { id: 'source', title: 'Original finding trace', help: 'Check that the reported QL-211 gap is still open and the source version matches.' },
  { id: 'repair', title: 'Repair claim and code evidence', help: 'Record what source or visual repair still needs independent inspection.' },
  { id: 'comparison', title: 'Before/after replay limits', help: 'Explain what the fictional QL-210 checks can and cannot demonstrate.' },
  { id: 'manual', title: 'Human retest and accessibility', help: 'Record missing operator/device evidence without claiming a verified pass.' },
  { id: 'isolation', title: 'Four-company safety and pilot holds', help: 'Flag tenant separation, consent, provider and twelve held prerequisites for review.' }
] as const;
export type Ql213CheckId = typeof QL213_REVIEW_CHECKS[number]['id'];
export type Ql213CheckState = 'not_prepared' | 'drafted_unverified' | 'followup_needed';
export type Ql213CheckEntry = Readonly<{ state: Ql213CheckState; note: string }>;
export type Ql213Draft = Readonly<{
  sourceToken: string;
  before: Ql212ReplayRun;
  after: Ql212ReplayRun | null;
  checks: Partial<Record<Ql213CheckId, Ql213CheckEntry>>;
}>;
export type Ql213Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql213Draft>>>>;
export type Ql213Comparison = 'AFTER_RUN_MISSING' | 'MANUAL_ONLY' | 'UNCHANGED_SYNTHETIC' | 'CHANGED_SYNTHETIC';
export type Ql213Readiness = 'NOT_PREPARED' | 'STALE_REPAIR_SOURCE' | 'AFTER_REPLAY_REQUIRED' |
  'RETEST_UNRESOLVED' | 'CHECKLIST_INCOMPLETE' | 'FOLLOWUP_REQUIRED' | 'PREPARED_FOR_REVIEW_UNVERIFIED';

function noteFingerprint(source: string): string {
  let hash = 2166136261;
  for (const char of source) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16);
}

function sourceToken(entry: Ql212Entry): string {
  return `${entry.sourceFingerprint}:repair-${noteFingerprint(entry.repairNote)}:${entry.phase}`;
}

const retestPhases: readonly Ql212Entry['phase'][] = ['retest_pass_noted', 'retest_fail_noted', 'retest_blocked'];
function eligible(item: Ql212QueueItem): item is Ql212QueueItem & { entry: Ql212Entry } {
  return Boolean(item.entry && !item.stale && retestPhases.includes(item.entry.phase) && item.entry.replays.length);
}

export function ql213ReviewForCompany(trial: Ql211Ledger, repair: Ql212Ledger, ledger: Ql213Ledger,
  organizationId: OrganizationId) {
  const queue = ql212QueueForCompany(trial, repair, organizationId);
  const items = queue.items.map((item) => {
    const draft = ledger[organizationId]?.[item.finding.id] ?? null;
    const stale = Boolean(draft && (!item.entry || item.stale || draft.sourceToken !== sourceToken(item.entry)));
    const comparison: Ql213Comparison = !draft?.after ? 'AFTER_RUN_MISSING' :
      draft.before.disposition === 'MANUAL_REPLAY_REQUIRED' || draft.after.disposition === 'MANUAL_REPLAY_REQUIRED' ?
        'MANUAL_ONLY' : draft.before.disposition === draft.after.disposition ? 'UNCHANGED_SYNTHETIC' : 'CHANGED_SYNTHETIC';
    const drafted = QL213_REVIEW_CHECKS.filter((check) => draft?.checks[check.id]?.state === 'drafted_unverified').length;
    const followup = QL213_REVIEW_CHECKS.filter((check) => draft?.checks[check.id]?.state === 'followup_needed').length;
    const readiness: Ql213Readiness = !draft ? 'NOT_PREPARED' : stale ? 'STALE_REPAIR_SOURCE' :
      !draft.after ? 'AFTER_REPLAY_REQUIRED' : item.entry?.phase !== 'retest_pass_noted' ? 'RETEST_UNRESOLVED' :
      followup ? 'FOLLOWUP_REQUIRED' : drafted !== QL213_REVIEW_CHECKS.length ? 'CHECKLIST_INCOMPLETE' :
      'PREPARED_FOR_REVIEW_UNVERIFIED';
    return { finding: item.finding, repair: item.entry, repairStale: item.stale, draft, stale,
      eligible: eligible(item), comparison, drafted, followup, readiness,
      independentApproval: false as const, actualRepairVerified: false as const, pilotReady: false as const };
  });
  // Drafts whose QL-211 source was withdrawn remain visible as stale counts; they never silently close.
  const orphanedDrafts = Object.keys(ledger[organizationId] ?? {}).filter((id) =>
    !items.some((item) => item.finding.id === id)).length;
  return { organizationId, items, findings: items.length,
    drafted: items.filter((item) => item.draft && !item.stale).length,
    stale: items.filter((item) => item.stale).length + orphanedDrafts,
    orphanedDrafts, pending: items.filter((item) => item.draft && !item.stale && item.readiness !== 'PREPARED_FOR_REVIEW_UNVERIFIED').length,
    preparedUnverified: items.filter((item) => item.readiness === 'PREPARED_FOR_REVIEW_UNVERIFIED').length,
    independentApproval: false as const, pilotReady: false as const };
}

function withDraft(ledger: Ql213Ledger, company: OrganizationId, id: Ql211ScenarioId, draft: Ql213Draft): Ql213Ledger {
  return { ...ledger, [company]: { ...ledger[company], [id]: draft } };
}

/** Creates a local comparison baseline only AFTER an operator has noted a manual QL-212 retest. */
export function startQl213Comparison(trial: Ql211Ledger, repair: Ql212Ledger, ledger: Ql213Ledger,
  company: OrganizationId, id: Ql211ScenarioId): Ql213Ledger {
  const item = ql212QueueForCompany(trial, repair, company).items.find((candidate) => candidate.finding.id === id);
  if (!item || !eligible(item)) return ledger;
  const token = sourceToken(item.entry);
  if (ledger[company]?.[id]?.sourceToken === token) return ledger;
  // A caller must explicitly confirm replacing stale drafts in the interface.
  return withDraft(ledger, company, id, { sourceToken: token,
    before: item.entry.replays[item.entry.replays.length - 1], after: null, checks: {} });
}

/** Only a NEW QL-212 mock replay after the baseline can be captured as the after snapshot. */
export function captureQl213After(trial: Ql211Ledger, repair: Ql212Ledger, ledger: Ql213Ledger,
  company: OrganizationId, id: Ql211ScenarioId): Ql213Ledger {
  const item = ql212QueueForCompany(trial, repair, company).items.find((candidate) => candidate.finding.id === id);
  const draft = ledger[company]?.[id];
  if (!item || !eligible(item) || !draft || draft.sourceToken !== sourceToken(item.entry)) return ledger;
  const latest = item.entry.replays[item.entry.replays.length - 1];
  if (latest.sequence <= draft.before.sequence || (draft.after && latest.sequence <= draft.after.sequence)) return ledger;
  return withDraft(ledger, company, id, { ...draft, after: latest });
}

export function setQl213Check(trial: Ql211Ledger, repair: Ql212Ledger, ledger: Ql213Ledger,
  company: OrganizationId, id: Ql211ScenarioId, checkId: Ql213CheckId,
  state: Ql213CheckState, note: string): Ql213Ledger {
  if (!QL213_REVIEW_CHECKS.some((check) => check.id === checkId) ||
      !['not_prepared', 'drafted_unverified', 'followup_needed'].includes(state)) return ledger;
  const item = ql212QueueForCompany(trial, repair, company).items.find((candidate) => candidate.finding.id === id);
  const draft = ledger[company]?.[id];
  if (!item || !eligible(item) || !draft || draft.sourceToken !== sourceToken(item.entry)) return ledger;
  const safeNote = note.slice(0, 160);
  // Prevent a blank assertion from being represented as prepared review evidence.
  if (state !== 'not_prepared' && safeNote.trim().length < 8) return ledger;
  return withDraft(ledger, company, id, { ...draft,
    checks: { ...draft.checks, [checkId]: { state, note: state === 'not_prepared' ? '' : safeNote } } });
}

export function ql213Portfolio(trial: Ql211Ledger, repair: Ql212Ledger, ledger: Ql213Ledger) {
  const companies = operatorOrganizations.map((organization) => ql213ReviewForCompany(trial, repair, ledger, organization.id));
  return { release: QL213_RELEASE, companies,
    findings: companies.reduce((sum, company) => sum + company.findings, 0),
    drafted: companies.reduce((sum, company) => sum + company.drafted, 0),
    stale: companies.reduce((sum, company) => sum + company.stale, 0),
    preparedUnverified: companies.reduce((sum, company) => sum + company.preparedUnverified, 0),
    heldPrerequisites: QL181_PREREQUISITES,
    ownerApproved: false as const, independentApproval: false as const, pilotReady: false as const,
    providerConnected: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Fixed codes only: no free-text notes, source hashes, identifiers or actual customer information. */
export function ql213CompanyReceipt(trial: Ql211Ledger, repair: Ql212Ledger, ledger: Ql213Ledger,
  company: OrganizationId): string {
  const view = ql213ReviewForCompany(trial, repair, ledger, company);
  return JSON.stringify({ release: QL213_RELEASE, company,
    scope: 'Browser-session fictional comparison and review preparation; no independent verification',
    findings: view.findings, drafts: view.drafted, stale: view.stale, orphaned: view.orphanedDrafts,
    cases: view.items.map(({ finding, draft, comparison, readiness, stale }) => ({
      scenario: finding.id, priority: finding.priority, comparison,
      before: draft?.before.disposition ?? null, after: draft?.after?.disposition ?? null,
      checklist: QL213_REVIEW_CHECKS.map(({ id }) => ({ id, state: draft?.checks[id]?.state ?? 'not_prepared' })),
      stale, readiness, independentlyApproved: false })),
    pilot: 'HELD', independentApproval: false, actualRepairVerified: false,
    heldPrerequisites: QL181_PREREQUISITES.length, noteTextIncluded: false,
    sourceFingerprintIncluded: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
