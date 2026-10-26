// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql220ReopenMonitor } from '../Ql220ReopenMonitor';
import { operatorOrganizations, type OrganizationId } from '../ql191Organizations';
import { recordQl211Observation } from '../ql211OwnerTrial';
import { queueQl212Finding, replayQl212Finding, writeQl212RepairNote, requestQl212Retest, recordQl212Retest } from '../ql212RepairQueue';
import { QL213_REVIEW_CHECKS, startQl213Comparison, captureQl213After, setQl213Check } from '../ql213ReviewPreparation';
import { beginQl214Intake, draftQl214Intake, upsertQl214Gap, prepareQl214Handoff } from '../ql214ReviewIntake';
import { beginQl215Tracking, advanceQl215Cycle } from '../ql215FollowUpAudit';
import { beginQl216Replay, draftQl216Handoff, prepareQl216Handoff } from '../ql216EscalationHandoff';
import { beginQl217Reassessment, noteQl217EvidenceReassessment, prepareQl217Reassessment } from '../ql217OwnerReassessment';
import { beginQl218Replay, recordQl218Replay, advanceQl218Cycle, prepareQl218HoldAudit } from '../ql218RecurrenceAudit';
import { QL219_REVIEW_CHECKS, beginQl219Reconciliation, recordQl219Outcome, acknowledgeQl219Check,
  prepareQl219Review, type Ql219Ledger } from '../ql219OutcomeReconciliation';
import { QL220_RELEASE, QL220_CHECKS, beginQl220Reopen, recordQl220Exception, advanceQl220Cycle,
  acknowledgeQl220Check, prepareQl220FollowUpAudit, ql220CompanyMonitoring, ql220CompanyReceipt,
  ql220Portfolio, type Ql220Sources, type Ql220Ledger } from '../ql220ReopenMonitoring';

function fixture(company: OrganizationId, recurring = false): Ql220Sources {
  const trial = recordQl211Observation({}, company, 'inbox', {
    outcome: 'observed_gap', severity: 'high', area: 'workflow', note: 'Fictional acceptance gap reported for preview testing' });
  let repair = queueQl212Finding(trial, {}, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Fictional layout repair for later replay');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {}, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) review = setQl213Check(trial, repair, review, company, 'inbox',
    check.id, 'drafted_unverified', `Fictional check ${check.id} still unverified`);
  let intake = beginQl214Intake(trial, repair, review, {}, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox',
    'fictional_security_reviewer', 'Synthetic reviewer request not transmitted');
  for (const category of ['actual_repair', 'accessibility'] as const) intake = upsertQl214Gap(trial, repair, review,
    intake, company, 'inbox', { category, priority: category === 'actual_repair' ? 'P0' : 'P3',
      followUp: 'FOLLOWUP_PLANNED', note: `Invented ${category} evidence is not verified` });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  let audit = beginQl215Tracking(trial, repair, review, intake, {}, company, 'inbox');
  for (let count = 0; count < 3; count++) audit = advanceQl215Cycle(trial, repair, review, intake, audit, company, 'inbox');
  let handoff = beginQl216Replay(trial, repair, review, intake, audit, {}, company, 'inbox');
  handoff = draftQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox',
    'INDEPENDENT_REVIEW_PACKET_DRAFT', 'Fictional owner handoff is never transmitted');
  handoff = prepareQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox');
  let reassessment = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reassessment = noteQl217EvidenceReassessment(
    trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox', category,
    'INDEPENDENT_RETEST_PLANNED', `Fictional reassessment of ${category} pending`);
  reassessment = prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox');
  const previous = { trial, repair, review, intake, audit, handoff, reassessment };
  let recurrence = beginQl218Replay(previous, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) recurrence = recordQl218Replay(previous,
    recurrence, company, 'inbox', category, 'OWNER_DECISION_REPLAY_DRAFT', 'HOLD_MONITOR_DRAFT',
    `Synthetic ${category} is still held`);
  if (recurring) {
    recurrence = advanceQl218Cycle(previous, recurrence, company, 'inbox');
    recurrence = recordQl218Replay(previous, recurrence, company, 'inbox', 'actual_repair',
      'INDEPENDENT_EXCEPTION_REVIEW_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT', 'Synthetic repeat issue still open');
  }
  recurrence = prepareQl218HoldAudit(previous, recurrence, company, 'inbox');
  const priorSources = { ...previous, recurrence };
  let closure: Ql219Ledger = beginQl219Reconciliation(priorSources, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) closure = recordQl219Outcome(priorSources,
    closure, company, 'inbox', category, 'OPEN_EXCEPTION_RECONFIRMED',
    recurring && category === 'actual_repair' ? 'INDEPENDENT_REVIEW_REQUIRED_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Fictional QL-219 outcome for ${category} remains open`);
  for (const check of QL219_REVIEW_CHECKS) closure = acknowledgeQl219Check(priorSources, closure, company, 'inbox', check.id);
  closure = prepareQl219Review(priorSources, closure, company, 'inbox');
  return { ...priorSources, closure };
}

