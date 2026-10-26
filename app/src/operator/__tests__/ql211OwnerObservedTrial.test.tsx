// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { evaluateQl211Company, evaluateQl211Portfolio, observationFor, ql211CompanyReceipt,
  recordQl211Observation, scenariosForCompany, QL211_RELEASE, type Ql211Ledger } from '../ql211OwnerTrial';

describe('QL-211 owner trial source contracts', () => {
  it('starts with zero human observations and forty unobserved manual trials, independent of QL-210 synthetic success', () => {
    const portfolio = evaluateQl211Portfolio({});
    expect(portfolio.release).toBe(QL211_RELEASE);
    expect(portfolio.companies).toHaveLength(4);
    expect(portfolio.total).toBe(40);
    expect(portfolio.observed).toBe(0);
    expect(portfolio.notRun).toBe(40);
    expect(portfolio.gaps).toBe(0);
    expect(portfolio.ql210SyntheticPasses).toBe(40);
    expect(portfolio.heldPrerequisites).toHaveLength(12);
    expect(portfolio.heldPrerequisites.every((hold) => hold.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(portfolio).toMatchObject({ ownerApprovalCaptured: false, livePilotReady: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    for (const company of portfolio.companies) {
      expect(scenariosForCompany(company.organizationId)).toHaveLength(10);
      expect(company.notRun).toBe(10);
      expect(company.actualOwnerIdentityVerified).toBe(false);
      expect(company.livePilotReady).toBe(false);
    }
  });

  it('isolates operator-entered gaps per company, sorts triage, limits notes and leaves all pilot gates held', () => {
    let ledger: Ql211Ledger = {};
    ledger = recordQl211Observation(ledger, 'rosiedazzlers', 'mobile', {
      outcome: 'observed_gap', severity: 'critical', area: 'accessibility', note: 'x'.repeat(300)
    });
    ledger = recordQl211Observation(ledger, 'rosiedazzlers', 'keyboard', {
      outcome: 'observed_gap', severity: 'low', area: 'usability', note: 'sample keyboard issue'
    });
    ledger = recordQl211Observation(ledger, 'icamp', 'phone', {
      outcome: 'blocked', area: 'safety', note: 'fictional phone trial blocked'
    });
    expect(observationFor(ledger, 'rosiedazzlers', 'mobile').note).toHaveLength(240);
    expect(observationFor(ledger, 'devilndove', 'mobile').outcome).toBe('not_run');
    const rosie = evaluateQl211Company(ledger, 'rosiedazzlers');
    expect(rosie.findings.map((issue) => issue.priority)).toEqual(['P0', 'P3']);
    expect(rosie.notRun).toBe(8);
    expect(evaluateQl211Company(ledger, 'icamp').findings[0].priority).toBe('P1');
    expect(evaluateQl211Company(ledger, 'yw').findings).toEqual([]);
    expect(evaluateQl211Portfolio(ledger)).toMatchObject({ observed: 2, gaps: 3, notRun: 37,
      ownerApprovalCaptured: false, livePilotReady: false });
    const receipt = ql211CompanyReceipt(ledger, 'rosiedazzlers');
    expect(receipt).not.toContain('sample keyboard issue');
    expect(receipt).not.toContain('x'.repeat(20));
    expect(receipt).toContain('"pilot": "HELD"');
    expect(receipt).toContain('"noteTextIncluded": false');
    expect(recordQl211Observation(ledger, 'rosiedazzlers', 'unknown' as never, { outcome: 'observed_pass' })).toBe(ledger);
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
  if (!button) throw new Error(`Button missing: ${text}`);
  await act(async () => button.click());
}
async function changeSelect(selector: string, value: string) {
  const input = host.querySelector<HTMLSelectElement>(selector);
  if (!input) throw new Error(`Select missing: ${selector}`);
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function enterText(selector: string, value: string) {
  const input = host.querySelector<HTMLTextAreaElement>(selector);
  if (!input) throw new Error(`Textarea missing: ${selector}`);
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true })); });
}

describe('QL-211 live UI is manual self-report only', () => {
  it('records and prioritizes only an explicitly entered fictional gap, maintains company isolation and offers PII-minimized receipt', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql211-release="${QL211_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('Manual observations across four companies');
    expect(host.textContent).toContain('0/40');
    expect(host.textContent).toContain('HELD_UNVERIFIED');
    expect(host.querySelectorAll('.ql211-scenario')).toHaveLength(10);
    await click('ⓘ Trial help', '.ql211-header button');
    expect(host.textContent).toContain('your unverified preview note');
    await click('10. Small-screen and zoom review', '.ql211-scenario');
    await changeSelect('#ql211-outcome', 'observed_gap');
    await changeSelect('#ql211-severity', 'critical');
    await changeSelect('#ql211-area', 'accessibility');
    await enterText('#ql211-note', 'Synthetic mobile filter overlap');
    expect(host.textContent).toContain('P0 · Observed gap · accessibility');
    expect(host.textContent).toContain('1/40');
    expect(host.textContent).toContain('Synthetic mobile filter overlap');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('.ql211-trial')?.getAttribute('data-organization')).toBe('icamp');
    expect(host.querySelector('.ql211-triage')?.textContent).toContain('No gap or blocker');
    expect(host.textContent).not.toContain('Synthetic mobile filter overlap');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('P0 · Observed gap');
    await click('Show PII-minimized company receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only company trial receipt"]')?.value ?? '';
    expect(receipt).toContain('ql211-owner-observed');
    expect(receipt).not.toContain('Synthetic mobile filter overlap');
    expect(receipt).toContain('"pilot": "HELD"');
  });

  it('keeps workspace navigation and safely resets only the current company draft', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await changeSelect('#ql211-outcome', 'observed_pass');
    expect(host.textContent).toContain('1/40');
    await click('Open inbox workspace', '.ql211-open-workspace');
    expect(host.textContent).toContain('DISABLED SYNTHETIC INBOX');
    await click('Owner trial & gap triage', '.ql172-nav-button');
    expect((host.querySelector('#ql211-outcome') as HTMLSelectElement).value).toBe('observed_pass');
    await click('Reset this company', '.ql211-actions button');
    expect(host.textContent).toContain('Clear all ten local observation drafts');
    await click('Cancel', '.ql211-reset button');
    expect(host.textContent).toContain('1/40');
    await click('Reset this company', '.ql211-actions button');
    await click('Confirm reset for this company');
    expect(host.textContent).toContain('0/40');
    expect((host.querySelector('#ql211-outcome') as HTMLSelectElement).value).toBe('not_run');
    expect(host.querySelector('.ql211-trial button[type="submit"]')).toBeNull();
  });
});
