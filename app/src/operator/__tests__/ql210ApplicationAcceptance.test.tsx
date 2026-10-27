// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL181_PREREQUISITES } from '../ql181PrivacyPilotGate';
import { evaluateQl210Company, evaluateQl210Portfolio, QL210_RELEASE } from '../ql210ApplicationAcceptance';
import type { OrganizationId } from '../ql191Organizations';

const organizations: readonly OrganizationId[] = ['rosiedazzlers', 'devilndove', 'icamp', 'yw'];

describe('QL-210 deterministic cross-application acceptance contract', () => {
  it('runs 10 functional safety cases per organization with no live operations', () => {
    const portfolio = evaluateQl210Portfolio();
    expect(portfolio.release).toBe(QL210_RELEASE);
    expect(portfolio.organizations.map((row) => row.organizationId)).toEqual(organizations);
    expect(portfolio.totalChecks).toBe(40);
    expect(portfolio.passed).toBe(40);
    expect(portfolio.failed).toBe(0);
    expect(portfolio.previewChecksReady).toBe(true);
    for (const org of portfolio.organizations) {
      expect(org.previewChecksReady).toBe(true);
      expect(org.passed).toBe(10);
      expect(org.failed).toBe(0);
      expect(new Set(org.checks.map((check) => check.id)).size).toBe(10);
      expect(org.checks.every((check) => check.state === 'PASS_SYNTHETIC')).toBe(true);
      expect(org.livePilotReady).toBe(false);
    }
  });

  it('never converts sample acceptance into owner approval, provider activation or human review', () => {
    const portfolio = evaluateQl210Portfolio();
    expect(portfolio).toMatchObject({ livePilotReady: false, ownerApprovalCaptured: false,
      externalReviewCompleted: false, providerConnected: false, realAuthVerified: false,
      messagesSent: 0, callsPlaced: 0, externalWrites: 0 });
    expect(portfolio.heldPrerequisites).toHaveLength(12);
    expect(portfolio.heldPrerequisites).toBe(QL181_PREREQUISITES);
    expect(portfolio.heldPrerequisites.every((item) => item.state === 'HELD_UNVERIFIED')).toBe(true);
    for (const organizationId of organizations) {
      const review = evaluateQl210Company(organizationId);
      expect(review.checks.find((item) => item.id === 'roles')?.state).toBe('PASS_SYNTHETIC');
      expect(review.checks.find((item) => item.id === 'composer')?.state).toBe('PASS_SYNTHETIC');
      expect(review.checks.find((item) => item.id === 'gateway')?.state).toBe('PASS_SYNTHETIC');
      expect(review.checks.find((item) => item.id === 'analytics')?.state).toBe('PASS_SYNTHETIC');
    }
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((entry) => entry.textContent?.includes(text));
  if (!button) throw new Error(`Missing button ${text}`);
  await act(async () => button.click());
}
async function choose(selector: string, value: string) {
  const control = host.querySelector<HTMLSelectElement>(selector);
  if (!control) throw new Error(`Missing select ${selector}`);
  await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
    setter.call(control, value); control.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-210 all-company operator acceptance interface', () => {
  it('provides accessible evidence, guidance, four-company results, held gates and a rerun without approvals', async () => {
    await click('Safety & hold review', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql210-release="${QL210_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('40/40 passed');
    expect(host.textContent).toContain('HELD · NOT AUTHORIZED');
    expect(host.textContent).toContain('Unverified prerequisites before any real pilot: 12');
    expect(host.querySelector('.ql210-matrix table caption')).not.toBeNull();
    await click('ⓘ Help', '.ql210-head button');
    expect(host.textContent).toContain('not that a live integration is ready');
    await click('Show four-company summary');
    expect(host.textContent).toContain('Four-company acceptance matrix');
    expect(host.textContent).toContain('Devil n Dove');
    expect(host.textContent).toContain('iCamp');
    await click('Review live-pilot holds');
    expect(host.querySelectorAll('.ql210-required ol li')).toHaveLength(12);
    await choose('#ql210-category', 'Owner governance');
    expect(host.querySelectorAll('.ql210-required ol li').length).toBeGreaterThan(0);
    expect(host.querySelectorAll('.ql210-required ol li').length).toBeLessThan(12);
    await click('Run synthetic acceptance again');
    expect(host.textContent).toContain('Review run #2');
    expect(host.textContent).toContain('External writes: 0');
    expect(host.querySelector('button[type="submit"]')).toBeNull();
  });

  it('preserves readiness access on all four brands and manual workflow navigation', async () => {
    await click('Safety & hold review', '.ql172-nav-button');
    for (const [label, id] of [
      ['iCamp', 'icamp'], ['YW · Property Maintenance', 'yw'],
      ['Devil n Dove', 'devilndove'], ['Rosie Dazzlers', 'rosiedazzlers']
    ] as const) {
      await click(label, '.ql172-brand');
      expect(host.querySelector(`[data-ql210-release="${QL210_RELEASE}"][data-organization="${id}"]`)).not.toBeNull();
      expect(host.querySelectorAll('.ql210-matrix tbody tr')).toHaveLength(10);
      expect(host.textContent).toContain('Live communications pilot');
    }
    await click('Review scoped analytics');
    expect(host.textContent).toContain('Tenant-scoped analytics');
    await click('Safety & hold review', '.ql172-nav-button');
    await click('Review connector safety');
    expect(host.textContent).toContain('Connector centre');
    expect(host.querySelector('.ql172-skip-link')?.getAttribute('href')).toBe('#ql172-workspace');
  }, 15_000);
});
