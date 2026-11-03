// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL323_DEPENDENCIES, QL323_RELEASE_EVIDENCE, QL323_SCENARIOS, ql323Assess, ql323SourceEvidence } from '../ql323SystemHealth';

describe('QL-323 genuine observation boundaries and failure state matrix', () => {
  it('keeps four independent businesses and two support services disconnected', () => {
    expect(QL323_DEPENDENCIES).toHaveLength(6);
    expect(QL323_DEPENDENCIES.filter(item => item.kind === 'Business app')).toHaveLength(4);
    expect(QL323_DEPENDENCIES.filter(item => item.kind !== 'Business app')).toHaveLength(2);
    for (const row of QL323_DEPENDENCIES) expect(row.link).toBe('PLANNED ONLY · DISCONNECTED / HOLD');
    expect(QL323_RELEASE_EVIDENCE.observedRuntimeAt).toBeNull();
  });
  it('refuses to mark a real external source healthy in every simulation or invalid input', () => {
    expect(QL323_SCENARIOS.map(row => row.id)).toEqual(['unobserved', 'offline', 'timeout', 'invalid', 'stale', 'fixture_recovered']);
    for (const { id } of QL323_SCENARIOS) {
      const result = ql323Assess(id);
      expect(result.scenario).toBe(id);
      expect(result.actions.length).toBeGreaterThan(1);
      expect(result.liveHealthVerified).toBe(false);
      expect(result.providerRequests).toBe(0);
      expect(result.autoRestartAttempts).toBe(0);
      expect(result.connection).toBe('DISCONNECTED / HOLD');
      expect(result.label).not.toMatch(/HEALTHY|GREEN|CONNECTED/);
    }
    expect(ql323Assess('nonexistent-case')).toEqual(ql323Assess('unobserved'));
    expect(ql323Assess('__proto__')).toEqual(ql323Assess('unobserved'));
  });
  it('treats old proof observations as stale, unknown-time as unknown and HTTP 404 as proof failure rather than outage', () => {
    const fresh = ql323SourceEvidence(new Date('2026-11-02T02:00:00Z'));
    expect(fresh).toHaveLength(6);
    expect(fresh.every(item => item.freshness === 'DATED SNAPSHOT · NOT LIVE')).toBe(true);
    const old = ql323SourceEvidence(new Date('2026-11-03T02:00:00Z'));
    for (const row of old) {
      expect(row.freshness).toBe('STALE · RECHECK NEEDED');
      expect(row.health).toBe('UNKNOWN / NOT MONITORED');
      expect(row.originalProof).toBe('HTTP 404 AT PINNED PROOF');
      expect(row.connection).toBe('DISCONNECTED / HOLD');
    }
    expect(ql323SourceEvidence(new Date('2026-10-01T00:00:00Z')).every(row => row.freshness === 'UNKNOWN / CLOCK REVIEW')).toBe(true);
  });
});

let host: HTMLDivElement; let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
function button(label: string, scope = 'button') { const found = [...host.querySelectorAll<HTMLButtonElement>(scope)].find(item => item.textContent?.includes(label)); if (!found) throw Error(`Missing ${label}`); return found; }

describe('QL-323 accessible status, dependency and guided recovery UI', () => {
  it('shows source-evidence and dependency diagram/table parity without displaying actual runtime GREEN', async () => {
    await act(async () => button('System status', '.ql172-nav-button').click());
    const view = host.querySelector('.ql323')!;
    expect(view.getAttribute('data-ql323-release')).toBe('honest-status-dependency-recovery-v1');
    expect(view.querySelectorAll('.ql323-map-group>div')).toHaveLength(6);
    expect(view.querySelectorAll('.ql323-dependencies tbody tr')).toHaveLength(6);
    expect(view.querySelectorAll('.ql323-proof tbody tr')).toHaveLength(6);
    expect(view.textContent).toContain('UNKNOWN / NOT MONITORED');
    expect(view.textContent).toContain('6 / 6 HOLD');
    expect(view.textContent).toContain('0 verified live health probes');
    expect(view.textContent).toContain('NO PROVIDER REQUESTS');
    expect(view.querySelector('a[href*="QL-322_STATISTICAL"]')).not.toBeNull();
    expect(host.querySelector('.ql303')).not.toBeNull();
  });
  it('rehearses offline/timeout/invalid/stale/recovery without sending or restarting and offers navigable diagnostics', async () => {
    await act(async () => button('System status', '.ql172-nav-button').click());
    const scenario = host.querySelector<HTMLSelectElement>('#ql323-scenario')!;
    const view = host.querySelector('.ql323')!;
    for (const [value, expected] of [['offline', 'OFFLINE'], ['timeout', 'TIMEOUT'], ['invalid', 'INVALID'], ['stale', 'STALE']] as const) {
      await act(async () => { scenario.value = value; scenario.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(view.querySelector('.ql323-outcome')?.textContent).toContain(expected);
      expect(view.querySelector('.ql323-outcome')?.textContent).toContain('Automatic restarts: 0');
    }
    await act(async () => button('Rehearse fixture recovery').click());
    expect(view.querySelector('.ql323-state')?.textContent).toContain('STILL UNVERIFIED');
    await act(async () => button('Reset to UNKNOWN').click());
    expect(view.querySelector('.ql323-state')?.textContent).toContain('UNKNOWN');
    await act(async () => button('Open I.T. diagnostics').click());
    expect(host.querySelector('[data-command-view="it_command"]')).not.toBeNull();
    expect(window.localStorage.length).toBe(0);
  });
  it('defines responsive, keyboard-visible, contrast and reduced-motion styles', () => {
    const css = readFileSync('src/operator/ql323-system-health.css', 'utf8');
    for (const fragment of ['min-height:44px', 'overflow-x:auto', ':focus-visible', 'max-width:580px', 'forced-colors:active', 'prefers-reduced-motion:reduce']) expect(css).toContain(fragment);
  });
});
