// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_PROOF_SNAPSHOT, QL270_SOURCES } from '../ql270ConnectionCentre';
import { defaultQl272Preferences } from '../ql272LayoutPreferences';
import { QL274_ACCESSIBILITY_CHECKS, QL274_OBSERVED_AT, QL274_PUBLIC_PROOF_RECHECK,
  ql274HelpCoverage, ql274PinnedProofUrl, ql274PreferenceAccessibility, ql274ProofAge, ql274ProofSummary }
  from '../ql274CommandAudit';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

function button(label: string): HTMLButtonElement {
  const match = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item =>
    item.getAttribute('aria-label') === label || item.textContent?.includes(label));
  if (!match) throw Error(`Missing button ${label}`);
  return match;
}

async function openReview() {
  await act(async () => button('IT Command').click());
  await act(async () => button('Help & proof review').click());
}

describe('QL-274 help coverage, accessibility and dated public-proof audit', () => {
  it('derives complete four-command and sixteen-card help coverage from implemented definitions', () => {
    const result = ql274HelpCoverage();
    expect(result).toMatchObject({ viewsCovered: 4, totalViews: 4, metricsCovered: 16, totalMetrics: 16, shortcutCount: 7 });
    expect(result.gaps).toEqual([]);
    expect(result.viewRows.map(row => row.id)).toEqual(['it_command', 'management', 'analytics', 'system_status']);
  });

  it('audits local profiles without granting a role and requires a visible card for every command view', () => {
    const valid = ql274PreferenceAccessibility(defaultQl272Preferences());
    expect(valid.hasFocusableMetrics).toBe(true);
    expect(valid.labelIsGeneric).toBe(true);
    expect(valid.noPrivilegeChange).toBe(true);
    const preferences = defaultQl272Preferences();
    preferences.profiles[0].views.analytics.hidden = [0, 1, 2, 3];
    expect(ql274PreferenceAccessibility(preferences).hasFocusableMetrics).toBe(false);
    expect(QL274_ACCESSIBILITY_CHECKS.filter(row => row.result === 'OWNER_REVIEW_PENDING')).toHaveLength(1);
  });

  it('retains historical QL-270 evidence and pins six newer real HTTP 404 source observations', () => {
    expect(QL270_PROOF_SNAPSHOT).toHaveLength(6);
    expect(QL274_PUBLIC_PROOF_RECHECK).toHaveLength(6);
    const ids = new Set(QL274_PUBLIC_PROOF_RECHECK.map(row => row.source));
    expect(ids).toEqual(new Set(QL270_SOURCES.map(row => row.id)));
    for (const row of QL274_PUBLIC_PROOF_RECHECK) {
      expect(row.sha).toMatch(/^[a-f0-9]{40}$/);
      expect(row.http).toBe(404);
      expect(ql274PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
      expect(ql274PinnedProofUrl(row.source)).toContain('/contents/docs/integration/ql246-source-proof.json');
    }
    const summary = ql274ProofSummary('2026-10-31T01:00:00Z');
    expect(summary).toMatchObject({ missingCount: 6, sourceCount: 6, verifiedSignatures: 0, authorizedGatewayGets: 0, release: 'DISCONNECTED / HOLD' });
    expect(summary.status).toBe('RECENT_404_EXCEPTION');
  });

  it('marks aged exception observations stale rather than inventing a live heartbeat', () => {
    expect(ql274ProofAge('2026-10-31T00:23:00Z').status).toBe('RECENT_404_EXCEPTION');
    expect(ql274ProofAge('2026-11-01T00:23:00Z').status).toBe('STALE_404_EXCEPTION');
    expect(ql274ProofAge('2026-10-30T22:00:00Z').status).toBe('CLOCK_SKEW');
    expect(QL274_OBSERVED_AT).toMatch(/^2026-10-31T/);
  });

  it('renders an accessible command review with actual coverage, pending manual checks and all six source links', async () => {
    await openReview();
    expect(host.querySelector('[data-ql274-review]')).not.toBeNull();
    expect(host.querySelector('[aria-label="QL-274 command help and proof assurance review"]')).not.toBeNull();
    expect(host.querySelectorAll('.ql274-coverage-list li')).toHaveLength(4);
    expect(host.querySelectorAll('.ql274-accessibility-list li')).toHaveLength(5);
    expect(host.querySelectorAll('.ql274-proof-row')).toHaveLength(6);
    expect(host.textContent).toContain('Manual check pending');
    expect(host.textContent).toContain('0 accepted');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
    const links = [...host.querySelectorAll<HTMLAnchorElement>('.ql274-proof-row a')];
    expect(links).toHaveLength(6);
    expect(links.every(link => link.target === '_blank' && link.rel.includes('noopener'))).toBe(true);
    await act(async () => button('Open security evidence').click());
    expect(host.textContent).toContain('Six-app evidence');
    expect(host.querySelector('[data-ql274-review]')).toBeNull();
  });

  it('announces preference changes and preserves keyboard-safe local customization', async () => {
    await act(async () => button('IT Command').click());
    const status = host.querySelector('.ql272-toolbar-label small[role="status"]');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    await act(async () => button('Customize cards').click());
    const density = host.querySelector<HTMLSelectElement>('select[aria-label="Screen density"]')!;
    await act(async () => { density.value = 'compact'; density.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(status?.textContent).toContain('Compact');
    expect(host.querySelector('.ql271-command')?.getAttribute('data-ql272-density')).toBe('compact');
  });

  it('surfaces new proof exceptions in Connections without erasing the historical QL-270 observation', async () => {
    await act(async () => button('Connections · six apps').click());
    expect(host.textContent).toContain('QL-274 public recheck');
    expect(host.textContent).toContain('QL-270 immutable commit');
    const link = host.querySelector<HTMLAnchorElement>('a[href*="ref=565e6142"]');
    expect(link).not.toBeNull();
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });

  it('keeps responsive, high-contrast and reduced-motion presentation for audit information', () => {
    const css = readFileSync('src/operator/ql274-command-review.css', 'utf8');
    expect(css).toContain('max-width:590px');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain(':focus-visible');
  });
});
