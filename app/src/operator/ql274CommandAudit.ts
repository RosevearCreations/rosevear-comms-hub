import { QL270_SOURCES, type Ql270SourceId } from './ql270ConnectionCentre';
import { QL272_VIEWS, type Ql272PreferenceEnvelope } from './ql272LayoutPreferences';
import { QL273_METRIC_HELP, QL273_SHORTCUTS, QL273_VIEW_HELP } from './ql273CommandHelp';

/** Dated public GitHub evidence only: six read-only HTTP GETs against immutable
 * source main commits, taken 31 October 2026 UTC. No application gateway,
 * tenant or credential was accessed, and a future HTTP 200 is not signer proof. */
export const QL274_OBSERVED_AT = '2026-10-31T00:22:45Z';
export const QL274_PUBLIC_PROOF_RECHECK = [
  { source: 'ai-data-platform', repo: 'ai-data-platform', sha: '79a90aa17c2f04b77b27bd3eca54dbdc50d87fe5', http: 404 },
  { source: 'devilndove', repo: 'devilndove-site', sha: '3d47209aa9966ec3d7d994190ef6c0939d0ad5b3', http: 404 },
  { source: 'rosiedazzlers', repo: 'rosiedazzlers', sha: '565e6142b7a928cf6707b6d227f229ae6ef9c428', http: 404 },
  { source: 'yw', repo: 'yw', sha: '29378a0c9050652f05882a280445750d4a881074', http: 404 },
  { source: 'icamp', repo: 'iCamp', sha: '219251ee433d745a236ac19c682a3a453db72463', http: 404 },
  { source: 'rosevear-ai-hub', repo: 'rosevear-ai-hub', sha: '4db6746cbb862b5a4b972c918601ef5c6f3ee927', http: 404 }
] as const satisfies ReadonlyArray<{ source: Ql270SourceId; repo: string; sha: string; http: number }>;

export type Ql274ProofAge = 'RECENT_404_EXCEPTION' | 'STALE_404_EXCEPTION' | 'CLOCK_SKEW';
export function ql274ProofAge(asOf: string | Date, observedAt = QL274_OBSERVED_AT): { status: Ql274ProofAge; elapsedHours: number } {
  const elapsedMs = new Date(asOf).getTime() - new Date(observedAt).getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return { status: 'CLOCK_SKEW', elapsedHours: 0 };
  const elapsedHours = Math.floor(elapsedMs / 3_600_000);
  return { status: elapsedHours >= 24 ? 'STALE_404_EXCEPTION' : 'RECENT_404_EXCEPTION', elapsedHours };
}

export function ql274PinnedProofUrl(source: Ql270SourceId): string {
  const entry = QL274_PUBLIC_PROOF_RECHECK.find(item => item.source === source);
  if (!entry) throw Error('UNKNOWN_PUBLIC_PROOF_SOURCE');
  return `https://api.github.com/repos/RosevearCreations/${entry.repo}/contents/docs/integration/ql246-source-proof.json?ref=${entry.sha}`;
}

export function ql274HelpCoverage() {
  const viewRows = QL272_VIEWS.map(id => ({
    id,
    viewHelp: Boolean(QL273_VIEW_HELP[id]?.purpose && QL273_VIEW_HELP[id]?.reading && QL273_VIEW_HELP[id]?.next),
    describedMetrics: QL273_METRIC_HELP[id]?.filter(message => Boolean(message.trim())).length ?? 0,
    expectedMetrics: 4
  }));
  const viewsCovered = viewRows.filter(row => row.viewHelp).length;
  const metricsCovered = viewRows.reduce((sum, row) => sum + row.describedMetrics, 0);
  return { viewRows, viewsCovered, totalViews: QL272_VIEWS.length,
    metricsCovered, totalMetrics: viewRows.reduce((sum, row) => sum + row.expectedMetrics, 0),
    shortcutCount: QL273_SHORTCUTS.length,
    gaps: viewRows.filter(row => !row.viewHelp || row.describedMetrics !== row.expectedMetrics) };
}

export function ql274PreferenceAccessibility(preferences: Ql272PreferenceEnvelope) {
  const active = preferences.profiles.find(profile => profile.id === preferences.activeId);
  const visibleByView = QL272_VIEWS.map(mode => ({
    mode,
    visible: active ? active.views[mode].order.length - active.views[mode].hidden.length : 0
  }));
  return {
    activeLabel: active?.label ?? 'Unknown',
    density: active?.density ?? 'comfortable',
    rolePreview: active?.rolePreview ?? 'operator',
    visibleByView,
    hasFocusableMetrics: visibleByView.every(row => row.visible >= 1),
    labelIsGeneric: Boolean(active && /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,27}$/u.test(active.label)),
    noPrivilegeChange: true
  };
}

export const QL274_ACCESSIBILITY_CHECKS = [
  { id: 'labels', label: 'Labels and explanations', detail: 'Each KPI help button has a descriptive accessible name, and layout settings have visible labels.', result: 'AUTOMATED_REVIEW' },
  { id: 'keys', label: 'Keyboard and editable-field safety', detail: 'Alt + Shift shortcuts avoid text inputs. Regular Tab, Enter, Space and Escape remain usable.', result: 'AUTOMATED_REVIEW' },
  { id: 'focus', label: 'Visible focus and reduced motion', detail: 'Focused controls use a contrasting outline; reduced-motion and forced-colour styles are present.', result: 'AUTOMATED_REVIEW' },
  { id: 'state', label: 'Spoken status and non-colour meaning', detail: 'Preference changes are announced in text; status and HOLD labels are never indicated by colour alone.', result: 'AUTOMATED_REVIEW' },
  { id: 'assistive', label: 'Manual screen-reader acceptance', detail: 'Device/reader combinations and touch accessibility need owner testing; automated checks do not establish full WCAG compliance.', result: 'OWNER_REVIEW_PENDING' }
] as const;

export function ql274ProofSummary(asOf: string | Date) {
  const age = ql274ProofAge(asOf);
  return { observedAt: QL274_OBSERVED_AT, ...age,
    missingCount: QL274_PUBLIC_PROOF_RECHECK.filter(item => item.http === 404).length,
    sourceCount: QL270_SOURCES.length,
    verifiedSignatures: 0,
    authorizedGatewayGets: 0,
    release: 'DISCONNECTED / HOLD' as const };
}
