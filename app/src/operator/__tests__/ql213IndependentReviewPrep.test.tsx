// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { recordQl211Observation, type Ql211Ledger } from '../ql211OwnerTrial';
import { queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest,
  recordQl212Retest, type Ql212Ledger } from '../ql212RepairQueue';
import { QL213_RELEASE, QL213_REVIEW_CHECKS, ql213Portfolio, ql213ReviewForCompany,
  startQl213Comparison, captureQl213After, setQl213Check, ql213CompanyReceipt, type Ql213Ledger } from '../ql213ReviewPreparation';

function makeRetest(company: 'rosiedazzlers' | 'devilndove' | 'icamp' | 'yw', id: 'inbox' | 'keyboard' | 'mobile',
  outcome: 'retest_pass_noted' | 'retest_fail_noted' | 'retest_blocked' = 'retest_pass_noted') {
  const trial = recordQl211Observation({} as Ql211Ledger, company, id, {
    outcome: 'observed_gap', severity: 'high', area: 'accessibility', note: 'fictional focus and layout concern' });
  let repair = queueQl212Finding(trial, {} as Ql212Ledger, company, id);
  repair = replayQl212Finding(trial, repair, company, id);
  repair = writeQl212RepairNote(trial, repair, company, id, 'Draft fictional keyboard focus layout fix');
  repair = requestQl212Retest(trial, repair, company, id);
  repair = recordQl212Retest(trial, repair, company, id, outcome);
  return { trial, repair };
}

