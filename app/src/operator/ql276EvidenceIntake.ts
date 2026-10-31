import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL274_PUBLIC_PROOF_RECHECK } from './ql274CommandAudit';
import { QL275_OWNER_CHECKS } from './ql275OperatorWalkthrough';

/** Public GitHub GETs at each repository's then-current main SHA, performed at
 * 2026-10-31T01:03:05Z. A pinned historical HTTP response is not a current
 * heartbeat, signature verification, private custody record or TEST approval. */
export const QL276_OBSERVED_AT = '2026-10-31T01:03:05Z';
export const QL276_PUBLIC_SOURCE_RECHECK = [
  { source: 'ai-data-platform', repo: 'ai-data-platform', sha: '79a90aa17c2f04b77b27bd3eca54dbdc50d87fe5', http: 404 },
  { source: 'devilndove', repo: 'devilndove-site', sha: 'b4b6fba16b370ceb2b2378965731fc7ea511fc9b', http: 404 },
  { source: 'rosiedazzlers', repo: 'rosiedazzlers', sha: 'd722720f5ec7d2c708c163a8b0d3305bf30e354a', http: 404 },
  { source: 'yw', repo: 'yw', sha: '29378a0c9050652f05882a280445750d4a881074', http: 404 },
  { source: 'icamp', repo: 'iCamp', sha: '219251ee433d745a236ac19c682a3a453db72463', http: 404 },
  { source: 'rosevear-ai-hub', repo: 'rosevear-ai-hub', sha: '3845613bb7b7af6bb4fa97fb10b72c2600ba0e84', http: 404 }
] as const satisfies ReadonlyArray<{ source: Ql270SourceId; repo: string; sha: string; http: number }>;

