import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL276_PUBLIC_SOURCE_RECHECK, ql276PrepareCustodianRoute,
  type Ql276OwnerObservation } from './ql276EvidenceIntake';

/** Genuine read-only public GitHub GET observations at current source main SHAs.
 * No browser, gateway, tenant, signer, owner or secret endpoint was contacted. */
export const QL277_OBSERVED_AT = '2026-10-31T01:50:32Z';
export const QL277_PUBLIC_SOURCE_RECHECK = [
  { source: 'ai-data-platform', repo: 'ai-data-platform', sha: '73842314ae77af0826c6403d851dbdd58ae964fe', http: 404 },
  { source: 'devilndove', repo: 'devilndove-site', sha: '5d4050864170d0563ca85540cefe3c713223ae00', http: 404 },
  { source: 'rosiedazzlers', repo: 'rosiedazzlers', sha: '1acc859fde21d600d28d9379d675de0d3f5e990f', http: 404 },
  { source: 'yw', repo: 'yw', sha: '736c79f0ef76375b4ceea2db5921cabfc0c90fe9', http: 404 },
  { source: 'icamp', repo: 'iCamp', sha: '883ee518e805253f45c316ce380ba13723182ff3', http: 404 },
  { source: 'rosevear-ai-hub', repo: 'rosevear-ai-hub', sha: '1ffb37c4eb750b4c8969b44f76692c74845179bb', http: 404 }
] as const satisfies ReadonlyArray<{ source: Ql270SourceId; repo: string; sha: string; http: number }>;

