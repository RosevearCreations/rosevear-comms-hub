// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { recordQl211Observation, type Ql211Ledger } from '../ql211OwnerTrial';
import { queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest,
  recordQl212Retest, type Ql212Ledger } from '../ql212RepairQueue';
import { QL213_REVIEW_CHECKS, startQl213Comparison, captureQl213After, setQl213Check,
  type Ql213Ledger } from '../ql213ReviewPreparation';
import { beginQl214Intake, draftQl214Intake, upsertQl214Gap, prepareQl214Handoff,
  type Ql214Ledger } from '../ql214ReviewIntake';
import { beginQl215Tracking, advanceQl215Cycle, type Ql215Ledger } from '../ql215FollowUpAudit';
import { beginQl216Replay, draftQl216Handoff, prepareQl216Handoff, type Ql216Ledger } from '../ql216EscalationHandoff';
import { QL217_RELEASE, ql217AgeBand, ql217CompanyReassessment, ql217CompanyReceipt,
  ql217Portfolio, beginQl217Reassessment, advanceQl217DecisionCycle, noteQl217EvidenceReassessment,
  prepareQl217Reassessment, type Ql217Ledger } from '../ql217OwnerReassessment';

type Company = 'rosiedazzlers' | 'devilndove' | 'icamp' | 'yw';
function fixture(company: Company) {
  const trial = recordQl211Observation({} as Ql211Ledger, company, 'inbox', {
    outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'Fictional inbox view inconsistency' });
  let repair = queueQl212Finding(trial, {} as Ql212Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Simulated message panel wrapping update');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {} as Ql213Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) review = setQl213Check(trial, repair, review, company, 'inbox',
    check.id, 'drafted_unverified', `Fictional checklist item ${check.id}`);
  let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox', 'fictional_security_reviewer',
    'Fictional reviewer intake, no actual evidence signoff');
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'actual_repair', priority: 'P0', followUp: 'FOLLOWUP_PLANNED',
    note: 'Fictional repair proof remains independently unverified' });
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'accessibility', priority: 'P3', followUp: 'REFERENCE_DRAFTED_UNVERIFIED',
    note: 'Fictional accessibility manual retest not completed' });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  let audit = beginQl215Tracking(trial, repair, review, intake, {} as Ql215Ledger, company, 'inbox');
  for (let i = 0; i < 3; i++) audit = advanceQl215Cycle(trial, repair, review, intake, audit, company, 'inbox');
  let handoff = beginQl216Replay(trial, repair, review, intake, audit, {} as Ql216Ledger, company, 'inbox');
  handoff = draftQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox',
    'INDEPENDENT_REVIEW_PACKET_DRAFT', 'Local fictional review packet awaiting actual human inspection');
  handoff = prepareQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox');
  return { trial, repair, review, intake, audit, handoff };
}

