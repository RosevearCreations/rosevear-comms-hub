// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_SOURCES } from '../ql270ConnectionCentre';
import { QL276_PUBLIC_SOURCE_RECHECK, ql276CaptureOwnerObservation } from '../ql276EvidenceIntake';
import { QL277_OBSERVED_AT, QL277_PUBLIC_SOURCE_RECHECK, ql277CompareAccessibility,
  ql277CustodianQueue, ql277PinnedProofUrl, ql277PrepareNotification, ql277ReviewPacket, ql277SourceDrift }
  from '../ql277DriftReview';

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear(); host = document.createElement('div'); document.body.append(host);
  root = createRoot(host); await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
});
function button(label: string) {
  const match = [...host.querySelectorAll<HTMLButtonElement>('button')].find(item =>
    item.getAttribute('aria-label') === label || item.textContent?.includes(label));
  if (!match) throw Error(`Missing button ${label}`);
  return match;
}
function select(selector: string, value: string) {
  const field = host.querySelector<HTMLSelectElement>(selector)!;
  field.value = value; field.dispatchEvent(new Event('change', { bubbles:true }));
}
function input(selector: string, value: string) {
  const field = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
  const descriptor = Object.getOwnPropertyDescriptor(field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!;
  descriptor.set!.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}
async function openReview() {
  await act(async () => button('IT Command').click());
  await act(async () => button('Recheck & source drift audit').click());
}
const captured = (outcome: 'issue' | 'observed', at: string, device: 'desktop' | 'mobile' = 'desktop') => {
  const r = ql276CaptureOwnerObservation({ checkId: 'keyboard', outcome, device, assistiveMethod: 'keyboard', note: 'Checked the operator keyboard focus order on this device.' }, new Date(at));
  if (!r.ok) throw Error(r.reason);
  return r.record;
};

describe('QL-277 owner recheck comparison, custodian reference queue and source drift notifications', () => {
  it('rechecks all six genuinely new main SHAs with immutable original-proof HTTP 404 exceptions', () => {
    expect(QL277_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL277_PUBLIC_SOURCE_RECHECK.map(row => row.source))).toEqual(new Set(QL270_SOURCES.map(row => row.id)));
    for (const row of QL277_PUBLIC_SOURCE_RECHECK) {
      expect(row.http).toBe(404);
      expect(row.sha).toMatch(/^[a-f0-9]{40}$/);
      expect(row.sha).not.toBe(QL276_PUBLIC_SOURCE_RECHECK.find(old => old.source === row.source)?.sha);
      expect(ql277PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
    }
    expect(QL277_OBSERVED_AT).toBe('2026-10-31T01:50:32Z');
    expect(ql277SourceDrift('2026-10-31T02:00:00Z')).toMatchObject({ changed: 6, total: 6, missing: 6,
      age: 'RECENT_SNAPSHOT', noticesSent: 0, acceptedSignatures: 0, release: 'DISCONNECTED / HOLD' });
  });

  it('flags a stale or future-clock public snapshot without claiming a current heartbeat', () => {
    expect(ql277SourceDrift('2026-11-01T01:50:32Z').age).toBe('RECHECK_DUE');
    expect(ql277SourceDrift('2026-10-31T01:00:00Z').age).toBe('CLOCK_SKEW');
    expect(() => ql277PinnedProofUrl('unknown' as never)).toThrow('UNKNOWN_QL277_SOURCE');
  });

  it('compares actual two owner reports while keeping every outcome independently unverified', () => {
    const baseline = captured('issue', '2026-10-31T01:51:00Z');
    const improvement = ql277CompareAccessibility(baseline, captured('observed', '2026-10-31T01:52:00Z'));
    expect(improvement).toMatchObject({ finding: 'IMPROVED_OWNER_REPORTED', status: 'OWNER_REPORTED_UNVERIFIED' });
    expect(ql277CompareAccessibility(captured('observed','2026-10-31T01:51:00Z'), captured('issue','2026-10-31T01:52:00Z')).finding).toBe('REGRESSION_OWNER_REPORTED');
    expect(ql277CompareAccessibility(baseline, captured('issue','2026-10-31T01:52:00Z')).finding).toBe('UNRESOLVED_OWNER_REPORTED');
    expect(ql277CompareAccessibility(captured('observed','2026-10-31T01:51:00Z'), captured('observed','2026-10-31T01:52:00Z')).finding).toBe('UNCHANGED_OWNER_REPORTED');
    expect(ql277CompareAccessibility(baseline, captured('issue','2026-10-31T01:52:00Z','mobile')).finding).toBe('ENVIRONMENT_MISMATCH');
    expect(ql277CompareAccessibility(baseline, captured('observed','2026-10-31T01:50:00Z')).finding).toBe('TIME_ORDER_REVIEW');
    expect(() => ql277CompareAccessibility(baseline, { ...captured('issue','2026-10-31T01:52:00Z'), checkId:'reader' })).toThrow('DIFFERENT_ACCESSIBILITY_CHECK');
  });

  it('validates only non-secret custodian reference format, not actual custody', () => {
    const good = ql277CustodianQueue('rosiedazzlers','CUST-276-RECHECK', new Date('2026-10-31T01:55:00Z'));
    expect(good.ok).toBe(true);
    if (!good.ok) throw Error(good.reason);
    expect(good.item).toMatchObject({ format:'FORMAT_VALID_ONLY', disposition:'SOURCE_PROOF_404_CUSTODY_UNVERIFIED', routed:'DRAFT_NOT_SENT' });
    expect(ql277CustodianQueue('rosiedazzlers','',new Date()).ok).toBe(true);
    expect(ql277CustodianQueue('rosiedazzlers','Bearer-credential',new Date()).ok).toBe(false);
    expect(ql277CustodianQueue('not-source' as never,'',new Date()).ok).toBe(false);
  });

  it('prepares only a source-drift notification draft and contains six source-missing findings', () => {
    const draft = ql277PrepareNotification('icamp', new Date('2026-10-31T01:56:00Z'));
    expect(draft).toMatchObject({ source:'icamp', state:'DRAFT_NOT_SENT',
      previousSha:'219251ee433d745a236ac19c682a3a453db72463', currentSha:'883ee518e805253f45c316ce380ba13723182ff3' });
    const packet = ql277ReviewPacket([],[],[draft],'2026-10-31T01:56:00Z');
    expect(packet).toContain('Actual notification dispatch: NONE');
    expect(packet).toContain('Owner TEST authorization: NOT GIVEN');
    expect(packet).toContain('6/6 new main SHAs');
    expect(() => ql277PrepareNotification('invalid' as never,new Date())).toThrow('UNKNOWN_DRIFT_SOURCE');
  });

  it('mounts accessible baseline/recheck controls and records local-only comparisons', async () => {
    await openReview();
    expect(host.querySelector('[data-ql277-review]')).not.toBeNull();
    expect(host.textContent).toContain('Baseline → owner recheck');
    await act(async () => input('#ql277-observation','The keyboard focus outline was missing on two controls.'));
    await act(async () => button('Record baseline').click());
    expect(host.textContent).toContain('Local baseline: keyboard');
    await act(async () => select('#ql277-outcome','observed'));
    await act(async () => input('#ql277-observation','The keyboard focus outline appeared on both controls.'));
    await act(async () => button('Record later recheck').click());
    expect(host.querySelectorAll('.ql277-results article')).toHaveLength(1);
    expect(host.textContent).toContain('Independent owner/device acceptance remains NOT RECORDED');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
    expect(localStorage.length).toBe(0);
  });

  it('queues formatted reference claims with no original signed receipt or dispatch', async () => {
    await openReview(); await act(async () => button('02 Custodian reference queue').click());
    await act(async () => select('#ql277-source','devilndove'));
    await act(async () => input('#ql277-reference','CUST-277-REF'));
    await act(async () => button('Add format-check queue entry').click());
    expect(host.textContent).toContain('FORMAT VALID ONLY');
    expect(host.textContent).toContain('CUSTODY UNVERIFIED');
    expect(host.querySelector<HTMLTextAreaElement>('#ql277-packet')?.value).toContain('CUST-277-REF');
    expect(localStorage.length).toBe(0);
  });

  it('displays six actual source drifts and drafts unsent source-maintainer notifications', async () => {
    await openReview(); await act(async () => button('03 Source drift notifications').click());
    expect(host.querySelectorAll('.ql277-source-row')).toHaveLength(6);
    const links = [...host.querySelectorAll<HTMLAnchorElement>('.ql277-source-row a')];
    expect(links).toHaveLength(6);
    expect(links.every(link=>link.href.includes('ref=') && link.rel.includes('noopener'))).toBe(true);
    await act(async () => select('#ql277-notify-source','ai-data-platform'));
    await act(async () => button('Prepare notification draft for').click());
    expect(host.textContent).toContain('DRAFT NOT SENT');
    expect(host.textContent).toContain('It has NOT been sent');
    expect(localStorage.length).toBe(0);
  });

  it('copies a read-only local report, handles clipboard denial and clears local state', async () => {
    await openReview();
    expect(host.querySelector<HTMLTextAreaElement>('#ql277-packet')?.readOnly).toBe(true);
    await act(async () => button('Copy local review packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async () => button('Copy local review packet').click());
    expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('DISCONNECTED / HOLD');
    await act(async () => button('Clear local review records').click());
    expect(host.textContent).toContain('All local QL-277 drafts cleared');
    expect(localStorage.length).toBe(0);
  });

  it('keeps responsive, visible focus, forced-colour and reduced-motion presentation', () => {
    const css = readFileSync('src/operator/ql277-drift-review.css','utf8');
    expect(css).toContain('max-width:610px');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