describe('QL-213 independent review preparation contract', () => {
  it('starts with zero manufactured gaps/approvals and all twelve real-pilot holds intact', () => {
    const portfolio = ql213Portfolio({}, {}, {});
    expect(portfolio.release).toBe(QL213_RELEASE);
    expect(portfolio.companies).toHaveLength(4);
    expect(portfolio).toMatchObject({ findings: 0, drafted: 0, stale: 0,
      ownerApproved: false, independentApproval: false, pilotReady: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(portfolio.heldPrerequisites).toHaveLength(12);
    expect(portfolio.heldPrerequisites.every((entry) => entry.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(startQl213Comparison({}, {}, {}, 'icamp', 'mobile')).toEqual({});
  });

  it('requires a reported gap, a queued replay and a human-noted QL-212 retest before creating a comparison', () => {
    const { trial, repair } = makeRetest('rosiedazzlers', 'inbox');
    let comparison: Ql213Ledger = startQl213Comparison(trial, repair, {}, 'rosiedazzlers', 'inbox');
    const draft = comparison.rosiedazzlers?.inbox;
    expect(draft?.before).toMatchObject({ sequence: 1, disposition: 'SYNTHETIC_CONTRACT_PASS' });
    expect(draft?.after).toBeNull();
    expect(captureQl213After(trial, repair, comparison, 'rosiedazzlers', 'inbox')).toBe(comparison);
    expect(ql213ReviewForCompany(trial, repair, comparison, 'rosiedazzlers').items[0].readiness).toBe('AFTER_REPLAY_REQUIRED');

    const afterRepair = replayQl212Finding(trial, repair, 'rosiedazzlers', 'inbox');
    comparison = captureQl213After(trial, afterRepair, comparison, 'rosiedazzlers', 'inbox');
    expect(comparison.rosiedazzlers?.inbox?.after).toMatchObject({ sequence: 2, disposition: 'SYNTHETIC_CONTRACT_PASS' });
    expect(ql213ReviewForCompany(trial, afterRepair, comparison, 'rosiedazzlers').items[0].comparison).toBe('UNCHANGED_SYNTHETIC');
    expect(captureQl213After(trial, afterRepair, comparison, 'rosiedazzlers', 'inbox')).toBe(comparison);
    for (const check of QL213_REVIEW_CHECKS) {
      comparison = setQl213Check(trial, afterRepair, comparison, 'rosiedazzlers', 'inbox', check.id,
        'drafted_unverified', `fictional evidence pointer for ${check.id}`);
    }
    const prepared = ql213ReviewForCompany(trial, afterRepair, comparison, 'rosiedazzlers');
    expect(prepared.items[0].readiness).toBe('PREPARED_FOR_REVIEW_UNVERIFIED');
    expect(prepared.preparedUnverified).toBe(1);
    expect(prepared).toMatchObject({ pilotReady: false, independentApproval: false });
    const receipt = ql213CompanyReceipt(trial, afterRepair, comparison, 'rosiedazzlers');
    expect(receipt).toContain('"independentApproval": false');
    expect(receipt).toContain('"pilot": "HELD"');
    expect(receipt).not.toContain('fictional evidence pointer');
    expect(receipt).not.toContain('fictional focus and layout concern');
    expect(receipt).not.toContain('Draft fictional keyboard');
    expect(receipt).not.toContain(draft!.sourceToken);
  });

  it('requires a meaningful local evidence note and prevents source changes from continuing a stale review', () => {
    const { trial, repair } = makeRetest('yw', 'mobile');
    let comparison = startQl213Comparison(trial, repair, {} as Ql213Ledger, 'yw', 'mobile');
    expect(setQl213Check(trial, repair, comparison, 'yw', 'mobile', 'manual', 'drafted_unverified', 'short')).toBe(comparison);
    expect(setQl213Check(trial, repair, comparison, 'yw', 'mobile', 'invalid' as 'manual', 'drafted_unverified', 'fictional evidence')).toBe(comparison);
    comparison = setQl213Check(trial, repair, comparison, 'yw', 'mobile', 'manual', 'followup_needed', 'screen reader replay required');
    const newRepair = replayQl212Finding(trial, repair, 'yw', 'mobile');
    comparison = captureQl213After(trial, newRepair, comparison, 'yw', 'mobile');
    expect(ql213ReviewForCompany(trial, newRepair, comparison, 'yw').items[0].comparison).toBe('MANUAL_ONLY');
    const updatedTrial = recordQl211Observation(trial, 'yw', 'mobile', { note: 'changed fictional source observation' });
    expect(ql213ReviewForCompany(updatedTrial, newRepair, comparison, 'yw')).toMatchObject({ stale: 1 });
    expect(captureQl213After(updatedTrial, newRepair, comparison, 'yw', 'mobile')).toBe(comparison);
    expect(setQl213Check(updatedTrial, newRepair, comparison, 'yw', 'mobile', 'source', 'drafted_unverified', 'new fake review')).toBe(comparison);
    const refreshedRepair = queueQl212Finding(updatedTrial, newRepair, 'yw', 'mobile');
    expect(ql213ReviewForCompany(updatedTrial, refreshedRepair, comparison, 'yw').items[0].readiness).toBe('STALE_REPAIR_SOURCE');
    expect(startQl213Comparison(updatedTrial, refreshedRepair, comparison, 'yw', 'mobile')).toBe(comparison);
    const withdrawn = recordQl211Observation(trial, 'yw', 'mobile', { outcome: 'not_run' });
    expect(ql213ReviewForCompany(withdrawn, repair, comparison, 'yw')).toMatchObject({ orphanedDrafts: 1, stale: 1 });
  });

  it('holds failed/blocked retests and separates four company drafts', () => {
    const a = makeRetest('devilndove', 'inbox', 'retest_fail_noted');
    const b = makeRetest('icamp', 'keyboard', 'retest_blocked');
    const trial = { ...a.trial, ...b.trial };
    const repair = { ...a.repair, ...b.repair };
    let comparison = startQl213Comparison(trial, repair, {}, 'devilndove', 'inbox');
    comparison = startQl213Comparison(trial, repair, comparison, 'icamp', 'keyboard');
    const newRepair = replayQl212Finding(trial, replayQl212Finding(trial, repair, 'devilndove', 'inbox'), 'icamp', 'keyboard');
    comparison = captureQl213After(trial, newRepair, comparison, 'devilndove', 'inbox');
    comparison = captureQl213After(trial, newRepair, comparison, 'icamp', 'keyboard');
    expect(ql213ReviewForCompany(trial, newRepair, comparison, 'devilndove').items[0].readiness).toBe('RETEST_UNRESOLVED');
    expect(ql213ReviewForCompany(trial, newRepair, comparison, 'icamp').items[0].comparison).toBe('MANUAL_ONLY');
    expect(ql213ReviewForCompany(trial, newRepair, comparison, 'rosiedazzlers').items).toEqual([]);
    expect(ql213Portfolio(trial, newRepair, comparison)).toMatchObject({ drafted: 2, preparedUnverified: 0, pilotReady: false });
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(text: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((entry) => entry.textContent?.includes(text));
  if (!button) throw new Error(`Missing button ${text}`);
  await act(async () => button.click());
}
async function select(selector: string, value: string) {
  const target = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(target, value);
    target.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function type(selector: string, value: string) {
  const target = host.querySelector<HTMLTextAreaElement>(selector)!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(target, value);
    target.dispatchEvent(new Event('input', { bubbles: true })); });
}

describe('QL-213 in-application four-company retest/review experience', () => {
  it('guides QL-211 → QL-212 → QL-213 without asserting live release or approval', async () => {
    await click('Retest comparison & review prep', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql213-release="${QL213_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('No owner/operator-reported gaps');
    expect(host.textContent).toContain('HELD · 12');
    await click('ⓘ Comparison help');
    expect(host.textContent).toContain('Nothing can close a finding');
    await click('Open QL-211 trial');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'fictional search reset issue');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('Run safe replay check');
    await type('#ql212-repair-note', 'Draft fictional search reset patch');
    await click('Request manual retest');
    await click('Pass observed · unverified');
    await click('Open QL-213 comparison & review prep');
    await click('Begin comparison with latest QL-212 replay');
    expect(host.textContent).toContain('AWAITING NEW RUN');
    await click('Run a NEW QL-212 mock replay');
    await click('Run safe replay check');
    await click('Open QL-213 comparison & review prep');
    await click('Capture latest run as after');
    expect(host.textContent).toContain('UNCHANGED SYNTHETIC');
    await type('#ql213-note-source', 'Draft fictional source case cross-reference');
    await click('Save unverified draft', '.ql213-check button');
    expect(host.textContent).toContain('drafted unverified');
    await click('Show fixed-schema company receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only comparison review receipt"]')?.value ?? '';
    expect(receipt).toContain('"pilot": "HELD"');
    expect(receipt).toContain('"before": "SYNTHETIC_CONTRACT_PASS"');
    expect(receipt).toContain('"after": "SYNTHETIC_CONTRACT_PASS"');
    expect(receipt).not.toContain('Draft fictional source case cross-reference');
    expect(receipt).not.toContain('fictional search reset issue');
    await click('iCamp', '.ql172-brand');
    expect(host.textContent).toContain('No owner/operator-reported gaps');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('UNCHANGED SYNTHETIC');
  });
});
