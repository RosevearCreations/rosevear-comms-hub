// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { recordQl211Observation, type Ql211Ledger } from '../ql211OwnerTrial';
import { queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest,
  recordQl212Retest, type Ql212Ledger } from '../ql212RepairQueue';
import { QL213_REVIEW_CHECKS, startQl213Comparison, captureQl213After, setQl213Check, type Ql213Ledger } from '../ql213ReviewPreparation';
import { beginQl214Intake, draftQl214Intake, upsertQl214Gap, prepareQl214Handoff, type Ql214Ledger } from '../ql214ReviewIntake';
import { beginQl215Tracking, advanceQl215Cycle, type Ql215Ledger } from '../ql215FollowUpAudit';
import { beginQl216Replay, draftQl216Handoff, prepareQl216Handoff, type Ql216Ledger } from '../ql216EscalationHandoff';
import { beginQl217Reassessment, noteQl217EvidenceReassessment, prepareQl217Reassessment,
  type Ql217Ledger } from '../ql217OwnerReassessment';
import { beginQl218Replay, recordQl218Replay, advanceQl218Cycle, prepareQl218HoldAudit,
  type Ql218Ledger } from '../ql218RecurrenceAudit';
import { QL219_RELEASE, QL219_REVIEW_CHECKS, beginQl219Reconciliation, recordQl219Outcome,
  acknowledgeQl219Check, prepareQl219Review, ql219CompanyReconciliation, ql219CompanyReceipt,
  ql219Portfolio, type Ql219Ledger, type Ql219Sources } from '../ql219OutcomeReconciliation';

type Company = 'rosiedazzlers' | 'devilndove' | 'icamp' | 'yw';
function fixture(company: Company, withRecurrence = false): Ql219Sources {
  const trial = recordQl211Observation({} as Ql211Ledger, company, 'inbox', {
    outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'Fictional owner complaint for acceptance review' });
  let repair = queueQl212Finding(trial, {} as Ql212Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Fictional repair layout comparison');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {} as Ql213Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) review = setQl213Check(trial, repair, review, company, 'inbox',
    check.id, 'drafted_unverified', `Fictional evidence check ${check.id}`);
  let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox', 'fictional_security_reviewer',
    'Fictional independent reviewer requested but not contacted');
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'actual_repair', priority: 'P0', followUp: 'FOLLOWUP_PLANNED', note: 'Simulated repair evidence still missing' });
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'accessibility', priority: 'P3', followUp: 'REFERENCE_DRAFTED_UNVERIFIED', note: 'Simulated accessibility evidence unverified' });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  let audit = beginQl215Tracking(trial, repair, review, intake, {} as Ql215Ledger, company, 'inbox');
  for (let i = 0; i < 3; i++) audit = advanceQl215Cycle(trial, repair, review, intake, audit, company, 'inbox');
  let handoff = beginQl216Replay(trial, repair, review, intake, audit, {} as Ql216Ledger, company, 'inbox');
  handoff = draftQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox',
    'INDEPENDENT_REVIEW_PACKET_DRAFT', 'Fictional owner handoff remains untransmitted');
  handoff = prepareQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox');
  let reassessment = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {} as Ql217Ledger, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reassessment = noteQl217EvidenceReassessment(
    trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox', category,
    'INDEPENDENT_RETEST_PLANNED', `Synthetic ${category} review evidence is unverified`);
  reassessment = prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox');
  const previous = { trial, repair, review, intake, audit, handoff, reassessment };
  let recurrence = beginQl218Replay(previous, {} as Ql218Ledger, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) recurrence = recordQl218Replay(previous, recurrence,
    company, 'inbox', category, 'OWNER_DECISION_REPLAY_DRAFT', 'HOLD_MONITOR_DRAFT', `Unsent invented ${category} decision replay`);
  if (withRecurrence) {
    recurrence = advanceQl218Cycle(previous, recurrence, company, 'inbox');
    recurrence = recordQl218Replay(previous, recurrence, company, 'inbox', 'actual_repair',
      'INDEPENDENT_EXCEPTION_REVIEW_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT', 'Fictional repeat exception remains open');
  }
  recurrence = prepareQl218HoldAudit(previous, recurrence, company, 'inbox');
  return { ...previous, recurrence };
}