export function ql277PinnedProofUrl(source: Ql270SourceId) {
  const row = QL277_PUBLIC_SOURCE_RECHECK.find(item => item.source === source);
  if (!row) throw Error('UNKNOWN_QL277_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql277SourceDrift(asOf: Date | string) {
  const elapsed = new Date(asOf).getTime() - new Date(QL277_OBSERVED_AT).getTime();
  const age = !Number.isFinite(elapsed) || elapsed < 0 ? 'CLOCK_SKEW' : elapsed >= 86_400_000 ? 'RECHECK_DUE' : 'RECENT_SNAPSHOT';
  const rows = QL277_PUBLIC_SOURCE_RECHECK.map(item => {
    const previous = QL276_PUBLIC_SOURCE_RECHECK.find(old => old.source === item.source);
    return { ...item, previousSha: previous?.sha ?? null, changed: String(item.sha) !== String(previous?.sha ?? ''),
      queue: item.http === 404 ? 'PROOF_MISSING_AT_NEW_SHA' as const : 'FILE_EXISTENCE_ONLY' as const,
      notification: 'NOT_SENT' as const };
  });
  return { rows, age, elapsedHours: elapsed >= 0 && Number.isFinite(elapsed) ? Math.floor(elapsed / 3_600_000) : 0,
    changed: rows.filter(row => row.changed).length, missing: rows.filter(row => row.http === 404).length,
    total: QL270_SOURCES.length, noticesSent: 0, acceptedSignatures: 0,
    release: 'DISCONNECTED / HOLD' as const };
}

export type Ql277Comparison = {
  baseline: Ql276OwnerObservation;
  recheck: Ql276OwnerObservation;
  finding: 'IMPROVED_OWNER_REPORTED' | 'REGRESSION_OWNER_REPORTED' | 'UNRESOLVED_OWNER_REPORTED' |
    'UNCHANGED_OWNER_REPORTED' | 'ENVIRONMENT_MISMATCH' | 'TIME_ORDER_REVIEW';
  status: 'OWNER_REPORTED_UNVERIFIED';
};

export function ql277CompareAccessibility(baseline: Ql276OwnerObservation, recheck: Ql276OwnerObservation): Ql277Comparison {
  if (baseline.checkId !== recheck.checkId) throw Error('DIFFERENT_ACCESSIBILITY_CHECK');
  const sameEnvironment = baseline.device === recheck.device && baseline.assistiveMethod === recheck.assistiveMethod;
  const chronological = new Date(recheck.recordedAt).getTime() > new Date(baseline.recordedAt).getTime();
  const finding = !chronological ? 'TIME_ORDER_REVIEW' : !sameEnvironment ? 'ENVIRONMENT_MISMATCH' :
    baseline.outcome === 'issue' && recheck.outcome === 'observed' ? 'IMPROVED_OWNER_REPORTED' :
    baseline.outcome === 'observed' && recheck.outcome === 'issue' ? 'REGRESSION_OWNER_REPORTED' :
    baseline.outcome === 'issue' && recheck.outcome === 'issue' ? 'UNRESOLVED_OWNER_REPORTED' : 'UNCHANGED_OWNER_REPORTED';
  return { baseline, recheck, finding, status: 'OWNER_REPORTED_UNVERIFIED' };
}

export type Ql277CustodianQueueItem = { source: Ql270SourceId; claimedReference: string | null;
  preparedAt: string; format: 'NO_REFERENCE' | 'FORMAT_VALID_ONLY';
  disposition: 'SOURCE_PROOF_404_CUSTODY_UNVERIFIED'; routed: 'DRAFT_NOT_SENT' };

export function ql277CustodianQueue(source: Ql270SourceId, claimedReference: string, now: Date):
  { ok: true; item: Ql277CustodianQueueItem } | { ok: false; reason: string } {
  const draft = ql276PrepareCustodianRoute(source, claimedReference, now);
  if (!draft.ok) return { ok: false, reason: draft.reason };
  return { ok: true, item: {
    source, claimedReference: draft.record.externalReferenceClaim, preparedAt: draft.record.preparedAt,
    format: draft.record.externalReferenceClaim ? 'FORMAT_VALID_ONLY' : 'NO_REFERENCE',
    disposition: 'SOURCE_PROOF_404_CUSTODY_UNVERIFIED', routed: 'DRAFT_NOT_SENT'
  } };
}

export type Ql277NotificationDraft = { source: Ql270SourceId; preparedAt: string;
  state: 'DRAFT_NOT_SENT'; previousSha: string; currentSha: string };

export function ql277PrepareNotification(source: Ql270SourceId, now: Date): Ql277NotificationDraft {
  const row = ql277SourceDrift(now).rows.find(item => item.source === source);
  if (!row || !row.previousSha) throw Error('UNKNOWN_DRIFT_SOURCE');
  if (!Number.isFinite(now.getTime())) throw Error('INVALID_PREPARED_AT');
  return { source, preparedAt: now.toISOString(), state: 'DRAFT_NOT_SENT', previousSha: row.previousSha, currentSha: row.sha };
}

export function ql277ReviewPacket(comparisons: readonly Ql277Comparison[], queue: readonly Ql277CustodianQueueItem[],
  notifications: readonly Ql277NotificationDraft[], asOf: Date | string): string {
  const report = ql277SourceDrift(asOf);
  return [
    'QL-277 | UNVERIFIED LOCAL REVIEW & SOURCE-DRIFT NOTIFICATION DRAFT',
    `Public recheck: ${QL277_OBSERVED_AT} | ${report.age} | ${report.changed}/${report.total} new main SHAs | ${report.missing}/6 HTTP 404`,
    ...report.rows.map(row => `${row.repo}: ${row.previousSha} -> ${row.sha} / HTTP ${row.http} / ${row.queue}`),
    'Actual notification dispatch: NONE | Original signed Proof-B accepted: 0/6',
    ...comparisons.map(item => `Owner comparison ${item.baseline.checkId}: ${item.finding} / ${item.baseline.recordedAt} -> ${item.recheck.recordedAt} / UNVERIFIED`),
    ...queue.map(item => `Custodian queue ${item.source}: reference ${item.claimedReference ?? 'NOT PROVIDED'} / ${item.format} / ${item.disposition} / ${item.routed}`),
    ...notifications.map(item => `Notice draft ${item.source}: ${item.previousSha} -> ${item.currentSha} / ${item.preparedAt} / DRAFT_NOT_SENT`),
    'Owner accessibility sign-off: NOT RECORDED | Independent custodian/witness: NOT VERIFIED',
    'Owner TEST authorization: NOT GIVEN | Gateway GET: NOT RUN | DISCONNECTED / HOLD',
    'Copy-only local draft. Nothing has been delivered, authenticated, cryptographically verified or approved.'
  ].join('\n');
}