describe('QL-217 source-reconciled decision-aging and reassessment model', () => {
  it('has no invented evidence or owner signoff and keeps all four companies and twelve holds', () => {
    const model = ql217Portfolio({}, {}, {}, {}, {}, {}, {});
    expect(model.release).toBe(QL217_RELEASE);
    expect(model.companies).toHaveLength(4);
    expect(model).toMatchObject({ eligible: 0, tracking: 0, prepared: 0, stale: 0,
      allReleaseHoldsPreserved: true, livePilotReady: false, ownerApprovalCaptured: false,
      independentEvidenceVerified: false, providerConnected: false, externalWrites: 0,
      callsPlaced: 0, messagesSent: 0 });
    expect(model.prerequisites).toHaveLength(12);
    expect(model.prerequisites.every((item) => item.state === 'HELD_UNVERIFIED')).toBe(true);
    expect(beginQl217Reassessment({}, {}, {}, {}, {}, {}, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('applies P0/P1 three-cycle and P2/P3 five-cycle decision aging and per-gap review resets', () => {
    const { trial, repair, review, intake, audit, handoff } = fixture('rosiedazzlers');
    let ledger = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {}, 'rosiedazzlers', 'inbox');
    expect(ledger.rosiedazzlers?.inbox?.simulatedCycle).toBe(0);
    expect(ql217AgeBand('P1', 2, 0)).toBe('FOLLOWUP_WATCH');
    expect(ql217AgeBand('P1', 3, 0)).toBe('DECISION_REASSESSMENT_DUE');
    expect(ql217AgeBand('P3', 4, 0)).toBe('FOLLOWUP_WATCH');
    expect(ql217AgeBand('P3', 5, 0)).toBe('DECISION_REASSESSMENT_DUE');
    for (let index = 0; index < 3; index++) ledger = advanceQl217DecisionCycle(trial, repair, review, intake, audit, handoff, ledger, 'rosiedazzlers', 'inbox');
    const before = ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, 'rosiedazzlers');
    expect(before.decisionDue).toBe(1);
    expect(before.cases[0].gaps.find((gap) => gap.category === 'actual_repair')?.decisionAge).toBe('DECISION_REASSESSMENT_DUE');
    expect(before.cases[0].gaps.find((gap) => gap.category === 'accessibility')?.decisionAge).toBe('FOLLOWUP_WATCH');
    expect(noteQl217EvidenceReassessment(trial, repair, review, intake, audit, handoff, ledger,
      'rosiedazzlers', 'inbox', 'actual_repair', 'INDEPENDENT_RETEST_PLANNED', 'short')).toBe(ledger);
    ledger = noteQl217EvidenceReassessment(trial, repair, review, intake, audit, handoff, ledger,
      'rosiedazzlers', 'inbox', 'actual_repair', 'INDEPENDENT_RETEST_PLANNED', 'Fictional retest action remains unsent');
    const after = ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, 'rosiedazzlers');
    expect(after.decisionDue).toBe(0);
    expect(after.cases[0].gaps.find((gap) => gap.category === 'actual_repair')?.decisionAge).toBe('CURRENT_CYCLE');
    expect(after.cases[0].gaps.find((gap) => gap.category === 'accessibility')?.decisionAge).toBe('FOLLOWUP_WATCH');
    expect(prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, ledger,
      'rosiedazzlers', 'inbox')).toBe(ledger);
    for (let index = 0; index < 21; index++) ledger = advanceQl217DecisionCycle(trial, repair, review, intake, audit, handoff, ledger, 'rosiedazzlers', 'inbox');
    expect(ledger.rosiedazzlers?.inbox?.simulatedCycle).toBe(20);
    expect(advanceQl217DecisionCycle(trial, repair, review, intake, audit, handoff, ledger, 'rosiedazzlers', 'inbox')).toBe(ledger);
  });

  it('prepares a local reassessment only after all evidence gaps have unsent actions and redacts receipt', () => {
    const { trial, repair, review, intake, audit, handoff } = fixture('devilndove');
    let ledger = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {}, 'devilndove', 'inbox');
    ledger = noteQl217EvidenceReassessment(trial, repair, review, intake, audit, handoff, ledger,
      'devilndove', 'inbox', 'actual_repair', 'SOURCE_RECHECK_DRAFTED', 'Fictional source proof not accepted');
    expect(prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = noteQl217EvidenceReassessment(trial, repair, review, intake, audit, handoff, ledger,
      'devilndove', 'inbox', 'accessibility', 'COMPARISON_REPLAY_NOTED_UNVERIFIED', 'Invented accessibility replay evidence');
    ledger = prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, ledger, 'devilndove', 'inbox');
    expect(ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, 'devilndove'))
      .toMatchObject({ prepared: 1, tracking: 1, stale: 0, holdAudit: { allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(noteQl217EvidenceReassessment(trial, repair, review, intake, audit, handoff, ledger,
      'devilndove', 'inbox', 'actual_repair', 'SOURCE_RECHECK_DRAFTED', 'Cannot overwrite prepared draft')).toBe(ledger);
    const receipt = ql217CompanyReceipt(trial, repair, review, intake, audit, handoff, ledger, 'devilndove');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"independentEvidenceVerified": false');
    expect(receipt).not.toContain('Fictional source proof not accepted');
    expect(receipt).not.toContain('Invented accessibility replay evidence');
    expect(receipt).not.toContain(ledger.devilndove!.inbox!.handoffToken);
    expect(receipt).not.toContain('fictional_security_reviewer');
  });

  it('freezes changed upstream source, then requires a reset after a refreshed QL-216 packet', () => {
    const { trial, repair, review, intake, audit, handoff } = fixture('yw');
    let ledger = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {}, 'yw', 'inbox');
    const staleSource = recordQl211Observation(trial, 'yw', 'inbox', { note: 'new fictional observation' });
    expect(ql217CompanyReassessment(staleSource, repair, review, intake, audit, handoff, ledger, 'yw').cases[0].sourceStatus).toBe('UPSTREAM_STALE');
    expect(advanceQl217DecisionCycle(staleSource, repair, review, intake, audit, handoff, ledger, 'yw', 'inbox')).toBe(ledger);
    const withdrawn = recordQl211Observation(trial, 'yw', 'inbox', { outcome: 'not_run' });
    expect(ql217CompanyReassessment(withdrawn, repair, review, intake, audit, handoff, ledger, 'yw')).toMatchObject({ orphaned: 1, stale: 1 });
    const revisedPacket = { ...handoff, yw: { ...handoff.yw, inbox: { ...handoff.yw!.inbox!,
      note: 'A revised locally prepared fictional owner handoff note' } } };
    expect(ql217CompanyReassessment(trial, repair, review, intake, audit, revisedPacket, ledger, 'yw').cases[0].sourceStatus).toBe('HANDOFF_CHANGED');
    expect(noteQl217EvidenceReassessment(trial, repair, review, intake, audit, revisedPacket, ledger, 'yw', 'inbox',
      'actual_repair', 'SOURCE_RECHECK_DRAFTED', 'Invalidated reassessment cannot advance')).toBe(ledger);
    ledger = beginQl217Reassessment(trial, repair, review, intake, audit, revisedPacket, ledger, 'yw', 'inbox');
    expect(ledger.yw?.inbox?.simulatedCycle).toBe(0);
    expect(ql217CompanyReassessment(trial, repair, review, intake, audit, revisedPacket, ledger, 'yw').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
  });

  it("isolates current company decision cycles and never assumes another company's approval", () => {
    const a = fixture('icamp'), b = fixture('rosiedazzlers');
    const trial = { ...a.trial, ...b.trial }, repair = { ...a.repair, ...b.repair },
      review = { ...a.review, ...b.review }, intake = { ...a.intake, ...b.intake },
      audit = { ...a.audit, ...b.audit }, handoff = { ...a.handoff, ...b.handoff };
    let ledger = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {}, 'icamp', 'inbox');
    ledger = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, ledger, 'rosiedazzlers', 'inbox');
    ledger = advanceQl217DecisionCycle(trial, repair, review, intake, audit, handoff, ledger, 'icamp', 'inbox');
    expect(ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, 'icamp').cases[0].cycle).toBe(1);
    expect(ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, 'rosiedazzlers').cases[0].cycle).toBe(0);
    expect(ql217CompanyReassessment(trial, repair, review, intake, audit, handoff, ledger, 'yw').cases).toEqual([]);
    expect(ql217Portfolio(trial, repair, review, intake, audit, handoff, ledger)).toMatchObject({
      tracking: 2, allReleaseHoldsPreserved: true, ownerApprovalCaptured: false, externalWrites: 0 });
  });
});

