import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import { evaluateQl210Company } from './ql210ApplicationAcceptance';
import { evaluateQl211Company, observationFor, type Ql211Finding, type Ql211Ledger,
  type Ql211ScenarioId } from './ql211OwnerTrial';

export const QL212_RELEASE = 'ql212-four-company-trial-replay-repair-evidence-disabled-preview-v1';
export type Ql212Phase = 'queued' | 'repair_draft' | 'retest_requested' | 'retest_pass_noted' | 'retest_fail_noted' | 'retest_blocked';
export type Ql212ReplayDisposition = 'SYNTHETIC_CONTRACT_PASS' | 'SYNTHETIC_CONTRACT_FAIL' | 'MANUAL_REPLAY_REQUIRED';
export type Ql212ReplayRun = Readonly<{ sequence: number; contractCheck: string | null; disposition: Ql212ReplayDisposition }>;
export type Ql212Entry = Readonly<{
  sourceFingerprint: string;
  phase: Ql212Phase;
  repairNote: string;
  replays: readonly Ql212ReplayRun[];
}>;
export type Ql212Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql212Entry>>>>;
export type Ql212QueueItem = Readonly<{
  finding: Ql211Finding;
  entry: Ql212Entry | null;
  stale: boolean;
  suggestedTest: string;
  automatedCoverage: boolean;
}>;

const contractForTrial: Readonly<Partial<Record<Ql211ScenarioId, string>>> = {
  inbox: 'inbox', contact: 'contacts', followup: 'tasks', phone: 'phone',
  consent: 'composer', handoff: 'connectors', isolation: 'roles', reports: 'analytics'
};