describe('QL-220 source-linked local reopen and closure-exception audit', () => {
  it('starts with four isolated companies, no fictional approvals and twelve real release holds', () => {
    const empty: Ql220Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {} };
    const portfolio = ql220Portfolio(empty, {});
    expect(portfolio.companies.map((item) => item.company)).toEqual(operatorOrganizations.map((item) => item.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL220_RELEASE, eligible: 0, tracked: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentReopen: false,
      actualIndependentClosure: false, actualOwnerApproval: false,
      providerConnected: false, externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl220Reopen(empty, {}, 'icamp', 'inbox', 'Fictional reopen request')).toEqual({});
    expect(prepareQl220FollowUpAudit(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('requires prepared QL-219, complete classification, recurrence escalation and local checklist', () => {
    const sources = fixture('devilndove', true);
    expect(sources.closure.devilndove?.inbox?.phase).toBe('independent_review_packet_prepared');
    let ledger = beginQl220Reopen(sources, {}, 'devilndove', 'inbox', 'short');
    expect(ledger).toEqual({});
    ledger = beginQl220Reopen(sources, ledger, 'devilndove', 'inbox', 'Fictional reviewer exception remains unresolved');
    expect(ledger.devilndove?.inbox?.phase).toBe('reopen_monitoring_draft');
    expect(recordQl220Exception(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REOPEN_EXCEPTION_DRAFT', 'MAINTAIN_HOLD_DRAFT', 'short')).toBe(ledger);
    ledger = recordQl220Exception(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REOPEN_EXCEPTION_DRAFT', 'MAINTAIN_HOLD_DRAFT', 'Fictional exception remains held');
    ledger = recordQl220Exception(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'NO_NEW_EVIDENCE_UNVERIFIED', 'MAINTAIN_HOLD_DRAFT', 'Fictional accessibility evidence missing');
    for (const check of QL220_CHECKS) ledger = acknowledgeQl220Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql220CompanyMonitoring(sources, ledger, 'devilndove').escalationsDue).toBe(1);
    expect(prepareQl220FollowUpAudit(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl220Exception(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REOPEN_EXCEPTION_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT', 'Invented escalation not yet delivered');
    expect(ql220CompanyMonitoring(sources, ledger, 'devilndove')).toMatchObject({ escalationsDue: 0, overdue: 0, undecided: 0 });
    ledger = prepareQl220FollowUpAudit(sources, ledger, 'devilndove', 'inbox');
    expect(ql220CompanyMonitoring(sources, ledger, 'devilndove')).toMatchObject({ prepared: 1,
      holdAudit: { allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl220Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl220Exception(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REOPEN_EXCEPTION_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT', 'Cannot change prepared audit')).toBe(ledger);
    expect(ql220CompanyReceipt(sources, ledger, 'devilndove')).toContain('"actualIndependentClosure": false');
  });

  it('simulates overdue cycles, refreshes one gap at a time, and never sends notifications', () => {
    const sources = fixture('yw');
    let ledger = beginQl220Reopen(sources, {}, 'yw', 'inbox', 'Synthetic owner follow-up monitoring requested');
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl220Exception(sources, ledger,
      'yw', 'inbox', category, 'MONITOR_OPEN_HOLD_DRAFT', 'MAINTAIN_HOLD_DRAFT', `Fictional ${category} remains open`);
    for (let cycle = 0; cycle < 3; cycle++) ledger = advanceQl220Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql220CompanyMonitoring(sources, ledger, 'yw')).toMatchObject({ overdue: 2 });
    for (const check of QL220_CHECKS) ledger = acknowledgeQl220Check(sources, ledger, 'yw', 'inbox', check.id);
    expect(prepareQl220FollowUpAudit(sources, ledger, 'yw', 'inbox')).toBe(ledger);
    ledger = recordQl220Exception(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'REOPEN_EXCEPTION_DRAFT', 'MAINTAIN_HOLD_DRAFT', 'Invented follow-up refreshed without notice');
    expect(ql220CompanyMonitoring(sources, ledger, 'yw').overdue).toBe(1);
    ledger = recordQl220Exception(sources, ledger, 'yw', 'inbox', 'accessibility',
      'REOPEN_EXCEPTION_DRAFT', 'MAINTAIN_HOLD_DRAFT', 'Other invented follow-up refreshed');
    expect(ql220CompanyMonitoring(sources, ledger, 'yw').overdue).toBe(0);
    ledger = prepareQl220FollowUpAudit(sources, ledger, 'yw', 'inbox');
    expect(ql220Portfolio(sources, ledger)).toMatchObject({ prepared: 1, externalWrites: 0, messagesSent: 0 });
  });

  it('freezes changed and withdrawn upstream source, requires explicit case-only reset, and keeps companies separate', () => {
    const a = fixture('rosiedazzlers');
    const b = fixture('icamp');
    const combined = Object.fromEntries((Object.keys(a) as Array<keyof Ql220Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql220Sources;
    let ledger = beginQl220Reopen(combined, {}, 'rosiedazzlers', 'inbox', 'Fictional company-specific reopen one');
    ledger = beginQl220Reopen(combined, ledger, 'icamp', 'inbox', 'Fictional company-specific reopen two');
    const originalRosie = ledger.rosiedazzlers?.inbox;
    const changed: Ql220Sources = { ...combined, closure: { ...combined.closure,
      icamp: { ...combined.closure.icamp, inbox: { ...combined.closure.icamp?.inbox!, outcomes: {
        ...combined.closure.icamp?.inbox?.outcomes, actual_repair: {
          ...combined.closure.icamp?.inbox?.outcomes.actual_repair!, note: 'Changed fictional upstream evidence note' } } } } } };
    expect(ql220CompanyMonitoring(changed, ledger, 'icamp').cases[0].sourceStatus).toBe('CLOSURE_SOURCE_REVISED');
    expect(recordQl220Exception(changed, ledger, 'icamp', 'inbox', 'actual_repair',
      'REOPEN_EXCEPTION_DRAFT', 'MAINTAIN_HOLD_DRAFT', 'Should not modify frozen record')).toBe(ledger);
    ledger = beginQl220Reopen(changed, ledger, 'icamp', 'inbox', 'Explicit source reset after comparison');
    expect(ledger.rosiedazzlers?.inbox).toBe(originalRosie);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql220CompanyMonitoring(changed, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const withdrawn: Ql220Sources = { ...changed, trial: { ...changed.trial, icamp: {} } };
    expect(ql220CompanyMonitoring(withdrawn, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl220Reopen(withdrawn, ledger, 'icamp', 'inbox', 'Must not restart without source')).toBe(ledger);
  });

  it('redacts free-text reasons, gap notes, source tokens and identities from receipt', () => {
    const sources = fixture('icamp');
    let ledger = beginQl220Reopen(sources, {}, 'icamp', 'inbox', 'Private invented reason must never export');
    ledger = recordQl220Exception(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'REOPEN_EXCEPTION_DRAFT', 'MAINTAIN_HOLD_DRAFT', 'Private invented note must never export');
    const receipt = ql220CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"company": "icamp"');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Private invented');
    expect(receipt).not.toContain('synthetic-reopen-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

let root: Root;
let host: HTMLDivElement;
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((entry) => entry.textContent?.includes(label));
  if (!button) throw new Error(`Button missing: ${label}`);
  await act(async () => button.click());
}
async function type(selector: string, value: string) {
  const target = host.querySelector<HTMLTextAreaElement>(selector)!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(target, value);
    target.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function select(selector: string, value: string) {
  const target = host.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(target, value);
    target.dispatchEvent(new Event('change', { bubbles: true })); });
}

describe('QL-220 owner-safe operator interface', () => {
  it('appears in the four-company operator navigation and holds all real release gates', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Reopen exceptions & owner follow-up audit', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql220-release="${QL220_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Reopen audit help');
    expect(host.textContent).toContain('three cycles');
    await click('Show local QL-220 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-220 reopen audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql220-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('records simulated gap decisions and prepares only a local independent follow-up audit', async () => {
    const sources = fixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql220Ledger>({});
      return <Ql220ReopenMonitor organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await type('#ql220-reason', 'Fictional owner needs additional source review');
    await click('Start local reopen monitoring');
    await select('#ql220-step', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT');
    await type('#ql220-note', 'Invented gap exception must remain open');
    await click('Record local exception & unsent follow-up');
    await select('#ql220-gap', 'accessibility');
    await select('#ql220-step', 'MAINTAIN_HOLD_DRAFT');
    await type('#ql220-note', 'Invented accessibility source still unverified');
    await click('Record local exception & unsent follow-up');
    for (const check of QL220_CHECKS) await click('Acknowledge local audit · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((entry) => entry.textContent?.includes('Prepare owner follow-up exception audit'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare owner follow-up exception audit');
    expect(host.textContent).toContain('Local owner follow-up exception audit prepared');
    expect(host.textContent).toContain('release remains BLOCKED');
    await click('Show local QL-220 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-220 reopen audit receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Invented gap exception');
  });
});