let host: HTMLDivElement;
let root: Root;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />)); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((node) => node.textContent?.includes(label));
  if (!button) throw new Error(`Missing button: ${label}`);
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

describe('QL-217 integrated operator decision and evidence workflow', () => {
  it('starts empty for all four companies and exposes immutable holds, help and safe receipts', async () => {
    await click('Owner handoff & evidence reassessment', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql217-release="${QL217_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('No QL-211 observed finding exists');
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Reassessment help');
    expect(host.textContent).toContain('five');
    await click('Show PII-minimized reassessment receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only owner reassessment audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('Open fictional owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('walks QL-211→QL-217 without any actual dispatch, closure or independent approval', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'Invented inbox source needs human reassessment');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('Run safe replay check');
    await type('#ql212-repair-note', 'Fictional corrected layout for source-linked review');
    await click('Request manual retest');
    await click('Pass observed · unverified');
    await click('Open QL-213 comparison & review prep');
    await click('Begin comparison with latest QL-212 replay');
    await click('Run a NEW QL-212 mock replay');
    await click('Run safe replay check');
    await click('Open QL-213 comparison & review prep');
    await click('Capture latest run as after');
    for (const check of QL213_REVIEW_CHECKS) {
      await type(`#ql213-note-${check.id}`, `Fictional independent evidence check ${check.id}`);
      const button = host.querySelector<HTMLTextAreaElement>(`#ql213-note-${check.id}`)!
        .closest('.ql213-check')!.querySelector<HTMLButtonElement>('button')!;
      await act(async () => button.click());
    }
    await click('Open QL-214 review intake & holds');
    await click('Begin fictional independent-review intake');
    await select('#ql214-reviewer', 'fictional_security_reviewer');
    await type('#ql214-brief', 'Invented independent evidence review needs follow-up');
    await select('#ql214-gap-followup', 'FOLLOWUP_PLANNED');
    await type('#ql214-gap-note', 'Actual repair verification is still unavailable');
    await click('Save gap or update category');
    await click('Prepare local handoff · NO DISPATCH');
    await click('Open QL-215 follow-up aging & hold audit');
    await click('Start simulated follow-up tracking');
    for (let i = 0; i < 3; i++) await click('Advance simulated review cycle (+1)');
    await click('Escalation replay & owner-safe handoff', '.ql172-nav-button');
    await click('Begin fictional escalation replay');
    await type('#ql216-note', 'Owner safe fictional packet awaiting human inspection');
    await click('Save fictional disposition · NO DISPATCH');
    await click('Prepare local handoff packet · NO DISPATCH');
    await click('Owner handoff & evidence reassessment', '.ql172-nav-button');
    expect(host.textContent).toContain('Start fictional owner reassessment');
    await click('Start fictional owner reassessment');
    for (let i = 0; i < 3; i++) await click('Advance simulated decision cycle (+1)');
    expect(host.textContent).toContain('Reassessment due · fictional interval');
    await select('#ql217-action', 'INDEPENDENT_RETEST_PLANNED');
    await type('#ql217-note', 'Invented independent retest request was never sent');
    await click('Save fictional evidence decision · NO DISPATCH');
    expect(host.textContent).toContain('Reviewed this fictional cycle');
    await click('Prepare local reassessment packet · NO DISPATCH');
    expect(host.textContent).toContain('Local evidence reassessment prepared');
    await click('Show PII-minimized reassessment receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only owner reassessment audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).not.toContain('Invented independent retest request');
    await click('iCamp', '.ql172-brand');
    expect(host.textContent).toContain('No QL-211 observed finding exists');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Local evidence reassessment prepared');
  });
});