// Non-cryptographic local change token; no source observation note is copied to receipts.
function fingerprint(source: string): string {
  let hash = 2166136261;
  for (const character of source) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fixture-v1-${(hash >>> 0).toString(16)}`;
}

function activeSource(trial: Ql211Ledger, organizationId: OrganizationId, id: Ql211ScenarioId) {
  const finding = evaluateQl211Company(trial, organizationId).findings.find((candidate) => candidate.id === id);
  if (!finding) return null;
  const record = observationFor(trial, organizationId, id);
  return { finding, signature: fingerprint(JSON.stringify([organizationId, id, record.outcome,
    record.severity, record.area, record.note])) };
}

export function ql212QueueForCompany(trial: Ql211Ledger, ledger: Ql212Ledger, organizationId: OrganizationId) {
  const findings = evaluateQl211Company(trial, organizationId).findings;
  const items: Ql212QueueItem[] = findings.map((finding) => {
    const source = activeSource(trial, organizationId, finding.id)!;
    const entry = ledger[organizationId]?.[finding.id] ?? null;
    const contractCheck = contractForTrial[finding.id];
    return { finding, entry, stale: Boolean(entry && entry.sourceFingerprint !== source.signature),
      suggestedTest: contractCheck ? `QL-210 ${contractCheck} fictional contract baseline` :
        'Owner-led keyboard/device observation only — no automatic reproduction',
      automatedCoverage: Boolean(contractCheck) };
  });
  const queued = items.filter((item) => item.entry && !item.stale);
  return { organizationId, items, observedFindings: items.length, queued: queued.length,
    unqueued: items.filter((item) => !item.entry).length, stale: items.filter((item) => item.stale).length,
    awaitingRetest: queued.filter((item) => item.entry?.phase === 'retest_requested').length,
    retestNoted: queued.filter((item) => item.entry?.phase === 'retest_pass_noted' ||
      item.entry?.phase === 'retest_fail_noted' || item.entry?.phase === 'retest_blocked').length,
    pilotReady: false as const, independentlyClosed: false as const };
}

function withEntry(ledger: Ql212Ledger, organizationId: OrganizationId, id: Ql211ScenarioId, entry: Ql212Entry): Ql212Ledger {
  return { ...ledger, [organizationId]: { ...ledger[organizationId], [id]: entry } };
}

export function queueQl212Finding(trial: Ql211Ledger, ledger: Ql212Ledger, organizationId: OrganizationId,
  id: Ql211ScenarioId): Ql212Ledger {
  const source = activeSource(trial, organizationId, id);
  if (!source) return ledger;
  const existing = ledger[organizationId]?.[id];
  if (existing?.sourceFingerprint === source.signature) return ledger;
  return withEntry(ledger, organizationId, id, { sourceFingerprint: source.signature,
    phase: 'queued', repairNote: '', replays: [] });
}

/** A replay invokes the same pure QL-210 mock checker, never real provider APIs or owner actions. */
export function replayQl212Finding(trial: Ql211Ledger, ledger: Ql212Ledger, organizationId: OrganizationId,
  id: Ql211ScenarioId): Ql212Ledger {
  const source = activeSource(trial, organizationId, id);
  const entry = ledger[organizationId]?.[id];
  if (!source || !entry || entry.sourceFingerprint !== source.signature) return ledger;
  const checkId = contractForTrial[id] ?? null;
  const contract = checkId ? evaluateQl210Company(organizationId).checks.find((check) => check.id === checkId) : null;
  const disposition: Ql212ReplayDisposition = !checkId ? 'MANUAL_REPLAY_REQUIRED' :
    contract?.state === 'PASS_SYNTHETIC' ? 'SYNTHETIC_CONTRACT_PASS' : 'SYNTHETIC_CONTRACT_FAIL';
  const nextRun = { sequence: entry.replays.length ? entry.replays[entry.replays.length - 1].sequence + 1 : 1,
    contractCheck: checkId, disposition };
  return withEntry(ledger, organizationId, id, { ...entry, replays: [...entry.replays.slice(-9), nextRun] });
}

export function writeQl212RepairNote(trial: Ql211Ledger, ledger: Ql212Ledger, organizationId: OrganizationId,
  id: Ql211ScenarioId, note: string): Ql212Ledger {
  const source = activeSource(trial, organizationId, id);
  const entry = ledger[organizationId]?.[id];
  if (!source || !entry || entry.sourceFingerprint !== source.signature) return ledger;
  if (entry.phase !== 'queued' && entry.phase !== 'repair_draft') return ledger;
  return withEntry(ledger, organizationId, id, { ...entry, repairNote: note.slice(0, 240), phase: 'repair_draft' });
}

export function requestQl212Retest(trial: Ql211Ledger, ledger: Ql212Ledger, organizationId: OrganizationId,
  id: Ql211ScenarioId): Ql212Ledger {
  const source = activeSource(trial, organizationId, id);
  const entry = ledger[organizationId]?.[id];
  if (!source || !entry || entry.sourceFingerprint !== source.signature || entry.phase !== 'repair_draft'
    || entry.repairNote.trim().length < 8 || entry.replays.length === 0) return ledger;
  return withEntry(ledger, organizationId, id, { ...entry, phase: 'retest_requested' });
}

export function recordQl212Retest(trial: Ql211Ledger, ledger: Ql212Ledger, organizationId: OrganizationId,
  id: Ql211ScenarioId, outcome: 'retest_pass_noted' | 'retest_fail_noted' | 'retest_blocked'): Ql212Ledger {
  const source = activeSource(trial, organizationId, id);
  const entry = ledger[organizationId]?.[id];
  if (!source || !entry || entry.sourceFingerprint !== source.signature || entry.phase !== 'retest_requested') return ledger;
  return withEntry(ledger, organizationId, id, { ...entry, phase: outcome });
}

export function ql212Portfolio(trial: Ql211Ledger, ledger: Ql212Ledger) {
  const companies = operatorOrganizations.map((entry) => ql212QueueForCompany(trial, ledger, entry.id));
  return { release: QL212_RELEASE, companies,
    reportedFindings: companies.reduce((sum, entry) => sum + entry.observedFindings, 0),
    queued: companies.reduce((sum, entry) => sum + entry.queued, 0),
    stale: companies.reduce((sum, entry) => sum + entry.stale, 0),
    heldPrerequisites: QL181_PREREQUISITES,
    ownerApprovalCaptured: false as const, pilotReady: false as const, providerConnected: false as const,
    externallyClosed: false as const, externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Portable state-only, fixed-schema preview receipt. Never includes source/repair free text or signatures. */
export function ql212CompanyReceipt(trial: Ql211Ledger, ledger: Ql212Ledger, organizationId: OrganizationId): string {
  const company = ql212QueueForCompany(trial, ledger, organizationId);
  return JSON.stringify({ release: QL212_RELEASE, company: organizationId,
    scope: 'Fictional replay/repair/retest drafts, not independently verified closure',
    observedFindings: company.observedFindings, queued: company.queued, stale: company.stale,
    items: company.items.map(({ finding, entry, stale }) => ({ id: finding.id, priority: finding.priority,
      stale, phase: entry?.phase ?? 'not_queued', replayDispositions: entry?.replays.map((run) => run.disposition) ?? [] })),
    pilot: 'HELD', independentClosure: false, providerConnected: false,
    freeTextIncluded: false, externalWrites: 0 }, null, 2);
}
