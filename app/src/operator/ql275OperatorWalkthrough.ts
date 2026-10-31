import type { Ql271CommandMode } from './Ql271CommandSurfaces';
import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL273_VIEW_HELP } from './ql273CommandHelp';
import { QL274_OBSERVED_AT, QL274_PUBLIC_PROOF_RECHECK, ql274PinnedProofUrl, ql274ProofAge } from './ql274CommandAudit';

/** Presentation-only guidance; no user-entered identity, receipt, approval or network action. */
export const QL275_GUIDE_STEPS: ReadonlyArray<{ id: Ql271CommandMode; title: string; checkpoint: string }> = [
  { id: 'it_command', title: '01 · Map the six source systems', checkpoint: 'Distinguish a registered repository from a verified connection.' },
  { id: 'management', title: '02 · Inspect fictional business workload', checkpoint: 'Confirm that four company desks and mock tasks are not customer records.' },
  { id: 'analytics', title: '03 · Interpret the training statistics', checkpoint: 'Treat the sixteen events as demonstration data, not live activity.' },
  { id: 'system_status', title: '04 · Check the release hold', checkpoint: 'Read the dated Proof-B exceptions before any TEST-only decision.' }
] as const;

export function ql275GuidePosition(mode: Ql271CommandMode) {
  const index = QL275_GUIDE_STEPS.findIndex(step => step.id === mode);
  return { current: index + 1, total: QL275_GUIDE_STEPS.length,
    next: QL275_GUIDE_STEPS[(index + 1) % QL275_GUIDE_STEPS.length],
    hint: QL273_VIEW_HELP[mode].next };
}

export const QL275_OWNER_CHECKS = [
  { id: 'keyboard', label: 'Keyboard-only navigation', instruction: 'Tab through tabs, view help, ⓘ card hints and proof links; confirm focus order, Enter/Space and Escape.' },
  { id: 'reader', label: 'Screen-reader names and announcements', instruction: 'With the owner-selected reader, hear control names, expanded state, preference status and the HOLD boundary.' },
  { id: 'zoom', label: 'Zoom, narrow screen and reflow', instruction: 'At 200% zoom and on a narrow device, inspect card order, heading hierarchy, wrapping and touch targets.' },
  { id: 'contrast', label: 'Contrast and motion preferences', instruction: 'Use device high contrast/forced colors and reduced motion; verify focus and statuses remain readable.' },
  { id: 'profiles', label: 'Browser-local saved views', instruction: 'Switch Standard and Compact, inspect a hidden card, then restore a verified local profile; never infer a role change.' }
] as const;

export type Ql275OwnerOutcome = 'not_reviewed' | 'observed' | 'issue';
export function ql275OwnerProgress(outcomes: Readonly<Record<string, Ql275OwnerOutcome>>) {
  const completed = QL275_OWNER_CHECKS.filter(check => outcomes[check.id] === 'observed').length;
  const issues = QL275_OWNER_CHECKS.filter(check => outcomes[check.id] === 'issue').length;
  return { completed, issues, total: QL275_OWNER_CHECKS.length,
    disposition: 'OWNER_SIGNOFF_NOT_RECORDED' as const };
}

export type Ql275Exception = ReturnType<typeof ql275ProofException>;
export function ql275ProofException(source: Ql270SourceId, asOf: string | Date) {
  const row = QL274_PUBLIC_PROOF_RECHECK.find(item => item.source === source);
  const app = QL270_SOURCES.find(item => item.id === source);
  if (!row || !app) throw Error('UNKNOWN_PROOF_EXCEPTION_SOURCE');
  const age = ql274ProofAge(asOf);
  return {
    source, label: app.label, repo: row.repo, sha: row.sha, http: row.http,
    observedAt: QL274_OBSERVED_AT, url: ql274PinnedProofUrl(source),
    age: age.status, elapsedHours: age.elapsedHours,
    queue: age.status === 'RECENT_404_EXCEPTION' ? 'SOURCE_PROOF_MISSING' as const : 'PUBLIC_RECHECK_DUE' as const,
    acceptedSignature: false, independentWitness: false, ownerTestAuthorization: false,
    gatewayTrial: 'NOT_RUN' as const, release: 'DISCONNECTED / HOLD' as const
  };
}

export const QL275_EXCEPTION_STAGES = [
  { owner: 'Source maintainer', task: 'Publish genuine signed canonical Proof-B from a GREEN audited A to a later descendant B; provide the immutable raw path and exact SHA-256.' },
  { owner: 'Independent key custodian', task: 'Verify Ed25519 signature and independently pinned SPKI, ancestry, raw bytes, nonproduction tenant and CI. Record an original custody receipt.' },
  { owner: 'Independent witness / reviewer', task: 'Examine original positive and negative receipts, isolation and revocation plan; record a separate review disposition.' },
  { owner: 'Authenticated owner', task: 'Decide TEST-only authorization separately: named isolated tenant, ≤30-minute UTC window, GET-only health/capabilities and an independent witness. No permission is assumed.' }
] as const;

export function ql275ExceptionHandoff(source: Ql270SourceId, asOf: string | Date): string {
  const evidence = ql275ProofException(source, asOf);
  return [
    `QL-275 | UNVERIFIED PROOF-B EXCEPTION | ${evidence.label}`,
    `Repository: RosevearCreations/${evidence.repo}`,
    `Historical immutable source SHA: ${evidence.sha}`,
    `Original path: docs/integration/ql246-source-proof.json`,
    `Historical public GET: HTTP ${evidence.http} at ${evidence.observedAt}`,
    `Immutable public source: ${evidence.url}`,
    `Freshness: ${evidence.age} | queue: ${evidence.queue}`,
    ...QL275_EXCEPTION_STAGES.map((step, index) => `${index + 1}. ${step.owner}: ${step.task}`),
    'Signature accepted: NO | custody/witness accepted: NO | owner TEST authorization: NOT GIVEN',
    'Authenticated gateway trial: NOT RUN | tenant and communications: DISCONNECTED / HOLD',
    'This is a draft routing checklist, NOT a signature, original receipt, signed authorization or executed handoff.'
  ].join('\n');
}
