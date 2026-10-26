// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { recordQl211Observation, type Ql211Ledger } from '../ql211OwnerTrial';
import { queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest,
  recordQl212Retest, type Ql212Ledger } from '../ql212RepairQueue';
import { QL213_REVIEW_CHECKS, startQl213Comparison, captureQl213After,
  setQl213Check, type Ql213Ledger } from '../ql213ReviewPreparation';
import { beginQl214Intake, draftQl214Intake, upsertQl214Gap,
  prepareQl214Handoff, type Ql214Ledger } from '../ql214ReviewIntake';
import { QL215_RELEASE, ql215AgeBand, ql215CompanyAudit, ql215Portfolio, ql215CompanyReceipt,
  beginQl215Tracking, advanceQl215Cycle, noteQl215FollowUp, type Ql215Ledger } from '../ql215FollowUpAudit';

function withHandoff(company: 'rosiedazzlers' | 'devilndove' | 'icamp' | 'yw', priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P1') {
  const trial = recordQl211Observation({} as Ql211Ledger, company, 'inbox', {
    outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'fictional conversation display issue' });
  let repair = queueQl212Finding(trial, {} as Ql212Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Simulated responsive conversation layout repair');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {} as Ql213Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) {
    review = setQl213Check(trial, repair, review, company, 'inbox', check.id,
      'drafted_unverified', `Fictional evidence review pointer ${check.id}`);
  }
  let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox', 'fictional_security_reviewer',
    'Preview-only case needs independent review out of band');
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'actual_repair', priority, followUp: 'FOLLOWUP_PLANNED', note: 'Source code repair proof not independently observed' });
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'accessibility', priority: 'P3', followUp: 'REFERENCE_DRAFTED_UNVERIFIED', note: 'Assistive technology review is still missing' });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  return { trial, repair, review, intake };
}

