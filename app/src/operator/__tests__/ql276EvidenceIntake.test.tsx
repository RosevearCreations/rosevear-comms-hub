// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_SOURCES } from '../ql270ConnectionCentre';
import { QL274_PUBLIC_PROOF_RECHECK } from '../ql274CommandAudit';
import { QL275_OWNER_CHECKS } from '../ql275OperatorWalkthrough';
import { QL276_OBSERVED_AT, QL276_PUBLIC_SOURCE_RECHECK, ql276CaptureOwnerObservation,
  ql276IntakePacket, ql276PinnedProofUrl, ql276PrepareCustodianRoute, ql276SourceSummary }
  from '../ql276EvidenceIntake';

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
  await act(async () => root.unmount()); host.remove();
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
});
function button(label: string): HTMLButtonElement {
  const match = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item =>
    item.getAttribute('aria-label') === label || item.textContent?.includes(label));
  if (!match) throw Error(`Missing button: ${label}`);
  return match;
}
function select(id: string, value: string) {
  const input = host.querySelector<HTMLSelectElement>(id)!;
  input.value = value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
function input(id: string, value: string) {
  const field = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(id)!;
  // Use native value setter for jsdom React controlled input tracking.
  const descriptor = Object.getOwnPropertyDescriptor(field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!;
  descriptor.set!.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}
async function openIntake() {
  await act(async () => button('IT Command').click());
  await act(async () => button('Owner evidence & custody intake').click());
}

describe('QL-276 owner evidence, independent custody route and genuine public source refresh', () => {
  it('pins exactly six actual public main SHA results and identifies three changed repositories', () => {
    expect(QL276_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL276_PUBLIC_SOURCE_RECHECK.map(row => row.source))).toEqual(new Set(QL270_SOURCES.map(row => row.id)));
    for (const row of QL276_PUBLIC_SOURCE_RECHECK) {
      expect(row.sha).toMatch(/^[0-9a-f]{40}$/);
      expect(row.http).toBe(404);
      expect(ql276PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
      expect(ql276PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');
    }
    const changed = QL276_PUBLIC_SOURCE_RECHECK.filter(row => QL274_PUBLIC_PROOF_RECHECK.find(old => old.source === row.source)?.sha !== row.sha);
    expect(changed.map(row => row.source)).toEqual(['devilndove', 'rosiedazzlers', 'rosevear-ai-hub']);
    expect(QL276_OBSERVED_AT).toBe('2026-10-31T01:03:05Z');
    expect(ql276SourceSummary('2026-10-31T02:00:00Z')).toMatchObject({
      missing: 6, total: 6, age: 'RECENT_SNAPSHOT', acceptedSignatures: 0,
      verifiedCustodyReceipts: 0, authorizedGatewayGets: 0, release: 'DISCONNECTED / HOLD'
    });
  });

  it('marks stale and clock-skew source checks for revalidation, without asserting a heartbeat', () => {
    expect(ql276SourceSummary('2026-11-01T01:03:05Z').age).toBe('RECHECK_DUE');
    expect(ql276SourceSummary('2026-10-31T01:03:04Z').age).toBe('CLOCK_SKEW');
    expect(() => ql276PinnedProofUrl('invalid' as never)).toThrow('UNKNOWN_QL276_SOURCE');
  });

  it('accepts bounded non-secret device observations while preserving independent owner review', () => {
    expect(QL275_OWNER_CHECKS).toHaveLength(5);
    const good = ql276CaptureOwnerObservation({ checkId: 'zoom', outcome: 'issue', device: 'mobile',
      assistiveMethod: 'zoom_contrast', note: 'At 200% zoom, the action row needs horizontal scrolling.' }, new Date('2026-10-31T01:08:00Z'));
    expect(good.ok).toBe(true);
    if (!good.ok) throw Error(good.reason);
    expect(good.record).toMatchObject({ status: 'OWNER_REPORTED_UNVERIFIED', checkId: 'zoom', outcome: 'issue',
      recordedAt: '2026-10-31T01:08:00.000Z' });
    expect(ql276IntakePacket([good.record], null, '2026-10-31T01:08:00Z')).toContain('Owner identity: NOT AUTHENTICATED');
  });

  it('rejects sensitive notes, invalid choices, overlength notes and malformed timestamps', () => {
    const base = { checkId: 'reader', outcome: 'observed', device: 'desktop',
      assistiveMethod: 'screen_reader', note: 'The expanded help was spoken clearly.' } as const;
    for (const note of ['a', 'Send token abc123 here', 'Contact owner@example.com', 'See https://example.com', 'x'.repeat(241)]) {
      expect(ql276CaptureOwnerObservation({ ...base, note }, new Date()).ok).toBe(false);
    }
    expect(ql276CaptureOwnerObservation({ ...base, checkId: 'invented' as never }, new Date()).ok).toBe(false);
    expect(ql276CaptureOwnerObservation(base, new Date('bad')).ok).toBe(false);
  });

  it('prepares a route without inventing a receipt, signature, custodian disposition or authorization', () => {
    const result = ql276PrepareCustodianRoute('rosiedazzlers', 'CUST-2026-123', new Date('2026-10-31T01:12:00Z'));
    expect(result.ok).toBe(true);
    if (!result.ok) throw Error(result.reason);
    expect(result.record).toMatchObject({ destination: 'independent_key_custodian',
      state: 'DRAFT_NOT_SENT', custodyVerification: 'NOT_PERFORMED', externalReferenceClaim: 'CUST-2026-123' });
    const packet = ql276IntakePacket([], result.record, '2026-10-31T01:12:00Z');
    expect(packet).toContain('External receipt reference CLAIM (not verified)');
    expect(packet).toContain('Original custodian receipt: NOT VERIFIED');
    expect(packet).toContain('Owner TEST authorization: NOT GIVEN');
    expect(ql276PrepareCustodianRoute('rosiedazzlers', '', new Date()).ok).toBe(true);
    expect(ql276PrepareCustodianRoute('rosiedazzlers', 'user@example.com', new Date()).ok).toBe(false);
    expect(ql276PrepareCustodianRoute('rosiedazzlers', 'sk-live-secret-123', new Date()).ok).toBe(false);
    expect(ql276PrepareCustodianRoute('invalid' as never, '', new Date()).ok).toBe(false);
  });

  it('renders owner observation intake, records actual operator notes locally and leaves HOLD intact', async () => {
    await openIntake();
    expect(host.querySelector('[data-ql276-intake]')).not.toBeNull();
    expect(host.textContent).toContain('Owner-recorded accessibility evidence');
    await act(async () => select('#ql276-check', 'zoom'));
    await act(async () => select('#ql276-device', 'tablet'));
    await act(async () => input('#ql276-observation', 'At 200% zoom, no horizontal scrolling was observed.'));
    await act(async () => button('Record local observation').click());
    expect(host.querySelectorAll('.ql276-observation-list li')).toHaveLength(1);
    expect(host.textContent).toContain('OWNER REPORTED · UNVERIFIED');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
    expect(localStorage.length).toBe(0);
    await act(async () => button('Owner evidence & custody intake').click());
    await act(async () => button('Owner evidence & custody intake').click());
    expect(host.querySelectorAll('.ql276-observation-list li')).toHaveLength(0);
  });

  it('exposes optional claimed custodian reference without calling it a verified receipt', async () => {
    await openIntake();
    await act(async () => button('02 Custodian route draft').click());
    await act(async () => select('#ql276-source', 'devilndove'));
    await act(async () => input('#ql276-reference', 'CUST-276-DEMO'));
    await act(async () => button('Prepare local routing receipt draft').click());
    expect(host.textContent).toContain('DRAFT NOT SENT · CUSTODY NOT VERIFIED');
    expect(host.querySelector<HTMLTextAreaElement>('#ql276-packet')?.value).toContain('CUST-276-DEMO');
    expect(host.textContent).toContain('No message sent');
    expect(localStorage.length).toBe(0);
  });

  it('shows six fresh source records with immutable links and detects changed main SHAs', async () => {
    await openIntake();
    await act(async () => button('03 Fresh public recheck').click());
    expect(host.querySelectorAll('.ql276-source-row')).toHaveLength(6);
    expect(host.textContent).toContain('NEW SHA');
    const links = [...host.querySelectorAll<HTMLAnchorElement>('.ql276-source-row a')];
    expect(links).toHaveLength(6);
    expect(links.every(link => link.rel.includes('noopener') && link.href.includes('ref='))).toBe(true);
    await act(async () => button('Open held connection preflight').click());
    expect(host.textContent).toContain('One hub. Six systems.');
  });

  it('copies a sanitized local packet or reports a denied clipboard, never sends a handoff', async () => {
    await openIntake();
    expect(host.querySelector<HTMLTextAreaElement>('#ql276-packet')?.readOnly).toBe(true);
    await act(async () => button('Copy local packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copied } });
    await act(async () => button('Copy local packet').click());
    expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('NOT AUTHENTICATED');
    expect(host.textContent).toContain('not transmitted, signed or independently accepted');
    expect(localStorage.length).toBe(0);
  });

  it('keeps visible focus, responsive, forced-colour and reduced-motion protection', () => {
    const css = readFileSync('src/operator/ql276-evidence-intake.css', 'utf8');
    expect(css).toContain('max-width:570px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
