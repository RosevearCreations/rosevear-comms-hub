// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_SOURCES } from '../ql270ConnectionCentre';
import { QL275_EXCEPTION_STAGES, QL275_GUIDE_STEPS, QL275_OWNER_CHECKS, ql275ExceptionHandoff,
  ql275GuidePosition, ql275OwnerProgress, ql275ProofException } from '../ql275OperatorWalkthrough';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  host = document.createElement('div'); document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks();
});

function button(label: string): HTMLButtonElement {
  const found = [...host.querySelectorAll<HTMLButtonElement>('button')]
    .find(item => item.getAttribute('aria-label') === label || item.textContent?.includes(label));
  if (!found) throw Error(`Missing button ${label}`);
  return found;
}
async function openGuide() {
  await act(async () => button('IT Command').click());
  await act(async () => button('Guided operator walkthrough').click());
}
async function topic(label: string) { await act(async () => button(label).click()); }

describe('QL-275 guided command navigation, manual owner accessibility and signed Proof-B exception routing', () => {
  it('guides four actual command views with mode-specific next steps', () => {
    expect(QL275_GUIDE_STEPS.map(step => step.id)).toEqual(['it_command', 'management', 'analytics', 'system_status']);
    expect(ql275GuidePosition('it_command')).toMatchObject({ current: 1, total: 4, next: { id: 'management' } });
    expect(ql275GuidePosition('system_status')).toMatchObject({ current: 4, next: { id: 'it_command' } });
  });

  it('renders guided navigation, follows real command tabs and retains keyboard disclosures', async () => {
    await openGuide();
    expect(host.querySelector('[data-ql275-walkthrough]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Guided command navigation"]')).not.toBeNull();
    expect(host.querySelectorAll('.ql275-guide-list li')).toHaveLength(4);
    expect(host.textContent).toContain('Viewing step 1 of 4');
    await act(async () => button('Next view:').click());
    expect(host.querySelector('[data-command-view]')?.getAttribute('data-command-view')).toBe('management');
    expect(host.textContent).toContain('Viewing step 2 of 4');
    expect(button('Guided operator walkthrough').getAttribute('aria-expanded')).toBe('true');
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(host.querySelector('[data-ql275-walkthrough]')).toBeNull();
  });

  it('marks only temporary owner observations, never owner identity or formal sign-off', async () => {
    expect(QL275_OWNER_CHECKS).toHaveLength(5);
    expect(ql275OwnerProgress({ keyboard: 'observed', reader: 'issue' })).toEqual({
      completed: 1, issues: 1, total: 5, disposition: 'OWNER_SIGNOFF_NOT_RECORDED'
    });
    await openGuide(); await topic('Owner accessibility walkthrough');
    expect(host.querySelectorAll('.ql275-check select')).toHaveLength(5);
    const selection = host.querySelector<HTMLSelectElement>('#ql275-check-keyboard')!;
    await act(async () => { selection.value = 'observed'; selection.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.textContent).toContain('Locally observed 1 of 5');
    expect(host.textContent).toContain('Owner sign-off NOT RECORDED');
    expect(localStorage.length).toBe(0);
    await act(async () => button('Clear local observations').click());
    expect(host.textContent).toContain('Locally observed 0 of 5');
  });

  it('does not preserve a claimed owner review across panel exit', async () => {
    await openGuide(); await topic('Owner accessibility walkthrough');
    const selection = host.querySelector<HTMLSelectElement>('#ql275-check-reader')!;
    await act(async () => { selection.value = 'issue'; selection.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(host.textContent).toContain('issues noted 1');
    await act(async () => button('Guided operator walkthrough').click());
    await act(async () => button('Guided operator walkthrough').click());
    await topic('Owner accessibility walkthrough');
    expect(host.textContent).toContain('issues noted 0');
  });

  it('routes exactly six immutable HTTP 404 exceptions and requires independently supplied evidence', () => {
    expect(QL275_EXCEPTION_STAGES.map(step => step.owner)).toEqual([
      'Source maintainer', 'Independent key custodian', 'Independent witness / reviewer', 'Authenticated owner'
    ]);
    for (const app of QL270_SOURCES) {
      const result = ql275ProofException(app.id, '2026-10-31T01:00:00Z');
      expect(result).toMatchObject({ source: app.id, http: 404, age: 'RECENT_404_EXCEPTION',
        queue: 'SOURCE_PROOF_MISSING', acceptedSignature: false, independentWitness: false,
        ownerTestAuthorization: false, gatewayTrial: 'NOT_RUN', release: 'DISCONNECTED / HOLD' });
      expect(result.sha).toMatch(/^[0-9a-f]{40}$/);
      expect(result.url).toContain(`ref=${result.sha}`);
      const handoff = ql275ExceptionHandoff(app.id, '2026-10-31T01:00:00Z');
      expect(handoff).toContain('UNVERIFIED PROOF-B EXCEPTION');
      expect(handoff).toContain('NOT GIVEN');
      expect(handoff).toContain('NOT RUN');
      expect(handoff).not.toContain('Authorization: APPROVED');
    }
    expect(() => ql275ProofException('invalid' as never, new Date())).toThrow('UNKNOWN_PROOF_EXCEPTION_SOURCE');
  });

  it('ages proof snapshots to a recheck queue, not a current green check', () => {
    expect(ql275ProofException('icamp', '2026-11-01T01:00:00Z').queue).toBe('PUBLIC_RECHECK_DUE');
    expect(ql275ProofException('icamp', '2026-10-30T00:00:00Z').age).toBe('CLOCK_SKEW');
    expect(ql275ExceptionHandoff('icamp', '2026-11-01T01:00:00Z')).toContain('STALE_404_EXCEPTION');
  });

  it('shows source-specific read-only handoff text and navigates to held evidence', async () => {
    await openGuide(); await topic('Proof-B exception routing');
    expect(host.querySelectorAll('.ql275-exception-stages li')).toHaveLength(4);
    expect(host.querySelector<HTMLTextAreaElement>('#ql275-draft')?.readOnly).toBe(true);
    const select = host.querySelector<HTMLSelectElement>('#ql275-source')!;
    await act(async () => { select.value = 'rosiedazzlers'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    const text = host.querySelector<HTMLTextAreaElement>('#ql275-draft')!.value;
    expect(text).toContain('RosevearCreations/rosiedazzlers');
    expect(text).toContain('565e6142b7a928cf6707b6d227f229ae6ef9c428');
    const link = host.querySelector<HTMLAnchorElement>('.ql275-proof-link')!;
    expect(link.href).toContain('ref=565e6142');
    expect(link.rel).toContain('noopener');
    await act(async () => button('Review six-app evidence').click());
    expect(host.textContent).toContain('Six-app evidence');
    expect(host.querySelector('[data-ql275-walkthrough]')).toBeNull();
  });

  it('does not send a handoff when clipboard is unavailable or when copied', async () => {
    await openGuide(); await topic('Proof-B exception routing');
    await act(async () => button('Copy handoff draft').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copied } });
    await act(async () => button('Copy handoff draft').click());
    expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('DISCONNECTED / HOLD');
    expect(host.textContent).toContain('No message, approval or evidence was submitted');
    expect(localStorage.length).toBe(0);
  });

  it('retains responsive, focus, forced-colour and reduced-motion rules', () => {
    const css = readFileSync('src/operator/ql275-operator-walkthrough.css', 'utf8');
    expect(css).toContain('max-width:700px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
