// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { Ql299AccessibilityReview } from '../Ql299AccessibilityReview';
import { ql299Checks, ql299Devices, ql299Key, ql299Summary, ql299Update, type Ql299Ledger } from '../ql299AccessibilityReview';
import { operatorOrganizations } from '../ql191Organizations';

describe('QL-299 accessible, company-isolated regression queue', () => {
  it('defines fifteen distinct device/check pairs with reproduction and expected outcomes', () => {
    expect(ql299Devices).toEqual(['desktop', 'tablet', 'mobile']);
    expect(ql299Checks).toHaveLength(5);
    expect(new Set(ql299Devices.flatMap((device) => ql299Checks.map((check) => ql299Key(device, check.id)))).size).toBe(15);
    expect(ql299Checks.every((check) => check.steps.length > 30 && check.expected.length > 30)).toBe(true);
  });

  for (const org of operatorOrganizations) {
    it(`${org.name} starts with zero fabricated observations and isolates all dispositions`, () => {
      const empty: Ql299Ledger = {};
      expect(ql299Summary(empty, org.id)).toEqual({ total: 15, unreviewed: 15, reproduced: 0, ownerRetest: 0, deferred: 0, ownerVerified: 0 });
      const marked = ql299Update(empty, org.id, 'mobile', 'focus', 'needs_owner_retest');
      expect(ql299Summary(marked, org.id).ownerRetest).toBe(1);
      expect(ql299Summary(marked, org.id).ownerVerified).toBe(0);
      for (const other of operatorOrganizations.filter((candidate) => candidate.id !== org.id)) expect(ql299Summary(marked, other.id).unreviewed).toBe(15);
      expect(ql299Summary(empty, org.id).unreviewed).toBe(15);
      expect(ql299Summary(ql299Update(marked, org.id, 'mobile', 'focus', 'unreviewed'), org.id).unreviewed).toBe(15);
    });
  }

  it('rejects malformed identifiers and dispositions', () => {
    expect(() => ql299Update({}, 'invalid' as never, 'desktop', 'focus', 'deferred')).toThrow();
    expect(() => ql299Update({}, 'icamp', 'console' as never, 'focus', 'deferred')).toThrow();
    expect(() => ql299Update({}, 'icamp', 'desktop', 'hidden' as never, 'deferred')).toThrow();
    expect(() => ql299Update({}, 'icamp', 'desktop', 'focus', 'accepted' as never)).toThrow();
  });

  it('supports keyboard-accessible device and disposition controls; reset does not claim sign-off', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const host = document.createElement('div'); document.body.append(host);
    const root: Root = createRoot(host);
    try {
      await act(async () => root.render(<Ql299AccessibilityReview organization={operatorOrganizations[0]} />));
      expect(host.textContent).toContain('OWNER EVIDENCE: NOT VERIFIED');
      expect(host.querySelectorAll('input[type="radio"]')).toHaveLength(3);
      expect(host.querySelectorAll('select')).toHaveLength(5);
      expect(host.textContent).toContain('15 of 15 checks not reviewed');
      const mobile = host.querySelectorAll<HTMLInputElement>('input[type="radio"]')[2];
      await act(async () => { mobile.click(); });
      expect(mobile.checked).toBe(true);
      expect(host.textContent).toContain('320–430px');
      const select = host.querySelector('select')!;
      await act(async () => { select.value = 'reproduced_locally'; select.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(host.textContent).toContain('14 of 15 checks not reviewed');
      expect(host.textContent).toContain('Verified owner findings: 0');
      await act(async () => { host.querySelector('footer button')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      expect(host.textContent).toContain('15 of 15 checks not reviewed');
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
});
