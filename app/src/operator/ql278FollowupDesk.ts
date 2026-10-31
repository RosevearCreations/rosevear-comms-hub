import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { type Ql276OwnerObservation } from './ql276EvidenceIntake';
import { QL277_OBSERVED_AT, QL277_PUBLIC_SOURCE_RECHECK, ql277CustodianQueue,
  type Ql277Comparison } from './ql277DriftReview';

/** Read-only GitHub main-ref and immutable original Proof-B path GETs at the time below.
 * These are historical public observations, not live feeds or signer verification. */
export const QL278_OBSERVED_AT = '2026-10-31T02:13:35Z';
export const QL278_PUBLIC_SOURCE_RECHECK = [
  { source: 'ai-data-platform', repo: 'ai-data-platform', sha: '73842314ae77af0826c6403d851dbdd58ae964fe', http: 404 },
  { source: 'devilndove', repo: 'devilndove-site', sha: '475409185181518f2cf7397562bf39f5043a7850', http: 404 },
  { source: 'rosiedazzlers', repo: 'rosiedazzlers', sha: 'e7e222f5324b931f5de97d0c279f77bc082a9576', http: 404 },
  { source: 'yw', repo: 'yw', sha: '736c79f0ef76375b4ceea2db5921cabfc0c90fe9', http: 404 },
  { source: 'icamp', repo: 'iCamp', sha: '883ee518e805253f45c316ce380ba13723182ff3', http: 404 },
  { source: 'rosevear-ai-hub', repo: 'rosevear-ai-hub', sha: '11861c13801b395d9be7f8a661fe7ebf8bc25fd5', http: 404 }
] as const satisfies ReadonlyArray<{ source: Ql270SourceId; repo: string; sha: string; http: number }>;

const DAY_MS = 86_400_000;
const hoursSince = (from: string, to: Date | string) => {
  const difference = new Date(to).getTime() - new Date(from).getTime();
  return Number.isFinite(difference) && difference >= 0 ? Math.floor(difference / 3_600_000) : null;
};

