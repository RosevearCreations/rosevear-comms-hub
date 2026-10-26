// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { recordQl211Observation, type Ql211Ledger } from '../ql211OwnerTrial';
import { QL212_RELEASE, ql212Portfolio, ql212QueueForCompany, ql212CompanyReceipt,
  queueQl212Finding, replayQl212Finding, writeQl212RepairNote,
  requestQl212Retest, recordQl212Retest, type Ql212Ledger } from '../ql212RepairQueue';

describe('QL-212 safe repair queue source contract', () => {
  it('starts empty for all four companies and preserves 12 independent production holds', () => {
    const portfolio = ql212Portfolio({}, {});
    expect(portfolio.release).toBe(QL212_RELEASE);
    expect(portfolio.companies).toHaveLength(4);
    expect(portfolio.reportedFindings).toBe(0);
    expect(portfolio.queued).toBe(0);
    expect(portfolio.stale).toBe(0);
    expect(portfolio.companies.every((company) => company.items.length === 0)).toBe(true);
    expect(portfolio.heldPrerequisites).toHaveLength(12);
    expect(portfolio.heldPrerequisites.every((hold) => hold.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(portfolio).toMatchObject({ pilotReady: false, ownerApprovalCaptured: false,
      providerConnected: false, externallyClosed: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(queueQl212Finding({}, {}, 'rosiedazzlers', 'inbox')).toEqual({});
  });

  it('replays only fictional contract baselines and never equates a synthetic PASS with fixing an observed gap', () => {
    let trial: Ql211Ledger = {};
    trial = recordQl211Observation(trial, 'rosiedazzlers', 'inbox', {
      outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'fictional inbox list overlap'
    });
    trial = recordQl211Observation(trial, 'icamp', 'mobile', {
      outcome: 'blocked', area: 'accessibility', note: 'sample phone zoom test blocked'
    });
    let ledger: Ql212Ledger = {};
    ledger = queueQl212Finding(trial, ledger, 'rosiedazzlers', 'inbox');
    ledger = queueQl212Finding(trial, ledger, 'icamp', 'mobile');
    expect(ql212Portfolio(trial, ledger)).toMatchObject({ reportedFindings: 2, queued: 2, pilotReady: false });
    ledger = replayQl212Finding(trial, ledger, 'rosiedazzlers', 'inbox');
    ledger = replayQl212Finding(trial, ledger, 'icamp', 'mobile');
    expect(ledger.rosiedazzlers?.inbox?.replays[0]).toMatchObject({ sequence: 1,
      contractCheck: 'inbox', disposition: 'SYNTHETIC_CONTRACT_PASS' });
    expect(ledger.icamp?.mobile?.replays[0]).toMatchObject({ sequence: 1,
      contractCheck: null, disposition: 'MANUAL_REPLAY_REQUIRED' });
    expect(ql212QueueForCompany(trial, ledger, 'rosiedazzlers').items[0].finding.outcome).toBe('observed_gap');
    expect(ql212QueueForCompany(trial, ledger, 'icamp').items[0].finding.outcome).toBe('blocked');
    expect(ql212QueueForCompany(trial, ledger, 'devilndove').items).toEqual([]);
    for (let index = 0; index < 13; index += 1) {
      ledger = replayQl212Finding(trial, ledger, 'rosiedazzlers', 'inbox');
    }
    expect(ledger.rosiedazzlers?.inbox?.replays).toHaveLength(10);
    expect(ledger.rosiedazzlers?.inbox?.replays.at(-1)?.sequence).toBe(14);
    expect(ql212Portfolio(trial, ledger).ownerApprovalCaptured).toBe(false);
  });

  it('requires replay plus repair note before retest, holds every closure and invalidates source-changed drafts', () => {
    let trial = recordQl211Observation({} as Ql211Ledger, 'yw', 'isolation', {
      outcome: 'observed_gap', severity: 'critical', area: 'isolation', note: 'fabricated cross-tenant presentation'
    });
    let ledger = queueQl212Finding(trial, {} as Ql212Ledger, 'yw', 'isolation');
    const queued = ledger;
    expect(requestQl212Retest(trial, ledger, 'yw', 'isolation')).toBe(ledger);
    expect(recordQl212Retest(trial, ledger, 'yw', 'isolation', 'retest_pass_noted')).toBe(ledger);
    ledger = writeQl212RepairNote(trial, ledger, 'yw', 'isolation', 'Fix');
    expect(requestQl212Retest(trial, ledger, 'yw', 'isolation')).toBe(ledger);
    ledger = writeQl212RepairNote(trial, ledger, 'yw', 'isolation', 'Synthetic tenant boundary review drafted');
    expect(requestQl212Retest(trial, ledger, 'yw', 'isolation')).toBe(ledger);
    ledger = replayQl212Finding(trial, ledger, 'yw', 'isolation');
    ledger = requestQl212Retest(trial, ledger, 'yw', 'isolation');
    expect(ledger.yw?.isolation?.phase).toBe('retest_requested');
    ledger = recordQl212Retest(trial, ledger, 'yw', 'isolation', 'retest_pass_noted');
    expect(ledger.yw?.isolation?.phase).toBe('retest_pass_noted');
    expect(ql212QueueForCompany(trial, ledger, 'yw').pilotReady).toBe(false);
    expect(ql212QueueForCompany(trial, ledger, 'yw').independentlyClosed).toBe(false);
    expect(writeQl212RepairNote(trial, ledger, 'yw', 'isolation', 'new note')).toBe(ledger);
    const receipt = ql212CompanyReceipt(trial, ledger, 'yw');
    expect(receipt).not.toContain('Synthetic tenant boundary review drafted');
    expect(receipt).not.toContain('fabricated cross-tenant presentation');
    expect(receipt).toContain('"independentClosure": false');

    trial = recordQl211Observation(trial, 'yw', 'isolation', { note: 'updated fictional source' });
    expect(ql212QueueForCompany(trial, ledger, 'yw').stale).toBe(1);
    expect(replayQl212Finding(trial, ledger, 'yw', 'isolation')).toBe(ledger);
    expect(recordQl212Retest(trial, ledger, 'yw', 'isolation', 'retest_pass_noted')).toBe(ledger);
    ledger = queueQl212Finding(trial, ledger, 'yw', 'isolation');
    expect(ledger).not.toBe(queued);
    expect(ledger.yw?.isolation).toMatchObject({ phase: 'queued', repairNote: '', replays: [] });
    expect(ql212QueueForCompany(trial, ledger, 'yw').stale).toBe(0);
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
async function changeSelect(selector: string, value: string) {
  const input = host.querySelector<HTMLSelectElement>(selector);
  if (!input) throw new Error(`Missing select ${selector}`);
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function enterText(selector: string, value: string) {
  const input = host.querySelector<HTMLTextAreaElement>(selector);
  if (!input) throw new Error(`Missing textarea ${selector}`);
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true })); });
}

describe('QL-212 operator evidence queue workflow', () => {
  it('starts empty, accepts only a self-reported QL-211 finding, holds retest after a mock check and draft', async () => {
    await click('Finding replay & repair queue', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql212-release="${QL212_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('No gap or blocked manual trial has been recorded');
    expect(host.textContent).toContain('12 HELD');
    await click('ⓘ Queue help', '.ql212-header button');
    expect(host.textContent).toContain('Even a pass leaves the issue open');
    await click('Open QL-211 manual trial');
    await changeSelect('#ql211-outcome', 'observed_gap');
    await enterText('#ql211-note', 'mock thread filter problem');
    await click('Open QL-212 replay & repair queue');
    expect(host.textContent).toContain('Company-safe inbox');
    expect(host.textContent).toContain('Not queued');
    await click('Add to repair evidence queue');
    expect(host.textContent).toContain('Queued for repair planning');
    await click('Run safe replay check');
    expect(host.textContent).toContain('SYNTHETIC CONTRACT PASS');
    expect(host.textContent).toContain('Independent closure: HELD');
    await enterText('#ql212-repair-note', 'Draft mock inbox filter repair plan');
    await click('Request manual retest');
    expect(host.textContent).toContain('Retest requested');
    await click('Pass observed · unverified');
    expect(host.textContent).toContain('Retest pass noted · UNVERIFIED');
    expect(host.textContent).toContain('original QL-211 gap remains open');
    await click('Show PII-minimized queue receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only repair queue receipt"]')?.value ?? '';
    expect(receipt).toContain('"pilot": "HELD"');
    expect(receipt).toContain('"phase": "retest_pass_noted"');
    expect(receipt).not.toContain('Draft mock inbox filter repair plan');
    expect(receipt).not.toContain('mock thread filter problem');
  });

  it('does not reveal another company draft and requires a refresh after a source observation changes', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await changeSelect('#ql211-outcome', 'blocked');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('.ql212-queue')?.getAttribute('data-organization')).toBe('icamp');
    expect(host.textContent).toContain('No gap or blocked manual trial');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Queued for repair planning');
    await click('Review original QL-211 observation');
    await enterText('#ql211-note', 'updated demo concern');
    await click('Open QL-212 replay & repair queue');
    expect(host.textContent).toContain('Source observation changed');
    expect(host.querySelector('.ql212-stale button')).not.toBeNull();
    await click('Refresh stale draft');
    expect(host.textContent).toContain('Discard the previous local repair plan');
    await click('Confirm refresh');
    expect(host.textContent).toContain('Queued for repair planning');
    expect(host.textContent).not.toContain('Source observation changed');
  });
});