describe('QL-215 simulated aging and policy hold model', () => {
  it('begins empty for all four companies and leaves all twelve real-pilot prerequisites held', () => {
    const model = ql215Portfolio({}, {}, {}, {}, {});
    expect(model.release).toBe(QL215_RELEASE);
    expect(model.companies).toHaveLength(4);
    expect(model).toMatchObject({ tracked: 0, stale: 0, escalations: 0, allReleaseHoldsPreserved: true,
      livePilotReady: false, ownerApprovalCaptured: false, independentApproval: false, providerConnected: false,
      callsPlaced: 0, messagesSent: 0, externalWrites: 0 });
    expect(model.heldPrerequisites).toHaveLength(12);
    expect(model.heldPrerequisites.every((hold) => hold.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(beginQl215Tracking({}, {}, {}, {}, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('counts priority-based invented review cycles and resets only the followed-up category', () => {
    const { trial, repair, review, intake } = withHandoff('rosiedazzlers', 'P0');
    let tracking = beginQl215Tracking(trial, repair, review, intake, {} as Ql215Ledger, 'rosiedazzlers', 'inbox');
    expect(tracking.rosiedazzlers?.inbox?.simulatedCycle).toBe(0);
    expect(ql215CompanyAudit(trial, repair, review, intake, tracking, 'rosiedazzlers').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    for (let i = 0; i < 3; i += 1) tracking = advanceQl215Cycle(trial, repair, review, intake, tracking, 'rosiedazzlers', 'inbox');
    const before = ql215CompanyAudit(trial, repair, review, intake, tracking, 'rosiedazzlers');
    expect(before.escalations).toBe(1);
    expect(before.cases[0].gaps.find((g) => g.category === 'actual_repair')?.ageBand).toBe('ESCALATION_REVIEW_DUE');
    expect(before.cases[0].gaps.find((g) => g.category === 'accessibility')?.ageBand).toBe('WATCH_CYCLES');
    expect(noteQl215FollowUp(trial, repair, review, intake, tracking, 'rosiedazzlers', 'inbox',
      'actual_repair', 'ESCALATION_DRAFTED', 'short')).toBe(tracking);
    tracking = noteQl215FollowUp(trial, repair, review, intake, tracking, 'rosiedazzlers', 'inbox',
      'actual_repair', 'ESCALATION_DRAFTED', 'Fictional review escalation, not actually delivered');
    const after = ql215CompanyAudit(trial, repair, review, intake, tracking, 'rosiedazzlers');
    expect(after.cases[0].gaps.find((g) => g.category === 'actual_repair')?.ageBand).toBe('CURRENT_CYCLE');
    expect(after.cases[0].gaps.find((g) => g.category === 'accessibility')?.ageBand).toBe('WATCH_CYCLES');
    expect(after.cases[0].cycle).toBe(3);
    expect(after.escalations).toBe(0);
    for (let i = 0; i < 18; i += 1) tracking = advanceQl215Cycle(trial, repair, review, intake, tracking, 'rosiedazzlers', 'inbox');
    expect(tracking.rosiedazzlers?.inbox?.simulatedCycle).toBe(20);
    expect(advanceQl215Cycle(trial, repair, review, intake, tracking, 'rosiedazzlers', 'inbox')).toBe(tracking);
    expect(ql215AgeBand({ priority: 'P3' }, 5, 0)).toBe('ESCALATION_REVIEW_DUE');
    expect(ql215CompanyAudit(trial, repair, review, intake, tracking, 'rosiedazzlers').holdAudit.allHeld).toBe(true);
  });

  it('freezes a changed upstream source, counts a withdrawn case as stale, and never leaks free text to receipt', () => {
    const { trial, repair, review, intake } = withHandoff('yw');
    const tracking = beginQl215Tracking(trial, repair, review, intake, {} as Ql215Ledger, 'yw', 'inbox');
    const otherTrial = recordQl211Observation(trial, 'yw', 'inbox', { note: 'changed fictional observation' });
    expect(ql215CompanyAudit(otherTrial, repair, review, intake, tracking, 'yw').cases[0].sourceStatus).toBe('UPSTREAM_STALE');
    expect(advanceQl215Cycle(otherTrial, repair, review, intake, tracking, 'yw', 'inbox')).toBe(tracking);
    expect(noteQl215FollowUp(otherTrial, repair, review, intake, tracking, 'yw', 'inbox', 'actual_repair',
      'FOLLOWUP_DRAFTED', 'New note cannot advance stale source')).toBe(tracking);
    const withdrawn = recordQl211Observation(trial, 'yw', 'inbox', { outcome: 'not_run' });
    expect(ql215CompanyAudit(withdrawn, repair, review, intake, tracking, 'yw')).toMatchObject({ orphaned: 1, stale: 1 });
    const receipt = ql215CompanyReceipt(trial, repair, review, intake, tracking, 'yw');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"independentApproval": false');
    expect(receipt).not.toContain('Source code repair proof not independently observed');
    expect(receipt).not.toContain('Preview-only case needs');
    expect(receipt).not.toContain(tracking.yw!.inbox!.sourceToken);
    expect(JSON.parse(receipt).prerequisites).toHaveLength(12);
  });

  it('isolates iCamp and Devil n Dove follow-up cycles', () => {
    const a = withHandoff('icamp'), b = withHandoff('devilndove');
    const trial = { ...a.trial, ...b.trial }, repair = { ...a.repair, ...b.repair },
      review = { ...a.review, ...b.review }, intake = { ...a.intake, ...b.intake };
    let tracking = beginQl215Tracking(trial, repair, review, intake, {} as Ql215Ledger, 'icamp', 'inbox');
    tracking = beginQl215Tracking(trial, repair, review, intake, tracking, 'devilndove', 'inbox');
    tracking = advanceQl215Cycle(trial, repair, review, intake, tracking, 'icamp', 'inbox');
    expect(ql215CompanyAudit(trial, repair, review, intake, tracking, 'icamp').cases[0].cycle).toBe(1);
    expect(ql215CompanyAudit(trial, repair, review, intake, tracking, 'devilndove').cases[0].cycle).toBe(0);
    expect(ql215CompanyAudit(trial, repair, review, intake, tracking, 'rosiedazzlers').cases).toEqual([]);
    expect(ql215Portfolio(trial, repair, review, intake, tracking)).toMatchObject({ tracked: 2,
      livePilotReady: false, allReleaseHoldsPreserved: true, externalWrites: 0 });
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(label: string, selector = 'button') {
  const target = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((node) => node.textContent?.includes(label));
  if (!target) throw new Error(`Missing button ${label}`);
  await act(async () => target.click());
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

describe('QL-215 user-visible operator workflow', () => {
  it('displays a zero-case register and twelve unchangeable release holds in a fresh session', async () => {
    await click('Reviewer follow-up aging & hold audit', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql215-release="${QL215_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('No QL-211 reported gap exists');
    expect(host.textContent).toContain('12 HELD');
    expect(host.querySelectorAll('.ql215-scroll table tbody tr')).toHaveLength(16);
    await click('ⓘ Audit help');
    expect(host.textContent).toContain('invented review interval');
    await click('Show PII-minimized follow-up receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only follow-up audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"realOwnerAuthorization": false');
  });

  it('does not start tracking before the owner-controlled QL-214 local handoff', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'fictional inbox concern');
    await click('Reviewer follow-up aging & hold audit', '.ql172-nav-button');
    expect(host.textContent).toContain('Start QL-215 only after QL-214');
    expect(host.textContent).not.toContain('Start simulated follow-up tracking');
    await click('Return to QL-214 handoff');
    expect(host.textContent).toContain('An intake requires a current QL-213 packet');
  });

  it('runs an explicit fictional QL-211→QL-215 flow while holding actual closure and telecom', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'fictional inbox source inconsistency');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('Run safe replay check');
    await type('#ql212-repair-note', 'Fictional layout repair evidence proposal');
    await click('Request manual retest');
    await click('Pass observed · unverified');
    await click('Open QL-213 comparison & review prep');
    await click('Begin comparison with latest QL-212 replay');
    await click('Run a NEW QL-212 mock replay');
    await click('Run safe replay check');
    await click('Open QL-213 comparison & review prep');
    await click('Capture latest run as after');
    for (const check of QL213_REVIEW_CHECKS) {
      await type(`#ql213-note-${check.id}`, `Fictional checklist context for ${check.id}`);
      const button = host.querySelector<HTMLTextAreaElement>(`#ql213-note-${check.id}`)!
        .closest('.ql213-check')!.querySelector<HTMLButtonElement>('button')!;
      await act(async () => button.click());
    }
    await click('Open QL-214 review intake & holds');
    await click('Begin fictional independent-review intake');
    await select('#ql214-reviewer', 'fictional_security_reviewer');
    await type('#ql214-brief', 'Hypothetical independent case-review plan, not sent');
    await select('#ql214-gap-followup', 'FOLLOWUP_PLANNED');
    await type('#ql214-gap-note', 'Real repair evidence is still required before any release');
    await click('Save gap or update category');
    await click('Prepare local handoff · NO DISPATCH');
    await click('Open QL-215 follow-up aging & hold audit');
    expect(host.textContent).toContain('Start simulated follow-up tracking');
    await click('Start simulated follow-up tracking');
    for (let index = 0; index < 3; index += 1) await click('Advance simulated review cycle (+1)');
    expect(host.textContent).toContain('Escalation review due · fictional');
    await select('#ql215-action', 'ESCALATION_DRAFTED');
    await type('#ql215-note', 'Review escalation drafted solely in this browser session');
    await click('Save fictional follow-up · NO DISPATCH');
    expect(host.textContent).toContain('Current review cycle');
    expect(host.textContent).toContain('Still open · unverified');
    await click('Show PII-minimized follow-up receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only follow-up audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"simulatedCycle": 3');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).not.toContain('Review escalation drafted solely');
    await click('iCamp', '.ql172-brand');
    expect(host.textContent).toContain('No QL-211 reported gap exists');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Review cycle:');
  });
});