export function ql278PinnedProofUrl(source: Ql270SourceId) {
  const row = QL278_PUBLIC_SOURCE_RECHECK.find(item => item.source === source);
  if (!row) throw Error('UNKNOWN_QL278_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql278FollowupAging(asOf: Date | string) {
  const ageHours = hoursSince(QL278_OBSERVED_AT, asOf);
  const followedHours = hoursSince(QL277_OBSERVED_AT, asOf);
  const snapshot = ageHours === null ? 'CLOCK_REVIEW' as const : ageHours >= 24 ? 'PUBLIC_RECHECK_DUE' as const : 'PINNED_RECENT' as const;
  const aging = followedHours === null ? 'CLOCK_REVIEW' as const : followedHours >= 48 ? 'ESCALATION_REVIEW_DUE' as const :
    followedHours >= 24 ? 'FOLLOW_UP_DUE' as const : 'WITHIN_24H' as const;
  const rows = QL278_PUBLIC_SOURCE_RECHECK.map(item => {
    const old = QL277_PUBLIC_SOURCE_RECHECK.find(entry => entry.source === item.source);
    return { ...item, previousSha: old?.sha ?? null, changed: old?.sha !== item.sha,
      finding: old?.sha !== item.sha ? 'NEW_SHA_PROOF_STILL_MISSING' as const : 'SAME_SHA_PROOF_STILL_MISSING' as const,
      followUp: aging, dispatch: 'DRAFT_NOT_SENT' as const };
  });
  return { rows, ageHours, followedHours, snapshot, aging,
    nextPublicCheckDueAt: new Date(new Date(QL278_OBSERVED_AT).getTime() + DAY_MS).toISOString(),
    changed: rows.filter(row => row.changed).length, unchanged: rows.filter(row => !row.changed).length,
    missing: rows.filter(row => row.http === 404).length, total: QL270_SOURCES.length,
    notificationsSent: 0, originalReceiptsVerified: 0, ownerApprovals: 0,
    release: 'DISCONNECTED / HOLD' as const };
}

export type Ql278RetestPriority = 'HIGH_REGRESSION' | 'UNRESOLVED_ISSUE' | 'ENVIRONMENT_RECHECK' | 'TIME_ORDER_REVIEW';
export type Ql278RetestTicket = {
  checkId: Ql276OwnerObservation['checkId']; comparison: Ql277Comparison;
  priority: Ql278RetestPriority; retest: Ql276OwnerObservation | null;
  disposition: 'INDEPENDENT_REVIEW_REQUIRED'; accepted: false;
};

export function ql278CreateRetestTicket(comparison: Ql277Comparison):
  { ok: true; ticket: Ql278RetestTicket } | { ok: false; reason: string } {
  if (comparison.status !== 'OWNER_REPORTED_UNVERIFIED' || comparison.baseline.checkId !== comparison.recheck.checkId)
    return { ok: false, reason: 'Only a same-check, unverified local comparison can enter the retest queue.' };
  const priorities: Partial<Record<Ql277Comparison['finding'], Ql278RetestPriority>> = {
    REGRESSION_OWNER_REPORTED: 'HIGH_REGRESSION', UNRESOLVED_OWNER_REPORTED: 'UNRESOLVED_ISSUE',
    ENVIRONMENT_MISMATCH: 'ENVIRONMENT_RECHECK', TIME_ORDER_REVIEW: 'TIME_ORDER_REVIEW'
  };
  const priority = priorities[comparison.finding];
  if (!priority) return { ok: false, reason: 'Reported improvement or unchanged behavior needs independent owner/reviewer review, not automatic retest closure.' };
  return { ok: true, ticket: { checkId: comparison.baseline.checkId, comparison, priority,
    retest: null, disposition: 'INDEPENDENT_REVIEW_REQUIRED', accepted: false } };
}

export function ql278RecordRetest(ticket: Ql278RetestTicket, retest: Ql276OwnerObservation):
  { ok: true; ticket: Ql278RetestTicket; finding: 'ISSUE_REPORTED_AGAIN' | 'NO_ISSUE_REPORTED_REVIEW_REQUIRED' } |
  { ok: false; reason: 'DIFFERENT_CHECK' | 'TIME_ORDER_REVIEW' | 'ENVIRONMENT_MISMATCH' | 'INVALID_OBSERVATION' } {
  if (retest.status !== 'OWNER_REPORTED_UNVERIFIED') return { ok: false, reason: 'INVALID_OBSERVATION' };
  if (retest.checkId !== ticket.checkId) return { ok: false, reason: 'DIFFERENT_CHECK' };
  if (!(new Date(retest.recordedAt).getTime() > Math.max(new Date(ticket.comparison.recheck.recordedAt).getTime(),
    new Date(ticket.comparison.baseline.recordedAt).getTime())))
    return { ok: false, reason: 'TIME_ORDER_REVIEW' };
  const reference = ticket.comparison.recheck;
  if (retest.device !== reference.device || retest.assistiveMethod !== reference.assistiveMethod ||
    ticket.comparison.finding === 'ENVIRONMENT_MISMATCH' &&
    (retest.device !== ticket.comparison.baseline.device || retest.assistiveMethod !== ticket.comparison.baseline.assistiveMethod))
    return { ok: false, reason: 'ENVIRONMENT_MISMATCH' };
  return { ok: true, ticket: { ...ticket, retest, accepted: false, disposition: 'INDEPENDENT_REVIEW_REQUIRED' },
    finding: retest.outcome === 'issue' ? 'ISSUE_REPORTED_AGAIN' : 'NO_ISSUE_REPORTED_REVIEW_REQUIRED' };
}

export const QL278_CUSTODY_PRECONDITIONS = [
  { key: 'original', label: 'Original source-published signed Proof-B, raw HTTP 200 and SHA-256', status: 'PUBLIC_PROOF_404' },
  { key: 'ancestry', label: 'Audited GREEN A → signed B immutable ancestry verified', status: 'NOT_VERIFIED' },
  { key: 'signer', label: 'Ed25519 signature verified using independently trusted signer SPKI pin', status: 'NOT_VERIFIED' },
  { key: 'custodian', label: 'Original independently issued custodian receipt validated', status: 'NOT_VERIFIED' },
  { key: 'witness', label: 'Separate original witness receipt and disposition validated', status: 'NOT_VERIFIED' },
  { key: 'tenant', label: 'Named isolated TEST-only tenant independently verified', status: 'NOT_VERIFIED' },
  { key: 'owner', label: 'Separate authenticated owner approval for ≤30-minute UTC GET-only window', status: 'NOT_GIVEN' }
] as const;

export type Ql278CustodyPacket = { source: Ql270SourceId; sha: string; reference: string | null;
  preparedAt: string; checks: typeof QL278_CUSTODY_PRECONDITIONS; verified: 0;
  state: 'DRAFT_NOT_SENT'; acceptance: 'BLOCKED_ORIGINAL_EVIDENCE_MISSING' };

export function ql278PrepareCustodyPacket(source: Ql270SourceId, reference: string, now: Date):
  { ok: true; packet: Ql278CustodyPacket } | { ok: false; reason: string } {
  const original = ql277CustodianQueue(source, reference, now);
  if (!original.ok) return { ok: false, reason: original.reason };
  const row = QL278_PUBLIC_SOURCE_RECHECK.find(item => item.source === source);
  if (!row) return { ok: false, reason: 'Unregistered source.' };
  return { ok: true, packet: { source, sha: row.sha, reference: original.item.claimedReference,
    preparedAt: now.toISOString(), checks: QL278_CUSTODY_PRECONDITIONS, verified: 0,
    state: 'DRAFT_NOT_SENT', acceptance: 'BLOCKED_ORIGINAL_EVIDENCE_MISSING' } };
}

export type Ql278FollowupDraft = { source: Ql270SourceId; preparedAt: string;
  previousSha: string; currentSha: string; finding: 'NEW_SHA_PROOF_STILL_MISSING' | 'SAME_SHA_PROOF_STILL_MISSING';
  followUp: ReturnType<typeof ql278FollowupAging>['aging']; state: 'DRAFT_NOT_SENT' };

export function ql278PrepareFollowup(source: Ql270SourceId, now: Date): Ql278FollowupDraft {
  if (!Number.isFinite(now.getTime())) throw Error('INVALID_FOLLOWUP_TIME');
  const row = ql278FollowupAging(now).rows.find(item => item.source === source);
  if (!row || !row.previousSha) throw Error('UNKNOWN_FOLLOWUP_SOURCE');
  return { source, preparedAt: now.toISOString(), previousSha: row.previousSha,
    currentSha: row.sha, finding: row.finding, followUp: row.followUp, state: 'DRAFT_NOT_SENT' };
}

export function ql278ReviewPacket(tickets: readonly Ql278RetestTicket[], custody: readonly Ql278CustodyPacket[],
  followUps: readonly Ql278FollowupDraft[], asOf: Date | string) {
  const report = ql278FollowupAging(asOf);
  return [
    'QL-278 | LOCAL RETEST / ORIGINAL CUSTODY PRECONDITIONS / SIX-APP FOLLOW-UP | HELD',
    `Public recheck ${QL278_OBSERVED_AT} | ${report.snapshot} / ${report.aging} | ${report.changed} changed / ${report.unchanged} unchanged | ${report.missing}/6 proof HTTP 404`,
    `Follow-up tracked from QL-277 ${QL277_OBSERVED_AT}; next public check due ${report.nextPublicCheckDueAt}. No automatic recheck or notification.`,
    ...report.rows.map(row => `${row.repo}: ${row.previousSha} -> ${row.sha} / HTTP ${row.http} / ${row.finding}`),
    ...tickets.map(ticket => `Owner ${ticket.checkId}: ${ticket.priority} / retest ${ticket.retest?.outcome ?? 'NOT RECORDED'} / UNVERIFIED / INDEPENDENT_REVIEW_REQUIRED`),
    ...custody.map(item => `Custody ${item.source}: ${item.sha} / claimed reference ${item.reference ?? 'NONE'} / ${item.verified}/${item.checks.length} verified / ${item.acceptance} / ${item.state}`),
    ...followUps.map(item => `Drift follow-up ${item.source}: ${item.finding} / ${item.followUp} / ${item.preparedAt} / DRAFT_NOT_SENT`),
    'Original Proof-B verified: 0/6 | Custodian and witness originals verified: 0/6 | Owner accessibility acceptance: NOT RECORDED',
    'TEST-only owner authorization: NOT GIVEN | Gateway GET: NOT RUN | Notifications sent: 0 | DISCONNECTED / HOLD',
    'Copy-only draft; neither a signature/receipt nor owner authority is authenticated by this screen.'
  ].join('\n');
}
