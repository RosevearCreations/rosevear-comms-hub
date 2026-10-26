import { operatorOrganizations, type OrganizationId } from './ql191Organizations';
import { QL181_PREREQUISITES } from './ql181PrivacyPilotGate';
import type { Ql211Ledger, Ql211ScenarioId } from './ql211OwnerTrial';
import type { Ql212Ledger } from './ql212RepairQueue';
import type { Ql213Ledger } from './ql213ReviewPreparation';
import type { Ql214Ledger } from './ql214ReviewIntake';
import { ql215CompanyAudit, type Ql215Ledger } from './ql215FollowUpAudit';

export const QL216_RELEASE = 'ql216-four-company-escalation-review-replay-owner-safe-handoff-audit-disabled-preview-v1';
export type Ql216Disposition = 'NOT_SELECTED' | 'SOURCE_RECHECK_DRAFT' | 'OWNER_ESCALATION_DRAFT' | 'INDEPENDENT_REVIEW_PACKET_DRAFT';
export type Ql216Packet = Readonly<{
  auditToken: string;
  phase: 'review_draft' | 'local_handoff_prepared';
  disposition: Ql216Disposition;
  note: string;
}>;
export type Ql216Ledger = Partial<Record<OrganizationId, Partial<Record<Ql211ScenarioId, Ql216Packet>>>>;
export type Ql216SourceStatus = 'NO_PACKET' | 'SOURCE_CURRENT' | 'AUDIT_REVISED' | 'UPSTREAM_STALE';