describe('QL-219 outcome reconciliation and closure-readiness contract', () => {
  it('has four companies, no invented ready cases, and twelve immutable held release prerequisites', () => {
    const empty: Ql219Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {} };
    const portfolio = ql219Portfolio(empty, {});
    expect(portfolio.companies).toHaveLength(4);
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL219_RELEASE, eligible: 0, tracking: 0, prepared: 0,
      readyForHumanInspection: 0, recurrenceEscalationDue: 0, allReleaseHoldsPreserved: true,
      livePilotReady: false, actualIndependentClosure: false, actualOwnerApproval: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl219Reconciliation(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl219Review(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires every gap and three explicit checklist acknowledgments; independent closure always false', () => {
    const sources = fixture('devilndove');
    let ledger = beginQl219Reconciliation(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('outcome_reconciliation_draft');
    expect(recordQl219Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'OPEN_EXCEPTION_RECONFIRMED', 'MAINTAIN_HOLD_DRAFT', 'short')).toBe(ledger);
    ledger = recordQl219Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'OPEN_EXCEPTION_RECONFIRMED', 'MAINTAIN_HOLD_DRAFT', 'Fictional repair outcome is still open');
    expect(prepareQl219Review(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl219Outcome(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'FICTIONAL_COMPARISON_STABLE_UNVERIFIED', 'REQUEST_NEW_EVIDENCE_DRAFT',
      'Fictional stable comparison without actual human verification');
    expect(prepareQl219Review(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    for (const check of QL219_REVIEW_CHECKS) ledger = acknowledgeQl219Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql219CompanyReconciliation(sources, ledger, 'devilndove')).toMatchObject({
      readyForHumanInspection: 1, prepared: 0, holdAudit: { allHeld: true, conditionalRelease: 'BLOCKED' } });
    ledger = prepareQl219Review(sources, ledger, 'devilndove', 'inbox');
    expect(ql219CompanyReconciliation(sources, ledger, 'devilndove')).toMatchObject({ prepared: 1 });
    expect(recordQl219Outcome(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'OPEN_EXCEPTION_RECONFIRMED', 'MAINTAIN_HOLD_DRAFT', 'Cannot alter prepared packet')).toBe(ledger);
    expect(acknowledgeQl219Check(sources, ledger, 'devilndove', 'inbox', 'SOURCE_TRACE')).toBe(ledger);
    const receipt = ql219CompanyReceipt(sources, ledger, 'devilndove');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"actualIndependentClosure": false');
    expect(receipt).not.toContain('Fictional repair outcome');
    expect(receipt).not.toContain('Fictional stable comparison');
    expect(receipt).not.toContain(ledger.devilndove!.inbox!.sourceToken);
    expect(receipt).not.toContain('fictional_security_reviewer');
  });

  it('gates recurring exceptions on explicit future independent-review escalation', () => {
    const sources = fixture('rosiedazzlers', true);
    let ledger = beginQl219Reconciliation(sources, {}, 'rosiedazzlers', 'inbox');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl219Outcome(sources, ledger,
      'rosiedazzlers', 'inbox', category, 'SOURCE_EVIDENCE_STILL_MISSING', 'MAINTAIN_HOLD_DRAFT',
      `Simulated ${category} recurrence follow-up is unverified`);
    for (const check of QL219_REVIEW_CHECKS) ledger = acknowledgeQl219Check(sources, ledger, 'rosiedazzlers', 'inbox', check.id);
    expect(ql219CompanyReconciliation(sources, ledger, 'rosiedazzlers')).toMatchObject({
      recurrenceEscalationDue: 1, readyForHumanInspection: 0 });
    expect(prepareQl219Review(sources, ledger, 'rosiedazzlers', 'inbox')).toBe(ledger);
    ledger = recordQl219Outcome(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'SOURCE_EVIDENCE_STILL_MISSING', 'INDEPENDENT_REVIEW_REQUIRED_DRAFT', 'Human reviewer request remains an unsent draft');
    expect(ql219CompanyReconciliation(sources, ledger, 'rosiedazzlers')).toMatchObject({
      recurrenceEscalationDue: 0, readyForHumanInspection: 1 });
    ledger = prepareQl219Review(sources, ledger, 'rosiedazzlers', 'inbox');
    expect(ql219CompanyReconciliation(sources, ledger, 'rosiedazzlers').cases[0]).toMatchObject({
      prepared: true, actualIndependentClosure: false, actualOwnerApproval: false, releaseHold: 'HELD_UNVERIFIED' });
  });

  it('freezes QL-218 revision and upstream staleness; explicit source reset drops only that case', () => {
    const sources = fixture('yw');
    let ledger = beginQl219Reconciliation(sources, {}, 'yw', 'inbox');
    ledger = recordQl219Outcome(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'OPEN_EXCEPTION_RECONFIRMED', 'MAINTAIN_HOLD_DRAFT', 'This fictional note is invalidated when evidence changes');
    const revision = { ...sources, recurrence: advanceQl218Cycle(sources, sources.recurrence, 'yw', 'inbox') };
    expect(ql219CompanyReconciliation(revision, ledger, 'yw').cases[0].sourceStatus).toBe('RECURRENCE_SOURCE_REVISED');
    expect(recordQl219Outcome(revision, ledger, 'yw', 'inbox', 'accessibility',
      'OPEN_EXCEPTION_RECONFIRMED', 'MAINTAIN_HOLD_DRAFT', 'Blocked while source is revised')).toBe(ledger);
    ledger = beginQl219Reconciliation(revision, ledger, 'yw', 'inbox');
    expect(ledger.yw?.inbox?.outcomes).toEqual({});
    expect(ql219CompanyReconciliation(revision, ledger, 'yw').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const stale = { ...sources, trial: recordQl211Observation(sources.trial, 'yw', 'inbox', { note: 'New upstream observation' }) };
    expect(ql219CompanyReconciliation(stale, ledger, 'yw').cases[0].sourceStatus).toBe('UPSTREAM_STALE');
    expect(beginQl219Reconciliation(stale, ledger, 'yw', 'inbox')).toBe(ledger);
    const removed = { ...sources, trial: recordQl211Observation(sources.trial, 'yw', 'inbox', { outcome: 'not_run' }) };
    expect(ql219CompanyReconciliation(removed, ledger, 'yw')).toMatchObject({ orphaned: 1, stale: 1 });
  });

  it('keeps four-company draft outcomes isolated and holds intact', () => {
    const a = fixture('icamp'), b = fixture('rosiedazzlers');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql219Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql219Sources;
    let ledger: Ql219Ledger = beginQl219Reconciliation(sources, {}, 'icamp', 'inbox');
    ledger = beginQl219Reconciliation(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl219Outcome(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'OPEN_EXCEPTION_RECONFIRMED', 'MAINTAIN_HOLD_DRAFT', 'Private invented campsite outcome');
    expect(ql219CompanyReconciliation(sources, ledger, 'icamp').cases[0].unresolvedOutcomes).toBe(1);
    expect(ql219CompanyReconciliation(sources, ledger, 'rosiedazzlers').cases[0].unresolvedOutcomes).toBe(2);
    expect(ql219CompanyReconciliation(sources, ledger, 'devilndove').cases).toEqual([]);
    expect(ql219Portfolio(sources, ledger)).toMatchObject({ tracking: 2, allReleaseHoldsPreserved: true,
      actualIndependentClosure: false, externalWrites: 0, messagesSent: 0 });
  });
});

let root: Root;
let host: HTMLDivElement;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(<OperatorShell />));
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((entry) => entry.textContent?.includes(label));
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

describe('QL-219 integrated operator closure-readiness screen', () => {
  it('starts empty, offers help, preserves twelve holds, and generates redacted status receipt', async () => {
    await click('Outcome reconciliation & closure readiness', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql219-release="${QL219_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    expect(host.textContent).toContain('No QL-211 fictional finding exists');
    await click('ⓘ Closure readiness help');
    expect(host.textContent).toContain('three local checklist items');
    await click('Show local closure-readiness receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-219 readiness receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql219-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('walks QL-211 through QL-219 without any real independent closure or release', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'Synthetic owner handoff needs careful outcome review');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('Run safe replay check');
    await type('#ql212-repair-note', 'Simulated layout correction for future testing');
    await click('Request manual retest');
    await click('Pass observed · unverified');
    await click('Open QL-213 comparison & review prep');
    await click('Begin comparison with latest QL-212 replay');
    await click('Run a NEW QL-212 mock replay');
    await click('Run safe replay check');
    await click('Open QL-213 comparison & review prep');
    await click('Capture latest run as after');
    for (const check of QL213_REVIEW_CHECKS) {
      await type(`#ql213-note-${check.id}`, `Fictional review checklist ${check.id}`);
      const button = host.querySelector<HTMLTextAreaElement>(`#ql213-note-${check.id}`)!
        .closest('.ql213-check')!.querySelector<HTMLButtonElement>('button')!;
      await act(async () => button.click());
    }
    await click('Open QL-214 review intake & holds');
    await click('Begin fictional independent-review intake');
    await select('#ql214-reviewer', 'fictional_security_reviewer');
    await type('#ql214-brief', 'Fictional reviewer intake still unverified');
    await select('#ql214-gap-followup', 'FOLLOWUP_PLANNED');
    await type('#ql214-gap-note', 'Independent verification evidence still missing');
    await click('Save gap or update category');
    await click('Prepare local handoff · NO DISPATCH');
    await click('Open QL-215 follow-up aging & hold audit');
    await click('Start simulated follow-up tracking');
    for (let i = 0; i < 3; i++) await click('Advance simulated review cycle (+1)');
    await click('Escalation replay & owner-safe handoff', '.ql172-nav-button');
    await click('Begin fictional escalation replay');
    await type('#ql216-note', 'Synthetic owner handoff not sent to anyone');
    await click('Save fictional disposition · NO DISPATCH');
    await click('Prepare local handoff packet · NO DISPATCH');
    await click('Owner handoff & evidence reassessment', '.ql172-nav-button');
    await click('Start fictional owner reassessment');
    await type('#ql217-note', 'Fictional independent evidence still pending');
    await click('Save fictional evidence decision · NO DISPATCH');
    await click('Prepare local reassessment packet · NO DISPATCH');
    await click('Recurrence replay & conditional holds', '.ql172-nav-button');
    await click('Begin fictional recurrence replay');
    await type('#ql218-note', 'Invented owner replay is not authorized');
    await click('Record fictional owner replay & hold follow-up · UNSENT');
    await click('Prepare local conditional hold audit · NO RELEASE');
    await click('Outcome reconciliation & closure readiness', '.ql172-nav-button');
    await click('Begin fictional outcome reconciliation');
    await type('#ql219-note', 'Fictional outcome review remains unverified');
    await click('Save fictional outcome & next step · NO DISPATCH');
    for (let i = 0; i < QL219_REVIEW_CHECKS.length; i++) await click('Acknowledge local review · UNVERIFIED');
    await click('Prepare independent-review readiness packet · NO CLOSURE');
    expect(host.textContent).toContain('Independent-review readiness packet locally prepared');
    await click('Show local closure-readiness receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-219 readiness receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).not.toContain('Fictional outcome review remains unverified');
    await click('iCamp', '.ql172-brand');
    expect(host.textContent).toContain('No QL-211 fictional finding exists');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Independent-review readiness packet locally prepared');
  });
});
