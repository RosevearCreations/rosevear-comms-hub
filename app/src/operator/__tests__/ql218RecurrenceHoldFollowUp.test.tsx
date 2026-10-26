// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { recordQl211Observation, type Ql211Ledger } from '../ql211OwnerTrial';
import { queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest,
  recordQl212Retest, type Ql212Ledger } from '../ql212RepairQueue';
import { QL213_REVIEW_CHECKS, startQl213Comparison, captureQl213After, setQl213Check, type Ql213Ledger } from '../ql213ReviewPreparation';
import { beginQl214Intake, draftQl214Intake, upsertQl214Gap, prepareQl214Handoff, type Ql214Ledger } from '../ql214ReviewIntake';
import { beginQl215Tracking, advanceQl215Cycle, type Ql215Ledger } from '../ql215FollowUpAudit';
import { beginQl216Replay, draftQl216Handoff, prepareQl216Handoff, type Ql216Ledger } from '../ql216EscalationHandoff';
import { beginQl217Reassessment, noteQl217EvidenceReassessment, prepareQl217Reassessment,
  advanceQl217DecisionCycle, type Ql217Ledger } from '../ql217OwnerReassessment';
import { QL218_RELEASE, ql218CompanyAudit, ql218CompanyReceipt, ql218Portfolio,
  ql218AgeBand, beginQl218Replay, recordQl218Replay, advanceQl218Cycle, prepareQl218HoldAudit,
  type Ql218Sources, type Ql218Ledger } from '../ql218RecurrenceAudit';

type Company = 'rosiedazzlers' | 'devilndove' | 'icamp' | 'yw';
function fixture(company: Company): Ql218Sources {
  const trial = recordQl211Observation({} as Ql211Ledger, company, 'inbox', {
    outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'Invented preview inbox issue' });
  let repair = queueQl212Finding(trial, {} as Ql212Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Fictional repair to layout');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {} as Ql213Ledger, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) review = setQl213Check(trial, repair, review, company, 'inbox',
    check.id, 'drafted_unverified', `Fictional independent check ${check.id}`);
  let intake = beginQl214Intake(trial, repair, review, {} as Ql214Ledger, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox', 'fictional_security_reviewer', 'Fictional independent intake');
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'actual_repair', priority: 'P0', followUp: 'FOLLOWUP_PLANNED', note: 'Invented repair remains unverified' });
  intake = upsertQl214Gap(trial, repair, review, intake, company, 'inbox', {
    category: 'accessibility', priority: 'P3', followUp: 'REFERENCE_DRAFTED_UNVERIFIED', note: 'Invented accessibility evidence gap' });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  let audit = beginQl215Tracking(trial, repair, review, intake, {} as Ql215Ledger, company, 'inbox');
  for (let i = 0; i < 3; i++) audit = advanceQl215Cycle(trial, repair, review, intake, audit, company, 'inbox');
  let handoff = beginQl216Replay(trial, repair, review, intake, audit, {} as Ql216Ledger, company, 'inbox');
  handoff = draftQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox',
    'INDEPENDENT_REVIEW_PACKET_DRAFT', 'Fictional handoff review request untransmitted');
  handoff = prepareQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox');
  let reassessment = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {} as Ql217Ledger, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reassessment = noteQl217EvidenceReassessment(
    trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox', category,
    'INDEPENDENT_RETEST_PLANNED', `Invented ${category} retest still unverified`);
  reassessment = prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox');
  return { trial, repair, review, intake, audit, handoff, reassessment };
}