function fingerprint(data: unknown): string {
  // Local change detector only. Never interpret this as a signed review or secure digest.
  let hash = 2166136261;
  for (const char of JSON.stringify(data)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return `fictional-review-${(hash >>> 0).toString(16)}`;
}

type CompanyCase = ReturnType<typeof ql215CompanyAudit>['cases'][number];
function tokenFor(item: CompanyCase) {
  return fingerprint({ source: item.record?.sourceToken, cycle: item.cycle,
    gaps: item.gaps.map(({ category, priority, followUp, action, lastReviewCycle, ageBand }) =>
      ({ category, priority, followUp, action, lastReviewCycle, ageBand })) });
}
function hasEscalation(item: CompanyCase) {
  return item.gaps.some(({ action, ageBand }) => action === 'ESCALATION_DRAFTED' || ageBand === 'ESCALATION_REVIEW_DUE');
}

export function ql216CompanyReplay(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, packets: Ql216Ledger, company: OrganizationId) {
  const upstream = ql215CompanyAudit(trial, repair, review, intake, audit, company);
  const cases = upstream.cases.map((item) => {
    const packet = packets[company]?.[item.scenario] ?? null;
    const eligible = item.sourceStatus === 'SOURCE_CURRENT' && Boolean(item.record) && hasEscalation(item);
    const sourceStatus: Ql216SourceStatus = !packet ? 'NO_PACKET' :
      item.sourceStatus !== 'SOURCE_CURRENT' || !item.record ? 'UPSTREAM_STALE' :
      packet.auditToken !== tokenFor(item) ? 'AUDIT_REVISED' : 'SOURCE_CURRENT';
    return { ...item, packet, eligible, upstreamSourceStatus: item.sourceStatus, sourceStatus, replayDue: item.gaps.filter((gap) =>
      gap.ageBand === 'ESCALATION_REVIEW_DUE').length,
    escalationDrafts: item.gaps.filter((gap) => gap.action === 'ESCALATION_DRAFTED').length,
    prepared: Boolean(packet?.phase === 'local_handoff_prepared' && sourceStatus === 'SOURCE_CURRENT'),
    releaseHold: 'HELD_UNVERIFIED' as const, independentlyApproved: false as const, transmitted: false as const };
  });
  const orphaned = Object.keys(packets[company] ?? {}).filter((id) => !cases.some((item) => item.scenario === id)).length;
  return { company, cases, orphaned,
    eligible: cases.filter((item) => item.eligible).length,
    prepared: cases.filter((item) => item.prepared).length,
    stale: cases.filter((item) => item.packet && item.sourceStatus !== 'SOURCE_CURRENT').length + orphaned,
    reviewDue: cases.reduce((sum, item) => sum + item.replayDue, 0),
    escalationDrafts: cases.reduce((sum, item) => sum + item.escalationDrafts, 0),
    held: QL181_PREREQUISITES.filter((item) => item.state === 'HELD_UNVERIFIED').length,
    holdsIntact: QL181_PREREQUISITES.length === 12 && QL181_PREREQUISITES.every((hold) => hold.state === 'HELD_UNVERIFIED'),
    actualOwnerApproved: false as const, independentReviewCompleted: false as const };
}

function withPacket(ledger: Ql216Ledger, company: OrganizationId, id: Ql211ScenarioId, packet: Ql216Packet): Ql216Ledger {
  return { ...ledger, [company]: { ...ledger[company], [id]: packet } };
}

/** Starts an explicit, local rehearsal on a current QL-215 escalation; never creates a real handoff. */
export function beginQl216Replay(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, packets: Ql216Ledger, company: OrganizationId, id: Ql211ScenarioId): Ql216Ledger {
  const item = ql215CompanyAudit(trial, repair, review, intake, audit, company).cases.find((entry) => entry.scenario === id);
  if (!item || item.sourceStatus !== 'SOURCE_CURRENT' || !item.record || !hasEscalation(item)) return packets;
  const token = tokenFor(item);
  if (packets[company]?.[id]?.auditToken === token) return packets;
  return withPacket(packets, company, id, { auditToken: token, phase: 'review_draft', disposition: 'NOT_SELECTED', note: '' });
}

/** Fictional owner-preparation note. No personnel, contacts or customer information should be entered. */
export function draftQl216Handoff(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, packets: Ql216Ledger, company: OrganizationId, id: Ql211ScenarioId,
  disposition: Ql216Disposition, note: string): Ql216Ledger {
  const item = ql216CompanyReplay(trial, repair, review, intake, audit, packets, company).cases.find((entry) => entry.scenario === id);
  if (!item?.packet || item.sourceStatus !== 'SOURCE_CURRENT' || item.packet.phase !== 'review_draft' ||
      !item.eligible || !['SOURCE_RECHECK_DRAFT', 'OWNER_ESCALATION_DRAFT', 'INDEPENDENT_REVIEW_PACKET_DRAFT'].includes(disposition) ||
      note.trim().length < 8) return packets;
  return withPacket(packets, company, id, { ...item.packet, disposition, note: note.trim().slice(0, 180) });
}

/** Prepares the session-only packet for a human to inspect; no dispatch, export or approval occurs. */
export function prepareQl216Handoff(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, packets: Ql216Ledger, company: OrganizationId, id: Ql211ScenarioId): Ql216Ledger {
  const item = ql216CompanyReplay(trial, repair, review, intake, audit, packets, company).cases.find((entry) => entry.scenario === id);
  if (!item?.packet || item.sourceStatus !== 'SOURCE_CURRENT' || !item.eligible ||
      item.packet.phase !== 'review_draft' || item.packet.disposition === 'NOT_SELECTED' || item.packet.note.length < 8) return packets;
  return withPacket(packets, company, id, { ...item.packet, phase: 'local_handoff_prepared' });
}

export function ql216Portfolio(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, packets: Ql216Ledger) {
  const companies = operatorOrganizations.map((company) => ql216CompanyReplay(trial, repair, review, intake, audit, packets, company.id));
  return { release: QL216_RELEASE, companies,
    eligible: companies.reduce((sum, row) => sum + row.eligible, 0),
    prepared: companies.reduce((sum, row) => sum + row.prepared, 0),
    stale: companies.reduce((sum, row) => sum + row.stale, 0),
    reviewDue: companies.reduce((sum, row) => sum + row.reviewDue, 0),
    allHoldsPreserved: companies.every((row) => row.holdsIntact), prerequisites: QL181_PREREQUISITES,
    livePilotReady: false as const, independentApproval: false as const, ownerApprovalCaptured: false as const,
    externalWrites: 0 as const, callsPlaced: 0 as const, messagesSent: 0 as const };
}

/** Fixed-schema, status-only receipt. Does not include private notes or source fingerprint. */
export function ql216CompanyReceipt(trial: Ql211Ledger, repair: Ql212Ledger, review: Ql213Ledger,
  intake: Ql214Ledger, audit: Ql215Ledger, packets: Ql216Ledger, company: OrganizationId) {
  const data = ql216CompanyReplay(trial, repair, review, intake, audit, packets, company);
  return JSON.stringify({ release: QL216_RELEASE, company,
    scope: 'Fictional local escalation replay and owner-safe packet status audit only',
    eligible: data.eligible, prepared: data.prepared, stale: data.stale, orphaned: data.orphaned,
    cases: data.cases.map((item) => ({ scenario: item.scenario, priority: item.priority,
      upstreamSourceStatus: item.upstreamSourceStatus,
      sourceStatus: item.sourceStatus, eligible: item.eligible, cycle: item.cycle,
      due: item.replayDue, draftedEscalations: item.escalationDrafts,
      packetPhase: item.sourceStatus === 'SOURCE_CURRENT' ? item.packet?.phase ?? 'not_started' : 'INVALIDATED_OR_ABSENT',
      draftDisposition: item.sourceStatus === 'SOURCE_CURRENT' ? item.packet?.disposition ?? 'NOT_SELECTED' : 'NOT_SELECTED',
      openGaps: item.gaps.map(({ category, priority, ageBand, action }) => ({ category, priority, ageBand, action,
        independentlyClosed: false })), releaseHold: 'HELD_UNVERIFIED', actuallyApproved: false,
      transmitted: false })),
    prerequisites: QL181_PREREQUISITES.map(({ id, state }) => ({ id, state })),
    conditionalRelease: 'BLOCKED', actualOwnerAuthorization: false, independentReviewCompleted: false,
    notesIncluded: false, sourceTokensIncluded: false, identitiesIncluded: false,
    externalWrites: 0, callsPlaced: 0, messagesSent: 0 }, null, 2);
}
