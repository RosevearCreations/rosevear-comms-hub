// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { Ql222OwnerDecisionAudit } from '../Ql222OwnerDecisionAudit';
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
import { QL220_CHECKS, beginQl220Reopen, recordQl220Exception, acknowledgeQl220Check,
  prepareQl220FollowUpAudit, type Ql220Ledger } from '../ql220ReopenMonitoring';
import { QL221_CHECKS, beginQl221Refresh, recordQl221Refresh, acknowledgeQl221Check,
  prepareQl221ContinuityAudit, type Ql221Ledger } from '../ql221EvidenceRefresh';
import { QL222_RELEASE, QL222_CHECKS, beginQl222Replay, recordQl222Decision, advanceQl222Cycle,
  acknowledgeQl222Check, prepareQl222HoldRecheck, ql222CompanyRecurrence, ql222CompanyReceipt,
  ql222Portfolio, type Ql222Sources, type Ql222Ledger } from '../ql222ExceptionRecurrence';

/** Real contract construction from the synthetic QL-211→QL-221 chain, never a live connector. */
function fixture(company: OrganizationId, recurring = false): Ql222Sources {
  const trial = recordQl211Observation({}, company, 'inbox', { outcome: 'observed_gap', severity: 'high',
    area: 'workflow', note: 'Fictional operator finding for follow-up comparison' });
  let repair = queueQl212Finding(trial, {}, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  repair = writeQl212RepairNote(trial, repair, company, 'inbox', 'Fictional repair result still unverified');
  repair = requestQl212Retest(trial, repair, company, 'inbox');
  repair = recordQl212Retest(trial, repair, company, 'inbox', 'retest_pass_noted');
  let review = startQl213Comparison(trial, repair, {}, company, 'inbox');
  repair = replayQl212Finding(trial, repair, company, 'inbox');
  review = captureQl213After(trial, repair, review, company, 'inbox');
  for (const check of QL213_REVIEW_CHECKS) review = setQl213Check(trial, repair, review,
    company, 'inbox', check.id, 'drafted_unverified', `Fictional check ${check.id}`);
  let intake = beginQl214Intake(trial, repair, review, {}, company, 'inbox');
  intake = draftQl214Intake(trial, repair, review, intake, company, 'inbox',
    'fictional_security_reviewer', 'No real reviewer contacted for synthetic intake');
  for (const category of ['actual_repair', 'accessibility'] as const) intake = upsertQl214Gap(trial, repair,
    review, intake, company, 'inbox', { category, priority: category === 'actual_repair' ? 'P0' : 'P3',
      followUp: 'FOLLOWUP_PLANNED', note: `Invented ${category} evidence remains open` });
  intake = prepareQl214Handoff(trial, repair, review, intake, company, 'inbox');
  let audit = beginQl215Tracking(trial, repair, review, intake, {}, company, 'inbox');
  for (let i = 0; i < 3; i++) audit = advanceQl215Cycle(trial, repair, review, intake, audit, company, 'inbox');
  let handoff = beginQl216Replay(trial, repair, review, intake, audit, {}, company, 'inbox');
  handoff = draftQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox',
    'INDEPENDENT_REVIEW_PACKET_DRAFT', 'Fictional handoff never transmitted');
  handoff = prepareQl216Handoff(trial, repair, review, intake, audit, handoff, company, 'inbox');
  let reassessment = beginQl217Reassessment(trial, repair, review, intake, audit, handoff, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) reassessment = noteQl217EvidenceReassessment(
    trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox', category,
    'INDEPENDENT_RETEST_PLANNED', `Invented ${category} evidence not independently verified`);
  reassessment = prepareQl217Reassessment(trial, repair, review, intake, audit, handoff, reassessment, company, 'inbox');
  const first = { trial, repair, review, intake, audit, handoff, reassessment };
  let recurrence = beginQl218Replay(first, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) recurrence = recordQl218Replay(first,
    recurrence, company, 'inbox', category, 'OWNER_DECISION_REPLAY_DRAFT', 'HOLD_MONITOR_DRAFT',
    `Invented ${category} owner replay not authorized`);
  if (recurring) {
    recurrence = advanceQl218Cycle(first, recurrence, company, 'inbox');
    recurrence = recordQl218Replay(first, recurrence, company, 'inbox', 'actual_repair',
      'INDEPENDENT_EXCEPTION_REVIEW_DRAFT', 'INDEPENDENT_REVIEW_ESCALATION_DRAFT',
      'Fictional repeated exception not closed');
  }
  recurrence = prepareQl218HoldAudit(first, recurrence, company, 'inbox');
  const beforeClosure = { ...first, recurrence };
  let closure: Ql219Ledger = beginQl219Reconciliation(beforeClosure, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) closure = recordQl219Outcome(beforeClosure,
    closure, company, 'inbox', category, 'OPEN_EXCEPTION_RECONFIRMED',
    recurring && category === 'actual_repair' ? 'INDEPENDENT_REVIEW_REQUIRED_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Fictional QL-219 ${category} review still unverified`);
  for (const check of QL219_REVIEW_CHECKS) closure = acknowledgeQl219Check(beforeClosure, closure, company, 'inbox', check.id);
  closure = prepareQl219Review(beforeClosure, closure, company, 'inbox');
  const beforeReopen = { ...beforeClosure, closure };
  let reopen: Ql220Ledger = beginQl220Reopen(beforeReopen, {}, company, 'inbox', 'Invented owner exception still unresolved');
  for (const category of ['actual_repair', 'accessibility'] as const) reopen = recordQl220Exception(beforeReopen,
    reopen, company, 'inbox', category, 'MONITOR_OPEN_HOLD_DRAFT',
    recurring && category === 'actual_repair' ? 'INDEPENDENT_REVIEW_ESCALATION_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Invented QL-220 ${category} follow-up remains open`);
  for (const check of QL220_CHECKS) reopen = acknowledgeQl220Check(beforeReopen, reopen, company, 'inbox', check.id);
  reopen = prepareQl220FollowUpAudit(beforeReopen, reopen, company, 'inbox');
  const beforeRefresh = { ...beforeReopen, reopen };
  let refresh: Ql221Ledger = beginQl221Refresh(beforeRefresh, {}, company, 'inbox');
  for (const category of ['actual_repair', 'accessibility'] as const) refresh = recordQl221Refresh(beforeRefresh,
    refresh, company, 'inbox', category, 'EVIDENCE_GAP_STILL_OPEN', 'QL220_LOCAL_REPLAY',
    recurring && category === 'actual_repair' ? 'INDEPENDENT_REVIEW_ESCALATION_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
    `Fictional QL-221 ${category} refresh not verified`);
  for (const check of QL221_CHECKS) refresh = acknowledgeQl221Check(beforeRefresh, refresh, company, 'inbox', check.id);
  refresh = prepareQl221ContinuityAudit(beforeRefresh, refresh, company, 'inbox');
  return { ...beforeRefresh, refresh };
}

describe('QL-222 fictional recurrence and independent hold recheck contract', () => {
  it('has four company boundaries and twelve immutable held release prerequisites', () => {
    const empty: Ql222Sources = { trial: {}, repair: {}, review: {}, intake: {}, audit: {},
      handoff: {}, reassessment: {}, recurrence: {}, closure: {}, reopen: {}, refresh: {} };
    const portfolio = ql222Portfolio(empty, {});
    expect(portfolio.companies.map((row) => row.company)).toEqual(operatorOrganizations.map((org) => org.id));
    expect(portfolio.prerequisites).toHaveLength(12);
    expect(portfolio).toMatchObject({ release: QL222_RELEASE, eligible: 0, prepared: 0,
      allReleaseHoldsPreserved: true, actualIndependentReview: false, actualOwnerDecision: false,
      actualClosure: false, livePilotReady: false, providerConnected: false,
      externalWrites: 0, callsPlaced: 0, messagesSent: 0 });
    expect(beginQl222Replay(empty, {}, 'icamp', 'inbox')).toEqual({});
    expect(prepareQl222HoldRecheck(empty, {}, 'icamp', 'inbox')).toEqual({});
  });

  it('gates prepared case on current QL-221, all decisions, repeat escalation and local unverified checks', () => {
    const sources = fixture('devilndove', true);
    expect(sources.refresh.devilndove?.inbox?.phase).toBe('release_hold_continuity_audit_prepared');
    let ledger = beginQl222Replay(sources, {}, 'devilndove', 'inbox');
    expect(ledger.devilndove?.inbox?.phase).toBe('owner_decision_replay_draft');
    expect(recordQl222Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REPEATED_AFTER_REFRESH', 'MAINTAIN_HOLD_DRAFT', 'short')).toBe(ledger);
    expect(recordQl222Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'INVALID' as never, 'MAINTAIN_HOLD_DRAFT', 'Invented invalid disposition')).toBe(ledger);
    ledger = recordQl222Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REPEATED_AFTER_REFRESH', 'MAINTAIN_HOLD_DRAFT', 'Invented repeat exception remains open');
    ledger = recordQl222Decision(sources, ledger, 'devilndove', 'inbox', 'accessibility',
      'RECONFIRMED_OPEN', 'MAINTAIN_HOLD_DRAFT', 'Invented accessibility issue remains held');
    for (const check of QL222_CHECKS) ledger = acknowledgeQl222Check(sources, ledger, 'devilndove', 'inbox', check.id);
    expect(ql222CompanyRecurrence(sources, ledger, 'devilndove').escalationsDue).toBe(1);
    expect(prepareQl222HoldRecheck(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    ledger = recordQl222Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'REPEATED_AFTER_REFRESH', 'ESCALATE_INDEPENDENT_DRAFT', 'Fictional independent escalation remains unsent');
    expect(ql222CompanyRecurrence(sources, ledger, 'devilndove')).toMatchObject({
      repeatEvents: 1, undecided: 0, escalationsDue: 0 });
    ledger = prepareQl222HoldRecheck(sources, ledger, 'devilndove', 'inbox');
    expect(ql222CompanyRecurrence(sources, ledger, 'devilndove')).toMatchObject({ prepared: 1,
      holdAudit: { held: 12, allHeld: true, conditionalRelease: 'BLOCKED' } });
    expect(advanceQl222Cycle(sources, ledger, 'devilndove', 'inbox')).toBe(ledger);
    expect(recordQl222Decision(sources, ledger, 'devilndove', 'inbox', 'actual_repair',
      'RECONFIRMED_OPEN', 'MAINTAIN_HOLD_DRAFT', 'Cannot edit prepared packet')).toBe(ledger);
  });

  it('counts a repeat only once per category and fictional cycle and handles overdue owner follow-up', () => {
    const sources = fixture('yw');
    let ledger = beginQl222Replay(sources, {}, 'yw', 'inbox');
    ledger = recordQl222Decision(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'REPEATED_AFTER_REFRESH', 'ESCALATE_INDEPENDENT_DRAFT', 'Fictional repair issue repeated');
    ledger = recordQl222Decision(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'REPEATED_AFTER_REFRESH', 'ESCALATE_INDEPENDENT_DRAFT', 'Revised invented repeat note same cycle');
    expect(ql222CompanyRecurrence(sources, ledger, 'yw').repeatEvents).toBe(1);
    ledger = recordQl222Decision(sources, ledger, 'yw', 'inbox', 'accessibility',
      'RECONFIRMED_OPEN', 'MAINTAIN_HOLD_DRAFT', 'Fictional accessibility follow-up still held');
    ledger = advanceQl222Cycle(sources, ledger, 'yw', 'inbox');
    ledger = recordQl222Decision(sources, ledger, 'yw', 'inbox', 'actual_repair',
      'REPEATED_AFTER_REFRESH', 'ESCALATE_INDEPENDENT_DRAFT', 'New invented cycle of repeat issue');
    expect(ql222CompanyRecurrence(sources, ledger, 'yw').repeatEvents).toBe(2);
    for (let i = 0; i < 3; i++) ledger = advanceQl222Cycle(sources, ledger, 'yw', 'inbox');
    expect(ql222CompanyRecurrence(sources, ledger, 'yw').overdue).toBe(2);
    for (const check of QL222_CHECKS) ledger = acknowledgeQl222Check(sources, ledger, 'yw', 'inbox', check.id);
    expect(prepareQl222HoldRecheck(sources, ledger, 'yw', 'inbox')).toBe(ledger);
    for (const category of ['actual_repair', 'accessibility'] as const) ledger = recordQl222Decision(sources, ledger,
      'yw', 'inbox', category, 'RECONFIRMED_OPEN',
      category === 'actual_repair' ? 'ESCALATE_INDEPENDENT_DRAFT' : 'MAINTAIN_HOLD_DRAFT',
      `Fictional ${category} owner decision refreshed`);
    expect(ql222CompanyRecurrence(sources, ledger, 'yw').overdue).toBe(0);
    ledger = prepareQl222HoldRecheck(sources, ledger, 'yw', 'inbox');
    expect(ql222Portfolio(sources, ledger)).toMatchObject({ prepared: 1, repeatEvents: 2, externalWrites: 0 });
  });

  it('freezes source revisions, protects other company state and never closes orphaned cases', () => {
    const a = fixture('rosiedazzlers');
    const b = fixture('icamp');
    const sources = Object.fromEntries((Object.keys(a) as Array<keyof Ql222Sources>).map((key) =>
      [key, { ...a[key], ...b[key] }])) as unknown as Ql222Sources;
    let ledger = beginQl222Replay(sources, {}, 'rosiedazzlers', 'inbox');
    ledger = beginQl222Replay(sources, ledger, 'icamp', 'inbox');
    const rosie = ledger.rosiedazzlers?.inbox;
    const changed: Ql222Sources = { ...sources, refresh: { ...sources.refresh, icamp: {
      ...sources.refresh.icamp, inbox: { ...sources.refresh.icamp?.inbox!, gapRefreshes: {
        ...sources.refresh.icamp?.inbox?.gapRefreshes, actual_repair: {
          ...sources.refresh.icamp?.inbox?.gapRefreshes.actual_repair!,
          note: 'Changed invented QL-221 evidence source note' } } } } } };
    expect(ql222CompanyRecurrence(changed, ledger, 'icamp').cases[0].sourceStatus).toBe('EVIDENCE_REFRESH_REVISED');
    expect(recordQl222Decision(changed, ledger, 'icamp', 'inbox', 'actual_repair',
      'RECONFIRMED_OPEN', 'MAINTAIN_HOLD_DRAFT', 'Cannot alter a stale source case')).toBe(ledger);
    ledger = beginQl222Replay(changed, ledger, 'icamp', 'inbox');
    expect(ledger.rosiedazzlers?.inbox).toBe(rosie);
    expect(ledger.icamp?.inbox?.gaps).toEqual({});
    expect(ql222CompanyRecurrence(changed, ledger, 'icamp').cases[0].sourceStatus).toBe('SOURCE_CURRENT');
    const removed: Ql222Sources = { ...changed, trial: { ...changed.trial, icamp: {} } };
    expect(ql222CompanyRecurrence(removed, ledger, 'icamp').stale).toBeGreaterThan(0);
    expect(beginQl222Replay(removed, ledger, 'icamp', 'inbox')).toBe(ledger);
  });

  it('exports fixed status only, omitting notes, source fingerprints and reviewer identities', () => {
    const sources = fixture('icamp');
    let ledger = beginQl222Replay(sources, {}, 'icamp', 'inbox');
    ledger = recordQl222Decision(sources, ledger, 'icamp', 'inbox', 'actual_repair',
      'SIMULATED_SOURCE_EXCEPTION', 'REQUEST_EVIDENCE_DRAFT',
      'Private fictional reviewer note must not appear in receipt');
    const receipt = ql222CompanyReceipt(sources, ledger, 'icamp');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    expect(receipt).toContain('"notesIncluded": false');
    expect(receipt).not.toContain('Private fictional reviewer note');
    expect(receipt).not.toContain('invented-recurrence-');
    expect(receipt).not.toContain('fictional_security_reviewer');
  });
});

let root: Root;
let host: HTMLDivElement;
beforeEach(async () => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
async function click(label: string, selector = 'button') {
  const button = [...host.querySelectorAll<HTMLButtonElement>(selector)].find((entry) => entry.textContent?.includes(label));
  if (!button) throw new Error(`Missing button: ${label}`);
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

describe('QL-222 four-company operator recurrence and owner follow-up interface', () => {
  it('shows held release register, local help and a redacted empty receipt', async () => {
    await act(async () => root.render(<OperatorShell />));
    await click('Exception recurrence & owner decisions', '.ql172-nav-button');
    expect(host.querySelector(`[data-ql222-release="${QL222_RELEASE}"]`)).not.toBeNull();
    expect(host.textContent).toContain('12/12 HELD');
    await click('ⓘ Recurrence audit help');
    expect(host.textContent).toContain('once per cycle');
    await click('Show local QL-222 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-222 recurrence and hold receipt"]')?.value ?? '';
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
    await click('iCamp', '.ql172-brand');
    expect(host.querySelector('[data-organization="icamp"][data-ql222-release]')).not.toBeNull();
    await click('Open owner trial');
    expect(host.querySelector('#ql211-title')).not.toBeNull();
  });

  it('prepares an unverified local independent hold packet without releasing live communication gates', async () => {
    const sources = fixture('rosiedazzlers', true);
    function Harness() {
      const [ledger, setLedger] = useState<Ql222Ledger>({});
      return <Ql222OwnerDecisionAudit organization={operatorOrganizations[0]} sources={sources}
        ledger={ledger} setLedger={setLedger} onNavigate={() => undefined} />;
    }
    await act(async () => root.render(<Harness />));
    await click('Begin fictional exception recurrence replay');
    await select('#ql222-recurrence', 'REPEATED_AFTER_REFRESH');
    await select('#ql222-decision', 'ESCALATE_INDEPENDENT_DRAFT');
    await type('#ql222-note', 'Fictional repeat event requires independent review');
    await click('Record fictional recurrence & owner follow-up · UNSENT');
    await select('#ql222-gap', 'accessibility');
    await select('#ql222-recurrence', 'RECONFIRMED_OPEN');
    await select('#ql222-decision', 'MAINTAIN_HOLD_DRAFT');
    await type('#ql222-note', 'Invented accessibility owner follow-up still held');
    await click('Record fictional recurrence & owner follow-up · UNSENT');
    for (const check of QL222_CHECKS) await click('Acknowledge hold recheck · UNVERIFIED');
    const prepare = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('Prepare owner-decision & independent hold packet'))!;
    expect(prepare.disabled).toBe(false);
    await click('Prepare owner-decision & independent hold packet');
    expect(host.textContent).toContain('packet prepared locally');
    await click('Show local QL-222 audit receipt');
    const receipt = host.querySelector<HTMLTextAreaElement>('[aria-label="Fixture-only QL-222 recurrence and hold receipt"]')?.value ?? '';
    expect(receipt).toContain('"prepared": 1');
    expect(receipt).not.toContain('Fictional repeat event');
    expect(receipt).toContain('"conditionalRelease": "BLOCKED"');
  });
});