describe('QL-218 fictional recurrence and conditional hold model', () => {
  it('starts unverified and holds all 12 prerequisites across exactly four companies', () => {
    const empty: Ql218Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {}, handoff: {}, reassessment: {} };
    const model = ql218Portfolio(empty, {});
    expect(model).toMatchObject({ release: QL218_RELEASE, eligible: 0, tracking: 0, prepared: 0,
      recurrence: 0, followUpDue: 0, stale: 0, allReleaseHoldsPreserved: true,
      livePilotReady: false, independentReviewVerified: false, ownerDecisionCaptured: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(model.companies).toHaveLength(4);
    expect(model.prerequisites).toHaveLength(12);
    expect(beginQl218Replay(empty, {}, 'yw', 'inbox')).toEqual({});
  });

  it('blocks missing/unprepared input, counts recurrences once per subsequent cycle and ages due by priority', () => {
    const sources = fixture('rosiedazzlers');
    let ledger = beginQl218Replay(sources, {}, 'rosiedazzlers', 'inbox');
    expect(ledger.rosiedazzlers?.inbox?.cycle).toBe(0);
    expect(ql218AgeBand('P1', 1, 0)).toBe('WATCH');
    expect(ql218AgeBand('P1', 2, 0)).toBe('FOLLOWUP_DUE');
    expect(ql218AgeBand('P3', 3, 0)).toBe('WATCH');
    expect(ql218AgeBand('P3', 4, 0)).toBe('FOLLOWUP_DUE');
    expect(recordQl218Replay(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'OWNER_DECISION_REPLAY_DRAFT', 'HOLD_MONITOR_DRAFT', 'short')).toBe(ledger);
    ledger = recordQl218Replay(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'OWNER_DECISION_REPLAY_DRAFT', 'HOLD_MONITOR_DRAFT', 'Invented owner decision not authorized');
    expect(ql218CompanyAudit(sources, ledger, 'rosiedazzlers').cases[0].gaps[0].recurrenceCount).toBe(0);
    expect(recordQl218Replay(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'OWNER_DECISION_REPLAY_DRAFT', 'HOLD_MONITOR_DRAFT', 'No duplicate in the same fictional cycle')).toBe(ledger);
    ledger = advanceQl218Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = recordQl218Replay(sources, ledger, 'rosiedazzlers', 'inbox', 'actual_repair',
      'INDEPENDENT_EXCEPTION_REVIEW_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT', 'Another invented open exception');
    expect(ql218CompanyAudit(sources, ledger, 'rosiedazzlers')).toMatchObject({ recurrence: 1, tracking: 1, prepared: 0 });
    ledger = advanceQl218Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = advanceQl218Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    expect(ql218CompanyAudit(sources, ledger, 'rosiedazzlers').followUpDue).toBe(1);
    expect(prepareQl218HoldAudit(sources, ledger, 'rosiedazzlers', 'inbox')).toBe(ledger);
    for (let i = 0; i < 25; i++) ledger = advanceQl218Cycle(sources, ledger, 'rosiedazzlers', 'inbox');
    expect(ledger.rosiedazzlers?.inbox?.cycle).toBe(20);
    expect(advanceQl218Cycle(sources, ledger, 'rosiedazzlers', 'inbox')).toBe(ledger);
  });

  it('requires a current fictional follow-up on every gap before preparing, and redacts receipt text', () => {
    const sources = fixture('devilndove');
    let ledger = beginQl218Replay(sources, {}, 'devilndove', 'inbox');
    ledger = recordQl218Replay(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SOURCE_RECHECK_DRAFT', 'NEW_EVIDENCE_REQUEST_DRAFT', 'Invented secret note should never appear in receipt');
    expect(prepareQl218HoldAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl218Replay(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'INDEPENDENT_EXCEPTION_REVIEW_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT', 'Invented accessibility request stays local');
    ledger = prepareQl218HoldAudit(sources, ledger, 'devilndove', 'inbox');
    expect(ql218CompanyAudit(sources, ledger, 'devilndove')).toMatchObject({ prepared: 1, releaseAudit: { allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(recordQl218Replay(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'SOURCE_RECHECK_DRAFT', 'HOLD_MONITOR_DRAFT', 'Prepared audit cannot be modified')).toBe(ledger);
    const receipt = ql218CompanyReceipt(sources, ledger, 'devilndove');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"independentReviewVerified": false');
    expect(receipt).not.toContain('Invented secret note');
    expect(receipt).not.toContain('Invented accessibility request');
    expect(receipt).not.toContain(ledger.devilndove!.inbox!.sourceToken);
    expect(receipt).not.toContain('fictional_security_reviewer');
  });

  it('freezes changed QL-217 and upstream evidence, explicitly resets only the current company case', () => {
    const sources = fixture('yw');
    let ledger = beginQl218Replay(sources, {}, 'yw', 'inbox');
    const revised = { ...sources, reassessment: advanceQl217DecisionCycle(sources.trial, sources.repair,
      sources.review, sources.intake, sources.audit, sources.handoff, sources.reassessment, 'yw', 'inbox') };
    expect(ql218CompanyAudit(revised, ledger, 'yw').cases[0].sourceStatus).toBe('REASSESSMENT_CHANGED');
    expect(advanceQl218Cycle(revised, ledger, 'yw', 'inbox')).toBe(ledger);
    expect(recordQl218Replay(revised, ledger, 'yw', 'inbox', 'actual_repair',
      'SOURCE_RECHECK_DRAFT', 'HOLD_MONITOR_DRAFT', 'Should reject stale record')).toBe(ledger);
    ledger = beginQl218Replay(revised, ledger, 'yw', 'inbox');
    expect(ledger.yw?.inbox?.cycle).toBe(0);
    expect(ql218CompanyAudit(revised, ledger, 'yw').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const invalid = { ...sources, trial: recordQl211Observation(sources.trial, 'yw', 'inbox', { note: 'Changed original note' }) };
    expect(ql218CompanyAudit(invalid, ledger, 'yw').cases[0].sourceStatus).toBe('UPSTREAM_STALE');
    const withdrawn = { ...sources, trial: recordQl211Observation(sources.trial, 'yw', 'inbox', { outcome: 'not_run' }) };
    expect(ql218CompanyAudit(withdrawn, ledger, 'yw')).toMatchObject({ orphaned: 1, stale: 1 });
    expect(beginQl218Replay(invalid, ledger, 'yw', 'inbox')).toBe(ledger);
  });

  it('keeps four-company ledgers independent and never infers real owner acceptance', () => {
    const a = fixture('icamp'), b = fixture('rosiedazzlers');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql218Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql218Sources;
    let ledger: Ql218Ledger = beginQl218Replay(sources, {}, 'icamp', 'inbox');
    ledger = beginQl218Replay(sources, ledger, 'rosiedazzlers', 'inbox');
    ledger = advanceQl218Cycle(sources, ledger, 'icamp', 'inbox');
    expect(ql218CompanyAudit(sources, ledger, 'icamp').cases[0].cycle).toBe(1);
    expect(ql218CompanyAudit(sources, ledger, 'rosiedazzlers').cases[0].cycle).toBe(0);
    expect(ql218CompanyAudit(sources, ledger, 'devilndove').cases).toEqual([]);
    expect(ql218Portfolio(sources, ledger)).toMatchObject({ tracking: 2, allReleaseHoldsPreserved: true,
      ownerDecisionCaptured: false, externalWrites: 0, messagesSent: 0 });
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

describe('QL-218 operator navigation and safe conditional hold preview', () => {
  it('exposes the new workspace, shows four-company holds and a redacted no-data receipt', async () => {
    await click('Recurrence replay & conditional holds', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql218-release="${QL218_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    expect(host.textContent).toContain('No QL-211 fictional finding exists');
    await click('ⓘ Recurrence help');
    expect(host.textContent).toContain('same-cycle duplicate');
    await click('Show local recurrence receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-218 recurrence audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
    await click('Recurrence replay & conditional holds', '.ql172-nav-button');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql218-release]')).not.toBeNull();
  });

  it('replays a fully fictional QL-211→QL-218 owner scenario with no release or external dispatch', async () => {
    await click('Owner trial & gap triage', '.ql172-nav-button');
    await select('#ql211-outcome', 'observed_gap');
    await type('#ql211-note', 'Invented inbox source needs recurring evidence review');
    await click('Open QL-212 replay & repair queue');
    await click('Add to repair evidence queue');
    await click('Run safe replay check');
    await type('#ql212-repair-note', 'Synthetic layout correction requires manual review');
    await click('Request manual retest');
    await click('Pass observed · unverified');
    await click('Open QL-213 comparison & review prep');
    await click('Begin comparison with latest QL-212 replay');
    await click('Run a NEW QL-212 mock replay');
    await click('Run safe replay check');
    await click('Open QL-213 comparison & review prep');
    await click('Capture latest run as after');
    for (const check of QL213_REVIEW_CHECKS) {
      await type(`#ql213-note-${check.id}`, `Fictional independent review evidence check ${check.id}`);
      const button = host.querySelector<HTMLTextAreaElement>(`#ql213-note-${check.id}`)!
        .closest('.ql213-check')!.querySelector<HTMLButtonElement>('button')!;
      await act(async () => button.click());
    }
    await click('Open QL-214 review intake & holds');
    await click('Begin fictional independent-review intake');
    await select('#ql214-reviewer', 'fictional_security_reviewer');
    await type('#ql214-brief', 'Fictional review intake requires follow-up');
    await select('#ql214-gap-followup', 'FOLLOWUP_PLANNED');
    await type('#ql214-gap-note', 'Invented independent evidence never verified');
    await click('Save gap or update category');
    await click('Prepare local handoff · NO DISPATCH');
    await click('Open QL-215 follow-up aging & hold audit');
    await click('Start simulated follow-up tracking');
    for (let i = 0; i < 3; i++) await click('Advance simulated review cycle (+1)');
    await click('Escalation replay & owner-safe handoff', '.ql172-nav-button');
    await click('Begin fictional escalation replay');
    await type('#ql216-note', 'Fictional escalation handoff for later human review');
    await click('Save fictional disposition · NO DISPATCH');
    await click('Prepare local handoff packet · NO DISPATCH');
    await click('Owner handoff & evidence reassessment', '.ql172-nav-button');
    await click('Start fictional owner reassessment');
    await type('#ql217-note', 'Invented reassessment request was never sent');
    await click('Save fictional evidence decision · NO DISPATCH');
    await click('Prepare local reassessment packet · NO DISPATCH');
    await click('Recurrence replay & conditional holds', '.ql172-nav-button');
    expect(host.textContent).toContain('Begin fictional recurrence replay');
    await click('Begin fictional recurrence replay');
    await type('#ql218-note', 'Fictional first owner decision replay remains held');
    await click('Record fictional owner replay & hold follow-up · UNSENT');
    expect(host.textContent).toContain('Replay count:');
    await click('Advance fictional follow-up cycle (+1)');
    await type('#ql218-note', 'Fictional recurring exception requires another review');
    await click('Record fictional owner replay & hold follow-up · UNSENT');
    expect(host.textContent).toContain('Fictional recurrence count:');
    await click('Prepare local conditional hold audit · NO RELEASE');
    expect(host.textContent).toContain('Conditional hold follow-up locally prepared');
    expect(host.textContent).toContain('BLOCKED');
    await click('Show local recurrence receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-218 recurrence audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"recurrence": 1');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).not.toContain('Fictional recurring exception requires another review');
    await click('iCamp', '.ql172-brand');
    expect(host.textContent).toContain('No QL-211 fictional finding exists');
    await click('Rosie Dazzlers', '.ql172-brand');
    expect(host.textContent).toContain('Conditional hold follow-up locally prepared');
  });
});