export function ql276PinnedProofUrl(source: Ql270SourceId): string {
  const row = QL276_PUBLIC_SOURCE_RECHECK.find(item => item.source === source);
  if (!row) throw Error('UNKNOWN_QL276_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=${row.sha}`;
}

export function ql276SourceSummary(asOf: Date | string) {
  const elapsedMs = new Date(asOf).getTime() - new Date(QL276_OBSERVED_AT).getTime();
  const age = !Number.isFinite(elapsedMs) || elapsedMs < 0 ? 'CLOCK_SKEW' : elapsedMs >= 24 * 60 * 60 * 1000 ? 'RECHECK_DUE' : 'RECENT_SNAPSHOT';
  const changed = QL276_PUBLIC_SOURCE_RECHECK.filter(row => QL274_PUBLIC_PROOF_RECHECK.find(old => old.source === row.source)?.sha !== row.sha);
  return { age, elapsedHours: Number.isFinite(elapsedMs) && elapsedMs > 0 ? Math.floor(elapsedMs / 3_600_000) : 0,
    missing: QL276_PUBLIC_SOURCE_RECHECK.filter(row => row.http === 404).length,
    total: QL270_SOURCES.length, changedSources: changed.map(row => row.source),
    acceptedSignatures: 0, verifiedCustodyReceipts: 0, authorizedGatewayGets: 0,
    release: 'DISCONNECTED / HOLD' as const };
}

export type Ql276OwnerEvidenceInput = {
  checkId: typeof QL275_OWNER_CHECKS[number]['id'];
  outcome: 'observed' | 'issue';
  device: 'desktop' | 'tablet' | 'mobile';
  assistiveMethod: 'keyboard' | 'screen_reader' | 'zoom_contrast' | 'touch';
  note: string;
};
export type Ql276OwnerObservation = Omit<Ql276OwnerEvidenceInput, 'note'> & {
  note: string; recordedAt: string; status: 'OWNER_REPORTED_UNVERIFIED';
};
export type Ql276CaptureResult = { ok: true; record: Ql276OwnerObservation } | { ok: false; reason: string };

/** Data-minimizing intake: deliberately rejects likely identifiers and secrets.
 * UI observation alone cannot become an authenticated owner/reviewer approval. */
export function ql276CaptureOwnerObservation(input: Ql276OwnerEvidenceInput, now: Date): Ql276CaptureResult {
  if (!QL275_OWNER_CHECKS.some(item => item.id === input.checkId) || !['observed', 'issue'].includes(input.outcome) ||
    !['desktop', 'tablet', 'mobile'].includes(input.device) ||
    !['keyboard', 'screen_reader', 'zoom_contrast', 'touch'].includes(input.assistiveMethod))
    return { ok: false, reason: 'Choose a valid check, result, device and assistive method.' };
  const note = input.note.trim().replace(/\s+/g, ' ');
  if (note.length < 8 || note.length > 240) return { ok: false, reason: 'Describe a non-sensitive observation in 8–240 characters.' };
  if (/https?:|www\.|@|\b(?:password|secret|token|bearer|api[_ -]?key|credential|private key)\b/i.test(note))
    return { ok: false, reason: 'Remove URLs, contact details, credentials and secret-like content from the observation.' };
  if (!Number.isFinite(now.getTime())) return { ok: false, reason: 'A valid local observation time is required.' };
  return { ok: true, record: { checkId: input.checkId, outcome: input.outcome,
    device: input.device, assistiveMethod: input.assistiveMethod, note,
    recordedAt: now.toISOString(), status: 'OWNER_REPORTED_UNVERIFIED' } };
}

export type Ql276CustodianRoute = {
  source: Ql270SourceId;
  destination: 'independent_key_custodian';
  externalReferenceClaim: string | null;
  preparedAt: string;
  observedSourceSha: string;
  state: 'DRAFT_NOT_SENT';
  custodyVerification: 'NOT_PERFORMED';
};

export function ql276PrepareCustodianRoute(source: Ql270SourceId, claimedReference: string, now: Date):
  { ok: true; record: Ql276CustodianRoute } | { ok: false; reason: string } {
  const row = QL276_PUBLIC_SOURCE_RECHECK.find(item => item.source === source);
  if (!row) return { ok: false, reason: 'Select one of the six registered source repositories.' };
  const reference = claimedReference.trim();
  if (reference && !/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(reference))
    return { ok: false, reason: 'Use only an optional non-secret external receipt reference (5–32 letters, digits, underscores or dashes).' };
  if (/^(?:sk[-_]|pk[-_]|secret|password|token|bearer|api[-_]?key)/i.test(reference))
    return { ok: false, reason: 'Secret-like values are not accepted as custody receipt references.' };
  if (!Number.isFinite(now.getTime())) return { ok: false, reason: 'A valid preparation time is required.' };
  return { ok: true, record: { source, destination: 'independent_key_custodian',
    externalReferenceClaim: reference || null, preparedAt: now.toISOString(), observedSourceSha: row.sha,
    state: 'DRAFT_NOT_SENT', custodyVerification: 'NOT_PERFORMED' } };
}

export function ql276IntakePacket(observations: readonly Ql276OwnerObservation[], route: Ql276CustodianRoute | null, asOf: Date | string): string {
  const summary = ql276SourceSummary(asOf);
  return [
    'QL-276 | LOCAL OWNER EVIDENCE & CUSTODIAN ROUTING DRAFT | UNVERIFIED',
    `Public source snapshot: ${QL276_OBSERVED_AT} | ${summary.age} | HTTP 404 ${summary.missing}/${summary.total}`,
    `Changed main source SHAs since QL-274: ${summary.changedSources.join(', ')}`,
    'Owner identity: NOT AUTHENTICATED | Independent device/reviewer acceptance: NOT RECORDED',
    ...observations.map((item,index) => `${index + 1}. ${item.checkId}: ${item.outcome} / ${item.device} / ${item.assistiveMethod} / ${item.recordedAt} / owner-reported unverified: ${item.note}`),
    ...(route ? [
      `Custodian routing DRAFT: ${route.source} / ${route.observedSourceSha} / ${route.preparedAt}`,
      `External receipt reference CLAIM (not verified): ${route.externalReferenceClaim ?? 'NOT PROVIDED'}`,
      'Independent SPKI / Ed25519 / raw SHA-256 / ancestry / witness: NOT VERIFIED',
      'Routing state: DRAFT NOT SENT | Original custodian receipt: NOT VERIFIED'
    ] : ['Custodian routing: NOT PREPARED']),
    'Owner TEST authorization: NOT GIVEN | Authenticated gateway GET: NOT RUN | DISCONNECTED / HOLD',
    'Local copy only. This packet is not an original receipt, signature, reviewer disposition, owner approval or automated handoff.'
  ].join('\n');
}
